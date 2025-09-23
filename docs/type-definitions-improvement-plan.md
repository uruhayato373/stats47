# 型定義管理の改善策

## 現状の問題点

### 1. 型定義の重複
- `PrefectureRankingParams`が3つのファイルで重複定義されている
  - `/src/components/estat/prefecture-ranking/EstatPrefectureRankingDisplay/types.ts`
  - `/src/components/estat/prefecture-ranking/EstatPrefectureRankingFetcher/types.ts`
  - `/src/components/estat/prefecture-ranking/VisualizationSettingsPanel/types.ts`

### 2. 型定義の散在
- コンポーネント固有の型がコンポーネントディレクトリ内に分散している
- 共通で利用される型と固有の型の区別が曖昧
- ビジネスロジック関連の型がlibディレクトリとcomponentsディレクトリに混在

### 3. 型定義のネームスペース管理不足
- 関連する型がグループ化されていない
- インポート時の一貫性がない

## 推奨する型定義管理構成

### 1. ディレクトリ構造の再編成

```
src/
├── types/                           # 型定義
│   ├── index.ts                    # 全型定義のエクスポート
│   ├── common/                     # 共通型定義
│   │   ├── index.ts
│   │   ├── api.ts                  # API関連共通型
│   │   ├── ui.ts                   # UI関連共通型
│   │   └── data.ts                 # データ構造共通型
│   ├── estat/                      # e-Stat関連型
│   │   ├── index.ts
│   │   ├── api.ts                 # API型
│   │   ├── entities.ts            # エンティティ型
│   │   └── responses.ts           # レスポンス型
│   ├── ranking/                   # ランキング関連型
│   │   ├── index.ts
│   │   ├── params.ts              # パラメータ型
│   │   ├── settings.ts            # 設定型
│   │   └── visualization.ts       # 可視化型
│   ├── geography/                 # 地理・地図関連型
│   │   ├── index.ts
│   │   ├── topojson.ts
│   │   └── prefecture.ts
│   └── external/                  # 外部ライブラリ関連型
│       ├── index.ts
│       └── d3.ts
```

### 2. 型定義の分類基準

#### 共通型 (`src/types/common/`)
- アプリケーション全体で使用される汎用的な型
- API関連、UI関連、データ構造の基本型

#### 機能別型 (`src/types/*/`)
- 特定の機能領域に特化した型（estat、ranking、geography等）
- その機能領域内での再利用性が高い型

#### 外部ライブラリ型 (`src/types/external/`)
- 外部ライブラリの型拡張
- サードパーティライブラリの型定義補完

#### コンポーネント固有型 (`src/components/*/types.ts`)
- そのコンポーネントでのみ使用される型
- Props、State、内部データ構造など

### 3. 命名規則の統一

#### インターフェース命名
```typescript
// ✅ 良い例
export interface EstatApiResponse { }
export interface PrefectureRankingParams { }
export interface VisualizationSettings { }

// ❌ 悪い例
export interface EstatResponse { }  // 曖昧
export interface params { }         // 小文字開始
```

#### 型エイリアス命名
```typescript
// ✅ 良い例
export type SortDirection = 'asc' | 'desc';
export type ColorScheme = 'interpolateBlues' | 'interpolateReds';

// ❌ 悪い例
export type Direction = 'asc' | 'desc';  // 曖昧
```

#### 列挙型命名
```typescript
// ✅ 良い例
export enum ApiStatus {
  LOADING = 'loading',
  SUCCESS = 'success',
  ERROR = 'error'
}
```

### 4. インポート/エクスポート戦略

#### バレルエクスポート活用
```typescript
// src/types/ranking/index.ts
export * from './params';
export * from './settings';
export * from './visualization';

// src/types/index.ts
export * from './common';
export * as Ranking from './ranking';
export * as Estat from './estat';
export * as Geography from './geography';
export * from './external';
```

#### 使用側でのインポート
```typescript
// ✅ 推奨: 名前空間付きインポート
import { Ranking, Estat } from '@/types';

// ✅ 個別インポート（型が少ない場合）
import { PrefectureRankingParams, VisualizationSettings } from '@/types/ranking';

// ❌ 避ける: 相対パスでの深いインポート
import { PrefectureRankingParams } from '../../../types/ranking/params';
```

### 5. 具体的な改善アクション

#### Phase 1: 重複型の統合
1. `PrefectureRankingParams`を`src/types/ranking/params.ts`に統合
2. 各コンポーネントから重複定義を削除
3. インポートパスを更新

#### Phase 2: 型定義の再配置
1. `src/lib/estat/types/`の内容を`src/types/estat/`に移動
2. 共通型を`src/types/common/`に抽出
3. バレルエクスポートの設定

#### Phase 3: 型定義の体系化
1. 型定義のドキュメント化
2. 型のバリデーション関数の追加
3. 型テストの実装

### 6. 型定義のベストプラクティス

#### 型の拡張可能性
```typescript
// ✅ 基底型と拡張型の分離
export interface BaseApiResponse {
  success: boolean;
  message?: string;
}

export interface EstatApiResponse extends BaseApiResponse {
  data: EstatData;
}
```

#### ジェネリクス活用
```typescript
// ✅ 再利用可能な型定義
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

export type EstatStatsResponse = ApiResponse<EstatStatsData>;
export type MetaInfoResponse = ApiResponse<MetaInfo>;
```

#### ユニオン型とリテラル型
```typescript
// ✅ 型安全性の向上
export type Theme = 'light' | 'dark' | 'auto';
export type ChartType = 'bar' | 'line' | 'pie' | 'map';
```

### 7. 導入効果

#### 開発効率の向上
- 型定義の重複作業削減
- インポートパスの一貫性
- 型の発見可能性向上

#### 保守性の向上
- 型変更の影響範囲の明確化
- 型定義の一元管理
- ドキュメント化の促進

#### 品質向上
- 型の一貫性確保
- TypeScriptの型チェック効果最大化
- リファクタリング時の安全性向上

### 8. 移行計画

#### Week 1: 重複型の統合
- `PrefectureRankingParams`の統合
- 基本的なバレルエクスポート設定

#### Week 2-3: 型定義の再配置
- `src/types/domains/`の構築
- 既存の型定義の移行

#### Week 4: ドキュメント化とテスト
- 型定義ドキュメントの作成
- 型テストの実装

### 9. 注意事項

- 型定義の変更は段階的に実施
- 既存のインポートパスは一度に変更せず、段階的に移行
- チーム内での命名規則の合意形成が重要
- ビルド時間への影響を監視

この改善策により、型定義の保守性、再利用性、発見可能性が大幅に向上し、開発チーム全体の生産性向上が期待できます。