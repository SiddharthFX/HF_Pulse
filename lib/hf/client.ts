import 'server-only';

import { HF_CACHE_TAG, REVALIDATE_SECONDS } from '@/lib/constants';
import type { FetchResult } from '@/types/hf';

const TIMEOUT_MS = 10_000;
const BACKOFF_MS = [400, 1200] as const;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function authHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'User-Agent': 'pluto-hf-pulse/1.0 (+personal-dashboard)',
  };
  // Server-side only. Raises rate limits; the app works fully without it.
  const token = process.env.HF_TOKEN?.trim();
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

/**
 * Low-level Hub fetch (§3.4).
 *
 * - 10s timeout per attempt
 * - retries twice on network error / 5xx / 429, backoff 400ms -> 1200ms
 * - NEVER retries other 4xx
 * - tagged 'hf' + 12h revalidate so POST /api/revalidate can bust it
 *
 * Returns a discriminated result; it does not throw.
 */
export async function hfFetch<T = unknown>(
  url: string,
): Promise<FetchResult<T>> {
  let lastError = 'Request failed';
  let lastStatus: number | null = null;
  let lastKind: 'rate_limit' | 'network' | 'http' | 'parse' = 'network';

  // 1 initial attempt + BACKOFF_MS.length retries.
  for (let attempt = 0; attempt <= BACKOFF_MS.length; attempt++) {
    try {
      const res = await fetch(url, {
        headers: authHeaders(),
        signal: AbortSignal.timeout(TIMEOUT_MS),
        next: { revalidate: REVALIDATE_SECONDS, tags: [HF_CACHE_TAG] },
      });

      if (res.ok) {
        try {
          const data = (await res.json()) as T;
          return { ok: true, data };
        } catch {
          return {
            ok: false,
            error: 'Received a malformed response from Hugging Face',
            kind: 'parse',
            status: res.status,
          };
        }
      }

      lastStatus = res.status;

      if (res.status === 429) {
        lastKind = 'rate_limit';
        lastError = 'Hugging Face rate limit reached';
      } else if (res.status >= 500) {
        lastKind = 'http';
        lastError = `Hugging Face returned ${res.status}`;
      } else {
        // Any other 4xx is terminal — retrying will not change the answer.
        return {
          ok: false,
          error:
            res.status === 401 || res.status === 403
              ? 'Not authorized to read this resource'
              : res.status === 404
                ? 'Resource not found on Hugging Face'
                : `Hugging Face returned ${res.status}`,
          kind: 'http',
          status: res.status,
        };
      }
    } catch (err) {
      lastKind = 'network';
      lastStatus = null;
      lastError =
        err instanceof Error && err.name === 'TimeoutError'
          ? 'Request to Hugging Face timed out'
          : 'Could not reach the Hugging Face API';
    }

    const backoff = BACKOFF_MS[attempt];
    if (backoff !== undefined) await sleep(backoff);
  }

  return { ok: false, error: lastError, kind: lastKind, status: lastStatus };
}

/** Builds a Hub URL with repeated expand[] params, in a stable order. */
export function buildHubUrl(
  path: string,
  params: { author: string; limit: number; expand: readonly string[] },
): string {
  const search = new URLSearchParams();
  search.set('author', params.author);
  search.set('limit', String(params.limit));
  // NOTE: expand[] must NOT be combined with full=true or files_metadata=true
  // — they are mutually exclusive and the request misbehaves (§3.1).
  for (const field of params.expand) search.append('expand[]', field);
  return `https://huggingface.co${path}?${search.toString()}`;
}
