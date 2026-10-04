# 計測→記録→改善サイクル — 2026-W40

計測週 **2026-W40**（GA4 rolling28d 2026-09-06〜2026-10-03、Japan-only）。前週との差は重複期間なので WoW ではない。

| 入力 | 状態 |
|---|---|
| ga4 | ok（transitions=ok landing=ok events=ok pages-clean=ok） |
| customDimensions | ok（登録済み 34 件） |
| ga4Settings | ok（keyEvents=affiliate_click|contact_click|cta_click|file_download|purchase bigQueryLinks=1 warnings=none） |
| improvements | ok（active 25 件） |
| effectVerdicts | ok（verdicts-2026-W40.json） |

**KPI ツリー**（正典: 事業計画 catalog → `.claude/state/business-plan/kpi-tree.json`。比較は 4 週前 2026-W36 = 窓が重ならない値。★ = 今月の重点レーンの KPI）

| 階層 | KPI | 今週 | 比較 | 目標 | 状態 | 施策 |
|---|---|---|---|---|---|---|
| NSM | 週次収益 | — | — | — | see-nsm（内訳と判定不能の理由は週次 Issue の「週次収益 (NSM)」節） | — |
| 駆動 | 有料購入 | — | — | — | unmeasurable（ココナラ ¥0（累積 ¥0 (2026-10-01)） / KDP 判定不能（日別の観測 1/7 日） / note 判定不能（週初め前の基準点が無い (最初の観測 2026-09-30)）） | `NOTE-KAKEI-REDESIGN-EFFECT-01`, `NOTE-CIRCULATION-PILOT-01` |
| 駆動 | ★ 検索クリック (GSC rolling28d) | 10018 | 6053 | 20,000（2026-W52） | ok | `RANKING-REINDEX-01`, `BLOG-SEO-TYPES-01`, `BLOG-SEO-QUEUE-01`, `SURVEY-LINKAGE-02`, `BLOG-LINKROT-01`, `STP-MESSAGE-ROLLOUT-01`, `THEME-EXPANSION-EFFECT-01`, `RANK-THIN-01`, `STP-AI-WATCH-01` |
| 駆動 | サイト内回遊率 (代表値: ブログ→ランキング) | 8.2% | — | — | ok | `FUNNEL-CTA-01`, `BLOG-SRCLINK-01`, `BLOG-LINKROT-01` |
| 駆動 | アフィリエイト収益効率 | GA4 7日 imp 3391・click 2 | — | — | stale（最終観測 2026-09-26。収益効率 (確定収益/1,000 imp) は ASP 成果と合わせて NSM 節で判定する） | `AFF-RESOLUTION-EFFECT-01`, `AFF-RANKING-RAKUTEN-NATIVE-01`, `AFF-IMPRESSION-ROUTING-01`, `AFF-BLOG-TEXTLINK-01`, `AFF-A8-REGISTER-01` |
| 駆動 | 業務文脈の着地セッション | 3560 | — | — | ok | — |
| 守り | ★ データ品質ゲート通過率 | 100.0% (2423/2423) | — | — | ok（監査 2026-10-03） | `DATA-ESTAT-FETCH-01`, `DATA-MANUAL-RESTORE-01` |
| 守り | ★ サイト健全性 | PSI モバイル中央値 70・Workers error 0.1% | — | — | partial | `PERF-WORKER-P99-01`, `ASSET-POLICY-BURNDOWN-01`, `DEPS-RENOVATE-01` |
| 守り | ★ 運用コスト | 閾値違反 15 件・R2 保存 33.356 GB | — | — | stale | `R2-STORAGE-01`, `TOKEN-AICONTENT-01` |
| 守り | ★ 計測の鮮度 | 7/14 | — | — | degraded（欠測・古い・認証切れ: affiliate, psi, cloudflare, sns, gsc(runner_failed), kdp(auth_required), coconala(auth_required)） | — |

**施策の配線**: active 25 件（上限 10 件。超過中は新しい施策を足さず月次で削る）・KPI 未接続 0 件・`[target:]` なし 21 件

重点レーンの KPI なのに施策が 0 件: `measurement-freshness`（今月の重点を動かす施策が台帳に無い）

**回遊（referrer 集計）**

| 遷移 | page_view | 遷移元 PV | 率 |
|---|---:|---:|---:|
| blog → ranking | 869 | 10651 | 8.2% |
| themes → ranking | 76 | 758 | 10.0% |
| themes → blog | 3 | 758 | 0.4% |

