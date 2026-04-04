---
name: post-sns-captions
description: 全 SNS（X/YouTube）のキャプションを一括生成しローカルに保存する。Use when user says "キャプション一括生成", "全SNSキャプション". 各プラットフォーム別スキルに委譲.
disable-model-invocation: true
---

全 SNS（X / YouTube）の投稿用キャプションを一括生成してローカルに保存する。
各プラットフォームの個別スキルに委譲して順次実行する。

## 運用方針

| プラットフォーム | 目的 | データ量 |
|---|---|---|
| **YouTube** | チャンネル成長・収益化（独立コンテンツ） | 全47都道府県データ維持 |
| **X** | stats47.jpへの動線（最重要） | top3のみ（ティーザー型） |

### 投稿頻度ルール（スパム判定回避）

| プラットフォーム | 上限 | 理由 |
|---|---|---|
| **YouTube** | **1日2本まで** | 3本以上/日を連日投稿するとShortsフィードへの配信が停止される。2026-03-25に1日6本投稿→再生0になった実績あり |
| **X** | 制限なし | ただし同一内容の連投は避ける |

**同時刻の複数投稿は厳禁**（同じ分に2本投稿するとボット判定リスク）。最低3時間の間隔を空けること。

## 引数

ユーザーから以下を確認すること:

| パラメータ | 必須 | デフォルト | 説明 |
|---|---|---|---|
| **domain** | - | `ranking` | `ranking` / `compare` / `correlation` |
| **template** | - | ドメインによる | `shock` / `versus` / `question` / `paradox` |

### ranking ドメイン
- **rankingKey**: ランキングキー（必須）

### compare ドメイン
- **areaA**: 地域A のエリアコード（必須）
- **areaB**: 地域B のエリアコード（必須）
- **categoryKey**: カテゴリキー（必須）

### correlation ドメイン
- **rankingKeyX**: X軸ランキングキー（必須）
- **rankingKeyY**: Y軸ランキングキー（必須）

## 手順

### Step 1: data.json の確認

`/post-x` スキルの「データ読み込み」セクションと同じ手順でデータを確認する。
ファイルが存在しない場合は生成してから次に進む。

### Step 2: 各プラットフォームのキャプションを順次生成

以下の順序で、各プラットフォームのスキルと同じ手順でキャプションを生成する。
domain パラメータはすべてのスキルに引き継ぐ。
domain と template パラメータはすべてのスキルに引き継ぐ。

1. **X** — `/post-x` と同じ手順で caption.json + caption.txt を生成
2. **YouTube** — `/post-youtube` と同じ手順で shorts.json + shorts.txt + pinned_comment.txt を生成

**重要**: displayTitle は全プラットフォームで統一する（X で生成した値を YouTube でも使用）。
**重要**: displayTitle に「ランキング」を含めないこと。Remotion テンプレートがサブタイトルに「都道府県ランキング」を自動表示するため重複する。

### Step 3: DB に caption を保存

キャプション生成後、`sns_posts.caption` を UPDATE する。メトリクス収集時のマッチング精度（先頭80文字前方一致 + ranking_name）に直結するため、必ず実行すること。

DB パス: `.local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite`

各プラットフォームに対して、生成した caption.txt の内容を保存する:

```sql
UPDATE sns_posts
SET caption = '<caption.txt の内容>'
WHERE platform = '<platform>'
  AND content_key = '<contentKey>'
  AND domain = '<domain>'
  AND post_type = 'original'
  AND (caption IS NULL OR caption = '');
```

- `<platform>`: `x`, `youtube`
- YouTube の場合は `youtube-short/shorts.txt` の内容を使用
- 既に caption が設定済みの場合は上書きしない

### Step 4: 完了報告

生成・保存したファイルの一覧をユーザーに報告する。
画像生成が必要な場合は `/render-sns-stills` を実行するよう案内する。

## 出力ディレクトリ

| ドメイン | ベースディレクトリ |
|---|---|
| ranking | `.local/r2/sns/ranking/<rankingKey>/` |
| compare | `.local/r2/sns/compare/<areaA>-vs-<areaB>/` |
| correlation | `.local/r2/sns/correlation/<keyX>--<keyY>/` |

各ベースディレクトリの下に:
```
x/caption.json + caption.txt
youtube-short/shorts.json + shorts.txt + pinned_comment.txt
```

**注意**: `youtube/` は通常動画用。ショート動画キャプションは `youtube-short/` に保存する。

## 品質チェックリスト

横断チェック:
- [ ] X の caption.txt に全47都道府県データが含まれていない
- [ ] YouTube の shorts.txt には全47都道府県データが含まれている
- [ ] 全URLにUTMパラメータが付与されている

各プラットフォームの個別スキルの品質チェックリストを参照:
- X: `/post-x`
- YouTube: `/post-youtube`

## 参照

- 画像生成: `/render-sns-stills`
- プラットフォーム仕様: `docs/10_SNS戦略/02_SNSプラットフォーム仕様.md`（Section 4）
- UTM ルール: `/generate-utm-url` スキル
- テンプレート定義: 各プラットフォームスキル内の「テンプレート定義」セクションを参照
