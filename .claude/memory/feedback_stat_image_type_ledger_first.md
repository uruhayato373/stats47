---
name: feedback_stat_image_type_ledger_first
description: 統計の画像は描く前に型の台帳 image-templates.json で型を引く。商品の見本画像も例外にしない (2026-11-10 オーナー指摘)
metadata:
  node_type: memory
  type: feedback
  originSessionId: 2c507bfa-546a-4c3b-8edf-b225f67160d8
  modified: 2026-11-10T05:23:34.841Z
---

統計の画像 (棒・地図・推移・内訳・ファイルの中身の見本) を作るときは、描く前に `data/content-operations/image-templates.json` で型を引き、その型の描画器 (`packages/svg-builder` / バズマップ / `apps/admin/lib/template-*`) で描く。台帳に無い形が要るなら、型を足すかをオーナーに先に聞く。使い捨ての d3 スクリプトで描かない。

**Why:** 2026-11-10、note のデータ商品の見本画像 7 枚を使い捨てスクリプトで描き、台帳に無い形 (ツリーマップ・CSV の中身) と、棒の型の決まり (上位5・下位5のカード) に反する棒を作った。「統計の図は全媒体で同じ型から」という決まりは `generate-note-charts` の SKILL (モデルからは呼ばれない) と paths 付きの rule にしか無く、商品の記事の本文画像の検査 (`build-note-figure-ledger.mjs` の `product-sample`) は値も型も見ずに通す。既存の見本画像 (sample-top10・sample-file-head) も手描きだった。

**How to apply:** 画像の依頼を受けたら、最初の手順で台帳を読み、各画像に型の id を割り当ててから描く。地図は境界データの出所 (バズマップは N03、商品は国勢調査の境界) も型と一緒に確かめる。関連: [[feedback_no_feature_specific_components]] [[project_note_image_assets_contract]]
