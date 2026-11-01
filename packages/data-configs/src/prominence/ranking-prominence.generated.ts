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
    "count": 41,
    "representatives": [
      {
        "rankingKey": "annual-sunshine-duration",
        "title": "年間日照時間",
        "readerLabel": "日照時間",
        "hook": "日照時間が最も長い県は？"
      },
      {
        "rankingKey": "total-area-excluding-northern-territories-and-takeshima",
        "title": "総面積",
        "readerLabel": "総面積",
        "subtitle": "北方地域及び竹島を除く",
        "hook": "総面積が最も広い県は？"
      },
      {
        "rankingKey": "annual-clear-days",
        "title": "年間快晴日数",
        "readerLabel": "年間快晴日数",
        "hook": "快晴日数1位は沖縄？"
      },
      {
        "rankingKey": "habitable-area",
        "title": "可住地面積",
        "readerLabel": "可住地面積",
        "hook": "可住地面積が最も広い県は？"
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
    "count": 156,
    "representatives": [
      {
        "rankingKey": "total-fertility-rate",
        "title": "合計特殊出生率",
        "readerLabel": "合計特殊出生率",
        "hook": "合計特殊出生率が最も高い県は？"
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
        "rankingKey": "crude-birth-rate",
        "title": "粗出生率",
        "readerLabel": "粗出生率",
        "subtitle": "人口千人当たり",
        "hook": "粗出生率が最も高い県は？"
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
        "rankingKey": "new-hire-count",
        "title": "入職者数",
        "readerLabel": "入職者数",
        "hook": "入職者数が最も多い県は？"
      },
      {
        "rankingKey": "employed-people-ratio-primary",
        "title": "第1次産業就業者比率",
        "readerLabel": "第1次産業就業者比率",
        "hook": "第1次産業就業者比率が最も高い県は？"
      },
      {
        "rankingKey": "employed-people-ratio-tertiary",
        "title": "第3次産業就業者比率",
        "readerLabel": "第3次産業就業者比率",
        "hook": "第3次産業就業者比率が最も高い県は？"
      },
      {
        "rankingKey": "hobby-leisure-avg-time-unemployed-male",
        "title": "趣味・娯楽の平均時間",
        "readerLabel": "趣味・娯楽の平均時間",
        "subtitle": "男性・非有業者",
        "hook": "趣味・娯楽の平均時間が最も長い県は？"
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
        "rankingKey": "fishery-species-catch-bonito",
        "title": "カツオ漁獲量",
        "readerLabel": "カツオ漁獲量",
        "hook": "カツオ漁獲量が最も多い県は？"
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
        "rankingKey": "agricultural-output",
        "title": "農業産出額",
        "readerLabel": "農業産出額",
        "hook": "農業産出額が最も多い県は？"
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
        "rankingKey": "public-bath-count-per-100k",
        "title": "公衆浴場数",
        "readerLabel": "公衆浴場数",
        "subtitle": "人口10万人当たり",
        "hook": "公衆浴場数が最も多い県は？"
      },
      {
        "rankingKey": "manufacturing-establishments",
        "title": "製造業事業所数",
        "readerLabel": "製造業事業所数",
        "hook": "製造業事業所数が最も多い県は？"
      },
      {
        "rankingKey": "annual-sales-amount",
        "title": "商業年間商品販売額",
        "readerLabel": "商業年間商品販売額",
        "subtitle": "総額",
        "hook": "商業年間商品販売額が最も多い県は？"
      },
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
        "rankingKey": "department-supermarket-count-per-100k",
        "title": "百貨店、総合スーパー数",
        "readerLabel": "百貨店、総合スーパー数",
        "subtitle": "人口10万人当たり",
        "hook": "百貨店、総合スーパー数が最も多い県は？"
      }
    ]
  },
  {
    "categoryKey": "economy",
    "categoryName": "企業・家計・経済",
    "count": 885,
    "representatives": [
      {
        "rankingKey": "beef-consumption-quantity",
        "title": "牛肉消費量",
        "readerLabel": "牛肉消費量",
        "subtitle": "都道府県庁所在市の二人以上世帯の年間牛肉消費量",
        "hook": "牛肉消費量が最も多い県は？"
      },
      {
        "rankingKey": "coffee-consumption-quantity",
        "title": "コーヒー消費量",
        "readerLabel": "コーヒー消費量",
        "subtitle": "都道府県庁所在市の二人以上世帯の年間コーヒー消費量",
        "hook": "コーヒー消費量が最も多い県は？"
      },
      {
        "rankingKey": "natto-consumption-expenditure",
        "title": "納豆消費支出額",
        "readerLabel": "納豆への支出",
        "subtitle": "都道府県庁所在市の二人以上世帯の年間納豆消費支出額",
        "hook": "納豆への支出が最も多い県は？"
      },
      {
        "rankingKey": "rice-consumption-quantity",
        "title": "米消費量",
        "readerLabel": "米消費量",
        "subtitle": "都道府県庁所在市の二人以上世帯の年間米消費量",
        "hook": "米消費量が最も多い県は？"
      },
      {
        "rankingKey": "consumption-expenditure-multi-person-households-per-month",
        "title": "消費支出",
        "readerLabel": "二人以上世帯の1か月の消費支出",
        "subtitle": "1世帯当たり1か月間・二人以上の世帯・1か月平均",
        "hook": "最も消費支出が多い県は？"
      },
      {
        "rankingKey": "air-conditioner-consumption-quantity",
        "title": "エアコン消費量",
        "readerLabel": "エアコン消費量",
        "subtitle": "都道府県庁所在市の二人以上世帯の年間エアコン消費量",
        "hook": "エアコン消費量が最も多い県は？"
      }
    ]
  },
  {
    "categoryKey": "construction",
    "categoryName": "住宅・土地・建設",
    "count": 83,
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
        "hook": "光熱・水道費割合が最も高い県は？"
      },
      {
        "rankingKey": "city-gas-supply-area-households",
        "title": "都市ガス供給区域内世帯数",
        "readerLabel": "都市ガス供給区域内世帯数",
        "hook": "都市ガス供給区域内世帯数が最も多い県は？"
      },
      {
        "rankingKey": "wind-power-turbine-count",
        "title": "風力発電導入量（設置基数）",
        "readerLabel": "風力発電導入量（設置基数）",
        "subtitle": "風車台数",
        "hook": "風力発電導入量（設置基数）が最も多い県は？"
      },
      {
        "rankingKey": "regional-household-car-final-energy-consumption",
        "title": "家庭乗用車の最終エネルギー消費量",
        "readerLabel": "家庭乗用車の最終エネルギー消費量",
        "hook": "家庭乗用車の最終エネルギー消費量が最も多い県は？"
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
        "rankingKey": "room-utilization-rate",
        "title": "客室稼働率",
        "readerLabel": "客室稼働率",
        "hook": "客室稼働率が最も高い県は？"
      },
      {
        "rankingKey": "total-overnight-guests-foreign",
        "title": "外国人延べ宿泊者数",
        "readerLabel": "外国人延べ宿泊者数",
        "hook": "外国人延べ宿泊者数が最も多い県は？"
      },
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
        "rankingKey": "elementary-school-children-count",
        "title": "小学校児童数",
        "readerLabel": "小学校児童数",
        "subtitle": "総数",
        "hook": "小学校児童数が最も多い県は？"
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
        "rankingKey": "average-weight-middle-school-second-grade-male",
        "title": "平均体重",
        "readerLabel": "平均体重",
        "subtitle": "中学2年・男子",
        "hook": "平均体重が最も多い県は？"
      },
      {
        "rankingKey": "high-school-advancement-rate",
        "title": "高等学校卒業者の進学率",
        "readerLabel": "高等学校卒業者の進学率",
        "hook": "高等学校卒業者の進学率が最も高い県は？"
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
        "rankingKey": "local-allocation-tax-ratio-pref-finance",
        "title": "地方交付税割合",
        "readerLabel": "地方交付税割合",
        "subtitle": "都道府県財政",
        "hook": "地方交付税割合が最も高い県は？"
      },
      {
        "rankingKey": "local-tax-prefecture",
        "title": "地方税",
        "readerLabel": "地方税",
        "subtitle": "都道府県財政",
        "hook": "地方税が最も多い県は？"
      }
    ]
  },
  {
    "categoryKey": "safetyenvironment",
    "categoryName": "司法・安全・環境",
    "count": 146,
    "representatives": [
      {
        "rankingKey": "police-officer-count",
        "title": "警察官数",
        "readerLabel": "警察官数",
        "subtitle": "総数",
        "hook": "警察官数が最も多い県は？"
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
        "subtitle": "人口10万人当たり",
        "hook": "消防ポンプ自動車等現有数が最も多い県は？"
      },
      {
        "rankingKey": "garbage-final-disposal",
        "title": "ごみ最終処分量",
        "readerLabel": "ごみ最終処分量",
        "hook": "ごみ最終処分量が最も多い県は？"
      },
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
      }
    ]
  },
  {
    "categoryKey": "socialsecurity",
    "categoryName": "社会保障・衛生",
    "count": 291,
    "representatives": [
      {
        "rankingKey": "general-hospital-count",
        "title": "一般病院数",
        "readerLabel": "一般病院数",
        "subtitle": "総数",
        "hook": "一般病院数が最も多い県は？"
      },
      {
        "rankingKey": "death-count",
        "title": "死亡数",
        "readerLabel": "死亡数",
        "hook": "死亡数が最も多い県は？"
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
        "rankingKey": "water-supply-population",
        "title": "上水道給水人口",
        "readerLabel": "上水道給水人口",
        "hook": "上水道給水人口が最も多い県は？"
      },
      {
        "rankingKey": "sewage-flush-toilet-population",
        "title": "下水道によるトイレ水洗化人口",
        "readerLabel": "下水道によるトイレ水洗化人口",
        "hook": "下水道によるトイレ水洗化人口が最も多い県は？"
      },
      {
        "rankingKey": "port-container-count",
        "title": "コンテナ取扱個数（港湾統計）",
        "readerLabel": "コンテナ取扱個数（港湾統計）",
        "hook": "コンテナ取扱個数（港湾統計）が最も多い県は？"
      },
      {
        "rankingKey": "water-supply-annual-volume",
        "title": "上水道年間給水量",
        "readerLabel": "上水道年間給水量",
        "hook": "上水道年間給水量が最も多い県は？"
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
      },
      {
        "rankingKey": "information-communication-coefficient",
        "title": "情報通信係数",
        "readerLabel": "情報通信係数",
        "subtitle": "都道府県庁所在市の二人以上世帯の消費支出に占める情報通信関係費（通信料・放送受信料）の割合",
        "hook": "情報通信係数が最も多い県は？"
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
    "rankingKey": "general-hospital-count",
    "title": "一般病院数",
    "readerLabel": "一般病院数",
    "subtitle": "総数",
    "hook": "一般病院数が最も多い県は？",
    "categoryKey": "socialsecurity",
    "order": 3
  },
  {
    "rankingKey": "fishery-species-catch-mackerel",
    "title": "サバ類漁獲量",
    "readerLabel": "サバ類漁獲量",
    "hook": "サバ類漁獲量が最も多い県は？",
    "categoryKey": "agriculture",
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
    "rankingKey": "public-bath-count-per-100k",
    "title": "公衆浴場数",
    "readerLabel": "公衆浴場数",
    "subtitle": "人口10万人当たり",
    "hook": "公衆浴場数が最も多い県は？",
    "categoryKey": "commercial",
    "order": 6
  },
  {
    "rankingKey": "beef-consumption-quantity",
    "title": "牛肉消費量",
    "readerLabel": "牛肉消費量",
    "subtitle": "都道府県庁所在市の二人以上世帯の年間牛肉消費量",
    "hook": "牛肉消費量が最も多い県は？",
    "categoryKey": "economy",
    "order": 7
  },
  {
    "rankingKey": "local-allocation-tax-prefecture",
    "title": "地方交付税",
    "readerLabel": "地方交付税",
    "subtitle": "都道府県財政",
    "hook": "地方交付税が最も多い県は？",
    "categoryKey": "administrativefinancial",
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
  "total-area-excluding-northern-territories-and-takeshima",
  "annual-clear-days",
  "habitable-area",
  "national-park-area",
  "road-length-per-km2",
  "total-fertility-rate",
  "dual-income-household-ratio",
  "births",
  "crude-birth-rate",
  "deaths-hypertensive-diseases",
  "deaths-lifestyle-diseases",
  "turnover-rate",
  "sleep-avg-time-female",
  "new-hire-count",
  "employed-people-ratio-primary",
  "employed-people-ratio-tertiary",
  "hobby-leisure-avg-time-unemployed-male",
  "fishery-species-catch-mackerel",
  "fishery-species-catch-pacific-saury",
  "fishery-species-catch-bonito",
  "fishery-species-catch-sardine",
  "fishery-workers",
  "agricultural-output",
  "manufacturing-shipment-amount",
  "manufacturing-industry-added-value",
  "manufacturing-employees",
  "food-manufacturing-establishments",
  "food-manufacturing-shipment-amount",
  "food-manufacturing-employees",
  "public-bath-count-per-100k",
  "manufacturing-establishments",
  "annual-sales-amount",
  "convenience-store-count-commercial",
  "retail-store-count",
  "department-supermarket-count-per-100k",
  "beef-consumption-quantity",
  "coffee-consumption-quantity",
  "natto-consumption-expenditure",
  "rice-consumption-quantity",
  "consumption-expenditure-multi-person-households-per-month",
  "air-conditioner-consumption-quantity",
  "new-condo-starts",
  "new-housing-starts",
  "new-rental-starts",
  "ordinary-construction-expenses-prefecture",
  "public-construction-contract-count",
  "floor-area-per-dwelling-owner",
  "final-disposal-site-remaining-capacity",
  "gasoline-sales-volume",
  "utilities-expenditure-ratio-multi-person-households",
  "city-gas-supply-area-households",
  "wind-power-turbine-count",
  "regional-household-car-final-energy-consumption",
  "total-overnight-guests",
  "room-utilization-rate",
  "total-overnight-guests-foreign",
  "moped-count",
  "inbound-visitors-by-destination",
  "actual-overnight-guests",
  "avg-height-high-school-2nd-male",
  "elementary-school-children-count",
  "elementary-school-count",
  "high-school-count",
  "average-weight-middle-school-second-grade-male",
  "high-school-advancement-rate",
  "local-allocation-tax-prefecture",
  "local-bonds-prefecture",
  "national-treasury-disbursement-prefecture",
  "avg-salary-police-prefecture",
  "local-allocation-tax-ratio-pref-finance",
  "local-tax-prefecture",
  "police-officer-count",
  "fire-deaths-per-100k",
  "fire-department-pump-car-count-per-100-thousand-people",
  "garbage-final-disposal",
  "per-capita-police-expenditure-pref-municipal",
  "serious-crime-per-100k",
  "general-hospital-count",
  "death-count",
  "infant-deaths",
  "pharmaceutical-sales-count",
  "physical-disability-certificates-issued",
  "psychiatric-bed-count",
  "resident-foreigner-china",
  "road-expressway-length",
  "main-road-paving-rate",
  "water-supply-population",
  "sewage-flush-toilet-population",
  "port-container-count",
  "water-supply-annual-volume",
  "public-phone-count",
  "post-office-count",
  "telephone-subscription-count",
  "transport-communication-expenditure-ratio-multi-person-households",
  "information-communication-expenditure",
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
  "active-job-opening-ratio": 0.55,
  "agricultural-output": 0.8313,
  "ambulance-hospital-arrival-time": 0.6313,
  "annual-income-per-household": 0.5188,
  "annual-precipitation": 0.55,
  "annual-sunshine-duration": 1,
  "average-age-of-first-marriage-husband": 0.685,
  "average-age-of-first-marriage-wife": 0.8113,
  "average-height-high-school-second-grade-female": 0.6487,
  "average-relative-humidity": 0.55,
  "average-temperature": 0.55,
  "average-weight-high-school-second-grade-female": 0.5363,
  "average-weight-high-school-second-grade-male": 0.48,
  "avg-height-high-school-2nd-male": 1,
  "barber-beauty-salon-count-per-100k": 0.5925,
  "beef-cattle-count": 0.6875,
  "beef-consumption-quantity": 0.9367,
  "certified-childcare-center-count-per-100k-0-5": 0.6162,
  "chicken-consumption-expenditure": 0.768,
  "chinese-noodles-consumption-expenditure": 0.768,
  "cleaning-shop-count-per-100k": 0.775,
  "consumer-price-difference-index-housing": 0.8025,
  "consumer-price-difference-index-overall": 0.6762,
  "consumption-expenditure-multi-person-households-per-month": 0.8875,
  "criminal-arrest-rate": 0.7188,
  "crude-birth-rate": 0.8313,
  "crude-death-rate": 0.55,
  "cultivated-land-area-ratio": 0.55,
  "culture-recreation-expenditure-ratio-multi-person-households": 0.8313,
  "current-savings-balance-multi-person-households": 0.2688,
  "dairy-cattle-count": 0.575,
  "disaster-damage-amount-per-person": 0.775,
  "education-expenditure-ratio-multi-person-households": 0.775,
  "elderly-couple-only-household-ratio": 0.4513,
  "employee-ratio-10-29-employee-establishments-private": 0.4949,
  "engel-coefficient": 0.8242,
  "female-scheduled-earnings": 0.6213,
  "final-energy-consumption-per-capita": 0.5351,
  "financial-debt-balance": 0.4625,
  "floor-area-per-dwelling-owner": 0.785,
  "food-expenditure-ratio-multi-person-households": 0.6625,
  "food-self-sufficiency-rate-calorie": 0.805,
  "foreign-resident-count-per-100k": 0.3892,
  "forest-area-ratio": 0.4237,
  "fresh-udon-soba-consumption-expenditure": 0.7117,
  "future-population-change-rate-2050": 0.5188,
  "gas-station-count-per-100km": 0.6625,
  "general-clinic-count-per-100k": 0.48,
  "general-hospital-bed-count-per-100k": 0.48,
  "general-hospital-count-per-100k": 0.48,
  "green-tea-consumption-expenditure": 0.7117,
  "healthy-life-expectancy-female": 0.6476,
  "healthy-life-expectancy-male": 0.5776,
  "households": 0.6912,
  "households-on-public-assistance-per-1000": 0.48,
  "kindergarten-count-per-100k-3-5": 0.6625,
  "layer-hen-count": 0.6313,
  "library-count-per-million": 0.5875,
  "life-expectancy-0-female": 0.6912,
  "life-expectancy-0-male": 0.3962,
  "male-scheduled-earnings": 0.565,
  "manufacturing-establishments": 0.8875,
  "manufacturing-industry-added-value": 0.8313,
  "manufacturing-shipment-amount": 0.9437,
  "manufacturing-shipment-amount-per-employee": 0.48,
  "marine-aquaculture-harvest": 0.55,
  "marine-fishery-catch": 0.55,
  "minimum-wage-by-region": 0.6433,
  "museum-count-per-million": 0.7976,
  "nature-park-area-ratio": 0.55,
  "owner-occupied-housing-ratio": 0.785,
  "penal-code-offenses-recognized-per-1000": 0.6487,
  "per-capita-prefectural-income-h27": 0.6537,
  "physicians-in-medical-facilities-per-100k": 0.6487,
  "pig-count": 0.6875,
  "police-officer-count-per-population": 0.8175,
  "population-density-per-km2-total-area": 0.775,
  "post-office-count-per-100km2": 0.48,
  "residential-land-price-change-rate": 0.6625,
  "rice-harvest-volume": 0.5188,
  "room-utilization-rate": 0.7601,
  "sake-consumption-expenditure": 0.768,
  "salt-intake-female-age-adjusted": 0.4425,
  "salt-intake-male-age-adjusted": 0.33,
  "self-financing-ratio": 0.55,
  "sewage-treatment-coverage-rate": 0.6875,
  "sex-ratio-total": 0.4288,
  "single-person-household-ratio": 0.7404,
  "suicide-rate-per-100k": 0.5308,
  "taxpayer-ratio-per-pref-resident": 0.55,
  "total-area-excluding-northern-territories-and-takeshima": 0.8875,
  "total-fertility-rate": 0.8875,
  "total-overnight-guests": 0.8164,
  "total-overnight-guests-foreign": 0.7601,
  "total-population": 0.7188,
  "total-production-in-the-prefecture": 0.5338,
  "traffic-accident-count": 0.6063,
  "transport-communication-expenditure-ratio-multi-person-households": 0.7188,
  "unemployment-rate": 0.6912,
  "vegetable-intake-female-age-adjusted": 0.4988,
  "vegetable-intake-male-age-adjusted": 0.4988,
  "water-supply-population-ratio-2012on": 0.5721
};
