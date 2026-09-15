---
title: 今週の計画
type: weekly-plan
week: 2026-W38
date: 2026-09-14
updated: 2026-09-14
status: active
tags: []
---

# 2026-W38 今週の計画

期間: 2026-09-14（月）〜 2026-09-20（日）。9 月計画（W37〜W40）の 2 週目。
status と期限は各バックログを正典とし、ここには週内に検証できる成果だけを置く。

## 週

- **ISO Week**: 2026-W38
- **期間**: 2026-09-14 〜 2026-09-20
- **Sprint**: 2026-09 月次計画（W37〜W40）の Week 2/4

## 前週の申し送り

`.claude/skills/management/weekly-review/reference/reviews/2026-W37.md`「来週への申し送り」12 件のうち、
今週のタスクへ載せたのは 1・2・3・6・7・8 の 6 件である。載せなかった 6 件の扱いは次のとおり。

| 申し送り | 内容 | 今週の扱い |
|---|---|---|
| 4 | `DATA-MANUAL-RESTORE-01`（12 metric の ready/blocked 判定） | **積まない**。申し送り 4 自身が「Must 3 と同じ週に L を 2 つ積まない」と指示しており、`DATA-ESTAT-FETCH-01` が停止条件 2 週目なのでそちらを先に終端させる |
| 5 | Issue #957（Worker 1102）の調査経路 | **オーナー作業**。`cloudflare-observability` MCP の認証は `claude mcp` / `/mcp` が要る。今週の Could に「認証後に何を見るか」だけ置く |
| 9 | R2 +5.9GB / 3 日の内訳特定 | **積まない**。`STATE-R2-LIFECYCLE-01`（期日 09-28・オーナー作業）とセットで W39 に回す |
| 10 | note 回遊 errors 24（Issue #962） | **積まない**。owner は note-manager で、今週の収益・データ品質の 2 本と競合する |
| 11 | AdSense snapshot は「停止中は数値行 0」で確定 | Should 1 の中で `ADSENSE-PAUSE-01` の行に書き込む（独立タスクにしない） |
| 12 | 月曜に `weekly.md` が更新されていることを機械で確認する | **今週は実装しない**。批判的レビュー 2 で理由を書く |

## 今月の重点（月次計画より）

- **重点1**: 溜まった未デプロイを本番へ届けて、止まっている実測を再開する
- **重点2**: 公開しているものが正しいかを確定させる

月次の週配分では W38 は「デプロイ実行と代表ページ実測、before/after 境界の記録 / 12 metric の
ready-blocked 判定」を担当する。ただし**デプロイは W37 に 18 回実行済み**（develop→main PR 18 本）
なので、W37 レビュー申し送り 1 のとおり W38 のゴールを「実行」から**「境界の記録と after 窓の初回確認」**
へ置き換える。12 metric（`DATA-MANUAL-RESTORE-01`）は上表のとおり今週積まない。

## 前週の振り返り (W-1)

正典は `reference/reviews/2026-W37.md`。達成は **Must 1/3・Should 4/4・Could 0/2**。

| タスク | 分類 | 状態 | メモ |
|---|---|---|---|
| 2026-W36 の週次レビューを作成する | Must | 完了 | `b0d6d01f8` |
| アフィリエイト GA4 の 10 日 stale を解消する | Must | **未達** | 09-14 時点で 17 日 stale。今週 Must 1 へ再掲（原因は W37 と別のものが判明） |
| `DATA-ESTAT-FETCH-01` の 25 metric に処置区分を付ける | Must | **未達（0 件）** | 3 週連続 0 件。停止条件の 1 週目を消化。今週 Must 3 で 2 週目 |
| デプロイ可否を判断して記録する | Should | 完了（判断ではなく実行） | PR 18 本。境界の記録だけ残るので今週 Should 1 |
| `BLOG-PUBLISH-THUMBNAIL-GUARD-01` を直す | Should | 完了 | run `34113401278` |
| 公開対象 73 記事の背景画像を揃える | Should | 完了 | `content-release-2026-09-08.json`（PASS） |
| `data-refresh.yml` の失敗 run を切り分ける | Should | 完了 | `602b885aa` / Issue #931 close |
| ブログ品質是正を 1 本だけ通す | Could | **未達（4 週連続）** | done が 21 → 20 に減った。今週は「1 本通す」を積まず Should 3 で原因を切り分ける |
| search-growth の採択を 1 件だけ開始する | Could | **未達（3 週連続）** | 09-14 の却下 2 件は W38 の記録。今週 Could 1 |

