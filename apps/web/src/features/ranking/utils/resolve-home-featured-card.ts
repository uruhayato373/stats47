import type { HomeFeaturedCardVariant } from "@stats47/data-configs";
import type { FeaturedValue } from "@stats47/ranking";

/**
 * ホーム注目ランキングの editorial card 解決 (純関数・仕様 doc 28 §5.4)。
 *
 * snapshot payload から「editorial で描画できるか」を決定的に判定する。
 * 不足時は null を返し、呼び元は現行 control (map/number) へフォールバックする。
 * ここで R2 fetch / gtag を行わない (Visual と同様に副作用ゼロ)。
 */

export interface HomeFeaturedSnapshotFields {
  homeFeatured?: {
    order: number;
    hook: string;
    variant: HomeFeaturedCardVariant;
  } | null;
  featuredTop?: FeaturedValue | null;
  featuredBottom?: FeaturedValue | null;
  featuredTopThree?: FeaturedValue[] | null;
  tileMapSvg?: string | null;
}

export interface HomeFeaturedEditorialModel {
  variant: HomeFeaturedCardVariant;
  hook: string;
  top: FeaturedValue | null;
  bottom: FeaturedValue | null;
  topThree: FeaturedValue[];
  tileMapSvg: string | null;
}

/**
 * §5.4 の必須 payload:
 * - homeFeatured 欠損 → null (旧 snapshot → control)
 * - question: featuredTop
 * - territory: tileMapSvg + featuredTop
 * - comparison: featuredTop + featuredBottom
 * - top-three: featuredTopThree 3 件
 */
export function resolveHomeFeaturedEditorial(
  item: HomeFeaturedSnapshotFields,
): HomeFeaturedEditorialModel | null {
  const homeFeatured = item.homeFeatured;
  if (!homeFeatured) return null;

  const top = item.featuredTop ?? null;
  const bottom = item.featuredBottom ?? null;
  const topThree = item.featuredTopThree ?? [];
  const tileMapSvg = item.tileMapSvg ?? null;

  const hasTop = top !== null && top.areaName.trim().length > 0 && top.value !== null;
  const hasBottom = bottom !== null && bottom.areaName.trim().length > 0 && bottom.value !== null;

  switch (homeFeatured.variant) {
    case "question":
      if (!hasTop) return null;
      break;
    case "territory":
      if (!hasTop || !tileMapSvg) return null;
      break;
    case "comparison":
      if (!hasTop || !hasBottom) return null;
      break;
    case "top-three":
      if (topThree.length < 3) return null;
      break;
    default:
      return null;
  }

  return {
    variant: homeFeatured.variant,
    hook: homeFeatured.hook,
    top,
    bottom,
    topThree,
    tileMapSvg,
  };
}

/**
 * この item の表示に values.json の追加 fetch が要るか。
 *
 * - 新 snapshot (tileMapSvg + 派生値 焼き込み済み) → 常に false (追加 fetch 0 の保証)
 * - 旧 snapshot で tileMapSvg 未焼き込み → true (現行 control 用の既存フォールバックと同条件)
 * - development のみ: homeFeatured があるのに editorial payload 不足 → true (in-memory 補完を許可)。
 *   production では補完せず control へフォールバックする (§5.4)。
 */
export function needsHomeFeaturedValuesFetch(
  item: HomeFeaturedSnapshotFields,
  options: { isDevelopment: boolean },
): boolean {
  if (item.tileMapSvg == null) return true;
  if (!options.isDevelopment) return false;
  if (!item.homeFeatured) return false;
  return resolveHomeFeaturedEditorial(item) === null;
}
