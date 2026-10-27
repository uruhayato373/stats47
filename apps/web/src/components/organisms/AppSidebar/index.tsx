/**
 * サイト全体のナビ (Server Component)。テンプレート (shadcndashboard) の app-sidebar に寄せたサイドバー。
 *
 * - リンクはすべてここで組み立て、SSR の HTML に a[href] で出す (テンプレートの Suspense + NavSkeleton と
 *   SimpleBar は写さない)。現在地の判定と開閉だけを AppSidebarClient の小さな部品に閉じ込める
 * - lg (1024px) 未満では hydration 後に Sheet に替わり、閉じている間は DOM からリンクが消える。
 *   検索エンジン向けには Footer に主要ナビと「すべてのテーマ」のリンクを常に出して補う
 * - テンプレートと同じ variant="inset"。ルートレイアウトの SidebarInset に outline + m-2 を付けて対にする
 * - ヘッダーはテンプレートの full-logo と同じ 2 段 (ロゴ + 名前 text-base + 副題 1 行)
 * - 主要ナビは常に展開。カテゴリ (17 件) とテーマのグループは既定で開き、見出しで閉じられる
 *   (AppSidebarClient の SidebarCollapsibleGroup)。グループ名は SidebarGroupLabel の既定の見た目
 * - テーマはテンプレートの nav-collapse と同じく 5 系統 (THEME_NAV_GROUPS) の開閉できる項目に分け、
 *   系統の項目にアイコンを付け、テーマのリンクは左線付きで字下げした子に並べる。既定は閉じ、現在地を含む系統だけ開く
 * - 主要ナビ・カテゴリ・テーマの系統の項目にはすべて lucide のアイコンを付ける (カテゴリは categories.ts の icon)
 * - 下端 (SidebarFooter) に一覧への出口 (すべてのランキング・すべてのテーマ) を置く
 * - 閉じている間もリンクは hidden="until-found" で SSR の HTML に残す
 * - 広告は置かない (ルートの body に google-anno-skip を付けてある)
 * - `cookies()` / `headers()` は呼ばない (SSG 維持: .claude/rules/nextjs-ssg-preservation.md)
 * - サイドバー部品は sidebar-shell.tsx (1 つの client モジュール) から import する (RSC payload の参照を寄せる)
 */
import { CATEGORIES } from '@stats47/data-configs/categories';
import { hrefFor } from '@stats47/data-configs/content/href';
import { RANKING_PROMINENCE_CATEGORIES } from '@stats47/data-configs/ranking-prominence';
import {
  ArrowLeftRight,
  BookOpen,
  Briefcase,
  Building2,
  ClipboardList,
  HeartPulse,
  Home,
  LayoutGrid,
  ListOrdered,
  Map as MapIcon,
  MapPin,
  Palette,
  Plane,
  TrendingUp,
  Users,
  type LucideIcon,
} from 'lucide-react';

import Link from '@/components/atoms/SiteLink';
import { ThemeAwareImage } from '@/components/atoms/ThemeAwareImage';

import { THEME_NAV_GROUPS } from '@/features/theme-dashboard/config/theme-navigation';
import {
  NAV_THEMES,
  themeHref,
} from '@/features/theme-dashboard/config/theme-urls';

import { getIcon } from '@/lib/icons';

import {
  SidebarActiveProvider,
  SidebarCollapsibleGroup,
  SidebarCollapsibleItem,
  SidebarNavContent,
  SidebarNavLink,
  SidebarNavSubLink,
  SidebarNavSurface,
} from './AppSidebarClient';
import {
  Sidebar,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuItem,
  SidebarMenuSubItem,
} from './sidebar-shell';
import {
  ALL_RANKINGS_NAV_ITEM,
  ALL_THEMES_NAV_ITEM,
  COMPARE_NAV_ITEM,
  HOME_NAV_ITEM,
  PRIMARY_NAV_ITEMS,
  type PrimaryNavKey,
} from './site-navigation';

const PRIMARY_NAV_ICONS: Record<PrimaryNavKey, LucideIcon> = {
  ranking: TrendingUp,
  areas: MapPin,
  municipalities: Building2,
  geo: MapIcon,
  survey: ClipboardList,
  blog: BookOpen,
};

/** テーマの 5 系統 (THEME_NAV_GROUPS の id) のアイコン */
const THEME_GROUP_ICONS: Record<
  (typeof THEME_NAV_GROUPS)[number]['id'],
  LucideIcon
> = {
  'population-life': Users,
  'work-economy': Briefcase,
  'health-education-safety': HeartPulse,
  'tourism-transport-nature': Plane,
  'culture-community-digital': Palette,
};

const CATEGORY_ICON_NAMES = new Map(
  CATEGORIES.map((category) => [category.categoryKey, category.icon])
);

/** 件数の札の位置。行の高さ (h-9) の中央に置き、現在地 (bg-primary) でも読める色にする */
const BADGE_CLASS =
  'peer-data-[size=default]/menu-button:top-2 peer-data-active/menu-button:text-background';

interface NavLinkItem {
  href: string;
  label: string;
  icon: LucideIcon;
  count?: number;
}

interface ThemeNavSection {
  id: string;
  label: string;
  icon: LucideIcon;
  items: Array<{ href: string; label: string }>;
}

/** 主要ナビ (常に展開) */
function getPrimaryNavItems(): NavLinkItem[] {
  return [
    { ...HOME_NAV_ITEM, icon: Home },
    ...PRIMARY_NAV_ITEMS.map(({ key, href, label }) => ({
      href,
      label,
      icon: PRIMARY_NAV_ICONS[key],
    })),
    { ...COMPARE_NAV_ITEM, icon: ArrowLeftRight },
  ];
}

