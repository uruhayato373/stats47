import { dashboardCatalog } from "@/lib/server/dashboard-catalog";
import { errorResponse, jsonResponse } from "@/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() {
  try {
    return jsonResponse(dashboardCatalog());
  } catch {
    return errorResponse("調査カタログを読み込めません", 500);
  }
}
