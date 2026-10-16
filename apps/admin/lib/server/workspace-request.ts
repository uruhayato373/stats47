import 'server-only';
import { WorkspaceError } from '../../../../.claude/scripts/media/lib/workspace.mjs';
import { errorResponse } from './http';
export function assertWorkspaceMutation(req: Request, json = true) {
  const url = new URL(req.url),
    host = req.headers.get('host') ?? url.host,
    origin = req.headers.get('origin');
  const origins = ['127.0.0.1', 'localhost', '[::1]'].map(
    (h) => url.protocol + '//' + h + (url.port ? ':' + url.port : '')
  );
  if (
    !origins.includes(origin ?? '') ||
    origin !== url.protocol + '//' + host ||
    req.headers.get('sec-fetch-site') === 'cross-site'
  )
    throw new WorkspaceError('管理画面と同じ接続元から保存してください。', 403);
  if (
    json &&
    req.headers.get('content-type')?.split(';')[0].trim() !== 'application/json'
  )
    throw new WorkspaceError('JSON形式が必要です。', 415);
}
export async function workspaceJson(req: Request) {
  assertWorkspaceMutation(req);
  const raw = await req.text();
  if (raw.length > 30000) throw new WorkspaceError('入力が長すぎます。', 413);
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    throw new WorkspaceError('JSON形式が不正です。');
  }
}
export function workspaceError(error: unknown) {
  return error instanceof WorkspaceError
    ? errorResponse(error.message, error.status)
    : errorResponse(
        '保存先または入力を確認してください。処理は完了していません。',
        502
      );
}
