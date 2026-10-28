import type { ReactNode } from 'react';

import { cn } from '@stats47/components';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuSubButton,
} from '@stats47/components/atoms/ui/sidebar';
import { hrefFor } from "@stats47/data-configs/content/href";

import Link from '@/components/atoms/SiteLink';
import { RailCategoryList } from '@/components/rail';
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
        // 2 枚の高さを揃える (items-stretch + 各カードの h-full)
        'mb-8 items-stretch gap-4',
        categories.length > 0 && 'grid-cols-2'
      )}
    >
      <RailCard
        title="このページ"
        aria-label="このページ"
        className="h-full"
        headerAction={<SectionIndexLink href="/survey">調査一覧</SectionIndexLink>}
      >
        {/* 押せると分かるよう、関連する分類と同じ矢印付きのメニュー行で並べる。
            1 列 + 区切り線 (カードの余白 16px の中で divide-y)。2 列にすると 1024px 幅で項目名が省略される */}
        <nav
          aria-label="この調査ページの内容"
          className="flex flex-col divide-y divide-border"
        >
          {pageLinks.map((item) => (
            <RailNavRow key={item.href} href={item.href}>
              {item.label}
            </RailNavRow>
          ))}
        </nav>
      </RailCard>

      {categories.length > 0 && (
        // RailCategoryList は trackingSurface で自前計測するため、SurveyOutboundLinkArea
        // (click delegation による計測) で二重に包まない。
        // 本文の余白は RailCard の既定のまま (隣の「このページ」と罫線・本文の始まりを揃える)
        <nav aria-label="この調査に関連する分類" className="h-full">
          <RailCard title="関連する分類" className="h-full">
            {/* 件数は「このページの調査に含まれるランキング数」で、全サイトの件数ではない */}
            <p className="sr-only">件数はこの調査のランキング数です</p>
            <RailCategoryList
              items={categories.map((category) => ({
                categoryKey: category.categoryKey,
                categoryName: category.label,
                count: category.count,
              }))}
              trackingSurface="survey_category"
              className="p-0"
            />
          </RailCard>
        </nav>
      )}
    </div>
  );
}

/**
 * 狭い幅で、本文より前に同じ移動手段を 1 つの折りたたみにまとめて置く。
 * 開閉は共通の RailCard (collapsible・既定は閉じる)。中身は閉じている間も HTML に残る。
 */
export function SurveyMobileNav({
  pageLinks,
  categories,
}: SurveyNavigationProps) {
  return (
    <RailCard
      title="このページと関連する分類"
      collapsible
      className={`mb-8 ${NARROW_ONLY_CLASS}`}
    >
      <SidebarMenu className="divide-y divide-border">
        <SurveyMenuLink href="/survey" className="font-medium">
          調査一覧へ
        </SurveyMenuLink>
      </SidebarMenu>
      <nav aria-label="この調査ページの内容（モバイル）" className="pt-2">
        <SidebarMenu className="divide-y divide-border">
          {pageLinks.map((item) => (
            <SurveyMenuLink key={item.href} href={item.href}>
              {item.label}
            </SurveyMenuLink>
          ))}
        </SidebarMenu>
      </nav>
      {categories.length > 0 && (
        <SurveyOutboundLinkArea surface="survey_category">
          <nav aria-label="この調査に関連する分類（モバイル）" className="pt-4 pb-1">
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
    </RailCard>
  );
}
