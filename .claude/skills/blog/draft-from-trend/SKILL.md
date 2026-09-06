---
name: draft-from-trend
description: metric/トレンドから記事下書きを R2 観測値直 fetch で一気通貫生成 (metric 選定 → fetch-ranking-data-r2 → article.md(archetype) → generate-article-charts → factual-check)。docs/21 は ephemeral outbox。Use when user says "下書き生成", "ドラフト", "記事を作って", "draft-from-trend"。
primary_agent: article-writer
---

1 つの metric (統計指標) を起点に、`article.md` 雛形 + チャート画像までを一気通貫で生成する **orchestrator スキル**。**企画文書 (旧 docs/20) は介さない** — 「生成 → 公開 → ライブで反復」が基本フロー。

**本スキルは実コードを書かない。** 既存スクリプト/スキルを正しい順序で呼び、各 phase の入出力を仲介するだけ。新しい `.mjs`/`.cjs` を追加しないこと。

## データ層の前提 (完全DBレス / R2 直)

- 観測値の正典は **R2 `app/stats/<metricKey>/values.json`** (公開 URL `https://storage.stats47.jp`、認証不要)。
- 記事の正典は **R2 `app/blog/<slug>`**。`docs/21_ブログ記事原稿/<slug>` は **ephemeral outbox** (公開前ドラフトの一時置き場。公開後は CI が自動削除 → 常に空)。
- 旧 `fetch-article-data.mjs` (D1 + docs/20 backlog 依存) は廃止。データ接地は **`fetch-ranking-data-r2.mjs`** (R2 直) を使う。

## 用途

- ある metric について 1 本記事を立ち上げたいとき (metric key を直接指定)
- `.claude/skills/blog/trends-snapshots/trends-{source}-YYYY-MM-DD.md` やユーザー指示・GSC ギャップから「次に書くテーマ」を決めて記事化したいとき
- 1 回の実行で **1 記事** を作る (バッチ化禁止、品質ゲートが効かなくなるため)

## 引数

```
/draft-from-trend <metricKey | trend-snapshot-path | 自然文テーマ>
/draft-from-trend --from queue        # topic-queue の pending 先頭を 1 本
```

- `metricKey`: `packages/data-configs/src/metrics/<key>.ts` に実在し `isActive:true` の key (例 `public-phone-count`)。**実在チェック必須** (`feedback_backlog_ranking_key_audit`: AI が実在しない key を捏造しがち)。
- `trend-snapshot-path` / 自然文: そこから metric を 1 つ選定して slug を確定する
- `--from queue`: **記事ネタ選定キュー起点**。`node .claude/scripts/blog/build-topic-queue.mjs --next 1` で
  次の pending 候補を取得し、その `archetype` / `metricKeys` / `suggestedTitle` を Step 1 の入力に使う。
  取得したら `--mark-in-progress <topicKey>`、公開まで進んだら `--mark-done <topicKey> --slug <slug>` で
  キュー状態を更新する。ネタ選定の仕組みは `.claude/skills/blog/plan-article-queue/SKILL.md`。

## 手順

### Step 1: テーマと metric の確定

1. 入力 (metric key / topic-queue / トレンド / GSC ギャップ / ユーザー指示) から **記事 1 本ぶんの metric を 1〜2 個**選ぶ。
   - archetype B (相関・真因) を狙うなら相関させる 2 metric (例 空き家率 × 高齢化率)。`--from queue` なら候補が metricKeys を持つ。
2. **metric key の実在を確認**: `ls packages/data-configs/src/metrics/<key>.ts` と R2 `curl -sI https://storage.stats47.jp/app/stats/<key>/values.json` が 200 か。無ければ別 key に。
3. `slug` を curiosity-gap を意識して確定 (英小文字 kebab)。既存公開記事と重複しないか `curl -s https://storage.stats47.jp/app/blog/all.json` で確認 (カニバリ防止)。
4. **archetype を決める** (`.claude/rules/blog-quality-standards.md` の A/B/C/D/D2/E/F/G)。決めた型の必須分析視点・章構成に沿って書く。

**型別のデータ源** (`--from queue` の archetype に対応):

| 型 | データ源 | Step 2 で作る data JSON |
|---|---|---|
| A / D2 | R2 `app/stats/<key>/values.json` | `<name>-prefecture-rankings.json` (+ D2 は `-tile-grid.json`) |
| B | R2 `app/correlation/by-ranking-key/<key>.json` の scatterData (2 metric) | `<name>-scatter.json` + 各 metric の `-prefecture-rankings.json` |
| F | `apps/web/public/finance-cards/cities/<pref>.json` + `similar-averages.json` | 県内市町村の `-ranking.json` + 類似団体比較 `-bar` |
| G | R2 `app/stats/population-migration-inter-prefecture/migration-flow-<year>.json` | 転出先/転入元の `-ranking.json` |

### Step 2: データ接地 (R2 直)

