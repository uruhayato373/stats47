---
name: write-prepared-article
description: 準備済みのブログ記事 (接地・データ健全性ゲート・SVG・prompt まで完了) を手動で書き上げ、決定的ゲート → critic → 公開待ちまで確定する。日次CIが失敗した場合の再実行・調査にも使う。Use when user says "準備済み記事を書く", "今日のブログを書く", "write-prepared-article".
disable-model-invocation: true
primary_agent: article-writer
---

# /write-prepared-article — 準備済みブログ記事を書き上げる

`blog-generate-daily.yml` が用意した記事を、対話セッションから手動で書き上げるフォールバック。
日次 workflow 自身は Codex OAuth で執筆・機械ゲート・独立 critic・publish dispatch まで完結する。

> CI は `Codex setup-token` で発行した `CLAUDE_CODE_OAUTH_TOKEN` を Repository Secret から読み、
> Pro / Max の利用枠で公式 Base Action を起動する。API従量課金の `ANTHROPIC_API_KEY` は使わない。
> 正典: `.Codex/rules/blog-quality-standards.md` / `.Codex/rules/blog-data-schema.md` §0

## 前提（CI が用意しているもの）

```
docs/21_ブログ記事原稿/<slug>/
  ├── article.prompt.txt   ← 型・ルール・接地済み ground truth が入った prompt
  ├── data/*.json          ← R2 観測値の接地物（数値の出どころ）
  ├── data/*.source.json   ← 出典 manifest（再取得できる形）
  └── data/*.svg           ← 生成済みチャート
```

`article.md` は**まだ無い**。それを書くのがこの skill の仕事。

## 手順

### 1. 対象を確認する

```bash
find "docs/21_ブログ記事原稿" -mindepth 2 -maxdepth 2 -name 'article.prompt.txt' \
  | sed 's|.*/\([^/]*\)/article.prompt.txt|\1|'
```

日次 routine は当日の対象だけを `.local/ci/blog-targets.txt` に固定する。手動時は上の一覧から
未完成の slug を1件選び、複数の残存 prompt をまとめて処理しない。

### 2. 記事を書く（`article-writer` に委譲）

`article.prompt.txt` を読み、**そこに書かれた型と ground truth に従って** `article.md` を書く。

- **数値は ground truth（`data/*.json`）にある値だけを使う**。無い値は書かない
- **県名の直後の括弧に値・順位を書かない**（`.Codex/rules/blog-quality-standards.md` §数値の書き方）。
  括弧に入れた数値は機械照合の対象外になり、誰にも検証されなくなる
- **markdown 表を使わない**（データは SVG 図、列挙は箇条書き）
- **ですます調**に統一する
- 各図の直下に `<source-link href="/ranking/<key>">` を **1 枚だけ**置く（末尾に束ねない）

複数記事を並行して書く場合は slug ごとに `article-writer` を起動してよい（成果物が
slug 単位で分離しているため干渉しない）。**最大 3 体**まで（`.Codex/rules/model-prompting.md`）。

### 3. 決定的ゲートを通す

```bash
NODE_OPTIONS='--conditions react-server' \
  npx tsx packages/ai-content/src/scripts/generate-blog-article.ts --ingest <slug>
```

blocker が出たら**直して再実行する**。**ゲートは緩めない**。
（このコマンドは `review.md` がまだ無ければ「critic の審査待ち」で止まる。それが正常）

### 4. critic に審査させる（別コンテキスト・必須）

`blog-critic` agent を起動し、`docs/21_ブログ記事原稿/<slug>/review.md` を書かせる。

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
R2 に公開する。公開後は CI が `docs/21` の当該ドラフトを自動削除する（outbox は常に空に戻る）。

## やらないこと

| NG | OK |
|---|---|
| ゲートを緩めて通す | 記事を直して通す。通らなければその日は出さない |
| 自分で書いた記事を自分で critic する | `blog-critic` を別コンテキストで起動する |
| ground truth に無い数値を書く | `data/*.json` にある値だけを使う |
| R2 の article.md を直接編集する | outbox → push → CI が公開する |
| 準備済みディレクトリを手で消す | 原因を直して日次 routine を再実行する |

## 関連

- 準備側: `.github/workflows/blog-generate-daily.yml` / `packages/ai-content/src/scripts/generate-blog-article.ts`
- 品質基準（正典）: `.Codex/rules/blog-quality-standards.md`（§ルール ↔ 機械チェック 対応表）
- 決定的ゲート: `.Codex/scripts/blog/quality-gate.mjs`
- agent: `article-writer`（執筆）/ `blog-critic`（審査）
- 既存記事の是正は別 skill: `/brushup-blog --target queue`
