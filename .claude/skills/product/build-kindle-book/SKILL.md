---
name: build-kindle-book
description: stats47 の統計データを Amazon KDP 向け電子書籍 (EPUB3) として、既存ブログ記事・ランキングデータから生成・検証する。Use when user says "Kindle 出版", "Kindle 本を作って", "電子書籍を作って", "EPUB を生成", "/build-kindle-book". 生成先は .local (git 管理外)、KDP アップロードは人間工程。
disable-model-invocation: true
primary_agent: kindle-publisher
co_agents: [article-writer, blog-critic]
---

stats47 の Kindle 出版ファクトリー (`packages/product-factory` の kindle チャネル) を操作し、書籍カタログから
EPUB3 を生成・検証して、**オーナーの Kindle Previewer 検証・KDP アップロードを待つ状態**まで仕上げる。

## 大原則

- **必ず `.claude/rules/coconala-product-standards.md §8`（Kindle 出版チャネル）に従う**。
- 書籍定義は git TS (`src/channels/kindle/book-catalog.ts` = `KINDLE_BOOKS`) が SSOT。本文素材は
  **R2 `app/blog/<slug>/article.md` + `data/*.svg`**。生成物 `.local/kindle-books/<id>/v1/` は
  **git 管理外・公開 R2 へ平文で置かない**。KDP送信版は`kindle:archive --push`で暗号化R2保全する。長文の書き下ろしは `src/channels/kindle/manuscripts/<id>/*.md` (freshFile)。
- **主エンジンは EPUB3 リフロー型**（PDF は使わない＝KDP 電子は PDF 実質不可）。図表は SVG→PNG で章内同梱。
- **KDP アップロードはしない**（人間工程・2FA/税務/銀行情報）。「生成成功」を「出品可能」と言わない。
- **著作権 + KDP 規律**: 参照書籍からは論点・型のみ（文言/図案は複製しない）。数値は e-Stat/R2 自社データ。
  **再構成 + 30% 以上の書き下ろしが必須**（未達なら `generate` が警告・READINESS に赤字）。KU 登録は当面見送り。

## コマンド

```
npm run products:kindle:plan      --workspace=@stats47/product-factory              # カタログ一覧・status 集計
npm run products:kindle:validate  --workspace=@stats47/product-factory              # 決定的検証 (id/series/価格/fresh 章)
npm run products:kindle:generate  --workspace=@stats47/product-factory -- --id K-S1-01   # 単一書籍を EPUB 生成
npm run products:kindle:generate  --workspace=@stats47/product-factory -- --all-manuscript  # status>=manuscript を一括
npm run products:kindle:report    --workspace=@stats47/product-factory              # 台帳 .claude/state/products/kindle-status.json
```

## フロー（1 冊を出品可能にする）

1. **企画を manuscript へ昇格**: `book-catalog.ts` の対象書籍に fresh 章（はじめに/読み方/終章 横断分析）を
   `freshFile` で割り当て、blog 章の `blogSlug` が R2 実在することを確認して `status: "manuscript"` にする。
2. **書き下ろしを執筆・レビュー**: fresh 章の本文は `article-writer` が起草 → `blog-critic` が別コンテキストで
   review.md（verdict:PASS）を出すまで直させる（author/critic 分離）。**書き下ろし比率 30% 以上**を満たす分量にする。
3. **生成**: `products:kindle:generate -- --id <id>` → `.local/kindle-books/<id>/v1/{book.epub,cover.png,metadata.json,READINESS.md}`。
   出力の「書き下ろし比率」が 30% 以上（✅）であることを確認する（未達は赤字警告＝出品前提を満たさない）。
4. **構造検証**: EPUB を unzip し、mimetype 先頭 STORE / 全 XHTML・OPF が整形式 / 画像参照が manifest 整合 を確認。
   vitest（`tests/kindle-channel.test.ts`）で回帰も見る。
5. **版保全**: `npm run kindle:archive --workspace=@stats47/r2-storage -- --push --id <id>` → `--audit --deep --record`。EPUB・表紙2種・metadata・READINESS（reviewがあれば同梱）をR2へ暗号化保全し、Git台帳とSHAを一致させる。
6. **オーナーへ受け渡し**: `READINESS.md` に沿って人間が Kindle Previewer で表示確認 → `/kdp-publish`。別PCは`--restore --id <id>`で復元する。

## スコープ

含む: カタログ検証・生成・台帳再生成・書き下ろし章（freshFile）の配線・構造検証・出品前チェック整備。
含まない（委譲）:
- 書き下ろし本文の起草＝`article-writer`、意味レビュー＝`blog-critic`
- ブログ本文素材・ai-content の供給＝`blog-editor` / `ranking-content-author`
- 観測値投入＝`data-ingester`、e-Stat 実在検証＝`estat-researcher`
- Kindle Previewer 検証・KDP アップロード・KU 判断＝人間（オーナー）

## 検証

```
npx tsc --noEmit -p packages/product-factory/tsconfig.json
npm run test:run --workspace=@stats47/product-factory              # kindle 構造テスト含む
npm run products:kindle:validate --workspace=@stats47/product-factory
```

## 関連

- 規約: `.claude/rules/coconala-product-standards.md §8`
- SSOT: `packages/product-factory/src/channels/kindle/book-catalog.ts` / EPUB 生成器 `src/generators/epub.ts`
- 台帳: `.claude/state/products/kindle-status.json`
- 企画・市場判断: `.claude/rules/coconala-product-standards.md §8` / `packages/product-factory/src/channels/kindle/book-catalog.ts`
- agent: `.claude/agents/kindle-publisher.md`
- 品質ゲート（書き下ろし）: `.claude/rules/blog-quality-standards.md`（ですます調・critic PASS）
- note・KDP・Brain・ココナラ横断の商品ポートフォリオと需要ゲート:
  `../build-coconala-product/reference/multi-channel-content-product-factory.md`
