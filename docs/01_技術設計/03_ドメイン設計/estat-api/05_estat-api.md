# EstatAPI（e-Stat API 統合）ドメイン

## 概要

EstatAPI（e-Stat API 統合）ドメインは、stats47 プロジェクトの支援ドメインの一つで、e-Stat API との統合を担当します。e-Stat API（MetaInfo、StatsData、StatsList）との統合、API パラメータの管理とマッピング、データ取得・変換・正規化、e-Stat 特有のエラーハンドリングなど、e-Stat API との連携に関するすべての機能を提供します。

### ドメインの責務と目的

1. **統計データの取得と整形**: e-Stat API から統計データを取得し、構造化された形式に変換
2. **メタ情報の管理**: 統計表のメタ情報（カテゴリ、単位など）を取得・保存・検索
3. **統計リストの取得**: 利用可能な統計表の一覧を取得
4. **API パラメータの管理とマッピング**: e-Stat API 呼び出しのパラメータ管理
5. **データ取得・変換・正規化**: 生データの内部形式への変換
6. **e-Stat 特有のエラーハンドリングとリトライ**: レート制限管理とエラー処理

### ビジネス価値

- **e-Stat API 統合**: 政府統計データへの効率的なアクセス
- **データ品質保証**: e-Stat 特有のデータ検証と品質管理
- **パフォーマンス最適化**: API 呼び出しの最適化とキャッシュ連携
- **拡張性**: 新しい e-Stat API エンドポイントの追加が容易
- **統計データの可視化基盤**: ランキング、ダッシュボード、可視化のデータソース

## アーキテクチャ

### レイヤー構造

```
┌─────────────────────────────────────┐
│   Application Layer                 │
│   (API Routes, Handlers)            │
└───────────┬─────────────────────────┘
            │
┌───────────▼─────────────────────────┐
│   Service Layer                     │
│   - EstatStatsDataService           │
│   - EstatStatsListService           │
│   - EstatMetaInfoService            │
└───────────┬─────────────────────────┘
            │
┌───────────▼─────────────────────────┐
│   API Client Layer                  │
│   (@/services/estat-api)            │
└───────────┬─────────────────────────┘
            │
┌───────────▼─────────────────────────┐
│   e-Stat API                        │
│   (External Service)                │
└─────────────────────────────────────┘
```

### データフロー

#### 統計データ取得フロー

```
User Request
    │
    ▼
EstatStatsDataService.getAndFormatStatsData()
    │
    ├─► getStatsDataRaw()
    │       │
    │       ▼
    │   estatAPI.getStatsData()
    │       │
    │       ▼
    │   e-Stat API
    │       │
    │       ▼
    │   Raw Response
    │
    └─► formatStatsData()
            │
            ├─► formatAreas()
            ├─► formatCategories()
            ├─► formatYears()
            └─► formatValues()
                    │
                    ▼
            Formatted Data
```

#### メタ情報取得・保存フロー

```
User Request
    │
    ▼
EstatMetaInfoService.processAndSaveMetaInfo()
    │
    ├─► estatAPI.getMetaInfo()
    │       │
    │       ▼
    │   e-Stat API Response
    │
    ├─► transformToCSVFormat()
    │       │
    │       ▼
    │   Transformed Data
    │
    └─► saveTransformedData()
            │
            ├─► processBatch()
            │       │
            │       ▼
            │   D1 Database
            │
            └─► findRankingKey()
```

## モデル設計

### エンティティ

#### EstatMetaInfo（e-Stat メタ情報）

e-Stat API から取得したメタ情報を管理するエンティティ。

```typescript
interface EstatMetaInfo {
  /** 統計データID */
  statsDataId: string;
  /** 統計表のタイトル */
  title: string;
  /** 統計表の説明 */
  description: string;
  /** 調査年月日 */
  surveyDate: string;
  /** 公開日 */
  openDate: string;
  /** 小地域フラグ */
  smallArea: boolean;
  /** カテゴリ情報 */
  categories: CategoryInfo[];
  /** 最終更新日時 */
  lastUpdated: Date;
}
```

**属性:**

- `statsDataId`: 統計データ ID
- `title`: 統計表のタイトル
- `description`: 統計表の説明
- `surveyDate`: 調査年月日
- `openDate`: 公開日
- `smallArea`: 小地域フラグ
- `categories`: カテゴリ情報
- `lastUpdated`: 最終更新日時

#### EstatStatsData（e-Stat 統計データ）

e-Stat API から取得した統計データを管理するエンティティ。

```typescript
interface EstatStatsData {
  /** 統計データID */
  statsDataId: string;
  /** ランキングキー */
  rankingKey: string;
  /** 時間コード */
  timeCode: string;
  /** 地域コード */
  areaCode: string;
  /** 統計値 */
  value: number | null;
  /** 単位 */
  unit: string;
  /** 注釈 */
  annotation?: string;
  /** データソース */
  dataSource: string;
}
```

**属性:**

- `statsDataId`: 統計データ ID
- `rankingKey`: ランキングキー
- `timeCode`: 時間コード
- `areaCode`: 地域コード
- `value`: 統計値
- `unit`: 単位
- `annotation`: 注釈
- `dataSource`: データソース

