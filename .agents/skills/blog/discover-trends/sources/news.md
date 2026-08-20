# Source: Google News RSS

メディア報道ベースのトレンド。複数トピック RSS から幅広く拾う。

## データ取得

WebFetch で以下を取得:

| トピック | URL |
|---|---|
| 国内トップ | `https://news.google.com/rss?hl=ja&gl=JP&ceid=JP:ja` |
| 国内 | `https://news.google.com/rss/topics/CAAqIQgKIhtDQkFTRGdvSUwyMHZNRFZ4ZERBU0FtcGhLQUFQAQ?hl=ja&gl=JP&ceid=JP:ja` |
| ビジネス | `https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGx6TVdZU0FtcGhHZ0pLVUNnQVAB?hl=ja&gl=JP&ceid=JP:ja` |
| テクノロジー | `https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGRqTVhZU0FtcGhHZ0pLVUNnQVAB?hl=ja&gl=JP&ceid=JP:ja` |
| 健康 | `https://news.google.com/rss/topics/CAAqIQgKIhtDQkFTRGdvSUwyMHZNR3QwTlRFU0FtcGhLQUFQAQ?hl=ja&gl=JP&ceid=JP:ja` |

各 `<item>` から:

| フィールド | 抽出元 / 加工 |
|---|---|
| keyword | `<title>` から末尾「 - メディア名」を除去し、名詞・固有名詞を抽出 |
| popularity | 同一キーワードに集約されたニュース件数（Google News はソート順や件数で代替） |
| relatedUrls[] | `<link>` |
| pubDate | `<pubDate>`（直近 3 日以内に絞る） |
| 補足: source | `<source>`（メディア名） |

全トピックを取得後、URL で重複除去 → `pubDate` 降順ソート。

## キーワード抽出

タイトルから名詞・固有名詞を抽出。同じキーワードが複数ニュースに出現する場合はまとめて 1 トレンドとし、関連ニュース数を popularity として記録する。

例:
- `「最低賃金、過去最大の引き上げへ」` → keyword: `最低賃金`
- `「猛暑日、東京で 35 日連続」` → keyword: `猛暑`, `気温`
- `「南海トラフ地震臨時情報、解除」` → keyword: `南海トラフ地震`

## sourceLabel

- `google-news`

## 注意

- **海外ニュース除外**: 日本の都道府県データと結びつかないニュース（米中関係、欧州政治等）は Phase 2 の除外フィルタで落とす
- **ヘッドラインの誇張**: タイトルだけ過激なケースが多い。statisticalize 可能か Phase 3 の DB マッチで判定
- **重複ニュース**: 同じ話題で複数メディアが報じる場合があり、URL 重複除去だけでは不十分。タイトル類似度でも集約を検討
