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
  **内部編集基準として再構成 + 30% 以上の書き下ろしが必須**。Amazonの許諾・審査合格を保証する基準ではない。未達・欠落は非zero終了とし、KU 登録は当面見送り。

## コマンド

```
npm run products:kindle:plan      --workspace=@stats47/product-factory              # カタログ一覧・status 集計
npm run products:kindle:validate  --workspace=@stats47/product-factory              # 決定的検証 (id/series/価格/fresh 章)
npm run products:kindle:generate  --workspace=@stats47/product-factory -- --id K-S1-01 --version <NEW_VERSION>
npm run products:kindle:generate  --workspace=@stats47/product-factory -- --all-manuscript --version <NEW_VERSION>
npm run products:kindle:verify-epub --workspace=@stats47/product-factory -- --version <VERSION> --report <NEW_JSON_PATH>
npm run products:report --workspace=@stats47/product-factory -- --kindle-version <VERSION>
npm run products:kindle:report    --workspace=@stats47/product-factory              # 台帳 .claude/state/products/kindle-status.json
```

## フロー（1 冊を出品可能にする）

1. **企画を manuscript へ昇格**: `book-catalog.ts` の対象書籍に fresh 章（はじめに/読み方/終章 横断分析）を
   `freshFile` で割り当て、blog 章の `blogSlug` が R2 実在することを確認して `status: "manuscript"` にする。
2. **書き下ろしを執筆・レビュー**: fresh 章の本文は `article-writer` が起草 → `blog-critic` が別コンテキストで
   review.md（verdict:PASS）を出すまで直させる（author/critic 分離）。**書き下ろし比率 30% 以上**を満たす分量にする。
   **レビューは書き下ろし章だけでなく全章 (ブログ由来章・図の数値を含む) を対象にする** — 2026-09-19 の K-S1-01 で、
   書き下ろしだけを見た初回 PASS のあとに、ブログ由来 9 章から BLOCK 8 / MAJOR 19 が出た。critic には
   (a) 章テキスト (EPUB を展開したもの) (b) 図の数値 JSON (R2 `app/blog/<slug>/data/<name>.json`)
   (c) **指標定義シート** `npx tsx .claude/scripts/blog/build-metric-definition-sheet.ts --slug <blogSlug…>` を渡し、
   `blog-quality-standards.md`「定義整合」を BLOCK 基準にする。findings の before は章本文の逐語で受け取り、
   ブログ由来章は `editorial-corrections.ts` (書籍版のみの校訂・公開ブログは変えない)、書き下ろし章は
   `manuscripts/<id>/*.md`、**図の中の文字 (図題・年の型・軸ラベル) は `figure-corrections.ts`** (PNG 化の直前に
   SVG の文字列だけを置換。数値・点は触らない。ブログ側で図データを直したら before が消えるので生成が止まり、
   エントリを外す) へ反映して再生成 → verify-epub (3 層) → critic の delta 再審査で PASS を取る。
   図データそのもの (別年の指標への差し替え・小数桁) はブログ側の chart-author 工程で、書籍側では直せない。
   同じ誤りは公開ブログにも残るので、review.md を blog remediation (`/blog-revise-fix`) へ引き渡す。
3. **生成**: `products:kindle:generate -- --id <id> --version <NEW_VERSION>` → `.local/kindle-books/<id>/<NEW_VERSION>/`。既存版は上書き不可。
   出力の「書き下ろし比率」が 30% 以上（✅）であることを確認する（未達は赤字警告＝出品前提を満たさない）。
4. **構造検証**: EPUB を unzip し、mimetype 先頭 STORE / 全 XHTML・OPF が整形式 / 画像参照が manifest 整合 を確認。
   vitest（`tests/kindle-channel.test.ts`）で回帰も見る。
4b. **検証レポートと受領証** (`verify-publishable` / `kdp-release-gate` が見る機械証跡・2026-09-19):
   `npx tsx packages/product-factory/scripts/verify-epub.mts --book <id> --version <VERSION> --report .claude/state/products/kindle-<VERSION>-verification.json`
   (同じ版名の冊が複数あるときはファイルが既にあるので、一時ファイルへ出して `report[]` にマージする) →
   `npx tsx packages/product-factory/scripts/write-review-receipt.mts --book <id> --version <VERSION> --reviewer /agents/blog-critic`
   が review.md の PASS を実 EPUB の章 SHA・authoredSha256 に結び付けた `review.json` を書く (PASS でない版・再生成が要る版には書けない)。
   `node --import tsx packages/product-factory/scripts/verify-publishable.mts --version <VERSION> --book <id> --content-only` で本文側の blocker 0 を確認する。
   表紙背景 (`assets/cover-backgrounds/<id>.jpg`) は `codex exec` + `$imagegen` で横長 1536×1024 の文字なし帯絵を作り、
   `ingest-cover-background.mts --band` で下 42% に置く (プロンプトの型は `.local/kindle-cover-imagegen/build-prompts.mjs`)。
5. **版保全**: `npm run kindle:archive --workspace=@stats47/r2-storage -- --push --id <id> --version <VERSION>` → `--audit --id <id> --version <VERSION> --deep --record`。EPUB・表紙2種・metadata・READINESS（review.md/review.jsonがあれば同梱）をR2へ暗号化保全し、Git台帳とSHAを一致させる。pushだけでは検証済みにしない。
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
