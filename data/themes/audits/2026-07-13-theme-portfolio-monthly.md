---
type: theme-portfolio-monthly
date: 2026-07-13
period: 2026-W28 vs 2026-W24
status: completed
tags: [theme, portfolio, monthly-audit]
---

# テーマポートフォリオ月次監査 (2026-07-13)

対象期間 = 直近28日 (GSC/GA4 snapshot 2026-W28、window は各週 last-28d)。比較期間 = その前の28日
(2026-W24)。56d 基本判定 (両週合算) は本日同セッション内の PR-2/3/4 で portfolio.json に構築済みのため、
本監査はその**再実行 (drift 確認)** + **28d 単独比較の追加分析**を主眼とする。

## 実行結果サマリ

`bash .claude/scripts/themes/run-theme-portfolio-audit.sh` を実行し、以下を確認した。

- build (機械項目再導出): 22 themes (catalog 20 / legacy 2) — 変更なし
- aggregate (56d実測): GSC measured 0/22 (全 measured-low) / GA4 measured 2/22 (local-finance・population-dynamics)
- validate: `theme state 違反なし`
- 実験期日チェック: pending 0 件・期日到達 0 件
- **drift (git HEAD との差分): なし** — 本日の PR-2/3/4 で構築した state から変化なし

## ポートフォリオ現況

期間: GSC/GA4 = 56d 合算 (2026-W24 + 2026-W28)。

| themeKey | lifecycle | GSC imp 56d (measured status) | GA4 pv 56d (status) | データ品質 | reviewGate |
|---|---|---|---|---|---|
| aging-society | improve | 75 (low) | 76 (low) | ok | proposal-ready |
| climate | improve | 23 (low) | 62 (low) | ok | ready-after-station-normal-audit |
| consumer-prices | improve | 43 (low) | 56 (low) | ok | ready-after-content-audit |
| education-culture | split-candidate | 16 (low) | 38 (low) | ok | ready-after-source-denominator-audit |
| fishery-marine | improve | 158 (low) | 93 (low) | ok | ready-after-scope-series-audit |
| foreign-residents | improve | 10 (low) | 28 (low) | ok | ready-after-definition-source-audit |
| healthcare | improve | 22 (low) | 88 (low) | ok | proposal-ready |
| labor-mobility | improve | 25 (low) | 30 (low) | ok | ready-after-definition-audit |
| labor-wages | improve | 7 (low) | 28 (low) | ok | ready-after-definition-audit |
| living-housing | improve | 16 (low) | 76 (low) | **gaps** (欠1/13) | proposal-ready |
| local-economy | improve | 20 (low) | 44 (low) | ok | blocked-by-core-metric-audit |
| local-finance | improve | 36 (low) | **213 (measured)** | ok | ready-after-scope-composition-audit |
| local-finance-city | improve | 0 (low) | 2 (low) | ok | blocked-fiscal-entity-scope-audit |
| manufacturing | improve | 22 (low) | 24 (low) | **gaps** (欠4/12) | ready-after-series-definition-audit |
| occupation-salary | improve | 3 (low) | 20 (low) | ok | blocked-by-series-audit |
| population-dynamics | improve | 100 (low) | **206 (measured)** | ok | proposal-ready |
| ports | improve | 1 (low) | 10 (low) | ok | ready-after-table-dimension-audit |
| railway | improve | 32 (low) | 46 (low) | ok | ready-after-geography-series-audit |
| real-income | improve | 10 (low) | 29 (low) | ok | blocked-by-derived-metric-audit |
| roads | improve | 20 (low) | 23 (low) | ok | ready-after-definition-additivity-audit |
| safety | split-candidate | 21 (low) | 12 (low) | ok | ready-after-denominator-provenance-audit |
| tourism | improve | 72 (low) | 97 (low) | ok | ready-after-scope-series-audit |

**全22テーマ GSC は measured-low (impressions 200 未満/56d)、GA4 は 2 テーマのみ measured (views 100
以上/56d)。標本不足は計測できていない (insufficient-data) ではなく「集計できたが値が低い」
(measured-low)。これ自体が「テーマは検索集客面ではなく回遊面」という 03_情報設計の役割分担を裏付ける
実測** (03_情報設計・PR-3 監査結果を参照)。

