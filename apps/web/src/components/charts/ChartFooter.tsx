'use client';

import Link from 'next/link';

import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@stats47/components';
import {
  BookOpenText,
  ChartNoAxesColumnIncreasing,
  ChevronDown,
  ExternalLink,
} from 'lucide-react';

import { isLinkableSurveyId } from '@/components/molecules/SourceAttribution';

import type { SourceAttribution as SourceAttributionData } from '@stats47/data-configs';

export interface ChartFooterLink {
  label: string;
  url: string;
}

export interface ChartFooterProps {
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

type FooterActionKind = 'source' | 'ranking';

const ACTION_CLASS_NAME =
  'inline-flex min-h-8 max-w-full items-center gap-1.5 px-1 text-xs font-medium underline-offset-2 transition-colors hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50';

function isExternalUrl(url: string): boolean {
  return /^https?:\/\//.test(url);
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

function ActionIcon({ kind }: { kind: FooterActionKind }) {
  return kind === 'source' ? (
    <BookOpenText className="size-4 shrink-0" aria-hidden />
  ) : (
    <ChartNoAxesColumnIncreasing className="size-4 shrink-0" aria-hidden />
  );
}

function FooterActionLink({
  kind,
  link,
  visibleLabel,
}: {
  kind: FooterActionKind;
  link: ChartFooterLink;
  visibleLabel: string;
}) {
  const external = isExternalUrl(link.url);
  const content = (
    <>
      <ActionIcon kind={kind} />
      <span className="max-w-52 truncate">{visibleLabel}</span>
      {external && <ExternalLink className="size-3 shrink-0" aria-hidden />}
    </>
  );
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {external ? (
          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={link.label}
            className={ACTION_CLASS_NAME}
          >
            {content}
          </a>
        ) : (
          <Link
            href={link.url}
            aria-label={link.label}
            className={ACTION_CLASS_NAME}
          >
            {content}
          </Link>
        )}
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-72">
        {link.label}
      </TooltipContent>
    </Tooltip>
  );
}

function FooterActionMenu({
  kind,
  links,
  tooltip,
}: {
  kind: FooterActionKind;
  links: ChartFooterLink[];
  tooltip: string;
}) {
  const visibleLabel = kind === 'source' ? '出典' : 'ランキング';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label={`${visibleLabel}${links.length}件を表示`}
          title={tooltip}
          className="h-8 gap-1.5 px-1 text-xs font-medium text-muted-foreground hover:bg-transparent hover:text-primary focus-visible:ring-2 focus-visible:ring-primary/50"
        >
          <ActionIcon kind={kind} />
          <span>
            {visibleLabel} {links.length}件
          </span>
          <ChevronDown className="size-3" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-w-80">
        {links.map((link) => {
          const content = (
            <>
              <span className="min-w-0 flex-1 whitespace-normal leading-relaxed">
                {link.label}
              </span>
              {isExternalUrl(link.url) && (
                <ExternalLink className="size-3 shrink-0" aria-hidden />
              )}
            </>
          );
          return (
            <DropdownMenuItem key={link.url} asChild>
              {isExternalUrl(link.url) ? (
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={link.label}
                  className="flex w-full items-center gap-2"
                >
                  {content}
                </a>
              ) : (
                <Link
                  href={link.url}
                  aria-label={link.label}
                  className="flex w-full items-center gap-2"
                >
                  {content}
                </Link>
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * 全チャート共通の provenance / 指標ハブ導線。
 *
 * 単一リンクは短い icon + label、複数リンクは click/focus 対応メニューへまとめる。
 * tooltip は完全名称の補助であり、主要操作を hover のみに依存させない。
 */
export function ChartFooter({
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
      url: `/survey/${survey.id}`,
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

  return (
    <TooltipProvider delayDuration={250}>
      <div className="space-y-1.5">
        {annotation && (
          <p className="text-left text-xs leading-relaxed text-muted-foreground">
            {annotation}
          </p>
        )}
        {(hasSource || indicatorTargets.length > 0) && (
          <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1 text-muted-foreground">
            {sourceTargets.length === 1 ? (
              <FooterActionLink
                kind="source"
                link={{
                  ...sourceTargets[0],
                  label: `出典: ${sourceLabel ?? sourceTargets[0].label}`,
                }}
                visibleLabel="出典"
              />
            ) : sourceTargets.length > 1 ? (
              <FooterActionMenu
                kind="source"
                links={sourceTargets}
                tooltip={`出典: ${sourceLabel ?? sourceTargets.map((link) => link.label).join('・')}`}
              />
            ) : sourceLabel ? (
              <span className="inline-flex min-h-8 max-w-full items-center gap-1.5 px-1 text-xs">
                <BookOpenText className="size-4 shrink-0" aria-hidden />
                <span className="max-w-52 truncate" title={sourceLabel}>
                  {sourceLabel}
                </span>
              </span>
            ) : null}
            {sourceDetail && (
              <span className="text-xs">（{sourceDetail}）</span>
            )}
            {indicatorTargets.length === 1 ? (
              <FooterActionLink
                kind="ranking"
                link={indicatorTargets[0]}
                visibleLabel="ランキング"
              />
            ) : indicatorTargets.length > 1 ? (
              <FooterActionMenu
                kind="ranking"
                links={indicatorTargets}
                tooltip={`${indicatorTargets.length}件の指標・ランキング`}
              />
            ) : null}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
