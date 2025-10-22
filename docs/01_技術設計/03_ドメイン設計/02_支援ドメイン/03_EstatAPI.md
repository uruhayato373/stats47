---
title: EstatAPI ドメイン
created: 2025-01-20
updated: 2025-01-20
tags:
  - ドメイン駆動設計
  - 支援ドメイン
  - EstatAPI
---

# EstatAPI ドメイン

## 概要

EstatAPI ドメインは、stats47 プロジェクトの支援ドメインの一つで、e-Stat APIとの統合を担当します。e-Stat API（MetaInfo、StatsData、StatsList）との統合、APIパラメータの管理とマッピング、データ取得・変換・正規化、e-Stat特有のエラーハンドリングなど、e-Stat APIとの連携に関するすべての機能を提供します。

### ビジネス価値

- **e-Stat API統合**: 政府統計データへの効率的なアクセス
- **データ品質保証**: e-Stat特有のデータ検証と品質管理
- **パフォーマンス最適化**: API呼び出しの最適化とキャッシュ連携
- **拡張性**: 新しいe-Stat APIエンドポイントの追加が容易

## 責務

- e-Stat API（MetaInfo、StatsData、StatsList）との統合
- APIパラメータの管理とマッピング
- データ取得・変換・正規化
- e-Stat特有のエラーハンドリングとリトライ
- レート制限管理
- データバリデーション（e-Stat特有の検証ルール）

## 主要エンティティ

### EstatMetaInfo（e-Stat メタ情報）

e-Stat APIから取得したメタ情報を管理するエンティティ。

**属性:**
- `statsDataId`: 統計データID
- `title`: 統計表のタイトル
- `description`: 統計表の説明
- `surveyDate`: 調査年月日
- `openDate`: 公開日
- `smallArea`: 小地域フラグ
- `categories`: カテゴリ情報
- `lastUpdated`: 最終更新日時

### EstatStatsData（e-Stat 統計データ）

e-Stat APIから取得した統計データを管理するエンティティ。

**属性:**
- `statsDataId`: 統計データID
- `rankingKey`: ランキングキー
- `timeCode`: 時間コード
- `areaCode`: 地域コード
- `value`: 統計値
- `unit`: 単位
- `annotation`: 注釈
- `dataSource`: データソース

### EstatStatsList（e-Stat 統計リスト）

e-Stat APIから取得した統計リストを管理するエンティティ。

**属性:**
- `listId`: リストID
- `title`: リストタイトル
- `description`: リスト説明
- `statistics`: 統計データのリスト
- `totalCount`: 総件数
- `pageInfo`: ページ情報

### ApiParameter（API パラメータ）

e-Stat API呼び出しのパラメータを管理するエンティティ。

**属性:**
- `rankingKey`: ランキングキー
- `timeCode`: 時間コード
- `areaCode`: 地域コード
- `params`: パラメータのマップ
- `apiType`: API種別（getMetaInfo/getStatsData/getStatsList）
- `lastUsed`: 最終使用日時

## 値オブジェクト

### StatsDataId（統計データID）

e-Statの統計データIDを表現する値オブジェクト。

- **具体例**: `0003000001`（人口・世帯）, `0003000002`（労働力調査）, `0003000003`（家計調査）
- **制約**: 10桁の数字、e-Statで定義されたIDのみ有効
- **用途**: e-Stat API呼び出し、データベースキー、統計データの一意識別

### ApiParameterType（APIパラメータタイプ）

e-Stat APIの種別を表現する値オブジェクト。

- **具体例**: `getMetaInfo`（メタ情報取得）, `getStatsData`（統計データ取得）, `getStatsList`（統計リスト取得）
- **制約**: 定義済みの3種類のAPI種別のみ
- **用途**: API呼び出しのルーティング、キャッシュキー生成、エラーハンドリング

### RankingKey（ランキングキー）

e-Statのランキングキーを表現する値オブジェクト。

- **具体例**: `0003000001-001`（人口・世帯-基本人口）, `0003000002-001`（労働力調査-完全失業率）
- **制約**: 統計データID + ハイフン + 3桁のサブID、e-Statで定義された形式
- **用途**: 統計データの特定、ランキング計算、API呼び出しパラメータ

## ドメインサービス

### MetaInfoService

e-Statメタ情報の取得と管理を実装するドメインサービス。

