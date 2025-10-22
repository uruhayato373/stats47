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

```typescript
export class SearchOperator {
  private constructor(private readonly value: string) {}

  static readonly AND = new SearchOperator("AND");
  static readonly OR = new SearchOperator("OR");
  static readonly NOT = new SearchOperator("NOT");
  static readonly PHRASE = new SearchOperator('"');

  static create(value: string): Result<SearchOperator> {
    const validOperators = ["AND", "OR", "NOT", '"'];
    if (!validOperators.includes(value)) {
      return Result.fail(`Invalid search operator: ${value}`);
    }
    return Result.ok(new SearchOperator(value));
  }

  getValue(): string {
    return this.value;
  }

  isLogicalOperator(): boolean {
    return ["AND", "OR", "NOT"].includes(this.value);
  }

  isPhraseOperator(): boolean {
    return this.value === '"';
  }
}
```

### ContentType（コンテンツタイプ）

検索対象のコンテンツタイプを表現する値オブジェクト。

```typescript
export class ContentType {
  private constructor(private readonly value: string) {}

  static readonly STATISTICS = new ContentType("statistics");
  static readonly BLOG = new ContentType("blog");
  static readonly CATEGORY = new ContentType("category");
  static readonly TAG = new ContentType("tag");

  static create(value: string): Result<ContentType> {
    const validTypes = ["statistics", "blog", "category", "tag"];
    if (!validTypes.includes(value)) {
      return Result.fail(`Invalid content type: ${value}`);
    }
    return Result.ok(new ContentType(value));
  }

  getValue(): string {
    return this.value;
  }

  isStatistics(): boolean {
    return this.value === "statistics";
  }

  isBlog(): boolean {
    return this.value === "blog";
  }
}
```

### RelevanceScore（関連性スコア）

検索結果の関連性スコアを表現する値オブジェクト。

```typescript
export class RelevanceScore {
  private constructor(private readonly value: number) {}

  static create(value: number): Result<RelevanceScore> {
    if (value < 0 || value > 1) {
      return Result.fail("Relevance score must be between 0 and 1");
    }
    return Result.ok(new RelevanceScore(value));
  }

  getValue(): number {
    return this.value;
  }

  getPercentage(): number {
    return Math.round(this.value * 100);
  }

  isHigh(): boolean {
    return this.value >= 0.8;
  }

  isLow(): boolean {
    return this.value <= 0.3;
  }

  compare(other: RelevanceScore): number {
    return this.value - other.value;
  }
}
```

## ドメインサービス

### SearchService

検索の基本操作を実装するドメインサービス。

```typescript
export class SearchService {
  constructor(
    private readonly searchIndexRepository: SearchIndexRepository,
    private readonly searchHistoryRepository: SearchHistoryRepository,
    private readonly rankingService: SearchRankingService
  ) {}

  async search(query: SearchQuery): Promise<SearchResult> {
    const startTime = Date.now();

    // 検索クエリの解析
    const parsedQuery = this.parseQuery(query.getQuery());
    
    // インデックスから検索
    const rawResults = await this.searchIndexRepository.search(parsedQuery);
    
    // ランキング適用
    const rankedResults = await this.rankingService.rankResults(
      rawResults,
      query
    );

    // ファセット生成
    const facets = await this.generateFacets(rawResults, query);

    // 検索履歴保存
    await this.saveSearchHistory(query, rankedResults.length);

    const queryTime = Date.now() - startTime;

    return SearchResult.create({
      results: rankedResults,
      totalCount: rawResults.length,
      page: query.getPage(),
      totalPages: Math.ceil(rawResults.length / query.getLimit()),
      facets,
      queryTime,
    }).getValue();
  }

  private parseQuery(queryString: string): ParsedQuery {
    // 検索クエリの解析ロジック
    // AND/OR/NOT演算子、フレーズ検索等を処理
    // 実装省略
  }

  private async generateFacets(
    results: SearchIndex[],
    query: SearchQuery
  ): Promise<SearchFacet[]> {
    const facets: SearchFacet[] = [];

    // コンテンツタイプファセット
    const contentTypeFacet = this.createContentTypeFacet(results);
    facets.push(contentTypeFacet);

    // カテゴリファセット
    const categoryFacet = this.createCategoryFacet(results);
    facets.push(categoryFacet);

    // タグファセット
    const tagFacet = this.createTagFacet(results);
    facets.push(tagFacet);

    return facets;
  }

  private async saveSearchHistory(
    query: SearchQuery,
    resultCount: number
  ): Promise<void> {
    const history = SearchHistory.create({
      userId: query.getUserId(),
      query: query.getQuery(),
      timestamp: new Date(),
      resultCount,
      clickedResults: [],
    }).getValue();

    await this.searchHistoryRepository.save(history);
  }
}
```

### AutoCompleteService

オートコンプリート機能を実装するドメインサービス。

