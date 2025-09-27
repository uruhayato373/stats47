# コロプレス地図機能 データベースドキュメント

このドキュメントでは、e-stat APIから取得した統計データをカテゴリ・サブカテゴリに分類してコロプレス地図で表示する機能のデータベース設計について説明します。

## 📊 概要

- **目的**: e-stat APIの統計データを体系的に分類・管理し、コロプレス地図での視覚化を実現
- **対象**: 都道府県レベルの統計データ
- **データベース**: Cloudflare D1 (SQLite)

## 🗄️ データベース構成

### 主要テーブル

#### 1. `choropleth_categories` - カテゴリマスター
メインのデータカテゴリを定義

| カラム | 型 | 説明 | 例 |
|--------|----|----|----|
| id | TEXT | カテゴリID | "population", "economy" |
| name | TEXT | カテゴリ名 | "人口・世帯", "経済・産業" |
| description | TEXT | カテゴリ説明 | "人口総数、世帯数、人口密度など" |
| icon | TEXT | アイコン | "👥", "💼" |
| color | TEXT | 表示色 | "blue", "green" |
| display_order | INTEGER | 表示順序 | 1, 2, 3... |

#### 2. `choropleth_subcategories` - サブカテゴリマスター
具体的な統計項目を定義

| カラム | 型 | 説明 | 例 |
|--------|----|----|----|
| id | TEXT | サブカテゴリID | "population-total" |
| category_id | TEXT | 親カテゴリID | "population" |
| name | TEXT | サブカテゴリ名 | "人口総数" |
| unit | TEXT | 単位 | "人", "%", "千円" |
| data_type | TEXT | データ種別 | "numerical", "percentage", "rate" |
| stats_data_id | TEXT | e-stat統計表ID | "0003448738" |
| color_scheme | TEXT | カラースキーム | "interpolateBlues" |

#### 3. `choropleth_data_cache` - データキャッシュ
API取得データをキャッシュしてパフォーマンス向上

| カラム | 型 | 説明 |
|--------|----|----|
| id | TEXT | キャッシュID |
| subcategory_id | TEXT | サブカテゴリID |
| year | TEXT | 対象年度 |
| data | JSON | 統計データ |
| cached_at | DATETIME | キャッシュ作成日時 |
| expires_at | DATETIME | 有効期限 |

#### 4. `prefectures` - 都道府県マスター
都道府県の基本情報

| カラム | 型 | 説明 |
|--------|----|----|
| code | TEXT | 都道府県コード (01-47) |
| name | TEXT | 都道府県名 |
| region | TEXT | 地域区分 |
| capital | TEXT | 県庁所在地 |

### 補助テーブル

- `choropleth_access_logs` - API利用状況ログ
- `choropleth_user_settings` - ユーザー個人設定

### ビュー

- `v_choropleth_categories_full` - カテゴリ・サブカテゴリ結合ビュー
- `v_choropleth_cache_stats` - キャッシュ統計ビュー
- `v_choropleth_access_stats` - アクセス統計ビュー

## 🚀 セットアップ手順

### 1. データベース初期化（全体）
```bash
# 全機能を含む完全な初期化
./database/manage.sh init
```

### 2. コロプレス機能のみ追加
```bash
# 既存データベースにコロプレス機能を追加
./database/manage.sh choropleth
./database/manage.sh choropleth-data
```

### 3. マイグレーション実行
```bash
# 安全なマイグレーション（バックアップ付き）
./database/manage.sh choropleth-migrate
```

## 📁 ファイル構成

```
database/schemas/
├── choropleth.sql          # スキーマ定義
├── choropleth_data.sql     # 初期データ
├── choropleth_migration.sql # マイグレーション
└── CHOROPLETH_README.md    # このファイル
```

## 💾 初期データ

### カテゴリ（16分類）
1. **国土・気象** - 土地面積、気象データ
2. **人口・世帯** - 人口統計、世帯構成
3. **労働・賃金** - 雇用、賃金統計
4. **農林水産業** - 農業関連統計
5. **鉱工業** - 製造業統計
6. **商業・サービス業** - 商業統計
7. **企業・家計・経済** - 経済指標
8. **住宅・土地・建設** - 住宅統計
9. **エネルギー・水** - インフラ統計
10. **運輸・観光** - 交通・観光統計
11. **教育・文化・スポーツ** - 教育統計
12. **行財政** - 財政統計
13. **司法・安全・環境** - 安全・環境統計
14. **社会保障・衛生** - 医療・福祉統計
15. **国際** - 国際関係統計
16. **社会基盤施設** - インフラ統計

### サブカテゴリ（70+項目）
各カテゴリに複数のサブカテゴリが定義され、具体的な統計項目として利用されます。

## 🔧 運用管理

### キャッシュ管理
```sql
-- 期限切れキャッシュの確認
SELECT COUNT(*) FROM choropleth_data_cache
WHERE expires_at < datetime('now');

-- キャッシュクリア
DELETE FROM choropleth_data_cache
WHERE expires_at < datetime('now');
```

### パフォーマンス監視
```sql
-- アクセス統計の確認
SELECT * FROM v_choropleth_access_stats
ORDER BY access_date DESC LIMIT 10;

-- キャッシュヒット率の確認
SELECT * FROM v_choropleth_cache_stats
ORDER BY cache_hit_rate DESC;
```

### データ整合性チェック
```sql
-- 外部キー制約チェック
PRAGMA foreign_key_check;

-- データベース整合性チェック
PRAGMA integrity_check;
```

## 🔗 API統合

### エンドポイント
- `GET /api/choropleth/categories` - カテゴリ一覧
- `GET /api/choropleth/data` - 統計データ取得
- `GET /api/choropleth/years` - 利用可能年度

### データフロー
1. **カテゴリ選択** → DB照会
2. **サブカテゴリ選択** → e-stat API呼び出し
3. **データ変換** → キャッシュ保存
4. **地図表示** → フロントエンド描画

## 🎨 カスタマイズ

### 新しいカテゴリの追加
```sql
INSERT INTO choropleth_categories
(id, name, description, icon, color, display_order)
VALUES ('new-category', '新カテゴリ', '説明', '🆕', 'purple', 17);
```

### サブカテゴリの追加
```sql
INSERT INTO choropleth_subcategories
(id, category_id, name, description, unit, data_type, stats_data_id, display_order)
VALUES ('new-subcategory', 'new-category', '新項目', '説明', '単位', 'numerical', 'STATS_ID', 1);
```

## ⚠️ 注意事項

1. **e-stat API制限**: 1秒間に10リクエスト以下に制限
2. **キャッシュ戦略**: 統計表更新頻度に応じた適切な設定が必要
3. **データ型**: numerical/percentage/rateの適切な分類
4. **カラースキーム**: D3.jsの色階調名を使用

## 📈 拡張可能性

- **多言語対応**: name/descriptionの多言語化
- **時系列分析**: 年度間比較機能
- **地域階層**: 市区町村レベルの対応
- **データ品質**: 欠損値・異常値の検出機能

---

このスキーマにより、体系的で拡張可能なコロプレス地図表示システムが構築できます。