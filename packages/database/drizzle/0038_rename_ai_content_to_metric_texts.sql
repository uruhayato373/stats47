PRAGMA foreign_keys = OFF;

-- SQLite は index rename 非対応 → DROP/CREATE で名前を更新
DROP INDEX IF EXISTS idx_ai_content_is_active;
DROP INDEX IF EXISTS idx_ai_content_is_proofread;

ALTER TABLE ai_content RENAME TO metric_texts;

CREATE INDEX idx_metric_texts_is_active    ON metric_texts(is_active);
CREATE INDEX idx_metric_texts_is_proofread ON metric_texts(is_proofread);

PRAGMA foreign_keys = ON;
