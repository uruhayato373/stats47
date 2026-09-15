import type { PageAuditResult, PageTemplateKey } from "../types";
import { analyzeHtml, fetchHtml, fetchRscBytes } from "./measure-static";
import { measureBrowserMetrics } from "./measure-browser";

export interface AuditUrlOptions {
  /** true ならPlaywrightでLCP/CLS/INP/console error/横スクロール/タップ領域も計測する。 */
  withBrowser: boolean;
  /** URL Policy 上、301/410 が正しい (notFoundやredirectを退行として扱わない)。 */
  expectedRedirectOrGone?: boolean;
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
      jsonldTypeCounts = analysis.jsonld_type_counts;
      jsonldErrors = analysis.jsonld_errors;
      metrics.rsc_bytes = await fetchRscBytes(url);
    }
  } catch (e) {
    error = (e as Error).message;
  }

  if (options.withBrowser && httpStatus != null && httpStatus >= 200 && httpStatus < 300) {
    const browserMetrics = await measureBrowserMetrics(url);
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
  };
}
