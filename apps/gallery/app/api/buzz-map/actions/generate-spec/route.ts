import { generateSpec } from "@/lib/server/buzz-map-actions";
import { BuzzMapGenerateSpec } from "@/lib/contracts/schemas";
import { jsonResponse, errorResponse, parseJsonBody } from "@/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await parseJsonBody(req);
  } catch (e) {
    return errorResponse((e as Error).message, 400);
  }
  const parsed = BuzzMapGenerateSpec.safeParse(body);
  if (!parsed.success) return errorResponse("ideaId/helper が必要", 400);
  const { status, body: out } = generateSpec(parsed.data);
  return jsonResponse(out, status);
}
