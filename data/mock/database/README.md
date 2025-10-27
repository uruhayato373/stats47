# モックデータベースファイル

このディレクトリには、mock 環境で使用するデータベースのモックデータが含まれています。

## 📋 ファイル一覧

| ファイル名                           | 説明                              | レコード数 | 更新日     |
| ------------------------------------ | --------------------------------- | ---------- | ---------- |
| `ranking_items.json`                 | ランキングアイテム                | 10 件      | 2025-10-11 |
| `ranking_values.json`                | ランキング値データ                | 50 件      | 2025-10-11 |
| `estat_metainfo.json`                | e-Stat 統計メタ情報               | 50 件      | 2025-10-11 |
| `users.json`                         | ユーザー認証データ                | 2 件       | 2025-10-27 |
| `subcategory_ranking_items.json` 🆕 | サブカテゴリ×ランキング項目マッピング | 8 件       | 2025-10-27 |
| `subcategory_configs.json` 🆕        | サブカテゴリ設定                  | 24 件      | 2025-10-27 |

## 🎯 使用目的

**mock 環境**（`NEXT_PUBLIC_ENV=mock`）では、これらの JSON ファイルを使用して：

- データベース接続なしで開発・デザイン検証
- Storybook でのコンポーネント開発
- オフライン環境での開発
- CI/CD でのテスト実行
- 認証機能のデザイン検証（ログイン/ログアウト状態）

## 🔐 モック環境での認証

### テストアカウント

**管理者アカウント:**
- Email: admin@stats47.local
- Password: admin123
- Role: admin

**一般ユーザーアカウント:**
- Email: user@stats47.local
- Password: user123
- Role: user

### 使用方法

1. `npm run dev:mock` でモック環境を起動
2. `/login` にアクセス
3. 上記のテストアカウントでログイン
4. `/admin` で管理画面のデザインを確認

### 注意事項

- mock環境のデータはJSON ファイルから読み込まれます
- パスワード変更やユーザー追加などの操作は反映されません
- デザイン検証とUIテストのみを目的としています

## 📊 データ構造

### ranking_items.json

```typescript
{
  "results": [
    {
      "id": number,
      "ranking_key": string,
      "label": string,
      "name": string,
      "description": string | null,
      "unit": string,
      "data_source_id": string,
      "map_color_scheme": string,
      "map_diverging_midpoint": string,
      "ranking_direction": string,
      "conversion_factor": number,
      "decimal_places": number,
      "is_active": number,
      "created_at": string,
      "updated_at": string
    }
  ]
}
```

### ranking_values.json

```typescript
{
  "results": [
    {
      "id": number,
      "ranking_key": string,
      "area_code": string,
      "area_name": string,
      "time_code": string,
      "time_name": string,
      "value": string,
      "numeric_value": number,
      "display_value": string,
      "rank": number,
      "created_at": string,
      "updated_at": string
    }
  ]
}
```

### estat_metainfo.json

```typescript
{
  "results": [
    {
      "id": number,
      "stats_data_id": string,
      "stat_name": string,
      "title": string,
      "cat01": string,
      "item_name": string,
      "unit": string,
      "ranking_key": string,
      "updated_at": string,
      "created_at": string
    }
  ]
}
```

### subcategory_ranking_items.json 🆕

サブカテゴリとランキング項目のマッピングデータ（2025-10-27追加）

```typescript
{
  "results": [
    {
      "id": number,
      "subcategory_id": string,        // 例: "land-area", "households"
      "ranking_item_id": number,       // ranking_items_new.id への参照
      "display_order": number,         // サブカテゴリ内での表示順
      "is_default": number,            // デフォルト選択（1 or 0）
      "created_at": string
    }
  ]
}
```

**用途**: サブカテゴリページで表示するランキング項目を決定

**マッピング例**:
- `land-area` → `areaRatio` (面積割合)
- `land-use` → `agriculturalLand` (農用地), `agriculturalLandRatio` (農用地割合)
- `weather-climate` → `avgTemperature` (年平均気温)

### subcategory_configs.json 🆕

サブカテゴリの設定データ（categories.jsonと対応、2025-10-27追加）

```typescript
{
  "results": [
    {
      "id": string,                    // subcategory_id (例: "land-area")
      "category_id": string,           // 親カテゴリID (例: "landweather")
      "name": string,                  // サブカテゴリ名 (例: "土地面積")
      "description": string | null,    // 説明文
      "default_ranking_key": string | null,  // デフォルトランキングキー
      "created_at": string,
      "updated_at": string
    }
  ]
}
```

**用途**: サブカテゴリのメタデータ管理（categories.jsonのデータベース版）

## 🔄 モックデータの更新方法

ローカル D1 から最新のデータでモックデータを再生成する場合：

```bash
# ranking_items（10件）
npx wrangler d1 execute stats47 --local --command "SELECT * FROM ranking_items LIMIT 10;" --json > data/mock/database/ranking_items.json

# ranking_values（50件）
npx wrangler d1 execute stats47 --local --command "SELECT * FROM ranking_values LIMIT 50;" --json > data/mock/database/ranking_values.json

# estat_metainfo（50件）
npx wrangler d1 execute stats47 --local --command "SELECT * FROM estat_metainfo LIMIT 50;" --json > data/mock/database/estat_metainfo.json
```

## 💡 使用例

### Next.js アプリケーション内での使用

```typescript
import rankingItems from "@/data/mock/database/ranking_items.json";
import rankingValues from "@/data/mock/database/ranking_values.json";
import estatMetainfo from "@/data/mock/database/estat_metainfo.json";

// mock環境でのデータ取得
export async function getRankingItems() {
  if (process.env.NEXT_PUBLIC_ENV === "mock") {
    return rankingItems.results;
  }

  // 実際のDB接続
  const db = await getDB();
  return db.prepare("SELECT * FROM ranking_items").all();
}
```

### Storybook での使用

```typescript
import mockRankingItems from "@/data/mock/database/ranking_items.json";

export const Default: Story = {
  args: {
    items: mockRankingItems.results,
  },
};
```

## ⚠️ 注意事項

1. **Git 管理対象**: これらのモックデータは Git 管理されています
2. **デプロイ除外**: `wrangler.toml`の設定により、Cloudflare へのデプロイ時には除外されます
3. **本番データのサブセット**: このデータは本番データの一部（最初の 10-50 件）です
4. **定期更新推奨**: 本番データの構造が変更された場合は再生成してください

## 🔗 関連ドキュメント

- [プロジェクト概要](../../../docs/01_概要/01_概要.md)
- [開発環境設定ガイド](../../../docs/02_開発/10_開発環境設定ガイド.md)
- [環境別データ取得戦略](../../../docs/02_開発/10_開発環境設定ガイド.md#環境別データ取得戦略)
- [モックデータ全体の README](../README.md)

## 🌍 環境別データ取得戦略との連携

このモックデータは、プロジェクトの環境別データ取得戦略の一部として機能します：

- **mock 環境**: この JSON ファイルから直接データを読み込み
- **development 環境**: ローカル D1 からデータを取得
- **staging 環境**: リモート D1（stats47_staging）からデータを取得
- **production 環境**: リモート D1（stats47）からデータを取得

環境の切り替えは `NEXT_PUBLIC_ENV` 環境変数で自動的に行われ、開発者は環境を意識することなく同じコードで開発できます。
