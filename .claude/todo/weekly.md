---
title: 今週の計画
type: weekly-plan
week: 2026-W47
date: 2026-11-14
updated: 2026-11-14
status: active
tags: []
---

# 2026-W47 今週の計画

期間: 2026-11-16（月）〜 2026-11-22（日）。11 月の 3 週目。
入力は W45 のレビュー (`data/reviews/weekly/2026-W45.md`、11-14) と、11-14 時点の W46 の計画の状態、`monthly.md` の重点。
W46 のレビューは 11-21（土）に書き、続けて W48 の計画を書く。

## 週

- **ISO Week**: 2026-W47
- **期間**: 2026-11-16 〜 2026-11-22
- **Sprint**: 2026-11 の Week 3

## 前週の申し送り

W45 のレビューの「来週への申し送り」32 件を照合した。

| 申し送り | 振り分け | W47 での扱い |
|---|---|---|
| GSC 画面の取得と internal-links が例外で落ちる | `WEEKLY-COLLECT-NODE20-FAIL-01` | **Must 1** (11-21 の取得の前) |
| 2 週続けて残った計測の Must を降格する | `MEASUREMENT-MAC-DIRECT-01` | 定常 (11-21 の取得のあとに完了条件を読む。Must には再掲しない) |
| KDP の販売台帳の取り込みが conflict | `KDP-LEDGER-AUTO-01` | Should 2 |
| 商品群に入らない KDP の本 9 冊 | `CONTENT-FOLLOWUP-01` | オーナー作業 |
| note の自動ログイン失敗の印 | `AUTH-CREDENTIAL-REGISTER-01` | オーナー作業 |
| 財政比較 note 2 本の判定 (期限 11-09 を超過) | `NOTE-FISCAL-PEER-SALES-01` | 改善ログの節 (判定不能として improvement-triage へ) |
| AdSense のベースラインの判定 | `ADSENSE-PLACEMENT-01` | 改善ログの節 |
| AdSense の確定 7 日の期間の日付 | `ADSENSE-LATEST-PERIOD-01` | Could 2 (`[実行:sweep]`) |
| 送信済みビューの記録の最初の行 | `GSC-SOURCE-FRESHNESS-01` | 定常 (11-21 の取得の後。Must 1 が前提) |
| カバレッジ履歴の W45 行が W44 行と同値 | `GSC-COVERAGE-TOTALS-DUP-ROW-01` | Should 3 |
| `quality-suite-weekly` の 3 週連続の失敗 | `QUALITY-SUITE-WEEKLY-RED-01` | Should 1 |
| `affiliate-ga4-weekly` の 4 回連続の失敗 | #1207 | 見送り (アフィリエイトは維持の領域。Should 1 の調べで同じ原因が見つかったときだけ扱う) |
| ranking-integrity の「違反あり」 | `RANKING-INTEGRITY-AUDIT-FLAKE-01` | 見送り (重点外。11-21 の監査で再び出たらログを読む) |
| note の回遊の errors 20 件 | #1149 | 見送り (置換案はオーナーの確認待ち `NOTE-CIRCULATION-LINK-FIX-01`) |
| 家計調査の記事で有料 note のカードが無い | #1064 | 見送り (SNS の領域。Must 2 の家計調査の点検で該当記事を一覧に入れる) |
| 参照されない docs 4 件 | `DOCS-GOVERNANCE-GAPS-01` | 見送り (重点外) |
| ブログの是正キューの pending 537 件 | `BLOG-REMEDIATION-PROOF-01` | 見送り (全型一律の是正は今月しない) |
| 調査分類の S6 警告 3 件 | `SURVEY-PAGES-01` | 見送り (survey-curator の運用) |
| ページ UI の high の指摘 2 件 | `UI-FIX-GEO-ANALYSIS-LAYER-20261114` ほか | Could 1 |
| ページ UI の読み残し 63 画面 | `PAGE-UI-REVIEW-COVERAGE-01` | 見送り (重点外。損失は観測されていない) |
| 🔴 の 1 番目が 2 週進まない | `THEME-DASHBOARD-TEXT-TRIM-01` | **Must 3** (1 週で届く段に分割) |
| Workers CPU の比較が 3 週持ち越し | `CF-CPU-SURGE-01` | Could 3 (進まなければ 11-21 のレビューで `CF-CPU-URL-01` へ寄せるかをオーナーに諮る) |
| Cloudflare の API トークンの権限 | `GSC-USER-ACTIONS-01` | オーナー作業 |
| search-growth の保留候補 3 件 | 定常 | オーナー作業 |
| ASP の台帳登録 | 定常 | オーナー作業 |
| 事業イシューマップの判定日を過ぎた 2 マス | 定常 | オーナーの承認の後に W46 のレビューで反映 |
| backlog 367 枚と期日超過 30 枚の仕分け | 定常 | 定常 (下の節) |
| `site-pageviews`・`work-context-sessions` に施策が 0 件 | 定常 | 11 月の月次レビューで判断 |
| 月次計画と EXP-011 の状態の食い違い | 定常 | 月次計画の見直しで直す |
| EXP-006 の人の作業 2 件 | EXP-006 | オーナー作業 |
| PSI の週次 snapshot の `PSI_API_KEY` 未設定 | 見送り | 受け皿のカードが無い (起票待ち) |
| X の投稿と指標が無い | 見送り | 見送り (SNS は 2026-10-23 のオーナー判断で後回し) |

