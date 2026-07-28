import { listAllMetrics } from "@stats47/data-configs";

/**
 * 記事・ランキングのタイトルから「楽天市場で売っている品目」を検出するための辞書。
 *
 * ★辞書をハードコードせず metric config (git TS SSOT) から導出する。
 *   家計調査系の metric は title が「{品目}消費支出額」「{品目}消費量」という決まった形なので、
 *   接尾辞を剥がせば品目名が機械的に取れる。手で品目リストを持つと metric が増えたときに
 *   必ずドリフトする (`.claude/rules/metric-config-standards.md` の「混在しない」原則)。
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

export interface ProductKeyword {
  /** 記事タイトル中で探す語 (= 品目名) */
  term: string;
  /** 楽天市場の検索に渡す語 */
  searchTerm: string;
}

let cached: ProductKeyword[] | null = null;

/**
 * metric config から品目辞書を構築する (プロセス内で 1 回だけ)。
 *
 * - 「うどん・そば」のような複合 title は中黒で分割する (記事タイトルは片方しか書かない)
 * - 1 文字の語は捨てる — 「米」「茶」「酒」は別語の一部として頻出し、無関係な記事に
 *   商品カードを出してしまう
 */
export function listProductKeywords(): ProductKeyword[] {
  if (cached) return cached;

  const terms = new Set<string>();
  for (const metric of listAllMetrics()) {
    const title = metric.title;
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

  cached = [...terms].map((term) => ({ term, searchTerm: term }));
  return cached;
}

/**
 * テキスト (記事タイトル等) から品目を 1 つ検出する。
 *
 * 一致が複数ある場合は **最も早く出現したもの**を採り、同じ位置なら**長い語**を採る。
 * 「そばつゆ」を含む記事で「そば」を拾わないための規則で、`detectPrefCodeFromText`
 * (ふるさと納税カード) と同じ判定にそろえている。
 */
export function detectProductKeyword(text: string): ProductKeyword | null {
  let best: { keyword: ProductKeyword; index: number } | null = null;

  for (const keyword of listProductKeywords()) {
    const index = text.indexOf(keyword.term);
    if (index === -1) continue;
    if (
      best === null ||
      index < best.index ||
      (index === best.index && keyword.term.length > best.keyword.term.length)
    ) {
      best = { keyword, index };
    }
  }

  return best?.keyword ?? null;
}
