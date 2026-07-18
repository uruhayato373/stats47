---
type: session-handoff
date: 2026-07-18
status: active
topic: ココナラ商品ファクトリー — 全174商品を実データで生成完了・実機検証/出品待ち・全て未コミット
tags: [coconala, product-factory, monetization, handoff]
---

# ハンドオフ: ココナラ商品ファクトリー (2026-07-18)

## ⚠️ 最重要（次セッションが最初に知るべきこと）

- **このセッションの成果は全て未コミット**（`packages/product-factory/` は untracked、`package-lock.json` と docs は working tree 変更のまま）。commit/push/deploy は一切していない（オーナー指示・規律どおり）。
- **別セッションが `docs/todo/02_機能バックログ.md` を並行編集していた**（COCONALA 節が line23→63 に移動）。git race 注意（CLAUDE.md「並行エージェントと SSOT 共有」）。commit 前に `git fetch` + 差分確認。
- 生成物は `.local/coconala-products/`（**計584M・git管理外**）。`generate --all` は約10分。

## 背景

正典 = `docs/02_実装計画/30_ココナラ商品ファクトリー実装仕様.md`（末尾に Phase 0〜3++ の記録）。
レビュー = `docs/04_レビュー/2026-07-18-coconala-content-monetization.md`（A-01〜L-07 の全商品案）。
オーナー指示で「Phase 0-1 のみ」→「全商品を実データで制作」まで段階拡張した。

## やったこと（未コミット working tree）

- **新規 `packages/product-factory/`**（`@stats47/product-factory`・raw TS・vitest/tsx・src 46 ファイル）。
- **カタログ**: レビュー A-01〜L-07 の全 174 商品を型付き登録（`src/catalog/`・family 別 12 ファイル・`any` 不使用）+ 決定的 validator。
- **共通基盤**: 47県マスタ / CVD-safe パレット / SOURCES(BOM) / dataset(欠損null) / **topojson→custGeom 地図**(pptxgenjs) / chart-spec / license-text。
- **ジェネレータ**: pptx(custGeom地図+ネイティブチャート) / **xlsx(exceljs・RANK数式・チャート不可)** / csv / svg+png / manual.pdf(pdf-lib+NotoSansJP subset) / listing / manifest / readiness。
- **汎用ビルダー** `src/build/build-product.ts` + `build-all.ts` + CLI `products:generate --all|--id` / `products:report`。
- **実データ**: 全商品を **日本人人口2024**（e-Stat 社会・人口統計体系 statsDataId 0000010101。R2→git TS snapshot `src/data/datasets/japanese-population.ts`）で生成。
- 依存追加: `pptxgenjs` / `exceljs` / `pdf-lib` / `@pdf-lib/fontkit` / `@expo-google-fonts/noto-sans-jp` / `topojson-client`。
- 台帳 `.claude/state/products/catalog-status.json`（174 generated）。

## 検証状態（実行済・green）

`type-check`=0 / `vitest`=24/24 / `products:catalog --check`=0（174件0エラー）/ `generate --all`=0（174商品）/ `git diff --check`=0 / `.local`未追跡・no any・秘密/絶対パス0。生成実測: pptx90・xlsx101・svg13・png13・manual161・service雛形15。

## 残タスク（★次にやること）

1. **【オーナー・人間工程】Office 実機検証** — 環境に PowerPoint/Excel が無く構造(OOXML)検証のみ。**Windows 実機**で県別再着色・チャート編集追従・表示崩れを確認。各商品の `READINESS.md` 参照。
2. **【人間工程】出品** — ココナラへのアップロードは禁止事項・アカウント操作。**戦略は1商品ずつ需要実測**（全174一括出品は非推奨）。
3. **品質の磨き込み（未実施）**: 全商品が共通デモデータ（日本人人口）。**商品ごとの個別テーマ・実指標接続が未実施**（例 E-01 飲食出店は人口+所得+消費が要る）。pptx は全商品ほぼ同一15スライド。地図は概略海岸線・沖縄インセット未実装。XLSX は数式のみ（ネイティブ地図/チャートは要テンプレ/raw-OOXML）。
4. **構造化（作成済・2026-07-18）**: rule `.claude/rules/coconala-product-standards.md` + skill `/build-coconala-product`（`.claude/skills/product/build-coconala-product/`）+ agent `coconala-product-manager`（`.claude/agents/` + README Tier5 登録）+ memory `project_coconala_product_factory` を作成。正典 = rule + spec doc30 + `packages/product-factory/README.md`。恒久 workflow（CI）は未作成（生成は手動 CLI・必要になれば追加）。
5. **commit 判断**: 未コミット。docx(2)/web(1) は未対応スキップ。

## 次セッションへの注意

- 再生成は `npm run products:generate --workspace=@stats47/product-factory -- --all`（~10分・584M・`.local` 上書き）。単品は `--id <ID>`。
- 個別テーマ接続を進めるなら `src/data/load-ranking-values.ts`（R2リーダ）で実指標を snapshot 化 → `resolveDataset`（`build-all.ts`）を商品→テーマ写像に拡張。
