/**
 * AUTO-GENERATED — 手編集禁止
 *
 * 生成コマンド: npm run generate:ranking-prominence --workspace apps/web
 * 真実源: data/metrics/*.ts (git TS) + GSC snapshot (git 管理下)
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
    "count": 40,
    "representatives": [
      {
        "rankingKey": "total-area-excluding-northern-territories-and-takeshima",
        "title": "総面積",
        "readerLabel": "総面積",
        "subtitle": "北方地域及び竹島を除く",
        "hook": "総面積が最も広い県は？"
      },
      {
        "rankingKey": "annual-sunshine-duration",
        "title": "年間日照時間",
        "readerLabel": "日照時間",
        "hook": "日照時間が最も長い県は？"
      },
      {
        "rankingKey": "habitable-area",
        "title": "可住地面積",
        "readerLabel": "可住地面積",
        "hook": "可住地面積が最も広い県は？"
      },
      {
        "rankingKey": "lowest-temperature",
        "title": "最低気温",
        "readerLabel": "最低気温",
        "subtitle": "日最低気温の月平均の最低値",
        "hook": "最低気温が最も高い県は？"
      },
      {
        "rankingKey": "national-park-area",
        "title": "国立公園面積",
        "readerLabel": "国立公園面積",
        "hook": "国立公園面積が最も広い県は？"
      },
      {
        "rankingKey": "road-length-per-km2",
        "title": "道路実延長",
        "readerLabel": "道路実延長",
        "subtitle": "総面積1km²当たり",
        "hook": "道路実延長が最も長い県は？"
      }
    ]
  },
  {
    "categoryKey": "population",
    "categoryName": "人口・世帯",
    "count": 144,
    "representatives": [
      {
        "rankingKey": "total-population",
        "title": "総人口",
        "readerLabel": "人口",
        "subtitle": "総数",
        "hook": "人口が最も多い県は？"
      },
      {
        "rankingKey": "births",
        "title": "出生数",
        "readerLabel": "出生数",
        "hook": "出生数が最も多い県は？"
      },
      {
        "rankingKey": "population-density-per-km2-inhabitable-area",
        "title": "可住地面積１km2当たり人口密度",
        "readerLabel": "可住地面積１km2当たり人口密度",
        "subtitle": "可住地1km²当たり",
        "hook": "可住地面積１km2当たり人口密度が最も高い県は？"
      },
      {
        "rankingKey": "young-population-ratio",
        "title": "15歳未満人口割合",
        "readerLabel": "15歳未満人口割合",
        "hook": "15歳未満人口割合が最も高い県は？"
      },
      {
        "rankingKey": "average-age-of-first-marriage-wife",
        "title": "平均初婚年齢（妻）",
        "readerLabel": "平均初婚年齢（妻）",
        "subtitle": "妻の年齢",
        "hook": "平均初婚年齢（妻）が最も高い県は？"
      },
      {
        "rankingKey": "dual-income-household-ratio",
        "title": "共働き世帯割合",
        "readerLabel": "共働き世帯割合",
        "hook": "共働き世帯割合が最も高い県は？"
      }
    ]
  },
  {
    "categoryKey": "laborwage",
    "categoryName": "労働・賃金",
    "count": 121,
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
        "rankingKey": "employed-people-ratio-primary",
        "title": "第1次産業就業者比率",
        "readerLabel": "第1次産業就業者比率",
        "hook": "第1次産業就業者比率が最も高い県は？"
      },
      {
        "rankingKey": "active-job-opening-ratio",
        "title": "有効求人倍率",
        "readerLabel": "有効求人倍率",
        "hook": "有効求人倍率が最も高い県は？"
      },
      {
        "rankingKey": "minimum-wage-by-region",
        "title": "地域別最低賃金",
        "readerLabel": "地域別最低賃金",
        "hook": "地域別最低賃金が最も高い県は？"
      },
      {
        "rankingKey": "regular-cash-salary-male",
        "title": "きまって支給する現金給与月額",
        "readerLabel": "きまって支給する現金給与月額",
        "subtitle": "男性",
        "hook": "きまって支給する現金給与月額が最も多い県は？"
      }
    ]
  },
  {
    "categoryKey": "agriculture",
    "categoryName": "農林水産業",
    "count": 74,
    "representatives": [
      {
        "rankingKey": "fishery-species-catch-mackerel",
        "title": "サバ類漁獲量",
        "readerLabel": "サバ類漁獲量",
        "hook": "サバ類漁獲量が最も多い県は？"
      },
      {
        "rankingKey": "aquaculture-harvest",
        "title": "養殖収獲量",
        "readerLabel": "養殖収獲量",
        "hook": "養殖収獲量が最も多い県は？"
      },
      {
        "rankingKey": "fishery-species-catch-bonito",
        "title": "カツオ漁獲量",
        "readerLabel": "カツオ漁獲量",
        "hook": "カツオ漁獲量が最も多い県は？"
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
        "rankingKey": "fishery-species-catch-snow-crab",
        "title": "ズワイガニ漁獲量",
        "readerLabel": "ズワイガニ漁獲量",
        "hook": "ズワイガニ漁獲量が最も多い県は？"
      }
    ]
  },
  {
    "categoryKey": "miningindustry",
    "categoryName": "鉱工業",
    "count": 7,
    "representatives": [
      {
        "rankingKey": "manufacturing-shipment-amount",
        "title": "製造品出荷額等",
        "readerLabel": "製造品出荷額等",
        "subtitle": "総額",
        "hook": "製造品出荷額等が最も多い県は？"
      },
      {
        "rankingKey": "manufacturing-employees",
        "title": "製造業従業者数",
        "readerLabel": "製造業従業者数",
        "hook": "製造業従業者数が最も多い県は？"
      },
      {
        "rankingKey": "manufacturing-industry-added-value",
        "title": "製造業付加価値額",
        "readerLabel": "製造業付加価値額",
        "hook": "製造業付加価値額が最も多い県は？"
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
    "count": 69,
    "representatives": [
      {
        "rankingKey": "annual-sales-amount",
        "title": "商業年間商品販売額",
        "readerLabel": "商業年間商品販売額",
        "subtitle": "総額",
        "hook": "商業年間商品販売額が最も多い県は？"
      },
      {
        "rankingKey": "manufacturing-establishments",
        "title": "製造業事業所数",
        "readerLabel": "製造業事業所数",
        "hook": "製造業事業所数が最も多い県は？"
      },
      {
        "rankingKey": "barber-beauty-salon-count",
        "title": "理容・美容所数",
        "readerLabel": "理容・美容所数",
        "subtitle": "総数",
        "hook": "理容・美容所数が最も多い県は？"
      },
      {
        "rankingKey": "manufacturing-establishment-site-area",
        "title": "製造業事業所敷地面積",
        "readerLabel": "製造業事業所敷地面積",
        "hook": "製造業事業所敷地面積が最も広い県は？"
      },
      {
        "rankingKey": "public-bath-count",
        "title": "公衆浴場数",
        "readerLabel": "公衆浴場数",
        "subtitle": "総数",
        "hook": "公衆浴場数が最も多い県は？"
      },
      {
        "rankingKey": "convenience-store-count-commercial",
        "title": "コンビニエンスストア店舗数",
        "readerLabel": "コンビニエンスストア店舗数",
        "hook": "コンビニエンスストア店舗数が最も多い県は？"
      }
    ]
  },
  {
    "categoryKey": "economy",
    "categoryName": "企業・家計・経済",
    "count": 1016,
    "representatives": [
      {
        "rankingKey": "natto-consumption-expenditure",
        "title": "納豆消費支出額",
        "readerLabel": "納豆への支出",
        "hook": "納豆への支出が最も多い都市は？"
      },
      {
        "rankingKey": "soba-udon-dining-consumption-expenditure",
        "title": "日本そば・うどん消費支出額",
        "readerLabel": "日本そば・うどんへの支出",
        "subtitle": "外食の食事代",
        "hook": "日本そば・うどんへの支出が最も多い都市は？"
      },
      {
        "rankingKey": "bread-consumption-quantity",
        "title": "パン消費量",
        "readerLabel": "パン消費量",
        "subtitle": "食パンと他のパンの合計",
        "hook": "パン消費量が最も多い都市は？"
      },
      {
        "rankingKey": "rice-consumption-quantity",
        "title": "米消費量",
        "readerLabel": "米消費量",
        "hook": "米消費量が最も多い都市は？"
      },
      {
        "rankingKey": "icecream-consumption-expenditure",
        "title": "アイスクリーム・シャーベット消費支出額",
        "readerLabel": "アイスクリーム・シャーベットへの支出",
        "hook": "アイスクリーム・シャーベットへの支出が最も多い都市は？"
      },
      {
        "rankingKey": "bacon-consumption-expenditure",
        "title": "ベーコン消費支出額",
        "readerLabel": "ベーコンへの支出",
        "hook": "ベーコンへの支出が最も多い都市は？"
      }
    ]
  },
  {
    "categoryKey": "construction",
    "categoryName": "住宅・土地・建設",
    "count": 82,
    "representatives": [
      {
        "rankingKey": "new-condo-starts",
        "title": "着工新設分譲住宅数",
        "readerLabel": "着工新設分譲住宅数",
        "hook": "着工新設分譲住宅数が最も多い県は？"
      },
      {
        "rankingKey": "new-housing-starts",
        "title": "着工新設住宅戸数",
        "readerLabel": "着工新設住宅戸数",
        "hook": "着工新設住宅戸数が最も多い県は？"
      },
      {
        "rankingKey": "new-rental-starts",
        "title": "着工新設貸家数",
        "readerLabel": "着工新設貸家数",
        "hook": "着工新設貸家数が最も多い県は？"
      },
      {
        "rankingKey": "ordinary-construction-expenses-prefecture",
        "title": "普通建設事業費",
        "readerLabel": "普通建設事業費",
        "subtitle": "都道府県財政",
        "hook": "普通建設事業費が最も多い県は？"
      },
      {
        "rankingKey": "public-construction-contract-count",
        "title": "公共工事の請負契約件数",
        "readerLabel": "公共工事の請負契約件数",
        "subtitle": "施工都道府県別・1件500万円以上",
        "hook": "公共工事の請負契約件数が最も多い県は？"
      },
      {
        "rankingKey": "floor-area-per-dwelling-owner",
        "title": "持ち家住宅の延べ面積",
        "readerLabel": "持ち家住宅の延べ面積",
        "subtitle": "1住宅当たり",
        "hook": "持ち家住宅の延べ面積が最も広い県は？"
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
        "hook": "光熱・水道費割合が最も高い都市は？"
      },
      {
        "rankingKey": "electricity-demand",
        "title": "電力需要量",
        "readerLabel": "電力需要量",
        "hook": "電力需要量が最も多い県は？"
      },
      {
        "rankingKey": "wind-power-turbine-count",
        "title": "風力発電導入量（設置基数）",
        "readerLabel": "風力発電導入量（設置基数）",
        "subtitle": "風車台数",
        "hook": "風力発電導入量（設置基数）が最も多い県は？"
      },
      {
        "rankingKey": "city-gas-supply-area-households",
        "title": "都市ガス供給区域内世帯数",
        "readerLabel": "都市ガス供給区域内世帯数",
        "hook": "都市ガス供給区域内世帯数が最も多い県は？"
      }
    ]
  },
  {
    "categoryKey": "tourism",
    "categoryName": "運輸・観光",
    "count": 45,
    "representatives": [
      {
        "rankingKey": "moped-count",
        "title": "原動機付自転車台数",
        "readerLabel": "原動機付自転車台数",
        "hook": "原動機付自転車台数が最も多い県は？"
      },
      {
        "rankingKey": "inbound-visitors-by-destination",
        "title": "訪日外国人の都道府県別訪問者数",
        "readerLabel": "訪日外国人の都道府県別訪問者数",
        "subtitle": "2025年・全目的・一般客",
        "hook": "訪日外国人の都道府県別訪問者数が最も多い県は？"
      },
      {
        "rankingKey": "actual-overnight-guests",
        "title": "実宿泊者数",
        "readerLabel": "実宿泊者数",
        "hook": "実宿泊者数が最も多い県は？"
      },
      {
        "rankingKey": "room-utilization-rate",
        "title": "客室稼働率",
        "readerLabel": "客室稼働率",
        "hook": "客室稼働率が最も高い県は？"
      },
      {
        "rankingKey": "total-overnight-guests",
        "title": "延べ宿泊者数",
        "readerLabel": "延べ宿泊者数",
        "hook": "延べ宿泊者数が最も多い県は？"
      },
      {
        "rankingKey": "total-overnight-guests-foreign",
        "title": "外国人延べ宿泊者数",
        "readerLabel": "外国人延べ宿泊者数",
        "hook": "外国人延べ宿泊者数が最も多い県は？"
      }
    ]
  },
  {
    "categoryKey": "educationsports",
    "categoryName": "教育・文化・スポーツ",
    "count": 268,
    "representatives": [
      {
        "rankingKey": "avg-height-high-school-2nd-male",
        "title": "平均身長",
        "readerLabel": "平均身長",
        "subtitle": "高校2年・男子",
        "hook": "平均身長が最も高い県は？"
      },
      {
        "rankingKey": "elementary-school-children-count",
        "title": "小学校児童数",
        "readerLabel": "小学校児童数",
        "subtitle": "総数",
        "hook": "小学校児童数が最も多い県は？"
      },
      {
        "rankingKey": "junior-high-school-students-count",
        "title": "中学校生徒数",
        "readerLabel": "中学校生徒数",
        "subtitle": "総数",
        "hook": "中学校生徒数が最も多い県は？"
      },
      {
        "rankingKey": "elementary-school-count",
        "title": "小学校数",
        "readerLabel": "小学校数",
        "subtitle": "総数",
        "hook": "小学校数が最も多い県は？"
      },
      {
        "rankingKey": "high-school-count",
        "title": "高等学校数",
        "readerLabel": "高等学校数",
        "subtitle": "総数",
        "hook": "高等学校数が最も多い県は？"
      },
      {
        "rankingKey": "junior-high-school-count",
        "title": "中学校数",
        "readerLabel": "中学校数",
        "subtitle": "総数",
        "hook": "中学校数が最も多い県は？"
      }
    ]
  },
  {
    "categoryKey": "administrativefinancial",
    "categoryName": "行財政",
    "count": 139,
    "representatives": [
      {
        "rankingKey": "local-allocation-tax-prefecture",
        "title": "地方交付税",
        "readerLabel": "地方交付税",
        "subtitle": "都道府県財政",
        "hook": "地方交付税が最も多い県は？"
      },
      {
        "rankingKey": "local-bonds-prefecture",
        "title": "地方債",
        "readerLabel": "地方債",
        "subtitle": "都道府県財政",
        "hook": "地方債が最も多い県は？"
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
        "rankingKey": "municipal-general-administration-staff",
        "title": "一般行政部門職員数",
        "readerLabel": "一般行政部門職員数",
        "subtitle": "市町村",
        "hook": "一般行政部門職員数が最も多い県は？"
      },
      {
        "rankingKey": "independent-revenue-prefecture",
        "title": "自主財源額",
        "readerLabel": "自主財源額",
        "subtitle": "都道府県財政",
        "hook": "自主財源額が最も多い県は？"
      }
    ]
  },
  {
    "categoryKey": "safetyenvironment",
    "categoryName": "司法・安全・環境",
    "count": 130,
    "representatives": [
      {
        "rankingKey": "garbage-total-output",
        "title": "ごみ総排出量",
        "readerLabel": "ごみ総排出量",
        "hook": "ごみ総排出量が最も多い県は？"
      },
      {
        "rankingKey": "police-officer-count",
        "title": "警察官数",
        "readerLabel": "警察官数",
        "subtitle": "総数",
        "hook": "警察官数が最も多い県は？"
      },
      {
        "rankingKey": "garbage-final-disposal",
        "title": "ごみ最終処分量",
        "readerLabel": "ごみ最終処分量",
        "hook": "ごみ最終処分量が最も多い県は？"
      },
      {
        "rankingKey": "waste-recycling-rate",
        "title": "ごみのリサイクル率",
        "readerLabel": "ごみのリサイクル率",
        "hook": "ごみのリサイクル率が最も高い県は？"
      },
      {
        "rankingKey": "fire-deaths-per-100k",
        "title": "火災死亡者数",
        "readerLabel": "火災死亡者数",
        "hook": "火災死亡者数が最も多い県は？"
      },
      {
        "rankingKey": "garbage-collection-population",
        "title": "ごみ計画収集人口",
        "readerLabel": "ごみ計画収集人口",
        "hook": "ごみ計画収集人口が最も多い県は？"
      }
    ]
  },
  {
    "categoryKey": "socialsecurity",
    "categoryName": "社会保障・衛生",
    "count": 265,
    "representatives": [
      {
        "rankingKey": "physical-disability-certificates-issued",
        "title": "身体障害者手帳交付数",
        "readerLabel": "身体障害者手帳交付数",
        "subtitle": "総数",
        "hook": "身体障害者手帳交付数が最も多い県は？"
      },
      {
        "rankingKey": "death-count",
        "title": "死亡数",
        "readerLabel": "死亡数",
        "hook": "死亡数が最も多い県は？"
      },
      {
        "rankingKey": "general-hospital-count",
        "title": "一般病院数",
        "readerLabel": "一般病院数",
        "subtitle": "総数",
        "hook": "一般病院数が最も多い県は？"
      },
      {
        "rankingKey": "infant-deaths",
        "title": "乳児死亡数",
        "readerLabel": "乳児死亡数",
        "hook": "乳児死亡数が最も多い県は？"
      },
      {
        "rankingKey": "pharmaceutical-sales-count",
        "title": "医薬品販売業数",
        "readerLabel": "医薬品販売業数",
        "subtitle": "総数",
        "hook": "医薬品販売業数が最も多い県は？"
      },
      {
        "rankingKey": "psychiatric-bed-count",
        "title": "精神病床数",
        "readerLabel": "精神病床数",
        "subtitle": "総数",
        "hook": "精神病床数が最も多い県は？"
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
    "count": 56,
    "representatives": [
      {
        "rankingKey": "port-container-count",
        "title": "コンテナ取扱個数（港湾統計）",
        "readerLabel": "コンテナ取扱個数（港湾統計）",
        "hook": "コンテナ取扱個数（港湾統計）が最も多い県は？"
      },
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
        "rankingKey": "port-cargo-export",
        "title": "輸出貨物量（港湾統計）",
        "readerLabel": "輸出貨物量（港湾統計）",
        "hook": "輸出貨物量（港湾統計）が最も多い県は？"
      },
      {
        "rankingKey": "railway-passengers",
        "title": "鉄道駅 乗降客数",
        "readerLabel": "鉄道駅乗降客数",
        "hook": "鉄道駅乗降客数が最も多い県は？"
      },
      {
        "rankingKey": "sewage-flush-toilet-population",
        "title": "下水道によるトイレ水洗化人口",
        "readerLabel": "下水道によるトイレ水洗化人口",
        "hook": "下水道によるトイレ水洗化人口が最も多い県は？"
      }
    ]
  },
  {
    "categoryKey": "ict",
    "categoryName": "情報通信・科学技術",
    "count": 21,
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
        "rankingKey": "information-communication-expenditure",
        "title": "情報通信関係費",
        "readerLabel": "情報通信関係費",
        "subtitle": "固定電話通信料・移動電話通信料・NHK放送受信料・ケーブルテレビ受信料・他の受信料の合計",
        "hook": "情報通信関係費が最も多い都市は？"
      },
      {
        "rankingKey": "telephone-subscription-count",
        "title": "電話加入数",
        "readerLabel": "電話加入数",
        "subtitle": "総数",
        "hook": "電話加入数が最も多い県は？"
      },
      {
        "rankingKey": "transport-communication-expenditure-ratio-multi-person-households",
        "title": "交通・通信費割合",
        "readerLabel": "交通・通信費割合",
        "hook": "交通・通信費割合が最も高い都市は？"
      },
      {
        "rankingKey": "information-communication-coefficient",
        "title": "情報通信係数",
        "readerLabel": "情報通信係数",
        "subtitle": "都道府県庁所在市の二人以上世帯の消費支出に占める情報通信関係費（通信料・放送受信料）の割合",
        "hook": "情報通信係数が最も多い都市は？"
      }
    ]
  }
];

export const HOME_FEATURED_PROMINENCE: ReadonlyArray<HomeFeaturedProminence> =
  [
  {
    "rankingKey": "avg-height-high-school-2nd-male",
    "title": "平均身長",
    "readerLabel": "平均身長",
    "subtitle": "高校2年・男子",
    "hook": "平均身長が最も高い県は？",
    "categoryKey": "educationsports",
    "order": 1
  },
  {
    "rankingKey": "manufacturing-shipment-amount",
    "title": "製造品出荷額等",
    "readerLabel": "製造品出荷額等",
    "subtitle": "総額",
    "hook": "製造品出荷額等が最も多い県は？",
    "categoryKey": "miningindustry",
    "order": 2
  },
  {
    "rankingKey": "total-area-excluding-northern-territories-and-takeshima",
    "title": "総面積",
    "readerLabel": "総面積",
    "subtitle": "北方地域及び竹島を除く",
    "hook": "総面積が最も広い県は？",
    "categoryKey": "landweather",
    "order": 3
  },
  {
    "rankingKey": "total-population",
    "title": "総人口",
    "readerLabel": "人口",
    "subtitle": "総数",
    "hook": "人口が最も多い県は？",
    "categoryKey": "population",
    "order": 4
  },
  {
    "rankingKey": "annual-sales-amount",
    "title": "商業年間商品販売額",
    "readerLabel": "商業年間商品販売額",
    "subtitle": "総額",
    "hook": "商業年間商品販売額が最も多い県は？",
    "categoryKey": "commercial",
    "order": 5
  },
  {
    "rankingKey": "fishery-species-catch-mackerel",
    "title": "サバ類漁獲量",
    "readerLabel": "サバ類漁獲量",
    "hook": "サバ類漁獲量が最も多い県は？",
    "categoryKey": "agriculture",
    "order": 6
  },
  {
    "rankingKey": "garbage-total-output",
    "title": "ごみ総排出量",
    "readerLabel": "ごみ総排出量",
    "hook": "ごみ総排出量が最も多い県は？",
    "categoryKey": "safetyenvironment",
    "order": 7
  },
  {
    "rankingKey": "natto-consumption-expenditure",
    "title": "納豆消費支出額",
    "readerLabel": "納豆への支出",
    "hook": "納豆への支出が最も多い都市は？",
    "categoryKey": "economy",
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
  "total-area-excluding-northern-territories-and-takeshima",
  "annual-sunshine-duration",
  "habitable-area",
  "lowest-temperature",
  "national-park-area",
  "road-length-per-km2",
  "total-population",
  "births",
  "population-density-per-km2-inhabitable-area",
  "young-population-ratio",
  "average-age-of-first-marriage-wife",
  "dual-income-household-ratio",
  "turnover-rate",
  "sleep-avg-time-female",
  "employed-people-ratio-primary",
  "active-job-opening-ratio",
  "minimum-wage-by-region",
  "regular-cash-salary-male",
  "fishery-species-catch-mackerel",
  "aquaculture-harvest",
  "fishery-species-catch-bonito",
  "fishery-species-catch-pacific-saury",
  "fishery-species-catch-sardine",
  "fishery-species-catch-snow-crab",
  "manufacturing-shipment-amount",
  "manufacturing-employees",
  "manufacturing-industry-added-value",
  "food-manufacturing-establishments",
  "food-manufacturing-shipment-amount",
  "food-manufacturing-employees",
  "annual-sales-amount",
  "manufacturing-establishments",
  "barber-beauty-salon-count",
  "manufacturing-establishment-site-area",
  "public-bath-count",
  "convenience-store-count-commercial",
  "natto-consumption-expenditure",
  "soba-udon-dining-consumption-expenditure",
  "bread-consumption-quantity",
  "rice-consumption-quantity",
  "icecream-consumption-expenditure",
  "bacon-consumption-expenditure",
  "new-condo-starts",
  "new-housing-starts",
  "new-rental-starts",
  "ordinary-construction-expenses-prefecture",
  "public-construction-contract-count",
  "floor-area-per-dwelling-owner",
  "final-disposal-site-remaining-capacity",
  "gasoline-sales-volume",
  "utilities-expenditure-ratio-multi-person-households",
  "electricity-demand",
  "wind-power-turbine-count",
  "city-gas-supply-area-households",
  "moped-count",
  "inbound-visitors-by-destination",
  "actual-overnight-guests",
  "room-utilization-rate",
  "total-overnight-guests",
  "total-overnight-guests-foreign",
  "avg-height-high-school-2nd-male",
  "elementary-school-children-count",
  "junior-high-school-students-count",
  "elementary-school-count",
  "high-school-count",
  "junior-high-school-count",
  "local-allocation-tax-prefecture",
  "local-bonds-prefecture",
  "national-treasury-disbursement-prefecture",
  "avg-salary-police-prefecture",
  "municipal-general-administration-staff",
  "independent-revenue-prefecture",
  "garbage-total-output",
  "police-officer-count",
  "garbage-final-disposal",
  "waste-recycling-rate",
  "fire-deaths-per-100k",
  "garbage-collection-population",
  "physical-disability-certificates-issued",
  "death-count",
  "general-hospital-count",
  "infant-deaths",
  "pharmaceutical-sales-count",
  "psychiatric-bed-count",
  "resident-foreigner-china",
  "port-container-count",
  "road-expressway-length",
  "main-road-paving-rate",
  "port-cargo-export",
  "railway-passengers",
  "sewage-flush-toilet-population",
  "public-phone-count",
  "post-office-count",
  "information-communication-expenditure",
  "telephone-subscription-count",
  "transport-communication-expenditure-ratio-multi-person-households",
  "information-communication-coefficient"
];

/**
 * 県データブック (AREA_DATABOOK_TEMPLATE) の指標だけの掲載価値スコア (0〜1)。
 *
 * 県の「特徴」の選定 (packages/area-profile/src/highlights) が、順位の極端さが同じ候補の
 * タイブレークに使う。databook.json の exporter が焼き込み、Web と SNS は焼き込み値を読む。
 */
