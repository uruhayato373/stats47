---
name: render-sns-stills
description: Remotion で SNS 用静止画・動画をレンダリングしローカルに保存する。Use when user says "SNSレンダリング", "画像生成", "動画レンダリング". Chrome 必須. キャプション生成後に実行.
disable-model-invocation: true
---

Remotion で SNS 用静止画・動画を生成してローカルに保存する。
キャプション生成は各 SNS スキル（`/post-x` 等）で事前に実行すること。

## 前提条件

- data.json が生成済みであること
- ranking_items.json が生成済みであること（ranking ドメインのみ）
- x/caption.json が生成済みであること（hookText を読み込むため）
- Chrome がインストールされていること

## クロスプラットフォーム注意事項

| 項目 | Windows | macOS |
|---|---|---|
| Chrome パス | `C:/Program Files/Google/Chrome/Application/chrome.exe` | `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome` |
| `--browser-executable` | **必須** | 不要（省略可） |

## 引数

ユーザーから以下を確認すること:

| パラメータ | 必須 | デフォルト | 説明 |
|---|---|---|---|
| **domain** | - | `ranking` | `ranking` / `compare` / `correlation` |
| **sns** | 必須 | - | `x` / `youtube` / `youtube-short` / `youtube-short-full` / `youtube-normal` / `note` / `all` |

### ranking ドメイン
- **rankingKey**: ランキングキー（必須）

### compare ドメイン
- **areaA**: 地域A のエリアコード（必須）
- **areaB**: 地域B のエリアコード（必須）

### correlation ドメイン
- **rankingKeyX**: X軸ランキングキー（必須）
- **rankingKeyY**: Y軸ランキングキー（必須）

## ドメイン別コンポジション

### ranking ドメイン

| SNS | コンポジション | 出力ファイル |
|---|---|---|
| X | `RankingX-Chart` | `x/stills/chart-x-1200x630.png` |
| X | `RankingX-ChoroplethMap` | `x/stills/choropleth-map-1200x630.png` |
| YouTube Short A | `RankingYouTube-Short` | `youtube-short/shorts-a.mp4` |
| YouTube Short B | `RankingYouTube-Short-Full` | `youtube-short/shorts-b.mp4` |
| YouTube Normal | `RankingYouTube-ScrollGes` | `youtube/scroll-ges.mp4` |
| YouTube Normal Thumb | `RankingYouTube-Thumb-Hero` | `youtube/stills/thumbnail-1280x720.png` |
| note | `RankingNote-Cover` | `note/images/cover-1280x670.png` |
| note | `RankingNote-ChoroplethMap` | `note/images/choropleth-map-1080x1080.png` |
| note | `RankingNote-Chart` | `note/images/chart-x-1200x630.png` |
| note | `RankingNote-Boxplot` | `note/images/boxplot-1200x630.png` |

### compare ドメイン

| SNS | コンポジション | 出力ファイル |
|---|---|---|
| X | `CompareX-Post` | `x/stills/comparison-1200x630.png` |

### correlation ドメイン

| SNS | コンポジション | 出力ファイル |
|---|---|---|
| X | `CorrelationX-Scatter` | `x/stills/scatter-1200x630.png` |

## 出力ベースディレクトリ

| ドメイン | ベースディレクトリ |
|---|---|
| ranking | `.local/r2/sns/ranking/<rankingKey>/` |
| compare | `.local/r2/sns/compare/<areaA>-vs-<areaB>/` |
| correlation | `.local/r2/sns/correlation/<keyX>--<keyY>/` |

## 手順

### Step 0: 事前準備

1. data.json と caption.json を読み込む
2. stills ディレクトリを作成:
```bash
mkdir -p <baseDir>/{x,youtube,youtube-short}/stills <baseDir>/note/images
```

3. **props JSON ファイルを生成する**