```typescript
export class AutoCompleteService {
  constructor(
    private readonly suggestionRepository: SuggestionRepository,
    private readonly searchHistoryRepository: SearchHistoryRepository
  ) {}

  async getSuggestions(
    query: string,
    limit: number = 10
  ): Promise<AutoCompleteSuggestion[]> {
    if (query.length < 2) {
      return [];
    }

    // 検索履歴から候補を取得
    const historySuggestions = await this.getHistorySuggestions(query, limit);
    
    // 統計項目から候補を取得
    const statisticsSuggestions = await this.getStatisticsSuggestions(query, limit);
    
    // 地域名から候補を取得
    const areaSuggestions = await this.getAreaSuggestions(query, limit);
    
    // タグから候補を取得
    const tagSuggestions = await this.getTagSuggestions(query, limit);

    // 候補を統合してランキング
    const allSuggestions = [
      ...historySuggestions,
      ...statisticsSuggestions,
      ...areaSuggestions,
      ...tagSuggestions,
    ];

    return this.rankSuggestions(allSuggestions, query).slice(0, limit);
  }

  private async getHistorySuggestions(
    query: string,
    limit: number
  ): Promise<AutoCompleteSuggestion[]> {
    const histories = await this.searchHistoryRepository.findByQueryPrefix(query);
    
    return histories.map(history => 
      AutoCompleteSuggestion.create({
        text: history.getQuery(),
        type: "history",
        frequency: 1,
        relevanceScore: RelevanceScore.create(0.9).getValue(),
      }).getValue()
    );
  }

  private async getStatisticsSuggestions(
    query: string,
    limit: number
  ): Promise<AutoCompleteSuggestion[]> {
    const statistics = await this.suggestionRepository.findStatisticsByQuery(query);
    
    return statistics.map(stat => 
      AutoCompleteSuggestion.create({
        text: stat.getName(),
        type: "statistics",
        frequency: stat.getUsageCount(),
        relevanceScore: this.calculateRelevanceScore(stat.getName(), query),
      }).getValue()
    );
  }

  private calculateRelevanceScore(text: string, query: string): RelevanceScore {
    const similarity = this.calculateSimilarity(text.toLowerCase(), query.toLowerCase());
    return RelevanceScore.create(similarity).getValue();
  }

  private calculateSimilarity(text: string, query: string): number {
    // 類似度計算（例：レーベンシュタイン距離ベース）
    // 実装省略
    return 0.8;
  }

  private rankSuggestions(
    suggestions: AutoCompleteSuggestion[],
    query: string
  ): AutoCompleteSuggestion[] {
    return suggestions.sort((a, b) => {
      // 関連性スコアでソート
      const scoreA = a.getRelevanceScore().getValue();
      const scoreB = b.getRelevanceScore().getValue();
      
      if (scoreA !== scoreB) {
        return scoreB - scoreA;
      }
      
      // 使用頻度でソート
      return b.getFrequency() - a.getFrequency();
    });
  }
}
```

### SearchIndexService

検索インデックスの管理を実装するドメインサービス。

```typescript
export class SearchIndexService {
  constructor(
    private readonly searchIndexRepository: SearchIndexRepository,
    private readonly indexBuilder: SearchIndexBuilder
  ) {}

  async indexDocument(
    contentType: ContentType,
    documentId: string,
    content: any
  ): Promise<Result<void>> {
    try {
      // ドキュメントをインデックス形式に変換
      const indexDocument = await this.indexBuilder.buildIndex(
        contentType,
        documentId,
        content
      );

      // インデックスに保存
      await this.searchIndexRepository.save(indexDocument);
      
      return Result.ok();
    } catch (error) {
      return Result.fail(`Failed to index document: ${error.message}`);
    }
  }

  async removeDocument(contentType: ContentType, documentId: string): Promise<void> {
    await this.searchIndexRepository.delete(contentType, documentId);
  }

  async updateDocument(
    contentType: ContentType,
    documentId: string,
    content: any
  ): Promise<Result<void>> {
    // 既存のインデックスを削除
    await this.removeDocument(contentType, documentId);
    
    // 新しいインデックスを作成
    return await this.indexDocument(contentType, documentId, content);
  }

  async rebuildIndex(contentType?: ContentType): Promise<void> {
    if (contentType) {
      await this.searchIndexRepository.deleteAll(contentType);
      await this.indexBuilder.rebuildIndex(contentType);
    } else {
      // 全インデックスを再構築
      await this.searchIndexRepository.deleteAll();
      await this.indexBuilder.rebuildAllIndexes();
    }
  }

  async getIndexStatistics(): Promise<IndexStatistics> {
    const stats = await this.searchIndexRepository.getStatistics();
    return IndexStatistics.create(stats).getValue();
  }
}
```

## リポジトリ

### SearchIndexRepository

検索インデックスの永続化を抽象化するリポジトリインターフェース。

```typescript
export interface SearchIndexRepository {
  search(query: ParsedQuery): Promise<SearchIndex[]>;
  findById(contentType: ContentType, documentId: string): Promise<SearchIndex | null>;
  findByContentType(contentType: ContentType): Promise<SearchIndex[]>;
  save(index: SearchIndex): Promise<void>;
  delete(contentType: ContentType, documentId: string): Promise<void>;
  deleteAll(contentType?: ContentType): Promise<void>;
  getStatistics(): Promise<IndexStatistics>;
  exists(contentType: ContentType, documentId: string): Promise<boolean>;
}
```

