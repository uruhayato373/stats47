# BCR reference: captions (キャプション生成)

> `/bar-chart-race --step captions` の詳細手順。スキル本体は `../SKILL.md`。
> UTM は `.claude/rules/sns-content-standards.md` §4、雛形は §2。

Bar Chart Race 動画の全 SNS キャプションを一括生成し posts.json に draft 登録する。

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
| `utm_source` | `x` |
| `utm_medium` | `social` |
| `utm_campaign` | `bcr-<key>` |
| `utm_content` | `bar-chart-race` |

ベース URL: `https://stats47.jp/ranking/<key>`

例:
```
https://stats47.jp/ranking/moving-in-excess-rate-japanese?utm_source=x&utm_medium=social&utm_campaign=bcr-moving-in-excess-rate-japanese&utm_content=bar-chart-race
```

## ペルソナ

あなたは stats47（都道府県統計データの可視化サービス）のデータストーリーテラーです。約50年間の統計変遷をドラマチックに語り、「最後まで見たい」と思わせる語り手として振る舞ってください。

## 各プラットフォームのキャプション生成

### X

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

## 出力ディレクトリ

```
.local/r2/sns/bar-chart-race/<key>/
  x/caption.json + caption.txt
```

## 手順

### Step 1: データ読み込みと算出値の計算

config.json + data.json を読み込み、上記の算出値をすべて計算する。

### Step 2: 各プラットフォームのキャプションを生成・保存

上記ペルソナとルールに基づき、Claude が直接 JSON を生成する。
即座にファイルに保存する（ユーザー確認は不要）。

### Step 4: 完了報告

生成したファイルの一覧をユーザーに報告する。

## 品質チェックリスト

- [ ] X テキストが200文字以内
- [ ] 全プラットフォームの URL に UTM パラメータが付与されている
- [ ] キャプションにデータの時系列変化（最初→最後）が含まれている
- [ ] eventLabels の主要イベントが適切に言及されている
- [ ] JSON が正しくパースできる

## 参照

- データ生成: `/generate-bar-chart-race`
- 動画レンダリング: `/render-bar-chart-race`
- プレビュー: `/preview-remotion --type bar-chart-race`
- UTM ルール: `.claude/rules/sns-content-standards.md` §4
