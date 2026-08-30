# GSC 改善ログ

GSC（Google Search Console）の継続的追跡と改善施策の記録。

> **2026-04-25**: 推測ベース判定の根絶ルール（`.claude/rules/evidence-based-judgment.md`）に基づく rewrite 後の新しい log。旧版は `archive/improvement-log-until-2026-04-21.md` 参照。

**運用ルール:**
- Append-only。過去エントリは改変しない
- 日付は絶対日付（YYYY-MM-DD）
- 数値はソース明示（例: 「URL Inspection 2026-04-25 取得 / `.claude/state/metrics/gsc/url-inspection/2026-04-25.csv`」）
- 施策とコミット hash をペアで記録
- snapshot ディレクトリは本ログと一緒にコミット
- **想定効果は必ず根拠を併記**（過去事例 / Google 公式ガイド / 計算式）
- **実測値は取得コマンドへのリンク併記**

## [RANKING-CTR-01] 「露出は伸びたのにクリックが伸びない」の切り分け (2026-08-21)

W30〜W33 の週次計画に 4 週連続で載りながら着手されていなかった切り分け。実行:
`node .claude/scripts/gsc/analyze-ctr-seesaw.mjs <週A> <週B>` / `--weekly`
(入力は `snapshots/*/{pages,daily}.csv`・ネットワーク不要・read-only)。

### 前提として直した集計の誤り: アンカー行

`pages.csv` には `#見出し` 付き URL が独立行として入る。W33 実測で **312 行・39,934 imp・
clicks 3 (CTR 0.01%)** で、これは page 次元の imp の **26%**。4 週で 19,598 → 39,934 (+104%) と
急増している (例: `/blog/convenience-store-density-map#まとめ` 等 4 変種で最新週 +1,766 imp・
clicks 0)。

**日付次元には含まれない。** 非アンカー合計 ÷ `daily.csv` 合計が W29〜W33 の 5 週とも
**104.4〜105.0%** で安定しており、page 次元だけがこの行を持つ。したがって
**アンカー行を除外せずに page 次元で CTR を出すと系統的に過小評価**になる。
除外前は blog の CTR を 1.90% と読んでいたが、除外後の実際は **3.26%** (ranking 3.80% と同水準)。

### 実測 1: 4 週スパンでは CTR は落ちていない (むしろ改善)

W29 (6/20-7/17) と W33 (7/17-8/13) は 28 日窓で重複 1 日 = 実質非重複。アンカー除外で:

| | imp | clicks | CTR |
|---|---|---|---|
| W29 | 96,898 | 2,922 | 3.02% |
| W33 | 111,622 | 3,634 | **3.26% (+0.24pp)** |

**増分だけの CTR は 4.84%** でサイト平均を上回る。面別でも blog 2.67%→3.26% (+0.59pp / clicks +513)、
ranking 3.87%→3.80% (-0.06pp)。**この期間に CTR を落とした面は無い。**

### 実測 2: 「落ちた」の実体は最高値からの反落

日次を全 snapshot から連結すると 148 日 (3/19〜8/13) の連続系列が作れる (`--weekly`)。

| 週 | clicks | imp | CTR | pos |
|---|---|---|---|---|
| 7/10-16 | 823 | 25,464 | 3.23% | 8.18 |
| 7/17-23 | 892 | 23,239 | **3.84%** | 8.08 |
| 7/24-30 | 912 | 26,816 | 3.40% | 8.12 |
| 7/31-8/06 | 866 | 25,293 | 3.42% | 8.12 |
| 8/07-13 | **930** | 30,995 | 3.00% | 7.79 |

**3.84% は 21 週の全期間で最高値**。3.00% は 5 月以降の常用帯 (3.0〜3.3%) の下端であり新安値ではない。
clicks 930 は期間最高。週次計画の「CTR -0.42pp」はこのピーク週を基準に取ったもの。

### 実測 3: 本物の問題は最新週の増分の質

隣接 snapshot の差は「入った週 − 出た週」になる。W32→W33 の差 = **(8/07-13) − (7/10-16)**:

- 非アンカーの増分 **+6,380 imp / +101 clicks = 限界 CTR 1.58%** (同週平均 3.26% の半分未満)
- 内訳: ranking +4,019/+74 (63%) / areas(県×テーマ) +793/+3 / areas(市区町村) +513/**-3** /
  blog +621/+31 / category +297/**0** / themes +132/**0**
- 面別 CTR は areas(市区町村) 1.11%→0.75%、category 1.18%→0.69%、themes 2.32%→1.90%

**最も薄いのは areas(市区町村)**: 4 週で imp 1,223→2,398 と倍増して clicks は +1、CTR 1.39%→0.75%。

### 判定と次の一手

- 週次計画の前提「露出が伸びているのに CTR が落ちている」は **4 週スパンでは成立しない** (+0.24pp)。
  施策としての CTR 改修を全面展開する根拠は現時点で無い。
- 実在する問題は **最新週に増えた露出の 63% が ranking で、それが平均の半分の CTR しか出していない**こと、
  および **areas(市区町村) / category / themes がほぼクリックゼロで露出だけ増えている**こと。
- 次: W34 snapshot (8/23 生成) で同じ差分を取り、最新週の増分 CTR 1.58% が続くかを見る。
  1 週だけなら変動、2 週続けば ranking の新規露出クエリを `queries.csv` で名指しする。
- **副次的な要確認**: `pages.csv` を読む 5 スクリプト
  (`build-remediation-queue` / `build-ai-content-queue` / `analyze-winning-patterns` /
  `extract-low-ctr-ranking-pages` / `build-placement-map`) は**いずれもアンカー行を明示的に扱っていない**。
  slug 完全一致で弾いている経路は実害が無いが、前方一致で束ねる経路があれば CTR が半減して見える。
  含めるか外すかは判断であって偶然に任せる状態ではない。

## [RANKING-GONE-RESTORE-01] 誤410からの復帰 → effect/none 確定 (2026-08-05)

- **施策**: 2026-07-03 に誤 GONE 化していた 56 ranking を復帰 (commit `4381f530e` 3 件 + `7fa49a4fc` 53 件)。
  想定効果: 410 で失われた imp の回復。
- **実測 (2026-08-05)**:
  - **56 キー全件が W27〜W31 の 5 週すべてで GSC impressions 0**。
    取得: `for sha in 7fa49a4fc 4381f530e; do git show $sha -- apps/web/src/config/gone-ranking-keys.ts | grep -E '^-  "' | sed 's/^-  "//; s/",$//'; done | sort -u > /tmp/restored.txt`
    → `awk -F',' 'NR==FNR{k[$1];next} FNR>1{n=split($1,p,"/ranking/"); if(n<2)next; key=p[2]; sub(/[?#].*/,"",key); sub(/\/$/,"",key); if(key in k){c+=$2; imp+=$3; u++}} END{print u+0, c+0, imp+0}' /tmp/restored.txt snapshots/<週>/pages.csv`
  - **打ち切りではない**: W31 の `pages.csv` は 2,814 行・imp 最小値 1 = imp≥1 のページを全件収録。「上位 N 件から漏れた」ではなく **imp が実際に 0**。
  - **ページは健全**: `curl -A Googlebot https://stats47.jp/ranking/{births,marriages,ratio-65-plus}` → 全件 **200** + 正しいタイトル (2026-08-05)。`sitemap-ranking-keys.ts` にも掲載済み。
- **判定**: **effect/none**。復帰から 4 週以上経っても imp が 1 も戻っていない。ページ側・sitemap 側に欠陥は無く、
  410 で deindex された URL の再収録が進んでいないことが残る説明。
- **次の一手**: URL Inspection API で 56 キーの `coverageState` を確定する (現行の日次サンプル 500 URL に 1 件も含まれていない)。
  未収録なら sitemap 再送信で再収録を促す (Indexing API は通常ページ対象外 — 下記 INDEXING-AUTO-01)。
  → `RANKING-REINDEX-01` (期日 2026-08-19) として起票。

## [TRIAGE-2026-07-03] 期日到達施策の effect/* 確定 (improvement-triage)

期日到達済み施策をバックログ (`.claude/todo/improvements.md`) と同期して判定確定。実測ソースは各行に併記。

