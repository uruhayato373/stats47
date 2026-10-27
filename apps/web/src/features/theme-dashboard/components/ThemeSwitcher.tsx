'use client';

import { useRouter } from 'next/navigation';

import { cn } from '@stats47/components';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@stats47/components/atoms/ui/select';
import { hrefFor } from '@stats47/data-configs/content/href';

import { trackNavClick } from '@/lib/analytics/events';

import { themeHref } from '../config/theme-href';
import { THEME_PREFECTURE_SET_VALUE } from '../lib/theme-prefecture-preference';

import { useThemePrefecture } from './ThemePrefectureContext';

/** サーバーが ALL_THEMES から作って渡すテーマ一覧の 1 件 (`config/theme-switcher-themes.ts`)。 */
export interface ThemeSwitcherTheme {
  themeKey: string;
  title: string;
  /** 都道府県ページ (`/areas/<code>/<theme>`) を持つテーマか。 */
  isAreaTheme: boolean;
}

export interface ThemeSwitcherOption {
  themeKey: string;
  title: string;
  href: string;
}

/**
 * テーマ切替セレクターの選択肢を、サーバーが `ALL_THEMES`（SSOT）から作った一覧から導出する。
 *
 * - 通常テーマ: canonical は `/themes/{themeKey}` のまま、Provider 配下では現在の
 *   `?pref=<5桁コード|all>` をリンクへ付けて選択と prefetch 結果を一致させる。
 * - areaContext: 都道府県文脈を維持して `/areas/{areaCode}/{themeKey}` へ。ただし
 *   area ページで 410 になる Type B テーマ（`isAreaTheme=false`）は除外し、
 *   存在しない / 410 対象の URL を生成しない。
 */
export function buildThemeSwitcherOptions(
  allThemes: readonly ThemeSwitcherTheme[],
  areaContext?: { areaCode: string },
  selectedPrefectureCode?: string | null
): ThemeSwitcherOption[] {
  const themes = areaContext
    ? allThemes.filter((t) => t.isAreaTheme)
    : allThemes;
  return themes.map((t) => {
    const href = areaContext
      ? hrefFor('area-theme', { areaCode: areaContext.areaCode, themeSlug: t.themeKey })
      : themeHref(t.themeKey);
    const preference = selectedPrefectureCode ?? THEME_PREFECTURE_SET_VALUE;

    return {
      themeKey: t.themeKey,
      title: t.title,
      href:
        !areaContext && selectedPrefectureCode !== undefined
          ? `${href}?pref=${preference}`
          : href,
    };
  });
}

interface Props {
  /** 現在表示中のテーマキー（セレクターの現在値・URL/props が正）。 */
  currentThemeKey: string;
  /** エリアページ経由時の都道府県コード（5桁）。指定時は都道府県文脈を維持する。 */
  areaContext?: { areaCode: string };
  /** 本文上部の切替行で使う、短いラベル + 全幅 Select の表示。 */
  compact?: boolean;
  /** テーマ一覧。サーバーで `THEME_SWITCHER_THEMES` を渡す。 */
  themes: readonly ThemeSwitcherTheme[];
}

/**
 * テーマ詳細ページ上部のコンパクトなテーマ切替コントロール。
 *
 * `ThemePageLayout` は本文上部の切替行 (テーマ・地域・テーマ一覧ボタン) に全幅で置く。
 * テーマ一覧への出口は切替行の右端のボタンが持つので、ここではラベルと Select だけを描く。
 * 2026-10-28 に左レールのテーマ一覧 (`ThemeSideNav` のグループ一覧) をサイドバーの
 * 「テーマ」と重複するため撤去し、ページ内のテーマ切替は本コンポーネントだけになった。
 *
 * 遷移は `@stats47/components` の `Select` + `useRouter().push()`。現在値は props を正とし
 * ローカル state で二重管理しない。
 */
export function ThemeSwitcher({
  currentThemeKey,
  areaContext,
  compact = false,
  themes,
}: Props) {
  const router = useRouter();
  const { hasProvider, selectedPrefectureCode } = useThemePrefecture();
  const options = buildThemeSwitcherOptions(
    themes,
    areaContext,
    hasProvider ? selectedPrefectureCode : undefined
  );

  return (
    <div
      className={cn(
        compact
          ? 'min-w-0'
          : 'mb-4 flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-border pb-3 text-sm'
      )}
    >
      {compact ? (
        <span className="block text-xs font-medium text-muted-foreground">
          テーマ
        </span>
      ) : (
        <span className="block shrink-0 text-xs font-medium text-muted-foreground">
          テーマを切り替える
        </span>
      )}
      <Select
        value={currentThemeKey}
        items={options.map((o) => ({ value: o.themeKey, label: o.title }))}
        onValueChange={(key) => {
          if (key === null || key === currentThemeKey) return;
          const next = options.find((o) => o.themeKey === key);
          if (next) {
            trackNavClick({
              surface: 'theme_switcher',
              label: key,
              href: next.href,
            });
            router.push(next.href);
          }
        }}
      >
        <SelectTrigger
          className={compact ? 'mt-1 w-full' : 'w-full sm:w-64'}
          aria-label="テーマを切り替える"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.themeKey} value={o.themeKey}>
              {o.title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
