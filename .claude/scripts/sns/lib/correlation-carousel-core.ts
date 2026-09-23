/**
 * Instagram「相関」カルーセルの純粋関数群 (データ層のみ・Remotion コンポーネントは持たない)。
 *
 * - タウトロジー判定: build-correlation-snapshot.ts の trivial-pairs.ts (手動キュレーション) は
 *   「しじみ消費支出額 × しじみ消費量」のような同一現象ペアを全て拾いきれていない
 *   (2026-09-23 時点の本番 top-pairs.json に実在確認済み)。本モジュールはキー/タイトルの
 *   接尾辞パターンから機械的に「同じものを2通りに測っただけ」を検出し、trivial-pairs.ts を
 *   補完する (置き換えない・両方適用される)。
 * - 相関係数の計算は再実装せず packages/correlation/src/utils/calculate-pearson.ts を呼び出し元
 *   スクリプトが import する (このファイルは calculate-pearson.ts に依存しない)。
 *
 * 正典: .claude/rules/evidence-based-judgment.md (因果を示唆しない), sns-content-standards.md §2-3b
 */
import { isExcludedCorrelationKey } from "../../../../packages/correlation/src/trivial-pairs.ts";

// ─── キー stem 判定 ─────────────────────────────────────────────────────────
//
// 「支出額」と「量」のように、分子・分母や測定方法が違うだけで同じ現象を指すキー接尾辞。
// 両方を剥がした残り (stem) が一致すれば「別の指標に見えるが実質同じもの」と判定する。
const KEY_STEM_SUFFIXES = [
  "-consumption-expenditure",
  "-consumption-quantity",
  "-per-100k",
  "-per-1000",
  "-rate",
  "-ratio",
  "-count",
] as const;

/** 1 回のパスで最長一致の接尾辞を剥がし、変化がなくなるまで繰り返す (複合接尾辞対策)。 */
export function stemRankingKey(key: string): string {
  let current = key;
  for (let i = 0; i < 5; i++) {
    const before = current;
    for (const suffix of [...KEY_STEM_SUFFIXES].sort((a, b) => b.length - a.length)) {
      if (current.endsWith(suffix) && current.length > suffix.length) {
        current = current.slice(0, -suffix.length);
      }
    }
    if (current === before) break;
  }
  return current;
}

// キーの stem と対になる日本語タイトルの接尾辞。「消費支出額」「消費量」は要件で明示された例。
// 汎用の「率・割合・数・額・量」も加えるが、2文字未満の stem になる場合は誤検出防止のため
// evaluateTautology 側で不採用にする。
const TITLE_STEM_SUFFIXES = [
  "消費支出額",
  "消費量",
  "消費金額",
  "率",
  "割合",
  "数",
  "額",
  "量",
] as const;

export function stemTitle(title: string): string {
  let current = title;
  for (let i = 0; i < 5; i++) {
    const before = current;
    for (const suffix of [...TITLE_STEM_SUFFIXES].sort((a, b) => b.length - a.length)) {
      if (current.endsWith(suffix) && current.length > suffix.length) {
        current = current.slice(0, -suffix.length);
      }
    }
    if (current === before) break;
  }
  return current;
}

/**
 * タイトル末尾の丸括弧注記 (例:「風力発電導入量（設備容量）」の「（設備容量）」) を剥がす。
 * 同じ現象を「（設備容量）」「（設置基数）」のように単位違いの注記だけで書き分けた2指標は、
 * 注記を剥がすと本体が完全一致する (例: 風力発電の設備容量 vs 設置基数)。
 */
export function stripTrailingParenthetical(title: string): string {
  let current = title;
  for (let i = 0; i < 3; i++) {
    const stripped = current.replace(/[（(][^（）()]*[）)]\s*$/u, "");
    if (stripped === current) break;
    current = stripped;
  }
  return current;
}

