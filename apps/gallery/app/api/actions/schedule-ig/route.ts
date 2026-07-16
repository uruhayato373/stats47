import { scheduleIg } from "@/lib/server/instagram";
import { ScheduleIg } from "@/lib/contracts/schemas";
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
  const parsed = ScheduleIg.safeParse(body);
  if (!parsed.success) return errorResponse("date/type/domain/content_key は必須", 400);
  try {
    return jsonResponse(scheduleIg(parsed.data));
  } catch (e) {
    // 業務エラー (過去日・重複・週ファイル無し等) は 400
    return errorResponse((e as Error).message, 400);
  }
}
