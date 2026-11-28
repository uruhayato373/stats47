---
title: 今週の計画
type: weekly-plan
week: 2026-W49
date: 2026-11-28
updated: 2026-11-28
status: active
tags: []
---

# 2026-W49 今週の計画

期間: 2026-11-30（月）〜 2026-12-06（日）。木曜が 12 月なので 12 月の第 1 週に数える。
入力は W47 のレビュー (`data/reviews/weekly/2026-W47.md`、11-28) と、11-28 時点の W48 の計画の状態、`monthly.md` (11 月の重点)。
12 月の月次計画はまだ書かれていない (11 月の月次レビューと 12 月の月次計画は 12-03 まで)。それまでは 11 月の重点 (家計調査・製造品出荷額の商品) を引き継ぎ、月次計画が書かれたら Should 以下を組み替える。
無人の定例実行で書いた。人の承認が要る選択 (本番反映・R2 の正本の上書き・KDP の公開・search-growth の採否) は「承認待ち」とし、Must の完了条件に入れていない。
W48 のレビューは 12-05（土）に書き、続けて W50 の計画を書く。

## 週

- **ISO Week**: 2026-W49
- **期間**: 2026-11-30 〜 2026-12-06
- **Sprint**: 2026-12 の Week 1

## 前週の申し送り

W47 のレビューの「来週への申し送り」43 件を照合した。

| 申し送り | 振り分け | W49 での扱い |
|---|---|---|
| note・KDP の自動ログイン失敗の印 | `AUTH-CREDENTIAL-REGISTER-01` | オーナー作業 |
| KDP の再ログイン | `PRODUCT-REFERRAL-MEASURE-01` | オーナー作業 |
| 計測の鮮度 8/11 の取得元ごとの確認 | `MEASUREMENT-MAC-DIRECT-01` | 定常 (土曜の取得のたびに読む。Must には再掲しない) |
| GSC 画面の session_missing と URL Inspection の古さ | `GSC-SOURCE-FRESHNESS-01` | **Must 2** |
| URL Inspection の結果コミットの rebase の衝突 | `CI-TOOLING-FOLLOWUP-03` | Must 2 の ① に併せる |
| `effect-target-ratchet` の想定効果値の欠け | 見送り | 受け皿のカードが無い (起票待ち)。12-05 のレビュー入力の検査で再び FAIL になれば、improvement-triage に想定効果値を登録してもらう |
| `affiliate-ga4-weekly` 8 回連続の失敗・#1207 | `AFF-GA4-WEEKLY-GATE-01` / `AFFILIATE-MEASUREMENT-GATE-A8-01` | Should 3 |
| `quality-suite-weekly` 4 回連続の失敗 | `QUALITY-SUITE-WEEKLY-RED-01` | Could 1 (期日 11-30) |
| ASP の巡回が 5 週失敗 | `AFF-SCOUT-OFFER-PROFILE-01` | 見送り (ログイン待ち。アフィリエイトは維持の領域) |
| ranking-integrity の取得失敗と recipe.drift | `RANKING-INTEGRITY-VIOLATIONS-1124-01` | 見送り (承認待ち。データ領域で重点外) |
| データ品質キューの更新 993 件 | `DATA-QUALITY-LOOP-01` | 見送り (重点外。期日 11-30 は todo-curator が引き直す) |
| survey-taxonomy の blog unresolved 1 件 | 見送り | 受け皿のカードが無い (起票待ち) |
| note の回遊の errors 23 件 | `NOTE-CIRCULATION-LINK-FIX-01` / #1149 | 見送り (note のログイン待ち) |
| 有料 note のカードの欠け 10 本 | #1064 / `KAKEI-PRODUCTION-REMAINS-01` | Must 3 の ③ (承認依頼まで) |
| chart-axes の検査落ち | `CHART-TYPE-ROLLOUT-01` | 見送り (全型一律の是正は今週しない) |
| docs-governance の warn 2 件 | `DOCS-GOVERNANCE-GAPS-01` | 見送り (重点外) |
| GA4 の設定監査が読めない | 見送り | 受け皿のカードが無い (起票待ち) |
| PSI の `PSI_API_KEY` 未設定 | `STATE-R2-MIGRATION-01` | 見送り (キーの設定はオーナー作業) |
| backlog 253 枚・期日超過 25 枚・完了カードの削除 | `SIMPLIFY-REVIEW-LOOP-EXECUTION-01` | **Must 1** |
| 県別の市区町村ランキングの 4 週記録 | `MUNI-PREF-RANKING-OBS-01` | Should 1 |
| Workers CPU の施策の判定と月換算の切り分け | `CF-CPU-URL-01` / `CF-CPU-FOLLOWUP-01` | Should 2 |
| AdSense の配置の判定 (12-05) | `ADSENSE-PLACEMENT-01` | 定常 (12-05 のレビューで判定) |
| 自動広告のオーバーレイの A/B | `ADSENSE-OVERLAY-AB-01` | 見送り (配置の判定 12-05 の後。期日を引き直す) |
| サイト内回遊率の低下 | `RELATED-ARTICLES-EFFECT-01` | 定常 (期日 12-08 の判定で読む) |
| 家計調査の反映の観測 | `KAKEI-REFLECT-EFFECT-01` | 定常 (期日 12-20) |
| 家計調査の制作の残り | `KAKEI-PRODUCTION-REMAINS-01` | **Must 3** |
| 検索クリック -35.1% の仮説の検証 | 定常 | 12-05 のレビューで 6 週の推移を読む |
| search-growth 候補の dismiss | 定常 | オーナー作業 |
| `site-pageviews`・`work-context-sessions` に施策 0 件 | 定常 | 11 月の月次レビュー (12-03 まで) で判断 |
| KDP の次の本 | `KDP-EXPANSION-01` | 見送り (KDP の計測が blocked で、出した本の 8 週の実売を読めない間は新しい本を増やさない) |
| 製造品出荷額の商品の判定 12-16 | EXP-007 | 定常 (観測を続ける) |
| KDP セレクトの判定 12-05 | EXP-011 | 定常 (KDP の再ログインが無ければ判定不能と書く) |
| YouTube pilot の人の作業 | EXP-006 | オーナー作業 |
| 事業イシューマップの判定日 | 定常 | 11 月の月次レビューで台帳の判定日を確かめる |
| ページ UI の読み残し 63 画面 | `PAGE-UI-REVIEW-COVERAGE-01` | 見送り (重点外) |
| 自動アラート #1295・#1287 | #1295 / #1287 | 定常 (振り分けのコメントは付いている。#1287 は Should 2 の結果で更新する) |
| Cloudflare の API トークンの権限と GSC のオーナー作業 | `GSC-USER-ACTIONS-01` | オーナー作業 (期日 12-05) |
| 完了済みなのに計画が参照していた 5 件 | 定常 | この計画に残していない |
| 11 月の月次レビュー・12 月の月次計画 | 定常 | 12-03 まで |
| X の投稿と指標が無い | 見送り | 見送り (SNS は後回し) |

