import {
  DEFAULT_DIVERGING_SCHEME,
  DEFAULT_SEQUENTIAL_SCHEME,
  normalizeColorScheme,
} from "@stats47/types";

import { findMetricPolarity } from "./metric-polarity";

/**
 * コロプレス配色の決定規則 (2026-07-31 新設)。
 *
 * `.claude/rules/blog-svg-chart-standards.md` §3 が言葉で書いている選択基準
 * (高い=悪い→red / 高い=良い→blue / 中立→orange / 自然環境→green) を、
 * **この関数が実装する**。規約側からはこの関数を正典として参照する。
 *
 * ## なぜ「明示指定を無条件で最優先」にしないか
 *
 * `interpolateBlues` は 2,295 metric 中 1,960 件 (85%) に書かれている。これは
 * **選択ではなく全 config に焼かれた既定値**で、「明示指定だから尊重する」と扱うと
 * 極性を入れてもどの色も変わらず、カタログが飾りになる。
 * したがって Blues 以外の明示指定だけを deliberate として扱う (既存 255 件を壊さない)。
 */

export type ColorSchemeReason =
  | "explicit"
  | "diverging"
  | "polarity"
  | "category"
  | "default";

export interface ColorSchemeDecision {
  /** 正典形 (`interpolateBlues`) */
  scheme: string;
  /** どの規則で決まったか (監査・分布計測用) */
  reason: ColorSchemeReason;
}

export interface ColorSchemeInput {
  key: string;
  /** config.visualization.colorScheme (未設定なら undefined) */
  explicit?: string | null;
  /** config.visualization.colorSchemeType */
  colorSchemeType?: string | null;
  category?: string | null;
}

/**
 * category の **topical 色** (良し悪しを主張しない配色)。
 *
 * polarity を category から推定することは**しない** — category は粗すぎて、
 * 同じ category に「高いほど良い」と「高いほど悪い」が同居する
 * (safetyenvironment に犯罪件数と検挙率が両方いる)。
 * 一方 topical 色は主題を表すだけで良し悪しを主張しないので、粗さが問題にならない。
 */
const CATEGORY_TOPICAL_SCHEME: Readonly<Record<string, string>> = {
  // 既に人手で選ばれている非 Blues の実績に一致する (agriculture=Greens 35 件 等)
  agriculture: "interpolateGreens",
  landweather: "interpolateOranges",
  energy: "interpolateOranges",
};

/** 高い=悪い → 赤 / 高い=良い → 青 (規約 §3 の棒グラフ基準と同じ) */
const POLARITY_SCHEME = {
  "higher-is-worse": "interpolateReds",
  "higher-is-better": DEFAULT_SEQUENTIAL_SCHEME,
} as const;

/**
 * 配色を決める。
 *
 * 決定順序:
 *   1. 明示指定が **Blues 以外**なら採用 (deliberate)
 *   2. colorSchemeType が diverging なら発散配色
 *   3. polarity があれば worse→Reds / better→Blues (neutral は次へ)
 *   4. category の topical 色
 *   5. 既定 Blues
 */
export function resolveColorScheme(input: ColorSchemeInput): ColorSchemeDecision {
  const explicit = normalizeColorScheme(input.explicit ?? null);
  if (explicit && explicit !== DEFAULT_SEQUENTIAL_SCHEME) {
    return { scheme: explicit, reason: "explicit" };
  }

  if (input.colorSchemeType === "diverging") {
    return { scheme: DEFAULT_DIVERGING_SCHEME, reason: "diverging" };
  }

  const polarity = findMetricPolarity(input.key);
  if (polarity && polarity.polarity !== "neutral") {
    return { scheme: POLARITY_SCHEME[polarity.polarity], reason: "polarity" };
  }

  const topical = input.category ? CATEGORY_TOPICAL_SCHEME[input.category] : undefined;
  if (topical) return { scheme: topical, reason: "category" };

  return { scheme: DEFAULT_SEQUENTIAL_SCHEME, reason: "default" };
}
