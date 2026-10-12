import { z } from 'zod';

import { decorate } from '@/lib/server/inventory';
import { errorResponse, jsonResponse } from '@/lib/server/http';
import { DraftEditError, saveDraftCaption } from '@/lib/server/posts-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const bodySchema = z
  .object({
    caption: z
      .string()
      .min(1)
      .max(10000)
      .refine((s) => s.trim().length > 0),
    revision: z.string().regex(/^[a-f0-9]{64}$/),
  })
  .strict();

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const url = new URL(req.url);
  // ローカル専用・同一originのJSON操作のみ。外部サイトからlocalhostへの書込を拒否する。
  if (
    !['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname) ||
    req.headers.get('origin') !== url.origin ||
    req.headers.get('sec-fetch-site') === 'cross-site'
  ) {
    return errorResponse('管理画面と同じ接続元から操作してください。', 403);
  }
  if (
    req.headers.get('content-type')?.split(';')[0].trim() !== 'application/json'
  ) {
    return errorResponse('JSON形式が必要です。', 415);
  }
  const { id } = await context.params;
  if (!/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(Number(id)))
    return errorResponse('投稿IDが不正です。', 400);
  let body: unknown;
  try {
    const raw = await req.text();
    if (raw.length > 70000) return errorResponse('本文が長すぎます。', 413);
    body = JSON.parse(raw);
  } catch {
    return errorResponse('JSON形式が不正です。', 400);
  }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success)
    return errorResponse('本文と版の情報を確認してください。', 400);
  try {
    const post = saveDraftCaption(
      Number(id),
      parsed.data.caption,
      parsed.data.revision
    );
    return jsonResponse({ post: decorate(post) });
  } catch (error) {
    if (error instanceof DraftEditError)
      return errorResponse(error.message, error.status);
    return errorResponse(
      '保存できませんでした。再読込して状態を確認してください。',
      500
    );
  }
}