// ─── 無正規化の実数・総額の判定 ─────────────────────────────────────────────
//
// 「人口が多い県はどの実数も大きい」だけの相関 (人口比例の絶対数) を候補から除く。
// 3 段の判定 (いずれか true で raw 扱い):
//   1. normalizationBasis が snapshot 側で明示されていれば正規化済みとみなす (最優先)
//   2. trivial-pairs.ts の EXCLUDED_CORRELATION_KEYS (人が精査済みの絶対数キー一覧) に載っている
//   3. キー名に正規化を示す語 (-ratio/-rate/-per-/-density/-index/-percentage/-share) が無く、
//      unit が実数・総額の単位 (千円/人/世帯/所/件 等) である
// unit は千円単位の「総額」(投資及び出資金 等) と「1世帯当たり月額」(実収入 等) を区別できないが、
// 後者は多くの場合キー名に "-per-" 等の正規化語を含むため 3. の除外条件で誤検出を避けられる。
const RAW_ABSOLUTE_UNITS = new Set([
  "千円",
  "億円",
  "万円",
  "人",
  "世帯",
  "戸",
  "所",
  "件",
  "台",
  "校",
  "施設",
  "軒",
  "箇所",
  "棟",
  "隻",
  "頭",
  "局",
  "店",
  "ｍ2",
  "ｍ²",
  "km",
  "km2",
  "km²",
  "ｋｍ",
  "ha",
  "ｈａ",
  "トン",
  "kl",
  "千kl",
  "千トン",
  "kWh",
  "百万円",
  "事業所",
  "区域",
  "か所",
  "個",
  "着",
  "足",
  "枚",
  "館",
]);

const NORMALIZED_KEY_HINT_RE = /-(ratio|rate|per-|density|index|percentage|share)/;

export interface RawUnitCheckInput {
  key: string;
  unit: string | null;
  normalizationBasis: string | null;
}

export function isRawUnnormalizedKey(input: RawUnitCheckInput): boolean {
  if (input.normalizationBasis) return false;
  if (isExcludedCorrelationKey(input.key)) return true;
  if (NORMALIZED_KEY_HINT_RE.test(input.key)) return false;
  if (!input.unit) return false;
  return RAW_ABSOLUTE_UNITS.has(input.unit);
}

// ─── 総合判定 ───────────────────────────────────────────────────────────────

export interface CandidatePairMeta {
  keyX: string;
  keyY: string;
  titleX: string;
  titleY: string;
  unitX: string | null;
  unitY: string | null;
  normalizationBasisX: string | null;
  normalizationBasisY: string | null;
  /**
   * MetricConfig.source が `{kind:'external', fetcherKey:'calculated'}` (他指標からの算術導出) か。
   * 両側が算出値だと、同じ元系列 (例: 家計調査の可処分所得) を四則演算しただけで r が自明に
   * 高くなりやすい (例: 家賃差引後 vs 実質(物価補正後) の可処分所得)。省略時は false 扱い。
   */
  isCalculatedX?: boolean;
  isCalculatedY?: boolean;
}

export type TautologyReason =
  | "key-stem"
  | "title-contains"
  | "title-stem"
  | "title-parenthetical-variant"
  | "raw-unnormalized-x"
  | "raw-unnormalized-y"
  | "both-calculated-derivative";

export interface TautologyVerdict {
  tautological: boolean;
  reason: TautologyReason | null;
}

