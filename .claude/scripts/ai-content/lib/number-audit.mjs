/**
 * number-audit.mjs — ai-content を実データ (R2 の ranking values) と照合する純関数群。
 *
 * ## なぜ要るか
 *
 * audit-ai-content.mjs の `paren-number` は **括弧の中だけ**を見る。プロンプト
 * (ranking-content-prompt.ts) は括弧による数値挿入を全面禁止する一方、
 *   - FAQ の answer は「1位の県名・数値・年度を含む」= 実値を書くことが必須
 *   - insights は「1位と47位の倍率」「地方ブロック間の平均値比較」= 派生計算値を書く前提
 * なので「数値を書かせない」ことでは捏造を防げない。括弧外の裸の数値は従来ゲートを
 * 素通りする。安いモデルで量産するほどここに漏れる。
 *
 * ## 2 つの照合 (強さが違う)
 *
 * ### A. テキストの数値 → 「実データの最大値を超えるもの」だけを落とす
 *
 * 判定を厳しくしようとして 2 度失敗した (2026-07-30 に公開済み 153 件で実測):
 *
 *   1. 「実データから導出できる値の集合」との一致 → **破綻**。insights は地方ブロック
 *      平均を書く仕様で、任意の部分集合の平均は無限にあり列挙できない
 *      (誤検知: retail-store-count「近畿の7府県平均は21,415店」)。
 *   2. 「min〜max の区間内か」 → **まだ誤検知**。プロンプトが「全国平均との比較」を
 *      指示するため差分表現が頻出し、差分は必ず min を下回る
 *      (誤検知: bean-sprouts「全国平均を約2,849g上回り」= 8875 - 6026)。
 *
 * よって下限は捨て、**max を超える値だけ**を見る。狙いは桁違いの捏造 (max の数倍〜
 * 数十倍) で、これは読者が検証しにくく実害が最も大きい。max 以下の値は部分集合平均・
 * 差分・丸めのいずれでもありうるため判定しない。
 *
 * 弱いゲートに見えるが、**誤検知を出すゲートは運用で無効化される**ので確実性を優先する。
 * 数値の正しさの本体は下記 B (構造照合) が担う。
 *
 * max を超えても正当な値 (全国計・上位N県の累積和・最大最小の差・倍率・年) は許容集合で
 * 個別に通す。「人口10万対」のような分母表現、「12万6千人」の分割解釈も除外する。
 *
 * ### B. 県別解説の構造フィールド → 厳密照合 (こちらが本体)
 *
 * prefectureCommentary の items[] は `areaCode / areaName / rank / value` を持ち、
 * **テキストではなく構造データ**なので実データと 1:1 で厳密照合できる。プロンプト自身が
 * 「areaCode は…間違えると地図上で別の県にひも付くため致命的」と書いている箇所であり、
 * 数値・順位・県の対応の誤りをここで確実に捕まえる。
 *
 * 純関数のみ (I/O なし・module-level state なし) なので並列・反復呼び出し安全。
 * テスト: .claude/scripts/ai-content/__tests__/number-audit.test.mjs (`node --test`)
 *
 * 正典: .claude/rules/ranking-content-standards.md §コンテンツ仕様「品質フロア」
 */
import { scalePrefixMultiplier, unitScaleMultiplier } from "../../lib/unit-semantics.mjs";

/** 数量詞 → 倍率 (本文中の「746.0万人」等を実数へ直すため) */
/**
 * @deprecated 単位の解釈は `.claude/scripts/lib/unit-semantics.mjs` が正典。
 *   自前のスケール表を各所に置いたことが 44 箇所の独立実装を生んだ原因なので参照しない。
 */
const SCALE_SUFFIX = { 千: 1e3, 万: 1e4, 億: 1e8, 兆: 1e12 };

/** 照合対象の下限。これ未満は順位・構成比・倍率と区別できないため対象外 */
export const MIN_AUDITED_VALUE = 1000;

/** 区間・許容集合の判定に使う相対誤差 (丸め表記を吸収する) */
export const REL_TOLERANCE = 0.02;

