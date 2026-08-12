/**
 * AUTO-GENERATED — 手編集禁止
 *
 * 生成コマンド: npm run generate:ranking-prominence --workspace apps/web
 * 真実源: packages/data-configs/src/metrics/*.ts (git TS) + GSC snapshot (git 管理下)
 *
 * 索引面 (/ranking・ヘッダー・カテゴリ・関連ランキング) とホーム注目が
 * 共通で引く掲載価値スコアの確定結果。スコア式は
 * packages/data-configs/src/prominence/compute-prominence.ts を参照。
 *
 * 需要は桁バケットで量子化してあるため、GSC の週次の揺れではこのファイルは変わらない。
 */

export interface RankingRepresentative {
  rankingKey: string;
  title: string;
  /** 問いかけコピー。導出規則 + override で確定したもの */
  hook: string;
}

export interface CategoryProminence {
  categoryKey: string;
  categoryName: string;
  /** isActive な metric 件数 */
  count: number;
  /** 索引に出す代表 (6 件)。ヘッダーはこの先頭 4 件を使う */
  representatives: ReadonlyArray<RankingRepresentative>;
}

export interface HomeFeaturedProminence extends RankingRepresentative {
  categoryKey: string;
  /** 1 始まりの表示順 */
  order: number;
}

export const RANKING_PROMINENCE_CATEGORIES: ReadonlyArray<CategoryProminence> =
  [
  {
    "categoryKey": "landweather",
    "categoryName": "国土・気象",
    "count": 41,
    "representatives": [
      {
        "rankingKey": "prefectural-nature-park-area",
        "title": "都道府県立自然公園面積",
        "hook": "都道府県立自然公園面積が最も広い県は？"
      },
      {
        "rankingKey": "road-length-per-km2",
        "title": "道路実延長",
        "hook": "道路実延長が最も長い県は？"
      },
      {
        "rankingKey": "major-lake-area",
        "title": "主要湖沼面積",
        "hook": "主要湖沼面積が最も広い県は？"
      },
      {
        "rankingKey": "nature-park-area",
        "title": "自然公園面積",
        "hook": "自然公園面積が最も広い県は？"
      },
      {
        "rankingKey": "prefectural-natural-park-count",
        "title": "都道府県立自然公園数",
        "hook": "都道府県立自然公園数が最も多い県は？"
      },
      {
        "rankingKey": "national-park-area",
        "title": "国立公園面積",
        "hook": "国立公園面積が最も広い県は？"
      }
    ]
  },
  {
    "categoryKey": "population",
    "categoryName": "人口・世帯",
    "count": 138,
    "representatives": [
      {
        "rankingKey": "dual-income-household-ratio",
        "title": "共働き世帯割合",
        "hook": "共働き世帯割合が最も高い県は？"
      },
      {
        "rankingKey": "pneumonia-death-count",
        "title": "肺炎による死亡者数",
        "hook": "肺炎による死亡者数が最も多い県は？"
      },
      {
        "rankingKey": "deaths-hypertensive-diseases",
        "title": "高血圧性疾患による死亡者数",
        "hook": "高血圧性疾患による死亡者数が最も多い県は？"
      },
      {
        "rankingKey": "deaths-lifestyle-diseases",
        "title": "生活習慣病による死亡者数",
        "hook": "生活習慣病による死亡者数が最も多い県は？"
      },
      {
        "rankingKey": "kidney-failure-death-count",
        "title": "腎不全による死亡者数",
        "hook": "腎不全による死亡者数が最も多い県は？"
      },
      {
        "rankingKey": "crude-birth-rate",
        "title": "粗出生率",
        "hook": "粗出生率が最も高い県は？"
      }
    ]
  },
  {
    "categoryKey": "laborwage",
    "categoryName": "労働・賃金",
    "count": 110,
    "representatives": [
      {
        "rankingKey": "designer-annual-income",
        "title": "デザイナーの平均年収",
        "hook": "デザイナーの平均年収が最も高い県は？"
      },
      {
        "rankingKey": "software-engineer-annual-income",
        "title": "ソフトウェア作成者の平均年収",
        "hook": "ソフトウェア作成者の平均年収が最も高い県は？"
      },
      {
        "rankingKey": "cook-annual-income",
        "title": "飲食物調理従事者の平均年収",
        "hook": "飲食物調理従事者の平均年収が最も高い県は？"
      },
      {
        "rankingKey": "taxi-driver-annual-income",
        "title": "タクシー運転者の平均年収",
        "hook": "タクシー運転者の平均年収が最も高い県は？"
      },
      {
        "rankingKey": "non-regular-employment-rate",
        "title": "非正規雇用率",
        "hook": "非正規雇用率が最も高い県は？"
      },
      {
        "rankingKey": "disabled-employment-rate",
        "title": "障害者就職率",
        "hook": "障害者就職率が最も高い県は？"
      }
    ]
  },
  {
    "categoryKey": "agriculture",
    "categoryName": "農林水産業",
    "count": 60,
    "representatives": [
      {
        "rankingKey": "fishery-workers",
        "title": "漁業就業者数",
        "hook": "漁業就業者数が最も多い県は？"
      },
      {
        "rankingKey": "fishery-species-catch-mackerel",
        "title": "サバ類漁獲量",
        "hook": "サバ類漁獲量が最も多い県は？"
      },
      {
        "rankingKey": "fishery-species-catch-sardine",
        "title": "イワシ類漁獲量",
        "hook": "イワシ類漁獲量が最も多い県は？"
      },
      {
        "rankingKey": "marine-fishery-aquaculture-output-value",
        "title": "海面漁業・養殖業産出額",
        "hook": "海面漁業・養殖業産出額が最も多い県は？"
      },
      {
        "rankingKey": "fishery-species-catch-pacific-saury",
        "title": "サンマ漁獲量",
        "hook": "サンマ漁獲量が最も多い県は？"
      },
      {
        "rankingKey": "fishery-species-catch-pollock",
        "title": "スケトウダラ漁獲量",
        "hook": "スケトウダラ漁獲量が最も多い県は？"
      }
    ]
  },
  {
    "categoryKey": "miningindustry",
    "categoryName": "鉱工業",
    "count": 10,
    "representatives": [
      {
        "rankingKey": "manufacturing-industry-added-value",
        "title": "製造業付加価値額",
        "hook": "製造業付加価値額が最も多い県は？"
      },
      {
        "rankingKey": "manufacturing-shipment-amount-per-establishment",
        "title": "製造品出荷額等",
        "hook": "製造品出荷額等が最も多い県は？"
      },
      {
        "rankingKey": "manufacturing-employees",
        "title": "製造業従業者数",
        "hook": "製造業従業者数が最も多い県は？"
      },
      {
        "rankingKey": "industrial-land-price-change-rate",
        "title": "標準価格変動率（工業地）",
        "hook": "標準価格変動率（工業地）が最も高い県は？"
      },
      {
        "rankingKey": "manufacturing-net-value-added-private",
        "title": "純付加価値額（製造業）",
        "hook": "純付加価値額（製造業）が最も多い県は？"
      },
      {
        "rankingKey": "manufacturing-sales-private",
        "title": "売上金額（製造業）",
        "hook": "売上金額（製造業）が最も多い県は？"
      }
    ]
  },
  {
    "categoryKey": "commercial",
    "categoryName": "商業・サービス業",
    "count": 73,
    "representatives": [
      {
        "rankingKey": "retail-store-count",
        "title": "小売店数",
        "hook": "小売店数が最も多い県は？"
      },
      {
        "rankingKey": "barber-beauty-salon-count",
        "title": "理容・美容所数",
        "hook": "理容・美容所数が最も多い県は？"
      },
      {
        "rankingKey": "standard-price-change-rate-commercial",
        "title": "標準価格対前年平均変動率",
        "hook": "標準価格対前年平均変動率が最も高い県は？"
      },
      {
        "rankingKey": "convenience-store-count-commercial",
        "title": "コンビニエンスストア店舗数",
        "hook": "コンビニエンスストア店舗数が最も多い県は？"
      },
      {
        "rankingKey": "manufacturing-establishment-site-area",
        "title": "製造業事業所敷地面積",
        "hook": "製造業事業所敷地面積が最も広い県は？"
      },
      {
        "rankingKey": "pachinko-shop-density-per-10k",
        "title": "パチンコ店舗数",
        "hook": "パチンコ店舗数が最も多い県は？"
      }
    ]
  },
  {
    "categoryKey": "economy",
    "categoryName": "企業・家計・経済",
    "count": 816,
    "representatives": [
      {
        "rankingKey": "grilled-eel-consumption-expenditure",
        "title": "うなぎのかば焼き消費支出額",
        "hook": "うなぎのかば焼き消費支出額が最も多い県は？"
      },
      {
        "rankingKey": "natto-consumption-expenditure",
        "title": "納豆消費支出額",
        "hook": "納豆消費支出額が最も多い県は？"
      },
      {
        "rankingKey": "beef-consumption-quantity",
        "title": "牛肉消費量",
        "hook": "牛肉消費量が最も多い県は？"
      },
      {
        "rankingKey": "coffee-consumption-quantity",
        "title": "コーヒー消費量",
        "hook": "コーヒー消費量が最も多い県は？"
      },
      {
        "rankingKey": "miso-consumption-quantity",
        "title": "みそ消費量",
        "hook": "みそ消費量が最も多い県は？"
      },
      {
        "rankingKey": "other-bread-consumption-quantity",
        "title": "他のパン消費量",
        "hook": "他のパン消費量が最も多い県は？"
      }
    ]
  },
  {
    "categoryKey": "construction",
    "categoryName": "住宅・土地・建設",
    "count": 76,
    "representatives": [
      {
        "rankingKey": "floor-area-new-owner-dwelling",
        "title": "着工新設持ち家住宅の床面積",
        "hook": "着工新設持ち家住宅の床面積が最も広い県は？"
      },
      {
        "rankingKey": "ordinary-construction-expenses-prefecture",
        "title": "普通建設事業費",
        "hook": "普通建設事業費が最も多い県は？"
      },
      {
        "rankingKey": "new-rental-starts",
        "title": "着工新設貸家数",
        "hook": "着工新設貸家数が最も多い県は？"
      },
      {
        "rankingKey": "planned-construction-cost-per-m2",
        "title": "着工居住用建築物工事費予定額",
        "hook": "着工居住用建築物工事費予定額が最も多い県は？"
      },
      {
        "rankingKey": "carpenter-annual-income",
        "title": "大工の平均年収",
        "hook": "大工の平均年収が最も高い県は？"
      },
      {
        "rankingKey": "vacant-housing-rate",
        "title": "空き家率",
        "hook": "空き家率が最も高い県は？"
      }
    ]
  },
  {
    "categoryKey": "energy",
    "categoryName": "エネルギー・水",
    "count": 21,
    "representatives": [
      {
        "rankingKey": "final-disposal-site-remaining-capacity",
        "title": "最終処分場残余容量",
        "hook": "最終処分場残余容量が最も多い県は？"
      },
      {
        "rankingKey": "gasoline-sales-volume",
        "title": "ガソリン販売量",
        "hook": "ガソリン販売量が最も多い県は？"
      },
      {
        "rankingKey": "utilities-expenditure-ratio-multi-person-households",
        "title": "光熱・水道費割合",
        "hook": "光熱・水道費割合が最も高い県は？"
      },
      {
        "rankingKey": "wind-power-turbine-count",
        "title": "風力発電導入量（設置基数）",
        "hook": "風力発電導入量（設置基数）が最も多い県は？"
      },
      {
        "rankingKey": "geothermal-power-plant-count",
        "title": "地熱発電施設数",
        "hook": "地熱発電施設数が最も多い県は？"
      },
      {
        "rankingKey": "hydroelectric-power-plant-count",
        "title": "水力発電所数",
        "hook": "水力発電所数が最も多い県は？"
      }
    ]
  },
  {
    "categoryKey": "tourism",
    "categoryName": "運輸・観光",
    "count": 49,
    "representatives": [
      {
        "rankingKey": "total-overnight-guests",
        "title": "延べ宿泊者数",
        "hook": "延べ宿泊者数が最も多い県は？"
      },
      {
        "rankingKey": "jr-freight-shipment",
        "title": "ＪＲ貨物発送量",
        "hook": "ＪＲ貨物発送量が最も多い県は？"
      },
      {
        "rankingKey": "total-overnight-guests-foreign",
        "title": "外国人延べ宿泊者数",
        "hook": "外国人延べ宿泊者数が最も多い県は？"
      },
      {
        "rankingKey": "kei-car-count",
        "title": "軽自動車等台数",
        "hook": "軽自動車等台数が最も多い県は？"
      },
      {
        "rankingKey": "moped-count",
        "title": "原動機付自転車台数",
        "hook": "原動機付自転車台数が最も多い県は？"
      },
      {
        "rankingKey": "motorcycle-count",
        "title": "二輪の小型自動車台数",
        "hook": "二輪の小型自動車台数が最も多い県は？"
      }
    ]
  },
  {
    "categoryKey": "educationsports",
    "categoryName": "教育・文化・スポーツ",
    "count": 257,
    "representatives": [
      {
        "rankingKey": "school-teacher-annual-income",
        "title": "小中学校教員の平均年収",
        "hook": "小中学校教員の平均年収が最も高い県は？"
      },
      {
        "rankingKey": "swimming-pool-public",
        "title": "水泳プール数（公共）",
        "hook": "水泳プール数（公共）が最も多い県は？"
      },
      {
        "rankingKey": "elementary-school-children-count",
        "title": "小学校児童数",
        "hook": "小学校児童数が最も多い県は？"
      },
      {
        "rankingKey": "middle-school-students-1-per",
        "title": "中学校生徒数",
        "hook": "中学校生徒数が最も多い県は？"
      },
      {
        "rankingKey": "miscellaneous-school-students",
        "title": "各種学校生徒数",
        "hook": "各種学校生徒数が最も多い県は？"
      },
      {
        "rankingKey": "university-graduates-job-ratio",
        "title": "大学卒業者に占める就職者の割合",
        "hook": "大学卒業者に占める就職者の割合が最も高い県は？"
      }
    ]
  },
  {
    "categoryKey": "administrativefinancial",
    "categoryName": "行財政",
    "count": 129,
    "representatives": [
      {
        "rankingKey": "local-allocation-tax-prefecture",
        "title": "地方交付税",
        "hook": "地方交付税が最も多い県は？"
      },
      {
        "rankingKey": "local-tax-prefecture",
        "title": "地方税",
        "hook": "地方税が最も多い県は？"
      },
      {
        "rankingKey": "local-allocation-tax-ratio-pref-finance",
        "title": "地方交付税割合",
        "hook": "地方交付税割合が最も高い県は？"
      },
      {
        "rankingKey": "public-enterprise-accounting-staff",
        "title": "公営企業等会計部門職員数",
        "hook": "公営企業等会計部門職員数が最も多い県は？"
      },
      {
        "rankingKey": "avg-salary-education-prefecture",
        "title": "教育公務員 平均給与月額",
        "hook": "教育公務員平均給与月額が最も多い県は？"
      },
      {
        "rankingKey": "avg-salary-police-prefecture",
        "title": "警察職 平均給与月額",
        "hook": "警察職平均給与月額が最も多い県は？"
      }
    ]
  },
  {
    "categoryKey": "safetyenvironment",
    "categoryName": "司法・安全・環境",
    "count": 106,
    "representatives": [
      {
        "rankingKey": "fire-department-pump-car-count-per-100-thousand-people",
        "title": "消防ポンプ自動車等現有数",
        "hook": "消防ポンプ自動車等現有数が最も多い県は？"
      },
      {
        "rankingKey": "per-capita-police-expenditure-pref-municipal",
        "title": "警察費",
        "hook": "警察費が最も多い県は？"
      },
      {
        "rankingKey": "serious-crime-per-100k",
        "title": "凶悪犯認知件数",
        "hook": "凶悪犯認知件数が最も多い県は？"
      },
      {
        "rankingKey": "theft-offenses-recognized",
        "title": "窃盗犯認知件数",
        "hook": "窃盗犯認知件数が最も多い県は？"
      },
      {
        "rankingKey": "traffic-safety-special-grant-prefecture",
        "title": "交通安全対策特別交付金",
        "hook": "交通安全対策特別交付金が最も多い県は？"
      },
      {
        "rankingKey": "fire-deaths-per-100k",
        "title": "火災死亡者数",
        "hook": "火災死亡者数が最も多い県は？"
      }
    ]
  },
  {
    "categoryKey": "socialsecurity",
    "categoryName": "社会保障・衛生",
    "count": 244,
    "representatives": [
      {
        "rankingKey": "psychiatric-bed-count",
        "title": "精神病床数",
        "hook": "精神病床数が最も多い県は？"
      },
      {
        "rankingKey": "abortion-rate",
        "title": "人工妊娠中絶実施率",
        "hook": "人工妊娠中絶実施率が最も高い県は？"
      },
      {
        "rankingKey": "general-hospital-bed-count",
        "title": "一般病院病床数",
        "hook": "一般病院病床数が最も多い県は？"
      },
      {
        "rankingKey": "midwife-count",
        "title": "助産師数",
        "hook": "助産師数が最も多い県は？"
      },
      {
        "rankingKey": "physical-disability-certificates-issued",
        "title": "身体障害者手帳交付数",
        "hook": "身体障害者手帳交付数が最も多い県は？"
      },
      {
        "rankingKey": "physicians-in-medical-facilities",
        "title": "医師数",
        "hook": "医師数が最も多い県は？"
      }
    ]
  },
  {
    "categoryKey": "international",
    "categoryName": "国際",
    "count": 8,
    "representatives": [
      {
        "rankingKey": "resident-foreigner-korea",
        "title": "在留外国人数（韓国）",
        "hook": "在留外国人数（韓国）が最も多い県は？"
      },
      {
        "rankingKey": "foreign-population-per-100k",
        "title": "外国人人口（人口10万人当たり）",
        "hook": "外国人人口（人口10万人当たり）が最も多い県は？"
      }
    ]
  },
  {
    "categoryKey": "infrastructure",
    "categoryName": "社会基盤施設",
    "count": 48,
    "representatives": [
      {
        "rankingKey": "main-road-paving-rate",
        "title": "主要道路舗装率",
        "hook": "主要道路舗装率が最も高い県は？"
      },
      {
        "rankingKey": "port-container-count",
        "title": "コンテナ取扱個数（港湾統計）",
        "hook": "コンテナ取扱個数（港湾統計）が最も多い県は？"
      },
      {
        "rankingKey": "port-inbound-ships",
        "title": "入港船舶隻数（港湾統計）",
        "hook": "入港船舶隻数（港湾統計）が最も多い県は？"
      },
      {
        "rankingKey": "port-cargo-export",
        "title": "輸出貨物量（港湾統計）",
        "hook": "輸出貨物量（港湾統計）が最も多い県は？"
      },
      {
        "rankingKey": "port-ships-tonnage",
        "title": "入港船舶総トン数（港湾統計）",
        "hook": "入港船舶総トン数（港湾統計）が最も多い県は？"
      },
      {
        "rankingKey": "sewage-treatment-coverage-rate",
        "title": "汚水処理人口普及率",
        "hook": "汚水処理人口普及率が最も高い県は？"
      }
    ]
  },
  {
    "categoryKey": "ict",
    "categoryName": "情報通信・科学技術",
    "count": 16,
    "representatives": [
      {
        "rankingKey": "public-phone-count",
        "title": "公衆電話設置台数",
        "hook": "公衆電話設置台数が最も多い県は？"
      },
      {
        "rankingKey": "post-office-count",
        "title": "郵便局数",
        "hook": "郵便局数が最も多い県は？"
      },
      {
        "rankingKey": "transport-communication-expenditure-ratio-multi-person-households",
        "title": "交通・通信費割合",
        "hook": "交通・通信費割合が最も高い県は？"
      },
      {
        "rankingKey": "telephone-subscription-count",
        "title": "電話加入数",
        "hook": "電話加入数が最も多い県は？"
      },
      {
        "rankingKey": "average-broadcast-media-consumption-time-employed-woman",
        "title": "テレビ・ラジオ・新聞・雑誌の平均時間",
        "hook": "テレビ・ラジオ・新聞・雑誌の平均時間が最も長い県は？"
      },
      {
        "rankingKey": "mobile-phone-contract-count-per-1000",
        "title": "携帯電話契約数",
        "hook": "携帯電話契約数が最も多い県は？"
      }
    ]
  }
];

