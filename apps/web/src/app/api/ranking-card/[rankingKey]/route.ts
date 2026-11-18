import { NextRequest, NextResponse } from "next/server";

import { isCapitalCityValueMetric } from "@stats47/data-configs/provenance";
import { METRICS_REGISTRY } from "@stats47/data-configs/registry";
import { buildFeaturedTopRows } from "@stats47/ranking";
import { readRankingItemFromR2, readRankingValuesFromR2 } from "@stats47/ranking/server";
import { isOk } from "@stats47/types";
import { generateRankingThumbnailMapSvg } from "@stats47/visualization/server";

import type { RankingLinkCardData } from "@/features/blog";

import { NO_STORE_CACHE_HEADERS, PUBLIC_DATA_CACHE_HEADERS } from "@/lib/cache-policy";
import { getRankingRetirementResponse } from "@/lib/ranking-retirement-response";

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
    // 上位の行はランキングのページの表と同じ単位・桁で書く (注目のランキングのカードと同じ関数)。地図の色は元の値で決める
    const metric = METRICS_REGISTRY[rankingKey];
    const top = buildFeaturedTopRows(item, values, {
      capitalCities: metric ? isCapitalCityValueMetric(metric, METRICS_REGISTRY) : false,
    });
    if (!top) {
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
      unit: top.unit,
      yearName: item.latestYear?.yearName ?? `${yearCode}年`,
      top: top.rows,
      mapSvg,
    };
    return NextResponse.json(body, { headers: PUBLIC_DATA_CACHE_HEADERS });
  } catch {
    return NextResponse.json(null, { headers: NO_STORE_CACHE_HEADERS });
  }
}
