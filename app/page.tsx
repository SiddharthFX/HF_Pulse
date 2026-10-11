import { buildDashboardPayload } from '@/lib/hf/payload';
import { DashboardShell } from '@/components/DashboardShell';

/**
 * ISR: the page is regenerated at most once every 12 hours, so a reload serves
 * cached data until the window elapses. POST /api/revalidate busts it on demand.
 */
export const revalidate = 43200;

export default async function DashboardPage() {
  const payload = await buildDashboardPayload();
  return <DashboardShell payload={payload} />;
}
