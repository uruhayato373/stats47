'use client';


import { buttonVariants } from '@stats47/components';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@stats47/components/atoms/ui/sheet';
import { hrefFor } from '@stats47/data-configs/content/href';
import { ChevronDown } from 'lucide-react';

import Link from '@/components/atoms/SiteLink';
import { RailNavRow } from '@/components/surface';

import { trackNavClick } from '@/lib/analytics/events';

import { themeHref } from '../config/theme-href';
import { THEME_NAV_GROUPS } from '../config/theme-navigation';

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
 * - 通常テーマ: `/themes/{themeKey}`。県を選んでいるとき、県ごとのページを持つテーマ (`isAreaTheme`) は
 *   その県の `/areas/{areaCode}/{themeKey}` へ、持たないテーマ (港湾・鉄道・道路) は `?pref=<5桁コード>` を付ける。
 *   県×テーマの交点は 1 つの URL に着く (2026-10-30 オーナー決定。旧: 全リンクに `?pref=<コード|all>` を付けていた)。
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
    const areaCode = areaContext?.areaCode ?? selectedPrefectureCode ?? null;
    const href = !areaCode
      ? themeHref(t.themeKey)
      : t.isAreaTheme
        ? hrefFor('area-theme', { areaCode, themeSlug: t.themeKey })
        : `${themeHref(t.themeKey)}?pref=${areaCode}`;
    return { themeKey: t.themeKey, title: t.title, href };
  });
}

interface Props {
  /** 現在表示中のテーマキー（ボタンの表示・一覧の現在地。URL/props が正）。 */
  currentThemeKey: string;
  /** エリアページ経由時の都道府県コード（5桁）。指定時は都道府県文脈を維持する。 */
  areaContext?: { areaCode: string };
  /** テーマ一覧。サーバーで `THEME_SWITCHER_THEMES` を渡す。 */
  themes: readonly ThemeSwitcherTheme[];
}

/**
 * テーマ詳細ページ上部のテーマ切替 (2026-10-29 に Select + 「テーマ一覧」ボタンから Sheet 1 つにまとめた)。
 *
 * ボタンは今のテーマ名を示し、押すと右から Sheet が開く。Sheet の中は `THEME_NAV_GROUPS` の系統ごとの
 * テーマのリンクと、テーマ一覧 (`/themes`) への出口。選択中の都道府県 (Provider 配下) は各リンクへ引き継ぐ。
 * 系統に入っていないテーマは「その他」に並べ、どのテーマも Sheet から必ず辿れるようにする。
 */
export function ThemeSwitcher({ currentThemeKey, areaContext, themes }: Props) {
  const { hasProvider, selectedPrefectureCode } = useThemePrefecture();
  const options = buildThemeSwitcherOptions(
    themes,
    areaContext,
    hasProvider ? selectedPrefectureCode : undefined
  );
  const byKey = new Map(options.map((o) => [o.themeKey, o]));
  const grouped = new Set<string>(THEME_NAV_GROUPS.flatMap((g) => g.themeKeys));
  const groups = [
    ...THEME_NAV_GROUPS.map((g) => ({
      id: g.id,
      label: g.label,
      options: g.themeKeys.flatMap((key) => byKey.get(key) ?? []),
    })),
    { id: 'other', label: 'その他', options: options.filter((o) => !grouped.has(o.themeKey)) },
  ].filter((g) => g.options.length > 0);
  const currentTitle = byKey.get(currentThemeKey)?.title ?? themes.find((t) => t.themeKey === currentThemeKey)?.title;

  return (
    <Sheet>
      <SheetTrigger
        aria-label="テーマを切り替える"
        className={buttonVariants({ variant: 'outline', className: 'max-w-full justify-between' })}
      >
        <span className="truncate">{currentTitle ?? 'テーマ'}</span>
        <ChevronDown aria-hidden="true" />
      </SheetTrigger>
      {/* サイトの上端のヘッダー (sticky・z-200) と Cookie 同意 (z-[1100]) より前に出す。Sheet の既定は z-50 */}
      <SheetContent side="right" className="z-[1200]! overflow-y-auto">
        <SheetHeader>
          <SheetTitle>テーマを切り替える</SheetTitle>
          <SheetDescription>
            <Link href="/themes" className="underline underline-offset-4 hover:text-foreground">
              テーマ一覧を見る
            </Link>
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-4 px-4 pb-6">
          {groups.map((group) => (
            <nav key={group.id} aria-label={group.label}>
              <p className="mb-1 text-xs font-medium text-muted-foreground">{group.label}</p>
              {group.options.map((option) => (
                <RailNavRow
                  key={option.themeKey}
                  href={option.href}
                  active={option.themeKey === currentThemeKey}
                  chevron={false}
                  onClick={() =>
                    trackNavClick({ surface: 'theme_switcher', label: option.themeKey, href: option.href })
                  }
                >
                  {option.title}
                </RailNavRow>
              ))}
            </nav>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
