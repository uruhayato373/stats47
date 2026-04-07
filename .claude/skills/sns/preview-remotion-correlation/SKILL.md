---
name: preview-remotion-correlation
description: 実データで Remotion Studio 相関散布図プレビューを上書きする。Use when user says "相関プレビュー", "correlation プレビュー", "散布図プレビュー". 2指標の相関を視覚化.
disable-model-invocation: true
---

実データで Remotion Studio の相関散布図（Correlation）プレビュー用データを上書きする。
Studio が HMR で自動反映するため、リアルタイムにプレビューを確認できる。

## 引数

ユーザーから以下を確認すること:
- **rankingKeyX**: X軸のランキングキー（例: average-income）
- **rankingKeyY**: Y軸のランキングキー（例: university-advancement-rate）

## 手順

### Step 1: データ取得

DB または `.local/r2/` から2つのランキングデータを取得し、47都道府県の散布図データを構築する。

各ポイントには以下が必要:

```typescript
interface ScatterPoint {
  areaName: string;  // 都道府県名
  x: number;         // X軸の値
  y: number;         // Y軸の値
}
```

ピアソン相関係数 `pearsonR` も算出する:

```
r = Σ((xi - x̄)(yi - ȳ)) / √(Σ(xi - x̄)² × Σ(yi - ȳ)²)
```

### Step 2: preview-data-correlation.ts を上書き

`apps/remotion/src/utils/preview-data-correlation.ts` を以下の形式で上書きする。

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
  titleX: "<X軸タイトル>",
  titleY: "<Y軸タイトル>",
  unitX: "<X軸単位>",
  unitY: "<Y軸単位>",
  pearsonR: 0.0,
  points: [
    { areaName: "北海道", x: 0, y: 0 },
    // ... 47件すべて
  ],
};
```

### Step 3: 確認

上書き後、ユーザーに以下を報告する:
- X軸・Y軸の指標名と単位
- ピアソン相関係数
- ポイント数

## 対象コンポジション

この preview-data を参照するコンポジション:
- `CorrelationX-Scatter`（X 投稿用 1200x630）
- `CorrelationScatterOgp`（OGP 画像 1200x630）

## 参照

- `apps/remotion/src/utils/preview-data-correlation.ts` — 上書き対象ファイル
