// 3 層モデル
export * from "./sources";
export * from "./metrics"; // 旧 indicators (2026-05-04 リネーム)
export * from "./stats"; // 旧 observations (2026-05-05 リネーム)

// 派生 (3 層から計算で生成、R2 snapshot で公開)
export * from "./metric_texts"; // 旧 ai_content (2026-05-05 リネーム)
export * from "./area_profiles";
export * from "./correlations";

// マスタ
export * from "./prefectures";
export * from "./cities";
export * from "./categories";
export * from "./ports"; // 旧 port_statistics.ts を 2026-05-04 にリネーム
export * from "./fishing_ports";

// コンテンツ
export * from "./articles";
export * from "./page_components";

// e-Stat 統合カタログ (status='candidate'/'registered' で旧 estat_stats_tables を吸収)
export * from "./estat_metainfo";

// 運用
export * from "./affiliate_ads";
export * from "./sns_posts";

// ─── 廃止履歴 (2026-05-04 時点) ─────────────────────────────────
// - ranking_items / ranking_data / ranking_tags → metrics / stats / taggings (PR-5)
// - port_statistics → stats(entity_type='port') (PR-6)
// - ranking_page_cards → page_components + page_component_assignments (PR-7)
// - estat_stats_tables → estat_metainfo (status 列で統合, PR #205)
// - ranking_page_views → GA4 pages.csv (PR #206)
// - subcategories (86 行、参照ゼロ) / note_content / sns_metrics / performance_metrics
//   (schema のみで DB に table 無し) を一括撤去 (PR #207)
// - article_tags + indicator_tags → taggings (polymorphic M:N, PR #209)
// - indicators テーブル → metrics リネーム (FK: indicator_id → metric_id, PR #210)
//   旧 indicators.latest_year + available_years_json も削除 (stats から動的計算)
// - surveys → sources(source_kind='survey') に統合 (PR #212, 41件完全一致)
//   metrics.survey_id FK 先を sources に変更
// - metrics.id (INTEGER autoincrement) 削除、key を PRIMARY KEY に昇格 (PR #211)
//   correlations: metric_x_id/y_id → metric_key_x/y (TEXT FK)
//   ai_content: metric_id → metric_key (TEXT PK)
//   area_profiles: metric_id → metric_key (TEXT FK)
//   taggings: taggable_id の metric 行は CAST(id AS TEXT) → key 直参照
// - ai_content → metric_texts リネーム (PR #213, 2026-05-05)
// - tags テーブル廃止、taggings.tag_key を日本語に統一 (PR #214, 2026-05-05)
//   旧英語スラグ URL は middleware で 301 リダイレクト
// - taggings → articles.tags / metrics.tags (JSON列に直接格納, PR #215, 2026-05-05)
