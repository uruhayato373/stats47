# 計測→記録→改善サイクル — 2026-W46

計測週 **2026-W46**（GA4 rolling28d 2026-10-18〜2026-11-14、Japan-only）。前週との差は重複期間なので WoW ではない。

| 入力 | 状態 |
|---|---|
| ga4 | ok（transitions=ok landing=ok events=ok pages-clean=ok） |
| customDimensions | ok（登録済み 36 件） |
| ga4Settings | ok（keyEvents=affiliate_click|contact_click|cta_click|file_download|product_click|purchase bigQueryLinks=1 warnings=none） |
| improvements | ok（active 9 件） |
| effectVerdicts | ok（verdicts-2026-W46.json） |

**KPI ツリー**（正典: 事業計画 catalog → `data/business-plan/kpi-tree.json`。比較は 4 週前 2026-W42 = 窓が重ならない値。★ = 今月の重点レーンの KPI）

| 階層 | KPI | 今週 | 比較 | 目標 | 状態 | 施策 |
|---|---|---|---|---|---|---|
| NSM | 週次収益 | — | — | — | partial（判定できた分 ¥858。note 判定不能 (最終観測 2026-10-17 が週より前) / Kindle 判定不能 (日別の観測 1/7 日)） | — |
| 駆動 | ★ 有料購入 | — | — | — | unmeasurable（KDP 判定不能（日別の観測 1/7 日） / note 判定不能（最終観測 2026-10-17 が週より前）） | `NOTE-FISCAL-PEER-SALES-01`, `MUNI-PRODUCT-CARD-EFFECT-01` |
| 駆動 | ★ 検索クリック (GSC rolling28d) | 19931 | 13207 | 20,000（2026-W52） | ok | `MUNI-PREF-RANKING-OBS-01`, `MUNI-PAGE-SEO-01`, `OPENDATA-RANKING-EFFECT-01`, `OPENDATA-NDB-EFFECT-01` |
| 駆動 | ★ ページビュー (GA4 Japan 確定7日×4週) | 60944 | 44550 | 79,000（2026-W52） | ok | — |
| 駆動 | 広告収益効率 (AdSense) | 30.2 | — | — | ok（28 日の AdSense 収益 ¥1,842） | `ADSENSE-PLACEMENT-01` |
| 駆動 | ★ サイト内回遊率 (代表値: ブログ→ランキング) | 8.4% | 9.3% | — | ok | `RELATED-ARTICLES-EFFECT-01` |
| 駆動 | アフィリエイト収益効率 | GA4 7日 imp 4676・click 3 | — | — | partial（最終観測 2026-11-14。収益効率 (確定収益/1,000 imp) は ASP 成果と合わせて NSM 節で判定する） | — |
| 駆動 | ★ 業務文脈の着地セッション | 5872 | 4250 | — | ok | — |
| 守り | データ品質ゲート通過率 | 100.0% (2595/2596) | 99.2% | — | ok（監査 2026-11-14・不合格 recipe.drift 1） | — |
| 守り | サイト健全性 | PSI モバイル中央値 64・Workers error 0.1% | — | — | ok | — |
| 守り | 運用コスト | 閾値違反 27 件・R2 保存 52.478 GB | — | — | ok | `CF-CPU-URL-01` |
| 守り | インデックス登録率 | — | — | — | missing（coverage-submitted-history.csv に 2026-W46 以前の行が無い） | — |
| 守り | 計測の鮮度 | 10/11 | — | — | degraded（欠測・古い・認証切れ: kdp(auth_required)） | — |

**施策の配線**: active 4 件（上限 5 件）・KPI 未接続 0 件・`[target:]` なし 8 件

重点レーンの KPI なのに施策が 0 件: `site-pageviews`, `work-context-sessions`（今月の重点を動かす施策が台帳に無い）

**回遊（referrer 集計）**

| 遷移 | page_view | 遷移元 PV | 率 |
|---|---:|---:|---:|
| blog → ranking | 1020 | 12131 | 8.4% |
| themes → ranking | 242 | 1357 | 17.8% |
| themes → blog | 30 | 1357 | 2.2% |

