---
name: project_kakei_marketing_book_pipeline
description: 吉本佳生『マーケティングに使える「家計調査」』(2015) を source-vault profile kakei-marketing-2015 として保全・全ページ解決済み。展開は backlog KAKEI-MARKETING-CONTENT-01。Kindle縦書きスキャンのOCR手順とDriveマウント経路の要点
metadata: 
  node_type: memory
  type: project
  originSessionId: 78c7e753-be3e-44e0-a16c-0ad0c536109c
  modified: 2026-09-05T00:36:13.208Z
---

2026-09-05 に『マーケティングに使える「家計調査」』(講談社・ISBN 978-4-06-219375-7・307ページ Kindle画面スキャン) を
`kakei-marketing-2015` profile で Drive `stats47/参考文献/マーケティングに使える家計調査/2015年版/` へ bundle 化 (r1) し、
分析・論点 33 件 + 県庁所在市 47 件を `packages/data-configs/src/evidence-inventory/kakei-marketing/analyses.json` に authored。
inventory は coverage 100%。展開 (new-metric 2 件・記事 wave・県別食文化シリーズ) は `.claude/todo/backlog.md` の
`KAKEI-MARKETING-CONTENT-01`、契約は doc 46 §4.4。

**Why:** 書籍の論点は既存 kakei-chousa metric (694 件) でほぼ再現できるが、全国集計 (年収五分位・年齢階級・月次) は都道府県値ではないので
/ranking へ載せない、という境界を台帳側で固定する必要があった。

**How to apply:**
- この Mac は Google Drive をローカルマウントしている (`~/Library/CloudStorage/GoogleDrive-uruhayato373@gmail.com/マイドライブ/`)。
  `source-vault verify/restore --parts-dir` にマウント上の版フォルダを直接渡せる (コネクタ経由の一時ダウンロード不要)。
  ファイルは dataless (初回アクセスで取得) なので大きい PDF は最初だけ遅い。
- Kindle 画面の縦書きスキャンは `jpn_vert` + psm 5。**Kindle の UI 枠を含めたまま OCR すると縦書きの読み始め (右端) が欠ける**ので、
  読解用には内容領域だけ crop する (220dpi なら `1970x2550+236+268`)。図表ページは OCR が崩れるのでページ画像を Read で見る。
- 新しい参考文献を足すときは: config profile → `source-vault create` → state manifest → Drive へ配置 → `prepare` →
  `extract --pages all --allow-all-pages` → authored JSON → `source-inventory build`。テスト 3 本 (profile 数 5) と
  `EvidenceSourceKey` / `REFERENCE_SOURCE_POLICIES` / doc 46 (sourceKey の記載が readiness 契約) を同時に更新する。
- bundle は r2 (PDF + `pages/pNNNN.jpg` 307 枚 = UI枠除去済み 220dpi + `transcripts/` 307 本 + `page-dims.json`、約 75MB・1 part)、r3 = r2 + `md/` + `figures/` + `crop-manifest.json`。
  ページ画像を同梱したのはオーナー指示 (OCR・図クロップの品質確認に使う)。図表ページは transcript が崩れるので `pages/` を Read で見る。
- **段階処理の運用 (2026-09-05 ルール化)**: PDF→ページ画像→Markdown文字起こし→図クロップ→台帳は S0〜S5 の stage 契約
  (`reference-source-standards.md` §3) と skill `/process-reference-source` (owner open-data-curator) で管理する。ページ画像の
  dpi / format / `contentCrop` は profile の `processing.pageImage` に宣言し、`extract` が `page-dims.json` に記録する。
  Markdown 文字起こしは agent が `md/pNNNN.md` (frontmatter page/kind/figures) に書き、`md-check --check` で全ページ検査、
  `stage --revision N+1` → `source-vault create` で次 revision に積む。到達段階は `stage-status` で読む。**r3 (2026-09-05) で S0〜S4 すべて到達**: `md/` 307 + `figures/` 113 (crop-manifest 同梱)、2 part 133MB。
  文字起こしは Workflow で sonnet (本文 12p/agent) と opus (図表 8p/agent + 混在ページの crop 後追い) に分業し、38 agent・約 40 分・約 17.8M subagent tokens で完了した。図表ページは OCR 文字数 <260 かかな比率 <0.25 で事前分類できる。
- **展開 (S5) の接地器と分業 (2026-09-05)**: 既存記事更新・新規記事・県別食卓 47 本・月次型C は Workflow (writer sonnet → quality-gate →
  critic opus/sonnet → fix → delta 再審査) で回す。スクリプトは `~/.claude/projects/-Users-minamidaisuke-stats47/<session>/workflows/scripts/`
  (`kakei-existing-article-update` / `kakei-new-articles-wave-a` / `kakei-food-culture-update` / `kakei-wave-b-monthly`)。
  接地器: `build-kakei-quantity-price.mjs` (食料 125 ペアを数量指数×価格指数に分解、47 県庁所在市平均=100、閾値 120、findings カード) と
  `fetch-kakei-monthly.mjs` (e-Stat 0003343671/0003343670 月次 全国 + CPI 0003427113、annual/monthly/months-by-year、購入単価=金額÷数量、source.json kind:estat)。
  R2 の kakei values.json には全国行 (00000) が無いので基準は 47 市平均で代用し、記事側で明記する。
