import type { Area } from "@stats47/area";
import type { GetStatsDataParams } from "@stats47/estat-api/server";

// ============================================================================
// DashboardComponent 型（DB スキーマ削除後のローカル定義）
// ============================================================================

/**
 * dashboard_components テーブルの行型。
 * migration 0014 でテーブル削除済みだが、コンポーネント側で型として必要。
 */
export interface DashboardComponent {
  id: string;
  /** page_components.chart_key — D1 優先フェッチ用 */
  componentKey?: string;
  componentType: string;
  title: string | null;
  componentProps: string | null;
  rankingLink: string | null;
  sourceLink: string | null;
  sourceName: string | null;
  dataSource: string | null;
  gridColumnSpan: number | null;
  gridColumnSpanTablet: number | null;
  gridColumnSpanSm: number | null;
  gridColumnSpanMobile: number | null;
  sortOrder: number | null;
}

// ============================================================================
// 共通 Props（DB カラム + ルートパラメータから自動抽出）
// ============================================================================

/**
 * 全ダッシュボードコンポーネントが受け取る共通フィールド
 *
 * - DB の DashboardComponent から: title, rankingLink, sourceLink, dataSource
 * - ルートパラメータから: area (Area オブジェクト)
 */
export interface DashboardCommonProps {
  /** コンポーネントタイトル */
  title: string;
  /** page_components.chart_key — D1 優先フェッチ用 */
  componentKey?: string;
  /** 地域情報（areaCode, areaName, areaType, parentAreaCode を含む） */
  area: Area;
  /** ランキング詳細ページへのリンク */
  rankingLink?: string | null;
  /** rankingLink に対応するリンクラベル（未指定時は title を使用） */
  rankingLinkLabel?: string;
  /** データソースへのリンク */
  sourceLink?: string | null;
  /** データソース名（例: "社会・人口統計体系"） */
  sourceName?: string | null;
  /** データソース種別（デフォルト: "estat"） */
  dataSource?: string;
  /** 注釈テキスト（カード下部に表示、出典とは別） */
  annotation?: string;
  /** 関連ランキングへのリンク一覧 */
  rankingLinks?: Array<{ label: string; url: string }>;
}

// ============================================================================
// Y軸設定（コンポーネント単位で componentProps に指定）
// ============================================================================

/**
 * チャートの Y 軸ドメイン制御。
 *
 * - "auto": 表示データのみから自動算出（デフォルト）
 * - "sync": 全都道府県データから算出し、比較時にスケールを揃える
 * - "fixed": domain で指定した固定範囲を使用
 */
export interface YAxisConfig {
  mode: "auto" | "sync" | "fixed";
  /** fixed モード時のドメイン [min, max] */
  domain?: [number, number];
}

// ============================================================================
// 固有 Config 用の共有型
// ============================================================================

/** サンバーストチャート用のグループ定義 */
export interface SunburstGroup {
  name: string;
  childCodes: string[];
}

/** サンバーストチャート用の e-Stat パラメータ */
export interface SunburstEstatParams {
  statsDataId: string;
  rootCode: string;
  childCodes: string[];
  groups?: SunburstGroup[];
}

/** definitions-card のグループ内アイテム */
export interface DefinitionItem {
  name: string;
  /** e-Stat 統計コード */
  cat01?: string;
  /** stats47 のランキングキー */
  rankingKey?: string;
}

/** definitions-card のグループ定義 */
export interface DefinitionGroup {
  name: string;
  description?: string;
  /** lucide アイコン名（例: "wallet", "building"） */
  icon?: string;
  /** Tailwind カラー名（例: "emerald", "amber"） */
  color?: string;
  items: DefinitionItem[];
}

/** definitions-card のファイルベースデータ（レジストリに登録） */
export interface DefinitionSetData {
  /** ヘッダー説明文 */
  description?: string;
  /** バッジラベル */
  badge?: string;
  /** 構造化グループ */
  groups: DefinitionGroup[];
  /** データソース表示 */
  source?: string;
}

/** multi-stats-card の各カテゴリ定義 */
export interface MultiStatItem {
  categoryFilter: string;
  label: string;
}

/** stats-table の各行定義 */
export interface StatsTableRow {
  label: string;
  categoryFilter: string;
  rankingLink?: string;
}

// ============================================================================
// 固有 Config（componentProps JSON から取得）
// ============================================================================

/**
 * componentType → 固有 config のマッピング（Single Source of Truth）
 *
 * DB の component_props カラム (JSON) をパースした結果の型。
 */
