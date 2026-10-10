---
title: 今週の計画
type: weekly-plan
week: 2026-W42
date: 2026-10-10
updated: 2026-10-10
status: active
tags: []
---

# 2026-W42 今週の計画

期間: 2026-10-12（月）〜 2026-10-18（日）。10 月計画（W41〜W44）の Week 2/4。
2026-10-10 から週次の運用を「金曜に前週を計測 → 土曜に週次レビューと来週の計画」に変えた (`.claude/config/review-wiring.json`)。
この計画は新しい運用で最初に土曜に書いた計画で、入力は W40 の計測とレビュー (10-05) と、W41 の計画の進み具合である。
W41 の計測は 10-16（金）05:00 に取り、W41 のレビューと W43 の計画は 10-17（土）に書く。

## 週

- **ISO Week**: 2026-W42
- **期間**: 2026-10-12 〜 2026-10-18
- **Sprint**: 2026-10 月次計画（W41〜W44）の Week 2/4

## 前週の申し送り

W41 のレビューは新しい運用で 10-17（土）が期限なので、まだ無い。W41 計画の「次週への申し送り候補」を入力にした。

| W41 の申し送り候補 | 振り分け | W42 での扱い |
|---|---|---|
| データ品質の「更新」と決めた指標の R2 反映を 1 回の承認にまとめる | `DATA-QUALITY-LOOP-01` | **Must 1** の完了条件に含める (第 2・3 週分をまとめて 1 回の承認) |
| `EFFECT-TARGET-MARKERS-01` のオーナー判断を反映する | `EFFECT-TARGET-MARKERS-01` | **Must 2** |
| 再認証後の `measurement-freshness` を確かめる | `AUTH-CREDENTIAL-REGISTER-01` | オーナー作業 (再認証)。値は 10-16 の計測で読む |
| `KDP-LEDGER-AUTO-01` を Should に入れる | `KDP-LEDGER-AUTO-01` | 見送り (完了条件が KDP の再認証後の CI 取得に依存する。再認証が済んだ週に入れる) |
| `BUSINESS-PLAN-FRESHNESS-MTIME-01` はテストを足せば閉じられる | `BUSINESS-PLAN-FRESHNESS-MTIME-01` | **Could 3** |
| `SEO-CTR-CANDIDATES-01` ① と `CONTENT-FOOD-TRIVIA-01` ① | `SEO-CTR-CANDIDATES-01` / `CONTENT-FOOD-TRIVIA-01` | **Could 1・2** (サイト領域は攻める。Must の総量は増やさない) |
| W41 の週次レビューで `site-pageviews` を 1 行記録する | 定常 | 10-17（土）の W41 レビューで記録する |

## 今月の重点（月次計画より）

- **重点テーマ**: 週次収益 (NSM) を内訳つきで数字で言える状態にする / 公開している指標の誤り・古さを週 5 指標ずつ処置し、処置の流れを 4 週続ける（→ `monthly.md`）
- **重点領域**: 管理 / データ
- **今週この重点で進めること**:
  - データ: データ品質キューの第 3 週 5 指標と、第 2・3 週の「更新」をまとめた R2 反映の準備 (Must 1)
  - 管理: BLOG-WAVE 7 件の終端 (Must 2、月次計画の W42 Must)。Workers CPU の 10-15 請求書の記録と期日の再設定 (Should 1)

## 前週の振り返り（W41）

計画の checkbox ではすべて完了になっている。結果の検証 (完了条件を満たしたか) は 10-17（土）の W41 レビューで行う。

| タスク | 分類 | 状態 (checkbox) | メモ |
|---|---|---|---|
| データ品質キューの第 2 週 5 指標 | Must | 完了 | 2 指標の years 拡張と CI dryRun 合格、2 件誤検出、1 件を `DATA-FOOD-SELF-SUFFICIENCY-MAFF-01` へ切り出し。R2 反映はオーナー承認待ち |
| A8 成果ゲートの残りの blocked 理由 | Must | 完了 | 10 月の案件別明細を一度も取得していないことが原因と確定。カードは次回の収集後に閉じる |
| 無人 triage の失敗の原因 | Should | 完了 | #1068 |
| `measurement-freshness` を動かす施策の起票 | Should | 完了 | improvements の `MEASUREMENT-AUTH-RESTORE-01` |
| BLOG-WAVE 7 件の判断材料 | Should | 完了 | 推奨 (a) をカードに記録。判断は W42 Must |
| `AFF-RESOLUTION-EFFECT-01` の 4 週判定 | Should | 完了 | Due を 10-25 に再設定 |
| 承認済み search-growth 1 件の終端 | Could | 完了 | |
| effort 提案 4 件の採否 | Could | 完了 | `MODEL-OPT-APPLY-01` は backlog から削除済み |

