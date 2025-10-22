---
title: Data Integration ドメイン
created: 2025-01-20
updated: 2025-01-20
tags:
  - ドメイン駆動設計
  - 支援ドメイン
  - Data Integration
---

# Data Integration ドメイン

## 概要

Data Integration ドメインは、stats47 プロジェクトの支援ドメインの一つで、外部データソースとの統合を担当します。e-Stat、World Bank、OECD等の外部APIとの統合、データ取得・変換・正規化、APIパラメータマッピング、キャッシュ管理（R2/D1）、データ品質管理など、外部データとの連携に関するすべての機能を提供します。

### ビジネス価値

- **多様なデータソースの統合**: 複数の外部データソースから統計データを統一的に取得
- **データ品質の保証**: 取得したデータの品質を管理し、信頼性の高い分析を提供
- **パフォーマンス最適化**: キャッシュ戦略により、高速なデータアクセスを実現
- **スケーラビリティ**: 新しいデータソースの追加が容易な設計

## 責務

- 外部 API（e-Stat、World Bank、OECD 等）との統合
- データ取得・変換・正規化
- API パラメータマッピング
- キャッシュ管理（R2/D1）
- データ品質管理
- エラーハンドリングとリトライ
- レート制限管理
- データバージョン管理

## 主要エンティティ

### DataSource（データソース）

外部データソースの定義を管理するエンティティ。

**属性:**
- `id`: データソース ID
- `name`: データソース名
- `type`: データソースタイプ（API/Database/File）
- `endpoint`: エンドポイント URL
- `authentication`: 認証情報
- `rateLimit`: レート制限
- `isActive`: 有効フラグ
- `lastUpdated`: 最終更新日時

### DataAdapter（データアダプター）

データソース固有の変換ロジックを管理するエンティティ。

**属性:**
- `sourceId`: データソース ID
- `transformRules`: 変換ルール
- `mappingConfig`: マッピング設定
- `validationRules`: バリデーションルール
- `version`: アダプターバージョン

### ApiParameter（API パラメータ）

API呼び出しのパラメータを管理するエンティティ。

**属性:**
- `rankingKey`: ランキングキー
- `timeCode`: 時間コード
- `areaCode`: 地域コード
- `params`: パラメータのマップ
- `cacheKey`: キャッシュキー
- `ttl`: 有効期限

### CacheEntry（キャッシュエントリ）

キャッシュされたデータを管理するエンティティ。

**属性:**
- `key`: キャッシュキー
- `data`: キャッシュデータ
- `ttl`: 有効期限
- `lastUpdated`: 最終更新日時
- `metadata`: メタデータ（API 種別、パラメータ等）
- `size`: データサイズ
- `hitCount`: ヒット回数

### CacheStatistics（キャッシュ統計）

キャッシュの使用統計を管理するエンティティ。

**属性:**
- `totalRequests`: 総リクエスト数
- `hitCount`: ヒット数
- `missCount`: ミス数
- `hitRate`: ヒット率
- `averageResponseTime`: 平均応答時間
- `cacheSize`: キャッシュサイズ
- `lastCalculated`: 最終計算日時

## 値オブジェクト

### DataSourceType（データソースタイプ）

データソースのタイプを表現する値オブジェクト。

- **具体例**: `estat`（e-Stat API）, `world_bank`（World Bank API）, `oecd`（OECD API）, `database`（データベース）, `file`（ファイル）
- **制約**: 定義済みの6種類のタイプのみ（api, database, file, estat, world_bank, oecd）
- **用途**: データソースの識別、アダプターの選択、API呼び出しのルーティング

### CacheKey（キャッシュキー）

キャッシュキーを表現する値オブジェクト。

- **具体例**: `getStatsData:a3f5b2c8e1d4`（API種別:パラメータハッシュ）, `getMetaInfo:7d9e3f1a5c2b`
- **制約**: APIタイプ必須、パラメータはSHA256ハッシュ（12文字）、形式は`{apiType}:{paramHash}`
- **用途**: R2/D1でのキャッシュ識別、重複チェック、キャッシュ無効化のパターンマッチング

### TTL（有効期限）

キャッシュの有効期限を表現する値オブジェクト。

- **具体例**: `3600`（1時間）, `86400`（1日）, `604800`（1週間）, `2592000`（30日）
- **制約**: 正の整数、最大1年（31536000秒）
- **用途**: キャッシュ有効期限の管理、期限切れチェック、API種別ごとのTTL設定（MetaInfo=1週間、StatsData=1日）

## ドメインサービス

### EstatCacheService

e-Stat APIのキャッシュ管理を実装するドメインサービス。

- **責務**: e-Stat APIのキャッシュ取得・保存、R2/D1連携、ヒット統計の更新
- **主要メソッド**:
  - `getCachedResponse(apiType, parameters)`: キャッシュからデータ取得（R2確認→API呼び出し→キャッシュ保存）
  - `updateHitStats(cacheKey)`: ヒット統計の更新（D1）
  - `saveCacheMetadata(cacheKey, apiType, parameters)`: キャッシュメタデータの保存
