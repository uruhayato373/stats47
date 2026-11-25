---
title: 今週の計画
type: weekly-plan
week: 2026-W48
date: 2026-11-21
updated: 2026-11-21
status: active
tags: []
---

# 2026-W48 今週の計画

期間: 2026-11-23（月）〜 2026-11-29（日）。11 月の最終週。
入力は W46 のレビュー (`data/reviews/weekly/2026-W46.md`、11-21) と、11-21 時点の W47 の計画の状態、`monthly.md` の重点。
無人の定例実行で書いた。人の承認が要る選択 (本番反映・R2 の正本の上書き・KDP の公開・search-growth の採否) は「承認待ち」とし、Must の完了条件に入れていない。
W47 のレビューは 11-28（土）に書き、続けて W49 の計画を書く。11 月の月次レビューは 12-03 までに書く。

## 週

- **ISO Week**: 2026-W48
- **期間**: 2026-11-23 〜 2026-11-29
- **Sprint**: 2026-11 の Week 4 (最終週)

## 前週の申し送り

W46 のレビューの「来週への申し送り」40 件を照合した。

| 申し送り | 振り分け | W48 での扱い |
|---|---|---|
| 計測の Must を 2 週未達で降格 | `MEASUREMENT-MAC-DIRECT-01` | 定常 (土曜の取得のたびに取得元ごとの成否を読む。Must には再掲しない) |
| KDP の再ログイン | `PRODUCT-REFERRAL-MEASURE-01` | オーナー作業 |
| note の自動ログイン失敗の印 | `AUTH-CREDENTIAL-REGISTER-01` | オーナー作業 |
| 日次収益の明細が空 | `NSM-REVENUE-INPUTS-01` | Could 2 |
| AdSense の判定は 12-05 | `ADSENSE-PLACEMENT-01` | 改善ログの節 (W49 の判定に向けてデプロイ日を確かめる) |
| ユニット数 12 → 47 のデプロイ日 | `ADSENSE-FORMAT-BY-PAGE-01` | Should 3 |
| 無人のレビューが計測より先に始まる | `CI-TOOLING-FOLLOWUP-03` | Could 1 |
| backlog 377 枚と期日超過 23 枚 | `SIMPLIFY-REVIEW-LOOP-EXECUTION-01` | **Must 1** |
| 家計調査の W48 一括反映 | `CONTENT-KAKEI-EXPANSION-01` | **Must 2** |
| テーマページの次の段 | `THEME-DASHBOARD-TEXT-TRIM-01` | **Must 3** |
| 県別ランキングの 4 週記録 (11-26) | `MUNI-PREF-RANKING-OBS-01` | Should 1 |
| 市区町村ページの判定 (11-21 超過) | `MUNI-PAGE-SEO-01` | Should 1 に併せる |
| `affiliate-ga4-weekly` 6 回連続失敗 | `AFF-GA4-WEEKLY-GATE-01` | Should 2 |
| `quality-suite-weekly` 3 回連続失敗 | `QUALITY-SUITE-WEEKLY-RED-01` | 見送り (W47 で ① を済ませた。② は重点外。Must 1 の仕分けで期日を置く) |
| 送信済みビューの最初の行 | `GSC-SOURCE-FRESHNESS-01` | 定常 (11-28 の取得の後に読む) |
| internal-links の壊れリンク 44 件 | `BLOG-LINK-410-REMAP-01` | 見送り (`[実行:sweep]`。backlog-loop に任せる) |
| business-opening の values.json が古い・全国高体連の新しい年 | `DATA-QUALITY-LOOP-01` | 見送り (データ領域で重点外。誤りの報告が無い) |
| 出典のリンク検査 2 本の error | 見送り | 受け皿のカードが無い (起票待ち) |
| note API の 403 | #1064 | 見送り (note の取得が戻るまで検査できない) |
| note の回遊の errors 20 件 | #1149 | 見送り (置換案はオーナーの確認待ち `NOTE-CIRCULATION-LINK-FIX-01`) |
| note の採点で 68 本が取れない | `NOTE-PUBLISHED-AUDIT-01` | 見送り (403 と同じ原因かを 11-28 の監査で見る) |
| ブログの是正キュー 529 件 | `BLOG-REMEDIATION-PROOF-01` | 見送り (全型一律の是正は今月しない) |
| docs の未整理 4 件 | `DOCS-GOVERNANCE-GAPS-01` | 見送り (重点外) |
| 調査分類の `check-datasets` error | 定常 | 11-28 の監査で消えたことを確かめる |
| ページ UI の読み残し 63 画面 | `PAGE-UI-REVIEW-COVERAGE-01` | 見送り (重点外) |
| Workers CPU の比較が 4 週持ち越し | `CF-CPU-SURGE-01` | オーナー作業 (`CF-CPU-URL-01` へ寄せて閉じるかの判断) |
| 本番スモークの失敗 3 件 | `RELEASE-SQUASH-SKIP-TOKEN-01` | オーナー作業 (承認待ち) |
| 相関 snapshot の再計算の失敗 | #1276 | Must 2 の ② (相関の再計算) で併せて見る |
| PSI の `PSI_API_KEY` 未設定 | `STATE-R2-MIGRATION-01` | 見送り (重点外。キーの設定はオーナー作業) |
| Cloudflare のトークン権限と GSC のオーナー作業 | `GSC-USER-ACTIONS-01` | オーナー作業 |
| search-growth の候補 2 件 | 定常 | オーナー作業 |
| 事業イシューマップの 2 行 | 定常 | オーナーの承認の後に次のレビューで反映 |
| `site-pageviews`・`work-context-sessions` に施策 0 件 | 定常 | 11 月の月次レビューで判断 |
| KDP の次の本 | `KDP-EXPANSION-01` | 見送り (KDP の計測が auth_required で、出した本の 8 週の実売を読めない間は新しい本を増やさない) |
| EXP-006 の人の作業 | EXP-006 | オーナー作業 |
| X の投稿と指標が無い | 見送り | 見送り (SNS は後回し) |

