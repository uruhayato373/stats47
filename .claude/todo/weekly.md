---
title: 今週の計画
type: weekly-plan
week: 2026-W46
date: 2026-11-09
updated: 2026-11-09
status: active
tags: []
---

# 2026-W46 今週の計画

期間: 2026-11-09（月）〜 2026-11-15（日）。11 月の 2 週目。
入力は W44 のレビュー (`data/reviews/weekly/2026-W44.md`、11-08) と W45 の計画の残り、`monthly.md` の重点。
W45 のレビューは 11-14（土）に書く。今週の計画は月曜に書いたので、土曜にはレビューのあと W47 の計画を続けて書く。

## 週

- **ISO Week**: 2026-W46
- **期間**: 2026-11-09 〜 2026-11-15
- **Sprint**: 2026-11 の Week 2

## 前週の申し送り

W44 のレビューの「来週への申し送り」16 件を照合した。

| 申し送り | 振り分け | W46 での扱い |
|---|---|---|
| 手で回す週次の取得の 2 回目で、KDP の取り直しなしに 5/5 そろうか | `MEASUREMENT-MAC-DIRECT-01` | **Must 3** (11-14) |
| `--wait-human` の売上レポート側の修正をコミットし、次のログイン切れで確かめる | `MEASUREMENT-MAC-DIRECT-01` | コミットは済み (`14e7b70c4`)。実地の確認はログインが切れた週に行う |
| 販売台帳の取り込みが conflict (衝突 0 件) と判定される理由 | `KDP-LEDGER-AUTO-01` | Should 3 |
| 商品群に入らない KDP の本 9 冊 | `KDP-LEDGER-AUTO-01` | Should 3 |
| ページ UI の確認の読み残し 63 画面 | `PAGE-UI-REVIEW-COVERAGE-01` | 見送り (重点外。損失は観測されていない) |
| ページ品質の error 164 件 | `PAGE-QUALITY-ERRORS-01` | 見送り (同上) |
| `ai-content-gemini-daily` の 6 回連続失敗 | `AI-CONTENT-GEMINI-KEY-01` | オーナー作業 (日次公開の承認と変数) |
| `quality-suite-weekly` と `affiliate-ga4-weekly` の連続失敗 | #1202 | Could 2 |
| ブログの図の chart-axes が 3 件 | `CHART-AXIS-READABILITY-01` | 見送り (家計調査の書き直しで触れる図だけ直す) |
| note の回遊の error 24 件と商品カードの HTTP 403 | `NOTE-CIRCULATION-LINK-FIX-01` | オーナー作業 (置換案の確認。W45 に作成済み) |
| 調査紐付けの ratchet 下限 (2,124 → 2,123) | 定常 | 11-14 の週次監査で再確認 |
| 撤退済みココナラの古いテスト | 見送り | 11-08 に解消済み |
| 🔴 12 枚を上限 10 へ | 定常 | 下の「🔴 の扱い」 |
| search-growth の保留候補の承認・却下 | 定常 | オーナー作業 |
| 実装計画 4 本 (43・44・45・47) に受け皿のカードが無い | 定常 | 見送り (月次レビューで扱う) |
| X の投稿が 3 週続けて 0 件 | 見送り | 見送り (SNS は 2026-10-23 のオーナー判断で後回し) |

## 今月の重点（月次計画より）

