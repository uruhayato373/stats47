import "server-only";

import { readRankingAiContentFromR2 } from "@stats47/ai-content/server";
import { getRankingTitle, type RankingValue } from "@stats47/ranking";
import {
  readAllYearsRankingValuesFromR2,
  readRankingItemsByGroupKeyFromR2,
  readRankingItemsBySurveyFromR2,
  type GroupRankingItem,
} from "@stats47/ranking/server";
import { isOk } from "@stats47/types";
import { getInitialMapTileUrls } from "@stats47/visualization/leaflet/constants";

import { resolveContentVertical } from "@/features/ads/constants/affiliate-category";
import { resolveAffiliateBannersForContent } from "@/features/ads/server";
import { findCategoryByKey } from "@/features/category/server";
import {
  generateRankingBreadcrumbStructuredData,
  generateRankingFAQStructuredData,
  generateRankingPageStructuredData,
} from "@/features/ranking";

import { logger } from "@/lib/logger";

import {
  buildNationalAverageSeries,
  type NationalAveragePoint,
} from "../lib/build-national-average-series";
import { cachedFindRankingItem } from "../lib/cached-ranking-item";

const AREA_TYPE = "prefecture" as const;

/** yearCode (4 桁 / 10 桁フルタイムコード) を 4 桁年に揃えて比較する */
function sameYear(a: string, b: string): boolean {
  return String(a).slice(0, 4) === String(b).slice(0, 4);
}

