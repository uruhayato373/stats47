/**
 * page-quality 監査の共通型。
 * .claude/scripts/page-quality/ 配下のすべてのスクリプトがこれを読む (重複定義しない)。
 */

/** ページテンプレート種別。url-policy.ts の名前空間とは独立した監査専用の分類。 */
export type PageTemplateKey =
  | "home"
  | "prefecture-list"
  | "prefecture-detail"
  | "municipality"
  | "ranking"
  | "category"
  | "theme"
  | "geo-analysis"
  | "blog"
  | "blog-article"
  | "survey"
  | "other";

export interface PageTemplate {
  key: PageTemplateKey;
  label: string;
  /** 変更時軽量検査の代表URL (サイトルート相対)。 */
  representativeUrl: string;
  /** このテンプレートに影響するファイルパスの glob (git diff との照合用)。 */
  changedPathGlobs: string[];
}

/** 全テンプレートへ波及する共通ファイルの glob (layout / 広告 / データ取得層等)。 */
export interface SharedPathRule {
  label: string;
  changedPathGlobs: string[];
}

export type MetricKey =
  | "http_status"
  | "html_bytes"
  | "rsc_bytes"
  | "dom_nodes"
  | "total_links"
  | "unique_links"
  | "duplicate_links"
  | "duplicate_link_ratio"
  | "jsonld_count"
  | "jsonld_bytes"
  | "jsonld_syntax_errors"
  | "ad_slots"
  | "ad_duplicate_count"
  | "request_count"
  | "transfer_bytes"
  | "ttfb_ms"
  | "lcp_ms"
  | "cls"
  | "inp_ms"
  | "console_errors"
  | "page_errors"
  | "mobile_horizontal_scroll"
  | "small_tap_targets"
  | "broken_images"
  | "degraded_images"
  | "empty_headings"
  | "duplicate_data_source_sections"
  | "external_links_same_tab"
  | "clipped_text"
  | "overlapping_tap_targets"
  | "a11y_violations"
  | "responsive_layout_issues";

export type Comparison = "absolute" | "delta_pct";
export type Operator = "<=" | ">=" | "<" | ">";
export type Severity = "error" | "warning";

export interface Budget {
  page_type: PageTemplateKey | "all";
  metric_key: MetricKey;
  comparison: Comparison;
  threshold: number;
  operator: Operator;
  severity: Severity;
  note?: string;
}

export interface BudgetsFile {
  version: number;
  description: string;
  budgets: Budget[];
}

/** 取得不能な指標。null + 理由を必ず添える (推測値で埋めない)。 */
export interface Unmeasured {
  value: null;
  reason: string;
}

export type MetricValue = number | boolean | Unmeasured;

export interface PageAuditResult {
  url: string;
  path: string;
  template: PageTemplateKey;
  http_status: number | null;
  fetched_at: string;
  /** 301/410等、URL policy上の意図的な遷移。violationsの評価から除外する。 */
  expected_redirect_or_gone: boolean;
  error: string | null;
  metrics: Partial<Record<MetricKey, MetricValue>>;
  /** JSON-LD の @type 別出現数 (PropertyValue 等)。 */
  jsonld_type_counts: Record<string, number>;
  jsonld_errors: string[];
  /** UI 検査の指摘 (壊れた画像 URL・切れた要素・axe の規則 ID 等)。違反の場所を特定するため。 */
  ui_findings?: string[];
  /** 画像切れ検査の入力。検査後に削除し、スナップショットには残さない。 */
  image_urls?: string[];
  /** 代表URLのスクショ (スマホ・PC)。週次の --browser-representative のときだけ入る。 */
  screenshots?: ScreenshotRecord[];
}

export interface ScreenshotRecord {
  /** 撮影した幅の id (`mobile-390` / `sm-640` / `tablet-768` / `rail-992` / `laptop-1024` / `desktop-1440` / `wide-1920`)。 */
  device: string;
  /** R2 の key。agent が確認する幅は `<date>/<template>-<幅>.webp`、それ以外は `latest/<template>-<幅>.png`。 */
  key: string;
  /** CI の同一ジョブ内で agent が読むためのローカルパス。 */
  localPath: string;
  width: number;
  height: number;
  /** 先週の同じ画面との差 (0〜1)。先週の画像が無ければ null。 */
  changeRatio: number | null;
  previousHeight: number | null;
  /** agent が読む画面 1 枚分ずつの切り出し (縦長の全体像は縮小されて文字が読めないため)。R2 には上げない。 */
  tilePaths: string[];
  /** この幅で横スクロールが出たか。 */
  horizontalScroll?: boolean;
  /** この幅で文字が枠外に切れていた要素・重なったタップ要素 (ui-probe と同じ判定)。 */
  clipped?: string[];
  overlaps?: string[];
}

export interface Violation {
  url: string;
  template: PageTemplateKey;
  metric_key: MetricKey;
  comparison: Comparison;
  operator: Operator;
  threshold: number;
  actual: number;
  previous: number | null;
  severity: Severity;
}

export interface AuditRun {
  schemaVersion: 1;
  mode: "representative" | "full";
  generated_at: string;
  commit_sha: string | null;
  environment: string;
  results: PageAuditResult[];
  violations: Violation[];
}
