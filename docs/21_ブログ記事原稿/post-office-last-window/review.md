---
slug: post-office-last-window
reviewer: blog-critic
mode: expert
verdict: PASS
date: 2026-06-03
---
## 評価サマリ

前回 REVISE の原因だった SVG 不在（`post-office-ranking.svg` / `post-office-map.svg` / `post-vs-mobile.svg` の 3 本）は、ローカル欠落に起因するものであり、今回 data/ への mirror 完了により全ファイルの実在を確認した。また、article-writer が「欠落」と誤認して追加した SVG は存在せず、チャートの重複は発生していない。data/ に存在する `post-office-last-window-prefecture-rankings.svg` 等は記事本文から参照されておらず、article.md が参照するのは 3 本のみで一対一に対応する。

記事の読者価値は充実している。「可住地面積あたりの密度が都市部に集中するが、人口あたりに換算すると逆転する」という視点の反転は、単純なランキング羅列ではなく思考を誘う構造として機能している。「郵便局密度 × 携帯電話契約数の散布図」で二重インフラ不足地域を特定するアプローチは、データから意味ある発見を導く好例である。岩手県西和賀町の民間銀行撤退事例は地方郵便局の「最後の窓口」機能を具体化しており、定性論を事実で支えている。callout は NOTE（可住地面積の定義）・WARNING（二重不足の限定性）・TIP（代替施設の有無の視点）と 3 種を適切に配置。内部リンク 3 個、source-link は各図直下に分散配置されており、品質基準に準拠している。prose 文字数 2225 字はやや短く warning 水準だが、内容の密度は十分であり水増しは見当たらない。curiosity gap「郵便局もデジタルも届かない地域」はタイトルと本文が一致しており釣りではない。

## 指摘

- [minor] prose charCount 2225 字はやや短い（2400 字 warning 閾値未満）。二重不足地域（青森・鳥取・島根）の具体的な数値説明か、人口あたり逆転の定量例（北海道の人口あたり順位）を追記すれば読者価値が増す。必須ではないが余地あり。

## 判定理由

前回 REVISE の blocker だった「SVG 参照パスと実在ファイルの不一致」は、ローカル mirror 欠落が原因であり、R2 上の実在 SVG が docs/data/ に反映された今回は完全に解消された。article-writer による誤認追加チャートの重複もなし。quality-gate は callout 3 個・内部リンク 3 個・チャート 3 本・NG パターンなし・truncated 表なし・chart-placeholder なし・in-article 関連セクションなし、すべてクリア。prose が 2225 字でやや短い warning は残るが、内容密度・論理構造・curiosity gap の真正性はいずれも基準を満たしており、意味的品質として PASS と判定する。