/** 構造フィールド (rank/value) の照合に使う相対誤差 (float 誤差のみ吸収) */
export const STRICT_TOLERANCE = 0.001;

/**
 * 「約」「およそ」が付いた数値に使う相対誤差。
 * 実測 2026-07-30: bean-sprouts の「上位5県の合計は約43,000g」(実際 44,036 = 誤差 2.35%) が
 * 2% では落ちた。明示的な概数表現は粗い丸めが正当なので緩める。
 */
export const APPROX_TOLERANCE = 0.05;

/** 上位 N 県の累積和を許容集合に入れる上限 (insights が「上位5県の合計」等に触れる) */
const CUMULATIVE_TOP_N = 10;

/** 全角数字・全角カンマ・全角ピリオドを半角へ寄せる */
function toHalfWidth(text) {
  return text
    .replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .replace(/，/g, ",")
    .replace(/．/g, ".");
}

/**
 * unit 文字列からスケール倍率を得る。
 * 「百万円」の「万」に引っかからないよう、桁の大きい表記から先に判定する。
 */
export function unitMultiplier(unit) {
  if (!unit) return 1;
  // 解釈は正典へ委譲。解釈できない単位は 1 とみなす (ここは「倍率を掛けない」が正しい既定で、
  // 換算の可否を問う conversionFactor とは役割が違う)。
  return unitScaleMultiplier(unit) ?? 1;
}

/**
 * 数値の直後が「分母の表現」か (指標の定義であって数値主張ではない)。
 * 例: 「人口10万対」「10万人あたり」「1万人当たり」「10万人につき」
 */
function isDenominatorContext(after) {
  return /^\s*(?:人?\s*(?:あたり|当たり|当り|につき)|対\b|対[^0-9]|人?対)/.test(after);
}

/**
 * 本文から照合対象の数値主張を「グループ単位」で抽出する。
 *
 * 隣接する「数値+数量詞」の連なり (12万6千 / 1兆2000億) は 1 つのグループにまとめ、
 * 合算値と個別値の両方を候補に持たせる。判定側は**グループ内のどれか 1 つが許容されれば
 * グループ全体を通す** (「およそ12万6千人」を `6千`=6000 と誤読して落とさないため)。
 *
 * - `86,800` / `8.68万` / `5,802,432` に対応
 * - 直後が「年」の数値 (2021年 / 2021年度) は年表記として除外
 * - 直後が分母表現 (人口10万対 等) の数値は指標定義として除外
 *
 * @returns {{raw: string, candidates: number[]}[]} 候補が 1 つ以上あるグループのみ
 */
export function extractNumericClaims(text) {
  if (!text) return [];
  const s = toHalfWidth(String(text));
  const re = /(\d[\d,]*(?:\.\d+)?)\s*(兆|億|万|千)?/g;

  const raw = [];
  let m;
  while ((m = re.exec(s)) !== null) {
    const digits = m[1].replace(/,/g, "");
    if (digits === "" || digits === ".") continue;
    const base = Number(digits);
    if (!Number.isFinite(base)) continue;
    const suffix = m[2] ?? "";
    const after = s.slice(m.index + m[0].length);
    // 年表記 (2021年 / 2021年度) は数値主張ではない
    if (!suffix && /^\s*年/.test(after)) continue;
    raw.push({
      start: m.index,
      end: m.index + m[0].length,
      text: m[0].trim(),
      value: base * (scalePrefixMultiplier(suffix) ?? 1),
      hasSuffix: Boolean(suffix),
      after,
      // 概数表現 (約 / およそ / ほぼ) が直前にあるか
      approx: /(?:約|およそ|ほぼ)\s*$/.test(s.slice(Math.max(0, m.index - 4), m.index)),
    });
  }

  const groups = [];
  let i = 0;
  while (i < raw.length) {
    // 「数量詞付き + 直後に続く数値」は 1 つの数 (12万6千) として連結する
    let j = i;
    while (
      j + 1 < raw.length &&
      raw[j].hasSuffix &&
      raw[j].end === raw[j + 1].start
    ) {
      j++;
    }
    const tokens = raw.slice(i, j + 1);
    const last = tokens[tokens.length - 1];
    // グループ末尾が分母表現なら、この数はスケールの説明であって主張ではない
    if (!isDenominatorContext(last.after)) {
      const candidates = new Set();
      if (tokens.length > 1) {
        candidates.add(tokens.reduce((acc, t) => acc + t.value, 0));
      }
      for (const t of tokens) candidates.add(t.value);
      const usable = [...candidates].filter(
        (v) => Number.isFinite(v) && v >= MIN_AUDITED_VALUE,
      );
      if (usable.length) {
        groups.push({
          raw: tokens.map((t) => t.text).join(""),
          candidates: usable,
          approx: tokens.some((t) => t.approx),
        });
      }
    }
    i = j + 1;
  }
  return groups;
}

