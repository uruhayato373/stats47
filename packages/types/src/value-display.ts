import type { MetricPresentation } from './metric-presentation';

export interface ValueDisplayConfig {
  conversionFactor?: number;
  decimalPlaces?: number;
  displayUnit?: string;
}

/**
 * ランキングの「計算方法」の選択肢 (上段のボタン)。同じ指標の見方はここだけに持つ (2026-11-25 オーナー決定。
 * それまでは見方違いの別ページ (同じ groupKey) も持てて、同じ見方が 2 か所にあった)。
 * - per_population / per_area: サイトが人口・面積で割った値 (R2 に事前生成)
 * - series: 分母が人口・面積でない見方 (従業者 1 人当たり など)。別の指標 metric の公表値をそのまま出す
 */
export type NormalizationDisplayOption = RatioNormalizationOption | SeriesNormalizationOption;

/** Read compatibility for old snapshots. Authored definitions require the two numeric fields. */
export interface RatioNormalizationOption {
  type: 'per_population' | 'per_area';
  label: string;
  unit: string;
  scaleFactor?: number;
  decimalPlaces?: number;
  visualization?: MetricPresentation;
}

/** 別の指標の公表値を出す見方。unit・decimalPlaces・visualization は配信の組み立てがその指標の定義から焼く */
export interface SeriesNormalizationOption {
  type: 'series';
  /** 値を読む指標のキー (自分のランキングページは持たず、転送の台帳でこの見方へ 301 する) */
  metric: string;
  label: string;
  unit: string;
  /** その指標の表示の桁と換算 (配信の組み立てがその指標の定義から焼く) */
  valueDisplay?: ValueDisplayConfig;
  visualization?: MetricPresentation;
}

export interface AuthoredRatioNormalizationOption extends RatioNormalizationOption {
  scaleFactor: number;
  decimalPlaces: number;
}
/** 定義に書く series は指標と名前だけ (単位・桁・色はその指標の定義が正本) */
export interface AuthoredSeriesNormalizationOption {
  type: 'series';
  metric: string;
  label: string;
}
export type AuthoredNormalizationOption = AuthoredRatioNormalizationOption | AuthoredSeriesNormalizationOption;

/** 選択肢の識別子。URL の ?norm= とボタンの値に使う (series は指標のキー) */
export function normalizationOptionId(option: Pick<NormalizationDisplayOption, 'type'> & { metric?: string }): string {
  return option.type === 'series' ? (option.metric as string) : option.type;
}

/** 人口・面積で割る選択肢だけ (分母を引く処理・事前生成の対象) */
export function isRatioNormalizationOption<T extends { type: string }>(option: T): option is Extract<T, { type: 'per_population' | 'per_area' }> {
  return option.type === 'per_population' || option.type === 'per_area';
}
