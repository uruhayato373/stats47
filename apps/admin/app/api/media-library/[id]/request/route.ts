import { regenerationRequest } from '@/lib/server/content-quality';
import { workspaceError } from '@/lib/server/workspace-request';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    return Response.json(regenerationRequest(id), {
      headers: {
        'cache-control': 'no-store',
        'content-disposition': 'attachment; filename="image-request.json"',
      },
    });
  } catch (e) {
    return workspaceError(e);
  }
}
