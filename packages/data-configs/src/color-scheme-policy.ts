import {
  DEFAULT_DIVERGING_SCHEME,
  DEFAULT_SEQUENTIAL_SCHEME,
  normalizeColorScheme,
} from "@stats47/types";

import { findMetricPolarity } from "../../../data/metrics/policy/polarity";

/** Explicit per-metric colors are authoritative, including blue. */

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
 *   1. 明示指定があれば採用
 *   2. colorSchemeType が diverging なら発散配色
 *   3. polarity があれば worse→Reds / better→Blues (neutral は次へ)
 *   4. category の topical 色
 *   5. 既定 Blues
 */
export function resolveColorScheme(input: ColorSchemeInput): ColorSchemeDecision {
  const explicit = normalizeColorScheme(input.explicit ?? null);
  if (explicit) {
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
