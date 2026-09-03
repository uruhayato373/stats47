/**
 * アフィリエイト広告の「意図軸 (vertical)」= 全タクソノミー (category / theme / tag / ranking) を
 * 集約する単一ハブ。ページの意図 → vertical → 広告 で解決する。
 *
 * 正典: `.claude/rules/affiliate-ads-standards.md`。vertical の追加・写像変更はここだけで行う。
 */

/** 広告意図軸 (10 vertical)。コンテンツ分類 (category 17 / theme 20 / tag) はここへ写像する。 */
export type AffiliateVertical =
  | "labor"      // 労働・賃金・転職・キャリア
  | "housing"    // 住宅・土地・不動産・引越し
  | "population" // 人口・世帯・結婚・子育て
  | "economy"    // 家計・経済・投資・保険・物価
  | "health"     // 健康・医療・介護・フィットネス
  | "energy"     // エネルギー・水・通信
  | "travel"     // 旅行・宿泊 (OTA: 楽天トラベル/じゃらん/一休 等)
  | "furusato"   // ふるさと納税・地方財政
  | "education"  // 教育・通信教育・学習
  | "mobility";  // 交通・自動車保険・車査定・移動

/** 全 vertical の配列 (validation / iteration 用)。 */
export const AFFILIATE_VERTICALS: readonly AffiliateVertical[] = [
  "labor",
  "housing",
  "population",
  "economy",
  "health",
  "energy",
  "travel",
  "furusato",
  "education",
  "mobility",
] as const;

/**
 * @deprecated 旧名。`AffiliateVertical` を使う。型 alias として互換維持 (段階移行)。
 */
export type AffiliateCategory = AffiliateVertical;

/**
 * categoryKey (e-Stat 17 軸) → vertical。
 * ranking / category ページはこの写像で vertical を得る。
 */
export const CATEGORY_AFFILIATE_MAP: Record<string, AffiliateVertical> = {
  "laborwage":               "labor",
  "construction":            "housing",
  "landweather":             "housing",
  "population":              "population",
  "economy":                 "economy",
  "socialsecurity":          "health",
  "energy":                  "energy",
  "tourism":                 "travel",
  "administrativefinancial": "furusato",
  "educationsports":         "education",
  "safetyenvironment":       "mobility",
  // ★ 2026-07-28 追加。写像が無い間これらのランキングは vertical を解決できず、
  //   AffiliateAdSlot が実験→banner→text の全経路で空振りして **常に AdSense に落ちていた**
  //   (GSC 2026-W30 実測で計 7,866 imp。placement-map の unmapped.byReason で確認)。
  //   各カテゴリの metric 構成を実際に読んで寄せ先を決めた (推測で写像しない)。
  "commercial":              "economy",   // 商業販売額・小売店数・理容美容所数 → 消費・商業
  "agriculture":             "furusato",  // 農業産出額・養殖収獲量・耕地 → 返礼品 (食品) と直結
  "infrastructure":          "mobility",  // 空港・給油所・林道・立体横断施設 → 交通インフラが主
  "ict":                     "energy",    // 携帯契約数・公衆電話・郵便局 → 通信 (energy は通信を含む軸)
  "miningindustry":          "economy",   // 鉱工業出荷額 → 経済
  "international":           "travel",    // 国際・外国人 → 旅行
};

/**
 * theme スラッグ (20) → vertical。テーマページ (`/themes/*`) の広告解決に使う。
 * theme の SSOT は `packages/data-configs/src/theme-catalog/`。theme 追加時はここも更新。
 */
export const THEME_AFFILIATE_MAP: Record<string, AffiliateVertical> = {
  "aging-society":       "health",
  "consumer-prices":     "economy",
  "education-culture":   "education",
  "fishery-marine":      "economy",
  "foreign-residents":   "population",
  "healthcare":          "health",
  "labor-mobility":      "labor",
  "labor-wages":         "labor",
  "living-housing":      "housing",
  "local-economy":       "economy",
  "local-finance":       "furusato",
  "manufacturing":       "economy",
  "occupation-salary":   "labor",
  "population-dynamics": "population",
  "ports":               "mobility",
  "railway":             "mobility",
  "real-income":         "economy",
  "roads":               "mobility",
  "safety":              "mobility",
  "tourism":             "travel",
};

