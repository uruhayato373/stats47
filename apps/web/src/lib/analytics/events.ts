/**
 * GA4 カスタムイベントトラッキング
 */

/**
 * CSV ダウンロードイベントを GA4 に送信する。
 */
export function trackCsvDownload(params: {
  /** ランキングキー */
  rankingKey: string;
  /** 年度コード */
  yearCode: string;
}): void {
  if (typeof window === "undefined" || !window.gtag) return;

  window.gtag("event", "file_download", {
    file_name: `${params.rankingKey}-${params.yearCode}.csv`,
    file_extension: "csv",
    ranking_key: params.rankingKey,
    year_code: params.yearCode,
  });
}

/**
 * アフィリエイトリンクのクリックイベントを GA4 に送信する。
 * gtag が未ロードの場合は何もしない。
 */
export function trackAffiliateClick(params: {
  /** AffiliateCategory ("labor", "housing" 等) */
  category: string;
  /** リンクタイトル */
  label: string;
  /** 配置位置 ("article-bottom" | "sidebar" | "related-books") */
  position: string;
}): void {
  if (typeof window === "undefined" || !window.gtag) return;

  window.gtag("event", "affiliate_click", {
    event_category: "affiliate",
    event_label: params.label,
    affiliate_category: params.category,
    link_position: params.position,
  });
}
