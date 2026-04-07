---
name: discover-trends-news
description: Google News RSS からニューストレンドを取得し stats47 データとマッチングしてブログ記事候補を提案する。Use when user says "ニューストレンド", "Google Newsトレンド". メディア報道ベースのテーマ発見.
disable-model-invocation: true
---

Google News RSS から日本のニューストレンドを取得し、stats47 の統計データとマッチングしてブログ記事候補を提案する。

## 用途

- ニュースで報道されている社会課題・経済動向から記事テーマを発見したいとき
- Google Trends（検索急上昇）やはてブ（ネット議論）とは異なる、メディア報道ベースのトレンドを拾いたいとき
- `/discover-trends`、`/discover-trends-hatena` と補完的に使う

## 引数

```
$ARGUMENTS — [トピック] [件数]
             トピック: all | nation | business | science | health | lifestyle（デフォルト: all）
             件数: 数値（デフォルト: 30）
             all: 全トピックを取得
```

## 手順

### Phase 1: トレンド取得

1. Google News RSS を WebFetch で取得:

| トピック | URL |
|---|---|
| 国内トップ | `https://news.google.com/rss?hl=ja&gl=JP&ceid=JP:ja` |
| 国内 | `https://news.google.com/rss/topics/CAAqIQgKIhtDQkFTRGdvSUwyMHZNRFZ4ZERBU0FtcGhLQUFQAQ?hl=ja&gl=JP&ceid=JP:ja` |
| ビジネス | `https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGx6TVdZU0FtcGhHZ0pLVUNnQVAB?hl=ja&gl=JP&ceid=JP:ja` |
| テクノロジー | `https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGRqTVhZU0FtcGhHZ0pLVUNnQVAB?hl=ja&gl=JP&ceid=JP:ja` |
| 健康 | `https://news.google.com/rss/topics/CAAqIQgKIhtDQkFTRGdvSUwyMHZNR3QwTlRFU0FtcGhLQUFQAQ?hl=ja&gl=JP&ceid=JP:ja` |

- 各 `<item>` から以下を抽出:
  - `<title>` — ニュースタイトル（末尾の「 - メディア名」を除去）
  - `<link>` — ニュース URL
  - `<pubDate>` — 公開日時
  - `<source>` — メディア名

2. `all` の場合は全トピックを取得し、URL で重複を除去。件数上限まで `pubDate` 降順でソートする。

3. **キーワード抽出**: 各ニュースタイトルからトレンドキーワード（名詞・固有名詞）を抽出する。同じキーワードが複数ニュースに出現する場合はまとめて 1 トレンドとし、関連ニュース数を記録する。

### Phase 2: フィルタリング

4. `/discover-trends` と同じカテゴリキーワードマップ（16 カテゴリ）を使い、各トレンドを分類する。

5. **除外するニュース** — 以下に該当するものは除外:
   - 芸能人・有名人の個人ニュース
   - スポーツの試合結果・選手個人ニュース
   - ゲーム・アニメ・漫画の新作リリース
   - TV 番組・映画の放送情報
   - 政治家個人のスキャンダル・発言（政策関連は除外しない）
   - 商品・サービスの単発プロモーション
   - 海外ニュース（日本の都道府県データと結びつかないもの）

6. フィルタリング結果をまとめる:
   - **採用**: カテゴリ分類できたトレンド → Phase 3 へ
   - **除外**: 理由を簡潔に記録

### Phase 3: DB マッチング

`/discover-trends` と同じ手順。

7. 採用した各トレンドについて、ローカル D1 で以下のクエリを実行:

**7a. ranking_tags でタグ検索:**

```sql
SELECT DISTINCT ri.ranking_key, ri.title, ri.unit, ri.latest_year, rt.tag
FROM ranking_tags rt
JOIN ranking_items ri ON rt.ranking_key = ri.ranking_key AND rt.area_type = ri.area_type
WHERE rt.tag LIKE '%{keyword}%'
  AND ri.area_type = 'prefecture'
ORDER BY ri.latest_year DESC;
```

**7b. ranking_items でタイトル検索:**

```sql
SELECT DISTINCT ranking_key, title, unit, latest_year
FROM ranking_items
WHERE title LIKE '%{keyword}%'
  AND area_type = 'prefecture'
ORDER BY latest_year DESC;
```

**7c. estat_stats_tables で統計表カタログ検索:**

```sql
SELECT stats_data_id, title, gov_org, status, category_key
FROM estat_stats_tables
WHERE title LIKE '%{keyword}%'
ORDER BY status, title;
```

8. マッチ度を判定:

| マッチ度 | 基準 |
|---|---|
| ★★★ | ranking_items に直接関連するデータあり |
| ★★☆ | estat_stats_tables に候補あり、または間接的な関連データあり |
| ★☆☆ | カテゴリ的に関連するが直接マッチなし |

### Phase 4: 重複チェック

9. 既存記事との重複を確認:

```sql
SELECT slug, title, tags FROM articles;
```

### Phase 5: 候補生成

10. マッチ度 ★★☆ 以上の候補について、以下の形式で生成:

```
## 候補: {トレンドキーワード}（マッチ度: ★★★）

- **ソース**: Google News
- **関連ニュース数**: {同キーワードのニュース件数}
- **主要記事**: {最も代表的なニュースタイトル + URL}
- **分類カテゴリ**: {category_key}（{カテゴリ名}）
- **ニュースの背景**: なぜこのテーマが報道されているか

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

### Phase 6: サマリー・保存

11. 全結果を以下の形式でまとめる:

```markdown
# Google News トレンド × stats47 マッチング結果

> 調査日時: YYYY-MM-DD HH:MM
> ソース: Google News RSS
> ニュース総数: N件
> トレンドキーワード: K件
> 採用: M件 / 除外: L件

## 候補一覧

| # | トレンド | ニュース数 | マッチ度 | カテゴリ | 記事の切り口 | 必要アクション |
|---|---|---|---|---|---|---|
| 1 | ... | 3 | ★★★ | ... | ... | すぐ執筆可 |

## 除外ニュース

| ニュース | 除外理由 |
|---|---|
| ... | 海外ニュース |

## 推奨アクション

1. {最も推奨する候補とその理由}
```

12. `docs/21_ブログ記事原稿/trends-news-YYYY-MM-DD.md` に保存する。

## 注意

- **Google News RSS の URL はトピック ID を含む**: トピック ID は固定値。URL が変更される可能性がある場合は WebSearch で最新の RSS URL を確認する
- **同一キーワードの集約**: 複数ニュースに同じキーワードが出現する場合、1 トレンドとしてまとめる。関連ニュース数が多いほど重要度が高い
- **pubDate でフィルタ**: 直近 3 日以内のニュースのみ対象とする（古いニュースは除外）
- **検索キーワードの拡張**: `/discover-trends` と同様、同義語・関連語でも DB 検索する

## 関連スキル

- `/discover-trends` — Google Trends 起点の記事企画
- `/discover-trends-hatena` — はてブ起点の記事企画
- `/discover-trends-all` — 全ソース統合トレンド発見
