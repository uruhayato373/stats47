/**
 * 単位セマンティクスの正典 (純関数)。
 *
 * ## なぜ要るか
 *
 * 単位の解釈がリポジトリ内 44 箇所に独立実装され、同じクラスの事故が繰り返し起きた
 * (2026-08-12 の棚卸しで確定):
 * - 書籍監査が「千円で持つ SSOT」と「円で書かれた本文」を桁を揃えず比較して誤検出
 * - 地図照合が「13,326千円」の「千」をスケール接頭辞と誤読し全県不一致
 * - 家賃を年額のまま月額から引いて 46/47 県の順位が動いた (2026-08-05)
 *
 * 各実装が自前のスケール表を持つため、片方を直しても他方に波及しない。ここを唯一の
 * 解釈器にする。`money-unit.ts` の金額族指数表を吸収し、全次元へ広げたもの。
 *
 * ## 設計の芯: 「解釈できない」を黙って 1 倍にしない
 *
 * 単位文字列は e-Stat 由来で自由度が高く (実測 134 種)、すべてを解釈することはできない。
 * **解釈できない単位は `dimension: null` を返し、換算を求められたら null を返す**。
 * 呼び出し側は「換算不能」を受けて比較をスキップする。ここで 1 倍にフォールバックすると、
 * 桁違いの値が「一致」と判定されて監査が意味を失う。
 *
 * ## 判定に載せないもの (誤検知を出すゲートは運用で無効化される)
 *
 * - 分母つき単位 (`人（人口10万対）` `人口千対`) は**独立した次元**として扱い、素の「人」と
 *   換算しない。分母が違うものは比べられない
 * - 指数・全国=100 のような無次元量は次元 `index` にまとめ、他と換算しない
 */

/** 10 の指数で表すスケール接頭辞。単位文字列の先頭に付く。 */
const SCALE_PREFIX: ReadonlyArray<readonly [string, number]> = [
  ["兆", 12],
  ["千億", 11],
  ["百億", 10],
  ["十億", 9],
  ["億", 8],
  ["千万", 7],
  ["百万", 6],
  ["十万", 5],
  ["万", 4],
  ["千", 3],
  ["百", 2],
  ["十", 1],
];

/**
 * 換算可能な次元の基底単位。
 * ここに無い単位は「解釈できない」= 換算しない (数える対象としては扱える)。
 */
const BASE_UNITS: ReadonlyArray<readonly [string, string]> = [
  // [基底単位の表記, 次元名]
  ["円", "currency"],
  ["人", "people"],
  ["世帯", "household"],
  ["件", "count"],
  ["戸", "dwelling"],
  ["台", "count"],
  ["店", "count"],
  ["校", "count"],
  ["館", "count"],
  ["室", "count"],
  ["床", "count"],
  ["個", "count"],
  ["枚", "count"],
  ["本", "count"],
  ["隻", "count"],
  ["港", "count"],
  ["所", "count"],
  ["か所", "count"],
  ["箇所", "count"],
  ["施設", "count"],
  ["事業所", "count"],
  ["組", "count"],
  ["回", "count"],
  ["着", "count"],
  ["足", "count"],
  ["畳", "count"],
  // 実測 (metric config 2,295 件の走査) で出た個数系。推測で足さず出たものだけ収載する
  ["社", "count"],
  ["園", "count"],
  ["局", "count"],
  ["棟", "count"],
  ["冊", "count"],
  ["頭", "count"],
  ["胎", "count"],
  ["学級", "count"],
  ["加入", "count"],
  ["延数", "count"],
  ["人泊", "count"],
  ["g", "mass"],
  ["kg", "mass"],
  ["t", "mass"],
  ["トン", "mass"],
  ["ml", "volume"],
  ["l", "volume"],
  ["km", "length"],
  ["m", "length"],
  ["cm", "length"],
  ["mm", "length"],
  ["ha", "area"],
  // 面積・体積の記号表記 (NFKC 後の形。「ｍ2」→「m2」)
  ["m2", "area"],
  ["km2", "area"],
  ["m3", "volume"],
  ["kl", "volume"],
  ["Mwh", "energy"],
  ["kwh", "energy"],
  ["時間", "duration"],
  ["分", "duration"],
  ["日", "duration"],
  ["年", "duration"],
  ["歳", "age"],
  // NFKC は「℃」を「°C」(2 文字) に分解する。正規化後の形で持つ
  // (元の 1 文字で書くとカタログ側が一致しない。2026-08-12 にテストで検出)
  ["°C", "temperature"],
];

