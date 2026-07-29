/**
 * 受け入れ可能な正規化タイプの whitelist。
 *
 * `?norm=` query param 由来のユーザー制御値が R2 オブジェクトキー
 * (`app/ranking/{key}/values-{type}.json`) に流入するため、path traversal 対策として
 * サーバ側で固定値以外を弾く。値を受け取る Server Action すべてがこの 1 箇所を参照する
 * (二重実装すると片方だけ更新されて穴が開く)。
 */
const ALLOWED_NORMALIZATION_TYPES = new Set(["per_population", "per_area"]);

/** whitelist に無い値は undefined に落とす */
export function sanitizeNormalizationType(
  normalizationType?: string,
): string | undefined {
  return normalizationType && ALLOWED_NORMALIZATION_TYPES.has(normalizationType)
    ? normalizationType
    : undefined;
}