## 今月の重点（月次計画より）

- **重点テーマ**: 家計調査の年次更新と回遊 (サイト) / 製造品出荷額のデータ商品を note で売る (商品)（→ `monthly.md`）
- **今週この重点で進めること**: 月次の配分では W48 は「検証を通過した家計調査の変更をまとめて公開し計測開始」と `MUNI-PREF-RANKING-OBS-01` の 4 週記録 (11-26)。W47 の localhost 点検で反映待ち 5 項目の手段と代表 10 URL の結果 (合格 8・反映待ち 1・要修正 1) が出ているので、要修正を直してオーナーに範囲の承認をもらい、承認が出たら反映して計測開始日を記録する。商品は EXP-007 が running で、判定日 12-16 まで観測を続ける。

## 前週の振り返り (W47)

W47 は 11-22 まで続く。11-21 時点の checkbox とカードの記録から拾った (正式な判定は 11-28 の W47 のレビュー)。

| タスク | 分類 | 状態 | メモ |
|---|---|---|---|
| GSC 画面の取得と internal-links の例外 `WEEKLY-COLLECT-NODE20-FAIL-01` | Must | 完了 | 11-21 の取得で GSC が pass、internal-links が例外なしに走り切った。Phase 0b でカードを消した |
| 家計調査の変更面の localhost 点検 `CONTENT-KAKEI-EXPANSION-01` | Must | 完了 | 11-16 にカードへ反映待ち 5 項目の手段・代表 10 URL・#1064 の該当 10 本を書いた。W48 の範囲はオーナーの判断待ち |
| [分割] テーマページの表を畳み 3 テーマで測る `THEME-DASHBOARD-TEXT-TRIM-01` | Must | 完了 | 11-16 に ①③ (未デプロイ)。living-housing の見える文字 2,821→2,595 など。完了条件の「半分程度」には届いていない |
| `quality-suite-weekly` の失敗の切り分け `QUALITY-SUITE-WEEKLY-RED-01` | Should | 完了 | 11-16 に毎回落ちるもの (E2E の blog-detail.spec.ts ほか) を分けた |
| KDP の販売台帳の conflict `KDP-LEDGER-AUTO-01` | Should | 完了 | checkbox |
| カバレッジ履歴の W45 行 `GSC-COVERAGE-TOTALS-DUP-ROW-01` | Should | 完了 | checkbox |
| ページ UI の high の指摘 2 件 `UI-FIX-GEO-ANALYSIS-LAYER-20261114` ほか | Could | 完了 | checkbox |
| AdSense の確定 7 日の期間の日付 `ADSENSE-LATEST-PERIOD-01` | Could | 未達 | 記録なし |
| Workers CPU の `_rsc` の割合 `CF-CPU-SURGE-01` | Could | 未達 | W43 から 4 週持ち越し。W46 のレビューでオーナーに諮った |

