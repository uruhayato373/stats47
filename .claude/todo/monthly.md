---
title: 今月の重点
type: monthly-plan
month: 2026-10
date: 2026-10-05
updated: 2026-10-07
status: active
focus_themes:
  - 週次収益 (NSM) を内訳つきで数字で言える状態にする
  - 公開している指標の誤り・古さを週 5 指標ずつ処置し、処置の流れを 4 週続ける
focus_domains:
  - 管理
  - データ
tags: []
---

# Monthly Plan 2026-10

10 月の重点は「管理」(計測) と「データ」(公開値の品質) の 2 領域とする。9 月は検索クリック (GSC rolling28d) が
W36 の 6,053 から W40 の 10,018 へ伸びた一方、週次収益 (NSM) は全週判定不能のまま終わり、週次 Must は W37〜W39 で
1/3・0/3・0/3 だった。流入はボトルネックではなく、収益を測る計器と計画の実行が止まっている。そこで 9/25 の合意
(`STRATEGY-FOCUS-2026-10-01`: 計測・データ品質を最優先、UI は計測で効果判定できる改善に限る、週次 Must の総量を増やさない) を
入力に、攻める領域 3 つ (管理・商品・データ) のうち管理とデータを選ぶ。

**共通事業方針 (HARM) の判断契約**: 読者の課題は「地域・家計・職種の比較を、誤りのない最新の公的統計で確かめたい」こと
(M: Money を主に、A: Ambition の進学・転職比較を含む)。今月の提供価値は、公開値の誤り・古さをなくすこと (無料価値の信頼性) と、
アフィリエイト・商品のどれが収益になっているかを測れるようにすること。支払う理由の証拠 (有料購入) は 9 月も未計測で、
需要の証拠は検索クリックの倍増 (GSC rolling28d) だけである。次の検証は、計測の鮮度を回復したうえで有料購入と
アフィリエイト確定収益を 4 週続けて取得できるかどうか。年収など個別テーマから購入意図を推定しない (application.json)。

## 月

- **対象月**: 2026-10 (2026-10-01 〜 2026-10-31)
- **含む ISO 週**: 2026-W40 〜 2026-W44 (本計画が実質カバーするのは W41 以降)
- **Sprint**: 旧 P0〜P3 の週番号工程は廃止済み (収益化戦略 §5)。本計画は意思決定ゲートの「計測」ゲートを通す月に当たる

## 予算前提（Pro 使用量）

- 9 月は W37 340 commit・W38 226 commit・W39 431 commit が計画外の作業に使われ、Must は 1/3・0/3・0/3 だった。
  問題はタスクの粒度ではなく、週の作業枠を Must に排他的に割り当てていないことにある (9 月月次レビューの課題 2)。
- **週次 Must は各重点領域 1 件・合計 2〜3 件まで**とし、総量を増やさない。Must に入れた作業が終わるまで計画外の作業を始めない。
- 計測の残作業の多くはオーナー作業 (再認証・キーチェーン登録・main マージ) である。Claude の作業枠はデータ品質と計測の配線に回す。
- 方針: 重点 2 テーマに集中する。下記「今月やらないこと」は 11 月以降へ送る。

## 前月の月次レビュー

- レビュー: `data/reviews/monthly/2026-09.md`
- 前月の重点: 重点 1 (未デプロイを本番へ届けて実測を再開) は**一部** (4 件中 3 件達成・T14d 比較の記録が未了)、
  重点 2 (公開しているものが正しいかを確定) は**未達** (37 metric の処置区分 0 件。09-25 に `DATA-QUALITY-LOOP-01` へ引き継ぎ)。

