# RankingClient.tsx リファクタリング分析

## 現在の構造

### ファイル構成
```
src/components/ranking/RankingClient/
├── index.ts           (エクスポート)
├── types.ts           (型定義)
└── RankingClient.tsx  (メインコンポーネント - 88行)
```

### RankingClient.tsxの構成
- 全体: 88行
- メインコンテンツ部分: 34-53行（約20行）
- 右側のリスト部分: 56-84行（約30行）

### 右側のリスト部分のコード（56-84行）
```tsx
{/* 右側のリスト */}
<div className="lg:w-60 flex-shrink-0">
  <div className="lg:border-l border-gray-200 dark:border-gray-700">
    <div className="bg-white dark:bg-gray-800 p-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        統計項目
      </h3>
      <nav className="space-y-2" aria-label="統計項目">
        {tabOptions.map((option) => {
          const href = `/${categoryId}/${subcategoryId}/ranking/${option.key}`;
          const isActive = activeRankingId === option.key;

          return (
            <Link
              key={option.key}
              href={href}
              className={`block w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400"
                  : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
              }`}
            >
              {option.label}
            </Link>
          );
        })}
      </nav>
    </div>
  </div>
</div>
```

---

## 切り分けのメリット

### 1. 関心の分離（Separation of Concerns）
- **レイアウト**と**ナビゲーション**を分離
- 各コンポーネントが単一の責任を持つ
- より明確なコンポーネント構造

```tsx
// 分離後
<RankingClient>
  <MainContent />
  <RankingNavigation /> {/* 独立したコンポーネント */}
</RankingClient>
```

### 2. 再利用性の向上
他の画面でも統計項目のナビゲーションリストを使用できる可能性

```tsx
// 例: ダッシュボードでも同じナビゲーションを使用
<DashboardPage>
  <RankingNavigation categoryId={...} subcategoryId={...} ... />
</DashboardPage>
```

### 3. テスト容易性
- ナビゲーションリストを個別にテスト可能
- モックやスタブが簡単
- ユニットテストが書きやすい

```tsx
// RankingNavigation.test.tsx
describe('RankingNavigation', () => {
  it('renders all options', () => {
    render(<RankingNavigation tabOptions={mockOptions} ... />);
    expect(screen.getAllByRole('link')).toHaveLength(5);
  });

  it('highlights active option', () => {
    render(<RankingNavigation activeRankingId="option1" ... />);
    expect(screen.getByText('Option 1')).toHaveClass('bg-indigo-50');
  });
});
```

### 4. パフォーマンス最適化
メモ化により不要な再レンダリングを防止

```tsx
// メインコンテンツの更新時、ナビゲーションは再レンダリングされない
export const RankingNavigation = React.memo(({ ... }) => {
  // ...
});
```

### 5. 可読性の向上
- RankingClient.tsxがよりシンプルに
- コードの意図が明確
- レビューしやすい

### 6. 保守性の向上
- ナビゲーションの変更が独立して可能
- バグ修正の影響範囲が限定的
- 将来的な機能追加が容易

---

## 切り分けのデメリット

### 1. ファイル数の増加
```
RankingClient/
├── index.ts
├── types.ts
├── RankingClient.tsx
└── RankingNavigation.tsx  (新規)
```

### 2. Props のドリリング
親から子へpropsを渡す必要がある

```tsx
// Before: 直接使用
{tabOptions.map(...)}

// After: propsとして渡す
<RankingNavigation
  tabOptions={tabOptions}
  activeRankingId={activeRankingId}
  categoryId={categoryId}
  subcategoryId={subcategoryId}
/>
```

### 3. 初期の複雑さ
小規模なプロジェクトでは過度な抽象化になる可能性

### 4. コンテキストの分散
- コードを追う際に複数ファイルを開く必要
- 全体像の把握に時間がかかる

---

## 現状分析

### コードの規模
- **RankingClient.tsx: 88行** → 比較的小規模
- **右側のリスト: 30行** → 独立させる価値あり
- **依存関係: 4つのprops** → 適度な複雑さ

### 複雑さ
- **ロジック**: シンプル（マップと条件分岐のみ）
- **状態管理**: なし（propsのみ）
- **副作用**: なし

### 再利用性
- 現時点では`RankingClient`内でのみ使用
- 将来的に他の場所で使う可能性は**低い**
- ただし、ダッシュボードとランキングで共通化する可能性は**ある**

---

## 推奨事項

### 結論: **切り分けを推奨します**