- **重点テーマ**: 家計調査の年次更新と回遊 (サイト) / 製造品出荷額のデータ商品を note で売る (商品)（→ `monthly.md`）
- **月次の想定より進んでいること**: W45 のうちに、商品は 11-04 に note で ¥980 で公開し、市区町村ランキングに案内を置いた (月次では W47〜W48 の予定)。家計調査は上位 5 品目を 2025 年表へ更新して main へ入れ (PR #1205)、記事 81 本を公開した (11-05)。
- **今週この重点で進めること**: 商品は実験の台帳を running にして 6 週の計測を始める。家計調査は、題に 2024 年の値が残る記事のうち流入の多いものを 2025 年の値へ書き直す。

## 前週の振り返り (W45)

W45 のレビューは 11-14 に書く。ここでは計画の checkbox と backlog カードの記録から状態を拾う。

| タスク | 分類 | 状態 | メモ |
|---|---|---|---|
| 土曜の認証付き計測の記録を develop に届ける `MEASUREMENT-MAC-DIRECT-01` | Must | 一部 | 11-07 の自動取得は失敗。11-08 に自動起動をやめて手で回し、KDP に入り直して 5/5 を記録した (`1eeb28bd3`) |
| 県別ランキングの観測と title の目標値の引き渡し `MUNI-PREF-RANKING-OBS-01` | Must | 完了 | 11-01 |
| 待機児童率の指標と R2 反映 `MUNI-KOSODATE-METRICS-01` | Must | 完了 | 11-01 |
| 家計調査の検索入口の棚卸し `CONTENT-KAKEI-EXPANSION-01` | Should | 別の形で完了 | 一覧の形ではなく、到達の実測 `data/surveys/kakei-coverage.json` (11-04) と上位 5 品目の更新で置き換わった。今週は持ち越さない |
| Gemini 無料枠の 1 件確認 | Should | 完了 | run `41271164945` |
| 製造品出荷額の下調べ `MUNI-DATA-PRODUCT-BUILD-01` | Should | 完了 | 11-04 にデータ完成・note 公開まで進んだ |
| Workers CPU の比較 `CF-CPU-SURGE-01` | Should | 未達 | 反映前の窓が 2 日しかなく判定できない。検証期日 11-14 |
| KDP の販売台帳の自動記録 `KDP-LEDGER-AUTO-01` | Should | 未達 | 11-08 に取得は通ったが、取り込みが conflict 判定 |
| 導線名なしの割合 / note の回遊の置換案 | Could | 完了 | 11-01 |

**パターン分析**: Must の残り 1 件は、計測の不具合の直し方そのものが変わった (自動 → 手動) ため。
一方で W45 も計画外の作業が多い (11-02〜11-08 の非 merge コミット 356 件)。ただし今回は重点の 2 テーマの前倒しが中心で、W44 の「重点外のテーマページの作り直し」とは性質が違う。
変わらないのは、計画にない作業が進み計画の checkbox が更新されない点。今週は Must を重点の次の段に合わせ、計画外の作業は 11-14 のレビューで数える。

## 現状サマリー

数値は W44 の計測 (`data/measurement-cycle/latest.json`、11-08 作り直し) による。

| 指標 | 現在値 | 比較・目標 |
|---|---:|---|
| GSC clicks (確定 7 日 10-23〜10-29) | 5,042 | 前 7 日比 +21.9% |
| ★ 検索クリック (GSC rolling28d) | 16,701 | 4 週前 (W40) 11,023、W52 目標 20,000 |
| ★ ページビュー (GA4 Japan 確定 7 日 × 4 週) | 52,955 | W40 43,907、W52 目標 79,000 |
| ★ サイト内回遊率 (ブログ→ランキング) | 10.1% | W40 8.2% |
| ★ 業務文脈の着地セッション | 4,800 | W40 3,560 |
| 週次収益 (NSM) | 判定不能 (5 週連続) | AdSense ¥313。KDP・note は週の値が欠ける |
| 計測の鮮度 | 11/11 | 11-08 に KDP へ入り直した後。`npm run measurement:status` で 5 取得元とも pass (11-09) |
| データ品質ゲート通過率 | 100.0% | 11-06 |
| 公開記事数 | W44 2 本 | W45 は家計調査 81 本 (11-05) |
| SNS 投稿 (W44) | Threads 12 / Instagram 1 / X 0 | SNS は後回し |
| GSC運用サイクル | review-input FAIL 0 / plan FAIL 1 | review-input (11-09) は WARN 1 (`ADSENSE-PLACEMENT-01` のベースライン 3/4 週・判定 11-13)。plan の検査 (`audit-operations-cycle.mjs --stage plan --strict`、11-09) は `snapshot-freshness` が FAIL (最新 W44・期待 W45 以上)。W45 の GSC snapshot は 11-14 (土) の週次取得で作られる予定で、11-08 の値が確定する前に手で取らない。11-14 の取得後に同じ検査を再実行する |
| KDP公開ゲート | measure | 下の節 |
| 本番未反映 | 本番に効く 142 件 | `npm run release:status` (11-09)。開いている PR なし |

## トレンド機会

今回は Track E (はてな・Google News・Yahoo の RSS) を取得していない。今週の Must は 11 月の重点で埋まっており、時事の記事化は計画しない。

## 前週からの持ち越し

- [ ] **Workers CPU の比較と引き渡し** — 元: W45 Should (`CF-CPU-SURGE-01`) → 今週 Could 1
- [ ] **KDP の販売台帳の自動記録の確認** — 元: W45 Should (`KDP-LEDGER-AUTO-01`) → 今週 Should 3
- 家計調査の検索入口の棚卸し (`CONTENT-KAKEI-EXPANSION-01`) は別の形で済んだので持ち越さない (上の振り返り)

## 改善ログ pending (今週着手対象)

| Tier | Metric | ID | Status | Due | Owner |
|---|---|---|---|---|---|
| 1 | adsense | ADSENSE-PLACEMENT-01 | pending | 2026-11-14 | claude |
| 2 | gsc | MUNI-PREF-RANKING-OBS-01 | effect/pending | 2026-11-26 | claude |
| 2 | ga4 | RELATED-ARTICLES-EFFECT-01 | effect/pending | 2026-11-17 | claude |

`ADSENSE-PLACEMENT-01` は 11-13 以降に再開後 4 週のベースラインを判定する (W45 分は 11-14 の取得で入る)。配置の変更は判定のあと、人間承認済みの 1 件だけ。

## 今週のタスク

### Must（絶対達成、3件）

- [x] **製造品出荷額の商品の実験を running にし、6 週の計測を始める** [S] — `MUNI-DATA-PRODUCT-PILOT-01`（商品領域・KPI `paid-purchases`）。
  note の公開 (11-04) は済んだが、実験の台帳 `data/business/experiments.json` の EXP-007 は proposed のまま、開始日と判定日も無い (11-09 確認)。月次のゴールの「EXP-007 が running で判定日が入っている」を満たしていない。
  ① ランキングページの 1 行の案内が本番に出ているかを確かめる (develop にあって本番に無いなら、開始日はデプロイ日にする)
  ② EXP-007 を running にし、開始日と 6 週の判定日 (カードの 2026-12-16 か、本番に出た日から 6 週) を入れる
  ③ 週次で読むもの (案内の `nav_click`・note の販売数) と、その取得元を台帳かカードに 1 行で書く。
  完了条件: `node .claude/scripts/lib/experiments-state.mjs active` に EXP-007 が running で出て、判定日が入っている。
  **結果 (2026-11-09)**: ① 案内は 11-04 の PR #1219 (main 13:11 JST) で本番に出ていた。本番の `/municipalities/ranking/manufacturing-shipment-amount` が HTTP 200 で `/products/data-muni-manufacturing` へのリンクを持つ (curl で確認)。② EXP-007 を running にし、開始日 2026-11-04・判定日 2026-12-16 を入れた。③ 週次で読むもの (案内のクリック = GA4 の nav_click / product_click、販売数 = 販売台帳の note 行) を EXP-007 の `measurement` に書いた。6 週の観測は実験台帳が持つので、🔴 の `MUNI-DATA-PRODUCT-SALE-01` は消した。
- [ ] **家計調査の記事のうち、題に 2024 年の値が残り流入の多い 6 本を 2025 年の値へ書き直す** [M] — `KAKEI-EXPANSION-02`（データ領域）/ `CONTENT-KAKEI-EXPANSION-01`（サイト領域）。
  上位 5 品目のランキングは 2025 年になったが、題 (title / seoTitle) に 2024 年の値が残る記事が 138 本ある。題と順位が食い違うと、検索から来た読者が混乱する。
  今週は流入の多い 6 本 (チョコレート・すし・緑茶・即席麺・清酒・牛肉。一覧は `node .claude/scripts/blog/find-kakei-stale-title-values.mjs`) に絞り、題・本文・図をランキングの 2025 年の値にそろえる。
  1 本ずつ article-writer → `quality-gate` → blog-critic PASS の順に通す。ランキングの値が 2025 年になっていない品目は書き直さない (カードの停止条件)。
  完了条件: 6 本が critic PASS で公開の送り箱に入り、`find-kakei-stale-title-values.mjs` の件数が 6 本分減っている。
- [ ] **手で回す週次の取得の 2 回目を通し、CI 専用のコードを消す** [M] — `MEASUREMENT-MAC-DIRECT-01`（🔴 1 番目・管理領域・KPI `measurement-freshness`）。
  ① 11-14（土）に `npm run weekly:collect` を回し、KDP に入り直さずに 5/5 そろうかを記録する (そろわなければ、どの段で止まったかをカードに書く)
  ② ① が通ったら、カードの「次 2」の CI 専用コード (`collect.mjs` の CI 分岐・`refresh-session.mjs --ci/--publish`・`set-ci-secret.mjs`・`auth-recovery.mjs` ほか) を削除し、`npm run measurement:test` を通す。
  完了条件: 11-14 の記録コミットが develop にあり、`npm run measurement:status` が全行 pass で、CI 専用コードが削除されテストが通っている。① が通らなければ ② は行わず、Must は「一部」と記録する。

### Should（できればやる、3件）

- [ ] **製造品出荷額の 2 指標が同じ値になっている件を正す** [S] — `MUNI-DATA-DEDUP-01`（データ領域・不具合）。
  月次では W46。商品の出典の表 ID を確定させるため。① どちらの表から値を取ったかを取得経路で確かめる ② 片方を止めるか取り直すかを決める。R2 への反映はオーナーの承認後なので、今週は ①② と承認依頼まで。
- [ ] **家計調査の全国時系列・収入別の図を本番へ出す準備をする** [M] — `KAKEI-MULTIAXIS-01`（サイト領域）。
  `CONTENT-KAKEI-EXPANSION-01` の「予定の 6 表」の残り: data-refresh で 9 指標を取り込み値が範囲に収まるかを確かめ、`kakei-axis-charts` を publish=true で回す。各図に対象世帯・期間・単位・出典があることを localhost で確かめる。本番反映は W48 にまとめる。
- [ ] **KDP の販売台帳の取り込みが conflict になる理由を確かめ、9 冊を商品群に入れる** [S] — `KDP-LEDGER-AUTO-01`（管理領域）。
  11-08 の取得は通ったが、取り込みが衝突 0 件で conflict と判定され、商品の台帳は「どの商品群にも入らない本 9 冊」で作り直せなかった。週次収益が 5 週続けて判定不能な理由の 1 つ。
  完了条件: `npm run products:sales --workspace=@stats47/product-factory -- validate` が PASS する。

### Could（余力があれば、2件）

- [ ] **Workers CPU の `_rsc` の割合を Observability で取り直す** [S] — `CF-CPU-SURGE-01`（管理領域・不具合）。検証期日 11-14。反映前の窓が 2 日しかない問題は残るので、`_rsc` が減ったかどうかだけを確かめ、目標値が置けなければ効果観測の引き渡しはしない。
- [ ] **`quality-suite-weekly` と `affiliate-ga4-weekly` の連続失敗の原因を読む** [S] — Issue #1202（管理領域・不具合）。ログを読み、原因と直し方を Issue に書くところまで。

### 定常

- 11-13 以降: `ADSENSE-PLACEMENT-01` の 4 週のベースラインを判定する (11-14 の取得で W45 分が入ってから)。
- 11-14（土）: `npm run weekly:collect` → `/weekly-review 2026-W45` → `/weekly-plan 2026-W47` を続けて行う。
- ブログの全型一律の是正・新規生成は今週の Must にしない。家計調査の書き直しを優先する。
- 期日 11-13・11-15 のアフィリエイトのカード 2 枚は、領域が「維持」なので今週は扱わない (11-14 のレビューで期日を置き直す)。

### 🔴 の扱い

🔴 は 11-09 の朝に 12 枚で上限 10 を超えていた。下げずに片付ける方針で、11-09 のうちに 4 枚を完了して消した (8 枚)。
`KDP-OLD-EDITIONS-UNPUBLISH-01` (旧版 9 冊が HTTP 404)・`MUNI-DATA-PRODUCT-SALE-01` (EXP-007 を running へ)・
`IMAGE-ROUTES-CATEGORY-CODEX-01` (カテゴリ画像を Codex の経路へ)・`KDP-LISTING-WIRING-01` (紹介文の CI と公開の検査・表紙の縮小確認。
表紙の「47都道府県」の扱いは判断待ちの `KDP-COVER-47PREF-DECISION-01` へ分けた)。
残る 8 枚のうち、オーナーの承認が無いと終わらないのは `PRODUCT-REFERRAL-MEASURE-01` (本番反映)・`IA-REGION-THEME-01` (全国テーマの R2 push とデプロイ)・
`AI-CONTENT-GEMINI-KEY-01` (日次量産の起動)・`DATA-PACK-BUNDLE-01` (note の添付の差し替え)・`KDP-LISTING-COPY-01` (KDP の反映と 4 週の記録)。

## オーナー作業

- **本番への反映**: develop に本番に効く変更が 142 件たまっている (`npm run release:status`、11-09)。家計調査・商品の案内・商品の計測 (`PRODUCT-REFERRAL-MEASURE-01`) を含む。出すかどうか、出すならいつかを決めてほしい。商品の 6 週の計測の開始日はこれで決まる。
- **`AI-CONTENT-GEMINI-KEY-01`**: 1 件確認は PASS 済み。日次の量産を起動する (repository variable `GEMINI_FREE_TIER_VERIFIED=true`) かを決めてほしい。起動しない間は日次の cron が失敗を続ける。
- **`NOTE-CIRCULATION-LINK-FIX-01`**: note の公開済み記事のリンク切れ 13 件の置換案 (カードの表) の確認。意味が変わるおそれのある 4 件とホテルの記事 1 件は判断が要る。
- **search-growth の保留候補** (crawled-not-indexed 5 件ほか) の承認か却下。
- **KDP の公開ゲート**: K-S1-02 の月次の販売が 4 週の窓をはみ出し、需要あり・なしを判定できない。窓の中の需要として扱うかを決めてほしい (下の節)。
- **`R2-STORAGE-01`**: R2 の保存量 (43 GB) の保持方針。

## KDP公開ゲート

- **判定**: `measure`（`data/products/kdp-weekly-publication.json`、2026-W46 で再生成）
- **候補**: なし
- **需要証拠**: 判定不能。K-S1-02 の月次の販売が 4 週の窓をはみ出し、窓の中の需要か分からない
- **停止条件**: 日次の販売記録で窓の中を確かめるか、判定の扱いをオーナーが決めるまで新規公開しない
- **承認境界**: この計画への記載は公開承認ではない。対象 ID の明示承認と `--commit` が別途必要

## NSM実験

- running は EXP-006 (YouTube の通常動画 pilot) 1 件。EXP-007 (製造品出荷額の商品) は note で販売中なのに proposed のままで、Must 1 で running にする。EXP-013 (商品への送客の計測) は本番反映の後に始める。
- `/nsm-experiment propose` は実行していない。11 月の打ち手は月次計画で決まっており、新しい候補を足さない。

## 批判的レビュー

> **技術的に楽しいだけでは？** Must 1 は台帳の更新だけだが、これが無いと 6 週の判定日が来ても判定できない。Must 2 は検索から来る読者が見る題と値の食い違いを直す作業で、11 月のサイト重点そのもの。
> Must 3 のコード削除は収益に直結しないが、🔴 の 1 番目で、計測の鮮度 (ガードレール) を守る仕組みの片付けなので入れた。1 回目が通らなければ削除はしない。

> **先週と同じ失敗を繰り返していないか？** W45 は計画外の作業が多く、checkbox が更新されなかった。今週は Must を重点の「次の段」に合わせたので、重点を進めれば checkbox も進む。
> Must 2 は 6 本・critic PASS まであり M の上限に近い。critic で REVISE が続いたら 4 本で止め、残りは W47 に回す。

> **今週でなければ意味がないことは？** EXP-007 は販売開始から 5 日たっており、開始日が後ろにずれるほど 6 週の判定が遅れる。11-14 の取得は週次の計測の 2 回目で、手動の形が続けられるかの判断材料になる。
> `ADSENSE-PLACEMENT-01` の判定は 11-13 以降。

## 関連ドキュメント・施策

- 前週レビュー: `data/reviews/weekly/2026-W44.md` (W45 のレビューは 11-14)
- 11 月の重点: `.claude/todo/monthly.md`
- 計測サイクル: `data/measurement-cycle/latest.json` (W44、11-08)
- backlog: `MUNI-DATA-PRODUCT-PILOT-01` / `KAKEI-EXPANSION-02` / `CONTENT-KAKEI-EXPANSION-01` / `MEASUREMENT-MAC-DIRECT-01` / `MUNI-DATA-DEDUP-01` / `KAKEI-MULTIAXIS-01` / `KDP-LEDGER-AUTO-01` / `CF-CPU-SURGE-01`
- 改善施策: `ADSENSE-PLACEMENT-01` / `MUNI-PREF-RANKING-OBS-01` / `RELATED-ARTICLES-EFFECT-01`
- 打ち手の台帳: `data/business/experiments.json` (EXP-006・EXP-007・EXP-013)

## 次週への申し送り候補

<!-- この週の review ドキュメントで追記される -->