**パターン分析**: W37 レビューが特定した形は「**計画と実行の断絶が 4 週続いている**」である。
W37 は計画の作り方を変えた週（Must を私が単独で完了まで持てる粒度に絞った）だったが結果は変わらず、
340 コミット・7,663 ファイルの作業はすべて Must / Should の外で起きた。レビューはこれを
「**計画側の工夫では解けない**」と結論している。今週の計画はこの結論を受け入れて書いており、
5 度目の粒度調整で解こうとはしない（批判的レビュー 2）。

## 現状サマリー

| 指標 | 現在値 | 前週 | 判断 |
|---|---:|---:|---|
| GSC clicks（確定7日 W37・09-04〜09-10） | 2,381 | 1,998 | +19.2%。4 週連続で上昇 |
| GSC impressions（確定7日 W37） | 73,763 | 61,829 | +19.3% |
| GSC 平均順位（確定7日 W37） | 6.85 | 7.45 | 観測開始以来の最良 |
| GSC 平均 CTR（確定7日 W37） | 3.23% | 3.23% | ±0.00pp。表示の伸びに CTR が付いていない |
| GSC clicks（ローリング28日 W37） | 7,503 | 6,053 | 機会発見用。WoW 判定には使わない |
| NSM エンゲージドセッション（GA4 Japan 確定7日） | 3,067 | 2,818 | +8.8%。汚染率 17.6%（W36 22.2%） |
| GA4 アフィリエイト実測の最新 | **2026-08-28** | 同左 | **17 日 stale**。Must 1 の対象 |
| ブログ公開総数（R2 `app/blog/all.json`） | 616 | 544 | 09-08 の 73 本リリース分 |
| ブログ outbox（`docs/21_ブログ記事原稿`） | 27 | 104 | リリースで消化 |
| ブログ是正キュー | pending 319 / must-fix 32 / **done 20** | pending 270 / done 21 | done が 2 週連続で減少（W36 −4・W37 −1） |
| ブログ新規キュー | pending 97 / done 81 / must-write 17 | — | 今月は新規公開を止めているので着手しない |
| 改善バックログ active | 35 行 | 31 行 | 4 行増。effect/pending 12 件は判定経路が止まっている |
| search-growth | 候補 1,276 / approved 1 / dismissed 3 | 1,060 / 1 / 1 | 却下 2 件は 09-14（W38）の記録 |
| GSC 運用サイクル（review-input・W37） | **WARN / FAIL 0** | WARN | WARN は `effect-target-ratchet` のみ（既知 7 件・新規 0）。W35 から 5 週持ち越し |
| `apps/web` 型チェック | **PASS（exit 0）** | — | 2026-09-14 実行 |
| Cloudflare `workers_errors`（09-12） | 123 | 09-11: 142 / 09-10 まで 0 | Issue #957・原因未確定 |
| R2 storage（09-12） | 32.18GB / 100,849 objects | 09-09: 26.31GB / 80,043 | 無料枠 10GB 超過が継続 |

**今週最も重要な 1 行**: 検索は 4 週連続で伸び、順位は 6.85 まで上がったのに、**その流入が収益に
変換されたかを言える経路は今も閉じている**。09-13 14:02 の本番反映で after 窓は開いたが、
それを読む GA4 アフィリエイト実測は 08-28 のまま 17 日止まっている。今週はこの経路を開ける。

## 今週の新しい発見（本日 2026-09-14 の実測）

1. **W37 Must 2 が未達だった理由は、W37 計画が書いた理由とは別である。** W37 計画は
   「workflow が state を artifact へ上げるだけで commit-back していない」を原因としたが、
   本日 `c8c15e202`（2026-09-14 12:14 JST）が **R2 push + 週次集約の commit-back を実装済み**である
   （`.github/workflows/affiliate-ga4-weekly.yml` 89〜122 行）。にもかかわらずデータは動いていない。
   実測した事実は次の 3 つ。
   - `c8c15e202` は **`origin/develop` にしかない**。`git show origin/main:.github/workflows/affiliate-ga4-weekly.yml`
     に `diff-push-r2` / `ga4-affiliate-history` は **0 件**で、main は旧版のままである。
   - GitHub Actions の `schedule` は**デフォルトブランチ（`main`）の workflow を実行する**。
     cron は `0 13 * * 0`＝**JST 日曜 22:00** なので、次回は **2026-09-20（今週の最終日）**。
     main が旧版のままだと、その run も artifact を上げるだけで終わる。
   - R2 `https://storage.stats47.jp/state/ads/ga4-affiliate/index.json` は **HTTP 404**。
     新経路はまだ一度も走っていない。`.claude/state/ads/ga4-affiliate-history.csv` は存在するが
     最終行は `2026-08-28,28,_all,_all,23771,11,0.000463` で、既存 snapshot からの遡り集計であり
     新しい観測は 1 行も入っていない。

