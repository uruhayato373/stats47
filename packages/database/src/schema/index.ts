// 3 層モデル
export * from "./sources";
export * from "./indicators";
export * from "./observations";

// 派生 (3 層から計算で生成、R2 snapshot で公開)
export * from "./ai_content";
export * from "./area_profiles";
export * from "./correlations";
export * from "./indicator_tags";

// マスタ
export * from "./categories";
export * from "./tags";
export * from "./surveys"; // 旧 ranking_items.ts を 2026-05-04 にリネーム
export * from "./ports"; // 旧 port_statistics.ts を 2026-05-04 にリネーム
export * from "./fishing_ports";

// コンテンツ
export * from "./articles";
export * from "./article_tags";
export * from "./page_components";

// e-Stat 統合カタログ (status='candidate'/'registered' で旧 estat_stats_tables を吸収)
export * from "./estat_metainfo";

// 運用
export * from "./affiliate_ads";
export * from "./sns_posts";

// ─── 廃止履歴 (2026-05-04 時点) ─────────────────────────────────
// - ranking_items / ranking_data / ranking_tags → indicators / observations / indicator_tags (PR-5)
// - port_statistics → observations(entity_type='port') (PR-6)
// - ranking_page_cards → page_components + page_component_assignments (PR-7)
// - estat_stats_tables → estat_metainfo (status 列で統合, PR #205)
// - ranking_page_views → GA4 pages.csv (PR #206)
// - subcategories (86 行、参照ゼロ) / note_content / sns_metrics / performance_metrics
//   (schema のみで DB に table 無し) を一括撤去 (本 commit)
