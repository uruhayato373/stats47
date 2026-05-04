-- 形骸化 schema 一括整理 (2026-05-04)
--
-- DB に残存していたが schema 定義もコード参照も無かった subcategories (86 行) を DROP。
-- 同 PR で 3 つの dead schema ファイル (note_content / sns_metrics / performance_metrics) も削除しているが、
-- それらは DB に対応 table が無いため SQL 操作は不要。

PRAGMA foreign_keys = OFF;
DROP TABLE IF EXISTS subcategories;
PRAGMA foreign_keys = ON;