| 来月への申し送り (月次レビュー) | 行き先 | 今月の扱い (重点 / 週配分 / 見送り) |
|---|---|---|
| PR #1058 を main へマージし、期限ガードが既定ブランチで走ることを確かめる | #1058 | 週配分 (PR は 2026-10-01 にマージ済み。W41 に `review-cadence-guard.yml` の既定ブランチでの実行記録を確認する) |
| A8 の突合超過の原因を確定し、計測ゲートを通して Issue #1007 を閉じる | `A8-CROSSCHECK-EXCEED-01` / #1007 | 重点 1 |
| `AFF-IMPRESSION-ROUTING-01` の T14d 比較を期間・cohort・placement つきで記録する | 定常 (improvement-triage) | 週配分 (アフィリエイトは維持領域。効果判定は維持でも行う。W41 Should) |
| 37 metric の処置を `DATA-QUALITY-LOOP-01` の基準で進め、improvements の 2 行を閉じる | `DATA-QUALITY-LOOP-01` | 重点 2 (improvements の 2 行は月次棚卸しで閉じた) |
| もしも・KDP・ココナラを再認証し、9 月の締めを再取得する | `AUTH-CREDENTIAL-REGISTER-01` / #1052 | 重点 1 (オーナー作業) |
| KDP S1 12 冊の販売数と KENP を記録し 4 週窓の開始日を置く | `KDP-EXPANSION-01` | 重点 1 (有料購入 KPI の入力として W41 Should) |
| AdSense の再開を進め、再開日を before/after 境界として記録する | `ADSENSE-RESTART-01` | 見送り (下記の収益化戦略改訂の提案を先に通す) |
| BLOG-WAVE 7 件の pending を終了するか、事前 target つきの新規計測に移すか決める | `EFFECT-TARGET-MARKERS-01` | 重点 1 (🔴 へ昇格) |
| active 施策 26 件を上限 10 件へ戻す | 定常 (monthly-plan → improvement-triage) | 本計画で実施済み (現状サマリー参照) |
| ブログ是正キューで 1 本を critic PASS まで通すか、是正を計画から外すか決める | `BLOG-REMEDIATION-PROOF-01` | 見送り (サイト領域は維持。11 月に再判断) |
| W39 の CTR 低下をページ × クエリで分解する | `GSC-CTR-DECOMPOSE-01` | 週配分 (サイト維持。分析のみ W42 Should) |
| 申し送り検査が improvements の施策 ID を認識するように直す | `REVIEW-ROUTE-IMPROVEMENTS-IDS-01` | 完了 (2026-10-05 `ff19c7d88`。improvements の表行 ID と ledger completed の ID を実在扱いに修正) |
| EXP-006 は Studio 所有確認まで進めず、期日を 2026-10-31 へ延長する | EXP-006 | 見送り (`/nsm-experiment` で延長を記録するだけ) |
| Workers CPU 時間の増加原因を特定し #813 を閉じられるか確かめる | `CF-CPU-SURGE-01` / #813 | 重点 1 (運用コスト KPI) |
| SNS の予約補充 (10-31 まで) と「再予約しない」の食い違いを解消する | 定常 (本計画の今月やらないこと) | 見送り。`THREADS-TOPUP-01` は予約済み枠の補充だけ許し、新規の量産はしない |

## 現状サマリー

| 指標 | 現在値 | 先月比 | 備考 |
|---|---|---|---|
| 週次収益（NSM・月内合計）| 判定不能 4 週 (W36〜W39) | — | 9 月の判定済み 5 源の確定は ¥0。もしも・note・KDP は判定不能 |
| 楽天アフィリエイト（前月確定）| ¥0 (0 件・クリック 30) | — | `rakuten-results.json` 2026-09 行 (observedAt 10-01) |
| ★ 計測の鮮度 (`measurement-freshness`) | 7/14 (degraded) | W39 12/13 から悪化 | affiliate・psi・cloudflare・sns・gsc(runner_failed)・kdp/coconala(auth_required) |
| ★ データ品質ゲート通過率 (`data-quality-pass-rate`) | 100.0% (2423/2423・監査 10-03) | W39 0.995 → 1.000 | 欠損系は解消。残るのは古さ・年表記 (`DATA-QUALITY-LOOP-01` キュー) |
| ★ 検索クリック (`search-clicks`・GSC rolling28d) | 10,018 | 4 週前 (W36) 6,053 比 +65.5% | CTR 3.41%・平均順位 6.85。W40 確定 7 日は partial で WoW 停止 |
| ★ サイト健全性 (`site-health`) | PSI モバイル中央値 70・Workers error 0.1% | — | partial |
| ★ 運用コスト (`operating-cost`) | 閾値違反 15 件・R2 保存 33.356 GB | — | stale |
| active 施策 / 上限 | 25 → 9 / 10 | | improvement-triage が 2 件を閉鎖 (DATA-ESTAT-FETCH-01・DATA-MANUAL-RESTORE-01)、14 件を backlog 🟡 へ降格。target なし 7 件 |
| バックログ 🔴 / 上限 | 付け替え前 9 → 後 10 / 10 | | 30 日超の未着手 🔴 0 枚。降格 2 (`GSC-COVERAGE-DEPLOY-01`・`NOTE-FISCAL-PEER-PUBLISH-01`)、昇格 3 (`EFFECT-TARGET-MARKERS-01`・`DATA-WAGE-TABLE-YEARS-01`・`NAV-CLICK-COVERAGE-01`) |
| 公開記事数 | 本計画では未集計 | — | 月次レビューの入力に無い |
| 改善ログ effect/pending (閾値エンジン) | 7 件 (BLOG-WAVE・全件 insufficient-target) | 9 月と同じ | `EFFECT-TARGET-MARKERS-01` で終端を決める |

