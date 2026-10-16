import { contentBody, inventoryState } from '@/lib/server/content-quality';
import { jsonResponse } from '@/lib/server/http';
import { workspaceError } from '@/lib/server/workspace-request';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET(req: Request) {
  try {
    const owner = new URL(req.url).searchParams.get('owner') ?? '';
    return jsonResponse({
      ...(await contentBody(owner)),
      inventory: inventoryState(owner),
    });
  } catch (e) {
    return workspaceError(e);
  }
}
