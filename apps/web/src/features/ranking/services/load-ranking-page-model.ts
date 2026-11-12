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

import { findCategoryByKey } from "@/features/category/server";
import {
  generateRankingFAQStructuredData,
  generateRankingPageStructuredData,
} from "@/features/ranking";
import { prioritizeSurveyRankings } from "@/features/survey/select-survey-representative-rankings";
import { getSurveyEditorialContent } from "@/features/survey/survey-editorial";

import { logger } from "@/lib/logger";

import {
  buildNationalAverageSeries,
  type NationalAveragePoint,
} from "../lib/build-national-average-series";
import { cachedFindRankingItem } from "../lib/cached-ranking-item";
import { selectCurrentAiContent } from "../lib/select-current-ai-content";

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
  // 純粋な無駄だった。RankingMapChartClient が簡略化した形データを client fetch する。

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

  // 同じ調査の関連ランキング (先頭 survey の items.json、自分自身を除く)。調査の編集設定の
  // 「読者の問い」が指すランキングを先頭にする (items.json の順だと家計調査はエアコン消費量・情報通信係数が先に出た)
  const primarySurveyId = rankingItem.surveyIds?.[0] ?? rankingItem.surveyId ?? null;
  const surveyPreferredKeys = primarySurveyId
    ? (getSurveyEditorialContent(primarySurveyId)?.readerQuestions.map((q) => q.rankingKey) ?? [])
    : [];
  const surveyRelatedItemsPromise = primarySurveyId
    ? readRankingItemsBySurveyFromR2(primarySurveyId)
        .then((r) =>
          isOk(r)
            ? prioritizeSurveyRankings(r.data, surveyPreferredKeys)
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

  const [
    allYearsValues,
    aiContent,
    cityRankingItem,
    surveyRelatedItems,
    groupMembers,
    category,
  ] = await Promise.all([
    allYearsValuesPromise,
    aiContentPromise,
    cityRankingItemPromise,
    surveyRelatedItemsPromise,
    groupMembersPromise,
    categoryPromise,
  ]);
  // 観測値の年を更新した直後に旧年の考察を表示すると、順位・数値の説明が誤る。
  // 新年の審査済み解説が R2 に入るまでは考察を隠す。
  const currentAiContent = selectCurrentAiContent(aiContent, selectedYear);

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
    aiContent: currentAiContent,
    cityRankingItem,
    surveyName,
    originalSurveys,
    surveyRelatedItems,
    groupMembers,
    category,
    breadcrumbCategory,
    structuredData,
    faqStructuredData,
  };
}

export type RankingPageModel = NonNullable<
  Awaited<ReturnType<typeof loadRankingPageModel>>
>;
