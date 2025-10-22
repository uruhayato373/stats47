---
title: Search ドメイン
created: 2025-01-20
updated: 2025-01-20
tags:
  - ドメイン駆動設計
  - 支援ドメイン
  - Search
---

# Search ドメイン

## 概要

Search ドメインは、stats47 プロジェクトの支援ドメインの一つで、統計データとコンテンツの検索機能を担当します。全文検索エンジン、検索インデックス管理、検索演算子処理、オートコンプリート、サジェスト機能、検索履歴管理、ファセット検索、スペルチェックなど、検索に関するすべての機能を提供します。

### ビジネス価値

- **統合検索**: 統計データ、ブログ記事、カテゴリを横断的に検索
- **高度な検索**: AND/OR/NOT演算子、フレーズ検索等の高度な検索機能
- **検索体験の向上**: オートコンプリート、サジェスト、検索履歴による使いやすさ
- **関連性の発見**: ファセット検索により、関連するコンテンツを発見

## 責務

- 全文検索エンジン
- 検索インデックス管理
- 検索演算子処理（AND/OR/NOT、フレーズ検索）
- オートコンプリート
- サジェスト機能
- 検索履歴管理
- ファセット検索
- スペルチェック
- 検索結果のランキング
- 検索統計の収集

## 主要エンティティ

### SearchQuery（検索クエリ）

検索クエリの情報を管理するエンティティ。

**属性:**
- `query`: 検索クエリ文字列
- `filters`: フィルタ条件
- `operators`: 検索演算子
- `contentTypes`: 検索対象コンテンツタイプ
- `sortBy`: ソート条件
- `page`: ページ番号
- `limit`: 結果数制限

### SearchResult（検索結果）

検索結果の情報を管理するエンティティ。

**属性:**
- `results`: 結果リスト
- `totalCount`: 総件数
- `page`: 現在のページ
- `totalPages`: 総ページ数
- `facets`: ファセット情報
- `queryTime`: 検索実行時間
- `highlightedText`: ハイライトされたテキスト

### SearchIndex（検索インデックス）

検索インデックスの情報を管理するエンティティ。

**属性:**
- `id`: インデックス ID
- `contentType`: コンテンツタイプ
- `documentId`: ドキュメント ID
- `title`: タイトル
- `content`: コンテンツ
- `metadata`: メタデータ
- `lastIndexed`: 最終インデックス日時

### SearchHistory（検索履歴）

ユーザーの検索履歴を管理するエンティティ。

**属性:**
- `userId`: ユーザー ID
- `query`: 検索クエリ
- `timestamp`: 検索日時
- `resultCount`: 結果件数
- `clickedResults`: クリックされた結果

### AutoCompleteSuggestion（オートコンプリート候補）

オートコンプリートの候補を管理するエンティティ。

**属性:**
- `text`: 候補テキスト
- `type`: 候補タイプ（統計項目/地域/タグ等）
- `frequency`: 使用頻度
- `relevanceScore`: 関連性スコア

### SearchFacet（検索ファセット）

ファセット検索の情報を管理するエンティティ。

**属性:**
- `name`: ファセット名
- `values`: ファセット値のリスト
- `count`: 各値の件数
- `isSelected`: 選択状態

## 値オブジェクト

### SearchOperator（検索演算子）

検索演算子を表現する値オブジェクト。

- **具体例**: `AND`（論理積）, `OR`（論理和）, `NOT`（否定）, `"`（フレーズ検索）
- **制約**: 定義済みの4種類の演算子のみ
- **用途**: 複合検索クエリの構築、検索条件の論理演算、フレーズ検索の識別

### ContentType（コンテンツタイプ）

検索対象のコンテンツタイプを表現する値オブジェクト。

- **具体例**: `statistics`（統計データ）, `blog`（ブログ記事）, `category`（カテゴリ）, `tag`（タグ）
- **制約**: 定義済みの4種類のコンテンツタイプのみ
- **用途**: 検索範囲の指定、検索結果のフィルタリング、ファセット生成

### RelevanceScore（関連性スコア）

検索結果の関連性スコアを表現する値オブジェクト。

- **具体例**: `0.95`（非常に関連性が高い）, `0.75`（関連性が高い）, `0.50`（中程度の関連性）, `0.25`（関連性が低い）
- **制約**: 0から1の範囲の小数、0.8以上が高スコア、0.3以下が低スコア
- **用途**: 検索結果のランキング、結果の並び替え、関連性の可視化

## ドメインサービス

### SearchService

検索の基本操作を実装するドメインサービス。

