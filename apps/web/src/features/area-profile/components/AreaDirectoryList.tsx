import Link from "next/link";

import { cn } from "@stats47/components";

import { regionStyle } from "../constants/region-styles";

import type { AreaRegionGroup } from "../utils";

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

interface AreaDirectoryListProps {
  regionGroups: AreaRegionGroup[];
  /**
   * デスクトップの地方フィルタ。`"all"` 以外を指定するとその地方以外の section を
   * `hidden`（display:none）にする。全 section は常に DOM に描画するため、初期 HTML
   * には常に全 47 県リンクが含まれる（クローラから県リンクが消えない）。
   */
  activeRegionCode?: string;
  /** リンククリック時の計測フック（遷移は Link 自身が行う） */
  onSelect?: (prefCode: string, prefName: string) => void;
  /** embedded 面では境界線カードを省き、地方別テキストリンクとして密度を上げる。 */
  density?: "comfortable" | "compact";
  className?: string;
}

/**
 * 地方区分ごとの都道府県リンク一覧（semantic list・SSR）。
 *
 * `<nav>` > 地方 `<section>` > `<ul><li><Link>` の構造で、全県がキーボードだけで到達可能。
 * comfortable の各リンクは最低44px、embedded向けcompactは32pxのインラインリンク。
 * 同一ページ内で複数箇所（デスクトップ 2 ペイン / モバイルタブ）に描画されるため、
 * 重複 id を避けて `aria-label` で見出しを与える。
 */
export function AreaDirectoryList({
  regionGroups,
  activeRegionCode = "all",
  onSelect,
  density = "comfortable",
  className,
}: AreaDirectoryListProps) {
  const compact = density === "compact";

  return (
    <nav
      aria-label="都道府県一覧"
      className={cn("flex flex-col", compact ? "gap-3" : "gap-5", className)}
    >
      {regionGroups.map((region) => {
        const isHidden =
          activeRegionCode !== "all" && activeRegionCode !== region.regionCode;
        return (
          <section
            key={region.regionCode}
            aria-label={region.regionName}
            className={cn(isHidden && "hidden")}
          >
            <h3 className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-foreground">
              <span
                aria-hidden="true"
                className={cn(
                  "inline-block size-2.5 rounded-none",
                  regionStyle(region.regionCode).swatch,
                )}
              />
              {region.regionName}
            </h3>
            <ul
              className={cn(
                compact
                  ? "flex flex-wrap gap-x-1 gap-y-0.5"
                  : "grid grid-cols-2 gap-1.5 xl:grid-cols-3",
              )}
            >
              {region.prefectures.map((pref) => (
                <li key={pref.prefCode}>
                  <Link
                    href={`/areas/${pref.prefCode}`}
                    aria-label={`${pref.prefName}の統計を見る`}
                    onClick={() => onSelect?.(pref.prefCode, pref.prefName)}
                    className={cn(
                      compact
                        ? "inline-flex min-h-8 items-center px-1.5 text-sm text-foreground underline-offset-4 transition-colors hover:text-primary hover:underline"
                        : "flex min-h-11 items-center justify-between gap-2 rounded-none border border-border bg-card px-3 text-sm text-foreground transition-colors hover:bg-muted",
                      FOCUS_RING,
                    )}
                  >
                    <span>{pref.prefName}</span>
                    {!compact && (
                      <span aria-hidden="true" className="text-muted-foreground">
                        →
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </nav>
  );
}
