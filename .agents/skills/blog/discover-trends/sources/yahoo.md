# Source: Yahoo!ニュース トピックス

国内・経済・地域ニュースに強い RSS。Google News よりも国内寄りの編集方針。

## データ取得

WebFetch で以下を取得:

| カテゴリ | URL |
|---|---|
| 主要 | `https://news.yahoo.co.jp/rss/topics/top-picks.xml` |
| 国内 | `https://news.yahoo.co.jp/rss/topics/domestic.xml` |
| 経済 | `https://news.yahoo.co.jp/rss/topics/business.xml` |
| 地域 | `https://news.yahoo.co.jp/rss/topics/local.xml` |
| 科学 | `https://news.yahoo.co.jp/rss/topics/science.xml` |
| ライフ | `https://news.yahoo.co.jp/rss/topics/life.xml` |

各 `<item>` から:

| フィールド | 抽出元 / 加工 |
|---|---|
| keyword | `<title>` から名詞・固有名詞を抽出 |
| popularity | 同一キーワードに集約されたニュース件数 |
| relatedUrls[] | `<link>` |
| pubDate | `<pubDate>` |

全カテゴリ取得後、URL で重複を除去。同じキーワードが複数ニュースに出現する場合はまとめる。

## sourceLabel

- `yahoo`

## 注意

- **国内・地域に強み**: Google News より「日本の都道府県データと結びつく」可能性が高い
- **事件・事故の速報**: 個別事案で統計化困難な速報は Phase 2 の除外フィルタで落とす
- **政治家個人のスキャンダル**: 政策関連は除外しないが、個人の発言だけのものは除外
