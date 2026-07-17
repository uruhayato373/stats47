import type { NextRequest } from "next/server";

import { readBuzzMapCatalog } from "@/lib/server/buzz-map";
import { jsonResponse } from "@/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(req: NextRequest) {
  const lane = req.nextUrl.searchParams.get("lane") ?? "curated";
  return jsonResponse(readBuzzMapCatalog({ lane }));
}
