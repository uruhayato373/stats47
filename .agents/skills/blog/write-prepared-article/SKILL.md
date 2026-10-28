---
name: write-prepared-article
domain: site
description: 週次計画が割り当てた本数のブログ記事を、接地・データ健全性ゲート・SVG・prompt の準備から書き上げ、決定的ゲート → critic → 公開待ちまで確定する。Use when user says "今週のブログを書く", "準備済み記事を書く", "write-prepared-article".
disable-model-invocation: true
primary_agent: article-writer
---

# /write-prepared-article — 準備済みブログ記事を書き上げる

新規記事を書く**主経路**。準備 (接地・健全性ゲート・SVG・prompt) は決定的スクリプトが行い、
本文と critic を対話セッションが回す。

> **★件数を決めるのは週次計画** (`.claude/todo/weekly.md` の Must)。月間本数の SSOT は
> `data/blog/seo-strategy.json` の `typeMix.perMonth` (月 17-19 本) で、
> `.claude/todo/monthly.md` がそれを重点として持つ。日次 CI (`blog-generate-daily.yml`) は
> 2026-08-21 に削除した — 対話セッションと同じ Pro/Max 利用枠を食うため。
> 正典: `.claude/rules/blog-quality-standards.md` / `.claude/rules/blog-data-schema.md` §0

## 準備（この skill の中で先に回す）

```bash
# 1. 何を書くか (topic-queue の pending から払い出す)
node .claude/scripts/blog/build-topic-queue.mjs

# 2. 接地・データ健全性ゲート・SVG・prompt までを用意する
npx tsx packages/ai-content/src/scripts/generate-blog-article.ts --limit 1 --keep-draft
```

準備が終わると次の形になる。

```
contents/blog/<slug>/
  ├── article.prompt.txt   ← 型・ルール・接地済み ground truth が入った prompt
  ├── data/*.json          ← R2 観測値の接地物（数値の出どころ）
  ├── data/*.source.json   ← 出典 manifest（再取得できる形）
  └── data/*.svg           ← 生成済みチャート
```

`article.md` は**まだ無い**。それを書くのがこの skill の仕事。

## 手順

## headless 経路 (既定・Agent tool を使わない)

本文と審査を `article-writer` / `blog-critic` の Agent tool で回すと、subagent が CLAUDE.md と rules を
毎ターン読むため是正で約 10 万トークン/本かかる。**既定は headless `claude -p` のバッチ**で、
repo 外 cwd・ツール無し・独自 system prompt で prompt だけを読ませる (ランキング解説と同じ lean 化)。
審査は書いたプロセスと別の `claude -p` が記事本文だけを読む (`buildBlogCriticPrompt`) ので、
「書いた本人が自己採点しない」規約を満たす。

```bash
# 準備 (上の 2) の後。対象は article.prompt.txt があり article.md が無い slug
npx tsx packages/ai-content/src/scripts/write-blog-headless.ts --limit 3
# 明示指定・確認だけ
npx tsx packages/ai-content/src/scripts/write-blog-headless.ts --slugs <a>,<b>
npx tsx packages/ai-content/src/scripts/write-blog-headless.ts --dry-run
```

- 流れ: author (sonnet・effort low) → `quality-gate.mjs` + `ci-factual-gate.mjs` (落ちたら blocker を添えて
  `--retries` 回まで書き直し) → 別プロセスの critic → REVISE なら blocker / major の指摘と原稿を author に返して
  `--revise-rounds` 回 (既定 1) まで書き直す。**ゲートと critic は緩めない**
- 記録: `data/blog/headless-runs.csv` (slug ごとの呼び出し数・トークン・API 換算費用・ゲート・verdict) と
  `.local/ci/<run-id>.json`。費用は CLI の `total_cost_usd` (Pro/Max の OAuth では実請求ではない)
- **公開しない。** PASS 分も `published: false` のまま残る。確定は下の 5 (`--ingest`) と push を人が行い、
  本数は週次計画と `data/blog/seo-strategy.json` が決める。Claude を CI の cron で回さない
- NotebookLM の調査材料 (`contents/blog/<slug>/research.md`) があれば author prompt に足す
  (`/notebooklm-research` の「新規記事の調査段」)
- Gemini 無料枠で書く: `--author gemini-api` (critic は claude のまま推奨)。run の最初に極小の実生成で
  鍵を確かめ、HTTP 402 / クレジット枯渇は billing として止まる。鍵は課金を付けていない project のものを
  `.env.local` の `GEMINI_API_KEY` に置く (`.claude/todo/backlog.md` の BLOG-GEMINI-AUTHOR-01)
