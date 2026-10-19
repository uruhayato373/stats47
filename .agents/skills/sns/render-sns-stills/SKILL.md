---
name: render-sns-stills
domain: sns
description: Remotion で SNS 用静止画・動画をレンダリングしローカルに保存する。Use when user says "SNSレンダリング", "画像生成", "動画レンダリング". Chrome 必須. キャプション生成後に実行.
disable-model-invocation: true
primary_agent: instagram-strategist
co_agents: [sns-renderer]
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
| **sns** | 必須 | - | `x` / `youtube` / `youtube-short` / `youtube-short-full` / `youtube-normal` / `note` / `instagram` / `all` |

### ranking ドメイン
- **rankingKey**: ランキングキー（必須）

### compare ドメイン
- **areaA**: 地域A のエリアコード（必須）
- **areaB**: 地域B のエリアコード（必須）

### correlation ドメイン
- **rankingKeyX**: X軸ランキングキー（必須）
- **rankingKeyY**: Y軸ランキングキー（必須）

## 家計レシート・県の図鑑・順位の乗り換え図

この4型は事前の手編集data.jsonやキャプションを必要としない。次のCLIがgitの指標定義とR2から
実データを取得し、検査・描画・投稿用ファイル生成まで行う。新規提案ではSNS規約§2-9aに従い優先候補に含める。

```bash
npx tsx .claude/scripts/sns/render-data-card.ts --kind household-receipt --area 28 --year 2024 --platform both
npx tsx .claude/scripts/sns/render-data-card.ts --kind area-atlas --area 28 --platform both
npx tsx .claude/scripts/sns/render-data-card.ts --kind rank-routes --key bread-consumption-expenditure --from 2014 --to 2024 --areas 28,27,33,26 --platform both
npx tsx .claude/scripts/sns/render-data-card.ts --kind tile-change --key total-population --from 1975 --to 2025 --platform both
```

- `--area`: 都道府県コード（1〜47 / 01〜47 / 5桁）。図鑑は4指標それぞれの最新年、家計レシートは2024年に対応。
- 順位図は家計調査の品目別年間支出額に対応。`--areas`は2〜4地域、省略時は旧1位と新上位から4地域を選定する。
  世帯区分・期間・都市の母集団を固定し、同順位も47地域での順位を保持する。
- `--platform x|instagram|both`（既定x）。Xは1080×1350の1枚、IGは同サイズの表紙・本体・出典/案内の3枚。
- 出力は `.local/r2/sns/<kind>/<contentKey>/`。`props.json`、`manifest.json`、入力`sources/`、媒体別`stills/`と
  `caption.txt`、Xは`draft.json`を持つ。contentKeyはCLI出力を使用し、rankingKeyと混同しない。
- 既存成果物には上書きしない。再試行は新しい`--out <directory>`を指定する。`--prepare-only`は接地検査とprops生成のみ。
  `CHROME_PATH`でChrome実行ファイルを指定できる。
- Xは`x/draft.json`のキャプションを§2-0に沿って編集し、投稿日時を`scheduledAt`に設定する。
  `mediaPath` / `domain` / `canonicalUrl` / `campaign` / `metricKeys`を維持したまま、`post-x-batch`のlint→draft登録へ渡す。
  新型の画像がない場合にranking-cardを代用しない。同じCLI引数で再生成して画像パスを同期する。
- IGは既存の`post-instagram`へ`--domain <kind>`とcontentKeyを渡す。公開・予約・R2反映は既存の投稿手順で行う。
- PNGを実寸・縮小で確認し、`manifest.json`の出典・期間・丸め差・抽出条件も確認する。

## note家計記事の固定入力から展開する

県庁所在市の家計調査を使うnote記事は、既存候補の制作メモにある固定入力JSONを復元して、次の専用CLIへ渡す。全国家計構造調査の県別レシートとは別の入力契約。

```bash
npx tsx .claude/scripts/sns/render-note-household.ts --input <固定snapshot.json> --out <新しい出力directory>
```

`--note-only` を加えると同じ固定入力からnote本文用1枚をXと同じ描画部品・4:5（1080×1350）で生成する。元記事の `images/category-ratio.png` と同じ画像IDへprivate R2の候補として登録し、既存原図・採用・公開状態を保持する。管理画面の型比較には固定サイズの候補を使い、旧原図は画像詳細で比較する。`--input`は複数指定できる。`apps/remotion/src/features/note-household/`の共通rendererが、X・Instagramとも「家計支出の10分類」を1枚にまとめた同じ1080×1350画像を生成する。画像の重複説明は削り、年・対象世帯・基準・出典を残す。下部は基準・出典の2行とし、詳しい説明・注意は本文に置く。費目・順序・倍率・年・市域・二人以上世帯・47市単純平均の基準を維持し、各スライドでpropsを解決する。原寸・320pxを確認し、同一都市の媒体別出力SHAが一致することを検査する。