- **BLOG-WAVE-2026-05-25-auto → effect/none 確定**: 実測 W21→W26 clicks 127→94 (-33) / imp -787 / CTR 1.12%→0.89% (下記 §BLOG-WAVE-2026-05-25-auto の 2026-06-28 自動計測)。同期間サイト全体 clicks +75% (1,110→1,947, `.claude/state/metrics/gsc/history.csv`) の中で対象 53 記事のみ減 = 想定リフト (+131 clicks/週) 未達。**[仮説]** title reframe が既得 query との整合を崩した (下落上位: temperature-extremes -31 / price-index -22 / child-height -10 clicks)。**検証コマンド**: 対象 slug を W22/W26 の `snapshots/*/queries.csv` で query 別 diff。**検証期日**: 2026-07-12 (weekly-review)
- **BLOG-WAVE-2026-05-29-auto → effect/none 確定**: 実測 W21→W26 clicks 7→5 (-2) / imp 1,258→881 (-377)。position 4 記事全て悪化 (+0.5〜+1.7)。サイト全体 +75% 成長下で横ばい以下
- **SEO-TITLE-FIX-01 → effect/partial 確定**: 対象 /areas/ 群 GSC clicks 4→50 / imp 671→5,249 (W21→W26, `snapshots/{2026-W21,2026-W26}/pages.csv` を `awk '$1 ~ /\/areas\//'` で集計、取得日 2026-07-03)。ただし area-category +705 URL index化 (W23)・AREA-PROFILE-FIX-01 解消と交絡し単独寄与は分離不能
- **BLOG-CTR-05 → effect/none 確定**: 3 記事 (child-height/manufacturing-aichi/temperature-extremes) W22→W26 clicks 59→11 / imp 5,882→2,337。temperature-extremes は position 9.14→9.03 でほぼ不変なのに CTR 1.31%→0.38% と急落。/category は imp 89→281 (W23→W26) と増加だが clicks 5→6。**[仮説]** title 変更による CTR 悪化 (query mix 変化の交絡あり)。**検証期日**: 2026-07-12
- **INDEXING-AUTO-01 → RETIRED 2026-07-23 (準拠是正)**: Google Indexing API は公式に JobPosting/BroadcastEvent VideoObject 専用 (quickstart, アクセス日 2026-07-23) で通常ページは対象外。cron `gsc-auto-resubmit-daily.yml` を schedule 削除・retired stub 化、`auto-resubmit.mjs`/`submit-cities-indexing.mjs` の publish path 撤去、coverage queue の `resubmit` action を `observe-after-fix` へ改名。過去送信履歴 (`resubmit-history.json` 累計 7,635 success) は証拠保持。effect は公式仕様外のため未実証で終了 (URL Inspection 観測は `gsc-url-inspection-daily.yml` で継続)。詳細は下記 §[INDEXING-AUTO-01]。正典: `.claude/skills/analytics/search-growth/reference/platform-contract.md`
- **COVERAGE-LOOP-01 → effect/pending (期日 2026-07-14 に再設定)**: 件数減判定に必要な次週 GSC UI export が未取込 (`.claude/state/gsc/coverage-totals-history.csv` は 2026-W25 の 1 行のみ)。次: 人間 export → `ingest-gsc-export.py` + `build-coverage-queue.mjs`
- **COVERAGE-DEACT-01 → effect/partial 確定**: 意図した空200→410 は本番実測で達成 — `curl -s -o /dev/null -w "%{http_code}" -A Googlebot https://stats47.jp/ranking/{marine-aquaculture-output,university-advancement}` → 410 (2026-07-03)。**副作用**: 同時の一括棚卸し (gone-ranking-keys.ts +398 キー, commit a179526) が実データ保有 56 キーを誤GONE化し本番 410 誤配信 → 2026-07-03 全復帰 (births/marriages/ratio-65-plus = 200 実測、同 curl)。再発防止は ranking-key-consistency.test.ts (GONE∩KNOWN=∅ / GONE∩isActive=∅ を CI 検証)。GSC soft404/404 減 + imp 回復は RANKING-GONE-RESTORE-01 (期日 2026-07-31) で追跡

## [BLOG-WAVE-2026-06-10-manual]

- **status**: effect/pending (閾値エンジン判定 / thresholds.mjs v1.0.0 / ガード: insufficient-target, insufficient-sample)
- **wave_id**: 2026-06-10-manual / **記事数**: 6
- **remediated_at**: 2026-06-10 (週 2026-W24)
- **before**: 2026-W23 → **after**: 2026-W35 (経過 11 週)
- **計測日**: 2026-08-30 (自動: measure-gsc-impact.mjs)

| slug | imp (before→after) | clicks | CTR | position |
|---|---|---|---|---|
| `frozen-gyoza-spending-prefecture-gap` | 0→302 (+302) | 0→4 (+4) | 0.0%→1.3% (+1.32pp) | 0.0→9.6 (+9.6) |
| `library-books-prefecture-gap` | 37→220 (+183) | 0→4 (+4) | 0.0%→1.8% (+1.82pp) | 8.9→7.9 (-1.1) |
| `pachinko-participation-prefecture-gap` | 0→20 (+20) | 0→1 (+1) | 0.0%→5.0% (+5.00pp) | 0.0→7.6 (+7.6) |
| `pharmacist-income-prefecture-gap` | 0→9 (+9) | 0→0 (+0) | 0.0%→0.0% (+0.00pp) | 0.0→7.3 (+7.3) |
| `tofu-consumption-prefecture-gap` | 0→117 (+117) | 0→7 (+7) | 0.0%→6.0% (+5.98pp) | 0.0→7.1 (+7.1) |
| `yogurt-spending-prefecture-gap` | 0→23 (+23) | 0→3 (+3) | 0.0%→13.0% (+13.04pp) | 0.0→5.1 (+5.1) |

**wave 合計**: imp 37→691 (+654) / clicks 0→19 (+19) / CTR 0.00%→2.75% (+2.75pp)

### 判定

- **[判定] effect/pending** — ガード insufficient-target, insufficient-sample により判定不能
- **[根拠データ]** clicks (6 記事合計) 0→19 (delta +19 / 相対 +∞% / 想定値未登録) / window 2026-W23→2026-W35 (11 週)
- **[閾値 SSOT]** `.claude/scripts/lib/effect-verdict/thresholds.mjs` v1.0.0 (full ≥ 80.0% / partial ≥ 30.0% / adverse ≤ -10.0%)
- **[ガード]** insufficient-target (想定効果値 (target delta) が機械可読な形で登録されていない) / insufficient-sample (before imp 37 < sample.minImpressionsBefore 100)
- **[再現コマンド]** `node .claude/scripts/blog/measure-gsc-impact.mjs --wave 2026-06-10-manual`
- **[subject]** BLOG-WAVE-2026-06-10-manual / 判定日 2026-08-30 (自動: effect-verdict engine)

## [BLOG-WAVE-2026-06-07-manual-3]

- **status**: effect/pending (閾値エンジン判定 / thresholds.mjs v1.0.0 / ガード: insufficient-target)
- **wave_id**: 2026-06-07-manual-3 / **記事数**: 3
- **remediated_at**: 2026-06-07 (週 2026-W23)
- **before**: 2026-W22 → **after**: 2026-W35 (経過 12 週)
- **計測日**: 2026-08-30 (自動: measure-gsc-impact.mjs)

| slug | imp (before→after) | clicks | CTR | position |
|---|---|---|---|---|
| `automotive-industry-transformation-map` | 220→3103 (+2883) | 10→76 (+66) | 4.5%→2.4% (-2.10pp) | 6.4→5.7 (-0.7) |
| `marriage-unmarried-crisis` | 277→1181 (+904) | 4→20 (+16) | 1.4%→1.7% (+0.25pp) | 9.3→8.2 (-1.1) |
| `sports-urban-paradox` | 392→762 (+370) | 12→27 (+15) | 3.1%→3.5% (+0.48pp) | 7.3→7.1 (-0.2) |

**wave 合計**: imp 889→5046 (+4157) / clicks 26→123 (+97) / CTR 2.92%→2.44% (-0.49pp)

### 判定

- **[判定] effect/pending** — ガード insufficient-target により判定不能
- **[根拠データ]** clicks (3 記事合計) 26→123 (delta +97 / 相対 373.1% / 想定値未登録) / window 2026-W22→2026-W35 (12 週)
- **[閾値 SSOT]** `.claude/scripts/lib/effect-verdict/thresholds.mjs` v1.0.0 (full ≥ 80.0% / partial ≥ 30.0% / adverse ≤ -10.0%)
- **[ガード]** insufficient-target (想定効果値 (target delta) が機械可読な形で登録されていない)
- **[再現コマンド]** `node .claude/scripts/blog/measure-gsc-impact.mjs --wave 2026-06-07-manual-3`
- **[subject]** BLOG-WAVE-2026-06-07-manual-3 / 判定日 2026-08-30 (自動: effect-verdict engine)

## [BLOG-WAVE-2026-06-07-manual-2]

- **status**: effect/pending (閾値エンジン判定 / thresholds.mjs v1.0.0 / ガード: insufficient-target)
- **wave_id**: 2026-06-07-manual-2 / **記事数**: 3
- **remediated_at**: 2026-06-07 (週 2026-W23)
- **before**: 2026-W22 → **after**: 2026-W35 (経過 12 週)
- **計測日**: 2026-08-30 (自動: measure-gsc-impact.mjs)

| slug | imp (before→after) | clicks | CTR | position |
|---|---|---|---|---|
| `household-spending-prefecture-gap` | 586→2038 (+1452) | 23→79 (+56) | 3.9%→3.9% (-0.05pp) | 7.7→5.5 (-2.3) |
| `local-government-debt-burden` | 662→9568 (+8906) | 19→292 (+273) | 2.9%→3.1% (+0.18pp) | 7.0→6.2 (-0.8) |
| `price-index-high-low-prefecture` | 1366→554 (-812) | 27→7 (-20) | 2.0%→1.3% (-0.71pp) | 9.0→7.8 (-1.2) |

**wave 合計**: imp 2614→12160 (+9546) / clicks 69→378 (+309) / CTR 2.64%→3.11% (+0.47pp)

### 判定

- **[判定] effect/pending** — ガード insufficient-target により判定不能
- **[根拠データ]** clicks (3 記事合計) 69→378 (delta +309 / 相対 447.8% / 想定値未登録) / window 2026-W22→2026-W35 (12 週)
- **[閾値 SSOT]** `.claude/scripts/lib/effect-verdict/thresholds.mjs` v1.0.0 (full ≥ 80.0% / partial ≥ 30.0% / adverse ≤ -10.0%)
- **[ガード]** insufficient-target (想定効果値 (target delta) が機械可読な形で登録されていない)
- **[再現コマンド]** `node .claude/scripts/blog/measure-gsc-impact.mjs --wave 2026-06-07-manual-2`
- **[subject]** BLOG-WAVE-2026-06-07-manual-2 / 判定日 2026-08-30 (自動: effect-verdict engine)

## [BLOG-WAVE-2026-06-07-manual]

- **status**: effect/pending (閾値エンジン判定 / thresholds.mjs v1.0.0 / ガード: insufficient-target)
- **wave_id**: 2026-06-07-manual / **記事数**: 3
- **remediated_at**: 2026-06-07 (週 2026-W23)
- **before**: 2026-W22 → **after**: 2026-W35 (経過 12 週)
- **計測日**: 2026-08-30 (自動: measure-gsc-impact.mjs)

