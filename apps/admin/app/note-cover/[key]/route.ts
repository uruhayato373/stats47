import { NOTE_ARTICLES } from '../../../../../.claude/scripts/note/catalog';
import { readCoverLedger, validateCoverLedger } from '../../../../../.claude/scripts/note/lib/cover-assets.mjs';
import { readStoredCover } from '../../../../../.claude/scripts/note/lib/cover-storage.mjs';
import { projectRoot } from '@/lib/server/project-root';

/** cover-storage.mjs の固定文 (認証情報を含まない) の形。ここに当たらない文は理由として返さない */
const SAFE_REASON =
  /^(?:private R2 [^\n]+|private cover (?:missing or SHA mismatch|storage unavailable|read HTTP \d{3})|Wrangler session expired or account access unavailable; run wrangler whoami|CLOUDFLARE_ACCOUNT_ID is required for multiple accounts|Windows trusted root certificates unavailable)$/;

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
    // 理由として画面へ返すのは cover-storage が投げる固定文の形だけ。下位ライブラリ (fetch・S3・fs) の例外は
    // URL や認証情報を含みうるので返さない。
    const message = error instanceof Error ? error.message : '';
    const reason = SAFE_REASON.test(message) ? message : 'ストレージの接続と台帳を確認してください。';
    return Response.json({ error: `画像を取得できません: ${reason}` }, { status: 502 });
  }
}