2. **読むべき artifact は 09-06 の run ではなく 09-13 の run である。** `affiliate-ga4-weekly.yml` は
   09-06（34044001551）・09-07（34163125058）・09-12（34725598497）・09-13（34769766537）と
   4 回すべて success している。このうち **34769766537 は 2026-09-13T16:50Z（JST 09-14 01:50）で、
   `AFF-IMPRESSION-ROUTING-01` の本番反映（09-13 14:02:32 JST）より後**の唯一の取得である。
   W37 計画が指定した 09-06 の artifact は deploy 前なので、after 窓の初回確認には使えない。

3. **X の予約投稿 14 件が予定時刻を過ぎたまま `scheduled` で残っている。** 投稿台帳
   `.claude/state/sns/posts.json` の x/scheduled は 72 件で、うち 14 件は予定時刻が
   2026-09-07T10:10Z 以降すでに経過している。一方 `posted_at` の最新は **2026-09-05** である。
   これが「予約が発火していない」のか「発火したが台帳が更新されていない」のかは**本日の実測では
   判別できない**（`.claude/memory/feedback_x_post_url_integrity.md` のとおり、posted 判定は
   自アカウントの status URL と本文一致でしか行わない）。Could 2 で判別だけ行う。

## トレンド機会

Google News RSS（`都道府県+統計`・2026-09-14 取得）と はてな Hot Entry（social）を確認した。
はてなの上位 15 件に統計・地域・ランキング系の該当は **0 件**だった。

| トレンド | ソース | stats47 データ | アクション |
|---|---|---|---|
| 都道府県 転入率ランキング｜地方トップ3の10年史 | Google News（chihososei-journal） | `moving-in-excess-rate-japanese` / `japanese-movers-in` が実在 | Could 2 の X 素材候補。**新規記事は作らない**（月次で新規公開を止めている） |
| 2025年国勢調査でみる都道府県人口と「20代人口大移動の背景」 | Google News（ニッセイ基礎研） | `interprefecture-net-migration-age15to24` / `-age25to34` が実在 | 同上 |
| 都道府県「完全失業率」ランキング〈労働力調査 2025年〉 | Google News（ゴールドオンライン） | `unemployment-rate-man` ほか失業系 metric が実在 | 同上 |
| 所得格差が大きいほど乳児死亡率高く（JIHS） | Google News（media.shaho.co.jp） | `infant-mortality-rate-per-1000-births` / `infant-deaths` が実在 | **要調査**。相関テーマなので `topic-queue` の B 型フィルタと機序の吟味が要る。今週は着手しない |
| 永久歯の「喪失率」が高い都道府県 | Google News（PRESIDENT Online） | `dental-checkup-persons` 等はあるが「喪失率」該当は**未確認** | **要調査**。指標の実在確認が先 |

フルスキャン（`/discover-trends --source all`）は今週実行しない。新規記事を止めている月なので、
発見を増やしても消化先が無い。

## 前週からの持ち越し

W37 計画の未チェック `- [ ]` は 5 件。今週の扱いは次のとおり。

- [ ] **アフィリエイト GA4 の stale を解消する** — 元: W37 Must 2 → **今週 Must 1**（原因が別と判明したので手順を差し替え）
- [ ] **`DATA-ESTAT-FETCH-01` の処置区分** — 元: W37 Must 3 → **今週 Must 3**（25 件 → 5 件へ縮小・停止条件 2 週目）
- [ ] **デプロイ可否を判断して記録する** — 元: W37 Should 1 → W37 レビューが「完了（判断ではなく実行）」と判定。**タスクとしては持ち越さない**。残る「境界の記録」だけを今週 Should 1 に切り出す
- [ ] **ブログ品質是正を 1 本だけ通す** — 元: W37 Could 1 → **今週は積まない**。4 週連続未達で、かつ done が減り続けている。先に原因を切り分ける（今週 Should 3）
- [ ] **search-growth の採択を 1 件だけ開始する** — 元: W37 Could 2 → **今週 Could 1**（承認済み 1 件の baseline を作るか却下するかに限定）

持ち越しが 3 件以上あるので、批判的レビュー 2 で工数見積もりを検証した。

## 改善ログ pending (今週着手対象)

真実源は `.claude/todo/improvements.md`（active 35 行）。当週ビューとしてここに転載する。

