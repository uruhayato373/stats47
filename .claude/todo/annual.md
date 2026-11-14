---
title: 年間計画 (時期が来たら着手するカード)
type: annual-plan
status: active
updated: 2026-11-14
---

# 年間計画

時期や出来事が来るまで着手できないカードの置き場。backlog と同じカード構文で、`[期日:]` (再開日・判定日・再確認日) の月の見出しの下に置く。
週次・月次の計画が期日で拾い、実行するか backlog へ戻す。規約は `.claude/rules/todo-standards.md` §1・§5。

## 2026-11

### [GSC-SOURCE-FRESHNESS-01] GSCのUI監査と既存計測の観測日・取得範囲を揃える
タグ: [インフラ・計測] [種類:改善] [実行:対話] [起票:2026-10-16] [期日:2026-11-14] [領域:サイト] [待ち:観測]

- **済み**: 週次CIのHTML index signal検査の12分上限超過を直して全量2,751 URLを保存した (2026-10-17)。送信済みビューの概要export (`export-coverage-playwright.mjs`) と、`submitted-totals.json`・`data/gsc/coverage-submitted-history.csv` (台帳 `gsc.coverage-submitted`) への記録、鮮度検査 `submitted-view-freshness` (`submittedViewMaxAgeDays: 8`)、KPI `index-coverage-rate` を実装した (11-11、画面操作は未検証)。
- **基準値 (GSC 11-06更新)**: 送信済みは登録6,729・未登録1,977 (検出-未登録1,134 / noindex 578 / クロール済-未登録127 / robots 58 / 404 48 / リダイレクト17 / リダイレクトエラー10 / 5xx 5)、未送信は登録764。追う指標は送信済みの登録率 6,729 / 8,706。
- **次 (11-14の取得の後)**:
  1. `submitted-totals.json` ができ、値が登録6,729・未登録1,977と桁が合うかを確かめる。合わなければzipの中身を読みingestを直す。`~/Downloads` の最後のzipを採るだけで週との照合が無いので、古いzipの混入に注意する。
  2. 最初の行がdevelopに入ったら、`config/datasets.mjs` の `gsc.coverage-submitted` から `planned: true` を外し、その後で `.claude/config/review-wiring.json` の週次・月次入力に `read` を足す (先に足すと `wiring-broken`)。
  3. 概要zipに「確認」列があれば `ingest-gsc-export.py` に足す。
  4. KPIの値が6,729 / 8,706と同じ桁で `data/measurement-cycle/LATEST.md` に出るかを確かめる。
  5. 送信済みビューの理由別ドリルダウンも週次の取得に足す。
- **効果観測の登録 (improvementsの枠待ち)**: activeが5 / 5で空きが無い。枠が空いたら `improvement-triage` で `GSC-THEME-POST-EFFECT-01` (`[kpi: operating-cost]`・`[target: -262 requests]`・期日2026-11-18、基準は11-10〜11-11の24時間のテーマPOST 262件、観測は `data/cloudflare/snapshots/<日付>.json` の `googlebot`) と `GSC-SUBMITTED-INDEX-EFFECT-01` (`[kpi: index-coverage-rate]`・targetなし・期日2026-12-09、基準は登録6,729・未登録1,977) を足す。最短は11-14のnote取得の後に `NOTE-FISCAL-PEER-SALES-01` を判定して閉じること。詳細は `data/improvement/gsc-improvement/improvement-log.md`。
- **元の順序の残り**: sourceごとに観測日・取得日・母集団・標本数・欠測を照合し、最新coverageを既存CSV/manifest gateで取り込むか部分UI監査 (`data/gsc/ui-audits/2026-10-16.json`) を補助証拠に留めるかを決める。HTTP/sitemap collectorの出力との接続を検証して既存キューを保持したまま再構築し、修正版のmain週次CIで新queueとsourceの取得範囲を照合する。集計期間はsearch-growthのObservationと元summaryで照合し、週フォルダ名から推定しない。owner は gsc-analyst。
- **停止条件**: UI例示を全件データと扱わない。欠測を0で埋めない。認証情報を監査JSONへ保存しない。古い入力で新しい状態を巻き戻さない。pendingを母集団の違う旧件数と単純比較しない。
- **完了条件**: 各sourceの鮮度・取得範囲・成功/部分成功/欠測が追跡でき、キュー更新の前後差分とgate結果が残る。source未取得を成功扱いしない。

### [MEASUREMENT-MAC-DIRECT-01] 認証付き計測を土曜の Mac の取得だけにし、残っている CI 専用のコードと Secrets を撤去する
タグ: [インフラ・計測] [種類:改善] [実行:対話] [検証:npm run measurement:test] [起票:2026-10-19] [期日:2026-11-14] [領域:管理] [待ち:観測]

- **済み (2026-11-14・13071e5ef)**: CI 専用のコードを撤去した。collect.mjs の CI の分岐、refresh-session.mjs の --ci と --publish、bootstrap-session.mjs の --publish、set-ci-secret.mjs、auth-recovery.mjs、npm script の auth:ci-secret、auth-credentials.json の ciCredential・ciStored、管理画面 /ops/auth の CI 欄、env-registry.json の 12 行を消し、docs 07 を Mac の取得の仕様に書き直した。入口が残っていないことは measurement.test.mjs のテストが固定している。GitHub Secrets は 2026-11-14 の gh secret list で、MEASUREMENT_SESSION_*・STATS47_AUTH_*・AFB_API_KEY・MOSHIMO の名前が無く、残す方針の MEASUREMENT_VAULT_KEY だけがあることを確かめた。
- **残り**: 上のコミットが develop に入ったあとの最初の土曜の取得 (npm run weekly:collect) を、撤去後のコードで回す。取得のコードを Mac と共有していて、撤去後のコードではまだ実際の取得を回していないため、この 1 回を確認する。失敗した場合は clone (~/stats47-measurement) の git branch --list 'unpushed/*' と ~/Library/Logs/stats47/measurement-collect-local.log を読む。
- **停止条件**: 2 段階認証・CAPTCHA・規約同意を自動化しない。Cookie・API キーを git・ログに出さない。
- **完了条件**: 撤去後のコードでの取得のあと、develop に「authenticated measurement status (Mac)」のコミットが入り、npm run measurement:status に stale と失敗が無い。

### [CI-LEAD-TIME-01] デプロイの skip と指標生成の省略の効果を実測する
タグ: [インフラ・計測] [種類:改善] [実行:対話] [検証:gh run list --workflow deploy-workers.yml] [起票:2026-11-06] [領域:管理] [待ち:観測] [期日:2026-11-20]

