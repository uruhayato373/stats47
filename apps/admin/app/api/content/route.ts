import { contentOperations } from "@/lib/server/content-operations";
import { jsonResponse } from "@/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() {
  return jsonResponse(contentOperations());
}