## GSC運用サイクル

`node .claude/scripts/gsc/audit-operations-cycle.mjs --stage monthly` (2026-10-05) の結果。

| 項目 | 最新 | 月内評価 | 次アクション |
|---|---|---|---|
| 計測→週次review | 2026-W40 / FAIL (W40 review 未作成・W40 確定 7 日が partial) | 直近4週 3/4 | `/weekly-review 2026-W40`、`npm run fetch-gsc-snapshot -- 2026-W40` で 09-30・10-01 を補完 |
| search-growth判断 | W40 approve/dismiss 1 件 | 週次最低 1 件を満たす | 承認済み `barber-beautician-annual-income` の終端を W41 Could で決める |
| effect判定 | pending 7 (全件 insufficient-target)・確定 0 | target 欠落 7 件 (既知・新規 0) | `EFFECT-TARGET-MARKERS-01` で終了か再計測かを決める |
| index coverage | URL Inspection 2026-10-05 (age 0d) / coverage-drilldown 最新 W36 | inspection fresh・coverage export stale | `GSC-COVERAGE-DEPLOY-01` (🟡) のオーナー export を待つ |

## 今月の重点テーマ（1-2 個）

### 重点1: 週次収益 (NSM) を内訳つきで数字で言える状態にする (領域: 管理)

- **なぜ今月これか**: 収益直結かつ複数週 stall。週次収益は 9 月の全週で判定不能、アフィリエイト計測ゲートは W37〜W39 の 3 週 failure。
  計器が無いまま収益施策を足すと、効果を判定できない施策が増えるだけになる (収益化戦略 §5「計測」ゲート)。
- **今月のゴール（月末に検証可能）**: W44 の計測サイクルで `measurement-freshness` が 12/14 以上、かつ W43・W44 の 2 週続けて
  週次収益の内訳 (アフィリエイト発生額・商品実売) が判定不能 0 源で出る。Issue #1007 が close できる状態になる。
- **判定に使う KPI**: `measurement-freshness` (現在 7/14、W39 12/13 から悪化)、`operating-cost` (閾値違反 15 件・R2 33.356 GB)
- **構成タスク**:
  - `STATE-OVERLAY-MAIN-01` の develop→main マージと、次の psi / cloudflare / W41 週次コミットで削除行 0 を確認 [S・オーナー] (→ W41、期日 10-11)
  - `A8-CROSSCHECK-EXCEED-01` で A8 突合超過の原因を確定し、計測ゲートを pass させる [M] — 成功基準 `node .claude/scripts/ads/check-a8-outcome-gate.mjs` が pass (→ W41 Must)
  - `AUTH-CREDENTIAL-REGISTER-01` / `AUTHENTICATED-MEASUREMENT-ACTIVATION-01` でもしも・KDP・ココナラ・note を再認証し、9 月の締めを再取得 [S・オーナー] — 成功基準 `npm run measurement:status -- --check` (→ W41〜W42)
  - `EFFECT-TARGET-MARKERS-01` で BLOG-WAVE 7 件を終了するか事前 target つき再計測に移すかを決める [S] (→ W42 Must)
  - `NAV-CLICK-COVERAGE-01` でサイト内リンクのクリックを既定で全件計測する (UI 改善を計測で判定する土台) [M] (→ W43 Must、期日 10-23)
  - `CF-CPU-SURGE-01` の原因特定と #813 の閉鎖判断 [M] (→ W43〜W44、期日 10-16 は W42 で再設定を判断)
- **依存・ブロッカー**: 再認証・キーチェーン登録・main マージはオーナー作業。GA4 カスタムディメンション 4 項目の登録 (`FUNNEL-CTA-01` の前提) もオーナー作業。
- **真実源リンク**: `backlog.md#A8-CROSSCHECK-EXCEED-01`、`backlog.md#AUTH-CREDENTIAL-REGISTER-01`、`backlog.md#NAV-CLICK-COVERAGE-01`、`improvements.md#PERF-WORKER-P99-01`、`improvements.md#R2-STORAGE-01`

### 重点2: 公開している指標の誤り・古さを週 5 指標ずつ処置し、処置の流れを 4 週続ける (領域: データ)

- **なぜ今月これか**: 7 月から 3 か月続けて未達。欠損は 09-25 に解消を確認したので、残るのは古さ・年表記・終了・薄さの処置である。
  検索クリックが倍増した今、誤った年や古い値を見せる損失が大きくなる。
