import { templateSamplePng } from '@/lib/server/template-sample';
import { workspaceError } from '@/lib/server/workspace-request';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const png = await templateSamplePng(id);
    if (!png) return new Response('見本が見つかりません。', { status: 404 });
    return new Response(new Uint8Array(png), { headers: {
      'content-type': 'image/png',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
    } });
  } catch (error) {
    return workspaceError(error);
  }
}
