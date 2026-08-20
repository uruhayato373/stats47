"use client";

import Link from "next/link";

import { cn } from "@stats47/components";
import { ChevronRight } from "lucide-react";

import { SectionHeader } from "@/components/section";

import { PREFECTURE_SET_LABEL } from "../types";

import { PrefectureSelect } from "./PrefectureSelect";
import { useThemePrefecture } from "./ThemePrefectureContext";
import { buildThemeSwitcherOptions } from "./ThemeSwitcher";

interface Props {
  /** 現在表示中のテーマキー（URL/props が正）。 */
  currentThemeKey: string;
  /** エリアページ経由時の都道府県コード（5桁）。指定時はリンクが都道府県文脈を維持する。 */
  areaContext?: { areaCode: string };
  /**
   * 地域ブロック（全国 / 都道府県セレクタ）を出すか。
   * `ThemePrefectureProvider` の外側で使うページ（bespoke な /themes/local-finance）は
   * セレクタが動かないので false にする。
   */
  showRegion?: boolean;
}

/**
 * テーマページの左レール（テーマ一覧 + 地域選択）。
 *
 * テーマ切替（旧: パンくず下の帯）と都道府県選択（旧: H1 右の小さな Select）を
 * 1 か所に集約し、全テーマ (ALL_THEMES) を一覧しながら回遊できるようにする。リストの文法は
 * ホーム / ランキング一覧の `PortalCategoryGrid variant="sidebar"` に合わせる。
 *
 * lg 未満では `PageShell` が描画しない（`leftRailNarrowBehavior="hide"`）。狭幅の代替は
 * ヘッダーの `lg:hidden` セレクタ 2 つ（テーマ = ThemeSwitcher / 地域 = PrefectureSelect）で、
 * ページ内容を切り替えるナビが操作対象より後ろに回らないようにしている。
 */
export function ThemeSideNav({
  currentThemeKey,
  areaContext,
  showRegion = true,
}: Props) {
  const options = buildThemeSwitcherOptions(areaContext);

  return (
    <nav aria-label="テーマと地域" className="pr-1">
      <SectionHeader title="テーマ" as="h2" />
      <div className="grid grid-cols-1 border-t border-border">
        {options.map((o) => {
          const active = o.themeKey === currentThemeKey;
          return (
            <Link
              key={o.themeKey}
              href={o.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group flex min-h-9 items-center gap-2 border-b border-border px-2 py-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                active ? "bg-accent" : "hover:bg-accent/50",
              )}
            >
              <span
                className={cn(
                  "min-w-0 flex-1 text-[13px]",
                  active
                    ? "font-semibold text-primary"
                    : "font-medium text-foreground group-hover:text-primary",
                )}
              >
                {o.title}
              </span>
              <ChevronRight
                className={cn(
                  "size-3.5 shrink-0 transition-transform group-hover:translate-x-0.5",
                  active ? "text-primary" : "text-muted-foreground group-hover:text-primary",
                )}
              />
            </Link>
          );
        })}
      </div>

      {showRegion && <RegionBlock />}
    </nav>
  );
}

function RegionBlock() {
  const { selectedAreaName, setSelected } = useThemePrefecture();

  // 現在の選択は Select 自身が表示するので、同じ文字列を pill で二重に出さない。
  // 県を選んでいるときだけ「47都道府県に戻す」を添える (Select を開かずに戻せる導線)。
  return (
    <div className="mt-6">
      <SectionHeader title="地域" as="h2" />
      <PrefectureSelect className="w-full" />
      {selectedAreaName ? (
        <button
          type="button"
          onClick={() => setSelected(null)}
          className="mt-2 text-[11px] text-muted-foreground underline-offset-2 hover:text-primary hover:underline"
        >
          {PREFECTURE_SET_LABEL}に戻す
        </button>
      ) : (
        <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
          県を選ぶと、指標カード・チャート・人の流れがその県に切り替わります。
        </p>
      )}
    </div>
  );
}
