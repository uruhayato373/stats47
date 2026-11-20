/**
 * KDP の表紙の縮小確認。読者が最初に見るのは検索結果の小さな表紙なので、
 * 縮めても題名が読めることを目で確かめ、表紙の SHA ごとに記録する。
 *
 * 高さは目安 (2026-11-09 時点の仮置き。Amazon の公式の寸法ではない):
 * スマホの検索結果相当 120px と PC の検索結果相当 220px。実測で違えばここを直す。
 */
export const COVER_THUMBNAIL_HEIGHTS_PX = [120, 220];

/** 公開の前提: 今の表紙の SHA に対する readable の記録があること。 */
export function coverThumbnailIssues(id, record, coverSha256) {
  if (!coverSha256) return [`${id}: 表紙のファイルが無く、縮小確認ができない`];
  if (!record) return [`${id}: 表紙の縮小確認の記録が無い (kdp-cover-thumbnail.mjs render → 目で確かめて record)`];
  if (record.coverSha256 !== coverSha256) return [`${id}: 縮小確認の記録が今の表紙と違う (表紙を差し替えたら取り直す)`];
  if (record.verdict !== "readable") return [`${id}: 縮小すると題名が読めないと記録されている`];
  return [];
}
