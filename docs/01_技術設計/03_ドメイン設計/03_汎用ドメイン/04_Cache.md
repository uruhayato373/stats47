---
title: Cache ドメイン
created: 2025-01-20
updated: 2025-01-20
tags:
  - ドメイン駆動設計
  - 支援ドメイン
  - Cache
---

# Cache ドメイン

## 概要

Cache ドメインは、stats47 プロジェクトの汎用ドメインの一つで、汎用的なキャッシュ管理を担当します。R2/D1 連携によるキャッシュ管理、キャッシュキーの生成と管理、TTL 管理、キャッシュ無効化、統計情報の管理など、システム全体のキャッシュ機能に関するすべての機能を提供します。

### ビジネス価値

- **パフォーマンス向上**: データアクセスの高速化
- **コスト削減**: API 呼び出し回数の削減
- **スケーラビリティ**: 大量データの効率的な管理
- **可用性向上**: 外部 API 障害時のフォールバック

## 責務

- R2/D1 連携によるキャッシュ管理
- キャッシュキーの生成と管理
- TTL（有効期限）管理
- キャッシュ無効化（パターン削除、期限切れ削除）
- キャッシュ統計情報の管理
- キャッシュヒット率の監視
- メモリ使用量の最適化

## 主要エンティティ

### CacheEntry（キャッシュエントリ）

キャッシュされたデータを管理するエンティティ。

**属性:**

- `key`: キャッシュキー
- `data`: キャッシュデータ
- `ttl`: 有効期限
- `createdAt`: 作成日時
- `lastAccessed`: 最終アクセス日時
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

### CacheConfig（キャッシュ設定）

キャッシュの設定情報を管理するエンティティ。

**属性:**

- `defaultTtl`: デフォルト TTL
- `maxSize`: 最大キャッシュサイズ
- `cleanupInterval`: クリーンアップ間隔
- `compressionEnabled`: 圧縮有効フラグ
- `encryptionEnabled`: 暗号化有効フラグ

## 値オブジェクト

### CacheKey（キャッシュキー）

キャッシュキーを表現する値オブジェクト。

- **具体例**: `estat:getStatsData:a3f5b2c8e1d4`（API 種別:パラメータハッシュ）, `ranking:population:001`
- **制約**: API タイプ必須、パラメータは SHA256 ハッシュ（12 文字）、形式は`{namespace}:{apiType}:{paramHash}`
- **用途**: R2/D1 でのキャッシュ識別、重複チェック、キャッシュ無効化のパターンマッチング

### TTL（有効期限）

キャッシュの有効期限を表現する値オブジェクト。

- **具体例**: `3600`（1 時間）, `86400`（1 日）, `604800`（1 週間）, `2592000`（30 日）
- **制約**: 正の整数、最大 1 年（31536000 秒）
- **用途**: キャッシュ有効期限の管理、期限切れチェック、API 種別ごとの TTL 設定

### CacheNamespace（キャッシュ名前空間）

キャッシュの名前空間を表現する値オブジェクト。

- **具体例**: `estat`（e-Stat API）, `ranking`（ランキング）, `timeseries`（時系列）, `area`（地域）
- **制約**: 小文字英数字とハイフンのみ、最大 20 文字
- **用途**: キャッシュの分類、名前空間別の管理、無効化の範囲指定

## ドメインサービス

### R2CacheService

R2 ストレージとの連携を実装するドメインサービス。

- **責務**: R2 へのキャッシュ保存・取得、メタデータ管理、バッチ操作
- **主要メソッド**:
  - `get(key)`: キャッシュデータの取得
  - `set(key, data, ttl)`: キャッシュデータの保存
  - `delete(key)`: キャッシュデータの削除
  - `batchDelete(keys)`: 複数キャッシュの一括削除
- **使用例**: 大容量データのキャッシュ、長期保存、高可用性

### D1CacheService

D1 データベースとの連携を実装するドメインサービス。

- **責務**: キャッシュメタデータの管理、統計情報の記録、クエリ最適化
- **主要メソッド**:
  - `saveMetadata(entry)`: キャッシュメタデータの保存
  - `getMetadata(key)`: キャッシュメタデータの取得
  - `updateHitStats(key)`: ヒット統計の更新
  - `getStatistics()`: キャッシュ統計の取得
- **使用例**: キャッシュ統計の管理、メタデータ検索、パフォーマンス監視

### CacheInvalidationService

キャッシュの無効化を管理するドメインサービス。

- **責務**: キャッシュの無効化、期限切れデータの削除、パターンマッチング
- **主要メソッド**:
  - `invalidateByPattern(pattern)`: パターンに一致するキャッシュの一括削除
  - `invalidateByNamespace(namespace)`: 名前空間別キャッシュ削除
  - `invalidateExpired()`: 期限切れキャッシュの自動削除
  - `invalidateByKey(key)`: 特定キーのキャッシュ削除
- **使用例**: データ更新時のキャッシュクリア、メンテナンス時の一括削除

### CacheStatsService

キャッシュ統計の管理を実装するドメインサービス。

- **責務**: 統計情報の計算、パフォーマンス監視、レポート生成
- **主要メソッド**:
  - `calculateHitRate()`: ヒット率の計算
  - `getPerformanceMetrics()`: パフォーマンス指標の取得
  - `generateReport()`: キャッシュレポートの生成
  - `monitorCacheHealth()`: キャッシュ健全性の監視
- **使用例**: パフォーマンス監視、キャッシュ最適化、運用レポート

## リポジトリ

### CacheRepository

キャッシュデータの永続化を抽象化するリポジトリインターフェース。

- **責務**: キャッシュデータの CRUD 操作、統計情報の取得、パターン削除、クリーンアップ
- **主要メソッド**:
  - `get(key)` / `set(key, data, ttl)` / `delete(key)`: キャッシュデータの基本操作
  - `exists(key)`: キャッシュ存在確認
  - `getStats()`: キャッシュ統計情報の取得
  - `invalidatePattern(pattern)`: パターンマッチングによる一括削除
  - `cleanup()`: 期限切れデータのクリーンアップ

## ディレクトリ構造

```
src/lib/cache/
├── model/              # エンティティと値オブジェクト
│   ├── CacheEntry.ts
│   ├── CacheStatistics.ts
│   ├── CacheConfig.ts
│   ├── CacheKey.ts
│   ├── TTL.ts
│   └── CacheNamespace.ts
├── service/            # ドメインサービス
│   ├── R2CacheService.ts
│   ├── D1CacheService.ts
│   ├── CacheInvalidationService.ts
│   └── CacheStatsService.ts
└── repositories/       # リポジトリ
    └── CacheRepository.ts
```

## ベストプラクティス

### 1. キャッシュ戦略

- API 種別に応じた適切な TTL 設定
- キャッシュ無効化の自動化
- キャッシュ統計の監視

### 2. パフォーマンス最適化

- 効率的なキャッシュキー生成
- バッチ操作の活用
- メモリ使用量の監視

### 3. データ整合性

- キャッシュとソースデータの同期
- トランザクション管理
- エラーハンドリング

### 4. スケーラビリティ

- 分散キャッシュの設計
- 負荷分散の実装
- 容量計画の策定

## 関連ドメイン

- **EstatAPI ドメイン**: e-Stat API 呼び出し結果のキャッシュ
- **Ranking ドメイン**: ランキング計算結果のキャッシュ
- **TimeSeries ドメイン**: 時系列データのキャッシュ

---

**更新履歴**:

- 2025-01-20: 初版作成
