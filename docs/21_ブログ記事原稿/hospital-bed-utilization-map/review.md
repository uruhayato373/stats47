---
slug: hospital-bed-utilization-map
reviewer: blog-critic
mode: expert
verdict: PASS
date: 2026-06-03
---
## 評価サマリ
「病床は埋まっているか」という問いに対し、利用率・受療率・医師数の三角形で多角的に答える構成は読者価値が高い。curiosity gap「九州77% vs 東北71%の南北構造」は本文で地域ブロック表として実証されており釣りではない。callout 2個はいずれも実質的内容を持つ。[!NOTE]は算出方法・対象範囲（一般病院限定）・データ出典年を明示し、[!WARNING]は「低利用率=余裕」という単純解釈の誤謬を東北・北海道の文脈で正確に指摘、[!TIP]は高知の高床数×中位利用率という実例で「分子分母の分解」視点を具体的に補強しており埋め草ではない。数値訂正の確認: data/bed-utilization-rate-prefecture-rankings.json・general-hospital-bed-count-per-100k-prefecture-rankings.json・hospital-bed-utilization-map-prefecture-rankings.json を照合。1位佐賀81.5%・2位山口78.6%・3位福岡78.5%・4位沖縄78.4%・5位高知77.8%・47位福島64.9%はすべてデータと一致。比較表の佐賀病床数1,447.8床・福島1,047.5床はデータ一致、在院患者数佐賀1,179.9人・福島680.3人もデータ一致。地域ブロック別平均(九州77.0%・北海道東北70.8%・中国四国74.6%等)はデータから計算可能な値と整合する。内部リンクは /areas/39000・/ranking/avg-daily-inpatients-general-hospital-per-100k・/ranking/inpatient-rate-per-100k・/ranking/physicians-in-medical-facilities-per-100k・/category/socialsecurity など複数あり密度基準を満たす。
## 指摘
- [minor] 「データの読み方と限界」セクションの箇条書きは有益だが、読者が欲しい「では私の県は大丈夫か」への回答導線（特定県のランキングページへの source-link）が薄い。
- [minor] 医師数との相関図の「弱い正の相関」という表現は定量的根拠（相関係数等）なしの推測表現に近い。evidence-based-judgment.md の基準からは「[仮説]」タグ付けが望ましい。
## 判定理由
BLOCK・MAJOR 指摘なし。writer が追加・訂正した利用率・在院患者数・病床数の数値はすべてデータと一致。callout 実質的。地域構造の発見に読者価値あり。PASS。
