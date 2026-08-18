import { publishX } from "@/lib/server/actions";
import { PublishX } from "@/lib/contracts/schemas";
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
  const parsed = PublishX.safeParse(body);
  if (!parsed.success) return errorResponse("content_key は必須", 400);
  const { status, body: out } = publishX(parsed.data);
  return jsonResponse(out, status);
}
