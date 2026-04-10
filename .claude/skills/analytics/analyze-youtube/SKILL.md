---
name: analyze-youtube
description: YouTube 動画の内容を詳細分析する（字幕テキスト・メタデータ・視覚）。Use when user says "YouTube動画分析", "Shorts分析", "動画の内容を見て", "この動画を分析", "YouTubeを見て". 字幕テキスト・サムネイル・再生数を統合レポート.
argument-hint: "<URL or videoId>"
---

YouTube 動画（Shorts / 通常動画）のコンテンツ内容を詳細分析する。

## 用途

- YouTube Shorts や通常動画の内容を字幕テキストで把握したいとき
- 競合チャンネルの動画を分析したいとき
- 動画のサムネイルやビジュアル構成を確認したいとき
- 自チャンネルの動画の改善点を分析したいとき

## 引数

```
$ARGUMENTS — YouTube 動画 URL または videoId
             例: https://www.youtube.com/shorts/mlfNXVBqmLs
             例: mlfNXVBqmLs
```

## 手順

### Phase 1: データ取得

```bash
node scripts/youtube-analyze.mjs $ARGUMENTS
```

出力 JSON（`/tmp/youtube-analysis-<videoId>.json`）を Read ツールで読み込む。

### Phase 2: 視覚分析（Playwright MCP）

Playwright MCP が利用可能な場合、以下を実行:

1. `browser_navigate` で YouTube 動画ページを開く
   - Shorts: `https://www.youtube.com/shorts/<videoId>`
   - 通常: `https://www.youtube.com/watch?v=<videoId>`
2. 3秒待機してページ読み込みを完了させる
3. `browser_screenshot` でスクリーンショットを取得
4. スクリーンショット画像を視覚分析する

Playwright MCP が接続されていない場合はスキップし、Phase 1 のサムネイル URL をレポートに含める。

### Phase 3: 統合分析レポート

以下をまとめたレポートを出力する:

#### 1. メタデータ

| 項目 | 値 |
|---|---|
| タイトル | ... |
| チャンネル | ... |
| 公開日 | ... |
| 動画時間 | ... |
| 再生数 / いいね / コメント | ... |
| タグ | ... |

#### 2. 字幕テキスト全文

タイムスタンプ付きで表示。字幕が無い場合はその旨を記載。

#### 3. 視覚分析

- サムネイル / スクリーンショットの構成分析
- テロップ・文字情報の読み取り
- 色使い・フォント・レイアウトの特徴

#### 4. 総合分析

- コンテンツの概要（何を伝えている動画か）
- 構成分析（冒頭フック・展開・CTA の有無）
- 強み・改善点の指摘
- stats47 チャンネルへの示唆（関連性がある場合）

## 関連スキル

| スキル | 関係 |
|---|---|
| `/fetch-youtube-data` | 自チャンネル全体のメトリクス取得（補完関係） |
| `/post-youtube` | 分析結果を踏まえた投稿最適化 |

## 制限事項

- 動画の映像そのものは視聴できない（字幕テキスト + スクリーンショットで補完）
- 字幕が無効化されている動画ではテキスト分析不可
- `youtube-transcript` は非公式 API のため、将来的に動作しなくなる可能性がある
