import { pushBuzzMapR2 } from "@/lib/server/buzz-map-actions";
import { BuzzMapPushR2 } from "@/lib/contracts/schemas";
import { jsonResponse, errorResponse, parseJsonBody } from "@/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** confirm:true が必須（R2 push前に確認ダイアログを出す）。 */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await parseJsonBody(req);
  } catch (e) {
    return errorResponse((e as Error).message, 400);
  }
  const parsed = BuzzMapPushR2.safeParse(body);
  if (!parsed.success) return errorResponse("ideaId が必要 / confirm:true が必須", 400);
  const { status, body: out } = pushBuzzMapR2(parsed.data);
  return jsonResponse(out, status);
}
