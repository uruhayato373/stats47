---
name: project_product_ledger
description: 商品の台帳と価格実験 (2026-11-04)。判断は product-strategy.json、価格の履歴は price-history.json、集計は週次に自動生成。判定は 2026-12-30
metadata:
  type: project
---

商品の判断は `data/products/product-strategy.json` (商品群・決定・次の論点)、価格の実験と変更は `data/products/price-history.json`、集計は `data/products/PRODUCT-LEDGER.md` と管理画面「商品の台帳」。価格と実績は既存の台帳から読み、戦略の台帳に写さない。価格変更は `update-note-price.mjs` で読み戻す。

**Why:** 価格が 3 か所に分かれ判断の記録が無く、note のデータ集はココナラの価格を移しただけだった。

**How to apply:** 実験 PRICE-DATA-PACK-2026-11 (テーマ別 ¥1,980・総合集 ¥4,980) は 2026-12-30 に判定するまで価格を重ねて変えない。戦略文書への質問は NotebookLM「stats47 商品戦略」へ `notebooklm ask` で行う。「stats47の戦略検討」は他人のブログが混ざっていて使えない。KDP の 35% は KDP セレクト未登録が原因で、登録は 1 冊ずつオーナーが決める。関連: [[project_monetization_contract]]
