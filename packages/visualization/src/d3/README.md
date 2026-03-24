# D3 Visualization Components

このディレクトリには、D3.js を直接使用して実装されたデータ可視化コンポーネントが含まれています。

## 設計思想

### Props・型定義の共通化

D3 コンポーネントの Props およびデータ型定義は、一貫性と保守性を高めるために共通化されています。

**目的**:
各コンポーネントで個別に定義されていたデータノード型や Props インターフェースを整理し、共通の基盤型を導入することで、型定義の重複を排除し、コードの一貫性を向上させます。

**共通基盤型**:
`packages/visualization/src/d3/types/base.ts` に以下の共通型が定義されています。

-   **`ChartDataNode`**: フラットなカテゴリ×値のデータノード。BarChart, ColumnChart, DonutChart などで利用されます。
    ```typescript
    export interface ChartDataNode {
      name: string; // カテゴリ名
      value: number; // 主値
      code?: string; // コード（識別用）
      [key: string]: string | number | undefined; // 積み上げ・複数系列用の追加値
    }
    ```
-   **`HierarchyDataNode`**: 階層データノード。SunburstChart, TreemapChart などで利用されます。
    ```typescript
    export interface HierarchyDataNode {
      name: string;
      value?: number;
      children?: HierarchyDataNode[];
      color?: string;
      metadata?: Record<string, unknown>;
    }
    ```
-   **`BaseD3ChartProps`**: 全 D3 チャートコンポーネントに共通する基本的な Props。
    ```typescript
    export interface BaseD3ChartProps {
      width?: number;
      height?: number;
      title?: string;
      unit?: string;
      colors?: readonly string[];
      isLoading?: boolean;
      className?: string;
    }
    ```
-   **`MarginProps`**: マージン指定を持つチャートに共通する Props。
    ```typescript
    export interface MarginProps {
      marginTop?: number;
      marginRight?: number;
      marginBottom?: number;
      marginLeft?: number;
    }
    ```

**各コンポーネントでの利用**:
各コンポーネントの Props インターフェースは、これらの共通基盤型を `extends` または `Pick` して利用します。
例えば、`BarChartProps` は `BaseD3ChartProps` と `MarginProps` を継承し、`BarDataNode` は `ChartDataNode` のエイリアスとして定義されます。

**共通化の対象外とした型**:
以下の型は、その固有の構造や用途のため、共通化の対象外とされています。

-   **`ScatterplotDataNode`**: 2次元座標 (`x`, `y`) を持つため。
-   **`D3PyramidChartData`**: 対称2軸 (`male`, `female`) という固有の構造を持つため。
-   **`VisualizationDataPoint`**: 地図コンポーネント固有の用途であり、`name` フィールドを持たないため。
-   **`BarChartRaceFrame`**: 時系列フレームという固有の構造を持つため。

**後方互換性**:
型定義の共通化は、既存の型名をエイリアスとして維持することで、外部からの import に破壊的変更がないように配慮されています。
例えば、`BarDataNode` は引き続き `@stats47/visualization` から import 可能です。

## ディレクトリ構成

-   `components/`: 各 D3 チャートコンポーネントのソースコード。
-   `types/`: D3 コンポーネント全体で利用される型定義。
    -   `base.ts`: 共通データノード型、共通 Props。
    -   `d3.ts`: D3.js 関連のユーティリティ型、PyramidChart 固有の型。
    -   `map-chart.ts`: 地図コンポーネント固有の型。
