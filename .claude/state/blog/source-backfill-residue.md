# source-backfill 残 23 枚のトリアージ (2026-06-20 更新)

決定的に救済できたものは反映済 (系譜 both 246/612 = 40.2%)。残り 23 は判断/取り込みが要る。
`chart-author` agent が消化する worklist。判定再生成: `node /tmp/triage-incomplete.mjs`。

## ✅ 決定的に解決済 (このバッチ・参考)
- scatter 軸不足: `rent-floorarea`(y=floor-area-per-dwelling-owner) / `fiscal-fertility`(fiscal-strength-index×total-fertility-rate) / `tertiary-unemployment`(employed-people-ratio-tertiary×unemployment-rate) → `resolve-scatter-axes.mjs`
- flat スケール: `salary-remote-gap-rankings` = avg-salary-all-prefecture ÷10000 (万円表記) → 同上 FLAT_CONFIG
- 自動照合 10 枚 (cpi-*/sunshine/vacant 等) → `backfill-source.mjs`

## ① 真の派生 (÷人口・÷面積など) — kind:derived。記事の式で再計算→自己検算 (残3)
raw key と 0% = 計算値。分子 raw key は実在。分母(人口/面積)で再計算し json 値と一致を確認してから kind:derived で書く。
- ✅ `local-tax-regional-gap/per-capita-local-tax` = local-tax-prefecture(千円) ÷ total-population × 0.1万円 → **10/10 一致で確定済** (`resolve-scatter-axes.mjs` DERIVED_CONFIG)
- 🟡 `welfare-expenses-squeeze/welfare-per-capita-ranking` (一人当たり民生費 万円) = 民生費 ÷ total-population × 0.1 で **7/11一致** (4県ズレ=年/分母の微差。agent が正確な年・分母を特定)
- ✗ `retail-establishments-by-prefecture/retail-establishments-density-prefecture-rankings` = retail ÷ 人口 ×10万 だが json の areaName 構造不良で 0/0 照合不能 (agent が json 構造を確認して再計算)
- `nurse-income-prefecture-gap/nurse-favored-prefecture-rankings` (相対厚遇度・順位差) = 記事本文の式が要る (順位差系)

## ② authored / 全国系列 — kind:authored or timeseries (記事固有・県rankingKey無し) (9)
全国推移 or 全国平均比較。県別 rankingKey に縛れない。source は記事 + 全国統計源を記録 (verified照合は不要)。
- 全国 line trend (8): `it-establishments-national-trend` / `low-birthweight-timeseries` / `minimum-wage-trend` /
  `salary-remote-gap-national-trend` / `public-phone-count-trend` / `software-engineer-income-national-trend` /
  `welfare-civil-edu-trend` / (prefecture-salary national系)
- 全国3職種比較 (1): `engineer-vs-professions-income/profession-income-comparison` ・ `physical-therapist.../profession-prefecture-rankings`(n=3全国平均) ・ `income-1000man/profession-income-1000man`

## ③ 複数系列ランキング — 各系列を別 rankingKey に対応 (2)
- `prefectural-income-gdp-ranking/{income-ranking,gdp-ranking}` = per-capita-kenmin-shotoku / total-production-in-the-prefecture (記事リンク済・要 scale/年確認)

## ④ semiconductor (derived scatter) (1)
- `semiconductor-electronics-regional-map/semiconductor-dependency-scatter`: x=manufacturing-shipment-amount(兆円スケール) / y=半導体依存度(電子部品出荷額2020÷製造品出荷額2023、note に式) → kind:scatter, x verified + y derived(formula)

## ⑤ 未取り込み metric — e-Stat 取り込みが先 (指標バックログ済) (3)
- `nurse-income-prefecture-gap/nurse-vs-govwage-scatter` x=地方公務員 平均給与月額(一般) ← 教育公務員(avg-salary-education-prefecture)しか無い。一般地方公務員給与は未取込
- `depopulation-area-medical-facilities/depopulation-medical-prefecture-rankings` (記事リンク0・orphan)
- `international-cooperation-volunteer-map/volunteer-rate-ranking` (volunteer-activity-international-cooperation-15plus ✗404)
→ `estat-researcher`→`data-ingester` で取り込み後 backfill 再走。

---
正典: `.claude/rules/blog-data-schema.md §1.7`。別件データバグ(marriages/divorces)は `.claude/todo/backlog.md §D`。
ツール: `backfill-source.mjs`(自動照合) / `resolve-scatter-axes.mjs`(軸明示+scale) / `build-lineage-queue.mjs`(再棚卸し)。
