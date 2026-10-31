/**
 * サイト全体のナビ (Server Component)。テンプレート (shadcndashboard) の app-sidebar に寄せたサイドバー。
 *
 * - リンクはすべてここで組み立て、SSR の HTML に a[href] で出す (テンプレートの Suspense + NavSkeleton と
 *   SimpleBar は写さない)。現在地の判定と開閉だけを AppSidebarClient の小さな部品に閉じ込める
 * - lg (1024px) 未満では hydration 後に Sheet に替わり、閉じている間は DOM からリンクが消える。
 *   検索エンジン向けには Footer に主要ナビと「すべてのテーマ」のリンクを常に出して補う
 * - テンプレートと同じ variant="inset"。ルートレイアウトの SidebarInset に outline + m-2 を付けて対にする
 * - ヘッダーはテンプレートの full-logo と同じ 2 段 (ロゴ + 名前 text-base + 副題 1 行)
 * - 主要ナビは常に展開し、グループ名「メニュー」を付ける。項目はサイトの内容の種類 (site-navigation.ts) だけ
 * - サイトの顔はテーマ。テーマのグループを主要ナビの直後に置き、5 系統 (THEME_NAV_GROUPS) をすべて開いた状態で出す。
 *   カテゴリ (17 件) は全指標の索引なのでテーマの後に置き、既定で閉じる。件数は選ぶ判断に役立たないので出さない
 *   (2026-10-28 オーナー合意)。どちらのグループも現在地を含むときは開く (AppSidebarClient の useOpenOnActive)
 * - グループ名はどれも SidebarGroupLabel の見た目に font-semibold を足した同じ作り (Sidebar の className で全グループ名に当てる)
 * - テーマはテンプレートの nav-collapse と同じく系統の開閉できる項目に分け、系統の項目にアイコンを付け、
 *   テーマのリンクは左線付きで字下げした子に並べる
 * - 主要ナビ・カテゴリ・テーマの系統の項目にはすべて lucide のアイコンを付ける (カテゴリは categories.ts の icon)
 * - 下端 (SidebarFooter) は置かない。テーマ一覧 (/themes) は主要ナビの「テーマ」から入る
 * - 閉じている間もリンクは hidden="until-found" で SSR の HTML に残す
 * - 広告は置かない (ルートの body に google-anno-skip を付けてある)
 * - `cookies()` / `headers()` は呼ばない (SSG 維持: .claude/rules/nextjs-ssg-preservation.md)
 * - サイドバー部品は sidebar-shell.tsx (1 つの client モジュール) から import する (RSC payload の参照を寄せる)
 */
import { CATEGORIES } from '@stats47/data-configs/categories';
import { hrefFor } from '@stats47/data-configs/content/href';
import { RANKING_PROMINENCE_CATEGORIES } from '@stats47/data-configs/ranking-prominence';
import {
  BookOpen,
  Briefcase,
  HeartPulse,
  Home,
  LayoutGrid,
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
} from './AppSidebarClient';
import {
  Sidebar,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuSubItem,
} from './sidebar-shell';
import {
  HOME_NAV_ITEM,
  PRIMARY_NAV_ITEMS,
  REGION_NAV_ITEMS,
  type PrimaryNavKey,
} from './site-navigation';

const PRIMARY_NAV_ICONS: Record<PrimaryNavKey, LucideIcon> = {
  ranking: TrendingUp,
  themes: LayoutGrid,
  areas: MapPin,
  geo: MapIcon,
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

interface NavLinkItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

interface ThemeNavSection {
  id: string;
  label: string;
  icon: LucideIcon;
  items: Array<{ href: string; label: string }>;
}

/** 「地域」の中の 3 段 (全国・都道府県・市区町村) */
function getRegionNavItems(): Array<{ href: string; label: string }> {
  return REGION_NAV_ITEMS.map(({ href, label }) => ({ href, label }));
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
  ];
}