/** 割合を表す単位 (相互に換算しない — ‰ と ％ は 10 倍違うが混同事故を避け別次元にする)。 */
const RATIO_UNITS: ReadonlyArray<readonly [string, string]> = [
  ["％", "percent"],
  ["%", "percent"],
  ["‰", "permille"],
];

/** 無次元の指数。`（全国=100）`「指数」など。他と換算しない。 */
const INDEX_PATTERNS: readonly RegExp[] = [/^指数$/, /^（.*=\s*\d+）$/, /^\(.*=\s*\d+\)$/];

/** 分母つき (人口10万対 など)。素の単位と換算してはならない。 */
const DENOMINATOR_PATTERN = /(人口|児童|出生|生徒|婚姻)?\s*(十万|百万|万|千|10万|100万)\s*(対|あたり|当たり)/;

export interface UnitSemantics {
  /** 入力を正規化した文字列 (NFKC + trim)。 */
  readonly normalized: string;
  /**
   * 次元名。`null` は **解釈できない** ことを表す。
   * 換算を求められたら null を返し、呼び出し側に比較を諦めさせる。
   */
  readonly dimension: string | null;
  /** 基底単位に対する 10 の指数 (千円なら 3)。解釈できない場合は 0。 */
  readonly scaleExponent: number;
  /** 分母つき単位 (人口10万対 等) かどうか。素の単位と換算しない。 */
  readonly hasDenominator: boolean;
}

/** 全半角ゆれを畳む (ｈａ → ha、ｍ2 → m2)。 */
function normalize(raw: string): string {
  return String(raw).normalize("NFKC").trim();
}

/**
 * 単位文字列を解釈する。**解釈できなければ dimension を null にする**。
 *
 * 例:
 *   "千円"           → { dimension:"currency", scaleExponent:3 }
 *   "人（人口10万対）" → { dimension:"people", hasDenominator:true }  ※素の「人」と換算しない
 *   "学級･講座"       → { dimension:null }  ※解釈しない
 */
export function parseUnit(raw: string | null | undefined): UnitSemantics {
  const normalized = raw == null ? "" : normalize(raw);
  const empty: UnitSemantics = { normalized, dimension: null, scaleExponent: 0, hasDenominator: false };
  if (normalized === "") return empty;

  const hasDenominator = DENOMINATOR_PATTERN.test(normalized);

  for (const [pattern] of INDEX_PATTERNS.entries()) void pattern;
  if (INDEX_PATTERNS.some((re) => re.test(normalized))) {
    return { normalized, dimension: "index", scaleExponent: 0, hasDenominator: false };
  }

  for (const [token, dim] of RATIO_UNITS) {
    if (normalized === token) return { normalized, dimension: dim, scaleExponent: 0, hasDenominator: false };
  }

  // 分母つきは括弧を落とした本体で次元を見る (「人（人口10万対）」→ 人)
  const body = hasDenominator ? normalized.replace(/[（(].*?[）)]/g, "").trim() : normalized;
  const target = body === "" ? normalized : body;

  // スケール接頭辞 + 基底単位 (長い接頭辞から試す)
  for (const [prefix, exp] of SCALE_PREFIX) {
    if (!target.startsWith(prefix)) continue;
    const rest = target.slice(prefix.length);
    const dim = matchBaseUnit(rest);
    if (dim) return { normalized, dimension: dim, scaleExponent: exp, hasDenominator };
  }

  const dim = matchBaseUnit(target);
  if (dim) return { normalized, dimension: dim, scaleExponent: 0, hasDenominator };

  // 「人口千対」のように基底単位を持たない分母表現
  if (hasDenominator) return { normalized, dimension: "rate-per", scaleExponent: 0, hasDenominator: true };

  return empty;
}

