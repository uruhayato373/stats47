import { renderBuzzMap } from "@/lib/server/buzz-map-actions";
import { BuzzMapRender } from "@/lib/contracts/schemas";
import { jsonResponse, errorResponse, parseJsonBody } from "@/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** 静止画 (still) / 動画preview (preview) / 本尺動画 (full) を Remotion でレンダする。 */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await parseJsonBody(req);
  } catch (e) {
    return errorResponse((e as Error).message, 400);
  }
  const parsed = BuzzMapRender.safeParse(body);
  if (!parsed.success) return errorResponse("ideaId/kind が必要", 400);
  const { status, body: out } = renderBuzzMap(parsed.data);
  return jsonResponse(out, status);
}
