---
name: feedback-test-and-ci-wait-budget
description: 開発中は vitest related で触った範囲だけ回し、web の全件 (約10分) は develop へ入れる直前の 1 回。CI は push 後に待たずに次へ進む (2026-10-28 に全件 4 回・CI 待ち 3 回で「開発の速度が遅くなっていないか」と指摘)
metadata:
  type: feedback
---

**事象 (2026-10-28)**: 見本合わせ・詳細パネル・開発サーバーの修正で、web の vitest 全件 (2,762 件・2 並列で約 10 分) を develop へ入れる前に
毎回 (計 4 回) 回し、develop の CI (6〜10 分) は別セッションの push で 3 回取り消されて、そのたびに結果を待って作業を止めた。
オーナーから「CI とかテストとかが長すぎて開発の速度が遅くなってないだろうか」と指摘された。

**Why:** 待ちの間は何も進まない。全件と CI は確認の最後の網で、開発中の確認は触った範囲で足りる。

**How to apply:**
- 開発中は `npx vitest run --related <変更したファイル>` (または対象ディレクトリ) だけを回す
- web の全件は develop へ入れる直前に 1 回 ([[feedback-run-full-web-tests-before-push]] の「push 前に全件」はこの 1 回を指す)
- push したら CI を待たずに次の作業へ進み、節目でまとめて結果を見る。取り消されたら新しい実行だけを見る
- 本番ビルドも節目に 1 回 ([[feedback-batch-production-builds]])