理由：
1. **88行は適度なサイズだが、将来的に機能追加が予想される**
2. **ナビゲーション部分は独立した責任を持つ**
3. **テストしやすくなる**
4. **パフォーマンス最適化の余地がある**
5. **将来的な再利用の可能性がある**

ただし、以下の条件付き：
- プロジェクトが成長している
- 今後の機能追加が予想される
- テストを充実させたい

---

## 具体的なリファクタリング案

### ステップ1: RankingNavigationコンポーネントを作成

```tsx
// src/components/ranking/RankingClient/RankingNavigation.tsx
"use client";

import React from "react";
import Link from "next/link";
import { RankingOption } from "./types";

export interface RankingNavigationProps<T extends string> {
  categoryId: string;
  subcategoryId: string;
  activeRankingId: T;
  tabOptions: RankingOption<T>[];
  title?: string;
}

/**
 * ランキング統計項目ナビゲーションリスト
 *
 * 統計項目の一覧を表示し、アクティブな項目をハイライトする。
 *
 * @template T - 統計項目のキーの型
 */
export const RankingNavigation = React.memo(function RankingNavigation<
  T extends string
>({
  categoryId,
  subcategoryId,
  activeRankingId,
  tabOptions,
  title = "統計項目",
}: RankingNavigationProps<T>) {
  return (
    <div className="lg:w-60 flex-shrink-0">
      <div className="lg:border-l border-gray-200 dark:border-gray-700">
        <div className="bg-white dark:bg-gray-800 p-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {title}
          </h3>
          <nav className="space-y-2" aria-label="統計項目">
            {tabOptions.map((option) => {
              const href = `/${categoryId}/${subcategoryId}/ranking/${option.key}`;
              const isActive = activeRankingId === option.key;

              return (
                <Link
                  key={option.key}
                  href={href}
                  className={`block w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400"
                      : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
                  }`}
                  aria-current={isActive ? "page" : undefined}
                >
                  {option.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
});
```

### ステップ2: RankingClient.tsxを更新

```tsx
// src/components/ranking/RankingClient/RankingClient.tsx
"use client";

import React from "react";
import { useParams } from "next/navigation";
import { EstatRankingClient } from "@/components/ranking";
import { RankingClientProps } from "./types";
import { RankingNavigation } from "./RankingNavigation";

/**
 * 汎用的なランキング表示クライアントコンポーネント
 *
 * 統計項目のランキング表示とナビゲーションを提供する。
 * 地図とデータテーブルを表示し、右側に統計項目のリストを表示する。
 *
 * @template T - 統計項目のキーの型
 * @param props - RankingClientProps
 * @returns JSX.Element
 */
export function RankingClient<T extends string>({
  rankings,
  subcategory,
  activeRankingId,
  tabOptions,
}: RankingClientProps<T>) {
  const params = useParams();
  const categoryId = params.category as string;
  const subcategoryId = params.subcategory as string;

  const activeRanking = rankings[activeRankingId];

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* メインコンテンツ */}
      <div className="flex-1">
        <EstatRankingClient
          params={{
            statsDataId: activeRanking.statsDataId,
            cdCat01: activeRanking.cdCat01,
          }}
          subcategory={{
            ...subcategory,
            unit: activeRanking.unit,
            name: activeRanking.name,
          }}
          title={`${activeRanking.name}ランキング`}
          options={{
            colorScheme: subcategory.colorScheme || "interpolateGreens",
            divergingMidpoint: "zero",
          }}
          mapWidth={800}
          mapHeight={600}
        />
      </div>

      {/* ナビゲーション */}
      <RankingNavigation
        categoryId={categoryId}
        subcategoryId={subcategoryId}
        activeRankingId={activeRankingId}
        tabOptions={tabOptions}
      />
    </div>
  );
}
```

### ステップ3: index.tsを更新

```tsx
// src/components/ranking/RankingClient/index.ts
export { RankingClient } from "./RankingClient";
export { RankingNavigation } from "./RankingNavigation";
export type { RankingData, RankingOption, RankingClientProps } from "./types";
export type { RankingNavigationProps } from "./RankingNavigation";
```

---

## リファクタリング後の構造

```
src/components/ranking/RankingClient/
├── index.ts                  (エクスポート)
├── types.ts                  (型定義)
├── RankingClient.tsx         (メインコンポーネント - 約60行)
└── RankingNavigation.tsx     (ナビゲーション - 約60行)
```

### 利点
- RankingClient.tsxが88行 → 約60行に削減
- ナビゲーションが独立したコンポーネント（約60行）
- より明確な責任の分離
- テストが容易

