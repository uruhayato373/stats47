import { importImage } from '@/lib/server/content-quality';
import { jsonResponse } from '@/lib/server/http';
import {
  assertWorkspaceMutation,
  workspaceError,
} from '@/lib/server/workspace-request';
import { WorkspaceError } from '../../../../../../../.claude/scripts/media/lib/workspace.mjs';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    assertWorkspaceMutation(req, false);
    if (!req.headers.get('content-type')?.startsWith('multipart/form-data'))
      throw new WorkspaceError('画像ファイルを指定してください。', 415);
    const length = Number(req.headers.get('content-length'));
    if (!Number.isFinite(length) || length <= 0 || length > 18 * 1024 * 1024)
      throw new WorkspaceError('アップロードは18MB以内です。', 413);
    const form = await req.formData(),
      file = form.get('file'),
      revision = form.get('revision'),
      raw = form.get('evidence');
    if (
      !(file instanceof File) ||
      typeof revision !== 'string' ||
      typeof raw !== 'string' ||
      raw.length > 50000
    )
      throw new WorkspaceError('画像・生成根拠を指定してください。');
    let supplied: unknown;
    try {
      supplied = JSON.parse(raw);
    } catch {
      throw new WorkspaceError('生成根拠はJSON形式で指定してください。');
    }
    if (!supplied || typeof supplied !== 'object' || Array.isArray(supplied))
      throw new WorkspaceError('生成根拠を入力してください。');
    const { id } = await params;
    return jsonResponse(await importImage(id, revision, file, supplied));
  } catch (e) {
    return workspaceError(e);
  }
}