- **公開の段取り**: 別 worktree `/Users/minamidaisuke/stats47-kakei-publish` (branch kakei-publish、`node_modules` は本体へ symlink) で
  記事 ≤10 slug/commit → `git push origin HEAD:develop` → `blog-auto-publish.yml` (diff HEAD~1..HEAD)。新 metric を足したら
  `npm run generate:ranking-prominence --workspace apps/web` を忘れると pre-commit が止まる。pre-commit は Workflow 並走中 35〜40 分かかる。
  新 metric へリンクする記事は KNOWN keys を含む code commit が develop に載ってからでないと CI の quality-gate (soft 404 lint) で skip される。
- **公開で実際に踏んだ罠 (2026-09-06)**: ①新規 slug と title を変えた既存記事は `generate-blog-thumbnails.ts` が「記事固有背景がありません / AI背景promptが変わりました」で fatal になる → 公開前に `npm run blog-images:codex -- request-article --slug <slug> --article docs/21/<slug>/article.md` → `mcp__codex__codex` (read-only・never) で `$imagegen` 1 枚 → `ingest-article` で `apps/web/scripts/lib/assets/blog-article-backgrounds/<slug>.jpg` を作り、記事と同じ commit に載せる (prompt hash は title + visualType/motif。description 変更は無関係)。②push トリガーの `blog-auto-publish` は diff 分に加えて docs/21 の未公開ドラフト全部を reconcile するので、他セッションの背景無し記事があると alphabetical 順で fatal → 自分の slug は `gh workflow run blog-auto-publish.yml -f slugs=...` で明示 dispatch する (concurrency group `r2-write` は pending 1 本しか持てず、後続 push が pending dispatch を cancel する)。③Workflow の `resumeFromRunId` は 2 回目の resume で cache が効かず全 agent が再実行された (16 本で ~15M tokens)。失敗分だけ新規 run にして args を絞る方が安い。④サーバー側レート制限 (usage limit ではない) は同時 ~25 agent で連発する。Workflow は 16 + 5 程度までに分けて起動する。
- **2026-09-06 の完遂セッションで踏んだ罠**: ①`$TMPDIR/stats47-source-vault/` と scratchpad はセッションを跨ぐと消える。復元は Drive のローカルマウント (`~/Library/CloudStorage/GoogleDrive-…/マイドライブ/stats47/参考文献/マーケティングに使える家計調査/2015年版`) を `--parts-dir` にそのまま渡して `npm run source-vault -- restore --manifest .claude/state/source-inventory/kakei-marketing/2015/source-bundle-manifest.json` (md 307 ページが戻る)。県別 batch の args (`{slug,prefCode,prefName,city,pages}`) は `analyses.json` の `a06-01`〜`a06-47` の question 「◯◯市(◯◯県)」を parse し `packages/area/src/data/prefectures.json` (`prefCode`/`prefName`) で県コードを引いて再生成できる。②`build-kakei-quantity-price.mjs` の `counts` は「他の〜」残余品目を**除いた**数で `rows` より少ない (仕様)。記事が counts をそのまま「N 品目」と書くと図・生データと食い違う。`countsNote` を full JSON に足して writer/critic 双方の prompt にも明記した (shizuoka/nara/miyazaki/okayama で実際に発生)。③既存 slug の title 変更は**公開 CI を落とさない**。`resolveArticleBackgroundSource` は git の jpg を読み prompt hash を**その場で再計算**するだけで、保存済み hash と照合しない (照合は `ingest-article` 時のみ)。fatal になるのは「記事固有背景の jpg が無い」新規 slug だけ。④push トリガーの publish は docs/21 の未公開ドラフトを全部 reconcile するので、他セッションの背景なし記事があると Fatal で自分の分も公開されない。**失敗したら `gh workflow run blog-auto-publish.yml -f slugs=…` で明示 dispatch すれば通る** (実際に 2 回踏んで 2 回とも dispatch で回復)。⑤critic の指摘は「倍率・指数の誤り」が最頻。次点は「`rank` フィールドを『品目中 N 位』と誤読」「指数の高低の向き (100 基準) を逆に書く」「図だけ直して本文が旧値」。writer/critic の prompt に json 突合と SVG grep を明示すると 1 巡で収束する。⑥Agent tool の同時 16 体は sonnet で 429 (server rate limit) を誘発する。12〜13 体に抑え、429 が出た分だけ数分後に fresh 起動する。
- **restore の NFC/NFD 罠**: macOS の bsdtar は展開時に日本語ファイル名を NFD で書くため、`normalizeRelative` で NFC に揃えるまで
  「missing / unexpected」が同名で出て restore が失敗した (2026-09-05 に修正・回帰テストあり)。
- 関連: [[project_docs_reorg_todo_handoffs]]
