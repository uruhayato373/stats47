import { cn } from "@stats47/components";

import { buildAreaDirectoryData } from "../utils";

import { AreaSearch } from "./AreaSearch";
import {
  AreaSelectionPanels,
  type PrefectureNavigatorSurface,
} from "./AreaSelectionPanels";

import type { Prefecture } from "@stats47/area";

interface PrefectureNavigatorProps {
  prefectures: readonly Prefecture[];
  /** embedded = 回遊セクション、full = /areas の検索ハブ */
  variant?: "embedded" | "full";
  /** GA4 nav_surface の配置識別子 */
  surface: PrefectureNavigatorSurface;
  heading?: string;
  className?: string;
}

/**
 * 47都道府県を地図・地方別リンク・検索から選べる共通ナビゲーション。
 *
 * 全県リンクは通常の Next Link として SSR し、JavaScript が失敗しても直接遷移できる。
 * embedded は地図を常時表示して広いコンテナだけ一覧を併記し、full は検索と
 * モバイル向けの「一覧 / 地図」切り替えを提供する。
 */
export function PrefectureNavigator({
  prefectures,
  variant = "embedded",
  surface,
  heading,
  className,
}: PrefectureNavigatorProps) {
  const data = buildAreaDirectoryData(prefectures);

  return (
    <section
      aria-label={heading ?? "都道府県から探す"}
      className={cn("@container", className)}
    >
      {heading && (
        <h2 className="text-lg font-semibold text-foreground">{heading}</h2>
      )}
      {variant === "full" && (
        <AreaSearch
          prefectures={prefectures}
          className={heading ? "mt-3" : undefined}
        />
      )}
      <AreaSelectionPanels
        {...data}
        variant={variant}
        surface={surface}
        className={variant === "full" ? "mt-6" : undefined}
      />
    </section>
  );
}
