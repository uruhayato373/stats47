import { STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY } from '@stats47/area';

import { METRICS_REGISTRY } from '../registry';

export type MunicipalityMetricAvailability =
  | {
      status: 'published';
      entityPolicyKey: string;
      comparisonModes: readonly string[];
      valuePolicy?: {
        minExclusive?: number;
        minInclusive?: number;
        maxInclusive?: number;
      };
    }
  | { status: 'candidate'; reason: string }
  | { status: 'unsupported'; reason: string }
  | { status: 'unknown'; reason: string };

export interface MunicipalityThemeCatalog {
  slug: string;
  title: string;
  metricKeys: readonly string[];
  defaultMetricKey: string;
  entityPolicyKey: string;
  status: 'active' | 'draft';
}

/**
 * 人手で品質判断した差分だけを書く。MetricConfig.entities は取得可能性であり、
 * ここに無い city metric を自動で published に昇格しない。
 */
export const MUNICIPALITY_METRIC_AVAILABILITY: Readonly<
  Record<string, MunicipalityMetricAvailability>
> = {
  'elderly-population-ratio': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
    // 双葉町は2020年国勢調査人口が0で比率を定義できない。取得値0を欠測相当として除外する。
    valuePolicy: { minExclusive: 0, maxInclusive: 100 },
  },
  // ---- 第1拡充バッチ (2026-09-01 公開・人手品質判断の根拠は各コメント) ----
  // 共通根拠: expansion-survey (2026-09-01) で machine-clean (1,913 entity・重複0・unknownCode 0)。
  // 公開R2 cities.json の最新年 top/bottom 5 を常識照合済み (特別区部9,733,276人・豊島区23,182人/km²等)。
  // 双葉町 (07546・2020国勢調査人口0) は count系=実値0を保持 / 比率系=元データが null で既に除外済み。
  'total-population': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
    // 双葉町の0人は2020国勢調査の実値 (避難指示)。除外しない。
  },
  'population-density-per-km2-inhabitable-area': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
    // 人口0の団体は密度0が定義どおり成立するため除外しない。
    // 類似キー population-density-habitable は同一値 (min/max 完全一致) の重複のため公開しない。
    valuePolicy: { minInclusive: 0 },
  },
  'young-population-ratio': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
    // 0%は「子どもが1人もいない団体」として実在しうるため包含下限。0/0 (双葉町) は元データ null。
    valuePolicy: { minInclusive: 0, maxInclusive: 100 },
  },
  'production-age-population-ratio': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
    valuePolicy: { minInclusive: 0, maxInclusive: 100 },
  },
  households: {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'moving-in-excess-rate': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
    // e-Stat #A05307 (無印=外国人含む総数) を実メタで確認済み。負値は転出超過の実値
    // (2020最小 浪江町 -14.98%) のため下限は設けない。
  },
  // ---- 第1拡充バッチここまで ----
  // ---- 第2バッチ: 全量公開 (2026-09-01 オーナー指示「公開できるものは全て公開したい」) ----
  // 根拠: expansion-survey (値分布まで機械監査済み)。除外は下の unsupported/unknown 群に理由付きで記録。
  // 同名 title の系列 (事業所数×業種、日本人/総数系など) は generator が subtitle を焼き込み
  // ページ title で区別する (衝突が残ると generator が throw する fail-closed)。
  'abandoned-cultivated-land-area': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'agricultural-output': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'annual-sales-amount': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'annual-sales-amount-per-employee': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'annual-sales-amount-per-establishment': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'births': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'civil-engineering-expense-municipal': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'commute-by-bicycle': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'commute-by-bus': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'commute-by-car': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'commute-by-motorcycle': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'commute-by-train': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'commute-on-foot': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'commuter-ratio-from-other-municipalities': {
    // 1000%超は都心区・飛島村級で正当 (昼夜間比/流入比の実態)。上限は設けない
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'commuter-ratio-to-other-municipalities': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'commuters-total': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'crime-rate-per-1k': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'criminal-recognition-count': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'cultivated-area': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'current-balance-ratio-city': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'day-time-population': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'day-time-population-ratio': {
    // 1000%超は都心区・飛島村級で正当 (昼夜間比/流入比の実態)。上限は設けない
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'death-count': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'densely-inhabited-district-population': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'densely-inhabited-district-population-density': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'densely-populated-area': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'densely-populated-area-change-rate': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'dental-clinic-count': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'dentists-in-medical-facilities': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'department-store-count-per-100k': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'department-supermarket-count': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'department-supermarket-count-per-100k': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'divorces': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'earthquake-retrofit-housing': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'education-expense-municipal': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'elderly-couple-only-household-ratio': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'elderly-workers-ratio': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'elementary-school-children-count': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'elementary-school-count': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'elementary-school-count-per-100km2-habitable': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'elementary-school-teachers': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'employed-people-ratio': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'employed-people-ratio-primary': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'employed-people-ratio-secondary': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'employed-people-ratio-tertiary': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'fiscal-strength-index': {
    // unknown を 2026-09-01 に解消: cities.json の 0 は 194 行政区 + 特別区部の 195 件のみで、
    // すべて entity policy が除外する対象。市町村本体に 0 は無い (実測)。minExclusive はそのガード。
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
    valuePolicy: {minExclusive: 0},
  },
  'foreign-population-per-100k': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'foreign-resident-count': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'foreign-resident-population': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'forest-area': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'future-burden-ratio-city': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'garbage-collection-population': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'garbage-final-disposal': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'garbage-total-output': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'general-clinic-count': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'general-clinic-count-per-100k': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'general-clinic-count-per-100km2': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'general-hospital-count': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'general-hospital-count-per-100km2': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'general-hospital-per-100k': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'habitable-area': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'habitable-area-ratio': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'high-school-count': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'high-school-count-per-100km2-habitable': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'housing-floor-area': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'integrated-kindergarten-enrollment': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'intellectual-disability-support-facility-capacity': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'intellectual-disability-support-facility-residents': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'japanese-movers-in': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'japanese-movers-out': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'japanese-population': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'junior-high-school-count': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'junior-high-school-count-per-100km2-habitable': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'junior-high-school-students-count': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'junior-high-school-teachers': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'kei-car-count': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'large-retail-store-count-per-100k': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'library-count-per-million': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'manufacturing-employees': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'manufacturing-establishments': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'manufacturing-net-value-added-private': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'manufacturing-sales-private': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'manufacturing-shipment': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'manufacturing-shipment-amount': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'marriages': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'moped-count': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'motorcycle-count': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'movers-in': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'movers-out': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'moving-in-excess-rate-japanese': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'moving-in-rate': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'moving-in-rate-japanese': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'moving-out-rate': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'moving-out-rate-japanese': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'municipal-bonds-outstanding': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'municipal-general-administration-staff': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'municipal-resident-tax': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'national-health-insurance-benefits': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'new-condo-starts': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'new-housing-floor-area': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'new-housing-starts': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'new-owner-occupied-starts': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'new-rental-starts': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'nuclear-family-household-count': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'nuclear-family-households-ratio': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'number-of-commercial-employees-wholesale-retail': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'number-of-establishments-agriculture-forestry': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'number-of-establishments-agriculture-forestry-fisheries': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'number-of-establishments-construction': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'number-of-establishments-economic-census-basic-survey': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'number-of-establishments-education-learning-support': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'number-of-establishments-establishment-corporate-statistics': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'number-of-establishments-finance-insurance': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'number-of-establishments-fisheries': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'number-of-establishments-information-communication': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'number-of-establishments-manufacturing': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'number-of-establishments-medical-welfare': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'number-of-establishments-mining-quarrying-gravel-extraction': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'number-of-establishments-real-estate-leasing': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'number-of-establishments-transport-post': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'number-of-establishments-wholesale-retail': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'nursing-welfare-facility-count-per-100k-65plus': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'outflow-commuter-student-population': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'owner-occupied-housing-ratio': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'per-taxpayer-income': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'per-taxpayer-taxable-income': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'pharmacist-count': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'physical-disability-rehabilitation-facility-capacity': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'physical-disability-rehabilitation-facility-residents': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'physicians-in-medical-facilities': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'psychiatric-hospital-count': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'public-assistance-expense-municipal': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'public-hall-count-per-million': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'ratio-never-married-15-plus': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'real-balance-ratio-city': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'real-public-debt-service-ratio-city': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'restaurant-count-per-1000': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'retail-store-count': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'retail-store-count-per-1000': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'retail-stores-per': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'sales-amount-private': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'sanitation-expense-municipal': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'secondary-employed-people-ratio-tertiary': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'single-father-households': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'single-mother-households': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'single-person-household-old-population-ratio': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'single-person-households': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'solar-power-housing': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'standard-fiscal-demand-municipality': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'standard-fiscal-revenue-municipality': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'taxpayer-count-equal': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'taxpayer-count-income': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'total-area-excluding-northern-territories-and-takeshima': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'total-area-prefecture-ratio': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'total-assessed-land-area': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'traffic-accident-count': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'traffic-accident-per-100k': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'unemployment-rate': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'urban-planning-area': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'vacant-housing-ratio': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'welfare-expense-municipal': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'wholesale-annual-sales-amount': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'woodland-area': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  'workers-agriculture-forestry-fishery': {
    status: 'published',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    comparisonModes: ['ranking', 'prefecture-filter', 'municipality-search'],
  },
  // ---- 第2バッチここまで ----
  // ---- 公開しないと判断したもの (理由の記録。値重複 = 同一データの二重公開防止) ----
  'penal-code-offenses-recognized-per-1000': {
    status: 'unsupported',
    reason: 'crime-rate-per-1k と観測値が完全一致 (同一系列の別名)。限定子付き title の側を公開',
  },
  'foreign-resident-count-per-100k': {
    status: 'unsupported',
    reason: 'foreign-population-per-100k と観測値が完全一致。限定子付き title の側を公開',
  },
  'general-hospital-count-per-100k': {
    status: 'unsupported',
    reason: 'general-hospital-per-100k と観測値が完全一致。限定子付き title の側を公開',
  },
  'population-density-habitable': {
    status: 'unsupported',
    reason: 'population-density-per-km2-inhabitable-area と観測値が完全一致の重複',
  },
  'retail-store-count-alt': {
    status: 'unsupported',
    reason: 'retail-store-count と観測値が完全一致の重複 (alt)',
  },
  'traffic-accident-count-per-population': {
    status: 'unsupported',
    reason: 'traffic-accident-per-100k と観測値が完全一致。限定子付き title の側を公開',
  },
  'ratio-65-plus': {
    status: 'unsupported',
    reason: 'elderly-population-ratio (公開済み) と同一指標。二重公開しない',
  },
  'industrial-land-price': {
    status: 'unknown',
    reason: '欠損率78%・最新2005年。公開価値の監査が未了',
  },
  'major-lake-area': {
    status: 'unknown',
    reason: 'ゼロ率94% (主要湖沼が無い自治体の0埋め)。順位として成立するかの監査が未了',
  },
  'culture-recreation-cost-all-households': {
    status: 'unknown',
    reason: 'WP0でcities.json artifact不在。未取得と非対応を区別できないため',
  },
  'education-cost-all-households': {
    status: 'unknown',
    reason: 'WP0でcities.json artifact不在。未取得と非対応を区別できないため',
  },
  'healthcare-cost-all-households': {
    status: 'unknown',
    reason: 'WP0でcities.json artifact不在。未取得と非対応を区別できないため',
  },
  'housing-cost-all-households': {
    status: 'unknown',
    reason: 'WP0でcities.json artifact不在。未取得と非対応を区別できないため',
  },
};

export const MUNICIPALITY_THEME_CATALOGS: Readonly<
  Record<string, MunicipalityThemeCatalog>
> = {
  'aging-society': {
    slug: 'aging-society',
    title: '市区町村の高齢化',
    metricKeys: ['elderly-population-ratio'],
    defaultMetricKey: 'elderly-population-ratio',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    status: 'active',
  },
  population: {
    slug: 'population',
    title: '市区町村の人口',
    metricKeys: [
      'total-population',
      'japanese-population',
      'population-density-per-km2-inhabitable-area',
      'young-population-ratio',
      'production-age-population-ratio',
      'elderly-population-ratio',
      'day-time-population',
      'day-time-population-ratio',
      'ratio-never-married-15-plus',
      'households',
      'moving-in-excess-rate',
    ],
    defaultMetricKey: 'total-population',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    status: 'active',
  },
  'households': {
    slug: 'households',
    title: '市区町村の世帯構成',
    metricKeys: [
      'households',
      'single-person-households',
      'nuclear-family-household-count',
      'nuclear-family-households-ratio',
      'single-mother-households',
      'single-father-households',
      'elderly-couple-only-household-ratio',
      'single-person-household-old-population-ratio',
    ],
    defaultMetricKey: 'households',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    status: 'active',
  },
  'migration': {
    slug: 'migration',
    title: '市区町村の人口移動',
    metricKeys: [
      'moving-in-excess-rate',
      'moving-in-excess-rate-japanese',
      'movers-in',
      'movers-out',
      'japanese-movers-in',
      'japanese-movers-out',
      'moving-in-rate',
      'moving-in-rate-japanese',
      'moving-out-rate',
      'moving-out-rate-japanese',
      'outflow-commuter-student-population',
    ],
    defaultMetricKey: 'moving-in-excess-rate',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    status: 'active',
  },
  'vital-statistics': {
    slug: 'vital-statistics',
    title: '市区町村の出生・婚姻・死亡',
    metricKeys: [
      'births',
      'death-count',
      'marriages',
      'divorces',
    ],
    defaultMetricKey: 'births',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    status: 'active',
  },
  'foreign-residents': {
    slug: 'foreign-residents',
    title: '市区町村の外国人住民',
    metricKeys: [
      'foreign-resident-count',
      'foreign-resident-population',
      'foreign-population-per-100k',
    ],
    defaultMetricKey: 'foreign-resident-count',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    status: 'active',
  },
  'urban-structure': {
    slug: 'urban-structure',
    title: '市区町村の人口集中・都市構造',
    metricKeys: [
      'densely-inhabited-district-population',
      'densely-inhabited-district-population-density',
      'densely-populated-area',
      'densely-populated-area-change-rate',
      'urban-planning-area',
    ],
    defaultMetricKey: 'densely-inhabited-district-population',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    status: 'active',
  },
  'local-finance': {
    slug: 'local-finance',
    title: '市区町村の地方財政',
    metricKeys: [
      'fiscal-strength-index',
      'current-balance-ratio-city',
      'real-public-debt-service-ratio-city',
      'future-burden-ratio-city',
      'real-balance-ratio-city',
      'municipal-bonds-outstanding',
      'municipal-resident-tax',
      'standard-fiscal-demand-municipality',
      'standard-fiscal-revenue-municipality',
      'per-taxpayer-taxable-income',
      'per-taxpayer-income',
      'taxpayer-count-equal',
      'taxpayer-count-income',
      'municipal-general-administration-staff',
      'civil-engineering-expense-municipal',
      'education-expense-municipal',
      'public-assistance-expense-municipal',
      'sanitation-expense-municipal',
      'welfare-expense-municipal',
    ],
    defaultMetricKey: 'fiscal-strength-index',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    status: 'active',
  },
  'commerce': {
    slug: 'commerce',
    title: '市区町村の商業',
    metricKeys: [
      'annual-sales-amount',
      'annual-sales-amount-per-employee',
      'annual-sales-amount-per-establishment',
      'wholesale-annual-sales-amount',
      'sales-amount-private',
      'retail-store-count',
      'retail-store-count-per-1000',
      'retail-stores-per',
      'department-supermarket-count',
      'department-supermarket-count-per-100k',
      'department-store-count-per-100k',
      'large-retail-store-count-per-100k',
      'number-of-commercial-employees-wholesale-retail',
      'restaurant-count-per-1000',
    ],
    defaultMetricKey: 'annual-sales-amount',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    status: 'active',
  },
  'establishments': {
    slug: 'establishments',
    title: '市区町村の事業所',
    metricKeys: [
      'number-of-establishments-economic-census-basic-survey',
      'number-of-establishments-establishment-corporate-statistics',
      'number-of-establishments-agriculture-forestry',
      'number-of-establishments-agriculture-forestry-fisheries',
      'number-of-establishments-fisheries',
      'number-of-establishments-mining-quarrying-gravel-extraction',
      'number-of-establishments-construction',
      'number-of-establishments-manufacturing',
      'number-of-establishments-information-communication',
      'number-of-establishments-transport-post',
      'number-of-establishments-wholesale-retail',
      'number-of-establishments-finance-insurance',
      'number-of-establishments-real-estate-leasing',
      'number-of-establishments-education-learning-support',
      'number-of-establishments-medical-welfare',
    ],
    defaultMetricKey: 'number-of-establishments-economic-census-basic-survey',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    status: 'active',
  },
  'manufacturing': {
    slug: 'manufacturing',
    title: '市区町村の製造業',
    metricKeys: [
      'manufacturing-shipment-amount',
      'manufacturing-shipment',
      'manufacturing-establishments',
      'manufacturing-employees',
      'manufacturing-sales-private',
      'manufacturing-net-value-added-private',
    ],
    defaultMetricKey: 'manufacturing-shipment-amount',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    status: 'active',
  },
  'medical-welfare': {
    slug: 'medical-welfare',
    title: '市区町村の医療・福祉',
    metricKeys: [
      'general-hospital-count',
      'general-hospital-per-100k',
      'general-hospital-count-per-100km2',
      'general-clinic-count',
      'general-clinic-count-per-100k',
      'general-clinic-count-per-100km2',
      'dental-clinic-count',
      'psychiatric-hospital-count',
      'physicians-in-medical-facilities',
      'dentists-in-medical-facilities',
      'pharmacist-count',
      'nursing-welfare-facility-count-per-100k-65plus',
      'intellectual-disability-support-facility-capacity',
      'intellectual-disability-support-facility-residents',
      'physical-disability-rehabilitation-facility-capacity',
      'physical-disability-rehabilitation-facility-residents',
      'national-health-insurance-benefits',
    ],
    defaultMetricKey: 'general-hospital-count',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    status: 'active',
  },
  'education': {
    slug: 'education',
    title: '市区町村の教育・文化施設',
    metricKeys: [
      'elementary-school-count',
      'elementary-school-count-per-100km2-habitable',
      'elementary-school-children-count',
      'elementary-school-teachers',
      'junior-high-school-count',
      'junior-high-school-count-per-100km2-habitable',
      'junior-high-school-students-count',
      'junior-high-school-teachers',
      'high-school-count',
      'high-school-count-per-100km2-habitable',
      'integrated-kindergarten-enrollment',
      'library-count-per-million',
      'public-hall-count-per-million',
    ],
    defaultMetricKey: 'elementary-school-count',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    status: 'active',
  },
  'housing': {
    slug: 'housing',
    title: '市区町村の住宅・建設',
    metricKeys: [
      'vacant-housing-ratio',
      'owner-occupied-housing-ratio',
      'housing-floor-area',
      'new-housing-starts',
      'new-housing-floor-area',
      'new-owner-occupied-starts',
      'new-rental-starts',
      'new-condo-starts',
      'earthquake-retrofit-housing',
      'solar-power-housing',
    ],
    defaultMetricKey: 'vacant-housing-ratio',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    status: 'active',
  },
  'commuting': {
    slug: 'commuting',
    title: '市区町村の通勤・通学と乗り物',
    metricKeys: [
      'commuters-total',
      'commute-by-train',
      'commute-by-bus',
      'commute-by-car',
      'commute-by-motorcycle',
      'commute-by-bicycle',
      'commute-on-foot',
      'kei-car-count',
      'motorcycle-count',
      'moped-count',
    ],
    defaultMetricKey: 'commuters-total',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    status: 'active',
  },
  'labor': {
    slug: 'labor',
    title: '市区町村の労働・就業',
    metricKeys: [
      'employed-people-ratio',
      'employed-people-ratio-primary',
      'employed-people-ratio-secondary',
      'employed-people-ratio-tertiary',
      'secondary-employed-people-ratio-tertiary',
      'unemployment-rate',
      'elderly-workers-ratio',
      'commuter-ratio-to-other-municipalities',
      'commuter-ratio-from-other-municipalities',
    ],
    defaultMetricKey: 'employed-people-ratio',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    status: 'active',
  },
  'safety-environment': {
    slug: 'safety-environment',
    title: '市区町村の安全・環境',
    metricKeys: [
      'criminal-recognition-count',
      'crime-rate-per-1k',
      'traffic-accident-count',
      'traffic-accident-per-100k',
      'garbage-total-output',
      'garbage-final-disposal',
      'garbage-collection-population',
    ],
    defaultMetricKey: 'criminal-recognition-count',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    status: 'active',
  },
  'agriculture-forestry': {
    slug: 'agriculture-forestry',
    title: '市区町村の農林業',
    metricKeys: [
      'agricultural-output',
      'cultivated-area',
      'abandoned-cultivated-land-area',
      'woodland-area',
      'forest-area',
      'workers-agriculture-forestry-fishery',
    ],
    defaultMetricKey: 'agricultural-output',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    status: 'active',
  },
  'land-area': {
    slug: 'land-area',
    title: '市区町村の土地・面積',
    metricKeys: [
      'total-area-excluding-northern-territories-and-takeshima',
      'total-area-prefecture-ratio',
      'habitable-area',
      'habitable-area-ratio',
      'total-assessed-land-area',
    ],
    defaultMetricKey: 'habitable-area-ratio',
    entityPolicyKey: STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY,
    status: 'active',
  },
};

export function getMunicipalityMetricAvailability(
  metricKey: string
): MunicipalityMetricAvailability {
  const metric = METRICS_REGISTRY[metricKey];
  if (!metric)
    return { status: 'unsupported', reason: 'MetricConfigが存在しないため' };
  if (!metric.entities.includes('city')) {
    return {
      status: 'unsupported',
      reason: 'MetricConfigがcityを取得対象に持たないため',
    };
  }
  return (
    MUNICIPALITY_METRIC_AVAILABILITY[metricKey] ?? {
      status: 'unknown',
      reason: '市区町村でのentity・年度・値分布・出典の公開監査が未完了のため',
    }
  );
}

export function listMunicipalityMetricAvailability(): Array<{
  metricKey: string;
  availability: MunicipalityMetricAvailability;
}> {
  return Object.values(METRICS_REGISTRY)
    .filter((metric) => metric.isActive && metric.entities.includes('city'))
    .map((metric) => ({
      metricKey: metric.key,
      availability: getMunicipalityMetricAvailability(metric.key),
    }));
}

export function buildKnownMunicipalityRankingKeys(
  decisions: Readonly<
    Record<string, MunicipalityMetricAvailability>
  > = MUNICIPALITY_METRIC_AVAILABILITY
): ReadonlySet<string> {
  const keys = new Set<string>();
  for (const [metricKey, availability] of Object.entries(decisions)) {
    if (availability.status !== 'published') continue;
    const metric = METRICS_REGISTRY[metricKey];
    if (!metric?.isActive || !metric.entities.includes('city')) {
      throw new Error(
        `published municipality metric must be active and support city: ${metricKey}`
      );
    }
    keys.add(metricKey);
  }
  return keys;
}

export function buildKnownMunicipalityThemeSlugs(
  themes: Readonly<
    Record<string, MunicipalityThemeCatalog>
  > = MUNICIPALITY_THEME_CATALOGS,
  knownRankingKeys: ReadonlySet<string> = buildKnownMunicipalityRankingKeys()
): ReadonlySet<string> {
  const slugs = new Set<string>();
  for (const [key, theme] of Object.entries(themes)) {
    if (theme.status !== 'active') continue;
    if (theme.slug !== key) {
      throw new Error(
        `municipality theme key/slug mismatch: ${key}/${theme.slug}`
      );
    }
    if (
      theme.metricKeys.some((metricKey) => !knownRankingKeys.has(metricKey))
    ) {
      throw new Error(
        `active municipality theme has unpublished metric: ${key}`
      );
    }
    slugs.add(theme.slug);
  }
  return slugs;
}

export const KNOWN_MUNICIPALITY_RANKING_KEYS =
  buildKnownMunicipalityRankingKeys();
export const KNOWN_MUNICIPALITY_THEME_SLUGS =
  buildKnownMunicipalityThemeSlugs();

export function validateMunicipalityCatalogs(): string[] {
  const errors: string[] = [];
  for (const metricKey of Object.keys(MUNICIPALITY_METRIC_AVAILABILITY)) {
    const metric = METRICS_REGISTRY[metricKey];
    if (!metric)
      errors.push(`[availability-key] ${metricKey}: MetricConfig不在`);
    else if (!metric.isActive)
      errors.push(`[availability-inactive] ${metricKey}`);
    else if (!metric.entities.includes('city')) {
      errors.push(`[availability-entity] ${metricKey}: city非対応`);
    }
  }

  for (const [metricKey, availability] of Object.entries(
    MUNICIPALITY_METRIC_AVAILABILITY
  )) {
    if (availability.status !== 'published' || !availability.valuePolicy)
      continue;
    const { minExclusive, minInclusive, maxInclusive } =
      availability.valuePolicy;
    if (minExclusive !== undefined && minInclusive !== undefined) {
      errors.push(`[value-policy-min] ${metricKey}: 下限は一方だけ指定する`);
    }
    const lower = minExclusive ?? minInclusive;
    if (
      lower !== undefined &&
      maxInclusive !== undefined &&
      lower >= maxInclusive
    ) {
      errors.push(`[value-policy-range] ${metricKey}: 下限が上限以上`);
    }
  }

  for (const [key, theme] of Object.entries(MUNICIPALITY_THEME_CATALOGS)) {
    if (theme.slug !== key) errors.push(`[theme-slug] ${key}/${theme.slug}`);
    if (!theme.metricKeys.includes(theme.defaultMetricKey)) {
      errors.push(`[theme-default] ${key}: defaultMetricKeyがmetrics外`);
    }
    if (new Set(theme.metricKeys).size !== theme.metricKeys.length) {
      errors.push(`[theme-duplicate] ${key}: metric重複`);
    }
    if (theme.entityPolicyKey !== STANDARD_MUNICIPALITY_ENTITY_POLICY_KEY) {
      errors.push(`[theme-policy] ${key}: 未知のentity policy`);
    }
    for (const metricKey of theme.metricKeys) {
      const metric = METRICS_REGISTRY[metricKey];
      if (!metric?.isActive || !metric.entities.includes('city')) {
        errors.push(
          `[theme-metric] ${key}/${metricKey}: active city metricではない`
        );
      }
    }
  }
  return errors;
}