**サイト内クリックの計測**: 導線名付きクリック 10807 ÷ サイト内の移動 24414 = 被覆率 44.3%。nav_click 20945 件のうち導線名なし 48.4%

導線名なしの行き先 (上位。次に導線名を付ける候補):
- ranking — 2402 クリック
- municipalities — 2358 クリック
- geo — 2321 クリック
- api — 719 クリック
- areas — 615 クリック
- home — 461 クリック
- themes — 445 クリック
- blog — 300 クリック

**業務文脈の着地**（平均: PC 53.7%・平日 9–18 時 50.1%。両方が平均超かつ 25 セッション以上。行政実務者である証明ではない）

- `/blog/automotive-industry-transformation-map` — 501 セッション・PC 81.8%・平日業務時間 73.0%
- `/` — 650 セッション・PC 80.0%・平日業務時間 56.2%
- `/ranking/habitable-area-ratio` — 251 セッション・PC 83.3%・平日業務時間 96.7%
- `/geo/datasets/A52` — 165 セッション・PC 98.8%・平日業務時間 78.6%
- `/ranking/specific-health-checkup-participation-rate` — 206 セッション・PC 76.7%・平日業務時間 70.8%
- `/ranking/inbound-visitors-by-destination` — 339 セッション・PC 60.2%・平日業務時間 54.0%
- `/blog/rice-harvest-volume-prefecture-gap` — 152 セッション・PC 80.3%・平日業務時間 69.6%
- `/ranking/annual-sunshine-duration` — 210 セッション・PC 58.6%・平日業務時間 53.4%

**未登録の custom dimension**（0 パラメータ。登録はオーナー作業・遡及しない）


**GA4 の設定の変化**（比較元: 2026-W45。意図しない変化と問題はバックログへ起票する）

- custom dimension: 変化なし
- キーイベント: 変化なし
- 監査の問題: なし

**効果判定エンジン**（2026-W46）: adsense 1 件 {"effect/pending":1}

GSC 施策 3 件中、機械判定できるのは 0 件 (理由付きで対象外 1 件: `MUNI-PREF-RANKING-OBS-01`)。残りは目印が欠けている（目標値は根拠があるときだけ書く）:

- `MUNI-PAGE-SEO-01`: [gsc-page: /path]・[target: +N clicks]
- `OPENDATA-RANKING-EFFECT-01`: [gsc-page: /path]・デプロイ済 YYYY-MM-DD・[target: +N clicks]
- `OPENDATA-NDB-EFFECT-01`: [gsc-page: /path]・デプロイ済 YYYY-MM-DD・[target: +N clicks]

**運用系の計測**（直近 7 日。閾値違反は日次 alert Issue と同じ判定。改善の判断は人）

| 計測 | 状態 | 要約 | 閾値違反 | active 施策 |
|---|---|---|---|---|
| PSI | ok（最新 2026-11-13） | モバイル中央値 64 点・最低 /areas/01000 42 / /ranking/future-population-change-rate-2050 47 / /ranking/total-population 52 | 最新日 23/38 計測で error | なし |
| Cloudflare | ok（最新 2026-11-14） | Workers 599301 req・error 0.1%・R2 A 72696 / B 6481057・保存 52.478 GB | warning 8・info 18・critical 1（Workers CPU 時間が 4,500 万 ms/日を超過、R2 account storage > 18GB、stats47 bucket storage > 12.5GB、R2 egress > 5GB/日、R2 Class B ops > 1M/日、Workers CPU 時間が 8,000 万 ms/日を超過） | `CF-CPU-URL-01` |
| SNS | ok（最新 2026-11-13） | instagram 245 投稿・reach 23249・views 27426・eng 104 | —（閾値なし） | なし |

**期日超過の判定待ち**: active 9 件中 1 件

- `ADSENSE-PLACEMENT-01` pending（期日 2026-11-14・adsense）

