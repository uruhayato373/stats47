# Type: correlation（相関散布図）

2 つのランキング指標の相関散布図プレビュー用データを上書きする。

## 引数

- **rankingKeyX** (必須): X 軸のランキングキー（例: average-income）
- **rankingKeyY** (必須): Y 軸のランキングキー（例: university-advancement-rate）

## 手順

### Step 1: データ取得

DB または `.local/r2/` から 2 つのランキングデータを取得し、47 都道府県の散布図データを構築する。

各ポイントの型:

```typescript
interface ScatterPoint {
  areaName: string;  // 都道府県名
  x: number;
  y: number;
}
```

ピアソン相関係数 `pearsonR` を算出:

```
r = Σ((xi - x̄)(yi - ȳ)) / √(Σ(xi - x̄)² × Σ(yi - ȳ)²)
```

### Step 2: `apps/remotion/src/utils/preview-data-correlation.ts` を上書き

```typescript
export interface ScatterPoint {
  areaName: string;
  x: number;
  y: number;
}

export interface CorrelationPreviewData {
  titleX: string;
  titleY: string;
  unitX: string;
  unitY: string;
  points: ScatterPoint[];
  pearsonR: number;
}

export const previewDataCorrelation: CorrelationPreviewData = {
  titleX: "<X 軸タイトル>",
  titleY: "<Y 軸タイトル>",
  unitX: "<X 軸単位>",
  unitY: "<Y 軸単位>",
  pearsonR: 0.0,
  points: [
    { areaName: "北海道", x: 0, y: 0 },
    // ... 47 件すべて
  ],
};
```

### Step 3: 確認・報告

- X 軸 / Y 軸の指標名と単位
- ピアソン相関係数
- ポイント数

## 対象コンポジション

- `CorrelationX-Scatter` (1200x630)
- `CorrelationScatterOgp` (1200x630)

## 参照

- `apps/remotion/src/utils/preview-data-correlation.ts`
