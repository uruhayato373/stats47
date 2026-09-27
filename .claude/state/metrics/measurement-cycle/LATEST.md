# 計測→記録→改善サイクル — 2026-W39

計測週 **2026-W39**（GA4 rolling28d 2026-08-30〜2026-09-26、Japan-only）。前週との差は重複期間なので WoW ではない。

| 入力 | 状態 |
|---|---|
| ga4 | ok（transitions=ok landing=ok events=ok pages-clean=ok） |
| customDimensions | ok（登録済み 34 件） |
| ga4Settings | ok（keyEvents=affiliate_click|contact_click|cta_click|file_download|purchase bigQueryLinks=1 warnings=none） |
| improvements | ok（active 26 件） |
| effectVerdicts | ok（verdicts-2026-W39.json） |

**KPI ツリー**（正典: 事業計画 catalog → `.claude/state/business-plan/kpi-tree.json`。比較は 4 週前 2026-W35 = 窓が重ならない値。★ = 今月の重点レーンの KPI）

| 階層 | KPI | 今週 | 比較 | 状態 | 施策 |
|---|---|---|---|---|---|
| NSM | 週次収益 | — | — | see-nsm（内訳と判定不能の理由は週次 Issue の「週次収益 (NSM)」節） | — |
| 駆動 | 有料購入 | — | — | unmeasurable（今週の実売記録 0 件・販売中は少なくとも 3 点。売上を台帳へ自動で入れる経路が無いので 0 件とは限らない） | `NOTE-KAKEI-REDESIGN-EFFECT-01`, `NOTE-CIRCULATION-PILOT-01` |
| 駆動 | 検索クリック (GSC rolling28d) | 9947 | 4921 | ok | `RANKING-REINDEX-01`, `BLOG-SEO-TYPES-01`, `BLOG-SEO-QUEUE-01`, `SURVEY-LINKAGE-02`, `BLOG-LINKROT-01`, `STP-MESSAGE-ROLLOUT-01`, `THEME-EXPANSION-EFFECT-01`, `RANK-THIN-01`, `STP-AI-WATCH-01` |
| 駆動 | サイト内回遊率 (代表値: ブログ→ランキング) | 7.8% | — | ok | `FUNNEL-CTA-01`, `BLOG-SRCLINK-01`, `BLOG-LINKROT-01` |
| 駆動 | アフィリエイト収益効率 | GA4 7日 imp 3391・click 2 | — | partial（最終観測 2026-09-26。収益効率 (確定収益/1,000 imp) は ASP 成果と合わせて NSM 節で判定する） | `AFF-RESOLUTION-EFFECT-01`, `AFF-RANKING-RAKUTEN-NATIVE-01`, `AFF-IMPRESSION-ROUTING-01`, `AFF-BLOG-TEXTLINK-01`, `AFF-A8-REGISTER-01`, `AFF-SCOUT-PIPE-01` |
| 駆動 | 業務文脈の着地セッション | 3350 | — | ok | — |
| 守り | ★ データ品質ゲート通過率 | 99.5% (2408/2420) | — | ok（監査 2026-09-27・不合格 itemMissing 12・valuesMissing 12・stats.missing 12） | `DATA-ESTAT-FETCH-01`, `DATA-MANUAL-RESTORE-01` |
| 守り | サイト健全性 | PSI モバイル中央値 77・Workers error 0.1% | — | ok | `PERF-WORKER-P99-01`, `ASSET-POLICY-BURNDOWN-01`, `DEPS-RENOVATE-01` |
| 守り | 運用コスト | 閾値違反 18 件・R2 保存 33.368 GB | — | ok | `R2-STORAGE-01`, `TOKEN-AICONTENT-01` |
| 守り | ★ 計測の鮮度 | 12/13 | — | degraded（欠測・古い・認証切れ: note(report_incomplete)） | — |

**施策の配線**: active 26 件（上限 10 件。超過中は新しい施策を足さず月次で削る）・KPI 未接続 0 件・`[target:]` なし 22 件

