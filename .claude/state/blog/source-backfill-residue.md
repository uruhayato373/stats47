# source-backfill 残 27 枚のトリアージ (2026-06-20)

`backfill-source.mjs`(scatter 2軸 + 全chartType照合 + 0.95精度ガード)で **10/37 を verified 化**(R2 反映済)。
残り 27 は決定的照合で当たらず = 出自特定に判断/取り込みが要る。`chart-author` agent が消化する worklist。

判定: `node /tmp/triage-incomplete.mjs`(再生成可。article /ranking/ リンク × SSOT値照合)。各バケツの復元方針:

## ① 派生ランキング (6) — kind:derived、式の特定が要る
key は実在するが json 値が raw key と 0% 一致 = density/per-capita/favored/gap の計算値。記事本文から式を読み取り、
分子/分母 metric を SSOT から再計算して自己検算 → 一致すれば kind:derived の source.json を verified 化。
- `prefecture-salary-remote-gap/...-prefecture-rankings` (avg-salary-all-prefecture を加工)
- `local-tax-regional-gap/per-capita-local-tax` (local-tax-prefecture ÷ 人口)
- `welfare-expenses-squeeze/welfare-per-capita-ranking` (welfare-expenditure-ratio... 加工)
- `nurse-income-prefecture-gap/nurse-favored-prefecture-rankings` (nurse-annual-income を生活費調整?)
- `physical-therapist-income-prefecture-gap/profession-prefecture-rankings` (physical-therapist-annual-income 加工?)
- `retail-establishments-by-prefecture/retail-establishments-density-prefecture-rankings` (retail-establishments ÷ 面積/人口)

## ② line/national 時系列 (8) — series 構造。authored か line専用照合
flatMap 0件 = `{series:[...]}` 構造。全国 or 複数県の時系列。raw rankingKey に縛らず、source は記事リンク + 系列定義。
- it-establishments-national-trend / low-birthweight-timeseries / minimum-wage-trend
- prefecture-salary-remote-gap-national-trend / public-phone-count-trend
- software-engineer-income-national-trend / welfare-civil-edu-trend
- (※ `backfill-source.mjs` の jsonValueMap は series 最新年のみ拾う。national単系列は県照合不可 → kind:authored/timeseries で source 化)

## ③ scatter 軸不足 (5) — 欠けた軸 key の特定
片軸は記事リンクで一致、もう片軸の metric が記事にリンクされていない → 全 active key から欠軸の値で探索が要る。
- `housing-cost-livability-trend/rent-floorarea-scatter` x=100%(rent) / y=床面積 key 未特定
- `nurse-income-prefecture-gap/nurse-vs-govwage-scatter` y=100%(nurse) / x=公務員給与 key 未特定
- `fertility-fiscal-nexus/fiscal-fertility-scatter` / `unemployment-tertiary-industry-link/tertiary-unemployment-scatter` / `semiconductor-electronics-regional-map/semiconductor-dependency-scatter`

## ④ 複数系列比較 (4) — grouped 構造
- `engineer-vs-professions-income/profession-income-comparison` (複数職種を並置)
- `prefectural-income-gdp-ranking/{income-ranking,gdp-ranking}` (2 metric)
- `income-1000man-which-prefecture/profession-income-1000man`

## ⑤ 未取り込み metric (4) — e-Stat 取り込みが先 (指標バックログ済)
- `depopulation-area-medical-facilities/depopulation-medical-prefecture-rankings` (記事リンク 0・orphan)
- `international-cooperation-volunteer-map/volunteer-rate-ranking` (volunteer-activity-international-cooperation-15plus ✗404)
→ `estat-researcher` → `data-ingester` で取り込み後に backfill 再走。

---
正典: `.claude/rules/blog-data-schema.md §1.7`。系譜 both 242/612 (39.5%)。
別件のデータバグ(marriages/divorces 値誤り)は `docs/02_実装計画/05_指標バックログ.md §D`。
