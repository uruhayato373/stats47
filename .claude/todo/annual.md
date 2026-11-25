---
title: 年間計画 (時期が来たら着手するカード)
type: annual-plan
status: active
updated: 2026-11-25
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

### [CONVENIENCE-STORE-SALES-SCALE-CHECK-01] コンビニ販売額の値の桁 (東京都 155,869百万円) が年間か月間かを確かめる
タグ: [コンテンツ品質] [種類:不具合] [実行:対話] [起票:2026-11-03] [領域:データ] [待ち:観測] [期日:2026-11-28]

- **済み (2026-11-15・オーナー承認)**: main の `data-refresh.yml` を `metric=convenience-store-sales`・`dry_run=false` で実行し (run 43667621239)、R2 の値を年計に入れ替えた。
- **済み (2026-11-13・`3d5c87fd9`)**: e-Stat `0004032502` は年計・四半期・月次を 1 つの表に持ち、`timeScope` 未指定のため 2025 年 1 月の月間値 (東京都 155,869 百万円) を年の値として採っていた。
- **残り (R2 への書き込みが要る)**: main へ入った後に CI で再取り込みする。配信中の値はそれまで月間値のまま。再取り込み後に、表示単位の台帳 (`data/metrics/display-units/ledger.json`・週次生成) と、値を含む SEO 文字列を作り直す (`seo-meta-facts` のゲートは R2 の配信値と照合するので、それまで値を載せられない)。
- **再観測 (2026-11-15)**: 表切片との一致検査で、公開2025年度の47県値が原表の `2025000101` (2025年1月) と全件一致。 (参照: 0004032502)
- **あわせて確かめる**: 百貨店・スーパー販売額 (`department-supermarket-sales`・`0004032493`) は台帳で 2025 年が 20 県分しか無い。同じ取り出し条件の問題かは未確認。
- **完了条件**: 配信中の値が年計になり、値・単位・説明・SEO 文字列が一致している。
- **確認 (2026-11-24)**: R2 の `app/ranking/convenience-store-sales/values.json` は年計の大きさ (東京都 1,714,648 百万円) になった。seoTitle・seoDescription は値を含まない形 (11-23 に題と説明文を観測値から作る形へ替わった) なので、SEO 文字列の作り直しは不要。残りは表示単位の台帳 (`data/metrics/display-units/ledger.json`・11-14 生成で max 155,869 の月間値のまま) で、週次の作り直しを待つ (この PC はプロキシで R2 の公開 URL を読めず手元では作れない)。
- **年間計画へ移した (2026-11-24)**: 11-28 の週次で台帳の max が年計の桁になったかを読む。百貨店・スーパー販売額の 20 県の件は、そのときに同じ取り出し条件かを見る。

### [GSC-DATASET-NESTED-SCHEMA-01] DatasetのGSC再検証結果を確認し、出典メタデータを是正する
タグ: [インフラ・計測] [種類:不具合] [実行:対話] [起票:2026-10-16] [期日:2026-11-28] [進行中] [領域:サイト] [待ち:観測]

- **GSC案03 / P1（最優先・順序2）**: 入れ子Datasetの説明不足・欠落の修正をGoogle側で検証する。
- **GSC案04 / P2（次に着手）**: 出典SSOTからcreator・license・対象年・地域・単位を正しく引き継ぐ。案03と同じ生成処理で扱う。
- **owner / 順序**: ranking-ui-manager・市区町村ページ担当。P1のGoogle再検証結果確認を優先し、P2の出典メタデータ確認へ進む。監査: `data/gsc/ui-audits/2026-10-16.json`、本番反映・GSC操作の証拠: `data/gsc/ui-audits/2026-10-17-remediation.json`。
- **修正前の実測**: GSC Dataset（最終更新 10-15）は description 長さ不正 775、欠落 83、計 858 アイテム無効。license / creator 欠落は各 1,092。原因は入れ子 (`isBasedOn`) の Dataset の説明が短いか無いこと。
- **次 / 順序**: ①10-23にGSCのdescription長さ不正775件・欠落83件の検証結果と前回クロールを確認する（両方10-17に「検証: 開始」）。失敗した場合は該当URLと入れ子項目を特定して再現する ②P2のcreator / licenseは対応する出典SSOTの作成者・利用条件を特定したものだけ引き継ぐ（調査名を組織名として流用しない）。PR #1140で本番反映済み、対象6ページ×通常/Googlebotの必須description検査と再帰回帰テストは通過。証拠は `data/gsc/ui-audits/2026-10-17-remediation.json`。公式: https://developers.google.com/search/docs/appearance/structured-data/dataset?hl=ja
- **残る照合**: 出典SSOTと作成者・利用規約・対象年・地域・単位の一致を確認する。858は無効アイテム数として追跡し、ページ数や通常検索の未登録数と混同しない。
- **停止条件**: 親 Dataset の本文だけを水増しして解消としない。出典の作成者・利用条件を推測で埋めない。追加の本番反映は別途オーナー指示で行う。
- **完了条件**: 親と入れ子の Dataset を辿る回帰テスト、対象の型検査、本番代表HTMLの必須項目検査が通り、再クロール後に該当エラーが解消したことを確認する。デプロイ前・再クロール前はそれぞれ区別して記録する。

### [GSC-ROBOTS-INDEXED-01] 公開ダウンロード・廃止OGPのGoogle再取得と除外を確認する
タグ: [インフラ・計測] [種類:不具合] [実行:対話] [起票:2026-10-16] [期日:2026-11-28] [進行中] [領域:サイト] [待ち:観測]

- **GSC案24 / P2（本番HTTP確認済み・Google検証中）**: robotsブロック済み登録584件のうち576件は公開CSV/JSON、8件はOGP。公開ダウンロードに限定してcrawlを許可しX-Robots-Tag:noindexを読ませる。公開画像と廃止URLのHTTP応答も読めるようにする。
- **owner / 入力**: gsc-analyst・site-ux-manager。対象・内容確認・ローカル検証は `data/gsc/ui-audits/2026-10-16-remediation.json`。変更はrobots.ts・download route・middleware、恒久方針はcoding-standards.md。
- **次 / 順序**: PR #1139をmainへ反映し、本番31 URLは全件期待どおり。デプロイ・purge・post-deploy smokeの最終結果は `data/gsc/ui-audits/2026-10-16-remediation.json` のreleaseを参照。GSCのrobots.txt再取得リクエストは受理済み、584件の警告は10-16に「検証: 開始」。10-23にGoogleの再取得とnoindex/404/410による除外を確認する。Google側の検証完了前にカードを閉じない。
- **観測 (2026-10-22 GSC通知)**: 「robots.txt によりブロックされましたが、インデックスに登録しました」の検証結果が「修正できませんでした」(一部のページが引き続き影響を受けている) で届いた (Message type WNC-10031170)。
- **停止条件**: API全体は開放しない。ダウンロード/画像機能を壊さない。Googleがnoindex/404/410を取得する前に解消としない。ローカル実装を本番反映済みとしない。
- **完了条件**: 本番で意図したHTTP/robotsが配信され、対象URLのGoogle再取得でダウンロードの検索除外・廃止画像の除外が確認できる。正常画像は取得可能。noindex対象増加は意図した除外として評価する。
- **2026-11-11 実測 (GSC 最終更新 11-06・本番 HTTP・サイトマップ 11 本)**: 「robots.txt によりブロックされましたが、インデックスに登録しました」は 23 件 (検証は「失敗しました」表示)。一方、許可したダウンロード API がクロールされ、全既知の「クロール済み - 未登録」2,413 件は W44 記録 1,000 件中 959 件が `/api/ranking/*/download?format=…`、32 件が `storage.stats47.jp` の JSON。kml は 1 ファイル 2.5MB。**次**: 23 件が 0 になったらダウンロードの許可を Disallow に戻す案を `GSC-CRAWL-WASTE-01` で判断する (Dataset 構造化データの `contentUrl` が同じ URL を指すので、戻す前に Dataset の検証への影響を確かめる)。

### [GSC-COVERAGE-DEPLOY-01] カバレッジ是正後の再クロールと残存ソフト404を確認する
タグ: [インフラ・計測] [種類:不具合] [実行:対話] [検証:node .claude/scripts/gsc/build-coverage-queue.mjs --no-probe] [起票:2026-09-07] [期日:2026-11-28] [進行中] [領域:サイト] [待ち:観測]