## 今月の重点（月次計画より）

- **重点テーマ**: 12 月の月次計画は未作成。12-03 までは 11 月の重点 (家計調査の年次更新と回遊 (サイト) / 製造品出荷額のデータ商品を note で売る (商品)) を引き継ぐ (→ `monthly.md`)
- **今週この重点で進めること**: 家計調査は 11-22 に 2025 年値の反映と記事 3 本の公開が本番に出て、観測は `KAKEI-REFLECT-EFFECT-01` (期日 12-20) に移った。今週は制作の残り (貯蓄・負債のテーマが 2019 年だけ・都市比較) を `KAKEI-PRODUCTION-REMAINS-01` で進める。商品は EXP-007 が running で、判定日 12-16 まで観測を続ける (note の売上の計測が戻らないと判定不能)。

## 前週の振り返り (W48)

W48 は 11-29 まで続く。11-28 時点の checkbox とカードの記録から拾った (正式な判定は 12-05 の W48 のレビュー)。

| タスク | 分類 | 状態 | メモ |
|---|---|---|---|
| backlog の期日超過 23 枚の処置と総枚数の削減 `SIMPLIFY-REVIEW-LOOP-EXECUTION-01` | Must | 完了 | 11-24 に期日超過 22 枚の処置を記録 (消す 4・今週やる 2・引き直し 16)。総枚数は 377 → 253 (`backlog:waits -- flow`、11-28)。W48 の閉じた数は 81 |
| 家計調査の要修正 2 件と一括反映の範囲 (W48 Must 2) | Must | 完了 | checkbox。家計調査の反映は 11-22 の #1296 で本番に出て、観測は `KAKEI-REFLECT-EFFECT-01` へ |
| テーマページのチャートの説明を出典の Sheet へ寄せる (W48 Must 3) | Must | 完了 | 11-22 に 24 章を寄せ終えてカードを閉じた。残りの地図の章は `UI-FOLLOWUP-02` |
| 県別の市区町村ランキングの 4 週記録 `MUNI-PREF-RANKING-OBS-01` | Should | 未達 | 期日 11-26 を過ぎた。記録なし |
| `affiliate-ga4-weekly` の失敗の原因 `AFF-GA4-WEEKLY-GATE-01` | Should | 一部 | 11-24 に原因 (A8 の取得が site-summary だけ) を直した。11-28 の取得の後の run の成否は未確認 |
| AdSense のユニット数のデプロイ日 `ADSENSE-FORMAT-BY-PAGE-01` | Should | 完了 | 11-12〜11-13 のデプロイ。ベースライン窓の後で矛盾なし |
| 無人のレビューを計測の完了まで待たせる `CI-TOOLING-FOLLOWUP-03` | Could | 完了 | 11-23 に SKILL に待つ手順が入った。11-28 は CI の run の後に収集した |
| 日次収益の明細が空の原因 `NSM-REVENUE-INPUTS-01` | Could | 完了 | 11-24 に原因 (認証待ち・明細の実装前) をカードに記録 |