function matchBaseUnit(s: string): string | null {
  const t = s.trim();
  if (t === "") return null;
  for (const [token, dim] of BASE_UNITS) {
    if (t === token) return dim;
  }
  // 大文字小文字ゆれ (KG / Ha)
  const lower = t.toLowerCase();
  for (const [token, dim] of BASE_UNITS) {
    if (token.toLowerCase() === lower) return dim;
  }
  return null;
}

/**
 * `from` 単位の値を `to` 単位で表すための倍率。**換算できなければ null**。
 *
 * ★null を 1 にフォールバックしてはならない。桁違いの値が「一致」になり監査が壊れる
 * (2026-08-12 に書籍監査で実際に起きた)。
 */
export function conversionFactor(
  from: string | null | undefined,
  to: string | null | undefined,
): number | null {
  const a = parseUnit(from);
  const b = parseUnit(to);
  if (a.dimension === null || b.dimension === null) return null;
  if (a.dimension !== b.dimension) return null;
  // 分母の有無が違うものは比べられない (「人」と「人口10万対の人」)
  if (a.hasDenominator !== b.hasDenominator) return null;
  return 10 ** (a.scaleExponent - b.scaleExponent);
}

/** 同じ次元か (換算可能か)。解釈できない側があれば false。 */
export function sameDimension(a: string | null | undefined, b: string | null | undefined): boolean {
  return conversionFactor(a, b) !== null;
}

/**
 * 日本語のスケール接頭辞 1 語を倍率にする。「千」→ 1000。接頭辞でなければ null。
 *
 * 本文中の「468万人」のような**表示文字列**の解釈に使う (単位文字列ではなく数値の直後に付く語)。
 * ★呼び出し側は「その接頭辞が単位の一部かどうか」を必ず判定すること
 *   (`unit="千円"` に対する「13,326千円」の千は単位の一部で倍率 1。
 *    `unit="人"` に対する「468万人」の万はスケールで倍率 1e4)。
 *   判定は `isScalePrefixPartOfUnit` を使う。
 */
export function scalePrefixMultiplier(prefix: string | null | undefined): number | null {
  if (typeof prefix !== "string" || prefix === "") return null;
  const normalized = normalize(prefix);
  for (const [token, exp] of SCALE_PREFIX) {
    if (token === normalized) return 10 ** exp;
  }
  // 京は metric config の実測に無いが、本文表記としてはありうる
  if (normalized === "京") return 1e16;
  return null;
}

/**
 * 表示文字列の接頭辞が「単位そのものの一部」かを判定する。
 *
 * ★これを誤ると桁が 1000 倍ずれる。2026-08-12 に地図照合で
 *   `unit="千円"` の「13,326千円」を ×1000 して全県不一致にした実例がある。
 */
export function isScalePrefixPartOfUnit(
  prefix: string | null | undefined,
  ssotUnit: string | null | undefined,
): boolean {
  if (typeof prefix !== "string" || prefix === "") return false;
  const unit = ssotUnit == null ? "" : normalize(ssotUnit);
  return unit.startsWith(normalize(prefix));
}

/**
 * 単位文字列に埋め込まれた倍率 (「百万円」→ 1e6)。解釈できなければ null。
 * `parseUnit` の scaleExponent を倍率で欲しい呼び出し側のための薄い入口。
 */
export function unitScaleMultiplier(unit: string | null | undefined): number | null {
  const parsed = parseUnit(unit);
  if (parsed.dimension === null) return null;
  return 10 ** parsed.scaleExponent;
}

/** 実測で確認した語彙 (metric config 2,295 件の走査結果)。カバレッジ計測に使う。 */
export const KNOWN_UNIT_SAMPLES: readonly string[] = [
  "円", "千円", "万円", "百万円", "億円", "兆円",
  "％", "%", "‰",
  "人", "千人", "万人", "人（人口10万対）", "人口千対", "人口10万対",
  "世帯", "件", "戸", "台", "店", "校", "館", "所", "か所", "箇所", "施設", "事業所",
  "g", "kg", "t", "トン", "ml", "l", "km", "cm", "ha",
  "時間", "分", "日", "年", "歳", "℃", "指数", "（全国=100）",
];
