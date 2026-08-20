# Source: Google Trends

Google Trends デイリートレンド（日本）から検索急上昇キーワードを取得する。

## データ取得

WebFetch で RSS を取得:

```
URL: https://trends.google.co.jp/trending/rss?geo=JP
```

各 `<item>` から以下を抽出:

| フィールド | XML 要素 | マッピング |
|---|---|---|
| keyword | `<title>` | トレンドキーワード |
| popularity | `<ht:approx_traffic>` | 検索ボリューム（例: "200,000+"） |
| relatedUrls[] | `<ht:news_item>` 内 `<ht:news_item_url>` | 関連ニュース URL |
| ニュース見出し | `<ht:news_item_title>` | カテゴリ判定の補助に使う |

## オプション: --youtube

`--youtube` が指定された場合、YouTube トレンドも補助取得:

```
WebSearch: "YouTube トレンド 日本 今日"
```

上位の話題を別 sourceLabel `youtube-trends` でトレンドリストに追加（popularity は無し / 件数で代替）。

## sourceLabel

- 通常: `google-trends`
- `--youtube` 補助分: `youtube-trends`

## 注意

- RSS は XML 形式。WebFetch の結果から `<item>` 要素を正確にパースすること
- `<ht:news_item_title>` は複数あり得る。代表 1〜2 件を関連情報として保持
- 検索急上昇は短時間で内容が入れ替わる。記録時刻を Phase 6 のサマリーに必ず明記
