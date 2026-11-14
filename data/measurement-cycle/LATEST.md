# 計測→記録→改善サイクル — 2026-W45

計測週 **2026-W45**（GA4 rolling28d 2026-10-11〜2026-11-07、Japan-only）。前週との差は重複期間なので WoW ではない。

| 入力 | 状態 |
|---|---|
| ga4 | ok（transitions=ok landing=ok events=ok pages-clean=ok） |
| customDimensions | ok（登録済み 36 件） |
| ga4Settings | ok（keyEvents=affiliate_click|contact_click|cta_click|file_download|product_click|purchase bigQueryLinks=1 warnings=none） |
| improvements | ok（active 6 件） |
| effectVerdicts | ok（verdicts-2026-W45.json） |

**KPI ツリー**（正典: 事業計画 catalog → `data/business-plan/kpi-tree.json`。比較は 4 週前 2026-W41 = 窓が重ならない値。★ = 今月の重点レーンの KPI）

| 階層 | KPI | 今週 | 比較 | 目標 | 状態 | 施策 |
|---|---|---|---|---|---|---|
| NSM | 週次収益 | — | — | — | see-nsm（内訳と判定不能の理由は週次 Issue の「週次収益 (NSM)」節） | — |
| 駆動 | ★ 有料購入 | — | — | — | unmeasurable（KDP 判定不能（日別の観測 1/7 日） / note 判定不能（最終観測 2026-10-17 が週より前）） | `NOTE-FISCAL-PEER-SALES-01` |
| 駆動 | ★ 検索クリック (GSC rolling28d) | 18592 | 12263 | 20,000（2026-W52） | ok | `MUNI-PREF-RANKING-OBS-01`, `MUNI-PAGE-SEO-01` |
| 駆動 | ★ ページビュー (GA4 Japan 確定7日×4週) | 56533 | 44662 | 79,000（2026-W52） | ok | — |
| 駆動 | 広告収益効率 (AdSense) | 20 | — | — | ok（28 日の AdSense 収益 ¥1,129） | `ADSENSE-PLACEMENT-01` |
| 駆動 | ★ サイト内回遊率 (代表値: ブログ→ランキング) | 9.5% | 8.6% | — | ok | `RELATED-ARTICLES-EFFECT-01` |
| 駆動 | アフィリエイト収益効率 | GA4 7日 imp 6892・click 3 | — | — | partial（最終観測 2026-11-07。収益効率 (確定収益/1,000 imp) は ASP 成果と合わせて NSM 節で判定する） | — |
| 駆動 | ★ 業務文脈の着地セッション | 4717 | 3828 | — | ok | — |
| 守り | データ品質ゲート通過率 | 100.0% (2596/2596) | 99.1% | — | ok（監査 2026-11-07） | — |
| 守り | サイト健全性 | PSI モバイル中央値 74・Workers error 0.2% | — | — | ok | — |
| 守り | 運用コスト | 閾値違反 28 件・R2 保存 44.842 GB | — | — | ok | `CF-CPU-URL-01` |
| 守り | インデックス登録率 | — | — | — | missing（gsc/coverage-submitted-history.csv が無い (週次取得の初回待ち)） | — |
| 守り | 計測の鮮度 | 11/11 | — | — | ok | — |

**施策の配線**: active 6 件（上限 5 件。超過中は新しい施策を足さず月次で削る）・KPI 未接続 0 件・`[target:]` なし 5 件

重点レーンの KPI なのに施策が 0 件: `site-pageviews`, `work-context-sessions`（今月の重点を動かす施策が台帳に無い）

**回遊（referrer 集計）**

| 遷移 | page_view | 遷移元 PV | 率 |
|---|---:|---:|---:|
| blog → ranking | 1104 | 11587 | 9.5% |
| themes → ranking | 215 | 1212 | 17.7% |
| themes → blog | 26 | 1212 | 2.1% |

**サイト内クリックの計測**: 導線名付きクリック 8864 ÷ サイト内の移動 22769 = 被覆率 38.9%。nav_click 18760 件のうち導線名なし 52.8%

導線名なしの行き先 (上位。次に導線名を付ける候補):
- ranking — 2544 クリック
- municipalities — 2311 クリック
- geo — 2100 クリック
- api — 656 クリック
- areas — 628 クリック
- home — 459 クリック
- themes — 368 クリック
- category — 231 クリック

**業務文脈の着地**（平均: PC 52.2%・平日 9–18 時 50.0%。両方が平均超かつ 25 セッション以上。行政実務者である証明ではない）

- `/blog/automotive-industry-transformation-map` — 524 セッション・PC 81.9%・平日業務時間 76.1%
- `/` — 589 セッション・PC 77.9%・平日業務時間 57.1%
- `/ranking/habitable-area-ratio` — 212 セッション・PC 83.0%・平日業務時間 97.0%
- `/geo/datasets/A52` — 143 セッション・PC 97.9%・平日業務時間 77.3%
- `/ranking/specific-health-checkup-participation-rate` — 190 セッション・PC 74.2%・平日業務時間 70.9%
- `/blog/rice-harvest-volume-prefecture-gap` — 148 セッション・PC 78.4%・平日業務時間 67.3%
- `/ranking/agricultural-output` — 93 セッション・PC 94.6%・平日業務時間 65.3%
- `/ranking/rice-consumption-quantity` — 142 セッション・PC 66.9%・平日業務時間 56.3%

**未登録の custom dimension**（0 パラメータ。登録はオーナー作業・遡及しない）


**GA4 の設定の変化**（比較元: 2026-W44。意図しない変化と問題はバックログへ起票する）

- custom dimension: 変化なし
- キーイベント: 変化なし
- 監査の問題: なし

**効果判定エンジン**（2026-W45）: adsense 1 件 {"effect/pending":1}

GSC 施策 1 件中、機械判定できるのは 0 件 (理由付きで対象外 1 件: `MUNI-PREF-RANKING-OBS-01`)。残りは目印が欠けている（目標値は根拠があるときだけ書く）:

- `MUNI-PAGE-SEO-01`: [gsc-page: /path]・[target: +N clicks]

**運用系の計測**（直近 7 日。閾値違反は日次 alert Issue と同じ判定。改善の判断は人）

| 計測 | 状態 | 要約 | 閾値違反 | active 施策 |
|---|---|---|---|---|
| PSI | ok（最新 2026-11-06） | モバイル中央値 74 点・最低 /ranking/future-population-change-rate-2050 40 / /areas/01000 43 / /ranking/agricultural-output 47 | 最新日 19/38 計測で error | なし |
| Cloudflare | ok（最新 2026-11-07） | Workers 500116 req・error 0.2%・R2 A 222594 / B 7170292・保存 44.842 GB | warning 10・info 18（Workers CPU 時間が 4,500 万 ms/日を超過、R2 account storage > 18GB、stats47 bucket storage > 12.5GB、R2 egress > 5GB/日、R2 Class B ops > 1M/日） | `CF-CPU-URL-01` |
| SNS | ok（最新 2026-11-06） | instagram 245 投稿・reach 23217・views 27383・eng 104 | —（閾値なし） | なし |

**期日超過の判定待ち**: active 6 件中 0 件