export function evaluateTautology(pair: CandidatePairMeta): TautologyVerdict {
  const stemX = stemRankingKey(pair.keyX);
  const stemY = stemRankingKey(pair.keyY);
  if (stemX.length > 0 && stemX === stemY) {
    return { tautological: true, reason: "key-stem" };
  }

  if (pair.titleX && pair.titleY) {
    if (pair.titleX.includes(pair.titleY) || pair.titleY.includes(pair.titleX)) {
      return { tautological: true, reason: "title-contains" };
    }
    const titleStemX = stemTitle(pair.titleX);
    const titleStemY = stemTitle(pair.titleY);
    if (titleStemX.length >= 2 && titleStemX === titleStemY) {
      return { tautological: true, reason: "title-stem" };
    }
    const baseX = stripTrailingParenthetical(pair.titleX);
    const baseY = stripTrailingParenthetical(pair.titleY);
    if (baseX.length >= 2 && baseX === baseY && (baseX !== pair.titleX || baseY !== pair.titleY)) {
      return { tautological: true, reason: "title-parenthetical-variant" };
    }
  }

  if (isRawUnnormalizedKey({ key: pair.keyX, unit: pair.unitX, normalizationBasis: pair.normalizationBasisX })) {
    return { tautological: true, reason: "raw-unnormalized-x" };
  }
  if (isRawUnnormalizedKey({ key: pair.keyY, unit: pair.unitY, normalizationBasis: pair.normalizationBasisY })) {
    return { tautological: true, reason: "raw-unnormalized-y" };
  }

  if (pair.isCalculatedX && pair.isCalculatedY) {
    return { tautological: true, reason: "both-calculated-derivative" };
  }

  return { tautological: false, reason: null };
}

// ─── 47都道府県の突合 ───────────────────────────────────────────────────────

export interface JoinRow {
  areaCode: string;
  name: string;
  x: number;
  y: number;
}

export interface JoinableValue {
  areaCode: string;
  areaName: string;
  value: number | null;
}

/** areaCode で X/Y を突合する。値が有限でない行は除外する (欠測を 0 として混ぜない)。 */
export function joinByPrefecture(xRows: JoinableValue[], yRows: JoinableValue[]): JoinRow[] {
  const yByArea = new Map(yRows.map((r) => [r.areaCode, r]));
  const out: JoinRow[] = [];
  for (const x of xRows) {
    if (x.value === null || !Number.isFinite(x.value)) continue;
    const y = yByArea.get(x.areaCode);
    if (!y || y.value === null || !Number.isFinite(y.value)) continue;
    out.push({ areaCode: x.areaCode, name: x.areaName, x: x.value, y: y.value });
  }
  return out;
}

export const REQUIRED_PREFECTURE_COUNT = 47;
export const MAX_YEAR_GAP_YEARS = 5;

// 2026-09-23 コーディネーター指示で 0.4 単独下限から「category 違い + 0.5-0.95 の帯」に強化。
// 旧上位候補 (実収入×可処分所得, エンゲル係数×食料費割合 等) は同一現象の裏表・定義の言い換えで
// r/rPopulationAdjusted が 0.95 以上に張り付いていた。category が違っても 0.95 以上は
// 「定義が違う言い方をしているだけ」を疑う (suspicious-definitional) 閾値として扱う。
export const MIN_POPULATION_ADJUSTED_R = 0.5;
export const MAX_POPULATION_ADJUSTED_R = 0.95;

export function yearGapExceedsLimit(yearX: string, yearY: string, maxGap = MAX_YEAR_GAP_YEARS): boolean {
  const gap = Math.abs(Number.parseInt(yearX, 10) - Number.parseInt(yearY, 10));
  if (!Number.isFinite(gap)) throw new Error(`year を数値化できません: ${yearX} / ${yearY}`);
  return gap > maxGap;
}

// ─── category 差分 + 人口調整後 r の帯 (2026-09-23 追加のハード gate) ───────
//
// evaluateTautology (stem/title/raw-unit/calculated) とは別の軸の gate。
// カテゴリ違いの2指標を要求することで「同じ経済圏の言い換え」を機械的に大きく減らし、
// rPopulationAdjusted の上限 0.95 で「category が違っても定義がほぼ同じ」ケース
// (例: 経済 x 労働賃金だが実質は同じ所得指標の変換) を弾く。下限 0.5 は「人口を除くと
// ほぼ無相関」を弾く (evaluateTautology の目的とは逆で、弱すぎる関係を除く)。

export interface CategoryRangeInput {
  categoryX: string;
  categoryY: string;
  rPopulationAdjusted: number;
}

export type CategoryRangeReason = "same-category" | "below-min-r" | "suspicious-definitional-r";

export interface CategoryRangeVerdict {
  ok: boolean;
  reason: CategoryRangeReason | null;
}