**パターン分析**: W40・W41 と 2 週続けて Must を 🔴 の上から取り、Must の総量を 2 件に抑えた週は達成できている。
W41 は Should・Could も全件に印が付いたが、計画外の作業も多かった (10-05〜10-10 の commit 695 件)。今週も Must 2 件を先に終える。

## 現状サマリー

W41 の計測は 10-16（金）に取るので、数値は W40 の計測 (10-05) のままである。

| 指標 | 現在値 | 比較・目標 |
|---|---:|---|
| GSC clicks（確定7日 09-25〜10-01） | 3,074 | 前週 2,610、+17.8% |
| ★ 検索クリック (GSC rolling28d) | 10,018 | 4 週前 (W36) 6,053、W52 目標 20,000 |
| 週次収益（NSM） | 判定不能 | ASP 4 源とココナラは ¥0、KDP・note が判定不能 |
| ★ 計測の鮮度 | 7/14 (degraded) | 月末 12/14 以上（月次ゴール） |
| ★ データ品質ゲート通過率 | 100.0%（2,423/2,423） | 維持 |
| データ品質キュー (10-03 生成) | 更新 1,079 / 調査終了候補 126 / noindex 候補 173 | 4 週続けて「処置 ≥ 新規検出」 |
| 公開記事数 | 618 | R2 `app/blog/all.json` (10-10 取得) |
| SNS 投稿済み | X 210 / Instagram 206 / YouTube 158 / Threads 32 | 予約中 X 71・Threads 23 |
| GSC運用サイクル | WARN（FAIL 0、review-input 段） | 既知の target 欠落 7 件のみ (Must 2 で終端) |
| KDP公開ゲート | measure | 販売数/KENP 未計測。新規公開なし |

## トレンド機会

| トレンド | ソース | stats47 データ | アクション |
|---|---|---|---|
| 都道府県魅力度ランキング 2026（地域ブランド調査。北海道 18 年連続 1 位・最下位は佐賀県） | Google News（10-03〜10-08） | 民間調査で、stats47 の公的統計には無い | なし |
| はてなブックマーク Hot Entry | はてな（10-10 取得） | 都道府県・統計の話題なし | なし |

## 前週からの持ち越し

W41 の計画に未チェックの項目は無い。W41 の「前週からの持ち越し」で見送りにした 4 件 (ブログ是正・GSC coverage 分類・CTR 分解・KDP の販売数記録) は、引き続き見送り (月次計画の「今月やらないこと」と KDP の再認証待ち)。

## 改善ログ pending（今週の期日）

Tier は improvements.md に列が無いので「—」とした。

期日の来た claude 担当の施策は、10-16（金）12:00 の無人 triage が先に処理する。結果は同日 18:00 の週次メトリクス Issue に出る。

| Tier | Metric | ID | Status | Due | Owner |
|---|---|---|---|---|---|
| — | performance | PERF-WORKER-P99-01 | pending | 2026-10-12 | uruhayato373（オーナー作業） |
| — | cloudflare-cost | R2-STORAGE-01 | pending | 2026-10-12 | uruhayato373（オーナー作業） |
| — | security | DEPS-RENOVATE-01 | pending | 2026-10-12 | uruhayato373（オーナー作業） |
| — | content | NOTE-KAKEI-REDESIGN-EFFECT-01 | pending | 2026-10-13 | claude（無人 triage） |
| — | ga4/note | NOTE-CIRCULATION-PILOT-01 | effect/pending | 2026-10-18 | claude（無人 triage） |
| — | ga4/gsc/theme-quality | THEME-EXPANSION-EFFECT-01 | effect/pending | 2026-10-09 (超過) | theme-portfolio-manager（無人 triage） |

## 今週のタスク

### Must（絶対達成、2件）

- [ ] **データ品質キューの第 3 週 5 指標を処置する** [M] — `DATA-QUALITY-LOOP-01`（🔴 3 番目・データ領域・KPI `data-quality-pass-rate`）。
  10-11（日）04:30 の `ranking-integrity-audit-weekly` が作り直す `data/data-quality/checks/LATEST.md` の「2 更新」から、W40・W41 に処置した
  10 指標を除いた GSC 表示の多い順に 5 指標を取る (10-03 版の順なら `designated-difficult-disease` から)。各指標で公式の最新公表を
  一次資料で確かめてから基準 1〜4 のどれかに決める。5 指標すべての処置と根拠がカードに記録され、更新するものは config 変更と
  data-refresh の dryRun まで済み、第 2・3 週の「更新」の R2 反映を 1 回の承認依頼にまとめていれば完了。使用: `/inspect-estat-meta`、data-ingester
