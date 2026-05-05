-- surveys テーブルを廃止。全データは sources(source_kind='survey') に存在するため移行不要。
-- metrics.survey_id FK 先は Drizzle スキーマ側で sources に変更済み（SQLite はランタイム FK 無効時は DROP のみ）。

DROP TABLE IF EXISTS surveys;