/** カテゴリ (件数付き)。件数はビルド前に git TS から焼いた生成物を使う (METRICS_REGISTRY を全 route の bundle に入れないため) */
function getCategoryNavItems(): NavLinkItem[] {
  return RANKING_PROMINENCE_CATEGORIES.map((category) => ({
    href: hrefFor('category', { categoryKey: category.categoryKey }),
    label: category.categoryName,
    icon: getIcon(CATEGORY_ICON_NAMES.get(category.categoryKey) ?? ''),
    count: category.count,
  }));
}

/** テーマの 5 系統と、系統ごとのテーマのリンク (表示順は THEME_NAV_GROUPS) */
export function getThemeNavSections(): ThemeNavSection[] {
  const titles = new Map(
    NAV_THEMES.map((theme) => [theme.themeKey, theme.title])
  );
  return THEME_NAV_GROUPS.map((group) => ({
    id: group.id,
    label: group.label,
    icon: THEME_GROUP_ICONS[group.id],
    items: group.themeKeys.flatMap((themeKey) => {
      const title = titles.get(themeKey);
      return title ? [{ href: themeHref(themeKey), label: title }] : [];
    }),
  }));
}

/** 下端の出口 (一覧ページ)。「すべてのランキング」は主要ナビの「ランキング」が現在地を持つ */
const FOOTER_NAV_ITEMS = [
  { ...ALL_RANKINGS_NAV_ITEM, icon: ListOrdered, matchActive: false },
  { ...ALL_THEMES_NAV_ITEM, icon: LayoutGrid, matchActive: true },
] as const;

function NavLinkMenu({ items }: { items: NavLinkItem[] }) {
  return (
    <SidebarMenu>
      {items.map(({ href, label, icon: Icon, count }) => (
        <SidebarMenuItem key={href}>
          <SidebarNavLink
            href={href}
            label={label}
            className={count === undefined ? undefined : 'pr-12'}
          >
            <Icon />
            <span>{label}</span>
          </SidebarNavLink>
          {count !== undefined && (
            <SidebarMenuBadge className={BADGE_CLASS}>
              {count}件
            </SidebarMenuBadge>
          )}
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}

export function AppSidebar() {
  const primary = getPrimaryNavItems();
  const categories = getCategoryNavItems();
  const themeSections = getThemeNavSections();
  const themeHrefs = themeSections.flatMap((section) =>
    section.items.map((item) => item.href)
  );
  const hrefs = [
    ...primary.map((item) => item.href),
    ...categories.map((item) => item.href),
    ...themeHrefs,
    ...FOOTER_NAV_ITEMS.filter((item) => item.matchActive).map(
      (item) => item.href
    ),
  ];

  return (
    // テンプレートの app-sidebar と同じ inset。内側の面は白地 + 線 (SidebarInset の outline と同じく場所を取らない outline)
    <Sidebar
      variant="inset"
      className="**:data-[slot=sidebar-inner]:bg-background **:data-[slot=sidebar-inner]:outline **:data-[slot=sidebar-inner]:outline-border"
    >
      {/* 高さ h-14 は SiteHeader の行と同じ値 (下線を一直線に揃える) */}
      <SidebarHeader className="h-14 flex-row items-center border-b border-border px-3 py-0">
        <Link
          href="/"
          className="flex items-center gap-2"
          aria-label="stats47 ホーム"
        >
          <ThemeAwareImage
            lightSrc="/brand/atlas-v1/mark.svg"
            darkSrc="/brand/atlas-v1/mark-inverse.svg"
            alt=""
            width={28}
            height={28}
            className="size-7 shrink-0"
          />
          <span className="flex flex-col">
            <span className="text-base font-bold leading-5 text-foreground">
              stats<span className="text-primary">47</span>
            </span>
            <span className="text-xs leading-4 text-muted-foreground">
              統計で見る都道府県
            </span>
          </span>
        </Link>
      </SidebarHeader>
      <SidebarActiveProvider hrefs={hrefs}>
        <SidebarNavContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <NavLinkMenu items={primary} />
            </SidebarGroupContent>
          </SidebarGroup>
          <SidebarCollapsibleGroup
            label="カテゴリ"
            hrefs={categories.map((item) => item.href)}
          >
            <SidebarGroupContent>
              <NavLinkMenu items={categories} />
            </SidebarGroupContent>
          </SidebarCollapsibleGroup>
          <SidebarCollapsibleGroup label="テーマ" hrefs={themeHrefs}>
            <SidebarGroupContent>
              <SidebarMenu>
                {themeSections.map(({ id, label, icon: Icon, items }) => (
                  <SidebarCollapsibleItem
                    key={id}
                    label={label}
                    hrefs={items.map((item) => item.href)}
                    icon={<Icon />}
                  >
                    {items.map((item) => (
                      <SidebarMenuSubItem key={item.href}>
                        <SidebarNavSubLink
                          href={item.href}
                          label={item.label}
                        />
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarCollapsibleItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarCollapsibleGroup>
        </SidebarNavContent>
        <SidebarFooter className="border-t border-border">
          <SidebarNavSurface>
            <SidebarMenu>
              {FOOTER_NAV_ITEMS.map(
                ({ href, label, icon: Icon, matchActive }) => (
                  <SidebarMenuItem key={href}>
                    <SidebarNavLink
                      href={href}
                      label={label}
                      matchActive={matchActive}
                    >
                      <Icon />
                      <span>{label}</span>
                    </SidebarNavLink>
                  </SidebarMenuItem>
                )
              )}
            </SidebarMenu>
          </SidebarNavSurface>
        </SidebarFooter>
      </SidebarActiveProvider>
    </Sidebar>
  );
}
