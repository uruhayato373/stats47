# apps/remotion

都道府県ランキングの画像・動画生成パイプライン。
Remotion を使用して React コンポーネントから PNG / MP4 を生成する。

## Remotion Studio

```bash
npm run start --workspace remotion
```

ブラウザでコンポジションのプレビュー・デザイン調整が可能。

### Studio プレビューデータ

Studio で表示されるデータは `src/utils/preview-data.ts` が提供する。

- **デフォルト**: `@stats47/mock` パッケージのモックデータ
- **実データに切替**: `/preview-remotion` スキルで `preview-data.ts` を実データに上書き → HMR で即反映

各 Preview コンポーネントは `resolveRankingData({ meta, allEntries })` を使用し、props が未指定の場合に `previewData` にフォールバックする。

## コンポジション一覧

### RankingShorts

| ID | サイズ | 用途 |
|----|--------|------|
| `RankingShort-YouTube` | 1080x1920 | YouTube Shorts / Instagram リール動画 |
| `RankingShort-TikTok` | 1080x1920 | TikTok リール動画（全47都道府県） |
| `RankingShort-GES` | 1080x1920 | GES 背景版リール動画 |
| `RankCard` | 1080x1920 | ランクカード |
| `RankCard-GES` | 1080x1920 | ランクカード（GES 背景） |
| `RankingTable` | 1080x1920 | ランキングテーブル |
| `ReelLastPage` | 1080x1920 | Reels ラストページ |
| `RankingTitle` | 1080x1920 | イントロフック |

### Layouts

| ID | サイズ | 用途 |
|----|--------|------|
| `LayoutPreview-Portrait` | 1080x1920 | 縦型レイアウトプレビュー |
| `LayoutPreview-OGP` | 1200x630 | OGP レイアウトプレビュー |
| `LayoutPreview-YouTube` | 1280x720 | YouTube レイアウトプレビュー |

### Carousel

| ID | サイズ | 用途 |
|----|--------|------|
| `Carousel-CoverSlide` | 1080x1350 | カルーセル表紙 |
| `Carousel-CTASlide` | 1080x1350 | カルーセル CTA |
| `Carousel-RankingTableSlide` | 1080x1350 | カルーセルランキングテーブル |

### Social-Media

| ID | サイズ | 用途 |
|----|--------|------|
| `Thumb-HeroNum` | 1280x720 | YouTube サムネイル（hero） |
| `Thumb-VsSplit` | 1280x720 | YouTube サムネイル（vs） |

### Image-Assets

| ID | サイズ | 用途 |
|----|--------|------|
| `ChoroplethMapStill` | 1080x1080 | コロプレス地図 |
| `RankingHighlights` | 1200x630 | ハイライト（上位/下位5県） |
| `RankingChartX` | 1200x630 | X 用バーチャート |
| `RankingBoxplot` | 1200x630 | 地域別箱ひげ図 |

## パイプライン

| スクリプト | コマンド | 説明 |
|-----------|---------|------|
| `render-sns-all.ts` | `pipeline:sns` | X/Instagram/note 向け静止画 + 動画を一括生成 |
| `render-bar-chart-race.ts` | `pipeline:bar-chart-race` | バーチャートレース動画を生成 |

```bash
npm run pipeline:sns --workspace remotion
npm run pipeline:bar-chart-race --workspace remotion
```

> **ブログ・ランキング OGP について**
> - ブログ OGP/サムネイル → `npx tsx apps/web/scripts/generate-blog-thumbnails.ts`（Satori）
> - ランキング OGP → `apps/web/src/app/ranking/[rankingKey]/opengraph-image.tsx`（Next.js 動的生成）

## ソース構成

```
src/
├── Root.tsx                   コンポジション定義
├── features/
│   ├── instagram/             Instagram（カルーセル・投稿画像）
│   ├── youtube/               YouTube サムネイル
│   ├── x/                     X 用画像（チャート・ハイライト・箱ひげ図）
│   ├── shorts/                縦型ショート動画
│   ├── shorts-ges/            GES 背景ショート動画
│   ├── ogp/                   OGP 画像
│   ├── note/                  note カバー画像
│   ├── web/                   Web サムネイル
│   └── layouts/               レイアウトプレビュー
├── shared/                    共有コンポーネント・型・テーマ
└── utils/
    ├── constants.ts           VIDEO_CONFIG / SCENE_DURATION / CANVAS
    ├── schema.ts              Zod バリデーションスキーマ
    ├── mock-data.ts           モックデータ変換ユーティリティ
    └── preview-data.ts        Studio プレビュー用データ
```
