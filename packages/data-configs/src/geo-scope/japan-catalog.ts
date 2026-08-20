/**
 * `/japan` の git TS catalog (GEO-SCOPE-SEPARATION-01 WP4/WP6)。
 *
 * ★採用条件: `official-candidate` (00000 行が live-audit で存在確認済み) の中から、
 *   `generateOneMetric()` (実際の生成コアと同一ロジック) で値レベル照合し、
 *   `buildJapanSeriesRows` が実際に ≥1 件の有効な年を返した metric だけをここに追加する
 *   (doc 43 §4「official = e-Statの00000行を使う」+ WP4/WP6ゲート「official確認できた
 *   metricだけを採用」)。unsupported/unknownは載せない。
 * ★既知の discontinuity (`health-checkup-rate-lifestyle-diseases` = 2017年以降 全国値 0%、
 *   `.claude/todo/backlog.md` `[HEALTH-CHECKUP-RATE-RETIRE-01]`) は値レベル照合を通っても
 *   意図的に除外する (doc 43 §11 停止条件: 「極端な不連続」)。
 *
 * ★`/themes/*` の本文・47県ranking・チャート定義は複製しない。日本ページは全国時系列と
 *   出典だけを主役にする (doc 43 §7 WP4 step 3)。ThemeCatalog (theme-catalog/) とは
 *   意図的に別の、より薄い型を持つ。description/keywords も `/themes/*` と重複させない
 *   (WP5 で確認した意図: 「都道府県別」「ランキング」「比較」ではなく「日本全国」「時系列」を軸にする)。
 *
 * WP6 で 1 テーマ (education-culture) から 17 テーマ・81 metric へ拡張した (2026-08-20)。
 * 拡張の根拠: `packages/data-configs/scripts/classify-japan-candidates.ts` (全 THEME_CATALOGS
 * の metrics を live-audit と突合し official 候補を機械抽出) →
 * `packages/stats-r2/src/scripts/verify-japan-candidates.ts` (候補ごとに実 e-Stat fetch で
 * 値レベル検証)。詳細は `.claude/todo/backlog.md` の GEO-SCOPE-SEPARATION-01 WP6 完了note。
 */

export interface JapanCatalogMetric {
  metricKey: string;
  /** カードのタイル見出し (短いラベル) */
  shortLabel: string;
}

export interface JapanCatalogTheme {
  themeSlug: string;
  title: string;
  description: string;
  keywords: string[];
  metrics: JapanCatalogMetric[];
}

