import fs from 'node:fs';
import path from 'node:path';
import { projectRoot } from '@/lib/server/project-root';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** One local review image from .local/template-review (apps/admin/scripts/build-template-review.ts). */
export async function GET(_req: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const file = path.join(projectRoot(), '.local/template-review', name);
  if (!/^[a-z0-9-]+\.svg$/.test(name) || !fs.existsSync(file)) return new Response('見本が見つかりません。', { status: 404 });
  return new Response(fs.readFileSync(file), { headers: {
    'content-type': 'image/svg+xml',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
  } });
}
