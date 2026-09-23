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
| `RankingQuizInstagram-Carousel` | 1080x1350 | 予想クイズ型カルーセル（`slide`: question / hint / answer / table / outro） |
| `RankingQuizInstagram-Reel` | 1080x1920 | 予想クイズ型リール（9:16・音声なし・18秒） |

予想クイズ型は1つの props ファイル（`meta` / `allEntries` / `quiz`）からカルーセル5枚 or リール1本を出す。
入力例は `src/fixtures/ranking-quiz-sample.json`、型と検証は `src/features/ranking-quiz-instagram/quiz.ts`。
選択肢・ヒントがデータと矛盾するとレンダーが失敗する（カルーセル・リールとも同じ `resolveRankingQuiz` を通す）。

```bash
cd apps/remotion
KEY=shochu-consumption-expenditure
PROPS=src/fixtures/ranking-quiz-sample.json
OUT="../../.local/r2/sns/ranking-quiz/$KEY/instagram/stills"
i=1
for s in question hint answer table outro; do
  npx remotion still src/index.ts RankingQuizInstagram-Carousel "$OUT/slide-$i-$s-1080x1350.png" \
    --props="$(jq -c --arg s "$s" '. + {slide: $s}' "$PROPS")"
  i=$((i+1))
done
```

出力名は IG cron (`post-from-schedule.cjs`) の carousel エントリがそのまま参照する。
キャプション・R2 反映・予約エントリの形式は `.claude/rules/sns-content-standards.md` §2-3b。

#### リール (`RankingQuizInstagram-Reel`)

構成（30fps・合計540フレーム=18秒。尺の SSOT は `src/features/ranking-quiz-instagram/reel/timeline.ts`）:
フック(0-3s) → 選択肢(3-7s) → ヒント+3-2-1カウントダウン(7-10s) → 正解発表(10-13s) → 上位5県の棒グラフ(13-16s) → 締め(16-18s)。
正解・順位・値・倍率はすべて `allEntries` から導出し、spec には書かせない。IG のボタン列（右約14%）・
キャプション/プロフィールバー（下約19%）を避ける安全余白は `reel/QuizReelFrame.tsx` が固定する。

```bash
cd apps/remotion
KEY=shochu-consumption-expenditure
npx remotion render src/index.ts RankingQuizInstagram-Reel \
  "../../.local/r2/sns/ranking-quiz-reel/$KEY/instagram/reel.mp4" \
  --props=src/fixtures/ranking-quiz-sample.json
```

**domain は `ranking-quiz-reel`**（カルーセルの `ranking-quiz` とは別。台帳が domain + content_key で
重複判定するため、同じ指標のカルーセルと分ける）。R2 は `sns/ranking-quiz-reel/<rankingKey>/instagram/` に
`reel.mp4` と `caption.txt` を置き、schedule JSON に
`{"type":"reels","domain":"ranking-quiz-reel","content_key":"<rankingKey>",...}` を足すと IG cron が投稿する。
詳細は `.claude/rules/sns-content-standards.md` §2-4。

### AreaCarousel / CorrelationCarousel (地域・相関カルーセル・火水土枠)

| ID | サイズ | 用途 |
|----|--------|------|
| `AreaInstagram-Carousel` | 1080x1350 | 地域カルーセル（`slide`: cover / top / bottom / sources / outro） |
| `CorrelationInstagram-Carousel` | 1080x1350 | 相関カルーセル（`slide`: cover / scatter / highlights / caution / outro） |

props.json はそれぞれ `.claude/scripts/sns/build-ig-area-props.ts` / `build-ig-correlation-props.ts` の
出力をそのまま渡す（トップレベルのフィールドを直接持ち、`quiz` のようなラップキーは無い）。型と矛盾検出は
`src/features/area-instagram/area.ts` / `src/features/correlation-instagram/correlation.ts` の
`resolveAreaCarousel` / `resolveCorrelationCarousel`。props が欠けている・矛盾している場合は throw して
レンダーを失敗させる。stills + caption.txt の一括書き出しは以下 1 本で完結する
(`.claude/rules/sns-content-standards.md` §2-3c・出力先は同ファイル参照):

```bash
npx tsx .claude/scripts/sns/render-ig-carousel.ts --domain area --props <area props.json>
npx tsx .claude/scripts/sns/render-ig-carousel.ts --domain correlation --props <correlation props.json>
```

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

## Data SSOT

Remotion 動画で使う統計データは **R2 `app/stats/<metric>/*.json` が SSOT**。Remotion は render 時に network / DB を直接読まず、事前 exporter で `apps/remotion/public/<feature>/` に派生 JSON を生成して `staticFile()` で読む。

```
e-Stat / MLIT
  -> metric TS config (`packages/data-configs/src/metrics/<key>.ts`)
  -> R2 `app/stats/<metric>/*.json`
  -> apps/remotion/scripts/exporters/*
  -> apps/remotion/public/<feature>/*.json
  -> Remotion render
```

主な feature データ:

| Feature | public output | R2 source |
|---|---|---|
| `migration-flow` | `public/migration-flow/pref-net-{year}.json`, `{NN}.json` | `app/stats/population-migration-inter-prefecture/migration-flow-<year>.json` |
| `population-yoy-47` | `public/population-yoy-47/timeseries.json` | `app/stats/japanese-population/values.json` |
| `station-passengers` | `public/station-passengers/index.json` | `app/stats/station-passengers-annual-total/values.json` |
| `port-bubble` | feature-specific derived JSON | `app/stats/<port-metric>/ports.json` |

新しい動画 feature を追加するときは、metric TS config を追加し、R2 に観測値を投入し、`apps/remotion/scripts/exporters/` に exporter を追加する。`public/` 配下の派生 JSON は再生成可能 snapshot として扱い、手編集しない。

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
