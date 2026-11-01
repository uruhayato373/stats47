'use client';

import type { ReactNode } from 'react';

import { cn } from '@stats47/components';
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuSubButton,
} from '@stats47/components/atoms/ui/sidebar';
import { hrefFor } from "@stats47/data-configs/content/href";
import { FileText, ListTree } from 'lucide-react';

import Link from '@/components/atoms/SiteLink';
import { StatisticsScopeNav, type StatisticsScopeHrefs } from '@/components/navigation';
import { RailStack } from '@/components/rail';
import { SectionIndexLink } from '@/components/section';
import { RailCard } from '@/components/surface';

import { trackNavClick } from '@/lib/analytics/events';

import { NATIONAL_REGION_LABEL } from '../types';

import { PrefectureSelect } from './PrefectureSelect';
import { useThemePrefecture } from './ThemePrefectureContext';

import type { ThemeSwitcherTheme } from './ThemeSwitcher';

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
  /**
   * 旧 テーマ一覧 (グループ別) 用。テーマ一覧はサイドバーの「テーマ」が持つので使わない
   * (呼び出し側の互換のため残す)。
   */
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
  /** 旧 テーマ一覧 (グループ別) 用。使わない (呼び出し側の互換のため残す)。 */
  themes?: readonly ThemeSwitcherTheme[];
}

/**
 * テーマ詳細のページ内ナビ。
 *
 * 地域・このページ・全指標・出典調査を扱う。テーマ間の移動はサイドバーの「テーマ」と
 * ページ上部の ThemeSwitcher が持つので、グループ別テーマ一覧は描かない
 * (2026-10-28 にサイドバーとの重複として撤去)。
 * 通常テーマ (`ThemePageLayout`) は使わず、bespoke の `/themes/local-finance` だけが使う。
 */
export function ThemeSideNav({
  currentThemeKey,
  showRegion = true,
  showScope = true,
  scopeHrefs,
  pageLinks = [],
  metrics = [],
  surveys = [],
}: Props) {
  return (
    <RailStack>
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
          {NATIONAL_REGION_LABEL}に戻す
        </button>
      ) : (
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          県を選ぶと、指標とチャートがその県に切り替わります。
        </p>
      )}
    </div>
  );
}
