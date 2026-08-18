---
name: project_coconala_product_factory
description: ココナラ商品ファクトリー (packages/product-factory) の SSOT・生成パイプライン・限界・正典の在り処
metadata: 
  node_type: memory
  type: project
  originSessionId: 8c542fb3-8f47-42d1-ba69-1e326eda9b9d
  modified: 2026-07-23T00:47:39.214Z
---

ココナラで stats47 の都道府県データ商品を売るための商品ファクトリー。**新規 `packages/product-factory/`**（`@stats47/product-factory`・raw TS・vitest/tsx）。

**★2026-07-23 破壊的縮約: 旧174商品 (A-01〜L-07) → テーマ別13パック (P-01〜P-13) に集約**（同一テーマが family 横断で重複していたため。pptx+xlsx+csv+pdf を1パックに同梱）。型は `family`→`theme`(PackTheme 13slug)、`datasets`(実データ接続台帳)/`variantOptions`(旧K系ライセンス違い)/`sourceIds` 追加。カタログは `src/catalog/products/packs.ts` 1本（旧12ファイル削除）。**P-01=人口・世帯パックのみ実データ接続済**（旧 D-01 の4データセット継承・byte 非回帰）。P-02〜P-13 は datasets 未接続=status cataloged=**出品不可**（validator が approved/listed パックの datasets 実在を検査=誇大表示防止）。ビルドは databook 経路標準化（pptx 複数指標対応 `databook-pptx.ts` 追加）。検証 green: tsc / catalog --check(13) / vitest 25 / build-all 13。未コミット。

**正典**: `.claude/rules/coconala-product-standards.md` + `packages/product-factory/README.md`。商品案の由来は `packs.ts` の `sourceIds`（旧 A-01〜L-07、初期調査はGit履歴）。

**SSOT（完全DBレス準拠）**: 商品定義=git TS（`src/catalog/`）/ 実データ=R2 観測値→git TS スナップショット（`src/data/datasets/*.ts`・基準年固定。取得は `src/data/load-ranking-values.ts`）/ 生成バイナリ=`.local/coconala-products/<id>/<version>/`（**git 管理外・計584M**・手編集を正典にしない・公開R2へ置かない）/ 台帳=`.claude/state/products/catalog-status.json`。永続D1なし・公開R2書込みなし。

**生成**: `products:generate --all`（~10分・174商品）/ `--id <ID>`（単品）/ `products:catalog --check` / `products:report`。ジェネレータ: pptx（**pptxgenjs custGeom で県別再着色できる地図** + ネイティブチャート）/ xlsx（**exceljs・RANK 数式・ネイティブチャート/塗り分け地図は不可→Excel 挿入手順を案内**）/ csv(BOM) / svg+png / manual.pdf（pdf-lib+NotoSansJP subset）。

**★限界（次の磨き込み）**: (1) **P-02〜P-13 は未接続=共通デモデータ**（日本人人口2024）。実指標接続が出品の律速（各パックに datasets を定義→data-ingester で接続→status 昇格）。(2) **note チャネル凍結中**（PACKS_MIGRATION で tsconfig/vitest exclude・未公開のため実害なし。1パック=1記事の再設計が残タスク）。(3) **Office 実機未検証**（環境に PowerPoint/Excel が無く OOXML 構造検証のみ。オーナーが Windows でまとめて検証する方針）。(3) 地図は概略海岸線・沖縄インセット未実装。docx/web は未対応スキップ。

**構造化（2026-07-18 作成済）**: 正典 rule `.claude/rules/coconala-product-standards.md` / skill `/build-coconala-product`（`.claude/skills/product/`）/ agent `coconala-product-manager`（README Tier5 登録）。恒久 workflow(CI) は未作成（生成は手動 CLI）。**出品はオーナーの人間工程**（禁止事項・アカウント操作）。戦略（`docs/02_実装計画/01`）は「1商品ずつ需要実測」。残作業は `.claude/todo/05_機能バックログ.md#COCONALA-PRODUCT-FACTORY-01`。
