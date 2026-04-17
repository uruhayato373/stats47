-- T2-RANK-EDIT-01: ranking エディトリアル拡張
--
-- 2026-04-18 T2 戦略（コンテンツ品質）の実装基盤。
-- AI 生成コンテンツを人間校正して「監修済み」と区別できるようにする。
-- 目的: Google E-E-A-T 評価向上 + 重複 user canonical 無し 517 件の解消（類似ページを独自コンテンツで差別化）。

ALTER TABLE ranking_ai_content ADD COLUMN is_proofread INTEGER DEFAULT 0;
ALTER TABLE ranking_ai_content ADD COLUMN proofread_at TEXT;
ALTER TABLE ranking_ai_content ADD COLUMN editorial_source TEXT DEFAULT 'ai-generated';
ALTER TABLE ranking_ai_content ADD COLUMN reviewed_by TEXT;

CREATE INDEX idx_ranking_ai_content_is_proofread ON ranking_ai_content (is_proofread);
