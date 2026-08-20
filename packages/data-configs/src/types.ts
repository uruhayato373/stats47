/**
 * MetricConfig 型定義 — page ごとの統計データ要件の真実源 (SSOT)
 *
 * 配置: packages/data-configs/src/metrics/<metric-key>.ts
 * registry: packages/data-configs/src/registry.ts (codegen)
 * D1 metrics テーブル: 上記から build-time export される cache (編集禁止)
 */

export type EntityKind = "prefecture" | "city" | "port" | "migration-flow";

export const ENTITY_KINDS = [
  "prefecture",
  "city",
  "port",
  "migration-flow",
] as const;

/** データの取得元 */
export type SourceConfig =
  | EstatSource
  | KakeiChousaSource
  | MlitSource
  | ExternalSource
  | CalculatedSource;

export interface EstatSource {
  kind: "estat";
  /** e-Stat statsDataId (10桁) */
  statsDataId: string;
  /** 大分類カテゴリ (例 "#C04505") */
  cdCat01?: string;
  /** サブカテゴリ */
  cdCat02?: string;
  /** 第3カテゴリ軸 (3軸テーブル用。例 患者調査 T37 の施設の種類=入院/外来) */
  cdCat03?: string;
  /**
   * 第4カテゴリ軸 (4軸以上のテーブル用。例 就業構造基本調査のフリーランス本業/副業別 × 本業所得)。
   * ★軸を 1 つでも絞り忘れると、同じ県が複数行になり rank が通し番号化して配信データが壊れる
   * (2026-07-30 に 15 metric で実害。正典: .claude/todo/backlog.md RANKING-VALUES-PARTITION-INTEGRITY-01)。
   */
  cdCat04?: string;
  /**
   * 第5カテゴリ軸。社会生活基本調査は cat01-cat05 の 5 軸を持つ表がある
   * (例 スマートフォン使用者の行動: 男女 × 曜日 × 教育 × 使用時間 × 行動の種類)。
   */
  cdCat05?: string;
  /**
   * 表章項目 (tab) の絞り込み。
   * cat 軸ではなく tab に複数系列を持つ表がある (例 経済センサスの 701=事業所数 / 703=販売額、
   * 賃金構造基本統計の 08=給与額 / 12=賞与)。指定しないと系列が混在する。
   *
   * ★tab コードに年が含まれる表がある (経済センサスは "703-2021")。素の "703" では 0 件になるので、
   * 必ず getMetaInfo で実コードを確認してから書く。年が変わるとコードも変わる点に注意。
   */
  cdTab?: string;
  /**
   * 同一表の複数 tab を線形結合して 1 系列にする (`cdTab` とは排他)。
   *
   * 賃金構造基本統計調査には「年収」という表章項目が無く、
   * 平均年収 = きまって支給する現金給与額 (tab=08) × 12 + 年間賞与その他特別給与額 (tab=12)
   * で求める。tab を 1 つ pin するだけでは月額や賞与の生値になってしまう
   * (2026-07-30 実測: 大工の配信値 1,686.5 千円 = 月額系の生値。正しくは約 3,400 千円)。
   *
   * 各 tab を個別に取得し (area, time) をキーに合算する。
   * どれか 1 つでも欠測なら合算せず欠測として扱う (部分和を配信しない)。
   *
   */
  tabCombination?: ReadonlyArray<{ cdTab: string; factor: number }>;
  /**
   * 指定した cat 軸のメンバーを**合算**して全体値にする。
   *
   * 総数コードが無い軸、または一部の県にしか総数が出ない軸のためのもの。
   * 港湾調査で実測 (2026-07-30):
   *   - 入港船舶表の「航路」は 外国航路 / 内国航路 の 2 つだけで総数が無い
   *   - 海上出入貨物表の「輸送形態」は計を持つが、**輸送形態が 1 つだけの県には計の行が出ない**
   *     (岩手は一般のみで計が無い / 東京は 計 = 一般 + 自動車航送船 を実測で確認)
   *     計を pin すると 39 県 → 33 県に減る。メンバーを足せば全県そろう
   *
   * 欠測メンバーは 0 として扱う (その県にその区分が無いだけ)。
   * ただし**全メンバーが欠測なら合算せず欠測**にする (0 を捏造しない)。
   */
  axisSum?: {
    axis: "cat01" | "cat02" | "cat03" | "cat04" | "cat05";
    codes: readonly string[];
  };
  /**
   * 同一 cat 軸のメンバーから**率**を作る (分子の和 / 分母の和 × 100)。
   *
   * 「率」の表章項目を持たず実数だけを載せる表が多い。分子と分母が同じ軸の別メンバーに
   * 入っているので、取り込み時に (area, time) で join して割る。
   *
   * **どちらも配列**なのは「部分 / 部分の合計」が実在するため:
   *   - 総数コードがある表: `{ numeratorCodes: ["22"], denominatorCodes: ["0"] }`
   *     (住宅・土地統計調査 0004021440 の cat01 = 0:総数 / 22:空き家 → 空き家率)
   *   - 総数コードが無い表: `{ numeratorCodes: ["322"], denominatorCodes: ["321","322"] }`
   *     (就業構造基本調査の cat04 = 321:正規 / 322:非正規 → 非正規率)
   * 1 コードだけの場合も配列で書く (2 通りの書き方を作らない)。
   *
   * 分母が null または 0 以下の (area, time) は欠測 `"-"` にする (0 除算も 0% も捏造しない)。
   * 分子側の欠測メンバーは 0 扱い (`axisSum` と同じ)。ただし分子が全欠測なら欠測。
   * 値域は shape-gate の percent 検査が自動で見る (分子分母を取り違えると 100 を超えて落ちる)。
   */
  axisRatio?: {
    axis: "cat01" | "cat02" | "cat03" | "cat04" | "cat05";
    numeratorCodes: readonly string[];
    denominatorCodes: readonly string[];
  };
  /**
   * 都道府県が area 軸ではなく **cat 軸**に入っている表の写像。
   *
   * 患者調査 (0004026104 系) は area 軸を持たず、都道府県が cat03 のコード 1〜48
   * (1=全国 2=北海道 … 48=沖縄) に入る。`@area` を読む通常経路では構造的に 0 行になる
   * (2026-07-30 に「cdCat01 の誤座標」と誤診していた 6 metric の真因)。
   *
   * - `seq-pref`: コード n → `String(n-1).padStart(2,"0")+"000"`。
   *   取り込み時に getMetaInfo の CLASS 名を県名マスタと突合し、不一致なら fail する
   *   (写像の決定性だけに頼らず、実データで検証する)。
   * - `name`: CLASS 名を県名で解決する (任意コードの表用。例 農林業センサス系の
   *   `1002=全国農業地域_北海道`)。全国・地域ブロックは落とす。
   */
  areaAxis?: {
    axis: "cat01" | "cat02" | "cat03" | "cat04" | "cat05";
    scheme: "seq-pref" | "name";
  };
  /**
   * 時間軸の粒度を年計に限定する。
   * 月次・四半期を同じ表に持つ統計がある (例 商業動態統計は 1 年あたり 年計1 + 四半期4 + 月次12 = 17 行)。
   * `extractYearCode` が 4 桁年へ正規化すると同じ年に潰れて重複するため、年計 (`YYYY000000`) だけを採る。
   * cdTime で絞らないのは R2 キャッシュの分断を避けるため (`.claude/rules/estat-api.md`)。
   */
  timeScope?: "annual";
  /**
   * **金額単位族の換算専用**。e-Stat の原単位 (`@unit`) から `config.unit` へ直すための倍率。
   * `10^k` 以外を書かない。
   *
   * e-Stat は倍率を単位文字列に埋め込む (`千円` / `百万円`)。取り込みは値を変換せず
   * `unit` は config の文字列を貼るだけなので、宣言が無いと config が「万円」でも値は
   * 千円のまま配信される。2026-08-05 に職業別平均年収 39 件がこの状態で 10 倍過大だった
   * (東京の調理従事者が 4,153.9「万円」)。
   *
   * 期待値は `10^(原単位の指数 - config.unit の指数)`。千円 → 万円 なら `0.1`、
   * 百万円 → 円 なら `1000000`。整合しているかは
   * `packages/data-configs/scripts/audit-money-unit-scale.ts` が全数監査する。
   *
   * ★`tabCombination` の `factor` とは別物。あちらは系列の線形結合の係数で**単位を変えない**
   * (千円を 12 倍しても千円)。混同すると二重に掛かる。
   *
   * 正典: `.claude/rules/unit-semantics-standards.md` / `packages/data-configs/src/money-unit.ts`
   */
  valueScale?: number;
  /** 表示用 source 名 (UI ラベル) */
  displayName?: string;
  /** 出典 URL (UI リンク) */
  url?: string;
}