### SearchHistoryRepository

検索履歴の永続化を抽象化するリポジトリインターフェース。

```typescript
export interface SearchHistoryRepository {
  findByUserId(userId: string): Promise<SearchHistory[]>;
  findByQueryPrefix(query: string): Promise<SearchHistory[]>;
  findRecent(userId: string, limit: number): Promise<SearchHistory[]>;
  save(history: SearchHistory): Promise<void>;
  delete(userId: string, query: string): Promise<void>;
  deleteOldEntries(days: number): Promise<void>;
}
```

## ディレクトリ構造

```
src/lib/search/
├── entities/
│   ├── SearchQuery.ts
│   ├── SearchResult.ts
│   ├── SearchIndex.ts
│   ├── SearchHistory.ts
│   ├── AutoCompleteSuggestion.ts
│   └── SearchFacet.ts
├── value-objects/
│   ├── SearchOperator.ts
│   ├── ContentType.ts
│   ├── RelevanceScore.ts
│   ├── QueryString.ts
│   └── SearchFilter.ts
├── services/
│   ├── SearchService.ts
│   ├── AutoCompleteService.ts
│   ├── SearchIndexService.ts
│   ├── SearchRankingService.ts
│   ├── FacetService.ts
│   └── SpellCheckService.ts
├── repositories/
│   ├── SearchIndexRepository.ts
│   ├── SearchHistoryRepository.ts
│   └── SuggestionRepository.ts
├── builders/
│   ├── SearchIndexBuilder.ts
│   └── QueryParser.ts
├── analyzers/
│   ├── TextAnalyzer.ts
│   └── Tokenizer.ts
└── specifications/
    ├── SearchSpecification.ts
    └── RelevanceSpecification.ts
```

## DDDパターン実装例

### エンティティ実装例

```typescript
// src/lib/search/entities/SearchQuery.ts
export class SearchQuery {
  private constructor(
    private readonly query: string,
    private readonly filters: Map<string, any>,
    private readonly operators: SearchOperator[],
    private readonly contentTypes: ContentType[],
    private readonly sortBy: string,
    private readonly page: number,
    private readonly limit: number,
    private readonly userId?: string
  ) {}

  static create(props: {
    query: string;
    filters?: Map<string, any>;
    operators?: SearchOperator[];
    contentTypes?: ContentType[];
    sortBy?: string;
    page?: number;
    limit?: number;
    userId?: string;
  }): Result<SearchQuery> {
    if (!props.query || props.query.trim().length === 0) {
      return Result.fail("Search query cannot be empty");
    }
    if (props.page && props.page < 1) {
      return Result.fail("Page must be greater than 0");
    }
    if (props.limit && (props.limit < 1 || props.limit > 100)) {
      return Result.fail("Limit must be between 1 and 100");
    }

    return Result.ok(
      new SearchQuery(
        props.query,
        props.filters || new Map(),
        props.operators || [],
        props.contentTypes || [ContentType.STATISTICS, ContentType.BLOG],
        props.sortBy || "relevance",
        props.page || 1,
        props.limit || 20,
        props.userId
      )
    );
  }

  getQuery(): string {
    return this.query;
  }

  getFilters(): ReadonlyMap<string, any> {
    return this.filters;
  }

  getOperators(): ReadonlyArray<SearchOperator> {
    return this.operators;
  }

  getContentTypes(): ReadonlyArray<ContentType> {
    return this.contentTypes;
  }

  getSortBy(): string {
    return this.sortBy;
  }

  getPage(): number {
    return this.page;
  }

  getLimit(): number {
    return this.limit;
  }

  getUserId(): string | undefined {
    return this.userId;
  }

  hasFilter(key: string): boolean {
    return this.filters.has(key);
  }

  getFilterValue(key: string): any {
    return this.filters.get(key);
  }

  isPhraseSearch(): boolean {
    return this.query.startsWith('"') && this.query.endsWith('"');
  }

  getCleanQuery(): string {
    if (this.isPhraseSearch()) {
      return this.query.slice(1, -1);
    }
    return this.query;
  }
}
```

### 仕様実装例

```typescript
// src/lib/search/specifications/SearchSpecification.ts
export class SearchSpecification {
  static isComplexQuery(query: SearchQuery): boolean {
    return query.getOperators().length > 0 || query.getFilters().size > 0;
  }

  static hasMultipleContentTypes(query: SearchQuery): boolean {
    return query.getContentTypes().length > 1;
  }

  static isPhraseSearch(query: SearchQuery): boolean {
    return query.isPhraseSearch();
  }

  static isRecentSearch(history: SearchHistory, hours: number = 24): boolean {
    const now = new Date();
    const searchTime = history.getTimestamp();
    const diffHours = (now.getTime() - searchTime.getTime()) / (1000 * 60 * 60);
    return diffHours <= hours;
  }

  static isPopularQuery(history: SearchHistory[], minCount: number = 5): boolean {
    const queryCount = history.length;
    return queryCount >= minCount;
  }
}
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
