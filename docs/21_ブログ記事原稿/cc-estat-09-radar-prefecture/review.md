---
slug: cc-estat-09-radar-prefecture
reviewer: blog-critic
mode: expert
verdict: PASS
date: 2026-06-21
---

## 評価サマリ

Claude Code 実例集 Part 9（レーダーチャート × 複数指標正規化）のチュートリアル記事。前回 REVISE の唯一の MAJOR（完成レーダー SVG が 0 枚）は解消された。Step 4 直下に東京 vs 京都の 2 県オーバーレイ radar SVG が実データで 1 枚埋め込まれ、SSOT 系譜（`tokyo-kyoto-radar.json` + `.source.json` + `.svg`）が揃い、dark mode CSS・role/aria-label・方法 A（軸ラベルに全国 min〜max 併記）も適用されている。SVG の polygon 座標は JSON の正規化値から再計算した値と完全一致し、JSON の生値・順位は R2 SSOT（income 東京6211/rank2・京都5316/rank30、crime 東京89098=全国最多/2023）と一致する。本文の中核ナラティブ（東京は人口1位・年収2位で張り出し、刑法犯全国最多で治安軸がえぐれる／京都は治安軸が外へ伸びる）は確定値で裏が取れている。年次バラつき（人口2024/年収2019/教育費2022/医療費2022/犯罪2023/観光2014）は WARNING callout で `axisMeta` と一致した形で誠実に開示。内部リンク 8 本はすべて本番 200。読者価値・series 一貫性ともに公開水準に達した。

## 指摘

- [MINOR] **Step 2 の架空例と Step 4 の実データが教育費軸で食い違う。** Step 2（説明用の架空例）は東京の教育費を 24,500円/0.92 と「外に張り出す」前提で語るが、実 SVG では東京の教育費は rank 36（norm 0.294）で、Step 4 の散文は正しく「両県とも中位どまり／大都市＝全項目で強いという思い込みが崩れる」と書く。両者は「例」「確定値」と明示ラベルされており欺瞞ではないが、教育系の説明用シェイプが実結果に否定される構図は読者の軽い混乱を招きうる。任意改善: Step 2 の例示の教育費を「実は大都市でも高くない指標もある」と一言で実データ側へ橋渡しすると、架空→確定の落差が学びに転化する。公開を止める性質ではない。

- [MINOR] **gate の VALUE_MISMATCH 3 件は設計上の false-positive。** value detector が Step 2 の意図的な架空例数値（5,780千円・24,500円・18,700円）を実 SVG の ground-truth と比較して「乖離」を出すが、本文は「数値はいずれも記事のロジック説明用の例です」+ [!NOTE] で架空例であることを明示しており、要確認 warning は許容。修正不要（警告止まり、blocker ではない）。

## 判定理由

前回 REVISE の MAJOR（視覚化チュートリアルに完成ビジュアルが無い／`data/` 空）は、実データ由来・SSOT 系譜付きの radar SVG 1 枚の追加で解消。数値・順位・年次は R2 SSOT と突合して一致、SVG は JSON から決定的に生成され座標も検証済み、内部リンクは全数 200。意味的品質（curiosity gap の真正性・解釈の厚み・callout の情報量・ですます調の一貫性・図表非重複）はいずれも基準を満たす。残る指摘は 2 件とも MINOR（架空例と実データの教育費軸の食い違いは両方ラベル済みで非欺瞞、gate warning は設計上の false-positive）で、読者を誤認させる致命傷ではない。BLOCK / MAJOR は無いため PASS。