export async function loadRankingPageModel(rankingKey: string) {
  const rankingItemResult = await cachedFindRankingItem(rankingKey, AREA_TYPE);
  const rankingItem = isOk(rankingItemResult) ? rankingItemResult.data : null;

  if (!rankingItem) {
    return null;
  }

  const availableYears = rankingItem.availableYears || [];
  const selectedYear = availableYears[0]?.yearCode || "";

  // 全年を 1 read。readRankingValuesFromR2 (単年) も内部で values.json を丸ごと取得して
  // からメモリ上で年 partition を絞っているだけなので、全年版に替えても R2 の GET 回数・
  // 転送バイト数は変わらない。選択年はここで filter し、全年配列は client へ渡さない
  // (畳んだ全国平均系列 ≤50 点だけを渡す。全年配列は最大 400KB 超で RSC payload に乗せられない)。
  const allYearsValuesPromise = readAllYearsRankingValuesFromR2(rankingKey, AREA_TYPE)
    .then((r) => (isOk(r) ? r.data : []))
    .catch((error) => {
      logger.error({ error }, "RankingKeyPage: 全年 ranking values 取得失敗");
      return [] as RankingValue[];
    });

  // 都道府県 TopoJSON はここで取得しない。1,015,004 bytes が RSC payload へ直列化され、
  // ranking HTML 1,232,628 bytes の約 82% を占めていた (2026-08-05 実測)。地図は
  // next/dynamic の ssr:false でサーバー描画されないため hydration まで使われず、
  // 純粋な無駄だった。RankingMapChartClient が /prefecture.topojson を client fetch する。

  const aiContentPromise = readRankingAiContentFromR2(rankingKey, AREA_TYPE).catch(
    (error) => {
      logger.error({ error }, "RankingKeyPage: AI content 取得失敗");
      return null;
    },
  );

  const cityRankingItemPromise = cachedFindRankingItem(rankingKey, "city")
    .then((r) => (isOk(r) ? r.data : null))
    .catch(() => null);

  // この統計の出典調査 (builder が item.json に焼き込んだ originalSurveys)。
  // 旧実装は全調査リスト (readSurveysFromR2) をサイドバーに出しており、無関係な調査が
  // 並ぶ + surveyName を別 fetch していた。焼き込み済みデータで追加 fetch ゼロにする。
  // 正典: .claude/rules/survey-linkage-standards.md
  const originalSurveys = rankingItem.originalSurveys ?? [];
  const surveyName = originalSurveys[0]?.name ?? null;

  // 同じ調査の関連ランキング (先頭 survey の items.json 上位、自分自身を除く)
  const primarySurveyId = rankingItem.surveyIds?.[0] ?? rankingItem.surveyId ?? null;
  const surveyRelatedItemsPromise = primarySurveyId
    ? readRankingItemsBySurveyFromR2(primarySurveyId)
        .then((r) =>
          isOk(r)
            ? r.data
                .filter((it) => it.rankingKey !== rankingKey)
                .slice(0, 5)
                .map((it) => ({ rankingKey: it.rankingKey, title: it.title }))
            : [],
        )
        .catch(() => [] as { rankingKey: string; title: string }[])
    : Promise.resolve([] as { rankingKey: string; title: string }[]);

  const groupMembersPromise = rankingItem.groupKey
    ? readRankingItemsByGroupKeyFromR2(rankingItem.groupKey, AREA_TYPE)
        .then((r) => (isOk(r) && r.data.length > 1 ? r.data : []))
        .catch(() => [] as GroupRankingItem[])
    : Promise.resolve([] as GroupRankingItem[]);

  const categoryPromise = rankingItem.categoryKey
    ? findCategoryByKey(rankingItem.categoryKey)
        .then((r) => (isOk(r) ? r.data : null))
        .catch(() => null)
    : Promise.resolve(null);

  // ネイティブ枠のバナー解決。
  // ★ 2026-08-04: 4 → 5。先頭 4 件がネイティブ枠、5 件目を読了位置の 300x250 に回す
  //   (RankingPageNativeAffiliateSection)。在庫が 4 件以下なら末尾バナーは出ない。
  // ★ 2026-08-06: 5 → 8。縦長 (スカイスクレイパー) を描画側で除外するようになったため、
  //   除外後も native 4 + 末尾 1 が埋まる余裕を持たせる。
  // ★ 2026-08-06: **categoryKey フォールバックを追加**。tagKeys 単独では ranking の
  //   native 枠が一度も描画されていなかった — `RankingItem.tags` の SSOT である
  //   `MetricConfig.tags` が 2026-06-03 の型追加以来 2,295 config すべてで未記入で、
  //   常に空配列だったため。規約 §12 は ranking の解決キーを「categoryKey → vertical
  //   + tagKeys」と定めており、実装が tagKeys しか見ていないのがドリフトだった。
  //   themes が relatedArticleTagKeys → THEME_AFFILIATE_MAP でフォールバックするのと同型。
  // ★ 2026-09-03: 解決順を **出典調査 → タグ → カテゴリ** に統一 (`resolveContentVertical`)。
  //   カテゴリ 17 軸では「納豆消費量」と「県民所得」が同じ economy に落ち、家計調査の
  //   食品品目 (ランキング流入の 38%) に金融広告が出ていた。出典調査 (item.json の surveyIds
  //   焼き込み) で家計調査 → furusato、学校保健統計 → 広告なし、のように主題単位で決める。
  //   サイドバー (AffiliateAdSlot) も同じ解決結果 `affiliateVertical` を使う。
  const affiliateInput = {
    surveyIds: rankingItem.surveyIds ?? (rankingItem.surveyId ? [rankingItem.surveyId] : []),
    tagKeys: (rankingItem.tags ?? []).map((tag) => tag.tagKey),
    categoryKey: rankingItem.categoryKey,
  };
  const affiliateVertical = resolveContentVertical(affiliateInput).vertical;
  const nativeBannersPromise = (async () => {
    try {
      return await resolveAffiliateBannersForContent(affiliateInput, 8, rankingKey);
    } catch (error) {
      logger.error({ error }, "RankingKeyPage: native banners 取得失敗");
      return [];
    }
  })();

  const [
    allYearsValues,
    aiContent,
    cityRankingItem,
    surveyRelatedItems,
    groupMembers,
    category,
    nativeBanners,
  ] = await Promise.all([
    allYearsValuesPromise,
    aiContentPromise,
    cityRankingItemPromise,
    surveyRelatedItemsPromise,
    groupMembersPromise,
    categoryPromise,
    nativeBannersPromise,
  ]);

  // 選択年の 47 行 (従来 readRankingValuesFromR2 が返していたもの)
  const rankingValues = selectedYear
    ? allYearsValues.filter((v) => sameYear(v.yearCode, selectedYear))
    : [];
  // 全国平均の推移。全年から畳むので client には ≤50 点しか渡らない
  const nationalAverageSeries: NationalAveragePoint[] =
    buildNationalAverageSeries(allYearsValues);

  const breadcrumbCategory = category
    ? { key: category.categoryKey, name: category.categoryName }
    : null;

  const structuredData = generateRankingPageStructuredData({
    rankingItem,
    rankingValues,
    selectedYear,
  });
  const breadcrumbStructuredData = generateRankingBreadcrumbStructuredData({
    rankingItem,
    category: breadcrumbCategory,
  });
  const faqStructuredData = generateRankingFAQStructuredData({
    rankingItem,
    rankingValues,
    selectedYear,
  });

  return {
    areaType: AREA_TYPE,
    rankingName: getRankingTitle(rankingItem),
    rankingItem,
    selectedYear,
    rankingValues,
    nationalAverageSeries,
    aiContent,
    cityRankingItem,
    surveyName,
    originalSurveys,
    surveyRelatedItems,
    groupMembers,
    category,
    nativeBanners,
    affiliateVertical,
    breadcrumbCategory,
    structuredData,
    breadcrumbStructuredData,
    faqStructuredData,
    initialTileUrls: getInitialMapTileUrls({ theme: "light_all", retina: true }),
  };
}

export type RankingPageModel = NonNullable<
  Awaited<ReturnType<typeof loadRankingPageModel>>
>;
