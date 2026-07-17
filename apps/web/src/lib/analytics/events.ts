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
 * experimentId / variantId / creativeSize は A/B テスト (AFF-05) 用の任意属性。
 *
 * `affiliate_vertical` は広告意図軸 (10 vertical) の canonical dimension。
 * `affiliate_category` は後方互換のため残す (旧 8 軸時代からの時系列連続性)。
 * 値は原則同一 (category prop に vertical 値が流れる) だが、GA4 では別 dimension として登録する。
 */
export function trackAffiliateClick(params: {
  category: string;
  label: string;
  position: string;
  /** 広告意図軸 (10 vertical)。未指定なら category を流用 (後方互換) */
  vertical?: string;
  experimentId?: string;
  variantId?: string;
  creativeSize?: string;
}): void {
  sendEvent("affiliate_click", {
    event_category: "affiliate",
    event_label: params.label,
    affiliate_category: params.category,
    affiliate_vertical: params.vertical ?? params.category,
    link_position: params.position,
    // 任意属性は値があるときだけ送る (未設定実験は従来どおりの payload)
    ...(params.experimentId ? { experiment_id: params.experimentId } : {}),
    ...(params.variantId ? { variant_id: params.variantId } : {}),
    ...(params.creativeSize ? { creative_size: params.creativeSize } : {}),
  });
}

// ─── CTA (ファネル導線) ─────────────────────────────────────

/**
 * サイト内 CTA (ファネル導線) のクリックイベント。
 * 例: 統計ランキング → 公務員AI 買い切りガイド。
 *
 * アフィリエイトではない自社導線なので `affiliate_click` とは別イベントに分ける。
 * `cta_id` / `link_position` を custom dimension に登録すれば枠別 CTR を追える。
 *
 * buzz-map 集客ゲート (§7.3): `contentId` (=ideaId) / `targetType` / `targetKey` を追加すると
 * SNS campaign → landing → CTA を content_id 別に紐付けられる (custom dimension 登録が前提)。
 * いずれも optional で既存呼び出しの挙動は不変。
 */
export function trackCtaClick(params: {
  ctaId: string;
  label: string;
  position: string;
  rankingKey?: string;
  /** buzz-map ideaId 等・SNS campaign と landing CTA を紐付ける (§7.3 content_id) */
  contentId?: string;
  /** 遷移先種別 ranking | theme | area | blog (§7.3 target_type) */
  targetType?: "ranking" | "theme" | "area" | "blog";
  /** 遷移先の key / slug (§7.3 target_key) */
  targetKey?: string;
}): void {
  sendEvent("cta_click", {
    event_category: "cta",
    event_label: params.label,
    cta_id: params.ctaId,
    link_position: params.position,
    ...(params.rankingKey ? { ranking_key: params.rankingKey } : {}),
    ...(params.contentId ? { content_id: params.contentId } : {}),
    ...(params.targetType ? { target_type: params.targetType } : {}),
    ...(params.targetKey ? { target_key: params.targetKey } : {}),
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
