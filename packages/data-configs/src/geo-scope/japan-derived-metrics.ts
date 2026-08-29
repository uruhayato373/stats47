import {
  JAPAN_DERIVED_ADDITIVE_RECIPE_KEY,
  type JapanAvailability,
} from "./types";

type DerivedAvailability = Extract<
  JapanAvailability,
  { status: "derived-additive" | "derived-ratio" }
>;
type UnsupportedAvailability = Extract<JapanAvailability, { status: "unsupported" }>;

interface JapanDerivedMetricDecisionBase {
  readonly metricKey: string;
  readonly themeKey: string;
  readonly observedAt: "2026-08-28";
  readonly evidence: readonly string[];
}

export interface AdoptedJapanDerivedMetricDecision
  extends JapanDerivedMetricDecisionBase {
  readonly verdict: "adopted";
  readonly availability: DerivedAvailability;
  /** `app/stats/<sourceMetricKey>/values.json` をrecipe入力にする。 */
  readonly sourceMetricKey: string;
}

export interface RejectedJapanDerivedMetricDecision
  extends JapanDerivedMetricDecisionBase {
  readonly verdict: "rejected";
  readonly availability: UnsupportedAvailability;
}

export type JapanDerivedMetricDecision =
  | AdoptedJapanDerivedMetricDecision
  | RejectedJapanDerivedMetricDecision;

/**
 * 2026-08-28 に棚卸しした unknown-non-estat 9候補に対する恒久判断。
 *
 * 採用は、同一年・同単位の47都道府県行が全国を重複なく覆い、加算が指標の意味を
 * 保つものだけ。率・指数・1世帯当たり値は県値を合成せず、分子/分母の全国系列が
 * 欠ける計算型も unsupported に固定する。
 */
export const JAPAN_DERIVED_METRIC_DECISIONS: readonly JapanDerivedMetricDecision[] = [
  {
    metricKey: "fishing-port-count",
    themeKey: "fishery-marine",
    verdict: "rejected",
    availability: {
      status: "unsupported",
      reason:
        "同一C09/06の現行KSJ系列と全国合計が不一致で、旧系列を全国値の入力に固定できない",
    },
    observedAt: "2026-08-28",
    evidence: [
      "configはC09/06、配信47行合計2896港",
      "同じconfigHashのfishing-port-count-ksjは2931港",
      "現行KSJ生成器の採用keyはfishing-port-count-ksj",
    ],
  },
  {
    metricKey: "fishing-port-count-ksj",
    themeKey: "fishery-marine",
    verdict: "adopted",
    availability: {
      status: "derived-additive",
      recipeKey: JAPAN_DERIVED_ADDITIVE_RECIPE_KEY,
    },
    sourceMetricKey: "fishing-port-count-ksj",
    observedAt: "2026-08-28",
    evidence: [
      "KSJ C09/06はcoverage=national",
      "配信2006年は47県・有限47行・合計2931港",
      "KSJ生成器は県帰属未解決が1件でもあれば書かない",
    ],
  },
  {
    metricKey: "laspeyres-index-prefecture",
    themeKey: "local-finance",
    verdict: "rejected",
    availability: {
      status: "unsupported",
      reason: "都道府県ラスパイレス指数は加算不能で、全国値を再計算する給与ウェイトがない",
    },
    observedAt: "2026-08-28",
    evidence: [
      "config単位は指数",
      "配信値は47都道府県別指数のみ",
      "source configに全国分子・全国分母・ウェイト宣言がない",
    ],
  },
  {
    metricKey: "railway-passengers",
    themeKey: "railway",
    verdict: "adopted",
    availability: {
      status: "derived-additive",
      recipeKey: JAPAN_DERIVED_ADDITIVE_RECIPE_KEY,
    },
    sourceMetricKey: "railway-passengers",
    observedAt: "2026-08-28",
    evidence: [
      "KSJ S12はcoverage=national",
      "configは登録駅の1日乗降客数を県内合計する実数",
      "2019-2023各年が47県・有限47行",
    ],
  },
  {
    metricKey: "railway-station-count",
    themeKey: "railway",
    verdict: "adopted",
    availability: {
      status: "derived-additive",
      recipeKey: JAPAN_DERIVED_ADDITIVE_RECIPE_KEY,
    },
    sourceMetricKey: "railway-station-count",
    observedAt: "2026-08-28",
    evidence: [
      "KSJ N02/24はcoverage=national",
      "配信2024年は47県・有限47行・合計10235駅",
      "KSJ生成器は県帰属未解決が1件でもあれば書かない",
    ],
  },
  {
    metricKey: "real-disposable-income",
    themeKey: "real-income",
    verdict: "rejected",
    availability: {
      status: "unsupported",
      reason: "全国の物価地域差指数系列がなく、同一年の分母をartifactとして検証できない",
    },
    observedAt: "2026-08-28",
    evidence: [
      "config式は可処分所得÷物価地域差指数×100",
      "全国可処分所得artifactは存在",
      "consumer-price-difference-index-overallの全国artifactは404",
    ],
  },
  {
    metricKey: "disposable-income-after-rent",
    themeKey: "real-income",
    verdict: "rejected",
    availability: {
      status: "unsupported",
      reason: "家賃側が県庁所在市の世帯値で、全国可処分所得と同じ母集団の分母系列がない",
    },
    observedAt: "2026-08-28",
    evidence: [
      "config式は月額可処分所得−年間民営家賃÷12",
      "家賃系列はkakei-capital-city remap",
      "private-rent-consumption-expenditureの全国artifactは404",
    ],
  },
  {
    metricKey: "private-rent-consumption-expenditure",
    themeKey: "real-income",
    verdict: "rejected",
    availability: {
      status: "unsupported",
      reason: "県庁所在市の二人以上世帯1世帯当たり額であり、47値の合計は全国値にならない",
    },
    observedAt: "2026-08-28",
    evidence: [
      "subtitleは県庁所在市の二人以上世帯",
      "recipeはareaRemap=kakei-capital-city",
      "配信は47県相当行だが世帯数ウェイトを持たない",
    ],
  },
  {
    metricKey: "roadside-station-count",
    themeKey: "roads",
    verdict: "adopted",
    availability: {
      status: "derived-additive",
      recipeKey: JAPAN_DERIVED_ADDITIVE_RECIPE_KEY,
    },
    sourceMetricKey: "roadside-station-count",
    observedAt: "2026-08-28",
    evidence: [
      "KSJ P35/18はcoverage=national",
      "配信2018年は47県・有限47行・合計1145か所",
      "KSJ生成器は県帰属未解決が1件でもあれば書かない",
    ],
  },
];

export function getJapanDerivedMetricDecision(
  metricKey: string,
): JapanDerivedMetricDecision | undefined {
  return JAPAN_DERIVED_METRIC_DECISIONS.find((decision) => decision.metricKey === metricKey);
}
