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
  /** 分母・内訳 (config の subtitle)。名前は metricDisplayName で組み立てる */
  subtitle?: string;
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
        "rankingKey": "annual-sunshine-duration",
        "title": "年間日照時間",
        "readerLabel": "日照時間",
        "hook": "日照時間が最も長い県は？"
      },
      {
        "rankingKey": "quasi-national-park-area",
        "title": "国定公園面積",
        "readerLabel": "国定公園面積",
        "hook": "国定公園面積が最も広い県は？"
      },
      {
        "rankingKey": "total-area-excluding-northern-territories-and-takeshima",
        "title": "総面積",
        "readerLabel": "総面積",
        "subtitle": "北方地域及び竹島を除く",
        "hook": "総面積が最も広い県は？"
      },
      {
        "rankingKey": "road-length-per-km2",
        "title": "道路実延長",
        "readerLabel": "道路実延長",
        "subtitle": "総面積1km²当たり",
        "hook": "道路実延長が最も長い県は？"
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
      }
    ]
  },
  {
    "categoryKey": "population",
    "categoryName": "人口・世帯",
    "count": 156,
    "representatives": [
      {
        "rankingKey": "births",
        "title": "出生数",
        "readerLabel": "出生数",
        "hook": "出生数が最も多い県は？"
      },
      {
        "rankingKey": "crude-birth-rate",
        "title": "粗出生率",
        "readerLabel": "粗出生率",
        "hook": "粗出生率が最も高い県は？"
      },
      {
        "rankingKey": "divorces",
        "title": "離婚件数",
        "readerLabel": "離婚件数",
        "hook": "離婚件数が最も多い県は？"
      },
      {
        "rankingKey": "japanese-population",
        "title": "日本人人口",
        "readerLabel": "日本人人口",
        "hook": "日本人人口が最も多い県は？"
      },
      {
        "rankingKey": "deaths-hypertensive-diseases",
        "title": "高血圧性疾患による死亡者数",
        "readerLabel": "高血圧性疾患による死亡者数",
        "subtitle": "総数",
        "hook": "高血圧性疾患による死亡者数が最も多い県は？"
      },
      {
        "rankingKey": "deaths-lifestyle-diseases",
        "title": "生活習慣病による死亡者数",
        "readerLabel": "生活習慣病による死亡者数",
        "subtitle": "総数",
        "hook": "生活習慣病による死亡者数が最も多い県は？"
      }
    ]
  },
  {
    "categoryKey": "laborwage",
    "categoryName": "労働・賃金",
    "count": 117,
    "representatives": [
      {
        "rankingKey": "turnover-rate",
        "title": "離職率",
        "readerLabel": "離職率",
        "hook": "離職率が最も高い県は？"
      },
      {
        "rankingKey": "sleep-avg-time-female",
        "title": "睡眠の平均時間",
        "readerLabel": "睡眠の平均時間",
        "subtitle": "女性",
        "hook": "睡眠の平均時間が最も長い県は？"
      },
      {
        "rankingKey": "nurse-annual-income",
        "title": "看護師の平均年収",
        "readerLabel": "看護師の平均年収",
        "hook": "看護師の平均年収が最も高い県は？"
      },
      {
        "rankingKey": "meal-avg-time-male",
        "title": "食事の平均時間",
        "readerLabel": "食事の平均時間",
        "subtitle": "男性",
        "hook": "食事の平均時間が最も長い県は？"
      },
      {
        "rankingKey": "relaxation-avg-time-male",
        "title": "休養・くつろぎの平均時間",
        "readerLabel": "休養・くつろぎの平均時間",
        "subtitle": "男性",
        "hook": "休養・くつろぎの平均時間が最も長い県は？"
      },
      {
        "rankingKey": "software-engineer-annual-income",
        "title": "ソフトウェア作成者の平均年収",
        "readerLabel": "ソフトウェア作成者の平均年収",
        "hook": "ソフトウェア作成者の平均年収が最も高い県は？"
      }
    ]
  },
  {
    "categoryKey": "agriculture",
    "categoryName": "農林水産業",
    "count": 75,
    "representatives": [
      {
        "rankingKey": "fishery-species-catch-mackerel",
        "title": "サバ類漁獲量",
        "readerLabel": "サバ類漁獲量",
        "hook": "サバ類漁獲量が最も多い県は？"
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
        "rankingKey": "fishery-workers",
        "title": "漁業就業者数",
        "readerLabel": "漁業就業者数",
        "hook": "漁業就業者数が最も多い県は？"
      },
      {
        "rankingKey": "fishery-species-catch-bonito",
        "title": "カツオ漁獲量",
        "readerLabel": "カツオ漁獲量",
        "hook": "カツオ漁獲量が最も多い県は？"
      },
      {
        "rankingKey": "fishery-species-catch-pollock",
        "title": "スケトウダラ漁獲量",
        "readerLabel": "スケトウダラ漁獲量",
        "hook": "スケトウダラ漁獲量が最も多い県は？"
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
        "subtitle": "総額",
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
        "rankingKey": "food-manufacturing-establishments",
        "title": "食料品製造業の事業所数",
        "readerLabel": "食料品製造業の事業所数",
        "subtitle": "中分類09・個人経営を除く全規模・再集計参考値",
        "hook": "食料品製造業の事業所数が最も多い県は？"
      },
      {
        "rankingKey": "food-manufacturing-shipment-amount",
        "title": "食料品製造業の製造品出荷額等",
        "readerLabel": "食料品製造業の製造品出荷額等",
        "subtitle": "中分類09・個人経営を除く全規模・再集計参考値",
        "hook": "食料品製造業の製造品出荷額等が最も多い県は？"
      },
      {
        "rankingKey": "food-manufacturing-employees",
        "title": "食料品製造業の従業者数",
        "readerLabel": "食料品製造業の従業者数",
        "subtitle": "中分類09・個人経営を除く全規模・再集計参考値",
        "hook": "食料品製造業の従業者数が最も多い県は？"
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
        "subtitle": "総数",
        "hook": "小売店数が最も多い県は？"
      },
      {
        "rankingKey": "barber-beauty-salon-count",
        "title": "理容・美容所数",
        "readerLabel": "理容・美容所数",
        "subtitle": "総数",
        "hook": "理容・美容所数が最も多い県は？"
      },
      {
        "rankingKey": "pachinko-shop-density-per-10k",
        "title": "パチンコ店舗数",
        "readerLabel": "パチンコ店舗数",
        "subtitle": "人口1万人あたり",
        "hook": "パチンコ店舗数が最も多い県は？"
      },
      {
        "rankingKey": "manufacturing-establishments",
        "title": "製造業事業所数",
        "readerLabel": "製造業事業所数",
        "hook": "製造業事業所数が最も多い県は？"
      },
      {
        "rankingKey": "annual-sales-amount-per-employee",
        "title": "商業年間商品販売額",
        "readerLabel": "商業年間商品販売額",
        "subtitle": "従業員当たり",
        "hook": "商業年間商品販売額が最も多い県は？"
      }
    ]
  },
  {
    "categoryKey": "economy",
    "categoryName": "企業・家計・経済",
    "count": 885,
    "representatives": [
      {
        "rankingKey": "natto-consumption-expenditure",
        "title": "納豆消費支出額",
        "readerLabel": "納豆への支出",
        "subtitle": "都道府県庁所在市の二人以上世帯の年間納豆消費支出額",
        "hook": "納豆への支出が最も多い県は？"
      },
      {
        "rankingKey": "other-bread-consumption-quantity",
        "title": "他のパン消費量",
        "readerLabel": "他のパン消費量",
        "subtitle": "都道府県庁所在市の二人以上世帯の年間他のパン消費量",
        "hook": "他のパン消費量が最も多い県は？"
      },
      {
        "rankingKey": "rice-consumption-quantity",
        "title": "米消費量",
        "readerLabel": "米消費量",
        "subtitle": "都道府県庁所在市の二人以上世帯の年間米消費量",
        "hook": "米消費量が最も多い県は？"
      },
      {
        "rankingKey": "tuna-consumption-quantity",
        "title": "まぐろ消費量",
        "readerLabel": "まぐろ消費量",
        "subtitle": "都道府県庁所在市の二人以上世帯の年間まぐろ消費量",
        "hook": "まぐろ消費量が最も多い県は？"
      },
      {
        "rankingKey": "icecream-consumption-expenditure",
        "title": "アイスクリーム・シャーベット消費支出額",
        "readerLabel": "アイスクリーム・シャーベットへの支出",
        "subtitle": "都道府県庁所在市の二人以上世帯の年間アイスクリーム・シャーベット消費支出額",
        "hook": "アイスクリーム・シャーベットへの支出が最も多い県は？"
      },
      {
        "rankingKey": "apple-consumption-quantity",
        "title": "りんご消費量",
        "readerLabel": "りんご消費量",
        "subtitle": "都道府県庁所在市の二人以上世帯の年間りんご消費量",
        "hook": "りんご消費量が最も多い県は？"
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
        "subtitle": "都道府県財政",
        "hook": "普通建設事業費が最も多い県は？"
      },
      {
        "rankingKey": "owner-occupied-housing-ratio",
        "title": "持ち家比率",
        "readerLabel": "持ち家比率",
        "hook": "持ち家比率が最も高い県は？"
      },
      {
        "rankingKey": "carpenter-annual-income",
        "title": "大工の平均年収",
        "readerLabel": "大工の平均年収",
        "hook": "大工の平均年収が最も高い県は？"
      },
      {
        "rankingKey": "floor-area-new-owner-dwelling",
        "title": "着工新設持ち家住宅の床面積",
        "readerLabel": "着工新設持ち家住宅の床面積",
        "hook": "着工新設持ち家住宅の床面積が最も広い県は？"
      },
      {
        "rankingKey": "public-construction-contract-count",
        "title": "公共工事の請負契約件数",
        "readerLabel": "公共工事の請負契約件数",
        "subtitle": "施工都道府県別・1件500万円以上",
        "hook": "公共工事の請負契約件数が最も多い県は？"
      },
      {
        "rankingKey": "new-housing-starts",
        "title": "着工新設住宅戸数",
        "readerLabel": "着工新設住宅戸数",
        "hook": "着工新設住宅戸数が最も多い県は？"
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
        "rankingKey": "regional-household-final-energy-consumption",
        "title": "家庭部門の最終エネルギー消費量",
        "readerLabel": "家庭部門の最終エネルギー消費量",
        "hook": "家庭部門の最終エネルギー消費量が最も多い県は？"
      },
      {
        "rankingKey": "regional-industry-final-energy-consumption",
        "title": "産業部門の最終エネルギー消費量",
        "readerLabel": "産業部門の最終エネルギー消費量",
        "hook": "産業部門の最終エネルギー消費量が最も多い県は？"
      },
      {
        "rankingKey": "utilities-expenditure-ratio-multi-person-households",
        "title": "光熱・水道費割合",
        "readerLabel": "光熱・水道費割合",
        "hook": "光熱・水道費割合が最も高い県は？"
      },
      {
        "rankingKey": "regional-business-final-energy-consumption",
        "title": "業務他部門の最終エネルギー消費量",
        "readerLabel": "業務他部門の最終エネルギー消費量",
        "hook": "業務他部門の最終エネルギー消費量が最も多い県は？"
      }
    ]
  },
  {
    "categoryKey": "tourism",
    "categoryName": "運輸・観光",
    "count": 45,
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
        "rankingKey": "domestic-travel-consumption-by-destination",
        "title": "日本人旅行者の県内消費額",
        "readerLabel": "日本人旅行者の県内消費額",
        "subtitle": "全目的・宿泊と日帰り",
        "hook": "日本人旅行者の県内消費額が最も多い県は？"
      },
      {
        "rankingKey": "inbound-visitors-by-destination",
        "title": "訪日外国人の都道府県別訪問者数",
        "readerLabel": "訪日外国人の都道府県別訪問者数",
        "subtitle": "2025年・全目的・一般客",
        "hook": "訪日外国人の都道府県別訪問者数が最も多い県は？"
      }
    ]
  },
  {
    "categoryKey": "educationsports",
    "categoryName": "教育・文化・スポーツ",
    "count": 277,
    "representatives": [
      {
        "rankingKey": "avg-height-high-school-2nd-male",
        "title": "平均身長",
        "readerLabel": "平均身長",
        "subtitle": "高校2年・男子",
        "hook": "平均身長が最も多い県は？"
      },
      {
        "rankingKey": "specialized-school-students",
        "title": "専修学校生徒数",
        "readerLabel": "専修学校生徒数",
        "subtitle": "総数",
        "hook": "専修学校生徒数が最も多い県は？"
      },
      {
        "rankingKey": "school-teacher-annual-income",
        "title": "小中学校教員の平均年収",
        "readerLabel": "小中学校教員の平均年収",
        "hook": "小中学校教員の平均年収が最も高い県は？"
      },
      {
        "rankingKey": "miscellaneous-school-students",
        "title": "各種学校生徒数",
        "readerLabel": "各種学校生徒数",
        "subtitle": "総数",
        "hook": "各種学校生徒数が最も多い県は？"
      },
      {
        "rankingKey": "swimming-pool-public",
        "title": "水泳プール数（公共）",
        "readerLabel": "水泳プール数（公共）",
        "subtitle": "屋内・屋外合計",
        "hook": "水泳プール数（公共）が最も多い県は？"
      },
      {
        "rankingKey": "elementary-school-children-count",
        "title": "小学校児童数",
        "readerLabel": "小学校児童数",
        "subtitle": "総数",
        "hook": "小学校児童数が最も多い県は？"
      }
    ]
  },
  {
    "categoryKey": "administrativefinancial",
    "categoryName": "行財政",
    "count": 143,
    "representatives": [
      {
        "rankingKey": "local-allocation-tax-prefecture",
        "title": "地方交付税",
        "readerLabel": "地方交付税",
        "subtitle": "都道府県財政",
        "hook": "地方交付税が最も多い県は？"
      },
      {
        "rankingKey": "local-tax-prefecture",
        "title": "地方税",
        "readerLabel": "地方税",
        "subtitle": "都道府県財政",
        "hook": "地方税が最も多い県は？"
      },
      {
        "rankingKey": "national-treasury-disbursement-prefecture",
        "title": "国庫支出金",
        "readerLabel": "国庫支出金",
        "subtitle": "都道府県財政",
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
        "subtitle": "都道府県財政",
        "hook": "補助費等が最も多い県は？"
      },
      {
        "rankingKey": "local-allocation-tax-ratio-pref-finance",
        "title": "地方交付税割合",
        "readerLabel": "地方交付税割合",
        "subtitle": "都道府県財政",
        "hook": "地方交付税割合が最も高い県は？"
      }
    ]
  },
  {
    "categoryKey": "safetyenvironment",
    "categoryName": "司法・安全・環境",
    "count": 146,
    "representatives": [
      {
        "rankingKey": "per-capita-police-expenditure-pref-municipal",
        "title": "警察費",
        "readerLabel": "警察費",
        "subtitle": "都道府県財政",
        "hook": "警察費が最も多い県は？"
      },
      {
        "rankingKey": "serious-crime-per-100k",
        "title": "凶悪犯認知件数",
        "readerLabel": "凶悪犯認知件数",
        "hook": "凶悪犯認知件数が最も多い県は？"
      },
      {
        "rankingKey": "theft-offenses-recognized",
        "title": "窃盗犯認知件数",
        "readerLabel": "窃盗犯認知件数",
        "subtitle": "総数",
        "hook": "窃盗犯認知件数が最も多い県は？"
      },
      {
        "rankingKey": "fire-deaths-per-100k",
        "title": "火災死亡者数",
        "readerLabel": "火災死亡者数",
        "hook": "火災死亡者数が最も多い県は？"
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
        "subtitle": "総数",
        "hook": "警察官数が最も多い県は？"
      }
    ]
  },
  {
    "categoryKey": "socialsecurity",
    "categoryName": "社会保障・衛生",
    "count": 291,
    "representatives": [
      {
        "rankingKey": "physical-disability-certificates-issued",
        "title": "身体障害者手帳交付数",
        "readerLabel": "身体障害者手帳交付数",
        "subtitle": "総数",
        "hook": "身体障害者手帳交付数が最も多い県は？"
      },
      {
        "rankingKey": "psychiatric-bed-count",
        "title": "精神病床数",
        "readerLabel": "精神病床数",
        "subtitle": "総数",
        "hook": "精神病床数が最も多い県は？"
      },
      {
        "rankingKey": "early-neonatal-deaths",
        "title": "早期新生児死亡数",
        "readerLabel": "早期新生児死亡数",
        "hook": "早期新生児死亡数が最も多い県は？"
      },
      {
        "rankingKey": "stillbirths-after-22-weeks",
        "title": "死産数",
        "readerLabel": "死産数",
        "subtitle": "妊娠22週以後",
        "hook": "死産数が最も多い県は？"
      },
      {
        "rankingKey": "death-count",
        "title": "死亡数",
        "readerLabel": "死亡数",
        "hook": "死亡数が最も多い県は？"
      },
      {
        "rankingKey": "psychiatric-hospital-avg-length-of-stay",
        "title": "精神科病院平均在院日数",
        "readerLabel": "精神科病院平均在院日数",
        "hook": "精神科病院平均在院日数が最も多い県は？"
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
        "subtitle": "中国出身",
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
        "rankingKey": "road-expressway-length",
        "title": "道路実延長（高速道路）",
        "readerLabel": "道路実延長（高速道路）",
        "subtitle": "高速道路のみ",
        "hook": "道路実延長（高速道路）が最も長い県は？"
      },
      {
        "rankingKey": "main-road-paving-rate",
        "title": "主要道路舗装率",
        "readerLabel": "主要道路舗装率",
        "hook": "主要道路舗装率が最も高い県は？"
      },
      {
        "rankingKey": "railway-passengers",
        "title": "鉄道駅 乗降客数",
        "readerLabel": "鉄道駅乗降客数",
        "hook": "鉄道駅乗降客数が最も多い県は？"
      },
      {
        "rankingKey": "port-inbound-ships",
        "title": "入港船舶隻数（港湾統計）",
        "readerLabel": "入港船舶隻数（港湾統計）",
        "subtitle": "港湾統計調査",
        "hook": "入港船舶隻数（港湾統計）が最も多い県は？"
      },
      {
        "rankingKey": "port-container-count",
        "title": "コンテナ取扱個数（港湾統計）",
        "readerLabel": "コンテナ取扱個数（港湾統計）",
        "hook": "コンテナ取扱個数（港湾統計）が最も多い県は？"
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
    "count": 24,
    "representatives": [
      {
        "rankingKey": "public-phone-count",
        "title": "公衆電話設置台数",
        "readerLabel": "公衆電話設置台数",
        "subtitle": "総数",
        "hook": "公衆電話設置台数が最も多い県は？"
      },
      {
        "rankingKey": "post-office-count",
        "title": "郵便局数",
        "readerLabel": "郵便局数",
        "subtitle": "総数",
        "hook": "郵便局数が最も多い県は？"
      },
      {
        "rankingKey": "telephone-subscription-count",
        "title": "電話加入数",
        "readerLabel": "電話加入数",
        "subtitle": "総数",
        "hook": "電話加入数が最も多い県は？"
      },
      {
        "rankingKey": "information-communication-coefficient",
        "title": "情報通信係数",
        "readerLabel": "情報通信係数",
        "subtitle": "都道府県庁所在市の二人以上世帯の消費支出に占める情報通信関係費（通信料・放送受信料）の割合",
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
        "subtitle": "都道府県庁所在市の二人以上世帯の年間支出額（固定電話通信料・移動電話通信料・NHK放送受信料・ケーブルテレビ受信料・他の受信料の合計）",
        "hook": "情報通信関係費が最も多い県は？"
      }
    ]
  }
];

export const HOME_FEATURED_PROMINENCE: ReadonlyArray<HomeFeaturedProminence> =
  [
  {
    "rankingKey": "annual-sunshine-duration",
    "title": "年間日照時間",
    "readerLabel": "日照時間",
    "hook": "日照時間が最も長い県は？",
    "categoryKey": "landweather",
    "order": 1
  },
  {
    "rankingKey": "avg-height-high-school-2nd-male",
    "title": "平均身長",
    "readerLabel": "平均身長",
    "subtitle": "高校2年・男子",
    "hook": "平均身長が最も多い県は？",
    "categoryKey": "educationsports",
    "order": 2
  },
  {
    "rankingKey": "public-phone-count",
    "title": "公衆電話設置台数",
    "readerLabel": "公衆電話設置台数",
    "subtitle": "総数",
    "hook": "公衆電話設置台数が最も多い県は？",
    "categoryKey": "ict",
    "order": 3
  },
  {
    "rankingKey": "local-allocation-tax-prefecture",
    "title": "地方交付税",
    "readerLabel": "地方交付税",
    "subtitle": "都道府県財政",
    "hook": "地方交付税が最も多い県は？",
    "categoryKey": "administrativefinancial",
    "order": 4
  },
  {
    "rankingKey": "manufacturing-shipment-amount",
    "title": "製造品出荷額等",
    "readerLabel": "製造品出荷額等",
    "subtitle": "総額",
    "hook": "製造品出荷額等が最も多い県は？",
    "categoryKey": "miningindustry",
    "order": 5
  },
  {
    "rankingKey": "natto-consumption-expenditure",
    "title": "納豆消費支出額",
    "readerLabel": "納豆への支出",
    "subtitle": "都道府県庁所在市の二人以上世帯の年間納豆消費支出額",
    "hook": "納豆への支出が最も多い県は？",
    "categoryKey": "economy",
    "order": 6
  },
  {
    "rankingKey": "fishery-species-catch-mackerel",
    "title": "サバ類漁獲量",
    "readerLabel": "サバ類漁獲量",
    "hook": "サバ類漁獲量が最も多い県は？",
    "categoryKey": "agriculture",
    "order": 7
  },
  {
    "rankingKey": "physical-disability-certificates-issued",
    "title": "身体障害者手帳交付数",
    "readerLabel": "身体障害者手帳交付数",
    "subtitle": "総数",
    "hook": "身体障害者手帳交付数が最も多い県は？",
    "categoryKey": "socialsecurity",
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
  "annual-sunshine-duration",
  "quasi-national-park-area",
  "total-area-excluding-northern-territories-and-takeshima",
  "road-length-per-km2",
  "major-lake-area",
  "prefectural-natural-park-count",
  "births",
  "crude-birth-rate",
  "divorces",
  "japanese-population",
  "deaths-hypertensive-diseases",
  "deaths-lifestyle-diseases",
  "turnover-rate",
  "sleep-avg-time-female",
  "nurse-annual-income",
  "meal-avg-time-male",
  "relaxation-avg-time-male",
  "software-engineer-annual-income",
  "fishery-species-catch-mackerel",
  "fishery-species-catch-pacific-saury",
  "fishery-species-catch-sardine",
  "fishery-workers",
  "fishery-species-catch-bonito",
  "fishery-species-catch-pollock",
  "manufacturing-shipment-amount",
  "manufacturing-industry-added-value",
  "manufacturing-employees",
  "food-manufacturing-establishments",
  "food-manufacturing-shipment-amount",
  "food-manufacturing-employees",
  "convenience-store-count-commercial",
  "retail-store-count",
  "barber-beauty-salon-count",
  "pachinko-shop-density-per-10k",
  "manufacturing-establishments",
  "annual-sales-amount-per-employee",
  "natto-consumption-expenditure",
  "other-bread-consumption-quantity",
  "rice-consumption-quantity",
  "tuna-consumption-quantity",
  "icecream-consumption-expenditure",
  "apple-consumption-quantity",
  "ordinary-construction-expenses-prefecture",
  "owner-occupied-housing-ratio",
  "carpenter-annual-income",
  "floor-area-new-owner-dwelling",
  "public-construction-contract-count",
  "new-housing-starts",
  "final-disposal-site-remaining-capacity",
  "gasoline-sales-volume",
  "regional-household-final-energy-consumption",
  "regional-industry-final-energy-consumption",
  "utilities-expenditure-ratio-multi-person-households",
  "regional-business-final-energy-consumption",
  "total-overnight-guests",
  "moped-count",
  "kei-car-count",
  "motorcycle-count",
  "domestic-travel-consumption-by-destination",
  "inbound-visitors-by-destination",
  "avg-height-high-school-2nd-male",
  "specialized-school-students",
  "school-teacher-annual-income",
  "miscellaneous-school-students",
  "swimming-pool-public",
  "elementary-school-children-count",
  "local-allocation-tax-prefecture",
  "local-tax-prefecture",
  "national-treasury-disbursement-prefecture",
  "avg-salary-police-prefecture",
  "subsidy-expenses-prefecture",
  "local-allocation-tax-ratio-pref-finance",
  "per-capita-police-expenditure-pref-municipal",
  "serious-crime-per-100k",
  "theft-offenses-recognized",
  "fire-deaths-per-100k",
  "fire-department-pump-car-count-per-100-thousand-people",
  "police-officer-count",
  "physical-disability-certificates-issued",
  "psychiatric-bed-count",
  "early-neonatal-deaths",
  "stillbirths-after-22-weeks",
  "death-count",
  "psychiatric-hospital-avg-length-of-stay",
  "resident-foreigner-china",
  "road-expressway-length",
  "main-road-paving-rate",
  "railway-passengers",
  "port-inbound-ships",
  "port-container-count",
  "port-ships-tonnage",
  "public-phone-count",
  "post-office-count",
  "telephone-subscription-count",
  "information-communication-coefficient",
  "transport-communication-expenditure-ratio-multi-person-households",
  "information-communication-expenditure"
];

/**
 * 県データブック (AREA_DATABOOK_TEMPLATE) の指標だけの掲載価値スコア (0〜1)。
 *
 * 県の「特徴」の選定 (packages/area-profile/src/highlights) が、順位の極端さが同じ候補の
 * タイブレークに使う。databook.json の exporter が焼き込み、Web と SNS は焼き込み値を読む。
 */
export const AREA_HIGHLIGHT_PROMINENCE: Readonly<Record<string, number>> =
  {
  "active-job-opening-ratio": 0.35,
  "agricultural-output": 0.775,
  "annual-precipitation": 0.55,
  "annual-sunshine-duration": 1,
  "average-age-of-first-marriage-husband": 0.26,
  "average-age-of-first-marriage-wife": 0.555,
  "average-height-high-school-second-grade-female": 0.4488,
  "average-relative-humidity": 0.55,
  "average-temperature": 0.55,
  "average-weight-high-school-second-grade-female": 0.3363,
  "average-weight-high-school-second-grade-male": 0.28,
  "avg-height-high-school-2nd-male": 1,
  "barber-beauty-salon-count-per-100k": 0.28,
  "beef-cattle-count": 0.6313,
  "beef-consumption-quantity": 0.8805,
  "certified-childcare-center-count-per-100k-0-5": 0.35,
  "chicken-consumption-expenditure": 0.6555,
  "chinese-noodles-consumption-expenditure": 0.8242,
  "cleaning-shop-count-per-100k": 0.5188,
  "consumption-expenditure-multi-person-households-per-month": 0.8534,
  "criminal-arrest-rate": 0.55,
  "crude-birth-rate": 0.8313,
  "crude-death-rate": 0.55,
  "cultivated-land-area-ratio": 0.55,
  "culture-recreation-expenditure-ratio-multi-person-households": 0.575,
  "current-savings-balance-multi-person-households": 0.2688,
  "dairy-cattle-count": 0.6313,
  "disaster-damage-amount-per-person": 0.48,
  "education-expenditure-ratio-multi-person-households": 0.575,
  "elderly-couple-only-household-ratio": 0.4424,
  "employee-ratio-10-29-employee-establishments-private": 0.4387,
  "engel-coefficient": 0.8242,
  "female-scheduled-earnings": 0.4063,
  "final-energy-consumption-per-capita": 0.35,
  "financial-debt-balance": 0.4625,
  "floor-area-per-dwelling-owner": 0.565,
  "food-expenditure-ratio-multi-person-households": 0.6387,
  "food-self-sufficiency-rate-calorie": 0.7488,
  "foreign-resident-count-per-100k": 0.3892,
  "forest-area-ratio": 0.2938,
  "fresh-udon-soba-consumption-expenditure": 0.5992,
  "future-population-change-rate-2050": 0.5188,
  "gas-station-count-per-100km": 0.5721,
  "general-clinic-count-per-100k": 0.48,
  "general-hospital-count-per-100k": 0.48,
  "green-tea-consumption-expenditure": 0.5992,
  "households": 0.7404,
  "households-on-public-assistance-per-1000": 0.28,
  "kindergarten-count-per-100k-3-5": 0.55,
  "layer-hen-count": 0.575,
  "library-count-per-million": 0.6438,
  "life-expectancy-0-female": 0.635,
  "life-expectancy-0-male": 0.3962,
  "male-scheduled-earnings": 0.35,
  "manufacturing-establishments": 0.7188,
  "manufacturing-industry-added-value": 0.8313,
  "manufacturing-shipment-amount": 0.9437,
  "manufacturing-shipment-amount-per-employee": 0.48,
  "marine-aquaculture-harvest": 0.55,
  "marine-fishery-catch": 0.55,
  "museum-count-per-million": 0.7324,
  "nature-park-area-ratio": 0.55,
  "owner-occupied-housing-ratio": 0.7779,
  "penal-code-offenses-recognized-per-1000": 0.5925,
  "per-capita-prefectural-income-h27": 0.5975,
  "physicians-in-medical-facilities-per-100k": 0.48,
  "pig-count": 0.6313,
  "police-officer-count-per-population": 0.4459,
  "population-density-per-km2-total-area": 0.7188,
  "post-office-count-per-100km2": 0.48,
  "residential-land-price-change-rate": 0.4063,
  "rice-harvest-volume": 0.4063,
  "sake-consumption-expenditure": 0.768,
  "self-financing-ratio": 0.55,
  "sewage-treatment-coverage-rate": 0.6875,
  "single-person-household-ratio": 0.6842,
  "suicide-rate-per-100k": 0.5308,
  "taxpayer-ratio-per-pref-resident": 0.55,
  "total-area-excluding-northern-territories-and-takeshima": 0.775,
  "total-overnight-guests": 0.7601,
  "total-overnight-guests-foreign": 0.5351,
  "total-population": 0.55,
  "total-production-in-the-prefecture": 0.4213,
  "traffic-accident-count": 0.55,
  "transport-communication-expenditure-ratio-multi-person-households": 0.6284,
  "unemployment-rate": 0.6449,
  "water-supply-population-ratio-2012on": 0.35
};
