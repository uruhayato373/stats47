import type { NextRequest } from "next/server";

import { getAssetTab } from "@/lib/server/assets";
import { parseLimit } from "@/lib/contracts/schemas";
import { jsonResponse, errorResponse } from "@/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ tab: string }> },
) {
  const { tab } = await params;
  const limit = parseLimit(req.nextUrl.searchParams.get("limit"));
  if (limit === "invalid") return errorResponse("limit は非負整数", 400);
  const all = req.nextUrl.searchParams.get("all") === "1";
  try {
    return jsonResponse(await getAssetTab(tab, { limit, all }));
  } catch (e) {
    return errorResponse((e as Error).message, 400);
  }
}
