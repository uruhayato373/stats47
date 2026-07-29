import { RUNTIME_PRODUCT_KEYWORDS } from "@/config/runtime-metric-summaries.generated";

/**
 * 記事・ランキングのタイトルから「楽天市場で売っている品目」を検出するための辞書。
 *
 * ★辞書をハードコードせず metric config (git TS SSOT) から導出する。
 *   家計調査系の metric は title が「{品目}消費支出額」「{品目}消費量」という決まった形なので、
 *   接尾辞を剥がせば品目名が機械的に取れる。手で品目リストを持つと metric が増えたときに
 *   必ずドリフトする (`.claude/rules/metric-config-standards.md` の「混在しない」原則)。
 *
 * 導出は `product-keyword-derivation.ts` の純関数、実体はビルド前に焼いた
 * `RUNTIME_PRODUCT_KEYWORDS` を使う。ここで listAllMetrics() を呼ぶと、この辞書を使う
 * route すべてに METRICS_REGISTRY が入る (generate-runtime-metric-summaries.ts 参照)。
 * 検出ロジック (下記) は実行時のまま維持する。
 */

export interface ProductKeyword {
  /** 記事タイトル中で探す語 (= 品目名) */
  term: string;
  /** 楽天市場の検索に渡す語 */
  searchTerm: string;
}

let cached: ProductKeyword[] | null = null;

/** 生成済みの品目語を検出用の形に整える (プロセス内で 1 回だけ)。 */
export function listProductKeywords(): ProductKeyword[] {
  if (cached) return cached;
  cached = RUNTIME_PRODUCT_KEYWORDS.map((term) => ({ term, searchTerm: term }));
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
