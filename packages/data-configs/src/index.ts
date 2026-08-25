export * from "./types";
export { createMetric, type CreateMetricInput } from "./create-metric";
export { METRICS_REGISTRY, getMetricConfig, listAllMetrics } from "./registry";
export {
  EXPECTED_EMPTY,
  classifyEmptyOutcome,
  findExpectedEmpty,
  type ClassifyEmptyInput,
  type ClassifyEmptyResult,
  type EmptyOutcome,
  type ExpectedEmptyEntry,
} from "./expected-empty";
export {
  COUNT_UNITS,
  PREFECTURE_COUNT,
  VALUE_CHECKS,
  WARN_ONLY_CHECKS,
  classifyShape,
  findExpectedShapeAnomaly,
  hasShapeError,
  summarizeShape,
  type ClassifyShapeInput,
  type ExpectedShapeAnomalyEntry,
  type ShapeCheck,
  type ShapeRow,
  type ShapeSummary,
  type ShapeViolation,
  type YearValueStats,
} from "./shape-gate";
export {
  EXPECTED_SHAPE_ANOMALY,
  MAX_KNOWN_BROKEN,
  MAX_KNOWN_BROKEN_VALUE,
} from "./expected-shape-anomaly";
export {
  VERIFIED_VALUE_PROFILES,
  type VerifiedValueProfile,
} from "./verified-value-profiles";
export {
  THIN_SUSPICION_THRESHOLD,
  ZERO_SUSPICION_THRESHOLD,
  classifyValueSuspicion,
  type ValueSuspicion,
  type ValueVerificationResult,
} from "./value-verification";
export {
  PREFECTURES,
  isAggregateAreaName,
  lookupPrefectureCode,
  normalizeAreaName,
  resolveAreaAxis,
  surveyYearFromDate,
  type AreaAxisMapping,
  type AreaAxisMember,
} from "./area-axis";
export {
  MISSING,
  combineLinear,
  ratioPercent,
  round1,
  sumMembers,
  toEstatValue,
} from "./estat-transform";
export {
  buildRecipe,
  canonicalRecipeJson,
  hash64,
  parseRecipe,
  type EstatAxis,
  type EstatQueryParams,
  type MetricRecipe,
  type RecipeOps,
  type RefetchKeys,
} from "./recipe";
export {
  getMetricMetaMap,
  getMetricMeta,
  listMetricKeysByEntity,
  type MetricMeta,
} from "./metric-meta";
export {
  CATEGORIES,
  getCategoryName,
  getCategoryDescription,
  listCategories,
  type CategoryMeta,
} from "./categories";
export {
  resolveMetricProvenance,
  resolveSourceProvenance,
  resolveProvenanceByParams,
  resolveAttribution,
  isSsdsStatsDataId,
  type ProvenanceSurvey,
  type SourceAttribution,
} from "./provenance/resolve-metric-provenance";
export { resolveSurveyId as resolveSurveyIdBySourceName } from "./ssds/source-name-to-survey";
export {
  HOME_PORTAL_USE_CASES,
  validateHomePortal,
  type HomePortalUseCase,
} from "./home-portal";
export {
  THEME_CATALOGS,
  listThemeCatalogs,
  CATALOG_COMPONENT_TYPES,
  type CatalogComponentType,
  type ThemeCatalog,
  type CatalogMetric,
  type CatalogChart,
  type MetricSelection,
} from "./theme-catalog";
export {
  AREA_DATABOOK_TEMPLATE,
  AREA_DATABOOK_CHART_TYPES,
  DATABOOK_SECTION_KINDS,
  AREA_EDITORIALS,
  listAreaEditorials,
  listTemplateCharts,
  collectTemplateMetricKeys,
  type AreaDatabookTemplate,
  type AreaDatabookChartType,
  type DatabookSection,
  type DatabookSectionKind,
  type DatabookBlock,
  type DatabookChart,
  type DatabookMetricRef,
  type DatabookGenderPair,
  type AreaEditorial,
  type PrefSpecialty,
  type PrefSymbols,
} from "./area-databook";
export {
  PREFECTURE_STATISTICS_CATALOG,
  getPrefectureStatisticsEntry,
  type PrefectureStatisticsCatalogEntry,
  type PrefectureStatisticsResource,
  type PrefectureStatisticsResourceType,
  type PrefectureStatisticsTopicKey,
} from "./prefecture-statistics-catalog";
export {
  OPEN_DATA_SOURCES,
  OPEN_DATASETS,
  getOpenDataSource,
  getOpenDataset,
  getDatasetsBySource,
  type OpenDataSource,
  type OpenDatasetDefinition,
  type OpenDataSourceKind,
  type AccessMethod,
  type DataFormat,
  type GeographicLevel,
  type VerificationStatus,
  type Stats47Use,
} from "./open-data-catalog";

// コロプレス配色の決定規則 + 極性 SSOT (正典: .claude/rules/blog-svg-chart-standards.md §3)
export {
  resolveColorScheme,
  type ColorSchemeDecision,
  type ColorSchemeInput,
  type ColorSchemeReason,
} from "./color-scheme-policy";
export {
  METRIC_POLARITY,
  EXCLUDED_FROM_SEED,
  MIN_POLARITY_COVERAGE,
  findMetricPolarity,
  type MetricPolarity,
  type PolarityEntry,
} from "./metric-polarity";
export { fillMissingTimeFromSurveyDate } from "./estat-time";
