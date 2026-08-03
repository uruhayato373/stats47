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
        "rankingKey": "nature-park-area",
        "title": "自然公園面積",
        "hook": "自然公園面積が最も広い県は？"
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
        "rankingKey": "pneumonia-death-count",
        "title": "肺炎による死亡者数",
        "hook": "肺炎による死亡者数が最も多い県は？"
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
    "count": 111,
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
        "rankingKey": "disabled-employment-rate",
        "title": "障害者就職率",
        "hook": "障害者就職率が最も高い県は？"
      },
      {
        "rankingKey": "labor-expenses-prefecture",
        "title": "労働費",
        "hook": "労働費が最も多い県は？"
      },
      {
        "rankingKey": "unemployment-measures-project-expenses-prefecture",
        "title": "失業対策事業費",
        "hook": "失業対策事業費が最も多い県は？"
      },
      {
        "rankingKey": "cook-annual-income",
        "title": "飲食物調理従事者の平均年収",
        "hook": "飲食物調理従事者の平均年収が最も高い県は？"
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
        "rankingKey": "marine-fishery-aquaculture-output-value",
        "title": "海面漁業・養殖業産出額",
        "hook": "海面漁業・養殖業産出額が最も多い県は？"
      },
      {
        "rankingKey": "fishery-species-catch-mackerel",
        "title": "サバ類漁獲量",
        "hook": "サバ類漁獲量が最も多い県は？"
      },
      {
        "rankingKey": "fishery-species-catch-pacific-saury",
        "title": "サンマ漁獲量",
        "hook": "サンマ漁獲量が最も多い県は？"
      },
      {
        "rankingKey": "fishery-species-catch-sardine",
        "title": "イワシ類漁獲量",
        "hook": "イワシ類漁獲量が最も多い県は？"
      },
      {
        "rankingKey": "fishery-species-catch-tuna",
        "title": "マグロ類漁獲量",
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
        "rankingKey": "manufacturing-establishment-site-area",
        "title": "製造業事業所敷地面積",
        "hook": "製造業事業所敷地面積が最も広い県は？"
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
        "rankingKey": "number-of-hotel-rooms",
        "title": "ホテル営業施設客室数",
        "hook": "ホテル営業施設客室数が最も多い県は？"
      }
    ]
  },
  {
    "categoryKey": "economy",
    "categoryName": "企業・家計・経済",
    "count": 817,
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
        "rankingKey": "cup-noodles-consumption-expenditure",
        "title": "カップ麺消費支出額",
        "hook": "カップ麺消費支出額が最も多い県は？"
      },
      {
        "rankingKey": "miso-consumption-quantity",
        "title": "みそ消費量",
        "hook": "みそ消費量が最も多い県は？"
      },
      {
        "rankingKey": "pasta-consumption-quantity",
        "title": "パスタ消費量",
        "hook": "パスタ消費量が最も多い県は？"
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
        "rankingKey": "carpenter-annual-income",
        "title": "大工の平均年収",
        "hook": "大工の平均年収が最も高い県は？"
      },
      {
        "rankingKey": "new-rental-starts",
        "title": "着工新設貸家数",
        "hook": "着工新設貸家数が最も多い県は？"
      },
      {
        "rankingKey": "rooms-per-dwelling-rented",
        "title": "居住室数",
        "hook": "居住室数が最も多い県は？"
      },
      {
        "rankingKey": "architect-annual-income",
        "title": "建築技術者の平均年収",
        "hook": "建築技術者の平均年収が最も高い県は？"
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
        "rankingKey": "moped-count",
        "title": "原動機付自転車台数",
        "hook": "原動機付自転車台数が最も多い県は？"
      },
      {
        "rankingKey": "jr-freight-shipment",
        "title": "ＪＲ貨物発送量",
        "hook": "ＪＲ貨物発送量が最も多い県は？"
      },
      {
        "rankingKey": "kei-car-count",
        "title": "軽自動車等台数",
        "hook": "軽自動車等台数が最も多い県は？"
      },
      {
        "rankingKey": "motorcycle-count",
        "title": "二輪の小型自動車台数",
        "hook": "二輪の小型自動車台数が最も多い県は？"
      },
      {
        "rankingKey": "total-overnight-guests-foreign",
        "title": "外国人延べ宿泊者数",
        "hook": "外国人延べ宿泊者数が最も多い県は？"
      }
    ]
  },
  {
    "categoryKey": "educationsports",
    "categoryName": "教育・文化・スポーツ",
    "count": 258,
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
        "rankingKey": "miscellaneous-school-count",
        "title": "各種学校数",
        "hook": "各種学校数が最も多い県は？"
      },
      {
        "rankingKey": "miscellaneous-school-students",
        "title": "各種学校生徒数",
        "hook": "各種学校生徒数が最も多い県は？"
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
        "rankingKey": "local-allocation-tax-ratio-pref-finance",
        "title": "地方交付税割合",
        "hook": "地方交付税割合が最も高い県は？"
      },
      {
        "rankingKey": "local-tax-prefecture",
        "title": "地方税",
        "hook": "地方税が最も多い県は？"
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
        "rankingKey": "intellectual-crime-per-100k",
        "title": "知能犯認知件数",
        "hook": "知能犯認知件数が最も多い県は？"
      },
      {
        "rankingKey": "garbage-total-output",
        "title": "ごみ総排出量",
        "hook": "ごみ総排出量が最も多い県は？"
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
        "rankingKey": "public-health-nurse-count",
        "title": "保健師数",
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
        "rankingKey": "port-inbound-ships",
        "title": "入港船舶隻数（港湾統計）",
        "hook": "入港船舶隻数（港湾統計）が最も多い県は？"
      },
      {
        "rankingKey": "port-container-count",
        "title": "コンテナ取扱個数（港湾統計）",
        "hook": "コンテナ取扱個数（港湾統計）が最も多い県は？"
      },
      {
        "rankingKey": "port-cargo-total",
        "title": "海上出入貨物量（港湾統計）",
        "hook": "海上出入貨物量（港湾統計）が最も多い県は？"
      },
      {
        "rankingKey": "port-ships-tonnage",
        "title": "入港船舶総トン数（港湾統計）",
        "hook": "入港船舶総トン数（港湾統計）が最も多い県は？"
      },
      {
        "rankingKey": "paved-road-total-length",
        "title": "舗装道路実延長",
        "hook": "舗装道路実延長が最も長い県は？"
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
        "rankingKey": "mobile-phone-contract-count-per-1000",
        "title": "携帯電話契約数",
        "hook": "携帯電話契約数が最も多い県は？"
      },
      {
        "rankingKey": "room-aircon-ownership-multi-person-households-per-1000",
        "title": "ルームエアコン所有数量",
        "hook": "ルームエアコン所有数量が最も多い県は？"
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
    "rankingKey": "prefectural-nature-park-area",
    "title": "都道府県立自然公園面積",
    "hook": "都道府県立自然公園面積が最も広い県は？",
    "categoryKey": "landweather",
    "order": 3
  },
  {
    "rankingKey": "psychiatric-bed-count",
    "title": "精神病床数",
    "hook": "精神病床数が最も多い県は？",
    "categoryKey": "socialsecurity",
    "order": 4
  },
  {
    "rankingKey": "main-road-paving-rate",
    "title": "主要道路舗装率",
    "hook": "主要道路舗装率が最も高い県は？",
    "categoryKey": "infrastructure",
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
  "nature-park-area",
  "road-length-per-km2",
  "major-lake-area",
  "prefectural-natural-park-count",
  "national-park-area",
  "dual-income-household-ratio",
  "deaths-hypertensive-diseases",
  "deaths-lifestyle-diseases",
  "kidney-failure-death-count",
  "pneumonia-death-count",
  "crude-birth-rate",
  "designer-annual-income",
  "software-engineer-annual-income",
  "disabled-employment-rate",
  "labor-expenses-prefecture",
  "unemployment-measures-project-expenses-prefecture",
  "cook-annual-income",
  "fishery-workers",
  "marine-fishery-aquaculture-output-value",
  "fishery-species-catch-mackerel",
  "fishery-species-catch-pacific-saury",
  "fishery-species-catch-sardine",
  "fishery-species-catch-tuna",
  "manufacturing-industry-added-value",
  "manufacturing-shipment-amount-per-establishment",
  "manufacturing-employees",
  "industrial-land-price-change-rate",
  "manufacturing-net-value-added-private",
  "manufacturing-sales-private",
  "retail-store-count",
  "barber-beauty-salon-count",
  "manufacturing-establishment-site-area",
  "standard-price-change-rate-commercial",
  "convenience-store-count-commercial",
  "number-of-hotel-rooms",
  "grilled-eel-consumption-expenditure",
  "natto-consumption-expenditure",
  "beef-consumption-quantity",
  "cup-noodles-consumption-expenditure",
  "miso-consumption-quantity",
  "pasta-consumption-quantity",
  "floor-area-new-owner-dwelling",
  "ordinary-construction-expenses-prefecture",
  "carpenter-annual-income",
  "new-rental-starts",
  "rooms-per-dwelling-rented",
  "architect-annual-income",
  "final-disposal-site-remaining-capacity",
  "gasoline-sales-volume",
  "utilities-expenditure-ratio-multi-person-households",
  "wind-power-turbine-count",
  "geothermal-power-plant-count",
  "hydroelectric-power-plant-count",
  "total-overnight-guests",
  "moped-count",
  "jr-freight-shipment",
  "kei-car-count",
  "motorcycle-count",
  "total-overnight-guests-foreign",
  "school-teacher-annual-income",
  "swimming-pool-public",
  "elementary-school-children-count",
  "middle-school-students-1-per",
  "miscellaneous-school-count",
  "miscellaneous-school-students",
  "local-allocation-tax-prefecture",
  "local-allocation-tax-ratio-pref-finance",
  "local-tax-prefecture",
  "public-enterprise-accounting-staff",
  "avg-salary-education-prefecture",
  "avg-salary-police-prefecture",
  "fire-department-pump-car-count-per-100-thousand-people",
  "per-capita-police-expenditure-pref-municipal",
  "serious-crime-per-100k",
  "theft-offenses-recognized",
  "intellectual-crime-per-100k",
  "garbage-total-output",
  "psychiatric-bed-count",
  "abortion-rate",
  "general-hospital-bed-count",
  "midwife-count",
  "physical-disability-certificates-issued",
  "public-health-nurse-count",
  "resident-foreigner-korea",
  "foreign-population-per-100k",
  "main-road-paving-rate",
  "port-inbound-ships",
  "port-container-count",
  "port-cargo-total",
  "port-ships-tonnage",
  "paved-road-total-length",
  "public-phone-count",
  "post-office-count",
  "transport-communication-expenditure-ratio-multi-person-households",
  "telephone-subscription-count",
  "mobile-phone-contract-count-per-1000",
  "room-aircon-ownership-multi-person-households-per-1000"
];
