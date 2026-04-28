/**
 * ランキング詳細ページ（Server Component）
 *
 * URLパラメータ `rankingKey` に基づき、特定の統計ランキングデータを取得し、
 * 地図・グラフ・データテーブルなどの視覚化コンポーネントで詳細情報を表示する。
 *
 * ## 責務
 * 1. **データ取得**: D1 からランキング定義（`rankingItem`）と統計値（`rankingValues`）を取得する。
 * 2. **SEO**: 動的メタデータ（タイトル・description）と構造化データ（JSON-LD）を生成する。
 * 3. **SSG + ISR**: `generateStaticParams` で全 rankingKey を事前生成し、24時間 ISR で再検証する。
 *    年度切替はクライアント側で Server Action を呼び出し、ページ遷移なしで更新する。
 *
 * ## Composition Pattern
 * このページは Server Component と Client Component を組み合わせた
 * **Composition Pattern** を採用している。
 *
 * - `RankingMapChart` / `RankingItemsSidebar` は **Server Component**（内部で非同期データ取得を行う）。
 *   Client Component 内では Server Component を直接 import できないため、
 *   **本ページ（Server Component）でレンダリングし `ReactNode` props として注入する**。
 *
 * - `RankingHighlights` / `RankingBarChart` 等は **Client Component** であるため、
 *   `RankingKeyPageClient` 内で直接 import・レンダリングしている。
 *
 * @see {@link RankingKeyPageClient} レイアウトおよびインタラクティブUI
 * @see {@link RankingMapChart} 都道府県地図（Server Component → Suspense → Client Component）
 * @see {@link RankingItemsSidebar} 関連ランキング一覧サイドバー（Server Component）
 */

import { Suspense } from "react";

import Link from "next/link";
import { notFound } from "next/navigation";



import { findRankingAiContent } from "@stats47/ai-content/server";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@stats47/components/atoms/ui/breadcrumb";
import { fetchPrefectureTopology } from "@stats47/gis/geoshape";
import {
  listRankingValues,
  readActiveRankingKeysFromR2,
  readRankingItemsByGroupKeyFromR2,
  readSurveyByIdFromR2,
  readSurveysFromR2,
  type GroupRankingItem,
} from "@stats47/ranking/server";
import { isOk } from "@stats47/types";
import { getInitialMapTileUrls } from "@stats47/visualization/leaflet/constants";

import {
  generateRankingBreadcrumbStructuredData,
  generateRankingPageMetaData,
  generateRankingPageStructuredData,
  getRankingTitle,
  RankingKeyPageClient,
  AiContentAccordion,
  AiMarkdownContent,
  RankingFaqSection,
  CorrelationSectionSkeleton,
  RankingPageCardsSkeleton,
  SurveyCard,
} from "@/features/ranking";
import {
  CorrelationSectionContainer,
  RankingItemsSidebar,
  RankingPageCardsContainer,
  RelatedArticlesCard,
  PortStatisticsMapCard,
  cachedFindRankingItem,
} from "@/features/ranking/server";

import { logger } from "@/lib/logger";

import type { RankingValue } from "@stats47/ranking";
import type { Metadata } from "next";

/** 24時間 ISR */

/** ビルド時に全 rankingKey を事前生成（DB利用不可時はISRに委ねる） */
export async function generateStaticParams() {
  try {
    const result = await readActiveRankingKeysFromR2("prefecture");
    if (!isOk(result)) return [];
    return result.data.map(({ rankingKey }) => ({ rankingKey }));
  } catch {
    // CI ビルド時など D1 が利用できない場合は事前生成をスキップし、ISR で再生成
    return [];
  }
}

/** ページコンポーネントの Props 型 */
interface PageProps {
  /** URL パスパラメータ（例: `/ranking/population` → `{ rankingKey: "population" }`） */
  params: Promise<{ rankingKey: string }>;
}