| Tier | Metric | ID | Status | Due | Owner |
|---|---|---|---|---|---|
| 1 | affiliate | `AFF-IMPRESSION-ROUTING-01` | in-progress | 2026-09-27 | claude |
| 1 | adsense | `ADSENSE-PAUSE-01` | in-progress | **2026-09-14（本日）** | claude |
| 1 | gsc | `COVERAGE-LOOP-01` | effect/pending | **2026-09-14（本日）** | claude |
| 1 | data-quality | `DATA-ESTAT-FETCH-01` | pending | 2026-09-21 | claude |
| 2 | affiliate | `AFF-BLOG-TEXTLINK-01` | effect/pending | 2026-09-21 | claude |
| 2 | affiliate | `AFF-A8-REGISTER-01` | effect/pending | 2026-09-21 | claude |
| 2 | gsc | `SEARCH-GROWTH-CYCLE-01` | pending | 2026-09-21 | claude |
| 2 | cost | `TOKEN-AICONTENT-01` | pending | **2026-09-07（超過）** | ranking-content-author |
| 2 | ga4 | `FUNNEL-CTA-01` | effect/pending | **2026-09-09（超過）** | uruhayato373 |

`ADSENSE-PAUSE-01` と `COVERAGE-LOOP-01` は **Due が本日**、`TOKEN-AICONTENT-01`（09-07）と
`FUNNEL-CTA-01`（09-09）は **すでに超過**している（`npm run docs:check` の DG054 警告で検出。
2026-09-14 実行）。4 件とも判定に要る実測が揃っていない — AdSense は停止中で数値行 0、
カバレッジは次回 GSC export 待ち、`TOKEN-AICONTENT-01` は前提だった Gemini 日次が 08-30 の
クレジット枯渇で停止したまま、`FUNNEL-CTA-01` は GA4 カスタムディメンション未登録（オーナー作業）である。
Should 1 で 4 件とも Due を実態に合わせて動かす。**期日だけを機械的に延ばさない。**

## 今週のタスク

### Must（絶対達成、3 件）

- [ ] **GA4 アフィリエイト実測を読める状態にする**（重点1 ゴール2・M）
  - **今週やること 2 つ**。①（承認不要・私が完了まで持てる）run `34769766537` の artifact
    `affiliate-portfolio-state` を取得して `.claude/state/ads/` へ展開し、**09-13 の deploy 後**の
    vertical × position 別 imp / click が読めることを確認する。②（承認が要る）`c8c15e202` を
    main へ載せる PR を用意し、「**09-20 22:00 JST の scheduled run より前に main へ入らないと、
    その run も旧経路で終わる**」という根拠を添えてオーナーへ出す。
  - **成功基準**: ① 09-13 以降の日付を持つ vertical 別実測が `.claude/state/ads/` に存在し、
    `AFF-IMPRESSION-ROUTING-01` の T14d（09-27）で使う after 窓の初回値が記録されている。
    ② PR が出ており、マージの可否がオーナーの判断として記録されている（マージ自体は今週の成功基準に含めない）。
  - **停止条件**: **main へのマージ＝本番デプロイなので、私の判断では実行しない**
    （`branch-workflow.md`）。artifact が取れない場合も `fetch-affiliate-ga4.cjs` のローカル手動実行に
    切り替えず、workflow の再実行で取り直す。
  - **今週やらないこと**: 効果判定そのもの。T14d は 09-27（W39）である。

- [ ] **`AFF-IMPRESSION-ROUTING-01` の T48h 確認を 2026-09-15 に行う**（重点1 ゴール3・S）
  - improvements の行が「T48h の 2026-09-15 に計装・発火重複を確認」と指定している。
    **明日しか来ない日付**なので今週やらないと窓を 1 つ落とす。
  - 手順: Googlebot UA で本番の代表 3 ページ（`/ranking/natto-consumption-expenditure` ほか）を取得し、
    ① 配線した位置にバナーが 1 位置 1 件で出ているか、② 同一 slot が二重に描画されていないか、
    ③ 計装属性が本番 HTML に載っているかを数える。
  - **成功基準**: 3 ページの実測結果（取得コマンドつき）が improvement-log の 2026-09-13 節に
    追記され、重複の有無が数で書かれている。
  - **停止条件**: 重複が見つかっても**今週は配置を変えない**。変えると after 窓が交絡する
    （`guard: confounded`）。見つけた事実を記録して W39 の判断材料にする。

