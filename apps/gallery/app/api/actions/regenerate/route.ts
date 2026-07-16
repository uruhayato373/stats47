import { regenerate } from "@/lib/server/actions";
import { Regenerate } from "@/lib/contracts/schemas";
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
  const parsed = Regenerate.safeParse(body);
  if (!parsed.success) return errorResponse("kind が必要", 400);
  const { status, body: out } = regenerate(parsed.data);
  return jsonResponse(out, status);
}
