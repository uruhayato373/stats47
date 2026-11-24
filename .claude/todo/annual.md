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

### [RELEASE-1122-CHECK-01] 11-22 のリリースの後に、定期実行の直しが効いたかを確かめる
タグ: [インフラ・計測] [種類:改善] [実行:対話] [起票:2026-11-22] [期日:2026-11-29] [領域:サイト] [待ち:時期]

- **確かめること (11-29 の土曜の後)**: ① search-growth が workflow_run で起動した (`gh api "repos/uruhayato373/stats47/actions/workflows/search-growth-weekly.yml/runs?event=workflow_run" --jq .total_count` が 1 以上。名前の `+` を逃がした・CI-SCHEDULE-FOLLOWUP-01 を閉じたときの残り) ② 土曜の週次の記録コミットで `contents/blog` の公開済みの取り残し 236 本が消えた (掃除の判定を直した) ③ backlog-loop-daily が週 1 回動いた ④ Gemini の日次が main の定義で 47 件の key も生成している (11-22 に develop で確かめた run 44992638911)。
- **次**: 動いていなければ、run のログで原因を確かめて backlog に起票する。
- **完了条件**: ①〜④ の結果がこのカードに書かれ、カードを消した。


### [GSC-SOURCE-FRESHNESS-01] GSCのUI監査と既存計測の観測日・取得範囲を揃える
タグ: [インフラ・計測] [種類:改善] [実行:対話] [起票:2026-10-16] [期日:2026-11-28] [領域:サイト] [待ち:観測]

- **済み**: 週次CIのHTML index signal検査の12分上限超過を直して全量2,751 URLを保存した (2026-10-17)。送信済みビューの概要export (`export-coverage-playwright.mjs`) と、`submitted-totals.json`・`data/gsc/coverage-submitted-history.csv` (台帳 `gsc.coverage-submitted`) への記録、鮮度検査 `submitted-view-freshness` (`submittedViewMaxAgeDays: 8`)、KPI `index-coverage-rate` を実装した (11-11、画面操作は未検証)。
- **基準値 (GSC 11-06更新)**: 送信済みは登録6,729・未登録1,977 (検出-未登録1,134 / noindex 578 / クロール済-未登録127 / robots 58 / 404 48 / リダイレクト17 / リダイレクトエラー10 / 5xx 5)、未送信は登録764。追う指標は送信済みの登録率 6,729 / 8,706。
- **次 (11-14の取得の後)**:
  1・2 は済み (2026-11-24): 11-21 の取得で `data/gsc/coverage-drilldown/2026-W47/submitted-totals.json` と 2026-W47 の行 (登録 7,967・未登録 1,448) ができ、基準 (11-06 の 6,729 / 1,977) と同じ桁。`planned` の印は `d9e312314` で外れ、`.claude/config/review-wiring.json` の週次・月次入力に read を足した。
  3. 概要zipに「確認」列があれば `ingest-gsc-export.py` に足す。
  4. KPIの値が同じ桁で `data/measurement-cycle/LATEST.md` に出るかを確かめる (11-24 時点の LATEST.md は 2026-W46 の窓で missing。11-28 の計測の後に読む)。
  5. 送信済みビューの理由別ドリルダウンも週次の取得に足す。
- **効果観測の登録 (improvementsの枠待ち)**: activeが5 / 5で空きが無い。枠が空いたら `improvement-triage` で `GSC-THEME-POST-EFFECT-01` (`[kpi: operating-cost]`・`[target: -262 requests]`・期日2026-11-18、基準は11-10〜11-11の24時間のテーマPOST 262件、観測は `data/cloudflare/snapshots/<日付>.json` の `googlebot`) と `GSC-SUBMITTED-INDEX-EFFECT-01` (`[kpi: index-coverage-rate]`・targetなし・期日2026-12-09、基準は登録6,729・未登録1,977) を足す。`NOTE-FISCAL-PEER-SALES-01` は11-15に判定不能で、期日を12-07へ延ばしたため枠は空かない。最短は `RELATED-ARTICLES-EFFECT-01` など他の施策を判定して閉じること。詳細は `data/improvement/gsc-improvement/improvement-log.md`。
- **元の順序の残り**: sourceごとに観測日・取得日・母集団・標本数・欠測を照合し、最新coverageを既存CSV/manifest gateで取り込むか部分UI監査 (`data/gsc/ui-audits/2026-10-16.json`) を補助証拠に留めるかを決める。HTTP/sitemap collectorの出力との接続を検証して既存キューを保持したまま再構築し、修正版のmain週次CIで新queueとsourceの取得範囲を照合する。集計期間はsearch-growthのObservationと元summaryで照合し、週フォルダ名から推定しない。owner は gsc-analyst。
- **停止条件**: UI例示を全件データと扱わない。欠測を0で埋めない。認証情報を監査JSONへ保存しない。古い入力で新しい状態を巻き戻さない。pendingを母集団の違う旧件数と単純比較しない。
- **完了条件**: 各sourceの鮮度・取得範囲・成功/部分成功/欠測が追跡でき、キュー更新の前後差分とgate結果が残る。source未取得を成功扱いしない。
- **期日の引き直し (2026-11-24)**: 1・2 は済み。11-28 の計測の後に KPI の出方 (4) を読み、3・5 に進む

### [MEASUREMENT-MAC-DIRECT-01] 認証付き計測を土曜の Mac の取得だけにし、残っている CI 専用のコードと Secrets を撤去する
タグ: [インフラ・計測] [種類:改善] [実行:対話] [検証:npm run measurement:test] [起票:2026-10-19] [期日:2026-11-28] [領域:管理] [待ち:観測]

