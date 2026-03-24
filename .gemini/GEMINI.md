# 開発規約・ガイドライン

## 1. 基本方針

### 言語とコミュニケーション
- あなたは日本の開発者を支援するAIエージェントです
- ユーザーとの**対話、計画の策定、説明文、コメント、ログメッセージ**はすべて**日本語**で行うこと
- 技術用語（例: Request, Response, Commit）は、文脈に応じてカタカナまたは英語のまま使用しても構いませんが、説明は日本語で行うこと

### 設計原則
- **Clean Code**と**DRY (Don't Repeat Yourself)**原則を常に優先すること
- 思考プロセス: 常に「**既存コードの確認**」→「**型定義**」→「**実装**」→「**検証**」の順で進めること

---

## 2. コード品質 & 冗長化防止

### 事前確認
- **実装前の確認**: 新規実装時は、まず既存の`@/utils`、`@/components`、`@/hooks`に類似機能がないか確認すること
- 重複を避けるために、必ず既存コードベースを検索してから実装を開始すること

### 共通化ルール
- **重複コードの排除**: 同じロジックが**2回出現した時点で**即座にユーティリティ化またはコンポーネント化すること
- 3回目を待たずに、2回目で必ず共通化を検討すること

### ファイルサイズ制限
- **1ファイル200行を目安**とし、超過する場合は以下の方法で分割すること:
  - カスタムフックへの切り出し
  - サブコンポーネント化
  - ユーティリティ関数への抽出
  - 責務ごとのモジュール分割

### 定数管理
- **マジックナンバーやハードコード禁止**: 文字列や数値は`@/constants`ディレクトリや設定ファイルに集約すること
- 定数は意味のある名前を付けて定義すること

---

## 3. TypeScript & 型定義

### タイプファーストの原則
- **実装前に型定義**: 関数やコンポーネントの実装前に、必ず`interface`や`type`を定義すること
- **型から実装へ**: 型定義がAPI仕様となり、実装は型に従うこと
- **型の検証**: 型定義が正しければ、実装の大部分は型チェックで保証されます

#### 例
```typescript
// ✅ Good: 型定義を先に作成
interface UserProfile {
  id: string;
  name: string;
  email: string;
}

function fetchUserProfile(userId: string): Promise<UserProfile> {
  // 実装は型定義に従う
}

// ❌ Bad: 実装後に型を追加
function fetchUserProfile(userId: string) {
  const data = await fetch(`/api/users/${userId}`);
  return data.json(); // 型が不明確
}
```

### 厳密な型付け
- **any型禁止**: `any`型の使用は原則禁止。不明なデータ構造は`zod`でバリデーションすること
- **Props型の命名**: コンポーネントのPropsは`<ComponentName>Props`の形式で命名すること

### 型定義の組織化

#### Barrel Fileパターン
- **index.tsの役割**: 再エクスポートのみを行うこと（`export type { ... } from "./xxx"`）
- **直接の型定義を含めない**: index.ts内で新規に型定義を書かない
- **メリット**:
  - import文がシンプル
  - 内部構造変更に強い
  - 公開APIを明示的に管理できる

#### 型の配置基準

| 型の種類 | 配置場所 | 理由 |
|:---------|:---------|:-----|
| 公開型（他featureから参照） | `@/types/` 配下 | 複数機能で共有、公開API |
| 内部型（feature内のみ使用） | 各feature内の `types.ts` | カプセル化 |
| レイヤー固有型（repository層など） | `repositories/types.ts` | 責務の分離 |
| UI Props型 | `components/types.ts` または個別ファイル | コンポーネント近接性 |

### 型の命名規則
- ✅ **Good**: 用途が明確（`RankingItem`, `RankingItemDB`, `RankingItemMeta`）
- ❌ **Bad**: 曖昧（`Item`, `Data`）
- レイヤーや用途を示す接尾辞を使用（`DB`, `Meta`, `Props`, `Config`など）

---

## 4. 命名規則（動詞の使い分け）

関数の性質に応じて、以下の動詞を**厳格に使い分ける**こと。関数名は、その関数が何をするかを明確に示す動詞を使用してください。

| 関数の性質 | 推奨動詞 | 例 |
|:-----------|:---------|:---|
| 外部API・サービスからの取得 | `fetch`, `retrieve` | `fetchUserData()`, `retrieveStatistics()` |
| dictionary/mapからの読み出し | `lookup` | `lookupCategoryName()`, `lookupCategory()` |
| 条件による検索（単一オブジェクト） | `find`, `search` | `findUserById()`, `findRankingItem()` |
| 条件による検索（配列） | `list`, `getAll` | `listUsersByCategory()`, `listRankingValuesByKeyAndYear()` |
| 一覧情報の取得 | `list`, `getAll` | `listCategories()`, `getAllUsers()` |
| 簡単な計算 | `calculate` | `calculateTotal()`, `calculateAverage()` |
| 複雑な計算 | `compute` | `computeRankings()`, `computeStatistics()` |
| 新規オブジェクトの生成 | `build`, `create`, `compose` | `buildUrl()`, `createReport()` |
| データの形式変換 | `transform`, `convert`, `normalize` | `transformResponse()`, `normalizeCategory()` |
| 検証・確認 | `validate`, `check` | `validateInput()`, `checkPermission()` |
| privateフィールドそのまま返す | `get` | `getName()`, `getId()` |

### findとlistの使い分け

- **`find`**: 単一のオブジェクトを返す場合に使用（見つからない場合は`null`を返す）
  - 例: `findUserById(id: string): User | null`
  - 例: `findRankingItem(rankingKey: string): RankingItem | null`

- **`list`**: 配列を返す場合に使用（見つからない場合は空配列`[]`を返す）
  - 例: `listUsersByCategory(categoryId: string): User[]`
  - 例: `listRankingValuesByKeyAndYear(rankingKey: string, areaType: AreaType, yearCode?: string): RankingValue[]`

戻り値の型によって適切な動詞を選択することで、関数の動作が明確になります。

### 避けるべきパターン
- **getの多用**: 何をするか不明確（具体的な動詞を使用すること）
- **曖昧な命名**: `handleData`, `processItem`などの汎用的すぎる名前

---

## 5. 実装パターン

### 純粋関数の優先
- **純粋関数を優先**: 同じ入力に対して常に同じ出力を返す関数を優先すること
- **副作用の分離**: データフェッチやキャッシュは別の関数に分離し、明示的にすること
- **不変性**: 引数を変更せず、新しいオブジェクトを返すこと
- **適切な動詞を使用**: 処理の性質に応じた動詞を選択（上記の命名規則参照）

#### 例
```typescript
// ✅ Good: 純粋関数
function calculateTotal(items: Item[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// ❌ Bad: 副作用がある
let total = 0;
function addToTotal(item: Item): void {
  total += item.price; // 外部状態を変更
}
```

### 早期リターンの優先
- **早期リターンの使用**: 深いネストを避けるため、条件分岐では早期リターンを優先すること
- **理由**: 早期リターンにより、ネストが浅くなり、可読性が向上し、各ケースの処理が明確になる
- **適用場面**: バリデーション、エラーハンドリング、条件分岐による値の生成など

#### 例
```typescript
// ✅ Good: 早期リターンでネストを削減
function buildDescription({
  itemName,
  rankingValues,
  selectedYear,
}: {
  itemName: string;
  rankingValues: RankingValue[];
  selectedYear: string | undefined;
}): string {
  // データがない場合の早期リターン
  if (!rankingValues || rankingValues.length === 0) {
    return `日本の都道府県別${itemName}のランキングデータ。`;
  }

  const topRankings = computeTopRankings(rankingValues);
  
  // トップランキングがない場合の早期リターン
  if (topRankings.length === 0) {
    return `日本の都道府県別${itemName}のランキングデータ。`;
  }

  // メイン処理（ネストが浅い）
  const top1 = topRankings[0];
  return `${itemName}の都道府県別ランキング。${top1.areaName}が1位。`;
}

// ❌ Bad: 深いネスト
function buildDescription({
  itemName,
  rankingValues,
  selectedYear,
}: {
  itemName: string;
  rankingValues: RankingValue[];
  selectedYear: string | undefined;
}): string {
  let description: string;
  if (rankingValues && rankingValues.length > 0) {
    const topRankings = computeTopRankings(rankingValues);
    if (topRankings.length > 0) {
      const top1 = topRankings[0];
      description = `${itemName}の都道府県別ランキング。${top1.areaName}が1位。`;
    } else {
      description = `日本の都道府県別${itemName}のランキングデータ。`;
    }
  } else {
    description = `日本の都道府県別${itemName}のランキングデータ。`;
  }
  return description;
}
```

---

## 6. Next.js & React

### React Server Components (RSC)
- **デフォルトでRSCを使用**: Server Componentsを優先し、`"use client"`はインタラクティブ性が必要な場合のみ使用すること
- クライアントコンポーネントは最小限に留めること

### Composition Pattern（推奨）
- **Composition Patternを採用**: Server Componentでデータ取得を行い、Client ComponentでUI表示を行うパターンを推奨すること
- **データ取得とUI分離**: データ取得はServer Component（Container）で行い、インタラクティブなUIはClient Componentで実装すること
- **メリット**:
  - サーバー側でデータ取得（セキュリティ、パフォーマンス向上）
  - クライアント側でインタラクティブ機能を維持（タブ切り替えなど）
  - propsのバケツリレーを最小限に
  - Next.js 15+のベストプラクティスに準拠
- **実装例**:
  ```typescript
  // Container (Server Component)
  export async function ComponentContainer({ ... }) {
    const data = await fetchData();
    return <Component data={data} />;
  }
  
  // Component (Client Component)
  "use client";
  export function Component({ data, ... }) {
    // インタラクティブなUI実装
  }
  ```
- **Suspenseとの組み合わせ**: 重いデータ取得には`Suspense`とSkeletonコンポーネントを組み合わせること

### Hook最適化
- **不要なuseEffect回避**: 不要な`useEffect`を避け、以下を優先すること:
  - Server Componentsでのデータ取得
  - URL状態管理（searchParams）
  - Server Componentからのprops渡し

### コンポーネント分割
- 大きなコンポーネントは`components/<Feature>/<SubComponent>.tsx`に分割すること
- 1コンポーネント200行を目安に分割を検討すること

### zod使用
- フォームやAPIレスポンスのバリデーションには`zod`を使用すること
- 型安全性を保つため、zodスキーマから型を生成すること

### Storybook

#### Vitest APIの使用禁止

- **`*.stories.tsx` で `vitest` を絶対にインポートしないこと**
- Storybookはブラウザ環境で動作し、Vitestはテストランナー環境で動作する。**実行環境が異なる**ため、`vi.mock()`, `vi.fn()`, `jest.Mock` は `.stories.tsx` では動作しない
- **禁止パターン**:
  ```typescript
  // ❌ 絶対に使わない
  import { vi } from "vitest";
  vi.mock("../../hooks", () => ({ ... }));
  (someHook as jest.Mock).mockReturnValue({ ... });
  ```

#### Storybookでのモック手法（優先順位順）

| 手法 | 用途 | 複雑さ |
|:-----|:-----|:-------|
| `@storybook/nextjs` の parameters | `useRouter`, `useParams` 等 Next.js フック | 低 |
| props でモックデータを渡す | Client Component のテスト | 低 |
| `@stats47/mock` パッケージ | 共通のモックデータ | 低 |
| Webpack エイリアス (`__mocks__`) | Storybook 環境では動かないモジュール | 中 |
| MSW (`msw-storybook-addon`) | API通信のモック | 中 |

#### Next.js フックの制御

`@storybook/nextjs` が `useRouter` / `useParams` を自動モックするため、`parameters.nextjs.navigation` でパラメータを指定するだけで良い:

```typescript
// ✅ 推奨: Next.js パラメータで制御（フックのモック不要）
export const Default: Story = {
  parameters: {
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: "/dashboard/population/basic-population/00000",
        params: {
          categoryKey: "population",
          subcategoryKey: "basic-population",
          areaCode: "00000",
        },
      },
    },
  },
};
```

#### `@stats47/mock` パッケージの使用

`package.json` の `exports` で公開されたパスのみ使用すること。内部パスを直接指定しないこと:

```typescript
// ✅ Good: exports で公開されたパス
import { prefectures } from "@stats47/mock/area";

// ❌ Bad: 内部パスの直接指定（Webpack で解決できない）
import prefectures from "@stats47/mock/src/area/prefectures.json";
```

#### フレームワークパッケージの使用
- Next.jsプロジェクトでは`@storybook/react`を直接インポートせず、`@storybook/nextjs-vite`を使用すること
- **理由**: Storybook 10以降では、フレームワーク固有のパッケージを使用することで、Next.jsの機能（App Router、Image、Linkなど）が正しく動作する
- **正しい例**: `import type { Meta, StoryObj } from "@storybook/nextjs-vite";`
- **誤った例**: `import type { Meta, StoryObj } from "@storybook/react";`

### Server ComponentとStorybook対応

#### ベストプラクティス: Client Componentを直接テスト

| 項目 | 推奨 |
|:-----|:-----|
| Server Component | Storybookでテストしない（データ取得のみを担当） |
| Client Component | propsでモックデータを渡してテスト |
| モックデータ | ストーリーファイル内に定義 |

#### 理由
- Server Componentのモックは複雑（`__mocks__`ディレクトリ、Vite alias設定が必要）
- Client Componentに直接モックデータを渡す方がシンプルで保守性が高い
- UIテストはClient Componentで行うのが適切

#### 推奨パターン

```typescript
// ❌ 避けるべき: Server Componentを直接テスト
// → モジュールモック、__mocks__ディレクトリ、alias設定が必要

// ✅ 推奨: Client Componentをテスト
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { SidebarClient } from "./SidebarClient";

const mockCategories = [
  { categoryKey: "population", categoryName: "人口・世帯", ... },
  // ...
];

const meta: Meta<typeof SidebarClient> = {
  title: "Components/Sidebar",
  component: SidebarClient,
  args: {
    categories: mockCategories,  // モックデータをpropsで渡す
  },
};

export default meta;
type Story = StoryObj<typeof SidebarClient>;

export const Default: Story = {};

export const Error: Story = {
  args: {
    categories: [],
    error: "データ取得に失敗しました",
  },
};
```

#### コンポーネント設計の指針

Server ComponentとClient Componentを適切に分離し、UIテストはClient Componentで行うこと:

```
// 本番環境
Sidebar (Server Component) - データ取得
└── SidebarClient (Client Component) - UI表示

// Storybook
SidebarClient (Client Component) - モックデータをpropsで渡してテスト
```

---

## 7. Tailwind CSS

### ユーティリティクラス優先
- インラインスタイル（`style`属性）ではなくユーティリティクラスを使用すること
- カスタムCSSは最小限に留めること

### クラス名の整理
- **cn()ユーティリティ**: クラス名は`cn()`ユーティリティ（`clsx` + `tailwind-merge`）で整理すること
- 長いクラス文字列は可読性のため適切に改行すること

#### 例
```typescript
// ✅ Good
<div className={cn(
  "flex items-center justify-between",
  "p-4 rounded-lg",
  isActive && "bg-blue-500 text-white"
)}>

// ❌ Bad
<div className="flex items-center justify-between p-4 rounded-lg bg-blue-500 text-white">
```

### 複雑なスタイル
- 複雑なスタイルはコンポーネント分割で対応すること
- 同じスタイルパターンが繰り返される場合は、共通コンポーネントに切り出すこと

---

## 8. モジュール管理

### Barrel Fileパターン

#### 基本ルール
- 各ディレクトリの`index.ts`は**再エクスポートのみ**を行うこと
- 外部からは`index.ts`を経由してインポートし、内部構造への直接依存（**Deep Import**）を避けること
- 使用されていないように見えても、公開インターフェースとしての`index.ts`は削除せずに残すこと

#### 正しい使用例
```typescript
// ✅ Good: Barrel Fileを経由
import { AdSenseAd } from "@/features/ads"

// ❌ Bad: Deep Import
import { AdSenseAd } from "@/features/ads/components/AdSenseAd"
```

#### メリット
- リファクタリングが容易
- 公開APIが明確
- import文がシンプル

### レイヤー分離
- `repositories/`, `services/`, `components/`等の責務を混同しないこと
- 各レイヤーの役割を明確にし、適切に分離すること

### Repositories/Actions/Services層のファイル構成規則

#### 1ファイル1関数の原則
- **原則**: `repositories/`, `actions/`, `services/`ディレクトリ内のファイルは、1ファイルに1つの関数のみを定義すること
- **理由**: ファイルの責務を明確にし、保守性と可読性を向上させるため
- **例外**: 関連する複数の関数が密接に連携する場合や、クラスベースの実装の場合は例外として認める

#### ファイル命名規則
- **原則**: ファイル名は関数名をケバブケース（スネークケース）で使用すること
- **例**: 
  - `fetchPrefectures()` → `fetch-prefectures.ts`
  - `listCities()` → `list-cities.ts`
  - `findRankingItem()` → `find-ranking-item.ts`
  - `listCitiesByPrefecture()` → `list-cities-by-prefecture.ts`
- **理由**: ファイル名から関数が明確に分かり、検索やナビゲーションが容易になる。ドキュメントの推奨（`docs/01_技術設計/01_システム概要/05_ドメイン内ディレクトリ構成.md`）と一致させる

### インポートの整理
- **重複インポート禁止**: eslintの`no-duplicate-imports`ルールに従い、同一ファイルからのインポートは1行にまとめること

#### 例
```typescript
// ✅ Good
import { ComponentA, ComponentB, type PropsA } from "@/components/feature"

// ❌ Bad
import { ComponentA } from "@/components/feature"
import { ComponentB } from "@/components/feature"
import type { PropsA } from "@/components/feature"
```

---

## 9. ロギング規約 (pino)

### 基本原則
- **pino使用**: 構造化ログを記録するため、`pino`（`@/lib/logger`）を使用すること
- **console.log/error/warn禁止**: サーバーサイドコードでは`console.log`、`console.error`、`console.warn`の使用を禁止
- **日本語ログ**: すべてのログメッセージは日本語で記述すること

### 構造化ログ形式
- **第一引数**: オブジェクト（コンテキスト）
- **第二引数**: 日本語メッセージ

#### 正しい例
```typescript
// ✅ Good
import { logger } from "@/lib/logger";

logger.info({ filePath, userId }, "CSVインポート開始");

logger.error(
  {
    err: error instanceof Error 
      ? { message: error.message, stack: error.stack }
      : error,
    userId,
    requestId
  },
  "API呼び出し失敗"
);

// ❌ Bad
console.log("CSVインポート開始");
console.error("エラー発生:", error);
```

### エラーオブジェクトの構造化
- **Error情報**: `error.message`と`error.stack`を構造化して含めること
- **機密情報の除外**: APIキー、トークン、パスワードなどの機密情報をログに含めないこと

### ログレベルの使い分け

| レベル | 用途 | 例 |
|:-------|:-----|:---|
| `debug` | デバッグ情報、詳細な処理フロー | 変数の値、内部状態 |
| `info` | 一般的な情報、重要な処理の開始・完了 | リクエスト受信、処理完了 |
| `warn` | 警告、エラーではないが注意が必要 | 非推奨機能の使用、リトライ発生 |
| `error` | エラー、処理の失敗 | API呼び出し失敗、バリデーションエラー |

---

## 10. ディレクトリ構造の例

```
src/
├── types/              # 公開型定義（複数機能で共有）
│   └── index.ts        # Barrel File
├── features/
│   └── user/
│       ├── types.ts    # feature内部型
│       ├── components/
│       ├── hooks/
│       ├── services/
│       └── index.ts    # Barrel File
├── utils/              # 共通ユーティリティ
│   └── index.ts
├── components/         # 共有UIコンポーネント
│   └── index.ts
├── hooks/              # 共通カスタムフック
│   └── index.ts
├── constants/          # 定数定義
│   └── index.ts
├── repositories/       # データアクセス層
│   ├── types.ts
│   └── index.ts
└── lib/                # ライブラリ設定
    └── logger.ts       # pinoロガー設定
```

---

## 11. ドキュメント

### アーキテクチャ決定記録 (ADR)
- **重要な変更の記録**: 以下の変更を行う際は、`docs/architecture/decisions/`にADRを作成すること:
  - ディレクトリ構造の変更
  - 主要なライブラリの導入
  - 横断的な設計変更
- **フォーマット**: `NNN-title.md`（例: `001-domain-structure.md`）

### コード生成ルール
- **コメントは日本語**: コード内のコメント、ドキュメンテーション文字列（docstring）はすべて日本語で記述すること
- **変数名は英語**: 変数名は英語で分かりやすく命名すること（ローマ字命名は禁止）



---

## 13. インタラクションスタイル（AI開発支援時）

### 回答の構成
以下の順序で回答すること:

1. **結論**（または修正内容の要約）
2. **計画**（既存コードの確認結果を含む）
3. **実装**（コードブロック）
4. **理由**（なぜその設計・抽出を行ったか）

### 基本姿勢
- **簡潔に**: 説明は簡潔にし、冗長な説明を避けること
- **計画→実装→検証**: 機能追加時は、まず計画（既存確認）、次に実装、最後に検証の順で進めること
- **理由の説明**: 何かを抽出した場合は、理由を説明すること
  - 例: 「`calculateTotal`を`utils/math.ts`に抽出し、Dashboardで再利用できるようにしました」

---

## 14. 開発フロー（まとめ）

```
┌─────────────────────┐
│  既存コードの確認    │
│ (@/utils, @/components, @/hooks)
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│     型定義作成       │
│ (interface/type)     │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│       実装           │
│ (型に従って実装)     │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│       検証           │
│ (型チェック) │
└─────────────────────┘
```

---

## 15. データ操作・管理

### D1データベースの操作
- **直接操作の推奨**: 開発環境において、既存データの変更（コンポーネントの移動や設定変更など）を行う場合は、シードファイルを更新して再シードするのではなく、**ローカルのD1データベース（SQLiteファイル）に対して直接SQLを実行すること**。
- **理由**:
  - シードの再実行は時間がかかり、開発効率が低下する
  - SQLによる直接操作であれば、変更が即座に反映され、確認サイクルが短縮される
  - 本番環境への反映手順（データ修正スクリプト等）の検証にもなる

---

## 16. ブログ・SNS記事執筆規約

### 記事ファイルの保存場所
ブログ記事 (`article.md`) と note 記事 (`note.md`) は、**blog ディレクトリ**配下の **rankingKey/year** ディレクトリに保存すること。
- パス形式: `.local/r2/blog/{rankingKey}/{year}/`
- 例: `.local/r2/ranking/prefecture/abandoned-cultivated-land-area/2014/data.json` を元に生成する場合 → `.local/r2/blog/abandoned-cultivated-land-area/2014/` に `article.md` および `note.md` を保存する。
- 同一の rankingKey/year に対応するブログ記事と note 記事は、同じ `.local/r2/blog/{rankingKey}/{year}/` ディレクトリ内に配置すること。

### ブログ記事執筆
ユーザーから「ブログ記事」の作成や執筆を指示された場合は、以下の手順を必ず実行すること：
- 提供または指定されたJSONデータを読み込む
- データ処理（基本統計、偏差値算出、7地方区分への地域分類）を実行する
- Frontmatter → 導入文 → データハイライト → コロプレス地図 → 上位5県 → 下位5県 → 地域別分析 → まとめ の構成で `.local/r2/blog/{rankingKey}/{year}/article.md` として保存（または更新）する
- 画像リンクには、`images`ディレクトリ内に実在するファイル名を使用すること
- **太字記法 (`**`)**: 括弧（全角・半角問わず）は太字の外に配置すること（例: `**重要**（注記）`）
- 見出しには絵文字を使用しないこと
- Frontmatter の値に YAML 特殊文字を含む場合は適切にエスケープすること

### note記事執筆
ユーザーから「note記事」の作成や執筆を指示された場合は、以下の手順を必ず実行すること：
- 同上のデータ処理・記事構成に従い、`.local/r2/blog/{rankingKey}/{year}/note.md` として保存する
- **テーブルの制限**: noteではMarkdownの表形式（`|`記法）が利用できないため、データ表示は必ず画像に置き換えること
- まとめセクションの各ポイントは `###` 見出しを使用すること
- その他、実画像名の使用や太字の括弧位置などはブログ記事のルールに準ずる

---

## チェックリスト

実装前に以下を確認すること:

- [ ] 既存の`@/utils`, `@/components`, `@/hooks`を確認したか？
- [ ] 型定義を先に作成したか？
- [ ] `any`型を使用していないか？
- [ ] マジックナンバーやハードコードを避けたか？
- [ ] 適切な動詞を使って関数名を付けたか？
- [ ] 200行を超えるファイルを分割したか？
- [ ] `console.log`ではなく`logger`を使用したか？
- [ ] Barrel File経由でインポートしているか？
- [ ] 重複コードを共通化したか？

---

**この規約を遵守することで、保守性が高く、拡張しやすいコードベースを維持できます。**
