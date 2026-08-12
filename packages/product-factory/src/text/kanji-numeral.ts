/**
 * 純漢数字の解釈 (「五百二十一万四千」→ 5,214,000)。
 *
 * 書籍の書き下ろし章は読み物として漢数字で数値を書く。既存のブログ用
 * `parseJapaneseNumeral` (`.claude/scripts/lib/article-factual-check.mjs`) は
 * 「1万2千」のような算用数字 + 位取り漢字しか解釈できず、**純漢数字を素通り**していた。
 * その結果、2026-08-05 の計算バグ修正前の数値が書き下ろし章に残っていることを
 * 誰も検出できなかった (2026-08-12 に人手で発見)。
 */

const DIGITS: Record<string, number> = {
  〇: 0, 零: 0, 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9,
};
/** 万未満の位。 */
const SMALL_UNITS: Record<string, number> = { 十: 10, 百: 100, 千: 1000 };
/** 万以上の位 (大きい順に処理する)。 */
const BIG_UNITS: ReadonlyArray<readonly [string, number]> = [
  ["兆", 1e12],
  ["億", 1e8],
  ["万", 1e4],
];

/** 漢数字として解釈しうる文字。 */
const KANJI_NUM_CHARS = "〇零一二三四五六七八九十百千万億兆";
export const KANJI_NUMERAL_PATTERN = new RegExp(`[${KANJI_NUM_CHARS}]+`, "g");

/**
 * 万未満の塊を解釈する (「五百二十一」→ 521 / 「千」→ 1000)。
 * 位の直前に数字が無い場合は 1 とみなす (「千円」= 1000 円)。
 */
function parseSmall(s: string): number | null {
  if (s.length === 0) return null;
  // 位取り文字を持たない 2 文字以上は「桁を並べた表記」(一四五一 = 1451 / 二〇四〇 = 2040)。
  // 位取りとして足し合わせると 1451 が 1 になる (2026-08-12 に「約一四五一万人」を
  // 10,000人 と誤読して発覚)。
  if (s.length >= 2 && ![...s].some((ch) => ch in SMALL_UNITS)) {
    let digits = "";
    for (const ch of s) {
      if (!(ch in DIGITS)) return null;
      digits += String(DIGITS[ch]);
    }
    return Number(digits);
  }
  let total = 0;
  let current = 0;
  let sawAny = false;
  for (const ch of s) {
    if (ch in DIGITS) {
      current = DIGITS[ch];
      sawAny = true;
      continue;
    }
    const unit = SMALL_UNITS[ch];
    if (unit === undefined) return null;
    total += (current === 0 ? 1 : current) * unit;
    current = 0;
    sawAny = true;
  }
  if (!sawAny) return null;
  return total + current;
}

/**
 * 純漢数字を数値にする。解釈できなければ null。
 *
 * 「五百二十一万四千」→ 5,214,000 / 「二・四倍」の「二」→ 2 のように、
 * 位取りが無い単独の数字も返す。
 */
export function parseKanjiNumeral(input: string): number | null {
  const s = String(input).trim();
  if (s.length === 0) return null;
  // 想定外の文字が混ざっていれば解釈しない (誤読を作らない)
  for (const ch of s) {
    if (!(ch in DIGITS) && !(ch in SMALL_UNITS) && !BIG_UNITS.some(([u]) => u === ch)) {
      return null;
    }
  }

  let rest = s;
  let total = 0;
  let sawAny = false;
  for (const [unitChar, scale] of BIG_UNITS) {
    const idx = rest.indexOf(unitChar);
    if (idx === -1) continue;
    const head = rest.slice(0, idx);
    // 「万」の直前が空 = 「万円」のような表現。1 万と解釈する。
    const n = head.length === 0 ? 1 : parseSmall(head);
    if (n === null) return null;
    total += n * scale;
    sawAny = true;
    rest = rest.slice(idx + 1);
  }
  if (rest.length > 0) {
    const tail = parseSmall(rest);
    if (tail === null) return sawAny ? total : null;
    total += tail;
    sawAny = true;
  }
  return sawAny ? total : null;
}

/**
 * 文中の漢数字 + 単位の組を取り出す。
 * 「東京都は五百二十一万四千円で全国一位」→ [{ raw:"五百二十一万四千", value:5214000, unit:"円" }, ...]
 *
 * 序数 (「一位」「二・四倍」) も拾えるよう単位は任意。呼び出し側が用途で絞る。
 */
export interface KanjiClaim {
  readonly raw: string;
  readonly value: number;
  readonly unit: string;
  readonly index: number;
}

/**
 * 「一人当たり」のように**数を数えていない**固定表現。算用数字にすると不自然になる。
 * 「二人以上の世帯」は家計調査の正式な集計区分名なので特に変換してはならない。
 */
const LEXICAL_PHRASES = [
  "一人当たり", "一人あたり", "一人当り",
  "一世帯当たり", "一世帯あたり", "一世帯当り",
  "一件当たり", "一件あたり", "一件当り",
  "二人以上の世帯", "二人以上世帯",
  "一人暮らし", "一人で", "一人ひとり",
  "同一年",
  // 「人口千人あたり」「件/千人」は**分母の単位**。数値の主張ではないので残す
  // (変換すると「人口1,000人あたり」になり統計の言い回しとして不自然)。
  "千人あたり", "千人当たり", "千人当り", "/千人", "／千人",
  "十万人あたり", "十万人当たり", "十万人当り",
] as const;

