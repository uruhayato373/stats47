---
name: publish-bulk-articles
description: 複数のブログ記事を完全DBレスで一括公開する。品質ゲート、R2記事、用途別OGP/カード、all.json、HTTP検証を扱う。Use when user says "記事一括公開", "publish bulk", "まとめて公開".
argument-hint: <slug1> <slug2> ... [--no-verify]
disable-model-invocation: true
primary_agent: blog-editor
co_agents: [article-writer, image-prompt-curator]
---

# Publish Bulk Articles

`docs/21_ブログ記事原稿/<slug>/` の複数記事を `.local/r2/app/blog/<slug>/` へstageし、
記事・画像bundle・`all.json`をR2へ反映する。永続D1は使わない。

## 前提

- 各slugに`article.md`、必要な`data/`、`review.md` (PASS)がある。
- `.claude/rules/blog-quality-standards.md`、`.claude/rules/ogp-image-standards.md`、
  `.claude/rules/branch-workflow.md`を読む。
- R2反映は外部公開。ユーザーが公開を明示した場合だけ実行し、それ以外はdry-runで止める。

## Phase 1: 全件を先に検証する

各slugで以下を実行し、1件でも失敗したら全体を停止する。`--force`は設けない。

```bash
node .claude/scripts/blog/quality-gate.mjs <slug>
node .claude/scripts/lib/article-factual-check.mjs \
  "docs/21_ブログ記事原稿/<slug>/article.md" \
  "docs/21_ブログ記事原稿/<slug>/data"
```

frontmatterの`title`, `seoTitle`, `description`, `category`, `tags`, `publishedAt`も確認する。
画像用`ogp.json`の手作成は不要。

## Phase 2: staging

検証済みslugだけを`.local/r2/app/blog/<slug>/`へコピーする。`publishedAt`が未定なら当日、
`published`はtrueにする。コピー前に対象slugと上書き有無を表示する。

## Phase 3: OGP / サイト内カードを1計画で生成する

各記事のmarkdownから`/generate-blog-images`で固有背景を1枚ずつ生成・ingestする。
全slugの背景が揃うまでbundle生成へ進まず、共有背景へfallbackしない。

```bash
npx tsx apps/web/scripts/generate-blog-thumbnails.ts \
  --slug <slug1>,<slug2>,...

npx tsx packages/r2-storage/src/scripts/push-generated-image-set.ts \
  --plan .local/image-generation-publish-plan-blog.json --dry-run
```

slugごとの生成loopは禁止。generatorは同じplan pathを上書きするため、未反映slugが落ちる。

出力契約:

- OGP: 1200×630 PNG、タイトル・カテゴリ・ブランド入り。
- card: 640×336 WebP light/dark、画像内テキストなし。
- manifest: 背景source、visualType、SHA、3画像のMIME/寸法/SHA。

## Phase 4: 公開

公開指示がある場合だけ、次の順番で実行する。

1. `diff-push-r2.ts --prefix app/blog/<slug>` で各記事本体を反映。
2. `push-generated-image-set.ts --plan .local/image-generation-publish-plan-blog.json` を1回実行。
3. `NODE_OPTIONS='--conditions react-server' npx tsx apps/web/scripts/export-blog-snapshot.ts`。
4. `diff-push-r2.ts --prefix app/blog` で`all.json`を反映。
5. 必要なWorker/CDN cacheをpurgeする。

画像はprefix pushへ混ぜない。必ずasset→manifestのCAS/rollback付きexact plan publisherを使う。

## Phase 5: 検証

各slugについて以下をGETで確認する。

- `https://stats47.jp/blog/<slug>` = 200、期待する`<title>`。
- `.../thumbnail-light.webp` / `thumbnail-dark.webp` = 200、640×336 WebP。
- `.../ogp/ogp.png` = 200、1200×630 PNG。
- HTMLの`og:image`が同slugの静的R2 URL。

公開URLが古い場合はS3実体とCloudflare cacheを分けて診断する。5xx/timeoutを404扱いしない。

## Output Contract

`Slug | Quality | Factual | Image Plan | Article R2 | Image R2 | HTTP` の表だけを返す。
未実行とdry-runを公開成功として表示しない。

## 関連

- 単一記事: `/publish-article`
- 画像生成: `/generate-blog-images`
- 画像監査: `/audit-ogp-images`
- 配信契約: `.claude/rules/ogp-image-standards.md`