export interface KakeiChousaSource {
  kind: "kakei-chousa";
  /** 家計調査の cat01 等のフィルタ (実データは入れ子の {name,url} も含む) */
  filter?: Record<string, unknown>;
  displayName?: string;
  url?: string;
}

export interface MlitSource {
  kind: "mlit";
  /** 国交省 resource ID */
  resourceId: string;
  displayName?: string;
  url?: string;
}

export interface ExternalSource {
  kind: "external";
  /**
   * 一般化された外部 source (custom fetcher 必要)。既知の値は KNOWN_FETCHER_KEYS。
   * "manual" (手動抽出・PDF/xlsx/HTML 由来) は config.provenance (SourceProvenance) 必須。
   * 正典: `.claude/rules/data-provenance-standards.md`
   */
  fetcherKey: string;
  /**
   * fetcher 依存の設定。手動抽出 (fetcherKey:"manual") は provenance を格納する:
   * `{ source:{name,url,license?}, description?, provenance: SourceProvenance }`。
   * 機械再取得系 (mlit_ksj/estat) は再取得キー (ksjDataId+ksjVersion / statsDataId) を格納する。
   */
  config: Record<string, unknown>;
  displayName?: string;
  url?: string;
}

/**
 * 既知の fetcherKey。"unknown" は出典欠落を意味し新規投入禁止 (既存は是正対象)。
 * lint (validate-metric-config.ts) が provenance 必須クラスの判定に使う。
 */