- **責務**: 検索クエリの解析、インデックス検索、ランキング適用、ファセット生成、検索履歴保存
- **主要メソッド**:
  - `search(query)`: 検索の実行（クエリ解析→インデックス検索→ランキング→ファセット生成）
  - `parseQuery(queryString)`: 検索クエリの解析（AND/OR/NOT演算子、フレーズ検索）
  - `generateFacets(results, query)`: ファセットの生成（コンテンツタイプ、カテゴリ、タグ）
  - `saveSearchHistory(query, resultCount)`: 検索履歴の保存
- **使用例**: 全文検索、高度な検索、検索統計の収集

### AutoCompleteService

オートコンプリート機能を実装するドメインサービス。

- **責務**: オートコンプリート候補の取得、候補のランキング、関連性スコア計算
- **主要メソッド**:
  - `getSuggestions(query, limit)`: オートコンプリート候補の取得
  - `getHistorySuggestions(query, limit)`: 検索履歴からの候補取得
  - `getStatisticsSuggestions(query, limit)`: 統計項目からの候補取得
  - `rankSuggestions(suggestions, query)`: 候補のランキング（関連性スコア、使用頻度）
- **使用例**: 検索入力補助、検索履歴の活用、統計項目の発見

### SearchIndexService

検索インデックスの管理を実装するドメインサービス。

- **責務**: インデックスの作成・更新・削除、インデックス再構築、統計情報の取得
- **主要メソッド**:
  - `indexDocument(contentType, documentId, content)`: ドキュメントのインデックス化
  - `removeDocument(contentType, documentId)`: インデックスからの削除
  - `updateDocument(contentType, documentId, content)`: インデックスの更新
  - `rebuildIndex(contentType)`: インデックスの再構築
  - `getIndexStatistics()`: インデックス統計の取得
- **使用例**: コンテンツ追加時のインデックス化、インデックス管理、検索パフォーマンス監視

## リポジトリ

### SearchIndexRepository

検索インデックスの永続化を抽象化するリポジトリインターフェース。

- **責務**: 検索インデックスのCRUD操作、全文検索、統計情報の取得
- **主要メソッド**:
  - `search(query)`: 検索クエリによるインデックス検索
  - `findById(contentType, documentId)` / `findByContentType(contentType)`: インデックスの取得
  - `save(index)` / `delete(contentType, documentId)`: インデックスの保存・削除
  - `deleteAll(contentType)`: コンテンツタイプ別または全インデックスの削除
  - `getStatistics()`: インデックス統計の取得

### SearchHistoryRepository

検索履歴の永続化を抽象化するリポジトリインターフェース。

- **責務**: 検索履歴のCRUD操作、プレフィックス検索、古いエントリの削除
- **主要メソッド**:
  - `findByUserId(userId)`: ユーザー別検索履歴の取得
  - `findByQueryPrefix(query)`: クエリプレフィックスによる検索
  - `findRecent(userId, limit)`: 最近の検索履歴の取得
  - `save(history)` / `delete(userId, query)`: 履歴の保存・削除
  - `deleteOldEntries(days)`: 古い検索履歴の削除

## ディレクトリ構造

```
src/lib/search/
├── model/              # エンティティと値オブジェクト
│   ├── SearchQuery.ts
│   ├── SearchResult.ts
│   ├── SearchIndex.ts
│   ├── SearchHistory.ts
│   ├── AutoCompleteSuggestion.ts
│   ├── SearchFacet.ts
│   ├── SearchOperator.ts
│   ├── ContentType.ts
│   ├── RelevanceScore.ts
│   ├── QueryString.ts
│   └── SearchFilter.ts
├── service/            # ドメインサービス
│   ├── SearchService.ts
│   ├── AutoCompleteService.ts
│   ├── SearchIndexService.ts
│   ├── SearchRankingService.ts
│   ├── FacetService.ts
│   └── SpellCheckService.ts
├── repositories/       # リポジトリ
│   ├── SearchIndexRepository.ts
│   ├── SearchHistoryRepository.ts
│   └── SuggestionRepository.ts
├── builders/           # ビルダー
│   ├── SearchIndexBuilder.ts
│   └── QueryParser.ts
└── analyzers/          # アナライザー
    ├── TextAnalyzer.ts
    └── Tokenizer.ts
```

## ベストプラクティス

### 1. 検索パフォーマンス

- インデックスの最適化
- 検索結果のキャッシュ
- 非同期インデックス更新

### 2. 検索精度の向上

- 関連性スコアの最適化
- スペルチェック機能
- 同義語辞書の活用

### 3. ユーザビリティ

- オートコンプリートの高速化
- 検索履歴の活用
- ファセット検索の直感的なUI

### 4. スケーラビリティ

- 分散検索インデックス
- 検索負荷の分散
- インデックス更新の最適化

## 関連ドメイン

- **Analytics ドメイン**: 検索統計の分析
- **Taxonomy Management ドメイン**: カテゴリ・タグベースの検索
- **Content Management ドメイン**: ブログコンテンツの検索

---

**更新履歴**:

- 2025-01-20: 初版作成
