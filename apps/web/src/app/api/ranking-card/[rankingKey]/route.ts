import { NextRequest, NextResponse } from "next/server";

import { buildRankingDisplayInfo, deriveFeaturedTopList } from "@stats47/ranking";
import { readRankingItemFromR2, readRankingValuesFromR2 } from "@stats47/ranking/server";
import { isOk } from "@stats47/types";
import { generateRankingThumbnailMapSvg } from "@stats47/visualization/server";

import type { RankingLinkCardData } from "@/features/blog";

import { NO_STORE_CACHE_HEADERS, PUBLIC_DATA_CACHE_HEADERS } from "@/lib/cache-policy";
import { getRankingRetirementResponse } from "@/lib/ranking-retirement-response";

const TOP_AREA_COUNT = 3;

/**
 * ブログ本文のランキングカード (`<source-link>`) 用データ。
 *
 * GET /api/ranking-card/[rankingKey] → 最新年の上位3県 + 地理ミニ地図 SVG
 *
 * ブログ詳細はビルド時に事前生成されるが、観測値 (values.json) はビルド時に読めない
 * (readRankingValuesFromR2 が空を返す) ため、カードは表示後にこの API から読む。
 * 地図と上位の導出はホーム注目ランキングと同じ関数を使う。データが無ければ null を返し、
 * カードは文字だけの表示に留まる。
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ rankingKey: string }> },
) {
  const { rankingKey } = await params;
  const retirementResponse = getRankingRetirementResponse(req, rankingKey);
  if (retirementResponse) return retirementResponse;

  try {
    const itemResult = await readRankingItemFromR2(rankingKey, "prefecture");
    const item = isOk(itemResult) ? itemResult.data : null;
    const yearCode = item?.latestYear?.yearCode;
    if (!item || !yearCode) {
      return NextResponse.json(null, { headers: NO_STORE_CACHE_HEADERS });
    }

    const valuesResult = await readRankingValuesFromR2(rankingKey, "prefecture", yearCode);
    const values = isOk(valuesResult) ? valuesResult.data : [];
    const top = deriveFeaturedTopList(values, TOP_AREA_COUNT);
    if (top.length === 0) {
      return NextResponse.json(null, { headers: NO_STORE_CACHE_HEADERS });
    }

    const mapSvg = generateRankingThumbnailMapSvg(
      values.flatMap((v) =>
        v.value !== null ? [{ areaCode: v.areaCode, value: v.value, rank: v.rank ?? undefined }] : [],
      ),
      {
        colorScheme: item.visualization?.colorScheme,
        isReversed: item.visualization?.isReversed,
        idSuffix: `card-${rankingKey}`,
      },
    );

    const body: RankingLinkCardData = {
      unit: buildRankingDisplayInfo(item).unit,
      yearName: item.latestYear?.yearName ?? `${yearCode}年`,
      top: top.map((t) => ({ rank: t.rank ?? 0, areaName: t.areaName, value: t.value ?? "" })),
      mapSvg,
    };
    return NextResponse.json(body, { headers: PUBLIC_DATA_CACHE_HEADERS });
  } catch {
    return NextResponse.json(null, { headers: NO_STORE_CACHE_HEADERS });
  }
}