## 28日単独比較 (直近28日 W28 vs 前28日 W24) — 補助情報

**56d 合算とは別に、依頼された「直近28日 vs その前の28日」を各週単独 (1 週 = last-28d 窓) で比較した。
低カウント帯のため実数差で報告し、率や±数件の変動をトレンドと断定しない。**

### GSC (clicks / impressions、W28 vs W24)

| themeKey | W28 | W24 | Δclicks | Δimp |
|---|---|---|---|---|
| fishery-marine | 2/101 | 0/57 | +2 | +44 |
| population-dynamics | 2/65 | 0/35 | +2 | +30 |
| aging-society | 0/55 | 0/20 | 0 | +35 |
| education-culture | 0/1 | 0/15 | 0 | -14 |
| labor-mobility | 1/6 | 0/19 | +1 | -13 |
| foreign-residents | 0/0 | 1/10 | -1 | -10 |
| healthcare | 0/6 | 1/16 | -1 | -10 |
| roads | 1/14 | 0/6 | +1 | +8 |
| manufacturing | 1/15 | 0/7 | +1 | +8 |
| consumer-prices | 0/18 | 2/25 | -2 | -7 |
| climate | 0/8 | 0/15 | 0 | -7 |
| tourism | 0/33 | 1/39 | -1 | -6 |
| real-income | 0/2 | 0/8 | 0 | -6 |
| living-housing | 0/6 | 0/10 | 0 | -4 |
| local-finance | 0/28 | 0/23 | 0 | +5 |
| local-economy | 0/9 | 1/11 | -1 | -2 |
| railway | 0/17 | 1/15 | -1 | +2 |
| labor-wages | 0/4 | 0/3 | 0 | +1 |
| ports | 0/1 | 0/0 | 0 | +1 |
| safety | 0/11 | 0/10 | 0 | +1 |
| occupation-salary | 0/1 | 0/2 | 0 | -1 |

GSC clicks は元々ほぼ全テーマが 0-2 件/週で、W28→W24 の差分は単発クリックのばらつきの範囲内。
impressions の変動も 1-44 件と少数で統計的トレンドとは言えない。

### GA4 (pageViews / activeUsers、W28 vs W24)

| themeKey | W28 pv | W24 pv | Δpv |
|---|---|---|---|
| **local-finance** | 197 | 36 | **+161** |
| **population-dynamics** | 63 | 143 | **-80** |
| healthcare | 71 | 17 | +54 |
| living-housing | 54 | 22 | +32 |
| tourism | 26 | 71 | -45 |
| fishery-marine | 58 | 35 | +23 |
| climate | 43 | 19 | +24 |
| roads | 19 | 4 | +15 |
| real-income | 21 | 8 | +13 |
| manufacturing | 17 | 7 | +10 |
| aging-society | 45 | 31 | +14 |
| labor-mobility | 19 | 11 | +8 |
| foreign-residents | 18 | 10 | +8 |
| railway | 27 | 19 | +8 |
| consumer-prices | 31 | 25 | +6 |
| ports | 8 | 2 | +6 |
| education-culture | 21 | 17 | +4 |
| labor-wages | 16 | 12 | +4 |
| safety | 8 | 4 | +4 |
| occupation-salary | 11 | 9 | +2 |
| local-finance-city | 2 | 0 | +2 |
| local-economy | 20 | 24 | -4 |

**local-finance の +161pv (30→197) と population-dynamics の -80pv (143→63) は注視対象**。
7週トレンド (W22-W28) を確認すると:
- local-finance: 72 / 43 / 36 / 78 / 79 / 101 / **197** — W25以降ゆるやかな上昇傾向にあった上で
  W28 に急伸。単週の急変であり、原因 (SNS流入・検索順位変動・季節性) は未特定。
- population-dynamics: 41 / 75 / 143 / 166 / 142 / 124 / **63** — W24-W27 で 124-166 の高水準を
  維持していたが W28 で急落。

