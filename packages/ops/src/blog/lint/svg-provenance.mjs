/**
 * SVG の provenance コメント (`<!-- data-source: <json> | generated: <ISO日時> -->`) の扱い。
 *
 * ★なぜ切り出したか (2026-08-12)
 *   `generate-article-charts.ts` は SVG 冒頭にこの行を埋める (規約
 *   `.claude/rules/blog-svg-chart-standards.md` §4 で必須)。日時は実行のたびに変わるので、
 *   再生成結果を**生バイトで比較する gate** は内容が同一でも必ず「不一致」を出す。
 *
 *   実測 (公開 78 散布図): provenance 付き 9 枚だけが恒久的に rerender 判定になっていた。
 *   その 9 枚を上書きすると provenance が消える = 劣化する。gate は日次 cron に配線されて
 *   いるので、放置すれば毎日同じ 9 枚を劣化させ続ける構図だった。
 *
 *   gate の役目は「点や軸が変わったか」= **内容**ドリフトの検出なので、metadata は比較から外し、
 *   書き出し時は元の行を引き継ぐ。両方を 1 箇所に置いてテストで固定する。
 */

/** 冒頭の provenance コメント 1 行 (末尾の改行を含む)。 */
export const PROVENANCE_RE = /^<!--\s*data-source:[^>]*-->\n?/;

/**
 * XML コメント (`<!-- ... -->`) は内容に "--" を含められない (パースエラー)。
 * 相関 scatter の data ファイル名は 2 つの ranking key を "--" で連結するため
 * (例: `a-key--b-key-scatter.json`)、そのまま埋めると SVG が不正 XML になり
 * ブラウザが `<img>` で描画できない (broken image)。data-source の値は後段で
 * データとして読み戻さない (PROVENANCE_RE で丸ごと strip する) ので、隣接ハイフンを
 * 空白で割って可読性を保ちつつ "--" を消す。※コメント本文だけに適用すること
 * (行全体に掛けると終端 `-->` の "--" まで壊す)。
 */
export function sanitizeForXmlComment(text) {
  return String(text).replace(/-{2,}/g, (run) => run.split("").join(" "));
}

/** 冒頭に付ける provenance コメント 1 行 (末尾改行込み・XML 安全) を組み立てる。 */
export function buildProvenanceLine(dataFile, now = new Date()) {
  return `<!-- data-source: ${sanitizeForXmlComment(dataFile)} | generated: ${now.toISOString()} -->\n`;
}

/** 既存の provenance 行を、終端 `-->` を保ったまま本文だけ XML 安全化する。 */
export function sanitizeProvenanceLine(line) {
  return line.replace(
    /^(<!--)([\s\S]*?)(-->)/,
    (_, open, body, close) => open + sanitizeForXmlComment(body) + close,
  );
}

/** 内容比較のために provenance を外す。行が無ければそのまま返す。 */
export function stripProvenance(svg) {
  return typeof svg === "string" ? svg.replace(PROVENANCE_RE, "") : svg;
}

/** provenance を無視して内容が同じか。 */
export function sameSvgContent(a, b) {
  return stripProvenance(a) === stripProvenance(b);
}

/**
 * 書き出す SVG に provenance を付ける。
 * 既に付いていればそのまま。元ファイルの行があれば**引き継ぐ**(生成日時を無駄に更新しない)。
 * どちらも無ければ `now` で新規作成する。
 */
export function withProvenance(newSvg, oldSvg, dataFile, now = new Date()) {
  if (PROVENANCE_RE.test(newSvg)) return newSvg;
  const inherited = typeof oldSvg === "string" ? oldSvg.match(PROVENANCE_RE)?.[0] : undefined;
  // 引き継ぎ・新規どちらも XML 安全化する ("--" を含む旧コメントを再導入しない)。
  const line = inherited ? sanitizeProvenanceLine(inherited) : buildProvenanceLine(dataFile, now);
  return line + newSvg;
}