export const AREA_HIGHLIGHT_PROMINENCE: Readonly<Record<string, number>> =
  {
  "active-job-opening-ratio": 0.7563,
  "agricultural-output": 0.8313,
  "ambulance-hospital-arrival-time": 0.6875,
  "annual-income-per-household": 0.4438,
  "annual-precipitation": 0.55,
  "annual-sunshine-duration": 0.9437,
  "average-age-of-first-marriage-husband": 0.685,
  "average-age-of-first-marriage-wife": 0.8675,
  "average-height-high-school-second-grade-female": 0.705,
  "average-relative-humidity": 0.55,
  "average-temperature": 0.55,
  "average-weight-high-school-second-grade-female": 0.6487,
  "average-weight-high-school-second-grade-male": 0.48,
  "avg-height-high-school-2nd-male": 1,
  "beef-cattle-count": 0.6875,
  "beef-consumption-quantity": 0.8841,
  "certified-childcare-center-count-per-100k-0-5": 0.6725,
  "chicken-consumption-expenditure": 0.8313,
  "chinese-noodles-consumption-expenditure": 0.775,
  "cleaning-shop-count-per-100k": 0.775,
  "consumer-price-difference-index-housing": 0.8587,
  "consumer-price-difference-index-overall": 0.7325,
  "consumption-expenditure-multi-person-households-per-month": 0.8313,
  "criminal-arrest-rate": 0.7188,
  "crude-birth-rate": 0.8313,
  "crude-death-rate": 0.55,
  "cultivated-land-area-ratio": 0.55,
  "culture-recreation-expenditure-ratio-multi-person-households": 0.8875,
  "current-savings-balance-multi-person-households": 0.3813,
  "dairy-cattle-count": 0.6313,
  "education-expenditure-ratio-multi-person-households": 0.775,
  "elderly-couple-only-household-ratio": 0.5451,
  "employee-ratio-10-29-employee-establishments-private": 0.4762,
  "engel-coefficient": 0.8278,
  "female-scheduled-earnings": 0.6588,
  "final-energy-consumption-per-capita": 0.5164,
  "financial-debt-balance": 0.4438,
  "floor-area-per-dwelling-owner": 0.785,
  "food-expenditure-ratio-multi-person-households": 0.6625,
  "food-self-sufficiency-rate-calorie": 0.7488,
  "forest-area-ratio": 0.4049,
  "fresh-udon-soba-consumption-expenditure": 0.775,
  "future-population-change-rate-2050": 0.575,
  "gas-station-count-per-100km": 0.6625,
  "green-tea-consumption-expenditure": 0.775,
  "healthy-life-expectancy-female": 0.6288,
  "healthy-life-expectancy-male": 0.5588,
  "households": 0.6725,
  "kindergarten-count-per-100k-3-5": 0.775,
  "layer-hen-count": 0.6313,
  "library-count-per-million": 0.7375,
  "life-expectancy-0-female": 0.6162,
  "life-expectancy-0-male": 0.49,
  "male-scheduled-earnings": 0.6025,
  "manufacturing-establishments": 0.9437,
  "manufacturing-industry-added-value": 0.8313,
  "manufacturing-shipment-amount": 1,
  "marine-aquaculture-harvest": 0.7188,
  "marine-fishery-catch": 0.8313,
  "minimum-wage-by-region": 0.7558,
  "museum-count-per-million": 0.7789,
  "nature-park-area-ratio": 0.55,
  "owner-occupied-housing-ratio": 0.785,
  "per-capita-prefectural-income-h27": 0.6912,
  "pig-count": 0.7437,
  "population-density-per-km2-total-area": 0.8313,
  "residential-land-price-change-rate": 0.6625,
  "rice-harvest-volume": 0.5563,
  "room-utilization-rate": 0.7601,
  "sake-consumption-expenditure": 0.775,
  "salt-intake-female-age-adjusted": 0.4988,
  "salt-intake-male-age-adjusted": 0.3863,
  "self-financing-ratio": 0.5313,
  "sewage-treatment-coverage-rate": 0.6313,
  "sex-ratio-total": 0.5413,
  "single-person-household-ratio": 0.7217,
  "suicide-rate-per-100k": 0.5308,
  "taxpayer-ratio-per-pref-resident": 0.55,
  "total-area-excluding-northern-territories-and-takeshima": 1,
  "total-fertility-rate": 0.8313,
  "total-overnight-guests": 0.7601,
  "total-overnight-guests-foreign": 0.7601,
  "total-population": 1,
  "total-production-in-the-prefecture": 0.6276,
  "traffic-accident-count": 0.7188,
  "transport-communication-expenditure-ratio-multi-person-households": 0.7188,
  "unemployment-rate": 0.7287,
  "vegetable-intake-female-age-adjusted": 0.4988,
  "vegetable-intake-male-age-adjusted": 0.4988,
  "water-supply-population-ratio-2012on": 0.5721
};
