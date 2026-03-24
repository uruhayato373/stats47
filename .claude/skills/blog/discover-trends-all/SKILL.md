全トレンドソース（Google Trends・はてブ・Google News・Yahoo!ニュース・GSC・note.com）を一括実行し、統合レポートを生成する。

## 用途

- 全ソースからトレンドを網羅的に収集し、最も有望な記事候補を選びたいとき
- 個別スキルを1つずつ実行するのが面倒なとき
- 複数ソースで同時に話題になっているテーマ（クロスソースヒット）を発見したいとき

## 引数

```
$ARGUMENTS — なし（全ソースを自動実行）
```

## 手順

### Phase 1: 全ソースからトレンド取得

以下の 6 ソースを **並行して** 取得する（各ソースの Phase 1 のみ実行）:

#### 1a. Google Trends RSS

```
WebFetch: https://trends.google.co.jp/trending/rss?geo=JP
```

- 各 `<item>` から `<title>`, `<ht:approx_traffic>`, `<ht:news_item_title>` を抽出
- ソースラベル: `google-trends`

#### 1b. はてなブックマーク Hot Entry RSS

以下を全取得し URL で重複除去:

```
WebFetch: https://b.hatena.ne.jp/hotentry/social.rss
WebFetch: https://b.hatena.ne.jp/hotentry/economics.rss
WebFetch: https://b.hatena.ne.jp/hotentry/life.rss
WebFetch: https://b.hatena.ne.jp/hotentry/knowledge.rss
```

- 各 `<item>` から `<title>`, `<link>`, `<hatena:bookmarkcount>` を抽出
- ソースラベル: `hatena`

#### 1c. Google News RSS

以下を全取得し URL で重複除去:

```
WebFetch: https://news.google.com/rss?hl=ja&gl=JP&ceid=JP:ja
WebFetch: https://news.google.com/rss/topics/CAAqIQgKIhtDQkFTRGdvSUwyMHZNRFZ4ZERBU0FtcGhLQUFQAQ?hl=ja&gl=JP&ceid=JP:ja
WebFetch: https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGx6TVdZU0FtcGhHZ0pLVUNnQVAB?hl=ja&gl=JP&ceid=JP:ja
```

- 各 `<item>` から `<title>`, `<link>`, `<pubDate>`, `<source>` を抽出
- 直近 3 日以内のニュースのみ
- 同一キーワードを集約
- ソースラベル: `google-news`

#### 1d. Yahoo!ニュース トピックス RSS

以下を全取得し URL で重複除去:

```
WebFetch: https://news.yahoo.co.jp/rss/topics/top-picks.xml
WebFetch: https://news.yahoo.co.jp/rss/topics/domestic.xml
WebFetch: https://news.yahoo.co.jp/rss/topics/business.xml
WebFetch: https://news.yahoo.co.jp/rss/topics/local.xml
```

- 各 `<item>` から `<title>`, `<link>`, `<pubDate>` を抽出
- ソースラベル: `yahoo-news`

#### 1e. Google Search Console 急上昇クエリ

`/discover-trends-gsc` の Phase 1〜2 を実行（前週比 wow）:

- サービスアカウント鍵で GSC API にアクセスし、今期・前期のクエリデータを取得
- 新規クエリ / 急上昇クエリ / 表示急増クエリを抽出
- ソースラベル: `gsc`

#### 1f. note.com トレンド

WebSearch で stats47 カテゴリ関連の note.com 記事を検索:

```
WebSearch: "site:note.com" 都道府県 ランキング
WebSearch: "site:note.com" 統計 データ 地域
WebSearch: "site:note.com" 人口減少 地方
```

- タイトル・URL・テーマキーワードを抽出
- ソースラベル: `note`

### Phase 2: 統合・重複除去

1. 全ソースのトレンドを統合リストにまとめる
2. **クロスソース検出**: 同じキーワード・テーマが複数ソースに出現しているものを特定し、`cross_source_count` を記録
3. 類似キーワードの統合（例: 「最低賃金」「最低賃金引き上げ」→ 1 トレンドにまとめる）
4. 各トレンドに以下の属性を付与:

```
{
  keyword: "最低賃金",
  sources: ["google-trends", "hatena", "google-news", "yahoo-news", "gsc", "note"],
  cross_source_count: 4,
  google_trends_traffic: "100,000+",
  hatena_bookmarks: 350,
  news_count: 5,
  yahoo_news_count: 3,
  gsc_click_growth: "+400%",
  note_suki_count: 200,
  priority_score: (後述の計算式)
}
```

### Phase 3: フィルタリング

5. `/discover-trends` と同じカテゴリキーワードマップ（16 カテゴリ）で分類
6. `/discover-trends` と同じ除外ルールを適用

### Phase 4: 優先度スコアリング

7. 各トレンドに優先度スコアを算出:

```
priority_score =
  (cross_source_count × 25) +                // 複数ソースヒットを最重視（最大6ソース）
  (google_trends_traffic_normalized × 15) +  // 検索ボリューム
  (hatena_bookmarks_normalized × 10) +       // ネット議論の活発さ
  (news_count_normalized × 10) +             // Google News 報道量
  (yahoo_news_count_normalized × 10) +       // Yahoo!ニュース 報道量
  (gsc_growth_bonus) +                       // GSC 急上昇ボーナス: 新規=20, 急上昇=15, 表示急増=10, なし=0
  (note_suki_normalized × 5) +               // note.com での関心度
  (db_match_bonus)                           // DB マッチ度ボーナス: ★★★=30, ★★☆=15, ★☆☆=5
```

- `_normalized`: 各指標を 0〜10 に正規化（最大値を 10 とする線形スケーリング）
- `gsc_growth_bonus`: GSC で検出されたクエリは自サイトへの需要が確実なため高ボーナス

