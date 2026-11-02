/** Shared copy rule for statistical images across note, site, X and Instagram. */
export const CHART_IMAGE_COPY_POLICY = '画像内は指標名・年・単位・出典と誤読を防ぐ必須条件だけ。発行元（stats47・stats47.jp）は入れない。解説・読み方・一般的な注意書きは記事本文や投稿文へ。';

const BOILERPLATE = [
  /^都道府県統計$/,
  /47都道府県のうち.*抜粋/,
  /タイルの(?:大きさ|面積)は/,
  /タイルは.*模式図/,
  /色が濃いほど/,
  /画像をクリック|原寸で開|詳しくは|スワイプ|こちらをクリック/,
  // 2026-11-02 owner decision: the publisher is named in the article or post text, not in the image.
  /stats47/i,
];
/** Validate visible SVG text, not provenance, accessibility labels, or input metadata. */
export function assertMinimalChartCopy(svg) {
  const lines = [...svg.matchAll(/<text\b[^>]*>([\s\S]*?)<\/text>/g)]
    .map((match) => match[1].replace(/<[^>]*>/g, '').trim());
  const rejected = lines.find((line) => BOILERPLATE.some((pattern) => pattern.test(line)));
  if (rejected) throw Error('画像内の解説・一般的な注意書きは記事本文または投稿文へ移してください。');
}
