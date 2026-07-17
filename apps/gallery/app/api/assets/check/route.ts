import { checkAssets } from "@/lib/server/assets";
import { AssetsCheck } from "@/lib/contracts/schemas";
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
  const parsed = AssetsCheck.safeParse(body);
  if (!parsed.success) return errorResponse("tab は必須", 400);
  try {
    const result = await checkAssets(parsed.data.tab, {
      limit: parsed.data.limit ?? null,
      all: parsed.data.all ?? false,
    });
    return jsonResponse(result);
  } catch (e) {
    return errorResponse((e as Error).message, 400);
  }
}
