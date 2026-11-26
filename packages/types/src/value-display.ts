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

/** 配信の形。古い snapshot を読めるよう、数値の 2 項目は任意のまま */
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

/** 分母の種類。人口・面積・世帯・人 (従業者 1 人当たり など、人口ではない人数) */
export type DenominatorKind = 'population' | 'area' | 'household' | 'person';

/**
 * 値を割っている分母 (2026-11-26 オーナー決定)。指標そのものの分母にも「計算方法」の選択肢にも同じ形で書く。
 * 画面の文言 (「人口10万人当たり」) は手で書かず、denominatorLabel がこの形から作る
 * (手書きは「千人」「1000人」「あたり」「当たり」に割れていた)。
 */
export interface Denominator {
  kind: DenominatorKind;
  /** 分母の規模。100000 = 10 万人当たり、1 = 1 人当たり、面積は km² */
  per: number;
  /** 対象を限るときだけ書く (「0〜5歳」「可住地」「従業者」) */
  scope?: string;
}

const DENOMINATOR_NOUN: Record<DenominatorKind, { subject: string; counter: string }> = {
  population: { subject: '人口', counter: '人' },
  area: { subject: '面積', counter: 'km²' },
  household: { subject: '', counter: '世帯' },
  person: { subject: '', counter: '人' },
};

/** 規模の書き方。千・万の位は漢字 (公表資料の「人口千人当たり」「人口10万人当たり」に合わせる)。面積は数字のまま */
function denominatorScaleText(per: number, kind: DenominatorKind): string {
  if (kind === 'area') return String(per);
  if (per >= 10000 && per % 10000 === 0) return `${per / 10000}万`;
  if (per === 1000) return '千';
  return String(per);
}

/** 分母の文言。{ population, 100000 } → 「人口10万人当たり」、{ area, 100 } → 「面積100km²当たり」 */
export function denominatorLabel({ kind, per, scope }: Denominator): string {
  const { subject, counter } = DENOMINATOR_NOUN[kind];
  return `${scope ?? ''}${subject}${denominatorScaleText(per, kind)}${counter}当たり`;
}

/** 「計算方法」の選択肢に書ける分母 (サイトが割る値を持っているのは人口と面積だけ) */
export interface RatioDenominator extends Denominator {
  kind: 'population' | 'area';
}

/**
 * 定義に書く、人口・面積で割る選択肢。分母は Denominator で書き、名前 (label)・識別子 (type)・係数 (scaleFactor) は
 * toRatioNormalizationOption が作る。unit は分子の単位を含むので書く。
 */
export interface AuthoredRatioNormalizationOption {
  denominator: RatioDenominator;
  unit: string;
  decimalPlaces: number;
  visualization?: MetricPresentation;
}
/** 定義に書く series は指標と名前だけ (単位・桁・色はその指標の定義が正本) */
export interface AuthoredSeriesNormalizationOption {
  type: 'series';
  metric: string;
  label: string;
}
export type AuthoredNormalizationOption = AuthoredRatioNormalizationOption | AuthoredSeriesNormalizationOption;

/** 定義の選択肢が人口・面積で割るものか (series ではないか) */
export function isAuthoredRatioOption(option: AuthoredNormalizationOption): option is AuthoredRatioNormalizationOption {
  return 'denominator' in option;
}

/** 定義の選択肢の識別子 (per_population / per_area / series)。配信の type と同じ値 */
export function authoredNormalizationType(option: AuthoredNormalizationOption): NormalizationDisplayOption['type'] {
  return isAuthoredRatioOption(option) ? `per_${option.denominator.kind}` : 'series';
}

/** 定義の選択肢の URL 上の識別子 (?norm=)。配信の normalizationOptionId と同じ値 */
export function authoredNormalizationOptionId(option: AuthoredNormalizationOption): string {
  return isAuthoredRatioOption(option) ? authoredNormalizationType(option) : option.metric;
}

/** 定義の選択肢 (人口・面積で割るもの) を配信の形にする */
export function toRatioNormalizationOption(option: AuthoredRatioNormalizationOption): RatioNormalizationOption {
  return {
    type: `per_${option.denominator.kind}`,
    label: denominatorLabel(option.denominator),
    unit: option.unit,
    scaleFactor: option.denominator.per,
    decimalPlaces: option.decimalPlaces,
    ...(option.visualization ? { visualization: option.visualization } : {}),
  };
}

/** 選択肢の識別子。URL の ?norm= とボタンの値に使う (series は指標のキー) */
export function normalizationOptionId(option: Pick<NormalizationDisplayOption, 'type'> & { metric?: string }): string {
  return option.type === 'series' ? (option.metric as string) : option.type;
}

/** 人口・面積で割る選択肢だけ (分母を引く処理・事前生成の対象) */
export function isRatioNormalizationOption<T extends { type: string }>(option: T): option is Extract<T, { type: 'per_population' | 'per_area' }> {
  return option.type === 'per_population' || option.type === 'per_area';
}
