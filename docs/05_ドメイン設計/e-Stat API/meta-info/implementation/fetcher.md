---
title: meta-info Fetcher 実装ガイド
created: 2025-01-18
updated: 2025-01-18
tags:
  - domain/estat-api
  - subdomain/meta-info
  - implementation
---

# meta-info Fetcher 実装ガイド

## 概要

`EstatMetaInfoFetcher`は、e-Stat API からメタ情報を取得し、アプリケーションで使用可能な形式に変換する責務を持ちます。

## 主要なメソッド

### fetchMetaInfo()

```typescript
static async fetchMetaInfo(statsDataId: string): Promise<EstatMetaInfoResponse>
```

**目的**: 指定された統計表 ID のメタ情報を取得

**パラメータ**:

- `statsDataId`: 統計表 ID（10 桁の数字）

**戻り値**: `EstatMetaInfoResponse` - 生の API レスポンス

**エラー**:

- `EstatMetaInfoFetchError`: API 取得に失敗した場合

### fetchAndTransform()

```typescript
static async fetchAndTransform(statsDataId: string): Promise<TransformedMetadataEntry[]>
```

**目的**: メタ情報を取得して CSV 形式に変換

**パラメータ**:

- `statsDataId`: 統計表 ID

**戻り値**: `TransformedMetadataEntry[]` - データベース保存用の変換済みデータ

## 実装詳細

### エラーハンドリング

```typescript
try {
  const response = await estatAPI.getMetaInfo({ statsDataId });
  return response;
} catch (error) {
  throw new EstatMetaInfoFetchError(
    `メタ情報の取得に失敗しました: ${
      error instanceof Error ? error.message : "Unknown error"
    }`,
    statsDataId,
    error
  );
}
```

### データ変換

```typescript
const response = await this.fetchMetaInfo(statsDataId);
return EstatMetaInfoFormatter.extractCategories(response).map((category) => ({
  stats_data_id: statsDataId,
  stat_name: response.GET_META_INFO.METADATA_INF.TABLE_INF.STAT_NAME?.$ || "",
  title: response.GET_META_INFO.METADATA_INF.TABLE_INF.TITLE?.$ || "",
  cat01: category.id,
  item_name: category.name,
  unit: null,
}));
```

## 使用例

### 基本的な使用

```typescript
import { EstatMetaInfoFetcher } from "@/lib/estat-api/meta-info";

// メタ情報を取得
const metaInfo = await EstatMetaInfoFetcher.fetchMetaInfo("0000010101");
console.log(
  "統計表名:",
  metaInfo.GET_META_INFO.METADATA_INF.TABLE_INF.STAT_NAME?.$
);
```

### エラーハンドリング付き

```typescript
try {
  const metaInfo = await EstatMetaInfoFetcher.fetchMetaInfo("0000010101");
  // メタ情報の処理
} catch (error) {
  if (error instanceof EstatMetaInfoFetchError) {
    console.error("取得エラー:", error.message);
    console.error("統計表ID:", error.statsDataId);
  }
}
```

### データベース保存用の変換

```typescript
const transformedData = await EstatMetaInfoFetcher.fetchAndTransform(
  "0000010101"
);
console.log("変換済みデータ件数:", transformedData.length);
```

## 設定

### タイムアウト設定

```typescript
// 環境変数で設定
NEXT_PUBLIC_ESTAT_REQUEST_TIMEOUT_MS = 30000;
NEXT_PUBLIC_ESTAT_CONNECTION_TIMEOUT_MS = 10000;
```

### リトライ設定

```typescript
NEXT_PUBLIC_ESTAT_MAX_RETRIES = 3;
NEXT_PUBLIC_ESTAT_RETRY_DELAY_MS = 2000;
```

## テスト

### 単体テスト例

```typescript
describe("EstatMetaInfoFetcher", () => {
  it("有効な統計表IDでメタ情報を取得できる", async () => {
    const result = await EstatMetaInfoFetcher.fetchMetaInfo("0000010101");
    expect(result.GET_META_INFO.RESULT.STATUS).toBe(0);
  });

  it("無効な統計表IDでエラーが発生する", async () => {
    await expect(EstatMetaInfoFetcher.fetchMetaInfo("invalid")).rejects.toThrow(
      EstatMetaInfoFetchError
    );
  });
});
```

## パフォーマンス考慮事項

### 1. キャッシュ戦略

- 同じ統計表 ID の重複取得を避ける
- メモリキャッシュの実装検討

### 2. 並列処理

- 複数統計表の並列取得
- Promise.allSettled()の活用

### 3. レート制限

- API 制限を考慮した呼び出し頻度制御
- バッチ処理での待機時間設定

## トラブルシューティング

### よくある問題

1. **タイムアウトエラー**

   - ネットワーク接続の確認
   - タイムアウト値の調整

2. **認証エラー**

   - API キーの確認
   - 環境変数の設定確認

3. **データ形式エラー**
   - API レスポンスの検証
   - 型定義の確認

### デバッグ方法

```typescript
// デバッグログの有効化
NEXT_PUBLIC_ESTAT_DEBUG = true;
NEXT_PUBLIC_ESTAT_LOG_LEVEL = debug;
```

## 関連ドキュメント

- [API 仕様](../specifications/api.md)
- [フォーマッター実装ガイド](formatter.md)
- [バッチ処理実装ガイド](batch-processor.md)
