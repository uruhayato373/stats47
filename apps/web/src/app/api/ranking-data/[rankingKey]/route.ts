import { NextRequest, NextResponse } from "next/server";

import { findRankingItem, listRankingValues } from "@stats47/ranking/server";
import { isOk } from "@stats47/types";

/**
 * ランキングデータ配信 API（md-content.tsx の ranking-table タグ向け）
 *
 * GET /api/ranking-data/[rankingKey]?year=2023
 *
 * year 省略時は ranking_items.latestYear を使用。
 * DB エラー時は空配列を返す（500 を出さない）。
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ rankingKey: string }> }
) {
  const { rankingKey } = await params;
  const year = req.nextUrl.searchParams.get("year");

  try {
    let yearCode = year;
    if (!yearCode) {
      const itemResult = await findRankingItem(rankingKey, "prefecture");
      const item = isOk(itemResult) ? itemResult.data : null;
      yearCode = item?.latestYear?.yearCode ?? "2024";
    }

    const valuesResult = await listRankingValues(rankingKey, "prefecture", yearCode);
    if (!isOk(valuesResult) || valuesResult.data.length === 0) {
      return NextResponse.json([], { status: 200 });
    }

    const data = valuesResult.data.map((v) => ({ name: v.areaName, value: v.value }));
    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400" },
    });
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}
