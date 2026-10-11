import { NextResponse } from 'next/server';
import { buildDashboardPayload } from '@/lib/hf/payload';

/**
 * The same payload the page renders, as JSON. Read-only, no parameters —
 * the organization is a constant, not user input.
 *
 * The HF token never appears here: it is used only to sign the server-side
 * request inside lib/hf/client.ts and is not part of the payload.
 */
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const payload = await buildDashboardPayload();

  return NextResponse.json(payload, {
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}
