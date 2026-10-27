'use client';

import type { ReactNode } from 'react';

import { cn } from '@stats47/components';
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@stats47/components/atoms/ui/sidebar';
import { hrefFor } from "@stats47/data-configs/content/href";
import { ChevronDown, FileText, ListTree } from 'lucide-react';

import Link from '@/components/atoms/SiteLink';
import { StatisticsScopeNav, type StatisticsScopeHrefs } from '@/components/navigation';
import { RailStack } from '@/components/rail';
import { SectionIndexLink } from '@/components/section';
import { RailCard } from '@/components/surface';

import { trackNavClick } from '@/lib/analytics/events';

import { THEME_NAV_GROUPS } from '../config/theme-navigation';
import { PREFECTURE_SET_LABEL } from '../types';

import { PrefectureSelect } from './PrefectureSelect';
import { useThemePrefecture } from './ThemePrefectureContext';
import { buildThemeSwitcherOptions, type ThemeSwitcherTheme } from './ThemeSwitcher';

export interface ThemeNavMetric {
  rankingKey: string;
  label: string;
}

export interface ThemeNavSurvey {
  id: string;
  name: string;
}

interface Props {
  /** 現在表示中のテーマキー（URL/props が正）。 */
  currentThemeKey: string;
  /** エリアページ経由時の都道府県コード（5桁）。指定時はリンクが都道府県文脈を維持する。 */
  areaContext?: { areaCode: string };
  /** Provider を持たない bespoke ページでは false。 */
  showRegion?: boolean;
  /** エリア文脈など、地理スコープを切り替えないページでは false。 */
  showScope?: boolean;
  /** 市区町村・日本の同じ主題のページ (サーバーで `scopeHrefsForPrefectureTheme` を渡す)。 */
  scopeHrefs?: StatisticsScopeHrefs;
  pageLinks?: Array<{ href: string; label: string }>;
  metrics?: ThemeNavMetric[];
  surveys?: ThemeNavSurvey[];
  /** テーマ一覧。サーバーで `THEME_SWITCHER_THEMES` を渡す。 */
  themes: readonly ThemeSwitcherTheme[];
}

/**
 * テーマ詳細のページ内ナビ。
 *
 * デスクトップでは navigation-only のグループ別テーマ一覧を表示し、現在テーマを明示する。
 * 狭幅のテーマ切替は ThemePageLayout の Select が担う。このレールは地域・指標・出典も扱う。
 */
export function ThemeSideNav({
  currentThemeKey,
  areaContext,
  showRegion = true,
  showScope = true,
  scopeHrefs,
  pageLinks = [],
  metrics = [],
  surveys = [],
  themes,
}: Props) {
  return (
    <RailStack>
      <ThemeGroupNavigation
        currentThemeKey={currentThemeKey}
        areaContext={areaContext}
        themes={themes}
      />

      {(showScope || showRegion) && (
        <RegionBlock showScope={showScope} showPrefectureSelect={showRegion} scopeHrefs={scopeHrefs} />
      )}

      {pageLinks.length > 0 && (
        <RailCard title="このページ" bodyClassName="p-0">
          <RailMenu label="このページの内容">
            {pageLinks.map((link) => (
              <RailMenuLink
                key={link.href}
                href={link.href}
                onClick={() =>
                  trackNavClick({
                    surface: 'theme_section',
                    label: `${currentThemeKey}:${link.href.slice(1)}`,
                    href: link.href,
                  })
                }
              >
                {link.label}
              </RailMenuLink>
            ))}
          </RailMenu>
        </RailCard>
      )}

      {metrics.length > 0 && (
        <RailCard
          title={`全指標（${metrics.length}）`}
          icon={<ListTree className="size-4 text-muted-foreground" aria-hidden />}
          collapsible
          bodyClassName="p-0"
        >
          <RailMenu label="このテーマの全指標">
            {metrics.map((metric) => (
              <RailMenuLink
                key={metric.rankingKey}
                href={hrefFor("ranking", { rankingKey: metric.rankingKey })}
              >
                {metric.label}
              </RailMenuLink>
            ))}
          </RailMenu>
        </RailCard>
      )}

      <nav aria-label="このテーマの出典調査">
        <RailCard
          title="出典調査"
          icon={<FileText className="size-4 text-muted-foreground" aria-hidden />}
          headerAction={<SectionIndexLink href="/survey" label="調査一覧へ" />}
          bodyClassName="p-0"
        >
          {surveys.length > 0 && (
            <SidebarGroup className="p-2">
              <SidebarMenu>
                {surveys.map((survey) => (
                  <RailMenuLink
                    key={survey.id}
                    href={hrefFor('survey', { surveyKey: survey.id })}
                    onClick={() =>
                      trackNavClick({
                        surface: 'theme_survey',
                        label: survey.id,
                        href: hrefFor('survey', { surveyKey: survey.id }),
                      })
                    }
                  >
                    {survey.name}
                  </RailMenuLink>
                ))}
              </SidebarMenu>
            </SidebarGroup>
          )}
        </RailCard>
      </nav>
    </RailStack>
  );
}