**サイト内クリックの計測**: 導線名付きクリック 2815 ÷ サイト内の移動 13727 = 被覆率 20.5%。nav_click 4643 件のうち導線名なし 39.4%

導線名なしの行き先 (上位。次に導線名を付ける候補):
- ranking — 626 クリック
- municipalities — 281 クリック
- geo — 260 クリック
- areas — 154 クリック
- themes — 114 クリック
- api — 97 クリック
- home — 94 クリック
- category — 76 クリック

**業務文脈の着地**（平均: PC 45.3%・平日 9–18 時 44.8%。両方が平均超かつ 25 セッション以上。行政実務者である証明ではない）

- `/` — 358 セッション・PC 73.3%・平日業務時間 53.9%
- `/blog/automotive-industry-transformation-map` — 274 セッション・PC 68.0%・平日業務時間 59.1%
- `/blog/rice-harvest-volume-prefecture-gap` — 151 セッション・PC 74.8%・平日業務時間 85.0%
- `/blog/health-life-expectancy-structure` — 266 セッション・PC 68.0%・平日業務時間 47.6%
- `/blog/livable-prefecture-composite-ranking` — 295 セッション・PC 48.8%・平日業務時間 47.6%
- `/ranking` — 92 セッション・PC 94.6%・平日業務時間 63.6%
- `/ranking/rice-consumption-quantity` — 133 セッション・PC 68.4%・平日業務時間 56.8%
- `/blog/sports-urban-paradox` — 92 セッション・PC 67.4%・平日業務時間 62.9%

**未登録の custom dimension**（0 パラメータ。登録はオーナー作業・遡及しない）


**効果判定エンジン**（2026-W40）: gsc-blog-wave 7 件 {"effect/pending":7}

GSC 施策 6 件中、機械判定できるのは 0 件。残りは目印が欠けている（目標値は根拠があるときだけ書く）:

- `RANKING-REINDEX-01`: [gsc-page: /path]・デプロイ済 YYYY-MM-DD・[target: +N clicks]
- `BLOG-SEO-TYPES-01`: [gsc-page: /path]・デプロイ済 YYYY-MM-DD・[target: +N clicks]
- `BLOG-SEO-QUEUE-01`: [gsc-page: /path]・デプロイ済 YYYY-MM-DD・[target: +N clicks]
- `BLOG-LINKROT-01`: [gsc-page: /path]・デプロイ済 YYYY-MM-DD・[target: +N clicks]
- `THEME-EXPANSION-EFFECT-01`: [gsc-page: /path]・デプロイ済 YYYY-MM-DD・[target: +N clicks]
- `STP-AI-WATCH-01`: [gsc-page: /path]・デプロイ済 YYYY-MM-DD・[target: +N clicks]

**運用系の計測**（直近 7 日。閾値違反は日次 alert Issue と同じ判定。改善の判断は人）

| 計測 | 状態 | 要約 | 閾値違反 | active 施策 |
|---|---|---|---|---|
| PSI | stale（最新 2026-09-30） | モバイル中央値 70 点・最低 /ranking/agricultural-output 43 / /ranking/annual-sunshine-duration 48 / /ranking/total-population 49 | 最新日 25/38 計測で error | `PERF-WORKER-P99-01`, `ASSET-POLICY-BURNDOWN-01` |
| Cloudflare | stale（最新 2026-09-29） | Workers 185374 req・error 0.1%・R2 A 17437 / B 674438・保存 33.356 GB | warning 10・info 5（R2 account storage > 18GB、stats47 bucket storage > 12.5GB、R2 egress > 5GB/日） | `R2-STORAGE-01` |
| SNS | missing（最新 —） | — | —（閾値なし） | なし |

**期日超過の判定待ち**: active 25 件中 6 件

- `STP-MESSAGE-ROLLOUT-01` pending（期日 2026-09-21・brand）
- `SURVEY-LINKAGE-02` pending（期日 2026-09-21・content）
- `AFF-IMPRESSION-ROUTING-01` in-progress（期日 2026-09-27・affiliate）
- `BLOG-SEO-QUEUE-01` effect/pending（期日 2026-09-28・gsc）
- `BLOG-SEO-TYPES-01` effect/pending（期日 2026-09-28・gsc）
- `TOKEN-AICONTENT-01` pending（期日 2026-10-01・cost）