- [ ] **`DATA-ESTAT-FETCH-01` の 5 metric に処置区分を付ける**（重点2 ゴール1・M・停止条件 2 週目）
  - W37 レビュー課題 2 が立てた仮説と検証をそのまま実行する。
    **[仮説]** 3 週 0 件の原因は粒度ではなく割当（この施策を対象にしたセッションが 1 度も起動されていない）。
    **検証**: 今週 1 セッションを本施策専用に起動し、**25 件ではなく 5 件だけ**処置区分を付ける。
    **検証期日**: 2026-09-21（W38 レビュー）。
  - 各 metric を `config修正 / 代替統計へ置換 / 一時非公開 / blocker` のいずれかに決め、
    判断できないものは推測で埋めず `blocker` と理由を残す。
  - **成功基準**: 5 件に処置区分と根拠が付いている。**R2 write と公開は行わない。**
  - **停止条件**: 5 件付けば割当の問題として W39 に残り 20 件を同じやり方で進める。
    **1 件も付かなければ粒度か情報不足の問題**と判定し、Must から外して owner を
    `data-ingester` へ変える（月次の停止条件どおり、3 度目は同じ置き方をしない）。

### Should（できればやる、3 件）

- [ ] **before/after の境界を improvements の行に確定して書く**（W37 申し送り 1・S・owner: improvement-triage）
  - W37 のデプロイには**境界が 2 つある**。PR #940（2026-09-07 20:29 JST・回帰 2 件の修正を同梱）と
    PR #963（2026-09-13 14:02:32 JST・アフィリエイト配置）。`ADSENSE-PAUSE-01`（28 日）と
    `AFF-IMPRESSION-ROUTING-01`（14 日）がどちらを使うかが行に書かれていないと、判定日が動く。
  - 併せて W37 申し送り 11 を `ADSENSE-PAUSE-01` の行に反映する: **停止中の AdSense からは before が
    取れない**（snapshot は毎週走っているが数値行 0）ので、再開判断の材料は GA4 engagement /
    アフィリエイト CTR / CWV 側に限る、と明記する。
  - 併せて **Due 超過・本日 Due の 4 行**（`ADSENSE-PAUSE-01` / `COVERAGE-LOOP-01` / `TOKEN-AICONTENT-01` /
    `FUNNEL-CTA-01`）を、**判定に要る実測が何で、それがいつ揃うか**を書いた上で期日を動かす。
    `TOKEN-AICONTENT-01` は前提（課金無効 Gemini 日次への移行）が 08-30 のクレジット枯渇で崩れ、
    在庫は headless Claude CLI と決定的 backfill で消化済みなので、**期日を延ばすのではなく
    施策として成立しているかを決める**。`FUNNEL-CTA-01` は行自身が「Due は登録 +48h +4 週で再設定する」と
    書いており、登録はオーナー作業なので**未登録である事実を残したまま期日を外す**。
  - **成功基準**: 境界の 2 行に PR 番号と JST 時刻と判定日が入り、Due 超過 4 件が
    それぞれ理由つきで解消している（`npm run docs:check` の DG054 警告が減る）。

- [ ] **effect-verdict 7 件（16 週 pending）を終端する**（W37 申し送り 8・S・owner: improvement-triage / オーナー）
  - `.claude/state/effect-verdict/verdicts-2026-W37.json` の 7 件はすべて `insufficient-target` で、
    対象は 5〜6 月の BLOG-WAVE。**W35 から 5 週持ち越し**で、GSC 運用サイクルの唯一の WARN
    （`effect-target-ratchet`・既知 7 件）もこれである。
  - やることは判定ではなく**判断**: 7 件それぞれを「想定効果値を後付けして再計測する」か
    「想定値が無いまま終了する」かに振り分ける。**想定効果値を推測で補わない**
    （`.claude/rules/evidence-based-judgment.md` 状況 4）。
  - **成功基準**: 7 件すべてに振り分けが付き、`audit-operations-cycle` の WARN が
    「既知 7 件」から減るか、減らない理由が記録されている。

- [ ] **ブログ是正キューの done が減り続ける原因を切り分ける**（W37 申し送り 6・S・owner: blog-editor）
  - done は W36 −4（25→21）・W37 −1（21→20）で、**4 週連続で「1 本通す」が未達**である。
    数を積む前に、done が減る原因が「記事の変更」「監査基準の変更」「母集団の変更」のどれかを決める。
  - 併せて W37 レビューの仮説を検証する。**[仮説]** 総数 +48 の大半は 09-08 にリリースした 73 記事が
    監査対象に入ったもの。**検証コマンド**: queue の item slug と
    `.claude/state/metrics/content-release-2026-09-08.json` の `blog.pages[].slug` の積集合を数える。
    **検証期日**: 2026-09-21。
  - **成功基準**: done が減る原因が 3 択のどれかに決まり、積集合の件数が記録されている。
  - **今週やらないこと**: 是正そのもの（`/brushup-blog`）。原因が分かるまで 1 本も通さない。

### Could（余力あれば、2 件）

