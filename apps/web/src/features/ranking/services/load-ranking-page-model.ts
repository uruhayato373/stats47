import "server-only";

import { readRankingAiContentFromR2 } from "@stats47/ai-content/server";
import { fetchPrefectureTopology } from "@stats47/gis/geoshape";
import { getRankingTitle, type RankingValue } from "@stats47/ranking";
import {
  readRankingItemsByGroupKeyFromR2,
  readRankingValuesFromR2,
  readSurveyByIdFromR2,
  readSurveysFromR2,
  type GroupRankingItem,
} from "@stats47/ranking/server";
import { isOk } from "@stats47/types";
import { getInitialMapTileUrls } from "@stats47/visualization/leaflet/constants";

import { resolveAffiliateBanners } from "@/features/ads/server";
import { findCategoryByKey } from "@/features/category/server";
import {
  generateRankingBreadcrumbStructuredData,
  generateRankingFAQStructuredData,
  generateRankingPageStructuredData,
} from "@/features/ranking";

import { logger } from "@/lib/logger";

import { cachedFindRankingItem } from "../lib/cached-ranking-item";

const AREA_TYPE = "prefecture" as const;

export async function loadRankingPageModel(rankingKey: string) {
  const rankingItemResult = await cachedFindRankingItem(rankingKey, AREA_TYPE);
  const rankingItem = isOk(rankingItemResult) ? rankingItemResult.data : null;

  if (!rankingItem) {
    return null;
  }

  const availableYears = rankingItem.availableYears || [];
  const selectedYear = availableYears[0]?.yearCode || "";

  const rankingValuesPromise = selectedYear
    ? readRankingValuesFromR2(rankingKey, AREA_TYPE, selectedYear).then((r) =>
        isOk(r) ? r.data : []
      )
    : Promise.resolve([] as RankingValue[]);

  const topologyPromise =
    process.env.NEXT_PHASE === "phase-production-build"
      ? Promise.resolve(null)
      : fetchPrefectureTopology().catch((error) => {
          logger.error({ error }, "RankingKeyPage: topology 取得失敗");
          return null;
        });

  const aiContentPromise = readRankingAiContentFromR2(rankingKey, AREA_TYPE).catch(
    (error) => {
      logger.error({ error }, "RankingKeyPage: AI content 取得失敗");
      return null;
    },
  );

  const cityRankingItemPromise = cachedFindRankingItem(rankingKey, "city")
    .then((r) => (isOk(r) ? r.data : null))
    .catch(() => null);

  const surveyNamePromise = rankingItem.surveyId
    ? readSurveyByIdFromR2(rankingItem.surveyId)
        .then((r) => (isOk(r) ? r.data?.name ?? null : null))
        .catch(() => null)
    : Promise.resolve(null);

  const allSurveysPromise = readSurveysFromR2()
    .then((r) => (isOk(r) ? r.data : []))
    .catch(() => []);

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

  const affiliateTagKeys = (rankingItem.tags ?? []).map((tag) => tag.tagKey);
  const nativeBannersPromise =
    affiliateTagKeys.length > 0
      ? resolveAffiliateBanners(affiliateTagKeys, 4, rankingKey).catch((error) => {
          logger.error({ error }, "RankingKeyPage: native banners 取得失敗");
          return [];
        })
      : Promise.resolve([]);

  const [
    rankingValues,
    topology,
    aiContent,
    cityRankingItem,
    surveyName,
    allSurveys,
    groupMembers,
    category,
    nativeBanners,
  ] = await Promise.all([
    rankingValuesPromise,
    topologyPromise,
    aiContentPromise,
    cityRankingItemPromise,
    surveyNamePromise,
    allSurveysPromise,
    groupMembersPromise,
    categoryPromise,
    nativeBannersPromise,
  ]);

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
    topology,
    aiContent,
    cityRankingItem,
    surveyName,
    allSurveys,
    groupMembers,
    category,
    nativeBanners,
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