- **済み (2026-11-14・13071e5ef)**: CI 専用のコードを撤去した。collect.mjs の CI の分岐、refresh-session.mjs の --ci と --publish、bootstrap-session.mjs の --publish、set-ci-secret.mjs、auth-recovery.mjs、npm script の auth:ci-secret、auth-credentials.json の ciCredential・ciStored、管理画面 /ops/auth の CI 欄、env-registry.json の 12 行を消し、docs 07 を Mac の取得の仕様に書き直した。入口が残っていないことは measurement.test.mjs のテストが固定している。GitHub Secrets は 2026-11-14 の gh secret list で、MEASUREMENT_SESSION_*・STATS47_AUTH_*・AFB_API_KEY・MOSHIMO の名前が無く、残す方針の MEASUREMENT_VAULT_KEY だけがあることを確かめた。
- **残り**: 上のコミットが develop に入ったあとの最初の土曜の取得 (npm run weekly:collect) を、撤去後のコードで回す。取得のコードを Mac と共有していて、撤去後のコードではまだ実際の取得を回していないため、この 1 回を確認する。失敗した場合は clone (~/stats47-measurement) の git branch --list 'unpushed/*' と ~/Library/Logs/stats47/measurement-collect-local.log を読む。
- **停止条件**: 2 段階認証・CAPTCHA・規約同意を自動化しない。Cookie・API キーを git・ログに出さない。
- **完了条件**: 撤去後のコードでの取得のあと、develop に「authenticated measurement status (Mac)」のコミットが入り、npm run measurement:status に stale と失敗が無い。
- **期日の引き直し (2026-11-24)**: 11-21 の Mac の取得 (8512b1f34) は gsc・a8・note・rakuten が pass、kdp が failed。kdp の再認証の後の取得で完了条件を読む

### [MUNI-CITY-PAGE-SNIPPET-01] 市区町村ページに、データブックの値から決まった文で組む要約・よくある質問・近い自治体との比較を足す (LLM で書かない)
タグ: [コンテンツ品質] [種類:改善] [実行:対話] [起票:2026-10-28] [領域:サイト] [待ち:時期] [期日:2026-11-27]

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
- **期日の引き直し (2026-11-24)**: 着手条件の MUNI-PAGE-SEO-01 の判定が W48 の Should (11-26)

### [MUNI-TITLE-MAGNITUDE-01] 市区町村ランキングの title・説明文で、1 万〜10 万の値が「1万人」のように丸まって見える
タグ: [コンテンツ品質] [種類:不具合] [実行:対話] [起票:2026-10-28] [領域:サイト] [待ち:時期] [期日:2026-11-27]

- **証拠 (2026-10-28 localhost)**: 北海道の出生数の県別ページの title が「1位 札幌市（1万人）」になる (実値 10,352 人)。共通の整形 `formatReadableMagnitude` (`packages/data-configs/src/unit/unit-display.ts`) が小数 1 桁で丸め、末尾の 0 を落とすため。全国版の title (`buildMunicipalityRankingMeta`) と県別ページ (`buildMunicipalityPrefectureRankingMeta`・要約文) が同じ整形を使う。
- **次**: ① 万の位に切り替える下限を決める (案: 10 万未満は「10,352人」のように桁区切りで書く) ② 整形は単位の正典 (`.claude/rules/unit-semantics-standards.md`) の部品なので、変えるとほかのページの表示も変わる。影響するページを数えてから直すか、市区町村の title だけ別の整形にするかを決める ③ テストで「10,352人」を固定する。
- **同じ整形の別の症状 (2026-10-28)**: 単位が「指数」の指標で「1位 武蔵野市（1.48指数）」「飛島村（2.1指数）」と単位名がそのまま付く。直すときに一緒に扱う。
- **完了条件**: 1 万〜10 万の値が title・説明文で丸めずに読め、テストで固定されている。
- **進捗 (2026-10-28)**: 県別ページ (`/municipalities/ranking/<key>/<県>`) の title・要約は develop の `formatMunicipalityValueText` で「10,352人」「1.48」(指数を付けない) になっており、ページ単位のテスト 2 件で固定した (共通の整形に戻すと落ちる)。**残り**: 全国版の `buildMunicipalityRankingMeta` (`municipality-page-meta.ts`) は `formatReadableMagnitude` のままで「1万人」「1.48指数」が出る。`MUNI-PAGE-SEO-01` の 2026-11-21 の判定の後に同じ整形へ替える (1 行)。
- **期日の引き直し (2026-11-24)**: 着手条件の MUNI-PAGE-SEO-01 の判定が W48 の Should (11-26)

### [UI-FOLLOWUP-01] 第 3 波の画面変更で見つけた表示の残り (検算欄の式・タップ領域など)
タグ: [UI・UX] [種類:不具合] [実行:sweep] [起票:2026-11-14] [待ち:観測] [期日:2026-11-28]

