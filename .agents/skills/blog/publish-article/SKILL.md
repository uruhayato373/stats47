---
name: publish-article
description: 下書き記事を公開フォルダへコピーし publishedAt を設定する。Use when user says "記事公開", "publish", "公開する". /sync-articles で DB 反映.
disable-model-invocation: true
primary_agent: blog-editor
---

下書き記事（`docs/21_ブログ記事原稿/<slug>/`）を公開staging（`.local/r2/app/blog/<slug>/`）にコピーし、公開用フロントマターと画像bundleを整える。

## 引数

```
$ARGUMENTS — 公開する記事のスラッグ（ディレクトリ名）
             （例: traffic-accident-deaths-ranking）
```

## 前提

- 事前に `/proofread-article` で校正チェックを済ませておくこと
- **★ blog-critic の意味レビューを通していること**: `published:true` 記事は
  `docs/21_ブログ記事原稿/<slug>/review.md` (別 agent `blog-critic` 生成、`verdict: PASS`・実体200字以上) が必須。
  無い / REVISE のままだと `quality-gate.mjs` が blocker で公開を止める (自己採点公開の構造的防止)。
  書いた本人が採点せず、別コンテキストの blog-critic に review してもらうこと。
- 公開前に `node .claude/scripts/blog/quality-gate.mjs <slug>` が exit 0 (critic PASS 含む) であること
- 作業ブランチが正しいか確認しておくこと

## 手順

### 1. スラッグを確認する

引数が空の場合は `docs/21_ブログ記事原稿/` 配下のディレクトリ一覧を表示してユーザーに選択を求める:

```bash
ls docs/21_ブログ記事原稿/
```

### 2. ソースの存在確認

```bash
ls "docs/21_ブログ記事原稿/<slug>/"
```

`article.md` が存在しない場合はエラーを出して終了する。

### 3. コピー先の状態を確認（dry-run）

コピー前に変更内容を確認する:

```bash
ls ".local/r2/app/blog/<slug>/" 2>/dev/null && echo "--- 既存ファイルあり（上書きします）" || echo "--- 新規作成"
```

ソースのファイル一覧を表示:

```bash
ls -la "docs/21_ブログ記事原稿/<slug>/"
```

ソースの article.md フロントマターを確認:

```bash
head -20 "docs/21_ブログ記事原稿/<slug>/article.md"
```

確認結果を表示してユーザーに続行の確認を求める。

### 4. ファイルをコピーする

```bash
mkdir -p ".local/r2/app/blog/<slug>"
cp -r "docs/21_ブログ記事原稿/<slug>/." ".local/r2/app/blog/<slug>/"
```

コピー結果を確認:

```bash
ls -la ".local/r2/app/blog/<slug>/"
```

### 5. フロントマターを整える

コピー先の `article.md` を読み込み、以下の修正を Apply する（Edit ツール使用）:

#### 5-1. `publishedAt` の更新

- `publishedAt: (未定)` → `publishedAt: YYYY-MM-DD`（今日の日付）
- すでに日付が入っている場合はそのまま

今日の日付を取得:

```bash
date +%Y-%m-%d
```

#### 5-2. 廃止フィールドの削除

以下のフィールドが残っている場合は行ごと削除する（`/proofread-article` で検出された場合の自動修正として）:

- `rankingKeys:` セクション（キーのリストを含む複数行）
- `seoKeywords:` セクション（キーワードのリストを含む複数行）

#### 5-3. `published` フィールドの確認

`published: false` または `published` フィールドがない場合: **そのまま放置**。
`/sync-articles` 実行時に `publishedAt` の日付に基づいて公開状態が制御されるため、明示的な変更は不要。

### 5.5. Factual cross-check (必須、2026-05-25 追加)

publish 前に必ず本文の rank claim と data の整合性を検証する。AI 生成の article で 13% が rank 不整合 / 数値捏造で FAIL する実測値 (2026-05-25 検証) があり、formal check (callout / 内部リンク / NG word) では検出不能のため。

```bash
node .claude/scripts/lib/article-factual-check.mjs \
  ".local/r2/app/blog/<slug>/article.md" \
  ".local/r2/app/blog/<slug>/data"
```

- **exit 0**: factual error なし → 次の step へ
- **exit 1**: `RANK_MISMATCH` / `INVERSE_RANK_MISMATCH` blocker あり
  - 出力された blocker を確認、data の正しい値で本文を Edit して再実行
  - 修正できない場合 (framing 自体が data と矛盾) は publish せず draft に戻す

**rule**: blockers がある状態で publish しない。「あとで直す」は禁止 (本番に factual error が出る)。

参照: `.claude/scripts/lib/article-factual-check.mjs` / `.claude/skills/blog/SHARED-failure-cases.md`

### 5.6. OGP / サイト内サムネイルを生成する

記事markdownから固有背景を1枚生成・ingestしてから、OGPとlight/darkカードを生成する。
`ogp.json`の手作成、背景の使い回し、画像内タイトル入りカードは不要。

```bash
npm run blog-images:codex -- request-article --slug <slug> --article <article.md>
# requestのpromptをCodex built-in imagegenへ1回渡し、生成pathとpromptHashでingestする
npm run blog-images:codex -- ingest-article --slug <slug> \
  --article <article.md> --input <generated-path> --prompt-hash <sha256-...>
npx tsx apps/web/scripts/generate-blog-thumbnails.ts --slug <slug>
npx tsx packages/r2-storage/src/scripts/push-generated-image-set.ts \
  --plan .local/image-generation-publish-plan-blog.json --dry-run
```

確認対象はOGP 1200×630、card light/dark 640×336、記事固有背景、共通manifest。実公開時だけ同じpublisherを
`--dry-run`なしで実行する。

### 6. 下書きフォルダを削除する

公開が完了したため、下書きフォルダは不要になる（docs/21 は「公開したら消す」ephemeral な下書き staging。記事の正典 SSOT は R2 app/blog）。ユーザーに確認してから削除する:

```bash
rm -rf "docs/21_ブログ記事原稿/<slug>"

# 取り残し検証 (公開済みなのに下書きが残っていれば exit 1)。/deploy Step 2 でも自動実行される。
node .claude/scripts/lib/check-published-drafts.cjs
```

> ⚠️ このステップを飛ばすと、公開済みの古い下書きが docs/21 に残り R2(live) と drift して退行リスクになる（2026-05-30 に 6 件の取り残しを検出・削除した事故由来）。`check-published-drafts.cjs` が再発を機械検出する。

### 7. 完了メッセージ

```
✅ 公開フォルダへのコピーが完了しました

  コピー元: docs/21_ブログ記事原稿/<slug>/  （削除済み）
  コピー先: .local/r2/app/blog/<slug>/
  publishedAt: <設定した日付>

次のステップ:
  1. /sync-articles  →  DB を更新（ローカル確認）
  2. localhost:3000/blog/<slug> でプレビュー確認
  3. exact image plan publisher → 画像bundleをR2へ反映
  4. /sync-snapshots →  blog スナップショット更新・本番反映
```

## 関連

- **記事品質の正典: `.claude/rules/blog-quality-standards.md`** (curiosity gap / callout / 内部リンク / source-link 配置の単一ソース)
- publish 前ゲート: `node .claude/scripts/blog/quality-gate.mjs <slug>` (callout/内部リンク/H2/source-link 配置/factual を一括検査)
- factual cross-check: `.claude/scripts/lib/article-factual-check.mjs` (本 SKILL step 5.5 で実行)
