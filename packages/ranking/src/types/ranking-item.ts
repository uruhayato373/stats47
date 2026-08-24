/**
 * ランキング項目の型定義
 * 2026-01 設計見直しにより構造を階層化
 */
import type {
  EstatQueryParams,
  MetricRecipe,
  ProvenanceSurvey,
  SourceAttribution,
} from "@stats47/data-configs";
import type { AreaType } from "@stats47/types";
import type {
    ColorSchemeType,
    D3ColorScheme,
    DivergingMidpoint,
    MinValueType
} from "@stats47/visualization/d3";

/**
 * ランキング項目のタグ情報
 */
export interface RankingTag {
  tagKey: string;
}

// ============================================================================
// 設定オブジェクト型
// ============================================================================

/**
 * 数値表示設定
 * DBカラム: value_display_config (JSON)
 */
export interface ValueDisplayConfig {
  /**
   * 変換係数
   * 生データを表示用に変換するための乗数（例: 0.001 なら 1000 -> 1 に変換）
   */
  conversionFactor?: number;
  /**
   * 小数点以下桁数
   * 表示時の小数点以下の桁数指定
   */
  decimalPlaces?: number;
  /**
   * 表示用単位
   * 変換係数を適用した後に表示する単位（例: "千人"）
   */
  displayUnit?: string;
}

/**
 * 可視化設定
 * DBカラム: visualization_config (JSON)
 */
export interface VisualizationConfig {
  /**
   * 地図の色スキーム
   * D3.jsで使用するカラースケール名（例: "interpolateBlues"）
   */
  colorScheme: D3ColorScheme;
  /**
   * スキームタイプ
   * - sequential: 順序（単色グラデーション）
   * - diverging: 発散（二色グラデーション、正負など）
   * - categorical: カテゴリ（離散値）
   */
  colorSchemeType: ColorSchemeType;
  /**
   * 最小値の扱い (Sequential用)
   * - zero: 0を最小値（薄い色）とする
   * - data-min: データの最小値を最小値とする
   */
  minValueType?: MinValueType;
  /**
   * 分岐点設定 (Diverging用)
   * 中央値（白くなる部分）の基準
   */
  divergingMidpoint?: DivergingMidpoint;
  /**
   * カスタム分岐点値
   * divergingMidpointが'custom'の場合の値
   */
  divergingMidpointValue?: number;
  /**
   * 対称化フラグ
   * 発散スケールで正負の最大絶対値に合わせて対称にするか
   */
  isSymmetrized?: boolean;
  /**
   * 反転フラグ
   * カラースケールの色順を反転するか
   */
  isReversed?: boolean;
}

/**
 * 正規化表示オプション
 */
export interface NormalizationOption {
  /**
   * 正規化の種類
   * - per_population: 総人口あたり
   * - per_area:       総面積あたり
   */
  type: "per_population" | "per_area";

  /**
   * UI上の表示ラベル
   * 例: "人口10万人あたり", "面積1km²あたり"
   */
  label: string;

  /**
   * 変換後の単位
   * 例: "件/10万人", "件/km²"
   */
  unit: string;

  /**
   * スケール係数
   * 計算式: (元の値 / 分母の値) * scaleFactor
   * 例: 10万人あたりにしたい場合は 100000
   */
  scaleFactor?: number;

  /**
   * 表示時の小数点以下桁数
   */
  decimalPlaces?: number;

  /**
   * 分母となるランキングキーを明示的に指定する場合
   * 省略時は type に応じて Well-Known Key を自動選択する
   */
  denominatorKey?: string;
}

/**
 * 計算設定
 * DBカラム: calculation_config (JSON)
 */
