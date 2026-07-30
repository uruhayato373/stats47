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
/**
 * 表記ゆれを吸収する共通正規化。
 *
 * e-Stat のコード名と metric の title は、全角/半角の数字と助詞「の」の有無が揺れる。
 * 例: title「個人企業の従業者1人当たり売上高」 vs コード名「従業者１人当たりの売上高」。
 * これを吸収しないと包含が成立せず、より短い別コード (売上高) に誤マッチする。
 */
function foldVariants(s: string): string {
  return s
    .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .replace(/[\s・,、]/g, "")
    .replace(/の/g, "");
}

export function normalizeCodeName(name: string): string {
  return foldVariants(
    name
      .replace(/^[0-9]+[_.\-\s]*/, "") // 先頭の連番
      .replace(/[（(].*?[）)]/g, ""), // 括弧書き
  ).trim();
}

/**
 * コード名の照合候補を返す。括弧を**落とした形と残した形の両方**。
 *
 * 括弧書きは補足のことが多いので既定では落とすが、括弧の中に本質が入っている例がある。
 * 実例: 社会生活基本調査「旅行・行楽の種類」の `22_海外（観光旅行）` は括弧を落とすと
 * 「海外」2 文字になり閾値を下回って候補から漏れ、`211_観光旅行` に誤マッチした
 * (「海外観光旅行の行動者率」に国内の観光旅行を当ててしまう)。
 * 括弧を残した「海外観光旅行」なら title に包含されるので正しく選べる。
 */
export function codeNameVariants(name: string): string[] {
  const stripped = normalizeCodeName(name);
  const kept = foldVariants(name.replace(/^[0-9]+[_.\-\s]*/, "").replace(/[（()）]/g, "")).trim();
  return kept === stripped ? [stripped] : [stripped, kept];
}

export function normalizeTitle(title: string): string {
  return foldVariants(title.replace(/[（(].*?[）)]/g, ""));
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

/**
 * 一致の下限。
 *
 * ★3 にしてはならない (2026-07-30 実測)。日本語の統計項目名には
 * 「書道」「野球」「柔道」「剣道」「卓球」「囲碁」「将棋」「茶道」「華道」「ヨガ」「つり」
 * のような 2 文字の項目が多数あり、3 にすると「書道の行動者率」が一致なしになって
 * **総数 (= 全項目の合計) にフォールバックする**。誤った系列を配信することになる。
 *
 * 2 文字の部分語による誤マッチ (「木造」が「非木造」と紛れる等) は、
 * 下限ではなく**一意性の判定**で防ぐ (最大スコアが並んだら ambiguous)。
 */
export const MATCH_MIN_CHARS = 2;

export interface AxisCode {
  code: string;
  name: string;
  unit?: string | null;
}

/**
 * title と一致する軸コードを探す。
 *
 * **2 段階**で評価する。順序が重要:
 *
 * 1. **包含** — コード名が丸ごと title に含まれるもの。最も強い証拠。
 * 2. **最長共通部分文字列** — 包含が 1 つも無いときだけ。コード名が title より詳しい
 *    ケース (「クラシック音楽鑑賞の行動者率」に対し「コンサートなどによるクラシック音楽鑑賞」) を拾う。
 *
 * ★共通部分列だけで測ると「より長いが違うコード」を選ぶ (2026-07-30 実測)。
 * title「個人企業の売上高」に対し
 *   「売上高（１企業当たり）」      → 正規化「売上高」        共通部 3
 *   「従業者１人当たりの売上高…」   → 正規化「従業者１人当たりの売上高」 共通部 4 (「の売上高」)
 * となり、従業者 1 人当たり (別 metric として存在する) を選んでしまう。
 * 包含を先に見れば「売上高」だけが title に含まれるので正しく選べる。
 *
 * 最大が一意でなければ `"ambiguous"` を返し**自動提案しない**。
 * 総数コードは候補から除く (総数は「title が何とも一致しない」ときの別経路で扱う)。
 */
export function matchCodeByTitle(
  title: string,
  codes: readonly AxisCode[],
): AxisCode | "ambiguous" | null {
  const t = normalizeTitle(title);
  const members = codes.filter((c) => !isTotalName(normalizeCodeName(c.name)));

  const pick = (scored: Array<{ c: AxisCode; score: number }>): AxisCode | "ambiguous" | null => {
    const ok = scored.filter((x) => x.score >= MATCH_MIN_CHARS);
    if (ok.length === 0) return null;
    const max = Math.max(...ok.map((s) => s.score));
    const best = ok.filter((s) => s.score === max);
    if (best.length > 1) return "ambiguous";
    return best[0].c;
  };

  // 1 段目: コード名が丸ごと title に含まれる (括弧あり/なしの両形で見る)
  const contained = members
    .map((c) => ({
      c,
      score: Math.max(0, ...codeNameVariants(c.name).filter((n) => n && t.includes(n)).map((n) => n.length)),
    }))
    .filter((x) => x.score > 0);
  const byContainment = pick(contained);
  if (byContainment !== null) return byContainment;

  // 2 段目: 最長共通部分文字列
  return pick(
    members.map((c) => ({
      c,
      score: Math.max(0, ...codeNameVariants(c.name).map((n) => longestCommonSubstring(t, n))),
    })),
  );
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
