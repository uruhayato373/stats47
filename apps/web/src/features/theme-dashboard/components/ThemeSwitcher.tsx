"use client";

import { useRouter } from "next/navigation";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@stats47/components/atoms/ui/select";

import { ALL_THEMES } from "../config/all-themes";
import { isAreaTheme } from "../config/area-theme-slugs";
import { themeHref } from "../config/theme-urls";

export interface ThemeSwitcherOption {
  themeKey: string;
  title: string;
  href: string;
}

/**
 * テーマ切替セレクターの選択肢を `ALL_THEMES`（SSOT）から導出する。
 *
 * - 通常（全国）: 全テーマを `/themes/{themeKey}` へ。sitemap / テーマ一覧と同じ canonical。
 * - areaContext: 都道府県文脈を維持して `/areas/{areaCode}/{themeKey}` へ。ただし
 *   area ページで 410 になる Type B テーマ（`isAreaTheme=false`）は除外し、
 *   存在しない / 410 対象の URL を生成しない。
 */
export function buildThemeSwitcherOptions(areaContext?: {
  areaCode: string;
}): ThemeSwitcherOption[] {
  const themes = areaContext
    ? ALL_THEMES.filter((t) => isAreaTheme(t.themeKey))
    : ALL_THEMES;
  return themes.map((t) => ({
    themeKey: t.themeKey,
    title: t.title,
    href: areaContext
      ? `/areas/${areaContext.areaCode}/${t.themeKey}`
      : themeHref(t.themeKey),
  }));
}

interface Props {
  /** 現在表示中のテーマキー（セレクターの現在値・URL/props が正）。 */
  currentThemeKey: string;
  /** エリアページ経由時の都道府県コード（5桁）。指定時は都道府県文脈を維持する。 */
  areaContext?: { areaCode: string };
}

/**
 * テーマ詳細ページ上部のコンパクトなテーマ切替コントロール。
 *
 * 旧 `ThemeSidebar`（常設左レール・23 テーマ縦並び）を廃止し、本文を全幅化した
 * 代替。`ThemePageLayout`（動的テーマ / 市区町村財政 / area 経由）で共有し、bespoke
 * な `/themes/local-finance` はページ上部に個別配置する。
 * 遷移は `@stats47/components` の `Select` + `useRouter().push()`。現在値は props を正とし
 * ローカル state で二重管理しない。
 */
export function ThemeSwitcher({ currentThemeKey, areaContext }: Props) {
  const router = useRouter();
  const options = buildThemeSwitcherOptions(areaContext);

  return (
    <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-border pb-3 text-sm">
      <span className="shrink-0 text-xs font-medium text-muted-foreground">
        テーマを切り替える
      </span>
      <Select
        value={currentThemeKey}
        onValueChange={(key) => {
          if (key === currentThemeKey) return;
          const next = options.find((o) => o.themeKey === key);
          if (next) router.push(next.href);
        }}
      >
        <SelectTrigger className="w-full sm:w-64" aria-label="テーマを切り替える">
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