export interface CalculationConfig {
  /**
   * 計算項目フラグ
   * trueの場合、DB上の値ではなく計算によって値を導出する
   */
  isCalculated: boolean;
  /**
   * 計算タイプ
   * - ratio: 比率（分子÷分母）。パーセンテージ計算など。
   * - per_capita: 人口あたり（分子÷人口）。
   */
  type?: "ratio" | "per_capita" | "subtraction";
  /** 分子となるランキングキー（ratio計算用） */
  numeratorKey?: string;
  /** 分母となるランキングキー（ratio計算用） */
  denominatorKey?: string;
  /** 計算式（custom計算用） */
  formula?: string;
  /**
   * 分子・分母の期間基準 (monthly / annual)。
   * 月額と年額を混ぜた引き算を防ぐ。正典は data-configs の `PeriodAlignment`。
   */
  periodAlign?: {
    numerator: "monthly" | "annual";
    denominator: "monthly" | "annual";
    result: "monthly" | "annual";
  };
  /** 計算結果に掛ける定数 (率を % にする 100 が主用途) */
  scaleFactor?: number;
  /** 表示時に選択可能な正規化オプション (オンデマンド計算用) */
  normalizationOptions?: NormalizationOption[];
}

/**
 * データソースの出典・系列メタ（表示用 provenance）。
 * DBカラム: source_config (JSON) / RankingItem.sourceConfig に格納。
 *
 * 注: 取り込み設定の `SourceConfig`（`@stats47/data-configs` の discriminated union
 * `{ kind: "estat" | ... }`）とは**別概念**。名前衝突を避けるため本型は SourceProvenance とする。
 */
export interface SourceProvenance {
  /**
   * 取得レシピ (config から機械生成)。**新形の主フィールド**。
   * 軸 pin・tab 選択・線形結合・軸合算・率・時間粒度・地域軸を過不足なく持つ。
   * 正典: `packages/data-configs/src/recipe.ts`
   */
  recipe?: MetricRecipe;
  /**
   * e-Stat API へ **そのまま spread してよい** クエリ部。
   * ★オンデマンド取得は `sourceConfig` 全体ではなくこれだけを spread する
   * (`resolveEstatParams` 経由)。全体を spread すると非クエリキーが混ざる。
   */
  estatParams?: EstatQueryParams;
  /**
   * 単発クエリで再現できない値か (線形結合・軸合算・率・県庁所在市写像)。
   * true のとき e-Stat を叩かず正典 `app/stats/<key>/values.json` を読む。
   */
  derived?: boolean;

  /** e-Stat 固有: データベース・系列名 (例: "社会・人口統計体系") */
  collection?: {
    name: string;
    url?: string;
  };

  /** データの元となった統計調査 */
  survey?: {
    name: string;
    url?: string;
  };

  /** e-Stat 統計表ID (互換性・API用) */
  statsDataId?: string;
  /** e-Stat 項目コード (互換性・API用) */
  itemCode?: string;
  /** e-Stat カテゴリコード (cat01) (互換性・API用) */
  cdCat01?: string;
  /** e-Stat カテゴリコード (cat02) (互換性・API用) */
  cdCat02?: string;
  /** e-Stat カテゴリコード (cat03) (互換性・API用) */
  cdCat03?: string;
  /** e-Stat 表章項目コード (tab) (互換性・API用) */
  cdTab?: string;
  
  /** その他のパラメータ (任意) */
  [key: string]: unknown;
}

// ============================================================================
// メイン型定義
// ============================================================================

/**
 * ランキング項目
 * DBテーブル: ranking_items
 */
export interface RankingItem {
  /** ランキングキー（一意の識別子） */
  rankingKey: string;
  /**
   * 地域タイプ（都道府県、市区町村など）
   * metrics テーブルから area_type が削除されたため、常に "prefecture" がデフォルトとなる。
   * 実際の観測粒度は stats.area_type が保持する。
   */
  areaType: AreaType;

  // === 主要フィールド ===
  /** 正式名称（詳細ページ等で使用） */
  rankingName: string;
  /** 表示タイトル（リストや見出しで使用） */
  title: string;
  /**
   * 読者向けの平易な指標名。正準名 title から決定規則で導出して焼き込む。
   * 旧 snapshot との後方互換のため optional。
   */
  readerLabel?: string;
  /** サブタイトル（補足的なタイトル） */
  subtitle?: string;
  /** 対象属性（例: "15歳以上"） */
  demographicAttr?: string;
  /** 正規化の基準（例: "人口10万人あたり"） */
  normalizationBasis?: string;
  /** 基本単位（DBに保存されている値の単位） */
  unit: string;

