import type {
  BookSeries,
  KindleCoverBackgroundAsset,
  KindleCoverDesign,
  KindleCoverReviewStatus,
  KindleCoverTemplate,
  KindleCoverVisualTheme,
} from "./types";

export const KINDLE_SERIES_LABELS: Readonly<Record<BookSeries, string>> = {
  "S1-issues": "論点読み物",
  "S2-theme-databook": "テーマ別データブック",
  "S3-region": "地域別データブック",
  "S4-ranking-compendium": "ランキング大全",
};

export const KINDLE_COVER_TEMPLATE_LABELS: Readonly<Record<KindleCoverTemplate, string>> = {
  "issue-pop": "問いかけ型",
  "theme-databook-pop": "テーマデータ型",
  "region-pop": "地域地図型",
  "ranking-pop": "ランキング型",
};

export const KINDLE_COVER_THEME_LABELS: Readonly<Record<KindleCoverVisualTheme, string>> = {
  "household-money": "家計・所得",
  "food-consumption": "食卓・消費",
  "population-households": "人口・世帯",
  "health-care": "医療・介護",
  "education-childcare": "教育・子育て",
  "public-finance": "自治体財政",
  tourism: "観光・宿泊",
  "energy-infrastructure": "エネルギー・インフラ",
  "industry-economy": "産業・経済",
  "safety-environment": "安全・環境・防災",
  "culture-leisure": "文化・スポーツ・余暇",
  "digital-life": "デジタル生活",
  "migration-living": "移住・生活",
  "retail-market": "出店・商圏",
  "regional-profile": "地域プロフィール",
  "ranking-discovery": "ランキング発見",
};

const d = (
  template: KindleCoverDesign["template"],
  visualTheme: KindleCoverDesign["visualTheme"],
  palette: KindleCoverDesign["palette"],
  dataLabels: readonly string[],
  backgroundConcept: string,
): KindleCoverDesign => ({
  template,
  visualTheme,
  palette,
  dataLabels,
  backgroundConcept,
  reviewStatus: "draft",
});

/**
 * 画像本体はR2、Gitには承認済みオブジェクトの不変キーと整合用メタデータだけを置く。
 * 未承認の商品はここへ追加せず、`.local/kindle-cover-drafts/` で目視確認する。
 */