export const HOME_FEATURED_PROMINENCE: ReadonlyArray<HomeFeaturedProminence> =
  [
  {
    "rankingKey": "grilled-eel-consumption-expenditure",
    "title": "うなぎのかば焼き消費支出額",
    "hook": "うなぎのかば焼き消費支出額が最も多い県は？",
    "categoryKey": "economy",
    "order": 1
  },
  {
    "rankingKey": "local-allocation-tax-prefecture",
    "title": "地方交付税",
    "hook": "地方交付税が最も多い県は？",
    "categoryKey": "administrativefinancial",
    "order": 2
  },
  {
    "rankingKey": "psychiatric-bed-count",
    "title": "精神病床数",
    "hook": "精神病床数が最も多い県は？",
    "categoryKey": "socialsecurity",
    "order": 3
  },
  {
    "rankingKey": "main-road-paving-rate",
    "title": "主要道路舗装率",
    "hook": "主要道路舗装率が最も高い県は？",
    "categoryKey": "infrastructure",
    "order": 4
  },
  {
    "rankingKey": "prefectural-nature-park-area",
    "title": "都道府県立自然公園面積",
    "hook": "都道府県立自然公園面積が最も広い県は？",
    "categoryKey": "landweather",
    "order": 5
  },
  {
    "rankingKey": "public-phone-count",
    "title": "公衆電話設置台数",
    "hook": "公衆電話設置台数が最も多い県は？",
    "categoryKey": "ict",
    "order": 6
  },
  {
    "rankingKey": "school-teacher-annual-income",
    "title": "小中学校教員の平均年収",
    "hook": "小中学校教員の平均年収が最も高い県は？",
    "categoryKey": "educationsports",
    "order": 7
  },
  {
    "rankingKey": "retail-store-count",
    "title": "小売店数",
    "hook": "小売店数が最も多い県は？",
    "categoryKey": "commercial",
    "order": 8
  }
];