  /** カテゴリキー */
  categoryKey?: string;
  /** 追加カテゴリキー（複数カテゴリ所属時に使用） */
  additionalCategories?: string[] | null;
  /** グループキー（同じ指標の別の見方をまとめるキー） */
  groupKey?: string;

  /** 注釈・説明文 */
  annotation?: string;
  /** 定義の詳細説明 (旧 definition) */
  description?: string;
  /** 最新年度情報 */
  latestYear?: { yearCode: string; yearName: string } | null;
  /** 利用可能年度リスト */
  availableYears?: { yearCode: string; yearName: string }[] | null;
  /** 有効フラグ */
  isActive: boolean;

  // === 設定オブジェクト ===
  /** 数値表示設定 */
  valueDisplay?: ValueDisplayConfig | null;
  /** 地図・グラフの可視化設定 */
  visualization?: VisualizationConfig | null;
  /** 動的計算ロジック設定 */
  calculation?: CalculationConfig | null;

  // === 外部参照 ===
  /**
   * 調査ID（surveys マスタへの主参照）。`config.surveyId ?? surveyIds[0] ?? null`。
   * 後方互換の単数形。複数調査 (SSDS) は surveyIds を見る。
   */
  surveyId?: string | null;
  /**
   * この統計が属する調査 id 群 (builder が config.source から決定的導出して焼き込む)。
   * surveys.json に実在する id のみ (合成 id `ssds-src:`/`src:` は除外)。
   * SSDS (二次統計) は複数原典を持ちうる。空配列 = 未分類 (UI は調査カード非表示)。
   * 正典: .claude/rules/survey-linkage-standards.md
   */
  surveyIds?: string[];
  /** surveyIds に対応する表示用 {id,name} (SurveyCard が追加 fetch なしで名前を出せる) */
  originalSurveys?: ProvenanceSurvey[];
  /** データソースID */
  dataSourceId: string;
  /** データ取得設定 (e-Statパラメータ等) */
  sourceConfig?: SourceProvenance | null;
  /** 出典情報（名前とURL） */
  source?: { name: string; url: string };
  /**
   * 出典表記 (2 階層プロビナンス、exporter が焼き込む統一型)。
   * SSDS は compilation=社会・人口統計体系 + originalSurveys=原典調査群。非SSDS は compilation=null。
   */
  attribution?: SourceAttribution | null;

  // === SEO ===
  /** SEO 用タイトル（meta title のオーバーライド、未設定時は title を使用） */
  seoTitle?: string | null;
  /** SEO 用説明文（meta description のオーバーライド、未設定時は自動生成） */
  seoDescription?: string | null;

  // === 掲載情報 ===
  /**
   * 問いかけコピー。`「年間日照時間が最も長い県は？」` の 1 行。
   *
   * 導出規則 (`@stats47/data-configs/prominence` の `resolveRankingHook`) と
   * 例外の override で確定し、ビルド時に焼き込む。SNS・OGP・索引が同じコピーを使えるようにする。
   *
   * 旧 `isFeatured` / `featuredOrder` はここにあったが、2026-07-29 に廃止した
   * (2,295 件中 8 件しか設定されず、しかもその 8 件は HOME_FEATURED_RANKINGS と完全重複で、
   * カテゴリページの「注目」がホームの注目をそのまま映していた)。
   * 掲載順は prominence スコアが決める。
   */
  hook: string;

  /**
   * 関連タグ（オプショナル）
   * このランキング項目に関連付けられたタグ（カテゴリ、トピックなど）
   */
  tags?: RankingTag[] | null;

  /**
   * 最新年の「1 位」表示 (都道府県名 + rank + ロケール整形済み値)。
   * generate-ranking-itemsがvalues.jsonの最新年からderiveFeaturedTopで焼き込む。
   * 関連ランキングレール等の mini 表示用。値が取れない (calculated/外部) 場合は null。
   * 旧 item.json 後方互換のため optional (欠損時は UI が text-first に縮退)。
   */
  latestTop?: FeaturedValue | null;

  /** 作成日時 */
  createdAt: string;
  /** 更新日時 */
  updatedAt: string;
}