- **GSC案08 / P2（次に着手・coverage内優先1）**: 現sitemap内soft404の15 URLを公開URLテストと修正後クロールで再評価する。
- **GSC案09 / P2（次に着手）**: クロール済未登録146 URLをテンプレ別に分け、登録済み同種ページと本文・重複・検索意図を比較する。
- **GSC案10 / P2（次に着手）**: 検出未登録971 URLを検索需要・公開後日数・内部リンク・独自性で順位付けする。各URLへ対応要否と根拠を残す。
- **GSC案14 / P2（次に着手）**: streaming HTMLの断片で空ページと判定せず、ブラウザー表示とGoogle公開URLテストの本文・資源を照合する。
- **GSC案15 / P2（次に着手）**: 案09で固有情報不足が確認された県ページから、全国差・推移・近隣比較・集計注意を補う小規模案を作る。単純な文字数増加や47県一括rewriteはしない。
- **GSC案36 / P2（次に着手）**: 固定URL群に変更日・修正後クロール・登録・検索表示・クリックを結び付ける。計測契約が完成したら既存改善台帳へ引き渡し、反復観測だけのbacklogを増やさない。
- **owner**: gsc-analyst（最新入力との照合・再クロール観測）
- **現状**: 是正は2026-09-07にPR #939（main `5d05cd6e1`）で本番反映済み (旧市区町村カテゴリsoft404は301、未知カテゴリ410 + noindex)。現sitemap内soft404 15件は本番200・自己canonical・index可を確認し、2026-10-17までに15/15の登録リクエストが受理された (自動化gsc-4はPAUSED)。Google保存状態は依然soft404で、登録完了・件数改善は未確認。根拠: `data/gsc/ui-audits/2026-10-16-remediation.json`。経過は `git log -p -- .claude/todo/backlog.md`。
- **次**: 修正後の lastCrawlTime・登録状態を既存の日次Inspectionで再確認し、未再クロールならサイトマップ再取得・クロール統計を照合する。現在200・ライブテスト合格・送信受理だけで登録済みとしない。
- **優先対象の絞り込み案 (10-16)**: soft404 15件・クロール済未登録146件・検出未登録971件の計1,132 URLを候補母集団にする（全件の現HTTPは未検査）。需要・最終クロール・内部リンク・本文の独自性で優先付けし、まず既存15件と需要のある小標本を調べる。
- **観測の判断条件**: 登録済み6,700とsitemap6,574は対象集合が異なるので割り算しない。
- **停止条件**: 古いW32入力を当週データとして再生成しない。通常ページへGoogle Indexing APIを送らない。デプロイ前のURLを同一観測窓へ混ぜず、Google再クロール前の件数不変だけでeffect/noneにしない。
- **完了条件**: develop→mainのCIがgreenで、上記の本番HTTP・構造化データ・sitemap検証がすべて合格する。失敗時の`coverage-alert`起票と、回復時の自動closeを少なくとも一方はGitHub Actionsで実測し、デプロイ後exportで市区町村カテゴリsoft404が0になる。
- **2026-11-11 実測 (GSC 最終更新 11-06・本番 HTTP・サイトマップ 11 本)**: 送信済みの「クロール済み - 未登録」127 件は県×テーマ 70・ランキング 24・市区町村 21・ブログ 11・調査 1 (クロール日は 6 月〜11 月)。県×テーマはテーマ 35 種に散り、最多は aging-society の 8 件。県×テーマはサイトマップに 2,491 件あり、「検出 - 未登録」にも 239 件ある。**次 (案09・15 の入力)**: 登録済みと未登録の県×テーマを同じテーマで並べ、本文・固有の値・重複の差を比べてから、薄い組み合わせを noindex にするか内容を足すかを決める。
- **県×テーマ 2,491 ページの比較 (2026-11-11・案09 の入力)**: 入力は GSC 送信済みビュー (最終更新 11-06) の「検出 - 未登録」239 件・「クロール済み - 未登録」70 件の全 URL と、W44 の検索実績 (28 日)。① 2,491 ページ中 1,836 ページ (74%) に検索の表示があり、合計は 28 日で 44,401 表示・1,063 クリック (1 ページ 0.43 クリック)。② 未クロール 239 件は新しいテーマに偏る: 2026-07-04 追加の 11 テーマ (517 ページ) は 7 件 (1.4%・全て tourism)、09-09 以降に追加した 42 テーマ (1,974 ページ) は 232 件 (11.8%)。③ クロール済み未登録 70 件は古いテーマの方が率が高い (07-04 追加 6.0%・09-09 以降 2.0%)。最多は aging-society の 8 件 (指標 25・図 5) で、指標の少ないテーマに偏らない。④ 指標の数と登録の関係: 新テーマのうち指標 6 以下の 16 テーマは表示あり 73%・1 ページ 0.35 クリック、指標 20 以上の 9 テーマは 69%・0.40 で、薄いテーマほど登録されないという差は無い。未クロール率だけは指標 6 以下 14.8%・20 以上 5.9% と差がある。⑤ 同じテーマの未登録ページと表示のあるページ 3 組 (public-assistance 31000/13000・retail-commerce 07000/14000・aging-society 05000/14000) は、指標カードの数が同じで HTML の大きさの差は 0.3% 以内 (本文の文字数は測れていない)。⑥ `/areas/<県>/tourism` は表示ありが 47 中 9 ページと最少で、7〜8 月のリダイレクトエラー 10 件・404 3 件の履歴がある (現在は 200)。**判断材料としての結論**: テーマ単位・指標の数・県単位のどれで切っても、noindex にする根拠になる偏りは無い。未クロールは公開から 5 週間のページへの到達待ちの形で、クロール済み未登録は全体の 2.8%。**次**: noindex は行わない。11-11 に始めた検証と内部リンクの追加 (`GSC-INTERNAL-DISCOVERY-01`) の後、次の送信済みビューの記録 (11-14 以降) で 239・70 の増減を見る。tourism の 38 ページが表示を得るかを同じ記録で追う。

### [SIMPLIFY-REVIEW-LOOP-EXECUTION-01] 週次レビューを「書く」から「Must を実行する」側へ寄せ、active 施策を上限 5 件まで減らす
タグ: [エージェント・SSOT] [種類:改善] [実行:対話] [検証:npm run docs:check] [起票:2026-10-11] [期日:2026-11-29] [領域:計画] [待ち:観測]

- **事実 (2026-10-11 実測)**: 配線は健全だが、W37〜W39 の Must が 1/3・0/3・0/3 (W40 は 2/2)、NSM 週次収益は全週「判定不能」だった。 (参照: db4abc0a0・94e5b456a)
- **次**: (1) improvements.md を月次で上限 5 件 (2026-10-27 に 10 から変更) まで削る (improvement-triage の排他 write)。削除基準は「`[target:]` が無い」「計器が止まっていて判定できない」。(3) `review-wiring.json` の requiredSections 6 を「サマリー / 計画 vs 実績 / 申し送り」の 3 に減らしてよいか、`/weekly-review` の所要時間を 1 回測ってから決める。
- **残り**: W41〜W44 の週次レビューで Must の達成率を読む。判定日 2026-11-08 (W44 のレビューの翌日)。
- **完了条件**: active ≤ 10、`[target:]` なし 0、4 週連続で Must ≥ 2/3。
- **追補 (2026-11-21・週次レビュー W46)**: backlog は 377 枚で目安 200 枚を超え、W45・W47 は削減を定常に置いて進まなかった。W48 の Must 1 (377 枚から 20 枚以上減らす) の主 ID をこのカードにした。手順: 期日超過のカード (`npm run backlog:waits -- due --week <週>`) を今週やる・期日を引き直す・消すのどれかに決め、完了カードは `record-backlog-outcome.mjs` で記録してから消す。完了の目安: `npm run backlog:waits -- flow` の総枚数 ≤ 200。
- **判定 (2026-11-24)**: 完了条件は未達。Must の達成率は W40〜W47 が 2/2・1/2・1/2・3/3・— (W44 は記録なし)・2/3・2/3・3/3 で、「4 週連続で 2/3 以上」は W44 の欠けで数えられない (W45〜W47 の 3 週は満たす)。`[target:]` の無い施策は 5 件 (DG080)。W48 の期日超過 22 枚は処置を記録した (消す 4・今週やる 2・期日の引き直し 16)。総枚数は 357。次は W48 の Must の達成で 4 週連続を確かめ、`[target:]` なしを improvement-triage で減らす。
- **期日の引き直し (2026-11-24)**: W48 の Must 1 の主 ID。W48 末に Must の達成率と [target:] なしの件数を読み直す

### [AFF-GA4-WEEKLY-GATE-01] 週次のアフィリエイト計測 (affiliate-ga4-weekly) が計測ゲートで 6 回続けて落ち、アフィリエイトの観測が 11-14 で止まっている
タグ: [収益化] [種類:不具合] [実行:対話] [検証:gh run list --workflow affiliate-ga4-weekly.yml --limit 1] [起票:2026-11-21] [領域:アフィリエイト] [待ち:観測] [期日:2026-11-29]

