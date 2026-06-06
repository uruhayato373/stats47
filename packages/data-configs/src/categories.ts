/**
 * カテゴリマスタ (git TS = SSOT)
 *
 * 完全DBレス (docs/01_技術設計/19_完全DBレス設計.md) §3: 運用エンティティの設定は
 * git TS を SSOT にする。categories は従来 D1 `categories` テーブルにあったが、本ファイルを
 * 単一ソースにする。確定値は 2026-05-29 時点の配信中 (`apps/web/public/search-index-meta.json`
 * の categories[] および D1 categories テーブルと完全一致、17 件・displayOrder 順) を固定したもの。
 *
 * displayOrder は配列順 (= 配信中の表示順)。アイコン SVG は別途 R2 `app/categories/svg/<key>.svg`。
 */

export interface CategoryMeta {
  categoryKey: string;
  categoryName: string;
  /** lucide-react アイコン名 (UI / categories snapshot 用)。 */
  icon: string;
  /** 表示順 (配列の index と一致)。 */
  displayOrder: number;
  /** SEO 用カテゴリ概要 (curiosity gap 付き・140字前後)。未設定時は page.tsx のフォールバックが使用。 */
  description?: string;
}

/** [categoryKey, categoryName, lucide icon, seo description] — 配列順 = displayOrder (配信中と一致)。 */
const CATEGORY_DEFS: ReadonlyArray<readonly [string, string, string, string]> = [
  [
    "landweather", "国土・気象", "MapPin",
    "猛暑日1位は京都・最下位は沖縄──年平均気温と猛暑日が逆転する盆地気候の正体を47都道府県データで解説。面積・海岸線・可住地面積割合など国土統計も収録。",
  ],
  [
    "population", "人口・世帯", "Users",
    "東京の人口密度は鳥取の約1,400倍──少子化・高齢化・人口移動の実態を47都道府県で比較。合計特殊出生率から転入超過数まで、人口構造の地域差を可視化。",
  ],
  [
    "laborwage", "労働・賃金", "TrendingUp",
    "最高年収の東京と最低の青森で100万円超の格差──47都道府県の平均賃金・完全失業率・有効求人倍率を統計で比較。「働く県」の実力を多面的に検証。",
  ],
  [
    "agriculture", "農林水産業", "Sprout",
    "農業産出額1位・北海道は2位の茨城の3倍超──ホタテ99%独占・コメ・野菜・畜産の産地集中を47都道府県データで解説。漁業・林業統計も収録。",
  ],
  [
    "miningindustry", "鉱工業", "Factory",
    "製造品出荷額1位・愛知58兆円──なのに効率1位は大分、東京は41位。総額と1人あたりで全く異なる順位が生まれる日本の工業地帯を47都道府県で比較。",
  ],
  [
    "commercial", "商業・サービス業", "Store",
    "小売業年間販売額の都市集中と地方消費の縮小を47都道府県の統計で可視化。飲食店数・宿泊業・サービス業の地域格差も収録。",
  ],
  [
    "economy", "企業・家計・経済", "PieChart",
    "財政力指数1位・東京1.06 vs 最下位・島根0.25──家計消費・企業数・地域経済の格差を47都道府県データで比較。平均貯蓄額・消費者物価も収録。",
  ],
  [
    "construction", "住宅・土地・建設", "Home",
    "持ち家率1位・秋田78% vs 最下位・東京28%──住宅費・地価・空き家率の地域差を47都道府県で解説。「どこに住むか」で生活コストがこれだけ変わる。",
  ],
  [
    "energy", "エネルギー・水", "Droplets",
    "太陽光発電の導入量1位は千葉──再生可能エネルギーの主力地域と電力消費の格差を47都道府県で比較。水道料金・上水道普及率も収録。",
  ],
  [
    "tourism", "運輸・観光", "Plane",
    "コロナで半減→V字回復した宿泊旅行──回復速度は東京 vs 徳島で54倍差。観光入込客数・訪日外国人・宿泊消費額の地域格差を47都道府県データで解説。",
  ],
  [
    "educationsports", "教育・文化・スポーツ", "GraduationCap",
    "学力テスト連続1位の秋田、身長1位も秋田──「東北が学力・体力で上位」の正体を47都道府県データで解説。大学進学率・体力合計点の地域差も収録。",
  ],
  [
    "administrativefinancial", "行財政", "Building2",
    "地方交付税への依存率が60%超の県はどこか──47都道府県の財政力指数・地方債残高・公務員数・議員報酬を統計で比較。自治体の財政実力を可視化。",
  ],
  [
    "safetyenvironment", "司法・安全・環境", "ShieldCheck",
    "刑法犯認知件数1位は大阪──47都道府県の犯罪率・交通事故・火災・環境汚染データを比較。統計で見る「安全な県」「リスクの高い県」を可視化。",
  ],
  [
    "socialsecurity", "社会保障・衛生", "Hospital",
    "高齢化率1位・秋田35%、健康寿命1位・山梨──47都道府県の医療・介護・年金・健康寿命データを比較。平均寿命と不健康期間のギャップも解説。",
  ],
  [
    "international", "国際", "Globe",
    "在留外国人数の増加率トップは群馬──47都道府県の外国人受入・海外旅行・貿易額・姉妹都市の地域差を比較。グローバル化の恩恵が集中する地域を可視化。",
  ],
  [
    "infrastructure", "社会基盤施設", "Construction",
    "道路整備率・橋梁老朽化・上下水道普及率の地域格差を47都道府県で解説。社会インフラの「老い」はどの県で先行しているか──更新費用の地域差も収録。",
  ],
  [
    "ict", "情報通信・科学技術", "Wifi",
    "インターネット普及率・光ファイバー整備率・ICT産業集積の地域差を47都道府県で比較。デジタル化の恩恵が集中する都市と取り残される地方の格差を可視化。",
  ],
];

export const CATEGORIES: readonly CategoryMeta[] = CATEGORY_DEFS.map(
  ([categoryKey, categoryName, icon, description], displayOrder) => ({
    categoryKey,
    categoryName,
    icon,
    displayOrder,
    description,
  }),
);

const BY_KEY: ReadonlyMap<string, CategoryMeta> = new Map(
  CATEGORIES.map((c) => [c.categoryKey, c]),
);

/** categoryKey から表示名を引く。未知キーは null。 */
export function getCategoryName(categoryKey: string): string | null {
  return BY_KEY.get(categoryKey)?.categoryName ?? null;
}

/** categoryKey から SEO 用 description を引く。未知キーは null。 */
export function getCategoryDescription(categoryKey: string): string | null {
  return BY_KEY.get(categoryKey)?.description ?? null;
}

/** displayOrder 順の全カテゴリ。 */
export function listCategories(): readonly CategoryMeta[] {
  return CATEGORIES;
}