重点レーンの KPI なのに施策が 0 件: `measurement-freshness`（今月の重点を動かす施策が台帳に無い）

**回遊（referrer 集計）**

| 遷移 | page_view | 遷移元 PV | 率 |
|---|---:|---:|---:|
| blog → ranking | 785 | 10065 | 7.8% |
| themes → ranking | 51 | 706 | 7.2% |
| themes → blog | 1 | 706 | 0.1% |

**サイト内クリックの計測**: 導線名付きクリック 1892 ÷ サイト内の移動 11736 = 被覆率 16.1%。nav_click 1972 件のうち導線名なし 4.1%

導線名なしの行き先 (上位。次に導線名を付ける候補):
- ranking — 33 クリック
- geo — 14 クリック
- themes — 10 クリック
- api — 8 クリック
- home — 8 クリック
- category — 3 クリック
- blog — 2 クリック
- search — 2 クリック

**業務文脈の着地**（平均: PC 46.5%・平日 9–18 時 43.4%。両方が平均超かつ 25 セッション以上。行政実務者である証明ではない）

- `/` — 326 セッション・PC 74.6%・平日業務時間 48.0%
- `/blog/rice-harvest-volume-prefecture-gap` — 164 セッション・PC 77.4%・平日業務時間 87.6%
- `/blog/health-life-expectancy-structure` — 290 セッション・PC 66.9%・平日業務時間 48.1%
- `/blog/automotive-industry-transformation-map` — 242 セッション・PC 65.8%・平日業務時間 54.7%
- `/blog/livable-prefecture-composite-ranking` — 264 セッション・PC 49.2%・平日業務時間 48.3%
- `/ranking/rice-consumption-quantity` — 145 セッション・PC 65.5%・平日業務時間 52.6%
- `/ranking` — 81 セッション・PC 93.8%・平日業務時間 64.4%
- `/blog/farmland-crisis-abandoned-land` — 89 セッション・PC 68.5%・平日業務時間 59.2%

**未登録の custom dimension**（0 パラメータ。登録はオーナー作業・遡及しない）


**効果判定エンジン**（2026-W39）: gsc-blog-wave 7 件 {"effect/pending":7}

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
| PSI | ok（最新 2026-09-27） | モバイル中央値 77 点・最低 /ranking/annual-sunshine-duration 45 / /themes/population-dynamics 48 / /areas/27000 56 | 最新日 26/38 計測で error | `PERF-WORKER-P99-01`, `ASSET-POLICY-BURNDOWN-01` |
| Cloudflare | ok（最新 2026-09-26） | Workers 623833 req・error 0.1%・R2 A 64940 / B 2567141・保存 33.368 GB | warning 12・info 6（R2 account storage > 18GB、stats47 bucket storage > 12.5GB、R2 egress > 5GB/日） | `R2-STORAGE-01` |
| SNS | ok（最新 2026-09-27） | x 115 投稿・impressions 9572・eng 92 / instagram 212 投稿・reach 22469・views 26125・eng 82 | —（閾値なし） | なし |

**期日超過の判定待ち**: active 26 件中 10 件

- `AFF-SCOUT-PIPE-01` effect/pending（期日 2026-09-21・affiliate）
- `ASSET-POLICY-BURNDOWN-01` pending（期日 2026-09-21・performance）
- `DATA-ESTAT-FETCH-01` pending（期日 2026-09-21・data-quality）
- `DATA-MANUAL-RESTORE-01` pending（期日 2026-09-21・data-quality）
- `DEPS-RENOVATE-01` pending（期日 2026-09-21・security）
- `PERF-WORKER-P99-01` pending（期日 2026-09-21・performance）
- `R2-STORAGE-01` pending（期日 2026-09-21・cloudflare-cost）
- `RANK-THIN-01` pending（期日 2026-09-21・indexing）
- `STP-MESSAGE-ROLLOUT-01` pending（期日 2026-09-21・brand）
- `SURVEY-LINKAGE-02` pending（期日 2026-09-21・content）

