import { buildInventory } from "@/lib/server/inventory";
import { jsonResponse } from "@/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() {
  return jsonResponse(buildInventory());
}
