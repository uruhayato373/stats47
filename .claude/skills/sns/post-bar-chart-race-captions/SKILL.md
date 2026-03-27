Bar Chart Race 動画の全 SNS キャプションを一括生成してローカルに保存する。

## 引数

| パラメータ | 必須 | デフォルト | 説明 |
|---|---|---|---|
| **key** | Yes | - | ランキングキー（`.local/r2/sns/bar-chart-race/<key>/` に対応） |

## データ読み込み

以下の 2 ファイルを読み込む:

```
.local/r2/sns/bar-chart-race/<key>/config.json
.local/r2/sns/bar-chart-race/<key>/data.json
```

**config.json 構造:**
```json
{
  "title": "都道府県別 転入超過率",
  "unit": "％",
  "hookText": "東京が最下位→1位",
  "eventLabels": [{ "year": "1991", "label": "バブル崩壊" }],
  "enableSpoilerHook": true
}
```

**data.json 構造:**
```json
{
  "frames": [
    { "date": "1975年度", "items": [{ "name": "東京都", "value": -1.1 }, ...] }
  ]
}
```

**算出値:**
- `title` = config.title
- `unit` = config.unit
- `periodStart` / `periodEnd` = frames の最初・最後の date
- `yearSpan` = 期間の年数
- `firstTop3` = 最初のフレームの上位3県（値付き）
- `lastTop3` = 最後のフレームの上位3県（値付き）
- `biggestRiser` = 最初→最後で順位上昇が最大の県
- `biggestFaller` = 最初→最後で順位下落が最大の県
- `keyEvents` = eventLabels から主要イベント
- `pageUrl` = UTM ルールに従って生成（下記参照）

## UTM パラメータ

| パラメータ | 値 |
|---|---|
| `utm_source` | `x` / `instagram` / `youtube` / `tiktok` |
| `utm_medium` | `social` |
| `utm_campaign` | `bcr-<key>` |
| `utm_content` | `bar-chart-race` |

ベース URL: `https://stats47.jp/ranking/<key>`

例:
```
https://stats47.jp/ranking/moving-in-excess-rate-japanese?utm_source=youtube&utm_medium=social&utm_campaign=bcr-moving-in-excess-rate-japanese&utm_content=bar-chart-race
```

## ペルソナ

あなたは stats47（都道府県統計データの可視化サービス）のデータストーリーテラーです。約50年間の統計変遷をドラマチックに語り、「最後まで見たい」と思わせる語り手として振る舞ってください。

## 各プラットフォームのキャプション生成

### 1. YouTube

Bar Chart Race は YouTube Shorts の主力コンテンツ。説明欄で時代背景を補足する。

**ルール:**
- タイトル 50文字以内、検索キーワードを先頭に
- 説明欄 250字以上、冒頭125文字にキーワード集中
- 説明欄に「見どころ」を含める（時代の転換点、意外な逆転劇など）
- 全47都道府県の最終年ランキングを説明欄に含める
- CTA: チャンネル登録誘導
- #Shorts 必須、ハッシュタグ計3〜5個。**各ハッシュタグの間には必ずスペースを入れること**（`#Shorts #ランキング` ○ / `#Shorts#ランキング` ×）
- **投稿頻度: 1日最大2本まで**（3本以上/日の連日投稿はスパム判定リスク）

**JSON:**
```json
{
  "title": "50字以内SEOタイトル",
  "description": "250字以上の説明欄",
  "pinnedComment": "ピン留めコメント",
  "hashtags": ["#Shorts", ...]
}
```

**出力:**
- `youtube/shorts.json`
- `youtube/shorts.txt` — title + description + 全47都道府県最終年データ + URL + ハッシュタグ
- `youtube/pinned_comment.txt`

### 2. Instagram

リール動画のキャプション。データの背景ストーリーを伝える。

**ルール:**
- 冒頭2行に最も意外な変化を配置
- 本文200〜500文字
- 「〇〇年から〇〇年の変遷」を明示
- top3 の変遷（最初→最後）を含める
- CTA: 保存・コメント誘導
- リンク誘導: 「プロフィールのリンクから」
- ハッシュタグ 3〜5個

**JSON:**
```json
{
  "hook": "冒頭2行",
  "caption": "本文200-500字",
  "cta": "保存CTA",
  "hashtags": ["#都道府県", ...]
}
```

**出力:**
- `instagram/caption.json`
- `instagram/caption.txt` — hook + caption + top3変遷 + CTA + ハッシュタグ

### 3. X

短文でデータの意外性を伝える。

**ルール:**
- 200文字以内（URL含まず）
- 最も意外な変化を1つ取り上げる（例: 「東京都の転入超過率、1975年は47位→2000年以降は不動の1位」）
- ハッシュタグ 2個
- URL 直貼り（UTM付き）

**JSON:**
```json
{
  "text": "200文字以内",
  "hashtags": ["#都道府県", ...]
}
```

**出力:**
- `x/caption.json`
- `x/caption.txt` — text + URL + ハッシュタグ

### 4. TikTok

口語でテンポよく。

**ルール:**
- 100〜300文字、口語・会話型
- CTA: フォロー誘導
- リンク誘導: 「プロフィールのリンクから」
- ハッシュタグ 3〜5個（#fyp 不要）
- top3 の変遷を含める

**JSON:**
```json
{
  "caption": "100-300字",
  "hashtags": ["#都道府県", ...]
}
```

**出力:**
- `tiktok/caption.json`
- `tiktok/caption.txt` — caption + URL + ハッシュタグ

## 出力ディレクトリ

```
.local/r2/sns/bar-chart-race/<key>/
  youtube/shorts.json + shorts.txt + pinned_comment.txt
  instagram/caption.json + caption.txt
  x/caption.json + caption.txt
  tiktok/caption.json + caption.txt
```

## 手順

### Step 1: データ読み込みと算出値の計算

config.json + data.json を読み込み、上記の算出値をすべて計算する。

### Step 2: 各プラットフォームのキャプションを生成・保存

上記ペルソナとルールに基づき、Claude が直接 JSON を生成する。
4プラットフォーム分を生成し、即座にファイルに保存する（ユーザー確認は不要）。

### Step 4: 投稿管理テーブル更新

`docs/11_SNS投稿管理/posts/bar-chart-race.md` のテーブルを更新する。
- テーブル内で rankingKey を含むリンク行を検索する（URL末尾の `/ranking/<key>` で特定）
- 行が存在する場合: X / IG / YT / TT 列をすべて `generated` に更新
- 行が存在しない場合: テーブル末尾に新しい行を追加（全プラットフォーム `generated`、postedAt は空）

### Step 5: 完了報告

生成したファイルの一覧をユーザーに報告する。

## 品質チェックリスト

- [ ] YouTube タイトルが50文字以内
- [ ] YouTube 説明が250文字以上
- [ ] Instagram caption が200〜500文字
- [ ] X テキストが200文字以内
- [ ] TikTok caption が100〜300文字
- [ ] 全プラットフォームの URL に UTM パラメータが付与されている
- [ ] キャプションにデータの時系列変化（最初→最後）が含まれている
- [ ] eventLabels の主要イベントが適切に言及されている
- [ ] JSON が正しくパースできる

## 参照

- データ生成: `/generate-bar-chart-race`
- 動画レンダリング: `/render-bar-chart-race`
- プレビュー: `/preview-remotion-bar-chart-race`
- UTM ルール: `/generate-utm-url`
