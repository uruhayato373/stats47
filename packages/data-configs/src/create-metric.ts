import type {
  CalculationOptions,
  DisplayConfig,
  EntityKind,
  MetricConfig,
  SourceConfig,
  VisualizationConfig,
  YearSpec,
} from "./types";

/**
 * `createMetric` の入力。`MetricConfig` のうち、ほぼ全 metric で同一になる
 * 定型フィールド（entities / display / calculation / isActive / isFeatured /
 * featuredOrder）は省略可能で、ファクトリが既定値を補う。
 */
export interface CreateMetricInput {
  key: string;
  title: string;
  unit: string;
  category: string;
  source: SourceConfig;
  years: YearSpec;
  subtitle?: string;
  description?: string;
  yearFormat?: MetricConfig["yearFormat"];
  /** 既定 `["prefecture"]` */
  entities?: EntityKind[];
  visualization?: VisualizationConfig;
  /** 既定 `{ conversionFactor: 1, decimalPlaces: 0 }` とマージ */
  display?: DisplayConfig;
  /** 既定 `{ isCalculated: false }` とマージ */
  calculation?: CalculationOptions;
  additionalCategories?: string[];
  groupKey?: string;
  seoTitle?: string;
  seoDescription?: string;
  /** 既定 `true` */
  isActive?: boolean;
  /** 既定 `false` */
  isFeatured?: boolean;
  /** 既定 `0` */
  featuredOrder?: number;
}

const DEFAULT_ENTITIES: readonly EntityKind[] = ["prefecture"];

/**
 * 頻出デフォルト付きで `MetricConfig` を生成するファクトリ。
 *
 * 2209 個の metric file に共通する定型（`entities: ["prefecture"]` /
 * `display.conversionFactor: 1` / `calculation.isCalculated: false` /
 * `isActive: true` / `isFeatured: false` / `featuredOrder: 0`）を既定値として吸収し、
 * 各ファイルの記述量を削減する。
 *
 * 返り値は通常の `MetricConfig` なので、リテラルを export している既存ファイルと
 * **混在可能**（codemod 不要・任意のタイミングで段階移行できる）。
 *
 * @example
 * export const fooMetric = createMetric({
 *   key: "foo",
 *   title: "Foo",
 *   unit: "人",
 *   category: "population",
 *   source: { kind: "estat", statsDataId: "0003448237" },
 *   years: "all",
 *   yearFormat: "calendar",
 * });
 * // → entities ["prefecture"], display {conversionFactor:1,decimalPlaces:0},
 * //   calculation {isCalculated:false}, isActive true, isFeatured false, featuredOrder 0
 */
export function createMetric(input: CreateMetricInput): MetricConfig {
  const {
    entities,
    display,
    calculation,
    isActive,
    isFeatured,
    featuredOrder,
    ...rest
  } = input;

  return {
    ...rest,
    entities: entities ?? [...DEFAULT_ENTITIES],
    display: { conversionFactor: 1, decimalPlaces: 0, ...display },
    calculation: { isCalculated: false, ...calculation },
    isActive: isActive ?? true,
    isFeatured: isFeatured ?? false,
    featuredOrder: featuredOrder ?? 0,
  };
}
