import type { PageAuditResult, PageTemplateKey } from "../types";
import { analyzeHtml, fetchHtml, fetchRscBytes } from "./measure-static";
import {
  measureBrowserMetrics,
  type BrowserMeasurementSession,
} from "./measure-browser";

export interface AuditUrlOptions {
  /** true ならPlaywrightでLCP/CLS/INP/console error/横スクロール/タップ領域も計測する。 */
  withBrowser: boolean;
  /** 複数URL監査でChromium processを共有する。 */
  browserSession?: BrowserMeasurementSession;
  /** ローカル代表検査は1、定期計測は3を標準とする。 */
  browserRuns?: number;
  /** URL Policy 上、301/410 が正しい (notFoundやredirectを退行として扱わない)。 */
  expectedRedirectOrGone?: boolean;
  /**
   * false なら RSC payload を取得しない。RSC はキャッシュされず 1 件ごとにサーバー描画する
   * (実測 0.5〜3.7 秒/件) ので、全件監査では省いて代表URL検査だけで測る。
   */
  measureRsc?: boolean;
}

/** 1URLを計測してPageAuditResultを返す。fetch自体が失敗した場合はerrorを記録し他項目はunmeasuredにする。 */
export async function auditUrl(
  baseUrl: string,
  path: string,
  template: PageTemplateKey,
  options: AuditUrlOptions
): Promise<PageAuditResult> {
  const url = new URL(path, baseUrl).toString();
  const fetchedAt = new Date().toISOString();

  let httpStatus: number | null = null;
  let error: string | null = null;
  const metrics: PageAuditResult["metrics"] = {};
  let jsonldTypeCounts: Record<string, number> = {};
  let jsonldErrors: string[] = [];
  let imageUrls: string[] | undefined;
  let uiFindings: string[] = [];

  try {
    const { status, html, bytes } = await fetchHtml(url);
    httpStatus = status;
    metrics.html_bytes = bytes;

    if (status >= 200 && status < 300) {
      const analysis = analyzeHtml(html, url);
      metrics.dom_nodes = analysis.dom_nodes;
      metrics.total_links = analysis.total_links;
      metrics.unique_links = analysis.unique_links;
      metrics.duplicate_links = analysis.duplicate_links;
      metrics.duplicate_link_ratio = analysis.duplicate_link_ratio;
      metrics.jsonld_count = analysis.jsonld_count;
      metrics.jsonld_bytes = analysis.jsonld_bytes;
      metrics.jsonld_syntax_errors = analysis.jsonld_syntax_errors;
      metrics.ad_slots = analysis.ad_slots;
      metrics.ad_duplicate_count = analysis.ad_duplicate_count;
      metrics.empty_headings = analysis.empty_headings;
      metrics.duplicate_data_source_sections = analysis.duplicate_data_source_sections;
      metrics.external_links_same_tab = analysis.external_links_same_tab;
      imageUrls = analysis.image_urls;
      jsonldTypeCounts = analysis.jsonld_type_counts;
      jsonldErrors = analysis.jsonld_errors;
      metrics.rsc_bytes =
        options.measureRsc === false
          ? { value: null, reason: "全件監査では RSC を取得しない (代表URL検査で計測)" }
          : await fetchRscBytes(url);
    }
  } catch (e) {
    error = (e as Error).message;
  }

  if (options.withBrowser && httpStatus != null && httpStatus >= 200 && httpStatus < 300) {
    const browserMetrics = options.browserSession
      ? await options.browserSession.measure(url, { runs: options.browserRuns })
      : await measureBrowserMetrics(url, { runs: options.browserRuns });
    metrics.lcp_ms = browserMetrics.lcp_ms;
    metrics.cls = browserMetrics.cls;
    metrics.inp_ms = browserMetrics.inp_ms;
    metrics.ttfb_ms = browserMetrics.ttfb_ms;
    metrics.request_count = browserMetrics.request_count;
    metrics.transfer_bytes = browserMetrics.transfer_bytes;
    metrics.console_errors = browserMetrics.console_errors;
    metrics.page_errors = browserMetrics.page_errors;
    metrics.mobile_horizontal_scroll = browserMetrics.mobile_horizontal_scroll;
    metrics.small_tap_targets = browserMetrics.small_tap_targets;
    metrics.clipped_text = browserMetrics.clipped_text;
    metrics.overlapping_tap_targets = browserMetrics.overlapping_tap_targets;
    metrics.chart_text_issues = browserMetrics.chart_text_issues;
    metrics.a11y_violations = browserMetrics.a11y_violations;
    uiFindings = browserMetrics.ui_findings;
  }

  return {
    url,
    path,
    template,
    http_status: httpStatus,
    fetched_at: fetchedAt,
    expected_redirect_or_gone: options.expectedRedirectOrGone ?? false,
    error,
    metrics,
    jsonld_type_counts: jsonldTypeCounts,
    jsonld_errors: jsonldErrors,
    ...(uiFindings.length > 0 ? { ui_findings: uiFindings } : {}),
    ...(imageUrls ? { image_urls: imageUrls } : {}),
  };
}
