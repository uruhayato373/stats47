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

export interface CalculationOptions {
  isCalculated: boolean;
  isPairRelationship?: boolean;
  normalizationOptions?: NormalizationOption[];
  /** legacy: 計算式 (旧フォーマット) */
  formula?: string;
  description?: string;
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

/**
 * ランキングリンクカードのサムネイル表示バリアント。
 * "map" = 地図型 (タイル地図) / "number" = 数値型 (代表値強調)。
 * 正典(A/B解決規則): apps/web/src/features/ranking/utils/resolve-thumbnail-variant.ts
 */
export type RankingThumbnailVariant = "map" | "number";

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
  /**
   * ランキングリンクカードのサムネイル表示バリアント (A/B)。
   * "map" = 地図型 (47 都道府県タイル地図・後方互換の標準) / "number" = 数値型 (代表値を強調)。
   * 未設定は解決規則で最終的に "map" になる (完全未設定は必ず A 型)。
   * 正典(A/B解決規則): apps/web/src/features/ranking/utils/resolve-thumbnail-variant.ts
   */
  thumbnailVariant?: RankingThumbnailVariant;
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
  isFeatured?: boolean;
  featuredOrder?: number;
}

/** registry へ登録される record 型 */
export type MetricRegistry = Record<string, MetricConfig>;
