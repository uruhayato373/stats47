/**
 * 調査名ハブページ（Server Component）
 *
 * `/survey/{surveyKey}` でアクセスされ、
 * 調査概要 + 関連ランキング一覧を表示。
 */

import { notFound } from "next/navigation";


import {
  findSurveyById,
  listSurveys,
  findRankingItemsBySurvey,
} from "@stats47/ranking/server";
import { isOk } from "@stats47/types";

import {
  FeaturedRankingCard,
  CategoryRankingTable,
  type CategoryRankingListItem,
} from "@/features/ranking";

import { generateOGMetadata } from "@/lib/metadata/og-generator";

import type { Metadata } from "next";

export const revalidate = 86400;

interface PageProps {
  params: Promise<{ surveyKey: string }>;
}

function parseLatestYear(latestYear: unknown): string {
  try {
    const parsed =
      typeof latestYear === "string" ? JSON.parse(latestYear) : latestYear;
    if (parsed?.yearCode) return parsed.yearCode;
  } catch {
    /* fallback */
  }
  return "2024";
}

export async function generateStaticParams() {
  const result = await listSurveys();
  if (!isOk(result)) return [];
  return result.data.map((s) => ({ surveyKey: s.id }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { surveyKey } = await params;

  try {
    const result = await findSurveyById(surveyKey);
    const survey = isOk(result) ? result.data : null;

    if (!survey) {
      return { title: "ページが見つかりません" };
    }

    const title = `${survey.name}のランキング一覧 | 統計で見る都道府県`;
    const description = `${survey.organization}「${survey.name}」に基づく都道府県別ランキング一覧。47都道府県を統計データで比較できます。`;

    return {
      title,
      description,
      alternates: {
        canonical: `/survey/${surveyKey}`,
      },
      ...generateOGMetadata({ title, description, imageUrl: "/og-image.jpg" }),
    };
  } catch {
    return { title: "調査別ランキング一覧" };
  }
}

export default async function SurveyPage({ params }: PageProps) {
  const { surveyKey } = await params;

  const surveyResult = await findSurveyById(surveyKey);
  const survey = isOk(surveyResult) ? surveyResult.data : null;

  if (!survey) {
    notFound();
  }

  const rankingResult = await findRankingItemsBySurvey(surveyKey);
  const rankingItems = isOk(rankingResult) ? rankingResult.data : [];

  const r2PublicUrl =
    process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "https://storage.stats47.jp";

  const allItems: CategoryRankingListItem[] = rankingItems.map((item) => {
    const latestYear = parseLatestYear(item.latestYear);
    return {
      rankingKey: item.rankingKey,
      areaType: item.areaType,
      title: item.subtitle ? `${item.title} (${item.subtitle})` : item.title,
      subtitle: item.subtitle,
      latestYear,
      unit: item.unit,
      description: item.description,
      demographicAttr: item.demographicAttr,
      normalizationBasis: item.normalizationBasis,
    };
  });

  const seenKeys = new Set<string>();
  const featuredItems = rankingItems
    .filter((item) => {
      if (!item.isFeatured) return false;
      if (seenKeys.has(item.rankingKey)) return false;
      seenKeys.add(item.rankingKey);
      return true;
    })
    .map((item) => {
      const latestYear = parseLatestYear(item.latestYear);
      return {
        rankingKey: item.rankingKey,
        title: item.subtitle
          ? `${item.title} (${item.subtitle})`
          : item.title,
        latestYear,
        unit: item.unit,
        demographicAttr: item.demographicAttr,
        normalizationBasis: item.normalizationBasis,
        baseThumbnailUrl: `${r2PublicUrl}/ranking/prefecture/${item.rankingKey}/${latestYear}/thumbnails/thumbnail`,
      };
    });

  return (
    <div className="container mx-auto px-4 py-6 text-foreground">
      {/* ヘッダー */}
      <div className="mb-6">
        <h1 className="text-lg font-bold">
          {survey.name}
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            {rankingItems.length}件
          </span>
        </h1>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <span className="bg-muted/50 px-2 py-0.5 rounded">
            {survey.organization}
          </span>
          {survey.url && (
            <a
              href={survey.url}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary transition-colors underline underline-offset-2"
            >
              公式サイト
            </a>
          )}
        </div>
        {survey.description && (
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            {survey.description}
          </p>
        )}
      </div>

      {rankingItems.length === 0 ? (
        <div className="text-center py-20 bg-muted/30 rounded-lg">
          <p className="text-muted-foreground text-lg">
            該当するランキングが見つかりませんでした。
          </p>
        </div>
      ) : (
        <>
          {featuredItems.length > 0 && (
            <section className="mb-10">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                注目のランキング
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {featuredItems.map((item) => (
                  <FeaturedRankingCard
                    key={item.rankingKey}
                    rankingKey={item.rankingKey}
                    title={item.title}
                    baseThumbnailUrl={item.baseThumbnailUrl}
                    latestYear={item.latestYear}
                    unit={item.unit}
                    demographicAttr={item.demographicAttr}
                    normalizationBasis={item.normalizationBasis}
                  />
                ))}
              </div>
            </section>
          )}

          <CategoryRankingTable items={allItems} />
        </>
      )}
    </div>
  );
}