/**
 * 索引が代表として出すキーの平坦な一覧。
 *
 * カテゴリを跨ぐ面 (survey ページ・items.json の並び順) が「代表かどうか」を
 * 判定するのに使う。各所で RANKING_PROMINENCE_CATEGORIES を flatMap し直すと
 * 構築規則が分散するので、ここで 1 度だけ出す。
 */
export const REPRESENTATIVE_RANKING_KEYS: ReadonlyArray<string> =
  [
  "prefectural-nature-park-area",
  "road-length-per-km2",
  "major-lake-area",
  "nature-park-area",
  "prefectural-natural-park-count",
  "national-park-area",
  "dual-income-household-ratio",
  "pneumonia-death-count",
  "deaths-hypertensive-diseases",
  "deaths-lifestyle-diseases",
  "kidney-failure-death-count",
  "crude-birth-rate",
  "designer-annual-income",
  "software-engineer-annual-income",
  "cook-annual-income",
  "taxi-driver-annual-income",
  "non-regular-employment-rate",
  "disabled-employment-rate",
  "fishery-workers",
  "fishery-species-catch-mackerel",
  "fishery-species-catch-sardine",
  "marine-fishery-aquaculture-output-value",
  "fishery-species-catch-pacific-saury",
  "fishery-species-catch-pollock",
  "manufacturing-industry-added-value",
  "manufacturing-shipment-amount-per-establishment",
  "manufacturing-employees",
  "industrial-land-price-change-rate",
  "manufacturing-net-value-added-private",
  "manufacturing-sales-private",
  "retail-store-count",
  "barber-beauty-salon-count",
  "standard-price-change-rate-commercial",
  "convenience-store-count-commercial",
  "manufacturing-establishment-site-area",
  "pachinko-shop-density-per-10k",
  "grilled-eel-consumption-expenditure",
  "natto-consumption-expenditure",
  "beef-consumption-quantity",
  "coffee-consumption-quantity",
  "miso-consumption-quantity",
  "other-bread-consumption-quantity",
  "floor-area-new-owner-dwelling",
  "ordinary-construction-expenses-prefecture",
  "new-rental-starts",
  "planned-construction-cost-per-m2",
  "carpenter-annual-income",
  "vacant-housing-rate",
  "final-disposal-site-remaining-capacity",
  "gasoline-sales-volume",
  "utilities-expenditure-ratio-multi-person-households",
  "wind-power-turbine-count",
  "geothermal-power-plant-count",
  "hydroelectric-power-plant-count",
  "total-overnight-guests",
  "jr-freight-shipment",
  "total-overnight-guests-foreign",
  "kei-car-count",
  "moped-count",
  "motorcycle-count",
  "school-teacher-annual-income",
  "swimming-pool-public",
  "elementary-school-children-count",
  "middle-school-students-1-per",
  "miscellaneous-school-students",
  "university-graduates-job-ratio",
  "local-allocation-tax-prefecture",
  "local-tax-prefecture",
  "local-allocation-tax-ratio-pref-finance",
  "public-enterprise-accounting-staff",
  "avg-salary-education-prefecture",
  "avg-salary-police-prefecture",
  "fire-department-pump-car-count-per-100-thousand-people",
  "per-capita-police-expenditure-pref-municipal",
  "serious-crime-per-100k",
  "theft-offenses-recognized",
  "traffic-safety-special-grant-prefecture",
  "fire-deaths-per-100k",
  "psychiatric-bed-count",
  "abortion-rate",
  "general-hospital-bed-count",
  "midwife-count",
  "physical-disability-certificates-issued",
  "physicians-in-medical-facilities",
  "resident-foreigner-korea",
  "foreign-population-per-100k",
  "main-road-paving-rate",
  "port-container-count",
  "port-inbound-ships",
  "port-cargo-export",
  "port-ships-tonnage",
  "sewage-treatment-coverage-rate",
  "public-phone-count",
  "post-office-count",
  "transport-communication-expenditure-ratio-multi-person-households",
  "telephone-subscription-count",
  "average-broadcast-media-consumption-time-employed-woman",
  "mobile-phone-contract-count-per-1000"
];