export type DashboardConfigMap = {
  "kpi-card": {
    estatParams: GetStatsDataParams;
    unit?: string;
  };
  "line-chart": {
    estatParams: GetStatsDataParams | GetStatsDataParams[];
    labels?: string[];
    description?: string;
    yAxisConfig?: YAxisConfig;
    /** チャート下に最新値リストを表示するか（デフォルト: false） */
    showLatestValues?: boolean;
  };
  "bar-chart": {
    estatParams: GetStatsDataParams[];
    labels?: string[];
    unit?: string;
    chartType?: "bar" | "stacked-bar" | "grouped";
    yAxisConfig?: YAxisConfig;
  };
  "diverging-bar-chart": {
    estatParams: GetStatsDataParams[];
    labels?: string[];
    unit?: string;
    yAxisConfig?: YAxisConfig;
    /** 最新値に添える率データの e-Stat パラメータ（正・負の順） */
    rateParams?: GetStatsDataParams[];
    rateLabels?: string[];
  };
  "mixed-chart": {
    /** 棒グラフ系列（左Y軸）の e-Stat パラメータ */
    columnParams: GetStatsDataParams[];
    /** 折れ線系列（右Y軸）の e-Stat パラメータ */
    lineParams: GetStatsDataParams[];
    /** 棒グラフ系列のラベル */
    columnLabels?: string[];
    /** 折れ線系列のラベル */
    lineLabels?: string[];
    /** 左Y軸の単位 */
    leftUnit?: string;
    /** 右Y軸の単位 */
    rightUnit?: string;
    description?: string;
  };
  sunburst: SunburstEstatParams & { description?: string };
  treemap: SunburstEstatParams & { description?: string };
  "bar-chart-race": {
    estatParams: GetStatsDataParams;
    unit?: string;
    description?: string;
    /** アスペクト比（CSS aspect-ratio 値。デフォルト: "16/9"） */
    aspectRatio?: string;
  };
  "multi-stats-card": {
    statsDataId: string;
    categories: MultiStatItem[];
    showTotal?: boolean;
    totalLabel?: string;
  };
  "definitions-card": {
    definitionSetKey: string;
  };
  "slide-presentation": {
    slideSetKey: string;
    /** アスペクト比（CSS aspect-ratio 値。デフォルト: "16/9"） */
    aspectRatio?: string;
  };
  "stats-table": {
    statsDataId: string;
    rows: StatsTableRow[];
    description?: string;
  };
  "stacked-area": {
    estatParams: GetStatsDataParams[];
    labels?: string[];
    unit?: string;
    /** 100% 積み上げモード */
    normalize?: boolean;
    description?: string;
    yAxisConfig?: YAxisConfig;
  };
  "radar-chart": {
    /** レーダー軸定義（各軸に対応するランキングキー） */
    axes: { key: string; label: string; rankingKey?: string }[];
    description?: string;
  };
  "attribute-matrix": {
    statsDataId: string;
    /** 行定義（各行のラベルとカテゴリコード配列） */
    rows: Array<{ label: string; codes: string[] }>;
    /** 列ヘッダーラベル */
    columns: string[];
    unit?: string;
    description?: string;
  };
  "ranking-chart": {
    /** ランキングキー配列（ranking_items の source_config から estatParams を動的解決） */
    rankingKeys: string[];
    /** 内部で使用するチャートタイプ */
    chartType: "line-chart" | "bar-chart" | "grouped";
    labels?: string[];
    unit?: string;
    yAxisConfig?: YAxisConfig;
  };
  "pyramid-chart": {
    /** 男性の年齢別人口パラメータ配列（0-4歳男, 5-9歳男, ...） */
    maleParams: GetStatsDataParams[];
    /** 女性の年齢別人口パラメータ配列（0-4歳女, 5-9歳女, ...） */
    femaleParams: GetStatsDataParams[];
    /** 年齢階級ラベル配列 */
    ageGroups?: string[];
    description?: string;
  };
  "composition-chart": {
    /** 統計表ID（全セグメント共通・単一年用） */
    statsDataId?: string;
    /**
     * 複数年データソース（各年が別 statsDataId のデータセット用）
     * statsDataId の代わりに指定する。
     */
    multipleStatsSources?: Array<{
      statsDataId: string;
      /** 調査年（yearCode / yearName に使用） */
      surveyYear: string;
      /** JIS 2桁プレフィックスへのオフセット（例: 2 → 01000→03000） */
      areaCodeOffset?: number;
      /** cat01 の固定値（セグメントコードを cdCat02 で指定する場合） */
      cdCat01Fixed?: string;
    }>;
    /** 各セグメント定義 */
    segments: Array<{ code: string; label: string; color?: string }>;
    /** 総額コード（差分で「その他」を算出、省略時は合計値を算出） */
    totalCode?: string;
    unit?: string;
    description?: string;
    /** デフォルトで表示するタブ（"composition" | "trend"、省略時は "composition"） */
    defaultTab?: "composition" | "trend";
  };
};

/** 有効な componentType の Union 型 */
export type DashboardComponentType = keyof DashboardConfigMap;

// ============================================================================
// 統一された各コンポーネントの Props 型
// ============================================================================

/** 全チャート/カードが受け取る統一 Props */
export interface DashboardItemProps<T extends DashboardComponentType> {
  common: DashboardCommonProps;
  config: DashboardConfigMap[T];
}

// ============================================================================
// スライドプレゼンテーション用の型
// ============================================================================

/** スライド1枚分のデータ */
export interface SlideData {
  id: number;
  /** スライドカテゴリラベル（英字大文字） */
  category: string;
  title: string;
  subtitle: string;
  /** スライド本文（JSX） */
  content: React.ReactNode;
  /** アクセントカラー（Tailwind bg-* クラス） */
  accent: string;
}

// ============================================================================
// Visualization 用データ型（アダプター出力）
// ============================================================================

export * from "./visualization";
