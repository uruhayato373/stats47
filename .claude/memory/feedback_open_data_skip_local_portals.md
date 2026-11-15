---
name: feedback-open-data-skip-local-portals
description: 特定の市や県だけのオープンデータ (横浜・東京・大阪のポータル等) は取得・展開の対象から外してよい
metadata:
  node_type: memory
  type: feedback
  originSessionId: d9226237-6147-499c-8c22-aa6dc38b033f
  modified: 2026-11-15T00:16:42.023Z
---

e-Stat 外オープンデータの取得・展開では、特定の都市や都道府県だけが出すオープンデータ (自治体のポータル・カタログ) は飛ばしてよい。

**Why:** オーナー判断 (2026-11-15、OPENDATA-ARCHIVE-01 の実取得中)。「特定の都市や都道府県のオープンデータは扱いにくい」。47 県・全市区町村を同じ形で並べるサイトの用途に合わない。

**How to apply:** 国の機関が全国一律に出すデータを優先する。自治体単独のデータセットは recipe を `skip` にして理由を書き、正規化・展開の候補にも挙げない。全国を網羅する国の配布物が市区町村別ファイルに分かれているもの (国交省の都市計画 GIS など) はこの対象ではない (Claude の解釈)。関連: [[project_estat_expansion_pipeline_2026_07]]
