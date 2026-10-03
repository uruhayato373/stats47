import { NOTE_ARTICLES } from '../../../../../.claude/scripts/note/catalog';
import { readCoverLedger, validateCoverLedger } from '../../../../../.claude/scripts/note/lib/cover-assets.mjs';
import { readStoredCover } from '../../../../../.claude/scripts/note/lib/cover-storage.mjs';
import { projectRoot } from '@/lib/server/project-root';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Read-only proxy for exact ledger-owned private revisions. No persistent image cache. */
export async function GET(request: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const id = new URL(request.url).searchParams.get('revision');
  if (!id || !/^[a-f0-9]{64}$/.test(id) || !NOTE_ARTICLES.some((a) => a.key === key))
    return Response.json({ error: 'not found' }, { status: 404 });
  try {
    const ledger = validateCoverLedger(readCoverLedger(projectRoot()), NOTE_ARTICLES);
    const revision = ledger.articles.find((a) => a.articleKey === key)?.revisions.find((r) => r.id === id);
    if (!revision) return Response.json({ error: 'not found' }, { status: 404 });
    const bytes = await readStoredCover(revision);
    return new Response(new Uint8Array(bytes), { headers: {
      'content-type': 'image/png', 'content-length': String(bytes.length),
      'cache-control': 'no-store', 'x-content-type-options': 'nosniff',
    } });
  } catch (error) {
    // cover-storage のエラー文は認証情報を含まない固定文なので、理由として画面へ返す。
    const reason = error instanceof Error ? error.message : String(error);
    return Response.json({ error: `画像を取得できません: ${reason}` }, { status: 502 });
  }
}
