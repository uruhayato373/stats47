import { routeLanding } from "@/lib/server/buzz-map-actions";
import { jsonResponse } from "@/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** landing 再判定 (catalog 全体を rebuild — ideaId 単位の再判定は builder が未対応のため全体再構築)。 */
export async function POST() {
  const { status, body } = routeLanding();
  return jsonResponse(body, status);
}
