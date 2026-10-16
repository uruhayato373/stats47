import {
  imageById,
  WorkspaceError,
} from '../../../../../../../.claude/scripts/media/lib/workspace.mjs';
import { readVerified } from '../../../../../../../.claude/scripts/media/lib/storage.mjs';
import { NOTE_ARTICLES } from '../../../../../../../.claude/scripts/note/catalog';
import { projectRoot } from '@/lib/server/project-root';
import { workspaceError } from '@/lib/server/workspace-request';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params,
      image = imageById(projectRoot(), id),
      name = new URL(req.url).searchParams.get('name');
    const file = image.inputFiles.find((f) => f.name === name),
      article = NOTE_ARTICLES.find((a) => image.owner === 'note/' + a.key);
    if (!file || !article || !image.original?.bucket)
      throw new WorkspaceError('入力が見つかりません。', 404);
    const bytes = await readVerified({
      ...file,
      bucket: image.original.bucket,
      key: article.r2Path + '/' + file.name,
    });
    return new Response(new Uint8Array(bytes), {
      headers: {
        'content-type': 'application/octet-stream',
        'content-disposition':
          "attachment; filename*=UTF-8''" +
          encodeURIComponent(file.name.split('/').pop()!),
        'cache-control': 'no-store',
        'x-content-type-options': 'nosniff',
      },
    });
  } catch (e) {
    return workspaceError(e);
  }
}
