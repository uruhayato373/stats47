import { registerBuzzMapDraft } from "@/lib/server/buzz-map-actions";
import { BuzzMapRegisterDraft } from "@/lib/contracts/schemas";
import { jsonResponse, errorResponse, parseJsonBody } from "@/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * draft gate (isPostable) を通ったときのみ posts.json へ draft 登録する。
 * confirm:true が必須。実投稿・予約はしない (既存 /sns 画面に委ねる)。
 */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await parseJsonBody(req);
  } catch (e) {
    return errorResponse((e as Error).message, 400);
  }
  const parsed = BuzzMapRegisterDraft.safeParse(body);
  if (!parsed.success) return errorResponse("ideaId/channel が必要 / confirm:true が必須", 400);
  const { status, body: out } = await registerBuzzMapDraft(parsed.data);
  return jsonResponse(out, status);
}