export const KINDLE_COVER_BACKGROUND_BY_ID: Readonly<Record<string, KindleCoverBackgroundAsset>> = {
  "K-S1-01": {
    status: "published",
    r2Key: "media/kindle-cover-assets/K-S1-01/27392ac2be97/background.jpg",
    sha256: "3915add0884e464c918853f93e611af24d221f667d9ba973eaec3e189e9f5f44",
    bytes: 667089,
    width: 1600,
    height: 2560,
  },
  "K-S1-02": {
    status: "published",
    r2Key: "media/kindle-cover-assets/K-S1-02/a59e66dd219e/background.jpg",
    sha256: "a59e66dd219eadac71992855ed62ddfaf2b9b54f48ced8655ef27589c4073c06",
    bytes: 740391,
    width: 1600,
    height: 2560,
  },
  "K-S1-03": {
    status: "published",
    r2Key: "media/kindle-cover-assets/K-S1-03/45c026857d6d/background.jpg",
    sha256: "45c026857d6dab586c1bd7ccb6a8809d97c91ab2c14532cd206dca8563b2f7cd",
    bytes: 570462,
    width: 1600,
    height: 2560,
  },
  "K-S1-04": {
    status: "published",
    r2Key: "media/kindle-cover-assets/K-S1-04/66b3e134bb06/background.jpg",
    sha256: "66b3e134bb06269283cbaff8aa3d5dd1c4ad35cc22fccc33507a6cee4b7e77df",
    bytes: 528965,
    width: 1600,
    height: 2560,
  },
  "K-S1-05": {
    status: "published",
    r2Key: "media/kindle-cover-assets/K-S1-05/e1ad45382fa9/background.jpg",
    sha256: "e1ad45382fa9c20b3be4b04c944459130c089e0a310510367ff196bd0a433edc",
    bytes: 515868,
    width: 1600,
    height: 2560,
  },
  "K-S1-06": {
    status: "published",
    r2Key: "media/kindle-cover-assets/K-S1-06/8c6c7a36c94e/background.jpg",
    sha256: "8c6c7a36c94e220efde8366f145e4a359c5db5035ff656fa24abba125564a14d",
    bytes: 608489,
    width: 1600,
    height: 2560,
  },
  "K-S1-07": {
    status: "published",
    r2Key: "media/kindle-cover-assets/K-S1-07/8f9cc48e68b2/background.jpg",
    sha256: "8f9cc48e68b23cd85a927130a6b4b2a95b4e20bf3c898d015fa59d72784c7787",
    bytes: 584938,
    width: 1600,
    height: 2560,
  },
  "K-S1-08": {
    status: "published",
    r2Key: "media/kindle-cover-assets/K-S1-08/7b75c5026413/background.jpg",
    sha256: "7b75c50264139fb1e1e4b49eed516f4b67ca3c33711ea2cfd5b69a31c0e80ba8",
    bytes: 713362,
    width: 1600,
    height: 2560,
  },
  "K-S1-09": {
    status: "published",
    r2Key: "media/kindle-cover-assets/K-S1-09/9264f84f7369/background.jpg",
    sha256: "9264f84f736940427e5dd9a2f2923459e86112c9e93828458e29c72388e8ff3e",
    bytes: 728385,
    width: 1600,
    height: 2560,
  },
  "K-S1-10": {
    status: "published",
    r2Key: "media/kindle-cover-assets/K-S1-10/abd3d39673d2/background.jpg",
    sha256: "abd3d39673d25502ceb6531f35e38b15297d07f4622c09252bbaa65bf3434716",
    bytes: 633936,
    width: 1600,
    height: 2560,
  },
  "K-S1-11": {
    status: "published",
    r2Key: "media/kindle-cover-assets/K-S1-11/511cb55f8479/background.jpg",
    sha256: "511cb55f84796d304fca4134a8466bab70fe9c271b5f1b1b0cd2cbdfd5c0f7c6",
    bytes: 647185,
    width: 1600,
    height: 2560,
  },
  "K-S1-12": {
    status: "published",
    r2Key: "media/kindle-cover-assets/K-S1-12/08ebd78898b4/background.jpg",
    sha256: "08ebd78898b403e8daaf3391b13fe2bd00b61040d3035600b61252808e7707f7",
    bytes: 568289,
    width: 1600,
    height: 2560,
  },
};

const KINDLE_COVER_REVIEW_STATUS_BY_ID: Readonly<Partial<Record<string, KindleCoverReviewStatus>>> = {
  "K-S1-01": "approved",
  "K-S1-02": "approved",
  "K-S1-03": "approved",
  "K-S1-04": "approved",
  "K-S1-05": "approved",
  "K-S1-06": "approved",
  "K-S1-07": "approved",
  "K-S1-08": "approved",
  "K-S1-09": "approved",
  "K-S1-10": "approved",
  "K-S1-11": "approved",
  "K-S1-12": "approved",
};

/**
 * 商品ごとの表紙設計 SSOT。背景は同テーマでも具体物と構図を変え、同一画像の使い回しをしない。
 * タイトルや dataLabels は画像へ焼き込まず cover.ts が実テキストで合成する。
 */
