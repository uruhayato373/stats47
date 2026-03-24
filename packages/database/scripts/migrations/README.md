# マイグレーション

既存の SQLite (D1) データベースに手動で適用する SQL スクリプトです。

## 実行方法

1. **バックアップを取得する**
2. DB ファイルに対して SQLite でスクリプトを実行する  
   （例: `sqlite3 /path/to/xxx.sqlite < construction-dashboard-restructure.sql`）
3. 必要に応じて `packages/database` で `pnpm run seed` を実行し、subcategories や ranking_tags の最新内容を反映する

## スクリプト一覧

| ファイル | 概要 |
|----------|------|
| `stat-card-to-stats-card.sql` | component_type を `stat-card` → `stats-card` に統一 |
| `construction-dashboard-restructure.sql` | construction ダッシュボード再構成（サブカテゴリ 6→5、ID・キー変更、定義カード追加に伴う既存 DB の更新） |
