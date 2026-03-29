全 SNS（Instagram / X / YouTube / TikTok）の投稿用キャプションを一括生成してローカルに保存する。
各プラットフォームの個別スキルに委譲して順次実行する。

## 運用方針

| プラットフォーム | 目的 | データ量 |
|---|---|---|
| **YouTube** | チャンネル成長・収益化（独立コンテンツ） | 全47都道府県データ維持 |
| **TikTok** | フォロワー獲得・認知拡大（独立コンテンツ） | 全47都道府県データ維持 |
| **X** | stats47.jpへの動線（最重要） | top3のみ（ティーザー型） |
| **Instagram** | stats47.jpへの動線 | top3のみ（ティーザー型） |

### 投稿頻度ルール（スパム判定回避）

| プラットフォーム | 上限 | 理由 |
|---|---|---|
| **YouTube** | **1日2本まで** | 3本以上/日を連日投稿するとShortsフィードへの配信が停止される。2026-03-25に1日6本投稿→再生0になった実績あり |
| **TikTok** | 1日3本まで | TikTokは投稿頻度に寛容だが、質の低い大量投稿はシャドウバンリスク |
| **X** | 制限なし | ただし同一内容の連投は避ける |
| **Instagram** | 1日2本まで | リールの配信頻度が下がる |

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

1. **Instagram** — `/post-instagram` と同じ手順で caption.json + caption.txt を生成
2. **X** — `/post-x` と同じ手順で caption.json + caption.txt を生成
3. **YouTube** — `/post-youtube` と同じ手順で shorts.json + shorts.txt + pinned_comment.txt を生成
4. **TikTok** — `/post-tiktok` と同じ手順で caption.json + caption.txt を生成

**重要**: displayTitle は全プラットフォームで統一する（Instagram で生成した値を他でも使用）。
**重要**: displayTitle に「ランキング」を含めないこと。Remotion テンプレートがサブタイトルに「都道府県ランキング」を自動表示するため重複する。

### Step 3: 完了報告

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
instagram/caption.json + caption.txt
x/caption.json + caption.txt
youtube-short/shorts.json + shorts.txt + pinned_comment.txt
tiktok/caption.json + caption.txt
```

**注意**: `youtube/` は通常動画用。ショート動画キャプションは `youtube-short/` に保存する。

## 品質チェックリスト

横断チェック:
- [ ] X / Instagram の caption.txt に全47都道府県データが含まれていない
- [ ] YouTube の shorts.txt には全47都道府県データが含まれている
- [ ] TikTok の caption.txt には全47都道府県データが含まれている
- [ ] 全URLにUTMパラメータが付与されている

各プラットフォームの個別スキルの品質チェックリストを参照:
- Instagram: `/post-instagram`
- X: `/post-x`
- YouTube: `/post-youtube`
- TikTok: `/post-tiktok`

## 参照

- 画像生成: `/render-sns-stills`
- プラットフォーム仕様: `docs/10_SNS戦略/02_SNSプラットフォーム仕様.md`（Section 4）
- UTM ルール: `/generate-utm-url` スキル
- テンプレート定義: 各プラットフォームスキル内の「テンプレート定義」セクションを参照