export const KINDLE_COVER_DESIGN_BY_ID: Readonly<Record<string, KindleCoverDesign>> = {
  "K-S1-01": d("issue-pop", "household-money", "navy-yellow", ["可処分所得", "光熱費", "貯蓄", "食費", "通信費", "地域財政"], "日本地図を中心に、硬貨、住宅、買い物かご、電気メーター、貯金箱、スマートフォンを配置する"),
  "K-S1-02": d("issue-pop", "food-consumption", "coral-cream", ["麺類", "味噌", "砂糖", "かに", "さば"], "日本地図を食卓に見立て、麺、味噌、砂糖、かに、さばの買い物かごを地域別に配置する"),
  "K-S1-03": d("issue-pop", "population-households", "blue-orange", ["人口減少", "未婚率", "単身世帯", "高齢世帯", "東京集中"], "世帯の異なる住宅群と人物ピクト、地方から都市へ向かう人口移動の流れを日本地図上に描く"),
  "K-S1-04": d("issue-pop", "health-care", "teal-red", ["平均寿命", "自殺", "介護", "医療資源", "2040推計"], "病院、聴診器、介護施設、年齢構成グラフを日本地図の周囲に配置する"),
  "K-S1-05": d("issue-pop", "education-childcare", "blue-orange", ["教育費", "進学率", "子育て", "学校", "学力"], "学校、教科書、ランドセル、親子、進学を示す階段グラフを日本地図と組み合わせる"),
  "K-S1-06": d("issue-pop", "public-finance", "green-gold", ["財政力", "地方債", "将来負担", "歳入", "歳出"], "自治体庁舎、予算書、硬貨、天秤、増減グラフを日本地図の上に配置する"),
  "K-S1-07": d("issue-pop", "tourism", "sky-coral", ["宿泊者数", "外国人客", "国籍", "観光回復", "客室"], "旅行かばん、ホテル、飛行機、温泉、観光客の流れを日本地図の周囲に描く"),
  "K-S1-08": d("issue-pop", "energy-infrastructure", "orange-navy", ["電力", "再生可能エネルギー", "都市ガス", "インフラ", "地域差"], "送電塔、太陽光、風力発電、ガスメーター、橋を日本地図上のネットワークとして描く"),
  "K-S1-09": d("issue-pop", "industry-economy", "green-gold", ["製造業", "中小企業", "地価", "雇用", "地域経済"], "工場、店舗、オフィス、地価を示す土地、産業グラフを日本地図の周囲に配置する"),
  "K-S1-10": d("issue-pop", "safety-environment", "orange-navy", ["犯罪", "労災", "公害", "災害", "防災"], "防災バッグ、盾、工事用ヘルメット、雨雲、避難所を日本地図上に整理して描く"),
  "K-S1-11": d("issue-pop", "culture-leisure", "purple-gold", ["文化施設", "スポーツ", "余暇時間", "読書", "旅行"], "本、ボール、音楽、博物館、旅行のモチーフを日本地図の周囲に明るく配置する"),
  "K-S1-12": d("issue-pop", "digital-life", "blue-orange", ["通信契約", "PC支出", "テレワーク", "メディア", "コンビニ"], "スマートフォン、ノートPC、電波塔、在宅勤務机、デジタルグラフを日本地図と結ぶ"),

  "K-S2-01": d("theme-databook-pop", "population-households", "blue-orange", ["総人口", "世帯", "出生", "死亡", "年齢構成"], "47都道府県の人口ピクトと世帯住宅、人口ピラミッドを日本地図の周囲に配置する"),
  "K-S2-02": d("theme-databook-pop", "household-money", "navy-yellow", ["所得", "賃金", "求人", "雇用", "採用"], "給与明細、硬貨、求人票、働く人、棒グラフを日本地図上に配置する"),
  "K-S2-03": d("theme-databook-pop", "tourism", "sky-coral", ["宿泊", "観光客", "外国人", "客室", "旅行消費"], "ホテル、旅行かばん、交通機関、観光名所を日本地図の周囲に配置する"),
  "K-S2-04": d("theme-databook-pop", "public-finance", "green-gold", ["歳入", "歳出", "財政力", "地方債", "将来負担"], "自治体庁舎と予算の天秤、硬貨、財政グラフを日本地図と組み合わせる"),
  "K-S2-05": d("theme-databook-pop", "health-care", "teal-red", ["病床", "医師", "介護", "寿命", "医療費"], "病院、医師、病床、介護施設、健康指標を日本地図の周囲に配置する"),
  "K-S2-06": d("theme-databook-pop", "education-childcare", "blue-orange", ["学校", "教育費", "進学", "保育", "子育て"], "学校、教科書、保育施設、親子、進学グラフを日本地図の周囲に配置する"),
  "K-S2-07": d("theme-databook-pop", "migration-living", "green-gold", ["転入", "転出", "住宅", "生活費", "交通"], "引っ越し箱、住宅、鉄道、生活用品、地域間の移動矢印を日本地図上に描く"),
  "K-S2-08": d("theme-databook-pop", "retail-market", "coral-cream", ["人口商圏", "店舗", "消費", "地価", "競合"], "店舗、商圏サークル、買い物客、地価ピン、売上グラフを日本地図上に配置する"),
  "K-S2-09": d("theme-databook-pop", "industry-economy", "green-gold", ["産業構成", "事業所", "製造", "雇用", "地域経済"], "工場、事業所、物流、働く人、産業別グラフを日本地図の周囲に配置する"),
  "K-S2-10": d("theme-databook-pop", "safety-environment", "orange-navy", ["災害", "避難", "道路", "橋梁", "ライフライン"], "防災バッグ、避難所、道路、橋、ライフラインを日本地図上に整理して描く"),
  "K-S2-11": d("theme-databook-pop", "food-consumption", "coral-cream", ["収入", "支出", "食費", "光熱費", "貯蓄"], "家計簿、買い物かご、電気メーター、硬貨、貯金箱を日本地図の周囲に配置する"),

  "K-S3-01": d("region-pop", "regional-profile", "sky-coral", ["人口", "産業", "暮らし", "農業", "観光"], "北海道の輪郭を大きく見せ、雪原、農地、都市、観光を統計カードとして配置する"),
  "K-S3-02": d("region-pop", "regional-profile", "teal-red", ["人口", "産業", "暮らし", "農林水産", "観光"], "東北6県の輪郭を強調し、農林水産、雪、都市、祭りを統計カードとして配置する"),
  "K-S3-03": d("region-pop", "regional-profile", "navy-yellow", ["人口", "産業", "所得", "交通", "暮らし"], "関東7都県の輪郭を強調し、大都市、鉄道、住宅、産業を統計カードとして配置する"),
  "K-S3-04": d("region-pop", "regional-profile", "green-gold", ["人口", "製造業", "農業", "山岳", "暮らし"], "中部9県の輪郭を強調し、山岳、工場、農業、都市を統計カードとして配置する"),
  "K-S3-05": d("region-pop", "regional-profile", "purple-gold", ["人口", "産業", "文化", "観光", "暮らし"], "近畿7府県の輪郭を強調し、都市、文化施設、観光、産業を統計カードとして配置する"),
  "K-S3-06": d("region-pop", "regional-profile", "blue-orange", ["人口", "産業", "交通", "観光", "暮らし"], "中国5県の輪郭を強調し、瀬戸内交通、産業、観光、暮らしを統計カードとして配置する"),
  "K-S3-07": d("region-pop", "regional-profile", "orange-navy", ["人口", "産業", "交通", "農業", "暮らし"], "四国4県の輪郭を強調し、橋、農業、都市、暮らしを統計カードとして配置する"),
  "K-S3-08": d("region-pop", "regional-profile", "coral-cream", ["人口", "産業", "観光", "農業", "暮らし"], "九州・沖縄8県の輪郭を強調し、火山、海、農業、都市、観光を統計カードとして配置する"),

  "K-S4-01": d("ranking-pop", "ranking-discovery", "purple-gold", ["意外な1位", "最下位", "地域差", "全国平均", "分野横断"], "日本地図、金銀銅の表彰台、上昇下降グラフ、驚きを示す統計カードを華やかに配置する"),
};

export function coverDesignForBook(id: string): KindleCoverDesign {
  const design = KINDLE_COVER_DESIGN_BY_ID[id];
  if (!design) throw new Error(`Kindle cover design is missing: ${id}`);
  return {
    ...design,
    reviewStatus: KINDLE_COVER_REVIEW_STATUS_BY_ID[id] ?? design.reviewStatus,
    backgroundAsset: KINDLE_COVER_BACKGROUND_BY_ID[id],
  };
}
