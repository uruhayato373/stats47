/**
 * 都道府県名の短縮名 (接尾辞の 都/府/県 を 1 文字落とす)。**単一実装**。
 *
 * - 「東京都」→「東京」、「京都府」→「京都」、「青森県」→「青森」
 * - 「北海道」は「北海道」のまま。「道」は接尾辞ではなく地名の一部で、「北海」という地名は無い
 *   (2026-07-31 に svg-builder の地図タイルで「北海」が出た実例がある)
 *
 * 短縮名が要る箇所 (地図タイル・e-Stat 分類軸の照合・SNS 画像) は独自の正規表現を書かず、これを使う。
 * データ (prefectures.json / cities.json) を import しない純関数。ブラウザ向けの部品は
 * 軽量 subpath `@stats47/area/short-name` から引く (入口 `@stats47/area` は cities.json まで読み込む)。
 * ★冪等ではない: 短縮済みの「京都」を渡すと「京」になる。正式名称 (prefectures.json の prefName) にだけ適用する。
 */
export function prefectureShortName(prefName: string): string {
  if (prefName === "北海道") return prefName;
  return prefName.replace(/[都府県]$/, "");
}
