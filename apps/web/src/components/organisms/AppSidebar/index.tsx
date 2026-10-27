/**
 * サイト全体のナビ (Server Component)。テンプレート (shadcndashboard) の app-sidebar に寄せたサイドバー。
 *
 * - リンクはすべてここで組み立て、SSR の HTML に a[href] で出す (テンプレートの Suspense + NavSkeleton と
 *   SimpleBar は写さない)。現在地の判定だけを AppSidebarClient の小さな部品に閉じ込める
 * - lg (1024px) 未満では hydration 後に Sheet に替わり、閉じている間は DOM からリンクが消える。
 *   検索エンジン向けには Footer に主要ナビとテーマのリンクを常に出して補う
 * - テンプレートと同じ variant="inset"。ルートレイアウトの SidebarInset に outline + m-2 を付けて対にする
 * - グループ名は div (SidebarGroupLabel) のままにし、見出し (h2/h3) を増やさない
 * - カテゴリ (17 件) は開閉できるグループにし、既定は閉じる (AppSidebarClient の SidebarCollapsibleGroup)。
 *   閉じている間も hidden="until-found" でリンクを SSR の HTML に残す
 * - 広告は置かない (ルートの body に google-anno-skip を付けてある)
 * - `cookies()` / `headers()` は呼ばない (SSG 維持: .claude/rules/nextjs-ssg-preservation.md)
 */
import {
  Sidebar,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuItem,
} from "@stats47/components/atoms/ui/sidebar";
import { hrefFor } from "@stats47/data-configs/content/href";
import { RANKING_PROMINENCE_CATEGORIES } from "@stats47/data-configs/ranking-prominence";
import {
  ArrowLeftRight,
  BookOpen,
  Building2,
  ClipboardList,
  Home,
  Map,
  MapPin,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

import Link from "@/components/atoms/SiteLink";
import { ThemeAwareImage } from "@/components/atoms/ThemeAwareImage";

import { NAV_THEMES, themeHref } from "@/features/theme-dashboard/config/theme-urls";

import {
  SidebarActiveProvider,
  SidebarCollapsibleGroup,
  SidebarNavContent,
  SidebarNavLink,
} from "./AppSidebarClient";
import {
  ALL_THEMES_NAV_ITEM,
  COMPARE_NAV_ITEM,
  HOME_NAV_ITEM,
  PRIMARY_NAV_ITEMS,
  SIDEBAR_GROUP_LABEL_CLASS,
  type PrimaryNavKey,
} from "./site-navigation";

const PRIMARY_NAV_ICONS: Record<PrimaryNavKey, LucideIcon> = {
  ranking: TrendingUp,
  areas: MapPin,
  municipalities: Building2,
  geo: Map,
  survey: ClipboardList,
  blog: BookOpen,
};

interface NavLinkItem {
  href: string;
  label: string;
  icon?: LucideIcon;
  count?: number;
}

interface NavGroup {
  label: string | null;
  items: NavLinkItem[];
  /**
   * 開閉できるグループにする (既定は閉じ、現在地を含むときだけ開く)。カテゴリ 17 件を常時並べると
   * テーマのグループが最初の画面の外へ押し出されるため (テンプレートの nav-collapse と同じ扱い)。
   */
  collapsible?: boolean;
}

/** サイドバーに並べるリンクのグループ (表示順)。SSR リンクのテストも同じ並びを使う。 */
export function getSidebarNavGroups(): NavGroup[] {
  return [
    {
      label: null,
      items: [
        { ...HOME_NAV_ITEM, icon: Home },
        ...PRIMARY_NAV_ITEMS.map(({ key, href, label }) => ({
          href,
          label,
          icon: PRIMARY_NAV_ICONS[key],
        })),
        { ...COMPARE_NAV_ITEM, icon: ArrowLeftRight },
      ],
    },
    {
      label: "カテゴリ",
      collapsible: true,
      // 件数はビルド前に git TS から焼いた生成物を使う (METRICS_REGISTRY を全 route の bundle に入れないため)
      items: RANKING_PROMINENCE_CATEGORIES.map((category) => ({
        href: hrefFor("category", { categoryKey: category.categoryKey }),
        label: category.categoryName,
        count: category.count,
      })),
    },
    {
      label: "テーマ",
      items: [
        ...NAV_THEMES.map((theme) => ({
          href: themeHref(theme.themeKey),
          label: theme.title,
        })),
        { ...ALL_THEMES_NAV_ITEM },
      ],
    },
  ];
}

export function AppSidebar() {
  const groups = getSidebarNavGroups();
  const hrefs = groups.flatMap((group) => group.items.map((item) => item.href));

  return (
    // テンプレートの app-sidebar と同じ inset。内側の面は白地 + 線 (SidebarInset の outline と同じく場所を取らない outline)
    <Sidebar
      variant="inset"
      className="**:data-[slot=sidebar-inner]:bg-background **:data-[slot=sidebar-inner]:outline **:data-[slot=sidebar-inner]:outline-border"
    >
      {/* 高さ h-14 は SiteHeader の行と同じ値 (下線を一直線に揃える) */}
      <SidebarHeader className="h-14 flex-row items-center border-b border-border p-3">
        <Link
          href="/"
          className="group flex items-center gap-2"
          aria-label="stats47 ホーム"
        >
          <ThemeAwareImage
            lightSrc="/brand/atlas-v1/mark.svg"
            darkSrc="/brand/atlas-v1/mark-inverse.svg"
            alt=""
            width={24}
            height={24}
            className="size-6 shrink-0"
          />
          <span className="whitespace-nowrap text-xl font-bold leading-7 text-foreground">
            stats<span className="text-primary">47</span>
          </span>
        </Link>
      </SidebarHeader>
      <SidebarActiveProvider hrefs={hrefs}>
        <SidebarNavContent>
          {groups.map((group) => {
            const menu = (
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map(({ href, label, icon: Icon, count }) => (
                    <SidebarMenuItem key={href}>
                      <SidebarNavLink href={href} label={label}>
                        {Icon && <Icon />}
                        <span>{label}</span>
                      </SidebarNavLink>
                      {count !== undefined && (
                        <SidebarMenuBadge>{count}件</SidebarMenuBadge>
                      )}
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            );
            if (group.label && group.collapsible) {
              return (
                <SidebarCollapsibleGroup
                  key={group.label}
                  label={group.label}
                  hrefs={group.items.map((item) => item.href)}
                >
                  {menu}
                </SidebarCollapsibleGroup>
              );
            }
            return (
              <SidebarGroup key={group.label ?? "primary"}>
                {group.label && (
                  <SidebarGroupLabel className={SIDEBAR_GROUP_LABEL_CLASS}>
                    {group.label}
                  </SidebarGroupLabel>
                )}
                {menu}
              </SidebarGroup>
            );
          })}
        </SidebarNavContent>
      </SidebarActiveProvider>
    </Sidebar>
  );
}
