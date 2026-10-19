---
title: 今週の計画
type: weekly-plan
week: 2026-W43
date: 2026-10-19
updated: 2026-10-19
status: active
tags: []
---

# 2026-W43 今週の計画

期間: 2026-10-19（月）〜 2026-10-25（日）。10 月計画（W41〜W44）の Week 3/4。
本来は 10-17（土）に W41 のレビューと続けて書く計画だったが、レビューだけが書かれ、計画は 10-19（月）に書いた。
入力は W41 のレビュー (`data/reviews/weekly/2026-W41.md`、10-17) と、W42 の計画の進み具合 (チェック欄と各カードの記録)。
W42 のレビューは 10-24（土）が期限で、W44 の計画もその日に続けて書く。

## 週

- **ISO Week**: 2026-W43
- **期間**: 2026-10-19 〜 2026-10-25
- **Sprint**: 2026-10 月次計画（W41〜W44）の Week 3/4

## 前週の申し送り

W41 のレビューの「来週への申し送り」16 件と、W42 の計画の「次週への申し送り候補」3 件を照合した。

| 申し送り | 振り分け | W43 での扱い |
|---|---|---|
| 1. 高血圧外来受療率 1 件の公式確認へ分割する。dryRun 済みと R2 反映待ちを分ける | `DATA-QUALITY-LOOP-01` | **Must 1** `[分割]` |
| 2. A8 の 10 月案件別明細でサイト帰属・gate を実測する | `A8-CROSSCHECK-EXCEED-01` | **Should 2** (サイト別は 10-17 に復旧済み。残りは案件別の帰属根拠) |
| 3. state 上書き対策の週次コミットを照合する | `STATE-OVERLAY-MAIN-01` | **Must 2** |
| 4. 改善 cycle の旧ログ path を直す | CI-IMPROVEMENT-LOG-PATH-01 | 見送り (10-17 のレビュー後の是正で完了し、カードは削除済み。改善 cycle `38983066199` が W41 の triage を書き戻した) |
| 5. AdSense の基準値窓と target 欠落を分ける | ADSENSE-BASELINE-VERDICT-01 | 見送り (10-17 に完了・削除済み。基準値の 4 週観測は `ADSENSE-PLACEMENT-01` が 11-13 まで持つ) |
| 6. GA4 の 2 つの週次 snapshot の差を説明する | GA4-NSM-SNAPSHOT-RECONCILE-01 | 見送り (10-17 に完了・削除済み。集計を直し正典と一致) |
| 7. GSC coverage 更新の時間予算 (10-23) | `GSC-SOURCE-FRESHNESS-01` | 定常 (10-23 の確認。gsc-analyst) |
| 8. Dataset 2 種類の検証結果 (10-23) | `GSC-DATASET-NESTED-SCHEMA-01` | 定常 (10-23 の確認。gsc-analyst) |
| 9. robots 584 件の再取得 (10-23) | `GSC-ROBOTS-INDEXED-01` | 定常 (10-23 の確認。gsc-analyst) |
| 10. テーマ d28 を公開後だけの窓で再観測する | `THEME-EXPANSION-EFFECT-01` | 改善ログ pending (10-24 の W42 レビューで処理) |
| 11. note カード全量監査の分割 | `NOTE-CARD-REPAIR-01` | 見送り (商品領域は今月の重点外。Must の総量を増やさない) |
| 12. UI 未読 60 画面と error 3,283 件の分類 | `PAGE-QUALITY-ERROR-BACKLOG-01` | 見送り (サイト領域。同上) |
| 13. SNS の週内履歴欠測と EXP-006 の表記 | `SNS-YT-STALE-RECORDS-01` | 見送り (SNS は維持。`[実行:sweep]` なので自動処理が拾える) |
| 14. KDP・ココナラの再認証 | `AUTH-CREDENTIAL-REGISTER-01` | オーナー作業 (10-17 に KDP・ココナラ・A8・note を再認証し、run 38987311743 attempt 4 で 8 サービスすべて pass。残りは Windows のココナラ資格情報) |
| 15. 家計 note 施策の観測窓 | `NOTE-KAKEI-REDESIGN-EFFECT-01` | 改善ログ pending (10-24 の W42 レビューで処理) |
| 16. Geo 登録と GSC メッセージ (10-23) | 定常 | 定常 (10-23 の確認) |
| (W42) 第 2・3 週の「更新」の R2 反映後に配信年を確かめる | `DATA-QUALITY-LOOP-01` | Must 1 に含む。W41 の 2 指標は R2 に未反映 (10-19 に公開 values を取得、小 5 男子身長は 2023 の 1 年だけ) |
| (W42) `KDP-LEDGER-AUTO-01` は KDP の再認証が済んだ週に入れる | `KDP-LEDGER-AUTO-01` | **Should 3** (再認証は 10-17 に済んだ) |
| (W42) W41 の計測で計測の鮮度と週次収益の内訳を読み、W43 の Must を決める | 定常 | 下の「現状サマリー」に反映した |

