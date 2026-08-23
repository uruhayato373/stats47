---
name: generate-blog-images
description: >-
  stats47ブログの記事内容から1記事1枚の固有背景をCodex imagegenで生成し、OGPとサイト内サムネイルを用途別に決定的合成する。新規記事、一括移行、再生成、欠落修復で使う。
metadata:
  primary_agent: 'image-prompt-curator'
  co_agents: 'blog-editor'
---

# Generate Blog Images

ブログ画像の意味仕様をgit TS、記事固有背景をgit JPEG、最終配信物をR2に分離する。
同じ背景を複数記事へ使い回さず、タイトル・要約・導入文から各記事の主題が見分けられる1枚を作る。

## 必読

1. `.claude/rules/ogp-image-standards.md` の「画像生成 AI」節を読む。
2. Claude Codeから生成する場合は `.claude/rules/codex-mcp.md` の画像生成節を読む。
3. 外部反映が含まれる場合は `.claude/rules/branch-workflow.md` を読む。

## 出力契約

- OGP: `ogp/ogp.png`、1200×630。大きなタイトル・カテゴリ・ブランドを合成する。
- サイト内カード: `thumbnail-{light,dark}.webp`、640×336。画像内テキストなし。タイトルはDOM側。
- manifest: `ogp/generation.json`。背景source / SHA / visualType / renderer fingerprintを記録する。
- 各記事は記事固有AI背景の`ogp/background.jpg`を持つ。共有背景やブランド背景へ暗黙fallbackしない。

## 入力契約

- `slug` は公開または公開予定の記事slugを使う。
- 1背景には1つの視覚モチーフだけを定義する。
- タイトル、数字、グラフ、装飾パターンを背景へ描かない。地理そのものが主題でない限り日本地図を使わない。
- 左55%をOGPタイトル安全域、右42%をカードでも読めるモチーフ領域にする。
- プロンプトは`blog-article-background.ts`がfrontmatterと本文導入から決定的に作る。手書きプロンプトを配信契約にしない。
- 選択順は `記事固有git JPEG > 検証済み公開AI背景（既存記事の移行互換）`。どちらも無ければ失敗させる。

## Mode A: 新規記事（既定）

記事markdownからrequest JSONを作り、組み込み`$imagegen`へ1回だけ渡す。

```bash
# 公開済み記事。公開前は --article <article.md> を付ける
npm run blog-images:codex -- request-article --slug <slug>

# 生成後のpathとrequest JSONのpromptHashを渡す
npm run blog-images:codex -- ingest-article \
  --slug <slug> --input <generated-path> --prompt-hash <sha256-...>

# 公開前staged記事のbundleを生成
npx tsx apps/web/scripts/generate-blog-thumbnails.ts --slug <slug>
```

## Mode B: 既存記事の一括移行・重複修復

`queue`は公開記事のうち共有背景、背景重複、固有JPEG欠落を列挙する。各requestにつき画像生成を1回行い、
同じslugへingestする。既存JPEGがあるslugは再生成しない。

```bash
npm run blog-images:codex -- queue
# .local/blog-imagegen/queue.json の requests[] を imagegen → ingest-article

# 完了条件。targetsが0であること
npm run blog-images:codex -- queue

# 全公開記事の差分監査とbundle生成
npx tsx apps/web/scripts/generate-blog-thumbnails-cloud.ts --audit
npx tsx apps/web/scripts/generate-blog-thumbnails-cloud.ts

# 書込なしでR2 CAS前提を検証
npx tsx packages/r2-storage/src/scripts/push-generated-image-set.ts \
  --plan .local/image-generation-publish-plan-blog.json --dry-run
```

## Mode C: 旧catalog背景の保守（移行互換）

既存の`BLOG_CODEX_BACKGROUND_BY_SLUG`資産を再生成するときだけ使用する。新規記事はMode Aを使う。

### Phase 1: catalogを確認する

対象slugが `BLOG_CODEX_BACKGROUND_BY_SLUG` に無ければ、同ファイルの `background()` を使って
`assetId`、`subject`、`detail` を追加する。プロンプト本文、model、サイズ、セーフエリアは
共通builderから変更しない。

追加後にrequestを生成する。

```bash
npm run blog-images:codex -- request --slug <slug>
```

生成される `.local/blog-imagegen/requests/<slug>.json` を実行入力とする。同JSONの
`prompt`、`promptHash`、`mcp.arguments` を手で書き換えない。

### Phase 2: 画像を生成する

### Claude Code

request JSONの `mcp.arguments` を使って `mcp__codex__codex` を1回呼ぶ。

- `cwd`: 実際のリポジトリルートへ置換する。
- `sandbox`: `read-only` のままにする。
- `approval-policy`: `never` のままにする。
- Codexにはrepo編集、shell実行、R2反映、deployをさせない。
- 返り値は `generated_image_path` と `prompt_hash` のJSONだけ受け取る。

接続できない場合は `claude mcp get codex` と `codex login status` を確認して停止する。
Geminiや別プロバイダへ暗黙fallbackしない。

### Codex CLI / IDE

request JSONの `prompt` を `$imagegen` へ渡して1枚だけ生成する。Codex自身から
`codex mcp-server` を再帰的に呼ばない。

### Phase 3: tracked assetへ取り込む

Codex応答のpathとhashをそのまま渡す。

```bash
npm run blog-images:codex -- ingest \
  --slug <slug> \
  --input <generated_image_path> \
  --prompt-hash <prompt_hash>
```

ingestは入力を1200×630 JPEGへ決定的に正規化し、
`apps/web/scripts/lib/assets/blog-codex-backgrounds/<assetId>.jpg` だけを更新する。
prompt hashが現在のcatalogと違う場合は取り込まず、requestからやり直す。

### Phase 4: gateを通す

```bash
npm run check:blog-images
npx vitest run apps/web/scripts/lib/__tests__/blog-codex-background-catalog.test.ts
npm run type-check:image-pipeline
```

最終合成を確認するときは、R2へ書かないpilotを生成する。

```bash
npx tsx apps/web/scripts/generate-blog-thumbnails-cloud.ts \
  --slug <slug> \
  --out-dir .local/blog-imagegen/pilot
```

`thumbnail-light.webp`、`thumbnail-dark.webp`、`ogp/ogp.png` を目視し、OGPのタイトル可読性、
カード内に文字がないこと、ライト・ダーク両方を確認する。意味上の問題があればcatalogの
`subject` / `detail` または共通prompt versionを更新してPhase 1へ戻る。

## 公開境界

- 生成・ingest・pilotはローカル変更まで許可する。
- R2 push、commit、push、PR、deployはユーザーの明示指示がある場合だけ行う。
- 公開時はgeneratorのexact planを
  `push-generated-image-set.ts --plan` で反映する。prefix uploadを使わない。
- CIでは画像生成AIを呼ばない。git JPEGから同じ最終bundleを再生成して検証する。

## Output Contract

`Slug/Scope | Background Source | OGP | Card Light/Dark | Gates | Published` の表だけを返す。
未実行gateと未公開状態を成功扱いしない。