#### EstatStatsList（e-Stat 統計リスト）

e-Stat API から取得した統計リストを管理するエンティティ。

```typescript
interface EstatStatsList {
  /** リストID */
  listId: string;
  /** リストタイトル */
  title: string;
  /** リスト説明 */
  description: string;
  /** 統計データのリスト */
  statistics: StatisticsItem[];
  /** 総件数 */
  totalCount: number;
  /** ページ情報 */
  pageInfo: PageInfo;
}
```

**属性:**

- `listId`: リスト ID
- `title`: リストタイトル
- `description`: リスト説明
- `statistics`: 統計データのリスト
- `totalCount`: 総件数
- `pageInfo`: ページ情報

## 値オブジェクト

### StatsDataId（統計データ ID）

e-Stat の統計データ ID を表現する値オブジェクト。

```typescript
class StatsDataId {
  constructor(private readonly value: string) {
    if (!value || !/^[0-9]{10}$/.test(value)) {
      throw new Error("Invalid stats data ID format");
    }
  }

  toString(): string {
    return this.value;
  }

  equals(other: StatsDataId): boolean {
    return this.value === other.value;
  }
}
```

- **具体例**: `0003000001`（人口・世帯）, `0003000002`（労働力調査）, `0003000003`（家計調査）
- **制約**: 10 桁の数字、e-Stat で定義された ID のみ有効
- **用途**: e-Stat API 呼び出し、データベースキー、統計データの一意識別

### ApiParameterType（API パラメータタイプ）

e-Stat API の種別を表現する値オブジェクト。

```typescript
type ApiParameterType = "getMetaInfo" | "getStatsData" | "getStatsList";

class ApiParameterType {
  constructor(private readonly value: ApiParameterType) {
    const validTypes = ["getMetaInfo", "getStatsData", "getStatsList"];
    if (!validTypes.includes(value)) {
      throw new Error("Invalid API parameter type");
    }
  }

  toString(): string {
    return this.value;
  }

  equals(other: ApiParameterType): boolean {
    return this.value === other.value;
  }
}
```

- **具体例**: `getMetaInfo`（メタ情報取得）, `getStatsData`（統計データ取得）, `getStatsList`（統計リスト取得）
- **制約**: 定義済みの 3 種類の API 種別のみ
- **用途**: API 呼び出しのルーティング、キャッシュキー生成、エラーハンドリング

### RankingKey（ランキングキー）

e-Stat のランキングキーを表現する値オブジェクト。

```typescript
class RankingKey {
  constructor(private readonly value: string) {
    if (!value || !/^[A-Z0-9]+$/.test(value)) {
      throw new Error("Invalid ranking key format");
    }
  }

  toString(): string {
    return this.value;
  }

  equals(other: RankingKey): boolean {
    return this.value === other.value;
  }
}
```

- **具体例**: `0003000001-001`（人口・世帯-基本人口）, `0003000002-001`（労働力調査-完全失業率）
- **制約**: 統計データ ID + ハイフン + 3 桁のサブ ID、e-Stat で定義された形式
- **用途**: 統計データの特定、ランキング計算、API 呼び出しパラメータ

## ドメインサービス

### EstatMetaInfoService

e-Stat メタ情報の取得と管理を実装するドメインサービス。

```typescript
export class EstatMetaInfoService {
  constructor(
    private readonly metaInfoRepository: EstatMetaInfoRepository,
    private readonly cacheService: CacheService
  ) {}

  async getMetaInfo(statsDataId: StatsDataId): Promise<EstatMetaInfo | null> {
    // キャッシュから取得を試行
    const cached = await this.cacheService.get(
      `meta:${statsDataId.toString()}`
    );
    if (cached) {
      return cached;
    }

    // データベースから取得
    const metaInfo = await this.metaInfoRepository.findByStatsDataId(
      statsDataId
    );
    if (metaInfo) {
      await this.cacheService.set(`meta:${statsDataId.toString()}`, metaInfo);
    }

    return metaInfo;
  }

  async getMetaInfoList(categoryId: string): Promise<EstatMetaInfo[]> {
    return await this.metaInfoRepository.findByCategoryId(categoryId);
  }

  async validateMetaInfo(metaInfo: EstatMetaInfo): Promise<boolean> {
    // メタ情報の妥当性検証ロジック
    return metaInfo.statsDataId && metaInfo.title && metaInfo.description;
  }
}
```

- **責務**: メタ情報の取得、キャッシュ連携、データ変換
- **主要メソッド**:
  - `getMetaInfo(statsDataId)`: 統計データ ID によるメタ情報取得
  - `getMetaInfoList(categoryId)`: カテゴリ別メタ情報一覧取得
  - `validateMetaInfo(metaInfo)`: メタ情報の妥当性検証
- **使用例**: 統計データの詳細表示、カテゴリ別統計一覧、データ品質チェック

### EstatStatsDataService

e-Stat 統計データの取得と管理を実装するドメインサービス。

