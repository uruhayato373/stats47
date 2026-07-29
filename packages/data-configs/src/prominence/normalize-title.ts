/**
 * ランキング title の正規化ユーティリティ。
 *
 * 目的の違う 2 つの正規化を持つ。混ぜると片方が壊れるので分けてある。
 *
 * - `normalizeTitleForDedup` — 同義タイトル (年・調査名違い) を畳んで代表を 1 本選ぶための
 *   **積極的な**正規化。括弧の中身を丸ごと落とす。
 *   （旧 `apps/web/src/app/category/[categoryKey]/page.tsx` の同名関数を移設したもの）
 * - `normalizeTitleForHook` — 問いかけコピーに埋め込むための**保守的な**正規化。
 *   意味を持つ括弧 (（夫）(妻) 等) は残し、「県は？」と重複する冗長サフィックスだけ落とす。
 *
 * このモジュールは何も import しない。
 */

/** 「〜県は？」と意味が重複するため hook では落とす末尾表現。 */
const REDUNDANT_TITLE_SUFFIXES: readonly string[] = [
  "（都道府県別）",
  "(都道府県別)",
  "（都道府県）",
  "(都道府県)",
  "（全国）",
  "(全国)",
];

/**
 * 括弧とその中身をすべて落とす。
 *
 * 内側の文字クラスが**開き括弧も除外している**のが要点。素朴に `[^）)]*` と書くと、
 * 閉じ括弧の無い入力 (`((((((…`) で「開始位置ごとに末尾まで走査して失敗」を繰り返し、
 * 入力長に対して二乗の時間がかかる (polynomial ReDoS / CodeQL js/polynomial-redos)。
 * 開き括弧で内側の走査を打ち切れば線形になる。
 *
 * 副次的に、入れ子 (`（あ（い）`) では内側だけを外す挙動になる。実データの title に
 * 入れ子は無く、全 2,295 件で従来と出力一致することを確認済み。
 */
export function stripParentheticals(text: string): string {
  return text.replace(/[（(][^（()）)]*[）)]/g, "");
}

/**
 * 年・調査名の括弧や空白差を無視してタイトルを正規化する（重複の代表選びに使う）。
 */
export function normalizeTitleForDedup(title: string): string {
  return stripParentheticals(title).replace(/\s+/g, "").trim();
}

/**
 * 問いかけコピー用の正規化。冗長サフィックスと空白だけを落とし、意味のある括弧は残す。
 *
 * 例: `30日以内交通事故死者数（都道府県別）` → `30日以内交通事故死者数`
 *     `救急搬送 病院収容所要時間`           → `救急搬送病院収容所要時間`
 *     `平均初婚年齢（夫）`                   → `平均初婚年齢（夫）` (括弧は保持)
 */
export function normalizeTitleForHook(title: string): string {
  let normalized = title.trim();
  for (const suffix of REDUNDANT_TITLE_SUFFIXES) {
    if (normalized.endsWith(suffix)) {
      normalized = normalized.slice(0, -suffix.length).trim();
    }
  }
  // 半角・全角の空白は詰める。日本語の複合語として読めるので区切りは要らない。
  return normalized.replace(/[\s　]+/g, "");
}

/**
 * 末尾の括弧を落とした形を返す。形容詞判定でだけ使う（表示には使わない）。
 *
 * `平均初婚年齢（夫）` は末尾が「）」なので、そのままでは「年齢 → 高い」の判定に乗らない。
 */
export function stripTrailingParenthetical(title: string): string {
  // 内側で開き括弧を除外する理由は stripParentheticals と同じ (ReDoS 回避)。
  return title.replace(/[（(][^（()）)]*[）)]\s*$/, "").trim();
}
