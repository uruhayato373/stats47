# ブログチャート出典 (source.json) 再取得可能性 (LATEST)

検査対象: 938 件 (source.json を持つチャート)

## 判定
- `restorable`: **850**
- `out-of-scope`: **65**
- `self-declared-incomplete`: **14** ← 欠陥
- `missing-reference`: **5** ← 欠陥
- `dead-estat-reference`: **4** ← 欠陥

**欠陥計: 23 件**

## 判定の意味
- `restorable` — kind ごとに必要な参照があり、参照先 rankingKey も R2 に実在する
- `out-of-scope` — `kind: "authored"` (記事本文由来)。SSOT 指標ではないので再取得不能が正しい
- `self-declared-incomplete` — source.json 自身が `incomplete: true` で「出自不明」と申告している
- `missing-reference` — kind が要求する参照フィールドが無い
- `dead-reference` — 参照している rankingKey が R2 に存在しない (指標の廃止/改名)
- `dead-estat-reference` — 参照している statsDataId が e-Stat API で取得できない
- `unknown-kind` — 語彙のドリフト。`.claude/scripts/lib/chart-provenance.mjs` の共有定義に追加する

## 欠陥一覧
- `self-declared-incomplete` cc-estat-17-edu-slope-graph/slope-structure-timeseries (kind=line) — 出自(rankingKey/derived)が data json に無い。fetch-ranking-data-r2 か backfill-source で SSOT を補完すること
- `self-declared-incomplete` communication-cost-burden/comm-cost-trend (kind=line) — 出自(rankingKey/derived)が data json に無い。fetch-ranking-data-r2 か backfill-source で SSOT を補完すること
- `self-declared-incomplete` depopulation-area-medical-facilities/depopulation-medical-prefecture-rankings (kind=ranking) — 出自(rankingKey/derived)が data json に無い。SSOTを特定して補完すること
- `self-declared-incomplete` extreme-heat-days-prefecture/hokkaido-kumamoto-timeseries (kind=line) — 出自(rankingKey/derived)が data json に無い。fetch-ranking-data-r2 か backfill-source で SSOT を補完すること
- `missing-reference` ict-media-consumption-gender-gap/media-gender-gap-map (kind=derived) — 再取得に必要な参照または計算式が無い
- `dead-estat-reference` inbound-by-nationality-regional-preference/korea-guest-map (kind=estat) — e-Stat API で取得できない statsDataId: 000040199338
- `dead-estat-reference` inbound-by-nationality-regional-preference/taiwan-guest-map (kind=estat) — e-Stat API で取得できない statsDataId: 000040199338
- `dead-estat-reference` inbound-by-nationality-regional-preference/nationality-composition-top15 (kind=estat) — e-Stat API で取得できない statsDataId: 000040199338
- `dead-estat-reference` inbound-by-nationality-regional-preference/usa-guests-ranking (kind=estat) — e-Stat API で取得できない statsDataId: 000040199338
- `missing-reference` inbound-overnight-stay-concentration/foreign-guest-ratio-map (kind=derived) — 再取得に必要な参照または計算式が無い
- `self-declared-incomplete` international-cooperation-volunteer-map/volunteer-rate-ranking (kind=bar) — 出自(rankingKey/derived)が data json に無い。fetch-ranking-data-r2 か backfill-source で SSOT を補完すること
- `self-declared-incomplete` it-establishments-prefecture/it-establishments-prefecture-national-trend (kind=line) — 出自(rankingKey/derived)が data json に無い。fetch-ranking-data-r2 か backfill-source で SSOT を補完すること
- `self-declared-incomplete` nurse-income-prefecture-gap/nurse-favored-prefecture-rankings (kind=ranking) — 出自(rankingKey/derived)が data json に無い。SSOTを特定して補完すること
- `self-declared-incomplete` physical-therapist-income-prefecture-gap/profession-prefecture-rankings (kind=ranking) — 出自(rankingKey/derived)が data json に無い。SSOTを特定して補完すること
- `missing-reference` prefectural-debt-future-burden/burden-score-tilemap (kind=derived) — 再取得に必要な参照または計算式が無い
- `self-declared-incomplete` prefecture-salary-remote-gap/prefecture-salary-remote-gap-national-trend-timeseries (kind=line) — 出自(rankingKey/derived)が data json に無い。SSOTを特定して補完すること
- `self-declared-incomplete` public-phone-count/public-phone-count-trend-timeseries (kind=line) — 出自(rankingKey/derived)が data json に無い。SSOTを特定して補完すること
- `self-declared-incomplete` retail-establishments-by-prefecture/retail-establishments-density-prefecture-rankings (kind=ranking) — 出自(rankingKey/derived)が data json に無い。SSOTを特定して補完すること
- `missing-reference` road-infrastructure-density/road-summary-findings (kind=manual) — 再取得に必要な参照または計算式が無い
- `missing-reference` software-engineer-income-gap/software-engineer-income-national-trend (kind=estat) — 再取得に必要な参照または計算式が無い
- `self-declared-incomplete` welfare-expenses-squeeze/welfare-civil-edu-trend (kind=line) — 出自(rankingKey/derived)が data json に無い。SSOTを特定して補完すること
- `self-declared-incomplete` welfare-expenses-squeeze/welfare-expenses-ranking (kind=bar) — 出自(rankingKey/derived)が data json に無い。fetch-ranking-data-r2 か backfill-source で SSOT を補完すること
- `self-declared-incomplete` welfare-expenses-squeeze/welfare-per-capita-ranking (kind=bar) — 出自(rankingKey/derived)が data json に無い。fetch-ranking-data-r2 か backfill-source で SSOT を補完すること

真実源: `.claude/state/blog/chart-provenance-queue.json` / 正典: `.claude/rules/blog-data-schema.md §1.5`
