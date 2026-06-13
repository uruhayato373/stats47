/**
 * 調査名ハブページ（Server Component）
 *
 * `/survey/{surveyKey}` でアクセスされ、
 * 調査概要 + 関連ランキング一覧を表示。
 */

import { notFound } from "next/navigation";


import {
  readRankingItemsBySurveyFromR2,
  readSurveyByIdFromR2,
  readSurveysFromR2,
} from "@stats47/ranking/server";
import { isOk } from "@stats47/types";

import { resolveAffiliateBanners } from "@/features/ads/server";
import {
  FeaturedRankingCard,
  CategoryRankingTable,
  isCaveatNote,
  type CategoryRankingListItem,
} from "@/features/ranking";
import {
  HeroShell,
  KpiGrid,
  KpiTile,
  NativeAffiliateRow,
  SectionEyebrow,
  InfeedAd,
} from "@/features/redesign";

import { AdSenseAd, RANKING_PAGE_FOOTER, CONTENT_FOOTER } from "@/lib/google-adsense";
import { generateOGMetadata } from "@/lib/metadata/og-generator";

import type { Metadata } from "next";

/** 24時間 ISR */
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
  const result = await readSurveysFromR2();
  if (!isOk(result)) return [];
  return result.data.map((s) => ({ surveyKey: s.id }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { surveyKey } = await params;

  try {
    const result = await readSurveyByIdFromR2(surveyKey);
    const survey = isOk(result) ? result.data : null;

    if (!survey) {
      return { title: "ページが見つかりません" };
    }

    const title = `${survey.name}のランキング一覧`;
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

  const surveyResult = await readSurveyByIdFromR2(surveyKey);
  const survey = isOk(surveyResult) ? surveyResult.data : null;

  if (!survey) {
    notFound();
  }

  const [rankingResult, nativeBanners] = await Promise.all([
    readRankingItemsBySurveyFromR2(surveyKey),
    // 調査メタから推定可能な tag を渡す (fallback: economy / population)
    resolveAffiliateBanners(["economy", "population", "labor"], 4).catch(() => []),
  ]);
  const rankingItems = isOk(rankingResult) ? rankingResult.data : [];

  // Hero KPI: 最新年, 注目件数, etc.
  const featuredCount = rankingItems.filter((i) => i.isFeatured).length;
  const latestYear = rankingItems
    .map((i) => parseLatestYear(i.latestYear))
    .filter((y) => y && y.match(/^\d{4}$/))
    .sort()
    .pop() ?? "";

  const r2PublicUrl =
    process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "https://storage.stats47.jp";

  const allItems: CategoryRankingListItem[] = rankingItems.map((item) => {
    const latestYear = parseLatestYear(item.latestYear);
    return {
      rankingKey: item.rankingKey,
      areaType: "prefecture",
      title:
        item.subtitle && !isCaveatNote(item.subtitle)
          ? `${item.title}（${item.subtitle}）`
          : item.title,
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
        title:
          item.subtitle && !isCaveatNote(item.subtitle)
            ? `${item.title}（${item.subtitle}）`
            : item.title,
        latestYear,
        unit: item.unit,
        demographicAttr: item.demographicAttr,
        normalizationBasis: item.normalizationBasis,
        baseThumbnailUrl: `${r2PublicUrl}/ranking/prefecture/${item.rankingKey}/${latestYear}/thumbnails/thumbnail`,
      };
    });

  if (rankingItems.length === 0) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-4 text-foreground">
      {/* Hero (D 暗色) — マスタープラン § 5.3 準拠 */}
      <HeroShell variant="dark" className="mb-6">
        <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-[1fr,360px] md:p-8">
          <div className="min-w-0">
            <p className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-0.5 text-[10.5px] font-bold uppercase tracking-widest text-white">
              📊 政府統計
            </p>
            <h1 className="mt-2 text-2xl font-extrabold leading-tight text-white sm:text-3xl">
              {survey.name}
            </h1>
            <p className="mt-2 text-sm font-medium text-white/80">
              {survey.organization}
            </p>
            {survey.description && (
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/80">
                {survey.description}
              </p>
            )}
            {survey.url && (
              <a
                href={survey.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1 rounded-md border border-white/30 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-white/10"
              >
                公式サイト ↗
              </a>
            )}
          </div>
          <div>
            <KpiGrid columns={2}>
              <KpiTile
                label="ランキング数"
                value={String(rankingItems.length)}
                unit="件"
                variant="dark"
              />
              <KpiTile
                label="注目"
                value={String(featuredCount)}
                unit="件"
                variant="dark"
              />
              <KpiTile
                label="最新データ"
                value={latestYear || "—"}
                unit={latestYear ? "年" : ""}
                variant="dark"
              />
              <KpiTile
                label="エリア"
                value="47"
                unit="都道府県"
                variant="dark"
              />
            </KpiGrid>
          </div>
        </div>
      </HeroShell>

      {featuredItems.length > 0 && (
        <section className="mb-8">
          <SectionEyebrow number="1.">注目のランキング</SectionEyebrow>
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

      <section className="mb-8">
        <SectionEyebrow number="2.">
          全{rankingItems.length}件のランキング
        </SectionEyebrow>
        <CategoryRankingTable items={allItems} />
      </section>

      {/* AdSense */}
      <div className="mb-8">
        <InfeedAd
          slotId={CONTENT_FOOTER.slotId}
          format={CONTENT_FOOTER.format}
        />
      </div>

      {/* ネイティブアフィリエイト */}
      {nativeBanners.length > 0 && (
        <section className="mb-8">
          <SectionEyebrow number="3.">関連書籍・データブック</SectionEyebrow>
          <NativeAffiliateRow
            title={`${survey.name}に関連する書籍`}
            banners={nativeBanners}
            position="survey-native"
            trackingCategory={`survey-${surveyKey}`}
          />
        </section>
      )}

      {/* AdSense (footer) */}
      <AdSenseAd
        format={RANKING_PAGE_FOOTER.format}
        slotId={RANKING_PAGE_FOOTER.slotId}
      />
    </div>
  );
}