- **起点**: 2026-11-06 に `scope` job・`needsMetricMetadata`・`.husky/pre-push`・PR を開く時機の規則を入れた (`.claude/rules/branch-workflow.md`「待ち時間を増やさない運用」)。push から本番まで約 40 分が基準値で、skip の判定と PR の短縮は本番でまだ動いていない。
- **やること**: ① main へ入ったあと、本番に関係しない push で Deploy job が skip されることを run で確かめる ② 関係する push で必ずデプロイされることを確かめる ③ 指標に無関係な PR の Build Check が 10.9 分から約 6.7 分になるかを測る (算式: 10.9 − 生成 4.2) ④ PR 検査の cancel の割合が 21/34 から下がるかを 2 週間後に見る。
- **完了条件**: 4 点の実測を `.claude/rules/branch-workflow.md` に記録している。

### [MINIMUM-WAGE-2026-01] 2026年度地域別最低賃金

タグ: [コンテンツ品質] [種類:制作] [実行:対話] [領域:データ] [待ち:時期] [期日:2026-11-21]

- **owner**: open-data-curator
- **source**: GitHub #652
- **trigger**: 厚生労働省または各地方最低賃金審議会が2026年度の47都道府県別実額を正式公表したとき。
- **次**: 目安額ではなく正式決定額の一次資料を確認し、既存 `minimum-wage-by-region` の年次追加として扱う。
- **完了条件**: 47県の正式額・発効日・前年差を一次資料で照合し、既存keyのR2観測値を更新する。
- **禁止**: 中央審議会の目安額や新聞表を正式額として公開しない。
- **再確認日 (2026-11-14 設定)**: 期日は契機を確かめる日である (2026 年度の決定額が公表済みかを見る)。まだなら期日を延ばす。

### [MUNI-CITY-PAGE-SNIPPET-01] 市区町村ページに、データブックの値から決まった文で組む要約・よくある質問・近い自治体との比較を足す (LLM で書かない)
タグ: [コンテンツ品質] [種類:改善] [実行:対話] [起票:2026-10-28] [領域:サイト] [待ち:時期] [期日:2026-11-21]

- **経緯**: 2026-10-28 のオーナーとの壁打ち。市区町村ページ `/areas/<県>/cities/<市区町村>` (1,741 件) はデータブック化済み (`MUNI-PAGE-QUALITY-01`) だが、本文は値の表と強みのカードだけで、「◯◯市 人口」の問いに文で答える箇所と近い自治体へ移る導線が無い。JSON-LD は `BreadcrumbList` だけ。
- **証拠 (baseline は `MUNI-PAGE-SEO-01` と同じ GSC 2026-W41 rolling28d)**: 市区町村ページ 373 URL = 13 clicks / 2,214 imp / CTR 0.59%。「市・町・村・区 + 人口」の検索語 341 語 = 1,840 imp / CTR 0.11%。
- **書き方の方針**: 1 ページごとに LLM で書かない。`databook.json` の値・年・県内順位・全国順位からテンプレートで文を組む (配信値と食い違わない)。Gemini の解説は市区町村ランキング側 (`MUNI-AI-CONTENT-EXPAND-01`) に限る。
- **次 (実行順)**: ① 要約 2〜3 文: 人口と前回比・県内順位、高齢化率と年少人口割合の県平均・全国平均との差、率の指標で県内の上位と下位を 1 件ずつ ② よくある質問 3〜5 問 (人口は何人か・県内で何位か・高齢化率は・何が多い市か)。FAQ のリッチリザルトは 2023-08 以降 政府・医療系のサイトに限られるので、検索結果への表示は見込まない。見える Q&A は検索語への答えとして置き、`FAQPage` の JSON-LD はランキングと同じ部品を使ってよいが効果判定に入れない ③ 近い自治体との比較: 同じ県で人口が近い 3〜5 自治体 (隣接の判定データがあれば隣接を優先) を見出しの 6 指標で並べ、各ページへリンクする (`nav_click` で計測) ④ JSON-LD に `Place` (`AdministrativeArea`・`containedInPlace` に県) を足す。`Dataset` は `GSC-DATASET-NESTED-SCHEMA-01` の結果が出るまで市区町村ページには付けない ⑤ 値の欠け・0・同順位の文は作らない (その文を出さない)。
- **着手条件**: `MUNI-PAGE-SEO-01` の判定 (2026-11-21) の後に出す。title 変更の効果と混ぜない。
- **検証**: 文の組み立ての単体テスト (欠け・0・同順位・23 区・特別区部)、`npm run content:check`、代表 3 市区町村 (坂出市・千代田区・札幌市) の本番の撮影と DOM 確認、Rich Results Test。
- **判定 (公開後 28 日)**: 市区町村ページの CTR と「市町村 + 人口」の検索語の CTR を `MUNI-PAGE-SEO-01` の after 窓と差の差で比べる。比較ブロックの `nav_click` と市区町村ページ着地の 1 セッションあたりページ数も記録する。
- **停止条件**: 市区町村ページの clicks が直前 28 日比 -10% 以下で、対照群が同じ方向に動いていなければ要約と FAQ を外す。
- **読者の課題 / HARM**: 住んでいる・引っ越し先の市の人口や順位をすぐ確かめたい (M・H)。支払う理由はこの段では無く、PV は AdSense の先行指標。需要の証拠は上の検索語 1,840 imp。要約で CTR が上がるかは未検証。
- **完了条件**: 1,741 件に要約・Q&A・比較・`Place` が出て、28 日の判定がこのカードと `PV-100K-LEVERS-01` のレバー 2 に記録されている。

### [MUNI-TITLE-MAGNITUDE-01] 市区町村ランキングの title・説明文で、1 万〜10 万の値が「1万人」のように丸まって見える
タグ: [コンテンツ品質] [種類:不具合] [実行:対話] [起票:2026-10-28] [領域:サイト] [待ち:時期] [期日:2026-11-21]

