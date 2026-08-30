import type { NextRequest } from "next/server";

import { filterPosts } from "@/lib/server/posts";
import { jsonResponse } from "@/lib/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const result = filterPosts({
    platform: sp.get("platform") ?? undefined,
    status: sp.get("status") ?? undefined,
    domain: sp.get("domain") ?? undefined,
    q: sp.get("q") ?? undefined,
  });
  return jsonResponse(result);
}
