---
title: 今週の計画
type: weekly-plan
week: 2026-W39
date: 2026-09-21
updated: 2026-09-20
status: active
tags: []
---

# 2026-W39 今週の計画

期間: 2026-09-21（月）〜 2026-09-27（日）。9月計画（W37〜W40）の3週目。
W38でMust 0/3となったため、新規施策を増やさず、計測・入力鮮度・既存品質の3束だけをMustにする。

## 週

- **ISO Week**: 2026-W39
- **期間**: 2026-09-21 〜 2026-09-27
- **Sprint**: 2026-09月次計画（W37〜W40）の Week 3/4

## 前週の申し送り

| W38申し送り | W39での扱い |
|---|---|
| `AFF-MEASURE-RECOVER-01` のR2・history・measurementGate実走確認 | **Must 1**。コード到達とデータ到達を分け、3点が揃うまで完了にしない |
| `AFF-IMPRESSION-ROUTING-01` のT14d | **Must 1**。09-27の確定7日を取得し、重複しない窓で比較する |
| GSC coverage UI exportの鮮度回復 | **完了**。09-20 export→ingest→3,235 URL本番probe→search-growth再生成まで実施。W39は **Must 2** でfirst waveを分類する |
| `DATA-ESTAT-FETCH-01` | Mustから外し、data-ingesterへowner移管。一次メタが揃うまで公開しない |
| BLOG-WAVE 7件のtarget欠落 | **Should 2**。推測で補わず、終了または新規計測を決める |
| search-growth approved 1件 | **Should 1**。content実測後に補強/noindex/dismissを終端する |
| X期限超過scheduled 27件 | **Should 3**。新規予約せず、post URLと本文一致で分類する |
| KDP S1 12冊のlive read-back | **Could 1**。公開候補は増やさず、置換状態と4週計測開始条件だけ確認する |
| EXP-006 owner action | **Could 2**。Studio所有確認が無ければ制作・measureを進めない |

## 今月の重点（月次計画より）

- **重点テーマ**: 計測を再開する / 公開しているものが正しいか確定する
- **今週この重点で進めること**:
  - アフィリエイトGA4の確定7日をR2・git履歴・運用gateまで到達させる
  - fresh化したGSC coverageからfirst wave 20件を分類し、観測契約へ接続する
  - 公開済み記事のmust-fix上位3本を意味レビュー込みで是正する
- **今週やらないこと**: 新規広告枠、KDP新規パイロット、SNS再予約、新規NSM実験、タイトル一括変更

## 前週の振り返り（W38）

| タスク | 分類 | 状態 | メモ |
|---|---|---|---|
| GA4アフィリエイト実測を読める状態にする | Must | 未達 | レビュー時点は09-20 22:00の初回run前。R2 indexと履歴の実走証拠なし |
| `AFF-IMPRESSION-ROUTING-01` T48h | Must | 未達 | 代表3ページ計装と重複カウントを記録できず |
| `DATA-ESTAT-FETCH-01` 5 metric | Must | 未達 | 0/5。縮小しても未着手のためowner移管 |
| before/after境界と期限 | Should | 一部 | affiliateとAdSenseは確定。他3件は期限超過 |
| effect-verdict 7件終端 | Should | 未達 | 全件insufficient-target |
| ブログ是正done減少の原因 | Should | 完了 | 再劣化ではなく母集団入替と確定 |
| search-growth承認済み1件 | Could | 未達 | approvedのまま、content実測なし |
| X予約14件の発火分類 | Could | 未達 | 期限超過scheduledが27件へ増加 |

**実行パターン**: 計画外の作業量は大きい一方、Mustは5週連続で残った。W39はMustごとに完了証拠と停止条件を固定し、別作業をMust完了へ読み替えない。

## 現状サマリー

| 指標 | W38確定値 | 比較・目標 |
|---|---:|---|
| GA4 engagedSessions（Japan-only確定7日） | 3,347 | 前週3,067、+9.1% |
| GSC clicks（確定7日） | 2,958 | 前週2,381、+24.2% |
| GSC impressions（確定7日） | 77,443 | 前週73,763、+5.0% |
| GSC CTR | 3.82% | 前週3.23%、+0.59pp |
| R2公開ブログ | 616 | 新規公開0 |
| ブログ是正 | done 20 / pending 319 | must-fix 32 |
| SNS W38投稿 | X 0 / Instagram 0 / YouTube 0 | 新規予約しない |
| GSC運用サイクル | **WARN（FAIL 0）** | 既知のtarget欠落7件以外をPASSで維持 |
| KDP公開ゲート | **hold** | S1現行版 live 3 / in_review 9、販売・KENP not-measured |