いずれも **56d 基本判定 (measured / measured-low ステータス) には影響しない** (GA4 の 56d 集計値
local-finance=213pv・population-dynamics=206pv は W24+W28 合算のため、この単週変動を織り込み済み)。
原因未特定のため lifecycle 判定への反映は行わない。継続観測 (次回 2026-08 監査) で持続性を確認する。

## カタログ↔portfolio drift 監査

`run-theme-portfolio-audit.sh` の drift チェック (git HEAD の portfolio.json との比較) で **差分なし**
(lifecycleStatus / dataQualityStatus / reviewGate / latestDataYear / metrics.{gsc,ga4}.status のいずれも不変)。
本日 (2026-07-13) 同セッション内で PR-2〜PR-4 が完了しており、22 テーマ全てに reviewStatus=reviewed
(レビュー文書 2026-07-1{1,2,3} 対応済み) が付与されている。reviewStatus=stale (レビュー後にカタログが
大きく変わった) のテーマは **0 件**。

reviewGate は 22 テーマ中 4 件が `proposal-ready` (aging-society / healthcare / living-housing /
population-dynamics)、残り 18 件は各種 audit 待ち (`ready-after-*` 16件 / `blocked-by-*` 2件相当)。
これは `.claude/skills/theme/manage-theme-portfolio/reference/theme-improvement-execution.md`
の採択ゲート運用に従うものであり、本監査ではレビュー文書とカタログの乖離は検出しなかった。

## データ鮮度・欠測・出典確認日の監査

- **latestDataYear**: 2023年データのまま最新化されていないテーマ = fishery-marine / healthcare /
  occupation-salary / ports / roads (5テーマ)。5年超前の閾値 (`dataQualityStatus=stale-data`) には
  該当しない (2023年は2年前) が、他17テーマが2024-2025年に対し遅れている。
- **dataQuality gaps (values.json 欠測)**:
  - `living-housing`: 13キー中1件欠測 (`housing-floor-area`)
  - `manufacturing`: 12キー中4件欠測 (`manufacturing-sales-private` / `manufacturing-net-value-added-private`
    / `industrial-land-price` / `industrial-land-price-change-rate`) — **欠測率33%と突出**
- **officialSourceReviewedAt**: 全22テーマがレビュー文書の日付 (2026-07-1{1,2,3}) と一致しており
  出典確認済み。

## 実験期日

`node .claude/scripts/themes/evaluate-theme-experiments.mjs --check` の結果、experiments.json は
**0 件** (pending 0・期日到達 0)。今回のセッションで新規実験の登録は行わない (判定変更なし・
根拠不足のため baseline を立てる材料が無い)。

## 判定変更

**このセッションでの lifecycle 変更は「なし」。** 理由:
- drift チェックで前回 (本日同セッション内 PR-2/PR-4) からの変化を検出せず、既存判定
  (`improve` 20 / `split-candidate` 2: education-culture・safety) は引き続き根拠 (evidenceRefs≥2・
  GSC/GA4 両輪 measured-low・56d) を満たしている。
- 28d 単独比較で観測した local-finance / population-dynamics の急変は原因未特定・単週変動であり、
  merge/retire 等の判定変更には使えない (evidence-based-judgment.md の「季節性・順位変動の注記」対象)。

## 改善候補 (improvement-triage への引き渡し)

3件を導出。詳細は本レポート末尾の「引き渡しブロック」参照。

1. **THEME-MANUFACTURING-01**: dataQuality gaps 是正 (欠測率33%、4/12キー)
2. **THEME-INTERNALNAV-01**: theme→ranking/blog 内部遷移の GA4 計装 (全22テーマ共通の構造課題)
3. **THEME-LOCALFINANCE-01**: local-finance W28 急伸 (+161pv) の流入源特定と再現性検証

## 特記事項

- 全22テーマ GSC measured-low は「データ不足」ではなく「テーマは検索面でなく回遊面」という設計意図の
  実測裏付け (03_情報設計)。merge/retire 判定の材料にする場合は GA4 の回遊指標 (現状 not-instrumented)
  の計装が前提になる。
- reviewGate の大半 (18/22) が `ready-after-*` / `blocked-by-*` = improvement execution referenceの採択ゲート待ち。次回監査までに
  theme-researcher/theme-designer への調査依頼が進捗すれば reviewGate 分布が変わる見込み。