## 今月の重点（月次計画より）

- **重点テーマ**: 週次収益 (NSM) を内訳つきで数字で言える状態にする / 公開している指標の誤り・古さを週 5 指標ずつ処置し、処置の流れを 4 週続ける（→ `monthly.md`）
- **重点領域**: 管理 / データ
- **今週この重点で進めること**:
  - データ: データ品質ゲートを 100% に戻す経路 (レシピ未焼き込み 21 件の再生成) と、W41 の残り 1 指標の公式確認 (Must 1)
  - 管理: 🔴 先頭 2 枚の確認を終えて閉じる (Must 2)、サイト内クリックの全件計測を仕上げる (Must 3、月次計画の W43 Must・期日 10-23)、`measurement-freshness` 12/14 の中間確認 (10-23 の計測)

## 前週の振り返り（W42）

結果の検証は 10-24（土）の W42 レビューで行う。ここではチェック欄とカードの記録だけで分類した。

| タスク | 分類 | 状態 | メモ |
|---|---|---|---|
| データ品質キューの第 3 週 5 指標 `DATA-QUALITY-LOOP-01` | Must | 未着手 | カードに第 3 週の記録が無い。W41 の 2 指標の R2 反映も未実施 |
| BLOG-WAVE 7 件の終了判断 EFFECT-TARGET-MARKERS-01 | Must | 完了 | 10-10 に終了を記録 (週の開始前に完了) |
| Workers CPU の 10-15 請求書と期日 `CF-CPU-SURGE-01` | Should | 完了 | 10-16 に請求書 (CPU 3.70 倍) と主因 (`_rsc` 約 72%) を記録し期日を 10-30 に再設定。対策 `f94a5035f` は 10-17 の PR #1141 で main に反映 |
| Next.js の脆弱性の該当性 `DEPS-NEXT16-UPGRADE-01` ① | Should | 未着手 | カードの記録に変化なし |
| A8 の 10 月明細と成果ゲート `A8-CROSSCHECK-EXCEED-01` | Should | 一部 | サイト別は 10-17 に監査 PASS で正規化 (222 click)。案件別は監査 FAIL で隔離、gate は未解除 |
| Could 3 件 (`SEO-CTR-CANDIDATES-01` / `CONTENT-FOOD-TRIVIA-01` / `BUSINESS-PLAN-FRESHNESS-MTIME-01`) | Could | 未着手 | |

