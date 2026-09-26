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
    "count": 40,
    "representatives": [
      {
        "rankingKey": "road-length-per-km2",
        "title": "道路実延長",
        "readerLabel": "道路実延長",
        "hook": "道路実延長が最も長い県は？"
      },
      {
        "rankingKey": "quasi-national-park-area",
        "title": "国定公園面積",
        "readerLabel": "国定公園面積",
        "hook": "国定公園面積が最も広い県は？"
      },
      {
        "rankingKey": "annual-sunshine-duration",
        "title": "年間日照時間",
        "readerLabel": "日照時間",
        "hook": "日照時間が最も長い県は？"
      },
      {
        "rankingKey": "major-lake-area",
        "title": "主要湖沼面積",
        "readerLabel": "主要湖沼面積",
        "hook": "主要湖沼面積が最も広い県は？"
      },
      {
        "rankingKey": "prefectural-natural-park-count",
        "title": "都道府県立自然公園数",
        "readerLabel": "都道府県立自然公園数",
        "hook": "都道府県立自然公園数が最も多い県は？"
      },
      {
        "rankingKey": "prefectural-nature-park-area",
        "title": "都道府県立自然公園面積",
        "readerLabel": "都道府県立自然公園面積",
        "hook": "都道府県立自然公園面積が最も広い県は？"
      }
    ]
  },
  {
    "categoryKey": "population",
    "categoryName": "人口・世帯",
    "count": 149,
    "representatives": [
      {
        "rankingKey": "crude-birth-rate",
        "title": "粗出生率",
        "readerLabel": "粗出生率",
        "hook": "粗出生率が最も高い県は？"
      },
      {
        "rankingKey": "japanese-population",
        "title": "日本人人口",
        "readerLabel": "日本人人口",
        "hook": "日本人人口が最も多い県は？"
      },
      {
        "rankingKey": "dual-income-household-ratio",
        "title": "共働き世帯割合",
        "readerLabel": "共働き世帯割合",
        "hook": "共働き世帯割合が最も高い県は？"
      },
      {
        "rankingKey": "births",
        "title": "出生数",
        "readerLabel": "出生数",
        "hook": "出生数が最も多い県は？"
      },
      {
        "rankingKey": "deaths-hypertensive-diseases",
        "title": "高血圧性疾患による死亡者数",
        "readerLabel": "高血圧性疾患による死亡者数",
        "hook": "高血圧性疾患による死亡者数が最も多い県は？"
      },
      {
        "rankingKey": "divorces",
        "title": "離婚件数",
        "readerLabel": "離婚件数",
        "hook": "離婚件数が最も多い県は？"
      }
    ]
  },
  {
    "categoryKey": "laborwage",
    "categoryName": "労働・賃金",
    "count": 117,
    "representatives": [
      {
        "rankingKey": "sleep-avg-time-female",
        "title": "睡眠の平均時間",
        "readerLabel": "睡眠の平均時間",
        "hook": "睡眠の平均時間が最も長い県は？"
      },
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
        "rankingKey": "employed-people-ratio-tertiary",
        "title": "第3次産業就業者比率",
        "readerLabel": "第3次産業就業者比率",
        "hook": "第3次産業就業者比率が最も高い県は？"
      },
      {
        "rankingKey": "disabled-employment-rate",
        "title": "障害者就職率",
        "readerLabel": "障害者就職率",
        "hook": "障害者就職率が最も高い県は？"
      }
    ]
  },
  {
    "categoryKey": "agriculture",
    "categoryName": "農林水産業",
    "count": 75,
    "representatives": [
      {
        "rankingKey": "fishery-workers",
        "title": "漁業就業者数",
        "readerLabel": "漁業就業者数",
        "hook": "漁業就業者数が最も多い県は？"
      },
      {
        "rankingKey": "agricultural-output",
        "title": "農業産出額",
        "readerLabel": "農業産出額",
        "hook": "農業産出額が最も多い県は？"
      },
      {
        "rankingKey": "fishery-species-catch-pacific-saury",
        "title": "サンマ漁獲量",
        "readerLabel": "サンマ漁獲量",
        "hook": "サンマ漁獲量が最も多い県は？"
      },
      {
        "rankingKey": "fishery-species-catch-sardine",
        "title": "イワシ類漁獲量",
        "readerLabel": "イワシ類漁獲量",
        "hook": "イワシ類漁獲量が最も多い県は？"
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
      }
    ]
  },
  {
    "categoryKey": "miningindustry",
    "categoryName": "鉱工業",
    "count": 9,
    "representatives": [
      {
        "rankingKey": "manufacturing-shipment-amount",
        "title": "製造品出荷額等",
        "readerLabel": "製造品出荷額等",
        "hook": "製造品出荷額等が最も多い県は？"
      },
      {
        "rankingKey": "manufacturing-industry-added-value",
        "title": "製造業付加価値額",
        "readerLabel": "製造業付加価値額",
        "hook": "製造業付加価値額が最も多い県は？"
      },
      {
        "rankingKey": "manufacturing-employees",
        "title": "製造業従業者数",
        "readerLabel": "製造業従業者数",
        "hook": "製造業従業者数が最も多い県は？"
      },
      {
        "rankingKey": "food-manufacturing-employees",
        "title": "食料品製造業の従業者数",
        "readerLabel": "食料品製造業の従業者数",
        "hook": "食料品製造業の従業者数が最も多い県は？"
      },
      {
        "rankingKey": "food-manufacturing-shipment-amount",
        "title": "食料品製造業の製造品出荷額等",
        "readerLabel": "食料品製造業の製造品出荷額等",
        "hook": "食料品製造業の製造品出荷額等が最も多い県は？"
      },
      {
        "rankingKey": "food-manufacturing-establishments",
        "title": "食料品製造業の事業所数",
        "readerLabel": "食料品製造業の事業所数",
        "hook": "食料品製造業の事業所数が最も多い県は？"
      }
    ]
  },
  {
    "categoryKey": "commercial",
    "categoryName": "商業・サービス業",
    "count": 77,
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
        "rankingKey": "pachinko-shop-density-per-10k",
        "title": "パチンコ店舗数",
        "readerLabel": "パチンコ店舗数",
        "hook": "パチンコ店舗数が最も多い県は？"
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
      }
    ]
  },
  {
    "categoryKey": "economy",
    "categoryName": "企業・家計・経済",
    "count": 868,
    "representatives": [
      {
        "rankingKey": "natto-consumption-expenditure",
        "title": "納豆消費支出額",
        "readerLabel": "納豆への支出",
        "hook": "納豆への支出が最も多い県は？"
      },
      {
        "rankingKey": "beef-consumption-quantity",
        "title": "牛肉消費量",
        "readerLabel": "牛肉消費量",
        "hook": "牛肉消費量が最も多い県は？"
      },
      {
        "rankingKey": "rice-consumption-quantity",
        "title": "米消費量",
        "readerLabel": "米消費量",
        "hook": "米消費量が最も多い県は？"
      },
      {
        "rankingKey": "tuna-consumption-quantity",
        "title": "まぐろ消費量",
        "readerLabel": "まぐろ消費量",
        "hook": "まぐろ消費量が最も多い県は？"
      },
      {
        "rankingKey": "icecream-consumption-expenditure",
        "title": "アイスクリーム・シャーベット消費支出額",
        "readerLabel": "アイスクリーム・シャーベットへの支出",
        "hook": "アイスクリーム・シャーベットへの支出が最も多い県は？"
      },
      {
        "rankingKey": "banana-consumption-quantity",
        "title": "バナナ消費量",
        "readerLabel": "バナナ消費量",
        "hook": "バナナ消費量が最も多い県は？"
      }
    ]
  },
  {
    "categoryKey": "construction",
    "categoryName": "住宅・土地・建設",
    "count": 83,
    "representatives": [
      {
        "rankingKey": "ordinary-construction-expenses-prefecture",
        "title": "普通建設事業費",
        "readerLabel": "普通建設事業費",
        "hook": "普通建設事業費が最も多い県は？"
      },
      {
        "rankingKey": "owner-occupied-housing-ratio",
        "title": "持ち家比率",
        "readerLabel": "持ち家比率",
        "hook": "持ち家比率が最も高い県は？"
      },
      {
        "rankingKey": "floor-area-new-owner-dwelling",
        "title": "着工新設持ち家住宅の床面積",
        "readerLabel": "着工新設持ち家住宅の床面積",
        "hook": "着工新設持ち家住宅の床面積が最も広い県は？"
      },
      {
        "rankingKey": "carpenter-annual-income",
        "title": "大工の平均年収",
        "readerLabel": "大工の平均年収",
        "hook": "大工の平均年収が最も高い県は？"
      },
      {
        "rankingKey": "new-rental-starts",
        "title": "着工新設貸家数",
        "readerLabel": "着工新設貸家数",
        "hook": "着工新設貸家数が最も多い県は？"
      },
      {
        "rankingKey": "architect-annual-income",
        "title": "建築技術者の平均年収",
        "readerLabel": "建築技術者の平均年収",
        "hook": "建築技術者の平均年収が最も高い県は？"
      }
    ]
  },
  {
    "categoryKey": "energy",
    "categoryName": "エネルギー・水",
    "count": 22,
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
        "rankingKey": "utilities-expenditure-ratio-multi-person-households",
        "title": "光熱・水道費割合",
        "readerLabel": "光熱・水道費割合",
        "hook": "光熱・水道費割合が最も高い県は？"
      },
      {
        "rankingKey": "industrial-water-usage",
        "title": "工業用水量",
        "readerLabel": "工業用水量",
        "hook": "工業用水量が最も多い県は？"
      },
      {
        "rankingKey": "fit-fip-installed-capacity",
        "title": "FIT・FIP再エネ導入設備容量",
        "readerLabel": "FIT・FIP再エネ導入設備容量",
        "hook": "FIT・FIP再エネ導入設備容量が最も多い県は？"
      },
      {
        "rankingKey": "regional-household-final-energy-consumption",
        "title": "家庭部門の最終エネルギー消費量",
        "readerLabel": "家庭部門の最終エネルギー消費量",
        "hook": "家庭部門の最終エネルギー消費量が最も多い県は？"
      }
    ]
  },
  {
    "categoryKey": "tourism",
    "categoryName": "運輸・観光",
    "count": 44,
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
      },
      {
        "rankingKey": "commute-by-bicycle",
        "title": "自宅外通勤・通学者数（自転車）",
        "readerLabel": "自宅外通勤・通学者数（自転車）",
        "hook": "自宅外通勤・通学者数（自転車）が最も多い県は？"
      }
    ]
  },
  {
    "categoryKey": "educationsports",
    "categoryName": "教育・文化・スポーツ",
    "count": 270,
    "representatives": [
      {
        "rankingKey": "specialized-school-students",
        "title": "専修学校生徒数",
        "readerLabel": "専修学校生徒数",
        "hook": "専修学校生徒数が最も多い県は？"
      },
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
      }
    ]
  },
  {
    "categoryKey": "administrativefinancial",
    "categoryName": "行財政",
    "count": 142,
    "representatives": [
      {
        "rankingKey": "local-allocation-tax-prefecture",
        "title": "地方交付税",
        "readerLabel": "地方交付税",
        "hook": "地方交付税が最も多い県は？"
      },
      {
        "rankingKey": "local-tax-prefecture",
        "title": "地方税",
        "readerLabel": "地方税",
        "hook": "地方税が最も多い県は？"
      },
      {
        "rankingKey": "national-treasury-disbursement-prefecture",
        "title": "国庫支出金",
        "readerLabel": "国庫支出金",
        "hook": "国庫支出金が最も多い県は？"
      },
      {
        "rankingKey": "avg-salary-police-prefecture",
        "title": "警察職 平均給与月額",
        "readerLabel": "警察職平均給与月額",
        "hook": "警察職平均給与月額が最も多い県は？"
      },
      {
        "rankingKey": "subsidy-expenses-prefecture",
        "title": "補助費等",
        "readerLabel": "補助費等",
        "hook": "補助費等が最も多い県は？"
      },
      {
        "rankingKey": "local-allocation-tax-ratio-pref-finance",
        "title": "地方交付税割合",
        "readerLabel": "地方交付税割合",
        "hook": "地方交付税割合が最も高い県は？"
      }
    ]
  },
  {
    "categoryKey": "safetyenvironment",
    "categoryName": "司法・安全・環境",
    "count": 141,
    "representatives": [
      {
        "rankingKey": "per-capita-police-expenditure-pref-municipal",
        "title": "警察費",
        "readerLabel": "警察費",
        "hook": "警察費が最も多い県は？"
      },
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
        "rankingKey": "police-officer-count",
        "title": "警察官数",
        "readerLabel": "警察官数",
        "hook": "警察官数が最も多い県は？"
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
      }
    ]
  },
  {
    "categoryKey": "socialsecurity",
    "categoryName": "社会保障・衛生",
    "count": 285,
    "representatives": [
      {
        "rankingKey": "physical-disability-certificates-issued",
        "title": "身体障害者手帳交付数",
        "readerLabel": "身体障害者手帳交付数",
        "hook": "身体障害者手帳交付数が最も多い県は？"
      },
      {
        "rankingKey": "psychiatric-bed-count",
        "title": "精神病床数",
        "readerLabel": "精神病床数",
        "hook": "精神病床数が最も多い県は？"
      },
      {
        "rankingKey": "stillbirths-after-22-weeks",
        "title": "死産数",
        "readerLabel": "死産数",
        "hook": "死産数が最も多い県は？"
      },
      {
        "rankingKey": "psychiatric-hospital-avg-length-of-stay",
        "title": "精神科病院平均在院日数",
        "readerLabel": "精神科病院平均在院日数",
        "hook": "精神科病院平均在院日数が最も多い県は？"
      },
      {
        "rankingKey": "abortion-rate",
        "title": "人工妊娠中絶実施率",
        "readerLabel": "人工妊娠中絶実施率",
        "hook": "人工妊娠中絶実施率が最も高い県は？"
      },
      {
        "rankingKey": "death-count",
        "title": "死亡数",
        "readerLabel": "死亡数",
        "hook": "死亡数が最も多い県は？"
      }
    ]
  },
  {
    "categoryKey": "international",
    "categoryName": "国際",
    "count": 7,
    "representatives": [
      {
        "rankingKey": "resident-foreigner-china",
        "title": "在留外国人数（中国）",
        "readerLabel": "在留外国人数（中国）",
        "hook": "在留外国人数（中国）が最も多い県は？"
      }
    ]
  },
  {
    "categoryKey": "infrastructure",
    "categoryName": "社会基盤施設",
    "count": 57,
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
        "rankingKey": "railway-passengers",
        "title": "鉄道駅 乗降客数",
        "readerLabel": "鉄道駅乗降客数",
        "hook": "鉄道駅乗降客数が最も多い県は？"
      },
      {
        "rankingKey": "port-container-count",
        "title": "コンテナ取扱個数（港湾統計）",
        "readerLabel": "コンテナ取扱個数（港湾統計）",
        "hook": "コンテナ取扱個数（港湾統計）が最も多い県は？"
      },
      {
        "rankingKey": "sewage-treatment-coverage-rate",
        "title": "汚水処理人口普及率",
        "readerLabel": "汚水処理人口普及率",
        "hook": "汚水処理人口普及率が最も高い県は？"
      },
      {
        "rankingKey": "port-cargo-export",
        "title": "輸出貨物量（港湾統計）",
        "readerLabel": "輸出貨物量（港湾統計）",
        "hook": "輸出貨物量（港湾統計）が最も多い県は？"
      }
    ]
  },
  {
    "categoryKey": "ict",
    "categoryName": "情報通信・科学技術",
    "count": 22,
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
        "rankingKey": "telephone-subscription-count",
        "title": "電話加入数",
        "readerLabel": "電話加入数",
        "hook": "電話加入数が最も多い県は？"
      },
      {
        "rankingKey": "information-communication-coefficient",
        "title": "情報通信係数",
        "readerLabel": "情報通信係数",
        "hook": "情報通信係数が最も多い県は？"
      },
      {
        "rankingKey": "transport-communication-expenditure-ratio-multi-person-households",
        "title": "交通・通信費割合",
        "readerLabel": "交通・通信費割合",
        "hook": "交通・通信費割合が最も高い県は？"
      },
      {
        "rankingKey": "information-communication-expenditure",
        "title": "情報通信関係費",
        "readerLabel": "情報通信関係費",
        "hook": "情報通信関係費が最も多い県は？"
      }
    ]
  }
];

