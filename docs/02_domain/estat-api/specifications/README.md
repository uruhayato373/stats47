# e-STAT ライブラリドキュメント

## 概要

`src/lib/estat` は、政府統計ポータルサイト「e-Stat」のAPIからデータを取得・整形・保存するためのTypeScriptライブラリです。

このライブラリは以下の3つの主要なサービスで構成されています：

- **EstatStatsDataService**: 統計データの取得と整形
- **EstatStatsListService**: 統計データリストの取得
- **EstatMetaInfoService**: メタ情報の取得・変換・保存・検索

## ディレクトリ構成

```
src/lib/estat/
├── index.ts                          # エントリーポイント
├── statsdata/                        # 統計データサービス
│   ├── EstatStatsDataService.ts
│   ├── index.ts
│   └── __tests__/
├── statslist/                        # 統計リストサービス
│   ├── EstatStatsListService.ts
│   └── index.ts
├── metainfo/                         # メタ情報サービス
│   ├── EstatMetaInfoService.ts
│   └── index.ts
└── types/                            # 型定義
    ├── index.ts
    ├── parameters.ts                 # APIパラメータ型
    ├── formatted.ts                  # 整形済みデータ型
    ├── processed.ts                  # 処理済みデータ型
    ├── metainfo.ts                   # メタ情報型
    ├── raw-response.ts               # 生APIレスポンス型
    ├── meta-response.ts
    ├── list-response.ts
    ├── catalog-response.ts
    └── errors.ts                     # エラー型
```

## ドキュメント目次

1. [**ライブラリ概要**](02_domain/estat-api/specifications/overview.md)
   - ライブラリの目的と機能
   - アーキテクチャの説明
   - 主要な概念

2. [**EstatStatsDataService**](stats-data-service.md)
   - 統計データの取得
   - データの整形
   - フィルタリング機能
   - CSV変換

3. [**EstatStatsListService**](stats-list-service.md)
   - 統計リストの取得
   - リストの整形

4. [**EstatMetaInfoService**](metainfo-service.md)
   - メタ情報の取得と保存
   - 一括処理機能
   - 検索機能
   - サマリー情報の取得

5. [**型定義**](types.md)
   - APIパラメータ型
   - レスポンス型
   - 整形済みデータ型

6. [**使用例**](examples.md)
   - 基本的な使い方
   - 実践的なユースケース

## クイックスタート

### インストール

このライブラリはプロジェクトに含まれています。

```typescript
import {
  EstatStatsDataService,
  EstatStatsListService,
  EstatMetaInfoService
} from '@/lib/estat';
```

### 基本的な使用例

```typescript
// 統計データを取得して整形
const data = await EstatStatsDataService.getAndFormatStatsData(
  '0000010101',
  {
    categoryFilter: 'A1101',
    yearFilter: '2020',
    areaFilter: '13000'
  }
);

// 統計リストを取得
const list = await EstatStatsListService.getAndFormatStatsList({
  searchWord: '人口',
  limit: 20
});

// メタ情報を取得（要D1Database）
const metaService = new EstatMetaInfoService(db);
await metaService.processAndSaveMetaInfo('0000010101');
```

## 主な機能

### 1. データ取得とフィルタリング
- カテゴリ、年度、地域による絞り込み
- ページネーション対応
- 柔軟なパラメータ設定

### 2. データ整形
- APIレスポンスを使いやすい形式に変換
- 地域、カテゴリ、年度情報の構造化
- NULL値の適切な処理

### 3. メタデータ管理
- メタ情報の取得と保存
- 効率的な一括処理
- 検索とサマリー機能

### 4. エラーハンドリング
- 詳細なエラーログ
- わかりやすいエラーメッセージ

## 開発者向け情報

### テスト

テストファイルは `__tests__` ディレクトリに配置されています。

```bash
npm test src/lib/estat
```

### 依存関係

- `@/services/estat-api`: e-Stat API クライアント
- Cloudflare D1 Database (EstatMetaInfoServiceのみ)

## ライセンス

このプロジェクトのライセンスに従います。

## 参考リンク

- [e-Stat API 仕様](https://www.e-stat.go.jp/api/)
- [e-Stat ポータルサイト](https://www.e-stat.go.jp/)
