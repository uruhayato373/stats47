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
  /** 正準な統計名 */
  title: string;
  /** 読者向けの平易な指標名。正準名から決定規則で導出 */
  readerLabel?: string;
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
        "rankingKey": "major-lake-area",
        "title": "主要湖沼面積",
        "readerLabel": "主要湖沼面積",
        "hook": "主要湖沼面積が最も広い県は？"
      },
      {
        "rankingKey": "prefectural-nature-park-area",
        "title": "都道府県立自然公園面積",
        "readerLabel": "都道府県立自然公園面積",
        "hook": "都道府県立自然公園面積が最も広い県は？"
      },
      {
        "rankingKey": "road-length-per-km2",
        "title": "道路実延長",
        "readerLabel": "道路実延長",
        "hook": "道路実延長が最も長い県は？"
      },
      {
        "rankingKey": "prefectural-natural-park-count",
        "title": "都道府県立自然公園数",
        "readerLabel": "都道府県立自然公園数",
        "hook": "都道府県立自然公園数が最も多い県は？"
      },
      {
        "rankingKey": "nature-park-area",
        "title": "自然公園面積",
        "readerLabel": "自然公園面積",
        "hook": "自然公園面積が最も広い県は？"
      },
      {
        "rankingKey": "annual-sunshine-duration",
        "title": "年間日照時間",
        "readerLabel": "日照時間",
        "hook": "日照時間が最も長い県は？"
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
        "readerLabel": "共働き世帯割合",
        "hook": "共働き世帯割合が最も高い県は？"
      },
      {
        "rankingKey": "pneumonia-death-count",
        "title": "肺炎による死亡者数",
        "readerLabel": "肺炎による死亡者数",
        "hook": "肺炎による死亡者数が最も多い県は？"
      },
      {
        "rankingKey": "deaths-diabetes",
        "title": "糖尿病による死亡者数",
        "readerLabel": "糖尿病による死亡者数",
        "hook": "糖尿病による死亡者数が最も多い県は？"
      },
      {
        "rankingKey": "deaths-lifestyle-diseases",
        "title": "生活習慣病による死亡者数",
        "readerLabel": "生活習慣病による死亡者数",
        "hook": "生活習慣病による死亡者数が最も多い県は？"
      },
      {
        "rankingKey": "crude-birth-rate",
        "title": "粗出生率",
        "readerLabel": "粗出生率",
        "hook": "粗出生率が最も高い県は？"
      },
      {
        "rankingKey": "deaths-hypertensive-diseases",
        "title": "高血圧性疾患による死亡者数",
        "readerLabel": "高血圧性疾患による死亡者数",
        "hook": "高血圧性疾患による死亡者数が最も多い県は？"
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
        "readerLabel": "デザイナーの平均年収",
        "hook": "デザイナーの平均年収が最も高い県は？"
      },
      {
        "rankingKey": "security-guard-annual-income",
        "title": "警備員の平均年収",
        "readerLabel": "警備員の平均年収",
        "hook": "警備員の平均年収が最も高い県は？"
      },
      {
        "rankingKey": "software-engineer-annual-income",
        "title": "ソフトウェア作成者の平均年収",
        "readerLabel": "ソフトウェア作成者の平均年収",
        "hook": "ソフトウェア作成者の平均年収が最も高い県は？"
      },
      {
        "rankingKey": "labor-expenses-prefecture",
        "title": "労働費",
        "readerLabel": "労働費",
        "hook": "労働費が最も多い県は？"
      },
      {
        "rankingKey": "housework-avg-time-female",
        "title": "家事の平均時間",
        "readerLabel": "家事の平均時間",
        "hook": "家事の平均時間が最も長い県は？"
      },
      {
        "rankingKey": "meal-avg-time-female",
        "title": "食事の平均時間",
        "readerLabel": "食事の平均時間",
        "hook": "食事の平均時間が最も長い県は？"
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
        "readerLabel": "漁業就業者数",
        "hook": "漁業就業者数が最も多い県は？"
      },
      {
        "rankingKey": "marine-fishery-aquaculture-output-value",
        "title": "海面漁業・養殖業産出額",
        "readerLabel": "海面漁業・養殖業産出額",
        "hook": "海面漁業・養殖業産出額が最も多い県は？"
      },
      {
        "rankingKey": "fishery-species-catch-mackerel",
        "title": "サバ類漁獲量",
        "readerLabel": "サバ類漁獲量",
        "hook": "サバ類漁獲量が最も多い県は？"
      },
      {
        "rankingKey": "fishery-species-catch-sardine",
        "title": "イワシ類漁獲量",
        "readerLabel": "イワシ類漁獲量",
        "hook": "イワシ類漁獲量が最も多い県は？"
      },
      {
        "rankingKey": "fishery-species-catch-scallop",
        "title": "ホタテガイ漁獲量",
        "readerLabel": "ホタテガイ漁獲量",
        "hook": "ホタテガイ漁獲量が最も多い県は？"
      },
      {
        "rankingKey": "fishery-species-catch-tuna",
        "title": "マグロ類漁獲量",
        "readerLabel": "マグロ類漁獲量",
        "hook": "マグロ類漁獲量が最も多い県は？"
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
        "readerLabel": "製造業付加価値額",
        "hook": "製造業付加価値額が最も多い県は？"
      },
      {
        "rankingKey": "manufacturing-shipment-amount-per-establishment",
        "title": "製造品出荷額等",
        "readerLabel": "製造品出荷額等",
        "hook": "製造品出荷額等が最も多い県は？"
      },
      {
        "rankingKey": "manufacturing-employees",
        "title": "製造業従業者数",
        "readerLabel": "製造業従業者数",
        "hook": "製造業従業者数が最も多い県は？"
      },
      {
        "rankingKey": "manufacturing-net-value-added-private",
        "title": "純付加価値額（製造業）",
        "readerLabel": "純付加価値額（製造業）",
        "hook": "純付加価値額（製造業）が最も多い県は？"
      },
      {
        "rankingKey": "industrial-land-price-change-rate",
        "title": "標準価格変動率（工業地）",
        "readerLabel": "標準価格変動率（工業地）",
        "hook": "標準価格変動率（工業地）が最も高い県は？"
      },
      {
        "rankingKey": "manufacturing-sales-private",
        "title": "売上金額（製造業）",
        "readerLabel": "売上金額（製造業）",
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
        "rankingKey": "convenience-store-count-commercial",
        "title": "コンビニエンスストア店舗数",
        "readerLabel": "コンビニエンスストア店舗数",
        "hook": "コンビニエンスストア店舗数が最も多い県は？"
      },
      {
        "rankingKey": "retail-store-count",
        "title": "小売店数",
        "readerLabel": "小売店数",
        "hook": "小売店数が最も多い県は？"
      },
      {
        "rankingKey": "barber-beauty-salon-count",
        "title": "理容・美容所数",
        "readerLabel": "理容・美容所数",
        "hook": "理容・美容所数が最も多い県は？"
      },
      {
        "rankingKey": "manufacturing-establishment-site-area",
        "title": "製造業事業所敷地面積",
        "readerLabel": "製造業事業所敷地面積",
        "hook": "製造業事業所敷地面積が最も広い県は？"
      },
      {
        "rankingKey": "manufacturing-establishments",
        "title": "製造業事業所数",
        "readerLabel": "製造業事業所数",
        "hook": "製造業事業所数が最も多い県は？"
      },
      {
        "rankingKey": "public-bath-count",
        "title": "公衆浴場数",
        "readerLabel": "公衆浴場数",
        "hook": "公衆浴場数が最も多い県は？"
      }
    ]
  },
  {
    "categoryKey": "economy",
    "categoryName": "企業・家計・経済",
    "count": 816,
    "representatives": [
      {
        "rankingKey": "natto-consumption-expenditure",
        "title": "納豆消費支出額",
        "readerLabel": "納豆消費支出額",
        "hook": "納豆消費支出額が最も多い県は？"
      },
      {
        "rankingKey": "grilled-eel-consumption-expenditure",
        "title": "うなぎのかば焼き消費支出額",
        "readerLabel": "うなぎのかば焼き消費支出額",
        "hook": "うなぎのかば焼き消費支出額が最も多い県は？"
      },
      {
        "rankingKey": "pork-consumption-quantity",
        "title": "豚肉消費量",
        "readerLabel": "豚肉消費量",
        "hook": "豚肉消費量が最も多い県は？"
      },
      {
        "rankingKey": "beef-consumption-quantity",
        "title": "牛肉消費量",
        "readerLabel": "牛肉消費量",
        "hook": "牛肉消費量が最も多い県は？"
      },
      {
        "rankingKey": "bonito-consumption-quantity",
        "title": "かつお消費量",
        "readerLabel": "かつお消費量",
        "hook": "かつお消費量が最も多い県は？"
      },
      {
        "rankingKey": "bread-consumption-expenditure",
        "title": "パン消費支出額",
        "readerLabel": "パン消費支出額",
        "hook": "パン消費支出額が最も多い県は？"
      }
    ]
  },
  {
    "categoryKey": "construction",
    "categoryName": "住宅・土地・建設",
    "count": 68,
    "representatives": [
      {
        "rankingKey": "floor-area-new-owner-dwelling",
        "title": "着工新設持ち家住宅の床面積",
        "readerLabel": "着工新設持ち家住宅の床面積",
        "hook": "着工新設持ち家住宅の床面積が最も広い県は？"
      },
      {
        "rankingKey": "ordinary-construction-expenses-prefecture",
        "title": "普通建設事業費",
        "readerLabel": "普通建設事業費",
        "hook": "普通建設事業費が最も多い県は？"
      },
      {
        "rankingKey": "new-rental-starts",
        "title": "着工新設貸家数",
        "readerLabel": "着工新設貸家数",
        "hook": "着工新設貸家数が最も多い県は？"
      },
      {
        "rankingKey": "vacant-housing-rate",
        "title": "空き家率",
        "readerLabel": "空き家率",
        "hook": "空き家率が最も高い県は？"
      },
      {
        "rankingKey": "new-condo-starts",
        "title": "着工新設分譲住宅数",
        "readerLabel": "着工新設分譲住宅数",
        "hook": "着工新設分譲住宅数が最も多い県は？"
      },
      {
        "rankingKey": "electrician-annual-income",
        "title": "電気工事従事者の平均年収",
        "readerLabel": "電気工事従事者の平均年収",
        "hook": "電気工事従事者の平均年収が最も高い県は？"
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
        "readerLabel": "最終処分場残余容量",
        "hook": "最終処分場残余容量が最も多い県は？"
      },
      {
        "rankingKey": "gasoline-sales-volume",
        "title": "ガソリン販売量",
        "readerLabel": "ガソリン販売量",
        "hook": "ガソリン販売量が最も多い県は？"
      },
      {
        "rankingKey": "nuclear-power-plant-count",
        "title": "原子力発電所数",
        "readerLabel": "原子力発電所数",
        "hook": "原子力発電所数が最も多い県は？"
      },
      {
        "rankingKey": "utilities-expenditure-ratio-multi-person-households",
        "title": "光熱・水道費割合",
        "readerLabel": "光熱・水道費割合",
        "hook": "光熱・水道費割合が最も高い県は？"
      },
      {
        "rankingKey": "geothermal-power-plant-count",
        "title": "地熱発電施設数",
        "readerLabel": "地熱発電施設数",
        "hook": "地熱発電施設数が最も多い県は？"
      },
      {
        "rankingKey": "hydroelectric-power-plant-count",
        "title": "水力発電所数",
        "readerLabel": "水力発電所数",
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
        "readerLabel": "延べ宿泊者数",
        "hook": "延べ宿泊者数が最も多い県は？"
      },
      {
        "rankingKey": "moped-count",
        "title": "原動機付自転車台数",
        "readerLabel": "原動機付自転車台数",
        "hook": "原動機付自転車台数が最も多い県は？"
      },
      {
        "rankingKey": "total-overnight-guests-foreign",
        "title": "外国人延べ宿泊者数",
        "readerLabel": "外国人延べ宿泊者数",
        "hook": "外国人延べ宿泊者数が最も多い県は？"
      },
      {
        "rankingKey": "kei-car-count",
        "title": "軽自動車等台数",
        "readerLabel": "軽自動車等台数",
        "hook": "軽自動車等台数が最も多い県は？"
      },
      {
        "rankingKey": "motorcycle-count",
        "title": "二輪の小型自動車台数",
        "readerLabel": "二輪の小型自動車台数",
        "hook": "二輪の小型自動車台数が最も多い県は？"
      },
      {
        "rankingKey": "jr-freight-shipment",
        "title": "ＪＲ貨物発送量",
        "readerLabel": "ＪＲ貨物発送量",
        "hook": "ＪＲ貨物発送量が最も多い県は？"
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
        "readerLabel": "小中学校教員の平均年収",
        "hook": "小中学校教員の平均年収が最も高い県は？"
      },
      {
        "rankingKey": "avg-height-high-school-2nd-male",
        "title": "平均身長",
        "readerLabel": "平均身長",
        "hook": "平均身長が最も多い県は？"
      },
      {
        "rankingKey": "swimming-pool-public",
        "title": "水泳プール数（公共）",
        "readerLabel": "水泳プール数（公共）",
        "hook": "水泳プール数（公共）が最も多い県は？"
      },
      {
        "rankingKey": "elementary-school-children-count",
        "title": "小学校児童数",
        "readerLabel": "小学校児童数",
        "hook": "小学校児童数が最も多い県は？"
      },
      {
        "rankingKey": "library-books",
        "title": "図書館蔵書数",
        "readerLabel": "図書館蔵書数",
        "hook": "図書館蔵書数が最も多い県は？"
      },
      {
        "rankingKey": "miscellaneous-school-count",
        "title": "各種学校数",
        "readerLabel": "各種学校数",
        "hook": "各種学校数が最も多い県は？"
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
        "readerLabel": "地方交付税",
        "hook": "地方交付税が最も多い県は？"
      },
      {
        "rankingKey": "local-allocation-tax-ratio-pref-finance",
        "title": "地方交付税割合",
        "readerLabel": "地方交付税割合",
        "hook": "地方交付税割合が最も高い県は？"
      },
      {
        "rankingKey": "local-tax-prefecture",
        "title": "地方税",
        "readerLabel": "地方税",
        "hook": "地方税が最も多い県は？"
      },
      {
        "rankingKey": "public-enterprise-accounting-staff",
        "title": "公営企業等会計部門職員数",
        "readerLabel": "公営企業等会計部門職員数",
        "hook": "公営企業等会計部門職員数が最も多い県は？"
      },
      {
        "rankingKey": "avg-salary-education-prefecture",
        "title": "教育公務員 平均給与月額",
        "readerLabel": "教育公務員平均給与月額",
        "hook": "教育公務員平均給与月額が最も多い県は？"
      },
      {
        "rankingKey": "avg-salary-police-prefecture",
        "title": "警察職 平均給与月額",
        "readerLabel": "警察職平均給与月額",
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
        "rankingKey": "theft-offenses-recognized",
        "title": "窃盗犯認知件数",
        "readerLabel": "窃盗犯認知件数",
        "hook": "窃盗犯認知件数が最も多い県は？"
      },
      {
        "rankingKey": "fire-department-pump-car-count-per-100-thousand-people",
        "title": "消防ポンプ自動車等現有数",
        "readerLabel": "消防ポンプ自動車等現有数",
        "hook": "消防ポンプ自動車等現有数が最も多い県は？"
      },
      {
        "rankingKey": "per-capita-police-expenditure-pref-municipal",
        "title": "警察費",
        "readerLabel": "警察費",
        "hook": "警察費が最も多い県は？"
      },
      {
        "rankingKey": "serious-crime-per-100k",
        "title": "凶悪犯認知件数",
        "readerLabel": "凶悪犯認知件数",
        "hook": "凶悪犯認知件数が最も多い県は？"
      },
      {
        "rankingKey": "voluntary-car-insurance-rate-bodily-injury",
        "title": "任意自動車保険普及率",
        "readerLabel": "任意自動車保険普及率",
        "hook": "任意自動車保険普及率が最も高い県は？"
      },
      {
        "rankingKey": "food-business-facility-penalties-per-1000",
        "title": "食品営業施設処分件数",
        "readerLabel": "食品営業施設処分件数",
        "hook": "食品営業施設処分件数が最も多い県は？"
      }
    ]
  },
  {
    "categoryKey": "socialsecurity",
    "categoryName": "社会保障・衛生",
    "count": 246,
    "representatives": [
      {
        "rankingKey": "psychiatric-bed-count",
        "title": "精神病床数",
        "readerLabel": "精神病床数",
        "hook": "精神病床数が最も多い県は？"
      },
      {
        "rankingKey": "abortion-rate",
        "title": "人工妊娠中絶実施率",
        "readerLabel": "人工妊娠中絶実施率",
        "hook": "人工妊娠中絶実施率が最も高い県は？"
      },
      {
        "rankingKey": "midwife-count",
        "title": "助産師数",
        "readerLabel": "助産師数",
        "hook": "助産師数が最も多い県は？"
      },
      {
        "rankingKey": "physical-disability-certificates-issued",
        "title": "身体障害者手帳交付数",
        "readerLabel": "身体障害者手帳交付数",
        "hook": "身体障害者手帳交付数が最も多い県は？"
      },
      {
        "rankingKey": "physicians-in-medical-facilities",
        "title": "医師数",
        "readerLabel": "医師数",
        "hook": "医師数が最も多い県は？"
      },
      {
        "rankingKey": "public-health-nurse-count",
        "title": "保健師数",
        "readerLabel": "保健師数",
        "hook": "保健師数が最も多い県は？"
      }
    ]
  },
  {
    "categoryKey": "international",
    "categoryName": "国際",
    "count": 8,
    "representatives": [
      {
        "rankingKey": "resident-foreigner-china",
        "title": "在留外国人数（中国）",
        "readerLabel": "在留外国人数（中国）",
        "hook": "在留外国人数（中国）が最も多い県は？"
      },
      {
        "rankingKey": "foreign-population-per-100k",
        "title": "外国人人口（人口10万人当たり）",
        "readerLabel": "外国人人口（人口10万人当たり）",
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
        "readerLabel": "主要道路舗装率",
        "hook": "主要道路舗装率が最も高い県は？"
      },
      {
        "rankingKey": "port-inbound-ships",
        "title": "入港船舶隻数（港湾統計）",
        "readerLabel": "入港船舶隻数（港湾統計）",
        "hook": "入港船舶隻数（港湾統計）が最も多い県は？"
      },
      {
        "rankingKey": "port-container-count",
        "title": "コンテナ取扱個数（港湾統計）",
        "readerLabel": "コンテナ取扱個数（港湾統計）",
        "hook": "コンテナ取扱個数（港湾統計）が最も多い県は？"
      },
      {
        "rankingKey": "railway-passengers",
        "title": "鉄道駅 乗降客数",
        "readerLabel": "鉄道駅乗降客数",
        "hook": "鉄道駅乗降客数が最も多い県は？"
      },
      {
        "rankingKey": "port-cargo-export",
        "title": "輸出貨物量（港湾統計）",
        "readerLabel": "輸出貨物量（港湾統計）",
        "hook": "輸出貨物量（港湾統計）が最も多い県は？"
      },
      {
        "rankingKey": "port-ships-tonnage",
        "title": "入港船舶総トン数（港湾統計）",
        "readerLabel": "入港船舶総トン数（港湾統計）",
        "hook": "入港船舶総トン数（港湾統計）が最も多い県は？"
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
        "readerLabel": "公衆電話設置台数",
        "hook": "公衆電話設置台数が最も多い県は？"
      },
      {
        "rankingKey": "post-office-count",
        "title": "郵便局数",
        "readerLabel": "郵便局数",
        "hook": "郵便局数が最も多い県は？"
      },
      {
        "rankingKey": "transport-communication-expenditure-ratio-multi-person-households",
        "title": "交通・通信費割合",
        "readerLabel": "交通・通信費割合",
        "hook": "交通・通信費割合が最も高い県は？"
      },
      {
        "rankingKey": "telephone-subscription-count",
        "title": "電話加入数",
        "readerLabel": "電話加入数",
        "hook": "電話加入数が最も多い県は？"
      },
      {
        "rankingKey": "average-broadcast-media-consumption-time-employed-woman",
        "title": "テレビ・ラジオ・新聞・雑誌の平均時間",
        "readerLabel": "テレビ・ラジオ・新聞・雑誌の平均時間",
        "hook": "テレビ・ラジオ・新聞・雑誌の平均時間が最も長い県は？"
      },
      {
        "rankingKey": "mobile-phone-contract-count-per-1000",
        "title": "携帯電話契約数",
        "readerLabel": "携帯電話契約数",
        "hook": "携帯電話契約数が最も多い県は？"
      }
    ]
  }
];

