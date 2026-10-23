---
title: バックログ (タスクマスタ)
type: backlog
status: active
updated: 2026-10-19
---

# バックログ (タスクマスタ)

> **役割**: 優先度・時期を問わず「未完了タスクの全量」を保持するマスタ。カード構文・タグ語彙の
> 正典は `.claude/rules/todo-standards.md` (doboku-note と統一の v3-unified スキーマ)。
> **完了したカードはセクションごと削除する** (記録は git 履歴。完了サマリを本ファイルに書かない)。
> stats47 では backlog-loop (CI 日次) が処理するため **ID (`### [ID] タイトル`) を必ず付ける**。
> 行削除は gate 証拠が ledger に要る (`.claude/rules/backlog-loop.md`)。

各カードは `### [ID] タスク名` の直下に `タグ:` 行を置く (機械読取り):

```
タグ: [カテゴリ] [種類:X] [実行:X] [検証:cmd] [起票:YYYY-MM-DD] [期日:YYYY-MM-DD] [進行中]
```

## 🔴 高 — 今月中に着手したい

並び順が着手順 (2026-09-27 オーナー判断: 計測・記録・改善とデータ品質を優先する。2026-10-05 の月次計画で 10 月の重点「管理」「データ」に合わせて付け替え)。上限 10 枚 (DG081)。

### [DATA-QUALITY-LOOP-01] 全指標のデータ品質を機械チェックし、「誤り・古さ・終了・薄さ」の 4 基準で継続的に直すループを作る
タグ: [コンテンツ品質] [種類:改善] [実行:対話] [起票:2026-09-25] [領域:データ]

- **経緯 (2026-09-25 実測)**: `improvements.md` の `DATA-ESTAT-FETCH-01` (25) / `DATA-MANUAL-RESTORE-01` (12) の 37 metric は、
  今日時点で全件 R2 に 47 都道府県分の値があり欠損 0・本番 200 (R2 は 2026-09-05 再生成)。「取得失敗で空ページ」という前提は解消済み。
  残る問題は古さと表記の誤りで、例: `national-pension-full-exemption-rate` は最新 2006 年 (2 年分) なのに GSC 28 日 172 表示 / 17 クリック、
  `elderly-single-person-households` は最新 2005 年。→ improvement-triage が上記 2 行を理由付きで終了し、このカードへ引き継ぐ。
- **判断基準 (上から最初に当てはまる処置)**:
  1. 値・単位・年表記が誤っている → すぐ直す (`DATA-VALUE-ERRORS-01`)
  2. 公式にもっと新しい年が公表されている → 更新する。GSC 表示の多い順
  3. 調査が終了し新しい年が無い → 公開を続け、ページに「○年で調査終了」を明示する。後継統計があれば差し替える
  4. 観測 1〜2 年かつ需要ほぼ 0 → noindex 候補 (`RANK-THIN-01` と同じ基準で判断)
  - 「古い」の目安は「最新年が公式の最新公表から公表周期 1 回分以上遅れている」。需要は順番を決めるためだけに使う (4 を除く)。
- **既存の仕組みと穴**: 週次の `ranking-integrity-audit-weekly` / `provenance-audit-weekly` / `estat-year-coverage-audit-weekly` と
  `/audit-units` がある。穴は 3 つ。(a) 年カバレッジ監査は**単年設定の 582 件だけ**が対象で、`years: "all"` なのに元の統計が
  古い年で止まっている metric を見ない。(b) 年・年度の表記の誤りを見る検査が無い。(c) 年カバレッジ監査の要拡張候補
  (2026-09-19 時点 87 件、`data/estat/year-coverage/queue.json`) を処理するカードが無く、見つけても直されていない。
- **次**: ① 既存の週次監査に「最新年と今日の差」「時点統計の年度表記」を足す (新しい監査を作らず既存に統合する)。
  ② 検出結果を 1 つのキューにまとめ、基準 1〜4 の処置を付ける。③ 週 5 指標ずつ、需要の多い順に処置する (`STRATEGY-FOCUS-2026-10-01` の
  「週次 Must は各レーン 1 件」の枠で回す)。④ 年カバレッジ監査の要拡張候補 87 件は 2026-09-26 から `YEAR-COV-*` カードとして 10 件ずつ自動起票される (`CYCLE-HEALTH-01` ②)。
- **2026-09-27 進捗 (①② 済)**: 週次の `ranking-integrity-audit-weekly` が全 active metric の配信年を出し、
  `packages/ranking/src/scripts/build-data-quality-queue.ts` が 1 つのキュー (`data/data-quality/checks/{queue.json,LATEST.md}`) に
  処置 1〜4 と需要を付けて積む (週次レビューの入力に追加済み)。年表記の誤り 130 件のうち確認済み調査だけが原典の 128 件を同日暦年に直し、
  再生成後の誤りは 0。残りは ③ 週 5 指標ずつの処置 (2 更新 1,072 / 3 調査終了候補 126 / 4 noindex 候補 189。2〜4 は配信年からの推定なので
  処置前に公式の最新公表を確認する) と、4 週連続の減少の観測。年表記「判定不能」2,257 件は公式表記を確認した調査を
  `CALENDAR_CONFIRMED_SOURCES` に足すたびに減る。
- **2026-09-28 ③ 第1週 (W40 Must 1・需要上位 5 指標)**: 公式の範囲は統計局の SSDS 掲載年次一覧
  (`https://www.stat.go.jp/data/ssds/zuhyou/kiso_ken.xlsx` / `shihyou_ken.xlsx`、2026-02 更新分) で確認。
  - `avg-height-high-school-2nd-male` / `annual-sunshine-duration` / `local-allocation-tax-prefecture`: 最新年は公式と一致、
    過去の年が欠けていた (それぞれ 2023 のみ / 2024 のみ / 2016〜2021 欠落)。years を広げた (`401f4c0ab`)。
    data-refresh の dryRun (run 36363769924) は ok=4・empty=0。オーナー承認のうえ run 36364277938 で R2 反映済み (公開 URL で 47 年 / 50 年 / 48 年・全年 47 県を確認)。
    教員の年収は `DATA-WAGE-TABLE-YEARS-01` へ切り出した。
  - `voluntary-car-insurance-rate-vehicle`: 配信 1975〜2023 = SSDS の収録上限。「1 周期遅れ」は推定の誤検出で処置なし。
  - `school-teacher-annual-income`: 表 `0003445758` は「令和２年以降」の複数年 DB (e-Stat カタログ) なのに、同じ表を使う 40 指標が
    すべて 2022 年だけを配信。原因未確定 ([仮説] `cdTab` 08/12 の組み合わせが年で変わる)。dryRun は年別の件数を出さないため、
    CI で年別の non-null を観測する必要がある (e-Stat の取得は CI 専用)。
- **完了条件**: 週次の監査が全指標の古さ・表記を検出してキューへ積み、キューの処置状況が管理画面か週次レビューで見え、
  4 週続けて「新規検出 ≤ 処置件数」で残件が減っている。
- **2026-10-05 ③ 第2週 (需要順 3〜5 位に当たる 5 指標・W41 Must 1)**: 公式の範囲は SSDS 掲載年次一覧 (`kiso_ken.xlsx` / `shihyou_ken.xlsx`、2026-06-30 更新分) で確認した。`average-height-primary-school-fifth-grade-male` は years を 2023 のみから 1975〜2023 (1977・1978 は取得不可で除く) に、`national-treasury-disbursement-prefecture` は 2008〜2021 の穴を埋めて 1975〜2022 に広げた。`validate:config` と `validate:years` は exit 0。data-refresh の dryRun は CI で合格した ([run 37315946937](https://github.com/uruhayato373/stats47/actions/runs/37315946937): ok=2・fail=0・empty=0・shape=0)。R2 反映はオーナー承認後に `data/data-refresh-requests.json` を dryRun: false で push する。`fishery-workers` (漁業センサス 5 年周期・2023 が最新) と `treatment-rate-hypertension-outpatient` (患者調査 3 年周期・2023 が最新。公式サイトでの最新公表の照会は未実施) は誤検出で処置なし。`food-self-sufficiency-rate-calorie` は農水省が令和 6 年度 (概算) まで公表済みだが SSDS は 2021 年度止まりなので、取得元の切り替えを `DATA-FOOD-SELF-SUFFICIENCY-MAFF-01` へ切り出した。

- **2026-10-19 ③ W43 Must 1 ① (W41 の残り 1 指標)**: `treatment-rate-hypertension-outpatient` は厚生労働省の患者調査ページ (`https://www.mhlw.go.jp/toukei/list/10-20.html`、2026-10-19 取得) に「令和５年患者調査の結果は令和６年12月20日に公表しました」とあり、令和８年調査は実施中で未公表。配信の最新年 2023 は公式の最新公表と一致するので、キューの「1 周期遅れ」は推定周期 1 年による誤検出で処置なし (患者調査は 3 年周期)。過去年 (令和２年以前) は別の統計表なので、years の拡張はこのキューの処置とは分けて扱う。
- **2026-10-19 ③ W43 Must 1 ② (データ品質ゲート 99.1% の 21 件)**: 監査の `recipe.unbaked` 21 件 (`data/ranking/integrity-audit.json`、10-17) は**すべて手動投入** (`kind:"external"`・`fetcherKey:"manual"`) で、data-refresh の再取得 (page-data-batch は external を skip) では焼き直せない。計画の「dryRun で再生成」は前提が誤っていた。
  - 値を変えずに recipe だけを足す既存の移行 (`packages/stats-r2/src/scripts/lib/legacy-recipe-migration.ts` の `migrateLegacyRecipe`) は、公開 R2 の 21 件すべてで `migrated` になる (10-19 に読み取りだけで確認。行の形の不正なし)。対象リスト `LEGACY_RECIPE_ROW_HASHES` は 2026-08-27 に見直した 31 件で、この 21 件は入っていない。
  - **未解決**: 21 件の `meta.generatedAt` はすべて 2026-10-08 (recipe 導入 07-30 の後) なのに recipe が無い。10-08 に手動投入の値を recipe なしで書いた経路があり、それを直さないとリストに足しても再発する。config の最終更新はすべて `212d2611d` (10-09、定義の置き場の一括移動) で、git の日付ではクエリが変わったか判定できない。
  - **次 (オーナー判断)**: (a) 10-08 の書き手を特定して recipe を焼くように直し、手動投入の 21 件を再投入する、または (b) 21 件の config と値の対応を確かめたうえで `LEGACY_RECIPE_ROW_HASHES` に 21 件の行ハッシュを足し、`migrateLegacyRecipes` で一回だけ移す。どちらも R2 への書き込みはオーナー承認が要る。監査は残数が増えたときだけ失敗するので、待っても新たな失敗は出ない。
  - **2026-10-19 オーナー判断 (a) と実施**: 書き手は `.claude/scripts/data/lib/stats-values-writer.mjs` の `writeStatsValues` (手動投入 10 本の共通部品) で、recipe を焼いていなかった。正典 `buildRecipe` を `print-metric-recipe.ts` 経由で呼んで `meta.recipe` を必ず焼くように直し、自前で書く 3 本 (`fetch-chutairen-club-membership` / `fetch-japanese-instruction-students` / `fetch-pachinko-shop-density`) も同じ関数を使うようにした。テスト `.claude/scripts/data/__tests__/stats-values-writer.test.mjs` (recipe を外すと失敗することを確認済み)。
  - **2026-10-19 夜 21 件の再投入 (Mac・オーナー指示)**: 20 件は下記 10 本の fetch で作り直し (`fetch-census-sex-ratio-20-39` は入力の人口ピラミッド 8 系列を公開 R2 から `.local/r2` へ取得してから実行)、公開中の行と areaCode・年・値・順位が全行一致し、違いは `meta.recipe` の追加だけであることを確かめてから key ごとに diff-push-r2 (エラー 0)。`low-elevation-population-ratio-5m` は書き手の `packages/gis/src/geo-analysis/low-elevation-population-overlay.py` が `meta` に recipe を書かない (作り直しても未焼きに戻る) ため、公開中の値のまま正典の recipe (`resolveMetricRecipe`) だけを足して反映した。反映後に公開 URL で 21 件すべて recipe 付き・値不変を確認し、ローカルの `audit-ranking-data-integrity.ts` で `recipe.unbaked` 0 件 (全 2,460 指標)。**残り**: 次の週次 `ranking-integrity-audit` でゲート 100% を確かめる。Python の書き手が recipe を焼くように直す (直さないと、次に作り直したときに 1 件が未焼きに戻る)。ただし書き手のソースを変えると、manifest の `definitionSha256` (書き手のソースの SHA) が合わなくなり、`npm run geo:audit-low-elevation` が「再生成が必要」で止まる (`audit-geo-analysis-artifacts.ts:470`)。このため単独では直さず、次に低標高の Geo を再生成するとき (G04-a の ZIP 176 件と 1km メッシュ人口が要る) に同じ作業で直す。直し方は、JS の共通部品と同じく `node --import tsx .claude/scripts/data/lib/print-metric-recipe.ts low-elevation-population-ratio-5m` の出力を `meta.recipe` に入れ、`audit` で recipe の有無も検査する。
  - **(以下は再投入前の記録) 残り (別環境)**: 21 件の再投入。Windows PC には R2 の書き込み資格情報が無く、手動投入の fetch を動かす CI も無いので、資格情報のある端末で各 fetch スクリプト (`fetch-nta-alcohol-per-adult` / `fetch-nhns-2024-prefecture` / `fetch-national-assessment-questionnaire` / `fetch-cancer-asr75-breast` / `fetch-financial-literacy-correct-rate` / `fetch-heatstroke-deaths-mhlw` / `fetch-zen-koutairen-rugby` / `fetch-sports-facility-athletics-stadium` / `fetch-opendata-adoption-rate` / `fetch-census-sex-ratio-20-39`) を実行し、公開中の行と値が一致する (または差が説明できる) ことを確かめてから key ごとに diff-push-r2 する。`low-elevation-population-ratio-5m` は Geo の書き手が別なので、その書き手も recipe を焼くかを先に確かめる。完了条件: 次の週次の `ranking-integrity-audit` で `recipe.unbaked` が 0、データ品質ゲートが 100%。
  - W41 に years を広げた 2 指標 (`average-height-primary-school-fifth-grade-male`・`national-treasury-disbursement-prefecture`) は dryRun 合格済み (run 37315946937) で、R2 は未反映 (10-19 の公開 values は小 5 男子身長が 2023 の 1 年だけ)。2026-10-19 にオーナー承認のうえ data-refresh run 39192011125 (success) で反映した。公開 values は小 5 男子身長が 1975〜2023 の 47 年分、国庫支出金が 1975〜2022 の 48 年分で、どちらも recipe 付き。

- **2026-10-19 ③ W43 Could 1 (需要順の次の 2 指標)**: `designated-difficult-disease` (GSC 表示 892) は衛生行政報告例の 1 年度 1 表の作りで、設定は 2020 年度の表 `0004026904` だけを指していた。e-Stat の getStatsList (調査コード 00450027、全 585 表) では都道府県別の最新は 2021 年度の `0004048079` (2026-03-25 公開) で、2022 年度以降の表はまだ無い。**処置: 基準 2 (更新)**。設定を `0004048079`・2021 年度へ切り替えた (cat01=100 総数・地域軸 68 は同じ。年度ごとの表を 1 指標でつなぐ仕組みは無いので 2020 年度は配信から外れる)。`metrics:build-index`・`metrics:check`・`validate:config`・`validate:years` は通過。data-refresh の dryRun は合格 (run 39205519663: ok=1・47 都道府県・shape=0)。2026-10-19 にオーナー承認のうえ data-refresh run 39206759769 (success・ok=1) で R2 へ反映した。公開 `app/stats/designated-difficult-disease/values.json` は 2021 年度・47 県・recipe 付き、配信用 `app/ranking/.../values.json` も 2021 年度 47 県、item の latestYear は 2021 年度、本番ページは Googlebot UA で 200。`physical-disability-certificates-issued` (825) は SSDS `J1200` の収録範囲 1975〜2023 (kiso_ken.xlsx 2026-06-30 更新分) と公開値 49 年分が一致し、**処置なし (推定周期による誤検出)**。原典の福祉行政報告例に 2024 年度分が出ているかは未確認 (出ていれば `DATA-FOOD-SELF-SUFFICIENCY-MAFF-01` と同じく取得元の切り替え候補)。
- **2026-10-21 ③ 需要順の次の 5 指標 (データの更新は 0 件)**: キュー (`data/data-quality/checks/queue.json`、10-17) の「2 更新」から処置済みの 10 指標を除いた次の 5 指標。e-Stat の項目ごとの実在年は実在年の台帳 (`data/estat/availability/`、CI が 2026-10-07 に取得) で、公式の最新は各省の公表ページ (2026-10-21 取得) で確かめた。この PC には e-Stat API の資格情報が無いので、表の有無は e-Stat の公開ページで確かめた。
  - `psychiatric-bed-count` (752): 基準 2 に当たるが今は更新できない。原典の医療施設（動態）調査は令和7年の概況を 2026-09-29 に公表済みだが、取得元の SSDS は医療施設調査の 6 項目すべてで 2023 年止まり。原典の 2024 年の表の分類をこの PC から確かめられないので、6 指標まとめて `DATA-MEDICAL-FACILITY-SOURCE-01` へ切り出した。
  - `flood-affected-rivers` (741): 年カバレッジ監査の要拡張 (設定 5 年 → 実在 9 年) は、足りない 4 年が 44〜46 県しか値の無い年で、47 県そろう年だけを入れる今の作りでは足さない (処置なし)。e-Stat のデータベースは 2014 年まで、公式は令和5年まで公表済みなので、9 指標まとめて `DATA-FLOOD-STATS-FILES-01` へ切り出した。
  - `fishery-species-catch-mackerel` (685)・`fishery-species-catch-pacific-saury` (595): 令和6年の確報は 2026-02-27 に Excel ファイルだけで公表され、e-Stat のデータベースの表はまだ無い (2024 年は 0 件。2023 年は 99 表)。今の取得の仕組みでは足せないので、12 魚種まとめて `FISHERY-2024-DB-01` (再開条件付き) へ。
  - `road-expressway-length` (583): 基準 2 に当たるが今は更新できない。道路統計年報の最新は 2025 年版 (令和6年3月31日時点、`https://www.mlit.go.jp/road/ir/ir-data/tokei-nen/index.html`)。統計局の項目一覧 (`kiso_ken.xlsx`、2026-06-30 更新、SHA-256 `febebbc7…0358`。オーナーの許可を得て 2026-10-21 に取得) は資料源と対象年度 (2005〜2023) だけで時点の定義を持たないので、開通日の分かる区間で決めた。新東名の伊勢原大山 IC〜新秦野 IC (約 13 km、2022-04-16 開通、NEXCO中日本 `news_release/5365`) は神奈川県の「2023 年度」に +12.8 km、中部横断道の南部 IC〜下部温泉早川 IC (約 13.2 km、2021-08-29 開通、同 `news_release/5181`) は山梨県の「2022 年度」に +12.2 km として現れる。どちらも開通の翌年度の値に入るので、配信の「2023 年度」は 2023 年 3 月 31 日時点 (道路統計年報 2024 年版) で、公式の最新より 1 年古い。同じ道路統計年報の 10 指標がすべて 2023 年度で止まっているので、`DATA-ROAD-LENGTH-SOURCE-01` へ切り出した (年の表記の誤読の問題も同じカードに書いた)。
  - 指標の設定と R2 は変えていないので、dryRun と R2 反映は無い。
### [AUTH-CREDENTIAL-REGISTER-01] 残りの資格情報 (Mac 全サービス・ココナラ) を登録する
タグ: [インフラ・計測] [種類:改善] [実行:ユーザー] [起票:2026-10-01] [領域:管理]

- **経緯**: 2026-10-01 に資格情報の正本 `.claude/config/auth-credentials.json` (9 サービス) と管理画面 `/ops/auth` を作り、note・ココナラ・KDP は CI でセッション切れを入り直す。同日 Windows PC と CI に 8 サービスを登録済み (A8・もしも・afb・楽天・note・KDP・X・Google。ID と登録先は `/ops/auth` で確認)。
- **2026-10-01 済**: ログイン ID を正本の `loginId` に記録 (9 サービス・オーナー判断で公開リポジトリに記載。`/ops/auth` が表示し、ストアの ID と違えば「ID 不一致」)。Mac に全 9 サービスを登録、ココナラの CI Secrets を登録。Mac の `refresh-session.mjs --headed` で note はキーチェーンの ID/PW で自動ログイン成功、A8・もしも・ココナラは既存セッションで ok (パスワード経路は未検証)。
- **残り (オーナーのみ・パスワードは対話入力)**:
  1. **Windows のココナラ**: `cmdkey /generic:stats47-measurement-coconala /user:stats47jp@gmail.com /pass` (コマンドは Windows の `/ops/auth` にも出る)
  2. **パスワード経路の実証 (セッションが切れたとき)**: 2026-10-01 に A8・もしも・楽天の有効セッションを Mac から CI へ渡した (Secrets 更新済み)。楽天は送信を Enter に、送信後の着地がログイン済みでなければ checkUrl を開き直して判定するよう直した (ログインできているのに login_failed と判定された)。ココナラは 2026-10-02 に自動ログインの対象から外した (自動操作のブラウザは見えない reCAPTCHA に「認証できませんでした」で拒否され、普通の Chrome では同じ ID/PW で入れた。セッション切れは普通の Chrome で専用プロファイルにログインし `bootstrap-session.mjs coconala --from-profile --publish`)。A8・もしも・楽天のパスワードでの自動ログインは未実証で、セッション切れ時に `refresh-session.mjs <source> --headed` で確かめる。KDP は `.local/authenticated-measurement/kdp.autologin-failed` で停止中で、本棚は有効だが Reports 認証で止まる。CI の入り直しが本棚しか見ず `session_valid` を返し、2026-09-30 の拒否世代の停止が解けなかった。**2026-10-06**: CI の入り直しを本棚が有効でも Reports まで開き、求められたら Secrets で 1 回だけ入り直す形にし、結果コードを `latest.json` の `relogin` に残す (`refresh-session.mjs` の `ciRelogin`・`summarize.mjs`)。次回の CI で kdp の `relogin` が `relogged` なら収集再開、`human_required` / `login_failed` なら Reports の CI 入り直しは不可と判定して人の再認証か Mac 側収集を検討する
- **完了条件**: Mac と Windows の両方で `/ops/auth` の「この PC」が全行「済」、CI 欄が「済」か「保管」。その後の authenticated-measurement で note・ココナラ・KDP の状態ファイルの `relogin` が `session_valid` か `relogged` になる (CI での再ログインは未実証)。
- **2026-10-19 ココナラ撤退**: ココナラは認証付き計測の対象から外し (`sources.mjs`・CI の取得対象・`.claude/config/auth-credentials.json`)、Windows のココナラ資格情報の登録 (上の 1.) は不要になった。GitHub Secrets の `MEASUREMENT_SESSION_COCONALA` と Mac のキーチェーンの `stats47-measurement-coconala` は残っているので、消すかはオーナーが決める。
- **2026-10-19 21:05 JST の観測**: authenticated-measurement run 39249001110 (develop への push で発火) で、もしもと KDP の取得が `auth_required` で失敗した。KDP は同日 17:31 の run 39223337479 でも同じ理由で失敗しており、CI の入り直しは `login_failed`。もしもは今回が初めて。**次 (オーナーのみ)**: もしもと KDP のセッションを入れ直す (`refresh-session.mjs <source> --headed`。結果は次の定期実行の `data/authenticated/latest.json` で確かめる)。

### [AUTHENTICATED-MEASUREMENT-ACTIVATION-01] 認証付きCIの日次継続運用を実証する

タグ: [インフラ・計測] [種類:改善] [実行:ユーザー] [検証:npm run measurement:status -- --check] [起票:2026-09-21] [領域:管理]

- **2026-10-20 統合 (行削除は backlog-loop)**: 計測を週次の Mac の取得へ一本化したので、このカードの目的 (認証付き CI の日次運用の実証) は無くなった。残る事実と手順は `MEASUREMENT-MAC-DIRECT-01` に移した。以下は経緯。

- **2026-10-18 状態 (#1144)**: 10-17 08:32 の手動 run `39017739552` で KDP が認証切れ (`bootstrap-session.mjs kdp --login --reports --publish` で本人の再認証が要る)、note が `report_incomplete`。他の 6 取得元は pass。10-17 12:58 の run は success。

- **2026-09-30 進捗 (商品の実売を配線)**: 9/28・9/29 の Mac 自動更新が A8・KDP で `no_credential` になっていた原因は、キーチェーンのアカウント名の先頭の全角スペース (A8・KDP) と KDP のパスワード空。オーナーの再登録待ち。
  併せて、ココナラ売上管理の累積売上・KDP 日別ロイヤリティ見積り・note 売上 API を毎日の収集に載せ、`revenue-history.json` 経由で週次収益 (NSM) と有料購入 KPI へ配線した (`metrics/lib/product-revenue.mjs`)。KDP の見積りは停止条件どおり合計に入れない。
  note の売上 API はパスワード再確認 (約 30 分) が要るので、Mac の `refresh-session.mjs note` がキーチェーン `stats47-measurement-note` で通してから収集を起動する (登録待ち)。

- **2026-09-27 進捗 (もしも・KDP は自動化で解消)**: 手動収集 run `36312413051` で A8・もしも・KDP・afb・GSC・ココナラの 6 取得元が pass、残りは note (`report_incomplete`) だけ。
  もしもはセッションが数時間で切れ、定期実行が 4〜5 時間遅れて動くのが原因だった → Mac の `measurement-session-refresh.sh` がログイン直後に収集を起動し、定期実行はその日収集済みなら gate で省略する。
  KDP はキーチェーン自動ログイン (オーナー承認) を追加し、本棚の検索が 1 ページ目以外を見つけられない不具合 (publication_status_incomplete) をページ送りで直した。**残り: note の取得不完全**と、定期実行の gate が main 反映後に効くことの確認。

- **2026-09-27 オーナー判断 (note は問い合わせない)**: note の「短い集計期間だけ 1 記事が一覧に出ない」欠けは、記事の欠落 1 件だけ・全ページ読了・合計一致の
  条件を満たすときに限り既知の欠けとして pass にする (`note-inventory.mjs` の `acceptedNoteGap`、値は null のまま・要約に表示)。これで残りは
  **本人の再認証を挟まない別日の main schedule で 2 回続けて全取得元が pass** になることの観測だけ (最短 2026-09-28・09-29 の 22:45 頃の定期実行)。
  確認: `gh run list --workflow authenticated-measurement.yml --event schedule -L 2`。

- **owner**: オーナー（初期/期限切れ認証）/ devops-runner（CI検証・release・鮮度監視）
- **配信後検証**: 独立post-deploy smoke `35602527517`（main `f199eb2e0`）もhealth / Playwright / cache warmingを含め成功。本番 `/`・`/geo`・`/ranking`・`/themes/population-dynamics` のHTTP 200を別途確認。これは配信の検証であり、下記の認証付き収集・定期起動の未完了を解消しない。
- **保護機構の本番反映（2026-09-21）**: PR #1005は24 checks PASSで21:45 JSTにmain `f199eb2e0`へmerge。Deploy `35601436791`は本番配信・route smoke・sitemap検査まで成功し、main→developを同期済み。手動のhealth `35601845511`では認証待ち3sourceとnote欠測を正しく表示し、Issue #763を更新。補完判定は6時間猶予前のため`dispatch:false / schedule_not_overdue`（実POSTは未検証）。実scheduleは引き続き0件で、手動healthやpushの成功を定期起動実績に数えない。別系統のcron異常5件（Gemini HTTP402、backlog削除ledger gate、OGP原稿404/metadata、出典URL timeout、note回遊不整合）は横断監視Issue #763に残存し、監視自身を含む6件の異常を無視して全体正常とはしない。
- **最新の継続運用検証（2026-09-21 21:34 JST）**: run `35599663715`（push、実装`0a0a20f53`）はafb/GSC/ココナラPASS、A8/もしもは新たに`auth_required`、KDPは`collectionAttempted:false`で同じ拒否済み世代への再接続をせず待機。noteは285/286件・合計/終端一致・`inventoryAvailable:true`だが全件は`report_incomplete`のまま。record stepとgit書戻しは成功（`a303fb0a8`）、警告stepは意図どおり失敗しIssue #1000をOPENで更新。全7sourceのgit/private R2成否・時刻・新フラグ・証跡SHAが一致。note棚卸し復元は286行/欠測1/null/全行baseline不可/mode0600を確認し、通常復元はexit1を維持した。関連106 Node+6 Pythonテスト、全25workspace+8script型検査、19プリフライトとdevelop品質CI `35599663735`はPASS。
- **継続運用の保護契約**: schedule予定+6時間の未発火検知、既存healthから予定枠のSHA比較予約を伴う最大1回の補完起動、拒否済み本人認証世代の再接続停止、note棚卸し専用復元を実装。保護機構はmainへ反映済みだが、A8/もしも/KDPの継続認証、実schedule/補完起動の翌日継続、全collector成功は未完了。GitHub基盤全体の停止は同基盤の監視では検知保証できない。本人再認証を例外として許容する運用目標は2026-09-21にオーナー承認済み（恒久契約は[Playwright認証プロファイル](../../docs/01_技術設計/07_Playwright認証プロファイル.md)）。承認はA8/もしも/KDPの認証復旧を意味せず、本人再認証の実施・継続取得の検証は未完了。有料常駐基盤・外部問い合わせは別途承認を要する。
- **先行検証（同日夕方まで）**: 成否の正典は`data/authenticated/latest.json`。KDPは無人継続が未成立。run `35561887453` attempt 8は追加本人ログイン無しで出版状態・日次・月次取得とprivate R2保存/認証更新に成功したが、その後ローカルbrowser/probeを挟まないattempt 9はReportsで`auth_required`。通常Chrome 152.0.7977.82で比較したattempt 10（`2026-09-21T07:45:15.078Z`、evidence SHA `adab37db6ff59ed66717b5cc5bda72f7dbf82127be24af2078ab088143688ab8`）も同じ失敗だった。両方とも30秒待機後の実画面は`www.amazon.co.jp/ap/signin`・password欄表示あり。待機不足やChromium/Chromeの違いだけでは説明できず、比較用のbrowser変更は戻した。Cookie24件の欠落・期限切れは無く、同一stateはローカルheaded環境で成功したが、提供元が再認証を要求する条件は未確定。固定環境が必要/十分とも断定しない。最新restoreの拒否・Issue #1000の自動更新と、8月の月次原本SHA再検査/再解析/履歴restoreは確認済み。当時main反映は継続認証の検証まで保留した。noteは285/286件・全ページ/合計一致・`report_incomplete`。独立監視Issue #763も継続し、全cron正常とはしない。
- **初回schedule未確認（2026-09-21 19:02 JST）**: 18:20予定の実行はAPI `actions/workflows/authenticated-measurement.yml/runs?event=schedule`で`total_count:0`。workflow `362957799`はactive、default branchはmain、mainのcronは`20 9 * * *`で、main反映は同日14:46 JSTに済んでいる。最新runは引き続き`35561887453`・event=`push`・attempt 10であり、定期実行の成功証拠に流用しない。record job `106253312558`は記録step成功・警告step失敗。developの最新記録（generatedAt=`07:46:36.641Z`）とprivate R2は全7sourceのrun ID/attempt/observedAt/status/code/quality/evidence SHAが一致した。取得済み5sourceはpass、KDPとnoteは上記失敗のまま。未観測の理由は未確定で、遅延/起動停止のどちらとも断定しない。予約した単発確認は実施済みとして停止し、実schedule起動の受入条件は未完了で保持する。
- **未解決の証拠（2026-09-21）**: noteは同じ13:55 JST集計でも、2026-01-20〜09-20では286/286件・全合計一致・カバー結合PASS、08-24〜09-20では285/286件・全合計一致となる。欠落記事は公開中で、長期窓では表示される。Chrome実画面でインプレッション順に変更して全15ページを表示しても285件・同じ記事が欠落し、末尾に「もっとみる」は無い。期間依存の非表示まで確認できたが、非表示を0とする公式仕様は確認できず、短期窓の値はnullのまま保持する。再現入力は既存`note:metrics:fetch`の`--start`/`--end`、私有証跡は`.local/authenticated-measurement/note-{wide,current}-period/`。問い合わせ先: [note公式窓口](https://www.help-note.com/hc/ja/requests/new)。質問は「公開記事n99561600d4feが同一集計時刻の短期窓だけ一覧に無い。指標が全て0の期間に行を非表示にする仕様か、取得不具合か」。問い合わせ送信はオーナーの承認後。
- **次（実行順）**: ①KDPは本人ログイン→初回成功の反復やCookie加工で回避しない。提供元への無人取得可否/再認証条件の確認、または専用クラウド環境で本人認証から連続取得まで行う比較検証のどちらに進むかをオーナーと決める。問い合わせ送信・環境新設・常駐費用は承認後。専用環境は解決保証ではなく検証案であり、このPUBLIC repoに個人Macをself-hosted runner登録しない（[GitHub公式の安全要件](https://docs.github.com/en/actions/reference/security/secure-use)）。保護機構のmain反映と全取得元の無人継続運用完了を分け、後者は更新sessionの連続再利用と定期起動を実測して判定する。②noteの上記非表示仕様を提供元へ確認し、回答を根拠に収集契約を更新する（無断の問い合わせ送信・0埋めはしない）。③実schedule runが現れた時点で各source・record・develop/private R2の整合を再確認する。未観測の間はActions履歴・設定・公式障害情報で原因を調査し、手動dispatchを定期起動の代用にしない。48時間鮮度監視も別に確認する。KDP月次収益を週次へ按分せず、入金・手数料・税の帰属が未確認ならsales-ledgerへ入れない。afbは承認済み`AFB_API_KEY` Secretを使用し、Cookie移送の再ログインを反復しない。
- **アフィリエイト週次への波及（2026-09-24 確認）**: `affiliate-ga4-weekly.yml`のscheduled run `35639065973`（2026-09-21T18:32Z）はfailureだった。GA4取得・R2 read-back・履歴commit-backはsuccessしたが、operations state stepの`restore.mjs moshimo --if-activated`が`unavailable`を返し、measurement gateもfailureとなってIssue #1007がOPENのまま残っている。つまりA8・もしもの再認証が完了するまで、アフィリエイト週次は毎回failureになり、週次収益（NSM）のアフィリエイト確定額は判定不能のまま続く。GA4側の計測経路自体は復旧している。
- **完了条件**: 全collectorの実データ取得・private R2 read-back・git記録の整合・認証付き計測Issueの復旧closeが成立し、本人の再認証を挟まない別日付のmain scheduleで連続2回以上確認する（恒久的な無人保証とはしない）。noteの欠落は不完全のまま原因を区別し、カタログ削除/0埋めで通さない。サイト全体の放置運用判定は、このカードだけでなく横断監視Issue #763の別系統異常の解消も必要。
- **停止条件**: 2FA/CAPTCHA/規約同意を自動化しない。Cookie/APIキーをgit/ログ/artifactへ出さない。KDPの速報売上/KENPを確定ロイヤリティや週次純収益へ代入しない。afbの発生日/確定日系列を合算せず、API報酬を純収益・入金へ代入しない。出版/提携状態の成功を全計測完了と言わない。自動投稿/申請/振込/商品変更は範囲外。
- **観測 (2026-10-08)**: run 37695475962 (develop への push で起動) で、もしもが `auth_required` (`blockedSince` 2026-10-07T16:31:27Z、新規)、KDP も `auth_required` (`blockedSince` 2026-09-30T08:35:08Z のまま)。どちらも `collectionAttempted:false` で、本人の再認証待ち。同じ run でココナラも `auth_required` (`blockedSince` 2026-10-01T12:39:06Z。自動ログイン対象外なので専用プロファイルからの `bootstrap-session.mjs coconala --from-profile --publish` 待ち)。

- **復旧後の取得実測（2026-10-17）**: run38984474666は8サービス全てpass、recordとgit書戻しも成功。note/ココナラの10-17売上観測、KDP日次10-16と確定月次の重複防止（added0/skipped1/conflicts0）を確認。本人再認証を挟まない別日main schedule連続2回はまだ未達であり、このカードを継続する。

- **後続の再発（2026-10-17T00:41Z）**: run38987311743はKDPだけ`auth_required / relogin=login_failed`、他7サービスはpass。KDPは同一世代を停止しており、古い成功で上書きしない。本人のReports再確認返信後、Reports実UIの表示を確認してCI用stateを更新した。クラウドの再取得を確認するまで復旧扱いにしない。継続2回の完了条件は未達。

- **再発箇所への修正（2026-10-17）**: attempt2はCI再ログインに成功した後、全書籍確認の終了後にReportsへ戻る遷移で`auth_required`。取得前の長い棚卸しを避け、別Reportsタブで先に日次・月次を取得してから棚卸しするよう修正、32テストpass。全件確認・口座照合・確定月次とprivate保存を成功条件に維持。修正版の実CI確認が必要。

- **時間予算の修正**: attempt3は認証成功後のtimeout。計測限定で、正しい本棚の可視draft行を再利用して22冊の重複再読み込みを減らす。未発見の探索・全件照合・出版時のfresh navigationは維持。48テストpass、実CIで確認する。

- **修正後の実CI成功**: run38987311743 attempt4は全8サービスpass、KDP取得4分12秒。private SHA/bytes一致、22冊の状態・日次・確定月次completeを確認した。record成功・git commit be018dada8、確定9月売上の台帳はadded0/skipped1/conflicts0。本人再確認後の同日成功であり、別日main schedule連続2回の完了条件は維持する。修正後develop品質CI38991805850もsuccess。
- **2026-10-19 ココナラ撤退**: ココナラを取得対象から外した (取得元 8 → 7、計測の鮮度の母数も 1 減る)。ココナラの日次の判定はこのカードの対象外。過去の観測は `data/authenticated/revenue-history.json` に残る。
- **2026-10-19 Mac の直接取得へ移行 (オーナー承認)**: 毎日 17:30 の `scripts/scheduled/measurement-session-refresh.sh` が、CI を起動する代わりに `measurement-collect-local.sh` を呼ぶ。定期実行専用の clone (`~/stats47-measurement`) で `collect-local.mjs` → `collect.mjs --local --vault` を取得元ごとに動かし、証跡は CI と同じ保管庫のキー (`restore.mjs` が読む) へ、要約は develop へ CI を止める印なしで push する (fab191b9c)。同日の手動の通し実行で もしも・A8・note・楽天は pass、afb は `api_key_missing`、GSC と KDP は `auth_required`。
- **2026-10-19 夜**: オーナーの準備 (afb の API キー・GSC のログイン) を後日に回したので、定期実行は CI の起動に戻した。切り替えの手順と残りは `MEASUREMENT-MAC-DIRECT-01`。

### [MEASUREMENT-MAC-DIRECT-01] 認証付き計測を木曜の Mac の取得だけにし、残っている CI 専用のコードと Secrets を撤去する
タグ: [インフラ・計測] [種類:改善] [実行:対話] [検証:npm run measurement:test] [起票:2026-10-19] [期日:2026-11-05] [領域:管理]

- **方針 (2026-10-20 オーナー判断)**: ログインが要る計測 (A8・楽天・note・KDP・GSC の画面) は、毎週木曜に Mac がその場でログインして取得し、記録する。ログインは週 1 回 Mac が行えば足りるので、CI にもセッションを持たせず、普段からセッションを保つこともしない。セッションのエージェントは記録から判断する (`.claude/rules/recorded-measurement-first.md`。読むための操作は hook が止める)。セッションが切れて 2 段階認証が要る週は、その取得元を判定不能にして次の木曜を待つ。
- **2026-10-20 実施**: CI の `authenticated-measurement.yml` を無効化 (`gh workflow disable`) のうえ削除し、補完起動 (`catch-up.mjs`・`workflow-health-daily.yml` の段) と監視の契約を外した。木曜 17:30 の `measurement-session-refresh.sh` は CI へセッションを渡さず (`--publish` を外した)、`measurement-collect-local.sh` で取得して develop へ記録する。記録は 8 日間「今の値」として使う (`MEASUREMENT_MAX_AGE_MS`)。同夜に GSC・KDP・note のログインをし直した (KDP・note は `status: ok`)。
- **次 (Claude)**: ① 10-22 (木) の夜に、`~/Library/Logs/stats47/measurement-collect-local.log`・develop の「(Mac)」の記録コミット・`data/authenticated/latest.json` の各取得元を確かめる ② 初回が通ったら、CI 専用のコードを削除する: `collect.mjs` の CI 分岐 (`MEASUREMENT_SESSION`・`STATS47_AUTH_*`・`ciLogin`・保管庫の `<取得元>/session` と `auth-recovery` の書き込み)、`refresh-session.mjs` の `--ci`・`--publish`、`bootstrap-session.mjs --publish`、`set-ci-secret.mjs`、`auth-recovery.mjs`、`.claude/config/auth-credentials.json` の `ciCredential`・`ciStored` と管理画面 `/ops/auth` の CI 欄、`package.json` の `auth:ci-secret`、`docs/01_技術設計/07_Playwright認証プロファイル.md` の「CI 実行について」の旧仕様。取得のコードを Mac と共有しているので、初回の実測の前には触らない。
- **2026-10-20 Secrets 削除済み (オーナー承認)**: `MEASUREMENT_SESSION_*` 8 件・`STATS47_AUTH_*` 18 件・`AFB_API_KEY` を削除した。保管庫の鍵 `MEASUREMENT_VAULT_KEY` は週次のワークフロー (`affiliate-ga4-weekly.yml`・`fetch-metrics-weekly.yml` の restore) が使うので残した。管理画面 `/ops/auth` の CI 欄は、上の ② で外すまで「未登録」と出る。
- **引き継いだ事実 (旧 `AUTHENTICATED-MEASUREMENT-ACTIVATION-01`)**: KDP の Reports は 2 段階認証を求めることがあり、そのときは本人の入力が要る (`refresh-session.mjs kdp --wait-human`)。note は短い集計期間で 1 記事が一覧に出ない欠けを、条件付きで既知の欠けとして pass にしている (`note-inventory.mjs` の `acceptedNoteGap`。値は null のまま)。KDP の速報売上・KENP は確定ロイヤリティや週次の純収益に入れない。
- **停止条件**: 2 段階認証・CAPTCHA・規約同意を自動化しない。Cookie・API キーを git・ログに出さない。
- **完了条件**: 木曜の Mac の取得が記録まで通り、CI 専用のコードと Secrets が残っていない。

### [NOTE-DASHBOARD-COLLECT-01] note ダッシュボードの週次取得が 2026-10-12 から失敗している (Chrome Profile 5 を開けない) のを直す
タグ: [インフラ・計測] [種類:不具合] [実行:ユーザー] [起票:2026-10-19] [期日:2026-10-26] [領域:管理]

- **事象 (2026-10-19 確認)**: origin/develop の `data/note/dashboard/latest.json` は `fetchedAt` 2026-10-12T00:15Z・`status: incomplete`・記事 0 件で、理由は `browser_open_failed: "[Errno 1] Operation not permitted: '/Users/minamidaisuke/Library/Application Support/Google/Chrome/Profile 5'"`。最後に全件取れたのは 09-07〜10-04 の分 (10-05 取得)。10-19 00:15Z の定期実行 (09-21〜10-18 の分) も同じ `browser_open_failed` で記事 0 件で、2 週続けて失敗した (Mac のローカル出力を 10-19 に develop へコミット)。計測サイクル (`data/measurement-cycle/LATEST.md`) の「有料購入」でも、note は「判定不能 (最終観測 2026-09-30)」になっている。
- **影響**: note の閲覧と売上が 10-05 以降測れていない。`NOTE-PRODUCT-LADDER-01`・`KNOWHOW-PRODUCT-PILOT-01`・`KNOWHOW-QA-BOARD-01`・`NOTE-FREE-DEFAULT-01` の判定と、`NOTE-FISCAL-PEER-PUBLISH-01` の 11-09 の売上比較がすべて判定不能になる。
- **2026-10-19 の切り分け**: launchd だけの問題ではない。Claude デスクトップアプリから手で実行しても同じ `browser_open_failed` で失敗した。同じ shell から `ls` すると、Chrome のプロファイルは Profile 5 だけでなく Default・Profile 1 もすべて `Operation not permitted` で中身を読めず、`~/Library/Application Support/Google/Chrome` の一覧も拒否される。フォルダの `stat` (`ls -ld`) は通り、所有者は自分・権限は `drwx------` なので、Unix の権限による拒否ではない。`system_profiler SPInstallHistoryDataType` を見ると、macOS 27.0.1 が **2026-10-10 10:06** に入っている。最後に成功した 10-05 と最初に失敗した 10-12 の間である。
- **原因 1 (2026-10-19 解消・Claude アプリのみ)**: macOS 27 への更新後、実行元のアプリにフルディスクアクセスが無いと Chrome のプロファイルを読めなかった。オーナーが Claude デスクトップアプリに許可して再起動すると、同じ shell から Profile 5 を読めるようになり、取得のエラーは `browser_open_failed` から `login_required` に変わった。**launchd (`/bin/bash`) とターミナルへの許可は未確認**で、10-26 の定期実行で `browser_open_failed` が出れば、`/bin/bash` にも同じ許可が要る。
- **原因 2 (2026-10-19 解消)**: Profile 5 (Chrome の表示名「stats47」) の note のログインが 2026-10-16 20:10 UTC に切れていた。オーナーが Profile 5 で再ログインした (新しい `_note_session_v5` の期限は 2027-01-19)。手動の取得は 09-21〜10-18 の 28 日窓で `status: pass` になり、公開 402 件を 21 ページで全件取得し、合計値もダッシュボードと一致した (`fetchedAt` 2026-10-19T10:42Z)。10-05〜10-18 の欠けはこの窓で埋まった。再ログインの直後に実行すると、Cookie ファイルへの書き込み前に読んで `login_required` になることがある (1 回観測)。
- **残り**: 定期実行 (launchd → `/bin/bash`) にフルディスクアクセスが要るかの確認。**検証期日**: 2026-10-26 (月曜 09:00 JST の定期実行の後)。`data/note/dashboard/latest.json` が `status: pass` で、`cover-metrics-latest.json` も `pass` ならカードを削除する (2026-10-19 に定期実行のラッパー `scripts/scheduled/fetch-note-metrics.sh` が取得の前に表紙監査を毎回走らせるよう直し、同じラッパーの手動実行で結合が初めて `pass`・402 件になった)。`browser_open_failed` なら、オーナーが `/bin/bash` にフルディスクアクセスを許可する。ログは `~/Library/Logs/stats47/fetch-note-metrics.log`。
- **完了条件**: 定期実行で `latest.json` が `status: pass`・`coverage.complete: true` になり、10-05〜10-18 の欠けた期間を 28 日の窓で取り直せている。

### [NAV-CLICK-COVERAGE-01] サイト内リンクのクリックを既定で全件計測し、名前の無い導線を週次で減らす

タグ: [インフラ・計測] [種類:改善] [実行:対話] [起票:2026-09-25] [期日:2026-10-23] [領域:管理]

- **背景 (2026-09-25 実測)**: 2026-08-23〜09-19 の 28 日 (国内) で、サイト内のページ移動は 11,319 件
  (`internal-transitions.csv`) なのに、部品単位で記録されたクリックは最大 2,124 件 (`nav_click` 1,770 / `rail_click` 310 /
  `home_featured_click` 41 / `cta_click` 3、`event-volume.csv`) で約 2 割にとどまる。計測は部品ごとの手動追加で、
  `next/link` を使う 52 ファイルのうち計測呼び出しを持つのは 15 ファイルしかない。ブログ本文の `<source-link>` は
  2026-09-25 まで無計測だった。外部リンク (GA4 拡張計測の `click` 234 件) とアフィリエイト (`affiliate_click` /
  `affiliate_impression`) は記録済みなので、欠けているのは「サイト内のどの部品から移動したか」だけ。
- **方針**: 計測の既定を「全部送る」に反転する。ルートレイアウトに共通のクリック監視を 1 つ置き (capture 登録。
  Next.js の Link が既定動作を止めるため)、サイト内リンクのクリックを既存の `nav_click` で送る。導線名は外側の
  `data-nav-surface`、ラベルは `data-nav-label` (無ければページ種別名。URL は `nav_href` が持つ) から取り、
  導線名が無ければ `unlabeled` で送る。GA4 側の登録作業は不要 (登録済み dimension の値追加)。
- **次 (実行順)**:
  1. **P1**: 共通監視、型付き属性関数 (`NavSurface` で縛る)、既存 `trackNavClick` のうちリンクを送る箇所の属性化
     (導線名・ラベルの値は変えない)。`rail_click` / `cta_click` / `home_featured_click` / `affiliate_click` は専用処理を残し、
     領域に `data-click-owner` を付けて共通監視から除外する。リンク以外の操作 (チェックボックス・セレクト) は現状維持。
     未コミットのブログカード (`RankingLinkCard` / `/api/ranking-card`) も属性方式にそろえる。
     `UI-CARD-HEADER-SIMPLIFY-01` が同じレール部品 (`SurfaceCard.tsx` の `RailCard` 等) のクラスを変えるので、同じコミットに混ぜない
     (P1 は属性の追加だけ、見出しの見た目は同カードで変える)。
  2. **P2**: 全ページに出る共通領域 (ヘッダー・フッター・パンくず・ページ送り・タグ・ブログ本文リンク) に導線名を付ける。
     目標の名前なし割合は代表 URL で実測してから決める。
  3. **P3**: `page-quality` の全 URL 静的解析に「名前の無いサイト内リンク数」「計測担当の無い広告リンク数」を追加し、
     テンプレート別に縮小専用の基準線を置いて、違反を既存の UI 指摘キュー (`UI-FIX-*` 起票) に流す。
     描画後に出るリンクは代表 URL のブラウザ検査で数える。
     **衝突注意**: `UI-CHART-TEXT-LOOP-01` (途中成果はブランチ `wip/ui-chart-text-loop-01`) と `SITE-DISPLAY-SEMANTICS-AUDIT-01` も同じファイル群
     (`.claude/scripts/page-quality/lib/ui-report.ts` の `UI_METRIC_KEYS`・`types.ts`・`page-quality-budgets.json`・`measure-static.ts`) に
     指標を足す。並行して実装せず、後から入る側が先行分を取り込んでから足す。
  4. **P4**: `fetch-ga4-snapshot.mjs` の `nav_click` 集計から「テンプレート別の `unlabeled` クリック上位」と
     「導線名付きクリック ÷ サイト内ページ移動」を計測サイクルと週次レビューに出す。台帳
     (`.claude/rules/analytics-event-standards.md`) に値追加とデプロイ日の件数不連続を書く。
- **停止条件・禁止**: クリックを止める処理 (`preventDefault` / `stopPropagation`) を入れない。見た目・マークアップ構造・
  クラスを変えない。タブ切替・スクロール等の画面内操作とアフィリエイトの表示回数計測は対象外。本番デプロイは P1 と P2 を
  まとめて 1 回、オーナー承認の上で行う。デプロイ後に `nav_click` が 2 倍近く跳ねたら二重送信を疑い、先に原因を特定する。
- **完了条件**: ① 単体テストが「1 クリック 1 件」「広告・`data-click-owner` 付きは送らない」「送信時に遷移を止めない」を
  固定し、localhost の代表 7 種ページで実クリック 1 回につき送信 1 件を確認済み。② 本番デプロイ後の週次 page-quality に
  新指標が出て、違反を 1 件注入すると検知されることを確認済み。③ 週次の計測サイクル出力に被覆率と `unlabeled` 上位が
  出ている。
- **P1 済 (2026-09-26・未コミット・未デプロイ)**: `apps/web/src/lib/analytics/components/NavClickTracker.tsx` をルートレイアウトに置いた。
  既存の `trackNavClick` 32 か所は書き換えず、同じクリックで部品側が送ったら共通の監視は送らない方式にした (値を変えない・二重送信しない)。
  `rail_click` / `cta_click` / `home_featured_click` の 4 部品に `data-click-owner`。ブログの目次は `blog_toc` + 見出しのラベル。
  単体テスト 6 件 (1 クリック 1 件・専用領域と外部は送らない・部品側と重ならない・遷移を止めない)。二重送信防止を外すと red。
  localhost で実クリック: トップ (ヘッダー=部品の 1 件 / フッター・本文=unlabeled 1 件 / 注目ランキング=0 件)、ランキング
  (右レール=rail_click のみ / パンくず 1 件)、ブログ目次 (blog_toc 1 件)。代表 7 種のうち、カテゴリ・県・テーマ・調査は開発サーバーの
  メモリ不足で未確認。台帳 (`analytics-event-standards.md`) に値追加とデプロイ前後の不連続を記録済み。
- **P2 済 (2026-09-26・未コミット)**: フッター `footer`・パンくず `breadcrumb` (共通部品とブログ)・タグ `tag` (ラベル=tagKey)・
  ブログ本文のサイト内リンク `blog_body` に導線名。localhost のブログで各 1 クリック 1 件・導線名付きを確認。ページ送りの共通部品は無かった。
- **P4 済 (2026-09-26・未コミット)**: `fetch-ga4-snapshot.mjs` が `nav-click-surfaces.csv` (nav_click を導線名×ラベル別・Japan-only・28日) を取り、
  計測サイクル (`summarizeNavCoverage`) が「導線名付きクリック ÷ サイト内の移動」の被覆率と導線名なしの上位を LATEST.md に出す。
  CSV が無い週 (デプロイ前) は節を出さない。metrics:test 127 件 PASS。**実データでの確認はデプロイ後の最初の日曜計測**。
- **次**: デプロイ後の週次で被覆率を読み、導線名なし上位から名前を付ける。P3 (page-quality の静的解析に名前の無いリンク数) は `UI-CHART-TEXT-LOOP-01` と
  同じファイル群を触るので、あちらの取り込み後。

- **2026-10-19 導線名なしの上位に名前 (W43 Must 3・未デプロイ)**: W41 の計測で被覆率 23.2%・`nav_click` の 53.9% が導線名なし。GA4 の資格情報が Windows PC に無いので、開発サーバーの HTML と部品のコードで「部品側の送信も導線名も無いリンク」を特定し、閲覧の多いページ種別の 7 部品に導線名を付けた (`ranking_table` / `ranking_correlation` / `ranking_related` / `area_databook` / `category_ranking_list` / `geo_source_list`。台帳 `analytics-event-standards.md` に記録)。属性は `navSurfaceProps()` (`events.ts`、`NavSurface` で型を縛る) で付け、見た目・構造は変えていない。テスト `lib/analytics/components/__tests__/nav-surface-coverage.test.tsx` (属性を外すと失敗することを確認済み)。localhost の HTML でランキング詳細 13・県ページ 101・カテゴリ 154・Geo レイヤー一覧 100 件に属性が出ることを確認した。
  - **確認できなかったこと**: ブラウザ枠の描画が止まり、localhost で実クリック 1 回あたり送信 1 件の確認 (完了条件 ①の残り) はできていない。計測部品自体は変えていないので既存のテスト (1 クリック 1 件・部品側の送信と重ならない) が担保する。
  - **2026-10-19 夜 本番反映と実クリック確認**: PR #1158 で本番に入り (deploy-workers 09:35Z success)、本番の HTML に 7 部品の導線名が出る。アプリ内ブラウザで実クリックし、ランキング表 (`ranking_table`) と県ページ (`area_highlights`) でクリック 1 回につき GA4 送信本文の `nav_click` が 1 件・遷移は止まらないことを確認した (完了条件 ① の実クリック分)。
  - **残り**: ~~本番デプロイ (オーナー承認待ち)~~ (済) → デプロイ後の週次で被覆率と `unlabeled` の上位を読み、残る部品 (候補一覧は `SiteLink` を使い計測の配線を持たないファイル 40 件ほど。Geo の各分析・市区町村ランキング・テーマのダッシュボードなど) から次を選ぶ。P3 (page-quality の静的解析) は従来どおり `UI-CHART-TEXT-LOOP-01` の取り込み後。
### [CF-CPU-SURGE-01] 2026-09-11 以降の Workers CPU 時間の増加原因を特定し、差分 purge とブログ広告変更の効果を測る

タグ: [インフラ・計測] [種類:不具合] [実行:対話] [起票:2026-09-24] [期日:2026-10-30] [領域:管理]

- **背景 (2026-09-24 実測)**: 請求書 6 通 (`cloudflare-cost-improvement/reference/weekly-snapshots/2026-W20〜W38.json`) で、
  5 月以降の従量課金は毎月 Workers CPU ms の 1 行だけ (9/15 請求は超過 267M ms で $5.36)。9/15〜の請求期間は予算アラート
  $3.06 に 5 日目で到達 (前 2 期間は 24〜26 日目)。日次 snapshot の CPU p50 は約 8→15〜22ms、p99 は約 1.4→2.8 秒で、
  9/11〜12 のデプロイ後から増えている。候補は ① purge が HTML キャッシュへ実際に効くようになった (`f3a04de2b`)
  ② テーマ拡充で 1 ページが重くなった ③ アクセス増。デプロイのたびに HTML キャッシュが消えることも実測した (30 日で 84 回)。
- **済**: 楽天同期の全体 purge を差分 purge に変更 (`c15ea5708` / `db8c6acf8`、PR #1021 で本番反映済み)。
  ブログの A8 バナー抑止 (`c9e2b6a93`) は develop のみで未リリース。
- **2026-09-27 ① 確認済**: 9/27 04:43 の `sync-rakuten-catalog` (run 36273912838) は差分 purge で「purge 1924 URL (ranking 707 / blog 281 / 県 20 / 市区町村 916)」、`--all` ではない。
- **次**: ① (済) 9/25 JST 04:00 の `sync-rakuten-catalog` で purge が `--urls` (約 1,900 件) になり `--all` でないことをログで確かめる。
  ② Cloudflare Dashboard の Workers Observability で route 別の CPU 時間を見て主因を絞る (オーナーがダッシュボードで確認する)。
  ③ 日次 snapshot の cpu_p50/p99 と 10/15 の請求書の CPU 行で効果を見る (請求書は invoice モードで記録)。
- **停止条件**: 本番 deploy はオーナー承認まで行わない。原因を実測で絞らないまま対策を足さない。
- **完了条件**: CPU 増加の主因を route か仕組みで特定して対策を決め、10/15 の請求書の CPU 行を記録している。
  (2026-10-16 にこの 2 点は満たした。対策の本番反映と効果観測の引き渡しまでをこのカードで持つ)
- **観測の追記 (UI 全面点検 (2026-09-25・本番 44 URL × 7 幅 = 308 枚を撮影、250 枚を目視。`UI-FULL-SWEEP-01`))**: 本番の撮影 308 回のうち 3 回で一時的な HTTP 503 (`/areas/29000/cities/29363` の 390・640px、`/category/landweather` の 390px)。
  同じ URL は直後の再取得で 3 回とも 200。
  GSC 是正キューでも `/blog/gasoline-consumption-quantity-vs-densely-inhabited-district` (9/7・9/20) と
  `/blog/white-bread-consumption-quantity-prefecture-gap` (9/20) が 503 と記録された。9/25 はキャッシュ迂回を含む 5 回すべて 200
  (1 回目の描画は 2〜3 秒)。`GSC-COV-5XX-20260925` はこのカードへ原因調査を寄せて閉じた。
- **関連する変更 (2026-09-25 夜・未リリース)**: `THEME-CHART-LOAD-LATENCY-01` で、テーマページの時系列取得を 1 回のサーバーアクションに
  束ね、同じ指標の「選択県」と「全国」を R2 の 1 回の読み込みから作るようにした (リクエスト 48 → 2、R2 読み込みは指標数分)。
  [仮説] テーマページ 1 表示あたりの Workers CPU 時間が減る。検証: リリース後の日次 snapshot の cpu_p50 / p99 を前週と比べる。
- **10/15 の請求書 (2026-10-16 記録)**: IN-83898043 (9/15〜10/14) の Workers CPU は超過 1,068,120,555 ms・$21.38、
  推定合計 1,098M ms で前期間 (297M) の 3.70 倍。合計 $29.02 (4,699 円)。記録 `data/cloudflare/weekly-snapshots/2026-W42.json`。
  同期間の Workers requests は前期間比 +43.3% (2.08M → 2.98M、月次 JSON 同士の比較) なので、1 件あたりの CPU は約 2.6 倍。
- **主因 (2026-10-16 実測・Workers Observability の Traces、10/16 09:00〜10:00 JST の 1 時間)**: 約 6,500 件・CPU 約 390 万 ms のうち、
  `url.query` に `_rsc` を含むリクエストが 4,249 件・約 282 万 ms (**約 72%**)。App Router が画面に入ったリンクを先読みし、
  RSC はキャッシュを通らない設計 (`lib/cache-policy.ts`) なので毎回サーバー描画になる。本番トップを開くだけで `_rsc` が 37 件出た。
  内訳はほかに、OCN (ASN 4713) から Windows Chrome 155 を名乗る 1 端末が 1,263 件・約 33% (約 3 秒に 1 回が 1 時間連続、
  Accept は 97% が `*/*`。`_rsc` の行と重なる)、Cloudflare が認めたクローラーが約 17% (うち AI 関係は約 4%)。
  個別のランキング・ブログ・県ページは 1 回の描画で CPU 0.8〜2.5 秒。
  限界: 1 時間のみ (期間切替が操作できなかった)。1 時間 × 720 の換算は請求書の約 2.5 倍で、gateway と CachedApp の二重計上の可能性があるので割合として読む。
  集計の方法: Observability → Query Builder (データセット Traces) で `cpu_time_ms` の sum を `url.path` / `cloudflare.verified_bot_category` /
  `user_agent.browser.name` / `cloudflare.asn` 別に出す。`$workers.event.request.path` は Traces に無く結果が空になる。
- **対策 (2026-10-16)**: `SiteLink` (表示時は `prefetch={false}`、マウスを乗せた・触れたときに `router.prefetch()` を 1 回) を
  `next/link` の全 91 import に適用し、ESLint で直接 import を禁止 (`f94a5035f`、PR #1137・未マージ)。localhost の本番ビルドで
  トップの `_rsc` が 37 → 0、hover で 1 件、遷移正常。監視側は月次レポートの前月比 (30 日対 1 日の誤比較) と日次の CPU 合計取得を修正
  (`9583e1df8`、main 反映済み。`sum.cpuTimeUs` が本番で取れるかは未確認)。
- **次 (2026-10-16 更新)**: ① PR #1137 を main に反映する (オーナー承認待ち)。② 反映の翌日に日次取得の CI ログで
  「Workers CPU total」が値か「取得不能」かを確かめる。③ 反映後 7 日の日次 CPU (取れれば合計、無ければ cpu_p50/p99 と requests) と、
  Observability の `_rsc` の CPU 割合を反映前と比べる。④ 効果観測は改善台帳の別 ID (improvement-triage) へ引き渡し、このカードを閉じる。
  残る対策は `CF-CPU-OCN-CLIENT-01` / `CF-CPU-RENDER-WEIGHT-01` / `CF-HTML-EDGE-TTL-01` / `CF-DEPLOY-CACHE-RESET-01`。
  AI クローラーの制限は実測 4% のため起票しない。

- **2026-10-19 ② 確認**: 対策の本番反映 (10-17 01:15Z) 後の日次取得で `totalCpuTimeUs` は値が取れている (`cpuTimeError: null`、cloudflare-usage-daily run 39063203871 / 39159162517)。UTC 日別: 10-15 は 7,306 万 ms・requests 130,494・1 件あたり 560 ms・cpu_p50 31.6 ms / 10-16 は 4,344 万 ms・79,591・546 ms・15.8 ms / 10-17 は 4,293 万 ms・81,896・524 ms・1.2 ms (`data/cloudflare/snapshots/<日>.json`)。合計の低下はデプロイ前の 10-16 の requests 39% 減から始まっており、1 件あたりの平均 CPU はほぼ変わっていない。**③ (10-24) は合計ではなく、1 件あたりの CPU・cpu_p50・Observability の `_rsc` の割合を反映前と並べる** ([仮説] p50 の低下は軽い `_rsc` 要求が減った影響で、平均を押し上げている重い描画は残っている。10-24 に Traces で `_rsc` の件数と CPU の割合を取り、割合が 72% から下がっていなければ先読み以外の経路を疑う)。
- **2026-10-19 予算アラート**: 10-15〜11-15 の請求期間で、従量課金が予算に 4 日目 (10-19 10:11Z) で達した (現在の合計 $3.20。前期間は 5 日目)。日次の CPU 合計 10-15〜10-17 は計 1.59 億 ms で、前回の請求書から逆算した単価 (超過 1,068M ms で $21.38 = 100 万 ms あたり $0.02、無料枠 30M ms) で計算すると約 $2.58 になる。10-18 の 1 日分 (未取得) を足すと $3.20 に合う。新しい急増ではなく、1 日 4,300 万 ms のままなら、この期間も前回並み (従量約 $26 + 基本 $5) になる。
- **2026-10-19 アカウント全体の内訳 (doboku-note 側で記録)**: doboku-note の cloudflare-metrics がアカウント全体の使用量と見込み額を記録し始めた (doboku-note リポジトリの `data/cloudflare/zone/2026-10-19.json` の `accountUsage`、2026-09-19〜10-18 の 30 日)。合計 $30.51 のうち Workers CPU $22.44 (約 73%)・Workers 基本 $5・R2 Class B $2.70・R2 保存 $0.37・R2 Class A $0 (無料枠内)。CPU 以外の従量は R2 で、その大半は doboku-note の画像配信と同期処理。doboku-note 側は 10-19 に差分アップロード・OGP 派生の HEAD 削減・Cache-Control 付与・公開バケットの不要 3,111 件の削除を本番反映済み。**このカードの CPU 行は doboku-note の対応では動かない** (請求の主因は引き続き stats47 の Workers CPU)。
### [DEPLOY-WORKER-CACHE-STALE-CSS-01] デプロイ後に古い HTML が消えた CSS を参照し、ホームが CSS なしで表示される事故を止める
タグ: [インフラ・計測] [種類:不具合] [実行:対話] [起票:2026-10-06] [進行中] [領域:サイト]

- **事象 (2026-10-06)**: PR #1086 のデプロイ後、本番 `/` が CSS なしで表示され、post-deploy-smoke の 375px で横スクロール 273px
  になった (Issue #1089・確認を書いて閉じた)。`/` の HTML はデプロイで消えた `/_next/static/css/d69590e93db400ea.css` (404) を参照し、
  `cf-cache-status: HIT`・`age: 1544` (22:10:22 UTC)。逆算したキャッシュ時刻 21:44:38 は、`wrangler deploy` 完了 (21:44:23) の
  10 秒後に始まる warm-cache が `/` を叩いた時刻と一致した。zone の URL purge では消えず、`purge-cdn.yml` (zone の全パージと
  Workers Cache の `--all`) で消えた。
- **経路は未確定**: 公式ドキュメントでは、Workers Cache は既定で Worker の版がキャッシュキーに含まれ、新しい版は空のキャッシュから
  始まり、段階的な切り替え中も旧版へのリクエストはキャッシュされない
  ([Configuration](https://developers.cloudflare.com/workers/cache/configuration/)、2026-10-06 確認。`cross_version_cache` は未設定)。
  `/` は `force-dynamic` で毎回描画するので、新しい版が古い CSS を出す経路も見つかっていない。観測とドキュメントが合わないため、
  経路を特定せずに次の 2 つで防ぐ。
- **実装済み・未デプロイ (2026-10-06)**:
  - `deploy-workers.yml` に `reset-worker-cache-after-deploy.sh` を足した。デプロイ後、本番 `/` (毎回別キーの probe URL) が
    今回のビルドの CSS だけを参照するまで最大 2 分待ち、Workers Cache を全パージしてからウォームする。新しい版は空のキャッシュから
    始まる仕様なので、この purge で失うものはない
  - `smoke-test-routes.sh` に、HTML が参照する `/_next/static/` の CSS・JS が 200 を返すかの検査 (`[stale asset]`) を足した。
    今日 404 だった CSS を渡すと検出し、現在の本番では 16/16 通ることを確かめた
  - 順序 (デプロイ → 全パージ → ウォーム) と検査の存在は `apps/web/src/__tests__/workers-cache-contract.test.ts` が固定する
    (全パージをウォームの後へ動かすと落ちることを確認)
- **関連 (2026-10-06 22:13 UTC)**: 全パージ (22:12) の直後に PR #1088 をデプロイした (77acdfb2)。ウォームアップで 5 件、
  本番ルート確認で 1 件が 503 を返し、`deploy-workers` は失敗扱いで post-deploy-smoke は skip された。新版は反映済みで
  (Version ID `1a737ebb`)、数分後には同じ 6 ルートが 200 (描画 5〜8 秒) を返し、22:25 に本番へ smoke-test.ts 11/11・
  Playwright smoke 48/48 が通った。**[仮説]** キャッシュが空の状態で、データの多いテーマページの初回描画が間に合わなかった。
  この対策もデプロイ直後に Workers Cache を空にするので、次のデプロイで同じ 503 が出るかを見る。
- **初回の本番確認 (2026-10-07 01:03 UTC・PR #1092・6726511d)**: reset step が 1 回目の probe で今回のビルドの CSS を確認して
  全パージした。ウォーム 28/28・route smoke 16/16 (`[stale asset]` 0 件)・post-deploy-smoke (Playwright) が通り、503 は出なかった。
  ただし今回は CSS のハッシュが変わらないデプロイ (`d4949ee3e21c581b.css` のまま) だったので、事故の条件そのものは再現していない。
- **次**: CSS のハッシュが変わる次のデプロイで、reset step のログが新しいハッシュを確認してから全パージしたこと、route smoke の
  `[stale asset]` が 0 件であることを確かめる。ウォームや smoke で 503 が出たら、ウォームの間隔・再試行を見直す (ほかの検査を緩めない)。
- **完了条件**: 次の本番デプロイで reset step と smoke が通り、post-deploy-smoke (Playwright) も通る。

### [RECORD-SCHEMA-CONTRACT-01] 判断に使う記録に形の契約 (JSON Schema) と、書き込む前の検査を入れる
タグ: [インフラ・計測] [種類:改善] [実行:対話] [検証:npm run check-datasets] [起票:2026-10-20] [領域:管理]

- **背景 (2026-10-20)**: セッションは管理画面を開かず、記録から判断する方針にした (`.claude/rules/recorded-measurement-first.md`)。これで記録が計測スクリプトとエージェントの境界になった。ところが `config/datasets.mjs` が schema を義務にしているのは kind が config・ledger の行だけで、判断に使う `data/authenticated/{latest,revenue-history}.json`・`data/measurement-cycle/latest.json`・`data/affiliate/{a8,rakuten}-results.json`・`data/nsm/weekly-snapshots/*.json` (kind は state・series) には形の契約が無い。書き手の変更で形が崩れても、読む側は気づかずに誤る。後続の `SCRIPT-ISO-WEEK-UNIFY-01`・`SCRIPT-GOOGLE-CLIENT-UNIFY-01` で書き手を作り直すときに、壊していないかを判定する基準にもなる。
- **2026-10-20 済**: ① 6 データセットの schema を `config/schema/{revenue.authenticated,revenue.authenticated-history,business.measurement-cycle,business.nsm-weekly,a8.results,rakuten.results}.schema.json` に置いた (実データから推論。NSM は全 25 週から)。形の違うファイルを 1 行にまとめていた `revenue.authenticated`・`business.measurement-cycle` はファイルごとの行に分けた (`datasetDir` の値は変わらない) ② `check-datasets.mjs` が schema を宣言した行を kind を問わず検証する ③ 金曜に動く書き手 (`build-measurement-cycle.mjs`・`snapshot-weekly-metrics.mjs`) が `assertDatasetShape` で書く前に検証する (W41 の実データで通ることを確認)。
- **次**: 木曜の取得の経路にある書き手 (`measurement/summarize.mjs` の latest・revenue-history、A8 の成果を書く `normalize-a8-csv.mjs`、`ads/record-rakuten-results.mjs`) にも書く前の検証を入れる。10-22 の Mac の初回取得を変えないため、初回が通ったあとに行う。
- **停止条件**: 記録の形そのものは変えない (schema は今の形を固定するだけ)。
- **完了条件**: 6 データセットの行に schema があり、`npm run check-datasets` がそれを検証し、書き手が検証してから書いている。

### [SCRIPT-ISO-WEEK-UNIFY-01] ISO 週の計算 16 か所を 1 関数にまとめ、新しい自前の実装を検査で止める
タグ: [インフラ・計測] [種類:改善] [実行:対話] [起票:2026-10-20] [領域:管理]

- **2026-10-21 完了 (行削除は backlog-loop)**: 22 ファイル 27 か所の自前実装を調べ、数え方 (週の始まり・年またぎ) はすべて正しく、違いは入力の時刻を日付に直すタイムゾーンだけと実測した (UTC・実行マシンの時刻で数える 7 か所が、月曜 0〜9 時 JST に前の週を返していた。定期実行はこの時間帯に無い)。正本を `.claude/scripts/metrics/lib/periods.mjs` (JST の暦日で数える `isoWeekOf`・`isoWeekRange`・`jstDateOf`) にし、23 ファイルを呼び出しに置き換えた (関数名と返す形は不変。存在しない週は止める)。TS から読むための `periods.d.mts` を足した。`check-maintenance-debt.cjs` の `ISO_WEEK_LOCAL` が、1 月 4 日基準・日曜=7・月曜=0 の計算を正本の外に書くと止める。意図のテストは `metrics/__tests__/periods.test.mjs` (旧実装に戻すと落ちることを確認)。

- **背景**: `SSOT-CONSOLIDATION-REST-01` ③ の調べで、スクリプトの ISO 週の計算が 16 ファイルにあり、月曜始まり・日曜締め・UTC・JST が混在している。計測を週次 (木曜に取得 → 金曜に集計 → 土曜にレビュー) に一本化したので、週の区切りがファイルごとに違うと、段ごとに別の週を見る誤りになりうる (実害はまだ確認していない)。
- **次**: ① 16 か所の定義 (週の始まり・タイムゾーン・年またぎ) を表にする ② 意図が同じものを `.claude/scripts/lib` の 1 関数へ寄せ、意図が違うものは引数で選べるようにする ③ `check-maintenance-debt.cjs` に自前の ISO 週計算を止める規則を足す (baseline は縮小専用)。
- **停止条件**: 記録のファイル名 (`YYYY-Www`) や表示が変わるものは、変えてよいとオーナーが決めるまで寄せない。
- **完了条件**: 週の計算が共通の 1 関数と、理由を書いた例外だけになり、新しい自前の実装を検査が止める。

## 🟡 中 — 2〜3ヶ月以内

### [KABEUCHI-AGENT-01] サイトと収益化をエージェント相手に「公開壁打ち」できる型を作り、1回目をやる
タグ: [収益化] [種類:改善] [実行:対話] [起票:2026-10-21] [領域:戦略]

- **やりたいこと**: 運営者が相談者になり、エージェントを壁打ち相手（発想を広げる役）にして、stats47 のサイトと収益化の悩みに1時間で「その手があったか」を出してもらう。参考は GO 三浦崇宏×SHOGUN BURGER の公開壁打ち（The Solutions・2026-10-20 配信 https://pody.jp/player/IYyZ3oo32EztDR6WbOCS/YHBVBosHdRX59xygXsiM）
- **型（案）**: ① 悩みを2つまで聞く → ② 前提を読む（GA4・GSC・販売実績・共通事業方針・既存の戦略文書）→ ③ 第一印象を先に言う → ④ 質問で3〜4往復掘る → ⑤ 勝ち筋を4〜6個、すぐ試せる順に出す（各案に「読者の課題／HARM／支払う理由／需要の証拠か未検証／次の検証」）→ ⑥ 記録し、やると決めた案をカード起票
- **相手役（案）**: 発想を広げる役のほかに、収益の一手を断定する役・「それにお金払う？」と突っ込む読者役を並べるパネル形式も試す
- **完了条件**: 1回目を実施して記録が残り、型をスキル化するか（毎回呼べる形にするか）を決めている
- doboku-note にも同じカードを起票済み（同時に回す）

### [SCRIPT-GOOGLE-CLIENT-UNIFY-01] Google API の認証とクライアントの自前実装 15 ファイルを 1 か所にまとめる
タグ: [インフラ・計測] [種類:改善] [実行:対話] [起票:2026-10-20] [領域:管理]

- **2026-10-21 完了 (行削除は backlog-loop)**: 数え直すと自前で認証を組むファイルは 16 本 (トークン発行用の対話式ツール `adsense/oauth-setup.js` を含む) で、鍵の探し方は 4 通り (1 本は実行ディレクトリ基準、3 本は env を読まず CI が鍵を直下へ書き出す運用に依存)、自前の再試行は 0 本だった。googleapis の既定の再試行は 408・429・5xx を 3 回までだが対象は GET 等だけで POST を含まず (googleapis-common 8.0.3 / gaxios 7.1.3 のコードで確認)、GA4 の runReport・GSC の検索実績・URL 検査は一時的な失敗 1 回で欠損していた。正本を `.claude/scripts/lib/google-client.cjs` にし (鍵は env をメモリで渡し、無ければリポジトリ直下の `stats47-*.json` をファイル位置基準で読む。一時ファイルに書かない)、読み取り用クライアントは POST も再試行、GA4 Admin の書き込み用は GET 系だけを再試行する (作成は 1 回だけ送る)。15 本を置き換え、`metrics/lib/auth.mjs` の鍵の一時ファイル書き出しと、CI 2 本 (`fetch-metrics-weekly.yml`・`affiliate-ga4-weekly.yml`) の鍵ファイル書き出しを外した。`check-maintenance-debt.cjs` の `GOOGLE_AUTH_LOCAL` が正本の外の GoogleAuth・OAuth2・JWT を止める (例外は `oauth-setup.js` だけ)。検証: 置き換え前後で 12 本を同じ固定期間で read-only 実行し、時刻の項目を除いて出力が一致した (URL 検査 1 件だけ Google 側の状態が実行の間に変わり、旧方式と新方式で続けて照会して同じ応答を確認)。AdSense の 2 本はローカルに OAuth の資格情報が無く実行できず、テストだけで確認した。意図のテスト `lib/__tests__/google-client.test.cjs` (ローカルの HTTP サーバーへの実要求。再試行の設定を壊すと落ちることを確認) を PR CI の Contract Tests に配線。手順書の雛形は `SKILL-GOOGLE-SNIPPET-UNIFY-01` へ分けた。

- **背景 (2026-10-20 実測)**: `new GoogleAuth`・`google.auth.*`・`JWT(` を自前で書くスクリプトが 15 ファイル (metrics・gsc・google-admin・ads・note・sns・search-growth・lib) あり、GA4 の `runReport` を呼ぶファイルは 12。認証方式・スコープ・再試行がファイルごとに違い、資格情報の扱いを変えるたびに 15 か所を直すことになる。
- **次**: `RECORD-SCHEMA-CONTRACT-01`・`SCRIPT-ISO-WEEK-UNIFY-01` の後に、`.claude/scripts/metrics/lib/gsc-query.mjs`・`ga4-query.mjs` を土台にして、認証とクライアントの生成を `.claude/scripts/lib` の 1 モジュールへ寄せる。呼び出し側は 1 ファイルずつ置き換える。
- **停止条件**: 取得する値と記録の形を変えない。置き換えるたびに、既存のテストと 1 回の read-only 実行で同じ結果になることを確かめる。
- **完了条件**: Google API の認証を書くのが共通モジュールだけになり、新しい自前の実装を検査が止める。

### [SKILL-GOOGLE-SNIPPET-UNIFY-01] スキル手順書の Google API 認証の雛形を共通モジュールの呼び出しへ置き換える
タグ: [インフラ・計測] [種類:改善] [実行:対話] [起票:2026-10-21] [領域:管理]

- **2026-10-21 完了 (行削除は backlog-loop)**: 手順書 6 本 8 か所の雛形 (`fetch-gsc-data` 2・`fetch-ga4-data` 2・`inspect-url`・`submit-sitemap`・`fetch-adsense-data`・`blog/discover-trends/sources/gsc.md`) を `.claude/scripts/lib/google-client.cjs` の呼び出しに置き換え、単発の照会は `metrics/gsc-query.mjs`・`ga4-query.mjs` を先に案内した。sitemap の送信は書き込みスコープが要るので、共通モジュールに `createSearchConsoleWriteClient` (webmasters。送信の PUT は再送しない) を足し、テストで固定した。Codex 用の写し `.agents/skills/` は `sync-codex-mirror.cjs` で再生成した (5 ファイル)。`check-maintenance-debt.cjs` の `GOOGLE_AUTH_LOCAL` を `.claude/skills`・`.claude/agents` の Markdown にも広げた (写しは `--check` が同一を保証)。古い雛形を一時的に戻すと検出し、今は 0 件であることを確かめた。検証: 手順書から取り出した雛形を読み取りだけ実行し、GSC の検索実績・GA4・トレンド用の照会・URL 検査が実データを返した。AdSense はこの Mac に資格情報が無く、雛形どおりのエラーで止まることだけ確かめた。sitemap の送信は停止条件どおり実行せず、構文の検査だけ行った。

- **背景 (2026-10-21 実測)**: `SCRIPT-GOOGLE-CLIENT-UNIFY-01` でスクリプトの認証を `.claude/scripts/lib/google-client.cjs` に寄せたが、スキル手順書に鍵ファイル名を複製して `google.auth.GoogleAuth` / `OAuth2` を組む `node -e` の雛形が残っている (`.claude/skills/analytics/{fetch-gsc-data,fetch-ga4-data}/SKILL.md` に各 2、`{inspect-url,submit-sitemap,fetch-adsense-data}/SKILL.md` に各 1、`blog/discover-trends/sources/gsc.md` に 1、Codex 用の写し `.agents/skills/` に同じものが 7)。写して実行するたびに、再試行の無い自前の認証が生まれる。雛形は使い捨てでリポジトリに残らないので `check-maintenance-debt.cjs` の `GOOGLE_AUTH_LOCAL` (コードだけを見る) には掛からない。
- **次**: ① 読み取りの雛形を `createSearchConsoleClient()` / `createGa4DataClient()` / `createAdsenseClient()` の呼び出しに置き換え、ページ×検索語などの照会は `metrics/gsc-query.mjs`・`ga4-query.mjs` を案内する ② `submit-sitemap` は書き込みスコープ (`webmasters`) で sitemap を送信するので、共通モジュールに書き込み用の Search Console クライアント (変更は再試行しない) を足すか、雛形を残して理由を書くかを決める ③ `.agents/` の写しを同期の手順で更新する ④ 手順書に自前の認証が戻らないよう、検査の対象を Markdown のコード例へ広げるかを決める。
- **停止条件**: sitemap の送信など外部へ書き込む雛形は、置き換え後に実行して確かめない (送信はオーナーの承認が要る)。
- **完了条件**: スキル手順書の Google API の雛形が共通モジュールを使い、例外には理由が書かれている。

### [SCRIPT-LIB-CHECKJS-01] スクリプトの共通部品に型検査 (@ts-check と、範囲を絞った tsc --checkJs) をかける
タグ: [インフラ・計測] [種類:改善] [実行:対話] [起票:2026-10-20] [領域:管理]

- **2026-10-21 完了 (行削除は backlog-loop)**: `.claude/scripts/tsconfig.checkjs.json` (checkJs・strict なし) で `lib/`・`measurement/`・`metrics/lib/` の JS を型検査し、`npm run type-check:scripts` (root の type-check・pre-commit・CI の type-check job) に足した。最初の実測は 194 件 (strict にすると範囲内だけで 283 件。2026-10-21 実測) で、すべて挙動を変えずに直した。多かったのは、実装より狭い JSDoc (実装が読む引数のプロパティや返す項目が書かれていない) と、成功時と失敗時で形が混ざる値の受け取りで、どちらも型注釈で直した。`periods.d.mts` と `config/datasets.d.mts` には実装の export と項目の不足を足した (TS 側も読む宣言。全パッケージの `npm run type-check` は 25/25 で通過)。木曜の取得の経路 (`measurement/collect.mjs`・`vault.mjs`) は、10-22 の初回取得を変えないよう型注釈のコメントだけで直し、実行される呼び出しは変えていない。範囲外だが import で検査に入る kdp の 2 ファイル (ブラウザ内の DOM 操作) と、自動生成の単位の写し (生成器の見出しで) には、理由を書いた `// @ts-nocheck` を付けた。カードの題にある `// @ts-check` はファイルに付けない (付けると、import する strict の TS 側の検査でも strict で検査されるため。規約は `.claude/rules/coding-standards.md`)。範囲が縮まないことは `lib/__tests__/scripts-checkjs-scope.test.cjs` が固定し (glob の削除・範囲内の `@ts-nocheck` を止める)、PR CI の Preflight Aggregator Contract に配線した。存在しないプロパティの参照・glob の削除・範囲内の `@ts-nocheck` の 3 通りの壊れを入れて、それぞれ落ちることを確認した。関連テストは JS 538 件で失敗 0 (effect-verdict の既存の失敗 1 件は `EFFECT-VERDICT-CLI-TEST-SOURCES-01` のもので増えていない)。

- **背景 (2026-10-20 実測)**: サイト本体 (apps・packages) の tsconfig 25 個はすべて strict だが、`.claude/scripts` は 753 ファイル中 641 が型の無い JS (mjs 539・cjs 101) で、`@ts-check` は 0。計測・記録・改善を回す部品が型の外にある。
- **次**: 全部を TS に書き換えることはしない。共通部品 (`.claude/scripts/lib`・`measurement`・`metrics/lib` と、`SCRIPT-ISO-WEEK-UNIFY-01`・`SCRIPT-GOOGLE-CLIENT-UNIFY-01` で寄せた関数) に `// @ts-check` と JSDoc を付け、この範囲だけを対象にする tsconfig (allowJs・checkJs・noEmit) を作って `npm run type-check` に足す。重複を減らしてから型を付けるので、上の 2 枚の後に行う。
- **停止条件**: 型を通すために挙動を変えない。対象範囲は広げるだけで縮めない。
- **完了条件**: 対象範囲が型検査を通り、CI で検査されている。

### [AGENT-THIN-CROSSCUT-01] 全体に効く規約をエージェントの本文から paths 付き rules へ移し、本文を役割・入出力・担当に絞る
タグ: [エージェント・SSOT] [種類:改善] [実行:対話] [起票:2026-10-20] [領域:管理]

- **2026-10-21 完了 (行削除は backlog-loop)**: 本文を見出し単位で全 agent 横断に照合し、写しは 2 群だけだった (「記録から判断する」10 体、「教材の企画の受け取り」の共通 3 行 8 体。Output Contract・担当範囲は体ごとに中身が違う)。前者は `recorded-measurement-first.md`、後者は `reference-source-standards.md` §5 への 1 行参照に置き換え (企画の受け取りの体固有の 1 行目は残した)、§5 の `paths:` に 8 体を足した。写し直しは `check-agent-skill-consistency.cjs` の E13 (40 字以上の同じ行が 4 体以上。rule 参照の行は除く) が止める。HEAD の本文に当てると 4 行を検出し、現在は 0。スキル 4 本は固有の言い回し + rule 参照で、写しではなかった。検証: 整合検査 0 件・同テスト 21/21・codex mirror 一致・docs:check error 0・checkJs tsc 0・debt ratchet +0。
- **背景 (2026-10-20)**: 「記録から判断する」方針を 1 つ足すのに、エージェント 10 体とスキル 4 本を書き換えた。全体に効く規約がエージェントの本文に書き写されているので、規約を 1 つ変えるたびに多くのファイルを直すことになり、写し漏れは矛盾になる (同日の調査で、6 体の本文の手順が、後から足した記録の節と食い違っていた)。
- **次**: ① 複数のエージェントに同じ文言で載っている節を一覧にする (`.claude/scripts/lib/check-agent-skill-consistency.cjs` の走査を流用) ② それを paths 付き rules か hook へ移し、本文には参照の 1 行だけを残す ③ 同じ節を本文へ写し直すことを整合検査で止める。スクリプトの入口が固まった後に書き直すほうが 1 回で済むので、`SCRIPT-LIB-CHECKJS-01` の後に行う。
- **停止条件**: 担当範囲 (owner) と排他の書き手の記述は動かさない。系統は残す (2026-10-11 オーナー判断)。
- **完了条件**: 横断の節がエージェントの本文から無くなり、写し直しを検査が止める。

### [MODEL-USAGE-COVERAGE-01] エージェントの利用記録を Windows と CI の無人実行まで広げ、4 週分たまったら統合候補を決める
タグ: [エージェント・SSOT] [種類:改善] [実行:対話] [起票:2026-10-20] [領域:管理]

- **背景 (2026-10-20 実測)**: エージェントの定義は 61 体ある。Mac の利用記録 (`.claude/state/metrics/model-usage/local-mac.json`、W29〜W42 に Agent ツールで起動した分) で起動されたのは 6 種 (article-writer 11 回・blog-critic 8 回・note-critic 4 回など) で、57 体は記録上 0 回だった。ただし Windows の記録 (`local-windows.json`) は空で、CI の無人実行も数えていないので、「使われていない」とは判断できない。
- **次**: ① Windows で `.claude/scripts/model-usage/collect-local-usage.mjs` の記録が空になる原因を直す ② CI の無人 Claude (improvement-cycle など) の起動も同じ形で記録する ③ 4 週分たまったら、起動 0 回の体を統合候補として一覧にし、オーナーが決める。
- **停止条件**: 記録が 4 週分そろうまで、エージェントの定義を消さない。系統は残し、系統の中の重複だけを減らす (2026-10-11 オーナー判断)。
- **完了条件**: 3 環境の 4 週分の記録があり、統合候補の一覧とオーナーの判断が出ている。

### [X-METRICS-WEEKLY-RECORD-01] X の指標を週次で記録する定期実行を作り、管理画面を読みに行く操作を止める hook の対象に X を加える
タグ: [SNS・マーケ] [種類:改善] [実行:対話] [起票:2026-10-20] [領域:SNS]

- **背景 (2026-10-20)**: Instagram の指標は週次の CI (`sns-metrics-weekly.yml`) が記録するが、X の指標は `/update-sns-metrics --platform x` が browser-use でその都度取るしかない。同日に、セッションが管理画面を読みに行く操作を hook で止めたが、X は代わりに読む記録が無いので対象から外した。
- **次**: X の指標を週 1 回 (認証付き計測と同じ木曜の Mac) で `data/sns/metric-snapshots/` に記録し、`.claude/scripts/measurement/sources.mjs` の `readUrls` に X の分析画面を足す。
- **完了条件**: X の指標が週次で記録され、セッションがブラウザで取りに行く必要が無くなっている。

### [ASP-CONSOLIDATE-A8-RAKUTEN-01] アフィリエイトを A8 と楽天 (直接) に集約し、もしも・afb・バリューコマースの配信と計測を止める
タグ: [収益化] [種類:改善] [実行:対話] [起票:2026-10-19] [領域:アフィリエイト]

- **経緯 (2026-10-19 オーナー判断「集約しよう」)**: 全 ASP の確定収益が ¥0 で、もしも・afb・バリューコマースは配信量が誤差なのに認証付きの計測・照合・帰属確認の手間だけがかかっている。実測: A8 はクリック 8 月 257・9 月 157・10 月 276、成約 0 (`data/affiliate/a8-results.json`)。楽天 (直接) は 9 月 30・10 月 7 クリック、¥0 (`rakuten-results.json`)。もしもは提携 44 件・35 日 (09-14〜10-18) でクリック 1、¥0 (`moshimo-results.json`)。afb・バリューコマースは成果の記録なし。
- **外す広告 9 件 (`apps/web/scripts/affiliate-ads-data.ts`、すべて `isActive: true`)**:
  | ASP | id | 案件 | 位置 |
  |---|---|---|---|
  | バリューコマース | `af_ikyu_travel_001` | 一休.com 宿泊予約 | blog-bottom |
  | バリューコマース | `af_expedia_travel_001` | Expedia | blog-bottom |
  | afb | `af_afb_14567_001` | KOTORA (ハイクラス転職) | blog-bottom |
  | afb | `af_afb_15743_001` | 能セン (受験対策) | blog-bottom |
  | afb | `af_afb_16683_001` | おやここ (プロパンガス見直し) | blog-bottom |
  | もしも | `af_moshimo_tabechoku_1863_001` | 食べチョク | blog-bottom |
  | もしも | `af_moshimo_rakuten_travel_55_001` | 楽天トラベル 国内宿泊 | blog-bottom |
  | もしも | `af_moshimo_samurai_job_2228_pilot` | Samurai Job | sidebar-bottom |
  | もしも | `af_moshimo_techgo_6722_pilot` | テックゴー | sidebar-bottom |
  楽天トラベルは楽天 (直接) の `af_rakuten_travel_001` が残るので、旅行の枠は空かない。
- **次 (実行順)**: ① 上の 9 件の一覧をオーナーが確認する ② 9 件を `isActive: false` にし (削除はせず、履歴の照合に残す)、develop へ push して `publish-affiliate-ads.yml` で R2 へ公開し、本番の対象ページから消えたことを確かめる (デプロイ不要) ③ 計測から moshimo・afb を外す: `.claude/scripts/measurement/sources.mjs` の取得元・`collect-local.mjs` の afb キー読み込み・`measurement-session-refresh.sh` の moshimo・`authenticated-measurement.yml` と `affiliate-ga4-weekly.yml` の該当段・テストを同じ差分で直し、計測の鮮度 (`measurement-freshness`) の分母と月次ゴール「12/14」を新しい取得元数で書き直す ④ 提携の解除・アカウントの扱いは急がない (配信と計測を止めれば足りる)。
- **①② 済 (2026-10-19)**: オーナーが一覧を確認し「外して」。9 件を `isActive: false` にして develop へ push (`6f69fa2d2`)、`publish-affiliate-ads.yml` run 39258480944 が success (「git TS 313 件 = cloud 配信と完全一致」)。公開中の `https://storage.stats47.jp/app/affiliate-ads/all.json` で対象 9 件はすべて `isActive: false`。旧掲載先の本番 `/ranking/apple-consumption-expenditure`・`system-consultant-annual-income`・`travel-participation-rate-overnight` の HTML に moshimo・afi-b・valuecommerce は 0 件 (A8・楽天は表示)。変更前の HTML は取得していないので、「消えた」の根拠は R2 の状態と変更後の HTML だけ。**残りは ③ (計測から moshimo・afb を外す)**。
- **③ 済 (2026-10-20)**: 計測の取得元 (`sources.mjs`) から moshimo・afb を外し、`collect.mjs` の両分岐と afb の成果取得 (`afb-outcomes.mjs`・テスト)、`collect-local.mjs` の afb キー読み込みを削除。`authenticated-measurement.yml` の matrix から 2 行、`measurement-session-refresh.sh` と `affiliate-ga4-weekly.yml` の moshimo を外し、`auth-credentials.json` の moshimo を `ciCredential: false` にした。週次収益 (NSM) の内訳 (`nsm-revenue-lines.mjs`) は A8 と楽天の 2 行だけにした。計測の鮮度の分母は `latest.json` の取得元数から決まるので、次の計測から 14 → 12 になる (月次ゴール「12/14」は同じ欠測 2 件までなら「10/12」に当たる。`monthly.md` は `/monthly-plan` の担当なので書き換えていない)。テスト: 計測 70 件・metrics 204 件・workflow 方針 51 件が pass。
- **main へのマージまでの影響**: 定期実行は main の workflow 定義で develop のスクリプトを動かす。マージまでは main の matrix に残る moshimo・afb の収集ジョブが `unknown_source` で失敗する (集計の `summarize.mjs` は develop の取得元定義を使うので `latest.json` と鮮度の数字は 12 取得元で出る)。次の develop→main のマージ (オーナー承認) で解消する。
- **残り (急がない)**: GitHub Secrets `AFB_API_KEY`・`MEASUREMENT_SESSION_MOSHIMO`・`MEASUREMENT_SESSION_AFB`・`STATS47_AUTH_MOSHIMO_*` の削除と `env-registry.json` の 3 行の削除は、`MEASUREMENT-MAC-DIRECT-01` で CI の取得経路を撤去するときにまとめて行う。ASP の提携操作ツール (`.claude/scripts/ads/moshimo-*`・`afb-*`)、管理画面の表示、提携の解除はそのまま残す (配信と計測を止めれば足りる)。この 3 点が済んだらカードを削除する。
- **停止条件**: A8・楽天 (直接) の広告に触らない。②の前に計測を止めない (配信中の広告の成果が記録されなくなる)。
- **完了条件**: 本番の `app/affiliate-ads/all.json` で moshimo・afi-b・valuecommerce の広告が配信中 0 件、計測の定期実行が moshimo・afb を取得しようとせず、計測の鮮度の分母が更新され、使わなくなった Secrets が削除されている。


### [NOTE-PACKS-REPLACE-COCONALA-01] ココナラ撤退の後始末: データパックの有料 note 版 13 本を公開し、サイトの商品ページの行き先を note へ付け替える
タグ: [収益化] [種類:制作] [実行:windows] [起票:2026-10-19] [領域:商品]

- **経緯 (2026-10-19 オーナー判断)**: ココナラから撤退し、データ販売は note に集約する。同日、ココナラの 14 件を受付休止にした (ココナラに非公開の操作は無い。公開ページで「受付休止中」・「購入画面に進む」0 件を確認)。計測と週次収益の集計からもココナラを外した。ただし note でデータパックを買える状態にはまだない (有料の note 版 13 本は下書き。公開済みは無料の体験版 1 本だけ)。
- **なぜサイト側をまだ変えないか**: 出品台帳 (`config/coconala-listings.json`) を `withdrawn` にすると、`generate-product-storefront.ts` が商品ハブからココナラ商品を外し、`/products/data-p-XX` が無くなる。公開済みの note 記事のカードの多くがこのページへリンクしている (`data/note/card-visibility-latest.json` 等) ので、note 版の公開前に変えるとリンクが切れる。それまでは商品ページはココナラ (受付休止中) を指したままにする。
- **次 (実行順)**:
  1. **Windows PC** (販売中の納品版 `.local/coconala-products/P-XX/v2-20260906-r1/` があり、出品記録とハッシュが一致する PC。Mac で作り直すとハッシュ一致は 18 → 5 件に落ちる) で、13 パックを Windows / Mac の Office 365 で開き、表示・県図形の編集・チャートの編集・再計算を確認して記録する (旧 `COCONALA-PROFILE-OWNER-01` から移した作業)。
  2. `npm run products:note:validate` と、`note/cli.ts revision --revision <新版> --all` で販売準備の版を作り、記事ごとに価格・無料と有料の境界・添付をオーナーが確認する (規約 `.claude/rules/coconala-product-standards.md` の公開ゲート。一括公開しない)。
  3. 有料の note 版を公開する。添付の upload は 1 日 10 回までなので、2 日に分ける。
  4. 公開した note の URL を、商品ハブの行き先にする。`generate-product-storefront.ts` にデータパックの note 版の経路を足し、`/products/data-p-XX` と、ブログ・ランキングのデータ集の案内 (`storefront.ts`) が note を指すようにする。そのうえで出品台帳を `withdrawn` にし、`storefront.test.ts` を直してデプロイする。
- **禁止**: note 版の公開前に出品台帳を `withdrawn` にしない (サイトの商品ページが消え、note 記事のリンクが切れる)。下書きのまま販売準備完了と扱わない。
- **完了条件**: 有料の note 版 13 本が公開され、本番の `/products/data-p-01`〜`data-p-14` が note の記事へ案内し、`config/coconala-listings.json` の 14 件が `withdrawn`。


### [SEO-KEYWORD-EDITABLE-PATH-01] キーワード改善サイクルが ranking / themes の定義ファイルを見つけられず、改善案を自動適用できない
タグ: [エージェント・SSOT] [種類:不具合] [実行:sweep] [起票:2026-10-19] [領域:サイト]

- **経緯**: `.claude/scripts/search-growth/keyword-cycle.mjs` の `editableFile()` は `packages/data-configs/src/{metrics,theme-catalog}/<key>.ts` を探すが、この置き場はもう無い (2026-10-19 に `ls` で確認)。実際の定義は ranking が `data/metrics/<key>.ts`、テーマが `data/themes/catalogs/<key>.json` である。このため `/ranking/*`・`/themes/*` 向けの改善案はすべて `editableFile: null` となり、提案だけの PR になる (例: #1150 `/ranking/general-hospital-count` は 10-19 にブランチ整理で閉じた)。
- **次**: `editableFile()` を現在の置き場へ直す。テーマは JSON なので、置換処理が JSON を扱えるかも確かめる。
- **禁止**: 自動適用の対象を広げる目的で、検査や `validate:config` を緩めない。
- **完了条件**: `/ranking/general-hospital-count` と既存テーマ 1 件で `editableFile()` が実在ファイルを返すテストが通り、次回の `seo-keyword-cycle-daily` で ranking 向けの案が `editableFile` 付きで出る。
- **2026-10-19 修正**: `editableFile()` を `data/metrics/<key>.ts` と `data/themes/catalogs/<key>.json` へ直し、テスト (`keyword-cycle.test.mjs` の 3 件。修正前のコードでは置き場が無く null になり落ちる) を足した。16 件 PASS。**残り**: main へ入った後の `seo-keyword-cycle-daily` で、ranking 向けの案が `editableFile` 付きで出るかを確かめてからカードを削除する。

### [PV-100K-LEVERS-01] 月10万PV (28日 93,000) へ向けて、新規ページより「見えているのに取れていないクリック」と「1訪問のページ数」を動かす
タグ: [コンテンツ品質] [種類:改善] [実行:対話] [起票:2026-10-19] [期日:2027-01-31] [領域:サイト]

- **現状 (2026-10-19 実測、GSC 2026-W41 rolling28d 09-11〜10-08 / GA4 確定7日 W38〜W41 の和)**: 28日 PV 44,662。流入の 90% が検索 (Organic Search 40,024 PV)。GSC 28日クリック 12,263、PV/クリック 3.6、1セッション 1.92 ページ。面別: ranking 19,492 PV (表示あり 1,551 ページ・1 ページ 12.6 PV)、blog 10,561 (1,082 ページ・9.8)、municipalities 3,931 (**88 ページ・44.7**)、areas 4,069 (2,633 ページ・1.5)。クリックは上位 100 ページで 58%。順位 4〜15 位・表示 500 以上のページが 197 本あり、表示 277,342 に対しクリック 6,764 (CTR 2.4%、サイト平均 3.5%)。index 未登録は discovered 977 + crawled 373 (coverage 2026-W42)。Direct 4,838 セッションは直帰 83%・landing "(not set)" 1,360 セッションで bot 混入の疑いがあり、判定の分母に入れない。
- **方針**: マーケティング戦略の PV 内訳モデル (ranking 1 ページ 120 PV/月) に対し実測は 12.6 なので、供給拡大だけでは届かない。現在のペース (週 +815 クリック) では T2 到達は 2027-01 頃 (戦略の仮説と一致)。前倒しの打ち手を寄与の大きい順に並べる。想定値は現在の単価 (PV/ページ・PV/クリック) を維持できた場合の計算で、実績ではない。

  | # | レバー | 想定寄与 (28日 PV) | 時期 | 実行カード |
  |---|---|---|---|---|
  | 1 | 近接ページ 197 本の CTR 改善 (title 冒頭に答え・年・単位、同一品目の食い合い解消)。CTR 2.4→4.0% で +4,300 クリック | +15,000 | 11 月重点候補 | `SEO-CTR-CANDIDATES-01` (対象を 7→197 へ広げる) / `CONTENT-FOOD-TRIVIA-01` ② |
  | 2 | 市区町村ランキングの薄さ・ナビ修正と都道府県版との相互リンクで、表示を受けるページを 88→300 | +9,000 | 12 月 (`MUNI-PAGE-QUALITY-01` が先) | `MUNI-PAGE-QUALITY-01` / `MUNI-RANKING-EXPANSION-01` |
  | 3 | 回遊 1.92→2.3 ページ/セッション (ランディング上位 50 本の本文直下に同じ調査・同じ県の隣接指標。blog→ranking 893 に対し ranking→blog 520) | +9,000 | 11 月重点候補 (`NAV-CLICK-COVERAGE-01` W43 の計測が前提) | `KAIYU-HUB-01` / `NAV-CLICK-COVERAGE-01` |
  | 4 | index 未登録 1,350 のうち需要のある ranking を内部リンク・sitemap・再送信で回復 (+200 ページ × 12 PV) | +2,500 | 定常 | `GSC-COVERAGE-DEPLOY-01` |
  | 5 | 新記事は月 15〜20 本の上限内で、順位 4〜15 位のクエリに既存ページが無い主題へ当てる (新記事の平均 10 PV/本、当たり型は 300 超) | +3,000〜6,000 | 定常 | `CONTENT-FOOD-TRIVIA-01` / blog-seo-strategist |
  | 6 | areas 2,633 ページのうちクリック 0 を noindex か集約 (PV 増は 0。1・4 の効きを守る) | 0 | 12 月 | `RANK-THIN-01` の基準を areas にも適用 |

  合計 +38,000〜41,000 → 約 83,000〜86,000。残りは現在のトレンド (週 +815 クリック × 3.6) が 2〜3 か月続けば埋まる。
- **共通事業方針 (HARM)**: 読者の課題は「気になった品目・県の順位を検索し、一次統計の値をすぐ確かめたい」(M: 家計比較と雑学の関心)。提供価値は検索結果で答えが見え、1 ページ目で隣の指標へ行けること。支払う理由はこの段では無く、PV は AdSense の先行指標 (`site-pageviews`)。需要の証拠は順位 4〜15 位の表示 277k と市区町村面の 1 ページ 44 PV。次の検証は title 変更ページの 4 週後 CTR と、`nav_click` 計測後の 2 ページ目到達率。
- **月次計画との折り合い**: 10 月の重点 (管理・データ) は変えない。11 月の `/monthly-plan` で #1+#3 を 1 テーマの重点候補として判断する (マーケティング戦略の検証条項「里程標を下回れば回遊と CTR を重点候補に」と整合)。
- **停止条件**: #1 を 50 ページ変えて 4 週後 CTR が +0.5pt 未満なら title ではなく順位の問題なので #4・#6 へ振り替える。#2 で表示ページを増やしても 1 ページ当たり PV が 20 を割れば市区町村の拡大を止める。
- **完了条件**: `PV-PLAN-REVIEW-2026Q4-01` (2026-12-31) で W52 の里程標 79,000 と比べ、各レバーの実績 (変更日・4 週後の CTR / PV) がこのカードに記録されている。T2 ゲート (28日 93,000) 到達で閉じる。

### [MONETIZE-BROAD-ROLLOUT-01] 収益の打ち手 12 本を先に広く並走させ、4 週の配置別 CTR・成約・ad-yield で絞る (2026-10-19 オーナー指示「まず広く展開してから絞る」)
タグ: [収益化] [種類:改善] [実行:対話] [起票:2026-10-19] [期日:2026-12-31] [領域:アフィリエイト]

- **前提 (2026-10-19 実測)**: 28 日 PV 44,662 (GA4 Japan、W38〜W41) に対し、AdSense は停止前 W29〜W33 で CTR 0.69〜0.87%・GA4 PV 1,000 あたりクリック 5〜6・1,000 PV あたり ¥22 と **PV に比例**していた。制約はクリック率ではなく「広告が出る PV」(AdSense PV ÷ GA4 PV 54〜78%、リクエスト充足率 36〜45%、視認率 48〜57%) と単価 (CPC ¥4)。再開後 (10-11、手動枠 2 ユニット) の週次データは `data/adsense/snapshots/2026-W42/` 以降で判定する。アフィリエイトは GA4 7 日 (10-11〜10-17) で表示 7,082・クリック 8 (0.11%)、PV 1,000 あたり 0.7 クリック (AdSense の 1/8)、成約 0 (楽天 9 月 30 クリック 0 件・A8 10 月 30 クリック 0 件)。クリック 4 件 (`_all`) は article-inline 2・municipality-native 2 だけで、**ranking-sidebar 502・blog-sidebar 517・rakuten-sidebar 290 表示は 0 クリック** (表示の 6 割)。出典: `data/adsense/history.csv`、`data/affiliate/ga4-affiliate-history.csv`、`data/affiliate/{rakuten,a8}-results.json`、`docs/00_プロジェクト管理/03_マーケティング戦略.md`「広告収益との換算」。
- **方針**: 母数の無いものを先に落とさない。12 本を同じ表 (案件 × 位置 × 4 週) で並走させ、絞る規則を先に固定する。本番反映を伴うもの (B1・B5・C1・C2) はまとめて 1 回のデプロイにする (CLAUDE.md「デプロイは溜めて 1 回」)。

  | # | 打ち手 | 読者との接続 | 手間 | 判定指標・窓 | 実行カード / owner |
  |---|---|---|---|---|---|
  | A1 | AdSense 手動枠を全面 (11 ユニット) に戻す (今は 2) | 停止前は PV 比例 | S | `ad-yield` (円/1,000 GA4 PV) 4 週 | `ADSENSE-PLACEMENT-01` (improvements) |
  | A2 | 自動広告の再開。前提: 出典文言の書き換え事故 (2026-08) が `google-anno-skip` で遮断されていることを `third-party-dom-injection` smoke で確認 | 停止前の ¥22 の大半は自動広告 (手動のみ ¥6.7) | S | 同上。書き換え再発 0 件 | `ADSENSE-AD-INTENTS-TEST-01` の判断 (11-26) と同時 |
  | A3 | 表示率の改善: 遅延読込の位置と first-view の 1 枠で imp/PV 0.88→1.2・視認率 60% | 広告が出る PV が少ないのが制約 | M | AdSense `IMPRESSIONS`/GA4 PV・`ACTIVE_VIEW_VIEWABILITY` 4 週 | 新規 (performance-auditor と affiliate-manager) |
  | B1 | 物販 (食の特産): 消費量ランキング上位 40 品目の入口ページに楽天 / Amazon の商品カード | 検索クリックの 27% が食の雑学。楽天カード CTR 0.40〜0.46% (平均の 3 倍、4 クリックで判定不能) | S | 28 日でクリック 50 以上・成約 1 以上 | `AMAZON-ASSOCIATE-PILOT-01` (PR #1099 本番反映待ち) |
  | B2 | ふるさと納税: 特産・農産・水産のランキングに県の返礼品リンク (furusato 枠は 7 日 253 表示 0 クリック = 掲載面が合っていない可能性) | 「1 位の県の味」に最も近い購買 (M+R) | S | 品目ページへ移して 4 週の配置別 CTR | affiliate-manager (在庫の vertical `furusato` を流用) |
  | B3 | 地域系案件 (引越し・旅行・移住) を areas・住みやすさ・子育てのランキングに限定配信 | 住みやすい県 表示 8,214・childcare 1,989 の意思決定文脈 | S | 配置別 CTR 4 週 | `AFF-INTENT-FALLBACK-STOP-01` の配信条件を流用 |
  | B4 | 金融を家計・所得面に限定 (可処分所得クエリ 166 表示) | M の中核 | S | 同上 | `AFF-SMBC-NL-01`、`AFF-A8-EXPANSION-2026-10` |
  | B5 | サイドバー・ネイティブ枠 (7 日 1,300 表示 0 クリック) を止めるのではなく、本文中・市区町村面 (クリックが出た 2 位置) へ移す | 見せても押されない枠が表示の 6 割 | S | 移設後 4 週の位置別 CTR | `AFF-SLOT-REDUCTION-01` |
  | C1 | 自社商品の導線: ランキング末尾「作り方」1 行 → Claude Code 連載 → note 有料 (実装済み・未デプロイ) | 雑学読者の「自分でも作りたい」層 | 済 | `nav_surface=ranking_making_of` 4 週クリック → 商品ページ到達率 | `RANKING-MAKING-OF-LINK-01` |
  | C2 | データ DL 商品の導線 (CSV/KML/地図用 → ココナラ・note)。file_download は週 300 超 (米・睡眠・味噌…) | 既に DL 需要がある | S | DL 後の商品ページ遷移率 | `PRODUCT-FUNNEL-DEPLOY-01`、`NOTE-KML-FUNNEL-01` |
  | C3 | Kindle 既刊 12 冊への導線を該当カテゴリのランキングに | 商品は既にある | S | KDP 販売数 4 週 (計測の再認証が前提) | `KDP-LEDGER-AUTO-01`、`AMAZON-ASSOCIATE-PILOT-01` |
  | D1 | スポンサー・データ提供 (B2B): 自治体・不動産・メディア向け「県別データの引用・埋め込み」ページと問い合わせ口 | AI Assistant 流入が 1 セッション 3.3 PV と最も深く、引用需要の兆し (205 セッション) | M | 問い合わせ件数 8 週 | 新規 (strategy-advisor がオーナー確認) |

- **今のデータで既に言えること**: (a) 判定済み「出ない」= サイドバー・ネイティブの汎用案件 (8〜10 月を通じ 0.02〜0.22%・成約 0)。絞る対象ではなく B5 で位置を変えて再測定。(b) 判定済み「出る」= AdSense は PV 比例。再開後の `ad-yield` 1 点で A1/A2 の順番が決まる。(c) 判定不能 (母数不足) = 物販 (4 クリック)、Kindle・ココナラ (認証切れ `MEASUREMENT-AUTH-RESTORE-01`)、自社導線 (未デプロイ)。これらは落とさず、まず母数を作る。
- **絞る規則 (先に固定)**: ① 全件を `data/affiliate/ga4-affiliate-history.csv` の位置別・vertical 別の形で 4 週記録する。② 4 週後、表示 2,000 以上で **CTR 0.2% 未満かつ成約 0** の組 (案件 × 位置) は止める。0.2% 以上は `AFF-OFFER-ROTATION-01` の 2 週ローテで案件を入れ替えて続ける。③ AdSense は `ad-yield` ¥15/1,000 PV を境に、A2 (自動広告) を入れるか A1 (手動のみ) で行くかを決める。④ 商品導線 (C) は収益ではなく「導線クリック → 商品ページ到達率」で先に判定し、1% 未満の面は外す。⑤ 表示 2,000 に届かない組は判定せず `insufficient-sample` として次の 4 週へ持ち越す (`evidence-based-judgment.md` の 5 ガード)。
- **共通事業方針 (HARM)**: 読者の課題は「1 位の県の味を試したい・贈りたい」(B1・B2、M+R)、「住む県・子育ての県を決めたい」(B3、M+R)、「家計を比べて見直したい」(B4、M)、「同じデータを自分でも作りたい」(C、A)。雑学の閲覧そのものは対象外で、広告 (A) は読者が払わない換金。支払う理由の証拠は未確認 (成約 0)。需要の証拠は食の検索クリック 27%・楽天カード CTR 0.4%・file_download 週 300 超。次の検証は上の 4 週表。年収などテーマ名から購入意図を推定しない (application.json)。
- **月次計画との衝突**: 10 月の `monthly.md` は「アフィリエイトの枠・案件の追加はしない」「AdSense の配置設計は 11 月以降」。本カードはそれを上書きするオーナー判断 (2026-10-19) として起票する。開始時期は **11 月の `/monthly-plan` で重点候補として判断する**か、**10 月中に始める (monthly.md の「今月やらないこと」を改訂)** かをオーナーが決める。A2 (自動広告) は出典書き換えの再発確認を通らない限り始めない。
- **2026-10-19 オーナー判断 (新規展開は保留)**: アフィリエイトの案件・枠の追加 (B1〜B5・C3) は、PV が伸びるまで保留する。理由は、汎用案件が 8〜10 月を通じてクリック率 0.02〜0.22%・成約 0、楽天が 9 月確定 ¥0、A8 も確定収益を確認できていないうえ、今の PV (28 日 44,662) では判定ライン (表示 2,000・成約あり) に届く組がほとんど作れず、登録・承認確認・計測の作業コストに見合わないこと。申請済みの A8 21 件と三井住友カード NL は承認を待つだけにして、登録・配置は増やさない。A1・A2 は `ADSENSE-PLACEMENT-01` の基準値 (11-13 まで) の後に判断する。代わりに PV を増やす `PV-100K-LEVERS-01` #1 (`SEO-CTR-CANDIDATES-01`) を先に進める。再開の判断は 11 月の `/monthly-plan` で、W41 比で 28 日 PV がどれだけ伸びたかを見て行う。
- **停止条件**: 出典の文言が広告リンクへ書き換えられる事象が 1 件でも再現したら A2 を即停止。広告・導線を一括で全ページに出さない (面を限定して配置別に測る)。PR 表記・景表法の表示は `affiliate-ads-standards.md` を崩さない。表示 2,000 未満の組を「出ない」と判定しない。
- **完了条件**: 12 本それぞれに「開始日・面・位置・4 週の表示 / クリック / 成約 (または到達率)・続行 / 停止」が記録され、絞った後の構成が `02_収益化戦略.md` §3 と `improvements.md` (効果観測が続くもの) へ引き渡されている。2026-12-31 の `PV-PLAN-REVIEW-2026Q4-01` と同じ回で見直す。

### [ADSENSE-AD-INTENTS-TEST-01] Google が自動で始めた広告インテントのテスト (12/3 終了・自動適用オン) の結果を見て、続けるか止めるかを決める
タグ: [収益化] [種類:意思決定] [実行:ユーザー] [起票:2026-10-19] [期日:2026-11-26] [領域:アフィリエイト]

- **事象 (2026-10-19、Claude in Chrome で AdSense の「テスト」画面を読み取り)**: Google が作成したテスト「Ad intents」(種類 = 自動広告、stats47.jp) が 2026-10-13〜12-03 の予定で、来訪者の 50% に広告インテントを適用している。途中結果はオリジナル ¥42・パターン ¥37 (-13%、表示回数 4,136。Google は「現時点で判断することはおすすめしない」と表示)。**自動適用がオン**なので、終了時に Google の判定で勝った方がサイト全体に適用される。
- **オーナー判断 (2026-10-19)**: テストはそのまま続け、結果を見てから決める。
- **注意**: 広告インテントはサイトの規約でオフに保つことにしている (8 月に自動広告が出典の文字を広告リンクに書き換えた事故のため)。`app/layout.tsx` と `app/global-error.tsx` の `<body>` に `google-anno-skip` を常に付けているので、パターン側でも挿入は止まっている可能性が高く、差が出ていないかもしれない。
- **次**: 11-26 までにテスト画面の結果 (収益・表示回数・Google の判定) を読み、(a) パターンが勝っていても広告インテントを使わないなら「オリジナルを選択」で終える (b) 使うなら `google-anno-skip` の扱いと出典の書き換えの再発確認 (`third-party-dom-injection` の smoke) を先に決める。何もしないと 12/3 に自動適用される。
- **関連**: AdSense の最適化案 5 件の扱い (2026-10-19 推奨案): アンカー広告と全画面広告は 1 つずつ A/B テスト、ページ内広告と広告インテントはしない、sellers.json の透明化は公開される名前を確かめてから。アンカー広告のテストは作れない: 10-19 に作成画面まで進めたところ、stats47.jp の設定画面に「テストを実施しています。設定を編集するには、テストを終了する必要があります。」と出た (1 サイトに同時に 1 つのテストだけ)。広告インテントのテストを終えるまで (12/3、または途中で「オリジナルを選択」) アンカー広告・全画面広告の A/B は始められない。テスト側のパターンは「自動広告オン・インテント重視 1/1・オーバーレイ 0/3・ページ内 0/2」で、元の設定は「自動最適化オン・自動広告オフ」。広告の配置の判断は `ADSENSE-PLACEMENT-01` (11-13) のベースラインの後。
- **完了条件**: テストを終えた (オリジナルかパターンを選んだ) か、自動適用の結果を確かめて、その判断と理由をこのカードの削除コミットに書いた。

### [AFF-SMBC-NL-01] 三井住友カード（NL）を A8 で提携し、家計・所得のランキングに限って配信する
タグ: [収益化] [種類:改善] [実行:対話] [起票:2026-10-19] [領域:アフィリエイト]

- **経緯 (2026-10-19 オーナー指示)**: A8 のクレジットカード・口座開設の検索 (73 件、申請なしで単価・EPC・確定率を収集) で、個人向けの確定 EPC が最も高かった (報酬 ¥4,800・EPC ¥578・確定率 30%・確定 EPC ¥174。A8 全体の平均で stats47 の実績ではない)。10 月の月次計画ではアフィリエイトの案件追加を 11 月へ送っていたが、オーナーの指示でこの 1 件だけ進める。
- **済 (2026-10-19)**: 台帳へ候補登録 → A8 で提携申請 (申請サイト = 統計で見る都道府県、`a8-browser.ts apply --id s00000023355003`)。状態は applied (審査待ち)。成果条件は「WEB 申込後 30 日以内のカード発行」(行動負担 F4・decision レーン)。証拠 `.local/a8-offer-inspect/s00000023355003-*.txt`。
- **広告主の条件 (案件詳細の備考)**: 承認の前に、バナーを載せるページの URL をすべて A8 のフォーム (記事なし・バナーのみ: https://pub.a8.net/a8v2/asApplicationInputAction.do?viewId=MTUwNDI) から提出する。登録したページ以外への掲載・SNS・リスティング・独自特典は禁止。広告と分かる表示が必要。ほかの ASP で提携済みなら提携不可。
- **掲載ページの候補 (28 日の GSC 表示)**: `dual-income-household-ratio` 868 / `real-disposable-income` 593 / `engel-coefficient` 279 / `gini-coefficient-disposable-income` 115 / `annual-income-per-household` 24 / `consumption-expenditure-total` 10。職業別年収は転職の意図なので外した。
- **済 (2026-10-19 URL 提出)**: オーナー承認のうえ asp-scout が「【三井住友カード】広告掲載ページ（バナー広告のみ）報告フォーム」(対象プログラム 22-0511) に、サイト名「統計で見る都道府県」・上の候補 6 ページの URL・掲載方法の補足 (各ページ 1 枠・記事なし・PR 表記・SNS とリスティングは使わない) を入力して送信した。完了画面「応募完了しました」(`.local/playwright-a8-debug/smbc-form-complete.png`)。
- **次 (実行順)**: ① (済) ② `check-approval` で承認を確かめる ③ `harvest --id` で広告コードを取り、案件プロファイル (`affiliate-offer-profiles-data.ts`、lane=decision・F4・allowedPageTypes=ranking) と広告 (`affiliate-ads-data.ts`、`targetRankingKeys` を提出したページだけに限定) を登録 ④ develop へ push して `publish-affiliate-ads.yml` で R2 へ公開し、本番の対象ページだけにバナーが出て、ほかのページに出ないことを確かめる。
- **停止条件**: 提出していないページに出る設定 (`targetRankingKeys` なし) で登録しない。承認前にバナーを置かない。
- **完了条件**: 提出したページの本番 HTML に広告が出て、それ以外のページに出ない。効果の観測は improvements の別 ID (`[kpi: affiliate-yield]`) へ引き渡す。



### [AFF-A8-EXPANSION-2026-10] A8 の個人向け高 EPC 案件を提携し、対象ランキングに限って配信する (2026-10-19 オーナー指示)
タグ: [収益化] [種類:改善] [実行:対話] [起票:2026-10-19] [領域:アフィリエイト]

- **経緯**: オーナー指示「提携できるものは提携して、サイトに展開」。A8 の全ジャンル巡回とキーワード検索 (保険・電気料金・車買取・転職・通信教育など 15 語) と金融系の検索を合わせ、既存の台帳と突き合わせて 572 件を整理した (確定 EPC = EPC × 確定率。A8 全体の平均で stats47 の実績ではない)。法人向け・美容医療・融資・投資勧誘・婚活・占い・探偵・FX と、doboku-note との共用案件は除いた。10 月の月次計画ではアフィリエイトの案件追加を 11 月へ送っていたが、オーナーの指示を優先した。
- **申請済み (2026-10-19、21 件、申請サイト = 統計で見る都道府県、即時承認 0 件)**: 保険見直し本舗 `s00000027364001`・オクトパスエナジー `s00000026570001`・リボンエナジー `s00000026564001`・TERASEL `s00000027407001`・東邦ガス `s00000024208001`・カテエネ `s00000026369001`・MOTA 車買取 `s00000000076017`・車買取ソコカラ `s00000027197001`・キャリアチケット `s00000011866027`・LHH `s00000026941002`・ファミキャリ `s00000019744001`・ヒュープロ `s00000023662001`・マイナビジョブ20's `s00000027373001`・LIBZ `s00000015285002`・ランスタッド障がい者 `s00000019113003`・パーソルドライバー `s00000026823002`・HIGHFIVE `s00000025215001`・Winスクール `s00000023621002`・家庭教師の銀河 `s00000021891001`・東進オンライン学校 `s00000021497001`・トウコベ `s00000022646001`。
- **登録済み (2026-10-19、コミット `5410e2285`)**: 提携済みで未配信の個人向け 15 件のうち 13 件を、案件プロファイル (全件 decision レーン・F3/F4・allowedPageTypes=ranking) と広告 (300×250・1 案件 1 エントリ・`targetRankingKeys` を実在 key 2〜8 件に限定) に登録した。保険相談 4 (ガーデン 3・みんなの生命保険アドバイザー)・教育 4 (Z会・WAM・なるには進学・シアーミュージック)・住宅 2 (リショップナビ外壁塗装・持ち家計画)・通信 3 (ビッグローブ光・VisionWiMAX・SoftBank Air)。BBIQ (九州のみ) と創建リフォーム (関東・関西 13 都府県のみ・エリア外は否認) は、地域で絞る手段が無いので見送った。全件 `inspect-offer` で事前手続きが不要なことを確かめた。4 ゲート・型検査・プロファイル監査は通過。
- **公開と本番確認 (2026-10-19)**: develop へ push し `publish-affiliate-ads.yml` (run 39218494350・39220151882) で R2 へ公開、`app/affiliate-ads/all.json` に 13 件すべてが入った。広告は「ページの意図軸 = 広告の軸」かつ「対象ランキング」のときだけ出るので、本番と同じ判定で対象ページの軸を計算した。対象 53 ページのうち 17 ページは家計調査 (furusato の軸で A8 を出さない) で出ない。Z会・WAM・SoftBank Air は軸の合う対象が 0 件だったので、教育の軸 (学力調査・中学校生徒数) と通信の軸 (ブロードバンド契約数・インターネット利用率) のページを足した (`e3b8d12fe`)。本番 HTML で、ガーデン貯蓄相談は `real-disposable-income`、ビッグローブ光は `broadband-service-contract-count`、Z会は `national-assessment-elementary-tutoring-rate` に出て、対象外の `annual-sunshine-duration` には出ないことを確かめた。
- **次 (実行順)**: ① 登録分を確かめて develop へ push し `publish-affiliate-ads.yml` で R2 へ公開、対象ページだけに出ることを本番で確かめる ② 週次の `check-approval` で申請 21 件の承認を拾い、承認されたものから同じ手順で登録する (掲載 URL の事前提出などを求める案件は、三井住友カードと同じく先に提出する)。
- **停止条件**: `targetRankingKeys` なしで decision レーンの案件を登録しない。広告主が求める事前手続きを済ませずに配信しない。
- **完了条件**: 承認済みの対象案件が本番の対象ページに出て、ほかのページに出ない。効果の観測は improvements の別 ID (`[kpi: affiliate-yield]`) へ引き渡す。
### [NOTE-CIRCULATION-LINK-FIX-01] note 公開記事のリンク切れ 5 件と導線の欠けを直す
タグ: [コンテンツ品質] [種類:不具合] [実行:対話] [起票:2026-10-18] [領域:SNS]

- **事象**: note 回遊の週次監査 #1149 (2026-10-18・run 39094551255)。error 5 件はリンク切れ (`broken_site_link`): `b-hotel-rooms-nara`・`d-engel-coefficient-income`・`d-kakei-spending-personality`・`koumuin-shigoto-kouritsuka-ai` ほか。warning 225 件は http リンク・リダイレクト・無料部分のマガジン導線の欠け (`missing_magazine_link_in_free_body`)・カード前後の余分な空行 (173 記事、`NOTE-CARD-REPAIR-01` が担当)。
- **次**: リンク切れの行き先を stats47 の現行 URL で引き直し、置換案をオーナーに見せる。公開済み記事の本文変更は note への外部変更なので、承認後に PUT パッチで直す。この Mac からは 2026-10-18 時点で note が HTTP 403 のため、解けてから行う。
- **完了条件**: note 回遊の週次監査で error 0 件になり #1149 が閉じる。

### [IG-CAPTION-DUP-1021-01] 10-21 予約の Instagram 相関投稿のキャプションで同じ相関係数を 2 回書いている
タグ: [SNS・マーケ] [種類:不具合] [実行:対話] [起票:2026-10-18] [期日:2026-10-20] [領域:SNS]

- **2026-10-21 完了 (行削除は backlog-loop)**: オーナー承認 (同日チャット) のうえ、後半を「相関は因果関係を示しません。」だけにした文を R2 `stats47` の `sns/correlation-carousel/fish-pickled-consumption-expenditure--average-temperature/instagram/caption.txt` に書き (09:3x JST)、公開 URL の読み直しで書いた内容と一致・`r=-0.69` が 1 回だけを確認した (公開 URL は `max-age=0`・`DYNAMIC` でキャッシュされない)。投稿台帳 1097 の caption も store 経由で同じ文にした (承認・status・予約時刻は不変。承認は本文のハッシュに結び付いていない)。#1145 は次の予約画像確認で閉じる。同じ重複が生成元にあり 10-28 の 1105 にも出ているので `IG-CAPTION-DUP-GENERATOR-01` へ分けた。
- **事象**: 予約投稿の週次確認 #1145 (2026-10-17)。2026-10-21 19:00 の `fish-pickled-consumption-expenditure--average-temperature` のキャプションで「人口の影響を除くと r=-0.69」が冒頭の括弧書きと後半の注意書きの 2 箇所に出る。
- **次**: 後半を「相関は因果関係を示しません。」だけにした文案をオーナーに見せ、承認を得てから R2 の `caption.txt` と投稿台帳の caption を同じ文に差し替える (予約済みの投稿本文の変更なので承認を挟む)。
- **完了条件**: 10-21 19:00 より前にキャプションの重複が消え、次の予約画像確認で #1145 が閉じる。


### [IG-CAPTION-DUP-GENERATOR-01] 相関カルーセルのキャプション生成が偏相関を 2 回書く。生成元を直し、10-28 予約の 1105 を差し替える
タグ: [SNS・マーケ] [種類:不具合] [実行:対話] [起票:2026-10-21] [期日:2026-10-27] [領域:SNS]

- **2026-10-21 完了 (行削除は backlog-loop)**: ② オーナー承認 (同日チャット) のうえ、1105 の後半を「相関は因果関係を示しません。」だけにした文を R2 `stats47` の `sns/correlation-carousel/actual-income-worker-households-per-month--accommodation-consumption-expenditure/instagram/caption.txt` に書き、公開 URL の読み直しで一致・`r=0.72` が 1 回だけを確認した。書く前に R2 が案の作成時から変わっていないことも照合した。台帳 1105 の caption も store 経由で同じ文にした (承認・status・予約時刻 10-28 19:00 は不変)。未投稿の相関カルーセルに重複の残りは無い (1133・1134 は手書きで重複なし)。
- **2026-10-21 ① 済**: キャプションの相関の段を `correlation-carousel-core.ts` の `buildCaptionCorrelationLines` (注意書きは固定文言 `CAUSATION_DISCLAIMER` だけ) に移し、`render-ig-carousel.ts` から呼ぶ。4 枚目の画像の `buildCautionLine` は不変。テスト 26/26 (旧文言に戻すと新テストが落ちることを確認)・`.claude/scripts` の tsc 0。残りは ② の 1105 (オーナー承認待ち)。
- **事象 (2026-10-21 実測)**: `.claude/scripts/sns/render-ig-carousel.ts` の `buildCorrelationCaption` が「相関係数 r=…（人口の影響を除くと r=…）」の行と、`spec.caution` (`correlation-carousel-core.ts` が「相関は因果関係を示しません。人口の影響を除くと r=…」を作る。4 枚目の画像の文言) の両方をキャプションに入れる。未投稿の相関カルーセルでは 2026-10-28 19:00 の 1105 (`actual-income-worker-households-per-month--accommodation-consumption-expenditure`) が「人口の影響を除くと r=0.72」を 2 回含む (1133・1134 は手書きの caption で重複なし)。
- **次**: ① キャプションでは `spec.caution` の代わりに「相関は因果関係を示しません。」を出す (4 枚目の画像の文言は変えない)。テストで偏相関の値がキャプションに 1 回だけ出ることを固定する ② 1105 の後半を同じ文にした案をオーナーに見せ、承認後に R2 の `caption.txt` と台帳を差し替える (予約済みの本文変更なので承認を挟む)。
- **完了条件**: 生成したキャプションで偏相関が 1 回だけになり、1105 の R2 と台帳の caption が重複なしで一致している (10-28 19:00 より前)。

### [NOTE-HOWTO-OWNER-CHECK-01] 別PCでマイマップとExcelの表示を確かめ、H-01・#9・#11 の画像を撮る
タグ: [SNS・マーケ] [種類:制作] [実行:別環境] [起票:2026-10-18] [期日:2026-10-25] [領域:商品]

- **なぜ別PCか**: 2026-10-18 に Mac で試したが、Microsoft Excel が入っておらず、Claude in Chrome も未接続でマイマップを操作できなかった (コンピュータ操作では Chrome はクリックできない)。3 本とも note-critic が「実機で確かめるまで公開しない」とした (`NOTE-HOWTO-SERIES-01`)。
- **前提**: 別PCで `git pull` (この Mac の未 push のコミットが develop に入っていること) → `npm run note:article -- checkout <key>` で作業コピーを取り出す。対象は `h-howto-mymaps-kml` (H-01)・`h-howto-mymaps-share` (#9)・`h-howto-excel-filled-map` (#11)。
- **確かめること・撮る画面**:
  1. H-01: 総人口の KML (`https://stats47.jp/api/ranking/total-population/download?format=kml&basis=original`、47 県・2.5MB) をマイマップに「インポート」。①「インポート」の位置 ②読み込み後の地図 ③県をクリックした吹き出し。県ごとに 5 段階の色が付くか、吹き出しに値・順位・時点・URL が出るか
  2. #9: ①「共有」の画面 (「リンクの共有を許可する」「地図を公開する」) ②メニューの「自分のサイトに埋め込む」。確定ボタンが「完了」と「変更を保存」のどちらか。**「地図を公開する」は押さない** (誰でも検索できる状態になる)
  3. #11: Microsoft 365 の Excel で総人口の CSV (ランキングページの「ダウンロード」) から地図を作る。①「データ型」→「地理」の変換後のセル ②完成した地図。47 都道府県が全部塗られるか、「?」や候補選択が出るか、「国」列 (日本) が無くても塗られるかを比べる
- **反映**: 画像を各作業コピーの `images/` に置き、本文の手順を結果に合わせて直して `npm run note:article -- save <key>`。結果が原稿と違う場合 (色が付かない・認識されない県がある) は公開せず、KML 側の修正 (`apps/web/src/lib/download/build-map-download.ts`) も検討する。Claude に渡す場合は画像と結果をチャットに貼る。
- **完了条件**: 3 本の画像と確認結果が作業コピーに入り、R2 に保存された。note-critic の再レビューで PASS。公開はその後に 1 本ずつオーナーが判断する。


### [KML-DOCUMENT-NAME-01] 地図用 KML の文書名を指標キーではなく日本語の指標名にする
タグ: [UI・UX] [種類:改善] [実行:sweep] [起票:2026-10-18] [領域:サイト]

- **2026-10-21 完了 (行削除は backlog-loop)**: ダウンロード route が `readRankingItemFromR2` で item.json を 1 件だけ読み、KML の文書名と GeoJSON の各地物の `title` に表示名を使う (読めなければ従来どおり指標キー)。route テストで「<Document><name>総人口（2025年）</name>」と GeoJSON の title を固定。本番は未デプロイ。
- **経緯**: 2026-10-18 の note-critic レビューで指摘。本番の KML の `<Document><name>` が「total-population（2025年）」のように指標キーのままで、Google マイマップに読み込むとレイヤ名が英語になる。`apps/web/src/lib/download/build-map-download.ts` の `buildMapKml` が `meta.rankingKey` を名前に使っているため。
- **次**: ダウンロード route でランキングの表示名を取得して `meta` に渡し、文書名と GeoJSON の properties に使う (route の読み込みが重くならない取得方法を選ぶ)。
- **完了条件**: 総人口の KML の文書名が「総人口（2025年）」になり、route テストで固定した。

### [CRITIC-VERDICT-RULE-01] critic の REVISE 判定の基準を、共通プロトコルと note-critic の定義で揃える
タグ: [エージェント・SSOT] [種類:不具合] [実行:sweep] [起票:2026-10-18] [領域:管理]

- **2026-10-21 完了 (行削除は backlog-loop)**: 4 つの定義を照合すると、共通プロトコル・blog-critic・ranking-content-critic は「BLOCK が 1 件でもあれば REVISE」で、note-critic だけが「blocker か major」だった。オーナーの包括指示 (同日「推奨案でやり切って」) に従い多数側へ揃え、note-critic の重大度を `BLOCK/MAJOR/MINOR` に改め「BLOCK が 1 件でもあれば `verdict: REVISE`、無ければ `PASS`。MAJOR は判定を変えないが、author は公開前に直す」とした。blog-critic の文も同じ文言にした。重大度ラベルを読むスクリプトは無いことを grep で確認。codex mirror 再生成・整合検査 0 件。
- **経緯**: 2026-10-18 の note-critic レビューで指摘。`.claude/rules/critic-review-protocol.md` は「BLOCK が 1 件でもあれば REVISE」、`.claude/agents/note-critic.md` は「blocker か major があれば REVISE」と書いており、同じ指摘で判定が変わりうる。今回は note-critic.md に従って major で REVISE になった。
- **次**: どちらを正にするか決めて片方を直す (major を公開前に直させたいなら protocol 側を直す)。blog-critic・ranking-content-critic の定義も同じ基準か確かめる。
- **完了条件**: 3 つの critic と共通プロトコルの REVISE 条件が同じ文言になった。

### [UI-FIX-RANKING-OLD-2YEARS-20261018] UI 是正: ranking--old-2years の週次 UI 検査の指摘 1 件を直す

タグ: [UI・UX] [種類:不具合] [実行:sweep] [検証:npx tsx .claude/scripts/page-quality/ui-findings.ts --assert-handled data/page-quality/backlog-batches/UI-FIX-RANKING-OLD-2YEARS-20261018.txt] [起票:2026-10-18] [領域:サイト]

- **2026-10-21 完了 (行削除は backlog-loop)**: 本番 (`/ranking/national-pension-full-exemption-rate`) を 1280・1440px で測ると、順位表の列幅の合計 410px (順位 60・都道府県 150・値 120・偏差値 80) が右カラムの枠 380px を超えていた (1024px は枠 554px で収まる)。最も長い県名は 52px なので都道府県を 100px にし、列幅を `RANKING_TABLE_COLUMN_WIDTHS` に出して合計が枠 380px 以下であることをテストで固定した。本番ページに同じ幅を当てると表 380px・最右セルの右端が枠と一致した。design-system:check 通過。見出し近くに年が無い指摘は全ランキングの見出しに関わるので `RANKING-HEADING-YEAR-DECISION-01` へ回し、`--mark-owner` を付けた。未デプロイ。
- **自動起票**: 週次のページ品質監査 (`page-quality-audit-weekly.yml`) の結果から `ui-findings.ts --sync` が作った。対象の一覧は `data/page-quality/backlog-batches/UI-FIX-RANKING-OLD-2YEARS-20261018.txt`、状態は `data/page-quality/ui-findings-queue.json`。正典は `.claude/rules/page-quality-standards.md`「UI 指摘のループ」。
- **スクショ (最新の週次)**: [mobile-390](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking--old-2years-mobile-390.png) / [desktop-1440](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking--old-2years-desktop-1440.png)。検査の詳細は `data/page-quality/metrics/LATEST.md`。
- **対象**:
  - `agent|ranking--old-2years` (Claude の確認)
    - [desktop-1440/medium] デスクトップ 1 枚目の下部、右カラム内の順位表 (順位・都道府県・値・偏差値) の右端: 表が枠幅に収まらず、最右列「偏差値」の値が「7」「6」のように 1 文字だけ見えて途中で切れている。機械検査の laptop-1024 の横スクロールと同じ原因とみられるが、1440 でも崩れている。 → 表の列幅を詰めるか、表を横スクロール可能なコンテナに入れて切れていることが分かる見た目にする。
    - [mobile-390/medium] スマホ 1 枚目、タイトル「国民年金保険料全額免除割合」直下から折れ線グラフのカードまで (デスクトップ 1 枚目の見出し周辺も同様): データが 2005〜2006 年度と 20 年前なのに、見出しやタイトル付近に年の表示が無い。年は折れ線グラフ内の小さな「2006年度」と軸ラベルにしか出ていないので、最新のランキングだと誤読しやすい。 → タイトル直下に「2006年度のデータ」のような時点表示を出し、古い場合は注記も添える。
- **次**: 原因をコードから特定して直し、関係する unit test と `npm run design-system:check -w apps/web` を通す。Claude の指摘は描画前の撮影による誤検知もありうるので、その場合は撮影側 (`.claude/scripts/page-quality/lib/screenshots.ts`) を直すか by-design にする。
- **記録**: 直した指摘は `npx tsx .claude/scripts/page-quality/ui-findings.ts --mark-fixed <key> --note "<何を変えたか>"`、直さないと判断した指摘は `--mark-by-design <key> --note "<理由>"`。デザイン方針・画像制作・外部契約などオーナー判断が要る指摘は、決めてほしいことを書いた `[実行:対話]` のカードを backlog に起票してから `--mark-owner <key> --card <そのカード ID> --note "<何を決めてほしいか>"` (カードが閉じた後も残っていれば pending に戻る)。まとめて付けるときは `@data/page-quality/backlog-batches/UI-FIX-RANKING-OLD-2YEARS-20261018.txt`。本番確認は release 後の週次監査が行い、再検出されたら pending に戻って再起票される。
- **停止条件**: 本番 deploy・R2 push をしない。判断できない指摘は pending のまま残し、このカードを消さない。
- **完了条件**: 検証コマンドが exit 0 (全対象が pending でなく、done 以外は理由 note 付き)。

### [UI-FIX-RANKING-INDEX-20261018] UI 是正: ranking--index の週次 UI 検査の指摘 1 件を直す

タグ: [UI・UX] [種類:不具合] [実行:sweep] [検証:npx tsx .claude/scripts/page-quality/ui-findings.ts --assert-handled data/page-quality/backlog-batches/UI-FIX-RANKING-INDEX-20261018.txt] [起票:2026-10-18] [領域:サイト]

- **2026-10-21 完了 (行削除は backlog-loop)**: 本番の `/ranking` を確認した。指摘の項目 (国立公園面積・国定公園面積・総面積（北方地域及び竹島を除く）) は公式の別指標で、名前どおりに区別できる。一覧は 101 件の導線で単位と年は各ページにあり、全項目に足すと読みにくくなるので by-design とした (`--mark-by-design`、理由は queue の note)。
- **自動起票**: 週次のページ品質監査 (`page-quality-audit-weekly.yml`) の結果から `ui-findings.ts --sync` が作った。対象の一覧は `data/page-quality/backlog-batches/UI-FIX-RANKING-INDEX-20261018.txt`、状態は `data/page-quality/ui-findings-queue.json`。正典は `.claude/rules/page-quality-standards.md`「UI 指摘のループ」。
- **スクショ (最新の週次)**: [mobile-390](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking--index-mobile-390.png) / [desktop-1440](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking--index-desktop-1440.png)。検査の詳細は `data/page-quality/metrics/LATEST.md`。
- **対象**:
  - `agent|ranking--index` (Claude の確認)
    - [desktop-1440/low] デスクトップ 1 枚目、「カテゴリ別のランキング」の各カテゴリ内の項目リスト: 「国立公園面積」と「国定公園面積」、「総面積（北方地域及び竹島を除く）」など似た名前の項目が連続し、単位や年の情報が無く違いが分からない。 → 各項目に単位や対象年を添えるか、似た項目は説明を足して区別できるようにする。
- **次**: 原因をコードから特定して直し、関係する unit test と `npm run design-system:check -w apps/web` を通す。Claude の指摘は描画前の撮影による誤検知もありうるので、その場合は撮影側 (`.claude/scripts/page-quality/lib/screenshots.ts`) を直すか by-design にする。
- **記録**: 直した指摘は `npx tsx .claude/scripts/page-quality/ui-findings.ts --mark-fixed <key> --note "<何を変えたか>"`、直さないと判断した指摘は `--mark-by-design <key> --note "<理由>"`。デザイン方針・画像制作・外部契約などオーナー判断が要る指摘は、決めてほしいことを書いた `[実行:対話]` のカードを backlog に起票してから `--mark-owner <key> --card <そのカード ID> --note "<何を決めてほしいか>"` (カードが閉じた後も残っていれば pending に戻る)。まとめて付けるときは `@data/page-quality/backlog-batches/UI-FIX-RANKING-INDEX-20261018.txt`。本番確認は release 後の週次監査が行い、再検出されたら pending に戻って再起票される。
- **停止条件**: 本番 deploy・R2 push をしない。判断できない指摘は pending のまま残し、このカードを消さない。
- **完了条件**: 検証コマンドが exit 0 (全対象が pending でなく、done 以外は理由 note 付き)。

### [UI-FIX-GEO-ANALYSIS-ANALYSIS-20261018] UI 是正: geo-analysis--analysis の週次 UI 検査の指摘 1 件を直す

タグ: [UI・UX] [種類:不具合] [実行:sweep] [検証:npx tsx .claude/scripts/page-quality/ui-findings.ts --assert-handled data/page-quality/backlog-batches/UI-FIX-GEO-ANALYSIS-ANALYSIS-20261018.txt] [起票:2026-10-18] [領域:サイト]

- **2026-10-21 完了 (行削除は backlog-loop)**: `GeoSpatialEvidenceExplorer` の各段階で、地図をタブの直下に置き、凡例の説明文と距離帯の凡例を地図の後ろへ移した (凡例そのものは残す)。本番 `/geo/population-land-price` の 375×812 で同じ並べ替えを当てると地図の上端が 765px → 640px になり、最初の画面に地図が 47px → 172px 入る。geo-analysis のテスト 153 件・design-system:check・web の型検査が通過。`--mark-fixed` 済み。未デプロイ。
- **自動起票**: 週次のページ品質監査 (`page-quality-audit-weekly.yml`) の結果から `ui-findings.ts --sync` が作った。対象の一覧は `data/page-quality/backlog-batches/UI-FIX-GEO-ANALYSIS-ANALYSIS-20261018.txt`、状態は `data/page-quality/ui-findings-queue.json`。正典は `.claude/rules/page-quality-standards.md`「UI 指摘のループ」。
- **スクショ (最新の週次)**: [mobile-390](https://storage.stats47.jp/state/page-quality/screenshots/latest/geo-analysis--analysis-mobile-390.png) / [desktop-1440](https://storage.stats47.jp/state/page-quality/screenshots/latest/geo-analysis--analysis-desktop-1440.png)。検査の詳細は `data/page-quality/metrics/LATEST.md`。
- **対象**:
  - `agent|geo-analysis--analysis` (Claude の確認)
    - [mobile-390/low] スマホ 1 枚目の下部、「人口の分布と変化」「住宅地点と人口の重なり」の切替の下: 1 枚目の画面では切替タブの下に地図が無く、凡例の説明文とボタンだけが並ぶ。地図は 2 枚目まで下がらないと現れず、最初の画面で何を見るページなのか分かりにくい。 → 地図をタブの直下に置き、凡例の長い説明は地図の後ろに回す。
- **次**: 原因をコードから特定して直し、関係する unit test と `npm run design-system:check -w apps/web` を通す。Claude の指摘は描画前の撮影による誤検知もありうるので、その場合は撮影側 (`.claude/scripts/page-quality/lib/screenshots.ts`) を直すか by-design にする。
- **記録**: 直した指摘は `npx tsx .claude/scripts/page-quality/ui-findings.ts --mark-fixed <key> --note "<何を変えたか>"`、直さないと判断した指摘は `--mark-by-design <key> --note "<理由>"`。デザイン方針・画像制作・外部契約などオーナー判断が要る指摘は、決めてほしいことを書いた `[実行:対話]` のカードを backlog に起票してから `--mark-owner <key> --card <そのカード ID> --note "<何を決めてほしいか>"` (カードが閉じた後も残っていれば pending に戻る)。まとめて付けるときは `@data/page-quality/backlog-batches/UI-FIX-GEO-ANALYSIS-ANALYSIS-20261018.txt`。本番確認は release 後の週次監査が行い、再検出されたら pending に戻って再起票される。
- **停止条件**: 本番 deploy・R2 push をしない。判断できない指摘は pending のまま残し、このカードを消さない。
- **完了条件**: 検証コマンドが exit 0 (全対象が pending でなく、done 以外は理由 note 付き)。

### [DEV-R2-SNAPSHOT-TIMEOUT-01] ローカルの dev:web で R2 snapshot の読み込みが 10 秒で打ち切られ、ページ表示に数分かかる
タグ: [インフラ・計測] [種類:不具合] [実行:対話] [起票:2026-10-17] [領域:サイト]

- **2026-10-21 完了 (行削除は backlog-loop)**: 完了条件「ランキングページが localhost で 30 秒以内に表示される」を満たした。`npm run dev:web` を Turbopack で起動するようにした (`apps/web/scripts/dev-server.ts`。`WEB_DEV_BUNDLER=webpack` で従来の webpack に戻せ、turbo の passThrough に宣言済み・契約テストあり)。8GB の Mac でキャッシュなしから実測すると、ランキング詳細 7.6 秒・テーマ詳細 21.6 秒・県ページ 7.8 秒・Geo 8.2 秒・トップ 5.8 秒・ブログ 8.0 秒・カテゴリ 10.4 秒・県別テーマ 19.0 秒で、10 種類のルートを開いてもメモリ再起動は起きなかった (webpack は同じ条件でランキング詳細 63 秒、4 種類で再起動)。主要 9 種類のページを新しいタブで開き、hydration エラーが 0 件であることを確かめた。一度見えた不一致は、サーバーアクションのファイルを編集した直後の差分再コンパイル中に読み込んだときだけで、キャッシュなしの起動では再現しなかった。Turbopack が 500 にした `"use server"` ファイルの型の再 export は外した。本番ビルドは webpack のまま。規約は `.claude/rules/local-environment.md`「dev サーバー起動」に追記。
- **2026-10-21 経過**: (続き) ランキング詳細のモジュールが多い原因を webpack のモジュール一覧で実測した。ブラウザ向けバンドルに指標定義 2,648 件・data-configs 155・テーマ定義 56 が入っていた。経路は、クライアント部品 → `@stats47/ranking` の入口 → builder・調査分類 → data-configs の入口 → registry。ranking の入口から builder と調査分類を外し (builder は `@stats47/ranking/server`、調査分類は新しい `@stats47/ranking/survey`)、ranking 内の 4 ファイルは data-configs の新しい小さな公開口 (`recipe`・`provenance`・`source-name-to-survey`) から読むようにした。web の 6 ファイルの import を付け替えた。本番は ranking の `sideEffects: false` で使われない再 export が落ちるので、効くのは主に開発ビルド。逆戻りはテスト `packages/ranking/src/__tests__/client-entry-registry-boundary.test.ts` が止める (入口へ再 export を戻すと落ちることを確認)。**実測 (8GB の Mac)**: ランキング詳細は 20,133 → 14,297 モジュール、ブラウザ向けの指標定義は 0 件。コンパイルキャッシュありで初回 40〜65 秒 → 17 秒、2 回目 1 秒。キャッシュなしの完全な初回は 222 秒 → 63.5 秒 (コンパイル 46.9 秒)。**残り**: キャッシュなしの初回は 30 秒を超える。県ページは 20,399 モジュールのままで、開いた後にメモリ再起動が起きる → `DEV-HEAVY-CLIENT-GRAPH-01`。
- **2026-10-21 経過**: 原因は R2 ではなく next dev の初回コンパイルとメモリだった。① 公開 URL を curl で直接叩くと app/affiliate-ads/all.json (254KB) は 0.1 秒、アプリと同じ経路 (S3 API) で単発 0.14 秒・30 本同時 0.2 秒で、ネットワークは遅くない。② Mac (8GB) で dev:web を起動すると /ranking/[rankingKey] の初回コンパイルが 171.5 秒 (20,133 モジュール。トップは約 1 万) かかり、その間に blog snapshot の読み込み 3 件が 10 秒の上限で SnapshotTimeoutError になった (R2 は返せているのに、コンパイル中で完了処理が遅れる)。コンパイル直後に Next が「メモリ上限に近い」として自分で再起動し、コンパイル結果を失っていた。Next は上限が未指定なら搭載メモリの半分 (8GB で 4096MB) を自分で付け、使用量が 8 割を超えると再起動する (node_modules/next/dist/server/lib/start-server.js・cli/next-dev.js で確認)。**直したこと**: snapshot の取得上限を NODE_ENV=development のときだけ 60 秒にした (本番は 10 秒のまま。テスト 2 件、開発側の変更を戻すと落ちることを確認)。**実測 (ディスクのコンパイルキャッシュあり)**: ランキング詳細の初回表示は 40 秒 (コンパイル 27.8 秒)、2 回目は 2 秒。県ページは初回 35 秒。2 ページ目のコンパイル後にメモリ再起動が再発した。**残り**: 初回 30 秒以内の完了条件は未達。ランキング詳細・県ページが約 2 万モジュールになる原因の一つは指標定義を全部 import する registry (2,644 ファイル) で、ホームは切り離し済み (featured.server.ts のコメント)。ランキング詳細から全件 registry を外せるかが次の一手。
- **観測 (2026-10-17・Mac)**: `npm run dev:web` で `app/affiliate-ads/all.json` の読み込みが `SnapshotTimeoutError: ... timed out after 10000ms` を繰り返し、`GET /` が 539,984ms、`/ranking/total-population` は 540 秒で応答なし。同じサーバーで `/api/ranking/total-population/download?format=kml` は 5.6 秒で返った。ブログの商品導線とダウンロード部品の画面確認がこのため 2 回止まった (部品は描画テストで代替)。
- **次**: ① 同じ時刻に R2 の公開 URL を curl で直接叩き、ネットワークの遅さかアプリ側の多重読み込みかを切り分ける ② ログでは同じ key の読み込みが 1 秒に十数回並んでいるので、ページ内での重複取得 (リクエストごとの dedupe の有無) を確かめる。
- **完了条件**: 原因を特定し、ランキングページが localhost で 30 秒以内に表示される。


### [DEV-HEAVY-CLIENT-GRAPH-01] テーマ・Geo・県ページのブラウザ向けに、全指標 registry と GIS 処理ライブラリが入る経路を断つ
タグ: [インフラ・計測] [種類:改善] [実行:対話] [起票:2026-10-21] [領域:サイト]

- **2026-10-21 完了 (行削除は backlog-loop)**: ブラウザ向けの部品 262 件のうち registry に届くものを 37 件 → 0 件にし、県ページから GIS 原典処理 (unzipper・shapefile・proj4・topojson) への経路をなくした。① `stat-series-ref.ts` から registry を外し、指標の登録確認は判定関数を受け取る `*With` 版に分けた。registry で確かめる版 (`parseStatSeriesRefs` など同じ名前・同じ引数) は新しい公開口 `@stats47/data-configs/theme-catalog/registry-checks` に移し、カタログ検査・サーバー側の処理・テストはそちらを使う。ブラウザ側 (`theme-chart-result.ts`) は `SKIP_METRIC_REGISTRATION_CHECK` を明示して形だけを確かめる。② `@stats47/gis/mlit-ksj/catalog` (データセット一覧とライセンス方針だけ) を作り、web の 7 ファイルを付け替えた。③ 県ページ用 `features/geo-analysis/area.ts`・テーマ用 `embedded.ts`・他機能用 `features/ranking/widgets.ts` の最小の入口を作り、ランキング機能内の 3 ファイルは規約 DR-AUDIT-07 どおり相対 import にした。④ `"use server"` のファイルから型の再 export を外した (Next.js の規則。Turbopack は 500 にする)。逆戻りは `apps/web/src/__tests__/client-bundle-boundary.test.ts` が止める (入口へ重い部品を戻すと落ちることを確認)。**実測 (8GB の Mac・webpack の dev)**: 県ページ 20,399 → 14,264 モジュール、テーマ詳細 15,676、/geo 7,401。メモリ再起動はページ 2 種類目の後 → 4 種類目の後になった。全テスト (web・data-configs・ranking・gis・admin)・全 workspace の型検査・preflight:pr 通過。**採らなかったもの**: `optimizePackageImports` を `@stats47/*` に広げる案は 1〜3% しか減らず不採用。Turbopack (`next dev --turbopack`) はキャッシュなしでもランキング詳細 7.4 秒・県ページ 6.6 秒・17 種類のルートで再起動なしと大幅に速いが、テーマ詳細で webpack に無い hydration の不一致 (useId のずれ) が出るので既定にしていない (本番は webpack で、画面確認を誤らせる)。
- **2026-10-21 追記 (本番ビルドで確認)**: 手順①を本番ビルド (`next build`・ローカル) で確かめた。ブラウザ向けの JS に指標定義 (`statsDataId`・指標の設定) と GIS 原典処理は入っていなかった。代わりに、テーマ切替 (`ThemeSwitcher`) が選択肢の名前のためだけに全テーマの設定 `ALL_THEMES` を読み、全テーマの指標定義 324KB のチャンクがテーマ系の 3 ルートに入っていた。サーバーで `{themeKey, title, isAreaTheme}` だけの一覧 (`config/theme-switcher-themes.ts`) を作って props で渡すようにし、`themeHref` を `config/theme-href.ts` に分けた。再ビルドでこのチャンクが消えたことを確認した (ビルドは静的生成まで成功)。境界テストに `ThemeSwitcher`・`ThemeSideNav` から `all-themes` に届かないことを足した。
- **実測 (2026-10-21・8GB の Mac・dev:web)**: 県ページ `/areas/[areaCode]` のコンパイルは 20,399 モジュールで、開いた後に Next が「メモリ上限に近い」として再起動する。TypeScript のモジュール解決で値の import をたどると、registry (指標定義 2,643 件) に届くクライアント部品が 37 件残る。経路はほぼすべて `data-configs/src/theme-catalog/index.ts` → `stat-series-ref.ts` (`getMetricConfig` で指標の実在を確かめる) で、テーマ・Geo の部品が型や出典定数を読むだけで入る。ブラウザで動く `theme-chart-result.ts` も `parseStatSeriesRefs` 経由で registry を呼ぶ。県ページはさらに unzipper・shapefile・proj4・topojson-server (GIS の原典処理用) に届く。
- **次**: ① 本番ビルドでテーマページの初回 JS に registry が入っているかを確かめる (data-configs は `sideEffects` を宣言していないので、開発ビルドだけの問題とは限らない) ② `stat-series-ref` の検証を registry に依存しない形にするか、検証を別の公開口へ分ける ③ 県ページで GIS 処理ライブラリを読む経路を特定して断つ。ランキング詳細と同じく `client-entry-registry-boundary.test.ts` 型の境界テストで固定する。
- **完了条件**: テーマ・県ページのクライアント部品から registry と GIS 処理ライブラリに届く経路が 0 件で、県ページを開いた後にメモリ再起動が起きない。


- **2026-10-21 残りの分離**: 全 `"use client"` ファイルの定期検査は `CLIENT-GRAPH-AUDIT-01`、`"use server"` ファイルの export 検査は `USE-SERVER-EXPORT-LINT-01`、サーバー側の入口とページ別 JS の大きさは `DEV-SERVER-BARREL-01`、Windows での Turbopack の確認は `TURBOPACK-DEV-WINDOWS-01`。
### [SSDS-YEARFORMAT-SOURCE-01] SSDS の指標生成器が年の区切りを一律「年度」で書くのをやめ、出典の期間から決めて検査で止める
タグ: [コンテンツ品質] [種類:不具合] [実行:対話] [検証:npm run validate:config --workspace=@stats47/data-configs] [起票:2026-10-21] [領域:データ]

- **根本原因 (2026-10-21 確認)**: `.claude/scripts/estat/gen-ssds-configs.mjs` が社会・人口統計体系 (SSDS) の全指標に `yearFormat: "fiscal"` を固定で書いている (79 行目)。このため国勢調査 (10月1日時点)・家計調査 (暦年平均)・犯罪統計 (暦年計) などが「2020年度」と表示されていた。同日に 410 件を出典の期間に合わせて直したが (`METRIC-YEARFORMAT-KAKEI-01`)、生成器を直さない限り新しい指標で再発する。
- **判定の手順 (同日に使った方法・再現用)**: ① e-Stat「統計項目の定義」`https://www.e-stat.go.jp/koumoku/koumoku_teigi/<A〜M>` の HTML を `<hr>` で区切り、各表 (見出し行に「時点又は期間」) の 1 列目の項目符号と 4 列目の期間、節末尾の「調査名又は報告書名」を取る (13 分野で 2,596 項目)。② 「指標計算式」`https://www.e-stat.go.jp/koumoku/sihyo_keisansiki/<A〜M>` の `<tr id>` から指標コード (`#L01201` 等) と計算式 (`L3110` 等の基礎項目、781 指標) を取る。③ 指標の基礎項目がすべて「暦年計・暦年平均・暦年・12月末/31日・10月1日」か、e-Stat の統計表一覧 API (getStatsList) の表題で「平成N年◯◯」と年で呼ばれる調査 (賃金構造基本統計調査・経済センサス・経済構造実態調査・事業所・企業統計調査・国民生活基礎調査・農林業センサス・漁業センサス・社会生活基本調査) なら calendar。年度計・年度間・3月31日などを含めば fiscal。それ以外は判定しない。同日の作業用スクリプトは一時領域にしか無いので、この手順で作り直す。
- **次**: ① 上の判定を `.claude/scripts/estat/` に純関数 + テストとして置き、定義ページの控えを `data/estat/` に保存する (台帳 `config/datasets.mjs` に 1 行足す)。② `gen-ssds-configs.mjs` が判定結果で `yearFormat` を書き、判定できない指標は生成を止めるか人の確認を求める。③ `validate:config` か専用の検査で、SSDS の指標の `yearFormat` が判定と食い違えば error にする (判定できない指標は理由付きの allowlist、縮小専用)。誤りを 1 件注入して発火することを確かめる。
- **完了条件**: 生成器が出典の期間から年の区切りを決め、既存 SSDS 指標の食い違いを検査が止め、注入した誤りで検査が落ちる。

### [YEARFORMAT-REFLECT-01] 年表記を直した 410 指標を R2 と記事・AI 解説・書籍へ反映する
タグ: [コンテンツ品質] [種類:改善] [実行:対話] [起票:2026-10-21] [領域:データ]

- **背景**: 2026-10-21 に 410 指標の `yearFormat` を fiscal → calendar に直した (develop のコミット `06316dc21`・`a21c4586a`・`5e72aa59a`。家計・物価・地価 68、SSDS の他分野 221 と 121)。サイトの年表記 (R2 の `yearName`「2020年度」→「2020年」) が変わるのは、develop→main のマージ後に配信値を作り直したときだけ (`sync-snapshots` は main のコードで動く)。
- **次**: ① main へマージした後、変わった指標の `ranking-values` を作り直す (`gh workflow run sync-snapshots.yml --ref main -f only=ranking-values -f ranking_keys=<最大50件>` を分けて実行するか、月次の data-refresh を待つ)。数件を curl で読み、`yearName` が「年」で終わることを確かめる。② 公開済みのブログ・ランキングの AI 解説 (`app/ranking/<key>/ai-content.json`)・note・Kindle の本文で、これらの指標に「◯年度」と書いた箇所を洗い出し、出典の期間に合わせて直す (ブログは公開記事の差し替えになるのでまとめて 1 回)。
- **完了条件**: 410 指標の R2 の `yearName` が「年」で終わり、本文の「年度」表記の食い違いが 0 件か、直さない理由が記録されている。

### [CLIENT-GRAPH-AUDIT-01] ブラウザ向けの全部品について、重い依存に届かないことを定期に検査する
タグ: [インフラ・計測] [種類:改善] [実行:対話] [起票:2026-10-21] [領域:サイト]

- **背景**: 2026-10-21 に、入口 (barrel) 経由で全指標 registry・全テーマ定義・GIS の原典処理がブラウザ向けに入っていたのを直した (`DEV-HEAVY-CLIENT-GRAPH-01`)。逆戻りを止める境界テスト (`apps/web/src/__tests__/client-bundle-boundary.test.ts`・`packages/ranking/src/__tests__/client-entry-registry-boundary.test.ts`) は、列挙した入口しか見ない。新しい入口や部品から同じ経路ができても気づけない。同日の調査では、全 `"use client"` ファイル 262 件から値の import をたどる一時スクリプト (TypeScript の `resolveModuleName`、型だけの import と `"use server"` のファイルは辿らない) で 37 件の経路を見つけた。全件で約 1 分かかる。
- **次**: ① この全件検査を `.claude/scripts/` に置き、registry・`all-themes`・GIS 原典処理 (unzipper・shapefile・proj4・topojson-server・topojson-simplify) に届く `"use client"` ファイルを数える。② 週次の `quality-suite-weekly.yml` か preflight (時間次第) に配線し、0 件からの増加で落とす。③ 誤りを 1 件注入して発火を確かめる。
- **完了条件**: 全 `"use client"` ファイルを対象に定期検査が走り、注入した経路で落ちる。

### [USE-SERVER-EXPORT-LINT-01] `"use server"` のファイルが async 関数以外を export したら検査で止める
タグ: [インフラ・計測] [種類:改善] [実行:sweep] [起票:2026-10-21] [領域:サイト]

- **背景**: 2026-10-21、`features/theme-dashboard/actions/fetch-metric-timeseries.ts` (`"use server"`) が型を再 export (`export type { … } from`) しており、開発サーバーを Turbopack にするとテーマ詳細が 500 になった (webpack は通していた)。Next.js の規則は「サーバーアクションのファイルは async 関数だけを export する」。同日に該当の 1 件は直したが、`export interface` / `export type` を持つ `"use server"` ファイルが他に 4 件ある (`theme-dashboard/actions/{fetch-theme-chart-results,fetch-population-pyramid,fetch-db-chart-data}.ts`・`depopulation-medical/actions/fetch-base.ts`。Turbopack では表示できているが規則とは食い違う)。
- **次**: `"use server"` のファイルで、async 関数以外の値の export と型の再 export を ESLint か専用の検査で止める。既存の `export interface` は型ファイルへ移すか、検査の対象外にする理由を決める。違反を 1 件注入して発火を確かめる。
- **完了条件**: 検査が develop-quality-gate か pre-commit で走り、型の再 export を注入すると落ちる。

### [TURBOPACK-DEV-WINDOWS-01] 会社の Windows PC で開発サーバーが Turbopack で動くことを確かめる
タグ: [インフラ・計測] [種類:改善] [実行:windows] [起票:2026-10-21] [領域:管理]

- **背景**: 2026-10-21 に `npm run dev:web` の既定を Turbopack にした (`apps/web/scripts/dev-server.ts`)。確かめたのは自宅の Mac だけ。会社 PC は i-FILTER の TLS 傍受があり、R2 を読むために dev-server が Windows の R2 gateway を起動して `R2_PUBLIC_FETCH_URL` を差し替える (`.claude/rules/local-environment.md`)。この経路と Turbopack の組み合わせは未確認。
- **次**: 会社 PC で `npm run dev:web` を起動し、ランキング詳細・テーマ詳細・県ページが 200 で表示され、データ (R2) とチャートが出ることを確かめる。動かなければ `WEB_DEV_BUNDLER=webpack npm run dev:web` で従来どおり起動し、原因をこのカードに書く。
- **完了条件**: Windows でも Turbopack で主要ページが表示されるか、webpack に戻す条件が `local-environment.md` に書かれている。

### [SMOKE-SCRIPT-BASH3-01] ルートのスモーク検査が Mac の bash 3 で動かないのに「passed」と出る
タグ: [インフラ・計測] [種類:不具合] [実行:sweep] [起票:2026-10-21] [領域:管理]

- **事象 (2026-10-21)**: Mac で `bash .github/scripts/smoke-test-routes.sh http://localhost:3001` を実行すると、41 行目の `declare -A` が bash 3.2 で失敗し、157 行目でも構文エラーが出た。それでも最後は「Smoke test passed: 2/2 representative routes OK.」で終了コード 0 になった。CI (Linux の bash 5) では正しく動くが、手元で使うと検査していないのに合格と表示される。
- **次**: 先頭で bash 4 以上を要求して止める (`BASH_VERSINFO`) か、連想配列を使わない書き方にする。途中の構文エラーで合格を出さないよう `set -e` 相当か件数の照合を入れる。
- **完了条件**: Mac の bash 3 で実行すると明示的に失敗するか正しく検査し、合格の件数が検査した URL の数と一致する。

### [LOCAL-RELEASE-BUILD-R2-TIMEOUT-01] ローカルの本番ビルドが静的生成で R2 の読み込み 10 秒制限に引っかかって落ちることがある
タグ: [インフラ・計測] [種類:不具合] [実行:対話] [起票:2026-10-21] [領域:管理]

- **事象 (2026-10-21・8GB の Mac)**: `NEXT_DIST_DIR=.local/next-release next build` の 1 回目が、1,633 ページの静的生成中に `/tag/再生可能エネルギー` で `blog snapshot read timed out after 10000ms` となり失敗した。同じコードの 2 回目は成功した。ローカルのビルドは `.env.development` の公開 R2 URL を読むので、多数のページが同時に同じ snapshot を読んで制限を超えると考えられる ([仮説]。検証: 静的生成中の同時 fetch 数を数える)。`npm run check:release-local` の結果が不安定になる。CI のビルドは R2 を読まないので起きない。
- **次**: ① 静的生成中に同じ key を何回読んでいるかを数える。② 1 回のビルドの中で同じ snapshot の読み込みをまとめるか、ビルド中だけ制限時間を延ばすかを決める (本番の実行時は 10 秒のまま)。
- **完了条件**: ローカルの本番ビルドを 3 回続けて実行し、R2 のタイムアウトで落ちない。

### [ESLINT-COMPAT-TEST-LOCAL-01] `eslint-dependency-compatibility.test.ts` が Mac でだけ毎回落ちる原因を調べる
タグ: [インフラ・計測] [種類:不具合] [実行:対話] [起票:2026-10-21] [領域:管理]

- **事象**: `apps/web` の vitest 全件で、`src/__tests__/eslint-dependency-compatibility.test.ts` の「handles a deeply nested brace pattern without exhausting the call stack」だけが Mac で毎回落ちる (2026-10-21 に 6 回実行して 6 回とも同じ。CI の Unit Tests (web) では通る)。全件の結果を読むたびに「既知の 1 件」を除いて判断する必要があり、新しい失敗を見落とす原因になる。
- **次**: 失敗の出力を読み、Node のスタックサイズ・Node の版・依存の解決先 (Mac と CI) の違いを切り分ける。環境由来なら、テストが前提とする条件を明示して満たさない環境では理由付きで skip するか、条件をそろえる。
- **完了条件**: Mac で web の vitest 全件が 0 件の失敗で終わるか、skip の理由がテストに書かれている。

### [DEV-SERVER-BARREL-01] サーバー側の入口経由の重い依存と、本番のページ別 JS の大きさを減らす
タグ: [インフラ・計測] [種類:改善] [実行:対話] [起票:2026-10-21] [領域:サイト]

- **実測 (2026-10-21)**: ① トップページのサーバー側は、`features/blog/server.ts` (調査分類) と `features/area-profile` の入口を経由して全指標 registry を読む。ほぼ全ページのサーバー側で一度はコンパイルされるので開発時の負担は 1 回だが、入口を細かくすれば減る。② `@stats47/data-configs` は package.json に `sideEffects` を宣言していない。本番ビルドで使わない再 export を落とせない可能性がある。③ 本番ビルドのページ別のブラウザ向け JS (非圧縮・共有分を含む) は、テーマ詳細 1,758KB・Geo 分析 1,405KB・ランキング詳細 1,073KB・トップ 965KB・県ページ 962KB。
- **次**: ③ を `@next/bundle-analyzer` (next.config に配線済み) で開き、大きい依存を上から確かめる。② は `sideEffects: false` を宣言した場合に本番の JS が減るかと、壊れないか (CSS・副作用のあるモジュール) を比べてから決める。① は効果を数えてから着手する。
- **完了条件**: ページ別 JS の大きい順の内訳が記録され、減らせるものを減らしたか、減らさない理由が書かれている。
### [PRODUCT-FUNNEL-DEPLOY-01] ブログ・ダウンロードの商品導線と地図用ダウンロードを本番に出し、4 週のクリックを測る
タグ: [収益化] [種類:改善] [実行:対話] [起票:2026-10-17] [領域:商品]

- **中身 (2026-10-17 実装・localhost 確認済み・未デプロイ)**: ① 職場から読まれるブログ 10 記事に、読者の仕事に合うデータ集の案内 (`apps/web/src/features/products/storefront.ts` の `BLOG_DATA_PRODUCTS`) ② CSV ダウンロード後に「業務の資料」と答えた人へ、その分野のデータ集の案内 (`findDataProductForRanking`)、「学習・研究」には出典の書き方 ③ ランキングの地図用ダウンロード (`/api/ranking/<key>/download?format=kml|geojson`、最新年を都道府県に塗り分け。総人口で 47 県・2.5MB・XML 妥当を確認)。
- **2026-10-17 本番反映済み** (PR #1143・deploy 04:48Z 成功): 本番で KML 47 県・XML 妥当・Content-Type、GeoJSON 47 件、Shift_JIS の先頭 `93 73` (「?」解消)、ランキングページの地図用リンク、家計ブログの商品案内を確認した。
- **次**: ① ~~デプロイ~~ (済) ② 本番の KML を Google マイマップに読み込めることを確かめる (Google ログインが要るのでオーナー) ③ 反映日を境界に、4 週の `nav_click` (`surface=blog_product` / `ranking_product`) と `file_download` の `file_extension` (kml / geojson) を読む。効果判定は improvements へ別 ID で引き渡す。
- **停止条件**: Workers の CPU が閾値を超える場合 (KML 生成は 1 回数十ミリ秒の想定で未計測。`CF-CPU-SURGE-01` と照合) は地図形式を外す。
- **完了条件**: 本番で 3 つの導線が表示・動作し、4 週の計測の開始日が improvements に記録された。

### [NOTE-KML-FUNNEL-01] note の KML 記事の末尾を、stats47 の地図用ダウンロードへの案内に替える
タグ: [収益化] [種類:改善] [実行:対話] [起票:2026-10-17] [領域:商品]

- **経緯**: KML 記事 (`n03e45e40d3a7`) は通算閲覧 3,226・note 2 位で、読者は検索から来る (28 日の閲覧 377 に対し note 内の表示 10)。末尾から案内する有料の GIS 分析記事は 28 日の閲覧 1〜5 で、読者の目的 (地図にデータを載せる) と合っていない。
- **次**: 反映日 (2026-10-18) から 4 週の note → stats47 の送客を測る。本文で配っている `総人口_2023.kml` の出典表記 (境界の国土数値情報) は未確認。
- **2026-10-18 反映済み**: 編集画面の更新リクエスト (PUT `free_body`) だけを差し替える方式で本文を更新した (添付・画像は再アップロードなし)。公開 API で、新しい節・H-02 のカード・有料カード 3 枚と GIS 入門のカードの削除・添付 1・画像 6・タグ 99 を確認。R2 の原稿 (draft.md) も同じ 2 か所を合わせて保存した。
- **再発の注意**: `update-published-navigation.mjs` を `--all-free` やこの記事の `--slug` で回すと、同じ無料マガジン (koumuin-gis) の有料記事カードを `chooseDatasetArticles` が付け直す。この記事を除外する仕組みは無いので、回す前に対象から外す。
- **差し替え案 (2026-10-17 作成)**: ① 本文の「まとめ」の前に節「47都道府県の統計を地図用KMLでダウンロードする」を足す (stats47 の各ランキングで最新年を塗り分けた KML を取れること、マイマップの KML 上限 5MB に収まる約 2.5MB であること、総人口のページへのリンク)。② 「次のステップ」の 1 行目「他の統計データでもKMLファイルを作成してみる」を「stats47 で別の指標の KML をダウンロードして並べてみる」に替える。③ 回遊フッタの「もう一歩深掘りする」と有料の「この記事の元データを手元で使う」3 枚 (駅代表点・洪水浸水・人口減少×地価、28 日の閲覧 1〜5) を外し、次に読む記事を H-01 (公開後) か H-02 (https://note.com/stats47/n/nc884a0a01b71) にする。マガジンと stats47 のカードは残す。
- **反映の注意**: フッタは本文の中にあるので update モードで本文ごと差し替える。`update-published-navigation.mjs` の再実行で有料カードが戻らないよう、記事台帳の `nextBestArticle` もあわせて設定する (有料カードの付与元は未特定。反映前に確かめる)。
- **停止条件・禁止**: note の編集はオーナー承認と人手ログインの後。有料記事への導線は外すだけで、記事自体は消さない。
- **完了条件**: 末尾の案内が替わり、4 週の note → stats47 の送客 (`utm_source=note`) を記録した。

### [NOTE-HOWTO-SERIES-01] 操作手順の連載 (H シリーズ) の 1・2 本目を書いて公開する
タグ: [SNS・マーケ] [種類:制作] [実行:対話] [起票:2026-10-17] [領域:商品]

- **企画**: `docs/30_note記事企画/backlog/H-howto-maps-data.md` (8 本)。1 本目「Googleマイマップで都道府県を色分けした地図を作る方法」、2 本目「CSVをExcelで開くと文字化けする原因と直し方」。
- **次**: ① 1 本目は地図用 KML が本番に出てから書く (手順の画面を実物で撮るため) ② 2 本目は今のダウンロード (Shift_JIS 版) で書ける ③ note-critic を通してからオーナー承認で公開。
- **進捗 (2026-10-17)**: 2 本目 (H-02 CSV 文字化け) は公開済み (https://note.com/stats47/n/nc884a0a01b71)。1 本目 (H-01 マイマップ) は原稿 `docs/31_note記事原稿/h-howto-mymaps-kml/` (作業コピー・未登録) を note-critic が REVISE。minor 4 件は反映済み。
- **実機確認は `NOTE-HOWTO-OWNER-CHECK-01` (別PC) に分けた。**
- **1 巡目の追加 2 本 (2026-10-18・下書き登録と R2 保存済み・note-critic REVISE)**: #9 `h-howto-mymaps-share` (マイマップの共有・埋め込み) は must 3 件を反映済みで、残りはマイマップの「共有」と「自分のサイトに埋め込む」の画面画像 (オーナーが撮る)。#11 `h-howto-excel-filled-map` (Excel の塗りつぶされたマップ) は blocker 1 件が残る: オーナーが Microsoft 365 の Excel で stats47 の CSV から地図を作り、47 都道府県が地理データ型で認識されて塗られるか (「国」列あり・なしで比較) を確かめ、データ型変換後のセルと完成した地図の 2 枚を撮る。認識されなければ公開しない。両方とも公開後に案内先を H-01 へ替える。
- **H-01 の公開条件 (オーナー作業)**: 総人口の KML (`https://stats47.jp/api/ranking/total-population/download?format=kml&basis=original`) を Google マイマップへ 1 回インポートし、①県別の色分けが出るか ②県をクリックした吹き出しに値・順位・時点・URL が出るかを確かめ、「インポート」の位置と読み込み後の地図の 2 枚を撮る。色が出なければ KML の Style 指定を直してから公開する。
- **完了条件**: 2 本が公開され、28 日の閲覧・note 内の表示・stats47 への送客を記録した。0 件なら 0 件と書く。

### [DOWNLOAD-CSV-CITATION-01] ランキング CSV に e-Stat 準拠の出典と「加工して作成」の表記が入っているかを確かめる
タグ: [コンテンツ品質] [種類:不具合] [実行:sweep] [起票:2026-10-17] [領域:サイト]

- **2026-10-21 完了 (行削除は backlog-loop)**: 確認の結果、CSV に出典も加工の表記も無かった。`build-download-csv.ts` に `CsvCitation` を足し、表の後に空行を挟んで「指標・出典 (編纂元と原典)・統計の取得元 (e-Stat のとき)・加工・掲載ページ・作成日」を出す (先頭行は列見出しのまま)。route は item.json の `attribution`・`source` から渡す。実データで total-population・annual-sunshine-duration (SSDS) と architect-annual-income (賃金構造基本統計調査) の 3 指標の CSV を生成し、表記が入ることを確認した。単体テスト 3 件・route テスト 1 件。本番は未デプロイ。府省名は item.json に無いので一次統計の出典は調査名だけになる。
- **経緯**: 2026-10-17 の学生ペルソナ調査 (AI シミュレーション + Web 検索)。CSV をダウンロードする人の用途は学習が最多 (2026-W41 `data/ga4/snapshots/2026-W41/download-purpose.csv`: 学習 33・仕事 19・個人 10)。卒論・レポートでは出典の書き方と加工の表記が詰まる点で、e-Stat の利用規約 (https://www.e-stat.go.jp/terms-of-use) が表記の例を示している。CSV の出典行の有無はまだ確認していない。
- **次**: ① ダウンロード route が出力する CSV を 3 指標ぶん取得し、調査名・表名・年次・取得日・加工の表記があるかを確認する ② 無ければ provenance から出典行を足す。
- **完了条件**: 代表 3 指標の CSV に出典と加工の表記が入っていることを、出力の実物で確認した。

### [NOTE-LEDGER-DUPLICATE-ENTRIES-01] note 記事台帳の重複エントリを解消し、一意性を検査に入れる
タグ: [エージェント・SSOT] [種類:不具合] [実行:sweep] [起票:2026-10-17] [領域:商品]

- **2026-10-21 完了 (行削除は backlog-loop)**: 台帳 502 件を照合すると、同じ題名は 21 組あるが、noteUrl が重なる行は 0 件だった。公開済みどうしの 8 組 (最高気温 4 本・大学数 2 本・fetch-estat 2 本・前年比較 2 本・koumuin の 3 組) は note 上で別 URL に公開された実在の投稿で、台帳の二重登録ではない。残り 13 組は下書きと公開済みの組で `NOTE-CATALOG-DUPLICATE-DRAFTS-01` の範囲。実在の投稿の記録は消せないので統合はせず、`validateArticleLedger` に「1 つの note 記事 (URL) を 2 行で持たない」検査を足した (同じ題名は許す。テストで固定、実台帳で通過)。note 上の重複公開をどうするかは `NOTE-PUBLISHED-DUPLICATES-DECISION-01` へ分けた。
- **経緯**: 2026-10-17 の自治体ペルソナ調査の過程で、`data/note/articles.json` に同じ記事が 2 件ずつある箇所が見つかった (「e-Stat 統計の前年比較・5 年トレンド・増減ランキングを自動化する」「47 都道府県データを 1 コマンドで取得する」が各 2 件、「公務員が副業せずに Claude Code スキルで評価される 5 つの場」が draft と published の 2 件)。`NOTE-LEDGER-FOLLOWUP-01` と同じ台帳だが、一意性の検査はそのカードの範囲に無い。
- **次**: ① 重複の組を列挙し、note の公開 URL・R2 の本文のどちらが正かを確かめて 1 件に統合する ② タイトルまたは note ID の重複を拒否する検査を、台帳の validator に足す。
- **完了条件**: 台帳に同一記事の重複が 0 件で、重複を入れると validator が失敗することをテストで固定した。

### [CI-SMOKE-BOUNDING-BOX-01] 本番ランキングの画面幅テストで初回にboundingBoxが取れない原因を調べる
タグ: [インフラ・計測] [種類:不具合] [実行:sweep] [起票:2026-10-17] [期日:2026-10-24] [領域:サイト]

- **優先度 / owner**: P2、devops-runner・site-ux-manager。GSCの公開障害対応を優先した後に扱う。
- **実測**: post-deploy smoke run38977124768は全体成功だが、`responsive-layout.spec.ts:70`のranking右レール契約が375/768/1024pxで初回`main.boundingBox() === null`となり、各retry #1で成功した（45 passed / 3 flaky）。取得不能の原因と実際の表示障害の有無は未確定。証拠: `data/gsc/ui-audits/2026-10-17-remediation.json#productionRelease`。
- **次 / 順序**: 同じランキング・viewportの初回遷移でDOMとmainの可視性・置換タイミングを記録し、表示側と検査側の原因を切り分ける。確定した原因に対する最小修正を既存テストへ反映する。
- **停止条件**: boundingBoxのnullを無視したり、assertion・対象幅を削除したり、固定sleepやretry増量で隠さない。追加デプロイは別途指示で行う。
- **完了条件**: 原因に対応する再現条件を残し、対象3viewportの既存テストがretryなしの反復実行で通る。修正による赤→緑と実行ログを記録する。

### [CF-CPU-RENDER-WEIGHT-01] キャッシュに無いページの描画 1 回あたりの Workers CPU を減らす
タグ: [インフラ・計測] [種類:改善] [実行:対話] [起票:2026-10-16] [領域:管理]

- **背景 (2026-10-16 実測)**: Workers Observability (Traces・1 時間) で、個別のランキング・ブログ・県ページは 1 回の描画で
  CPU 0.8〜2.5 秒 (例: `/ranking/main-household-ratio-main-earner-employee-commute-90min` 平均 2,526ms、`/areas/19000` 2,166ms)。
  本番の初回取得は `/themes/healthcare` 5.5 秒・`/ranking/total-population` 3.1 秒。先読みを止めても (`CF-CPU-SURGE-01`)、
  クローラーと初回の閲覧ではこの描画が残る。stats47 バケットの R2 転送量は 1 日 45〜196GB で Workers 1 件あたり約 1MB に当たり、
  描画のたびに大きな JSON を読んで解析している疑いがある (ブラウザからの直接取得も含むので未確定)。
- **次**: ① `CF-CPU-SURGE-01` の反映後 7 日で、Observability の `url.path` 別 CPU 合計の上位 20 を取り直す (方法は同カード)。
  ② 上位ルートの描画で読む R2 オブジェクトとサイズを数え、CPU が JSON の解析か描画かを分ける。③ 必要な年・項目だけを切り出した
  派生 snapshot (R2) を作るか、読み込みをやめるかを 1 ルートで試し、localhost の本番ビルドで描画時間を比べる。
- **停止条件**: 計測なしに最適化を足さない。永続 DB に戻さない (派生は R2)。表示内容・SEO の構造化データを変えない。
- **完了条件**: 上位ルートの 1 回あたり CPU の before/after を同じ方法で測り、改善した変更が本番に入っている。効果観測は改善台帳の別 ID へ引き渡す。

### [CF-CPU-OCN-CLIENT-01] OCN 回線から Chrome を名乗って連続アクセスする 1 端末を特定し、必要ならレート制限する
タグ: [インフラ・計測] [種類:不具合] [実行:対話] [起票:2026-10-16] [領域:管理]

- **背景 (2026-10-16 実測)**: Observability (Traces・1 時間) で ASN 4713 (NTT OCN) の `Mozilla/5.0 (Windows NT 10.0; Win64; x64) ... Chrome/155.0.0.0`
  が 1,263 件・CPU 約 128 万 ms (全体の約 33%)。約 3 秒に 1 回が 1 時間連続し、Accept は 97% が `*/*`。取りに来ているのは
  トップ・`/ranking`・`/areas`・カテゴリなどナビのリンク先で、先読み (`_rsc`) と同じ形。オーナーに心当たりは無い。
  送信元 IP は invocation logs 側のキーにあり、Traces のフィルターとは組み合わせられなかった。
- **次**: ① `CF-CPU-SURGE-01` (先読み停止) の反映後に同じ ASN・UA で件数と CPU を取り直す。先読みが止まって消えたなら閉じる。
  ② 残っていれば invocation logs で送信元 IP の数・時間帯・取得パスを確かめる。③ 単一の自動取得と分かれば、Cloudflare のレート制限
  (一定時間あたりの件数上限) の条件と閾値の案を作る。
- **停止条件**: 人の閲覧 (会社など共有の出口) の可能性を否定できないまま遮断しない。WAF・レート制限の設定変更はオーナーの承認後。
- **完了条件**: 先読み停止後の実測で消えたことを確かめたか、レート制限を入れて同じ集計で件数が下がったことを確かめた。

### [CF-HTML-EDGE-TTL-01] HTML の Workers Cache の期間を 1 日から延ばす可否を決める
タグ: [インフラ・計測] [種類:改善] [実行:対話] [起票:2026-10-16] [領域:管理]

- **背景 (2026-10-16)**: `lib/cache-policy.ts` の `PAGE_EDGE_CACHE_CONTROL` は `max-age=86400, stale-while-revalidate=604800`。
  本番ではトップ・テーマページも、最後のデプロイ (10/13) の 3 日後の初回取得で `CF-Cache-Status: MISS` だった (原因は期間切れか削除か未確認)。
  データ更新時は該当ページを差分 purge しているので、クローラーが 1 日 1 回未満しか来ない長い裾のページ (ランキング・市区町村) は期間を延ばすと
  キャッシュから返せる。Workers Cache は tiered (公式 https://developers.cloudflare.com/workers/cache/ 、2026-10-16 確認)。
- **次**: ① purge されない経路 (データ更新・テーマ定義・page_components・広告) を洗い出し、延長すると古い内容が残るページを特定する。
  ② `stale-while-revalidate` が Workers Cache で効いているか (MISS ではなく STALE を返すか) を本番で確かめる。③ 期間の案と効果の見込みを出す。
- **停止条件**: purge 漏れの経路を残したまま延ばさない。本番反映はオーナー承認後。
- **完了条件**: 延長するかを決め、延長するなら purge 漏れの経路を塞いだうえで本番に入り、HIT 率か CPU の before/after を測った。

### [CF-DEPLOY-CACHE-RESET-01] 配信に関係しない変更で本番デプロイしないようにし、キャッシュの全消しを減らす
タグ: [インフラ・計測] [種類:改善] [実行:対話] [起票:2026-10-16] [領域:管理]

- **背景 (2026-10-16)**: `deploy-workers.yml` は main への push ごとに動き (paths 指定なし)、9/15 以降の 32 日で 79 回デプロイした
  (8/15〜9/14 は 83 回)。Workers Cache は版がキャッシュキーに入るので、デプロイのたびに空から始まる
  (公式 https://developers.cloudflare.com/workers/cache/configuration/ 、2026-10-16 確認)。`cross_version_cache` は
  `DEPLOY-WORKER-CACHE-STALE-CSS-01` の事故 (古い HTML が消えた CSS を参照) を招くので使わない。
- **次**: ① 直近 79 回のうち、web の配信物 (apps/web・packages・ビルドが読む data/ 配下) に差の無いデプロイの件数を数える。
  ② 多ければ `paths` / `paths-ignore` の案を作る。ビルドが読む `data/` (例: `data/themes/catalogs`・`data/content`) を必ず含める。
- **① の結果 (2026-10-20)**: `deploy-workers.yml` の main への実行 91 回 (2026-09-15〜10-20) を、直前のデプロイとの `git diff --name-only` で分類した。変更が配信物に関係しないもの (`.claude/`・`docs/`・`contents/`・`scripts/scheduled/`・deploy 以外の `.github/`・計測や監査の記録の `data/<取得元>/`) だけのデプロイは **90 回中 6 回 (約 7%)**。`config/` とビルドが読みうる `data/` は安全側で「関係あり」に数えた。**判断: `paths` の絞り込みは入れない。** 減るのは月に数回で、除外を誤ると配信物が古いまま残る (停止条件)。キャッシュ全消しを減らす主因はデプロイの回数そのもの (36 日で 90 回、1 日 2.5 回) なので、CLAUDE.md の「デプロイは溜めて 1 回」の規律で抑える。再現: `gh run list --workflow deploy-workers.yml --branch main --limit 200 --json headSha,createdAt` を日付順に並べ、隣り合う SHA の差分を上の規則で分類する。完了条件の「不要と判断した理由」を満たしたので、このカードは閉じてよい。
- **停止条件**: ビルドが読むファイルを除外して、配信物が古いまま残る状態を作らない。workflow の変更は main 反映まで発火しない点に注意する。
- **完了条件**: 配信物に差の無いデプロイが走らないことを、対象外の変更だけの push で確かめた。または件数が少なく不要と判断した理由をここに書いた。


### [GSC-DATASET-NESTED-SCHEMA-01] DatasetのGSC再検証結果を確認し、出典メタデータを是正する
タグ: [インフラ・計測] [種類:不具合] [実行:対話] [起票:2026-10-16] [期日:2026-10-23] [進行中] [領域:サイト]

- **GSC案03 / P1（最優先・順序2）**: 入れ子Datasetの説明不足・欠落の修正をGoogle側で検証する。
- **GSC案04 / P2（次に着手）**: 出典SSOTからcreator・license・対象年・地域・単位を正しく引き継ぐ。案03と同じ生成処理で扱う。
- **owner / 順序**: ranking-ui-manager・市区町村ページ担当。P1のGoogle再検証結果確認を優先し、P2の出典メタデータ確認へ進む。監査: `data/gsc/ui-audits/2026-10-16.json`、本番反映・GSC操作の証拠: `data/gsc/ui-audits/2026-10-17-remediation.json`。
- **修正前の実測**: GSC Dataset（最終更新 10-15）は description 長さ不正 775、欠落 83、計 858 アイテム無効。license / creator 欠落は各 1,092。通知本文の「1 件」は問題種別数で、影響ページ数ではない。本番 `/ranking/donations-prefecture` は親 Dataset の説明 121 文字に対し `isBasedOn` の Dataset は 47 文字、`/ranking/side-job-rate` は 46 文字。市区町村ランキング 4 例では `isBasedOn.description` 自体が無い。親の説明は存在する。
- **次 / 順序**: ①10-23にGSCのdescription長さ不正775件・欠落83件の検証結果と前回クロールを確認する（両方10-17に「検証: 開始」）。失敗した場合は該当URLと入れ子項目を特定して再現する ②P2のcreator / licenseは対応する出典SSOTの作成者・利用条件を特定したものだけ引き継ぐ（調査名を組織名として流用しない）。PR #1140で本番反映済み、対象6ページ×通常/Googlebotの必須description検査と再帰回帰テストは通過。証拠は `data/gsc/ui-audits/2026-10-17-remediation.json`。公式: https://developers.google.com/search/docs/appearance/structured-data/dataset?hl=ja
- **残る照合**: 出典SSOTと作成者・利用規約・対象年・地域・単位の一致を確認する。858は無効アイテム数として追跡し、ページ数や通常検索の未登録数と混同しない。
- **停止条件**: 親 Dataset の本文だけを水増しして解消としない。出典の作成者・利用条件を推測で埋めない。追加の本番反映は別途オーナー指示で行う。
- **完了条件**: 親と入れ子の Dataset を辿る回帰テスト、対象の型検査、本番代表HTMLの必須項目検査が通り、再クロール後に該当エラーが解消したことを確認する。デプロイ前・再クロール前はそれぞれ区別して記録する。


### [GSC-ROBOTS-INDEXED-01] 公開ダウンロード・廃止OGPのGoogle再取得と除外を確認する
タグ: [インフラ・計測] [種類:不具合] [実行:対話] [起票:2026-10-16] [期日:2026-10-23] [進行中] [領域:サイト]

- **GSC案24 / P2（本番HTTP確認済み・Google検証中）**: robotsブロック済み登録584件のうち576件は公開CSV/JSON、8件はOGP。公開ダウンロードに限定してcrawlを許可しX-Robots-Tag:noindexを読ませる。公開画像と廃止URLのHTTP応答も読めるようにする。
- **owner / 入力**: gsc-analyst・site-ux-manager。対象・内容確認・ローカル検証は `data/gsc/ui-audits/2026-10-16-remediation.json`。変更はrobots.ts・download route・middleware、恒久方針はcoding-standards.md。
- **次 / 順序**: PR #1139をmainへ反映し、本番31 URLは全件期待どおり。デプロイ・purge・post-deploy smokeの最終結果は `data/gsc/ui-audits/2026-10-16-remediation.json` のreleaseを参照。GSCのrobots.txt再取得リクエストは受理済み、584件の警告は10-16に「検証: 開始」。10-23にGoogleの再取得とnoindex/404/410による除外を確認する。Google側の検証完了前にカードを閉じない。
- **観測 (2026-10-22 GSC通知)**: 「robots.txt によりブロックされましたが、インデックスに登録しました」の検証結果が「修正できませんでした」(一部のページが引き続き影響を受けている) で届いた (Message type WNC-10031170)。残ったURLと件数はGSCのインデックス登録レポートで確かめ、584件のうちどの種類 (公開CSV/JSON・OGP) が残ったか、Googleがnoindex/404/410を取得済みかを切り分けてから、修正か再検証かを決める。
- **停止条件**: API全体は開放しない。ダウンロード/画像機能を壊さない。Googleがnoindex/404/410を取得する前に解消としない。ローカル実装を本番反映済みとしない。
- **完了条件**: 本番で意図したHTTP/robotsが配信され、対象URLのGoogle再取得でダウンロードの検索除外・廃止画像の除外が確認できる。正常画像は取得可能。noindex対象増加は意図した除外として評価する。

### [GSC-SOURCE-FRESHNESS-01] GSCのUI監査と既存計測の観測日・取得範囲を揃える
タグ: [インフラ・計測] [種類:改善] [実行:対話] [起票:2026-10-16] [期日:2026-10-23] [領域:サイト]

- **GSC案38 / P2（次に着手・比較前の前提）**: UI監査10-12と既存coverage入力10-04を区別し、HTTP・sitemapの新しい証拠を検査付きの取得経路へ接続する。
- **owner / 入力**: gsc-analyst。`data/gsc/ui-audits/2026-10-16.json`、coverage-remediation、search-growthのstatus。UI例示の上限と722 URLだけのHTTP検査を保持する。
- **次 / 順序**: ①sourceごとに観測日・取得日・母集団・標本数・欠測を照合する ②既存CSV/manifest gateで最新coverageを取り込むか、部分UI監査を補助証拠として保持するかを決める ③HTTP/sitemap collectorの既存出力との接続を検証し、既存キューの状態を保持して再構築する。集計期間はsearch-growthのObservationと元summaryを照合し、週フォルダ名から推定しない。
- **停止条件**: UI例示を全件データと扱わない。欠測を0で埋めない。認証情報を監査JSONへ保存しない。古い入力で新しい状態を巻き戻さない。
- **完了条件**: 各sourceの鮮度・取得範囲・成功/部分成功/欠測が追跡でき、キュー更新の前後差分とgate結果が残る。source未取得を成功扱いしない。
- **週次CIの追加実測 (2026-10-17確認)**: Issue #1135、run `38820105627`はGSC restore 67 files（observedAt 2026-10-15T08:34Z）成功後、2,800 URLのHTTP probeと5xx/timeout 8件の再試行を終えた。HTTP 200の1,224 URLのHTML index signal検査中、2026-10-15T23:08:01Zにstepの12分上限で停止した。jobはcontinue-on-errorによりsuccessでもqueue buildはfailureで、source staleがこのrunの失敗原因ではない。証拠: https://github.com/uruhayato373/stats47/actions/runs/38820105627 。
- **追加の次 / 順序**: HTTP/HTMLの二段取得の所要時間・予算・再開方法・部分結果の保全を調べ、全体完了未達を明示する。成功後に新しいqueueとsourceの取得範囲を照合する。古い入力を新しい証拠として扱わず、既存の完了条件を維持する。

- **全量実測の是正（2026-10-17）**: private R2の観測10-16・67ファイルを復元しW42入力へ更新。status/HTMLを単一GETにした上で、未完了のbody.cancel待ちが終了コード0で保存を止める問題をredテストで再現し、非同期cancel・強制deadline・CLI top-level awaitで修正した。本番2,751 URLのGETは9,172ms、sitemap 6,574 URLとの照合と2799件のqueue保存まで完了。source_observed_at=10-16、generated_at=10-17を分離し、pending1137は母集団の違う旧1034件と単純比較しない。残りは修正版を使う週次CIとGSC再認証後の新しいexportの照合。カードは継続する。


- **新取得との照合（2026-10-17）**: 認証付きCI run38984474666はGSCを含む8サービスがpass。10-17取得のprivate GSC61ファイルを復元した。過去snapshotのqueue派生observe/resubmit CSVを復元対象から除く保護を追加し、W40/W42対象CSVのSHA不変を実復元で確認。取得日・GSC報告日・queue生成日は区別し、修正版のmain週次CIは引き続き確認する。

### [GSC-INTERNAL-DISCOVERY-01] 未登録候補の孤立ページとHTMLリンクの到達経路を是正する
タグ: [コンテンツ品質] [種類:改善] [実行:対話] [起票:2026-10-16] [期日:2026-10-30] [領域:サイト]

- **GSC案11 / P2（次に着手）**: GSC-COVERAGE-DEPLOY-01の優先候補から、sitemapだけで発見され内部リンクのないページを抽出する。
- **GSC案12 / P2（次に着手）**: 関連するカテゴリ・調査・県ハブから重要ページへ直接到達できる入口を作る。
- **GSC案13 / P3（条件確認後）**: 操作ボタンや検索フォームでしか到達できない重要ページが確認された場合、hrefのある通常HTMLリンクを補う。
- **owner / 順序**: site-ux-manager・gsc-analyst。既存サイト内リンク監査で優先候補の入口と経路を確認→不足する文脈リンクだけ修正→リンク先の200/canonical/表示を検証する。重複率是正はSITEWIDE-DUPLICATE-LINK-RATIO-01へ接続する。
- **停止条件**: 全ページリンクの一括追加をしない。未登録理由を孤立と決めつけない。サイト内リンクが既に十分なら修正を作らず証拠を残す。公開は別途指示で行う。
- **完了条件**: 優先候補ごとに入口・到達経路・修正要否があり、採用した導線がHTMLから辿れる。案13は採否と根拠を残す。

### [GSC-SITEMAP-LASTMOD-01] サイトマップ掲載条件と実更新日時の整合を検査する
タグ: [インフラ・計測] [種類:改善] [実行:対話] [起票:2026-10-16] [期日:2026-10-30] [領域:サイト]

- **GSC案17 / P2（次に着手）**: 本文・データの実更新とlastmodの対応をテンプレ別に検証し、根拠のある更新日時を反映する。
- **GSC案18 / P2（次に着手）**: sitemap掲載URLとHTTP・noindex・canonicalの矛盾を既存検査で拾う。
- **owner / 入力**: ranking-publisher・site-ux-manager。`apps/web/src/app/sitemap.ts`、sitemap shard、公開URL方針、既存check-sitemap-index / route smoke / page-quality。Geo固有の公開gateは既存route smoke（全7分析）と定義SHA回帰テストを参照する。
- **次 / 順序**: ①既存検査が覆う項目を確認する ②変更されたURLと各テンプレ代表で不整合・lastmod根拠を検査し、不足箇所だけ既存gateへ足す ③週次全URL検査へ必要な項目を接続する。
- **停止条件**: 全URLのlastmodを毎日更新しない。更新日が不明なとき捏造しない。priority/changefreqの変更をGoogle向け改善策にしない。公開反映は別途指示で行う。
- **完了条件**: 意図しない404/転送/noindex/別canonical掲載を検出でき、lastmodが実更新に一致するか未設定理由を説明できる。既存検査との二重運用を残さない。

### [GSC-CANONICAL-REDIRECT-01] 正規URLを示す内部リンク・サイトマップ・転送先を揃える
タグ: [インフラ・計測] [種類:改善] [実行:対話] [起票:2026-10-16] [期日:2026-10-30] [領域:サイト]

- **GSC案19 / P2（次に着手）**: canonical・内部リンク・sitemap・転送先の矛盾を対象URL単位で調べ、正規URLへ揃える。
- **GSC案20 / P3（条件確認後）**: 301連鎖が残る箇所は移転の意味を保って最終URLへ直接転送し、内部リンクも更新する。
- **owner / 入力**: ranking-ui-manager・site-ux-manager。10-16監査のcanonical関連例示とHTTP転送履歴、既存UrlPolicy / middleware。Google選択canonicalが異なる8例は現時点で301→200であり、現行不具合とは断定しない。
- **次 / 順序**: ①現行index対象URLから優先調査 ②実際に矛盾/連鎖のある写像だけ是正 ③通常UA・Googlebot UAとURL Inspectionで着地を確認する。ブログ統合先の判断はBLOG-DUPLICATE-AUDIT-01が所有する。
- **停止条件**: 内容の違うページを一律canonical化しない。全旧URLをトップへ転送しない。過去のGSC分類だけで現行転送を変更しない。公開は別途指示で行う。
- **完了条件**: 対象ごとの正規URL・処置・根拠があり、採用箇所の信号が一致する。案20は連鎖解消または維持理由を記録する。

### [GSC-404-VALUE-TRIAGE-01] 内部リンク・被リンク・過去流入のある404を優先分類する
タグ: [インフラ・計測] [種類:改善] [実行:対話] [起票:2026-10-16] [期日:2026-10-30] [領域:サイト]

- **GSC案21 / P2（次に着手）**: 404例示を内部リンク・取得できる被リンク・過去GSC流入と照合し、救済価値があるURLを選ぶ。
- **owner / 順序**: gsc-analyst・site-ux-manager。10-16監査の12,658件は総数、例示は1,000件という範囲を保持する。現sitemap・内部リンクあり→過去流入/被リンクあり→意図的廃止の順に分類する。
- **次**: 対応する移転先があれば個別301、現役ページなら原因修正、代替がなければ404/410維持を選ぶ。土砂災害Geoの404はPR #1140で是正済み（本番・Googleライブ検査の証拠: `data/gsc/ui-audits/2026-10-17-remediation.json`）。既知の本文410リンクはBLOG-LINK-410-REMAP-01へ統合する。
- **停止条件**: 被リンク情報の欠測を0と扱わない。無関係なページへの転送や廃止ページの大量復活をしない。公開は別途指示で行う。
- **完了条件**: 調べたURL群の優先度・処置・移転先根拠・既存カードへの対応が残り、採用した修正が検証可能な単位になっている。

### [GSC-MESSAGE-TRIAGE-01] GSC通知を現在の問題・処置・確認期日へ対応付ける
タグ: [インフラ・計測] [種類:改善] [実行:対話] [起票:2026-10-16] [期日:2026-10-30] [領域:サイト]

- **GSC案39 / P2（次に着手）**: GSC通知を現在の障害・修正後観測・任意改善・実績通知に分類し、同じ原因を既存カードへまとめる。
- **owner / 入力**: gsc-analyst。`data/gsc/ui-audits/2026-10-16.json` の直近16通知と各レポートの現在値。全142通知を確認済みとは扱わない。
- **次 / 順序**: ①重要な未確認通知が残るかを確認する ②各通知に対象種別・現状・対応カード/対応不要理由・次回確認日を対応付ける ③既存週次GSC運用へ分類手順を統合する。単発の運用整備として閉じ、毎週の正常確認をbacklog化しない。
- **停止条件**: 通知の問題種別数を影響URL数と読み替えない。実績通知で不具合を起票しない。新しい常駐collectorや外部通知送信を自動追加しない。
- **完了条件**: 対象通知に未分類がなく、現在の問題は既存カードに接続し、既存運用で再利用する手順と保存先が定まる。

### [NOTE-LABOR-METRICS-ADD-01] 有給休暇と産業別賃金の県別指標を足し、note の雛形 2 本を作り直して公開する
タグ: [コンテンツ品質] [種類:改善] [実行:対話] [起票:2026-10-15] [領域:サイト]

- **経緯 (2026-10-15)**: note の雛形 `A-laborwage-paid-leave-utilization-prefecture`・`A-laborwage-wages-by-industry-prefecture` は、元になる県別ランキングが無く作り直せなかった (`NOTE-A-LABORWAGE-TEMPLATES-01`)。オーナー指示で、指標を足してから作り直す。
- **有給休暇**: 「取得率」の県別公式統計は e-Stat カタログに無いが、社会生活基本調査 2021 に「年次有給休暇の取得日数」を分類に持つ都道府県別の表がある (`0003456320`・`0003456321`・`0003456356`・`0003456357`・`0003456478` など。いずれも行動の種類との掛け合わせ。`node --import tsx .claude/scripts/estat/catalog.mjs search 有給休暇 --pref-only`)。総数の行から「年次有給休暇を N 日以上取得した雇用者の割合」を組めるかを `/inspect-estat-meta` で確かめる。組めなければ見送る。
- **産業別賃金**: 賃金構造基本統計調査の都道府県 × 産業の所定内給与額から、産業ごとの指標を足す (`metric-config-standards.md` の形状ゲートと公開の多段依存に従う)。どの産業を足すかは検索需要で絞る。
- **次 (実行順)**: ① 両方の表を `/inspect-estat-meta` で確かめ、指標の定義を決める ② metric config を足し、R2 へ投入してランキングを公開する (`ranking-publisher`) ③ `/post-note-ranking` で記事を作り、Codex imagegen のカバーで公開する ④ 旧雛形 2 本を記事台帳とカバー台帳から外す。
- **2026-10-16 進捗 (① ② の config まで)**: 有給休暇は `0003456356` の tab `202101A02` (推定人口) が cat04 に取得日数の区分 (11:0日・12:1～10日・13:11～20日・14:21日以上・15:その他) を持つので、`annual-paid-leave-11-days-or-more-ratio` (= 13+14 / 11～14 の計。取得率ではない) を足した。産業別賃金は新しい表を探さず、既存の `0003426933` の cat04 (産業分類 51 区分) を使い、`information-communication-industry-annual-income` (37 情報通信業・職種別年収と同じ算式) を足した。GSC の検索需要は産業別・有給休暇とも小さく (W40 までの累計で「it企業 年収」表示 2 回など)、産業は 1 つに絞った。config は `78400fc35`。dryRun の取り込み依頼を `e988ea847` で push した。
- **2026-10-16 進捗 (② の本番デプロイ前まで)**: R2 の観測値・`item.json`・`values.json`・OGP は 2 キーとも 200 (data-refresh run 38815750662・ranking-ogp-new-keys run 38816637273)。KNOWN とサイトマップに足した (`a42ff5ee8`)。**残り: develop→main のマージ (本番デプロイ。オーナー承認待ち)** → Googlebot UA で `/ranking/<key>` が 200 を実測。
- **有給休暇の note**: `a-annual-paid-leave-11-days-or-more-ratio` を下書きで記事台帳・R2 に保存し、カバー `NCI-00500` を採用済み (1 位愛知 44.4%・47 位石川 31.2%)。ランキングが本番に出たら公開し、旧雛形 `A-laborwage-paid-leave-utilization-prefecture` を外す。
- **2026-10-16 オーナー指示「できることはすべてやって」**: 産業別は (b) を採り、製造業 (`manufacturing-industry-annual-income`・隣り合う年の順位相関 0.94〜0.95) と医療・福祉 (`medical-welfare-industry-annual-income`・0.69〜0.75) を足した。記事は製造業 (`a-manufacturing-industry-annual-income`・2023 年 1 位神奈川・カバー `NCI-00501`) で下書き済み。情報通信業・医療福祉はランキングのみ。4 指標は PR #1136 で本番反映する (CI の書き戻し commit が develop の先頭に重なり必須チェックが 2 回外れたため、実 commit を積んで CI を起こし直した)。
- **情報通信業の note は保留 → 製造業に置き換え (上の行)**: R2 の 2020〜2023 年で隣り合う年の順位相関が 0.55〜0.68 (介護職員の年収は 0.74〜0.77)。2023 年 1 位の石川県は 2022 年に 22 位で、「1 位は石川県」を見出しにすると標本の振れを結論として出すことになる。選択肢: (a) 注記付きでそのまま記事化 (b) 標本の大きい産業 (製造業・医療福祉など) に替える (c) 産業別は見送り、旧雛形を外すだけにする。
- **完了条件**: 2 本の雛形が記事台帳から消え、置き換えの記事が公開済み (または指標が組めず見送りを記録)。

### [NOTE-A-LABORWAGE-TEMPLATES-01] 数値が空の note 雛形 (労働・賃金ランキング) 4 本を、作り直すか台帳から外すか決める
タグ: [コンテンツ品質] [種類:意思決定] [実行:対話] [起票:2026-10-15] [領域:商品]

- **事象 (2026-10-15)**: 記事台帳の下書き `A-laborwage-*` 5 本は 2026-05-16 の雛形で、ランキング表の順位・県名・数値が「実データを入れる」という空欄 (各 10 か所) のまま、本文にデータで確かめていない説明がある。公開できない。
- **済み**: 有効求人倍率は `/post-note-ranking` で `a-active-job-opening-ratio` として作り直し (2022 年・1 位福井)、公開した (https://note.com/stats47/n/n73c710f239ef)。旧雛形 `A-laborwage-job-opening-ratio-prefecture` は記事台帳とカバー台帳から外した (公開 R2 `note/stats47-note/A-laborwage-job-opening-ratio-prefecture/` の本文は残っている。削除は破壊的操作なのでオーナー判断)。
- **残り 4 本**: 平均通勤時間・有給休暇取得率・産業別平均賃金は対応するランキングが無い。大卒初任給は `new-graduate-starting-salary-university-{male,female}` があるが 1 位が東京都・最新年 2019 で、生成器の `PREDICTABLE_LEADER` が止めた。
- **2026-10-15 追記 (大卒初任給)**: オーナーの公開指示で `--allow-tokyo-leader` を付けて男女 2 本 (`a-new-graduate-starting-salary-university-{male,female}`・2019 年・1 位東京) を生成し、記事台帳・ハッシュタグ・公開 R2 まで済ませた。同日、codex MCP を 0.153.0 固定で復旧し、`note:cover-production` + Codex imagegen でカバーを作って採用、**公開した** (男性 https://note.com/stats47/n/nf067364b58fb・女性 https://note.com/stats47/n/necff830a091b)。旧雛形 `A-laborwage-starting-salary-by-prefecture` は台帳から外した。以下はカバー作成前の経緯。同日取り込んだ別セッションの変更でカバーは `note:cover-production` + Codex imagegen に一本化され (旧 `generate-cover-refresh.ts` は停止)、このセッションでは codex MCP が切断されていて生成できない。Codex でカバーを作って採用したら公開する。先に公開した `a-active-job-opening-ratio` のカバーは旧テンプレートで作ったので、新方針での作り直し対象になりうる。
- **次**: ① 4 本を台帳から外す (見送り) か、指標を足してから作り直すかをオーナーが決める ② 外すなら記事台帳・カバー台帳から同時に外し、`generate-note-catalog.ts --apply` と `note:assets seed` を通す。
- **2026-10-15 有効求人倍率のカバー差し替え**: `note:cover-production` + Codex imagegen で作り直して採用し (`NCI-00496`)、`NOTE_COVER_BROWSER=playwright node .claude/scripts/note/update-note-covers.mjs --keys a-active-job-opening-ratio --commit` で note のカバーを差し替えた。note 上は新画像に替わったことを公開 API と目視で確認したが、差し替え後の照合 `verifyImage` が平均画素差 3.04 (基準 3) で止まり、台帳は公開版を採用版と別の revision (`published-original`) として記録した。`verify-cover-refresh` は `approved revision not published` で fail。**次**: imagegen の細かい画像は note の再圧縮で 3 を超えうるので、基準 (`update-note-covers.mjs` の `meanPixelError > 3`) を見直すか、同じ画像で再照合する手段を決める (カバー制作の担当セッションの判断)。台帳を手で公開済みにしない。
- **2026-10-15 通勤**: 平均通勤時間のランキングは無いので、題材を「通勤 1 時間 30 分以上の雇用者世帯の割合」(`main-household-ratio-main-earner-employee-commute-90min`・2023 年・1 位埼玉) に変えて作り直し、Codex imagegen のカバー (`NCI-00499`) を付けて公開した (https://note.com/stats47/n/n7a47171e06f3)。旧雛形 `A-laborwage-commute-time-prefecture` は台帳から外した。
- **残り 2 本** (有給休暇取得率・産業別平均賃金): 指標を足してから作り直す。手順は `[NOTE-LABOR-METRICS-ADD-01]`。
- **完了条件**: `A-laborwage-*` の下書きが記事台帳に 0 件。

### [CONTENT-KAKEI-EXPANSION-01] 家計調査の未展開候補を棚卸しし、note・サイトへ順次展開する
タグ: [コンテンツ品質] [種類:制作] [実行:対話] [起票:2026-10-19] [領域:サイト]

- **優先理由**: 「家計のクリック率が高いので、展開できるものはすべてnoteやサイトで展開」という2026-10-19のユーザー判断。今回CTRを実測したものではない。
- **次・担当**: blog-seo-strategist / note-managerが、既存716ランキング・47都市noteを起点に個別品目・費目グループ・都市の特徴・比較切り口を棚卸しし、重複と未展開を一覧化する。一次データと読者価値を満たす候補をすべて実行キューへ入れ、既存記事へ統合または記事化する。
- **境界・停止条件**: 数値・単位・都市/県の範囲・出典を検証できない候補は進めず、単なる品目差し替えで重複・薄い記事を量産しない。データ更新・追加指標は `KAKEI-EXPANSION-02`、既存の食関連導線整理は `CONTENT-FOOD-TRIVIA-01`、参考文献由来企画は既存展開カードと重複させない。SNSは `SNS-KAKEI-EXPANSION-01`。今回は起票のみとし、記事生成・公開は実行しない。
- **完了条件**: 展開可能な候補がnote・サイトの公開コンテンツに対応し、非採用候補は理由を追える。

### [DEPS-RENOVATE-01] Renovate GitHub App をインストールし、最初の月曜の翌日に PR が出ることを確かめる
タグ: [インフラ・計測] [種類:改善] [実行:ユーザー] [検証:gh pr list --state all --search "author:app/renovate"] [起票:2026-10-13]

- **背景**: improvements.md の期限 (2026-10-12) を超過し、改善台帳の上限 10 件を塞いでいたため、オーナー指示で 2026-10-13 に active から外した。効果は未確定 (effect ラベルなし)。
- **実測**: renovate.json はあるが未稼働。2026-09-07 は `gh pr list --search "author:app/renovate"` = 0 件。2026-10-11 の再実測は `gh pr list --state all --limit 200` で作者または head ブランチに renovate を含む PR が 0 件、`gh api repos/uruhayato373/stats47/branches --paginate` の 2 ブランチにも renovate を含むものは無い。
- **次 (オーナー)**: GitHub App のインストール。DEPS-MAJOR-SECURITY-01 は Dependabot security alerts で解消済みなので緊急度は低い。
- **完了条件**: インストール後の最初の月曜 (renovate.json の schedule は月曜 6 時前) の翌日に、上の検証コマンドで 1 件以上。無ければオーナーへ再依頼する。

### [PERF-WORKER-P99-01] Workers の CPU / wall p99 を支配する route / R2 binding をオーナーが Dashboard で特定する
タグ: [インフラ・計測] [種類:改善] [実行:ユーザー] [起票:2026-10-13]

- **背景**: improvements.md の期限 (2026-10-12) を超過し、上限 10 件を塞いでいたため、オーナー指示で 2026-10-13 に active から外した。効果は未確定 (effect ラベルなし)。この施策はコードを変えない調査で、before/after の効果値が無い。
- **実測 (baseline)**: Workers traces / GraphQL で CPU p99 1.48〜2.02 秒・wall p99 3.80〜4.61 秒。
- **次 (オーナー)**: Cloudflare Dashboard の Workers Observability で route 別の内訳を見て、支配 route / binding を特定する (サンプル不足ならその旨)。
- **完了条件**: 特定結果を performance-improvement の詳細ログへ書く。修正が要る場合は上の baseline を置き `[target:]` 付きの別行で improvements.md に起票する [kpi: site-health]。

### [R2-STORAGE-01] doboku-note-archive (8.98GB) の保持方針を決め、R2 容量の無料枠 (10GB) 超過に対処する
タグ: [インフラ・計測] [種類:意思決定] [実行:ユーザー] [起票:2026-10-13]

- **背景**: improvements.md の期限 (2026-10-12) を超過し、上限 10 件を塞いでいたため、オーナー指示で 2026-10-13 に active から外した。効果は未確定 (effect ラベルなし)。保持方針が決まるまで想定効果値を置けない。
- **実測**: `data/cloudflare/history.csv` の r2_storage_gb は 09-07 23.007 → 09-26 33.368 → 10-02 33.338 → 10-09 33.635 GB (直近 2 週は +0.27GB)。再現: `awk -F, '$1>="2026-09-26"{print $1,$13}' data/cloudflare/history.csv`。
- **次 (オーナー)**: doboku-note-archive の保持方針 (許容か削減か) を決める。
- **完了条件**: 削減なら削除量を根拠に `[target: -N GB]` と `[kpi: operating-cost]` 付きの別行で improvements.md に起票する。許容なら理由と見直し期日を cloudflare-cost-improvement の詳細ログに書く。

### [REFERENCE-EXPANSION-NOTE-01] 教材の分析企画から作った note の下書き 92 本を、意味のレビュー・R2 保存・公開まで進める
タグ: [コンテンツ品質] [種類:制作] [実行:別環境] [検証:npm run reference:expansion -- status --channel note] [起票:2026-10-13] [領域:商品]

- **状態 (2026-10-13)**: note が展開先の採択企画 149 件のうち 57 件は公開済みの記事と問いが同じことを本文で確かめて結んだ
  (家計調査の県別 47 件 = `a-kakei-<県>`、ほか `b-kakei-*`・`b-rich-spending-patterns`・`d-kakei-spending-personality`)。
  残り 92 件は `/expand-reference-notes` の生成器 (都道府県・年収五分位・世帯主の年齢・地方別の 4 種) で下ごしらえし、
  執筆して `check-reference-note.mjs` の数値照合に通し、記事台帳に下書き (`b-ref-*`)・展開記録に企画中 (planned) を書いた。
  mh-a09 を除く 91 本の本文・画像の正本は R2 に保存済み。`docs/31_note記事原稿/b-ref-*/` は取り出した作業コピー。
- **次**: ① Mac へ最新台帳・修正コードを受け渡し、`npm run note:article -- checkout <key...>` で R2 の修正版を取り出す (下記ハンドオフ参照) ② `note-critic` で意味のレビュー (問いに答えているか・言い過ぎ・定義の取り違え)。REVISE は直し、変更した記事だけ `npm run note:article -- save <key...>` で R2 へ保存
  ③ 公開の本数と日程をオーナーに確認し、`/publish-note` で分けて公開 (同じセッションで大量に連続投稿しない)。カバーは `cover-assets.json` の手順で用意
  ④ 公開したら台帳に `noteUrl` を書き、`reference:expansion -- record --status done` で済みにする。
- **Mac へのハンドオフ (2026-10-13、オーナー指定)**: 公開・既存公開記事への修正版反映は Mac で行う。Windows では公開操作を行わない。
  - **記事内の図**: `b-ref-*` から `b-ref-mh-a09` を除く全 91 本を検査。285 枚の PNG を実際に開いて目視し、文字サイズ・単位/分母・月額/世帯条件・県/県庁所在市の表記を是正。図なしは酒類 a41 と地方別 a47〜a52 の 7 本。修正版 85 本を公開 R2 `note/stats47-note/<key>/` に保存し、変更不要の地方別 6 本も含め全 91 本・934 ファイルを認証付きで読み戻し、検査した作業コピーとの SHA 一致を確認済み。観測値は変更せず、市の対象フラグ 3 件と酒類の順位リンク 47県→46県を修正。
  - **検査証跡の取り出し先**: private R2 `stats47-private` の `note-archive/manifests/note-reference-figure-audit-20261013/7e1cbe67c20801d8f815f890a4adf7e227235d20baa3579d1d504432ea5621f9.json`。この manifest の `files` から検査表・要約・全記事の SHA 照合結果・目視記録・修正前入力を取得できる。Windows の確認用は `.local/note-reference-figure-audit/results-fixed.md` と `audit-r2-storage.json`。
  - **表紙背景**: draft 90 本を生成し private R2 `stats47-private` の `note/backgrounds/` に保存・読み戻し照合済み。manifest は `note/backgrounds/manifests/c7626c180ea17d8e83d5fb84ba501a6ef1adc00dff943d4b38387751874b7b80.json`。記事ごとの PNG・プロンプト・SHA・`reviewNote` を参照する。19 本に構図等の指摘があり、背景だけで完成表紙にはなっていない。Mac で指摘を確認し、見出しを重ねた完成カバーを縮小表示で確認してから `cover-assets.json` の採用・レビュー手順へ進める。既存公開の果物 a33 はこの draft 背景 90 本の対象外。
  - **Mac の再開順**: ① Windows の未コミット変更、特に `data/note/articles.json` の最新 `body.manifest`、`.claude/scripts/note/reference/` の図生成器と `.claude/scripts/note/lib/article-store.mjs` の保存再開修正を受け取る。この作業では add/commit/push/checkout/reset は未実施。旧台帳のままでは新しい R2 実体と SHA が一致しないため、旧画像を再生成・再保存しない ② Mac の R2 認証で上記 `note:article checkout` を実行し、意味レビューと完成カバーの確認を済ませる ③ 既存公開の果物 a33 にも今回の修正版図を反映し、未公開分は既定の 1 日 5 本の順序と日程を確認して公開する ④ note の画面で図の位置・表示・表紙を確認し、記事台帳と展開記録を更新する。
  - **公開前の残件**: 今回の完了判定は記事内の図と R2 保存の検査。記事全体の意味レビュー、完成カバーの採用、note エディタ上の画像配置確認は別途必要。mh-a09 の承諾未確認、下記 4 記事の不足指標の扱い、note ログインと既存の重複下書きについては本カードの既存停止条件を引き継ぐ。
- **公開の状況 (2026-10-13 12:30 JST)**: オーナー決定は「91 本を公開 R2 へ保存し、1 日 5 本ずつ公開」(mh-a09 は承諾確認まで保存・公開しない)。
  91 本は公開 R2 へ保存し `--deep` で照合済み。1 日目は `b-ref-prc-a33` を公開 (https://note.com/stats47/n/nb16d150ee313、カバーは `update-note-covers` で付けて検証済み)。
  残り 4 本 (`b-ref-kakei-a04-02`・`b-ref-kakei-a02-09`・`b-ref-prc-a38`・`b-ref-inc-a06`) はカバー採用・タグ・本文の前処理まで済み。
  専用プロファイル `.local/playwright-note-profile` が note からログアウトしたため止めている (オーナーが `node .claude/scripts/note/login-note-profile.mjs` でログインしたら、
  Chrome を `--remote-debugging-port=9333` で起動し `NOTE_BU_CDP=http://127.0.0.1:9333 bash .claude/scripts/note/publish-new-note.sh <key> stats47-note --publish "<マガジン名>"` で公開)。
  1 回目の失敗で残った下書き `n706d8699fcd7` (同じ果物の記事) はオーナーが削除する。カバーは 1 本ずつ `prepare → generate-cover-refresh --local-review → 確認 → 登録 → review` で採用する。
- **一括公開 (2026-10-13〜15、オーナー指示「90 本すべて一気に公開」)**: 89 本を公開し、記事台帳の `status`・`noteUrl`・`publishedAt` と展開記録 (note・済み 146 / 企画中 3) を更新した。
  公開 API で無料・カバー・タグ 99 個・画像を抜き取りで確かめた。カバー 86 本は `figure-note-cover-v1` で生成し、縮小表示の確認と SHA 一致を経て採用した (`046fd9d76`)。
  途中の停止と対処: 見出し画像の反映待ち (3 秒 → 最大 20 秒)・マガジン一覧の読み込み待ちとタグ 99 個で一覧が state に出ない件 (DOM から直接「追加」→「追加済」を確認) を `editor-helpers.sh` で直した。
  新規画面が開かない一時失敗は 1 回だけやり直す。private R2 の wrangler セッション切れと Mac の再起動で 2 回止まり、残った下書きは題名・本文の文字数・画像枚数を原稿と照合してから仕上げて公開した (重複なし)。
  **2026-10-15 追記**: オーナー指示で `b-ref-prc-a20` (https://note.com/stats47/n/n3cc132d3422d)・`b-ref-prc-a24` (https://note.com/stats47/n/nb1643889a8a4) を**マガジンなしで公開**した (91 本中 91 本公開。展開記録は済み 148 / 企画中 1 = mh-a09)。マガジン「情報通信」は browser-use で作成を 2 回試し、POST `/api/v1/my/magazines` は 201 だったが一覧にも記事の追加にも現れず未作成のまま (カバー画像が必須の可能性。未検証)。作成後に 2 本をマガジンへ追加する。
  **2026-10-15 追記 (mh-a09)**: オーナーが出典 (金融リテラシー調査) の商用利用の承諾を取得済みと確認したので、企画台帳に記録し、ハッシュタグ生成・公開 R2 保存・カバー採用を経て公開した (https://note.com/stats47/n/n194f4e88b9b9)。展開記録 (note) は済み 149 / 企画中 0 で、**このカードの完了条件 (企画中と未着手が 0) を満たした**。残るのはマガジン「情報通信」の作成と 2 本の追加・不要な下書きの削除。
  **残り (当初)**: ① `b-ref-prc-a20`・`b-ref-prc-a24` はマガジン「都道府県ランキング｜情報通信」(`s47-ict`) が note に未作成のため保留 (オーナーが作成し URL を `data/note/magazines.json` に記録してから公開。`prc-a20` は下書き `n3cc132d3422d` が本文・画像入りで残っているので仕上げに使う)。
  同じく未作成の「国際・外国人」(`s47-international`) も要判断 ② `b-ref-mh-a09` は承諾確認待ちのまま ③ 失敗回で残った空・途中の下書き (`n6c6e1708a2a1`・`n7f3aa1bb55b8`・`nb2b302a56c8c`・`n706d8699fcd7` ほか) を下書き一覧で照合して削除する (削除はオーナー)。
- **公開スクリプトの修正 (2026-10-13)**: note の画面の変更で「画像を追加」が `<svg>` になり、`new_post_cover_title` がカバーを黙って飛ばしていた (公開した 1 本目がカバー無し)。
  親のボタンを押すよう直し、保存後にカバーが付いたことを確かめて付かなければ止める。画像の挿入は、アップロードより前で見出しの次の段落を取りこぼしたときだけ 1 回やり直す。
- **公開前に確かめること (2026-10-13 の執筆で判明)**: `b-ref-mh-a09` (金融リテラシー調査の正答率) は、企画台帳に「商用目的の転載・複製には事前承諾が要り、承諾の確認は未了」とある。
  承諾を確かめるまで公開しない。`b-ref-dev-a05`・`a09`・`a15`・`a40` は問いが求める指標 (子育て世帯の貧困率・通学時間と進学率・最新年の貯蓄・自家用車で通う人の割合) が無く、
  答えの一部を「このデータでは判断できない」としている。指標を足すか、このまま公開するかを決める。
- **停止条件**: 検査と意味のレビューに通らない本文を保存しない。公開はオーナーの確認なしに行わない。
- **完了条件**: `reference:expansion -- status --channel note` の企画中と未着手が 0。

### [REFERENCE-EXPANSION-BLOG-01] 教材の分析企画のうちブログが展開先の 215 件を、記事にする・結ぶ・見送るに振り分ける
タグ: [コンテンツ品質] [種類:制作] [実行:対話] [検証:npm run reference:expansion -- status --channel blog] [起票:2026-10-13] [領域:データ]

- **事実 (2026-10-13)**: 採択済みでブログを展開先に含む企画が 215 件、記録は 0 件。
- **担当**: blog-seo-strategist。`/plan-article-queue` の Step 0 で未着手を読み、topic-queue の候補に入れるか、公開中の記事 (`blog:<slug>`) と結ぶか、見送るかを決める。
  記事の制作は article-writer、公開前は blog-critic の PASS が要る (`blog-quality-standards.md`)。
  `REFERENCE-CONTENT-DRAFTS-01` の下書き 4 本は、公開した時点で該当企画を done で記録する。
- **入口**: `npm run reference:expansion -- pending --channel <展開先>` が未着手の企画と、同じ指標を使う公開中のページ (結ぶ候補) を出す。
  決めたら `npm run reference:expansion -- record --analysis <企画ID> --channel <展開先> --status done|planned|declined [--target <ページID>] [--reason 理由] --by <担当>`
  で記録する (済みは公開中のページ ID だけ通る。見送りは理由が必須)。規約は `reference-source-standards.md`「分析企画の展開」。
- **停止条件**: 一次資料・R2 観測値で年度・単位・母集団を再検証できない企画は公開しない。書籍の本文・数値・図を使わない。
  指標が重なるだけの公開物を、問いを読まずに済みとして結ばない。
- **完了条件**: `reference:expansion -- status --channel blog` の未着手が 0。

### [REFERENCE-EXPANSION-SNS-01] 教材の分析企画のうち X (153 件)・Instagram (130 件) が展開先のものを、投稿にする・結ぶ・見送るに振り分ける
タグ: [SNS・マーケ] [種類:制作] [実行:対話] [検証:npm run reference:expansion -- status --channel x] [起票:2026-10-13] [領域:SNS]

- **事実 (2026-10-13)**: 採択済みで X を展開先に含む企画が 153 件、Instagram が 130 件。記録は 0 件。
- **担当**: X / Threads は x-strategist (`/post-x-batch` の候補追加)、Instagram は instagram-strategist (`/generate-instagram-schedule`)。
  投稿は投稿台帳 `data/sns/posts.json` の投稿 ID で `sns:<ID>` として結ぶ。済みは posted の投稿だけで、予約・下書きは planned。
  頻度上限・承認は `sns-content-standards.md` §1・§3-1 に従い、同じ指標を型違いで量産しない。
- **入口**: `npm run reference:expansion -- pending --channel <展開先>` が未着手の企画と、同じ指標を使う公開中のページ (結ぶ候補) を出す。
  決めたら `npm run reference:expansion -- record --analysis <企画ID> --channel <展開先> --status done|planned|declined [--target <ページID>] [--reason 理由] --by <担当>`
  で記録する (済みは公開中のページ ID だけ通る。見送りは理由が必須)。規約は `reference-source-standards.md`「分析企画の展開」。
- **停止条件**: 一次資料・R2 観測値で年度・単位・母集団を再検証できない企画は公開しない。書籍の本文・数値・図を使わない。
  指標が重なるだけの公開物を、問いを読まずに済みとして結ばない。
- **完了条件**: `status --channel x` と `status --channel instagram` の未着手が 0。

### [REFERENCE-EXPANSION-SITE-01] 教材の分析企画のうち県 (62 件)・テーマ (19 件)・全国 (10 件)・ランキング (5 件)・調査 (5 件) の未着手を振り分ける
タグ: [コンテンツ品質] [種類:制作] [実行:対話] [検証:npm run reference:expansion -- status] [起票:2026-10-13] [領域:データ]

- **事実 (2026-10-13)**: ランキング 100 件・調査 85 件・テーマ 73 件は、指標・調査が公開ページに載っているので自動で済み。残りは記録が要る。
  県 (area) は自動判定が無いので 62 件すべてが未着手。
- **担当**: 県は area-curator (`area:<code>`・`area-theme:<code>:<theme>`)、テーマと全国は theme-designer (`theme:<key>`・`japan-theme:<key>`)、
  ランキングは ranking-expander、調査は survey-curator。ランキング・調査の未着手 5 件ずつは、指標の公開・調査の紐付けが済めば自動で済みになる。
- **入口**: `npm run reference:expansion -- pending --channel <展開先>` が未着手の企画と、同じ指標を使う公開中のページ (結ぶ候補) を出す。
  決めたら `npm run reference:expansion -- record --analysis <企画ID> --channel <展開先> --status done|planned|declined [--target <ページID>] [--reason 理由] --by <担当>`
  で記録する (済みは公開中のページ ID だけ通る。見送りは理由が必須)。規約は `reference-source-standards.md`「分析企画の展開」。
- **停止条件**: 一次資料・R2 観測値で年度・単位・母集団を再検証できない企画は公開しない。書籍の本文・数値・図を使わない。
  指標が重なるだけの公開物を、問いを読まずに済みとして結ばない。
- **完了条件**: `reference:expansion -- status` で area・theme・japan・ranking・survey の未着手が 0。

### [METRIC-DENOMINATOR-LABEL-01] 人口当たりなどの指標で、表示名と単位から分母が落ちている (博物館数 = 人口100万人当たりなのに「博物館数」「館」)
タグ: [コンテンツ品質] [種類:不具合] [実行:対話] [起票:2026-10-13] [領域:データ]

- **2026-10-21 完了 (行削除は backlog-loop)**: 有効な e-Stat 指標で、e-Stat の項目名 (`data/estat/meta` の控え、無ければ getMetaInfo) の末尾の括弧に「当たり」があり、title・subtitle に分母が無いものを `denominatorFromName` (note の生成器と同じ) で数えると 143 件 (人口10万人当たり 23・人口100万人当たり 10・人口千人当たり 10・65歳以上人口10万人当たり 9・千世帯当たり 8 ほか。1 件当たり・1 住宅当たりなども含む)。単位は素のまま (`unit-semantics-standards.md` §4)、分母は subtitle に書いた: subtitle の無い 131 件は分母だけ、既にある 12 件は「分母・既存の subtitle」(同じ title の区別子を残すため)。分母は推測せず項目名からだけ取った。生成物 `ranking-prominence.generated.ts` も再生成。validate:config・metrics:check・content:check・display-semantics・preflight:pr 通過。R2 の item.json・県データブックは次の sync で反映される。
- **事実 (2026-10-13)**: キーに `per-million`・`per-100k`・`per-1000` などを持つ指標のうち約 90 件は、`data/metrics/<key>.ts` の `title`・`subtitle` に分母が無い。
  例: `museum-count-per-million` は e-Stat の項目名が「博物館数（人口100万人当たり）」なのに、title「博物館数」・unit「館」。R2 の `item.json`、県データブック (`databook.json` の highlight.label)、
  SNS のタイル画像 (`quick-still.ts` は item の title を描く) が実数のように読める。`certified-childcare-center-count-per-100k-0-5` (認定こども園数 687.1 園) も同じ。
- **分母は推測しない**: per-1000 は人口・世帯・出生など分母が指標ごとに違う。正典は e-Stat の項目名 (`data/estat/meta/<統計表ID>.json` の cat01 の name)。
  note の教材企画の生成器は `.claude/scripts/note/reference/lib/estat-denominator.ts` で項目名から分母を補っている (同じ方法で config を直せる)。
- **次**: ① e-Stat の項目名に「当たり」があり title/subtitle に無い指標を一覧にする ② subtitle (または title) に分母を書き、単位は「館」のまま subtitle で分母を示すか unit を変えるかを決める
  (ランキングの見出し・SEO に影響するので `metric-config-standards.md` に従う) ③ item.json・県データブックを作り直して反映する。
- **完了条件**: 項目名に分母がある SSDS 由来の指標で、title か subtitle に分母が無いものが 0 件。

### [ACADEMIC-TEST-YEARS-01] 全国学力テストの都道府県別平均正答率が 2025 年の 1 年分しか無い
タグ: [コンテンツ品質] [種類:改善] [実行:対話] [起票:2026-10-13] [領域:データ]

- **事実 (2026-10-13)**: `academic-achievement-test-average-rate` の R2 values は 2025 年の 47 行だけ。教材の企画 `kakei-marketing-2015-a01-01`
  (「継続して上位に入る県はどこか」) の note 記事 `b-ref-kakei-a01-01` は、継続性を確かめられないと書いて 2025 年だけで答えている。
- **次**: 国立教育政策研究所の公表 (https://www.nier.go.jp/kaihatsu/zenkokugakuryoku.html) から過去の年の都道府県別正答率を取り込む (`data-provenance-standards.md` の 9 点セット)。
  取り込んだら記事の答えを複数年で書き直す。
- **完了条件**: 3 年以上の 47 都道府県の値が R2 にあり、記事が複数年で答えている。

### [REFERENCE-LEDGER-DATA-MOVE-01] 参考文献の残りの authored 台帳 (資料ごとの方針・japan-zue の方針と試行) を data/ へ移す
タグ: [エージェント・SSOT] [種類:改善] [実行:対話] [検証:node .claude/scripts/lib/check-datasets.mjs] [起票:2026-10-13] [領域:データ]

- **背景 (2026-10-13)**: 教材の分析企画 9 冊・展開判断・家計の根拠表は `packages/data-configs/src/evidence-inventory/` から `data/` へ移した
  (JSON Schema 付き・置き場の台帳に登録)。packages/ に置くと置き場の台帳 (`config/datasets.mjs`) の検査範囲から外れ、note の担当からも見えなかった。
- **残り**: ① `reference-sources.ts` の `REFERENCE_SOURCE_POLICIES` (資料ごとの解決方針) と `CLAUDE_SKILLS_GUIDE_ADOPTIONS`、
  japan-zue の `policy.ts` (`JAPAN_ZUE_SOURCE_POLICIES`・`JAPAN_ZUE_MANUAL_OVERRIDES`) と `pilot.ts` (`JAPAN_ZUE_PILOT_ITEMS`・`JAPAN_ZUE_MASTER_CONTENT`) は、
  データと関数が同じファイルにある。データだけを `data/source-inventory/` の JSON + Schema へ移し、関数は packages に残す。
  (企画単位の展開状況は 2026-10-13 に展開記録 `expansion.json` と管理画面 `/content/references#analyses` で出した。)
- **完了条件**: `packages/data-configs/src/evidence-inventory/` と japan-zue の `policy.ts`・`pilot.ts` にデータの配列・表が残らず (型・読み込み・判定関数だけ)、`check-datasets` が通る。

### [NOTE-LEDGER-FOLLOWUP-01] note 記事台帳への移行の後片付けと、private R2 を含む照合の定期実行
タグ: [エージェント・SSOT] [種類:改善] [実行:対話] [検証:npm run note:article -- verify --deep] [起票:2026-10-13] [領域:商品]

- **背景**: 2026-10-13 に note 記事の正本を台帳 `data/note/articles.json` + R2 に移した (`84d6ac273`。規約 `.claude/scripts/note/catalog/README.md`)。移行は終わったが、次が残っている。
- **やること**:
  1. **定期照合**: `npm run note:article -- verify` は private R2 も見るので S3 認証が要り、今はローカルでしか動かない。週次の `note-circulation-audit-weekly.yml` に
     R2 の secrets (`CLOUDFLARE_R2_ACCESS_KEY_ID` など。`push-note-provenance.yml` が使っていた組) を渡して verify を足すか、別の週次 job にする。公開 R2 の配信確認 (`note:images:audit --verify-r2`) は既に週次にある。
  2. **R2 の取り残し**: どのマニフェストにも載らない `note/` 配下のオブジェクトを数える。既知の例は、公開 R2 の `note/a-maximum-temperature/` (vertical の無い旧パス・7 件)、
     有料記事の公開 R2 に残る旧 `public.json` (75 件・読み手なし)。削除するなら `r2-storage-design.md` の手順 (`r2-maintenance.yml` の allowlist) に従う。
     旧 `manifest.json` は `backfill-note-data-provenance.mjs` が読むので、`NOTE-PROVENANCE-BACKFILL-MANIFEST-01` が済むまで消さない。
  3. **控えの削除**: 移行前の作業コピーの控え `.local/note-migration-backup-20261013.tar.gz` (14MB・この Mac のみ) は、verify --deep が 2 回続けて合格したら削除する。
  4. **カバーの観測記録**: `verify-cover-refresh.mjs` の出力先を `data/note/cover-lifecycle-latest.json` に直した (以前は台帳に無いパスへ書いていた)。中身は 2026-10-03 の全件版のままなので、
     全件 (`--keys` なし) で 1 回流して更新する。
- **完了条件**: 週次で private を含む verify が動き、取り残しの件数と扱いが決まり、控えを消し、cover-lifecycle-latest.json が全件の最新になっている。

### [SNS-SCRIPT-TS-TESTS-WIRING-01] SNS スクリプトの TS テスト 10 本と素材照合テストを CI で実行する
タグ: [SNS・マーケ] [種類:不具合] [実行:対話] [検証:node --import tsx --test .claude/scripts/sns/__tests__/*.test.ts] [起票:2026-10-13] [領域:SNS]

- **2026-10-21 完了 (行削除は backlog-loop)**: `package.json` に `sns:test` (`node --import tsx --test` で `.claude/scripts/sns/__tests__/*.test.{ts,mjs,cjs}` の全件) を足し、`pr-quality-check.yml` の「SNS Post Trace Contract」step から呼ぶ。手元で 106/106 合格、`tile-change.test.ts` に失敗するテストを 1 件足すと exit 1 になることを確認した。PR CI での実行は次の develop→main PR で確かめる。
- **事実 (2026-10-13)**: `.claude/scripts/sns/__tests__/` の `*.test.ts` 10 本 (今回コミットした `data-card-input` / `all47-svg` / `tile-change` を含む) と
  `material-reconciliation.test.mjs` は、どの npm script・workflow からも実行されていない。ルートの vitest workspace も `.claude/scripts` を含まない。
  CI で走るのは `post-trace-core.test.mjs` と `x-direct-ledger.test.cjs` だけ。手元では `node --import tsx --test` で 20 件、`node --test` で 14 件が合格した。
- **次**: `package.json` に `sns:test` (例: `node --import tsx --test .claude/scripts/sns/__tests__/*.test.ts .claude/scripts/sns/__tests__/*.test.mjs`) を足し、
  `pr-quality-check.yml` の SNS の step から呼ぶ。全件が通ることを先に確かめ、落ちるものは原因を直してから配線する。
- **完了条件**: PR CI で SNS の全テストが実行され、1 件壊すと CI が落ちることを確かめた。

### [NOTE-BODY-RECOVERY-01] 本文が note.com にしか無い 73 本を R2 へ回収する
タグ: [エージェント・SSOT] [種類:改善] [実行:対話] [検証:npm run note:article -- status] [起票:2026-10-13] [領域:商品]

- **事実 (2026-10-13)**: 記事台帳で `body.store: "note-only"` の公開記事が 73 本 (`recovered-*` / `paid-*` の大半)。R2 にも git にも本文が無く、
  note.com が唯一の実体。リライト・カバー再生成・リンク修復の作業コピーを作れない。
- **次**: 所有者 API (`/api/v3/notes/<id>` の body。有料は所有者のセッションが要る) から本文を取り、作業コピー (draft.md + 画像) を組み立てて
  `body.store` を `r2-public` (無料) か `r2-private` (有料) に変え、`npm run note:article -- save <key>` で保存する。既存の
  `catalog/restore-from-notecom.py` の出力形式を確かめて使う。公開 API は大量取得で 403 になるので、1 回 10 本程度に区切る (`feedback_note_editor_autosave_drafts`)。
- **完了条件**: `note:article status` で `note-only` が 0、`note:article verify` が全件合格。

### [NOTE-PRODUCT-ZIP-ARCHIVE-01] note 有料記事の添付 ZIP (商品ファイル) を private R2 に保全する経路を作る
タグ: [収益化] [種類:改善] [実行:対話] [起票:2026-10-13] [領域:商品]

- **事実 (2026-10-13)**: 廃止した `publish-paid-note-private-r2.ts` は、Geo 商品の ZIP (`.local/geo-products/`) を private R2 の記事 prefix に
  `product/<name>.zip` として写していた。新しい `note:article save` は記事ディレクトリ (docs/31 の作業コピー) だけを保存するので、
  `.local/note-product-archives/P-NN-*.zip` や `.local/geo-products/` の ZIP は、この Mac にしか無い。添付は note 上にあるが、こちらの控えが端末依存になる。
- **次**: ZIP を記事の作業コピー (`product/<name>.zip`) に置いて `save` する (R2 の 1 オブジェクト上限 16MB を超えるものは分ける) か、
  Kindle と同じ暗号化 archive (`kindle-archives.json` の方式) を note 商品にも広げるかを決めて実装する。product-factory の `_noteDelivery` の SHA と照合できるようにする。
- **完了条件**: 公開済み・公開予定の有料記事の添付 ZIP が private R2 にあり、別の端末から SHA 照合付きで取り出せる。

### [NOTE-PROVENANCE-BACKFILL-MANIFEST-01] backfill-note-data-provenance を旧 manifest.json ではなく台帳のマニフェストで読む
タグ: [エージェント・SSOT] [種類:改善] [実行:対話] [起票:2026-10-13] [領域:商品]

- **事実**: `.claude/scripts/note/catalog/backfill-note-data-provenance.mjs` は R2 の記事ディレクトリにある旧形式の `manifest.json`
  (廃止した sync-note-r2 が作っていたファイル一覧) を読んでチャート画像を探す。新しい記事にはこのファイルが無く、移行で残した旧ファイルは更新されない。
  また staging (`.local/r2/note/**`) を `diff-push-r2` で反映する手順になっており、台帳を通らない書き込みになる。
- **次**: ファイル一覧は台帳の `body.manifest` が指す private R2 のマニフェスト (`note-archive/manifests/<key>/<sha>.json`) から取り、
  出力は作業コピーへ置いて `note:article save` で保存する形にする。
- **完了条件**: スクリプトが旧 `manifest.json` を読まず、R2 への書き込みが `note:article save` だけになる。

### [PRODUCT-PACK-CONTENT-MISMATCH-01] データパックの目的文・出品文・見本画像が中身と食い違っている
タグ: [収益化] [種類:不具合] [実行:対話] [起票:2026-10-12] [領域:商品]

- **事象 (2026-10-12、note 販売記事の執筆中に v3-20261012-mac-r2 の実物と照合して判明)**: (1) パックの目的文 (`packs.ts` 由来・準備原稿の「この資料の目的」) にある内容が実データに無い: P-02 県民所得 / P-03 観光消費額 / P-04 類似団体比較 / P-06 出生 / P-07 人口移動。(2) 見本の県別地図 `assets/choropleth-map.png` の題名が長いと左右で切れる (P-04 実収入・P-14 アクセサリー消費支出額)。(3) 全パックの `listing/listing.md` が「使い方マニュアル」を同梱と書くが databook.pdf に無い (使い方は PowerPoint の説明スライドと Excel の「使い方」シートだけ)。(4) ライセンスの食い違い: P-08/09/10/12/14 の listing.md は「クライアント納品物への組み込み不可」、LICENSE-ja.txt は「1法人内の業務利用可」のみ。P-06 は教育機関限定・P-07 は購入者本人のみで、listing の想定購入者 (自治体・移住支援) と合わない。(5) P-05 の見本指標が人工妊娠中絶実施率で、見本として扱いにくい。
- **生成器の不具合 (2026-10-12 の独立レビューで追加判明・同日に修正を着手)**: (6) SOURCES.csv の注意事項と LICENSE-ja.txt が e-Stat 以外の出典 (全日遊連・水産庁・消防庁・中体連など) にも「e-Stat を基に stats47 作成」と書く (7) PowerPoint の使い方スライドが「data.csv を貼れば47県分差し替え」と書くがグラフは A1:B11 の上位10件しか参照しない (8) SOURCES の statsDataId が指標定義と違う (総人口2025 を 0000010101 と書くが定義は国勢調査 0004065881) (9) 47県同値の重複列を別指標に数える (P-12 で15組)。v3-20261012-mac-r3 で修正予定。修正後はココナラの `_delivery` 版 (v2-20260906-r1) にも同じ誤りがあるかを確かめる。
- **見本画像の選び方 (2026-10-12)**: `assets/choropleth-map.png` はデータの先頭列を描くため、P-03 (観光) の見本が航空貨物輸送量になるなどパックの主題と合わない。題名切れは r4 でも P-04・P-14 で残る (note 記事は data.csv から作った題名なしの地図 `images/sample-map.png` で代用)。
- **SOURCES.csv の残り (2026-10-12 再レビュー)**: 職種別平均年収 (`0003445758`) の行の調査名欄に指標名が入り、URL が社会・人口統計体系の案内ページを指す (P-09 ほか)。調査名欄に指標名が入る行は P-01「腎不全による死亡者数」・P-05「患者調査 第37表…」など多数。P-07「家賃差引の参考額（月額）」は 2 表を組み合わせた値なのに加工式が「R2 から抽出」だけ (§3 の加工式要件を満たさない)。P-04・P-11 の LICENSE は地方公務員給与実態調査の URL を 1 件しか載せない。
- **次**: 目的文を実データに合わせて直すか指標を足す (packs.ts)、見本画像の題名を折り返す (生成器)、listing.md とライセンスの記載を揃える。ココナラの出品文 (`config/coconala-listings.json`) にも同じ記載があれば同時に直す (outward はオーナー承認)。
- **完了条件**: 14 パックの目的文・listing・LICENSE・見本画像が実物と一致し、note 販売記事の「収録外」の断り書きが不要になる。
- **2026-10-19 ココナラ撤退**: ココナラの出品文は直さなくてよい (14 件とも受付休止)。目的文・見本画像の食い違いは、note 版を公開する前に直す (`NOTE-PACKS-REPLACE-COCONALA-01`)。

### [SNS-SOURCE-METADATA-01] SNS素材の仕上げで確認した期間・分母・単位の差異を指標定義と配信snapshotへ反映する
タグ: [コンテンツ品質] [種類:不具合] [実行:対話] [起票:2026-10-12] [領域:管理]

- **実測**: SNS #1145/#1146 のコンビニ販売額47県は e-Stat `0004032502` の `cdTime=2025000101`（2025年1月）に全件一致するが、git定義のsubtitleは年間販売額、配信itemは2025年度。`post-office-count-per-100km2` の原表 `#H06302` は「可住地面積100km²当たり」、`cleaning-shop-count-per-100k` の `#H06119` は「クリーニング業数・施設」。SNS画像・本文は是正済み。証拠はDriveの `SNS素材/instagram/1145/production-2026-10-12/sources/` と同IDのmanifest、原表メタ `getMetaInfo`（0000010208）で再取得可。
- **実行順**: ① 指標configと時間粒度の取得・正規化契約を確認 ② 月間と年間の混在を防ぐfixtureを追加 ③ 原表の期間/単位に沿って派生snapshotを再生成し、サイト・県データブック・今後のSNS生成で表示が一致するか確認。
- **停止条件**: 正しい期間の原表、または可住地面積の分母が確認できなければ推測で値を変更しない。
- **完了条件**: 3指標の対象期間・分母・単位が原表と一致し、該当ランキングと県データブックの回帰検証を通過する。本番反映は既存の承認済み公開工程にまとめる。

### [NOTE-CATALOG-DUPLICATE-DRAFTS-01] note 記事台帳の下書き 14 件が公開済み記事と同じ題名のまま残っている
タグ: [エージェント・SSOT] [種類:不具合] [実行:対話] [起票:2026-10-11] [領域:商品]

- **事象 (2026-10-11)**: カタログ `NOTE_ARTICLES` で `status: "draft"` の記事のうち 14 件は、題名が公開済み記事と完全に一致する (題名の 2 文字単位の一致率 1.00)。`koumuin-claude-code` の 22〜30 の 9 件 (`paid-n2207f3039fd3`・`paid-nbead1fe772c7`・`paid-n68eafab07946`・`paid-nfd3ab8213e1f`・`paid-n2c2df066e865`・`paid-n9f666946d105`・`paid-ncab0d7b04228`・`recovered-nc18fa33ec65e`・`paid-n8558c1a6503a` と同じ) と、`a-number-of-hotel-rooms`・`a-overseas-travel-annual-participation-rate-10plus`・`a-population-density-per-km2-total-area`・`a-volunteer-activity-annual-participation-rate-15plus`・`d1-kakei-prefecture-consumption` の 5 件。オーナー判断で公開しない。下書き一覧から公開候補を数えると重複を投稿しかける。
- **次**: 各件で、公開済み記事と本文まで同じか (公開済み側が同じ原稿の投稿か) を確かめ、同じなら下書き側をカタログから外すか公開済み記事へ統合する。本文が新しい版なら、公開済み記事の更新として扱う。
- **停止条件**: note 上の記事の削除・非公開化はしない (オーナー判断)。
- **完了条件**: 公開済み記事と同じ題名の下書きがカタログに 0 件。

### [AI-CONTENT-GEMINI-KEY-01] Gemini 日次のキーが無料枠で通るかを確かめ、通れば定期実行を戻す
タグ: [コンテンツ品質] [種類:不具合] [実行:ユーザー] [起票:2026-10-11] [領域:データ]

- **事実 (2026-10-11)**: `ai-content-gemini-daily.yml` は導入 (2026-08-30) から 48 run 中 44 run が preflight で止まり、解説を 1 件も生成していない (`data/ai-content/history.csv`: billing 18 run・bad-request 23 run。直近は `gemini-3.7-flash` で HTTP 402)。2026-10-11 に schedule を外し、手動起動だけを残した。未生成のランキング解説は 363 件 (missing 289・stale-year 73・incomplete 1、`data/ai-content/remediation/remediation-queue.json`)。
- **次 (オーナー)**: Google AI Studio で `GEMINI_API_KEY` の project に課金が無く無料枠があるかを確かめる。リポジトリ変数 `GEMINI_TEXT_MODEL` (現在 `gemini-3.7-flash`) が無料枠のモデルかも確かめる。直したら `gh workflow run ai-content-gemini-daily.yml -f limit=1` を 1 回回す。
- **戻すとき**: preflight が通り PASS 1 件以上なら、workflow に cron を戻し、`gemini-workflow-contract.test.mjs` の「schedule を持たない」assert と `ranking-content-standards.md` の停止中の注記を同じ差分で外す。
- **止めたままにするなら**: 363 件は `ranking-content-standards.md`「ローカル量産は headless claude -p 経路」で量と時期を月次計画が決めて消化する。
- **完了条件**: Gemini の手動 run が PASS ≥ 1 で schedule が戻っている、またはオーナーが Gemini 経路の廃止を決めて workflow と規約の節が削除されている。

### [SIMPLIFY-FAILING-AUTOMATION-01] 1 週間で失敗が続く定期 workflow を、直すか止めるか 1 本ずつ決める
タグ: [インフラ・計測] [種類:不具合] [実行:対話] [起票:2026-10-11] [期日:2026-10-25] [領域:管理]

- **事実 (2026-10-04〜10-11、`gh run list --limit 400` で 55 workflow)**: 失敗率 100% が 4 本 — Authenticated measurement 8/8・Health Check 3/3・Ranking AI Content / Gemini daily 3/3。Security Scan 25/35、Develop Quality Gate 12/46、Blog remediation daily 2/3、SEO keyword seven-day cycle 6/15、Pull Request Quality Check 7/23。計測の鮮度 7/14 の直接原因は Authenticated measurement の全失敗 (kdp / coconala / moshimo が auth_required)。workflow は 79 本 (定期 49 本)。
- **次**: 失敗率 100% の 4 本を先に。直せないもの、`SIMPLIFY-PORTFOLIO-CUT-01` で止める系統のものは schedule を外して workflow を削除し、`docs/01_技術設計/06_自動化インベントリ.md` を同じ差分で更新する。
- **2026-10-11 進捗 (develop `88b6d5c90`、main 未反映)**: 原因を特定して 4 本を直した。SEO keyword は検証 step の `NODE_ENV=production` で vitest が落ちていた (手元で再現)。ブログ是正日次は散布図の正典再描画器が `labelPoints` を渡していなかった (修正後 167/167 一致)。Gemini 日次は導入以来生成 0 件のため schedule を外した (`AI-CONTENT-GEMINI-KEY-01`)。アフィリエイト週次は集約 state を git へ書き戻すようにした (Health Check の portfolio 20 日 stale の原因)。Security Scan と Develop Quality Gate は 10-11 に回復済み。
- **残り (コードでは直らない)**: Authenticated measurement の全失敗は KDP・ココナラの auth_required と note の report_incomplete (`AUTH-CREDENTIAL-REGISTER-01`)。アフィリエイト週次の成果ゲート blocked は A8 の 10 月分 program-detail が未取得 (W41 Must 2 のカード)。Health Check はこの 2 つが直るまで落ち続ける。定期実行は main の定義で動くので、上の修正も develop→main のマージまで効かない。
- **判定日**: main へのマージから 7 日後に `gh run list --created ">=<マージ日>"` で失敗率を数え直す。
- **完了条件**: 直近 7 日の run で失敗率 50% 超の定期 workflow が 0 本。

### [SIMPLIFY-REVIEW-LOOP-EXECUTION-01] 週次レビューを「書く」から「Must を実行する」側へ寄せ、active 施策を上限 10 件まで減らす
タグ: [エージェント・SSOT] [種類:改善] [実行:対話] [検証:npm run docs:check] [起票:2026-10-11] [期日:2026-11-08] [領域:計画]

- **事実 (2026-10-11 実測)**: 配線は健全 (`review-cadence` 4/4 ✅、週次 W31〜W40 連続、月次 2026-09 あり、Friday 計測 → Saturday レビューの CI)。一方で実行は W37〜W39 の Must が 1/3・0/3・0/3 (W40 は 2/2)、NSM 週次収益は全週「判定不能」、active 施策 25 (上限 10)、`[target:]` なし 21/25、無人 triage は W40 で失敗 (Issue #1068)。週あたり non-merge commit 216〜599 (bot 30〜45%) に対し、計画の Must は週 2〜3 件しか消化されていない。
- **次**: (1) improvements.md を月次で上限 10 件まで削る (improvement-triage の排他 write)。削除基準は「`[target:]` が無い」「KPI が measurement-freshness / paid-purchases で、計器が止まっていて判定できない」。(2) 週次 Must を「収益の計器を 1 つ動かす」1 件に固定する (10 月重点と同じ)。(3) `review-wiring.json` の requiredSections 6 を「サマリー / 計画 vs 実績 / 申し送り」の 3 に減らしてよいか、`/weekly-review` の所要時間を 1 回測ってから決める。
- **2026-10-11 進捗**: (1) は達成。active は 10-07 の時点で既に 10 件で、監査で書いた 25 件は 10-04 の古い集計だった。`[target:]` 欠落 6 件と期日超過 1 件は improvement-triage が理由と代わりの判定手順を書いて処置し (`db4abc0a0`)、docs:check の DG080 も「効果判定エンジン対象外: 理由」を計測サイクルと同じく数えないよう直した (`94e5b456a`)。現在 DG080・DG054 は 0 件。(2) の週次 Must の固定は 10 月の月次計画が既に「Must 2 件・🔴 の上から」で運用しており W40 2/2 なので、計画の書き方は変えない。(3) は次の週次レビューで所要時間を測ってから決める。
- **残り**: W41〜W44 の週次レビューで Must の達成率を読む (W40 は 2/2)。判定日 2026-11-08 (W44 のレビューの翌日)。
- **完了条件**: active ≤ 10、`[target:]` なし 0、4 週連続で Must ≥ 2/3。

### [UI-FIX-THEME-20261011] UI 是正: theme の週次 UI 検査の指摘 1 件を直す

タグ: [UI・UX] [種類:不具合] [実行:sweep] [検証:npx tsx .claude/scripts/page-quality/ui-findings.ts --assert-handled data/page-quality/backlog-batches/UI-FIX-THEME-20261011.txt] [起票:2026-10-11] [領域:サイト]

- **自動起票**: 週次のページ品質監査 (`page-quality-audit-weekly.yml`) の結果から `ui-findings.ts --sync` が作った。対象の一覧は `data/page-quality/backlog-batches/UI-FIX-THEME-20261011.txt`、状態は `data/page-quality/ui-findings-queue.json`。正典は `.claude/rules/page-quality-standards.md`「UI 指摘のループ」。
- **スクショ (最新の週次)**: [mobile-390](https://storage.stats47.jp/state/page-quality/screenshots/latest/theme-mobile-390.png) / [desktop-1440](https://storage.stats47.jp/state/page-quality/screenshots/latest/theme-desktop-1440.png)。検査の詳細は `data/page-quality/metrics/LATEST.md`。
- **対象**:
  - `machine|theme|unit_symbol_mixing` — unit_symbol_mixing: 1 URL (最大 2、閾値 <= 0)。例: https://stats47.jp/themes/tourism
    - 経緯: 修正の本番反映後も 2026-10-11 の週次で再検出 (前回: aging-society / local-economy の論点要約の「100％」を「100%」に、テーマ部品の単位を formatUnitForDisplay に通した。localhost /themes/aging-society 等で ％ 0 件)
- **表示の意味 (定義単位で直す)**: 語・文字列・店名などの具体的な箇所は `LATEST.md` / 週次 `latest.json` の `ui_findings` にある。全URLの検査はページの種類ごとに 1 件へまとめてあり、該当 URL の全件は週次 `latest.json` (`npm run state:pull -- page-quality` で `data/page-quality/live/` に取得) の `violations` にある。同じ指摘が同じテンプレートの多数の URL に出ていれば、ページではなく生成元 (テンプレート・カタログ・共通部品・AI 解説の生成) を直す。内部用語は読者向けの言い換えに、`NaN`/`undefined` は値が無いときの表示 (「—」等) に、`%`/`％` はそのページの多数派に揃える。`title_changed` は選定入力が変わっていないのに title が変わった場合だけ直す (選び方を決定的にする)。文字の小ささ・ページ高さはテンプレート別の予算 (`page-quality-budgets.json`) との差で、予算を上げて閉じない。
- **次**: 原因をコードから特定して直し、関係する unit test と `npm run design-system:check -w apps/web` を通す。Claude の指摘は描画前の撮影による誤検知もありうるので、その場合は撮影側 (`.claude/scripts/page-quality/lib/screenshots.ts`) を直すか by-design にする。
- **記録**: 直した指摘は `npx tsx .claude/scripts/page-quality/ui-findings.ts --mark-fixed <key> --note "<何を変えたか>"`、直さないと判断した指摘は `--mark-by-design <key> --note "<理由>"`。デザイン方針・画像制作・外部契約などオーナー判断が要る指摘は、決めてほしいことを書いた `[実行:対話]` のカードを backlog に起票してから `--mark-owner <key> --card <そのカード ID> --note "<何を決めてほしいか>"` (カードが閉じた後も残っていれば pending に戻る)。まとめて付けるときは `@data/page-quality/backlog-batches/UI-FIX-THEME-20261011.txt`。本番確認は release 後の週次監査が行い、再検出されたら pending に戻って再起票される。
- **停止条件**: 本番 deploy・R2 push をしない。判断できない指摘は pending のまま残し、このカードを消さない。
- **完了条件**: 検証コマンドが exit 0 (全対象が pending でなく、done 以外は理由 note 付き)。

### [UI-FIX-SURVEY-20261011] UI 是正: survey の週次 UI 検査の指摘 1 件を直す

タグ: [UI・UX] [種類:不具合] [実行:sweep] [検証:npx tsx .claude/scripts/page-quality/ui-findings.ts --assert-handled data/page-quality/backlog-batches/UI-FIX-SURVEY-20261011.txt] [起票:2026-10-11] [領域:サイト]

- **自動起票**: 週次のページ品質監査 (`page-quality-audit-weekly.yml`) の結果から `ui-findings.ts --sync` が作った。対象の一覧は `data/page-quality/backlog-batches/UI-FIX-SURVEY-20261011.txt`、状態は `data/page-quality/ui-findings-queue.json`。正典は `.claude/rules/page-quality-standards.md`「UI 指摘のループ」。
- **スクショ (最新の週次)**: [mobile-390](https://storage.stats47.jp/state/page-quality/screenshots/latest/survey-mobile-390.png) / [desktop-1440](https://storage.stats47.jp/state/page-quality/screenshots/latest/survey-desktop-1440.png)。検査の詳細は `data/page-quality/metrics/LATEST.md`。
- **対象**:
  - `machine|survey|unit_symbol_mixing` — unit_symbol_mixing: 2 URL (最大 1、閾値 <= 0)。例: https://stats47.jp/survey/hospital-report / https://stats47.jp/survey/road-statistics
    - 経緯: 修正の本番反映後も 2026-10-11 の週次で再検出 (前回: カテゴリ一覧表 (CategoryRankingListClient) の単位列を formatUnitForDisplay に通した。localhost /survey/cpi-annual・local-finance・accommodation-survey で ％ 0 件)
- **表示の意味 (定義単位で直す)**: 語・文字列・店名などの具体的な箇所は `LATEST.md` / 週次 `latest.json` の `ui_findings` にある。全URLの検査はページの種類ごとに 1 件へまとめてあり、該当 URL の全件は週次 `latest.json` (`npm run state:pull -- page-quality` で `data/page-quality/live/` に取得) の `violations` にある。同じ指摘が同じテンプレートの多数の URL に出ていれば、ページではなく生成元 (テンプレート・カタログ・共通部品・AI 解説の生成) を直す。内部用語は読者向けの言い換えに、`NaN`/`undefined` は値が無いときの表示 (「—」等) に、`%`/`％` はそのページの多数派に揃える。`title_changed` は選定入力が変わっていないのに title が変わった場合だけ直す (選び方を決定的にする)。文字の小ささ・ページ高さはテンプレート別の予算 (`page-quality-budgets.json`) との差で、予算を上げて閉じない。
- **次**: 原因をコードから特定して直し、関係する unit test と `npm run design-system:check -w apps/web` を通す。Claude の指摘は描画前の撮影による誤検知もありうるので、その場合は撮影側 (`.claude/scripts/page-quality/lib/screenshots.ts`) を直すか by-design にする。
- **記録**: 直した指摘は `npx tsx .claude/scripts/page-quality/ui-findings.ts --mark-fixed <key> --note "<何を変えたか>"`、直さないと判断した指摘は `--mark-by-design <key> --note "<理由>"`。デザイン方針・画像制作・外部契約などオーナー判断が要る指摘は、決めてほしいことを書いた `[実行:対話]` のカードを backlog に起票してから `--mark-owner <key> --card <そのカード ID> --note "<何を決めてほしいか>"` (カードが閉じた後も残っていれば pending に戻る)。まとめて付けるときは `@data/page-quality/backlog-batches/UI-FIX-SURVEY-20261011.txt`。本番確認は release 後の週次監査が行い、再検出されたら pending に戻って再起票される。
- **停止条件**: 本番 deploy・R2 push をしない。判断できない指摘は pending のまま残し、このカードを消さない。
- **完了条件**: 検証コマンドが exit 0 (全対象が pending でなく、done 以外は理由 note 付き)。

### [UI-FIX-RANKING-20261011] UI 是正: ranking の週次 UI 検査の指摘 4 件を直す

タグ: [UI・UX] [種類:不具合] [実行:sweep] [検証:npx tsx .claude/scripts/page-quality/ui-findings.ts --assert-handled data/page-quality/backlog-batches/UI-FIX-RANKING-20261011.txt] [起票:2026-10-11] [領域:サイト]

- **自動起票**: 週次のページ品質監査 (`page-quality-audit-weekly.yml`) の結果から `ui-findings.ts --sync` が作った。対象の一覧は `data/page-quality/backlog-batches/UI-FIX-RANKING-20261011.txt`、状態は `data/page-quality/ui-findings-queue.json`。正典は `.claude/rules/page-quality-standards.md`「UI 指摘のループ」。
- **スクショ (最新の週次)**: [mobile-390](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking-mobile-390.png) / [desktop-1440](https://storage.stats47.jp/state/page-quality/screenshots/latest/ranking-desktop-1440.png)。検査の詳細は `data/page-quality/metrics/LATEST.md`。
- **対象**:
  - `agent|ranking` (Claude の確認)
    - [desktop-1440/high] デスクトップ 1 枚目下部、地図の右隣の順位表。右端の「偏差値」列: 順位表の右端の列が切れています。見出し「偏差値」が半分しか見えず、各行の値も「9」「7」「6」のように先頭の 1 文字だけが見えます。読者は偏差値を読めません。 → 表を横スクロール可能なコンテナに入れるか、列幅を詰めて偏差値列が枠内に収まるようにする。
    - [mobile-390/medium] スマホ 2 枚目、地図左下の「淡色地図 / 標準地図」切替ボタン (デスクトップ 2 枚目の地図左下でも同様): 地図の凡例カード (分位区分) が、地図の切替ボタンの上に重なっています。ボタンの文字が一部隠れて読みにくく、押しにくそうです。 → 凡例を切替ボタンと重ならない位置 (地図の外、または右下) に移す。
    - [desktop-1440/medium] デスクトップ 1 枚目、「上位3件と最下位」カードの横軸ラベル (スマホ 1 枚目でも同様): 総人口の軸の下端が「-162,605」と負の値で表示されています。人口は負にならないので、読者が意味を取り違えたり、軸が誤っていると感じたりします。 → 件数や人口のように負にならない指標では、軸の下端を 0 以上にする。
    - 経緯: 再発 (2026-10-11 の週次で再検出)
  - `machine|ranking|same_shop_ad_duplicates` — same_shop_ad_duplicates: 99 URL (最大 1、閾値 <= 0)。例: https://stats47.jp/ranking/agricultural-land-conversion-area / https://stats47.jp/ranking/apartment-ratio / https://stats47.jp/ranking/architect-annual-income
    - 経緯: 修正の本番反映後も 2026-10-11 の週次で再検出 (前回: 楽天商品カードの選定で同じ店を 1 枚 1 件までにした (selectQualityItems + rakutenShopKey、test 追加)。別カード間の重複は次の週次で残れば再起票)
  - `machine|ranking|title_changed` — title_changed: 1 URL (最大 1、閾値 <= 0)。例: https://stats47.jp/ranking/production-age-population-ratio
  - `machine|ranking|unit_symbol_mixing` — unit_symbol_mixing: 425 URL (最大 13、閾値 <= 0)。例: https://stats47.jp/ranking/academic-achievement-test-average-rate / https://stats47.jp/ranking/agricultural-income-ratio / https://stats47.jp/ranking/agriculture-forestry-fisheries-expenditure-ratio-pref-finance
    - 経緯: 修正の本番反映後も 2026-10-11 の週次で再検出 (前回: 関連ランキング・カテゴリ一覧表・KPI 部品の単位を formatUnitForDisplay、AI 解説本文の数字直後の ％ を normalizePercentInText で表示時に % へ揃えた。localhost /ranking/abandoned-cultivated-land-area で ％ 0 件)
- **表示の意味 (定義単位で直す)**: 語・文字列・店名などの具体的な箇所は `LATEST.md` / 週次 `latest.json` の `ui_findings` にある。全URLの検査はページの種類ごとに 1 件へまとめてあり、該当 URL の全件は週次 `latest.json` (`npm run state:pull -- page-quality` で `data/page-quality/live/` に取得) の `violations` にある。同じ指摘が同じテンプレートの多数の URL に出ていれば、ページではなく生成元 (テンプレート・カタログ・共通部品・AI 解説の生成) を直す。内部用語は読者向けの言い換えに、`NaN`/`undefined` は値が無いときの表示 (「—」等) に、`%`/`％` はそのページの多数派に揃える。`title_changed` は選定入力が変わっていないのに title が変わった場合だけ直す (選び方を決定的にする)。文字の小ささ・ページ高さはテンプレート別の予算 (`page-quality-budgets.json`) との差で、予算を上げて閉じない。
- **次**: 原因をコードから特定して直し、関係する unit test と `npm run design-system:check -w apps/web` を通す。Claude の指摘は描画前の撮影による誤検知もありうるので、その場合は撮影側 (`.claude/scripts/page-quality/lib/screenshots.ts`) を直すか by-design にする。
- **記録**: 直した指摘は `npx tsx .claude/scripts/page-quality/ui-findings.ts --mark-fixed <key> --note "<何を変えたか>"`、直さないと判断した指摘は `--mark-by-design <key> --note "<理由>"`。デザイン方針・画像制作・外部契約などオーナー判断が要る指摘は、決めてほしいことを書いた `[実行:対話]` のカードを backlog に起票してから `--mark-owner <key> --card <そのカード ID> --note "<何を決めてほしいか>"` (カードが閉じた後も残っていれば pending に戻る)。まとめて付けるときは `@data/page-quality/backlog-batches/UI-FIX-RANKING-20261011.txt`。本番確認は release 後の週次監査が行い、再検出されたら pending に戻って再起票される。
- **停止条件**: 本番 deploy・R2 push をしない。判断できない指摘は pending のまま残し、このカードを消さない。
- **完了条件**: 検証コマンドが exit 0 (全対象が pending でなく、done 以外は理由 note 付き)。

### [UI-FIX-PREFECTURE-DETAIL-THEME-POPULATION-20261011] UI 是正: prefecture-detail--theme-population の週次 UI 検査の指摘 1 件を直す

タグ: [UI・UX] [種類:不具合] [実行:sweep] [検証:npx tsx .claude/scripts/page-quality/ui-findings.ts --assert-handled data/page-quality/backlog-batches/UI-FIX-PREFECTURE-DETAIL-THEME-POPULATION-20261011.txt] [起票:2026-10-11] [領域:サイト]

- **自動起票**: 週次のページ品質監査 (`page-quality-audit-weekly.yml`) の結果から `ui-findings.ts --sync` が作った。対象の一覧は `data/page-quality/backlog-batches/UI-FIX-PREFECTURE-DETAIL-THEME-POPULATION-20261011.txt`、状態は `data/page-quality/ui-findings-queue.json`。正典は `.claude/rules/page-quality-standards.md`「UI 指摘のループ」。
- **スクショ (最新の週次)**: [mobile-390](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-detail--theme-population-mobile-390.png) / [desktop-1440](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-detail--theme-population-desktop-1440.png)。検査の詳細は `data/page-quality/metrics/LATEST.md`。
- **対象**:
  - `agent|prefecture-detail--theme-population` (Claude の確認)
    - [mobile-390/low] スマホ 2 枚目、「総人口」カードの推移グラフ: グラフの軸の年ラベル (1975 / 2025) が極小で、縦軸の目盛りもありません。値の範囲が分かりません。 → 軸ラベルを読めるサイズにし、最小値と最大値を添える。
- **次**: 原因をコードから特定して直し、関係する unit test と `npm run design-system:check -w apps/web` を通す。Claude の指摘は描画前の撮影による誤検知もありうるので、その場合は撮影側 (`.claude/scripts/page-quality/lib/screenshots.ts`) を直すか by-design にする。
- **記録**: 直した指摘は `npx tsx .claude/scripts/page-quality/ui-findings.ts --mark-fixed <key> --note "<何を変えたか>"`、直さないと判断した指摘は `--mark-by-design <key> --note "<理由>"`。デザイン方針・画像制作・外部契約などオーナー判断が要る指摘は、決めてほしいことを書いた `[実行:対話]` のカードを backlog に起票してから `--mark-owner <key> --card <そのカード ID> --note "<何を決めてほしいか>"` (カードが閉じた後も残っていれば pending に戻る)。まとめて付けるときは `@data/page-quality/backlog-batches/UI-FIX-PREFECTURE-DETAIL-THEME-POPULATION-20261011.txt`。本番確認は release 後の週次監査が行い、再検出されたら pending に戻って再起票される。
- **停止条件**: 本番 deploy・R2 push をしない。判断できない指摘は pending のまま残し、このカードを消さない。
- **完了条件**: 検証コマンドが exit 0 (全対象が pending でなく、done 以外は理由 note 付き)。

### [UI-FIX-PREFECTURE-DETAIL-20261011] UI 是正: prefecture-detail の週次 UI 検査の指摘 5 件を直す

タグ: [UI・UX] [種類:不具合] [実行:sweep] [検証:npx tsx .claude/scripts/page-quality/ui-findings.ts --assert-handled data/page-quality/backlog-batches/UI-FIX-PREFECTURE-DETAIL-20261011.txt] [起票:2026-10-11] [領域:サイト]

- **自動起票**: 週次のページ品質監査 (`page-quality-audit-weekly.yml`) の結果から `ui-findings.ts --sync` が作った。対象の一覧は `data/page-quality/backlog-batches/UI-FIX-PREFECTURE-DETAIL-20261011.txt`、状態は `data/page-quality/ui-findings-queue.json`。正典は `.claude/rules/page-quality-standards.md`「UI 指摘のループ」。
- **スクショ (最新の週次)**: [mobile-390](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-detail-mobile-390.png) / [desktop-1440](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-detail-desktop-1440.png)。検査の詳細は `data/page-quality/metrics/LATEST.md`。
- **対象**:
  - `agent|prefecture-detail` (Claude の確認)
    - [mobile-390/medium] スマホ 3 枚目、指標一覧の「合計特殊出生率」行 (東京都): 合計特殊出生率が「1 人」と表示されています。同じページ上部の特徴欄では「0.99人」なので、値の丸めが食い違っています。単位「人」も紛らわしく、小数が失われて 47 位との差が分かりません。 → 小数 2 桁で表示し、単位表記を他の欄と揃える。
    - [mobile-390/medium] スマホ 3 枚目、「年齢3区分人口の推移」の積み上げ面グラフ: グラフの縦軸・横軸の目盛り文字が極端に小さく、スマホではほぼ判読できません。 → スマホでは目盛りの数を減らしてフォントサイズを大きくする。
    - 経緯: 再発 (2026-10-11 の週次で再検出)
  - `machine|https://stats47.jp/areas/01000|small_text_count` — small_text_count = 78 (閾値 <= 56)
  - `machine|https://stats47.jp/areas/13000|small_text_count` — small_text_count = 78 (閾値 <= 56)
  - `machine|https://stats47.jp/areas/47000|small_text_count` — small_text_count = 76 (閾値 <= 56)
  - `machine|prefecture-detail|unit_symbol_mixing` — unit_symbol_mixing: 47 URL (最大 2、閾値 <= 0)。例: https://stats47.jp/areas/01000/tourism / https://stats47.jp/areas/02000/tourism / https://stats47.jp/areas/03000/tourism
- **表示の意味 (定義単位で直す)**: 語・文字列・店名などの具体的な箇所は `LATEST.md` / 週次 `latest.json` の `ui_findings` にある。全URLの検査はページの種類ごとに 1 件へまとめてあり、該当 URL の全件は週次 `latest.json` (`npm run state:pull -- page-quality` で `data/page-quality/live/` に取得) の `violations` にある。同じ指摘が同じテンプレートの多数の URL に出ていれば、ページではなく生成元 (テンプレート・カタログ・共通部品・AI 解説の生成) を直す。内部用語は読者向けの言い換えに、`NaN`/`undefined` は値が無いときの表示 (「—」等) に、`%`/`％` はそのページの多数派に揃える。`title_changed` は選定入力が変わっていないのに title が変わった場合だけ直す (選び方を決定的にする)。文字の小ささ・ページ高さはテンプレート別の予算 (`page-quality-budgets.json`) との差で、予算を上げて閉じない。
- **次**: 原因をコードから特定して直し、関係する unit test と `npm run design-system:check -w apps/web` を通す。Claude の指摘は描画前の撮影による誤検知もありうるので、その場合は撮影側 (`.claude/scripts/page-quality/lib/screenshots.ts`) を直すか by-design にする。
- **記録**: 直した指摘は `npx tsx .claude/scripts/page-quality/ui-findings.ts --mark-fixed <key> --note "<何を変えたか>"`、直さないと判断した指摘は `--mark-by-design <key> --note "<理由>"`。デザイン方針・画像制作・外部契約などオーナー判断が要る指摘は、決めてほしいことを書いた `[実行:対話]` のカードを backlog に起票してから `--mark-owner <key> --card <そのカード ID> --note "<何を決めてほしいか>"` (カードが閉じた後も残っていれば pending に戻る)。まとめて付けるときは `@data/page-quality/backlog-batches/UI-FIX-PREFECTURE-DETAIL-20261011.txt`。本番確認は release 後の週次監査が行い、再検出されたら pending に戻って再起票される。
- **停止条件**: 本番 deploy・R2 push をしない。判断できない指摘は pending のまま残し、このカードを消さない。
- **完了条件**: 検証コマンドが exit 0 (全対象が pending でなく、done 以外は理由 note 付き)。

### [UI-FIX-MUNICIPALITY-20261011] UI 是正: municipality の週次 UI 検査の指摘 2 件を直す

タグ: [UI・UX] [種類:不具合] [実行:sweep] [検証:npx tsx .claude/scripts/page-quality/ui-findings.ts --assert-handled data/page-quality/backlog-batches/UI-FIX-MUNICIPALITY-20261011.txt] [起票:2026-10-11] [領域:サイト]

- **自動起票**: 週次のページ品質監査 (`page-quality-audit-weekly.yml`) の結果から `ui-findings.ts --sync` が作った。対象の一覧は `data/page-quality/backlog-batches/UI-FIX-MUNICIPALITY-20261011.txt`、状態は `data/page-quality/ui-findings-queue.json`。正典は `.claude/rules/page-quality-standards.md`「UI 指摘のループ」。
- **スクショ (最新の週次)**: [mobile-390](https://storage.stats47.jp/state/page-quality/screenshots/latest/municipality-mobile-390.png) / [desktop-1440](https://storage.stats47.jp/state/page-quality/screenshots/latest/municipality-desktop-1440.png)。検査の詳細は `data/page-quality/metrics/LATEST.md`。
- **対象**:
  - `agent|municipality` (Claude の確認)
    - [tablet-768/medium] タブレット 1 枚目、「千代田区の特徴」カード: 千代田区の上位指標がすべて「2006年度」のデータです。読者は最新の特徴だと受け取りかねません。年が古いことを知らせる注記がありません。 → 古い年度の指標には「古い年度のデータ」の注記を付けるか、新しい年度の指標を優先して出す。
    - [tablet-768/low] タブレット 1 枚目下部、「東京都の市区町村」一覧: 一覧の最終行 (日の出町・檜原村など) が枠の下端で文字の途中で切れています。スクロール領域だと分かりません。 → 枠の下端にフェードやスクロールの手がかりを付けるか、全件を表示する。
    - 経緯: 再発 (2026-10-11 の週次で再検出)
  - `machine|municipality|title_changed` — title_changed: 1 URL (最大 1、閾値 <= 0)。例: https://stats47.jp/areas/29000/cities/29204
- **表示の意味 (定義単位で直す)**: 語・文字列・店名などの具体的な箇所は `LATEST.md` / 週次 `latest.json` の `ui_findings` にある。全URLの検査はページの種類ごとに 1 件へまとめてあり、該当 URL の全件は週次 `latest.json` (`npm run state:pull -- page-quality` で `data/page-quality/live/` に取得) の `violations` にある。同じ指摘が同じテンプレートの多数の URL に出ていれば、ページではなく生成元 (テンプレート・カタログ・共通部品・AI 解説の生成) を直す。内部用語は読者向けの言い換えに、`NaN`/`undefined` は値が無いときの表示 (「—」等) に、`%`/`％` はそのページの多数派に揃える。`title_changed` は選定入力が変わっていないのに title が変わった場合だけ直す (選び方を決定的にする)。文字の小ささ・ページ高さはテンプレート別の予算 (`page-quality-budgets.json`) との差で、予算を上げて閉じない。
- **次**: 原因をコードから特定して直し、関係する unit test と `npm run design-system:check -w apps/web` を通す。Claude の指摘は描画前の撮影による誤検知もありうるので、その場合は撮影側 (`.claude/scripts/page-quality/lib/screenshots.ts`) を直すか by-design にする。
- **記録**: 直した指摘は `npx tsx .claude/scripts/page-quality/ui-findings.ts --mark-fixed <key> --note "<何を変えたか>"`、直さないと判断した指摘は `--mark-by-design <key> --note "<理由>"`。デザイン方針・画像制作・外部契約などオーナー判断が要る指摘は、決めてほしいことを書いた `[実行:対話]` のカードを backlog に起票してから `--mark-owner <key> --card <そのカード ID> --note "<何を決めてほしいか>"` (カードが閉じた後も残っていれば pending に戻る)。まとめて付けるときは `@data/page-quality/backlog-batches/UI-FIX-MUNICIPALITY-20261011.txt`。本番確認は release 後の週次監査が行い、再検出されたら pending に戻って再起票される。
- **停止条件**: 本番 deploy・R2 push をしない。判断できない指摘は pending のまま残し、このカードを消さない。
- **完了条件**: 検証コマンドが exit 0 (全対象が pending でなく、done 以外は理由 note 付き)。

### [UI-FIX-HOME-20261011] UI 是正: home の週次 UI 検査の指摘 3 件を直す

タグ: [UI・UX] [種類:不具合] [実行:sweep] [検証:npx tsx .claude/scripts/page-quality/ui-findings.ts --assert-handled data/page-quality/backlog-batches/UI-FIX-HOME-20261011.txt] [起票:2026-10-11] [領域:サイト]

- **自動起票**: 週次のページ品質監査 (`page-quality-audit-weekly.yml`) の結果から `ui-findings.ts --sync` が作った。対象の一覧は `data/page-quality/backlog-batches/UI-FIX-HOME-20261011.txt`、状態は `data/page-quality/ui-findings-queue.json`。正典は `.claude/rules/page-quality-standards.md`「UI 指摘のループ」。
- **スクショ (最新の週次)**: [mobile-390](https://storage.stats47.jp/state/page-quality/screenshots/latest/home-mobile-390.png) / [desktop-1440](https://storage.stats47.jp/state/page-quality/screenshots/latest/home-desktop-1440.png)。検査の詳細は `data/page-quality/metrics/LATEST.md`。
- **対象**:
  - `machine|https://stats47.jp/|clipped_text` — clipped_text = 1 (閾値 <= 0)
  - `machine|https://stats47.jp/|responsive_layout_issues` — responsive_layout_issues = 2 (閾値 <= 0)
    - 経緯: 再発 (2026-10-11 の週次で再検出)
  - `agent|home` (Claude の確認)
    - [mobile-390/low] スマホ 1 枚目、「注目のランキング」「新着ブログ」の見出し下: カルーセルの「>」ボタンだけが見出しとカードの間の独立した行にあり、行が余分に空いています。カード群が画面の下にずれ、最初の画面で見えるカードが減っています。 → ボタンを見出し行の右側に置いて余白を詰める。
    - [mobile-390/low] スマホ 2 枚目、「都道府県から探す」のタイル地図: 北海道のタイルの上や、九州・関東の周りに大きな空白があります。タイルの文字が小さく、隣のタイルと詰まっています。 → タイル地図の余白を詰め、スマホではタイルを大きくするか一覧形式に切り替える。
    - [desktop-1440/low] デスクトップ 1 枚目、カルーセルの「>」ボタンの行: スマホ同様、「>」ボタンが見出しの下の独立した行にあり、見出しとカードの間が空きすぎています。 → ボタンを見出し行の右端に移す。
    - 経緯: 修正の本番反映後も 2026-10-11 の週次で再検出 (前回: カード横スクロールの右端に続きを示すフェードを追加 (HorizontalCardCarousel)。タイル地図の県名を折り返さない (whitespace-nowrap)。左上の空白はタイル配置が列島の形を写すため現状維持)
- **次**: 原因をコードから特定して直し、関係する unit test と `npm run design-system:check -w apps/web` を通す。Claude の指摘は描画前の撮影による誤検知もありうるので、その場合は撮影側 (`.claude/scripts/page-quality/lib/screenshots.ts`) を直すか by-design にする。
- **記録**: 直した指摘は `npx tsx .claude/scripts/page-quality/ui-findings.ts --mark-fixed <key> --note "<何を変えたか>"`、直さないと判断した指摘は `--mark-by-design <key> --note "<理由>"`。デザイン方針・画像制作・外部契約などオーナー判断が要る指摘は、決めてほしいことを書いた `[実行:対話]` のカードを backlog に起票してから `--mark-owner <key> --card <そのカード ID> --note "<何を決めてほしいか>"` (カードが閉じた後も残っていれば pending に戻る)。まとめて付けるときは `@data/page-quality/backlog-batches/UI-FIX-HOME-20261011.txt`。本番確認は release 後の週次監査が行い、再検出されたら pending に戻って再起票される。
- **停止条件**: 本番 deploy・R2 push をしない。判断できない指摘は pending のまま残し、このカードを消さない。
- **完了条件**: 検証コマンドが exit 0 (全対象が pending でなく、done 以外は理由 note 付き)。

### [UI-FIX-GEO-ANALYSIS-20261011] UI 是正: geo-analysis の週次 UI 検査の指摘 1 件を直す

タグ: [UI・UX] [種類:不具合] [実行:sweep] [検証:npx tsx .claude/scripts/page-quality/ui-findings.ts --assert-handled data/page-quality/backlog-batches/UI-FIX-GEO-ANALYSIS-20261011.txt] [起票:2026-10-11] [領域:サイト]

- **自動起票**: 週次のページ品質監査 (`page-quality-audit-weekly.yml`) の結果から `ui-findings.ts --sync` が作った。対象の一覧は `data/page-quality/backlog-batches/UI-FIX-GEO-ANALYSIS-20261011.txt`、状態は `data/page-quality/ui-findings-queue.json`。正典は `.claude/rules/page-quality-standards.md`「UI 指摘のループ」。
- **スクショ (最新の週次)**: [mobile-390](https://storage.stats47.jp/state/page-quality/screenshots/latest/geo-analysis-mobile-390.png) / [desktop-1440](https://storage.stats47.jp/state/page-quality/screenshots/latest/geo-analysis-desktop-1440.png)。検査の詳細は `data/page-quality/metrics/LATEST.md`。
- **対象**:
  - `agent|geo-analysis` (Claude の確認)
    - [mobile-390/low] スマホ 1 枚目、各分析カード左側のサムネイル: サムネイルの地図が小さすぎ、内部のラベルが重なって読めません。何の分析か画像からは分かりません。 → サムネイルを判読できる大きさにするか、ラベルを省略した簡易図にする。
    - 経緯: 再発 (2026-10-11 の週次で再検出)
- **次**: 原因をコードから特定して直し、関係する unit test と `npm run design-system:check -w apps/web` を通す。Claude の指摘は描画前の撮影による誤検知もありうるので、その場合は撮影側 (`.claude/scripts/page-quality/lib/screenshots.ts`) を直すか by-design にする。
- **記録**: 直した指摘は `npx tsx .claude/scripts/page-quality/ui-findings.ts --mark-fixed <key> --note "<何を変えたか>"`、直さないと判断した指摘は `--mark-by-design <key> --note "<理由>"`。デザイン方針・画像制作・外部契約などオーナー判断が要る指摘は、決めてほしいことを書いた `[実行:対話]` のカードを backlog に起票してから `--mark-owner <key> --card <そのカード ID> --note "<何を決めてほしいか>"` (カードが閉じた後も残っていれば pending に戻る)。まとめて付けるときは `@data/page-quality/backlog-batches/UI-FIX-GEO-ANALYSIS-20261011.txt`。本番確認は release 後の週次監査が行い、再検出されたら pending に戻って再起票される。
- **停止条件**: 本番 deploy・R2 push をしない。判断できない指摘は pending のまま残し、このカードを消さない。
- **完了条件**: 検証コマンドが exit 0 (全対象が pending でなく、done 以外は理由 note 付き)。

### [UI-FIX-CATEGORY-20261011] UI 是正: category の週次 UI 検査の指摘 4 件を直す

タグ: [UI・UX] [種類:不具合] [実行:sweep] [検証:npx tsx .claude/scripts/page-quality/ui-findings.ts --assert-handled data/page-quality/backlog-batches/UI-FIX-CATEGORY-20261011.txt] [起票:2026-10-11] [領域:サイト]

- **自動起票**: 週次のページ品質監査 (`page-quality-audit-weekly.yml`) の結果から `ui-findings.ts --sync` が作った。対象の一覧は `data/page-quality/backlog-batches/UI-FIX-CATEGORY-20261011.txt`、状態は `data/page-quality/ui-findings-queue.json`。正典は `.claude/rules/page-quality-standards.md`「UI 指摘のループ」。
- **スクショ (最新の週次)**: [mobile-390](https://storage.stats47.jp/state/page-quality/screenshots/latest/category-mobile-390.png) / [desktop-1440](https://storage.stats47.jp/state/page-quality/screenshots/latest/category-desktop-1440.png)。検査の詳細は `data/page-quality/metrics/LATEST.md`。
- **対象**:
  - `machine|https://stats47.jp/category/landweather|clipped_text` — clipped_text = 1 (閾値 <= 0)
  - `machine|https://stats47.jp/category/landweather|responsive_layout_issues` — responsive_layout_issues = 2 (閾値 <= 0)
  - `machine|https://stats47.jp/category/population|clipped_text` — clipped_text = 1 (閾値 <= 0)
  - `machine|https://stats47.jp/category/population|responsive_layout_issues` — responsive_layout_issues = 2 (閾値 <= 0)
    - 経緯: 再発 (2026-10-11 の週次で再検出)
- **次**: 原因をコードから特定して直し、関係する unit test と `npm run design-system:check -w apps/web` を通す。Claude の指摘は描画前の撮影による誤検知もありうるので、その場合は撮影側 (`.claude/scripts/page-quality/lib/screenshots.ts`) を直すか by-design にする。
- **記録**: 直した指摘は `npx tsx .claude/scripts/page-quality/ui-findings.ts --mark-fixed <key> --note "<何を変えたか>"`、直さないと判断した指摘は `--mark-by-design <key> --note "<理由>"`。デザイン方針・画像制作・外部契約などオーナー判断が要る指摘は、決めてほしいことを書いた `[実行:対話]` のカードを backlog に起票してから `--mark-owner <key> --card <そのカード ID> --note "<何を決めてほしいか>"` (カードが閉じた後も残っていれば pending に戻る)。まとめて付けるときは `@data/page-quality/backlog-batches/UI-FIX-CATEGORY-20261011.txt`。本番確認は release 後の週次監査が行い、再検出されたら pending に戻って再起票される。
- **停止条件**: 本番 deploy・R2 push をしない。判断できない指摘は pending のまま残し、このカードを消さない。
- **完了条件**: 検証コマンドが exit 0 (全対象が pending でなく、done 以外は理由 note 付き)。

### [UI-FIX-BLOG-ARTICLE-20261011] UI 是正: blog-article の週次 UI 検査の指摘 10 件を直す

タグ: [UI・UX] [種類:不具合] [実行:sweep] [検証:npx tsx .claude/scripts/page-quality/ui-findings.ts --assert-handled data/page-quality/backlog-batches/UI-FIX-BLOG-ARTICLE-20261011.txt] [起票:2026-10-11] [領域:サイト]

- **自動起票**: 週次のページ品質監査 (`page-quality-audit-weekly.yml`) の結果から `ui-findings.ts --sync` が作った。対象の一覧は `data/page-quality/backlog-batches/UI-FIX-BLOG-ARTICLE-20261011.txt`、状態は `data/page-quality/ui-findings-queue.json`。正典は `.claude/rules/page-quality-standards.md`「UI 指摘のループ」。
- **スクショ (最新の週次)**: [mobile-390](https://storage.stats47.jp/state/page-quality/screenshots/latest/blog-article-mobile-390.png) / [desktop-1440](https://storage.stats47.jp/state/page-quality/screenshots/latest/blog-article-desktop-1440.png)。検査の詳細は `data/page-quality/metrics/LATEST.md`。
- **対象**:
  - `machine|blog-article|abnormal_value_strings` — abnormal_value_strings: 1 URL (最大 1、閾値 <= 0)。例: https://stats47.jp/blog/cc-estat-12-housing-treemap
  - `machine|blog-article|internal_jargon_terms` — internal_jargon_terms: 3 URL (最大 8、閾値 <= 0)。例: https://stats47.jp/blog/2050-population-flood-exposure / https://stats47.jp/blog/2050-population-map-reading / https://stats47.jp/blog/2050-station-access-population
  - `machine|blog-article|same_shop_ad_duplicates` — same_shop_ad_duplicates: 6 URL (最大 1、閾値 <= 0)。例: https://stats47.jp/blog/dual-income-house-size / https://stats47.jp/blog/homeownership-vacancy-four-types / https://stats47.jp/blog/household-growth-population-decline-census-2025
  - `machine|blog-article|title_changed` — title_changed: 24 URL (最大 1、閾値 <= 0)。例: https://stats47.jp/blog/ai-claude-code-pref-analysis / https://stats47.jp/blog/area-ratio-prefecture-gap / https://stats47.jp/blog/bonito-catch-zero-prefectures-gap
  - `machine|blog-article|unit_symbol_mixing` — unit_symbol_mixing: 14 URL (最大 4、閾値 <= 0)。例: https://stats47.jp/blog/beef-consumption-quantity-vs-municipal-road-paving-rate / https://stats47.jp/blog/beef-consumption-quantity-vs-unmarried-ratio-male-45-49 / https://stats47.jp/blog/chicken-consumption-prefecture-gap
  - `machine|https://stats47.jp/blog/cc-estat-04-aging-heatmap|blog_svg_text_issues` — blog_svg_text_issues = 2 (閾値 <= 0)
  - `machine|https://stats47.jp/blog/cc-estat-17-edu-slope-graph|blog_svg_text_issues` — blog_svg_text_issues = 1 (閾値 <= 0)
  - `machine|https://stats47.jp/blog/child-height-regional-gap|blog_svg_text_issues` — blog_svg_text_issues = 1 (閾値 <= 0)
  - `machine|https://stats47.jp/blog/commercial-land-price-trend|blog_svg_text_issues` — blog_svg_text_issues = 1 (閾値 <= 0)
  - `machine|https://stats47.jp/blog/communication-cost-burden|blog_svg_text_issues` — blog_svg_text_issues = 1 (閾値 <= 0)
- **記事チャート SVG (振り分けてから直す)**: まず `npx tsx .claude/scripts/blog/plan-svg-text-fix.ts @data/page-quality/backlog-batches/UI-FIX-BLOG-ARTICLE-20261011.txt` を実行する。`regen-fixes` は生成器が既に正しく、R2 の SVG を作り直すだけで直る (コード変更なし)。R2 への反映はオーナー承認が要るので、出力された `gh workflow run regenerate-blog-svgs.yml …` を書いた `[実行:ユーザー]` カードを起票し、対象を `--mark-owner` で紐付ける。`generator-fix` は `packages/svg-builder` の該当チャートを直し、長いラベルの fixture テストを足してから再実行して `regen-fixes` になることを確かめる (以降は同じ手順)。`no-data` は data JSON が無く作り直せないので、手作業の brushup を依頼するカードを起票して `--mark-owner`。`clean` は既に直っているので `--mark-fixed`。
- **表示の意味 (定義単位で直す)**: 語・文字列・店名などの具体的な箇所は `LATEST.md` / 週次 `latest.json` の `ui_findings` にある。全URLの検査はページの種類ごとに 1 件へまとめてあり、該当 URL の全件は週次 `latest.json` (`npm run state:pull -- page-quality` で `data/page-quality/live/` に取得) の `violations` にある。同じ指摘が同じテンプレートの多数の URL に出ていれば、ページではなく生成元 (テンプレート・カタログ・共通部品・AI 解説の生成) を直す。内部用語は読者向けの言い換えに、`NaN`/`undefined` は値が無いときの表示 (「—」等) に、`%`/`％` はそのページの多数派に揃える。`title_changed` は選定入力が変わっていないのに title が変わった場合だけ直す (選び方を決定的にする)。文字の小ささ・ページ高さはテンプレート別の予算 (`page-quality-budgets.json`) との差で、予算を上げて閉じない。
- **次**: 原因をコードから特定して直し、関係する unit test と `npm run design-system:check -w apps/web` を通す。Claude の指摘は描画前の撮影による誤検知もありうるので、その場合は撮影側 (`.claude/scripts/page-quality/lib/screenshots.ts`) を直すか by-design にする。
- **記録**: 直した指摘は `npx tsx .claude/scripts/page-quality/ui-findings.ts --mark-fixed <key> --note "<何を変えたか>"`、直さないと判断した指摘は `--mark-by-design <key> --note "<理由>"`。デザイン方針・画像制作・外部契約などオーナー判断が要る指摘は、決めてほしいことを書いた `[実行:対話]` のカードを backlog に起票してから `--mark-owner <key> --card <そのカード ID> --note "<何を決めてほしいか>"` (カードが閉じた後も残っていれば pending に戻る)。まとめて付けるときは `@data/page-quality/backlog-batches/UI-FIX-BLOG-ARTICLE-20261011.txt`。本番確認は release 後の週次監査が行い、再検出されたら pending に戻って再起票される。
- **停止条件**: 本番 deploy・R2 push をしない。判断できない指摘は pending のまま残し、このカードを消さない。
- **完了条件**: 検証コマンドが exit 0 (全対象が pending でなく、done 以外は理由 note 付き)。

### [DEPS-OVERRIDES-DRIFT-GATE-01] ルートの overrides と各 workspace の依存の版の食い違いを push 前に止める
タグ: [インフラ・計測] [種類:改善] [実行:sweep] [検証:npm run preflight:pr] [起票:2026-10-10] [領域:管理]

- **事象**: dependabot は `apps/web` などの package.json だけを上げ、ルートの `overrides` (next 15.5.24・sharp 0.35.4) は古いまま残った。next が 2 つの版で入り、PR #1119 の本番ビルドの /404 事前描画が `<Html> should not be imported outside of pages/_document` で落ちた (2026-10-10。overrides を揃えて解消)。CI の Build Check が本番前に止めたが、ビルド 5 分と CI 往復 1 回を使った。
- **手順**: `.claude/scripts/lib/` に lockfile と package.json だけを読む検査を作る。(a) next・react・react-dom (一つの版でしか動かない部品) が `package-lock.json` に 1 つの版しか無い (b) ルートの `overrides` の版が、その依存を持つ全 workspace の指定範囲を満たす。`.claude/config/quality-gates.json` に登録して pre-commit と `preflight:pr` に載せる (checker を CI では直接パスで呼ぶ。npm script 経由だと checker-wiring が認識しない)。
- **完了条件**: 2026-10-10 の修正前の package.json と lockfile (commit `7ae184cb8`) でテストが失敗し、現在の develop で通る。
- **追加の観測 (2026-10-21・PR #1165 の Security Scan)**: vite の脆弱性 (8.2.0〜8.2.3) を直すためにルートの `overrides` へ `"vite": "8.2.4"` を足しても、
  `npm install` は lock の 8.2.2 を残し、`npm ls vite` が `invalid` を出すだけで exit 0 だった。lock から vite の項目を消して入れ直すと、vite と依存 7 件が
  lock から消えた (誤り。戻した)。`npm update vite` は npm 自体のエラー (`Cannot read properties of null (reading 'edgesOut')`)。
  通ったのは「ルートの devDependencies に `vite@^8.2.4`、overrides は `"vite": "$vite"`」(commit `ef8df73aa`)。検査の (c) として
  「`npm ls --all` に `invalid` が無い (override と lock の版が一致する)」を足す。

### [RANKING-RATIO-RANK-MISMATCH-01] 比率指標 4 件で配信中の順位が再計算と食い違う
タグ: [コンテンツ品質] [種類:不具合] [実行:対話] [起票:2026-10-10] [領域:サイト]

- **2026-10-21 完了 (行削除は backlog-loop)**: 配信値は正しく、監査側の比べ方が原因だった。配信の values.json は表示桁 (小数 1 桁) に丸めた値で順位を付けるので丸めて同じ値の県は同順位になるが、`verify-calculated-rankings.ts` は丸める前の値で付けた順位と比べていた。4 件の rankDiff (廃業率 30・開業率 26・エンゲル係数 13・情報通信係数 27) は、それぞれの配信値の同値の数とちょうど一致し、配信値と同じ桁に丸めて順位を付け直すと 4 件とも順位・値が完全一致した。`packages/ranking/src/utils/rank-at-served-precision.ts` (丸めてから同順位込みで順位を付け直す。向きは再計算の順位から読む・テスト 2 件) を足して監査が使うようにし、実データで「rank 一致 6/6」・「定数倍ずれ」の誤報 0 件を確認した。R2 の再生成は不要。次の週次監査 (main に入った後) で Issue #679 のこの項目が消える。
- **事象**: ランキング整合性の週次監査 #679 (2026-10-03) で、`business-closure-rate` (順位差 30)・`business-opening-rate` (26)・`engel-coefficient` (13)・`information-communication-coefficient` (27) の 4 件が、R2 の values と再計算で順位が一致しない (件数は一致)。監査は「DB レス回帰の疑い」と出している。
- **次**: 4 件の values.json の rank と `calculateRankingValues` の結果を並べ、どちらが正しいか (昇順・降順の向き、同率の扱い、元データの年) を確かめてから再生成する。
- **完了条件**: 次の週次監査で rank 不一致が 0 件。

### [BLOG-LINK-410-REMAP-01] ブログ本文の 410 になったランキングへのリンク 5 件を置き換える
タグ: [コンテンツ品質] [種類:不具合] [実行:sweep] [検証:node .claude/scripts/blog/fix-broken-internal-links.mjs] [起票:2026-10-10] [領域:サイト]

- **事象**: リンク監査 #752 (2026-10-03) でブログ本文に HTTP 410 のリンクが 5 件 (`/ranking/elderly-population-ratio`・`foreign-population-per-100k`・`population-density-habitable`・`prefectural-income-per-capita`・`tourism-resource-count`、各 1 記事)。
- **手順**: #752 本文の是正手順どおり、`.claude/scripts/blog/data/broken-link-remap.json` に置換先 (無ければ `to: null`) を足し、`fix-broken-internal-links.mjs --apply` で置き換えて公開する。
- **完了条件**: 次の週次リンク監査で 410 が 0 件になり #752 が自動で閉じる。

### [OGP-NOTE-COVER-MISSING-01] OGP 監査で note カバー画像 103 件が欠落のまま残る
タグ: [コンテンツ品質] [種類:不具合] [実行:対話] [起票:2026-10-10] [領域:商品]

- **事象**: OGP 画像の週次監査 #814 (2026-10-03) で、自動修復後も note-cover が 103 件 missing (例: 12-fiscal-peer-comparison ほか公務員シリーズ)。note カバーの正本は 2026-10-02 に `data/note/cover-assets.json` へ移っており (`note-image-assets.md`)、監査が旧経路の画像を探している可能性がある。
- **次**: [仮説] 監査の参照先が旧経路のまま。検証: `ogp-image-audit` が note-cover をどこで探すかを読み、`cover-assets.json` の版と突き合わせる。監査側の誤りなら監査を直し、実際の欠落なら `note:assets` の手順で補う。
- **完了条件**: 次の週次 OGP 監査で note-cover の missing が 0 件。

### [NOTE-COVER-DELIVERY-VERIFY-01] 文字込み生成カバーの配信検証をnote側の減色に対応させる
タグ: [コンテンツ品質] [種類:不具合] [実行:対話] [起票:2026-10-14] [領域:商品]

- **証拠**: `data/note/evidence/note-cover-refresh-ledger-a4bc4308a8b6dcce.json`。文字込みimagegen画像は公開PNGがpalette化され、画素平均差が海外旅行3.875・歳出4.325となり旧閾値3で停止した。原寸の対比で文字・構図・切り抜きの一致を確認し、配信SHAに限定した目視記録と本文等のhash再照合で復旧した。画像の再送・閾値の緩和はしていない。
- **追加証拠 (2026-10-23)**: `note-cover-refresh-ledger-ac5bd1a2f0af0d79.json` の空き家率はMAE 3.477、`note-cover-refresh-ledger-52ad7c58985bff1e.json` のボランティアは3.726で停止。公開PNGと採用元は原寸で同一構図・文字、差が30以上の色チャネルは各0.2%、別画像との比較ではMAE 87.13・同割合65.1%。MAE上限5と大差チャネル1%未満の複合判定で同じアップロードURLを再検証し、本文保全と公開URL照合が通った。文字欠落・色反転・切り抜きの負例と配信SHAに束縛した目視記録の共通化は引き続き対象。
- **担当・順序**: image-prompt-curator / note-manager。① この6件の元画像・公開配信画像で減色の再現条件を確認 ② 文字欠落・別画像・色反転・切り抜きの負例を揃える ③ 自動判定と配信SHA単位の目視確認を共通手順にする。
- **停止条件**: 差の原因を説明できない画像や負例が通る判定は採用しない。応答済みPOSTを再送しない。一律の閾値引き上げだけで解決しない。
- **完了条件**: 正常な減色は判別でき、負例は止まり、目視確認は採用元SHA・配信SHA・公開URLに束縛される。関連テストと既存の本文保全・アカウント照合テストが通る。

### [NOTE-COVER-IMAGEGEN-ROLLOUT-01] 公開済みnoteカバーを新しい順に10件ずつ文字込み生成へ更新する
タグ: [コンテンツ品質] [種類:制作] [実行:対話] [起票:2026-10-14] [領域:商品]

- **Aシリーズの進捗 (2026-10-23)**: 公開239件のうち今回の新規差し替えは50件。第1バッチ10件 (`NCI-00439`,`NCI-00380`,`NCI-00421`,`NCI-00498`,`NCI-00497`,`NCI-00118`,`NCI-00127`,`NCI-00125`,`NCI-00053`,`NCI-00126`) に続き、第2バッチは既存アップロード済み `NCI-00496` を再送せず配信SHAと原寸画像で照合し、`NCI-00499`,`NCI-00120`,`NCI-00121`,`NCI-00122`,`NCI-00056`,`NCI-00058`,`NCI-00048`,`NCI-00049`,`NCI-00050` を反映。第3バッチは `NCI-00495`,`NCI-00291`,`NCI-00349`,`NCI-00106`,`NCI-00105`,`NCI-00104`,`NCI-00103`,`NCI-00102`,`NCI-00101`,`NCI-00100` を本文・既存確認記録と照合→imagegen→原寸/320px目視→private R2登録→管理画面の新旧比較・採用→note公開まで完了し、配信/本文保全検証は10/10 PASS。第4バッチは `NCI-00089`〜`NCI-00098` の県別家計10件を公開APIの都市名・年・世帯区分、県の輪郭と照合→imagegen→原寸/320px目視→private R2登録→管理画面比較・採用→note公開まで完了。初稿に輪郭違い・署名欠けがあった静岡県・栃木県は再生成し、公開/本文保全検証は10/10 PASS。第5バッチは `NCI-00078`〜`NCI-00087` の県別家計10件を公開APIの本文・都市名・2024年・二人以上世帯、県の輪郭と照合してimagegen生成し、原寸/320pxを目視。初稿で人物に見える形があった長崎県と署名欠けの奈良県は再生成した。private R2登録、管理画面の新旧比較・採用、note公開反映を完了し、公開配信/本文保全検証は10/10 PASS。未差し替えは189件で、既に現行方式の画像を持つ記事も対象に含める。`NCI-00486` はタイトルの「15歳以上」と本文の「10歳以上」の矛盾を解消してから制作する。公開証拠は `data/note/evidence/note-cover-refresh-ledger-a8e3c69c1dce96cf.json`、`data/note/evidence/note-cover-refresh-ledger-f1a90f348f4549e4.json`、`data/note/evidence/note-cover-refresh-ledger-ff92e81e5ff532cb.json`、`data/note/evidence/note-cover-refresh-ledger-8b4036dee787cff9.json`、`data/note/evidence/note-cover-refresh-ledger-0d3b6544d8636629.json`。
- **オーナー指示**: 未更新の公開記事を新しい順に展開する（2026-10-14チャット）。2026-10-15に1バッチ10件、人物・キャラクターなし、県別家計は県の輪郭案へ切り替える指示。54件反映後の次バッチは複数カテゴリで構図を試す指示を受け、今回は家計以外の6カテゴリの代表を選定。同日公開分を新しい順に選ぶ場合は公開APIの`publish_at`を使う。モデルをSolに切り替えても共通台帳とCodex built-in imagegen経路を継続する。
- **担当・正本**: image-prompt-curator / note-manager。制作・版・採用・公開は`data/note/cover-assets.json`、カテゴリ方針は`data/note/cover-policies.json`。対象は公開済みのみ。未反映候補がある場合はその確認と反映を先に行い、別の候補を重ねて作らない。
- **現在地 (2026-10-15)**: Git同期後の公開記事397件のうち現行方式で反映済み74件、未更新323件（従来の232件＋別PCで新規公開された統計解説91件）。ユーザーの「反映して」を受け、統計解説4件 `NCI-00376,NCI-00386,NCI-00431,NCI-00471`、配色5件 `NCI-00300,NCI-00318,NCI-00319,NCI-00348,NCI-00346`、データ整備1件 `NCI-00252` の確認済み候補SHAを採用して公開済み。生成証拠は `data/note/evidence/note-cover-candidates-7f6abff7d1c4d25c.json`、公開・最終検証は `data/note/evidence/note-cover-refresh-ledger-a7e921f6594a6f50.json`。10件すべて自動配信照合PASS、実配信画像320pxの個別目視PASS。本文・タイトル・価格・有料境界・タグ・公開日時等のfingerprintと下書き状態を保持し、対象外296記事の公開カバー・485台帳行も不変。再送・閾値変更なし。495記事1170版の資産検証PASS。管理画面は確認済み10・note反映済み10、比較画像20枚の読み込みを確認。所有する投稿ブラウザは終了済み。従来306記事に含まれる統計解説・配色は更新済み。別PCで追加公開された統計解説91件は後続の対象へ追加し、公開記録・R2本文manifest・既存カバー履歴を保持して統合する。
- **終了・再開条件 (2026-10-15)**: 今回は74件反映済みの地点で制作・公開作業を区切り、残りは計画だけを保存する。公開済み記事の未反映の現行imagegen候補は0件。次の生成・公開はユーザーの再開指示で行い、自動実行は設定しない。再開時は記事台帳・カバー台帳・最新方針から未更新の公開記事を再計算し、完了済み74件を再送しない。下書き98件と今後の新規記事は、この公開済み323件の残件数へ混ぜない。
- **残りの進行順（未実行の計画案）**: ① データ整備3件を次回バッチで完了させる ② 自治体実務50件 ③ 県別家計26件 ④ 問い型ランキング85件 ⑤ 比較型ランキング68件 ⑥ 今回のGit同期で追加された統計解説91件。従来の232件の順序を保ち、新規公開91件は既存カバーを確認してから後続へ進める。カテゴリを完了させる順序を優先し、カテゴリ内は公開日の新しい順に進める。同日分は公開APIの`publish_at`で並べ、制作ID順で代用しない。小カテゴリを完了させ、利用目的が具体的な実務・家計記事を先に読みやすくするための順序であり、クリック・購入増の効果は未検証。
- **次回の先頭バッチ**: データ整備 `NCI-00242`（洪水浸水想定区域×将来人口）、`NCI-00246`（人口減少×住宅地価格）、`NCI-00323`（家計調査の五分位・品目CSV）の3件と、未更新の自治体実務から新しい順に7件。実務7件のIDは再開時に公開日時と未更新状態を照合して確定する。制作前に本文の対象範囲・年・単位・商品の収録範囲を確認し、古い見出しの数値や原因説明をそのままカバーへ流用しない。
- **バッチ数・費用の扱い**: 現在の323件を最大10件ずつ進め、カテゴリ境界の端数を次カテゴリと合わせる場合は32回×10件＋最終3件の計33回が目安。再生成分・新規公開の追加分は含めない。全232件を先に生成せず、1バッチの候補作成→比較→反映→公開検証を終えてから次へ進む。各回の再生成数と確認負担を見て件数を調整し、費用・利用枠の金額は未確認のまま見積もらない。
- **再開時の確認**: 「次の10件」は候補作成と右ペインの比較までとし、今回の反映指示を次バッチへ持ち越さない。表示中の候補に対する明示的な反映指示で採用・公開へ進む。最新版のカテゴリ方針・人物なし・補足の可読性・県別家計の正確な輪郭参照を継続し、元画像・実プロンプト・目視記録・完成版をprivate R2に保存する。生成・保存・公開のいずれかが未検証なら、その件を残したまま次の候補を重ねて作らない。
- **生成の契約**: 8カテゴリ最新版の`visualRules`、全カテゴリ人物なし、県別家計の対象範囲と検証済み参照PNG、カテゴリ別目視確認をprepare/import/採用/公開で照合する。手順はカタログREADME。`export-batch`は最大10件、登録済み候補を除いて再開する。関連71テスト・admin/制作スクリプト型検査・UI規約検査を通過。全体ビルド/全テストは未実行（ローカル変更の完了粒度）。
- **実行順**: ① 本文からコピー・対象・年・題材を確定 ② imagegenで文字込み生成 ③ 原寸/320pxで指定全文・補足・人物なし・カテゴリ固有項目を確認 ④ 元画像・地図参照・完成版をprivate R2へ登録 ⑤ 管理画面で候補を確認・採用 ⑥ 採用版だけカバー専用更新で反映し、公開配信画像と本文等の保持を検証して次の10件へ進む。
- **停止条件**: 誤字・文字切れ・指定外の図表・本文根拠不足・別アカウント・採用SHAの変化・POST応答不明では止まる。減色の復旧は配信SHAを目視確認し`NOTE-COVER-DELIVERY-VERIFY-01`と既存learnedの手順に従う。Claudeによる作画や旧rendererへの代作はしない。
- **完了条件**: 公開済み全対象が現行方針の採用版で配信され、保全hashと公開画像の確認記録がある。途中の確認待ちや未反映を完了扱いしない。
- **別PCの再開入口**: developをpullして本カードとカタログREADMEを読み、共有セッションの状況と最新版の資産検証を確認する。画像・実プロンプト・目視記録はprivate R2が正本で、Windowsの生成画像フォルダや一時ファイルをコピーする必要はない。R2認証とnoteのstats47ログインは各PCの既存設定を使う。今回のGit同期だけを理由に記事本文・カバーを再投稿しない。

### [PAGE-QUALITY-ERROR-BACKLOG-01] ページ品質の週次監査の error 3,149 件を種類ごとに振り分ける
タグ: [UI・UX] [種類:不具合] [実行:対話] [起票:2026-10-10] [領域:サイト]

- **事象**: #1014 (2026-10-03) で error=3,149・warning=7,885 (6,475 URL)。種類の内訳 (HTML/RSC 肥大・DOM 過剰・リンク重複・広告重複・構造化データ・画像切れ) を誰も振り分けていない。リンク重複は [SITEWIDE-DUPLICATE-LINK-RATIO-01] が扱う。
- **次**: `/quality/page-audit` か R2 `state/page-quality/latest.json` で error を種類別に数え、既存カードに載るものは振り分け、載らない種類はカードにする。誤検知なら閾値を直す。
- **完了条件**: error の各種類に行き先 (カード ID か閾値修正) があり、#1014 にその表がコメントされている。

### [NOTE-PRODUCT-CARD-MISMATCH-01] note 記事の商品カードの題名が実商品の題名と食い違う
タグ: [収益化] [種類:不具合] [実行:対話] [起票:2026-10-10] [領域:商品]

- **事象**: note 商品カードの週次監査 #1064 (2026-10-03) で a-kakei 系の記事 (fukui・fukuoka・fukushima・gifu・gunma ほか) のカードが「消費量日本一の食卓 — …」を表示し、実商品 (storefront.generated.ts) の「食卓の支出と購入数量 — 家計調査の地域差を読む」と一致しない。
- **状態 (2026-10-18)**: 10-17 の監査で 288 記事中 109 件が不一致。うち 38 件は末尾の「 | stats47」だけの差で、監査側で無視するよう直した (`audit-note-product-cards.mjs`)。残る約 71 件は題名そのものが違う: 食卓 52 件 (「消費量日本一の食卓…」→ 正本「食卓の支出と購入数量…」)・実質手取り 9 件 (「実質手取りの地図…」→ 正本「年収が高い県は、暮らしも豊かなのか」)・教育と子育て 5 件 (待機児童 → 子育て指標)・エネルギー 5 件 (水道 → ガス)・産業 5 件 (農林 → 地価)。
- **次**: 商品の題名を変えたのが先か、カードが古いのかを確かめる。カードはマガジンではなく実商品の正本から解決する (memory `feedback_note_product_card_ssot`)。直すときは公開済み記事のカードを PUT で差し替える手順を使う。公開済み記事の書き換えは note への外部変更なのでオーナーの承認を得てから行う。2026-10-18 時点でこの Mac からの note へのアクセスは記事ページも API も HTTP 403 (CloudFront) で、CI からは取得できている。差し替えは 403 が解けてから行う。
- **完了条件**: 次の週次監査で不一致 0 件。

### [NSM-GUARD-EMPTY-CSV-01] 週次収益 (NSM) のガードが GA4 の CSV 0 行で失敗した原因を確かめる
タグ: [インフラ・計測] [種類:不具合] [実行:対話] [起票:2026-10-10] [領域:管理]

- **2026-10-21 経過**: `fetch-metrics-weekly.yml` の run 一覧 (`gh run list --workflow fetch-metrics-weekly.yml`) では、失敗は 10-04 の 37213549127 だけで、次の 10-16 07:53 JST の 38820105627 は成功し、ガードが全 PASS で #1065 は自動クローズされた。成功はまだ 1 週なので、次の週次実行 (10-23 頃) の成功を見てから閉じる。0 行の原因は再現しないため未特定。10-09 の週は schedule の run 自体が一覧に無い (別件として確認が要る)。
- **事象**: #1065 (2026-10-04)。ガードの実行 (run 37213549127) で `overview.csv`・`daily.csv`・`devices.csv`・`units.csv` がすべて 0 行 (error)。前の 2 回 (09-20・09-27) は成功している。
- **次**: 10-11 の実行結果を確かめる。成功していれば一時的な取得失敗として #1065 に記録して閉じ、続いていれば GA4 の取得 (認証・プロパティ・期間) を調べる。
- **完了条件**: 週次収益の計測が 2 週続けて成功し、#1065 が閉じている。

### [THEME-CPI-503-01] テーマ品質監査で consumer-prices ページが 503・タイムアウトになる
タグ: [UI・UX] [種類:不具合] [実行:対話] [起票:2026-10-10] [領域:サイト]

- **事象**: テーマ品質監査 #1069 (2026-10-05) で `/themes/consumer-prices` (幅 1440) が HTTP 503・h1 の待機タイムアウト・チャート 2 つ欠落 (theme-cpi-heatmap・theme-cpi-profile)。
- **次**: 本番の該当 URL を Googlebot UA で取得して今も 503 かを確かめる。続いていれば Workers の CPU 制限 ([CF-CPU-SURGE-01]) との関係を見る。一時的なら次回監査で解消を確認する。
- **完了条件**: 次のテーマ品質監査で consumer-prices の表示検査が通る。

### [PERF-RANKING-LCP-03] ランキングページの LCP がベースラインより悪化したまま

タグ: [インフラ・計測] [種類:不具合] [実行:対話] [検証:node .claude/scripts/psi/... の history.csv で ranking/total-population,mobile の LCP < 9,347ms] [起票:2026-09-07] [期日:2026-10-05] [領域:管理]

- **owner**: Claude Code (調査・実装) / オーナー (デプロイ承認)
- **症状 (実測)**: `data/psi/history.csv` の `ranking/total-population,mobile` 直近 3 週 (2026-08-23〜09-06) の LCP は 10,936〜13,841ms (平均約 12,300ms) で、ベースライン 9,347ms (2026-08-04) より約 32% 悪化している。
- **デプロイ後の実測 (2026-09-18 時点)**: PR #940 (`4ee6b5641` を含む) は 09-07 に main へ。以降の LCP は 09-07 9,230 / 09-10 9,735 / 09-11 8,548 / 09-12 5,738 / 09-15 7,709 / 09-16 7,964 / 09-17 7,538ms。
  09-10 の 1 日を除きベースライン未満だが、完了条件の「3 週連続」には 09-28 まで観測が要る。期日をそこへ動かした (判定は週次レビューで)。
- **一次診断**: 最新 batch (2026-09-06) の `lcp_element` 実測で LCP 要素は依然 Leaflet タイル。topology をクライアント `useEffect` fetch へ変更したことがハイドレーション後の直列処理を増やした疑い。
- **なぜカードが要るか**: 旧 `PERF-RANKING-LCP-02` は 2026-09-07 の improvement-triage (`b27c62cab`) で「完了条件未達」として改善バックログから削除されたが、後継の追跡先が作られず**どの台帳にも存在しない状態**になっていた。`monthly.md` の言及は計画ビューであり TODO の実体ではない。
- **比較の断絶 (2026-09-25)**: LCP 要素である背景タイルを CARTO (同一 origin の /tiles プロキシ・30 日エッジキャッシュ) から地理院タイル (cyberjapandata.gsi.go.jp を直接取得) へ切り替えた (commit 871096e46、main 95a9971)。9/25 以降の PSI はタイル配信元が別物なので、ベースライン 9,347ms との比較は 9/25 以降の 3 週で改めて判定し、それ以前の推移とつなげない。
- **次**: タイル描画を TopoJSON 取得から分離する修正は `4ee6b5641` に実装済み。PR #940 の本番反映後に LCP 要素を再確認し、PSI の 3 週以上の推移で効果を判定する。調査・実装を最初から繰り返さない。
- **停止条件**: 単発の PSI 値で改善と判定しない (日次計測はばらつくため 3 週以上の推移で見る)。デプロイはオーナーの明示承認まで行わない。ベースライン 9,347ms は 2026-08-04 の実測値で、これを更新して達成扱いにしない。
- **完了条件**: `ranking/total-population,mobile` の LCP が 3 週連続でベースライン 9,347ms を下回る。悪化要因が topology fetch でなかった場合は、実測で特定した真因と対策を本カードへ記録してから閉じる。


### [UNPUSHED-COMMIT-STOP-01] セッションが develop にコミットしたまま push せずに終わるのを Stop hook で差し戻す
タグ: [エージェント・SSOT] [種類:改善] [実行:対話] [起票:2026-10-10] [領域:管理]

- **事象**: 2026-10-10、別のセッションが checker-wiring の修正 c4d0bc03a を本体の作業ツリーの develop にコミットしたまま push せずに離れた。その間 origin/develop の Develop Quality Gate は落ち続け (run 37998239267 ほか)、別のセッションが気づいて pull と push をするまで残った。いまの Stop hook 5 本 (`check-consistency-on-stop.js` / `check-docs-on-stop.js` / `check-findings-on-stop.js` / `check-weekly-cadence-on-stop.js` / `session-guard.js`) は、ローカルの develop が origin より先にある状態を見ていない。
- **次**: Stop hook で、`git log origin/develop..develop` にそのセッションが作ったコミットがあれば 1 回だけ差し戻し、push するか、push しない理由を返答に書くよう促す。他のセッションのコミットで誤って止めないよう、セッションの開始時刻以降の自分の author のコミットに限る。fetch はしない (hook を遅くしない)。
- **優先度の根拠**: 起きると develop の検査が赤のまま残り、後の作業者が原因の切り分けに時間を使う。ただし CI 自体は検出しているので、🔴 ではなく 🟡 とする。
- **完了条件**: 未 push のコミットがある状態で Stop すると 1 回差し戻され、push 後は差し戻されないことをテストで固定した。

### [CHECKER-WIRING-PRECOMMIT-01] 配線されていない検査スクリプトを push 前に止めるため、pre-commit でも check-checker-wiring を走らせる
タグ: [エージェント・SSOT] [種類:改善] [実行:対話] [検証:node .claude/scripts/lib/check-checker-wiring.cjs --baseline] [起票:2026-10-10] [領域:管理]

- **事象**: 2026-10-10、`.claude/scripts/sns/check-post-trace.mjs` が CI に blocking でつながれないまま develop に push され (5c08d6c0a)、Develop Quality Gate が `[NON_BLOCKING_GATE]` / `[MISSING_GATE_TRIGGER]` で落ちた。`check-checker-wiring.cjs --baseline` は `pr-quality-check.yml` / `backlog-loop-daily.yml` / `agent-consistency-weekly.yml` と develop の Quality Gate でしか動かず、pre-commit (`apps/web/scripts/pre-commit-checks.sh`) では動かない。
- **次**: staged に検査スクリプト (`check-*` / `audit-*`) か `.github/workflows/*.yml` が含まれるときだけ、pre-commit で `check-checker-wiring.cjs --baseline` を走らせる。所要時間を測り、遅ければ対象を staged ファイルに絞る。
- **優先度の根拠**: CI では検出できているので被害は「push 後に赤になる」までに限られる。🟡 とする。
- **完了条件**: 未配線の検査スクリプトを staged にすると commit が止まり、配線済みなら通ることを確認した。

### [SNS-TRACE-YT-LEGACY-01] YouTube の URL の無い投稿 42 行と content_key 不明の 2 本を Studio で確定する
タグ: [SNS・マーケ] [種類:改善] [実行:対話] [検証:npm run sns:trace:check] [起票:2026-10-09] [領域:SNS]

- **事象**: 投稿台帳を「1 id から全部たどれる」形へ補完した (2026-10-09・`backfill-post-trace.mjs`) が、YouTube の posted 行 42 件 (id 83〜429、2026-03 投稿) は URL も本文も無く、外部 ID をたどれない。指標の時系列に残る未知の動画 ID 94 本のうち公開中は 7 本だけで、残り 87 本は削除済みか非公開 (oEmbed が返らない)。追加した公開動画 7 本のうち `bi2UqZu_vOQ`・`z0cfD_rCgEI` は説明欄にランキング URL が無く content_key が空。
- **次**: オーナーが YouTube Studio の動画一覧 (非公開・削除済みを含む) と照合し、42 行に `post_url` を入れるか、存在しない投稿なら `deleted_at` を記録する。2 本の content_key をタイトルから決める。書き込みは store 経由 (`sns-posts-store.cjs`)。
- **完了条件**: `npm run sns:trace:check` の「外部 ID をたどれない posted 行」から YouTube が消える。

### [SNS-YT-STALE-RECORDS-01] YouTube 保留判断に EXP-006 と古い memory を合わせ、未追跡の古い state を消す
タグ: [SNS・マーケ] [種類:改善] [実行:sweep] [起票:2026-10-09] [領域:SNS]

- **事象**: YouTube は 2026-09-23 から保留 (`sns-content-standards.md` §0) だが、`data/business/experiments.json` の EXP-006 は `status: "running"` のまま。memory `project_youtube_mass_experiment_2026_07.md` は撤去済みの CI 投稿経路 (2026-07-27 `437b81d83` / `794ce84d4` で削除) を現役として書き、`reference_publish_youtube_47_summary.md` は作業ツリーにも履歴にも無いスキルを指す。`data/sns/metric-discovery-index.json` の古いコピーが旧置き場に未追跡のまま残っている (2026-10-06 の data/ への移動前の残り)。
- **次**: EXP-006 を保留状態と次の確認日に更新、2 つの memory を事実に合わせて直すか削除、未追跡の古いコピーを削除する。


### [CRITIC-PATTERN-CHART-TEXT] critic の指摘「図と本文」が 4 本の記事で繰り返した。writer の規約か gate に入れる
タグ: [コンテンツ品質] [種類:改善] [実行:対話] [起票:2026-10-09] [領域:サイト]

- **事象**: 直近の窓で、blog-critic が型「図と本文」(`chart-text`) の BLOCK/MAJOR を 4 本の記事で 4 件出した。critic の目視でしか見つかっていない。例:
  - 2026-10-08 bonito-catch-prefecture: bonito-two-poles.svg は、既にチャート bonito-ranking.svg(上位5)に載っている静岡81,295トンと宮城19,828トンの2本の棒を再掲しただけで、読者に新しい情報を足さない(冗長・図表重複)。
  - 2026-10-08 cc-estat-09-radar-prefecture: 62 行と 423 行の 2 枚の図（tokyo-radar-findings.svg / tokyo-kyoto-overlay-findings.svg）は generateFindingsCardSvg が描いた番号付きテキストの要…
  - 2026-10-08 fish-catch-vs-consumption-prefecture: 54行目・87行目の散布図。
  - 2026-10-08 bonito-catch-zero-prefectures-gap: 新しい主題 (0トンと行なしの年ごとの入れ替わり) を示す図がありません。
- **次**: 機械で判定できるなら quality-gate に検査を足す (公開済み記事で誤検知 0 件を確かめてから blocker にする)。できなければ `.claude/rules/blog-quality-standards.md` と article-writer の指示に書く。
- **完了条件**: 検査か規約が入り、`.claude/config/critic-finding-types.json` の `chart-text` に `promotedAt: "<入れた日>"` を書いた。
- 起票元: `critic-findings-digest.mjs` (台帳 `data/blog/critic-findings.jsonl`)

### [BLOG-METRIC-NAME-GATE-01] 記事が指標を別の名前で呼ぶ誤りと、比較の基準年が低い年に当たる誤りを公開前に機械で止める
タグ: [コンテンツ品質] [種類:改善] [実行:対話] [起票:2026-10-08] [領域:サイト]

- **事象 (2026-10-08、fishery-species-prefecture-specialty の critic)**: ① 指標 `fishery-species-catch-japanese-squid` (title「スルメイカ漁獲量」) の値を本文が「イカ類」と書いていた (BLOCK)。
  ② 「2015 年と比べてホタテ・コンブの寡占はさらに強まった」の 2015 年は、2013〜2018 年の中で最も低い年で、幅の中の変動を傾向と書いていた (MAJOR)。どちらも critic の目視でしか見つからなかった。
- **次**: ① data JSON の `label` / metric の title と、本文で同じ値を語る文の名詞を照合し、上位概念の名前 (イカ類・マグロ類など) で呼んでいたら warning にする。
  ② 「N 年と比べて」の比較で、N 年が手元の時系列の最低・最高に当たるかを data JSON から判定して warning にする。どちらも誤検知を出さないことを、公開済み記事で実測してから入れる。
- **完了条件**: 上の 2 例が warning になり、公開済み記事の実測で誤検知が許容範囲に収まっている (unit-semantics-standards の「誤りを注入して発火・正しい値で無反応」を両方テストで固定)。

### [BLOG-SCATTER-POINT-LABEL-01] ブログの散布図に、本文で名指しする県のラベルを描けない
タグ: [コンテンツ品質] [種類:改善] [実行:対話] [起票:2026-10-08] [領域:サイト]

- **事象 (2026-10-08)**: `fish-catch-vs-consumption-prefecture` の critic が「散布図に県名ラベルが無く (名前は hover 用 title のみ)、本文が名指しする県を図で探せない」を MAJOR で指摘した。
  svg-builder の scatter に注目点だけラベルを付ける機能が無いので、同じ型の散布図記事で同じ指摘が繰り返される。
- **次**: scatter の data JSON に注目点 (areaCode の配列) を書けるようにし、その点だけ県名を描く。ラベルの重なり回避と mobile 版の扱いを決める。
- **関連 (2026-10-08、bonito-catch-zero-prefectures-gap の critic)**: 県×年の「値あり / 0 トン / 行なし」を並べる状態マトリクスの型も svg-builder のカタログに無く、時系列の欠け方を図にできない (`contents/blog/bonito-catch-zero-prefectures-gap/data/bonito-status-by-year.json`)。散布図のラベルと同じ回で、カタログに足すかを決める。
- **完了条件**: 注目点を指定した散布図で県名が描かれ、`.claude/rules/blog-svg-chart-standards.md` のサイズ gate を通る。

### [BLOG-REFRESH-STALE-SOURCE-FIELDS-01] 図の年の取り直しで source.json の coverage と補足値が古い年のまま残る
タグ: [コンテンツ品質] [種類:不具合] [実行:対話] [起票:2026-10-08] [領域:サイト]

- **2026-10-21 完了 (行削除は backlog-loop)**: 補足の集計値 (coverage・相関など) は図の data から作り直せないので、自動で直さず列挙する方にした。`lib/refresh-chart-year.mjs` に `findStaleSourceFields` (取り直し後の source.json で、作り直した year・refreshedFromYear・fetchedAt 以外に元の年が残る欄を、入れ子のパスで返す。4 桁の年を数字の境界で判定) を足し、`refresh-article-data-years.mjs` が「手作業: source.json の coverage・supplementary.tunaCorrelation.year に 2015 年の値が残る」を表の補足に出す。テスト 2 件 (bonito の形・残りなし)。
- **事象 (2026-10-08)**: `refresh-article-data-years.mjs --apply` で `bonito-catch-prefecture` の図を 2023 年にしたあと、`bonito-ranking.source.json` の
  `coverage` と `supplementary.tunaCorrelation` が 2015 年の値のまま残った (article-writer が手で直した)。ほかの記事でも取り直し後に古い値が残りうる。
- **次**: スクリプトが年に依存する source.json の項目を作り直すか、作り直せない項目があれば「手作業」に出して知らせる。
- **完了条件**: 取り直し後の source.json に古い年の値が残らないか、残る項目が出力の「手作業」に列挙される (テストで固定)。

### [AGENT-WRITER-CRITIC-HANDOFF-01] article-writer をサブエージェントで起動すると、必須の blog-critic を起動できず記事が公開できない状態で返る
タグ: [エージェント・SSOT] [種類:不具合] [実行:対話] [起票:2026-10-08] [領域:管理]

- **事象 (2026-10-08 実測)**: 魚種ブログの取り直しで article-writer を Agent tool から起動したところ、その実行環境に Agent / Workflow ツールが無く、
  `.claude/agents/article-writer.md` Phase 6-2 の「blog-critic を Agent tool で起動する」を実行できずに review.md なしで返った。呼び元が critic を別に起動して補った。
- **次**: article-writer の Phase 6 を「サブエージェントとして起動されたときは critic を起動せず、呼び元に critic の起動を依頼して返す」に書き換えるか、
  呼び元の手順 (/brushup-blog・publish-geo-portfolio 等) に critic を呼び元が起動する工程を明記する。どちらにするかを 1 つに決めて agent 定義と skill を揃える。
- **完了条件**: article-writer の定義と、それを起動する skill の手順で critic の起動者が一致し、サブエージェント起動で同じ食い違いが出ない。

### [YEAR-COV-AREA-AXIS-01] 年カバレッジ監査が、都道府県が分類軸にある表などの取得条件を再現できず、8 指標で値のある年を 0 と数える
タグ: [コンテンツ品質] [種類:不具合] [実行:対話] [検証:npx vitest run packages/ranking/src/scripts/__tests__/audit-estat-year-coverage.test.ts] [起票:2026-10-08] [領域:データ]

- **事実 (2026-10-08)**: `audit-estat-year-coverage.ts` は、値のある年が 0 件のとき「空の集合は config の年に含まれる」ため `confirmed-single-year` (対応不要) と判定していた。該当は 8 指標 (dairy-cattle-count・inpatient-rate-per-100k・fishery-household-sex-age・fishery-management-orgs・fishery-workers-coastal-offshore・fishing-port-count-by-type・fishing-vessel-crew・fishing-vessel-tonnage-class)。`--metrics` で全都道府県を取っても 0 年のままだが、R2 の values.json には値がある (dairy-cattle-count 2025 年 47 県、inpatient-rate-per-100k 2023 年 47 県、fishing-vessel-crew 2003 年 39 県)。dairy と inpatient は都道府県が分類軸にある表 (`areaAxis`) で、監査の取得はこれを再現していない。漁業の 6 指標の原因は未調査。
- **済 (2026-10-08)**: 値のある年が 0 件のときは新しい判定 `no-sample-values` (判断できない) にした。テストで固定し、修正を外すと落ちることを確かめた。8 指標の記録は `no-sample-values` に変わった。
- **次**: 監査の取得を取り込み (`page-data-batch.ts`) と同じ条件 (`areaAxis`・軸の pin・合算) にそろえる。共通の取得関数があればそれを使い、無ければ取り込み側から切り出す。漁業の 6 指標は取得結果を見て原因を確かめる。
- **完了条件**: 8 指標で、監査が R2 と同じ年に値を数え、`no-sample-values` が 0 件になる。

### [DATA-WAGE-TEACHER-COVERAGE-01] 賃金構造基本統計の教員年収ランキングが教員全体の約 5% しか映していないことをページに示すか、公開をやめるかを決める
タグ: [コンテンツ品質] [種類:不具合] [実行:対話] [起票:2026-10-08] [領域:サイト]

- **事象 (2026-10-08 に e-Stat API で実測)**: `school-teacher-annual-income` (表 0003445758・cdCat02=1192 小・中学校教員) の推計労働者数 (表章項目「労働者数」×10) は全国で約 3.3 万人 (2023 年 32,960 人) で、社会・人口統計体系の小・中学校教員数 (R2 `elementary-school-teachers` + `junior-high-school-teachers`、2023 年 47 都道府県合計 671,782 人) の約 4.9% しかない (2020 年 4.1%・2021〜2023 年 4.9%)。県別では 2023 年の愛媛が推計 60 人 (教員 7,435 人の 0.8%)、石川 2021 年は 40 人で賞与 0.0。県ごとの平均が数十人の推計に基づくため、1 位・最下位が毎年入れ替わる (2021 石川 245.16 万円、愛媛 2021 692.05 → 2023 315.72 万円)。ランキングページの表題「小中学校教員の平均年収」と「1 位 愛知 885.9 万円」は、読者に公立教員の給与水準と読まれるが、その読み方はできない。config の note は「公立学校教員だけに限定した統計ではない」とだけ書く。
- **出典**: 調査範囲は厚生労働省「令和5年賃金構造基本統計調査 調査の概要」(https://www.mhlw.go.jp/toukei/itiran/roudou/chingin/kouzou/z2023/dl/gaiyo.pdf、2026-10-08 取得) で、16 大産業 (教育，学習支援業を含む) の「5人以上の民営事業所」と「10人以上の公営事業所」。なぜ 5% しか映らないかは公式資料で未確認なので、理由を断定しない。
- **次 (決めること)**: ① 同じ表の職種別年収 40 指標 (高等学校教員 `high-school-teacher-annual-income` = cdCat02 1194 など) で、推計労働者数と実際の就業者数の比を同じ方法で出す ② 比が小さい指標は、ページに推計人数を併記する・県別ランキングとしての公開をやめる (`isActive:false` + 410/301 の判断)・note を書き直す、のどれにするかをオーナーが決める。公開をやめる場合は `ranking-publisher` の手順 (KNOWN/SITEMAP/R2) に乗せる。
- **追加の実測 (2026-10-08、同じ表の年齢・勤続年数)**: 統計に映る教員の平均年齢が同じ県でも 1 年で大きく変わる (2022→2023 で愛媛 45.1→36.6 歳、鳥取 44.8→33.6 歳、北海道 36.0→47.4 歳。全国は 42.5→41.0 歳)。41 県で年収の変化と平均年齢の変化の相関は 0.562。県ごとの年収は、教員の待遇の違いより、年ごとに入れ替わる少人数の顔ぶれを強く反映している。
- **追記 (2026-10-08、blog-critic が報告・e-Stat 生応答で確認)**: 2021 年の岩手は表章項目「労働者数」が 0 (十人単位) で平均年齢 86.5 歳・勤続 52.5 年なのに、年収 491.4 万円で 39 位として順位が付いている。推計 10 人未満の県年は、少なくとも順位から外すか注記する。
- **停止条件**: 推計人数が小さいことだけを理由に、他の職種の指標を一括で非公開にしない (職種ごとに比を見てから決める)。
- **完了条件**: 対象指標の扱いが決まり、ページの表示 (併記・note・非公開) が本番に反映されている。

### [CRITIC-PATTERN-TITLE-PROMISE] critic の指摘「タイトル・約束」が 3 本の記事で繰り返した。writer の規約か gate に入れる
タグ: [コンテンツ品質] [種類:改善] [実行:対話] [起票:2026-10-08] [領域:サイト]

- **事象**: 直近の窓で、blog-critic が型「タイトル・約束」(`title-promise`) の BLOCK/MAJOR を 3 本の記事で 3 件出した。critic の目視でしか見つかっていない。例:
  - 2026-10-07 dairy-cattle-count: タイトルは「東京と大阪で乳用牛が少ないのはなぜ?」ですが、本文の答えは「人口の多さだけでは説明できません」(L25・L71) と「このデータだけでは確かめられません」(L44・L67・L79) にとどまり、型A の必須視点「なぜ上位・下位…
  - 2026-10-07 vacant-housing-vs-aging: タイトルは「なぜ空き家は少ない?」と理由を約束していますが、本文の答えは「住み継がれている可能性」の 1 つだけで、「このデータだけでは確かめられません」と自分で認めています (空き家率の節、散布図の節の 2 か所)。
  - 2026-10-08 school-teacher-annual-income: タイトルの「大都市が上位とは限らない逆説」は、2023年1年分だけの並びである。
- **次**: 機械で判定できるなら quality-gate に検査を足す (公開済み記事で誤検知 0 件を確かめてから blocker にする)。できなければ `.claude/rules/blog-quality-standards.md` と article-writer の指示に書く。
- **完了条件**: 検査か規約が入り、`.claude/config/critic-finding-types.json` の `title-promise` に `promotedAt: "<入れた日>"` を書いた。
- 起票元: `critic-findings-digest.mjs` (台帳 `data/blog/critic-findings.jsonl`)

### [CRITIC-PATTERN-CORRELATION] critic の指摘「相関の読み方」が 3 本の記事で繰り返した。writer の規約か gate に入れる
タグ: [コンテンツ品質] [種類:改善] [実行:対話] [起票:2026-10-08] [領域:サイト]

- **事象**: 直近の窓で、blog-critic が型「相関の読み方」(`correlation`) の BLOCK/MAJOR を 3 本の記事で 3 件出した。critic の目視でしか見つかっていない。例:
  - 2026-10-07 dairy-cattle-count: L25・L46・L58・L71 の「相関係数約0.3、逆向きではなく弱い正の関係、だから人口の多さだけでは説明できない」は、人口と乳用牛の総数どうしを比べた結果です。
  - 2026-10-07 it-industry-concentration: 「テレワークの節」の IT産業×テレワークの順位相関 0.73 が、人口との関係と区別されていません。
  - 2026-10-07 vacant-housing-vs-aging: 「山形県はその残りの部分が最も大きく表れた県であり」(決定係数の段落) は、順位差と回帰残差を混同しています。
- **次**: 機械で判定できるなら quality-gate に検査を足す (公開済み記事で誤検知 0 件を確かめてから blocker にする)。できなければ `.claude/rules/blog-quality-standards.md` と article-writer の指示に書く。
- **完了条件**: 検査か規約が入り、`.claude/config/critic-finding-types.json` の `correlation` に `promotedAt: "<入れた日>"` を書いた。
- 起票元: `critic-findings-digest.mjs` (台帳 `data/blog/critic-findings.jsonl`)

### [CRITIC-PATTERN-READER-VALUE] critic の指摘「読者価値」が 4 本の記事で繰り返した。writer の規約か gate に入れる
タグ: [コンテンツ品質] [種類:改善] [実行:対話] [起票:2026-10-08] [領域:サイト]

- **事象**: 直近の窓で、blog-critic が型「読者価値」(`reader-value`) の BLOCK/MAJOR を 4 本の記事で 4 件出した。critic の目視でしか見つかっていない。例:
  - 2026-10-07 cc-estat-20-publish: 連載の約束 (Part 19 の「毎週ほったらかしで最新化」) が最終回で閉じていません。
  - 2026-10-07 dairy-cattle-hokkaido-monopoly: 型Aの必須視点「なぜ上位か (地理・産業構造)」が、L25・L42・L57 の3か所で「確かめられていません」と保留され、答えが無いまま終わっています。
  - 2026-10-07 sixth-industry-direct-sales: アーキタイプ A の必須視点「なぜ上位・下位か」が、確かめられないという記述で止まっています。
  - 2026-10-08 frozen-gyoza-spending-prefecture-gap: アーキタイプ A の必須視点「なぜ上位/下位か」が、推測の一般論にとどまる。
- **次**: 機械で判定できるなら quality-gate に検査を足す (公開済み記事で誤検知 0 件を確かめてから blocker にする)。できなければ `.claude/rules/blog-quality-standards.md` と article-writer の指示に書く。
- **完了条件**: 検査か規約が入り、`.claude/config/critic-finding-types.json` の `reader-value` に `promotedAt: "<入れた日>"` を書いた。
- 起票元: `critic-findings-digest.mjs` (台帳 `data/blog/critic-findings.jsonl`)

### [CRITIC-PATTERN-REGION] critic の指摘「地域のくくり」が 5 本の記事で繰り返した。writer の規約か gate に入れる
タグ: [コンテンツ品質] [種類:改善] [実行:対話] [起票:2026-10-08] [領域:サイト]

- **事象**: 直近の窓で、blog-critic が型「地域のくくり」(`region`) の BLOCK/MAJOR を 5 本の記事で 6 件出した。critic の目視でしか見つかっていない。例:
  - 2026-10-08 fresh-udon-soba-consumption-prefecture-gap: 節見出し「九州・沖縄はなぜ少ない？」、リード「九州・沖縄が下位に沈む」、まとめ「沖縄・九州が下位に集中」は、九州を一括りにしすぎている。
  - 2026-10-08 udon-soba-food-culture-prefecture-map: 「島根」と「山形」を「内陸のそば文化圏」「海から遠い内陸でも」と書いている(トップ5紹介、第二の層、まとめの『長野・島根など内陸のそば文化圏』)。
  - 2026-10-08 udon-soba-food-culture-prefecture-map: 「大都市圏が下位に集まります」「南関東や北海道、沖縄が続きます」は一般化しすぎ。
  - 2026-10-08 bonito-catch-prefecture: 「上位10県のうち9県が太平洋に面しており、唯一の例外は新潟県」は R2 値と合わない。
  - 2026-10-08 katsuobushi-expenditure-ranking: 「三重・滋賀・岐阜・京都といった近畿・東海の内陸県も6〜10位」は誤り。
- **次**: 機械で判定できるなら quality-gate に検査を足す (公開済み記事で誤検知 0 件を確かめてから blocker にする)。できなければ `.claude/rules/blog-quality-standards.md` と article-writer の指示に書く。
- **完了条件**: 検査か規約が入り、`.claude/config/critic-finding-types.json` の `region` に `promotedAt: "<入れた日>"` を書いた。
- 起票元: `critic-findings-digest.mjs` (台帳 `data/blog/critic-findings.jsonl`)

### [CRITIC-PATTERN-CAUSAL] critic の指摘「原因の断定」が 5 本の記事で繰り返した。writer の規約か gate に入れる
タグ: [コンテンツ品質] [種類:改善] [実行:対話] [起票:2026-10-08] [領域:サイト]

- **事象**: 直近の窓で、blog-critic が型「原因の断定」(`causal`) の BLOCK/MAJOR を 5 本の記事で 6 件出した。critic の目視でしか見つかっていない。例:
  - 2026-10-07 real-disposable-income-reversal: 逆転の大きさに対する注意がありません。
  - 2026-10-08 fresh-udon-soba-consumption-prefecture-gap: 「外食でうどんを食べる文化が強い県ほど、この指標では家庭の購入量が小さく見えるのです」(下位構造節) と まとめの「福岡のように外食でうどんを食べる県は家庭の購入量が小さく出る」は、福岡1例を一般則にしており、データと矛盾する。
  - 2026-10-08 fresh-udon-soba-consumption-prefecture-gap: 「うどん圏」「そば圏」の割り当てが矛盾している。
  - 2026-10-08 udon-soba-food-culture-prefecture-map: 「九州が軒並み下位なのは、麺を食べないのではなく『外食で食べている』可能性が高い」(WARNING)、「福岡をはじめとする九州勢…そして大都市圏が下位に集まります。
  - 2026-10-08 soba-udon-dining-consumption-expenditure-prefecture-gap: 「なぜ香川がこれほど突出しているのか」の節の説明に根拠が無い。
- **次**: 機械で判定できるなら quality-gate に検査を足す (公開済み記事で誤検知 0 件を確かめてから blocker にする)。できなければ `.claude/rules/blog-quality-standards.md` と article-writer の指示に書く。
- **完了条件**: 検査か規約が入り、`.claude/config/critic-finding-types.json` の `causal` に `promotedAt: "<入れた日>"` を書いた。
- 起票元: `critic-findings-digest.mjs` (台帳 `data/blog/critic-findings.jsonl`)

### [CRITIC-PATTERN-VALUE] critic の指摘「数値・順位の食い違い」が 6 本の記事で繰り返した。writer の規約か gate に入れる
タグ: [コンテンツ品質] [種類:改善] [実行:対話] [起票:2026-10-08] [領域:サイト]

- **事象**: 直近の窓で、blog-critic が型「数値・順位の食い違い」(`value`) の BLOCK/MAJOR を 6 本の記事で 6 件出した。critic の目視でしか見つかっていない。例:
  - 2026-10-07 dairy-cattle-hokkaido-monopoly: L65「北海道への集中は、どの地方の合計と比べても桁が違います」は、直前の文の数字と合いません。
  - 2026-10-07 school-teacher-annual-income-prefecture-gap: 「データについて」前の TIP「4年間で3位以内に2回以上入った県は…愛知県と…東京都の2県」は誤りです。
  - 2026-10-07 vacant-housing-vs-aging: 65歳以上人口割合の節の「上位5県の差は0.2ポイントに収まっており、2位以下は僅差で並んでいます」は、図の JSON と合いません。
  - 2026-10-08 bonito-catch-prefecture: 「漁獲ゼロ13県」の13県のうち、R2 `app/ranking/fishery-species-catch-bonito/values.json` の 2015 年 partition は30行で、値が0なのは山形・石川・島根・熊本の4…
  - 2026-10-08 katsuobushi-expenditure-ranking: 最下位グループの「沖縄の4分の1以下の水準」は、下位5県のうち鳥取(566円=23.5%)にしか当てはまらない。
- **次**: 機械で判定できるなら quality-gate に検査を足す (公開済み記事で誤検知 0 件を確かめてから blocker にする)。できなければ `.claude/rules/blog-quality-standards.md` と article-writer の指示に書く。
- **完了条件**: 検査か規約が入り、`.claude/config/critic-finding-types.json` の `value` に `promotedAt: "<入れた日>"` を書いた。
- 起票元: `critic-findings-digest.mjs` (台帳 `data/blog/critic-findings.jsonl`)

### [CRITIC-PATTERN-DEFINITION] critic の指摘「定義の取り違え」が 9 本の記事で繰り返した。writer の規約か gate に入れる
タグ: [コンテンツ品質] [種類:改善] [実行:対話] [起票:2026-10-08] [領域:サイト]

- **事象**: 直近の窓で、blog-critic が型「定義の取り違え」(`definition`) の BLOCK/MAJOR を 9 本の記事で 12 件出した。critic の目視でしか見つかっていない。例:
  - 2026-10-07 engel-coefficient-vs-prefectural-income: 1人当たり県民所得は「雇用者報酬・財産所得・企業所得を合わせた県民所得を人口で割った値で、個人の給与や手取りの平均ではない」指標です (本リポジトリの apps/web/src/features/survey/survey-editori…
  - 2026-10-07 engel-coefficient-vs-prefectural-income: 姉妹記事との食い違いの書き方が足りません。
  - 2026-10-07 real-disposable-income-reversal: 冒頭の「逆転を起こしているのは、家賃ではなく物価の水準でした」は、家賃と物価を対立させて読ませますが、消費者物価地域差指数 (総合) は民営家賃を含む総合の品目構成で作られています。
  - 2026-10-07 sixth-industry-direct-sales: 農家総所得の対象と分母が本文のどこにも書かれていません。
  - 2026-10-07 sixth-industry-direct-sales: 順位相関の説明で、産出額の暦年 2003 と農家総所得の 2003 年度を「同じ 2003 年」と呼んでいます。
- **次**: 機械で判定できるなら quality-gate に検査を足す (公開済み記事で誤検知 0 件を確かめてから blocker にする)。できなければ `.claude/rules/blog-quality-standards.md` と article-writer の指示に書く。
- **完了条件**: 検査か規約が入り、`.claude/config/critic-finding-types.json` の `definition` に `promotedAt: "<入れた日>"` を書いた。
- 起票元: `critic-findings-digest.mjs` (台帳 `data/blog/critic-findings.jsonl`)

### [FISHERY-BONITO-CONFIG-01] カツオ漁獲量の指標の注記と実データの件数・集計基準が合わない
タグ: [コンテンツ品質] [種類:不具合] [実行:対話] [起票:2026-10-08] [領域:データ]

- **2026-10-21 完了 (行削除は backlog-loop)**: e-Stat 0003238633 (cdCat01=0250) を照会すると、2015 年の 9 県は岩手・茨城・兵庫・鳥取・香川が秘匿 (x)、秋田・大阪・岡山・広島が事実のないもの (-) で、R2 はどちらも値なしにしていた (取り込みの欠落ではない)。対象県数は description の「39都道府県」が e-Stat と一致する (カード起票時の「40」は既に直っていた)。集計基準は農林水産省「海面漁業生産統計調査 調査の概要」に「集計値は、海面漁業経営体の所在地に計上している」(属人統計) とあるのを確かめ、config に `note` として、属人の集計基準・累年表での記号の扱い・2015 年の 9 県の内訳を出典 URL と確認日付きで書いた。validate:config・metrics:check 通過。
- **事実 (2026-10-08、article-writer と blog-critic が報告)**: `data/metrics/fishery-species-catch-bonito.ts` は「内陸 8 県のみ対象外・40 都道府県」と書くが、R2 の 2015 年は 30 行で、岩手・秋田・茨城・大阪・兵庫・鳥取・岡山・広島・香川の 9 県に行が無い (茨城は 2014 年 2,756 トン、鳥取は 2012 年 9,336 トン)。集計が漁業経営体の所在地 (属人統計) であることも config に無い。
- **次**: e-Stat 表 0003238633 で 9 県の 2015 年の記号 (秘匿・該当なし) を確かめ、config の note を実データと集計基準に合わせる。秘匿なら note に書き、取り込みの欠落なら再取り込みする。
- **完了条件**: note の対象県数と集計基準が e-Stat と一致し、9 県の扱いが記録されている。

### [BLOG-DATA-MISSING-AS-ZERO-01] ブログの図のデータで、R2 に行の無い県 (欠損) と値 0 が区別できない
タグ: [コンテンツ品質] [種類:不具合] [実行:対話] [起票:2026-10-08] [領域:サイト]

- **2026-10-21 完了 (行削除は backlog-loop)**: 原因は 2 か所だった。`fetch-ranking-data-r2.mjs` が読む `app/ranking` は値の無い県を既に除いている (カツオ 2023 年は 34 行・無い 5 県は行なし・0 の 4 県は観測値) が、`build-article-data-from-r2.mjs` は `app/stats` の `value: null` 行をそのまま data に入れ、`generate-article-charts.ts` の棒グラフが `?? 0` で 0 として下位に並べていた。共通の `lib/blog-observed-values.mjs` (`observedOnly`: 値が有限数の行だけ残し、観測された 0 は残す) を足して両方で使う (テスト 1 件)。公開済みの data JSON 2,433 件を S3 で全件読み、値の欠けを持つのは 3 件 2 記事: `bonito-catch-zero-prefectures-gap/bonito-status-by-year` (status 付きの意図的な欠けで SVG なし) と `marriage-divorce-okinawa` の婚姻率・離婚率 (本文が順位を書かない県を null にした抽出。公開 SVG に該当県は描かれていない)。0 として描いた公開図は 0 件なので是正キューへの追加はなし。2026-10-08 の bonito の 0 埋め (39 行) を作った経路は特定できていない。
- **事実 (2026-10-08、blog-critic が報告)**: `bonito-catch-prefecture` の `bonito-ranking.json` は 39 行のうち 9 行が R2 に行の無い県で、0 として入っていた。本文はそれを「漁獲ゼロ 13 県」と数え、回遊路の外という因果を付けていた (記事側は同日の改稿で直す)。
- **次**: `.claude/scripts/blog/fetch-ranking-data-r2.mjs` が欠損県をどう扱うかを読み、欠損は行を作らないか `missing: true` を残す。公開済み記事の data JSON で同じ埋め方がされた図を数え、該当記事を是正キューに載せる。
- **完了条件**: 取得スクリプトが欠損を 0 にしないことをテストで固定し、公開済み記事の該当件数が記録されている。

### [FACTUAL-CHECK-CROSS-METRIC-RANK-01] 別指標を併記した段落で、factual-check が順位を主指標の data に誤って照合する
タグ: [コンテンツ品質] [種類:不具合] [実行:対話] [起票:2026-10-08] [領域:サイト]

- **2026-10-21 完了 (行削除は backlog-loop)**: `article-factual-check.mjs` を 3 点直した。① 順位も値と同じく、同じ文に data に無い指標名 (「カツオの購入数量では」) があれば照合しない (`mentionsForeignMetric` を `checkRankClaims` でも使う) ② `.source.json` の `year` を各 fact に付け、本文が data と違う年の順位 (「1972 年は 2 位」) を語るときは照合しない (年が分からない data では従来どおり照合) ③ 県名と数値の間に読点で区切った別の値があれば、その数値は列挙の次の地名のものとして組にしない (「宮崎市の3,517円、宇都宮市の2,801円」)。3 例を再現するテストを先に足して赤を確認し、主指標の順位と値の誤り (指標名あり・なし・data の年) は従来どおり検出するテストも足した (24/24)。outbox 12 記事の RANK/VALUE_MISMATCH は修正前後とも 0 件。
- **事実 (2026-10-08、bonito-catch-prefecture に購入数量の段落を足したとき)**: 「福島県…3位」(購入数量の順位) が漁獲量の data と照合され RANK_MISMATCH になった。書き手が言い回しを変えて回避した。
- **次**: `.claude/scripts/lib/article-factual-check.mjs` の県名と順位の紐づけで、同じ文に別指標名 (data の label と違う指標名) があるときは照合を見送るか、その指標の data と照合する。誤検知のテストと、従来の検出が残るテストを両方足す。
- **同じ根の値の誤照合 (2026-10-08、blog-critic が報告)**: `frozen-gyoza-spending-prefecture-gap` の「宮崎市の3,517円、宇都宮市の2,801円」で、宮崎と 2,801 円を組にした VALUE_MISMATCH (warning) が出た。値は直前の地名と組にする。
- **同じ根の 3 例目 (2026-10-08、fishery-species-prefecture-specialty)**: 主指標がイワシ類 1 つの記事で、別魚種・別年の順位 (「北海道のスケトウダラ 1972 年は 2 位」) がイワシ類の data と照合され RANK_MISMATCH になった。書き手は「N位」を使わない書き方で回避した。
- **完了条件**: 上の 2 つの文で RANK_MISMATCH・VALUE_MISMATCH が出ず、主指標の順位と値の誤りは従来どおり検出する。

### [GYOZA-FROZEN-KEY-01] ぎょうざの指標キーと記事 slug の「frozen」が品目の定義と合わない
タグ: [コンテンツ品質] [種類:意思決定] [実行:ユーザー] [起票:2026-10-08] [領域:データ]

- **事実**: `gyoza-frozen-consumption-expenditure` は家計調査の 371 ぎょうざ で、冷凍品は含まない (収支項目分類「× ぎょうざの冷凍品→370」)。title・subtitle・note と記事本文は 2026-10-08 に直したが、URL の `/ranking/gyoza-frozen-consumption-expenditure` と `/blog/frozen-gyoza-spending-prefecture-gap` に frozen が残る。
- **判断すること**: URL を変えるか。変えるなら metric の改名と 301 (ranking・blog) と被リンク・GSC の引き継ぎを同時に行う。変えないなら理由をこのカードに書いて閉じる。
- **完了条件**: どちらかに決まり、変える場合は旧 URL が 301 で新 URL を返す。

### [NOTE-INDEX-DRIFT-01] note 記事台帳の題名が公開中の題名と食い違う記事を揃える
タグ: [エージェント・SSOT] [種類:不具合] [実行:対話] [検証:npm run note:catalog:check] [起票:2026-10-08] [領域:商品]

- **解決済み (2026-10-13)**: 公開済みインデックスと下書き索引は、記事台帳 `data/note/articles.json` から `generate-note-catalog.ts` が作る派生物になり、
  `npm run note:catalog:check` (PR・pre-commit) が手編集と再生成漏れを止める。65 件の r2_body のずれは、台帳の `body.manifest` (R2 に保存して読み戻せた版の SHA) で置き換えた。
- **残り**: 台帳の `title` が公開中の題名と食い違う記事がある。`d-geo-flood-population-mesh` は台帳が「8,235メッシュ」、note の API
  (`/api/v3/notes/nfe50fb61efc0` の `name`) と非公開 R2 の原稿は「29,737メッシュ」。`d-geo-land-price-future-population` は台帳「人口減少×住宅地価格を再現できるデータにする」、
  公開中は「地価上昇地点と周囲の人口減少を照合する」。全件の照合は、台帳の `title` と note API の `name` を記事ごとに比べれば取れる (公開 API の取得は間隔を空ける。`feedback_note_editor_autosave_drafts`)。
- **完了条件**: 公開済み全記事で台帳の `title` と note API の `name` が一致し、`note:catalog:check` が通る。

### [KEYS-SYNC-PROMINENCE-REGEN-01] ランキングの既知キーを足しても、そこから作るランキング索引の生成物が再生成されない
タグ: [インフラ・計測] [種類:不具合] [実行:対話] [検証:cd apps/web && npx tsx scripts/generate-ranking-prominence.ts --check] [起票:2026-10-08] [領域:データ] [進行中]

- **事実**: `packages/data-configs/src/prominence/ranking-prominence.generated.ts` のカテゴリ別件数は `KNOWN_RANKING_KEYS` から数える
  (`apps/web/scripts/generate-ranking-prominence.ts`)。既知キーを足すたびにこの生成物も変わるが、再生成を忘れて PR の Static Gates と
  Catalog Gates が落ちたことが 2 回ある (2026-09-30 は 45907f98c の後に 940d03615 で、2026-10-08 は 77073be42 の後に ad05798b6 で直した)。
  `sync-snapshots.yml` の sync-ranking-keys job は既知キーと sitemap を再生成して keys PR を作るが、この生成物は再生成せず、
  PR の対象ファイル (`KEY_FILES`) にも入っていない。キーが増える keys PR は同じ検査で落ちる作りになっている。
  pre-commit はこの検査を 2026-09-18 に外した (`pre-commit-checks.sh` 6.45〜6.6b)。
- **次**: sync-ranking-keys job の再生成手順に `generate-ranking-prominence.ts` を足し、`KEY_FILES` に生成物を加える。
  手元で既知キーを再生成する手順 (`.claude/skills/db/generate-known-ranking-keys/SKILL.md`) にも同じ 1 行を足す。
- **2026-10-08 実装 (develop)**: sync-ranking-keys job の再生成手順に `generate-ranking-prominence.ts` を足し、生成物を keys PR に含める
  (`DERIVED_FILES`。キーではないので件数の増減には数えない)。手順書にも同じ 1 行と、正しい出力先を書いた。既知キーを 1 件消すと
  `--check` が exit 1、job と同じ順で作り直すと exit 0 になることを確かめた。**残り**: workflow は main の定義で動くので、次の公開の後、
  キーが増える keys PR で Static Gates が通るのを見てからカードを消す。
- **2026-10-08**: 修正前の job が作った keys PR uruhayato373/stats47#1103 は、キーが今日のリリースで main に同期済みで差が日付のコメント 1 行だけになっていたので閉じた (この PR では検証できない)。次に sync-ranking-keys がキーの増える PR を作ったときに確かめる。
- **完了条件**: キーが増える keys PR で `generate-ranking-prominence.ts --check` が通る。

### [RANKING-ACTIVE-WITHOUT-VALUES-01] 市区町村専用 2 指標の、どこからも読まれなくなった都道府県 item.json を R2 から消す
タグ: [コンテンツ品質] [種類:改善] [実行:ユーザー] [起票:2026-10-08] [領域:データ]

- **経緯**: ブログの関連ランキングが非公開の指標の古い `item.json` を読み、410 のページへリンクしていた。関連ランキングを既知キー一覧の指標だけに絞り (develop の修正)、2026-10-08 の本番デプロイ (uruhayato373/stats47#1108) で確かめた: デプロイの build ログに `item.hook must be a non-empty string` は 0 件、本番の `/blog/international-cooperation-volunteer-map` の `/ranking/` リンクは 2 本とも 200 で、410 だった `volunteer-activity-international-cooperation-15plus` へのリンクは無い。
- **残り**: R2 に残る `foreign-population-per-100k` と `population-density-habitable` の都道府県 `item.json` (2026-08-26 生成) は、もうどこからも読まれない。R2 の削除はオーナーの承認が要る (削除の入口は `r2-maintenance.yml` の `RETENTION_TARGETS` に対象を足す形)。
- **2026-10-09 観測 (範囲は 2 指標ではなく 19 指標)**: 市区町村専用で公開中の 19 指標すべてに、都道府県用の古い `app/ranking/<key>/item.json` が R2 に残る (`crime-rate-per-1k` `current-balance-ratio-city` `elderly-population-ratio` `fiscal-strength-index` `foreign-population-per-100k` `future-burden-ratio-city` `general-hospital-per-100k` `housing-floor-area` `industrial-land-price` `manufacturing-net-value-added-private` `manufacturing-sales-private` `manufacturing-shipment` `per-taxpayer-income` `population-density-habitable` `real-balance-ratio-city` `real-public-debt-service-ratio-city` `retail-stores-per` `total-area-prefecture-ratio` `traffic-accident-per-100k`)。`generate-ranking-items.ts` は都道府県の指標しか書かず、`fiscal-strength-index` の item は 2026-05-24 のまま「（2.1‐）」と「‐/10万人」を持つ。本番の `/ranking/<key>` は 410、市区町村のページ `/municipalities/ranking/<key>` には出ない (curl で確認)。消すなら 19 件まとめて判断する。
- **完了条件**: 承認のうえで 2 つの `app/ranking/<key>/item.json` が R2 から消えている。消さないと決めた場合はこのカードを消す。
- **済 (2026-10-22・オーナー承認)**: 19 指標すべての都道府県用 `item.json` を R2 から削除した (`r2-maintenance.yml` run 39695682844、target `retired-municipality-only-ranking-items-20261022`、残存 0)。`fiscal-strength-index` の item.json は 404、`/municipalities/ranking/fiscal-strength-index` は 200。同じ prefix の `ogp/`・`thumbnail-*`・`values.json` (5 件) は今回の対象外で残る。カードは完了。
### [SEO-CTR-CANDIDATES-01] 取りこぼしクリックの大きい 7 ページを search-growth に渡し、食い合いの 2 組を先に確かめる
タグ: [コンテンツ品質] [種類:改善] [実行:対話] [起票:2026-10-07] [期日:2026-10-25] [領域:サイト]

- **GSC案07 / P2（次に着手）**: implementation-neededの8提案と既存7ページを照合し、担当・対象・完了gateを確定する。未実装を公開待ち・承認済みと扱わない。
- **GSC案26 / P2（次に着手・CTR内優先1）**: 道の駅など表示実績のあるページのtitleをpage×queryと実SERPで検討し、1〜2ページから検証する。
- **GSC案27 / P2（次に着手）**: 選んだページの冒頭に答え・対象年・単位を示し、必要な順位表をHTMLで読めるようにする。既存図表との重複は増やさない。
- **GSC案28 / P2（次に着手）**: 公衆電話のrankingを総数・一覧・推移、blogを理由・地域差へ分け、相互リンクする。検索語の重複だけで悪影響を断定しない。
- **GSC案29 / P2（次に着手）**: 国勢調査ハブから40代未婚割合など答えのあるrankingへ案内し、リンク先・表示文言・到達を検証する。
- **GSC案37 / P2（次に着手）**: 実期間・検索語・端末を固定して比較し、類似未変更ページ・順位・季節性・同時変更を併記する。少標本で因果や効果を確定しない。
- **入力**: `GSC-CTR-DECOMPOSE-01` の 2026-10-07 の表 (健康寿命・道の駅・公衆電話 ranking/blog・国勢調査ハブ・出生率・食料自給率・高校2年男子の身長)。PV 計画 (`PV-PLAN-REVIEW-2026Q4-01`) のうち CTR を上げる打ち手。
- **2026-10-19 対象の拡張候補 (`PV-100K-LEVERS-01` #1)**: GSC 2026-W41 rolling28d で順位 4〜15 位・表示 500 以上のページは 197 本 (表示 277,342・クリック 6,764・CTR 2.4%)。7 ページの検証で手順が固まったら、この 197 本を表示の多い順に `/search-growth` へ渡す (一括変更はしない)。抽出: `data/gsc/snapshots/2026-W41/pages.csv` を impressions ≥ 500 かつ 4 ≤ position ≤ 15 で絞る。
- **次 (実行順)**: ① 公衆電話 (`/ranking/public-phone-count` と `/blog/public-phone-count`)、出生率 (`/blog/fertility-rate-prefecture-gap` と `/ranking/total-fertility-rate`) の 2 組で、同じ検索語に両方が出ていないかを GSC (page × query) で確かめ、食い合いなら役割を分ける (canonical・内部リンク・title の切り口) ② 残り 5 ページを `/search-growth` の候補にし、title・description を 1 ページずつ変える (一括変更はしない) ③ 変えた日を記録し、4 週後に同じ 28 日窓で CTR を比べる。
- **2026-10-07 の確認 (本番の title・canonical を curl で取得)**: 2 組とも canonical はそれぞれ自分自身で、title がほぼ同じ書き方 (同じ年・同じ 1 位と最下位の値) だった。公衆電話は ranking「公衆電話設置台数 都道府県ランキング【2024年】｜1位東京都（10,717.00個）」と blog「公衆電話設置台数1位東京10,717個・最下位徳島509個｜…」。出生率は ranking「…なぜ沖縄1.60が1位で東京0.99が最下位?」と blog「…沖縄1.60・東京0.99、早婚の県ほど高い…」。出生率の ranking から blog へのリンクは 0 本。**[仮説]** 同じ検索語に 2 ページが出て、互いの順位とクリックを下げている。検証: GSC で page × query を取り、同じクエリに両 URL が表示されているか (Mac か CI)。期日: 10-25。判定: 同じクエリの表示が両方にあれば、ranking を「一覧・推移・地図」、blog を「なぜ・相関」の切り口に分けて title を変える。
- **2026-10-07 修正**: 公衆電話の ranking の title・description に出ていた「10,717.00個」は、設定 `data/metrics/public-phone-count.ts` の `display.decimalPlaces: 2` (台数なのに小数 2 桁) と、その値で書かれた seoTitle・seoDescription が原因だった。小数 0 桁に直し、文言を「10,717個」「509個」にした (同じ「.00」のある seoTitle は全 metric でこの 1 件だけ)。本番に出すにはランキングの生成物の作り直しと R2 反映 (オーナー承認) が要る。
- **2026-10-08 確認 (段6)**: R2 の `app/ranking/public-phone-count/item.json` は 2026-10-07T22:01Z に作り直されて seoTitle が「10,717個」になり、本番 `/ranking/public-phone-count` の HTML も「10,717個」(24 か所・「.00」0 件) を返した。ただし `origin/main` の config は「10,717.00個」のまま (修正 `52da45b35` は develop のみ)。main のコードで動く `sync-snapshots` が次に ranking-items を作ると戻るので、**develop→main のマージ (オーナー承認) で定着させる**。マージ後に `curl -s https://stats47.jp/ranking/public-phone-count | grep -c '10,717.00'` が 0 であることを確かめる。
- **① の結果 (2026-10-08・Mac で GSC page × query、28 日 09-08〜10-05)**:
  - **公衆電話は食い合いがある。** 両方に表示されたクエリが 29 件あり、その表示は ranking 4,011・blog 1,566。主な検索語は「全国の公衆電話の数」(ranking 1,788 表示・順位 6.6 / blog 32 表示・8.3) のような**全国の総数**を問うもので、どちらの title にも全国の数が無い。ページ全体では ranking 6,670 表示・22 クリック (0.33%)、blog 4,792 表示・14 クリック (0.29%)。2024 年の 47 都道府県の合計は 96,126 個 (R2 `app/stats/public-phone-count/values.json` の合計。blog 本文の「9.6 万台」と一致)。
  - **出生率は食い合いではない。** 両方に表示されたクエリは 9 件・表示は ranking 11 / blog 48 だけ。ranking は 70 表示・順位 13.6 で、「出生率 ランキング 日本」などのランキング語は blog が順位 1〜1.5 で受けている。ただし ranking の title が「なぜ」の切り口で、blog の title が「ランキング」の切り口と、役割が逆になっている。同じ主題・同じ数値の 3 本目 `/blog/total-fertility-rate` (49 表示・順位 10.1) があり、`BLOG-DUPLICATE-AUDIT-01` で扱う。
  - **役割分けの案 (未適用・オーナー確認待ち)**:
    | ページ | 切り口 | title 案 | 変える場所 |
    |---|---|---|---|
    | `/ranking/public-phone-count` | 一覧・推移・地図 | 公衆電話の数 都道府県ランキング【2024年】全国96,126個・1位東京都10,717個｜推移と地図 | `data/metrics/public-phone-count.ts` の seoTitle・seoDescription (description は「全国の公衆電話は 2024 年に 96,126 個。都道府県別の一覧、1975 年からの推移、地図で比較」) |
    | `/blog/public-phone-count` | なぜ・相関 | 公衆電話はなぜ減った? ピーク93.5万台→9.6万台、都市に残り地方で消える理由｜47都道府県2024 | 記事 frontmatter (R2 の記事を contents/blog の送り箱経由で更新)。本文冒頭から ranking へ「都道府県別の一覧と推移」のリンクを置く |
    | `/ranking/total-fertility-rate` | 一覧・推移・地図 | 合計特殊出生率 都道府県ランキング【2023年】1位沖縄1.60・最下位東京0.99｜推移と地図 | metric の seoTitle。ranking→blog のリンク (0 本) を足す。blog の title は順位 1 の検索語を受けているので変えない |
  - 判断: 公衆電話は案どおり 2 ページを分ける。出生率は ranking の title と相互リンクだけ直す。
- **② の結果 (2026-10-08)**: 残り 5 ページはどれも search-growth に `ctr-opportunity` として pending で入っていた (`data/search-growth/candidates.json`、10-04 生成)。承認 (`search-growth:approve`) は週 2 件の上限があるため人が行う。ページごとの案は次のとおり (1 ページずつ変え、変えた日を記録する)。
  | ページ | 主な検索語 (28 日・表示) | 案 | 判断 |
  |---|---|---|---|
  | `/blog/roadside-station-count-prefecture-gap` | 道の駅多い県 706・道の駅が多い県 434・道の駅が多い都道府県 336 (順位 8〜9・CTR 0.1〜0.6%) | 「道の駅が多い県ランキング｜1位北海道128駅・最下位東京1駅 47都道府県【2026年】」 | 変える (最優先) |
  | `/blog/avg-height-high-school-2nd-male` | 高校2年生 平均身長 764 (順位 7.0・CTR 0.13%) | 「高校2年生男子の平均身長 都道府県ランキング｜1位新潟・福井171cm、最下位沖縄167.6cm【2023年度】」。全国平均は R2 に全国行が無いので title に書かない (47 県の単純平均は全国平均ではない) | 変える |
  | `/blog/health-life-expectancy-structure` | 健康寿命 都道府県 ランキング 2026 225 (順位 6.4) | 検索語は「2026」だがデータは 2022 年。「最新」を足し、年はデータの年のまま: 「健康寿命 都道府県ランキング【最新・2022年】男性1位静岡73.75年…」 | 変える (年を偽らない) |
  | `/survey/census` | 40代 未婚 割合 日本 国勢調査 448 ほか (順位 2.6〜5.9・クリック 0) | 調査ハブで答えられない検索語。title は変えず、ハブから `unmarried-ratio-{male,female}-40-44` のランキングへのリンクを目立たせる | title は見送る (検索意図のずれ) |
  | `/ranking/food-self-sufficiency-rate-calorie` | — | 停止条件どおり `DATA-FOOD-SELF-SUFFICIENCY-MAFF-01` の後 | 見送る |
- **停止条件**: title の一括置換をしない。食料自給率はデータの年を直す (`DATA-FOOD-SELF-SUFFICIENCY-MAFF-01`) まで title を変えない。
- **完了条件**: 7 ページそれぞれに「変えた / 見送った」と理由が記録され、変えたページの変更日が search-growth の台帳にある。
- **10-16 の追加観測・実行候補**: `data/seo/latest-report.json` の pendingPublication 8件は、参照先proposalが全件 `implementation-needed`（09-18〜10-06選定）。実装済み・公開承認済みとは扱わない。既存7ページと重なる道の駅・高校2年男子身長・公衆電話を先に照合し、重複提案をまとめて各1件の実装担当・対象・完了gateへ落とす。CTR比較は元summaryを継承した実期間で行う。残りは需要と既存作業の重複を確認して採否を決め、一括実装・一括公開しない。

- **2026-10-20 ① のランキング 2 件を git で変更 (未反映)**: オーナーの「できることから進めて」で、上の表の title 案を適用した。公開中の R2 values で数値を確認 (公衆電話 2024 年 47 県合計 96,126・1 位東京 10,717・最下位徳島 509・1975〜2024 年。出生率 2023 年 1 位沖縄 1.60・最下位東京 0.99・1980〜2023 年)、本番の両ページに推移と地図があることも確認。`data/metrics/public-phone-count.ts` を「公衆電話の数 都道府県ランキング【2024年】全国96,126個・1位東京都10,717個｜推移と地図」、`total-fertility-rate.ts` を「合計特殊出生率 都道府県ランキング【2023年】1位沖縄1.60・最下位東京0.99｜推移と地図」に変え、description も同じ切り口にした (data-configs のテスト 1,181 件 pass)。**本番反映は次の develop→main マージと `sync-snapshots` の後**。反映した日に本番 title を curl で確かめ、`search-growth:approve` で `ctr-opportunity::/ranking/public-phone-count` と `ctr-opportunity::/ranking/total-fertility-rate` に反映日を記録する (週 2 件の上限・人が承認)。**未着手**: 公衆電話ブログの title 変更は、公開済み記事を送り箱へ戻して `publish-blog.yml` を起動する本番公開なのでオーナー確認待ち。title 案の「ピーク93.5万台」は本文の数値と照合してから使う。出生率の ranking→blog リンクは、推薦が同点を記事 ID のアルファベット順で切るため明示の関係でも上がらない (`RELATED-ARTICLES-TIEBREAK-01` へ分離)。
- **2026-10-20 第 3 弾 4 本の seoTitle を R2 で変更 (オーナー承認「案のまま公開」)**: 順位のわりに CTR が低い 4 本 (W41 で CTR 0.7〜2.5%)。製造業の愛知一強「工業地帯ランキング｜中京工業地帯が77.1兆円で1位、県別では愛知58兆円 (2023)」(中京=岐阜+愛知+三重の公開値合計で確認。京浜 57.7 兆円は再現できず不使用 → `MANUFACTURING-ZONE-CHART-LINEAGE-01`)、製造業の生産性「製造業の生産性ランキング｜従業者1人当たり出荷額1位大分8,547万円、愛知は4位 (2023)」、漁業「漁獲量ランキング 都道府県｜1位北海道85万tで全国の3割、2位長崎 (2023)」(29.3%、産出額は 2016 年なので title から外した)、コンビニ「コンビニが多い都道府県ランキング｜人口10万人当たり1位北海道40.6所・最下位奈良17.1所 (2014)」(公開データの最新が 2014 年。検索語の多くは「〇〇県 コンビニ 店舗数」で、新しい店舗数の指標を入れる方が効く)。`push-article-md-r2.ts --src .local/blog-title-ctr3/out`、`sync-snapshots only=blog` run 39388515474。本番反映は次のデプロイ。効果観測は `SEO-TITLE-CTR-EFFECT-01` に足すか、improvement-triage が別行にする。
- **2026-10-20 第 2 弾 4 本の seoTitle を R2 で変更 (オーナー承認「案のまま公開」)**: 表示順の次の候補から、本文と公開データで照合して作った案を適用した (`push-article-md-r2.ts --src .local/blog-title-ctr2/out`、`sync-snapshots only=blog` run 39353998079 success、all.json で確認)。住みやすい県「住みやすい県ランキング｜1位福井79.9点・2位富山、8つの指標で47都道府県を採点」(seoTitle を新設。図のデータ不一致は `LIVABLE-COMPOSITE-CHART-DATA-01`)、自動車「自動車産業 都道府県ランキング｜輸送用機械の出荷額1位愛知17.4兆円、2位静岡の4.3倍 (2020)」(旧 title の「2026」はデータ年でなかった。出典の e-Stat 表 0003448099 の期間が 2020)、米「東北・北陸で米作りが盛んな理由｜上位10県で全国776万tの53%、1位新潟 (2019)」(R2 で上位 10 県 53.3%)、降水「降水日数が多い都道府県ランキング｜1位富山182日、年間降水量は静岡3,753mmが1位 (2024)」。カツオ (`bonito-catch-prefecture`) は title ではなく本文が 2015 年のままだったので、送り箱で止まっていた 2023 年版 (critic PASS 10-08) を記事固有の背景を作って公開した (run 39347116656)。本番反映は次のデプロイ。search-growth の承認は W44 以降の枠で行う。
- **2026-10-20 本番反映と search-growth の記録**: PR #1161 のマージ (2026-10-19T20:34Z) とデプロイ (success) の後、本番 6 ページの `<title>` が新しい案になったことを curl で確認した。search-growth で `ctr-opportunity::/ranking/public-phone-count` と `striking-distance::/ranking/total-fertility-rate` (出生率は ctr-opportunity の候補が無いのでこちら) を承認した (週 2026-W43、週 2 件の枠を使い切り)。計測日は反映日 2026-10-20 から 14 日 = 11-03、28 日 = 11-17、56 日 = 12-15 (`npm run search-growth:measure -- --candidate <ID>`)。ブログ 4 本の承認は翌週 (W44) 以降の枠で行う。**improvements.md への効果観測の登録は排他 writer の improvement-triage が 10-24 の W42 レビューで行う** (対象 6 ページ・反映日・計測日を渡す)。
- **2026-10-20 ブログ 4 本の seoTitle を R2 で変更 (オーナー承認「すべて」)**: 本文の数値と公開データで照合してから、`seoTitle` の 1 行だけを書き換えた (本文は不変を差分で確認)。`push-article-md-r2.ts --src .local/blog-title-ctr/out` で R2 の article.md を上書きし、`sync-snapshots only=blog` (run 39307859673 success) で `app/blog/all.json` に反映した。公衆電話「公衆電話はなぜ減った? ピーク93.5万台→9.6万台、都市に残り地方で消える理由｜47都道府県2024」(R2 観測値で 1984 年 935,000・2024 年 96,126)、道の駅「道の駅が多い県ランキング｜1位北海道128か所・最下位東京1か所 47都道府県【2026年】」、身長「高校2年生男子の平均身長 都道府県ランキング｜1位新潟・福井171cm、最下位沖縄167.6cm【2023年度】」、健康寿命「健康寿命 都道府県ランキング【最新・2022年】男性1位静岡73.75年・最下位岩手70.93年」(厚生労働省が 2022 年値を 2024-12-24 に公表、時事通信で確認)。ブログは SSG なので**本番の title は PR #1161 のマージ後のデプロイで変わる**。反映日に本番の `<title>` を確かめ、ランキング 2 件と合わせて変更日を記録し、28 日後に同じ窓で CTR を比べる。search-growth の承認は週 2 件までなので、ランキング 2 件を先に記録し、ブログ 4 本は次週以降に記録する。
- **2026-10-19 オーナー判断 (優先度の引き上げ)**: アフィリエイトの新規展開を保留し (`MONETIZE-BROAD-ROLLOUT-01`)、このカードを 10-21 からの出張中に進めるリモート作業の先頭にする。実行順: ① 公衆電話・出生率の title 案 (上の表) のオーナー確認 → 3 ページを変える ② 道の駅・高校 2 年男子身長・健康寿命の 3 ページを 1 ページずつ変える ③ 197 本を表示の多い順に `/search-growth` へ渡す (週 2 件の承認上限を守り、一括変更はしない)。title の変更は git の定義 (metric の seoTitle・記事 frontmatter) を直すだけなので、デプロイが要るものはまとめて 1 回にする。
- **2026-10-19 確認 (W43 Could 2)**: ① (食い合いの確認) は 10-08 に済んでいた。「10,717.00個」の修正は main に入り (`origin/main` の config は `decimalPlaces: 0`)、本番 `/ranking/public-phone-count` の HTML は「10,717.00」0 件・「10,717個」27 か所で定着した。**残りは役割分けの title 案 (上の表) のオーナー確認**。承認後に公衆電話の ranking (metric の seoTitle・seoDescription)・blog (記事 frontmatter と ranking へのリンク)、出生率の ranking (seoTitle と blog へのリンク) を変え、変えた日を記録して 4 週後に同じ 28 日窓で CTR を比べる。
### [RELATED-ARTICLES-TIEBREAK-01] ランキングの関連記事が同点のとき記事 ID のアルファベット順で選ばれ、その指標を主題にした記事が押し出される
タグ: [UI・UX] [種類:不具合] [実行:対話] [起票:2026-10-20] [領域:サイト]

- **事象 (2026-10-20 実測)**: `/ranking/total-fertility-rate` の関連記事 3 本は `abortion-rate-prefecture-gap`・`cc-estat-07-birthrate-line`・`childcare-friendly-prefecture-ranking` で、出生率そのものを扱う `fertility-rate-prefecture-gap` (「出生率 ランキング」で順位 1〜1.5) と `total-fertility-rate` が出ない。この指標を `rankingKeys` に持つ公開記事は 13 本。
- **原因**: `packages/data-configs/src/content/navigation.ts` の推薦は、ランキングから見た記事をすべて `explains` (priority 100) + 一致 key 数 (この場合はどれも 1) で採点し、同点を `a.id.localeCompare(b.id)` で切る。ランキング側に tagIds が無いのでタグでも差がつかない。`data/content/navigation.json` の `links` に明示の関係を足しても同じ 101 点になり、順位は上がらない。
- **影響範囲 (未計測)**: `rankingKeys` が同じ公開記事を 4 本以上持つランキングすべて。件数は `data/content/pages/blog.json` の rankingKeys を数えて出す。
- **次**: ① 影響するランキングの数と、そのページの GSC 表示を出す ② 同点の切り方を決める (候補: 編集者が `navigation.json` の `links` で明示した関係に加点する、記事の `rankingKeys` の先頭 = 主題の指標なら加点する)。モデルの推測で記事の主題を決めない ③ `navigation.test.ts` に「主題の記事が上位に来る」テストを足す。
- **2026-10-20 実装 (未デプロイ)**: 影響は全 2,460 ランキングのうち、指標を共有する公開記事が 4 本以上ある 194 ページ (GSC 2026-W41 の表示 36,671)。同点を「一致数 ÷ 記事が使う指標数」(その指標にどれだけ絞った記事か) の高い順で切り、それでも同じなら ID 順にした (`navigation.ts`、テスト `navigation.test.ts` に 1 件追加・戻すと落ちることを確認、data-configs 1,182 件 pass)。全公開ページ 26,172 件 (元ページ × blog/ranking/theme) の上位 3 本を変更前後で比べ、変わったのは 1,416 件 (ranking→blog 284・blog→blog 294・area-theme→blog 752 ほか)。例: 納豆は福島・茨城の食文化記事 → 納豆の東西差・マヨネーズ・納豆と体重の相関、マグロは愛知・青森・千葉の食文化記事 → マグロの記事 3 本。area-theme の変化の大半は同じ記事の並び替えで、県ページ (area) は元から 47 県で同じ推薦だった。**未達**: 出生率のランキングには `total-fertility-rate` の記事が入ったが、`fertility-rate-prefecture-gap` (指標 2 つ) は指標 1 つの `cc-estat-07-birthrate-line` (Claude Code の連載) に負けて入らない。直すなら、編集者が `data/content/navigation.json` の `links` で明示した関係に加点する案を次に検討する。本番反映は次のデプロイ (他の変更とまとめて 1 回)。
- **停止条件**: 全ランキングの推薦が変わるので、変更前後の上位 3 本の差分を全件出してから本番に出す。デプロイは他の変更とまとめて 1 回。
- **完了条件**: `/ranking/total-fertility-rate` の関連記事に `fertility-rate-prefecture-gap` が入り、差分一覧で意図しない入れ替わりが無いことを確かめた。


### [REMOVE-WORKTREE-TEST-MAC-PATH-01] worktree 削除のテストが Mac で落ちる (/var と /private/var の表記ずれ)
タグ: [エージェント・SSOT] [種類:不具合] [実行:sweep] [検証:node --test .claude/scripts/lib/__tests__/remove-worktree.test.mjs] [起票:2026-10-20] [領域:管理]

- **2026-10-21 完了 (行削除は backlog-loop)**: 登録の照合だけを `fs.realpathSync` で正規化したパスで行う (`canonical`・`isRegistered`)。削除対象・リンク検査は正規化前のパスのままなので、worktree を指す symlink は従来どおり止まる。Mac で `remove-worktree.test.mjs` 5/5 (修正前は正常系が落ちていた)。Linux (CI) は realpath が同じ値を返すので挙動不変。

- **事象 (2026-10-20 Mac 実測)**: `remove-worktree.test.mjs` の「登録済み worktree を丸ごと削除する (正常系)」が `... は登録済み worktree ではない (known: /private/var/folders/...)` で落ちる。変更を退避した状態でも再現するので既存の不具合。
- **原因 (仮説)**: macOS の一時ディレクトリは `/var` が `/private/var` への symlink で、テストが渡すパス (`/var/...`) と `git worktree list` が返すパス (`/private/var/...`) を文字列のまま比べている。検証: 比較の前に両方を `fs.realpathSync` で正規化して再実行する。
- **完了条件**: Mac と Linux (CI) でこのテストが pass する。正規化は比較だけに使い、削除対象のパスの決め方は変えない。


### [LIVABLE-COMPOSITE-CHART-DATA-01] 住みやすい県ランキングの総合スコアの図に、1 人当たり県民所得のデータが紐づいている
タグ: [コンテンツ品質] [種類:不具合] [実行:対話] [起票:2026-10-20] [領域:サイト]

- **事象 (2026-10-20 実測)**: `/blog/livable-prefecture-composite-ranking` (GSC 2026-W41 で 8,214 表示・順位 6.7) の図 `data/composite-ranking` は、本文では 8 指標の総合スコア (1 位福井 79.9 点・2 位富山 78.0 点) を示すのに、R2 の `composite-ranking.json` と `.source.json` は `per-capita-kenmin-shotoku-h27` (1 人当たり県民所得 2020 年、1 位東京 5,214 千円) を指している。図の中身が本文と違うか、系譜の後付け (backfill) で取り違えた可能性がある。
- **次**: ① 公開中の `composite-ranking.svg` の表示値を見て、図そのものが所得なのか総合スコアなのかを確かめる ② 総合スコアなら、本文の採点方法 (8 指標のパーセンタイル平均) から `kind: calculated` の source.json と data json を作り直す。所得なら図を総合スコアに作り直す。値は本文の採点表と一致させる。
- **完了条件**: 図・data json・source.json・本文の 1 位〜3 位が一致し、`quality-gate.mjs` が pass。title 変更 (`SEO-CTR-CANDIDATES-01` の候補) とは別に直す。


### [EFFECT-GSC-PAGE-PREFIX-MATCH-01] 効果判定の `[gsc-page:]` が前方一致で、別のページの実績が混ざる
タグ: [インフラ・計測] [種類:不具合] [実行:対話] [起票:2026-10-20] [領域:管理]

- **2026-10-21 完了 (行削除は backlog-loop)**: `[gsc-page:]` の照合を完全一致にし (`pageMatches`)、`/` で終わる目印だけ配下を前方一致で含める。active の目印 10 件はすべてページのパスで `/` 終わりは 0 件なので、意味は狭まるだけ。テストの fixture は前方一致の誤りを期待値に含めていた (`local-finance-other` の 5 click) ので正しい値に直し、`-vs-` の兄弟ページが混ざらないテストを足した。improvement-triage.md の記法説明も更新。metrics テスト 174/174。

- **事象 (2026-10-20、improvement-triage の報告)**: `SEO-TITLE-CTR-EFFECT-01` の対象 `/blog/avg-height-high-school-2nd-male` に、`/blog/avg-height-high-school-2nd-male-vs-*` の実績 (W41 で 8 click / 601 imp、対象全体の約 1%) が混ざる。
- **次**: `[gsc-page:]` を読む `.claude/scripts/metrics/lib/gsc-improvements-adapter.mjs` (と `measurement-cycle.mjs`) の照合を完全一致にするか、完全一致の記法を足す。既存の行で前方一致を前提にしているものが無いかを先に数える。
- **完了条件**: 完全一致で照合できるようになり、`.claude/scripts/metrics/__tests__/gsc-improvements-adapter.test.mjs` に前方一致で混ざらないことのテストがある。


### [MANUFACTURING-ZONE-CHART-LINEAGE-01] 製造業の記事の工業地帯の図に元データが無く、京浜工業地帯の 57.7 兆円が公開値から再現できない
タグ: [コンテンツ品質] [種類:不具合] [実行:対話] [起票:2026-10-20] [領域:サイト]

- **事象 (2026-10-20 実測)**: `/blog/manufacturing-aichi-dominance` の図 `data/industrial-zone-ranking` は、R2 に `.json` が無く (404)、`.source.json` は `derived r2:app/ranking/manufacturing-shipment-amount/values.json` だけで工業地帯の範囲を持たない。本文の「中京工業地帯 (岐阜・愛知・三重) 77.1 兆円」は公開値 2023 年の合計と一致するが、「京浜工業地帯 57.7 兆円」は東京+神奈川 27 兆円・+埼玉 42 兆円のどちらとも合わない。検索語「工業地帯 ランキング」(28 日 161 表示) で入る記事。
- **次**: ① 各工業地帯・工業地域の範囲 (どの都府県を含めるか) を出典つきで決め、`kind: calculated` の source.json (inputs と formula) と data json を作る ② 京浜の値を本文と図で直す ③ 他の工業地帯の値も同じ式で照合する。
- **完了条件**: 図・data json・source.json・本文の値が公開値の合計と一致し、`quality-gate.mjs` が pass。


### [CONTENT-FOOD-TRIVIA-01] 検索クリックの 31% を占める食の消費量の雑学で、需要がありまだ無い品目のランキング・ブログを足す
タグ: [コンテンツ品質] [種類:制作] [実行:対話] [起票:2026-10-07] [領域:サイト]

- **前提 (実測)**: W40 の 28 日でクエリが分かるクリック 2,688 件のうち、食べ物の消費量・特産が 31% (うどん・納豆・昆布・里芋・マグロ・うなぎ・カツオ・米など)。この面の楽天の商品カードはクリック率がサイト平均より高い (母数不足)。
- **① の結果 (2026-10-07)**: W37〜W40 のクエリから品目を抜き出し (表示 20 以上・上位 40 品目)、公開中の metric と突き合わせた。**40 品目すべてに公開中のランキングがあった** (日本酒は「清酒」、寿司は「すし」、ラーメンは「中華そば」、お茶は「緑茶」の名前で存在)。足りないのはページではない。**同じ品目に複数のページがあり、表示が割れている**。W40 の 28 日で、カツオはブログ `/blog/bonito-catch-prefecture` が表示 5,880・CTR 1.7% を受け、ランキングは購入数量 699・かつお節 573・漁獲 214・支出額 24 に分かれる。うどんは外食の「そば・うどん」731・生うどん数量 524・干しうどん数量 176・干しうどん支出額 7 と、ブログ 3 本に分かれる。綴り違いの `/blog/bonito-catch-perfecture` や、ランキングの key と同じ名前のブログ URL (`/blog/fresh-udon-soba-consumption-quantity` など) にも表示が出ている。ブログからのリンクは、うどんのブログ→干しうどん支出額 0 本 (生うどん数量・外食へはある)、カツオのブログ→カツオ支出額 0 本、ぎょうざは双方向にある。ぎょうざは metric の key が `gyoza-frozen` で title が「ぎょうざ消費支出額」と、冷凍か惣菜かが名前から読めない。
- **次 (方針を変更)**: 新しいページを足すより、② 品目ごとに「入口にするページ」を 1 つ決め (表示とクリックが最も多いもの)、他のページからそこへリンクを集め、title の切り口を分ける ③ 綴り違い・旧 URL のブログが表示を受けていれば、301 か canonical で入口へまとめる (`apps/web/src/config/blog-redirects.ts`) ④ 需要上位品目のランキングの title・description を、定義を崩さない範囲で検索語に寄せる (例: 清酒のランキングに「日本酒」を併記) ⑤ ぎょうざの metric が家計調査のどの品目 (冷凍調理食品か、調理食品の「ぎょうざ」か) かを e-Stat の分類で確かめ、表示名を直す ⑥ 2025 年報の取り込みは `KAKEI-EXPANSION-02`。新しい品目のランキング・ブログは、需要があってページが無い品目が見つかったときだけ作る。
- **②⑤ の結果 (2026-10-08・Mac で GSC 28 日 09-08〜10-05)**:
  | 品目 | 入口にするページ (表示/クリック) | 同じ品目の他のページ | 足りないリンク (本番 HTML で確認) |
  |---|---|---|---|
  | うどん | `/ranking/soba-udon-dining-consumption-expenditure` (728/39) | ranking 生うどん数量 (571/33)・干しうどん数量 (239/5)、blog 生うどん (359/6)・そば外食 (102/2)・食文化地図 (73/2) | 入口 → 生うどん数量・干しうどん数量のランキング / 生うどん数量のランキング → 入口と blog (今は支出額のランキングだけ) / 食文化地図 → 入口 |
  | カツオ | `/blog/bonito-catch-prefecture` (5,453/91) | ranking かつお購入数量 (626/38)・漁獲 (231/2)・支出額 (22/1) | 入口 → かつお購入数量のランキング / かつお購入数量のランキング → 入口 (今は支出額と漁獲のランキングだけ) |
  | かつお節 | `/ranking/katsuobushi-consumption-quantity` (558/36) | blog `katsuobushi-expenditure-ranking` (159/4)、ranking 支出額 (39/1) | ランキング → blog |
  | ぎょうざ | `/blog/frozen-gyoza-spending-prefecture-gap` (1,305/19) | ranking `gyoza-frozen-consumption-expenditure` (17/1) | 双方向にある。足さない |
  - リンクの作られ方: ranking の「関連記事」は、その指標を図に使う記事 (blog snapshot の `rankingRefs`) と相関記事から自動で出る (`RelatedArticlesCard.tsx`)。blog → ranking は記事本文のリンクと図の出典カード。どちらも**記事の書き換えと公開**で足す (contents/blog の送り箱 → publish-blog。本番反映なのでオーナー承認)。カツオの入口記事は漁獲の記事なので、購入数量のランキングとは本文中の「食べる側」の一文とリンクでつなぐ (図に入れて rankingRefs にしない。主題が変わるため)。
  - **ぎょうざの品目 (⑤)**: `gyoza-frozen-consumption-expenditure` の `cdCat01: 010920070` は、e-Stat の表 0003348239 の分類で「371 ぎょうざ」。「1.9.2 他の調理食品」の下にあり、「370 冷凍調理食品」(`010920100`) とは別の品目である (`data/estat/meta/0003348239.json`)。key と blog の slug の「冷凍」は分類と合わない。ところが blog 本文は「ぎょうざ」に冷凍餃子が含まれると 7 か所で書いている。**確認済み (2026-10-08)**: 総務省 統計局「家計調査 収支項目分類及びその内容例示」2020年改定版 (`https://www.stat.go.jp/data/kakei/kou2020/zuhyou/kouh2020.xlsx`、シート「2消費支出」) で、371 ぎょうざの例示は「生も含む」、除外の欄が「× ぎょうざの冷凍品→370」。370 冷凍調理食品の例示に「冷凍食品（コロッケ かば焼き ぎょうざ しゅうまい…）」がある。**冷凍ぎょうざはこの指標に入らない**。blog の「冷凍餃子・持ち帰りの支出を数える」(7 か所) は誤り。次: blog の 7 か所を「持ち帰りの生・焼きぎょうざ (冷凍品は別品目の冷凍調理食品)」に直して公開し (承認)、metric の `subtitle` に「冷凍品を除く」を足す。key `gyoza-frozen-consumption-expenditure` と slug `frozen-gyoza-spending-prefecture-gap` は URL なので変えない (変えるなら 301 を同時に入れる)。 → metric の subtitle・note は 2026-10-08 に直した (`62a5fe9e1`。本番反映は develop→main のマージと sync-snapshots の後)。同じコミットで収支項目分類の正本 `data/estat/kakei-classification/` と CI 検査を足した。blog 本文 7 か所とランキングの AI 解説の冷凍の記述は未修正。
- **停止条件**: 需要の証拠 (検索表示) が無い品目は作らない。47 都道府県分の薄い記事を一括で作らない。家計調査は県庁所在市の世帯の値であり県全体ではないことを表題と本文で崩さない。
- **完了条件**: 品目の突き合わせ表が残り、追加したページそれぞれの 4 週後の検索表示とクリックが記録されている。

### [RANKING-MAKING-OF-LINK-01] 閲覧の多い雑学ランキングに「このランキングの作り方」の 1 行を置き、ノウハウ記事への導線を測る
タグ: [収益化] [種類:改善] [実行:対話] [起票:2026-10-07] [領域:商品]

- **経緯**: `KNOWHOW-PRODUCT-PILOT-01` の「雑学の読者から拾う導線」案 (a)。「年収1000万円」のような事実でない収益の主張の代わりに、作り方への興味という事実に基づく入口を試す。
- **次**: ① 閲覧上位の雑学ランキング 3〜5 ページを選ぶ (例: うどん・納豆の消費量) ② ページ末尾に無料の Claude Code 連載 (`/blog/cc-estat-01-setup`) への 1 行を置き、`nav_click` の `nav_surface` に値を 1 つ足して計測する (`analytics-event-standards.md` の手順) ③ 4 週のクリック数と、連載から note の有料ノウハウへの遷移を記録する。
- **停止条件**: 広告のように見せない (PR 表記の要らない、サイト自身の記事への 1 行に留める)。全ランキングに一括で出さない。
- **完了条件**: 4 週の導線クリック数が記録され、続ける・広げる・やめるの判断が `KNOWHOW-PRODUCT-PILOT-01` に書かれている。

- **2026-10-19 ①② 実装 (未デプロイ)**: GSC 2026-W41 の 28 日クリック上位の食の雑学 5 件 (納豆支出 143・米数量 107・カップ麺支出 89・アイスクリーム支出 69・緑茶数量 67 クリック) の出典の欄の下に、`/blog/cc-estat-01-setup` (本番 200) への 1 行を置いた (`RankingMakingOfLink.tsx`、対象は `RANKING_MAKING_OF_KEYS`)。クリックは共通の監視が `nav_surface=ranking_making_of` で数える (台帳 `analytics-event-standards.md` に値追加を記録)。PR 表記の要らないサイト自身の記事への 1 行で、広告のように見せない。テスト 3 件・関連 70 件 pass・型 0 件、localhost で対象ページだけに出ることを確認。**次**: まとめての本番デプロイのあと 4 週のクリック数を記録する (③)。
### [BLOG-DUPLICATE-AUDIT-01] 同じ主題・同じ数値のブログが 2 本ずつ公開されている組を洗い出し、1 本にまとめる
タグ: [コンテンツ品質] [種類:不具合] [実行:対話] [起票:2026-10-07] [領域:サイト]

- **GSC案16 / P3（条件確認後）**: 新たな統合対象は同じ問い・情報・役割の重複を本文とpage×queryで確認してから採用する。用途の違うrankingとblogは役割分担を先に試す。既存で採択済みの統合はこのカードの順序を維持する。
- **事象 (2026-10-07 に本番を curl で確認)**: 次の組がどちらも index 対象 (`robots: index, follow`)・canonical は自分自身で、表題の主題と数値が同じ。`/blog/fresh-udon-soba-consumption-quantity` (生うどん・そば消費量1位は香川16,788g…) と `/blog/fresh-udon-soba-consumption-prefecture-gap` (生うどん・そば消費量ランキング2024｜1位香川16,788g…)、`/blog/soba-udon-dining-consumption-expenditure` (そば・うどん外食費1位は香川16,156円…) と `/blog/soba-udon-dining-consumption-expenditure-prefecture-gap`。`/blog/school-teacher-annual-income` と `/blog/school-teacher-annual-income-prefecture-gap` も同じ (どちらも「1位愛知 885.9万円」)。確認できた重複は 3 組。同じ検索語で表示とクリックを分け合っている (`CONTENT-FOOD-TRIVIA-01` の「表示が割れている」の一因)。
- **次**: ① R2 の `app/blog/all.json` で、表題と主指標 (rankingRefs の先頭) が同じで公開日の違う組を全件出す (主指標だけだと県別の食文化シリーズのような別の切り口も拾うので、表題の一致も条件にする) ② 組ごとに GSC の表示・クリックが多い方を残し、もう一方を 301 (`apps/web/src/config/blog-redirects.ts`) でまとめる ③ 残す記事に消す記事の固有の内容があれば移す。
- **2026-10-08 結果 (Mac・GSC 28 日 09-08〜10-05)**: 3 組の残す側と、統合元にしか無い節 (R2 `app/blog/<slug>/article.md` の見出しで比較)。
  | 組 | 残す (表示/クリック) | 301 で統合 (表示/クリック) | 統合元にしか無い節 (移す) |
  |---|---|---|---|
  | 生うどん | `fresh-udon-soba-consumption-prefecture-gap` (359/6) | `fresh-udon-soba-consumption-quantity` (7/0) | 九州・沖縄はなぜ少ない / うどん圏とそば圏が上位で交差する |
  | そば外食 | `soba-udon-dining-consumption-expenditure-prefecture-gap` (102/2) | `soba-udon-dining-consumption-expenditure` (2/0) | 沖縄最下位とソーキそば / 新潟・長野が低い理由 / 関東の健闘 (埼玉4位・東京15位) |
  | 教員年収 | `school-teacher-annual-income` (133/2) | `school-teacher-annual-income-prefecture-gap` (0/0。08-31 公開) | 同じ県でも年が変わると順位が大きく動く / データについて |
  | 出生率 (`SEO-CTR-CANDIDATES-01` で発見) | `fertility-rate-prefecture-gap` (1,374/3) | `total-fertility-rate` (49/0) | 未比較 |
- **実行順 (案・未適用)**: ① 残す記事へ上の節を移し、contents/blog の送り箱から公開する (blog の品質ゲートと critic を通す。公開は本番反映なのでオーナー承認) ② 公開を確かめてから `apps/web/src/config/blog-redirects.ts` に `"<統合元>": "<残す>"` を足す (middleware の 301 と sitemap の除外はこの表だけで効く) ③ 統合元を R2 の `app/blog/all.json` で非公開にする (このままだと一覧と関連記事に 301 先へのリンクが残る。R2 書き込みなので承認) ④ 本番で 1 組ずつ `curl -sI https://stats47.jp/blog/<統合元>` が 301 と残す URL を返すことを確かめる。②を①より先に出すと移す前の本文が見えなくなるので、順を入れ替えない。
- **2026-10-08 実施**: 生うどん・そば外食の 2 組は残す記事へ固有の節を移し、critic を通して公開し、`blog-redirects.ts` に 301 を入れた (公開と 301 の本番反映は同日の develop push と develop→main のマージ)。`export-blog-snapshot.ts` が 301 の slug を `app/blog/all.json` から除くようにした (それまでは 410 だけを除いており、一覧に統合元が残った)。
- **食文化マップと生うどん記事の重なり (2026-10-08、blog-critic が報告)**: `udon-soba-food-culture-prefecture-map` は上の表で「切り口が違うので残す候補」としたが、書き換え後は「下位5県の構造」の論証が `fresh-udon-soba-consumption-prefecture-gap` とほぼ同じになった。GSC の表示 (28 日で map 73・fresh 359) を見て、map を 301 でまとめるか、map を地図と外食との対比に絞って差別化するかを決める。
- **教員年収の組は保留**: 残す `school-teacher-annual-income` は critic で REVISE (BLOCK 2)。タイトルと前半が「公立教員は国基準」を前提にしているが、指標 (賃金構造基本統計調査 0003445758) は公立に限らない小中学校教員の標本平均で前提が成り立たない。また 2022 年千葉と 2023 年愛知がともに 885.89 万円で小数第 2 位まで同じ、2021 年石川が 245.16 万円と、取り込みの誤りの疑いがある。次: e-Stat 0003445758 の元表と R2 `app/stats/school-teacher-annual-income/values.json` を照合し、誤りなら再取り込みしてから記事のタイトルごと書き直す (タイトルを変えるとサムネイル背景を Codex で作り直す必要がある)。統合元の節を移した版はローカルブランチ `wip/blog-teacher-merge` にある (未 push)。critic の指摘も同ブランチの送り箱 (school-teacher-annual-income の review.md) に入れてある。
  - **2026-10-08 照合結果 (取り込みの誤りではない)**: e-Stat API で 0003445758 (cdCat01=01・cdCat02=1192) を取り直して年収を再計算し、R2 の値がある 169 件すべてと一致した。885.89 万円は偶然の一致 (千葉 2022 = 454.6 千円 ×12 + 3,403.7、愛知 2023 = 516.1 ×12 + 2,665.7、どちらも 8,858.9 千円)。石川 2021 は推計労働者 40 人・賞与 0.0 の公表値。照合データと手順はセッションの scratchpad にだけあり、要点は `DATA-WAGE-TEACHER-COVERAGE-01` に写した。
  - **書き直し中 (2026-10-08)**: 送り箱は同日 `contents/blog/` へ移ったので、`contents/blog/school-teacher-annual-income/` (未コミット) で article-writer が書き直し、次に blog-critic を通す。タイトルが変わるので背景は Codex CLI (`npm run blog-images:codex`) で作り直す。公開・301・統合元の非公開化はオーナー承認後。
  - **2026-10-08 進捗**: 書き直し版は blog-critic の delta 再審査で PASS (BLOCK 0・MAJOR 1・MINOR 7。MAJOR は表現を弱めて対応済み、MINOR は追加の改稿中)。新タイトル「教員年収の首位が毎年変わるのはなぜ?」。背景は既存の記事固有背景で quality-gate が通ったので作り直し不要。`blog-redirects.ts` に `school-teacher-annual-income-prefecture-gap` → `school-teacher-annual-income` を足し、`sitemap-blog-entries.ts` を再生成済み (どちらも未コミット、ローカルの 301 は確認済み)。2026-10-09 オーナー承認で公開: develop `90c2f8858` → blog-auto-publish run 37833570933 success (R2 の article.md と all.json に新タイトル、統合元は all.json から除外を確認)。**2026-10-09 完了**: PR #1112 (main `93bb41dfb`) のデプロイ成功後、本番で `/blog/school-teacher-annual-income-prefecture-gap` が 301 で `/blog/school-teacher-annual-income` を返し、残す記事が新タイトル・新本文 (約5% と平均年齢の節あり、旧前提 0 件) であることを確認。統合で消えた 3 タグに合わせて known-tag-keys とタグ索引も作り直した。`wip/blog-teacher-merge` は削除済み。これで教員年収の組は完了。
- **他の重複候補 (2026-10-08・all.json 609 本の title と seoTitle に同じ数値が 2 つ以上ある組)**: 機械照合で 22 組。そば外食と教員年収の組は表題の数値の丸めが違い拾えなかったので、この方式は取りこぼす。本文を読んでいないので、まとめる判断は組ごとに本文を見てから行う。
  | 判断の候補 | 組 (GSC 28 日 表示/クリック) |
  |---|---|
  | まとめる候補 (同じ指標の単独ランキングに見える) | 牛肉 `beef-consumption-quantity` (493/10) と `beef-consumption-prefecture-gap` (315/13。表示とクリックで多い方が割れる) / 乳用牛 `dairy-cattle-count` (146/1) と `dairy-cattle-hokkaido-monopoly` (86/2) / テレワーク `engineer-telework-prefecture` (83/2) と `telework-gap-tokyo-6x` (0)・`telework-rate-tokyo-gap` (0) / 病床利用率 `hospital-bed-utilization-map` (217/4) と `general-hospital-bed-occupancy-rate` (2/0) / 納豆 `natto-consumption-expenditure` (54/2) と `natto-consumption-east-west-divide` (53/3) / ソフトウェア技術者 `software-engineer-salary-prefecture-gap` (155/3) と `software-engineer-income-gap` (7/0) / 小麦粉 `wheat-flour-consumption-prefecture` (791/55) と `wheat-flour-consumption-food-culture-gap` (251/3) / 空き家と地価 (表題が完全一致) `vacant-housing-rate-vs-standard-price-change-rate-commercial` (15/0) と `vacant-housing-vs-land-price` (1/0) / 県民所得 `prefectural-income-gdp-ranking` (2,257/46) と `per-capita-income-gap` (298/8。GDP と 1 人当たりで指標が違う可能性) |
  | 切り口が違うので残す候補 (相関・閾値・地図) | `fertility-fiscal-nexus` / `udon-soba-food-culture-prefecture-map` / `inpatient-rate-aging-burden` / `minimum-wage-1000yen-prefecture` と `minimum-wage-increase-rate-prefecture-gap` / `tuna-consumption-medical-expense-correlation` / `vacant-housing-aging-correlation` / `black-tea-income-gap` |
- **停止条件**: 主題が同じでも切り口が違う記事 (相関・地域別・県別シリーズ) はまとめない。301 は 1 組ずつ本番で確かめる。
- **完了条件**: 重複の組の一覧と、それぞれの処置 (301・残す理由) が記録され、301 が本番で効いている。

### [SNS-REFERRAL-MEASURE-01] X・Instagram・Threads からサイトへの送客を流入元別に毎月測り、SNS 領域の構えを判断する材料にする
タグ: [SNS・マーケ] [種類:改善] [実行:対話] [起票:2026-10-07] [領域:SNS]

- **前提 (実測)**: GA4 の Organic Social は 28 日 (09-06〜10-03) で 98 セッション・248 PV (サイト全体 43,907 PV の 0.6%)。1 投稿の中央値は X の表示 70、Instagram のリーチ 45。流入元別 (x.com・t.co・instagram・threads) の内訳はスナップショットに無い。
- **次**: ① 週次の GA4 取得に `sessionSource` 別の Organic Social と Referral (note.com を含む) を足し、`data/ga4/snapshots/<週>/` に保存する ② 月次レビューで、媒体ごとの送客セッションと投稿数を並べる ③ 2 か月分がそろったら、SNS 領域を「維持」のままにするか、送客の多い媒体だけ投稿を増やすかを決める。
- **停止条件**: 送客が測れないうちに投稿を増やさない。インプレッションやいいねを送客の代わりにしない。
- **完了条件**: 媒体別の送客が 2 か月分記録され、SNS 領域の構えの判断が収益化戦略 §5 の領域表に反映されている。

- **2026-10-19 ① 実装**: 週次の GA4 取得 (`fetch-ga4-snapshot.mjs`) のレポート一覧 `MEASUREMENT_REPORTS` (`.claude/scripts/metrics/lib/journey-ga4-reports.mjs`) に `referral-sources` を足した。日本の Organic Social と Referral に絞り、流入元 (`sessionSource`)・メディア・チャネル別にセッション・エンゲージドセッション・PV を取る。保存先は `data/ga4/snapshots/<週>/referral-sources.csv` (rolling28d)。テスト `journey-ga4-reports.test.mjs` に 1 件追加。最初の実データは 10-23 (金) の週次 CI。② 以降 (月次レビューで媒体ごとに並べる) はデータが 2 か月分そろってから。
### [PV-PLAN-REVIEW-2026Q4-01] 2026-12-31 に PV の実績を里程標と比べ、AdSense 月¥1万への重点を見直す
タグ: [インフラ・計測] [種類:改善] [実行:対話] [起票:2026-10-07] [期日:2026-12-31] [領域:サイト]

- **前提**: 月額 = GA4 Japan PV × 広告収益効率。効率 ¥22 (停止前・自動広告あり) なら月¥1万に月約 45 万 PV、手動枠だけ (¥6.7) なら約 150 万 PV (マーケティング戦略「広告収益との換算」)。KPI は `site-pageviews` (W40: 28 日 43,907・目標 2026-W52 に 79,000) と `ad-yield` (AdSense 承認後に接続)。
- **[仮説]** 検索クリックが週 +815 で線形に伸び、PV/検索クリック 3.98 が保たれれば、2026-W52 に 28 日 79,000 PV。
- **判定 (2026-12-31)**: `data/measurement-cycle/LATEST.md` の KPI ツリーで `site-pageviews` を 79,000 と比べる。未達なら、回遊 (PV/検索クリック) と CTR (`GSC-CTR-DECOMPOSE-01`) のどちらが下回ったかを分け、1〜2 月の月次の重点候補にする。上回れば T2 (月 10 万) の時期を前倒しする。`ad-yield` が取れていれば、自動広告を使うかの判断 (`ADSENSE-RESTART-01`) の結果を入れて月¥1万に要る PV を計算し直す。
- **完了条件**: 判定の結果 (実績・差・次の重点候補) をマーケティング戦略の里程標表と 2027-01 の月次計画に書いた。

### [NOTE-FREE-DEFAULT-01] note の雑学・ランキングの有料記事を無料に戻し、送客の変化を前後で測る
タグ: [収益化] [種類:改善] [実行:ユーザー] [起票:2026-10-07] [領域:商品]

- **決定 (2026-10-07 オーナー)**: note は無料が基本で、有料はノウハウ商品だけにする (収益化戦略 §3.3・§3.5、`docs/30_note記事企画/note戦略.md`)。メンバーシップは作らない (計画文書と下書きは同日に削除)。
- **前提 (実測)**: ランキング型 (A シリーズ) の有料記事 47 本は通算 (〜2026-09-11) 閲覧 4,842・売上 ¥0。note 全体の直近 28 日 (09-07〜10-04) は閲覧 7,048・売上 ¥0 (`data/note/dashboard/`)。有料の壁は売上を生まず、本文の読了と stats47 への送客だけを減らしている可能性がある。
- **次 (実行順)**: ① 無料化の前の基準値を記録する: 対象 47 本の 28 日の閲覧と、GA4 の `sessionSource = note.com` の 28 日のセッションと着地ページ ② 閲覧の多い順に少数ずつ無料に戻す (note へのログインは人手。カタログ `.claude/scripts/note/catalog/` の有料・無料も同じ差分で直す) ③ 4 週後に同じ指標を取り、無料にした記事の閲覧と送客を、まだ有料の記事と比べる ④ D シリーズの有料データセット記事 5 本 (通算売上 ¥0) は、§3.4 の行政資料 pilot の販売面として残すか無料にするかを、同じ観測のあとに決める。
- **基準値 (2026-10-07 記録・無料化の前)**: 対象 47 本の閲覧は直近 28 日 (09-07〜10-04) で計 804 (`data/note/dashboard/latest.json`、A シリーズの有料記事)。GA4 の外部サイト流入 (Referral。note.com を含む) は 28 日 (09-06〜10-03) で 602 セッション・1,698 PV (`data/ga4/snapshots/2026-W40/channels.csv`)。note.com だけの値は GA4 の流入元の内訳が要り、クラウドでは取れない (最後の記録は 08-09〜09-05 の 502 セッション)。無料化の前に Mac か CI で `sessionSource = note.com` の 28 日を 1 回取ってここに足す。
- **基準値の追加 (2026-10-08・Mac で GA4)**: `sessionSource = note.com` は 28 日 (09-10〜10-07) で 380 セッション・1,140 PV・エンゲージ 284。着地ページの上位は `/ranking/annual-sunshine-duration` 82、`/` 37、`/ranking/real-public-debt-service-ratio` 24、`(not set)` 22、`/ranking/annual-clear-days` 19、`/ranking/annual-cloudy-days` 14、`/ranking/owner-occupied-housing-ratio` 12 (着地ページは 85 種)。再現: `node .claude/scripts/metrics/ga4-query.mjs --start 2026-09-10 --end 2026-10-07 --dims landingPage --metrics sessions,engagedSessions --filter 'sessionSource==note.com' --limit 100`。
- **第 1 陣 (2026-10-08 選定・note.com への反映はオーナー待ち)**: A シリーズの有料記事を 28 日の閲覧 (09-07〜10-04) の多い順に 3 本。`n2ed31d721531` 財政健全化法の4指標 (閲覧 358)、`nba8bf272cc2b` 初婚年齢 (133)、`n67de9d45c426` 趣味・娯楽時間 (100)。3 本で A シリーズ有料 47 本の閲覧 804 の 74%。いずれも ¥200 で、入っているマガジン (`s47-fiscal`・`s47-population`・`s47-sports-culture`) は無料。**2026-10-08 に note.com で 3 本を無料に切り替えた** (公開設定の記事タイプを無料にして更新。`https://note.com/api/v3/notes/<id>` が 3 本とも `price: 0`・`can_read: true` を返すことを未ログインで確認)。カタログ `stats47-note.ts` と公開済み一覧 `data/note/note-published-urls.json` の 3 件も `is_paid: false` にした。一覧の `r2_access` は `private` のまま残した。本文が非公開 R2 にしか無く、`public` にすると OGP 生成とギャラリー監査が公開 R2 の本文を探して欠落扱いにするため。本文を公開 R2 へ移すのは R2 への書き込みなので、オーナーの承認を取ってから行い、そのとき一覧も `public` にする。4 週後の比較は、この 3 本の閲覧と、まだ有料の残り 44 本の閲覧、上の着地ページで行う。ノウハウ記事 (`nfd3ab8213e1f` Excel マクロの移植など) は対象外。
- **停止条件**: 全記事を一括で変えない。ノウハウの有料記事・マガジン (Claude Code の実務) は有料のまま。note への反映はオーナーのログインを経てから。
- **完了条件**: 47 本の有料・無料が決定どおりになり、カタログと note.com が一致し、無料化の前後 4 週の閲覧と送客が記録されている。

### [KDP-LEDGER-AUTO-01] 認証付き計測で取った KDP の月次レポートを、CI が販売台帳へ自動で記録する
タグ: [インフラ・計測] [種類:改善] [実行:対話] [検証:npm run products:sales --workspace=@stats47/product-factory -- validate] [起票:2026-10-07] [領域:管理]

- **事象**: KDP の月次レポートは 2026-09-21 から CI が取得し、暗号化保管庫 (`operations/authenticated-measurement/kdp/monthly/…`) に入っている。一方で販売台帳 (`data/products/sales-ledger.json`) は 0 件のままで、KPI ツリーの `paid-purchases` と週次収益 (NSM) の KDP 分は「台帳へ自動で入れる経路が無い」として判定不能になっている。
- **原因**: 台帳の `record` は証拠ファイルを `.local/product-sales-evidence/` (手元の端末だけにある場所) に置くことを必須にしている (`packages/product-factory/src/sales/cli.ts` の `resolveEvidence`、`ledger.ts` の検査)。CI は保管庫の復号鍵を持つが、この条件を満たせないので書けない。
- **次**: ① 証拠の参照先として「保管庫のキーと、復号したレポートの sha256」を認める形を設計する (公開リポジトリには金額の集計だけを置き、生のレポートは保管庫に残す) ② `collect.mjs` の KDP 月次取得の直後に、本ごとの注文数・既読 KENP・推定ロイヤリティを台帳へ書く ③ 8 月分 (保管庫に既にある) で台帳に 12 冊分の行ができることを確かめる。
- **停止条件**: 生のレポート (全アカウントの行を含む) と個人情報を公開リポジトリに置かない。stats47 の ASIN 以外の行を台帳に入れない (`kdp-reports.mjs` の `kdpAsinMap` と同じ照合を使う)。
- **2026-10-08 実装 (`fb6c2b288`・develop のみ・未 push)**: 台帳の証拠に保管庫キー `vault:kdp/monthly/month-<n>` と復号したレポートの stats47 行の内容ハッシュを認めた。`collect.mjs` が書籍別の集計だけを結果に載せ、書き込み権限のある record job の `summarize.mjs` が同じ書籍・月の行が無いときだけ足す (値の食い違いは上書きせず action_required、円以外・負の行は理由付きで除外、明細の無い本を 0 で埋めない)。8 月分は手入力で 1 行 (K-S1-02・¥254、`1f4a56bc4`) を記録済み。テスト: product-factory 298 件・measurement 73 件 pass。**定期実行は main の workflow 定義で `git add` するので、develop→main のマージ (オーナー承認) まで CI は台帳を書かない。**
- **完了条件**: マージ後の CI の KDP 月次取得のあとに、明細のある本の行が台帳へ自動で増え (明細の無い本は行を作らない)、`products:sales -- validate` が PASS し、週次の KPI ツリーで `paid-purchases` の KDP 分が判定不能でなくなる。

### [KNOWHOW-PRODUCT-PILOT-01] AI×公的統計の実務ノウハウ商品を1つ選び、note の販売面で4週の実売を確かめる
タグ: [収益化] [種類:制作] [実行:対話] [起票:2026-10-07] [領域:商品]

- **経緯**: 2026-10-07 のオーナー整理で、回収経路を「アクセス集客の換金」「ノウハウ商品」「コンテンツ販売 = KDP」の3つにした (収益化戦略 §3.5)。本カードはノウハウ商品の経路。
- **前提 (実測)**: 支払いの実績は note の通算売上 ¥900 だけで、3 件とも Claude Code を使う実務記事 (e-Stat 連携 2 件・ローカル LLM 1 件、¥300×3、2026-05〜07)。有料マガジンは 公務員×Claude Code (¥1,980) / e-Stat×Claude Code (¥1,480) / D3.js 配色 (¥500) の 3 つ (2026-08-03 時点)。一方で stats47 の Claude Code 連載ブログは 28 日で 25 PV (サイト全体の 0.06%) しかなく、サイトの読者を商品へ誘導する経路は無い。集客は note の検索・推薦と、開発者・行政職員の外部チャネルに置く。
- **読者の課題 / HARM**: AI と公的統計を仕事や個人開発に使いたい (A: 技能・仕事の達成)。支払う理由は、調べて試す時間を短くできること。
- **次 (実行順)**: ① note ダッシュボードの全期間で、有料マガジン 3 つと有料の実務記事の閲覧・購入を棚卸しし、売れた 3 件がどこから読まれたかを確かめる ② 1 テーマを選ぶ (第一候補は売れた系統の「e-Stat × Claude Code の初期設定・DB 連携・ローカル実行」) ③ 既存マガジンの改訂か単品かを決め、価格と制作工数の上限を固定する ④ オーナー承認後に公開し、4 週の閲覧・購入数・売上を販売台帳 (`npm run products:sales --workspace=@stats47/product-factory`) に記録する。
- **関係 (2026-10-19 追加)**: ② のテーマ選定の入力として、`KNOWHOW-QA-BOARD-01` が公開の質問掲示板から 4 週集めた質問のテーマ別集計 (同じテーマ 3 件以上) を使う。集計が出るまでは売れた系統 (e-Stat × Claude Code) を第一候補のまま保つ。既存の商品を読者ごとの階段 (自治体の財政比較・地図づくり) に並べ、段ごとの導線を測る作業は `NOTE-PRODUCT-LADDER-01` が持つ。
- **関係**: 行政職員向けなら `ADMIN-STAT-PILOT-01` と読者が重なる。聞き取りの場では支払い意思を仮定の質問で聞かず、聞き取り票の Q8（仕事のための自腹購入・組織の購入経路）と Q9（庁内の生成 AI 利用環境）で事実を確かめる。
- **自治体ペルソナ向けの候補（2026-10-17 オーナーと壁打ち）**: (A) 生成 AI × e-Stat で類似団体比較表を作る手順（庁内で許される範囲の AI 利用。売れた唯一の系統と、元自治体職員という信頼を重ねる。既存マガジン「公務員 × Claude Code」¥1,980 の改訂でも出せる）を第一候補とする。(B) 議会答弁・計画の現状分析に使う統計の探し方と出典の書き方（AI を使わない。「e-Stat 7 つの技」の記事は職場からの読者が多く、Teams 経由の共有もある）は、Q9 で庁内の AI 利用ができない人が多い場合の切り替え先にする。(C) 介護保険事業支援計画（第 10 期）の現状分析のデータ集めは、`ADMIN-STAT-PILOT-01` のデータ商品検証へ回し、ノウハウとしては後回しにする。開発者向けの第一候補（e-Stat × Claude Code の初期設定）とどちらを先に出すかは、聞き取り 3 件の後に決める（複数商品を同時に出さない）。
- **雑学の読者から拾う導線 (2026-10-07 検討)**: オーナー案「サイト管理者が独立して年収1000万円」を入口に実務記事へつなぐ形は、そのままでは採らない。運営者の実績ではなく (サイトの収益は判定不能・商品は ¥0)、事実でない収益の主張は下の禁止と収益化戦略 §8 に当たり、公的統計サイトの信頼も損なうため。事実に基づく代わりの形を、計測付きで 1 つずつ試す: (a) 閲覧の多い雑学ランキング数ページの末尾に「このランキングの作り方 (Claude Code × e-Stat)」の 1 行を置き、無料の Claude Code 連載を経てノウハウ記事へつなぐ。`nav_click` で 4 週のクリックを測る (b) 年収・所得の統計そのもの (例: 高額給与所得者の多い県。W41 の週次計画でトレンド候補) を雑学として出し、所得に関心のある読者を集める (c) 運営の収支を実数で公開する連載 (成果は取得日と取得方法のある計測値だけ)。年収 1000 万円などの数字は、実際に達成して証拠を示せるまで使わない。
- **停止条件・禁止**: 「稼げる」「収益化できる」を売り文句にしない (stats47 自体の収益実績がまだ無く、証拠のない収益の主張は収益化戦略 §8 が広告でも扱わない情報商材と同じになる)。成果として書くのは取得日と取得方法を示せる計測値だけ。複数の商品を同時に出さない。note への公開・価格変更はオーナー承認と人手ログインを経てから。
- **完了条件**: 1 商品の 4 週の実売 (0 件なら 0 件と、考えられる理由) が台帳にあり、継続・改訂・撤退のどれかをオーナーが決めた。

### [KNOWHOW-QA-BOARD-01] 公開の質問掲示板で統計・地図・e-Stat の困りごとを集めて無料で答え、3 回以上繰り返す質問だけをノウハウ商品にする
タグ: [収益化] [種類:制作] [実行:対話] [起票:2026-10-19] [期日:2026-12-14] [領域:商品]

- **位置づけ**: `KNOWHOW-PRODUCT-PILOT-01` の前段。あちらは「商品を 1 つ選んで 4 週売る」、こちらは「何を商品にするかを質問の実測で決める」。商品化の判断・価格・公開はあちらに渡し、本カードは質問の収集・回答・集計までを持つ。メンバーシップと会員限定の掲示板は作らない (2026-10-07 オーナー判断を維持。note 全体 28 日 閲覧 7,048・売上 ¥0 で定期課金の母数が無い)。
- **前提 (実測 2026-10-19、`data/note/dashboard/2021-05-01_2026-09-11_*.json`)**: ノウハウ系 30 本の通算 閲覧 5,216・売上 ¥600 (全体の ¥900 のうち。残り ¥300 は 09-11 以降)。最多は「Google マップで KML ファイルを利用する方法」3,226 閲覧 (無料・AI 不要)。売れたのは Ollama オフライン (¥300) と e-Stat API 連携 (¥300×2) で、いずれも「環境構築・接続の具体手順」。入口記事「Claude Code とは何か (公務員向け)」はスキ 53 だが、次の有料「環境構築 完全版」は 289 閲覧・¥0。stats47 の Claude Code 連載は 28 日 25 PV・検索クリック 12 で、サイトからは流せない。**示唆**: 需要は「操作の困りごと (地図・e-Stat の取得)」にあり、AI は手段として後ろに置く。何に困っているかの一次証拠はまだ無い (`ADMIN-STAT-PILOT-01` の聞き取り 0 件)。
- **読者の課題 / HARM**: 仕事や個人の資料で公的統計・地図データを扱わなければならず、やり方を調べる時間が無い (A: 技能・仕事の達成)。提供価値は「今日の作業が終わる手順」。支払う理由は、手順とファイルで試行錯誤の時間を買えること。需要の証拠は上の閲覧・売上だけで、質問の実数は未確認 → 本カードで取る。
- **次 (実行順。各段に完了の判定と停止条件を付ける)**:
  1. **収集の器を作る [S・1 回]** — 質問台帳 `data/products/knowhow-questions.json` (JSON Schema 付き: `collectedAt`・`source` (知恵袋 / 教えて!goo / teratail / X / 自前受付)・`url`・`questionText` (要約。個人を特定する語を入れない)・`theme` (kml-map / estat-fetch / excel-stats / claude-code / other)・`answered` (日付・回答の場所)・`reaction` (閲覧・ベストアンサー・スキ)・`productCandidate`) を `config/datasets.mjs` に 1 行足してから作る (`data-storage.md`「台帳と検査」、`npm run check-datasets` が通ること)。収集の検索語は 5 テーマ × 3 語 (例: 「e-Stat API 取得」「KML Google マップ 表示されない」「都道府県別 データ Excel 作り方」) を台帳の `queries` に固定し、毎回同じ語で探す。**完了**: 台帳と schema が存在し、検査が通る。
  2. **週 1 回・1 時間の収集 [S・4 週]** — 毎週同じ曜日に、直近 7 日の質問を各掲示板の検索で拾い台帳に追記する (機械収集はしない。各サイトの利用規約でスクレイピングの可否が異なり、件数も週数件なので手作業で足りる)。**完了**: 4 週分の行がある。**停止**: 4 週で合計 10 件未満なら、需要の計器として成立しないので ⑤ へ飛ばず `KNOWHOW-PRODUCT-PILOT-01` の「売れた系統 (e-Stat × Claude Code)」単独で進める。
  3. **答える [S・質問ごと]** — 答えはその掲示板の中で完結させる (手順の要点・つまずく箇所・出典)。商品の URL は貼らない。長い手順が要るときだけ、note の**無料**記事を書いてそこへ案内する (案内が規約上許されるサイトだけ。先に各サイトの規約を読み、台帳の `source` ごとに「リンク可 / 不可」を記録する)。回答は週 2 件まで。**完了**: 回答した質問に `answered` と `reaction` が入る。**停止・禁止**: 売り込み・「稼げる」訴求・stats47 の宣伝をしない (信頼が商品。`KNOWHOW-PRODUCT-PILOT-01` の禁止と同じ)。回答の正確さは出典 (e-Stat の表番号・公式ヘルプ) を示せる範囲に限る。
  4. **自前の受付を 1 つ置く [S・1 回]** — note のノウハウ無料記事の末尾と stats47 の Claude Code 連載 (`/blog/cc-estat-*`) に「質問はこちら」を 1 行。受け口は GitHub Discussions (公開リポジトリが要る) か Google フォームのどちらか 1 つ (両方は置かない)。届いた質問も同じ台帳へ (`source: own-form`)。stats47 側のクリックは `nav_click` の `nav_surface` に値を 1 つ足して数える (`analytics-event-standards.md` の台帳に登録。本番反映はまとめてのデプロイで)。**完了**: 受付が公開され、クリック計測が台帳にある。
  5. **4 週後の集計と商品候補の選定 [S・1 回]** — 台帳を `theme` 別に集計し、**同じテーマの質問が 4 週で 3 件以上**あるものを商品候補にする。候補ごとに「質問文の例 3 件・既存記事の有無・必要な成果物 (手順書 / ファイル / テンプレ)・制作工数の見積り」を 1 表にして `KNOWHOW-PRODUCT-PILOT-01` ② (テーマ選定) へ渡す。**完了**: 表がカードに書かれ、オーナーが第一候補を選んだ。**停止**: 3 件以上のテーマが無ければ商品化せず、収集を 4 週延長するか (1 回だけ) 打ち切るかを決める。
- **判定の数値 (先に固定)**: 収集 = 4 週で 10 件以上 (未満は計器不成立)。回答 = 回答経由の note 無料記事の閲覧が 4 週で 100 以上 (`data/note/dashboard/` の記事別 閲覧)。受付 = 4 週で質問 5 件以上。商品化 = テーマ 3 件以上。これらは観測の下限で、超えても「売れる」の証拠ではない (売れるかは `KNOWHOW-PRODUCT-PILOT-01` の 4 週実売で見る)。
- **やらないこと**: 掲示板の自動巡回・自動投稿 (規約と信頼の両方を失う)。note メンバーシップ・Discord 等の会員制コミュニティ。複数の受付を同時に置くこと。回答の中で stats47 のランキングを宣伝すること (質問が県別データの所在なら、出典としてのリンクは可)。
- **工数の上限**: 週 1 時間 (収集) + 回答 2 件 (各 30 分) = 週 2 時間。10 月の重点 (計測・データ品質) の Must を侵さない。超えそうなら回答数を減らし、収集だけ続ける。
- **完了条件**: 4 週の質問台帳 (出所・テーマ・回答・反応) があり、テーマ別の集計と商品候補の表 (または「候補なし」とその理由) が `KNOWHOW-PRODUCT-PILOT-01` に引き渡されている。回答経由の閲覧と受付の件数が上の判定の数値と並べて記録されている。

### [NOTE-PRODUCT-LADDER-01] note の既存商品を「自治体の財政比較」「地図づくり」の 2 本の階段に並べ直し、段ごとの閲覧 → 次の段 → 購入を 4 週測る
タグ: [収益化] [種類:改善] [実行:対話] [起票:2026-10-19] [期日:2026-12-21] [領域:商品]

- **位置づけ**: 新しい商品を増やすカードではない。既存の在庫を読者ごとの階段に並べ、段と段の間の導線 (記事末尾の案内 1 行) を揃えて、どの段で読者が落ちているかを測る。関係するカードとの分担: テーマ選定と単品の実売判定 = `KNOWHOW-PRODUCT-PILOT-01`、需要 (質問) の収集 = `KNOWHOW-QA-BOARD-01`、雑学有料記事の無料化 = `NOTE-FREE-DEFAULT-01` (本カードは雑学 → stats47 の導線を扱わない)、行政資料の新商品の採否 = `ADMIN-STAT-PILOT-01`、地図の橋渡し記事の制作 = `NOTE-HOWTO-SERIES-01` / `NOTE-HOWTO-OWNER-CHECK-01`、stats47 → データ集の導線 = `PRODUCT-FUNNEL-DEPLOY-01`。
- **前提 (実測 2026-10-19)**:
  - 在庫: note 有料 151 本 (公開 79・下書き 72、`data/note/articles.json`)、Kindle 出品中 12 冊 (¥500 / ¥800・読み放題 KU 不参加、`config/kdp-listings.json`)、ココナラ出品中 14 件 (¥4,000〜15,000、`config/coconala-listings.json`)。
  - 売上: note 通算 ¥900 (〜2026-09-11。公務員×Claude Code の Ollama ¥300、e-Stat×Claude Code の API 連携 ¥300・MCP sqlite ¥300。`data/note/dashboard/2021-05-01_2026-09-11_*.json`)。Kindle は記録済み 2 冊 ¥413 (K-S1-02 8 月 ¥254・K-S2-03 9 月 ¥159、`data/products/sales-ledger.json`)。ココナラは販売記録なし。**ただし計測が欠けている**: note は 10-05 以降の取得が失敗中 (`NOTE-DASHBOARD-COLLECT-01`)、KDP・ココナラは認証切れ (`MEASUREMENT-AUTH-RESTORE-01`、最終観測 10-01)。これらの期間の売上は「¥0」ではなく「未計測」として扱う。
  - 集客: stats47 の検索クリック 1 位は `/blog/local-government-debt-burden` (GSC 2026-W41 28 日 368 クリック)。note の財政記事 (`s47-fiscal`) は通算で財政力指数 1,613・健全化 4 指標 1,422・実質公債費比率 1,341・地方債現在高比率 990 (スキ 28 は全記事で最多)・経常収支比率 702 閲覧。地図は「Google マップで KML ファイルを利用する方法」が 3,226 閲覧。
- **読者 / HARM**: 階段 1 は自治体職員・議員。議会や予算の資料で、自分の団体の財政を似た団体と比べる必要がある (A: 仕事の達成。組織の M に関わる)。階段 2 は資料の作り手で、統計を地図にして資料に入れたい (A)。提供価値は「今日の資料が仕上がる手順と、編集できる成果物」。支払う理由は収益化戦略 §3.4 の「選定・整形・照合・編集用成果物」に限り、公開データのまとめ直しだけには値段を付けない。需要の証拠は上の閲覧数で、購入の証拠は ¥900 だけ (未検証)。
- **階段 1: 自治体の財政比較**

  | 段 | 商品 (note の key) | 価格 | 状態 | 入口 |
  |---|---|---|---|---|
  | 0 集客 | `s47-fiscal` の無料 7 本 (`recovered-n16950238dfd8` 財政力指数・`recovered-n04d95ae14bc1` 実質公債費比率・`recovered-ne82a6c83ed45` 地方債現在高比率・`recovered-ne31a2574e231` 経常収支比率・`recovered-n567416b632f6` 実質収支比率・`recovered-nded2d34fc978` 稼ぐ力と借金・`paid-n2ed31d721531` 健全化 4 指標) と stats47 の `/blog/local-government-debt-burden` | 無料 | 公開中 | 検索 |
  | 1 橋渡し | `13-fiscal-peer-no-code` (財政指標の同規模比較を Claude・ChatGPT で作る。プログラミングなし) | ¥300 → **無料** (2026-11-09 以降) | 公開中 (10-12) | 段 0 の末尾 |
  | 2 単品 | `12-fiscal-peer-comparison` (同じ比較を e-Stat × Claude Code で作る) | ¥300 | 公開中 (10-12) | 段 1 の末尾 |
  | 3 テンプレ | **新規・条件付き**: 類似団体比較表の Excel テンプレと手順 | ¥980 (仮) | 未作成 | 段 1・2 の末尾 |
  | 4 束 | マガジン `koumuin-estat-claude-code` / `koumuin-claude-code` | ¥1,480 / ¥1,980 | 公開中 | 段 2 の末尾 |
  | 5 データ | ココナラ「47都道府県の自治体財政データ集」 | ¥5,000 | 出品中 | ココナラ内の検索 (note と相互リンクしない) |
  | 6 個別 | 自治体ごとの比較資料の作成 | 見積り | 未作成 | `ADMIN-STAT-PILOT-01` が Go を出した場合だけ |

  `s47-fiscal` の ¥200 有料 3 本 (`paid-n4b8346d9c17b` 自主財源比率・`paid-na16afa534c77` 実質収支比率・`paid-nb8f3e05d244b` 経常収支比率) は `NOTE-FREE-DEFAULT-01` で無料に戻し、段 0 に加える。
- **階段 2: 地図づくり**

  | 段 | 商品 (note の key) | 価格 | 状態 | 入口 |
  |---|---|---|---|---|
  | 0 集客 | `recovered-n03e45e40d3a7` (Google マップで KML を使う方法) と、stats47 のランキングの KML・GeoJSON の無料ダウンロード (PR #1143 で本番反映済み) | 無料 | 公開中 | 検索 |
  | 1 橋渡し | `h-howto-mymaps-kml` (マイマップで都道府県を色分けした地図を作る) | 無料 | 下書き (note-critic REVISE・実機確認待ち) | 段 0 の末尾 |
  | 2 編集用素材 | `ppt-japan-map-assets` (PowerPoint で使える 47 都道府県の白地図・色分け地図素材) | ¥1,980 | 下書き | 段 1 の末尾 |
  | 3 上級 | マガジン `koumuin-gis` (QGIS・メッシュ分析 3 本。通算閲覧 34・売上なし) | ¥2,980 | 公開中 | 変えない |

  「47 都道府県・市区町村の KML / GeoJSON セット (¥500)」は 2026-10-19 の検討で外した。stats47 が同じ形式を無料で配っており、§3.4 の「公開データをまとめ直したことだけを支払う理由にしない」に当たるため。
- **次 (実行順。各段に完了の判定と停止条件を付ける)**:
  1. **基準値を記録する [S・1 回]** — 前提は `NOTE-DASHBOARD-COLLECT-01` で note ダッシュボードの取得が戻っていること (戻らなければ、以降の判定はすべて「判定不能」になる)。階段 1・2 の各記事の直近 28 日の閲覧と売上、マガジン 4 つの購入、GA4 の `sessionSource = note.com` の着地 (再現: `node .claude/scripts/metrics/ga4-query.mjs --dims landingPage --metrics sessions --filter 'sessionSource==note.com'`) を、このカードに 1 表で書く。**完了**: 表がある。
  2. **階段 1 の段 0 → 段 1 の導線を揃える [S・人手]** — `s47-fiscal` の無料 7 本の末尾の案内を、「同じ比較を自分の自治体で作る (`13-fiscal-peer-no-code`)」の 1 本にする。stats47 へのリンクは本文の出典として残し、末尾の案内は 1 つにする。この 7 本は `NOTE-CIRCULATION-PILOT-01` (次の記事とマガジンのカード) の観測対象と重なるので、その判定 (improvements の Due 10-18 を超過) を記録してから変える。カタログ (`data/note/articles.json` の本文) も同じ差分で直す。**完了**: 7 本の末尾が揃い、カタログと一致している。**停止**: 公開記事の編集は人手のログインとオーナー承認を経てから。
  3. **段 1 を無料にする [S・人手・2026-11-09 以降]** — `NOTE-FISCAL-PEER-PUBLISH-01` が公開日 + 28 日 (11-09) の売上比較を記録するまで、価格を変えない。記録後、`13-fiscal-peer-no-code` を無料にし、末尾に段 2 (`12-fiscal-peer-comparison`) への案内 1 行を置く。**完了**: note 上で無料になり、カタログの `isPaid` が false。
  4. **階段 2 の段 0 → 段 1 の導線 [S・人手]** — `h-howto-mymaps-kml` が公開されたら (制作・公開は `NOTE-HOWTO-SERIES-01`)、KML 記事の末尾をそこへの案内 1 行にし、H-01 の末尾を段 2 への案内にする。**完了**: 2 本の末尾がつながっている。
  5. **段 2 `ppt-japan-map-assets` を仕上げて公開する [M・承認]** — 下書きの中身を、PowerPoint で開いて県ごとに色を変えられるか (図形として編集できるか) の実機確認と note-critic で確かめる。境界は国土数値情報の行政区域 (N03・`cc-by-4.0`、`packages/gis/src/mlit-ksj/datasets.ts`) なので、出典表示を同梱する (product-factory の `LICENSE-ja.txt` 生成を使う)。**完了**: 実機確認・critic PASS・オーナー承認を経て公開。**停止**: 図形として編集できない (画像の貼り付けだけ) なら ¥1,980 では出さない。
  6. **段 3 の新規テンプレ [M・条件付き]** — `ADMIN-STAT-PILOT-01` が「用途を確かめていない新作・販売面を増やさない」と決めているので、次のどちらかを満たすまで作らない。(a) 段 1 を無料にしてから 4 週で、段 1 の閲覧が 100 以上、かつ段 2 か段 4 の購入が 1 件以上。(b) `ADMIN-STAT-PILOT-01` の聞き取りで、「類似団体との財政比較」が担当者 2 人以上に共通する繰り返しの業務だと確かめられた。中身の案は、自分の団体を選ぶと人口規模の近い団体が並ぶ Excel 1 枚と手順。データは stats47 にある市町村の財政指標 (財政力指数・経常収支比率・実質公債費比率・実質収支比率・地方債現在高・標準財政規模。社会・人口統計体系 `0000020204`) を使う。**着手前の確認**: ① 社会・人口統計体系の市町村財政は財政力指数が 2021 年度まで。総務省の公表 (決算カード・財政状況資料集) の最新年度との差を確かめ、2 年以上古いなら年度を題名に明記するか作らない (`DATA-QUALITY-LOOP-01` の基準)。② 「類似団体」を総務省の類型で区分するか、人口規模で代用するかを原典で決める。生成と検査は product-factory (`catalog-validator`・`LICENSE-ja.txt`・`SOURCES.csv`) で行う。**完了**: 検査を通り、サンプルがあり、オーナーが承認した。**停止**: 着手の条件を満たさない、または年度が古いまま更新できない。
  7. **4 週後に判定する [S・1 回]** — 段ごとに「閲覧 → 次の段の閲覧 → 購入」を 1 表にし、下の数値と比べる。
- **判定の数値 (先に固定)**: 階段ごとに、4 週で段 2 以上の購入が合計 3 件。落ちる段の見分け方は 2 つ。段 1 の閲覧が 4 週で 100 未満なら、入口 (段 0 の末尾の案内) の問題。段 1 の閲覧が 100 以上あって購入が 0 件なら、商品か価格の問題なので、`KNOWHOW-QA-BOARD-01` の質問の集計でテーマを見直す。段 0 の閲覧が、末尾を変える前の 28 日より 2 割以上減ったら (無料化した記事を除く)、末尾の変更を戻す。
- **やらないこと**: 雑学記事に有料の案内を置く。1 記事に案内を 2 つ以上置く。新しい有料ランキングやメンバーシップを作る。下書き 72 本をまとめて公開する。段 3 のテンプレ以外の新規商品を作る。ココナラと note を相互にリンクする (ココナラの規約が外部への誘導をどこまで許すかを確かめるまで)。「稼げる」を売り文句にする。値下げで売上を作る (価格は判定のあとに 1 回だけ見直す)。
- **月次計画との関係**: 10 月の `monthly.md` は「商品領域の新規制作は見送り」。手順 1〜5 は既存在庫の並べ直しで新規制作に当たらない。手順 6 (新規テンプレ) を始めるかは、11 月以降の `/monthly-plan` で判断する。note への公開・価格の変更は、どれもオーナー承認と人手のログインを経る。
- **工数の上限**: 手順 2〜4 は各 30 分以内、手順 5 は 3 時間以内、手順 6 は 1 日以内。超えそうなら止めて報告する。
- **完了条件**: 2 本の階段の各段に、変更日・4 週の閲覧・次の段の閲覧・購入 (または判定不能とその理由) が記録されている。そのうえで、続ける・段を差し替える・階段ごとやめる、のどれかをオーナーが決めた。結果を `KNOWHOW-PRODUCT-PILOT-01` と `02_収益化戦略.md` §3.5 へ引き渡した。

### [AMAZON-ASSOCIATE-PILOT-01] Amazon アソシエイトと Kindle 自社本への導線の効果を測り、続けるか広げるかを決める
タグ: [収益化] [種類:改善] [実行:対話] [起票:2026-10-07] [期日:2026-11-15] [領域:アフィリエイト]

- **経緯**: 2026-10-07 のオーナー判断で、アフィリエイトは週次計画上「維持」レーンだが、アクセス実験として Amazon を配線した。(1) 商品詳細から Amazon への Kindle リンクにタグ `stats47-22` と `rel=sponsored` を付けた。(2) ランキング右レールの「関連記事」に、表示中の記事を収録した Kindle 本の行を足した (`nav_surface=ranking_product`。上限 164 ランキング)。(3) Kindle 本の無いブログ記事末に `CATEGORY_BOOKS` の一般書籍 1 冊を出した (`affiliate_click` の `link_position=related-books`)。
- **交絡**: `AFF-RESOLUTION-EFFECT-01` (判定期日 10-08) と窓が重なる。デプロイ日を境界にし、それ以前の窓とは比べない。AdSense の再開 (`ADSENSE-RESTART-01`) もランキング本文中段と右レールの配置を変えるので、そのデプロイ日 (2026-10-11) も境界にする。
- **未確認 (オーナー)**: Amazon アソシエイト口座 `stats47-22` がまだ有効か (規定期間内の売上件数による閉鎖条件)。Amazon の成果は自動収集の対象外で、KDP は `auth_required`。どちらも取れるまで売上効果は判定不能のまま。
- **現在地 (2026-10-07)**: 実装は develop (`11e2d6ba`) にあり、本番は未反映。draft PR #1099 (develop → main) を作成済み。Security Scan だけが失敗しているが、main でも同じ理由で落ちている既存の失敗 (下の [DEPS-BRACES-GATE-01] の追記を参照) で、この変更が原因ではない。ローカルでの確認手順: `npm ci` → `npm run dev:web` を開き、`/products/kindle-k-s1-01` (Amazon リンクに `?tag=` が付く)、`/ranking/healthy-life-expectancy-male` (右レールに「この記事を収録した本」)、`/blog/2050-population-map-reading` (記事末に「PR・関連書籍」) を見る。
- **ローカルで続きにやること (実行順)**: ①Amazon アソシエイトの管理画面で `stats47-22` が有効か確かめる。無効なら本番へ出す前に止める ②`CATEGORY_BOOKS` (`apps/web/src/features/ads/constants/related-books.ts`) を labor / education などへ広げるなら、Amazon で実在 ASIN と書名を確かめてから足す (推測の ASIN を書かない) ③ローカルの表示を確認し、オーナー判断で PR #1099 の draft を外して main へマージする (= 本番デプロイ)。デプロイ日をこのカードに書く。
- **次**: デプロイ後 28 日で GA4 の `nav_click` (`ranking_product` / `blog_product`) と `affiliate_click` / `affiliate_impression` (`related-books`)、`cta_click` (`product_kindle`) を取り、Amazon レポートと KDP 売上を照合する。`CATEGORY_BOOKS` は 5 vertical だけなので、labor / education などへ広げるなら実在 ASIN を Amazon で確かめてから足す。
- **追記 (2026-10-07)**: 雑学の流入を換金する経路の一つとして扱う (収益化戦略 §3.5)。食べ物の消費量・特産のクエリが検索クリックの 31% を占めるので、28 日判定では、楽天と Amazon の物販クリックを食の雑学ページ (家計調査の消費量ランキングなど) とそれ以外に分けて出す。楽天の商品カードは 09-06〜10-03 にクリック率 0.40〜0.46% (サイト平均 0.145%) だが計 4 クリックで、まだ判定できない。
- **完了条件**: 28 日分のクリック数と、Amazon / KDP の売上 (取れなければ取れない理由) を記録し、継続・拡大・撤退のどれかをオーナーが決めた。

### [BLOG-BG-PIPELINE-CONSOLIDATE-01] ブログ背景の経路を Codex の記事固有背景 1 本にまとめ、背景の不足を push 前に止める
タグ: [コンテンツ品質] [種類:改善] [実行:対話] [検証:node .claude/scripts/blog/quality-gate.mjs <slug>] [起票:2026-10-07] [領域:サイト]

- **事象 (2026-10-07)**: 22 記事の書き直しを公開したところ、タイトルを変えた 5 記事でサムネイル検査が「AI 背景の prompt が古い」と止め、run 全体が止まった。エラーと規約が背景の作り直しに Gemini 経路を案内していたため、Gemini で作り直す依頼を誤って push した (正典は Codex の記事固有背景)。背景の出どころは 3 系統 (git の記事固有背景 492 枚・旧 Codex カタログ 23 枚・R2 だけにある Gemini 背景。公開 619 記事のうち 100 本前後が未移行の見込み) で、背景を選ぶ処理が `generate-blog-thumbnails.ts` と `generate-blog-thumbnails-cloud.ts` に別々に書かれている。
- **次 (実行順)**:
  1. ~~配線~~ 2026-10-07 に済み: quality-gate が `check-blog-background.ts` (判定は `lib/blog-background-status.ts`) で、送り箱の記事に今の内容に合う背景が無ければ Codex の手順を示して止める
  2. 集約: 背景を選ぶ処理 (git の記事固有背景 > 旧 Codex カタログ > 公開済み AI 背景の再利用) と案内文を `lib/blog-background-status.ts` にまとめ、`generate-blog-thumbnails.ts` と `-cloud.ts` から呼ぶ (背景の記録を読む `backgroundRecord` は移し済み)
  3. 撤去: 未移行の記事を `blog-images:codex queue` (Mode B) で git の背景へ移し、R2 の Gemini 背景が 0 件になったら Gemini の client・cache・ビジュアルカタログ・`gemini-image-run.yml` の blog 部分と規約の Gemini の記述を同じ差分で消す。旧 Codex カタログも記事固有背景へ寄せる
- **追記 (2026-10-07)**: Codex で作った 5 枚のうち 3 枚 (cc-estat-20-publish・dairy-cattle-hokkaido-monopoly・sixth-industry-direct-sales) で、左の文字用の余白不足と禁止のチャートの描き込みをオーナーが目視で見つけたが、`check:blog-images` と `check-blog-background.ts` は寸法と形式しか見ず検出しなかった。左 55% の余白 (例: 左側の画素のばらつき・エッジ量のしきい値) を機械で測る検査を足すか検討する。fiscal-self-reliance-gap は R2 の背景の SHA が HEAD metadata と食い違い、公開 run を fatal で止めた (quality-gate の検査は公開 URL しか読まないので検出できない)。この記事も記事固有背景で直す。
- **2 回目 (2026-10-08、run 37698963459)**: `bonito-catch-prefecture` (別セッションが 10-08 朝に書き直した食の記事) で同じ
  「AI背景SHAがHEAD metadataと一致しません」が出て run が止まり、公開待ち 27 件のうち後ろの 24 件 (`cc-estat-20-publish`・
  `katsuobushi-expenditure-ranking`・`frozen-gyoza-spending-prefecture-gap` ほか) が試されなかった。この検査は
  `generate-blog-thumbnails.ts` が R2 の `app/blog/<slug>/ogp/background.jpg` の独自メタデータ `stats47-sha256` と本体の SHA-256 を比べるもので、
  認証付きの R2 HEAD でしか読めない (公開 URL の HEAD には `x-amz-meta-*` が出ない)。bonito の背景は 2026-08-31 に上げたもの。
  **次**: (a) 本体の SHA が記録と合いメタデータだけが古い場合に、その記事だけを飛ばす (exit 20) か、(b) メタデータを正しい値で上げ直すかを決める。
  どちらでも、1 記事の背景の不整合で後ろの記事の公開まで止まる今の挙動をなくす。
- **2026-10-08 の対処 (b を 4 枚に適用)**: 2026-08-31 に上げた `bonito-catch-prefecture`・`katsuobushi-expenditure-ranking`・
  `fresh-udon-soba-consumption-prefecture-gap`・`udon-soba-food-culture-prefecture-map` の `ogp/background.jpg` は、本体の SHA-256 が
  `ogp/generation.json` の `metadata.background.sha256` と asset 契約に一致し、`stats47-sha256` メタデータだけが無かった。
  本体を変えずに CopyObject (MetadataDirective REPLACE、Content-Type を保持) でメタデータを付け、HEAD と本体の SHA を読み直して確かめた。
  同じ日に上げたほかの背景にも同じ欠落がありうる (未調査)。挙動の是正 (1 記事で run 全体が止まる) は残る。
- **2026-10-08 挙動の是正**: 本体の SHA が記録と一致し、R2 の HEAD メタデータ (`stats47-sha256`) だけが欠けているか古い背景は、`generate-blog-thumbnails.ts` が exit 21 (`StaleBackgroundMetadataError`) を返し、`blog-auto-publish.yml` はその記事だけを skip して後ろの記事を試す (Step Summary に「背景のメタデータが古い」)。エラーには付け直しの手順 (S3 CopyObject・MetadataDirective REPLACE) を出す。本体の SHA が記録と合わないときは従来どおり run を止める。`workflow-commit-back.test.cjs` に exit 21 を足し、workflow の分岐を外すと落ちることを確かめた。**残り**: 上の 2 (背景の選択の集約) と 3 (Gemini 経路の撤去)。
- **停止条件**: 3 の画像生成は Codex が要る (クラウド環境では codex MCP が接続できない)。生成はオーナーのローカルで回す。
- **完了条件**: 1 は背景の無い送り箱の記事で quality-gate が止まることをテストで固定。2 は背景の選択と案内文の実装が 1 か所。3 は `queue` の targets が 0 で、リポジトリに Gemini の生成コードが無い。

### [BLOG-TITLE-CHANGE-WATCH-01] 図の年の書き直しでタイトルを変えた公開記事の検索流入を、公開後に確かめる
タグ: [コンテンツ品質] [種類:改善] [実行:対話] [起票:2026-10-07] [領域:サイト]

- **事象**: 2026-10-07 の書き直しで、数値の誤りやタイトルの約束が果たせないことを理由に、公開中の記事のタイトルを変えた。とくに `health-life-expectancy-structure` は週約 3,900 表示 (書き直し前の GSC) の記事で、タイトルと主題が変わった。ほかにタイトルを変えたのは `healthy-life-expectancy-male-female-gap`・`cc-estat-02-search-skill`・`cc-estat-04-aging-heatmap`・`ai-claude-code-pref-analysis` などである (公開時の diff で確定する)。
- **次**: 公開日を記録し、公開前 28 日の表示回数・クリック・掲載順位を baseline として GSC から取る。improvement-triage に渡して `improvements.md` に effect/pending として載せ、期日を公開の 4 週間後にする。
- **完了条件**: 対象の記事と baseline が improvements.md に載っている (効果判定そのものは improvements.md 側で行う)。

### [METRIC-DAIRY-CONFIG-01] 乳用牛の 2 指標で、調査時点と対象の表示が欠けている・食い違っている点を直す
タグ: [コンテンツ品質] [種類:不具合] [実行:対話] [起票:2026-10-07] [領域:データ]

- **2026-10-21 完了 (行削除は backlog-loop)**: 定義シートを出すと、`dairy-cattle-holdings` の対象欄「企業」は note の「法人企業数ではなく」を語の部分一致で拾ったもので、シートの抽出側の誤りだった。`build-metric-definition-sheet.ts` に `mentionsAffirmatively` (直後 2 文字以内に否定が続く出現は数えない) を足し (テスト 1 件)、対象欄の誤表示を消した。`dairy-cattle-count` には description・note (2025年2月1日現在・戸数とは数える対象が違う・丸め) と `surveyId: "livestock-statistics"` を足し、定義シートに調査時点と調査が出ることを確認した。validate:config・metrics:check・preflight:pr 通過。R2 の item.json は次の sync で反映される。
- **事象**: `dairy-cattle-count` の metric config に description と note が無く、調査時点 (2 月 1 日現在) が読者向けの定義に出ない (2026-10-07 に config で確認)。同じ畜産統計の肉用牛・豚・採卵鶏・乳用牛飼養戸数の config には `surveyId: "livestock-statistics"` があるのに、`dairy-cattle-count` だけに無く、定義シートの「調査」が空欄になる。critic によると、指標の定義シートで `dairy-cattle-holdings` の対象欄が「企業」と出る。一方、config の note は「飼養戸数は法人企業数ではなく」と書いていて、両者が食い違う (critic の報告。定義シートの出力は未確認)。
- **次**: `npx tsx .claude/scripts/blog/build-metric-definition-sheet.ts` で 2 指標の定義シートを出し、対象欄の値の出どころを特定して直す。`dairy-cattle-count` には `dairy-cattle-holdings` と同じ形で description と note を書く。
- **完了条件**: 2 指標の定義シートで、調査時点が出ていて、対象欄と note が食い違わない。`npm run validate:config --workspace=@stats47/data-configs` が通る。

### [BLOG-SEOTITLE-MIXED-YEAR-01] 年の違う指標を並べた記事で、seoTitle の年が片方の指標にも付いて見えるのを gate で止める
タグ: [コンテンツ品質] [種類:改善] [実行:対話] [検証:node .claude/scripts/blog/quality-gate.mjs <slug>] [起票:2026-10-07] [領域:サイト]

- **事象 (2026-10-07、sixth-industry-direct-sales の critic が BLOCK で報告)**: 農業産出額 (2024年) と農家総所得 (2003年度) を並べた記事の seoTitle の末尾に「2024年」が 1 つだけ付き、農家総所得も 2024 年の値に見えた。quality-gate と factual-check はどちらも、記事の図の data JSON の年が複数あるのに seoTitle・title が 1 つの年しか書いていない形を検出しない。
- **次**: 記事の data/*.json から年 (と年・年度の別) を集め、2 種類以上あるのに seoTitle・title に年が 1 つだけ書かれていたら warning を出す。公開済みの記事で何件当たるかを数えてから blocker にするかを決める。
- **完了条件**: 年の違う図を持つ記事で seoTitle に年が 1 つだけあると検出されることを、quality-gate のテストで固定している。

### [METRIC-SUPPLEMENTAL-SOURCE-DISPLAY-01] 補助の出典から取った年の値でも、指標の出典表示が主の出典のままになる
タグ: [コンテンツ品質] [種類:不具合] [実行:対話] [起票:2026-10-07] [領域:データ]

- **2026-10-21 完了 (行削除は backlog-loop)**: `supplementalSources` を持つ指標は 28 件。ランキングページの出典欄 (`resolveRankingItemDataSources`) は item.json の `recipe.ops.supplements` を見ずに主の出典だけを出していたので、補助の表も「統計表（2025年の値）」のように年付きで並べるようにした (国勢調査など調査名は統計表 ID から解決)。どの年を表示していても補助の年の出典が見える。指標の定義シートも調査欄に「(2025年は国勢調査 表0004065933)」を添える。テスト: ranking の survey 68 件 (ratio-65-plus で 2025 年の表が出る)・定義シート 2 件・web 全件 (環境由来の 1 件を除く) 通過。本番は未デプロイ。
- **事象 (2026-10-07、vacant-housing-vs-aging の critic が報告)**: `data/metrics/ratio-65-plus.ts` は 2025 年の値を `supplementalSources` (国勢調査、統計表 0004065933) から取るが、指標の出典表示は主の source (社会・人口統計体系) のままで、ブログの記事が 2025 年の値の出典を誤って書きやすい。ランキングページの出典表示が年ごとに切り替わるかは未確認。
- **次**: `supplementalSources` を持つ指標を数え、ランキングページと指標の定義シートが、表示中の年の出典を出しているかを確かめる。出していなければ、年に応じて出典を選ぶ。
- **完了条件**: 補助の出典から取った年を表示すると、その年の出典 (調査名と統計表 ID) が出ることをテストで固定している。

### [METRIC-FARM-INCOME-DEFS-01] 農家総所得の指標で、対象・分母・調査が定義に出ず、意味の無い正規化が選べる
タグ: [コンテンツ品質] [種類:不具合] [実行:対話] [検証:npm run validate:config --workspace=@stats47/data-configs] [起票:2026-10-07] [領域:データ]

- **2026-10-21 経過**: e-Stat「統計項目の定義 L 家計」(https://www.e-stat.go.jp/koumoku/koumoku_teigi/L) で、農家総所得 (L2100) =「農業所得と農外所得に年金・被贈等の収入を加算したもの」、農業所得 = 農業粗収益−農業経営費、農外所得 = 農外収入−農外支出、出典は農林水産省「農業経営統計調査」、単位は千円・年計、収集は 1975〜2003 年で中止、を確認した。3 指標に description・note (出典 URL 付き)・`surveyId: "agriculture-management-survey"` を足し、農家総所得の正規化の選択肢を外した。定義シートに調査が出ることを確認、preflight:pr 通過。**残り 2 点**: ① 1 戸当たりかは値の大きさから読めるが e-Stat の定義に明記が無く、2 つの割合の分母 (農家総所得か) も指標の算式を確認できない (e-Stat の指標定義ページは 404) ので、note に未確認と書き対象欄は空のまま。② e-Stat は期間を「年計」と書いており、config の yearFormat: fiscal と seoTitle の「年度」化のどちらが正しいか決まらない。`METRIC-YEARFORMAT-KAKEI-01` と同じく出典の年の区切りを確かめてから直す。
- **事象 (2026-10-07、sixth-industry-direct-sales の writer が報告し config で確認)**: `data/metrics/total-farm-household-income.ts` に description・note・surveyId が無く、指標の定義シートで対象 (農家 1 戸あたりか)・分母・調査が空欄になる。「総所得」が農外所得や年金を含むかも読者向けの定義に出ない。1 戸あたりの所得なのに normalizationOptions に「人口10万人あたり」「面積100km²あたり」があり、意味の無い換算が選べる。yearFormat は fiscal なのに seoTitle が「【2003年】」と暦年で書いている。系列は 1995〜2003 年度で止まっている。
- **追記 (2026-10-07)**: 同じ表 0000010212 の農業所得割合 (#L0110101)・農外所得割合 (#L0110102) の config も対象・分母・調査が定義シートに出ない (sixth-industry-direct-sales の fix writer が報告)。e-Stat の控え `data/estat/meta/0000010212.json` の項目名は「#L01100_農家総所得」で、1 戸あたりかどうかの表記が無い。記事は「分母は未確認」と書いて公開する。3 指標をまとめて直す。
- **追記 (2026-10-07)**: 再審の critic によると、北海道の 2003 年度は農業所得割合 46% と農外所得割合 15.1% を足して 61.1% で、2 つの割合の分母が農家総所得とは限らない (残りは年金などの可能性)。分母を確かめるときに合わせて見る。
- **次**: 社会・人口統計体系の指標定義 (#L01100) で対象と構成を確かめ、description と note に書く。surveyId を `data/surveys/taxonomy.json` で探して紐付ける。正規化の選択肢を外す。seoTitle を再生成して「年度」にする。
- **完了条件**: 定義シートに対象・分母・調査が出て、正規化の選択肢が無く、seoTitle が「2003年度」になる。

### [BLOG-TUTORIAL-GATE-GAPS-01] 手順解説記事 (cc-estat 連載) で quality-gate が誤って数える・照合できない 3 か所を直す
タグ: [コンテンツ品質] [種類:不具合] [実行:対話] [検証:node .claude/scripts/blog/quality-gate.mjs <slug>] [起票:2026-10-07] [領域:サイト]

- **2026-10-21 経過**: ① `quality-gate.mjs` のインライン svg 判定はコードブロックとインラインコードを除くようにした (テストで両方向を固定)。公開 616 記事を R2 から読んで旧・新の判定を比べ、どちらも 0 件 (誤検知も見逃しも増えない)。③ 注入を再現すると、値の一致判定が ±5% なので「4,970戸 → 4,790戸」(3.6%) が一致扱いだった。本文が書いた精度 (最後の 0 でない桁の半分 × 万などの接頭辞) で照合するようにし、「約」などで丸めを断っているときは従来の ±5% のまま (`claimTolerance`・テスト 3 件)。公開 608 記事の監査 (`audit-published-blog.mjs`) で VALUE_MISMATCH は 0 件のままで、日次の値ラチェットに影響しない。②は `blog-svg-chart-standards.md` §6-5 に描画スクリプトの置き場 (`.claude/scripts/blog/article-renderers/<slug>/`) と restore の書き方を足した。**残り**: cc-estat-04 の 2 枚を repo のスクリプトから作り直す (公開記事の図の差し替えになる)、④ 範囲の順位の誤検知、⑤ 県名の直後の派生値、⑥ タイトルの「N位」NG パターンの名前と判定のずれ、⑦「N位の県」と割合の検出漏れ。「倍」は単位として照合していない (比率の言い換えが多いため、別途判断)。
- **事象 (2026-10-07 の書き直しで writer・critic が報告)**:
  1. `quality-gate.mjs` の inline SVG 検出 (`/<svg[\s>]/`) がコードブロックの中も数える。D3 の手順記事が、検出を避けるために `<svg{...rootProps}>` や `const Svg = "svg"` という不自然な書き方をしている (cc-estat-04-aging-heatmap・cc-estat-13-agri-sankey)。`generate-article-charts --validate` も同じ理由でエラーを 4 件出す
  2. 記事のサンプルコードを描画した図 (svg-builder の対象外・source の kind は derived) の扱いが `blog-svg-chart-standards.md` に無い。cc-estat-04 の 2 枚は作業用の一時スクリプトで描いたもので、描画スクリプトがリポジトリに無く、作り直せない。svg-builder にサンキー型が無いので、cc-estat-13 (サンキーの手順記事) も完成図を載せられず、積み上げ棒で代用している
  3. `article-factual-check.mjs` が手順解説記事の本文の値の食い違いを検出できない形がある (cc-estat-04 の writer が値を書き換えて注入テストし、検出されなかった)。計算に使った入力 (総人口など) が data/ に無いと、その値も照合できない (it-industry-concentration の critic が公開 R2 から取り直して確かめた。calculated の JSON に入力の元値を持たせる運用にするか検討)。手順解説に限らず、単位が「戸」「倍」の数値も照合しない (dairy-cattle-hokkaido-monopoly で 4,970 戸を 4,790 戸に、1.44 倍を 1.54 倍に変えても pass した)
  4. 「秋田県の3位から青森県の46位まで」のように範囲を順位で書くと、`article-factual-check.mjs` が INVERSE_RANK_MISMATCH と誤検知する (physical-therapist-annual-income-prefecture-gap の writer が報告。言い回しを変えて回避した)
  5. 県名の直後に派生値 (2 県の差や目減り額など、data JSON の値から計算した数) を書くと、`article-factual-check.mjs` がその県の別の指標の値と取り違えて VALUE_MISMATCH の警告を出す (real-disposable-income-reversal の writer が「1,856円」「22,681円」で報告。文の組み立てを変えて回避した)
  6. `quality-gate.mjs` の NG_PATTERN「title 「N位」だけで終わる」の正規表現 (`/^title:\s*"[^"]*\d+位[^"]*"/m`) は、「N位」を含むタイトルをすべて止め、名前と判定がずれている (vacant-housing-vs-aging の writer が報告し、112 行目で確認)。「4位なのに空き家は37位」のように問いを作るタイトルも止まる
  7. `article-factual-check.mjs` は「N位の県」の順位と「◯%」の割合の誤りを検出しない (2026-10-08、school-teacher-annual-income の writer が一時コピーに 42位・3.8% を注入して pass を確認。年収の値 515.72 万円の注入は VALUE_MISMATCH で検出された)。計算型の図 (kind `calculated`) の割合は data JSON にあるので、照合の対象に足せる
- **次**: 1 はコードブロックを除いて数える (公開済み記事で誤検知・見逃しの件数を比べてから入れる)。2 は描画スクリプトの置き場 (例: 記事の data/ に置く `render-*.ts`) と restore の書き方を規約に足し、cc-estat-04 の 2 枚の描画スクリプトを保存する。3 は注入テストを再現して、照合から漏れる数値の書き方を特定する。
- **完了条件**: 1 と 3 の修正がテストで固定され、2 が規約に書かれ cc-estat-04 の図が repo のスクリプトから作り直せる。

### [BLOG-STACKED-BAR-LABEL-MOBILE-01] ブログの積み上げ棒で、狭い区分の値が図に出ないことと、スマホ用 SVG が無いことを直す
タグ: [コンテンツ品質] [種類:改善] [実行:対話] [検証:npx vitest run --root packages/svg-builder] [起票:2026-10-07] [領域:サイト]

- **事象 (2026-10-07、dairy-cattle-hokkaido-monopoly の writer が報告)**: `generateStackedBarSvg` は区分の幅が一定以下だと棒の中の値ラベルを出さない (横向きは幅 28 以下)。北海道のシェアを並べた図で、採卵鶏の 3.5% が図のどこにも数字で出なかった。また `generate-article-charts` は積み上げ棒のスマホ用 SVG (`-mobile.svg`) を作らないので、ランキング図と違ってスマホでは横長の図を縮めて見せている。
- **追記**: 横向きの積み上げ棒は幅 4.9% 未満の区分のラベルを出さず、比べる基準の縦線 (例: 全国平均 26.6%) も引けない (同じ記事の critic 対応で、9 地方の図と基準線を見送った)。
- **次**: 狭い区分の値を棒の外 (右端や凡例) に出す。基準線のオプションを足す。スマホ用のレイアウトを足して `generate-article-charts` から作る。公開済みの積み上げ棒 (2026-10 の監査で 4 枚程度) の見た目の差を比べてから入れる。
- **完了条件**: 狭い区分の値も図に数字で出ることと、スマホ用 SVG ができることを svg-builder のテストで固定している。

### [METRIC-HOUSEHOLD-DEFS-01] 家計調査系の 2 指標で、注記がデータと食い違う・同じ名前の値が 2 系統ある点を直す
タグ: [コンテンツ品質] [種類:不具合] [実行:対話] [検証:npm run validate:config --workspace=@stats47/data-configs] [起票:2026-10-07] [領域:データ]

- **2026-10-21 完了 (行削除は backlog-loop)**: 1: R2 の配信値で `information-communication-coefficient` の 47 都市の単純平均は 2020 年 5.40％ → 2024 年 4.18％ と下がっており、note の「全国的に上昇傾向」は誤りだった。実測の推移に書き換えた。2: `food-expenditure-ratio-multi-person-households` は社会・人口統計体系の指標「#L02411 食料費割合（二人以上の世帯）」(e-Stat 控えで確認) で、`engel-coefficient` は家計調査 年次表 0003348239 の県庁所在市・二人以上世帯の食料費÷消費支出。2024 年の 47 県平均は 27.79％ と 29.45％ で差を R2 で確認した。前者に subtitle・description・note、後者の note にも食い違いと「混ぜて比べない」を書き、定義シートで違いが読めることを確認した。差の原因 (社会・人口統計体系の算定方法) は確かめられていないので note に未確認と明記した。前者の yearFormat (fiscal) が正しいかは `METRIC-YEARFORMAT-KAKEI-01` の範囲。
- **事象 (2026-10-07、engel-coefficient-vs-prefectural-income の writer が報告)**:
  1. `information-communication-coefficient` の note に「全国的に上昇傾向」とあるが、writer の実測では R2 の 47 県の単純平均が 2020 年 5.40% から 2024 年 4.18% へ下がっている (note の文言は config で確認、R2 の推移は writer の実測で未再確認)
  2. 「エンゲル係数」の値が 2 系統ある。`engel-coefficient` (yearFormat calendar) と、姉妹記事 engel-coefficient-prefecture-ranking が使う `food-expenditure-ratio-multi-person-households` (タイトル「食料費割合」、yearFormat fiscal) で、2024 年の兵庫県が 33.4% と 31.8% に分かれる。critic の確認では 17 県すべてで 1.4〜2.3 ポイントの系統差があり、47 県の単純平均も 29.5% と 27.8% で違う。総務省の公表値と照合し、どちらがどの定義 (分母・世帯の範囲) かを確かめる
- **次**: 1 は R2 の推移を確かめて note を直す。2 は 2 指標の分母・対象世帯・年の扱いの違いを config の description/note に書き、記事がどちらを使うかを読者に示せるようにする。家計調査系の yearFormat の不揃いは別カード (家計調査の年の表記を直すカード) と合わせて直す。
- **完了条件**: 1 の note が R2 の推移と合い、2 の 2 指標の違いが定義シートで読める。

### [BLOG-SCATTER-LABELS-01] ブログの散布図に、本文で名指しする県の名前を出せるようにする
タグ: [コンテンツ品質] [種類:改善] [実行:対話] [検証:npx vitest run --root packages/svg-builder] [起票:2026-10-07] [領域:サイト]

- **事象**: `generateScatterSvg` は全点を同じ色の点で描き、県名を出せない。本文で「京都府は右上、三重県は左下」のように名指ししても、読者は図のどの点かを見分けられない。2026-10-07 の書き直しで unhealthy-period-gender-prefecture-gap の writer と engel-coefficient-vs-prefectural-income の critic が別々に報告し、どちらも本文に座標を書いて代用した。
- **追記 (2026-10-07)**: school-teacher-annual-income-prefecture-gap の critic も 3 件目として同じ報告をした (本文で名指しする愛媛県・長崎県の点が図で特定できない)。
- **次**: data JSON に名指しする県 (例: `labelAreas: ["26000", "24000"]`) を書けるようにし、その点だけに県名を添える。点の重なりで読めなくならない配置を `lintScatterQuality` の検査と合わせて決める (散布図は 720×720・単色の規格がある)。
- **完了条件**: 指定した県だけに名前が出ることと、指定が無い図の出力が変わらないことを svg-builder のテストで固定している。

### [BLOG-REFRESH-DERIVED-SCATTER-01] 図の年の取り直しスクリプトが、計算で作った散布図を取り直せない
タグ: [コンテンツ品質] [種類:改善] [実行:対話] [検証:node --test .claude/scripts/blog/lib/__tests__/refresh-chart-year.test.mjs] [起票:2026-10-07] [領域:サイト]

- **事象**: `refresh-article-data-years.mjs` は ranking の図だけを取り直し、source の kind が `derived-scatter` / `calculated` の散布図は「unsupported」として残す。2026-10-07 の書き直しでは real-disposable-income-reversal など複数の記事で、writer が散布図の x・y を R2 から手で取り直した。
- **次**: 散布図の source.json の入力 (x・y の rankingKey と年) から両軸を最新の共通年で取り直し、相関などの計算値を記録し直す機能を足す。両軸の最新年が違う場合は、そろう年を選び、どちらの年かを図の見出しに出す。
- **追記 (2026-10-07)**: school-teacher-annual-income-prefecture-gap の writer が、2022 年と 2023 年の年収の散布図を手作りの `kind: calculated` の source.json (年は 2023) で足した。refresh-article-data-years がこの形を取り直しの対象にするかは未確認で、この図も同じ問題を持つ。
- **追記 (2026-10-07)**: vacant-housing-vs-aging の writer によると、R2 の `app/correlation/by-ranking-key` に vacant-housing-rate と ratio-65-plus の組が無く、散布図を相関 snapshot から復元できなかった。writer はランキングの値から 47 点を結んで作り直し、人口規模を統制した偏相関 (旧版の 0.555) は再計算できないので記事から外した。
- **追記 (2026-10-07、同記事の critic)**: 最新年が指標ごとに違う組 (空き家率 2023 年 × 65 歳以上人口割合 2025 年) を相関 snapshot に持たせるか、記事ごとにランキングの値から作り直す運用を規約にするかを決める。
- **完了条件**: 散布図を含む記事で取り直しが手作業なしに終わることを、テストで固定している。

### [BLOG-REVISE-PATTERNS-01] 図の年の書き直しで critic が繰り返し REVISE にした型を、writer の規約か gate に入れる
タグ: [コンテンツ品質] [種類:改善] [実行:対話] [起票:2026-10-07] [領域:サイト]

- **事象**: 2026-10-07 の 22 本の書き直しで、critic (blog-critic) の REVISE が同じ型で繰り返した。writer の指示書にも規約にも無く、毎回 critic の目視で見つかっている。
  1. 関連記事の紹介が、同時に書き直した姉妹記事の新しいタイトル・内容と食い違う (unhealthy-period-gender-prefecture-gap と healthy-life-expectancy-male-female-gap)
  2. 地域のくくり (「近畿・関東」など) が、地方別の平均で確かめると支えられない (unhealthy-period-gender-prefecture-gap)
  3. 相関係数の向き (高いほど高いのか低いのか) が書かれていない、または前後の説明と食い違う (fiscal-self-reliance-gap)
  4. 本文の値と図の年が違うのに理由が書かれていない (area-ratio-prefecture-gap)
  5. 料金・製品仕様を出典なしで断定する (ai-claude-code-pref-analysis)
- **次**: 機械で判定できるものを gate にする。1 は本文の `/blog/<slug>` リンクの表示名と、リンク先の現在のタイトルの照合で判定できる。4 は図の data JSON の年と、同じ節の本文の年の照合で候補を出せる。2・3・5 は `blog-quality-standards.md` と article-writer の指示に書き、critic の観点に残す。
- **停止条件**: 誤検知の多い gate を blocker にしない。公開済み記事に当てて誤検知を数え、0 件の境界で入れる (stats-table-id-lint と同じ手順)。
- **完了条件**: 1 と 4 の検査が quality-gate に入り、公開済み記事での誤検知 0 件をテストで固定している。2・3・5 が規約に書かれている。

### [BLOG-CC-ESTAT-WORKERS-01] 公開中の Claude Code 連載 2 本が配信先を「Cloudflare Pages」と書いている表記を Workers に直す
タグ: [コンテンツ品質] [種類:不具合] [実行:対話] [検証:node .claude/scripts/blog/quality-gate.mjs <slug>] [起票:2026-10-07] [領域:サイト]

- **事象**: stats47 の配信先は Cloudflare Workers (OpenNext) だが、`cc-estat-18-cache-r2` と `cc-estat-19-skill-pipeline` の本文に「Cloudflare Pages」の表記が残っている (2026-10-07、連載の最終回 cc-estat-20 を書き直した writer が報告)。cc-estat-19 のトークン作成例には、使っていない D1 の Edit 権限も含まれている (cc-estat-20 の critic が報告)。cc-estat-18 の `wrangler r2 object put` の例には `--remote` が無く、wrangler 4.148.0 ではローカルに書いてしまう。`remote = true` のときは `preview_bucket_name` を外す注意も要る (cc-estat-20 の writer がローカルで再現)。cc-estat-20 も本文は Workers に直したが、タグは未登録の `CloudflareWorkers` にすると 410 になるため `CloudflarePages` のままにしてある。記事の tags の `CloudflarePages` を `CloudflareWorkers` に替えるには `apps/web/src/config/known-tag-keys.ts` の再生成が要る (未登録のタグは 410 になる)。
- **次**: 2 本を R2 から contents/blog へ取り、本文の表記とコード例 (`runtime = "edge"`・`wrangler pages deploy` など) を公式ドキュメントで確かめて直す。タグを替えるなら known-tag-keys の再生成を同じ変更に入れる。blog-critic を通して公開する。
- **完了条件**: 2 本の本文に Pages 前提の記述が残っておらず、critic PASS で再公開されている。


### [GSC-COVERAGE-DEPLOY-01] カバレッジ是正後の再クロールと残存ソフト404を確認する

タグ: [インフラ・計測] [種類:不具合] [実行:対話] [検証:node .claude/scripts/gsc/build-coverage-queue.mjs --no-probe] [起票:2026-09-07] [期日:2026-10-23] [進行中] [領域:サイト]

- **GSC案08 / P2（次に着手・coverage内優先1）**: 現sitemap内soft404の15 URLを公開URLテストと修正後クロールで再評価する。
- **GSC案09 / P2（次に着手）**: クロール済未登録146 URLをテンプレ別に分け、登録済み同種ページと本文・重複・検索意図を比較する。
- **GSC案10 / P2（次に着手）**: 検出未登録971 URLを検索需要・公開後日数・内部リンク・独自性で順位付けする。各URLへ対応要否と根拠を残す。
- **GSC案14 / P2（次に着手）**: streaming HTMLの断片で空ページと判定せず、ブラウザー表示とGoogle公開URLテストの本文・資源を照合する。
- **GSC案15 / P2（次に着手）**: 案09で固有情報不足が確認された県ページから、全国差・推移・近隣比較・集計注意を補う小規模案を作る。単純な文字数増加や47県一括rewriteはしない。
- **GSC案36 / P2（次に着手）**: 固定URL群に変更日・修正後クロール・登録・検索表示・クリックを結び付ける。計測契約が完成したら既存改善台帳へ引き渡し、反復観測だけのbacklogを増やさない。
- **owner**: gsc-analyst（最新入力との照合・再クロール観測）
- **現状**: 2026-09-07にPR #939（main `5d05cd6e1`）で本番反映済み。PR CI、Cloudflare deploy、post-deploy smoke、R2 ISR GC、CDN全体パージはすべて成功した。Googlebot UA実測で旧市区町村カテゴリsoft404 5件は全件301、親プロフィール200、未知カテゴリ410 + noindex。sitemapは旧カテゴリ0件 / 市区町村プロフィール360件、自治体Datasetは`description` / `license` / `distribution.contentUrl`を本番HTMLで確認した。
- **①は確認済 (2026-09-18)**: `fetch-metrics-weekly.yml` は 2026-09-13 run が success、`coverage-alert` Issue は 0 件。
- **次 (2026-10-16 更新)**: 現sitemap内soft404 15件は本文・固有数値・自己canonical・index可・流入hrefと本番HTTP200を確認し、内容判定をobserve-after-fixへ移してin-progressを維持。代表3件のGoogleライブテストは合格、15件中11件の登録リクエストをGSCが受理した。1日割当超過で未送信の4 URL（栃木local-finance、静岡/茨城/福井labor-wages）は証跡のrelease.indexingRequests.remainingUrlsが正本。自動化gsc-4が毎日09:00 JSTに未送信分だけ処理し、全件受付後に停止する。10-23に修正後のlastCrawlTime・登録状態を既存の日次Inspectionで再確認し、未再クロールならサイトマップ再取得・クロール統計を照合する。現在200・ライブテスト合格・送信受理だけで登録済みとしない。根拠: `data/gsc/ui-audits/2026-10-16-remediation.json`。
- **優先対象の絞り込み案 (10-16)**: UI例示と現sitemapが重なるsoft404 15件・クロール済未登録146件・検出未登録971件の計1,132 URLを候補母集団にする（全件の現HTTPは未検査）。検出未登録977件の内訳はranking485・areas329・municipalities108・blog37など。需要・最終クロール・内部リンク・本文の独自性で優先付けし、まず既存15件と需要のある小標本を調べる。streaming HTMLのmain文字数0だけで空ページと判定せず、実レンダリングとGoogle公開URLテストを照合する。
- **観測の判断条件**: 登録済み6,700とsitemap6,574は対象集合が異なるので割り算しない。固定した対象URL群で修正後クロール・登録・検索表示・クリックを追い、未登録総数の減少だけを成功にしない。UI監査（10-12）と既存coverage入力（10-04）の鮮度を分け、取り込み時は既存CSV/manifest gateを通す。既存lastmodは実際の本文/データ更新を表すかを確認し、確認できない日時を捏造して一律更新しない。
- **停止条件**: 古いW32入力を当週データとして再生成しない。通常ページへGoogle Indexing APIを送らない。デプロイ前のURLを同一観測窓へ混ぜず、Google再クロール前の件数不変だけでeffect/noneにしない。
- **完了条件**: develop→mainのCIがgreenで、上記の本番HTTP・構造化データ・sitemap検証がすべて合格する。失敗時の`coverage-alert`起票と、回復時の自動closeを少なくとも一方はGitHub Actionsで実測し、デプロイ後exportで市区町村カテゴリsoft404が0になる。

- **登録リクエスト残件の受付完了（2026-10-17）**: 栃木local-finance、静岡/茨城/福井labor-wagesの4ページは本番200・自己canonical・index可・県固有の表示数値を確認し、GSCで各1回の通常リクエストが全て受理された。前日分と合わせ15/15受付済み。未送信0件となったため自動化gsc-4だけをPAUSEDにした。Google保存状態は依然soft404で、登録完了・件数改善は未確認。10-23の修正後クロールと登録確認を維持し、このカードは進行中とする。

### [NOTE-FISCAL-PEER-PUBLISH-01] 財政指標の同規模比較 note 2 本 (#12 コード版 / #13 コードなし版) を Mac から公開する

タグ: [収益化] [種類:制作] [実行:別環境] [起票:2026-09-29] [期日:2026-10-06] [領域:商品]

- **現在地 (2026-10-13)**: 2 本とも 2026-10-12 に公開済み (#12 `n527e817995e9`・#13 `n20299fc77b17`、各 ¥300)。有料境界は screenshot で確認済み。
  残りは完了条件の最後の 1 点 (公開日 + 28 日 = 2026-11-09 の売上比較を `improvements.md` 側へ引き渡す) だけ。
- **2026-10-19 追加**: `NOTE-PRODUCT-LADDER-01` が #13 (コードなし版) を無料の橋渡し記事にする予定。この比較を壊さないよう、11-09 の売上を記録するまで #12・#13 の価格を変えない。note ダッシュボードの取得が 10-12 から失敗しており (`NOTE-DASHBOARD-COLLECT-01`)、直らなければ 11-09 の比較は判定不能になる。
- **owner**: オーナー (Mac で `/publish-note` を実行・有料境界を目視承認) / note-manager (公開後の state 記録)
- **対象**: `koumuin-estat-claude-code` の `12-fiscal-peer-comparison` (有料 ¥300・e-Stat API + Python) と `13-fiscal-peer-no-code` (有料 ¥300・Claude / ChatGPT にプロンプトを貼るだけ)。原稿は commit `328a498ee` で develop の `docs/31_note記事原稿/koumuin-estat-claude-code/<slug>/` に入っている。有料原稿は `sync-drafts-r2.mjs` が公開側 R2 への移送を拒否する設計なので、公開までは git に残る (R2 は 404 を確認済み)。note-critic は 2 本とも PASS。
- **なぜ Mac か**: `publish-new-note.sh` が Mac のパスと osascript を前提にしており、Windows には browser-use も無い (2026-09-29 確認)。
- **なぜ 2 本同時か**: 売れた note 3 本 (各 ¥300) はすべて AI × e-Stat の技術記事だった。コードを書く層と書かない層のどちらが買うかを、同時公開した 2 本の売上で比べる。
- **手順** (Mac・`note.com/stats47` にログイン済みの Chrome Profile 5):
  1. `git pull origin develop` で原稿を取得する。R2 には無いので `restore-from-r2.sh` は使わない。
  2. PNG を作り直す (資産ポリシーで PNG は git に入れていない)。先に `.claude/scripts/note/regenerate-svg-png.sh docs/31_note記事原稿/koumuin-estat-claude-code/12-fiscal-peer-comparison` を実行し (13 も同様)、そのあと `node .claude/scripts/note/generate-koumuin-covers.cjs --slug <slug>` で表紙を背景入りに上書きする (順序を逆にすると表紙が背景なしになる)。
  3. **#12 を先に公開する**: `/publish-note 12-fiscal-peer-comparison`。有料境界は「手順 2: 「－」を正しく処理する」の見出しの直前にあることを screenshot で目視してから確定する。マガジンはシリーズ「公務員のための e-Stat × Claude Code 実務ガイド」に入れ、note 上の既存マガジン「自治体財政」にも入れるかはその場で決める。
  4. #13 の本文にあるシリーズ内リンク `../12-fiscal-peer-comparison/draft.md` と `../08-benchmark-table-5min/draft.md` を、それぞれの note の URL に置き換える (#12 の原稿にある `../06`・`../07`・`../08`・`../09`・`../10` のリンクも公開前に同じく置き換える。URL の対応表は `data/note/note-published-urls.json`)。
  5. `/publish-note 13-fiscal-peer-no-code` で公開する。有料境界は「手順 2: AI に渡す前に知っておく 3 つの約束事」の直前。
  6. (2026-10-13 済) 公開記録は記事台帳 `data/note/articles.json` に書き、派生インデックスを再生成した。
  7. (2026-10-13 済) 完全原稿は `note:article save` で private R2 に保存し、docs/31 は git から外した (旧 `publish-paid-note-private-r2.ts` は廃止)。
  8. 図の位置を `node .claude/scripts/note/audit-note-figure-split.mjs` で確かめる。`ins_img` は見出し直前の段落をアンカーにすると画像が 1 ブロック後ろにずれる既知の不具合がある (`NOTE-INS-IMG-HEADING-PLACEMENT-01`)。
- **禁止**: 有料境界を目視せずに確定しない (有料部分が無料で見える)。予約・即時の別はオーナーが決める。
- **停止条件**: Phase 1 のアカウント照合で `stats47` と一致しなければ 1 本も投稿しない。
- **完了条件**: 2 本が note で公開され、`note-published-urls.json` に 2 件の URL があり、無料部分と有料部分の境界が意図どおりであることを screenshot で確認済み。公開日から 4 週間後 (公開日 + 28 日) に 2 本の売上を note ダッシュボードで比べる予定を `improvements.md` 側へ引き渡す。

### [BLOG-TEXT-CHART-CONFLICT-20261006] 図を一次資料から作り直した 3 記事で、図と食い違う本文を直して再公開する
タグ: [コンテンツ品質] [種類:不具合] [実行:対話] [起票:2026-10-06] [領域:サイト]

- **経緯 (2026-10-06)**: `alcohol-prefecture-map` / `automotive-industry-transformation-map` / `birth-death-gap-decline` の図を R2・国税庁「酒のしおり」から作り直し、図だけ R2 に反映した (`regenerate-blog-svgs.yml` の source-repair → all)。blog-critic の差分審査で、図と同じ節の本文に図と食い違う記述が見つかった。本文は旧来のゲート負債 (下記) で再公開できず、まだ直っていない。
- **直す本文 (critic BLOCK/MAJOR・数値は確認済み)**:
  - automotive「愛知県だけが他県の3倍近い水準にある構図は、2005年以降一貫して変わっていません」→ 2 位との比は 2005 年度 2.0 倍・2023 年度 2.9 倍。「差は広がっている」に直す。NOTE の「構成比が約40%」は散布図の時点の値であり、2023 年度の 58 兆円には当てはまらないと書く。年と年度の表記を「年度」にそろえる。
  - birth-death「東京都は微増〜横ばい」→ 2024 年は −3.7‰ の自然減 (沖縄に次いで 2 番目に小さい)。「転入超過が補う」は社会増減と自然増減の取り違え。図は 2024 年なので節の年もそろえる。
  - alcohol「焼酎9.4%」→ 一次資料からの計算は 9.45% で 9.5% (minor)。
- **再公開を止めている負債 (`quality-gate.mjs`)**: automotive = 手書きの「データ出典」節・県名直後の括弧数値 12 件・他 4 図の data JSON 欠落 / alcohol = 内部リンク 0・括弧数値 1 件・他 3 図の data JSON 欠落 / birth-death = 合計特殊出生率の図の data JSON 欠落。
- **次**: 3 記事を `/brushup-blog --target article` で是正し、critic PASS 後に公開する。記事詳細は prerender なので本文の反映には再デプロイが要る (`nextjs-ssg-preservation.md`)。
- **完了条件**: 3 記事の本番本文に上記の食い違いが無く、`quality-gate.mjs` が blocker 0。

### [GEO-QGIS-DEMAND-01] QGIS の使い方ブログ 3 本で需要を測り、note「国土数値情報をQGISで扱う」を作るか決める
タグ: [収益化] [種類:制作] [実行:対話] [起票:2026-10-03] [領域:サイト]

- **経緯**: 2026-10-03 に doboku-note のセッションで QGIS 教材の需要を調べ、読者層が重なる stats47 で扱うとオーナーが決めた。事業計画には note「国土数値情報をQGISで扱う」¥1,980 (`d-geo-ksj-qgis-guide`・gated) と「AIにPyQGISを書かせる検証法」¥2,980 がある (`packages/data-configs/src/business-plan/content-opportunities.ts`)。
- **需要の実測 (2026-10-03)**:
  - 関心はある: Google Trends (日本・5 年) で QGIS は ArcGIS の約 1.6 倍、2024 年以降は横ばい。Google サジェストは 849 語で、悩みは初級操作 (インストール・CSV の文字化け・地理院タイル・座標系・属性・印刷) に集中。国土数値情報の関連語は約 50 語。
  - 支払意欲は小さい: Udemy の日本語 QGIS 専門講座は 1 本で受講 373 人 (セール ¥2,000)。ココナラ「QGIS」36 件のうち教える系の販売実績は最大 3 件 (代行は最大 15 件)。note の有料 QGIS 記事は最多スキ 20。国内 YouTube は最大で登録 2,410 人。
  - 無料が強い: 公式日本語ドキュメント 3.44 (翻訳 100%)、MIERUNE「QGIS LAB」、国交省「国土数値情報 QGIS 操作マニュアル」(47 頁)。書籍の対象版は 3.16〜3.28 止まりで、QGIS は 4.x への移行期 (3.44 LTR と 4.x 系が併存)。
  - 主な利用者は自治体職員・研究者・データ分析系 (求人ボックス「QGIS」137 件、公的研修は自治体・林業向けが中心)。
- **切り口**: 汎用の基本操作は書かず、stats47 の Geo 分析を QGIS で再現する手順に絞る (収益化戦略の「再現パック」と同じ線)。スクショは PyQGIS で自動撮影し、QGIS の更新時に一括で撮り直せるようにする。
- **次 (実行順)**:
  1. 判定基準を公開前に決めて記録する (例: 公開 8〜12 週後の GSC 表示回数・クリックを、同時期に公開した stats47 ブログの中央値と比べる)。
  2. QGIS をインストールし (`brew install --cask qgis`・約 1GB。実行前にオーナー確認)、試し撮り 1 本で PyQGIS 撮影の手順を固める。
  3. 無料ブログ 3 本を作る: ① 国土数値情報を QGIS で読み込む (CRS・文字化け・属性の確認) ② 都道府県の統計 CSV を QGIS で色分け地図にする (コードでの結合) ③ 洪水区域×人口メッシュを QGIS で再現する (`/geo` の分析へ着地)。
  4. 判定日に基準と比べ、note の制作へ進むか止めるかを決める。
- **禁止・停止条件**: 入力データと背景地図は `geo-analysis-standards.md` の商用公開 Gate と `license-policy.ts` で商用可を確かめたものだけ使う (Google マップ等は使わない)。公開はサイト領域の月 15〜20 本の上限内で行う。基準を下回ったら note は作らず、このカードを削除する。
- **完了条件**: 3 本が公開され、判定日に基準との比較結果と note 制作の Go / Stop がこのカードか月次レビューに記録されている。

### [BLOG-REMEDIATION-PROOF-01] ブログ品質是正キューで 1 本をゲートと critic まで通すか、是正を計画から外すかを決める
タグ: [コンテンツ品質] [種類:意思決定] [実行:対話] [起票:2026-10-02] [領域:サイト]

- **経緯**: 是正キュー (`data/blog/remediation-queue.json`) の「1 本だけ通す」は W35〜W39 の 5 週連続で未達で、どの台帳にもカードが無かった (W39 レビューに「backlog ID なし」と記録)。
  done は W35 25 → W39 18、must-fix pending は 32 → 50 で、W38 レビューは done の減少を記事の再劣化ではなく母集団の入替と特定している。
- **次**: `/brushup-blog --target queue --next 1` で 1 本を quality-gate と blog-critic PASS まで通す。通せない場合は、その理由を書いて月次計画の対象から外す。
  キューの報告は status 遷移と母集団の追加・削除を分けて出す。
- **完了条件**: 1 本の `remediated_at` と critic PASS の review.md が残っているか、オーナーが是正を計画から外す判断をこのカードに記録している。

### [ADMIN-MCP-STATUS-01] 管理画面で、この PC が使う MCP の一覧と接続状況を見られるようにする
タグ: [インフラ・計測] [種類:改善] [実行:対話] [起票:2026-09-28] [領域:管理]

- **目的**: どの MCP を何のために使い、この PC で今つながるのかを 1 画面で確かめる。今はセッション開始時の通知でしか分からず、未認証が何日も放置される。
- **表示する列**: サーバー名 / 用途と使うスキル / 有効か (`.claude/settings.json` の `enabledMcpjsonServers` とこの PC の `settings.local.json` の無効化) / 認証方式 (OAuth・トークン・なし) / トークンが資格情報ストアにあるか (値は出さない) / 接続確認の結果 (HTTP サーバーへの `initialize` の応答コード)。
- **設計の制約**: 接続状況は PC ごとに違うので、git や R2 の state に保存せず、画面を開いたときにその PC で調べる。管理画面は各 PC のローカル (`npm run admin`) で動くので、この形でそのまま両 PC の状態が見える。置き場は既存の「CI・台帳」(`apps/admin/app/ops/`) の 1 節か、隣の 1 ページにする。
- **完了条件**: Windows と Mac で画面を開き、各 MCP の行が実際の `/mcp` の表示と同じ状態を示す。

### [ADSENSE-RESTART-01] AdSense を個人のお支払いプロファイルで作り直し、Cloudflare の維持費の相殺として再開する
タグ: [収益化] [種類:改善] [実行:ユーザー] [領域:アフィリエイト] [起票:2026-09-28]

- **決定 (2026-09-28 オーナー)**: 9/20 の「恒久停止」を改め、Cloudflare の維持費を相殺する目的で再開する。
  根拠: Cloudflare の請求は月 ¥1,556〜1,846 (直近 3 か月・税込み、`cloudflare-cost-improvement/reference/weekly-snapshots/2026-W33〜W38.json`)、
  AdSense の見込みは月 ¥1,400〜1,800 (停止前のページ RPM ¥37、`adsense-improvement/reference/improvement-log.md`)。
- **経緯の正本は Obsidian vault の `memos/副業の経理と確定申告.md`** (「AdSense のお支払いプロファイルが『組織・兵庫県庁』になっている」節)。
  旧アカウント (pub-7995274743017484) はお支払いプロファイルが誤って組織・兵庫県庁で登録され、本人確認・閉鎖・プロファイル閉鎖が
  循環してロックされた。8/18 の最終プラン = 8/19 の期限切れで利用停止 → サイトから旧コードを外す (8/29 の全停止で済み、
  9/18 に本番 `adsbygoogle` 0 件を確認) → uruhayato373 の個人プロファイルで新規申請。Google 公式 answer/10163
  「既存アカウントの利用を停止してから新しい種類のアカウントを開設する」に沿う。stats47 のリポジトリには記録が無かった。
- **アカウント作成の方針 (オーナー承認済み)**:
  - Google アカウントは **uruhayato373 だけ**で AdSense とお支払いプロファイルの両方を作る (8 月は管理者が dicechick373 に分かれ権限エラーになった)。
  - お支払いプロファイルは **個人**。受取人名は写真付き身分証と完全一致する本名。振込口座は本人名義。
  - 既存プロファイル (dicechick373 の個人 0714-… を含む) は流用しない。
  - サイトは stats47.jp だけで申請し、doboku-note は承認後に同じアカウントへ追加する (1 名義 1 アカウント)。
  - 審査中のサイト確認は **meta タグか ads.txt** で行い、広告コードは入れない。承認後も自動広告・広告インテントはオフ、手動枠だけ
    (2026-08 に自動広告が出典の文言をリンクへ書き換えた。`google-anno-skip` は外さない。`affiliate-ads-standards.md` §12)。
- **次 (実行順)**:
  1. (オーナー) 旧アカウントが利用停止か無効化の状態であることを確かめる。勤務先の兼業確認は vault でも別扱いで、申請前に本人が確認する。
  2. (オーナー) uruhayato373 で AdSense に申請し、個人のお支払いプロファイルを作る。発行された `pub-…` を伝える。
  3. (Claude) 確認用の meta タグか ads.txt を入れる。`ADSENSE_DISPLAY_ENABLED` は false のまま (広告は出さない)。本番反映はオーナー承認。
  4. 審査結果を待つ。「重複アカウント」で拒否されたら、その画面を添えてサポートに旧アカウントの閉鎖を依頼する (依頼文は 8/18 に作成済み・vault 参照)。
  5. (Claude) 承認後、手動の広告枠の配置を設計し、`docs/00_プロジェクト管理/02_収益化戦略.md` §3.1 と memory `project_monetization_contract` の
     「恒久停止」を改訂する。配置はアフィリエイトの実験窓 (`AFF-IMPRESSION-ROUTING-01` 等) と交絡しないよう区切り日を記録する。
- **停止条件**: 旧アカウントと並行して新規アカウントを作らない (重複アカウント扱い)。組織タイプを選ばない。承認前に広告コードを入れない。
- **現在地 (2026-10-08)**: 手順 2 済み (新 ID `pub-9055416085403520`)。手順 3 済み: ads.txt・本番 build env・`google-adsense-account` meta を新 ID へ替え (`ADSENSE_DISPLAY_ENABLED` は false のまま)、hotfix PR #1105 で本番反映 (2026-10-08 15:01 JST、main `56d28e9`、Deploy run 37735390296 success)。本番で `curl -s https://stats47.jp/ads.txt` が新 ID、`adsbygoogle` 0 件を確認。meta はトップ・ranking (`article:modified_time` 付きを含む)・blog・themes・areas の全種別で出ている (Next.js が `other` を結合する。ローカルで見えなかったのは確認方法の誤り)。同日、AdSense 画面の ads.txt 方式で**所有権確認が通った** (「AdSense コード スニペット」方式は広告スクリプトを探すので失敗する)。次 = 手順 4: 審査の結果待ち。ローカルの `apps/web/.env.development` は旧 ID のまま (Claude は .env を編集できない。オーナーが書き換える)。
- **現在地 (2026-10-11)**: 審査が承認された。**AdSense の所有者は stats47 専用の Google アカウント**で、上の方針 (uruhayato373 だけ) とは違う (内部ブラウザでは uruhayato373 が `authuser=0`、stats47 が `authuser=1`)。同日、AdSense の画面で自動広告がオフ (インテント重視のフォーマットも無効表示) を確認し、手動の広告ユニットを配置ごとに 11 個作った (右レールのアフィリエイト枠が意図なしページで AdSense に切り替わるときの専用ユニットを含む) (`stats47-<配置>`。ID と配置の対応は `apps/web/src/lib/google-adsense/constants.ts`)。コードは全 slotId を新 ID に替え、ランキング末尾とその他末尾の Multiplex を別ユニットに分け、`ADSENSE_DISPLAY_ENABLED` を true にした。配置はオーナーの指示 (「色々と試しながら計測記録改善」) で停止直前の手動枠をそのまま戻し、ユニット別の実測で外す・動かすを決める。10-08 の方針案 (1 枠 1 担当・アフィリエイトは意図が解決する本文中・AdSense はアフィリエイトの弱い右レールと意図の無いページ・モバイル手動枠は戻さない) は、実測後の改善候補として扱う。収益化戦略 §3.1・関連 rules・メモリを再開後の記述へ改訂した。**本番反映: 2026-10-11 15:43 JST に PR #1123 を main へマージ** (merge commit `cd80b60`、Deploy run 38118994278)。**アフィリエイト実験の比較窓の境界は 2026-10-11** (この日を含めずに前後を分ける)。デプロイ前の本番は `adsbygoogle` 0 件 (ranking・home・blog の 3 ページで実測)。AdSense の「サイト」画面で stats47.jp は「準備完了」、ads.txt は「承認済み」(2026-10-11 確認)。
- **デプロイ後の本番確認 (2026-10-11)**: Deploy run 38118994278 は 15:59 に success。ヘッドレス Chromium でランキングページを開くと `adsbygoogle.js` が新 publisher ID で読み込まれ、デスクトップで 4 ユニット (table-side・rail-top・sidebar-affiliate-fallback・ranking-footer-multiplex)、モバイルで 3 ユニットが広告リクエストを出した。直後の状態は全ユニット `data-ad-status="unfilled"` (新ユニット直後・ヘッドレスのため、配信の有無は実ブラウザと AdSense のレポートで後日確かめる)。本文書き換えの smoke (apps/web で `PLAYWRIGHT_TEST_BASE_URL=https://stats47.jp npx playwright test --config playwright.smoke.config.ts third-party-dom-injection`) は 3/3 緑。**記事内広告 (in-article) は全枠が `No slot size for availableWidth=0` で消えていた** (外枠が flex の items-center で ins が 0 幅)。`ins` に `width:100%` を足す修正を PR #1124 で出した。
- **残り (実行順)**: ① ~~デプロイ~~ 済み (上記) ② ~~本番の広告タグと smoke の確認~~ 済み (上記)。PR #1124 は 2026-10-11 16:12 JST にマージ (merge commit `bca0286`、Deploy run 38120604593)。デプロイ後、ブログ (デスクトップ 3 枠)・テーマ (stats47-hub-incontent)・ランキングのモバイル中段 (stats47-ranking-incontent-mobile) の記事内広告が TagError 0 件で広告リクエストを出すことを確かめ、本文書き換えの smoke も 3/3 緑で再確認した。11 ユニットすべてが本番で広告リクエストを出すことを観測した (ranking・blog・themes・home・`/municipalities`・`/areas/13000`。直後は全て unfilled で、配信が始まったかは AdSense の広告ユニット別レポートで確かめる) ③ (オーナー) 今の GA4 の管理者アカウント (uruhayato373 は GA4 に権限が無い) で、プロパティ 463218070 に stats47 アカウントを管理者として追加する。GA4 は作り直さない (履歴・測定 ID・CI の権限・カスタムディメンションを失う) ④ (Claude) stats47 アカウントで AdSense の「Google アナリティクスとの統合」からプロパティ 463218070 をリンクする ⑤ (オーナー) 週次取得の API を戻す: stats47 アカウントで `.claude/scripts/adsense/oauth-setup.js` を実行して refresh token を発行し、GitHub の Secret と Variable `GOOGLE_ADSENSE_ACCOUNT_ID` (今は旧 `pub-7995274743017484`) を新アカウントへ替える ⑥ 4 週の実測 (ユニット別の収益・視認率、GA4 の PV で割った `ad-yield`、CWV) で効かない枠を外す・動かす。モバイルの手動枠 (W31 に外した記事内・フッター) を戻すかもここで決める。候補: home のレール枠 (stats47-hub-rail) は 2026-10-11 の実測で幅 262px しかなく 300×250 が入らない (ランキングのレールは 300px 以上)。ユニット別の表示単価が低ければ幅の確保か撤去を比べる。
- **2026-10-13 改善サイクルの凍結解除**: 再開後も計測と改善の仕組みが 9/20 の「恒久停止」の前提のまま凍結されていたので、次を直した。
  ① 週次収益 (NSM): `generate-weekly-metrics-issue.mjs` が AdSense を「恒久停止で ¥0」と固定で出していたのを、`.claude/scripts/metrics/lib/adsense-revenue.mjs` に置き換えた。停止中 (W35〜W41) は ¥0、再開後は `data/adsense/history.csv` の確定 7 日収益を出し、行が無い週は「判定不能」と書く。
  ② KPI `ad-yield`: `measurement-cycle.mjs` で「AdSense 確定 7 日 × 4 週の収益 ÷ GA4 Japan PV 28 日 × 1,000」として接続した。再開前の週を含む窓は `pending` (値なし)、AdSense の行が 1 週でも欠ければ `missing`。最初の値は W42〜W45 がそろう 2026-W45 (2026-11-13 金曜の週次計測)。事業計画 catalog の `ad-yield` を `measured` にして kpi-tree を再生成した。
  ③ 週次 workflow: 9/26 に外した AdSense 施策の before/after (`npm run metrics:adsense-impact`) を `fetch-metrics-weekly.yml` に戻した (出力 `data/adsense/impact-LATEST.md`)。取得・ユニット突き合わせ・候補生成の段は止まっていなかった。
  ④ 運用文書: `/adsense-improvement` と `/fetch-adsense-data` の凍結注記、週次計画の「AdSense の候補は採用しない」、週次レビューの NSM・AdSense 節、affiliate-manager の「AdSense 停止の維持確認」、improvement-triage の受け取り元、pre-mortem・growth-loops・monetization-strategy、`data-storage.md`・データ台帳 `config/datasets.mjs`・改善ログ冒頭・収益化戦略 §3.1/§3.2・docs/02/42 を再開後の記述に改めた。
  ⑤ GitHub の Variable `GOOGLE_ADSENSE_ACCOUNT_ID` を `pub-9055416085403520` に替えた (refresh token は旧アカウントのままなので、手順⑤のオーナー作業が済むまで取得は権限エラーのまま)。
  **進捗 (2026-10-13 夕)**: 上の変更は develop→main の PR https://github.com/uruhayato373/stats47/pull/1133 で出した (CI の書き戻しコミットが先頭になり必須の Code Quality Check が起動しなかったので、この追記のコミットで起動し直した)。refresh token は Console の OAuth クライアント `1044264339032-22l15n9…` で Client Secret を追加し、`oauth-setup.js` を stats47 アカウントで認可して発行する。1 回目は Client ID を Secret 欄に入れて `invalid_client` になった (Secret は `GOCSPX-` で始まる)。
  **手順⑤ 完了 (2026-10-13)**: stats47 専用アカウントで `oauth-setup.js` を認可し、`accounts.list` が `accounts/pub-9055416085403520` の 1 件を返すことを確かめてから、GitHub Secret `GOOGLE_ADSENSE_REFRESH_TOKEN`・`GOOGLE_ADSENSE_CLIENT_SECRET` を差し替えた (Client Secret は OAuth クライアント `stats47-adsense-cli-v2` に 2 本目を追加。旧 `****xah6` は同日オーナーの指示で無効化→削除し、残るのは 2026-10-13 発行の 1 本だけ。新しい値は token 発行の時点で Google に受理されている。手元の .env と doboku-note の Secret に同じ変数が無いことも確かめた)。PR #1133 は auto-merge (merge commit) を有効にした。**次の確認**: 2026-10-16 (金) の定期実行で `data/adsense/snapshots/2026-W41/manifest.json` の `status` が error でない (W41 は配信停止中なので 0 行が正しい)。10-18 以降に `gh workflow run fetch-metrics-weekly.yml --ref main -f week=2026-W42` で再開初週の行が `history.csv` に入ることを確かめる (定期は 10-23)。
  **手順③④ 完了 (2026-10-13)**: オーナーが GA4 プロパティ 463218070 に stats47 アカウントを管理者として追加し、Claude が内部ブラウザ (stats47 アカウント・`authuser=1`) で GA4 管理 →「Google AdSense のリンク」から `pub-9055416085403520` (コンテンツ向け AdSense・収益データレポート オン) をリンクした。リンク一覧に新旧 2 件が並ぶ。旧 `pub-7995274743017484` (2026-03-12 リンク) のリンクは同日オーナーの指示で削除し、一覧は新 1 件だけになった (旧アカウントの AdSense データは GA4 のレポートに出なくなるが、過去分は `data/adsense/history.csv` に残る)。GA4 の AdSense 連携で `ad_impression` などが再び自動生成されるので、自前の `affiliate_impression` と混ぜない (`analytics-event-standards.md`)。
  **運用の決め事**: 再開後 4 週 (W42〜W45 = 10-11〜11-07) はベースライン期間で配置を変えない (表示の不具合の修正だけ)。W46 以降、週次レビューで審査した人間承認済みの配置変更を最大 1 件/週。施策 ID は `ADSENSE-PLACEMENT-01`。同日、期限切れの 3 件 (`DEPS-RENOVATE-01`・`PERF-WORKER-P99-01`・`R2-STORAGE-01`) をオーナー指示で active から外して backlog 🟡 へ移し、空いた枠に登録した (Due 2026-11-14)。手順⑥の判定はこの施策行で行う。
  **残り**: 手順⑤ (オーナー: stats47 アカウントで refresh token を発行し Secret を差し替える。済んだら `gh workflow run fetch-metrics-weekly.yml --ref main -f week=2026-W42` で再開初週を取り直し、`data/adsense/snapshots/2026-W42/manifest.json` の `status` が error でないことを確かめる)・手順③④ (GA4 との連携)・週次 workflow とスクリプトの変更は main の定義で動くので、develop→main のマージ後に効く。
- **追記 (2026-10-07)**: オーナーは回収経路の一つを「アクセス集客で AdSense」と整理した (収益化戦略 §3.5)。同日、§3.1 の冒頭とメモリ `project_monetization_contract` に 9/28 の再開決定 (審査待ち) を書き足した。全面改訂は引き続き承認後に行う。見込みの注意: 再開後は手動枠だけなので、2026-W31 の実測 (手動枠は 1,000 表示あたり ¥8〜13、自動広告は ¥107〜114) から、停止前のページ RPM ¥37 を下回る可能性がある。**ページ RPM ¥37 は AdSense 自身が数えた PV (GA4 の 54〜78%) が分母**なので、GA4 の PV に換算すると停止前 W30〜W33 は 1,000 PV あたり ¥22 (AdSense 収益 ¥523 ÷ GA4 Japan PV 23,787)。今の閲覧 (月約 4.7 万 PV) では自動広告ありでも月約 ¥1,000、手動枠だけ (W31 の手動枠分 ¥6.7/1,000 PV) なら月約 ¥300 で、どちらも Cloudflare の請求 (月 ¥1,556〜1,846) に届かない。月 ¥1 万には月約 45 万 PV (手動枠だけなら約 150 万 PV) が要る (2026-10-07 訂正。前日までの「月 27 万 PV」は分母の違う ¥37 で計算していた)。承認後は AdSense 収益の週次取得を再開し、計測サイクルの KPI `ad-yield` (`.claude/scripts/metrics/lib/measurement-cycle.mjs`) に接続して、4 週の効率と月額を Cloudflare の請求と並べて判定する。自動広告を使うかどうかは効率を約 3 倍動かすので、書き換え事故の原因 (自動広告そのものか、広告インテントだけか) を AdSense の公式ヘルプで確かめてから決める。 承認後の改訂では、`.claude/rules/analytics-event-standards.md` と `.claude/rules/affiliate-ads-standards.md` に残る「2026-09-20 に恒久停止」の記述も合わせて直す。
- **完了条件**: 新アカウントの審査が承認され、stats47.jp に手動枠の広告が表示され、収益化戦略とメモリの記述が「維持費の相殺として再開」に改訂されている。

### [NOTE-COVER-ROLLOUT-20260928] noteカバーの未回収版を回収し、分類別にレビューして公開する
タグ: [コンテンツ品質] [種類:改善] [実行:対話] [検証:node .claude/scripts/note/verify-cover-refresh.mjs] [起票:2026-09-28] [領域:商品]

- **完了 (2026-10-11)**: 未採用 149 件を分類別の新しい図案で作り直し (ranking-story 70・practitioner 52・explainer 14・dataset-geo 6・palette 6・intro 1)、縮小表示で全件を目視してから SHA 指定でレビューし、note へ反映した。`verify-cover-refresh.mjs` が 286/286 pass、台帳は公開 286 件すべてで採用版＝公開版。反映中に note が保存画像の下部へ色付きの帯を入れたものが 6 件あり、すべて別版を上げ直して合格 (経緯と手順は `note-image-assets.md`「分類別のカバー」)。残るのは本カードの削除だけ。

- **正典・owner**: 記事メタはTSカタログ、画像と採用/公開の対応は `data/note/cover-assets.json` + JSON Schema。実体はprivate R2のSHA付き版。契約は `.claude/rules/note-image-assets.md`。owner: note-manager / 管理画面担当。
- **残る不足**: 9/28-v4の候補PNG・入力・レビュー実体がこのPCには無い。旧記録は70件pass・216件needs-revisionだったが、回収してSHAを照合するまで承認を引き継がない。未回収版は各記事の `missingVersions` に記録する。生成環境から元実体を回収するか、分類別の根拠から別版として再制作する。
- **運用基盤**: 画像はprivate R2のSHA付き版に保管し、管理画面は共通台帳から表示する。家計47件の別版 `2026-10-02-household-r1` はレビュー・採用・公開反映と記事保全の照合まで完了。旧public R2版も過去版として保全。公開286件と保管版の全件照合、実測・検査結果の正典は `data/note/cover-operations-latest.json` と `cover-lifecycle-latest.json`。
- **反映済み (2026-10-03)**: 問い型90件の採用版 `2026-10-02-ranking-question-v1` をnoteへ反映し、`verify-cover-refresh.mjs` で90/90 pass。採用済み137件はすべて公開ポインタと一致。
- **9/28-v4 の実体はオーナーの Mac にあった (2026-10-11 確認)**: `.local/note-cover-refresh/2026-09-28/` に 286 件分の PNG・SVG・`production-manifest.json` (SHA は実体と一致)・`audit/classification.json` がある。未採用 149 件の当時の判定は、自己紹介 1 件が pass、残り 148 件が needs-revision (ranking-story 70「順位・値が消える」/ practitioner 52「シリーズの違いが伝わらない」/ explainer 14・dataset-geo 6「記事固有の図版が無い」/ palette 6「色見本が消える」)。自己紹介の pass も、10-11 に見直すと日本地図が横倒しに引き伸ばされていて採用できない。つまり 9/28-v4 から採れる候補は 0 件。
- **台帳の制約**: `reviewCoverRevision` は `kind: candidate` しか承認できず、保全済みの現行公開画像 (`published-original`) を採用版にする経路が無い。現行画像は 149 件とも非公開 R2 に保全済みで、題名・年・論点が読める品質。148 件を作り直すか、現行画像を採用版として認める経路を台帳に足すかはオーナー判断。
- **一時領域の残作業**: 問い型制作フォルダーの削除が実行環境の自動審査で拒否されたため未完了。保存済みR2を正本として扱い、環境で許可された方法で一時ファイルを整理する。
- **実行順**: ①未制作・未採用の残る149件は旧版の実体と入力を回収し `note:assets import` で保管する。回収不能は分類別の根拠から別版として作り直す。②公開画像と比較し、ランキングの上位県と値、配色の色見本、Geo/データセット・解説の固有図版を維持した上で、画像SHAを指定してレビュー・採用・dry-run・公開後検証を通す。
- **停止条件**: 9/28版を回収済みと扱わず、旧レビューや新生成を公開済みに読み替えない。未判定/要修正を一括差し替えしない。記事対応・画像SHA・認証口座が不一致、POST応答不明、本文/タイトル/価格/有料境界が変化した場合は停止する。
- **完了条件**: 全286件の採用版が分類別レビューを通り、差し替え後の `verify-cover-refresh.mjs` が公開カバーの対応と記事内容の不変を確認する。
### [NOTE-HASHTAG-ROLLOUT-20261003] note公開記事のハッシュタグを承認済みの99個へ置き換える
タグ: [コンテンツ品質] [種類:改善] [実行:対話] [起票:2026-10-03] [領域:商品]

- **正典**: 記事ごとの承認済みタグは `config/note-hashtags/<slug>.json` (git・全286件そろい済み)。作成は `propose-note-hashtags.mjs`、反映は `update-published-hashtags.mjs`、検査は `lib/note-hashtags.mjs`。反映済みかどうかは台帳に持たず、毎回 `--audit-only` で note から取り直す。
- **現状 (2026-10-03 停止時点)**: 承認済みと一致 94 件、未反映 190 件、下書きで停止 2 件。棚卸し: `node .claude/scripts/note/update-published-hashtags.mjs --all --include-paid --audit-only`
- **再棚卸し (2026-10-11)**: 一致 94・未反映 190・失敗 2 で 10-03 から変化なし (`data/note/evidence/note-hashtag-audit-2026-10-11.json`)。反映は再開されていない。同日に再開を試みたが、Claude デスクトップアプリ (Bash ツール・アプリ内ターミナルとも、サンドボックスの外でも) から `~/Library/Application Support/Google/Chrome/Profile 5` が `Operation not permitted` で読めず (macOS のプライバシー保護)、browser-use が起動しない。Claude.app にフルディスクアクセスを付けるか、Terminal.app からオーナーが実行する。カード修復・カバー反映が使う Playwright プロファイル (`.local/playwright-note-profile`) は影響を受けない。
- **2026-10-12 再開 (ログイン済み Playwright プロファイルの Chrome へ `NOTE_BU_CDP` で接続)**: 1 回目で 189 件中 14 件以上が `published free body changed before update` で止まり、止まった記事に下書き (`has_draft=true`) が残った。原因はエディタがリンクカードの題名・説明文を現在の OGP で描き直すこと。比較からカード内の文字 (`<a …><strong>…</strong><em>…</em></a>`) を外す修正を入れ、2 回目を `--allow-free-draft` 付きで流している (無料記事の下書きは上書きで解消)。有料で下書きが残った `paid-n92b846280d1a` は自動では触らない。
- **2026-10-12 結果**: 承認済みと一致 280/286。残り 6 件はすべて下書きが残って停止 (`draft_blocked`): 有料 `paid-n92b846280d1a` (今回の停止で発生)・`paid-nfe2c65e669a8` (以前から) と、無料 4 件 `recovered-n03e45e40d3a7`・`n144d350fc14e`・`n3908e5981967`・`n48dff1df249f`。無料 4 件はエディタがリンクカードの href を旧ブログURLの転送先 (例: `fertility-rate-prefecture-gap` → `birth-rate-fertility-ranking`) に書き換えるため、本文一致の安全装置で止まる。リンク先の書き換えを許すかはオーナー判断 (許すなら比較で href の転送先を正規化する)。下書きは note の編集画面で破棄すれば解消する。
- **下書きで停止**: `a-late-elderly-medical-expense-per-insured` は一括反映を途中で止めたときに残った下書き (無料記事なので `--slugs a-late-elderly-medical-expense-per-insured --allow-free-draft` で片付く)。`paid-nfe2c65e669a8` (有料) は以前からの下書きで、内容を確認してから扱いを決める。
- **実行**: `node .claude/scripts/note/update-published-hashtags.mjs --all --include-paid` (承認済みと一致する記事は飛ばすので、途中で止めても再実行でよい)。headless `claude` と note のログイン (browser-use Profile 5) が必要。1 件 約40秒。
- **停止条件**: 3 件連続の失敗、本文・価格・有料/試し読み境界の変化、更新後のタグ集合が承認済みと一致しない場合はその記事で止まる。note は大文字小文字を既存タグに合わせて書き換え、ギリシャ文字などは黙って落とす (検査で除外済み)。
- **完了条件**: `--audit-only` で 286 件すべてが compliant。

### [KDP-K-S1-08-REUPLOAD-01] 公開中のKindle S1全12冊へ承認済みポップ表紙を反映する
タグ: [収益化] [種類:制作] [実行:ユーザー] [起票:2026-09-28] [領域:商品]

- **経緯**: 2026-09-29 にK-S1-01〜K-S1-12の新しいポップ表紙を1冊ずつ目視承認し、背景・完成JPEG・完成PNG・manifestをR2 `media/kindle-cover-assets/<id>/<revision>/`へ保存して再取得SHA一致を確認した。KDPで販売中の版には未反映。K-S1-08は2026-09-27に住宅・土地統計調査などを暦年 (`yearFormat: calendar`) に直し、図校訂 (`solar-power-housing-map` の 年→年度) を外したため、同じ更新で販売中版の「年度」表記も是正する。
- **次（実行順）**: ①K-S1-01〜K-S1-12を承認済みR2背景でそれぞれ新しいversionとして再生成する ②旧確定版との章テキスト差分0、`verify-epub`、review receipt、`verify-publishable --content-only` blocker 0を冊ごとに確認する ③入稿提案を新versionへ更新し、暗号化R2 archiveをpush・deep audit・recordする ④オーナーがKindle Previewerで各EPUBと表紙を確認する ⑤`kdp-publish --update --id K-S1-NN`をdraft確認し、対象12冊と版SHAを提示してオーナーの明示承認後にだけ`--commit`する ⑥KDP本棚のread-backと商品ページで新表紙を確認する。
- **停止条件**: KDPへの`--commit`を事前承認なしで実行しない。出版停止済みのS2/S3/S4を対象に含めない。既存versionを上書きしない。本文差分、検証blocker、archive不一致、Previewer未確認が1冊でもあれば、その冊の反映を止める。
- **完了条件**: K-S1-01〜K-S1-12の販売中版が承認済み表紙へ更新され、KDP本棚read-backと商品ページで12冊すべて確認できる。各冊の入稿版SHA・R2 archive・review receiptが一致し、K-S1-08の該当図が「年」表記になっている。

### [AI-CONTENT-NATIONAL-AVERAGE-WORDING-01] 公開済みの AI 解説の「全国平均」を「47都道府県の単純平均」に直す
タグ: [コンテンツ品質] [種類:不具合] [実行:対話] [起票:2026-09-28] [領域:データ]

- **経緯**: 2026-09-27 に画面・JSON-LD・生成プロンプトは「47都道府県の単純平均」(公表の全国値が R2 に無いため。201 件標本で 0 件) に直したが、
  公開済みの ai-content (約 2,100 件) の本文は「全国平均は1.29」のまま (例: `/ranking/total-fertility-rate`)。
- **次**: 「全国平均」を機械置換できる文脈 (値の直前) だけを置換し、`audit-ai-content.mjs` を通して outbox から 35 件ずつ公開する
  (2026-09-27 の年表記是正と同じ手順)。言い換えで文が崩れる文脈は再生成キューに回す。
- **完了条件**: 公開中の ai-content の本文に「全国平均」が 0 件 (公表の全国値を使う指標を除く)。

### [UNIT-NOTATION-SITEWIDE-01] 画面に単位を出す 38 か所を表示用の整形 (`formatUnitForDisplay`) に通し、%/％ の混在をなくす
タグ: [コンテンツ品質] [種類:不具合] [実行:対話] [起票:2026-09-27] [領域:データ]

- **経緯**: `SITE-DISPLAY-SEMANTICS-AUDIT-01` の全 URL 検査の初回 (2026-09-27・6,336 ページ) で、2,508 ページに %/％ の混在。原因は e-Stat 由来の全角単位を
  そのまま出す部品が残っていること (例: ランキングページの関連ランキング一覧が「76.7％」、同じページの別の欄は「34.69%」)。
- **対象**: `git grep -nE "\{[a-zA-Z0-9_.?]*\.unit\}" -- 'apps/web/src/**/*.tsx' ':!*test*' | grep -v formatUnitForDisplay` の 38 か所
  (JSX の本文・テンプレート文字列。`unit=` で部品に渡すものは受け側で整形されているかを確認する) と関連ランキング一覧。
- **完了条件**: 週次 page-quality の %/％ 混在が 0 ページ。値の換算はしない (表示の整形だけ)。
- **2026-10-06 実装済み (本番未確認)**: 単位を直接描画する約 40 か所と受け側部品 (FeaturedRankingCard・RankingSidebar・CategoryRankingList・KPI/Line/Composition/AttributeMatrix・BlogStatsHighlight 等) を `formatUnitForDisplay` に通した。生成文 (AI 解説・ブログ説明文) は R2 を書き換えず、表示時に数字直後の「％」だけ半角にする `normalizePercentInText` (`packages/data-configs/src/unit/unit-display.ts`) を足した。OGP 画像 (RankingOgp) は再生成判定の入力が変わるため対象外にした。localhost で ranking / theme / category / survey / japan / blog / 市区町村ランキングの代表ページは全角 ％ 0 件。完了条件 (週次 page-quality の混在 0 ページ) は本番反映後の週次で確かめる。

### [AD-SAME-SHOP-DEDUP-01] 1 ページに同じ店の楽天商品が並ぶのを抑える
タグ: [収益化] [種類:改善] [実行:対話] [起票:2026-09-27] [領域:アフィリエイト]

- **経緯**: 全 URL 検査の初回 (2026-09-27) で 262 ページに同じ店の広告の重複。多くは楽天の 1 店舗から複数商品 (例: `/ranking/green-pepper-consumption-quantity` に rakuten:book から 9 件)。
- **次**: 楽天商品カードの選定に「1 ページ 1 店舗あたり上限」を入れる。上限値は現状の分布を測ってから決める。
- **完了条件**: 週次 page-quality の同一店舗重複が 0 ページ。広告のクリック計測 (`affiliate_vertical`) を壊さない。
- **2026-10-06 実装済み (本番未確認)**: `selectQualityItems` で同じ店 (shopName、無ければ商品 URL の `item.rakuten.co.jp/<店>/`) を 1 枚 1 件までにした (`rakutenShopKey` + テスト)。ふるさと納税カードにも効く。別のカードどうしで同じ店が並ぶ場合は未対処で、本番反映後の週次 `same_shop_ad_duplicates` で残りを測る。

### [PREF-PAGE-SMALL-TEXT-01] 県ページの 11px 未満の文字 56 か所を減らす
タグ: [UI・UX] [種類:改善] [実行:対話] [起票:2026-09-27] [領域:サイト]

- **経緯**: 代表 URL のブラウザ検査 (2026-09-27 新設) の初回で、県ページに 11px 未満の文字が 56 か所 (グラフの SVG は除外済み)。
- **完了条件**: 県ページの 11px 未満の文字が予算 (`page-quality` のテンプレート別予算) 以下。

### [DISPLAY-SEMANTICS-FOLLOWUP-01] 表示の意味の検査の残り (推移グラフの最低点数・週次 UI 確認の観点・ブログ本文の内部用語)
タグ: [インフラ・計測] [種類:改善] [実行:対話] [起票:2026-09-27] [領域:データ]

- **経緯**: `SITE-DISPLAY-SEMANTICS-AUDIT-01` (2026-09-27 完了・3 層の検査を配線) で残した 3 点。
  ① 「推移」グラフの最低点数は R2 の観測年数が要るため、定義検査はグラフ種別だけを見ている。② 週次 UI 確認エージェントのプロンプトに「データの意味」の観点 (指摘止まり) を足していない。
  ③ ブログ 3 本の本文に `rankingKey` という内部用語 (内部用語辞書の初回検出)。
- **完了条件**: ①② が配線され、③ の 3 本から内部用語が消えている。

### [CYCLE-HEALTH-01] 「検出 → 起票 → 計画 → 実行 → 完了 → 振り返り」のサイクルを各段の停滞信号つきで確実に回す
タグ: [エージェント・SSOT] [種類:改善] [実行:対話] [起票:2026-09-25] [領域:管理]

- **オーナー指示 (2026-09-25)**: バックログの改善・週次レビューで新しいカードが増え、配線し、改善を繰り返す。このサイクルを確実に回す。
- **現状 (2026-09-25 実測)**: 部品はある (週次監査・`/weekly-review`・`/weekly-plan`・`/monthly-plan`・日曜計測→月曜無人 triage→週次メトリクス Issue・
  戦略レーン検査 DG073〜078)。起票も活発 (backlog.md の変更コミットは直近 1 か月で 251 件)。止まっているのは段と段のつなぎ目:
  1. **検出 → 起票が切れている検出器がある**: 年カバレッジ監査の要拡張候補 87 件はカードにならないまま残る。
     一方、週次 UI 検査は起票まで自動で回っている (2026-09-24 の指摘 6 件は同日に `UI-FIX-*` 3 枚として自動起票され、
     9/24〜25 に全件 fixed。`data/page-quality/ui-findings-queue.json`)。検出器ごとに差がある。
  2. **計画 → 実行が切れている**: 週次 Must は 5 週連続未達 (W38 は 0/3)。W35 は計画 2 本に対して 85 本公開。
  3. **完了の判定が閉じない**: `improvements.md` の Due 超過 15 件 (docs:check DG054)、効果判定エンジンは GSC 施策 10 件中 0 件しか判定できない。
  4. **カードが現実とずれる**: 実装済みなのに「未コミット」のカード、前提が解消済みの `DATA-ESTAT-FETCH-01` / `DATA-MANUAL-RESTORE-01`、
     完了済み ID (`AFF-MEASURE-RECOVER-01`) を参照し続ける週次計画。backlog の Due 超過 5 件・起票 60 日超 11 件。
- **設計 (各段に「止まったら見える信号」を 1 つ置き、新しい仕組みは作らず既存の週次メトリクス Issue と管理画面 `/strategy/lanes` に出す)**:
  | 段 | 信号 (機械で数える) | 既存の置き場 |
  |---|---|---|
  | 検出 → 起票 | 検出から 7 日たってもカードに結ばれていない指摘の件数 (年カバレッジ・GSC coverage・効果判定。UI 確認は自動起票済みの基準例) | 自動起票は `coverage-backlog.mjs` / `ui-findings.ts` の形にそろえる |
  | 起票 → 分類 | レーン・tier・種類が無いカード (DG058/059/075) | docs:check |
  | 分類 → 計画 | 重点レーン外の Must・凍結レーンの作業 (DG076〜078) | docs:check・`/strategy/lanes` |
  | 計画 → 実行 | 週次 Must の達成率と連続未達週数。2 週連続未達のタスクは分割か降格を必須にする | `/weekly-review` |
  | 実行 → 完了 | Due 超過 (DG054)・判定できない効果測定・完了済み ID を参照する計画 | docs:check・効果判定エンジン |
  | 振り返り → 起票 | 週次レビューの「次週への申し送り」がカード ID に結ばれているか | `/weekly-review` |
- **関連カード (個別の段の実例。ここで重複実装しない)**: `UI-REVIEW-LOOP-VERIFY-01` (UI 確認→起票)、`DATA-QUALITY-LOOP-01` (データ監査→起票)、
  `EFFECT-TARGET-MARKERS-01` (完了の判定)、`STRATEGY-FOCUS-2026-10-01` (計画の枠)。
- **①③ 済 (2026-09-26・未コミット)**: `.claude/scripts/metrics/lib/cycle-health.mjs` が分類漏れ・期日超過・Must の連続未達・完了済み ID を参照する計画を数え、
  週次メトリクス Issue の「🩺 サイクルの健全性」表に出す (テスト `cycle-health.test.mjs`)。検出 → 起票と振り返り → 起票は「未計測」と明示。
  `/weekly-plan` に「連続未達 2 週以上は分割か降格・完了済み ID を残さない」、`/weekly-review` に「Must N/M の書式・申し送りに ID」を追記。
  初回実測 (W39): 分類漏れ 1/118、期日超過 5、W38 まで連続未達 2 週、完了済み参照 0 (`AFF-MEASURE-RECOVER-01` は ledger に完了記録が無いため数えない)。
- **② 済 (2026-09-26・未コミット・オーナー判断「自動起票を既定」)**: 年カバレッジ監査の要拡張候補を GSC カバレッジと同じ形で自動起票する
  (`.claude/scripts/data/sync-year-coverage-backlog.mjs`。1 枚 10 件・開いているカードは 1 枚・gate `assert-year-coverage-batch.ts`・
  週次 workflow `estat-year-coverage-audit-weekly.yml` に配線)。初回カード `YEAR-COV-20260926` を起票済み。
  健全性表の「検出 → 起票」行は検出器ごとの残件とカードの有無を出す (残件ありでカードなし = 起票が止まっている)。
- **次 (残り)**: 「振り返り → 起票」の行を実数にする (週次レビューの申し送りに ID が付いているかを数える)。
  他の検出器 (ranking-integrity・provenance・`/audit-units`) の自動起票は `DATA-QUALITY-LOOP-01` ①② で同じ形に寄せる。
- **旧・次**: ① 週次メトリクス Issue (`generate-weekly-metrics-issue.mjs`) に「サイクルの健全性」節を足し、上表の 6 信号を毎週出す。
  ② 検出器ごとに「指摘 → カード」の結び方を決める (自動起票か、週次レビューでの手動起票か)。③ `/weekly-review` と `/weekly-plan` に
  「2 週連続未達は分割か降格」「完了済み ID を計画に残さない」を入れる。
- **完了条件**: 週次メトリクス Issue に 6 信号が 4 週続けて出て、検出 → 起票の未結び件数と Due 超過が減り、Must の連続未達が 2 週以内に解消されている。

### [NOTE-COVER-ASSETS-SPLIT-01] note カバー台帳 cover-assets.json を 1MB 未満に分割する
タグ: [コンテンツ品質] [種類:改善] [実行:対話] [検証:node .claude/scripts/lib/check-repo-hygiene.cjs --baseline] [起票:2026-10-13] [領域:商品]

- **現在地 (2026-10-13)**: `data/note/cover-assets.json` は記事 403 本分の採用版と操作履歴を持ち 1,721,164 bytes (HEAD 前は 859,190)。改行を詰めても約 1.2MB で、repo hygiene の上限 1MB を超える。コミットを通すため `.claude/config/repo-hygiene-baseline.json` に既知の違反として 1 件登録した。
- **やること**: 完了・superseded の操作履歴を `data/note/evidence/` の月別ファイルへ移すなど、正本 (採用版と未完了の操作) と履歴を分ける。読み手 (`lib/cover-update.mjs`・`generate-cover-refresh.ts`・`verify-cover-refresh.mjs`・管理画面) を同時に直し、JSON Schema も更新する。
- **完了条件**: 正本が 1MB 未満になり、baseline から `data/note/cover-assets.json` の行を消しても `check-repo-hygiene.cjs --baseline` が通る。`node --test .claude/scripts/note/__tests__/cover-update.test.mjs` が通る。

### [NOTE-CARD-REPAIR-01] note公開記事の空白リンクカードを段階的に是正する
タグ: [コンテンツ品質] [種類:不具合] [実行:対話] [検証:npm run note:cards:audit -- --browser-verify] [起票:2026-09-27] [領域:商品]

- **現在地 (2026-09-27)**: 一括修正前の全286記事監査は空白785枚・未確認0枚・カード前の空段落29箇所。修復記録では71枚・17記事が`verified`（今回65枚）。**785枚は現在の残数ではない**。一括修正後の全量再監査は未実施。記事単位の公開後監査は各修復時に実施済み。
- **正確な再開位置**: 同じMacの`.local/note-card-repair-journal.json`がカード単位の進捗記録。`attempts`を`slug + key`で最後の試行に絞り、`verified`を再処理しない。`data/note/card-visibility-latest.json`は修復前の全量スナップショットで、再監査までは現在の残数とみなさない。ローカルjournalが無い環境では推測で修復せず、全量監査を作り直す。
- **再開手順**:
  1. `npm run agent:session -- --status`で作業共有を確認し、note編集の同時実行を避ける。`npm run note:session:check`でstats47のログインを確認する。
  2. `npm run note:cards:audit -- --browser-verify --output data/note/card-visibility-latest.json`で286記事を再監査する。空白が残ればexit 1でもレポートを読む。`unknownCards`または`browserVerifyFailedArticles`があれば、`npm run note:cards:audit -- --browser-verify --retry-unknown-from data/note/card-visibility-latest.json --output data/note/card-visibility-latest.json`で再検証し、未確認0を確認する。
  3. `npm run note:cards:repair-batch -- --max-articles 5 --max-cards 10 --commit --skip-blocked`を小分けで繰り返す。各バッチで公開後の表示を確認する。失敗時はjournal・公開記事の`has_draft`・対象カードのキーを確認してから再開する。監査から24時間経過したら手順2へ戻る。
  4. カード修復後の空段落は`note:cards:compact-spacing`で記事ごとに別工程で詰め、記事単体監査で確認する。
- **未解決の1枚**: `recovered-n023501038bd5`（`https://note.com/stats47/n/n023501038bd5`）内のmagazineカード`https://note.com/stats47/m/me574f67ac47f`、旧キー`embf4bf74e742aa`。修復処理がタイムアウトし、再監査では空白のまま、公開記事に下書きなし。`--skip-blocked`で他のカードを進めつつ、個別に原因を調べて最終的に再処理する。スキップを完了扱いにしない。
- **2026-10-11 再開**: 全量再監査は空白 720 枚・206 記事・未確認 0・空段落 83 (`data/note/card-visibility-latest.json`、11:56Z)。修復ループを再開した。`repair-note-blank-card.mjs` は挿入直後のカードの `data-src` が空のまま比較して落ちていたので、全カードの URL が入るまで最大 20 秒待つようにした。
- **オーナー作業 (下書きの破棄)**: `recovered-n03e45e40d3a7` (`https://note.com/stats47/n/n03e45e40d3a7`、KML×Google マップ) は、リンク先 `n686dcc017bbe` のカードが 20 秒待っても埋め込まれず、エディタの自動保存で `has_draft=true` が残った (公開本文は不変)。note の編集画面で下書きを破棄するまで、この記事の空白 6 枚は journal で `repair_failed` / `blocked_by_draft` にして修復対象から外している。破棄後は journal の該当 6 件を消してから再実行する。
- **2026-10-12 の進捗と停止**: 全量監査 (17:22) は 304 記事・空白 689 枚・空段落 107。修復は 75 枚 verified。修復手順を 2 回直した: (1) 右矢印でカードを選べない場合のクリック経路を足したが、非表示の空白カードはクリックできず、その間に「カード未選択のまま押した Delete」が自動保存されて下書きを 3 件作った → (2) Delete はカードが選択状態 (`ProseMirror-selectednode`) のときだけ押し、未選択なら編集せず止める形に直した。その後 note の公開 API が 403 を返し始め (短時間の大量操作による制限とみられる)、`recovered-n3a4efa70c02a` は「更新する」が出ずタイムアウトした (下書きが残った可能性あり・403 で未確認)。自動処理はすべて停止。
- **オーナー作業 (下書きの破棄、2026-10-12 時点で 9〜10 本)**: 修復やタグ更新の停止で未公開の下書きが残った記事 — `recovered-n03e45e40d3a7`・`n144d350fc14e`・`n3908e5981967`・`n48dff1df249f`・`n218588ef2f67`・`n36624f1c4134`・`n391d3ef70d29`・(未確認) `n3a4efa70c02a`、有料 `paid-n92b846280d1a`・`paid-nfe2c65e669a8`。`n218588ef2f67`・`n36624f1c4134`・`n391d3ef70d29` の下書きには意図しない削除が入っているので**公開せず破棄**する。破棄後に journal の当該記事の `blocked_by_draft` を消して再開する。
- **再開手順**: 数時間おいて `curl -s -o /dev/null -w "%{http_code}" https://note.com/api/v3/notes/n3a4efa70c02a` が 200 に戻ったことを確かめ、journal の `repair_failed` を下書きの無い記事だけ消してから修復ループを流す。1 回の連続処理を短く区切る。
- **週次運用**: `.github/workflows/note-circulation-audit-weekly.yml`と`.claude/skills/management/weekly-review/SKILL.md`に全量監査を組み込み済み。**CIは一度も完了していない (2026-10-11 確認)**: 10-01 (dispatch)・10-03・10-10 (schedule) の 3 回とも `timeout-minutes: 30` で cancelled (run 36909292510 / 37160611864 / 38095490764)。commit `00c5a44f0` の時間切れ対策後も再発しているので、286 記事の browser-verify を 30 分に収める分割か上限の見直しが要る。確認: `gh run list --workflow note-circulation-audit-weekly.yml --limit 3`。スクリーンショットはCI artifactに14日保持し、R2とローカルには蓄積しない。
- **停止条件**: 対象カードのURL・位置・記事本文・価格・タグのいずれかが変わる、または更新後のブラウザ表示が確認できない場合は次のカードへ進まない。
- **完了条件**: 全記事監査で空白0件・未確認0件を確認し、週次監査が継続実行される。

### [SITEWIDE-DUPLICATE-LINK-RATIO-01] サイト横断でリンク重複率が閾値超過 (本番全6,237URL実測)

タグ: [UI・UX] [種類:不具合] [実行:対話] [検証:npm run page-quality:audit-weekly -- --base-url https://stats47.jp] [起票:2026-09-15] [領域:サイト]

- **owner**: ranking-ui-manager (ranking) / theme-ui-manager (theme) / site-ux-manager (共通部品・横断)
- **実測 (2026-09-18)**: develop→main PR #977 の `page-quality` (representative) が同じ違反で赤 (merge blocker)。
  `/themes/population-dynamics` 0.5081 / `/blog` 0.3235 / `/ranking/total-population` 0.3151 (閾値 0.3)。
  rail/surface 統一 (1006e1e21) 後の値。CI 側では 2026-09-18 に PR 必須 gate から外し、週次監査だけが検出する。
  2026-09-18 に page-quality を PR 必須から外したので PR は止まらなくなったが、違反自体は未解消。
  検知は週次 `page-quality-audit-weekly.yml` の alert Issue と、リリース前の `check:release-local` に移った。
- 2026-09-15、`page-quality:audit-weekly` を本番全 6,237 URL に実行 (初の全件試行)。
  error 2,698 / warning 5,106。**duplicate_link_ratio がほぼ全テンプレートの支配的違反**で、
  個別ページの内容問題ではなく共通コンポーネント由来の疑いが強い:

  | テンプレート | 対象URL数 | error | warning | duplicate_link_ratio 内訳 |
  |---|---:|---:|---:|---|
  | prefecture-detail (`/areas/[code]`) | 2,491 | 1,691 | 1,612 | error 1,691 + warning 752 = 対象の 98% |
  | blog (`/blog/[slug]`) | 606 | 606 | 112 | error 605 = 対象の **99.8%** |
  | ranking (`/ranking/[key]`) | 2,170 | 227 | 3,197 | error 227 + warning 1,941 (ad_duplicate_count warning も1,256件) |
  | geo-analysis | 71 | 55 | 10 | error 55 = 対象の 77% |
  | theme | 56 | 38 | 34 | error 38 = 対象の 68% |
  | survey | 148 | 64 | 83 | error 56 + warning 83 |
  | category | 17 | 11 | 8 | error 11 |
  | municipality | 360 | 0 | 0 | **異常なし** (比較対象として健全) |

- **注意 (実証ベース)**: prefecture-detail は並行 Codex セッション (`area-density-optimization` /
  `area-all-optimization`、2026-09-15実施)が「ranking リンク重複排除」を含む最適化を
  ローカル dev server で検証済みだが**本番未デプロイ**。本監査は現行本番 (デプロイ前) を
  見ているため、そのセッションの変更が本番反映されれば prefecture-detail 分は改善している
  可能性が高い。**デプロイ後に再実測してから母数を再評価すること** (未検証のまま「直った」
  と判断しない)。
- **次 (実行順)**: ①上記デプロイ待ちの分を除いた ranking/blog/theme/survey/category の
  duplicate_link_ratio 原因(共通ナビ・関連記事ウィジェット・広告リンクの重複生成箇所)を
  各 owner が最小1テンプレートで特定 ②修正 ③`page-quality:check`(代表URL)で個別確認
  ④全件は次回週次 `page-quality-audit-weekly.yml` で確認 (毎回全件を手動実行しない)。
- **完了条件**: 週次監査の error 件数が縮小傾向 (ラチェット化は別途検討)。
- 生データ: `data/page-quality/metrics/{latest.json,LATEST.md,snapshots/2026-09-15.json}`、
  管理画面 `/quality/page-audit`。

### [AFF-STOCKTAKE-RECONCILE-01] 提携棚卸しの不明案件と既存在庫の不一致を再照合する

タグ: [収益化] [種類:不具合] [実行:対話] [起票:2026-09-08] [期日:2026-09-15] [領域:アフィリエイト]

- **owner**: affiliate-operator（状態照合）/ affiliate-manager（在庫判断・ローカル修正）/ オーナー（手動ログイン）
- **証拠・対象の正典**: `data/affiliate/affiliate-stocktake-latest.json`。詳細な件数・状態・素材一覧は本カードへ複製しない。
- **次（実行順）**: ①帰属ガードを確認してからA8 `26822001`、afb `15671`・`14033`・`16511`・`15831` の不明状態を再照合する。②楽天は正しい広告リンク作成用IDかをオーナーに確認し、stats47の登録と既存リンクの口座一致を確認する。登録変更は別承認とする。未提携が確定した3案件は `affiliate-delivery-policy.ts` の共通停止へ反映済み、重複はprogramRef/クリック先で除外済み。これらの公開前確認は `AFF-PLACEMENT-RELEASE-01` へ分離する。
- **停止条件**: サイト・口座帰属を確定できなければ停止し、不在を未提携や終了と推測しない。新規・重複申請、認証回避、成果リンクへの確認クリック、本番変更・deploy・R2 pushは禁止。既存在庫を未確認のまま削除しない。
- **完了条件**: 各対象の状態・在庫判断を実機証拠へ結び付け、必要なローカル修正と対象の検証が完了する。不明が残る間はカードを維持し、人間作業またはガード復旧による再開条件を明記する。

### [BLOG-SVG-LINEAGE-RESTORE-01] ブログSVG系譜キューの継続消化

タグ: [コンテンツ品質] [種類:不具合] [実行:対話] [起票:2026-07-22] [進行中] [領域:データ]

- **owner**: Claude Code
- **現況**: 全`article.md`参照から期待asset集合を作る公開契約監査へ拡張済み。公開434記事・本文参照
  1,091 assetで `pork-consumption-expenditure/data/pork-expenditure-ranking.svg` だけが404。SVGは既存JSON/sourceから
  ローカル再生成済みで、公開gateもdata refresh / blog publish / 週次へ配線済み。R2全量pullのdry-runは
  `app/blog` 8,913 files（local差分8,526）を確認したが、read-only取得の承認前なので実pullしていない。
- **2026-08-27 生成物監査**: R2 `app/blog` 8,944 filesをローカルへ同期し、432記事・2,443 SVGを同一lintで
  再走査した。構造error 98記事、dark mode非対応135記事を機械stateへ記録した。旧stateの98記事・141 SVG・error 0は母集団が
  生成物全量を覆っておらず、完了証拠には使えない。公開参照asset契約とSVG内容品質は別gateとして維持する。
- **次**: 構造error 98記事を優先し、小バッチで処理する。R2由来、算式、年、metric keyを復元できない図は
  推測で再生成しない。公開参照asset契約と内容品質gateを各バッチ後に再実行する。
- **完了条件**: 全公開記事の参照assetが200、must-fix 0、公開gate greenとなり、source lineage不明の図は削除または明示的に保留される。
- **正典**: `.claude/rules/blog-data-schema.md`

### [THREADS-TOPUP-01] Threads の予約を 10/31 分まで補充する (同時 25 件の上限)

タグ: [SNS・マーケ] [種類:改善] [実行:対話] [検証:npx tsx .claude/skills/sns/publish-threads/publish-threads.ts --from-queue --limit 1 --dry-run] [起票:2026-09-23] [期日:2026-10-20] [領域:SNS]

- **owner**: x-strategist
- **現状 (2026-09-23)**: Threads は Playwright で Threads Web の予約機能を使う (`/publish-threads`)。9/24〜10/31 の 76 件を posts.json に platform=threads の下書きとして作り、9/24〜10/6 の 25 件を予約済み。Threads の予約は同時 25 件までで、残り 51 件 (10/6 夕方〜10/31) は draft のまま。
- **次**: ①オーナーが launchd に補充ジョブを登録する (`cp scripts/scheduled/com.stats47.threads-topup.plist ~/Library/LaunchAgents/ && launchctl load ~/Library/LaunchAgents/com.stats47.threads-topup.plist`)。以後は 09:30 / 21:30 とログイン時に空き枠だけ自動で入る (スリープ中の回は起床時)。②公開済みの確認は `sns-verify-threads-posted.yml` (CI・毎晩) が台帳を posted + permalink にする。schedule は main にある workflow しか動かないため、次の develop→main で有効になる (それまでは `node .claude/scripts/sns/verify-threads-posted.cjs --apply` を手で実行)。
- **完了条件**: 10/31 分まで Threads 側で予約済みになり、posts.json の threads draft が 0 件。

### [AFF-INTENT-FALLBACK-STOP-01] 意図が解決しない面への配信を止め、priority を期待収益順にする

タグ: [収益化] [種類:改善] [実行:対話] [検証:node .claude/scripts/metrics/check-revenue-guards.mjs が exit 0] [起票:2026-09-20] [期日:2026-10-04] [領域:アフィリエイト]

- **owner**: affiliate-manager
- **正典**: `docs/00_プロジェクト管理/02_収益化戦略.md` §3.2 / `.claude/rules/affiliate-ads-standards.md` §6.1
- **背景（2026-08-10〜09-06 実測）**: `resolveContentVerticalChain`（`affiliate-category.ts:415`）は
  tags が 0 件のとき `CATEGORY_AFFILIATE_MAP` の 17 軸写像へ落ちる。この粗い写像が economy への
  集中（約 7,400 imp / 2 clicks）を作っている。一方で意図が解決した vertical は housing 0.299%
  (334 imp)・mobility 0.340% (294 imp) と全体 0.049% の 6〜7 倍だが、標本がクリック 1 件ずつなので
  **[仮説]** の域を出ない。これを検証する。
- **やること**: ①`affiliate-category.ts:415` の `push("category", …)` と `:443` の `byCategory` 分岐を
  削除し、鎖を explicit → survey → tags のみにする。②`AffiliateAdSlot.tsx:79` の暗黙フォールバックを
  塞ぎ `vertical` を必須 prop にする。③priority を期待収益順（`epcYen × confirmRatePct / 100`、
  出典 `data/affiliate/a8-catalog.json` の登録済み 118 件）で vertical ごとに振り直す。
  `AFFILIATE_DELIVERY_HOLDS` と blocklist を先に確認し、health 軸の不適合案件を上位へ出さない。
- **[target: CTR +0.10pt 以上（0.049% → 0.15%）]** 根拠: 意図解決済み vertical の観測 CTR 0.30% と
  現状 0.049% の中間。`epcYen` は A8 のプログラム平均で自サイト実績ではないため、priority の初期値
  としてのみ使い、自サイトの確定収益が溜まったら置き換える。
- **境界**: 枠数は変えない（それは `AFF-SLOT-REDUCTION-01`）。同じデプロイに混ぜると
  「どの広告を出すか」と「いくつ出すか」のどちらが効いたか分離できない（収益化戦略 §7）。
- **停止条件**: フォールバックを止めると広告が消えるランキングが出る（`MetricConfig.tags` 未記入の
  ページ）。消えた面の件数を計測し、tags の補完で戻せるかは別カードにする。14 日後に CTR が 0.10% に
  届かなければ仮説を棄却し、広告レーンへの追加投資を止めて商品レーンへ寄せる。
- **観測例 (2026-09-25 localhost)**: `/ranking/natto-consumption-expenditure` の本文に「1位 福島県の人気返礼品」(桃・ふるさと納税) が出る。
  納豆の支出のページで、1 位の県の返礼品を出す地域軸の配信が、読者の意図 (納豆・食品) と合っているかを本カードの判断に含める
  (右レールには納豆の楽天商品が別に出ている)。

### [AFF-SLOT-REDUCTION-01] 表示量を減らして視認される位置へ寄せる

タグ: [収益化] [種類:改善] [実行:対話] [検証:GA4 の affiliate impression / pageview が 0.5 未満] [起票:2026-09-20] [期日:2026-10-18] [領域:アフィリエイト]

- **owner**: affiliate-manager
- **背景（2026-08-10〜09-06 実測）**: 表示 / PV は全体 0.76、デスクトップ 0.84、blog は 1.24。
  にもかかわらずデスクトップ CTR は 0.0197%（20,325 imp で 4 clicks）でモバイル 0.137% の 7 分の 1。
  面別では article-end 0.195%（512 imp）・home-left-rail 0.654%（153 imp）に対し、
  ranking-native 0.030%・blog-sidebar 0.038%・ranking-sidebar 0.043%。**本文内が効き、レールが効かない。**
- **やること**: `BLOG_IN_BODY_BANNER_COUNT` 4 → 2、blog サイドバー 2 枚 → 1 枚、
  `RankingPageNativeAffiliateSection` を ranking から外して本文枠を ranking-incontent 1 件に統一、
  `RankingPageSidebarSection` の `bannerLimit` 2 → 1、`load-ranking-page-model.ts` の解決件数 8 → 2。
  デバイス分岐は新設しない（削減対象は既に `hidden lg:block` 等でデスクトップ偏重のため）。
  同じデプロイで `injectAdSlots`（`md-content.tsx`）も撤去する。AdSense 恒久停止で何も描画しないが、
  除去は本文の挿入位置に影響するので枠数変更とまとめて 1 回で測る。
- **[target: 表示/PV 0.76 → 0.5 未満]** 根拠: blog の 1.24 は 1 PV に 1 枚以上で過剰。
- **前提**: `AFF-INTENT-FALLBACK-STOP-01` のデプロイから 7 日以上空けて出す（交絡回避）。
- **停止条件**: 表示を減らすと短期的には表示も収益も下がる。「減らしたら減った」を効果なしと
  誤判定しないよう、判定指標は CTR と確定収益 / 1,000 viewable impression に固定する。

### [CONTENT-PAINPOINT-PUBLISH-01] 悩み起点ブログ5本の公開とSNS展開を完了させる

タグ: [SNS・マーケ] [種類:制作] [実行:対話] [検証:curl -sI https://stats47.jp/blog/nursery-shortage-urban-prefecture が200を返す] [起票:2026-09-16] [期日:2026-09-30] [領域:サイト]

- **背景**: 統計そのものより「悩み・不安」起点の記事がSEOに効くという仮説で、白書(NotebookLM)調査+note/X調査の両方で裏付けが取れた5テーマを記事化した。5本とも `quality-gate.mjs` / `article-factual-check.mjs` / blog-critic すべて PASS 済み (`contents/blog/{nursery-shortage-urban-prefecture, vacant-housing-rate-inherited-home-risk, elderly-welfare-expenditure-prefecture-gap, evacuation-plan-coverage-urban-prefecture-gap, intellectual-crime-tokyo-kagawa-gap}/`)。
- **公開の現在地 (2026-09-23 再確認)**: 5本とも本番は 410 (未公開)。以前 Phase 2 で作った staging (`.local/r2/app/blog/<slug>/`) と画像リクエスト (`.local/blog-imagegen/requests/<slug>.json`) は消えていたので、画像生成から作り直す。原稿は `contents/blog/<slug>/` に残っている。
- **止まっている理由**: Codex の利用上限。`codex exec` から組み込み `$imagegen` を呼ぶと「usage limit、再開は 2026-09-26 22:28」で失敗した (Codex MCP もこのセッションでは `CONNECTION_CLOSED`)。Codex CLI の直接実行は `codex-mcp.md` の経路③で許可されている。リクエストは `npm run blog-images:codex -- request-article --slug <slug> --article contents/blog/<slug>/article.md` で決定的に再生成できる。
- **SNS下書き**: X投稿文5本・Instagramキャプション5本は作成済み、`data/sns/pain-point-series-drafts.md` に保存済み。**投稿・予約は記事が本番公開されてから、ユーザーの明示許可を得て実施する**(まだ実行していない)。X下書き作成agentの申し送り: 各投稿に添付する画像とチャートSVGの形式一致は未確認、投稿前に要突合。
- **次**: 2026-09-26 22:28 以降に 5 本分の request-article → `$imagegen` (1本1回) → `ingest-article` → `generate-blog-thumbnails.ts --slug <5slugs>` → `/publish-bulk-articles` の Phase 4 (R2 push・all.json・purge) → Phase 5 (HTTP 検証)。公開後に X・IG の下書き (`data/sns/pain-point-series-drafts.md`) を予約枠 (X は週 2-3 本) へ入れる。
- **停止条件**: 画像なし(共有背景fallback)でR2にpushしない(OGP/カードが404で公開される事故を防ぐ設計)。
- **完了条件**: 5記事すべてが本番で200 + OGP/thumbnail画像が正しく出る + SNS投稿(X/IG)まで実施されている。

### [UI-CARD-TYPOGRAPHY-UNIFY-01] カードの見出し・本文・余白を役割契約に統一する (A 済 / B 実装済・検証途中 / C 未着手)

タグ: [UI・UX] [種類:改善] [実行:対話] [検証:npm run design-system:check -w apps/web] [起票:2026-09-16] [期日:2026-09-30] [領域:サイト]

- **owner**: site-ux-manager (横断契約・機械ゲート) / ranking-ui-manager (ranking 面) / theme-ui-manager (themes 面)
- **背景 (2026-09-16 実測・5 ページ・デスクトップ幅)**: 同じ役割のカードが feature ごとに見出しサイズ/太さ/余白を上書き・再実装し、
  ranking 詳細で本文カード見出しが 14/600・14/500・16/600・14/700 の 4 系統、FAQ 本文 14px / 考察 15px に対し他カード 12px、
  `/areas/04000` 右レールで 14/500 と 16/600 が混在、`/themes/real-income` でチャート見出しが同一ページ内 16/600 (9 枚) と
  14/600 (6 枚)、category の分類カードが 13/700・余白 8/12。規約 (`04_デザインシステム.md`) はカード見出し/本文/余白の数値を
  持たず、旧資料 `.claude/design-system/{prohibited,principles,quick-reference}.md` は余白を `p-5以上`/`p-6`/`p-0禁止` と 3 値で
  並立させコード正典 `SurfaceCard p-4` と食い違う。計測方法: DOM で `border`+`bg-card` を持つ最外郭要素ごとに最初の見出し
  (h2-h4 / font-weight≥600) の font-size/weight、本文の最頻 font-size、padding を集計。
- **契約 (確定。数値はコードが正典・文書へ二重管理しない)**:
  - ※ 見出しの色・太さ・下線と本文の下余白は `UI-CARD-HEADER-SIMPLIFY-01` (2026-09-25 決定) で改訂する。以下の数値はそれまでの現行値
  - レール/リンク一覧カード = `RailCard` 既定 (h3 `text-sm font-medium text-muted-foreground`・ヘッダ `px-4 py-3`・本文 `px-4 pb-4 pt-3`)、
    リンク行 = `RailLinkItem` (`py-1.5 text-sm`、2026-09-16 に text-xs から統一)、2 行目 `text-xs`
  - 見出し付き本文カード = `SectionCard` (`components/surface/SurfaceCard.tsx`、RailCard と同じ HeaderedSurfaceCard の variant。
    h3 `text-sm font-semibold text-foreground`・ヘッダ `px-4 py-3`・本文 `p-4`)。`ChartPanel` と同じ見た目。非チャート用
  - メタ文字 = `text-xs`。`text-[10px]`/`text-[11px]`/`text-[13px]` の任意値は使わない
  - `titleClassName` のサイズ/太さ上書き禁止 (色だけ可: AreaProfileSidebar の emerald/amber)
  - ページ節見出し: h2 `text-xl font-bold`、節内の小見出し h3 `text-base font-semibold`。h1 だけ `text-2xl font-bold`。`text-lg` 見出し禁止
  - カード内カード禁止は維持 (SectionCard の内側は枠なしのリンク行にする)
- **済 (A) — commit `3ca99124c`**: SectionCard 新設 + card census 登録 / RailLinkItem text-sm / RailCard 再実装 7 件
  (RelatedAreas・AreaProfileSidebar・CitiesNavCard・CorrelationSection+Skeleton・PortStatisticsMapCard・RankingSidebarSkeleton・RailAdSlot)
  を共通部品化 / blog 関連ランキング・目次と CityRankingSection の titleClassName 上書き削除 (ArticleTableOfContents の compact prop 削除) /
  楽天・返礼品・運営者カードを semibold + text-xs へ / PortalCategoryGrid sidebar・RailLinksCard の任意 px を scale へ。
  `/areas/04000` 右レール 4 枚が 14/500・リンク 14px に揃ったことをブラウザ実測済み
- **B — 実装済み・検証途中 (この PC で 2026-09-16 に Sonnet が編集、型/design-system/card census/eslint は緑、対象 vitest は実行途中で中断)**:
  対象 14 ファイル = RankingSourceCard / RelatedRankingsGrid (SectionCard 化。内側 9 枚は枠付き SurfaceLinkCard から枠なしリンク行へ =
  カード内カード禁止のため。**見た目の確認が未了**) / DataUsageCard (SurfaceCard + tint) / RankingPageCardsSkeleton / AreaRelatedRankingsCard /
  AreaRelatedBlogArticles (h2 text-2xl→text-xl) / AreaDatabookSection (節内 h3 text-lg→text-base semibold) / ThemeRelatedArticles /
  ThemeEvidenceTopicsSection / ThemeIndicatorCatalogSection (h2 text-lg→text-xl) / MetricFocusCharts・MetricSwitcherPanel
  (`titleClassName="text-base"` 削除 = themes のチャート見出し 16→14px) / ChartState (h3 text-lg→text-sm) / SurveyTaxonomyCard section 変種
  (h2 text-lg→text-xl、p-5 撤去)。**次の PC ではまず** `cd apps/web && npx vitest run src/features/ranking src/features/area-profile
  src/features/area-databook src/features/theme-dashboard src/features/survey src/components` を通し、`git diff` で
  ThemeEvidenceTopicsSection の見出し扱い (h2 を節見出しとして残したか SectionCard title にしたか) を確認する
- **C — 未着手 (機械ゲート + 文書)**:
  1. `apps/web/scripts/check-design-system.mjs` に規則を追加 (既存の `rules` 配列と同形式・`allow` で例外):
     `no-card-title-scale-override` (`titleClassName=` に `text-(xs|sm|base|lg|xl|2xl)|font-\w+` を含む。features/app 対象) /
     `no-manual-card-header` (`border-b` と `px-N` と `py-N` を同一 class 文字列に持つ手書きヘッダ。features/app 対象、`src/components/**` は許可) /
     `no-arbitrary-text-size` (`text-\[(10|11|13)px\]`。A 実施前は 87 箇所/40 ファイル。残存ファイルを**縮小専用 allowlist** に列挙し新規を止める。
     `src/features/ogp/**` と Remotion 系は対象外) / `no-text-lg-heading` (`<h[23]` と `text-lg` の同居。`MarkdownSectionRenderer` は allowlist) /
     `no-h2-text-2xl` (hero・PageHeader 以外)。checker のテストがあれば規則ごとに 1 ケース足す
  2. 文書: `docs/01_技術設計/04_デザインシステム.md` に「カードの役割契約」節 (部品名で書く。数値は書かない) / `.claude/rules/ui-components.md` に
     「RailCard/SectionCard の titleClassName でサイズを上書きしない」「feature 内で SurfaceCard p-0 + 手書きヘッダを作らない」を追記 /
     `.claude/design-system/{prohibited,principles,quick-reference}.md` の余白数値 (`p-5以上`/`p-6`/`p-0禁止`) を削除し「コード正典 = SurfaceCard p-4」へ
  3. ブラウザ再計測 (上記の計測方法) を `/ranking/natto-consumption-expenditure` `/areas/04000` `/themes/real-income` `/category/economy`
     `/blog/local-government-debt-burden` で行い、役割ごとに 1 系統に収束したことを確認。RelatedRankingsGrid の枠なし化と
     ranking 右レールのリンク 14px 化の見た目を目視
- **未決 (オーナー判断)**: ① FAQ/定義/考察 (開閉 UI) の本文 14px は規約どおりだが他カードの 12px と並ぶと大きく見える —
  他カードを 14px へ上げるか開閉 UI を 13px へ寄せるか ② category の分類カード (13/700・8/12、`CategoryTopicGroups`) を契約へ寄せるか
  ③ `MarkdownSectionRenderer` の h2 16px (テーマ本文内) の扱い
- **環境メモ**: この Windows PC で node_modules が lock とずれ `@babel/core` 不在 → pre-commit の `next lint` が落ちる。`npm install` で復元済み。
  共有ツリーで作業するときは `git commit -- <paths>` で staged を残さない (別セッションの commit に巻き込まれた実例あり)
- **停止条件**: 契約テスト (`right-rail-banner-contract` / `page-shell-rail-contract` / `left-rail-layout-contract` / chart contract audit) を弱めない。
  デプロイはオーナー指示で 1 回
- **完了条件**: 5 ページ計測で役割ごとに 1 系統 / `check-design-system` の新規則が緑で既存違反 0 (allowlist は縮小専用) / 文書 3 点更新 /
  `npm run type-check --workspace=apps/web` と対象 vitest が緑

### [STATE-R2-MIGRATION-01] 日次観測 state の残り 4 domain を R2 `state/` へ移す (psi → cloudflare → url-inspection → search-growth)

タグ: [インフラ・計測] [種類:改善] [実行:対話] [検証:git log --since=4.weeks --name-only -- .claude/state/metrics | sort -u | wc -l が 230 未満、かつ curl -sI https://storage.stats47.jp/state/psi/index.json が 200] [起票:2026-09-14] [期日:2026-10-12] [領域:管理]

- **owner**: Claude Code (実装) / オーナー (PR 承認・Cloudflare lifecycle)
- **前提**: PR `feat/ga4-affiliate-state-r2` で 1 domain 目 (`state/ads/ga4-affiliate/`) の型が出来ている。
  `state-pull.mjs` (公開 URL → gitignored `live/`)、`index.json` 維持、週次集約だけ commit-back、
  `prune-state-snapshots.mjs` の policy 削除、という 4 手順を domain ごとに繰り返す。
- **背景 (2026-09-14 実測)**: `.claude/state/metrics` は 4 週で 230 commit。大半が psi / cloudflare /
  url-inspection の日次 `[skip ci]` commit-back。git を肥大化させず agent の Grep 対象にも入れない置き場は
  R2 `state/` (400 日 lifecycle・`r2-storage-design.md`)。
- **次 (実行順)**: ① `psi-audit-daily.yml`: `psi-batch-*.json` を `state/psi/` へ、`history.csv` は git のまま。
  読み手 `psi-threshold-check.mjs` / `fetch-psi-audit.mjs` / `search-growth/lib/sources.mjs` に「local 無ければ
  `live/`」を足す。② `cloudflare-usage-daily.yml` (`cloudflare/snapshots/`)。③ `url-inspection-daily.cjs`
  (`gsc/url-inspection/`)。③の読み手には `build-coverage-queue.mjs --sync-inspection` (直近14日の日次CSVで
  是正キューを done 化) も含める。④ `search-growth-weekly.yml` の `latest.json` / `live/`。domain ごとに 1 PR、
  移行後に `RETENTION_POLICIES` の該当 scope を消す。
- **停止条件**: 日次アラート (`[PSI Alert]` / `[Cloudflare Alert]`) の起票経路を壊さない (読み手が CI 内で
  直前に書いた raw を読む経路は維持する)。R2 へ書けなかった日は raw を捨てず artifact に残す。
- **完了条件**: 4 domain とも日次 commit-back が消え、`fetch-metrics-weekly.yml` の週次 1 commit だけが
  `.claude/state/metrics` を触る。`npm run state:pull -- <domain>` が 4 domain で動く。

### [STATE-R2-LIFECYCLE-01] R2 `state/` prefix の object lifecycle rule (400 日) をオーナーが設定する

タグ: [インフラ・計測] [種類:改善] [実行:ユーザー] [検証:Cloudflare ダッシュボード R2 → stats47 → Settings → Object lifecycle rules に prefix state/ の 400 日ルールがある] [起票:2026-09-14] [期日:2026-09-28] [領域:管理]

- **owner**: オーナー
- **何を**: Cloudflare ダッシュボード → R2 → `stats47` → Settings → Object lifecycle rules → Add rule:
  prefix `state/`、Delete uploaded objects after 400 days。コード変更なし。
- **なぜ**: `state/` は CI が日次・週次で書き続ける生 snapshot の置き場で、他の prefix と違い GC を
  `r2-retention.ts` の allowlist で運用しない (正典 `r2-storage-design.md` 「削除ポリシー」)。
  ルールが無いと 32GB (2026-09-12) の R2 に上乗せで増え続ける。
- **停止条件**: prefix を `state/` 以外に広げない (`app/` `gis/` は PROTECTED)。

### [CONFIG-SECRET-CLAUDE-JSON-01] `~/.claude.json` の github MCP に残る平文 PAT を退避する (gh CLI のプロキシ認証が前提)

タグ: [インフラ・計測] [種類:改善] [実行:ユーザー] [検証:node -e "const j=require(require('os').homedir()+'/.claude.json');console.log(Object.keys(j.mcpServers.github?.env||{}))" が [] を返す] [起票:2026-09-14] [期日:2026-10-12] [領域:管理]

- **owner**: オーナー
- **現状 (2026-09-14)**: Codex 側 (`~/.codex/config.toml`) の PAT は削除・github MCP を無効化済み。Claude 側
  (`~/.claude.json` user スコープ) の github MCP は `GITHUB_PERSONAL_ACCESS_TOKEN` を平文で持つが、会社 PC では
  `gh` CLI が「Proxy Authentication Required」で使えないため、この MCP が唯一の GitHub API 経路として残している。
- **次**: ① 会社 PC で `gh auth login` を通す (プロキシ設定 `HTTPS_PROXY` + `gh config set http_unix_socket` 等を
  試す)。② 通ったら `claude mcp remove -s user github` し、`~/dotfiles/bin/mcp-user.{ps1,zsh}` の集合と一致させる。
  ③ 平文で置かれていた PAT は GitHub 側で revoke して発行し直す。
- **停止条件**: gh が通る前に MCP を消さない (GitHub Issues / PR 操作が会社 PC で不能になる)。
- **2026-10-09 確認**: この Mac では検証コマンドが `[]` を返し、平文 PAT は残っていない。残りは会社 PC での同じ確認と、GitHub 側での古い PAT の revoke。

### [MAC-FIRST-RUN-01] 自宅 Mac で二拠点セットアップを初回実行し、Mac 固有の罠を local-environment.md に記録する

タグ: [インフラ・計測] [種類:改善] [実行:ユーザー] [検証:Mac で node .claude/scripts/setup-memory-symlink.mjs --check と node .claude/scripts/lib/sync-codex-mirror.cjs --check が exit 0] [起票:2026-09-14] [期日:2026-09-28] [領域:管理]

- **owner**: オーナー (Mac 操作) / Claude Code (罠の記録)
- **手順**: `local-environment.md` 「2 台で同じ形にする手順」の Mac 列を上から実行する
  (dotfiles clone → `link.mjs --host mac` → `git clone --filter=blob:none` → memory link → `core.hooksPath` →
  `~/tmp` → `local-resources.sh install` → `gh auth login; codex login` → mirror check)。
- **要確認 (未実測)**: `codex/host.mac.toml` の filesystem / notebooklm パスは仮置き (`/Users/kazu/...`)。
  `local-resources.mjs` の darwin `ps` 分岐と `assertNoLinks` の `/private/tmp` realpath は実機未検証。
  `.claude/settings.local.json` の seed (`stats47.local.mac.json`) の許可リストも初回で調整する。
- **現在地 (2026-10-05 Mac 実測)**: 検証コマンド 2 本は exit 0、memory / hooksPath / `~/tmp` / gh 認証は済み。
  2026-10-06 に dotfiles を適用済み (symlink・env・user MCP filesystem・認証。host.mac.toml のパスは dotfiles PR #1 で修正)。
  残り: ① Codex のモデルを Mac の `gpt-6.1-sol` / xhigh と dotfiles の `gpt-6-astra` / medium のどちらに揃えるか決め、`codex/base.toml` を直す
  (今は Mac の `~/.codex/config.toml` を手で Mac の値に戻してあるが、`link.mjs` を再実行すると戻る)。② `local-resources.sh install`。
  ③ Windows 側との `claude mcp list` / `codex mcp list` の名前の突合。④ dotfiles に取り込んだ Mac 設定 (dark・swift-lsp 等) が Windows で不要なら外す。
  実測は `local-environment.md`「2 台で同じ形にする手順」に追記済み。
- **完了条件**: Mac 側の `claude mcp list` / `codex mcp list` の名前集合が Windows と一致し、
  `local-environment.md` に Mac 節の実測が 1 つ以上追記されている。

### [PRODUCT-SALES-READINESS-01] 横断カタログの全商品を販売準備ゲートまで仕上げる

タグ: [収益化] [種類:制作] [実行:sweep] [起票:2026-09-06] [期日:2026-09-13] [領域:商品]

- **status**: in-progress（期日は次回棚卸し期限）
- **owner**: coconala-product-manager / kindle-publisher / note記事担当 / オーナー
- **対象の正典**: `data/products/catalog-status.json` の `offers`。既存商品と未制作候補、同一商品の販売先variantを分け、個別statusを本文に複製しない。人間向け一覧は `products:report` が生成する `.local/product-portfolio/catalog.html`。
- **再開点（2026-09-06）**: 現行候補は`CURRENT_SALES_REVISIONS`で固定。最終EPUB検査は`kindle-v3-20260906-r4-verification.json`で実本文全章SHAを保持。S2-01だけは当該版の独立review.jsonがあり、他巻へ流用しない。最初の公開前に、固定bytes送信・旧draft再投入・公開直前再照合を認証済み下書きで実測する（コード/モック検査のみでは実UI動作を合格にしない）。新規公開は実機・権利/申告・保全・オーナー承認がそろってから。
- **次（実行順）**: ①Kindle改訂版を全章で独立意味レビューする。書き下ろしだけでなくブログ/ランキング由来の本文・図を含め、未根拠因果・対象年/地域/分母の違いを是正し、内部比率を再計測する。②確定版のEPUB検査・Previewer・全章SHAに結び付いたreview.json・入稿bundle照合後、明示版指定のarchiveで旧版を保持して暗号化保全する。③note14パックの準備原稿に固有の使い方・図例を追加し、独立レビュー・価格/添付/利用条件確認へ進める。無料P13を含めた固定入力はfree-sample-delivery.jsonと納品manifestで照合する。未制作Geo11企画は原典・再現テスト・読者成果を満たすものから制作する。④商品別の残ゲートが解消してから、承認された対象だけを専用公開フローへ渡す。入稿提案JSONを公開済み記録と扱わない。
- **Kindle再接地の具体対象**: S1-01のブログ9章は全章の再編集が必要。`per-capita-income-gap`の本文と図の採用年・数値不一致、`heating-cost-vs-disposable-income`の名目支出/実質所得・世帯範囲の不一致、`communication-cost-burden`の交通通信費/通信費混同、`expenditure-structure-comparison`の性質別/目的別混在と因果主張、`black-tea-income-gap`の購入量/飲用量・相関/説明割合混同を残さない。S1-02も食品の支出・購入数量と調査対象都市を元記事の本文・図まで照合する。`editorial-corrections.ts`の部分校訂だけで当該章全体を合格にしない。他冊にも同種の旧断定があるため全章レビューを省略しない。
- **関連の別owner工程**: Office の実機確認は `NOTE-PACKS-REPLACE-COCONALA-01` (ココナラの本人確認は 2026-10-19 の撤退で不要)、歴史2指標は 2026-09-24 に原典 (社会生活統計指標2023 表7) と 47 県すべて一致を確認済み (`coconala-packs-2026-09-06.json` の `officialDefinitions.historicalSourceReconciliation`。`historicalNotReverified` の解除と納品 SOURCES の注記更新は商品担当の判断で未実施)。公開済みGeo noteの本文・添付再確認は認証済み画面が必要。売上/需要の不明を0扱いしない。
- **再利用本文の追加是正対象**: S1-03高齢単身の分母・通勤流入と移住、04介護必要数と不足数・化学工業と医薬品・相談窓口の時間、05大学収容力と入学定員・保育利用率と希望充足率、06財政指標の控除/平均期間・目的別と性質別、07宿泊施設範囲/人泊と人数・国籍から嗜好の断定、08供給契約と世帯普及率、09産業出荷/利益/用水効率、10火災地震合算/強度率の労働時間分母、11行動者率/稼働率、12有業者/雇用者を元ブログ・図まで直す。fresh訂正だけでは完了しない。
- **販売中v1の機械監査 (2026-09-19・全32冊EPUB展開)**: 販売中22冊はarchive `v1` (2026-08-30) と一致し、ランキング章はサイトAI解説の転載のまま。S2/S3/S4のランキング章481件のうち177件 (37%・71指標) が他冊にも載る同一指標で、60字以上の同一段落が2冊以上に532件ある (S3-01↔S4-01で21段落)。S2-01「人口・世帯」に高血圧性疾患/肝疾患/し尿処理/水洗化が入り、S3-01「北海道」の章は祭具・墓石/マフラー/うなぎ等 (地域の極端順位で機械選定)。S1のブログ章に「この記事/本記事」が11〜38件/冊残る。合計特殊出生率に単位「（人）」、同一章で「2023年」と「2023年度」が混在 (S2/S3で9〜19章/冊)。S3-01は「北海道の内訳を見ると、北海道が全国47位」型の定型文が24章。現行コードで再生成した v3 は解説を外して全県表になるが、31章すべてに同じ免責文が付き主題外キー・重複指標 (昼夜間人口比率×2) は残る。監査スクリプトは `verify-epub.mts` に (a)冊間の指標/段落重複 (b)ブログ残語 (c)年/年度混在 (d)率系の単位 の決定的ゲートとして移す。
- **S1-01 の是正 (2026-09-19 実施)**: v3-20260919-r1 を blog-critic (opus) が全 15 章で独立レビュー → REVISE (BLOCK 8 / MAJOR 19 / MINOR 13。大半が本文と図の年次不一致・名目/実質・世帯範囲・相関→因果)。40 件 + 追加 6 件 (2014 年の別指標図の除外・要約図の見出し誤りの除外・重複節の置換・年度→年) を `editorial-corrections.ts` (ブログ由来章・書籍版のみ) と `manuscripts/K-S1-01/` (書き下ろし) に反映し、`v3-20260919-r3` を生成 (15 章・図 35・書き下ろし 32.7%・verify-epub 3 層 error 0 / warn 0)。findings の記録は `.local/kindle-books/K-S1-01/v3-20260919-r3/review-r1-findings.md`、delta 再審査は同 dir の `review.md`。**同じ誤りは公開ブログ 9 本 (real-disposable-income-reversal / heating-cost-vs-disposable-income / per-capita-income-gap / savings-balance-gap / engel-coefficient-prefecture-ranking / household-spending-prefecture-gap / communication-cost-burden / expenditure-structure-comparison / black-tea-income-gap) に残っている** → blog remediation (`/blog-revise-fix`) で review-r1-findings.md の before/after を must-fix として直す (図の再生成: savings-ranking を 2019 年 financial-assets-balance に、income-summary-findings の heading「約200万円」→「約20万円」)。残り: R2 暗号化保全 (鍵のある環境でオーナー) → `kdp-publish --update` (書名変更 + 本文差替) → オーナー承認で `--commit`。
- **S1 12 冊の是正完了 (2026-09-19)**: 全冊を blog-critic (opus) の全章 full 審査 → delta 再審査で PASS にした。その後、critic が「据え置き」にしていた生成器側の項目を直して最終版を作った (章番号「第1章〜」の統一 / 扉の紹介文をですます調に / 図の読み方から未使用の「偏相関」を除去 / 推計章の無い冊から「推計を扱う章では…」を除去 / 出典節が無い 4 章にサイトの出典カードから「データ出典」を起こす / **図の中の文字を `figure-corrections.ts` で校訂** = K-S1-06 の 11 図・08 の 6 図・10 の 12 図の 年→年度、K-S1-10 保険散布図の図題・縦軸、K-S1-06 折れ線の「全国推移」→「47都道府県単純平均の推移」)。最終版 = 01 r9 / 02 r10 / 03 r11 / 04 r8 / 05 r11 / 06 r10 / 07 r9 / 08 r12 / 09 r10 / 10 r8 / 11 r8 / 12 r7 (表紙を Codex imagegen の帯絵に差し替えた版。本文は前版と byte 同一・全冊 `verify-publishable --content-only` blocker 0、`review.json` 受領証と `kindle-<版>-verification.json` あり) (`v3-20260919-*`、verify-epub 3 層 error 0。据え置き解消後の版は全 12 冊が delta 審査 PASS、最後の出典一覧の番号付けだけは diff 確認で引き継ぎ)。判定は各 `.local/kindle-books/K-S1-NN/<版>/review.md`。入稿提案 12 本 = `.local/kindle-listing-revisions/<版>.<id>.json`。校訂 `editorial-corrections.ts` ~1,460 件 / 60 slug (書籍版のみ。**公開ブログ 55+ 本に同じ誤りが残る** → `/blog-revise-fix` の must-fix に各冊 r1 の `review.md` と `KINDLE_EDITORIAL_CORRECTIONS[slug]` の before/after を入力する。「この章」等の書籍向け言い換えは除く)。
- **書籍側では直せず残るもの (ブログ側 chart-author 工程)**: ①K-S1-06 財政力指数ランキング図の小数 1 桁表示 (F-003-17: 島根 0.25 と徳島 0.31 が図で同じ「0.3」。`resolveValuePrecision` で再生成) ②図データの年・指標の差し替え (K-S1-01 savings-ranking は 2014 年の別指標のため書籍から除外済み。ブログ側は 2019 年 financial-assets-balance で再生成) ③**data-configs の `yearFormat` が 家計調査・国勢調査・社会生活基本調査まで一律 fiscal** (2026-09-19 実測: S1 12 冊の図 120 枚のうち calendar は 家計調査の一部と将来推計だけ)。書籍は critic が本文で確定した型に図を合わせたが、根は config 側 → `METRIC-YEARFORMAT-KAKEI-01` を家計調査以外にも広げる。図の校訂は config が直ったら不要になる (before が消えて生成が止まるので、そのとき外す)。
- **出典一覧は章題を出す仕様 (K-S1-10 N36 / K-S1-12 N02)**: ブログ題は撤回済みの旧主張を含みうる (K-S1-04 m08) ため意図的。据え置きではなく決定。
- **S2/S3/S4 の販売中 10 冊は 2026-09-19 に KDP で出版停止を実行済み** (オーナー指示 → `kdp-unpublish.mjs --all-withdrawn --commit`。本棚 read-back 10/10 が「下書き」、listing は `status: "withdrawn"` + `withdrawal.unpublishedAt/readBack/evidence`)。ストアの商品ページ消滅は数時間〜72 時間後に `curl` か本棚で確認する。
- **残るオーナー工程 (2026-09-19 時点の `verify-publishable` 全冊の blocker と同じ)**: ①R2 暗号化保全 `npm run kindle:archive --workspace=@stats47/r2-storage -- --push --id <id> --version <版>` → `--audit --deep --record` (鍵のある環境。これが無いと `kdp-publish --update` の archive gate で止まる) ②Kindle Previewer で対象 EPUB (SHA) の表示確認 ③`kdp-publish --update --id K-S1-NN` ×12 (S1-01 は書名変更を含む・入稿提案 `.local/kindle-listing-revisions/`) → 承認後 `--commit` ④kdpreports.amazon.co.jp の冊別 export → `products:sales` ⑤ブログ側の同一誤り是正 (上記) と図データ再生成。
- **ランキング再利用の境界**: S2-01旧版全章レビューでDID可住地分母、死亡率/件数、従属人口指数/就労者、都道府県率の合算、単純平均/全国値、相関からの因果・算術誤りを検出。商品版のランキング章は未レビューAI解説を外して同順位の全県表・決定的集計へ再構成した。公開サイト本文は未変更のため、原典再計算とサイトownerへの是正引渡しが必要。旧版レビューを新版PASSへ流用しない。
- **note 販売記事 (教材展開) の現状 (2026-10-12、オーナーが「55本すべて公開」を指示)**: `docs/31_note記事原稿/product-sales/` の 55 本は 2026-07 の v1 から生成した旧原稿で使わない。現行は 14 パックから `note/cli.ts revision` で作るが、このMacには各パックの `_delivery` (`.local/coconala-products/P-NN/v2-20260906-r1`) が無く、`revision --revision 2026-10-12-r1 --all` は ENOENT で `readyToPublish:false`。14 パックとも `officeValidation: owner-pending`。進めるには (a) 納品物をWindowsから持ってくるか新しい版を生成し (b) オーナーがOffice実機で確認し (c) revision→レビュー→1日数本ずつ公開 (添付は1日10回まで)。
- **note 販売記事の置き場 (2026-10-13 改訂)**: 14 パックの販売記事の原稿は git (docs/31) から外れ、記事台帳 `data/note/articles.json` と R2 に移った。
  有料 13 本は private R2 (`body.store: r2-private`)、P-13 見本 (無料・公開済み) は公開 R2。公開するときは `npm run note:article -- checkout <slug>` で作業コピーを取り出し、
  公開後に台帳の status / noteUrl / publishedAt を書いて `generate-note-catalog.ts --apply`、作業コピーを変えたら `save`。残りの前提は変わらない (Office 実機確認・添付 1 日 10 回・一括公開しない)。
  添付 ZIP (`.local/note-product-archives/P-NN-v3-20261012-mac-r4.zip`) はこの Mac にしか無い (保全は `NOTE-PRODUCT-ZIP-ARCHIVE-01`)。
- **停止条件**: 生成/形式検査だけで販売準備完了にしない。内部30%をAmazonの合法性・受理保証と説明しない。字数水増し・収録指標の黙った削減をしない。税務・銀行・本人認証・規約同意を代行せず、KDP Select独占を他チャネル展開と両立済みと扱わない。旧公開版・原稿を上書きしない。公開stateを機械品質の結果で書き換えない。
- **完了条件**: 全offerが対象版の実検証・独立レビュー・必要な人間確認を満たすか、採用見送り理由と再開条件が明記される。販売を選んだofferは価格・納品物・権利・公開証跡が一致する。未完了が1件でもあれば「全商品販売可能」と報告しない。

### [KDP-COVER-CODEX-APP-01] S1 12 冊の表紙帯絵を Codex アプリで作り直して差し替える

タグ: [収益化] [種類:制作] [実行:ユーザー] [検証:node --import tsx packages/product-factory/scripts/verify-publishable.mts --version <版> --book <id> --content-only] [起票:2026-09-19] [期日:2026-10-17] [領域:商品]

- **owner**: オーナー (画像生成) / kindle-publisher (取り込み・再生成・検証)
- **現状**: 2026-09-29 に画像バイナリをGit管理から外し、承認済みassetをR2 `media/kindle-cover-assets/<id>/<revision>/`、Gitをkey/SHA台帳だけにする方式へ変更した。KDP台帳で現在公開中なのはK-S1-01〜K-S1-12の12冊で、S2/S3/S4は出版停止済みのため表紙更新対象外。K-S1-01〜K-S1-12は新しいポップ表紙を1冊ずつ目視承認済みでR2へ公開し、各4ファイルの再取得SHA一致と公開URL 200を確認済み。画像制作・承認・R2保全は12冊すべて完了し、残工程は各冊を新versionで再生成して本文差分0・検証・入稿提案更新を確認する工程。
- **作り方 (Codex アプリ)**: 貼るプロンプトは Drive の `stats47/Kindle表紙/_imagegen-tooling/`の `CODEX-APP-PROMPT.md` (12 冊を 1 メッセージで。1 冊だけなら表を 1 行に)。1 冊ずつの英文は各書籍の Drive 候補フォルダ `Kindle表紙/K-S1-NN/candidates/` の `original-K-S1-NN.prompt.txt` (元画像は同フォルダの `original-K-S1-NN.png`、12 本。型は `_imagegen-tooling/build-prompts.mjs`: 紺地 #0f2540 + 琥珀のペーパーカット風・大きなモチーフ 2〜3 個・**横長 1536×1024**・文字/数字/通貨記号/ロゴ/地図/顔なし)。帯絵は表紙の**下 42% だけ**に出る (上は文字面) ので、縦長で描かない。生成した PNG を `.local/kindle-cover-imagegen/K-S1-NN.png` に置く。
- **次 (差し替え手順・kindle-publisher が実行)**: ①1冊だけ生成して目視承認 ②`ingest-cover-background.mts --book K-S1-NN --input <png> --pop-band`でR2 staging ③完成PNG/JPEGとmanifestを同revisionへ置き、exact keyをR2 push ④`cover-design.ts`へkey/SHA/byte/寸法を登録 ⑤`products:kindle:generate -- --id K-S1-NN --version <次の版>` ⑥章テキスト差分0、`verify-epub`、review receipt、`verify-publishable --content-only` blocker 0を確認 ⑦入稿提案を最新版へ更新。
- **禁止**: 画像に文字・数字を焼き込まない (書名・著者は satori が実テキストで重ねる)。生成 AI の描く日本列島を使わない (2026-08-12 の指摘)。差し替え版は必ず新しい version で作り、既存版を上書きしない。KDP への表紙アップロードは `kdp-publish --update` の工程で行い、ここでは触らない。
- **完了条件**: 12 冊ぶんの帯絵がオーナー選定の絵に置き換わり、各冊の最終版が本文差分 0・`verify-publishable --content-only` blocker 0 で、入稿提案が最新版を指している。差し替えない冊は現行の帯絵のままでよい (その旨をこのカードから消して閉じる)。

### [AFF-FURUSATO-INVENTORY-01] ふるさと納税ポータルの提携を 2〜3 件足す (furusato 在庫 2 本 / 週 5.4 万 imp)

タグ: [収益化] [種類:制作] [実行:ユーザー] [検証:node .claude/scripts/ads/audit-affiliate-inventory.ts の furusato 横長 banner ≥ 7] [起票:2026-09-03] [期日:2026-09-30] [領域:アフィリエイト]

- **owner**: uruhayato373 (ASP 提携) / affiliate-manager (登録)
- **追加申請の前提**: 最新の提携状態・観測範囲・証拠は `data/affiliate/affiliate-stocktake-latest.json` を参照。
  チョイス `s00000019332001` とさとふる `s00000014771001` は実機で明示未提携を確認したため、
  承認待ちとして扱わない。過去の申請履歴がある両案件は再申請せず、掲載判断は状態の証拠に基づく。
  もしもは2026-09-08にSID638943一致を確認済み。既存返礼品3830・3172は提携中なので再申請不要。
- **現在地 (2026-09-08)**: もしもの新規3件は申請済み。3831ポケットマルシェは審査待ち、
  1863食べチョク・55楽天トラベルは承認済み（状態の正典は `affiliate-catalog.json`）。
  承認済み2件の300×250原稿は `.local/affiliate-harvest/moshimo/2026-09-08/` に取得済み・在庫SSOT未登録。
  これらは通常商品／旅行の案件であり、ふるさと納税ポータル在庫の完了件数には含めない。
- **追加6件の次工程**: オーナー承認後にstats47から各1回申請済み（2026-09-08、重複送信なし）。
  A8の羽田産直 `s00000021701002`・九州お取り寄せ本舗 `s00000020875001` は承認済みなので、
  掲載適合性を確定して素材取得・ローカル登録へ進む。WESTERモール `s00000027147001`・
  北海道ぎょれん `s00000021814001`、afbのふるさとプレミアム `9156`・日本の旅 鉄道の旅 `16537` は
  審査待ちにつき状態照合のみ行い、再申請しない。状態の正典は `data/affiliate/{a8,affiliate}-catalog.json`。
  6件とも広告在庫未登録・未掲載。送信/再照合の証拠は `.local/affiliate-ops/` に保持。
- **次**: 返礼品3830・3172の原稿取得と掲載条件確認、上記承認済み素材のローカル登録。
  食品は産地に一致する食文化/特産品ページ、鉄道旅行は国内観光の文脈に限定し、返礼品在庫と混同しない。
  承認後も案件別eligibility・重複・成果条件・申請対象サイトを再照合する。浜名湖産直 `12522` は
  対象商品の紹介文が掲載条件のため保留。条件原文はこのPCの `C:/tmp/stats47-{a8,afb}-offer-details-20260908.json`。
  楽天トラベルは既存の直接提携広告と比較して採用先を決め、二重配信しない。
  もしも発行原稿の独立ピクセル・referrerpolicy・attributionsrc・PR条件を落とさない。
  別セッションを含む専用ブランチ `codex/workspace-updates-20260908` へのcommit・pushは承認済み。develop/main反映・R2更新・デプロイは別途公開承認を得てから行う。
- **なぜ**: #913 で家計調査 (ランキング 28,867 + ブログ 12,366 imp/週) と農業・地方財政が furusato に
  集まる。一方、全国対応の横長バナーは **2 本** (ふるさと本舗・au PAY) だけである。イオン九州3枠は
  地域・購買意図の不一致と成果0円の実績から2026-09-15に全配信を停止した。需要と在庫が最も逆転している軸。
- **候補**: さとふる / ふるなび / 楽天ふるさと納税 / ANA のふるさと納税 (A8・もしも・afb のどこで
  提携できるかは `/affiliate-operate` の走査で確認。ブランド適合は人の判断)。
- **手順**: ユーザーが ASP で提携申請 → 承認後 `/register-affiliate-banner register` で 300x250
  を 1 案件 1 エントリ登録 (vertical=furusato、priority は確定 EPC バンド) → develop push で R2 反映。
- **完了条件**: furusato の横長 300x250 が 7 本以上、かつ priority 上位 3 が全国対応ポータル。
- **禁止**: 楽天ふるさと納税の代わりに楽天市場の商品カードで代用しない (別チャネル)。

### [QUALITY-GATE-COVERAGE-01] CI・テスト・監査の実効網羅性強化

タグ: [種類:改善] [実行:対話] [起票:2026-08-13] [領域:管理]

- **owner**: Claude Code
- **trigger**: `CROSS-PAGE-DATA-SSOT-01`のcore契約を壊さず、Claude CodeへこのIDを指定してQG0から順に実装する。
  QG0、QG2、QG4、QG7はデータ移行と独立して先行できる。QG1、QG3、QG6の最終受入は同項目のWP6後に行う。
- **目的**: 「checkerやtestファイルが存在する」ではなく、公開値を壊す欠陥を意図的に混入したときに
  対応するPR gateが確実に失敗し、修復後にgreenへ戻る状態を作る。production workspace、R2境界、主要route、
  単位・配色・欠測の意味まで同じ契約で検証し、未実行・fail-open・過度なskipを機械的に検出する。
- **QG0 完了 (2026-08-26)**: `quality-gates.json` に26 workspaceとcritical checker 43件を登録し、
  checkerの実行文脈を `declared / invoked / blocking / scheduled` へ分類した。blocking 41件・scheduled 22件に対する
  未宣言criticalは0。未配線、docs-only、`continue-on-error`、期限切れ例外、重複ID、不存在command、
  未宣言criticalのfixture 11件と実repo監査がgreen。次はQG1から再開する。
- **QG1 checkpoint (2026-08-26)**: production webからe-Stat providerへの推移import graphをAST化し、
  static/dynamic/re-export/require/wrapper/aliasを検出、type-onlyだけを許可する18 testを固定した。
  ThemeCatalogとWeb runtimeのchart propsを共有parserへ統合し、欠落`statsDataId`、空配列、非string filter、
  未知field/chart/metricKeyを両側で拒否する。unit classifierはSI倍率、分母の母集団・量、異なる計数単位、
  片側period不明を理由付きで判定し、公開`./unit` APIを実際のテーマ軸判定へ接続した。残りはmoney unit監査の
  blocking配線とsource/stored/display/recipe変異で、QG1カード全体は未完了。
- **QG2 完了 (2026-08-26)**: `createSnapshotReader`をruntime parser必須にし、正常 / 404 / malformed /
  schema-invalid / 旧新schema / stale / 5xx / timeoutの9状態をfixtureで固定した。categoriesはproducer→reader
  round-tripとpage adapterの状態写像を検証し、stats-r2、page-components、area profile/databook、correlation、
  ranking itemなど公開routeへ届く優先readerをparser境界へ移行。reader契約inventoryも機械化した。
  対象69 test、packages 1,930 test、web 1,081 test、全workspace + scripts type-checkがgreen。次はQG3。
- **QG3 checkpoint (2026-08-26)**: 同一fixtureのmetric / year / area / value / unit / provenanceを
  ranking・theme・blog adapterで縦断照合し、10倍変異をRED、復元後25 test GREENで固定した。
  known routeをstatus / canonical / heading / data要素で検証する公開route matrixと、375 / 768 / 1280pxの
  responsive smokeを追加。初回実走でCPIの空unitとbespoke地方財政の機械属性欠落を検出・是正し、
  公開8導線 + 5テーマ全9 chart type + 4幅の25 E2E、型検査、pre-commitはgreen。
  no-data / source errorの専用表示など残りのQG3受入は継続する。
- **QG4 admin slice (2026-08-27)**: PR CIのpackages testが`@stats47/*`だけを対象にし、activeな
  `apps/admin` 16 files / 150 testsを一度も実行していなかった欠落を是正した。`test` jobでadmin unitを
  blocking実行し、command削除・`continue-on-error`化・required集約からの切断を各mutationで検知する
  workspace契約を追加。契約17件、admin 150件、型検査はgreen。
- **QG4 build / media slice (2026-08-27)**: admin production buildとdesktop smoke 15件を独立required jobへ
  接続し、build欠落・E2E soft-fail・required切断をmutationで固定した。Remotionは166 sourceの
  critical bundlerとしてbundle buildをrequired並列jobへ追加し、GESは3 sourceのtooling-only generatorとして
  PRではtype-check、外部実機生成はdeferredとregistryへ明記。親側実測はadmin build 10.72秒、E2E 15/15・19.1秒、
  Remotion bundle 9.39秒、admin/media契約10/10、workspace契約25、workflow policy 64/0、checker wiring 96・new 0。
  残りQG4は全source-bearing workspaceのrisk分類、test 0 / lint / build enforcement、CI p95集計。
- **QG4 workspace matrix (2026-08-27)**: source-bearing 25 workspaceをactive 22 / tooling-only 3へ分類し、
  type-check必須25、test必須19・none 6、build必須3・none 22、lint必須1・none 24をmanifestから自動突合する
  0.10秒のblocking契約を追加した。親側で全量/mutation契約18/18、workspace契約25、workflow policy 64/0、
  checker wiring 96・new 0を再確認。QG4の分類・配線残件は0、実CI p95は統合後のrun履歴で計測する。
- **QG5 first slice (2026-08-27)**: shape gate、unit classifier、dependency collector、chart props validator、
  R2 runtime parserの5モジュールについて、実測したlines / branches / functionsの個別floorを単一inventoryへ固定し、
  PRのrequired `test` jobへ134 testのcoverage判定をblocking接続した。inventory欠落、推測floor、Vitest配線欠落、
  soft-fail、required集約切断を8 mutation契約で検知する。追加CI時間は実測4.29秒、関連65 files / 751 tests、
  契約43件、type-checkはgreen。残りQG5はcritical module拡張、web routeロジックのpure抽出、
  `src/app`一括除外縮小、意味あるfixtureによるbranch coverage改善。
- **QG5 recipe / value slice (2026-08-27)**: metric recipeとvalue verificationを同じinventoryへ追加し、
  実測floorをrecipe 100 / 93.47 / 100、value 100 / 97.91 / 100（lines / branches / functions）に固定した。
  7領域200 testsをPR blockingへ接続し、未分類IDとrecipe branch低下のRED、復元後GREENを確認。
  data-configs全64 files / 718 tests、契約8件、type-check、pre-commitはgreen。CI増分は初回QG5比約1.1秒。
- **QG6 semantic color slice (2026-08-27)**: semantic role 20件をすべて有効なhexへ解決し、移行前14色の
  goldenを固定した。`rainbow` / `red` / `var(...)` / `oklch(...)` / `series-99`をcatalog・runtime双方で拒否し、
  consumer 0だったCSS resolverを削除。対象67 test、data-configs全727 test、type-check、catalog監査はgreen。
- **QG6 render deterministic contract (2026-08-27)**: opt-in render 9件のinventory、TZ・locale・viewport・DPR・
  font SHA・artifact出力先・RAF待機を決定的契約へ固定し、通常suite 28 files / 172 testsはgreen。opt-in実走は
  37 files / 185 testsのうちpixel差7件が残ったため、停止条件どおりPR必須化・scheduled配線は保留した。
  次は固定raster engineでgoldenを再検証し、7件を解消後にworkflowへ接続する。
- **監査ベースライン (2026-08-13、ローカル実測)**:
  - rootの`test:packages`は`vitest run --project '@stats47/*'`で、`apps/admin`のunit test
    **14 file / 136 test**はPR CI対象外。galleryにはPlaywright 6 specもあるがworkflowから呼ばれていない。
    PRのbuildは`apps/web`だけで、gallery / remotion / gesのbuild・smokeは明示されていない。
  - `apps/remotion`は約166 source file、`apps/ges`は3 source fileだがテスト0。testのない小packageもある。
    すべてへ一律にtestを足すのではなく、active / inactive / tooling-onlyとownerを先に確定する必要がある。
  - web coverage floorはlines/statements/functions 22%、branches 46%。`src/app/**`、middleware、provider、store等が除外され、
    packages側はcoverage thresholdを持たない。重要な境界が増えても全体率だけでは回帰を検出できない。
  - web E2Eは14 specあるが、known rankingを`200`または`410`で許し、`410`ならskipするケースがある。
    テーマchartの値・単位・非空状態、category / survey / tag / city-categoryの主要導線、PR前responsive smokeが不足する。
  - `fetchFromR2AsJson<T>`は`JSON.parse(...) as T`で、runtime schemaを検証しない。`packages/stats-r2`のreaderと
    `createSnapshotReader`の直接testがなく、22以上のtyped R2 read sourceに検証有無のばらつきがある。
  - e-Stat境界checkは導入途中だが、静的import中心の検出ではdynamic import、re-export、ローカルwrapper経由を
    取りこぼせる。production providerへの推移的な到達を検査し、最終allowlist 0を受入条件にする必要がある。
  - 金額単位監査は347 metric中consistent 5 / mismatch 42 / unknown 300だが、通常実行は
    `--fail-on-error`なしでexit 0。checker wiringは84 checker / new unwired 0と報告する一方、package script、docs、skillからの
    テキスト参照も「配線済み」に数えるため、PRで実行されるblocking gateかを保証しない。
  - semantic color roleは現行20個で、採用済みruntimeは生成時hex解決。一方で未定義CSS tokenを返す
    `resolveChartColorCssVar`だけが未使用で残り、resolver parity testが実consumer不在を隠す。
    visualizationのrender test 9件は`RUN_RENDER_TESTS=1` opt-inでworkflow実行がない。
  - `provenance-audit-weekly.yml`はcatalog / area databook / open-data validatorを`|| true`で継続し、全exit codeを
    集約していない。prefecture statistics / open-dataの決定的validatorやlink checkにも定期実行の空白がある。
  - theme actionには取得失敗を`[]` / `null` / 空timeseriesへ変換する経路があり、HTTP 200だけのE2Eでは
    `no-data`、`source-unavailable`、`schema-invalid`を区別できない。
  - config warningは少なくともunit語彙45 use、polarity未割当2,241、catalog warning 194が残る。
    一括strict化ではなく、warning class別の縮小ratchet・owner・期限が必要。
- **進行中実装の再監査残件 (2026-08-13、欠陥fixtureで再現)**:
  - e-Stat境界checkはstatic value importの12 testがgreenだが、`import()`、re-export、`require()`を各1件入れると
    すべて未検出 (`false`)。直接import一覧10 fileに対しproductionの`fetchEstatData(` callerは少なくとも15 file、
    `fetch-db-chart-data.ts`だけでdynamic value importが3箇所あり、現在のgreenはruntime到達0を意味しない。
  - `validateChartProps("line-chart", {estatParams:[{cdCat01:"A"}]})`とdonutの`color:"rainbow"`が
    どちらもerror 0。`componentProps`は依然`Record<string, unknown>`でapp側parserと形を二重定義し、
    `StatSeriesRef`はrepresentative fixture以外のconsumerがまだない。
  - `classifyUnitComparability`は`kg→g`、`km→m`、`l→ml`、`人口10万対→人口千対`、`件→校`を
    すべて`same / factor 1`と判定する。片側だけperiodがある場合も`same`になる。さらにpackageの`./unit` exportは
    `unit-semantics.ts`だけを指し、このclassifierはtest以外から公開・利用されていない。
  - catalogの生色は179→0まで移行した一方、roleは現行20個、CSS tokenは0、CSS resolverのconsumerも0。
    runtimeは`transform`でroleをhexへ戻す方式。移行前14 distinct色を確認する逆写像testは、移行後の
    `baseline.distinctColors=[]`をloopするため空振りgreenになり、未知roleもresolverが文字列のまま通す。
  - live監査はpure core testがなく、`--limit 0`で0/192件でも`coverageOk:true`・exit 0を実測した。
    返却行が要求filterを満たすかは照合せず、scheduled workflowも監査exit codeをIssue条件へ使うだけで
    最後に非0を返さないため、GitHub上のrunは成功表示になりうる。
- **依存と責務境界**:
  - データ取得のR2一本化、`StatSeriesRef`、単位変換一回、theme dependency、semantic color roleの実装本体は
    `CROSS-PAGE-DATA-SSOT-01`が所有する。本項目は、その契約を迂回できないtest / CI / mutationを所有する。
  - `sourceUnit` / `valueScale`と金額42件の実データ是正は`MONEY-UNIT-SCALE-01`、shape / configHashは
    `RANKING-VALUES-PARTITION-INTEGRITY-01`を再利用する。同じ分類表・allowlist・監査母集団を複製しない。
  - 公開blog / ranking / themeのlive期待集合、欠落asset / R2 payloadの是正、alertのopen / closeは
    `PUBLIC-DATA-CONTRACT-AUDIT-01`が所有する。本項目のQG2 / QG3は、その監査が使うruntime schema、fixture、
    page adapter、E2Eを所有し、別のlive scannerを作らない。
  - baselineに残る個別findingの返済は`MAINTENANCE-DEBT-PAYDOWN-01`が所有する。QG7はbaselineを増やせない
    機械契約と期限管理だけを実装し、既存findingを本項目へ複製しない。
  - 完全DBレスを維持する。廃止済みD1用のintegration testを増やさず、実態がunit testの`test:integration`は
    内容に合う名称へ変更または削除する。
- **実装規律**:
  - Claude Code単独を既定とし、同じworking treeでwriterを並行起動しない。開始時にdirty fileを列挙し、
    このIDと無関係な差分を編集・stageしない。`git add -A`、commit、PR、deploy、workflow dispatch、R2 writeは禁止。
  - 各QGで、まず最小の欠陥fixtureを入れて対象gateがredになることを確認し、その欠陥だけを直してgreenへ戻す。
    greenの確認だけで完了にしない。fixtureの欠陥は作業中に戻し、repositoryへ壊れた状態を残さない。
  - deterministicな検査はPR blocking、secret・network・pixel差の影響を受ける検査はscheduled / manualに分離する。
    不安定だから検査自体を消すのではなく、同じ契約をfixtureでPR、live dataでscheduleの二層にする。
  - baselineは現行欠陥を一時許可する縮小ratchetだけに使う。current branchの定数だけと比較せず、merge-baseの結果と比較し、
    baseline値の引上げ・allowlist追加・skip追加を通常の機能差分で同時に通せないようにする。
- **実行順**:
  1. **QG0 — 実行される品質ゲートのインベントリをSSOT化**
     - root workspace一覧、各workspaceのsource数、`type-check` / `test` / `coverage` / `lint` / `build`、
       PR / scheduled / pre-commit / manualの実行箇所をpure collectorで列挙する。active、tooling-only、inactiveを
       owner・根拠・再確認日付きで分類し、未分類をerrorにする。
     - 既存の機械configがなければ`.claude/config/`に品質ゲートregistryを置く。最低fieldは`id`、`command`、
       `scope`、`owner`、`trigger`、`blocking`、`network/secrets`、`timeout`、例外時の`reason` / `expiresAt`。
       `.github/workflows/README.md`と`docs/01_技術設計/06_自動化インベントリ.md`はこのregistryの説明・参照だけを持つ。
     - `check-checker-wiring.cjs`を、単なる文字列参照ではなく`declared` / `invoked` / `blocking` / `scheduled`へ分類する。
       package.jsonまたはdocsだけから参照されるcritical checker、存在しないcommand、期限切れ例外、重複IDをerrorにする。
     - fixtureへ「未配線checker」「docsからだけ参照」「workflow内`continue-on-error`」「期限切れ除外」を各1件seedし、
       すべて検知するtestを追加する。現行84件を新分類へ移した後、criticalな`declared-only`を0にする。
  2. **QG1 — e-Stat・単位境界の迂回防止**
     - TypeScript ASTまたは既存parserで、production `apps/web`から禁止providerまでのimport graphを作る。
       static value importだけでなく`export ... from`、`require()`、valueの`import()`、alias、ローカルwrapper経由を検査し、
       `import type`だけを除外する。endpoint文字列の直書きも別ruleで検出する。
     - static import、dynamic import、re-export、wrapper、alias、type-onlyの6 fixtureを置く。最初の5つがred、type-onlyだけがgreen。
       移行中allowlistはfileと理由・期限を持つ縮小専用とし、`CROSS-PAGE-DATA-SSOT-01`完了時に0へする。
     - catalog validatorとapp側`theme-chart-props.ts`が別々に形を解釈しないよう、chart種別のshared schemaまたは
       単一parserへ寄せる。`CatalogChart.componentProps`の`Record<string, unknown>`をdiscriminated unionへ置換し、
       現行移行中schemaでも`estatParams`内の`statsDataId`必須、空配列、非文字列filter、未知field / 未知chartを両方向testする。
       `StatSeriesRef`はfixtureを作るだけで完了にせず、実catalogとreaderのconsumerになり、metricKeyをregistry照合する。
     - money unit監査をPRまたはsnapshot生成前のblocking commandへ配線する。mismatchは常にerror、unknownは
       `meta-missing` / `no-tab-pinned`等のreason別baselineにし、新規unknownとbaseline増加をerrorにする。
       `sourceUnit`、stored/display unit、scale、period、recipeHashを1つずつ変異させ、取り込みgateとR2監査の両方が落ちることを確認する。
     - unit modelに基底単位への倍率と分母の量・母集団を持たせ、`kg↔g`、`km↔m`、`l↔ml`、`kWh↔MWh`、
       `人口10万対↔人口千対`を正しい倍率または比較不能へする。`件↔校`のような異なる計数単位を自動でsameにしない。
       periodが片側だけ不明な場合もsameと断定せず、理由付きunknown / incomparableへする。
     - 金額だけでなく上記SI・分母・計数・片側periodを両方向mutationへ追加し、`./unit`の公開entryからclassifierを
       importできるようにする。少なくとも実際のchart軸判定または監査1箇所をこの公開APIへ移し、test専用の死んだSSOTにしない。
  3. **QG2 — R2 producer / schema / reader契約をruntimeで閉じる**
     - R2 readerをconsumer別に棚卸しし、criticality、runtime parser、missing時の挙動、fallback、ownerを表にする。
       genericの`JSON.parse(...) as T`をproduction境界で直接使わず、既存schema libraryまたはpure type guardをreaderへ渡す。
     - `packages/stats-r2`、ranking item / values、page-components、categories、area profile/databook、correlations等の
       公開routeに届くsnapshotから優先してschemaを定義する。producerが出力したfixtureを同じreaderで読む
       round-trip testを置き、producerとconsumerが別の型を複製しない。
     - `createSnapshotReader`へ、正常、404、malformed JSON、schema-invalid、旧schema、新schema、stale、5xx、timeoutのtestを置く。
       fallback可能な旧schemaは明示migrateし、壊れたpayloadを空配列へ変換しない。
     - 返り値を少なくとも`ok` / `no-data` / `source-unavailable` / `schema-invalid` / `stale`で識別し、
       page adapterが各状態を意図した表示・ログへ写像するtestを追加する。retryやstatus分類にモデルを使わない。
  4. **QG3 — 公開ページの値・単位・欠測を縦断検証**
     - 固定fixtureに、同じmetric / year / areaの期待value・unit・label・provenanceを置き、ranking、theme、blog chart adapterが
       同じreader結果を表示するcontract testを作る。値の10倍、yearずれ、unitだけ変更、area欠落を別mutationとして落とす。
     - Playwrightのroute matrixへhome、known ranking、theme代表9 chart type、category detail、survey list/detail、tag、
       prefecture、city-categoryを登録する。公開が契約済みのknown routeで`200 | 410`や条件付きskipを許さず、
       期待status、canonical、主要heading、chart/data要素をassertする。
     - theme代表routeはHTTP 200だけでなく「期待chart数」「各chartのdata state」「unit」「year」「空でない系列」を検査する。
       意図したno-data fixtureは専用表示をassertし、source errorで空表示へ化けるケースを分離する。
     - 375 / 768 / 1024 / 1280pxのうち主要3導線をPR smokeへ入れ、全routeのresponsive監査はscheduledに残す。
       テストコメントとfixtureから旧D1前提を除き、R2 snapshot契約へ合わせる。
  5. **QG4 — workspace別CI matrixを明示化**
     - rootの`test:packages`を「packagesだけ」と明示したまま、active appを含む`test:all`相当の入口を追加するか、
       workflowでworkspace matrixを生成する。`apps/admin`の14 file / 136 unit testをPR CIへ必ず含める。
     - galleryはtype-check・unit・buildをblockingにし、6 Playwright specは変更pathでPR、全件をscheduledにする。
       remotionはactiveならtype-check/buildと代表compositionの決定的render smoke、gesはactiveならtype-checkと最小unit testを追加する。
       inactiveなら「testなし」を黙認せず、owner・理由・再確認期限付き例外にする。
     - sourceを持つpackageについて、純関数・変換・公開export・外部I/O境界の有無でrisk分類する。criticalなのにtest 0、
       `lint` scriptなし、build成果物を公開するのにbuild未実行、workspace追加後にmatrix未登録の状態をcheckerで拒否する。
     - CI時間をjob summaryへ記録し、cache込みPR p95が既存上限を5分超えて増える場合は、非決定的E2E/renderをscheduledへ分ける。
       type-check、unit、schema、境界guard等の決定的gateは時間理由で外さない。
  6. **QG5 — coverageを全体率から重要契約の回帰防止へ変更**
     - webとcritical packageのcoverage JSONを保存せず集計し、module / folder別の現行値を再計測する。
       初期floorは実測値を超えて推測せず、merge-baseからlines / branches / functionsのいずれも低下したら失敗させる。
     - 新規・変更したpure validator、unit classifier、shape gate、dependency collector、R2 parserは、全分岐をfixtureまたは
       mutationで通す。生成file、型だけのfile、framework boilerplate以外を都合よくcoverage除外へ追加しない。
     - `src/app/**`を一括除外したままにせず、route固有ロジックをpure moduleへ抽出してunit対象にし、page wiringはE2Eで検査する。
       package coverageをPR matrixへ足し、低い全体率を埋めるだけの無意味なtestは追加しない。
  7. **QG6 — semantic colorとrender結果を実ブラウザまで検証**
     - 採用済みの最終形を「git TSはrole、page-components / R2 / renderer入力は生成時に
       `resolveChartColorHex`でhex化」へ統一し、現行rendererを変えず未使用CSS resolverを削除する。
       CSS-var追従は今回へ混ぜず、必要ならdark modeの挙動変更として別途判断する。
     - 現行`CHART_COLOR_ROLES`全件（現在20）について、role→hexの全域性とcatalog→生成物の解決を確認する。
       移行前14 distinct hexはcatalogの
       空集合から導出せず固定fixtureまたはmerge-base生成物から取り、全色が同じ出力へ写る非空testにする。
     - 色キー値は「raw colorの正規表現に一致しない」ではなく「既知roleである」を条件にする。`rainbow`、named color、
       `var()`、`oklch()`、不明roleをvalidatorで拒否し、移行完了後のresolverは未知値を素通しせずfail-closedにする。
     - Playwrightで代表chartの実描画色を読み、未解決値、正負色反転、seriesと凡例の色不一致、light/darkのcontrast不足を検査する。
       新しいliteral colorは既存例外以外でPRを失敗させる。
     - opt-inのrender test 9件を、font・locale・timezone・viewportを固定して実行する専用jobへ配線する。
       変更pathではPR、全件はscheduledで実行し、差分artifactを保存する。pixel更新は欠陥を説明せず一括acceptしない。
  8. **QG7 — fail-open、warning、skip、baselineの縮小管理**
     - `provenance-audit-weekly.yml`で各validatorのexit codeを個別に保持し、最後に集約してjob statusとIssue本文へ反映する。
       出力収集目的の`|| true`は許しても、最終stepが1件でもerrorなら非0で終了するtestを置く。
     - prefecture statistics / open-dataの決定的validatorをPRまたはscheduledへ配線し、network link checkはtimeout、retry、
       stale判定、alert ownerを持つscheduled jobにする。secret不足は成功扱いせず`not-run`としてsummaryとalertに出す。
     - catalog、polarity、unit語彙、maintenance debt等のwarningをcode別に数え、`count`、`owner`、`reason`、`expiresAt`を持つ
       shrink-only baselineへ移す。新code、新warning、期限切れ、件数増加、baseline引上げを失敗させる。
     - `test.skip`、環境変数opt-in、除外glob、`continue-on-error`を機械列挙し、owner・理由・期限のないcritical除外を拒否する。
       product factoryの凍結test、GIS/e-Stat live test、render test等を同じregistryで追跡する。
     - `theme-chart-live-audit.mjs`のargument / mirror schema / inspect / coverage判定をpure coreへ分け、0・負数・NaNのlimit、
       空mirror、重複key、件数不一致、API status、malformed JSON、wrong-filter rowsをfixtureで検査する。partial実行は
       `coverageOk:false` / `status:partial`とし、smoke成功と全件成功を同じexit / stateで表現しない。
     - e-Stat返却行の`@tab` / `@cat01`等を要求した`cdTab` / `cdCat01`等と照合し、APIがfilterを無視して別系列を返しても
       greenにしない。scheduled jobはstate保存とIssue更新を終えた後、監査失敗なら最終stepで非0を返す。
  9. **QG8 — 最終mutation、文書、preflight**
     - e-Stat dynamic / wrapper、金額scale、SI倍率、分母量、R2 schema、theme dependency、未知色role、色逆写像の空集合、
       live監査0件 / wrong-filter、known route、workspace未登録、validator exit code、warning baselineの欠陥を一つずつseedし、
       該当PR gateだけがred、復元後に全gateがgreenになる結果を表で記録する。
     - `npm run type-check`、`npm run test:packages`、`npm run test --workspace=apps/admin`、
       `npm run test:coverage --workspace=apps/web`、web Playwright、active appのtype-check/build、追加したquality registry testを実行する。
       R2 schema / SSG / routeに触れたまとまりの節目で`npm run build --workspace=apps/web`も実行する。
     - 恒久契約だけを`apps/web/tests/README.md`、`.github/workflows/README.md`、
       `docs/01_技術設計/06_自動化インベントリ.md`とコード近傍READMEへ反映する。文書変更後は
       `npm run docs:fix`、`npm run docs:check`、`npm run docs:check:all`を実行し、開始時の既存warningから増えていないことを確認する。
     - 変更file、追加job、CI時間before/after、未実行live監査、例外残数、rollbackをpreflightとして提示する。
       commit / PR / deploy / workflow dispatch / branch protection変更はownerの明示承認まで実行しない。
- **停止条件**:
  - merge-baseとの差分を取れずbaselineを縮小専用にできない、またはmutationを入れても想定gateがgreenのまま。
  - CI追加がcache込みp95で5分超の増加、外部API rate limit、secret不足、pixel差の非決定性によりPRを安定して再現できない。
    この場合はdeterministic fixtureをPRに残し、live / visualだけをscheduledへ分離して再計測する。
  - runtime schema導入で既存R2 payloadを後方互換に読めず、remote再生成・R2 write・公開値変更が必要になる。
  - inactive workspaceの削除、branch protection、GitHub secret、remote workflow、deploy、R2への変更が必要になる。
  - ユーザー差分との競合、検査母集団の理由なき減少、allowlist / baseline / skipの拡大が必要になった場合は、
    対象、証拠、影響、最小の選択肢を提示してowner判断を待つ。
- **完了条件**:
  - 全workspaceと全critical checkerがregistryで分類され、criticalな`declared-only`、ownerなし、期限切れ例外が0。
    galleryの136 unit testがPRで実行され、active appはtype-check / test / buildの必要範囲が明示される。
  - production webからe-Stat providerへの推移的到達0。dynamic import / re-export / wrapperを含む陰性対照が境界gateで落ちる。
  - chart propsのshared schemaをcatalog / validator / app parserが共有し、`Record<string, unknown>`の二重解釈がない。
    `StatSeriesRef`が実catalog / readerで使われ、欠落`statsDataId`、未知field、未知metricKeyを拒否する。
  - unit classifierが金額、SI倍率、分母量、計数語、両側/片側periodを理由付きで判定し、誤ったfactor 1を返さない。
    公開package entryから利用でき、少なくとも1つのproduction判定と監査が同じAPIを使う。
  - 公開routeへ届くcritical R2 snapshotはruntime schemaとproducer-reader round-trip testを持ち、malformed / old / stale / 5xxを
    空データと区別する。同じfixtureのmetric / year / value / unitがranking、theme、blogで一致する。
  - known routeを`200 | 410`やskipで逃がさず、代表9 chart typeの非空・unit・year・data stateをE2Eが検証する。
  - 全color role（現行20）が選択した単一の解決方式、catalog、生成物、rendererで一致し、未知roleを拒否する。
    移行前14色の非空goldenとrender test 9件がPR変更pathまたはscheduledで実行される。
  - provenance等のvalidator失敗が最終job statusへ伝播し、warning / skip / baselineはcode別縮小ratchetで新規増加0。
  - theme live監査は0件・partial・wrong-filterを全件成功と扱わず、collectorが返す期待集合（現行移行中192件）の
    全件照合時だけcoverage成功になる。
    監査失敗はstate / Issue更新後もscheduled runの最終statusへ非0で伝播する。
  - QG8のmutationがすべて意図したgateをredにし、復元後に対象test、全type-check、必要build、docs checkがgreen。
    CI時間は停止条件内で、未実行のlive検査・外部反映・例外は0またはowner・期限付きで明示される。
- **正典**: `.github/workflows/pr-quality-check.yml` / `.github/workflows/README.md` /
  `docs/01_技術設計/06_自動化インベントリ.md` / `apps/web/tests/README.md` /
  `.claude/scripts/lib/check-checker-wiring.cjs` / `apps/web/coverage-thresholds.json` /
  `packages/r2-storage/src/lib/operations/` / `packages/stats-r2/` /
  `CROSS-PAGE-DATA-SSOT-01` / `MONEY-UNIT-SCALE-01` / `RANKING-VALUES-PARTITION-INTEGRITY-01` /
  `PUBLIC-DATA-CONTRACT-AUDIT-01` / `MAINTENANCE-DEBT-PAYDOWN-01`

### [CSV-DL-INTENT-SURVEY-01] CSV ダウンロード後に用途 1 問と任意の連絡口を置き、実務利用者を見つける

タグ: [収益化] [種類:改善] [実行:対話] [起票:2026-09-26] [領域:商品]

- **オーナー判断 (2026-09-26 壁打ち)**: CSV のサブスク化・登録制はしない。DL は無料・登録なしのまま、「誰が何に使っているか」を知る導線だけを置く。
- **根拠**: ランキング CSV の DL は 28 日で 193 件・120 ページ (`ADMIN-STAT-PILOT-01` の GA4 実測)。支払意思の証拠は 0 件で、聞き取り記録 `data/products/admin-stat-interviews.json` は目標 3 件に対して 0 件。
- **やること**: ①DL 直後に任意の 1 問 (用途: 業務資料 / 学習・研究 / 報道・執筆 / 個人の関心 / その他) を出し、回答を GA4 イベントで送る (analytics-event-standards の台帳に先に登録)。②「業務でお使いの方は話を聞かせてください」の任意の連絡口を置く。
- **禁止**: DL の必須登録、メールアドレス等の個人情報の保存 (DB レス方針・プライバシーポリシーの改訂が先)。回答を購入意思の代用にしない。
- **完了条件**: localhost で DL 後に 1 問が出て、回答が GA4 DebugView で観測でき、未回答でも DL が妨げられない。4 週後に用途別件数を `ADMIN-STAT-PILOT-01` へ転記する。
- **進捗 (2026-09-26)**: 実装済み・未デプロイ。`DataUsageCard.tsx` に DL 後の用途 1 問 (業務の資料 / 学習・研究 / 報道・執筆 / 個人の関心 / その他 / 答えない) と、「業務の資料」回答者にだけ既存のお問い合わせフォームへの案内を出す。イベントは `csv_download_purpose` (`trackCsvDownloadPurpose`)。**2026-09-26 更新**: `download_purpose` と `declared_purpose` (USER) を Admin API で登録済み、PR #1029 で本番反映済み。週次 snapshot の `download-purpose.csv` (2026-09-27 以降の週) に件数が出る。**残り**: ④4 週後 (2026-10-24 以降) に用途別件数を `ADMIN-STAT-PILOT-01` へ転記し、「業務の資料」の回答者・問い合わせ (`contact_click`) があれば聞き取り相手として扱う。

### [AFF-OFFER-ROTATION-01] 高単価案件と無料登録型案件を、1 枠ずつ順番に試して確定収益で比べる

タグ: [収益化] [種類:改善] [実行:対話] [起票:2026-09-26] [領域:アフィリエイト]

- **オーナー判断 (2026-09-26 壁打ち)**: 広告の数は増やさないが、出す案件の種類は色々試す。対象は (a) 高単価案件 (b) 無料登録・資料請求だけで成果になるハードルの低い案件。
- **制約 (実測)**: 2026-08-10〜09-06 の 28 日でクリック 13 件。同時に複数案件を入れ替えると、どれが効いたか分離できない (収益化戦略 §7)。
- **やり方**: CTR が出ている面 (article-end 0.195%・home-left-rail 0.654%) の 1 枠だけで、案件を 2 週間ずつ入れ替える。候補は `data/affiliate/a8-catalog.json` の `epcYen × confirmRatePct` と、成果条件が「無料登録」の案件から、各面の主題に合うものを選ぶ。評価は確定収益 / 1,000 viewable impression (クリック数ではない)。
- **前提**: A8・もしもの再ログインで確定成果の計測が戻っていること (現在 `auth_required`)。計測できない期間の入れ替えは結果が残らないので始めない。`AFF-INTENT-FALLBACK-STOP-01` / `AFF-SLOT-REDUCTION-01` のデプロイと同じ週に重ねない。
- **完了条件**: 3 案件以上を各 2 週間回し、案件ごとの imp・click・確定収益を表にして、残す案件と外す案件を決める。

### [RANKING-FIRST-VIEW-RELEASE-01] ランキングページを「最初の画面で答えを出す」形に改修し、既存 3 件とまとめて 1 回のリリースで測る
タグ: [UI・UX] [種類:改善] [実行:対話] [起票:2026-09-25] [領域:サイト]

- **現在地 (2026-10-10)**: 指標SSOT・表示契約と要約UIは本番確認済み。2,639指標/56テーマをdata/の定義・原典と指標IDで接続し、平均・分位・軸範囲は観測値から解決する。旧形式の互換読取は削除。上位3件/最下位は実値軸・単純平均線・順位差を示し、推移は数値Y軸・暦年X軸と選択年を示す。実装・検査の証拠は [PR #1116](https://github.com/uruhayato373/stats47/pull/1116)、必須CI [37908326854](https://github.com/uruhayato373/stats47/actions/runs/37908326854)。
- **配信検証**: [Deploy 37924050596](https://github.com/uruhayato373/stats47/actions/runs/37924050596) (main 8bff690216、[PR #1118](https://github.com/uruhayato373/stats47/pull/1118)) で、都道府県2,590個別item/2,500集約item・市区町村171 item/values組・home/master/page-componentsの計3,219 JSONを同じコードから再生成・契約検査・SHA固定manifestで反映してからアプリを公開。全件反映・build・キャッシュ更新・スモーク・sitemap検査が成功。公開R2でも全2,500集約itemと代表指標/市区町村の表示契約を検証済み。途中停止の再実行判定と53分の反映時間の対策は DEPLOY-METRIC-RELEASE-TIMEOUT-01 が所有する。
- **本番画面の受入**: 390/768/1440px、2020年切替、人口密度、100基準、市区町村、home/theme/area/geo/blog/全国と追加3タグの計17ケースが200・JSエラー0・横overflow0。日照時間2024年の平均2,034.6時間/首位差23.6時間、2020年の平均1,969.1時間、人口密度の人/100km²と5分位色を確認。スクショと observations.json は Codex visualizations の ranking-summary-review-20261009/production/。年・単位の切替は取得完了後を確認する。
- **本カードで残る範囲**: 以下の地図/表統合・出典整理等と公開後の回遊/アクセス計測。今回のSSOT・要約UI反映だけで親カードを完了扱いにしない。アクセス改善の効果は未計測。依存関係のSecurity Scanは既存のDEPS-BRACES-GATE-01の対象で、今回も未解消 (必須品質検査は成功)。
- **結論 (2026-09-25 壁打ち・オーナー合意)**: UI はランキングページを最優先にする。ランキングは PV 19,040 (国内 28 日、全体の約半分)・
  検索クリック 3,861 (GSC W38) の最大の面で、1 人あたり PV は 2.00。
- **問題 (2026-09-25 localhost 778px で確認)**: `/ranking/national-pension-full-exemption-rate` の最初の画面はタイトルと地図だけで、
  1 位・最下位・値という検索者の答えが無い。データの年は年の選択の中の「2006年度」にしか出ず、20 年前のデータだと気づけない。
- **範囲 (1 回のリリースにまとめる)**: ① 最初の画面に「1 位・最下位・値・年・単位」の要約を出す (新規) ② `RANKING-MAP-TABLE-CARD-01`
  (地図と表を 1 枚に) ③ `RANKING-PAGE-STRUCTURE-01` (補足文・出典・関連一覧の整理) ④ `RANKING-SOURCE-TRIPLE-01` (出典 3 か所。
  推奨: 見出し直下の 1 行とページ末尾の詳細の 2 か所にし、サイドバーから外す)。同じページに変更を小分けに重ねると効果を分離できない
  (収益化戦略 §7) ので 1 回で出す。データのページの最大幅 (`LAYOUT-MAX-WIDTH-DECISION-01`) はデスクトップ幅を見てこの中で判断する。
- **守ること**: スマホの LCP を悪化させない (`PERF-RANKING-LCP-03`・PSI モバイル最低点は ranking の 46 点)。データの年は
  `DATA-QUALITY-LOOP-01` の基準 3 (調査終了の明示) と整合させる。
- **測り方**: 基準値はランキングの 1 人あたり PV 2.00・ランキング→他ページの遷移 (`internal-transitions.csv`)。目標値は根拠が無いので
  今は置かず、`NAV-CLICK-COVERAGE-01` で部品別のクリックが取れてから決める。
- **完了条件**: 4 項目が 1 回のリリースで本番に出て、390 / 768 / 1440px の撮影で最初の画面に要約が見え、LCP が悪化していない。
- **全面点検で追加した範囲 (UI 全面点検 (2026-09-25・本番 44 URL × 7 幅 = 308 枚を撮影、250 枚を目視。`UI-FULL-SWEEP-01`))**:
  - 高: 1 年だけの `/ranking/junior-high-club-per100-swimming` の見出しに種目 (水泳部) が無く、地図の下の小さな文字にだけ出る。
  - 高: `/ranking/natto-consumption-expenditure` (世帯あたり) に「人口 10 万人あたり」「面積あたり」の計算方法の切替が出る。県庁所在市の値なのに表・上位 3 県で「福島県」と県名で出る。
  - 中: 「全国平均」が 47 都道府県の単純平均で、公式の全国値と誤解させる (データの意味としては `DATA-VALUE-ERRORS-01` でも扱う)。
  - 中: 東京だけが濃く他県がほぼ同じ色になる線形の配色 (`/ranking/total-population`)。推移の無い指標で「推移データなし」だけの大きな枠。
  - 中: 1440px の右レールで指標名が括弧の途中で切れ、同名に見える行を区別できない。
  - 低: 出典の下に単独の「総数」ラベル / 「46 神奈川県」で 47 位が無い理由 (同率) が出ない / 長い指標名がパンくずで 2 行になる。
  - 凡例の向きと負の値の棒は別カード `RANKING-LEGEND-DIRECTION-01` (🔴) で先に直す。
- **このリリースに相乗りする未反映の修正 (2026-09-25 夜、localhost で確認済み・未コミット)**:
  `RANKING-LEGEND-DIRECTION-01` (凡例の向き・0 基準の棒) / `CHART-YAXIS-LABEL-CLIP-01` (縦軸の省略表記と左余白) /
  `AREA-DATABOOK-LABEL-INTEGRITY-01` (県データブックの指標差し替え・年の表示) /
  `THEME-CHART-LOAD-LATENCY-01` (テーマのサーバーアクションを束ねる。localhost で 48 件直列 → 2 件・約 1.5 秒)。
  **デプロイ後に本番で測り直す**: `/themes/population-dynamics?pref=13000` を開いて最後までスクロールし、
  `performance.getEntriesByType('resource')` の POST が 2〜3 件、画面に入ったグラフが 3 秒以内に描かれること
  (修正前の本番実測は POST 48 件・重なり 0 件・約 19 秒)。
  **県データブックはデプロイ後に `sync-snapshots` を回して `app/areas/<code>/databook.json` を作り直す**。
  差し替えた 2 指標 (医師数・一般病院数の人口 10 万人当たり) は作り直すまで値が無く、カードごと表示されない。

### [GEO-UI-READABILITY-01] 地域分析 (Geo) のページで表・数値・用語が読者に読めない箇所を直す
タグ: [UI・UX] [種類:不具合] [実行:対話] [起票:2026-09-25] [領域:サイト]

- **証拠 (UI 全面点検 (2026-09-25・本番 44 URL × 7 幅 = 308 枚を撮影、250 枚を目視。`UI-FULL-SWEEP-01`))**:
  - 高: `/geo/population-land-price`・`/geo/population-flood-risk/15/overlap` の「47 都道府県の全データ表」が 390 / 640 / 768px で押しつぶされ、県名が 1 文字ずつ縦に並ぶ。
  - 高: `/areas/02000/landslide-exposure` の「数値の確かめ方」で人口が「1,203,780.9571人」と小数 4 桁。1440px で地図が「読み込んでいます…」のまま、768px で凡例の区域が地図に見えない。
  - 中: 読者向けの本文に内部用語が並ぶ (「coverage 47/47」「GEOAI 横断比較」「SHICODE」「A33-25」「46/46照合」、`/geo/datasets/A03` の「CHUBU-tky/A03-03_…topojson」というファイル名)。
  - 中: `/geo` の地図プレビューで駅名が重なり読めない。地域名ラベルが地図を覆う。390px で問い文が途中で省略される。
  - 中: 凡例が文章だけで色見本が無い (`/geo/population-land-price`)。`/geo/layers/population-mesh` の「灰色は 0 人」と「空白は 0 と断定できない」が矛盾する。
  - 中: `/geo/datasets/A03` は「三大都市圏」なのに初期表示が中部圏だけ。
- **確認済み (2026-09-24 の週次指摘)**: `/geo` の「地図プレビューを取得できませんでした」は今回再現しない。
- **完了条件**: 上の高・中の項目が直り、`/geo` 系の代表 5 ページを 390 / 768 / 1440px で撮影して確認する。
- **済 (2026-09-26・未コミット)**: 47 都道府県を並べる Geo の表 5 つを折り返さず横スクロールにした (`whitespace-nowrap`・`scrollRegion`)。
  localhost `/geo/population-land-price` 390px で県名セルが 1 行 (36px)、表 1,490px を幅 324px の枠でスクロール、ページのはみ出しなし。
- **残り**: ① 小数 4 桁の人口 (「1,203,780.9571人」) は、`GeoLandslideAudit` の保存則の検証表と地図ポップアップにある。検証表は
  丸める前の値で合計を示すための精度なので、読者向けの表示を丸めるかは `geo-analysis-standards.md` と合わせて決める。
  ② 内部用語 (coverage・SHICODE・ファイル名) の言い換え。③ 凡例の色見本・「灰色は 0 人」と「空白は 0 と断定できない」の矛盾。
  ④ `/geo/datasets/A03` の初期表示が中部圏だけ。⑤ `/geo` の地図プレビューの駅名の重なり。⑥ 1440px で地図が読み込み中のまま。

### [CHART-AXIS-READABILITY-01] グラフの軸・凡例・ラベルがスマホで読めない、欠ける、単位が無い
タグ: [UI・UX] [種類:不具合] [実行:対話] [起票:2026-09-25] [領域:サイト]

- **証拠 (UI 全面点検 (2026-09-25・本番 44 URL × 7 幅 = 308 枚を撮影、250 枚を目視。`UI-FULL-SWEEP-01`))**:
  - 高: ブログ記事 (`/blog/local-government-debt-burden`・`/blog/beer-peak-month-july-to-december`) の図表が 390px で軸・県名・数値が極小になり読めない。
  - 高: `/areas/13000/population-dynamics` の人口移動フロー (サンキー図) の県名・人数が 390px で約 5px。
  - 中: 県ページ・県×テーマ・`/japan/education-culture`・市区町村ランキングのヒストグラムで軸の文字が 5〜6px。縦軸に単位が無い。
  - 中: 右端の年ラベルが「2020年)」「2021年」のように切れる。横軸の目盛が不等間隔 (1975/1990/2005/2015)。
  - 中: ブログのビール記事で凡例が横軸ラベルに重なる。縦軸ラベルがタイトルの長文の繰り返し。散布図の点に県名が無い。タイル地図の淡い色に白文字。
  - 中: `/themes/real-income` の物価地域差指数の縦軸が 0 始まりで 100 前後の変化が平らに見える。
- **関連**: 検出と修正を回す仕組みは `UI-CHART-TEXT-LOOP-01`、県データブックのグラフは `AREA-DATABOOK-CHART-FIX-01`、縦軸の桁欠けは `CHART-YAXIS-LABEL-CLIP-01`。
- **完了条件**: 軸の文字が 390px で 10px 以上、全グラフの縦軸に単位があり、上記ページで切れ・重なりが無い。
- **済 (2026-09-25 夜・未コミット)**: 縦軸ラベルの左端の切れ。`leftMarginForTickLabels` (`packages/visualization/src/shared/layout.ts`) で
  積み上げ面・折れ線・複合グラフの左余白を目盛りの文字列から決めるようにした。localhost `/areas/13000` 390px で 6 グラフとも最左ラベルが左端から 2px 以上内側。
  縦軸の省略表記も「1400.0万」→「1,400万」に短くした (`compactAxisFormat`)。
- **残りの本丸 (設計が要る)**: D3 のグラフは幅 800 の viewBox で描いて縮小表示するため、390px では文字が約 4 割 (実測 5px) になる。
  文字を 10px 以上にするには、表示幅を ResizeObserver で測り viewBox 単位の文字サイズを逆算する必要がある。ただし文字を大きくすると
  横軸の年ラベル (今はデータ数で 5 年ごとに間引き) が重なるので、**間引きもラベル幅と表示幅から決め直す**必要がある。
  チャート部品の設計なので `chart-component-builder` の範囲で、積み上げ面・折れ線・複合・ヒストグラムを同じ仕組みで直す。
- **別経路のもの**: ブログの図は静的 SVG なので、直すには図の再生成と R2 反映 (承認が要る) が要る。サンキー図・物価指数の縦軸 (0 始まり) は部品ごとの修正。
- **追記 (2026-10-08)**: ブログの折れ線は生成器側でも 0 始まりに固定される。`packages/svg-builder/src/charts/line.ts` は `yMin` (既定 0) を受け取れるが、`.claude/scripts/blog/generate-article-charts.ts` の `genLineChartSvg` が `yMin` を渡さないため、平均年齢 (30〜60 歳) のような系列も 0 から描かれる (school-teacher-annual-income の writer が報告し、コードで確認)。data JSON に `yMin` を持たせて渡す形が最小の修正。

### [MUNI-PAGE-QUALITY-01] 市区町村のページが薄く、強みの選び方・一覧・ナビに誤りがある
タグ: [コンテンツ品質] [種類:不具合] [実行:対話] [起票:2026-09-25] [領域:データ]

- **証拠 (UI 全面点検 (2026-09-25・本番 44 URL × 7 幅 = 308 枚を撮影、250 枚を目視。`UI-FULL-SWEEP-01`))**:
  - 高: 強みのカードに値 0 の指標が「県内 3 位 (0 人)」と並ぶ (`/areas/29000/cities/29363`)。「86.65店」のように分母の無い小数が出る (`/areas/13000/cities/13101`)。
  - 中: 実数で比べるため人口規模で決まる指標ばかりが強みになる (札幌市)。値に年度が無い。人口などの基本データが無く、強み数件と一覧だけ。
  - 中: 東京都の一覧に 23 区が「特別区部」1 件しかなく、千代田区から他の区へ移れない。一覧が固定の高さで切れ、スクロールできると分からない。
  - 中: `/municipalities/ranking/junior-high-school-count` で八王子市・福山市・川口市だけリンクが無い。同名の自治体 (府中市など) を区別する県名が無い。
  - 低: 補足行が「東京都 東京都 千代田区」と県名を重ねる。ヘッダーの現在地が「都道府県」になる。
  - 撮影時に `/areas/29000/cities/29363` が 390 / 640px で一時的な HTTP 503 (再取得では 200。`CF-CPU-SURGE-01` の観測に追記)。
- **完了条件**: 強みの選定から値 0・分母なしを除き、人口当たりの指標で選ぶ。23 区を個別に並べる。代表 3 市区町村の撮影で上記が解消している。
- **済 (2026-10-21・本番反映済み。PR #1165 + #1166)**: 市区町村ページを市区町村データブック (`app/areas/<県>/cities/<市区町村>/databook.json`、174 指標の値・年・県内順位・全国順位) に置き換え、旧 `profile.json` の生成と読み込みを撤去した。特徴は率の指標・値 0 除外・2019 年以降 (`selectCityHighlights`)。見出しに人口・高齢化率など 6 指標、title は人口・前回比・都内/道内/府内/県内の順位 (`buildCityPageMeta`)。東京 23 区を公開対象にし (entity policy)、県内の一覧・索引・sitemap を同じ集合 1,741 件にそろえた。市区町村ランキングは全行リンク・同名の自治体に県名、ヘッダーの現在地は「市区町村」、パンくずの県名の重複を解消。localhost (公開 R2 + ローカル生成物のオーバーレイ) で坂出市・千代田区・札幌市・特別区部 (noindex) と市区町村ランキング・都道府県ランキング・ブログのデータ欄を確認した。計測の基準値は `data/improvement/gsc-improvement/improvement-log.md` の `MUNI-PAGE-SEO-01`。
- **本番確認 (2026-10-21)**: 坂出市 (1280px)・千代田区 (390px)・札幌市 (390px) を撮影・DOM 検査し、強みの値 0・分母なし・年度なし・23 区の欠落・ランキングのリンク欠落・同名自治体・県名の重複・ヘッダーの現在地がすべて解消していることを確かめた (横はみ出しなし)。
- **済 (2026-10-22・develop 反映、本番未デプロイ)**: 県内の市区町村一覧 (`CitiesNavCard`) の固定の高さのスクロールをやめ、先頭 40 件を並べて残りを「すべて見る（残り N 件）」(`<details>`) で開く形にした。リンクは閉じていても全件を初期 HTML に持ち、現在の市区町村が残り側にあるときは最初から開く。localhost で札幌市 (1280px・閉じた状態と展開)・羅臼町 (375px・最初から開く) を確認、横はみ出しなし。テスト `CitiesNavCard.test.tsx`。
- **済 (2026-10-22・オーナー承認)**: 配信をやめた市区町村の `profile.json` 1,399 件を R2 から削除した (`r2-maintenance.yml` run 39695673440、target `retired-city-profile-20261022`、key・サイズ・ETag 一致後に削除し残存 0)。札幌市の profile.json は 404、databook.json とページは 200。残りは無いのでカードは完了。

### [UNIT-NOTATION-FORMAT-01] 単位と数値の表記がページごとに不揃い
タグ: [UI・UX] [種類:改善] [実行:対話] [起票:2026-09-25] [領域:サイト]

- **証拠 (UI 全面点検 (2026-09-25・本番 44 URL × 7 幅 = 308 枚を撮影、250 枚を目視。`UI-FULL-SWEEP-01`))**: 「k g」「h a」「m2」「1 km2」「74.2指数」「41 %」と「27%」の混在 / 「8,552,651百万円」「656,171,677千円」のような桁の多い表記 /
  「5,761千円」と「2,995.9千円」で小数の桁数が不揃い / `/themes/real-income` で「545.8千円」と「450,485円」が単位違いで並ぶ / 値と単位が改行で割れる (「545.8 千/円」)。
- **次**: 表示用の単位整形を 1 か所 (`packages/data-configs/src/unit/` の正典) に寄せ、kg・ha・m²・km² と半角の空白規則をそろえる。大きな金額は億円・兆円に換算する。
- **完了条件**: 県ページ・カテゴリ・テーマ・survey の代表ページで表記がそろう。
- **済 (2026-09-26・未コミット)**: 表示用の `formatUnitForDisplay` (`packages/data-configs/src/unit/unit-display.ts`・NFKC + m²/m³) を作り、
  ランキング (表・上位3県・全国平均・地図凡例・関連ランキング)、県データブック、テーマの指標カード・比較・ヒストグラム、県の関連ランキングの
  12 部品に当てた。localhost `/ranking/artificial-forest-area` で UI 部品の「ｈａ」は 0 件。共有の読み込み関数では正規化しない
  (product-factory が全角「％」の単位で突き合わせるため)。
- **残り**: ① AI 解説と FAQ の本文 (R2 に保存済みの生成文) の全角単位は、生成処理 (`packages/ai-content`) で正規化してから生成し直す (R2 反映は承認後)。
  ② 残りの約 60 ファイルの単位表示 (`grep -rnE "\{[a-zA-Z.?]*\.unit\}" apps/web/src`)。③ 百万円・千円の大きな金額を億円・兆円に換算する
  (単位の換算は `unit-semantics.ts` の正典で決め、自前のスケール表を書かない)。④ 小数の桁の不揃い (5,761千円と 2,995.9千円)。

### [HUB-LIST-FINDABILITY-01] 一覧ページで目的のものを探しにくい (分類・検索・並び順・日付)
タグ: [UI・UX] [種類:改善] [実行:対話] [起票:2026-09-25] [領域:サイト]

- **証拠 (UI 全面点検 (2026-09-25・本番 44 URL × 7 幅 = 308 枚を撮影、250 枚を目視。`UI-FULL-SWEEP-01`))**: `/survey` は約 100 の調査が分類・検索・並び順の規則なしで並ぶ / `/themes` は 55 テーマが分類なしの同形カード /
  `/blog` は 390〜992px で新着記事が約 2 画面下まで出ない / `/tag/population` の記事カードに日付が無く並び順が分からない /
  `/municipalities` で自分の市町村を探す入口が最下部 / `/areas` は県名だけで数値が無い / カードの題名・説明が「…」で切れる
  (ホーム・カテゴリの新着ブログ・`/themes`・`/survey`。カードの型の統一は `UI-CARD-TYPOGRAPHY-UNIFY-01`)。
- **完了条件**: 各一覧に分類か絞り込みがあり、並び順の基準が画面に出ている。

### [SURVEY-PAGES-01] 統計調査のページで、調査と関係のない指標が並び、最新年が誤って見える
タグ: [コンテンツ品質] [種類:不具合] [実行:対話] [起票:2026-09-25] [領域:データ]

- **証拠 (UI 全面点検 (2026-09-25・本番 44 URL × 7 幅 = 308 枚を撮影、250 枚を目視。`UI-FULL-SWEEP-01`))**: 高: `/survey/census` (国勢調査) の代表ランキングと全 307 件の一覧に、道路実延長・粗出生率・消防ポンプ・警察費など
  他の調査の指標が並ぶ。中: 「最新 2024 年」と出るが国勢調査の最新回は 2020 年。中: 道路実延長 (1km² 当たり) の単位が「km」。
  中: 1024px の代表ランキング 4 列で 1 位の数値に地図が重なって見える (解像度が低いため要実機確認)。
- **次**: 調査との紐付けを出典ベースで見直す (`.claude/rules/survey-linkage-standards.md`・`/audit-survey-linkage`)。最新年は調査の実施年から出す。
- **完了条件**: `/survey/census` に国勢調査由来の指標だけが並び、最新年が 2020 年と表示される。

### [PRODUCTS-PAGE-CONTENT-01] 商品ページで中身が分からず、購入の判断ができない
タグ: [収益化] [種類:改善] [実行:対話] [起票:2026-09-25] [領域:商品]

- **証拠 (UI 全面点検 (2026-09-25・本番 44 URL × 7 幅 = 308 枚を撮影、250 枚を目視。`UI-FULL-SWEEP-01`))**: 高: `/products` の Kindle 書籍カードの多くが「販売中の旧版です。新版は審査中…」の定型文で、内容が分からない。
  中: `/products/data-p-01` の「含まれるもの」がファイル形式の列挙だけで、収録指標・年次・見本が無い。低: 表紙画像が無い。
  「14 点の編集可能データ」に「個別分析サービス」が混ざる。
- **注意**: note・商品販売レーンは「維持」。新作や新チャネルは足さず、既存商品の説明の是正だけを行う。
- **完了条件**: 各商品に固有の内容紹介と収録内容・見本があり、定型文だけのカードが 0 件。

### [GA4-FULL-MEASUREMENT-01] GA4 を全ページで使い切る (計測の是正 → 文脈・操作・成果 → API 登録 → 週次集計・BigQuery)
タグ: [インフラ・計測] [種類:改善] [実行:対話] [起票:2026-09-26] [領域:管理]

- **オーナー判断 (2026-09-26)**: API 登録は 1 承認で最大 10 件 / クエリだけの変更も page_view として数え続け、`pv_trigger` で区別する / BigQuery (daily・無料枠) を今回含める。
  設計の全文は計画 `~/.claude/plans/stats47-ga4-sparkling-blum.md` (セッション計画。恒久判断は下記 SSOT へ反映済みまたは反映予定)。
- **Phase 0 (オーナー)**: ①設定変更用 SA を作り GA4 プロパティの編集者にする (GCP ロールは付けない) → `gh secret set GOOGLE_ADMIN_SERVICE_ACCOUNT_KEY_JSON --env google-admin-production` → 手元の鍵を削除 ②GA4 →「BigQuery のリンク」で daily のみ有効 (ストリーミングは有料なので付けない) ③読み取り SA に BigQuery ジョブユーザー (プロジェクト) + データ閲覧者 (`analytics_463218070`) を付ける。登録も BigQuery も遡及しないので早いほど得。
- **Phase 1 (済・2026-09-26、未コミット)**: identity から AdSense を除外 / 対象外 blocker で止めない / 1 承認 最大 10 件 / key event 作成 action (`AUTHORED_KEY_EVENTS`) / 監査に key events・custom metrics・保持期間・Google signals・拡張計測・BigQuery link・audiences を追加し、週次 `measurement-cycle` の `ga4Settings` に要約。google-admin テスト 43 件 pass。
  **実測 (2026-09-26 audit-api)**: CD 16 件 (EVENT) / key events は `purchase` のみ / 保持 14 か月 / Google signals 有効 / audiences 2 / BigQuery link 0 / **拡張計測の履歴変更 page_view が ON** (アプリの手動 page_view と二重計測の疑い。Phase 2 で送信を実測して確定する)。
- **本番反映・登録 (2026-09-26)**: PR #1029 を main へマージ (Deploy run 36224274042 success)。拡張計測の履歴変更 page_view を Admin API で OFF にし、本番でサイト内遷移 1 回 = page_view 1 件 (参照元 = 移動元) を観測。Admin API でカスタムディメンション 18 件 (EVENT 17 + USER 1) と key event 4 件を作成し、`audit-api` で台帳突合 confirmed-registered 49・拡張計測 warnings なし。GA4 権限は 2026-09-26 に `ststs47-mac` / `stats47-windows` を編集者へ変更 (オーナーが APIs Explorer で実行)。計測の不連続は `data/releases/2026-09-26-ga4-measurement-v2.json`。**Phase 0〜4 完了。** Phase 6 の前提も 2026-09-26 に完了: GA4 → BigQuery 連携 (project stats47・米国・daily のみ・課金なし = sandbox で 60 日自動削除) を作成し、`ststs47-mac` / `stats47-windows` にプロジェクト単位で BigQuery ジョブユーザー + データ閲覧者を付与 (オーナー操作)。ローカル鍵で `SELECT 1` 成功、データセットは翌日の初回書き出しで `analytics_463218070` が作られる。**Phase 5 完了 (2026-09-26)**: 週次 GA4 snapshot に `content-group` / `key-events` / `interactions` / `read-progress` / `download-purpose` (+ meta) を追加し、5 本とも GA4 Data API で実行を確認。効果判定エンジンに `ga4-improvement` adapter (`[ga4-page:]` + `デプロイ済` + `[target: +N pageviews]`、2026-09-26 の計測不連続をまたぐ窓は confounded) を登録。テスト: adapter 5 件 (不連続ガードは mutation で落ちることを確認)・journey 6 件・engine 37 件。初回の実データは 2026-09-27 (日) の snapshot。**残り = Phase 6 の週次集計スクリプト (`analytics_463218070.events_*` が出来てから)。** 別件: `kakkom@stats47` がプロジェクトのオーナー権限と鍵を持つ (未使用なら鍵削除をオーナーが判断)。
- **Phase 2 実測 (2026-09-26、本番 stats47.jp)**: サイト内リンクで 1 回移動すると page_view が **2 回**送られる (1 回目 = アプリの手動送信で参照元が空、2 回目 = 拡張計測の履歴変更で参照元が正しい)。着地の 1 回目は 1 件。→ アプリ側は参照元を直前のサイト内 URL にし `pv_trigger` を付けた (未デプロイ)。**残り: オーナーが GA4 管理画面 → データストリーム → 拡張計測 →「ブラウザの履歴イベントに基づくページの変更」を OFF にする** (OFF にするまで二重計測が続く。OFF の日を計測の不連続点として release 記録に残す)。
- **Phase 2・3 の進捗 (2026-09-26、未コミット・未デプロイ)**: 済 = 参照元の引き継ぎ・`pv_trigger`・gtag 未ロード時の再試行・`history.csv` new_users=0 の是正・search-growth の GA4 欠損誤判定の是正 (回帰テストは修正前コードで落ちることを確認)・`content_group` とページ文脈・`ui_interaction` (ランキングの地図/表タブ・年度・基準・地域区分、テーマの指標/表示タブ)・`read_progress`・`search_result_click`・`contact_click`・`declared_purpose`・台帳と `AUTHORED_DIMENSIONS` の更新 (EVENT 17 件 + USER 1 件、`content_id`/`target_key`/`analysis_id`/`data_version`/`comparison_size` は登録しない)。検証 = `npm run type-check` exit 0、vitest 73 files / 552 tests、localhost で ui_interaction・read_progress・search_result_click を観測。**見送り**: Geo の pathname 書き換え (2026-09-05 に意図して入れた共有 URL 形式のため)、survey / affiliate 集計への Japan フィルタ追加 (実験の観測期間中で比較基準がずれるため)、NSM snapshot の旧定義の改名。
- **Phase 2 (当初計画)**: 計測の是正 — referrer の引き継ぎ、`pv_trigger`、Geo の pathname 書き換え、gtag 未ロード時の再試行、events.ts 外からの送信の集約、拡張計測の二重 page_view の実測と対処。取得側 — `history.csv` new_users=0、search-growth の `ga4:sessions` 欠測、`ga4_organic_quality` の organic 絞り込み、survey / affiliate の Japan フィルタ、NSM snapshot の旧定義。
- **Phase 3**: `content_group` と page 文脈 (`ranking_key`/`category_key`/`theme_slug`/`area_code`)、`ui_interaction` (`ui_action`/`ui_target`)、`read_progress`、`search_result_click`、`contact_click`、user property `declared_purpose`。台帳と `AUTHORED_DIMENSIONS` を同時に更新。Phase 2+3 は 1 回でデプロイする (要承認)。
- **Phase 4**: デプロイ直後に `google-admin-settings.yml` plan → apply (承認 2〜3 回)。対象: `card_variant`/`slot`/`experiment_variant`/`download_purpose`/`theme_slug`/`area_code`/`ui_action`/`ui_target`/`pv_trigger`/`progress`/`result_type`/`result_position`/`analysis_slug`/`interaction_type`/`geography`/`cta_id`/`target_type` + USER `declared_purpose` + key events 4 件。
- **Phase 5**: 週次 snapshot に content-group / key-events / interactions / read-progress / download-purpose、効果判定エンジンに GA4 adapter。
- **Phase 6**: `fetch-ga4-bigquery.mjs` で週次集計 (journeys / search-terms / unregistered-params / session-depth)。課金の有無を確認し、クエリに `maximumBytesBilled`。
- **旧カード統合**: `GA4-DIMENSION-PRIORITY-01` (home_featured 3 項目の登録) は Phase 4 に吸収した。
- **完了条件**: `npm run google-admin:audit-api` で Phase 4 の全件が confirmed-registered、key events 4 件、BigQuery link 1 件、拡張計測の二重 page_view 警告なし。次の日曜 snapshot に Phase 5・6 の新ファイルが出る。

### [AREA-DATABOOK-CHART-FIX-01] 県データブックの「推移」グラフの点数不足と、スマホで読めない文字・単位なしの軸を直す

タグ: [UI・UX] [種類:不具合] [実行:対話] [起票:2026-09-25] [領域:サイト]

- **背景 (2026-09-25 `/areas/13000` 実測)**: 「有効求人倍率の推移」は 2022年度の 1 点、「1人当たり県民所得の推移」は
  2020〜2021年度の 2 点だけで推移として機能していない (e-Stat をその場で読むグラフ。`template.ts` の
  `area-ov-job-opening` / `area-ov-prefectural-income`、原因は未確認)。390px では高さ 9px 未満のグラフ文字が 80 個あり、
  「高齢化率・年少人口割合の推移」「高齢者世帯の推移」の縦軸に単位が無い。縦軸目盛りの切れは `UI-CHART-TEXT-LOOP-01` の担当。
- **次**: ① 点数不足の原因 (statsDataId の年範囲・取得パラメータ・キャッシュ) を実測で特定し、年を揃えた系列に直すか、
  推移グラフをやめて数値カードにする。② 狭い画面での文字サイズの下限と軸単位の表示を、共通チャート部品側で直す
  (`chart-component-builder`)。③ 「推移」グラフの最低点数の検査は `SITE-DISPLAY-SEMANTICS-AUDIT-01` に含める。
  **② は `UI-CHART-TEXT-LOOP-01` の D3 部品の修正 (文字を描画範囲に収める共通処理。14 部品分の途中成果がブランチ `wip/ui-chart-text-loop-01` にある) と
  同じファイル群を触る。** 先に同カードの WIP ブランチを取り込み、その上で文字サイズの下限と軸単位を足す。
- **完了条件**: 県データブックの推移グラフがすべて 3 点以上、390px でグラフ文字が 10px 以上、縦軸に単位がある。
- **全面点検の指摘 (UI 全面点検 (2026-09-25・本番 44 URL × 7 幅 = 308 枚を撮影、250 枚を目視。`UI-FULL-SWEEP-01`))**: 有効求人倍率の推移が 2022 年度の 1 点だけで大きな枠を占める / 1 人当たり県民所得が 2 点だけ /
  軸の文字が 5〜6px / 右端の年ラベルが切れる / 縦軸に単位が無い。縦軸の先頭の桁が欠ける不具合は `CHART-YAXIS-LABEL-CLIP-01` (🔴) で先に直す。

### [AREA-PAGE-LAYOUT-01] 県ページの長さと節構成を整理し、内部用語と表記揺れを除く

タグ: [UI・UX] [種類:改善] [実行:対話] [起票:2026-09-25] [領域:サイト]

- **背景 (2026-09-25 `/areas/13000` 実測)**: 390px でページ高 13,174px。データブックの数値カードがスマホで 1 行 1 個に並ぶため。
  「地価」「旅行者」は数値 1 個、「産業」は 2 個で全幅の節を使い、「暮らし」(犯罪) と「安全・くらし」(交通事故) の分け方が
  分かりにくい。空間分析カードに内部用語「保存則 47/47」がそのまま出る。「%」と「％」の混在、「11％」と「11.2％」の小数桁の不揃い、
  見出し「東京都の市区町村40 件」の空白抜け。交通事故グラフの横軸は「年度」だが、元統計は暦年の可能性がある (未確認)。
- **次**: ① スマホでも数値カードを 2 列にする。② 数値の少ない節を統合し、「暮らし」と「安全・くらし」の区分を決め直す
  (`area-databook-designer`)。③ 「保存則」を読者向けの表現に直す。④ 単位記号・小数桁を共通の書式に揃える。
  ⑤ 交通事故の年の型を出典で確かめる。
- **完了条件**: 390px のページ高が現状比で大きく減り (目標値は ① の実装後に実測で決める)、1 指標だけの節が無く、
  内部用語と表記揺れが 0 件。
- **全面点検の指摘 (UI 全面点検 (2026-09-25・本番 44 URL × 7 幅 = 308 枚を撮影、250 枚を目視。`UI-FULL-SWEEP-01`))**: 640 / 768px で「他県と比較」ボタンが 2 行に折れる / 「47位」が「47/位」と折れる /
  県×テーマページ (`/areas/*/<theme>`) の「〇〇県の視点」帯が 390px で細かく折り返す、ページ内ナビの末尾が途中で切れる、プロフィールへのリンクが 2 回続く、
  見出しと 1 文だけの中身の無い節、カード名に節の名前が繰り返される、人口移動フローの県選択が空欄、5 枚目のカードが単独で残る。
  `/areas/02000/landslide-exposure` で「0 区域」が 2 位 (順位の向きが不明)、「単年データのため推移グラフはありません」のカードが 8 枚続く。

### [AFF-FURUSATO-SHOP-DIVERSITY-01] ふるさと納税の返礼品カードを「代表品目を複数」にし、品目と店の重複をなくして毎日・毎週検査する

タグ: [収益化] [種類:改善] [実行:対話] [起票:2026-09-25] [領域:アフィリエイト]

- **背景 (2026-09-25 実測 2 件)**:
  - `/areas/13000`: 「東京都の人気返礼品」の 4 件がすべて同じ店 (魚久) の商品だった。
  - `/ranking/natto-consumption-expenditure`: 「1位 福島県の人気返礼品」の 4 件のうち 3 件が桃で、残り 1 件も桃を含む
    「野菜とフルーツセット」だった。2〜4 枠目が同じ品目なので、読者には比べて選ぶ余地がない。
  - 原因 (コードで確認): 代表品目の表 `FURUSATO_SIGNATURE` (`apps/web/src/features/ads/constants/furusato-nozei.ts`) は
    1 県 1 品目 (福島 = 桃)。同期の `searchFurusatoItems` (`apps/web/src/features/ads/lib/rakuten-api.ts`) は
    「ふるさと納税 {県名} {代表品目}」でレビュー数順に 30 件を検索し、上位 4 件を保存する。品目と店の重複を除く処理は、
    同期にもカード側の `selectQualityItems` にも無い (除くのは同じ URL だけ)。
  - 同一案件の重複を避ける方針 (auto memory `affiliate-strategy`) に反する。
- **決定 (2026-09-25 オーナー)**: 代表品目を 1 県に複数登録し、1 品目 1 枠で並べる。

#### 実装

1. **代表品目の表を複数形にする**。`FURUSATO_SIGNATURE` を 1 県あたり 3〜4 品目の配列にする (置き場は今と同じファイル。
   別の SSOT を作らない)。各品目は「検索語」と「一致とみなす表記」を持つ (例: 桃 = `桃` / `もも` / `白桃`。
   福島の 4 件目「もも【川中島白桃】」のように、ひらがな表記で出品される商品があるため)。
   1 品目だけの県は今と同じ動きになるので、県ごとに順に増やしてよい。
2. **同期で 1 品目 1 枠を選ぶ**。品目ごとに検索し、先頭から「店が既出でない」1 件を取る。
   何も出ない品目の枠は、県名だけの検索の結果で埋める (店の重複は同じく除く)。代表品目が未登録の県 (東京・大阪など) は
   県名だけで検索し、1 店 1 件にする。
   保存する snapshot に「どの品目の枠か」(品目名 / 県名だけの検索で埋めた枠) を持たせ、監査がそれを読めるようにする。
3. **カード側でも 1 店 1 件を守る**。`selectQualityItems` の重複判定に店を加える (古い snapshot が残っていても並ばないように)。
   店の識別には `RakutenItem.shopName` がある。店コードが取れるかは実データで確かめ、取れるなら店コードを使う。
4. **同期にかかる時間**: 楽天への問い合わせは 1 回ごとに 1.2 秒空ける (`RAKUTEN_REQUEST_INTERVAL_MS`)。
   47 県 × 4 品目で約 190 回、約 4 分 (今は 1 県 1〜2 回)。毎朝 4 時の `sync-rakuten-catalog.yml` の中で収まることを
   最初の実行で確かめる。

#### 機械的チェック (PR の時点で止める)

- **表の契約テスト**: 各県の品目数が 1〜4、同じ県で検索語が重複しない、一致表記が空でない。
- **選び方の単体テスト**: 候補が同じ店・同じ品目ばかりでも、選ぶ関数が 1 店 1 件・1 品目 1 件を返す。
  品目が 0 件のとき県名だけの検索で埋める。
  テストは「なぜ要るか」を固定する (今回の福島・東京の並びを入力にして、直す前の実装なら落ちることを一度確かめる)。

#### 毎日の監査 (同期の直後)

- 既存の `apps/web/scripts/audit-rakuten-catalog.ts` (同期後に 47 県を読み直す、API を叩かない監査) に、県ごとの次の項目を足す。
  - `shopDuplicates`: 1 枚のカードで同じ店が 2 件以上 → **0 件でなければ監査を失敗にする** (選び方の実装が壊れている)
  - `keywordMismatch`: 品目の枠に入った商品の名前が、その品目の一致表記を含まない件数 (「野菜とフルーツセット」が桃の枠に入る型)
  - `emptyKeywords`: 検索して何も出なかった代表品目 (表の見直し候補)
  - `preorderCount`: 名前に「先行予約」「〜年出荷」を含む件数 (季節ずれの観測。当面は数えるだけで直さない)
- 失敗の通知は既存の `rakuten-alert` の経路を使う。新しいラベルは作らない。

#### 週次の組み込み

- 毎日の監査結果 (`audit.json`) は CI の artifact に 14 日しか残らない。週に 1 回、最新の結果を
  `data/affiliate/` に要約して記録する (県ごとの上の 4 項目。アフィリエイト運用の機械状態の置き場)。
  どの週次 workflow に載せるか (`affiliate-ga4-weekly.yml` に 1 step 足すか、同期 workflow の週 1 回分で書くか) は実装時に決め、
  新しい workflow は作らない。
- **起票の条件**: `emptyKeywords` か `keywordMismatch` が **2 週続けて** 同じ県・同じ品目で出たら、「代表品目の見直し」カードを
  backlog へ 1 枚起票する (1 週だけの揺れでは起票しない)。起票の仕組みは page-quality の UI 指摘キュー
  (`.claude/scripts/page-quality/ui-findings.ts`) と同じ形を流用し、別実装を作らない。
- 週次メトリクス Issue に「返礼品カードの重複 0 件 / 見直し候補 N 件」の 1 行を出す。

#### 境界

- **停止条件**: 表示件数を減らす変更は `AFF-SLOT-REDUCTION-01` の計測と混ぜない。どの広告を出すかの変更なので
  `AFF-INTENT-FALLBACK-STOP-01` と同じデプロイにしない (どちらが効いたか分離できなくなる)。計測の区切り日を記録する。
- **季節ずれは対象外**: 品目の並び順を季節で入れ替える案は、`preorderCount` の実測を見てから別カードで判断する。
- **意味の判定は機械に任せない**: 「その県らしい品目か」の選定は人が表に書く。監査は一致表記と件数だけを見る。

- **完了条件**:
  - 47 県の返礼品カードで同じ店・同じ品目の商品が 2 件以上並ばない (毎日の監査で `shopDuplicates` 0)。
  - 代表品目が 3 品目以上登録された県が 30 県以上ある (大都市など未登録の県は県名だけの検索で 1 店 1 件)。
  - 表の契約テストと選び方の単体テストが CI で動き、直す前の実装で落ちることを確認済み。
  - 週次の要約が `data/affiliate/` に 1 回以上記録され、週次メトリクス Issue に 1 行出ている。

### [UI-CHART-TEXT-LOOP-01] チャートの文字のはみ出し・重なりを座標で検出し、起票から修正・本番確認までのループに乗せる

タグ: [UI・UX] [種類:改善] [実行:対話] [起票:2026-09-25] [領域:サイト]

- **背景 (2026-09-25 実測)**: `/areas/13000` の積み上げ面グラフ (`StackedAreaChart`) で縦軸の目盛り「1,400.0万」などが
  左に 4〜12px 切れている (左の余白が `computeMarginsByRatio` による幅比の固定値で、長い目盛りが収まらない)。
  note 記事のビール月別折れ線 SVG (`b-kakei-beer-peak-month/data/beer-months-by-year-timeseries.svg`、`svg-builder` の
  `line.ts`) は、下の凡例 (プロット下端 +18px) と斜めの月ラベル (+14px から下へ) が同じ帯に重なり、縦軸タイトルに
  図のタイトル全文を入れて高さからはみ出し、単位「(円)」が 2 か所に出ている。スクショを agent に見せるだけでは
  縮小で 1 文字の欠けを読めず判断も揺れるため、**文字の外枠の座標で機械判定する**。
- **方針 (検出 → 起票 → 修正 → 本番確認)**:
  1. **検出 (機械)**: ①`chart_text_issues` — 週次ページ品質監査のブラウザ検査 (代表URL) で、ページに直接描く SVG の
     `<text>` の外接矩形が描画範囲から 2px 超出るもの (overflow: visible は除外) と、同じ SVG 内の文字どうしが
     小さい方の 25% 以上かつ 3px 四方以上重なるものを数える。チャートは遅延描画なので、スクロールで描かせてから測る
     (撮影側のスクロール処理を `ui-probe.ts` の共通関数にし、幅ごとの `responsive_layout_issues` にも含める)。
     ②`blog_svg_text_issues` — `<img>` の記事 SVG は DOM から見えないので、全記事の `/app/blog/<slug>/data/*.svg` を
     取得し、`svg-lint.mjs` に足す `findChartTextIssues(svg) → { overflows, overlaps }` (文字幅は既存の半角 0.55em /
     全角 1.0em 推定、回転と text-anchor を反映) で静的に検査する (`checkImages` が画像 URL を消す前に呼ぶ)。
  2. **起票**: 2 指標を `UI_METRIC_KEYS` と `page-quality-budgets.json` (warning・閾値 0) に足し、既存の
     `ui-findings.ts --sync` で `UI-FIX-<種類>` カードにする (新しい起票の仕組みは作らない)。
  3. **修正の振り分け**: カード本文に指摘の種類ごとの手順を出す (`chartFixGuide`)。
     - **agent が直す**: D3 チャートは共有部品の不具合で、1 部品を直せば全ページが直る。描画後に文字の外枠を測って
       `viewBox` を広げる共通処理 (`fitSvgViewBox`) を軸つきの D3 部品すべてに適用し、長いラベルの回帰テストを足す。
       記事 SVG で作り直しても直らないもの (`generator-fix`) は `svg-builder` を直す (`line.ts`: 凡例を目盛りの帯の下へ・
       入らないときだけ斜めにする・縦軸タイトルの長さ確認・単位の重複をやめる)。
     - **スクリプトで直る**: 生成器が既に正しい記事 SVG は data JSON から作り直すだけで直る (`regen-fixes`)。
       `.claude/scripts/blog/plan-svg-text-fix.ts @<batch>` が公開中と作り直し後の両方を検査して `regen-fixes` /
       `generator-fix` / `no-data` / `clean` に振り分け、`regenerate-blog-svgs.yml` の slug 指定コマンドを出す。
       R2 反映はオーナー承認なので、ループは `[実行:ユーザー]` カードを起票して `--mark-owner` で紐付ける。
  4. **本番確認**: 既存どおり次の週次で消えたら done、残れば pending に戻る。
- **途中成果**: リモートのブランチ `wip/ui-chart-text-loop-01` (commit `f8344bf3c`、35 ファイル。2026-09-25 時点の develop の上に
  stash を衝突なしで適用したもの。develop へは未取り込み)。**検証済み**: ①の検出を本番の代表URL 12 件 × 412/1440px で実行し、
  `/areas/13000` の縦軸切れを検出・他 11 ページは 0 件 / 検出とカード手順のテスト (壊すと落ちることも確認)。
  **未完・未検証**: D3 14 部品への `fitSvgViewBox` 適用
  (テスト・型チェック未実施)・`check-svg-text.ts` と `plan-svg-text-fix.ts` のテスト。
- **次 (実行順)**: ①`wip/ui-chart-text-loop-01` を develop へ追従させて (`git merge develop`) 型チェック ②生成器の通常テスト (`packages/svg-builder/src/charts/__tests__/text-layout.gate.test.ts`) を維持したまま旧WIPとの差分を整理
  ③公開済み記事 SVG の該当件数を実測し、公開前 gate (`quality-gate.mjs`) を error にするか件数固定の baseline にするか決める
  ④修正済みの `line.ts` でビール SVG を作り直し、公開中の画像との差分を確認する ⑤D3 の共通処理を型チェック・テストし、localhost の `/areas/13000` で
  `chart_text_issues` が 0 になることを確かめる ⑥残りのテスト ⑦週次監査を 1 回手動で流し、カードに手順が載ることを確かめる。
- **関係するカード**: `AREA-DATABOOK-CHART-FIX-01` ② (狭い画面の文字サイズ・軸単位) は同じ D3 部品を触るので、こちらの WIP ブランチを先に
  取り込ませる。`NAV-CLICK-COVERAGE-01` P3 と `SITE-DISPLAY-SEMANTICS-AUDIT-01` も週次監査の同じファイル群に指標を足すので並行実装しない。
- **停止条件・禁止**: R2 反映・ワークフローの dispatch・本番デプロイはオーナー承認。公開済み SVG の該当が多い場合、
  gate を error にして無関係なコミットを止めない (新規・再生成分だけ止める)。
- **完了条件**: 週次監査が 2 指標を計測して UI-FIX カードに振り分け手順が載り、`/areas/13000` の縦軸切れとビール SVG の
  重なりが本番で 0 件になっている。

### [UI-CARD-HEADER-SIMPLIFY-01] カードの見出しを「白いカードのまま・見出しの下に線を引かない」形にそろえ、検索窓はカードで包まない

タグ: [UI・UX] [種類:改善] [実行:対話] [検証:npm run design-system:check -w apps/web] [起票:2026-09-25] [領域:サイト]

- **背景 (2026-09-25・スクショ 2 枚 = 左レールのカテゴリ / ブログの右レール)**: 見出しの下の区切り線 (`border-b`) のすぐ下で
  一覧の各行にも線があり、見出し直下に線が 2 本近接して見える。本文の下余白が固定 (`pb-4`) なので一覧の最後の行の下に空白が残る。
  見出しは灰色の小さい文字 (`text-muted-foreground`) で、見出しとしての強さが弱いのに線と余白で面積を取っている。
  「記事検索」は入力欄 1 つのためにカードと見出しを持っている。
- **決定 (2026-09-25 オーナー)**: 3 案のモック (A 見出しをカードの外へ / B カードは残し見出しの線をなくす / C カードをなくす) から **B**。
  A はレールに 5〜6 ブロック並ぶと見出しが灰色の地に浮いて帰属が曖昧、C は地の上に一覧がむき出しになりレール契約も変わるため不採用。
  - 見出し: 濃い色の太字の小見出し (`text-foreground` + `font-semibold`、大きさは `text-sm` のまま)。**見出しの下に線を引かない**
  - 区切り線は一覧の行と行の間だけ (最初の行の上には引かない)
  - 本文の下余白を固定しない (一覧は行の余白だけで閉じ、一覧でない本文だけ小さな下余白を持つ)
  - 検索窓 (`RailSearchCard`) はカードと見出しをやめ、レールの先頭に入力欄とボタンだけを置く。読み上げ用ラベル (`ariaLabel`) は既にあり維持する
- **範囲 (2026-09-25 のコード検索)**: 見出しの作りは 3 系統。`RailCard` (左右レール・23 ファイル) と `SectionCard` (本文の見出し付きカード・
  10 ファイル) は `apps/web/src/components/surface/SurfaceCard.tsx` の `HEADER_CLASS` を共有。`ChartPanel` (本文のチャート枠・76 ファイル) は
  同じ見た目 (`border-b border-border px-4 py-3`) を `components/charts/ChartPanel.tsx` に**重複して**書いている → 同じ定数を使わせて 1 か所にする。
  `RailSearchCard` は 2 か所 (`features/blog/components/BlogNavigationCards.tsx` / `app/blog/[slug]/page.tsx`)。
  見出しの下線を前提にしているもの: `components/surface/__tests__/rail-card-contract.test.tsx` の「ヘッダーは border-b を持つ」と、
  `docs/01_技術設計/04_デザインシステム.md`「レール UI 契約」の見出し・本文余白の記述。
- **既存カードとの関係**: `UI-CARD-TYPOGRAPHY-UNIFY-01` の「契約」にある RailCard の見出し (灰色・中太・`border-b`) と本文余白 (`pb-4`) を
  **このカードが改訂する**。同カード C-1 の `no-manual-card-header` (手書きヘッダ禁止) は、新しい見出しの形を基準に書く。
  `NAV-CLICK-COVERAGE-01` P1 が同じレール部品に計測用の属性を足すので、同じコミットに混ぜない。
- **次 (実行順)**: ①`SurfaceCard.tsx` の見出しと本文余白を変える (RailCard と SectionCard が同時に変わる) ②`ChartPanel` の見出しを同じ定数へ
  ③`RailSearchCard` からカードと見出しを外す ④契約テストを「見出しの下に線が無い・行の間だけに線がある」形で固定し直し、デザインシステム文書を改訂
  ⑤localhost で代表ページ (`/` `/ranking/total-population` `/areas/13000` `/themes/population-dynamics` `/category/population` `/blog`
  `/blog/<記事>` `/survey/census`) をライト・ダーク・390px で撮り、変更前と並べて確認 ⑥チャート枠は見出しとチャートの間隔が変わるので、
  76 か所のうち代表的なチャートの種類ごとに目視する。
- **決定 (2026-09-25 オーナー)**: チャート枠の下部 (出典・ランキングの開閉。`ChartPanel.tsx` の `border-t border-border px-4 py-3`) の
  上線も**残さない**。見出しと同じく、線ではなく余白で区切る。
- **追加の不具合 (2026-09-25 実測)**: `ChartPanel.tsx` は `footer && (...)` でフッターの枠を描くが、渡されるフッター要素が空の中身しか
  描かなくても枠 (上線 + `px-4 py-3`) は出る。ランキングページでは地図と表の下に高さ 25px の空の帯が全 8 幅で出ていた
  (`RANKING-MAP-TABLE-CARD-01` の背景)。フッターは中身があるときだけ描く (空の判定をフッター側の部品に持たせるか、
  呼び出し側で中身が無ければ `footer` を渡さない)。
- **停止条件・禁止**: 契約テストを弱めない (線の有無を消すのではなく、新しい形を固定し直す)。本番デプロイは他の変更とまとめて 1 回・オーナー承認。
- **完了条件**: 3 部品が同じ見出しの定数を使い、見出しの下の線と一覧末尾の固定余白が無い / 検索窓がカードで包まれていない /
  代表ページの撮り比べで確認済み / `npm run design-system:check -w apps/web` と対象の vitest が緑。

### [BLOG-POPULAR-AUTO-01] ブログ一覧の「よく読まれている記事」を閲覧数から週次で自動選定し、表示数を定数 1 か所にする

タグ: [UI・UX] [種類:改善] [実行:対話] [起票:2026-09-25] [領域:サイト]

- **現状 (2026-09-25 コード確認)**: `apps/web/src/features/blog/config/popular-articles.ts` に slug 3 件を手で固定している
  (2026-08-28 の直近 28 日の**アフィリエイト表示回数**上位。変更は作成時の 1 回だけ)。見つからない slug は公開日の新しい記事で補う
  (`repositories/blog-snapshot-reader.ts` の `readBlogIndexPageFromR2`)。表示数は `popularRows.length >= 3` と `slice(0, 3)` の
  2 か所に直書き。表示先は `/blog` の右レールだけ。読まれ方が変わっても入れ替わらず、広告の出ない記事は候補に入らない。
- **決定 (2026-09-25 オーナー)**:
  1. **指標**: GA4 のボット除去済みページ別閲覧数 = 週次スナップショット `data/ga4/snapshots/<週>/pages-clean.csv`
     の `screenPageViews`。除去前の `pages.csv` は使わない (W38 で 1 記事がトップページ並みの 1,255 件=ボット混入の疑い)。
     GSC のクリック数は検索流入だけで SNS・サイト内の閲覧が入らないので使わない。
  2. **置き場所と更新**: 週次 CI が選定結果を **R2 の JSON** に書き出し、`/blog` は表示時に読む (集計から作るデータ = R2。
     git の TS に書くと反映にデプロイが要る)。R2 の書き手は CI だけ。
  3. **表示先と件数**: `/blog` だけ・3 件のまま。件数は名前付き定数 1 か所で変えられるようにする。記事ページへ広げるかは
     `NAV-CLICK-COVERAGE-01` の計測で効果を見てから別途決める。
- **次 (実行順)**:
  ①選定の純粋関数を作る: `/blog/<slug>` の行だけを対象に、直近 4 週分の `pages-clean.csv` を合算して閲覧数の多い順に並べ、
  公開中の記事だけ残して上位 N 件を返す (単週の揺れを抑えるため 4 週。`pages-clean.meta.json` で各週の集計期間を確かめ、
  期間が重なるなら合算方法を直す)。
  ②週次の GA4 取得 workflow (スナップショットを作っている job) の後段で①を実行し、R2 に書き出す。キー名と保持は
  `.claude/rules/r2-storage-design.md` に従う。
  ③`readBlogIndexPageFromR2` を、R2 の選定結果を読んで上位 N 件を返す形に変える。結果が無い・読めないときは今と同じく
  公開日の新しい記事で埋める。直書きの `3` 2 か所を定数 1 つにし、`popular-articles.ts` の固定リストは削除する。
  ④**確認項目**: `/blog` の `revalidate = 86400` がこの OpenNext 構成で実際に効くかを本番のレスポンスヘッダで確かめる
  (`.claude/rules/nextjs-ssg-preservation.md` のとおり、prerender 済みページは R2 を更新しても再デプロイまで変わらない)。
  効かないなら、選定結果の読み込みを表示時に行う形 (動的描画) にする。
  ⑤テスト: 選定関数 (閲覧数順・`/blog/` 以外と非公開の除外・件数)、R2 に結果が無いときの補充。
- **停止条件・禁止**: ローカルから R2 に書かない (CI だけ)。本番デプロイは他の変更とまとめて 1 回・オーナー承認。
- **完了条件**: 週次 CI が選定結果を R2 に書き出し、`/blog` の「よく読まれている記事」がそれに従って入れ替わることを本番で確認済み。
  表示数の定数を変えると件数が変わる。固定リストが無くなり、対象テストが緑。

### [RANKING-MAP-TABLE-CARD-01] ランキングの地図と表を 1 枚のカードにし (1280px 以上は横並び・それ未満はタブ)、年と計算方法の切り替えをカードの見出しに集約する

タグ: [UI・UX] [種類:不具合] [実行:対話] [検証:npm run design-system:check -w apps/web] [起票:2026-09-25] [領域:サイト]

- **owner**: ranking-ui-manager
- **追加の画面確認条件 (2026-10-08)**: 本番の日照ランキングを390pxで関連記事までスクロールした画面では、地図の凡例が固定ヘッダーの上に重なる。発生時期・原因は未判定。地図と表の改修時に地図の重なり順を確認し、スクロール後もヘッダーの表示と操作を覆わないことを受入条件に加える。
- **背景 (2026-09-25 localhost `/ranking/natto-consumption-expenditure` を 390/640/768/992/1024/1280/1440/1920px で撮影・DOM 実測)**:
  ① 1280px 以上で地図と表が別々のカードとして横に並び、高さが 608px 対 565px でずれる。② 本文の列幅は 1280・1440・1920px
  のどれでも同じ (コンテナ最大幅で頭打ち) で、表のカードは約 412px しかなく、右端の「偏差値」列が切れて横スクロールになる
  (1024px は縦に並ぶので切れない)。③ 地図と表のそれぞれに同じ「2024年」の年の選択があり、見出しの行がそれだけのために
  区切り線付きで使われている。④ 767px 以下では「計算方法を切替」(総数・人口当たり・面積当たり) が地図の**下**にあり、
  中身を切り替える操作が中身より後に来る。
- **経緯 (壊さないこと)**: スマホで地図を h1 の直後に出すのは意図的な設計 (旧構成では地図がヘッダーから約 1300px 下に埋もれていた)。
  `RankingKeyPageClient.tsx` は DOM を 1 つのまま `order` で並べ替え、`<lg` は h1 → 地図/表 → 操作 → スタット、`lg+` は
  h1 → 操作 → スタット → 地図|表。地図と表は Radix のタブを `forceMount` で使い、**非表示の側も HTML に常に含まれる** (検索エンジンから
  表の中身が見える)。この 2 点は維持する。
- **決定 (2026-09-25 オーナー)**: 地図と表を **1 枚のカード**にする。
  - 1280px 以上 (本文が広い): カードの中で地図と表を**横に並べる**。
  - 1279px 以下: 同じカードの中で、今のスマホと同じ**タブ**切り替え (1024〜1279px は右レールが出て本文が約 588px しかなく、横並びは両方窮屈)。
  - 年の選択と計算方法の切り替えを**カードの見出しに 1 つだけ**置く。スマホでも操作が中身の上に来て、地図をすぐ見せる意図も保てる。
  - フッター (出典・ランキングの開閉) はカードに 1 つ。中身が空なら描かない (`UI-CARD-HEADER-SIMPLIFY-01` の空フッター対応と同じ規則)。
- **対象ファイル**: `apps/web/src/features/ranking/components/RankingKeyPage/RankingVisualizationSection.tsx` (タブ `lg:hidden`・
  `TAB_CONTENT_CLASS` の `lg:data-[state=inactive]:block`・`xl:grid xl:grid-cols-2` の 2 列配置) /
  `RankingKeyPage/RankingKeyPageClient.tsx` (`order-*` の並べ替え・`headerActions`・`cardFooter`) /
  `RankingMapChart/RankingMapChartClient.tsx` と `RankingDataTable/index.tsx` (それぞれが `ChartPanel` を持つ → 外側の 1 枚へ) /
  `RankingHeader/RankingHeaderControls.tsx` (計算方法の切り替え)。
- **次 (実行順)**:
  1. 外側に `ChartPanel` を 1 つ置き、地図と表はその中の枠なしの領域にする (カード内カード禁止の規則に合わせる)。
  2. 1280px 以上の横並びで表が切れないよう、横並びの幅のときだけ表を詰めた表示にする (セルの左右余白・順位列の幅・数値の桁区切り)。
     詰めても 4 列が収まらなければ、地図と表の幅の比を変えて表を広くする。収まったことを 1280/1440/1920px で実測する。
  3. 地図の高さを表 (10 件表示) の高さに合わせ、横並びのときに短い側の下に余白が出ないようにする。
  4. 年の選択と計算方法の切り替えを見出しへ移し、`order` の並べ替えから計算方法を外す (カードの見出しに入るため)。
  5. `forceMount` と、タブの切り替え・地図の初期表示の既存テストを保つ。横並び・タブの切り替わり幅と、表が HTML に常に含まれることを
     テストで固定する。
- **最初に開くタブ (1279px 以下)**: 当面は地図 (今のスマホと同じ)。`NAV-CLICK-COVERAGE-01` でタブの切り替えを数週観測し、表の方が
  選ばれるなら見直す。
- **停止条件・禁止**: `forceMount` を外さない (表が HTML から消えると検索に影響する)。h1 を DOM の先頭から動かさない。
  本番デプロイは他の変更とまとめて 1 回・オーナー承認。
- **完了条件**: localhost の 390/768/1024/1280/1440/1920px で、地図と表が 1 枚のカードに入り、1280px 以上は横並びで表の 4 列が
  横スクロールなしで見え、1279px 以下はタブで切り替わる。年と計算方法の選択がページに 1 つずつ。カードの下に空の帯が無い。
  関係する vitest と `design-system:check` が緑。

### [RANKING-PAGE-STRUCTURE-01] ランキングページの補足文・出典・関連リストの置き方を整理し、重複と冗長を減らす

タグ: [UI・UX] [種類:改善] [実行:対話] [起票:2026-09-25] [領域:サイト]

- **owner**: ranking-ui-manager
- **回遊基盤の現在地**: [PR #1107](https://github.com/uruhayato373/stats47/pull/1107)・main `d181b730c` を2026-10-08に本番反映。`data/content/` の全44ルート種別・9,116ページID・928タグIDと共通選定・5種類のページ導線を採用済み。恒久契約は `docs/01_技術設計/03_情報設計.md`、公開画面・リンク先・クリック送信・検査の根拠は `data/releases/2026-10-08-content-navigation.json` を参照する。本カードの補足文・出典・地図/表などの残項目は引き続き未完了。
- **回遊の残工程・効果判定条件**: Japanの `data/ga4/snapshots/2026-W40/internal-transitions.meta.json` は2026-09-06〜10-03の28日集計。公開後の2026-10-11〜11-07の28日分が確定してから、記事→ランキング・ランキング→記事・記事→記事の遷移数と遷移元PVを同じ窓で比較し、nav_clickのsurface/ID別実受信を確認する。カード露出は未計測なのでクリック数だけでカードCTRや認知効果を断定しない。LCPは公開後の実測で確認する。公開先404・クリック二重送信・LCP悪化が観測されたら停止して修正する。アクセス増加は実測まで未判定。
- **背景 (2026-09-25 localhost `/ranking/natto-consumption-expenditure` の撮影・DOM 実測)**:
  ① **カードの外に浮いた文章**: 地図と表の下に、補足文 (「都道府県庁所在市の二人以上世帯の年間納豆消費支出額」)・「最終更新 2026-09-07」・
  注記 (「県庁所在市の…購入量ではない…」) が、枠の無い地の上に並ぶ。補足文と最終更新は `RankingVisualizationDetails.tsx`、
  注記は別の部品。スマホ (390px) では補足文 (上端から 842px) と注記 (1332px) の間に計算方法とスタットのカードが挟まり約 490px 離れる
  (PC では隣接)。「最終更新」はサイトの更新日で、データの年ではない (読み違いのもと)。
  ② **「データ出典」だけカードの外**: `RankingPageClientShell.tsx` の `DataSourceList` の節が、灰色の地に上線付きで置かれ、直前のカード
  (相関が高い指標) との間に大きな空白がある。
  ③ **関連するランキングの一覧が 3 つ**: 本文の「同カテゴリの関連ランキング」(`RelatedRankingsGrid.tsx`、9 件)、右レールのカテゴリ一覧
  (`RankingSidebar`、同じ「1位 県 値」の形・20 件 + もっと見る)、出典調査のカードの「同じ調査のランキング」(`SurveyTaxonomyCard.tsx`)。
  スマホではこれが縦に続き、ページ高さが 5,284px (PC 3,235px)。本文の一覧はスマホで 1 列・行間が広い。
  ④ **「このデータを使う」の枠** (`DataUsageCard.tsx`): ボタンが文章の横に並び、390px では文章が狭い列で 6 行に折り返す。
  ⑤ **見出しまわりの余白と情報量** (2026-09-25 追記・1440px 実測): ヘッダーの下端 (52px) から最初のカード (259px) まで 207px あり、
  あるのはパンくず・h1・「計算方法を切替」の見出しと切り替え・共有ボタンだけで、数字が 1 つも出ていない。
  ⑥ **右レールの関連記事と出典調査のカード** (2026-09-25 追記・オーナーと合意):
  - 関連記事 (`RelatedArticlesCard.tsx`) が 1 件だけで、文字だけの 1 行のため広告より目立たない。上限は 3 件だが、候補が
    「この指標を散布図で扱う相関記事」と「タグが一致する記事」の 2 種しかなく、上限の前に尽きている
    (納豆のタグと記事の対応は R2 で未確認)。
  - 「この統計の出典調査」(`SurveyCard.tsx` → `SurveyTaxonomyCard`) は、調査名とリンクが本文末尾の「データ出典」と重なり、
    「同じ調査のランキング」がレール先頭の関連ランキングと重なる (③ の 3 つ目)。ただし出典の部品 `DataSourceList.tsx` のコメントは
    「調査ハブへの回遊は右レールの `SurveyTaxonomyCard` が担う」としており、意図して置かれている。同じカードはカテゴリ・テーマ・ブログでも使う。
  - 「家計調査（品目別）」の同じ調査のランキングに「情報通信係数」が並ぶ。家計調査の指標として不自然で、紐付けの誤りの可能性がある (未確認)。
- **本番実測 (2026-10-08・関連記事見出しの上端)**: 1440×1000px は日照 1,253px・学力 1,778px。右レールはカテゴリ一覧 20 件の後に画像なしの関連記事が続く。390×844px は日照 4,108px・学力 5,424px。
- **ブログ実測 (390×844px)**: 学力記事の本文内ランキングカードは上端 2,019px、関連記事見出しは 9,251px。
- **GA4 (Japan・2026-09-06〜10-03・W40 snapshot)**: 参照元ベースで blog→ranking 869PV・ranking→blog 476PV・blog→blog 218PV。`blog_ranking_card` 222 件、`nav_click` 4,643 件中 `unlabeled` 1,828 件。位置別 CTR と効果不足の因果は未確定。
- **次の画面検討 (未採択・2026-10-08)**: ランキング・ブログ・テーマ・エリア・Geo のページ ID・タグ等のマスタ・ID 間の関係を `data/` で一元把握できる設計を先に具体化する。既存の関連付け SSOT と照合し、二重 SSOT を作らないことを検討する。その設計を踏まえ、関連記事を PC は右レール先頭・スマホは地図/順位表直後へ置く案を画面で比較し、採否を決める。
- **次 (実行順)**:
  1. 補足文と注記を 1 か所にまとめる (推奨: ページ見出しの説明として全幅で出す)。スマホでも離れないようにする。「最終更新」はデータの年
     (`yearName` 等) に置き換えるか削除する (データの年はスタットと地図の年表示に既にあるなら削除)。
  2. 「データ出典」を他の節と同じカード (`SurfaceSection` 等) に入れ、直前の空白と上線をやめる。出典の中身と部品
     (`DataSourceList`) は変えない (2026-09-25 の出典表示の統一の成果)。
  3. 関連リストの役割を分けて 1 つ減らす (推奨: 本文の「同カテゴリの関連ランキング」とレールのカテゴリ一覧はどちらか一方にする。
     「同じ調査のランキング」は 6 で出典調査のカードごと移す)。スマホで本文の一覧を 2 列にするか件数を絞る。
  4. `DataUsageCard` を 639px 以下でボタンを下に積む形にする。
  5. 見出しまわりを詰めて情報を足す: 計算方法の切り替えは `RANKING-MAP-TABLE-CARD-01` で地図と表のカードの見出しへ移るので、残る共有ボタンを
     h1 と同じ行の右端へ寄せる (切り替えが抜けると単独の行になるため)。h1 の下に要点を 1 行で出す (例「2024年｜1位 福島県 7,830円｜
     全国平均 4,897円」。値はスタットと同じ出どころから取り、二重計算しない)。1 の補足文と合わせ、見出しまわりで「何のランキングで結果は
     どうか」が分かるようにする。1440px で最初のカードまでの距離を実測し、現状 207px から減ったことを記録する。
  6. 右レールを整理する:
     - **関連記事を増やす**: 候補が 3 件に満たないときは、同じカテゴリ・同じ調査の記事で補う (補い方は
       `getRelatedArticleSummaries` の呼び出し側で決め、集約の共有ロジックは変えない)。0 件ならカードを出さない今の動きは残す。
     - **関連記事にサムネイルを付ける**: 既存の `blogThumbnailUrl` (`apps/web/src/lib/metadata/ogp-image.ts`、ブログ一覧で使用中) を使い、
       左に 16:9 の小さな画像 (幅 80px 程度)・右にタイトル 2 行の形にする。画像は遅延読み込み。新しい画像は作らない。
     - **出典調査のカードをランキングページの右レールから外す**: 調査ページへのリンクは本文末尾の「データ出典」が持つ。
       「同じ調査のランキング」は関連ランキングのカードへ統合するか、出典の節の下へ移す。カテゴリ・テーマ・ブログのカードはこのカードでは
       変えない (別に判断する)。`DataSourceList.tsx` の「調査ハブへの回遊は右レールが担う」のコメントも同じ差分で直す。
     - 「情報通信係数」が家計調査（品目別）に紐付いている理由を確かめ、誤りなら紐付けを直す (owner は survey-curator。
       直し方の正典は `.claude/rules/survey-linkage-standards.md`)。
  7. 390/768/1024/1440px で撮り直し、スマホのページ高さを実測して記録する (目標値は 1〜3 の実装後に決める)。
- **決めること (実装前・オーナー)**: 3 の関連リストで、本文とレールのどちらを残すか。判断材料に `NAV-CLICK-COVERAGE-01` の導線別クリックを使ってよい。
- **停止条件**: 関連リストや出典調査のカードを消す前に、クリックの計測値 (`rail_click` / `nav_click`、出典調査のカードは
  nav_surface `ranking_survey`) を確認し、使われている方を残す。保存済みの計測 state にはこのカードのクリック数が無い (2026-09-25 確認) ので
  GA4 から取り直す。サムネイルと関連記事の補充は、付ける前後で関連記事のクリック数を比べられるよう、区切り日を記録する。本番デプロイは
  他の変更とまとめて 1 回・オーナー承認。
- **完了条件**: 補足文・注記・出典がカードに入り、補足と注記が 1 か所にまとまっている / 関連リストが 2 つ以下 / `DataUsageCard` が
  スマホで縦に積まれる / 関連記事がサムネイル付きで、補う候補が 3 件以上あるページ (納豆で確認) では 3 件出る / ランキングページの右レールに出典調査のカードが無い /
  撮り直しでスマホのページ高さが現状 (5,284px) から減っている。

### [KINDLE-DATA-SOURCE-01] Kindle の章の出典をブログ本文の手書き節から切り離し、据え置き 61 本の本文も移行する

タグ: [収益化] [種類:改善] [実行:対話] [検証:npx tsx packages/ranking/src/scripts/audit-survey-taxonomy.ts --offline --check] [起票:2026-09-25] [領域:商品]

- **背景**: 2026-09-25 にブログの出典表示を `DataSourceList` に統一し、本文の手書き「データ出典」節を 531 本で移行した。
  ただし Kindle 書籍の章に使う 61 本 (`KINDLE_BOOKS` の blogSlug) は本文を変えていない。Kindle は本番 R2 の本文を取得して
  `editorial-corrections.ts` の校正指示を当て、置換元が本文に 1 回だけ無いと生成を止める設計で、移行すると校正指示を持つ 64 記事中
  23 記事で書籍を作れなくなる (実測)。さらに章末の出典は `fetch-content.ts` の `appendDataSourceSection` が本文の手書き節か
  `<data-source>` タグに頼っており、節が消えると章の出典が消える。Web は描画時の変換で表示をそろえているだけで、本文には旧節が残っている。
- **影響 23 記事**: aging-solo-living-crisis / commercial-land-price-trend / communication-cost-burden / crime-rate-regional-gap /
  earthquake-insurance-prefecture-gap / energy-infrastructure-gas-electricity / inbound-by-nationality-regional-preference /
  inbound-overnight-regional-gap / industrial-water-manufacturing-nexus / library-museum-cultural-capital / local-government-debt-burden /
  mackerel-expenditure-ranking / manufacturing-aichi-dominance / manufacturing-productivity / per-capita-income-gap /
  population-migration-tokyo-concentration / renewable-energy-regional-gap / small-business-dominance-map / sports-facility-regional-divide /
  sports-urban-paradox / unmarried-rate-40years-crisis / waste-management-recycling-gap / workplace-accident-regional-map
- **次 (実行順)**: ① `appendDataSourceSection` を、本文に節が無いとき `app/blog/all.json` の `sources` (DataSourceEntry) から章末の
  「データ出典」を作る形に変える (`fetchPublishedSlugSet` が既に all.json を読んでいる)。書籍の出典表記の書式は既存章と同じにし、
  単体テストで固定する。② 上の 23 記事の校正指示のうち置換元が旧出典節にあるものを、書籍側の出典生成へ移すか削除する
  (書籍の出典を直す指示は、出典行の生成規則か章単位の補足として残す)。③ 移行後の本文 (`migrate-data-source-sections.ts` の変換結果) に
  全 64 記事の校正指示が当たることを確認する。④ `migrate-data-source-sections.ts` の Kindle 除外を外し、`blog-data-source-migration.yml`
  (mode=migrate-bodies) で 61 本を移行する。⑤ 週次監査の実測で `survey-taxonomy-ratchet.json` の `maxLegacyDataSourceSectionArticles` を
  67 → 6 (図の無い読み物 6 本) へ下げる。
- **停止条件・禁止**: 校正指示を当てられない記事が 1 本でも残るうちは④を実行しない。販売中の版 (KDP) の再アップロードは人間工程で、
  このカードの範囲外。書籍の本文・出典の表記を変える版は再校閲を経てから出す。
- **完了条件**: 全 64 記事で校正指示が当たり書籍を生成でき、61 本の本文から手書き節が消え、ratchet の上限が 6 で検証コマンドが exit 0。

### [TOOL-MATERIAL-BUILDER-01] 資料ビルダー（指標×地域を出典付き Excel へ持ち出す無料ツール）の最小版を作る

タグ: [収益化] [種類:制作] [実行:対話] [起票:2026-09-24] [領域:商品]

- **owner**: Claude Code（実装） / strategy-advisor（有料化の採否は `ADMIN-STAT-PILOT-01` 側）
- **正典**: 境界と実装契約は `docs/01_技術設計/03_情報設計.md`「ページとツールの境界」、保存先は `docs/01_技術設計/02_データアーキテクチャ.md`「ツールと利用者データ」。利用者が選んだ指標 N 個×地域 M 個を、年次・単位・出典を揃えた一つの Excel にする。既存ページ（`/areas/[code]/[themeSlug]` 等）の一覧表示は複製しない。
- **根拠（2026-09-24 時点）**: ランキング CSV のダウンロードは 28 日で 193 件・120 ページ（`ADMIN-STAT-PILOT-01` の GA4 実測）。データを持ち出す利用はあるが、複数指標をまとめて持ち出す需要・支払意思は未検証。
- **開始条件**: `ADMIN-STAT-PILOT-01` の①で対象資料 1 件の指標・地域粒度・年次が具体化されたら着手し、その資料を初期プリセットにする。聞き取り前に汎用の指標選択 UI を作り込まない。
- **次（実行順）**: ①都道府県粒度だけで、指標と地域の上限を入力検証で固定した R2 オンザフライ生成の API を `api/ranking/[rankingKey]/download` と同じ構成で作る ②`/tools/<slug>` の route を url-policy・middleware・sitemap とその test に登録し、結果を noindex にする ③入口のページから条件入力済みで開く導線を 1 か所だけ置く ④利用・出力の GA4 イベントを analytics-event-standards の台帳に登録してから配線する。
- **禁止**: ログイン・保存・決済・会員を作らない（データアーキテクチャの改訂と収益化戦略 §5 のゲートが先）。都道府県と市区町村を一つの出力に混ぜない。年次・定義を揃えられない値を揃えたことにしない。
- **DB は不要（2026-09-24 確認）**: 指標の選択はキー参照（`app/stats/<key>/values.json` を N 個読む）で、検索ではない。都道府県の実測は有効求人倍率 6KB・総人口（全年）294KB で、20 指標でも数 MB に収まる。
- **市区町村へ広げるとき**: 総人口の `cities.json`（全年）は 2.7MB あり、大きな指標を 10 個選ぶと数十 MB になる。Workers のメモリ・CPU 上限は未計測。対策は DB ではなく、最新年だけを切り出した派生 snapshot を R2 に作るか、選べる指標数の上限を下げること。拡張前に 1 リクエストのメモリと実行時間を計測する。
- **停止条件**: `ADMIN-STAT-PILOT-01` が Stop になった、または対象資料の指標が R2 の都道府県データで揃わない場合は着手しない。
- **完了条件**: localhost でプリセットの Excel が生成され、全セルに指標名・年次・単位・出典が付き、利用者の Excel 環境で開いて編集できる。route の test と `npm run type-check` が通る。

### [AREA-SPECIALTY-IMAGES-01] 都道府県ページの特産品画像が未生成で頭文字タイルのまま

タグ: [コンテンツ品質] [種類:制作] [実行:対話] [検証:週次 page-quality の degraded_images が prefecture-detail で 0] [起票:2026-09-23] [領域:サイト]

- **owner**: area-curator (対象の確定) / image-prompt-curator (画像)
- **実測 (2026-09-23)**: 600 URL の試運転で 12 県・21 枚の `app/areas/<code>/specialty/*.webp` が R2 で 404 (例: 07000 nameko / 10000 brix-nine・aka-imo / 12000 tomisato-suika・shiro-takenoko / 22000 midori-mai・kajiki / 24000 ise-hijiki・ao-sanori)。画面は `SpecialtyImage` が頭文字タイルに切り替えるので壊れては見えないが、写真が出ていない。全件の件数は次回の週次監査の `degraded_images` で確定する。
- **次**: 週次結果から欠落の全リストを出し、`editorial/<code>.ts` の特産品と照合して画像を用意するか、画像を持たない表示に統一する。
- **完了条件**: 週次監査の `degraded_images` が 0、または画像を出さない設計に決めて代替表示を正式化している。

### [METRIC-YEARFORMAT-KAKEI-01] 家計調査由来 metric の yearFormat (暦年/年度) と surveyId を揃える

タグ: [コンテンツ品質] [種類:不具合] [実行:対話] [検証:npx tsx .claude/scripts/blog/build-metric-definition-sheet.ts --slug real-disposable-income-reversal] [起票:2026-09-19] [期日:2026-10-17] [領域:データ]

- **2026-10-21 分離**: 生成器 `gen-ssds-configs.mjs` が SSDS の全指標に `yearFormat: "fiscal"` を固定で書いていたのが根本原因。生成器の修正と食い違いの検査 (再発防止) は `SSDS-YEARFORMAT-SOURCE-01`、直した 410 指標の R2・本文への反映は `YEARFORMAT-REFLECT-01` で扱う。このカードに残るのは、期間から決まらない 87 件と農業経営統計調査の 5 件の判定。
- **2026-10-21 経過**: 社会・人口統計体系の家計 (0000010112 / 0000010212) 由来で yearFormat が fiscal だった 73 指標を、e-Stat の「統計項目の定義 L 家計」(https://www.e-stat.go.jp/koumoku/koumoku_teigi/L)・「C 経済基盤」(同 /C)・「指標計算式 L」(https://www.e-stat.go.jp/koumoku/sihyo_keisansiki/L) で 1 件ずつ基礎項目の「時点又は期間」へたどった (2026-10-21 取得)。家計調査 (暦年平均) 25 件 (計算型 2 件を含む)、全国家計構造調査 (10月末日・年間収入は調査前年11月〜調査年10月) 9 件、全国消費実態調査 (11月30日・10月31日) 12 件、消費者物価指数と地域差指数 (暦年平均) 19 件、都道府県地価調査 (7月1日) 3 件の計 68 件は、どれも年度 (4月〜翌3月) ではないので calendar にした (seoTitle に「年度」を含むものは無かった)。validate:config・metrics:check・preflight:pr 通過、web の vitest 全件は環境由来の 1 件以外通過。定義シート (real-disposable-income-reversal) で家計の 3 指標と地域差指数が「暦年」と出ることを確認した。サイトの yearName (「2024年度」→「2024年」) は次の data-refresh で R2 に入る (R2 は未反映)。**残り**: ① 農業経営統計調査の 5 指標 (農家総所得・農業所得割合・農外所得割合・農家世帯の家計費・農家世帯の平均消費性向) は期間が「年計」で暦年か年度か定義から決まらないので fiscal のまま。② (済) per-capita-prefectural-income-h27 に description・note を足した。e-Stat の定義 (C122101、年度計) と、内閣府 県民経済計算 2021 年度の総括表で全県計 417,900,154 百万円 ÷ 125,502,290 人 = 3,330 千円が公表の 1 人当たり県民所得と一致することで、分母が総人口だと確かめた。③ (一部済) 家計以外の範囲: 社会・人口統計体系の全分野 (A〜M) の「統計項目の定義」と「指標計算式」を取り込み、yearFormat が fiscal の 960 指標を基礎項目の「時点又は期間」へたどった。暦年計・暦年平均・暦年・12月末/31日・10月1日、または社会生活基本調査 (年の名で呼ぶ調査) のどれかだけから成る 221 件を calendar にした (国勢調査・人口推計 71、社会福祉施設等調査 39、医療施設調査 30、犯罪統計 28、病院報告 20、社会教育調査 20、火災年報 15 など)。年度計・年度間・3月31日など年度の項目を含む 450 件は fiscal のままで正しい。期間が 5月1日 (学校基本調査は「令和N年度」と呼ぶ)・調査日・年計・4月1日などで決まらない 289 件は触っていない (次に残る範囲)。 **続き (同日)**: 残り 289 件のうち、期間 (調査日・6月・2月1日・選挙期日など) からは決まらない項目を、調査の呼び方で判定した。e-Stat の統計表一覧 API (getStatsList) の表題で、賃金構造基本統計調査・経済センサス (基礎・活動)・経済構造実態調査・事業所・企業統計調査・国民生活基礎調査・農林業センサス・漁業センサスは「平成21年◯◯」と年で呼ばれていることを確かめ、これらと選挙 (選挙期日) だけから成る 121 件を calendar にした (製造業 2 件の note の「2020年度以降」も直した)。学校基本調査・学校保健統計調査・建設工事施工統計調査は表題が「年度」なので、これらの 81 件は fiscal のままで正しい。**残り 87 件**: e-Stat に表題が無く呼び方を確かめられない調査 (地方公共団体定員管理調査・市町村税課税状況等の調・固定資産の価格等の概要調書・公共施設状況調・消防年報・耕地及び作付面積統計・住民基本台帳人口要覧など) と農業経営統計調査、定義ページに項目が無い 17 件 (行政投資など)。fiscal のまま触っていない。製造業 2 件の note の「2020年度以降」を「2020年以降」に直した。宿泊旅行統計調査 (暦年計) の 4 件は calendar に入った。住宅・土地統計調査の項目で fiscal だったのは、年度計の建築着工統計と組み合わせた new-housing-construction-ratio の 1 件だけで、年度のまま。
- **owner**: survey-curator (surveyId) / data-ingester (yearFormat)
- **実測 (2026-09-19)**: 同じ家計調査 (SSDS 経由) 由来なのに `disposable-income-worker-households` / `disposable-income-after-rent` / `real-disposable-income` は `yearFormat: 'fiscal'`、`black-tea-consumption-expenditure` / `private-rent-consumption-expenditure` / `engel-coefficient` は `'calendar'`。サイトの yearName が同じ調査で「2024年度」と「2024年」に分かれ、ブログ (real-disposable-income-reversal 等) が「2024年度」を書く原因になった。家計調査の年次結果は暦年平均 (統計局「2024年（令和6年）平均」)。上記 4 key と `per-capita-prefectural-income-h27` は `surveyId` 未設定で指標定義シートが「(surveyId 未設定)」を返す。 `per-capita-prefectural-income-h27` は description と note も無く、定義シートの対象欄が「config に対象の記述なし」になる (2026-10-07、engel-coefficient-vs-prefectural-income の writer が報告。県民所得の構成・分母・名目か実質かが読者向けの定義に出ない)。
- **追記 (2026-10-07)**: real-disposable-income-reversal の critic が、`consumer-price-difference-index-overall` (消費者物価地域差指数) と家計の 3 指標の yearFormat が fiscal のままで、記事の年の書き方が揃わないことを再度報告した。
- **次**: ①家計調査由来 metric を列挙し (`grep -l 家計調査 data/metrics/*.ts`)、yearFormat を出典で確定して揃える (SSDS の表ラベルは「年度」でも家計調査項目は暦年)。②surveyId を `kakei-chousa` 等へ紐付け `/audit-survey-linkage` を通す。③ranking-prominence / seoTitle の再生成が要るか確認。
- **範囲の拡張 (2026-09-19 追記)**: S1 12 冊の図 120 枚を `.local/kindle-audit/fig-years.ts` (図の年表記 × source.json の rankingKey × config yearFormat) で実測すると、国勢調査 (未婚率・単独世帯 2020)、社会生活基本調査 (行動者率 2021)、住宅・土地統計、宿泊旅行統計 (2024) まで一律 `fiscal` だった。家計調査に限らず「調査の集計期間が暦年・時点のもの」を一次資料で確定して直す。書籍側は `figure-corrections.ts` で本文に合わせて図の年表記を当てているが、config が直ればその校訂は不要になる。
- **停止条件**: yearFormat を一括置換しない (SSDS には年度が正しい項目もある)。出典で確認できない key は `未宣言` のまま残し、指標定義シートに出す。
- **完了条件**: 家計調査由来 metric の yearFormat が出典と一致し、S1-01 の 9 slug で定義シートの「期間の型」が本文と一致する。
- **画面への影響 (2026-09-25 追記)**: 県データブックの数値カードに年を出したため (`AREA-DATABOOK-LABEL-INTEGRITY-01`)、
  「消費」節の家計調査 5 指標が「2024年度」と表示されるようになった。yearFormat を直すとここも暦年表記に揃う。

### [CI-SPEED-STATIC-GATES-HEAVY-STEPS-01] Static Gates の重い step (Commit-back Contract 115 秒 / SEO Meta Factual 46 秒) を軽くするか scheduled へ寄せる

タグ: [インフラ・計測] [種類:改善] [実行:対話] [検証:node .claude/scripts/lib/check-runtime-budget.cjs] [起票:2026-09-18] [期日:2026-11-30] [領域:管理]

- **owner**: devops-runner
- **実測 (run 35157109396)**: Workflow Commit-back Contract Gate 115 秒 (npm ci より重い)、SEO Meta Factual Gate
  46 秒 (R2 を約 2,000 回読む = 「静的」ではない)、Image Generation Pipeline Contract 28 秒、
  Theme Portfolio State 23 秒。
- **次**: `test:workflow-commit-back` の 115 秒の内訳を `node --test --test-reporter` で取り、
  重い test を `--test-concurrency` で並列化するか、workflow 全走査を差分対象に絞る。SEO Meta Factual は
  `--only <staged keys>` を PR、`--fail-on-new` 全数を weekly に分ける (pre-commit 側は既にこの形)。
  `check-runtime-budget.cjs` の予算 (`.claude/config/check-runtime-budgets.json`) にこれらを登録し、
  再肥大化を機械で止める。
- **完了条件**: 対象 step の合計が 100 秒以下、budget に登録済み。
- **実施 (2026-09-18、部分)**: 115 秒の内訳は `ranking-scoped-workflow.test.mjs` 1 ファイル 76 秒 (69 test が sync-snapshots /
  generate-ogp-images の bash step をシム付きで実行、各 3〜6 秒)。依存は workflow YAML とテスト自身だけなので
  `test:scoped-workflow-contracts` へ分離し、`plan-pr-quality.mjs` の新 flag `workflow_contracts` (workflow YAML か
  *-scoped-workflow テストの変更時のみ true) で contract-tests job の step を差分連動にした。全数は週次
  `quality-suite-weekly.yml` の tests job に追加。`test:workflow-commit-back` は残り 2 ファイル (数秒)。
  **SEO Meta Factual (46 秒) は未着手**: PR で `--only <変更 key>` にするには shallow clone の catalog-gates job で
  base SHA を fetch して diff を取る仕組みが要り、pre-commit 側の `--only` と同型の実装を別途足す必要がある。
  `check-runtime-budgets.json` への登録も未 (network 検査を静的 budget に入れると毎 PR 46 秒増える)。

### [CI-SPEED-PRECOMMIT-TRIM-01] pre-commit を「秒単位のもの」だけに削り、metric config 時の `npx tsx` 直列 6 本と image pipeline 検査を preflight:pr / CI へ寄せる

タグ: [インフラ・計測] [種類:改善] [実行:対話] [検証:node --test .claude/scripts/lib/__tests__/preflight-commit.test.mjs .claude/scripts/lib/__tests__/pre-commit-guard-paths.test.cjs] [起票:2026-09-18] [期日:2026-11-30] [領域:管理]

- **owner**: devops-runner
- **実測 (2026-09-17)**: `apps/web/scripts/pre-commit-checks.sh` は 718 行・27 セクション。常時実行分は数秒だが、
  パス連動が重い: metric config が staged だと `validate-metric-years` / `validate-metric-config` /
  `audit-seo-meta-facts --only` (R2 ネットワーク) / `validate-polarity` / `generate-runtime-metric-summaries --check` /
  `generate-ranking-prominence --check` の `npx tsx` 6 本が**直列**に走り、それぞれ 2,000 件超の registry を
  読む (Windows PC で 12 分の記録: memory `project_two_machine_local_footprint_2026-09`)。
  `.github/workflows/*.yml` か `package.json` が staged だと image pipeline の vitest + 型検査 (約 15 秒) と
  `docs:check` が発火する。これらは develop-quality-gate / Static Gates でも走るので最大 3 重実行。
- **次**: pre-commit に残すのは commit-msg / 一時ファイル掃除 / secret 走査 / file-url・import.meta guard /
  `preflight-commit.mjs --commit-static` (7 並列 1 秒) だけにする。metric config 系 6 本は
  `preflight:pr` に集約し (gate 一覧は 2026-09-24 に `quality-gates.json` 由来へ変更済み)、`npx tsx` の起動を 1 プロセスに
  まとめる runner を検討する。`package.json` を image pipeline / docs の trigger から外す
  (依存追加のたびに両方が走る理由が無い)。
- **停止条件**: 外した検査が CI 側 (develop-gate または Static Gates) に無いものは外さない
  (`CI-DEVELOP-GATE-COVERAGE-01` の症状を再発させない)。
- **完了条件**: metric config 1 件 + workflow 1 件を staged した commit の pre-commit が Mac で 10 秒以内。
- **実施 (2026-09-18)**: pre-commit から §6.45〜6.6b (単位鏡 / years / config / SEO meta `--only` / polarity / topics /
  theme catalog / runtime summaries / prominence / area databook の `npx tsx` 直列、193 行) を外し、代わりに
  develop-quality-gate.yml へ `catalog-gates` job (`npm run preflight:pr`、CI では main 先行チェックを skip) を追加した。
  同じ検査は push 前 `preflight:pr` (18 gate・18〜21 秒) / develop 着地 / main PR Catalog Gates の 3 か所で走る。
  pre-commit は 718→541 行。`package.json` を image pipeline / docs の trigger から外す案は、workflow policy 監査が
  script 名の存在を見るため見送り。rule 4 本 (unit-semantics / theme-catalog / area-databook / blog-svg-chart) の
  「pre-commit + CI」表記を追従。実測は次の commit で確認する。

### [MEDIA-AFFILIATE-RELEASE-01] 媒体別画像と記事別アフィリエイト監査を公開まで完了する

タグ: [コンテンツ品質] [種類:改善] [実行:対話] [検証:npx tsx .claude/scripts/ads/audit-affiliate-relevance.ts --check] [起票:2026-09-17] [領域:アフィリエイト]

- **owner**: chart-author（ブログ・note画像）/ affiliate-manager（関連性判断）/ devops-runner（検証・公開段取り）
- **次（実行順）**: ①develop→main反映後、`regenerate-blog-svgs` workflowをdry-runし、全ブログのmobile画像生成結果とギャラリーを目視する。②承認後、対象を限定してR2へexact publishし、PC/mobileの切替を代表記事で確認する。③`data/affiliate/relevance-latest.json`の270候補を意味レビューし、必要な記事だけ理由付きで`BLOG_AFFILIATE_POLICY`へ追加する。④既存note画像をmobile方針で再生成・差替えし、note本文の視認性を監査する。⑤web全テストを再実行し、survey timeout 1件・product OGP 2件・right-rail contract 1件が再現する場合は今回の変更と分離して起票する。
- **禁止**: 候補270件を機械判定だけで一括変更しない。テスト契約を弱めない。ユーザー承認なしにdeploy・R2 write・note公開を実行しない。
- **完了条件**: ブログのPC/mobile画像が全対象で生成・目視・公開確認済み、note既存画像の差替えと監査が完了、関連性候補が全件レビュー済み、今回変更に属するwebテストがgreenである。

### [THEME-SELECTION-BACKFILL-01] ThemeCatalogの選定根拠(selection)未記入540件を夜間の無人バッチで白書・公式統計から裏付ける

タグ: [エージェント・SSOT] [種類:改善] [実行:windows] [検証:npm run validate:catalog --workspace=@stats47/data-configs] [起票:2026-09-16] [領域:データ]

- **owner**: theme-designer (catalog TS の書き手) / theme-researcher (調査) / validator は data-configs scripts
- **背景 (2026-09-16 実測)**: `validate:catalog` の `no-adoption-criteria` warn は 539 件 (warn 合計 552 のうち。
  chart-temporal-fit 13 を除く)。aging-society 9 指標を theme-researcher(sonnet) → 呼び元検証 → 書き込みで処理し
  1 テーマ 19 分 (agent 9 分・41 tool call・28.5 万 token / 検証+書き込み+gate 10 分)。受け入れ検証で agent が
  社会生活統計指標コードを 7 件中 2 件誤記 (#A06603/04 ≠ config の #A06601/02) したのを捕捉。
  NotebookLM CLI はこの PC では SSL 証明書エラーで不可、白書は WebFetch で足りた。
  **構造の発見**: 55 テーマ中 31 テーマ + 既存テーマ拡張 67 章は `expanded.ts` の tuple で定義され、
  per-metric の selection 欄が無い → `selection-evidence.ts` を新設して置き場にした (規約 §4「置き場」)。
- **完了 (2026-09-16 同日)**: 手順 1〜3 を実装・パイロット済 (詳細は skill `/backfill-theme-selection`)
  1. validator: `[selection-code-mismatch]` / `[selection-boilerplate]` / `[selection-source-required]` /
     `[selection-criteria-all]` を error で追加 (`validateSelectionEvidence`)。population-dynamics の 3 件は
     proposedBy が内部監査名のまま adoptionCriteria が付いていたので外して対象に戻した (539 → 542)。
     URL 到達性と引用実在は network が要るので validator でなく backfill gate が担う。ratchet は既存の
     `check-quality-warning-ratchet.cjs` (baseline 548 → 540) を `develop-quality-gate.yml` にも配線
  2. skill `/backfill-theme-selection` + `.claude/scripts/themes/selection-backfill{,-core}.mjs`
     (targets / prompt / apply / run)。モデルはファイルを触らず JSON を返すだけ (tools = WebFetch/WebSearch、
     cwd は repo 外)。gate: 引用の逐語照合 (HTML 本文 / PDF は pdftotext) ・https 到達・定型文・コード一致
     (config cdCat01 + pull 済み e-Stat カタログ)・基準語彙。role / rejectedCandidates は書かない
  3. 夜間ドライバ `.claude/scripts/themes/run-selection-backfill.sh`: 専用 worktree・npm ci・catalog pull・
     preflight・並列 2・枠エラー 3 連続 (30 分待ち×3) と gate 不合格率 > 30% で停止・夜 1 コミット・
     report を `manage-theme-portfolio/reference/audits/<日付>-selection-backfill.md`
  - パイロット: tsunami-exposure 2 指標 → 通過 2/2、15 turns、128K トークン、$0.69。PDF 出典 2 件とも
    pdftotext 経由で引用 found。残 540 件
- **本番 run 1 晩目 (2026-09-16 21:24〜23:11、実測)**: 53 テーマ 481 指標を処理し 通過 206 / gate 不合格 17
  (引用not-found 8・引用短すぎ 7・URL 403 が 2) / 資料なし skip 19 (ふるさと納税系 7 件が PDF 解析不可で集中) /
  **未応答 239** (22:58 頃から `claude CLI error: You've hit your session limit` で 37 テーマがまるごと空振り。
  費用 $89.00 / 入力 28.7M トークン)。gate 不合格率は評価対象 242 件中 17 件 = 7% で停止条件 (30%) 未到達。
  report: `.claude/skills/theme/manage-theme-portfolio/reference/audits/2026-09-16-selection-backfill.md`。
  206 件を develop へ cherry-pick + push 済み (`128c42a42`)。ratchet baseline `no-adoption-criteria` 540 → 275
  (残数の実測値)。driver の commit trailer をセッション実行モデルに合わせて修正済み (`f0efdd550`)
- **次 (実行順)**:
  1. 今夜: `nohup setsid bash .claude/scripts/themes/run-selection-backfill.sh --push-develop > .local/selection-backfill/full-run-2026-09-17.log 2>&1 &`
     (worktree は自動で origin/develop にリセットされ、残 275 件を再導出する。`--push-develop` で
     stop 条件到達でも exit 3 は正常扱いされ commit + develop へ rebase push まで進む)
  2. 翌朝: report の「gate 不合格」「資料なし」を人が処理 (develop への取り込みは 1 で自動化済み)。
     「role の推奨」の処理は `THEME-ROLE-REVIEW-01` に分離済み
  3. session limit のリセット時刻 (前回 12:40am JST) をまたいで回すと最も長く継続できる。1 晩で終わらなければ
     同じコマンドを翌晩も繰り返す (残数は catalog から都度再導出されるので `--themes` 指定は不要)
  4. Windows PC で回すなら pdftotext (poppler) を入れる。無ければ PDF 出典は到達性のみで通る (`skipped-pdf`)
- **完了条件**: `no-adoption-criteria` = 0、role 推奨リストの人間処理完了 (ratchet 配線は完了)
- **停止条件**: 1 晩の gate 不合格率 > 30% (prompt か gate の問題なので続行しない)、枠エラー 3 連続
- **禁止**: 夜間バッチによる role 変更・rejectedCandidates への追加・`git commit --no-verify`・
  gate 未通過の selection の書き込み

### [THEME-ROLE-REVIEW-01] 夜間backfillのrole変更提案を人が採否判断しThemeCatalogへ反映・サイトへ展開する

タグ: [エージェント・SSOT] [種類:意思決定] [実行:対話] [検証:npm run validate:catalog --workspace=@stats47/data-configs] [起票:2026-09-17] [領域:データ]

- **owner**: theme-designer (採否判断・`data/themes/catalogs/<theme>.json` 編集) / 最終承認はユーザー
- **背景**: `THEME-SELECTION-BACKFILL-01` の調査は selection の裏付けだけでなく、副産物として
  「今の role (primary/secondary/context) は適切か」の判定も出す。これは selection と違い
  **採用すればサイト表示 (指標カードの並び) が変わる**唯一の出力。ただし夜間バッチは role を
  書き換えない (禁止事項) ので、人の採否判断とカタログ編集を挟まないとサイトに届かない。
- **進捗管理 (2026-09-17 新設)**: `.claude/scripts/themes/build-role-review-queue.mjs` が
  全 `reference/audits/*-selection-backfill.md` の「role の推奨」を横断集約し
  `data/themes/role-review/{role-review-queue.json,LATEST.md}` へ書く。夜間 run が自動で再構築する
  (driver に配線済み)。**「反映済み」は手動フラグでなく `THEME_CATALOGS` の実際の role と
  recommended の一致で自動判定する** (手動フラグはドリフトする)。現在: 45 件 pending (2026-09-16 run 分)
- **サイトへの展開経路 (実行順)**:
  1. `data/themes/role-review/LATEST.md` で pending 一覧を確認
  2. 1 件ずつ採否判断し記録: `node --import tsx .claude/scripts/themes/build-role-review-queue.mjs decide --theme <theme> --key <rankingKey> --decision accept|reject --note "..."`
  3. accept した分を `data/themes/catalogs/<theme>.json` の該当指標の role へ反映
  4. `npm run generate:catalog --workspace=@stats47/data-configs && npm run validate:catalog --workspace=@stats47/data-configs && npm run type-check --workspace=@stats47/data-configs`
  5. localhost で視覚 QA (`theme-improvement-execution.md` の QA チェックリスト)
  6. commit → develop へ push
  7. **別承認で develop→main の通常デプロイ** (`.claude/rules/branch-workflow.md`)。role は
     `packages/types/src/indicator-sets/<key>.ts` (codegen) 経由で `apps/web` に**ビルド時 static
     import** される (`config/all-themes.ts` → `to-theme-config.ts` の `tabIndicators`/
     `defaultRankingKey`)。**R2 push だけでは反映されない** (2026-09-17 訂正: page-components R2
     sync で足りるのは chart 定義側だけで、role が駆動するカード表示は毎回アプリデプロイが要る)
  8. `node --import tsx .claude/scripts/themes/build-role-review-queue.mjs` を再実行し、対象行が
     `applied` になったことを確認
- **完了条件**: `role-review-queue.json` の `pending`+`accepted` が 0 (backfill が続く限り毎晩増える。
  日次で LATEST.md を捌く運用が定着したら本カードは削除し `THEME-SELECTION-BACKFILL-01` の「次」だけに戻す)
- **禁止**: 承認前の R2 push、`experiments.json` への baseline 登録なしの本番反映
- **参照**: `.claude/skills/theme/manage-theme-portfolio/reference/theme-improvement-execution.md`
  (採択ゲート・実装契約・視覚QAの正典)

### [LOCAL-RESOURCE-BUDGET-01] 資料の復元経路と再起動後のメモリ削減効果を確認する

タグ: [インフラ・計測] [種類:改善] [実行:対話] [起票:2026-09-10] [領域:管理]

- **owner**: devops-runner（計測・保持確認）／オーナー（Codex再起動）
- **次（実行順）**: ①次回Codex再起動後に local:health を実行し、重複MCP設定変更の適用とNode数・専用メモリを同じ代表作業で比較する。②日本国勢図会のprivate Drive保管6分割bundleをWindowsへ復元し、既存source-vaultのSHA-256検証と再展開検証を通してから books/ を回収する。③残る一時GISの原本ZIP・固有スクリプトは取得URL・成果保存先・復元手順がそろうものから回収する。
- **再開材料**: 端末内 .local/resource-health/ の計測・掃除・GIS復元台帳、既存 source-inventory/japan-zue/2025-26/source-bundle-manifest.json。Driveの日本国勢図会/2025・2026年版にmanifestと6分割ファイルの存在・非共有・容量を確認し、ローカル1746ファイルのhash一致と全profileのcoverage 100%は検証済み。Drive connectorのバイナリ返却先はsediment URIで、このWindows端末への復元経路は未確立。
- **停止条件**: 未検証のDrive原本・GIS・WIP・認証profileを削除しない。既存セッションの一括終了やGit履歴リセットで軽量化しない。Node数・メモリはツール稼働を含む瞬間値であり、条件を合わせず削減効果と断定しない。
- **完了条件**: 再起動後の同条件計測を保存し、参考文献のDrive復元検証と source-vault:check が通る。GISは回収した各対象から保全先と再生成手順が辿れ、保全できないものには保持理由を残す。導入済み予算・定期点検方式は local-environment.md と自動化インベントリを参照する。

### [AFF-A8-NOTE-PILOT-01] A8 の note 用広告リンクを意図一致の無料 note 1 本で試し、stats47 分として計測できるか確かめる

タグ: [収益化] [種類:改善] [実行:対話] [起票:2026-09-25] [領域:アフィリエイト]

- **owner**: affiliate-operator (A8 の確認・口座 assert) / note-manager (記事更新) / オーナー (公開承認)
- **背景**: A8 は 2026-09-01 に X・Threads・note 専用の広告リンク発行を始め (新メディア管理画面のみ)、
  09-17 に X 用リンクの商品画像 (OGP) 表示に対応した。X・Threads は採用しない。投稿のリンク枠が
  stats47 への送客と競合し、成果を GA4 で計測できず、OGP が統計図を広告主の商品画像に置き換えるため。
  note は読者の意図が案件と一致する記事に限れば、文脈一致の原則 (`.claude/rules/affiliate-ads-standards.md`) と両立する。
- **次 (実行順)**: ① A8 新管理画面で、note 用リンクの発行にメディアサイト登録が要るか、成果レポートで
  note 経由の成果を stats47 分として取り出せるかを確認する (A8 は doboku-note と口座共用でサイト切替が無い)。
  ② 取り出せる場合だけ、ふるさと納税・移住など意図が明確な既存の無料 note 記事 1 本と提携済み案件 1 件を選び、
  必要な click 数と最大期間を開始前に計算する。③ PR 表記付きでリンクを追加し、観測は improvements.md の別 ID へ引き渡す。
- **停止条件・禁止**: 成果を stats47 分として分離できなければ導入しない。新規提携申請、X・Threads への展開、
  ブロックリスト該当案件、クリックを促す表現は禁止。note 記事の更新は outward-facing なので実行前にオーナー承認を得る。
- **完了条件**: ①の結果を証拠付きで記録する。分離できる場合はパイロット 1 本が公開済みで観測 ID が起票されていること、
  分離できない場合は不採用の判断を `docs/00_プロジェクト管理/02_収益化戦略.md` へ 1 行で反映していること。

### [AFF-VERTICAL-FIT-02] population / health / education 軸の上位在庫を主題に合わせて入れ替える

タグ: [収益化] [種類:改善] [実行:対話] [起票:2026-09-03] [期日:2026-10-15] [領域:アフィリエイト]

- **owner**: affiliate-manager / 判断は uruhayato373
- **実測 (2026-09-03)**: priority 上位 3 が主題と合っていない軸が残る。
  - population: マッチングアプリ ×2 が最上位。未婚率・婚姻には合うが、人口密度・在留外国人・
    世帯構造 (週 8K imp) には合わない
  - health: RIZAP / ClassPass が難病・精神病床・中絶率のページに出る。精力サプリは #913 で
    priority 1 に下げたが停止はしていない (improvements `AFF-BRAND-FIT-01` の判断待ち)
  - education: AI Agent Camp (Claude Code 研修) / LEC 資格講座が図書館・学校数のページに出る
- **次**: (a) マッチングアプリ・結婚相談所は `targetRankingKeys` で未婚率・婚姻・初婚年齢の
  ranking に限定する (b) 人口密度・世帯構造には子育て・保険系を上位にする (c) 図書館・学校数には
  通信教育・塾探し (エデュスタ p20) を上位にする。priority 変更は週 1 vertical 1 変更まで (rules §10)。
- **完了条件**: 3 軸とも GSC imp 上位 3 ページで priority 上位 3 の広告が主題と合っている
  (人が読んで判定。表を PR に残す)。

### [AFF-RAKUTEN-FIRST-01] 家計調査ページで楽天商品カードを native 枠より上に出し、計測を分離する

タグ: [UI・UX] [種類:改善] [実行:sweep] [検証:npm run test --workspace apps/web -- src/features/ads] [起票:2026-09-03] [期日:2026-10-31] [領域:アフィリエイト]

- **owner**: ranking-ui-manager / affiliate-manager
- **現在地 (2026-09-13)**: 後続の明示指示に基づき、全セッションの関連変更をPR963で公開した。app34739098468成功、計測定義切替は2026-09-13T05:02:32Z。楽天run34726845212で510検索を新規取得し、有品373・正常空137・失敗0。公開先510canonical GETの内容とepoch一致を確認した。固定28日baselineは `data/affiliate/affiliate-placement-baseline-2026-09-08.json` を維持する。
- **公開後の次**: 48時間後に `rakuten-sidebar` のpage/device別計測を確認し、未取得なら
  商品在庫・DOM表示・GA4送信を切り分ける。14日以上の非重複窓で表示/PV・商品クリックを比較し、
  楽天成果レポート未取得の間は収益増と判定しない。直前のPR945の影響と混在するため因果効果は断定しない。
- **未完了**: 「楽天市場で探す」は通常検索URLのまま、affiliate_clickから除外済み。
  収益化するには楽天公式リンク作成で発行した検索リンクを取得し、生成URLを改変せず採用する。
- **なぜ**: 「納豆消費量ランキング」の読者に最も合うのは品目一致の楽天商品カードだが、現在は
  右レールの末尾 (`RakutenItemsCard`) にあり、GA4 では `blog-sidebar` / `ranking-sidebar` に
  混ざって計測されるため効果を分離できない。
- **次**: 9/15 14:02:32 JST以降に48時間の計装確認、9/27に14日経過後の比較可否を確認する。現行GA4のdays指定は当日を含むinclusive窓のため、明示日付の確定した非重複期間が取得できるまでは効果を判定しない。
- **停止条件**: 取得失敗・他県混入・PR/計測欠落があれば担当へ修正を引き渡す。収益化されていない通常検索リンクを成果クリックに含めない。
- **完了条件**: GA4 の `link_position=rakuten-sidebar` が家計調査ページで取れ、CTR が
  native 枠と比較できる。

### [PREFECTURE-DEVIATION-S5-01] 『47都道府県の偏差値』の一次資料候補25件をmetric/theme/ranking候補へ展開する

タグ: [コンテンツ品質] [種類:制作] [実行:対話] [検証:npm run source-vault:test] [起票:2026-09-15] [領域:データ]

- **owner**: 台帳は`open-data-curator`、metricKey実在検証は`estat-researcher`、投入は`data-ingester`。
- **現状証拠**: profile `prefecture-deviation` (Drive `参考文献/47都道府県の偏差値/2018年版`、6分冊PDF・103ページ)を
  全ページOCR (jpn+eng, rotate 90, psm 4)。一律`rights-hold`103件だった旧判定 (書誌確定前の暫定placeholder) を撤去し、
  `data/source-inventory/prefecture-deviation/2018/analyses.json` に章単位の分析・論点53件を authored
  (kakei-marketingと同じ形式)。`data/source-inventory/prefecture-deviation/2018/`はcoverage 100%
  (`combined-analysis` 25 / `primary-source-unavailable` 20 / `context-only` 5 / `not-applicable` 3)。
  書籍の偏差値・数値そのものは転記せず、章の着想だけを一次資料 (総務省家計調査・人口動態調査・国勢調査・
  住宅土地統計調査・文科省学力調査等) で独立再検証可能かを判定した。
- **次**: `combined-analysis` 25件を1件ずつ、①既存metric/rankingとの重複確認、②未登録なら`estat-researcher`が
  statsDataId実在検証、③`data-ingester`が投入、の順で管理画面`/content/references`にunit接続が出るまで進める。
  `context-only`5件 (自動車検査登録情報協会・全国軽自動車協会連合会等の業界団体統計) は既存記事の分析文脈補強にのみ使う。
- **停止条件**: 書籍の偏差値・数値・図表・本文を公開物へ直接流さない。一次資料で再取得できない項目は
  `primary-source-unavailable`のまま留める (`週刊朝日`独自集計の東大・京大合格者数ランキング等、20件は既に該当)。
  R2 write・deploy・SNS公開は別途承認。
- **完了条件**: `combined-analysis`25件全てがreuse-existing-metric/new-metricいずれかで既存SSOTへ接続され、
  管理画面`/content/references`で実在証跡が確認できる。

### [REFERENCE-CONTENT-DRAFTS-01] 参考文献由来のテーマ企画と横断ブログ下書きを制作する

タグ: [コンテンツ品質] [種類:制作] [実行:対話] [検証:npm run test --workspace=apps/admin -- reference-expansion-plans] [起票:2026-08-30] [領域:データ]

- **owner**: テーマ採択は`theme-designer`、ブログ本文は`article-writer`、管理画面の読み取り契約は`admin-console`。
- **前提**: `japan-zue`の解決済みinventoryは論点発見だけに使う。記事・テーマへ載せる定義、年度、単位、値は、各metricの一次資料とR2観測値で再検証する。原文、OCR、書籍値、内部cropは公開しない。
- **テーマ企画**: 参考文献で`theme`対象になり、既存ThemeCatalogまたはIndicatorSetへ未統合の制作単位だけを保持する。`draft`は採択・チャート設計待ち、`blocked`はactiveな公開metricが無いため停止中。

(2026-10-10 に `data/source-inventory/placement-decisions.json` の channel=theme へ移した。企画中・停止・見送りはそこが正本で、管理画面 `/content/references` が読む)

- **2026-09-14 テーマ企画14件を判定 (theme-designer)**: 採択11件をcontext roleでThemeCatalogへ追加 (`sex-ratio-total`→population-dynamics、`day-time-population`→labor-mobility、`electricity-generation-capacity`/`agricultural-employment-population`→local-economy、`avg-propensity-to-consume-worker-households`→real-income、`municipality-count`/`households-on-public-assistance`→local-finance、`infant-deaths`/`infant-mortality-rate-per-1000-births`/`average-life-expectancy-female-20`/`average-life-expectancy-female-65`→healthcare)。却下3件: `general-households`(人口動態=増減メカニズムと無関係、世帯構造テーマ向き)、`area-ratio-of-total`(気候テーマと面積は無関係、landweatherカテゴリのまま)、`number-of-establishments-manufacturing`(登録済み`manufacturing-establishments`と同一statsDataId・年度が古い重複)、`average-life-expectancy-male`(subtitleに年齢欠落・値63年が0歳時点と矛盾し要metric修正)。`generate:catalog`→`validate:catalog`(0 error/0 warn)→`tsc --noEmit -p apps/web/tsconfig.json`(0 error)まで確認済み。
- **ブログ下書き**: `contents/blog/{household-structure-daytime-population-gap,agriculture-output-employment-productivity-gap,electricity-generation-manufacturing-establishments-gap,household-spending-debt-propensity-gap}/article.md`。4本とも`published:false`で、一次資料・R2接地前の数値主張を置かない。`general-households`/`number-of-establishments-manufacturing`は却下済みのため、該当2本のペア構成をarticle-writerが着手前に見直す。
- **次**: blocked 3件はactiveな公開metricが出た時点で再判定する。ブログは各指標の年度・母集団を揃え、相関snapshot、チャート、本文、独立criticの順で品質ゲートへ進める。
- **停止条件**: inactive metric、年度・母集団の不一致、相関snapshot不在、一次資料未確認、権利保留のいずれかがあれば公開へ進めない。
- **2026-10-09 ワークフロー (wf_d880dc8a-bab) の結果**: `agriculture-output-employment-productivity-gap` と `household-structure-daytime-population-gap` は データ接地・SVG・quality-gate・独立 critic PASS まで完了 (published:false のまま)。公開に残るのは記事固有の背景画像 (Codex の担当、`npm run blog-images:codex -- request-article --slug <slug>`)。世帯構成の記事は指標を核家族世帯割合 × 昼夜間人口比率 (2020 年国勢調査) に組み直した。`electricity-generation-manufacturing-establishments-gap` は 2 指標の相関 snapshot が無く停止 (2023 年の 47 県結合で r≈0.30。snapshot 外の散布図を例外として許すか、snapshot に実在する工業用水・港湾貨物の組へ企画を替えるかはオーナー判断)。`household-spending-debt-propensity-gap` は 3 指標に共通する年が無く停止 (負債現在高は 2019 年のみ、消費支出は 2019 年が無い)。
- **2026-10-09 公開**: 2 本 (`agriculture-output-employment-productivity-gap` / `household-structure-daytime-population-gap`) は記事固有背景 (2c1c49dba) を得て blog-auto-publish (run 37903460052) で R2 に公開した。PR #1116/#1118 と Deploy 37924050596で公開一覧を本番へ反映し、2026-10-10に2記事とも実ページ200・JSエラー0・横overflow0を確認した。タグ 3 つ (農業就業人口・昼夜間人口比率・核家族世帯) を data/content/tags.json に登録した。
- **完了条件**: blocked 3件はmetric公開可否が確定する。ブログ4本は一次資料・R2接地、SVG、quality gate、critic PASSを満たしてから`published:true`へ移す。

### [SNAPSHOT-EDGE-PURGE-GAP-01] snapshot 同期後にエッジが旧 HTML を配信し続ける

タグ: [種類:不具合] [実行:対話] [起票:2026-08-17] [領域:管理]

- **owner**: Claude Code
- **症状 (2026-08-17 実測)**: `sync-snapshots --only ranking-items` 完走後も
  `/ranking/marriages-per-total-population` の `<title>` が旧値 (2014年・東京 6.49) のままだった。
  三層で切り分けた結果 **R2 と Worker は正しく、Cloudflare エッジだけが stale**:
  - R2 `app/ranking/<key>/item.json` の `generatedAt` = 20:25:21・新 seoTitle 入り
  - `?cb=<random>` でエッジを迂回 → **新 title**・`cf-cache-status: MISS`
  - 素の URL → 旧 title・`cf-cache-status: HIT`・`age: 1649`
- **原因**: `sync-snapshots.yml` の「🧹 Purge Workers Cache after snapshot sync」が呼ぶのは
  `purge-worker-cache.ts` で、**Workers Cache しか消さない** (スクリプト冒頭に
  「zone purge API は Workers Cache へ影響しないため」と明記されている)。
  ゾーンのエッジキャッシュは別レイヤで、誰も purge していない。
  さらに origin は `cache-control: public, max-age=0, must-revalidate` を返しているのに
  エッジが HIT を返す = **Cloudflare 側の Cache Rule が Edge TTL を上書きしている**
  (`ogp-image-standards.md` §5.0 の `storage.stats47.jp` が `max-age=14400` を返すのと同じ構図)。
- **なぜ毎回は表面化しないか**: エッジにエントリが無い URL は origin まで抜けるので新値が出る。
  実際 同じ同期で `divorces-per-total-population` は即座に新 title になった。
  **「1 ページ直ったから反映済み」と判断すると取りこぼす**。
- **★ゾーン purge では直らないことを実測した (2026-08-17 21:00)**: `purge-cdn.yml` を
  prefix 空 (`purge_everything`) で dispatch し **run 32068743106 は success**
  (`🔄 Purging ALL CDN cache for https://storage.stats47.jp...` → `✅ Full cache purge complete`、
  zone `4caf2866…`)。にもかかわらず当該 HTML の `age` は 20:27 の充填時刻から
  **一度もリセットされず**増え続けた (2076 → 2153 → 2188)。同時刻に
  `storage.stats47.jp` は `DYNAMIC` を返しており、**purge はストレージ側にしか届いていない**。
  `deploy-workers.yml` 冒頭にも「purge-cdn は CDN のみで ISR には効かない」と既に書かれていた。
- **現時点で判明している構造**: ページ経路のエッジコピーを消す手段が**リポジトリ内に存在しない**。
  - `purge-worker-cache.ts --all` (sync-snapshots step 9・20:31:21 success) → Workers Cache のみ
  - `purge-cache.ts` (purge-cdn) → `storage.stats47.jp` のみ。`--files` も
    `${R2_PUBLIC_URL}/<key>` しか組み立てず `stats47.jp` の HTML を狙えない
  - → **purge 系スクリプトでは消せない**。実測では 50 分経過時点でまだ `HIT`
- **★デプロイすれば消える (2026-08-17 21:29 実測)**: PR #805 の develop→main デプロイ直後、
  同じ URL が `cf-cache-status: MISS` で **2022年・1位東京都（5.36人口千対）** を返した。
  buildId が変わってエッジコピーが無効化されるため。**「TTL 切れを待つしかない」は誤り**で、
  実務上は**次のデプロイまで stale**が正しい。したがって
  「snapshot 同期だけして数日デプロイしない」期間が危険窓になる (今回は 1 時間で解消した)。
- **次**: (1) Cloudflare ダッシュボードで **stats47.jp のゾーン ID と Cache Rule の Edge TTL** を
  確認する (オーナー領域。`CLOUDFLARE_ZONE_ID` が storage 用の別ゾーンを指している可能性を含む)。
  (2) ページ経路に届く purge 手段を決める (正しいゾーン ID での purge / Cache-Tag / `--files` の
  ホスト対応のいずれか)。(3) 決まったら `sync-snapshots` に配線する。
- **完了条件**: snapshot 同期の**次のデプロイ後**に本番 `<title>` を Googlebot UA で実測して新値になっている
  (代表 2 URL 以上)。判断できるまでは同期後の実測手順を SKILL に残す。
- **停止条件 / 承認境界**: ゾーン全体 purge は本番のキャッシュを一斉に落とすので、
  恒久配線はオーナー承認を経てから。Cloudflare の設定変更も outward-facing。
- 関連: `.claude/skills/db/sync-snapshots/SKILL.md` / `packages/r2-storage/src/scripts/{purge-worker-cache,purge-cache}.ts`

### [TILEMAP-LINEAGE-01] タイルマップの手動系譜残件

タグ: [種類:不具合] [実行:対話] [起票:2026-08-03] [領域:データ]

- **owner**: `chart-author`
- **CROSS-PAGE-DATA-SSOT-01からの分離 (2026-08-27)**: staged全量棚卸しで、現行の自動復元器が
  確証できる残件は0。タイルマップの手動判断残件は6枚で、正確な対象は
  `data/blog/svg-lineage-queue.json` の `residualCard === "TILEMAP-LINEAGE-01"` を正典とする。
  1枚 (`per-capita-income-gap/income-map`) は2021年SSOTと100%一致してローカル復元済み。
- **問題**: 公開済みタイルマップ 123 枚のうち 9 枚が現行の 720×720 デザインに移行できていない。内訳は (a) `data/*.json` が R2 に無い 7 枚 = 元データ消失 (`alcohol-prefecture-map/alcohol-consumption-map` / `childcare-friendly-prefecture-ranking/tile-grid-score` / `food-consumption-prefecture-battle/ramen-gyoza-tilemap` / `international-cooperation-volunteer-map/volunteer-rate-map` / `per-capita-income-gap/income-map` / `purchasing-power-adjusted/income-map` / `waiting-children-progress/waiting-children-map`)、(b) 年が確定できない 2 枚 (`fiscal-health-50years-trend/fiscal-map` / `fiscal-self-reliance-gap/fiscal-strength-map`)。
- **次**: (a) 元データ消失 7 枚 → SSOT から復元する。(b) 年不確定 2 枚 → 人が年を決めてから固定する。
- **(a) の手順**: `.claude/rules/blog-data-schema.md` §1.7 の restoreMethod に従い SSOT から復元する。SVG の絵から値を逆復元しない。SSOT に該当年が無ければ e-Stat から取り込んで SSOT を伸ばす (`data-ingester`)。届かない図は記事から外すか SSOT にある図に差し替える。
- **(b) の手順**: 両記事の本文は 2022年度 を論じているのに地図は 1988年 (live) を表示しており、再生成すると 1989年 に振れる (SSOT 照合が両年で同程度に一致するため)。どの年の地図が記事の主張に対応するかを人が決めてから `--mapping` で固定する。**確定するまで push しない**。
- **完了条件**: 123 枚すべてが `lintTileGridQuality` + `lintSvgSize` を error 0 で通る。

### [THEME-EXPANSION-IMPLEMENT-01] 地震曝露の住宅部分に使える全国空間原典を確保する

タグ: [コンテンツ品質] [種類:改善] [実行:対話] [起票:2026-09-09] [領域:データ]

- **対象**: 候補105の住宅部分。現在の採用範囲と未充足は [全体実装記録](../state/metrics/themes/2026-09-10-all-expansion.json) の `scopeCounts` / `validation.next253Tsunami29.scopeAudit`、採否は [候補カタログ](../skills/theme/research-theme-catalog/reference/theme-feasibility-catalog.json) のdecisionを正典とする。
- **owner**: theme-designer（採用判断）／open-data-curator（原典探索）／data-ingester・gis-pipeline-runner（取得・空間集計）。
- **次・実行順**: ①住宅を直接数える全国空間原典を公式提供元で確認し、版・単位・住宅の定義・地域カバレッジ・利用条件を記録する。②利用可能ならJ-SHISとの空間対応、県別途中artifact、保存則を実装・検証する。③採用指標と章へ接続し、生成物・実表示・本番反映を同じ対象で確認する。
- **停止条件**: 全国住宅の原典が確保できない間は未充足を維持する。人口・一般世帯・建物棟数を住宅戸数の代用にしない。PLATEAU等の部分カバレッジを全国値にしない。原典未発見を全国に存在しないという断定にしない。
- **完了条件**: 住宅部分を原典から再現でき、定義・時点・空間集計・配信値の整合を検証し、候補105のdecisionと全体実装記録へ証拠を反映する。公開後の計測と品質観測は `THEME-EXPANSION-EFFECT-01` へ接続する。

### [NOTE-BODY-QUALITY-PILOT-01] スマホで読める本文画像・配置・導入・出典・導線を6記事で試作する

タグ: [コンテンツ品質] [種類:改善] [実行:対話] [起票:2026-10-16] [領域:商品]

- **旧ID**: `NOTE-ARTICLE-QUALITY-PILOT-01` (2026-10-18 改名。`NOTE-ARTICLE-` で始まる ID は個別記事の写しとしてコンテンツ運用の監査が止めるため。調査記録 `data/note/evidence/note-article-quality-audit-20261016.json` は旧IDのまま)
- **owner**: note-manager（本文・導線と公開段取り）/ chart-author（決定的な統計図）
- **2026-10-19 develop統合・R2確認**: 画像索引259ファイルをprivate R2のmanifest SHAと照合し、家計3都市の共通候補3実体と公開済み参考図2枚の取得・SHA一致を確認。家計はnote/X/Instagramの9候補参照を保持するが、型方針変更で `candidateMatches=false` のため基本形から非表示になる。再開時は固定した検討見本の表示と候補採用を分け、候補のbasis更新・自動採用で隠さず4媒体に表示できるようにする。ランキング3型の見本PNGはR2固定入力から都度生成し、PNG自体はR2未保存。
- **優先順位**: カバー残件の一括展開より本文品質のpilotを先に試す案。カバーの残計画は `NOTE-COVER-IMAGEGEN-ROLLOUT-01` を保持する。
- **基本形の確認入口（2026-10-19更新）**: `/ops/image-templates` は左を「目的 → 図の形」の二階層に整理（比較 → 棒グラフなど）。図形以下の枝は固定せず制作で必要な違いを見て検討する。掲載範囲は各見本の補足へ、確認待ちは画像ライブラリへ分離し、分類案・未確定の目的/範囲を型見本へ混ぜない。旧selectionは絞込を解除して保持先を画像の補足へ移す。家計は右側の題材選択で同じ都市のnote固定サイズ試作1枚・X1枚・IG共通型候補1枚を同時表示する。制作記録と原記事keyから紐付け、保存原図の所属/ID/previewOnlyと投稿状態を維持。3都市の表示・画像取得・再読込・390px・darkを確認。Webだけの見本はWeb参考表示にし、未確認しかない旧URLはライブラリへ案内する。左には媒体・記事名・範囲・確認待ちの枝を置かず、shadcn標準Collapsibleと線の矢印を使用。目的/型/題材/媒体/見本/復帰位置をURLに保持し、未保存方針は保持する。比率選択と制作サイズの目安一覧を外し、家計のnote/X/IGは共通4:5（1080×1350）固定と表示する。制作仕様を常時表示し、重複説明を除去、型の方針・試作メモの編集は別パネルへ分離。原寸は画像から開き、画像ごとの操作は詳細へまとめる。原本・個別方針・旧候補6件を保持。青の統一・旧候補再確認・未登録媒体の試作と残分類は継続する。
- **noteも型の固定サイズへ（2026-10-19）**: 家計3都市のnote用棒グラフを共通4:5（1080×1350）で試作し、元記事の画像IDへprivate R2の候補として保存・SHA照合した。X/IGと同じ固定入力・十大費目・47県庁所在市単純平均・年・世帯区分を保持。「型の試作見本」に表示名を統一し、旧note画像は詳細の旧新比較へ分離。現行候補が失効・修正待ち・未生成なら旧原図を型見本として代用しない。2:3の旧試作は履歴へ残し、オーナー指示でnote/X/IGを同じ4:5・データ・色・目盛り・描画部品へ統一。候補の採用・公開本文差し替えは未実施。
- **3媒体を同じ1枚で確認（2026-10-19）**: オーナー指示でInstagramも十大費目を1枚に統一。3都市分を共通rendererで生成し、note/X/IGの画像SHA一致を検査。IGの旧分割図と同じ画像IDへprivate R2候補と制作入力を照合保存し、型見本では全項目の現行候補1枚だけを表示する。旧分割図は保持し、失効・未生成・修正待ち候補の代わりに使わない。管理画面で型確認を先行し、SNS下書きの素材構成・承認・予約・公開は変更しない。
- **画像の表記・注釈を短縮（2026-10-19）**: 管理画面と3媒体共通の試作画像を「家計支出の10分類」に統一。都市・年・対象世帯は各1回、下部注釈は基準と出典の2行に整理。全国値・県全域との違いなどの詳説は既存投稿本文へ残す。固定入力・10分類・値・4:5を保持し、3都市のnote/X/IGの同一画像候補を同じ画像IDへ登録する。6下書きの表示名・用語を統一し、公開記事・素材構成・承認・予約は維持。
- **分類の再開地点**: `/ops/image-templates?template=table&medium=compare&purpose=ranking` で表と棒を別々に確認する。前回目視した36画像を新しい型・目的・構成に移行し、棒を含まない消費支出ランキング1画像はテーブルへ是正した。画像ID・原本・個別方針・候補6件の実体と入力は保持。分類待ちの全数確認と同じ固定データでの媒体別試作は引き続き本カードで進める。
- **SNS分類の続き（2026-10-19）**: 当初未分類467枚のうち123枚をSHA照合・目視し、棒17枚（X12/Instagram5）を含む120枚の分類を保存。旧Drive原本17枚は同じ投稿ID・SHAのままprivate R2へ保全し、既存本文・状態・予約日時を維持。未分類347枚は、旧Drive原本の取得・照合待ち215枚、保存原本の記録なし129枚、地理的な線・点の表現で現行型に確定できない3枚に分けて継続する。数表・出典・表紙・まとめは棒へ寄せず、分類確認とデータ品質の合格を区別する。最低気温の旧図の符号・棒方向は個別画像の改善方針に記録した。
- **note家計の媒体展開（2026-10-19）**: noteの名古屋市・青森市・札幌市の固定2024年入力から、既存候補6件（ID1188〜1193）へX各1枚・Instagram各4枚の計15枚を制作・紐づけ済み（`/sns?scope=candidates&q=a-kakei`）。Xは十大費目を1枚、Instagramは導入・前半5費目・後半5費目・出典に分け、原寸と320pxで確認した。全画像1080×1350、1.00を基準に同じ青で左右へ描き、全3都市で共通目盛りを保持する。原記事・manifest SHA・固定入力はplanning、再現用の入力・描画元コードとSHA・出力SHAはproduction.inputのprivate R2を辿る。元note図は参考原図として保持し、実投稿用見本には混ぜない。管理画面で投稿用各枚と原図を切り替え、詳細の「原図と媒体別レイアウト」でも比較できる。47市単純平均と家計調査の全国値、市域の家計調査と県全域の全国家計構造調査を区別する。本文・承認・配信は次の確認対象で、6件とも下書き・承認待ちを維持。入力が不一致・未回収、年/地域/世帯区分が不明なら制作を止める。画像制作だけで公開・効果検証を完了扱いにしない。
- **画像型の再開地点**: 管理画面 `/ops/image-library?q=MOBILE-PILOT-01` の6候補（ランキング・地理形状地図・散布図を各2枚）を採択・修正し、型の方針を確定する。個別の確認事項・本文との不一致・配置方針は `data/content-operations/quality.json`、型は `image-templates.json`、固定入力とSVG/PNGは候補のprivate R2参照を辿る。note2記事の色の説明・順位・30℃未満の記述の矛盾、散布図2記事の過去入力復元の確証を解決してから公開する。その後に全件を標準適合・再生成・個別判断・入力不足へ分類する。画像6枚の試作で記事品質pilot全体や全画像の監査を完了扱いにしない。
- **調査と方針**: `data/note/evidence/note-article-quality-audit-20261016.json`、`docs/30_note記事企画/note戦略.md`「本文品質の改善方針」。既存note画像是正の実行単位として `MEDIA-AFFILIATE-RELEASE-01` ④へ接続する。
- **対象候補（3記事ずつ確認）**: ①`recovered-n80e58a01f660`（県民所得）・`recovered-nf962c6702b93`（日照ランキング）・`recovered-n023501038bd5`（日照の背景・散布図）。②`a-kakei-aichi`（家計）・`recovered-n03e45e40d3a7`（KML手順）・`d-geo-ipss-prefecture-map`（データ再利用）。これは試作の上限で、必要標本数ではない。
- **次・実行順**: ①stats47の最新完全な期間集計を取得し、対象・維持記事・既存下書き・最近のカバー変更時刻を固定する。直近latestの取得失敗を古い正常値で隠さない。②前半3記事の旧図と候補を390px/320pxで比較し、上位下位の分割、地図の凡例、散布図の軸を先に確かめる。③見出しと図の対応、短い導入、記事末の出典、主CTA1つ＋副最大2つを本文差分として提示する。④後半3記事へ型を適用し、マガジンの実所属と目的別の読む順を確認する。⑤承認された記事だけ保存・公開し、同じURLで図とカードの表示・クリック先を読み戻す。
- **再発防止の実装候補**: 既存render-spec/入力SHA/単位・年/版の検査を再利用し、分割時は画像枚数契約も更新。重複画像・CTA件数・指標と商品の対応・公開カードの空欄を検査する。意味の一致、図の必要性、配置と縮小後の読みやすさは目視。未実装gateを実装済みと扱わない。
- **全件管理と媒体共通化の検討（2026-10-16）**: 記事key・SNS投稿idから図版の固定入力、テンプレートID/版、媒体別出力、使用先、レビューを辿る。既存のカバー/投稿台帳を複製せず結び、管理画面で保存状況・再生成可否・改善方針・旧新画像・未確認項目を表示する案。全件の入力棚卸しを先に行い、同じ型の代表例から改善する。管理画面とR2保存・照合・復元の基盤を実装済み。実画像の改善・全記事の目視確認は引き続きこのpilotで進める。
- **実装した基盤（2026-10-16）**: 同じ台帳を `/ops/image-templates`（型の見本）、`/ops/image-library`（実画像・元データ・使用先）、`/product/content-quality`（記事・投稿の改善）の専用ページで管理。OGP/リンクカード/ブログSVGも同じIDと候補審査を使用する。6記事の方針と画像単位の方針は `data/content-operations/quality.json` に保存。入力の復元・R2移行・候補登録・採用条件の正典は `apps/admin/README.md`。全記事の目視確認や公開差し替えが終わったという意味ではない。
- **分類・画像改善の再開入口**: `/ops/image-library?queue=classification` の全使用箇所を、画像IDごとに根拠付きで確認する。使用箇所/役割/型を分け、型未割当・分類案・元画像変更を区別する。分類履歴・個別方針・現画像の維持判断・候補は同じ `quality.json`、noteカバーは既存専用台帳を使う。キューと棚卸し待ちは正本から派生する（件数をここへ複製しない）。原本SHAと目視で分類を確定した画像は `quality.images[IMG].classification` の理由・日時から追える。次は分類確認済み画像の原典・入力照合と320pxでの候補比較を進め、未確認のpilot画像と分類案・入力不足も型単位で解消する。人口密度のラベル衝突、エンゲル係数の記事タイトルと図の年・定義、品目1位一覧の帯の尺度など、個別の確認点は同じ画像レコードの `policy` に記録する。分類の確定と品質合格・公開採用を混同しない。契約・保存API・CI検査は `apps/admin/README.md`「分類・改善台帳の契約」。
- **保全の残作業**: `data/content-operations/live/image-migration.json` (正本は private R2、`npm run media:state:pull` で取得) の未取得をDrive接続端末で `media:migrate -- --all --verify-existing --apply` により再開する。不一致は元ハッシュの画像を回収するまで停止。note-only本文回収は `NOTE-BODY-RECOVERY-01`。元データ未保全の図は値を推定せず入力を回収し、代表図の再生成・320px比較に進む。
- **保存状況の根拠**: 同日のローカル台帳で公開397記事中324記事に `body.manifest`、73記事は `note-only`（回収は既存 `NOTE-BODY-RECOVERY-01`）。保存記録は全記事の固定数値・図版入力が揃う保証ではない。投稿済みX210件のうち素材 `missing` を含む行72件、Instagram212件中85件・素材記録なし7件。いずれも台帳上の状態で、R2/Drive全実体の再検査・消失判定は未実施。根拠は同じevidenceの `imageReproducibility`。
- **画像基盤の順序・完了条件案**: ①台帳と保管先を照合し、元データ/生成条件/完成画像それぞれの不足を区別する。②共通の図の型と媒体別レイアウトを結ぶ。SNSの上位下位のみの旧図を新規へ復活させず、現行の全47県タイル等を維持する。③当時の固定値でのデザイン更新と最新データ更新を別操作にし、前者では数値・年・単位の一致を検査する。④入力・フォント・地理データ・rendererの版/ハッシュと候補画像を共有保管し、320px等での確認後に採用する。代表図を別端末で復元・再生成し、対象利用先と旧新比較を辿れることを完了条件とする。カバーのAI生成は別契約を維持し、統計図に流用しない。公開済みSNSへの差し替え可否は媒体仕様を確認してから扱う。
- **関連タスク**: 空欄カードの復旧は `NOTE-CARD-REPAIR-01`、誤った元データ案内と導線の対応は `NOTE-CIRCULATION-CTA-01`、マガジン整理は `NOTE-MAGAZINE-REORG-01`。先に全件のカード修復やマガジン作成を再実行しない。
- **停止条件・公開境界**: 管理画面・台帳・R2画像保存の実装と旧画像の検証付き移行は承認済み。数値・原典・集計単位が不一致、既存下書きがある、カードの公開表示が確認不能、本文の別変更を巻き込む場合は当該記事を止める。note公開・R2正本更新は差分レビューと当該反映指示後。統計図をimagegenで描かない。
- **完了条件**: 最大6記事で修正前後・採用図版・本文差分が確認され、承認対象だけ公開実測を通る。対象外本文・価格・公開状態を保持。共通生成・検査・保存手順を次記事でも再利用できる。効果観測を行う場合は最新baseline・対象・交絡・指標・期限を揃えて既存改善台帳へ引き渡す。記事内クリック・読了が未取得なら判定不能と明記する。

### [NOTE-CIRCULATION-CTA-01] note回遊とCTAのcatalog駆動化

タグ: [種類:改善] [実行:対話] [起票:2026-07-18] [領域:商品]

- **owner**: Claude Code
- **計測の前提**: 2026-08-27の別アカウント混入記録は使わない。stats47をassertした2026-09-07〜10-04集計は完全（当時286記事）だが、10-12のlatestは取得失敗。最新の対象範囲で再取得してから効果比較する。記事内クリックは現collectorで取得できず、PVをクリックと扱わない。
- **次**: `NOTE-BODY-QUALITY-PILOT-01` の対象から意味の一致を確認する。2026-10-16の公開確認では、日照記事に農地転用、県民所得記事に衣服物価を「この記事の元データ」と案内していた。カテゴリの一致だけで商品を割り当てず、指標・年・粒度・収録ファイルの対応を検証する。重複CTAと空欄カードも同じ公開面で確認する。
- **trigger**: 正常なstats47の集計と公開導線の対応が揃い、少数対象の差分をレビューできること。
- **完了条件**: 記事、マガジン、stats47 CTAの対応をcatalogから決定的に生成し、全記事一括変更しない。

### [NOTE-MAGAZINE-REORG-01] note既存投稿のマガジン再編成 + 新規投稿の増産

タグ: [種類:制作] [実行:windows] [起票:2026-08-03] [領域:商品]

- **owner**: Claude Code
- **方針**: ココナラ商品カタログと同型 (git TS カタログ = SSOT)。ただし公開済み stats47-note 159 件は回収スタブ (key = note ID・不透明・`r2Body:false`) で、カテゴリはタイトルからしか導出できない点がココナラと異なる。
- **済 (Phase 1)**: `magazines.ts` を e-Stat 17 カテゴリ + 行動者率クラスタ = 18 マガジンに細分化。`assign-magazines-by-title.mjs` (タイトル分類・決定的) で公開済み 159 件中 143 件 (90%) を `s47-*` マガジンへ割当。validator pass・派生インデックス再生成済。
- **残り**:
  1. **note-operator 自動化を新設** (coconala-operator 相当・Playwright)。マガジン作成 + 記事割当を note.com へ反映する。**note ログインは人手** (初回・所有者アカウント)、実反映は draft-first + 承認境界。まず 1 マガジン (件数最多 = `s47-sports-culture`) で実証してから横展開。
     - 実装済: `.claude/scripts/note/login-note-profile.mjs` (永続プロファイル `.local/playwright-note-profile` への対話ログイン + account assert `config/note-account.json`)。
     - 実装済: `.claude/scripts/note/probe-magazine-ui.mjs` / `fetch-note-magazines.mjs` (read-only。既存マガジンを API 取得)。
     - **★probe で判明した実態 (2026-08-03)**: note.com には既に**有料マガジン3つ**が稼働中 — 公務員×Claude Code (¥1,980・key m512ad7023815) / e-Stat×Claude Code (¥1,480・m1b836e4c8dce) / D3.js配色完全ガイド (¥500・mfe0fab2606eb) + デフォルト「あとで読む」。**ランキング系マガジンはまだ note.com に無い**。
     - **済 (Track A・照合取り込み)**: 既存3マガジンの noteUrl + isPaid を magazines.ts に反映。product-d3-colors 新設 + D3 全6章を帰属 (第2-6章=stats47-note / 配色理論=koumuin-gis)。validator error 0。
     - **済 (membership 検証)**: `fetch-magazine-members.mjs` で各マガジンの note.com 実所属を取得・突合。結果: product-d3-colors 6=6 一致 / koumuin-claude-code note.com 37 vs catalog 35 (note.com が2件多い・マガジンが vertical 跨ぎ) / **koumuin-estat note.com 1 vs catalog 14 = 13件未追加 (Track B で追加)**。30 warn (有料マガジンに無料記事) は note.com buy-once モデルの実態と確認 (catalog は正しい)。
     - **flow 判明 (create-probe)**: マガジン作成/管理は `/notes` ダッシュボード。記事の「…」→ マガジンに追加、上部「マガジン ▾」で絞り込み。`/magazine/new` は 404。作成入口は追加モーダル内 or 専用ページ (要 click probe)。
     - **済 (Track B・operator 実装)**: `lib/note-session.mjs` (account assert) + `note-magazine.mjs` CLI (`plan` / `create --key --commit`)。作成フォームは `https://note.com/magazines/new` (名前≤30字 + 説明≤400字 + 無料/有料 + 作成)。dry-run で作成候補15件 (14 s47 + koumuin-gis・全て名前30字以内) を算出済み。無料マガジン専用 (有料は手動)、既存 noteUrl 持ちは作り直さない、`--commit` gate + account assert。
     - **済 (Track B・マガジン作成)**: `note-magazine.mjs create-all --commit` で s47-\* 14 + koumuin-gis = **15マガジンを note.com に実作成完了** (pilot 検証後に一括)。全 noteUrl を magazines.ts へ書き戻し。note.com マガジン総数 19 (今回15 + 既存4) を実測確認。catalog 18中15稼働・残3 (ict/international/energy) は記事0で受け皿。auto mode は「全て自動化」の明示指示で outbound write を許可。
     - **済 (Track B・記事割当 = add-article)**: `note-magazine.mjs add-articles --commit` で **合計156記事をマガジンへ投入完了** (s47-sports-culture 74本 / 自治体財政 14本 / koumuin-estat +13本 等・成功率100%)。API は `POST /api/v1/our/magazines/{magKey}/notes` body `{note_id, note_key}` (両方必須) + header `X-Requested-With: XMLHttpRequest` (CSRF 不要)。note_id は creator contents API (`kind=note`) の key→id マップから解決。既存メンバーは skip する冪等実装。**マガジン再編成 + 記事投入は note.com 上で完全稼働**。
       1b. **残 (整理・任意)**: (a) note.com 上の別URL重複投稿3件 (災害SNS/苦情/FAQ) の削除判断 = オーナー領域。(b) 未公開ドラフト22件のカテゴリ手当て or 整理。(c) s47-ict/international/energy (記事0) は新規投稿が付いたら create + add。(d) 新規投稿の増産 (`sns-content-standards.md` の note 頻度上限は 2026-08-03 撤廃済)。
       1c. **下書き37本の新規投稿 (browser-use・進行中) ★resume ポイント**:
     - **方針**: 「投稿できるものは全て投稿・上限なし」(2026-08-03 オーナー判断)。対象 = 完成済み下書き37本 (stats47-note 28 + koumuin-claude-code 9)。product-sales 55 は凍結チャネルで対象外。
     - **前提**: 投稿は **browser-use + Chrome Profile 5** (note.com/stats47 ログイン済・アカウントゲート合格確認済)。実行環境 = オーナーのローカル Mac。`export PATH="$HOME/.browser-use-env/bin:$PATH"`。
     - **済 (pilot 1本・実公開)**: `a-maximum-temperature` → https://note.com/stats47/n/n91e96edf3950 (HTTP 200・図3枚正配置・s47-climate へ束ね済)。
     - **修正済バグ2件** (commit 73bbe8939 等): ① `prepare-article.cjs` の画像 regex が `images/` を取りこぼす → `(?:\.\/)?images/`。② `ins_img` が目次(TOC)同名見出しに誤マッチ → `publish-new-note.sh` が投稿前に目次を折りたたむ。
     - **パイプライン (1本ごと)**: `node .claude/scripts/note/prepare-article.cjs <slug>` → `build-body.cjs <slug>` → `bash .claude/scripts/note/restore-from-r2.sh <slug>` → `node generate-note-covers.mjs --slug <slug>`(koumuin は `generate-koumuin-covers.cjs`) → `node generate-note-hashtags.mjs --slug <slug>` → `bash .claude/scripts/note/publish-new-note.sh <slug> <vertical> --publish` → live 確認 (`curl -sI note.com/stats47/n/<id>`) → catalog を published+noteUrl+magazine に更新 → `note-magazine.mjs add-articles --key <mag> --commit` で束ね。
     - **残 36本** (resume): catalog で `status:"draft"` の stats47-note 27 + koumuin-claude-code 9。`npx tsx -e 'import {NOTE_ARTICLES} from "./.claude/scripts/note/catalog/index.ts"; console.log(NOTE_ARTICLES.filter(a=>a.status==="draft"&&a.r2Body!==false&&a.vertical!=="product-sales").map(a=>a.vertical+"/"+a.key).join("\n"))'` で残スラッグを列挙。1本 ~5分・実 Chrome 占有・Bash 10分上限で1回2本程度。resume 可 (published は skip)。
     - **注意**: `koumuin-shigoto-kouritsuka-ai`/`pinned-intro` は vertical/性質が特殊 → 個別判断。誤配置の旧ドラフト `ndd6577272515` は削除確認ボタンが取れず残存 → note.com で手動削除。browser-use は毎回 daemon kill + editor.note.com タブ close (`browser-use-cleanup.md`)。
  2. **誤 vertical 16 件の再評価 (済/残)**: D3配色の章5件は実在有料マガジン (¥500) の中身 → 帰属済。Claude Code 記事は koumuin 有料マガジンの member (membership 検証で確認)。note.com 上の別URL重複投稿3件 (災害SNS/苦情/FAQ) は削除判断 = オーナー領域 (残)。
  3. **未解決 22 件 (未公開ドラフトの英語キー)** をカテゴリ手当て or ドラフト整理。
  4. **新規投稿の増産**: カテゴリマガジンを受け皿に増やす。`sns-content-standards.md` の note 頻度上限 (月1-2本) の見直しが要る (別判断)。
- **完了条件**: 公開済み記事が note.com 上でマガジンに束ねられ、新規投稿が catalog のカテゴリマガジンに自動で割り当たること。記事一括変更しない (1 マガジンずつ実証)。
- **停止条件 / 承認境界**: note.com への実反映 (マガジン作成・記事割当・新規公開) は outward-facing。人手ログイン + オーナー承認を経てから。SSOT は catalog git TS、note.com は反映先。
- **なぜ blocked-local-runtime か (2026-08-17)**: 残る主工程 (1c の下書き36本投稿) が
  **browser-use + Chrome Profile 5 をオーナーのローカル Mac で占有する**ため、CI からは
  原理的に閉じられない。status が `pending` のままだと日次ループが拾って 3 回失敗し
  quarantine するだけになる (`ASP-CONTINUITY-01` で実際に踏んだ)。
  **catalog だけで閉じられる残り (1b の (b) 未公開ドラフト22件の整理 / 3. 未解決22件のカテゴリ手当て) は
  ローカル不要**なので、着手するときは別 ID へ切り出してループに戻す。
- 関連: [NOTE-CIRCULATION-CTA-01] (回遊/CTA の catalog 駆動)・`.claude/scripts/note/catalog/README.md`・`.claude/rules/sns-content-standards.md` §note

### [MIGRATION-FLOW-PHASE23-01] 人口移動 月次/年次 workflowの生成ステップ未実装

タグ: [種類:不具合] [実行:対話] [起票:2026-08-01] [領域:データ]

- **owner**: Claude Code
- **次**: `migration-flow-monthly.yml` のPhase 3 (highlight抽出・render) と `migration-flow-annual.yml` のPhase 2 (e-Stat取得・47県render・caption・staging copy) を実装し、実装できたcronだけscheduleへ戻す。
- **完了条件**: 生成ステップが `.local/r2/sns/migration-flow` を実際に作り、手動dispatchでR2 pushとIG投稿まで通ることをdry-runで確認したうえで `on.schedule` を復活させる。復活時は `docs/01_技術設計/06_自動化インベントリ.md` のschedule表へ戻す。
- **停止条件**: 生成が未実装のままscheduleを戻さない (毎月の確定failureに戻るため)。

### [KAKEI-EXPANSION-02] 家計調査2025 refreshと残品目

タグ: [種類:制作] [実行:ユーザー] [起票:2026-07-10] [領域:データ]

- **owner**: Claude Code
- **trigger**: e-Statで2025年年報の公表を確認できること。
- **次**: 既存697 metricの年次更新を先に行い、需要確認済みの中分類だけを第2弾へ追加する。
- **完了条件**: 既存metricの年次更新を検証し、需要確認済みの追加候補だけが小バッチの投入判断に到達する。
- **正典**: `.claude/skills/blog/draft-from-trend/reference/kakei-topic-catalog.md`

### [ACTIONS-EXPRESSION-INJECTION-01] workflow の式インジェクション残 11 件

タグ: [種類:不具合] [実行:ユーザー] [起票:2026-07-30] [領域:管理]

- **owner**: uruhayato373 (人間の PR でのみ着手できる)
- **★backlog-loop では閉じられない** (2026-08-17): 対象が `.github/` だけで、ループの verify は
  そこを**禁止パス**にしている（workflow を書き換えられると allowedTools・許可パス・timeout・
  モデルを自分で緩められるため）。status を pending のままにするとループが毎回 pick して
  `class-needs-pr` で skip し、枠だけを消費する。人間の PR で 3-4 本ずつ進める。
- **背景**: `${{ inputs.x }}` を `run:` の中へ直接展開している箇所が 11 件残っている (2026-09-24 に `improvement-log-reminder-weekly` の 2 件を workflow ごと削除)。dispatch できる者が任意コードを実行できる類型。private repo で dispatch 権限者は push もできるため実効的な権限昇格ではないが、衛生上の負債。
- **★この負債は現在 CodeQL に検出されていない** (2026-07-30 実測): `.github/workflows/security-scan.yml` の init は `languages: javascript,typescript` で、**workflow ファイル自体は走査対象外** (走査には `languages: actions` が要る)。PR #655 で出た CodeQL 3 件はこれとは無関係で、`.claude/scripts/` の `execSync(テンプレート文字列)` = `js/command-line-injection` だった (同 PR で argv 形式へ是正済)。**「CodeQL が出たら workflow の式インジェクション」と早合点しない** — 2 度誤診した。
- **対象**: `blog-auto-publish` / `blog-remediation-daily` / `fetch-metrics-weekly` / `migration-flow-weekly` (2) / `publish-ai-content` / `sns-weekly-report` (2) / `sync-snapshots` (3)
- **次**: 各 step に `env:` ブロックを足し、`run:` はシェル変数だけを参照する形へ書き換える (`data-refresh.yml` が手本)。併せて `languages` に `actions` を足すか判断する (足すと 11 件が一斉に critical で出るため、書き換えを先に済ませる)
- **完了条件**: 上記走査で 0 件、かつ actionlint exit=0
- **制約**: 1 PR で全 workflow を書き換えない (デプロイ経路の workflow が多く、壊すと配信が止まる)。3-4 本ずつに分け、変更した workflow は実際に 1 回発火させて確認する
- **2026-10-06 第 1 弾 (4 本・未発火)**: `fetch-metrics-weekly` / `migration-flow-weekly` / `sns-weekly-report` / `blog-remediation-daily` の `run:` 内の `${{ inputs.* }}` を step の `env:` 経由に書き換えた (計 6 か所)。actionlint 1.7.7 で exit 0。クラウドからは dispatch できないので、制約どおり各 workflow を 1 回発火させて確認するのは未実施。残りは `blog-auto-publish` / `publish-ai-content` / `sync-snapshots` (run 内 1 か所。他は既に env) の 3 本。

### [CHART-LINEAGE-RESIDUAL-01] 元データ喪失図表の手動系譜残件

タグ: [種類:不具合] [実行:対話] [起票:2026-08-12] [領域:データ]

- **owner**: Claude Code
- **CROSS-PAGE-DATA-SSOT-01からの分離 (2026-08-27)**: staged全量棚卸しで、現行のranking自動復元器が
  確証できる残件は0。非タイルマップの手動判断残件は93枚
  (unknown 41 / ranking 18 / line 23 / stacked 4 / scatter 5 / findings 2)。正確な対象は
  `data/blog/svg-lineage-queue.json` の
  `residualCard === "CHART-LINEAGE-RESIDUAL-01"` を正典とする。CROSS側はこれらを推測復元せず閉じる。
- **背景**: 公開散布図 102 枚のうち 24 枚が元データ (`<base>.json` / `.source.json`) を失い、
  gate の検証対象外だった (gate は「78/78 正準」と報告するが 24 枚を見ていない = 死角)。
  2026-08-12 に SSOT から **19 枚を復元** (33 軸を SSOT 照合・一致率 80% 未満 0 件・R2 反映済)。
  残り 5 枚は**指標を同定できない / SSOT に値が無い**ため、捏造せず flag した。
  ★ SVG のピクセル座標から値を逆算して data json にするのは禁止 (`blog-data-schema.md` §1.7)。
- **残り 5 枚と律速**:
  | slug/base | 律速 |
  |---|---|
  | `international-cooperation-volunteer-map/{travel,foreign-pop}-vs-volunteer-scatter` | 「国際協力ボランティア率」に該当する metric が SSOT に**存在しない**。e-Stat 側の表を特定して投入する必要がある |
  | `per-capita-income-gap/income-vs-industry-scatter` | Y 軸「1人当たり県民所得」の現行基準が `isActive:false` / 値未投入。`data/data-refresh-requests.json` で 2021 年度取り込みを要求済 (2026-08-12) |
  | `purchasing-power-adjusted/income-vs-price-scatter` | 同上 (X 軸が同じ指標) |
  | `foreign-residents-diversity-map/manufacturing-vs-foreign-scatter` | X 軸「製造品出荷額 1人当たり」の**算出式と年次を特定できない** (最有力候補でも一致率 67-72%) |
- **次**: ① 県民所得の取り込み結果を確認し 2 枚を復元 ② 国際協力ボランティア率の e-Stat 表を
  `estat-researcher` で特定 ③ 製造業の算出式は記事本文の記述から再構成できるか確認する
- **完了条件**: `chartType === "scatter" && status !== "both"` の非正準が 0 枚
  (測定: S3 実体を読む。公開 URL は `max-age=14400` で最大 4 時間古い)
- **禁止**: 一致率が足りないまま「だいたい合っている」で復元しない。復元できないなら記事から図を外す

- **タイルマップ側の残り 6 枚** (2026-08-12 実測。公開 120 枚中、元データを持つ 22 枚は
  現行 svg-builder で再生成し R2 反映済 = 正準 114/120):
  | slug/base | 現状 | 律速 |
  |---|---|---|
  | `per-capita-income-gap/income-map` | 600×665 | 県民所得の現行基準が SSOT 未投入 (散布図と同じ) |
  | `purchasing-power-adjusted/income-map` | 600×700 | 同上 |
  | `international-cooperation-volunteer-map/volunteer-rate-map` | 600×700 | 「国際協力ボランティア率」が SSOT に存在しない (散布図と同じ) |
  | `alcohol-prefecture-map/alcohol-consumption-map` | 600×690 | 指標・年次の同定が要る |
  | `food-consumption-prefecture-battle/ramen-gyoza-tilemap` | 960×520 | 2 指標の対比図。同定が要る |
  | `waiting-children-progress/waiting-children-map` | 600×690 | 指標・年次の同定が要る |
- **散布図とタイルマップで律速が重なる**: `per-capita-income-gap` / `purchasing-power-adjusted` /
  `international-cooperation-volunteer-map` の 3 記事は両方の図が同じ SSOT 欠落で止まっている。
  **指標を投入すれば 2 種類まとめて解ける**ので、この 3 記事を先に片付ける

### [GEO-SOURCE-PUBLISH-PERF-01] Geo原典の生成・公開時間を計測し、検証強度を保って待ち時間を減らす

タグ: [インフラ・計測] [種類:改善] [実行:対話] [検証:cd apps/web && npx vitest run scripts/geo-source-publish.test.ts] [起票:2026-09-13] [期日:2026-09-20] [領域:データ]

- **owner**: gis-pipeline-runner（生成・再開）／r2-publisher（公開契約）／devops-runner（CI）
- **状態・着手時期**: 実装未着手。今回の公開完了後、次回Geo原典更新前に計測・設計から着手する。期日は初回設計の確認期限。
- **実測根拠**: [Geo run 34726806521](https://github.com/uruhayato373/stats47/actions/runs/34726806521) の2026-09-13 UTCの準備は00:01:59〜00:44:28（42分29秒）、dry-runは00:44:28〜01:21:35（37分07秒）。apply/readbackは01:21:35〜04:03:28（2時間41分53秒）、runはsuccess。17,717件・stored 2,199,375,814 bytesを公開し全件のS3/公開query照合に成功。3フェーズ合計4時間01分29秒（job準備等を除く）。[アプリCI run 34731862870](https://github.com/uruhayato373/stats47/actions/runs/34731862870) は `8f66cb638` で01:58:36〜02:08:11（9分35秒）・success。再取得は `gh run view 34726806521 --repo uruhayato373/stats47 --json jobs`。
- **コード根拠・未計測部分**: `apps/web/scripts/geo-source-publish-core.ts` の `buildExactPlan`、dry-run preflight＋共有publisher、apply preflight＋共有publisher＋PUT後確認は、変更対象1件につき計6回のHEADを行う構造。共有処理は `packages/r2-storage/src/scripts/push-exact-r2-assets-core.ts`。`mapGeoSourceBatch` は4件固定バッチの全終了待ちで、`.github/workflows/geo-source-publish.yml` は準備・dry-runもglobal `r2-write` lock内に置き、楽天公開の待ち要因になる。対象コードのdevelop pushは全件再生成・公開を発火する。実API数・HEADや解凍の時間寄与・短縮率は未計測。
- **次（実行順）**: ①phase別の壁時間、件数、API種類別回数、最大同時数、転送bytes、lock待ちを記録し、今回runの終了値を比較元に固定する。②最大4件のworker poolで空き枠を継続利用し、失敗検出後の新規dispatch停止とin-flight完了待ちをテストする。③候補の重複解凍・HEADの整理を計測結果から選ぶ。④原典SHA＋生成コード＋schemaに結び付いた検証済み生成物の再利用・再開を設計し、失効条件と失効時の再生成を固定する。⑤コードpushは検証、公開は明示scopeのCIへ分離する。準備と書込lockの分離は、巨大artifactの保存・転送・復元時間と費用を含めて採否を決める。
- **保持する契約・停止条件**: 全scope検査を最初のPUTより前に完了し、ETag条件PUT、gzipとdecoded両方のSHA、S3とcache-bust付き公開HTTPの全件照合、catalog-lastを保持する。purge後のcanonical検証は索引51件＋50ページの代表GISを予定範囲として区別し、実行時の対象キー・件数を記録する。全GISのcanonical GET完了とは扱わない。変更分への同強度検証と定期全件監査は別契約として設計・検証し、後者を前者の代用にしない。scope漏れ、再利用の失効判定不能、異常後の新規dispatch、検証強度低下、転送込みの時間・費用悪化があれば採用を止める。現在のCIをcancel/rerunせず、今回リリースへの実装追加をしない。短縮率の予測を成果にしない。
- **完了条件**: 対象テストで並行上限4・失敗後停止・ETag変更・gzip/decoded不一致・scope漏れ・生成物失効・catalog順序の異常を拒否し、同一scope/bytesの比較可能なCIで全フェーズと待ち時間・API数・転送量の変更前後を残す。変更なし／一部変更／再開／全件監査の各経路で、必要な公開対象と同強度検証の取り落しがない。未採用案は実測理由を残し、実測短縮が確認できるまで高速化完了としない。
- **既存カードとの境界**: `SYNC-SNAPSHOTS-MANIFEST-CARRY-01` は一般snapshotのmanifest持ち越し、`BUILD-PERF-PHASE34` はアプリCI cache・型検査の重複が対象。本カードはGeo原典生成からexact公開・再開・書込lockまでを扱う。

### [SYNC-SNAPSHOTS-MANIFEST-CARRY-01] sync-snapshots の「差分 push」が CI では毎回フル push になる

タグ: [種類:不具合] [実行:対話] [起票:2026-08-17] [領域:管理]

- **owner**: `r2-publisher`
- **問題**: `diff-push-r2` は manifest (`.local/r2-manifest/`) と突合して差分だけ送る設計だが、
  manifest は runner ローカルなので CI では毎回空 (`マニフェスト記録済み: 0`)。結果
  **アップロード対象が常に全件**になる。run 32020891418 の実測で **14,033 件 / 24m44s**
  (9.45 files/s)、生成 33m07s と合わせて sync job は 58 分かかる。timeout 45 分では
  構造的に完走できず push が途中で打ち切られていた (是正済・timeout 120 分)。
- **次**: manifest を `actions/cache` で run 間に持ち越すか、R2 の ETag / SHA と突合して
  差分を出す。どちらを採るかは、cache の失効時に全件送りへ安全に degrade できるかで決める。
- **完了条件**: 連続 2 回の run で、2 回目の「アップロード対象」が全件でないことを実測する。
- **禁止**: push を速くするために検証や purge を削らない。差分判定を誤って
  **送るべきものを skip する**方が、全件送るより実害が大きい (stale 配信は 6 日間気づかれなかった)。

### [MINIMUM-WAGE-2026-01] 2026年度地域別最低賃金

タグ: [コンテンツ品質] [種類:制作] [実行:対話] [領域:データ]

- **owner**: open-data-curator
- **source**: GitHub #652
- **trigger**: 厚生労働省または各地方最低賃金審議会が2026年度の47都道府県別実額を正式公表したとき。
- **次**: 目安額ではなく正式決定額の一次資料を確認し、既存 `minimum-wage-by-region` の年次追加として扱う。
- **完了条件**: 47県の正式額・発効日・前年差を一次資料で照合し、既存keyのR2観測値を更新する。
- **禁止**: 中央審議会の目安額や新聞表を正式額として公開しない。

### [PREF-OFFICIAL-STATS-01] 47都道府県の公式統計入口から需要を抽出

タグ: [コンテンツ品質] [種類:制作] [実行:対話] [領域:データ]

- **owner**: open-data-curator
- **正典**: `packages/data-configs/src/prefecture-statistics-catalog/README.md`
- **次**: 各県ポータルを1巡し、複数県で反復する指標だけを、定義、単位、粒度、年次、一次出典付きで上の表へ追加する。
- **完了条件**: 47県を確認し、既存metricとの非重複と全国比較可能性を検証する。

### [INDICATOR-CANDIDATES-01] 指標候補キュー (P1/P2 検証済み)

タグ: [種類:制作] [実行:対話] [起票:2026-05-19] [領域:データ]

一次統計の実在、都道府県粒度、既存 metric との非重複を確認した候補だけを残す。
需要未確認の大量候補、取得失敗、重複は削除済みで、再調査は Git 履歴から行う。
`parse-backlog.cjs` が次の表を読む。`high` は既存テーマの欠測または需要が明確、`medium` は鮮度・特殊軸・導入先の追加判断が必要。

| priority | candidate_slug                     | category          | suggested_theme     | estat_stats_data_id | rationale                                                             | status  |
| -------- | ---------------------------------- | ----------------- | ------------------- | ------------------- | --------------------------------------------------------------------- | ------- |
| high     | outpatient-consultation-rate-total | socialsecurity    | healthcare          | 0004026105          | 患者調査2023 cat01=1,cat03=4。既存テーマに全傷病の外来受療率がない    | pending |
| high     | inpatient-consultation-rate-total  | socialsecurity    | healthcare          | 0004026105          | 患者調査2023 cat01=1,cat03=1。外来と対で医療アクセスを比較できる      | pending |
| high     | ambulance-dispatch-count           | safetyenvironment | healthcare          | 0000010111          | SSDS K1210、47県。救急搬送の基礎指標                                  | pending |
| high     | infant-mortality-rate              | socialsecurity    | healthcare          | 0003411730          | 人口動態統計2024、47県。既存healthcareの結果指標を補う                | pending |
| high     | average-household-members          | population        | population-dynamics | 0003414255          | 国勢調査2020 cdTab=1390、47県。人口動態テーマの世帯構造を補う         | pending |
| high     | working-age-population-ratio       | population        | population-dynamics | 0000010201          | SSDS #A03502、2024。年齢構造の基礎比率                                | pending |
| high     | juvenile-offenders-count           | safetyenvironment | safety              | 0000010111          | SSDS K4204、2023、47県。千人比は別calculated metricで扱う             | pending |
| high     | average-job-tenure                 | laborwage         | labor-wages         | 0003426933          | 賃金構造基本統計 cat04=01,cat03=01、47県                              | pending |
| high     | equivalized-disposable-income-gini | economy           | real-income         | 0003440743          | 全国家計構造調査2019表7-6、cat01=1（OECD新基準準拠）、47県・小数値   | pending |
| high     | nursing-home-count                 | socialsecurity    | aging-society       | 0000010210          | SSDS #J022011、2023、既存4指標と非重複                                | pending |
| high     | paid-nursing-home-count            | socialsecurity    | aging-society       | 0000010210          | SSDS #J02204、2023、47県                                              | pending |
| high     | life-time-use-series               | laborwage         | living-housing      | 0000010113          | SSDS生活時間。sleep/housework/mealsのcdCat01確定後に個別keyへ分割する | pending |
| medium   | household-head-average-age         | economy           | consumer-prices     | 0003348239          | 家計調査2024、県庁所在市52件。都道府県値と誤認しない表示設計が必要    | pending |
| medium   | fishery-species-catch-salmon       | agriculture       | fishery-marine      | 0003425253          | さけ・ます類、2019、cat01=100-150。鮮度を明示する                     | pending |
| medium   | fishery-species-harvest-nori       | agriculture       | fishery-marine      | 0003425258          | のり類養殖収獲量、2019。既存魚種テーマの欠測                          | pending |
| medium   | fishery-species-harvest-oyster     | agriculture       | fishery-marine      | 0003425257          | かき類養殖収獲量、2019。既存魚種テーマの欠測                          | pending |
| medium   | housing-seismic-retrofit-count     | construction      | safety              | 0004025509          | 住宅土地統計2023 cat03=15。「耐震化率」ではなく改修実施戸数として扱う | pending |

**投入手順** (完了した行は削除する):

1. `parse-backlog.cjs` で候補を選ぶ。
2. e-Statメタと代表値を再確認し、`metric-config-standards.md` と `data-provenance-standards.md` に従ってconfigを作る。
3. config validation、R2 snapshot生成、ranking item、KNOWN/sitemapの順で整合を取る。
4. 本番反映はユーザー承認後にまとめて1回行い、HTTP 200、年、単位、代表値を実測する。
5. 完了した行は削除する。

### [METRIC-SUBTITLE-KAKEI-NOTE-01] 家計調査系 706 metric の subtitle が調査方法の定型文で、一覧・h1 直下に冗長表示される

タグ: [コンテンツ品質] [種類:改善] [実行:対話] [検証:npm run validate:config --workspace=@stats47/data-configs] [起票:2026-09-16] [領域:サイト]

- **owner**: data-ingester (config 一括是正) / ranking-ui-manager (表示面の確認)
- 実測 (2026-09-16): `data/metrics/` の `kind: "kakei-chousa"` 706 件すべてが
  `subtitle: "都道府県庁所在市の二人以上世帯の年間{品目}消費支出額"` の形。`metric-config-standards.md` の役割表では
  subtitle は「同名指標を区別する短い定義補足」で、調査方法は `note` / `description` の責務。lint `subtitle-redundant`
  (`validate-metric-config.ts:250`) は「subtitle が title を包含」を真の識別子 (乳用牛(めす)) のために許容しているので、この定型文はすり抜ける。
- 表示への影響: ranking 右レールと関連ランキンググリッドは 2026-09-16 に UI 側で除外済み
  (`select-sidebar-items.ts` の `getSidebarDetail`: subtitle が title を含む場合は識別に使えないとして非表示)。**残っている面**:
  ranking 詳細の h1 直下 (`classifyRankingSubtitle` 経由)、category / survey / municipalities 一覧の `${title}（${subtitle}）` 連結
  (`app/category/[categoryKey]/page.tsx:184`、`app/survey/[surveyKey]/page.tsx:211`、`app/municipalities/**`) で
  「納豆消費支出額（都道府県庁所在市の二人以上世帯の年間納豆消費支出額）」の重複が出る。
- **次**: ①決定的スクリプトで 706 件の subtitle 定型文を `note` (「都道府県庁所在市の二人以上世帯・年間値」等の短文 1 種) へ移し、
  subtitle は null にする (同名衝突がある metric だけ短い識別子を残す)。②`validate:config` / `validate:years` を通す。
  ③`sync-snapshots` の `ranking-items` で item.json を再生成 (デプロイが先: `branch-workflow.md`「R2 反映は main のコードで動く」)。
  ④UI 側の暫定ヒューリスティック (`getSidebarDetail` の包含判定・`classifyRankingSubtitle`) はデータ側が揃ったあとに縮退を検討する。
- **停止条件**: 一括書き換えで `subtitle-redundant` 以外の lint error が増えたら止める。R2 反映とデプロイはオーナー承認後。
- **完了条件**: 家計調査系 config の subtitle 行に定型文が 0 件、category / survey 一覧のタイトルに定型文の括弧書きが出ない、
  ranking 詳細ではチャート下の note として表示される。

### [DATA-CONDITIONAL-INDICATOR-01] 家計調査のように対象が限られる指標（県庁所在地のみ等）を洗い出す
タグ: [コンテンツ品質] [種類:改善] [実行:対話] [起票:2026-09-27] [領域:データ]

家計調査は47都道府県ではなく県庁所在市のデータ。同じように条件付きの指標が他にもあるかを確かめ、ページ上の表記が条件どおりかを点検する。（出典: 2026-09-24 の手書きメモ・vault dairy/2026-09-24）

### [TAXONOMY-USAGE-01] 消費タクソノミー・地域タクソノミーが何に使われているかを確かめる
タグ: [エージェント・SSOT] [種類:改善] [実行:対話] [起票:2026-09-27] [領域:データ]

どの画面・スクリプトが参照しているかを洗い出し、使われていなければ整理の対象にする。（出典: 2026-09-24 の手書きメモ・vault dairy/2026-09-24）

### [ABOUT-PAGE-01] stats47 の About ページを作る（kazu-note にも流用できる形で）
タグ: [UI・UX] [種類:制作] [実行:対話] [起票:2026-09-27] [領域:サイト]

運営者・データの出典・更新方針を載せる。kazu-note でも使い回せる構成にするかを合わせて決める。（出典: 2026-09-24 の手書きメモ・vault dairy/2026-09-24）

### [GEO-UIUX-SPEED-01] Geo ページの UI/UX と表示速度を見直す
タグ: [UI・UX] [種類:改善] [実行:対話] [起票:2026-09-27] [領域:サイト]

操作のしやすさと表示速度の両方を実測してから直す。（出典: 2026-09-24 の手書きメモ・vault dairy/2026-09-24）

### [ESTAT-CATALOG-REVIEW-01] e-Stat カタログを確認する
タグ: [コンテンツ品質] [種類:改善] [実行:対話] [起票:2026-09-27] [領域:データ]

取り込めていない統計・更新が止まっている統計が無いかを見る。（出典: 2026-09-24 の手書きメモ・vault dairy/2026-09-24）

### [THEME-AREA-INDICATOR-CHECK-01] テーマ・エリアページの指標を点検する
タグ: [コンテンツ品質] [種類:改善] [実行:対話] [起票:2026-09-27] [領域:データ]

各ページに載せている指標の選び方と値が妥当かを見る。（出典: 2026-09-24 の手書きメモ・vault dairy/2026-09-24）

### [AFF-PLACEMENT-SCHEMA-REVIEW-01] アフィリエイトの設置ロジックとスキーマを確認する
タグ: [収益化] [種類:改善] [実行:対話] [起票:2026-09-27] [領域:アフィリエイト]

どの条件でどの広告を出しているか、構造化データ（スキーマ）が正しいかを確かめる。（出典: 2026-09-24 の手書きメモ・vault dairy/2026-09-24）

### [GSC-API-SCOPE-01] GSC の API でできること・できないことを整理する
タグ: [インフラ・計測] [種類:改善] [実行:対話] [起票:2026-09-27] [領域:管理]

API で取れる指標と画面でしか見られない指標を分け、自動化の範囲を決める。（出典: 2026-09-24 の手書きメモ・vault dairy/2026-09-24）

### [SURVEY-TAXONOMY-WIRING-01] 調査・出典のタクソノミーの配線を点検し、UI で直す
タグ: [エージェント・SSOT] [種類:改善] [実行:対話] [起票:2026-09-27] [領域:データ]

調査・出典のタクソノミーが画面まで正しくつながっているかを確かめ、ずれていれば UI 側で直す。（出典: 2026-09-25 の手書きメモ・vault dairy/2026-09-25）

### [CHART-AXIS-OVERFLOW-01] チャートの目盛りが画面外にはみ出し、テキストと重なるのを直す
タグ: [UI・UX] [種類:不具合] [実行:対話] [起票:2026-09-27] [領域:サイト]

目盛りのラベルが描画領域の外に出ている、または本文テキストと重なっているチャートを洗い出して直す。（出典: 2026-09-25 の手書きメモ・vault dairy/2026-09-25）

### [SIDEBAR-ACCENT-01] サイドバーにアクセントカラーを使うか、見出しタイトルを外すか決めて反映する
タグ: [UI・UX] [種類:改善] [実行:対話] [起票:2026-09-27] [領域:サイト]

doboku-note と同じ検討（両サイト共通の論点）。（出典: 2026-09-25 の手書きメモ・vault dairy/2026-09-25）

### [ESTAT-CATALOG-SSDS-DERIVE-01] `ssds-candidates.json` を e-Stat カタログから導出し、find-metrics に未登録候補の索引を足す

タグ: [インフラ・計測] [種類:改善] [実行:対話] [検証:node --import tsx .claude/scripts/estat/catalog.mjs search 人口] [起票:2026-10-05] [領域:データ]

- **経緯**: `ESTAT-CATALOG-01` の完了時 (2026-10-05) に残した手順 6。カタログは R2 `estat-catalog/manifest.json` で
  都道府県 5,884 表・市区町村 3,968 表の `metaPending` が 0、消費側 5 ファイルの配線と旧発見スクリプトの退役は済んでいる。
- **次**: git 内の `data/estat/ssds-candidates.json` を catalog の `index/tables/` から再生成する形に置き換え、
  find-metrics に「未登録の候補」を引ける索引を足す。読み手を `git grep ssds-candidates` で洗い出してから進める。
- **完了条件**: `ssds-candidates.json` が catalog 派生の生成物になり (手編集の入口が無い)、find-metrics で未登録候補が 1 件以上引ける。

### [AFF-RANKING-RAKUTEN-NATIVE-01] 家計調査系 ranking の本文 A8 を外し、中段を楽天カード (モバイル rakuten-native / デスクトップ furusato-native) へ置換する

タグ: [収益化] [種類:改善] [実行:対話] [起票:2026-10-05] [領域:アフィリエイト]

- 2026-10 月次計画で improvements から降格。再開条件: まとまりのデプロイでオーナーが本番反映を決めた時。反映後 4 週で `node .claude/scripts/ads/fetch-affiliate-ga4.cjs 28` を link_position 別に before/after (AFF-RESOLUTION-EFFECT-01 と窓が重なるため guard: confounded)。改善行を戻すときは `[kpi: affiliate-yield]` を付ける。
- ローカル実装済み・未デプロイ。baseline (GA4 28日 〜2026-08-28): 楽天商品カード右レール 424 imp / 0 click、中段 native A8 等 2,545 imp / 1 click。[target: rakuten-native+furusato-native 合計 imp ≥ 2,000/28日 かつ click ≥ 1]。

### [RANKING-REINDEX-01] 復帰 56 ranking (5 週連続 GSC imp 0) の coverageState を URL Inspection で確定し、未収録なら sitemap 再送信する

タグ: [インフラ・計測] [種類:改善] [実行:対話] [起票:2026-10-05] [領域:サイト]

- 2026-10 月次計画で improvements から降格。再開条件: 56 キーを明示指定した一回限りの URL Inspection を実行できる時。再送信のデプロイ日が確定したら 56 キーを列挙した `[gsc-page:]` と target を付けて improvements に戻す (`[kpi: search-clicks]`)。
- 2026-09-07 実測: 日次 URL Inspection の 251 キーに復帰 56 キーが 1 件も含まれない (500 件/日ローテーションが当たっていない)。

### [BLOG-SEO-TYPES-01] D2/F/G を含む記事型ポートフォリオの 4 週効果を既存 A 型と比較する

タグ: [コンテンツ品質] [種類:改善] [実行:対話] [起票:2026-10-05] [領域:サイト]

- 2026-10 月次計画で improvements から降格。再開条件: 公開 4 週以上の記事が各型 5 本以上になった時。topic-queue 経由で `gsc-query.mjs` の型別コホート比較で判定し、結果を gsc-improvement log へ記録する (`[kpi: search-clicks]`)。
- 2026-09-07 時点 topic-queue done 81 件 (A:29/B:12/D2:23/F:7/G:10)。大半が 4 週齢未満で比較は延期。効果判定エンジン対象外 (型別コホート比較)。
- **2026-10-04 の実測 (W40 の無人 triage が書いたが、Issue #1068 で push されず 10-05 に書き戻した)**: **2026-10-04実測**: `data/blog/topic-queue.json` (generatedAt 2026-10-04、gscWeek 2026-W40) の done は81件で、2026-09-06生成時の81件から増えていない。したがって done 81件はすべて公開から4週(28日)以上経過し、09-07時点の延期理由は解消した。ただしこのrunではGSC照会を実行していないため、型別のclicks・impressionsは未取得で、効果は判定していない。次: 2026-10-11までに done 81件のslugを型ごとに分け、`data/gsc/snapshots/2026-W40/pages.csv` のclicks・impressionsを型別に集計して比較する (型ごとの記事数が7〜29件と偏るため、合計だけでなく中央値とimp 0の記事数を併記する)。2026-10-11に比較できなければ、取得できなかった理由と再実行条件を詳細ログへ書く。**効果判定エンジン対象外**: 単一ページではなく型ポートフォリオのコホート比較のため、判定は上記の型別コホート比較で行う

- **2026-10-08 集計 (期日 10-11 の型別比較)**: topic-queue の done 81 本を `data/gsc/snapshots/2026-W37〜W40/pages.csv` (4 週 = 28 日) で型ごとに合計した。
  A 29 本: clicks 72・表示 3,564・中央値 7・表示 0 が 14 本。B 12 本: 29・885・34.5・2 本。D2 23 本: 5・36・0・**22 本**。F 7 本: 32・952・0・6 本。G 10 本: 50・1,185・16.5・5 本。
  表示 0 の本数は W40 の 1 週だけで数えても同じで、表示が少ないのではなく出ていない。保存済みの URL Inspection (`data/gsc/url-inspection/`、10-02〜10-08) では
  D2 の 20 本が「検出 - インデックス未登録」12・「URL が Google に認識されていません」6・「クロール済み - インデックス未登録」1・登録済み 1 (残り 3 本は未検査)。
  したがって D2 の差は記事型の効果ではなく、索引に入っていないことによる。型の効果は、索引に入った記事どうしでしか比べられない。
  **[仮説]** D2 は 09-01〜09-02 に 23 本を一度に出したため、Google が発見したまま巡回を後回しにしている。**検証**: `node .claude/scripts/gsc/url-inspection-daily.cjs` の日次 (500 件/日) が
  D2 の 23 本を含む回で状態を数え直す。**期日 2026-10-25**: その時点で D2 の過半が「検出 - インデックス未登録」のままなら、sitemap の lastmod と内部リンク (ランキングページから記事への導線) を調べる。
  索引に入った記事が型ごとに 5 本以上そろったら、型の比較をやり直す (再開条件は上のとおり)。

### [BLOG-SEO-QUEUE-01] topic queue 起点の記事が需要候補を正しく選び、公開後に検索表示を得たか確認する

タグ: [コンテンツ品質] [種類:改善] [実行:対話] [起票:2026-10-05] [領域:サイト]

- 2026-10 月次計画で improvements から降格。再開条件: BLOG-SEO-TYPES-01 と同時に、公開 4 週以上経過分で `gsc-query.mjs` のコホート比較を行う時 (`[kpi: search-clicks]`)。
- 2026-09-07 時点で queue done 81 件、BLOG-QUEUE-TRACK-01 の状態ずれは解消。効果判定エンジン対象外 (queue コホート集計)。
- **2026-10-04 の実測 (W40 の無人 triage が書いたが、Issue #1068 で push されず 10-05 に書き戻した)**: **2026-10-04実測**: `data/blog/topic-queue.json` (generatedAt 2026-10-04、gscWeek 2026-W40) の done は81件で、2026-09-06生成時から増えておらず、81件すべてが公開から4週(28日)以上経過した。標本・期間の条件は満たしたが、このrunではGSC照会を実行していないため、検索表示を得たかは未判定。次: 2026-10-11までに done 81件それぞれについて、`data/gsc/snapshots/2026-W40/pages.csv` のimpressionsが0か1以上かを数え、1以上の記事の割合とclicks合計を出す。選定時の `evidence.gscImp` (queueに保存されている需要側の値) と公開後impressionsを並べ、需要候補の選定が当たったかを見る。2026-10-11に比較できなければ、取得できなかった理由と再実行条件を詳細ログへ書く。**効果判定エンジン対象外**: 単一ページ前後比較ではなくqueue由来コホートの集計判定のため、判定は上記のコホート集計で行う

- **2026-10-08 集計 (期日 10-11 の需要候補の当たり外れ)**: done 81 本のうち 4 週 (W37〜W40) で表示が 1 以上あったのは 32 本 (40%)、clicks 合計 188・表示 6,622。
  選定時の需要 (`evidence.gscImp`、無ければ `areaImp`) が分かる 80 本を中央値 129 で 2 つに分けると、上半分 40 本のうち表示ありは 17 本、下半分 40 本は 14 本で、
  需要の大小と公開後の表示 (W40 の 1 週) の順位相関は 0.03 だった。ただし表示 0 の 49 本の多くは索引に入っていない (BLOG-SEO-TYPES-01 の URL Inspection の内訳) ので、
  「選定が外れた」のか「索引に入らず結果が出ていない」のかはまだ分けられない。索引に入った記事だけで同じ比較をやり直すまで、選定の当否は判定しない。

### [FUNNEL-CTA-01] ranking 末尾 CTA の click と遷移後行動を判定する

タグ: [UI・UX] [種類:改善] [実行:ユーザー] [起票:2026-10-05] [領域:サイト]

- 2026-10 月次計画で improvements から降格。再開条件: オーナーが 4 項目を登録し、登録後 4 週で標本が蓄積した時 (`[kpi: site-circulation-rate]`)。
- ブロッカー: GA4 カスタムディメンション `cta_id`/`content_id`/`target_type`/`target_key` が未登録 (2026-09-24 `npm run google-admin:audit-api`: confirmed-absent)。cta_click 自体が 28 日で 3 件 (insufficient-sample)。

### [AFF-BLOG-TEXTLINK-01] 本文内 text link と sidebar の CTR を比較する

タグ: [収益化] [種類:改善] [実行:対話] [起票:2026-10-05] [領域:アフィリエイト]

- 2026-10 月次計画で improvements から降格。再開条件: 2026-11-18 以降に比較期間を 8 週以上へ延ばして再判定できる時 (`[kpi: affiliate-yield]`)。
- 2026-09-24 実測 (GA4 28日・Japan): article-inline 4,761 imp/7 click (0.147%)、blog-sidebar 2,493/2 (0.080%)、article-end 764/1。全 position の click が 9 件で insufficient-sample。furusato 在庫欠損の懸念は解消済み。[target] 未設定。

### [AFF-A8-REGISTER-01] 追加 18 件のうち配信された案件を A8 確定成果と CTR で 4 週判定する

タグ: [収益化] [種類:改善] [実行:ユーザー] [起票:2026-10-05] [領域:アフィリエイト]

- 2026-10 月次計画で improvements から降格。再開条件: オーナーが A8 に再ログインした時。確定成果レポート取得後に 4 週判定する (`[kpi: affiliate-yield]`)。
- ブロッカー: A8 確定成果レポートの認証が 2026-09-21 から `auth_required` (`data/authenticated/latest.json`)。`AUTHENTICATED-MEASUREMENT-ACTIVATION-01` と同一ブロッカー。

### [BLOG-LINKROT-01] 内部リンク是正後の coverage とブログ→ranking 回遊を判定する (SITE-LINKROT-01 統合済み)

タグ: [コンテンツ品質] [種類:改善] [実行:対話] [起票:2026-10-05] [領域:サイト]

- 2026-10 月次計画で improvements から降格。再開条件: 是正デプロイ後に `internal-link-audit-weekly.yml` 最新 run で壊れ 0 を確認できた時。手順: soft 404 タイトル込みで壊れ 0 を検証 → STRICT smoke 200 → GSC coverage を前後比較 → 壊れは本文・生成設定・live 描画の三層に分類 (`[kpi: search-clicks, site-circulation-rate]`)。
- 2026-09-07 実測 (`data/site/link-audit.json`): 壊れリンク 6 件 (旧 key `academic-achievement-test-average-rate` 等)。`broken-link-remap.json` に置換先を追記して是正・デプロイが先。

### [STP-MESSAGE-ROLLOUT-01] ポジショニング文言を SNS プロフィール・OGP・サイト説明・note 導線へ展開し、例外を明示する

タグ: [SNS・マーケ] [種類:改善] [実行:対話] [起票:2026-10-05] [領域:サイト]

- 2026-10 月次計画で improvements から降格。再開条件: サイト領域の重点枠で着手できる時。外部プロフィール変更と本番反映はユーザー承認まで実行しない (`[kpi: search-clicks]`)。
- 実行記録なし (着手痕跡なし)。`docs/00_プロジェクト管理/03_マーケティング戦略.md` のポジショニングと照合して対象ごとに変更・維持・対象外を決める。UI の DOM・配置・色・余白は変えない。
- **2026-10-04 の実測 (W40 の無人 triage が書いたが、Issue #1068 で push されず 10-05 に書き戻した)**: **2026-10-04: 期日2026-09-21を13日超過した時点でも、`.claude/todo/` 配下でこのIDが現れるのは本行と実行手順節だけで、backlog・weekly・monthlyに着手の記録は無い** (Grepで確認、git履歴は未確認)。次: 実行手順1 (現在文言と更新方法の一覧化。読み取りだけで完結する) を2026-10-18までに行う。2026-10-18に手順1の結果が残っていなければ、このカードを判断待ちに回す。手順3のとおり外部プロフィール変更と本番反映はユーザー承認まで実行しない (改善施策からの降格は 10-05 の月次計画で済んでいる)

### [ASSET-POLICY-BURNDOWN-01] baseline 27 件の既存画像を、ユーザーが承認した範囲だけ圧縮・重複削除・再エンコードで削減する

タグ: [インフラ・計測] [種類:改善] [実行:ユーザー] [起票:2026-10-05] [領域:サイト]

- 2026-10 月次計画で improvements から降格。再開条件: オーナーが圧縮・再エンコードの範囲を承認した時 (`[kpi: site-health]`)。
- 2026-09-27 時点でユーザー承認の記録なし、進捗 0 件。

### [RANK-THIN-01] thin metric (観測年 1 年など) の noindex 基準を URL Inspection 実測から決める

タグ: [コンテンツ品質] [種類:改善] [実行:対話] [起票:2026-10-05] [領域:サイト]

- 2026-10 月次計画で improvements から降格。再開条件: 検索系の重点枠で着手できる時。実測が揃ったら基準を決めて improvements に target 付きで戻す (`[kpi: search-clicks]`)。
- 日次 URL Inspection (500 件/日) は稼働中だが、thin metric 抽出と基準検討は未着手 (2026-09-27 確認)。

### [STP-AI-WATCH-01] AI Overviews による雑学系流入の侵食を四半期で定点観測する

タグ: [インフラ・計測] [種類:改善] [実行:対話] [起票:2026-10-05] [領域:サイト]

- 2026-10 月次計画で improvements から降格。再開条件: 2026-10 の四半期観測枠。手順: S1 代表クエリを GSC finalized 期間で固定 → 重複しない期間の clicks/impressions/CTR/position を比較 → AI Overviews 表示有無が取れなければ「S1 CTR 低下の観測」に限定 → 対照群と比較し持続的低下のみ次候補を最大 3 件 (`[kpi: search-clicks]`)。
- 効果判定エンジン対象外 (S1 代表クエリ群と S2・S3 対照群の query 集合比較)。

### [DATA-FOOD-SELF-SUFFICIENCY-MAFF-01] 都道府県別食料自給率 (カロリーベース) を農水省の公表値から取り込み、2022 年度以降を足す

タグ: [コンテンツ品質] [種類:改善] [実行:対話] [起票:2026-10-05] [領域:データ]

- **経緯**: `DATA-QUALITY-LOOP-01` 第 2 週 (2026-10-05) で切り出した。`food-self-sufficiency-rate-calorie` は SSDS `I3301` 経由で 2008〜2021 年度だけを持つ (config・R2 とも各年 47 県で一致)。
  農水省「都道府県別食料自給率」(https://www.maff.go.jp/j/zyukyu/zikyu_ritu/zikyu_10.html) は令和 5 年度 (確定)・令和 6 年度 (概算) まで公表済みで、
  長期推移 xlsx (`attach/xls/zikyu_10-7.xlsx`) が 1998〜2024 年度を収録する。北海道 2008 年度の 210 は R2 と一致した (2026-10-05 確認)。
- **次**: 取得元を農水省の xlsx に切り替える (`fetcherKey: "manual"` か新しい取得経路)。`.claude/rules/data-provenance-standards.md` の provenance 9 点セットを先に書き、
  概算値と確定値の区別を年ごとに保持する。SSDS 由来の 2008〜2021 年度と重なる年は値の一致を検査してから置き換える。
- **完了条件**: 2022 年度以降が 47 県そろって R2 に入り、provenance が監査 (`/audit-provenance`) を通り、ランキングページの最新年が更新されている。

### [DATA-MEDICAL-FACILITY-SOURCE-01] 医療施設調査の 6 指標を原典の e-Stat の表から取り、2024 年以降を足す

タグ: [コンテンツ品質] [種類:改善] [実行:対話] [起票:2026-10-21] [領域:データ]

- **経緯**: `DATA-QUALITY-LOOP-01` ③ (2026-10-21) で切り出した。`psychiatric-bed-count` (GSC 表示 752) を含む 6 指標 (`psychiatric-bed-count`・`psychiatric-hospital-count`・`general-hospital-count`・`general-hospital-bed-count`・`general-clinic-count`・`dental-clinic-count`) は社会・人口統計体系 (SSDS) の医療施設調査の 6 項目 (`I510110`・`I510120`・`I5102`・`I5103`・`I521110`・`I521130`) から取っている。e-Stat の実在年の台帳 (`data/estat/availability/tables/0000010109.json`、CI が 2026-10-07 に取得) では 6 項目とも 2023 年で止まっている。原典の医療施設（動態）調査は令和7年 (2025) の概況を 2026-09-29 に公表済みで、令和6年分も公表されている (`https://www.mhlw.go.jp/toukei/list/79-1a.html`、2026-10-21 取得)。SSDS が 2024 年以降を取り込んでいないため、配信は公式の最新から 2 年遅れている。
- **次**: ① e-Stat の医療施設調査 (政府統計コード 00450021) の 2024 年の表 (候補: 「第4表 病院の病床数，年次・都道府県別」`0004048403`、2026-03-11 公開) の分類コードを e-Stat API の getMetaInfo で調べ、6 指標それぞれの項目と時点が SSDS と同じかを確かめる。この PC には e-Stat API の資格情報が無く (取得は CI 専用)、全国集計の表はローカルの表カタログにも分類が無いので、CI で任意の表のメタ情報を取る経路を作るか、資格情報のある端末で行う ② 一致したら 2024 年以降を `supplementalSources` で足す (漁業の指標と同じ形) ③ SSDS と重なる 2023 年は値の一致を検査する ④ data-refresh の dryRun → オーナー承認 → R2 反映。
- **停止条件**: 項目の定義や時点が SSDS と合わない年は足さない。R2 への反映はオーナー承認後。
- **完了条件**: 6 指標が公式の最新年まで 47 県そろって R2 に入り、ランキングページの最新年が更新されている。

### [DATA-FLOOD-STATS-FILES-01] 水害統計の 9 指標に 2015 年以降を足すかを決める (e-Stat のデータベースは 2014 年まで)

タグ: [コンテンツ品質] [種類:改善] [実行:対話] [起票:2026-10-21] [領域:データ]

- **経緯**: `DATA-QUALITY-LOOP-01` ③ (2026-10-21) で切り出した。`flood-affected-rivers` (GSC 表示 741) を含む水害統計の 9 指標は、e-Stat の「都道府県別水害被害（表－2）」`0003155647` から取っている。この表は 2006〜2014 年分しかなく (実在年の台帳、CI が 2026-10-07 に取得)、水害統計の e-Stat データベースの更新は 2022-10-04 が最後である (e-Stat のデータベース検索、2026-10-21)。国土交通省は令和5年水害統計まで公表している (令和6年分は公表が遅れていると明記。`https://www.mlit.go.jp/river/toukei_chousa/kasen/suigaitoukei/index.html`、2026-10-21 取得)。ランキングページは 2014 年の値を出している。
- 年カバレッジ監査は `flood-affected-rivers` を「設定 5 年 → e-Stat 実在 9 年」の要拡張候補にしている。ただし足りない 4 年 (2007・2009・2010・2013) は 44〜46 県しか値の無い年で、9 指標とも 47 県そろう年だけを設定に入れている。値の無い県は被害が無かった可能性があるが、0 として扱ってよいかは確かめていない。
- **次**: ① 2015〜2023 年の都道府県別の値が、どこに (e-Stat のファイル・国交省のページ) どの形で出ているかを確かめる ② 取り込むなら、取得元の切り替え (`fetcherKey: "manual"` か新しい取得経路) と provenance を先に設計する (`DATA-FOOD-SELF-SUFFICIENCY-MAFF-01` と同じ進め方) ③ 公表の「-」が被害なし (0) を意味するかを調査の注記で確かめ、47 県そろわない年の扱いを決める。
- **停止条件**: 「-」の意味を確かめずに 0 で埋めない。R2 への反映はオーナー承認後。
- **完了条件**: 取り込むか見送るかを決め、取り込む場合は 9 指標が公式の最新年まで R2 に入っている。

### [DATA-ROAD-LENGTH-SOURCE-01] 道路統計年報の 10 指標を最新の年報まで取り、年の表記を時点に合わせる

タグ: [コンテンツ品質] [種類:改善] [実行:対話] [起票:2026-10-21] [領域:データ]

- **経緯**: `DATA-QUALITY-LOOP-01` ③ (2026-10-21) で切り出した。道路実延長 7 指標 (`road-total-length`・`road-total-length-with-expressway`・`road-national-route-length`・`road-prefectural-route-length`・`road-general-prefectural-length`・`road-municipal-length`・`road-expressway-length`) と舗装道路 3 指標 (`paved-road-total-length`・`paved-road-main-length`・`paved-road-municipal-length`) は社会・人口統計体系 (SSDS) の `H71xx` から取り、すべて「2023 年度」で止まっている (`kiso_ken.xlsx` 2026-06-30 更新分の対象年度も 2023 まで)。開通日の分かる 2 区間の増え方から、SSDS の「2023 年度」は 2023 年 3 月 31 日時点 (道路統計年報 2024 年版) と分かった (根拠は `DATA-QUALITY-LOOP-01` の 2026-10-21 の記録)。国土交通省の最新は 2025 年版 (2024 年 3 月 31 日時点) で、配信は 1 年古い。
- **年の表記**: 配信は「2023 年度」と表示し、`road-total-length-with-expressway` は「3月31日現在」と注記している。この 2 つを合わせて読むと 2024 年 3 月 31 日の値に見えるが、実際は 2023 年 3 月 31 日の値である。
- **次**: ① 道路統計年報 2025 年版 (表 2 道路現況総括表・表 3 道路実延長内訳の総括表など。国交省のページは xlsx だけ) から 2024 年 3 月 31 日時点の都道府県別の値を取り込むか、SSDS の次の更新を待つかを決める。取り込むなら取得元の切り替えと provenance を先に設計し (`DATA-FOOD-SELF-SUFFICIENCY-MAFF-01` と同じ進め方)、SSDS と重なる年は値の一致を検査する ② 年の表記を時点に合わせるか (例: 「2023 年 3 月 31 日現在」)、注記を直すかをオーナーが決める。10 指標と SEO タイトルに効くので一括で行う。
- **停止条件**: 年の表記は、オーナーが決めるまで変えない。R2 への反映はオーナー承認後。
- **完了条件**: 10 指標が最新の年報の時点まで R2 に入るか、待つと決めて理由が書かれている。年の表記が時点と食い違わない。

### [DATA-LAYOUT-MOVE-01] 置き場を data/<取得元>/ へ移した後、定期実行が新しい置き場へ書くことを確かめる

タグ: [エージェント・SSOT] [種類:改善] [実行:対話] [検証:npm run check-datasets] [起票:2026-10-06] [進行中] [領域:管理]

- **済み (2026-10-06)**: 移動は 2 段階とも main まで反映した (`npm run check-datasets -- --moves` が 0 行)。第 1 段階は PR #1086、
  第 2 段階 (`.claude/state/` をエージェント運用の状態だけに絞る) は PR #1088。置き場の区分・`.claude/state/` の許可リスト
  `AGENT_STATE`・移す手順は `.claude/rules/data-storage.md`。第 1 段階は develop から main まで 12 時間空き、Instagram・Threads・
  認証付き計測の 3 run が記録を落とした (前 2 つは run のログから補った。認証付き計測の 15:57 UTC の 1 回分は欠けたまま)。
- **確認済みの書き込み**: PSI 日次 (`data/psi`)・Cloudflare 日次 (`data/cloudflare`、保持期間の削除も)・SEO キーワード (`data/seo`)・
  認証付き計測 (`data/authenticated`)。
- **次**: 次の定期実行が新しい置き場に書き、旧置き場に書いていないことを、run の commit-back の差分で確かめる。
  日次: GSC URL 検査 (`data/gsc/coverage-remediation`・`data/gsc/url-inspection`)・Instagram 投稿 (`data/sns/ig-posted-log.jsonl`・
  `data/sns/posts.json`)・Threads 確認・AI 解説 (`data/ai-content`)・workflow 健全性 (`data/ci`)・backlog-loop (`data/gsc`・`data/page-quality`)。
  週次: 土曜の page-quality・内部リンク・出典・ランキング整合・e-Stat 年カバレッジ、日曜の `fetch-metrics-weekly` (`data/` 全体) と
  search-growth・affiliate GA4、月曜の improvement-cycle。
  オーナーの Mac / Windows の launchd ジョブ (SNS・A8) は `git pull` 後に新しい置き場へ書く。
- **済み (2026-10-07)**: 作業カード・文書・memory の旧パス 82 か所を直し、旧パスの検査を履歴以外の全 Markdown へ広げた。
  コードの `data/` 直書き 231 ファイル・500 か所を `datasetPath(id)` / `datasetDir(id)` に置き換え (値が一致する箇所だけを
  構文木で機械置換)、`check-datasets` が新しい直書きを止める (例外は `DATA_LITERAL_EXEMPT` に理由付き)。
- **未決**: SEO の日次系列 (`data/seo/rank-history/`・`selections/`) の保持期間 (`prune-state-snapshots.test.mjs` に「保持期間は未決」で宣言)。
- **完了条件**: 上の日次・週次の定期実行がすべて新しい置き場へ書いた (期日 2026-10-13)。

### [ESTAT-YEAR-AVAILABILITY-01] e-Stat の実在年を data/ の台帳で管理し、設定の years を「除外だけ」にする
タグ: [インフラ・計測] [種類:不具合] [実行:対話] [起票:2026-10-07] [領域:データ]

- **症状**: 有効な e-Stat 指標 1,535 件のうち 652 件の `years` に穴がある (604 件は「最初のまとまった年 + 飛んで最新年」の形)。
  2026-10-07 に 604 件から 12 件を抜き取って e-Stat と照合し、10 件で設定の範囲内に実在する年が抜けていた
  (例: 客室稼働率 e-Stat 2009〜2024 年 47 県に対し設定 2009〜2014・2024、地方債現在高 e-Stat 48 年に対し設定 13 年)。
- **原因 (git 履歴と移行前のスクリプトで確認)**:
  ① D1 時代 (〜2026-05) の取り込みが年を欠いた: 新規指標は `ingest-indicator.mjs` で最新年だけ、全年の取り直し
  (`backfill-stats-prefecture.cjs`) は優先指標だけ、取り直しの失敗で年が消えた例もある (復元スクリプト `restore-from-r2-cache.cjs` の注記)。
  ② 2026-05-28 の D1 → R2 移行 (`ba298ec5a`) で `export-from-d1.ts` の `detectYearSpec` が「D1 にあった年」から `years` を生成し、穴を固定した。
  ③ 今も `page-data-batch.ts` の `inYearRange` が設定にない年を捨てるので穴が再生産され、年カバレッジ監査
  (`listSingleYearEstatCandidates`) は登録年 1 年の設定しか見ない。`{from,to}` の `to` を延ばす仕組みも無く、新しい年が出ても捨てる (抜き取り 12 件では未発生)。
  根本は `years` 1 つに「e-Stat にある年 (事実)」と「見せないと決めた年 (判断)」を混ぜ、両者を区別できないこと。
- **設計 (2026-10-07 オーナーと合意した方向)**:
  ① 実在年の台帳 `data/estat/availability/tables/<statsDataId>.json` を e-Stat から生成する (取り出し条件 1,526 通りごとに年 × 値のある都道府県数・取得日。
  表全体の `time` 一覧は指標の年と一致しないので getStatsData の非 null で数える。表の更新日が変わった表だけ週次で取り直す)。
  ② 設定は理由付きの除外だけを書く。③ 取り込みと `years` の読み手は「台帳 − 除外」を 1 つの関数で使う。④ 台帳に新しい年が出たら再取り込みを積む。
- **第 1 段 (2026-10-07 実装・PR #1093、未マージ)**: `npm run build:estat-availability --workspace=@stats47/data-configs` が台帳と
  `data/estat/availability/{LATEST.md,diff.json}` を作る。県の値を e-Stat から取り込む有効な metric 2,221 件 (143 表・2,219 条件・取得失敗 0) で、
  取り込み忘れ 438 件 (テーマで使う 102)・新しい年 26・e-Stat に無い年 40・範囲より前にも年がある 739・差分なし 1,273・`years:"all"` 53・重複行 1
  (`convenience-store-sales`、`timeScope` 未指定)。手で確かめた客室稼働率・簡易宿所数は報告と一致。R2 照合 5 件で、穴はそのまま配信されている
  (客室稼働率 7 年・人口増減率 1 年) こと、「e-Stat に無い年」の年は R2 にも無い (設定だけが主張している) ことを確認した。
  「e-Stat に無い年」は年の問題より取り出し条件の問題が多い (職業別年収 22 件は設定 2010 年〜だが条件 0003445758 は 2020 年〜、
  人口増減率・65 歳以上割合は設定の国勢調査年が今の条件に無い)。
- **第 2 段 (2026-10-07 実装・PR #1094、#1093 の上に積んだ draft)**: `years` は残し、事実 (台帳) と判断
  (新しい `yearExclusions`、理由付き) に分けた。規則 `resolveLedgerYears` で `sync-estat-years.ts` が `years` を合わせ、
  PR CI (`Metric Years Gate`) が `--check` でずれを止め、週次 `estat-year-coverage-audit-weekly.yml` が台帳を取り直して新しい年を足す。
  移行で 894 件を書き換えた (年を足す 759: 穴 438・新しい年 26・1 年だけの設定の古い年 317 / 値の無い年を外す 40 /
  未判断の除外を引き継ぐ 422)。一部の県だけの年 (95 件が配信中) は機械では変えない。dry-run 10 件が形状ゲートを通過。
- **追加 (2026-10-07・PR #1094 に同梱)**: 市区町村の値も台帳に載せた (171 件・表 21。years は県の値で決めるので報告だけ:
  設定の年に値が無い 68・設定に無い年に 9 割以上の値がある 34)。台帳を取り直すと表のメタ情報の控え (`data/estat/meta/`) も取り直し、
  控えの無かった 88 表を足して 163 表すべてに控えがある。市区町村プロフィールが config の最新年をそのまま使い、cities.json に
  その年が無い指標 (23 件) を落としていたので、値がある最新の年を使うよう直した。ページへの配線の残りは `YEARS-DOWNSTREAM-FOLLOW-01`。
- **次**: ① PR #1094 は 2026-11-06 の d56 観測の後にマージする (マージ後最初の毎月 5 日の `data-refresh.yml` で 759 件に年が入り、
  テーマで使う指標の推移が変わるため)。② LATEST.md の「未判断の除外」422 件を見て、根拠があれば reason を書き換え、無ければ除外を消して
  `npm run sync:estat-years --workspace=@stats47/data-configs` で年を戻す。③ 単年の旧監査 (`audit-estat-year-coverage.ts` と
  `YEAR-COV-*` の自動起票・`assert-year-coverage-batch.ts`) は一部の県だけの年の判断にしか使わなくなったので、backlog-loop との
  つながりを外して廃止するかを決める。④ 市区町村の値 (`cities.json`) も台帳に載せるかを決める。
- **禁止**: 確かめていない年を設定に書かない。外す年を `years` から手で消さない (`yearExclusions` に理由付きで書く)。R2 の再取り込みを承認なしに行わない。
- **完了条件**: PR #1094 がマージされ、本番の R2 で客室稼働率が 2009〜2024 年の 16 年分を配信し、`LATEST.md` の 4 分類が 0 件のまま週次で保たれ、未判断の除外が 0 件になる (`years` は手で書く許可リストではなく台帳から機械で合わせる列にした)。
- **関連**: `THEME-SINGLE-YEAR-CARDS-01` (単年カード 287 枚の多くはこの穴が原因)、`YEAR-COV-*` の自動起票 (第 2 段で台帳の差分に置き換える)。

- **#1094 を取り込むときの注意 (2026-10-08)**: develop で物価地域差指数 12 指標に 2025 年の補完 (`supplementalSources`、yearFormat を calendar に変更) と、魚種別漁獲量 12 指標に 2016〜2018・2023 年の補完を入れた (c8281131a)。#1094 のブランチは物価 9 指標の `years.from` を 2013 に広げる差分を持つが、develop では既に 2013〜2025 になっている。衝突したら develop 側 (補完つき) を残す。

### [YEARS-DOWNSTREAM-FOLLOW-01] 指標の年が増えたあと、AI 解説・ブログ・計算型 metric・年固定の比較カードが古い年のまま残るのを直す
タグ: [コンテンツ品質] [種類:不具合] [実行:対話] [起票:2026-10-07] [領域:サイト]

- **背景**: `ESTAT-YEAR-AVAILABILITY-01` で years を台帳から合わせると (PR #1094)、R2 の取り込み後に 759 件の年が増え、うち新しい年が出た指標は
  最新年が変わる。2026-10-07 に配線を調べた結果、ランキング (`generate-ranking-items.ts` / `generate-ranking-values.ts` が観測行を years で絞る)・
  テーマの推移図 (`fetch-db-chart-data.ts` が values.json を直接読む)・テーマの指標カード (`item.latestYear`)・エリアのデータブック
  (`area-profile` task)・市区町村ランキングは、毎月の `data-refresh.yml` の全件実行で追従する。追従しないのは次の 4 つ。
  ① ランキングの AI 解説 (FAQ・県別解説): 生成時の年を本文に焼き、キュー (`build-ai-content-queue.mjs` の `classify`) は監査に通れば
  `done` にして最新年と比べないので、新しい年が来ても作り直されない。② ブログ: 本文・図・data JSON は書いた時点の年
  (`fetch-ranking-data-r2.mjs`) のまま、本文中の `<source-link>` カードだけ最新年を出す (`/api/ranking-card/[rankingKey]`) ので、
  1 本の記事に 2 つの年が並ぶ。検査 (`article-factual-check.mjs`) は記事内の data JSON とだけ比べる。③ 計算型 metric: sync-snapshots の
  `ranking-items` が `calculated-stats` より先に走るので、`item.latestYear` が 1 回分遅れる (`run.sh`)。④ テーマの年固定の比較カード
  (`comparisonYear`): 新しい年が来ても固定のまま (設計どおりだが、単年の延長で推移を描けるようになった指標もある → `THEME-SINGLE-YEAR-CARDS-01`)。
- **実装 (2026-10-07・PR #1095 / #1096、draft)**: ① AI 解説はキューが解説の yearCode と values の最新年を比べ、違えば
  `needs-regen` (reason `stale-year`) に戻す (初回実測で GSC 流入 1,504 件中 43 件)。③ `calculated-stats` を `ranking-items` の前へ移した。
  ② ブログは blog snapshot に記事が使う指標と図の年 (`rankingRefs`) と逆引き `rankingArticleIndex` を焼き、日次で図の年が古い記事を
  `data/blog/stale-data-years.{json,md}` に出す (次の sync-snapshots の blog task から有効)。同じ索引で、ランキング・テーマ・エリア・ブログを
  「同じ指標を使う」関係で互いにつないだ (#1096。第四分類軸ではなく参照関係として `03_情報設計.md` に節を足した)。
- **実装 2 (2026-10-07・PR #1097、draft、#1096 の上)**: ② ブログは `refresh-article-data-years.mjs` が `kind: ranking` の図
  (data JSON が fetch-ranking-data-r2 の形) を最新年で data・source・SVG まで作り直し、本文で古い年を書いた行を出す。
  是正キューに `data-refresh` レーン (must-fix の次) を足し、brushup の focus `最新データ更新` を取り直し → 本文 → critic の手順にした。
  意図して古い年を描いた図は source.json の `yearPinnedReason` で外す。④ テーマの `comparisonYear` は起点の年とし、
  全指標に値がそろう R2 の最新年 (`availableYears`) へ実行時に進める。実測: 公開 609 記事・図 1,596 枚のうち自動で取り直せる形が 959 枚、
  今の本番で図の年が古いのは 21 記事・24 枚。
- **2026-10-09 確認**: #1095・#1096・#1097 は 2026-10-07 にマージ済み (`ced09d767` / `d781bf064` / `c541e9447`)。上の「draft」は当時の状態。
- **次**: ① (マージは済み) sync-snapshots の blog task 後に `stale-data-years.md` の件数・
  キューの `data-refresh` 件数・ランキングの関連記事を確かめる。② data-refresh レーンを `/brushup-blog --target queue` (focus `最新データ更新`) で
  消化する。2026-10-07 に今の本番で図の年が古い 21 記事・24 枚を本文と照らした振り分け (年を固定すべき図は 0 枚):
  - 図だけ取り直す (本文は新しい年を語る食い違い): `fiscal-health-50years-trend`・`fiscal-self-reliance-gap` (2022 年度の節に 1989 年の地図)
  - 出典ファイルの年だけが誤り (data は本文と同じ年): `consumer-price-regional-gap` (source 2021・data 2024 = 最新。取り直すと source が直るだけ)、
    `cc-estat-03-population-bar` (source 2023・data 2024。最新は 2025 なので下の書き直しも要る)
  - 図を作り直す (説明と中身が違う): `healthy-life-expectancy-male-female-gap` の `healthy-life-expectancy-female-prefecture-rankings`
    (alt は男女の散布図、中身は男性の棒グラフ。自動で取り直さない)
  - 取り直して本文も書き直す (記事ごと古い年): `ai-claude-code-pref-analysis`・`area-ratio-prefecture-gap`・`cc-estat-02-search-skill`・
    `cc-estat-04-aging-heatmap`・`cc-estat-13-agri-sankey` (図の alt だけ 2024 年になっている)・`cc-estat-20-publish`・
    `dairy-cattle-hokkaido-monopoly`・`dairy-cattle-count` (2018 → 2025。タイトルも年を含む)・`engel-coefficient-vs-prefectural-income`・
    `health-life-expectancy-structure`・`it-industry-concentration` (タイトルも年を含む)・`physical-therapist-annual-income-prefecture-gap`
    (2023 年は順位が大きく入れ替わり結論から書き直し)・`real-disposable-income-reversal`・`school-teacher-annual-income-prefecture-gap`・
    `sixth-industry-direct-sales`・`vacant-housing-vs-aging`。手順解説 (cc-estat・ai-claude-code) は本文に引用した AI の出力例の数値も直す
  ③ 年が 1 年だけのカードを推移へ戻すかは `THEME-SINGLE-YEAR-CARDS-01` で扱う (比較カードの年は追従するようになった)。
- **完了条件**: 新しい年が R2 に入った翌週に、AI 解説が新しい年で作り直しの対象になり、古い年のブログ記事が一覧と是正キューの
  data-refresh レーンに出て、計算型のランキングが 1 回の data-refresh で新しい年を表示し、テーマの比較カードが新しい年を描く。

### [THEME-SINGLE-YEAR-CARDS-01] 1 年分しかない指標のカード 287 枚を、年の拡張か年固定の比較カードへ振り分ける
タグ: [コンテンツ品質] [種類:改善] [実行:対話] [検証:npx vitest run packages/data-configs/src/theme-catalog/__tests__/selection-viewpoints.test.ts] [起票:2026-10-07] [領域:データ]

- **背景**: 管理画面 `/quality/theme-viewpoints` の視点 `single-year-as-trend` で、2026-10-07 時点 46 テーマ 287 枚のカードが
  1 年分の指標だけを持ち、推移を描けない (カードには「単年データのため推移グラフはありません」と出る)。
  多くは metric config の `years` が最新年だけに絞られた分で、年カバレッジ監査の要拡張候補 (`data/estat/year-coverage/LATEST.md`、
  2026-10-03 時点 193 件) と重なる。その候補は `YEAR-COV-*` カードで 10 件ずつ処理しているが、テーマのカードに出る指標を先に回す仕組みが無い。
- **次**: ① 287 枚の指標を年カバレッジ監査の結果と突き合わせ、「e-Stat に複数年ある (years を広げる)」「本当に 1 年だけ
  (comparisonYear の比較カードにまとめる)」「未確認」に分ける。② 広げる分は `YEAR-COV-*` の処理順でテーマのカードに出る指標を先にする
  (`sync-year-coverage-backlog.mjs` の並べ方を変えるか、テーマ別の提案で個別に扱うかを決める)。③ 比較カードにまとめる分は
  テーマ別の提案 (`theme-proposal-format.md`) で扱う。
- **禁止**: 確認していない年を `years` に書かない。R2 の観測値の再取得とデプロイは別の承認で行う。
- **完了条件**: `/quality/theme-viewpoints` の `single-year-as-trend` の件数が、振り分け ① の「本当に 1 年だけ」の件数以下になっている。
- **① の結果 (2026-10-08)**: 視点と同じ判定関数で数え直すと 44 テーマ 281 枚 (287 枚との差 6 枚は、10-07 の観光・物価の提案の実装で年固定の比較カードにした分と外した分)。270 指標を次の 3 つに分けた。根拠は年カバレッジ監査 (`data/estat/year-coverage/queue.json`、北海道 1 県の標本) と、e-Stat の実在年の台帳 (未マージのブランチ `claude/estat-availability-ledger` の `data/estat/availability/tables/`、全県の値の有無) で、両方にある 70 指標はすべて一致した。
  - **e-Stat に複数年ある: 63 指標・69 枚**。63 指標とも、台帳に合わせて years を広げる uruhayato373/stats47#1094 (draft、#1093 の上に積んだ第 2 段) のブランチで既に複数年になっている。#1094 のマージで 69 枚が視点から外れる見込み。#1094 は本文で 11-06 のテーマ実験の観測の後のマージを勧めている。
  - **本当に 1 年だけ: 62 指標・65 枚**。54 指標は国勢調査・経済センサス・社会生活基本調査・住宅・土地統計調査・就業構造基本調査など、調査回ごとに表が分かれる統計の 1 回分。前の回が別の表にあるかは未確認。
  - **未確認: 145 指標・147 枚**。すべて `source.kind: external` (manual 142・ssds 2・mlit_ksj 1) で、監査も台帳も見ていない。44 指標は e-Stat のダウンロードファイルを出典にしている。
- **次 (更新)**: ② #1094 のマージ後に件数を数え直す。③ 65 枚は前の回の表を確かめ、無ければ年固定の比較カードへの提案 (`theme-proposal-format.md`) にする。147 枚は external の出典を指標ごとに確かめる (件数が多いので、テーマのカードに出る指標から順に `YEAR-COV-*` と同じ 10 件ずつで回す)。
- **関連**: 年の穴の根本対応は `ESTAT-YEAR-AVAILABILITY-01`。そちらの第 1 段の差分報告を ① の振り分けに使う。

### [SEO-META-FROM-VALUES-01] ランキングの seoTitle / seoDescription に観測値を直書きするのをやめ、値から生成する
タグ: [インフラ・計測] [種類:改善] [実行:対話] [検証:npm run validate:config --workspace=@stats47/data-configs] [起票:2026-10-07] [領域:サイト]

- **GSC案30 / P2（次に着手）**: title・本文・観測値の年/単位/分母を一致させ、最新年と調査年、全国値と県単純平均を区別する。blogの混合年はBLOG-SEOTITLE-MIXED-YEAR-01へ接続し、同じ修正を二重起票しない。観測値由来の必須是正とCTR目的の文言実験を分け、後者の一括置換はしない。
- **背景**: metric config 2,606 件のうち 1,915 件の `seoTitle` / `seoDescription` が「1位東京都（113,685,917百万円）」のように
  1 位の県と値を直書きしている (2026-10-07 実測)。builder はこれをそのまま `item.json` に焼くので、年を広げたり値を取り直したりするたびに
  検索結果の文言が古い値のまま残る。`audit-seo-meta-facts.ts` は食い違いを見つけるだけで直さない。
- **次**: ① 直書きの型を分類する (年・1 位・最下位・倍率)。② builder (`build-ranking-item-from-metric.ts`) が R2 の値から
  同じ型の文言を作る関数を用意し、config には値を含まない雛形か上書きだけを残す。③ 既存 1,915 件を一括で雛形へ置き換え、
  検索結果の文言が変わる件数を事前に出してオーナーの承認を取る (タイトルの変更は検索順位に影響しうる)。
- **禁止**: 承認前に R2 の item.json を一括で書き換えない。
- **完了条件**: config の `seoTitle` / `seoDescription` に観測値を含むものが 0 件になり、item.json の文言が最新の値と一致する。
- **実例 (2026-10-08)**: 物価地域差指数 12 指標に 2025 年を補ったあとも、本番の `/ranking/consumer-price-difference-index-overall` のタイトルは
  「【2024年】｜1位東京」のまま (2024 年の値としては正しいので `audit-seo-meta-facts.ts` は通る)。魚種 12 指標は今回手で 2023 年に書き直した。
  値から生成すれば、年を広げるたびにこの手作業は要らなくなる。

### [FISHERY-SPECIES-REFRESH-01] 魚種別漁獲量を図に使うブログ 4 本を 2023 年のデータで取り直す
タグ: [コンテンツ品質] [種類:改善] [実行:対話] [検証:node .claude/scripts/blog/build-stale-data-years.mjs] [起票:2026-10-06] [領域:データ]

- **背景**: 魚種別漁獲量 12 指標は 2023 年まで延び (uruhayato373/stats47#1111)、fishery-marine に「主な魚種と産地」の章ができた (uruhayato373/stats47#1112)。
  一方、魚種の指標を図に使うブログ 4 本は 2015 年の図のまま。2026-10-08 にローカルで `build-stale-data-years.mjs` を回すと、4 本とも「図 2015 年・最新 2023 年」で出た:
  `bonito-catch-prefecture` (GSC 2026-W40・28 日で 5,880 表示。カツオ関連の検索の主な着地)・`bonito-catch-zero-prefectures-gap`・
  `fish-catch-vs-consumption-prefecture` (マグロ・ブリ)・`fishery-species-prefecture-specialty` (ホタテ)。
- **次**: ① 日次の blog-remediation-daily が 4 本を是正キュー (`data/blog/remediation-queue.json`) の data-refresh レーンに入れたかを確かめる。
  10-08 02:25Z のキューは魚種データの取り込み前に作られたので、`bonito-catch-prefecture` は opportunity レーンのまま。
  ② `refresh-article-data-years.mjs` で図を 2023 年で作り直し、本文の年と数値を書き直して critic を通す (/brushup-blog の最新データ更新)。
- **禁止**: 2019〜2022 年は e-Stat に表が揃っていないので、2018 → 2023 の空白を線でつないで連続した推移に見せない。海のない 8 県を 0 として順位に入れない。
- **完了条件**: 4 本が `stale-data-years.json` から消え、本番の記事が 2023 年の値を出す。
- **進捗 (2026-10-08)**: 4 本とも 2023 年で書き直した。カツオ漁獲量の記事は critic の BLOCK (タイトルが理由を断定) で「カツオ日本一が静岡と宮城で割れる理由」に改題したため、
  公開済みの AI 背景 (しかも主題と無関係な書類かばんの絵) が stale になり、quality-gate が背景で止める。自動公開はこの 1 本だけを skip し、送り箱に残る。
  **公開 (2026-10-08)**: 残りの 3 本 (fish-catch-vs-consumption-prefecture・bonito-catch-zero-prefectures-gap・fishery-species-prefecture-specialty) は
  blog-auto-publish run 263・264 で 2023 年版が公開され、本番で 200 を返す。outbox に残るのは bonito-catch-prefecture だけ。
  **残り**: Codex が使えるセッションで `npm run blog-images:codex -- request-article --slug bonito-catch-prefecture --article contents/blog/bonito-catch-prefecture/article.md`
  (/generate-blog-images の Mode A) で記事固有背景を作り、quality-gate の pass を確かめて develop へ push する。姉妹記事の背景は使い回さない (同 skill の規約)。

### [MANUAL-METRIC-YEARNAME-01] 手動取得の指標の年表記に「年」「年度」が付かず、e-Stat 由来の指標と表示が揃わない

タグ: [コンテンツ品質] [種類:不具合] [実行:対話] [検証:npm run -s validate:config --workspace=@stats47/data-configs] [起票:2026-10-08] [領域:データ]

- **2026-10-21 完了 (行削除は backlog-loop)**: オーナー承認 (同日チャット) のうえ、手動取得の 13 スクリプトを再実行して `.local/r2/app/stats` に書き、公開 R2 と 1 ファイルずつ照合した: R2 にある 31 件で値・単位・順位・県名・meta (recipe の configHash 含む) が全件一致し、違いは 29 件の yearName だけ (例: 2022→2022年度・2024年10〜11月→2024年)。その 29 key だけを `push-exact-r2-assets.ts --key` で反映し (dry-run で 29 件のみを確認してから)、読み戻して一致を確認した。続けて `sync-snapshots` を `only=ranking-values` と同じ 29 key で起動し (run 39543006825・success)、`app/ranking/<key>/values.json` の yearName が全 29 件で「YYYY年 / YYYY年度」になったことを確認した。`students-requiring-japanese-instruction` は R2 に未公開の指標なので対象外 (新規公開になるため)。ランキングページは R2 を読むオンデマンド ISR なので、キャッシュの切れ目 (最長 1 日) で表示が切り替わる。
- **経過 (コード)**: 共通の書き手 `stats-values-writer.mjs` の yearName の既定を、指標の yearFormat から「YYYY年」(calendar・未宣言)・「YYYY年度」(fiscal) を作る `yearNameFor` に変えた (yearFormat は新しい境界 `print-metric-year-format.ts` で正典から引く。テスト 1 件)。書き手を通らない 3 本 (中体連・パチンコ店密度・日本語指導) の固定の "2025" も年 / 年度付きに直し、国民健康・栄養調査は調査期間 (10〜11月) が既に note にあるので既定の「2024年」にした。他の手動スクリプトに年だけの yearName は無い (`yearName: "YYYY"` などの書き方で検索)。data のテスト 12 件・型検査通過。**残り**: 手動取得の全スクリプトを再実行して R2 の values.json を書き直す (R2 への書き込みなのでオーナー承認待ち。値が変わらないことを再実行前後で照合する)。
- **事象 (2026-10-08 実測)**: e-Stat 経由の指標は `app/stats/<key>/values.json` の `yearName` が「2024年」だが、手動取得 (`fetcherKey: manual`) の指標は「2022」のように年だけになっている。今回の新規 20 本に加え、既存の中体連 10 本・遊技店密度も同じ。国民健康・栄養調査の 3 本は「2024年10〜11月」で、これも形が違う。data-refresh の検査は ranking 配信値の `yearName` を `yearCode + 年/年度` と照合しているので、手動取得の指標をその経路に載せると失敗する。
- **原因**: 共通部品 `.claude/scripts/data/lib/stats-values-writer.mjs` の `writeStatsValues` が `yearName` の既定を `(y) => y` にしている。指標定義の `yearFormat` (calendar / fiscal) を見ていない。
- **次**: writer が `yearFormat` から「年」「年度」を付けるようにし、手動取得の全スクリプトを再実行して R2 を更新する。調査期間を示したい表記 (10〜11月) は `note` に移す。
- **停止条件**: 値そのものを変えない (再実行前後で value の一致を確かめる)。
- **完了条件**: 手動取得の全指標で `yearName` が `yearCode + 年/年度` に揃い、ランキングページの年表示が e-Stat 由来の指標と同じ形になる。

### [GEO-LOW-ELEV-MANIFEST-SHA-01] 標高の低い土地の Geo 分析の manifest が SHA 照合の対象外になっている

タグ: [インフラ・計測] [種類:改善] [実行:対話] [検証:npm run -s geo:audit-low-elevation] [起票:2026-10-08] [領域:データ]

- **事象**: `population-low-elevation` の `manifest.json` は、Python 生成器の整数風キーの並び順が JS の `JSON.stringify` と違うため、Web 側の再直列化 SHA 照合から外されている (2026-10-08 に Geo 担当の subagent が報告。item と pref は照合対象)。
- **次**: 生成器 `packages/gis/src/geo-analysis/low-elevation-population-overlay.py` の manifest 出力を JS と同じキー順にし、Web 側の照合対象に manifest を戻す。
- **完了条件**: manifest も SHA 照合され、キー順を崩した manifest を監査が拒否することを変異で確かめた。

### [PERF-THEME-HTML-SIZE-01] テーマページの HTML を目安 900KB に収める (新テーマ household-food-spending は 2.9MB)

タグ: [インフラ・計測] [種類:改善] [実行:対話] [起票:2026-10-08] [領域:サイト]

- **観測 (2026-10-08、Googlebot UA・CDN パージ後)**: `/themes/household-food-spending` の HTML は 2,917,296 bytes、`/areas/<県>/household-food-spending` も約 2.93MB (47 ページ)。
  既存の最大は `/themes/healthcare` 1,607,344 bytes、`sports-participation` 800,776、`consumer-prices` 477,891。基準は `.claude/skills/analytics/performance-improvement/page-quality-budgets.json` の
  `html_bytes` 900,000 (warning)。初回 (キャッシュ無し) 応答は 10.6 秒、2 回目は 0.13 秒。
- **[仮説]** 指標 136 件と、`comparisonYear` を持つ 30 グループの値をサーバー描画で HTML に埋め込んでいる。検証: HTML 内の RSC payload を指標キーごとに数え、グループ数を減らした版をローカルで測る。
- **関連**: Workers CPU の増加調査 `CF-CPU-SURGE-01` の候補「テーマ拡充で 1 ページが重くなった」と同じ現象。
- **完了条件**: 新テーマと healthcare の HTML が 900KB 以下、または目安を超える理由と新しい基準を page-quality-budgets.json に記録する。

### [BLOG-FISCAL-YEAR-LABEL-REGEN-01] 年度の指標なのに図の見出しが「YYYY年」になっている公開済み 193 記事を作り直す

タグ: [コンテンツ品質] [種類:不具合] [実行:対話] [起票:2026-10-09] [領域:データ]

- **観測 (2026-10-09)**: `fetch-ranking-data-r2.mjs` を年度対応にした (`81c0e4af9`)。直す前に作られた data JSON 858 件のうち 296 件 (193 記事) が、年度の指標なのに見出しが「YYYY年」。
  同じ固定が `.claude/scripts/blog/regenerate-tile-maps.ts:213` と `:248` (`${best.year}年`) にも残る。
- **2026-10-09 済**: ① regenerate-tile-maps の見出しを `ranking-year-label.mjs` の `yearLabelOf` で決めるようにした。
- **次**: ② 296 件の data JSON と図を作り直し、ブログの公開経路 (contents/blog → CI → R2) で出す。
- **完了条件**: 年度の指標を使う公開記事で、図の見出しが「YYYY年度」になっている (件数を再集計して 0 件)。

### [KAKEI-CLASSIFICATION-INCOME-SHEET-01] 家計調査の収支項目分類で「1収入」シートの品目を 11 件しか拾えていない

タグ: [コンテンツ品質] [種類:不具合] [実行:対話] [検証:npm run estat:kakei-classification:test] [起票:2026-10-09] [領域:データ]

- **観測 (2026-10-09)**: 「1収入」シートは見出しと項目名が H/I 列にある行があり、`build-kakei-classification.mjs` は G 列しか見ない。
  あわせて、分類番号を持たない見出し (「鮮魚」「食事代」など) は番号を作らず、品目範囲 (例「170～189」) を code にし `codeKind: "range"` で区別した (`66e39568e`)。この方式でよいかを確認する。
- **完了条件**: 「1収入」シートの品目を公式 Excel の行数どおりに拾い、テストで固定している。

### [CI-R2-WRITE-PENDING-REPLACED-01] R2 書き込みの workflow を続けて起動すると、待機中の run がジョブ 0 件のまま取り消される

タグ: [インフラ・計測] [種類:不具合] [実行:対話] [起票:2026-10-09] [領域:管理]

- **2026-10-21 完了 (行削除は backlog-loop)**: 起動側の手順を全部直す代わりに、必ず気づく側を選んだ (起動は skill・agent・proxy に散っていて共通の入口が無いため)。`workflow-health-core.mjs` に `findSupersededDispatches` (r2-write の手動起動で、`cancelled` かつジョブ 0 件、直近 48 時間、後に同じ workflow の手動起動の成功が無いもの) を足し、`audit-superseded-dispatches.mjs` が `group: r2-write` の 18 workflow を見る。`workflow-health-daily.yml` の新しい step が結果を cron ヘルスの Issue (`ci-health-alert`) に載せ、残っている間は Issue を閉じない。テスト 1 件 (拾う・後の成功・ジョブあり・窓の外・schedule)。実データで直近 400 時間に当てると、10-08 の `generate-ogp-images` run 37738579394 (ranking-cards) を検出した。10-09 の sync-snapshots の分は後の成功で取り戻し済みとして出ない。自動の再起動はしない (取り消された run の入力を API から取れないため)。main へ入ってから効く。
- **事象 (2026-10-08〜09 に 2 回)**: `concurrency: group: r2-write` (`cancel-in-progress: false`) の workflow は、実行中 1 本のほかに待機を 1 本しか持てず、
  後から来た run が待機中の run を取り消す。手動で起動した run がジョブ 0 件で cancelled になった: generate-ogp-images の ranking-cards
  (run 37738579394、後発は他セッションの sync-snapshots)、sync-snapshots ranking-items (run 37770625093、後発は blog-auto-publish)。
  起動した側には失敗に見えず、結果を確かめないと反映漏れが残る。
- **次**: 消費型の依頼ファイル経由の起動に寄せるか、起動側の手順書・スクリプトに「conclusion が cancelled かつジョブ 0 件なら再起動する」を入れるかを決める。
- **完了条件**: R2 書き込みの run を続けて起動しても、取り消された run が自動で再実行されるか、起動側が必ず気づく。

### [CI-SKIPCI-HEAD-BLOCKS-PR-01] 自動コミットが develop の先頭に積まれるたびに develop→main の PR の必須検査が外れる

タグ: [インフラ・計測] [種類:改善] [実行:対話] [起票:2026-10-09] [領域:管理]

- **事象 (2026-10-09)**: PR #1113 で、検査中に blog-auto-publish の outbox 掃除と、cloudflare・psi の日次計測の commit-back (いずれも skip-ci 指定) が
  develop の先頭になり、必須の Code Quality Check が head に付かず BLOCKED になった。マージまでに実コミットを 3 回 push し直した。
  仕組みは `.claude/rules/branch-workflow.md` に書かれているが、対策は手作業のまま。
- **次**: ① commit-back が先頭になったら同じ head で必須検査を起動し直す workflow ② 必須検査を直前の非 skip-ci コミットの結果で満たす判定
  ③ commit-back を別ブランチへ集める、のどれを採るかを決める。
- **完了条件**: commit-back が先頭に積まれても、手で push し直さずに develop→main の PR をマージできる。

### [JAPAN-SERIES-KAKEI-01] /japan の全国時系列の生成器を家計調査に対応させ、止めている 55 指標を載せる

タグ: [コンテンツ品質] [種類:改善] [実行:対話] [起票:2026-10-09] [領域:データ]

- **観測 (2026-10-09)**: 参考文献由来の /japan 候補 66 件のうち 55 件は家計調査の品目で、全国値はあるが
  `packages/stats-r2/src/scripts/generate-japan-series.ts` の official モードが `source.kind=kakei-chousa` に未対応 (`verify-japan-candidates.ts` で verified-unsupported)。
  `data/source-inventory/placement-decisions.json` に blocked として記録してある (外部取得の農業産出額・計算型のエンゲル係数の 2 件も同じ理由)。
- **次**: 生成器に家計調査のレシピ (全国の行) を足し、値レベルで検証してから japan-catalog.ts へ載せ、placement-decisions.ts の該当行を消す。
- **完了条件**: 55 件が /japan に載るか、載せないと判断して placement-decisions.ts に rejected と理由が残る。

### [JAPAN-CANDIDATE-CLASSIFY-CRASH-01] classify-japan-candidates.ts が今の live-audit の形式で TypeError で止まる

タグ: [エージェント・SSOT] [種類:不具合] [実行:対話] [起票:2026-10-09] [領域:データ]

- **2026-10-21 完了 (行削除は backlog-loop)**: 判定を `packages/data-configs/src/geo-scope/japan-candidate-classify.ts` の純粋関数へ移し、params と hasNational を持つ旧形式の e-Stat 監査行だけを全国行の証拠として索引する (R2 監査行は飛ばす)。証拠の無い e-Stat 指標は `unknown-no-audit-entry` とし、`verify-japan-candidates.ts` がそれも実 e-Stat 取得で判定する (`VERIFY_TARGET_CLASSIFICATIONS`)。実行: 963 件 (非 e-Stat 355・証拠なし 608) を exit 0 で出力し、verify `--limit 1` で ratio-65-plus を verified-official と判定。テスト 2 件 (`__tests__/japan-candidate-classify.test.ts`)・data-configs / stats-r2 の型検査 0。
- **観測 (2026-10-09)**: `npx tsx packages/data-configs/scripts/classify-japan-candidates.ts` が `r.params` で TypeError。
  `data/themes/charts/live-audit.json` (2026-10-05 監査) が kind/metricKey だけの R2 監査の形になり、params / hasNational を持たないため。
  今回は全国行の存在確認を `verify-japan-candidates.ts` の e-Stat 応答で代用した。
- **完了条件**: 分類スクリプトが今の形式で動き、全国行の有無を判定できる (テストで固定)。

### [AREA-NATIONAL-AVG-SIMPLE-MEAN-01] 県データブックの「全国平均」が 47 県の単純平均で、全国=100 の指数や率の指標では誤った値になる

タグ: [コンテンツ品質] [種類:不具合] [実行:対話] [起票:2026-10-09] [領域:サイト]

- **2026-10-21 完了 (行削除は backlog-loop)**: compareNationalAvg を付けた指標はテンプレートに 2 つ (1人当たり県民所得・有効求人倍率) で、どちらも単純平均が全国値と違っていた (2022 年度の有効求人倍率は全国 1.31・単純平均 1.39、2021 年度の 1 人当たり県民所得は全国 3,330 千円・単純平均 2,996 千円。R2 の `app/japan/<key>/series.json` と `app/stats` から実測)。exporter が同じ年の公式の全国値を使い (`national-comparison.ts` の `resolveNationalComparison`。都道府県の合計から作った全国値は平均ではないので使わない)、無ければ単純平均を `nationalAvgKind: "prefecture-mean"` として焼き、画面 (`RankedKpiGrid`) は「全国」/「47都道府県平均」と書き分ける。テスト 3 件、型検査 0、area-databook-standards.md の記述も更新。R2 の databook.json は main へ入ったあとの再生成で切り替わる (それまでは旧版で、欄が無いので「47都道府県平均」と表示される)。
- **観測 (2026-10-09・反証レビュー)**: `packages/area-profile/src/exporters/area-databook-snapshot.ts` 80-82 行は nationalAvg を 47 県の単純平均で出す。
  物価地域差指数 (全国=100) に compareNationalAvg を付けると「全国平均 99.0」(住居は 93.1) と出る。今回の採用分では外したが、
  既存の compareNationalAvg 付き指標にも、全国値が県の平均と違う率の指標が含まれていないかは未確認。
- **次**: 全国値 (00000) がある指標はそれを使い、無い指標は表示しないか「47 県の平均」と書く。既存の compareNationalAvg 付き指標を棚卸しする。
- **完了条件**: 全国平均として出る値が全国値と一致するか、47 県の平均であることが画面に書かれている。

### [JAPAN-METRIC-UNIT-AND-RATIO-01] /japan で意味を持たない昼夜間人口比率と、合計特殊出生率の単位「人」を直す

タグ: [コンテンツ品質] [種類:不具合] [実行:対話] [起票:2026-10-09] [領域:データ]

- **2026-10-21 経過**: 昼夜間人口比率は R2 の全国値 5 年分がすべて 100 で全国時系列として意味を持たないので、`japan-catalog.ts` から外し `placement-decisions.json` に rejected で記録した (市区町村のカタログには残す)。content:sync・metrics:build-index で ID 索引と指標の使用先を作り直し、preflight:pr 通過。**残り**: 合計特殊出生率は e-Stat の単位が「‐」(単位なし) で、全国時系列の生成器はプレースホルダの単位を安全側で拒否する設計 (`build-japan-series.ts`)。直すには表示単位を決める必要がある (「人」のまま生成器に単位なしとの対応を宣言するか、単位を表示しない形にするか)。オーナーの判断待ち。R2 に残る `app/japan/day-time-population-ratio/series.json` はページから参照されなくなる (削除は R2 の保持ポリシーの手順で別に行う)。
- **観測 (2026-10-09・ワークフローの検証)**: /japan に載っている `day-time-population-ratio` は全国では常に 100 (`app/japan/day-time-population-ratio/series.json`)。
  `data/metrics/total-fertility-rate.ts` の unit が「人」だが e-Stat の単位は「‐」で、/japan の生成器が単位不一致で拒否する。
- **次**: 昼夜間人口比率を /japan から外すか判断する。合計特殊出生率の unit を出典の定義に合わせて直し、/japan に載せ直す (placement-decisions.ts の blocked 行を消す)。
- **完了条件**: 上の 2 件が直り、/japan に意味のない系列が残っていない。

### [CORRELATION-SNAPSHOT-YEAR-ALIGN-01] 相関 snapshot が年の違う値どうしを組み、統制変数も別の年を使っている

タグ: [コンテンツ品質] [種類:不具合] [実行:対話] [起票:2026-10-09] [領域:データ]

- **観測 (2026-10-09・ブログ執筆のワークフロー)**: 農業産出額 (2024 年) と農業就業人口 (2014 年) の組で r=0.762 をランキングページの「相関が高い指標」に出している (同じ年の 2014 年でそろえると 0.758)。
  核家族世帯割合 × 昼夜間人口比率 (2020 年国勢調査) の偏相関は、統制変数に 2025 年の総人口を使っている (`build-correlation-snapshot.ts` の `loadMetric` が統制変数だけ最新年を使う設計に見える)。
- **次**: ペアを作るときに年をそろえるか、年が違うことを画面と snapshot に書く。統制変数の年をペアの年に合わせる。
- **完了条件**: 相関 snapshot の各ペアと統制変数の年が一致するか、食い違いが表示されている。

### [METRIC-DAYTIME-RATIO-DUP-01] 昼夜間人口比率の指標キーが 2 つ並存している (day-time-population-ratio / daytime-population-ratio)

タグ: [コンテンツ品質] [種類:不具合] [実行:対話] [起票:2026-10-09] [領域:データ]

- **2026-10-21 完了 (行削除は backlog-loop)**: `day-time-population-ratio` (社会・人口統計体系・2000〜2020 年の 5 年・市区町村の値あり・人口動態テーマと市区町村カタログが参照) を正にし、`daytime-population-ratio` (国勢調査 2020 年の 1 年だけ) を統合した。2020 年の 47 県の値は両者で全件一致 (±0.05) を R2 で確かめた。後者は GSC W41 で週 302 表示あるので消さずに 301 (`RANKING_SLUG_REDIRECTS`) で前者へ送り、config を `isActive: false` にした。KNOWN・sitemap・ranking-prominence・content の ID 索引・survey taxonomy を作り直し、taxonomy の下限は理由と対象キー付きの `rankingBaselineFollowUps` で 2372→2371 に下げて回帰テストで連鎖を固定した。preflight:pr・ranking の survey テスト 67 件・web 全テスト (環境由来の 1 件を除く) 通過。相関 snapshot は次の再計算で片方だけになる。本番は未デプロイ。
- **観測 (2026-10-09)**: 両方が相関 snapshot に別行で出る。ブログでは day-time-population-ratio を使った。どちらを正とし、もう一方を統合 (301) するかを決める。
- **完了条件**: 片方に統合され、相関・テーマ・ブログの参照が 1 つのキーにそろっている。

### [BLOG-DATA-EXEC-CODE-RULE-01] ブログの data/ に再現用の実行コードを置いてよいかを決めて規約に書く

タグ: [コンテンツ品質] [種類:意思決定] [実行:対話] [起票:2026-10-09] [領域:サイト]

- **観測 (2026-10-09)**: `household-structure-daytime-population-gap/data/sensitivity-calc.mjs` が、本文の追加計算 (除外ごとの相関・偏相関・乱数の種) を再現するために置かれた。
  `blog-data-schema.md` は禁止も許可もしておらず、先例はこの 1 件。critic は規約違反ではないと判断した。
- **判断すること**: data/ に置くのは JSON の中間結果だけにするか、実行コードも許すか。許すなら置き方 (名前・R2 へ上げるか) を決める。
- **完了条件**: `blog-data-schema.md` に置き方が書かれている。

### [R2-LOCAL-ROOT-UNIFY-01] r2-storage の listFromR2・deleteFromR2 のローカル経路を writeR2Staging と同じルート解決にする
タグ: [インフラ・計測] [種類:改善] [実行:対話] [検証:npx vitest run packages/r2-storage] [起票:2026-10-10] [領域:管理]

- **事象**: 2026-10-10 に書き込み (`writeR2Staging`) はリポジトリ直下の `.local/r2` に固定したが、`list.ts`・`delete.ts` のローカル経路 (`NODE_ENV=development` かつ S3 資格情報なしのとき) は `findLocalR2Root()` でカレントディレクトリから既存の `.local/r2` を探し、無ければその場を見る。書いた場所と読む・消す場所が実行場所によってずれうる。`packages/r2-storage/README.md` の「環境検出」節も現在の判定 (`detect-environment.ts`) と合っていない。
- **trigger**: ローカル経路の list / delete を使う作業が出たとき、または r2-storage を次に触るとき。
- **次**: `write-staging.ts` のルート解決を共通関数に切り出して list / delete から使い、`find-local-r2-root.ts` を消す (`push-r2-wrangler.ts` も同じ関数へ)。README の環境検出節を `detectEnvironment()` の実際の条件に直す。
- **完了条件**: `findLocalR2Root` の参照が 0 件、r2-storage のテストと `npm run type-check` が通る。

### [DATA-SOURCE-NEWS-TOPICS-01] 新聞記事から拾った統計ネタ 3 件 (国勢調査確定値・日銀短観・DV 相談) を企画に回す
タグ: [SNS・マーケ] [種類:制作] [実行:対話] [起票:2026-10-10] [領域:SNS]

- **trigger**: 週次の SNS・ブログの題材選び (`/sns-weekly-plan`・`/plan-article-queue`) のとき。
- **元**: GitHub Issue の運用規則 (機能改修・バグ・自動アラートだけ) から外れていた `data-source` ラベルの Issue を 2026-10-10 に閉じてここへ移した。詳細と原本の場所は各 Issue に残っている。
  - #1071 2025 年国勢調査の確定値 (総人口 317 万人減・高齢化率 29.4%)。都道府県別の増減率・高齢化率の地図 2 枚
  - #1072 日銀短観 9 月 (景況感 6 期連続改善)。県別の業況判断 DI が 47 そろうかは要調査
  - #816 DV 相談件数 (兵庫 1 万 8774 件・5 年ぶり増)。内閣府の都道府県別件数を人口 10 万人あたりで地図化
- **完了条件**: 3 件それぞれ、投稿・記事にしたか見送ったかが決まり、このカードを消している。

### [DEPS-DEPENDABOT-GROUP-01] dependabot の next・sharp の更新を、ルートの overrides と同じ PR で上げる
タグ: [インフラ・計測] [種類:改善] [実行:対話] [起票:2026-10-10] [領域:管理]

- **trigger**: 次に dependabot が next または sharp の更新 PR を作ったとき (それまでは [DEPS-OVERRIDES-DRIFT-GATE-01] の検査が食い違いを止める)。
- **事象**: 2026-10-10 は next の更新が 2 本 (#1102 ルート・#1117 apps/web)、sharp が 1 本 (#1087) に分かれ、どれもルートの overrides を上げなかった。
- **手順**: `.github/dependabot.yml` で next・sharp を `groups` にまとめる。dependabot が overrides を書き換えない場合は、更新 PR に overrides を足す手順を `/deploy` の依存更新の節に書く。
- **完了条件**: 次の next / sharp の更新が 1 本の PR になり、overrides も同じ版に上がっている。

### [SNS-LEDGER-ID-RACE-01] 投稿台帳の id を CI とローカルが同時に採番して衝突する経路を塞ぐ
タグ: [SNS・マーケ] [種類:不具合] [実行:対話] [検証:npm run sns:trace:check] [起票:2026-10-10] [領域:SNS]

- **trigger**: 台帳の id 衝突がもう一度起きたとき。
- **事象**: 2026-10-10 のリリースで、IG cron (CI) が `data/sns/posts.json` に新しい行を id 1076 で足した。同じ時期にローカルでも 1076 以降の行を追加していたため、マージで衝突した (行単位の 3-way マージで解消)。store の採番は手元の台帳の最大 id + 1 なので、別々の場所で同時に足すと必ず重なる。2026-07-07 の id 575 重複と同じ原因。
- **緩和済み**: Instagram は予約表の登録時に id を決める形にした (`register-ig-schedule.cjs`)。CI が新しい行を作るのは、予約表に無い投稿を記録するときだけになった。
- **手順 (案)**: CI が書く行は採番せず、ローカルで登録済みの id だけを更新する。登録の無い投稿は CI では記録を保留し、検査で知らせる。どうしても足す場合は、id の範囲を CI とローカルで分ける。
- **完了条件**: CI の workflow が新しい id を採番する経路が 0 本になり、`sns:trace:check` に検査が入っている。


### [DATA-SHUKUHAKU-CORRECTION-01] 宿泊旅行統計の 2026 年分を足すときに、層化基準の変更による系列の断絶を書く
タグ: [コンテンツ品質] [種類:改善] [実行:対話] [起票:2026-10-08] [領域:データ]

- **trigger**: 社会・人口統計体系の `0000010107` (G7101〜G7103) か `0000010207` (#G04308) に 2026 年の値が載ったとき。
  観光庁「宿泊旅行統計調査」のページ (`https://www.mlit.go.jp/kankocho/tokei_hakusyo/shukuhakutokei.html`) によると、
  2026 年 1 月分から層化基準が従業者数から客室数に変わった。
- **次**: 4 指標の `years.to` を 2026 にするときは、系列の断絶を metric config の `note` と観光テーマの「客室稼働率と宿泊供給の参考」章の説明に書く。
  社会・人口統計体系が引き続き「従業者数10人以上の施設」の値を収めるかを、e-Stat の項目定義 (`https://www.e-stat.go.jp/koumoku/koumoku_teigi/G`) で確かめてから書く。
- **2026-10-08 済み (正誤表との照合)**: 正誤表 (令和 7 年 8 月 26 日) の年間値の数値の訂正は 2024 年の福島県の日本人・外国人の内訳だけで、合計は変わらない。
  訂正の対象は観光庁が公表する全施設 (従業者数10人未満を含む) の推計値で、社会・人口統計体系の 4 項目は「従業者数10人以上の施設の結果」なので
  同じ系列ではない (2024 年の福島県: R2 778 万人泊、正誤表 954 万人泊)。社会・人口統計体系の表は正誤表の後 (2026-06-19) に更新されており、
  10人以上の系列への訂正は公表されていないので R2 の値をそのまま使う。照合の途中で、4 指標の説明が範囲を書いていないことと、
  観光テーマの章の説明の誤りを見つけて直した (develop、`fix(data): 宿泊旅行統計の 4 指標が…`)。
- **完了条件**: 2026 年の値を取り込んだ 4 指標に、系列の断絶が note と章の説明に書かれている。

### [SSOT-CONSOLIDATION-REST-01] 2026-10-06 の定数集約で見送った重複を、挙動の差を解消してから寄せる

タグ: [インフラ・計測] [種類:改善] [実行:対話] [起票:2026-10-06] [領域:管理]

- **背景**: `77ba6e36a`・`eef2a0a1a`・`0098430a1` で、サイト識別子 (正本 `packages/types/src/site.json`)・都道府県コード (`@stats47/area`)・e-Stat URL などの直書き約 470 ファイルを正本参照へ置き換えた。
  置換は値と意味が完全一致する箇所に限ったので、箇所ごとに挙動が違う重複は残っている。再発止めは `check-maintenance-debt.cjs` の SITE_IDENTITY_LITERAL。
- **候補 (上ほど優先)**:
  1. Windows で別の Playwright profile を読む可能性がある絶対パス直書き: `.claude/skills/sns/publish-x/check-x-scheduled.ts`・`.claude/skills/sns/update-x-profile/update-x-profile.cjs` (publish-x と profile を共有するため見送った)。
  2. 県名の短縮処理 9 か所 (data-configs `seo-meta-facts.ts`・`area-axis.ts`、product-factory、svg-builder、remotion)。北海道を「北海」にする箇所としない箇所が混在するので、`@stats47/area` に意図を引数で選べる関数を作ってから寄せる。
  3. スクリプトの小さな重複ヘルパー: ISO 週計算 16 ファイル (月曜始まり・日曜締め・UTC/JST が混在。2026-10-20 に `SCRIPT-ISO-WEEK-UNIFY-01` へ分け、Google API の認証 15 ファイルも `SCRIPT-GOOGLE-CLIENT-UNIFY-01` に起票した)、JST 変換 27、getArg 52、fetchText 20、dotenv 読み込み 27、ブラウザ起動引数 16。挙動の差を一覧にしてから共通化するか決める。
  4. データ表の重複: `apps/ges/scripts/data/ports.json` と `packages/area/src/data/ports.json` (キー形式・精度差)、県庁所在地の座標 3 か所 (精度差)、`databook-xlsx.ts` のカテゴリ名 (CATEGORIES と名称がずれており、寄せると Excel のシート名が変わる)、migration-flow の theme、8・10 区分の地方区分。
  5. remotion の一部・svg-builder・product-factory・ges・migration-flow は `@stats47/area` などを依存に持たず県リスト等を再定義している。依存を足すか (package-lock の更新を伴う) を決める。
- **trigger**: 上のどれかを触る改修が入るとき、または同じ値の不一致で不具合が出たとき。
- **停止条件**: 寄せると出力 (表示文言・ファイル名・URL・画像ハッシュ) が変わるものは、変えてよいとオーナーが決めるまで寄せない。
- **完了条件**: 候補ごとに「正本へ寄せた」か「寄せない理由を正本の近くに書いた」かが決まっている。

### [CHART-SOURCE-DERIVE-01] 図ごとの出典 (ブログの `<data-source>` タグ・機能別 ChartFooter の固定値) をデータから導出する

タグ: [コンテンツ品質] [種類:改善] [実行:対話] [起票:2026-09-25] [領域:データ]

- **背景**: 2026-09-25 にページ末尾の出典は `DataSourceList` でデータ由来に統一したが、図ごとの出典は手書き・固定値が残る。
  公開ブログ 94 記事の図の直下に手書きの `<data-source url label>` タグがあり (URL 43 種)、source.json と照合されていない。
  `apps/web/src/features` の 10 ファイルは `ChartFooter` に出典名を固定文字列で渡している (例: 人口移動 Sankey の統計表 ID)。
  実例として `depopulation-area-medical-facilities` の source.json は国土数値情報 P04 の旧 URL (`KsjTmplt-P04.html`、404) を持つ
  (表示は displaySources で現行 URL にしたが、系譜の URL は古いまま)。
- **次**: ① `<data-source>` タグの label/url を、同じ図の source.json から導出した出典と突き合わせ、食い違い・リンク切れを一覧化する。
  ② 図の直下の出典を source.json から自動表示する (タグを使わない) か、タグを残すなら監査に載せるかを決めて実装する。
  ③ 機能別の固定値を metric config / attribution 由来に置き換える。④ 系譜 URL の到達性を定期監査に入れるか検討する。
- **trigger**: 出典リンク切れ・誤表記の指摘、または図の出典の書式を変えるとき。
- **完了条件**: 図ごとの出典がデータから導出され、手書きの出典 URL が監査対象になっている。

### [WIN-PREFLIGHT-NPM-SPAWN-01] Windows で preflight:pr の 3 gate が `spawnSync npm ENOENT` で判定前に落ちる

タグ: [インフラ・計測] [種類:不具合] [実行:windows] [検証:npm run preflight:pr] [起票:2026-09-25] [領域:管理]

- **再現確認 (2026-10-02)**: noteカバー台帳の統合後も3 gateが同じ起動エラーで未判定。対象checkerは今回未変更。
  全体は41/45合格、残る1件は公開blog snapshotのHTTP503。note関連・全25package/8scriptの型検査・管理画面テストは合格。
  実測は `data/note/cover-operations-latest.json` の `validation.preflightPr`。

- **背景**: 2026-09-25 にこの Windows PC で `npm run preflight:pr` を実行すると、`check-japan-zue-evidence-inventory.mjs` と
  `check-quality-warning-ratchet.cjs` が `spawnSync("npm", …)` で ENOENT、`check-money-unit-audit.cjs` も collector の起動で失敗し、
  ゲートの判定まで到達しなかった (Linux CI では同じ gate が成功)。既知の環境要因 2 gate (Sitemap / Unit Semantics Mirror) とは別物。
  原因の型は memory `feedback_windows_script_portability` の「npx/npm の spawn (Node22 は .cmd を EINVAL)」。
- **次**: 3 スクリプトの npm/npx 起動を、Windows でも動く形 (node で npm-cli を直接起動するか `shell` 指定) に揃える。
  共通の起動ヘルパーがあればそれを使う。
- **完了条件**: この PC で上記 3 gate が判定まで進む (成功・失敗は中身次第)。

### [NOTE-PAID-MANUSCRIPT-SYNC-01] API パッチで変えた有料記事 6 本の private R2 原稿を live 本文に追従させる

タグ: [エージェント・SSOT] [種類:改善] [実行:sweep] [起票:2026-09-20] [領域:商品]

- **owner**: note-manager
- **背景**: 2026-09-20 に `patch-note-paid-landing.mjs` で d-kakei / d-geo 4 本 / 財政 ¥200 の無料部分を live で直接更新した。
  変更内容は `data/note/paid-landing/<key>.json` (git) にあるが、private R2 (`stats47-private/note/…/draft.md`) の原稿は改稿前のまま。
- **trigger**: 有料記事の原稿を private R2 から復元して再公開する作業が発生したとき、または paid-landing spec を持つ記事が 10 本を超えたとき。
- **次**: `npm run note:article -- checkout <key>` で原稿を取り出し、spec 適用後の無料部分を draft.md に反映して `save` する
  (所有者 API の全文から作る `--from-live` が要るなら note-article.mjs に足す)。d-kakei は 2026-10-13 に台帳と private R2 へ入った。
- **完了条件**: spec を持つ全記事について private R2 の原稿 SHA が live 本文から再現できる。

### [CATEGORY-NAV-CONSOLIDATION-01] カテゴリ一覧UIの2実装 (PortalCategoryGrid / CategoryNavGrid) 統合検討

タグ: [UI・UX] [種類:改善] [実行:対話] [起票:2026-09-15] [領域:サイト]

- home (`/`) と `/category/[categoryKey]` は同一の `PortalCategoryGrid`
  (`apps/web/src/features/home-portal/components/PortalCategoryGrid.tsx`) を使い、17カテゴリの
  順序・データ源 (`CATEGORY_DEFS`) は一致している (整合済み・対応不要)。
- 一方 `/areas/[areaCode]` は別実装の `CategoryNavGrid`
  (`apps/web/src/features/area-profile/components/CategoryNavGrid.tsx`) を使い、アイコン+色タイル
  (件数なし) と `PortalCategoryGrid` のテキスト+件数行という異なる見た目・挙動になっている。
- trigger: `/areas/[areaCode]` を次に触るセッションで、統合が本当に妥当か (県スコープの
  リンク生成・件数表示の要否が違うため意図的な分離の可能性もある) を精読してから判断する。
  2026-09-15 時点でこのファイルは別の並行セッションが直後に編集済み (uncommitted) のため、
  今回は触れずこのカードだけ残す。

### [MUNI-RANKING-EXPANSION-01] 市区町村ランキング拡充 (全量公開 2026-09-01 実施済み・残は SSDS 未使用分)

タグ: [コンテンツ品質] [種類:改善] [実行:対話] [起票:2026-09-01] [領域:データ]

- **owner**: Claude Code (選定・監査) + オーナー (公開承認)
- **実施済み (2026-09-01)**:
  - 第1バッチ 6 key + テーマ population (オーナー承認・本番実測済み)
  - **全量公開 (オーナー指示「公開できるものは全て公開したい」)**: 候補 184 のうち **171 key + 19 テーマ**を
    published 昇格。除外 13 の理由は catalog の unsupported/unknown エントリが正典
    (cities.json 不在 4 / 値完全一致の重複 7 / 品質監査未了 2 = industrial-land-price・major-lake-area)。
    fiscal-strength-index の unknown は「0 = 194 行政区 + 特別区部のみ」の実測で解消。
    同名 title の系列は item snapshot の `subtitle` でページ title を区別 (generator が衝突未解決を throw)。
    副産物: moving-in-excess-rate の subtitle 誤り是正 + SSDS 系 10 config の displayName/url 補記
- **残り (次の拡充はここから)**:
  1. ~~品質監査未了 2 件 (industrial-land-price / major-lake-area) の要否判断~~ **済 (2026-10-22)**: R2 cities.json の実測で、`major-lake-area` は 2024 年の 0 (湖が無い) を除いた 117 自治体の順位として公開 (`valuePolicy: {minExclusive: 0}`・テーマ「土地・面積」に追加、174 → 175)。`industrial-land-price` は 2005 年のみ・値ありは 22% のため unsupported に確定。
  2. ~~**SSDS 未使用 733 指標**~~ **済 (2026-10-22)**: 733 コードを e-Stat 実測で判定 (最新年 2015 以降・値のある市区町村 800 以上・0 の割合 90% 未満・公開済みと値が一致しない) し、541 件を公開 (新規の市区町村専用 530 + 県の指標に市区町村を足した 11。175 → 716)。テーマを 10 件新設 (19 → 29)、市区町村ページのデータブックには基本の 24 件だけを足した。判定の記録は `packages/data-configs/src/geo-scope/municipality-ssds-expansion.ts`。以下は当時のメモ。
     **SSDS 未使用 733 指標** (`expansion-survey.json` の `ssdsUntapped`・同じ 1,913 団体軸) —
     e-Stat から `page-data-batch --kind city` で cities.json を作れば同じ pipeline で公開可能。
     metric config 新設が要るため data-ingester 系の作業
  3. 非 SSDS 3,349 表 (R2 estat-catalog `npm run estat:catalog:search -- <語> --collect-area 3`、2026-09-16 manifest) — 表ごとに軸 pin 設計が要る長尾
- **2026-10-21 追加 (本番反映済み)**: 令和7年国勢調査の 5 年間の増減 3 件 (`census-population-change-rate-5y` /
  `census-population-change-5y` / `census-household-change-rate-5y`) を R2 cities.json で監査して published に足した (171 → 174)。
  人口テーマと世帯テーマにも入れたので、市区町村データブックにも出る。未公開の unknown は残り 10 件
  (火災 2・自動車保険 2・家計の費目 4 は cities.json 不在または監査未了、industrial-land-price・major-lake-area)。
- **計測**: 公開 28 日後 (2026-09-29 目安) に GSC/GA4 で市区町村面の実測。pilot の 9/21 判定は
  confounded (doc 44 記録済み)
- **関連**: doc 44 WP8 / `MUNI-AI-CONTENT-01` (公開 key が 10 を超えたため trigger 1 は成立。
  trigger 2=解説スロット・3=オーナー承認 は未成立)

### [CITY-PAGE-WEIGHT-01] 市区町村数の多い県の市区町村ページが HTML の重さの警告 (900KB) を超える
タグ: [UI・UX] [種類:改善] [実行:対話] [起票:2026-10-22] [領域:サイト]

- **証拠**: 2026-10-22 の本番で札幌市 (`/areas/01000/cities/01100`) の HTML は 855,840 bytes (gzip 57,670)。予算は `page-quality-budgets.json` の `html_bytes` 900,000 (warning)。同日の市区町村指標の拡充でデータブックに 24 指標を足し、同じページの dev 出力は 5,389,215 → 5,864,251 bytes (+8.8%・表の行 192 → 223) になった。本番も同じ割合なら約 93 万 bytes で警告を超える (デプロイ後の週次ページ品質監査で実測する)。
- **本番実測 (2026-10-22・デプロイ run 39743772903 の後)**: 札幌市 953,744 bytes (+11.4%・警告超え)、千代田区 815,369 bytes。
- **次**: ① 週次の `page-quality` で北海道など市区町村数の多い県の市町村ページの `html_bytes` 分布を見る。② 重さの内訳 (県内の市区町村一覧 179 件・データブックの表・RSC の写し) を測って大きいものから削る。データブックの表を節ごとに先頭数行 + 「すべて見る」にしても HTML は減らないので、削るなら RSC の重複か一覧の出し方を見る。
- **完了条件**: 北海道の市町村ページの `html_bytes` が 900KB 未満。
- **済 (2026-10-22・デプロイ run 39763716073 の後)**: データブックの表の各セルのクラスを表の子孫セレクタへまとめ (1 行 1,154 → 781 bytes)、本番の札幌市 `/areas/01000/cities/01100` は 953,744 → 817,878 bytes、千代田区は 815,369 → 688,628 bytes (curl で実測)。北海道の他の市町村は札幌市より軽い (表の行数は同じで県内の市区町村一覧も同じ)。カードは完了。

### [MUNI-AI-CONTENT-01] 市区町村ランキング用 ai-content を別契約で新設する

タグ: [コンテンツ品質] [種類:改善] [実行:対話] [起票:2026-08-31] [領域:データ]

- **owner**: Claude Code (ranking-content-author 系の拡張として)
- **trigger (3 つすべて満たすまで着手しない)**:
  1. doc 44 WP8 の実測判断で公開 municipality ranking key が増えること (目安 10 key 以上。現在 1)
  2. `/municipalities/ranking/<key>` ページが解説を描画する設計になること (現状 item.json の
     title/description のみで、解説スロットが無い = 消費者不在)
  3. オーナーが市区町村面のコンテンツ投資を承認すること
- **設計要点 (着手時の前提。正典 = `ranking-content-standards.md` §スコープ境界)**:
  - namespace は `app/municipalities/ranking/<key>/ai-content.json` (県版 `app/ranking/` と混ぜない)
  - スキーマは県版の流用禁止。1,717 自治体に「県別解説 47 件」の相当物は成立しないため、
    上位/下位の要約・県別分布・母集団と除外自治体 (entityPolicy / valuePolicy) の説明・FAQ で構成する
  - 監査は `app/municipalities/ranking/<key>/values.json` (cities.json 由来・1,717 entity) と
    突合する専用実装。県版の EXPECTED_PREF_COUNT=47 / thin 40 / 7 地方区分は持ち込まない
  - 共有するのは原理のみ: 数値突合 (number-audit の設計)・author/critic 分離・outbox → push → CI 公開
- **完了条件**: pilot key 1 件で生成 → 専用監査 blocker 0 → critic PASS → ページ描画まで通し、
  誤値を注入して監査が発火することを実測する
- **関連**: doc 44 (`docs/02_実装計画/44_市区町村統計スコープ分離・ランキング基盤実装仕様.md`) WP8 / `JAPAN-COMMENTARY-01`
- **済 (2026-10-22・オーナー指示「全てやりきって」で trigger 3 成立)**: 試験 1 指標 `census-population-change-rate-5y` で完了条件を満たした。本文は `data/municipalities/ai-content/<key>.json` (JSON Schema 付き)、監査は `packages/ranking/src/municipalities/municipality-ai-content.ts`、デプロイ時の市区町村ランキング生成が監査に通ったときだけ `ai-content.json` を書き、ページは values.json の generatedAt が一致するときだけ「データの考察」と FAQ を描く。本番の配信値で監査 blocker 0 (`"aiContent": "written"`)、富岡町の値を 36.0→38.0 に変えると `根拠の無い数「38.0」` で書かない (実測)、ranking-content-critic は 1 回目 REVISE (FAQ の質問が増減率と食い違う等 5 件) → 反映後 PASS、localhost で描画を確認。契約は `ranking-content-standards.md`「市区町村の解説」。本番 (デプロイ run 39763716073 の後) で `ai-content.json` は 200、ページに「データの考察」と FAQPage が出て、解説の無い指標 (`elderly-population-ratio`) には出ないことを確認した。指標を増やす作業は `MUNI-AI-CONTENT-EXPAND-01`。カードは完了。

### [MUNI-AI-CONTENT-EXPAND-01] 市区町村ランキングの解説を需要のある指標へ広げ、監査の穴を 2 つ塞ぐ
タグ: [コンテンツ品質] [種類:改善] [実行:対話] [起票:2026-10-22] [領域:データ]

- **前提**: 試験 1 指標 (`census-population-change-rate-5y`) で、本文 → 配信値での監査 → critic → ページ描画の経路ができた (`MUNI-AI-CONTENT-01`)。
- **次**: ① GSC で表示回数の多い市区町村ランキング (W41 で 65 URL) から上位 10 指標を選んで書く。1 指標ごとに `generate-municipality-ranking.ts --key <key>` で `"aiContent": "written"` を確かめ、critic を通す。② 監査に足す: 増減率・割合の指標で FAQ の質問が「最も増えた/減った」のように率を言わない形を止める (2026-10-22 の critic が試験版で指摘した型。率の指標の全件に出うる)。③ 原発事故・地震など配信値に無い外部の事実は監査が検証できない。書いてよい事実を出典付きで限るか、critic の確認項目として固定する。
- **停止条件**: 表示を受けているのに解説を足した指標の CTR・掲載順位が `[MUNI-SSDS-EXPANSION-01]` の基準 (2026-11-22 判定) より悪化したら、広げるのを止めて原因を確かめる。
- **完了条件**: 10 指標の解説が本番に表示され、②の検査がテストで固定されている。

### [JAPAN-COMMENTARY-01] /japan の時系列解説は別コンテンツ型として要否から判断する

タグ: [コンテンツ品質] [種類:意思決定] [実行:対話] [起票:2026-08-31] [領域:サイト]

- **owner**: Claude Code (theme-designer / strategy-advisor と協働)
- **trigger**: `/japan/*` の GSC 実測で流入が付き、解説の読者価値を検証する意味が出たとき
  (doc 43 は「最低コンテンツ基準を満たす slug だけ active」— 需要実測が先)
- **決めること**: ランキング ai-content の派生では作らない (正典 `ranking-content-standards.md`
  §スコープ境界)。`/japan` の契約は `app/japan/<metric>/series.json` = 公式全国値の時系列で、
  1位/最下位/県別解説の形が構造的に当てはまらない。候補は (a) theme の evidenceTopics /
  markdown-section の系譜で人手キュレーション、(b) 時系列専用の生成契約を新設、(c) 作らない。
  要否そのものから判断する
- **完了条件**: 採否の判断が実測根拠つきで記録され、採用時は設計が別 backlog として起票されること
- **関連**: doc 43 (`docs/02_実装計画/43_地理スコープ分離・日本統計基盤実装仕様.md`) / `MUNI-AI-CONTENT-01`

### [BUILD-PERF-PHASE34] CI cacheと型検査重複の実験

タグ: [種類:改善] [実行:対話] [起票:2026-07-12] [領域:管理]

- **owner**: Claude Code
- **状態**: 未完了範囲はCIのbuild成果物再利用・変更種別ごとの検査分岐・短縮効果の実測。型検査の必須性を維持し、同一入力で合格したローカル検査は変更理由がなければ繰り返さない。
- **trigger**: 1本のPRで現行build jobの壁時間とcache sizeを測れるとき。
- **追加の実測根拠（2026-09-13）**: PR964の初回CI `34740979345` はE2E 102/103成功。公開R2の地域経済チャートは意図した折れ線へ更新済みだったが、テストの旧ドーナツ表示要求が残っていた。テストmatrixだけを修正した次回CI `34741425669` でも全体build・型・unit・E2Eが実行され、18チェック成功。job全体（依存導入などを含む）はStatic Gates 533秒、Full E2E 522秒、Build Check 309秒で並行実行されており、合算を待ち時間と扱わない。コードだけでなく公開データ版も検証入力として記録する必要がある。
- **次（実行順）**: ①jobごとの依存導入・build・検査・cache復元/保存の壁時間を測る。②コード・lockfile・生成設定・データmanifestの組を固定し、同じ入力の検証済みbuildを後続jobで再利用できるか試す。③アプリ変更、テスト変更、運用記録だけの変更に応じたrequired checksを設計し、無関係な全体buildの繰り返しを減らす。④同じscopeの前後時間と費用を比較する。公開R2を候補コードへ組み合わせるE2Eでは、カタログ変更の公開前後で期待値がずれるケースを別途検出する。
- **停止条件**: restore/save込みで短縮しない、cacheが過大、または検査を弱める場合は採用しない。
- **完了条件**: 変更種別ごとに必要な検査が必ず実行され、入力変更時のcache失効と失敗伝播を確認する。復元/保存込みの同条件比較で短縮が実測されるまで高速化完了とはしない。今回のリリースへCI構成変更を追加しない。

### [AREA-DATABOOK-REMAINDER] 県データブックの小粒残件

タグ: [種類:改善] [実行:対話] [起票:2026-07-19] [領域:サイト]

- **owner**: Claude Code
- **trigger**: 既存47県版の利用実測で、欠損セクションが回遊または検索の阻害要因と確認できたとき。

### [MULTICHANNEL-CONTENT-PRODUCT-01] 商品チャネル横断化

タグ: [種類:制作] [実行:対話] [起票:2026-07-18] [領域:商品]

- **owner**: Claude Code
- **trigger**: ココナラまたはnoteの単一商品で実売、粗利、supportMinutesを測定できた後。
- **正典**: `.claude/skills/product/build-coconala-product/reference/multi-channel-content-product-factory.md`

### [GIS-CROSS-CONTENT-BACKLOG] 統計×GISコンテンツ

タグ: [種類:制作] [実行:対話] [起票:2026-07-04] [領域:データ]

- **owner**: Claude Code
- **trigger**: 既存GIS素材と検索需要が一致する単一pilotを選べたとき。

### [CLOUDFLARE-INVOICE-01] 請求書PDFと予測値の突合

タグ: [種類:改善] [実行:対話] [起票:2026-05-16] [領域:管理]

- **owner**: Claude Code
- **trigger**: 手動精算漏れが再発するか、請求額が継続して予測から10%以上ずれるとき。

### [SSDS-DEMAND-BATCH-01] SSDS未使用項目の需要ファースト展開

タグ: [コンテンツ品質] [種類:制作] [実行:対話] [領域:データ]

- **owner**: ranking-expander
- **trigger**: GSC、記事企画、テーマ欠測のいずれかで具体的な検索需要が確認できたとき。
- **制約**: 約4,000件の未使用項目や約17万metric相当を一括投入しない。1バッチ最大20件、公開後4週の実測を次バッチのgateにする。

### [GEO-DEV-LOCAL-R2-01] Mac の dev-server で公開前の Geo 生成物 (.local/r2) をローカル確認できるようにする

タグ: [インフラ・計測] [種類:改善] [実行:対話] [起票:2026-10-08] [領域:管理]

- **事象**: `scripts/dev-server.ts` は R2 を `.local/r2` で上書きする仕組みが Windows の gateway にしか無く、Mac では公開前の Geo bundle を dev server で確認できない。2026-10-08 の `/geo/population-low-elevation` は、Geo 担当が一時的な中継を組んで確認した。
- **trigger**: 次に新しい Geo 分析を公開前に確認するとき。
- **完了条件**: Mac でも `.local/r2` を優先して読む dev server の起動方法が手順書にあり、公開前の Geo ページを表示できる。

### [REFERENCE-METRIC-FOLLOWUP-01] 参考文献由来の指標の追補 (熱中症の人口当たり・男女比の 2025 年国勢調査)

タグ: [コンテンツ品質] [種類:制作] [実行:対話] [起票:2026-10-08] [領域:データ]

- **内容**: ① `heatstroke-deaths` は実数のみ。人口 10 万人当たりの計算型 metric (`fetcherKey: calculated`) を足すと県の比較に使える。② `sex-ratio-age-20-39` は 2015・2020 年のみ。2025 年国勢調査の 5 歳階級別人口が公表されたら年を足す (`.claude/scripts/data/fetch-census-sex-ratio-20-39.mjs`)。
- **trigger**: ①は熱中症を扱う記事やテーマを作るとき。②は 2025 年国勢調査の年齢別確定値の公表時。
- **完了条件**: それぞれ指標が R2 に反映され、ランキングページで確認できる。

### [METRIC-DEF-ELECTRICITY-DEMAND-01] 電力需要量 (electricity-demand) の config に定義・調査が無く、単位が全角の「Ｍｗｈ」
タグ: [コンテンツ品質] [種類:改善] [実行:対話] [検証:npx tsx .claude/scripts/blog/build-metric-definition-sheet.ts --keys electricity-demand] [起票:2026-10-08] [領域:データ]

- **事象**: 指標定義シートが「対象・分母 (config に対象の記述なし)」「調査 (surveyId 未設定)」を返し、単位は全角の「Ｍｗｈ」。
  ブログ cc-estat-14 の再審査で blog-critic が見つけた (記事は MWh と書いている)。
- **次**: 社会・人口統計体系 `#H05107` の元の調査 (電力調査統計) と対象を確かめ、description・surveyId を足し、単位を「MWh」に揃える
  (表示が変わるので、ランキングページとブログの表記をあわせて確かめる)。
- **完了条件**: 定義シートの対象・調査が埋まり、単位が半角の MWh になる。

### [BLOG-CC14-STACKED-AREA-FIGURE-01] cc-estat-14 (積み上げ面の記事) に、実データの積み上げ面の図を載せる
タグ: [コンテンツ品質] [種類:改善] [実行:対話] [検証:node .claude/scripts/blog/quality-gate.mjs contents/blog/cc-estat-14-energy-area-chart/article.md] [起票:2026-10-08] [領域:サイト]

- **背景**: 2026-10-08 の書き直しで、存在しない統計表 ID を外し、積み上げ面のサンプルを「仮の値」と明記した。記事には積み上げ面の図が 1 枚も無い。
  svg-builder のカタログにも積み上げ面の部品が無い (blog-critic の起票候補)。
- **次**: 実在の表 `0003409159` の電力量 (tab 160) は 2013 年 4 月〜2016 年 3 月の 36 か月で、電灯需要計 (120)・電力需要計 (200)・特定規模需要計 (310) が
  欠損なしにそろう (critic が確認)。chart-author で svg-builder に積み上げ面の部品を足し、この 3 系列の図を記事に載せる。
- **完了条件**: 記事に実データの積み上げ面の図があり、blog-critic が PASS。

### [MODEL-OPT-MONITOR-01] effort を下げた 4 体と sonnet にした code-reviewer の実運用を見て、戻すかを決める

タグ: [エージェント・SSOT] [種類:改善] [実行:対話] [起票:2026-10-09] [領域:管理]

- **trigger**: 2026-10-22 (4 体) と 2026-10-30 (code-reviewer)。
- **経緯**: 2026-10-08 に open-data-curator・sns-renderer・article-writer・blog-critic の frontmatter に `effort: high` を書き (`cf1f701d9`)、
  10-09 の `npm run model-usage:report` で提案は 0 件 (旧 MODEL-OPT-APPLY-01 は完了)。code-reviewer は 10-02 に sonnet へ切り替えた。
- **次**: 期日に、4 体の見落とし・差し戻しと、code-reviewer の指摘の見落としを見る。増えていれば effort を外す / `model: opus` に戻して canary に課題を足す。
- **完了条件**: 4 体と code-reviewer それぞれについて、据え置くか戻すかを決めて記録している。

### [NOTE-COVER-CHOROPLETH-REVIEW-01] note のカバー画像を見直し、コロプレス地図に要るデータを持つか配線する
タグ: [コンテンツ品質] [種類:改善] [実行:対話] [起票:2026-10-12] [領域:商品]

カバーに地図を使うなら、描くためのデータを手元に持つか、既存のデータから配線するかを決める。（出典: 2026-09-29 の手書きメモ・vault dairy/2026-09-29）

### [NOTE-SELLING-ARTICLE-IDEAS-01] 売れる note 記事を検討する（Claude を使って港湾統計など）
タグ: [収益化] [種類:改善] [実行:対話] [起票:2026-10-12] [領域:商品]

港湾統計のようにまだ扱っていない統計で、買われる記事の候補を出す。（出典: 2026-09-29 の手書きメモ・vault dairy/2026-09-29）

### [BRAND-IMAGE-01] stats47 のブランドイメージを決める
タグ: [SNS・マーケ] [種類:意思決定] [実行:対話] [起票:2026-10-12] [領域:戦略]

色・トーン・見た目の約束を決める。言葉のほうは `STP-MESSAGE-ROLLOUT-01`。（出典: 2026-09-28 の手書きメモ・vault dairy/2026-09-28）

### [DOCS-CHECK-CI-SPEED-01] docs のチェック CI に時間がかかっているのを短くする
タグ: [インフラ・計測] [種類:改善] [実行:対話] [起票:2026-10-12] [領域:管理]

`docs:check` のどこに時間がかかっているかを測ってから直す。（出典: 2026-10-07 の手書きメモ・vault dairy/2026-10-07）

### [ESTAT-DATA-SCHEMA-CHECK-01] e-Stat API のデータを data/ に集約した後のスキーマを確かめる
タグ: [インフラ・計測] [種類:改善] [実行:対話] [起票:2026-10-12] [領域:データ]

集約した結果、読み手の期待する形とずれていないかを確かめる。（出典: 2026-10-07 の手書きメモ・vault dairy/2026-10-07）

### [SHADCN-UI-COMMON-01] shadcn/ui の Data Table とカラーテーマを入れ、doboku-note と UI を共通化する
タグ: [UI・UX] [種類:改善] [実行:対話] [起票:2026-10-12] [領域:サイト]

両リポとも Tailwind v4 ＋ shadcn/ui。表は Data Table コンポーネント、色はカラーテーマで揃える。doboku-note 側は DN-0711。（出典: 2026-09-28・10-07 の手書きメモ・vault dairy/2026-09-28・2026-10-07）

### [SITE-RENEWAL-01] サイトをリニューアルする（Claude Design で検討した案を形にする）
タグ: [UI・UX] [種類:改善] [実行:対話] [起票:2026-10-19] [領域:サイト]

Claude Design で検討済みの案がある。着手時に案の所在と範囲（トップ・一覧・詳細のどこまで変えるか）を決める。（出典: obsidian の TODO マスタ ^t-0004 から移管・2026-10-19）

### [SNS-SITE-FUNNEL-01] X・Instagram からサイトへの導線を整える
タグ: [SNS・マーケ] [種類:改善] [実行:対話] [起票:2026-10-19] [領域:SNS]

投稿からサイトへの流入の経路（プロフィールのリンク・投稿の誘導・UTM）を見直す。既存の計測（GA4 の参照元・`nav_click`）で前後を比べられる形にする。（出典: obsidian の TODO マスタ ^t-0005 から移管・2026-10-19）

### [AUTHOR-PROFILE-UPDATE-01] 著者プロフィールを「土木系公務員退職者」に更新する
タグ: [コンテンツ品質] [種類:改善] [実行:対話] [起票:2026-10-19] [領域:サイト]

サイト・note・SNS の著者紹介の文言を揃える。経歴の書き方は本人に確認してから変える。（出典: obsidian の TODO マスタ ^t-0006 から移管・2026-10-19）

### [RANKING-AI-CONTENT-REWRITE-01] ランキングの AI コンテンツをリライトする
タグ: [コンテンツ品質] [種類:改善] [実行:対話] [起票:2026-10-19] [領域:データ]

ランキングページの ai-content を読み直し、薄い・古い・誤りのあるものから書き直す。対象の選び方は DATA-QUALITY-LOOP-01 の4基準に合わせる。（出典: obsidian の TODO マスタ ^t-0008 から移管・2026-10-19）

### [GIS-HIGHWAY-TIMESERIES-01] GIS: 高速道路の時系列と人口・地価メッシュを重ねる
タグ: [コンテンツ品質] [種類:制作] [実行:対話] [起票:2026-10-19] [領域:データ]

高速道路の開通の時系列と、人口または地価のメッシュを重ねた地図・記事を作る。データの出所と年次を着手時に確かめる（規約は `.claude/rules/gis-data.md`）。（出典: obsidian の TODO マスタ ^t-0009 から移管・2026-10-19）

### [SNS-COMPETITOR-ANALYSIS-01] YouTube・Instagram の競合を NotebookLM で分析する
タグ: [SNS・マーケ] [種類:改善] [実行:対話] [起票:2026-10-19] [領域:SNS]

統計・地図系の YouTube・Instagram の競合アカウントを集め、NotebookLM で投稿の型・頻度・伸びた題材を比べる。結果は次の投稿計画に1つだけ反映する。（出典: obsidian の TODO マスタ ^t-0010 から移管・2026-10-19）

### [LOCAL-DATA-CLEANUP-01] 手元データの期限切れ（.local）を片付ける
タグ: [インフラ・計測] [種類:改善] [実行:対話] [検証:npm run check-local-data] [起票:2026-10-19] [領域:管理]

方針は `.claude/shared-policy/LOCAL-DATA.md`。2026-10-19 の `npm run check-local-data` で staging の上限超えが 13 件（`.local/` の作業出力。Kindle 表紙の生成物 460MB・note の参照図など採用済みかもしれないものも混ざる）。採用済みは R2 か Google Drive へ移し、使い捨ては消す。完了条件は上限超えが 0 件。（出典: obsidian の TODO マスタ ^t-0016 を3リポへ展開・2026-10-19）

### [TEST-NO-PREEXISTING-PASS-01] 「以前から失敗している」を理由にテストを通さない規約を入れる
タグ: [エージェント・SSOT] [種類:改善] [実行:対話] [起票:2026-10-19] [領域:管理]

「以前から落ちている」「今回の変更とは無関係」を理由に、失敗したテスト・検査を素通りさせない規約を CLAUDE.md と AGENTS.md に書く。既存の失敗は直すかカードにして担当を決める。完了条件は、規約が両方にあり、いま落ちているテスト・検査がすべて直っているかカードになっていること。（出典: obsidian の TODO マスタ ^t-0020・2026-10-07 の手書きメモを3リポへ展開・2026-10-19）

### [CLAUDE-AGENTS-SYNC-01] CLAUDE.md と AGENTS.md の同期を自動化する
タグ: [エージェント・SSOT] [種類:改善] [実行:対話] [起票:2026-10-19] [領域:管理]

Claude Code は CLAUDE.md、Codex は AGENTS.md を読むので、片方だけ直すと規約が食い違う。どちらを正本にし、どう同期・検査するかを決めて実装する（obsidian の `sync-codex.mjs` が参考）。完了条件は、食い違いを機械が検出でき検査が通っていること。（出典: obsidian の TODO マスタ ^t-0023・2026-09-28 のメモを3リポへ展開・2026-10-19）

### [GITIGNORE-AUDIT-01] .gitignore の追跡対象を点検する
タグ: [インフラ・計測] [種類:改善] [実行:対話] [検証:npm run check-local-data] [起票:2026-10-19] [領域:管理]

追跡すべきものを除外していないか、除外すべきもの（生成物・秘密・大きいバイナリ）を追跡していないかを点検する。git の外の側は `npm run check-local-data`（LOCAL-DATA.md）で申告済みなので、ここでは追跡されている側を見る。（出典: obsidian の TODO マスタ ^t-0024・2026-09-28 のメモを3リポへ展開・2026-10-19）

### [EFFECT-VERDICT-CLI-TEST-SOURCES-01] effect-verdict の CLI テストが実データの判定 1 件で sources 欠落により落ちる
タグ: [インフラ・計測] [種類:不具合] [実行:対話] [検証:node --test .claude/scripts/lib/__tests__/effect-verdict.test.mjs] [起票:2026-10-21] [領域:管理]

- **2026-10-21 完了 (行削除は backlog-loop)**: `sources` が無かったのは before/after 週を解決できず skip する経路 (`cli.mjs` の `skipped: true`)。計測していないので `sources: []` と `before/after/delta/attainment: null` を書くようにし、verdict JSON がどの経路でも同じ欄を持つ。`effect-verdict.test.mjs` 40/40。テストは実データ依存のままだが、欄の有無は経路で決まるので実データの変化で再発しない。

- **事象 (2026-10-21 確認)**: `effect-verdict.test.mjs` の「CLI: verdict JSON を書き、summary と thresholdsVersion を含む」が、`cli.mjs --week 2026-W31` を実データで動かした出力の判定のうち 1 件に `sources` が無いため落ちる。SCRIPT-ISO-WEEK-UNIFY-01 の変更を外した状態でも同じく落ちるので、その変更が原因ではない。
- **次**: どの施策の判定が `sources` を持たないかを出力から特定し、engine がその経路でも `sources` (空配列でも) を書くようにする。テストが実データに依存して落ちる形でよいかも併せて決める。
- **完了条件**: 上のテストが通り、判定の JSON はどの経路でも `sources` を持つ。

### [NEXT16-MIGRATION-01] Next.js 15 のサポート期間が 2026-10-21 に切れた。16 へ上げてビルドの例外フラグを外す
タグ: [インフラ・計測] [種類:改善] [実行:対話] [起票:2026-10-21] [期日:2026-11-30] [領域:サイト]

- **事象**: 2026-10-21 の本番デプロイ (run 39589689158) が Build の段で止まった。OpenNext 1.20.2 は Next.js の公開日表
  (`node_modules/@opennextjs/aws/dist/build/helper.js` の `NEXT_RELEASE_DATES`、15 = 2024-10-21) から 2 年を過ぎた版を拒否し、
  `Next.js version 15.5.27 is not supported by the Next.js team` で exit 1 にする。出典: https://nextjs.org/support-policy (2026-10-21 確認)。
  同じ run の指標スナップショットの R2 反映は先に成功していた (旧版のアプリのまま主要 9 ページ 200 を確認)。
- **応急処置 (2026-10-21)**: `apps/web/package.json` の `workers:build` に `--dangerouslyUseUnsupportedNextVersion` を付けた。
  判定を警告にして続けるだけで、実行中の版 (15.5.27) は変わらない。Next.js 15 に今後の修正が出ない前提で扱う。
- **次**: Next.js 16 の移行ガイド (https://nextjs.org/docs/app/guides/upgrading/version-16) を読み、`apps/web` の影響範囲
  (middleware・設定・OpenNext の対応版) を洗ってから上げる。`.claude/rules/nextjs-ssg-preservation.md` の検査
  (prerender の notFound 走査・スモークテスト) を通す。
- **完了条件**: next 16.x で本番デプロイが通り、`workers:build` からフラグを外した版で再デプロイが通る。

### [BLOG-MUNI-SERIES-01] 市区町村データの解説記事を連載にする (国勢調査 2025 の人口増減から)
タグ: [コンテンツ品質] [種類:制作] [実行:対話] [起票:2026-10-21] [領域:データ]

- **根拠**: GSC 2026-W41 (rolling28d) で市区町村ランキングは 448 clicks / 4,686 imp・CTR 9.56% だが、市区町村ランキング ↔ ブログの
  サイト内移動は週 3 件 / 1 件しかない。「◯◯市 人口」の検索語は 1,840 imp・CTR 0.11% (`MUNI-PAGE-SEO-01`)。
  記事が市区町村の指標を使えば、記事のデータ欄・市区町村ランキング・市区町村ページの関連記事に自動で載る (回遊は `sameMetric` / `explains`)。
- **題材の候補 (データは公開済み)**: ① 2020→2025 年に人口が最も減った・増えた市区町村 (珠洲市 -34.6%・輪島市 -28.3%・大熊町 +81.0%。
  `census-population-change-rate-5y`) ② 東京 23 区の比較 (課税所得・転入超過・高齢化。23 区の公開は 2026-10-21) ③ 市区町村の財政力と
  地方債 (`fiscal-strength-index` ほか地方財政テーマの 19 指標)。
- **次**: 型は `blog-quality-standards.md` のアーキタイプから選び、article-writer → blog-critic (PASS 必須) で 1 本目を作る。
  記事の `rankingRefs` に市区町村ランキングと同じ key を入れる (回遊の結線はこれだけで足りる)。
- **禁止・承認境界**: `contents/blog/` を develop へ push すると自動公開が走るので、原稿は別ブランチに置き、公開はオーナーの承認後。
- **完了条件**: 1 本目が公開され、市区町村ランキングの「同じ指標のランキング・記事・テーマ」に出ることを本番で確かめる。

### [CITY-UNIT-DENOMINATOR-01] 市区町村ページ・ランキングで、分母が subtitle にしか無い指標が件数のように見える
タグ: [コンテンツ品質] [種類:不具合] [実行:対話] [起票:2026-10-23] [領域:データ]

- **証拠**: 市区町村の表示名 (`municipalityRankingDisplayTitle`) は、同名の指標と衝突するときだけ subtitle を付ける。そのため分母が subtitle にしか書かれていない
  指標は、市区町村データブックの表・見出し・特徴と市区町村ランキングの title で分母の無い値になる。2026-10-21 の localhost で札幌市の特徴に
  「人口集中地区人口密度 7,993.8人（2020年）」が出た (unit は「人」、subtitle が「人口集中地区面積1km²当たり」)。2026-10-23 に公開中の 716 件を
  機械的に抽出すると 7 件が当たった: `department-store-count-per-100k` (百貨店数・店・人口10万人当たり)、`densely-inhabited-district-population-density`、
  `population-density-per-km2-inhabitable-area` (どちらも unit「人」)、持ち家・借家の畳数と延べ面積 4 件 (1住宅当たり)。抽出は語の一致によるもので、全件とは言えない。
  財政力指数は unit「指数」がそのまま付き「0.81指数」と表示される。
- **次**: 分母の持たせ方を 1 つに決める。(a) subtitle が分母を持つときは表示名に必ず付ける、(b) unit に分母を入れる (`packages/data-configs/src/unit/` の
  正典で「人/km²」などを解釈できる形)。全件の洗い出しは語の一致ではなく `parseUnit` の `hasDenominator` と subtitle の組で行う
  (`.claude/rules/unit-semantics-standards.md`・`feedback_ssds_denominator_evidence`)。「指数」のような無次元の unit を値の後ろに付けるかも同じ規則で決める。
- **完了条件**: 上の 7 件を含め、分母を持つ指標が市区町村ページ・市区町村ランキングの title で分母付きに表示され、検査がその規則を固定している。

### [DEPLOY-R2-AHEAD-OF-APP-01] 本番デプロイの Build が落ちても、R2 の指標スナップショットだけが先に新しくなる
タグ: [インフラ・計測] [種類:改善] [実行:対話] [起票:2026-10-23] [領域:サイト]

- **証拠**: 2026-10-21 の deploy run 39589689158 で、「Generate and verify metric release snapshots」と「Publish verified metric snapshots before app build」は成功し、
  その後の Build が OpenNext の Next.js サポート期限の判定で失敗した (`NEXT16-MIGRATION-01`)。次のデプロイ (run 39596982885) までの約 1 時間、本番は旧版のアプリが
  新しいスナップショット (市区町村ランキングに東京 23 区を追加・データブック 1,741 件) を読んでいた。今回は互換だった (主要 9 ページ 200 を実測) が、
  スナップショットの形を変える変更で Build が落ちると、旧版のアプリが新しい形を読んで本番が壊れる。
- **次**: `deploy-workers.yml` が R2 反映を Build より前に置いている理由 (Build が新しいスナップショットを読むか) を確かめる。読まないなら反映を Build の成功後・
  wrangler deploy の前へ移す。読むなら、Build が日付や版だけで落ちる条件 (OpenNext の版判定など) を R2 反映の前に検査する段を足す。
- **完了条件**: Build が失敗する条件を再現した run (または workflow の契約テスト) で、R2 反映が走らないことを確かめる。二相を許すなら理由を
  `.claude/rules/branch-workflow.md` の「R2 反映は main のコードで動く」節に書く。

### [NEXT-SUPPORT-WINDOW-GUARD-01] フレームワークのサポート期限で本番ビルドが日付だけで止まるのを、事前に知らせる
タグ: [インフラ・計測] [種類:改善] [実行:sweep] [起票:2026-10-23] [領域:管理]

- **証拠**: OpenNext は `node_modules/@opennextjs/aws/dist/build/helper.js` の `NEXT_RELEASE_DATES` から公開後 2 年を過ぎた Next.js の major を拒否する。
  コードを変えていないのに、2026-10-21 00:00 UTC から本番デプロイが止まった (deploy run 39589689158)。同じ規則では Next.js 16 は 2027-10-21 に止まる。
- **次**: 週次の既存 workflow (例: `agent-consistency-weekly.yml`) に、導入中の Next.js の major とこの表からサポート終了までの日数を出す検査を足し、
  60 日を切ったら起票する。`apps/web/package.json` に `--dangerouslyUseUnsupportedNextVersion` が残っている間も毎週知らせる (外し忘れを防ぐ)。
- **完了条件**: 終了日を手前に動かした fixture で検査が警告を出し、現在の develop では「残り N 日」だけを出すテストがある。関連: `NEXT16-MIGRATION-01`。

### [E2E-FAILURE-EVIDENCE-01] 代表 E2E が落ちても、サーバーの例外と R2 の取得失敗が残らない
タグ: [インフラ・計測] [種類:改善] [実行:sweep] [起票:2026-10-23] [領域:管理]

- **証拠**: 2026-10-21 の PR #1166 (run 39591998395、head adc2be97e) で、`/ranking/total-population` が HTTP 200 のあと
  エラー境界 (`app/ranking/error.tsx`「データの取得中にエラーが発生しました」) を出して落ちた。同じコードの前後の run は通り、本番も正常で、原因は特定できなかった。
  ジョブのログにサーバーの例外は無い。`apps/web/playwright.config.ts` の webServer は stdout を指定しておらず、Playwright 1.62.1 の既定は stdout を捨てる
  (`node_modules/playwright/types/test.d.ts`「Default to "ignore"」)。R2 オーバーレイのログ (`/tmp/pr-e2e-r2-overlay.log`) は起動に失敗したときしか出力しない。
- **次**: webServer の `stdout: "pipe"` か、サーバーの出力をファイルへ書いて、失敗時にオーバーレイのログと一緒に artifact へ上げる (`pr-quality-check.yml` の Representative E2E)。
- **完了条件**: わざと落とした E2E の run で、サーバーの例外とオーバーレイの upstream error が artifact から読める。

### [PACK-SNAPSHOT-SKIP-GUARD-01] product-factory のテスト前処理が取得失敗を黙って飛ばし、件数を固定したテストが揺れる
タグ: [インフラ・計測] [種類:改善] [実行:sweep] [検証:npm run test:run --workspace=@stats47/product-factory] [起票:2026-10-23] [領域:商品]

- **証拠**: 2026-10-21 の develop-quality-gate run 39594085606 で P-12 の指標数が 2,073 ではなく 2,072 になり 2 件のテストが落ちた。直後に手元で 2 回組み直すと
  どちらも 2,073 だった。前処理 (`tests/setup/pack-snapshots.global.ts` → `buildPackSnapshots`) は 2,154 件を公開 R2 から取り、取れなかった指標を理由付きで
  飛ばすが、件数も理由も出力しない。`fetchRankingValues` に接続失敗と 5xx の再試行を足した (commit 952f0a384) が、3 回失敗すれば同じことが起きる。
  また前処理は手元に既にあるパックを作り直さないので、手元のテストは古いデータで通り続ける。
- **次**: 飛ばした理由を「データの理由」(47 県そろいの年が無い・出典変更の要確認・registry 未登録・全県 null) と「取得の理由」(R2 fetch 失敗・接続失敗) に分け、
  取得の理由が 1 件でもあれば前処理を失敗させる。飛ばした件数を出力する。手元のパックには作成日を持たせ、一定日数より古ければ作り直すか警告する。
- **完了条件**: fetch を失敗させる fixture で前処理が止まり、データの理由だけのときは今までどおり通るテストがある。

### [AGENT-COMMIT-HOOK-BYPASS-01] pre-commit の文書検査を通らない backlog の commit が develop に入り、リリース PR を止めた
タグ: [エージェント・SSOT] [種類:改善] [実行:対話] [起票:2026-10-23] [領域:管理]

- **証拠**: commit adc2be97e (2026-10-21 11:26 UTC、author Claude) が `KABEUCHI-AGENT-01` をカテゴリ「戦略」(語彙外・DG057 error) で足した。
  pre-commit は `.claude/todo/` の変更で `npm run docs:check` を走らせる (`apps/web/scripts/pre-commit-checks.sh` 89〜92 行) ので、この commit は pre-commit を通っていない
  (`--no-verify` か、hook の無い環境か は未特定)。develop-quality-gate は push 後に止めたが、リリース PR #1166 の Catalog Gates と Contract Tests が落ち、
  別セッションが 9294f4071 で直すまでデプロイが止まった。
- **次**: その commit を作ったセッションの環境を特定する (worktree・クラウド・Codex のどれか、hook が効く設定か)。塞ぎ方は、push 前に `.claude/todo` の差分へ
  docs governance を掛ける pre-push hook か、エージェントの規約での `--no-verify` 禁止の明文化 (現状は一部の skill にしか無い)。
- **完了条件**: DG057 を含む backlog の変更を push しようとすると push 前に止まることを実測する。または bypass した経路を特定して塞いだ記録がある。

### [LOCAL-DEPS-STALE-WARN-01] 手元の node_modules が lockfile より古いと、手元だけテストが落ちて原因を取り違える
タグ: [インフラ・計測] [種類:改善] [実行:sweep] [検証:npm run preflight] [起票:2026-10-23] [領域:管理]

- **証拠**: 2026-10-21 の Mac で `node_modules/.package-lock.json` (10-13) が `package-lock.json` (10-20・braces を外した更新) より古く、
  `apps/web/src/__tests__/eslint-dependency-compatibility.test.ts` が手元だけ落ちた (CI は `npm ci` で通る)。`npm install` で揃えると通った。
  同じ型の食い違いは Windows PC でも記録がある (`@babel/core` 不在で pre-commit の lint が落ちた。このファイル内の環境メモ)。
- **次**: `npm run preflight` に、`node_modules/.package-lock.json` と `package-lock.json` の依存の版を比べ、食い違えば「npm install が要る」と出す検査を足す
  (install は自動で走らせない。`.claude/rules/local-environment.md` の install の排他に従う)。
- **完了条件**: lock を 1 件ずらした fixture で警告が出て、揃っていれば何も出ないテストがある。

### [METRIC-RELEASE-PATHS-SSOT-01] 指標リリースの対象パスが、デプロイと PR のオーバーレイで別々の正規表現に書かれている
タグ: [インフラ・計測] [種類:改善] [実行:sweep] [起票:2026-10-23] [領域:管理]

- **証拠**: `.github/workflows/deploy-workers.yml` の `allowed` (exact manifest に入れる R2 キー) と `.github/scripts/r2-overlay-server.mjs` の `localMetricSnapshotFile`
  (PR の E2E とローカル確認で手元の生成物を返すキー) が、同じ種類の生成物を別々の正規表現で持つ。2026-10-21 に市区町村データブックを足したとき、両方を手で直した
  (commit 436f46b43)。すでに範囲が違い (デプロイは categories・survey・page-components を含み、オーバーレイは page-components を別の経路で返し categories・survey を返さない)、
  違いの理由はどこにも書かれていない。二重管理はいずれずれる (`feedback_hand_synced_duplication`)。
- **次**: リリース対象のパスの定義を 1 つのモジュールに置き、デプロイの inline script とオーバーレイの両方がそれを import する。オーバーレイで返さない種類は理由と一緒に定義に書く。
- **完了条件**: 定義からパスを 1 種類消すとデプロイ側とオーバーレイ側の両方のテストが落ちる。

### [AGENT-SESSION-ID-MISSING-01] agent:session の登録が、デスクトップアプリの Claude セッションでは ID が無くて使えない
タグ: [エージェント・SSOT] [種類:不具合] [実行:sweep] [起票:2026-10-23] [領域:管理]

- **証拠**: 2026-10-21 に `npm run agent:session -- --register --agent claude --task DEPS-VITE-AUDIT --note ...` が
  「--session または CODEX_THREAD_ID / CLAUDE_SESSION_ID が必要です」で失敗した。`.claude/hooks/session-guard.js` 150 行は `CLAUDE_SESSION_ID` を読むが、
  デスクトップアプリのセッションの環境にあるのは `CLAUDE_CODE_SESSION_ID` (2026-10-23 に変数名だけ確認)。CLAUDE.md は編集前の登録を求め、install の排他もこの登録に頼るので、
  登録できないと並行セッションの検知が効かない。
- **次**: `CLAUDE_CODE_SESSION_ID` も読む (Codex の `CODEX_THREAD_ID` と同じ扱い)。どちらも無いときの案内に `--session <任意の固定 ID>` を出す。
- **完了条件**: `CLAUDE_CODE_SESSION_ID` だけがある環境で `--register` が通り、`--status` に載ることをテストで固定する。

### [MUNI-PAGE-SEO-REGISTER-01] 市区町村ページの効果観測 MUNI-PAGE-SEO-01 を active 施策の一覧に登録する
タグ: [インフラ・計測] [種類:改善] [実行:機械] [起票:2026-10-23] [期日:2026-10-30] [領域:サイト]

- **事象**: 改善ログ `data/improvement/gsc-improvement/improvement-log.md` の `MUNI-PAGE-SEO-01` (2026-10-21 デプロイ・after 窓 2026-10-22〜11-18・判定 2026-11-21) が、
  2026-10-23 時点で `.claude/todo/improvements.md` に無い。improvements.md は improvement-triage の排他 writer なので、このセッションでは書いていない。
- **次**: improvement-triage が `[kpi: id]` と観測期限付きで行を足す (想定効果はログの計算式。閾値エンジンが集計しない検索語群なので `[target:]` は付けない旨をログに書いてある)。
- **完了条件**: improvements.md に `MUNI-PAGE-SEO-01` の行があり、docs:check の DG079 を通る。

## 🟢 低 — 再開条件を満たしたら着手する

### [VITE-CONFIG-ESM-WARN-01] vitest.config.ts が CommonJS として読まれ、Vite の次の major で読めなくなる警告が出ている
タグ: [インフラ・計測] [種類:改善] [実行:sweep] [起票:2026-10-23] [領域:管理]

- **証拠**: 2026-10-21 の develop-quality-gate run 39594085606 の package テストで、各 package の `vitest.config.ts` について
  「Your Vite config uses features that are unsupported by `configLoader: 'native'`, which is planned to become the default in a future major version of Vite:
  ESM syntax in a file loaded as CommonJS (vitest.config.ts:1:1)」が出た (vite 8.2.4)。
- **再開条件**: Vite の次の major (native config loader が既定になる版) が出たとき。それまでは警告だけで動作は変わらない。
- **次**: 設定ファイルを `.mts` にするか、package に `"type": "module"` を足すかを決め、全 package の vitest を同じ形にそろえる。
- **完了条件**: package テストのログからこの警告が消える。

### [FISHERY-2024-DB-01] 漁獲量の 12 指標に 2024 年を足す (e-Stat に 2024 年のデータベースの表が出たら)
タグ: [コンテンツ品質] [種類:改善] [実行:対話] [起票:2026-10-21] [領域:データ]

- **経緯**: `DATA-QUALITY-LOOP-01` ③ (2026-10-21) で、`fishery-species-catch-mackerel` (GSC 表示 685) と `fishery-species-catch-pacific-saury` (595) の配信の最新は 2023 年だった。農水省は令和6年 (2024) の確報を e-Stat に 2026-02-27 に公表したが、Excel ファイルだけである (表 2-2「大海区都道府県振興局別統計 魚種別漁獲量」`stat_infid=000040415922`)。e-Stat のデータベース検索では 2024 年の表は 0 件だった (2026-10-21。2023 年は 99 表あり、2-2 表 `0004043248` は 2025-10-17 公開)。12 魚種の指標 (`fishery-species-catch-*`) は、2023 年をこの 2-2 表から `supplementalSources` で補っている。
- **trigger**: e-Stat のデータベース検索 (`https://www.e-stat.go.jp/stat-search/database?page=1&toukei=00500216&layout=dataset&year=20240`) に 2024 年の 2-2 表が出たとき。
- **次**: 2023 年と同じ形で 12 指標の `supplementalSources` に 2024 年を足す (分類コードと地域軸は表のメタ情報で確かめる) → data-refresh の dryRun → オーナー承認 → R2 反映。`FISHERY-SPECIES-REFRESH-01` のブログも取り直しの対象になる。
- **完了条件**: 12 指標の最新年が 2024 年になり、海のある 39 都道府県の値がそろっている。

### [WEB-ANY-RATCHET-01] apps・packages の `any` を増やさない検査を入れる
タグ: [インフラ・計測] [種類:改善] [実行:対話] [起票:2026-10-20] [領域:サイト]

- **背景 (2026-10-20 実測)**: tsconfig 25 個はすべて strict だが、`any` を含むファイルがテストを除いて 61 ある。
- **trigger**: `any` を含むファイルを触る改修が入るとき、または `any` が原因の型の取りこぼしで不具合が出たとき。
- **次**: 今の件数を baseline にして、増えたら `check-maintenance-debt.cjs` が止める (baseline は縮小専用)。触ったファイルの `any` はその改修で型に置き換える。
- **完了条件**: 増加を検査が止めている。

### [SNS-KAKEI-EXPANSION-01] 家計調査のnote・サイト内容をX・Instagramへ展開する（再開指示待ち）
タグ: [SNS・マーケ] [種類:制作] [実行:対話] [起票:2026-10-19] [領域:SNS]

- **判断・再開条件**: 2026-10-19のユーザー指示でSNS展開は後回し。note・サイトの既存公開分は維持し、SNSはユーザーが再開を指示するまで保留する。note・サイトの拡充は `CONTENT-KAKEI-EXPANSION-01`。
- **次・担当**: 再開時にx-strategist / instagram-strategistが既存note・サイトから家計支出の10分類・個別品目比較・都市ごとの特徴品目の候補を選び、共通4:5・1枚型で管理画面のnote・X・Instagramを比較して確認する。既存の試作素材を維持する。
- **停止条件・完了条件**: 今は制作・レンダリング・投稿を行わない。候補の3媒体比較・確認ができれば制作準備完了とし、投稿・予約は別途ユーザーの明示指示を得る。

## 🟣 判断待ち — やるかどうかの意思決定が未了

### [RANKING-HEADING-YEAR-DECISION-01] ランキングページの見出しの近くに最新年を出すか決める
タグ: [UI・UX] [種類:意思決定] [実行:対話] [起票:2026-10-21] [領域:サイト]

- **事実 (2026-10-21、週次 UI 検査 `agent|ranking--old-2years` の指摘)**: `/ranking/national-pension-full-exemption-rate` はデータが 2005〜2006 年度と古いのに、見出し (h1「国民年金保険料全額免除割合」) の近くに年が無い。年は上部のカードの小見出し (「2006年度」) と年の切り替えにだけある。同じ指摘の表の右端が切れる件は `RankingDataTable` の列幅で直した (未デプロイ)。
- **決めること**: 全ランキング (約 2,400 ページ) の見出しの隣か直下に「最新 2006年度」のような年を出すか。出すなら、古いデータ (最新年が 10 年以上前など) だけ目立たせるかも決める。見出しの文言は SEO のタイトルにも関わるので、h1 自体は変えずに横へ添える案を推す。
- **完了条件**: 方針が決まり、出す場合は実装して `ui-findings.ts --mark-fixed agent|ranking--old-2years` を付ける。

### [NOTE-PUBLISHED-DUPLICATES-DECISION-01] note 上で同じ記事が別 URL に複数回公開されている 8 組をどうするか決める
タグ: [SNS・マーケ] [種類:意思決定] [実行:ユーザー] [起票:2026-10-21] [領域:商品]

- **事実 (2026-10-21、`data/note/articles.json` の照合)**: 題名が同じで別の noteUrl を持つ公開済み記事が 8 組ある。「【2024年版】都道府県「最高気温」ランキング」は 4 本 (`a-maximum-temperature`・`recovered-n6f8a367906d1`・`recovered-n863f429319ca`・`recovered-nb2d65c42c28b`)、「大学数」ランキング・「47 都道府県データを 1 コマンドで取得する」・「e-Stat 統計の前年比較…」(有料) が各 2 本、koumuin の「災害時の SNS 発信文…」(有料)・「苦情メール返信案…」(有料)・「住民問い合わせ FAQ…」が各 2 本。台帳は実在の投稿どおりで誤りではない。
- **決めること**: 重複をそのまま残すか、片方を非公開にして残す方へ導線をまとめるか。有料の 3 組は購入者がいる可能性があるので、非公開にする前に購入の有無を記録 (`data/authenticated/revenue-history.json`) で確かめる。
- **停止条件**: note 上の記事の削除・非公開化はオーナーの判断と操作だけで行う (Claude はしない)。
- **完了条件**: 8 組の扱いが決まり、決めた操作の後に台帳の status が実際の公開状態と一致している。

### [DOWNLOAD-EXCEL-FORMAT-01] ランキングのダウンロードに Excel 形式を足すかを決める
タグ: [収益化] [種類:意思決定] [実行:対話] [起票:2026-10-17] [領域:商品]

- **経緯**: 業務で使う人向けに Excel (xlsx) を足す案。作る前に、`PRODUCT-FUNNEL-DEPLOY-01` の「業務の資料」向けデータ集案内のクリックで需要を見る。
- **判断材料**: 4 週の `csv_download_purpose=work` の件数と、`ranking_product` のクリック。ダウンロードは 28 日 414 回、用途の回答で仕事は 19 件 (2026-W41)。
- **完了条件**: 足すか見送るかをオーナーが決めた。

### [KDP-ROYALTY-RATE-CHECK-01] KDP の印税率が 35% になっている原因を確かめ、70% の条件を満たせるかを判断する
タグ: [収益化] [種類:意思決定] [実行:対話] [起票:2026-10-17] [領域:商品]

- **経緯**: 2026-10-17 の企業ペルソナ調査。唯一の販売実績 K-S1-02 は価格 ¥800 で純収益 ¥254 (`data/products/sales-ledger.json`)。比率は 35% の印税率に相当する。70% の条件 (価格帯・配信費・販売地域など) を満たしていないのか、KDP セレクト (`kuEnrolled:false`) と関係するのかは未確認。
- **次**: ① KDP の公式ヘルプで 70% ロイヤリティの条件を確認し、URL と確認日を残す ② `config/kdp-listings.json` の価格・設定と照合する ③ 変える場合は 1 冊ずつオーナー承認で反映する。
- **完了条件**: 35% の原因が公式の条件と台帳の設定で説明され、変えるかどうかをオーナーが決めた。

### [GSC-MOBILE-PERF-PLAN-01] 実ユーザー性能とモバイルの検索意図から必要な改善を選ぶ
タグ: [UI・UX] [種類:意思決定] [実行:対話] [起票:2026-10-16] [期日:2026-10-30] [領域:サイト]

- **GSC案34 / P2（次に着手）**: CrUX・GSC CWV・既存PSIの取得状況を確認し、実ユーザー計測とラボ計測、URL単位とorigin単位を区別する。
- **GSC案31 / P3（条件確認後）**: モバイルで結論・表に到達しにくいことを実測した場合、検索意図に沿って配置変更を採用する。
- **GSC案35 / P3（条件確認後）**: 重い地図・チャート・画像、表示ずれの原因を特定できた場合、本文の早期表示・画面外の遅延読み込み・寸法確保から必要な対策を選ぶ。
- **owner / 順序**: performance-auditor・site-ux-manager。GSC優先ページの端末別流入と性能を確認→同テンプレ代表をモバイルで実測→原因と影響範囲を特定→既存実装カードへ統合する。GeoはGEO-UIUX-SPEED-01、県目次はAREA-TOC-MOBILE-01、既存品質errorはPAGE-QUALITY-ERROR-BACKLOG-01が実装を所有する。
- **停止条件**: CrUX欠測を良好/不良と扱わない。スコア満点だけを目指さない。主要本文を遅延させない。標本や権限不足は未確認とし、取得可能な代替と限界を記録する。
- **完了条件**: 計測範囲・対象端末・問題の有無・3案の採否が決まり、採る場合は根拠・対象・検証指標を既存カードへ引き渡す。判断だけで改善効果ありとしない。

### [GSC-PRODUCT-SCHEMA-POLICY-01] 外部販売先へ案内する商品ページの構造化データ目標を決める
タグ: [インフラ・計測] [種類:意思決定] [実行:対話] [起票:2026-10-16] [期日:2026-10-30] [領域:サイト]

- **GSC案40 / P2（次に着手）**: 有効な商品スニペットを維持する目標を確認し、画像など事実に基づく追加の採否を決める。
- **owner / 入力**: site-ux-manager・gsc-analyst。10-16監査は商品スニペット有効24/無効0、販売者リスティング無効24。確認した商品は外部Amazon/Coconalaへ案内する。公式適用条件は監査JSONのofficialSourcesを参照する。
- **次 / 順序**: ①各テンプレの購入場所と表示内容を照合 ②商品スニペットの必須条件と画像等の追加余地を確認 ③「維持/追加/対象外」を決め、必要な実装はPRODUCTS-PAGE-CONTENT-01等へ統合する。
- **停止条件**: 販売者リスティングの警告ゼロを目的にしない。画像・レビュー・返品/送料・在庫を捏造しない。本文にない商品情報を構造化データだけへ追加しない。
- **完了条件**: 適用する検索機能と通知の扱いが明確で、追加する項目には実在する根拠・実装先・検証方法がある。不要な追加は理由付きで見送る。

### [GSC-PARAM-URL-POLICY-01] パラメーター別の検索対象と同一状態URLの整理方針を決める
タグ: [インフラ・計測] [種類:意思決定] [実行:対話] [起票:2026-10-16] [期日:2026-11-06] [領域:サイト]

- **GSC案22 / P3（条件確認後）**: UTM・並び替え・県選択・年度選択の内容差を確認し、独立して検索対象にするか、正規URLへまとめるかを決める。
- **GSC案23 / P3（条件確認後）**: 同じ表示状態のパラメーター順序違い・不要な既定値等が増殖している場合、リンク生成側で正規化する案を採用する。
- **owner / 入力**: site-ux-manager・ranking-ui-manager。10-16監査の代替canonical833例、現行UrlPolicy、実HTMLとリンク生成元。現状が適切なcanonicalである例を欠陥扱いしない。
- **次 / 順序**: パラメーターごとに内容差・読者用途・検索需要・canonical・内部リンクを表にする→同じ状態を表す組だけ特定→最小の正規化案を選ぶ。信号整合の実装はGSC-CANONICAL-REDIRECT-01へ接続する。
- **停止条件**: 年度/地域の違いを一律に消さない。共有URLや絞り込み操作を壊さない。問題が見つからなければ変更しない。
- **完了条件**: 対象パラメーターの維持/統合と根拠が決まり、採用案には対象生成元・保持する機能・回帰条件がある。


### [GSC-PUBLIC-RESOURCE-CRAWL-01] 構造化データが参照する画像と配布データの取得方針を決める
タグ: [インフラ・計測] [種類:意思決定] [実行:対話] [起票:2026-10-16] [期日:2026-11-06] [領域:サイト]

- **GSC案25 / P3（条件確認後）**: JSON-LDから参照する画像・配布データを抽出し、取得可能性と公開意図が食い違うものだけ是正案を選ぶ。
- **owner / 入力**: ranking-ui-manager・site-ux-manager。実HTMLのimage / distribution.contentUrl、robots.ts、HTTP status・MIME・X-Robots-Tag。Googleでの実取得は公開URLテスト等で別に確認する。
- **次 / 順序**: 代表テンプレの参照資源一覧を作る→公開資源/内部APIと必要なクローラーを分類→HTTP・robots・参照先の整合を調べる→必要な公開URLまたは参照修正を選ぶ。Dataset本文の修正はGSC-DATASET-NESTED-SCHEMA-01が所有する。
- **停止条件**: 内部APIを一括開放しない。公開画像と廃止OGPの取得許可はGSC-ROBOTS-INDEXED-01に統合する。公開ライセンス・アクセス制限を外さない。手動UA取得だけでGoogleが取得済みとしない。
- **完了条件**: 資源ごとの公開目的・取得条件・変更要否が決まり、採用案の権利・負荷・表示を検証できる。

### [GSC-DEMAND-EXPANSION-01] 既存検索需要の未回答部分を補うか既存ページで対応するか決める
タグ: [コンテンツ品質] [種類:意思決定] [実行:対話] [起票:2026-10-16] [期日:2026-11-06] [領域:サイト]

- **GSC案32 / P3（条件確認後）**: 需要が確認できた検索語の周辺で未回答の問いを特定し、既存ページの補強か新規ページかを選ぶ。
- **owner / 順序**: blog-seo-strategist・ranking-expander。P1修正とSEO-CTR-CANDIDATES-01の小規模対応を優先し、その結果と最新page×queryで再開する。
- **次**: ①読者の問いと既存の回答ページを照合 ②既存ページで答えられるかを検討 ③需要のある不足だけ既存topic queue/ランキング拡充キューへ渡す。BLOG-SEO-QUEUE-01の需要と公開後表示の観測も参照する。
- **停止条件**: HARM分類や検索語だけで購入意図を断定しない。需要のないページ・47県の薄い派生記事を量産しない。別の企画キューを作らない。
- **完了条件**: 候補ごとに読者の課題・需要の証拠・既存重複・補強/新規/見送りが決まり、採用分は既存キューのIDと検証条件に接続する。

### [GSC-CRAWL-SERVER-01] 実Googlebotの取得障害があるか調べて対策の要否を決める
タグ: [インフラ・計測] [種類:意思決定] [実行:対話] [起票:2026-10-16] [期日:2026-11-06] [領域:サイト]

- **GSC案33 / P3（条件確認後）**: クロール統計と取得可能なサーバー記録で5xx・429・応答時間・発生時刻を確認し、再現する障害の原因を絞る。
- **owner / 入力**: gsc-analyst・performance-auditor。10-16の手動722 URL検査では5xx/timeout/loopなし。これはGooglebotの過去・実際の取得障害がない証明ではない。
- **次 / 順序**: GSCホスト状態/クロール統計→該当時間の既存Cloudflare記録→URL・キャッシュ状態・配信版の順に照合する。botの識別には利用可能な検証情報を使い、UA文字列だけに依存しない。ログがなければ取得可能期間と代替証拠を明記する。
- **停止条件**: 未再現を原因否定に使わない。クロール予算不足と先に断定しない。原因不明のままWAF・キャッシュ・リソース上限を変更しない。
- **完了条件**: 障害の有無と観測限界、対策の採否が決まり、障害ありならURL・時刻・応答・再現条件・担当への実装範囲が残る。

### [NOTE-PAID-HISTORY-EXPOSURE-01] 公開リポジトリの git 履歴に残る有料 note 原稿の扱いを決める
タグ: [収益化] [種類:意思決定] [実行:対話] [起票:2026-10-13] [領域:商品]

- **事実 (2026-10-13)**: `uruhayato373/stats47` は PUBLIC。旧方式では有料記事を公開 R2 に置けず、原稿を `docs/31_note記事原稿/` (git) に置いていたため、
  有料本文が GitHub で読めた。対象は git に入っていた有料記事 (koumuin-claude-code 15 本・koumuin-estat-claude-code 11 本・d-kakei-category-dataset・
  販売記事の下書き 62 本など。2026-10-13 時点の台帳で有料は計 151 本)。同日の変更で docs/31 は git から外れ、本文は private R2 へ移った (main へ反映すれば最新版からは消える)。
  ただし過去のコミットには残る。例: `git show 8ce8358c41 --stat` (koumuin-claude-code の原稿追加)。
- **選択肢**: (a) 履歴はそのまま (既に公開済みと割り切る) / (b) `git filter-repo` で `docs/31_note記事原稿/` を全履歴から消して force push
  (全クローン・フォーク・CI キャッシュに影響し取り消せない。GitHub のキャッシュ削除依頼も要る) / (c) リポジトリを private にする (Cloudflare 連携・公開前提の仕組みへの影響を先に調べる)。
- **禁止**: オーナーの決定なしに履歴を書き換えない・force push しない。
- **完了条件**: 選んだ方針を実行し、(b)(c) なら GitHub 上で有料原稿が読めないことを確認する。(a) なら理由をこのカードの代わりに収益化戦略へ記録する。

### [AFF-LEAD-COPY-AB-01] 画像バナーの前に文脈をつなぐ一文を置くかを A/B で決める
タグ: [収益化] [種類:意思決定] [実行:対話] [起票:2026-10-08] [領域:アフィリエイト]

- **論点**: 画像バナーには見出し・説明を足さない方針 (収益化戦略 §3.2、2026-08-14) だが、09-12〜10-03 の 4 週では文脈とつながった枠ほど CTR が高い (ブログ本文 0.26%・楽天の商品カード 0.40〜0.46% に対し、バナーを並べるだけの `ranking-native` は 1,975 表示で 0 クリック、`category-native`・`theme-native` も 0 クリック)。クリックは 4 週で 58 件しかなく、導入文が効くとは断定できない。
- **やるなら**: `ranking-native` の 1 枠だけで「この統計に関係するサービス」型の一文あり/なしを 2 週ずつ比べる (`/manage-affiliate-experiment`)。評価は確定収益 / 1,000 viewable impression、補助に CTR。
- **前提と停止条件**: `AFF-RESOLUTION-EFFECT-01`・`AFF-IMPRESSION-ROUTING-01` の 10-25 判定と、画像バナーへの PR 表記の復元 (**2026-10-08 16:02 JST に本番反映**。hotfix PR #1106、main `b69ee76`、Deploy run 37739912995 success。本番 `/ranking/unemployment-rate` で画像広告 10 件すべてに PR を確認) と窓を重ねない。10-25 判定でも、この日時より前と後の CTR を同じ窓として比べない (improvement-triage へ申し送り)。開始は 10-25 判定のあと。採用するなら収益化戦略 §3.2 と `affiliate-ads-standards.md` §3 の「説明を足さない」を同じ差分で改める。
- **完了条件**: オーナーがやる/やらないを決め、やるなら実験台帳 (`data/affiliate/experiments.json`) に登録されている。

### [METRIC-INTERNET-USAGE-STALE-01] 2006 年で止まったインターネット利用率の指標を公開し続けるか決める

タグ: [コンテンツ品質] [種類:意思決定] [実行:ユーザー] [起票:2026-10-08] [領域:データ]

- **事実 (2026-10-08 実測)**: `internet-usage-rate-10plus` (社会生活基本調査 SSDS G7000) は 2001・2006 年の 2 回分しか無く、この項目は 2006 年で終わっている。『統計から読み解く47都道府県ランキング 消費編』a24 (SNS・インターネット利用率) の代替として作った。より新しい通信利用動向調査には都道府県別の表が e-Stat に無い。
- **選択肢**: そのまま公開する (古い年であることは年表示で分かる) / 非公開にして a24 を一次資料なしに戻す / 総務省の通信利用動向調査の公表資料から都道府県別の値を手動取得で作る。
- **完了条件**: 方針が決まり、台帳 `prefecture-ranking-consumption/analyses.json` の a24 と指標の公開状態がそれに揃う。

### [DOMAIN-SHARED-POLICY-01] 管理の枠組み (5 役割・画面の種類・サイドメニューの規則) を共通事業方針に載せるか決める
タグ: [エージェント・SSOT] [種類:意思決定] [実行:ユーザー] [起票:2026-09-27] [領域:戦略]

- **論点**: stats47 と土木ノートで戦略は違うが、管理の枠組みは揃えられる。共通にするのは、5 役割の並び・領域ファイルの形・画面の種類 5 つ・サイドメニューの規則・「バックログ・エージェント・文書は必ず領域を持つ」規則。領域の中身 (stats47 のつくる = データ、土木ノートのつくる = 教材) と戦略は各プロジェクトに残す。
- **やり方**: 共有パッケージは作らない。規則の文章は vault の共通事業方針に載せて `policy:sync` で両プロジェクトへ配り、domains.json と検査スクリプトは各リポジトリが同じ形のものを持つ。
- **手順**: オーナーが vault の `.claude/共通事業方針SSOT.md` に「管理の枠組み」節を足すかを決める。足す場合は vault 側で編集し、stats47 で `npm run policy:sync` → `npm run policy:check` を実行する。写し (`.claude/shared-policy/`) は手編集しない (`.claude/rules/shared-business-policy.md`)。土木ノート側の同期も同じ手順で行う。
- **停止条件**: 共通化しない場合は、stats47 の domains.json の説明文に土木ノートと揃えた経緯を 1 文残して完結させ、このカードを削除する。
- **完了条件**: 採否が決まり、採用なら両リポジトリで `npm run policy:check` が exit 0。

### [KDP-EXPANSION-01] 参考文献の売れ筋型に合わせてKindleラインを組み直し、実測付きで拡張する

タグ: [収益化] [種類:意思決定] [実行:対話] [検証:npm run products:kindle:report] [起票:2026-09-19] [期日:2026-10-17] [領域:商品]

- **owner**: kindle-publisher (設計・生成) / article-writer + blog-critic (書き下ろし・意味レビュー) / kdp-operator (出品) / オーナー (KDPレポート・承認)
- **前提 (実測)**: 参考文献vaultのKindle競合5冊は形式が4型に分かれる。①単一論点の読み物 (『都道府県別平均年収ランキング』110p・本文約5.1万字・図混在。S1-01と同じ論点で直接競合) ②1県1章のガイド (『47都道府県県庁所在地ガイド』150p・約11.5万字・文字のみ) ③見出し駆動の県民性ストーリー (『おカネと健康』60p・約5.6万字・1テーマ1見開き) ④単一表の超薄型 (『遊技営業店密度』15p・約4.5千字・シリーズ刊)。出版社系3冊 (偏差値/統計から読み解く/DataBook) は指標横断の合成スコアと1県1ページ型。競合の販売数・順位は未計測 (Amazon商品ページは本セッションの許可外で読めない)。**自社22冊の売上・KENPは `sales-ledger.json` が空で未計測**。
- **順序**: ①オーナーがKDPレポート (2026-08-13〜) をexportし `products:sales` へ記録。4週窓 (08-30起点) は 2026-09-27。②S1 12冊を `PRODUCT-SALES-READINESS-01` の是正でv3化して差し替える (市場の型①に一致する主力)。③S2/S3/S4 の未公開10冊は現行設計 (主題外キー・全県表の羅列) のまま出さない。S3は型②「1県1章」へ、S4は型③「意外な1位の県民性ストーリー」へ設計変更してから再生成。④新規パイロット3冊: (a) 47県庁所在市の食卓・家計ガイド (型②。原資=県別食卓47本+a-kakei 47本、十大費目検算済) (b) 意外な1位ストーリー集 (型③。S4を置換) (c) 47都道府県 総合スコアブック (出版社型。指標横断の合成スコアはサイト未掲載で書き下ろし価値が高い。`prefecture-deviation/analyses.json` 53論点を型の参照に使い文言・構成は複製しない)。各冊は書き下ろし30%・critic PASS・Previewer確認後に公開し、4週実測で横展開を判断する。
- **設計契約 (2026-09-19 実装済み)**: `KindleBook.design` (読者の悩み / HARM / 支払う理由 / 需要の証拠 / タイトル案 2 型 / 本文の型) を新設し、`generate` は design 無しを拒否、`validate` は 31 冊を `design-missing` で warn。S1-01 は設計済み (問い型「年収が高い県は、暮らしも豊かなのか」を採用、検索・選択型を対案として保持)。残り 31 冊は本カードの順序で設計する (S1 → S3 型② → S4 型③ → 新規 3 冊)。正典: `coconala-product-standards.md` §8「編集設計」。
- **停止条件**: 売上未計測のまま10冊以上を同時公開しない。型④ (単一表の薄冊) は模倣しない (自社サイトの無料ページと同内容になり、KDPの品質判定とブランドの両方で不利)。競合本の本文・図案・章立てを複製しない (論点と型のみ)。月次計画の「KDP新規展開はやらない」はオーナー指示 (2026-09-19) で解除されたが、週次Mustの記事公開・SEOを圧迫する場合は本カードを後回しにする。
- **追記 (2026-10-07 オーナー整理)**: コンテンツ販売の主チャネルは KDP とする (収益化戦略 §3.5・§6)。雑学の情報は note の有料記事では売れなかった (ランキング型の有料記事 47 本で通算 ¥0) ので、雑学の本はこのカードで扱う。集客は Amazon の検索と読み放題の推薦に置き、stats47 からの送客を前提にしない (ブログ 64 記事・28 日 3,901 PV に対し、Kindle 案内のクリックは 1 回)。パイロット (b)「意外な1位ストーリー集」は、自社既刊の 4 週の売上と既読ページ (KENP) が取れてから着手する。日本の 1 ページあたりの単価は公開情報で確かめられなかったので、KDP レポートの実額から読む。
- **KDP 実績 (2026-10-07 調査・公開記録から分かる範囲)**: 販売中は S1 の 12 冊 (2026-08-13 から)。認証付き計測の KDP 収集は 2026-09-21・09-27・09-30 に成功し、8 月の月次レポートで stats47 の ASIN に当たる行は **1 行** (`data/authenticated/latest.json` の履歴・`quality.monthlyRows`)。09-29 の日次は推定ロイヤリティ ¥0・有料注文 0 件 (`data/authenticated/revenue-history.json`)。金額と既読ページ (KENP) の内訳は暗号化保管庫 (`kdp/monthly/…`) にあり、復号鍵の無いクラウドセッションからは読めない。9 月の月次 (10 月中旬に公開) と 09-30 以降の日次は、09-30 からの `auth_required` で未取得。販売台帳 `data/products/sales-ledger.json` は 0 件のまま。台帳への自動記録は `KDP-LEDGER-AUTO-01`。
- **完了条件**: 自社22冊の4週売上が台帳にあり、S1 12冊がv3で差し替え済み、パイロット3冊が公開され各冊の初回4週KENP/販売数が記録されている。未計測のものを「需要あり」と書かない。

### [LEFT-RAIL-992-HEADER-DECISION-01] 992〜1023px で「ヘッダーは折りたたみ・左レールは表示」になる食い違いをどう揃えるか決める
タグ: [UI・UX] [種類:意思決定] [実行:対話] [起票:2026-09-25] [領域:サイト]

- **観測 (UI 全面点検 2026-09-25・`UI-SITEWIDE-MINOR-01` から切り出し)**: 992px でヘッダーのナビは折りたたみ (ハンバーガー) なのに、
  ホーム・カテゴリの左のカテゴリ欄が出て本文が狭くなる。
- **判断が要る理由**: `.claude/rules/ui-components.md` は「全ページの左レールは共通境界 992px から出す。992px でも本文幅 656px を
  確保でき、1024px 未満のアプリ内ブラウザでも横幅を使える」と意図した設計として定めている。直すには次のどちらかを選ぶ必要がある。
- **選択肢**: ① 左レールの境界を 1024px (ヘッダーの展開と同じ) へ上げる (規約と `LeftRailLayout` の変更。アプリ内ブラウザで左レールが消える)。
  ② 今のまま (本文 656px を許容し、食い違いは仕様として記録する)。
- **完了条件**: どちらかを決め、① なら規約・`LeftRailLayout`・契約テストを同じ変更で直し、② なら規約に理由を追記してこのカードを消す。

### [DEV-ARTICLE-PLACEMENT-01] Claude Code などの制作手順の記事を、一般読者向けの一覧にどう出すかを決める
タグ: [コンテンツ品質] [種類:意思決定] [実行:ユーザー] [起票:2026-09-25] [領域:サイト]

- **発見 (UI 全面点検 (2026-09-25・本番 44 URL × 7 幅 = 308 枚を撮影、250 枚を目視。`UI-FULL-SWEEP-01`))**: `/blog` の人気タグに「ClaudeCode」、`/survey/police-statistics` の関連記事と `/tag/population` の記事カードに
  「Claude Code で 1 分で作る」などの制作手順の記事が並び、統計の読者向けの一覧と混ざっている。
- **考慮**: これらは行政実務者向け (Track B) の入口でもある (`/blog/assembly-answer-chatgpt-5steps` は CTR 13.1%)。一律に除外すると入口を失う。
- **決めること**: 一般の一覧・関連記事から外して専用の入口 (実務者向けのタグやハブ) にまとめるか、現状のまま混在させるか。

### [LAYOUT-MAX-WIDTH-DECISION-01] データのページ (ランキング・テーマ・都道府県) だけコンテナの最大幅を広げるかを決める

タグ: [UI・UX] [種類:意思決定] [実行:対話] [起票:2026-09-25] [領域:サイト]

- **現状**: `PageShell` と `ArticleShell` のコンテナは `max-w-[1280px]` (`apps/web/src/components/layout/PageShell.tsx` の
  `SHELL_WIDTH_CLASS`、`ArticleShell.tsx`)。2026-07-11 に「サイト全体の統一・doboku-note と同じ固定幅」のため 1700px から 1280px に
  狭めた。広い幅で具体的な不具合が出たという記録は見当たらない。
- **実測 (2026-09-25 localhost・1920px で最大幅の制限を一時的に外して撮影)**:
  - ランキング (`/ranking/natto-consumption-expenditure`): 本文のカードの最大幅が 844px → 1,484px。1280px 固定では切れていた表の
    「偏差値」列が全部見えた。地図は高さ 500px 固定なので縦に伸びすぎない。構造は崩れない。
  - ブログ (`/blog/telework-gap-tokyo-6x`): 本文 1 行の文字数が 43 字 → 71 字 (読みやすい目安は 1 行 40 字前後)。記事内の図は中央に小さく残る。
  - 1280px・1440px の画面では、最大幅を外しても本文の幅はほぼ増えない (画面幅で先に頭打ち)。表の列が切れる問題は
    `RANKING-MAP-TABLE-CARD-01` の「表を詰める」対応で直す必要があり、幅を広げても代わりにならない。
- **決めること**:
  1. データのページだけ最大幅を広げるか (候補 1536px)。広げるなら、本文の文章の列は読みやすい幅に制限する (1 行 40 字前後)。
  2. ブログ: **本文とレールの幅は今のまま**。図を本文より広く出す案は**採らない** (2026-09-25 オーナー判断: 見栄えが悪い)。
     レールを 2 列にする案は選択肢として残す (成り立つのは 1,536px 以上の画面だけ。今のレールは目次・出典調査・関連記事・広告で、
     `BLOG-TOC-TOP-ONLY-01` で目次が本文上部へ移ると中身が減り、2 列では埋まらない恐れがある。UI 規約の「左レールは右レールと
     併用しない」との関係も確認する)。
- **判断材料を集める手順**: ① GA4 で訪問者の画面幅 (`screenResolution` 等) の分布を直近 28 日で取り、1,536px 以上の割合を確かめる
  (割合が小さければ広げる効果は小さい)。② 候補の幅で `/ranking/*`・`/themes/*`・`/areas/*` の代表ページを 1536/1920px で撮り、
  カード・チャート・表の崩れが無いかを見る。③ 広げる場合の変更点 (Shell の幅の定数を種類別にする・ヘッダーの幅との揃え方・
  文章の列の上限) を洗い出す。
- **完了条件**: 広げるか・広げないか、ブログのレールを 2 列にするかを決め、採るなら実装カードへ置き換える。見送るならカードを削除する。
  2026-07-11 の統一の判断を変える場合は、`PageShell.tsx` のコメントとデザインシステム文書の横幅の記述も同時に直す。

### [AREA-TOC-MOBILE-01] 県ページの目次をスマホでも本文上部に出すか、16 項目をどう見せるかを決める

タグ: [UI・UX] [種類:意思決定] [実行:対話] [起票:2026-09-25] [領域:サイト]

- **背景 (2026-09-25 localhost `/areas/13000` 実測)**: 「〇〇の目次」(県データブックの 16 節へのリンク、
  `AREA_DATABOOK_TOC_ITEMS`) は PC では右レール最上部 (追従なし) にあるが、375px では 1 件も表示されない
  (リンクの表示幅 0)。スマホには県ページの目次が実質無い。ブログと違い 16 項目あるので、本文上部へ縦に並べると
  画面を大きく占める。
- **決めること**: ① スマホで本文上部に目次を出すか。② 出すなら見せ方 (折り返す横並びのリンク / 主要節だけ /
  その他)。表示領域に収まるリンク一覧は折りたたまない規約 (`.claude/rules/ui-components.md`) を前提にする。
  ③ PC の右レールの目次を残すか、本文上部へ統一するか (`BLOG-TOC-TOP-ONLY-01` の「目次は本文最上部 1 か所」と
  そろえるか)。判断材料に `NAV-CLICK-COVERAGE-01` の導線名で目次のクリックを数週観測してもよい。
- **完了条件**: 採否と見せ方を決め、採るなら実装カードへ置き換える。見送るならカードを削除する。

### [RANKING-SOURCE-TRIPLE-01] ランキングページで出典が 3 か所に出る (ヒーロー行・ページ末尾・サイドバー) のを整理するか決める

タグ: [UI・UX] [種類:意思決定] [実行:対話] [起票:2026-09-25] [領域:サイト]

- **背景**: 2026-09-25 にページ末尾へ `DataSourceList` (統計表リンク付き) を加えた結果、`/ranking/<key>` では出典が
  ヒーローカード下の `SourceAttribution` 行、ページ末尾の「データ出典」、右レールの「この統計の出典調査」の 3 か所に出る。
  役割は正典 (`docs/01_技術設計/04_デザインシステム.md`「データ出典」) で分けてあるが、読者から見て重複かどうかは未判断。
- **決めること**: ヒーロー行を残すか (上部で出典に 1 手で届く利点) / 右レールの調査カードと統合するか。GA4 の `nav_click`
  (`ranking_survey` と `ranking_source`) で各導線の利用を数週観測してから決める。
- **完了条件**: 採否を決め、採るなら実装して正典の役割表を更新する。見送るならカードを削除する。

### [RULES-OWNER-READ-CHECK-01] owner agent が担当 rule を明示 Read しているかを検査するか決める

タグ: [エージェント・SSOT] [種類:意思決定] [実行:対話] [起票:2026-09-23] [領域:管理]

- **owner**: オーナー (採否) / Claude Code (採択後に `check-agent-skill-consistency.cjs` へ実装)
- **背景**: 2026-09-08 に rule を `paths:` 条件付き読み込みへ切り替えたため、rule は **その agent 自身が一致ファイルを Read したときだけ**載る (`docs-vs-issues.md`「rules の読み込み条件」)。owner agent の手順に担当 rule の Read が無いと、subagent は規約を知らないまま作業する。`RULES-DEMOTE-01` (rule 3 本の移設、2026-09-23 完了) で残った判断。
- **次**: 採るなら、agent frontmatter / 本文から担当 rule を抽出し、手順に `.claude/rules/<name>.md` の Read が無い agent を warn にする。誤検知の出方を全 agent で実測してから error 化を決める。
- **完了条件**: 採否と理由が決まる。採る場合は checker の検査が既存 agent で誤検知 0 になり、Read を消すと warn が出ることを確認する。

### [ADMIN-STAT-PILOT-01] 行政資料1業務の統計整理商品を検証し、有料pilotの採否を決める

タグ: [収益化] [種類:意思決定] [実行:対話] [起票:2026-09-18] [期日:2026-10-02] [領域:商品]

- **owner**: オーナー（実務例・協力者・購入条件） / strategy-advisor（比較と採否） / coconala-product-manager（採択後のサンプル仕様）
- **正典**: `docs/00_プロジェクト管理/02_収益化戦略.md` §2・§3.4・§5。一般向け統計メディアを維持しながら、議会答弁・計画策定のために各所の統計をExcelへ集める重複作業を減らす。課題はオーナーとの議論で確認したが、対象業務の詳細・削減時間・支払者・価格・購入需要は未検証。
- **記録先（2026-09-20 新設）**: `data/products/admin-stat-interviews.json`。聞き取り結果はここへ書く（対象業務・完成条件・使った統計・現行手順・所要時間・手直し・再実施頻度・既存手段で残る作業・支払者・根拠）。**回顧による時間と実測を別フィールドで持つ**（収益化戦略 §5 段階2 の要求）。感想や意欲は記録しない（購入意思の代用にしないため）。
- **聞き取り相手はすでにサイトへ来ている（2026-09-20 実測）**: 行政実務の文脈にあるページが GSC 上位に並ぶ。`/blog/assembly-answer-chatgpt-5steps`（48 clicks / 366 imp・CTR 13.1%、サイト全体 3.36% の 4 倍）、`/blog/local-government-debt-burden`（425 clicks）、`/blog/local-tax-revenue-gap`（47 clicks）。出典 `data/gsc/snapshots/2026-W37/pages.csv`。**相手を探す段階は越えているので、①②に時間をかけすぎない。**
- **①の途中経過（2026-09-25・オーナー指示で一時停止）**: 題材は「都道府県の介護保険事業支援計画（第9期・2024〜2026年度）の高齢者の現状分析章」にオーナーが決めた（比較した候補は水道広域化推進プラン・農業振興計画）。理由は、3年ごとに47県すべてが策定し、第10期（2027年度〜）の策定作業が今年度にあたること、metric 定義が最も厚いこと（`elderly-population-ratio`・`elderly-single-person-households`・`single-households-age65plus-{male,female}`・`long-term-care-certified-persons`・`nursing-home-capacity-per-1000-65plus`・`nursing-home-staff-per-100k-65plus` など）。対象資料の第一候補は岡山県「第９期 岡山県高齢者保健福祉計画・介護保険事業支援計画（案）」令和6年2月（https://www.pref.okayama.jp/uploaded/attachment/363015.pdf 、14.3MB を取得済み）。**案の段階の版なので、確定版の公開 URL を探して差し替える。** 既定の `pdftotext`（mingw64）は日本語を出力しなかったため、指標の抜き出しは未着手。**R2 の都道府県データで揃う指標・揃わない指標の実測も未着手**で、どの指標も揃ったとはまだ言えない。再開時の次の一手は、①確定版 PDF から現状分析章の図表を列挙し（指標名・地域粒度・年次・出典）、②各指標の R2 `app/stats/<key>/values.json` の有無と最新年を確認して表にし、③揃わない指標が完成条件に必須なら TOOL-MATERIAL-BUILDER-01 の停止条件に当たるとして報告する。
- **GA4 の業務文脈シグナル（2026-09-24 実測）**: GA4 Data API で country=Japan、2026-08-27〜09-23 のブログ着地セッションを対象に、PC 比率と平日9〜18時比率を「職場で読まれている」手掛かりとして集計した（行政実務者本人である証明ではなく、祝日は除外していない）。ブログ着地全体は 7,199 セッションで PC 比率 45.0%、平日9〜18時比率 44.4%。この平均を大きく上回る着地は water-sewage-crisis（47 セッション・PC 96%・平日 73%）、estat-7-techniques-from-unusable-to-usable（38・95%・69%）、household-solo-vs-dualincome（36・92%・63%）、rice-harvest-volume-prefecture-gap（163・80%・88%）、farmland-crisis-abandoned-land（94・63%・57%）、aging-solo-living-crisis（73・67%・54%）、automotive-industry-transformation-map（227・67%・53%）だった。一方でこのカードが根拠にしている `/blog/local-government-debt-burden`（606 セッション）は PC 30%・平日 39% で平均を下回り、`/blog/assembly-answer-chatgpt-5steps`（88 セッション）は PC 52%・41% でほぼ平均だった。Microsoft Teams 経由（参照元 teams.public.onecdn.static.microsoft）の流入が 28 日で 17 セッションあり、education-expenses-gap・local-government-debt-burden・estat-7-techniques-from-unusable-to-usable・aging-solo-living-crisis などに着地しており、組織内でリンクが共有されている形跡がある。ランキング CSV のダウンロード（file_download）は 28 日で 193 件・120 ページだが、ブログ着地からのダウンロードは 0 件だった。継続観測先は週次 snapshot の `data/ga4/snapshots/<YYYY-Www>/landing-context.csv`（2026-W38 から、コミット `3ea0fece3`）。**この実測が示すのは、聞き取り①の題材候補として地方財政より上下水道・農業・高齢単身・e-Stat 実務の側に職場からの読者が集まっている可能性であり、標本が小さいため題材決定の決め手ではなく優先順位づけの参考にとどめる。**
- **聞き取り票（2026-10-17 作成）**: `data/products/admin-stat-interviews.json` の `questionnaire`（Q0〜Q10・1 人 30〜40 分・各問に記録先の項目を付けた）。オーナーが元自治体職員なので、相手は元同僚・知人から**同じ種類の業務の担当者 3 人**を選ぶ。仮定の購入質問はせず、過去の資料 1 件の事実だけを聞く。Q8（外部購入の経路）で組織の購入経路が見えなければデータ商品は見送り、Q9（庁内の生成 AI 利用）の結果は `KNOWHOW-PRODUCT-PILOT-01` の候補選択に渡す。**未決**: 軸にする業務（介護保険事業支援計画を続けるか、オーナーの元部署の業務に替えるか）は、オーナーの経験部署を確認してから決める。
- **優先・次（実行順）**: ①公開情報で再現できる実際の資料1件について、必要な地域粒度・統計・年次・完成条件・現行手順・再実施頻度を具体化する。②担当者3人を目安に、RESAS・自治体ダッシュボード・書籍・既存Excelでも残る作業と支払者の購入条件を確認する。③同じ仕様で助けられる場合だけ既存資産から無料サンプルを1つ作り、出典照合と利用者のExcel環境での編集を確認し、手直し込みの総時間を比較する。④収益化戦略§5の試用条件を満たした場合に価格・工数上限・時間単価・販売面を定め、有料pilotのGo/Pivot/Stopを判断する。期日は初回の採否・不足証拠確認日であり、未検証でも発売する期限ではない。
- **既存タスクとの境界**: `PRODUCT-SALES-READINESS-01`等の品質是正・既存購入者への対応は維持するが、全商品完成を本検証の前提にしない。既存パックを利用できるかを先に調べ、用途未確認の新作・販売面を増やさない。採否後の優先順位は事業計画TS・商品カタログの開始条件にも反映する。商品在庫を需要の証拠と扱わない。
- **停止条件**: 既存手段で十分、担当者ごとに要件が異なり共通化できない、必要な粒度が取得できない、照合・手直しを含む時間が減らない場合は対象変更または見送り。協力者・試用が得られなければ未検証と記録し、次回確認日と再開条件を決める。検索数・DL数・AI作成の架空ペルソナで実務試用を代替しない。実務者への連絡、販売・価格の外部反映はこのカードだけでは実行しない。
- **完了条件**: 対象業務・必要粒度・代替手段・時間の測定方法と結果・支払者・購入経路・採算の入力が確認済み/未確認に分かれ、根拠付きのGo/Pivot/Stopが収益化戦略へ反映される。Goの場合だけ1商品・1販売面・価格・上限工数・観測期限が具体化される。実売を観測していなければ「事業成立」と報告しない。

### [AFF-NO-INTENT-FALLBACK-01] 「広告なし」にした主題 (身長・気候・犯罪など週 7,757+ imp) に何を出すか

タグ: [収益化] [種類:意思決定] [実行:ユーザー] [起票:2026-09-03] [領域:アフィリエイト]

- **owner**: uruhayato373
- **背景**: #913 で `SURVEY_AFFILIATE_MAP` に null を置いた調査 (学校保健統計・気象統計・面積・
  犯罪・火災・水害・廃棄物・上下水道) はランキングで週 7,757 imp、ブログで 20,501 imp (気候・地名・
  公務員向け how-to 含む) が意図軸の広告なし (ハウス枠 + AdSense) になる。意図の合わない広告を
  上位に置くより空の方が無害という判断だが、収益機会としては空いている。
- **選択肢**: (a) 現状維持 (AdSense のみ) (b) 汎用ハウス枠 (転職 neo-recruit は 28 日で
  5,093 imp / 5 click と全広告中最多) を 2 枚に増やす (c) 主題ごとに商材を開拓する
  (身長 → 成長サプリ・子ども向け通信教育、気候 → 引越し・家電)。
- **決めること**: (b) にするか、(c) をどの主題からやるか。決まったら 🟡 に実装カードを切る。

### [AFF-GEO-SLOT-01] /geo に広告枠を置くか

タグ: [収益化] [種類:意思決定] [実行:ユーザー] [起票:2026-09-03] [領域:アフィリエイト]

- **owner**: uruhayato373
- **背景**: 2026-09-02 の棚卸しで枠の無い route は `/japan` (54 imp/週)・`/municipalities` (0)・
  `/geo` (0)・法務ページのみ。japan / municipalities は #912 で足した。`/geo` は
  `geo-analysis-standards.md` が canonical ページの 7 構成 (問い → 途中地図 → 検算 → 集計 → 補助
  レイヤー → 方法) を規定しており、広告の置き場を規定していない。流入 0 なので急がない。
- **決めること**: 置くなら「方法・限界」の後 (読了位置) に native 1 段、vertical は分析の主題
  (駅アクセス → mobility、2050 人口 → population)。置かないなら本カードを削除。

### [GIT-HISTORY-SECRET-PURGE-01] Git履歴のAPIキーを扱う方針決定

タグ: [種類:意思決定] [実行:対話] [起票:2026-07-11] [領域:管理]

- **owner**: uruhayato373
- **次**: 対象キーが失効・rotation済みかを確認し、秘密検査で現行treeに残存がないことを確定する。
- **trigger**: 履歴書換えを実施する場合は、全clone・fork・open branchへの影響を合意し、専用maintenance windowを取る。
- **禁止**: owner承認なしにfilter-repo、force push、branch削除を行わない。

### [T2-RANKING-NORM-SSG-01] ranking正規化派生のURL方針

タグ: [種類:意思決定] [実行:対話] [起票:2026-05-25] [領域:データ]

- **owner**: Claude Code
- **次**: queryを別URLへ昇格する案、別rankingKey化、canonical吸収の3案を、検索需要とsnapshot容量で比較する。
- **完了条件**: URL policy、canonical、sitemap、既存queryの扱いを先に決め、実装案を混在させない。

### [NOTE-INS-IMG-HEADING-PLACEMENT-01] ins_img が見出し直前の段落をアンカーにすると画像が見出し直後へずれる

タグ: [種類:不具合] [実行:対話] [起票:2026-09-16] [領域:商品]

- **owner**: 未定
- **問題**: `.claude/scripts/note/editor-helpers.sh` の `ins_img` は、アンカー文字列を含む段落の
  「次の `<p id=>`/`<li>`」を探して画像挿入位置にしているため、アンカー段落の直後が見出し
  (`<h2>`/`<h3>`) だと見出しを読み飛ばし、次セクション先頭の段落の前に画像を置いてしまう
  (実質: 画像が見出しの直後＝意図した位置の1ブロック先にずれる)。2026-09-16、b-kakei-* 8本の
  画像復元時に `audit-note-figure-split.mjs` の misplaced 件数で発覚 (7/8 本で計14枚が該当)。
  内容自体は正しい画像で欠落や誤情報ではないため公開は維持している。
- **試して失敗した案**: アンカー段落自身をそのままクリックし段落末尾へキャレットを置いて
  Enter する変更 → `b-kakei-necktie-decline` で misplaced が 1→2 に悪化して撤回済み
  (原因未特定。`BU state` が出す accessibility tree のダンプ形式の想定が外れている可能性が高い)。
- **次**: 実際に `BU state` の生ダンプ (`/tmp/ns.txt`) を見出し前後の段落で目視してから
  awk の抽出条件を組み直す。ライブの note エディタで最低3パターン (見出し直前 / 見出し無し /
  リスト直前) を実地検証してから全 note 記事へ展開する。
- **禁止**: ライブ DOM の実物を見ずに正規表現だけを推測で直さない (今回の失敗の再発)。
- **完了条件**: 見出し直前アンカーを含む記事で `audit-note-figure-split.mjs` の misplaced が 0。

### [NOTE-RECOVERED-DUPLICATE-CONSOLIDATION-01] recovered-* に同一テーマの重複投稿が残っている

タグ: [種類:意思決定] [実行:対話] [起票:2026-09-16] [領域:商品]

- **owner**: uruhayato373 (どちらを残すかの編集判断)
- **問題**: note全体189本の商品カード監査中に発見。`recovered-n581a1409b2c9` と
  `recovered-ned30a382334d` が同一タイトル「大学数ランキング」、`recovered-n6f8a367906d1` と
  `recovered-nb2d65c42c28b` が同一タイトル「最高気温ランキング」で同日投稿。後者はさらに
  3本目の stub (`n863f429319ca`) と、画像付きで書き直した後継記事 `a-maximum-temperature`
  (現在 status:draft で未公開) も存在する。いずれもチャート画像パイプライン導入前の
  note.com バックフィルによる復元 stub。
- **次**: 各組で「どれを正本として残すか」を決める (後継記事があるものは後継を仕上げて
  公開し、旧stubを非公開化する方針が有力)。どの note 投稿を非公開/削除するかは
  公開済みコンテンツへの不可逆操作なのでオーナー判断が必要。
- **追加の組 (2026-10-11、カバー作り直しの文言作成で判明)**: 最高気温 2024 は `a-maximum-temperature` を含め 4 本が同じ題名で公開中 (`recovered-n6f8a367906d1`・`n863f429319ca`・`nb2d65c42c28b`)。火災死傷者数 2022 の有料 2 本は、題名の比較が食い違う (`paid-n7290144784d4`「鳥取と神奈川で2.5倍」、`paid-nb17d039bc1aa`「鳥取と滋賀で約1.9倍」)。どちらかが誤りなら本文の是正も要る。
- **完了条件**: 各組が1本に統合される、またはそれぞれ独立して残す理由が記録される。

### [TAG-FEATURE-NEED-01] タグ機能は本当に必要か決める
タグ: [UI・UX] [種類:意思決定] [実行:対話] [起票:2026-09-27] [領域:サイト]

利用実績と保守コストを見て、残すか畳むかを決める。（出典: 2026-09-24 の手書きメモ・vault dairy/2026-09-24）

### [DATA-PROCESSING-SIDE-INCOME-01] データ加工を副業収入にできるか検討する
タグ: [収益化] [種類:意思決定] [実行:対話] [起票:2026-09-27] [領域:商品]

stats47 で培ったデータ加工を、受託・販売などの形で収入にできるかを考える。（出典: 2026-09-24 の手書きメモ・vault dairy/2026-09-24）

### [THEME-CHILD-WELFARE-01] 児童福祉・子どもの安全を扱うテーマを新設するか決める

タグ: [コンテンツ品質] [種類:意思決定] [実行:対話] [起票:2026-10-08] [領域:サイト]

- **観測 (2026-10-08)**: 参考文献由来の公開指標 `child-abuse-consultation-cases` (児童虐待相談対応件数) を既存 55 テーマのどれにも採用できなかった
  (theme-designer の判断。保育の需給・ひとり親の主題とは別)。
- **判断すること**: 児童相談・不登校・子どもの貧困などを束ねるテーマを作るか、指標をランキング単体のまま置くか。
- **完了条件**: 新設なら theme-designer がカタログを作り、見送りなら `placement-decisions.ts` の child-abuse-consultation-cases (channel=theme) を rejected と理由に書き換える。

### [KOUMUIN-AI-ENV-SERIES-01] 公務員AIノートに「職場のAI環境別」（庁内AIあり／なし）の記事を足すか決める
タグ: [収益化] [種類:意思決定] [実行:対話] [起票:2026-10-09] [領域:商品]

- **起点**: 2026-10-09 の vault の議論で、業務効率化の解像度を上げる案が出た。総務省の調査（2024-12-31 時点）では、生成AIを導入済みの団体は都道府県 87.2%・指定都市 90.0%・その他の市区町村 29.9%（https://www.soumu.go.jp/main_content/001070295.pdf ほか）。読者の職場は「庁内AIがある（県・政令市）」と「無い（市町村の約7割）」に割れる。
- **既存との差**: `koumuin-claude-code` の 33 本は Claude Code を使える前提で書いていて、職場の環境による分岐を正面から扱っていない。近いのは `02-internal-network-workarounds`・`10-ai-without-personal-info`・`13-ollama-offline-local-llm`。
- **案**: (1) 庁内AIに何を任せ、何を任せないか（判断の型。ツールの操作説明は古くなるので書かない）。(2) AIが無い職場で Excel（Power Query）と Power Automate Desktop（Windows 11 に付属）でできること。
- **決める前に見ること**: vault のコンテンツ戦略SSOT §5 は 2026-09-25 に、公務員AIノートの読者を「業務で困る現役」から「退職・転職を考える公務員」へ寄せた。業務向けの記事を足すのはこの決定の見直しにあたる。商品領域の今の狙い（`ADMIN-STAT-PILOT-01`・家計シリーズの判定 10-13）を先に終える。
- **境界**: 土木職向けの業務の型は doboku-note の DN-0595。QGIS は `GEO-QGIS-DEMAND-01`。
- **完了条件**: 足すか足さないかと、その理由を記録する。足すなら 1 本目の起票をしてから、このカードを削除する。（出典: 2026-10-09 の vault セッション）
