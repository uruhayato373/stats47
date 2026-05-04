# Source: はてなブックマーク Hot Entry

ネット上で議論されている話題（Hot Entry）から記事ネタを発見する。Google Trends（瞬間的な検索急上昇）とは異なり、ブックマーク数が注目度の指標。

## 引数の追加サブオプション

`/discover-trends --source hatena [--category all|social|economics|life|knowledge]`

省略時は `all`（5 カテゴリ全部）。

## データ取得

WebFetch で Hot Entry RSS を取得:

| カテゴリ | URL |
|---|---|
| 総合 | `https://b.hatena.ne.jp/hotentry.rss` |
| 社会 | `https://b.hatena.ne.jp/hotentry/social.rss` |
| 政治と経済 | `https://b.hatena.ne.jp/hotentry/economics.rss` |
| 暮らし | `https://b.hatena.ne.jp/hotentry/life.rss` |
| 学び | `https://b.hatena.ne.jp/hotentry/knowledge.rss` |

各 `<item>` から:

| フィールド | 抽出元 |
|---|---|
| keyword（候補） | `<title>` から名詞・固有名詞を抽出（タイトルそのままだと粒度が粗いため） |
| popularity | `<hatena:bookmarkcount>`（ブックマーク数） |
| relatedUrls[] | `<link>` |
| 補足: bookmarkcount | popularity と同じ |
| 補足: title | 元記事タイトル（候補生成のトレンド概要に使う） |

`all` の場合は 5 カテゴリすべて取得し、URL で重複を除去。

## キーワード抽出のヒント

タイトルから「政策・統計化できる名詞」を抽出する。例:
- `「最低賃金 1500 円が議論を呼ぶ」` → keyword: `最低賃金`
- `「東京の出生率 1.0 割れ」` → keyword: `出生率`, `東京の出生`
- `「南海トラフ地震の被害想定」` → keyword: `南海トラフ地震`, `災害リスク`

同じキーワードに集約された記事が複数ある場合は、bookmarkcount を合計（または最大値）として記録。

## sourceLabel

- `hatena`

## 注意

- **エコーチェンバー注意**: はてブは技術 / リベラル系の偏りが強い。ニュース全般としては Yahoo / Google News と組み合わせる
- **エンタメ系の混入**: knowledge / life カテゴリには書評・エッセイも多い。Phase 2 の除外フィルタを確実に適用
- 直近 1〜2 日の記事に絞ると精度が上がる