/** 都道府県名の表記ゆれを畳む (東京都 → 東京 / 大阪府 → 大阪) */
function normalizeAreaName(name) {
  return String(name ?? "")
    .trim()
    .replace(/[都道府県]$/, "");
}

/**
 * 実データ (values partition) から照合コンテキストを組む。
 *
 * @param {{values: object[], unit?: string, yearCode?: string}} input
 * @returns {{
 *   min: number, max: number, unitMult: number,
 *   allowed: number[],
 *   byAreaName: Map<string, {areaCode?: string, rank?: number, value: number}>,
 *   count: number,
 * } | null}
 */
export function buildValueContext({ values, unit, yearCode } = {}) {
  const rows = (values ?? []).filter(
    (v) => v && typeof v.value === "number" && Number.isFinite(v.value),
  );
  if (!rows.length) return null;

  const nums = rows.map((v) => v.value);
  const sorted = [...nums].sort((a, b) => b - a);
  const max = sorted[0];
  const min = sorted[sorted.length - 1];
  const sum = nums.reduce((a, b) => a + b, 0);

  // 区間 (min〜max) を超えても正当な値をここで通す
  const allowed = new Set([sum, sum / nums.length, max - min]);
  if (min > 0) allowed.add(max / min);
  let acc = 0;
  for (let i = 0; i < Math.min(CUMULATIVE_TOP_N, sorted.length); i++) {
    acc += sorted[i];
    allowed.add(acc);
  }
  if (yearCode) {
    const y = Number(String(yearCode).slice(0, 4));
    if (Number.isFinite(y)) allowed.add(y);
  }

  const unitMult = unitMultiplier(unit);
  if (unitMult !== 1) {
    for (const v of [...allowed]) allowed.add(v * unitMult);
  }

  // 同じ県名が複数行ある partition が実在する (実測: convenience-store-count-commercial の
  // 2025 partition は count 94 = 47×2 で、店舗数と別系列が同居していた)。上書きすると
  // 別系列と照合して誤検知するので**候補の配列**として持ち、いずれかに一致すれば良しとする。
  const byAreaName = new Map();
  for (const r of rows) {
    const key = normalizeAreaName(r.areaName);
    if (!key) continue;
    const list = byAreaName.get(key) ?? [];
    list.push({ areaCode: r.areaCode, rank: r.rank, value: r.value });
    byAreaName.set(key, list);
  }

  return {
    min,
    max,
    unitMult,
    allowed: [...allowed].filter((n) => Number.isFinite(n)),
    byAreaName,
    count: rows.length,
    /** 同名複数行を含むか (含む場合 partition の素性が怪しいので照合は緩める) */
    hasDuplicateAreas: [...byAreaName.values()].some((l) => l.length > 1),
  };
}

/** value が許容集合のいずれかと相対誤差 tol 以内で一致するか */
export function isAllowedNumber(value, allowed, tol = REL_TOLERANCE) {
  for (const a of allowed ?? []) {
    if (a === 0) {
      if (value === 0) return true;
      continue;
    }
    if (Math.abs(value - a) / Math.abs(a) <= tol) return true;
  }
  return false;
}

