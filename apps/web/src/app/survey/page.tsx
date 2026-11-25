import { Fragment } from "react";


import { listCategories } from "@stats47/data-configs";
import { canonicalSurveyHubKey, hrefFor } from "@stats47/data-configs/content/href";
import { SURVEY_PROMINENCE } from "@stats47/data-configs/prominence/survey";
import { metricDisplayName } from "@stats47/ranking";
import {
  readRankingItemsBySurveyFromR2,
  readSurveysFromR2,
} from "@stats47/ranking/server";
import { isOk } from "@stats47/types";

import Link from "@/components/atoms/SiteLink";
import { PageShell, PageHeader, PanelGrid, Breadcrumbs } from "@/components/layout";
import { SectionHeader } from "@/components/section";

import { AdRow, composeAdRows, InFeedAdSlot } from "@/features/ads";
import { SurveyMinistryNav } from "@/features/survey";
import { groupSurveysByMinistry } from "@/features/survey/group-surveys-by-ministry";

import { CONTENT_FOOTER, SURVEY_INDEX_INFEED } from "@/lib/google-adsense";
import { getIcon } from "@/lib/icons";
import { generateOGMetadata } from "@/lib/metadata/og-generator";

import { DEFAULT_OGP_IMAGE_PATH } from "@/config/site";

import type { Metadata } from "next";

/** カテゴリのキー → lucide のアイコン名 (サイドバーのカテゴリと同じアイコン) */
const CATEGORY_ICON_NAME = new Map(listCategories().map((category) => [category.categoryKey, category.icon]));

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

/**
 * インフィード広告を入れる位置。25 件目の後から 30 件ごと (25・55・85 … 件目の後) に、同じユニットを繰り返す
 * (インフィード広告は同じフィードで同じコードを繰り返してよい。2026-11-13 オーナー決定。25 件目の後から最後まで約 12,000px 空いていた)
 */