- **証拠 (2026-10-28 localhost)**: 北海道の出生数の県別ページの title が「1位 札幌市（1万人）」になる (実値 10,352 人)。共通の整形 `formatReadableMagnitude` (`packages/data-configs/src/unit/unit-display.ts`) が小数 1 桁で丸め、末尾の 0 を落とすため。全国版の title (`buildMunicipalityRankingMeta`) と県別ページ (`buildMunicipalityPrefectureRankingMeta`・要約文) が同じ整形を使う。
- **次**: ① 万の位に切り替える下限を決める (案: 10 万未満は「10,352人」のように桁区切りで書く) ② 整形は単位の正典 (`.claude/rules/unit-semantics-standards.md`) の部品なので、変えるとほかのページの表示も変わる。影響するページを数えてから直すか、市区町村の title だけ別の整形にするかを決める ③ テストで「10,352人」を固定する。
- **同じ整形の別の症状 (2026-10-28)**: 単位が「指数」の指標で「1位 武蔵野市（1.48指数）」「飛島村（2.1指数）」と単位名がそのまま付く。直すときに一緒に扱う。
- **完了条件**: 1 万〜10 万の値が title・説明文で丸めずに読め、テストで固定されている。
- **進捗 (2026-10-28)**: 県別ページ (`/municipalities/ranking/<key>/<県>`) の title・要約は develop の `formatMunicipalityValueText` で「10,352人」「1.48」(指数を付けない) になっており、ページ単位のテスト 2 件で固定した (共通の整形に戻すと落ちる)。**残り**: 全国版の `buildMunicipalityRankingMeta` (`municipality-page-meta.ts`) は `formatReadableMagnitude` のままで「1万人」「1.48指数」が出る。`MUNI-PAGE-SEO-01` の 2026-11-21 の判定の後に同じ整形へ替える (1 行)。

### [THEME-CPI-503-01] テーマ品質監査で consumer-prices ページが 503・タイムアウトになる
タグ: [UI・UX] [種類:不具合] [実行:対話] [起票:2026-10-10] [領域:サイト] [待ち:観測] [期日:2026-11-21]