/** 西暦は桁区切りを入れない (1,980年 は誤り)。 */
const YEAR_MIN = 1800;
const YEAR_MAX = 2200;

/** 単位ごとの変換方針。金額・割合・順位は常に数値、人/年/件/世帯は小さい数だと語彙的用法が多い。 */
const ALWAYS_NUMERIC_UNITS = new Set(["円", "％", "%", "倍", "位"]);
const CONDITIONAL_UNITS = new Set(["人", "年", "件", "世帯"]);
/** 条件付き単位で「数値の主張」とみなす下限。 */
const CONDITIONAL_MIN = 10;

/** 3 桁区切りを入れる (金額が読みやすくなる)。 */
function formatArabic(n: number): string {
  return Number.isInteger(n) ? n.toLocaleString("en-US") : String(n);
}

export interface KanjiConversion {
  readonly before: string;
  readonly after: string;
  readonly reason: string;
}

/**
 * 本文中の漢数字表記の数値を算用数字にする。
 *
 * **数値の主張だけを変換し、語彙的な漢数字は残す**。誤変換は本文を壊すので、
 * 少しでも判断が付かない形は変換しない (残す方が安全)。
 *
 * 変換しないもの:
 * - 固定表現 (`LEXICAL_PHRASES`)
 * - 直前が算用数字 (「69万人」の「万人」を拾って壊さない)
 * - 直前が「数」(「数十年」→「数10年」を防ぐ)
 * - 条件付き単位で 10 未満 (「二人以上の世帯」「同一年」等)
 *
 * 「二・四倍」のような漢数字の小数は 1 つの数として 2.4倍 に直す。
 */
export function convertKanjiNumerals(text: string): { text: string; conversions: KanjiConversion[] } {
  const conversions: KanjiConversion[] = [];
  const src = String(text);
  const unitAlternation = [...ALWAYS_NUMERIC_UNITS, ...CONDITIONAL_UNITS].join("|");
  // 漢数字[・漢数字](単位) — 小数形も 1 つの塊として捉える
  const re = new RegExp(
    `([${KANJI_NUM_CHARS}]+)(?:・([${KANJI_NUM_CHARS}]+))?(${unitAlternation})`,
    "g",
  );

  const out = src.replace(re, (match, intPart: string, fracPart: string | undefined, unit: string, offset: number) => {
    // 固定表現の一部なら触らない
    for (const phrase of LEXICAL_PHRASES) {
      const from = Math.max(0, offset - phrase.length);
      if (src.slice(from, offset + match.length + phrase.length).includes(phrase)) {
        // 実際にこの match が phrase の範囲に重なるかを確認する
        let idx = src.indexOf(phrase, from);
        while (idx !== -1 && idx <= offset + match.length) {
          if (offset >= idx && offset < idx + phrase.length) return match;
          idx = src.indexOf(phrase, idx + 1);
        }
      }
    }
    const prev = offset > 0 ? src[offset - 1] : "";
    // 「69万人」の「万人」を拾って壊さない / 「数十年」を「数10年」にしない
    if (/[0-9]/.test(prev) || prev === "数" || prev === "・") return match;

    const intVal = parseKanjiNumeral(intPart);
    if (intVal === null) return match;
    const fracVal = fracPart ? parseKanjiNumeral(fracPart) : null;
    if (fracPart && fracVal === null) return match;
    const value = fracVal === null ? intVal : Number(`${intVal}.${fracVal}`);

    if (CONDITIONAL_UNITS.has(unit) && value < CONDITIONAL_MIN) return match;
    if (!ALWAYS_NUMERIC_UNITS.has(unit) && !CONDITIONAL_UNITS.has(unit)) return match;

    // 西暦は桁区切りを入れない (「二〇四〇年」→「2,040年」は誤り)
    const isYear = unit === "年" && Number.isInteger(value) && value >= YEAR_MIN && value <= YEAR_MAX;
    const after = `${isYear ? String(value) : formatArabic(value)}${unit}`;
    conversions.push({ before: match, after, reason: `${unit} の数値主張` });
    return after;
  });

  return { text: out, conversions };
}

export function extractKanjiClaims(text: string): KanjiClaim[] {
  const out: KanjiClaim[] = [];
  const body = String(text);
  for (const m of body.matchAll(KANJI_NUMERAL_PATTERN)) {
    const raw = m[0];
    const value = parseKanjiNumeral(raw);
    if (value === null) continue;
    // ★算用数字に続くスケール文字は漢数字ではない (2026-08-12)。
    //   「5兆8021億円」「約1.39億人泊」「約4,743万人泊」の 億 / 万 は
    //   算用数字に付く桁の表記で、算用数字への統一という規約に反していない。
    //   これを漢数字主張として数えると、正しく書かれた本文が「漢数字残」に化ける
    //   (実測: 書籍 33 件の大半がこれで、章コンポーザでは使える解説を丸ごと捨てていた)。
    const prev = body.slice(Math.max(0, m.index - 1), m.index);
    if (/^[0-9０-９,，.．]$/.test(prev)) continue;
    // 直後の単位 (円/人/位/倍/％ 等) を 4 文字まで見る
    const after = body.slice(m.index + raw.length, m.index + raw.length + 4);
    const unit = /^(円|人|位|倍|％|%|年|万円|千円|ポイント)/.exec(after)?.[1] ?? "";
    out.push({ raw, value, unit, index: m.index });
  }
  return out;
}
