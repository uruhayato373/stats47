import type { NextRequest } from "next/server";

import { svgCatalog } from "@/lib/server/svg-catalog";
import { parseLimit } from "@/lib/contracts/schemas";
import { jsonResponse, errorResponse } from "@/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("limit");
  const parsed = parseLimit(raw);
  if (parsed === "invalid") return errorResponse("limit は非負整数", 400);
  // 旧実装は limit 未指定時 30 を既定にする。
  const limit = parsed === null ? 30 : parsed;
  const all = req.nextUrl.searchParams.get("all") === "1";
  try {
    return jsonResponse(await svgCatalog({ limit, all }));
  } catch (e) {
    return errorResponse((e as Error).message, 500);
  }
}