/**
 * home/featured.json 用に、ビルド時 (exporter) で「1 位」表示とミニタイルマップ SVG を
 * 焼き込んだ RankingItem。トップページ (`<FeaturedRankings>`) はこれを読むだけでよく、
 * ランタイムで各カードごとにvalues.jsonをフェッチして地理地図SVGを生成する必要がない
 * (force-dynamic のままフェッチ ~11 回 + SVG 生成 8 枚を 1 フェッチに削減 = TTFB 改善)。
 * Derived (計算で作れる派生値) を R2 snapshot に焼く完全DBレス方針に沿う。
 * 焼き込み前の旧 featured.json との後方互換のため両フィールドとも optional
 * (未焼き込み item はコンポーネント側がランタイム生成にフォールバックする)。
 */
/**
 * home/featured.json に焼き込む派生値 1 件。
 * rank は snapshot の実 rank (同順位があっても「47位」等を固定表示しない)。
 * 旧 snapshot の featuredTop には rank が無いため optional。
 */
export interface FeaturedValue {
  rank?: number;
  areaName: string;
  value: string | null;
}

export interface FeaturedRankingItem extends RankingItem {
  /** ビルド時に焼き込む「1 位」表示 (都道府県名 + ロケール整形済み値文字列)。null = 値なし */
  featuredTop?: FeaturedValue | null;
  /** ビルド時に焼き込む都道府県地図 SVG 文字列 */
  tileMapSvg?: string | null;
  /** ホーム専用編集設定 (git TS HOME_FEATURED_RANKINGS 由来) */
  homeFeatured?: {
    order: number;
    hook: string;
  };
}

/**
 * カテゴリ/調査ページ等の一覧表示用に絞った ranking item の軽量ビュー。
 * (旧 find-ranking-items-by-category.ts から完全DBレス Phase F で types へ relocate)
 */
export interface CategoryRankingItem {
  rankingKey: string;
  title: string;
  /** 読者向けの平易な指標名。旧 snapshot は欠損しうる。 */
  readerLabel?: string | null;
  subtitle: string | null;
  unit: string;
  latestYear: unknown;
  availableYears: unknown;
  description: string | null;
  demographicAttr: string | null;
  normalizationBasis: string | null;
  groupKey: string | null;
  /**
   * 問いかけコピー (RankingItem.hook からの転記)。
   * 旧 items.json 後方互換のため optional (欠損時は UI が title で縮退)。
   */
  hook?: string | null;
  /**
   * 最新年の「1 位」表示 (RankingItem.latestTop からの転記)。関連ランキングレールの
   * mini 表示用。旧 items.json 後方互換のため optional (欠損時は UI が text-first に縮退)。
   */
  top1?: FeaturedValue | null;
  /**
   * e-Stat 17 軸の categoryKey。survey ページが「調査の主題 → 広告の意図軸 (vertical)」を
   * 導出するのに使う。旧 items.json 後方互換のため optional (欠損時は economy へ縮退)。
   */
  categoryKey?: string | null;
  /**
   * カテゴリ内グループ分類 (topic) のキー。category ページが一覧をまとまりで束ねるのに使う。
   *
   * **category 文脈に依存する**値なので item.json 側には持たせない (同じ metric が
   * additionalCategories 経由で複数カテゴリに出るため)。カタログ未登録カテゴリでは
   * 焼かれない。旧 items.json 後方互換のため optional (欠損時は UI が平坦一覧へ縮退)。
   *
   * SSOT: `packages/data-configs/src/topics/`
   */
  topicKey?: string | null;
}

/**
 * 地域タイプ別のランキング項目カウント
 * @see getRankingItemStatsForAllAreaTypes
 */
export interface RankingItemCounts {
  /** 地域タイプ */
  areaType: string;
  /** 全件数 */
  total: number;
  /** 有効な項目数 */
  active: number;
  /** 無効な項目数 */
  inactive: number;
}


/**
 * 表示用ランキング項目（画像生成等で使用）
 */
export type RankingItemForDisplay = Pick<
  RankingItem,
  "title" | "subtitle" | "unit" | "visualization" | "demographicAttr" | "normalizationBasis"
>;
