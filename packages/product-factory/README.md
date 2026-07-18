# @stats47/product-factory

ココナラ商品ファクトリー。stats47 の地図・チャート・公的統計から、共通部品で PowerPoint /
Excel / CSV / SVG / PNG / PDF / 説明書 / プレビュー / 販売文を**段階的に再生成**する基盤。

- 正典 (仕様): `docs/02_実装計画/30_ココナラ商品ファクトリー実装仕様.md`
- 商品候補の正典 (A-01〜L-07): `docs/04_レビュー/2026-07-18-coconala-content-monetization.md`
- 完全DBレス: 商品定義・テンプレート・生成コードは **git TS が SSOT**、観測値は既存 R2 が SSOT。
  Office 等のバイナリは派生物 (手編集を正典にしない・公開 R2 へ置かない)。

## 現在の実装状況 (Phase 1)

Phase 1 = **型付き商品カタログ + 決定的 validator + CLI(検証系)** のみ。商品本制作 (Phase 2+) は未着手。

- `src/catalog/types.ts` — `ProductDefinition` / `ProductFamily` / `LicenseDefinition` 等 (any 不使用)。
- `src/catalog/products/<family>.ts` — レビュー A-01〜L-07 の全 174 商品を family 別に登録 (1 file = 1 family)。
- `src/catalog/{families,licenses,templates}.ts` — 期待件数・ライセンス・テンプレの各レジストリ。
- `src/validators/catalog-validator.ts` — ID 一意 / レビュー対応 / 価格整合 / 参照存在 / enum を決定的に検査。
- `src/cli.ts` — `catalog --check` / `validate --id <ID>` を実装。generate/preview/report は Phase 2+ (未実装)。

生成先は `.local/coconala-products/<product-id>/<version>/` (git 管理外・`.local/` は既に .gitignore)。

## CLI

```bash
npm run products:catalog  --workspace=@stats47/product-factory -- --check   # 全カタログ検証 (受入)
npm run products:validate --workspace=@stats47/product-factory -- --id B-01 # 単一商品検証
npm run type-check        --workspace=@stats47/product-factory
npm run test:run          --workspace=@stats47/product-factory
```

## Phase 0 技術判定 (依存選定・実 spike ベース)

`/tmp` 実 spike + OOXML 検査で決定。**Office 実機 (PowerPoint/Excel) は未インストールのため、
再着色・再計算の実機互換は未検証 (Phase 4 に持ち越し)**。

| 形式 | 採用 | ライセンス | 根拠 / 非採用理由 |
|---|---|---|---|
| PPTX | pptxgenjs 4.0.1 | MIT | 県別 `<a:custGeom>` shape + 埋め込み xlsx チャートをネイティブ出力 (spike で確認)。python-pptx=custGeom補助なし / raw-OOXML=高コスト |
| XLSX | exceljs 4.4.0 | MIT | 数式が値変更に追従 (cached `<v>` 無し)。**チャート書き出し不可**→テンプレ or raw-OOXML 注入が要る。SheetJS community も同制約 |
| PNG preview | sharp 0.33.5 (既存) | Apache-2.0 | 既存資産。playwright は静的ラスタに過剰 |
| PDF | pdf-lib (Phase 2 で追加) | MIT | pure JS・日本語埋め込み。pdfkit/playwright 却下 |
| 地図 SVG ソース | @stats47/svg-builder choropleth (既存) | repo | 既存 tile-grid を SVG/PNG 納品に再利用 |

**県別地図の推奨方式**: prefecture.topojson → d3-geo 投影 → pptxgenjs `custGeom` shape を県ごとに注入
(購入者がアプリ内で県単位に再着色できる = レビュー受入条件)。単一 SVG 画像 (個別編集不可)・
県別 SVG 埋め込み (Windows 限定の shape 変換を購入者に強いる) は却下。
残リスク: 離島の shape 数肥大 / custGeom の穴 (飛地) 描画 / チャート追従・XLSX チャート authoring は Office 未検証。

## note 商品展開ファクトリー (`src/channels/note/`)

ココナラ 174 商品を note 向けに展開する channel (正典: `docs/02_実装計画/31_note商品展開ファクトリー実装仕様.md` /
規約: `.claude/rules/coconala-product-standards.md` 系)。**N0-N3 実装済** (2026-07-18)。

- SSOT: `article-plan.ts` の **55 canonical 記事**が 174 商品を漏れなく束ねる。`product-note-mapping.ts` が
  174 mapping を (family, 記事) から**決定的に導出** (disposition: standalone-paid / bundle-member / free-lead / catalog-only)。
- 生成物は `.local/note-products/<series>/<slug>/` に 7 ファイル (draft.md / hashtags.txt / attachments.json /
  source-manifest.json / product-links.json / images-plan.json / REVIEW.md)。**git 管理外**・note.com へは投稿しない。
- 添付は商品 manifest (`.local/coconala-products/`) を**参照** (複製しない)。有料記事のみ添付を持つ。
- draft は決定的アセンブリ (LLM 原稿ではない)。有料は `<!-- paid:start -->` 境界。無料 (J/K/L) は境界なし。

```bash
npm run products:note:plan     --workspace=@stats47/product-factory -- --check    # coverage 174/174 検証
npm run products:note:generate --workspace=@stats47/product-factory -- --all --draft-only  # 全55記事を .local へ
npm run products:note:generate --workspace=@stats47/product-factory -- --slug ppt-data-explainer-deck
npm run products:note:validate --workspace=@stats47/product-factory -- --all
npm run products:note:report   --workspace=@stats47/product-factory                # .claude/state/products/note-catalog-status.json
npm run products:note:promote  --workspace=@stats47/product-factory -- --all --apply  # 全55を docs/31 + note catalog へ draft staging
npm run products:note:covers   --workspace=@stats47/product-factory -- --all          # 表紙1280×670 + 完成イメージを docs/31 images/ へ
```

**表紙・ハッシュタグ**: `covers --all` が決定的タイトルカード (1280×670・シリーズ別アクセント色・価格/無料バッジ) を
sharp で生成 (`images/cover.png`)。有料記事は `completion.png` に商品プレビューを再利用。ハッシュタグは各記事の
`hashtags.txt` + draft.md frontmatter `tags` に生成済み。

**N4-N5 promote (staging・実行済)**: `promote --all --apply` が 55 記事を `docs/31_note記事原稿/product-sales/<slug>/`
(note-draft frontmatter・`status: draft`・`published: false`) + note catalog SSOT
(`.claude/scripts/note/catalog/data/product-sales.ts`・新 vertical `product-sales`) へ展開。**別カタログを作らない**。
既定は dry-run、`--apply` で書き込み。docs/31・catalog data は git 未追跡 (未 commit)。

**未実施 (N6-N7・人間工程)**: 読者価値の磨き込み (critic/人間)・Office 実機検証・note.com 公開 (月1〜2本・ローカル `/publish-note`)・ココナラ出品。
