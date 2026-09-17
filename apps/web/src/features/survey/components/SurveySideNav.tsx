import Link from 'next/link';

import { ListTree } from 'lucide-react';

import { LEFT_RAIL_NARROW_ONLY_CLASS } from '@/components/layout';
import { RailCategoryList, RailStack } from '@/components/rail';
import { SectionIndexLink } from '@/components/section';
import { RailCard, RailNavRow } from '@/components/surface';

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
    <RailStack>
      <RailCard
        title="調査"
        headerAction={<SectionIndexLink href="/survey" label="調査一覧へ" />}
        bodyClassName="p-0"
      >
        {null}
      </RailCard>

      <RailCard title="このページ" bodyClassName="p-0">
        <nav aria-label="この調査ページの内容" className="pb-2">
          {pageLinks.map((item) => (
            <RailNavRow key={item.href} href={item.href} chevron={false}>
              {item.label}
            </RailNavRow>
          ))}
        </nav>
      </RailCard>

      {representativeRankings.length > 0 && (
        <RailCard
          title={`代表ランキング（${representativeRankings.length}）`}
          icon={<ListTree className="size-4 text-muted-foreground" aria-hidden />}
          collapsible
          bodyClassName="p-0"
        >
          <SurveyOutboundLinkArea surface="survey_ranking">
            <nav aria-label="この調査の代表ランキング" className="pb-2">
              {representativeRankings.map((item) => (
                <RailNavRow
                  key={item.rankingKey}
                  href={`/ranking/${item.rankingKey}`}
                  chevron={false}
                >
                  {item.label}
                </RailNavRow>
              ))}
            </nav>
          </SurveyOutboundLinkArea>
        </RailCard>
      )}

      {categories.length > 0 && (
        // RailCategoryList は trackingSurface で自前計測するため、SurveyOutboundLinkArea
        // (click delegation による計測) で二重に包まない。
        <nav aria-label="この調査に関連する分類">
          <RailCard title="関連する分類" bodyClassName="px-4 pb-3 pt-0">
            {/* 件数は「このページの調査に含まれるランキング数」で、全サイトの件数ではない */}
            <p className="sr-only">件数はこの調査のランキング数です</p>
            <RailCategoryList
              items={categories.map((category) => ({
                categoryKey: category.categoryKey,
                categoryName: category.label,
                count: category.count,
              }))}
              trackingSurface="survey_category"
              className="-mx-4 border-t-0"
            />
          </RailCard>
        </nav>
      )}
    </RailStack>
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
        {pageLinks.map((item) => (
          <RailNavRow key={item.href} href={item.href} chevron={false}>
            {item.label}
          </RailNavRow>
        ))}
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
