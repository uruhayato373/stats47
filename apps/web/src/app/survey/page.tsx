import { Fragment } from "react";

/**
 * 調査名一覧ページ（Server Component）
 *
 * `/survey` でアクセスされ、全調査の一覧を表示。
 */

import { canonicalSurveyHubKey, hrefFor } from "@stats47/data-configs/content/href";
import {
  readRankingItemsBySurveyFromR2,
  readSurveysFromR2,
} from "@stats47/ranking/server";
import { isOk } from "@stats47/types";

import { PageShell, PageHeader, Breadcrumbs } from "@/components/layout";
import { SurfaceLinkCard } from "@/components/surface";

import { AdRow, composeAdRows, InFeedAdSlot } from "@/features/ads";

import { CONTENT_FOOTER, SURVEY_INDEX_INFEED } from "@/lib/google-adsense";
import { generateOGMetadata } from "@/lib/metadata/og-generator";

import { DEFAULT_OGP_IMAGE_PATH } from "@/config/site";

import type { Metadata } from "next";


/**
 * R2 依存ページのため build 時 prerender を禁止する (force-dynamic)。
 * 旧実装は静的 prerender で build 時に R2 を読めず「空の調査一覧」が永久固着した
 * (x-nextjs-stale-time=4294967294、本 OpenNext 構成は ISR 再生成が効かない)。
 * 正典: .claude/rules/nextjs-ssg-preservation.md / app/page.tsx (home) と同パターン。
 */
export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  const title = "調査別ランキング一覧";
  const description =
    "政府統計調査ごとの都道府県別ランキング一覧。国勢調査、家計調査、人口動態統計など、各調査のデータを活用したランキングを閲覧できます。";

  return {
    title,
    description,
    alternates: { canonical: "/survey" },
    ...generateOGMetadata({ title, description, imageUrl: DEFAULT_OGP_IMAGE_PATH }),
  };
}

/** インフィード広告を入れる位置 (何件目の後か) */
const SURVEY_INDEX_INFEED_AFTER = 25;

export default async function SurveyIndexPage() {
  const surveysResult = await readSurveysFromR2();
  const surveys = isOk(surveysResult) ? surveysResult.data : [];

  // 各調査の件数は all.json に焼き込まれた itemCount を使う (exporter が items.json 生成時に
  // 埋める → 1 fetch で描画完了)。焼き込み前の古い all.json に対しては per-survey items.json の
  // length にフォールバックする (調査数 ~40 の並列 fetch、移行期の安全網)。
  const counts = await Promise.all(
    surveys.map(async (s) => {
      if (s.itemCount !== undefined) return [s.id, s.itemCount] as const;
      const result = await readRankingItemsBySurveyFromR2(s.id);
      return [s.id, isOk(result) ? result.data.length : 0] as const;
    }),
  );
  // 同じ調査の別 ID の件数はハブ側へ足し、別 ID のカードは出さない (家計調査のハブを 1 つにまとめた。2026-11-02)
  const countMap = new Map<string, number>();
  for (const [id, count] of counts) {
    const hub = canonicalSurveyHubKey(id);
    countMap.set(hub, (countMap.get(hub) ?? 0) + count);
  }

  const sortedSurveys = surveys.filter((s) => canonicalSurveyHubKey(s.id) === s.id).filter((s) => {
    const count = countMap.get(s.id) ?? 0;
    return count > 0;
  });

  // 広告の段: ページの最後に AdSense 1 つを本文の幅いっぱい (上限 580px) に出す (2026-11-12 オーナー決定でアフィリエイトを止め、PR を外した)
  const [indexRow] = composeAdRows([['adsense']], [CONTENT_FOOTER], []);
  return (
    <PageShell>
      <Breadcrumbs
        items={[
          { label: "ホーム", href: "/" },
          { label: "調査別ランキング" },
        ]}
      />
      <PageHeader
        eyebrow="政府統計"
        title="調査別ランキング一覧"
        description="政府統計調査ごとに、都道府県別ランキングを分類しています。各調査をクリックすると、その調査データに基づくランキングの一覧を閲覧できます。"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedSurveys.map((survey, index) => {
          const count = countMap.get(survey.id) ?? 0;
          return (
            <Fragment key={survey.id}>
            <SurfaceLinkCard
              href={hrefFor("survey", { surveyKey: survey.id })}
              className="block"
            >
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-base truncate">
                    {survey.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {survey.organization}
                  </p>
                </div>
                <span className="ml-2 shrink-0 bg-primary/10 text-primary text-xs font-medium px-2 py-0.5 rounded">
                  {count}件
                </span>
              </div>
              {survey.description && (
                <p className="mt-2 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                  {survey.description}
                </p>
              )}
            </SurfaceLinkCard>
            {/* 一覧が 1 列のとき (スマホ) 25 件目の後にインフィード広告 (2026-11-13 オーナー決定。一覧は約 15,000px 続く) */}
            {index + 1 === SURVEY_INDEX_INFEED_AFTER && index + 1 < sortedSurveys.length && (
              <div className="md:hidden"><InFeedAdSlot slot={SURVEY_INDEX_INFEED} /></div>
            )}
            </Fragment>
          );
        })}
      </div>

      {/* コンテンツ末尾の全幅フッター広告 */}
      {indexRow.length > 0 && <AdRow cells={indexRow} position="survey-index-row" trackingCategory="survey-index" wide />}
    </PageShell>
  );
}
