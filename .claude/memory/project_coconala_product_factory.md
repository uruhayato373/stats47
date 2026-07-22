---
name: project_coconala_product_factory
description: ココナラ商品ファクトリー (packages/product-factory) の SSOT・生成パイプライン・限界・正典の在り処
metadata: 
  node_type: memory
  type: project
  originSessionId: 8c542fb3-8f47-42d1-ba69-1e326eda9b9d
---

ココナラで stats47 の都道府県データ商品を売るための商品ファクトリー。**新規 `packages/product-factory/`**（`@stats47/product-factory`・raw TS・vitest/tsx）。2026-07-18 に Phase 0（依存判定 spike）→ Phase 1（全174商品カタログ）→ Phase 2（共通基盤）→ Phase 3（MVP B-01）→ 実データ化 → **全174商品を一括生成**まで実施（オーナー指示で段階拡張）。

**正典**: `docs/02_実装計画/30_ココナラ商品ファクトリー実装仕様.md`（末尾に Phase 記録）+ `packages/product-factory/README.md`。商品案の出所は `docs/04_レビュー/2026-07-18-coconala-content-monetization.md`（A-01〜L-07=174件）。

**SSOT（完全DBレス準拠）**: 商品定義=git TS（`src/catalog/`）/ 実データ=R2 観測値→git TS スナップショット（`src/data/datasets/*.ts`・基準年固定。取得は `src/data/load-ranking-values.ts`）/ 生成バイナリ=`.local/coconala-products/<id>/<version>/`（**git 管理外・計584M**・手編集を正典にしない・公開R2へ置かない）/ 台帳=`.claude/state/products/catalog-status.json`。永続D1なし・公開R2書込みなし。

**生成**: `products:generate --all`（~10分・174商品）/ `--id <ID>`（単品）/ `products:catalog --check` / `products:report`。ジェネレータ: pptx（**pptxgenjs custGeom で県別再着色できる地図** + ネイティブチャート）/ xlsx（**exceljs・RANK 数式・ネイティブチャート/塗り分け地図は不可→Excel 挿入手順を案内**）/ csv(BOM) / svg+png / manual.pdf（pdf-lib+NotoSansJP subset）。

**★限界（次の磨き込み）**: (1) 全174商品が**共通デモデータ=日本人人口2024**で生成され、差別化は形式・枠組み・販売文のみ。商品ごとの個別テーマ・実指標接続は未実施（`resolveDataset` を写像に拡張して実装する）。(2) **Office 実機未検証**（環境に PowerPoint/Excel が無く OOXML 構造検証のみ。オーナーが Windows でまとめて検証する方針）。(3) 地図は概略海岸線・沖縄インセット未実装。docx/web は未対応スキップ。

**構造化（2026-07-18 作成済）**: 正典 rule `.claude/rules/coconala-product-standards.md` / skill `/build-coconala-product`（`.claude/skills/product/`）/ agent `coconala-product-manager`（README Tier5 登録）。恒久 workflow(CI) は未作成（生成は手動 CLI）。**出品はオーナーの人間工程**（禁止事項・アカウント操作）。戦略（`docs/02_実装計画/01`）は「1商品ずつ需要実測」。残作業は `docs/todo/02_機能バックログ.md#COCONALA-PRODUCT-FACTORY-01`。
