---
name: feedback-reference-ui-measure-live
description: 見本の UI の URL を渡されたら、実物のデモを開いて computed style (角丸・余白・フォント・色) を測ってから設計する。似た公式テンプレートで代用しない (2026-10-27 に 2 度指摘)
metadata:
  node_type: memory
  type: feedback
  originSessionId: f2ff6383-5b9c-49fb-a0c6-169e88a91580
  modified: 2026-10-27T06:45:14.489Z
---

**事象 (2026-10-27)**: 管理画面を shadcndashboard.dev にそろえる依頼で、見本の実物を開かず shadcn 公式の `dashboard-01` を正本にして作り直した。
オーナーから「全然ちがう・配色もちがう」「カードのラウンドや余白・フォントも違う」と 2 度指摘された。
実物 (demos.shadcndashboard.dev) を測ると、カードは角 0・1px 線の格子・Geist・単色のチャート・見出し行に下線で、dashboard-01 (角丸・グラデーション・多色) とは別物だった。

**Why:** 見本の名前やリポジトリの説明 (「shadcn/ui 製」) から中身を推測すると、同じ部品集でもスタイル (Nova / Lyra 等) と並べ方の違いを取りこぼす。オーナーが見ているのは画面そのもの。

**How to apply:**
- 見本の URL があれば、最初にブラウザで実物 (デモ) を開き、`getComputedStyle` で角丸・余白・フォント・色・表の見出し・サイドバーの選択色を実測し、表にしてから設計する
- 無料版のリポジトリや公式ブロックは「実装の手がかり」に留め、見た目の正本にしない
- 見本は台帳 `data/design-references/references.json` に 1 件足し (URL・採否と理由・撮影 `assets/design-reference/<id>/<日付>/`・反映先)、管理画面「サイト > 参考サイト」で共有する。実測値は `docs/01_技術設計/04_デザインシステム.md`「見本の実測値と部品の仕様」に書き、担当 agent にも渡す
- 関連: [[feedback-agent-output-contract]]