| slug | imp (before→after) | clicks | CTR | position |
|---|---|---|---|---|
| `consumer-price-regional-gap` | 207→2 (-205) | 0→0 (+0) | 0.0%→0.0% (+0.00pp) | 9.5→7.5 (-2.0) |
| `curry-roux-consumption-gap` | 0→169 (+169) | 0→3 (+3) | 0.0%→1.8% (+1.78pp) | 0.0→7.1 (+7.1) |
| `doctor-income-prefecture-gap` | 0→7 (+7) | 0→0 (+0) | 0.0%→0.0% (+0.00pp) | 0.0→9.3 (+9.3) |

**wave 合計**: imp 207→178 (-29) / clicks 0→3 (+3) / CTR 0.00%→1.69% (+1.69pp)

### 判定

- **[判定] effect/pending** — ガード insufficient-target により判定不能
- **[根拠データ]** clicks (3 記事合計) 0→3 (delta +3 / 相対 +∞% / 想定値未登録) / window 2026-W22→2026-W35 (12 週)
- **[閾値 SSOT]** `.claude/scripts/lib/effect-verdict/thresholds.mjs` v1.0.0 (full ≥ 80.0% / partial ≥ 30.0% / adverse ≤ -10.0%)
- **[ガード]** insufficient-target (想定効果値 (target delta) が機械可読な形で登録されていない)
- **[再現コマンド]** `node .claude/scripts/blog/measure-gsc-impact.mjs --wave 2026-06-07-manual`
- **[subject]** BLOG-WAVE-2026-06-07-manual / 判定日 2026-08-30 (自動: effect-verdict engine)

## [BLOG-WAVE-2026-05-29-auto]

- **status**: effect/pending (閾値エンジン判定 / thresholds.mjs v1.0.0 / ガード: insufficient-target)
- **wave_id**: 2026-05-29-auto / **記事数**: 4
- **remediated_at**: 2026-05-29 (週 2026-W22)
- **before**: 2026-W21 → **after**: 2026-W35 (経過 13 週)
- **計測日**: 2026-08-30 (自動: measure-gsc-impact.mjs)

| slug | imp (before→after) | clicks | CTR | position |
|---|---|---|---|---|
| `agriculture-hokkaido-dominance` | 103→95 (-8) | 0→1 (+1) | 0.0%→1.1% (+1.05pp) | 9.3→10.2 (+0.9) |
| `manufacturing-aichi-dominance` | 858→6183 (+5325) | 5→17 (+12) | 0.6%→0.3% (-0.31pp) | 8.7→8.1 (-0.6) |
| `manufacturing-shipment-prefecture-ranking` | 159→79 (-80) | 0→1 (+1) | 0.0%→1.3% (+1.27pp) | 8.1→6.1 (-2.0) |
| `sewerage-water-supply-gap` | 138→0 (-138) | 2→0 (-2) | 1.4%→0.0% (-1.45pp) | 9.9→0.0 (-9.9) |

**wave 合計**: imp 1258→6357 (+5099) / clicks 7→19 (+12) / CTR 0.56%→0.30% (-0.26pp)

### 判定

- **[判定] effect/pending** — ガード insufficient-target により判定不能
- **[根拠データ]** clicks (4 記事合計) 7→19 (delta +12 / 相対 171.4% / 想定値未登録) / window 2026-W21→2026-W35 (13 週)
- **[閾値 SSOT]** `.claude/scripts/lib/effect-verdict/thresholds.mjs` v1.0.0 (full ≥ 80.0% / partial ≥ 30.0% / adverse ≤ -10.0%)
- **[ガード]** insufficient-target (想定効果値 (target delta) が機械可読な形で登録されていない)
- **[再現コマンド]** `node .claude/scripts/blog/measure-gsc-impact.mjs --wave 2026-05-29-auto`
- **[subject]** BLOG-WAVE-2026-05-29-auto / 判定日 2026-08-30 (自動: effect-verdict engine)

## [BLOG-WAVE-2026-05-25-auto]

- **status**: effect/pending (閾値エンジン判定 / thresholds.mjs v1.0.0 / ガード: insufficient-target)
- **wave_id**: 2026-05-25-auto / **記事数**: 53
- **remediated_at**: 2026-05-25 (週 2026-W22)
- **before**: 2026-W21 → **after**: 2026-W35 (経過 13 週)
- **計測日**: 2026-08-30 (自動: measure-gsc-impact.mjs)

| slug | imp (before→after) | clicks | CTR | position |
|---|---|---|---|---|
| `aging-rate-akita-vs-okinawa` | 39→9 (-30) | 0→1 (+1) | 0.0%→11.1% (+11.11pp) | 11.2→6.6 (-4.7) |
| `alcohol-prefecture-map` | 66→1339 (+1273) | 0→13 (+13) | 0.0%→1.0% (+0.97pp) | 7.0→8.3 (+1.3) |
| `barber-beauty-salon-regional-gap` | 34→127 (+93) | 0→3 (+3) | 0.0%→2.4% (+2.36pp) | 7.9→8.1 (+0.2) |
| `birth-death-gap-decline` | 51→1 (-50) | 0→0 (+0) | 0.0%→0.0% (+0.00pp) | 12.4→11.0 (-1.4) |
| `bonito-catch-prefecture` | 231→5490 (+5259) | 4→54 (+50) | 1.7%→1.0% (-0.75pp) | 8.5→6.0 (-2.5) |
| `brazilian-resident-population-prefecture-gap` | 18→4 (-14) | 0→0 (+0) | 0.0%→0.0% (+0.00pp) | 6.7→9.5 (+2.8) |
| `child-height-regional-gap` | 2005→832 (-1173) | 14→5 (-9) | 0.7%→0.6% (-0.10pp) | 10.2→9.1 (-1.1) |
| `commercial-land-price-trend` | 27→0 (-27) | 0→0 (+0) | 0.0%→0.0% (+0.00pp) | 6.8→0.0 (-6.8) |
| `commercial-sales-productivity-gap` | 153→9 (-144) | 2→0 (-2) | 1.3%→0.0% (-1.31pp) | 7.7→6.4 (-1.2) |
| `communication-cost-burden` | 37→1 (-36) | 1→0 (-1) | 2.7%→0.0% (-2.70pp) | 8.3→6.0 (-2.3) |
| `consumer-price-regional-gap` | 216→2 (-214) | 0→0 (+0) | 0.0%→0.0% (+0.00pp) | 9.2→7.5 (-1.7) |
| `cpi-change-regional-pattern` | 56→0 (-56) | 1→0 (-1) | 1.8%→0.0% (-1.79pp) | 7.7→0.0 (-7.7) |
| `expenditure-structure-comparison` | 16→19 (+3) | 0→1 (+1) | 0.0%→5.3% (+5.26pp) | 9.4→11.9 (+2.5) |
| `fertility-fiscal-nexus` | 25→1 (-24) | 0→0 (+0) | 0.0%→0.0% (+0.00pp) | 11.0→6.0 (-5.0) |
| `fertility-rate-prefecture-gap` | 148→748 (+600) | 0→5 (+5) | 0.0%→0.7% (+0.67pp) | 11.5→7.7 (-3.8) |
| `fiscal-health-50years-trend` | 25→9 (-16) | 0→0 (+0) | 0.0%→0.0% (+0.00pp) | 8.2→8.7 (+0.5) |
| `fishery-catch-aquaculture-shift` | 133→96 (-37) | 0→3 (+3) | 0.0%→3.1% (+3.13pp) | 10.8→8.7 (-2.1) |
| `fishery-species-prefecture-specialty` | 273→8 (-265) | 3→0 (-3) | 1.1%→0.0% (-1.10pp) | 8.1→7.8 (-0.3) |
| `food-trio-prefecture-map` | 340→223 (-117) | 6→4 (-2) | 1.8%→1.8% (+0.03pp) | 7.6→8.4 (+0.8) |
| `foreign-overnight-guests-prefecture-gap` | 34→13 (-21) | 0→0 (+0) | 0.0%→0.0% (+0.00pp) | 8.4→9.5 (+1.0) |
| `habitable-area-land-use` | 754→1666 (+912) | 5→14 (+9) | 0.7%→0.8% (+0.18pp) | 8.1→8.1 (+0.1) |
| `highschool-starting-salary-gap` | 390→63 (-327) | 7→0 (-7) | 1.8%→0.0% (-1.79pp) | 9.1→8.6 (-0.5) |
| `household-income-tokyo-okinawa` | 25→12 (-13) | 0→2 (+2) | 0.0%→16.7% (+16.67pp) | 10.4→10.7 (+0.3) |
| `household-spending-before-after-inflation` | 37→9 (-28) | 0→0 (+0) | 0.0%→0.0% (+0.00pp) | 6.2→12.7 (+6.5) |
| `housing-cost-livability-trend` | 71→85 (+14) | 1→1 (+0) | 1.4%→1.2% (-0.23pp) | 7.7→8.1 (+0.3) |
| `ict-digital-divide-composite-analysis` | 12→2 (-10) | 0→0 (+0) | 0.0%→0.0% (+0.00pp) | 8.5→3.5 (-5.0) |
| `inflation-rate-prefecture-gap` | 82→6 (-76) | 1→0 (-1) | 1.2%→0.0% (-1.22pp) | 6.6→6.0 (-0.6) |
| `konbu-consumption-prefecture-gap` | 34→3616 (+3582) | 0→70 (+70) | 0.0%→1.9% (+1.94pp) | 6.5→5.4 (-1.2) |
| `local-tax-regional-gap` | 109→147 (+38) | 2→1 (-1) | 1.8%→0.7% (-1.15pp) | 7.1→7.5 (+0.4) |
| `marriage-divorce-okinawa` | 50→121 (+71) | 0→2 (+2) | 0.0%→1.7% (+1.65pp) | 7.1→9.9 (+2.8) |
| `marriage-unmarried-crisis` | 275→1181 (+906) | 4→20 (+16) | 1.5%→1.7% (+0.24pp) | 9.2→8.2 (-1.0) |
| `minimum-wage-1000yen-breakthrough` | 118→0 (-118) | 0→0 (+0) | 0.0%→0.0% (+0.00pp) | 12.1→0.0 (-12.1) |
| `minimum-wage-gap-regional-economy` | 20→4 (-16) | 0→0 (+0) | 0.0%→0.0% (+0.00pp) | 7.8→6.3 (-1.5) |
| `park-green-space-gap` | 334→700 (+366) | 4→4 (+0) | 1.2%→0.6% (-0.63pp) | 7.2→8.6 (+1.4) |
| `pharmacy-count-prefecture-ranking` | 15→12 (-3) | 0→0 (+0) | 0.0%→0.0% (+0.00pp) | 8.7→9.3 (+0.5) |
| `pollution-complaints-regional-map` | 62→16 (-46) | 1→0 (-1) | 1.6%→0.0% (-1.61pp) | 8.0→10.2 (+2.2) |
| `population-density-urbanization` | 285→2619 (+2334) | 4→10 (+6) | 1.4%→0.4% (-1.02pp) | 8.7→8.2 (-0.5) |
| `population-migration-tokyo-concentration` | 28→1 (-27) | 0→0 (+0) | 0.0%→0.0% (+0.00pp) | 9.2→5.0 (-4.2) |
| `post-office-last-window` | 78→15 (-63) | 1→0 (-1) | 1.3%→0.0% (-1.28pp) | 6.5→6.5 (-0.0) |
| `precipitation-snow-regional-gap` | 155→1894 (+1739) | 1→19 (+18) | 0.6%→1.0% (+0.36pp) | 12.5→8.3 (-4.2) |
| `prefectural-height-male-female-gap` | 10→28 (+18) | 0→2 (+2) | 0.0%→7.1% (+7.14pp) | 8.5→6.7 (-1.8) |
| `price-index-high-low-prefecture` | 1527→554 (-973) | 27→7 (-20) | 1.8%→1.3% (-0.50pp) | 8.8→7.8 (-0.9) |
| `recycling-rate-gap` | 60→5 (-55) | 1→0 (-1) | 1.7%→0.0% (-1.67pp) | 7.8→8.4 (+0.7) |
| `savings-rate-gap` | 20→9 (-11) | 0→0 (+0) | 0.0%→0.0% (+0.00pp) | 7.2→6.9 (-0.3) |
| `school-nonattendance-pattern` | 32→22 (-10) | 0→1 (+1) | 0.0%→4.5% (+4.55pp) | 11.0→8.1 (-2.9) |
| `sugar-consumption-prefecture-gap` | 19→3 (-16) | 0→0 (+0) | 0.0%→0.0% (+0.00pp) | 7.7→6.7 (-1.1) |
| `sunshine-pacific-vs-nihonkai` | 146→1331 (+1185) | 0→16 (+16) | 0.0%→1.2% (+1.20pp) | 7.8→6.6 (-1.2) |
| `temperature-extremes-map` | 2415→1775 (-640) | 36→11 (-25) | 1.5%→0.6% (-0.87pp) | 8.9→9.0 (+0.1) |
| `truck-driver-2024-crisis` | 67→5 (-62) | 0→0 (+0) | 0.0%→0.0% (+0.00pp) | 5.8→8.6 (+2.8) |
| `unemployment-structure` | 66→525 (+459) | 1→7 (+6) | 1.5%→1.3% (-0.18pp) | 6.9→9.0 (+2.1) |
| `unemployment-tertiary-industry-link` | 13→2 (-11) | 0→0 (+0) | 0.0%→0.0% (+0.00pp) | 6.5→5.0 (-1.5) |
| `wage-vs-living-cost` | 25→48 (+23) | 0→1 (+1) | 0.0%→2.1% (+2.08pp) | 6.9→8.9 (+2.0) |
| `water-sewage-crisis` | 39→36 (-3) | 0→0 (+0) | 0.0%→0.0% (+0.00pp) | 10.8→9.7 (-1.2) |

