# 計測→記録→改善サイクル — 2026-W38

計測週 **2026-W38**（GA4 rolling28d 2026-08-23〜2026-09-19、Japan-only）。前週との差は重複期間なので WoW ではない。

| 入力 | 状態 |
|---|---|
| ga4 | ok（transitions=ok landing=ok events=ok pages-clean=ok） |
| customDimensions | not-run（--admin-audit 未指定） |
| improvements | ok（active 29 件） |
| effectVerdicts | ok（verdicts-2026-W38.json） |

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

GSC 施策 9 件中、機械判定できるのは 0 件。残りは目印が欠けている（目標値は根拠があるときだけ書く）:

- `SEARCH-GROWTH-CYCLE-01`: [gsc-page: /path]・デプロイ済 YYYY-MM-DD・[target: +N clicks]
- `RANKING-REINDEX-01`: [gsc-page: /path]・デプロイ済 YYYY-MM-DD・[target: +N clicks]
- `BLOG-SEO-TYPES-01`: [gsc-page: /path]・デプロイ済 YYYY-MM-DD・[target: +N clicks]
- `BLOG-SEO-QUEUE-01`: [gsc-page: /path]・デプロイ済 YYYY-MM-DD・[target: +N clicks]
- `BLOG-SEO-PACE-01`: [gsc-page: /path]・デプロイ済 YYYY-MM-DD・[target: +N clicks]
- `BLOG-LINKROT-01`: [gsc-page: /path]・デプロイ済 YYYY-MM-DD・[target: +N clicks]
- `SITE-LINKROT-01`: [gsc-page: /path]・デプロイ済 YYYY-MM-DD・[target: +N clicks]
- `THEME-EXPANSION-EFFECT-01`: [gsc-page: /path]・デプロイ済 YYYY-MM-DD・[target: +N clicks]
- `STP-AI-WATCH-01`: [gsc-page: /path]・デプロイ済 YYYY-MM-DD・[target: +N clicks]

**運用系の計測**（直近 7 日。閾値違反は日次 alert Issue と同じ判定。改善の判断は人）

| 計測 | 状態 | 要約 | 閾値違反 | active 施策 |
|---|---|---|---|---|
| PSI | ok（最新 2026-09-20） | モバイル中央値 71 点・最低 /ranking/future-population-change-rate-2050 46 / /ranking/total-population 56 / /ranking/agricultural-output 58・計測失敗 3 | 最新日 32/35 計測で error | `PERF-WORKER-P99-01`, `ASSET-POLICY-BURNDOWN-01` |
| Cloudflare | ok（最新 2026-09-20） | Workers 745661 req・error 0.7%・R2 A 66104 / B 2472549・保存 32.952 GB | warning 17・info 7（Workers error rate > 1%、R2 account storage > 18GB、stats47 bucket storage > 12.5GB、R2 egress > 5GB/日） | `R2-STORAGE-01` |
| SNS | ok（最新 2026-09-20） | instagram 208 投稿・reach 22427・views 26030・eng 82 | —（閾値なし） | なし |

**期日超過の判定待ち**: active 29 件中 0 件