- **今月のゴール（月末に検証可能）**: `data/data-quality/checks/queue.json` で W41〜W44 の 4 週続けて「処置件数 ≥ 新規検出」となり、
  需要上位から計 20 指標に処置 (更新 / 調査終了 / noindex / 誤検出) が付く。`data-quality-pass-rate` は 100% を維持する。
- **判定に使う KPI**: `data-quality-pass-rate` (100.0%、W39 0.995 から改善)、`search-clicks` (10,018、4 週前比 +65.5%。ガードとして悪化しないこと)
- **構成タスク**:
  - `DATA-QUALITY-LOOP-01` ③ 需要上位 5 指標の処置 (公式の最新公表を確認してから処置) [M] — 毎週 Must 1 件 (→ W41〜W44)
  - `DATA-WAGE-TABLE-YEARS-01` 賃金構造基本統計の 40 指標が 2022 年しか配信していない原因を CI の年別 non-null で確定する [M] (→ W42)
  - `YEAR-COV-20260926` 年カバレッジ 10 件の years 拡張 (sweep) [S] (→ W43)
  - キューの処置状況を週次レビューで読み、「新規検出 ≤ 処置件数」を 4 週記録する [S] (→ 毎週の `/weekly-review`)
- **依存・ブロッカー**: e-Stat の取得は CI 専用 (data-refresh の dryRun → オーナー承認 → R2 反映)。R2 反映はオーナー承認が要る。
- **真実源リンク**: `backlog.md#DATA-QUALITY-LOOP-01`、`backlog.md#DATA-WAGE-TABLE-YEARS-01`、`backlog.md#YEAR-COV-20260926`

## 今月やらないこと（予算のため意図的に見送る）

- **UI を「攻める」に変えること** — `STRATEGY-FOCUS-2026-10-01` は UI・回遊を 3 つ目の重点にする案だったが、9/30 に領域が 8 つになり、
  重点は「攻める」領域から 1〜2 個 (DG076) に固定された。UI はサイト領域 (維持) のまま、不具合と表示の意味の誤りの修正だけを Should 以下で扱う。
  UI 改善の効果判定の土台は重点 1 の `NAV-CLICK-COVERAGE-01` が作る。再検討は 11 月 (回遊の計測が 4 週溜まってから)。
- **商品領域の新規制作** (`ADMIN-STAT-PILOT-01` は聞き取りの期日管理だけ、`NOTE-FISCAL-PEER-PUBLISH-01` は 🟡 へ) — 計測が戻るまで実売を判定できない。11 月に再判断。
- **AdSense の広告配置の設計** — 09-28 の再開決定は 10-07 に収益化戦略 §3.1・§5 へ反映済み。10 月はオーナーの新アカウント申請
  (`ADSENSE-RESTART-01` 手順 1・2) と、承認後の確認タグ・ads.txt までに留め、配置設計は承認後 (11 月以降) に行う。
- **アフィリエイトの枠・案件の追加** — 維持領域。進行中施策 (`AFF-RESOLUTION-EFFECT-01` 10-08・`AFF-IMPRESSION-ROUTING-01`) の効果判定だけを行う。
- **ブログ是正 (`BLOG-REMEDIATION-PROOF-01`) と新規記事の拡大** — サイト維持。月 15〜20 本の上限内の公開は定常運用として続け、是正は 11 月に再判断。
- **SNS の新規予約・量産** — 維持。`THREADS-TOPUP-01` は 10-31 までの予約済み枠の補充だけ許す。
- **EXP-006 (YouTube pilot)** — オーナーの Studio 所有確認まで制作と計測日を進めない。

## 10-07 追加: AdSense 月¥1万に向けた PV 計画 (重点の外・定常運用で進める)

重点 2 つは変えない。10-07 に決めた PV 計画 (マーケティング戦略「広告収益との換算」) は、10 月は次の範囲だけ進める。

| 種別 | 内容 | ID | 時期 |
|---|---|---|---|
| 計測 (重点1 に含む) | `site-pageviews` を毎週の KPI ツリーで読む (接続済み)。週次レビューに 1 行書く | — | 毎週 |
| 計測 (重点1 に含む) | KDP の月次レポートを販売台帳へ自動で入れ、週次収益の KDP 分を判定可能にする | `KDP-LEDGER-AUTO-01` | W42 Should |
| 不具合 | 事業計画の鮮度欄がファイル時刻になるのを直す | `BUSINESS-PLAN-FRESHNESS-MTIME-01` | W43 Could |
| オーナー | AdSense 新アカウント申請 / note の雑学有料記事の無料化 (少数ずつ) / Amazon 導線 PR #1099 の本番反映判断 | `ADSENSE-RESTART-01` / `NOTE-FREE-DEFAULT-01` / `AMAZON-ASSOCIATE-PILOT-01` | W41〜W42 |
| 判定 | 2026-12-31 に PV の実績を里程標 (W52 に 28 日 79,000) と比べる | `PV-PLAN-REVIEW-2026Q4-01` | 12 月 |