**ranking ドメイン**:
```bash
node -e "
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('<baseDir>/data.json','utf8'));
const caption = JSON.parse(fs.readFileSync('<baseDir>/x/caption.json','utf8'));
let itemMeta = {};
try { itemMeta = JSON.parse(fs.readFileSync('<baseDir>/ranking_items.json','utf8')); } catch(e) {}
const hookText = caption.hookText || '';
const displayTitle = caption.displayTitle || undefined;
const meta = {
  title: itemMeta.title || data.categoryName,
  subtitle: itemMeta.subtitle || undefined,
  unit: itemMeta.unit || data.unit,
  yearName: data.yearName,
  demographicAttr: itemMeta.demographicAttr || undefined,
  normalizationBasis: itemMeta.normalizationBasis || undefined,
};
const allEntries = data.data.map(d => ({ rank: d.rank, areaCode: d.areaCode, areaName: d.areaName, value: d.value }));
fs.writeFileSync('/tmp/sns-props.json', JSON.stringify({ theme:'light', hookText, displayTitle, meta, allEntries }));
fs.writeFileSync('/tmp/sns-props-yt.json', JSON.stringify({ theme:'dark', hookText, displayTitle, meta, allEntries, variant:'youtube' }));
fs.writeFileSync('/tmp/sns-props-thumb.json', JSON.stringify({ theme:'dark', variant:'hero', hookText, displayTitle, meta, allEntries }));
console.log('Props generated for:', meta.title);
"
```

**compare ドメイン**:
data.json の indicators から ComparisonOgp の props を構築。

**correlation ドメイン**:
data.json の scatterData から CorrelationScatterOgp の props を構築。

### Step 1: Remotion CLI で生成

**重要**:
- 必ず `apps/remotion/` ディレクトリで実行すること
- props は Step 0 で生成した JSON ファイルを `--props <path>` で渡す
- 可能な限り **並列実行** すること
- Windows では `--browser-executable` を付与すること

コマンド例（ranking ドメイン / X チャート — 静止画）:
```bash
cd apps/remotion && npx remotion still src/index.ts RankingX-Chart \
  "../../<baseDir>/x/stills/chart-x-1200x630.png" \
  --props /tmp/sns-props.json
```

コマンド例（ranking ドメイン / YouTube Normal — 動画）:
```bash
cd apps/remotion && npx remotion render src/index.ts RankingYouTube-ScrollGes \
  "../../<baseDir>/youtube/scroll-ges.mp4" \
  --props /tmp/sns-props-yt.json
```

**`youtube` 指定時の挙動**:
- `sns=youtube` → YouTube Short A/B + YouTube Normal + サムネイルの **全て** をレンダリング
- `sns=youtube-short` → YouTube Short A版（32秒 / 上位5件+全47件テーブル）+ B版（55秒 / 全47件高速・モーション無し）の両方
- `sns=youtube-short-full` → YouTube Short B版のみ
- `sns=youtube-normal` → YouTube Normal ScrollGes (`youtube/scroll-ges.mp4`) + サムネイル（Hero）

**YouTube Short A/B テスト**:
- A版 `RankingYouTube-Short`（variant: `youtube-short`）: 上位5件 RankCard → タイルマップ → 全47件テーブル → CTA（~32秒）
- B版 `RankingYouTube-Short-Full`（variant: `youtube-short-full`）: 全47件を高速表示（モーション無し即表示）→ CTA（~55秒）
- 同じランキングキーで両方投稿し、維持率を比較して最適な尺を判断する
- A版の props: `variant: "youtube-short"`、B版の props: `variant: "youtube-short-full"`
- 出力: A版 → `youtube-short/shorts-a.mp4`、B版 → `youtube-short/shorts-b.mp4`

**注意**: YouTube Normal は `remotion render`（動画）を使用する。`remotion still`（静止画）ではない。ScrollGes はGES背景動画付きのためレンダリング時間が長い（約30分）。他のレンダリングと並列実行を推奨。レンダリング後のmp4は投稿完了後に削除してディスクを回収すること（~700MB）。

コマンド例（YouTube Normal サムネイル — 静止画、動画レンダリングと並列実行可）:
```bash
cd apps/remotion && npx remotion still src/index.ts RankingYouTube-Thumb-Hero \
  "../../<baseDir>/youtube/stills/thumbnail-1280x720.png" \
  --props /tmp/sns-props-thumb.json
```

### Step 2: 生成結果を報告

成功・失敗したファイルの一覧をユーザーに報告する。

## トラブルシューティング

### Chrome Headless Shell のダウンロードが失敗する（HTTP 503）
企業プロキシによるブロック。`--browser-executable` でローカル Chrome を直接指定する。

### タイトルが別のランキングデータになる
Remotion は `rankingKey` だけではデータを取得できない。必ず `--props` でデータを渡す（Step 0 参照）。

### `@/shared` モジュールが解決できない
必ず `apps/remotion/` で `npx remotion still` CLI を使うこと。

## 参照

- キャプション生成: `/post-sns-captions` / `/post-x` / `/post-youtube`
- Remotion 設定: `apps/remotion/remotion.config.js`
