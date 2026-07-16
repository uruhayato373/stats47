import { igConsistency } from "@/lib/server/instagram";
import { jsonResponse } from "@/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() {
  return jsonResponse(igConsistency());
}