```typescript
export class EstatStatsDataService {
  constructor(
    private readonly statsDataRepository: EstatStatsDataRepository,
    private readonly estatAPI: EstatAPI
  ) {}

  async getStatsData(params: EstatStatsDataParams): Promise<EstatStatsData[]> {
    // e-Stat APIから取得
    const rawData = await this.estatAPI.getStatsData(params);

    // データを正規化
    const normalizedData = this.normalizeStatsData(rawData);

    // データベースに保存
    await this.statsDataRepository.saveMany(normalizedData);

    return normalizedData;
  }

  async getStatsDataList(rankingKey: RankingKey): Promise<EstatStatsData[]> {
    return await this.statsDataRepository.findByRankingKey(rankingKey);
  }

  private normalizeStatsData(rawData: any[]): EstatStatsData[] {
    // 生データを内部形式に変換
    return rawData.map((item) => ({
      statsDataId: item.statsDataId,
      rankingKey: item.rankingKey,
      timeCode: item.timeCode,
      areaCode: item.areaCode,
      value: item.value,
      unit: item.unit,
      annotation: item.annotation,
      dataSource: "e-Stat API",
    }));
  }
}
```

- **責務**: 統計データの取得、パラメータ変換、データ正規化
- **主要メソッド**:
  - `getStatsData(params)`: パラメータによる統計データ取得
  - `getStatsDataList(rankingKey)`: ランキングキーによる統計データ一覧取得
  - `validateStatsData(statsData)`: 統計データの妥当性検証
- **使用例**: ランキング計算、地域別ダッシュボード、時系列データ生成

### EstatStatsListService

e-Stat 統計リストの取得と管理を実装するドメインサービス。

```typescript
export class EstatStatsListService {
  constructor(
    private readonly statsListRepository: EstatStatsListRepository,
    private readonly estatAPI: EstatAPI
  ) {}

  async getStatsList(params: EstatStatsListParams): Promise<EstatStatsList> {
    // e-Stat APIから取得
    const rawData = await this.estatAPI.getStatsList(params);

    // データを正規化
    const normalizedData = this.normalizeStatsList(rawData);

    return normalizedData;
  }

  async searchStatsList(query: string): Promise<EstatStatsList> {
    return await this.statsListRepository.search(query);
  }

  private normalizeStatsList(rawData: any): EstatStatsList {
    // 生データを内部形式に変換
    return {
      listId: rawData.listId,
      title: rawData.title,
      description: rawData.description,
      statistics: rawData.statistics,
      totalCount: rawData.totalCount,
      pageInfo: rawData.pageInfo,
    };
  }
}
```

- **責務**: 統計リストの取得、フィルタリング、ページング
- **主要メソッド**:
  - `getStatsList(params)`: パラメータによる統計リスト取得
  - `searchStatsList(query)`: 検索クエリによる統計リスト検索
  - `validateStatsList(statsList)`: 統計リストの妥当性検証
- **使用例**: 統計データの検索、カテゴリ別統計一覧、統計データの探索

### EstatApiParamsService

e-Stat API パラメータの管理を実装するドメインサービス。

```typescript
export class EstatApiParamsService {
  constructor(
    private readonly apiParamsRepository: ApiParamsRepository,
    private readonly cacheService: CacheService
  ) {}

  async createApiParameter(
    rankingKey: RankingKey,
    timeCode: string,
    areaCode: string
  ): Promise<ApiParameter> {
    const params = {
      rankingKey: rankingKey.toString(),
      timeCode,
      areaCode,
      params: {
        statsDataId: rankingKey.toString().split("-")[0],
        cdCat01: rankingKey.toString().split("-")[1],
      },
      apiType: "getStatsData" as ApiParameterType,
      lastUsed: new Date(),
    };

    // パラメータの妥当性検証
    await this.validateParameters(params);

    // データベースに保存
    await this.apiParamsRepository.save(params);

    return params;
  }

  async validateParameters(params: ApiParameter): Promise<boolean> {
    // パラメータの妥当性検証ロジック
    return params.rankingKey && params.timeCode && params.areaCode;
  }

  async generateCacheKey(params: ApiParameter): Promise<string> {
    return `estat:${params.apiType}:${params.rankingKey}:${params.timeCode}:${params.areaCode}`;
  }
}
```

- **責務**: パラメータの生成、変換、バリデーション、キャッシュキー生成
- **主要メソッド**:
  - `createApiParameter(rankingKey, timeCode, areaCode)`: API パラメータの生成
  - `validateParameters(params)`: パラメータの妥当性検証
  - `generateCacheKey(params)`: キャッシュキーの生成
- **使用例**: API 呼び出しの最適化、パラメータ検証、キャッシュ管理

## リポジトリ

### EstatMetaInfoRepository

e-Stat メタ情報の永続化を実装するリポジトリ。

```typescript
export interface EstatMetaInfoRepository {
  save(metaInfo: EstatMetaInfo): Promise<void>;
  findByStatsDataId(statsDataId: StatsDataId): Promise<EstatMetaInfo | null>;
  findByCategoryId(categoryId: string): Promise<EstatMetaInfo[]>;
  update(metaInfo: EstatMetaInfo): Promise<void>;
  delete(statsDataId: StatsDataId): Promise<void>;
}
```

- **責務**: メタ情報の保存、取得、更新、削除
- **主要メソッド**:
  - `save(metaInfo)`: メタ情報の保存
  - `findByStatsDataId(statsDataId)`: 統計データ ID によるメタ情報取得
  - `findByCategoryId(categoryId)`: カテゴリ別メタ情報一覧取得
  - `update(metaInfo)`: メタ情報の更新
  - `delete(statsDataId)`: メタ情報の削除