/**
 * SEO 用メタデータを動的に生成する
 *
 * ランキング項目が見つからない場合はフォールバックのメタデータを返す。
 */
export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  try {
    const { rankingKey } = await params;
    const areaType = "prefecture";

    const rankingItemResult = await cachedFindRankingItem(rankingKey, areaType);
    const rankingItem = isOk(rankingItemResult) ? rankingItemResult.data : null;

    if (!rankingItem) {
      return {
        title: "ランキングが見つかりません",
        description: "指定されたランキングは存在しません",
      };
    }

    const availableYears = rankingItem.availableYears || [];
    const selectedYear = availableYears[0]?.yearCode || "";

    let rankingValues: RankingValue[] = [];
    if (selectedYear) {
      const rankingValueResult = await listRankingValues(rankingKey, areaType, selectedYear);
      rankingValues = isOk(rankingValueResult) ? rankingValueResult.data : [];
    }

    return generateRankingPageMetaData({
      rankingItem,
      rankingValues,
      selectedYear,
      areaType,
    });
  } catch (error) {
    logger.error({ error }, "メタデータ生成エラー");
    return {
      title: "ランキング",
      description: "ランキング詳細ページ",
    };
  }
}

/**
 * ランキング詳細ページ（Server Component）
 *
 * データ取得 → 構造化データ生成 → Client Component へデータ配布を行う。
 */
