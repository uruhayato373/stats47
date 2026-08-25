import Link from 'next/link';

import { ListTree } from 'lucide-react';

import { LEFT_RAIL_NARROW_ONLY_CLASS } from '@/components/layout';
import { SectionHeader, SectionIndexLink } from '@/components/section';

import { SurveyOutboundLinkArea } from './SurveyOutboundLinkArea';

export interface SurveyPageNavLink {
  href: `#${string}`;
  label: string;
}

export interface SurveyNavRanking {
  rankingKey: string;
  label: string;
}

export interface SurveyNavCategory {
  categoryKey: string;
  label: string;
  count: number;
}

interface SurveyNavigationProps {
  pageLinks: readonly SurveyPageNavLink[];
  representativeRankings: readonly SurveyNavRanking[];
  categories: readonly SurveyNavCategory[];
}

/** 調査詳細のデスクトップ左レール。調査一覧ではなく、現在の出典ハブの読み方だけを担う。 */
export function SurveySideNav({
  pageLinks,
  representativeRankings,
  categories,
}: SurveyNavigationProps) {
  return (
    <div className="space-y-6 pr-1">
      <div>
        <SectionHeader
          title="調査"
          as="h2"
          action={<SectionIndexLink href="/survey" label="調査一覧へ" />}
        />
      </div>

      <nav aria-label="この調査ページの内容">
        <SectionHeader title="このページ" as="h2" />
        <ul className="border-t border-border">
          {pageLinks.map((item) => (
            <li key={item.href} className="border-b border-border">
              <a
                href={item.href}
                className="flex min-h-10 items-center px-2 text-sm font-medium text-foreground transition-colors hover:bg-accent/50 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {representativeRankings.length > 0 && (
        <details className="group border-y border-border py-2">
          <summary className="flex min-h-10 cursor-pointer list-none items-center gap-2 text-sm font-semibold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50">
            <ListTree className="size-4 text-muted-foreground" aria-hidden />
            代表ランキング（{representativeRankings.length}）
          </summary>
          <SurveyOutboundLinkArea surface="survey_ranking">
            <nav aria-label="この調査の代表ランキング" className="pb-1 pt-2">
              <ul className="space-y-1">
                {representativeRankings.map((item) => (
                  <li key={item.rankingKey}>
                    <Link
                      href={`/ranking/${item.rankingKey}`}
                      className="block py-1 text-sm leading-relaxed text-foreground hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </SurveyOutboundLinkArea>
        </details>
      )}

      {categories.length > 0 && (
        <SurveyOutboundLinkArea surface="survey_category">
          <nav aria-label="この調査に関連する分類">
            <SectionHeader title="関連する分類" as="h2" />
            <ul className="space-y-1">
              {categories.map((category) => (
                <li key={category.categoryKey}>
                  <Link
                    href={`/category/${category.categoryKey}`}
                    className="flex min-h-9 items-center justify-between gap-3 py-1 text-sm text-foreground hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                  >
                    <span>{category.label}</span>
                    <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                      {category.count}件
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </SurveyOutboundLinkArea>
      )}
    </div>
  );
}

/** 左レールが消える狭幅で、本文より前に同じ移動手段を提供する。 */
export function SurveyMobileNav({
  pageLinks,
  categories,
}: Pick<SurveyNavigationProps, 'pageLinks' | 'categories'>) {
  return (
    <details
      className={`mb-8 border-y border-border py-2 ${LEFT_RAIL_NARROW_ONLY_CLASS}`}
    >
      <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 text-sm font-semibold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50">
        <ListTree className="size-4 text-muted-foreground" aria-hidden />
        このページと関連する分類
      </summary>
      <Link
        href="/survey"
        className="mt-1 flex min-h-11 items-center border-y border-border px-2 text-sm font-medium text-foreground hover:bg-accent/50 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
      >
        調査一覧へ
      </Link>
      <nav aria-label="この調査ページの内容（モバイル）" className="pt-2">
        <ul className="border-t border-border">
          {pageLinks.map((item) => (
            <li key={item.href} className="border-b border-border">
              <a
                href={item.href}
                className="flex min-h-11 items-center px-2 text-sm"
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      {categories.length > 0 && (
        <SurveyOutboundLinkArea surface="survey_category">
          <nav aria-label="この調査に関連する分類（モバイル）" className="pt-4">
            <p className="mb-2 text-xs font-semibold text-muted-foreground">
              関連する分類
            </p>
            <ul className="flex flex-wrap gap-x-4 gap-y-2">
              {categories.map((category) => (
                <li key={category.categoryKey}>
                  <Link
                    href={`/category/${category.categoryKey}`}
                    className="text-sm text-foreground hover:text-primary hover:underline"
                  >
                    {category.label}（{category.count}）
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </SurveyOutboundLinkArea>
      )}
    </details>
  );
}
