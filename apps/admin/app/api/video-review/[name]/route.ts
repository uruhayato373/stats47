import fs from 'node:fs';
import path from 'node:path';
import { Readable } from 'node:stream';
import { projectRoot } from '@/lib/server/project-root';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const HEADERS = { 'content-type': 'video/mp4', 'accept-ranges': 'bytes', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' };
const RANGE = /^bytes=(\d+)-(\d*)$/;
const stream = (file: string, start: number, end: number) => Readable.toWeb(fs.createReadStream(file, { start, end })) as ReadableStream;

/** One local review video from .local/video-review. The player seeks with range requests. */
export async function GET(req: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const file = path.join(projectRoot(), '.local/video-review', name);
  if (!/^[a-z0-9-]+\.mp4$/.test(name) || !fs.existsSync(file)) return new Response('見本が見つかりません。', { status: 404 });
  const { size } = fs.statSync(file);
  const range = RANGE.exec(req.headers.get('range') ?? '');
  if (!range) return new Response(stream(file, 0, size - 1), { headers: { ...HEADERS, 'content-length': String(size) } });
  const start = Number(range[1]), end = Math.min(range[2] ? Number(range[2]) : size - 1, size - 1);
  if (start > end) return new Response(null, { status: 416, headers: { 'content-range': `bytes */${size}` } });
  return new Response(stream(file, start, end), { status: 206, headers: { ...HEADERS, 'content-length': String(end - start + 1), 'content-range': `bytes ${start}-${end}/${size}` } });
}