- [ ] **search-growth の承認済み 1 件を実装するか却下する**（W37 申し送り 7b・S・owner: gsc-analyst）
  - `soft-404-risk::/ranking/barber-beautician-annual-income` は 08-24 承認だが **baseline が null** で、
    `measure` を実行するたびに判定日が実行日から数え直される（09-14 実行では 14 日 = 09-28）。
    承認しただけで実装されていないので、判定日は永久に動く。
  - 薄さの content 実測 → 補強 or noindex/410 を実装して baseline を作るか、却下して候補から外す。
  - **停止条件**: 一括 title 書き換えはしない。採択上限は週 2 件のまま変えない。
  - 残り 5 件の `server-risk` は 09-13 の 503 と同じ証拠なので、09-14 以降の collect で 200 が続くかを
    見てから判断する（今週は判断しない）。

- [ ] **X の予約投稿 14 件が発火したかどうかだけを判別する**（S・owner: x-strategist）
  - 上記「新しい発見」3 のとおり、予定時刻を過ぎた `scheduled` が 14 件あり、`posted_at` の最新は 09-05 である。
  - **判別だけ行い、新規投稿も再予約もしない**。自アカウントの status URL と本文一致で
    posted を確認する（`.claude/memory/feedback_x_post_url_integrity.md`）。
  - **成功基準**: 14 件が「投稿済みで台帳未更新」「未発火」のどちらかに分類されている。
    前者なら `/mark-sns-posted` で台帳を直す。後者なら原因調査は W39 へカード化する。
  - **停止条件**: 月次の「SNS の新規展開はしない」に従い、投稿・素材制作は行わない。

## 今週やらないこと

- **ブログの新規記事生成・公開** — 月次で「公開待ちを出したらそれ以上作らない」と決めた。
  topic-queue の must-write 17 件にも着手しない。
- **ブログ品質是正の実行**（`/brushup-blog`）— 原因切り分け（Should 3）が先。
- **`DATA-MANUAL-RESTORE-01` の 12 metric** — W37 申し送り 4 のとおり、L を 2 つ同じ週に積まない。
- **AdSense の再開判断・枠追加・配置変更** — 停止 28 日の before/after が揃うまで動かさない。
- **アフィリエイト配置の変更** — after 窓が開いた直後なので、交絡させない（Must 2 の停止条件）。
- **Issue #957（Worker 1102）の対症的な変更** — 原因未確定で、調査に要る Workers invocation ログは
  `cloudflare-observability` MCP が未認証で取れない。**根拠なく timeout 延長・再試行追加・設定変更をしない。**
  認証はオーナー作業（`claude mcp` または `/mcp`）。
- **R2 容量削減の実作業** — `R2-STORAGE-01` はオーナー判断待ち。`STATE-R2-LIFECYCLE-01`（期日 09-28）も
  Cloudflare ダッシュボード操作でオーナー作業。
- **本番デプロイ・R2 write・CDN purge・外部投稿** — 必要になった時点でオーナー承認を得る。
  Must 1 の PR も、出すところまでが今週の範囲である。
- **`/discover-trends --source all` のフルスキャン**、**KDP・ココナラ・商品チャネルの新規展開**、
  **search-growth 候補の大量承認** — 月次の「今月やらないこと」に従う。

## 批判的レビュー

1. **技術的に楽しいだけの Must が入っていないか** — 入っていない。Must 1 と Must 2 はどちらも
   「収益がいくらか言えない」状態そのものを解く作業で、Must 3 は公開中の値の正しさである。
   リファクタ・自動化・新機能は 1 件も無い。ただし Must 1 の ① は artifact を展開するだけの
   地味な作業で、**これ単体では収益は 1 円も動かない**。動くのは「09-27 に判定できる」という
   選択肢を残すことである。それが目的だと明示した。

2. **先週と同じ失敗を繰り返していないか** — 繰り返している。Must 1 は 2 度目、Must 3 は 4 度目の掲載である。
   W37 レビューは「計画側の工夫では解けない」と結論しており、**今週は 5 度目の粒度調整をしない**。
   代わりに変えたのは次の 3 点で、いずれも計画の書き方ではなく**対象の実態**に基づく。
   - Must 1 は原因が変わった。W37 は「commit-back が無い」を原因としたが、実装は本日済んでおり、
     実際のブロッカーは「**その実装が main に無く、scheduled run は main を使う**」である。
     これは W37 時点では観測できなかった事実で、同じ作業の繰り返しではない。
   - Must 3 は 25 件 → 5 件にした上で、**結果がどちらでも週内で終端する**ようにした
     （5 件付けば割当の問題、0 件なら owner を変える）。3 週続いた「0 件のまま翌週へ」を構造的に止める。
   - Could にあって 4 週連続 0 件だった「ブログ是正 1 本」を**今週は載せない**。W37 レビューは
     「Could に置いた時点で実行されないことが確定している層」と書いており、同じ場所に 5 度目を
     置くのは無意味である。代わりに原因切り分けを Should に上げた。

   申し送り 12（月曜に `weekly.md` があるかを機械で検知する）を今週実装しない理由もここにある。
   **W37 の Must が倒れたのは計画が無かったからではなく、計画が実行の入力にならなかったからである。**
   計画の有無を検知する仕組みを足しても、その断絶は縮まらない。実装するなら「計画にある Must が
   週内に触られたか」を測る形でなければ意味がないが、その設計自体が 1 タスク分あるので W39 以降に回す。