export function evaluateCategoryRangeGate(input: CategoryRangeInput): CategoryRangeVerdict {
  if (input.categoryX === input.categoryY) {
    return { ok: false, reason: "same-category" };
  }
  const absR = Math.abs(input.rPopulationAdjusted);
  if (absR < MIN_POPULATION_ADJUSTED_R) {
    return { ok: false, reason: "below-min-r" };
  }
  if (absR >= MAX_POPULATION_ADJUSTED_R) {
    return { ok: false, reason: "suspicious-definitional-r" };
  }
  return { ok: true, reason: null };
}

// ─── ハイライト (回帰直線に沿った両端 + 残差の外れ値) ───────────────────────
//
// 「最も特徴的な2県」を人手で選ばず、標準化した OLS 直線から機械的に導く:
//   - trendAnchors: z得点空間で回帰直線の方向ベクトルへ射影した値が最大/最小の2県
//     (相関の傾向を両端で象徴する県)
//   - outliers: trendAnchors を除いた残りから、直線からの残差 (|zy - r*zx|) が大きい上位2県
//     (傾向から外れる2県。trendAnchors と重複させず4県を作る)
// x/y の分散が0 (全県同値) の場合は射影・残差とも定義できないため空配列を返す。

export interface HighlightPoint extends JoinRow {}

export interface Highlights {
  trendAnchors: [HighlightPoint, HighlightPoint] | [];
  outliers: [HighlightPoint, HighlightPoint] | [];
}

function mean(values: number[]): number {
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function stdDev(values: number[], m: number): number {
  return Math.sqrt(mean(values.map((v) => (v - m) ** 2)));
}

export function computeFittedLineHighlights(points: JoinRow[]): Highlights {
  if (points.length < 4) return { trendAnchors: [], outliers: [] };

  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const mx = mean(xs);
  const my = mean(ys);
  const sx = stdDev(xs, mx);
  const sy = stdDev(ys, my);
  if (sx === 0 || sy === 0) return { trendAnchors: [], outliers: [] };

  const z = points.map((p) => ({ point: p, zx: (p.x - mx) / sx, zy: (p.y - my) / sy }));
  const r = mean(z.map((v) => v.zx * v.zy));
  const norm = Math.sqrt(1 + r * r);
  const dx = 1 / norm;
  const dy = r / norm;

  const withProjection = z.map((v) => ({
    ...v,
    projection: v.zx * dx + v.zy * dy,
    residual: Math.abs(v.zy - r * v.zx),
  }));

  const byProjectionDesc = [...withProjection].sort(
    (a, b) => b.projection - a.projection || a.point.areaCode.localeCompare(b.point.areaCode)
  );
  const high = byProjectionDesc[0];
  const low = byProjectionDesc[byProjectionDesc.length - 1];
  const trendAnchors: [HighlightPoint, HighlightPoint] = [high.point, low.point];
  const anchorCodes = new Set(trendAnchors.map((a) => a.areaCode));

  const outlierCandidates = withProjection
    .filter((v) => !anchorCodes.has(v.point.areaCode))
    .sort((a, b) => b.residual - a.residual || a.point.areaCode.localeCompare(b.point.areaCode));
  const outliers: [HighlightPoint, HighlightPoint] = [
    outlierCandidates[0].point,
    outlierCandidates[1].point,
  ];

  return { trendAnchors, outliers };
}

// ─── 文言生成 (因果を示唆しない) ─────────────────────────────────────────────

export function formatR(r: number): string {
  return r.toFixed(2);
}

/** r の符号だけからフックを作る。断定形にせず疑問形で締める (因果の主張を避ける)。 */
export function buildHook(titleX: string, titleY: string, r: number): string {
  return r >= 0
    ? `${titleX}が多い県ほど、${titleY}も多い？`
    : `${titleX}が多い県ほど、${titleY}は少ない？`;
}

export function buildCautionLine(rPopulationAdjusted: number): string {
  return `相関は因果関係を示しません。人口の影響を除くと r=${formatR(rPopulationAdjusted)}`;
}
