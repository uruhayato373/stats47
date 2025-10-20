---
title: meta-info サブドメイン概要
created: 2025-01-18
updated: 2025-01-18
tags:
  - domain/estat-api
  - subdomain/meta-info
---

# meta-info サブドメイン概要

## 目的

meta-info サブドメインは、e-Stat API から取得した統計表のメタ情報（基本情報、分類情報、地域情報、時間軸情報など）を管理する責務を持ちます。

## 主要な機能

### 1. メタ情報の取得と変換

- e-Stat API からメタ情報を取得
- 構造化された形式への変換
- データベース保存用の CSV 形式への変換

### 2. バッチ処理

- 複数統計表の一括処理
- レート制限を考慮した効率的な処理
- エラーハンドリングとログ出力

### 3. データベース管理

- メタ情報の永続化
- 検索機能
- 重複排除とデータ整合性の確保

## アーキテクチャ

### ディレクトリ構造

```
src/lib/estat-api/meta-info/
├── index.ts                    # エントリーポイント
├── fetcher.ts                  # API取得処理
├── formatter.ts                # データ変換処理
├── batch-processor.ts          # バッチ処理
├── id-utils.ts                 # ID操作ユーティリティ
├── EstatMetaInfoR2Repository.ts   # R2ストレージ連携
└── utils/
    ├── helpers.ts              # ヘルパー関数
    └── index.ts
```

### データフロー

```
API Request
    │
    ▼
EstatMetaInfoFetcher.fetchMetaInfo()
    │
    ▼
e-Stat API (getMetaInfo)
    │
    ▼
EstatMetaInfoFormatter.parseCompleteMetaInfo()
    │
    ├─► extractTableInfo()
    ├─► extractCategories()
    ├─► extractAreas()
    └─► extractTimeAxis()
            │
            ▼
    Formatted Meta Info
            │
            ▼
EstatMetaInfoFormatter.generateSelectOptions()
            │
            ▼
    UI用選択肢データ
```

## 主要なコンポーネント

### EstatMetaInfoFetcher

- e-Stat API との通信
- エラーハンドリング
- レスポンス検証

### EstatMetaInfoFormatter

- 生 API レスポンスの解析
- 構造化データへの変換
- UI 用選択肢の生成

### EstatMetaInfoBatchProcessor

- 複数統計表の一括処理
- レート制限対応
- 進捗管理

## 型定義

### 主要な型

- `EstatMetaInfoResponse`: 生 API レスポンス
- `TableInfo`: 統計表基本情報
- `CategoryInfo`: 分類情報
- `PrefectureInfo`: 地域情報
- `TimeAxisInfo`: 時間軸情報
- `DimensionSelectOptions`: UI 用選択肢

## 設定

### 環境変数

```bash
# バッチ処理設定
NEXT_PUBLIC_ESTAT_BATCH_SIZE=10
NEXT_PUBLIC_ESTAT_BATCH_DELAY_MS=1000

# レート制限設定
NEXT_PUBLIC_ESTAT_RATE_LIMIT_PER_MINUTE=60
NEXT_PUBLIC_ESTAT_RATE_LIMIT_PER_HOUR=1000

# タイムアウト設定
NEXT_PUBLIC_ESTAT_REQUEST_TIMEOUT_MS=30000
```

## 使用例

### 基本的なメタ情報取得

```typescript
import { EstatMetaInfoFetcher } from "@/lib/estat-api/meta-info";

// メタ情報を取得
const metaInfo = await EstatMetaInfoFetcher.fetchMetaInfo("0000010101");
```

### バッチ処理

```typescript
import { EstatMetaInfoBatchProcessor } from "@/lib/estat-api/meta-info";

// 複数統計表を一括処理
const result = await EstatMetaInfoBatchProcessor.processBulk(
  ["0000010101", "0000010102", "0000010103"],
  {
    batchSize: 5,
    delayMs: 1000,
    onProgress: (processed, total) => {
      console.log(`進捗: ${processed}/${total}`);
    },
  }
);
```

### フォーマッター使用

```typescript
import { EstatMetaInfoFormatter } from "@/lib/estat-api/meta-info";

// 完全なメタ情報を解析
const parsedData = EstatMetaInfoFormatter.parseCompleteMetaInfo(metaInfo);

// UI用選択肢を生成
const selectOptions = EstatMetaInfoFormatter.generateSelectOptions(metaInfo);
```

## エラーハンドリング

### カスタムエラークラス

- `EstatMetaInfoFetchError`: API 取得エラー
- `EstatDataTransformError`: データ変換エラー
- `EstatBatchProcessError`: バッチ処理エラー

### エラー処理例

```typescript
try {
  const metaInfo = await EstatMetaInfoFetcher.fetchMetaInfo(statsDataId);
  // 処理続行
} catch (error) {
  if (error instanceof EstatMetaInfoFetchError) {
    console.error("メタ情報取得エラー:", error.message);
    console.error("統計表ID:", error.statsDataId);
  }
  // エラー処理
}
```

## テスト

### テストファイル

- `formatter.test.ts`: フォーマッターのテスト
- `fetcher.test.ts`: フェッチャーのテスト
- `id-utils.test.ts`: ID 操作のテスト
- `helpers.test.ts`: ヘルパー関数のテスト

### テスト実行

```bash
npm test -- src/lib/estat-api/meta-info/__tests__
```

## 関連ドキュメント

- [API 仕様](specifications/api.md) - get-meta-info API の詳細
- [サービス仕様](specifications/service.md) - サービスクラスの実装詳細
- [実装ガイド](implementation/) - 実装に関する詳細ガイド
- [テストガイド](testing/) - テスト戦略と実装

## パフォーマンス考慮事項

### 1. レート制限

- e-Stat API の制限を考慮したバッチ処理
- 適切な待機時間の設定

### 2. メモリ使用量

- 大量データのストリーミング処理
- 不要なデータの早期解放

### 3. エラー回復

- 個別エラーでの全体処理停止を防止
- リトライ機能の実装

## 今後の拡張予定

1. **キャッシュ機能**: 取得済みメタ情報のキャッシュ
2. **差分更新**: 変更されたメタ情報のみの更新
3. **並列処理**: 複数 API の並列取得
4. **メトリクス**: 処理時間や成功率の監視
