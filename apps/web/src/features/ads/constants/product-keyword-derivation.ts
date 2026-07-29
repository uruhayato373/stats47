/**
 * metric title から「楽天市場で売っている品目」を導出する純関数。
 *
 * 呼び出すのは生成時 (`scripts/generate-runtime-metric-summaries.ts`) だけで、
 * 実行時 (`product-keywords.ts`) は生成物 `RUNTIME_PRODUCT_KEYWORDS` を読む。
 * 導出規則の実装をここ1本に閉じることで、生成側と実行側に規則を二重実装して
 * metric 追加時にドリフトさせる余地を無くす。
 *
 * このモジュールは何も import しない (生成物も含む)。生成スクリプトから安全に呼べる。
 */

/** title からこの接尾辞を剥がすと品目名になる。長い順に試す。 */
const TITLE_SUFFIXES = [
  "消費支出額",
  "購入数量",
  "消費数量",
  "消費量",
  "支出額",
] as const;

/**
 * 品目として採用しない語。楽天検索に流しても意味が無い / 誤誘導になるもの。
 * - 「教育」「住居」等の費目カテゴリ (商品ではない)
 * - 1〜2 文字の語 (「米」等の頻出漢字は記事本文と誤マッチしやすい)
 */
const EXCLUDED_TERMS = new Set([
  "教育",
  "住居",
  "光熱",
  "水道",
  "保健医療",
  "交通",
  "通信",
  "被服",
  "履物",
  "教養娯楽",
  "諸雑費",
  "こづかい",
  "交際費",
  "仕送り金",
  // 通販で買えない (店頭・インフラ供給) もの
  "都市ガス",
  "ガソリン",
  "プロパンガス",
]);

/**
 * 「◯◯代」「◯◯料」「◯◯費」「◯◯賃」「◯◯税」は商品ではなく費目・料金なので品目にしない
 * (電気代・地震保険料・航空運賃 等)。
 */
const SERVICE_CHARGE_SUFFIX = /[代料費賃税]$/;

/**
 * metric title の一覧から品目語を導出する。
 *
 * - 「うどん・そば」のような複合 title は中黒で分割する (記事タイトルは片方しか書かない)
 * - 1 文字の語は捨てる — 「米」「茶」「酒」は別語の一部として頻出し、無関係な記事に
 *   商品カードを出してしまう
 *
 * 入力順に対して決定的で、重複は先勝ちで除く。
 */
export function deriveProductTermsFromTitles(
  titles: readonly string[],
): string[] {
  const terms = new Set<string>();
  for (const title of titles) {
    const suffix = TITLE_SUFFIXES.find((s) => title.endsWith(s));
    if (!suffix) continue;
    const stem = title.slice(0, -suffix.length).trim();
    for (const part of stem.split("・")) {
      const term = part.trim();
      if (term.length < 2) continue;
      if (EXCLUDED_TERMS.has(term)) continue;
      if (SERVICE_CHARGE_SUFFIX.test(term)) continue;
      terms.add(term);
    }
  }
  return [...terms];
}
