-- 旧 tag junction を撤去 (2026-05-04, PR-9)
--
-- 0027 で taggings に統合済 (article=474, indicator=3,638)。
-- ranking package + apps/web の reader/writer は taggings 切替済 (Commit 3-4)。

PRAGMA foreign_keys = OFF;
DROP TABLE IF EXISTS article_tags;
DROP TABLE IF EXISTS indicator_tags;
PRAGMA foreign_keys = ON;
