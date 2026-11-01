/**
 * `/japan` の git TS catalog (GEO-SCOPE-SEPARATION-01 WP4/WP6)。
 *
 * ★採用条件: official は `official-candidate` (00000 行が live-audit で存在確認済み) の中から、
 *   `generateOneMetric()` (実際の生成コアと同一ロジック) で値レベル照合し、
 *   `buildJapanSeriesRows` が実際に ≥1 件の有効な年を返した metric だけを追加する。
 *   derived は `JAPAN_DERIVED_METRIC_DECISIONS` で根拠・recipeを固定し、同じ生成器の
 *   dry-runを通った採用分だけを追加する。unsupported/unknownは載せない。
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
 * 2026-08-28 に unknown-non-estat 9件を追加審査し、加算可能な4件を採用した。
 * 判断SSOTは `japan-derived-metrics.ts`。
 * 2026-10-31 に全国のテーマが無い 34 テーマを同じ手順で照合し、全国の値を持つ指標が 3 件以上の 25 テーマを足した
 * (IA-REGION-THEME-01 の 5 段目。18 → 43 テーマ)。
 * 2026-10-09 に参考文献由来の「日本全体ページへ採用判断が可能」66指標を同じ
 * `verify-japan-candidates.ts` で値レベル検証し、通った estat 7件を既存テーマへ追加した
 * (live-audit は R2 監査形式へ変わり hasNational を持たないため、00000 行の存在は
 * generateOneMetric の e-Stat 実応答で確認)。kakei-chousa/external は生成器が
 * official で扱えないため不採用、事業所数(経済センサス)は製造業事業所数と意味が重なるため不採用。
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
      {
        metricKey: "education-cost-all-households",
        shortLabel: "教育費（全世帯・月平均）",
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
      {
        metricKey: "average-age-of-first-marriage-wife",
        shortLabel: "平均初婚年齢（妻）",
      },
      {
        metricKey: "population-growth-rate",
        shortLabel: "人口増減率",
      },
      {
        metricKey: "natural-increase-rate",
        shortLabel: "自然増減率",
      },
      {
        metricKey: "social-increase-rate",
        shortLabel: "社会増減率",
      },
      {
        metricKey: "late-elderly-medical-expense-per-insured",
        shortLabel: "後期高齢者医療費（被保険者1人当たり）",
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
      {
        metricKey: "inland-fishery-catch",
        shortLabel: "内水面漁業漁獲量",
      },
      {
        metricKey: "aquaculture-harvest",
        shortLabel: "養殖収獲量",
      },
      {
        metricKey: "fishery-output-value",
        shortLabel: "漁業産出額",
      },
      {
        metricKey: "fishing-port-count-ksj",
        shortLabel: "漁港数",
      },
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
      {
        metricKey: "resident-foreigner-population",
        shortLabel: "在留外国人数",
      },
      {
        metricKey: "foreign-resident-count-china",
        shortLabel: "外国人人口（中国籍）",
      },
      {
        metricKey: "foreign-resident-count-korea",
        shortLabel: "外国人人口（韓国・朝鮮籍）",
      },
      {
        metricKey: "foreign-resident-count-usa-per-100k",
        shortLabel: "外国人人口（米国籍（10万人当たり））",
      },
      {
        metricKey: "foreign-resident-count-usa",
        shortLabel: "外国人人口（米国籍）",
      },
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
      {
        metricKey: "nurses-in-medical-facilities-per-100k",
        shortLabel: "看護師・准看護師数",
      },
      {
        metricKey: "general-hospital-bed-count-per-100k",
        shortLabel: "一般病院病床数",
      },
      {
        metricKey: "pharmacy-count-per-100k",
        shortLabel: "人口10万人あたり薬局数",
      },
      {
        metricKey: "general-hospital-avg-length-of-stay",
        shortLabel: "一般病院平均在院日数",
      },
      {
        metricKey: "general-hospital-bed-occupancy-rate",
        shortLabel: "一般病院病床利用率",
      },
      {
        metricKey: "psychiatric-hospital-count-per-100k",
        shortLabel: "精神科病院数",
      },
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
      {
        metricKey: "monthly-average-actual-working-hours-male",
        shortLabel: "月間平均実労働時間数",
      },
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
      {
        metricKey: "starting-salary-university",
        shortLabel: "大卒初任給",
      },
      {
        metricKey: "starting-salary-highschool",
        shortLabel: "高卒初任給",
      },
      {
        metricKey: "scheduled-salary-male",
        shortLabel: "所定内給与額（男）",
      },
      {
        metricKey: "male-part-time-hourly-wage",
        shortLabel: "男性パートタイムの給与",
      },
      {
        metricKey: "female-part-time-hourly-wage",
        shortLabel: "女性パートタイムの給与",
      },
      {
        metricKey: "employed-people-ratio",
        shortLabel: "就業者比率",
      },
      {
        metricKey: "monthly-average-actual-working-hours-male",
        shortLabel: "月間平均実労働時間数",
      },
      {
        metricKey: "nurse-salary",
        shortLabel: "看護師の給与",
      },
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
      {
        metricKey: "households",
        shortLabel: "世帯数",
      },
      {
        metricKey: "general-households",
        shortLabel: "一般世帯数",
      },
      {
        metricKey: "population-density-per-km2-inhabitable-area",
        shortLabel: "可住地面積１km2当たり人口密度",
      },
      {
        metricKey: "habitable-area-ratio",
        shortLabel: "可住地面積割合",
      },
      {
        metricKey: "densely-inhabited-district-population-density",
        shortLabel: "人口集中地区人口密度",
      },
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
      {
        metricKey: "per-capita-prefectural-income-h27",
        shortLabel: "1人当たり県民所得",
      },
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
      {
        metricKey: "real-balance-ratio",
        shortLabel: "実質収支比率",
      },
      {
        metricKey: "self-financing-ratio",
        shortLabel: "自主財源の割合",
      },
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
      {
        metricKey: "manufacturing-establishment-site-area",
        shortLabel: "製造業事業所敷地面積",
      },
      {
        metricKey: "industrial-land-price-change-rate",
        shortLabel: "標準価格変動率（工業地）",
      },
      {
        metricKey: "industrial-water-usage",
        shortLabel: "工業用水量",
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
      {
        metricKey: "population-growth-rate",
        shortLabel: "人口増減率",
      },
      {
        metricKey: "natural-increase-rate",
        shortLabel: "自然増減率",
      },
      {
        metricKey: "social-increase-rate",
        shortLabel: "社会増減率",
      },
      {
        metricKey: "population-density-per-km2-inhabitable-area",
        shortLabel: "可住地面積１km2当たり人口密度",
      },
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
      { metricKey: "railway-passengers", shortLabel: "鉄道駅乗降客数" },
      { metricKey: "railway-station-count", shortLabel: "鉄道駅数" },
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
      {
        metricKey: "per-capita-prefectural-income-h27",
        shortLabel: "1人当たり県民所得",
      },
      {
        metricKey: "annual-income-per-household",
        shortLabel: "年間収入",
      },
      {
        metricKey: "consumption-expenditure-multi-person-households-per-month",
        shortLabel: "消費支出（二人以上の世帯・月平均）",
      },
      {
        metricKey: "avg-propensity-to-consume-worker-households",
        shortLabel: "平均消費性向（勤労者世帯）",
      },
      {
        metricKey: "current-liabilities-balance-multi-person-households-per-household",
        shortLabel: "負債現在高（二人以上の世帯）",
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
      {
        metricKey: "criminal-recognition-count",
        shortLabel: "刑法犯認知件数",
      },
      {
        metricKey: "theft-offenses-recognized-per-1000",
        shortLabel: "窃盗犯認知件数",
      },
      {
        metricKey: "theft-criminal-arrest-rate",
        shortLabel: "窃盗犯検挙率",
      },
      {
        metricKey: "juvenile-criminal-arrest-person-per-population",
        shortLabel: "少年刑法犯検挙人員",
      },
      {
        metricKey: "drug-enforcement-arrest-count-per-population",
        shortLabel: "覚醒剤取締検挙件数",
      },
      {
        metricKey: "traffic-accident-deaths-per-100k",
        shortLabel: "交通事故死者数（人口10万人当たり）",
      },
      {
        metricKey: "traffic-accident-count-per-population",
        shortLabel: "交通事故発生件数",
      },
      {
        metricKey: "traffic-accident-deaths-per-100-accidents",
        shortLabel: "交通事故死者数（事故100件当たり）",
      },
      {
        metricKey: "traffic-accident-injuries-per-100k",
        shortLabel: "交通事故負傷者数",
      },
      {
        metricKey: "traffic-accident-casualties-elderly-65plus",
        shortLabel: "交通事故死傷者数（高齢者）",
      },
      {
        metricKey: "fire-damage-casualties-per-population",
        shortLabel: "火災死傷者数",
      },
      {
        metricKey: "disaster-damage-amount-per-person",
        shortLabel: "災害被害額",
      },
      {
        metricKey: "police-officer-count-per-population",
        shortLabel: "警察官数",
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
      {
        metricKey: "room-utilization-rate",
        shortLabel: "客室稼働率",
      },
      {
        metricKey: "travel-participation-rate-domestic-tourism",
        shortLabel: "国内観光旅行の行動者率",
      },
      {
        metricKey: "travel-participation-rate-overseas",
        shortLabel: "海外観光旅行の行動者率",
      },
      {
        metricKey: "travel-participation-rate-overnight",
        shortLabel: "旅行（1泊2日以上）の行動者率",
      },
      {
        metricKey: "travel-participation-rate-day-trip",
        shortLabel: "行楽（日帰り）の行動者率",
      },
      {
        metricKey: "number-of-simple-lodging-facilities",
        shortLabel: "簡易宿所営業施設数",
      },
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
      {
        metricKey: "road-total-length",
        shortLabel: "道路実延長（合計（高速道路を除く））",
      },
      {
        metricKey: "road-national-route-length",
        shortLabel: "道路実延長（一般国道）",
      },
      {
        metricKey: "road-prefectural-route-length",
        shortLabel: "道路実延長（主要地方道）",
      },
      {
        metricKey: "road-municipal-length",
        shortLabel: "道路実延長（市町村道）",
      },
      {
        metricKey: "road-length-per-km2",
        shortLabel: "道路実延長（面積当たり）",
      },
      {
        metricKey: "main-road-paving-rate",
        shortLabel: "主要道路舗装率",
      },
      {
        metricKey: "average-road-traffic-volume",
        shortLabel: "道路平均交通量",
      },
      {
        metricKey: "roadside-station-count",
        shortLabel: "道の駅数",
      },
    ],
  },
  ports: {
    themeSlug: "ports",
    title: "港湾",
    description:
      "海上出入貨物・旅客船輸送人員など、港湾に関する日本全国の統計を時系列で確認できます。",
    keywords: ["日本", "全国", "港湾", "海上輸送", "貨物", "旅客船"],
    metrics: [
      {
        metricKey: "port-count",
        shortLabel: "港湾調査の対象港数（甲種・乙種）",
      },
      {
        metricKey: "maritime-import-export-cargo",
        shortLabel: "海上出入貨物",
      },
      {
        metricKey: "passenger-ship-transport",
        shortLabel: "旅客船輸送人員",
      },
    ],
  },
  // ★ 2026-10-31 (オーナー決定 IA-REGION-THEME-01 の 5 段目): 全国のテーマが無い 34 テーマの e-Stat 指標 251 件を
  //   verify-japan-candidates.ts で値レベル照合し (verified-official 178 件)、全国の値を持つ指標が 3 件以上ある 25 テーマを足した。
  //   1〜2 件のテーマは薄いページになるので足さない。shortLabel はそのテーマの ThemeCatalog の shortLabel。
  "construction-industry": {
    themeSlug: "construction-industry",
    title: "建設業",
    description: "元請完成工事高・下請完成工事高・従業者数・建設業就業者総数（常住地別）など、建設業に関する日本全国の統計を時系列で確認できます。",
    keywords: [
      "日本",
      "全国",
      "建設業",
      "元請完成工事高",
      "下請完成工事高",
      "従業者数",
      "建設業就業者総数（常住地別）"
    ],
    metrics: [
      {
        metricKey: "prime-contractor-completed-construction",
        shortLabel: "元請完成工事高"
      },
      {
        metricKey: "subcontractor-completed-construction",
        shortLabel: "下請完成工事高"
      },
      {
        metricKey: "construction-private-employees",
        shortLabel: "従業者数"
      },
      {
        metricKey: "construction-employed-residents",
        shortLabel: "建設業就業者総数（常住地別）"
      },
      {
        metricKey: "construction-employed-under30",
        shortLabel: "30歳未満の建設業就業者"
      },
      {
        metricKey: "construction-employed-age30to54",
        shortLabel: "30〜54歳の建設業就業者"
      },
      {
        metricKey: "construction-employed-age55plus",
        shortLabel: "55歳以上の建設業就業者"
      },
      {
        metricKey: "construction-employed-female",
        shortLabel: "女性の建設業就業者"
      },
      {
        metricKey: "public-construction-contract-count",
        shortLabel: "公共工事の請負契約件数（施工地別）"
      },
      {
        metricKey: "public-construction-contract-amount",
        shortLabel: "公共工事の請負契約額（施工地別）"
      }
    ]
  },
  "waste-recycling": {
    themeSlug: "waste-recycling",
    title: "ごみ・リサイクル",
    description: "ごみ排出量・リサイクル率・最終処分量など、ごみ・リサイクルに関する日本全国の統計を時系列で確認できます。",
    keywords: [
      "日本",
      "全国",
      "ごみ・リサイクル",
      "ごみ排出量",
      "リサイクル率",
      "最終処分量"
    ],
    metrics: [
      {
        metricKey: "garbage-total-output",
        shortLabel: "ごみ排出量"
      },
      {
        metricKey: "waste-recycling-rate",
        shortLabel: "リサイクル率"
      },
      {
        metricKey: "garbage-final-disposal",
        shortLabel: "最終処分量"
      }
    ]
  },
  "information-industry": {
    themeSlug: "information-industry",
    title: "情報通信業",
    description: "事業所数・従業者数・県内総生産（名目・2015年基準）など、情報通信業に関する日本全国の統計を時系列で確認できます。",
    keywords: [
      "日本",
      "全国",
      "情報通信業",
      "事業所数",
      "従業者数",
      "県内総生産（名目・2015年基準）"
    ],
    metrics: [
      {
        metricKey: "information-private-establishments",
        shortLabel: "事業所数"
      },
      {
        metricKey: "information-private-employees",
        shortLabel: "従業者数"
      },
      {
        metricKey: "gross-prefectural-product-information-communication-h27",
        shortLabel: "県内総生産（名目・2015年基準）"
      }
    ]
  },
  "agriculture-production": {
    themeSlug: "agriculture-production",
    title: "農業の生産力",
    description: "農業就業者1人当たり農業産出額・農家数・基幹的農業従事者数（販売農家）・耕地面積など、農業の生産力に関する日本全国の統計を時系列で確認できます。",
    keywords: [
      "日本",
      "全国",
      "農業の生産力",
      "農業就業者1人当たり農業産出額",
      "農家数",
      "基幹的農業従事者数（販売農家）",
      "耕地面積"
    ],
    metrics: [
      {
        metricKey: "agricultural-output-per-employed-person",
        shortLabel: "農業就業者1人当たり農業産出額"
      },
      {
        metricKey: "agricultural-farm-count",
        shortLabel: "農家数"
      },
      {
        metricKey: "core-agricultural-workers",
        shortLabel: "基幹的農業従事者数（販売農家）"
      },
      {
        metricKey: "cultivated-area",
        shortLabel: "耕地面積"
      }
    ]
  },
  "forestry-timber": {
    themeSlug: "forestry-timber",
    title: "森林・林業・木材産業",
    description: "森林面積・林野面積割合・人工造林面積・林道延長など、森林・林業・木材産業に関する日本全国の統計を時系列で確認できます。",
    keywords: [
      "日本",
      "全国",
      "森林・林業・木材産業",
      "森林面積",
      "林野面積割合",
      "人工造林面積",
      "林道延長"
    ],
    metrics: [
      {
        metricKey: "woodland-area",
        shortLabel: "森林面積"
      },
      {
        metricKey: "forest-area-ratio",
        shortLabel: "林野面積割合"
      },
      {
        metricKey: "artificial-forest-area",
        shortLabel: "人工造林面積"
      },
      {
        metricKey: "forest-road-length",
        shortLabel: "林道延長"
      }
    ]
  },
  "retail-commerce": {
    themeSlug: "retail-commerce",
    title: "商業と小売",
    description: "小売業事業所数・小売業売場面積・小売業年間商品販売額・小売業従業者数など、商業と小売に関する日本全国の統計を時系列で確認できます。",
    keywords: [
      "日本",
      "全国",
      "商業と小売",
      "小売業事業所数",
      "小売業売場面積",
      "小売業年間商品販売額",
      "小売業従業者数"
    ],
    metrics: [
      {
        metricKey: "retail-establishments-by-prefecture",
        shortLabel: "小売業事業所数"
      },
      {
        metricKey: "retail-sales-area-by-class",
        shortLabel: "小売業売場面積"
      },
      {
        metricKey: "retail-sales-amount-by-prefecture",
        shortLabel: "小売業年間商品販売額"
      },
      {
        metricKey: "retail-employees",
        shortLabel: "小売業従業者数"
      }
    ]
  },
  "local-services": {
    themeSlug: "local-services",
    title: "飲食・生活関連サービス",
    description: "飲食店数（人口千人当たり）・ホテル営業施設数・ホテル営業施設客室数・洗濯・理容・美容・浴場業の事業所数など、飲食・生活関連サービスに関する日本全国の統計を時系列で確認できます。",
    keywords: [
      "日本",
      "全国",
      "飲食・生活関連サービス",
      "飲食店数（人口千人当たり）",
      "ホテル営業施設数",
      "ホテル営業施設客室数",
      "洗濯・理容・美容・浴場業の事業所数"
    ],
    metrics: [
      {
        metricKey: "restaurant-count-per-1000",
        shortLabel: "飲食店数（人口千人当たり）"
      },
      {
        metricKey: "number-of-hotel-facilities",
        shortLabel: "ホテル営業施設数"
      },
      {
        metricKey: "number-of-hotel-rooms",
        shortLabel: "ホテル営業施設客室数"
      },
      {
        metricKey: "laundry-beauty-bath-industry-establishments",
        shortLabel: "洗濯・理容・美容・浴場業の事業所数"
      },
      {
        metricKey: "laundry-beauty-bath-industry-employees",
        shortLabel: "洗濯・理容・美容・浴場業の従業者数"
      },
      {
        metricKey: "media-production-establishments",
        shortLabel: "映像・音声・文字情報制作業の事業所数"
      },
      {
        metricKey: "media-production-employees",
        shortLabel: "映像・音声・文字情報制作業の従業者数"
      },
      {
        metricKey: "amusement-industry-establishments",
        shortLabel: "娯楽業の事業所数"
      },
      {
        metricKey: "amusement-industry-employees",
        shortLabel: "娯楽業の従業者数"
      },
      {
        metricKey: "beauty-salon-count",
        shortLabel: "美容所数"
      }
    ]
  },
  "business-demography": {
    themeSlug: "business-demography",
    title: "起業と開廃業",
    description: "会社・個人経営の企業総数・常用雇用者0〜4人の企業数・会社・個人経営の従業者総数・常用雇用者0〜4人企業の従業者数など、起業と開廃業に関する日本全国の統計を時系列で確認できます。",
    keywords: [
      "日本",
      "全国",
      "起業と開廃業",
      "会社・個人経営の企業総数",
      "常用雇用者0〜4人の企業数",
      "会社・個人経営の従業者総数",
      "常用雇用者0〜4人企業の従業者数"
    ],
    metrics: [
      {
        metricKey: "nonprimary-enterprises-count",
        shortLabel: "会社・個人経営の企業総数"
      },
      {
        metricKey: "nonprimary-enterprises-under5-count",
        shortLabel: "常用雇用者0〜4人の企業数"
      },
      {
        metricKey: "nonprimary-enterprises-employees",
        shortLabel: "会社・個人経営の従業者総数"
      },
      {
        metricKey: "nonprimary-enterprises-under5-employees",
        shortLabel: "常用雇用者0〜4人企業の従業者数"
      }
    ]
  },
  "innovation-patents": {
    themeSlug: "innovation-patents",
    title: "研究開発と特許",
    description: "特許出願件数（筆頭出願人住所）・特許登録件数（筆頭出願人住所）・出願に記載された延べ発明者数・意匠出願件数など、研究開発と特許に関する日本全国の統計を時系列で確認できます。",
    keywords: [
      "日本",
      "全国",
      "研究開発と特許",
      "特許出願件数（筆頭出願人住所）",
      "特許登録件数（筆頭出願人住所）",
      "出願に記載された延べ発明者数",
      "意匠出願件数"
    ],
    metrics: [
      {
        metricKey: "patent-application-count",
        shortLabel: "特許出願件数（筆頭出願人住所）"
      },
      {
        metricKey: "patent-registration-count",
        shortLabel: "特許登録件数（筆頭出願人住所）"
      },
      {
        metricKey: "patent-inventor-count",
        shortLabel: "出願に記載された延べ発明者数"
      },
      {
        metricKey: "design-application-count",
        shortLabel: "意匠出願件数"
      },
      {
        metricKey: "design-registration-count",
        shortLabel: "意匠登録件数"
      },
      {
        metricKey: "trademark-application-count",
        shortLabel: "商標出願件数"
      },
      {
        metricKey: "trademark-registration-count",
        shortLabel: "商標登録件数"
      }
    ]
  },
  "childcare-services": {
    themeSlug: "childcare-services",
    title: "保育の需給",
    description: "保育所等数（0～5歳人口10万人当たり）・保育所等在所児数（保育士1人当たり）・保育所等利用率（在所児数／定員数）・認定こども園数（0～5歳人口10万人当たり）など、保育の需給に関する日本全国の統計を時系列で確認できます。",
    keywords: [
      "日本",
      "全国",
      "保育の需給",
      "保育所等数（0～5歳人口10万人当たり）",
      "保育所等在所児数（保育士1人当たり）",
      "保育所等利用率（在所児数／定員数）",
      "認定こども園数（0～5歳人口10万人当たり）"
    ],
    metrics: [
      {
        metricKey: "nursery-count-per-100k-0-5",
        shortLabel: "保育所等数（0～5歳人口10万人当たり）"
      },
      {
        metricKey: "nursery-children-per-nursery-teacher",
        shortLabel: "保育所等在所児数（保育士1人当たり）"
      },
      {
        metricKey: "nursery-utilization-rate",
        shortLabel: "保育所等利用率（在所児数／定員数）"
      },
      {
        metricKey: "certified-childcare-center-count-per-100k-0-5",
        shortLabel: "認定こども園数（0～5歳人口10万人当たり）"
      },
      {
        metricKey: "nursery-waiting-children-count",
        shortLabel: "保育所等利用待機児童数"
      }
    ]
  },
  "single-parent-households": {
    themeSlug: "single-parent-households",
    title: "ひとり親家庭の生活",
    description: "母子世帯数・父子世帯数・生活保護を受ける母子世帯数（年度平均）・児童扶養手当受給者数（年度末）など、ひとり親家庭の生活に関する日本全国の統計を時系列で確認できます。",
    keywords: [
      "日本",
      "全国",
      "ひとり親家庭の生活",
      "母子世帯数",
      "父子世帯数",
      "生活保護を受ける母子世帯数（年度平均）",
      "児童扶養手当受給者数（年度末）"
    ],
    metrics: [
      {
        metricKey: "single-mother-households",
        shortLabel: "母子世帯数"
      },
      {
        metricKey: "single-father-households",
        shortLabel: "父子世帯数"
      },
      {
        metricKey: "single-mother-public-assistance-households",
        shortLabel: "生活保護を受ける母子世帯数（年度平均）"
      },
      {
        metricKey: "child-rearing-allowance-recipients",
        shortLabel: "児童扶養手当受給者数（年度末）"
      },
      {
        metricKey: "single-mother-households-income-under100",
        shortLabel: "母子世帯の所得100万円未満"
      },
      {
        metricKey: "single-mother-households-income-100to199",
        shortLabel: "母子世帯の所得100〜199万円"
      },
      {
        metricKey: "single-mother-households-income-200to299",
        shortLabel: "母子世帯の所得200〜299万円"
      },
      {
        metricKey: "single-mother-households-income-300to399",
        shortLabel: "母子世帯の所得300〜399万円"
      },
      {
        metricKey: "single-mother-households-income-400to499",
        shortLabel: "母子世帯の所得400〜499万円"
      },
      {
        metricKey: "single-mother-households-income-500plus",
        shortLabel: "母子世帯の所得500万円以上"
      }
    ]
  },
  "long-term-care": {
    themeSlug: "long-term-care",
    title: "介護認定とサービスの需給",
    description: "介護保険給付費用額・老人ホーム数（65歳以上人口10万人当たり）・老人ホーム定員数（65歳以上人口千人当たり）・老人ホーム在所者数（65歳以上人口千人当たり）など、介護認定とサービスの需給に関する日本全国の統計を時系列で確認できます。",
    keywords: [
      "日本",
      "全国",
      "介護認定とサービスの需給",
      "介護保険給付費用額",
      "老人ホーム数（65歳以上人口10万人当たり）",
      "老人ホーム定員数（65歳以上人口千人当たり）",
      "老人ホーム在所者数（65歳以上人口千人当たり）"
    ],
    metrics: [
      {
        metricKey: "nursing-care-insurance-benefit",
        shortLabel: "介護保険給付費用額"
      },
      {
        metricKey: "nursing-home-count-per-100k-65plus",
        shortLabel: "老人ホーム数（65歳以上人口10万人当たり）"
      },
      {
        metricKey: "nursing-home-capacity-per-1000-65plus",
        shortLabel: "老人ホーム定員数（65歳以上人口千人当たり）"
      },
      {
        metricKey: "nursing-home-residents-per-1000-65plus",
        shortLabel: "老人ホーム在所者数（65歳以上人口千人当たり）"
      }
    ]
  },
  "disability-support": {
    themeSlug: "disability-support",
    title: "障害福祉と社会参加",
    description: "知的障害者援護施設数（人口100万人当たり）・知的障害者援護施設定員数（人口10万人当たり）・知的障害者援護施設在所者数（人口10万人当たり）・身体障害者手帳交付数（人口千人当たり）など、障害福祉と社会参加に関する日本全国の統計を時系列で確認できます。",
    keywords: [
      "日本",
      "全国",
      "障害福祉と社会参加",
      "知的障害者援護施設数（人口100万人当たり）",
      "知的障害者援護施設定員数（人口10万人当たり）",
      "知的障害者援護施設在所者数（人口10万人当たり）",
      "身体障害者手帳交付数（人口千人当たり）"
    ],
    metrics: [
      {
        metricKey: "intellectual-disability-support-facility-count-per-1m",
        shortLabel: "知的障害者援護施設数（人口100万人当たり）"
      },
      {
        metricKey: "intellectual-disability-support-facility-capacity-per-100k",
        shortLabel: "知的障害者援護施設定員数（人口10万人当たり）"
      },
      {
        metricKey: "intellectual-disability-support-facility-residents-per-100k",
        shortLabel: "知的障害者援護施設在所者数（人口10万人当たり）"
      },
      {
        metricKey: "physical-disability-certificates-issued-per-1000",
        shortLabel: "身体障害者手帳交付数（人口千人当たり）"
      },
      {
        metricKey: "disabled-employment-rate",
        shortLabel: "障害者就職率（ハローワーク）"
      }
    ]
  },
  "public-assistance": {
    themeSlug: "public-assistance",
    title: "生活保護と生活困窮",
    description: "生活保護被保護実人員（月平均・人口千人当たり）・生活保護被保護実世帯数（月平均・一般世帯千世帯当たり）・生活保護費（都道府県財政）・保護施設定員数（被保護実人員千人当たり）など、生活保護と生活困窮に関する日本全国の統計を時系列で確認できます。",
    keywords: [
      "日本",
      "全国",
      "生活保護と生活困窮",
      "生活保護被保護実人員（月平均・人口千人当たり）",
      "生活保護被保護実世帯数（月平均・一般世帯千世帯当たり）",
      "生活保護費（都道府県財政）",
      "保護施設定員数（被保護実人員千人当たり）"
    ],
    metrics: [
      {
        metricKey: "persons-on-public-assistance-per-1000",
        shortLabel: "生活保護被保護実人員（月平均・人口千人当たり）"
      },
      {
        metricKey: "households-on-public-assistance-per-1000",
        shortLabel: "生活保護被保護実世帯数（月平均・一般世帯千世帯当たり）"
      },
      {
        metricKey: "public-assistance-expenses-prefecture",
        shortLabel: "生活保護費（都道府県財政）"
      },
      {
        metricKey: "public-assistance-facility-capacity-per-1000",
        shortLabel: "保護施設定員数（被保護実人員千人当たり）"
      }
    ]
  },
  "daily-time-use": {
    themeSlug: "daily-time-use",
    title: "睡眠と生活時間",
    description: "女性の睡眠時間・男性の睡眠時間・女性の家事時間・男性の家事時間など、睡眠と生活時間に関する日本全国の統計を時系列で確認できます。",
    keywords: [
      "日本",
      "全国",
      "睡眠と生活時間",
      "女性の睡眠時間",
      "男性の睡眠時間",
      "女性の家事時間",
      "男性の家事時間"
    ],
    metrics: [
      {
        metricKey: "sleep-avg-time-female",
        shortLabel: "女性の睡眠時間"
      },
      {
        metricKey: "sleep-avg-time-male",
        shortLabel: "男性の睡眠時間"
      },
      {
        metricKey: "housework-avg-time-female",
        shortLabel: "女性の家事時間"
      },
      {
        metricKey: "housework-avg-time-male",
        shortLabel: "男性の家事時間"
      },
      {
        metricKey: "hobby-leisure-avg-time-employed-female",
        shortLabel: "女性有業者の趣味・娯楽時間"
      },
      {
        metricKey: "hobby-leisure-avg-time-employed-male",
        shortLabel: "男性有業者の趣味・娯楽時間"
      },
      {
        metricKey: "work-avg-time-employed-female",
        shortLabel: "女性有業者の仕事時間"
      },
      {
        metricKey: "work-avg-time-employed-male",
        shortLabel: "男性有業者の仕事時間"
      },
      {
        metricKey: "hobby-participation-rate-karaoke",
        shortLabel: "カラオケの行動者率"
      },
      {
        metricKey: "hobby-participation-rate-video-games",
        shortLabel: "ゲームの行動者率"
      },
      {
        metricKey: "hobby-participation-rate-pachinko",
        shortLabel: "パチンコの行動者率"
      },
      {
        metricKey: "hobby-participation-rate-gardening",
        shortLabel: "園芸・庭いじり・ガーデニングの行動者率"
      },
      {
        metricKey: "broadcast-media-time-all",
        shortLabel: "テレビ・ラジオ・新聞・雑誌の総平均時間"
      },
      {
        metricKey: "meal-avg-time-female",
        shortLabel: "食事の平均時間（女）"
      },
      {
        metricKey: "meal-avg-time-male",
        shortLabel: "食事の平均時間（男）"
      },
      {
        metricKey: "primary-school-commute-time-weekday",
        shortLabel: "小学生の通勤・通学の総平均時間"
      }
    ]
  },
  "household-assets-debt": {
    themeSlug: "household-assets-debt",
    title: "貯蓄と負債",
    description: "金融資産残高（貯蓄現在高・二人以上世帯1世帯当たり）・金融負債残高（二人以上世帯）・平均貯蓄率（勤労者世帯）・預貯金が金融資産に占める割合など、貯蓄と負債に関する日本全国の統計を時系列で確認できます。",
    keywords: [
      "日本",
      "全国",
      "貯蓄と負債",
      "金融資産残高（貯蓄現在高・二人以上世帯1世帯当たり）",
      "金融負債残高（二人以上世帯）",
      "平均貯蓄率（勤労者世帯）",
      "預貯金が金融資産に占める割合"
    ],
    metrics: [
      {
        metricKey: "financial-assets-balance-multi-person-households",
        shortLabel: "金融資産残高（貯蓄現在高・二人以上世帯1世帯当たり）"
      },
      {
        metricKey: "financial-debt-balance",
        shortLabel: "金融負債残高（二人以上世帯）"
      },
      {
        metricKey: "avg-savings-rate-worker-households",
        shortLabel: "平均貯蓄率（勤労者世帯）"
      },
      {
        metricKey: "current-deposit-balance-ratio-multi-person-households",
        shortLabel: "預貯金が金融資産に占める割合"
      },
      {
        metricKey: "current-life-insurance-balance-ratio-multi-person-households",
        shortLabel: "生命保険などが金融資産に占める割合"
      },
      {
        metricKey: "current-securities-balance-ratio-multi-person-households",
        shortLabel: "有価証券が金融資産に占める割合"
      },
      {
        metricKey: "housing-land-liabilities-ratio-multi-person-households",
        shortLabel: "住宅・土地負債が金融負債に占める割合"
      },
      {
        metricKey: "securities-balance",
        shortLabel: "有価証券保有額"
      }
    ]
  },
  "freight-logistics": {
    themeSlug: "freight-logistics",
    title: "物流と貨物輸送",
    description: "JR貨物発送量・航空貨物輸送量・貨物車数・トラック事業者など、物流と貨物輸送に関する日本全国の統計を時系列で確認できます。",
    keywords: [
      "日本",
      "全国",
      "物流と貨物輸送",
      "JR貨物発送量",
      "航空貨物輸送量",
      "貨物車数",
      "トラック事業者"
    ],
    metrics: [
      {
        metricKey: "jr-freight-shipment",
        shortLabel: "JR貨物発送量"
      },
      {
        metricKey: "air-cargo-transport",
        shortLabel: "航空貨物輸送量"
      },
      {
        metricKey: "number-of-freight-cars",
        shortLabel: "貨物車数"
      },
      {
        metricKey: "truck-operators",
        shortLabel: "トラック事業者"
      }
    ]
  },
  "regional-transport": {
    themeSlug: "regional-transport",
    title: "自動車依存と移動手段",
    description: "自動車所有数量（二人以上世帯千世帯当たり）・自家用車通勤・通学者数・乗合バス通勤・通学者数・鉄道・電車通勤・通学者数など、自動車依存と移動手段に関する日本全国の統計を時系列で確認できます。",
    keywords: [
      "日本",
      "全国",
      "自動車依存と移動手段",
      "自動車所有数量（二人以上世帯千世帯当たり）",
      "自家用車通勤・通学者数",
      "乗合バス通勤・通学者数",
      "鉄道・電車通勤・通学者数"
    ],
    metrics: [
      {
        metricKey: "car-ownership-multi-person-households-per-1000",
        shortLabel: "自動車所有数量（二人以上世帯千世帯当たり）"
      },
      {
        metricKey: "commute-by-car",
        shortLabel: "自家用車通勤・通学者数"
      },
      {
        metricKey: "commute-by-bus",
        shortLabel: "乗合バス通勤・通学者数"
      },
      {
        metricKey: "commute-by-train",
        shortLabel: "鉄道・電車通勤・通学者数"
      },
      {
        metricKey: "bus-operators",
        shortLabel: "バス事業者"
      },
      {
        metricKey: "household-survey-transport-communication-expenditure",
        shortLabel: "交通・通信支出（二人以上世帯・10〜11月の月平均）"
      },
      {
        metricKey: "commuters-total",
        shortLabel: "自宅外通勤・通学者数"
      }
    ]
  },
  "water-services": {
    themeSlug: "water-services",
    title: "水道の持続性",
    description: "上水道給水人口比率・下水道処理人口普及率・上水道年間給水量・上水道施設能力など、水道の持続性に関する日本全国の統計を時系列で確認できます。",
    keywords: [
      "日本",
      "全国",
      "水道の持続性",
      "上水道給水人口比率",
      "下水道処理人口普及率",
      "上水道年間給水量",
      "上水道施設能力"
    ],
    metrics: [
      {
        metricKey: "water-supply-population-ratio-2012on",
        shortLabel: "上水道給水人口比率"
      },
      {
        metricKey: "sewerage-coverage-rate",
        shortLabel: "下水道処理人口普及率"
      },
      {
        metricKey: "water-supply-annual-volume",
        shortLabel: "上水道年間給水量"
      },
      {
        metricKey: "water-supply-capacity",
        shortLabel: "上水道施設能力"
      }
    ]
  },
  "communication-access": {
    themeSlug: "communication-access",
    title: "通信環境とデジタル基盤",
    description: "ブロードバンド契約数（3.9〜4世代携帯電話アクセスを除く）・ブロードバンド契約数（携帯電話アクセスを含む旧系列）・携帯電話契約数（人口千人当たり）・携帯電話所有数量（二人以上世帯千世帯当たり）など、通信環境とデジタル基盤に関する日本全国の統計を時系列で確認できます。",
    keywords: [
      "日本",
      "全国",
      "通信環境とデジタル基盤",
      "ブロードバンド契約数（3.9〜4世代携帯電話アクセスを除く）",
      "ブロードバンド契約数（携帯電話アクセスを含む旧系列）",
      "携帯電話契約数（人口千人当たり）",
      "携帯電話所有数量（二人以上世帯千世帯当たり）"
    ],
    metrics: [
      {
        metricKey: "broadband-contract-count-excluding-39-4g",
        shortLabel: "ブロードバンド契約数（3.9〜4世代携帯電話アクセスを除く）"
      },
      {
        metricKey: "broadband-service-contract-count",
        shortLabel: "ブロードバンド契約数（携帯電話アクセスを含む旧系列）"
      },
      {
        metricKey: "mobile-phone-contract-count-per-1000",
        shortLabel: "携帯電話契約数（人口千人当たり）"
      },
      {
        metricKey: "mobile-phone-ownership-multi-person-households-per-1000",
        shortLabel: "携帯電話所有数量（二人以上世帯千世帯当たり）"
      },
      {
        metricKey: "internet-usage-rate-10plus",
        shortLabel: "インターネットの利用行動者率"
      }
    ]
  },
  "natural-environment": {
    themeSlug: "natural-environment",
    title: "森林と自然環境",
    description: "森林面積・林野面積割合・人工造林面積・自然環境保全地域面積など、森林と自然環境に関する日本全国の統計を時系列で確認できます。",
    keywords: [
      "日本",
      "全国",
      "森林と自然環境",
      "森林面積",
      "林野面積割合",
      "人工造林面積",
      "自然環境保全地域面積"
    ],
    metrics: [
      {
        metricKey: "woodland-area",
        shortLabel: "森林面積"
      },
      {
        metricKey: "forest-area-ratio",
        shortLabel: "林野面積割合"
      },
      {
        metricKey: "artificial-forest-area",
        shortLabel: "人工造林面積"
      },
      {
        metricKey: "natural-environment-conservation-area",
        shortLabel: "自然環境保全地域面積"
      },
      {
        metricKey: "nature-park-area",
        shortLabel: "自然公園面積"
      }
    ]
  },
  "cultural-participation": {
    themeSlug: "cultural-participation",
    title: "文化芸術への参加",
    description: "美術鑑賞の行動者率・演芸・演劇・舞踊鑑賞の行動者率・クラシック音楽鑑賞の行動者率・絵画・彫刻の制作の行動者率など、文化芸術への参加に関する日本全国の統計を時系列で確認できます。",
    keywords: [
      "日本",
      "全国",
      "文化芸術への参加",
      "美術鑑賞の行動者率",
      "演芸・演劇・舞踊鑑賞の行動者率",
      "クラシック音楽鑑賞の行動者率",
      "絵画・彫刻の制作の行動者率"
    ],
    metrics: [
      {
        metricKey: "hobby-participation-rate-art-appreciation",
        shortLabel: "美術鑑賞の行動者率"
      },
      {
        metricKey: "hobby-participation-rate-theater",
        shortLabel: "演芸・演劇・舞踊鑑賞の行動者率"
      },
      {
        metricKey: "hobby-participation-rate-classical-music",
        shortLabel: "クラシック音楽鑑賞の行動者率"
      },
      {
        metricKey: "hobby-participation-rate-painting",
        shortLabel: "絵画・彫刻の制作の行動者率"
      },
      {
        metricKey: "library-lending-books",
        shortLabel: "図書館館外貸出冊数"
      },
      {
        metricKey: "relaxation-avg-time-male",
        shortLabel: "男性の休養・くつろぎ時間（週全体総平均・分/日）"
      },
      {
        metricKey: "relaxation-avg-time-female",
        shortLabel: "女性の休養・くつろぎ時間（週全体総平均・分/日）"
      },
      {
        metricKey: "hobby-leisure-avg-time-employed-male",
        shortLabel: "有業男性の趣味・娯楽時間（週全体総平均・分/日）"
      },
      {
        metricKey: "hobby-leisure-avg-time-employed-female",
        shortLabel: "有業女性の趣味・娯楽時間（週全体総平均・分/日）"
      },
      {
        metricKey: "hobby-participation-rate-go",
        shortLabel: "囲碁の行動者率"
      },
      {
        metricKey: "hobby-participation-rate-shogi",
        shortLabel: "将棋の行動者率"
      },
      {
        metricKey: "hobby-participation-rate-flower-arrangement",
        shortLabel: "華道の行動者率"
      },
      {
        metricKey: "hobby-participation-rate-instrument",
        shortLabel: "楽器の演奏の行動者率"
      },
      {
        metricKey: "hobby-participation-rate-photography",
        shortLabel: "写真の撮影・プリントの行動者率"
      },
      {
        metricKey: "hobby-participation-rate-reading",
        shortLabel: "趣味としての読書の行動者率"
      },
      {
        metricKey: "hobby-participation-rate-calligraphy",
        shortLabel: "書道の行動者率"
      },
      {
        metricKey: "hobby-participation-rate-tea-ceremony",
        shortLabel: "茶道の行動者率"
      },
      {
        metricKey: "hobby-participation-rate-knitting",
        shortLabel: "編み物・手芸の行動者率"
      }
    ]
  },
  "sports-participation": {
    themeSlug: "sports-participation",
    title: "スポーツ施設と利用",
    description: "スポーツ年間行動者率（10歳以上）・スポーツ観覧の行動者率・社会体育施設数（人口100万人当たり）・運動公園数など、スポーツ施設と利用に関する日本全国の統計を時系列で確認できます。",
    keywords: [
      "日本",
      "全国",
      "スポーツ施設と利用",
      "スポーツ年間行動者率（10歳以上）",
      "スポーツ観覧の行動者率",
      "社会体育施設数（人口100万人当たり）",
      "運動公園数"
    ],
    metrics: [
      {
        metricKey: "sports-annual-participation-rate-10plus",
        shortLabel: "スポーツ年間行動者率（10歳以上）"
      },
      {
        metricKey: "hobby-participation-rate-sports-spectating",
        shortLabel: "スポーツ観覧の行動者率"
      },
      {
        metricKey: "community-sports-facility-count-per-million",
        shortLabel: "社会体育施設数（人口100万人当たり）"
      },
      {
        metricKey: "sports-park-count",
        shortLabel: "運動公園数"
      },
      {
        metricKey: "swimming-pool-public",
        shortLabel: "水泳プール数（公共・実数）"
      },
      {
        metricKey: "public-swimming-pool-count-per-million",
        shortLabel: "水泳プール数（人口100万人当たり）"
      },
      {
        metricKey: "public-gymnasium-count-per-million",
        shortLabel: "体育館数"
      },
      {
        metricKey: "baseball-field-public",
        shortLabel: "野球場・ソフトボール場数（公共）"
      },
      {
        metricKey: "sports-participation-rate-golf",
        shortLabel: "ゴルフの行動者率"
      },
      {
        metricKey: "sports-participation-rate-cycling",
        shortLabel: "サイクリングの行動者率"
      },
      {
        metricKey: "sports-participation-rate-skiing",
        shortLabel: "スキー・スノーボードの行動者率"
      },
      {
        metricKey: "sports-participation-rate-fishing",
        shortLabel: "つりの行動者率"
      },
      {
        metricKey: "sports-participation-rate-hiking",
        shortLabel: "登山・ハイキングの行動者率"
      }
    ]
  },
  "gender-participation": {
    themeSlug: "gender-participation",
    title: "地域の男女共同参画",
    description: "女性労働力人口比率・男性労働力人口比率・女性の家事時間（15歳以上・1日平均）・男性の家事時間（15歳以上・1日平均）など、地域の男女共同参画に関する日本全国の統計を時系列で確認できます。",
    keywords: [
      "日本",
      "全国",
      "地域の男女共同参画",
      "女性労働力人口比率",
      "男性労働力人口比率",
      "女性の家事時間（15歳以上・1日平均）",
      "男性の家事時間（15歳以上・1日平均）"
    ],
    metrics: [
      {
        metricKey: "labor-force-population-ratio-woman",
        shortLabel: "女性労働力人口比率"
      },
      {
        metricKey: "labor-force-population-ratio-man",
        shortLabel: "男性労働力人口比率"
      },
      {
        metricKey: "housework-avg-time-female",
        shortLabel: "女性の家事時間（15歳以上・1日平均）"
      },
      {
        metricKey: "housework-avg-time-male",
        shortLabel: "男性の家事時間（15歳以上・1日平均）"
      },
      {
        metricKey: "female-part-time-hourly-wage",
        shortLabel: "女性パートタイム時給"
      }
    ]
  },
  "community-participation": {
    themeSlug: "community-participation",
    title: "市民参加と地域活動",
    description: "ボランティア年間行動者率（10歳以上）・都道府県知事選挙投票率・図書館登録者数・まちづくり活動の年間行動者率（10歳以上）など、市民参加と地域活動に関する日本全国の統計を時系列で確認できます。",
    keywords: [
      "日本",
      "全国",
      "市民参加と地域活動",
      "ボランティア年間行動者率（10歳以上）",
      "都道府県知事選挙投票率",
      "図書館登録者数",
      "まちづくり活動の年間行動者率（10歳以上）"
    ],
    metrics: [
      {
        metricKey: "volunteer-activity-annual-participation-rate-10plus",
        shortLabel: "ボランティア年間行動者率（10歳以上）"
      },
      {
        metricKey: "voter-turnout-governor",
        shortLabel: "都道府県知事選挙投票率"
      },
      {
        metricKey: "library-registered-users",
        shortLabel: "図書館登録者数"
      },
      {
        metricKey: "community-building-volunteer-participation-rate-10plus",
        shortLabel: "まちづくり活動の年間行動者率（10歳以上）"
      }
    ]
  },
};

export function getJapanCatalogTheme(themeSlug: string): JapanCatalogTheme | undefined {
  return JAPAN_CATALOGS[themeSlug];
}

export function listJapanCatalogThemes(): JapanCatalogTheme[] {
  return Object.values(JAPAN_CATALOGS);
}
