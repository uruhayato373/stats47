-- PR-5 Commit 7: 旧 ranking 系 + 派生テーブルを DROP
--
-- データ移行は migrate-derived-tables-to-3layer.ts で 3 層スキーマに移管済み:
--   - ranking_items   → indicators        (3,050 → 3,064 行)
--   - ranking_data    → observations      (3,324,013 → 3,365,746 行 ※ port_statistics 含む)
--   - ranking_tags    → indicator_tags    (3,638 → 3,638 行)
--   - area_profile_rankings  → area_profiles    (17,678 → 17,678 行)
--   - correlation_analysis   → correlations     (1,674,544 → 1,674,544 行)
--   - ranking_ai_content     → ai_content       (1,943 → 1,941 行 ※ 重複削除)
--
-- ローカル D1 では既に 2026-05-04 に DROP 済み。本マイグレーションは fresh setup 時に適用される。

PRAGMA foreign_keys = OFF;

DROP TABLE IF EXISTS ranking_data;
DROP TABLE IF EXISTS ranking_tags;
DROP TABLE IF EXISTS ranking_ai_content;
DROP TABLE IF EXISTS area_profile_rankings;
DROP TABLE IF EXISTS correlation_analysis;
DROP TABLE IF EXISTS ranking_items;

PRAGMA foreign_keys = ON;
