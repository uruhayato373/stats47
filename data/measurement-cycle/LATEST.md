# 計測→記録→改善サイクル — 2026-W41

計測週 **2026-W41**（GA4 rolling28d 2026-09-13〜2026-10-10、Japan-only）。前週との差は重複期間なので WoW ではない。

| 入力 | 状態 |
|---|---|
| ga4 | ok（transitions=ok landing=ok events=ok pages-clean=ok） |
| customDimensions | ok（登録済み 34 件） |
| ga4Settings | ok（keyEvents=affiliate_click|contact_click|cta_click|file_download|purchase bigQueryLinks=1 warnings=none） |
| improvements | ok（active 8 件） |
| effectVerdicts | ok（verdicts-2026-W41.json） |

**KPI ツリー**（正典: 事業計画 catalog → `data/business-plan/kpi-tree.json`。比較は 4 週前 2026-W37 = 窓が重ならない値。★ = 今月の重点レーンの KPI）

| 階層 | KPI | 今週 | 比較 | 目標 | 状態 | 施策 |
|---|---|---|---|---|---|---|
| NSM | 週次収益 | — | — | — | see-nsm（内訳と判定不能の理由は週次 Issue の「週次収益 (NSM)」節） | — |
| 駆動 | 有料購入 | — | — | — | unmeasurable（ココナラ 判定不能（最終観測 2026-10-01 が週より前） / KDP 判定不能（日別の観測 0/7 日） / note 判定不能（最終観測 2026-09-30 が週より前）） | `NOTE-KAKEI-REDESIGN-EFFECT-01`, `NOTE-CIRCULATION-PILOT-01` |
| 駆動 | ★ 検索クリック (GSC rolling28d) | 12263 | 7503 | 20,000（2026-W52） | ok | `THEME-EXPANSION-EFFECT-01` |
| 駆動 | ページビュー (GA4 Japan 確定7日×4週) | 44662 | 36760 | 79,000（2026-W52） | ok | — |
| 駆動 | 広告収益効率 (AdSense) | — | — | — | pending（再開 (2026-10-11) 前の週 2026-W38・2026-W39・2026-W40・2026-W41 を含む。再開後 4 週は 2026-W42 から数える。停止前 W30〜W33 は ¥22 (自動広告込み)） | `ADSENSE-PLACEMENT-01` |
| 駆動 | サイト内回遊率 (代表値: ブログ→ランキング) | 8.6% | — | — | ok | `BLOG-SRCLINK-01` |
| 駆動 | アフィリエイト収益効率 | GA4 7日 imp 4465・click 4 | — | — | partial（最終観測 2026-10-10。収益効率 (確定収益/1,000 imp) は ASP 成果と合わせて NSM 節で判定する） | `AFF-RESOLUTION-EFFECT-01`, `AFF-IMPRESSION-ROUTING-01` |
| 駆動 | 業務文脈の着地セッション | 3828 | — | — | ok | — |
| 守り | ★ データ品質ゲート通過率 | 99.1% (2435/2456) | — | — | ok（監査 2026-10-10・不合格 recipe.unbaked 21） | — |
| 守り | ★ サイト健全性 | PSI モバイル中央値 75・Workers error 0.1% | — | — | ok | — |
| 守り | ★ 運用コスト | 閾値違反 24 件・R2 保存 34.152 GB | — | — | ok | — |
| 守り | ★ 計測の鮮度 | 10/14 | — | — | degraded（欠測・古い・認証切れ: sns, a8(collection_failed), kdp(auth_required), coconala(auth_required)） | `MEASUREMENT-AUTH-RESTORE-01` |

**施策の配線**: active 8 件（上限 10 件）・KPI 未接続 0 件・`[target:]` なし 5 件

重点レーンの KPI なのに施策が 0 件: `data-quality-pass-rate`, `site-health`, `operating-cost`（今月の重点を動かす施策が台帳に無い）

**回遊（referrer 集計）**

| 遷移 | page_view | 遷移元 PV | 率 |
|---|---:|---:|---:|
| blog → ranking | 893 | 10428 | 8.6% |
| themes → ranking | 104 | 816 | 12.8% |
| themes → blog | 6 | 816 | 0.7% |

**サイト内クリックの計測**: 導線名付きクリック 3659 ÷ サイト内の移動 15759 = 被覆率 23.2%。nav_click 7937 件のうち導線名なし 53.9%

導線名なしの行き先 (上位。次に導線名を付ける候補):
- ranking — 1495 クリック
- geo — 599 クリック
- municipalities — 573 クリック
- areas — 509 クリック
- api — 285 クリック
- themes — 209 クリック
- home — 186 クリック
- category — 169 クリック

**業務文脈の着地**（平均: PC 46.0%・平日 9–18 時 45.1%。両方が平均超かつ 25 セッション以上。行政実務者である証明ではない）

- `/` — 387 セッション・PC 72.9%・平日業務時間 55.3%
- `/blog/automotive-industry-transformation-map` — 308 セッション・PC 71.5%・平日業務時間 62.7%
- `/blog/livable-prefecture-composite-ranking` — 331 セッション・PC 48.0%・平日業務時間 49.0%
- `/blog/health-life-expectancy-structure` — 197 セッション・PC 75.1%・平日業務時間 51.0%
- `/blog/rice-harvest-volume-prefecture-gap` — 132 セッション・PC 69.7%・平日業務時間 78.1%
- `/ranking` — 103 セッション・PC 94.2%・平日業務時間 67.0%
- `/ranking/rice-consumption-quantity` — 128 セッション・PC 75.0%・平日業務時間 65.5%
- `/blog/alcohol-prefecture-map` — 190 セッション・PC 50.0%・平日業務時間 50.2%

**未登録の custom dimension**（0 パラメータ。登録はオーナー作業・遡及しない）


**効果判定エンジン**（2026-W41）: adsense 1 件 {"effect/pending":1}

GSC 施策 0 件中、機械判定できるのは 0 件。目印の欠けた施策は無い (理由付きで対象外 1 件: `THEME-EXPANSION-EFFECT-01`)。

**運用系の計測**（直近 7 日。閾値違反は日次 alert Issue と同じ判定。改善の判断は人）

| 計測 | 状態 | 要約 | 閾値違反 | active 施策 |
|---|---|---|---|---|
| PSI | ok（最新 2026-10-11） | モバイル中央値 75 点・最低 /themes/population-dynamics 40 / /ranking/total-population 54 / / 57 | 最新日 28/38 計測で error | なし |
| Cloudflare | ok（最新 2026-10-11） | Workers 712041 req・error 0.1%・R2 A 345490 / B 6107438・保存 34.152 GB | warning 17・info 7（R2 account storage > 18GB、stats47 bucket storage > 12.5GB、R2 egress > 5GB/日、R2 Class B ops > 1M/日） | なし |
| SNS | missing（最新 —） | — | —（閾値なし） | なし |

**期日超過の判定待ち**: active 8 件中 0 件