/** カテゴリ。並び順はビルド前に git TS から焼いた生成物を使う (METRICS_REGISTRY を全 route の bundle に入れないため) */
function getCategoryNavItems(): NavLinkItem[] {
  return RANKING_PROMINENCE_CATEGORIES.map((category) => ({
    href: hrefFor('category', { categoryKey: category.categoryKey }),
    label: category.categoryName,
    icon: getIcon(CATEGORY_ICON_NAMES.get(category.categoryKey) ?? ''),
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

/**
 * グループ名の見た目。テンプレートの SidebarGroupLabel (data-slot="sidebar-group-label") と同じクラスで描き、
 * 主要ナビ・カテゴリ・テーマのグループ名をすべて font-semibold にする (Sidebar の className で当てる)。
 */
const GROUP_LABEL_EMPHASIS_CLASS = '**:data-[slot=sidebar-group-label]:font-semibold';

function NavLinkMenu({ items }: { items: NavLinkItem[] }) {
  return (
    <SidebarMenu>
      {items.map(({ href, label, icon: Icon }) => (
        <SidebarMenuItem key={href}>
          <SidebarNavLink href={href} label={label}>
            <Icon />
            <span>{label}</span>
          </SidebarNavLink>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}

export function AppSidebar() {
  const primary = getPrimaryNavItems();
  const regions = getRegionNavItems();
  const categories = getCategoryNavItems();
  const themeSections = getThemeNavSections();
  const themeHrefs = themeSections.flatMap((section) =>
    section.items.map((item) => item.href)
  );
  const hrefs = [
    ...primary.map((item) => item.href).filter((href) => href !== '/areas'),
    ...regions.map((item) => item.href),
    ...categories.map((item) => item.href),
    ...themeHrefs,
  ];

  return (
    // テンプレートの app-sidebar と同じ inset。内側の面は白地 + 線 (SidebarInset の outline と同じく場所を取らない outline)
    <Sidebar
      variant="inset"
      className={`**:data-[slot=sidebar-inner]:bg-background **:data-[slot=sidebar-inner]:outline **:data-[slot=sidebar-inner]:outline-border ${GROUP_LABEL_EMPHASIS_CLASS}`}
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
            {/* SidebarGroupLabel と同じ見た目の名前。部品は 'use client' のモジュールにあるので、
                Server Component のここでは同じ data-slot / class の div を描く (RSC の参照を増やさない) */}
            <div
              data-slot="sidebar-group-label"
              data-sidebar="group-label"
              className="flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium text-sidebar-foreground/70"
            >
              メニュー
            </div>
            <SidebarGroupContent>
              <SidebarMenu>
                {primary.map(({ href, label, icon: Icon }) =>
                  href === '/areas' ? (
                    // 「地域」は全国・都道府県・市区町村の 3 段を開閉できる項目 (2026-10-31 オーナー決定)。主要ナビなので既定で開く
                    <SidebarCollapsibleItem
                      key={href}
                      label={label}
                      hrefs={regions.map((item) => item.href)}
                      icon={<Icon />}
                      defaultOpen
                    >
                      {regions.map((item) => (
                        <SidebarMenuSubItem key={item.href}>
                          <SidebarNavSubLink href={item.href} label={item.label} />
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarCollapsibleItem>
                  ) : (
                    <SidebarMenuItem key={href}>
                      <SidebarNavLink href={href} label={label}>
                        <Icon />
                        <span>{label}</span>
                      </SidebarNavLink>
                    </SidebarMenuItem>
                  )
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          <SidebarCollapsibleGroup label="テーマ" hrefs={themeHrefs}>
            <SidebarGroupContent>
              <SidebarMenu>
                {themeSections.map(({ id, label, icon: Icon, items }) => (
                  <SidebarCollapsibleItem
                    key={id}
                    label={label}
                    hrefs={items.map((item) => item.href)}
                    icon={<Icon />}
                    defaultOpen
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
          <SidebarCollapsibleGroup
            label="カテゴリ"
            hrefs={categories.map((item) => item.href)}
            defaultOpen={false}
          >
            <SidebarGroupContent>
              <NavLinkMenu items={categories} />
            </SidebarGroupContent>
          </SidebarCollapsibleGroup>
        </SidebarNavContent>
      </SidebarActiveProvider>
    </Sidebar>
  );
}
