# repositories/d1

D1 データベースへの操作を担当。

## 責務

- メタ情報レコードの CRUD 操作
- Drizzle ORM を使用したクエリ実行

## ファイル一覧

| ファイル | 関数 | 説明 |
|----------|------|------|
| `find-by-stats-id.ts` | `findByStatsId` | 統計表 ID で検索 |
| `save.ts` | `save` | メタ情報を保存/更新 |
| `delete.ts` | `deleteRecord` | メタ情報を削除 |
| `update-attributes.ts` | `updateAttributes` | 属性を更新 |
| `update-status.ts` | `updateStatus` | ステータスを更新 |
