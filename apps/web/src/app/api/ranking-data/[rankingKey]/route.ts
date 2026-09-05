import { NextRequest, NextResponse } from "next/server";

import { readRankingValuesFromR2, readRankingItemFromR2 } from "@stats47/ranking/server";
import { isOk } from "@stats47/types";

import { NO_STORE_CACHE_HEADERS, PUBLIC_DATA_CACHE_HEADERS } from "@/lib/cache-policy";
import { getRankingRetirementResponse } from "@/lib/ranking-retirement-response";

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
  const retirementResponse = getRankingRetirementResponse(req, rankingKey);
  if (retirementResponse) return retirementResponse;
  const year = req.nextUrl.searchParams.get("year");

  try {
    let yearCode = year;
    if (!yearCode) {
      const itemResult = await readRankingItemFromR2(rankingKey, "prefecture");
      const item = isOk(itemResult) ? itemResult.data : null;
      yearCode = item?.latestYear?.yearCode ?? "2024";
    }

    const valuesResult = await readRankingValuesFromR2(rankingKey, "prefecture", yearCode);
    if (!isOk(valuesResult) || valuesResult.data.length === 0) {
      return NextResponse.json([], { status: 200, headers: NO_STORE_CACHE_HEADERS });
    }

    const data = valuesResult.data.map((v) => ({ name: v.areaName, value: v.value }));
    return NextResponse.json(data, {
      headers: PUBLIC_DATA_CACHE_HEADERS,
    });
  } catch {
    return NextResponse.json([], { status: 200, headers: NO_STORE_CACHE_HEADERS });
  }
}
