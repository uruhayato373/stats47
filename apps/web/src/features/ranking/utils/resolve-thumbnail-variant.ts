import type { RankingThumbnailVariant } from "@stats47/data-configs";

/**
 * ランキングリンクカードのサムネイル A/B バリアント解決。
 *
 * A = 地図型 ("map") = 後方互換の標準 (47 都道府県タイル地図)。
 * B = 数値型 ("number") = 代表値を強調 (1 位の値にニュース性がある指標)。
 *
 * 正典(A/B解決規則): このファイル (resolve-thumbnail-variant.ts) が SSOT
 *
 * 純関数 (副作用なし)。UI からも generate-ogp-images からも同じ規則で解決できるように
 * 表示ロジックから分離する。完全未設定・データ欠損・値が長すぎる場合は必ず "map" に戻す。
 */

/**
 * 数値型で許容する最大整数桁数。これを超えると縮小しすぎて読めないため A 型へ戻す
 * (仕様 §6 B型「5桁以上…はAへ戻す」= 桁数 5 以上で fallback = 上限 4 桁)。
 */
export const MAX_NUMBER_VARIANT_DIGITS = 4;

/**
 * 整形済みの表示値 (例: "51.8" / "11,673,554" / "2,309") が数値型に長すぎるか。
 * 桁 (0-9) の個数が {@link MAX_NUMBER_VARIANT_DIGITS} を超えたら true。
 * 空・未定義も「表示不可」として true (数値型に使えない)。
 */
export function isThumbnailValueTooLong(topValue?: string | null): boolean {
  if (!topValue) return true;
  const digitCount = topValue.replace(/[^0-9]/g, "").length;
  return digitCount > MAX_NUMBER_VARIANT_DIGITS;
}

export interface ResolveThumbnailVariantInput {
  /** metric config (SSOT) の明示値。最優先。 */
  configVariant?: RankingThumbnailVariant | null;
  /** 呼び出し側 (表示場所コンポーネント) の明示指定。config の次に優先。 */
  callerVariant?: RankingThumbnailVariant | null;
  /** 表示場所の既定値 (home=number / category・survey=map 等)。 */
  locationDefault?: RankingThumbnailVariant | null;
  /** 1 位の都道府県名 (整形済み)。数値型に必須。 */
  topAreaName?: string | null;
  /** 1 位の値 (整形済み表示文字列)。数値型に必須。長すぎると A へ戻す。 */
  topValue?: string | null;
}

/**
 * 解決順: config > 呼び出し側 > 表示場所既定 > "map"。
 * "number" に解決されても、1 位名/値が欠損 or 値が長すぎる場合は "map" へ戻す。
 */
export function resolveRankingThumbnailVariant(
  input: ResolveThumbnailVariantInput,
): RankingThumbnailVariant {
  const resolved =
    input.configVariant ?? input.callerVariant ?? input.locationDefault ?? "map";

  if (resolved !== "number") return "map";

  const hasArea = !!input.topAreaName && input.topAreaName.trim().length > 0;
  const hasValue = !!input.topValue && input.topValue.trim().length > 0;
  if (!hasArea || !hasValue || isThumbnailValueTooLong(input.topValue)) {
    return "map";
  }
  return "number";
}