### Phase 5: DB マッチング

8. 優先度スコア上位 15 件について、ローカル D1 で DB マッチングを実行（`/discover-trends` の Phase 3 と同じクエリ）:

**8a. ranking_tags でタグ検索:**

```sql
SELECT DISTINCT ri.ranking_key, ri.title, ri.unit, ri.latest_year, rt.tag
FROM ranking_tags rt
JOIN ranking_items ri ON rt.ranking_key = ri.ranking_key AND rt.area_type = ri.area_type
WHERE rt.tag LIKE '%{keyword}%'
  AND ri.area_type = 'prefecture'
ORDER BY ri.latest_year DESC;
```

**8b. ranking_items でタイトル検索:**

```sql
SELECT DISTINCT ranking_key, title, unit, latest_year
FROM ranking_items
WHERE title LIKE '%{keyword}%'
  AND area_type = 'prefecture'
ORDER BY latest_year DESC;
```

**8c. estat_stats_tables で統計表カタログ検索:**

```sql
SELECT stats_data_id, title, gov_org, status, category_key
FROM estat_stats_tables
WHERE title LIKE '%{keyword}%'
ORDER BY status, title;
```

9. DB マッチ結果で `db_match_bonus` を確定し、最終スコアを再計算。

### Phase 6: 重複チェック

10. 既存記事との重複を確認:

```sql
SELECT slug, title, tags FROM articles;
```

### Phase 7: 候補生成

11. 最終スコア上位の候補について、以下の形式で生成:

```
## 候補 1: {キーワード}（スコア: {priority_score} / マッチ度: ★★★）

- **検出ソース**: Google Trends ✓ / はてブ ✓ / Google News ✓ / Yahoo! ✓ / GSC ✓ / note ✓
- **Google Trends**: 検索ボリューム {traffic}
- **はてブ**: {bookmarks} ブックマーク
- **Google News**: 関連ニュース {count} 件
- **Yahoo!ニュース**: 関連ニュース {count} 件
- **GSC**: {種別}（今期クリック {clicks}, 前期比 +{growth}%）
- **note.com**: {suki_count} スキ
- **分類カテゴリ**: {category_key}（{カテゴリ名}）
- **なぜ今注目か**: {背景の要約}

### 使えるデータ

| データ | ソース | ranking_key / statsDataId | 備考 |
|---|---|---|---|
| ... | DB既存 | ... | |
| ... | e-Stat候補 | ... | 要 /fetch-estat-data |

### 記事の切り口（案）

1. {切り口1}: {概要}
2. {切り口2}: {概要}

### 次のアクション

- [ ] `/fetch-article-data` でデータ取得
- [ ] `/generate-article-charts` でチャート生成
- [ ] 記事執筆
```

### Phase 8: サマリー・保存

12. 全結果を以下の形式でまとめる:

```markdown
# 統合トレンド × stats47 マッチング結果

> 調査日時: YYYY-MM-DD HH:MM
> ソース: Google Trends + はてブ + Google News + Yahoo!ニュース + GSC + note.com
> トレンド総数: N件（GT: A件 / はてブ: B件 / GNews: C件 / Yahoo: D件 / GSC: E件 / note: F件）
> クロスソースヒット: K件
> 採用: M件 / 除外: L件

## Top 候補（スコア順）

| # | トレンド | スコア | ソース | マッチ度 | カテゴリ | 記事の切り口 |
|---|---|---|---|---|---|---|
| 1 | 最低賃金 | 95 | GT+はてブ+News | ★★★ | laborwage | 都道府県別最低賃金の格差分析 |
| 2 | ... | 78 | GT+News | ★★☆ | ... | ... |

## クロスソースヒット（複数ソースで検出）

| トレンド | Google Trends | はてブ | GNews | Yahoo! | GSC | note |
|---|---|---|---|---|---|---|
| 最低賃金 | 100,000+ | 350 ブクマ | 5 件 | 3 件 | +400% | 200 スキ |
| ... | | | | | | |

## 除外トレンド

| トレンド | ソース | 除外理由 |
|---|---|---|
| ... | hatena | 技術記事 |

## 推奨アクション

1. **最優先**: {候補名} — {理由}
2. **次点**: {候補名} — {理由}
3. **データ取得が必要**: {候補名} — `/fetch-estat-data` で {statsDataId} を取得
```

13. `docs/21_ブログ記事原稿/trends-all-YYYY-MM-DD.md` に保存する。

## 注意

- **クロスソースヒットを最重視**: 複数ソースで同時に話題 = 社会的関心が高く、記事の需要が大きい
- **GSC は自サイトデータ**: 他の外部トレンドと異なり、stats47 への実需要が確実。GSC ヒットは優先度を上げてよい
- **実行時間**: 6 ソース取得 + DB マッチングで時間がかかる。急ぎの場合は個別スキルを使う
- **DB マッチングは上位 15 件に絞る**: 全候補に対して DB 検索すると時間がかかるため、スコア上位のみ
- **スコアは相対的**: 同日の候補間の比較用。日をまたいだスコア比較は意味がない

## 関連スキル

- `/discover-trends` — Google Trends 単体
- `/discover-trends-hatena` — はてブ単体
- `/discover-trends-news` — Google News 単体
- `/discover-trends-yahoo` — Yahoo!ニュース単体
- `/discover-trends-gsc` — GSC 急上昇クエリ単体
- `/discover-trends-note` — note.com 単体
- `/plan-blog-articles` — カテゴリ起点の記事企画（トレンド起点ではない）
- `/fetch-article-data` — 候補確定後のデータ一括取得