**wave 合計**: imp 11300→25443 (+14143) / clicks 127→277 (+150) / CTR 1.12%→1.09% (-0.04pp)

### 判定

- **[判定] effect/pending** — ガード insufficient-target により判定不能
- **[根拠データ]** clicks (53 記事合計) 127→277 (delta +150 / 相対 118.1% / 想定値未登録) / window 2026-W21→2026-W35 (13 週)
- **[閾値 SSOT]** `.claude/scripts/lib/effect-verdict/thresholds.mjs` v1.0.0 (full ≥ 80.0% / partial ≥ 30.0% / adverse ≤ -10.0%)
- **[ガード]** insufficient-target (想定効果値 (target delta) が機械可読な形で登録されていない)
- **[再現コマンド]** `node .claude/scripts/blog/measure-gsc-impact.mjs --wave 2026-05-25-auto`
- **[subject]** BLOG-WAVE-2026-05-25-auto / 判定日 2026-08-30 (自動: effect-verdict engine)

## [BLOG-WAVE-2026-05-23-manual]

- **status**: effect/pending (閾値エンジン判定 / thresholds.mjs v1.0.0 / ガード: insufficient-target)
- **wave_id**: 2026-05-23-manual / **記事数**: 10
- **remediated_at**: 2026-05-23 (週 2026-W21)
- **before**: 2026-W20 → **after**: 2026-W35 (経過 14 週)
- **計測日**: 2026-08-30 (自動: measure-gsc-impact.mjs)

| slug | imp (before→after) | clicks | CTR | position |
|---|---|---|---|---|
| `child-height-regional-gap` | 1719→832 (-887) | 13→5 (-8) | 0.8%→0.6% (-0.16pp) | 10.6→9.1 (-1.4) |
| `consumer-price-regional-gap` | 250→2 (-248) | 1→0 (-1) | 0.4%→0.0% (-0.40pp) | 7.3→7.5 (+0.2) |
| `fiscal-self-reliance-gap` | 583→1503 (+920) | 16→23 (+7) | 2.7%→1.5% (-1.21pp) | 8.8→7.2 (-1.7) |
| `fishery-species-prefecture-specialty` | 273→8 (-265) | 3→0 (-3) | 1.1%→0.0% (-1.10pp) | 8.1→7.8 (-0.3) |
| `habitable-area-land-use` | 658→1666 (+1008) | 2→14 (+12) | 0.3%→0.8% (+0.54pp) | 8.1→8.1 (+0.0) |
| `overnight-guests-inbound-recovery` | 383→45 (-338) | 1→2 (+1) | 0.3%→4.4% (+4.18pp) | 8.3→14.0 (+5.6) |
| `park-green-space-gap` | 225→700 (+475) | 2→4 (+2) | 0.9%→0.6% (-0.32pp) | 7.5→8.6 (+1.1) |
| `population-density-urbanization` | 259→2619 (+2360) | 4→10 (+6) | 1.5%→0.4% (-1.16pp) | 11.1→8.2 (-2.9) |
| `price-index-high-low-prefecture` | 1403→554 (-849) | 26→7 (-19) | 1.9%→1.3% (-0.59pp) | 8.5→7.8 (-0.7) |
| `temperature-extremes-map` | 1388→1775 (+387) | 21→11 (-10) | 1.5%→0.6% (-0.89pp) | 9.1→9.0 (-0.1) |

**wave 合計**: imp 7141→9704 (+2563) / clicks 89→76 (-13) / CTR 1.25%→0.78% (-0.46pp)

### 判定

- **[判定] effect/pending** — ガード insufficient-target により判定不能
- **[根拠データ]** clicks (10 記事合計) 89→76 (delta -13 / 相対 -14.6% / 想定値未登録) / window 2026-W20→2026-W35 (14 週)
- **[閾値 SSOT]** `.claude/scripts/lib/effect-verdict/thresholds.mjs` v1.0.0 (full ≥ 80.0% / partial ≥ 30.0% / adverse ≤ -10.0%)
- **[ガード]** insufficient-target (想定効果値 (target delta) が機械可読な形で登録されていない)
- **[再現コマンド]** `node .claude/scripts/blog/measure-gsc-impact.mjs --wave 2026-05-23-manual`
- **[subject]** BLOG-WAVE-2026-05-23-manual / 判定日 2026-08-30 (自動: effect-verdict engine)

## 新規エントリテンプレ（必ず参照: `.claude/rules/evidence-based-judgment.md`）

```markdown
### [PHASE-NN] タイトル
- **デプロイ日**: YYYY-MM-DD / コミット: <hash>
- **想定効果**: <定量値> [根拠: <データ源 or 過去事例リンク>]
- **検証コマンド**: <curl / wrangler / API 呼び出し>
- **実測 (before)**: <値 + 取得日 + 取得コマンド>
- **実測 (after)**: <値 + 取得日 + 取得コマンド>
- **判定**: effect/* [根拠: 実測 / 想定 = X%、経過 N 日]
- **未確定 / 仮説**: <あれば「[仮説] 〜 / 検証期日 YYYY-MM-DD」形式>
```

## 実証チェックリスト（effect/* ラベルを付ける前に必須）

参照: `.claude/rules/evidence-based-judgment.md`

- [ ] URL Inspection API daily で coverageState 別件数の前後比較を取った
- [ ] 仕様主張がある場合、Google 公式ドキュメント URL を引用した
- [ ] 比較対象（before / after / baseline）が明確
- [ ] NG ワード（「のはず」「兆候」「浸透待ち」等）を使っていない
- [ ] 効果が想定の 80% 未満なら、未達理由仮説と次の検証コマンドを書いた

未満なら effect/full / effect/partial を付けない。effect/pending のままにすること。

---

## Action Log

### [RANK-LINK-01] サイト横断内部リンク監査 + theme→410 リンク修正