3. **今週やらないと機会損失になるものは** — 2 つあり、どちらも Must に置いた。
   - **2026-09-15（明日）の T48h**。improvements の行が指定した日付で、過ぎたら計装・発火重複を
     「デプロイ直後の状態」として観測する機会は戻らない。
   - **2026-09-20 22:00 JST の scheduled run**。今週の最終日である。main が旧版のままだと
     その run も artifact だけで終わり、stale は 24 日になる。ただし**マージはオーナー承認が要る**ので、
     私が今週できるのは「承認を求められる形にする」ところまでである。ここは正直に書いておく。
   - 一方、W37 計画が機会損失として挙げた「09-06 artifact の retention 30 日」は、**今週の理由にならない**。
     deploy 後の取得である 09-13 の run のほうが after 窓には適切で、そちらの期限は 10 月中旬である。

4. **Must 3 件・Should 3 件は多すぎないか** — 私の実作業は Must 3（M・S・M）+ Should 3（すべて S）。
   W37 は Must 3 + Should 4 で Must 1/3 だった。今週は Should から L を排し、
   `DATA-MANUAL-RESTORE-01` を落として総量を下げた。**Must 3 が動かない週になったら Should には
   手を付けない**（W37 と同じ規律）。

5. **Must 1 がオーナー承認に依存していないか** — 半分している。だから ①（承認不要）と ②（承認が要る）に
   割り、**成功基準を ① 側に置いた**。W34・W35 で倒れた Must はどちらも「他者の作業か承認に依存するもの」
   だったので、承認待ちだけで週が終わる形にしない。

6. **Due が本日の 2 行をどう扱うか** — `ADSENSE-PAUSE-01` と `COVERAGE-LOOP-01` は本日 Due だが、
   どちらも判定に要る実測が揃っていない（AdSense は停止中で数値行 0、カバレッジは次回 GSC export 待ち）。
   Should 1 で**何が揃えば判定できるかを書いた上で**期日を動かす。09-07 の一括整理が Due 9/21 に
   22 件を集中させた件は、月次の批判的レビュー 5 のとおり W39 で再配置する。今週は触らない。

7. **トレンド機会を Must に上げなくてよいか** — よい。5 件のうち 3 件は既存 metric と一致するが、
   月次が「今月は新規記事を作らない」と決めており、記事化しないなら発見の価値は SNS 素材に留まる。
   相関テーマ（所得格差×乳児死亡率）は疑似相関の吟味が要るので、機序を説明できるか確認する前に
   採用しない（`.claude/skills/blog/plan-article-queue/SKILL.md` の B 型の扱い）。

## GSC 運用サイクル

`node .claude/scripts/gsc/audit-operations-cycle.mjs --stage review-input`（2026-09-14T10:22Z 実行・W37 対象）

- 全体 **WARN / FAIL 0 件**。8 チェック中 7 件 PASS。
- 唯一の WARN は `effect-target-ratchet` の**既知の過去欠落 7 件（新規欠落 0）**で、
  W35 から 5 週持ち越している。**今週の Should 2 がこれを終端させる対象**である。
- `url-inspection-freshness` は latest=2026-09-14・age=0d で日次が稼働している。
- `search-growth-freshness` は week=2026-W37・age=1d で PASS。ただし W37 レビューが記録したとおり、
  `search-growth-decision` はレビュー対象週に紐づけて判断を数えるため、JST の週境界とはずれる
  （09-14 09:13 JST の却下 2 件は W38 の作業である）。ゲートの PASS を「W37 中に判断した」と読み替えない。

## 完了条件

- チェックは**成果物・実測値・再現コマンドが揃った場合だけ**付ける。
- WIP は Must 3 件 + 着手中 Should 最大 2 件まで。新規着手時は 1 件閉じる。
- 未達を翌週へ自動加算しない。足りなければ月次の目標側を根拠付きで下げる。
- **作業ツリーを並行セッションと共有している。** 同じファイルを長時間開いたままにせず、
  まとまった単位で書き切る（`.claude/memory/feedback_shared_working_copy_git_race.md`）。
