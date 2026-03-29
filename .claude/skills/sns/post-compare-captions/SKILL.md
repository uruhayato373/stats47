2地域比較（Compare）動画の全 SNS キャプションを一括生成してローカルに保存する。

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
| `utm_source` | `x` / `instagram` / `youtube` / `tiktok` |
| `utm_medium` | `social` |
| `utm_campaign` | `compare-<areaCodeA>-vs-<areaCodeB>` |
| `utm_content` | `compare` |

ベース URL: `https://stats47.jp/compare?areas=<areaCodeA>,<areaCodeB>`

例:
```
https://stats47.jp/compare?areas=13000,27000&utm_source=youtube&utm_medium=social&utm_campaign=compare-13000-vs-27000&utm_content=compare
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

### 1. YouTube

Compare は YouTube Shorts の対決コンテンツ。両地域のファンからのコメントを狙う。

**ルール:**
- タイトル 50文字以内、「A vs B」を先頭に、末尾にハッシュタグ
- 説明欄 250字以上、冒頭125文字に地域名とキーワード集中
- 勝敗サマリーを説明欄に含める（例:「東京 3勝 vs 大阪 2勝」）
- 全指標の比較データ（指標名・値A・値B・順位A・順位B）を説明欄に含める
- CTA: チャンネル登録誘導 + 「あなたはどっち派？コメントで」
- #Shorts 必須、ハッシュタグ計3〜5個（地域タグ含む）。**各ハッシュタグの間には必ずスペースを入れること**
- **投稿頻度: 1日最大2本まで**（3本以上/日の連日投稿はスパム判定リスク）

**JSON:**
```json
{
  "title": "50字以内SEOタイトル（末尾にハッシュタグ）",
  "description": "250字以上の説明欄",
  "pinnedComment": "ピン留めコメント",
  "hashtags": ["#Shorts", ...],
  "hookText": "15字以内",
  "displayTitle": "20字以内（A vs B形式）"
}
```

**出力:**
- `youtube/shorts.json`
- `youtube/shorts.txt` — title + description + 全指標比較データ + 勝敗サマリー + URL + ハッシュタグ
- `youtube/pinned_comment.txt`

### 2. Instagram

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

### 3. X

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

### 4. TikTok

口語でテンポよく対決を語る。

**ルール:**
- 100〜300文字、口語・会話型
- 冒頭3行以内にコメント誘導（「〇〇県民 vs △△県民、どっちが勝つと思う？」）
- 勝敗サマリーと全指標の比較データを含める（独立コンテンツ）
- CTA: フォロー誘導は末尾に添える程度
- ハッシュタグ 5〜8個（地域タグ含む、#fyp 不要）
- リンク不要（TikTokではクリッカブルにならない）
- hookText: 15文字以内（コメント誘導要素を含めると効果的）
- displayTitle: 20文字以内
- pinnedComment: 考察コメント（「この結果の背景は〇〇かも。地元民の方どう思う？」等）

**JSON:**
```json
{
  "caption": "100-300字",
  "hashtags": ["#都道府県", ...],
  "hookText": "15字以内",
  "displayTitle": "20字以内",
  "pinnedComment": "ピン留めコメント"
}
```

**出力:**
- `tiktok/caption.json`
- `tiktok/caption.txt` — caption + 全指標比較データ + 勝敗サマリー + ハッシュタグ

## 出力ディレクトリ

```
.local/r2/sns/compare/<areaCodeA>-vs-<areaCodeB>/
  youtube/shorts.json + shorts.txt + pinned_comment.txt
  instagram/caption.json + caption.txt
  x/caption.json + caption.txt
  tiktok/caption.json + caption.txt
```

## 手順

### Step 1: データ読み込みと算出値の計算

data.json を読み込み、上記の算出値をすべて計算する。
ファイルが存在しない場合はエラーとし、`/generate-compare` を先に実行するよう案内する。

### Step 2: 各プラットフォームのキャプションを生成・保存

上記ペルソナとルールに基づき、Claude が直接 JSON を生成する。
4プラットフォーム分を生成し、即座にファイルに保存する（ユーザー確認は不要）。

**重要**: displayTitle は全プラットフォームで統一する（最初に生成した値を他でも使用）。

### Step 3: 完了報告

生成したファイルの一覧と、以下をユーザーに報告する:
- 比較対象の地域名
- 勝敗サマリー
- 各指標の比較結果

## 品質チェックリスト

- [ ] YouTube タイトルが50文字以内
- [ ] YouTube 説明が250文字以上
- [ ] Instagram caption が200〜500文字
- [ ] X テキストが200文字以内
- [ ] TikTok caption が100〜300文字
- [ ] 全プラットフォームの URL に UTM パラメータが付与されている（TikTok は URL なし）
- [ ] 勝敗サマリー（A 〇勝 vs B 〇勝）が含まれている
- [ ] 両地域の地元ハッシュタグが含まれている
- [ ] displayTitle が全プラットフォームで統一されている
- [ ] JSON が正しくパースできる

## 参照

- データ生成: `/generate-compare`
- プレビュー: `/preview-remotion-comparison`
- UTM ルール: `/generate-utm-url`
