-- sns_posts に YouTube duplicate-content 再発防止用の追跡列を追加
--
-- 背景: 2026-03 の同タイトル/同サムネ再アップロードが 2026-04-24 シャドウバンの引き金
--       (詳細: docs/10_SNS戦略/06_YouTube運用Playbook.md §重複コンテンツ防止ルール)
--
-- 追加列:
--   thumbnail_path — アップロードに使ったサムネ画像のローカルパス（basename で重複検出）
--   deleted_at     — YouTube 側で削除された場合のタイムスタンプ（履歴は残す）

ALTER TABLE sns_posts ADD COLUMN thumbnail_path text;
ALTER TABLE sns_posts ADD COLUMN deleted_at text;

CREATE INDEX idx_sns_posts_deleted_at ON sns_posts (deleted_at);
