---
title: データベーススキーマリファレンス
created: 2025-10-17
updated: 2025-10-17
tags:
  - domain/database
  - specifications
  - schema
---

# データベーススキーマリファレンス

## 概要

stats47 プロジェクトのデータベーススキーマの詳細リファレンスです。全テーブルの定義、カラム詳細、制約、インデックスについて説明します。

## データベース情報

- **データベース名**: `stats47`
- **データベースタイプ**: Cloudflare D1 (SQLite ベース)
- **スキーマファイル**: `database/schemas/main.sql`

## テーブル一覧

### 1. users

ユーザー認証・管理テーブル

| カラム名       | データ型 | 制約        | デフォルト値      | 説明                 |
| -------------- | -------- | ----------- | ----------------- | -------------------- |
| id             | TEXT     | PRIMARY KEY | -                 | ユーザー ID (UUID)   |
| name           | TEXT     | NOT NULL    | -                 | ユーザー名           |
| email          | TEXT     | UNIQUE      | -                 | メールアドレス       |
| email_verified | DATETIME | -           | NULL              | メール認証日時       |
| image          | TEXT     | -           | NULL              | プロフィール画像 URL |
| created_at     | DATETIME | -           | CURRENT_TIMESTAMP | 作成日時             |
| updated_at     | DATETIME | -           | CURRENT_TIMESTAMP | 更新日時             |

**インデックス**:

- `idx_users_email` ON users(email)

### 2. estat_metainfo

e-Stat メタデータテーブル（統計表レベル管理）

| カラム名        | データ型 | 制約        | デフォルト値      | 説明                |
| --------------- | -------- | ----------- | ----------------- | ------------------- |
| stats_data_id   | TEXT     | PRIMARY KEY | -                 | 統計表 ID（主キー） |
| stat_name       | TEXT     | NOT NULL    | -                 | 統計調査名          |
| title           | TEXT     | NOT NULL    | -                 | 統計表タイトル      |
| gov_org         | TEXT     | -           | NULL              | 提供機関            |
| cycle           | TEXT     | -           | NULL              | 調査周期            |
| survey_date     | TEXT     | -           | NULL              | 調査年月            |
| description     | TEXT     | -           | NULL              | 説明                |
| last_fetched_at | DATETIME | -           | CURRENT_TIMESTAMP | 最終取得日時        |
| created_at      | DATETIME | -           | CURRENT_TIMESTAMP | 作成日時            |
| updated_at      | DATETIME | -           | CURRENT_TIMESTAMP | 更新日時            |

**インデックス**:

- `idx_estat_metainfo_stat_name` ON estat_metainfo(stat_name)
- `idx_estat_metainfo_title` ON estat_metainfo(title)
- `idx_estat_metainfo_gov_org` ON estat_metainfo(gov_org)
- `idx_estat_metainfo_updated_at` ON estat_metainfo(updated_at)

### 3. estat_data_history

データ変更履歴テーブル

| カラム名      | データ型 | 制約                      | デフォルト値      | 説明                              |
| ------------- | -------- | ------------------------- | ----------------- | --------------------------------- |
| id            | INTEGER  | PRIMARY KEY AUTOINCREMENT | -                 | 履歴 ID                           |
| stats_data_id | TEXT     | NOT NULL                  | -                 | 統計データ ID                     |
| action        | TEXT     | NOT NULL                  | -                 | アクション (INSERT/UPDATE/DELETE) |
| old_data      | TEXT     | -                         | NULL              | 変更前データ (JSON)               |
| new_data      | TEXT     | -                         | NULL              | 変更後データ (JSON)               |
| user_id       | TEXT     | -                         | NULL              | 変更者 ID                         |
| created_at    | DATETIME | -                         | CURRENT_TIMESTAMP | 作成日時                          |

**インデックス**:

- `idx_estat_data_history_stats_data_id` ON estat_data_history(stats_data_id)
- `idx_estat_data_history_created_at` ON estat_data_history(created_at)

### 4. ranking_visualizations

地図可視化設定管理テーブル

| カラム名           | データ型 | 制約                      | デフォルト値      | 説明              |
| ------------------ | -------- | ------------------------- | ----------------- | ----------------- |
| id                 | INTEGER  | PRIMARY KEY AUTOINCREMENT | -                 | 設定 ID           |
| ranking_key        | TEXT     | NOT NULL UNIQUE           | -                 | ランキングキー    |
| visualization_type | TEXT     | NOT NULL                  | -                 | 可視化タイプ      |
| config             | TEXT     | -                         | NULL              | 設定データ (JSON) |
| is_active          | BOOLEAN  | -                         | 1                 | アクティブフラグ  |
| created_at         | DATETIME | -                         | CURRENT_TIMESTAMP | 作成日時          |
| updated_at         | DATETIME | -                         | CURRENT_TIMESTAMP | 更新日時          |

