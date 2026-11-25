---
name: feedback-removed-source-silent-fallback
description: データの出どころ (列・台帳) を消すときは読み手を同じ差分で消す。空のときの代わりの文字が壊れ方を隠す
metadata:
  node_type: memory
  type: feedback
  originSessionId: 77a238b7-91f8-4138-a774-7550aeeee377
  modified: 2026-11-25T12:11:19.335Z
---

データの出どころを消すときは、その項目を読む箇所を検索し、同じ差分で読み手を消すか、別の出どころにつなぎ直す。表示名を `|| "総数"` のような代わりの文字で埋めない。名前が無い状態は台帳の検査で落とす。

**Why:** 2026-11-21 にローカル SQLite を廃止した際、`normalization_basis`・`demographic_attr` 列だけが値の出どころだった。型 `RankingItem` には任意の項目として残り、ランキング詳細の下段のボタンは `normalizationBasis || "総数"` で名前を作っていた。そのため型検査もテストも通ったまま、全ランキングでボタンが「総数・総数・総数」になった。本番で 4 日間気づかず、オーナーの目視で 2026-11-25 に発覚した。

**How to apply:** 列・台帳・生成工程を消す PR では `grep -rn <項目名>` で読み手を列挙する。空でも描画が成り立つ読み手 (代わりの文字・`?? null`・`filter(Boolean)`) を特に疑う。根本対応 (型から項目を消し、組み立ての `satisfies Record<keyof RankingItem, …>` で誰も書かない項目を型検査で止める) はカード `RANKING-VIEW-CONSOLIDATE-FOLLOWUP-01` の ①。関連: [[feedback-hand-synced-duplication]] [[feedback-check-why-removed-before-reviving]]
