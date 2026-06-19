---
name: SNS 競合検索はテーマ別名乗りも併走必須
description: SNS 競合を検索するときに「統計／ランキング」キーワードだけに絞らず、テーマ起点で都道府県別を切る他の名乗り（リスク／格差／ご当地／怖い／お得 等）も併走で検索する
type: feedback
originSessionId: c8417f1f-0b16-4d1a-afe9-f4b7fa18c5a6
---
SNS 上の都道府県別ランキング系競合を調査するとき、検索クエリを汎用語（「統計」「ランキング」「都道府県別」）だけに絞ると、テーマ起点で運用されている直接競合を取りこぼす。

**Why:** 2026-04-27 の競合調査で、Web の上位 3 社（todo-ran / uub / ssds）と SNS の自治体公式観光アカウントを発見した一方、Instagram + TikTok で 1 リール 1-2 万いいねを叩いている @riskmap.jp（日本リスクマップ）を完全に取りこぼした。riskmap.jp は「リスクマップ」名義で運用しているため「統計」「ランキング」キーワードに引っかからない。ユーザー指摘で発覚し、ホワイトスペース仮説を撤回するに至った。

**How to apply:**
- 競合調査の WebSearch クエリ初期セットに、必ず「テーマ起点の名乗り候補」を含める
  - リスク／治安／災害／怖い／心霊
  - 格差／ワースト／ベスト／意外
  - ご当地／県民性／出身地
  - お得／コスパ／高い／安い
- WebSearch だけでなく Instagram / TikTok / YouTube の検索ページも見る（JS 描画で WebFetch 困難なら API キー or 手動確認）
- 「いない」と断定する前に、最低 5 種類のテーマ系名乗りを試す
- 関連: [project_competitor_riskmap_jp.md](project_competitor_riskmap_jp.md), [Issue #143](https://github.com/uruhayato373/stats47/issues/143)
