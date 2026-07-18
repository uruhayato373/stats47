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
