---
name: plan-blog-affiliate
description: アフィリエイト収益直結のブログ記事を企画する。Use when user says "アフィリエイト記事企画", "収益記事", "affiliate記事". 商材と統計データで行動喚起する記事を設計.
disable-model-invocation: true
---

アフィリエイト収益に直結するブログ記事を企画する。`AFFILIATE_LINKS` の8カテゴリに対応する統計データを活用し、CVR（コンバージョン率）が高いテーマを優先的に企画する。

## 用途

- アフィリエイト収益を意識した記事を企画したいとき
- 既存のアフィリエイトカテゴリ（転職・引越し・マッチング等）に合う記事ネタを探したいとき
- 読者の行動喚起（比較・検討・申込み）につながるデータ記事を設計したいとき

## 引数

```
$ARGUMENTS — [affiliateCategory] [articleCount]
             affiliateCategory: 対象カテゴリ（省略時は全カテゴリ）
               labor / housing / population / economy / health / energy / tourism / furusato
             articleCount: 生成する企画数（デフォルト: 全カテゴリなら各1本、指定時は3本）
```

## アフィリエイトカテゴリ → 統計カテゴリマッピング

```
apps/web/src/features/ads/constants/affiliate-category.ts
```

| アフィリエイト | category_key | アフィリエイト商材 |
|---|---|---|
| labor | laborwage | 転職エージェント（リクルートエージェント） |
| housing | construction, landweather | 引越し見積もり（引越し侍） |
| population | population | マッチングアプリ（Pairs） |
| economy | economy | 証券口座（SBI証券） |
| health | socialsecurity | フィットネス（chocoZAP） |
| energy | energy | ウォーターサーバー（クリクラ） |
| tourism | tourism | 車査定（カーセンサー） |
| furusato | administrativefinancial | ふるさと納税（さとふる） |

## 手順

### Phase 1: ターゲット商材の理解

1. 対象アフィリエイトカテゴリの商材を確認:
   - `AFFILIATE_LINKS` の title / description / href
   - 商材の CVR が高い読者層（年齢・関心・行動意図）を特定

2. その商材を「欲しくなる」データストーリーを考える:
   - labor（転職）: 「自分の県の賃金は低い？」→ 転職を検討
   - housing（引越し）: 「住みやすい県はどこ？」→ 引越しを検討
   - population（マッチング）: 「未婚率が高い県は？」→ 出会いを求める
   - economy（証券）: 「貯蓄額の地域差」→ 資産運用を検討
   - health（フィットネス）: 「健康寿命が短い県は？」→ 運動習慣を検討
   - energy（ウォーターサーバー）: 「水道水の水質差」→ 水への関心
   - tourism（車査定）: 「車保有率が高い県」→ 車の買い替え検討
   - furusato（ふるさと納税）: 「財政力の弱い自治体」→ 寄付先を検討

### Phase 2: データインベントリ（DB + e-Stat API の両面で探索）

**DB だけに頼らず、e-Stat API も積極的に探索してデータの幅を広げること。**

3. 対象カテゴリの DB 登録済み指標を検索:

```sql
SELECT ri.ranking_key, ri.ranking_name, ri.unit, ri.category_key, ri.source_config
FROM ranking_items ri
WHERE ri.is_active = 1 AND ri.area_type = 'prefecture'
  AND ri.category_key IN ({対象 category_key のリスト});
```

4. **e-Stat API で関連データを探索**（`/search-estat` 相当）:
   - DB に登録されていない関連統計を検索する
   - 特に以下の視点で探す:
     - **時系列で変化が大きいデータ**（トレンド分析用）
     - **構成比・内訳データ**（stacked-bar 用）
     - **異カテゴリの掛け合わせ候補**（散布図・相関分析用）
   - 見つけた statsDataId は `/inspect-estat-meta` で構造を確認する

5. タグベースでも関連指標を横断検索:

```sql
SELECT slug, title, tags FROM articles
WHERE tags LIKE '%賃金%' OR tags LIKE '%転職%' -- etc.
```

6. 異カテゴリの掛け合わせ指標も検討:
   - 例: labor × economy（賃金 × 物価で「実質的な豊かさ」）
   - 例: housing × population（持ち家率 × 人口増減率で「住みたい県」）

### Phase 3: 企画生成

7. 各テーマについて、**多角的な分析と読者の行動喚起** を意識した構成案を生成する。

**記事の質を確保するため、以下の3つの分析視点を必ず含めること:**

| 分析視点 | 必須 | 内容 | チャート例 |
|---------|------|------|----------|
| ランキング分析 | ◎ | 都道府県別の順位・格差を可視化 | bar, tile-grid-map |
| 時系列分析 | ◎ | 全国推移・変化の方向性を示す | line |
| 構造分析 | ◎ | 複数指標の掛け合わせ・内訳・相関 | scatter, stacked-bar, table |

**ランキングだけの薄い記事にしない。** 既存の良質記事（例: `education-expenses-gap`）のように、データから構造的な発見を導き出す記事を目指す。

**出力フォーマット（1記事分）:**

