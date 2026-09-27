# 計測→記録→改善サイクル — 2026-W38

計測週 **2026-W38**（GA4 rolling28d 2026-08-23〜2026-09-19、Japan-only）。前週との差は重複期間なので WoW ではない。

| 入力 | 状態 |
|---|---|
| ga4 | ok（transitions=ok landing=ok events=ok pages-clean=ok） |
| customDimensions | not-run（--admin-audit 未指定） |
| ga4Settings | not-run（--admin-audit 未指定） |
| improvements | ok（active 26 件） |
| effectVerdicts | ok（verdicts-2026-W38.json） |

**KPI ツリー**（正典: 事業計画 catalog → `.claude/state/business-plan/kpi-tree.json`。比較は 4 週前 2026-W34 = 窓が重ならない値。★ = 今月の重点レーンの KPI）

| 階層 | KPI | 今週 | 比較 | 状態 | 施策 |
|---|---|---|---|---|---|
| NSM | 週次収益 | — | — | see-nsm（内訳と判定不能の理由は週次 Issue の「週次収益 (NSM)」節） | — |
| 駆動 | 有料購入 | — | — | unmeasurable（今週の実売記録 0 件・販売中は少なくとも 3 点。売上を台帳へ自動で入れる経路が無いので 0 件とは限らない） | `NOTE-KAKEI-REDESIGN-EFFECT-01`, `NOTE-CIRCULATION-PILOT-01` |
| 駆動 | 検索クリック (GSC rolling28d) | 8810 | 4360 | ok | `RANKING-REINDEX-01`, `BLOG-SEO-TYPES-01`, `BLOG-SEO-QUEUE-01`, `SURVEY-LINKAGE-02`, `BLOG-LINKROT-01`, `STP-MESSAGE-ROLLOUT-01`, `THEME-EXPANSION-EFFECT-01`, `RANK-THIN-01`, `STP-AI-WATCH-01` |
| 駆動 | サイト内回遊率 (代表値: ブログ→ランキング) | 7.6% | — | ok | `FUNNEL-CTA-01`, `BLOG-SRCLINK-01`, `BLOG-LINKROT-01` |
| 駆動 | アフィリエイト収益効率 | GA4 7日 imp 4862・click 8 | — | partial（最終観測 2026-09-19。収益効率 (確定収益/1,000 imp) は ASP 成果と合わせて NSM 節で判定する） | `AFF-RESOLUTION-EFFECT-01`, `AFF-RANKING-RAKUTEN-NATIVE-01`, `AFF-IMPRESSION-ROUTING-01`, `AFF-BLOG-TEXTLINK-01`, `AFF-A8-REGISTER-01`, `AFF-SCOUT-PIPE-01` |
| 駆動 | 業務文脈の着地セッション | 3200 | — | ok | — |
| 守り | ★ データ品質ゲート通過率 | 99.5% (2408/2420) | — | ok（監査 2026-09-26・不合格 itemMissing 12・valuesMissing 12・stats.missing 12） | `DATA-ESTAT-FETCH-01`, `DATA-MANUAL-RESTORE-01` |
| 守り | サイト健全性 | PSI モバイル中央値 71・Workers error 0.7% | — | ok | `PERF-WORKER-P99-01`, `ASSET-POLICY-BURNDOWN-01`, `DEPS-RENOVATE-01` |
| 守り | 運用コスト | 閾値違反 24 件・R2 保存 32.952 GB | — | ok | `R2-STORAGE-01`, `TOKEN-AICONTENT-01` |
| 守り | ★ 計測の鮮度 | 10/13 | — | degraded（欠測・古い・認証切れ: moshimo(auth_required), note(report_incomplete), kdp(auth_required)） | — |

**施策の配線**: active 26 件（上限 10 件。超過中は新しい施策を足さず月次で削る）・KPI 未接続 0 件・`[target:]` なし 22 件

重点レーンの KPI なのに施策が 0 件: `measurement-freshness`（今月の重点を動かす施策が台帳に無い）

**回遊（referrer 集計）**

| 遷移 | page_view | 遷移元 PV | 率 |
|---|---:|---:|---:|
| blog → ranking | 730 | 9626 | 7.6% |
| themes → ranking | 66 | 762 | 8.7% |
| themes → blog | 1 | 762 | 0.1% |

**業務文脈の着地**（平均: PC 49.6%・平日 9–18 時 44.7%。両方が平均超かつ 25 セッション以上。行政実務者である証明ではない）

- `/` — 321 セッション・PC 79.2%・平日業務時間 48.1%
- `/blog/rice-harvest-volume-prefecture-gap` — 153 セッション・PC 81.7%・平日業務時間 89.5%
- `/blog/health-life-expectancy-structure` — 280 セッション・PC 66.4%・平日業務時間 46.7%
- `/blog/livable-prefecture-composite-ranking` — 236 セッション・PC 62.3%・平日業務時間 54.4%
- `/blog/automotive-industry-transformation-map` — 236 セッション・PC 65.8%・平日業務時間 51.4%
- `/ranking` — 79 セッション・PC 92.4%・平日業務時間 62.9%
- `/ranking/rice-consumption-quantity` — 136 セッション・PC 60.3%・平日業務時間 51.4%
- `/blog/farmland-crisis-abandoned-land` — 106 セッション・PC 65.1%・平日業務時間 58.3%

**効果判定エンジン**（2026-W38）: gsc-blog-wave 7 件 {"effect/pending":7}

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
| PSI | ok（最新 2026-09-20） | モバイル中央値 71 点・最低 /ranking/future-population-change-rate-2050 46 / /ranking/total-population 56 / /ranking/agricultural-output 58・計測失敗 3 | 最新日 32/35 計測で error | `PERF-WORKER-P99-01`, `ASSET-POLICY-BURNDOWN-01` |
| Cloudflare | ok（最新 2026-09-20） | Workers 745661 req・error 0.7%・R2 A 66104 / B 2472549・保存 32.952 GB | warning 17・info 7（Workers error rate > 1%、R2 account storage > 18GB、stats47 bucket storage > 12.5GB、R2 egress > 5GB/日） | `R2-STORAGE-01` |
| SNS | ok（最新 2026-09-20） | instagram 208 投稿・reach 22427・views 26030・eng 82 | —（閾値なし） | なし |

**期日超過の判定待ち**: active 26 件中 0 件


