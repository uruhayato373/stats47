-- sns_posts に「データ→テンプレ→出力」の生成メタデータ列を追加
--
-- 背景: 2026-03 シャドウバンの根本原因は同タイトル/同サムネ再アップロード。さらに防ぐには
--       「どのデータ」「どのテンプレ」で作ったかの組み合わせも追跡する必要がある
--       (同 metric + 同 template = 視覚的に同一動画と判定されるリスク)
--
-- 追加列:
--   template     — Remotion composition ID (例: "RankingYouTube-ScrollGes", "BarChartRace-YouTubeShort")
--   metric_keys  — 利用した metric_key を JSON 配列で保存 (例: ["average-life-expectancy"]、
--                  または compare 系で ["population", "area"] のような複数 metric の組み合わせ)

ALTER TABLE sns_posts ADD COLUMN template text;
ALTER TABLE sns_posts ADD COLUMN metric_keys text;

CREATE INDEX idx_sns_posts_template ON sns_posts (template);
