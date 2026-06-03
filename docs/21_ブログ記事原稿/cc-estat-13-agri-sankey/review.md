---
slug: cc-estat-13-agri-sankey
reviewer: blog-critic
mode: expert
verdict: PASS
date: 2026-06-03
---
## 評価サマリ
e-Stat チュートリアル第13弾として「サンキーダイアグラムの実装」という技術的主題に絞った記事。読者価値は「Claude Codeに分類軸を提案させる」という具体的なワークフローにあり、単なる実装手順の羅列に留まらず設計判断の分業（AI提案→人間判断）という視点が明確。NOTE/WARNINGの2 calloutはいずれも読者が実装前に知るべき実質的な情報（スケール感の把握と二重カウント防止）を含む。data/cc-estat-13-agri-sankey-prefecture-rankings.json と記事本文の数値（北海道1,347,800百万円、鹿児島543,800、茨城453,600、東京22,000、大阪32,000、約61倍差）は完全一致。全国合計9.5兆円に対して「9兆円規模」の表現も許容範囲。内部リンクは/areas/13000と/category/agricultureの2本に留まる点はやや薄いが、チュートリアル記事の性格上（ランキング記事と異なり数値羅列ではない）、/ranking/へのsource-linkがなくても読者体験を損なわない合理的な判断と評価できる。インライン`<svg>`なし、chart-placeholderなし。

## 指摘
- [minor] 内部リンクが2本（/areas/13000・/category/agriculture）のみ。チュートリアル記事でも農業産出額ランキングへの`<source-link>`を1本追加することで、実データに触れた読者が次のアクションを取りやすくなる
- [minor] Step 5のコードブロック内に `![チャート](data/inline-chart-1.svg)` というマークダウン画像参照がコード片として混入しているが（TSXコンポーネントのreturn文の代替表記と思われる）、レンダリング上はコードブロック内のため問題なし

## 判定理由
BLOCKERに相当する指摘なし。数値はdata JSONと完全一致。calloutは実質的内容を持つ。チュートリアル記事としての読者価値（AI分業ワークフロー・id重複の罠・mass conservation検証）は十分。
