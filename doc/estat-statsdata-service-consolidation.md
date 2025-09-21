# e-STAT統計データサービス統合計画

## 概要

現在 `src/lib/estat/statsdata/` 内に分散している3つのクラス（`EstatDataFetcher`、`EstatDataFormatter`、`EstatCSVTransformer`）を、機能別に2つのサービスクラスに再編成する計画です：

- `EstatStatsDataService`: 統計データ取得・整形・変換
- `EstatStatsListService`: 統計データリスト取得・整形

## 現在の構造分析

### 既存クラスの責務

#### 1. EstatDataFetcher
- **責務**: e-STAT APIからのデータ取得
- **メソッド**:
  - `getStatsList()`: 統計データリスト取得 → **EstatStatsListService** に移行
  - `getStatsData()`: 統計データ取得 → **EstatStatsDataService** に移行
- **依存関係**: `estatAPI` サービスを使用

#### 2. EstatDataFormatter
- **責務**: APIレスポンスの整形・変換
- **メソッド**:
  - `formatStatsList()`: 統計データリスト整形 → **EstatStatsListService** に移行
  - `formatStatsData()`: 統計データ整形 → **EstatStatsDataService** に移行
  - プライベートメソッド: 地域、カテゴリ、年、値の個別整形 → **EstatStatsDataService** に移行
- **依存関係**: なし（純粋な変換処理）

#### 3. EstatCSVTransformer
- **責務**: メタデータのCSV形式変換
- **メソッド**:
  - `transformToCSVFormat()`: CSV形式変換 → **EstatStatsDataService** に移行
  - プライベートメソッド: アイテム名抽出 → **EstatStatsDataService** に移行
- **依存関係**: なし（純粋な変換処理）

### 現在の使用箇所

1. **UI コンポーネント**: 現在は主にAPIエンドポイント経由で間接的に使用
2. **テストファイル**: `EstatDataFormatter` のユニットテスト
3. **APIエンドポイント**: バックエンドAPIでの利用

## 統合設計

### 新しいサービスクラス構造

#### 1. EstatStatsDataService クラス構造

```typescript
export class EstatStatsDataService {
  // === データ取得メソッド ===
  static async getStatsData(statsDataId, options): Promise<FormattedEstatData>
  static async getStatsDataRaw(statsDataId, options): Promise<EstatStatsDataResponse>

  // === データ変換メソッド ===
  static formatStatsData(response): FormattedEstatData
  static transformToCSVFormat(metaInfo, statsDataId): EstatMetaCategoryData[]

  // === 統合ワークフローメソッド ===
  static async getAndFormatStatsData(statsDataId, options): Promise<FormattedEstatData>
  static async getMetaInfoAsCSV(statsDataId): Promise<EstatMetaCategoryData[]>

  // === プライベートヘルパーメソッド ===
  private static formatAreas(data): FormattedArea[]
  private static formatCategories(data): FormattedCategory[]
  private static formatYears(data): FormattedYear[]
  private static formatValues(data, areas, categories, years): FormattedValue[]
  private static cleanString(str): string
  private static parseNumericValue(value): number | null
  private static formatDisplayValue(numericValue, originalValue, unit): string
  private static extractItemName(fullName, code): string
}
```

#### 2. EstatStatsListService クラス構造

```typescript
export class EstatStatsListService {
  // === データ取得メソッド ===
  static async getStatsList(options): Promise<FormattedStatListItem[]>
  static async getStatsListRaw(options): Promise<EstatStatsListResponse>

  // === データ変換メソッド ===
  static formatStatsList(response): FormattedStatListItem[]

  // === 統合ワークフローメソッド ===
  static async getAndFormatStatsList(options): Promise<FormattedStatListItem[]>

  // === プライベートヘルパーメソッド ===
  private static cleanString(str): string
}
```

## 統合の利点

### 1. 機能別の責務分離
- **EstatStatsDataService**: 統計データの詳細な取得・整形・変換に特化
- **EstatStatsListService**: 統計データリストの取得・整形に特化
- 各サービスが明確な責務を持ち、理解しやすい

### 2. コードの簡素化
- 3つのクラスが機能別に2つのサービスに整理
- 関連する機能が適切に集約される
- インポート文がより意味的に明確

### 3. 一貫性の向上
- 各サービス内で統一されたエラーハンドリング
- 共通のロギング戦略
- 一貫したパフォーマンス最適化

### 4. 使いやすさの向上
- ワークフローメソッドにより、「取得→整形」が一回の呼び出しで完了
- 開発者にとって直感的なAPI
- 用途に応じてサービスを選択可能

### 5. メンテナンス性の向上
- 機能別のテスト
- サービス別の統一されたドキュメント
- 依存関係の管理が簡単
- 将来的な拡張が容易