**インデックス**:

- `idx_ranking_visualizations_ranking_key` ON ranking_visualizations(ranking_key)
- `idx_ranking_visualizations_is_active` ON ranking_visualizations(is_active)

### 5. ranking_items

ランキング項目設定テーブル

| カラム名    | データ型 | 制約                      | デフォルト値      | 説明             |
| ----------- | -------- | ------------------------- | ----------------- | ---------------- |
| id          | INTEGER  | PRIMARY KEY AUTOINCREMENT | -                 | 項目 ID          |
| ranking_key | TEXT     | NOT NULL                  | -                 | ランキングキー   |
| item_name   | TEXT     | NOT NULL                  | -                 | 項目名           |
| description | TEXT     | -                         | NULL              | 説明             |
| sort_order  | INTEGER  | -                         | 0                 | ソート順         |
| is_active   | BOOLEAN  | -                         | 1                 | アクティブフラグ |
| created_at  | DATETIME | -                         | CURRENT_TIMESTAMP | 作成日時         |
| updated_at  | DATETIME | -                         | CURRENT_TIMESTAMP | 更新日時         |

**インデックス**:

- `idx_ranking_items_ranking_key` ON ranking_items(ranking_key)
- `idx_ranking_items_sort_order` ON ranking_items(sort_order)
- `idx_ranking_items_is_active` ON ranking_items(is_active)

## ビュー

### v_estat_metainfo_summary

統計表サマリービュー

```sql
CREATE VIEW v_estat_metainfo_summary AS
SELECT
  stats_data_id,
  stat_name,
  title,
  gov_org,
  cycle,
  survey_date,
  last_fetched_at,
  created_at,
  updated_at
FROM estat_metainfo
ORDER BY updated_at DESC;
```

## 外部キー制約

現在のスキーマでは外部キー制約は設定されていませんが、以下の関係が想定されています：

- `estat_data_history.user_id` → `users.id`
- `estat_data_history.stats_data_id` → `estat_metainfo.stats_data_id`

## データ型の詳細

### SQLite データ型

| 定義     | 実際の型 | 説明                |
| -------- | -------- | ------------------- |
| INTEGER  | INTEGER  | 整数                |
| TEXT     | TEXT     | テキスト            |
| DATETIME | TEXT     | 日時 (ISO8601 形式) |
| BOOLEAN  | INTEGER  | 真偽値 (0/1)        |

### カスタム型

- **UUID**: TEXT 型で UUID 形式の文字列を格納
- **JSON**: TEXT 型で JSON 形式の文字列を格納

## インデックス戦略

### プライマリインデックス

- 全テーブルで `id` カラムにプライマリインデックス
- `users` テーブルで `id` (UUID) にプライマリインデックス

### セカンダリインデックス

- **検索頻度の高いカラム**: `email`, `stats_data_id`, `ranking_key`
- **ソート用カラム**: `created_at`, `updated_at`, `sort_order`
- **フィルタ用カラム**: `is_active`, `category`, `subcategory`

### 複合インデックス

現在は単一カラムのインデックスのみですが、以下の複合インデックスを検討：

```sql
-- 統計調査名とタイトルでの検索用
CREATE INDEX idx_estat_metainfo_stat_title
ON estat_metainfo(stat_name, title);

-- ランキングキーとアクティブフラグでの検索用
CREATE INDEX idx_ranking_items_key_active
ON ranking_items(ranking_key, is_active);
```

## パフォーマンス考慮事項

### クエリ最適化

1. **インデックスヒント**: 適切なインデックスを使用
2. **LIMIT 句**: 大量データ取得時は LIMIT を設定
3. **WHERE 句**: インデックス付きカラムでの絞り込み

### データサイズ管理

1. **JSON データ**: 大きな JSON データは別テーブルに分離を検討
2. **履歴データ**: 古い履歴データのアーカイブ
3. **ログローテーション**: ログテーブルの定期クリーンアップ

## マイグレーション

### スキーマ変更手順

1. マイグレーションファイルの作成
2. ローカル環境でのテスト
3. ステージング環境での検証
4. 本番環境への適用

### ロールバック戦略

1. 前のバージョンへのマイグレーション
2. データの整合性確認
3. アプリケーションの動作確認

## セキュリティ

### データ保護

1. **暗号化**: 機密データの暗号化
2. **アクセス制御**: ユーザーレベルの権限管理
3. **監査ログ**: データ変更の追跡

### SQL インジェクション対策

1. **プリペアドステートメント**: パラメータ化クエリの使用
2. **入力検証**: ユーザー入力の検証
3. **エスケープ処理**: 特殊文字の適切な処理

## 関連ドキュメント

- [データベース設計](./database-design.md)
- [マイグレーションガイド](./migration-guide.md)
- [開発環境セットアップ](../implementation/development-setup.md)
- [クエリパターン集](../implementation/query-patterns.md)