/** タグキー → vertical（tagKey ベース。blog frontmatter tags の写像） */
export const TAG_AFFILIATE_MAP: Record<string, AffiliateVertical> = {
  // 労働・賃金
  "wages": "labor", "labor": "labor", "employment": "labor",
  "labor-market": "labor", "minimum-wage": "labor",
  "industrial-structure": "labor",
  // 住宅・土地
  "housing": "housing", "real-estate": "housing", "relocation": "housing",
  "rent": "housing", "vacant-houses": "housing", "land-prices": "housing",
  "land-use": "housing",
  // 人口・世帯
  "population": "population", "household-structure": "population",
  "marriage": "population", "birth-rate": "population",
  "declining-birthrate": "population", "aging-population": "population",
  "childcare": "population",
  // 家計・経済・投資
  "economy": "economy", "household-finance": "economy", "gdp": "economy",
  "prices": "economy", "consumption": "economy", "income": "economy",
  "real-income": "economy", "savings": "economy", "savings-rate": "economy",
  "household-income": "economy", "household-head-income": "economy",
  "monthly-income": "economy", "income-inequality": "economy",
  "prefectural-income": "economy", "consumption-expenditure": "economy",
  "consumer-price-index": "economy",
  // 健康・医療
  "medical-care": "health", "health": "health", "long-term-care": "health",
  "welfare": "health",
  // エネルギー・水
  "energy": "energy", "water-supply": "energy", "environment": "energy",
  // 旅行・観光 (OTA)
  "tourism": "travel", "travel": "travel", "accommodation": "travel",
  "sightseeing": "travel",
  // 交通・移動・自動車 (自動車保険・車査定)
  "transportation": "mobility", "traffic-safety": "mobility",
  "traffic-accidents": "mobility", "public-safety": "mobility",
  "railway": "mobility", "roads": "mobility", "automobile": "mobility",
  // 教育・学習 (通信教育)
  "education": "education", "school": "education", "学習": "education",
  "教育": "education",
  // ふるさと納税・地方財政
  "public-finance": "furusato", "furusato-nozei": "furusato",
  "tax-revenue": "furusato", "local-government-finance": "furusato",
  "government-expenditure": "furusato",
  // 日本語 tagKey (記事 frontmatter は日本語タグをそのまま tagKey にするため)
  "賃金": "labor", "労働": "labor", "年収": "labor", "雇用": "labor",
  "労働時間": "labor", "残業": "labor", "働き方": "labor", "テレワーク": "labor",
  "エンジニア": "labor", "IT": "labor", "転職": "labor", "情報通信": "labor",
  "所得": "economy", "経済": "economy", "収入": "economy", "家計": "economy",
  "旅行": "travel", "観光": "travel", "宿泊": "travel",
  "自動車": "mobility", "交通": "mobility", "車": "mobility",
  // ★ 2026-07-28 追加: 公開 430 記事の実タグを集計し、頻出かつ意味が明確なものを写像した。
  //   これで tag→vertical の解決率が 19% (83 記事) → 70% (301 記事) に上がる。
  //   「都道府県ランキング」「地域差」「地域格差」「都道府県別」等の**汎用タグは意図的に入れない** —
  //   誤った軸へ流すくらいなら economy フォールバックの方が無害なため。
  "家計調査": "economy", "消費支出": "economy", "食費": "economy", "物価": "economy",
  "貯蓄": "economy", "可処分所得": "economy", "食文化": "economy", "消費量": "economy",
  "外食": "economy",
  "人口": "population", "高齢化": "population", "人口減少": "population",
  "少子化": "population", "出生率": "population", "世帯": "population",
  "結婚": "population", "子育て": "population",
  "医療": "health", "健康": "health", "介護": "health", "病院": "health",
  "地方財政": "furusato", "財政": "furusato", "税": "furusato",
  "住宅": "housing", "不動産": "housing", "土地": "housing", "空き家": "housing",
  "学校": "education", "進学": "education",
  "エネルギー": "energy", "電力": "energy", "通信": "energy",
  "交通事故": "mobility", "道路": "mobility", "鉄道": "mobility",
  // ★ 2026-09-02 追加: 公開 523 記事の実タグ × GSC 2026-W35 imp で棚卸しした。
  //   写像なしの 212 記事 (ブログ imp の 56%) のうち意図が明確なものを足し、解決率を
  //   記事数 311→363 / imp 44%→89% に上げる。寄せ先は CATEGORY_AFFILIATE_MAP と
  //   THEME_AFFILIATE_MAP の既存判断に揃える (同じ主題の ranking / theme ページと同じ広告が出る)。
  //   「都道府県格差」「地域差」「地名」「公務員」等の汎用・無意図タグは引き続き入れない。
  //   同日、出典調査による上書き (SURVEY_AFFILIATE_MAP) を導入したので、身長・気候のような
  //   「主題はあるが商材が無い」タグは写像せず調査側で null にする。
  // 教育 (educationsports → education)。身長・体重等の学校保健統計は意図が無いので
  //   写像せず、SURVEY_AFFILIATE_MAP の school-health-survey: null で広告を止める
  "高校生": "education", "中学生": "education",
  "教育スポーツ": "education", "大学": "education", "進学率": "education",
  "教育格差": "education", "収容力指数": "education", "図書館": "education",
  "博物館": "education", "文化施設": "education", "社会教育": "education",
  "文化資本": "education",
  // 社会保障 (socialsecurity → health)
  "熱中症": "health", "平均寿命": "health", "健康寿命": "health",
  // 鉱工業・商業 (miningindustry / commercial → economy)。manufacturing テーマも economy
  "製造業": "economy", "工業統計": "economy", "ものづくり": "economy",
  "製造品出荷額": "economy", "付加価値": "economy", "自動化": "economy",
  "半導体": "economy", "電子部品": "economy", "商業": "economy", "小売": "economy",
  "コンビニ": "economy", "酒類消費": "economy", "アルコール": "economy",
  "酒税改正": "economy", "消費": "economy",
  // 労働
  "労働生産性": "labor",
  // 農林水産 (agriculture → furusato: 産品は返礼品と直結) / 地方財政 (administrativefinancial → furusato)
  "農業": "furusato", "米": "furusato", "水稲収穫量": "furusato", "作物統計": "furusato",
  "漁獲量": "furusato", "水産": "furusato", "カツオ": "furusato", "特産品": "furusato",
  "地方債": "furusato", "借金": "furusato", "財政健全性": "furusato",
  "将来負担比率": "furusato", "財政力指数": "furusato",
  // 人口 (外国人住民は foreign-residents テーマと同じ population)
  "人口密度": "population", "都市化": "population", "人口集中地区": "population",
  "昼夜間人口": "population", "ベッドタウン": "population", "人口構成": "population",
  "人口流出": "population", "在留外国人": "population", "外国人": "population",
  "多文化共生": "population", "国際化": "population", "世帯構造": "population",
  "単独世帯": "population", "核家族": "population", "ひとり親世帯": "population",
  "共働き": "population",
  // 国土・気候 (landweather / construction → housing)
  "可住地面積": "housing", "土地利用": "housing", "国土": "housing", "林野面積": "housing",
  "地価": "housing", "移住": "housing",
  //   気候・気温・降雪は意図が無いので写像しない (weather-statistics: null で止める)
  // エネルギー (太陽光・再エネは電力・蓄電池の案件と直結)
  "再生可能エネルギー": "energy", "太陽光発電": "energy", "風力発電": "energy",
  "カーボンニュートラル": "energy", "GX": "energy", "太陽光": "energy",
  "日照時間": "energy", "快晴日数": "energy", "電気代": "energy",
};

