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

### OGP

| ID | サイズ | 用途 |
|----|--------|------|
| `RankingClassicOgp` | 1200x630 | ランキング OGP（クラシック） |
| `RankingHeroOgp` | 1200x630 | ランキング OGP（ヒーロー） |
| `NoteOgp` | 1280x670 | note カバー画像 |
| `BlogOgp` | 1200x630 | ブログ OGP |
| `DashboardOgp` | 1200x630 | ダッシュボード OGP |

### Thumbnails

| ID | サイズ | 用途 |
|----|--------|------|
| `RankingThumbnail` | 240x240 | ランキングサムネイル |

### Image-Assets

| ID | サイズ | 用途 |
|----|--------|------|
| `ChoroplethMapStill` | 1080x1080 | コロプレス地図 |
| `RankingHighlights` | 1200x630 | ハイライト（上位/下位5県） |
| `RankingChartX` | 1200x630 | X 用バーチャート |
| `RankingBoxplot` | 1200x630 | 地域別箱ひげ図 |

## パイプライン

### 前提条件

- ローカル D1（SQLite）に `ranking_items`（isActive=true）と `ranking_data` が存在すること

### スクリプト

| スクリプト | コマンド | 説明 |
|-----------|---------|------|
| `render-ranking-thumbnails.ts` | `pipeline:ranking-thumbnails` | サムネイル (240x240) 一括生成（D1 直接参照） |
| `render-ranking-ogp.ts` | `pipeline:ranking-ogp` | Hero OGP 画像バッチ生成（D1 直接参照） |

```bash
# 例: 静止画のみ生成
npm run pipeline:stills --workspace remotion

# 例: Hero OGP のみ生成
npm run pipeline:ranking-ogp --workspace remotion
```

### 出力ディレクトリ構造

```
.local/r2/ranking/prefecture/{rankingKey}/{yearCode}/
├── thumbnails/                ← render-ranking-thumbnails が生成
│   ├── thumbnail-dark.png
│   └── thumbnail-light.png
└── ogp/                       ← render-ranking-ogp が生成
    ├── ogp-light.png
    └── ogp-dark.png
```

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
