import { probeR2 } from "@/lib/server/actions";
import { ProbeR2 } from "@/lib/contracts/schemas";
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
  const parsed = ProbeR2.safeParse(body);
  if (!parsed.success) return errorResponse("domain/content_key は必須", 400);
  return jsonResponse({ found: await probeR2(parsed.data.domain, parsed.data.content_key) });
}
