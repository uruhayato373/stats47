---
slug: bank-deposit-balance-shikoku-anomaly
reviewer: blog-critic
mode: expert
verdict: PASS
date: 2026-06-03
---
## 評価サマリ
前回 REVISE の blocker「徳島県の県民所得は中位グループ」が完全に解消された。article.md 78行目は「徳島県の県民所得は301.3万円で、全国9位の上位グループ」に修正されており、data/per-capita-kenmin-shotoku-h27-prefecture-rankings.json（徳島county rank=9、value=3013）と完全一致する。記事の論点も修正後は整合している——「所得でも上位（rank9）にありながら預金残高ではさらに3位（rank3）と、所得順位を大きく上回る」という逆転の驚きは、データで正確に裏付けられた curiosity gap になっている。主要数値の全件照合: 東京2,641.1万円(rank1)・大阪937.5万円(rank2)・徳島790.7万円(rank3)・愛媛696.4万円(rank4)・香川695.4万円(rank5)・神奈川569.2万円(rank15)・千葉584.2万円(rank13)・福岡582.3万円(rank14)・鹿児島379.3万円(rank47)・7倍差、すべてデータと一致。愛媛の県民所得247.1万円(rank43)も正確。callout 4本（[!NOTE]指標定義・[!WARNING]読み違え注意・[仮説]タグ付き構造仮説・[!TIP]家計調査との使い分け・[!NOTE]年次相違の注意）はいずれも読者価値あり。source-link 2本はセクション内に配置されており末尾集約はない。内部リンク（/areas/13000・/ranking/avg-savings-rate-worker-households・/ranking/consumption-expenditure-multi-person-households-per-month・/ranking/per-capita-kenmin-shotoku-h27）で基準を充足。論理展開「分母（人口）が小さく分子（預金）が維持される」は一貫しており、読者が統計の仕組みを正確に理解できる構成になっている。
## 指摘
- [minor] 前回指摘「愛媛の所得は低め（rank43）だが預金4位——徳島との並列構成に整合が必要」は、修正後の記事では両者を並列して「所得が高くない→預金が多い謎」というコントラストとして扱うのをやめ、徳島は「所得も高い（rank9）のにさらに預金が高い（rank3）」という逆転として、愛媛は別の文脈（「所得rank43と低めだが預金rank4」）として独立させている。これで論理的矛盾は解消されている。特に追加修正は不要。
- [minor] [仮説]タグが付いた段落で「(a) 人口規模が小さく分母が効きやすいこと、(b) 地場金融機関への預金集中度が高いこと」の2要因を仮説として挙げているが、本記事のデータだけでは検証不可能である旨が明記されており、誠実な留保として問題ない。
## 判定理由
前回 REVISE の blocker「徳島の所得は中位グループ」がdata照合済みで完全解消（9位→上位グループに修正）。記事全体の数値・順位に blocker/major 指摘なし。verdict: PASS。