```bash
node .claude/scripts/blog/fetch-ranking-data-r2.mjs --slug <slug> --keys <metricKey>[,<metricKey2>]
```

- 出力: `docs/21_ブログ記事原稿/<slug>/data/<key>-prefecture-rankings.json` (R2 公開 URL から取得・value 降順で rank 再計算・統一スキーマ `{areaName,rank,value,unit,label}`)。
- 時系列が必要なら R2 `values.json` の全年を集計して `<name>-timeseries.json` を作る (全国合計/平均は本文の主張と一致させる)。
- **散布図 (archetype B) は専用ヘルパーで生成** (相関 snapshot の scatterData を変換、手 join 不要):

  ```bash
  node .claude/scripts/blog/fetch-correlation-scatter.mjs --slug <slug> --base <metricA> --pair <metricB>
  ```

  出力 `<A>--<B>-scatter.json` (+ `.source.json`) が `{title,xLabel,xUnit,yLabel,yUnit,points}` スキーマ。
  partialPop が弱いと warn が出る → 本文で「見かけの相関」を必ず言及する (相関≠因果)。B 型は上記に加え
  両 metric の `-prefecture-rankings.json` (fetch-ranking-data-r2) も作り、上位5+下位5 で県の並びを対比する。
- **F型 (市区町村内格差)**: `apps/web/public/finance-cards/cities/<pref>.json` + `similar-averages.json` を読み、
  県内市町村を value 降順で `<name>-ranking.json` (統一スキーマ) に整形する。**数値は finance-cards JSON のみ使う**。
- **G型 (移動フロー)**: R2 `app/stats/population-migration-inter-prefecture/migration-flow-<year>.json` から
  対象県の転出先/転入元を集計して `<name>-ranking.json` にする。
- **本文の数値・rank はこの data の値のみ使う** (捏造防止)。e-Stat 規約は `.claude/rules/estat-api.md`。

### Step 3: article.md 生成 (docs/21 outbox)

`docs/21_ブログ記事原稿/<slug>/article.md` を新規作成。**`.claude/rules/blog-quality-standards.md` が品質の正典**。要点:

- **frontmatter**: `title`(curiosity-gap・N位/X倍差で終わらない) / `seoTitle` / `subtitle` / `slug` / `description`(緊張感セットアップ) / `archetype` / `category` / `tags` / `publishedAt` / `published: false`(作成時は false、公開時に true)。
- **文体は ですます調**で統一 (である調 copula 混在は gate blocker)。
- **可視化は SVG 図のみ・markdown 表は全面禁止**。ランキングは **上位5+下位5 のカード型**（`generate-article-charts` が横長 columns `<name>.svg`(本文) + 縦長 portrait `<name>-ig.svg`(IG) を自動両出力）、地理は tile-grid 地図、時系列は折れ線、相関は散布図。
- **チャート参照**: `![alt](data/<name>-prefecture-rankings.svg)` (生成は Step 4)。`<chart-placeholder>` とインライン `<svg>` は禁止。
- **source-link**: `<source-link href="/ranking/<key>">` を**各図の直下にインライン**配置 (末尾集約禁止)。
- **callout 3〜4 個**: 記事固有の読み違い防止知識 (`[!NOTE]`定義 / `[!WARNING]`限界・相関≠因果 / `[!TIP]`読み筋)。
- **内部リンク 3〜5**: `/ranking/<key>` `/areas/<code>` `/blog/<slug>` `/category/<key>`。
- 記事内に「関連ランキング/関連記事」見出しを書かない (ページ側が tag 駆動で描画)。

### Step 4: チャート生成

```bash
node .claude/scripts/blog/generate-article-charts.ts --slug <slug>
```

- `data/*.json` → `data/*.svg` を生成。認識サフィックス: `*-prefecture-rankings.json`(bar・`pref` フィールド必須) / `*-timeseries.json`(line) / `*-scatter.json`(scatter) / `*-tile-grid.json`(地図)。
- `--validate` で SVG 品質 (dark mode/構造) を検査。errors=0 を確認。

### Step 5: Factual cross-check ★必須

```bash
node .claude/scripts/lib/article-factual-check.mjs "docs/21_ブログ記事原稿/<slug>/article.md" "docs/21_ブログ記事原稿/<slug>/data"
```

- exit 0 で次へ。`RANK_MISMATCH`/数値捏造の blocker があれば data の正しい値で本文を Edit して再実行。framing 自体が data と矛盾するなら draft を破棄して metric/角度を選び直す。

### Step 6: 品質ゲート + critic

```bash
node .claude/scripts/blog/quality-gate.mjs docs/21_ブログ記事原稿/<slug>/article.md
```

- **公開する記事は `blog-critic` (別 agent) の `review.md` (verdict: PASS) が必須** (自己採点禁止)。`/blog-review --mode expert` で生成し、PASS になるまで本文を直す。
- gate (charCount/図あたり字数/callout/内部リンク/表禁止/ですます/source-link 配置) が exit 0 になるまで是正。

