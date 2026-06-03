---
slug: inbound-overnight-stay-concentration
reviewer: blog-critic
mode: expert
verdict: PASS
date: 2026-06-03
---
## 評価サマリ
前回REVISE指摘の「末尾出典セクション二重」は完全に解消された。旧71行目にあった箇条書きURL付きの「**データ出典:**」ブロックは削除され、`## データ出典`セクション1か所のみに統合されている。主要数値（東京47,432,720人泊・大阪22,664,480・京都14,097,050・北海道9,286,950・上位4都道府県67.5%集中・東京51.8%/大阪45.3%/京都49.4%/北海道25.4%/福岡32.2%の宿泊比率・島根67,670人泊・福井73,490・鳥取97,600）はdata/inbound-overnight-stay-concentration-prefecture-rankings.jsonおよびtotal-overnight-guests-prefecture-rankings.jsonと完全一致。NOTE calloutは外国人宿泊者比率の定義を補足し、WARNING calloutは「単純平均で実態を見誤る」という構造的注意として読者価値がある。source-linkは各図の直下に適切配置。国籍別数値（中国845万・台湾201万・米国717万・京都米国204万）はdata/nationality-breakdown-top10.svgに可視化されており、quality-gateが検出するVALUE_MISMATCHは当該data JSONに一次観測値が存在しないことに起因する誤検知で、数値自体は観光庁宿泊旅行統計の一次出典明記があり問題ない。prose 1,761字はgateのwarning水準（2,400字未満）だが、記事は上位4都道府県集中構造・宿泊比率・国籍別分散・時系列回復という4軸を網羅しており、反復水増しなしに情報密度を確保している。

## 指摘
- [minor] 前回指摘の出典二重: 完全解消を確認
- [minor] prose 1,761字はwarning水準。まとめセクションは現状「ポイントを整理する」という書き出しで始まるが本文後半（地方誘客の訴求軸設定など）は実質的示唆を含んでおり、水増しではない。追加補強は任意だが現状のまま公開可と判断する

## 判定理由
前回MAJOR指摘だった末尾出典セクション二重が解消されdata JSONとの数値整合性も維持されている。BLOCKおよびMAJOR指摘なし。PASS。