**パターン分析**: Must は W45 2/3、W46 2/3、W47 3/3、W48 3/3 (checkbox)。4 週続けて 2/3 以上で、`SIMPLIFY-REVIEW-LOOP-EXECUTION-01` の完了条件の 1 つ (4 週連続で Must ≥ 2/3) を満たす見込み (W48 の正式な判定は 12-05)。Should の観測の記録 (`MUNI-PREF-RANKING-OBS-01`) は W48 も手が付かず、改善施策の期日超過が残った。backlog は W48 の Must で 124 枚減ったが、目安 200 をまだ 53 枚超えている。

## 現状サマリー

数値は W47 の計測 (`data/measurement-cycle/LATEST.md`、11-28 作り直し) による。

| 指標 | 現在値 | 比較・目標 |
|---|---:|---|
| GSC clicks (確定 7 日 11-13〜11-19) | 3,401 | 前 7 日比 -35.1% (原因は未確定。12-05 に検証) |
| ★ 検索クリック (GSC rolling28d) | 19,196 | 4 週前 (W43) 14,733、W52 目標 20,000 |
| ★ ページビュー (GA4 Japan 確定 7 日 × 4 週) | 60,437 | W43 48,338、W52 目標 79,000 |
| ★ サイト内回遊率 (ブログ→ランキング) | 7.8% | W43 9.7% (下がった) |
| ★ 業務文脈の着地セッション | 5,229 | W43 4,555 |
| 週次収益 (NSM) | 判定不能 (判定できた分は AdSense ¥784・A8 0 件・楽天 0 件 ¥0) | 商品 (KDP・note) が欠ける |
| 計測の鮮度 | 8/11 (degraded) | 前週 10/11 から悪化。note・gsc・kdp |
| データ品質ゲート通過率 | 100.0% (2,623/2,624) | 監査 11-28 |
| インデックス登録率 | 84.6% (登録済み 7,967・未登録 1,448) | W47 から値が入った |
| 公開記事数 | not-measured (家計調査の記事 3 本を 11-22 に公開) | — |
| SNS 投稿 | X・Threads は記録なし | SNS は後回し |
| GSC運用サイクル | review-input PASS 8 / FAIL 2 (`effect-target-ratchet`・`url-inspection-freshness`) | FAIL 0 |
| KDP公開ゲート | prepare | 下の節 |
| backlog | 253 枚 / 目安 200 | 期日超過 25 枚・W49 期日 28 枚 |

## トレンド機会

今回は Track E (はてな・Google News・Yahoo の RSS) を取得していない (無人の定例実行で外部取得を行わない)。今週の Must は backlog の削減・計測のガードレール・家計調査の残りで埋まっており、時事の記事化は計画しない。

## 前週からの持ち越し