/**
 * レール内のリンク行。テンプレートの SidebarMenuSubButton (h-7) に、モバイル 44px のタップ領域を足す。
 * SidebarMenuButton は SidebarProvider の context を必須にするため、context を読まない Sub 版を使う。
 */
const RAIL_MENU_ROW_CLASS = 'h-auto min-h-11 py-1.5 sm:min-h-8';

function RailMenu({ label, children }: { label: string; children: ReactNode }) {
  return (
    <SidebarGroup className="p-2">
      <nav aria-label={label}>
        <SidebarMenu>{children}</SidebarMenu>
      </nav>
    </SidebarGroup>
  );
}

function RailMenuLink({
  href,
  onClick,
  children,
}: {
  href: string;
  onClick?: () => void;
  children: ReactNode;
}) {
  return (
    <SidebarMenuItem>
      <SidebarMenuSubButton
        className={cn(RAIL_MENU_ROW_CLASS, 'translate-x-0')}
        onClick={onClick}
        render={<Link href={href} />}
      >
        <span>{children}</span>
      </SidebarMenuSubButton>
    </SidebarMenuItem>
  );
}

function ThemeGroupNavigation({
  currentThemeKey,
  areaContext,
  themes,
}: Pick<Props, 'currentThemeKey' | 'areaContext' | 'themes'>) {
  const { hasProvider, selectedPrefectureCode } = useThemePrefecture();
  const options = buildThemeSwitcherOptions(
    themes,
    areaContext,
    hasProvider ? selectedPrefectureCode : undefined
  );
  const optionByKey = new Map(
    options.map((option) => [option.themeKey, option])
  );

  return (
    <nav aria-label="テーマを切り替える">
      <RailCard
        title="テーマ"
        headerAction={<SectionIndexLink href="/themes" label="テーマ一覧へ" />}
        bodyClassName="p-0"
      >
        <SidebarGroup className="p-2">
          <SidebarMenu>
            {THEME_NAV_GROUPS.map((group) => {
              const groupOptions = group.themeKeys.flatMap((themeKey) => {
                const option = optionByKey.get(themeKey);
                return option ? [option] : [];
              });
              if (groupOptions.length === 0) return null;

              const isCurrentGroup = groupOptions.some(
                (option) => option.themeKey === currentThemeKey
              );

              // 開閉は details/summary で持つ。閉じたグループのリンクも SSR の HTML に残すため
              // (Collapsible の Panel は閉じると中身を DOM から外す)。
              return (
                <SidebarMenuItem key={group.id}>
                  <details open={isCurrentGroup} className="group/theme-group">
                    <summary className="flex min-h-11 w-full cursor-pointer list-none items-center gap-2 rounded-md p-2 text-sm font-medium text-sidebar-foreground ring-sidebar-ring outline-hidden hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 sm:min-h-8 [&::-webkit-details-marker]:hidden">
                      {group.label}
                      <ChevronDown
                        className="ml-auto size-4 text-muted-foreground transition-transform group-open/theme-group:rotate-180"
                        aria-hidden
                      />
                    </summary>
                    <SidebarMenuSub>
                      {groupOptions.map((option) => {
                        const isCurrent = option.themeKey === currentThemeKey;
                        return (
                          <SidebarMenuSubItem key={option.themeKey}>
                            <SidebarMenuSubButton
                              isActive={isCurrent}
                              aria-current={isCurrent ? 'page' : undefined}
                              className={RAIL_MENU_ROW_CLASS}
                              onClick={() =>
                                trackNavClick({
                                  surface: 'theme_switcher',
                                  label: option.themeKey,
                                  href: option.href,
                                })
                              }
                              render={<Link href={option.href} />}
                            >
                              <span>{option.title}</span>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        );
                      })}
                    </SidebarMenuSub>
                  </details>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </RailCard>
    </nav>
  );
}

function RegionBlock({
  showScope,
  showPrefectureSelect,
  scopeHrefs,
}: {
  showScope: boolean;
  showPrefectureSelect: boolean;
  scopeHrefs?: StatisticsScopeHrefs;
}) {
  return (
    <RailCard title="地域">
      {showScope && <StatisticsScopeNav current="prefectures" variant="rail" hrefs={scopeHrefs} />}
      {showPrefectureSelect && <PrefectureControl hasScope={showScope} />}
    </RailCard>
  );
}

function PrefectureControl({ hasScope }: { hasScope: boolean }) {
  const { selectedAreaName, setSelected } = useThemePrefecture();

  return (
    <div className={hasScope ? 'mt-4' : undefined}>
      <span className="block text-xs font-medium text-muted-foreground">
        表示する都道府県
      </span>
      <PrefectureSelect className="mt-1 w-full" />
      {selectedAreaName ? (
        <button
          type="button"
          onClick={() => setSelected(null)}
          className="mt-2 min-h-10 text-sm text-muted-foreground underline-offset-2 hover:text-primary hover:underline focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/50"
        >
          {PREFECTURE_SET_LABEL}に戻す
        </button>
      ) : (
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          県を選ぶと、指標とチャートがその県に切り替わります。
        </p>
      )}
    </div>
  );
}
