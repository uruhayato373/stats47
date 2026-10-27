import type { ReactNode } from 'react';

import { cn } from '@stats47/components';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuSubButton,
} from '@stats47/components/atoms/ui/sidebar';
import { hrefFor } from "@stats47/data-configs/content/href";
import { ChevronDown, ListTree } from 'lucide-react';

import Link from '@/components/atoms/SiteLink';
import { RailCategoryList } from '@/components/rail';
import { SectionIndexLink } from '@/components/section';
import { RailCard } from '@/components/surface';

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
  categories: readonly SurveyNavCategory[];
}

/**
 * 本文上部のナビの出し分け。サイドバーの開閉で本文幅が変わるので、ビューポートではなく
 * Shell の名前付きコンテナ `@container/shell` の幅で決める。656px = 2 枚のカードが並べられる本文幅。
 * 広い幅はカード 2 枚 (SurveySideNav)、狭い幅は折りたたみ 1 つ (SurveyMobileNav)。
 */
const WIDE_ONLY_CLASS = 'hidden @min-[656px]/shell:grid';
const NARROW_ONLY_CLASS = '@min-[656px]/shell:hidden';

/**
 * ページ内リンク行。テンプレートの SidebarMenuSubButton (h-7) に、モバイル 44px のタップ領域を足す。
 * SidebarMenuButton は SidebarProvider の context を必須にするため、context を読まない Sub 版を使う。
 */
function SurveyMenuLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <SidebarMenuItem>
      <SidebarMenuSubButton
        className={cn('h-auto min-h-11 translate-x-0 py-1.5 sm:min-h-8', className)}
        render={<Link href={href} />}
      >
        <span>{children}</span>
      </SidebarMenuSubButton>
    </SidebarMenuItem>
  );
}

/**
 * 調査詳細のページ内ナビ (本文上部のカード 2 枚)。
 *
 * 2026-10-28 (テンプレート寄せ): サイドバーの右にもう 1 本の列 (左レール) を作るのをやめ、
 * 「このページ」「関連する分類」を本文のグリッドに置いて本文の左端に揃えた。中身の無い
 * 見出しだけの「調査」カードは撤去し、調査一覧への出口は「このページ」の見出しの右端に置く。
 * 代表ランキングは本文の節が同じ内容を持つので、ここでは繰り返さない。
 */
export function SurveySideNav({ pageLinks, categories }: SurveyNavigationProps) {
  return (
    <div
      className={cn(
        WIDE_ONLY_CLASS,
        'mb-8 items-start gap-4',
        categories.length > 0 && 'grid-cols-2'
      )}
    >
      <RailCard
        title="このページ"
        aria-label="このページ"
        headerAction={<SectionIndexLink href="/survey" label="調査一覧へ" />}
      >
        <nav
          aria-label="この調査ページの内容"
          className="flex flex-wrap gap-x-5 gap-y-1"
        >
          {pageLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="py-1.5 text-sm font-medium text-foreground hover:text-primary focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/50"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </RailCard>

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
    </div>
  );
}

/** 狭い幅で、本文より前に同じ移動手段を 1 つの折りたたみにまとめて置く。 */
export function SurveyMobileNav({
  pageLinks,
  categories,
}: SurveyNavigationProps) {
  return (
    <details
      className={`group/survey-nav mb-8 border-y border-border py-2 ${NARROW_ONLY_CLASS}`}
    >
      <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 text-sm font-semibold text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/50 [&::-webkit-details-marker]:hidden">
        <ListTree className="size-4 text-muted-foreground" aria-hidden />
        このページと関連する分類
        <ChevronDown
          className="ml-auto size-4 text-muted-foreground transition-transform group-open/survey-nav:rotate-180"
          aria-hidden
        />
      </summary>
      <SidebarMenu className="mt-1">
        <SurveyMenuLink href="/survey" className="font-medium">
          調査一覧へ
        </SurveyMenuLink>
      </SidebarMenu>
      <nav aria-label="この調査ページの内容（モバイル）" className="pt-2">
        <SidebarMenu>
          {pageLinks.map((item) => (
            <SurveyMenuLink key={item.href} href={item.href}>
              {item.label}
            </SurveyMenuLink>
          ))}
        </SidebarMenu>
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
                    href={hrefFor('category', { categoryKey: category.categoryKey })}
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