- [ ] **県別の市区町村ランキングの 4 週記録** — 元: W48 Should 1 (`MUNI-PREF-RANKING-OBS-01`) → 今週 Should 1
- [ ] **`affiliate-ga4-weekly` の run の成否の確認** — 元: W48 Should 2 (`AFF-GA4-WEEKLY-GATE-01`) → 今週 Should 3

## 改善ログ pending (今週着手対象)

| Tier | Metric | ID | Status | Due | Owner |
|---|---|---|---|---|---|
| 1 | gsc | MUNI-PREF-RANKING-OBS-01 | effect/pending | 2026-11-26 | claude |
| 1 | cloudflare | CF-CPU-URL-01 | pending | 2026-11-27 | claude |
| 1 | adsense | ADSENSE-PLACEMENT-01 | pending | 2026-12-05 | claude |
| 2 | ga4 | RELATED-ARTICLES-EFFECT-01 | effect/pending | 2026-12-08 | claude |

- `MUNI-PREF-RANKING-OBS-01`: 期日 11-26 を過ぎた。470 URL の登録数と表示の 4 週記録を改善ログの手順で取り、improvement-triage が記録する (Should 1)。
- `CF-CPU-URL-01`: 期日 11-27 を過ぎた。`[target: -3,800,000 ms/日]` があるので閾値エンジンの判定に任せ、Workers CPU の月換算 $26.49 の切り分けを performance-auditor に頼む (Should 2)。
- `ADSENSE-PLACEMENT-01`: 判定は 12-05 (W48 のレビュー)。ベースライン 4/4 週はそろっている。配置は変えない (定常)。
- `RELATED-ARTICLES-EFFECT-01`: 期日 12-08。回遊率が 4 週前の 9.7% から 7.8% に下がっているので、判定のときに施策の対象 (ranking→blog) と回遊率の代表値 (blog→ranking) の向きの違いを分けて書く。

## 今週のタスク

### Must（絶対達成、3件）

- [ ] **backlog の期日超過 25 枚に処置を決め、完了カードを台帳に記録して消し、総枚数を 230 枚以下にする** [M] — `SIMPLIFY-REVIEW-LOOP-EXECUTION-01`（計画領域。運用の健全性で、動かす KPI は無い）。
  backlog は 253 枚で目安 200 を 53 枚超え、W47 は起票 26・閉じた 1 だった。W47 のレビューは完了カードの削除 (Phase 0b の 6) を行っていない。Phase 0b の決まりでは目安超過の週は削減を Must に入れる。
  ① `npm run backlog:waits -- due --week 2026-W49` の期日超過 25 枚を 1 枚ずつ、今週やる・期日を引き直す・消すに決める。年間計画のカードで契機が来ていないものは todo-curator に期日の引き直しを渡す
  ② 本文に完了の証拠があり残作業の無いカードを、`record-backlog-outcome.mjs` で実行台帳に記録してから消す (統合・前提の消えたカードは class `stale`)
  ③ このカード自身の判定: Must の達成率 (W45〜W48 で 4 週連続 2/3 以上かを 12-05 のレビューの結果で確かめる) と `[target:]` なし 10 件の扱いを書き、閉じるか残すかを決める。
  完了条件: 期日超過 25 枚すべてに処置がカードか ledger に記録され、`npm run backlog:waits -- flow` の総枚数が 230 枚以下 (253 から 23 枚以上の純減) になっている。
- [ ] **URL Inspection の結果コミットの衝突を直し、GSC の入力の鮮度を戻す** [S] — `GSC-SOURCE-FRESHNESS-01`（サイト領域・ガードレール KPI の計測の鮮度とインデックス登録率）。
  ガードレールの計測の鮮度が 10/11 から 8/11 に下がった。note・KDP・GSC 画面のログインはオーナー作業だが、URL Inspection の古さ (11-21) は CI の結果コミットが rebase の衝突で失敗したためで、オーナーなしで直せる。
  ① fetch-metrics-weekly の run 46085381744 のログで、衝突の相手 (同じ時刻に develop へ push した commit) と、結果コミットの段に再試行があるかを確かめる。原因と直し方を `CI-TOOLING-FOLLOWUP-03` に追記する
  ② 直す変更を develop に入れ、url-inspection の段を手で再実行して `data/gsc/url-inspection/` に 11-28 以降の結果が入ることを確かめる (workflow の main への反映が要るなら、承認依頼を書いて止める)
  ③ カードの次 4 (KPI の値が `LATEST.md` に同じ桁で出るか) は W47 で 84.6% として出たので済みと記録する。
  完了条件: `node .claude/scripts/gsc/audit-operations-cycle.mjs --stage review-input --week 2026-W48` の `url-inspection-freshness` が PASS か、PASS にできない理由 (main への反映待ちなど) がカードに書かれている。GSC 画面の session_missing はオーナーの入り直しを待つ。
