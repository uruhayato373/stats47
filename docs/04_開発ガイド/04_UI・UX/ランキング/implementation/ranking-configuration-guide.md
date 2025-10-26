---
title: ランキング設定管理ガイド
created: 2025-01-15
updated: 2025-01-15
tags:
  - domain/ranking
  - implementation
  - configuration
  - database
---

# ランキング設定管理ガイド

## 概要

ランキング設定は、データベース経由で動的に管理されます。コードの変更なしで統計項目の追加・変更が可能です。

## データベース設計

ランキング設定は以下のテーブルで管理されます：

- `subcategory_configs`: サブカテゴリの基本設定
- `ranking_items`: 各統計項目の詳細設定

詳細は [データベース設計ドキュメント](../../database/database-design.md) を参照してください。

## ランキング項目の追加・変更方法

### 1. データベースでの設定

新しいランキング項目を追加する場合：

```sql
-- サブカテゴリ設定を追加
INSERT INTO subcategory_configs (id, category_id, name, description, default_ranking_key)
VALUES ('new-subcategory', 'category-id', '新サブカテゴリ', '説明', 'default-key');

-- ランキング項目を追加
INSERT INTO ranking_items (subcategory_id, ranking_key, label, stats_data_id, cd_cat01, unit, name, display_order)
VALUES
  ('new-subcategory', 'item1', '項目1', 'stats-id', 'cat01', 'unit', '項目名', 1);
```

### 2. 既存項目の変更

```sql
-- 表示順序の変更
UPDATE ranking_items
SET display_order = 5
WHERE subcategory_id = 'land-area' AND ranking_key = 'habitableArea';

-- アクティブ状態の変更
UPDATE ranking_items
SET is_active = 0
WHERE subcategory_id = 'land-area' AND ranking_key = 'majorLakeArea';
```

## データベース経由での設定管理

### API エンドポイント

ランキング設定は以下の API エンドポイントで取得できます：

```
GET /api/rankings-items/[subcategoryId]
```

例：

```bash
curl http://localhost:3000/api/rankings-items/land-area
```

### データ取得関数

サーバーコンポーネントからランキング設定を取得：

```typescript
import {
  getRankingConfig,
  convertToRankingData,
} from "@/infrastructure/ranking/get-ranking-items";

// ランキング設定を取得
const config = await getRankingConfig("land-area");

// ランキングデータに変換
const rankings = convertToRankingData(config.rankingItems);
```

## フォールバック処理

データベース接続失敗時は、フォールバック設定が使用されます：

```typescript
import { FALLBACK_CONFIGS } from "@/infrastructure/ranking/get-ranking-items";

// フォールバック設定を使用
const config =
  (await getRankingConfig("land-area")) || FALLBACK_CONFIGS["land-area"];
```

## 新しいサブカテゴリの追加手順

1. **データベースにサブカテゴリ設定を追加**
2. **ランキング項目を追加**
3. **フォールバック設定を更新** (`src/infrastructure/ranking/get-ranking-items.ts`)
4. **ランキングコンポーネントを作成**
5. **ルーティングを設定**

### 例：新しいサブカテゴリ 'population' の追加

```sql
-- 1. サブカテゴリ設定
INSERT INTO subcategory_configs (id, category_id, name, description, default_ranking_key)
VALUES ('population', 'demographics', '人口', '都道府県別人口統計', 'totalPopulation');

-- 2. ランキング項目
INSERT INTO ranking_items (subcategory_id, ranking_key, label, stats_data_id, cd_cat01, unit, name, display_order)
VALUES
  ('population', 'totalPopulation', '総人口', '0003448368', 'A110101', '人', '総人口', 1),
  ('population', 'malePopulation', '男性人口', '0003448368', 'A110102', '人', '男性人口', 2),
  ('population', 'femalePopulation', '女性人口', '0003448368', 'A110103', '人', '女性人口', 3);
```

## キャッシュ戦略

ランキング設定は以下のキャッシュ戦略を採用：

- **API レスポンス**: 5 分間キャッシュ
- **Stale-while-revalidate**: 6 分間
- **フォールバック**: データベース接続失敗時

## トラブルシューティング

### よくある問題

1. **ランキング項目が表示されない**

   - データベース接続を確認
   - `is_active = 1` の項目のみ表示される
   - フォールバック設定を確認

2. **API エラーが発生する**

   - データベーススキーマが正しく作成されているか確認
   - シードデータが投入されているか確認

3. **表示順序が正しくない**
   - `display_order` カラムの値を確認
   - 数値が小さいほど上位に表示される

### デバッグ方法

```sql
-- ランキング設定の確認
SELECT * FROM v_ranking_configs WHERE subcategory_id = 'land-area';

-- アクティブな項目のみ表示
SELECT * FROM ranking_items WHERE subcategory_id = 'land-area' AND is_active = 1;
```

## ベストプラクティス

1. **データの整合性**: 外部キー制約を適切に設定
2. **論理削除**: データ削除時は `is_active = 0` を使用
3. **バックアップ**: 重要な設定変更前にバックアップを取得
4. **テスト**: 本番環境での変更前にテスト環境で検証
5. **ドキュメント**: 設定変更時はドキュメントを更新

## 関連ドキュメント

- [データベース設計](../../database/database-design.md)
- [ランキングアーキテクチャ](r2-hybrid-architecture.md)
- [ランキングコンポーネントリファクタリング](ranking-components-refactoring.md)
