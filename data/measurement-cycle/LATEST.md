# 計測→記録→改善サイクル — 2026-W42

計測週 **2026-W42**（GA4 rolling28d 2026-09-20〜2026-10-17、Japan-only）。前週との差は重複期間なので WoW ではない。

| 入力 | 状態 |
|---|---|
| ga4 | ok（transitions=ok landing=ok events=ok pages-clean=ok） |
| customDimensions | ok（登録済み 34 件） |
| ga4Settings | ok（keyEvents=affiliate_click|contact_click|cta_click|file_download|purchase bigQueryLinks=1 warnings=none） |
| improvements | ok（active 10 件） |
| effectVerdicts | ok（verdicts-2026-W42.json） |

**KPI ツリー**（正典: 事業計画 catalog → `data/business-plan/kpi-tree.json`。比較は 4 週前 2026-W38 = 窓が重ならない値。★ = 今月の重点レーンの KPI）

| 階層 | KPI | 今週 | 比較 | 目標 | 状態 | 施策 |
|---|---|---|---|---|---|---|
| NSM | 週次収益 | — | — | — | see-nsm（内訳と判定不能の理由は週次 Issue の「週次収益 (NSM)」節） | — |
| 駆動 | 有料購入 | — | — | — | unmeasurable（KDP 判定不能（日別の観測 1/7 日） / note 判定不能（2026-09 の締め額が読めない）） | `NOTE-KAKEI-REDESIGN-EFFECT-01`, `NOTE-CIRCULATION-PILOT-01` |
| 駆動 | ★ 検索クリック (GSC rolling28d) | 13207 | 8810 | 20,000（2026-W52） | ok | `SEO-TITLE-CTR-EFFECT-01`, `THEME-EXPANSION-EFFECT-01` |
| 駆動 | ページビュー (GA4 Japan 確定7日×4週) | 44550 | 40807 | 79,000（2026-W52） | ok | — |
| 駆動 | 広告収益効率 (AdSense) | — | — | — | pending（再開 (2026-10-11) 前の週 2026-W39・2026-W40・2026-W41 を含む。再開後 4 週は 2026-W42 から数える。停止前 W30〜W33 は ¥22 (自動広告込み)） | `ADSENSE-PLACEMENT-01` |
| 駆動 | サイト内回遊率 (代表値: ブログ→ランキング) | 9.3% | 7.6% | — | ok | `BLOG-SRCLINK-01`, `RELATED-ARTICLES-EFFECT-01` |
| 駆動 | アフィリエイト収益効率 | GA4 7日 imp 3541・click 4 | — | — | partial（最終観測 2026-10-17。収益効率 (確定収益/1,000 imp) は ASP 成果と合わせて NSM 節で判定する） | `AFF-RESOLUTION-EFFECT-01`, `AFF-IMPRESSION-ROUTING-01` |
| 駆動 | 業務文脈の着地セッション | 4250 | 3200 | — | ok | — |
| 守り | ★ データ品質ゲート通過率 | 99.2% (2439/2460) | 99.5% | — | ok（監査 2026-10-17・不合格 recipe.unbaked 21） | — |
| 守り | ★ サイト健全性 | PSI モバイル中央値 74・Workers error 0.1% | — | — | ok | — |
| 守り | ★ 運用コスト | 閾値違反 21 件・R2 保存 35.159 GB | — | — | ok | — |
| 守り | ★ 計測の鮮度 | 8/11 | — | — | degraded（欠測・古い・認証切れ: sns, gsc(auth_required), kdp(auth_required)） | `MEASUREMENT-AUTH-RESTORE-01` |

**施策の配線**: active 10 件（上限 10 件）・KPI 未接続 0 件・`[target:]` なし 7 件

重点レーンの KPI なのに施策が 0 件: `data-quality-pass-rate`, `site-health`, `operating-cost`（今月の重点を動かす施策が台帳に無い）

**回遊（referrer 集計）**

| 遷移 | page_view | 遷移元 PV | 率 |
|---|---:|---:|---:|
| blog → ranking | 946 | 10220 | 9.3% |
| themes → ranking | 106 | 687 | 15.4% |
| themes → blog | 11 | 687 | 1.6% |

**サイト内クリックの計測**: 導線名付きクリック 4530 ÷ サイト内の移動 17163 = 被覆率 26.4%。nav_click 11109 件のうち導線名なし 59.2%

導線名なしの行き先 (上位。次に導線名を付ける候補):
- ranking — 2193 クリック
- municipalities — 1143 クリック
- geo — 957 クリック
- areas — 688 クリック
- api — 373 クリック
- home — 298 クリック
- themes — 291 クリック
- category — 256 クリック

**業務文脈の着地**（平均: PC 47.0%・平日 9–18 時 46.2%。両方が平均超かつ 25 セッション以上。行政実務者である証明ではない）

- `/blog/automotive-industry-transformation-map` — 386 セッション・PC 75.6%・平日業務時間 70.1%
- `/` — 415 セッション・PC 74.2%・平日業務時間 55.1%
- `/blog/livable-prefecture-composite-ranking` — 321 セッション・PC 48.3%・平日業務時間 47.0%
- `/blog/health-life-expectancy-structure` — 167 セッション・PC 71.3%・平日業務時間 54.9%
- `/ranking/rice-consumption-quantity` — 126 セッション・PC 76.2%・平日業務時間 67.1%
- `/ranking` — 95 セッション・PC 95.8%・平日業務時間 64.4%
- `/blog/rice-harvest-volume-prefecture-gap` — 112 セッション・PC 75.9%・平日業務時間 68.3%
- `/ranking/specific-health-checkup-participation-rate` — 108 セッション・PC 68.5%・平日業務時間 65.5%

**未登録の custom dimension**（0 パラメータ。登録はオーナー作業・遡及しない）


**効果判定エンジン**（2026-W42）: adsense 1 件 {"effect/pending":1} / gsc-improvement 1 件 {"effect/pending":1}

GSC 施策 1 件中、機械判定できるのは 0 件 (理由付きで対象外 1 件: `THEME-EXPANSION-EFFECT-01`)。残りは目印が欠けている（目標値は根拠があるときだけ書く）:

- `SEO-TITLE-CTR-EFFECT-01`: [target: +N clicks]

**運用系の計測**（直近 7 日。閾値違反は日次 alert Issue と同じ判定。改善の判断は人）

| 計測 | 状態 | 要約 | 閾値違反 | active 施策 |
|---|---|---|---|---|
| PSI | ok（最新 2026-10-18） | モバイル中央値 74 点・最低 /ranking/future-population-change-rate-2050 51 / /themes/population-dynamics 60 / /ranking/annual-sunshine-duration 60 | 最新日 31/38 計測で error | なし |
| Cloudflare | ok（最新 2026-10-18） | Workers 701115 req・error 0.1%・R2 A 104639 / B 4473056・保存 35.159 GB | warning 14・info 7（R2 account storage > 18GB、stats47 bucket storage > 12.5GB、R2 egress > 5GB/日） | なし |
| SNS | missing（最新 —） | — | —（閾値なし） | なし |

**期日超過の判定待ち**: active 10 件中 2 件

- `NOTE-KAKEI-REDESIGN-EFFECT-01` pending（期日 2026-10-13・content）
- `THEME-EXPANSION-EFFECT-01` effect/pending（期日 2026-10-17・ga4/gsc/theme-quality）

