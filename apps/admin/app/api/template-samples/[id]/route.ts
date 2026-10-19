import { RANKING_BAR_SAMPLE_ID } from '@/lib/template-ranking-bars';
import { RANKING_TABLE_SAMPLE_ID } from '@/lib/template-ranking-table';
import { RANKING_TILE_MAP_SAMPLE_ID } from '@/lib/template-ranking-tile-map';
import { rankingSamplePng } from '@/lib/server/template-ranking-sample';
import { workspaceError } from '@/lib/server/workspace-request';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const SAMPLE_KINDS: Record<string, 'bars' | 'table' | 'tile-map'> = {
  [RANKING_BAR_SAMPLE_ID]: 'bars',
  [RANKING_TABLE_SAMPLE_ID]: 'table',
  [RANKING_TILE_MAP_SAMPLE_ID]: 'tile-map',
};
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!Object.hasOwn(SAMPLE_KINDS, id)) return new Response('見本が見つかりません。', { status: 404 });
  try {
    const png = await rankingSamplePng(SAMPLE_KINDS[id]);
    return new Response(new Uint8Array(png), { headers: {
      'content-type': 'image/png',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
    } });
  } catch (error) {
    return workspaceError(error);
  }
}
