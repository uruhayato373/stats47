---
name: feedback-commit-in-batches
description: 見た目の確認を重ねている途中は修正ごとにコミットしない。まとまりで 1 回にする
metadata:
  node_type: memory
  type: feedback
  originSessionId: eb4958fe-f37c-428f-bbfd-1dd7c7637ab6
  modified: 2026-11-05T06:04:48.814Z
---

オーナーの確認で修正を重ねている間は、変更ごとにコミットと push をしない。作業ツリーに置いたまま確認を続け、まとまりが決まってから 1 回コミットする。

**Why:** 2026-11-05 に型の見本を直すたびにコミットしていたら「毎回コミットはいらない」と指摘された。この Windows PC は pre-commit に 10 分以上かかり、待ち時間も無駄になる。

**How to apply:** オーナーが見た目や方針を確認している間は、作業ツリーの見本と確認画面で進める。節目 (方針の確定・全件反映の前・セッションの区切り) にまとめてコミットする。未コミットの作業があることは報告に書く。[[no-deploy-per-iteration]] の考え方と同じ。
