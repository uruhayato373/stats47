/**
 * AUTO-GENERATED — 手編集禁止
 *
 * 生成コマンド: npm run generate:ranking-prominence --workspace apps/web
 * 真実源: data/metrics/*.ts + data/surveys/editorial/editorial.json (読者の問い) + GSC snapshot
 *
 * 調査一覧 (/survey) のカードに出す、調査ごとの代表の指標 (3 件) とアイコンのカテゴリ。
 * 代表は調査の解説の台帳の「読者の問い」の指標を先に、足りない分を掲載価値の高い順で埋める。
 * サーバーの調査一覧だけが読む (ヘッダーが読む ranking-prominence.generated.ts とは分ける)。
 */

export interface SurveyRepresentative {
  rankingKey: string;
  /** 正準な統計名 */
  title: string;
  /** 読者向けの平易な指標名 */
  readerLabel?: string;
  /** 分母・内訳 (config の subtitle)。名前は metricDisplayName で組み立てる */
  subtitle?: string;
}

export interface SurveyProminence {
  /** アイコンに使うカテゴリ (その調査の公開中の指標で最も多いカテゴリ) */
  categoryKey: string;
  representatives: ReadonlyArray<SurveyRepresentative>;
}

export const SURVEY_PROMINENCE: Readonly<Record<string, SurveyProminence>> =
  {
  "academic-achievement-survey": {
    "categoryKey": "educationsports",
    "representatives": [
      {
        "rankingKey": "academic-achievement-test-average-rate",
        "title": "全国学力テスト平均正答率",
        "readerLabel": "全国学力テスト平均正答率",
        "subtitle": "公立小学校6年生の国語・算数と公立中学校3年生の国語・数学の平均正答率の単純平均"
      },
      {
        "rankingKey": "national-assessment-elementary-breakfast-rate",
        "title": "朝食を毎日食べている小学生の割合",
        "readerLabel": "朝食を毎日食べている小学生の割合",
        "subtitle": "全国学力・学習状況調査(公立・小6)"
      },
      {
        "rankingKey": "national-assessment-elementary-reading-like-rate",
        "title": "読書が好きな小学生の割合",
        "readerLabel": "読書が好きな小学生の割合",
        "subtitle": "全国学力・学習状況調査(公立・小6)"
      }
    ]
  },
  "accommodation-survey": {
    "categoryKey": "tourism",
    "representatives": [
      {
        "rankingKey": "total-overnight-guests",
        "title": "延べ宿泊者数",
        "readerLabel": "延べ宿泊者数"
      },
      {
        "rankingKey": "total-overnight-guests-foreign",
        "title": "外国人延べ宿泊者数",
        "readerLabel": "外国人延べ宿泊者数"
      },
      {
        "rankingKey": "room-utilization-rate",
        "title": "客室稼働率",
        "readerLabel": "客室稼働率"
      }
    ]
  },
  "administrative-investment-report": {
    "categoryKey": "administrativefinancial",
    "representatives": [
      {
        "rankingKey": "total-administrative-investment",
        "title": "行政総投資額",
        "readerLabel": "行政総投資額"
      },
      {
        "rankingKey": "general-project-investment-road",
        "title": "一般事業投資額",
        "readerLabel": "一般事業投資額",
        "subtitle": "道路"
      },
      {
        "rankingKey": "general-project-investment-educational-facilities",
        "title": "一般事業投資額",
        "readerLabel": "一般事業投資額",
        "subtitle": "文教施設"
      }
    ]
  },
  "age-adjusted-mortality-statistics": {
    "categoryKey": "population",
    "representatives": [
      {
        "rankingKey": "breast-cancer-asr75-mortality-female",
        "title": "乳がん 75歳未満年齢調整死亡率",
        "readerLabel": "乳がん75歳未満年齢調整死亡率",
        "subtitle": "女性・人口10万人対"
      }
    ]
  },
  "agricultural-income-statistics": {
    "categoryKey": "agriculture",
    "representatives": [
      {
        "rankingKey": "agricultural-output",
        "title": "農業産出額",
        "readerLabel": "農業産出額"
      },
      {
        "rankingKey": "agricultural-output-per-employed-person",
        "title": "就業者1人当たり農業産出額",
        "readerLabel": "就業者1人当たり農業産出額",
        "subtitle": "農業就業者"
      },
      {
        "rankingKey": "land-productivity-per-ha",
        "title": "土地生産性",
        "readerLabel": "土地生産性",
        "subtitle": "耕地面積1ヘクタール当たり"
      }
    ]
  },
  "agriculture-forestry-census": {
    "categoryKey": "agriculture",
    "representatives": [
      {
        "rankingKey": "agricultural-farm-count",
        "title": "農家数",
        "readerLabel": "農家数"
      },
      {
        "rankingKey": "agricultural-employment-population",
        "title": "農業就業人口",
        "readerLabel": "農業就業人口"
      },
      {
        "rankingKey": "abandoned-cultivated-land-area",
        "title": "耕地放棄面積",
        "readerLabel": "耕地放棄面積"
      }
    ]
  },
  "agriculture-management-survey": {
    "categoryKey": "agriculture",
    "representatives": [
      {
        "rankingKey": "total-farm-household-income",
        "title": "農家総所得",
        "readerLabel": "農家総所得",
        "subtitle": "調査対象の農家1戸当たりの平均"
      },
      {
        "rankingKey": "agricultural-income-ratio",
        "title": "農業所得割合",
        "readerLabel": "農業所得割合"
      },
      {
        "rankingKey": "average-propensity-to-consume-of-farm-households",
        "title": "農家世帯の平均消費性向",
        "readerLabel": "農家世帯の平均消費性向"
      }
    ]
  },
  "air-pollution-control-law-status": {
    "categoryKey": "safetyenvironment",
    "representatives": [
      {
        "rankingKey": "smoke-emission-facility-count",
        "title": "ばい煙発生施設数",
        "readerLabel": "ばい煙発生施設数"
      },
      {
        "rankingKey": "general-dust-emission-facility-count",
        "title": "一般粉じん発生施設数",
        "readerLabel": "一般粉じん発生施設数"
      }
    ]
  },
  "area-survey": {
    "categoryKey": "landweather",
    "representatives": [
      {
        "rankingKey": "area-ratio-of-total",
        "title": "面積割合",
        "readerLabel": "面積割合"
      },
      {
        "rankingKey": "habitable-area-ratio",
        "title": "可住地面積割合",
        "readerLabel": "可住地面積割合"
      },
      {
        "rankingKey": "habitable-area",
        "title": "可住地面積",
        "readerLabel": "可住地面積"
      }
    ]
  },
  "boj-statistics": {
    "categoryKey": "economy",
    "representatives": [
      {
        "rankingKey": "bank-loan-balance",
        "title": "国内銀行貸出残高",
        "readerLabel": "国内銀行貸出残高"
      },
      {
        "rankingKey": "bank-personal-deposit",
        "title": "国内銀行個人預金残高",
        "readerLabel": "国内銀行個人預金残高"
      },
      {
        "rankingKey": "domestic-bank-deposit-balance",
        "title": "国内銀行預金残高",
        "readerLabel": "国内銀行預金残高",
        "subtitle": "総額"
      }
    ]
  },
  "buried-cultural-property-statistics": {
    "categoryKey": "educationsports",
    "representatives": [
      {
        "rankingKey": "buried-cultural-property-specialist-count",
        "title": "埋蔵文化財専門職員数",
        "readerLabel": "埋蔵文化財専門職員数",
        "subtitle": "2025年5月1日・県と市町村等の合計"
      }
    ]
  },
  "care-service-facility-survey": {
    "categoryKey": "socialsecurity",
    "representatives": [
      {
        "rankingKey": "nursing-home-count-per-100k-65plus",
        "title": "老人ホーム数",
        "readerLabel": "老人ホーム数",
        "subtitle": "65歳以上人口10万人当たり"
      },
      {
        "rankingKey": "nursing-home-capacity-per-1000-65plus",
        "title": "老人ホーム定員数（65歳以上人口千人当たり）",
        "readerLabel": "老人ホーム定員数（65歳以上人口千人当たり）"
      },
      {
        "rankingKey": "nursing-home-staff-per-100k-65plus",
        "title": "老人ホーム従事者数",
        "readerLabel": "老人ホーム従事者数",
        "subtitle": "65歳以上人口10万人当たり"
      }
    ]
  },
  "census": {
    "categoryKey": "population",
    "representatives": [
      {
        "rankingKey": "unmarried-ratio-male-40-44",
        "title": "未婚者割合",
        "readerLabel": "未婚者割合",
        "subtitle": "男性 40〜44歳"
      },
      {
        "rankingKey": "single-person-household-ratio",
        "title": "単独世帯割合",
        "readerLabel": "単独世帯割合"
      },
      {
        "rankingKey": "single-person-household-old-population-ratio",
        "title": "65歳以上世帯員の単独世帯の割合",
        "readerLabel": "65歳以上世帯員の単独世帯の割合"
      }
    ]
  },
  "childcare-related-status-report": {
    "categoryKey": "socialsecurity",
    "representatives": [
      {
        "rankingKey": "nursery-waiting-children-count",
        "title": "保育所等利用待機児童数",
        "readerLabel": "保育所等利用待機児童数"
      },
      {
        "rankingKey": "childcare-applicants",
        "title": "保育所等利用申込者数",
        "readerLabel": "保育所等利用申込者数",
        "subtitle": "4月1日時点・利用中の児童を含む"
      }
    ]
  },
  "city-planning-survey": {
    "categoryKey": "landweather",
    "representatives": [
      {
        "rankingKey": "urban-planning-area",
        "title": "都市計画区域指定面積",
        "readerLabel": "都市計画区域指定面積"
      },
      {
        "rankingKey": "residential-area-ratio",
        "title": "住居専用地域面積比率",
        "readerLabel": "住居専用地域面積比率"
      },
      {
        "rankingKey": "commercial-and-neighborhood-commercial-area-ratio",
        "title": "商業・近隣商業地域面積比率",
        "readerLabel": "商業・近隣商業地域面積比率"
      }
    ]
  },
  "closed-school-facility-survey": {
    "categoryKey": "educationsports",
    "representatives": [
      {
        "rankingKey": "public-school-closures-cumulative",
        "title": "公立学校の廃校発生延べ数",
        "readerLabel": "公立学校の廃校発生延べ数",
        "subtitle": "2004〜2023年度累計"
      }
    ]
  },
  "commercial-dynamics-survey": {
    "categoryKey": "commercial",
    "representatives": [
      {
        "rankingKey": "convenience-store-count-commercial",
        "title": "コンビニエンスストア店舗数",
        "readerLabel": "コンビニエンスストア店舗数"
      },
      {
        "rankingKey": "convenience-store-sales",
        "title": "コンビニエンスストア販売額",
        "readerLabel": "コンビニエンスストア販売額",
        "subtitle": "年間販売額"
      },
      {
        "rankingKey": "convenience-store-sales-monthly",
        "title": "コンビニエンスストア販売額（都道府県別・年計）",
        "readerLabel": "コンビニの年間販売額",
        "subtitle": "月次"
      }
    ]
  },
  "commercial-statistics": {
    "categoryKey": "commercial",
    "representatives": [
      {
        "rankingKey": "book-magazine-retail-annual-sales",
        "title": "書籍・雑誌小売業年間商品販売額",
        "readerLabel": "書籍・雑誌小売業年間商品販売額",
        "subtitle": "総額"
      },
      {
        "rankingKey": "goods-inventory-wholesale-retail",
        "title": "商品手持額",
        "readerLabel": "商品手持額"
      },
      {
        "rankingKey": "retail-goods-inventory-amount",
        "title": "小売業商品手持額",
        "readerLabel": "小売業商品手持額"
      }
    ]
  },
  "comprehensive-living-conditions-survey": {
    "categoryKey": "socialsecurity",
    "representatives": [
      {
        "rankingKey": "outpatient-count",
        "title": "通院者率",
        "readerLabel": "通院者率",
        "subtitle": "社会・人口統計体系"
      },
      {
        "rankingKey": "complainant-count",
        "title": "有訴者率",
        "readerLabel": "有訴者率",
        "subtitle": "総数"
      },
      {
        "rankingKey": "k6-known-score-estimated-persons-12plus",
        "title": "K6の点数が判明している推計人数（12歳以上）",
        "readerLabel": "K6の点数が判明している推計人数（12歳以上）"
      }
    ]
  },
  "construction-orders-statistics": {
    "categoryKey": "construction",
    "representatives": [
      {
        "rankingKey": "public-construction-contract-amount",
        "title": "公共工事の請負契約額",
        "readerLabel": "公共工事の請負契約額",
        "subtitle": "施工都道府県別・1件500万円以上"
      },
      {
        "rankingKey": "public-construction-contract-count",
        "title": "公共工事の請負契約件数",
        "readerLabel": "公共工事の請負契約件数",
        "subtitle": "施工都道府県別・1件500万円以上"
      }
    ]
  },
  "construction-work-statistics": {
    "categoryKey": "construction",
    "representatives": [
      {
        "rankingKey": "construction-industry-count",
        "title": "建設業者数",
        "readerLabel": "建設業者数"
      },
      {
        "rankingKey": "prime-contractor-completed-construction",
        "title": "元請完成工事高",
        "readerLabel": "元請完成工事高",
        "subtitle": "総額"
      },
      {
        "rankingKey": "prime-contractor-completed-construction-public",
        "title": "元請完成工事高",
        "readerLabel": "元請完成工事高",
        "subtitle": "公共工事"
      }
    ]
  },
  "cpi-annual": {
    "categoryKey": "economy",
    "representatives": [
      {
        "rankingKey": "cpi-change-rate-total",
        "title": "消費者物価指数変化率",
        "readerLabel": "消費者物価指数変化率",
        "subtitle": "総合"
      },
      {
        "rankingKey": "cpi-change-rate-food",
        "title": "消費者物価指数変化率",
        "readerLabel": "消費者物価指数変化率",
        "subtitle": "食料"
      },
      {
        "rankingKey": "cpi-change-rate-utilities",
        "title": "消費者物価指数変化率",
        "readerLabel": "消費者物価指数変化率",
        "subtitle": "光熱・水道"
      }
    ]
  },
  "crop-statistics": {
    "categoryKey": "agriculture",
    "representatives": [
      {
        "rankingKey": "rice-cultivated-area",
        "title": "水稲作付面積",
        "readerLabel": "水稲作付面積",
        "subtitle": "水稲（子実用）の作付面積"
      },
      {
        "rankingKey": "rice-harvest-volume",
        "title": "水稲収穫量",
        "readerLabel": "水稲収穫量",
        "subtitle": "水稲（子実用）の収穫量"
      },
      {
        "rankingKey": "rice-yield-per-10a",
        "title": "水稲10a当たり収量",
        "readerLabel": "水稲10a当たり収量",
        "subtitle": "水稲の10aあたり収穫量"
      }
    ]
  },
  "economic-census-activity": {
    "categoryKey": "commercial",
    "representatives": [
      {
        "rankingKey": "annual-sales-amount",
        "title": "商業年間商品販売額",
        "readerLabel": "商業年間商品販売額",
        "subtitle": "総額"
      },
      {
        "rankingKey": "manufacturing-employees",
        "title": "製造業従業者数",
        "readerLabel": "製造業従業者数"
      },
      {
        "rankingKey": "convenience-store-count-per-100k",
        "title": "コンビニエンスストア数",
        "readerLabel": "コンビニエンスストア数",
        "subtitle": "人口10万人当たり"
      }
    ]
  },
  "economic-census-basic": {
    "categoryKey": "commercial",
    "representatives": [
      {
        "rankingKey": "number-of-establishments-economic-census-basic-survey",
        "title": "事業所数",
        "readerLabel": "事業所数",
        "subtitle": "経済センサス基礎調査"
      },
      {
        "rankingKey": "number-of-establishments-manufacturing",
        "title": "事業所数",
        "readerLabel": "事業所数",
        "subtitle": "製造業"
      },
      {
        "rankingKey": "number-of-establishments-information-communication",
        "title": "事業所数",
        "readerLabel": "事業所数",
        "subtitle": "情報通信業"
      }
    ]
  },
  "economic-structure-survey": {
    "categoryKey": "miningindustry",
    "representatives": [
      {
        "rankingKey": "manufacturing-shipment-amount",
        "title": "製造品出荷額等",
        "readerLabel": "製造品出荷額等",
        "subtitle": "総額"
      },
      {
        "rankingKey": "manufacturing-industry-added-value",
        "title": "製造業付加価値額",
        "readerLabel": "製造業付加価値額"
      },
      {
        "rankingKey": "annual-sales-amount",
        "title": "商業年間商品販売額",
        "readerLabel": "商業年間商品販売額",
        "subtitle": "総額"
      }
    ]
  },
  "electricity-business-statistics": {
    "categoryKey": "energy",
    "representatives": [
      {
        "rankingKey": "electricity-demand",
        "title": "電力需要量",
        "readerLabel": "電力需要量"
      },
      {
        "rankingKey": "electricity-generation-capacity",
        "title": "発電電力量",
        "readerLabel": "発電電力量"
      }
    ]
  },
  "employment-insurance-annual-report": {
    "categoryKey": "socialsecurity",
    "representatives": [
      {
        "rankingKey": "employment-insurance-basic-benefit-average",
        "title": "雇用保険基本手当平均支給額",
        "readerLabel": "雇用保険基本手当平均支給額",
        "subtitle": "月次平均"
      },
      {
        "rankingKey": "employment-insurance-daily-receipt-rate",
        "title": "雇用保険（日雇）受給率",
        "readerLabel": "雇用保険（日雇）受給率",
        "subtitle": "日雇受給実績"
      },
      {
        "rankingKey": "employment-insurance-receipt-rate",
        "title": "雇用保険受給率",
        "readerLabel": "雇用保険受給率",
        "subtitle": "受給実績"
      }
    ]
  },
  "employment-structure-survey": {
    "categoryKey": "laborwage",
    "representatives": [
      {
        "rankingKey": "job-change-rate",
        "title": "転職率",
        "readerLabel": "転職率"
      },
      {
        "rankingKey": "side-job-rate",
        "title": "副業率",
        "readerLabel": "副業率",
        "subtitle": "有業者のうち副業がある人の割合"
      },
      {
        "rankingKey": "telework-rate",
        "title": "テレワーク実施率",
        "readerLabel": "テレワーク実施率",
        "subtitle": "有業者のうちテレワークを実施した人の割合"
      }
    ]
  },
  "employment-trends-survey": {
    "categoryKey": "laborwage",
    "representatives": [
      {
        "rankingKey": "new-hire-count",
        "title": "入職者数",
        "readerLabel": "入職者数"
      }
    ]
  },
  "establishment-enterprise-census": {
    "categoryKey": "commercial",
    "representatives": [
      {
        "rankingKey": "number-of-establishments-establishment-corporate-statistics",
        "title": "事業所数",
        "readerLabel": "事業所数",
        "subtitle": "事業所・企業統計調査"
      },
      {
        "rankingKey": "restaurant-count-per-1000",
        "title": "飲食店数",
        "readerLabel": "飲食店数",
        "subtitle": "人口千人当たり"
      },
      {
        "rankingKey": "tertiary-industry-establishment-ratio-census",
        "title": "第3次産業事業所数構成比",
        "readerLabel": "第3次産業事業所数構成比",
        "subtitle": "経済センサス"
      }
    ]
  },
  "factory-location-survey": {
    "categoryKey": "construction",
    "representatives": [
      {
        "rankingKey": "factory-establishment-count",
        "title": "工場立地件数",
        "readerLabel": "工場立地件数",
        "subtitle": "年間の新規工場立地件数"
      },
      {
        "rankingKey": "factory-industrial-park-rate",
        "title": "工業団地内立地率（都道府県別）",
        "readerLabel": "工業団地内立地率"
      },
      {
        "rankingKey": "factory-location-area-annual",
        "title": "工場立地敷地面積（都道府県別・年次）",
        "readerLabel": "工場立地敷地面積（都道府県別・年次）"
      }
    ]
  },
  "farmland-transfer-conversion-report": {
    "categoryKey": "landweather",
    "representatives": [
      {
        "rankingKey": "agricultural-land-conversion-area",
        "title": "農地の転用面積",
        "readerLabel": "農地の転用面積"
      }
    ]
  },
  "financial-literacy-survey": {
    "categoryKey": "economy",
    "representatives": [
      {
        "rankingKey": "financial-literacy-correct-rate",
        "title": "金融リテラシー調査 正誤問題の正答率",
        "readerLabel": "金融リテラシー調査正誤問題の正答率",
        "subtitle": "25問・18〜79歳"
      }
    ]
  },
  "fire-annual-report": {
    "categoryKey": "safetyenvironment",
    "representatives": [
      {
        "rankingKey": "building-fire-count-per-100-thousand-people",
        "title": "火災出火件数",
        "readerLabel": "火災出火件数",
        "subtitle": "人口10万人当たり"
      },
      {
        "rankingKey": "building-fire-damage-amount-per-building-fire",
        "title": "建物火災損害額",
        "readerLabel": "建物火災損害額",
        "subtitle": "建物火災1件当たり"
      },
      {
        "rankingKey": "fire-deaths-per-100k",
        "title": "火災死亡者数",
        "readerLabel": "火災死亡者数"
      }
    ]
  },
  "fishery-aquaculture-production": {
    "categoryKey": "agriculture",
    "representatives": [
      {
        "rankingKey": "fish-catch",
        "title": "漁獲量",
        "readerLabel": "漁獲量"
      },
      {
        "rankingKey": "aquaculture-harvest",
        "title": "養殖収獲量",
        "readerLabel": "養殖収獲量"
      },
      {
        "rankingKey": "fishery-output-value",
        "title": "漁業産出額",
        "readerLabel": "漁業産出額"
      }
    ]
  },
  "fishery-census": {
    "categoryKey": "agriculture",
    "representatives": [
      {
        "rankingKey": "fishery-workers",
        "title": "漁業就業者数",
        "readerLabel": "漁業就業者数"
      },
      {
        "rankingKey": "fishing-port-count-by-type",
        "title": "漁港数（漁港種類計）",
        "readerLabel": "漁港数（漁港種類計）",
        "subtitle": "種類別"
      },
      {
        "rankingKey": "number-of-individual-fishery-management",
        "title": "個人漁業経営体系数",
        "readerLabel": "個人漁業経営体系数"
      }
    ]
  },
  "fixed-asset-tax-land-statistics": {
    "categoryKey": "administrativefinancial",
    "representatives": [
      {
        "rankingKey": "total-assessed-land-area",
        "title": "評価総地積",
        "readerLabel": "評価総地積",
        "subtitle": "課税対象土地"
      },
      {
        "rankingKey": "total-assessed-land-area-ratio",
        "title": "評価総地積割合",
        "readerLabel": "評価総地積割合",
        "subtitle": "課税対象土地"
      },
      {
        "rankingKey": "total-assessed-land-area-ratio-field",
        "title": "評価総地積割合",
        "readerLabel": "評価総地積割合",
        "subtitle": "畑"
      }
    ]
  },
  "flood-statistics": {
    "categoryKey": "safetyenvironment",
    "representatives": [
      {
        "rankingKey": "flood-damage-total",
        "title": "水害被害額合計",
        "readerLabel": "水害被害額合計"
      },
      {
        "rankingKey": "flood-deaths",
        "title": "水害死者数",
        "readerLabel": "水害死者数"
      },
      {
        "rankingKey": "flood-damage-general-assets",
        "title": "水害一般資産等被害額",
        "readerLabel": "水害一般資産等被害額"
      }
    ]
  },
  "foreign-residents-statistics": {
    "categoryKey": "international",
    "representatives": [
      {
        "rankingKey": "resident-foreigner-population",
        "title": "在留外国人数",
        "readerLabel": "在留外国人数",
        "subtitle": "総数"
      },
      {
        "rankingKey": "resident-foreigner-china",
        "title": "在留外国人数（中国）",
        "readerLabel": "在留外国人数（中国）",
        "subtitle": "中国出身"
      },
      {
        "rankingKey": "resident-foreigner-asia",
        "title": "在留外国人数（アジア）",
        "readerLabel": "在留外国人数（アジア）",
        "subtitle": "アジア出身"
      }
    ]
  },
  "forestry-output-statistics": {
    "categoryKey": "agriculture",
    "representatives": [
      {
        "rankingKey": "forestry-mushroom-output-value",
        "title": "栽培きのこ類産出額",
        "readerLabel": "栽培きのこ類産出額"
      },
      {
        "rankingKey": "forestry-output-value",
        "title": "林業産出額",
        "readerLabel": "林業産出額"
      },
      {
        "rankingKey": "forestry-timber-output-value",
        "title": "木材生産産出額",
        "readerLabel": "木材生産産出額"
      }
    ]
  },
  "forestry-statistics-handbook": {
    "categoryKey": "infrastructure",
    "representatives": [
      {
        "rankingKey": "forest-road-length",
        "title": "林道延長",
        "readerLabel": "林道延長"
      },
      {
        "rankingKey": "artificial-forest-area",
        "title": "人工造林面積",
        "readerLabel": "人工造林面積"
      }
    ]
  },
  "freight-regional-flow-survey": {
    "categoryKey": "tourism",
    "representatives": [
      {
        "rankingKey": "jr-freight-shipment",
        "title": "ＪＲ貨物発送量",
        "readerLabel": "ＪＲ貨物発送量"
      },
      {
        "rankingKey": "air-cargo-transport",
        "title": "航空貨物輸送量",
        "readerLabel": "航空貨物輸送量"
      }
    ]
  },
  "gas-business-statistics": {
    "categoryKey": "energy",
    "representatives": [
      {
        "rankingKey": "city-gas-supply-area-household-ratio",
        "title": "都市ガス供給区域内世帯比率",
        "readerLabel": "都市ガス供給区域内世帯比率"
      },
      {
        "rankingKey": "city-gas-supply-area-households",
        "title": "都市ガス供給区域内世帯数",
        "readerLabel": "都市ガス供給区域内世帯数"
      },
      {
        "rankingKey": "city-gas-meter-count",
        "title": "都市ガスメーター取付数",
        "readerLabel": "都市ガスメーター取付数"
      }
    ]
  },
  "health-admin-report": {
    "categoryKey": "socialsecurity",
    "representatives": [
      {
        "rankingKey": "nurses-per-100k-population",
        "title": "人口10万対看護師数",
        "readerLabel": "人口10万対看護師数"
      },
      {
        "rankingKey": "pharmacy-count-per-100k",
        "title": "人口10万人あたり薬局数",
        "readerLabel": "人口10万人あたり薬局数"
      },
      {
        "rankingKey": "abortion-rate",
        "title": "人工妊娠中絶実施率",
        "readerLabel": "人工妊娠中絶実施率"
      }
    ]
  },
  "health-insurance-annual-report": {
    "categoryKey": "socialsecurity",
    "representatives": [
      {
        "rankingKey": "govt-health-insurance-visit-expense-dependents-per-person",
        "title": "政府管掌健康保険受診金額",
        "readerLabel": "政府管掌健康保険受診金額",
        "subtitle": "被扶養者1人当たり"
      },
      {
        "rankingKey": "govt-health-insurance-visit-expense-insured-per-person",
        "title": "政府管掌健康保険受診金額",
        "readerLabel": "政府管掌健康保険受診金額",
        "subtitle": "被保険者1人当たり"
      }
    ]
  },
  "health-insurance-society-annual-report": {
    "categoryKey": "socialsecurity",
    "representatives": [
      {
        "rankingKey": "japan-health-insurance-society-medical-expense-insured-per-person",
        "title": "全国保険協会管掌健康保険医療費",
        "readerLabel": "全国保険協会管掌健康保険医療費",
        "subtitle": "被保険者1人当たり"
      },
      {
        "rankingKey": "japan-health-insurance-society-visit-rate-dependents-per-1000",
        "title": "全国保険協会管掌健康保険受診率",
        "readerLabel": "全国保険協会管掌健康保険受診率",
        "subtitle": "被扶養者千人当たり"
      },
      {
        "rankingKey": "japan-health-insurance-society-visit-rate-insured-per-1000",
        "title": "全国保険協会管掌健康保険受診率",
        "readerLabel": "全国保険協会管掌健康保険受診率",
        "subtitle": "被保険者千人当たり"
      }
    ]
  },
  "hospital-report": {
    "categoryKey": "socialsecurity",
    "representatives": [
      {
        "rankingKey": "hospital-bed-count",
        "title": "病院病床数",
        "readerLabel": "病院病床数",
        "subtitle": "6月末現在・全病床"
      },
      {
        "rankingKey": "bed-utilization-rate",
        "title": "病床利用率",
        "readerLabel": "病床利用率",
        "subtitle": "病院の全病床の利用率"
      },
      {
        "rankingKey": "average-length-of-stay",
        "title": "平均在院日数",
        "readerLabel": "平均在院日数",
        "subtitle": "病院の入院患者の平均在院日数"
      }
    ]
  },
  "housing-finance-user-survey": {
    "categoryKey": "construction",
    "representatives": [
      {
        "rankingKey": "housing-site-value-per-3-3m2",
        "title": "住宅敷地価額",
        "readerLabel": "住宅敷地価額",
        "subtitle": "公庫貸付分、3.3m2当たり"
      }
    ]
  },
  "housing-land-survey": {
    "categoryKey": "construction",
    "representatives": [
      {
        "rankingKey": "owner-occupied-housing-ratio",
        "title": "持ち家比率",
        "readerLabel": "持ち家比率"
      },
      {
        "rankingKey": "vacant-housing-rate",
        "title": "空き家率",
        "readerLabel": "空き家率",
        "subtitle": "総住宅数に占める空き家の割合"
      },
      {
        "rankingKey": "floor-area-per-dwelling-owner",
        "title": "持ち家住宅の延べ面積",
        "readerLabel": "持ち家住宅の延べ面積",
        "subtitle": "1住宅当たり"
      }
    ]
  },
  "housing-starts-statistics": {
    "categoryKey": "construction",
    "representatives": [
      {
        "rankingKey": "new-housing-starts",
        "title": "着工新設住宅戸数",
        "readerLabel": "着工新設住宅戸数"
      },
      {
        "rankingKey": "new-owner-occupied-starts",
        "title": "着工新設持家数",
        "readerLabel": "着工新設持家数"
      },
      {
        "rankingKey": "new-rental-starts",
        "title": "着工新設貸家数",
        "readerLabel": "着工新設貸家数"
      }
    ]
  },
  "inbound-consumption-survey": {
    "categoryKey": "tourism",
    "representatives": [
      {
        "rankingKey": "inbound-visitors-by-destination",
        "title": "訪日外国人の都道府県別訪問者数",
        "readerLabel": "訪日外国人の都道府県別訪問者数",
        "subtitle": "2025年・全目的・一般客"
      },
      {
        "rankingKey": "inbound-travel-consumption-by-destination",
        "title": "訪日外国人旅行者の県内消費額",
        "readerLabel": "訪日外国人旅行者の県内消費額",
        "subtitle": "全目的・宿泊と日帰り"
      },
      {
        "rankingKey": "inbound-visit-sample-by-destination",
        "title": "訪日外国人の県別訪問回答数",
        "readerLabel": "訪日外国人の県別訪問回答数",
        "subtitle": "2025年・全目的・一般客"
      }
    ]
  },
  "industrial-statistics": {
    "categoryKey": "energy",
    "representatives": [
      {
        "rankingKey": "industrial-water-usage",
        "title": "工業用水量",
        "readerLabel": "工業用水量"
      }
    ]
  },
  "insurance-rate-org-statistics": {
    "categoryKey": "safetyenvironment",
    "representatives": [
      {
        "rankingKey": "auto-liability-insurance-amount-received-per-payment",
        "title": "自動車損害賠償責任保険受取保険金額",
        "readerLabel": "自動車損害賠償責任保険受取保険金額",
        "subtitle": "支払件数1件当たり"
      },
      {
        "rankingKey": "fire-insurance-amount-received-per-contract",
        "title": "火災保険受取保険金額",
        "readerLabel": "火災保険受取保険金額",
        "subtitle": "保有契約1件当たり"
      },
      {
        "rankingKey": "private-auto-insurance-penetration-rate-person",
        "title": "任意自動車保険普及率",
        "readerLabel": "任意自動車保険普及率",
        "subtitle": "対人賠償"
      }
    ]
  },
  "japan-post-statistics": {
    "categoryKey": "economy",
    "representatives": [
      {
        "rankingKey": "post-office-count",
        "title": "郵便局数",
        "readerLabel": "郵便局数",
        "subtitle": "総数"
      },
      {
        "rankingKey": "mail-items-handled",
        "title": "郵便物引受数",
        "readerLabel": "郵便物引受数"
      },
      {
        "rankingKey": "postal-savings-balance",
        "title": "郵便貯金残高",
        "readerLabel": "郵便貯金残高",
        "subtitle": "総額"
      }
    ]
  },
  "job-placement-statistics": {
    "categoryKey": "laborwage",
    "representatives": [
      {
        "rankingKey": "active-job-opening-ratio",
        "title": "有効求人倍率",
        "readerLabel": "有効求人倍率"
      },
      {
        "rankingKey": "employment-rate",
        "title": "就職率",
        "readerLabel": "就職率"
      },
      {
        "rankingKey": "fulfillment-rate",
        "title": "充足率",
        "readerLabel": "充足率"
      }
    ]
  },
  "junior-high-athletics-membership-survey": {
    "categoryKey": "educationsports",
    "representatives": [
      {
        "rankingKey": "junior-high-club-per100-soft-tennis",
        "title": "中学部活動 100人あたり部員数",
        "readerLabel": "中学部活動100人あたり部員数",
        "subtitle": "ソフトテニス部"
      },
      {
        "rankingKey": "junior-high-club-per100-badminton",
        "title": "中学部活動 100人あたり部員数",
        "readerLabel": "中学部活動100人あたり部員数",
        "subtitle": "バドミントン部"
      },
      {
        "rankingKey": "junior-high-club-per100-track-and-field",
        "title": "中学部活動 100人あたり部員数",
        "readerLabel": "中学部活動100人あたり部員数",
        "subtitle": "陸上競技部"
      }
    ]
  },
  "kakei-chousa": {
    "categoryKey": "economy",
    "representatives": [
      {
        "rankingKey": "natto-consumption-expenditure",
        "title": "納豆消費支出額",
        "readerLabel": "納豆への支出"
      },
      {
        "rankingKey": "rice-consumption-quantity",
        "title": "米消費量",
        "readerLabel": "米消費量"
      },
      {
        "rankingKey": "green-tea-consumption-quantity",
        "title": "緑茶消費量",
        "readerLabel": "緑茶消費量"
      }
    ]
  },
  "labor-market-annual": {
    "categoryKey": "laborwage",
    "representatives": [
      {
        "rankingKey": "active-job-opening-ratio",
        "title": "有効求人倍率",
        "readerLabel": "有効求人倍率"
      },
      {
        "rankingKey": "fulfillment-rate",
        "title": "充足率",
        "readerLabel": "充足率"
      },
      {
        "rankingKey": "employment-rate",
        "title": "就職率",
        "readerLabel": "就職率"
      }
    ]
  },
  "late-elderly-medical-annual-report": {
    "categoryKey": "socialsecurity",
    "representatives": [
      {
        "rankingKey": "late-elderly-medical-expense-per-insured",
        "title": "後期高齢者医療費",
        "readerLabel": "後期高齢者医療費",
        "subtitle": "被保険者1人当たり"
      }
    ]
  },
  "life-insurance-business-statistics": {
    "categoryKey": "economy",
    "representatives": [
      {
        "rankingKey": "private-life-insurance-contracts",
        "title": "民間生命保険保有契約件数",
        "readerLabel": "民間生命保険保有契約件数",
        "subtitle": "総数"
      },
      {
        "rankingKey": "private-life-insurance-amount-per-contract",
        "title": "民間生命保険保険金額",
        "readerLabel": "民間生命保険保険金額",
        "subtitle": "1契約当たり"
      }
    ]
  },
  "life-tables": {
    "categoryKey": "socialsecurity",
    "representatives": [
      {
        "rankingKey": "life-expectancy-0-female",
        "title": "平均余命",
        "readerLabel": "平均余命",
        "subtitle": "女性 0歳時点（平均寿命）"
      },
      {
        "rankingKey": "life-expectancy-0-male",
        "title": "平均余命",
        "readerLabel": "平均余命",
        "subtitle": "男性 0歳時点（平均寿命）"
      },
      {
        "rankingKey": "life-expectancy-65-male",
        "title": "平均余命",
        "readerLabel": "平均余命",
        "subtitle": "男性 65歳時点"
      }
    ]
  },
  "livestock-statistics": {
    "categoryKey": "agriculture",
    "representatives": [
      {
        "rankingKey": "dairy-cattle-count",
        "title": "乳用牛飼養頭数",
        "readerLabel": "乳用牛飼養頭数",
        "subtitle": "乳用牛（めす）の飼養頭数合計"
      },
      {
        "rankingKey": "beef-cattle-count",
        "title": "肉用牛飼養頭数",
        "readerLabel": "肉用牛飼養頭数",
        "subtitle": "肉用目的の牛の合計・肉用種と乳用種を含む"
      },
      {
        "rankingKey": "pig-count",
        "title": "豚飼養頭数",
        "readerLabel": "豚飼養頭数",
        "subtitle": "子取り用めす・種おす・肥育豚等の合計"
      }
    ]
  },
  "local-consumer-administration-status-survey": {
    "categoryKey": "safetyenvironment",
    "representatives": [
      {
        "rankingKey": "consumer-consultation-accepted-cases",
        "title": "消費生活相談受付件数",
        "readerLabel": "消費生活相談受付件数"
      }
    ]
  },
  "local-cultural-administration-survey": {
    "categoryKey": "educationsports",
    "representatives": [
      {
        "rankingKey": "prefectural-cultural-property-protection-expenditure",
        "title": "都道府県の文化財保護経費",
        "readerLabel": "都道府県の文化財保護経費",
        "subtitle": "2024年度決算・国庫財源込み"
      }
    ]
  },
  "local-education-expense-survey": {
    "categoryKey": "educationsports",
    "representatives": [
      {
        "rankingKey": "elementary-school-education-cost-per-student",
        "title": "小学校教育費",
        "readerLabel": "小学校教育費",
        "subtitle": "児童1人当たり"
      },
      {
        "rankingKey": "junior-high-school-education-cost-per-student",
        "title": "中学校教育費",
        "readerLabel": "中学校教育費",
        "subtitle": "生徒1人当たり"
      },
      {
        "rankingKey": "high-school-education-cost-fulltime-per-student",
        "title": "高等学校教育費",
        "readerLabel": "高等学校教育費",
        "subtitle": "生徒1人当たり"
      }
    ]
  },
  "local-election-results": {
    "categoryKey": "administrativefinancial",
    "representatives": [
      {
        "rankingKey": "voter-turnout-governor",
        "title": "都道府県知事選挙投票率",
        "readerLabel": "都道府県知事選挙投票率"
      },
      {
        "rankingKey": "voter-turnout-mayor",
        "title": "市区町村長選挙投票率",
        "readerLabel": "市区町村長選挙投票率"
      },
      {
        "rankingKey": "voter-turnout-pref-assembly",
        "title": "都道府県議会議員選挙投票率",
        "readerLabel": "都道府県議会議員選挙投票率"
      }
    ]
  },
  "local-election-statistics": {
    "categoryKey": "administrativefinancial",
    "representatives": [
      {
        "rankingKey": "city-ward-assembly-members",
        "title": "市区議会議員数",
        "readerLabel": "市区議会議員数"
      },
      {
        "rankingKey": "prefectural-assembly-members",
        "title": "都道府県議会議員数",
        "readerLabel": "都道府県議会議員数"
      }
    ]
  },
  "local-finance": {
    "categoryKey": "administrativefinancial",
    "representatives": [
      {
        "rankingKey": "fiscal-strength-index-prefecture",
        "title": "財政力指数",
        "readerLabel": "自治体の財政力",
        "subtitle": "都道府県財政"
      },
      {
        "rankingKey": "current-balance-ratio",
        "title": "経常収支比率",
        "readerLabel": "経常収支比率",
        "subtitle": "都道府県財政"
      },
      {
        "rankingKey": "real-public-debt-service-ratio",
        "title": "実質公債費比率",
        "readerLabel": "実質公債費比率",
        "subtitle": "都道府県財政"
      }
    ]
  },
  "local-gov-staffing-survey": {
    "categoryKey": "administrativefinancial",
    "representatives": [
      {
        "rankingKey": "prefectural-general-administration-staff",
        "title": "一般行政部門職員数",
        "readerLabel": "一般行政部門職員数",
        "subtitle": "都道府県"
      },
      {
        "rankingKey": "municipal-general-administration-staff",
        "title": "一般行政部門職員数",
        "readerLabel": "一般行政部門職員数",
        "subtitle": "市町村"
      },
      {
        "rankingKey": "education-department-staff",
        "title": "教育部門職員数",
        "readerLabel": "教育部門職員数"
      }
    ]
  },
  "local-government-gender-equality-policy-status": {
    "categoryKey": "administrativefinancial",
    "representatives": [
      {
        "rankingKey": "prefectural-manager-female-share",
        "title": "都道府県の管理職に占める女性の割合",
        "readerLabel": "都道府県の管理職に占める女性の割合"
      },
      {
        "rankingKey": "prefectural-assembly-female-share",
        "title": "都道府県議会議員に占める女性の割合",
        "readerLabel": "都道府県議会議員に占める女性の割合"
      }
    ]
  },
  "local-public-employee-salary": {
    "categoryKey": "administrativefinancial",
    "representatives": [
      {
        "rankingKey": "avg-salary-all-prefecture",
        "title": "全職種 平均給与月額",
        "readerLabel": "全職種平均給与月額"
      },
      {
        "rankingKey": "avg-salary-admin-prefecture",
        "title": "一般行政職 平均給与月額",
        "readerLabel": "一般行政職平均給与月額"
      },
      {
        "rankingKey": "bonus-admin-prefecture",
        "title": "一般行政職 期末・勤勉手当（ボーナス）",
        "readerLabel": "一般行政職期末・勤勉手当（ボーナス）"
      }
    ]
  },
  "local-public-enterprise-accounts-survey": {
    "categoryKey": "infrastructure",
    "representatives": [
      {
        "rankingKey": "public-water-pipe-aging-rate",
        "title": "水道管路の経年化率",
        "readerLabel": "水道管路の経年化率",
        "subtitle": "地方公営企業・法適用水道（上水道・簡易水道・用水供給）"
      },
      {
        "rankingKey": "public-water-pipe-length",
        "title": "水道管路の総延長",
        "readerLabel": "水道管路の総延長",
        "subtitle": "地方公営企業・法適用水道（上水道・簡易水道・用水供給）"
      },
      {
        "rankingKey": "public-water-pipe-renewal-rate",
        "title": "水道管路の更新率",
        "readerLabel": "水道管路の更新率",
        "subtitle": "地方公営企業・法適用水道（上水道・簡易水道・用水供給）"
      }
    ]
  },
  "local-tax": {
    "categoryKey": "tourism",
    "representatives": [
      {
        "rankingKey": "per-taxpayer-taxable-income",
        "title": "課税対象所得",
        "readerLabel": "課税対象所得",
        "subtitle": "所得割の納税義務者1人当たり"
      },
      {
        "rankingKey": "taxpayer-ratio-per-pref-resident",
        "title": "納税義務者割合",
        "readerLabel": "納税義務者割合",
        "subtitle": "人口100人当たり"
      },
      {
        "rankingKey": "taxpayer-count-income",
        "title": "納税義務者数",
        "readerLabel": "納税義務者数",
        "subtitle": "所得割"
      }
    ]
  },
  "long-term-care-insurance-annual-report": {
    "categoryKey": "socialsecurity",
    "representatives": [
      {
        "rankingKey": "nursing-care-insurance-benefit",
        "title": "介護保険給付費用額",
        "readerLabel": "介護保険給付費用額"
      },
      {
        "rankingKey": "long-term-care-certified-persons",
        "title": "要支援・要介護認定者数",
        "readerLabel": "要支援・要介護認定者数"
      }
    ]
  },
  "medical-facility-survey": {
    "categoryKey": "socialsecurity",
    "representatives": [
      {
        "rankingKey": "general-hospital-avg-length-of-stay",
        "title": "一般病院平均在院日数",
        "readerLabel": "一般病院平均在院日数"
      },
      {
        "rankingKey": "general-hospital-bed-occupancy-rate",
        "title": "一般病院病床利用率",
        "readerLabel": "一般病院病床利用率"
      },
      {
        "rankingKey": "general-hospital-count",
        "title": "一般病院数",
        "readerLabel": "一般病院数",
        "subtitle": "総数"
      }
    ]
  },
  "milk-dairy-statistics": {
    "categoryKey": "agriculture",
    "representatives": [
      {
        "rankingKey": "raw-milk-production",
        "title": "生乳生産量",
        "readerLabel": "生乳生産量",
        "subtitle": "年間の生乳生産量（出荷・未出荷を含む）"
      }
    ]
  },
  "minimum-wage": {
    "categoryKey": "laborwage",
    "representatives": [
      {
        "rankingKey": "minimum-wage-by-region",
        "title": "地域別最低賃金",
        "readerLabel": "地域別最低賃金"
      }
    ]
  },
  "mlit-ksj": {
    "categoryKey": "infrastructure",
    "representatives": [
      {
        "rankingKey": "railway-station-count",
        "title": "鉄道駅数",
        "readerLabel": "鉄道駅数"
      },
      {
        "rankingKey": "railway-passengers",
        "title": "鉄道駅 乗降客数",
        "readerLabel": "鉄道駅乗降客数"
      },
      {
        "rankingKey": "airport-count",
        "title": "空港数",
        "readerLabel": "空港数"
      }
    ]
  },
  "motor-vehicle-transport-statistics": {
    "categoryKey": "tourism",
    "representatives": [
      {
        "rankingKey": "bus-operators",
        "title": "バス事業者",
        "readerLabel": "バス事業者"
      },
      {
        "rankingKey": "hire-taxi-operators",
        "title": "ハイヤー・タクシー事業者",
        "readerLabel": "ハイヤー・タクシー事業者"
      }
    ]
  },
  "municipal-settlement-survey": {
    "categoryKey": "administrativefinancial",
    "representatives": [
      {
        "rankingKey": "per-capita-inhabitant-tax-pref-municipal",
        "title": "住民税",
        "readerLabel": "住民税",
        "subtitle": "都道府県・市町村財政合計・人口1人当たり"
      },
      {
        "rankingKey": "per-child-public-elementary-school-expenditure-pref-municipal",
        "title": "公立小学校費",
        "readerLabel": "公立小学校費",
        "subtitle": "都道府県・市町村財政合計"
      },
      {
        "rankingKey": "per-capita-fixed-asset-tax-pref-municipal",
        "title": "固定資産税",
        "readerLabel": "固定資産税",
        "subtitle": "都道府県・市町村財政合計・人口1人当たり"
      }
    ]
  },
  "national-cancer-registry": {
    "categoryKey": "socialsecurity",
    "representatives": [
      {
        "rankingKey": "new-cancer-incidence-count",
        "title": "新たに診断されたがんの罹患数",
        "readerLabel": "新たに診断されたがんの罹患数"
      }
    ]
  },
  "national-child-fitness-survey": {
    "categoryKey": "educationsports",
    "representatives": [
      {
        "rankingKey": "elementary5-weekly-exercise-420min-rate-female",
        "title": "小学5年女子の週420分以上運動割合",
        "readerLabel": "小学5年女子の週420分以上運動割合",
        "subtitle": "公立・体育授業を除く・有効回答者"
      },
      {
        "rankingKey": "elementary5-fitness-score-male",
        "title": "小学5年男子の体力合計点",
        "readerLabel": "小学5年男子の体力合計点",
        "subtitle": "公立・指定都市込み・有効標本の平均"
      },
      {
        "rankingKey": "elementary5-weekly-exercise-420min-rate-male",
        "title": "小学5年男子の週420分以上運動割合",
        "readerLabel": "小学5年男子の週420分以上運動割合",
        "subtitle": "公立・体育授業を除く・有効回答者"
      }
    ]
  },
  "national-election-results": {
    "categoryKey": "administrativefinancial",
    "representatives": [
      {
        "rankingKey": "voter-turnout-council-district",
        "title": "参議院議員選挙投票率（選挙区）",
        "readerLabel": "参議院議員選挙投票率（選挙区）",
        "subtitle": "選挙区制"
      },
      {
        "rankingKey": "voter-turnout-house-proportional",
        "title": "衆議院議員選挙投票率（比例代表）",
        "readerLabel": "衆議院議員選挙投票率（比例代表）",
        "subtitle": "比例代表制"
      },
      {
        "rankingKey": "voter-turnout-council-proportional",
        "title": "参議院議員選挙投票率（比例代表）",
        "readerLabel": "参議院議員選挙投票率（比例代表）",
        "subtitle": "比例代表制"
      }
    ]
  },
  "national-health-insurance-annual-report": {
    "categoryKey": "socialsecurity",
    "representatives": [
      {
        "rankingKey": "national-health-insurance-enrollees-per-1000",
        "title": "国民健康保険被保険者数",
        "readerLabel": "国民健康保険被保険者数",
        "subtitle": "人口千人当たり"
      },
      {
        "rankingKey": "national-health-insurance-medical-expense-per-person",
        "title": "国民健康保険診療費",
        "readerLabel": "国民健康保険診療費",
        "subtitle": "被保険者1人当たり"
      },
      {
        "rankingKey": "national-health-insurance-visit-rate-per-1000",
        "title": "国民健康保険受診率",
        "readerLabel": "国民健康保険受診率",
        "subtitle": "被保険者千人当たり"
      }
    ]
  },
  "national-health-nutrition-survey": {
    "categoryKey": "socialsecurity",
    "representatives": [
      {
        "rankingKey": "salt-intake-female-age-adjusted",
        "title": "女性の食塩摂取量（年齢調整値）",
        "readerLabel": "女性の食塩摂取量（年齢調整値）"
      },
      {
        "rankingKey": "vegetable-intake-female-age-adjusted",
        "title": "女性の野菜摂取量（年齢調整値）",
        "readerLabel": "女性の野菜摂取量（年齢調整値）"
      },
      {
        "rankingKey": "vegetable-intake-male-age-adjusted",
        "title": "男性の野菜摂取量（年齢調整値）",
        "readerLabel": "男性の野菜摂取量（年齢調整値）"
      }
    ]
  },
  "national-household-survey": {
    "categoryKey": "economy",
    "representatives": [
      {
        "rankingKey": "annual-income-per-household",
        "title": "年間収入",
        "readerLabel": "年間収入",
        "subtitle": "1世帯当たり"
      },
      {
        "rankingKey": "current-savings-balance-multi-person-households",
        "title": "貯蓄現在高",
        "readerLabel": "貯蓄現在高",
        "subtitle": "1世帯当たり・複数人世帯"
      },
      {
        "rankingKey": "financial-debt-balance",
        "title": "金融負債残高",
        "readerLabel": "金融負債残高",
        "subtitle": "二人以上の世帯・1世帯当たり"
      }
    ]
  },
  "national-medical-expenditure": {
    "categoryKey": "socialsecurity",
    "representatives": [
      {
        "rankingKey": "national-medical-expense-per-person",
        "title": "1人当たりの国民医療費",
        "readerLabel": "1人当たりの国民医療費"
      },
      {
        "rankingKey": "national-medical-expense-inpatient",
        "title": "国民医療費",
        "readerLabel": "国民医療費",
        "subtitle": "医科診療・入院"
      }
    ]
  },
  "natural-conservation-area-data": {
    "categoryKey": "landweather",
    "representatives": [
      {
        "rankingKey": "natural-environment-conservation-area",
        "title": "自然環境保全地域面積",
        "readerLabel": "自然環境保全地域面積"
      }
    ]
  },
  "natural-park-area": {
    "categoryKey": "landweather",
    "representatives": [
      {
        "rankingKey": "nature-park-area",
        "title": "自然公園面積",
        "readerLabel": "自然公園面積"
      },
      {
        "rankingKey": "nature-park-area-ratio",
        "title": "自然公園面積割合",
        "readerLabel": "自然公園面積割合"
      },
      {
        "rankingKey": "prefectural-natural-park-count",
        "title": "都道府県立自然公園数",
        "readerLabel": "都道府県立自然公園数"
      }
    ]
  },
  "nature-park-visitor-survey": {
    "categoryKey": "tourism",
    "representatives": [
      {
        "rankingKey": "national-quasi-national-park-visits",
        "title": "国立・国定公園利用者数",
        "readerLabel": "国立・国定公園利用者数",
        "subtitle": "都道府県報告の年間延べ利用・県立公園を除く"
      }
    ]
  },
  "nta-annual-statistics": {
    "categoryKey": "economy",
    "representatives": [
      {
        "rankingKey": "per-capita-national-tax-collected",
        "title": "国税徴収決定済額",
        "readerLabel": "国税徴収決定済額",
        "subtitle": "人口1人当たり"
      },
      {
        "rankingKey": "alcohol-sales-per-adult-beer",
        "title": "成人1人あたり酒類販売(消費)数量",
        "readerLabel": "成人1人あたり酒類販売(消費)数量",
        "subtitle": "ビール"
      },
      {
        "rankingKey": "national-tax-collected",
        "title": "国税収納済額",
        "readerLabel": "国税収納済額"
      }
    ]
  },
  "passenger-regional-flow-survey": {
    "categoryKey": "tourism",
    "representatives": [
      {
        "rankingKey": "jr-passenger-transport",
        "title": "ＪＲ輸送人員",
        "readerLabel": "ＪＲ輸送人員"
      },
      {
        "rankingKey": "air-passenger-transport",
        "title": "航空輸送人員",
        "readerLabel": "航空輸送人員"
      },
      {
        "rankingKey": "passenger-ship-transport",
        "title": "旅客船輸送人員",
        "readerLabel": "旅客船輸送人員"
      }
    ]
  },
  "patent-administration-annual-report": {
    "categoryKey": "economy",
    "representatives": [
      {
        "rankingKey": "patent-application-count",
        "title": "特許出願件数",
        "readerLabel": "特許出願件数",
        "subtitle": "日本人によるもの・筆頭出願人住所別"
      },
      {
        "rankingKey": "patent-registration-count",
        "title": "特許登録件数",
        "readerLabel": "特許登録件数",
        "subtitle": "日本人によるもの・筆頭出願人住所別"
      },
      {
        "rankingKey": "patent-inventor-count",
        "title": "特許出願の延べ発明者数",
        "readerLabel": "特許出願の延べ発明者数",
        "subtitle": "日本人によるもの・延べ人数"
      }
    ]
  },
  "patient-survey": {
    "categoryKey": "socialsecurity",
    "representatives": [
      {
        "rankingKey": "inpatient-rate-per-100k",
        "title": "入院受療率",
        "readerLabel": "入院受療率",
        "subtitle": "人口10万人当たり"
      },
      {
        "rankingKey": "outpatient-rate-per-100k",
        "title": "外来受療率",
        "readerLabel": "外来受療率",
        "subtitle": "人口10万人当たり"
      },
      {
        "rankingKey": "treatment-rate-cancer-inpatient",
        "title": "がん（悪性新生物）の受療率（入院）",
        "readerLabel": "がん（悪性新生物）の受療率（入院）",
        "subtitle": "入院患者の受療率"
      }
    ]
  },
  "pension-insurance-annual-report": {
    "categoryKey": "socialsecurity",
    "representatives": [
      {
        "rankingKey": "national-pension-enrollees-type1-per-1000-20-59",
        "title": "第1号国民年金被保険者数",
        "readerLabel": "第1号国民年金被保険者数",
        "subtitle": "20～59歳人口千人当たり"
      },
      {
        "rankingKey": "national-pension-enrollees-type3-per-1000-20-59",
        "title": "第3号国民年金被保険者数",
        "readerLabel": "第3号国民年金被保険者数",
        "subtitle": "20～59歳人口千人当たり"
      },
      {
        "rankingKey": "national-pension-payment-rate",
        "title": "国民年金保険料納付率",
        "readerLabel": "国民年金保険料納付率"
      }
    ]
  },
  "petroleum-sales-statistics": {
    "categoryKey": "energy",
    "representatives": [
      {
        "rankingKey": "gasoline-sales-volume",
        "title": "ガソリン販売量",
        "readerLabel": "ガソリン販売量"
      }
    ]
  },
  "physician-survey": {
    "categoryKey": "socialsecurity",
    "representatives": [
      {
        "rankingKey": "physicians-in-medical-facilities",
        "title": "医師数",
        "readerLabel": "医師数",
        "subtitle": "医療施設に従事する数"
      },
      {
        "rankingKey": "pharmacist-count",
        "title": "薬剤師数",
        "readerLabel": "薬剤師数"
      },
      {
        "rankingKey": "dentists-in-medical-facilities",
        "title": "歯科医師数",
        "readerLabel": "歯科医師数",
        "subtitle": "医療施設に従事する数"
      }
    ]
  },
  "police-statistics": {
    "categoryKey": "safetyenvironment",
    "representatives": [
      {
        "rankingKey": "criminal-arrest-rate",
        "title": "刑法犯検挙率",
        "readerLabel": "刑法犯検挙率"
      },
      {
        "rankingKey": "serious-crime-per-100k",
        "title": "凶悪犯認知件数",
        "readerLabel": "凶悪犯認知件数"
      },
      {
        "rankingKey": "drug-enforcement-arrest-count",
        "title": "覚醒剤取締検挙件数",
        "readerLabel": "覚醒剤取締検挙件数",
        "subtitle": "総数"
      }
    ]
  },
  "population-estimates": {
    "categoryKey": "population",
    "representatives": [
      {
        "rankingKey": "total-population",
        "title": "総人口",
        "readerLabel": "人口",
        "subtitle": "総数"
      },
      {
        "rankingKey": "population-growth-rate",
        "title": "人口増減率",
        "readerLabel": "人口増減率"
      },
      {
        "rankingKey": "ratio-65-plus",
        "title": "65歳以上人口割合",
        "readerLabel": "65歳以上人口割合",
        "subtitle": "65歳以上割合"
      }
    ]
  },
  "population-projection": {
    "categoryKey": "population",
    "representatives": [
      {
        "rankingKey": "future-population",
        "title": "将来推計人口",
        "readerLabel": "将来推計人口",
        "subtitle": "IPSS令和5年推計"
      },
      {
        "rankingKey": "future-population-change-rate-2050",
        "title": "将来人口増減率",
        "readerLabel": "将来人口増減率",
        "subtitle": "2020年→2050年"
      }
    ]
  },
  "population-research": {
    "categoryKey": "population",
    "representatives": [
      {
        "rankingKey": "standardized-mortality-rate-per-1000",
        "title": "標準化死亡率",
        "readerLabel": "標準化死亡率",
        "subtitle": "人口千人当たり"
      },
      {
        "rankingKey": "standardized-mortality-japanese",
        "title": "標準化死亡率〔日本人〕",
        "readerLabel": "標準化死亡率〔日本人〕"
      }
    ]
  },
  "port-statistics": {
    "categoryKey": "infrastructure",
    "representatives": [
      {
        "rankingKey": "port-cargo-total",
        "title": "海上出入貨物量（港湾統計）",
        "readerLabel": "海上出入貨物量（港湾統計）"
      },
      {
        "rankingKey": "port-cargo-export",
        "title": "輸出貨物量（港湾統計）",
        "readerLabel": "輸出貨物量（港湾統計）"
      },
      {
        "rankingKey": "port-cargo-import",
        "title": "輸入貨物量（港湾統計）",
        "readerLabel": "輸入貨物量（港湾統計）"
      }
    ]
  },
  "poverty-self-reliance-support-status-survey": {
    "categoryKey": "socialsecurity",
    "representatives": [
      {
        "rankingKey": "poverty-support-new-consultation-cases",
        "title": "生活困窮者自立支援の新規相談受付件数",
        "readerLabel": "生活困窮者自立支援の新規相談受付件数"
      }
    ]
  },
  "prefectural-accounts": {
    "categoryKey": "economy",
    "representatives": [
      {
        "rankingKey": "total-production-in-the-prefecture",
        "title": "県内総生産額",
        "readerLabel": "県内総生産額",
        "subtitle": "総額"
      },
      {
        "rankingKey": "per-capita-prefectural-income-h27",
        "title": "1人当たり県民所得",
        "readerLabel": "1人当たり県民所得",
        "subtitle": "H27年基準"
      },
      {
        "rankingKey": "gdp-growth-rate-pref-h23",
        "title": "県内総生産額対前年増加率",
        "readerLabel": "県内総生産額対前年増加率",
        "subtitle": "H23年基準"
      }
    ]
  },
  "prefectural-energy-consumption-statistics": {
    "categoryKey": "energy",
    "representatives": [
      {
        "rankingKey": "regional-household-final-energy-consumption",
        "title": "家庭部門の最終エネルギー消費量",
        "readerLabel": "家庭部門の最終エネルギー消費量"
      },
      {
        "rankingKey": "regional-industry-final-energy-consumption",
        "title": "産業部門の最終エネルギー消費量",
        "readerLabel": "産業部門の最終エネルギー消費量"
      },
      {
        "rankingKey": "final-energy-consumption",
        "title": "最終エネルギー消費量",
        "readerLabel": "最終エネルギー消費量"
      }
    ]
  },
  "prefectural-food-self-sufficiency": {
    "categoryKey": "agriculture",
    "representatives": [
      {
        "rankingKey": "food-self-sufficiency-rate-calorie",
        "title": "食料自給率（カロリーベース）",
        "readerLabel": "食料自給率（カロリーベース）"
      }
    ]
  },
  "prefectural-land-price-survey": {
    "categoryKey": "construction",
    "representatives": [
      {
        "rankingKey": "standard-price-change-rate-residential",
        "title": "標準価格対前年平均変動率",
        "readerLabel": "標準価格対前年平均変動率",
        "subtitle": "住宅地"
      },
      {
        "rankingKey": "standard-price-change-rate-commercial",
        "title": "標準価格対前年平均変動率",
        "readerLabel": "標準価格対前年平均変動率",
        "subtitle": "商業地"
      },
      {
        "rankingKey": "standard-price-change-rate-industrial",
        "title": "標準価格対前年平均変動率",
        "readerLabel": "標準価格対前年平均変動率",
        "subtitle": "工業地"
      }
    ]
  },
  "prefectural-settlement-survey": {
    "categoryKey": "administrativefinancial",
    "representatives": [
      {
        "rankingKey": "fiscal-strength-index-prefecture",
        "title": "財政力指数",
        "readerLabel": "自治体の財政力",
        "subtitle": "都道府県財政"
      },
      {
        "rankingKey": "current-balance-ratio",
        "title": "経常収支比率",
        "readerLabel": "経常収支比率",
        "subtitle": "都道府県財政"
      },
      {
        "rankingKey": "education-expenditure-ratio-pref-finance",
        "title": "教育費割合",
        "readerLabel": "教育費割合",
        "subtitle": "都道府県財政"
      }
    ]
  },
  "public-assistance-survey": {
    "categoryKey": "socialsecurity",
    "representatives": [
      {
        "rankingKey": "public-assistance-medical-beneficiaries-per-1000",
        "title": "生活保護医療扶助人員",
        "readerLabel": "生活保護医療扶助人員",
        "subtitle": "月平均・人口千人当たり"
      },
      {
        "rankingKey": "elderly-on-public-assistance-per-1000-65plus",
        "title": "生活保護被保護高齢者数",
        "readerLabel": "生活保護被保護高齢者数",
        "subtitle": "65歳以上人口千人当たり"
      },
      {
        "rankingKey": "households-on-public-assistance",
        "title": "生活保護被保護実世帯数",
        "readerLabel": "生活保護被保護実世帯数",
        "subtitle": "総数"
      }
    ]
  },
  "public-facilities-status-survey": {
    "categoryKey": "administrativefinancial",
    "representatives": [
      {
        "rankingKey": "prefectural-public-building-floor-area",
        "title": "都道府県有建物の延面積",
        "readerLabel": "都道府県有建物の延面積",
        "subtitle": "行政財産・普通財産の合計／年度末"
      }
    ]
  },
  "regional-health-promotion-report": {
    "categoryKey": "socialsecurity",
    "representatives": [
      {
        "rankingKey": "vaccination-recipients-disease",
        "title": "ＨＰＶワクチン定期予防接種者数（都道府県別）",
        "readerLabel": "ＨＰＶワクチン定期予防接種者数"
      },
      {
        "rankingKey": "maternal-health-guidance-per-100-births",
        "title": "妊産婦保健指導数",
        "readerLabel": "妊産婦保健指導数",
        "subtitle": "出産数100当たり"
      },
      {
        "rankingKey": "dental-checkup-persons",
        "title": "歯科健診受診延人員",
        "readerLabel": "歯科健診受診延人員",
        "subtitle": "総数"
      }
    ]
  },
  "resident-registry-migration-report": {
    "categoryKey": "population",
    "representatives": [
      {
        "rankingKey": "moving-in-excess-rate-japanese",
        "title": "転入超過率",
        "readerLabel": "転入超過率",
        "subtitle": "日本人移動者"
      },
      {
        "rankingKey": "moving-in-excess-rate",
        "title": "転入超過率",
        "readerLabel": "転入超過率",
        "subtitle": "外国人移動者を含む"
      },
      {
        "rankingKey": "japanese-movers-in",
        "title": "転入者数",
        "readerLabel": "転入者数",
        "subtitle": "日本人移動者"
      }
    ]
  },
  "resident-registry-population-survey": {
    "categoryKey": "population",
    "representatives": [
      {
        "rankingKey": "foreign-resident-population",
        "title": "住民基本台帳人口（外国人）",
        "readerLabel": "住民基本台帳人口（外国人）"
      }
    ]
  },
  "retail-price-survey": {
    "categoryKey": "economy",
    "representatives": [
      {
        "rankingKey": "consumer-price-difference-index-overall",
        "title": "消費者物価地域差指数",
        "readerLabel": "消費者物価地域差指数",
        "subtitle": "総合"
      },
      {
        "rankingKey": "consumer-price-difference-index-food",
        "title": "消費者物価地域差指数",
        "readerLabel": "消費者物価地域差指数",
        "subtitle": "食料"
      },
      {
        "rankingKey": "consumer-price-difference-index-housing",
        "title": "消費者物価地域差指数",
        "readerLabel": "消費者物価地域差指数",
        "subtitle": "住居"
      }
    ]
  },
  "road-statistics": {
    "categoryKey": "infrastructure",
    "representatives": [
      {
        "rankingKey": "road-total-length-with-expressway",
        "title": "道路実延長（高速道路を含む）",
        "readerLabel": "道路実延長（高速道路を含む）",
        "subtitle": "合計（高速道路を含む）"
      },
      {
        "rankingKey": "municipal-road-paving-rate",
        "title": "市町村道舗装率",
        "readerLabel": "市町村道舗装率"
      },
      {
        "rankingKey": "road-expressway-length",
        "title": "道路実延長（高速道路）",
        "readerLabel": "道路実延長（高速道路）",
        "subtitle": "高速道路のみ"
      }
    ]
  },
  "school-basic-survey": {
    "categoryKey": "educationsports",
    "representatives": [
      {
        "rankingKey": "elementary-school-count",
        "title": "小学校数",
        "readerLabel": "小学校数",
        "subtitle": "総数"
      },
      {
        "rankingKey": "junior-high-school-advancement-rate",
        "title": "中学校卒業者の進学率",
        "readerLabel": "中学校卒業者の進学率"
      },
      {
        "rankingKey": "high-school-graduates-job-ratio",
        "title": "高等学校卒業者に占める就職者の割合",
        "readerLabel": "高等学校卒業者に占める就職者の割合"
      }
    ]
  },
  "school-health-survey": {
    "categoryKey": "educationsports",
    "representatives": [
      {
        "rankingKey": "average-height-primary-school-fifth-grade-male",
        "title": "平均身長",
        "readerLabel": "平均身長",
        "subtitle": "小学5年・男子"
      },
      {
        "rankingKey": "average-weight-primary-school-fifth-grade-female",
        "title": "平均体重",
        "readerLabel": "平均体重",
        "subtitle": "小学5年・女子"
      },
      {
        "rankingKey": "average-height-middle-school-second-grade-male",
        "title": "平均身長",
        "readerLabel": "平均身長",
        "subtitle": "中学2年・男子"
      }
    ]
  },
  "sewerage-statistics": {
    "categoryKey": "infrastructure",
    "representatives": [
      {
        "rankingKey": "sewerage-penetration-rate-2012on",
        "title": "下水道普及率",
        "readerLabel": "下水道普及率",
        "subtitle": "2012年以降"
      },
      {
        "rankingKey": "sewerage-drainage-population",
        "title": "下水道排水区域人口",
        "readerLabel": "下水道排水区域人口"
      },
      {
        "rankingKey": "flush-toilet-population-ratio",
        "title": "水洗化人口比率",
        "readerLabel": "水洗化人口比率"
      }
    ]
  },
  "sixth-industry-survey": {
    "categoryKey": "agriculture",
    "representatives": [
      {
        "rankingKey": "sixth-industry-agriculture-entities",
        "title": "6次産業農業生産関連事業体数",
        "readerLabel": "6次産業農業生産関連事業体数",
        "subtitle": "農産加工"
      },
      {
        "rankingKey": "sixth-industry-agriculture-sales",
        "title": "6次産業農業生産関連事業体年間販売金額",
        "readerLabel": "6次産業農業生産関連事業体年間販売金額",
        "subtitle": "農産加工"
      }
    ]
  },
  "social-education-survey": {
    "categoryKey": "educationsports",
    "representatives": [
      {
        "rankingKey": "library-count-per-million",
        "title": "図書館数",
        "readerLabel": "図書館数",
        "subtitle": "人口100万人当たり"
      },
      {
        "rankingKey": "library-lending-books",
        "title": "図書館館外貸出冊数",
        "readerLabel": "図書館館外貸出冊数"
      },
      {
        "rankingKey": "art-museum-count",
        "title": "美術博物館数",
        "readerLabel": "美術博物館数"
      }
    ]
  },
  "social-life-basic-survey": {
    "categoryKey": "educationsports",
    "representatives": [
      {
        "rankingKey": "sports-participation-rate-walking",
        "title": "ウォーキング・軽い体操の行動者率",
        "readerLabel": "ウォーキング・軽い体操をした人の割合"
      },
      {
        "rankingKey": "hobby-participation-rate-reading",
        "title": "趣味としての読書の行動者率",
        "readerLabel": "趣味としての読書をした人の割合"
      },
      {
        "rankingKey": "study-participation-rate-english",
        "title": "英語学習の行動者率",
        "readerLabel": "英語学習をした人の割合"
      }
    ]
  },
  "social-welfare-facility-survey": {
    "categoryKey": "socialsecurity",
    "representatives": [
      {
        "rankingKey": "child-welfare-facility-count-per-100k",
        "title": "児童福祉施設等数",
        "readerLabel": "児童福祉施設等数",
        "subtitle": "人口10万人当たり"
      },
      {
        "rankingKey": "nursery-count-per-100k-0-5",
        "title": "保育所等数",
        "readerLabel": "保育所等数",
        "subtitle": "0～5歳人口10万人当たり"
      },
      {
        "rankingKey": "nursing-home-capacity-per-1000-65plus",
        "title": "老人ホーム定員数（65歳以上人口千人当たり）",
        "readerLabel": "老人ホーム定員数（65歳以上人口千人当たり）"
      }
    ]
  },
  "sole-proprietor-survey": {
    "categoryKey": "economy",
    "representatives": [
      {
        "rankingKey": "sole-proprietor-operating-profit",
        "title": "個人企業の営業利益",
        "readerLabel": "個人企業の営業利益",
        "subtitle": "個人企業1企業あたりの年間営業利益"
      },
      {
        "rankingKey": "sole-proprietor-sales-per-worker",
        "title": "個人企業の従業者1人当たり売上高",
        "readerLabel": "個人企業の従業者1人当たり売上高"
      },
      {
        "rankingKey": "sole-proprietor-sales",
        "title": "個人企業の売上高",
        "readerLabel": "個人企業の売上高",
        "subtitle": "個人企業1企業あたりの年間売上高"
      }
    ]
  },
  "special-forest-products-statistics": {
    "categoryKey": "agriculture",
    "representatives": [
      {
        "rankingKey": "bamboo-production",
        "title": "竹材生産量",
        "readerLabel": "竹材生産量"
      },
      {
        "rankingKey": "charcoal-production",
        "title": "木炭生産量",
        "readerLabel": "木炭生産量"
      }
    ]
  },
  "sports-facilities-survey": {
    "categoryKey": "educationsports",
    "representatives": [
      {
        "rankingKey": "athletics-stadium-count-public",
        "title": "陸上競技場数",
        "readerLabel": "陸上競技場数",
        "subtitle": "公共スポーツ施設"
      },
      {
        "rankingKey": "elementary-school-gymnasium-count",
        "title": "小学校体育館設置箇所数",
        "readerLabel": "小学校体育館設置箇所数",
        "subtitle": "公立・私立（国立大学附属学校を除く）"
      },
      {
        "rankingKey": "junior-high-school-gymnasium-count",
        "title": "中学校体育館設置箇所数",
        "readerLabel": "中学校体育館設置箇所数",
        "subtitle": "公立・私立（国立大学附属学校を除く）"
      }
    ]
  },
  "student-guidance-issues-survey": {
    "categoryKey": "educationsports",
    "representatives": [
      {
        "rankingKey": "junior-high-school-long-absence-ratio-over-30days-per-1000",
        "title": "中学校長期欠席生徒比率",
        "readerLabel": "中学校長期欠席生徒比率",
        "subtitle": "生徒千人当たり"
      },
      {
        "rankingKey": "long-absence-middle-school-illness-per-1000",
        "title": "病気による中学校長期欠席生徒比率",
        "readerLabel": "病気による中学校長期欠席生徒比率",
        "subtitle": "生徒千人当たり"
      },
      {
        "rankingKey": "long-absence-primary-school-illness-per-1000",
        "title": "病気による小学校長期欠席児童比率",
        "readerLabel": "病気による小学校長期欠席児童比率",
        "subtitle": "児童千人当たり"
      }
    ]
  },
  "telecommunications-contract-share-quarterly": {
    "categoryKey": "ict",
    "representatives": [
      {
        "rankingKey": "broadband-service-contract-count",
        "title": "ブロードバンドサービス契約数",
        "readerLabel": "ブロードバンドサービス契約数",
        "subtitle": "3.9〜4世代携帯電話アクセスを含む旧系列"
      },
      {
        "rankingKey": "broadband-contract-count-excluding-39-4g",
        "title": "ブロードバンドサービス契約数",
        "readerLabel": "ブロードバンドサービス契約数",
        "subtitle": "3.9〜4世代携帯電話アクセスサービスを除く"
      }
    ]
  },
  "telecommunications-service-contract-report": {
    "categoryKey": "ict",
    "representatives": [
      {
        "rankingKey": "public-phone-count",
        "title": "公衆電話設置台数",
        "readerLabel": "公衆電話設置台数",
        "subtitle": "総数"
      },
      {
        "rankingKey": "telephone-subscription-count",
        "title": "電話加入数",
        "readerLabel": "電話加入数",
        "subtitle": "総数"
      },
      {
        "rankingKey": "residential-telephone-subscription-count-per-1000",
        "title": "住宅用電話加入数",
        "readerLabel": "住宅用電話加入数",
        "subtitle": "人口千人当たり"
      }
    ]
  },
  "traffic-accident-statistics": {
    "categoryKey": "safetyenvironment",
    "representatives": [
      {
        "rankingKey": "traffic-accident-count",
        "title": "交通事故発生件数",
        "readerLabel": "交通事故発生件数",
        "subtitle": "総数"
      },
      {
        "rankingKey": "traffic-accident-casualties-elderly-65plus",
        "title": "交通事故死傷者数（高齢者）",
        "readerLabel": "交通事故死傷者数（高齢者）",
        "subtitle": "65歳以上"
      },
      {
        "rankingKey": "traffic-accident-injuries",
        "title": "交通事故負傷者数",
        "readerLabel": "交通事故負傷者数",
        "subtitle": "総数"
      }
    ]
  },
  "travel-tourism-consumption-survey": {
    "categoryKey": "tourism",
    "representatives": [
      {
        "rankingKey": "domestic-travel-consumption-by-destination",
        "title": "日本人旅行者の県内消費額",
        "readerLabel": "日本人旅行者の県内消費額",
        "subtitle": "全目的・宿泊と日帰り"
      }
    ]
  },
  "truck-operator-statistics": {
    "categoryKey": "tourism",
    "representatives": [
      {
        "rankingKey": "truck-operators",
        "title": "トラック事業者",
        "readerLabel": "トラック事業者"
      }
    ]
  },
  "urban-park-survey": {
    "categoryKey": "infrastructure",
    "representatives": [
      {
        "rankingKey": "urban-parks",
        "title": "都市公園数",
        "readerLabel": "都市公園数",
        "subtitle": "総数"
      },
      {
        "rankingKey": "sports-park-count",
        "title": "運動公園数",
        "readerLabel": "運動公園数",
        "subtitle": "総数"
      },
      {
        "rankingKey": "large-scale-park-count",
        "title": "大規模公園数",
        "readerLabel": "大規模公園数"
      }
    ]
  },
  "vehicle-registration-statistics": {
    "categoryKey": "tourism",
    "representatives": [
      {
        "rankingKey": "number-of-freight-cars",
        "title": "貨物車数",
        "readerLabel": "貨物車数"
      }
    ]
  },
  "vital-statistics": {
    "categoryKey": "population",
    "representatives": [
      {
        "rankingKey": "total-fertility-rate",
        "title": "合計特殊出生率",
        "readerLabel": "合計特殊出生率"
      },
      {
        "rankingKey": "crude-birth-rate",
        "title": "粗出生率",
        "readerLabel": "粗出生率",
        "subtitle": "人口千人当たり"
      },
      {
        "rankingKey": "average-age-of-first-marriage-wife",
        "title": "平均初婚年齢（妻）",
        "readerLabel": "平均初婚年齢（妻）",
        "subtitle": "妻の年齢"
      }
    ]
  },
  "voter-registration-statistics": {
    "categoryKey": "administrativefinancial",
    "representatives": [
      {
        "rankingKey": "voter-list-registrants",
        "title": "選挙人名簿登録者数",
        "readerLabel": "選挙人名簿登録者数"
      }
    ]
  },
  "wage-structure-survey": {
    "categoryKey": "laborwage",
    "representatives": [
      {
        "rankingKey": "carpenter-annual-income",
        "title": "大工の平均年収",
        "readerLabel": "大工の平均年収"
      },
      {
        "rankingKey": "software-engineer-annual-income",
        "title": "ソフトウェア作成者の平均年収",
        "readerLabel": "ソフトウェア作成者の平均年収"
      },
      {
        "rankingKey": "physical-therapist-annual-income",
        "title": "理学療法士等の平均年収",
        "readerLabel": "理学療法士等の平均年収"
      }
    ]
  },
  "waste-management-survey": {
    "categoryKey": "safetyenvironment",
    "representatives": [
      {
        "rankingKey": "garbage-total-output",
        "title": "ごみ総排出量",
        "readerLabel": "ごみ総排出量"
      },
      {
        "rankingKey": "waste-recycling-rate",
        "title": "ごみのリサイクル率",
        "readerLabel": "ごみのリサイクル率"
      },
      {
        "rankingKey": "garbage-landfill-rate",
        "title": "ごみ埋立率",
        "readerLabel": "ごみ埋立率"
      }
    ]
  },
  "wastewater-treatment-coverage-report": {
    "categoryKey": "infrastructure",
    "representatives": [
      {
        "rankingKey": "sewerage-coverage-rate",
        "title": "下水道処理人口普及率",
        "readerLabel": "下水道処理人口普及率"
      },
      {
        "rankingKey": "sewage-treatment-coverage-rate",
        "title": "汚水処理人口普及率",
        "readerLabel": "汚水処理人口普及率"
      }
    ]
  },
  "water-pollution-control-law-status": {
    "categoryKey": "safetyenvironment",
    "representatives": [
      {
        "rankingKey": "water-pollution-control-law-facility-count",
        "title": "水質汚濁防止法上の特定事業場数",
        "readerLabel": "水質汚濁防止法上の特定事業場数"
      }
    ]
  },
  "water-pollution-survey": {
    "categoryKey": "safetyenvironment",
    "representatives": [
      {
        "rankingKey": "bod-pollution-load",
        "title": "BOD汚濁負荷量",
        "readerLabel": "BOD汚濁負荷量",
        "subtitle": "生化学的酸素要求量（BOD）の汚濁負荷量"
      },
      {
        "rankingKey": "cod-pollution-load",
        "title": "COD汚濁負荷量",
        "readerLabel": "COD汚濁負荷量",
        "subtitle": "化学的酸素要求量（COD）の汚濁負荷量"
      },
      {
        "rankingKey": "ss-pollution-load",
        "title": "SS汚濁負荷量",
        "readerLabel": "SS汚濁負荷量"
      }
    ]
  },
  "waterworks-statistics": {
    "categoryKey": "infrastructure",
    "representatives": [
      {
        "rankingKey": "water-supply-population-ratio-2012on",
        "title": "上水道給水人口比率",
        "readerLabel": "上水道給水人口比率",
        "subtitle": "2012年以降"
      },
      {
        "rankingKey": "water-supply-population",
        "title": "上水道給水人口",
        "readerLabel": "上水道給水人口"
      },
      {
        "rankingKey": "water-supply-capacity",
        "title": "上水道施設能力",
        "readerLabel": "上水道施設能力"
      }
    ]
  },
  "weather-statistics": {
    "categoryKey": "landweather",
    "representatives": [
      {
        "rankingKey": "average-temperature",
        "title": "年平均気温",
        "readerLabel": "年平均気温"
      },
      {
        "rankingKey": "annual-precipitation",
        "title": "年間降水量",
        "readerLabel": "年間降水量"
      },
      {
        "rankingKey": "annual-sunshine-duration",
        "title": "年間日照時間",
        "readerLabel": "日照時間"
      }
    ]
  },
  "welfare-admin-report": {
    "categoryKey": "socialsecurity",
    "representatives": [
      {
        "rankingKey": "child-consultation-center-cases",
        "title": "児童相談所受付件数",
        "readerLabel": "児童相談所受付件数",
        "subtitle": "総数"
      },
      {
        "rankingKey": "welfare-commissioner-count-per-100k",
        "title": "民生委員数",
        "readerLabel": "民生委員数",
        "subtitle": "人口10万人当たり"
      },
      {
        "rankingKey": "physical-disability-certificates-issued",
        "title": "身体障害者手帳交付数",
        "readerLabel": "身体障害者手帳交付数",
        "subtitle": "総数"
      }
    ]
  },
  "wind-power-deployment-statistics": {
    "categoryKey": "energy",
    "representatives": [
      {
        "rankingKey": "wind-power-turbine-count",
        "title": "風力発電導入量（設置基数）",
        "readerLabel": "風力発電導入量（設置基数）",
        "subtitle": "風車台数"
      },
      {
        "rankingKey": "wind-power-capacity",
        "title": "風力発電導入量（設備容量）",
        "readerLabel": "風力発電導入量（設備容量）",
        "subtitle": "発電容量"
      }
    ]
  },
  "wood-supply-demand-report": {
    "categoryKey": "agriculture",
    "representatives": [
      {
        "rankingKey": "roundwood-production-volume",
        "title": "素材生産量",
        "readerLabel": "素材生産量",
        "subtitle": "木材需給報告書・国産材"
      },
      {
        "rankingKey": "roundwood-sugi-production-volume",
        "title": "すぎの素材生産量",
        "readerLabel": "すぎの素材生産量"
      },
      {
        "rankingKey": "sawmill-count",
        "title": "製材工場数",
        "readerLabel": "製材工場数"
      }
    ]
  },
  "workers-compensation-annual-report": {
    "categoryKey": "safetyenvironment",
    "representatives": [
      {
        "rankingKey": "average-payment-amount-of-workers-compensation-insurance-benefits",
        "title": "労働者災害補償保険給付平均支給額",
        "readerLabel": "労働者災害補償保険給付平均支給額"
      },
      {
        "rankingKey": "workers-compensation-insurance-benefits-rate",
        "title": "労働者災害補償保険給付率",
        "readerLabel": "労働者災害補償保険給付率"
      }
    ]
  },
  "workplace-accident-survey": {
    "categoryKey": "safetyenvironment",
    "representatives": [
      {
        "rankingKey": "occupational-accident-frequency-rate",
        "title": "労働災害度数率",
        "readerLabel": "労働災害度数率",
        "subtitle": "100万延べ実労働時間あたりの労働災害死傷者数"
      },
      {
        "rankingKey": "frequency-of-occupational-accidents",
        "title": "労働災害発生の頻度",
        "readerLabel": "労働災害発生の頻度"
      },
      {
        "rankingKey": "work-accident-severity",
        "title": "労働災害の重さの程度",
        "readerLabel": "労働災害の重さの程度"
      }
    ]
  }
};