export const HOME_FEATURED_PROMINENCE: ReadonlyArray<HomeFeaturedProminence> =
  [
  {
    "rankingKey": "natto-consumption-expenditure",
    "title": "納豆消費支出額",
    "readerLabel": "納豆への支出",
    "hook": "納豆への支出が最も多い県は？",
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
    "rankingKey": "fishery-workers",
    "title": "漁業就業者数",
    "readerLabel": "漁業就業者数",
    "hook": "漁業就業者数が最も多い県は？",
    "categoryKey": "agriculture",
    "order": 3
  },
  {
    "rankingKey": "manufacturing-shipment-amount",
    "title": "製造品出荷額等",
    "readerLabel": "製造品出荷額等",
    "hook": "製造品出荷額等が最も多い県は？",
    "categoryKey": "miningindustry",
    "order": 4
  },
  {
    "rankingKey": "physical-disability-certificates-issued",
    "title": "身体障害者手帳交付数",
    "readerLabel": "身体障害者手帳交付数",
    "hook": "身体障害者手帳交付数が最も多い県は？",
    "categoryKey": "socialsecurity",
    "order": 5
  },
  {
    "rankingKey": "public-phone-count",
    "title": "公衆電話設置台数",
    "readerLabel": "公衆電話設置台数",
    "hook": "公衆電話設置台数が最も多い県は？",
    "categoryKey": "ict",
    "order": 6
  },
  {
    "rankingKey": "specialized-school-students",
    "title": "専修学校生徒数",
    "readerLabel": "専修学校生徒数",
    "hook": "専修学校生徒数が最も多い県は？",
    "categoryKey": "educationsports",
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
  "road-length-per-km2",
  "quasi-national-park-area",
  "annual-sunshine-duration",
  "major-lake-area",
  "prefectural-natural-park-count",
  "prefectural-nature-park-area",
  "crude-birth-rate",
  "japanese-population",
  "dual-income-household-ratio",
  "births",
  "deaths-hypertensive-diseases",
  "divorces",
  "sleep-avg-time-female",
  "designer-annual-income",
  "security-guard-annual-income",
  "software-engineer-annual-income",
  "employed-people-ratio-tertiary",
  "disabled-employment-rate",
  "fishery-workers",
  "agricultural-output",
  "fishery-species-catch-pacific-saury",
  "fishery-species-catch-sardine",
  "marine-fishery-aquaculture-output-value",
  "fishery-species-catch-mackerel",
  "manufacturing-shipment-amount",
  "manufacturing-industry-added-value",
  "manufacturing-employees",
  "food-manufacturing-employees",
  "food-manufacturing-shipment-amount",
  "food-manufacturing-establishments",
  "convenience-store-count-commercial",
  "retail-store-count",
  "barber-beauty-salon-count",
  "pachinko-shop-density-per-10k",
  "manufacturing-establishment-site-area",
  "manufacturing-establishments",
  "natto-consumption-expenditure",
  "beef-consumption-quantity",
  "rice-consumption-quantity",
  "tuna-consumption-quantity",
  "icecream-consumption-expenditure",
  "banana-consumption-quantity",
  "ordinary-construction-expenses-prefecture",
  "owner-occupied-housing-ratio",
  "floor-area-new-owner-dwelling",
  "carpenter-annual-income",
  "new-rental-starts",
  "architect-annual-income",
  "final-disposal-site-remaining-capacity",
  "gasoline-sales-volume",
  "utilities-expenditure-ratio-multi-person-households",
  "industrial-water-usage",
  "fit-fip-installed-capacity",
  "regional-household-final-energy-consumption",
  "total-overnight-guests",
  "moped-count",
  "kei-car-count",
  "motorcycle-count",
  "jr-freight-shipment",
  "commute-by-bicycle",
  "specialized-school-students",
  "school-teacher-annual-income",
  "avg-height-high-school-2nd-male",
  "swimming-pool-public",
  "elementary-school-children-count",
  "library-books",
  "local-allocation-tax-prefecture",
  "local-tax-prefecture",
  "national-treasury-disbursement-prefecture",
  "avg-salary-police-prefecture",
  "subsidy-expenses-prefecture",
  "local-allocation-tax-ratio-pref-finance",
  "per-capita-police-expenditure-pref-municipal",
  "theft-offenses-recognized",
  "fire-department-pump-car-count-per-100-thousand-people",
  "police-officer-count",
  "serious-crime-per-100k",
  "voluntary-car-insurance-rate-bodily-injury",
  "physical-disability-certificates-issued",
  "psychiatric-bed-count",
  "stillbirths-after-22-weeks",
  "psychiatric-hospital-avg-length-of-stay",
  "abortion-rate",
  "death-count",
  "resident-foreigner-china",
  "main-road-paving-rate",
  "port-inbound-ships",
  "railway-passengers",
  "port-container-count",
  "sewage-treatment-coverage-rate",
  "port-cargo-export",
  "public-phone-count",
  "post-office-count",
  "telephone-subscription-count",
  "information-communication-coefficient",
  "transport-communication-expenditure-ratio-multi-person-households",
  "information-communication-expenditure"
];
