# 計測→記録→改善サイクル — 2026-W43

計測週 **2026-W43**（GA4 rolling28d 2026-09-27〜2026-10-24、Japan-only）。前週との差は重複期間なので WoW ではない。

| 入力 | 状態 |
|---|---|
| ga4 | ok（transitions=ok landing=ok events=ok pages-clean=ok） |
| customDimensions | ok（登録済み 34 件） |
| ga4Settings | ok（keyEvents=affiliate_click|contact_click|cta_click|file_download|purchase bigQueryLinks=1 warnings=none） |
| improvements | ok（active 5 件） |
| effectVerdicts | ok（verdicts-2026-W43.json） |

**KPI ツリー**（正典: 事業計画 catalog → `data/business-plan/kpi-tree.json`。比較は 4 週前 2026-W39 = 窓が重ならない値。★ = 今月の重点レーンの KPI）

| 階層 | KPI | 今週 | 比較 | 目標 | 状態 | 施策 |
|---|---|---|---|---|---|---|
| NSM | 週次収益 | — | — | — | see-nsm（内訳と判定不能の理由は週次 Issue の「週次収益 (NSM)」節） | — |
| 駆動 | 有料購入 | — | — | — | unmeasurable（KDP 判定不能（日別の観測 0/7 日） / note 判定不能（最終観測 2026-10-17 が週より前）） | `NOTE-FISCAL-PEER-SALES-01` |
| 駆動 | ★ 検索クリック (GSC rolling28d) | 14733 | 9947 | 20,000（2026-W52） | ok | `SEO-TITLE-CTR-EFFECT-01`, `MUNI-PAGE-SEO-01` |
| 駆動 | ページビュー (GA4 Japan 確定7日×4週) | 48338 | 42736 | 79,000（2026-W52） | ok | — |
| 駆動 | 広告収益効率 (AdSense) | — | — | — | pending（再開 (2026-10-11) 前の週 2026-W40・2026-W41 を含む。再開後 4 週は 2026-W42 から数える。停止前 W30〜W33 は ¥22 (自動広告込み)） | `ADSENSE-PLACEMENT-01` |
| 駆動 | サイト内回遊率 (代表値: ブログ→ランキング) | 9.7% | 7.8% | — | ok | `RELATED-ARTICLES-EFFECT-01` |
| 駆動 | アフィリエイト収益効率 | GA4 7日 imp 4239・click 8 | — | — | partial（最終観測 2026-10-24。収益効率 (確定収益/1,000 imp) は ASP 成果と合わせて NSM 節で判定する） | — |
| 駆動 | 業務文脈の着地セッション | 4555 | 3350 | — | ok | — |
| 守り | ★ データ品質ゲート通過率 | 100.0% (2459/2459) | 99.5% | — | ok（監査 2026-10-26） | — |
| 守り | ★ サイト健全性 | PSI モバイル中央値 78・Workers error 0.0% | — | — | ok | — |
| 守り | ★ 運用コスト | 閾値違反 21 件・R2 保存 39.915 GB | — | — | ok | — |
| 守り | ★ 計測の鮮度 | 9/11 | — | — | degraded（欠測・古い・認証切れ: gsc(auth_required), kdp(auth_required)） | — |

**施策の配線**: active 5 件（上限 5 件）・KPI 未接続 0 件・`[target:]` なし 5 件

重点レーンの KPI なのに施策が 0 件: `data-quality-pass-rate`, `site-health`, `operating-cost`, `measurement-freshness`（今月の重点を動かす施策が台帳に無い）

**回遊（referrer 集計）**

| 遷移 | page_view | 遷移元 PV | 率 |
|---|---:|---:|---:|
| blog → ranking | 1055 | 10864 | 9.7% |
| themes → ranking | 157 | 857 | 18.3% |
| themes → blog | 16 | 857 | 1.9% |

**サイト内クリックの計測**: 導線名付きクリック 6012 ÷ サイト内の移動 20110 = 被覆率 29.9%。nav_click 15215 件のうち導線名なし 60.5%

導線名なしの行き先 (上位。次に導線名を付ける候補):
- ranking — 2829 クリック
- geo — 1646 クリック
- municipalities — 1587 クリック
- areas — 840 クリック
- api — 647 クリック
- home — 421 クリック
- themes — 342 クリック
- category — 336 クリック

**業務文脈の着地**（平均: PC 50.8%・平日 9–18 時 49.2%。両方が平均超かつ 25 セッション以上。行政実務者である証明ではない）

- `/blog/automotive-industry-transformation-map` — 499 セッション・PC 80.6%・平日業務時間 74.0%
- `/` — 511 セッション・PC 79.3%・平日業務時間 60.2%
- `/geo/datasets/A52` — 99 セッション・PC 97.0%・平日業務時間 82.7%
- `/ranking/specific-health-checkup-participation-rate` — 153 セッション・PC 71.9%・平日業務時間 67.3%
- `/blog/rice-harvest-volume-prefecture-gap` — 127 セッション・PC 80.3%・平日業務時間 69.4%
- `/ranking/rice-consumption-quantity` — 129 セッション・PC 74.4%・平日業務時間 71.2%
- `/ranking/habitable-area-ratio` — 88 セッション・PC 78.4%・平日業務時間 94.5%
- `/ranking` — 90 セッション・PC 96.7%・平日業務時間 63.3%

**未登録の custom dimension**（0 パラメータ。登録はオーナー作業・遡及しない）


**効果判定エンジン**（2026-W43）: adsense 1 件 {"effect/pending":1} / gsc-improvement 1 件 {"effect/pending":1}

GSC 施策 2 件中、機械判定できるのは 0 件。残りは目印が欠けている（目標値は根拠があるときだけ書く）:

- `SEO-TITLE-CTR-EFFECT-01`: [target: +N clicks]
- `MUNI-PAGE-SEO-01`: [gsc-page: /path]・[target: +N clicks]

**運用系の計測**（直近 7 日。閾値違反は日次 alert Issue と同じ判定。改善の判断は人）

| 計測 | 状態 | 要約 | 閾値違反 | active 施策 |
|---|---|---|---|---|
| PSI | ok（最新 2026-10-25） | モバイル中央値 78 点・最低 /ranking/total-population 45 / /ranking/annual-sunshine-duration 56 / /ranking/future-population-change-rate-2050 62 | 最新日 27/38 計測で error | なし |
| Cloudflare | ok（最新 2026-10-25） | Workers 584511 req・error 0.0%・R2 A 88896 / B 5411085・保存 39.915 GB | warning 14・info 7（R2 account storage > 18GB、stats47 bucket storage > 12.5GB、R2 egress > 5GB/日） | なし |
| SNS | ok（最新 2026-10-22） | instagram 241 投稿・reach 23150・views 27263・eng 99 | —（閾値なし） | なし |

**期日超過の判定待ち**: active 5 件中 0 件


