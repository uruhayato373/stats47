# 計測→記録→改善サイクル — 2026-W44

計測週 **2026-W44**（GA4 rolling28d 2026-10-04〜2026-10-31、Japan-only）。前週との差は重複期間なので WoW ではない。

| 入力 | 状態 |
|---|---|
| ga4 | ok（transitions=ok landing=ok events=ok pages-clean=ok） |
| customDimensions | ok（登録済み 36 件） |
| ga4Settings | ok（keyEvents=affiliate_click|contact_click|cta_click|file_download|product_click|purchase bigQueryLinks=1 warnings=none） |
| improvements | ok（active 5 件） |
| effectVerdicts | ok（verdicts-2026-W44.json） |

**KPI ツリー**（正典: 事業計画 catalog → `data/business-plan/kpi-tree.json`。比較は 4 週前 2026-W40 = 窓が重ならない値。★ = 今月の重点レーンの KPI）

| 階層 | KPI | 今週 | 比較 | 目標 | 状態 | 施策 |
|---|---|---|---|---|---|---|
| NSM | 週次収益 | — | — | — | see-nsm（内訳と判定不能の理由は週次 Issue の「週次収益 (NSM)」節） | — |
| 駆動 | ★ 有料購入 | — | — | — | unmeasurable（KDP 判定不能（日別の観測 0/7 日） / note 判定不能（最終観測 2026-10-17 が週より前）） | `NOTE-FISCAL-PEER-SALES-01` |
| 駆動 | ★ 検索クリック (GSC rolling28d) | 16701 | 11023 | 20,000（2026-W52） | ok | `MUNI-PREF-RANKING-OBS-01`, `MUNI-PAGE-SEO-01` |
| 駆動 | ★ ページビュー (GA4 Japan 確定7日×4週) | 52955 | 43907 | 79,000（2026-W52） | ok | — |
| 駆動 | 広告収益効率 (AdSense) | — | — | — | pending（再開 (2026-10-11) 前の週 2026-W41 を含む。再開後 4 週は 2026-W42 から数える。停止前 W30〜W33 は ¥22 (自動広告込み)） | `ADSENSE-PLACEMENT-01` |
| 駆動 | ★ サイト内回遊率 (代表値: ブログ→ランキング) | 10.1% | 8.2% | — | ok | `RELATED-ARTICLES-EFFECT-01` |
| 駆動 | アフィリエイト収益効率 | GA4 7日 imp 4349・click 5 | — | — | partial（最終観測 2026-10-31。収益効率 (確定収益/1,000 imp) は ASP 成果と合わせて NSM 節で判定する） | — |
| 駆動 | ★ 業務文脈の着地セッション | 4800 | 3560 | — | ok | — |
| 守り | データ品質ゲート通過率 | 100.0% (2596/2596) | 100.0% | — | ok（監査 2026-11-07） | — |
| 守り | サイト健全性 | PSI モバイル中央値 82・Workers error 0.1% | — | — | ok | — |
| 守り | 運用コスト | 閾値違反 23 件・R2 保存 43.158 GB | — | — | ok | — |
| 守り | 計測の鮮度 | 11/11 | — | — | ok | — |

**施策の配線**: active 5 件（上限 5 件）・KPI 未接続 0 件・`[target:]` なし 5 件

重点レーンの KPI なのに施策が 0 件: `site-pageviews`, `work-context-sessions`（今月の重点を動かす施策が台帳に無い）

**回遊（referrer 集計）**

| 遷移 | page_view | 遷移元 PV | 率 |
|---|---:|---:|---:|
| blog → ranking | 1124 | 11116 | 10.1% |
| themes → ranking | 205 | 1043 | 19.7% |
| themes → blog | 22 | 1043 | 2.1% |

**サイト内クリックの計測**: 導線名付きクリック 7459 ÷ サイト内の移動 21673 = 被覆率 34.4%。nav_click 17319 件のうち導線名なし 56.9%

導線名なしの行き先 (上位。次に導線名を付ける候補):
- ranking — 2968 クリック
- geo — 1959 クリック
- municipalities — 1679 クリック
- areas — 839 クリック
- api — 705 クリック
- home — 462 クリック
- themes — 357 クリック
- category — 319 クリック

**業務文脈の着地**（平均: PC 52.0%・平日 9–18 時 49.6%。両方が平均超かつ 25 セッション以上。行政実務者である証明ではない）

- `/blog/automotive-industry-transformation-map` — 524 セッション・PC 81.3%・平日業務時間 74.7%
- `/` — 569 セッション・PC 79.1%・平日業務時間 58.9%
- `/ranking/habitable-area-ratio` — 205 セッション・PC 81.0%・平日業務時間 96.4%
- `/ranking/specific-health-checkup-participation-rate` — 196 セッション・PC 74.0%・平日業務時間 71.7%
- `/geo/datasets/A52` — 125 セッション・PC 97.6%・平日業務時間 78.8%
- `/blog/rice-harvest-volume-prefecture-gap` — 130 セッション・PC 77.7%・平日業務時間 65.0%
- `/ranking/rice-consumption-quantity` — 146 セッション・PC 66.4%・平日業務時間 58.9%
- `/blog/farmland-crisis-abandoned-land` — 117 セッション・PC 76.9%・平日業務時間 61.9%

**未登録の custom dimension**（0 パラメータ。登録はオーナー作業・遡及しない）


**GA4 の設定の変化**（比較元: 2026-W43。意図しない変化と問題はバックログへ起票する）

- custom dimension: 変化なし
- キーイベント: 変化なし
- 監査の問題: なし

**効果判定エンジン**（2026-W44）: adsense 1 件 {"effect/pending":1}

GSC 施策 1 件中、機械判定できるのは 0 件 (理由付きで対象外 1 件: `MUNI-PREF-RANKING-OBS-01`)。残りは目印が欠けている（目標値は根拠があるときだけ書く）:

- `MUNI-PAGE-SEO-01`: [gsc-page: /path]・[target: +N clicks]

**運用系の計測**（直近 7 日。閾値違反は日次 alert Issue と同じ判定。改善の判断は人）

| 計測 | 状態 | 要約 | 閾値違反 | active 施策 |
|---|---|---|---|---|
| PSI | ok（最新 2026-10-30） | モバイル中央値 82 点・最低 /ranking/future-population-change-rate-2050 40 / /ranking/total-population 47 / /ranking/agricultural-output 63 | 最新日 22/38 計測で error | なし |
| Cloudflare | ok（最新 2026-11-01） | Workers 519470 req・error 0.1%・R2 A 166653 / B 5546880・保存 43.158 GB | warning 16・info 7（R2 Class B ops > 1M/日、R2 account storage > 18GB、stats47 bucket storage > 12.5GB、R2 egress > 5GB/日） | なし |
| SNS | ok（最新 2026-10-30） | instagram 245 投稿・reach 23188・views 27339・eng 99 | —（閾値なし） | なし |

**期日超過の判定待ち**: active 5 件中 0 件


