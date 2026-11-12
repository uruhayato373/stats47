/**
 * 図の中の文字 (SVG の <text>/<title>) に対する書籍版だけの校訂。
 *
 * 記録の正本は台帳 `products.kindle-figure-corrections` (data/products/kindle/figure-corrections.json + Schema)。
 * 経緯と契約 (before は R2 SVG の逐語で、1 回以上現れなければ生成を止める) は Schema の description にある。
 * ここは型を付けて export し、校訂を当てる関数と、文字列の置換では直せない変換を持つ。
 */
import type { EditorialCorrection } from "./editorial-corrections";
import data from "../../../../../data/products/kindle/figure-corrections.json";

/** key は `<slug>/<figure name>` (article.md の `![..](data/<name>.svg)`)。 */
export const KINDLE_FIGURE_CORRECTIONS = data.corrections as Readonly<Record<string, readonly EditorialCorrection[]>>;

/** 横幅 1080 の型の図の題 (72px)。左右の余白 64px を除いた幅に収まらない題は字を小さくする */
const WIDE_TITLE = /<text([^>]*?)font-size="72"([^>]*)>([^<]+)<\/text>/g;

/**
 * どの図にも当てる書籍版の直し (2026-11-03 v6 差分レビュー: ブログの図の一括の描き直しの型の不具合)。
 * - 出典名の入っていない「出典：」だけの行を消す (各章の「データ出典」節に出典がある)
 * - 横幅 1080 の型で、題が右端で切れるものは字を小さくして収める (「…都道府県ランキ」で切れていた)
 */
export function fixFigureTemplate(svg: string): string {
  const widthMatch = svg.match(/viewBox="0 0 (\d+(?:\.\d+)?) /);
  const width = widthMatch ? Number(widthMatch[1]) : 0;
  return svg
    .replace(/<text\b[^>]*>出典[：:]\s*<\/text>/g, "")
    .replace(WIDE_TITLE, (all, pre: string, post: string, text: string) => {
      const fit = Math.floor((width - 128) / [...text].length);
      return width > 0 && fit < 72 ? `<text${pre}font-size="${fit}"${post}>${text}</text>` : all;
    });
}

/**
 * 文字列の置換では直せない図の書籍版の直し。
 * - manufacturing-ranking: 「58,021,789 百万円」が長く、先頭の桁が県名に重なる (愛知県8,021,789 と読める。K-S1-09 v7 F02)。兆円にして短くする
 */
const FIGURE_TRANSFORMS: Readonly<Record<string, (svg: string) => string>> = {
  "manufacturing-aichi-dominance/manufacturing-ranking": (svg) =>
    svg.replace(/>([\d,]+) 百万円</g, (_all, n: string) => `>${(Number(n.replace(/,/g, "")) / 1_000_000).toFixed(1)}兆円<`),
};

/** SVG 文字列に図の校訂を当てる。before が 1 回も無ければ R2 の図が変わったので止める。 */
export function correctBookFigure(slug: string, name: string, svg: string): string {
  for (const c of KINDLE_FIGURE_CORRECTIONS[`${slug}/${name}`] ?? []) {
    if (!svg.includes(c.before)) {
      throw new Error(`Figure correction source changed: ${slug}/${name} (${c.before}). Re-check the R2 figure before generating an edition.`);
    }
    svg = svg.split(c.before).join(c.after);
  }
  const transform = FIGURE_TRANSFORMS[`${slug}/${name}`];
  return fixFigureTemplate(transform ? transform(svg) : svg);
}