- **使用例**: データベース操作、キャッシュ連携、メタ情報永続化

### EstatStatsDataRepository

e-Stat 統計データの永続化を実装するリポジトリ。

```typescript
export interface EstatStatsDataRepository {
  saveMany(statsData: EstatStatsData[]): Promise<void>;
  findByRankingKey(rankingKey: RankingKey): Promise<EstatStatsData[]>;
  findByTimeCode(timeCode: string): Promise<EstatStatsData[]>;
  findByAreaCode(areaCode: string): Promise<EstatStatsData[]>;
  update(statsData: EstatStatsData): Promise<void>;
  delete(rankingKey: RankingKey): Promise<void>;
}
```

- **責務**: 統計データの保存、取得、更新、削除
- **主要メソッド**:
  - `saveMany(statsData)`: 統計データの一括保存
  - `findByRankingKey(rankingKey)`: ランキングキーによる統計データ取得
  - `findByTimeCode(timeCode)`: 時間コードによる統計データ取得
  - `findByAreaCode(areaCode)`: 地域コードによる統計データ取得
  - `update(statsData)`: 統計データの更新
  - `delete(rankingKey)`: 統計データの削除
- **使用例**: データベース操作、キャッシュ連携、統計データ永続化

### EstatStatsListRepository

e-Stat 統計リストの永続化を実装するリポジトリ。

```typescript
export interface EstatStatsListRepository {
  save(statsList: EstatStatsList): Promise<void>;
  findById(listId: string): Promise<EstatStatsList | null>;
  search(query: string): Promise<EstatStatsList>;
  findByCategoryId(categoryId: string): Promise<EstatStatsList[]>;
  update(statsList: EstatStatsList): Promise<void>;
  delete(listId: string): Promise<void>;
}
```

- **責務**: 統計リストの保存、取得、更新、削除
- **主要メソッド**:
  - `save(statsList)`: 統計リストの保存
  - `findById(listId)`: ID による統計リスト取得
  - `search(query)`: 検索クエリによる統計リスト検索
  - `findByCategoryId(categoryId)`: カテゴリ別統計リスト取得
  - `update(statsList)`: 統計リストの更新
  - `delete(listId)`: 統計リストの削除
- **使用例**: データベース操作、キャッシュ連携、統計リスト永続化

## 実装パターン

### API 統合パターン

#### 1. 統計データ取得パターン

```typescript
// 統計データ取得の典型的な流れ
export class EstatStatsDataService {
  async getAndFormatStatsData(
    params: EstatStatsDataParams
  ): Promise<FormattedStatsData> {
    // 1. 生データ取得
    const rawData = await this.getStatsDataRaw(params);

    // 2. データ変換
    const formattedData = this.formatStatsData(rawData);

    return formattedData;
  }

  private async getStatsDataRaw(
    params: EstatStatsDataParams
  ): Promise<EstatStatsDataResponse> {
    // e-Stat API呼び出し
    return await this.estatAPI.getStatsData(params);
  }

  private formatStatsData(rawData: EstatStatsDataResponse): FormattedStatsData {
    // データ変換ロジック
    return {
      areas: this.formatAreas(rawData.areas),
      categories: this.formatCategories(rawData.categories),
      years: this.formatYears(rawData.years),
      values: this.formatValues(rawData.values),
    };
  }
}
```

#### 2. メタ情報取得・保存パターン

```typescript
// メタ情報取得・保存の典型的な流れ
export class EstatMetaInfoService {
  async processAndSaveMetaInfo(statsDataId: string): Promise<void> {
    // 1. メタ情報取得
    const metaInfo = await this.estatAPI.getMetaInfo(statsDataId);

    // 2. データ変換
    const transformedData = this.transformToCSVFormat(metaInfo);

    // 3. データ保存
    await this.saveTransformedData(transformedData);
  }

  private transformToCSVFormat(
    metaInfo: EstatMetaInfoResponse
  ): TransformedData {
    // CSV形式への変換ロジック
    return {
      areas: this.transformAreas(metaInfo.areas),
      categories: this.transformCategories(metaInfo.categories),
      years: this.transformYears(metaInfo.years),
    };
  }

  private async saveTransformedData(data: TransformedData): Promise<void> {
    // バッチ処理でデータ保存
    await this.processBatch(data.areas, "areas");
    await this.processBatch(data.categories, "categories");
    await this.processBatch(data.years, "years");
  }
}
```

### エラーハンドリングパターン

#### 1. API 呼び出しエラー

```typescript
export class EstatAPIErrorHandler {
  async handleApiError(error: Error, context: string): Promise<never> {
    if (error instanceof EstatAPIError) {
      // e-Stat API固有のエラー処理
      switch (error.code) {
        case "RATE_LIMIT_EXCEEDED":
          await this.handleRateLimitError(error);
          break;
        case "INVALID_PARAMETER":
          await this.handleInvalidParameterError(error);
          break;
        default:
          await this.handleGenericError(error, context);
      }
    } else {
      // 一般的なエラー処理
      await this.handleGenericError(error, context);
    }
  }

  private async handleRateLimitError(error: EstatAPIError): Promise<void> {
    // レート制限エラーの処理
    const retryAfter = error.retryAfter || 60;
    await this.sleep(retryAfter * 1000);
    throw new Error(`Rate limit exceeded. Retry after ${retryAfter} seconds.`);
  }
}
```

