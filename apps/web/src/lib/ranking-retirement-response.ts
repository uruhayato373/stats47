import { NextRequest, NextResponse } from "next/server";

import { NO_STORE_CACHE_HEADERS } from "@/lib/cache-policy";

import { GONE_RANKING_KEYS } from "@/config/gone-ranking-keys";
import { RANKING_SLUG_REDIRECTS } from "@/config/ranking-redirects";

/** Apply URL retirement before reading snapshots, which may outlive a deployment. */
export function getRankingRetirementResponse(
  req: NextRequest,
  rankingKey: string,
): NextResponse | null {
  const destination = RANKING_SLUG_REDIRECTS[rankingKey];
  if (destination) {
    const url = new URL(req.url);
    url.pathname = url.pathname.replace(`/${rankingKey}`, `/${destination}`);
    return NextResponse.redirect(url, 301);
  }
  if (!GONE_RANKING_KEYS.has(rankingKey)) return null;
  return NextResponse.json(
    { error: "This ranking is no longer available." },
    { status: 410, headers: { ...NO_STORE_CACHE_HEADERS, "X-Robots-Tag": "noindex" } },
  );
}
