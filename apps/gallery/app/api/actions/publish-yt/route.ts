import { publishYt } from "@/lib/server/actions";
import { PublishYt } from "@/lib/contracts/schemas";
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
  const parsed = PublishYt.safeParse(body);
  if (!parsed.success) return errorResponse("confirm:true が必須 (月1運用の明示確認)", 400);
  const { status, body: out } = publishYt(parsed.data);
  return jsonResponse(out, status);
}