- [ ] **家計調査の貯蓄・負債のテーマを新しい調査の値で作り直し、都市比較の図を localhost で確かめる** [M] — `KAKEI-PRODUCTION-REMAINS-01`（サイト領域・KPI `search-clicks`・`site-circulation-rate`）。
  11 月の重点 1 の制作の残り。貯蓄・負債のテーマが 2019 年の全国家計構造調査だけで、家計調査の貯蓄・負債編の新しい年の値と都市比較が無い。
  ① カードの ①③: 貯蓄・負債のテーマに家計調査 (貯蓄・負債編) の最新年の値を、二人以上世帯・県庁所在市等の対象を明記して足す。年次値と 3 年平均、県庁所在市と県全体を混同しない (カードの停止条件)
  ② localhost (`npm run dev:web`) の 375px と 1280px で、対象世帯・地域・期間・単位・出典と次の導線があるかを確かめる
  ③ カードの ④: `b-kakei-expense-*` 10 本に有料 note のカードとマガジンへのリンクを足す案を 1 枚の承認依頼にまとめる (#1064。note の編集はオーナー承認)。
  完了条件: ①②が localhost で確かめられ、関連の vitest と `validate:catalog` が通り、③の承認依頼がカードに書かれている。R2 の正本の上書きと本番反映はオーナーの承認なしに行わない。

### Should（できればやる、3件）

- [ ] **県別の市区町村ランキングの 4 週記録を取る** [S] — `MUNI-PREF-RANKING-OBS-01`（サイト領域・KPI `search-clicks`）。期日 11-26 を過ぎた。470 URL の登録数と表示を改善ログの手順で取り、記録は improvement-triage に渡す。判定に要る窓が足りなければ pending のまま理由と次の期日を書く。同じ領域の年間計画 `MUNI-CITY-PAGE-SNIPPET-01`・`MUNI-TITLE-MAGNITUDE-01` (期日 11-27 超過) は、この記録を見てから着手か期日の引き直しかを決める。
- [ ] **Workers CPU の施策を判定し、月換算 $26.49 の内訳を切り分ける** [S] — `CF-CPU-URL-01` / `CF-CPU-FOLLOWUP-01`（サイト領域・KPI `operating-cost`）。期日 11-27 を過ぎた施策を閾値エンジンで判定し、improvement-triage が記録する。月換算が $10 を超えるので、route 上位 3 の CPU 割合と 1 URL あたりの描画回数を performance-auditor に切り分けてもらい、#1287 の振り分けを更新する。ISR の本番確認は `CF-CPU-FOLLOWUP-01` の承認待ちの段なので、承認が無ければ観測だけ。
- [ ] **`affiliate-ga4-weekly` が 11-28 の取得の後に通ったかを確かめる** [S] — `AFF-GA4-WEEKLY-GATE-01` / `AFFILIATE-MEASUREMENT-GATE-A8-01`（アフィリエイト領域・不具合）。`gh run list --workflow affiliate-ga4-weekly.yml --limit 1` が success なら #1207 を閉じる。まだ落ちるなら、`data/affiliate/a8-report-log.json` の `crossCheck` で「当月 0 件」と「当月未取得」を切り分ける (カードの ①)。ゲートの閾値は緩めない。

### Could（余力があれば、2件）

- [ ] **`quality-suite-weekly` を直すか止めるかを決める** [S] — `QUALITY-SUITE-WEEKLY-RED-01`（期日 11-30・不具合）。W47 で毎回落ちるもの (E2E の blog-detail.spec.ts ほか) は分けた。最終成功から 33 日で、期日 12-01 の `SIMPLIFY-FAILING-AUTOMATION-01` の判定と同じ結果を使う。
- [ ] **合計特殊出生率の単位の変更を本番反映の後に確かめる** [S] — `UI-FOLLOWUP-02`（サイト領域・不具合）。Item 5 (単位を「人/女性」へ) は develop に入っている。本番反映の後に 375px と 1280px の画像と `/ranking/*` の表記、display-units 台帳の `unit-changed` 差分を確かめる。本番反映が今週無ければ見送る。

### 定常

- 12-05（土）: `npm run weekly:collect` → `/weekly-review 2026-W48` → `/weekly-plan 2026-W50` を続けて行う。CI の週次計測の commit を待ってから集める。
- 12-05（土）のレビュー: `ADSENSE-PLACEMENT-01` の判定 (ベースライン 4/4 週)・EXP-011 の判定日・GSC の確定 7 日のクリック -35.1% の仮説の検証 (6 週の推移) を行う。KDP の再ログインが無ければ EXP-011 は判定不能と書く。
- 12-05（土）の取得の後: `MEASUREMENT-MAC-DIRECT-01` — 取得元ごとの成否を記録する (再掲しない定常の確認)。
- 12-03（木）まで: 11 月の月次レビュー (`/monthly-review 2026-11`) と 12 月の月次計画 (`/monthly-plan`)。`site-pageviews`・`work-context-sessions` に施策が 0 件の件、事業イシューマップの判定日、EXP-008 (子育て) の開始の再判断をここで扱う。
- W49 が期日のカード 28 枚 (`npm run backlog:waits -- due --week 2026-W49`) は Must 1 の仕分けに含める。観測・時期待ちの年間計画 (`CI-SPEED-STATIC-GATES-HEAVY-STEPS-01`・`UI-CHART-TEXT-LOOP-01`・`DATA-QUALITY-LOOP-01`・`CORRELATION-SNAPSHOT-YEAR-ALIGN-01`・`GSC-MOBILE-PERF-PLAN-01`・`GSC-PARAM-URL-POLICY-01`・`SSDS-DEMAND-BATCH-01`・`BACKLOG-GROWTH-WATCH-01` ほか) は、契機が来ていなければ todo-curator が期日を延ばす。
- ブログの全型一律の是正・新規生成は今週の Must にしない。

## オーナー作業

- **note・KDP・GSC 画面の再ログイン**: `node packages/ops/src/measurement/refresh-session.mjs note --wait-human` と同 `kdp` (2 段階認証)、GSC 画面のセッションの取り直し (`bash scripts/scheduled/measurement-session-refresh.sh`)。商品の週次収益・EXP-011・EXP-013 の注文・KDP の 8 週計測・GSC 画面の除外理由が止まっている (`AUTH-CREDENTIAL-REGISTER-01`・`PRODUCT-REFERRAL-MEASURE-01`)。
- **本番反映の可否**: `npm run release:status` で main との差分 224 件 (本番に効く 93 件、11-28 時点)。develop→main の PR はオーナーの指示があるまで開かない。
- **`GSC-USER-ACTIONS-01`** (期日 12-05): Cloudflare の API トークンにゾーンの analytics の読み取り権限を足す作業と、GSC の記録に要る作業。
- **期日が W49 のログイン待ちのカード**: `STATE-R2-LIFECYCLE-01` (R2 の lifecycle rule)・`AMAZON-ASSOCIATE-PILOT-01`・`CONFIG-SECRET-CLAUDE-JSON-01` (いずれも 12-05)。
- **承認待ちの 52 枚** (W47 のレビューの「オーナーへの確認」)。今週期日の `PACKAGES-DEPS-FOLLOWUP-01` (11-30)・`SEO-CTR-CANDIDATES-01` (12-05) を先に見てほしい。
- **search-growth 候補の dismiss** (`/api/ranking/*/download` の crawled-not-indexed。推奨は dismiss、理由は W47 のレビュー)。
- **EXP-006**: YouTube のチャンネルの所有の確認と、各動画の手動投稿。

## KDP公開ゲート

- **判定**: `prepare`（`data/products/kdp-weekly-publication.json`、2026-W47 で 11-28 に再生成）
- **候補**: なし（blocker: 検証済みの本が 0 冊）
- **需要証拠**: 販売数・KENP は not-measured (KDP の取得は 11-28 に自動ログイン失敗の印で blocked)。S1 は販売中 13 冊・審査中 1、prefecture-guide は審査中 2。0 需要ではない
- **停止条件**: KDP の計測が戻り、出した本の 8 週の実売を読めるまで新しい本を作らない (今週は `KDP-EXPANSION-01` の設計・生成を計画に入れない)
- **承認境界**: この計画への記載は公開承認ではない。対象 ID の明示承認と `--commit` が別途必要

## NSM実験

- running は EXP-006 (YouTube pilot・人の作業)・EXP-007 (製造品出荷額の商品、判定日 12-16)・EXP-011 (KDP セレクト、判定日 12-05)・EXP-013 (K-S1-02 とブログ 10 記事の商品案内の 6 週計測)。
- `/nsm-experiment propose` は実行していない。active が 4 件あり、12 月の打ち手は月次計画で決める。EXP-011・EXP-013 の注文は KDP の再ログインまで判定不能。

## 批判的レビュー

> **技術的に楽しいだけでは？** Must 1 の backlog の削減と Must 2 の URL Inspection の衝突は収益に直結しない。Must 1 は目安超過の週の決まりで、253 枚のままだと期日超過 25 枚と 30 日超で誰も持っていない 39 枚が埋もれる。Must 2 はガードレール (計測の鮮度) が悪化した週の決まりで、GSC の入力が古いと 12-05 のレビューの入力検査が再び FAIL になり、検索施策の判定が止まる。収益と PV に近いのは Must 3 (重点 1 の家計調査) だけで、そこは M で置いた。

> **先週と同じ失敗を繰り返していないか？** 計測の Must は W45・W46 と未達で W47 から定常にした。今週の Must 2 はログインの回復ではなく、オーナーなしで直せる CI の衝突だけに絞った (ログインはオーナー作業)。Should の観測の記録 (`MUNI-PREF-RANKING-OBS-01`) は W48 で手が付かなかったので S のまま 1 番目に置き、Workers CPU の比較のように 4 週持ち越さないよう、12-05 までに進まなければ改善施策から外すかを improvement-triage に諮る。

> **今週でなければ意味がないことは？** W49 は 12 月の第 1 週で、11 月の月次レビューと 12 月の月次計画が 12-03 まで、`ADSENSE-PLACEMENT-01` と EXP-011 の判定が 12-05 に来る。`CF-CPU-URL-01` と `MUNI-PREF-RANKING-OBS-01` は期日を過ぎている。
> Must 1 の計画領域は重点 (サイト・商品) の外で `npm run docs:check` の DG077 の警告になりうるが、Phase 0b の決まり (目安超過の週は削減を Must に入れる) を優先した。🔴 の節は 11-28 時点で 0 枚なので、DG083 の上位 3 枚の対象は無い。

## 関連ドキュメント・施策

- 前週レビュー: `data/reviews/weekly/2026-W47.md` (W48 のレビューは 12-05)
- 11 月の重点: `.claude/todo/monthly.md` (12 月の月次計画は 12-03 まで)
- 計測サイクル: `data/measurement-cycle/latest.json` (W47、11-28)
- backlog: `SIMPLIFY-REVIEW-LOOP-EXECUTION-01` / `KAKEI-PRODUCTION-REMAINS-01` / `CI-TOOLING-FOLLOWUP-03` / `AFF-GA4-WEEKLY-GATE-01` / `AFFILIATE-MEASUREMENT-GATE-A8-01` / `CF-CPU-FOLLOWUP-01` / `UI-FOLLOWUP-02` / `PRODUCT-REFERRAL-MEASURE-01` / `AUTH-CREDENTIAL-REGISTER-01` / `KDP-EXPANSION-01` / `GSC-USER-ACTIONS-01`
- 年間計画: `GSC-SOURCE-FRESHNESS-01` / `MEASUREMENT-MAC-DIRECT-01` / `QUALITY-SUITE-WEEKLY-RED-01` / `SIMPLIFY-FAILING-AUTOMATION-01` / `MUNI-CITY-PAGE-SNIPPET-01` / `MUNI-TITLE-MAGNITUDE-01`
- 改善施策: `MUNI-PREF-RANKING-OBS-01` / `CF-CPU-URL-01` / `ADSENSE-PLACEMENT-01` / `RELATED-ARTICLES-EFFECT-01` / `KAKEI-REFLECT-EFFECT-01`
- 打ち手の台帳: `data/business/experiments.json` (EXP-006・EXP-007・EXP-011・EXP-013)

## 次週への申し送り候補

<!-- この週の review ドキュメントで追記される -->