### Step 7: 公開 (R2)

- `published: true` にして commit → **develop に push** すると `blog-auto-publish.yml` が R2 へ公開し、**docs/21 のドラフトを自動削除** (ephemeral outbox)。
- 公開後は `https://stats47.jp/blog/<slug>` をライブで確認 → 改善は `/brushup-blog`（R2 の記事を取得して是正）で反復する。

## 規約

- **コードを直接書かない** (orchestrator)。R2 データ接地は `fetch-ranking-data-r2.mjs`、チャートは `generate-article-charts.ts`、検証は `article-factual-check.mjs`/`quality-gate.mjs`。
- **md-syntax 準拠**: `<source-link>` `<data-source>` は `.claude/skills/blog/md-syntax/SKILL.md`。
- **TILE_GRID_LAYOUT**: タイルマップは `packages/visualization/src/d3/constants/tile-grid-layout.ts` から import。
- **完成記事の参考**: 公開済み良記事 (`curl -s https://storage.stats47.jp/app/blog/<slug>/article.md`、例 `health-life-expectancy-structure` / `sports-urban-paradox`)。
- **1 回 1 記事**: バッチ化禁止。

## ランキング以外の接地 (型G 移動フロー / 型F 市町村財政 / 型E テーマハブ)

`fetch-ranking-data-r2.mjs` は「1 metric = 47 県の 1 本のランキング」しか接地できない。
移動フロー (県のペア) と市町村財政 (県内の団体) はデータの形が違うので専用の接地器を使う。
どちらも 3 点セット (json / source.json / svg) を出すので、以降の工程は他の型と同じ。

```bash
# 型G: 相手県別の純移動 + タイルマップ + 転入転出の推移
node .claude/scripts/blog/fetch-migration-flow.mjs --slug <slug> --pref <5桁コード>

# 型F: 県内市町村の財政力指数 + 実質公債費比率 + 推移
node .claude/scripts/blog/fetch-municipal-finance.mjs --slug <slug> --pref <5桁コード>

# 接地後に執筆プロンプトを組む (型 F/G/E。A〜D は generate-blog-article.ts が出す)
node .claude/scripts/blog/build-article-prompt.mjs --slug <slug> --archetype <F|G|E> \
  --title-hint "<参考の題>" --links "/areas/20000|長野県のデータ,..." \
  [--source-links "<rankingKey>|<ラベル>"] [--figures "<file.svg>|<alt>,..."]
```

- 移動フローの各行は **to 側の県から見た値**である (net = その県の純増)。逆に読むと記事が反転する。
- 市町村財政の数値は `apps/web/public/finance-cards/` だけから取る。e-Stat に団体別の決算カードは無い。
- `build-article-prompt.mjs` は内部リンクが 3 本未満・図が実在しない・型が未対応なら書かずに止まる。

## 参照

- **記事品質の正典: `.claude/rules/blog-quality-standards.md`** (archetype A〜E / curiosity gap / callout / 内部リンク / source-link 配置 / 表禁止 / ですます / 図あたり字数)
- `.claude/skills/blog/discover-trends/SKILL.md` (トレンド発見・任意の入力源)
- `.claude/scripts/blog/fetch-ranking-data-r2.mjs` (R2 直データ接地)
- `.claude/scripts/blog/fetch-migration-flow.mjs` (型G 移動フローの接地)
- `.claude/scripts/blog/build-kakei-quantity-price.mjs` (家計調査の食料品目を「支出額 = 数量 × 価格」に分解し、県庁所在市の 4 区分 findings カードを接地。県別食卓記事 `<pref>-food-culture` の更新用)
- `.claude/scripts/blog/fetch-kakei-monthly.mjs` (型C 用。家計調査 全国・二人以上の世帯の月次品目表と 2020 年基準 CPI を e-Stat から直接読み、年次集計・指数化・月別パターン・購入単価 (金額÷数量) の折れ線 data JSON を作る。source.json は kind:estat)
- `.claude/scripts/blog/fetch-municipal-finance.mjs` (型F 市町村財政の接地)
- `.claude/scripts/blog/build-article-prompt.mjs` (型 F/G/E の執筆プロンプト生成)
- `.claude/skills/blog/generate-article-charts/SKILL.md`
- `.claude/skills/blog/md-syntax/SKILL.md`
- `.claude/skills/blog/brushup-blog/SKILL.md` (公開後の是正・反復)
- `.claude/skills/blog/proofread-article/SKILL.md`

## 完了条件

- `docs/21_ブログ記事原稿/<slug>/article.md` (frontmatter + ですます + 上位5+下位5 SVG + callout + source-link インライン) が揃う
- `docs/21_ブログ記事原稿/<slug>/data/*.json` と `data/*.svg` が揃い、未置換 placeholder/インライン svg なし
- `article-factual-check.mjs` exit 0 / `quality-gate.mjs` exit 0 / (公開時) `review.md` verdict: PASS