- [ ] **BLOG-WAVE 7 件を終了するか、事前 target つきで測り直すかを確定する** [S] — `EFFECT-TARGET-MARKERS-01`（🔴 6 番目・管理領域・月次計画の W42 Must）。
  W41 にカードへ書いた (a) 終了 / (b) 事前 target つき再計測 をオーナーに選んでもらい、improvement-triage が 7 行を
  理由付きで終了するか、根拠のある `[target:]` を付けて新しい窓で測り直す。10-16（金）の計測サイクルで
  「GSC 施策 N 件中、機械判定できるのは M 件」の残りがすべて終了か目印付きになっていれば完了。
  10-14（水）までにオーナーの判断が無ければ、判断待ちの理由をカードに書く (この場合は未達)。

### Should（できればやる、3件）

- [ ] **Workers CPU の 10-15 請求書を記録し、`CF-CPU-SURGE-01` の期日を決め直す** [S] — `CF-CPU-SURGE-01`（🔴・管理領域・KPI `operating-cost`）。
  10-15 の請求書の CPU 行を invoice モードで記録し、日次 snapshot の cpu_p50 / p99 と並べる。主因を route か仕組みで特定できなければ、
  何を測れば特定できるかと新しい期日をカードに書く (月次計画は W43〜W44 に配分)。
- [ ] **Next.js の high 脆弱性が OpenNext の配信に当たるかを確かめる** [S] — `DEPS-NEXT16-UPGRADE-01` ①（🔴・不具合）。
  advisory 2 件の影響条件と、OpenNext の Next 16 対応状況を公式で確かめ、カードに日付つきで書く。当たらないと確定できれば例外の理由と
  再評価日を書いて 🟡 へ下げる。上げる作業 (② 以降) は今週はしない。
- [ ] **A8 の 10 月の案件別明細を取り込み、成果ゲートを再検証する** [S] — `A8-CROSSCHECK-EXCEED-01`（🔴 2 番目・管理領域・不具合）。
  a8-report-collector で 10 月の program-detail を収集・正規化し、`node .claude/scripts/ads/check-a8-outcome-gate.mjs` を再実行する。
  exceeded と shortfall が出なければカードを閉じる。ログインや CAPTCHA で止まったら、止まった段をカードに書いて完了。

### Could（余力があれば、3件）

- [ ] **公衆電話・出生率の検索の食い合いを確かめる** [S] — `SEO-CTR-CANDIDATES-01` ①（サイト領域・攻める）。
- [ ] **食品の雑学記事の品目の突き合わせ表を作る** [S] — `CONTENT-FOOD-TRIVIA-01` ①（サイト領域・攻める）。
- [ ] **事業計画 state の鮮度判定のテストを足して閉じる** [S] — `BUSINESS-PLAN-FRESHNESS-MTIME-01`（管理領域・不具合。実装は 10-07 に済み）。

### 定常 (新しい運用の初回)

- 10-16（金）05:00 の `fetch-metrics-weekly` が W41 を取り、`data/measurement-cycle/latest.json` の week が 2026-W41 になること、
  12:00 の無人 triage と 18:00 の週次メトリクス Issue が続くことを確かめる (ルーティン `trig_01JdY7czatEAB1Awm9xE174D` が同日 14:00 に
  `STATE-OVERLAY-MAIN-01` の削除行を確かめる)。
- 10-17（土）に `/weekly-review 2026-W41` と `/weekly-plan 2026-W43` を書く。期限は土曜で、日曜の朝に未作成なら review-cadence-guard が Issue にする。

## オーナー作業