export const KNOWN_FETCHER_KEYS = [
  "manual",
  "mlit_ksj",
  "mlit_dpf",
  "estat",
  "ssds",
  "local-public-employee-salary",
  "calculated",
  "unknown",
] as const;
export type KnownFetcherKey = (typeof KNOWN_FETCHER_KEYS)[number];

/**
 * 手動抽出データ (PDF/xlsx/HTML 由来) の再現性メタ (provenance)。
 * statsDataId 等で機械再取得できない source は、これが無いと復元不能になる。
 * 手本: `packages/data-configs/src/metrics/ambulance-hospital-arrival-time.ts`。
 * lint は fetcherKey:"manual" に対し {url|pdfUrl, accessedAt, extraction, verification, restore} を必須化する。
 */
export interface SourceProvenance {
  /** 版一覧/ランディングページ URL (年版で変わりうる) */
  publicationIndexUrl?: string;
  /** 実データファイルの直リンク (PDF/xlsx/CSV)。復元の起点 */
  pdfUrl?: string;
  /** 汎用: 実ファイル URL (pdf 以外) */
  url?: string;
  /** 表名・シート名 (例 "別表8の1 病院収容所要時間別搬送人員の状況") */
  table?: string;
  /** PDF 内ページ番号 */
  pdfPage?: number;
  /** どの列/セルが値か (例 "令和6年中 平均(分)") */
  valueColumn?: string;
  /** データの対象年 (例 "令和6年(2024)中") */
  dataYear?: string;
  /** アクセス日 (ISO date) */
  accessedAt?: string;
  /** 抽出手法 (再現手順) */
  extraction?: string;
  /** 検算 (公表全国値との一致等) */
  verification?: string;
  /** 復元コマンド (誰でも一次資料から再取得・突合できる) */
  restore?: string;
}

export interface CalculatedSource {
  kind: "calculated";
  /** 計算式 (numerator / denominator 等の組合せ) */
  formula: CalculationFormula;
}

export type CalculationFormula =
  | { op: "divide"; numerator: string; denominator: string }
  | { op: "multiply"; left: string; right: string }
  | { op: "per_population"; numerator: string };

/** 取得対象年 */
export type YearSpec =
  | "all"
  | { from: number; to: number }
  | { years: number[] };

/** 可視化 */
export interface VisualizationConfig {
  /** D3 color interpolator name */
  colorScheme?: string;
  colorSchemeType?: "sequential" | "diverging";
  minValueType?: "zero" | "data-min";
  /** 動画演出用プリセット */
  preset?: string;
  /** diverging のときの中央値定義 ("zero" | "median" | "custom" 等) */
  divergingMidpoint?: string;
  /** divergingMidpoint = "custom" のときの値 */
  divergingMidpointValue?: number;
  /** カラースケール反転 */
  isReversed?: boolean;
  /** diverging で対称化 */
  isSymmetrized?: boolean;
}

/** 表示 */
export interface DisplayConfig {
  conversionFactor?: number;
  decimalPlaces?: number;
  displayUnit?: string;
  /** legacy: display にも normalizationOptions が入っている metric あり */
  normalizationOptions?: NormalizationOption[];
  /** legacy: railway-passengers 等で display 内に isCalculated が入っているケース */
  isCalculated?: boolean;
}

/** 計算オプション (per_population, per_area などの派生 metric 生成定義) */
export interface NormalizationOption {
  type: "per_population" | "per_area";
  label: string;
  unit: string;
  scaleFactor: number;
  decimalPlaces: number;
}

/**
 * 分子・分母・結果それぞれの期間基準。
 *
 * ★金額の単位 (円/千円) が同じでも **期間が違えば足し引きできない**。実例:
 * `disposable-income-after-rent` は月額の可処分所得から**年額**の民営家賃を引いており、
 * 控除額が 12 倍過大だった (2026-08-05 発見・1 位が山形→東京に入れ替わる規模)。
 * e-Stat のメタは期間を明示しない (`@unit` はどちらも「円」) ため機械では判別できず、
 * **config に人が宣言する以外に検出手段が無い**。
 *
 * 換算は `result` を基準に決まる (月額結果に年額の項が来たら ÷12)。
 * 金額スケール (千円→万円 = 10^k) は別軸で、そちらは `MONEY-UNIT-SCALE-01` が扱う。
 */
