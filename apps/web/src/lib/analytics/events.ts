/**
 * GA4 カスタムイベントトラッキング
 */

function sendEvent(name: string, params: Record<string, unknown>): void {
  if (typeof window === "undefined" || !window.gtag) return;
  window.gtag("event", name, params);
}

// ─── ファイルダウンロード ───────────────────────────────────

/**
 * CSV ダウンロードイベントを GA4 に送信する。
 */
export function trackCsvDownload(params: {
  rankingKey: string;
  yearCode: string;
}): void {
  sendEvent("file_download", {
    file_name: `${params.rankingKey}-${params.yearCode}.csv`,
    file_extension: "csv",
    ranking_key: params.rankingKey,
    year_code: params.yearCode,
  });
}

// ─── アフィリエイト ─────────────────────────────────────────

/**
 * アフィリエイトリンクのクリックイベントを GA4 に送信する。
 */
export function trackAffiliateClick(params: {
  category: string;
  label: string;
  position: string;
}): void {
  sendEvent("affiliate_click", {
    event_category: "affiliate",
    event_label: params.label,
    affiliate_category: params.category,
    link_position: params.position,
  });
}

// ─── ランキングページ ───────────────────────────────────────

/**
 * ランキングページ閲覧イベント。
 * どのランキングが人気か把握するためのカスタムディメンション付きイベント。
 */
export function trackRankingView(params: {
  rankingKey: string;
  title: string;
  categoryKey?: string;
  areaType?: string;
  yearCode?: string;
}): void {
  sendEvent("ranking_view", {
    ranking_key: params.rankingKey,
    ranking_title: params.title,
    category_key: params.categoryKey,
    area_type: params.areaType,
    year_code: params.yearCode,
  });
}

/**
 * 年度切替イベント。
 */
export function trackYearChange(params: {
  rankingKey: string;
  fromYear: string;
  toYear: string;
}): void {
  sendEvent("year_change", {
    ranking_key: params.rankingKey,
    from_year: params.fromYear,
    to_year: params.toYear,
  });
}

/**
 * エリアタイプ切替イベント（都道府県 ↔ 市区町村）。
 */
export function trackAreaTypeChange(params: {
  rankingKey: string;
  areaType: string;
}): void {
  sendEvent("area_type_change", {
    ranking_key: params.rankingKey,
    area_type: params.areaType,
  });
}

// ─── 検索 ───────────────────────────────────────────────────

/**
 * サイト内検索イベント（GA4 推奨イベント名 `search`）。
 */
export function trackSearch(params: {
  searchTerm: string;
  resultsCount?: number;
}): void {
  sendEvent("search", {
    search_term: params.searchTerm,
    results_count: params.resultsCount,
  });
}

// ─── シェア ──────────────────────────────────────────────────

/**
 * シェアボタンクリックイベント（GA4 推奨イベント名 `share`）。
 */
export function trackShare(params: {
  method: string;
  contentType?: string;
  itemId?: string;
}): void {
  sendEvent("share", {
    method: params.method,
    content_type: params.contentType,
    item_id: params.itemId,
  });
}

// ─── エラー ──────────────────────────────────────────────────

/**
 * 404 エラーイベント。壊れたリンクの検出に使用。
 */
export function trackNotFound(): void {
  if (typeof window === "undefined") return;
  sendEvent("page_not_found", {
    page_path: window.location.pathname,
    page_referrer: document.referrer,
  });
}