#### 2. データ変換エラー

```typescript
export class EstatDataTransformer {
  transformStatsData(rawData: any): EstatStatsData[] {
    try {
      return rawData.map((item) => this.transformItem(item));
    } catch (error) {
      throw new EstatDataTransformError(
        `Failed to transform stats data: ${error.message}`,
        { rawData, error }
      );
    }
  }

  private transformItem(item: any): EstatStatsData {
    // データ変換ロジック
    return {
      statsDataId: this.validateStatsDataId(item.statsDataId),
      rankingKey: this.validateRankingKey(item.rankingKey),
      timeCode: this.validateTimeCode(item.timeCode),
      areaCode: this.validateAreaCode(item.areaCode),
      value: this.validateValue(item.value),
      unit: this.validateUnit(item.unit),
      annotation: item.annotation,
      dataSource: "e-Stat API",
    };
  }
}
```

### キャッシュパターン

#### 1. メタ情報キャッシュ

```typescript
export class EstatMetaInfoCache {
  constructor(
    private readonly cacheService: CacheService,
    private readonly ttl: number = 3600 // 1時間
  ) {}

  async get(statsDataId: string): Promise<EstatMetaInfo | null> {
    const key = `meta:${statsDataId}`;
    const cached = await this.cacheService.get(key);

    if (cached) {
      return cached;
    }

    return null;
  }

  async set(statsDataId: string, metaInfo: EstatMetaInfo): Promise<void> {
    const key = `meta:${statsDataId}`;
    await this.cacheService.set(key, metaInfo, this.ttl);
  }

  async invalidate(statsDataId: string): Promise<void> {
    const key = `meta:${statsDataId}`;
    await this.cacheService.delete(key);
  }
}
```

#### 2. 統計データキャッシュ

```typescript
export class EstatStatsDataCache {
  constructor(
    private readonly cacheService: CacheService,
    private readonly ttl: number = 1800 // 30分
  ) {}

  async get(
    rankingKey: string,
    timeCode: string,
    areaCode: string
  ): Promise<EstatStatsData[] | null> {
    const key = `stats:${rankingKey}:${timeCode}:${areaCode}`;
    const cached = await this.cacheService.get(key);

    if (cached) {
      return cached;
    }

    return null;
  }

  async set(
    rankingKey: string,
    timeCode: string,
    areaCode: string,
    data: EstatStatsData[]
  ): Promise<void> {
    const key = `stats:${rankingKey}:${timeCode}:${areaCode}`;
    await this.cacheService.set(key, data, this.ttl);
  }
}
```

## ディレクトリ構造

```
src/infrastructure/estat-api/
├── model/              # エンティティと値オブジェクト
│   ├── EstatMetaInfo.ts
│   ├── EstatStatsData.ts
│   ├── EstatStatsList.ts
│   ├── ApiParameter.ts
│   ├── StatsDataId.ts
│   ├── ApiParameterType.ts
│   └── RankingKey.ts
├── service/            # ドメインサービス
│   ├── EstatMetaInfoService.ts
│   ├── EstatStatsDataService.ts
│   ├── EstatStatsListService.ts
│   └── EstatApiParamsService.ts
├── adapters/           # アダプター
│   ├── EstatRankingAdapter.ts
│   └── EstatMetaInfoAdapter.ts
└── repositories/       # リポジトリ
    ├── EstatMetaInfoRepository.ts
    ├── EstatStatsDataRepository.ts
    └── EstatStatsListRepository.ts
```

## ベストプラクティス

### 1. API 呼び出し最適化

- **レート制限の実装**: e-Stat API の制限（1 秒間に 10 リクエスト）を遵守
- **パラメータの効率的な管理**: 共通パラメータの再利用とバリデーション
- **エラーハンドリングとリトライロジック**: 指数バックオフによる再試行
- **並列処理の活用**: 複数の API 呼び出しを並列実行してパフォーマンス向上

### 2. データ品質管理

- **e-Stat 特有のデータ検証ルール**: 統計データ ID、地域コード、時間コードの妥当性検証
- **異常値の検出と処理**: 統計値の範囲チェックと異常値のフラグ付け
- **データ変換の一貫性保証**: 統一されたデータ変換ロジックの適用
- **データソースの追跡**: データの出典と取得日時の記録

### 3. パフォーマンス最適化

- **キャッシュとの連携**: メタ情報は 1 時間、統計データは 30 分のキャッシュ
- **並列 API 呼び出しの活用**: 複数の統計データを同時取得
- **レスポンス時間の監視**: API 呼び出し時間の計測とアラート
- **データベース最適化**: 適切なインデックスの設定とクエリ最適化

### 4. 拡張性

- **新しい API エンドポイントの追加**: インターフェースベースの設計で拡張性を確保
- **パラメータ形式の変更への対応**: 設定ファイルによる柔軟なパラメータ管理
- **エラーハンドリングの改善**: エラーコードベースの処理で保守性向上
- **モック環境の提供**: 開発・テスト環境での e-Stat API 代替機能