KPIはW38 snapshotの `finalized7d` と重複しない `previous7d` のみで比較する。rolling 28日は候補発見専用とし、WoWとは呼ばない。

## 読者課題・事業方針

- **読者の課題**: 地域・仕事・家計・行政の統計を、定義・年次・分母を誤らず意思決定に使いたい。
- **HARM**: Money / Ambition。家計・就業・行政実務の判断を助けるが、テーマ分類だけで購入意図を断定しない。
- **提供価値・支払う理由**: 無料Webは発見と比較、有料商品は用途別に編集した固定版・図表・確認手順を一括提供する。
- **需要証拠**: 検索需要はGSC clicks +24.2%、NSM +9.1%。有料需要はaffiliate・KDP・CTAが未計測で未検証。
- **次の検証**: affiliate確定7日、KDP全12冊live後4週sales/KENP、CTAカスタムdimension登録後の行動計測。

## トレンド機会

| トレンド | 一次ソース | stats47との接続 | W39アクション |
|---|---|---|---|
| 2026年住民基本台帳の都道府県別人口・人口動態 | e-Stat（2026年次） | 人口・将来人口Geo pilotと接続可能 | **保留**。provenanceと既存metric重複だけCouldで確認 |
| 家計調査2026年7月分 | 総務省統計局（09-04公表） | 家計・支出ランキングと接続可能 | **保留**。月次重点外の新規記事は作らない |
| 9月上旬の気象観測値ランキング | 気象庁 | 地域差コンテンツ候補 | **不採用**。速報性より計測復旧を優先 |

## 前週からの持ち越し

- [ ] `AFF-MEASURE-RECOVER-01` — 元W38 Must
- [ ] `AFF-IMPRESSION-ROUTING-01` T14d — 元W38 Must
- [ ] GSC coverage first wave 20件の分類 — fresh化済みキューからW39で着手
- [ ] search-growth `soft-404-risk::/ranking/barber-beautician-annual-income` 終端 — 元W38 Could
- [ ] X期限超過scheduled 27件の分類 — 元W38 Could
- [ ] KDP S1置換版のlive read-back — W38申し送り

## 改善ログ pending（今週着手対象）

| Tier | Metric | ID | Status | Due | Owner |
|---|---|---|---|---|---|
| 1 | affiliate | AFF-MEASURE-RECOVER-01 | pending | 2026-09-21 | affiliate-manager |
| 1 | gsc | COVERAGE-LOOP-01 | effect/pending | 2026-09-14超過 | gsc-analyst + owner export |
| 1 | affiliate | AFF-IMPRESSION-ROUTING-01 | in-progress | 2026-09-27 | affiliate-manager |
| 1 | gsc | SEARCH-GROWTH-CYCLE-01 | pending | 2026-09-21 | gsc-analyst |
| 2 | blog | remediation must-fix 3件 | pending | 2026-09-27 | blog-editor / article-writer |

## 今週のタスク

### Must（絶対達成、3件）

- [ ] **アフィリエイト計測経路を本番実走で閉じる** [M] — `AFF-MEASURE-RECOVER-01`。09-20日曜runと09-21月曜retryについて、R2の日別・`latest.json`・indexが公開read pathで一致し、developの履歴に `periodEnd,7,_all,_all` 行があり、measurementGateがsuccessであることを確認する。失敗時は固定Issueがupsertされ、復旧runでcloseされることも確認する。09-27には`AFF-IMPRESSION-ROUTING-01`のT14d確定7日を同じ契約で取得する。どれか1点でも欠ければ未完了。使用: `/affiliate-improvement`
- [ ] **GSC coverage first wave 20件を分類し観測へ接続する** [M] — 09-20にfresh化したキューの上位20件について、sitemap掲載・内部リンク・canonical・現在HTTPを確認し、`observe-after-fix`のまま観測するURLと実装修正が必要なURLを理由付きで記録する。20/20の状態更新、URL Inspection対象への接続、`audit-operations-cycle --stage plan --week 2026-W38 --strict` のFAIL 0維持で完了。インデックス登録はInspection証拠が出るまで完了扱いしない。使用: `/gsc-coverage-remediation`、`/search-growth`
- [ ] **ブログ品質是正3本を完了する** [L] — `natto-consumption-east-west-divide`、`train-commuters-prefecture-gap`、`low-birthweight-rate-prefecture-gap`をキュー順に是正し、各記事で決定的audit・factual check・blog-critic PASS・公開read-backを満たしてdone化する。3本未満なら未完了。使用: `/brushup-blog --target queue --next 3`

### Should（できればやる、3件）

