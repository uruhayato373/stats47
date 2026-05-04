-- 形骸化 cache 列 latest_year + available_years_json を撤去 (2026-05-04)
--
-- 真の cache ではなく、yearName format ("年度"/"年"/無印) が script ごとに恣意的に
-- 設定されていた leakage。observations から `substr(year_code, 1, 4) || '年度'` で
-- 統一 format で動的計算できるため列削除。
--
-- 検証: 2,250 行のうち
--   - 97% (2,186) は cached yearCode = derived MAX(year_code)
--   - 2% (53) は observations 側が e-Stat 生コード (10-char) で substr で正規化
--   - 0.4% (8) は cache が stale (observations 優先)

ALTER TABLE indicators DROP COLUMN latest_year;
ALTER TABLE indicators DROP COLUMN available_years_json;
