# TypeScript 型定義管理戦略

## 目次

1. [現状分析](#現状分析)
2. [問題点の整理](#問題点の整理)
3. [型定義管理の基本原則](#型定義管理の基本原則)
4. [推奨ディレクトリ構造](#推奨ディレクトリ構造)
5. [命名規則とベストプラクティス](#命名規則とベストプラクティス)
6. [型定義の分類と配置ルール](#型定義の分類と配置ルール)
7. [具体的な実装例](#具体的な実装例)
8. [マイグレーション計画](#マイグレーション計画)
9. [型定義のメンテナンス](#型定義のメンテナンス)
10. [よくある問題と解決策](#よくある問題と解決策)

---

## 現状分析

### プロジェクトの型定義の現状

**統計データ（2025 年 10 月時点）：**

```
📊 型定義の分布状況
├─ 型定義ファイル数: 37ファイル
├─ 型定義の総数: 104個 (export interface/type)
├─ types.tsファイル: 8個
├─ typesディレクトリ: 2個
└─ コンポーネント内型定義: 多数
```

### 型定義の配置場所

1. **グローバル型定義ディレクトリ**

   - `/src/types/` - プロジェクト全体で使用される型
   - `/src/types/index.ts` - 型定義の集約エクスポート

2. **ドメイン固有の型定義**

   - `/src/lib/estat/types/` - e-Stat API 関連の型（14 ファイル）
   - `/src/lib/auth/` - 認証関連の型
   - `/src/lib/ranking/` - ランキング関連の型

3. **コンポーネント固有の型定義**

   - `/src/components/ranking/RankingClient/types.ts`
   - `/src/components/estat/ranking-settings/*/types.ts`
   - `/src/components/common/*/index.ts`（インライン型定義）

4. **宣言ファイル**
   - `/src/types/next-auth.d.ts` - Next-Auth の型拡張

### 型定義の例

```typescript
// グローバル型定義
src/types/
├── index.ts          // 集約エクスポート
├── choropleth.ts     // コロプレス地図関連の型
├── prefecture.ts     // 都道府県関連の型
├── subcategory.ts    // サブカテゴリ関連の型
├── topojson.ts       // TopoJSON 関連の型
└── next-auth.d.ts    // Next-Auth 型拡張

// ドメイン固有の型定義
src/lib/estat/types/
├── index.ts              // 集約エクスポート
├── raw-response.ts       // API Raw Response
├── meta-response.ts      // API Meta Response
├── list-response.ts      // API List Response
├── catalog-response.ts   // API Catalog Response
├── parameters.ts         // API Parameters
├── processed.ts          // Processed Data
├── formatted.ts          // Formatted Data
├── errors.ts             // Error Types
└── metainfo.ts          // MetaInfo Types

// コンポーネント固有の型定義
src/components/ranking/RankingClient/types.ts
src/components/estat/ranking-settings/Display/types.ts
```

---

## 問題点の整理

### 1. 型定義の場所が分散している

**問題：**

- グローバル型、ドメイン型、コンポーネント型が混在
- どこに型定義を配置すべきか不明確
- 同じような型が複数の場所に重複して定義されている可能性

**影響：**

- 型定義の検索に時間がかかる
- 型の再利用が困難
- メンテナンスコストが高い

### 2. 命名規則の不統一

**問題：**

- `types.ts` と `types/index.ts` が混在
- インターフェース名の命名パターンが統一されていない
- Props の型定義の命名に一貫性がない

**例：**

```typescript
// 統一されていない命名
RankingClientProps; // コンポーネント名 + Props
DisplayProps; // シンプルで分かりやすい
DataTableProps; // 一貫性はあるが...
```

### 3. 型のスコープが不明確

**問題：**

- どの型がグローバルで、どの型がローカルなのか不明確
- ファイル名から型の用途が分かりにくい
- 型定義の依存関係が複雑

### 4. ドキュメンテーション不足

**問題：**

- 型定義にコメントが少ない
- 型の用途や使用例が不明確
- JSDoc コメントが統一されていない

### 5. 型定義のエクスポート方法が統一されていない

**問題：**

- 名前付きエクスポート、デフォルトエクスポート、re-export が混在
- `index.ts` からの re-export が不完全
- 型のインポートパスが長くなりがち

**例：**

```typescript
// 長いインポートパス
import { RankingData } from "@/components/ranking/RankingClient/types";
import { EstatMetaInfo } from "@/lib/estat/types/metainfo";

// 理想的には...
import { RankingData, EstatMetaInfo } from "@/types";
```

---

## 型定義管理の基本原則

### 原則 1: 単一責任の原則（SRP）

**定義：**

- 1 つの型定義ファイルは 1 つの関心事のみを扱う
- ファイル名から型の用途が明確に分かる

**例：**

```typescript
// Good: 関心事が明確
types/
├── api/
│   ├── request.ts    // API リクエスト型のみ
│   └── response.ts   // API レスポンス型のみ
└── models/
    ├── user.ts       // ユーザーモデルのみ
    └── post.ts       // 投稿モデルのみ

// Bad: 関心事が混在
types/
└── common.ts         // あらゆる型が詰め込まれている
```

### 原則 2: DRY（Don't Repeat Yourself）

**定義：**

- 同じ型定義を複数の場所に書かない
- 共通の型は適切な場所で定義し、再利用する

**例：**

```typescript
// Bad: 型の重複
// components/A/types.ts
export interface User {
  id: string;
  name: string;
}

// components/B/types.ts
export interface User {
  id: string;
  name: string;
}

// Good: 型の共有
// types/models/user.ts
export interface User {
  id: string;
  name: string;
}

// components/A/ComponentA.tsx
import { User } from "@/types/models";
```

### 原則 3: 関心の分離（Separation of Concerns）

**定義：**

- グローバル型、ドメイン型、コンポーネント型を明確に分離
- 型のスコープを適切に設定

**レイヤー構造：**

```
Layer 1: Global Types (プロジェクト全体で使用)
  ↓
Layer 2: Domain Types (特定のドメインで使用)
  ↓
Layer 3: Component Types (特定のコンポーネントで使用)
```

### 原則 4: 明示的な依存関係

**定義：**

- 型の依存関係を明示的にする
- 循環参照を避ける
- インポートパスは短く、分かりやすく

**例：**

```typescript
// Good: 明示的な依存関係
// types/models/user.ts
export interface User {
  id: string;
  name: string;
}

// types/api/user-api.ts
import { User } from "@/types/models/user";

export interface UserApiResponse {
  user: User;
  timestamp: string;
}

// Bad: 循環参照
// types/a.ts
import { TypeB } from "./b";
export interface TypeA {
  b: TypeB;
}

// types/b.ts
import { TypeA } from "./a";
export interface TypeB {
  a: TypeA;
}
```

### 原則 5: ドキュメント化

**定義：**

- すべての型定義に JSDoc コメントを追加
- 型の用途、使用例、注意点を明記

**例：**

````typescript
/**
 * ユーザー情報を表す型
 *
 * @remarks
 * この型は認証後のユーザー情報を表します。
 * OAuth プロバイダーの情報も含まれます。
 *
 * @example
 * ```typescript
 * const user: User = {
 *   id: '123',
 *   name: 'John Doe',
 *   email: 'john@example.com',
 *   role: 'admin',
 * };
 * ```
 */
export interface User {
  /** ユーザーの一意識別子（UUID） */
  id: string;

  /** ユーザーの表示名 */
  name: string;

  /** メールアドレス（一意） */
  email: string;

  /** ユーザーの役割（admin または user） */
  role: "admin" | "user";

  /** プロフィール画像のURL（オプション） */
  image?: string;
}
````

---

## 推奨ディレクトリ構造

### 新しい型定義のディレクトリ構造

```
src/
├── types/                          # グローバル型定義（プロジェクト全体で使用）
│   ├── index.ts                    # すべての型定義の集約エクスポート
│   │
│   ├── common/                     # 共通型定義
│   │   ├── index.ts
│   │   ├── primitives.ts           # プリミティブ型のエイリアス
│   │   ├── utility.ts              # ユーティリティ型
│   │   └── pagination.ts           # ページネーション関連
│   │
│   ├── models/                     # ドメインモデル
│   │   ├── index.ts
│   │   ├── user.ts                 # ユーザーモデル
│   │   ├── prefecture.ts           # 都道府県モデル
│   │   ├── subcategory.ts          # サブカテゴリモデル
│   │   └── ranking.ts              # ランキングモデル
│   │
│   ├── api/                        # API 関連の型
│   │   ├── index.ts
│   │   ├── request.ts              # リクエスト型
│   │   ├── response.ts             # レスポンス型
│   │   ├── error.ts                # エラー型
│   │   └── auth.ts                 # 認証 API 型
│   │
│   ├── components/                 # 共通コンポーネントの Props 型
│   │   ├── index.ts
│   │   ├── layout.ts               # レイアウトコンポーネント
│   │   ├── form.ts                 # フォームコンポーネント
│   │   └── data-display.ts         # データ表示コンポーネント
│   │
│   ├── visualization/              # 可視化関連の型
│   │   ├── index.ts
│   │   ├── choropleth.ts           # コロプレス地図
│   │   ├── chart.ts                # チャート
│   │   └── map.ts                  # 地図
│   │
│   ├── database/                   # データベース関連の型
│   │   ├── index.ts
│   │   ├── schema.ts               # DB スキーマ
│   │   └── query.ts                # クエリ型
│   │
│   └── external/                   # 外部ライブラリの型拡張
│       ├── index.ts
│       ├── next-auth.d.ts          # Next-Auth 型拡張
│       ├── d3.d.ts                 # D3.js 型拡張
│       └── topojson.d.ts           # TopoJSON 型拡張
│
├── domains/                        # ドメイン層（ビジネスロジック）
│   ├── estat/                      # e-Stat ドメイン
│   │   ├── types/                  # e-Stat 固有の型
│   │   │   ├── index.ts
│   │   │   ├── raw-response.ts     # Raw API Response
│   │   │   ├── meta-response.ts    # Meta Response
│   │   │   ├── list-response.ts    # List Response
│   │   │   ├── catalog-response.ts # Catalog Response
│   │   │   ├── parameters.ts       # API Parameters
│   │   │   ├── processed.ts        # Processed Data
│   │   │   ├── formatted.ts        # Formatted Data
│   │   │   └── metainfo.ts         # MetaInfo
│   │   └── services/               # e-Stat サービス
│   │
│   ├── ranking/                    # ランキングドメイン
│   │   ├── types/                  # ランキング固有の型
│   │   │   ├── index.ts
│   │   │   ├── ranking-item.ts     # ランキング項目
│   │   │   ├── visualization.ts    # 可視化設定
│   │   │   └── navigation.ts       # ナビゲーション
│   │   └── services/               # ランキングサービス
│   │
│   └── auth/                       # 認証ドメイン
│       ├── types/                  # 認証固有の型
│       │   ├── index.ts
│       │   ├── session.ts          # セッション
│       │   ├── jwt.ts              # JWT
│       │   └── oauth.ts            # OAuth
│       └── services/               # 認証サービス
│
└── components/                     # コンポーネント層
    ├── common/                     # 共通コンポーネント
    │   ├── Button/
    │   │   ├── Button.tsx
    │   │   ├── Button.types.ts     # コンポーネント固有の型
    │   │   └── index.ts
    │   │
    │   └── DataTable/
    │       ├── DataTable.tsx
    │       ├── DataTable.types.ts
    │       └── index.ts
    │
    ├── ranking/                    # ランキングコンポーネント
    │   ├── RankingClient/
    │   │   ├── RankingClient.tsx
    │   │   ├── RankingClient.types.ts
    │   │   └── index.ts
    │   │
    │   └── RankingNavigation/
    │       ├── RankingNavigation.tsx
    │       ├── RankingNavigation.types.ts
    │       └── index.ts
    │
    └── estat/                      # e-Stat コンポーネント
        └── ranking-settings/
            └── Display/
                ├── Display.tsx
                ├── Display.types.ts
                └── index.ts
```

### ディレクトリの役割と責務

#### 1. `/src/types/` - グローバル型定義

**役割：**

- プロジェクト全体で使用される共通の型定義
- 複数のドメインやコンポーネントで共有される型

**配置すべき型：**

- ドメインモデル（User, Prefecture, Ranking など）
- 共通の API 型（Request, Response, Error）
- 共通のコンポーネント Props 型
- ユーティリティ型

**配置すべきでない型：**

- 特定のドメインにのみ使用される型
- 特定のコンポーネントにのみ使用される型

#### 2. `/src/domains/*/types/` - ドメイン固有の型定義

**役割：**

- 特定のドメインに関連する型定義
- ドメインロジックに密接に関連する型

**配置すべき型：**

- ドメイン固有の API レスポンス型
- ドメイン固有のパラメータ型
- ドメイン固有のビジネスロジック型

**例：**

- e-Stat ドメイン: API レスポンス、パラメータ、処理済みデータ
- ランキングドメイン: ランキング項目、可視化設定
- 認証ドメイン: セッション、JWT、OAuth

#### 3. `/src/components/*/types.ts` - コンポーネント固有の型定義

**役割：**

- 特定のコンポーネントでのみ使用される型定義
- コンポーネントの Props、State、内部型

**配置すべき型：**

- コンポーネントの Props 型
- コンポーネントの内部 State 型
- コンポーネント固有のイベントハンドラー型

**命名規則：**

```typescript
// コンポーネント名 + .types.ts
RankingClient.types.ts;
DataTable.types.ts;
Display.types.ts;
```

---

## 命名規則とベストプラクティス

### 1. ファイル命名規則

#### グローバル型定義ファイル

```
types/
├── models/
│   ├── user.ts              # 単数形、小文字、ハイフン区切り
│   ├── prefecture.ts
│   └── ranking-item.ts      # 複数単語はハイフン区切り
│
├── api/
│   ├── request.ts
│   ├── response.ts
│   └── auth-api.ts
│
└── components/
    ├── layout.ts
    └── data-display.ts
```

#### ドメイン型定義ファイル

```
domains/estat/types/
├── raw-response.ts          # 用途が明確な名前
├── meta-response.ts
├── list-response.ts
└── parameters.ts
```

#### コンポーネント型定義ファイル

```
components/ranking/RankingClient/
├── RankingClient.tsx
├── RankingClient.types.ts   # コンポーネント名 + .types.ts
└── index.ts

components/common/DataTable/
├── DataTable.tsx
├── DataTable.types.ts
└── index.ts
```

### 2. 型名の命名規則

#### インターフェース名

```typescript
// Pascal Case
export interface User {}
export interface Prefecture {}
export interface RankingItem {}

// Props の命名
export interface RankingClientProps {}
export interface DataTableProps {}

// State の命名
export interface RankingClientState {}
export interface DataTableState {}

// API レスポンスの命名
export interface UserApiResponse {}
export interface RankingListResponse {}

// API リクエストの命名
export interface UserApiRequest {}
export interface RankingFetchParams {}
```

#### 型エイリアスの命名

```typescript
// Pascal Case
export type UserId = string;
export type PrefectureCode = string;

// Union 型
export type UserRole = "admin" | "user";
export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

// 関数型
export type EventHandler = (event: Event) => void;
export type AsyncFunction<T> = () => Promise<T>;
```

#### ジェネリック型の命名

```typescript
// 1文字の命名（従来）
export interface ApiResponse<T> {
  data: T;
  status: number;
}

// 説明的な命名（推奨）
export interface ApiResponse<TData> {
  data: TData;
  status: number;
}

export interface PaginatedList<TItem> {
  items: TItem[];
  total: number;
  page: number;
}
```

### 3. Props 型の命名パターン

#### 基本パターン

```typescript
// Pattern 1: コンポーネント名 + Props
export interface ButtonProps {
  label: string;
  onClick: () => void;
}

// Pattern 2: より明示的な命名
export interface RankingClientComponentProps {
  rankings: RankingData[];
  activeId: string;
}
```

#### 拡張可能な Props

```typescript
// HTML 要素の Props を拡張
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
  size?: "sm" | "md" | "lg";
}

// 他のコンポーネントの Props を拡張
export interface IconButtonProps extends ButtonProps {
  icon: React.ReactNode;
}
```

#### 省略可能な Props

```typescript
// 必須の Props は先に
export interface DataTableProps<TItem> {
  data: TItem[]; // 必須
  columns: Column[]; // 必須
  onRowClick?: (item: TItem) => void; // 省略可能
  loading?: boolean; // 省略可能
  emptyMessage?: string; // 省略可能
}
```

### 4. JSDoc コメントのパターン

#### 基本的な JSDoc

```typescript
/**
 * ユーザー情報を表すインターフェース
 */
export interface User {
  /** ユーザーの一意識別子 */
  id: string;

  /** ユーザー名 */
  name: string;

  /** メールアドレス */
  email: string;
}
```

#### 詳細な JSDoc（推奨）

````typescript
/**
 * ランキングクライアントコンポーネントの Props
 *
 * @template T - ランキング項目のキーの型
 *
 * @remarks
 * このコンポーネントは統計項目のランキング表示とナビゲーションを提供します。
 * 地図とデータテーブルを表示し、右側に統計項目のリストを表示します。
 *
 * @example
 * ```tsx
 * <RankingClient
 *   rankings={rankings}
 *   subcategory={subcategory}
 *   activeRankingId="totalArea"
 *   tabOptions={tabOptions}
 * />
 * ```
 *
 * @see {@link RankingData}
 * @see {@link SubcategoryData}
 */
export interface RankingClientProps<T extends string> {
  /**
   * ランキングデータのマップ
   *
   * @remarks
   * キーは統計項目の識別子、値はランキングデータです。
   */
  rankings: Record<T, RankingData>;

  /**
   * サブカテゴリ情報
   *
   * @remarks
   * 表示するサブカテゴリのメタデータを含みます。
   */
  subcategory: SubcategoryData;

  /**
   * アクティブなランキング項目の ID
   *
   * @remarks
   * この ID に対応するランキングデータが表示されます。
   */
  activeRankingId: T;

  /**
   * タブオプションの配列
   *
   * @remarks
   * 各オプションはナビゲーションのタブとして表示されます。
   */
  tabOptions: RankingOption<T>[];

  /**
   * 管理者権限フラグ（オプション）
   *
   * @remarks
   * true の場合、編集可能なナビゲーションが表示されます。
   *
   * @defaultValue false
   */
  isAdmin?: boolean;
}
````

#### エラー型の JSDoc

````typescript
/**
 * API エラーを表すクラス
 *
 * @extends Error
 *
 * @example
 * ```typescript
 * throw new ApiError('データの取得に失敗しました', 404);
 * ```
 */
export class ApiError extends Error {
  /**
   * HTTP ステータスコード
   *
   * @remarks
   * 200-299: 成功
   * 400-499: クライアントエラー
   * 500-599: サーバーエラー
   */
  public readonly statusCode: number;

  /**
   * エラーの詳細情報（オプション）
   */
  public readonly details?: unknown;

  constructor(message: string, statusCode: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.details = details;
  }
}
````

### 5. ユーティリティ型のパターン

#### よく使うユーティリティ型

```typescript
// types/common/utility.ts

/**
 * オブジェクトのすべてのプロパティを省略可能にする
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * オブジェクトのすべてのプロパティを必須にする
 */
export type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : T[P];
};

/**
 * オブジェクトのすべてのプロパティを読み取り専用にする
 */
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

/**
 * Union 型から null と undefined を除外する
 */
export type NonNullable<T> = T extends null | undefined ? never : T;

/**
 * 配列の要素の型を取得する
 */
export type ArrayElement<T> = T extends (infer E)[] ? E : never;

/**
 * Promise の resolve 型を取得する
 */
export type Awaited<T> = T extends Promise<infer U> ? U : T;

/**
 * オブジェクトから特定のキーを抽出する
 */
export type Pick<T, K extends keyof T> = {
  [P in K]: T[P];
};

/**
 * オブジェクトから特定のキーを除外する
 */
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
```

#### プロジェクト固有のユーティリティ型

```typescript
// types/common/utility.ts

/**
 * API レスポンスをラップする型
 */
export type ApiResponse<TData> = {
  data: TData;
  status: number;
  message: string;
  timestamp: string;
};

/**
 * ページネーション情報を含む型
 */
export type Paginated<TItem> = {
  items: TItem[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
};

/**
 * 読み込み状態を表す型
 */
export type LoadingState<TData, TError = Error> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: TData }
  | { status: "error"; error: TError };

/**
 * フォームフィールドの型
 */
export type FormField<TValue> = {
  value: TValue;
  error?: string;
  touched: boolean;
  dirty: boolean;
};

/**
 * イベントハンドラーの型
 */
export type EventHandler<TEvent = Event> = (event: TEvent) => void;
export type AsyncEventHandler<TEvent = Event> = (
  event: TEvent
) => Promise<void>;
```

---

## 型定義の分類と配置ルール

### 型定義の配置フローチャート

```
型定義を作成する
    ↓
┌───────────────────────────────────────────────┐
│ この型は複数のドメインで使用されるか？         │
└───────────────────────────────────────────────┘
    │                                   │
   YES                                 NO
    │                                   │
    ↓                                   ↓
/src/types/                      ┌─────────────────────────────────┐
グローバル型定義                  │ この型は特定のドメインで使用     │
                                 │ されるか？                      │
                                 └─────────────────────────────────┘
                                     │                      │
                                    YES                    NO
                                     │                      │
                                     ↓                      ↓
                              /src/domains/*/types/   ┌────────────────────────┐
                              ドメイン固有の型定義     │ この型は特定の         │
                                                      │ コンポーネントでのみ   │
                                                      │ 使用されるか？         │
                                                      └────────────────────────┘
                                                           │
                                                          YES
                                                           │
                                                           ↓
                                                   /src/components/*/
                                                   Component.types.ts
                                                   コンポーネント固有の型定義
```

### 配置ルールの詳細

#### Rule 1: グローバル型定義（`/src/types/`）

**配置条件：**

- ✅ 3 つ以上のドメインまたはコンポーネントで使用される
- ✅ プロジェクト全体で共通の概念を表す
- ✅ 外部ライブラリの型拡張

**配置例：**

```typescript
// types/models/user.ts
export interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "user";
}

// types/models/prefecture.ts
export interface Prefecture {
  code: string;
  name: string;
  region: string;
}

// types/api/response.ts
export interface ApiResponse<T> {
  data: T;
  status: number;
  message: string;
}

// types/external/next-auth.d.ts
declare module "next-auth" {
  interface Session {
    user: User;
  }
}
```

#### Rule 2: ドメイン固有の型定義（`/src/domains/*/types/`）

**配置条件：**

- ✅ 特定のドメインでのみ使用される
- ✅ ドメインロジックに密接に関連する
- ✅ 他のドメインからは参照されない

**配置例：**

```typescript
// domains/estat/types/raw-response.ts
export interface EstatRawResponse {
  GET_STATS_DATA: {
    RESULT: EstatResult;
    PARAMETER: EstatParameter;
    DATA_INF: EstatDataInf;
  };
}

// domains/estat/types/parameters.ts
export interface EstatApiParameters {
  appId: string;
  statsDataId: string;
  cdCat01?: string;
  cdArea?: string;
}

// domains/ranking/types/visualization.ts
export interface VisualizationSettings {
  colorScheme: string;
  legendPosition: "top" | "bottom" | "left" | "right";
  showLabels: boolean;
}
```

#### Rule 3: コンポーネント固有の型定義（`/src/components/*/Component.types.ts`）

**配置条件：**

- ✅ 特定のコンポーネントでのみ使用される
- ✅ コンポーネントの Props、State、内部ロジックに関連する
- ✅ 他のコンポーネントからは参照されない

**配置例：**

```typescript
// components/ranking/RankingClient/RankingClient.types.ts
export interface RankingClientProps<T extends string> {
  rankings: Record<T, RankingData>;
  subcategory: SubcategoryData;
  activeRankingId: T;
  tabOptions: RankingOption<T>[];
}

// components/common/DataTable/DataTable.types.ts
export interface DataTableProps<TItem> {
  data: TItem[];
  columns: DataTableColumn<TItem>[];
  onRowClick?: (item: TItem) => void;
}

export interface DataTableColumn<TItem> {
  key: keyof TItem;
  label: string;
  render?: (value: TItem[keyof TItem], item: TItem) => React.ReactNode;
}
```

### 配置の判断例

#### 例 1: User 型

```typescript
// ❓ User 型はどこに配置すべきか？

// 使用箇所を確認
// - 認証コンポーネント (components/auth/)
// - ユーザー管理コンポーネント (components/admin/users/)
// - ヘッダーコンポーネント (components/layout/Header.tsx)
// - プロフィールページ (app/profile/page.tsx)
// - API レスポンス (domains/auth/types/)

// ✅ 判断: グローバル型定義
// 理由: 複数のドメインとコンポーネントで使用される
// 配置: /src/types/models/user.ts
```

#### 例 2: EstatRawResponse 型

```typescript
// ❓ EstatRawResponse 型はどこに配置すべきか？

// 使用箇所を確認
// - e-Stat API 取得関数 (domains/estat/services/)
// - e-Stat データ処理 (domains/estat/processors/)
// - e-Stat テスト (domains/estat/__tests__/)

// ✅ 判断: ドメイン固有の型定義
// 理由: e-Stat ドメインでのみ使用される
// 配置: /src/domains/estat/types/raw-response.ts
```

#### 例 3: RankingClientProps 型

```typescript
// ❓ RankingClientProps 型はどこに配置すべきか？

// 使用箇所を確認
// - RankingClient コンポーネント (components/ranking/RankingClient/)
// - 他のコンポーネントからは参照されない

// ✅ 判断: コンポーネント固有の型定義
// 理由: RankingClient コンポーネントでのみ使用される
// 配置: /src/components/ranking/RankingClient/RankingClient.types.ts
```

---

## 具体的な実装例

### 例 1: グローバル型定義の実装

#### ファイル構成

```
src/types/
├── index.ts                    # 集約エクスポート
├── common/
│   ├── index.ts
│   ├── primitives.ts           # プリミティブ型
│   ├── utility.ts              # ユーティリティ型
│   └── pagination.ts           # ページネーション型
├── models/
│   ├── index.ts
│   ├── user.ts                 # ユーザーモデル
│   ├── prefecture.ts           # 都道府県モデル
│   └── ranking.ts              # ランキングモデル
└── api/
    ├── index.ts
    ├── request.ts              # リクエスト型
    ├── response.ts             # レスポンス型
    └── error.ts                # エラー型
```

#### 実装例

`src/types/common/primitives.ts`

```typescript
/**
 * プリミティブ型のエイリアス
 *
 * @remarks
 * 型の意図を明確にするためのエイリアスです。
 */

/** ユーザーの一意識別子（UUID） */
export type UserId = string;

/** 都道府県コード（2桁の文字列） */
export type PrefectureCode = string;

/** 統計データID */
export type StatsDataId = string;

/** カテゴリコード */
export type CategoryCode = string;

/** 年度（YYYY形式） */
export type Year = string;

/** タイムスタンプ（ISO 8601形式） */
export type Timestamp = string;

/** URL */
export type Url = string;

/** メールアドレス */
export type Email = string;
```

`src/types/common/utility.ts`

````typescript
/**
 * プロジェクト全体で使用されるユーティリティ型
 */

/**
 * API レスポンスをラップする型
 *
 * @template TData - レスポンスデータの型
 *
 * @example
 * ```typescript
 * const response: ApiResponse<User[]> = {
 *   data: users,
 *   status: 200,
 *   message: 'Success',
 *   timestamp: new Date().toISOString(),
 * };
 * ```
 */
export interface ApiResponse<TData> {
  /** レスポンスデータ */
  data: TData;

  /** HTTP ステータスコード */
  status: number;

  /** レスポンスメッセージ */
  message: string;

  /** レスポンスのタイムスタンプ */
  timestamp: string;
}

/**
 * ページネーション情報を含む型
 *
 * @template TItem - アイテムの型
 *
 * @example
 * ```typescript
 * const result: Paginated<User> = {
 *   items: users,
 *   total: 100,
 *   page: 1,
 *   pageSize: 20,
 *   hasMore: true,
 * };
 * ```
 */
export interface Paginated<TItem> {
  /** アイテムの配列 */
  items: TItem[];

  /** アイテムの総数 */
  total: number;

  /** 現在のページ番号（1始まり） */
  page: number;

  /** 1ページあたりのアイテム数 */
  pageSize: number;

  /** 次のページがあるかどうか */
  hasMore: boolean;
}

/**
 * 読み込み状態を表す Union 型
 *
 * @template TData - データの型
 * @template TError - エラーの型
 *
 * @example
 * ```typescript
 * const [state, setState] = useState<LoadingState<User>>({ status: 'idle' });
 *
 * // ローディング開始
 * setState({ status: 'loading' });
 *
 * // 成功
 * setState({ status: 'success', data: user });
 *
 * // エラー
 * setState({ status: 'error', error: new Error('Failed') });
 * ```
 */
export type LoadingState<TData, TError = Error> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: TData }
  | { status: "error"; error: TError };

/**
 * 非同期操作の結果を表す型
 */
export type AsyncResult<TData, TError = Error> =
  | { success: true; data: TData }
  | { success: false; error: TError };
````

`src/types/common/pagination.ts`

```typescript
/**
 * ページネーション関連の型定義
 */

/**
 * ページネーションパラメータ
 */
export interface PaginationParams {
  /** ページ番号（1始まり） */
  page: number;

  /** 1ページあたりのアイテム数 */
  pageSize: number;

  /** ソートキー */
  sortBy?: string;

  /** ソート順序 */
  sortOrder?: "asc" | "desc";
}

/**
 * ページネーション情報
 */
export interface PaginationInfo {
  /** 現在のページ番号 */
  currentPage: number;

  /** 総ページ数 */
  totalPages: number;

  /** アイテムの総数 */
  totalItems: number;

  /** 1ページあたりのアイテム数 */
  itemsPerPage: number;

  /** 前のページがあるかどうか */
  hasPrevious: boolean;

  /** 次のページがあるかどうか */
  hasNext: boolean;
}

/**
 * ページネーション付きレスポンス
 */
export interface PaginatedResponse<TItem> {
  /** アイテムの配列 */
  items: TItem[];

  /** ページネーション情報 */
  pagination: PaginationInfo;
}
```

`src/types/models/user.ts`

````typescript
import { Email, UserId, Timestamp } from "../common/primitives";

/**
 * ユーザーの役割
 */
export type UserRole = "admin" | "user";

/**
 * ユーザー情報を表すインターフェース
 *
 * @remarks
 * この型は認証後のユーザー情報を表します。
 * OAuth プロバイダーの情報も含まれます。
 *
 * @example
 * ```typescript
 * const user: User = {
 *   id: '123e4567-e89b-12d3-a456-426614174000',
 *   name: 'John Doe',
 *   email: 'john@example.com',
 *   username: 'johndoe',
 *   role: 'admin',
 *   isActive: true,
 *   createdAt: '2025-01-01T00:00:00Z',
 *   updatedAt: '2025-01-01T00:00:00Z',
 * };
 * ```
 */
export interface User {
  /** ユーザーの一意識別子（UUID） */
  id: UserId;

  /** ユーザーの表示名 */
  name: string;

  /** メールアドレス（一意） */
  email: Email;

  /** ユーザーネーム（ログイン用、一意） */
  username?: string;

  /** ユーザーの役割 */
  role: UserRole;

  /** プロフィール画像のURL */
  image?: string;

  /** アカウントの有効フラグ */
  isActive: boolean;

  /** 最終ログイン日時 */
  lastLogin?: Timestamp;

  /** 作成日時 */
  createdAt: Timestamp;

  /** 更新日時 */
  updatedAt: Timestamp;
}

/**
 * ユーザー作成時のデータ
 */
export interface UserCreateInput {
  name: string;
  email: Email;
  username: string;
  password: string;
  role?: UserRole;
}

/**
 * ユーザー更新時のデータ
 */
export interface UserUpdateInput {
  name?: string;
  email?: Email;
  username?: string;
  role?: UserRole;
  isActive?: boolean;
  image?: string;
}

/**
 * セッション内のユーザー情報
 */
export interface SessionUser
  extends Pick<User, "id" | "name" | "email" | "role" | "image"> {}
````

`src/types/models/prefecture.ts`

````typescript
import { PrefectureCode } from "../common/primitives";

/**
 * 地域区分
 */
export type Region =
  | "北海道"
  | "東北"
  | "関東"
  | "中部"
  | "近畿"
  | "中国"
  | "四国"
  | "九州・沖縄";

/**
 * 都道府県情報を表すインターフェース
 *
 * @example
 * ```typescript
 * const prefecture: Prefecture = {
 *   code: '13',
 *   name: '東京都',
 *   nameKana: 'とうきょうと',
 *   nameEn: 'Tokyo',
 *   region: '関東',
 * };
 * ```
 */
export interface Prefecture {
  /** 都道府県コード（2桁） */
  code: PrefectureCode;

  /** 都道府県名 */
  name: string;

  /** 都道府県名（カナ） */
  nameKana: string;

  /** 都道府県名（英語） */
  nameEn: string;

  /** 地域区分 */
  region: Region;
}

/**
 * 都道府県データ（統計値付き）
 */
export interface PrefectureData extends Prefecture {
  /** 統計値 */
  value: number;

  /** 順位 */
  rank?: number;
}
````

`src/types/models/ranking.ts`

```typescript
import {
  PrefectureCode,
  StatsDataId,
  CategoryCode,
} from "../common/primitives";

/**
 * ランキング項目の基本情報
 */
export interface RankingItem {
  /** ランキング項目のID */
  id: number;

  /** サブカテゴリID */
  subcategoryId: string;

  /** ランキングキー（一意識別子） */
  rankingKey: string;

  /** 表示ラベル */
  label: string;

  /** 統計データID */
  statsDataId: StatsDataId;

  /** カテゴリコード */
  cdCat01: CategoryCode;

  /** 単位 */
  unit: string;

  /** 項目名 */
  name: string;

  /** 表示順序 */
  displayOrder: number;

  /** 有効フラグ */
  isActive: boolean;

  /** 作成日時 */
  createdAt: string;

  /** 更新日時 */
  updatedAt: string;
}

/**
 * ランキングデータ
 */
export interface RankingData {
  /** 統計データID */
  statsDataId: StatsDataId;

  /** カテゴリコード */
  cdCat01: CategoryCode;

  /** 単位 */
  unit: string;

  /** 項目名 */
  name: string;
}

/**
 * ランキング結果
 */
export interface RankingResult {
  /** 都道府県コード */
  prefectureCode: PrefectureCode;

  /** 都道府県名 */
  prefectureName: string;

  /** 統計値 */
  value: number;

  /** 順位 */
  rank: number;
}
```

`src/types/api/response.ts`

```typescript
/**
 * API レスポンスの基本型
 */
export interface BaseApiResponse {
  /** HTTP ステータスコード */
  status: number;

  /** レスポンスメッセージ */
  message: string;

  /** タイムスタンプ */
  timestamp: string;
}

/**
 * 成功レスポンス
 */
export interface SuccessResponse<TData> extends BaseApiResponse {
  /** レスポンスデータ */
  data: TData;
}

/**
 * エラーレスポンス
 */
export interface ErrorResponse extends BaseApiResponse {
  /** エラーコード */
  errorCode: string;

  /** エラーの詳細 */
  details?: unknown;
}

/**
 * API レスポンス（Union 型）
 */
export type ApiResponse<TData> = SuccessResponse<TData> | ErrorResponse;
```

`src/types/api/error.ts`

````typescript
/**
 * API エラーのクラス
 *
 * @extends Error
 *
 * @example
 * ```typescript
 * throw new ApiError('データの取得に失敗しました', 404, { detail: 'Not found' });
 * ```
 */
export class ApiError extends Error {
  /** HTTP ステータスコード */
  public readonly statusCode: number;

  /** エラーの詳細情報 */
  public readonly details?: unknown;

  constructor(message: string, statusCode: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.details = details;

    // TypeScript でのプロトタイプチェーンの修正
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

/**
 * 認証エラー
 */
export class AuthenticationError extends ApiError {
  constructor(message: string = "認証が必要です") {
    super(message, 401);
    this.name = "AuthenticationError";
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

/**
 * 認可エラー
 */
export class AuthorizationError extends ApiError {
  constructor(message: string = "権限がありません") {
    super(message, 403);
    this.name = "AuthorizationError";
    Object.setPrototypeOf(this, AuthorizationError.prototype);
  }
}

/**
 * データが見つからないエラー
 */
export class NotFoundError extends ApiError {
  constructor(message: string = "データが見つかりません") {
    super(message, 404);
    this.name = "NotFoundError";
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

/**
 * バリデーションエラー
 */
export class ValidationError extends ApiError {
  constructor(message: string, details?: unknown) {
    super(message, 400, details);
    this.name = "ValidationError";
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}
````

`src/types/index.ts` - 集約エクスポート

````typescript
/**
 * Stats47 プロジェクトの型定義
 *
 * @remarks
 * このファイルはプロジェクト全体で使用される型定義を集約してエクスポートします。
 * 型定義は以下のカテゴリに分類されています：
 *
 * - **Common**: 共通型定義（primitives, utility, pagination）
 * - **Models**: ドメインモデル（user, prefecture, ranking）
 * - **API**: API 関連の型（request, response, error）
 * - **Components**: 共通コンポーネントの Props 型
 * - **Visualization**: 可視化関連の型
 * - **Database**: データベース関連の型
 *
 * @example
 * ```typescript
 * import { User, Prefecture, ApiResponse } from '@/types';
 * ```
 */

// Common Types
export * from "./common/primitives";
export * from "./common/utility";
export * from "./common/pagination";

// Model Types
export * from "./models/user";
export * from "./models/prefecture";
export * from "./models/ranking";

// API Types
export * from "./api/request";
export * from "./api/response";
export * from "./api/error";

// Component Types
export * from "./components/layout";
export * from "./components/form";
export * from "./components/data-display";

// Visualization Types
export * from "./visualization/choropleth";
export * from "./visualization/chart";
export * from "./visualization/map";

// Database Types
export * from "./database/schema";
export * from "./database/query";
````

### 例 2: ドメイン固有の型定義の実装

#### ファイル構成

```
src/domains/estat/
├── types/
│   ├── index.ts
│   ├── raw-response.ts         # Raw API Response
│   ├── meta-response.ts        # Meta Response
│   ├── list-response.ts        # List Response
│   ├── catalog-response.ts     # Catalog Response
│   ├── parameters.ts           # API Parameters
│   ├── processed.ts            # Processed Data
│   ├── formatted.ts            # Formatted Data
│   └── metainfo.ts            # MetaInfo
└── services/
    ├── api-client.ts
    ├── data-processor.ts
    └── cache.ts
```

#### 実装例

`src/domains/estat/types/parameters.ts`

````typescript
import { StatsDataId, CategoryCode, PrefectureCode, Year } from "@/types";

/**
 * e-Stat API のリクエストパラメータ
 *
 * @remarks
 * e-Stat API の GET_STATS_DATA エンドポイントで使用されるパラメータです。
 *
 * @see https://www.e-stat.go.jp/api/api-info/e-stat-manual3-0
 */
export interface EstatApiParameters {
  /** アプリケーションID（必須） */
  appId: string;

  /** 統計表ID（必須） */
  statsDataId: StatsDataId;

  /** 統計大分類コード */
  cdCat01?: CategoryCode;

  /** 地域コード */
  cdArea?: PrefectureCode;

  /** 年度 */
  cdTime?: Year;

  /** データ開始位置 */
  startPosition?: number;

  /** 取得データ件数 */
  limit?: number;

  /** メタ情報の有無 */
  metaGetFlg?: "Y" | "N";

  /** データ取得フラグ */
  cntGetFlg?: "Y" | "N";

  /** セクション指定 */
  sectionHeaderFlg?: "1" | "2";
}

/**
 * e-Stat API リクエストのビルダークラス
 *
 * @example
 * ```typescript
 * const params = new EstatApiParametersBuilder('your-app-id')
 *   .setStatsDataId('0000010102')
 *   .setCdCat01('B1101')
 *   .setLimit(100)
 *   .build();
 * ```
 */
export class EstatApiParametersBuilder {
  private params: Partial<EstatApiParameters>;

  constructor(appId: string) {
    this.params = { appId };
  }

  setStatsDataId(statsDataId: StatsDataId): this {
    this.params.statsDataId = statsDataId;
    return this;
  }

  setCdCat01(cdCat01: CategoryCode): this {
    this.params.cdCat01 = cdCat01;
    return this;
  }

  setCdArea(cdArea: PrefectureCode): this {
    this.params.cdArea = cdArea;
    return this;
  }

  setCdTime(cdTime: Year): this {
    this.params.cdTime = cdTime;
    return this;
  }

  setStartPosition(startPosition: number): this {
    this.params.startPosition = startPosition;
    return this;
  }

  setLimit(limit: number): this {
    this.params.limit = limit;
    return this;
  }

  build(): EstatApiParameters {
    if (!this.params.statsDataId) {
      throw new Error("statsDataId is required");
    }
    return this.params as EstatApiParameters;
  }
}
````

`src/domains/estat/types/raw-response.ts`

```typescript
/**
 * e-Stat API の Raw レスポンス型定義
 *
 * @remarks
 * e-Stat API から返される JSON レスポンスの型定義です。
 */

/**
 * API レスポンスの結果情報
 */
export interface EstatResult {
  /** ステータスコード */
  STATUS: number;

  /** エラーメッセージ */
  ERROR_MSG?: string;

  /** データ件数 */
  TOTAL_NUMBER?: number;

  /** 開始位置 */
  FROM_NUMBER?: number;

  /** 終了位置 */
  TO_NUMBER?: number;

  /** 日付 */
  DATE: string;
}

/**
 * API リクエストパラメータ
 */
export interface EstatParameter {
  /** 言語 */
  LANG?: string;

  /** 統計表ID */
  STATS_DATA_ID: string;

  /** データ形式 */
  DATA_FORMAT?: string;
}

/**
 * 統計データ情報
 */
export interface EstatDataInf {
  /** 値 */
  VALUE: EstatValue[];

  /** クラスオブジェクト */
  CLASS_INF?: {
    CLASS_OBJ: EstatClassObj[];
  };
}

/**
 * 統計値
 */
export interface EstatValue {
  /** $ 属性（値のインデックス情報） */
  $: string;

  /** 値 */
  _: string;
}

/**
 * クラスオブジェクト（メタ情報）
 */
export interface EstatClassObj {
  /** クラスID */
  "@id": string;

  /** クラス名 */
  "@name": string;

  /** クラス */
  CLASS: EstatClass[];
}

/**
 * クラス（分類項目）
 */
export interface EstatClass {
  /** コード */
  "@code": string;

  /** 名称 */
  "@name": string;

  /** レベル */
  "@level"?: string;

  /** 単位 */
  "@unit"?: string;
}

/**
 * e-Stat API の Raw レスポンス
 */
export interface EstatRawResponse {
  GET_STATS_DATA: {
    /** 結果情報 */
    RESULT: EstatResult;

    /** パラメータ */
    PARAMETER: EstatParameter;

    /** データ情報 */
    DATA_INF?: EstatDataInf;
  };
}
```

`src/domains/estat/types/index.ts`

```typescript
/**
 * e-Stat ドメインの型定義
 *
 * @remarks
 * e-Stat API 関連の型定義を集約してエクスポートします。
 */

// Raw API Response Types
export * from "./raw-response";
export * from "./meta-response";
export * from "./list-response";
export * from "./catalog-response";

// API Parameters
export * from "./parameters";

// Processed Data Types
export * from "./processed";

// Formatted Data Types
export * from "./formatted";

// MetaInfo Types
export * from "./metainfo";
```

### 例 3: コンポーネント固有の型定義の実装

#### ファイル構成

```
src/components/ranking/RankingClient/
├── RankingClient.tsx
├── RankingClient.types.ts      # コンポーネント固有の型
├── RankingClient.test.tsx
└── index.ts
```

#### 実装例

`src/components/ranking/RankingClient/RankingClient.types.ts`

````typescript
import { SubcategoryData } from "@/types";
import { RankingData, RankingItem } from "@/types/models/ranking";

/**
 * ランキングオプション（タブ項目）の構造
 *
 * @template T - ランキング項目のキーの型
 */
export interface RankingOption<T extends string> {
  /** ランキング項目のキー（一意識別子） */
  key: T;

  /** 表示ラベル */
  label: string;
}

/**
 * RankingClient コンポーネントの Props
 *
 * @template T - ランキング項目のキーの型
 *
 * @remarks
 * このコンポーネントは統計項目のランキング表示とナビゲーションを提供します。
 * 地図とデータテーブルを表示し、右側に統計項目のリストを表示します。
 *
 * @example
 * ```tsx
 * <RankingClient
 *   rankings={{
 *     totalArea: {
 *       statsDataId: '0000010102',
 *       cdCat01: 'B1101',
 *       unit: 'ha',
 *       name: '総面積',
 *     },
 *   }}
 *   subcategory={subcategory}
 *   activeRankingId="totalArea"
 *   tabOptions={[
 *     { key: 'totalArea', label: '総面積' },
 *   ]}
 * />
 * ```
 *
 * @see {@link RankingData}
 * @see {@link SubcategoryData}
 * @see {@link RankingOption}
 */
export interface RankingClientProps<T extends string> {
  /**
   * ランキングデータのマップ
   *
   * @remarks
   * キーは統計項目の識別子、値はランキングデータです。
   */
  rankings: Record<T, RankingData>;

  /**
   * サブカテゴリ情報
   *
   * @remarks
   * 表示するサブカテゴリのメタデータを含みます。
   */
  subcategory: SubcategoryData;

  /**
   * アクティブなランキング項目の ID
   *
   * @remarks
   * この ID に対応するランキングデータが表示されます。
   */
  activeRankingId: T;

  /**
   * タブオプションの配列
   *
   * @remarks
   * 各オプションはナビゲーションのタブとして表示されます。
   */
  tabOptions: RankingOption<T>[];

  /**
   * ランキング項目の配列（編集用、オプション）
   *
   * @remarks
   * 管理者権限がある場合、この配列を使用してランキング項目を編集できます。
   */
  rankingItems?: RankingItem[];

  /**
   * 管理者権限フラグ（オプション）
   *
   * @remarks
   * true の場合、編集可能なナビゲーションが表示されます。
   *
   * @defaultValue false
   */
  isAdmin?: boolean;
}
````

`src/components/ranking/RankingClient/index.ts`

```typescript
export { RankingClient } from "./RankingClient";
export { RankingNavigation } from "./RankingNavigation";
export type { RankingClientProps, RankingOption } from "./RankingClient.types";
```

---

## マイグレーション計画

### フェーズ 1: 準備（1 日）

#### ステップ 1: 現状の型定義を調査

```bash
# 型定義ファイルの一覧を取得
find src -name "types.ts" -o -name "*.types.ts" -o -path "*/types/*" > type-files.txt

# 型定義の使用状況を調査
grep -r "import.*from.*types" src/ > type-imports.txt
```

#### ステップ 2: 新しいディレクトリ構造を作成

```bash
# グローバル型定義ディレクトリ
mkdir -p src/types/{common,models,api,components,visualization,database,external}

# ドメイン型定義ディレクトリ
mkdir -p src/domains/{estat,ranking,auth}/types
```

#### ステップ 3: マイグレーション計画書の作成

`docs/type-migration-plan.md` を作成し、以下を記載：

- 移行対象のファイル一覧
- 移行先のディレクトリ
- 依存関係のマッピング
- 移行スケジュール

### フェーズ 2: グローバル型定義の移行（2〜3 日）

#### ステップ 1: 共通型定義の作成

```bash
# 共通型定義を作成
touch src/types/common/{primitives,utility,pagination}.ts
touch src/types/common/index.ts
```

```typescript
// src/types/common/primitives.ts
export type UserId = string;
export type PrefectureCode = string;
export type StatsDataId = string;
// ...
```

#### ステップ 2: モデル型定義の移行

```bash
# 既存の型定義を新しい場所にコピー
cp src/types/prefecture.ts src/types/models/prefecture.ts

# 古いファイルは残しておく（互換性のため）
# 後で削除する
```

```typescript
// src/types/models/index.ts
export * from "./user";
export * from "./prefecture";
export * from "./ranking";
```

#### ステップ 3: 集約エクスポートファイルの作成

```typescript
// src/types/index.ts
export * from "./common";
export * from "./models";
export * from "./api";
// ...
```

### フェーズ 3: ドメイン型定義の移行（2〜3 日）

#### ステップ 1: e-Stat 型定義の移行

```bash
# 既存のディレクトリを移動
mv src/lib/estat/types src/domains/estat/types

# または新しいディレクトリにコピー
cp -r src/lib/estat/types src/domains/estat/types
```

#### ステップ 2: インポートパスの更新

```typescript
// Before
import { EstatRawResponse } from "@/lib/estat/types/raw-response";

// After
import { EstatRawResponse } from "@/domains/estat/types";
```

#### ステップ 3: 集約エクスポートの作成

```typescript
// src/domains/estat/types/index.ts
export * from "./raw-response";
export * from "./meta-response";
// ...
```

### フェーズ 4: コンポーネント型定義の整理（2〜3 日）

#### ステップ 1: コンポーネント型定義のリネーム

```bash
# types.ts を Component.types.ts にリネーム
mv src/components/ranking/RankingClient/types.ts \
   src/components/ranking/RankingClient/RankingClient.types.ts
```

#### ステップ 2: インポートパスの更新

```typescript
// Before
import { RankingClientProps } from "./types";

// After
import { RankingClientProps } from "./RankingClient.types";
```

#### ステップ 3: re-export の追加

```typescript
// src/components/ranking/RankingClient/index.ts
export { RankingClient } from "./RankingClient";
export type { RankingClientProps } from "./RankingClient.types";
```

### フェーズ 5: インポートパスの一括置換（1 日）

#### ステップ 1: 検索と置換のスクリプト作成

```bash
# scripts/migrate-imports.sh
#!/bin/bash

# 例: prefecture 型のインポートパスを置換
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i '' \
  's|@/types/prefecture|@/types/models/prefecture|g'

# 例: e-Stat 型のインポートパスを置換
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i '' \
  's|@/lib/estat/types|@/domains/estat/types|g'
```

#### ステップ 2: TypeScript コンパイラで確認

```bash
# 型エラーがないか確認
npx tsc --noEmit

# エラーがある場合は修正
```

#### ステップ 3: テストの実行

```bash
# すべてのテストを実行
npm test

# テストが失敗した場合は修正
```

### フェーズ 6: 古いファイルの削除（1 日）

#### ステップ 1: 古いファイルのバックアップ

```bash
# バックアップディレクトリを作成
mkdir -p backup/old-types

# 古いファイルをバックアップ
cp -r src/types backup/old-types/
cp -r src/lib/estat/types backup/old-types/estat
```

#### ステップ 2: 古いファイルの削除

```bash
# 古い型定義ファイルを削除
rm src/types/prefecture.ts
rm -rf src/lib/estat/types
```

#### ステップ 3: 最終確認

```bash
# 型エラーがないか確認
npx tsc --noEmit

# テストを実行
npm test

# ビルドを実行
npm run build
```

### フェーズ 7: ドキュメント化（1 日）

#### ステップ 1: 型定義のドキュメント作成

`docs/types-documentation.md` を作成：

```markdown
# 型定義ドキュメント

## ディレクトリ構造

...

## 型定義の配置ルール

...

## 使用例

...
```

#### ステップ 2: README の更新

```markdown
# Stats47

## 型定義の使用方法

型定義は以下のディレクトリに配置されています：

- `/src/types/` - グローバル型定義
- `/src/domains/*/types/` - ドメイン固有の型定義
- `/src/components/*/Component.types.ts` - コンポーネント固有の型定義

詳細は [型定義ドキュメント](docs/types-documentation.md) を参照してください。
```

---

## 型定義のメンテナンス

### 日常的なメンテナンス

#### 1. 新しい型定義を追加する際のチェックリスト

```
□ 型定義の配置場所は適切か？（グローバル/ドメイン/コンポーネント）
□ 型名の命名規則に従っているか？
□ JSDoc コメントを追加したか？
□ 使用例を記載したか？
□ index.ts に re-export を追加したか？
□ 既存の型と重複していないか？
□ 型の依存関係は明確か？
```

#### 2. 型定義の修正時のチェックリスト

```
□ 破壊的変更ではないか？（既存コードが壊れないか）
□ すべての使用箇所を確認したか？
□ テストを更新したか？
□ ドキュメントを更新したか？
□ 変更履歴を記録したか？
```

#### 3. 型定義の削除時のチェックリスト

```
□ 使用箇所がないか確認したか？
□ 代替の型が提供されているか？
□ マイグレーションガイドを作成したか？
□ 変更履歴を記録したか？
```

### 定期的なメンテナンス

#### 月次レビュー

```bash
# 未使用の型定義を検出
npx ts-prune

# 循環参照を検出
npx madge --circular --extensions ts,tsx src/

# 型定義の使用状況を分析
npx depcheck
```

#### 四半期レビュー

- 型定義のドキュメントを更新
- 命名規則の見直し
- ディレクトリ構造の見直し
- 不要な型定義の削除

---

## よくある問題と解決策

### 問題 1: 循環参照エラー

**症状：**

```
ReferenceError: Cannot access 'TypeA' before initialization
```

**原因：**
型定義ファイルが相互に参照している（循環参照）

**解決策：**

```typescript
// Bad: 循環参照
// types/a.ts
import { TypeB } from "./b";
export interface TypeA {
  b: TypeB;
}

// types/b.ts
import { TypeA } from "./a";
export interface TypeB {
  a: TypeA;
}

// Good: 循環参照を避ける
// types/common.ts
export interface BaseType {
  id: string;
}

// types/a.ts
import { BaseType } from "./common";
export interface TypeA extends BaseType {
  name: string;
}

// types/b.ts
import { BaseType } from "./common";
export interface TypeB extends BaseType {
  title: string;
}
```

### 問題 2: インポートパスが長い

**症状：**

```typescript
import { RankingData } from "../../../../../types/models/ranking";
```

**解決策：**

```typescript
// tsconfig.json に path alias を設定
{
  "compilerOptions": {
    "paths": {
      "@/types": ["./src/types"],
      "@/types/*": ["./src/types/*"],
      "@/domains/*": ["./src/domains/*"],
      "@/components/*": ["./src/components/*"]
    }
  }
}

// After
import { RankingData } from '@/types/models/ranking';
```

### 問題 3: 型定義が重複している

**症状：**
同じような型定義が複数の場所に存在する

**解決策：**

```typescript
// Before: 型の重複
// components/A/types.ts
export interface User {
  id: string;
  name: string;
}

// components/B/types.ts
export interface User {
  id: string;
  name: string;
}

// After: 型の共有
// types/models/user.ts
export interface User {
  id: string;
  name: string;
}

// components/A/ComponentA.tsx
import { User } from "@/types/models/user";

// components/B/ComponentB.tsx
import { User } from "@/types/models/user";
```

### 問題 4: 型定義が見つからない

**症状：**

```
Cannot find module '@/types/models/user' or its corresponding type declarations.
```

**解決策 1: index.ts からの re-export を確認**

```typescript
// types/models/index.ts
export * from "./user"; // これがないと見つからない
```

**解決策 2: tsconfig.json の paths を確認**

```json
{
  "compilerOptions": {
    "paths": {
      "@/types/*": ["./src/types/*"] // これが正しく設定されているか確認
    }
  }
}
```

### 問題 5: ジェネリック型の型推論が効かない

**症状：**

```typescript
const data: ApiResponse = fetchData(); // エラー: ジェネリック型引数が必要
```

**解決策：**

```typescript
// Bad: ジェネリック型引数が省略できない
export interface ApiResponse<T> {
  data: T;
}

// Good: デフォルト型引数を提供
export interface ApiResponse<T = unknown> {
  data: T;
}

// 使用例
const data: ApiResponse = fetchData(); // OK: T は unknown になる
const userData: ApiResponse<User> = fetchUserData(); // OK: T は User になる
```

### 問題 6: Union 型の型ガード

**症状：**

```typescript
type Result =
  | { success: true; data: string }
  | { success: false; error: string };

function handleResult(result: Result) {
  if (result.success) {
    console.log(result.data); // エラー: data が存在しない可能性がある
  }
}
```

**解決策：**

```typescript
// 型ガード関数を使用
function isSuccess(result: Result): result is { success: true; data: string } {
  return result.success === true;
}

function handleResult(result: Result) {
  if (isSuccess(result)) {
    console.log(result.data); // OK: result は { success: true; data: string } に絞り込まれる
  } else {
    console.log(result.error); // OK: result は { success: false; error: string } に絞り込まれる
  }
}
```

---

## まとめ

### 型定義管理のベストプラクティス

1. **明確な配置ルール**

   - グローバル型、ドメイン型、コンポーネント型を明確に分離
   - 型のスコープに応じて適切な場所に配置

2. **統一された命名規則**

   - ファイル名: 小文字、ハイフン区切り
   - 型名: Pascal Case
   - Props 型: `ComponentNameProps`

3. **充実したドキュメンテーション**

   - すべての型に JSDoc コメントを追加
   - 使用例を記載
   - 依存関係を明示

4. **再利用性の向上**

   - DRY 原則に従う
   - 共通の型は適切な場所で定義
   - index.ts で re-export

5. **保守性の向上**
   - 循環参照を避ける
   - 型の依存関係を明確にする
   - 定期的なレビューとリファクタリング

### 次のステップ

1. **現状の型定義を調査する**

   - 型定義ファイルの一覧を作成
   - 使用状況を分析
   - 問題点を洗い出す

2. **マイグレーション計画を立てる**

   - 移行対象のファイルを特定
   - 移行スケジュールを決定
   - リスクを評価

3. **段階的に移行する**

   - フェーズごとに移行
   - 各フェーズで動作確認
   - ドキュメントを更新

4. **継続的に改善する**
   - 定期的なレビュー
   - フィードバックの収集
   - ベストプラクティスの更新

この型定義管理戦略に従うことで、プロジェクトの型定義を効率的に管理し、保守性と開発効率を向上させることができます。
