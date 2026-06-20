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
```

- `metricKey`: `packages/data-configs/src/metrics/<key>.ts` に実在し `isActive:true` の key (例 `public-phone-count`)。**実在チェック必須** (`feedback_backlog_ranking_key_audit`: AI が実在しない key を捏造しがち)。
- `trend-snapshot-path` / 自然文: そこから metric を 1 つ選定して slug を確定する

## 手順

### Step 1: テーマと metric の確定

1. 入力 (metric key / トレンド / GSC ギャップ / ユーザー指示) から **記事 1 本ぶんの metric を 1〜2 個**選ぶ。
   - archetype B (相関・真因) を狙うなら相関させる 2 metric (例 空き家率 × 高齢化率)。
2. **metric key の実在を確認**: `ls packages/data-configs/src/metrics/<key>.ts` と R2 `curl -sI https://storage.stats47.jp/app/stats/<key>/values.json` が 200 か。無ければ別 key に。
3. `slug` を curiosity-gap を意識して確定 (英小文字 kebab)。既存公開記事と重複しないか `curl -s https://storage.stats47.jp/app/blog/all.json` で確認 (カニバリ防止)。
4. **archetype を決める** (`.claude/rules/blog-quality-standards.md` の A〜E)。決めた型の必須分析視点に沿って書く。

### Step 2: データ接地 (R2 直)

```bash
node .claude/scripts/blog/fetch-ranking-data-r2.mjs --slug <slug> --keys <metricKey>[,<metricKey2>]
```

- 出力: `docs/21_ブログ記事原稿/<slug>/data/<key>-prefecture-rankings.json` (R2 公開 URL から取得・value 降順で rank 再計算・統一スキーマ `{areaName,rank,value,unit,label}`)。
- 時系列が必要なら R2 `values.json` の全年を集計して `<name>-timeseries.json` を作る (全国合計/平均は本文の主張と一致させる)。
- 散布図 (archetype B) は 2 metric の最新年を areaCode で join し `<name>-scatter.json` (`{title,xLabel,xUnit,yLabel,yUnit,points:[{x,y,label}]}`) を作る。
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

## 参照

- **記事品質の正典: `.claude/rules/blog-quality-standards.md`** (archetype A〜E / curiosity gap / callout / 内部リンク / source-link 配置 / 表禁止 / ですます / 図あたり字数)
- `.claude/skills/blog/discover-trends/SKILL.md` (トレンド発見・任意の入力源)
- `.claude/scripts/blog/fetch-ranking-data-r2.mjs` (R2 直データ接地)
- `.claude/skills/blog/generate-article-charts/SKILL.md`
- `.claude/skills/blog/md-syntax/SKILL.md`
- `.claude/skills/blog/brushup-blog/SKILL.md` (公開後の是正・反復)
- `.claude/skills/blog/proofread-article/SKILL.md`

## 完了条件

- `docs/21_ブログ記事原稿/<slug>/article.md` (frontmatter + ですます + 上位5+下位5 SVG + callout + source-link インライン) が揃う
- `docs/21_ブログ記事原稿/<slug>/data/*.json` と `data/*.svg` が揃い、未置換 placeholder/インライン svg なし
- `article-factual-check.mjs` exit 0 / `quality-gate.mjs` exit 0 / (公開時) `review.md` verdict: PASS
