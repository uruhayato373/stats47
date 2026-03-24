# Visualization Package

このパッケージは、プロジェクト全体のデータ可視化コンポーネントを管理します。
D3.js を使用して、様々なチャートを提供します。

## 設計思想

### マルチアスペクト比対応

Web ダッシュボードに加え、PNG 画像生成・Remotion 動画（YouTube 16:9 / Instagram Reels 9:16）などで同じチャートを再利用するため、アスペクト比が変わってもレイアウトが破綻しないようにしています。

-   **目的**: 様々なアスペクト比（横長・正方形・縦長）でもマージン・フォント・軸が妥当にスケールし、画像・動画出力で一貫した見た目を保つ。
-   **プリセット**: `src/shared/presets.ts` の `AspectRatioPreset`（`landscape` / `square` / `portrait`）と `DIMENSION_PRESETS` で代表解像度を定義しています。
    -   `landscape`: 1920×1080（16:9）
    -   `square`: 1080×1080（1:1）
    -   `portrait`: 1080×1920（9:16）
-   **動的マージン・フォント**: 固定 px ではなく、各コンポーネントのデフォルトサイズに対する**比率**でマージン・フォントサイズを計算します。共通ヘルパーは `src/shared/layout.ts`（`computeChartLayout`, `computeMarginsByRatio`, `computeFontSize`）で inner サイズ・フォント算出を提供します。比率の具体的な値は各コンポーネントが持つ設計です。
-   **SVG の統一**: D3 コンポーネントの SVG は `viewBox={0 0 ${width} ${height}}` とし、`width` / `height` の HTML 属性は付けません。スタイルは Tailwind の `w-full h-auto` に統一しています。

## テスト

出力経路（ブラウザ表示・PNG 画像生成・動画）に応じて、次の 4 層でテストを組み合わせています。

-   **層 1 — レイアウト計算のユニットテスト（Vitest / Node）**: マージン・フォント・tick 数などの計算を検証。コストが小さく最優先で実施します。
-   **層 2 — SVG 構造のスナップショット（Vitest / jsdom）**: viewBox や要素数・属性の検証。
-   **層 3 — PNG ゴールデンイメージ（Vitest + sharp + pixelmatch）**: 画像生成・動画用途では最重要。実際の PNG をゴールデン画像とピクセル比較します。
-   **層 4 — ブラウザ表示の視覚回帰（Playwright + reg-suit）**: Storybook のプリセット Story を対象にスクリーンショット比較。

### コマンドと運用

| 操作 | コマンド |
|------|----------|
| 通常のテスト実行 | `npm run test:run` |
| ゴールデン画像の更新 | `UPDATE_GOLDEN=true npm run test:run` |

ゴールデン画像は `__golden__/` に格納し **Git にコミット**します。`*-actual.png` と `*-diff.png` はデバッグ用のため `.gitignore` で除外し、コミットしません。

## Storybook

コンポーネントの視覚的確認とテストのために Storybook を使用しています。

### アスペクト比プリセットのStory

各チャートコンポーネントには、標準的なアスペクト比に対応するStoryが用意されています。これにより、レイアウトの堅牢性を確認し、視覚回帰テストの対象とすることができます。

新しいチャートコンポーネントを追加する際や、既存のコンポーネントを更新する際には、これらのプリセットStoryを追加・更新することが推奨されます。

#### Storyの追加方法

以下は、Storyファイルにアスペクト比プリセットを追加する標準的なパターンです。

```typescript
import type { Meta, StoryObj } from "@storybook/react";
import { DIMENSION_PRESETS } from "../../../shared/presets";
import { YourChartComponent } from "./YourChartComponent";

// ... (meta, mock data)

export const Default: Story = {
  args: {
    // ... default arguments
    width: 800,
    height: 500,
  },
};

// ... (other stories)

export const Landscape: Story = {
  args: {
    ...Default.args,
    width: DIMENSION_PRESETS.landscape.width,
    height: DIMENSION_PRESETS.landscape.height,
  },
};

export const Square: Story = {
  args: {
    ...Default.args,
    width: DIMENSION_PRESETS.square.width,
    height: DIMENSION_PRESETS.square.height,
  },
};

export const Portrait: Story = {
  args: {
    ...Default.args,
    width: DIMENSION_PRESETS.portrait.width,
    height: DIMENSION_PRESETS.portrait.height,
  },
};
```

## ディレクトリ構成

-   `src/d3/`: D3.js を直接使用して実装されたコンポーネント。
-   `src/shared/`: D3 コンポーネントから利用される共通の型、プリセット、ユーティリティ。