export const JAPAN_CATALOGS: Record<string, JapanCatalogTheme> = {
  "education-culture": {
    themeSlug: "education-culture",
    title: "教育・文化",
    description:
      "学校数・図書館・公民館・大学進学率など、教育・文化に関する日本全国の統計を時系列で確認できます。",
    keywords: ["日本", "全国", "教育", "文化", "学校数", "図書館", "公民館"],
    metrics: [
      { metricKey: "library-count-per-million", shortLabel: "図書館数" },
      {
        metricKey: "elementary-school-count-per-100km2-habitable",
        shortLabel: "小学校数",
      },
      {
        metricKey: "junior-high-school-count-per-100km2-habitable",
        shortLabel: "中学校数",
      },
      {
        metricKey: "high-school-count-per-100km2-habitable",
        shortLabel: "高等学校数",
      },
      { metricKey: "public-hall-count-per-million", shortLabel: "公民館数" },
      {
        metricKey: "final-education-university-graduate-school-ratio",
        shortLabel: "大学・大学院卒の割合",
      },
    ],
  },
  "aging-society": {
    themeSlug: "aging-society",
    title: "少子高齢化",
    description:
      "高齢化率・65歳以上のいる世帯割合など、少子高齢化に関する日本全国の統計を時系列で確認できます。",
    keywords: ["日本", "全国", "少子高齢化", "高齢化率", "高齢世帯"],
    metrics: [
      { metricKey: "ratio-65-plus", shortLabel: "65歳以上人口割合" },
      {
        metricKey: "household-ratio-with-65plus",
        shortLabel: "65歳以上の世帯員のいる世帯割合",
      },
    ],
  },
  "fishery-marine": {
    themeSlug: "fishery-marine",
    title: "漁業（水産業）",
    description:
      "漁獲量・養殖収獲量・漁業就業者数・漁業産出額など、漁業（水産業）に関する日本全国の統計を時系列で確認できます。",
    keywords: ["日本", "全国", "漁業", "水産業", "漁獲量", "養殖", "漁業就業者"],
    metrics: [
      { metricKey: "fish-catch", shortLabel: "漁獲量（総計）" },
      { metricKey: "marine-fishery-catch", shortLabel: "海面漁業漁獲量" },
      { metricKey: "marine-aquaculture-harvest", shortLabel: "海面養殖業収獲量" },
      { metricKey: "inland-aquaculture-harvest", shortLabel: "内水面養殖業収獲量" },
      {
        metricKey: "marine-fishery-aquaculture-output-value",
        shortLabel: "海面漁業・養殖業産出額",
      },
      { metricKey: "marine-fishery-output-value", shortLabel: "海面漁業産出額" },
      { metricKey: "fishery-workers", shortLabel: "漁業就業者数" },
    ],
  },
  "foreign-residents": {
    themeSlug: "foreign-residents",
    title: "外国人",
    description:
      "在留外国人数・国籍別人口・外国人延べ宿泊者数など、外国人に関する日本全国の統計を時系列で確認できます。",
    keywords: ["日本", "全国", "外国人", "在留外国人", "インバウンド"],
    metrics: [
      {
        metricKey: "foreign-resident-count-per-100k",
        shortLabel: "外国人人口（人口10万人当たり）",
      },
      { metricKey: "foreign-resident-count", shortLabel: "外国人人口（総数）" },
      {
        metricKey: "foreign-resident-count-china-per-100k",
        shortLabel: "中国籍人口（人口10万人当たり）",
      },
      {
        metricKey: "foreign-resident-count-korea-per-100k",
        shortLabel: "韓国・朝鮮籍人口（人口10万人当たり）",
      },
      { metricKey: "total-overnight-guests-foreign", shortLabel: "外国人延べ宿泊者数" },
    ],
  },
  healthcare: {
    themeSlug: "healthcare",
    title: "医療・健康",
    description:
      "医師数・病院数・国民医療費・生活習慣病による死亡者数など、医療・健康に関する日本全国の統計を時系列で確認できます。",
    keywords: ["日本", "全国", "医療", "健康", "医師数", "病院数", "医療費"],
    metrics: [
      {
        metricKey: "physicians-in-medical-facilities-per-100k",
        shortLabel: "医師数（人口10万人当たり）",
      },
      {
        metricKey: "general-hospital-count-per-100k",
        shortLabel: "一般病院数（人口10万人当たり）",
      },
      { metricKey: "national-medical-expense-per-person", shortLabel: "1人当たり国民医療費" },
      {
        metricKey: "deaths-lifestyle-diseases-per-100k",
        shortLabel: "生活習慣病による死亡者数",
      },
      { metricKey: "deaths-diabetes-per-100k", shortLabel: "糖尿病による死亡者数" },
      // ★health-checkup-rate-lifestyle-diseases は意図的に除外 (2017年以降 全国値 0%。
      //   .claude/todo/backlog.md [HEALTH-CHECKUP-RATE-RETIRE-01])。
    ],
  },
  "labor-mobility": {
    themeSlug: "labor-mobility",
    title: "人材流動性・雇用環境",
    description:
      "離職率・転職率・有効求人倍率・完全失業率など、人材流動性・雇用環境に関する日本全国の統計を時系列で確認できます。",
    keywords: ["日本", "全国", "離職率", "転職率", "有効求人倍率", "雇用"],
    metrics: [
      { metricKey: "turnover-rate", shortLabel: "離職率" },
      { metricKey: "job-change-rate", shortLabel: "転職率" },
      { metricKey: "active-job-opening-ratio", shortLabel: "有効求人倍率" },
      { metricKey: "unemployment-rate", shortLabel: "完全失業率" },
      { metricKey: "employment-rate", shortLabel: "就職率" },
    ],
  },
  "labor-wages": {
    themeSlug: "labor-wages",
    title: "労働・賃金",
    description:
      "地域別最低賃金・有効求人倍率・完全失業率など、労働・賃金に関する日本全国の統計を時系列で確認できます。",
    keywords: ["日本", "全国", "最低賃金", "有効求人倍率", "失業率", "労働"],
    metrics: [
      { metricKey: "minimum-wage-by-region", shortLabel: "地域別最低賃金" },
      { metricKey: "active-job-opening-ratio", shortLabel: "有効求人倍率" },
      { metricKey: "unemployment-rate", shortLabel: "完全失業率" },
      { metricKey: "employment-rate", shortLabel: "就職率" },
      { metricKey: "turnover-rate", shortLabel: "離職率" },
    ],
  },
  "living-housing": {
    themeSlug: "living-housing",
    title: "暮らし・住まい",
    description:
      "空き家比率・持ち家比率・世帯構造・婚姻件数など、暮らし・住まいに関する日本全国の統計を時系列で確認できます。",
    keywords: ["日本", "全国", "空き家", "持ち家", "世帯構造", "婚姻", "離婚"],
    metrics: [
      { metricKey: "vacant-housing-ratio", shortLabel: "空き家比率" },
      { metricKey: "owner-occupied-housing-ratio", shortLabel: "持ち家比率" },
      { metricKey: "nuclear-family-households-ratio", shortLabel: "核家族世帯割合" },
      {
        metricKey: "elderly-couple-only-household-ratio",
        shortLabel: "高齢夫婦のみの世帯の割合",
      },
      {
        metricKey: "single-person-household-old-population-ratio",
        shortLabel: "65歳以上単独世帯の割合",
      },
      { metricKey: "ratio-never-married-15-plus", shortLabel: "未婚者割合" },
      { metricKey: "marriages", shortLabel: "婚姻件数" },
      { metricKey: "divorces", shortLabel: "離婚件数" },
    ],
  },
  "local-economy": {
    themeSlug: "local-economy",
    title: "地域経済",
    description:
      "課税対象所得・最低賃金・有効求人倍率・完全失業率など、地域経済に関する日本全国の統計を時系列で確認できます。",
    keywords: ["日本", "全国", "地域経済", "課税所得", "有効求人倍率", "失業率"],
    metrics: [
      { metricKey: "per-taxpayer-taxable-income", shortLabel: "課税対象所得（納税義務者1人当たり）" },
      { metricKey: "minimum-wage-by-region", shortLabel: "地域別最低賃金" },
      { metricKey: "active-job-opening-ratio", shortLabel: "有効求人倍率" },
      { metricKey: "unemployment-rate", shortLabel: "完全失業率" },
    ],
  },
  "local-finance": {
    themeSlug: "local-finance",
    title: "地方財政",
    description:
      "経常収支比率・実質公債費比率・将来負担比率・歳出構造など、地方財政に関する日本全国の統計を時系列で確認できます。",
    keywords: ["日本", "全国", "地方財政", "経常収支比率", "実質公債費比率", "将来負担比率"],
    metrics: [
      { metricKey: "current-balance-ratio", shortLabel: "経常収支比率" },
      { metricKey: "real-public-debt-service-ratio", shortLabel: "実質公債費比率" },
      { metricKey: "future-burden-ratio", shortLabel: "将来負担比率" },
      { metricKey: "local-tax-ratio-pref-finance", shortLabel: "地方税割合" },
      { metricKey: "local-allocation-tax-ratio-pref-finance", shortLabel: "地方交付税割合" },
      {
        metricKey: "national-treasury-disbursement-ratio-pref-finance",
        shortLabel: "国庫支出金割合",
      },
      {
        metricKey: "per-capita-total-expenditure-pref-municipal",
        shortLabel: "歳出決算総額（人口1人当たり）",
      },
      { metricKey: "personnel-expenditure-ratio-pref-finance", shortLabel: "人件費割合" },
      { metricKey: "welfare-expenditure-ratio-pref-finance", shortLabel: "民生費割合" },
      { metricKey: "education-expenditure-ratio-pref-finance", shortLabel: "教育費割合" },
      { metricKey: "public-works-expenditure-ratio-pref-finance", shortLabel: "土木費割合" },
      {
        metricKey: "per-capita-inhabitant-tax-pref-municipal",
        shortLabel: "住民税（人口1人当たり）",
      },
      { metricKey: "per-taxpayer-taxable-income", shortLabel: "課税対象所得（納税義務者1人当たり）" },
      { metricKey: "taxpayer-ratio-per-pref-resident", shortLabel: "納税義務者割合" },
    ],
  },
  manufacturing: {
    themeSlug: "manufacturing",
    title: "製造業",
    description:
      "製造品出荷額・付加価値額・事業所数・従業者数など、製造業に関する日本全国の統計を時系列で確認できます。",
    keywords: ["日本", "全国", "製造業", "製造品出荷額", "付加価値額", "事業所"],
    metrics: [
      { metricKey: "manufacturing-shipment-amount", shortLabel: "製造品出荷額（総額）" },
      { metricKey: "manufacturing-industry-added-value", shortLabel: "製造業付加価値額" },
      { metricKey: "manufacturing-establishments", shortLabel: "製造業事業所数" },
      { metricKey: "manufacturing-employees", shortLabel: "製造業従業者数" },
      {
        metricKey: "manufacturing-shipment-amount-per-employee",
        shortLabel: "製造品出荷額（従業員1人当たり）",
      },
      {
        metricKey: "manufacturing-shipment-amount-per-establishment",
        shortLabel: "製造品出荷額（事業所当たり）",
      },
    ],
  },
  "population-dynamics": {
    themeSlug: "population-dynamics",
    title: "人口動態",
    description:
      "総人口・65歳以上人口割合・15歳未満人口割合など、人口動態に関する日本全国の統計を時系列で確認できます。",
    keywords: ["日本", "全国", "人口動態", "総人口", "高齢化率", "年少人口"],
    metrics: [
      { metricKey: "total-population", shortLabel: "総人口" },
      { metricKey: "ratio-65-plus", shortLabel: "65歳以上人口割合" },
      { metricKey: "young-population-ratio", shortLabel: "15歳未満人口割合" },
    ],
  },
  railway: {
    themeSlug: "railway",
    title: "鉄道",
    description:
      "JR輸送人員・民鉄輸送人員・JR貨物発送量など、鉄道に関する日本全国の統計を時系列で確認できます。",
    keywords: ["日本", "全国", "鉄道", "JR", "民鉄", "輸送人員", "貨物"],
    metrics: [
      { metricKey: "jr-passenger-transport", shortLabel: "JR輸送人員" },
      { metricKey: "private-railway-passenger-transport", shortLabel: "民鉄輸送人員" },
      { metricKey: "jr-freight-shipment", shortLabel: "JR貨物発送量" },
    ],
  },
  "real-income": {
    themeSlug: "real-income",
    title: "実質収入・購買力",
    description:
      "可処分所得・実収入など、実質収入・購買力に関する日本全国の統計を時系列で確認できます。",
    keywords: ["日本", "全国", "実質年収", "可処分所得", "実収入", "購買力"],
    metrics: [
      {
        metricKey: "disposable-income-worker-households",
        shortLabel: "可処分所得（勤労者世帯）",
      },
      {
        metricKey: "actual-income-worker-households-per-month",
        shortLabel: "実収入（勤労者世帯・月額）",
      },
    ],
  },
  safety: {
    themeSlug: "safety",
    title: "安全",
    description:
      "刑法犯認知件数・交通事故発生件数・火災件数・自殺者数など、安全に関する日本全国の統計を時系列で確認できます。",
    keywords: ["日本", "全国", "犯罪", "治安", "交通事故", "火災", "自殺"],
    metrics: [
      {
        metricKey: "penal-code-offenses-recognized-per-1000",
        shortLabel: "刑法犯認知件数（人口1000人当たり）",
      },
      { metricKey: "serious-crime-per-100k", shortLabel: "凶悪犯認知件数（人口10万人当たり）" },
      { metricKey: "violent-crime-per-100k", shortLabel: "粗暴犯認知件数（人口10万人当たり）" },
      { metricKey: "criminal-arrest-rate", shortLabel: "刑法犯検挙率" },
      {
        metricKey: "intellectual-crime-per-100k",
        shortLabel: "知能犯認知件数（人口10万人当たり）",
      },
      { metricKey: "traffic-accident-count", shortLabel: "交通事故発生件数" },
      {
        metricKey: "building-fire-count-per-100-thousand-people",
        shortLabel: "火災出火件数（人口10万人当たり）",
      },
      { metricKey: "fire-deaths-per-100k", shortLabel: "火災死亡者数（人口10万人当たり）" },
      {
        metricKey: "annual-emergency-dispatches-per-1000",
        shortLabel: "年間救急出動件数（人口1000人当たり）",
      },
      { metricKey: "suicides-per-100k", shortLabel: "自殺者数（人口10万人当たり）" },
      {
        metricKey: "accidental-deaths-per-100k",
        shortLabel: "不慮の事故による死亡者数（人口10万人当たり）",
      },
    ],
  },
  tourism: {
    themeSlug: "tourism",
    title: "観光",
    description:
      "延べ宿泊者数・外国人延べ宿泊者数・航空輸送人員など、観光に関する日本全国の統計を時系列で確認できます。",
    keywords: ["日本", "全国", "観光", "宿泊者数", "インバウンド", "航空輸送"],
    metrics: [
      { metricKey: "total-overnight-guests", shortLabel: "延べ宿泊者数" },
      { metricKey: "total-overnight-guests-foreign", shortLabel: "外国人延べ宿泊者数" },
      { metricKey: "air-passenger-transport", shortLabel: "航空輸送人員" },
      { metricKey: "jr-passenger-transport", shortLabel: "JR輸送人員" },
    ],
  },
  roads: {
    themeSlug: "roads",
    title: "道路",
    description:
      "道路実延長（高速道路を含む）・高速道路実延長など、道路に関する日本全国の統計を時系列で確認できます。",
    keywords: ["日本", "全国", "道路", "高速道路", "インフラ"],
    metrics: [
      {
        metricKey: "road-total-length-with-expressway",
        shortLabel: "道路実延長（高速道路を含む）",
      },
      { metricKey: "road-expressway-length", shortLabel: "高速道路実延長" },
    ],
  },
};

export function getJapanCatalogTheme(themeSlug: string): JapanCatalogTheme | undefined {
  return JAPAN_CATALOGS[themeSlug];
}

export function listJapanCatalogThemes(): JapanCatalogTheme[] {
  return Object.values(JAPAN_CATALOGS);
}