## 関連ドメイン

- **Ranking ドメイン**: 取得した統計データの分析とランキング生成
- **TimeSeries ドメイン**: 時系列データの分析とトレンド抽出
- **Comparison ドメイン**: 地域間比較と相関分析
- **Area ドメイン**: 地域コードの管理と地域情報の提供
- **Taxonomy ドメイン**: 統計データの分類とカテゴリ管理
- **Cache ドメイン**: API 呼び出し結果のキャッシュ管理
- **DataIntegration ドメイン**: データの統合と変換処理

---

**更新履歴**:

- 2025-01-20: 初版作成
- 2025-01-20: ドメイン設計の統合・整理（04\_開発ガイドから移行）

# e-Stat API テストガイド

## 概要

e-Stat API ドメインのテスト戦略、統合テスト、テストデータ管理について包括的に説明します。単体テスト、統合テスト、E2Eテスト、テストデータの作成・管理方法まで網羅しています。

## 目次

1. [テスト戦略](#テスト戦略)
2. [単体テスト](#単体テスト)
3. [統合テスト](#統合テスト)
4. [テストデータ管理](#テストデータ管理)
5. [モック・スタブ](#モックスタブ)
6. [テスト実行](#テスト実行)

---

# 第1章: テスト戦略

## テストピラミッド

```
        /\
       /E2E\          少数
      /------\
     /統合テスト\       中程度
    /----------\
   /  単体テスト  \     多数
  /--------------\
```

### 単体テスト (70%)

- 個別の関数・クラスのテスト
- 高速で実行可能
- モックを活用

### 統合テスト (20%)

- 複数のモジュール間の連携テスト
- 実際のAPIとの通信
- データベースアクセス

### E2Eテスト (10%)

- ユーザーの操作フロー全体をテスト
- 実環境に近い状態でのテスト

## テストの原則

### 1. FIRST原則

- **Fast** (高速): テストは高速に実行されるべき
- **Independent** (独立): テスト間に依存関係を持たない
- **Repeatable** (再現可能): いつでも同じ結果を返す
- **Self-validating** (自己検証): 成功/失敗が明確
- **Timely** (適時): コードと同時にテストを書く

### 2. AAA パターン

```typescript
test("should calculate total correctly", () => {
  // Arrange: テスト準備
  const data = [10, 20, 30];

  // Act: 実行
  const result = calculateTotal(data);

  // Assert: 検証
  expect(result).toBe(60);
});
```

---

# 第2章: 単体テスト

## サービスクラスのテスト

### EstatStatsDataService のテスト

```typescript
import { describe, it, expect, beforeEach, vi } from "vitest";
import { EstatStatsDataService } from "@/features/estat-api/stats-data";

describe("EstatStatsDataService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getAndFormatStatsData", () => {
    it("正常にデータを取得・整形できる", async () => {
      // Arrange
      const mockResponse = createMockStatsDataResponse();
      vi.spyOn(estatAPI, "getStatsData").mockResolvedValue(mockResponse);

      // Act
      const result = await EstatStatsDataService.getAndFormatStatsData(
        "0000010101"
      );

      // Assert
      expect(result.values).toHaveLength(1);
      expect(result.areas).toHaveLength(1);
      expect(result.categories).toHaveLength(1);
      expect(result.years).toHaveLength(1);
    });

    it("APIエラー時に適切なエラーをスローする", async () => {
      // Arrange
      vi.spyOn(estatAPI, "getStatsData").mockRejectedValue(
        new Error("API Error")
      );

      // Act & Assert
      await expect(
        EstatStatsDataService.getAndFormatStatsData("0000010101")
      ).rejects.toThrow("データ取得に失敗しました");
    });

    it("無効なstatsDataIdでエラーをスローする", async () => {
      // Act & Assert
      await expect(
        EstatStatsDataService.getAndFormatStatsData("invalid-id")
      ).rejects.toThrow("無効な統計表IDです");
    });
  });

  describe("getPrefectureDataByYear", () => {
    it("都道府県データのみを返す", async () => {
      // Arrange
      const mockData = createMockPrefectureData();
      vi.spyOn(
        EstatStatsDataService,
        "getAndFormatStatsData"
      ).mockResolvedValue(mockData);

      // Act
      const result = await EstatStatsDataService.getPrefectureDataByYear(
        "0000010101",
        "A1101",
        "2020"
      );

      // Assert
      expect(result.every((item) => item.areaCode.length === 5)).toBe(true);
      expect(result.every((item) => item.areaCode !== "00000")).toBe(true);
    });
  });
});
```

## フォーマッター関数のテスト

```typescript
import { EstatMetaInfoFormatter } from "@/features/estat-api/meta-info";

describe("EstatMetaInfoFormatter", () => {
  describe("parseCompleteMetaInfo", () => {
    it("メタ情報を正しくパースできる", () => {
      // Arrange
      const rawMetaInfo = createMockMetaInfoResponse();

      // Act
      const result = EstatMetaInfoFormatter.parseCompleteMetaInfo(rawMetaInfo);

      // Assert
      expect(result.categories).toHaveLength(3);
      expect(result.areas).toHaveLength(47);
      expect(result.years).toHaveLength(10);
    });

    it("空のメタ情報でエラーをスローする", () => {
      // Arrange
      const emptyMetaInfo = {};

      // Act & Assert
      expect(() =>
        EstatMetaInfoFormatter.parseCompleteMetaInfo(emptyMetaInfo)
      ).toThrow("メタ情報が空です");
    });
  });
});
```

## ユーティリティ関数のテスト

```typescript
describe("Utility Functions", () => {
  describe("validateStatsDataId", () => {
    it.each([
      ["0000010101", true],
      ["0003109687", true],
      ["invalid", false],
      ["123", false],
      ["00000101011", false],
    ])("validateStatsDataId('%s') should return %s", (id, expected) => {
      expect(validateStatsDataId(id)).toBe(expected);
    });
  });

  describe("formatNumber", () => {
    it("数値を正しくフォーマットする", () => {
      expect(formatNumber(1000000)).toBe("1,000,000");
      expect(formatNumber(0)).toBe("0");
      expect(formatNumber(null)).toBe("-");
    });
  });
});
```

---

# 第3章: 統合テスト

## API統合テスト

```typescript
import { describe, it, expect } from "vitest";

describe("Estat API Integration", () => {
  // 実際のAPIを使用するテスト（スキップ可能）
  it.skip("実際のAPIからデータを取得できる", async () => {
    const result = await EstatStatsDataService.getAndFormatStatsData(
      "0000010101"
    );

    expect(result).toBeDefined();
    expect(result.values).toBeInstanceOf(Array);
    expect(result.values.length).toBeGreaterThan(0);
  });

  // モックAPIを使用するテスト
  it("モックAPIとの統合が正常に動作する", async () => {
    // Mock Server起動
    const server = setupMockServer();

    try {
      const result = await EstatStatsDataService.getAndFormatStatsData(
        "0000010101"
      );

      expect(result.values).toHaveLength(47);
      expect(result.areas).toHaveLength(48);
    } finally {
      server.close();
    }
  });
});
```

## Next.js API Routes のテスト

```typescript
import { GET } from "@/app/api/stats/data/route";
import { NextRequest } from "next/server";

describe("API Route: /api/stats/data", () => {
  it("正常にデータを返す", async () => {
    // Arrange
    const request = new NextRequest(
      "http://localhost/api/stats/data?statsDataId=0000010101"
    );

    // Act
    const response = await GET(request);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toBeDefined();
  });

  it("無効なパラメータでエラーを返す", async () => {
    // Arrange
    const request = new NextRequest(
      "http://localhost/api/stats/data?statsDataId=invalid"
    );

    // Act
    const response = await GET(request);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe("VALIDATION_ERROR");
  });
});
```

## データベース統合テスト

```typescript
import { EstatMetaInfoService } from "@/features/estat-api/meta-info";

describe("Database Integration", () => {
  let db: D1Database;
  let service: EstatMetaInfoService;

  beforeAll(async () => {
    db = await setupTestDatabase();
    service = new EstatMetaInfoService(db);
  });

  afterAll(async () => {
    await teardownTestDatabase(db);
  });

  it("メタ情報を保存・取得できる", async () => {
    // Arrange
    const statsDataId = "0000010101";

    // Act: 保存
    await service.processAndSaveMetaInfo(statsDataId);

    // Assert: 取得
    const result = await service.getSavedMetadataByStatsId(statsDataId);
    expect(result.length).toBeGreaterThan(0);
  });

  it("検索が正常に動作する", async () => {
    // Act
    const result = await service.searchMetaInfo("人口", {
      searchType: "full",
      limit: 10,
    });

    // Assert
    expect(result.entries.length).toBeGreaterThan(0);
    expect(result.entries[0].stat_name).toContain("人口");
  });
});
```

---

# 第4章: テストデータ管理

## モックデータの作成

### ファイル構成

```
tests/
├── fixtures/
│   ├── stats-data.ts          # 統計データのモック
│   ├── meta-info.ts           # メタ情報のモック
│   ├── stats-list.ts          # 統計リストのモック
│   └── index.ts               # エクスポート
├── helpers/
│   ├── mock-server.ts         # Mock Server設定
│   └── test-utils.ts          # テストユーティリティ
└── setup.ts                   # テスト初期化
```

### モックデータの例

`tests/fixtures/stats-data.ts`

```typescript
export const MOCK_STATS_DATA_RESPONSE = {
  GET_STATS_DATA: {
    RESULT: {
      STATUS: 0,
      ERROR_MSG: "",
      DATE: "2024-01-01",
    },
    STATISTICAL_DATA: {
      TABLE_INF: {
        "@id": "0000010101",
        STAT_NAME: { $: "人口推計" },
        TITLE: { $: "都道府県別人口" },
        GOV_ORG: { $: "総務省" },
        STATISTICS_NAME: { $: "国勢調査" },
      },
      CLASS_INF: [
        {
          "@id": "cat01",
          "@name": "分類項目",
          CLASS: [
            { "@code": "A1101", "@name": "総人口", "@unit": "人" },
            { "@code": "A1301", "@name": "男性人口", "@unit": "人" },
            { "@code": "A1401", "@name": "女性人口", "@unit": "人" },
          ],
        },
        {
          "@id": "area",
          "@name": "地域",
          CLASS: [
            { "@code": "00000", "@name": "全国", "@level": "1" },
            { "@code": "13000", "@name": "東京都", "@level": "2" },
          ],
        },
        {
          "@id": "time",
          "@name": "時間軸",
          CLASS: [
            { "@code": "2020", "@name": "2020年" },
            { "@code": "2021", "@name": "2021年" },
          ],
        },
      ],
      DATA_INF: {
        VALUE: [
          {
            $: "13921000",
            "@cat01": "A1101",
            "@area": "13000",
            "@time": "2020",
          },
          {
            $: "7082000",
            "@cat01": "A1301",
            "@area": "13000",
            "@time": "2020",
          },
        ],
      },
    },
  },
};

export function createMockStatsDataResponse() {
  return JSON.parse(JSON.stringify(MOCK_STATS_DATA_RESPONSE));
}
```

## テストヘルパー関数

`tests/helpers/test-utils.ts`

```typescript
export function createMockPrefectureData(): FormattedStatsData {
  return {
    tableInfo: {
      id: "0000010101",
      title: "都道府県別人口",
      statName: "国勢調査",
      govOrg: "総務省",
      statisticsName: "人口推計",
      totalNumber: 47,
      fromNumber: 1,
      toNumber: 47,
    },
    areas: Array.from({ length: 47 }, (_, i) => ({
      areaCode: `${(i + 1).toString().padStart(2, "0")}000`,
      areaName: `都道府県${i + 1}`,
      level: "2",
    })),
    categories: [
      {
        categoryCode: "A1101",
        categoryName: "総人口",
        displayName: "総人口",
        unit: "人",
      },
    ],
    years: [{ timeCode: "2020", timeName: "2020年" }],
    values: Array.from({ length: 47 }, (_, i) => ({
      value: Math.floor(Math.random() * 10000000),
      unit: "人",
      areaCode: `${(i + 1).toString().padStart(2, "0")}000`,
      areaName: `都道府県${i + 1}`,
      categoryCode: "A1101",
      categoryName: "総人口",
      timeCode: "2020",
      timeName: "2020年",
    })),
    metadata: {
      processedAt: new Date().toISOString(),
      totalRecords: 47,
      validValues: 47,
      nullValues: 0,
    },
  };
}

export async function setupTestDatabase(): Promise<D1Database> {
  // テスト用データベースのセットアップ
  // 実装は環境に依存
  return {} as D1Database;
}

export async function teardownTestDatabase(db: D1Database): Promise<void> {
  // テスト用データベースのクリーンアップ
}
```

## Mock Server の設定

`tests/helpers/mock-server.ts`

```typescript
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";

export function setupMockServer() {
  const handlers = [
    http.get(
      "https://api.e-stat.go.jp/rest/3.0/app/json/getStatsData",
      () => {
        return HttpResponse.json(MOCK_STATS_DATA_RESPONSE);
      }
    ),
    http.get(
      "https://api.e-stat.go.jp/rest/3.0/app/json/getMetaInfo",
      () => {
        return HttpResponse.json(MOCK_META_INFO_RESPONSE);
      }
    ),
  ];

  const server = setupServer(...handlers);
  server.listen();

  return server;
}
```

---

# 第5章: モック・スタブ

## Vitest でのモック

```typescript
import { vi } from "vitest";

describe("EstatStatsDataService with mocks", () => {
  it("API呼び出しをモックする", async () => {
    // APIをモック
    const mockGetStatsData = vi.fn().mockResolvedValue(MOCK_RESPONSE);
    vi.spyOn(estatAPI, "getStatsData").mockImplementation(mockGetStatsData);

    // テスト実行
    await EstatStatsDataService.getAndFormatStatsData("0000010101");

    // モックが呼ばれたことを検証
    expect(mockGetStatsData).toHaveBeenCalledWith({
      appId: expect.any(String),
      statsDataId: "0000010101",
    });
  });
});
```

## 部分的なモック

```typescript
vi.mock("@/infrastructure/estat", async () => {
  const actual = await vi.importActual("@/infrastructure/estat");
  return {
    ...actual,
    // 特定の関数のみモック
    getApiKey: vi.fn(() => "mock-api-key"),
  };
});
```

---

# 第6章: テスト実行

## テスト設定

`vitest.config.ts`

```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./tests/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["src/**/*.ts"],
      exclude: [
        "src/**/*.test.ts",
        "src/**/*.spec.ts",
        "src/**/types/**",
      ],
    },
  },
});
```

## テストスクリプト

`package.json`

```json
{
  "scripts": {
    "test": "vitest",
    "test:unit": "vitest run --testPathPattern=unit",
    "test:integration": "vitest run --testPathPattern=integration",
    "test:coverage": "vitest run --coverage",
    "test:watch": "vitest watch"
  }
}
```

## CI/CD での実行

`.github/workflows/test.yml`

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "20"
      - run: npm install
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v3
```

## 関連ドキュメント

- [ベストプラクティス](06_ベストプラクティス.md)
- [API統合ガイド](03_API統合ガイド.md)
- [エラーハンドリング](05_エラーハンドリング.md)