export default async function RankingKeyPage({
  params,
}: PageProps) {
  const { rankingKey } = await params;
  const areaType = "prefecture";

  // --- 1. ランキング定義を取得（D1） ---
  const rankingItemResult = await cachedFindRankingItem(rankingKey, areaType);
  const rankingItem = isOk(rankingItemResult) ? rankingItemResult.data : null;

  if (!rankingItem) {
    notFound();
  }

  // --- 2. 表示年度を決定（常に最新年度） ---
  const availableYears = rankingItem.availableYears || [];
  const selectedYear = availableYears[0]?.yearCode || "";

  // --- 3. ランキングデータ・TopoJSON・AIコンテンツを並列取得 ---
  const rankingValuesPromise = selectedYear
    ? listRankingValues(rankingKey, areaType, selectedYear).then(
        (r) => (isOk(r) ? r.data : [])
      )
    : Promise.resolve([] as RankingValue[]);

  const topologyPromise = fetchPrefectureTopology().catch((error) => {
    logger.error({ error }, "RankingKeyPage: topology 取得失敗");
    return null;
  });

  const aiContentPromise = findRankingAiContent(rankingKey, areaType).catch(
    (error) => {
      logger.error({ error }, "RankingKeyPage: AI content 取得失敗");
      return null;
    }
  );

  // --- 3b. 市区町村ランキング定義の有無を並列チェック ---
  const cityRankingItemPromise = cachedFindRankingItem(rankingKey, "city")
    .then((r) => (isOk(r) ? r.data : null))
    .catch(() => null);

  // --- 3c. 調査名 + 全調査一覧を取得 ---
  const surveyNamePromise = rankingItem.surveyId
    ? readSurveyByIdFromR2(rankingItem.surveyId).then((r) => isOk(r) ? r.data?.name ?? null : null).catch(() => null)
    : Promise.resolve(null);
  const allSurveysPromise = readSurveysFromR2().then((r) => isOk(r) ? r.data : []).catch(() => []);

  // --- 3d. グループメンバー取得（normalization_basis トグル用） ---
  const groupMembersPromise = rankingItem.groupKey
    ? readRankingItemsByGroupKeyFromR2(rankingItem.groupKey, areaType)
        .then((r) => (isOk(r) && r.data.length > 1 ? r.data : []))
        .catch(() => [] as GroupRankingItem[])
    : Promise.resolve([] as GroupRankingItem[]);

  const [rankingValues, topology, aiContent, cityRankingItem, surveyName, allSurveys, groupMembers] = await Promise.all([
    rankingValuesPromise,
    topologyPromise,
    aiContentPromise,
    cityRankingItemPromise,
    surveyNamePromise,
    allSurveysPromise,
    groupMembersPromise,
  ]);

  // --- 6. SEO 構造化データ（JSON-LD）を生成 ---
  const structuredData = generateRankingPageStructuredData({
    rankingItem,
    rankingValues,
    selectedYear,
  });
  const breadcrumbStructuredData = generateRankingBreadcrumbStructuredData({
    rankingItem,
  });

  // --- 5. レンダリング ---
  // Composition Pattern:
  //   - sidebar / mapChart は Server Component のため、
  //     この Server Component 内でレンダリングし ReactNode として注入する。
  //   - RankingKeyPageClient 内の Client Component（RankingHighlights 等）は
  //     Client Component 同士なので直接 import して使用している。
  // LCP 対策（#101 EXP-003）:
  // ランキング詳細ページの LCP 要素は Leaflet map の中心 tile。
  // Leaflet JS 実行後に tile URL が判明すると resourceLoadDelay が 4.3s と支配的なため、
  // 初期ビュー (日本中心・zoom 5) の 4 タイルを SSR で preload して LCP を短縮する。
  const initialTileUrls = getInitialMapTileUrls({ theme: "light_all", retina: true });

  return (
    <>
      {/* 構造化データ */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbStructuredData) }}
      />
      {initialTileUrls.map((url, idx) => (
        <link
          key={url}
          rel="preload"
          as="image"
          href={url}
          fetchPriority={idx === 0 ? "high" : "auto"}
        />
      ))}

      {/* パンくずナビゲーション */}
      <div className="container mx-auto px-4 pt-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/">ホーム</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/ranking">ランキング</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{getRankingTitle(rankingItem)}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <RankingKeyPageClient
        rankingKey={rankingKey}
        rankingItem={rankingItem}
        rankingValues={rankingValues}
        areaType={areaType}
        selectedYear={selectedYear}
        topology={topology}
        cityRankingItem={cityRankingItem?.isActive ? cityRankingItem : undefined}
        surveyName={surveyName ?? undefined}
        groupMembers={groupMembers}
        // 右サイドバー: 関連ランキング・関連記事
        sidebarSection={
          <Suspense fallback={<div className="space-y-4 animate-pulse"><div className="h-64 bg-muted rounded-lg" /><div className="h-32 bg-muted rounded-lg" /></div>}>
            <RankingItemsSidebar rankingKey={rankingKey} areaType={areaType} categoryKey={rankingItem.categoryKey} />
            <RelatedArticlesCard rankingKey={rankingKey} areaType={areaType} />
            <SurveyCard surveys={allSurveys.map(s => ({ id: s.id, name: s.name }))} currentSurveyId={rankingItem.surveyId ?? undefined} />
            <PortStatisticsMapCard rankingKey={rankingKey} groupKey={rankingItem.groupKey} />
          </Suspense>
        }
        // Server Component: 相関分析データを非同期取得する
        correlationSection={
          <Suspense fallback={<CorrelationSectionSkeleton />}>
            <CorrelationSectionContainer
              rankingKey={rankingKey}
            />
          </Suspense>
        }
        // Server Component: ランキングページカード（補足チャート）
        rankingPageCards={
          <Suspense fallback={<RankingPageCardsSkeleton />}>
            <RankingPageCardsContainer rankingKey={rankingKey} />
          </Suspense>
        }
        // AI生成コンテンツ: 考察（折りたたみ）
        insightsSection={
          aiContent?.insights
            ? <AiContentAccordion title="データの考察"><AiMarkdownContent content={aiContent.insights} /></AiContentAccordion>
            : null
        }
        // AI生成コンテンツ: FAQ JSON-LD（非表示 script）
        faqSection={
          aiContent?.faq
            ? <RankingFaqSection faqJson={aiContent.faq} rankingName={getRankingTitle(rankingItem)} />
            : null
        }
      />
    </>
  );
}
