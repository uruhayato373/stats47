'use client';

import { hrefFor } from '@stats47/data-configs/content/href';

import { isLinkableSurveyId } from '@/components/molecules/SourceAttribution';

import { SourcesSheet } from './SourcesSheet';

import type { SourceAttribution as SourceAttributionData } from '@stats47/data-configs';

export interface ChartFooterLink {
  label: string;
  url: string;
}

export interface ChartFooterProps {
  id?: string;
  source?: string;
  sourceLink?: string | null;
  /** taxonomy が解決した調査ハブ。手書きせず既存 lineage から渡す。 */
  sourceLinks?: ChartFooterLink[];
  sourceDetail?: string;
  attribution?: SourceAttributionData | null;
  annotation?: string;
  rankingLink?: string | null;
  rankingLabel?: string;
  rankingLinks?: ChartFooterLink[];
}

function dedupeLinks(links: readonly ChartFooterLink[]): ChartFooterLink[] {
  const byUrl = new Map<string, ChartFooterLink>();
  for (const link of links) {
    const label = link.label.trim();
    const url = link.url.trim();
    if (label && url && !byUrl.has(url)) byUrl.set(url, { label, url });
  }
  return [...byUrl.values()];
}

/**
 * 全チャート共通の provenance / 指標ハブ導線。
 *
 * 誤読を防ぐ注記 (annotation) はチャートの下にそのまま見せる。出典・指標の定義・ランキングへのリンクは
 * 「出典・指標の定義」のボタン 1 つから開く Sheet (SourcesSheet) にまとめる (2026-10-30 オーナー決定。
 * 旧: 「出典」「ランキング」のリンクと、複数のときの「出典 2件 ▾」のメニューをチャートの下に並べていた)。
 */
export function ChartFooter({
  id,
  source,
  sourceLink,
  sourceLinks,
  sourceDetail,
  attribution,
  annotation,
  rankingLink,
  rankingLabel = '関連ランキング',
  rankingLinks,
}: ChartFooterProps) {
  const attributionSourceLinks = (attribution?.originalSurveys ?? [])
    .filter((survey) => isLinkableSurveyId(survey.id))
    .map((survey) => ({
      label: survey.name,
      url: hrefFor('survey', { surveyKey: survey.id }),
    }));
  const resolvedSourceLinks = dedupeLinks([
    ...(sourceLinks ?? []),
    ...attributionSourceLinks,
  ]);
  const fallbackSourceLink =
    sourceLink ?? attribution?.compilation?.url ?? null;
  const sourceTargets =
    resolvedSourceLinks.length > 0
      ? resolvedSourceLinks
      : fallbackSourceLink
        ? [
            {
              label:
                source ?? attribution?.compilation?.name ?? '公式出典を開く',
              url: fallbackSourceLink,
            },
          ]
        : [];
  const sourceLabel =
    source ??
    attribution?.compilation?.name ??
    sourceTargets[0]?.label ??
    undefined;

  const indicatorTargets = dedupeLinks([
    ...(rankingLink ? [{ label: rankingLabel, url: rankingLink }] : []),
    ...(rankingLinks ?? []),
  ]);
  const hasSource = Boolean(sourceLabel || sourceTargets.length > 0);

  if (!hasSource && !annotation && indicatorTargets.length === 0) return null;

  // url の無い出典 (独自集計など) は名前だけを Sheet に出す
  const sources =
    sourceTargets.length > 0 ? sourceTargets : sourceLabel ? [{ label: sourceLabel }] : [];

  return (
    <div className="space-y-1.5">
      {annotation && (
        <p className="text-left text-xs leading-relaxed text-muted-foreground">
          {annotation}
        </p>
      )}
      {(hasSource || indicatorTargets.length > 0) && (
        <div className="flex justify-end">
          <SourcesSheet
            id={id ? `${id}-sources` : undefined}
            groups={[{ sources, sourceDetail, rankings: indicatorTargets }]}
          />
        </div>
      )}
    </div>
  );
}