- **`EFFECT-TARGET-MARKERS-01`**: BLOG-WAVE 7 件を (a) 終了するか (b) 事前 target つきで測り直すかを選んでほしい (推奨は (a)、10-14 まで)。
- **`AUTH-CREDENTIAL-REGISTER-01`**: KDP・ココナラ・もしもの再認証 (どれも `auth_required` で停止中)。
- **`MEASUREMENT-AUTH-RESTORE-01`**: 再認証後に `npm run measurement:status -- --check` が通るか確認してほしい（Due 10-19）。
- **`PERF-WORKER-P99-01`**: Workers Observability で route 別 CPU の内訳を確認してほしい（Due 10-12）。
- **`R2-STORAGE-01`**: doboku-note-archive 8.98 GB の保持方針（許容か削減か）を決めてほしい（Due 10-12）。
- **`DEPS-RENOVATE-01`**: 依存更新の方針の確認（Due 10-12）。
- **`DATA-QUALITY-LOOP-01`**: 第 2・3 週の「更新」をまとめた R2 反映を承認してほしい (Must 1 で 1 回の依頼にまとめる)。
- **`EXP-006`**: YouTube Studio のチャンネル所有確認。済むまで制作と計測日を進めない。
- **`ADSENSE-RESTART-01`**: 旧アカウントが停止状態かを確かめ、uruhayato373 で新規申請し、発行された `pub-…` を伝えてほしい。
- **`NOTE-FREE-DEFAULT-01`**: 雑学・ランキングの有料記事を閲覧の多い順に数本だけ無料に戻す (note へのログインが必要)。
- **`AMAZON-ASSOCIATE-PILOT-01`**: `stats47-22` が有効かを Amazon アソシエイトの管理画面で確かめ、PR #1099 を本番に出すか決めてほしい。

## KDP公開ゲート

- **判定**: `measure`（`data/products/kdp-weekly-publication.json`、2026-W42 で再生成）
- **候補**: なし
- **需要証拠**: 販売数/KENP は K-S1-01〜12 すべて未計測。0 需要ではない
- **停止条件**: KDP の再認証と販売数/KENP の記録が済むまで新規公開しない
- **承認境界**: この計画への記載は公開承認ではない。対象 ID の明示承認と `--commit` が別途必要

## NSM実験

- active は `EXP-006` 1 件（running・オーナー作業 2 件待ち）。measure しない。
- `/nsm-experiment propose` は実行していない。10 月の月次計画が新規実験を重点外としているため、候補を出しても採用しない。

## 批判的レビュー

> **技術的に楽しいだけでは？** Must 2 件は公開値の処置と効果判定の終端で、新しい機能は作らない。Next.js の脆弱性は不具合だが、
> 上げる作業は回帰の危険が大きいので、今週は該当性の確認までに留めて Should に置いた。

> **先週と同じ失敗を繰り返していないか？** W41 は Must・Should・Could の全件に印が付いたが、結果の検証は 10-17 の W41 レビューまで無い。
> 今週の Must 2 は、オーナーの判断が無いと完了しない。期日 (10-14) と、判断が無い場合に未達と書くことを完了条件に入れた。

> **今週でなければ意味がないことは？** `CF-CPU-SURGE-01` の 10-15 請求書の記録と期日 10-16 の決め直し。新しい運用の初回 (10-16 の計測と
> 10-17 のレビュー) を確かめること。オーナー作業の期日 10-12 の 3 件 (`PERF-WORKER-P99-01`・`R2-STORAGE-01`・`DEPS-RENOVATE-01`)。

## 関連ドキュメント・施策

- 前週の計画とレビュー: W41 計画 (この計画で上書き。git 履歴に残る) / `data/reviews/weekly/2026-W40.md`
- 週次snapshot: `data/nsm/weekly-snapshots/2026-W40.json`
- 月次計画: `.claude/todo/monthly.md`（2026-10）
- 運用の正本: `.claude/config/review-wiring.json` (週次レビューは土曜期限)
- backlog: `DATA-QUALITY-LOOP-01` / `EFFECT-TARGET-MARKERS-01` / `CF-CPU-SURGE-01` / `DEPS-NEXT16-UPGRADE-01` / `A8-CROSSCHECK-EXCEED-01` / `SEO-CTR-CANDIDATES-01` / `CONTENT-FOOD-TRIVIA-01` / `BUSINESS-PLAN-FRESHNESS-MTIME-01`
- 改善施策: `PERF-WORKER-P99-01` / `R2-STORAGE-01` / `DEPS-RENOVATE-01` / `MEASUREMENT-AUTH-RESTORE-01` / `NOTE-KAKEI-REDESIGN-EFFECT-01` / `NOTE-CIRCULATION-PILOT-01` / `THEME-EXPANSION-EFFECT-01`
- データ品質キュー: `data/data-quality/checks/LATEST.md`
- KDP state: `data/products/kdp-weekly-publication.json`

## 次週への申し送り候補

- 第 2・3 週の「更新」の R2 反映が承認されたら、反映後の配信年を確かめる
- `KDP-LEDGER-AUTO-01` は KDP の再認証が済んだ週の Should に入れる
- W41 の計測 (10-16) で `measurement-freshness` と週次収益の内訳を読み、W43 の Must を決める
