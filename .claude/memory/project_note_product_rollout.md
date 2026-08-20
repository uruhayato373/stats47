---
name: project_note_product_rollout
description: note商品展開ファクトリー(product-factory/src/channels/note)。ココナラ174商品をnote 55記事へ展開する基盤・SSOT・CLI・disposition・限界
metadata: 
  node_type: memory
  type: project
  originSessionId: e22b1714-eef5-405a-811e-ca62d9f9a6dc
---

ココナラ 174 商品 ([[project_coconala_product_factory]]) を note 向けに展開する channel。**新規 `packages/product-factory/src/channels/note/`**。2026-07-18 に **N0(監査)→N1(mapping/series/validator)→N2(生成基盤+fixture3)→N3(全55記事一括生成)→N4-N5(promote基盤+全55をdraft staging)** を実装 (オーナー選択「N0〜N3全部」→「全55をdraftで一括staging」)。**note.com公開・R2 push・commit は一切していない (N6-N7=人間承認後・月1-2本・ローカルbrowser-use)**。

**正典**: `packages/product-factory/src/channels/note/` + `packages/product-factory/README.md`。横断チャネルの需要・商品化gateは `.claude/skills/product/build-coconala-product/reference/multi-channel-content-product-factory.md`、進捗は `.claude/todo/backlog.md`。

**SSOT (完全DBレス)**: `article-plan.ts` の **55 canonical 記事**が git TS SSOT で 174 商品を漏れなく重複なく束ねる。`product-note-mapping.ts` が 174 mapping を (family, 記事) から**決定的に導出** (手書き174エントリを持たない)。disposition 規則: license→catalog-only / entry・service→free-lead / 単独member有料記事→standalone-paid / 他→bundle-member。実測 = bundle-member135/standalone-paid7/free-lead22/catalog-only10、access=paid49/free6。11シリーズ (仕様§4の9 + license-guide/free-samples)。

**生成物**: `.local/note-products/<series>/<slug>/` に 7 ファイル (draft.md/hashtags.txt/attachments.json/source-manifest.json/product-links.json/images-plan.json/REVIEW.md)。**git管理外**。draft は**決定的アセンブリ (LLM原稿でない)**、有料は `<!-- paid:start -->` 境界+添付、無料(J/K/L)は境界なし。添付は商品manifest(`.local/coconala-products/`)を**参照**(複製しない)・有料記事のみ。台帳=`.claude/state/products/note-catalog-status.json`。

**CLI**: `products:note:{plan --check / generate --all --draft-only / generate --slug <s> / validate --all / promote --all|--slug <s> [--apply] / report}`。**promote は既定dry-run・--apply で実行**。

**N4-N5 promote (staging・実行済)**: `promote --all --apply` が 55 記事を (a) docs/31_note記事原稿/**product-sales**/<slug>/ (draft.md=note-draft frontmatter・status:draft・published:false・有料は`<!-- paid:start -->`保持 / hashtags.txt / attachments.json / REVIEW.md) と (b) note catalog data `.claude/scripts/note/catalog/data/product-sales.ts` (55 NoteArticle・magazine:null・r2Body:false) に展開。**別カタログを作らず既存 note catalog SSOT に新 vertical `product-sales` を追加** (catalog/types.ts NoteVertical union + index.ts 配線)。note-catalog validate=error0 (294記事=既存239+55、product-sales由来の指摘0)。**generate-note-catalog.ts は status==published でフィルタ→draft 55件は派生index/r2-missingに混入しない (整合監査済 hash 55cef0b)**。docs/31・catalog data は git未追跡(未commit)。

**カバー画像+ハッシュタグ (実行済)**: `covers --all` が **決定的タイトルカード1280×670 (generators/cover.ts+build-note-covers.ts・外部AI不使用・sharp・シリーズ別アクセント色・価格/無料バッジ・日本語描画目視OK)** を全55 `images/cover.png` に生成、有料49は `completion.png` に商品プレビュー再利用。ハッシュタグは hashtags.txt + draft frontmatter tags に生成済み。CLI = `products:note:covers --all`。**次(N6-N7)**: 読者価値の磨き込み(critic/人間)・Office実機検証・note.com公開(月1-2本・ローカル/publish-note・オーナー承認)。

**検証**: type-check=0 / vitest **36/36** (既存24+note12) / catalog --check=0(回帰) / git diff --check=0 / note validate --all green (55 draft の claims スキャン0件)。

**★限界/次 (N4+)**: (1) promote 未実装 (docs/31 展開+note catalog draft 化)。(2) draft は決定的雛形=原稿の磨き込み(読者価値・独自解説)は critic/人間が公開前に。(3) Office実機未検証の添付は warning 142件(`attachment-unverified`)=公開前ゲート。(4) 公開は月1-2本・オーナー承認後のみ。担当分業: note-manager(catalog/公開)・coconala-product-manager(manifest/添付)・chart-author(図表)。

**2026-07-18 commit+push (git race 回避)**: 全成果を `feature/note-product-rollout` (commit fe3e42a9・420ファイル・note/ココナラのみ・親 bf802764) に commit し origin へ push 済。別セッションが feature/area-databook で同時稼働・共有 index を触っていたため、通常 commit は他作業を混入させる危険 → **private index (`GIT_INDEX_FILE`) で自分のパスだけの tree→commit-tree→専用ブランチ**で回避 (共有 index・area ブランチに非干渉)。混在ファイル (agents/README・docs/02 00_INDEX・todo/02_機能バックログ) は他作業と同居のため commit から除外。**develop への PR は未実施**。当時のPhase記録はgit履歴に保持し、現在はコードとTODOを正典とする。