- **使用例**: e-Stat API呼び出しの最適化、レスポンス時間の短縮、API制限の回避

### CacheInvalidationService

キャッシュの無効化を管理するドメインサービス。

- **責務**: キャッシュの無効化、期限切れデータの削除、パターンマッチングによる一括削除
- **主要メソッド**:
  - `invalidateByPattern(pattern)`: パターンに一致するキャッシュの一括削除
  - `invalidateByApiType(apiType)`: API種別によるキャッシュ削除
  - `invalidateExpired()`: 期限切れキャッシュの自動削除
  - `invalidateByParameters(apiType, parameters)`: 特定パラメータのキャッシュ削除
- **使用例**: データ更新時のキャッシュクリア、メンテナンス時の一括削除

### DataQualityService

データ品質の管理を実装するドメインサービス。

- **責務**: データ品質の検証、品質スコアの算出、問題の特定と推奨事項の生成
- **主要メソッド**:
  - `validateData(data, schema)`: データの品質検証とレポート生成
  - `calculateQualityScore(validationResult)`: 品質スコアの算出（0-100）
  - `identifyIssues(validationResult)`: データ問題の特定
  - `generateRecommendations(issues)`: 改善推奨事項の生成
- **使用例**: 外部APIデータの品質チェック、データ信頼性の評価、問題データの特定

## リポジトリ

### CacheRepository

キャッシュデータの永続化を抽象化するリポジトリインターフェース。

- **責務**: キャッシュデータのCRUD操作、統計情報の取得、パターン削除、クリーンアップ
- **主要メソッド**:
  - `get(key)` / `set(key, data, ttl)` / `delete(key)`: キャッシュデータの基本操作
  - `exists(key)`: キャッシュ存在確認
  - `getStats()`: キャッシュ統計情報の取得
  - `invalidatePattern(pattern)`: パターンマッチングによる一括削除
  - `cleanup()`: 期限切れデータのクリーンアップ

### DataSourceRepository

データソース情報の永続化を抽象化するリポジトリインターフェース。

- **責務**: データソースのCRUD操作、タイプ別検索、アクティブ状態の管理
- **主要メソッド**:
  - `findById(id)` / `findAll()` / `findActive()`: データソースの検索
  - `findByType(type)`: タイプ別データソース検索
  - `save(dataSource)` / `delete(id)`: データソースの保存・削除
  - `exists(id)`: データソース存在確認

## ディレクトリ構造

```
src/lib/data-integration/
├── estat-api/           # e-Stat API統合
│   ├── model/
│   │   ├── EstatMetaInfo.ts
│   │   ├── EstatStatsData.ts
│   │   ├── EstatStatsList.ts
│   │   ├── StatsDataId.ts
│   │   └── ApiParameter.ts
│   ├── service/
│   │   ├── MetaInfoService.ts
│   │   ├── StatsDataService.ts
│   │   ├── StatsListService.ts
│   │   ├── ApiParamsService.ts
│   │   ├── EstatCacheService.ts
│   │   ├── GeoshapeCacheService.ts
│   │   ├── CacheInvalidationService.ts
│   │   └── CacheStatsService.ts
│   ├── adapters/
│   │   ├── EstatRankingAdapter.ts
│   │   └── EstatMetaInfoAdapter.ts
│   └── repositories/
│       └── EstatRepository.ts
├── cache/               # キャッシュ管理
│   ├── model/
│   │   ├── CacheEntry.ts
│   │   ├── CacheStatistics.ts
│   │   ├── CacheKey.ts
│   │   └── TTL.ts
│   ├── service/
│   │   ├── R2CacheService.ts
│   │   └── D1CacheService.ts
│   └── repositories/
│       └── CacheRepository.ts
├── quality/             # データ品質管理
│   ├── model/
│   │   ├── DataQualityReport.ts
│   │   └── DataIssue.ts
│   └── service/
│       ├── DataQualityService.ts
│       └── ValidationService.ts
└── adapters/            # 共通アダプター
    ├── DataSourceAdapter.ts
    └── ApiClient.ts
```

## ベストプラクティス

### 1. キャッシュ戦略

- API種別に応じた適切なTTL設定
- キャッシュ無効化の自動化
- キャッシュ統計の監視

### 2. エラーハンドリング

- リトライロジックの実装
- レート制限の適切な処理
- フォールバック戦略の準備

### 3. データ品質管理

- 入力データのバリデーション
- 異常値の検出と処理
- データ品質レポートの生成

### 4. パフォーマンス最適化

- 並列データ取得の活用
- バッチ処理の最適化
- メモリ使用量の監視

## 関連ドメイン

- **Ranking ドメイン**: 取得したデータの分析
- **Area Management ドメイン**: 地域データの管理

---

**更新履歴**:

- 2025-01-20: 初版作成