**パターン分析**: W45 2/3、W46 2/3、W47 は 11-21 時点で 3/3。W47 は Must を 1 週で届く段に切ったので、3 件とも週の前半で終わった。一方で backlog の削減は W45・W47 と「定常」に置いて実行されず、総枚数は 367 → 377 に増えた。削減を Must に上げる。
`CF-CPU-SURGE-01` は Could に 4 週置いて進まなかったので、W48 は計画に置かずオーナーの判断へ回した。

## 現状サマリー

数値は W46 の計測 (`data/measurement-cycle/LATEST.md`、11-21 作り直し) による。

| 指標 | 現在値 | 比較・目標 |
|---|---:|---|
| GSC clicks (確定 7 日 11-06〜11-12) | 5,241 | 前 7 日比 -4.9% |
| ★ 検索クリック (GSC rolling28d) | 19,931 | 4 週前 (W42) 13,207、W52 目標 20,000 |
| ★ ページビュー (GA4 Japan 確定 7 日 × 4 週) | 60,944 | W42 44,550、W52 目標 79,000 |
| ★ サイト内回遊率 (ブログ→ランキング) | 8.4% | W42 9.3% (下がった) |
| ★ 業務文脈の着地セッション | 5,872 | W42 4,250 |
| 週次収益 (NSM) | 一部のみ (AdSense ¥858・A8 0 件・楽天 0 件 ¥0) | 商品 (KDP・note) は判定不能 |
| 計測の鮮度 | 10/11 (degraded) | kdp が auth_required |
| データ品質ゲート通過率 | 100.0% (2,595/2,596) | 監査 11-14 |
| インデックス登録率 | missing (計測 state) | 送信済みビューは 11-21 に記録された可能性 (plan 段の検査で PASS)。11-28 に値を読む |
| 公開記事数 | W46 は家計調査の書き直し 109 本 | — |
| SNS 投稿 | X・Threads は記録なし | SNS は後回し |
| GSC運用サイクル | review-input PASS 10 / FAIL 0 (08:42 の取り込み後) | FAIL 0 |
| KDP公開ゲート | prepare | 下の節 |
| backlog | 377 枚 / 目安 200 | 期日超過 23 枚・W48 期日 14 枚 |

## トレンド機会

今回は Track E (はてな・Google News・Yahoo の RSS) を取得していない (無人の定例実行で外部取得を行わない)。今週の Must は重点と backlog の削減で埋まっており、時事の記事化は計画しない。

## 前週からの持ち越し

- [ ] **AdSense の確定 7 日の期間の日付** — 元: W47 Could (`ADSENSE-LATEST-PERIOD-01`) → `[実行:sweep]` なので backlog-loop に任せ、計画には置かない
- [ ] **Workers CPU の `_rsc` の割合** — 元: W47 Could (`CF-CPU-SURGE-01`) → オーナー作業 (`CF-CPU-URL-01` へ寄せて閉じるかの判断)
- [ ] **テーマページの文字の削減の次の段** — 元: W47 Must 3 の残り (`THEME-DASHBOARD-TEXT-TRIM-01` の ②④) → 今週 Must 3
- [ ] **家計調査の一括反映** — 元: W47 Must 2 の後段 (`CONTENT-KAKEI-EXPANSION-01`) → 今週 Must 2

## 改善ログ pending (今週着手対象)