- manufacturing の欠測4/12は改善候補として最優先 (dataQualityStatus=gaps の中で最も欠測率が高い)。
- local-finance/population-dynamics の単週変動は次回監査 (2026-08-01 目安) で持続性を再確認する。
- R2 push / deploy / カタログ編集は本監査で一切行っていない (build/aggregate/validate の read-derive のみ)。

---

## 改善候補 引き渡しブロック (verbatim → improvement-triage)

### [THEME-MANUFACTURING-01] manufacturing テーマのデータ欠測 (4/12キー) を是正する
- テーマ: manufacturing / 種別: 計装 (データ欠測)
- 根拠: `.claude/state/themes/portfolio.json` の `dataQuality` 実測 — 12キー中4件が R2
  `app/ranking/<key>/values.json` で欠測 (`manufacturing-sales-private` / `manufacturing-net-value-added-private`
  / `industrial-land-price` / `industrial-land-price-change-rate`)。欠測率33%は22テーマ中最高
  (次点 living-housing は 1/13=8%)。
- 想定効果: チャート描画欠損の解消。定量効果は未測定 (根拠: 欠測キーがどのチャート/指標役割
  (primary/secondary/context) に紐づくかは ThemeCatalog 側の役割確認が必要、本監査ではデータ層のみ確認)
- 検証: `node .claude/scripts/themes/aggregate-theme-metrics.ts` 実行後、
  `portfolio.json` の `manufacturing.dataQuality.missingKeys` が 0 になることを確認
- 期日: 2026-08-01 (次回月次監査までに是正状況を確認)

### [THEME-INTERNALNAV-01] テーマ→ranking/blog の内部遷移計装 (GA4 not-instrumented) を追加する
- テーマ: 全22テーマ共通 / 種別: 計装
- 根拠: `.claude/state/themes/README.md` §1.3 および全22テーマの `metrics.internalNav.status` =
  `not-instrumented` (portfolio.json 実測)。GSC/GA4 週次 snapshot に theme→ranking/blog の遷移・
  指標クリックのイベント/リンク先粒度が無い。テーマページの本来の役割 (03_情報設計: 回遊ハブ) を
  評価する主要指標が構造的に測れていない。
- 想定効果: merge/retire 判定の主要ブロッカー解消。現状 GSC measured-low (全22テーマ imp<200/56d)
  のみでは「需要不足」の判断はできるが「回遊寄与」は測れず、taxonomy referenceの再編判定が不完全。
- 検証: GA4 custom event (例: `theme_to_ranking_click` 等) 実装後、
  `.claude/skills/analytics/ga4-improvement/reference/snapshots/<週>/pages.csv` 相当のイベント別
  snapshot でテーマ別遷移数が取得できること
- 期日: 未定 (実装工数次第。improvement-triage 側で優先度判断を依頼)

### [THEME-LOCALFINANCE-01] local-finance W28 急伸 (+161pv) の流入源特定
- テーマ: local-finance / 種別: 計測・調査
- 根拠: GA4 週次実測 (`.claude/skills/analytics/ga4-improvement/reference/snapshots/2026-W28/pages.csv`
  vs `2026-W24/pages.csv`) — pageViews が 36→197 (+161、+447%)。7週トレンド (W22:72→W23:43→W24:36→
  W25:78→W26:79→W27:101→W28:197) では W25 以降ゆるやかな上昇の上に W28 で急伸。同時に
  engagementRate は 0.786→0.165 に急落 (流入元の質が変化した可能性)。
- 想定効果: 流入源 (SNS/検索/リファラー) が特定できれば再現可能な成長パターンとして横展開できる。
  定量予測は未算出 (根拠不足、まず流入源調査が必要)
- 検証: GA4 の参照元/メディア (source/medium) ディメンションでの `/themes/local-finance` 内訳取得
  (`.claude/scripts/lib` の GA4 fetch スクリプト、dimension `sessionSource,sessionMedium` を追加指定)
- 期日: 2026-07-20 (2週間以内に流入源を特定し、持続性を次回定例監査 2026-08-01 で再評価)