**11 月の重点候補 (`/monthly-plan` で判断)**: AdSense が承認されていれば管理 (`ad-yield` の接続) と、サイト領域の構えの見直し
(条件: `ad-yield` を 4 週測れたら攻めるへ)。商品は `KNOWHOW-PRODUCT-PILOT-01` と KDP (`KDP-EXPANSION-01`、既刊の計測が戻ってから)。

## 週への配分（ガイド・週次計画が詳細化）

| 週 | 主に進める重点 | マイルストーン |
|---|---|---|
| W41 (10/5〜10/11) | 重点1 / 重点2 | Must: `A8-CROSSCHECK-EXCEED-01` の原因確定・`DATA-QUALITY-LOOP-01` 5 指標。オーナー: `STATE-OVERLAY-MAIN-01` マージ (10/11 の週次 run 前)・再認証。W40 週次レビューを先に書く |
| W42 (10/12〜10/18) | 重点1 / 重点2 | Must: `EFFECT-TARGET-MARKERS-01` の終端判断・`DATA-QUALITY-LOOP-01` 5 指標。Should: `DATA-WAGE-TABLE-YEARS-01` の CI 観測 |
| W43 (10/19〜10/25) | 重点1 / 重点2 | Must: `NAV-CLICK-COVERAGE-01` (期日 10-23)・`DATA-QUALITY-LOOP-01` 5 指標。`measurement-freshness` 12/14 の中間確認 |
| W44 (10/26〜11/1) | 重点1 / 重点2 | Must: `CF-CPU-SURGE-01` の判断・`DATA-QUALITY-LOOP-01` 5 指標。月末に 4 週の「処置 ≥ 検出」と週次収益の内訳を確認し `/monthly-review` へ |

## 批判的レビュー

1. **重点が 3 つ以上になっていないか**: 2 つ (管理・データ)。`STRATEGY-FOCUS-2026-10-01` の 3 レーン案は DG076 と 9/30 の領域統合に合わないため、
   UI は維持領域のまま扱い、計測の土台 (`NAV-CLICK-COVERAGE-01`) だけを重点 1 に入れた。
2. **先月と同じテーマを重点に置いてまた未達では**: データ品質は 3 か月連続の重点である。過去の失敗原因は粒度ではなく
   「担当セッションが起動されない」割当の問題だった (W38 レビュー)。今月は (a) 週次 Must を各重点 1 件に限り、
   (b) データ品質の Must を毎週同じ形 (需要上位 5 指標) に固定し、(c) 処置の判定をキューの件数で機械的に読む。
   2 週連続で 0 件なら DG082 に従い分割するか、重点 2 を 11 月に外す。計測も 9 月の重点 1 の延長だが、9 月は配信までで、今月は認証と突合の回復という別の段である。
3. **予算内で終わるか**: L タスクは 0 件、M は 5 件。オーナー作業 (マージ・再認証) が遅れると重点 1 のゴールは未達になるため、W42 の週次レビューで
   `measurement:status` が改善していなければ、ゴールを「Claude 側で閉じられる A8 ゲート pass と EFFECT-TARGET の終端」に縮める。
4. **[提案] 収益化戦略 §5 の改訂 (本計画では改訂しない)**: (a) 「AdSense」ゲートの「恒久停止」は 09-28 の再開判断 (`ADSENSE-RESTART-01`) と食い違う。
   オーナーの判断どおり再開するなら、ゲート表と §3.1 を改訂し、アフィリエイト領域の狙いに「AdSense 再開日の before/after 境界」を加える。
   (b) 管理領域の「構えを変える条件」(週次収益の内訳が 4 週続けて取得) は今月のゴールの先にある。満たした月に維持へ移す。
   改訂は strategy-advisor がオーナー確認のうえ別差分で行う。

## 関連ドキュメント

- 収益化戦略: `docs/00_プロジェクト管理/02_収益化戦略.md`
- 前月の月次レビュー: `data/reviews/monthly/2026-09.md`
- 改善バックログ: `.claude/todo/improvements.md`
- バックログ (機能・自動化・指標): `.claude/todo/backlog.md`
- 実装計画 INDEX: `docs/02_実装計画/00_INDEX.md`
- 計測サイクル: `data/measurement-cycle/LATEST.md`