**パターン分析**: W42 に計画した作業で週内に終えたのは Should 1 件だけで、Must は週の開始前に終わった 1 件を除くと 0 件だった。
週の作業枠は計画外の作業 (計測の再認証と KDP 取得の修正、GSC の技術是正、note 画像台帳、PR #1141 のリリース) に使われた。
どれも必要な作業だったが、データ品質の Must は W41 (未達) と W42 (未着手) の 2 週続けて進んでいない。W43 は Must 1 を `[分割]` で 1 週に収まる大きさまで縮め、10-21（水）を中間の期日にする。

## 現状サマリー

数値は W41 の計測 (10-16) による。10-17 の認証復旧の効果は 10-23（金）の W42 の計測で読む。

| 指標 | 現在値 | 比較・目標 |
|---|---:|---|
| GSC clicks（確定 7 日 10-02〜10-08） | 3,621 | 前 7 日 3,074、+17.8% |
| ★ 検索クリック (GSC rolling28d) | 12,263 | 4 週前 (W37) 7,503、W52 目標 20,000 |
| ページビュー (GA4 Japan 確定 7 日 × 4 週) | 44,662 | W37 36,760、W52 目標 79,000 |
| 週次収益（NSM） | 判定不能 (W41) | 10-17 に KDP・ココナラ・A8・note を再認証し 8 サービス pass。A8 はサイト別の収益行が使える。別日の main schedule 連続 2 回は未達 |
| ★ 計測の鮮度 | 10/14 (degraded) | 欠測は sns・a8・kdp・coconala (10-16 時点)。月末 12/14 以上 (月次ゴール) |
| ★ データ品質ゲート通過率 | 99.1%（2,435/2,456） | 不合格 21 件はすべてレシピ未焼き込み (レシピ導入前の古い R2 データ。監査は違反ではなく残数として扱い、増えたときだけ失敗)。10-17 の監査でも 21 件 |
| データ品質キュー (10-17 生成) | 誤り 1 / 更新 1,085 / 調査終了候補 114 / noindex 候補 151 | W41 末 (10-11 版) は誤り 1 / 更新 1,081 / 終了 114 / noindex 177 |
| ★ 運用コスト | 閾値違反 24 件・R2 保存 34.152 GB | 9/15〜10/14 の Workers CPU は前期間の 3.70 倍 ($21.38) |
| 公開記事数 | 618 | R2 `app/blog/all.json` (10-19 取得) |
| SNS 投稿済み | X 210 / Instagram 216 / YouTube 158 / Threads 50 | 予約中 X 88・Instagram 35・Threads 8 |
| GSC運用サイクル | FAIL (review-input 段) | snapshot-freshness だけが FAIL (W42 の取得は 10-23 の週次)。AdSense 基準値は 0/4 週で WARN |
| KDP公開ゲート | measure | 販売数/KENP 未計測 (K-S1-01〜12)。新規公開なし |

## トレンド機会

| トレンド | ソース | stats47 データ | アクション |
|---|---|---|---|
| 道府県立高校が 2040 年度までに 145 校減る見込み | Yahoo!ニュース トピックス (10-19 取得) | `high-school-count-per-100k-15-17` | 記録のみ (SNS の新規量産は今月しない方針) |
| はてなブックマーク Hot Entry・Google News | はてな / Google News (10-19 取得) | 都道府県・統計の話題なし | なし |

## 前週からの持ち越し

W42 の計画の未チェック 7 件。今週の扱いは次のとおり。

- [ ] **データ品質キューの第 3 週 5 指標** — 元: W42 Must → 今週 Must 1 に `[分割]` して縮小
- [ ] **Workers CPU の 10-15 請求書の記録と期日の再設定** — 元: W42 Should → 実際は 10-16 に完了。続き (反映後 7 日の比較) を今週 Should 1 に置く
- [ ] **Next.js の脆弱性の該当性** — 元: W42 Should → 今週 Should 4
- [ ] **A8 の 10 月明細と成果ゲート** — 元: W42 Should → 今週 Should 2
- [ ] **公衆電話・出生率の食い合い** — 元: W42 Could → 今週 Could 2
- [ ] **食品の雑学記事の品目の突き合わせ表** — 元: W42 Could → 見送り (W44 で再判断)
- [ ] **事業計画 state の鮮度判定のテスト** — 元: W42 Could → 今週 Could 3

## 改善ログ pending（今週の期日）

Tier は improvements.md に列が無いので「—」とした。10-16 の無人 triage は提案 0 件で、期日を過ぎていた `NOTE-KAKEI-REDESIGN-EFFECT-01` も処理しなかった。
W42 の計画のように無人 triage に任せきりにせず、10-24（土）の W42 レビューで improvement-triage を起動して下の claude 担当の行を処理する。

| Tier | Metric | ID | Status | Due | Owner |
|---|---|---|---|---|---|
| — | content | NOTE-KAKEI-REDESIGN-EFFECT-01 | pending | 2026-10-13 (超過) | claude |
| — | ga4/gsc/theme-quality | THEME-EXPANSION-EFFECT-01 | effect/pending | 2026-10-17 (超過) | theme-portfolio-manager |
| — | ga4/note | NOTE-CIRCULATION-PILOT-01 | effect/pending | 2026-10-18 (超過) | claude |
| — | ga4 | BLOG-SRCLINK-01 | effect/pending | 2026-10-19 | claude |
| — | measurement | MEASUREMENT-AUTH-RESTORE-01 | pending | 2026-10-19 | uruhayato373（10-23 の W42 計測で判定） |
| — | affiliate | AFF-RESOLUTION-EFFECT-01 | pending | 2026-10-25 | claude |
| — | affiliate | AFF-IMPRESSION-ROUTING-01 | effect/pending | 2026-10-25 | claude |

## 今週のタスク

### Must（絶対達成、3件）

- [x] **[分割] データ品質ゲートを 100% に戻す再生成の dryRun と、W41 の残り 1 指標の公式確認を済ませる** [M] — `DATA-QUALITY-LOOP-01`（🔴 4 番目・データ領域・KPI `data-quality-pass-rate`）。
  W41 (未達)・W42 (未着手) の 2 週続けて進んでいないので、5 指標の枠を今週は次の 2 点に縮める。
  ① `treatment-rate-hypertension-outpatient` (患者調査) の公式の最新公表を一次資料で確かめ、基準 1〜4 の処置をカードに記録する。
  ② 監査のレシピ未焼き込み 21 件 (`data/ranking/integrity-audit.json` の `recipe.unbaked`) と、W41 に years を広げた 2 指標
  (`average-height-primary-school-fifth-grade-male`・`national-treasury-disbursement-prefecture`) を data-refresh の dryRun にかけ、
  R2 反映の承認依頼を 1 回にまとめる。e-Stat 以外の出典などで再生成できないものは、件数と理由をカードに書く。
  dryRun の依頼 push は 10-21（水）までに行う。①の記録と②の dryRun run (失敗は理由つき) がカードにあり、承認依頼をオーナーへ出していれば完了。
  R2 への反映そのものはオーナーの承認後で、完了条件に含めない。使用: `/inspect-estat-meta`、data-ingester
  **途中経過 (2026-10-19)**: ①は済み (令和5年患者調査が公式の最新公表で、処置なし)。②は前提が誤っていた。21 件はすべて手動投入で dryRun では焼き直せない。
  値を変えずに recipe を足す移行は 21 件とも通るが、10-08 に recipe なしで書いた経路が未特定なので、(a) 書き手を直して再投入するか (b) 移行リストに足すかをオーナーが決める (カードに記録)。
  W41 の 2 指標は dryRun 合格済みで、R2 反映の承認待ち。
  **更新 (2026-10-19)**: オーナーが (a) を選び、2 指標の R2 反映を承認した。2 指標は data-refresh run 39192011125 (success) で反映済み。
  書き手 (`stats-values-writer.mjs` ほか 3 本) が recipe を焼くように直した。21 件の再投入は、R2 の資格情報がある端末で行う (カードに手順と完了条件を記録)。
  **結果 (2026-10-19 夜・Mac)**: オーナーの指示で 21 件を R2 へ反映した。20 件は 10 本の fetch で作り直し、公開中の行と値・年・県・順位が全行一致することを確かめてから key ごとに diff-push-r2。`low-elevation-population-ratio-5m` は書き手の Python (`low-elevation-population-overlay.py`) が recipe を焼かないため、公開中の値のまま正典の recipe だけを足して反映した。ローカルで `audit-ranking-data-integrity.ts` を回し、`recipe.unbaked` は 0 件 (全 2,460 指標)。次の週次監査でゲート 100% を確かめる。
- [x] **🔴 先頭 2 枚の残りの確認を run ログで終えて閉じる** [S] — `RELEASE-1125-MERGE-01` / `STATE-OVERLAY-MAIN-01`（🔴 1・2 番目・管理領域・不具合）。
  PR #1125 の確認項目は、① `seo-keyword-cycle-daily` の main の schedule が 10-17・10-18 に success、④ `ai-content-gemini-daily` は 10-12 を最後に定期発火していない (10-19 に `gh run list` で確認)。
  ③ (affiliate-ga4-weekly の計測ゲート) は A8 の未解除が原因なので `A8-CROSSCHECK-EXCEED-01` へ引き渡す。
  state 上書き対策は、マージ後の週次 (`fetch-metrics-weekly`) のコミットで `data/psi/history.csv`・`data/cloudflare/history.csv` に削除行が無い
  (cloudflare は保持 30 日超の行だけ許す) ことと、`.claude/state/metrics/{page-quality,monthly-jobs,authenticated}` を変えていないことを確かめる。
  2 枚の完了条件の証拠 (run ID・コミット) をカードに書き、カードを削除していれば完了。月曜に最初に行う。
  **結果 (2026-10-19)**: 週次 `fetch-metrics-weekly` run 38820105627 のコミット `543ebe715` (W41) は psi・cloudflare の削除行 0、禁止パスの変更 0。
  日次の `6361f0c60`・`fd14ef70c` は削除 0、`a92554ff7` は 2026-09-15 の cloudflare 1 行だけ (保持 30 日超)。①④は上記の run で確認済み。
  ③は `A8-CROSSCHECK-EXCEED-01` へ引き継ぎを書き、2 枚とも削除した。
- [x] **サイト内クリックの全件計測を仕上げ、導線名なしの上位に名前を付ける** [M] — `NAV-CLICK-COVERAGE-01`（🔴 7 番目・管理領域・月次計画の W43 Must・期日 10-23）。
  W41 の計測で被覆率 23.2%、`nav_click` の 53.9% が導線名なし。行き先の上位 4 つ (ranking 1,495 / geo 599 / municipalities 573 / areas 509 クリック) を出している部品を特定し、
  `data-nav-surface`・`data-nav-label` の属性を足す (見た目・マークアップ構造・クラスは変えない)。
  あわせて完了条件 ① の残り (localhost で未確認だったカテゴリ・県・テーマ・調査の 4 種で、実クリック 1 回につき送信 1 件) を確かめる。
  単体テストと localhost の確認が済み、コミット済みで、本番デプロイの承認依頼をオーナーへ出していれば完了。デプロイは承認後に 1 回だけ行う。使用: site-ux-manager
  **途中経過 (2026-10-19)**: GA4 の資格情報が手元に無いので、開発サーバーの HTML と部品のコードから出どころを特定し、7 部品に導線名を付けた (カードに記録)。
  テスト・型・ESLint は通過し、localhost の HTML で属性が出ることを確認した。実クリックの確認はブラウザ枠の描画が止まりできていない。本番デプロイの承認待ち。
  **本番反映 (2026-10-19)**: PR #1158 で main に入り、deploy-workers は 09:35Z に success。本番の `/ranking/total-population` の HTML に `ranking_table` 10・`ranking_theme` 4・`ranking_related` 2・`ranking_blog` 9 の導線名が出ていることを curl で確認した。残りは実クリック 1 回につき送信 1 件の確認と、10-23 の計測での被覆率の読み取り。
  **実クリックの確認 (2026-10-19 夜・本番)**: アプリ内ブラウザで本番を操作した。ランキング表の「東京都」を 1 回クリックすると `nav_click` が 1 件 (`nav_surface=ranking_table`)、県ページの「世帯数」では GA4 への送信本文に `nav_click` が 1 件 (`area_highlights`) だけ入り、どちらも遷移は止まらなかった。完了条件を満たしたので完了とする。被覆率は 10-23 の計測で読む (カードの次の段)。

### Should（できればやる、4件）

- [ ] **Workers CPU の対策の反映後 7 日を比べ、効果観測を引き渡してカードを閉じる** [S] — `CF-CPU-SURGE-01`（🔴 8 番目・管理領域・不具合・KPI `operating-cost`）。
  次の ② ③ ④ を行う。② 10-18 以降の日次取得の CI ログで「Workers CPU total」が値か取得不能かを確かめる。
  ③ 10-24（土）に、反映後 7 日 (10-17〜10-23) の日次 CPU (無ければ cpu_p50/p99 と requests) と Observability の `_rsc` の CPU 割合を、反映前と並べる。
  ④ 効果観測を `[kpi: operating-cost]` と根拠つきの `[target:]` を付けた別 ID で improvement-triage へ引き渡し、カードを閉じる。月次計画の W44 Must を前倒しする。
  **途中経過 (2026-10-19)**: ②済み。CPU 合計は 3 日とも取得できている。合計の低下はデプロイ前の requests 減から始まっていたので、③は 1 件あたりの CPU と `_rsc` の割合で比べる (カードに記録)。
- [x] **A8 の案件別クリックの帰属根拠を得て、成果ゲートを再検証する** [S] — `A8-CROSSCHECK-EXCEED-01`（🔴 3 番目・管理領域・不具合）。
  stats47 と doboku-note の現在の配信広告定義と `programIdMap` を照合し、未写像 3 行と共用 3 案件の帰属根拠をカードに書く。
  推測で配賦しない。既存の許容差を広げない。`node .claude/scripts/ads/check-a8-outcome-gate.mjs` を再実行し、exceeded と shortfall が出なければカードを閉じる。
  **途中経過 (2026-10-19)**: 両サイトの定義と分類表は一致し、10 月の超過 12 件は分類の誤りでは説明できないと分かった。原因の特定には隔離した 10 月の案件別 CSV か、A8 への再ログイン後の取得が要る (カードに仮説と確かめ方を記録)。ゲートは shortfall・month-missing のまま。
  **更新 (2026-10-19)**: オーナーの再ログイン後に 10 月分を取り直した。超過の原因は、口座にある他のサイト登録 (X・kazu-note・doboku-note の note) が stats47 と同じ案件のリンクを使っていることだった (専用案件のうち他サイト分は 15 件以上で、超過と一致)。
  共用の一覧に案件を足すか、突合の上限をサイト別レポートの実測で決めるかをオーナーが決める (カードに記録)。
  **結果 (2026-10-19)**: オーナーが後者を選んだ。突合の上限を「サイト行 + 他サイト登録のクリックのうち共用・未写像で説明できない分」に変え (テストつき)、10 月分を正規化した。
  成果ゲートは ready (exit 0)。台帳に記録してカードを削除した。
- [ ] **KDP の月次売上が販売台帳へ自動で入ることを W42 の計測で確かめて閉じる** [S] — `KDP-LEDGER-AUTO-01`（管理領域・週次収益の商品実売の内訳）。
  10-23 の W42 計測のあと、`npm run products:sales --workspace=@stats47/product-factory -- validate` が PASS し、KPI ツリーの `paid-purchases` の KDP 分が判定不能でなくなっていればカードを閉じる。
  判定不能のままなら、どの段 (取得・record・KPI の読み込み) で止まったかをカードに書く。
- [x] **Next.js の high 脆弱性が OpenNext の配信に当たるかを確かめる** [S] — `DEPS-NEXT16-UPGRADE-01` ①（🔴 10 番目・不具合）。
  W42 から持ち越し。advisory 2 件の影響条件と OpenNext の Next 16 対応状況を公式で確かめ、日付つきでカードに書く。
  当たらないと確定できれば例外の理由と再評価日を書いて 🟡 へ下げる。上げる作業 (② 以降) は今週はしない。
  **結果 (2026-10-19)**: 公式 advisory 2 件の修正版は 15.5.27 と 16.3.8 で、stats47 は 15.5.27。`npm audit --omit=dev --audit-level=high` は exit 0、本番の代表 4 URL は 200。
  advisory 側のデータ更新で 15 系にも修正版が示され、上げる作業は不要になった。台帳に記録してカードを削除した。

### Could（余力があれば、3件）

- [x] **データ品質キューの需要順の次の 2 指標を処置する** [S] — `DATA-QUALITY-LOOP-01`（データ領域）。Must 1 が 10-21 までに済んだときだけ着手する。
  対象は `designated-difficult-disease` (GSC 表示 892) と `physical-disability-certificates-issued` (825)。公式の最新公表を確かめてから基準 1〜4 を決める。
  **結果 (2026-10-19)**: 指定難病は e-Stat の最新 2021 年度の表へ切り替え (基準 2)、R2 へ反映済み (run 39206759769、公開値は 2021 年度 47 県)。身体障害者手帳は SSDS の収録上限と一致し処置なし。
- [x] **公衆電話・出生率の検索の食い合いを確かめる** [S] — `SEO-CTR-CANDIDATES-01` ①（サイト領域・攻める・期日 10-25）。
  **結果 (2026-10-19)**: 10-08 に済んでいた (公衆電話は食い合いあり・出生率はなし)。「10,717.00個」の修正の本番定着も確認した。残りは title 案のオーナー確認。
- [x] **事業計画 state の鮮度判定のテストを足して閉じる** [S] — `BUSINESS-PLAN-FRESHNESS-MTIME-01`（管理領域・不具合。実装は 10-07 に済み。月次計画の W43 Could）。
  **結果 (2026-10-19)**: 判定を関数に切り出し、一時 git リポジトリでテスト 4 件を足した。台帳に記録してカードを削除した。

### 定常

- 次の `affiliate-ga4-weekly` の run で計測ゲート (`a8-cross-check-*`) が通り、Health Check の portfolio stale が消えることを確かめる (PR #1125 の確認項目 ③。A8 の成果ゲートは 10-19 に ready)。

- 10-23（金）05:00 の `fetch-metrics-weekly` が W42 を取り、12:00 の無人 triage と 18:00 の週次メトリクス Issue が続くことを確かめる。
  `measurement-freshness` が 12/14 に届いているか (月次ゴールの中間確認) と、GSC運用サイクルの snapshot-freshness が PASS に戻るかを読む。
- 10-23（金）: GSC の技術是正の確認 (gsc-analyst)。Dataset の検証結果 `GSC-DATASET-NESTED-SCHEMA-01`、robots 584 件の再取得 `GSC-ROBOTS-INDEXED-01`、
  coverage 全量更新 `GSC-SOURCE-FRESHNESS-01`、Geo の登録状態と GSC のメッセージ。STARTED のまま閉じない。
- 10-24（土）: `/weekly-review 2026-W42` を書き、improvement-triage で上の改善ログ pending を処理してから、同じ日に `/weekly-plan 2026-W44` を書く。

## オーナー作業

- **`DATA-QUALITY-LOOP-01`**: Must 1 が出す R2 反映の承認依頼 (W41 の 2 指標とレシピ未焼き込み分をまとめて 1 回) を承認してほしい。
- **`NAV-CLICK-COVERAGE-01`**: Must 3 の後に出す本番デプロイ (P1・P2 をまとめて 1 回) を承認してほしい。
- ~~**`AUTH-CREDENTIAL-REGISTER-01`**: Windows のココナラ資格情報の登録~~ — 2026-10-19 のココナラ撤退で不要 (取得対象から外した)。
- **`NOTE-PACKS-REPLACE-COCONALA-01`** (2026-10-19 追加): Windows PC で 13 パックの Office 実機確認と、有料 note 版の記事ごとの確認 (価格・境界・添付)。
- **`AUTHENTICATED-MEASUREMENT-ACTIVATION-01`**: 今週の作業は無い。別日の main schedule で 2 回続けて全取得元が pass になるかを観測する。KDP が `auth_required` に戻ったら本人の Reports 再認証が要る。
- **`PERF-WORKER-P99-01`**: 10-16 に Observability の Traces で route 別の CPU を見て、`_rsc` が約 72% と出た (`CF-CPU-SURGE-01`)。これを特定結果としてカードを閉じてよいか決めてほしい。
- **`R2-STORAGE-01`**: doboku-note-archive の保持方針 (許容か削減か) を決めてほしい。R2 保存は 34.152 GB で無料枠 10 GB の超過が続いている。
- **`DEPS-RENOVATE-01`**: Renovate の GitHub App のインストール。
- **`NOTE-FREE-DEFAULT-01`**: 雑学・ランキングの有料記事を閲覧の多い順に数本だけ無料に戻す (note へのログインが必要)。
- **EXP-006**: YouTube Studio のチャンネル所有確認 (期日 10-31)。済むまで制作と計測日を進めない。

## KDP公開ゲート

- **判定**: `measure`（`data/products/kdp-weekly-publication.json`、2026-W43 で再生成）
- **候補**: なし
- **需要証拠**: 販売数/KENP は K-S1-01〜12 すべて未計測。0 需要ではない。9 月の確定月次は 1 件 159 円 (K-S2-03) が台帳にある
- **停止条件**: KDP の販売数/KENP を台帳へ記録できるまで新規公開しない (`KDP-LEDGER-AUTO-01` で確かめる)
- **承認境界**: この計画への記載は公開承認ではない。対象 ID の明示承認と `--commit` が別途必要

## NSM実験

- active は EXP-006 1 件 (running 表記だが YouTube の保留方針と不整合。`SNS-YT-STALE-RECORDS-01` が扱う)。measure しない。
- `/nsm-experiment propose` は実行していない。10 月の月次計画が新規実験を重点外としているため、候補を出しても採用しない。

## 批判的レビュー

> **技術的に楽しいだけでは？** Must のうちコードを変えるのは Must 3 だけで、内容は計測の属性の追加である。月次計画が「UI 改善を計測で判定する土台」として
> W43 Must に置いたもので、期日は 10-23。Must 1 は公開値の品質ゲートの是正、Must 2 は期日を過ぎた 🔴 2 枚を run ログの証拠で閉じるだけである。
> 計測サイクルが「重点レーンの KPI なのに施策が 0 件」と出している 3 つのうち、`operating-cost` は Should 1 の引き渡しで施策が付く。
> `data-quality-pass-rate` は再生成で 21 件が消えれば決定的に 100% に戻るので、効果観測の行は作らない。`site-health` は今週扱わない。

> **先週と同じ失敗を繰り返していないか？** W42 は計画した作業がほとんど進まず、データ品質の Must は 2 週続けて止まった。今週は Must 1 を `[分割]` で縮め、
> 10-21（水）を dryRun 依頼の中間期日にした。Must は 3 件で、月次計画の「各重点領域 1 件」に対して管理領域が 2 件になる。
> ただし Must 2 は run ログの確認だけの S で、月曜に最初に終える。持ち越しが 7 件あるので、Could は 3 件に絞り、食品の雑学は W44 へ送った。
> 期日を過ぎた改善ログは、W42 で無人 triage に任せて処理されなかったので、今週は W42 レビューの手順に入れた。

> **今週でなければ意味がないことは？** `NAV-CLICK-COVERAGE-01` の期日 10-23。`CF-CPU-SURGE-01` の反映後 7 日の窓が 10-23 に閉じること。
> GSC の技術是正の確認日 10-23。アフィリエイト 2 施策の 4 週判定と `SEO-CTR-CANDIDATES-01` の期日 10-25。

## 関連ドキュメント・施策

- 前週の計画とレビュー: W42 計画 (この計画で上書き。git 履歴に残る) / `data/reviews/weekly/2026-W41.md`
- 週次 snapshot: `data/nsm/weekly-snapshots/2026-W41.json`、計測サイクル `data/measurement-cycle/LATEST.md` (W41)
- 月次計画: `.claude/todo/monthly.md`（2026-10）
- 運用の正本: `.claude/config/review-wiring.json` (週次レビューと次週の計画は土曜期限)
- backlog: `DATA-QUALITY-LOOP-01` / `RELEASE-1125-MERGE-01` / `STATE-OVERLAY-MAIN-01` / `NAV-CLICK-COVERAGE-01` / `CF-CPU-SURGE-01` / `A8-CROSSCHECK-EXCEED-01` / `KDP-LEDGER-AUTO-01` / `DEPS-NEXT16-UPGRADE-01` / `SEO-CTR-CANDIDATES-01` / `BUSINESS-PLAN-FRESHNESS-MTIME-01`
- 改善施策: `NOTE-KAKEI-REDESIGN-EFFECT-01` / `THEME-EXPANSION-EFFECT-01` / `NOTE-CIRCULATION-PILOT-01` / `BLOG-SRCLINK-01` / `MEASUREMENT-AUTH-RESTORE-01` / `AFF-RESOLUTION-EFFECT-01` / `AFF-IMPRESSION-ROUTING-01` / `ADSENSE-PLACEMENT-01`
- データ品質: `data/data-quality/checks/LATEST.md` (10-17 生成)、`data/ranking/integrity-audit.json` (10-17)
- KDP state: `data/products/kdp-weekly-publication.json`

## 次週への申し送り候補

- R2 反映が承認されたら、反映後の配信年とデータ品質ゲートの通過率 (21 件の解消) を確かめる
- `NAV-CLICK-COVERAGE-01` がデプロイされたら、次の週次で被覆率と導線名なしの上位を読む
- W42 の計測 (10-23) で `measurement-freshness` と週次収益の内訳を読み、W44 の Must (`CF-CPU-SURGE-01` の判断を含む) を決める