- [ ] **承認済みsearch-growth 1件を終端する** [S] — `barber-beautician-annual-income`のR2観測年数・データ点数・描画を実測し、補強/noindex/dismissのいずれかを理由付きで機械記録する。titleだけの変更はしない。使用: `/search-growth`
- [ ] **target欠落7件を終了または再計測へ分ける** [S] — 後付けtargetを推測せず、各BLOG-WAVEを終了するか、事前target付きの新規計測へ移す。`effect/pending`を効果ありに変換しない。使用: `/triage-improvement-log`
- [ ] **X期限超過scheduled 27件を分類する** [M] — 投稿URLと本文一致でposted/未発火を確定し、未発火分は新規予約せず台帳状態だけ直す。使用: `/update-sns-metrics`

### Could（余力があれば、2件）

- [ ] **KDP S1置換状態をread-backする** [S] — 12冊の現行版liveを確認し、旧版停止と4週sales/KENP計測の開始条件だけ更新する。新規パイロットは公開しない。使用: `/kdp-publish`
- [ ] **2026年住民基本台帳データの適合性を調べる** [S] — 人口×将来人口Geo pilotとの重複、都道府県粒度、年次、provenanceを確認する。今週は記事化・R2投入をしない。使用: `/inspect-estat-meta`

## search-growth候補

| 区分 | 候補 | W39判断 |
|---|---|---|
| technical | `server-risk::/blog/white-bread-consumption-quantity-prefecture-gap` | 3/3回200・canonical一致でdismiss済み。再発が無ければ再起票しない |
| content | `ctr-opportunity::/survey/census` | query intentとhub責務が不一致。未承認のまま、title一括変更しない |
| measurement | `measurement-gap::/` | GA4/CrUX欠損を0扱いしない。coverage回復を先行 |
| approved carryover | `soft-404-risk::/ranking/barber-beautician-annual-income` | Should 1で1件だけ終端 |

新しい候補をimprovementsへ自動追加しない。全active WIPは5以下、採用は週1〜2件を上限とする。

## NSM実験

- activeは `EXP-006` 1件。28日経過したが動画0本、Studio baselineなし、pending owner action 2件のためmeasureしない。
- 候補評価:
  - `train-commuters-prefecture-gap`内部リンク是正は高表示・低工数だが、既存remediationの品質修正としてMust 3へ含め、別実験を増やさない。
  - `/survey/census` CTR候補は1,511 impressionsだが、個別統計queryとsurvey hubの責務がずれており確実性不足。
- **新規実験は開始しない**。計測復旧とEXP-006 owner actionのどちらかが閉じるまでactiveを増やさない。

## KDP公開ゲート

- **判定**: `hold`
- **portfolio**: S1現行版 live 3 / in_review 9、パイロット live 0
- **候補**: なし
- **需要証拠**: sales ledger observations 0。販売数/KENPは`not-measured`であり0需要ではない
- **停止条件**: S1全12冊のlive read-back、旧版停止、4週sales/KENP計測
- **承認境界**: 本計画は公開承認ではない。候補が`ready-for-owner-approval`になり、対象IDの明示承認と`--commit`が揃うまで公開しない

## 批判的レビュー

> **技術的に楽しいだけでは？** Must 1と2は新規機能ではなく、収益・検索運用の観測を回復する作業。Must 3も新規記事ではなく公開済み品質の是正に限定した。

> **先週と同じ失敗を繰り返していないか？** W38のMust 0/3を受け、データ品質25件を再び縮小して積まずowner移管した。各Mustは成果物ではなくread-backとgateで完了判定する。

> **今週でなければ意味がないことは？** affiliateは09-21の自動retryと09-27のT14dが固定期限。GSC coverageは09-20にfresh化したため、再び件数だけ追う前にfirst waveを分類し、観測可能な状態へ進める。

## 関連ドキュメント・施策

- 前週レビュー: `.claude/skills/management/weekly-review/reference/reviews/2026-W38.md`
- 週次snapshot: `.claude/skills/management/nsm-experiment/reference/weekly-snapshots/2026-W38.json`
- 月次計画: `.claude/todo/monthly.md`
- 関連改善施策: `AFF-MEASURE-RECOVER-01` / `AFF-IMPRESSION-ROUTING-01` / `COVERAGE-LOOP-01` / `SEARCH-GROWTH-CYCLE-01`
- search-growth state: `.claude/state/search-growth/candidates.json`
- KDP state: `.claude/state/products/kdp-weekly-publication.json`（W38レビュー時read-back）

## 次週への申し送り候補

- affiliateの09-27確定7日をT14dとして判定し、期間・cohort・placementが一致しなければ保留する
- GSC coverageの総件数差は次回exportとの比較までeffect判定しない
- Must 3束のうち未達があれば、W40へ同じ大きさで移さずowner・依存・停止条件を見直す
- KDPは全12冊live後にだけ4週計測開始日を置く