export interface PeriodAlignment {
  numerator: "monthly" | "annual";
  denominator: "monthly" | "annual";
  result: "monthly" | "annual";
}

export interface CalculationOptions {
  isCalculated: boolean;
  isPairRelationship?: boolean;
  normalizationOptions?: NormalizationOption[];
  /** legacy: 計算式 (旧フォーマット) */
  formula?: string;
  description?: string;
  /**
   * 分子・分母の期間基準。`type:"subtraction"` は宣言必須
   * (lint `[calc-period]`)。比は期間が約分されるので任意。
   */
  periodAlign?: PeriodAlignment;
  /**
   * 計算結果に掛ける定数。率を % にする `100` が主用途。
   * 期間換算 (`periodAlign`) とは独立に適用する。
   */
  scaleFactor?: number;
  /** legacy: 分子/分母 (複数 naming convention あり) */
  type?: string;
  calculationType?: string;
  numerator?: string;
  denominator?: string;
  numeratorKey?: string;
  denominatorKey?: string;
  numeratorRankingKey?: string;
  denominatorRankingKey?: string;
}

/**
 * e-Stat 機械分類の category キー (17 軸固定)。表示名・アイコンは
 * `categories.ts` の CATEGORY_DEFS が SSOT。順序はそちらに合わせる。
 *
 * ★ `MetricConfig.category` をこの union で縛ることで、`port` / `uncategorized`
 *   / `labor` / `local-economy` のような無効キーを **コンパイルエラー**にして
 *   再発を防ぐ (lint: validate-metric-config.ts でも runtime 検証)。
 */
export const CATEGORY_KEYS = [
  "landweather",
  "population",
  "laborwage",
  "agriculture",
  "miningindustry",
  "commercial",
  "economy",
  "construction",
  "energy",
  "tourism",
  "educationsports",
  "administrativefinancial",
  "safetyenvironment",
  "socialsecurity",
  "international",
  "infrastructure",
  "ict",
] as const;

export type CategoryKey = (typeof CATEGORY_KEYS)[number];

/** Metric 1 つ分の全データ要件 */
export interface MetricConfig {
  /** kebab-case の一意キー。ファイル名と一致 */
  key: string;
  /**
   * 正準なランキング名 (h1 に表示)。
   * ★ 年 (例: 2018年)・データ注釈 (※/調査対象外) を **含めない**。
   *   年は `years`/`latestYear` が、注釈は `note` が持つ。
   */
  title: string;
  /**
   * 同名指標を区別するための短い定義補足のみ (例: 「乳用牛(めす)の飼養頭数合計」)。
   * ★ title の繰り返しにしない。データ注釈 (※) は `note` に置く。
   */
  subtitle?: string;
  /**
   * データの注意書き / methodology (例: 「内陸県は漁港がなく調査対象外 (0で表示)」)。
   * UI ではタイトルではなくチャート直下のキャプションに表示する。
   */
  note?: string;
  /** 指標の定義・説明 (散文)。「統計の定義」カードに表示。 */
  description?: string;
  /** 単位 (例: "人", "万円")。空文字・"‐" は禁止。 */
  unit: string;
  /** e-Stat 機械分類の category キー (17 軸のいずれか)。CategoryKey で型強制。 */
  category: CategoryKey;
  /** 観測値の取得元 */
  source: SourceConfig;
  /** 保持するエンティティ種別 (どの stats_* に相当するか) */
  entities: EntityKind[];
  /** 取得年範囲 */
  years: YearSpec;
  yearFormat?: "fiscal" | "calendar" | "plain";
  visualization?: VisualizationConfig;
  display?: DisplayConfig;
  calculation?: CalculationOptions;
  /** sub-property tags (旧 additional_categories) */
  additionalCategories?: string[];
  /** group_key — テーマダッシュボードでの集約用 */
  groupKey?: string;
  /**
   * 調査 ID (surveys master への参照)。RankingItem.surveyId の SSOT。
   * statsDataId から決定的に導出できない editorial データのため config が保持する。
   */
  surveyId?: string;
  /**
   * 関連タグの tagKey 配列 (例: ["population", "aging"])。RankingItem.tags の SSOT。
   * 手動付与の editorial データ。builder で { tagKey } 形に写像する。
   */
  tags?: string[];
  /** SEO */
  seoTitle?: string;
  seoDescription?: string;
  /** 表示用 ON/OFF */
  isActive?: boolean;
}

/** registry へ登録される record 型 */
export type MetricRegistry = Record<string, MetricConfig>;
