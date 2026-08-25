'use client';

import Link from 'next/link';

import { cn } from '@stats47/components';
import { ChevronDown, FileText, ListTree } from 'lucide-react';

import { StatisticsScopeNav } from '@/components/navigation';
import { SectionHeader, SectionIndexLink } from '@/components/section';

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
  metrics = [],
  surveys = [],
}: Props) {
  return (
    <div className="space-y-6 pr-1">
      <ThemeGroupNavigation
        currentThemeKey={currentThemeKey}
        areaContext={areaContext}
      />

      {(showScope || showRegion) && (
        <RegionBlock
          showScope={showScope}
          showPrefectureSelect={showRegion}
        />
      )}

      {metrics.length > 0 && (
        <details className="group border-y border-border py-2">
          <summary className="flex min-h-10 cursor-pointer list-none items-center gap-2 text-sm font-semibold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50">
            <ListTree className="size-4 text-muted-foreground" aria-hidden />
            全指標（{metrics.length}）
          </summary>
          <nav aria-label="このテーマの全指標" className="pb-1 pt-2">
            <ul className="space-y-1">
              {metrics.map((metric) => (
                <li key={metric.rankingKey}>
                  <Link
                    href={`/ranking/${metric.rankingKey}`}
                    className="block py-1 text-sm leading-relaxed text-foreground hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                  >
                    {metric.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </details>
      )}

      <nav aria-label="このテーマの出典調査">
        <SectionHeader
          title={
            <span className="inline-flex items-center gap-2">
              <FileText
                className="size-4 text-muted-foreground"
                aria-hidden
              />
              出典調査
            </span>
          }
          as="h2"
          action={<SectionIndexLink href="/survey" label="調査一覧へ" />}
        />
        {surveys.length > 0 && (
          <ul className="space-y-1 border-y border-border py-2">
            {surveys.map((survey) => (
              <li key={survey.id}>
                <Link
                  href={`/survey/${survey.id}`}
                  className="block py-1 text-sm leading-relaxed text-foreground hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                >
                  {survey.name}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </nav>
    </div>
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
  const optionByKey = new Map(options.map((option) => [option.themeKey, option]));

  return (
    <nav aria-label="テーマを切り替える">
      <SectionHeader
        title="テーマ"
        as="h2"
        action={<SectionIndexLink href="/themes" label="テーマ一覧へ" />}
      />
      <div className="border-y border-border">
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
              <ul className="pb-2">
                {groupOptions.map((option) => {
                  const isCurrent = option.themeKey === currentThemeKey;
                  return (
                    <li key={option.themeKey}>
                      <Link
                        href={option.href}
                        aria-current={isCurrent ? 'page' : undefined}
                        className={cn(
                          'flex min-h-10 items-center px-4 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50',
                          isCurrent
                            ? 'bg-accent font-semibold text-primary'
                            : 'text-foreground hover:bg-accent/50 hover:text-primary'
                        )}
                      >
                        {option.title}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </details>
          );
        })}
      </div>
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
    <div>
      <SectionHeader title="地域" as="h2" />
      {showScope && (
        <StatisticsScopeNav current="prefectures" variant="rail" />
      )}
      {showPrefectureSelect && <PrefectureControl hasScope={showScope} />}
    </div>
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
