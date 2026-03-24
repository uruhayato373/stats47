Yahoo!ニュース トピックス RSS から日本の主要ニューストレンドを取得し、stats47 の統計データとマッチングしてブログ記事候補を提案する。

## 用途

- 日本最大のニュースポータルで取り上げられている話題から記事テーマを発見したいとき
- Google News とは異なるキュレーション（Yahoo!ニュース編集部の選定）による話題を拾いたいとき
- 国内・経済・地域ニュースに強い Yahoo!ニュースの特性を活かしたテーマ発見

## 引数

```
$ARGUMENTS — [カテゴリ]
             カテゴリ: all | domestic | business | local | science | life（デフォルト: all）
             all: 主要 + 国内 + 経済 + 地域 + 科学 + ライフ を全取得
```

## 手順

### Phase 1: トレンド取得

1. Yahoo!ニュース RSS を WebFetch で取得:

| カテゴリ | URL |
|---|---|
| 主要 | `https://news.yahoo.co.jp/rss/topics/top-picks.xml` |
| 国内 | `https://news.yahoo.co.jp/rss/topics/domestic.xml` |
| 経済 | `https://news.yahoo.co.jp/rss/topics/business.xml` |
| 地域 | `https://news.yahoo.co.jp/rss/topics/local.xml` |
| 科学 | `https://news.yahoo.co.jp/rss/topics/science.xml` |
| ライフ | `https://news.yahoo.co.jp/rss/topics/life.xml` |

- 各 `<item>` から以下を抽出:
  - `<title>` — ニュースタイトル
  - `<link>` — ニュース URL
  - `<pubDate>` — 公開日時

2. `all` の場合は全カテゴリを取得し、URL で重複を除去する。

3. **キーワード抽出**: 各ニュースタイトルからトレンドキーワード（名詞・固有名詞）を抽出。同じキーワードが複数ニュースに出現する場合は 1 トレンドにまとめる。

### Phase 2: フィルタリング

4. `/discover-trends` と同じカテゴリキーワードマップ（16 カテゴリ）で分類する。

5. **除外するニュース** — 以下に該当するものは除外:
   - 芸能人・有名人の個人ニュース（スキャンダル、結婚、引退等）
   - スポーツの試合結果・選手個人ニュース
   - ゲーム・アニメ・漫画の新作リリース
   - TV 番組・映画の放送情報
   - 政治家個人のスキャンダル・発言（政策関連は除外しない）
   - 商品・サービスの単発プロモーション
   - 海外ニュース（日本の都道府県データと結びつかないもの）
   - 事件・事故の速報（個別事案で統計化が困難なもの）

6. フィルタリング結果をまとめる:
   - **採用**: カテゴリ分類できたトレンド → Phase 3 へ
   - **除外**: 理由を簡潔に記録

### Phase 3: DB マッチング

7. 採用した各トレンドについて、ローカル D1 で関連データを検索:

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

- **ソース**: Yahoo!ニュース
- **関連ニュース数**: {同キーワードのニュース件数}
- **主要記事**: {最も代表的なニュースタイトル}
- **Yahoo!カテゴリ**: {domestic|business|local|...}
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

11. 全結果をまとめる:

```markdown
# Yahoo!ニュース トレンド × stats47 マッチング結果

> 調査日時: YYYY-MM-DD HH:MM
> ソース: Yahoo!ニュース トピックス RSS
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
| ... | 芸能ニュース |

## 推奨アクション

1. {最も推奨する候補とその理由}
```

12. `docs/21_ブログ記事原稿/trends-yahoo-YYYY-MM-DD.md` に保存する。

## 注意

- **Yahoo!ニュースの強み**: 国内ニュース・地域ニュースのカバーが厚い。地域カテゴリは都道府県別記事テーマの発見に特に有効
- **RSS の更新頻度**: トピックス RSS は頻繁に更新される。取得時点のスナップショット
- **Google News との使い分け**: Yahoo!ニュースは編集部が選定したトピックス、Google News はアルゴリズム選定。両方使うことでカバー率が上がる
- **RSS URL の変更可能性**: Yahoo!ニュースの RSS URL は変更される可能性がある。エラーが出た場合は `https://news.yahoo.co.jp/rss` で最新の RSS 一覧を確認

## 関連スキル

- `/discover-trends` — Google Trends 起点
- `/discover-trends-news` — Google News 起点
- `/discover-trends-all` — 全ソース統合