- **デプロイ日**: 2026-06-12 / ブランチ: `claude/dazzling-knuth-23fd05`
- **監査結果 (実測 2026-06-12、/tmp/audit-rank-links.mjs で R2 公開 URL + git TS を横断)**:
  - KNOWN_RANKING_KEYS 2,121 件のうち R2 `app/category/{key}/items.json` 未掲載 **137 件**
    (内訳: economy 26 / laborwage 25 / commercial 15 / population 13 / socialsecurity 12 /
    administrativefinancial 12 / tourism 10 / 他 8 カテゴリ 24。全リスト: 監査スクリプト再実行で再現可)
  - category+theme+blog どの導線からもリンクされない true orphan **120 件** (137 件の部分集合)
  - theme 定数 → 410 ページへのリンク **3 件** (dwelling-per-floor-area / prefectural-income-per-capita / per-capita-prefectural-income-h27)
  - blog source-link 14 キーは全件 KNOWN (問題なし)
- **実施 (コード)**:
  - `per-capita-prefectural-income-h27`: isActive true 化 + GONE_RANKING_KEYS から除去 + KNOWN 再生成で追加
    (R2 item.json/values.json/stats values すべて 200 を curl で確認済 → 410→200 化)
  - `local-economy` テーマ: `prefectural-income-per-capita` → `per-capita-prefectural-income-h27` に差替
  - `living-housing` テーマ: `dwelling-per-floor-area` (inactive・観測値なし) → `housing-floor-area` (KNOWN・active) に差替
  - `prefectural-income-per-capita`: 観測値未投入の placeholder (source.kind=external/unknown, values.json 404) のため isActive false 化。410 は意図どおり
  - `population-migration-inter-prefecture`: entities=migration-flow のペア観測 metric でランキングページ非対象。コード内に /ranking/ リンクなし → 410 のまま正常 (修正不要と判定)
- **検証コマンド**: `npm run validate:config --workspace=@stats47/data-configs` (error 0) / `npx tsc --noEmit -p apps/web/tsconfig.json` (pass) / vitest url-policy + all-themes (19 pass) / `node /tmp/audit-rank-links.mjs` 再実行で theme not-KNOWN 0 件
- **残タスク**: (1) ユーザーが GitHub Actions `sync-snapshots.yml` を only=master で手動実行 → category items.json 137 件 gap 解消 (orphan 120 件が category 導線獲得) (2) デプロイ後 `curl -A Googlebot https://stats47.jp/ranking/per-capita-prefectural-income-h27` で 200 実測
- **判定**: effect/pending [検証期日 2026-07-12: GSC W27 snapshot で zero-imp ranking 件数 (W23 基準 ~1,285) の減少を比較。category 導線追加 137 件 + theme 導線 2 件が対象]

### [URL-INSP-2026-05-16] URL Inspection 日次測定（--limit 10 実行）
- **実行日**: 2026-05-16
- **実行コマンド**: `node .claude/scripts/gsc/url-inspection-daily.cjs --limit 10`
- **結果**: PASS 10 / NEUTRAL 0、coverageState は全件「送信して登録されました」(10/10)
- **生データ**: `.claude/state/metrics/gsc/url-inspection/2026-05-16.csv`
- **LATEST.md**: `.claude/state/metrics/gsc/url-inspection/LATEST.md`
- **前日比 (5/10 → 5/16)**: PASS -81、NEUTRAL -9、対象 URL 数 -90（前日 100 件 → 今回 10 件のサンプル縮小による）
- **判定**: 実証値のみ記録。effect ラベル付与なし（サンプルサイズ小、未登録 1.6 万件への影響判定には次回 1,500 URL full run が必要）

### [PHASE-9] middleware + sitemap ゼロベース再構築

- **デプロイ日**: 2026-04-26 / コミット: `b4b7a31c` (P0) + `bb4303e9` (P1) + `4dec30e5` (P2-A) + `0ec26659` (P2-B+C) + `e97b6db7` (smoke-test fix)
- **PR**: #121 (本体 4 commit) + #122/#123/#125 (hotfix)
- **背景**: 9 個の累積 Fix で middleware/sitemap の整合性が破綻、Google から「設計が定まっていないサイト」と判定。批判レビュー (2026-04-26) で 7 致命傷を特定:
  1. `gone()` の `Cache-Control: no-store` がクロール予算を 410 群に吸収
  2. 削除シグナルが 410/200+noindex/200 に分裂
  3. 301→410 リダイレクトチェーン
  4. sitemap 重複 URL 3 件 (manufacturing-net-value-added-private 等)
  5. lastmod が bulk timestamp で全件同一 → Google が無視
  6. INDEXABLE_AREA_CATEGORIES が middleware [population, economy] vs sitemap [population] で乖離
  7. KNOWN_*_KEYS が 28 日古い、自動同期なし

- **施策内容**:
  - **P0**: `gone()` を `public, max-age=86400, s-maxage=604800` + `X-Robots-Tag: noindex` / sitemap 重複排除
  - **P1**: UrlPolicy データ層導入 (`apps/web/src/lib/url-policy.ts`) + middleware 4 セクション再構築 + 301→410 解消 + lastmod 戦略変更（ranking 削除 / blog は published_at 固定 / tag は集計）
  - **P2-A**: KNOWN_*_KEYS 自動同期 workflow (`.github/workflows/sync-known-keys.yml`、毎日 JST 07:00)
  - **P2-B**: middleware で RSC 以外の Vary を `Accept-Encoding` のみに最小化
  - **P2-C**: sitemap index 化、8 segment (static/themes/areas/ranking/blog/categories/surveys/tags) 分割

