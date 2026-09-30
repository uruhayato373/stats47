import fs from 'node:fs';
import { Readable } from 'node:stream';

import { publishedArticles } from '../../../../../.claude/scripts/note/catalog';
import { noteCoverDirectory } from '@/lib/server/note-covers';
import { resolveSafe } from '@/lib/server/safe-local-file';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** 監査用のローカル候補画像。公開済み記事の key のみ許可する。 */
export async function GET(_request: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  if (!publishedArticles().some((article) => article.key === key)) {
    return Response.json({ error: 'not found' }, { status: 404 });
  }
  const resolved = resolveSafe(noteCoverDirectory(), ['after', `${key}.png`]);
  if ('error' in resolved) return Response.json({ error: 'not found' }, { status: 404 });
  const size = fs.statSync(resolved.file).size;
  const stream = Readable.toWeb(fs.createReadStream(resolved.file)) as ReadableStream<Uint8Array>;
  return new Response(stream, {
    headers: {
      'content-type': 'image/png',
      'content-length': String(size),
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
    },
  });
}
