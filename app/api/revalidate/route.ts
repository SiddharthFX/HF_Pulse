import { revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';
import { HF_CACHE_TAG } from '@/lib/constants';

/**
 * Manual refresh (§3.5). Drops every fetch tagged 'hf' so the next render
 * goes back to the Hub. The topbar throttles callers to one per 30 seconds.
 *
 * POST-only: a GET would let a prefetch or a crawler bust the cache.
 */
export async function POST() {
  revalidateTag(HF_CACHE_TAG);
  return NextResponse.json({ revalidated: true, at: new Date().toISOString() });
}