/**
 * 市区町村テーマ (`/municipalities/themes/<slug>`) → vertical。
 * slug の SSOT は `packages/data-configs/src/geo-scope/` の MUNICIPALITY_THEME_CATALOGS。
 * 寄せ先は同じ主題の CATEGORY_AFFILIATE_MAP / THEME_AFFILIATE_MAP と揃える (2026-09-02)。
 */
export const MUNICIPALITY_THEME_AFFILIATE_MAP: Record<string, AffiliateVertical> = {
  "aging-society":        "health",
  "population":           "population",
  "households":           "population",
  "migration":            "population",
  "vital-statistics":     "population",
  "foreign-residents":    "population",
  "urban-structure":      "housing",
  "local-finance":        "furusato",
  "commerce":             "economy",
  "establishments":       "economy",
  "manufacturing":        "economy",
  "medical-welfare":      "health",
  "education":            "education",
  "housing":              "housing",
  "commuting":            "mobility",
  "labor":                "labor",
  "safety-environment":   "mobility",
  "agriculture-forestry": "furusato",
  "land-area":            "housing",
};

/**
 * 広告に付与された vertical を解決する。`vertical` を正とし、未設定なら categoryKey から写像 (後方互換)。
 * (Step B で全広告に vertical を必須化するまでの移行フォールバック)
 */
