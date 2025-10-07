# `StatisticsMetricCard` の `areaCode` の取り扱いに関する改善提案

## 1. 概要

現在、`StatisticsMetricCard` コンポーネントは `areaCode` を必須の prop として受け取っています。しかし、全国計を表示する際には常に `areaCode="00000"` をハードコーディングする必要があり、冗長です。

このドキュメントでは、`areaCode` にデフォルト値を設定し、動的なページ（例: `/[areacode]/page.tsx`）での利用を容易にすることで、コンポーネントの汎用性とコードの簡潔性を向上させる方法を提案します。

## 2. 現状の課題

`src/components/subcategories/population/households/HouseholdsPage.tsx` では、以下のように全国計を表示するために `areaCode` がハードコーディングされています。

```tsx
// HouseholdsPage.tsx
<StatisticsMetricCard
  params={{ ... }}
  areaCode="00000" // 全国計のために常に指定が必要
  title="全国総世帯数"
  unit="世帯"
/>
```

この実装では、都道府県別のページなど、`areaCode` を動的に渡す必要のあるページと、全国計を表示するページで、呼び出し側の記述が少し異なります。

## 3. 提案内容

`StatisticsMetricCard` コンポーネントの `areaCode` prop をオプショナルにし、デフォルト値として全国を示す `"00000"` を設定します。

### `StatisticsMetricCard` のシグネチャ変更

```typescript
// 変更前
interface StatisticsMetricCardProps {
  // ... other props
  areaCode: string;
}

// 変更後
interface StatisticsMetricCardProps {
  // ... other props
  areaCode?: string; // オプショナルにする
}

export const StatisticsMetricCard: React.FC<StatisticsMetricCardProps> = ({
  // ... other props
  areaCode = "00000", // デフォルト値を設定
}) => {
  // ... コンポーネントの実装
};
```

## 4. メリット

この変更により、以下のメリットが期待できます。

-   **汎用性の向上**:
    -   `areaCode` を渡せば地域別データ、渡さなければ全国データ、というように、単一のコンポーネントで両方のケースを直感的に扱えます。
-   **コードの簡潔化**:
    -   全国計を表示する際に `areaCode="00000"` を毎回記述する必要がなくなり、呼び出し側のコードがスッキリします。
-   **意図の明確化**:
    -   `areaCode` prop の指定がない場合は「全国計を表示している」という意図がコードから明確に読み取れるようになります。
-   **保守性の向上**:
    -   全国計を示すコード `"00000"` がコンポーネント内にカプセル化されるため、将来この値が変更になった場合でも修正箇所が `StatisticsMetricCard` の一箇所で済みます。

## 5. 実装例

### 例1: 全国計ページの呼び出し (HouseholdsPage.tsx)

**変更前**
```tsx
<StatisticsMetricCard
  params={{ statsDataId, cdCat01: cdCat01.totalHouseholds }}
  areaCode="00000"
  title="全国総世帯数"
  unit="世帯"
/>
```

**変更後**
```tsx
<StatisticsMetricCard
  params={{ statsDataId, cdCat01: cdCat01.totalHouseholds }}
  // areaCode を省略。デフォルトで "00000" が使われる
  title="全国総世帯数"
  unit="世帯"
/>
```

### 例2: 都道府県別ページの呼び出し (`[areacode]/page.tsx`)

URL パラメータから取得した `areaCode` をそのまま渡すことで、地域別の統計値を表示できます。

```tsx
// src/app/[category]/[subcategory]/[areacode]/page.tsx

export default function AreaDetailPage({ params }: { params: { areacode: string } }) {
  const { areacode } = params;

  return (
    <div>
      {/* ... */}
      <StatisticsMetricCard
        params={{ ... }}
        areaCode={areacode} // URLから取得したコードを渡す
        title="東京都の総世帯数" // titleも動的に変更
        unit="世帯"
      />
      {/* ... */}
    </div>
  );
}
```
