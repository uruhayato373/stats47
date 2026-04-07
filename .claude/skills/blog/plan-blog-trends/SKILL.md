---
name: plan-blog-trends
description: トレンド起点でブログ記事企画を生成する。Use when user says "トレンド記事企画", "旬の記事", "トレンドから企画". トレンド検出から企画フォーマット出力まで1スキルで完結.
---

トレンド起点でブログ記事企画を生成する。`/discover-trends-all` のトレンド検出から企画フォーマット出力までを1スキルで完結させる。

## 用途

- 時事ネタ × 既存統計データでタイムリーな記事を企画したいとき
- `/plan-blog-articles`（カテゴリ起点）では拾えない旬のテーマを狙いたいとき
- トレンド検出 → 企画を1ステップで実行したいとき

## 引数

```
$ARGUMENTS — [maxArticles]
             maxArticles: 生成する企画数の上限（デフォルト: 3）
```

## 手順

### Phase 1: トレンド収集

以下のソースから **並行して** トレンドを取得する:

1. **Google Trends RSS**:
   ```
   WebFetch: https://trends.google.co.jp/trending/rss?geo=JP
   ```
   - `<title>` からキーワード、`<ht:approx_traffic>` から検索ボリュームを抽出

2. **はてなブックマーク Hot Entry**:
   ```
   WebFetch: https://b.hatena.ne.jp/hotentry/it.rss
   WebFetch: https://b.hatena.ne.jp/hotentry/social.rss
   WebFetch: https://b.hatena.ne.jp/hotentry/life.rss
   ```

3. **Yahoo! ニュース トピックス**:
   ```
   WebFetch: https://news.yahoo.co.jp/rss/topics/top-picks.xml
   ```

4. **Google News JP**:
   ```
   WebFetch: https://news.google.com/rss?hl=ja&gl=JP&ceid=JP:ja
   ```

### Phase 2: stats47 データとのマッチング

5. 各トレンドキーワードについて、DB の登録済み指標とマッチングする:

```sql
-- キーワードに関連する指標を検索
SELECT ri.ranking_key, ri.ranking_name, ri.unit, ri.category_key
FROM ranking_items ri
WHERE ri.is_active = 1 AND ri.area_type = 'prefecture'
  AND (ri.ranking_name LIKE '%{keyword}%' OR ri.title LIKE '%{keyword}%');
```

6. マッチ度を判定（3段階）:
   - ★★★: DB 既存データで即執筆可能（3指標以上マッチ）
   - ★★☆: DB 既存データあるが補助データの取得が必要
   - ★☆☆: 関連データが薄い（候補止まり）

7. ★★☆ 以上のトレンドのみ採用。以下を除外:
   - スポーツの試合結果・芸能ゴシップ
   - 都道府県データと結びつかない国際ニュース
   - 既存記事と同テーマ（articles テーブルで重複チェック）

### Phase 3: 企画生成

8. 採用したトレンドごとに、以下の構成案を生成する:

**出力フォーマット（1記事分）:**

```yaml
## 記事企画: {slug}

- title: "..."
- subtitle: "..."
- description: "..."
- category: {categoryKey}
- tags: [タグ1, タグ2, ...]
- target: ターゲット読者
- trend_source: トレンド元（Google Trends / はてブ / Yahoo! 等）
- trend_keyword: 元のトレンドキーワード
- search_volume: 検索ボリューム（わかる場合）
- urgency: high / medium（鮮度が重要なら high）
- seo_keywords: [kw1, kw2, ...]

### 使用データ

| 指標 | ソース | ranking_key / statsDataId | 備考 |
|---|---|---|---|
| 指標名 | DB既存 | ranking-key-here | |

### チャート構成

| # | 種類 | データ | 説明 |
|---|---|---|---|
| 1 | tile-grid-map | 指標A | 都道府県別の色分け |
| 2 | scatter | 指標A × 指標B | 相関分析 |

### 骨子

1. リード文: トレンドのニュース → 都道府県データで深掘りする導入
2. セクション1: メインランキング
3. セクション2: データの掛け合わせ分析
4. データ出典
5. 関連ランキングリンク
```

利用可能なチャート種類:
- `bar`: 上位10・下位10の横棒グラフ
- `tile-grid-map`: 都道府県タイルマップ
- `line`: 折れ線グラフ（時系列）
- `scatter`: 散布図（2指標の相関）
- `stacked-bar`: 積み上げ棒グラフ
- `summary-findings`: まとめ表

### Phase 4: 出力

9. `docs/20_ブログ記事企画/trends-{YYYY-MM-DD}.md` に保存。ファイル冒頭に以下のヘッダーを付与:

```markdown
# トレンド起点ブログ記事企画

> 生成日: YYYY-MM-DD
> トレンドソース: Google Trends / はてブ / Yahoo! / Google News
> 採用: N件 / 除外: M件

---
```

10. 生成結果のサマリーをユーザーに報告:
    - 採用/除外の内訳と除外理由
    - 各企画の slug・title・urgency
    - urgency=high の企画は即執筆を推奨

## タイトル設計ルール

`/plan-blog-articles` と同一ルールに従う（詳細は同スキル参照）:

- **`title`**: 上限17全角文字相当。「都道府県別・」は省略
- **`subtitle`**: フック・数値比較
- `title` に `──` や `｜` を含めない
- **`title` を「○○ランキング」にしない**（`/ranking/` ページとの検索カニバリ回避）
- **「○○格差」「○○の地域差」も多用しない**（パターン化して全記事が同じに見える）
- **slug に `-ranking` を付けない**（`/ranking/` の URL と混同されるため。記事の切り口を反映した命名にする）

## 品質チェックリスト

- [ ] 既存記事（articles テーブル）と同じテーマが含まれていないか
- [ ] トレンドとデータの関連性が読者に伝わる構成か
- [ ] 鮮度が重要なテーマに urgency=high が設定されているか
- [ ] slug がケバブケースで、既存記事と重複しないか

## 注意

- **即時性を重視**: urgency=high の企画は1〜2日以内に執筆しないと効果が薄れる
- **無理なマッチングを避ける**: トレンドと統計データの関連が薄い場合は除外する
- **複数ソースでヒット**: 同じテーマが複数ソースで話題なら優先度を上げる

## 関連スキル

- `/discover-trends-all` — 個別にトレンド検出だけ実行したい場合
- `/plan-blog-articles` — カテゴリ起点の汎用企画
- `/fetch-article-data` — 企画確定後のデータ一括取得
- `/generate-article-charts` — チャート SVG 生成
