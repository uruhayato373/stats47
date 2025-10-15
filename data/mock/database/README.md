# モックデータベースファイル

このディレクトリには、mock 環境で使用するデータベースのモックデータが含まれています。

## 📋 ファイル一覧

| ファイル名            | 説明                | レコード数 |
| --------------------- | ------------------- | ---------- |
| `ranking_items.json`  | ランキングアイテム  | 10 件      |
| `ranking_values.json` | ランキング値データ  | 50 件      |
| `estat_metainfo.json` | e-Stat 統計メタ情報 | 50 件      |

## 🎯 使用目的

**mock 環境**（`NEXT_PUBLIC_USE_MOCK=true`）では、これらの JSON ファイルを使用して：

- データベース接続なしで開発・デザイン検証
- Storybook でのコンポーネント開発
- オフライン環境での開発
- CI/CD でのテスト実行

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
  if (process.env.NEXT_PUBLIC_USE_MOCK === "true") {
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
- [モックデータ全体の README](../README.md)
