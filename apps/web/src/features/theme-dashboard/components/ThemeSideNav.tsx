'use client';

import Link from 'next/link';

import { FileText, ListTree } from 'lucide-react';

import { SectionHeader } from '@/components/section';

import { PREFECTURE_SET_LABEL } from '../types';

import { PrefectureSelect } from './PrefectureSelect';
import { useThemePrefecture } from './ThemePrefectureContext';
import { ThemeSwitcher } from './ThemeSwitcher';

export interface ThemeNavMetric {
  rankingKey: string;
  label: string;
}

export interface ThemeNavSurvey {
  id: string;
  name: string;
}

export interface ThemePageNavLink {
  href: string;
  label: string;
}

interface Props {
  /** 現在表示中のテーマキー（URL/props が正）。 */
  currentThemeKey: string;
  /** エリアページ経由時の都道府県コード（5桁）。指定時はリンクが都道府県文脈を維持する。 */
  areaContext?: { areaCode: string };
  /** Provider を持たない bespoke ページでは false。 */
  showRegion?: boolean;
  pageLinks?: ThemePageNavLink[];
  metrics?: ThemeNavMetric[];
  surveys?: ThemeNavSurvey[];
}

/**
 * テーマ詳細のページ内ナビ。
 *
 * サイト全体のテーマ一覧はヘッダーと ThemeSwitcher に任せ、このレールは現在ページの操作と
 * 読み進め方（地域・セクション・指標・出典）だけを担う。
 */
export function ThemeSideNav({
  currentThemeKey,
  areaContext,
  showRegion = true,
  pageLinks = [],
  metrics = [],
  surveys = [],
}: Props) {
  return (
    <div className="space-y-6 pr-1">
      <div>
        <SectionHeader title="テーマ" as="h2" />
        <ThemeSwitcher
          currentThemeKey={currentThemeKey}
          areaContext={areaContext}
          compact
        />
      </div>

      {showRegion && <RegionBlock />}

      {pageLinks.length > 0 && (
        <nav aria-label="このページの内容">
          <SectionHeader title="このページ" as="h2" />
          <ul className="border-t border-border">
            {pageLinks.map((item) => (
              <li key={item.href} className="border-b border-border">
                <Link
                  href={item.href}
                  className="flex min-h-10 items-center px-2 text-sm font-medium text-foreground transition-colors hover:bg-accent/50 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
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

      {surveys.length > 0 && (
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
          />
          <ul className="space-y-1">
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
        </nav>
      )}
    </div>
  );
}

function RegionBlock() {
  const { selectedAreaName, setSelected } = useThemePrefecture();

  return (
    <div>
      <SectionHeader title="地域" as="h2" />
      <PrefectureSelect className="w-full" />
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
