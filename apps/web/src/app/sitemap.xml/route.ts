/**
 * Sitemap Index (/sitemap.xml)
 *
 * Phase 9 P2-C (2026-04-26): app/sitemap.ts が generateSitemaps で
 * /sitemap/<id>.xml を生成するように変更したため、Google が探す
 * /sitemap.xml を sitemap index として明示的に提供する route handler。
 *
 * SEGMENTS の数・順序は `@/config/sitemap-segments` が単一ソース。
 * 手写しせず import する (2026-08-20: ハードコードで cities/japan が index から漏れた)。
 */

import { NextResponse } from "next/server";

import { SITEMAP_SEGMENTS } from "@/config/sitemap-segments";

// ISR 24h: index 自体は変わらないため。segment 内容は各 sitemap が個別に ISR 管理。
export const revalidate = 86400;

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://stats47.jp";

// ★件数をハードコードしない。以前は `const SEGMENT_COUNT = 8` と手書きし
// 「追加時は両方を更新」というコメントだけで同期を担保していたが、実際には
// cities (2026-06 追加・1,080 URL) と japan (2026-08-20 追加・19 URL) が
// index から漏れ、2 か月以上 Google に提出されていなかった (2026-08-20 実測)。
// 定義は `@/config/sitemap-segments` が単一ソース。
const SEGMENT_COUNT = SITEMAP_SEGMENTS.length;

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