`production.json`には固定入力・rendererのソースとSHA・フォントSHA・出力SHAを保存する。制作JSONはprivate R2へ保全し、既存投稿の`production.input`から参照する。投稿画像は同じIDの`assets`へ追加し、note原図は`thumbnail`として保持する。原図を完成見本に混ぜず、`planning.preview_only`は投稿用画像一式の保存・照合後に解除する。承認・予約・公開は別工程。

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
| Instagram（カルーセル表紙） | `RankingInstagram-Cover` | `instagram/stills/slide-1-cover-1080x1350.png` |
| Instagram（全47位テーブル） | `RankingInstagram-Table` | `instagram/stills/slide-2-table-1080x1350.png` |
| Instagram（CTA） | `RankingInstagram-CTA` | `instagram/stills/slide-3-cta-1080x1350.png` |
| Instagram（予想クイズ型・5枚） | `RankingQuizInstagram-Carousel`（`slide` で切替） | 本スキル未統合。`apps/remotion/README.md` の手順で `.local/r2/sns/ranking-quiz/<key>/instagram/stills/slide-<n>-<slide>-1080x1350.png` へレンダ（配信は `sns-content-standards.md` §2-3b） |
| Instagram（リール動画） | `RankingInstagram-Reel` | `instagram/reel.mp4` |

### area-carousel / correlation-carousel ドメイン (火水土枠・§2-3c)

props.json → stills + caption.txt を1本で書き出す (Remotion `AreaInstagram-Carousel` /
`CorrelationInstagram-Carousel` を内部で呼ぶ。`apps/remotion/README.md`「AreaCarousel /
CorrelationCarousel」参照):

```bash
npx tsx .claude/scripts/sns/render-ig-carousel.ts --domain area --props <build-ig-area-props.ts の出力>
npx tsx .claude/scripts/sns/render-ig-carousel.ts --domain correlation --props <build-ig-correlation-props.ts の出力>
```

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

**Instagram の命名規約**:
- `instagram/stills/slide-<N>-<role>-1080x1350.png` — カルーセルは**ファイル名の辞書順にスライドされる**ため、先頭の番号で順序を固定する
- `instagram/reel.mp4` — リール（`/post-instagram` はこのファイル存在でリール投稿に自動切替）
- **単発画像**投稿の場合は `slide-1-*.png` のみ配置（`/post-instagram` の自動判定が image になる）

**Instagram 用 props 生成**（既存 ranking props に Instagram 固有の slide/variant を追加）:

```bash
node -e "
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('<baseDir>/data.json','utf8'));
const caption = JSON.parse(fs.readFileSync('<baseDir>/x/caption.json','utf8'));
let itemMeta = {};
try { itemMeta = JSON.parse(fs.readFileSync('<baseDir>/ranking_items.json','utf8')); } catch(e) {}
const meta = {
  title: itemMeta.title || data.categoryName,
  subtitle: itemMeta.subtitle,
  unit: itemMeta.unit || data.unit,
  yearName: data.yearName,
  demographicAttr: itemMeta.demographicAttr,
  normalizationBasis: itemMeta.normalizationBasis,
};
const allEntries = data.data.map(d => ({ rank: d.rank, areaCode: d.areaCode, areaName: d.areaName, value: d.value }));
const base = { theme: 'light', hookText: caption.hookText || '', displayTitle: caption.displayTitle, meta, allEntries };
fs.writeFileSync('/tmp/ig-props-cover.json', JSON.stringify({ ...base, slide: 'cover' }));
fs.writeFileSync('/tmp/ig-props-table.json', JSON.stringify(base));
fs.writeFileSync('/tmp/ig-props-cta.json',   JSON.stringify({ ...base, slide: 'cta' }));
fs.writeFileSync('/tmp/ig-props-reel.json',  JSON.stringify({ ...base, theme: 'dark', variant: 'instagram' }));
"
```

**Instagram 3 並列 still レンダリング + リール**:

```bash
mkdir -p "<baseDir>/instagram/stills"
cd apps/remotion
# 静止画 3 種類を並列
npx remotion still src/index.ts RankingInstagram-Cover \
  "../../<baseDir>/instagram/stills/slide-1-cover-1080x1350.png" \
  --props /tmp/ig-props-cover.json &
npx remotion still src/index.ts RankingInstagram-Table \
  "../../<baseDir>/instagram/stills/slide-2-table-1080x1350.png" \
  --props /tmp/ig-props-table.json &
npx remotion still src/index.ts RankingInstagram-CTA \
  "../../<baseDir>/instagram/stills/slide-3-cta-1080x1350.png" \
  --props /tmp/ig-props-cta.json &
wait

# リールは必要な時だけ（動画レンダは数分かかる）
# npx remotion render src/index.ts RankingInstagram-Reel \
#   "../../<baseDir>/instagram/reel.mp4" \
#   --props /tmp/ig-props-reel.json
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

- キャプション生成: `/post-x` / `/post-ig-6angles` / `/bar-chart-race --step captions`
- Remotion レンダ入口の正典: 静止画/動画 = 本スキル、BCR = `/bar-chart-race`、プレビュー = `/preview-remotion` (`.claude/rules/sns-content-standards.md` §5)
- Remotion 設定: `apps/remotion/remotion.config.js`

タイル長期変化は `--kind tile-change --key total-population|households|births --from <年> --to <年>`。同じ定義・単位の47県で計算し、人口2025年は国勢調査確定値を使う。新規の上位・下位5県チャート生成は廃止。`quick-still` と `RankingX-Chart` は1080×1350の全47県タイルを生成する（過去のファイル名は互換維持）。予約の差し替えでも公開済みの共有素材を上書きしない。