| Tier | Metric | ID | Status | Due | Owner |
|---|---|---|---|---|---|
| 2 | gsc-manual | MUNI-PAGE-SEO-01 | pending | 2026-11-21 | claude |
| 1 | gsc | MUNI-PREF-RANKING-OBS-01 | effect/pending | 2026-11-26 | claude |
| 1 | cloudflare | CF-CPU-URL-01 | pending | 2026-11-27 | claude |
| 1 | adsense | ADSENSE-PLACEMENT-01 | pending | 2026-12-05 | claude |

- `MUNI-PAGE-SEO-01`: 期日 11-21 を過ぎた。改善ログの検証コマンドで差の差を取り、improvement-triage が記録する (Should 1)。
- `MUNI-PREF-RANKING-OBS-01`: 11-26 に 470 URL の登録数と表示の 4 週記録を取る (Should 1)。
- `CF-CPU-URL-01`: 11-27 に Workers CPU の日次を改善ログの手順で読む。`[target: -3,800,000 ms/日]` があるので閾値エンジンの判定に任せる。`CF-CPU-SURGE-01` を寄せるかはオーナーの判断。
- `ADSENSE-PLACEMENT-01`: 判定は 12-05 (W49)。今週はユニット数 12 → 47 のデプロイ日の確認だけ (Should 3)。

## 今週のタスク

### Must（絶対達成、3件）

- [x] **backlog の期日超過 23 枚に処置を決め、完了・統合済みのカードを消して総枚数を減らす** [M] — `SIMPLIFY-REVIEW-LOOP-EXECUTION-01`（計画領域。期日超過の 1 枚目として最初に処置を決める）。
  backlog は 377 枚で目安 200 を 177 枚超え、W46 は起票 84・閉じた 84 で純減 0。W45・W47 は削減を定常に置いて進まなかった (Phase 0b の決まりでは目安超過の週は Must に入れる)。
  ① `npm run backlog:waits -- due --week 2026-W48` の期日超過 23 枚を 1 枚ずつ、今週やる・期日を引き直す・消すに決める。`SIMPLIFY-REVIEW-LOOP-EXECUTION-01` は残りの「Must の達成率を読む」を W40〜W47 の実績 (2/2・1/2・1/2・3/3・—・2/3・2/3・3/3) で判定して閉じるか残すかを決める
  ② 本文に完了の証拠があり残作業の無いカードと、統合先のあるカードを、`record-backlog-outcome.mjs` で実行台帳に記録してから消す (統合は class `stale`)
  ③ 期日の引き直しは todo-curator に渡す (年間計画のカードを含む)。
  完了条件: 期日超過 23 枚すべてに処置 (やる・引き直し・消す) がカードか ledger に記録され、`npm run backlog:waits -- flow` の総枚数が 357 枚以下 (377 から 20 枚以上の純減) になっている。