## 実装計画

### Phase 1: 新サービスクラスの作成
1. `EstatStatsDataService.ts` を新規作成（統計データ関連）
2. `EstatStatsListService.ts` を新規作成（統計データリスト関連）
3. 既存の3クラスのメソッドを適切なサービスに分散配置
4. 新しいワークフローメソッドを追加

### Phase 2: テストの移行と拡張
1. 既存のテストを新サービスクラス用に移行・分割
2. 新しいワークフローメソッドのテスト追加
3. 各サービスの統合テストの作成

### Phase 3: 使用箇所の更新
1. `index.ts` の更新
2. APIエンドポイントでの使用箇所更新
3. コンポーネントでの間接的な使用箇所確認

### Phase 4: 旧ファイルの削除
1. 旧クラスファイルの削除
2. 未使用インポートのクリーンアップ
3. ドキュメントの更新

## 後方互換性の考慮

### 段階的移行戦略
```typescript
// 過渡期における後方互換性の維持
export class EstatDataFetcher {
  static async getStatsList(options) {
    return EstatStatsListService.getStatsList(options);
  }

  static async getStatsData(statsDataId, options) {
    return EstatStatsDataService.getStatsDataRaw(statsDataId, options);
  }
}

export class EstatDataFormatter {
  static formatStatsList(response) {
    return EstatStatsListService.formatStatsList(response);
  }

  static formatStatsData(response) {
    return EstatStatsDataService.formatStatsData(response);
  }
}

export class EstatCSVTransformer {
  static transformToCSVFormat(metaInfo, statsDataId) {
    return EstatStatsDataService.transformToCSVFormat(metaInfo, statsDataId);
  }
}
```

### 移行完了後
```typescript
// 新しい機能別インターフェース
export { EstatStatsDataService } from './EstatStatsDataService';
export { EstatStatsListService } from './EstatStatsListService';

// 後方互換性（廃止予定）
export {
  EstatStatsDataService as EstatCSVTransformer
} from './EstatStatsDataService';

// 混合互換性エクスポート（廃止予定）
export class EstatDataFetcher {
  static getStatsList = EstatStatsListService.getStatsList;
  static getStatsData = EstatStatsDataService.getStatsData;
}

export class EstatDataFormatter {
  static formatStatsList = EstatStatsListService.formatStatsList;
  static formatStatsData = EstatStatsDataService.formatStatsData;
}
```

## 新しい使用例

### Before（現在）
```typescript
import { EstatDataFetcher, EstatDataFormatter } from '@/lib/estat/statsdata';

// 統計データリスト取得
const rawList = await EstatDataFetcher.getStatsList(options);
const formattedList = EstatDataFormatter.formatStatsList(rawList);

// 統計データ取得
const rawData = await EstatDataFetcher.getStatsData(statsDataId);
const formattedData = EstatDataFormatter.formatStatsData(rawData);
```

### After（統合後）
```typescript
import { EstatStatsListService, EstatStatsDataService } from '@/lib/estat/statsdata';

// 統計データリスト：ワンステップで取得・整形
const formattedList = await EstatStatsListService.getAndFormatStatsList(options);

// 統計データ：ワンステップで取得・整形
const formattedData = await EstatStatsDataService.getAndFormatStatsData(statsDataId);

// または個別に実行
const rawList = await EstatStatsListService.getStatsListRaw(options);
const formattedList = EstatStatsListService.formatStatsList(rawList);

const rawData = await EstatStatsDataService.getStatsDataRaw(statsDataId);
const formattedData = EstatStatsDataService.formatStatsData(rawData);
```

## リスク評価と対策

### リスク
1. **大規模なコードベース変更**: 多くのファイルが影響を受ける可能性
2. **テストカバレッジの一時的な低下**: 移行中のテスト不整合
3. **デバッグの複雑化**: 統合により問題の特定が困難になる可能性

### 対策
1. **段階的移行**: 後方互換性を維持しながら段階的に移行
2. **包括的なテスト**: 移行前後でのテスト結果比較
3. **詳細なドキュメント**: 変更点の明確な記録

## 結論

この機能別サービス統合により、e-STAT統計データ関連の機能がより使いやすく、保守しやすくなります：

### 主要な改善点
1. **明確な責務分離**: `EstatStatsListService`（リスト取得）と`EstatStatsDataService`（詳細データ取得・変換）
2. **直感的なAPI**: 機能別にサービスを選択でき、ワンステップでの処理も可能
3. **段階的移行**: 後方互換性を維持しながらリスクを最小限に抑制
4. **将来的な拡張性**: 各サービスが独立しており、新機能追加が容易

段階的なアプローチにより、既存コードへの影響を最小限に抑えながら、コードベースの品質向上と開発者体験の改善を実現できます。