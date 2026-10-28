'use client';

import { useState, useSyncExternalStore } from 'react';

import { Button } from '@stats47/components/atoms/ui/button';
import { LazyTooltip } from '@stats47/components/molecules/lazy-select';
import { hrefFor } from '@stats47/data-configs/content/href';
import {
  BookOpenText,
  ChartNoAxesColumnIncreasing,
  ChevronDown,
  ExternalLink,
} from 'lucide-react';

import Link from '@/components/atoms/SiteLink';
import { isLinkableSurveyId } from '@/components/molecules/SourceAttribution';

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

type FooterActionKind = 'source' | 'ranking';

/** 補助ラベルを出すまでの待ち (旧 TooltipProvider delay={250} と同じ) */
const TOOLTIP_DELAY_MS = 250;

const ACTION_CLASS_NAME =
  'inline-flex min-h-8 max-w-full items-center gap-1.5 px-1 text-xs font-medium underline-offset-2 transition-colors hover:text-primary hover:underline focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/50';

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
  // 補助ラベル (Tooltip) の JS は hover / キーボードの focus で読む (配信サイズ策 D・LazyTooltip)
  return (
    <LazyTooltip
      content={link.label}
      side="top"
      contentClassName="max-w-72"
      delay={TOOLTIP_DELAY_MS}
      render={
        external ? (
          <a
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={link.label}
            className={ACTION_CLASS_NAME}
          />
        ) : (
          <Link
            href={link.url}
            aria-label={link.label}
            className={ACTION_CLASS_NAME}
          />
        )
      }
    >
      {content}
    </LazyTooltip>
  );
}

const MENU_TRIGGER_CLASS_NAME = 'font-medium text-muted-foreground';

interface FooterMenuTriggerLabelProps {
  kind: FooterActionKind;
  visibleLabel: string;
  count: number;
}

function FooterMenuTriggerLabel({
  kind,
  visibleLabel,
  count,
}: FooterMenuTriggerLabelProps) {
  return (
    <>
      <ActionIcon kind={kind} />
      <span>
        {visibleLabel} {count}件
      </span>
      <ChevronDown className="size-3" aria-hidden />
    </>
  );
}

type DropdownMenuModule =
  typeof import('@stats47/components/atoms/ui/dropdown-menu');

/**
 * DropdownMenu (Base UI Menu) は初回の pointerenter / focus で読み始め、押されたら本物に置き換えて開く
 * (配信サイズ策 D)。閉じている間は同じ Button を同じクラス・aria で描き、チャートの初回配信にメニューの JS を載せない。
 * 置き換えは押したときだけにする (hover で置き換えると、押す途中でボタンの要素が入れ替わり押下が失われる)。
 */
let dropdownMenuRequest: Promise<void> | null = null;
let loadedDropdownMenu: DropdownMenuModule | null = null;
const dropdownMenuListeners = new Set<() => void>();

function loadDropdownMenu(): void {
  dropdownMenuRequest ??=
    import('@stats47/components/atoms/ui/dropdown-menu').then((loaded) => {
      loadedDropdownMenu = loaded;
      dropdownMenuListeners.forEach((listener) => listener());
    });
}

function subscribeDropdownMenu(listener: () => void) {
  dropdownMenuListeners.add(listener);
  return () => {
    dropdownMenuListeners.delete(listener);
  };
}

function useLoadedDropdownMenu(): DropdownMenuModule | null {
  return useSyncExternalStore(
    subscribeDropdownMenu,
    () => loadedDropdownMenu,
    () => null
  );
}

interface LoadedFooterMenuProps extends FooterMenuTriggerLabelProps {
  menu: DropdownMenuModule;
  id?: string;
  links: ChartFooterLink[];
  tooltip: string;
}

/** 押されたあとに描く本物のメニュー。押した操作の続きとして開いた状態で始める。 */
function LoadedFooterMenu({
  menu,
  id,
  kind,
  visibleLabel,
  count,
  links,
  tooltip,
}: LoadedFooterMenuProps) {
  const {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
  } = menu;
  const [open, setOpen] = useState(true);
  const triggerId = id ? `${id}-trigger` : undefined;
  const contentId = id ? `${id}-content` : undefined;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        {...(id
          ? { id: triggerId, 'aria-controls': open ? contentId : undefined }
          : {})}
        render={
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-label={`${visibleLabel}${count}件を表示`}
            title={tooltip}
            className={MENU_TRIGGER_CLASS_NAME}
          />
        }
      >
        <FooterMenuTriggerLabel
          kind={kind}
          visibleLabel={visibleLabel}
          count={count}
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="max-w-80"
        {...(id ? { id: contentId, 'aria-labelledby': triggerId } : {})}
      >
        {links.map((link) => {
          const external = isExternalUrl(link.url);
          return (
            <DropdownMenuItem
              key={link.url}
              render={
                external ? (
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={link.label}
                    className="flex w-full items-center gap-2"
                  />
                ) : (
                  <Link
                    href={link.url}
                    aria-label={link.label}
                    className="flex w-full items-center gap-2"
                  />
                )
              }
            >
              <span className="min-w-0 flex-1 whitespace-normal leading-relaxed">
                {link.label}
              </span>
              {external && (
                <ExternalLink className="size-3 shrink-0" aria-hidden />
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function FooterActionMenu({
  id,
  kind,
  links,
  tooltip,
}: {
  id?: string;
  kind: FooterActionKind;
  links: ChartFooterLink[];
  tooltip: string;
}) {
  const visibleLabel = kind === 'source' ? '出典' : 'ランキング';
  const [activated, setActivated] = useState(false);
  const menu = useLoadedDropdownMenu();

  if (menu && activated) {
    return (
      <LoadedFooterMenu
        menu={menu}
        id={id}
        kind={kind}
        visibleLabel={visibleLabel}
        count={links.length}
        links={links}
        tooltip={tooltip}
      />
    );
  }
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      id={id ? `${id}-trigger` : undefined}
      aria-label={`${visibleLabel}${links.length}件を表示`}
      aria-haspopup="menu"
      aria-expanded={false}
      title={tooltip}
      className={MENU_TRIGGER_CLASS_NAME}
      onPointerEnter={loadDropdownMenu}
      onFocus={loadDropdownMenu}
      onClick={() => {
        // 読み込み中に押されたら、読み終わった時点で開いた状態で描く
        setActivated(true);
        loadDropdownMenu();
      }}
    >
      <FooterMenuTriggerLabel
        kind={kind}
        visibleLabel={visibleLabel}
        count={links.length}
      />
    </Button>
  );
}

/**
 * 全チャート共通の provenance / 指標ハブ導線。
 *
 * 単一リンクは短い icon + label、複数リンクは click/focus 対応メニューへまとめる。
 * tooltip は完全名称の補助であり、主要操作を hover のみに依存させない。
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

  return (
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
              id={id ? `${id}-source` : undefined}
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
              id={id ? `${id}-ranking` : undefined}
              kind="ranking"
              links={indicatorTargets}
              tooltip={`${indicatorTargets.length}件の指標・ランキング`}
            />
          ) : null}
        </div>
      )}
    </div>
  );
}