- [x] **家計調査の要修正 2 件を直し、W48 の一括反映の範囲の承認を取り、承認が出たら反映して計測開始日を記録する** [M] — `CONTENT-KAKEI-EXPANSION-01`（🔴 2 番目・サイト領域・KPI `search-clicks`・`site-circulation-rate`）。
  月次計画の W48 の段。W47 の点検で反映の手段と代表 URL の結果は出ている。
  ① `/themes/real-income` で実収入 2024 年と可処分所得 2025 年が混在する件を直す (年を揃えるか、年の違いを表示する)。題に 2024 年の値が残る 4 本 (`find-kakei-stale-title-values.mjs`) を article-writer → quality-gate → blog-critic PASS で直す
  ② 反映待ち 5 項目 (item.json の再生成・相関・エンゲル係数のテーマ表示・ハブ名・「読み解く記事」の題) から入れる範囲を 1 枚の承認依頼にまとめ、`sync-snapshots` の `dry_run=true` で生成だけを先に確かめる。相関の再計算の失敗 (#1276) が範囲に影響するかを併せて書く
  ③ 承認が出たら反映し、代表 10 URL を本番で確かめ、対象 URL の計測開始日をカードに書く (`HOME-FEATURED-RESYNC-01` もリリースの後に同じ承認で行う)。
  完了条件: ①の 2 件が localhost で直り、②の承認依頼がカードに書かれている。承認が週内に出た場合は、③の本番確認と計測開始日の記録まで。本番反映・R2 の正本の上書きはオーナーの承認なしに行わない。
- [x] **テーマページのチャートの説明を出典の Sheet へ寄せ、3 テーマで見える文字と高さを測る** [M] — `THEME-DASHBOARD-TEXT-TRIM-01`（🔴 1 番目・サイト領域・KPI `site-pageviews`）。
  W47 の ①③ (表を畳む) では living-housing の見える文字が 2,821→2,595 で、完了条件の「半分程度」に届いていない。次の段の ② を切り出す。
  ② チャートごとの説明文を出典の Sheet (`SourcesSheet`) へ移す。共通の部品で直し、テーマごとの専用部品は作らない
  ③ W47 と同じ測り方 (全国版・1280px・同じスクリプト) で living-housing・education-culture・aging-society の前後を測る。
  完了条件: 3 テーマの前後の値がカードに書かれ、関連の vitest が通っている。本番反映は Must 2 の一括に含めるかをオーナーに諮る。④ (1 指標カードの格子) は次の週へ残す。

### Should（できればやる、3件）

- [ ] **県別の市区町村ランキングの 4 週記録と、市区町村ページの施策の判定を取る** [S] — `MUNI-PREF-RANKING-OBS-01` / `MUNI-PAGE-SEO-01`（サイト領域・KPI `search-clicks`）。11-26 に 470 URL の登録数と表示を改善ログの手順で取り、`MUNI-PAGE-SEO-01` (期日 11-21 超過) の差の差を取る。記録は improvement-triage に渡す。判定に要る窓が足りなければ pending のまま理由と次の期日を書く。同じ期日の年間計画 `MUNI-CITY-PAGE-SNIPPET-01`・`MUNI-TITLE-MAGNITUDE-01` は、この判定を見てから着手か期日の引き直しかを決める。
- [ ] **`affiliate-ga4-weekly` の 6 回連続の失敗の原因を確かめる** [S] — `AFF-GA4-WEEKLY-GATE-01`（アフィリエイト領域・不具合）。カードの「次」の ①② (在庫 snapshot が古い理由、A8 の照合不足が認証付き計測の記録の置き場と食い違うか) まで。アフィリエイトの観測が 11-14 で止まり、週次収益の収益効率が判定できない。直すのが workflow の main 反映を要するなら、承認依頼を書いて止める。期日 11-28 の `SIMPLIFY-FAILING-AUTOMATION-01` の判定に同じ結果を使う。
- [x] **AdSense のユニット数 12 → 47 のデプロイ日を確かめ、12-05 の判定の比較窓を決める** [S] — `ADSENSE-FORMAT-BY-PAGE-01`（アフィリエイト領域）。git log と deploy の run から本番に出た日を確かめ、`ADSENSE-PLACEMENT-01` の比較窓と矛盾しないかをカードに書く。配置の変更はしない。 → **済み (11-24)**: 11-12 12:54Z〜11-13 03:48Z の 3 回のデプロイで増えた。ベースライン窓 (〜11-07) の後で矛盾なし。配置後の比較は W47 から (カードに記録)。

### Could（余力があれば、2件）

- [x] **無人のレビューを 02:00 の計測の完了まで待たせる** [S] — `CI-TOOLING-FOLLOWUP-03`（管理領域・不具合）。11-21 は CI が 07:35 開始にずれ、07:30 開始のレビューが前週の値を拾った。収集の最初に `measurement-cycle/latest.json` の week が対象週かを確かめ、違えば待つか止める。 → **済み**: 上流の `3fe2f26e3` (11-23) で weekly-review の SKILL.md に計測の commit と run を待つ手順が入った。11-28 の無人レビューで待つかを確かめる。
- [x] **認証付き計測が日次収益の明細を書かない件の原因を読む** [S] — `NSM-REVENUE-INPUTS-01`（管理領域）。`revenueDaily` が空配列の理由 (取得元ごとの対応の有無) をカードに書くところまで。 → **済み (11-24)**: note の販売履歴が再確認待ち (verification_required)、kdp が failed、a8・rakuten は明細の実装前。認証待ちで、カードに記録。

### 定常

- 11-28（土）: `npm run weekly:collect` → `/weekly-review 2026-W47` → `/weekly-plan 2026-W49` を続けて行う。
- 11-28（土）の取得の後: `MEASUREMENT-MAC-DIRECT-01` の完了条件 (記録コミットが develop にあり、`npm run measurement:status` に stale と失敗が無い) を読む。KDP の再ログインが済んでいなければ判定不能のまま、取得元ごとの成否だけを記録する。
- 11-28（土）の取得の後: `GSC-SOURCE-FRESHNESS-01` — `coverage-submitted-history.csv` に最初の行が入ったかを確かめる。入っていなければ、取得のどの段が行を書かないかをカードに書く。
- 11-28（土）の週次監査: 調査分類の `check-datasets` error が消えたこと、note の 403 が続くかを確かめる。
- W48 が期日のカード 14 枚 (`npm run backlog:waits -- due --week 2026-W48`) は Must 1 の仕分けに含める。観測待ちの年間計画 (`GSC-MESSAGE-TRIAGE-01`・`GSC-INTERNAL-DISCOVERY-01`・`MUNI-RANKING-EXPANSION-01`・`PRODUCT-FUNNEL-DEPLOY-01`・`GSC-DEMAND-REPORT-01`) と時期待ち (`AFF-A8-EXPANSION-2026-10`・`R2-AUTHORITATIVE-GUARD-ENFORCE-01`・`BACKLOG-LOOP-WEEKLY-ENABLE-01`) は、契機が来ていなければ todo-curator が期日を延ばす。`ADSENSE-OVERLAY-AB-01` (11-25) は配置の判定 (12-05) の後に回す。
- 11-30 から 12 月: 11 月の月次レビュー (12-03 まで) と 12 月の月次計画。EXP-008 (子育て) の開始の再判断は 12 月の月次で行う。
- ブログの全型一律の是正・新規生成は今週の Must にしない。

## オーナー作業

- **KDP の再ログイン**: `node packages/ops/src/measurement/refresh-session.mjs kdp --wait-human` (2 段階認証)。商品の週次収益・EXP-011・EXP-013 の注文・KDP の 8 週計測が止まっている (`PRODUCT-REFERRAL-MEASURE-01`)。
- **`AUTH-CREDENTIAL-REGISTER-01`**: note の自動ログイン失敗の印を確かめて消してほしい (note の売上の最終観測が 10-17)。
- **家計調査の一括反映の範囲** (`CONTENT-KAKEI-EXPANSION-01`): 反映待ち 5 項目のどれを W48 に入れるかと、develop→main の本番反映の可否。
- **`CF-CPU-SURGE-01`**: 4 週持ち越した比較を `CF-CPU-URL-01` (11-27 判定) の効果観測へ寄せてカードを閉じてよいか。
- **`MUNI-DATA-DEDUP-01`**: 製造品出荷額の重複指標の解消の方針。
- **`GSC-USER-ACTIONS-01`**: Cloudflare の API トークンにゾーンの analytics の読み取り権限を足す・GSC の記録に要る作業 (期日 11-13 超過)。
- **承認待ちの 9 枚** (W46 のレビューの「オーナーへの確認」): `DATA-WAGE-TEACHER-COVERAGE-01`・`BLOG-MOBILE-READABILITY-01`・`OPENDATA-RANKING-PILOT-01`・`SNAPSHOT-EDGE-PURGE-GAP-01`・`RELEASE-SQUASH-SKIP-TOKEN-01`・`PRODUCTS-PAGE-CONTENT-01`・`PRODUCT-PACK-CONTENT-MISMATCH-01`・`REFERENCE-EXPANSION-NOTE-01`・`DEPS-RENOVATE-01`。
- **search-growth 候補 2 件の approve / dismiss** (`/ranking/agricultural-output`・`/blog/municipality-count-prefecture-gap`)、**事業イシューマップの 2 行への判定不能の書き込み**。
- **AI-CONTENT-GEMINI-KEY-01** (🔴 のオーナー作業): 日次公開の起動の承認と repository variable の設定。
- **EXP-006**: YouTube のチャンネルの所有の確認と、各動画の手動投稿。

## KDP公開ゲート

- **判定**: `prepare`（`data/products/kdp-weekly-publication.json`、2026-W46 で再生成）
- **候補**: なし（blocker: 検証済みの本が 0 冊）
- **需要証拠**: 販売数・KENP は not-measured (KDP は 11-21 に auth_required)。審査中は prefecture-guide の `K-S3-02`・`K-S3-03`、S1 は live 13・審査中 1。0 需要ではない
- **停止条件**: KDP の計測が戻り、出した本の 8 週の実売を読めるまで新しい本を作らない (今週は `KDP-EXPANSION-01` の設計・生成を計画に入れない)
- **承認境界**: この計画への記載は公開承認ではない。対象 ID の明示承認と `--commit` が別途必要

## NSM実験

- running は EXP-006 (YouTube pilot・人の作業 2)・EXP-007 (製造品出荷額の商品、判定日 12-16)・EXP-011 (KDP セレクト、判定日 12-05)・EXP-013 (K-S1-02 とブログ 10 記事の商品案内の 6 週計測)。
- `/nsm-experiment propose` は実行していない。active が 2 件以上あり、11 月の打ち手は月次計画で決まっているので新しい候補を足さない。EXP-011・EXP-013 の注文は KDP の再ログインまで判定不能。

## 批判的レビュー

> **技術的に楽しいだけでは？** Must 1 の backlog の削減は収益に直結しないが、377 枚 (目安の約 1.9 倍) で 🔴 の着手順や期日が埋もれ、W45・W47 と定常に置いて進まなかった。完了条件を「20 枚以上の純減」と数で置いた。Must 2・3 は 11 月のサイト重点と 🔴 の上位 2 枚。

> **先週と同じ失敗を繰り返していないか？** 計測の Must は W45・W46 と未達で、W47 から定常にした。W48 も再掲しない (11-21 は KDP が落ち、オーナーの再ログインが前提)。Must 2 は承認待ちで止まりうるので、承認が出なくても届く ①② を完了条件にした。Must 3 は W47 の段では完了条件の「半分程度」に届かなかったので、次の段を切り出した。

> **今週でなければ意味がないことは？** W48 は 11 月の最終週で、家計調査の一括反映と計測開始が月次のゴール。`MUNI-PREF-RANKING-OBS-01` (11-26) と `CF-CPU-URL-01` (11-27) の期日が今週に来る。
> Must 1 の計画領域は重点 (サイト・商品) の外で `npm run docs:check` の DG077 の警告になりうるが、Phase 0b の決まり (目安超過の週は削減を Must に入れる) を優先した。削減を受け持つ専用カードは無いので、期日超過の 1 枚目を主 ID にした。

## 関連ドキュメント・施策

- 前週レビュー: `data/reviews/weekly/2026-W46.md` (W47 のレビューは 11-28)
- 11 月の重点: `.claude/todo/monthly.md`
- 計測サイクル: `data/measurement-cycle/latest.json` (W46、11-21)
- backlog: `SIMPLIFY-REVIEW-LOOP-EXECUTION-01` / `CONTENT-KAKEI-EXPANSION-01` / `THEME-DASHBOARD-TEXT-TRIM-01` / `HOME-FEATURED-RESYNC-01` / `AFF-GA4-WEEKLY-GATE-01` / `SIMPLIFY-FAILING-AUTOMATION-01` / `ADSENSE-FORMAT-BY-PAGE-01` / `CI-TOOLING-FOLLOWUP-03` / `NSM-REVENUE-INPUTS-01` / `PRODUCT-REFERRAL-MEASURE-01` / `KDP-EXPANSION-01`
- 年間計画: `MEASUREMENT-MAC-DIRECT-01` / `GSC-SOURCE-FRESHNESS-01` / `MUNI-CITY-PAGE-SNIPPET-01` / `MUNI-TITLE-MAGNITUDE-01`
- 改善施策: `MUNI-PAGE-SEO-01` / `MUNI-PREF-RANKING-OBS-01` / `CF-CPU-URL-01` / `ADSENSE-PLACEMENT-01`
- 打ち手の台帳: `data/business/experiments.json` (EXP-006・EXP-007・EXP-011・EXP-013)

## 次週への申し送り候補

<!-- この週の review ドキュメントで追記される -->