- 週の途中で計画外の大きな作業が入った場合、**この計画を書き換えて辻褄を合わせない**。
  W38 レビューが「計画と実行の断絶」を 5 週目として記録できるようにそのまま残す。

## 関連ドキュメント・施策

- 今月: [月間計画](monthly.md)
- 改善: [改善バックログ](improvements.md)（`AFF-IMPRESSION-ROUTING-01` / `ADSENSE-PAUSE-01` /
  `COVERAGE-LOOP-01` / `DATA-ESTAT-FETCH-01` / `DATA-MANUAL-RESTORE-01` / `AFF-BLOG-TEXTLINK-01` /
  `AFF-A8-REGISTER-01` / `AFF-RESOLUTION-EFFECT-01` / `SEARCH-GROWTH-CYCLE-01` / `R2-STORAGE-01` /
  `PERF-WORKER-P99-01`）
- 機能: [バックログ](backlog.md)（`STATE-R2-MIGRATION-01` / `STATE-R2-LIFECYCLE-01` /
  `PERF-RANKING-LCP-03` / `RSC-CACHE-BYPASS-01` / `GSC-COVERAGE-DEPLOY-01` /
  `REFERENCE-SOURCE-EXPANSION-01` / `KAKEI-MARKETING-CONTENT-01`）
- 前週レビュー: `.claude/skills/management/weekly-review/reference/reviews/2026-W37.md`
- NSM snapshot: `.claude/skills/management/nsm-experiment/reference/weekly-snapshots/2026-W37.json`
  （engagedSessions 3,067・GSC 確定 7 日 09-04〜09-10）
- GSC cycle audit: `.claude/state/metrics/gsc/operations-cycle-LATEST.md`
- search-growth: `.claude/state/search-growth/{health,candidates}.json`
- ブログ是正キュー: `.claude/state/blog/remediation-queue.json`（2026-09-14T00:35Z 生成）
- 事業計画 state: `.claude/state/business-plan/latest.json`（2026-09-14T00:03Z 生成）
- アフィリエイト詳細: `.claude/skills/analytics/affiliate-improvement/reference/improvement-log.md`
- 実験 state: `.claude/state/experiments.json`

## NSM 実験

`node .claude/scripts/lib/experiments-state.mjs active`（2026-09-14 実行）

- active は **EXP-006 のみ**（YouTube 通常動画マスター型パイロット・3 本 / 6 週間・running）。
  pending_user_actions 2 件（チャンネル所有権の確認 / Studio からの手動投稿）は**どちらもオーナー作業**で、
  W37 の YouTube 投稿は 0 件、判定母数が無い。
- `measure` 実行予定の実験は **0 件**（W37 snapshot に running の行が無い）。
- **今週は新規実験を提案しない。** 理由は 2 つ。① 4 週連続で計画の Must が実行されていない状態で
  実験を足すと WIP だけが増える。② いま最も価値のある学習は新規実験ではなく、
  `AFF-IMPRESSION-ROUTING-01` の after 窓（T48h = 09-15 / T14d = 09-27）を読めるようにすることで、
  これは Must 1・Must 2 が担っている。
- EXP-006 の継続 / 停止判断は **W39 に置く**。6 週のうち投稿 0 本という事実は揃っているが、
  オーナーの pending action が解けていないので、今週は「実験が止まっている」以上のことを言えない。

## 事業計画

`.claude/state/business-plan/latest.json`（2026-09-14T00:03Z 生成・W37 レビューで再生成）

- ソース鮮度: ga4 / note / ci は 2026-09-14（fresh）、products 2026-09-07、
  **affiliate 2026-08-31（14 日）**、**x 2026-07-27（7 週）**。未計測を 0 に変換しない。
- `nextActions` は `bp-foundation` / `geo-pilot-1` の 2 件で **3 週連続変化なし**。今週も着手しない
  （収益の計測経路を開けるほうが先）。
- **Go / Pivot / Stop**: 検索 KPI が 4 週連続上昇（確定 7 日 +19.2%・順位 6.85）なので **Go を継続**。
  収益側は AdSense 停止中・アフィリエイト実測 17 日 stale で、**W36・W37 と同じく判断材料が無い**。
  今週の Must 1 と Must 2 が揃えば、W39（T14d = 09-27 の前週）に初めて収益側の材料が出る。

## 次週への申し送り候補

<!-- この週の review ドキュメントで追記される -->
