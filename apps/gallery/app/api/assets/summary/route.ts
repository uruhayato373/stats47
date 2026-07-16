import { assetsSummary } from "@/lib/server/assets";
import { jsonResponse } from "@/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return jsonResponse(await assetsSummary());
}
