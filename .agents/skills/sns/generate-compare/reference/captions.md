# Compare reference: captions (キャプション生成)

> `/generate-compare --step captions` の詳細手順。スキル本体は `../SKILL.md`。
> 生成対象は X / Instagram のみ。YouTube pilot は通常動画 master-first のため Shorts キャプションを自動生成せず、
> TikTok は撤退済み (`.claude/rules/sns-content-standards.md` §0-1)。UTM は rules §4。

2地域比較（Compare）動画の SNS キャプションを生成し posts.json に draft 登録する。

## 引数

| パラメータ | 必須 | デフォルト | 説明 |
|---|---|---|---|
| **areaA** | Yes | - | 地域A のエリアコード（例: `13000`） |
| **areaB** | Yes | - | 地域B のエリアコード（例: `27000`） |
| **template** | - | `versus` | `versus` / `question` |

## データ読み込み

以下のファイルを読み込む:

```
.local/r2/sns/compare/<areaCodeA>-vs-<areaCodeB>/data.json
```

ファイルが存在しない場合は `/generate-compare` スキルで先に生成すること。

**data.json 構造:**
```json
{
  "areaA": { "areaCode": "13000", "areaName": "東京都" },
  "areaB": { "areaCode": "27000", "areaName": "大阪府" },
  "indicators": [
    {
      "rankingKey": "fiscal-strength-index-prefecture",
      "indicator": "財政力指数",
      "unit": "",
      "valueA": 1.1,
      "rankA": 1,
      "valueB": 0.7,
      "rankB": 5,
      "yearName": "2022年度"
    }
  ]
}
```

**算出値:**
- `areaNameA` / `areaNameB` = 地域名
- `indicatorCount` = 指標数
- `winCountA` = rankA < rankB の指標数（順位が上＝勝ち）
- `winCountB` = rankB < rankA の指標数
- `drawCount` = rankA == rankB の指標数
- `biggestGap` = 順位差（|rankA - rankB|）が最大の指標
- `closestMatch` = 順位差が最小の指標
- `pageUrl` = UTM ルールに従って生成（下記参照）

## UTM パラメータ

| パラメータ | 値 |
|---|---|
| `utm_source` | `x` / `instagram` |
| `utm_medium` | `social` |
| `utm_campaign` | `compare-<areaCodeA>-vs-<areaCodeB>` |
| `utm_content` | `compare` |

ベース URL: `https://stats47.jp/compare?areas=<areaCodeA>,<areaCodeB>`

例:
```
https://stats47.jp/compare?areas=13000,27000&utm_source=x&utm_medium=social&utm_campaign=compare-13000-vs-27000&utm_content=compare
```

## ペルソナ

あなたは stats47（都道府県統計データの可視化サービス）のデータ対決MCです。2つの地域を統計データで徹底比較し、「どっちが上？」という知的な対決を楽しく演出する語り手として振る舞ってください。

## テンプレート定義

### versus（対決型）— デフォルト
- 目的: 両地域の住民からのコメント・議論を誘発
- 構造: [A vs B 対決フレーム] → [比較データ 3〜4項目] → [あなたはどっち派？] → [ハッシュタグ]
- フック例: 「東京 vs 大阪、財政力で圧勝するのはどっち？」

### question（問いかけ型）
- 目的: 予想→答え合わせでエンゲージメント
- 構造: [問いかけ1行] → [意外な比較結果 2〜3行] → [回答促進CTA]
- フック例: 「東京と大阪、知事の給料が高いのはどっち？」

## 各プラットフォームのキャプション生成

### 1. Instagram

リール動画のキャプション。対決の見どころを伝え、保存を誘う。

**ルール:**
- 冒頭2行に最も意外な比較結果を配置
- 本文200〜500文字
- 勝敗サマリーを含める
- 最も差が大きい指標と最も接戦の指標をハイライト
- CTA: 保存誘導（「引っ越し検討中の人は保存📌」等）+ DM共有誘導
- リンク誘導: 「プロフィールのリンクから🔗」
- ハッシュタグ 3〜5個 + 両地域の地元タグ
- hookText: 15文字以内（例:「東京vs大阪 決着」）
- displayTitle: 20文字以内（例:「東京 vs 大阪 財政力対決」）

**JSON:**
```json
{
  "hook": "冒頭2行",
  "caption": "本文200-500字",
  "cta": "保存CTA",
  "hashtags": ["#都道府県", ...],
  "hookText": "15字以内",
  "displayTitle": "20字以内"
}
```

**出力:**
- `instagram/caption.json`
- `instagram/caption.txt` — hook + caption + 比較ハイライト3項目 + CTA + ハッシュタグ

### 2. X

短文で対決の結果を伝え、引用RTで議論を誘発。

**ルール:**
- 200文字以内（URL含まず）
- 勝敗結果を明示（例:「東京 3勝 vs 大阪 2勝」）
- 最も意外な指標を1つ取り上げる
- CTA: 「どっち派？引用RTで」等、立場を取らせる誘導
- ハッシュタグ 0〜2個
- URL 直貼り（UTM付き）
- displayTitle: 20文字以内

**JSON:**
```json
{
  "text": "200文字以内",
  "hashtags": ["#都道府県", ...],
  "displayTitle": "20字以内"
}
```

**出力:**
- `x/caption.json`
- `x/caption.txt` — text + URL + ハッシュタグ

## 出力ディレクトリ

```
.local/r2/sns/compare/<areaCodeA>-vs-<areaCodeB>/
  instagram/caption.json + caption.txt
  x/caption.json + caption.txt
```

## 手順

### Step 1: データ読み込みと算出値の計算

data.json を読み込み、上記の算出値をすべて計算する。
ファイルが存在しない場合はエラーとし、`/generate-compare` を先に実行するよう案内する。

### Step 2: 各プラットフォームのキャプションを生成・保存

上記ペルソナとルールに基づき、Claude が直接 JSON を生成する。
2プラットフォーム分を生成し、即座にファイルに保存する（ユーザー確認は不要）。

**重要**: displayTitle は全プラットフォームで統一する（最初に生成した値を他でも使用）。

### Step 3: 完了報告

生成したファイルの一覧と、以下をユーザーに報告する:
- 比較対象の地域名
- 勝敗サマリー
- 各指標の比較結果

## 品質チェックリスト

- [ ] Instagram caption が200〜500文字
- [ ] X テキストが200文字以内
- [ ] 全プラットフォームの URL に UTM パラメータが付与されている
- [ ] 勝敗サマリー（A 〇勝 vs B 〇勝）が含まれている
- [ ] 両地域の地元ハッシュタグが含まれている
- [ ] displayTitle が全プラットフォームで統一されている
- [ ] JSON が正しくパースできる

## 参照

- データ生成: `/generate-compare`
- プレビュー: `/preview-remotion --type comparison`
- UTM ルール: `/generate-utm-url`