```yaml
## 記事企画: {slug}

- title: "..."
- subtitle: "..."
- description: "..."
- category: {categoryKey}
- tags: [タグ1, タグ2, ...]
- target: ターゲット読者
- affiliate_category: labor / housing / population / economy / health / energy / tourism / furusato
- affiliate_product: 商材名（例: リクルートエージェント）
- conversion_story: 読者がデータを見て商材に興味を持つストーリー（1文）
- seo_keywords: [kw1, kw2, ...]

### 記事の核心メッセージ

この記事で読者に伝えたい「発見」を1〜2文で記述。
単なる順位紹介ではなく、データから導かれる構造的な洞察。

### 使用データ

| 指標 | ソース | ranking_key / statsDataId | 用途 | 備考 |
|---|---|---|---|---|
| 指標名 | DB既存 | ranking-key-here | ランキング | |
| 指標名 | DB既存 | ranking-key-here | 時系列 | cdArea: "00000" で全国推移取得 |
| 指標名 | e-Stat新規 | statsDataId + cdCat01 | 構造分析 | 要 /fetch-estat-data |

### チャート構成（最低5枚）

| # | 種類 | データ | 説明 |
|---|---|---|---|
| 1 | bar | 指標A | 上位10・下位10 |
| 2 | tile-grid-map | 指標A | 都道府県別色分け |
| 3 | line | 指標A（時系列） | 全国推移（トレンド把握） |
| 4 | scatter | 指標A × 指標B | 相関分析（構造的要因） |
| 5 | summary-findings | まとめ | 記事のファインディング一覧 |

### 骨子（5セクション以上）

1. リード文: 読者の関心を引くデータファクト（具体的な数値を含む）
2. セクション1: メインランキング（自分の県の立ち位置を確認）
3. セクション2: 時系列分析（この10〜20年でどう変わったか、トレンドの方向性）
4. セクション3: 構造分析（なぜ地域差が生まれるのか、他指標との掛け合わせ）
5. セクション4: 深掘り（サブカテゴリの内訳、男女差、年齢別など）
6. セクション5: まとめ（データから見えた構造 + 自然な行動喚起）
7. データ出典
8. 関連ランキングリンク
```

利用可能なチャート種類:
- `bar`: 上位10・下位10の横棒グラフ
- `tile-grid-map`: 都道府県タイルマップ
- `line`: 折れ線グラフ（時系列）
- `scatter`: 散布図（2指標の相関）
- `stacked-bar`: 積み上げ棒グラフ
- `summary-findings`: まとめ表

> **⚠ 記事内テーブル禁止ルール:** マークダウンテーブルと `<ranking-table>` は原則使わない。データは SVG チャートか本文太字で表現し、全データは `<source-link>` でランキングページへ誘導する。例外: 採点方法・多次元スコア・相関係数のみ許可。

### Phase 4: 出力

8. `docs/20_ブログ記事企画/affiliate-{affiliateCategory}.md` に保存（全カテゴリ実行時は `affiliate-all.md`）。ファイル冒頭に以下のヘッダー:

```markdown
# アフィリエイト起点ブログ記事企画

> 生成日: YYYY-MM-DD
> 対象: {アフィリエイトカテゴリ名}（{商材名}）
> 企画数: N件

---
```

9. 生成結果のサマリーをユーザーに報告:
    - 各企画の slug・title・affiliate_category
    - conversion_story の一覧
    - DB 既存データのみで書ける記事 vs 追加取得が必要な記事の内訳

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
- [ ] アフィリエイト導線が自然か（押し売り感がないか）
- [ ] データと商材の関連性が読者に納得感があるか
- [ ] 記事としての情報価値が独立しているか（広告記事にならないこと）
- [ ] slug がケバブケースで、既存記事と重複しないか
- [ ] **3つの分析視点（ランキング・時系列・構造分析）がすべて含まれているか**
- [ ] **チャートが最低5枚構成になっているか**
- [ ] **時系列データの取得可否（statsDataId + cdArea: "00000"）を確認したか**

## 注意

- **記事の価値を最優先**: アフィリエイトはあくまで補助導線。データ分析記事としての価値が第一
- **押し売りしない**: 記事本文にアフィリエイトリンクは入れない。`ArticleAffiliateSections` コンポーネントがタグベースで自動配置する
- **TAG_AFFILIATE_MAP を意識**: 記事の `tags` にマッピング対象のタグを含めれば、アフィリエイトが自動表示される
- **DB + e-Stat API の両面で探索**: `estat_stats_tables` を出発点としつつ、e-Stat API（`/search-estat`）で DB にない関連データも積極的に探す
- **時系列データの活用**: `/fetch-article-data` で `cdArea: "00000"` を使えば、ランキング用と同じ statsDataId + cdCat01 で全国時系列が取得できる。別の statsDataId を探す必要がないケースが多い
- **ランキングだけの記事にしない**: 時系列トレンド・構造分析・内訳比較を必ず含め、読者に「なぜ」を伝える記事にする

## 関連スキル

- `/plan-blog-articles` — カテゴリ起点の汎用企画
- `/plan-blog-trends` — トレンド起点の企画
- `/search-estat` — e-Stat API の統計表検索（Phase 2 で使用）
- `/inspect-estat-meta` — e-Stat メタデータ調査（Phase 2 で使用）
- `/fetch-article-data` — 企画確定後のデータ一括取得（時系列 + ランキング）
- `/generate-article-charts` — チャート SVG 生成