- **事象**: テーマ品質監査 #1069 (2026-10-05) で `/themes/consumer-prices` (幅 1440) が HTTP 503・h1 の待機タイムアウト・チャート 2 つ欠落 (theme-cpi-heatmap・theme-cpi-profile)。
- **次**: 本番の該当 URL を Googlebot UA で取得して今も 503 かを確かめる。続いていれば Workers の CPU 制限 ([CF-CPU-SURGE-01]) との関係を見る。一時的なら次回監査で解消を確認する。
- **完了条件**: 次のテーマ品質監査で consumer-prices の表示検査が通る。
- **2026-10-23 確認**: Googlebot UA で 3 回とも 200 (3.6〜6.8 秒)、CPI の R2 は 47 県・13 年分ある。次のテーマ品質監査で #1069 が閉じるかを見る。
- **再確認日 (2026-11-14 設定)**: 期日は契機を確かめる日である (次のテーマ品質監査で Issue #1069 が閉じるかを見る)。まだなら期日を延ばす。

### [UI-FOLLOWUP-01] 第 3 波の画面変更で見つけた表示の残り (検算欄の式・タップ領域など)
タグ: [UI・UX] [種類:不具合] [実行:sweep] [起票:2026-11-14] [待ち:観測] [期日:2026-11-21]

- **済み (2026-11-14・3025556f8)**: 表示の 5 件を直した。Geo の検算欄は結果を値に、内訳の式を補足に分け、折り返しの指定を数値タイルの側へ移した。県別の検算ページの人口は整数に丸めた。LinkRowNav のリンクは sm 未満の幅で高さ 44px にした。運営者の写真は 2 ページとも 48px にそろえた。ランキング詳細の「推移」カードは観測が 2 点だけのとき 0 を含む縦軸にした。変更の前後は幅 375px と 1280px の画像で確かめた。
- **残り (計測)**: ranking/total-population の mobile の field LCP は 2026-11-06 の p75 で 4,943ms のままで、lab の LCP 要素は地図でなくバナーや見出しである。初期表示に地図が入る幅で、実ユーザーの LCP と地図の発見の遅れを取り直す。実ユーザーの値は週次 (土曜) の記録から読むので、次の記録が出るまで着手できない。
- **完了条件**: 取り直した計測の結果 (LCP の p75・LCP 要素・取得日・取得コマンド) を `data/improvement/performance-improvement/improvement-log.md` に記録している。
- **再確認日 (2026-11-14 設定)**: 期日は契機を確かめる日である (次の週次記録で LCP を取り直す)。まだなら期日を延ばす。

### [GSC-INTERNAL-DISCOVERY-01] 未登録候補の孤立ページとHTMLリンクの到達経路を是正する
タグ: [コンテンツ品質] [種類:改善] [実行:対話] [起票:2026-10-16] [期日:2026-11-25] [領域:サイト] [待ち:観測]

- **GSC案11 / P2（次に着手）**: GSC-COVERAGE-DEPLOY-01の優先候補から、sitemapだけで発見され内部リンクのないページを抽出する。
- **GSC案12 / P2（次に着手）**: 関連するカテゴリ・調査・県ハブから重要ページへ直接到達できる入口を作る。
- **GSC案13 / P3（条件確認後）**: 操作ボタンや検索フォームでしか到達できない重要ページが確認された場合、hrefのある通常HTMLリンクを補う。
- **owner / 順序**: site-ux-manager・gsc-analyst。既存サイト内リンク監査で優先候補の入口と経路を確認→不足する文脈リンクだけ修正→リンク先の200/canonical/表示を検証する。重複率是正はSITEWIDE-DUPLICATE-LINK-RATIO-01へ接続する。
- **2026-11-01 実測・局所修正（未デプロイ）**: 未完了の県×テーマ401 URLのうち386件に県トップからの`<a href>`が無かったので、`areas/[areaCode]/page.tsx`に残り45テーマを開閉式の「その他のテーマ」として追加した (契約テスト通過)。ランキング487 URL・市区町村ランキング6 URL・Geoデータセット3 URLは既存の入口からHTMLリンクを確認したので一括リンク追加はしない。`/blog/tags`は本番HTMLが「タグはまだありません」で (ビルド時の空R2 fallbackの固定)、タグ一覧ページをruntime描画に変更した。
- **次**: まとまったデプロイ後に ① 県トップ代表HTMLで53リンク・遷移先200/自己canonicalを確認し、同じ固定401 URLを14/28日後のURL Inspectionで追う ② `/blog/tags`のタグリンクと対象`/tag/生活コスト`への到達を実測する。GSC再認証後の新exportが取れるまでは10-17を最新件数と扱わない。
- **停止条件**: 全ページリンクの一括追加をしない。未登録理由を孤立と決めつけない。サイト内リンクが既に十分なら修正を作らず証拠を残す。公開は別途指示で行う。
- **完了条件**: 優先候補ごとに入口・到達経路・修正要否があり、採用した導線がHTMLから辿れる。案13は採否と根拠を残す。
- **2026-11-11 実測 (GSC 最終更新 11-06・本番 HTTP・サイトマップ 11 本)**: 送信済みの「検出 - 未登録」1,134 件は全件「前回のクロール: 該当なし」。先頭 1,000 件はランキング 397・県×テーマ 239・市区町村 133・市区町村ランキング 133・ブログ 68・japan 18。W44 記録のランキング 472 件のうち 451 件は 7-1 時点でサイトマップに載っていた (新規ではない)。4 月の「表示回数 1 以上」集合 (`indexable-ranking-keys.ts`) に入るのは 1 件。ハブ 394 ページ (トップ・/ranking・カテゴリ・テーマ・県・japan・調査・タグ) のサーバー HTML からリンクされないランキングは全体 293/2,596 (11%)、未クロール群 92/472 (19%)。`/ranking` のランキングへのリンクは 4 本、`/category/population` は 22 本。[仮説] 一覧ページからの入口不足が未クロールの一因。孤立は 19% に留まるので主因とは言えない。**次**: `/ranking` と各カテゴリページのサーバー HTML に全ランキングへの `<a href>` を出す案の採否を決め、採るなら固定の 92 URL を 14/28 日後に URL Inspection で追う。
- **カテゴリ・調査ページの全件リンク (2026-11-11 実装・未デプロイ)**: カテゴリと調査のランキング表 (`CategoryRankingTable`) はページ送り (20 行) なので、サーバーの HTML に出るランキングへのリンクは先頭 20 件だけだった (本番 `/category/population` は 156 件中 22 本)。表の下に、畳んだ「全 N 件を名前の一覧で見る」(`RailCard` collapsible + `RailNavRow`。家計のテーマの品目一覧と同じ形) を足した。localhost の実測: `/category/population` はサーバー HTML の `<a>` が 156 本、`/survey/kakei-chousa` は 869 本。畳んだ中身は `hidden` の要素として HTML に入る。重さ: 1 リンク約 360 バイトで、`/category/population` は一覧の HTML が 60KB、`/survey/kakei-chousa` は 339KB (同じ内容が RSC の payload にも入るので増分はその約 2 倍)。`/ranking` の索引ページは 2026-10-28 にオーナー合意した構成なので変えていない。**次**: 本番へ出した後、本番 HTML でリンク数を確かめ、未クロールの固定 92 URL (ハブからリンクが無かったランキング) を 14/28 日後に URL Inspection で追う。家計調査の調査ページの重さを減らすかはオーナー判断。
- **本番反映と確認 (2026-11-11)**: PR #1249 のデプロイ後、Googlebot UA で取得した本番の HTML に、ランキングへの `<a>` が `/category/population` で 156 本、`/survey/kakei-chousa` で 869 本あった。HTML の大きさは 991,538 バイトと 1,983,351 バイト (`/category/population` はデプロイ前 829,367 バイト)。

### [GSC-MESSAGE-TRIAGE-01] GSC通知を現在の問題・処置・確認期日へ対応付ける
タグ: [インフラ・計測] [種類:改善] [実行:対話] [起票:2026-10-16] [期日:2026-11-25] [領域:サイト] [待ち:観測]

- **GSC案39 / P2（次に着手）**: GSC通知を現在の障害・修正後観測・任意改善・実績通知に分類し、同じ原因を既存カードへまとめる。
- **owner / 入力**: gsc-analyst。`data/gsc/ui-audits/2026-10-16.json` の直近16通知と各レポートの現在値。全142通知を確認済みとは扱わない。
- **次 / 順序**: ①重要な未確認通知が残るかを確認する ②各通知に対象種別・現状・対応カード/対応不要理由・次回確認日を対応付ける ③既存週次GSC運用へ分類手順を統合する。単発の運用整備として閉じ、毎週の正常確認をbacklog化しない。
- **停止条件**: 通知の問題種別数を影響URL数と読み替えない。実績通知で不具合を起票しない。新しい常駐collectorや外部通知送信を自動追加しない。
- **完了条件**: 対象通知に未分類がなく、現在の問題は既存カードに接続し、既存運用で再利用する手順と保存先が定まる。
- **2026-11-11 実測 (GSC 最終更新 11-06・本番 HTTP・サイトマップ 11 本)**: 11-09 の通知「サイトマップ内のページが登録されない新しい要因」は robots.txt ブロック (58) とリダイレクト (17)。送信済みビューの noindex 578 件は全件が市区町村ページで、クロール日は 8 月〜10-21 (データブック公開 `436f46b43` より前)。robots ブロックは見えた 10 件が市区町村ページでクロール日は 5 月 (解除 5-23 より前)。サイトマップの市区町村 1,741 件から 70 件を Googlebot UA で取得し全件 200・`index, follow`。両方とも 11-11 に GSC で「修正を検証」を開始した (表示: 検証 開始・開始日 2026/11/11)。**次**: 11-25 以降に検証結果の通知と送信済みビューの 2 件数を読む。合格しなければ残った URL の robots メタと HTTP を読み直す。

### [MUNI-RANKING-EXPANSION-01] 市区町村ランキング拡充 (全量公開 2026-09-01 実施済み・残は SSDS 未使用分)

タグ: [コンテンツ品質] [種類:改善] [実行:対話] [起票:2026-09-01] [領域:データ] [待ち:観測] [期日:2026-11-25]

- **owner**: Claude Code (選定・監査) + オーナー (公開承認)
- **済み (経過の全文は `git log -p -- .claude/todo/backlog.md`)**: 品質監査未了 2 件の判断と SSDS 未使用 733 指標の判定・公開 (2026-10-22、判定の記録 `packages/data-configs/src/geo-scope/municipality-ssds-expansion.ts`)。非 SSDS 第 1 バッチ (住宅・土地統計調査 2023 の 13 指標、2026-10-28、判定の表 `packages/data-configs/src/geo-scope/municipality-housing-survey-expansion.ts`)。
- **残り (次の拡充はここから)**: 非 SSDS 3,349 表 (R2 estat-catalog `npm run estat:catalog:search -- <語> --collect-area 3`) は表ごとに軸 pin 設計が要る長尾。非 SSDS の表は `citySource` が無いと取り込みが市区町村を飛ばす。
  - **次の候補 (第 2 バッチ)**: 国勢調査 2020 の市区町村表 (共働き世帯・従業地など SSDS に無い軸)、経済センサス 2021 の産業別、人口動態の母の年齢別出生。1 バッチ 20 件まで・公開 4 週の計測を次のバッチの条件にする (`SSDS-DEMAND-BATCH-01` と同じ)。
  - 未公開の unknown (火災 2・自動車保険 2・家計の費目 4) は cities.json 不在または監査未了。
- **計測**: 公開後に GSC/GA4 で市区町村面を実測する。pilot の 9/21 判定は confounded (doc 44 記録済み)。
- **関連**: doc 44 WP8 / `MUNI-AI-CONTENT-01` (trigger 1 は成立。trigger 2=解説スロット・3=オーナー承認 は未成立)

### [PRODUCT-FUNNEL-DEPLOY-01] ブログ・ダウンロードの商品導線と地図用ダウンロードを本番に出し、4 週のクリックを測る
タグ: [収益化] [種類:改善] [実行:対話] [起票:2026-10-17] [領域:商品] [待ち:観測] [期日:2026-11-27]

- **中身**: ① ブログ 10 記事のデータ集の案内 (`apps/web/src/features/products/storefront.ts` の `BLOG_DATA_PRODUCTS`) ② CSV ダウンロード後の「業務の資料」回答者への案内 (`findDataProductForRanking`) ③ ランキングの地図用ダウンロード (`/api/ranking/<key>/download?format=kml|geojson`)。2026-10-17 に本番反映 (PR #1143)、マイマップでの読み込み確認と小島の塗り漏れの修正 (`58ae94b91`・PR #1190) は 10-28 に済み。
- **次**: ① 週次の GA4 取得に足した `file-downloads.csv` (`journey-ga4-reports.mjs`、形式 × 指標 × 回数) を最初の土曜の取得で確かめる (`file-downloads.meta.json` に error が無く `kml` / `geojson` の行が出ること。本物の GA4 では未取得) ② 反映日を境界に、4 週の `nav_click` (`surface=blog_product` / `ranking_product`) と `file_download` の形式別を読み、効果判定は improvements へ別 ID で引き渡す。
- **note 素材集の判定 (先に固定)**: 無料記事 2 本 (`h-howto-excel-filled-map`・`h-howto-csv-mojibake`) の末尾に素材集 (`prefecture-map-chart-assets-pack`・¥4,000) への案内を足した。2026-11-27 に、素材集の売上が 2 件以上なら地図の素材を形式別に増やす検討へ進み、0 件なら案内を外す。閲覧が 4 週で 30 未満なら案内の位置の問題として扱う。売上と閲覧は土曜の note ダッシュボードの記録 (`data/note/dashboard/`) で読み、取得に失敗した週は判定不能とする。
- **停止条件**: Workers の CPU が閾値を超える場合 (KML 生成は未計測。`CF-CPU-SURGE-01` と照合) は地図形式を外す。
- **完了条件**: 本番で 3 つの導線が表示・動作し、4 週の計測の開始日が improvements に記録された。

### [AFF-A8-EXPANSION-2026-10] A8 の個人向け高 EPC 案件を提携し、対象ランキングに限って配信する (2026-10-19 オーナー指示)
タグ: [収益化] [種類:改善] [実行:対話] [起票:2026-10-19] [領域:アフィリエイト] [待ち:時期] [期日:2026-11-28]

- **経緯**: オーナー指示「提携できるものは提携して、サイトに展開」。A8 の 572 件を既存の台帳と突き合わせて整理し (法人向け・美容医療・融資・投資勧誘・婚活・占い・探偵・FX と doboku-note との共用案件は除外)、2026-10-19 に 21 件を申請 (申請サイト = 統計で見る都道府県、即時承認 0 件。案件 ID は `data/affiliate/a8-catalog.json`。一覧はこのカードの旧版 `git log -p -- .claude/todo/backlog.md`)。提携済みの 13 件は登録して R2 へ公開し、本番で対象ページだけに出ることを確かめた (`5410e2285`・`e3b8d12fe`、run 39218494350・39220151882)。BBIQ (九州のみ) と創建リフォーム (13 都府県のみ) は地域で絞る手段が無いので見送った。
- **次**: 週次の `check-approval` で申請 21 件の承認を拾い、承認されたものから同じ手順 (案件プロファイル: decision レーン・F3/F4・allowedPageTypes=ranking、広告: `targetRankingKeys` を実在 key 2〜8 件に限定 → develop へ push → `publish-affiliate-ads.yml` → 本番で対象ページだけに出ることを確認) で登録する。掲載 URL の事前提出などを求める案件は、三井住友カードと同じく先に提出する。広告は「ページの意図軸 = 広告の軸」かつ対象ランキングのときだけ出るので、軸の合う対象が 0 件にならないよう確かめる。
- **停止条件**: `targetRankingKeys` なしで decision レーンの案件を登録しない。広告主が求める事前手続きを済ませずに配信しない。
- **完了条件**: 承認済みの対象案件が本番の対象ページに出て、ほかのページに出ない。効果の観測は improvements の別 ID (`[kpi: affiliate-yield]`) へ引き渡す。
- **統合 (2026-10-26 オーナー判断): `AFF-SMBC-NL-01`** 三井住友カード（NL）を A8 で提携し、家計・所得のランキングに限って配信する
  - **本文の欠け (2026-11-13 確認)**: この統合のコミットで、元カード 8 行のうち 5 行 (字下げした続きの行と番号付きの手順) が落ちた。着手の前に `git show 47aa651d1^:.claude/todo/backlog.md` で `[AFF-SMBC-NL-01]` の全文を読み、今の実装と突き合わせて残りを決める。
  - **次 (実行順)**: ① (済) ② `check-approval` で承認を確かめる ③ `harvest --id` で広告コードを取り、案件プロファイル (台帳 `affiliate.offer-profiles`、lane=decision・F4・allowedPageTypes=ranking) と広告 (台帳 `affiliate.ads`、`targetRankingKeys` を提出したページだけに限定) を登録 ④ develop へ push して `publish-affiliate-ads.yml` で R2 へ公開し、本番の対象ページだけにバナーが出て、ほかのページに出ないことを確かめる。
  - **停止条件**: 提出していないページに出る設定 (`targetRankingKeys` なし) で登録しない。承認前にバナーを置かない。
  - **完了条件**: 提出したページの本番 HTML に広告が出て、それ以外のページに出ない。効果の観測は improvements の別 ID (`[kpi: affiliate-yield]`) へ引き渡す。
- **再確認日 (2026-11-14 設定)**: 期日は契機を確かめる日である (申請済みの案件に A8 側の承認が出たかを見る)。まだなら期日を延ばす。

### [CI-SPEED-STATIC-GATES-HEAVY-STEPS-01] Static Gates の重い step (Commit-back Contract 115 秒 / SEO Meta Factual 46 秒) を軽くするか scheduled へ寄せる
タグ: [インフラ・計測] [種類:改善] [実行:対話] [検証:node .claude/scripts/lib/check-runtime-budget.cjs] [起票:2026-09-18] [期日:2026-11-30] [領域:管理] [待ち:観測]

- **済み (2026-11-14・e541e1997)**: 4 step (Workflow Commit-back / SEO Meta Factual / Image Generation Pipeline / Theme Portfolio State) の予算を `.claude/config/check-runtime-budgets.json` の `ciSteps` に合計 100 秒で登録した。各 step は末尾で `check-runtime-budget.cjs --ci-step <name> --elapsed-sec "$SECONDS"` を呼び、予算超過は警告、予算の 2 倍超過は step の失敗になる。SEO Meta Factual の R2 読み取りは 16 並列から 48 並列にした。統合していた DOCS-CHECK-CI-SPEED-01 は、Docs Governance and Link Guard が CI で 1 秒、手元の `npm run docs:check` が 1.7 秒で、直す対象が無かった。
- **残り**: このコミットが載った PR の PR Quality Check で、4 step の所要秒を `gh run view <run id> --json jobs` から読み、合計が 100 秒以下かを 3 run 以上で確かめる。変更前の 5 run (2026-11-13) は合計 82〜107 秒で、内訳は Commit-back 1 秒、SEO Meta Factual 19〜24 秒、Image Generation Pipeline 30〜41 秒、Theme Portfolio State 27〜41 秒だった。
- **残り (合計が 100 秒を超える run が残った場合)**: Image Generation Pipeline は型検査 18.8 秒と vitest 14.5 秒が直列なので、並べて走らせるか差分連動にする。Theme Portfolio State は 45 本のテストファイルのうち 19 本が tsx で指標の定義 3,342 本を読み込み、プロセスの起動が所要の大半を占めるので、読み込みを減らすか差分連動と週次の全数に分ける。
- **完了条件**: 変更後の 3 run 以上で 4 step の合計が 100 秒以下であり、`node .claude/scripts/lib/check-runtime-budget.cjs` が通る。

### [R2-AUTHORITATIVE-GUARD-ENFORCE-01] R2 の正本の上書きと読み戻しの止めを、CI でも「止める」に切り替える
タグ: [インフラ・計測] [種類:改善] [実行:対話] [起票:2026-11-14] [領域:管理] [待ち:時期] [期日:2026-11-28]

- **済み (2026-11-14)**: 区分表 `packages/r2-storage/src/scripts/r2-key-classes.ts` と `diff-push-r2.ts` の止めを入れ、正本を更新する workflow 10 本に `--allow-authoritative-overwrite` を付けた。CI では当面、正本の上書きと読み戻しの不一致を警告して続行する。
- **着手の契機**: フラグ付きの YAML が main に出ること (定期実行は main の workflow 定義で動く)。期日は契機を確かめる日で、まだなら延ばす。
- **やること**: (1) main に出た後の定期実行 (data-refresh・sync-snapshots・blog-auto-publish・quality-suite-weekly・affiliate-ga4-weekly ほか) を一巡ぶん見て、`R2 authoritative overwrite` と `R2 readback mismatch` の警告注釈が出ていないかを確かめる。出ていれば、その呼び出しにフラグを足すか区分表を直す (特に `.claude/skills/db/sync-snapshots/run.sh` の全体 push と `publish-blog.yml` の索引の push)。(2) 本物の R2 で、1 回の PutObject の ETag が MD5 になること、空の prefix の一覧がエラーにならないことを run のログで確かめる。(3) 警告が 0 になったら、R2 に書く workflow の env に `R2_AUTHORITATIVE_GUARD: enforce` を足す。(4) 定着したら `resolveAuthoritativeGuardMode` の CI の既定を enforce に変え、`r2-storage-design.md`「書き込みの承認」の段階導入の項を消す。
- **完了条件**: CI の既定が enforce で、正本を上書きする workflow がすべてフラグを明示し、直近 1 週の定期実行に警告注釈も失敗も無い。

## 2026-12

### [DEPS-DEPENDABOT-GROUP-01] dependabot の next・sharp の更新を、ルートの overrides と同じ PR で上げる
タグ: [インフラ・計測] [種類:改善] [実行:対話] [起票:2026-10-10] [領域:管理] [待ち:時期] [期日:2026-12-01]

- **trigger**: 次に dependabot が next または sharp の更新 PR を作ったとき (それまでは [DEPS-OVERRIDES-DRIFT-GATE-01] の検査が食い違いを止める)。
- **事象**: 2026-10-10 は next の更新が 2 本 (#1102 ルート・#1117 apps/web)、sharp が 1 本 (#1087) に分かれ、どれもルートの overrides を上げなかった。
- **手順**: `.github/dependabot.yml` で next・sharp を `groups` にまとめる。dependabot が overrides を書き換えない場合は、更新 PR に overrides を足す手順を `/deploy` の依存更新の節に書く。
- **完了条件**: 次の next / sharp の更新が 1 本の PR になり、overrides も同じ版に上がっている。
- **再確認日 (2026-11-14 設定)**: 期日は契機を確かめる日である (dependabot が next か sharp の更新 PR を作ったかを見る)。まだなら期日を延ばす。

### [E2E-FAILURE-EVIDENCE-01] 代表 E2E が落ちても、サーバーの例外と R2 の取得失敗が残らない
タグ: [インフラ・計測] [種類:改善] [実行:sweep] [起票:2026-10-23] [領域:管理] [待ち:観測] [期日:2026-12-15]

- **済み (2026-11-14・`b2de4ce53`)**: 追加した 2 つのテストは修正前に落ち、修正後は r2-overlay-server.test.mjs の 6 件が全て通った。preflight:pr、workflow policy audit、2 つの tsc、pre-commit も通り、b2de4ce53 の 1 コミットになった。
- **残り (観測)**: 実際に E2E が落ちた run で、サーバーの例外とオーバーレイの upstream error が artifact から読めることを 1 回確かめる。次に E2E が落ちた PR の run で確かめれば足りる (確認のためだけに落とす PR は作らない)。
- **完了条件**: 落ちた run の artifact に 2 つのログがあり、原因の行が読める。
- **再確認日 (2026-11-14 設定)**: 期日は契機を確かめる日である (E2E が落ちた run の artifact でログが読めるかを見る)。まだなら期日を延ばす。

### [FISHERY-2024-DB-01] 漁獲量の 12 指標に 2024 年を足す (e-Stat に 2024 年のデータベースの表が出たら)
タグ: [コンテンツ品質] [種類:改善] [実行:対話] [起票:2026-10-21] [領域:データ] [待ち:時期] [期日:2026-12-15]

- **経緯**: `DATA-QUALITY-LOOP-01` ③ (2026-10-21) で、`fishery-species-catch-mackerel` などの配信の最新は 2023 年だった。農水省の令和6年 (2024) 確報は e-Stat に Excel だけで公表され (表 2-2 `stat_infid=000040415922`)、データベースの 2024 年の表は 0 件 (2026-10-21)。12 魚種の指標 (`fishery-species-catch-*`) は 2023 年を 2-2 表 `0004043248` から `supplementalSources` で補っている。
- **trigger**: e-Stat のデータベース検索 (`https://www.e-stat.go.jp/stat-search/database?page=1&toukei=00500216&layout=dataset&year=20240`) に 2024 年の 2-2 表が出たとき。
- **次**: 2023 年と同じ形で 12 指標の `supplementalSources` に 2024 年を足す (分類コードと地域軸は表のメタ情報で確かめる) → data-refresh の dryRun → オーナー承認 → R2 反映。`FISHERY-SPECIES-REFRESH-01` のブログも取り直しの対象になる。
- **完了条件**: 12 指標の最新年が 2024 年になり、海のある 39 都道府県の値がそろっている。
- **再確認日 (2026-11-14 設定)**: 期日は契機を確かめる日である (e-Stat のデータベースに 2024 年の表が出たかを見る)。まだなら期日を延ばす。

### [MUNI-DATA-PRODUCT-PILOT-01] 市区町村の製造品出荷額を「組替済み時系列 CSV＋GeoJSON」の1商品にし、6週で売れるかを確かめる
タグ: [収益化] [種類:制作] [実行:対話] [起票:2026-10-28] [領域:商品] [待ち:観測] [期日:2026-12-16]

- **経緯**: 2026-10-28 のオーナーとの壁打ちで、市区町村 × GIS を次の展開の軸にし、加工済みデータを売る案が出た (調査は vault `memos/stats47_悩み起点リサーチ.md` §7・§8)。
- **読者の課題 / HARM**: 仕事で市区町村データを使う人が、最新の境域でそろった表と地図をすぐ作れない (A・M)。公的な無料データは境域が古いか1表ずつに分かれ、合併の組替と境界データとの結合が手作業になる。
- **提供価値・支払う理由**: ランキングと地図は無料のまま。有料は「組替済み時系列 CSV＋GeoJSON＋出典・注記」の1テーマ1ファイル (¥980〜2,980)。比べる相手は東洋経済『都市データパック』(¥24,200〜) で、必要な1テーマだけを安く買える。境界データと合併履歴は無料で出回るので、売り物は組替済みの時系列の値に絞る。買い手の主役は計画策定を受けたコンサルの担当者。
- **需要の証拠**: GSC「製造品出荷額 ランキング 市町村」CTR 46%・平均1.3位、該当ページは28日で390クリック。note の売上2件は e-Stat × Claude Code × 自治体の統計業務。**データ単品が売れるかは未検証**。
- **販売条件 (`MUNI-DATA-LICENSE-CHECK-01`)**: 値の CSV と結合キーは出典・加工の記載で売ってよい。境界は N03・Geoshape (販売は測量法第29条の申請が要ると判定) を使わず、e-Stat「令和2年国勢調査 町丁・字等境界データ」を市区町村に結合して同梱する。
- **子カード (実行順)**: 🔴 `MUNI-DATA-LICENSE-CHECK-01` (販売条件) → 売って計測 (2026-11-04 に note ¥980 で販売開始・ランキングに案内。6 週の計測は `data/business/experiments.json` の EXP-007 が running で持つ。判定日 2026-12-16。週次で案内のクリックと note の販売数を読み、判定日に本カードの基準で続ける・変える・止めるを決める)。次の候補 🟢 `MUNI-PEER-DATASET-01` (EXP-012) は本カードの判定後。
- **次 (実行順)**: ① 製造品出荷額の市区町村データを最新境域へ組み替えた時系列と、結合済み GeoJSON を作る (既存の cities 指標と ETL を使う。出典・年次・組替の注記を付ける) ② 価格と販売面 (stats47 の note) を決める ③ 該当ページに「このデータを CSV＋地図データで」の1行 CTA を置き、`nav_click` で計測する ④ オーナー承認と人手ログインで公開し、6週の CTA クリックと販売を販売台帳 (`npm run products:sales --workspace=@stats47/product-factory`) に記録する。
- **データ完成 (2026-11-04)**: `node --import tsx .claude/scripts/products/build-muni-data-product.mjs --metric manufacturing-shipment-amount --skip-geo` で `.local/muni-data-products/manufacturing-shipment-amount/` に CSV (1,719 自治体 × 44 年 = 75,636 行)・区の別表 (8,536 行)・検算表・README・境界 GeoJSON (1,719 地物) がある。全国合計は 2,068 件の照合で未説明の差 0 件、2023 年の差は 0.02%。e-Stat の記号は CI (`muni-data-symbols.yml`) で取り込み済みで、X 1,801・− 2,473、R2 との値の差 0 件、統計表は 0000020203。頂点の 5% 間引きは見た目で決めた暫定値で、県境の隙間の量は測っていない。公開リポジトリなので販売物を CI の artifact に載せない。2 テーマ目は specs に 1 件足す。
- **判定 (6週)**: CTA クリック率2%以上 (28日でおよそ8クリック) かつ販売3件以上なら、2テーマ目 (財政指標) へ進む。1〜2件なら価格かテーマを1回だけ変えて再判定する。0件ならデータ販売は止め、同じデータを無料配布 (被リンク・権威) に回す。
- **台帳**: `data/business/experiments.json` の EXP-007。
- **関係**: `KNOWHOW-PRODUCT-PILOT-01` と並行して出してよい (収益化戦略 §7)。行政の業務向けデータ商品は `ADMIN-STAT-PILOT-01`、市区町村ページの拡大は `MUNI-RANKING-EXPANSION-01`。
- **禁止**: 元データの利用規約 (政府統計は出典明記で二次利用可) を確かめずに売らない。参考文献の書籍の図・構成・数値を商品に使わない (`publicOriginalReuse: forbidden`)。
- **完了条件**: 1商品の6週の CTA クリックと販売数 (0件なら0件と考えられる理由) が台帳にあり、続ける・変える・止めるのどれかをオーナーが決めた。

### [MUNI-PEER-DATASET-01] 1 自治体と類似団体の現況データ一式 (計画策定の現況分析向け) を作るかを、EXP-007 の結果を見て決める
タグ: [収益化] [種類:意思決定] [実行:対話] [起票:2026-10-28] [領域:商品] [待ち:観測] [期日:2026-12-19]

- **再開条件**: EXP-007 (`MUNI-DATA-PRODUCT-PILOT-01`) の判定で販売 1 件以上。
- **打ち手台帳**: EXP-012 (proposed)。着手は EXP-007 (`MUNI-DATA-PRODUCT-PILOT-01`) の判定の後。
- **読者の課題 / HARM**: 計画策定を受けたコンサル・自治体の担当者が、対象自治体と類似団体の現況指標を集めてそろえる手間 (A＋M)。計画策定の委託は 1 件 ¥300 万〜3,000 万で、データ整理と地図化は再委託先に出ている (調査 §8)。データ一式の購入は未検証。
- **次**: ① EXP-007 で売れたら、類似団体の定義 (総務省の類似団体区分) と指標のセットを決める ② 1 自治体分の見本を作り、`ADMIN-STAT-PILOT-01` の聞き取り相手に見せて使えるかを聞く ③ 値付けと判定の基準を決めて台帳に書き、running にする。
- **完了条件**: 作る・作らないが決まり、作るなら指標・判定日・停止条件が台帳 EXP-012 にある。
- **再確認日 (2026-11-14 設定)**: 期日は契機を確かめる日である (EXP-007 の判定 (販売 1 件以上) が出たかを見る)。まだなら期日を延ばす。

### [SNS-REFERRAL-MEASURE-01] X・Instagram・Threads からサイトへの送客を流入元別に毎月測り、SNS 領域の構えを判断する材料にする
タグ: [SNS・マーケ] [種類:改善] [実行:対話] [起票:2026-10-07] [領域:SNS] [待ち:観測] [期日:2026-12-19]

- **前提 (実測)**: GA4 の Organic Social は 28 日 (09-06〜10-03) で 98 セッション・248 PV (サイト全体の 0.6%)。
- **済 (2026-10-19)**: ① 週次の GA4 取得 (`fetch-ga4-snapshot.mjs` の `MEASUREMENT_REPORTS`) に `referral-sources` を足し、日本の Organic Social と Referral を流入元・メディア・チャネル別に `data/ga4/snapshots/<週>/referral-sources.csv` (rolling28d) へ保存する。自分の商品 (Kindle・note 本文) からの流入は `PRODUCT-REFERRAL-MEASURE-01` が `product-inbound.csv` で別に取る。
- **次**: ② 月次レビューで、媒体ごとの送客セッションと投稿数を並べる ③ 2 か月分がそろったら、SNS 領域を「維持」のままにするか、送客の多い媒体だけ投稿を増やすかを決める。
- **統合 (2026-10-26 オーナー判断): `SNS-SITE-FUNNEL-01`** 投稿からサイトへの流入の経路 (プロフィールのリンク・投稿の誘導・UTM) を見直し、既存の計測 (GA4 の参照元・`nav_click`) で前後を比べられる形にする。
- **停止条件**: 送客が測れないうちに投稿を増やさない。インプレッションやいいねを送客の代わりにしない。
- **完了条件**: 媒体別の送客が 2 か月分記録され、SNS 領域の構えの判断が領域の台帳 `data/business/domain-stances.json` に反映されている。

## 2027-01

### [NOTE-PAID-MANUSCRIPT-SYNC-01] API パッチで変えた有料記事 6 本の private R2 原稿を live 本文に追従させる

タグ: [エージェント・SSOT] [種類:改善] [実行:sweep] [起票:2026-09-20] [領域:商品] [待ち:時期] [期日:2027-01-31]

- **owner**: note-manager
- **背景**: 2026-09-20 に `patch-note-paid-landing.mjs` で d-kakei / d-geo 4 本 / 財政 ¥200 の無料部分を live で直接更新した。
  変更内容は `data/note/paid-landing/<key>.json` (git) にあるが、private R2 (`stats47-private/note/…/draft.md`) の原稿は改稿前のまま。
- **trigger**: 有料記事の原稿を private R2 から復元して再公開する作業が発生したとき、または paid-landing spec を持つ記事が 10 本を超えたとき。
- **次**: `npm run note:article -- checkout <key>` で原稿を取り出し、spec 適用後の無料部分を draft.md に反映して `save` する
  (所有者 API の全文から作る `--from-live` が要るなら note-article.mjs に足す)。d-kakei は 2026-10-13 に台帳と private R2 へ入った。
- **完了条件**: spec を持つ全記事について private R2 の原稿 SHA が live 本文から再現できる。
- **再確認日 (2026-11-14 設定)**: 期日は契機を確かめる日である (原稿の復元・再公開が発生したか、spec 付き記事が 10 本を超えたかを見る)。まだなら期日を延ばす。

## 2027-03

### [DATA-SHUKUHAKU-CORRECTION-01] 宿泊旅行統計の 2026 年分を足すときに、層化基準の変更による系列の断絶を書く
タグ: [コンテンツ品質] [種類:改善] [実行:対話] [起票:2026-10-08] [領域:データ] [待ち:時期] [期日:2027-03-01]

- **trigger**: 社会・人口統計体系の `0000010107` (G7101〜G7103) か `0000010207` (#G04308) に 2026 年の値が載ったとき。
  観光庁「宿泊旅行統計調査」のページ (`https://www.mlit.go.jp/kankocho/tokei_hakusyo/shukuhakutokei.html`) によると、
  2026 年 1 月分から層化基準が従業者数から客室数に変わった。
- **次**: 4 指標の `years.to` を 2026 にするときは、系列の断絶を metric config の `note` と観光テーマの「客室稼働率と宿泊供給の参考」章の説明に書く。
  社会・人口統計体系が引き続き「従業者数10人以上の施設」の値を収めるかを、e-Stat の項目定義 (`https://www.e-stat.go.jp/koumoku/koumoku_teigi/G`) で確かめてから書く。
- **済 (2026-10-08)**: 正誤表 (令和 7 年 8 月 26 日) は全施設の推計値の訂正で、社会・人口統計体系の 4 項目 (従業者数10人以上の施設) とは別系列なので R2 の値をそのまま使う。4 指標の説明の範囲と観光テーマの章の説明は直した。
- **完了条件**: 2026 年の値を取り込んだ 4 指標に、系列の断絶が note と章の説明に書かれている。
- **再確認日 (2026-11-14 設定)**: 期日は契機を確かめる日である (社会・人口統計体系に 2026 年の値が載ったかを見る)。まだなら期日を延ばす。
