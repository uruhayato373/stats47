---
name: discover-trends-hatena
description: はてなブックマーク Hot Entry からトレンドを取得し stats47 データとマッチングしてブログ記事候補を提案する。Use when user says "はてブトレンド", "はてなトレンド". ネット議論ベースのテーマ発見.
disable-model-invocation: true
---

はてなブックマーク Hot Entry RSS からトレンドを取得し、stats47 の統計データとマッチングしてブログ記事候補を提案する。

## 用途

- はてブで話題の社会・政治・経済ネタから記事テーマを発見したいとき
- Google Trends（瞬間的な検索急上昇）とは異なる、ネット上で議論されている話題を拾いたいとき
- `/discover-trends`（Google Trends 起点）と補完的に使う

## 引数

```
$ARGUMENTS — [カテゴリ]
             カテゴリ: all | social | economics | life | knowledge（デフォルト: all）
             all: 総合 + 社会 + 政治と経済 + 暮らし + 学び を全取得
```

## 手順

### Phase 1: トレンド取得

1. はてなブックマーク Hot Entry RSS を WebFetch で取得:

| カテゴリ | URL |
|---|---|
| 総合 | `https://b.hatena.ne.jp/hotentry.rss` |
| 社会 | `https://b.hatena.ne.jp/hotentry/social.rss` |
| 政治と経済 | `https://b.hatena.ne.jp/hotentry/economics.rss` |
| 暮らし | `https://b.hatena.ne.jp/hotentry/life.rss` |
| 学び | `https://b.hatena.ne.jp/hotentry/knowledge.rss` |

- 各 `<item>` から以下を抽出:
  - `<title>` — 記事タイトル
  - `<link>` — 記事 URL
  - `<description>` — 概要
  - `<hatena:bookmarkcount>` — ブックマーク数（注目度の指標）

2. `all` の場合は上記 5 カテゴリすべてを取得し、URL で重複を除去する。

### Phase 2: フィルタリング

3. `/discover-trends` と同じカテゴリキーワードマップ（16 カテゴリ）を使い、各エントリを stats47 のカテゴリに分類する。

4. **除外するエントリ** — 以下に該当するものは除外:
   - 芸能人・有名人の個人ニュース
   - スポーツの試合結果・選手個人ニュース
   - ゲーム・アニメ・漫画の新作リリース
   - TV 番組・映画の放送情報
   - プログラミング・技術記事（stats47 のカテゴリに無関係なもの）
   - 商品・サービスの単発プロモーション

5. フィルタリング結果をまとめる:
   - **採用**: カテゴリ分類できたエントリ → Phase 3 へ
   - **除外**: 理由を簡潔に記録

### Phase 3: DB マッチング

`/discover-trends` と同じ手順（ranking_tags / ranking_items / estat_stats_tables で検索）。

6. 採用した各エントリについて、ローカル D1 で以下のクエリを実行:

**6a. ranking_tags でタグ検索:**

```sql
SELECT DISTINCT ri.ranking_key, ri.title, ri.unit, ri.latest_year, rt.tag
FROM ranking_tags rt
JOIN ranking_items ri ON rt.ranking_key = ri.ranking_key AND rt.area_type = ri.area_type
WHERE rt.tag LIKE '%{keyword}%'
  AND ri.area_type = 'prefecture'
ORDER BY ri.latest_year DESC;
```

**6b. ranking_items でタイトル検索:**

```sql
SELECT DISTINCT ranking_key, title, unit, latest_year
FROM ranking_items
WHERE title LIKE '%{keyword}%'
  AND area_type = 'prefecture'
ORDER BY latest_year DESC;
```

**6c. estat_stats_tables で統計表カタログ検索:**

```sql
SELECT stats_data_id, title, gov_org, status, category_key
FROM estat_stats_tables
WHERE title LIKE '%{keyword}%'
ORDER BY status, title;
```

7. マッチ度を判定:

| マッチ度 | 基準 |
|---|---|
| ★★★ | ranking_items に直接関連するデータあり |
| ★★☆ | estat_stats_tables に候補あり、または間接的な関連データあり |
| ★☆☆ | カテゴリ的に関連するが直接マッチなし |

### Phase 4: 重複チェック

8. 既存記事との重複を確認:

```sql
SELECT slug, title, tags FROM articles;
```

### Phase 5: 候補生成

9. マッチ度 ★★☆ 以上の候補について、以下の形式で生成:

```
## 候補: {エントリタイトル要約}（マッチ度: ★★★）

- **ソース**: はてなブックマーク Hot Entry
- **ブックマーク数**: {bookmarkcount}
- **元記事**: {link}
- **分類カテゴリ**: {category_key}（{カテゴリ名}）
- **話題の背景**: なぜこのテーマが注目されているか

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

10. 全結果を以下の形式でまとめる:

```markdown
# はてブトレンド × stats47 マッチング結果

> 調査日時: YYYY-MM-DD HH:MM
> ソース: はてなブックマーク Hot Entry
> エントリ総数: N件
> 採用: M件 / 除外: L件

## 候補一覧

| # | エントリ | ブクマ数 | マッチ度 | カテゴリ | 記事の切り口 | 必要アクション |
|---|---|---|---|---|---|---|
| 1 | ... | 500 | ★★★ | ... | ... | すぐ執筆可 |

## 除外エントリ

| エントリ | 除外理由 |
|---|---|
| ... | 技術記事（カテゴリ外） |

## 推奨アクション

1. {最も推奨する候補とその理由}
```

11. `docs/21_ブログ記事原稿/trends-hatena-YYYY-MM-DD.md` に保存する。

## 注意

- **ブックマーク数 = 注目度**: ブックマーク数が多いほど議論・関心が高い。100 以上は注目度高
- **RSS の特性**: Hot Entry は直近数日のエントリが含まれる。Google Trends のような「今日の急上昇」ではなく「数日間で話題になったもの」
- **検索キーワードの拡張**: `/discover-trends` と同様、トレンドキーワードの同義語・関連語でも DB 検索する

## 関連スキル

- `/discover-trends` — Google Trends 起点の記事企画
- `/discover-trends-news` — Google News 起点の記事企画
- `/discover-trends-all` — 全ソース統合トレンド発見