---

## テスト例

### RankingNavigation.test.tsx

```tsx
import { render, screen } from '@testing-library/react';
import { RankingNavigation } from './RankingNavigation';

const mockTabOptions = [
  { key: 'total', label: '総人口' },
  { key: 'male', label: '男性人口' },
  { key: 'female', label: '女性人口' },
];

describe('RankingNavigation', () => {
  it('すべてのオプションを表示する', () => {
    render(
      <RankingNavigation
        categoryId="population"
        subcategoryId="composition"
        activeRankingId="total"
        tabOptions={mockTabOptions}
      />
    );

    expect(screen.getByText('総人口')).toBeInTheDocument();
    expect(screen.getByText('男性人口')).toBeInTheDocument();
    expect(screen.getByText('女性人口')).toBeInTheDocument();
  });

  it('アクティブなオプションをハイライトする', () => {
    render(
      <RankingNavigation
        categoryId="population"
        subcategoryId="composition"
        activeRankingId="male"
        tabOptions={mockTabOptions}
      />
    );

    const maleLink = screen.getByText('男性人口');
    expect(maleLink).toHaveClass('bg-indigo-50');
    expect(maleLink).toHaveClass('text-indigo-700');
  });

  it('正しいhrefを生成する', () => {
    render(
      <RankingNavigation
        categoryId="population"
        subcategoryId="composition"
        activeRankingId="total"
        tabOptions={mockTabOptions}
      />
    );

    const link = screen.getByText('総人口').closest('a');
    expect(link).toHaveAttribute('href', '/population/composition/ranking/total');
  });

  it('カスタムタイトルを表示する', () => {
    render(
      <RankingNavigation
        categoryId="population"
        subcategoryId="composition"
        activeRankingId="total"
        tabOptions={mockTabOptions}
        title="カスタムタイトル"
      />
    );

    expect(screen.getByText('カスタムタイトル')).toBeInTheDocument();
  });
});
```

---

## パフォーマンス最適化

### React.memoの活用

```tsx
export const RankingNavigation = React.memo(
  function RankingNavigation<T extends string>({ ... }) {
    // ...
  },
  (prevProps, nextProps) => {
    // カスタム比較関数（オプション）
    return (
      prevProps.activeRankingId === nextProps.activeRankingId &&
      prevProps.tabOptions === nextProps.tabOptions &&
      prevProps.categoryId === nextProps.categoryId &&
      prevProps.subcategoryId === nextProps.subcategoryId
    );
  }
);
```

### useMemoでhrefを最適化（さらなる最適化）

```tsx
const navigationItems = React.useMemo(
  () =>
    tabOptions.map((option) => ({
      ...option,
      href: `/${categoryId}/${subcategoryId}/ranking/${option.key}`,
      isActive: activeRankingId === option.key,
    })),
  [tabOptions, categoryId, subcategoryId, activeRankingId]
);
```

---

## 段階的なリファクタリング

### フェーズ1: 切り出し（現在）
- RankingNavigationコンポーネントを作成
- RankingClient.tsxから分離

### フェーズ2: 機能拡張（将来）
- フィルタリング機能
- 検索機能
- ソート機能

### フェーズ3: 再利用（将来）
- ダッシュボードでも使用
- 他のカテゴリーでも使用

---

## まとめ

### 推奨: **切り分けを実施**

**理由:**
1. 関心の分離が明確になる
2. テストが容易になる
3. パフォーマンス最適化の余地がある
4. 将来的な機能拡張に対応しやすい
5. 88行は小さいが、ナビゲーション部分（30行）は独立した責任を持つ

**実施タイミング:**
- 今すぐ実施してOK
- または、次の機能追加時に実施

**実施方法:**
1. RankingNavigation.tsxを作成
2. RankingClient.tsxを更新
3. index.tsを更新
4. テストを追加（オプションだが推奨）

**期待効果:**
- コードの可読性向上: ⭐⭐⭐⭐
- 保守性向上: ⭐⭐⭐⭐
- テスト容易性: ⭐⭐⭐⭐⭐
- パフォーマンス: ⭐⭐⭐（メモ化により）
- 再利用性: ⭐⭐⭐（将来的に）

---

## 参考: 切り分けない場合

以下の場合は切り分けない方が良い：
- プロジェクトが非常に小規模
- 今後の拡張予定がない
- 一度作って終わりのプロトタイプ
- チームメンバーが少数で全体を把握しやすい

しかし、現在のプロジェクトを見る限り、**切り分けを推奨**します。
