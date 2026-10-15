import { z } from 'zod';
import { errorResponse, jsonResponse } from '@/lib/server/http';
import { CoverEditError, saveCoverProduction } from '@/lib/server/note-cover-production';
import { noteCoverManagement } from '@/lib/server/note-covers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const sha = z.string().regex(/^[a-f0-9]{64}$/);
const bodySchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('brief'), revision: sha, brief: z.object({
    headline: z.string().trim().min(1).max(64), subline: z.string().trim().max(100),
    subject: z.string().trim().min(1).max(1000), evidence: z.string().trim().min(1).max(2000),
    dataScope: z.object({ place: z.string().trim().min(1).max(30), year: z.string().regex(/^[12][0-9]{3}$/), households: z.literal('二人以上の世帯') }).strict().optional(),
  }).strict() }).strict(),
  z.object({ action: z.literal('review'), revision: sha, candidateRevisionId: sha,
    status: z.enum(['pass', 'needs-revision']), reason: z.string().trim().min(1).max(2000) }).strict(),
]);

export async function PATCH(req: Request, context: { params: Promise<{ key: string }> }) {
  const url = new URL(req.url);
  // Next may normalize req.url to localhost; Host retains the browser's loopback address.
  const host = req.headers.get('host') ?? url.host;
  const origin = req.headers.get('origin');
  const localOrigins = ['127.0.0.1', 'localhost', '[::1]'].map(name => `${url.protocol}//${name}${url.port ? `:${url.port}` : ''}`);
  if (!localOrigins.includes(origin ?? '') || origin !== `${url.protocol}//${host}` || req.headers.get('sec-fetch-site') === 'cross-site')
    return errorResponse('管理画面と同じ接続元から操作してください。', 403);
  if (req.headers.get('content-type')?.split(';')[0].trim() !== 'application/json') return errorResponse('JSON形式が必要です。', 415);
  const { key } = await context.params;
  if (!/^[A-Za-z0-9][A-Za-z0-9_-]*$/.test(key)) return errorResponse('記事IDが不正です。', 400);
  let body: unknown;
  try { const raw = await req.text(); if (raw.length > 20000) return errorResponse('入力が長すぎます。', 413); body = JSON.parse(raw); }
  catch { return errorResponse('JSON形式が不正です。', 400); }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return errorResponse('コピー・題材・根拠、または確認理由を入力してください。', 400);
  try {
    await saveCoverProduction(key, parsed.data);
    return jsonResponse({ row: noteCoverManagement().rows.find(r => r.key === key) });
  } catch (error) {
    if (error instanceof CoverEditError) return errorResponse(error.message, error.status);
    return errorResponse('保存できませんでした。画像の取得状態と台帳を確認してください。', 500);
  }
}