export function adVertical(ad: {
  vertical?: string | null;
  categoryKey?: string | null;
}): AffiliateVertical | undefined {
  if (ad.vertical) return ad.vertical as AffiliateVertical;
  if (ad.categoryKey) return CATEGORY_AFFILIATE_MAP[ad.categoryKey];
  return undefined;
}

/** カテゴリ別テーマカラー（Tailwind クラス: border / bg / icon） */
export const AFFILIATE_THEME: Record<
  AffiliateVertical,
  { border: string; bg: string; icon: string; emoji: string }
> = {
  labor:      { border: "border-blue-100",   bg: "bg-blue-50/50",   icon: "text-blue-400",   emoji: "💼" },
  housing:    { border: "border-orange-100", bg: "bg-orange-50/50", icon: "text-orange-400", emoji: "🏠" },
  population: { border: "border-pink-100",   bg: "bg-pink-50/50",   icon: "text-pink-400",   emoji: "💑" },
  economy:    { border: "border-green-100",  bg: "bg-green-50/50",  icon: "text-green-500",  emoji: "💰" },
  health:     { border: "border-teal-100",   bg: "bg-teal-50/50",   icon: "text-teal-500",   emoji: "💪" },
  energy:     { border: "border-cyan-100",   bg: "bg-cyan-50/50",   icon: "text-cyan-500",   emoji: "💧" },
  travel:     { border: "border-amber-100",  bg: "bg-amber-50/50",  icon: "text-amber-500",  emoji: "✈️" },
  furusato:   { border: "border-red-100",    bg: "bg-red-50/50",    icon: "text-red-400",    emoji: "🎁" },
  education:  { border: "border-indigo-100", bg: "bg-indigo-50/50", icon: "text-indigo-400", emoji: "📚" },
  mobility:   { border: "border-slate-200",  bg: "bg-slate-50/50",  icon: "text-slate-500",  emoji: "🚗" },
};

/**
 * 出典調査 (surveys.json の id) → vertical。**カテゴリより細かい主題**で意図を決める最上位の写像。
 *
 * 17 軸のカテゴリは「納豆消費量」と「県民所得」を同じ economy に落とすが、出典調査
 * (家計調査 / 県民経済計算) なら区別できる。ランキングは item.json、ブログは all.json に
 * surveyIds が焼き込み済みなので推測は入らない (正典 `survey-linkage-standards.md`)。
 *
 * 値の意味:
 *   - vertical: その調査のページはカテゴリ・タグに関わらずこの軸で解決する
 *   - null:     主題はあるが合う商材が無い。意図軸の広告を**出さない** (ハウス枠・AdSense のみ)。
 *               意図の合わない広告を上位に置くより空の方が無害 (rules §5)
 *
 * ここに無い調査はタグ → カテゴリの従来解決に落ちる。追加は「カテゴリ写像より明らかに
 * 良い/悪い」と実測で言える調査だけ (2026-09-03: GSC 2026-W35 の imp 上位から選定)。
 */
