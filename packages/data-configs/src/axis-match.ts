/**
 * metric の title と e-Stat 分類軸のコード名を突き合わせる純関数。
 *
 * `diagnose-unpinned-axes.ts` が「絞り忘れた軸のどのコードが正しいか」を提案するのに使う。
 *
 * ## ★ここを単純化してはならない (2026-07-30 に一度誤った)
 *
 * 初版は「未指定軸に総数コードがあれば総数を pin」を機械的提案にしていた。これは
 * `hobby-participation-rate-art-appreciation` (美術鑑賞の行動者率) に対して
 * 「00_総数」= **全趣味の合計**を提案する。今直そうとしている欠陥 (別系列の値が入っている)
 * を新たに作るのと同じで、しかも形状ゲートは 47 行 1 系列になるので**通ってしまう**。
 *
 * 次に「コード名が title に含まれるか」で判定したが、これも足りない。e-Stat のコード名は
 * title より詳しいことが多く、title「クラシック音楽鑑賞の行動者率」に対しコード名は
 * 「06_コンサートなどによるクラシック音楽鑑賞」で包含が成立しない。
 *
 * 現在は最長共通部分文字列で測り、最大が一意のときだけ提案する。
 */

/** 「総数」を表すコード名か */
export function isTotalName(name: string): boolean {
  return /総数|全体|計$/.test(name);
}

/**
 * 軸コード名を title と突き合わせるために正規化する。
 * e-Stat のコード名は "02_美術鑑賞(テレビ・スマートフォン・パソコンなどは除く)" のような形なので、
 * 先頭の連番・括弧書き・記号を落として本体だけにする。
 */
export function normalizeCodeName(name: string): string {
  return name
    .replace(/^[0-9]+[_.\-\s]*/, "") // 先頭の連番
    .replace(/[（(].*?[）)]/g, "") // 括弧書き
    .replace(/[\s・,、]/g, "")
    .trim();
}

export function normalizeTitle(title: string): string {
  return title.replace(/[（(].*?[）)]/g, "").replace(/[\s・,、]/g, "");
}

/** 2 文字列の最長共通部分文字列の長さ */
export function longestCommonSubstring(a: string, b: string): number {
  if (!a || !b) return 0;
  let best = 0;
  let prev = new Array<number>(b.length + 1).fill(0);
  for (let i = 1; i <= a.length; i++) {
    const cur = new Array<number>(b.length + 1).fill(0);
    for (let j = 1; j <= b.length; j++) {
      if (a[i - 1] === b[j - 1]) {
        cur[j] = prev[j - 1] + 1;
        if (cur[j] > best) best = cur[j];
      }
    }
    prev = cur;
  }
  return best;
}

/** 一致の下限。2 文字だと「木造」「鑑賞」のような部分語が拾われすぎる */
export const MATCH_MIN_CHARS = 3;

export interface AxisCode {
  code: string;
  name: string;
  unit?: string | null;
}

/**
 * title と一致する軸コードを探す。
 *
 * 最大スコアが一意でなければ `"ambiguous"` を返し**自動提案しない**
 * (「クラシック音楽鑑賞」と「ポピュラー音楽鑑賞」は共通部が「音楽鑑賞」で並びうる)。
 * 総数コードは候補から除く (総数は「title が何とも一致しない」ときの別経路で扱う)。
 */
export function matchCodeByTitle(
  title: string,
  codes: readonly AxisCode[],
): AxisCode | "ambiguous" | null {
  const t = normalizeTitle(title);
  const scored = codes
    .filter((c) => !isTotalName(normalizeCodeName(c.name)))
    .map((c) => ({ c, score: longestCommonSubstring(t, normalizeCodeName(c.name)) }))
    .filter((x) => x.score >= MATCH_MIN_CHARS);
  if (scored.length === 0) return null;
  const max = Math.max(...scored.map((s) => s.score));
  const best = scored.filter((s) => s.score === max);
  if (best.length > 1) return "ambiguous";
  return best[0].c;
}

/**
 * 表章項目 (tab) のコードから、この統計表が率 (％) を直接返すかを判定する。
 *
 * 率の表なら該当メンバーを pin するだけで率が得られる (社会生活基本調査の行動者率が該当)。
 * 実数の表なら unit が % の metric は分子/分母の calculation が要る (木造住宅率など)。
 *
 * tab が未指定で複数コードある場合は tab 自体が絞り忘れなので判定しない (false)。
 */
export function tabProvidesRate(tabCodes: readonly AxisCode[], pinnedTab?: string): boolean {
  if (tabCodes.length === 0) return false;
  const isPercent = (u: string | null | undefined) => Boolean(u && /[%％]/.test(u));
  if (pinnedTab) return isPercent(tabCodes.find((c) => c.code === pinnedTab)?.unit);
  if (tabCodes.length === 1) return isPercent(tabCodes[0].unit);
  return false;
}