- 実測 (2026-10-28・型B 3・A 1・D2 1): 15 回の run で 5 本。1 本あたり (書き直し 1 周込み) 1.8〜4.9 万トークン・$0.10〜0.27 (API 換算)・70〜140 秒。決定的ゲートは 1 回目で 13/15 通過。審査の基準を blog-critic に揃えた後の最終 run は 2/4 PASS・PASS 1 本 $0.32 (Agent tool 経路の約 1/25)。残る差し戻しは地理の誤り (隣接県・地方区分) と題の約束不足が多い。詳細は `.claude/todo/backlog.md` の BLOG-HEADLESS-AUTHOR-01

以下の手順 1〜4 は Agent tool で書く旧経路 (headless が使えないときの代替)。5〜6 はどちらの経路でも共通。

### 1. 対象を確認する

```bash
find "contents/blog" -mindepth 2 -maxdepth 2 -name 'article.prompt.txt' \
  | sed 's|.*/\([^/]*\)/article.prompt.txt|\1|'
```

日次 routine は当日の対象だけを `.local/ci/blog-targets.txt` に固定する。手動時は上の一覧から
未完成の slug を1件選び、複数の残存 prompt をまとめて処理しない。

### 2. 記事を書く（`article-writer` に委譲）

`article.prompt.txt` を読み、**そこに書かれた型と ground truth に従って** `article.md` を書く。

- **数値は ground truth（`data/*.json`）にある値だけを使う**。無い値は書かない
- **県名の直後の括弧に値・順位を書かない**（`.claude/rules/blog-quality-standards.md` §数値の書き方）。
  括弧に入れた数値は機械照合の対象外になり、誰にも検証されなくなる
- **markdown 表を使わない**（データは SVG 図、列挙は箇条書き）
- **ですます調**に統一する
- 各図の直下に `<source-link href="/ranking/<key>">` を **1 枚だけ**置く（末尾に束ねない）

複数記事を並行して書く場合は slug ごとに `article-writer` を起動してよい（成果物が
slug 単位で分離しているため干渉しない）。**最大 3 体**まで（`.claude/rules/model-prompting.md`）。

### 3. 決定的ゲートを通す

```bash
NODE_OPTIONS='--conditions react-server' \
  npx tsx packages/ai-content/src/scripts/generate-blog-article.ts --ingest <slug>
```

blocker が出たら**直して再実行する**。**ゲートは緩めない**。
（このコマンドは `review.md` がまだ無ければ「critic の審査待ち」で止まる。それが正常）

### 4. critic に審査させる（別コンテキスト・必須）

`blog-critic` agent を起動し、`contents/blog/<slug>/review.md` を書かせる。

**自分で書いた記事を自分で採点しない。** `blog-quality-standards.md` が禁じているのは
「書いた本人が自己採点して公開する」ことで、critic は別コンテキストで記事本文だけを読む。

verdict が `REVISE` なら指摘を直して 3 に戻る。

### 5. 確定する

```bash
NODE_OPTIONS='--conditions react-server' \
  npx tsx packages/ai-content/src/scripts/generate-blog-article.ts --ingest <slug>
```

critic が PASS していれば `published: true` を立てて最終ゲートを通し、公開待ちになる。

### 6. push する

develop へ push すると `blog-auto-publish.yml` が factual / quality ゲートを再検証して
R2 に公開する。公開後は CI が `contents/blog` の当該ドラフトを自動削除する（outbox は常に空に戻る）。

## やらないこと

| NG | OK |
|---|---|
| ゲートを緩めて通す | 記事を直して通す。通らなければその日は出さない |
| 自分で書いた記事を自分で critic する | `blog-critic` を別コンテキストで起動する |
| ground truth に無い数値を書く | `data/*.json` にある値だけを使う |
| R2 の article.md を直接編集する | outbox → push → CI が公開する |
| 準備済みディレクトリを手で消す | 原因を直して準備コマンドを再実行する |

## 関連

- 準備側: `packages/ai-content/src/scripts/generate-blog-article.ts` / `.claude/scripts/blog/build-topic-queue.mjs`
- 公開: `contents/blog/<slug>/article.md` を `published: true` で develop へ push すると
  `blog-auto-publish.yml` が push トリガーで発火する
- 品質基準（正典）: `.claude/rules/blog-quality-standards.md`（§ルール ↔ 機械チェック 対応表）
- 決定的ゲート: `.claude/scripts/blog/quality-gate.mjs`
- agent: `article-writer`（執筆）/ `blog-critic`（審査）— 旧経路。既定は headless (`write-blog-headless.ts`)
- 既存記事の是正は別 skill: `/brushup-blog --target queue`