/**
 * value が実データの上限以下か (単位スケール違いの上限も見る)。
 *
 * 下限は見ない。プロンプトが「全国平均との比較」を指示するため差分表現が頻出し、
 * 差分は必ず min を下回るため下限判定は誤検知しか生まない (2026-07-30 実測)。
 */
function isWithinUpperBound(value, ctx, tol = REL_TOLERANCE) {
  const hi = ctx.max >= 0 ? ctx.max * (1 + tol) : ctx.max * (1 - tol);
  if (value <= hi) return true;
  if (ctx.unitMult !== 1 && value <= hi * ctx.unitMult) return true;
  return false;
}

/**
 * 本文中の、実データの最大値を超えかつ許容集合外の数値を返す。
 *
 * グループ内の候補 (12万6千 → 126000 / 120000 / 6000) はいずれか 1 つが許容されれば
 * グループ全体を通す。
 *
 * @returns {{raw: string, value: number}[]} value は代表値 (最初の候補)
 */
export function findOutOfRangeNumbers(text, ctx, tol = REL_TOLERANCE) {
  if (!ctx) return []; // 実データ未提供時は判定しない (fail-open)
  const seen = new Set();
  const out = [];
  for (const g of extractNumericClaims(text)) {
    const t = g.approx ? Math.max(tol, APPROX_TOLERANCE) : tol;
    const passes = g.candidates.some(
      (v) => isWithinUpperBound(v, ctx, t) || isAllowedNumber(v, ctx.allowed, t),
    );
    if (passes) continue;
    if (seen.has(g.raw)) continue;
    seen.add(g.raw);
    out.push({ raw: g.raw, value: g.candidates[0] });
  }
  return out;
}

/**
 * prefectureCommentary の構造フィールド (areaCode / rank / value) を実データと厳密照合する。
 *
 * areaName で実データを引き、その県の実 rank / value / areaCode と一致するかを見る。
 * 実データに存在しない県名は `unknown-area` として返す。
 *
 * @param {object[]} items prefectureCommentary.items
 * @param {ReturnType<typeof buildValueContext>} ctx
 * @returns {{areaName: string, field: string, expected: unknown, actual: unknown}[]}
 */
export function findPrefectureMismatches(items, ctx) {
  if (!ctx || !Array.isArray(items)) return [];
  const out = [];
  for (const it of items) {
    if (!it || typeof it !== "object") continue;
    const name = normalizeAreaName(it.areaName);
    if (!name) continue;
    const candidates = ctx.byAreaName.get(name);
    if (!candidates?.length) {
      // その県の観測値が無い (未収録・対象外)。捏造とは別事象なので field で区別する
      out.push({ areaName: String(it.areaName ?? ""), field: "unknown-area", expected: null, actual: null });
      continue;
    }

    const valueMatches = (truth) =>
      typeof it.value !== "number" ||
      typeof truth.value !== "number" ||
      Math.abs(it.value - truth.value) / (Math.abs(truth.value) || 1) <= STRICT_TOLERANCE;
    const rankMatches = (truth) =>
      typeof it.rank !== "number" || typeof truth.rank !== "number" || it.rank === truth.rank;
    const codeMatches = (truth) =>
      !it.areaCode || !truth.areaCode || String(it.areaCode) === String(truth.areaCode);

    // 同名複数行 (別系列の同居) があるので、いずれかの行と全項目一致すれば正しいとみなす
    if (candidates.some((t) => valueMatches(t) && rankMatches(t) && codeMatches(t))) continue;

    // 一致する行が無い → 最も近い候補を基準に、どの項目が食い違うかを報告する
    const truth =
      candidates.find((t) => valueMatches(t)) ??
      candidates.find((t) => codeMatches(t)) ??
      candidates[0];
    if (!valueMatches(truth)) {
      out.push({ areaName: name, field: "value", expected: truth.value, actual: it.value });
    }
    if (!rankMatches(truth)) {
      out.push({ areaName: name, field: "rank", expected: truth.rank, actual: it.rank });
    }
    if (!codeMatches(truth)) {
      out.push({ areaName: name, field: "areaCode", expected: truth.areaCode, actual: it.areaCode });
    }
  }
  return out;
}
