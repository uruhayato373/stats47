---
slug: manufacturing-shipment-prefecture-ranking
reviewer: blog-critic
mode: expert
verdict: PASS
date: 2026-06-14
---
## 評価サマリ
製造品出荷額(総額)の地理集積に専念した archetype A 記事。前回 REVISE の主因だった姉妹記事 manufacturing-labor-productivity-pref との重複が解消されました。姉妹は「生産性/大分逆転/散布図(archetype B)」、本記事は「総額の地理集積/太平洋ベルト/愛知58兆の別格性(archetype A)」と切り口・主人公・型がデータ年次に依存せず独立しています。生産性逆転は要約1文(line68)に圧縮し source-link で姉妹へ送客、本文 H2 は総額ランキング→太平洋ベルトの背骨→下位の三点セット欠如→東京16位の脱工業化→規模と効率の別物、と地理構造の解明に一貫して重心が置かれています。各図直下にインライン source-link、callout は「平野＋港＋大都市」「出荷額≠産業の弱さ」「事業所所在地で計上」と記事固有の読み違い防止知識になっています。curiosity gap タイトル(愛知58兆/115倍/なぜ太平洋ベルト)は本文と一致し釣りではありません。
## 指摘
- [minor] 相関分析は本記事の主軸ではない(archetype A)ため散布図 SVG は不要。総額1図に集中する判断は妥当。
- [minor] quality-gate の VALUE_MISMATCH 11件はすべて「兆円↔百万円」「per-employee JSON の混入照合」による単位スケール誤検出で、data/shipment-ranking.json と本文値(愛知58.0兆=58,021,789百万・沖縄0.5兆=506,700・高知0.65兆・鳥取0.89兆・島根1.4兆・東京8.6兆=8,552,651・茨城15.0兆・top10順位)を手検証済み、実体的不整合なし(非blocker)。
- [minor] 公開時 criticReviewed:false は gate が .local/r2 配下の review.md を見るため。本 review(docs/21)を R2 同期すれば解消。
## 判定理由
(1)前回の重複が解消され姉妹(生産性)と切り口がデータ年次以外で独立、(2)archetype A 必須視点「なぜ上位/下位か(地理・産業構造)」を各図直下の厚い解釈段落(愛知=自動車集積圏/太平洋ベルト=臨海・平野・大消費地/下位=三点セット欠如/東京=脱工業化)で満たし単一指標記事として読者価値十分、(3)Wakayama 不整合除去済で全 rank/value が data と一致。決定的 gate は pass:true・blocker 0・callout4・内部リンク3・H2:6・prose3,218字・である調0・markdown表0。3軸すべて充足のため PASS とします。
