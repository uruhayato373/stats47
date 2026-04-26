/**
 * Sitemap Index (/sitemap.xml)
 *
 * Phase 9 P2-C (2026-04-26): app/sitemap.ts が generateSitemaps で
 * /sitemap/<id>.xml を生成するように変更したため、Google が探す
 * /sitemap.xml を sitemap index として明示的に提供する route handler。
 *
 * SEGMENTS の数・順序は app/sitemap.ts の SEGMENTS と完全一致させる。
 */

import { NextResponse } from "next/server";

// ISR 24h: index 自体は変わらないため。segment 内容は各 sitemap が個別に ISR 管理。
export const revalidate = 86400;

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://stats47.jp";

// app/sitemap.ts の SEGMENTS と一致（追加時は両方を更新）
const SEGMENT_COUNT = 8;

export async function GET(): Promise<NextResponse> {
  const sitemaps = Array.from({ length: SEGMENT_COUNT }, (_, id) => id)
    .map(
      (id) => `  <sitemap><loc>${BASE_URL}/sitemap/${id}.xml</loc></sitemap>`,
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps}
</sitemapindex>
`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}
