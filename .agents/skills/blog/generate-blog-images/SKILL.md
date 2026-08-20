---
name: generate-blog-images
description: >-
  Codex built-in imagegenでstats47ブログの単一モチーフ背景を生成し、OGP・一覧サムネイルへ決定的に合成する。ブログ画像の新規作成、再生成、Codex MCP経由生成、画像catalog追加、サムネイル欠落修復で使う。
metadata:
  primary_agent: "image-prompt-curator"
  co_agents: "blog-editor"
---

# Generate Blog Images

ブログ画像の意味仕様をgit TS、生成済み背景をgit JPEG、最終配信物をR2に分離する。
プロンプトを本文や本スキルへ複製せず、必ず
`apps/web/scripts/data/blog-codex-background-catalog.ts` から導出する。

## 必読

1. `.Codex/rules/ogp-image-standards.md` の「画像生成 AI」節を読む。
2. Codexから生成する場合は `.Codex/rules/codex-mcp.md` の画像生成節を読む。
3. 外部反映が含まれる場合は `.Codex/rules/branch-workflow.md` を読む。

## 入力契約

- `slug` は公開または公開予定の記事slugを使う。
- 1背景には1つの視覚モチーフだけを定義する。
- タイトル、数字、グラフ、地図、装飾パターンを背景へ描かない。
- 左62%をタイトル安全域、右35%をモチーフ領域にする。
- 同じ主題は同じasset定義を共有する。記事ごとの自由入力プロンプトを作らない。

## Phase 1: catalogを定義する

対象slugが `BLOG_CODEX_BACKGROUND_BY_SLUG` に無ければ、同ファイルの `background()` を使って
`assetId`、`subject`、`detail` を追加する。プロンプト本文、model、サイズ、セーフエリアは
共通builderから変更しない。

追加後にrequestを生成する。

```bash
npm run blog-images:codex -- request --slug <slug>
```

生成される `.local/blog-imagegen/requests/<slug>.json` を実行入力とする。同JSONの
`prompt`、`promptHash`、`mcp.arguments` を手で書き換えない。

## Phase 2: 画像を生成する

### Codex

request JSONの `mcp.arguments` を使って `mcp__codex__codex` を1回呼ぶ。

- `cwd`: 実際のリポジトリルートへ置換する。
- `sandbox`: `read-only` のままにする。
- `approval-policy`: `never` のままにする。
- Codexにはrepo編集、shell実行、R2反映、deployをさせない。
- 返り値は `generated_image_path` と `prompt_hash` のJSONだけ受け取る。

接続できない場合は `Codex mcp get codex` と `codex login status` を確認して停止する。
Geminiや別プロバイダへ暗黙fallbackしない。

### Codex CLI / IDE

request JSONの `prompt` を `$imagegen` へ渡して1枚だけ生成する。Codex自身から
`codex mcp-server` を再帰的に呼ばない。

## Phase 3: tracked assetへ取り込む

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

## Phase 4: gateを通す

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

`thumbnail-light.webp`、`thumbnail-dark.webp`、`ogp/ogp.png` を目視し、モチーフ数、
タイトル可読性、ライト・ダーク両方を確認する。意味上の問題があればcatalogの
`subject` / `detail` または共通prompt versionを更新してPhase 1へ戻る。

## 公開境界

- 生成・ingest・pilotはローカル変更まで許可する。
- R2 push、commit、push、PR、deployはユーザーの明示指示がある場合だけ行う。
- 公開時はgeneratorのexact planを
  `push-generated-image-set.ts --plan` で反映する。prefix uploadを使わない。
- CIでは画像生成AIを呼ばない。git JPEGから同じ最終bundleを再生成して検証する。

## Output Contract

`Slug | Motif | Prompt Hash | Asset Path | Gates | Published` の表だけを返す。
未実行gateと未公開状態を成功扱いしない。