const SURVEY_INDEX_INFEED_START = 25;
const SURVEY_INDEX_INFEED_EVERY = 30;

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

  const visibleSurveys = surveys.filter((s) => canonicalSurveyHubKey(s.id) === s.id).filter((s) => {
    const count = countMap.get(s.id) ?? 0;
    return count > 0;
  });
  // 作成した府省庁で分け、分類の中はランキングの多い順に並べる (HUB-LIST-FINDABILITY-01。約 100 の調査が規則なしで並んでいた)
  const groups = groupSurveysByMinistry(visibleSurveys, (id) => countMap.get(id) ?? 0);
  // インフィード広告の位置は分類をまたいで数える (一覧全体の何件目か)
  const groupStarts = groups.map((_, position) =>
    groups.slice(0, position).reduce((total, group) => total + group.surveys.length, 0),
  );

  // 広告の段: ページの最後に AdSense 1 つを本文の幅いっぱい (上限 580px) に出す (2026-11-12 オーナー決定でアフィリエイトを止め、PR を外した)
  const [indexRow] = composeAdRows([['adsense']], [CONTENT_FOOTER], []);
  const ministryItems = groups.map((group) => ({ id: group.id, label: group.label, count: group.surveys.length }));

  const header = (
    <>
      <Breadcrumbs
        items={[
          { label: "ホーム", href: "/" },
          { label: "調査別ランキング" },
        ]}
      />
      {/* 見出しは題名だけ (2026-11-26 オーナー判断: 説明・件数・並び順は冗長。並びは府省庁の一覧が示す) */}
      <PageHeader title="調査別ランキング一覧" />
    </>
  );

  // 府省庁から探す (2026-11-26 オーナー決定): 本文の横に右レールがある幅は右レールに追従させ、
  // 右レールが本文の下に回る幅 (モバイル・タブレット) はヘッダーの下に横に送れる列で追従させる。
  // どちらも今いる府省庁を強調するので、本文の府省庁の見出しは画面に出さない
  const rightRail =
    groups.length > 1 ? (
      <div className="hidden rail:sticky rail:top-14 rail:block">
        <SurveyMinistryNav items={ministryItems} variant="rail" />
      </div>
    ) : undefined;

  return (
    <PageShell header={header} rightRail={rightRail}>
      {groups.length > 1 && (
        <div data-cell="flush" className="sticky top-14 z-10 bg-background px-4 py-2 rail:hidden">
          <SurveyMinistryNav items={ministryItems} variant="chips" />
        </div>
      )}

      {groups.map((group, position) => {
        const start = groupStarts[position] ?? 0;
        return (
          <PanelGrid as="section" key={group.id} id={group.id} className="scroll-mt-28" aria-labelledby={`${group.id}-title`}>
            {/* 見出しは読み上げと検索エンジン向けだけに残す (画面では府省庁の一覧の強調が今いる府省庁を示す) */}
            <SectionHeader
              title={<span id={`${group.id}-title`}>{group.label}（{group.surveys.length} 調査）</span>}
              hideRule
              className="sr-only p-0!"
            />
            <PanelGrid className="@md:grid-cols-2 @lg:grid-cols-3">
              {group.surveys.map((survey, groupIndex) => {
                const index = start + groupIndex;
                const count = countMap.get(survey.id) ?? 0;
                const prominence = SURVEY_PROMINENCE[survey.id];
                const Icon = getIcon(CATEGORY_ICON_NAME.get(prominence?.categoryKey ?? "") ?? "");
                const representatives = prominence?.representatives ?? [];
                return (
                  <Fragment key={survey.id}>
                    <article className="flex min-w-0 flex-col gap-3">
                      <div className="flex items-start gap-3">
                        <span
                          aria-hidden="true"
                          className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground"
                        >
                          <Icon className="size-5" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-base font-semibold leading-snug">
                            <Link href={hrefFor("survey", { surveyKey: survey.id })} className="hover:text-primary hover:underline">
                              {survey.name}
                            </Link>
                          </h3>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {survey.organization} ・ {count}件
                          </p>
                        </div>
                      </div>
                      {/* 説明はモバイルでは出さない (代表の指標で何が分かるかを示し、一覧の長さを抑える) */}
                      {survey.description && (
                        <p className="hidden text-xs leading-relaxed text-muted-foreground line-clamp-2 sm:block">
                          {survey.description}
                        </p>
                      )}
                      {representatives.length > 0 && (
                        // モバイルは「・」区切りの 1 行 (入りきらない分は末尾を省く。一覧の長さを今と同程度に保つ)、sm 以上は 1 行 1 指標
                        <ul
                          aria-label={`${survey.name}で分かる指標`}
                          className="truncate border-t border-border pt-2 text-sm sm:flex sm:flex-col sm:gap-1 sm:whitespace-normal"
                        >
                          {representatives.map((representative, representativeIndex) => (
                            <li key={representative.rankingKey} className="inline min-w-0 sm:block sm:truncate">
                              {representativeIndex > 0 && <span aria-hidden="true" className="text-muted-foreground sm:hidden">・</span>}
                              <Link
                                href={hrefFor("ranking", { rankingKey: representative.rankingKey })}
                                className="text-foreground hover:text-primary hover:underline"
                              >
                                {metricDisplayName(representative)}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </article>
                    {/* 一覧が 1 列のとき (スマホ) 25 件目の後から 30 件ごとにインフィード広告 (2026-11-13 オーナー決定) */}
                    {index + 1 >= SURVEY_INDEX_INFEED_START &&
                      (index + 1 - SURVEY_INDEX_INFEED_START) % SURVEY_INDEX_INFEED_EVERY === 0 &&
                      visibleSurveys.length - (index + 1) >= 3 && (
                        <div data-cell="flush" className="md:hidden"><InFeedAdSlot slot={SURVEY_INDEX_INFEED} /></div>
                      )}
                  </Fragment>
                );
              })}
            </PanelGrid>
          </PanelGrid>
        );
      })}

      {/* コンテンツ末尾の全幅フッター広告 */}
      {indexRow.length > 0 && <AdRow cells={indexRow} position="survey-index-row" trackingCategory="survey-index" wide />}
    </PageShell>
  );
}
