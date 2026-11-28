# 計測→記録→改善サイクル — 2026-W47

計測週 **2026-W47**（GA4 rolling28d 2026-10-25〜2026-11-21、Japan-only）。前週との差は重複期間なので WoW ではない。

| 入力 | 状態 |
|---|---|
| ga4 | ok（transitions=ok landing=ok events=ok pages-clean=ok） |
| customDimensions | ok（登録済み 36 件） |
| ga4Settings | ok（keyEvents=affiliate_click|contact_click|cta_click|file_download|product_click|purchase bigQueryLinks=1 warnings=none） |
| improvements | ok（active 11 件） |
| effectVerdicts | ok（verdicts-2026-W47.json） |

**KPI ツリー**（正典: 事業計画 catalog → `data/business-plan/kpi-tree.json`。比較は 4 週前 2026-W43 = 窓が重ならない値。★ = 今月の重点レーンの KPI）

| 階層 | KPI | 今週 | 比較 | 目標 | 状態 | 施策 |
|---|---|---|---|---|---|---|
| NSM | 週次収益 | — | — | — | partial（判定できた分 ¥784。note 判定不能 (最終観測 2026-10-17 が週より前) / Kindle 判定不能 (日別の観測 0/7 日)） | — |
| 駆動 | ★ 有料購入 | — | — | — | unmeasurable（KDP 判定不能（日別の観測 0/7 日） / note 判定不能（最終観測 2026-10-17 が週より前）） | `NOTE-FISCAL-PEER-SALES-01`, `MUNI-PRODUCT-CARD-EFFECT-01`, `PRODUCT-REFERRAL-OBS-01`, `KDP-LISTING-COPY-OBS-01` |
| 駆動 | ★ 検索クリック (GSC rolling28d) | 19196 | 14733 | 20,000（2026-W52） | ok | `MUNI-PREF-RANKING-OBS-01`, `OPENDATA-RANKING-EFFECT-01`, `OPENDATA-NDB-EFFECT-01`, `KAKEI-REFLECT-EFFECT-01` |
| 駆動 | ★ ページビュー (GA4 Japan 確定7日×4週) | 60437 | 48338 | 79,000（2026-W52） | ok | — |
| 駆動 | 広告収益効率 (AdSense) | 40 | — | — | ok（28 日の AdSense 収益 ¥2,416） | `ADSENSE-PLACEMENT-01` |
| 駆動 | ★ サイト内回遊率 (代表値: ブログ→ランキング) | 7.8% | 9.7% | — | ok | `RELATED-ARTICLES-EFFECT-01` |
| 駆動 | アフィリエイト収益効率 | GA4 7日 imp 46・click 0 | — | — | partial（最終観測 2026-11-21。収益効率 (確定収益/1,000 imp) は ASP 成果と合わせて NSM 節で判定する） | — |
| 駆動 | ★ 業務文脈の着地セッション | 5229 | 4555 | — | ok | — |
| 守り | データ品質ゲート通過率 | 100.0% (2623/2624) | 100.0% | — | ok（監査 2026-11-28・不合格 recipe.drift 1） | — |
| 守り | サイト健全性 | PSI モバイル中央値 73・Workers error 0.2% | — | — | ok | — |
| 守り | 運用コスト | 閾値違反 20 件・R2 保存 65.693 GB | — | — | ok | `CF-CPU-URL-01` |
| 守り | インデックス登録率 | 84.6% | — | — | ok（2026-W47・登録済み 7,967・未登録 1,448） | — |
| 守り | 計測の鮮度 | 8/11 | — | — | degraded（欠測・古い・認証切れ: note(runner_failed), gsc(runner_failed), kdp(runner_failed)） | — |

**施策の配線**: active 3 件（上限 5 件）・KPI 未接続 0 件・`[target:]` なし 10 件

重点レーンの KPI なのに施策が 0 件: `site-pageviews`, `work-context-sessions`（今月の重点を動かす施策が台帳に無い）