- **観測 (2026-11-21・週次レビュー W46)**: `affiliate-ga4-weekly.yml` は 6 回連続失敗・最終成功から 25 日 (`.local/weekly-audits/2026-11-21/ci-health.log`)。 (参照: run 43973234812・#1207)
- **次**: ① 在庫 snapshot (Refresh Affiliate Inventory & Compliance) が 10 日を超えて古い理由を run 履歴で確かめる ② A8 の照合不足と当月の成果欠落が、土曜の認証付き計測 (a8 は 2026-11-20 に pass) の記録と workflow の読む場所の食い違いかを確かめる。
- **完了条件**: `affiliate-ga4-weekly` の最新 run が success で、#1207 が閉じている。
- **禁止**: ゲートの閾値を緩めて通さない (`.claude/config/` の基準はオーナー判断)。
- **進捗 (2026-11-24・1cd4e2279)**: 原因は週次の A8 取得が site-summary だけを取っていたこと (11 月は案件別の行が 0 件で、ゲートが shortfall と month-missing で止まった)。取得を program-detail と合わせて 2 本にした。残りは次の土曜の `weekly:collect` の後に `gh run list --workflow affiliate-ga4-weekly.yml --limit 1` が success になるかの確認。

### [PAGE-UI-REVIEW-COVERAGE-01] ページ UI の週次確認で読むべき画面の 9 割が読まれず、新しい指摘の行き先が無い
タグ: [UI・UX] [種類:不具合] [実行:対話] [起票:2026-11-08] [領域:サイト] [待ち:観測] [期日:2026-11-29]

- **観測 (2026-11-08・W44 週次レビュー)**: `data/page-quality/metrics/ui-review-latest.json` (監査 2026-10-30) は `reviewStatus: reviewed` だが、読んだ切り出しは 196 枚中 22 枚で、読み残し 63 画面・全部読めたページ 0。 (参照: #1015)
- **次**: 読み残しの原因 (エージェントの読む上限か、切り出しの枚数か) を `quality-suite-weekly.yml` の page-quality job のログで確かめ、全ページを読める形にする。指摘 10 件のうち直すものはテンプレートごとの `UI-FIX-*` カードへ分ける。
- **完了条件**: 次の週次確認で `readCoverage.unreadScreens` が 0 で、Issue #1015 の指摘がすべてカードか見送り理由に振り分けられている。
- **進捗 (2026-11-24)**: 原因は、run 44829320471 で agent が 11 回のやり取り・20 秒で自分から終え、208 枚中 8 枚しか読まなかったこと (上限や時間切れではない)。プロンプト `.claude/prompts/ci/page-ui-review.md` に「全枚数を読み終えるまで返さない・読んだ枚数を summary に書く」を足した。残りは次の週次の run で読んだ枚数を確かめること。

### [QUALITY-SUITE-WEEKLY-RED-01] 週次フル品質検査 (main) が 3 週続けて失敗している
タグ: [インフラ・計測] [種類:不具合] [実行:対話] [起票:2026-11-14] [領域:サイト] [期日:2026-11-30] [待ち:観測]

- **観測 (2026-11-14)**: `quality-suite-weekly.yml` の main の run が 10-30 (`41122877579`)・11-06 (`42295351706`)・11-13 (`43513853562`) の 3 回とも failure (Issue #1202)。
- **再現**: `gh run view 43513853562 --log-failed`。手元では `npm run test --workspace apps/web -- population-profile-ui bridge-inspection-age-ui`。
- **次**: ① 3 回の run の失敗 job とテスト名を並べ、毎回落ちるものと 1 回だけのものを分ける ② 毎回落ちるものから、job ごとに原因を実証して直す (公開 R2 の取得失敗が絡むものは `CI-LIVE-R2-TEST-FLAKE-01` と重なるかを先に確かめる) ③ 落ちた E2E の artifact でサーバーの例外が読めるかを確かめる (`E2E-FAILURE-EVIDENCE-01` の残り)。
- **完了条件**: main の `quality-suite-weekly` が 1 回 success になり、Issue #1202 が自動で閉じる。
- **① 済み (2026-11-16)**: 3 回の run (41122877579・42295351706・43513853562) を比べた。**毎回落ちるもの**: E2E の blog-detail.spec.ts (:24・:29・:40・:56。`toBeVisible` が要素を見つけられない)、blog-list.spec.ts (:21・:29・:98。h2 を持つ `main a[href^='/blog/']` が見つからない)、comparison.spec.ts :45 (`toHaveURL`)、header-navigation.spec.ts :41・:95、Theme quality audit (10-30・11-06 は `AssertionError [ERR_ASSERTION]`。どの assert かは未特定)、OGP image audit (原因は毎週違う。11-06 は data-muni-manufacturing の short-title の生成失敗、11-13 は gloves-… の article.md の R2 fetch 失敗)。**3 回中 2 回**: unit の bridge-inspection-age-ui と population-profile-ui の 10 秒タイムアウト。**1 回だけ**: header-navigation :34、public-route-contract :36 (10-30)、Page quality audit (11-06)。unit のログに「R2クライアントを取得できませんでした / getCloudflareContext」が繰り返し出ており、blog E2E と同じ原因か (`CI-LIVE-R2-TEST-FLAKE-01`) は未確認。`affiliate-ga4-weekly` (#1207) は計測ゲート (inventory-snapshot-stale・A8 の照合不足) で落ちており、別の原因。**次**: ② blog E2E から、失敗時のスクショ artifact で R2 の取得失敗かテストデータかを分ける。
- **追記 (2026-11-16)**: ② に入るときは、Theme quality audit の assert が 3 回とも落ちている件 (どの assert かは未特定) と、OGP 監査で data-muni-manufacturing の short-title の生成が 11-06 に失敗した件も、このカードで扱う。
- **4 回目 (2026-11-20・run 44829320471)**: 失敗した job は Full web build and E2E (10 件)・OGP image audit (r2-static の欠落 2 件)・Theme quality audit (14 件のチャート依存が実データの契約を満たさない)・Update weekly quality alert。E2E は blog-list の記事カード・comparison のカテゴリタブ・header-navigation のサイドバーの現在地とテーマ一覧のリンクなどで、① の「毎回落ちるもの」と重なる。
- **進捗 (2026-11-24・7c91e5215)**: 毎回落ちていた E2E 10 件を今の画面 (10-28〜29 の変更) に合わせた (手元の dev で 10 件通過)。残り: テーマ品質の監査の error (urban-parks は直した。職業別賃金 8 指標の 18 件は THEME-URBAN-PARKS-HISTORY-LOSS-01 へ移した)、OGP 監査の r2-static の欠落 2 件。どちらも R2 のデータ側。main の run が success になるかは次の週次で確かめる。
- **観測 (2026-11-25)**: main の直近 4 回 (10-30・11-06・11-13・11-20) はすべて failure、Issue #1202 は OPEN。修正 (7c91e5215) の後の週次はまだ走っていない。Theme quality audit の error 18 件は 77aa6447b で 0 になった (手元の再実行)。OGP の r2-static 欠落 2 件が残る。

### [AD-LAYOUT-WEEKLY-CAPTURE-01] 広告の配置の撮影を土曜ランナーへ組み込み、本番の配置を週 1 回記録する
タグ: [収益化] [種類:改善] [実行:対話] [起票:2026-11-04] [領域:アフィリエイト] [期日:2026-11-30] [待ち:観測]

- **済み (2026-11-14・3390b94f2)**: 撮影 (`.claude/scripts/ads/capture-ad-layout.ts`) は、手元の開発サーバー以外を `--base-url` に指定すると、AdSense・GA4・アフィリエイトの host への要求を `context.route` でブラウザから出る前に必ず中断する (`.claude/scripts/ads/lib/ad-traffic-block.mjs`。)
- **残り (判断)**: 撮影を毎晩ではなく週 1 回、土曜ランナー (`scripts/scheduled/weekly-saturday.sh`) の段として本番 (`https://stats47.jp`) を撮る方向でよいかをオーナーが確定する。選択肢は (a) 土曜ランナーで本番を撮る、(b) Mac で開発サーバーを立てて撮る、の 2 つ。推奨は (a)。配置が変わるのはコードを変えたときだけで土曜の週次レビューで見れば間に合い、開発サーバーが要らず、デプロイ後の実際の姿を確かめられるため。通信を止めると本番の枠の高さが潰れて枠を検出できないと分かった場合は (b) へ戻す。
- **残り**:
  1. 本番で 1 ページ・1 幅だけ撮る (`npx tsx .claude/scripts/ads/capture-ad-layout.ts --base-url https://stats47.jp --pages ranking --widths 390`)。最後の 1 行が「通った 0 件」であること、「一覧に無い外部の host」に広告・計測の host が無いこと (あれば `ad-traffic-block.mjs` の `AD_TRAFFIC_HOST_RULES` に足す)、`ins.adsbygoogle` の枠とユニットが開発サーバーの撮影と同じように取れることを確かめる。
  2. 全 63 枚を本番で 1 回撮り、管理画面 `/affiliate/layout` の警告を読む。開発サーバーとの差が出たら原因を分ける。
  3. `weekly-saturday.sh` に段を足す (冒頭のコメントの段の説明も直す)。撮影は専用 clone ではなく作業フォルダの `.local/ad-layout/` へ書く。古い撮影は直近 8 回だけ残して消す。落ちた回は既存の `failed` の仕組みで週次レビューの Phase 0b に出す。
  4. 週次レビュー (`.claude/skills/management/weekly-review/SKILL.md`) の確認の表に「広告の配置」を足し、警告の件数と `adTraffic` の通った件数を読むようにする。`docs/01_技術設計/06_自動化インベントリ.md` を更新する。
- **停止条件・禁止**: 撮影のために本番へデプロイしない。launchd の plist は変えない (既存の土曜の 1 本の段として足す)。本番の撮影で「通った」が 1 件でも出たら本番の撮影をやめ、Mac で開発サーバーを立てて撮る案へ戻してオーナーに聞く。
- **完了条件**: 土曜ランナーが 1 回本番を撮り切り、管理画面に新しい日付の 63 枚が出て、撮影のログと manifest の `adTraffic` で広告・計測の通信が通った件数 0 を示せ、週次レビューの手順に確認が入っている。
- **オーナー決定 (2026-11-24)**: 推奨どおり (a) 土曜ランナーで本番を撮る を採る (判断待ちのカードは推奨どおりで進めてよいとの指示)。次: 残りの 1 (本番で 1 ページ・1 幅だけ撮って通信が通らないことを確かめる) から始める
- **進捗 (2026-11-24・ce9b2c623)**: 土曜ランナーに本番の広告の配置を撮る段を足した (本番で 63 枚・エラー 0・止めた通信 252 件・通った通信 0)。撮影で見つかった Cloudflare の計測の beacon も止める対象に足した。撮影結果の保持 (`config/local-resources.json`) を直近 8 回に合わせて 63 日にした。残り: 土曜ランナーでの初回の実行と、管理画面の警告の読み取り。
- **棚卸し (2026-11-25)**: (a) 土曜ランナーで本番を撮る、は 2026-11-24 に決定済み。残りは土曜ランナーでの初回の実行の確認。

### [MUNI-PREF-RANKING-EXPAND-01] 県×指標の市区町村ランキングを (指標, 県) の組単位で広げる
タグ: [インフラ・計測] [種類:改善] [実行:対話] [起票:2026-11-13] [領域:サイト] [期日:2026-11-28] [待ち:観測]

- **背景 (2026-11-13 オーナー方針)**: 市区町村のページは SEO を踏まえてできるだけ検索に出す。
- **費用の見立て**: 1 描画 約 1.5 秒 = $0.00003 (Workers CPU $0.02/100 万 ms)。8,037 ページ (171 × 47) が毎日 1 回描画されても月 約 $7。根拠の実測は `data/improvement/cloudflare-cost-improvement/improvement-log.md` の CF-CPU-URL-01。
- **次**: (1) 採否を (指標, 県) の組単位に変える。値のある自治体が `MIN_MUNICIPALITIES_PER_PREFECTURE_RANKING` 以上の組だけを、R2 の values から生成スクリプトで git 定数にし、ページ・sitemap・内部リンク・`url-policy.ts` が同じ集合を読む。(2) 第 1 波は GSC で表示のある市区町村ランキングの指標を全県へ。以降は 1 波 約 2,000 ページ。(3) 県別ページの HTML の edge 保持を 7 日にする (`CF-EDGE-TTL-01`)。波ごとの検査は同じ形の繰り返しなので Workflow を使う。
- **停止条件**: 各波の 14 日後に、日次の `workers_cpu_ms` と請求サイクルの累計ペース検査が warning のまま増えている、または GSC の県別ページで「クロール済み - インデックス未登録」が登録数を上回るなら次の波へ進まず、本文テンプレートを見直す。第 1 波は `MUNI-PREF-RANKING-OBS-01` (既存 470 ページの 4 週観測) の結果を読んでから始める。
- **あわせて確かめる (2026-11-13 レビュー)**: 全国版は HTML に上位 50 件だけを出すので、51 位以下の市区町村ページ (`/areas/<県>/cities/<市>`) への静的なリンクが全国版から無くなった (以前は `?page=N` から辿れた)。sitemap には全件が載っているが、内部リンクの他の経路 (県のページの市区町村一覧・県別ランキング) で全市区町村に届くかは数えていない。県別ランキングを広げると各県の全自治体へのリンクが戻る。
- **完了条件**: 成立する (指標, 県) の組がすべて県別パスで表示され、sitemap に載り、波ごとの CPU と登録数が改善ログに記録された。
- **棚卸し (2026-11-25)**: 第 1 波は既存 470 ページの 4 週の記録 (`MUNI-PREF-RANKING-OBS-01`・2026-11-26) を読んでから始める。

### [UI-CHART-TEXT-LOOP-01] チャートの文字のはみ出し・重なりを座標で検出し、起票から修正・本番確認までのループに乗せる
タグ: [UI・UX] [種類:改善] [実行:対話] [起票:2026-09-25] [領域:サイト] [期日:2026-11-30] [待ち:観測]

- **背景 (2026-09-25 実測)**: `/areas/13000` の `StackedAreaChart` で縦軸の目盛りが左に 4〜12px 切れ (`computeMarginsByRatio` の固定幅比)、note のビール月別折れ線 SVG (`b-kakei-beer-peak-month/data/beer-months-by-year-timeseries.svg`、`svg-builder` の `line.ts`) で凡例と斜めの月ラベルが重なる。
- **方針 (検出 → 起票 → 修正 → 本番確認)**:
  1. **検出**: ①`chart_text_issues` — 週次ページ品質監査のブラウザ検査で、SVG の `<text>` の外接矩形が描画範囲から 2px 超出るもの (overflow: visible は除外) と、文字どうしが小さい方の 25% 以上かつ 3px 四方以上重なるもの (スクロールで描かせてから測る。スクロール処理は `ui-probe.ts` の共通関数)。②`blog_svg_text_issues` — 記事 SVG を `svg-lint.mjs` の `findChartTextIssues(svg)` で静的に検査 (`checkImages` が画像 URL を消す前に呼ぶ)。
  2. **起票**: 2 指標を `UI_METRIC_KEYS` と `page-quality-budgets.json` (warning・閾値 0) に足し、既存の `ui-findings.ts --sync` で `UI-FIX-<種類>` カードにする。
  3. **修正の振り分け** (`chartFixGuide`): D3 は軸つき部品すべてに `fitSvgViewBox` を適用。記事 SVG は `.claude/scripts/blog/plan-svg-text-fix.ts @<batch>` で `regen-fixes` / `generator-fix` / `no-data` / `clean` に振り分け、`generator-fix` は `svg-builder` を直す。R2 反映はオーナー承認なので `[実行:ユーザー]` カードを起票して `--mark-owner` で紐付ける。
  4. **本番確認**: 次の週次で消えたら done、残れば pending に戻る。
- **途中成果**: ブランチ `wip/ui-chart-text-loop-01` (commit `f8344bf3c`、2026-09-25 時点の develop の上。develop へは未取り込み)。検出は本番の代表URL 12 件で `/areas/13000` の縦軸切れを検出済み。D3 14 部品への `fitSvgViewBox` 適用・`check-svg-text.ts` と `plan-svg-text-fix.ts` のテストは未完・未検証。
- **次 (実行順)**: ①WIP ブランチを develop へ追従させて型チェック ②生成器の通常テスト (`packages/svg-builder/src/charts/__tests__/text-layout.gate.test.ts`) を維持したまま旧WIPとの差分を整理 ③公開済み記事 SVG の該当件数を実測し、`quality-gate.mjs` を error にするか件数固定の baseline にするか決める ④修正済みの `line.ts` でビール SVG を作り直し差分を確認 ⑤D3 の共通処理を型チェック・テストし、localhost の `/areas/13000` で `chart_text_issues` が 0 になることを確かめる ⑥残りのテスト ⑦週次監査を 1 回手動で流し、カードに手順が載ることを確かめる。
- **関係するカード**: `AREA-DATABOOK-CHART-FIX-01` ② は同じ D3 部品を触るので WIP を先に取り込ませる。`NAV-CLICK-COVERAGE-01` P3 と `SITE-DISPLAY-SEMANTICS-AUDIT-01` も週次監査の同じファイル群に指標を足すので並行実装しない。
- **停止条件・禁止**: R2 反映・ワークフローの dispatch・本番デプロイはオーナー承認。公開済み SVG の該当が多い場合、gate を error にして無関係なコミットを止めない (新規・再生成分だけ止める)。
- **完了条件**: 週次監査が 2 指標を計測して UI-FIX カードに振り分け手順が載り、`/areas/13000` の縦軸切れとビール SVG の重なりが本番で 0 件になっている。
- **確認が要る (11-03 の棚卸し)**: 途中成果のブランチ `wip/ui-chart-text-loop-01` が手元の remote-tracking に無い (`git branch -r --list '*ui-chart-text*'` が空)。リモートに残っているか確かめる
- **棚卸し (2026-11-22)**: 検出器 (`check-svg-text.ts`・`findChartTextIssues`) と予算 (`chart_text_issues`) は入っているが、`data/page-quality` に実測値が無く、ビールの SVG はリポジトリに無い。次は週次ページ品質監査を 1 回流して `chart_text_issues` を記録し、`/areas/13000` の縦軸とビールの SVG (note の R2 原稿) を検出器に通す。
- **確認 (2026-11-23)**: 途中成果のブランチ `wip/ui-chart-text-loop-01` はリモートにも無い (`git ls-remote --heads origin 'wip/ui-chart-text*'` が空)。commit `f8344bf3c` の作業は失われたものとして、次は ① の検出から作り直す。
- **棚卸し (2026-11-25)**: 検出器・予算・D3 14 部品への対応は入っている。11-20 の監査に chart_text_issues の記録が無く、次の週次監査の実測を待つ。

### [DATA-QUALITY-LOOP-01] 全指標のデータ品質を機械チェックし、「誤り・古さ・終了・薄さ」の 4 基準で継続的に直すループを作る
タグ: [コンテンツ品質] [種類:改善] [実行:対話] [起票:2026-09-25] [領域:データ] [期日:2026-11-30] [待ち:観測]

- **判断基準 (上から最初に当てはまる処置)**:
  1. 値・単位・年表記が誤っている → すぐ直す
  2. 公式にもっと新しい年が公表されている → 更新する。GSC 表示の多い順
  3. 調査が終了し新しい年が無い → 公開を続け、ページに「○年で調査終了」を明示する。後継統計があれば差し替える
  4. 観測 1〜2 年かつ需要ほぼ 0 → noindex 候補
  - 「古い」の目安は「最新年が公式の最新公表から公表周期 1 回分以上遅れている」。需要は順番を決めるためだけに使う (4 を除く)。
- **仕組み**: 週次の監査がキュー `data/data-quality/checks/queue.json` (要約 `LATEST.md`) を作る。周期は配信年からの推定なので、「更新」には推定周期による誤検出が混ざる (患者調査 3 年・漁業センサス 5 年など)。処置の前に公式の最新公表 (各省の公表ページか SSDS の掲載年次一覧 `kiso_ken.xlsx`) で確かめる。年カバレッジ監査の要拡張候補は `YEAR-COV-*` カードとして自動起票される (`CYCLE-HEALTH-01` ②)。`ESTAT-CATALOG-REVIEW-01` (取り込めていない・更新が止まっている統計の確認) は 2026-10-26 にこのカードへ統合した。
- **処置済み・切り出し済み (2026-10-27 まで)**: 需要順に約 15 指標を処置した (years の拡張・表の切り替えは data-refresh で R2 反映済み)。今の取得の仕組みで足せないものは `DATA-FOOD-SELF-SUFFICIENCY-MAFF-01`・`DATA-MEDICAL-FACILITY-SOURCE-01`・`DATA-FLOOD-STATS-FILES-01`・`FISHERY-2024-DB-01`・`DATA-ROAD-LENGTH-SOURCE-01` へ切り出した。手動投入の書き手 (`.claude/scripts/data/lib/stats-values-writer.mjs`) は recipe を焼くように直し、`recipe.unbaked` 21 件は 2026-10-19 に再投入済み。
- **次**:
  ① 週 5 指標ずつ、キューの「2 更新」を需要の多い順に処置する (処置済みの指標を除く)。R2 反映はオーナー承認後に data-refresh (dryRun で合格してから dryRun: false)。
  ② 週次の `ranking-integrity-audit` でデータ品質ゲート 100% (`recipe.unbaked` 0) を確かめる。
  ③ `low-elevation-population-ratio-5m` の書き手 `packages/gis/src/geo-analysis/low-elevation-population-overlay.py` が `meta.recipe` を書かない (作り直すと未焼きに戻る)。書き手を変えると manifest の `definitionSha256` が合わず `npm run geo:audit-low-elevation` が止まる (`audit-geo-analysis-artifacts.ts:470`) ので、単独では直さず、次に低標高の Geo を再生成するとき (G04-a の ZIP 176 件と 1km メッシュ人口が要る) に同じ作業で直す。直し方は `node --import tsx .claude/scripts/data/lib/print-metric-recipe.ts low-elevation-population-ratio-5m` の出力を `meta.recipe` に入れ、`audit` で recipe の有無も検査する。
- **完了条件**: 週次の監査が全指標の古さ・表記を検出してキューへ積み、キューの処置状況が管理画面か週次レビューで見え、4 週続けて「新規検出 ≤ 処置件数」で残件が減っている。
- **統合 (2026-11-22 棚卸し): `RANKING-AI-CONTENT-REWRITE-01`** ランキングの AI 解説を読み直し、薄い・古い・誤りのあるものから書き直す。対象の選び方はこのカードの 4 基準に合わせる。
- **棚卸し (2026-11-22)**: `LATEST.md` は 11-14 のまま。11-21 の土曜の監査は最後まで走ったが、`data/ranking/integrity-audit.json` が 1,095,155 バイトで 1 MiB の上限を超え、記録のコミットごと止まった (W47 の監査記録は 1 件も残っていない)。書き出しを詰める修正を入れた (develop。11-14 の版で 913KB から 619KB)。11-28 の土曜で記録が残ることを確かめてから、4 週分の件数の推移を並べる。
- **棚卸し (2026-11-25)**: 手元の `integrity-audit.json` は 11-14 のまま (913KB)。11-28 の週次監査で 1 MiB 未満で記録に残るかを見てから 4 週の推移を並べる。

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

### [SYNC-SNAPSHOTS-DRYRUN-DESC-01] sync-snapshots の試走の説明と実装を合わせる
タグ: [インフラ・計測] [種類:不具合] [実行:sweep] [起票:2026-11-14] [領域:サイト] [待ち:観測] [期日:2026-12-01]

`sync-snapshots.yml` の入力 `dry_run` は「生成のみ」と説明しているが、`.claude/skills/db/sync-snapshots/run.sh` (81 行目付近) は試走のとき生成も R2 反映も省き、予定のコマンドを表示するだけである (2026-11-14 Codex の読み取りレビューで確認)。試走で生成物を確かめられると思って起動すると何も得られない。

- 次: 説明を実装に合わせるか、試走で生成までを行うよう run.sh を直す (どちらかを選んで理由を残す)
- 完了条件: workflow の説明と run.sh の動作が一致し、試走の run のログで確かめた
- **済み (2026-11-24・未コミットの手元)**: 動作は変えず、`sync-snapshots.yml` の dry_run の説明・SKILL.md・local-environment.md を「task と順序を表示するだけ (生成も R2 反映もしない)」に揃えた。契約テスト 17 件 pass。残りは main 反映後に試走の run のログで表示だけになることを確かめる。
- **年間計画へ移した (2026-11-24)**: main 反映後の run の確認待ち。

### [BLOG-AUTO-PUBLISH-DETECT-01] 公開対象の検出が push の先頭コミット 1 つの差分しか見ない
タグ: [インフラ・計測] [種類:不具合] [実行:対話] [起票:2026-11-13] [領域:サイト] [待ち:観測] [期日:2026-12-01]

- **起点**: `blog-auto-publish.yml` は `git diff HEAD~1 HEAD` で変更された article.md を公開対象にし、それが空のときだけ送り箱の総ざらい (`select-republish-slugs.mjs`) に回る。
- **次**: 検出を push の before..after の差分にするか、差分の検出に加えて常に総ざらいを足す。
- **完了条件**: 記事を含む複数コミットの push で、全コミットの公開待ちが 1 回の run の対象になる。
- **済み (2026-11-24・未コミットの手元)**: push では `github.event.before..github.sha` の差分で公開対象を検出し、before が全 0・取得不可・祖先でないときと手動起動は `HEAD~1..HEAD` に戻す。fetch-depth 100。式は env 経由。契約テスト pass。残りは main 反映後、記事を含む複数コミットの push で全コミットの記事が 1 回の run の対象になるかを確かめる。
- **年間計画へ移した (2026-11-24)**: main 反映後の run の確認待ち。

### [BLOG-LEDGER-PUBLISH-SYNC-01] ブログを公開した直後に、記事台帳・ページの索引・指標の逆引きを進める
タグ: [インフラ・計測] [種類:不具合] [実行:対話] [検証:npm run content:check] [起票:2026-11-10] [領域:サイト] [待ち:観測] [期日:2026-12-01]

- **済み (2026-11-14・`f71680fe4`)**: 自動公開の書き戻しに content:sync --from-r2 と metrics:build-index を足し、sync-snapshots にも逆引きを足した。
- **済み (2026-11-14・`aa67dd39c`)**: 手動公開 `publish-blog.yml` の書き戻しを自動公開と同じ中身 (sitemap・タグのキー・未公開の slug の一覧・記事台帳・ページの索引・指標の逆引き) にした。
- **残り (観測)**: 次の自動公開か手動公開の後、手で何も起動せずに `npm run content:check` と `npm run metrics:check --workspace packages/data-configs` が develop で通ることを確かめる。未公開だった記事を再公開した回なら、書き戻しのコミットに `apps/web/src/config/unpublished-blog-slugs.ts` が入っていることも見る。通らなければ、その run の「Remove published draft」の段のログで、`::warning::` と `::error::` の行を読む。この 2 本の workflow は fixture でしか実行しておらず、実機では未確認である。
- **残り (追補・2026-11-14)**: 手動公開 `publish-blog.yml` は draft を消す前に `record-critic-findings.mjs` を呼ばないので、手動で公開した記事の review.md の指摘が台帳 `data/blog/critic-findings` に残らない (`blog-auto-publish.yml` の同じ step は呼んでいる)。
- **完了条件**: 公開の run が 1 回成功し、その書き戻しのコミットの後に develop で `npm run content:check` と `npm run metrics:check --workspace packages/data-configs` が通る。
- **済み (2026-11-24・未コミットの手元)**: 手動公開 `publish-blog.yml` にも draft を消す前の `record-critic-findings.mjs` と台帳の `git add` を足した (workflow-commit-back の契約テスト 42 件 pass)。残りは上の観測と同じ (次の公開の run の後に content:check と metrics:check が通るか)。
- **年間計画へ移した (2026-11-24)**: main 反映後の run の確認待ち。

### [GSC-CANONICAL-REDIRECT-01] 正規URLを示す内部リンク・サイトマップ・転送先を揃える
タグ: [インフラ・計測] [種類:改善] [実行:対話] [起票:2026-10-16] [期日:2026-12-12] [領域:サイト] [待ち:観測]

- **GSC案19 / P2（次に着手）**: canonical・内部リンク・sitemap・転送先の矛盾を対象URL単位で調べ、正規URLへ揃える。
- **GSC案20 / P3（条件確認後）**: 301連鎖が残る箇所は移転の意味を保って最終URLへ直接転送し、内部リンクも更新する。
- **owner / 入力**: ranking-ui-manager・site-ux-manager。10-16監査のcanonical関連例示とHTTP転送履歴、既存UrlPolicy / middleware。Google選択canonicalが異なる8例は現時点で301→200であり、現行不具合とは断定しない。
- **次 / 順序**: ①現行index対象URLから優先調査 ②実際に矛盾/連鎖のある写像だけ是正 ③通常UA・Googlebot UAとURL Inspectionで着地を確認する。ブログ統合先の判断はBLOG-DUPLICATE-AUDIT-01が所有する。
- **停止条件**: 内容の違うページを一律canonical化しない。全旧URLをトップへ転送しない。過去のGSC分類だけで現行転送を変更しない。公開は別途指示で行う。
- **完了条件**: 対象ごとの正規URL・処置・根拠があり、採用箇所の信号が一致する。案20は連鎖解消または維持理由を記録する。
- **2026-11-01 実測・局所修正（未デプロイ）**: ブログ一覧の2・10・24・25ページの本番HTMLは全て canonical `/blog`。未完了ブログ32 URLはページ分割の一覧（1〜32ページ）から全件HTMLリンクで辿れたため、親一覧のcanonical矛盾を修正。1ページ目は`/blog`、2ページ目以降は各`?page=n`をcanonical/OG URLに使う。公式根拠: https://developers.google.com/search/docs/specialty/ecommerce/pagination-and-incremental-page-loading 。**次**: デプロイ後に2・10・32ページのcanonicalと次ページの`<a href>`を本番で確認し、32 URLの再クロール・登録をURL Inspectionで観測する。Google側の登録改善は未判定。
- **棚卸し (2026-11-22)**: 本番の `/blog?page=2`・`10`・`32`・`33` は 200 で、canonical は各ページ自身を指し、次ページへのリンクもある。残りは 32 URL の URL Inspection での登録の観測 (期日 12-12) と、案 20 の 301 連鎖の扱い。

### [GSC-404-VALUE-TRIAGE-01] 内部リンク・被リンク・過去流入のある404を優先分類する
タグ: [インフラ・計測] [種類:改善] [実行:対話] [起票:2026-10-16] [期日:2026-12-12] [領域:サイト] [待ち:観測]

- **GSC案21 / P2（次に着手）**: 404例示を内部リンク・取得できる被リンク・過去GSC流入と照合し、救済価値があるURLを選ぶ。
- **owner / 順序**: gsc-analyst・site-ux-manager。10-16監査の12,658件は総数、例示は1,000件という範囲を保持する。現sitemap・内部リンクあり→過去流入/被リンクあり→意図的廃止の順に分類する。
- **次**: 対応する移転先があれば個別301、現役ページなら原因修正、代替がなければ404/410維持を選ぶ。土砂災害Geoの404はPR #1140で是正済み（本番・Googleライブ検査の証拠: `data/gsc/ui-audits/2026-10-17-remediation.json`）。既知の本文410リンクはBLOG-LINK-410-REMAP-01へ統合する。
- **仕分け (2026-11-23・W47 の例示 999 件・是正キュー `data/gsc/coverage-remediation/coverage-remediation-queue.json`)**: 410 は 806 件で、意図的な廃止なので放置する。今は 200 で sitemap にあるものは 25 件で、`observe-after-fix` の観測に任せる。転送済みは 3 件、正規 URL が別にあるものは 7 件、リソースは 38 件。判断が要ったのは、今も 404 で sitemap に無い 121 件。過去の GSC 流入 (全週の `pages.csv` の合計) はクリック 0 件、表示のあるものは 9 件だけで、ブログからのリンクは 0 件だった。内訳と処置は次のとおり。
  - **Geo のデータ ID 22 件** (`/geo/datasets/W01` など): 全ページの RSC データに入る広告除外の一覧 (`AD_FREE_PATH_PREFIXES`) が、公開できない非商用データの URL まで書き出していた。一覧をページが存在するデータだけに絞った (`ad-free-paths.ts`・develop・未デプロイ)。
  - **数字だけのパス 86 件** (`/22`・`/1,740` など): 今の HTML には出どころが見つからない。中身が無いので 404 のまま置く。
  - **Kindle の第 2〜4 弾の商品ページ 10 件** (表示は最大 104・クリック 0): 商品一覧から外した本で、移転先が無いので 404 のまま置く。`/products/service-geo-service-01` も同じ (テストで不在を固定済み)。
  - **`/category/food-beverage`**: 自社の note 記事から張られていた唯一の被リンクの 404。note 側のリンクは `NOTE-CIRCULATION-LINK-FIX-01` で `/themes/household-food-spending` へ置換済み。
  - **`/components/AgingHeatmap`・`/charts/$`・`/api/ranking/manufacturing-sales-private/download`**: 記事のサンプルコードの文字列と、廃止した指標のダウンロードの URL。404 のまま置く。
- **残り**: ① 次のリリースの 2 週後 (広告除外の一覧の修正が本番に出てから)、GSC の 404 の例示から `/geo/datasets/` が新しく増えていないことを確かめる。② 被リンクは GSC の「リンク」レポートからしか取れず、欠測を 0 と扱っていない。被リンクの照合は、リンクの書き出しを週次の取得に足すときに行う (今回は未照合)。
- **停止条件**: 被リンク情報の欠測を0と扱わない。無関係なページへの転送や廃止ページの大量復活をしない。公開は別途指示で行う。
- **完了条件**: 調べたURL群の優先度・処置・移転先根拠・既存カードへの対応が残り、採用した修正が検証可能な単位になっている。

### [OPENDATA-DEMAND-WAVE-01] 検索の需要の手がかりがある未展開の題材を、公的統計から波で足す
タグ: [コンテンツ品質] [種類:制作] [実行:対話] [起票:2026-11-17] [領域:データ] [期日:2026-12-15] [待ち:時期]

- **背景 (2026-11-17 オーナー指示「幅広く展開しないと需要があるか分からない」)**: GSC はページがある語しか記録しないので、出す前の需要は Google のサジェストで見た (225 回の取得・679 種。)
- **進行中の 13 本 (2026-11-17 に定義を非公開で追加)**: 学力調査の国語 2・小 6 自己肯定感・夢 2・学校が楽しい 2・友達関係 2、道路交通センサス 3 (混雑度・大型車混入率・混雑時旅行速度)、降雪時の交通事故 1。取り込みの workflow `external-metric-ingest.yml` は main を checkout して `ingest-metric.mjs` の `METRIC_KEYS` を読むので、定義が main に入るまで値を作れない (手元には非公開 R2 の読み取りの認証情報が無い)。2026-11-17 のリリース後の試験実行 (run 44059477866) は、公開済みの 5 本の候補が台帳から外れていて 1 本目で止まった。一括の対象を台帳に候補が残る指標だけにする修正 `d18e2a825` は develop にあり、main に入るまで取り込めない。公開済みの 5 本は `--metric` 指定の復元 (provenance の restore) も同じ検査で止まるので、候補を外す代わりに status を変えるか、復元の経路を別に持つかを決める。済み (2026-11-18): 修正は PR #1283 で main に入り、`external-metric-ingest.yml` で 13 本 × 47 県 (611 行) を R2 の新しいキーへ上げ、読み戻して 13 本とも 47 県を確認した (run 44203405913)。残りの手順: (b) 13 本を `isActive: true` にして KNOWN・sitemap を生成し直す (c) その次のリリース直後に `sync-snapshots` の ranking-items → ranking-values を回し、ranking-items の OGP の段が落ちたら回し直す (d) 本番の `/ranking/<key>` が Googlebot UA で 13 本とも 200 を確かめ、improvements の `OPENDATA-RANKING-EFFECT-01` に 13 本と公開日を足す。済み (2026-11-18): (b) a1d09d14f で 13 本を isActive: true にし、KNOWN・sitemap は sync-ranking-keys (5bbdd916f) で develop に入った。(c) sync-snapshots の ranking-values (run 44215694484) と ranking-items (run 44214572308。OGP の段は values の 404 で一度落ち、回し直しで成功) を回した。(d) リリース PR #1285 (cf3d2b379、デプロイ run 44242824251) のあと、本番の `/ranking/<key>` が Googlebot UA で 13 本とも 200 (title が指標名)。効果の観測は improvements の `OPENDATA-RANKING-EFFECT-01` へ引き渡した。確認待ち: 極性 (国語 2・小 6 自己肯定感は高いほど良い、降雪時の事故は高いほど悪い、ほかの 9 本は中立。`data/metrics/policy/polarity.ts`) 。道路 3 本の surveyId `road-statistics` は、調査の名前の台帳 `data/surveys/master/source-names.json` が道路交通センサスを既にこの調査へ割り当てているので正本どおり (2026-11-17 確認)。
- **次 (実行順)**: ① 2026-11-17 の 28 本 (学力 3・熱中症・75 歳以上の事故・NDB 10・学力と道路と降雪の 13) の判定 (improvements の `OPENDATA-RANKING-EFFECT-01`・`OPENDATA-NDB-EFFECT-01`、期日 12-15) を読む。② 上の題材から、出典が 47 県・同じ時点でそろうものを open-data-curator が展開の台帳へ候補として足す (`/data/open-data`)。③ 1 波 10〜20 本で、今日と同じ手順 (定義 → 取り込み → 公開 → 本番の実測) で出す。
- **波の止める条件 (各波の公開から 28 日後に判定)**: 波のうち検索の表示が 0 のページの割合が、既存ランキングの 12 週の実測 41% (2026-07) を大きく上回る (目安 60% 超) か、GSC の「クロール済み - インデックス未登録」が波の本数を超えて増えたら、次の波へ進まず、題材の選び方を見直す。表示とクリックが付いた題材だけ、同じ出典の指標を足して深掘りする。
- **停止条件・禁止**: 民間調査の数値を出典にしない。値の検査 (47 県・単位・出典) を通らない指標は出さない。既存の公開系列の差し替え (交通事故の 2025 年など) はオーナーの承認を取ってから。
- **完了条件**: ① の判定が記録され、② で台帳に足した候補のうち少なくとも 1 波が公開され、その波の 28 日後の判定が improvements に登録されている。

### [PRICE-DATA-PACK-REVIEW-01] データ集の価格実験を 2026-12-30 に判定し、導線を増やす
タグ: [収益化] [種類:改善] [実行:対話] [起票:2026-11-04] [期日:2026-12-30] [領域:商品] [待ち:時期]

- **起点 (2026-11-04 オーナー決定)**: note のデータ集 13 本を値下げした (テーマ別 12 本 ¥980・総合集 ¥2,980。)
- **分かっていること**: 値下げ前の 2026-10 はテーマ別 12 本で計 93 PV、総合集 14 PV、売上 ¥0。データ集の公開は 10 月 24〜25 日で、観測は約 1 週間。10 月 31 日以降の売上は未確認で、次の土曜の記録で読む。買った人がいた場合の対応は未決。
- **次**: ① 導線: 有料データ集の閲覧を増やす (`PRODUCT-REFERRAL-MEASURE-01` と合わせ、ランキングと記事の案内のクリックを週次で読む) ② 判定日に基準どおり続ける・変える・止めるを決め、`price-history.json` の `status`・`result` と `product-strategy.json` の `decisions` に書く ③ 実験の判定後に、有料の下書き 54 本を公開するかを 1 本ずつ決める。
- **同時の変更 (2026-11-04)**: 同じ日に note の 13 本の題へ「都道府県別」「CSV・Excel」などの検索語を入れた (本文・価格は不変)。判定では価格の効果と題の効果を分けられない。
- **判定**: 導線を入れてから 8 週で 5 件以上売れたら続ける。1〜4 件なら価格か見せ方を 1 回だけ変える。0 件ならデータの単体販売を止める。基準の 5 件は仮の値で、月 1,000 PV 弱の閲覧を前提にしている。期日の 2026-12-30 は導線が今日入った場合の日付なので、導線が遅れたら後ろへずらす。旧価格の購入者の有無は未確認。
- **停止条件・禁止**: 判定まで価格を重ねて変えない (前後を比べられなくなる)。価格を変えるときは `update-note-price.mjs` を使い、先に履歴へ書く。不安を煽る訴求で閲覧を増やさない。
- **完了条件**: 判定の結果と次の価格が履歴と決定の記録にあり、商品の台帳に反映されている。

### [GSC-MOBILE-PERF-PLAN-01] 実ユーザー性能とモバイルの検索意図から必要な改善を選ぶ
タグ: [UI・UX] [種類:意思決定] [実行:対話] [起票:2026-10-16] [領域:サイト] [期日:2026-12-01] [待ち:時期]

- **GSC案34 / P2（次に着手）**: CrUX・GSC CWV・既存PSIの取得状況を確認し、実ユーザー計測とラボ計測、URL単位とorigin単位を区別する。
- **GSC案31 / P3（条件確認後）**: モバイルで結論・表に到達しにくいことを実測した場合、検索意図に沿って配置変更を採用する。
- **GSC案35 / P3（条件確認後）**: 重い地図・チャート・画像、表示ずれの原因を特定できた場合、本文の早期表示・画面外の遅延読み込み・寸法確保から必要な対策を選ぶ。
- **owner / 順序**: performance-auditor・site-ux-manager。GSC優先ページの端末別流入と性能を確認→同テンプレ代表をモバイルで実測→原因と影響範囲を特定→既存実装カードへ統合する。GeoはGEO-UIUX-SPEED-01、県目次はAREA-TOC-MOBILE-01、既存品質errorはPAGE-QUALITY-ERROR-BACKLOG-01が実装を所有する。
- **停止条件**: CrUX欠測を良好/不良と扱わない。スコア満点だけを目指さない。主要本文を遅延させない。標本や権限不足は未確認とし、取得可能な代替と限界を記録する。
- **完了条件**: 計測範囲・対象端末・問題の有無・3案の採否が決まり、採る場合は根拠・対象・検証指標を既存カードへ引き渡す。判断だけで改善効果ありとしない。
- **期日の引き直し (2026-11-24)**: 判断のカードで 11 月の重点外。12 月の月次計画で採否を決める

### [GSC-PARAM-URL-POLICY-01] パラメーター別の検索対象と同一状態URLの整理方針を決める
タグ: [インフラ・計測] [種類:意思決定] [実行:対話] [起票:2026-10-16] [領域:サイト] [期日:2026-12-01] [待ち:時期]

- **GSC案22 / P3（条件確認後）**: UTM・並び替え・県選択・年度選択の内容差を確認し、独立して検索対象にするか、正規URLへまとめるかを決める。
- **GSC案23 / P3（条件確認後）**: 同じ表示状態のパラメーター順序違い・不要な既定値等が増殖している場合、リンク生成側で正規化する案を採用する。
- **owner / 入力**: site-ux-manager・ranking-ui-manager。10-16監査の代替canonical833例、現行UrlPolicy、実HTMLとリンク生成元。現状が適切なcanonicalである例を欠陥扱いしない。
- **次 / 順序**: パラメーターごとに内容差・読者用途・検索需要・canonical・内部リンクを表にする→同じ状態を表す組だけ特定→最小の正規化案を選ぶ。信号整合の実装はGSC-CANONICAL-REDIRECT-01へ接続する。
- **停止条件**: 年度/地域の違いを一律に消さない。共有URLや絞り込み操作を壊さない。問題が見つからなければ変更しない。
- **完了条件**: 対象パラメーターの維持/統合と根拠が決まり、採用案には対象生成元・保持する機能・回帰条件がある。
- **2026-11-11 実測 (GSC 最終更新 11-06・本番 HTTP・サイトマップ 11 本)**: 未送信で登録済みの 764 件 (先頭 500 件) に `/municipalities/ranking/<key>?page=`・`?pref=` 137 件、`/ranking/<key>?s47_ogp=<hash>` 23 件、`/blog?page=` 17 件、`/themes/<slug>?pref=` 3 件 (こちらは 301)。`?page=`・`?pref=`・`?s47_ogp=` の 3 例は 200 で canonical が本体を指す。`?s47_ogp=` 付きのページ URL がどこから張られているかは未確認。**次**: `s47_ogp` をページ URL に付けている生成元を探し、付けない形にできるかを決める。
- **期日の引き直し (2026-11-24)**: 判断のカードで 11 月の重点外。12 月の月次計画で採否を決める

### [BLOG-NOTEBOOKLM-RESEARCH-01] NotebookLM の調査材料を記事に入れる段を試し、公式 API (企業版) を使うか決める
タグ: [コンテンツ品質] [種類:意思決定] [実行:対話] [起票:2026-10-28] [領域:サイト] [期日:2026-12-01] [待ち:時期]

- **用意済み**: `/notebooklm-research` に「新規記事の調査段」を書いた。非公式 CLI (`~/bin/notebooklm`) の回答をそのまま `contents/blog/<slug>/research.md` に保存し、`write-blog-headless.ts` が author prompt に足す (白書の数値は書かせない)。Claude は回答を読まないのでこの段の Claude トークンは 0。ログイン (`notebooklm login`) は人がブラウザで行い、期限切れになると止まる。CI では使えない。
- **次**: 型B 以外の記事 3 本で research.md あり・なしを書き分け、critic の指摘 (背景の根拠不足) が減るかを headless-runs.csv と review.md で比べる。
- **決めてほしいこと**: 効果があれば、企業版 (Gemini Notebook Enterprise・Google Cloud のライセンスが要る) の公式 API に移すか。移さない場合は対話セッションで人がログインして回す運用のまま。

### [CI-NPM-CACHE-01] workflow 49 本のうち 46 本が npm ci をキャッシュ無しで実行している
タグ: [インフラ・計測] [種類:改善] [実行:対話] [起票:2026-11-22] [領域:サイト] [期日:2026-12-02] [待ち:観測]

- **事実 (11-08〜11-21 の 1,000 run)**: npm ci は 42〜83 秒、キャッシュの復元は 9〜14 秒 (develop gate・PR で実測)。deploy は 83 秒、fetch-metrics は 3 job とも約 80 秒。
- **次**: 人が待つ deploy-workers・blog-auto-publish・data-refresh・sync-snapshots から復元を入れ、残りへ広げる。
- **完了条件**: 4 本の run で npm ci の step が 20 秒未満になった実測を、このカードに書いた。
- **進捗 (2026-11-24・fd7a9f7af)**: 人が待つ 4 本の workflow の 6 job に node_modules の復元だけのキャッシュを足した (key は develop gate と同じ)。残り: 4 本の実 run で npm ci の step が 20 秒未満になったかを実測する。キャッシュの key の名前が node20 のままで、全 workflow は Node 22 で動く (動作への影響は無いが名前と実体が合わない)。
- **観測 (2026-11-25)**: キャッシュ追加後の最初の main の Deploy (45516018452) は初回で miss、npm ci は 30 秒。保存後の 2 回目以降の run で 4 本を測る。

### [CI-PR-WAIT-01] PR の検査は中央値 12.9 分で、安い検査で落ちても赤と分かるまで約 13 分かかる
タグ: [インフラ・計測] [種類:改善] [実行:対話] [起票:2026-11-22] [領域:サイト] [期日:2026-12-09] [待ち:観測]

- **事実**: `pr-quality-check.yml` の Unit Tests は web 250 秒 + packages 334 秒 + admin 83 秒を 1 job で直列 (12.1 分)。
- **次**: ①Unit Tests を develop gate と同じ並列の job に分ける ②metadata の生成を build と並べる ③Static Gates が落ちたら残りを止める ④preflight に Web unit と Catalog Gates を足すかを決める (`CI-TOOLING-FOLLOWUP-03` の preflight の追補と合わせる)。
- **完了条件**: PR の run の中央値と、Static Gates の失敗が赤になるまでの時間を、前後の実測で比べて書いた。
- **進捗 (2026-11-24・a622ab186)**: Unit Tests を suite ごとの並列にし、Static Gates が落ちたら run を止めるようにした (変更前は Static Gates の失敗が 3.5 分なのに赤になるのは約 14 分後)。残り: push 後の PR で所要を実測する。metadata の生成を build と並べる案は見送った。actionlint は手元に無く未実行。
- **観測 (2026-11-25)**: 変更後の PR の run は #1301 の 1 件 (14.8 分。Static Gates 6.1 分)。3 件たまってから中央値を出し、Static Gates を落とした run の時間も測る。

### [CI-CRON-TIMING-01] 定期実行が R2 の鍵と時刻で人の作業・互いの計測とぶつかる
タグ: [インフラ・計測] [種類:改善] [実行:対話] [起票:2026-11-22] [領域:サイト] [期日:2026-12-08] [待ち:観測]

- **事実**: ①11-14 23:29 の手動 deploy が、`r2-isr-gc` (最大 25.6 分) と `cleanup-r2-sns-videos` の直後で開始まで 21.8 分待った ②schedule の起動は cron より 3.3〜7.5 時間遅い (fetch-metrics は 01:00 JST の予定が 06:53・07:35) ③`fetch-metrics-weekly` と `quality-suite-weekly` が同じ cron `0 16 * * 5` で、13 job と本番への巡回が重なる。
- **次**: ①GC と cleanup を実際に動く時刻で人の作業時間から外す (鍵を prefix で分ける案は、書き込み先の照合が先) ②後段 (note-figure・ledgers・seo-keyword・smoke) を時刻ずらしでなく workflow_run でつなぐ ③品質系を計測の後へつなぐ。
- **完了条件**: 2 週の run で、後段が計測の完了の後に起動し、手動 deploy の鍵待ちが 5 分未満だった記録がある。
- **進捗 (2026-11-24・d6a5d415b)**: R2 の GC と動画の掃除を人の作業の時間帯の外へ出し、台帳 2 本を計測の後へ workflow_run でつないだ。残り: 2 週分の run の記録で効果を確かめる。seo-keyword・smoke・quality-suite を計測の後へつなぐ件は未着手。

### [THEME-PAGE-REVIEW-01] テーマページを、全ルート込みの実績で採点し、共通の UI と指標を見直す
タグ: [UI・UX] [種類:改善] [実行:対話] [検証:npm run theme:portfolio:audit] [起票:2026-11-14] [領域:サイト] [進行中] [期日:2026-12-10] [待ち:時期]

- **ゴール (2026-11-14 オーナー決定)**: 成果は 4 つで測る。G1 検索からのクリック (表示 800 以上でクリック率が中央値 2.33% 未満の 13 テーマを中央値へ)・G2 読みやすさの品質基準 (下の 6 項目の違反 0)・G3 サイト内の回遊 (テーマ → ランキングの移動 21% を悪化させない)・G4 データの信頼性 (品質の監査が 7 日以内・実験が全ルート込みで判定済み・全 56 テーマの指標が見直し済み)。ページの長さはゴールにしない。畳み・開閉の UI は使わない。本番への反映は段ごとにオーナーが確認してから。計画の全文は `~/.claude/plans/gentle-strolling-tide.md`。
- **品質基準 6 項目** (`measure-theme-weight.mjs` の violations): 最初の画面に数値のタイルが 2 個以上・数字の途中で折り返さない・値の無いタイルが無い・横にはみ出さない・表の 1 列目が 1 行 4 文字未満で折り返さない・ページが 200 を返す (港湾・鉄道・道路は県別に出さない設定なので測らない)。
- **基準 (本番・2026-11-14・`data/themes/ui-weight/2026-11-14.json`)**: 218 ページ中 135 ページに違反。表の 1 列目が読めない 56 テーマ (スマホ幅)・最初の画面に数値が少ない 16 テーマ (主に全国版)・値の無いタイル 3 テーマ。採点表は管理画面 `/quality/theme-viewpoints`。
- **済み (段 1)**: 全ルート込みの集計、品質基準の計測、品質の監査の復旧 (記録が 1 MiB を超えて書けなくなっていたのを分割して書く形に直した)、実験の判定の整理 (判定待ち 55 → 10。)
- **次**:
  1. 段 2 共通の UI の残り: 市区町村のテーマと地域分析のページの表示確認、骨組みの契約テスト。**本番の測り直し (2026-11-15・`data/themes/ui-weight/2026-11-15.json`)**: 違反のあるページは 218 中 135 → 34。表の 1 列目が読めない 114 → 2 (土砂災害の県別)・値の無いタイル 6 → 0・200 以外 0 (計測中に 1 ページが一時的に 503、測り直して 200 の値に差し替えた)。残るのは、出せる数値が無い全国版 11 テーマ 22 ページ (気候・物価・地震・環境・健診・地価・土砂災害・自治体のデジタル化・職業別の賃金・エネルギー・津波) と、最初の画面の数値が 1 つの全国版 5 テーマ 10 ページ (高齢化・貨物と物流・地理的アクセス・地方財政・スポーツ)。ページの高さはスマホ幅で全国版 −4.5%・県別 −4.6%。値の単位・値の無いタイル・読めない表・県間移動の表は済み。手元の全 56 テーマの計測 (2026-11-14) で、違反のあるページは 218 中 135 → 50 (うち 22 は出せる数値が無い全国版 = データの穴)。その後に数字の折り返しと検算の表を直し、該当テーマの測り直しで数字の折り返し・横のはみ出し・値の無いタイルは 0。残るのは「最初の画面に数値が少ない」6 テーマ (高齢化・地震・地理的アクセス・地方財政・スポーツ・津波の全国版か県別。段 4 で数値タイルのある章を先頭にする) と、土砂災害の県別の集計表で県名のボタンが 2 行になる 1〜2 行。**見出しの直下に主指標の値を並べる「要点のタイル」は入れない (2026-11-14 オーナー決定)**。同じ値が本文に 2 回出るため (2026-10-30 に「主なデータ」の節を外したのと同じ理由)。最初の画面に数値が入らないテーマは、段 4 の指標の見直しで数値タイルのある章を先頭にする。`THEME-DASHBOARD-TEXT-TRIM-01`・`THEME-SINGLE-CARD-BUNDLE-01` をこの中で進める。
  2. 段 3 検索の題と説明文: **題はいま変えない**。題・説明文は 2026-11-12 21:54 の本番デプロイで全テーマ共通の仕組みに統一済み (`THEME-SEO-UNIFY-01`) で、同カードが 4 週の測定中は題を変えないと決めている。対象 13 テーマの低いクリック率は変更前 (〜11-05) の数字。この変更を 13 テーマぶん、全ルート込みの実験 `THEME-COPY-20261112-<テーマ>` として登録した (d28 = 12-10、d56 = 2027-01-07)。12-10 に暫定の結果を見て、中央値に届かないテーマだけ題の語を直す。
     - 検索語の所見 (GSC 2026-10-09〜11-05・`gsc-query.mjs --dims query --filter 'page*=/<テーマ>'`): 県別ページに来るのは「県名 + 具体的な語」(「新潟県 気候」「北海道 物価」「高知県 gdp」「鳥取県 高齢化率」「財政力指数 新潟県」「広島県 土砂災害警戒区域」「長野県 森林面積」)。8〜10 位に出て押されていない。題のテーマ名が検索語と違うテーマがある (地域経済 → 検索語は「gdp」、物価・消費 → 「物価」、自然環境 → 「森林面積」)。題を直すときは、テーマ名でなく検索語に出る語を先頭に置く。
  3. 段 4 指標の見直し: Workflow で 1 回 5 テーマ (調査 `theme-researcher` → 設計 `theme-designer`。agent はファイルを書かない)。案は機械で検査し (実在しない指標・重複・別のテーマの主指標・出典の URL・調査の紐付け・`validate:catalog`・カタログのテスト)、通ったものを `apply-design.ts --approved` で適用して、提案文書 (`data/themes/reviews/2026-11-14-theme-<key>.md`・`implemented-pending-release`) を残す (2026-11-14 オーナー指示: 提案は基本的に承認、出し直しは設計し直して自動で承認)。**済み (38 テーマ)**: 測定中の実験が無いテーマを組み直し、登録済みの指標 87 件を副指標として載せた。手元の計測で違反のあるページは 146 中 87 → 22 (16 は全国の値が無い全国版、6 は全国版で最初の画面の数値が 1 つ: 貨物と物流・地理的アクセス・スポーツ)。県別・スマホ幅の最初の画面の数値は 24 テーマで増えた。**残り**: 実験のある 17 テーマは提案文書だけを作り、カタログは変えていない。実装は実験の判定の後で、年間の予定の `THEME-PAGE-REVIEW-HELD-01` (期日 12-10) が持つ。「食卓と家計の支出」は 189 指標を表と数値タイルで手作りしたテーマなので、機械の組み直しの対象から外した。公開日に、組み直したテーマの実験を `metricScope: all-routes` で登録する。費用の実績は 1 回 (agent 10 体) で約 107〜120 万トークン。
  4. 段 5: 反映 28 日後と 56 日後に G1・G3 を全ルート込みで記録し、未達は原因と次の手を残す。
- **完了条件**: G2 と G4 の目標を満たし、G1 と G3 は反映 56 日後の実測と判定が記録されている。
- **棚卸し (2026-11-25)**: 題の変更と実験のある 17 テーマの実装は、実験の判定日 2026-12-10 まで動かさない (`THEME-PAGE-REVIEW-HELD-01` と同じ日)。

### [GEO-SOURCE-PUBLISH-PERF-01] Geo原典の生成・公開時間を計測し、検証強度を保って待ち時間を減らす
タグ: [インフラ・計測] [種類:改善] [実行:対話] [検証:cd apps/web && npx vitest run scripts/geo-source-publish.test.ts] [起票:2026-09-13] [領域:データ] [期日:2026-12-15] [待ち:観測]

- **済み (2026-11-14・148517aa4)**: 4 件固定バッチを上限 4 の worker pool に変え、失敗の後は新しい投入を止めて実行中の全件の完了を待つことをテストで固定した。
- **残り (計測)**: Geo 原典の次の CI run (同じ scope と bytes) で metrics-prepare / metrics-publish-dry-run / metrics-publish-apply を取り、run 34726806521 (準備 42分29秒・dry-run 37分07秒・apply/readback 2時間41分53秒) と並べて記録する。lock 待ちは `gh run view <id> --json createdAt,jobs` で、run の作成時刻とジョブの開始時刻の差から求める。短縮が実測で確かめられるまでは高速化を完了としない。
- **残り (実装)**: 計測で HEAD と解凍の寄与を見てから、候補の重複解凍と HEAD の整理を選ぶ。buildExactPlan・preflight・共有 writer の前後で、1 件あたり HEAD が 4 回以上発生している。原典 SHA と生成コードと schema に結び付けて、検証済み生成物を再利用・再開する仕組みを設計し、失効条件と失効時の再生成をテストで拒否・固定する。
- **残り (判断)**: コード push を検証だけにし、公開は明示 scope の CI に分けるかを決める。推奨は分けることで、理由は現状の develop push が全件の再生成・公開を起動するからである。準備を書き込み lock の外に出すかは、巨大 artifact の保存・転送・復元にかかる時間と費用を実測してから採否を決める。
- **完了条件**: 対象テストが、並行上限 4・失敗後の停止・ETag の変更・gzip と decoded の不一致・scope 漏れ・生成物の失効・catalog の順序の異常を拒否すること。同じ scope と bytes の CI で、全フェーズと待ち時間・API 数・転送量の変更前後が残っていること。変更なし・一部変更・再開・全件監査のどの経路でも、公開対象と同じ強度の検証を取り落とさないこと。採用しなかった案には実測の理由を残すこと。
- **追補 (2026-11-22・全体の洗い出し)**: 11-14 の run は r2-write の鍵を 109 分持った (準備 41 分・dry-run 39 分・publish 27 分)。同時刻の blog-auto-publish は 119.8 分 (中央値 15.1 分)。準備と dry-run を鍵の無い job に分け、鍵を publish の job だけにすれば約 27 分になる。
- **棚卸し (2026-11-25)**: 11-21 の run 44917511900 は job が 1 本で 3 時間 37 分と、基準の run と構造が違い比べられない。次の Geo 原典の run で各段を測る (再確認日 12-15)。

### [SSDS-DEMAND-BATCH-01] SSDS未使用項目の需要ファースト展開
タグ: [コンテンツ品質] [種類:制作] [実行:対話] [領域:データ] [期日:2026-12-01] [待ち:時期]

- **owner**: ranking-expander
- **trigger**: GSC、記事企画、テーマ欠測のいずれかで具体的な検索需要が確認できたとき。
- **制約**: 約4,000件の未使用項目や約17万metric相当を一括投入しない。1バッチ最大20件、公開後4週の実測を次バッチのgateにする。
- **棚卸し (2026-11-25)**: 着手の条件は、検索需要が確認できたとき。12 月の月次計画で需要の有無を再確認する。

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

### [ISSUE-PAYING-NEED-01] イシュー: 雑学の読者で広告を伸ばすのか、統計を仕事に使う人から売上を得るのか
タグ: [収益化] [種類:意思決定] [実行:対話] [起票:2026-11-05] [領域:商品] [期日:2027-01-02] [待ち:時期]

- **問い**: stats47 が解く問題は、好奇心ではなく、むしろ仕事の問題なのか。統計を仕事に使う人は、お金を払うほど困っているのか。
- **仮説**: 今解いているのは「地元や話題の数字が気になる」という好奇心。仕事で払う人はまだ確かめられていない。
- **実測 (2026-11-05 観測)**: 検索 14,733 クリック/28日、食べ物の消費量が約 31%。
- **位置づけ**: どの顧客を選ぶかの上位の問い。2026-11-14 にオーナーが、聞き取りで先に確かめる進め方 (行政資料の pilot。聞き取り 0/3 件で停止していた) をやめ、商品を出して実売で確かめると決めた (収益化戦略 §3.4)。
- **問いの台帳との配線**: `data/content/issues.json` の `revenue` が `実務`・`データ` の問いを、聞き取りで「仕事で使うか」を尋ねる材料にする。
- **次**: 仕事の読者に向けた商品 (データパック・市区町村データ・ノウハウ) と KDP の実売の判定 (`MUNI-DATA-PRODUCT-PILOT-01`・`KNOWHOW-PRODUCT-PILOT-01`・`KDP-EXPANSION-01`) を待ち、どちらの読者で売上が立つかを月次計画で決める。
- **別の仕事の読者の候補 (2026-11-11)**: 補助金・創業計画を書く事業者とその支援者。根拠と試す順番は `SUBSIDY-EVIDENCE-STRATEGY-01`。
- **完了条件**: 上の判定の実売から、どちらの読者へ進むかをオーナーが決めて `02_収益化戦略.md` へ反映している。

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
