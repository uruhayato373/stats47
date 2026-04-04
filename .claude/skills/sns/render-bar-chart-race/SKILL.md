---
name: render-bar-chart-race
description: Bar Chart Race 動画を一括レンダリングする（YouTube/X）。Use when user says "バーチャートレースレンダリング", "BCR レンダリング". Chrome 必須.
disable-model-invocation: true
---

`.local/r2/sns/bar-chart-race/` 配下の Bar Chart Race 動画を一括レンダリングする。

## 前提条件

- 各ディレクトリに `config.json` と `data.json` が存在すること（`/generate-bar-chart-race` で生成）
- Chrome がインストールされていること

## 引数

| パラメータ | 必須 | デフォルト | 説明 |
|---|---|---|---|
| **key** | - | 全件 | 特定のランキングキーのみ処理 |
| **platform** | - | 全プラットフォーム | `youtube` / `x` |
| **dry-run** | - | false | レンダリングせずジョブ一覧を表示 |

## 出力先

```
.local/r2/sns/bar-chart-race/<rankingKey>/
  youtube/shorts.mp4
  x/video.mp4
```

## 手順

### Step 1: キャプション生成

レンダリング前に `/post-bar-chart-race-captions` スキルの手順でキャプションを生成・保存する。
既にキャプションが存在する場合はスキップ可。

### Step 2: dry-run で確認

ジョブ一覧を確認する:

```bash
cd apps/remotion && npx tsx scripts/pipeline/render-bar-chart-race.ts --dry-run
```

特定キーのみ:
```bash
npx tsx scripts/pipeline/render-bar-chart-race.ts --dry-run --key total-population
```

### Step 3: レンダリング実行

```bash
# 全件・全プラットフォーム
npx tsx scripts/pipeline/render-bar-chart-race.ts

# 特定キーのみ
npx tsx scripts/pipeline/render-bar-chart-race.ts --key total-population

# YouTube のみ
npx tsx scripts/pipeline/render-bar-chart-race.ts --platform youtube

# 特定キー × 特定プラットフォーム
npx tsx scripts/pipeline/render-bar-chart-race.ts --key total-population --platform youtube
```

### Step 4: 結果報告

レンダリング完了後、以下をユーザーに報告する:
- 成功/失敗件数
- 所要時間
- 生成されたファイルの一覧

## 所要時間の目安

- 1動画: 50年 × 36fps = ~2,000フレーム → 約10〜20分
- 26ランキング × 2プラットフォーム = 52動画 → 約9〜17時間
- YouTube のみ（26動画）→ 約4〜9時間

## npm script

```bash
npm run pipeline:bar-chart-race --workspace remotion
npm run pipeline:bar-chart-race --workspace remotion -- --key total-population
npm run pipeline:bar-chart-race --workspace remotion -- --platform youtube --dry-run
```

## 参照

- `apps/remotion/scripts/pipeline/render-bar-chart-race.ts` — レンダリングスクリプト
- `.local/r2/sns/bar-chart-race/<key>/config.json` — 設定ファイル
- `.local/r2/sns/bar-chart-race/<key>/data.json` — フレームデータ
- `/generate-bar-chart-race` — データ生成スキル
- `/post-bar-chart-race-captions` — キャプション生成スキル
- `/preview-remotion-bar-chart-race` — プレビュースキル
