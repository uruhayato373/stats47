'use client';

import { ChevronDown, FileText, ListTree } from 'lucide-react';

import { StatisticsScopeNav } from '@/components/navigation';
import { RailStack } from '@/components/rail';
import { SectionIndexLink } from '@/components/section';
import { RailCard, RailNavRow } from '@/components/surface';

import { trackNavClick } from '@/lib/analytics/events';

import { THEME_NAV_GROUPS } from '../config/theme-navigation';
import { PREFECTURE_SET_LABEL } from '../types';

import { PrefectureSelect } from './PrefectureSelect';
import { useThemePrefecture } from './ThemePrefectureContext';
import { buildThemeSwitcherOptions } from './ThemeSwitcher';

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
  pageLinks?: Array<{ href: string; label: string }>;
  metrics?: ThemeNavMetric[];
  surveys?: ThemeNavSurvey[];
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
  pageLinks = [],
  metrics = [],
  surveys = [],
}: Props) {
  return (
    <RailStack>
      <ThemeGroupNavigation
        currentThemeKey={currentThemeKey}
        areaContext={areaContext}
      />

      {(showScope || showRegion) && (
        <RegionBlock showScope={showScope} showPrefectureSelect={showRegion} />
      )}

      {pageLinks.length > 0 && (
        <RailCard title="このページ" bodyClassName="p-0">
          <nav aria-label="このページの内容" className="pb-2">
            {pageLinks.map((link) => (
              <RailNavRow
                key={link.href}
                href={link.href}
                chevron={false}
                onClick={() =>
                  trackNavClick({
                    surface: 'theme_section',
                    label: `${currentThemeKey}:${link.href.slice(1)}`,
                    href: link.href,
                  })
                }
              >
                {link.label}
              </RailNavRow>
            ))}
          </nav>
        </RailCard>
      )}

      {metrics.length > 0 && (
        <RailCard
          title={`全指標（${metrics.length}）`}
          icon={<ListTree className="size-4 text-muted-foreground" aria-hidden />}
          collapsible
          bodyClassName="p-0"
        >
          <nav aria-label="このテーマの全指標" className="pb-2">
            {metrics.map((metric) => (
              <RailNavRow
                key={metric.rankingKey}
                href={`/ranking/${metric.rankingKey}`}
                chevron={false}
              >
                {metric.label}
              </RailNavRow>
            ))}
          </nav>
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
            <div className="pb-2">
              {surveys.map((survey) => (
                <RailNavRow
                  key={survey.id}
                  href={`/survey/${survey.id}`}
                  chevron={false}
                  onClick={() =>
                    trackNavClick({
                      surface: 'theme_survey',
                      label: survey.id,
                      href: `/survey/${survey.id}`,
                    })
                  }
                >
                  {survey.name}
                </RailNavRow>
              ))}
            </div>
          )}
        </RailCard>
      </nav>
    </RailStack>
  );
}

function ThemeGroupNavigation({
  currentThemeKey,
  areaContext,
}: Pick<Props, 'currentThemeKey' | 'areaContext'>) {
  const { hasProvider, selectedPrefectureCode } = useThemePrefecture();
  const options = buildThemeSwitcherOptions(
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
        {THEME_NAV_GROUPS.map((group) => {
          const groupOptions = group.themeKeys.flatMap((themeKey) => {
            const option = optionByKey.get(themeKey);
            return option ? [option] : [];
          });
          if (groupOptions.length === 0) return null;

          const isCurrentGroup = groupOptions.some(
            (option) => option.themeKey === currentThemeKey
          );

          return (
            <details
              key={group.id}
              open={isCurrentGroup}
              className="group border-b border-border last:border-b-0"
            >
              <summary className="flex min-h-10 cursor-pointer list-none items-center gap-2 px-2 text-sm font-semibold text-foreground hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50">
                {group.label}
                <ChevronDown
                  className="ml-auto size-4 text-muted-foreground transition-transform group-open:rotate-180"
                  aria-hidden
                />
              </summary>
              <div className="pb-2">
                {groupOptions.map((option) => {
                  const isCurrent = option.themeKey === currentThemeKey;
                  return (
                    <RailNavRow
                      key={option.themeKey}
                      href={option.href}
                      active={isCurrent}
                      chevron={false}
                      className="pl-4"
                      onClick={() =>
                        trackNavClick({
                          surface: 'theme_switcher',
                          label: option.themeKey,
                          href: option.href,
                        })
                      }
                    >
                      {option.title}
                    </RailNavRow>
                  );
                })}
              </div>
            </details>
          );
        })}
      </RailCard>
    </nav>
  );
}

function RegionBlock({
  showScope,
  showPrefectureSelect,
}: {
  showScope: boolean;
  showPrefectureSelect: boolean;
}) {
  return (
    <RailCard title="地域">
      {showScope && <StatisticsScopeNav current="prefectures" variant="rail" />}
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
          className="mt-2 min-h-10 text-sm text-muted-foreground underline-offset-2 hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
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