- **想定効果**: クロール予算 -40%（業界実績、CDN cacheable 410 化）→ 1 ヶ月で「クロール済み未登録」-3,000 〜 -5,000 件
  [根拠: Google 公式 https://developers.google.com/search/docs/crawling-indexing/http-caching + Phase 6 既存施策の URL Inspection API 観測パターン]

- **検証コマンド**:
  ```bash
  # P0: 410 cache control
  curl -sI https://stats47.jp/dashboard/13000 | grep -iE "cache-control|x-robots"

  # P1: 301→410 解消
  curl -s -L -o /dev/null -w "%{http_code} hops:%{num_redirects}\n" \
    https://stats47.jp/ranking/prefecture/non-existent-key

  # P2-B: Vary 最小化
  curl -sI https://stats47.jp/ | grep -i "^vary:"

  # P2-C: sitemap index
  curl -s https://stats47.jp/sitemap.xml | head -15

  # 全体効果: URL Inspection daily の coverageState 別件数推移
  cat .claude/state/metrics/gsc/url-inspection/LATEST.md
  ```

- **実測 (before, 2026-04-25 baseline)**:
  - URL Inspection 301 URL サンプル: PASS 206 / クロール済未登録 27 / 検出未登録 16 / 404 40
    取得: `.claude/state/metrics/gsc/url-inspection/2026-04-25.csv`
  - GSC 全体 (W17): Clicks 424 / Impressions 14,373 / CTR 2.95% / Avg Pos 10.50
    取得: `.claude/state/metrics/gsc/LATEST.md`
  - 登録済み 1,860 / 未登録 16,628 / 5xx 2,047 (W17 snapshot)

- **実測 (after, デプロイ直後 2026-04-26)**:
  - **本番動作確認**: 全 5 項目想定通り動作（PR #121 コメント参照）
    - `cache-control: public, max-age=86400, s-maxage=604800`
    - `x-robots-tag: noindex`
    - `vary: Accept-Encoding`
    - sitemap index 8 segment 完備
    - sitemap 重複 0 件
  - **GSC 効果反映**: URL Inspection daily で観測予定（4/27 早期警戒 / 5/02 中間判定 / 5/09 W18 終了判定）

- **判定**: effect/pending [根拠: デプロイ直後、Google 反映観測未完]
  - 早期警戒: 4/27-28 で再クロール件数 / 日 > 5
  - 5/02 cutoff 目標: 登録済 > 2,000 (+140) / 未登録 < 14,500 (-2,128)
  - 5/09 cutoff 目標: 登録済 > 2,300 / 未登録 < 12,000

- **未確定 / 仮説**:
  - **[仮説]** Cache-Control: public 化により Google のクロール頻度が下がり、新コンテンツへ予算が回る
    検証コマンド: `node .claude/scripts/gsc/url-inspection-daily.cjs` で再クロール件数の日次推移
    検証期日: 2026-05-09
    期日後判定: 再クロール件数 > 50/日 なら仮説支持、< 10/日 なら仮説棄却

  - **[仮説]** sitemap index 化により Google が segment ごとに submission を認識し、ranking 338 / blog 121 / areas 141 のうちどこが詰まっているか分離可能
    検証: GSC ダッシュボードの「サイトマップ」セクションで各 sitemap-{n}.xml の登録進捗を観測
    検証期日: 2026-05-02

- **5/9 撤退/継続ライン（2026-04-27 事前固定、判定時に動かさない）**:
  - **継続条件 (PHASE-10 着手)**: W18 (5/2) 時点で Impression > 16,000 OR W19 (5/9) 時点で 登録済 > 2,200 / 未登録 < 14,500
  - **撤退条件 (技術 SEO 注力停止、コンテンツ路線へ切替)**: W19 (5/9) 時点で Impression < 15,000 かつ 登録済 < 2,000
  - **どちらにも該当しない場合 (中間)**: PHASE-9 を effect/partial で確定、その時点で URL Inspection で coverageState 別の差分を再評価
  - **根拠**: W17 baseline は Imp 14,373 / 登録済 1,860 / 未登録 16,628。撤退ラインは「6 週間で改善幅 5% 未満」を不発と判定する一般的な SEO 観測サイクルに基づく
  - **注意資源方針**: 5/9 までは新規 middleware/sitemap 修正を行わない。観測のみ。エンジニアリング工数はコンテンツ生成（ブログ・Instagram・note）に振り替える

- **2026-04-27 中間検証 (実装層)**:
  - **結果**: ✅ middleware/canonical 完全動作
  - **検証文書**: `.claude/state/metrics/gsc/middleware-verification/2026-W17.md`
  - **判定**: 実装層 effect/full（30/30 サンプルで 410 / canonical 設定確認）。Google 反映層は引き続き effect/pending
  - **PHASE-10 候補の取り消し**:
    - D-1 (`/blog/tags/` middleware 拡張): 不要（実測 30/30 が 410）
    - D-2 (/ranking canonical 修正): 不要（`generate-meta-data.ts:121-123` で完全実装済み）
  - **新発見**: SEO レビューで挙がった「middleware カバー外」「canonical 不備」の両仮説とも、**実証で誤りだった**。コードの上っ面パターンマッチングで仮説を立てるのは危険、curl 実証が必須。

- **2026-04-27 観測インフラ修正**:
  - GitHub Actions `gsc-url-inspection-daily.yml` の timeout-minutes を 20 → 30 に引き上げ（直近 run が 20m18s で cancel されていたため）
  - 1,500 URL 処理は約 8 分 + setup overhead を見込んで 30 分に余裕を持たせた

- **2026-04-27 PHASE-10 候補抽出 (A1 / A2 / A3)**:
  - **A1**: GSC last28d query 取得 (期間 2026-03-29 〜 2026-04-25)
    - 全クエリ 535 / 取得 Imp 1,747（GSC 全体 14,373 のうち 12%、残り 88% は匿名化 = GSC API 仕様）
    - Position 11-20 / Imp ≥ 10: **2 件のみ**（page-2 候補）
    - Position 4-10 / CTR 0% / Imp ≥ 10: **14 件**（機会損失候補、より大きなレバー）
    - 出力: `.claude/state/metrics/gsc/page2-queries-2026-W17.csv` / `ctr-zero-page1-queries-2026-W17.csv`

  - **A2**: 各クエリのヒット URL マトリクス取得
    - 16 クエリ → 13 URL（重複あり、1 URL に複数クエリ集約）
    - 出力: `.claude/state/metrics/gsc/page2-targets-2026-W17.csv` / `page2-url-aggregated-2026-W17.csv`

  - **A3 結果: 強化候補トップ 5（集約 Imp 順）**:

    | 順位 | URL | 集約 Imp | クエリ数 | Pos | 現状 SEO | 強化方針 |
    |---|---|---|---|---|---|---|
    | 1 | /blog/health-life-expectancy-structure | 104 | 1 | 12.0 | `seo_title` 設定済だが訴求弱い | リライト: 1 位県名・差分値入り (例: 「【2023】健康寿命ランキング47都道府県｜1位大分県・47位岩手県・差2.33歳」)|
    | 2 | /ranking/starting-salary-highschool | 59 | 3 | 6.9-9.0 | `seo_title` 設定済 | リライト: 1 位県名・金額入り |
    | 3 | /ranking/inpatient-rate-per-100k | 29 | 2 | 4.5-5.3 | **seo_title / seo_description が空** | 新規設定: 1 位県名・具体値入り（最大の機会、コスト最小）|
    | 4 | /blog/birth-rate-fertility-ranking | 19 | 1 | 5.1 | (要確認) | リライト |
    | 5 | /ranking/roadside-station-count | 14 | 1 | 11.2 | **seo_title / seo_description が空** | 新規設定: 1 位県名・駅数入り（最大の機会、コスト最小）|

  - **重要観察**: 全 5 候補で **CTR 0%**。順位 4-12 位なら CTR は通常 1-15% あるべき。**順位の問題ではなく、title/description の差別化問題が支配的**。
    - 候補 3, 5 は seo_title が **DB で空** → 設定するだけで CTR 0% → 5-10% の可能性大
    - 候補 1, 2, 4 は設定済だが訴求が弱い → 1 位県名・具体値リライト

  - **B1 + B3 のマージ**: コンテンツ加筆 (B1) と CTR リライト (B3) を分けるより、**5 件の seo_title / seo_description を一括再設計**するのが最小コスト最大効果。実装は DB UPDATE → `/sync-remote-d1` のみ（middleware / sitemap には触れない = PHASE-9 計測を汚さない）。

  - **次の Todo**: B1+B3 統合 として、5 件の seo_title / seo_description を DB に設定 + 反映。

### [PHASE-10] (B1+B3) トップ 5 SEO リライト本番反映

- **デプロイ日**: 2026-04-27 / Time Travel ブックマーク (sync 直前): `00003fdf-00000000-0000505a-dc965e7c2e8c9f96700d7a4586abce81`

- **対象 4 行** (5 候補のうち #4 fertility-rate-prefecture-gap は既存最適でリライト不要):
  1. ranking_items / starting-salary-highschool (Imp 59, Pos 6.9-9.0): seo_title リライト「【2023年】高卒初任給ランキング47都道府県｜1位 三重 20.8万円・47位 沖縄 16.5万円」
  2. ranking_items / inpatient-rate-per-100k (Imp 29, Pos 4.5-5.3): seo_title 新規設定「【2023年】入院受療率ランキング47都道府県｜1位 高知 1,785人・47位 神奈川 665人 (10万人あたり)」
  3. ranking_items / roadside-station-count (Imp 14, Pos 11.2): seo_title 新規設定「道の駅 数ランキング47都道府県｜1位 北海道 110か所・47位 東京 2か所 (2018年)」
  4. articles / health-life-expectancy-structure (Imp 104, Pos 12.0): seo_title リライト「【2023年】健康寿命ランキング47都道府県｜1位 大分県・47位 岩手県・差2.33歳」

- **共通設計原則**: 1 位県名・47 位県名・年度・具体値（数値+単位）・「47都道府県」キーワードを必ず含める。これにより「健康寿命ランキング 都 道府県 2023」のような具体的検索意図に直接マッチ + SERP 表示時に数値が目を引く

- **想定効果**: 4 件 × 平均 Imp 50 × CTR 改善 0% → 5% = +10 Click/月（短期、Google 再クロール後）。長期的には CTR 5-15% で +30-50 Click/月。
  根拠: 順位 4-12 位の標準 CTR は 1-15% (Advanced Web Ranking 2024 等の業界統計)。現状 0% は title が検索意図と乖離 or 訴求不足のシグナル

- **検証コマンド**:
  ```bash
  # 現値確認 (R2 item.json の seoTitle。完全DBレス。旧 D1 indicators / 本番 D1 は廃止)
  for key in starting-salary-highschool inpatient-rate-per-100k roadside-station-count; do
    echo "$key: $(curl -s "https://storage.stats47.jp/app/ranking/$key/item.json" | jq -r '.item.seoTitle')"
  done
  
  # 本番 origin の <title> 確認 (Googlebot UA)
  for url in https://stats47.jp/ranking/inpatient-rate-per-100k \
            https://stats47.jp/ranking/roadside-station-count \
            https://stats47.jp/ranking/starting-salary-highschool \
            https://stats47.jp/blog/health-life-expectancy-structure; do
    echo "=== $url ==="
    curl -s -A "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)" "$url" | grep -oE '<title>[^<]+</title>' | head -1
  done
  
  # 5/2 (W18) と 5/9 (W19) で当該クエリの CTR 推移を再測定
  /fetch-gsc-data last28d query
  ```

- **実測 (before, 2026-04-27 baseline、UPDATE 直前)**:
  - 本番 D1: ranking_items 2 件で seo_title NULL、1 件で「高卒初任給ランキング 都道府県別【2023年｜47都道府県比較】」(具体値なし)、articles 1 件で「都道府県別 健康寿命ランキング｜寿命は延びたが不健康期間も延びた」(年度・具体値なし)
  - GSC W17: 4 候補すべて CTR 0%、合計 Imp 206
    取得: `.claude/state/metrics/gsc/page2-targets-2026-W17.csv` / `page2-url-aggregated-2026-W17.csv`

- **実測 (after, 2026-04-27 デプロイ直後)**:
  - 本番 D1: 4 行すべて新 seo_title が rows_written=1 で UPDATE 成功
  - 本番 origin: 4 URL すべて新 `<title>` を即時返却（ISR キャッシュをすり抜け、revalidate 発動）
  - 完全な検証ログ: 本ファイルの直前のコマンド出力 + 上記 Time Travel ブックマーク

- **判定**: effect/pending [根拠: デプロイ直後、Google 再クロール待ち]
  - 早期警戒: 5/2 (W18) で当該 4 URL の CTR が依然として 0% なら title が SERP に反映されていない可能性。Google Search Console URL Inspection で再クロールリクエスト
  - 5/2 cutoff 目標: 4 URL 合計 Click +5（1 件あたり 1 click 以上）
  - 5/9 cutoff 目標: 4 URL 合計 Click +10、CTR 平均 5% 以上

- **未確定 / 仮説**:
  - **[仮説]** 1 位県名と具体値を入れた title が CTR を 0% → 5%+ に改善する
    検証: 上記 5/2 / 5/9 GSC スナップショット
    検証期日: 2026-05-09
    期日後判定: 4 URL の CTR 平均 ≥ 3% で仮説支持、< 1% で仮説棄却（その場合は別の要因 — 順位低下や検索意図の不一致）

- **PHASE-9 単一変数効果計測との分離**:
  - 本施策は middleware / sitemap / canonical には触れていない（DB UPDATE のみ）
  - PHASE-9 effect 判定（5/9）における登録ページ数・未登録件数の変化には影響しない
  - title/description リライトは「既存登録済 URL の CTR 改善」が目的のため、PHASE-9 (インデックス覆瀾改善) と独立に評価可能

### [PHASE-10] (B2-1) 新規記事追加: 病床利用率マップ

- **デプロイ日**: 2026-04-27 / Time Travel ブックマーク (sync 直前): `00003fe2-00000000-0000505a-2b5f5eb2f957adf1d3c3be42e22c88ed`
- **slug**: `hospital-bed-utilization-map`
- **公開 URL**: https://stats47.jp/blog/hospital-bed-utilization-map
- **公開フロー**: ローカル draft → publish-article → sync-articles (ローカル D1) → wrangler r2 object put × 6 ファイル → wrangler d1 execute INSERT (本番 D1) → 本番 origin で HTTP 200 確認

- **記事構成**:
  - title: 「病床は埋まっているか? 47都道府県」
  - seo_title: 「47都道府県の病床利用率ランキング2023｜佐賀81.5%・福島64.9%で16.6pt差」
  - チャート 4 個 (タイルマップ / 上位下位 bar / 受療率散布図 / 医師数散布図)
  - 内部リンク: 4 ranking ページ + 2 既存ブログ記事

- **想定効果** (3 ヶ月):
  - GSC 既存クエリ「一般病床の病床利用率が最も高い都道府県」(4 表現で計 Imp 284 / 月) の受け皿として確実な Click 化
  - 期待 Click +30-50/月 (CTR 5-10% 仮定)
  - 関連クエリ拡大による Imp +200-400/月
  - 既存 `/ranking/inpatient-rate-per-100k` (B1+B3 強化済) への内部リンクで相乗効果

- **検証コマンド**:
  ```bash
  curl -s -A "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)" \
    https://stats47.jp/blog/hospital-bed-utilization-map | grep -oE '<title>[^<]+</title>' | head -1
  
  # 5/2 (W18) と 5/9 (W19) で当該記事の Imp / Click を再測定
  /fetch-gsc-data last28d page
  ```

- **判定**: effect/pending [根拠: 公開直後、Google クロール待ち]
  - 5/2 cutoff 目標: ページ単位 Imp > 10 (Google が認識)
  - 5/9 cutoff 目標: ページ単位 Click > 5、関連クエリ群 (病床利用率系) 合計 Imp > 350

- **B2 残タスク** (W18 以降に着手検討):
  - B2-2: 食卓マップ (豆腐/焼酎/昆布) 記事
  - B2-3: 県債 × 所得分析記事

### [PHASE-10] (B2-2) 新規記事追加: 食卓マップ (豆腐・焼酎・昆布)

- **デプロイ日**: 2026-04-27
- **slug**: `food-trio-prefecture-map`
- **公開 URL**: https://stats47.jp/blog/food-trio-prefecture-map
- **対象クエリ**: 豆腐 +500% / 焼酎 +400% / 昆布 +160% (前期比、GSC W17)
- **想定効果** (3 ヶ月): 食材消費系クエリのインデックス受け皿として +50-150 Click/月
- **独自切り口**: 3 食材の地域パターン比較 + 「宮城が豆腐 1 位で焼酎 47 位」「北海道は昆布産地なのに消費 46 位」「京都の昆布消費 45 位 = 質的消費」など意外性で訴求
- **判定**: effect/pending [根拠: 公開直後、Google クロール待ち]

### [PHASE-10] (B2-3) 新規記事追加: 県債は誰が返す?

- **デプロイ日**: 2026-04-27
- **slug**: `prefectural-debt-future-burden`
- **公開 URL**: https://stats47.jp/blog/prefectural-debt-future-burden
- **対象クエリ**: 県債 +175% / 地方債 +175% / 所得 都道府県 +160% (前期比、GSC W17)
- **想定効果** (3 ヶ月): 地方財政・人口構造クエリで +30-100 Click/月
- **独自切り口**: 既存記事 `local-government-debt-burden` (歳入比ベース) と被らない **「将来負担スコア = 県債歳入比 × 高齢化率 ÷ 現役世代比率」** という独自指標で世代間負担を可視化。秋田 148.3 vs 東京 14.1 で 10 倍超の差
- **判定**: effect/pending [根拠: 公開直後、Google クロール待ち]

### [PHASE-10] B2 サマリー (2026-04-27 完了)

新規記事 3 本を 1 日で公開完了。GSC で急上昇している 3 つのクエリ群（医療需給 / 食材消費 / 地方財政）の受け皿を確立した:

| 記事 | 想定 Click 増/月 | 想定 Imp 増/月 |
|---|---|---|
| /blog/hospital-bed-utilization-map | +30-50 | +200-400 |
| /blog/food-trio-prefecture-map | +20-50 | +100-200 |
| /blog/prefectural-debt-future-burden | +15-30 | +50-150 |
| **合計** | **+65-130/月** | **+350-750/月** |

5/2 (W18) と 5/9 (W19) の GSC snapshot で実測予定。あわせて、これらの記事は B1+B3 で強化した既存 ranking ページへの内部リンクハブとして機能し、相乗効果が期待できる。

- **2026-04-27 sitemap audit (B1+B3 並行調査)**:
  - 実装ファイル: `apps/web/src/app/sitemap.ts` + `apps/web/src/app/sitemap.xml/route.ts`
  - 実 sitemap 確認 (curl): 各 segment の URL 件数
    - 0 (static): 8 / 1 (themes): 17 / 2 (areas): 141 / 3 (ranking): 338 / 4 (blog): 121 / 5 (categories): 17 / 6 (surveys): 42 / **7 (tags): 0**
  - **🔴 発見 1: tags segment 0 件**
    - 期待値: ローカル D1 で `count(*) >= 5` のタグが 8 件 (regional-disparity, declining-birthrate 等)
    - 実 sitemap: 0 URL
    - 推定原因: `sitemap.ts:225-227` の `catch {}` が D1 アクセスエラーを握りつぶして空配列で fallback。エラーログなしのため真因不明
    - 修正案 (PHASE-11-1): `catch (e) { console.error('sitemap segment failed', e); return []; }` で観測性向上 → 本番デプロイ後 Cloudflare Pages logs で真因特定
    - 影響: 5+ 記事のタグ 8 件が Google にクロールされない（小規模だが取りこぼし）
  - **🟡 発見 2: lastmod が blog 以外なし**
    - PHASE-9 で「bulk timestamp 同一値で Google が無視」を回避するため意図的削除
    - 副作用: ranking が新年度データに更新されても Google に通知できない
    - 改善案 (PHASE-11-2): `ranking_data.max(updated_at) by ranking_key` を引いて URL ごとに lastmod 設定
  - **🟡 発見 3: INDEXABLE_RANKING_KEYS 338/1,920 = 17% のみ sitemap 入り**
    - 戦略判断による 80% 除外。残り 1,582 件は 410 で意図的に index 除外
    - 5/9 効果判定後に再選定するか継続するかは経営判断 (PHASE-11-3)
  - **5/9 まで sitemap には触らない方針** — PHASE-9 単一変数効果計測の独立性確保のため

### [INDEXING-AUTO-01] Indexing API による問題 URL 自動再送信 — RETIRED 2026-07-23

> **⚠️ RETIRED 2026-07-23**（準拠正典:
> `.claude/skills/analytics/search-growth/reference/platform-contract.md`）: Google Indexing API の公式対象は
> JobPosting または BroadcastEvent を含む VideoObject ページのみ
> (https://developers.google.com/search/apis/indexing-api/v3/quickstart、アクセス日 2026-07-23。
> "can only be used to crawl pages with either job posting or broadcast event markup")。
> 下記 2026-06-06 時点の「汎用ページも URL_UPDATED で再クロール促進は可能」は **公式仕様の誤読** であり訂正する。
> 通常ページ (ranking/area/theme/blog/410) への送信を停止し、sitemap/内部リンク/canonical/content 修正 +
> URL Inspection 観測 (observe-after-fix) へ移行した。cron `gsc-auto-resubmit-daily.yml` は schedule 削除・
> retired stub 化、`auto-resubmit.mjs`/`submit-cities-indexing.mjs` は publish path 撤去済。
> **過去の送信ログ (下記実績・`resubmit-history.json`) は監査証拠として保持する (削除しない)。**

以下は退役前の履歴 (証拠として保持):

- **デプロイ日**: 2026-05-23 (初回送信), 2026-06-06 (全 CSV 集約修正)
- **想定効果 (当時・仕様誤読を含む)**: 「クロール済み - インデックス未登録」の URL が Indexing API `URL_UPDATED` で再クロール → インデックス率向上。200 URL/day 上限で段階的に改善。~~汎用ページも `URL_UPDATED` で再クロール促進は可能~~ ← **誤り (上記 RETIRED 注記で訂正)**。効果は補助的。
- **自動化**: `.github/workflows/gsc-auto-resubmit-daily.yml` (毎日 JST 06:30 = UTC 21:30)
- **スクリプト**: `.claude/scripts/gsc/auto-resubmit.mjs --execute --max 200`
- **入力**: `.claude/state/metrics/gsc/coverage-drilldown/` 以下の全 CSV (indexed-submitted 除外)、7 日以内 dedup
- **実績 (2026-06-06 時点)**:
  - 総送信: 2,235 success / 386 error (うち quota 超過・resubmit 系)
  - 最終送信: 2026-06-06 JST 06:30 (200 URLs)
  - 現在のプール: 1,825 URLs (dedup 後、3,149 ユニーク URL 中)
- **2026-06-06 修正**: `findLatestCsv` (最新 1 件) → `findAllCsvs` (全 CSV 集約) に変更。W23 ドリルダウン (1 URL) 追加後に W22 unindexed-urls-combined.csv (3,140 URL) が無視される問題を修正。
- **検証コマンド**: `node .claude/scripts/gsc/auto-resubmit.mjs --dry-run`
- **実測**: effect/pending [送信済みだが Google インデックス反映を URL Inspection で未観測。検証期日: 2026-06-20、`node .claude/scripts/gsc/url-inspection-daily.cjs --limit 50` で coverageState 変化を確認]
- **未確定 / 仮説**:
  - **[仮説]** Indexing API 送信で 30 日以内に一部 URL の coverageState が「送信して登録されました」に遷移する。検証期日: 2026-06-20
  - **注意**: `redirect-urls.csv` (W19) も含まれているが、リダイレクト先の最終 URL は別途 sitemap に含まれているため送信は無害 (dedup で再送 7 日制限あり)。

### [COVERAGE-LOOP-01] GSC カバレッジ是正ループ構築 + 初回サイクル

- **構築日**: 2026-06-16 / 正典: `.claude/skills/analytics/gsc-coverage-remediation/SKILL.md` (旧 docs/02 doc 12 を 2026-07-12 統合) / スキル: `/gsc-coverage-remediation`
- **背景**: GSC「ページ」未登録 ~17,900 件 (登録済 ~2,600)。実 URL で精査すると **大半は意図的削除・旧URL・設計ブロックで是正対象外**。「sitemap が参照しているのに 404/soft404/5xx = 生きてるのに誤登録」だけが真の actionable と判明。これを週次で順次是正する閉ループを構築。
- **構築物**:
  - `ingest-gsc-export.py` — GSC UI export (cp932 zip) を正規化 → `coverage-drilldown/<週>/<category>-drilldown.csv` + `category-totals.json` + `coverage-trend.csv`
  - `build-coverage-queue.mjs` — actionable URL を本番 HTTP 実測 (Googlebot UA) → A/B 分類 → SSOT `.claude/state/gsc/coverage-remediation-queue.json` (状態保持) + `LATEST.md` + `coverage-totals-history.csv` + curated `coverage-live-resubmit-urls.csv`
  - `/gsc-coverage-remediation` skill — 取り込み→ビルド→content-check を gsc-analyst 委譲→記録→経過観測
  - **命名規約**: 生 drilldown は `-drilldown.csv` (auto-resubmit が拾わない)。live だけ curated `-urls.csv` に出す → INDEXING-AUTO-01 の「死んだ404を送信して quota 浪費」を構造的に回避 (上記 redirect-urls.csv 注意の再発防止)。
- **初回サイクル実測 (2026-06-16, week 2026-W25)**:
  - GSC 総件数: 404=8,378 / crawled-not-indexed=2,937 / robots=2,651 / noindex=1,434 / redirect=1,277 / soft404=383 / 5xx=200
  - 本番実測で actionable 追跡 1,583 URL → 要対応 **190 件**: resubmit 85 (404/5xx→現在200・例 `ranking/income-per-capita`/`birthrate-total`) / content-check 97 (soft404→現在200) / fix-5xx 1 (`/opengraph-image?…` 500) / verify-intent 7 (旧内部パス `/tmp/*.json`・`/.local/d1` 等、404維持が正)
  - curated 再送信 CSV 85 URL 出力済 (`coverage-drilldown/2026-W25/coverage-live-resubmit-urls.csv`) → `gsc-auto-resubmit-daily.yml` が次回拾う
- **想定効果**: resubmit 85 件の indexed 化 + soft404 97 件のうち補強分。根拠: 全件 200 を本番実測済 (生存確認)。トレンドは登録済 1,371(5/05)→2,604(6/12) 回復・未登録 20,239(6/05)→17,893(6/12) 減少 (出典: GSC「ページ」推移 CSV `coverage-trend.csv`)
- **検証コマンド**: `python3 .claude/scripts/gsc/ingest-gsc-export.py && node .claude/scripts/gsc/build-coverage-queue.mjs` (次週 export 後) → `coverage-totals-history.csv` で 404/soft404 件数減・登録済増を確認 / 個別は `node .claude/scripts/gsc/url-inspection-daily.cjs --limit 50`
- **判定**: pending [構築完了・初回キュー生成済。effect は次週 export 後の件数差 + resubmit URL の coverageState 遷移を実測してから。検証期日: 2026-06-23]
- **未確定 / 仮説**:
  - **[仮説]** resubmit 85 件は既に 200 を返す生存ページなので、Indexing API 送信で 1-2 週内に coverageState が「送信して登録されました」へ遷移する。検証期日: 2026-06-23、`url-inspection-daily.cjs` で確認。期日後に遷移ゼロなら sitemap 未掲載を疑い `KNOWN_RANKING_KEYS`/sitemap 整合を確認 (`project_ranking_publish_pipeline_gap`)。
  - **[仮説]** soft404 97 件の一部は観測値が薄い (1年のみ等)。content-check (gsc-analyst) で R2 観測値の年数を確認し、thin なら補強 or noindex、十分なら resubmit 格上げ。

- **2026-06-16 content-check 実行結果 (soft404→現在200 の 97 件を gsc-analyst 2体で実データ判定)**:
  - **resubmit 6** (データ完備=Google の誤判定 → curated CSV に格上げ、85→91): `themes/labor-wages` (client-rendered chart で JS 未クロール) + ranking 5 (`other-charges-consumption-expenditure` 47pref/18yr・`nursery-teacher-annual-income` 47pref/13yr・`public-health-nurse-annual-income`・`high-school-teacher-annual-income` 各47pref/3yr・`barber-beautician-annual-income` 42pref/3yr、全て ai-content あり)
  - **deactivate 32** (★真の修正対象): `university-advancement`/`electricity-consumption`/`agricultural-output-city`/`ssdse-*` 系等 **32 ranking が 200 を返すのに `values.json` 404 = データ無しの空ページ**。`packages/data-configs/src/metrics/<key>.ts` に config も無く、`KNOWN_RANKING_KEYS` に残った orphan が空シェルを 200 描画している (`project_ranking_publish_pipeline_gap` の逆パターン)。→ KNOWN/sitemap から除去し 404/410 化 or noindex すべき (resubmit は禁物=空ページを送信してしまう)
  - **noindex 13**: city ページ 7 (`/areas/{pref}/cities/{city}` SSR本文 ~92字の空テンプレ) + `/search` 1 + 未公開 blog 5 (`migration-destination-ranking-factors` 等、200 で本文0=公開されたことがない) → robots noindex or 正しく 410
  - **enrich 46**: area×category 45 (`/areas/{pref}/labor-wages` 等、本文6870字が全県一致=全国チャート流用で県名のみ差。Google の near-duplicate 判定は正しい→県別データ補強まで indexing 不適) + 未公開だが md ありの blog 1 (`medical-access-regional-gap`)
  - **判定**: content-check 完了。verdict は SSOT (`coverage-remediation-queue.json` の `content_verdict`/`content_signal`) に永続化済 (build の HTTP 再分類で上書きされない)。resubmit 6 は次回 CI で送信。deactivate/noindex/enrich はコード/config 変更が要るため follow-up (下記)。
- **follow-up (COVERAGE-LOOP-01 から派生)**:
  1. **deactivate 32 → COVERAGE-DEACT-01 実装済 (2026-06-16)**: 根本原因は **stale ISR prerender** — 本 OpenNext 構成は revalidate が効かず、過去デプロイ時の prerender 200 が再デプロイまで配信される (`feedback_home_pure_ssg_r2_empty`、`x-nextjs-cache: STALE` で確認)。32 本は現在 config も R2 (all.json 2169/item.json/values.json) も無いのに stale 200 を返していた。→ `apps/web/src/config/gone-ranking-keys.ts` に 32 本追加 (middleware:72 `isGone`→410 で stale ページより前段で短絡)。KNOWN(2121)/sitemap には元々不在のため変更不要。GONE∩KNOWN=0 検証済・url-policy test 13/13 pass。**次デプロイで有効化** → 本番 410 を Googlebot UA で実測したら queue を done に。queue: content_verdict=deactivate / wave 2026-06-16-coverage-deact / status in-progress。
  2. **noindex 13** (未着手): city/search/未公開blog を noindex or 410。
  3. **enrich 46** (未着手): area×category の県別データ化 (全国テンプレ流用の解消)。情報設計 `docs/01_技術設計/03_情報設計.md` の area ページ責務と併せて判断。

- **2026-08-24 再監査・対策実装 (wave `2026-08-24-gsc-indexability`)**:
  - W32 GSC export 2,456 URL を Googlebot UA で再実測。HTTP 200 の374 URLは HTML の robots と not-found title も検査し、未修正の **200 soft-404 74件**（ranking 52 / blog 10 / city 12）を分離した。
  - ranking/blog の未登録 slug は middleware allowlist で 410、実在 city は親県解決を修正し、整備済み360市のみ index・その他は noindex。area×theme 29件は県固有の最新観測値を server HTML に追加。localhost で 410 / noindex / 固有本文を実測済み。
  - 監視誤差を是正: URL fragment を除去・重複排除、設定移設後0件になっていた KNOWN/GONE 読込先を修正、検索実績/是正キュー/既知/削除URLを日次ローテーション。sitemap・OGP・静的素材と正常noindexを設計どおりへ自動分類する。
  - queue は pending 419→170、in-progress 105、resolved-by-design 2,181。旧survey/内部資産404 14件は発生源修正済みとして resolved-by-design。**effect/pending** — deploy 後に74件の410/noindexと29件の固有本文を本番実測し、次週GSC export / URL Inspectionで減少を確認する。

### [PHASE-9-FOLLOWUP] Cloudflare token 集約 + Smoke Test cascade fix

- **対応日**: 2026-04-26 / コミット: `e97b6db7`
- **内容**:
  - Cloudflare API token を「stats47」1 個に集約（D1 Edit + R2 Storage Edit + Pages Edit + Account Settings Read）
  - 旧 token 7 個を Cloudflare ダッシュボードから削除
  - GitHub Actions の PR 作成 permission を有効化（`gh api -X PUT /repos/.../actions/permissions/workflow`）
  - Phase 9 デプロイで smoke-test の `/areas/01000/landweather` 200 期待が 410 仕様と矛盾し失敗 → smoke-test を 410 期待に修正 + `population` ケース新設

- **教訓**: middleware 仕様変更時は **post-deploy smoke test を事前更新** すること（→ knowledge 記録: 「Phase 9 deploy が smoke-test を破壊した cascade」）