## 今月の重点（月次計画より）

- **重点テーマ**: 家計調査の年次更新と回遊 (サイト) / 製造品出荷額のデータ商品を note で売る (商品)（→ `monthly.md`）
- **今週この重点で進めること**: 月次の配分では W47 は「家計調査の費目別の導線とテーマ・ブログを localhost で確かめる」週。11-13 までに題に旧年の値が残る記事 109 本の書き直しと公開が済んだので、残りは W48 の一括の本番反映の対象を確定させること。商品は EXP-007 が running で、判定日 12-16 まで観測を続ける (新しい作業はしない)。

## 前週の振り返り (W46)

W46 は 11-15 まで続く。11-14 時点の checkbox とカードの記録から拾った。

| タスク | 分類 | 状態 | メモ |
|---|---|---|---|
| 製造品出荷額の実験を running にする `MUNI-DATA-PRODUCT-PILOT-01` | Must | 完了 | 11-09。EXP-007 は開始 11-04・判定日 12-16 |
| 家計調査の題に 2024 年の値が残る記事の書き直し `KAKEI-EXPANSION-02` | Must | 完了 | 6 本の目標を超え、109 本を書き直して 11-13 までに公開した (blog-critic の再審査で全本 PASS) |
| 手で回す週次の取得の 2 回目と CI 専用のコードの削除 `MEASUREMENT-MAC-DIRECT-01` | Must | 一部 | CI 専用のコードは 11-14 に撤去した (`13071e5ef`)。11-14 の取得は KDP にオーナーの再認証が要り、GSC は例外で失敗した |
| 製造品出荷額の 2 指標の重複 `MUNI-DATA-DEDUP-01` | Should | 一部 | 11-14 に原因を調べた。解消の方針はオーナーの判断待ち |
| 家計調査の全国時系列・収入別の図 `KAKEI-MULTIAXIS-01` | Should | 未確認 | カードに 11-09 以降の記録が無い |
| KDP の販売台帳の取り込み `KDP-LEDGER-AUTO-01` | Should | 未達 | `products:sales -- validate` は未実行 |
| Workers CPU の `_rsc` の割合 `CF-CPU-SURGE-01` | Could | 未達 | 記録なし |
| `quality-suite-weekly` の失敗の原因 (#1202) | Could | 一部 | 11-14 に 3 回の run の落ちた job を `QUALITY-SUITE-WEEKLY-RED-01` へ書いた。原因は未調査 |

**パターン分析**: W45 は Must 2/3、W46 は 11-14 時点で 2/3。両週とも残ったのは計測の Must で、原因は毎週違う (自動起動の失敗 → KDP の再認証と GSC の例外)。計測の Must は「取得が 1 回通る」を完了条件にしていたため、取得のどこか 1 か所が落ちると週ごと未達になる。今週は GSC の例外という 1 つの不具合に絞って Must にし、計測のカードそのものは土曜の確認へ降格した。
KDP の販売台帳 (`KDP-LEDGER-AUTO-01`) は W45・W46 と Should で 2 週続けて未達、Workers CPU (`CF-CPU-SURGE-01`) は W43 から 3 週持ち越している。

## 現状サマリー

数値は W45 の計測 (`data/measurement-cycle/LATEST.md`、11-14 作り直し) による。

| 指標 | 現在値 | 比較・目標 |
|---|---:|---|
| GSC clicks (確定 7 日 10-30〜11-05) | 5,512 | 前 7 日比 +9.3% |
| ★ 検索クリック (GSC rolling28d) | 18,592 | 4 週前 (W41) 12,263、W52 目標 20,000 |
| ★ ページビュー (GA4 Japan 確定 7 日 × 4 週) | 56,533 | W41 44,662、W52 目標 79,000 |
| ★ サイト内回遊率 (ブログ→ランキング) | 9.5% | W41 8.6% |
| ★ 業務文脈の着地セッション | 4,717 | W41 3,828 |
| 週次収益 (NSM) | 判定不能 (6 週連続) | AdSense ¥461。KDP・note は週の値が欠ける |
| 計測の鮮度 | 10/11 (degraded) | gsc が runner_failed。Must 1 で是正 |
| データ品質ゲート通過率 | 100.0% (2,595/2,596) | 監査 11-14 |
| インデックス登録率 | missing | 送信済みビューの記録が未作成 |
| 公開記事数 | 家計調査の書き直し 109 本 (W46) | W45 は送り箱へ 81 本 |
| SNS 投稿 | X・Threads は記録なし | SNS は後回し |
| GSC運用サイクル | review-input FAIL 0 / WARN 1 | `submitted-view-freshness` (送信済みビューの初回の記録待ち) |
| KDP公開ゲート | observe | 下の節 |
| backlog | 367 枚 / 目安 200 | 期日超過 30 枚 |

## トレンド機会

今回は Track E (はてな・Google News・Yahoo の RSS) を取得していない。今週の Must は 11 月の重点と計測の是正で埋まっており、時事の記事化は計画しない。

## 前週からの持ち越し

- [ ] **手で回す週次の取得の 2 回目** — 元: W46 Must 3 (`MEASUREMENT-MAC-DIRECT-01`) → 2 週連続で残ったので Must から降格し、定常の 11-21 の確認にする。今週の Must 1 は原因の不具合 (`WEEKLY-COLLECT-NODE20-FAIL-01`) に絞った
- [ ] **製造品出荷額の 2 指標の重複** — 元: W46 Should (`MUNI-DATA-DEDUP-01`) → オーナー作業 (解消の方針の判断)
- [ ] **家計調査の全国時系列・収入別の図** — 元: W46 Should (`KAKEI-MULTIAXIS-01`) → 今週は Must 2 の点検に含める
- [ ] **KDP の販売台帳の取り込み** — 元: W46 Should (`KDP-LEDGER-AUTO-01`) → 今週 Should 2
- [ ] **Workers CPU の `_rsc` の割合** — 元: W46 Could (`CF-CPU-SURGE-01`) → 今週 Could 3
- [ ] **`quality-suite-weekly` の失敗の原因** — 元: W46 Could (#1202) → 今週 Should 1 (`QUALITY-SUITE-WEEKLY-RED-01`)

持ち越しが 6 件あるので、今週の Must は 1 週で届く完了条件に切り、Should・Could は落としてよい順に並べた。

## 改善ログ pending (今週着手対象)

| Tier | Metric | ID | Status | Due | Owner |
|---|---|---|---|---|---|
| 1 | adsense | ADSENSE-PLACEMENT-01 | pending | 2026-11-14 | claude |
| 2 | note | NOTE-FISCAL-PEER-SALES-01 | pending | 2026-11-09 | claude |
| 2 | ga4 | RELATED-ARTICLES-EFFECT-01 | effect/pending | 2026-11-17 | claude |
| 2 | gsc-manual | MUNI-PAGE-SEO-01 | pending | 2026-11-21 | claude |
| 1 | gsc | MUNI-PREF-RANKING-OBS-01 | effect/pending | 2026-11-26 | claude |
| 1 | cloudflare | CF-CPU-URL-01 | pending | 2026-11-27 | claude |

- `ADSENSE-PLACEMENT-01`: ベースライン 4/4 週 (W42〜W45) がそろった。4 週の間に表示広告の固定化 (10-31) と自動広告のアンカー (11-04) が入っているので、配置の効果としては読まない。improvement-triage が判定を記録し、配置の変更は人間承認済みの 1 件だけにする。
- `NOTE-FISCAL-PEER-SALES-01`: 期限 11-09 を過ぎた。note の売上の記録が 10-17 で止まっているので、手順どおり判定不能とし、次の期日 12-07 を improvement-triage が置く。
- `RELATED-ARTICLES-EFFECT-01`: 11-17 に W44〜W46 を改善ログの再現コマンドで取り、W40〜W42 の範囲 (2.90〜3.76%) と比べる。
- `MUNI-PAGE-SEO-01`: 11-21 以降に改善ログの検証コマンドで差の差を取る。

## 今週のタスク

### Must（絶対達成、3件）

- [ ] **週次の取得で GSC 画面の取得と internal-links が例外で落ちる件を直す** [S] — `WEEKLY-COLLECT-NODE20-FAIL-01`（管理領域・不具合・KPI `measurement-freshness`）。
  ガードレールの計測の鮮度が 11/11 から 10/11 に下がった。GSC の除外理由の内訳はその時点の書き出しなので、落ちた週の分は後から取れない。
  ① カードの仮説を検証する: `cd ~/stats47-measurement && node -v && node -e "require('./.claude/scripts/lib/prefectures.cjs')"` を v20 と v22 で実行して比べる
  ② 取得の失敗時に例外の本体 (最初の行) を `message` に残す
  ③ ① の結果に従い、専用 clone の Node の版を揃えるか require の経路を直す。直したら専用 clone で internal-links だけを手で回して例外が出ないことを確かめる。
  ①〜③ は 11-20（金）までに済ませる。完了条件: 11-21（土）の `npm run weekly:collect` で GSC の取得元が pass になり、internal-links が例外なしで走り切る。GSC がログイン切れで落ちた場合は、例外ではないことが ② の記録で分かれば Must は完了とし、ログインはオーナー作業に回す。
- [ ] **家計調査の変更面を localhost で点検し、W48 の一括の本番反映の対象を確定させる** [M] — `CONTENT-KAKEI-EXPANSION-01`（🔴 2 番目・サイト領域・KPI `search-clicks`・`site-circulation-rate`）。
  月次計画の W47 の段。題の書き直し (109 本) は済んだので、次は公開した変更を本番に出す前の点検。
  ① カードの「反映待ち」5 項目 (697 件の item.json の再生成・相関 snapshot の再計算・エンゲル係数のテーマ表示・ハブ名の再出力・「読み解く記事」の題) ごとに、反映の手段 (sync-snapshots の task 名・workflow) と承認の要否を一覧にする
  ② 調査ハブ → テーマ → ランキング → ブログの代表 URL を 10 件選び、localhost (`npm run dev:web`) で対象世帯・地域・期間・単位・出典と次の導線があるかを確かめる。全国時系列・収入別の図 (`KAKEI-MULTIAXIS-01`) の載る面を含める
  ③ 有料 note のカードが無い家計調査の記事 (#1064 の `b-kakei-expense-*`) を一覧に加える。
  完了条件: カードに ①②③ の一覧と、代表 10 URL の確認結果 (合格・要修正) が書かれ、W48 に出す変更の範囲が決まっている。本番反映・R2 の正本の更新はこの Must に含めない (オーナー承認)。
- [ ] **[分割] テーマページの表を上位・下位の数行に畳み、3 テーマで見える文字と高さを測る** [M] — `THEME-DASHBOARD-TEXT-TRIM-01`（🔴 1 番目・サイト領域・KPI `site-pageviews`）。
  W45・W46 と Must に入らず 2 週進まなかったので、カードの「次」の ① と ③ だけを切り出す。
  ① データの表を上位・下位の数行だけ見せ、残りは「全件を見る」で開く (HTML には残す)。共通の部品で直し、テーマごとの専用部品は作らない
  ③ `/themes/living-housing` ほか 2 テーマで、変更の前後の見える文字と高さを同じ測り方で測る。
  完了条件: 3 テーマの前後の値がカードに書かれ、関連の vitest が通っている。本番反映は W48 の一括に含める。② の説明の Sheet への移動・④ の格子の扱いは次の週へ残す。

### Should（できればやる、3件）

- [ ] **`quality-suite-weekly` の 3 回の失敗を、毎回落ちるものと 1 回だけのものに分ける** [S] — `QUALITY-SUITE-WEEKLY-RED-01`（サイト領域・不具合）。カードの「次」の ①。毎回落ちる job が分かれば、②の原因の実証に進む。`affiliate-ga4-weekly` (#1207) と同じ原因が見つかったときだけ併せて扱う。
- [ ] **KDP の販売台帳の取り込みが conflict になる理由を確かめる** [S] — `KDP-LEDGER-AUTO-01`（管理領域）。W45・W46 と Should で残った。今週は `npm run products:sales --workspace=@stats47/product-factory -- validate` を実行し、conflict の判定に使われた行をカードに書くところまで。直せない理由がオーナーの判断 (既読ページの埋め方など) なら、判断の依頼を書いて閉じる。3 週目も進まなければ W48 の計画では 🟡 の扱いに下げる。
- [ ] **GSC カバレッジ履歴の W45 行が W44 行と同値の件を確かめる** [S] — `GSC-COVERAGE-TOTALS-DUP-ROW-01`（サイト領域・不具合）。11-08 の取得の入力と、履歴に行を足すスクリプトの週の決め方を読み、独立した観測か写しかをカードに書く。

### Could（余力があれば、3件）

- [ ] **ページ UI の high の指摘 2 件を直す** [S] — `UI-FIX-GEO-ANALYSIS-LAYER-20261114` / `UI-FIX-PREFECTURE-DETAIL-HOKKAIDO-20261114`（サイト領域・不具合）。外国語の広告が画面上部を覆う件と、北海道の表の「全国順位」列が切れる件。
- [ ] **AdSense の確定 7 日の期間の日付を週次の要約に入れる** [S] — `ADSENSE-LATEST-PERIOD-01`（サイト領域）。`[実行:sweep]` なので backlog-loop に任せてもよい。
- [ ] **Workers CPU の `_rsc` の割合を Observability で取り直す** [S] — `CF-CPU-SURGE-01`（管理領域・不具合）。W43 から 3 週持ち越し、期日 10-30 を過ぎている。11-21 のレビューまでに進まなければ、`CF-CPU-URL-01` の効果観測に寄せてカードを閉じるかをオーナーに諮る。

### 定常

- 11-17: `RELATED-ARTICLES-EFFECT-01` の判定 (改善ログの手順)。
- 11-21 以降: `MUNI-PAGE-SEO-01` の判定。同じ期日の `MUNI-CITY-PAGE-SNIPPET-01`・`MUNI-TITLE-MAGNITUDE-01` (年間計画) は、この判定の結果を見てから着手するかを決める。
- 11-21（土）: `npm run weekly:collect` → `/weekly-review 2026-W46` → `/weekly-plan 2026-W48` を続けて行う。
- 11-21（土）の取得の後: `MEASUREMENT-MAC-DIRECT-01` の完了条件 (記録コミットが develop にあり、`npm run measurement:status` に stale と失敗が無い) を読む。満たせばカードを閉じ、満たさなければ落ちた段だけを新しいカードに分ける。
- 11-21（土）の取得の後: `GSC-SOURCE-FRESHNESS-01` — `coverage-submitted-history.csv` に最初の行が入り、登録済みが 6,729 と同じ桁かを確かめる (Must 1 が前提)。
- **backlog の削減** (総枚数 367 / 目安 200、Phase 0b の決まり): 期日を過ぎた 30 枚 (`npm run backlog:waits -- due --week 2026-W47`) を、今週やる・期日を引き直す・消すに 1 枚ずつ決める。消すカードは完了の証拠か統合先があるものだけで、実行台帳に記録してから消す。削減を受け持つカードは backlog に無いので、ここで定常として扱う。
- 今週が期日の年間計画のカード: `CI-LEAD-TIME-01` (11-20・本番反映が前提なので、反映が無ければ期日を延ばす)、`MINIMUM-WAGE-2026-01` (11-21・データ領域で重点外。公表の確認だけ行い、取り込みは 12 月の月次で判断)、`THEME-CPI-503-01`・`UI-FOLLOWUP-01` (11-21・観測。11-21 の週次監査の結果で判定)。期日の引き直しは年間計画の編集なので todo-curator に依頼する。
- ブログの全型一律の是正・新規生成は今週の Must にしない。

## オーナー作業

- **GSC の画面のログイン**: Must 1 の結果、例外ではなくログイン切れと分かった場合に `node .claude/scripts/google-admin/cli.mjs login` で入り直してほしい。
- **`AUTH-CREDENTIAL-REGISTER-01`**: note の自動ログイン失敗の印 (`.local/authenticated-measurement/note.autologin-failed`、10-22 から) を確かめて消してほしい。消えないと note の売上が週次で判定不能のまま。
- **`CONTENT-FOLLOWUP-01`**: 商品群に入らない KDP の本 9 冊 (K-S1-01・02・05・07・08・09・10・11・12) を、商品群に入れるか台帳から外すかを決めてほしい。
- **`MUNI-DATA-DEDUP-01`**: 製造品出荷額の重複指標の解消の方針 (市区町村だけの重複指標を止めて amount 側へ寄せるか) を決めてほしい。
- **`GSC-USER-ACTIONS-01`**: Cloudflare の API トークンにゾーンの analytics の読み取り権限を足してほしい (Googlebot の集計が unavailable)。
- **作業ツリーの git の衝突**: 4 ファイルの衝突と `stash@{0}` の扱いを決めてほしい (11-14 の取り込みの残り)。
- **承認待ちの一覧** (W45 のレビューの節): search-growth 候補 3 件の approve / dismiss、ASP の台帳登録、事業イシューマップの 2 マスの書き込み、`[待ち:承認]` のカード 20 枚、開いている PR #1266 と本番への反映。
- **EXP-006**: YouTube のチャンネルの所有の確認と、各動画の手動投稿。

## KDP公開ゲート

- **判定**: `observe`（`data/products/kdp-weekly-publication.json`、2026-W45 で再生成）
- **候補**: なし
- **需要証拠**: 販売数・KENP は not-measured (KDP の日別の観測が 7 日中 1 日)。0 需要ではない
- **停止条件**: 審査中のパイロット `K-S1-14` の live の read-back まで新規出版を止める
- **承認境界**: この計画への記載は公開承認ではない。対象 ID の明示承認と `--commit` が別途必要

## NSM実験

- running は EXP-006 (YouTube pilot)・EXP-007 (製造品出荷額の商品、判定日 12-16)・EXP-011 (KDP セレクト)。EXP-011 は月次計画の「今月やらないこと」と食い違っているので、月次計画の見直しで記述を直す。
- `/nsm-experiment propose` は実行していない。active が 2 件以上あり、11 月の打ち手は月次計画で決まっているので新しい候補を足さない。

## 批判的レビュー

> **技術的に楽しいだけでは？** Must 1 は計測の不具合の是正で収益に直結しないが、ガードレールの計測の鮮度が下がっており、GSC の除外理由は落ちた週の分を後から取れないので重点より先に入れた。Must 2 は 11 月のサイト重点の W47 の段そのもので、W48 の一括反映の範囲を決める。Must 3 は 🔴 の 1 番目で、2 週進まなかったので 1 週で届く段に切った。

> **先週と同じ失敗を繰り返していないか？** 計測の Must は W45・W46 と残った。完了条件が「取得全体が 1 回通る」で、取得のどこか 1 か所が落ちると未達になっていたので、今週は原因の 1 件 (`WEEKLY-COLLECT-NODE20-FAIL-01`) に絞り、計測のカードは土曜の確認へ降格した。
> 持ち越しが 6 件ある。Should・Could は落としてよい順に並べ、Must 2 は一覧と点検までで、本番反映を完了条件に入れていない。

> **今週でなければ意味がないことは？** Must 1 は 11-21 の取得より前に直さないと、W46 の分に続いて W47 の除外理由も取れない。`RELATED-ARTICLES-EFFECT-01` (11-17) と `MUNI-PAGE-SEO-01` (11-21) の判定日が今週に来る。
> 例外の扱い: Phase 0b の決まりでは backlog が目安を超えた週は削減を Must に入れるが、削減を受け持つカードが無く、Must を 3 件に保つため定常に置いた。

## 関連ドキュメント・施策

- 前週レビュー: `data/reviews/weekly/2026-W45.md` (W46 のレビューは 11-21)
- 11 月の重点: `.claude/todo/monthly.md`
- 計測サイクル: `data/measurement-cycle/latest.json` (W45、11-14)
- backlog: `WEEKLY-COLLECT-NODE20-FAIL-01` / `CONTENT-KAKEI-EXPANSION-01` / `KAKEI-MULTIAXIS-01` / `THEME-DASHBOARD-TEXT-TRIM-01` / `QUALITY-SUITE-WEEKLY-RED-01` / `KDP-LEDGER-AUTO-01` / `GSC-COVERAGE-TOTALS-DUP-ROW-01` / `UI-FIX-GEO-ANALYSIS-LAYER-20261114` / `UI-FIX-PREFECTURE-DETAIL-HOKKAIDO-20261114` / `ADSENSE-LATEST-PERIOD-01` / `CF-CPU-SURGE-01`
- 年間計画: `MEASUREMENT-MAC-DIRECT-01` / `GSC-SOURCE-FRESHNESS-01` / `CI-LEAD-TIME-01` / `MINIMUM-WAGE-2026-01` / `MUNI-CITY-PAGE-SNIPPET-01` / `MUNI-TITLE-MAGNITUDE-01` / `THEME-CPI-503-01` / `UI-FOLLOWUP-01`
- 改善施策: `ADSENSE-PLACEMENT-01` / `NOTE-FISCAL-PEER-SALES-01` / `RELATED-ARTICLES-EFFECT-01` / `MUNI-PAGE-SEO-01` / `MUNI-PREF-RANKING-OBS-01` / `CF-CPU-URL-01`
- 打ち手の台帳: `data/business/experiments.json` (EXP-006・EXP-007・EXP-011)

## 次週への申し送り候補

<!-- この週の review ドキュメントで追記される -->
