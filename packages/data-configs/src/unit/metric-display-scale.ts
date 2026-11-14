import { INTEGER_FROM, MAX_SHOWN_FALLBACK, resolveChartDisplayScale, type ChartDisplayScale } from "./chart-display-scale";
import { formatUnitForDisplay } from "./unit-display";

/**
 * 指標 1 つの表示単位を決める入口 (2026-11-14 METRIC-DISPLAY-UNIT-WIRING-01)。
 *
 * 表示単位を決める仕組みは 2 つある: 指標の定義の `display` (人が書いた「万円」「MW」) と、
 * 図の規則 `resolveChartDisplayScale` (値から 万・億・兆 を選ぶ)。両方を別々に掛けると二重に換算されるので、
 * 画面はこの関数だけを呼び、**どちらか 1 つだけ**を元の値に掛ける。
 *
 * - 定義が表示単位 (`displayUnit`) を書いていれば、定義の単位・係数・小数桁を使う (図の規則は掛けない)
 * - 書いていなければ、図の規則が値から決める
 *
 * 定義の係数は `validate:config` の `[display-factor]`、単位と小数桁は `check:display-units` の
 * `auditAuthoredDisplay` が検査する。規約: `.claude/rules/unit-semantics-standards.md` §2.7
 */
export interface AuthoredDisplay {
  conversionFactor?: number;
  decimalPlaces?: number;
  displayUnit?: string;
}
export interface MetricDisplayInput {
  /** 配信値の単位 (指標の定義の `unit`)。 */
  unit: string | null | undefined;
  /** 指標の定義の `display` (ランキングの item では `valueDisplay`)。 */
  display?: AuthoredDisplay | null;
}
export interface MetricDisplayScale extends Omit<ChartDisplayScale, "reason"> {
  /** `authored` = 定義の表示単位。ほかは図の規則の理由。 */
  reason: ChartDisplayScale["reason"] | "authored";
}

export function resolveMetricDisplayScale(metric: MetricDisplayInput, values: readonly number[]): MetricDisplayScale {
  const display = metric.display;
  if (display?.displayUnit) {
    return { unit: formatUnitForDisplay(display.displayUnit), factor: display.conversionFactor ?? 1, decimals: display.decimalPlaces ?? null, reason: "authored" };
  }
  return resolveChartDisplayScale(metric.unit, values);
}

/** 単位の「何あたり」の部分 (「m3/日」の「/日」)。無ければ空文字。 */
function denominatorOf(unit: string): string {
  const normalized = unit.normalize("NFKC").replace(/\s+/g, "");
  const slash = normalized.indexOf("/");
  return slash < 0 ? "" : normalized.slice(slash);
}

/**
 * 表示単位が、元の単位の「何あたり」を落としたり足したりしていないか。
 * 「m³/日 → m³」と書くと、1 日あたりの量がためた量として読まれる (2026-11-14 の監査で 3 件)。
 */
export function displayUnitKeepsDenominator(unit: string | null | undefined, displayUnit: string): boolean {
  return denominatorOf(unit ?? "") === denominatorOf(displayUnit);
}

/** 台帳 (`data/metrics/display-units/ledger.json`) の 1 行から、定義の表示単位の検査に使う値。 */
export interface DisplayValueRange {
  /** 最新年の最大値 (元の単位)。値が無ければ null。 */
  max: number | null;
  /** 最新年の 0 でない最小の絶対値 (元の単位)。 */
  minNonZeroAbs: number | null;
  /** 図の規則が同じ値に選んだ倍率と小数桁。 */
  ruleFactor: number;
  ruleDecimals: number | null;
  /** 図の規則が単位を寄せるか (`reason === "rescaled"`)。 */
  ruleRescales: boolean;
}

const rounded = (value: number, decimals: number) => Number(value.toFixed(decimals));

/**
 * 定義の表示単位を、最新年の値に照らして検査する。問題を 1 件 1 文で返す (無ければ空)。
 *
 * - `[display-digits]`: 表示の最大値が 7 桁以上になる (図の規則の上限 `MAX_SHOWN_FALLBACK` と同じ)
 * - `[display-decimals]`: 換算する指標の小数桁が図の規則 (表示の最大が 1,000 以上で 0 桁、未満で 1 桁) と違う。
 *   ランキングのページ (定義) と型の画像 (図の規則) で桁の書き方が食い違う
 * - `[display-hides-min]`: 0 でない最小の県が 0 に丸まる。図の規則なら丸まらないときだけ問題にする
 *   (どの単位でも丸まる分布は「0.1未満」と書く)
 */
export function auditAuthoredDisplay(metric: MetricDisplayInput, range: DisplayValueRange): string[] {
  const display = metric.display;
  if (!display?.displayUnit || range.max === null) return [];
  const factor = display.conversionFactor ?? 1;
  const decimals = display.decimalPlaces ?? 0;
  const shownMax = Math.abs(range.max) * factor;
  const label = `「${metric.unit ?? ""}→${display.displayUnit}」`;
  const problems: string[] = [];
  if (shownMax >= MAX_SHOWN_FALLBACK) {
    problems.push(`[display-digits] ${label}は最大値が ${Math.round(shownMax).toLocaleString("ja-JP")} で 7 桁以上になる。万・億・兆の大きい単位にする`);
    return problems;
  }
  if (factor !== 1 || range.ruleRescales) {
    const expected = shownMax >= INTEGER_FROM ? 0 : 1;
    if (decimals !== expected) {
      problems.push(`[display-decimals] ${label}は表示の最大値が ${rounded(shownMax, 1).toLocaleString("ja-JP")} なので小数 ${expected} 桁 (書かれているのは ${decimals} 桁)。型の画像と桁をそろえる`);
    }
  }
  if (range.minNonZeroAbs !== null && rounded(range.minNonZeroAbs * factor, decimals) === 0
    && range.ruleDecimals !== null && rounded(range.minNonZeroAbs * range.ruleFactor, range.ruleDecimals) !== 0) {
    problems.push(`[display-hides-min] ${label}は 0 でない最小の県 (${range.minNonZeroAbs.toLocaleString("ja-JP")}) が 0 に丸まる。小さい単位にするか小数桁を増やす`);
  }
  return problems;
}