export const HOME_FEATURED_PROMINENCE: ReadonlyArray<HomeFeaturedProminence> =
  [
  {
    "rankingKey": "natto-consumption-expenditure",
    "title": "納豆消費支出額",
    "readerLabel": "納豆消費支出額",
    "hook": "納豆消費支出額が最も多い県は？",
    "categoryKey": "economy",
    "order": 1
  },
  {
    "rankingKey": "local-allocation-tax-prefecture",
    "title": "地方交付税",
    "readerLabel": "地方交付税",
    "hook": "地方交付税が最も多い県は？",
    "categoryKey": "administrativefinancial",
    "order": 2
  },
  {
    "rankingKey": "psychiatric-bed-count",
    "title": "精神病床数",
    "readerLabel": "精神病床数",
    "hook": "精神病床数が最も多い県は？",
    "categoryKey": "socialsecurity",
    "order": 3
  },
  {
    "rankingKey": "fishery-workers",
    "title": "漁業就業者数",
    "readerLabel": "漁業就業者数",
    "hook": "漁業就業者数が最も多い県は？",
    "categoryKey": "agriculture",
    "order": 4
  },
  {
    "rankingKey": "main-road-paving-rate",
    "title": "主要道路舗装率",
    "readerLabel": "主要道路舗装率",
    "hook": "主要道路舗装率が最も高い県は？",
    "categoryKey": "infrastructure",
    "order": 5
  },
  {
    "rankingKey": "manufacturing-industry-added-value",
    "title": "製造業付加価値額",
    "readerLabel": "製造業付加価値額",
    "hook": "製造業付加価値額が最も多い県は？",
    "categoryKey": "miningindustry",
    "order": 6
  },
  {
    "rankingKey": "public-phone-count",
    "title": "公衆電話設置台数",
    "readerLabel": "公衆電話設置台数",
    "hook": "公衆電話設置台数が最も多い県は？",
    "categoryKey": "ict",
    "order": 7
  },
  {
    "rankingKey": "convenience-store-count-commercial",
    "title": "コンビニエンスストア店舗数",
    "readerLabel": "コンビニエンスストア店舗数",
    "hook": "コンビニエンスストア店舗数が最も多い県は？",
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
  "major-lake-area",
  "prefectural-nature-park-area",
  "road-length-per-km2",
  "prefectural-natural-park-count",
  "nature-park-area",
  "annual-sunshine-duration",
  "dual-income-household-ratio",
  "pneumonia-death-count",
  "deaths-diabetes",
  "deaths-lifestyle-diseases",
  "crude-birth-rate",
  "deaths-hypertensive-diseases",
  "designer-annual-income",
  "security-guard-annual-income",
  "software-engineer-annual-income",
  "labor-expenses-prefecture",
  "housework-avg-time-female",
  "meal-avg-time-female",
  "fishery-workers",
  "marine-fishery-aquaculture-output-value",
  "fishery-species-catch-mackerel",
  "fishery-species-catch-sardine",
  "fishery-species-catch-scallop",
  "fishery-species-catch-tuna",
  "manufacturing-industry-added-value",
  "manufacturing-shipment-amount-per-establishment",
  "manufacturing-employees",
  "manufacturing-net-value-added-private",
  "industrial-land-price-change-rate",
  "manufacturing-sales-private",
  "convenience-store-count-commercial",
  "retail-store-count",
  "barber-beauty-salon-count",
  "manufacturing-establishment-site-area",
  "manufacturing-establishments",
  "public-bath-count",
  "natto-consumption-expenditure",
  "grilled-eel-consumption-expenditure",
  "pork-consumption-quantity",
  "beef-consumption-quantity",
  "bonito-consumption-quantity",
  "bread-consumption-expenditure",
  "floor-area-new-owner-dwelling",
  "ordinary-construction-expenses-prefecture",
  "new-rental-starts",
  "vacant-housing-rate",
  "new-condo-starts",
  "electrician-annual-income",
  "final-disposal-site-remaining-capacity",
  "gasoline-sales-volume",
  "nuclear-power-plant-count",
  "utilities-expenditure-ratio-multi-person-households",
  "geothermal-power-plant-count",
  "hydroelectric-power-plant-count",
  "total-overnight-guests",
  "moped-count",
  "total-overnight-guests-foreign",
  "kei-car-count",
  "motorcycle-count",
  "jr-freight-shipment",
  "school-teacher-annual-income",
  "avg-height-high-school-2nd-male",
  "swimming-pool-public",
  "elementary-school-children-count",
  "library-books",
  "miscellaneous-school-count",
  "local-allocation-tax-prefecture",
  "local-allocation-tax-ratio-pref-finance",
  "local-tax-prefecture",
  "public-enterprise-accounting-staff",
  "avg-salary-education-prefecture",
  "avg-salary-police-prefecture",
  "theft-offenses-recognized",
  "fire-department-pump-car-count-per-100-thousand-people",
  "per-capita-police-expenditure-pref-municipal",
  "serious-crime-per-100k",
  "voluntary-car-insurance-rate-bodily-injury",
  "food-business-facility-penalties-per-1000",
  "psychiatric-bed-count",
  "abortion-rate",
  "midwife-count",
  "physical-disability-certificates-issued",
  "physicians-in-medical-facilities",
  "public-health-nurse-count",
  "resident-foreigner-china",
  "foreign-population-per-100k",
  "main-road-paving-rate",
  "port-inbound-ships",
  "port-container-count",
  "railway-passengers",
  "port-cargo-export",
  "port-ships-tonnage",
  "public-phone-count",
  "post-office-count",
  "transport-communication-expenditure-ratio-multi-person-households",
  "telephone-subscription-count",
  "average-broadcast-media-consumption-time-employed-woman",
  "mobile-phone-contract-count-per-1000"
];
