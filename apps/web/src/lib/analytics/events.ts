/**
 * GA4 カスタムイベントトラッキング
 */

function sendEvent(name: string, params: Record<string, unknown>): void {
  if (typeof window === 'undefined' || !window.gtag) return;
  window.gtag('event', name, params);
}

// ─── ファイルダウンロード ───────────────────────────────────

/**
 * CSV ダウンロードイベントを GA4 に送信する。
 */
export function trackCsvDownload(params: {
  rankingKey: string;
  yearCode: string;
}): void {
  sendEvent('file_download', {
    file_name: `${params.rankingKey}-${params.yearCode}.csv`,
    file_extension: 'csv',
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
  /** 広告 1 件単位の識別子 (AffiliateAd.id)。案件別 CTR 計測用 (GA4 custom dimension ad_id) */
  adId?: string;
  experimentId?: string;
  variantId?: string;
  creativeSize?: string;
}): void {
  sendEvent('affiliate_click', {
    event_category: 'affiliate',
    event_label: params.label,
    affiliate_category: params.category,
    affiliate_vertical: params.vertical ?? params.category,
    link_position: params.position,
    // 任意属性は値があるときだけ送る (未設定実験は従来どおりの payload)
    ...(params.adId ? { ad_id: params.adId } : {}),
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
  targetType?: 'ranking' | 'theme' | 'area' | 'blog';
  /** 遷移先の key / slug (§7.3 target_key) */
  targetKey?: string;
}): void {
  sendEvent('cta_click', {
    event_category: 'cta',
    event_label: params.label,
    cta_id: params.ctaId,
    link_position: params.position,
    ...(params.rankingKey ? { ranking_key: params.rankingKey } : {}),
    ...(params.contentId ? { content_id: params.contentId } : {}),
    ...(params.targetType ? { target_type: params.targetType } : {}),
    ...(params.targetKey ? { target_key: params.targetKey } : {}),
  });
}

// ─── ホーム注目ランキング ──────────────────────────────────────

/**
 * ホーム「注目のランキング」カードの共通 payload。
 * `link_position=home_featured` は両イベント固定 (GSC/GA4 で他導線と区別する)。
 * 現行実装は `card_variant=geographic` / `experiment_variant=editorial` 固定。
 * `slot` は 1 始まりの表示位置。custom dimension の登録状況は
 * `.claude/rules/analytics-event-standards.md` を正典とする。
 */
export interface HomeFeaturedEventParams {
  rankingKey: string;
  cardVariant: string;
  slot: number;
  experimentId: string;
  experimentVariant: string;
}

function homeFeaturedPayload(
  params: HomeFeaturedEventParams
): Record<string, unknown> {
  return {
    ranking_key: params.rankingKey,
    card_variant: params.cardVariant,
    slot: params.slot,
    experiment_id: params.experimentId,
    experiment_variant: params.experimentVariant,
    link_position: 'home_featured',
  };
}

/**
 * ホーム注目ランキングカードの impression (50% 以上 × 1 秒 × card mount につき 1 回)。
 * 発火条件の機械実装は features/ranking の impression watcher が担う。
 */
export function trackHomeFeaturedImpression(
  params: HomeFeaturedEventParams
): void {
  sendEvent('home_featured_impression', homeFeaturedPayload(params));
}

/**
 * ホーム注目ランキングカードのクリック (カード全体リンクへの遷移)。
 */
export function trackHomeFeaturedClick(params: HomeFeaturedEventParams): void {
  sendEvent('home_featured_click', homeFeaturedPayload(params));
}

// ─── ナビゲーション (ヘッダー IA・P0-1 効果判定) ──────────────

/**
 * ナビ項目クリック（グローバルヘッダー / モバイルドロワー / 都道府県一覧の選択導線）。
 * P0-1 (ヘッダーに「都道府県」追加) や `/areas` の検索・一覧・地図が使われているかを判定する。
 * `nav_label` (項目名) / `nav_href` (遷移先) / `nav_surface` を custom dimension に登録すれば
 * 項目別・導線別の利用度を追える。
 *
 * `nav_surface` の値:
 * - `desktop-header` / `mobile-drawer`: グローバルナビ
 * - `areas_search` / `areas_list` / `areas_map`: /areas の県選択導線（検索 / 一覧 / 地図）
 * - `home_category` / `home_use_case` / `home_area_map` / `home_area_list` / `home_blog`:
 *   home ポータルの発見セクション（カテゴリ / 知りたいこと / 都道府県 / ブログ）
 * - `category_area_map` / `category_area_list`: category ページの都道府県選択導線
 * - `category_blog`: category ページのカテゴリ関連記事
 * - `ranking_survey` / `category_survey` / `theme_survey` / `blog_survey`:
 *   各コンテンツ面から、そのデータを生成した調査ハブへの導線
 * - `survey_ranking` / `survey_theme` / `survey_blog` / `survey_category`:
 *   調査ハブから、その調査を使う各コンテンツ面への逆方向導線
 * - `theme_evidence`: 白書・統計の論点からランキング・関連テーマ・記事へ進む導線。
 *   `nav_label` は `<topic-key>:<target-type>:<target-key>`。
 * - `theme_kpi_switcher`: テーマページの指標カードのタイル（`MetricSwitcherPanel`）。
 *   `nav_label` に rankingKey が入るので、どの指標が見られているかを追える。
 *   ★2026-08-06 の複数チェック化以降、送るのは**チェック ON のときだけ**。
 *   OFF は「見るのをやめた」だけで関心の表明ではないため、送ると ON/OFF が
 *   相殺されて「どの指標が見られたか」が読めなくなる
 * - `category_sidebar`: category ページ左のカテゴリナビ（home と同じリストの別配置）
 *
 * いずれも既存 GA4 custom dimension `nav_surface` の値追加であり、新しい dimension は増やさない
 * (`.claude/rules/analytics-event-standards.md` §2)。
 */
export type NavSurface =
  | 'desktop-header'
  | 'mobile-drawer'
  | 'areas_search'
  | 'areas_list'
  | 'areas_map'
  | 'home_category'
  | 'home_use_case'
  | 'home_area_map'
  | 'home_area_list'
  | 'home_blog'
  | 'category_blog'
  | 'category_area_map'
  | 'category_area_list'
  | 'theme_kpi_switcher'
  | 'theme_evidence'
  | 'category_sidebar'
  | 'ranking_survey'
  | 'category_survey'
  | 'theme_survey'
  | 'blog_survey'
  | 'survey_ranking'
  | 'survey_theme'
  | 'survey_blog'
  | 'survey_category';

export function trackNavClick(params: {
  label: string;
  href: string;
  surface: NavSurface;
}): void {
  sendEvent('nav_click', {
    event_category: 'navigation',
    event_label: params.label,
    nav_label: params.label,
    nav_href: params.href,
    nav_surface: params.surface,
  });
}

// ─── 右レール (回遊・P0-2 効果判定) ───────────────────────────

/**
 * ランキング詳細などの右レール内リンククリック。
 * P0-2 (レール先頭を関連ランキングに繰り上げ) の回遊ベネフィットを判定するために計装する。
 * `rail_widget` でウィジェット種別 (related-rankings | related-articles | survey | promo) を、
 * `rail_slot` で先頭からの表示順 (1 始まり) を送り、「先頭=関連」がクリックを得ているか追う。
 */
export function trackRailClick(params: {
  widget: 'related-rankings' | 'related-articles' | 'survey' | 'promo';
  href: string;
  slot: number;
  rankingKey?: string;
}): void {
  sendEvent('rail_click', {
    event_category: 'rail',
    event_label: params.widget,
    rail_widget: params.widget,
    rail_href: params.href,
    rail_slot: params.slot,
    ...(params.rankingKey ? { ranking_key: params.rankingKey } : {}),
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
  sendEvent('ranking_view', {
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
  sendEvent('year_change', {
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
  sendEvent('area_type_change', {
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
  sendEvent('search', {
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
  sendEvent('share', {
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
  if (typeof window === 'undefined') return;
  sendEvent('page_not_found', {
    page_path: window.location.pathname,
    page_referrer: document.referrer,
  });
}