- **責務**: メタ情報の取得、キャッシュ連携、データ変換
- **主要メソッド**:
  - `getMetaInfo(statsDataId)`: 統計データIDによるメタ情報取得
  - `getMetaInfoList(categoryId)`: カテゴリ別メタ情報一覧取得
  - `validateMetaInfo(metaInfo)`: メタ情報の妥当性検証
- **使用例**: 統計データの詳細表示、カテゴリ別統計一覧、データ品質チェック

### StatsDataService

e-Stat統計データの取得と管理を実装するドメインサービス。

- **責務**: 統計データの取得、パラメータ変換、データ正規化
- **主要メソッド**:
  - `getStatsData(rankingKey, timeCode, areaCode)`: 統計データの取得
  - `getStatsDataList(rankingKey, timeCode)`: 地域別統計データ一覧取得
  - `transformData(rawData)`: 生データの内部形式への変換
- **使用例**: ランキング計算、地域別ダッシュボード、時系列データ生成

### StatsListService

e-Stat統計リストの取得と管理を実装するドメインサービス。

- **責務**: 統計リストの取得、ページング処理、検索機能
- **主要メソッド**:
  - `getStatsList(categoryId, page, limit)`: 統計リストの取得
  - `searchStatsList(query, filters)`: 統計リストの検索
  - `getStatsListByCategory(categoryId)`: カテゴリ別統計リスト取得
- **使用例**: 統計データ一覧表示、検索機能、カテゴリ別ナビゲーション

### ApiParamsService

e-Stat APIパラメータの管理を実装するドメインサービス。

- **責務**: パラメータの生成、変換、バリデーション、キャッシュキー生成
- **主要メソッド**:
  - `createApiParameter(rankingKey, timeCode, areaCode)`: APIパラメータの生成
  - `validateParameters(params)`: パラメータの妥当性検証
  - `generateCacheKey(apiType, params)`: キャッシュキーの生成
- **使用例**: API呼び出しの最適化、パラメータ検証、キャッシュ管理

## リポジトリ

### EstatRepository

e-Stat APIデータの永続化を抽象化するリポジトリインターフェース。

- **責務**: e-Stat APIデータのCRUD操作、検索、キャッシュ連携
- **主要メソッド**:
  - `findMetaInfoById(statsDataId)`: メタ情報の取得
  - `findStatsDataByRankingKey(rankingKey)`: ランキングキーによる統計データ取得
  - `findStatsListByCategory(categoryId)`: カテゴリ別統計リスト取得
  - `saveMetaInfo(metaInfo)` / `saveStatsData(statsData)`: データの保存
  - `searchStatsList(query, filters)`: 統計リストの検索

## ディレクトリ構造

```
src/lib/estat-api/
├── model/              # エンティティと値オブジェクト
│   ├── EstatMetaInfo.ts
│   ├── EstatStatsData.ts
│   ├── EstatStatsList.ts
│   ├── ApiParameter.ts
│   ├── StatsDataId.ts
│   ├── ApiParameterType.ts
│   └── RankingKey.ts
├── service/            # ドメインサービス
│   ├── MetaInfoService.ts
│   ├── StatsDataService.ts
│   ├── StatsListService.ts
│   └── ApiParamsService.ts
├── adapters/           # アダプター
│   ├── EstatRankingAdapter.ts
│   └── EstatMetaInfoAdapter.ts
└── repositories/       # リポジトリ
    └── EstatRepository.ts
```

## ベストプラクティス

### 1. API呼び出し最適化

- 適切なレート制限の実装
- パラメータの効率的な管理
- エラーハンドリングとリトライロジック

### 2. データ品質管理

- e-Stat特有のデータ検証ルール
- 異常値の検出と処理
- データ変換の一貫性保証

### 3. パフォーマンス最適化

- キャッシュとの連携
- 並列API呼び出しの活用
- レスポンス時間の監視

### 4. 拡張性

- 新しいAPIエンドポイントの追加
- パラメータ形式の変更への対応
- エラーハンドリングの改善

## 関連ドメイン

- **Ranking ドメイン**: 取得した統計データの分析
- **Cache ドメイン**: API呼び出し結果のキャッシュ管理
- **Area ドメイン**: 地域コードの管理

---

**更新履歴**:

- 2025-01-20: 初版作成
