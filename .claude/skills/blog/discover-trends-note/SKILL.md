---
name: discover-trends-note
description: note.com のトレンド記事から話題テーマを取得し stats47 データとマッチングしてブログ記事候補を提案する。Use when user says "noteトレンド", "note.comトレンド". クリエイター層の関心ベースのテーマ発見.
disable-model-invocation: true
---

note.com のトレンド記事から話題のテーマを取得し、stats47 の統計データとマッチングしてブログ記事候補を提案する。

## 用途

- note のクリエイター層で話題になっているテーマから記事企画を発見したいとき
- 社会問題・ライフスタイル・経済に関する深い考察記事のトレンドを拾いたいとき
- はてブ（テック寄り）や Yahoo!ニュース（速報寄り）とは異なる、個人の関心・議論ベースのトレンドを把握したいとき

## 引数

```
$ARGUMENTS — なし（自動で複数手法でトレンドを取得）
```

## 手順

### Phase 1: トレンド取得

note.com には公式の RSS やトレンド API がないため、以下の複数手法で取得する。

#### 1a. WebSearch でトレンド記事を検索

```
WebSearch: "site:note.com" 都道府県 ランキング
WebSearch: "site:note.com" 統計 都道府県
WebSearch: "site:note.com" 地域格差
WebSearch: "site:note.com" 人口減少 地方
```

- stats47 のカテゴリに関連する検索クエリで note.com の人気記事を発見
- 直近 1 ヶ月以内の記事を優先

#### 1b. note.com の注目カテゴリページを WebFetch

以下の URL から注目記事を取得:

```
WebFetch: https://note.com/topic/society（社会）
WebFetch: https://note.com/topic/economy（経済）
WebFetch: https://note.com/topic/lifestyle（ライフスタイル）
WebFetch: https://note.com/topic/local（地域）
```

- HTML からタイトル・URL・スキ数を抽出
- スキ数が多い = 注目度が高い

#### 1c. WebSearch で note トレンドを間接取得

```
WebSearch: note.com 話題 今週 社会
WebSearch: note.com 人気記事 統計 データ
```

- note.com のまとめ記事やランキング紹介から話題を間接的に把握

### Phase 2: 整理・重複除去

2. 全手法の結果を統合し、URL で重複除去
3. 各記事から以下を整理:
   - タイトル
   - URL
   - スキ数（取得できた場合）
   - 著者名
   - テーマキーワード（タイトルから抽出）

### Phase 3: フィルタリング

4. `/discover-trends` と同じカテゴリキーワードマップ（16 カテゴリ）で分類する。

5. **除外する記事**:
   - 個人の日記・エッセイ（統計テーマと無関係なもの）
   - 創作・小説・ポエム
   - 商品レビュー・アフィリエイト記事
   - プログラミング・技術記事（stats47 カテゴリ外）
   - 自己啓発・ビジネスハウツー（統計データと結びつかないもの）

6. フィルタリング結果をまとめる:
   - **採用**: カテゴリ分類できた記事 → Phase 4 へ
   - **除外**: 理由を簡潔に記録

### Phase 4: DB マッチング

7. 採用した各テーマについて、ローカル D1 で関連データを検索:

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

### Phase 5: 重複チェック

9. 既存記事との重複を確認:

```sql
SELECT slug, title, tags FROM articles;
```

### Phase 6: 候補生成

10. マッチ度 ★★☆ 以上の候補について、以下の形式で生成:

```
## 候補: {テーマキーワード}（マッチ度: ★★★）

- **ソース**: note.com
- **注目記事**: {タイトル}（{URL}）
- **スキ数**: {suki_count}（取得できた場合）
- **分類カテゴリ**: {category_key}（{カテゴリ名}）
- **note での議論**: どのような視点で語られているか

### stats47 ならではの切り口

- note の記事は個人の意見・体験ベースが多い → stats47 は**データで裏付ける**記事を書ける
- 「〇〇が問題だ」という主張に対し、都道府県別データで実態を可視化

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

### Phase 7: サマリー・保存

11. 全結果をまとめる:

```markdown
# note.com トレンド × stats47 マッチング結果

> 調査日時: YYYY-MM-DD HH:MM
> ソース: note.com（WebSearch + トピックページ）
> 記事総数: N件
> 採用: M件 / 除外: L件

## 候補一覧

| # | テーマ | スキ数 | マッチ度 | カテゴリ | stats47 の切り口 | 必要アクション |
|---|---|---|---|---|---|---|
| 1 | 地方移住 | 500 | ★★★ | population | 転入超過率の都道府県ランキング | すぐ執筆可 |

## 除外記事

| 記事 | 除外理由 |
|---|---|
| ... | 個人エッセイ |

## 推奨アクション

1. {最も推奨する候補とその理由}
```

12. `.claude/skills/blog/trends-snapshots/trends-note-YYYY-MM-DD.md` に保存する。

## 注意

- **公式 API なし**: WebSearch + WebFetch による間接取得のため、データの網羅性は他ソースより低い
- **スキ数の取得**: トピックページから HTML パースで取得を試みるが、取得できない場合もある
- **note の特性**: 個人の深い考察が多い。stats47 は「データで裏付ける」差別化ができる
- **検索クエリは stats47 カテゴリに寄せる**: 汎用的な検索ではなく、統計・データ・都道府県に関連する記事を狙って検索する
- **HTML パースの不安定さ**: note.com のページ構造が変更されると WebFetch の結果パースに失敗する可能性がある。その場合は WebSearch のみで代替する

## 関連スキル

- `/discover-trends` — Google Trends 起点
- `/discover-trends-hatena` — はてブ起点
- `/discover-trends-all` — 全ソース統合
