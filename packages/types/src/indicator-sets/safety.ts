import type { IndicatorSet } from "../indicator-set";

export const SAFETY_SET: IndicatorSet = {
  key: "safety",
  title: "安全",
  description:
    "都道府県別の犯罪率・交通事故死・火災・自殺率を地図とランキングで比較。治安と安全の地域差を47都道府県のデータで確認できます。",
  category: "safety",
  usage: "theme",
  indicators: [
    // 治安
    { rankingKey: "penal-code-offenses-recognized-per-1000", shortLabel: "犯罪率", role: "primary" },
    { rankingKey: "serious-crime-per-100k", shortLabel: "凶悪犯", role: "primary" },
    { rankingKey: "criminal-recognition-count", shortLabel: "認知件数", role: "secondary" },
    { rankingKey: "violent-crime-per-100k", shortLabel: "粗暴犯", role: "secondary" },
    { rankingKey: "criminal-arrest-rate", shortLabel: "検挙率", role: "secondary" },
    { rankingKey: "intellectual-crime-per-100k", shortLabel: "知能犯", role: "context" },
    { rankingKey: "theft-offenses-recognized-per-1000", shortLabel: "窃盗率", role: "context" },
    { rankingKey: "theft-criminal-arrest-rate", shortLabel: "窃盗検挙率", role: "context" },
    { rankingKey: "juvenile-criminal-arrest-person-per-population", shortLabel: "少年犯罪率", role: "secondary" },
    { rankingKey: "drug-enforcement-arrest-count-per-population", shortLabel: "薬物検挙", role: "context" },
    // 交通
    { rankingKey: "traffic-accident-deaths-per-100k", shortLabel: "交通死者", role: "primary" },
    { rankingKey: "traffic-accident-count-per-population", shortLabel: "交通事故率", role: "secondary" },
    { rankingKey: "traffic-accident-count", shortLabel: "事故件数", role: "context" },
    { rankingKey: "traffic-accident-deaths-per-100-accidents", shortLabel: "致死率", role: "context" },
    { rankingKey: "traffic-accident-injuries-per-100k", shortLabel: "負傷者率", role: "context" },
    { rankingKey: "traffic-accident-casualties-elderly-65plus", shortLabel: "高齢者事故", role: "secondary" },
    // 火災・救急
    { rankingKey: "building-fire-count-per-100-thousand-people", shortLabel: "火災", role: "secondary" },
    { rankingKey: "fire-deaths-per-100k", shortLabel: "火災死者", role: "secondary" },
    { rankingKey: "fire-damage-casualties-per-population", shortLabel: "火災被害", role: "context" },
    { rankingKey: "annual-emergency-dispatches-per-1000", shortLabel: "救急出動", role: "secondary" },
    // 災害
    { rankingKey: "disaster-damage-amount-per-person", shortLabel: "災害被害額", role: "context" },
    // 自殺・事故死
    { rankingKey: "suicide-rate-per-100k", shortLabel: "自殺率", role: "secondary" },
    { rankingKey: "suicides-per-100k", shortLabel: "自殺者数", role: "context" },
    { rankingKey: "accidental-deaths-per-100k", shortLabel: "事故死", role: "secondary" },
    // インフラ
    { rankingKey: "police-officer-count-per-population", shortLabel: "警察官数", role: "context" },
  ],
  panelTabs: [
    {
      label: "治安",
      rankingKeys: [
        "penal-code-offenses-recognized-per-1000",
        "serious-crime-per-100k",
        "violent-crime-per-100k",
        "juvenile-criminal-arrest-person-per-population",
        "theft-offenses-recognized-per-1000",
        "drug-enforcement-arrest-count-per-population",
        "police-officer-count-per-population",
      ],
      charts: [
        {
          type: "mixed",
          label: "刑法犯認知件数と検挙率の推移",
          columns: [
            { rankingKey: "criminal-recognition-count", name: "認知件数", color: "#f59e0b" },
          ],
          lines: [
            { rankingKey: "criminal-arrest-rate", name: "検挙率", color: "#22c55e" },
          ],
          leftUnit: "件",
          rightUnit: "%",
          source: "犯罪統計",
        },
      ],
    },
    {
      label: "交通",
      rankingKeys: [
        "traffic-accident-deaths-per-100k",
        "traffic-accident-count-per-population",
        "traffic-accident-count",
        "traffic-accident-deaths-per-100-accidents",
        "traffic-accident-injuries-per-100k",
        "traffic-accident-casualties-elderly-65plus",
      ],
      charts: [
        {
          type: "dual-line",
          label: "交通事故件数と死者数の推移",
          series: [
            { rankingKey: "traffic-accident-count", name: "事故件数", color: "#f59e0b" },
            { rankingKey: "traffic-accident-deaths-per-100k", name: "死者数(10万人当たり)", color: "#ef4444" },
          ],
          source: "交通事故統計",
        },
      ],
    },
    {
      label: "火災・救急",
      rankingKeys: [
        "building-fire-count-per-100-thousand-people",
        "fire-deaths-per-100k",
        "fire-damage-casualties-per-population",
        "annual-emergency-dispatches-per-1000",
      ],
      charts: [
        {
          type: "dual-line",
          label: "火災出火件数と救急出動件数の推移",
          series: [
            { rankingKey: "building-fire-count-per-100-thousand-people", name: "出火件数(10万人当たり)", color: "#f59e0b" },
            { rankingKey: "annual-emergency-dispatches-per-1000", name: "救急出動(千人当たり)", color: "#22c55e" },
          ],
          source: "消防統計",
        },
      ],
    },
    {
      label: "災害",
      rankingKeys: [
        "disaster-damage-amount-per-person",
      ],
    },
    {
      label: "自殺・事故",
      rankingKeys: [
        "suicide-rate-per-100k",
        "suicides-per-100k",
        "accidental-deaths-per-100k",
      ],
      charts: [
        {
          type: "dual-line",
          label: "自殺率と不慮の事故死亡率の推移",
          series: [
            { rankingKey: "suicide-rate-per-100k", name: "自殺率", color: "#8b5cf6" },
            { rankingKey: "accidental-deaths-per-100k", name: "不慮の事故死亡率", color: "#6b7280" },
          ],
          source: "人口動態統計",
        },
      ],
    },
  ],
  keywords: [
    "犯罪",
    "刑法犯",
    "凶悪犯",
    "治安",
    "交通事故",
    "死者数",
    "火災",
    "救急",
    "災害",
    "自殺",
    "都道府県",
    "ランキング",
  ],
};
