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
- **restore の NFC/NFD 罠**: macOS の bsdtar は展開時に日本語ファイル名を NFD で書くため、`normalizeRelative` で NFC に揃えるまで
  「missing / unexpected」が同名で出て restore が失敗した (2026-09-05 に修正・回帰テストあり)。
- 関連: [[project_docs_reorg_todo_handoffs]]
