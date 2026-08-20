import { ASSET_TABS } from "@/lib/server/assets";
import { jsonResponse } from "@/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() {
  return jsonResponse({ tabs: ASSET_TABS });
}
