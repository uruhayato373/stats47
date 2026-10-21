/**
 * ブログの図・data JSON に載せるのは観測値のある県だけにする。
 *
 * R2 の `app/stats` は値の無い県を `value: null` の行で持つ (e-Stat の「…」「x」など)。これを図の生成で
 * `?? 0` にすると「漁獲ゼロ」と区別できなくなり、本文がそれを「ゼロの県」と数えて因果まで付けた
 * (2026-10-08 bonito-catch-prefecture、BLOG-DATA-MISSING-AS-ZERO-01)。配信の `app/ranking` と同じく、
 * 値の無い県は行ごと落とす。観測された 0 は残す。
 */
export function isObservedValue(value) {
  return typeof value === "number" && Number.isFinite(value);
}

export function observedOnly(rows) {
  return rows.filter((row) => isObservedValue(row?.value));
}