**回遊（referrer 集計）**

| 遷移 | page_view | 遷移元 PV | 率 |
|---|---:|---:|---:|
| blog → ranking | 876 | 11272 | 7.8% |
| themes → ranking | 239 | 1438 | 16.6% |
| themes → blog | 38 | 1438 | 2.6% |

**サイト内クリックの計測**: 導線名付きクリック 11597 ÷ サイト内の移動 24233 = 被覆率 47.9%。nav_click 20185 件のうち導線名なし 42.5%

導線名なしの行き先 (上位。次に導線名を付ける候補):
- ranking — 2292 クリック
- municipalities — 1993 クリック
- geo — 1621 クリック
- areas — 612 クリック
- themes — 519 クリック
- home — 457 クリック
- api — 437 クリック
- blog — 287 クリック

**業務文脈の着地**（平均: PC 54.5%・平日 9–18 時 50.5%。両方が平均超かつ 25 セッション以上。行政実務者である証明ではない）

- `/ranking/habitable-area-ratio` — 365 セッション・PC 83.8%・平日業務時間 97.1%
- `/` — 603 セッション・PC 80.8%・平日業務時間 53.4%
- `/blog/automotive-industry-transformation-map` — 389 セッション・PC 81.2%・平日業務時間 72.0%
- `/ranking/inbound-visitors-by-destination` — 371 セッション・PC 66.2%・平日業務時間 59.9%
- `/geo/datasets/A52` — 164 セッション・PC 99.4%・平日業務時間 79.4%
- `/ranking/specific-health-checkup-participation-rate` — 184 セッション・PC 74.5%・平日業務時間 70.1%
- `/blog/rice-harvest-volume-prefecture-gap` — 135 セッション・PC 81.5%・平日業務時間 69.4%
- `/ranking` — 107 セッション・PC 95.3%・平日業務時間 64.0%

**未登録の custom dimension**（0 パラメータ。登録はオーナー作業・遡及しない）


**GA4 の設定の変化**（比較元: 2026-W46。意図しない変化と問題はバックログへ起票する）

- custom dimension: 変化なし
- キーイベント: 変化なし
- 監査の問題: なし

**効果判定エンジン**（2026-W47）: gsc-blog-wave 1 件 {"effect/pending":1} / adsense 1 件 {"effect/pending":1}

GSC 施策 0 件中、機械判定できるのは 0 件。目印の欠けた施策は無い (理由付きで対象外 4 件: `MUNI-PREF-RANKING-OBS-01`, `OPENDATA-RANKING-EFFECT-01`, `OPENDATA-NDB-EFFECT-01`, `KAKEI-REFLECT-EFFECT-01`)。

**運用系の計測**（直近 7 日。閾値違反は日次 alert Issue と同じ判定。改善の判断は人）

| 計測 | 状態 | 要約 | 閾値違反 | active 施策 |
|---|---|---|---|---|
| PSI | ok（最新 2026-11-20） | モバイル中央値 73 点・最低 /areas/01000 50 / /ranking/future-population-change-rate-2050 57 / / 60 | 最新日 21/38 計測で error | なし |
| Cloudflare | ok（最新 2026-11-21） | Workers 595776 req・error 0.2%・CPU 1 日平均 3,682 万 ms (月換算 約 $26.49)・R2 A 29891 / B 5632494・保存 65.693 GB | info 18・warning 2（R2 account storage > 18GB、stats47 bucket storage > 12.5GB、R2 egress > 5GB/日、Workers CPU 時間が 4,500 万 ms/日を超過、R2 Class B ops > 1M/日） | `CF-CPU-URL-01` |
| SNS | ok（最新 2026-11-20） | instagram 245 投稿・reach 23289・views 27468・eng 106 | —（閾値なし） | なし |

**期日超過の判定待ち**: active 11 件中 0 件


