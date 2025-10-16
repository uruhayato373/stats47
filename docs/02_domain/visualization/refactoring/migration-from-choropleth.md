# choroplethドメインからの移行記録

**移行日**: 2025-10-16  
**バージョン**: 1.0  
**対象**: ドメイン構造の再編成

---

## 移行理由

### 1. ドメイン名の適切性
- **旧**: `choropleth` - 可視化手法の一つに過ぎない
- **新**: `visualization` - 可視化全般を包括する適切なドメイン名

### 2. 機能拡張の必要性
- D3.jsとRechartsの両方で可視化を実装予定
- コロプレスマップ以外にも様々なチャート（棒グラフ、折れ線グラフ、散布図など）を追加予定
- 同じチャートタイプでも実装ライブラリが異なる場合がある

### 3. 保守性の向上
- ライブラリごとの実装を明確に分離
- チャートタイプごとの仕様を整理
- 一貫したドキュメント構造

## 変更内容

### 1. ディレクトリ構造の変更

#### 変更前
```
docs/02_domain/choropleth/
├── 仕様/
└── 実装/
```

#### 変更後
```
docs/02_domain/visualization/
├── 仕様/
│   ├── overview.md                      # 可視化全体の概要
│   ├── library-selection-guide.md       # ライブラリ選択ガイド
│   ├── d3js-implementation-guide.md     # D3.js実装ガイド
│   ├── recharts-implementation-guide.md # Recharts実装ガイド
│   ├── chart-types/
│   │   ├── choropleth-map.md           # コロプレスマップ仕様
│   │   ├── bar-chart.md                # 棒グラフ仕様
│   │   ├── line-chart.md               # 折れ線グラフ仕様
│   │   ├── scatter-plot.md             # 散布図仕様
│   │   └── heatmap.md                  # ヒートマップ仕様
│   └── accessibility.md                 # アクセシビリティガイド
├── 実装/
│   ├── d3js/
│   │   └── choropleth-implementation.md
│   └── recharts/
│       └── common-patterns.md
└── リファクタリング/
    └── migration-from-choropleth.md     # このファイル
```

### 2. ドキュメントの再編成

#### 新規作成されたドキュメント

1. **overview.md**
   - 可視化ドメイン全体の概要
   - 使用ライブラリ（D3.js、Recharts）の説明
   - 設計原則の定義

2. **library-selection-guide.md**
   - D3.js vs Recharts の判断基準
   - パフォーマンス比較
   - 使い分けの指針

3. **d3js-implementation-guide.md**
   - D3.js実装のガイドライン
   - React統合パターン
   - パフォーマンス最適化
   - アクセシビリティ対応

4. **recharts-implementation-guide.md**
   - Recharts実装のガイドライン
   - 宣言的APIの活用
   - レスポンシブ対応
   - テーマシステム

5. **chart-types/配下の仕様書**
   - 各チャートタイプの詳細仕様
   - ライブラリ別の使い分け
   - データ構造とコンポーネント設計

6. **accessibility.md**
   - WCAG 2.1 AA準拠のガイドライン
   - キーボードナビゲーション
   - スクリーンリーダー対応
   - 色とコントラスト

#### 既存ドキュメントの参照

- `docs/01_development_guide/07_d3js_choropleth_guide.md` への参照を追加
- 新しい実装ガイドから既存ガイドへのリンクを設定

### 3. 実装構造の変更

#### コンポーネント構造
```
src/components/charts/
├── d3js/
│   ├── ChoroplethMap.tsx
│   ├── BarChart.tsx
│   └── LineChart.tsx
└── recharts/
    ├── BarChart.tsx
    ├── LineChart.tsx
    └── ScatterPlot.tsx
```

#### ライブラリ構造
```
src/lib/visualization/
├── d3js/
│   ├── choropleth/
│   ├── bar-chart/
│   └── common/
└── recharts/
    ├── bar-chart/
    ├── line-chart/
    └── common/
```

## 影響範囲

### 1. ドキュメント参照の更新

以下のドキュメントで`choropleth`への参照を更新する必要があります：

1. **docs/INDEX.md**
   - ドメイン一覧の更新
   - リンクの修正

2. **docs/01_development_guide/07_d3js_choropleth_guide.md**
   - 新しいvisualizationドメインへの参照追加
   - 関連ドキュメントのリンク更新

3. **その他の関連ドキュメント**
   - コロプレスマップに言及しているドキュメント
   - 可視化関連のドキュメント

### 2. コード参照の更新

以下のコードでドメイン参照を更新する必要があります：

1. **コンポーネントのインポート**
   ```typescript
   // 変更前
   import { ChoroplethMap } from '@/components/charts/choropleth/ChoroplethMap';
   
   // 変更後
   import { ChoroplethMap } from '@/components/charts/d3js/ChoroplethMap';
   ```

2. **ライブラリのインポート**
   ```typescript
   // 変更前
   import { createProjection } from '@/lib/visualization/choropleth/projection';
   
   // 変更後
   import { createProjection } from '@/lib/visualization/d3js/choropleth/projection';
   ```

### 3. 設定ファイルの更新

1. **TypeScript設定**
   - パスエイリアスの更新（必要に応じて）

2. **ビルド設定**
   - ファイルパスの更新（必要に応じて）

## 移行後のメリット

### 1. 明確な構造
- ライブラリごとに実装を分離
- チャートタイプごとの仕様を整理
- ドメイン境界が明確

### 2. 選択ガイド
- どちらのライブラリを使うべきか明確
- パフォーマンス比較が可能
- 使い分けの指針が提供される

### 3. 拡張性
- 新しいチャートタイプを追加しやすい
- 新しいライブラリの統合が容易
- 一貫した構造で管理

### 4. 一貫性
- 可視化全体で統一された方針
- 共通のパターンとベストプラクティス
- 保守しやすいドキュメント構造

### 5. 保守性
- ドメイン境界が明確で変更しやすい
- 責任の分離が明確
- テストしやすい構造

## 今後の拡張予定

### 1. 新機能
- 3D可視化（Three.js）
- リアルタイムデータ更新
- カスタムダッシュボード
- データエクスポート機能

### 2. 新ライブラリ
- Chart.js（軽量チャート）
- Plotly.js（科学計算向け）
- Observable Plot（D3.jsベース）

### 3. 新チャートタイプ
- サンキー図
- ツリーマップ
- ネットワーク図
- ガントチャート

## 関連ドキュメント

- [可視化ドメイン概要](02_domain/visualization/specifications/overview.md)
- [ライブラリ選択ガイド](library-selection-guide.md)
- [D3.js実装ガイド](d3js-implementation-guide.md)
- [Recharts実装ガイド](recharts-implementation-guide.md)
- [既存のD3.jsコロプレスガイド](../../../01_development_guide/07_d3js_choropleth_guide.md)

---

**更新履歴**:
- 2025-10-16: 初版作成