- **済み (2026-11-14・3025556f8)**: 表示の 5 件を直した。Geo の検算欄は結果を値に、内訳の式を補足に分け、折り返しの指定を数値タイルの側へ移した。県別の検算ページの人口は整数に丸めた。LinkRowNav のリンクは sm 未満の幅で高さ 44px にした。運営者の写真は 2 ページとも 48px にそろえた。ランキング詳細の「推移」カードは観測が 2 点だけのとき 0 を含む縦軸にした。変更の前後は幅 375px と 1280px の画像で確かめた。
- **残り (計測)**: ranking/total-population の mobile の field LCP は 2026-11-06 の p75 で 4,943ms のままで、lab の LCP 要素は地図でなくバナーや見出しである。初期表示に地図が入る幅で、実ユーザーの LCP と地図の発見の遅れを取り直す。実ユーザーの値は週次 (土曜) の記録から読むので、次の記録が出るまで着手できない。
- **完了条件**: 取り直した計測の結果 (LCP の p75・LCP 要素・取得日・取得コマンド) を `data/improvement/performance-improvement/improvement-log.md` に記録している。
- **再確認日 (2026-11-14 設定)**: 期日は契機を確かめる日である (次の週次記録で LCP を取り直す)。まだなら期日を延ばす。
- **期日の引き直し (2026-11-24)**: 実ユーザーの LCP は土曜の週次記録から読む

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

### [BACKLOG-LOOP-WEEKLY-ENABLE-01] バックログ自動処理 (週 1 回) を GitHub 側で有効にする
タグ: [エージェント・SSOT] [種類:改善] [実行:ユーザー] [起票:2026-11-14] [領域:管理] [待ち:時期] [期日:2026-11-28]

- **済み (2026-11-14)**: 対象を「sweep・機械を宣言し、待ちの無いカード」に絞り、不具合 → 今月の重点領域 → tier → 起票日の順に並べるよう直した。schedule は日曜 01:30 JST の週 1 回にした。
- **着手の契機**: この変更が main に出ること (定期実行は main の workflow 定義で動く)。期日は契機を確かめる日で、まだなら延ばす。
- **やること (オーナー)**: `node .claude/scripts/backlog-loop/build-backlog-queue.mjs --dry-run --top 10` で先頭の並びを見てから、`gh workflow enable backlog-loop-daily.yml` を打つ。あわせて `backlog-routing-policy-weekly.yml` の定期実行を戻すかを決める (自動化インベントリに「自動処理を再開するときに戻す」とある)。
- **確認**: 最初の run で、処理した 2 件が queue の先頭と一致し、ledger の evidence に選んだ理由が入っている。先頭に並ぶ 2026-10-11 起票の UI-FIX-* 9 枚が、その後の週次の監査で出し直されていない古い指摘なら、先に閉じる。
- **完了条件**: 週次の run が 2 週続けて成功し、処理したカードが優先順位どおりである。

### [SEO-KEYWORD-EDITABLE-PATH-01] キーワード改善サイクルが ranking / themes の定義ファイルを見つけられず、改善案を自動適用できない
タグ: [エージェント・SSOT] [種類:不具合] [実行:sweep] [起票:2026-10-19] [領域:サイト] [期日:2026-11-28] [待ち:観測]