export const SURVEY_AFFILIATE_MAP: Readonly<Record<string, AffiliateVertical | null>> = {
  // 家計調査 (品目別): ランキング 28,867 imp/週・ブログ 12,366。読者は「◯◯をよく買う県」を見に来る。
  //   金融 (economy) ではなく返礼品 (furusato) と楽天商品カードが合う
  "kakei-chousa": "furusato",
  // 学校保健統計 (身長・体重): 6,370 imp。合う商材が無い (資格講座・研修が出ていた)
  "school-health-survey": null,
  // 気象統計 (日照・気温・降雪): 合う商材が無い (不動産・バーチャルオフィスが出ていた)
  "weather-statistics": null,
  // 面積調 / 自然公園面積: 同上
  "area-survey": null,
  "natural-park-area": null,
  // 犯罪・火災・水害: safetyenvironment → mobility (自動車保険) は交通事故には合うがこれらには合わない
  "police-statistics": null,
  "fire-annual-report": null,
  "flood-statistics": null,
  // 廃棄物・水質・上下水道: infrastructure/safetyenvironment → mobility は合わない
  "waste-management-survey": null,
  "water-pollution-survey": null,
  "sewerage-statistics": null,
  "waterworks-statistics": null,
  // 地方公務員給与: administrativefinancial → furusato ではなく転職 (labor)
  "local-public-employee-salary": "labor",
  // 在留外国人統計: international → travel (旅行) ではなく population (foreign-residents テーマと同じ)
  "foreign-residents-statistics": "population",
};

/** tagKey 群 → 重複なし vertical 群 (出現順)。 */
export function verticalsFromTagKeys(tagKeys: readonly string[]): AffiliateVertical[] {
  const seen = new Set<AffiliateVertical>();
  for (const tagKey of tagKeys) {
    const v = TAG_AFFILIATE_MAP[tagKey];
    if (v) seen.add(v);
  }
  return [...seen];
}

export interface ContentVerticalInput {
  /** 出典調査 id (先頭が主調査)。ranking item.json / blog all.json の surveyIds */
  surveyIds?: readonly string[] | null;
  /** 記事・指標のタグキー */
  tagKeys?: readonly string[] | null;
  /** e-Stat 17 軸カテゴリ */
  categoryKey?: string | null;
}

export type ContentVerticalResolution =
  | { source: "survey"; vertical: AffiliateVertical; verticals: AffiliateVertical[] }
  | { source: "survey-none"; vertical: null; verticals: [] }
  | { source: "tags"; vertical: AffiliateVertical; verticals: AffiliateVertical[] }
  | { source: "category"; vertical: AffiliateVertical; verticals: AffiliateVertical[] }
  | { source: "none"; vertical: null; verticals: [] };

/**
 * ページの内容から広告の意図軸を 1 つ決める。全ページ共通の解決順:
 *   1. 出典調査 (SURVEY_AFFILIATE_MAP に載っている調査。null なら意図軸の広告を出さない)
 *   2. タグ (TAG_AFFILIATE_MAP。複数 vertical に解決した場合は `verticals` に全部残す)
 *   3. カテゴリ (CATEGORY_AFFILIATE_MAP)
 *   4. 無し (推測で別の軸へ流さない)
 * 純関数。R2 を読まない。
 */
export function resolveContentVertical(input: ContentVerticalInput): ContentVerticalResolution {
  for (const surveyId of input.surveyIds ?? []) {
    if (!(surveyId in SURVEY_AFFILIATE_MAP)) continue;
    const v = SURVEY_AFFILIATE_MAP[surveyId];
    return v
      ? { source: "survey", vertical: v, verticals: [v] }
      : { source: "survey-none", vertical: null, verticals: [] };
  }
  const byTags = verticalsFromTagKeys(input.tagKeys ?? []);
  if (byTags.length > 0) {
    return { source: "tags", vertical: byTags[0], verticals: byTags };
  }
  const byCategory = input.categoryKey ? CATEGORY_AFFILIATE_MAP[input.categoryKey] : undefined;
  if (byCategory) {
    return { source: "category", vertical: byCategory, verticals: [byCategory] };
  }
  return { source: "none", vertical: null, verticals: [] };
}