- **経緯**: `.claude/scripts/search-growth/keyword-cycle.mjs` の `editableFile()` が古い置き場 (`packages/data-configs/src/{metrics,theme-catalog}/<key>.ts`) を探していたため、`/ranking/*`・`/themes/*` 向けの改善案はすべて `editableFile: null` の提案だけの PR になっていた。実際の定義は ranking が `data/metrics/<key>.ts`、テーマが `data/themes/catalogs/<key>.json`。
- **済み (2026-10-19)**: `editableFile()` を現在の置き場へ直し、テスト (`keyword-cycle.test.mjs` の 3 件) を足した。
- **残り**: main へ入った後の `seo-keyword-cycle-daily` で、ranking 向けの案が `editableFile` 付きで出るかを確かめてからカードを削除する。テーマは JSON なので、置換処理が JSON を扱えるかも確かめる。
- **禁止**: 自動適用の対象を広げる目的で、検査や `validate:config` を緩めない。
- **完了条件**: `/ranking/general-hospital-count` と既存テーマ 1 件で `editableFile()` が実在ファイルを返すテストが通り、次回の `seo-keyword-cycle-daily` で ranking 向けの案が `editableFile` 付きで出る。
- **本番反映 (2026-11-15・#1275)**: 次の `seo-keyword-cycle-daily` (土曜 06:00 JST、2026-11-21) の結果で、ranking 向けの案が `editableFile` 付きで出るかを確かめる。
- **期日の引き直し (2026-11-24)**: main 反映後の seo-keyword-cycle-daily の出力に editableFile が付くかを確かめる

### [GSC-DEMAND-REPORT-01] 「何にアクセスが集まっているか」に記録 1 枚で答えられるよう、GSC 記録をカテゴリ別・長期で集計して残す
タグ: [インフラ・計測] [種類:改善] [実行:対話] [起票:2026-10-29] [領域:管理] [期日:2026-11-29] [待ち:観測]

- **済み (2026-11-14・c4d00304e)**: 長期の集計 data/gsc/demand-history.csv (重ならない 28 日窓 7 個) と、需要の要約 DEMAND-LATEST.md を作りました。どちらも metrics:digest が毎週作り直します。確定 7 日の明細を保存する取得処理も実装済みです。
- **残り**: main への反映後、週次 CI (fetch-metrics-weekly) が、確定 7 日の明細 queries-finalized7d.csv と pages-finalized7d.csv を保存するかを確かめます。あわせて、summary.json の details に、期間と捕捉率が入るかを確かめます。2 週続けて保存された後、DEMAND-LATEST.md の「3. 前週比」にカテゴリ別の表が出て、data/gsc/demand-weekly.csv ができることを確かめます。demand-weekly.csv ができたら、config/datasets.mjs の gsc.demand-weekly から planned を外します。
- **完了条件**: 連続する 2 週の snapshot に確定 7 日の明細がそろい、DEMAND-LATEST.md にカテゴリ別の前週比の表が出ていること。demand-weekly.csv が台帳に planned なしで登録され、npm run check-datasets が通ること。
- **本番反映 (2026-11-15・#1275)**: 11-21・11-28 の週次 CI (fetch-metrics-weekly) で確定 7 日の明細が 2 週続けて保存されたかを 2026-11-29 に確かめる。

## 2026-12

### [GEMINI-DAILY-EVAL-01] Gemini の日次の 7 回の結果で、1 日の件数を決める
タグ: [コンテンツ品質] [種類:改善] [実行:対話] [起票:2026-11-22] [期日:2026-12-02] [領域:サイト] [待ち:時期]

- **起点**: 11-22 に県別解説 47 件の schema の 400 を直し、develop で 1 件の生成と審査が通った (run 44992638911。AI-CONTENT-GEMINI-KEY-01 を閉じたときの残り)。リリースの後の日次 7 回分が `data/ai-content/history.csv` にたまる。
- **次 (12-02 以降)**: 7 回の PASS 率・REJECT の理由・トークンを読み、1 日の件数 (今は 3) を据え置くか上げるかを決める。400 が残っていれば `GeminiTextError.detail` の文を読む。
- **完了条件**: 件数を決めて workflow に反映したか、据え置く理由を書いてカードを消した。

### [BACKLOG-GROWTH-WATCH-01] backlog.md の週の増え方が +20KB 以下に収まっているかを 2 週見る
タグ: [エージェント・SSOT] [種類:改善] [実行:対話] [起票:2026-11-22] [期日:2026-12-06] [領域:管理] [待ち:時期]

- **起点**: 11-22 に 983KB → 838KB へ縮め (BACKLOG-SIZE-TRIM-01 を閉じたときの残り)、UI 是正のカードの定型文 (1 枚 1KB) を起票する側で短くした。
- **次 (12-06 以降)**: `git log --since=2026-11-22 --format=%h -- .claude/todo/backlog.md` の各週の大きさを比べる。+20KB を超える週があれば、増えた入口 (subagent の起票候補・critic の定型カード・週次の自動起票) を数えて受け皿へ寄せる。
- **完了条件**: 2 週続けて +20KB 以下か、増えた入口を直した。


### [THEME-PAGE-REVIEW-HELD-01] 測定中の実験がある 17 テーマの提案を、判定を踏まえて採否を決めて実装する
タグ: [UI・UX] [種類:改善] [実行:対話] [検証:npm run validate:catalog --workspace=@stats47/data-configs] [起票:2026-11-14] [期日:2026-12-10] [領域:サイト] [待ち:時期]

- **事実**: 漁業・製造業・人口動態・高齢化・農業・物価・外国人住民・地域経済・気候・自然環境・観光・地方財政・賃金・土砂災害・住まい・労働移動・医療の 17 テーマは、構成変更 (d56 = 12-02・12-03) と題の統一 (d28 = 12-10) の実験を測定中。章や指標を変えると測定に混ざるので、2026-11-14 の見直しでは提案文書 (`data/themes/reviews/2026-11-14-theme-<key>.md`・`proposal-ready`) だけを作り、カタログは変えていない。
- **機械の一括適用は使わない**: 2026-11-14 に 5 テーマへ `apply-design.ts --approved` を試し、カタログの検査 1 件とテスト 6 件が落ちたので取り消した (人が作り込んだ図・埋め込みの節・章の構成を固定するテストがある。例: 人口動態の「人口変化の実数を同じ章へまとめ、年齢構造の重複図を外す」)。
- **次 (12-10 以降)**: `node .claude/scripts/themes/evaluate-theme-experiments.mjs --check` で実験の観測を確かめ、判定を付ける。そのうえで提案文書の「採用決定」の 3 点 (章の順と見出し・足す指標・変えてよい構成) をオーナーが決め、1 テーマずつ手で直す (`theme-proposal-format.md`)。足す案の指標は、提案文書で機械の検査を通ったものに限る。
- **完了条件**: 17 テーマの提案が、実装済みか、不採用の理由つきで閉じられている。実装したテーマは `validate:catalog` が error 0 で、実験を `metricScope: all-routes` で登録している。

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
- **価格変更との混在 (2026-11-15 記録)**: 2026-11-10 に価格実験 `PRICE-MUNI-INDUSTRY-2026-11` (`data/products/price-history.json`、判定 2027-01-05) が ¥980 を ¥1,980 に上げ、業種別の表・無料部分・題名も同時に変えた。¥980 で売ったのは 11-04〜11-09 の 6 日だけ (閲覧 10・売上 ¥0)。12-16 の判定は ¥1,980 の版の実測として読み、下の基準の「価格を 1 回だけ変えて再判定」は既に使ったものと数える。
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

### [REPO-PRIVATE-DECISION-01] リポジトリの非公開化を、CI の実行時間を 1 か月測ってから判断する
タグ: [インフラ・計測] [種類:改善] [実行:対話] [検証:gh run list --limit 200 --json name,createdAt,updatedAt] [起票:2026-11-15] [期日:2026-12-15] [領域:管理] [待ち:観測]

- **背景 (オーナー決定 2026-11-14)**: e-Stat の app ID は公開の値で、取得は Mac と CI の両方でできる。リポジトリを非公開にすると GitHub Actions の無料枠 (分) が効き、CI の実行時間がそのまま費用になる。公開のままなら実行時間は無料。
- **やること**: 11-15 から 12-15 までの 1 か月、workflow ごとの実行時間 (run の `updatedAt - createdAt` の合計) を `gh run list` で集計し、非公開プランの無料枠・超過単価と比べる。測るだけで、公開範囲は変えない。
- **停止条件**: 測定の途中で公開範囲を変えない。実行時間の合計だけを根拠に決めず、公開リポジトリであることに頼っている点 (README・OSS 表記・外部の参照) の洗い出しも同じ判断で行う。
- **完了条件**: workflow 別の月間実行時間の表と、非公開にした場合の月額の見積もり (単価の出典付き) が残り、非公開にする/しないをオーナーが決めている。

### [RANKING-MAKING-OF-LINK-01] 閲覧の多い雑学ランキングに「このランキングの作り方」の 1 行を置き、ノウハウ記事への導線を測る
タグ: [収益化] [種類:改善] [実行:対話] [起票:2026-10-07] [領域:商品] [期日:2026-12-13] [待ち:観測]

- **経緯**: `KNOWHOW-PRODUCT-PILOT-01` の「雑学の読者から拾う導線」案 (a)。「年収1000万円」のような事実でない収益の主張の代わりに、作り方への興味という事実に基づく入口を試す。
- **済み (2026-10-19・未デプロイ)**: ①② を実装した。GSC 2026-W41 の 28 日クリック上位の食の雑学 5 件 (納豆支出・米数量・カップ麺支出・アイスクリーム支出・緑茶数量) の出典の欄の下に `/blog/cc-estat-01-setup` への 1 行を置いた (`RankingMakingOfLink.tsx`、対象は `RANKING_MAKING_OF_KEYS`)。クリックは共通の監視が `nav_surface=ranking_making_of` で数える。
- **次**: まとめての本番デプロイのあと、③ 4 週のクリック数と、連載から note の有料ノウハウへの遷移を記録する。
- **停止条件**: 広告のように見せない (PR 表記の要らない、サイト自身の記事への 1 行に留める)。全ランキングに一括で出さない。
- **完了条件**: 4 週の導線クリック数が記録され、続ける・広げる・やめるの判断が `KNOWHOW-PRODUCT-PILOT-01` に書かれている。
- **本番反映 (2026-11-15・#1275)**: 納豆の支出のページに `/blog/cc-estat-01-setup` への 1 行が出ていることを Googlebot UA で確認した。4 週のクリック数は 2026-12-13 に読む。

### [RELATED-ARTICLES-BASELINE-01] 共通化した大画像の関連記事を計測し、画像サイズの次の比較を判断する
タグ: [UI・UX] [種類:改善] [実行:対話] [起票:2026-11-12] [領域:サイト] [期日:2026-12-13] [待ち:観測]

- **実装記録 (2026-11-12)**: 県・ランキング・テーマの本文を `features/content-navigation/RelatedArticles` に統一。見出し「関連記事」、大画像の `ArticleTeaserCard` と共通 `CardGrid`、表示形式 `related-articles-large-v1`。選定条件は従来どおり。ローカル確認段階で、本番の計測開始日は未確定。
- **計測契約**: `nav_impression` はカードの 50% 以上が前面タブで連続 1 秒見えたら、ページ表示中のカードごとに 1 回。`nav_click` は共通クリック監視で送り、`nav_label=blog:<slug>`、`nav_surface=area_blog/ranking_blog/theme_blog`、`card_variant` を突合する。ランキング・テーマの旧ラベルは題名だったため、そのまま前後比較しない。短時間のクリックや同じカードの複数クリックは分子に入るので、クリック数/有効表示数はユニーク利用者のクリック確率ではない。
- **記録先**: 既存の週次 GA4 取得が `data/ga4/snapshots/<週>/related-articles.csv` と `.meta.json` に Japan-only・28 日の記録を保存する。日付・ページ・端末・記事・表示形式ごとの eventCount。重複する週の 28 日値を足さない。新しい認証・管理画面操作は不要。
- **再開条件・実行順**: ① 通常の本番反映時に反映日をここへ記録 ② 最初の週次取得で metadata 成功と表示/クリックの識別を確認 ③ 反映後だけの 28 日間について、記事別・ページ種別・端末別に表示数とクリック数/有効表示数を記録 ④ 小画像を試す必要があるか判断し、試す場合は共通部品だけを変更して表示形式の版を更新する。
- **停止条件**: metadata の失敗・分母欠損・標本不足は効果不明とし、0% や大画像の勝利と扱わない。県とランキングは掲載記事・読者が異なるため、単純な差を画像サイズの効果にしない。
- **完了条件**: 大画像の基準値と限界を記録し、維持または条件をそろえた次の比較を判断する。遷移後の閲読は既存 `read-progress` / `internal-transitions` を補助情報とし、関連記事経由だけの因果効果とは断定しない。
- **本番反映日 (2026-11-15・#1275)**: 計測の開始日はこの日。最初の週次取得 (11-21) で metadata と表示・クリックの識別を確かめ、反映後だけの 28 日間は 2026-12-13 に読む。

### [PV-100K-LEVERS-01] 月10万PV (28日 93,000) へ向けて、新規ページより「見えているのに取れていないクリック」と「1訪問のページ数」を動かす
タグ: [コンテンツ品質] [種類:改善] [実行:対話] [起票:2026-10-19] [領域:サイト] [待ち:時期] [期日:2026-12-31]

- **現状 (2026-10-19 実測、GSC 2026-W41 rolling28d / GA4 W38〜W41)**: 28日 PV 44,662 (流入の 90% が検索)、PV/クリック 3.6、1セッション 1.92 ページ。ranking は 1 ページ 12.6 PV で戦略モデルの 120 に届かず、供給拡大だけでは届かない。順位 4〜15 位・表示 500 以上のページ 197 本は CTR 2.4% (サイト平均 3.5%)。Direct は bot 混入の疑いがあり判定の分母に入れない。想定寄与は現在の単価を維持できた場合の計算で、実績ではない。
- **レバー (寄与の大きい順)**:
  | # | レバー | 想定寄与 (28日 PV) | 時期 | 実行カード |
  |---|---|---|---|---|
  | 1 | 近接ページ 197 本の CTR 改善 (CTR 2.4→4.0%) | +15,000 | 11 月重点候補 | `SEO-CTR-CANDIDATES-01` / `CONTENT-FOOD-TRIVIA-01` ② |
  | 2 | 市区町村ランキングの表示を受けるページを 88→300 | +9,000 | 12 月 | `MUNI-CITY-PAGE-SNIPPET-01` / `MUNI-RANKING-EXPANSION-01` |
  | 3 | 回遊 1.92→2.3 ページ/セッション | +9,000 | 11 月重点候補 | `KAIYU-HUB-01` / `NAV-CLICK-COVERAGE-01` |
  | 4 | index 未登録のうち需要のある ranking を回復 | +2,500 | 定常 | `GSC-COVERAGE-DEPLOY-01` |
  | 5 | 新記事は月 15〜20 本の上限内で近接クエリの空白へ | +3,000〜6,000 | 定常 | `CONTENT-FOOD-TRIVIA-01` / blog-seo-strategist |
  | 6 | areas のクリック 0 ページを noindex か集約 | 0 | 12 月 | `RANK-THIN-01` の基準を areas にも適用 |
- **共通事業方針 (HARM)**: 読者は気になった品目・県の順位の一次統計値をすぐ確かめたい。PV は AdSense の先行指標 (`site-pageviews`)。次の検証は title 変更ページの 4 週後 CTR と、`nav_click` 計測後の 2 ページ目到達率。
- **月次計画との折り合い**: 11 月の `/monthly-plan` で #1+#3 を 1 テーマの重点候補として判断する。
- **停止条件**: #1 を 50 ページ変えて 4 週後 CTR が +0.5pt 未満なら title ではなく順位の問題なので #4・#6 へ振り替える。#2 で表示ページを増やしても 1 ページ当たり PV が 20 を割れば市区町村の拡大を止める。
- **完了条件**: `PV-PLAN-REVIEW-2026Q4-01` (2026-12-31) で W52 の里程標 79,000 と比べ、各レバーの実績 (変更日・4 週後の CTR / PV) がこのカードに記録されている。T2 ゲート (28日 93,000) 到達で閉じる。
- **統合 (2026-10-26 オーナー判断): `PV-PLAN-REVIEW-2026Q4-01`** 2026-12-31 に PV の実績を里程標と比べ、AdSense 月¥1万への重点を見直す
  - **本文の欠け (2026-11-13 確認)**: この統合のコミットで、元カード 4 行のうち 3 行 (字下げした続きの行と番号付きの手順) が落ちた。着手の前に `git show 47aa651d1^:.claude/todo/backlog.md` で `[PV-PLAN-REVIEW-2026Q4-01]` の全文を読み、今の実装と突き合わせて残りを決める。
  - **完了条件**: 判定の結果 (実績・差・次の重点候補) をマーケティング戦略の里程標表と 2027-01 の月次計画に書いた。

### [CYCLE-HEALTH-01] 「検出 → 起票 → 計画 → 実行 → 完了 → 振り返り」のサイクルを各段の停滞信号つきで確実に回す
タグ: [エージェント・SSOT] [種類:改善] [実行:対話] [起票:2026-09-25] [領域:管理] [待ち:観測] [期日:2026-12-19]

- **オーナー指示 (2026-09-25)**: バックログの改善・週次レビューで新しいカードが増え、配線し、改善を繰り返す。このサイクルを確実に回す。
- **設計**: 各段に「止まったら見える信号」を 1 つ置き、新しい仕組みは作らず既存の週次メトリクス Issue と管理画面 `/strategy/lanes` に出す。信号は 検出 → 起票 (7 日たってもカードに結ばれていない指摘)・起票 → 分類 (DG058/059/075)・分類 → 計画 (DG076〜078)・計画 → 実行 (Must の達成率と連続未達。2 週連続未達は分割か降格)・実行 → 完了 (Due 超過 DG054・判定できない効果測定・完了済み ID を参照する計画)・振り返り → 起票 (申し送りがカード ID に結ばれているか)。
- **済 (2026-09-26)**: `.claude/scripts/metrics/lib/cycle-health.mjs` (テスト `cycle-health.test.mjs`) が週次メトリクス Issue の「🩺 サイクルの健全性」表を出す。`/weekly-plan`・`/weekly-review` に連続未達と申し送り ID の決まりを追記。年カバレッジ監査の要拡張候補は `.claude/scripts/data/sync-year-coverage-backlog.mjs` で自動起票 (週次 `estat-year-coverage-audit-weekly.yml`)。
- **次 (残り)**: 「振り返り → 起票」の行を実数にする (週次レビューの申し送りに ID が付いているかを数える)。他の検出器 (ranking-integrity・provenance・`/audit-units`) の自動起票は `DATA-QUALITY-LOOP-01` ①② で同じ形に寄せる。
- **関連カード (ここで重複実装しない)**: `UI-REVIEW-LOOP-VERIFY-01`、`DATA-QUALITY-LOOP-01`、`EFFECT-TARGET-MARKERS-01`、`STRATEGY-FOCUS-2026-10-01`。
- **完了条件**: 週次メトリクス Issue に 6 信号が 4 週続けて出て、検出 → 起票の未結び件数と Due 超過が減り、Must の連続未達が 2 週以内に解消されている。
- **棚卸し (2026-11-22)**: 「振り返り → 起票」の行に、カード ID・EXP・Issue に結ばれた件数を出すようにした (`packages/ops/src/metrics/lib/cycle-health.mjs`、テスト 8 件)。残りは完了条件の 4 週の観測なので、12-19 に 4 週分の出力を確かめる。

### [CI-LEAD-TIME-01] デプロイの skip と指標生成の省略の効果を実測する
タグ: [インフラ・計測] [種類:改善] [実行:対話] [検証:gh run list --workflow deploy-workers.yml] [起票:2026-11-06] [領域:管理] [待ち:観測] [期日:2026-12-04]

- **起点**: 2026-11-06 に `scope` job・`needsMetricMetadata`・`.husky/pre-push`・PR を開く時機の規則を入れた (`.claude/rules/branch-workflow.md`「待ち時間を増やさない運用」)。push から本番まで約 40 分が基準値で、skip の判定と PR の短縮は本番でまだ動いていない。
- **やること**: ① main へ入ったあと、本番に関係しない push で Deploy job が skip されることを run で確かめる ② 関係する push で必ずデプロイされることを確かめる ③ 指標に無関係な PR の Build Check が 10.9 分から約 6.7 分になるかを測る (算式: 10.9 − 生成 4.2) ④ PR 検査の cancel の割合が 21/34 から下がるかを 2 週間後に見る。
- **完了条件**: 4 点の実測を `.claude/rules/branch-workflow.md` に記録している。
- **実測 (2026-11-24・`gh run list --workflow deploy-workers.yml --branch main`)**: 11-06〜11-23 の 20 run は push 4・手動起動 16。② 本番に効く push (11-13・11-14・11-21 の 2 回) は 4 回とも Deploy が success で、必ずデプロイされた。① 本番に関係しないパスだけの push が main に 1 回も無く、skip はまだ観測できていない。③ (Build Check の時間) と ④ (PR 検査の cancel 率) は未計測。
- **期日の引き直し (2026-11-24)**: ①② は 11-24 に実測を記録した。③④ (Build Check の時間・PR 検査の cancel 率) は 2 週の観測の後

### [MINIMUM-WAGE-2026-01] 2026年度地域別最低賃金

タグ: [コンテンツ品質] [種類:制作] [実行:対話] [領域:データ] [待ち:時期] [期日:2026-12-01]

- **owner**: open-data-curator
- **source**: GitHub #652
- **trigger**: 厚生労働省または各地方最低賃金審議会が2026年度の47都道府県別実額を正式公表したとき。
- **次**: 目安額ではなく正式決定額の一次資料を確認し、既存 `minimum-wage-by-region` の年次追加として扱う。
- **完了条件**: 47県の正式額・発効日・前年差を一次資料で照合し、既存keyのR2観測値を更新する。
- **禁止**: 中央審議会の目安額や新聞表を正式額として公開しない。
- **再確認日 (2026-11-14 設定)**: 期日は契機を確かめる日である (2026 年度の決定額が公表済みかを見る)。まだなら期日を延ばす。
- **期日の引き直し (2026-11-24)**: データ領域で 11 月の重点外。12 月の月次計画で取り込むかを決める

### [THEME-CPI-503-01] テーマ品質監査で consumer-prices ページが 503・タイムアウトになる
タグ: [UI・UX] [種類:不具合] [実行:対話] [起票:2026-10-10] [領域:サイト] [待ち:観測] [期日:2026-12-05]

- **事象**: テーマ品質監査 #1069 (2026-10-05) で `/themes/consumer-prices` (幅 1440) が HTTP 503・h1 の待機タイムアウト・チャート 2 つ欠落 (theme-cpi-heatmap・theme-cpi-profile)。
- **次**: 本番の該当 URL を Googlebot UA で取得して今も 503 かを確かめる。続いていれば Workers の CPU 制限 ([CF-CPU-SURGE-01]) との関係を見る。一時的なら次回監査で解消を確認する。
- **完了条件**: 次のテーマ品質監査で consumer-prices の表示検査が通る。
- **2026-10-23 確認**: Googlebot UA で 3 回とも 200 (3.6〜6.8 秒)、CPI の R2 は 47 県・13 年分ある。次のテーマ品質監査で #1069 が閉じるかを見る。
- **再確認日 (2026-11-14 設定)**: 期日は契機を確かめる日である (次のテーマ品質監査で Issue #1069 が閉じるかを見る)。まだなら期日を延ばす。
- **期日の引き直し (2026-11-24)**: Issue #1069 がまだ OPEN (2026-11-24 確認)。次のテーマ品質監査で閉じるかを見る

### [CORRELATION-SNAPSHOT-YEAR-ALIGN-01] 相関 snapshot が年の違う値どうしを組み、統制変数も別の年を使っている
タグ: [コンテンツ品質] [種類:不具合] [実行:対話] [起票:2026-10-09] [領域:データ] [期日:2026-12-01] [待ち:観測]

- **済み (2026-11-23・オーナー判断「共通年で計算し直す」)**: `build-correlation-snapshot.ts` が指標ごとに全年の値を県の並びの配列で持ち (`packages/correlation/src/utils/year-slices.ts`)、ペアごとに両方に値のある最新の共通年で相関・偏相関・散布図を計算する。統制変数 4 つも同じ年の値だけを使い、その年に値が無い統制変数の偏相関は出さない。snapshot のペアに `year`、by-key に指標の `latestYear` を書き、ランキングページの「相関が高い指標」は最新年と違う年で比べたペアに「（YYYY年の値）」を出す。
  - 本番の値で手元に生成した結果 (R2 へは送っていない): 40 秒・最大メモリ 850MB (CI は上限 8GB)。ペアは 323 万 → 274 万 (共通年の無い約 49 万ペアが消えた)、|r|≥0.7 は 14.3 万 → 10.0 万。by-key に載る 50,834 ペアのうち 38.5% が最新年より古い共通年で、差の中央値は 3 年・上位 1 割は 14 年以上・最大 45 年。
  - 起票時の例 (農業産出額 × 農業就業人口) は 2014 年でそろい r=0.758 (公開中は年違いの 0.762)。
- **残り (リリース後)**: develop → main の後に correlation-refresh が作り直した `app/correlation/by-ranking-key-v2/agricultural-output.json` で、`latestYear` が 2024、`agricultural-employment-population` の `year` が 2014 であることを curl で確かめ、ランキングページで「（2014年の値）」が出ることを見る。
- **決定 (2026-11-23 オーナー)**: 共通年が古いペア (最大 45 年前) にも上限を置かず、年を添えて出す。
- **完了条件**: 本番の相関 snapshot の各ペアに year があり、統制変数と散布図が同じ年の値で、画面に年の違いが表示されている。
- **年間計画へ移した (2026-11-24)**: main 反映後に correlation-refresh の相関 snapshot の year と画面の年表記を確かめる

### [SIMPLIFY-FAILING-AUTOMATION-01] 1 週間で失敗が続く定期 workflow を、直すか止めるか 1 本ずつ決める
タグ: [インフラ・計測] [種類:不具合] [実行:対話] [起票:2026-10-11] [領域:管理] [期日:2026-12-01] [待ち:観測]

- **経過 (2026-10-11)**: 失敗率 100% の 4 本と高失敗率の workflow を調べ、SEO keyword・ブログ是正日次・アフィリエイト週次を直し、Gemini 日次は schedule を外した (develop `88b6d5c90`)。Security Scan と Develop Quality Gate は回復済み。Health Check は計測の auth_required と A8 の成果ゲートが直るまで落ち続ける。
- **次**: 直せないもの、`SIMPLIFY-PORTFOLIO-CUT-01` で止める系統のものは schedule を外して workflow を削除し、`docs/01_技術設計/06_自動化インベントリ.md` を同じ差分で更新する。定期実行は main の定義で動くので、修正の main マージ日から 7 日後に `gh run list --created ">=<マージ日>"` で失敗率を数え直す。
- **完了条件**: 直近 7 日の run で失敗率 50% 超の定期 workflow が 0 本。
- **数え直し (2026-11-23・11-16 以降の定期実行 47 run)**: 失敗率 50% 超は 4 本。
  - `ai-content-gemini-daily.yml` (6/7): 原因の HTTP 400 は 11-22 に直り、修正後の手動実行 (run 44992638911) は成功。次の定期実行で確かめる。
  - `post-deploy-smoke.yml` (定期 1/1): その後のデプロイ後の実行は 4 回続けて成功。
  - `affiliate-ga4-weekly.yml` (2/2): 計測ゲートが `inventory-snapshot-stale(19d>10d)` で落ちていた。11-13 の `dce7c7c6a` で `--check-size` を付けた在庫の監査が記録を書かなくなり、この workflow は `--json --check-size` の 1 回で在庫を作り直していたので、記録が 11-03 のまま止まった。作り直しとサイズの検査を 2 回の呼び出しに分けた (2026-11-23)。手元で作り直すと在庫の鮮度の理由は消えた。main に入った後の次の土曜 (11-29) の run で確かめる。
  - `quality-suite-weekly.yml` (1/1・4 週連続): `QUALITY-SUITE-WEEKLY-RED-01` で扱う。
- **年間計画へ移した (2026-11-24)**: ai-content-gemini-daily の次の定期実行と affiliate-ga4-weekly の 11-29 の run の成否を読む



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

### [STP-AI-WATCH-01] AI Overviews による雑学系流入の侵食を四半期で定点観測する

タグ: [インフラ・計測] [種類:改善] [実行:対話] [起票:2026-10-05] [領域:サイト] [待ち:時期] [期日:2027-01-05]

- 2026-10 月次計画で improvements から降格。再開条件: 2026-10 の四半期観測枠。手順: S1 代表クエリを GSC finalized 期間で固定 → 重複しない期間の clicks/impressions/CTR/position を比較 → AI Overviews 表示有無が取れなければ「S1 CTR 低下の観測」に限定 → 対照群と比較し持続的低下のみ次候補を最大 3 件 (`[kpi: search-clicks]`)。
- 効果判定エンジン対象外 (S1 代表クエリ群と S2・S3 対照群の query 集合比較)。

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
