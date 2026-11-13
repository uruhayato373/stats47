---
title: バックログ (タスクマスタ)
type: backlog
status: active
updated: 2026-11-01
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

並び順が着手順。上限 10 枚 (DG081)。2026-11-01 の月次計画で 13 枚 → 8 枚に整理した後、同日のオーナー判断で Gemini 無料枠の復旧を追加し、子育ての2枚を 🟡 へ移し、家計調査の1枚を 🔴 に上げて 8 枚。サイト重点は家計調査へ変更、商品重点は製造品出荷額を維持。10 月の重点の残り・30 日超の未着手・維持領域のカードは 🟡 へ送った。

### [MEASUREMENT-MAC-DIRECT-01] 認証付き計測を土曜の Mac の取得だけにし、残っている CI 専用のコードと Secrets を撤去する
タグ: [インフラ・計測] [種類:改善] [実行:対話] [検証:npm run measurement:test] [起票:2026-10-19] [期日:2026-11-05] [領域:管理]

- **方針 (2026-10-20 オーナー判断)**: ログインが要る計測 (A8・楽天・note・KDP・GSC の画面) は、毎週土曜 07:00 に Mac がその場でログインして取得し記録する。CI にもセッションを持たせない。セッションのエージェントは記録から判断する (`.claude/rules/recorded-measurement-first.md`)。2 段階認証が要る週は、その取得元を判定不能にして次の週を待つ。
- **済**: CI の `authenticated-measurement.yml` は 2026-10-20 に削除済み。Secrets (`MEASUREMENT_SESSION_*`・`STATS47_AUTH_*`・`AFB_API_KEY`) は同日にオーナー承認で削除済み (`MEASUREMENT_VAULT_KEY` は週次ワークフローが使うので残す)。11-01 に記録が develop に届かない不具合 (clone の追跡ファイルの書き換えで `pull --rebase` 拒否、push のトークン切れ) を `scripts/scheduled/_common.sh` の `push_clone_records` で是正した (失敗時は clone のブランチ `unpushed/<日付>-<段>` に残して rc=1)。
- **次**:
  1. 11-07 (土) の土曜ランナーのあと、develop に「authenticated measurement status (Mac)」と「Saturday audit records 2026-11-07 (Mac)」の 2 つのコミットが入り、`npm run measurement:status` に stale が無いことを確かめる。入っていなければ clone (`~/stats47-measurement`) の `git branch --list 'unpushed/*'` と `~/Library/Logs/stats47/measurement-collect-local.log`・`weekly-audits.log` を読む。
  2. 初回が通ったら CI 専用のコードを削除する: `collect.mjs` の CI 分岐 (`MEASUREMENT_SESSION`・`STATS47_AUTH_*`・`ciLogin`・保管庫の `<取得元>/session` と `auth-recovery` の書き込み)、`refresh-session.mjs` の `--ci`・`--publish`、`bootstrap-session.mjs --publish`、`set-ci-secret.mjs`、`auth-recovery.mjs`、`.claude/config/auth-credentials.json` の `ciCredential`・`ciStored` と管理画面 `/ops/auth` の CI 欄、`package.json` の `auth:ci-secret`、`.claude/config/env-registry.json` の該当行、`docs/01_技術設計/07_Playwright認証プロファイル.md` の「CI 実行について」の旧仕様。取得のコードを Mac と共有しているので、初回の実測の前には触らない。
- **引き継いだ事実**: KDP の Reports は 2 段階認証を求めることがあり、本人の入力が要る (`refresh-session.mjs kdp --wait-human`)。note は短い集計期間で 1 記事が一覧に出ない欠けを `note-inventory.mjs` の `acceptedNoteGap` で既知の欠けとして pass にしている。KDP の速報売上・KENP は確定ロイヤリティや週次の純収益に入れない。
- **統合 (2026-10-26): `ASP-CONSOLIDATE-A8-RAKUTEN-01`** (もしも・afb・バリューコマースの配信と計測を止め A8・楽天に集約。取得元からは外し済み)。**残り (急がない)**: Secrets `MEASUREMENT_SESSION_MOSHIMO`・`MEASUREMENT_SESSION_AFB`・`STATS47_AUTH_MOSHIMO_*` が残っていれば削除し、`env-registry.json` の 3 行を上の 2 と同時に消す。ASP の提携操作ツール (`.claude/scripts/ads/moshimo-*`・`afb-*`)・管理画面の表示・提携の解除はそのまま残す。A8・楽天 (直接) の広告に触らない。完了は本番の `app/affiliate-ads/all.json` で moshimo・afi-b・valuecommerce が配信中 0 件、計測が moshimo・afb を取得せず、鮮度の分母が更新され、不要な Secrets が無いこと。
- **停止条件**: 2 段階認証・CAPTCHA・規約同意を自動化しない。Cookie・API キーを git・ログに出さない。
- **完了条件**: 土曜の Mac の取得が記録まで通り、CI 専用のコードと Secrets が残っていない。

### [THEME-DASHBOARD-TEXT-TRIM-01] テーマページのデータの表とチャートの説明を畳み、ダッシュボードとして短くする
タグ: [UI・UX] [種類:改善] [実行:対話] [起票:2026-10-31] [領域:サイト]

- **起点 (2026-10-31 オーナー指摘「文字が多すぎる。基本的には可視化、ダッシュボード」)**: 解説の章と白書の論点は開閉の部品で畳み、全 56 テーマを「読者の悩み → 問いの章 → 見せ方」で組み直し、47 都道府県の比較の図はテーマから外してランキングに任せた (オーナー決定)。それでも `/themes/living-housing` の見える文字は 6,930 → 4,180 字、高さは 10,278 → 10,124px でほぼ同じ (カードの数が多い)。残りの多くはデータの表とチャートの説明 (「指標の比較」31 行 約 1,650 字・「単身化と一人暮らし」約 760 字・「ひとり暮らし世帯の男女・年齢構成」約 590 字・「都道府県の分布」約 560 字・「空き家率の地図と表」約 480 字)。
- **次**: ① 表は上位・下位の数行だけ見せ、残りは「全件を見る」で開く (HTML には残す) ② チャートごとの説明は出典の Sheet (SourcesSheet) へ寄せる ③ 全テーマで同じ測り方 (見える文字・高さ) をして、効果を比べる ④ 1 指標カードが 4 列の格子に 1 枚だけ並ぶ章 (空きが目立つ) の扱いを決める ⑤ 新しい構成比のチャートは page-components (R2) に入るまで本番に出ない。main へのマージ後の sync-snapshots (page-components) で反映する。
- **完了条件**: 代表のテーマページで、見える文字と高さが半分程度になり、最初の画面からチャートが続く。

### [CONTENT-KAKEI-EXPANSION-01] 家計調査の未展開候補を棚卸しし、note・サイトへ順次展開する
タグ: [コンテンツ品質] [種類:制作] [実行:対話] [起票:2026-10-19] [領域:サイト]

- **済み (2026-11-05 時点の要約)**: 合格した記事 81 本は背景画像つきで送り箱へ入れ済み (PR 1221 のマージ後、リンク先 82 指標が本番で 200)。予定の 6 表は CI で実値を確認し、9 指標を isActive:true、分析単位を published/value-checked にして、台帳の予定の表は 0。11-02 までに、家計調査 697 指標の人口・面積あたり切替の撤去 (`kakei-normalization` で再混入を止める)、`/survey/household-survey` の `/survey/kakei-chousa` への 301 統合 (`SURVEY_HUB_ALIASES`)、食料以外の耐久財 53 指標の「購入数量」への改名、調査ハブの代表を `survey-editorial.ts` の問い優先にする変更、自明な相関 191 組の除外、県の上位品目の実装を develop に入れた。到達の報告 (`report-kakei-coverage.ts`)、全品目のリンク一覧 (`household-food-spending`)、未判定 131 件 (指標 124・除外 7) の整理も済み。点検表は `survey-content-standards.md`「面ごとの点検表」。
- **次・予定の 6 表の残り**: data-refresh で 9 指標を取り込み、値が 0〜100 に収まるか確かめる。kakei-axis-charts を publish=true で回す (図の分類名の注記を除いた版)。既知キー・sitemap は sync-snapshots の sync-ranking-keys が作る。
- **記事の残り**: `blog:batch` の候補は kakei-chousa で尽きた。other-mushroom・laundry-detergent・rent-group は critic REVISE のまま非公開。`blog:batch` は既存の `contents/blog` の slug を対象外にするので、不合格の再挑戦は `write-blog-headless.ts --slugs` で行う。
- **指標追加の手順の穴 (2026-11-05)**: `metrics:regen-derived` は `kakei-ranking-directory.generated.ts` を作り直さず、`content:sync` が `generate:catalog` より先に走る。`isActive:true` にした指標は取り込みと既知キーの生成までテーマのリンク先が開かず、止める検査が無い。
- **公開一覧の同期の穴 (2026-11-05)**: `sync-snapshots` の sync-ranking-keys は sitemap と公開一覧を更新するが `data/metrics/index/` を作り直さないので、記事の公開後に develop→main の PR で `Stale metric linkage shard` になる。手で `npm run metrics:build-index` を流せば通る。同期の job で索引も再生成すれば再発しない。
- **検出した小さな不整合 (2026-11-05)**: `data/metrics/university-capacity-index.ts` の seoTitle は京都府 238.4 だが R2 の 2024 年度は 238.3。有料記事 `d-kakei-category-dataset` の題「教育費は8.7倍違う」は単年の値で、5 年平均は 4.2 倍。P-14 の snapshot の title は note の題と異なる。`data-refresh.yml` の dispatch は `--ref` を無視して main を checkout する。`data/surveys/taxonomy.json` の blog の部分は実際の記事とずれている。
- **調査資料の注意 (2026-11-05)**: `docs/31_note記事原稿/kakei-research/` の背景の URL は検索結果の確認までで、原典の数値は未確認。家計調査の民営家賃が全世帯平均か借家世帯平均かは未確認。教育 5 品目は順位の変動が大きく、複数年の確認が要る。ledger の `kind` は item と group が混在し階層が二重に数えられうる。
- **データ商品の導線 (2026-11-04 オーナー判断)**: サイトの案内は商品ページを経由して note へ出す。詳細ページは短い中継のまま残す。家計のデータ集は新しく作らず P-14 (`prefecture-household-consumption`) を 841 指標へ更新する。
- **全面展開の次 (2026-11-04)**: 計画は `/Users/minamidaisuke/.claude/plans/smooth-stargazing-kay.md`、到達の実測は `data/surveys/kakei-coverage.json`。次は 124 指標の取り込み (`data/data-refresh-requests.json` は dryRun のまま run 41800174049 が取り消されたので、r2-write が空いてから出し直す)、予定の 6 表、調査材料、記事、note。
- **方針の更新 (2026-11-04 オーナー判断)**: 既存の是正だけで止めず、品目も量産し、NotebookLM と Deep Research を使ってできることをすべて展開する。下の 11-01 の「新規品目の量産より」はこの判断で上書きする。
- **展開の実測 (2026-11-04)**: 公開ランキング 717/717 指標。品目 656 のうち採用 655。未判定 130 (中分類 122・その他 7・品目 1)。テーマに載る指標 150/717 (食卓と家計の支出 132)、県の固定枠 6/717、ブログのリンクがある指標 310/717 (記事 276 本)、note の家計記事 75 本。表 126 は採用 14・予定 6・除外 106。
- **方針 (2026-11-01 オーナー判断)**: 11月のサイト重点を家計調査にする (月次の範囲は `.claude/todo/monthly.md` 重点1)。新規品目の量産より、既存の検索入口と年次・調査粒度の是正、`/survey/kakei-chousa` → `/themes/household-food-spending` → 代表ランキング → ブログの説明と回遊を優先する。検証できる全切り口 (品目・10大費目・全国時系列・年収階級/五分位・世帯類型・貯蓄負債) を既存のランキング/テーマ/調査ハブ/ブログに割り振る (126表を126ページへ機械変換する意味ではない)。優先理由は 2026-10-19 のユーザー判断で、CTR を実測したものではない。
- **前提の資料**: e-Stat 家計調査 DB 126 表の分類・2025年実値の例・企画候補は `.claude/skills/estat/references/household-expenditure-survey.md`。書籍『マーケティングに使える「家計調査」』の台帳は `data/source-inventory/kakei-marketing/2015/` (利用仕様書 `docs/02_実装計画/46_その他参考文献OCR・クロップ・stats47展開実装仕様.md` §4.4)。書籍由来の論点は一次資料で再確認する。GSC の `pages.csv` と `queries.csv` は別集計なので query×page の帰属は同一期間の結合取得がある場合のみ判定する。
- **反映待ち・未確認**: ① 切替の撤去は main マージ後に sync-snapshots (ranking-items) で 697 件の item.json を作り直して本番に出る ② 相関の除外は相関 snapshot の再計算後に出る ③ エンゲル係数がテーマのローカル表示に出ていない (data-refresh の R2 反映後に確認) ④ ハブ名の「家計調査」への変更は R2 の調査マスタの再出力後に出る ⑤ ランキングの「読み解く記事」の題は書き直した記事の公開 (blog-auto-publish) 後に新しくなる。
- **残りの要対応 (要判断を含む)**:
  - 題 (title / seoTitle) に 2024 年の値が残る家計調査の記事 138 本 (数値 261 件、一覧 `node .claude/scripts/blog/find-kakei-stale-title-values.mjs`)。`KAKEI-EXPANSION-02` ③ の書き直しで題・本文・図をそろえる。
  - サービスと家賃の 7 指標 (単位 回・畳: 理髪料・カット代・パーマネント代・給与住宅/民営/公営家賃・畳替え) の名前を保留中 (候補: 利用回数・延べ畳数)。オーナー判断。
  - 統合したハブに 2007 年で止まった全世帯の指標が 3 件 (教養娯楽費・教育費・保健医療費)。
  - 実収入は千円・可処分所得は円で単位がそろわない (`display.displayUnit` は 71 指標が持つがランキングページもカードも使っていない)。
  - 県ページの「食の消費（品目別）」が 47 県共通の 6 品目で、その県が上位の品目 (宇都宮の餃子など) が出ない。`area-databook-standards.md` のテンプレ変更なので area-databook-designer の判断。
  - 貯蓄と負債のテーマが全国家計構造調査 2019 年だけで、家計調査の貯蓄・負債編 (切り口 `kakei-savings-debt`、2025 年・都市別) を使っていない。
  - 楽天枠で商品名に「納豆」を詰め込んだ出品 (きくらげの佃煮) は語の判定では除けず残る。
- **11月の実行順**: ①上位5品目の2025年実値・出典・既存URLを照合 (`KAKEI-EXPANSION-02`) ②追加の既存品目を費目単位で照合・更新 ③全国時系列・収入層・世帯別・貯蓄/負債を既存テーマ/記事への図と新しい問いへ展開 ④全導線・出典・表示を確認して一括公開し、効果観測を開始。NotebookLM/Gemini は問いと説明案に使い、数値と採否は公式表で決める。Gemini Actions の定期公開は無料枠の継続観測とリポジトリ変数の起動判断が済むまで停止したまま。
- **次・担当**: W45 は調査ハブと上位5品目を確認。W46 は data-ingester が2025年の都市値を費目単位で照合し、survey / theme / ranking の担当が導線を整える。独立した問いが実値と資料で裏づけられる記事・note も制作対象とする。
- **停止条件・境界**: 年次値と3年平均、県庁所在市と県全体、支出額と購入数量を混同する候補は公開しない。既存URLと同じ答えの別ページを作らない。数値・単位・都市/県の範囲・出典を検証できない候補は進めず、単なる品目差し替えで重複・薄い記事を量産しない。データ更新・追加指標は `KAKEI-EXPANSION-02`、全国・属性別は `KAKEI-MULTIAXIS-01`、SNSは `SNS-KAKEI-EXPANSION-01`。
- **完了条件**: 検証済みの既存指標が2025年値へ更新され、調査ハブ・テーマ・ブログから適切な粒度のページへ移動でき、対象URLの検索指標と2ページ目到達の観測開始日が記録される。

### [AI-CONTENT-GEMINI-KEY-01] 無料枠キーでランキング解説の1件審査を通し、日次量産を起動する
タグ: [コンテンツ品質] [種類:改善] [実行:ユーザー] [検証:node --test .claude/scripts/ai-content/__tests__/gemini-workflow-contract.test.mjs] [起票:2026-11-01] [領域:サイト]

- **オーナー判断 (2026-11-01)**: Gemini をランキング解説の量産手段へ戻す。旧キーは 48 run 中 44 run が HTTP 402 で停止し生成 0 件。課金設定なしの専用 Google AI Studio project のキーを GitHub Secret `GEMINI_API_KEY` へ登録済み (キーの文字列は git・会話へ出さない)。無料枠 project のためキー再発行は求めず、現キーで続けてよい。
- **確認済み (2026-11-01)**: 確認用 branch `codex/gemini-kakei-20261101` で、`gemini-3.5-flash-lite` を使った run `41271164945` が structured preflight・1件の生成・決定的監査・独立 Gemini critic すべて PASS (`verify_only=true` で記録・commit・R2 publish は skip)。`gemini-2.5-flash-lite` は structured preflight で HTTP 404。repository variable は未設定。
- **次**: ① 日次公開を起動する前に feature branch の変更を review し、公開の承認を得る ② repository variable `GEMINI_FREE_TIER_VERIFIED=true` を設定 ③ 初回の定期 run と `publish-ai-content.yml` の R2 読み戻しを確認 ④ `data/ai-content/history.csv` の7 run で PASS率と token を評価して件数を決める。
- **起動 (2026-11-09 オーナー承認)**: main と develop の workflow・スクリプトが同じで、モデルが 1 件確認と同じ `gemini-3.5-flash-lite` (workflow の env で固定) であることを確かめ、repository variable `GEMINI_FREE_TIER_VERIFIED=true` を設定した。11-05〜11-08 の定期 run は変数が無いため skipped だった。残り: ③ 初回の定期 run (2026-11-10 07:15 JST) と `publish-ai-content.yml` の R2 読み戻しを確かめる ④ 7 run の評価。
- **停止条件**: 402/429、0 PASS、課金状態不明なら変数を立てない。キー交換後は変数を false に戻して1件確認から再開する。本番デプロイ・R2 push は既存の承認境界に従う。
- **完了条件**: 無料枠キーの1件確認が PASS し、日次の初回 run で審査 PASS の内容が R2 に反映され、7 run の運転設定の見直しが記録される。

### [PRODUCT-REFERRAL-MEASURE-01] 商品 (KDP・note) への送客から販売までを、GA4 と販売台帳で同じ商品 ID でつないで測る
タグ: [インフラ・計測] [種類:改善] [実行:対話] [検証:npm run products:sales --workspace=@stats47/product-factory -- validate] [起票:2026-11-03] [領域:商品]

- **読者の課題／HARM**: 本カードは運営者の判断材料 (M: Money)。新しい商品は作らない (収益化戦略 §3.6)。KGI は月の確定収益 (AdSense＋KDP の販売と KENP＋note) で、PV は目標にしない。測るのは既存の受け皿 (note P-04/05/09/10/14 のデータ集、K-S1-02)。
- **需要の証拠 (2026-11-03 時点)**: KDP の販売は台帳に 2 冊 (K-S1-02 2026-08 ¥254、K-S2-03 2026-09 ¥159)、KENP は 8・9 月とも 0 (計測済み)。note の通算売上 ¥900 はノウハウ記事 3 本だけ。サイトの Kindle 案内は 64 記事の閲覧 3,901 にクリック 1 (2026-W41)。計測が販売先の手前で切れていた。
- **2026-11-03 実装 (develop・未デプロイ)**: ① 販売台帳に計測の範囲 `coverage` を足し、範囲内で明細が無い月は「計測済み・0 件」、範囲外は未計測と読む (`ledger-core.mjs` の `mergeSalesCoverage`。過去の月は `products:sales -- record-kdp-coverage --report <復元したレポート>`。8・9 月は記録済み)。8 月の K-S1-02 の 1 冊は 4 週窓の中か分からないので週次判定は「判定不能」で止まる (`ambiguousEvidenceBookIds`)。② GA4 に `product_impression`・`product_click` (キーイベント) と `product_destination`・`product_id`・`link_position` を足し、週次取得に `product-referrals.csv`・`product-inbound.csv` (`journey-ga4-reports.mjs`)。台帳は `analytics-event-standards.md` §2。GA4 の custom dimension・キーイベント・チャネルグループ・探索「商品送客ファネル」は 2026-11-03 に作成し読み戻し済み。③ 逆向きの UTM 規約は `config/inbound-utm.mjs` (Kindle は出典ページの URL だけ、note は本文のテキストリンクだけ `addNoteTextLinkUtm`)。検証: `products:sales -- validate` PASS、関連テストと web の型検査 PASS (2026-11-03)。
- **Amazon アソシエイト (2026-11-03 公式ヘルプで確認)**: 自著の Kindle 本を不特定の読者へアソシエイトリンクで紹介するのは禁止されておらず、置き場所ごとの追加トラッキング ID も使ってよい。ID 別レポートに ASIN ごとの件数が出るかは未確認、KENP は紹介料の対象外。**今は作らない** (口座 `stats47-22` が有効かが未確認で、`AMAZON-ASSOCIATE-PILOT-01` の判定 (11-04) が続けるかを決める)。続けると決まったら ID を 2 つ (ブログ・ランキング) 作り、注文レポートに ASIN が出るかを管理画面で 1 回確かめてから配線する。それまでは GA4 の `product_click` (置き場所 × ASIN) と販売台帳の月次を同じ ASIN・書籍 ID で並べる (クリックと注文の紐付けはしない)。
- **計測の注意**: 2026-11-03 の GA4 ホーム (過去 7 日) で Unassigned 1,215 セッション・香港のアクティブユーザー 1,855 (bot の可能性が高い)。週次の CSV は日本だけに絞っているので、GA4 の画面の全体値で判断しない。
- **次 (人の作業・実行順)**:
  1. KDP の再ログイン (10-31 の取得が `auth_required`): `node .claude/scripts/measurement/refresh-session.mjs kdp --wait-human`。2 段階認証は本人が入力する。10 月の確定レポートは 11 月中旬に出るので、それ以降の土曜の取得で台帳に範囲と明細が入る。
  2. develop → main のマージと本番デプロイ (オーナー承認)。CI の月次自動記録 (`KDP-LEDGER-AUTO-01`) も main の workflow で動く。デプロイ日を EXP-013 の `started_at` にする。
  3. note の本文リンクの UTM は、EXP-013 の対象記事だけ `update-published-navigation.mjs --slug <key>` で反映する (ログインは人手。全記事を一括で変えない)。Kindle の出典ページのリンクは、次の再アップロード (`KDP-K-S1-08-REUPLOAD-01`) で入る。
- **停止条件・禁止**: アトリビューション分析はしない (広告費を使っていない)。欠測を 0 にしない (GA4 の dimension 登録前の週・KDP の取得失敗の月は判定不能)。本番デプロイ・R2 push・note の編集はオーナー承認の後。
- **完了条件**: GA4 で `product_click` がキーイベントになり、`product-referrals.csv` に置き場所 × 商品 ID の行が出て、KDP の月次が範囲付きで台帳に自動で入り、EXP-013 の 6 週の数字 (表示・クリック・注文、または判定不能とその理由) が実験台帳に記録された。

### [DATA-PACK-BUNDLE-01] 都道府県のデータ集を「比較表＋時系列＋塗り分け地図」のパックに作り替え、note の 13 本を差し替える
タグ: [収益化] [種類:制作] [実行:対話] [起票:2026-11-05] [領域:商品]

- **起点**: 2026-11-05 のオーナー決定 (`02_収益化戦略.md` §3.4「商品展開」)。都道府県のデータ集単体には全販売面で関心がほぼ無く、関心が集まるのは地図だった (§2.2)。新しいテーマは増やさず、既存のテーマ別 12 本 (¥980) と総合集 (¥2,980) の中身を作り替える。地図だけの単品 `ppt-japan-map-assets` は出さない。
- **読者の課題 / HARM**: 県別の比較を資料に入れたいが、年を揃える・地図を塗る・出典を書くのに手間がかかる (A・M)。
- **支払う理由**: 1 つの分野の比較表・推移・地図が、出典とともに同じ版で揃っている。無料で配る基本の CSV・KML・GeoJSON とは、時系列と編集できる地図の有無で分ける (§3.4「公開データをまとめ直したことだけを支払う理由にしない」)。
- **需要の証拠**: パックへの需要は未検証。地図への関心 (BOOTH 677・271) と、データ集単体への関心ほぼ 0 (§2.2) から立てた仮説。
- **パックの中身 (1 テーマ)**: ① 比較表: 最新年の 47 都道府県 (Excel・CSV。既存) ② 時系列: 同じ指標の取れる全年 (縦持ち CSV と、指標ごとに年を列にした Excel のシート。年の定義が変わった指標は注記) ③ 塗り分け地図: 指標ごとに PowerPoint の図形 (県ごとに色を変えられる) と SVG ④ 出典・定義 (`SOURCES.csv`)・利用条件 (`LICENSE-ja.txt`)・README。総合集は全テーマの ①〜④。
- **次 (実行順)**:
  1. **境界の出どころを確かめる [S]** — product-factory の `maps/prefecture-geometry.ts` は `apps/remotion/public/prefecture.topojson` を読む。このファイルの出どころが N03・Geoshape なら、**公開中のデータ集の `product.pptx` も同じ問題を持つ**ので、オーナーに報告して扱いを決める。売る地図は e-Stat「令和 2 年国勢調査 町丁・字等境界データ」を都道府県に結合したもの (`MUNI-DATA-PRODUCT-PILOT-01` と同じ出どころ) に替える。
  2. **時系列を作る [M]** — 各テーマの指標について R2 の観測値 (`app/stats/<metric>/values.json`) から全年を取り出す生成器を product-factory に足す。年の 4 桁化と単位は既存の規約 (`estat-api.md`・`unit-semantics-standards.md`) に従う。
  3. **地図を全指標に広げる [M]** — 既存の PowerPoint 生成 (`generators/pptx.ts`・`svg-map.ts`) を、パックの全指標 (総合集は分野ごとのファイルに分ける) に適用する。note の添付の上限に収まるかを測る。
  4. **確かめる [S]** — product-factory の validators、PowerPoint の実機で県の色を変えられること、note-critic。
  5. **差し替える [人手・承認]** — note の 13 本の添付と無料部分の説明 (`data/note/paid-landing/`) を新しい中身に合わせ、カタログ `data/note/articles.json` を同じ差分で直す。中身を変えた日を `data/products/price-history.json` に記録する (価格実験の交絡)。
- **判定**: 価格と判定基準は PRICE-DATA-PACK-2026-11 のまま (導線から 8 週で 5 件以上なら続ける、0 件ならデータの単体販売を止める。仮の期日 2026-12-30)。
- **禁止**: 価格を変えない。新しいテーマを足さない。N03・Geoshape の境界を売る地図に使わない。note への差し替えは人手のログインとオーナー承認を経る。
- **完了条件**: 13 本の添付が新しい中身に替わり、カタログ・無料部分の説明・`price-history.json` が同じ差分で直っている。売る地図の境界の出どころが README と `LICENSE-ja.txt` に書かれている。

### [KDP-LISTING-COPY-01] 販売中 13 冊の紹介文とキーワードの改善案を承認し、KDP へ反映して効果を測る
タグ: [収益化] [種類:改善] [実行:対話] [起票:2026-11-06] [期日:2026-11-09] [領域:商品]

- **事実 (2026-11-06)**: K-S1-01〜12 の紹介文は `export-kdp-listings.ts` の `buildDescription` が `concept` に同じ定型文を足したもの。カタログの `design.readerProblem` は紹介文に使っていない。機械の検査は社内語の混入・短すぎ・e-Stat の言及だけで、訴求は見ていない。K-S1-13 だけが `kdpExclusive.description` で読者の課題から書いてある。
- **検索の実測 (2026-11-06・ブラウザ・電子書籍カテゴリ・1 回の観測)**: 30 語の 1 ページ目に出たのは 5 語 (家計調査 K-S1-02 8 位、都道府県 年収 K-S1-01 9 位、教育費 K-S1-05 9 位、地方財政と自治体 財政 K-S1-06 14 位)。「都道府県 統計」「47都道府県」「人口減少」「健康寿命」「インバウンド」「移住」には出ない。
- **[仮説] 紹介文とキーワードを直すと検索の露出と購入が増える**: 検証は上の 30 語の再測定と販売台帳の 4 週の注文。KDP の検索が何を見るかの公式の仕様は未確認。
- **済み (2026-11-06)**: 原稿の正本 `data/products/kdp-listing-copy.json`・監査 `npm run kdp:listing-copy -- check` (13 冊合格)・入稿前の検査 (`kdp-preflight`)・検索順位の週次記録 (基準 `data/products/kdp-search-ranks/2026-11-06.json`) を作った。原稿は別エージェントが EPUB と 2 回照合し、1 回目 26 件・2 回目 2 件の指摘を直した。
- **やること**: ① (済み 2026-11-06: オーナー承認、13 冊を台帳へ写し `kdp-update-listing-copy.mjs` で KDP へ提出) ② レビュー後に `node .claude/scripts/kdp/kdp-update-listing-copy.mjs --verify` で読み直して `reflected` にする (2026-11-09 に実行) ③ 4 週後に検索 39 語の順位と注文を基準と比べる ④ K-S1-13 の表紙の縮小時の視認性と、K-S1-01 の表紙「6つ」と本文の章数を確かめる ⑤ 紹介文の悩みの文に本文で扱わない語が無いかを機械で見つける検査を足す (「移住」「電気代」など、本文に 0 件か否定の文脈だけの語が 1 回目の指摘の多くを占めた)。
- **停止条件**: KDP への反映はオーナー承認の後。題名は公開後に変えられない (KDP ヘルプ)。
- **完了条件**: 12 冊の紹介文とキーワードが KDP に反映され、30 語の再測定と 4 週の注文が記録された。

## 🟡 中 — 2〜3ヶ月以内

### [THEME-BRIDGE-INGEST-TSIMPORT-01] 橋梁点検の取り込みが、提案なしの経路で TS の読み込みに失敗して止まる
タグ: [インフラ・計測] [種類:不具合] [実行:sweep] [起票:2026-11-13] [領域:データ]

- **証拠 (2026-11-13)**: `.claude/scripts/themes/ingest-bridge-inspection-age.mjs` を `--proposal-dir` なしで動かすと、tsx 4.23.12 の `tsImport` が Node v22.23.3 で入れ子の TS import を解決できず、`parseBridgeInspectionAgeSnapshot` の読み込みが `ERR_MODULE_NOT_FOUND` (`packages/area/src/index.ts?namespace=…`) で止まる。台帳 `bridge-inspection-age.json` の restore コマンドが最後まで走らない (`fdc398dc5` の作業中に観測)。
- **次**: 検査の読み込みを `ingest-vacancy-types.mjs` (`5e84633aa`) と同じ tsx 経由の形に直し、提案なしの経路が出典の検査まで進むことをテストで固定する。
- **完了条件**: 原典のフォルダを渡した実行が `ERR_MODULE_NOT_FOUND` で止まらず、追加したテストが直す前は落ちて直した後は通る。

### [OPENDATA-RANKING-PILOT-01] NDB 特定健診の 10 指標を R2 へ上げて公開する
タグ: [コンテンツ品質] [種類:制作] [実行:対話] [起票:2026-11-13] [領域:データ]

- **次**: main に入ったら `external-metric-ingest.yml` を dry run で確認 → 承認を得て値を上げる → 10 本を `isActive: true` → `sync-snapshots` → 本番を実測。手順は `metric-config-standards.md`。
- **停止条件**: 値を上げる前に公開にしない。R2 への書き込みは都度承認。
- **完了条件**: 10 本が本番で 200。4 週後の流入の計測を improvements へ引き渡す。
- **関連の未着手**: 台帳で商用可否が不明な 31 件の規約確定 / 値の無い公開中の external 指標を止める検査 / R2 push の 3 文書と `open-data-curator.md`・`ranking-publisher.md:64`・`data-provenance-standards.md:117` の記述ずれ。次の候補は管理画面 `/data/open-data`。

### [MUNI-PREF-RANKING-EXPAND-01] 県×指標の市区町村ランキングを (指標, 県) の組単位で広げる
タグ: [インフラ・計測] [種類:改善] [実行:対話] [起票:2026-11-13] [領域:サイト]

- **背景 (2026-11-13 オーナー方針)**: 市区町村のページは SEO を踏まえてできるだけ検索に出す。今は台帳 `data/municipalities/catalog/prefecture-ranking.json` の 10 指標 × 47 県 = 470 ページだけで、「全 47 県で 10 自治体以上」を満たさない指標は指標ごと外している。CF-CPU-URL-01 で全国版の県の絞り込み (`?pref=`) をやめたので、台帳に無い指標は県内の順位を見る入口が自治体名・県の絞り込み (ブラウザ側) だけになった。
- **費用の見立て**: 1 描画 約 1.5 秒 = $0.00003 (Workers CPU $0.02/100 万 ms)。8,037 ページ (171 × 47) が毎日 1 回描画されても月 約 $7。根拠の実測は `data/improvement/cloudflare-cost-improvement/improvement-log.md` の CF-CPU-URL-01。
- **次**: (1) 採否を (指標, 県) の組単位に変える。値のある自治体が `MIN_MUNICIPALITIES_PER_PREFECTURE_RANKING` 以上の組だけを、R2 の values から生成スクリプトで git 定数にし、ページ・sitemap・内部リンク・`url-policy.ts` が同じ集合を読む。(2) 第 1 波は GSC で表示のある市区町村ランキングの指標を全県へ。以降は 1 波 約 2,000 ページ。(3) 県別ページの HTML の edge 保持を 7 日にする (`CF-EDGE-TTL-01`)。波ごとの検査は同じ形の繰り返しなので Workflow を使う。
- **停止条件**: 各波の 14 日後に、日次の `workers_cpu_ms` と請求サイクルの累計ペース検査が warning のまま増えている、または GSC の県別ページで「クロール済み - インデックス未登録」が登録数を上回るなら次の波へ進まず、本文テンプレートを見直す。第 1 波は `MUNI-PREF-RANKING-OBS-01` (既存 470 ページの 4 週観測) の結果を読んでから始める。
- **あわせて確かめる (2026-11-13 レビュー)**: 全国版は HTML に上位 50 件だけを出すので、51 位以下の市区町村ページ (`/areas/<県>/cities/<市>`) への静的なリンクが全国版から無くなった (以前は `?page=N` から辿れた)。sitemap には全件が載っているが、内部リンクの他の経路 (県のページの市区町村一覧・県別ランキング) で全市区町村に届くかは数えていない。県別ランキングを広げると各県の全自治体へのリンクが戻る。
- **完了条件**: 成立する (指標, 県) の組がすべて県別パスで表示され、sitemap に載り、波ごとの CPU と登録数が改善ログに記録された。

### [CF-EDGE-TTL-01] HTML の edge 保持を 1 日から 7 日に延ばし、パージの呼び出しを配線する
タグ: [インフラ・計測] [種類:改善] [実行:対話] [起票:2026-11-13] [領域:サイト]

- **観測 (2026-11-13)**: `apps/web/src/lib/cache-policy.ts` の `PAGE_EDGE_CACHE_CONTROL` は `max-age=86400`。Workers Observability では同じ URL (`/ranking/vacant-housing-ratio`) が 3 日間に WAW・MIA・EWR・KIX の 4 拠点で描画され、`/ranking/*` はクエリなしの 714 URL が 24 時間に 4,845 回、平均 1.5 秒で描画されていた。
- **次**: デプロイとデータ更新のときに `/api/internal/worker-cache/purge` (Cache-Tag) が呼ばれているかを確かめる (`.github` の grep では呼び出しが見つからなかった。見つからなかっただけで、無いとは確かめていない)。呼ばれていなければ `deploy-workers.yml` に足し、そのうえで保持を 7 日にする。
- **停止条件**: パージの配線を確かめる前に保持だけを延ばさない (更新が 7 日出なくなる)。
- **あわせて確かめる (2026-11-13 レビュー・未実測)**: 全国版の市区町村ランキングを `revalidate = 86400` にしたので、Workers Cache を tag で消しても OpenNext の incremental cache (R2) に前の HTML が残りうる (`/ranking/[rankingKey]` と同じ形。コードに revalidatePath / revalidateTag の呼び出しは見つからなかった)。R2 が一時的に読めないときの「配信用データを準備しています」(200) が保存される可能性もある。本番でデータ更新後の応答を読んで確かめる。
- **同じ形の疑い (未実測)**: `apps/web/src/app/api/flow/[feature]/[code]/route.ts` は `revalidate = 86400` のまま no-store の 404 を返す。route handler が 404 も保存するなら、R2 の一時失敗が 1 日残る (市区町村の全行 JSON の route は同じ理由で force-dynamic にした)。
- **完了条件**: 保持 7 日とパージの配線が本番に入り、`/ranking/*` の 1 URL あたりの 1 日の描画回数を前後で比べた値が改善ログに記録された。
- **統合 (2026-11-13)**: `CF-HTML-EDGE-TTL-01` をこのカードへ統合した。完了条件に含める: 保持 7 日とパージの配線が本番に入り、/ranking/* の 1 URL あたり 1 日の描画回数の前後比較が改善ログにある。加えて旧カード側の項目を落とさない: (1) purge されない経路 (データ更新・テーマ定義・page_components・広告) を洗い出し、延長で古い内容が残るページを特定して塞ぐ (2) stale-while-revalidate が Workers Cache で効くか (MISS でなく STALE を返すか) を本番で確認 (3) 期間案と効果見込み、HIT 率か CPU の before/after を測る。停止条件は purge 漏れを残したまま延ばさない・本番反映はオーナー承認後。

### [CF-RENDER-CPU-01] 1 描画あたりの CPU (約 1.5 秒) を、重複読みの解消で下げる
タグ: [インフラ・計測] [種類:改善] [実行:対話] [起票:2026-11-13] [領域:サイト]

- **観測 (2026-11-13)**: `/ranking/*`・`/municipalities/ranking/*`・`/areas/*` の 1 リクエスト平均 CPU は 1.4〜1.8 秒 (Workers Observability)。コードを読んだ範囲では、`features/blog/repositories/blog-snapshot-reader.ts` の `loadSnapshot` が React `cache()` 無しで約 18 関数から呼ばれ、`features/theme-dashboard/lib/load-theme-data.ts` と `theme-seo.ts` の `readThemeLeadFact` が同じ item・values を別々に読み、ランキングの Sidebar・RankingChart・RadarChart が `readRankingItemFromR2` を直接呼んでいる。どれが CPU の何割かは測っていない。
- **次**: 代表 3 route (ranking・themes・areas) の平均 CPU を取り、重複読みを `cache()` で消して前後を比べる。`_rsc=` 付きの画面遷移 (24 時間の CPU の 10.6%) も同じ計測に入れる。
- **完了条件**: 3 route の平均 CPU の前後の値が改善ログに記録され、下がらなかった箇所は元に戻した。
- **統合 (2026-11-13)**: `CF-CPU-RENDER-WEIGHT-01` をこのカードへ統合した。完了条件に含める: 代表 3 route (ranking・themes・areas) の平均 CPU の前後を同じ方法で改善ログに記録し、下がらなかった箇所は戻す。旧カード側の項目も入れる: (1) CF-CPU-SURGE-01 反映後 7 日で Observability の url.path 別 CPU 合計の上位 20 を取り直す (2) 上位ルートが読む R2 オブジェクトとサイズを数え、CPU が JSON 解析か描画かを分ける (3) 必要な年・項目だけの派生 snapshot (R2) を 1 ルートで試し localhost の本番ビルドで比較。停止条件は計測なしに最適化しない・永続 DB に戻さない・表示内容と SEO 構造化データを変えない。効果観測は改善台帳の別 ID へ引き渡す。

### [URL-QUERY-INVENTORY-01] `searchParams` を読むページを棚卸しし、パスへ移すか URL から外す
タグ: [インフラ・計測] [種類:改善] [実行:対話] [起票:2026-11-13] [領域:サイト]

- **背景**: URL の原則 (2026-11-13 オーナー決定) は「サーバーが描き分ける違いはパス。`?` はサイト内検索だけ」。契約テストが `searchParams` を読むページを許可リストで固定した。許可リストは縮小専用。
- **対象**: 許可リスト (`apps/web/src/__tests__/search-params-contract.test.ts`) の 9 ページのうち移行判断待ちの 7 ページ — `/blog` (?page=)・`/themes/[themeSlug]` (県別ページを持たないテーマの ?pref=)・`/category/[categoryKey]/compare` (?areas=)・`/geo/compare`・`/geo/layers/[layerSlug]`・`/geo/[analysisSlug]`・`/geo/[analysisSlug]/[prefCode]/[stage]` と、検索に出している `/ranking/<指標>?norm=` (robots.ts が明示的に許可している。パスへ移すなら 301 と評価の引き継ぎを伴う)。
- **次**: ページごとに、クエリ違いの URL が Workers Observability で何秒の CPU を使っているかと、GSC で表示があるかを読み、パスへ移す・ブラウザ側の状態にする・そのまま残すを決める。
- **検査の穴 (2026-11-13 レビュー)**: 契約テストは `page.tsx` だけを見る。route handler が `request.nextUrl.searchParams` を読む場合と、クライアントの `useSearchParams` は対象外。棚卸しのときに `app/**/route.ts` も数える。
- **完了条件**: 許可リストの各行に、残す理由か移行先が書かれている。

### [CF-CPU-ROUTE-WEEKLY-01] route 別・UA 別の CPU 上位を週次で記録する
タグ: [インフラ・計測] [種類:改善] [実行:対話] [起票:2026-11-13] [領域:管理]

- **背景**: 日次の記録は Worker 全体の CPU 合計だけで、どの URL とどのクローラーが使ったかは Cloudflare の画面でしか分からない。2026-11-13 の調査は内部ブラウザの手作業だった。
- **次**: Workers Observability の telemetry query を API トークンで呼べるかを公式文書で確かめる (未確認)。呼べるなら `fetch-usage.mjs` に route 先頭 2 階層別と UA 別の上位 20 を足し、`data/cloudflare/` に週次で残す。
- **完了条件**: 週次の記録に route 別と UA 別の CPU 上位が載り、週次レビューが読む。呼べないと分かった場合は理由を書いてこのカードを閉じる。

### [STRATEGY-LEDGER-JSON-01] 戦略文書の表・値・決定を `data/` の JSON 台帳へ移し、管理画面が台帳を描く形にする (8 段)
タグ: [エージェント・SSOT] [種類:改善] [実行:対話] [検証:npm run check-datasets] [起票:2026-11-13] [領域:戦略]

- **背景 (2026-11-13 オーナー決定)**: 戦略の中身は JSON 台帳にし、管理画面は閲覧だけにする。着手前は `/strategy/lanes` が `docs/00_プロジェクト管理/02_収益化戦略.md` §5 の表を文字列で読んで描いていた (段 1・2 で台帳読みに替えた)。競合・ペルソナ・KPI・決定は docs/00 の 4 本、`data/business-plan/`、`packages/data-configs/src/business-plan/catalog.ts` のリテラルに重複している。
- **実行順 (1 段 = 1 PR。各段は台帳・Schema・カタログの行・管理画面の表示・Markdown の表の削除を 1 組にする)**:
  1. (済み 2026-11-13) `data/business/domain-stances.json` を足した
  2. (済み 2026-11-13) `strategy-lanes.cjs` と `build-measurement-cycle.mjs` を台帳読みに替え、02 §5 の領域表を消した。Stop hook と pre-commit の発火条件に台帳を足した。残り: `.claude/rules/todo-standards.md` の `[領域:X]` の行は「§5 の領域表」のままで、doboku-note と同文の規約なので両リポへ同じ差分を当てて直す。`.claude/todo/monthly.md` の参照は次の `/monthly-plan` の上書きで直す
  3. `catalog.ts` のリテラルを `data/business-plan/plan/catalog.json` へ、`geo-content-lifecycle.ts` の `COMMON_GATES` を `data/geo/analyses/content-lifecycle.json` へ移す。どの画面も使っていない `apps/admin/lib/server/dashboard.ts` の `parseStrategyDocs` を消す
  4. 文書の台帳を `data/business-plan/plan/documents.json` の 1 本にし、02 §9 と各文書の「関連ドキュメント」を寄せる。`/strategy/doc/[id]` を `/docs/[...path]` に寄せ、`/docs` と `/strategy/policy` をナビに載せる。改善ログ 7 本と週次・月次レビューの全文を管理画面で開けるようにする (`domains.ts` の `readDocument` の基点を引数にする)
  5. `data/business/monetization.json` (収益モデル・ページ種別の責務・ゲート・チャネル配分) と `data/business/decisions.json` (02 §3.1 の日付つきオーナー決定) を足す
  6. `data/business/{project,audiences,competitors}.json` を足し、01・03・04 と 02 §2.1・§2.2・§3.6 の重複した表を消す (競合は 03 の版を元にする)
  7. `data/business/traffic-roadmap.json` を足し、閾値を KPI の id に `refs` で結ぶ
  8. `data/sns/{platform-specs,profiles,content-plans}.json` を足して `docs/10_SNS戦略/` の 02・04・05 を廃止し、`update-x-profile.cjs` を台帳読みに替える。`data/note/series.json` に編集シリーズ A〜D の定義を足す
- **禁止**: docs/00 の 4 本を廃止しない・見出しと番号を変えない (「収益化戦略 §5」の形の参照が rules と skills に 60 か所以上ある)。`data/` の既存フォルダを改名しない。管理画面に編集機能と専用部品を作らない。段 5 でゲートと行政検証の段階を扱うときは `STRATEGY-GATE-TABLE-01`・`STRATEGY-GATE-ADMIN-PILOT-01` の禁止 (聞き取り台帳から導ける値を別の JSON へ手で写さない) に従う。
- **完了条件**: 戦略の文書に機械が読む表が残らず、`npm run docs:check` の DG073〜083 が台帳読みで同じ判定を返し、管理画面の戦略区分から全台帳を開ける。

### [DOCS-GOVERNANCE-GAPS-01] 検査の外に溜まった文書 (skill の監査全文・散った設計文書・memory の戦略重複・古い実装計画) を片づけ、検査の範囲に入れる
タグ: [エージェント・SSOT] [種類:改善] [実行:対話] [検証:npm run docs:check] [起票:2026-11-13] [領域:管理]

- **観測 (2026-11-13)**: `.claude/skills/theme/manage-theme-portfolio/reference/` に reviews 30 件・audits 6 件 (最大 1,791 行)、survey に 4 件、seo-audit に 1 件の全文がある。置き場について `data-storage.md` (監査は `data/`) と `docs-vs-issues.md` (skill の reference) が食い違う。設計文書が `packages/database/SCHEMA.md`・`packages/estat-api/src/stats-data/TESTING_STRATEGY.md`・`apps/web` 配下の `PLAN.md` と `DARK_MODE_FIX.md`・`.claude/design-system/` に散っている。`.claude/memory/project_monetization_contract.md` は 02_収益化戦略と二重で、`project_sns_10k_roadmap.md` は Instagram 停止の記録と並存している。`MEMORY.md` は読み込み上限の 200 行ちょうど。`docs/02_実装計画/` の 43・44・45・47 は `related_backlog` が null。
- **次**: ① 監査とレビューの全文は、未完了の対策だけをこの台帳へ移して消す。事業として見返すものだけ `data/<領域>/` へ移す。2 つの rule を `data/` に揃えて書き直す ② 設計文書をコード近傍の README か既存の設計文書へ統合して消す ③ memory の戦略重複を正本への参照に縮める ④ 古い実装計画は `/maintain-docs` の手順で統合か削除を決める ⑤ `config/datasets.mjs` の `GOVERNED` に `skills/**/reference/{reviews,audits}/` を足し、`docs:check` に「`docs/` の Markdown が文書の台帳に無い」「`apps/*/.claude/` と `.claude/scripts/` 直下のファイル」の検査を足す。
- **禁止**: 検査を足さずに文書だけを消さない。未完了の対策を拾わずに監査の全文を消さない。
- **完了条件**: 上の全文と散った文書が無くなり、同じ置き場へ新しく置くと検査が落ちる。検査を足したら `docs/01_技術設計/06_自動化インベントリ.md` を更新している。
- **追加 (2026-11-13)**: `.claude/skills/dev/review-feature/scopes/ui-consistency.md` が指す `reference/panelists.md` は存在しない (`b1db8993a` で「未作成」と明記しただけ)。定義ファイルを作るか参照を消す。

### [DIR-PLACEMENT-CLEANUP-01] 置き場の規則から外れたスクリプト・データ・設定を正しい置き場へ移す
タグ: [エージェント・SSOT] [種類:改善] [実行:対話] [検証:npm run check-datasets] [起票:2026-11-13] [領域:管理]

- **観測 (2026-11-13)**: `scripts/ui-theme/` (5 件) は `skill-code-placement.md` が `scripts/` に認める例外 (`scheduled/` だけ) の外にある。`.claude/scripts/` の直下にファイルが 5 本あり、1 件しか無いドメインが 8 つ (adsense・content-operations・db・municipalities・ranking・site・ui・web)、`sns/` の外に `instagram/`・`threads/` がある。`data/infra-history-publish-requests.json` は領域フォルダの外にあり、依頼を消費して消す処理が無いまま 2026-11-03 から残っている。`data/ai-content-staging/` は公開待ちの置き場 (`contents/`) の外にある。`data/ads/` は 1 件だけで `data/affiliate/` と役割が重なる。`.claude/config/` の `auth-credentials.json`・`env-registry.json`・`model-pricing.json` は品質ゲートの基準ではなくシステム設定である。
- **次**: スクリプトの移動 (呼び出し元の package.json・workflow・SKILL.md を同じ差分で直す) と、データと設定の移動 (`data-storage.md`「置き場を移す手順」に従い `RETIRED` に宣言する) を別の PR に分ける。
- **禁止**: `data/` の大きなフォルダ (`business`・`business-plan`・`nsm`・`seo`・`gsc`・`search-growth`・`adsense`・`affiliate`) を改名・統合しない (置き場がずれると CI の書き戻しが記録を落とす。2026-10-06 に 3 run が落とした)。skills (単数形) と scripts・data (複数形) の名前を揃えない。
- **完了条件**: 上の置き場が無くなり、移した workflow を手動で起動して新しい置き場へ書くことを確かめている。

### [GOAL-PSI-LCP-STALE-01] 性能目標 `psi-mobile-lcp-2500` の記録が ACTIVE のまま 2026-05-15 から止まっている
タグ: [インフラ・計測] [種類:不具合] [実行:対話] [起票:2026-11-13] [領域:管理]

- **観測 (2026-11-13)**: `data/goals/psi-mobile-lcp-2500/meta.json` は status が ACTIVE、cycle 1 が proposed、`updated_at` が 2026-05-15。`md_path` が指す `.claude/skills/management/goal/reference/goals/psi-mobile-lcp-2500-2026-05-15.md` は存在しない。baseline の `source` は `data/psi/` へ移す前の旧置き場 (エージェントの state 配下) を指す。
- **次**: 目標を続けるか閉じるかをオーナーが決める。続けるなら baseline を `data/psi/` の現在の計測で取り直し、閉じるなら `close_reason` を書く。
- **完了条件**: status と実態が一致し、存在しないパスへの参照が無い。

### [X-CATALOG-RULES-PARSE-01] X の投稿上限・テンプレ・画像種のマスタが rules の Markdown から読まれている
タグ: [SNS・マーケ] [種類:改善] [実行:対話] [検証:npm run check-datasets] [起票:2026-11-13] [領域:SNS]

- **観測 (2026-11-13)**: `.claude/scripts/lib/x-catalog.cjs` が `.claude/rules/sns-content-standards.md` の §1・§2-0・§2-8・§2-9 の表をパースし、X の投稿上限・テンプレ・画像種として使っている。マスタは `data/<領域>/` の JSON + Schema に置く決定 (2026-11-10) と同じ型の違反である。
- **次**: 表を `data/sns/` の台帳へ移してカタログに登録し、`x-catalog.cjs` を台帳読みに替える。rule には台帳 id への参照を残す。`STRATEGY-LEDGER-JSON-01` の段 8 と同じ PR にまとめてよい。
- **完了条件**: rule の表を書き換えても X の投稿の挙動が変わらず、台帳を書き換えると変わる。

### [RELEASE-SQUASH-SKIP-TOKEN-01] develop→main の squash マージ本文に取り込んだコミットの skip-ci 系トークンが入り、本番デプロイが起動しない
タグ: [インフラ・計測] [種類:不具合] [実行:対話] [起票:2026-11-13] [領域:管理]

- **観測 (2026-11-13)**: PR #1257 を auto-merge (squash) したところ、本文に develop の CI 書き戻しコミット (キーワード観測の記録) の件名がトークンごと並び、main の bd6f1bb35 で `deploy-workers.yml` を含む push の workflow が 1 本も作られなかった。`deploy-workers.yml` を `workflow_dispatch` で手動起動して出した。`.husky/commit-msg` の検査はローカルのコミットだけを見るので、GitHub が作る squash の本文は止められない。
- **次**: どちらかを選んで機械で止める。(a) release の PR を merge commit か本文を指定した squash でだけマージする (auto-merge の既定の本文を使わない)。(b) main の定義で動く `pull_request_target` (closed・merged) の見張りが、マージコミットの本文にトークンがあれば `deploy-workers.yml` を `workflow_dispatch` で起動する (`pr-skip-ci-head-guard.yml` と同じ形)。
- **停止条件**: CI の書き戻しコミットのトークンは外さない (develop での無駄な run を止める正当な用途)。
- **完了条件**: トークン入りのコミットを含む develop→main のマージで本番デプロイが自動で起動することを、契約テストか実際のマージで確かめる。規約 `branch-workflow.md` の skip-ci 節に 1 段落足す。

### [PRODUCT-ANALYSIS-WIRING-01] 商品分析の調査候補を一次資料と実データで検証し、改訂案へ追加する
タグ: [収益化] [種類:制作] [実行:対話] [起票:2026-11-12] [領域:商品]

- **担当**: data-pack-manager。統計定義・原典の確認は estat-researcher、既存配信の取得・投入は data-ingester。
- **展開順と分担**: 既存原票があるP-04/05/06/08の分析例追加を先行し、原典照合が必要な商品は読取り調査を並行する。商品固有の用途・分析レシピは商品別JSON単位で担当を分け、並行編集は別worktreeで最大3体まで。共通resolver・原典別定義・Schema・生成物・検査の統合は親担当だけが変更する。モデルとeffortは実行時に明示し、通常編集はmedium、統計定義の判断はhighを初期値として、手戻りと所要時間を見て調整する。数値計算・画像描画・整合検査は既存CLIで行う。
- **テーマ改訂との共同検査**: テーマの章の追加・改名・削除時は `products.landings` の作成例・改訂分析の `themeRefs` を照合し、LP・テーマ・note初稿を同じ作業で生成・確認する。関係と見出しを別台帳やUIへ複製しない。実装契約は `data-pack-standards.md`、販売版の確定は PRODUCT-LP-SHOWCASE-01。
- **対象の正本**: products.landings.analysisPlan.inputs の decision=investigate と、axes の decision=deferred・採否理由。指標・地域・原典別定義・分析・図・再利用商品は同台帳のID参照から辿る。商品別の候補一覧や完了履歴をこのカードに複製しない。
- **分析軸の残作業**: 医療・教育・商業の推移は複数年の原典と比較条件を確認して採否を決める。家計の品目構成は同年・同世帯区分の内訳/総額を揃えてから採用する。観光の県間比較は取得済み原票で作成例を追加する。順序は既存原票で追加可能な例→不足する年・分母の取得→共通生成と媒体間照合。各商品の詳細と他の保留は `axes` を参照し、単年比較だけで全分析を完成扱いにしない。
- **次・実行順**: ① 調査中の候補について原典の統計対象・区域版・暦年／年度・分母・欠測を確認する ② 用途に適合するものだけanalysisRevisionへ採用し、不適合は理由を残してexcludeにする ③ 共有のproducts:analysis:catalog / products:analysis:build / products:analysis:checkでCSV・Excel・図・LP・note初稿を生成・照合する。再利用先に子商品の値を複製せず、商品参照を維持する。
- **停止条件**: 原典の対象・年・区域・分母を同定できない候補を、利用可能または販売版に収録済みと案内しない。P-03の宿泊者数に市区町村値を推測で補わず、P-14の県庁所在市・対象世帯を県全体と混同しない。
- **完了条件**: 調査対象のdecisionと根拠が確定し、追加採用した分析の原票からの再計算・共通型の図・媒体間の照合が通る。
- **関連**: 生成済み改訂案の目視・販売内容の確定・外部公開は PRODUCT-LP-SHOWCASE-01。既存配信の欠落と古い原典メタの再生成は POPULATION-MUNICIPAL-COVERAGE-01。

### [POPULATION-MUNICIPAL-COVERAGE-01] 既存配信の一般世帯人員の市区町村欠落と取得表の記録を是正する
タグ: [コンテンツ品質] [種類:不具合] [実行:sweep] [起票:2026-11-12] [領域:サイト]

- **証拠**: P-01改訂用に原典0000020201から取得したA710201は2000・2015年とも1,741自治体ある。既存R2のgeneral-household-members/cities.jsonは2000年1,498件・2015年1,045件。取得結果の件数とハッシュは `data/products/landing-evidence/p-01.json` のanalysisRevision。households/cities.jsonのmeta.recipe.estatParams.statsDataIdも県表0000010101になっている。2026-11-12の追加照合では total-population・annual-sales-amount・general-clinic-count・elementary-school-count のcities.jsonにも県表IDが残っていた。転出者数の2004〜2014年にも一部欠年があり、原典欠測か未取得かは未確定。
- **次・順序**: data-ingesterが既存指標の取得条件と原典メタを照合→修正済みの共通city取得経路で欠落年度・古いmetaを再生成→地域マスタによる全件性と実際の表ID・cat01を検査→既存のR2反映手順へ渡す。別途、recipeの既存configHash互換性を保ったままcitySource単独の変更を検出できる契約を設計・検証する。P-01の入力は再取得済みなのでこの不具合の値で補完しない。
- **停止条件**: 一般世帯/総世帯や日本人/総数の定義が一致しない場合は投入しない。
- **完了条件**: 対象年度の自治体数が原典と一致し、配信メタから正しい表・条件を追跡できる。転出者の欠年は取得または原典欠測の理由を記録する。

### [THEME-SEO-UNIFY-01] テーマの題・説明文・FAQ を地域の単位に関係なく 1 か所で作り、検索の表示回数を測る
タグ: [コンテンツ品質] [種類:改善] [実行:対話] [起票:2026-11-12] [領域:サイト]

- **起点 (2026-11-12 オーナー決定)**: テーマは 1 つのページの種類で、日本・都道府県・県別・市区町村は横串の分類。地方財政の専用ページという特例は認めない。テーマの検索対策 (題・説明文・FAQ) は単位ごとに書き分けず共通の仕組みで入れる。
- **なぜ**: GSC 2026-W44 でテーマは 61 ページ・週 2,817 表示 (1 ページあたり 46。ランキングは 120・ブログは 276)。平均順位は 8.5 位でランキング (6.1 位) と大差なく、表示される検索語が少ないのが主な原因と見ている。題が「全国の少子高齢化」のような概念の名前で、検索語に多い「都道府県」「ランキング」(「ランキング」「1位」「最も少ない」などを含む検索語が全表示の 44%) や指標の名前を含まなかった。
- **済み (11-12)**: `features/theme-dashboard/lib/theme-seo.ts` が題・説明文・FAQ を作り、4 種類のページ (`/themes`・`/areas/<県>/<テーマ>`・`/japan`・`/municipalities/themes`) が使う。題は主な指標の名前と「推移と都道府県ランキング」「全国順位」「を市区町村で比較」を含み、全国のページの説明文には主な指標の 1 位・最下位と倍率を入れた。テーマの共通の部品 (`ThemePageLayout`) に、主な指標の順位の Q&A を画面と FAQPage の構造化データの両方で出す (全国 = 1 位・最下位、県 = その県の全国順位)。市区町村の題の指標名は、そのページが実際に出す指標の名前 (都道府県のテーマの名前を使うと、ページに無い出生率などをうたってしまった)。
- **済み (11-12・続き)**: 地方財政の専用ページ (`app/themes/local-finance/page.tsx`) をやめ、決算カードの 2 章と財政の流れを埋め込みの章 (`finance-overview` / `finance-sustainability` / `finance-flow`) として共通の部品で描く。県別の地方財政 (`/areas/<県>/local-finance`) でもこの章が出るようになった。県を選ぶと県別のページへ移る動き (2 桁の `?pref` を含む) もほかのテーマとそろえた。テーマに専用ページを作らないことは `metric-groups-reachability.test.ts` が止める。広告の台帳は `theme` 1 つにまとめ、各枠に地域の単位 (`scopes`: national / area / municipalities。japan は日本全体のテーマを全国のテーマへまとめたときに外した) を持たせた。撮影の道具と管理画面 (`/affiliate/layout?page=theme`) は単位ごとに撮って並べる。
- **URL の議論の結論 (11-12 オーナー合意・推奨案)**: URL は変えない。GSC W44 でテーマの検索表示の 92% (週 44,401 / 48,397) が県別の `/areas/<県>/<テーマ>` (1,836 ページ) で、テーマを先にした URL へ揃えると全件に 301 が要るため。内容の台帳の kind とページの ID (`area-theme:…` など) は URL のルートの系統なので名前を変えず、ルートの台帳 (`data/content/routes.json`) のテーマの 6 ルートに `pageType: "theme"` と `scope` (national / area / area-cities / city / japan / municipalities) を持たせた。週次の計測のページの種類の分類 (`.claude/scripts/metrics/lib/page-type.mjs`) はこの台帳から決める (旧: `/themes/<テーマ>` だけをテーマに数え、県別を「地域」、日本・市区町村を「その他」に数えていた。W44 の閲覧で数え直すとテーマは 1,833 → 5,023)。**この変更の後の週から、ページの種類ごとの記録の「テーマ」と「地域」は前の週と比べない**。
- **前半は済み (11-12・オーナー決定で着手)**: 手書きの 42 件を全国のテーマへ 301 した (転送表 `theme-redirects.json` が正本。サイトマップ・地域の切り替え・ハブの一覧・内容の台帳は `isJapanThemeMovedToTheme` で転送済みを外す)。全国のテーマに無かった 9 指標は、6 テーマのカタログに context の指標として足した (「全指標」からランキングへつながる。全国の時系列の図にはならない)。家計の資産・負債 (`household-assets-debt`) は家計の軸の図を持つので、家計の食費と一緒に後半へ回した。
- **後半も済み (11-12)**: 家計の軸の図 (`KakeiAxisChart`) を埋め込みの章 (`kakei-axis-household-food-spending` / `kakei-axis-household-assets-debt`) として全国のテーマに載せた。この章は全国の集計しか無いので県のページには出さない (`NATIONAL_ONLY_SECTIONS`)。日本全体だけの家計の 6 件 (家電・被服・保健医療・交通・教育娯楽・その他) は新しいテーマを作らず、既存の「食卓と家計の支出」(`household-food-spending`) の 6 つの章にした (家計調査の品目別の支出額と購入数量 47 指標を context として表で出す)。8 件を 301 し、日本全体のテーマのページ (`app/japan/[themeSlug]`)・内容の台帳の `japan-theme` のルート・広告の台帳の `japan` の単位を外した。**案から変えた点**: ハブ `/japan` は `/themes` へ 301 せず、地域の「全国」の入口として残し、転送先の全国のテーマへのリンクの一覧にした (サイドバーの「全国」を `/themes` にすると「テーマ」の項目と重なるため)。測り方: 転送の前後 4 週で、転送先の `/themes/<テーマ>` の表示とクリックを比べる (転送元の 864 表示が移るか)。
- **測り方**: デプロイ日を境に 4 週、GSC のテーマの 1 ページあたりの表示回数とクリック率を前後で比べる (`data/gsc/snapshots/<週>/pages.csv` の `/themes/`・`/japan/`・`/municipalities/themes/`・`/areas/<県>/<テーマ>`)。[target: テーマの 1 ページあたりの週の表示 46 → 70 (+50%)。根拠: 題に検索語を入れたランキングが 120 で、その半分まで寄せる見込み] 届かなければ、ページ別の検索語 (GSC の page×query) を取って題の語を直す。
- **未決 (11-13 観測)**: 全国のページは公式の全国の値 (`app/japan`) がある指標だけを出す (カタログの 962 指標のうち 371 指標)。そのため 28 テーマで、題に入る主な指標 (`themeLeadLabels`) が全国のページに出ない (例: 「全国の地方財政｜財政力指数・実質公債費比率の推移と…」に両指標が無い)。エネルギー消費・職業別年収・自治体 DX の 3 テーマは、全国のページに章が 1 つも描かれず、全指標の一覧と FAQ だけになる。次: 全国の題は全国の値がある主な指標から作るか、章の無い全国のページをどう扱うか (県の選択へ促す・noindex など) をオーナーが決める。上の 4 週の測定中は題を変えない。
- **完了条件**: 地方財政の載せ替えと台帳・管理画面の統一が済み、4 週の比較を記録している。

### [THEME-SINGLE-CARD-BUNDLE-01] テーマの指標 1 つだけのカードの縦の並びを、数値タイルの格子か表に束ねる
タグ: [UI・UX] [種類:改善] [実行:対話] [検証:npm run validate:catalog --workspace=@stats47/data-configs] [起票:2026-11-13] [領域:サイト]

- **観測 (2026-11-12)**: 56 テーマの指標カード 467 枚のうち 342 枚が指標 1 つだけのカード (`metricGroups` の `rankingKeys` が 1 件)。地方財政は 23 枚すべて、林業は 15 枚すべてで、ページが縦に長い。11-03 に「食卓と家計の支出」で試した束ね方 (`view: "tiles"` の数値タイルの格子・5 件以上は `"table"`) はほかのテーマに広げていない。
- **次**: カードの多いテーマ (地方財政・林業・医療・地方の生活サービス) の 1 つで、同じ章の 1 指標カードを 1 グループの `tiles` にまとめる案を作り、オーナーと localhost で見比べる。良ければ同じ規則 (同じ章・単位 2 種まで・5 件以上は table) で他のテーマへ広げる。`tiles` の章には答えの文 (`section-answer.ts`) が出るので、その文面も見る。
- **完了条件**: 合意したテーマで束ね、`validate:catalog` が error 0、テーマ画面の vitest が通り、localhost の画面で確かめたスクリーンショットをオーナーが見ている。
- **禁止**: 合意前に全テーマを一括で書き換えない。

### [RANKING-RAIL-CIRCULATION-01] PC のランキングの右レールの下の空きに、回遊の導線を足すかを決める
タグ: [UI・UX] [種類:意思決定] [実行:対話] [起票:2026-11-12] [領域:サイト]

- **起点 (2026-11-12 オーナー)**: PC でランキングを開くと、右レールの中身が本文より短く下が空いている (総人口のランキング・1440px で約 840px。量はページの長さで変わる)。その日はまず右レールの最後の AdSense を 300×600 の追従にし (`ADSENSE-FORMAT-EXPERIMENT-01`)、回遊は別のセッションで議論すると決めた。
- **案 (未決定)**: 分野のランキング一覧の後、追従する広告の上に「この県が 1 位の指標」「同じ調査のランキング」のような導線を足す。右レールは本文の横にあるときだけ出るので PC だけの話。既存の部品 (`RelatedContentNavigation`・`RankingItemsSidebar`) と台帳 `data/content/` の関係で作れるかを先に見る (専用の部品を作らない)。
- **判断の材料**: 回遊は PV の主なレバー (KPI `site-circulation-rate`)。サイト内の遷移は週次の `internal-transitions.csv` (referrer) で読む。追従広告の 2 週の結果 (ユニット `stats47-ranking-table-side` の視認率・収益) を見てから、広告と導線の並び順を決める。
- **停止条件・禁止**: 追従する広告と導線が重ならない・隣り合わないようにする (広告の枠の台帳の共通のルール)。右レールに独立したスクロールを作らない (`ui-components.md`)。
- **完了条件**: 足すか足さないか、足すなら何をどこに置くかをオーナーが決め、足す場合は実装の別カードに渡している。

### [SUBSIDY-EVIDENCE-STRATEGY-01] 補助金・創業計画を書く事業者と支援者を「仕事の読者」として採るかを決め、収益化戦略とペルソナに反映する
タグ: [収益化] [種類:意思決定] [実行:対話] [起票:2026-11-11] [領域:戦略]

- **起点**: 2026-11-11 のオーナーとの検討と Web 調査。検討の問いと答え・ペルソナ・導線・商品の階段・制度ごとの統計の欄・市場の調査・未確認の点は `docs/02_実装計画/49_補助金の根拠データとAIノウハウ展開仕様.md` にまとめた (status は draft。このカードの決定で active に上げる)。
- **問い**: `ISSUE-PAYING-NEED-01` の「別の仕事の読者を先に確かめるか」に対し、行政職員とは別の読者 (自分で申請書を書く創業予定者・小規模事業者／診断士・行政書士・認定支援機関などの支援者／統計局の無料講座を受けた社会人) を先に確かめるか。
- **読者の課題 / HARM**: 計画書の「市場の動向」「売上の根拠」に、どの統計をどの年の値で置けば客観的なデータになるか分からない (M: 資金の調達、A: 事業の達成)。提供価値は、公庫の式「世帯数 × 1 世帯あたり消費額 × シェア」の単価の項と、使う年・出典の判断。支払う理由は、締切の前に探して揃える時間を買えること。
- **需要の証拠 (2026-11-11 観測)**: 持続化補助金は一般型 第 20 回から「客観的なデータを用いた市場や顧客ニーズの分析」が補助対象事業の要件になった (公募要領 第 9 版)。ココナラの商圏分析は 30,000 円の出品に評価 57 件。補助金向けの地域統計データ集は市場に見当たらない。stats47 で売れたのは「e-Stat × Claude Code」の作り方だけ (note 累計 600 円)。**未検証**: 検索ボリューム、この読者が stats47 の記事に払うか、申請件数の規模。聞き取りはしていない。
- **決めること**:
  1. この読者を `02_収益化戦略.md` §2.1 の対象と `04_ターゲットペルソナ.md` §6 の表に足すか (足すなら仮説の段階と明記する)。
  2. 試す順番と判定の数値 (仕様 §9 の提案値: ① 有料記事と無料の入口記事を 4 週 → ② サイトの推計ページと制度の対応表を 8 週 → ③ 受注)。データ集の価格の実験 (判定 2026-12-30) の条件は変えない。
  3. `ISSUE-PAYING-NEED-01` の禁止 (答えが出る前に行政向け商品の制作を増やさない) との関係。こちらは行政向けではない別の読者だが、同時に走らせる数を決める。
  4. 月の重点 (`monthly.md` の `focus_domains`) に入れる月。
- **守ること**: 渡すのは値・出典・年次・計算表・調べ方まで。申請書に貼れる文例やひな形は作らない (改正行政書士法 2026-01-01 施行。仕様 §6)。「採択される」を売り文句にしない。
- **関係**: 制作は `KNOWHOW-SUBSIDY-EVIDENCE-01`・`KNOWHOW-FREE-COURSE-ENTRY-01`・`KAKEI-MARKET-SIZE-PILOT-01`・`SUBSIDY-FIELD-MAP-01`、受注の判断は `TRADE-AREA-REPORT-DECISION-01`、保留は `WAGE-RULE-PAGE-01`。オーナーは行政書士を 2027-11 に受験する予定で、登録後は同じ入口が申請業務の相談につながる (別の事業。stats47 の商品には含めない)。
- **完了条件**: 採否と順番をオーナーが決め、`02_収益化戦略.md` と `04_ターゲットペルソナ.md` に反映し、仕様の status を更新している。採らない場合は、関係する 6 枚のカードを削除している。

### [KNOWHOW-SUBSIDY-EVIDENCE-01] 有料記事「創業計画書・持続化補助金の売上の根拠を、家計調査 × e-Stat × Claude Code で作る」を 1 本出し、4 週の実売を確かめる
タグ: [収益化] [種類:制作] [実行:対話] [起票:2026-11-11] [領域:商品]

- **位置づけ**: `KNOWHOW-PRODUCT-PILOT-01` のテーマ候補 (E)。売れた唯一の系統 (e-Stat × Claude Code) を、使い道 (計画書の根拠) で切り直す。採否と順番は `SUBSIDY-EVIDENCE-STRATEGY-01`。根拠は `docs/02_実装計画/49_補助金の根拠データとAIノウハウ展開仕様.md` §5・§8。
- **読者**: 自分で申請書を書く創業予定者・小規模事業者 (仕様 §3 の A)。支援者 (B) は反応を見てから別の記事で。
- **中身**: 公庫の創業の手引の式「○km 圏内の世帯数 × 1 世帯あたり消費額 × シェア」のうち、単価の項を家計調査から出す手順。品目の選び方、使う年、52 市に無い地域の扱い (推計と明記)、出典の書き方。同梱はスクリプトと計算シート。世帯数は jSTAT MAP で出す方法を案内する (無料の公式ツール)。芯は操作の手順ではなく「どの統計のどの表を、何年の値で、どう組み合わせるか」。
- **価格**: 500〜980 円の買い切り (note)。データ集の価格の実験とは別の商品として記録する。
- **次 (実行順)**: ① 家計調査の品目別の値の世帯区分 (二人以上の世帯か総世帯か) を統計局の公式で確かめ、掛ける世帯数とそろえる ② 総務省の回答 (2025-10-10 付。参考資料の提供は書類の作成に当たらないとする趣旨) の原文を探して確かめる。見つからなければ、文例・ひな形を載せない設計のまま、商品の説明に「申請書の作成は申請者本人か行政書士」と書く ③ 原稿とスクリプトを作る ④ オーナーの承認後に公開し、4 週の閲覧・購入を販売台帳に記録する。
- **判定 (提案値)**: 続ける = 購入 3 件以上。やめる = 閲覧 300 以上で購入 0。閲覧 300 未満なら導線を足して 1 回だけ 4 週延ばす。
- **停止条件・禁止**: 「採択される」「通る」と書かない。欄にそのまま貼れる文例・埋めるだけのひな形を載せない。制度の回・締切は要領の版と確認日つきで書く (持続化 一般型 第 20 回は 2026-12-15 締切)。note への公開・価格の変更はオーナーの承認と人手のログインを経てから。
- **完了条件**: 4 週の実売 (0 件なら 0 件と、考えられる理由) が台帳にあり、続ける・直す・やめるをオーナーが決めた。

### [KNOWHOW-FREE-COURSE-ENTRY-01] 無料の入口記事「統計局の講座で Excel でやった集計を、Claude Code で 5 分にする」を出し、有料記事へ流れる数を 4 週測る
タグ: [収益化] [種類:制作] [実行:対話] [起票:2026-11-11] [領域:商品]

- **起点**: 統計局の「社会人のためのデータサイエンス入門」は累計 23.1 万人で、e-Stat と Excel の手作業を教えている。受けた人は競合の客ではなく見込み客で、「その作業を生成 AI で短くする」は講座の次の段階になる (2026-11-11 オーナーの指摘。`docs/02_実装計画/49_補助金の根拠データとAIノウハウ展開仕様.md` §3 の C・§4 の ②)。生成 AI × 公的統計に絞った有料商品は、note・Kindle・Udemy・Brain に見つからなかった。
- **未検証**: 既存の有料マガジン「公務員の e-Stat × Claude Code 実務ガイド」(1,480 円) は売れたのが 2 件で、この母集団に届いていない可能性がある。庁内で外部の生成 AI を使えない職員が多いなら、読者は講座を受けた個人・診断士・コンサル・研究者・記者の側に寄る。
- **中身**: 講座と同じ題材 (e-Stat の表を落として集計しグラフにする) を、手作業と Claude Code で並べて見せる。所要時間は自分で測った値だけを書く。講座の教材そのものは写さない (題材の種類を合わせるだけ)。末尾で `KNOWHOW-SUBSIDY-EVIDENCE-01` の有料記事と既存のマガジンへ 1 行ずつ案内する。
- **集客**: note の中の検索・推薦が主。stats47 の Claude Code 連載は 28 日 25 PV なので、サイトからの送客は当てにしない (収益化戦略 §3.5)。
- **判定 (提案値)**: 4 週の閲覧と、有料記事へ流れた数 (note のダッシュボードの記事別の閲覧で見る)。閲覧 100 未満なら入口として成立していないので、題名と検索語を 1 回だけ変える。
- **停止条件・禁止**: 「稼げる」「誰でも」と書かない。公開はオーナーの承認後。
- **完了条件**: 4 週の閲覧と有料記事への流れが記録され、入口を続けるか・題材を変えるかを決めた。

### [KAKEI-MARKET-SIZE-PILOT-01] 品目 × 地域の「1 世帯あたり支出と推計市場規模」のページを 10 品目ほど試し、検索と記事への送客を 8 週測る
タグ: [収益化] [種類:制作] [実行:対話] [起票:2026-11-11] [領域:サイト]

- **起点**: 公庫の創業の手引は「世帯数 × 1 世帯あたり消費額 × シェア」で売上を見積もる例を示し、材料に e-Stat の家計調査を挙げている。世帯数は jSTAT MAP が無料で出し、シェアは申請者が置く。統計サイトが担えるのは単価の項 (`docs/02_実装計画/49_補助金の根拠データとAIノウハウ展開仕様.md` §5)。家計調査は stats47 で検索の流入が最も多い分野で、表で完結するので小地域のデータも販売に申請が要る境界データも要らない。
- **前提**: `KNOWHOW-SUBSIDY-EVIDENCE-01` の判定の後に始める (1 つずつ試す)。採否は `SUBSIDY-EVIDENCE-STRATEGY-01`。
- **ページの形**: 主役は品目別の 1 世帯あたり支出 (出典・年次・対象の世帯区分つき)。市区町村の世帯数を掛けた推計は「上限の目安」として並べる。利用者が自分の商圏の世帯数とシェアを入れる計算欄を付ける。「市区町村の市場規模」を主役にしない。
- **弱点と対処**: 家計調査の品目別の値は 52 市 (県庁所在市と政令市) だけ。ほかの市区町村は県庁所在市の値で代えるか按分する推計になるので、「推計」と方法を値のそばに書く。世帯区分をそろえる。市区町村は商圏より粗いので、これだけで売上の予測は作れないと書く。
- **次 (実行順)**: ① 品目を選ぶ (創業の多い業種に当たるもの: パン・外食・理美容・菓子・コーヒーなど。既存の家計調査ページの検索語と重ねて決める) ② 世帯区分と推計の方法を決めて `packages/` の既存の家計調査の指標に乗せる (新しい取得は増やさない) ③ 雑学の読者向けの既存ページとは別の入口として出す (収益化戦略 §3.5: 雑学の流入を商品へ流す前提を置かない) ④ `nav_click` で記事への送客を数える。
- **判定 (提案値)**: 続ける = パイロットのクリックの合計が既存の家計調査ページ 1 本あたりの中央値以上で、有料記事への送客が月 10 クリック以上。やめる = 中央値の半分未満。広告の収入では評価しない。
- **完了条件**: 8 週のクリック・検索語・送客が記録され、品目を広げるか・やめるかを決めた。

### [SUBSIDY-FIELD-MAP-01] 「どの制度のどの欄に、どの統計を、どの粒度で」の対応表を無料で出し、推計ページと記事の入口にする
タグ: [コンテンツ品質] [種類:制作] [実行:対話] [起票:2026-11-11] [領域:コンテンツ]

- **起点**: 公式の資料は統計の名前をほとんど挙げていない (名指しは統合補助金の RESAS だけ。持続化の参考資料には「統計」「人口」「商圏」の語が無い)。どの欄にどの統計をどの粒度で置くかは支援者の慣行に任されていて、まとまった表が見当たらない。オーナーの見立て: ここまで分析すればコンテンツとデータがつながる (2026-11-11)。
- **材料**: `docs/02_実装計画/49_補助金の根拠データとAIノウハウ展開仕様.md` §7 の表 (持続化 第 20 回、新事業進出・ものづくり統合補助金、経営革新計画、公庫の創業計画書、賃上げの要件、事業承継・M&A、統計が要らない制度)。要領の原文で確認済みの範囲と、未確認の範囲 (統合補助金の第 2 回の日程、持続化の記入例) が分かれている。
- **形**: ブログのハブ記事 1 本。制度ごとに、欄の名前・求められる中身・使える統計 (e-Stat のどの調査・どの粒度)・stats47 のどのページで見られるか・見られないものは jSTAT MAP など公式の無料ツール。要領の版と確認日を必ず書く。欄に書く文章の例は載せない。
- **前提**: `KAKEI-MARKET-SIZE-PILOT-01` と同じ時期に出す (表から送る先が要る)。制度の事実は公開の前に公募要領で確かめ直す (回が変わると欄も変わる)。
- **維持**: 公募の回が変わったら更新する。更新できないなら古い回の記述を残さず、確認日を見出しの近くに置く。
- **完了条件**: 記事が公開され、表から推計ページ・有料記事への遷移が計測できる状態になっている。

### [LEDGER-DB-UNIFY-01] マスタと台帳を `data/` の 1 つの DB にまとめる (13 段)
タグ: [エージェント・SSOT] [種類:改善] [実行:対話] [検証:npm run check-datasets] [起票:2026-11-10] [領域:データ]

2026-11-10 にオーナーが承認した計画 (13 段) は 2026-11-12 に全段を終え、計画のファイルは消した。`packages/`・`apps/`・`config/` のマスタと台帳は `data/` の JSON + Schema に移り、`npm run check-datasets -- --er` の「data/ の外に残るマスタ・台帳」と統合の候補はどちらも 0 件。
- **残り**: 段 0〜13 は 2026-11-12 に develop へ入った (`1ca0cff25`。push で起動した Develop Quality Gate・広告の R2 への反映・広告の在庫の更新は 3 つとも成功し、R2 の広告の snapshot は台帳と同じ 328 件)。残りは main へ入れること (オーナーの指示で行う) と、下の「main へ入れるときの注意」を確かめること
- **開発サーバーでの確認 (2026-11-12)**: ブランチの作業ツリーで `npm run dev:web` を起動し、Geo (トップ・分析 3・層・データの一覧・交通網の変遷)・県 2・全国 3・市区町村 3・調査 2・カテゴリ・テーマ 3・ランキング・ブログ・商品の 23 ページが 200 でエラーなしだった。転送 (ランキング・ブログ・テーマの旧 URL の 301) と 410 (ブログ・ランキング) も台帳どおりに返った。ランキングのページに広告が出て、県のページの HTML にシンボルと特産品が本番と同じく入っていた。`next build` と Remotion のバンドルは未確認
- **別の機会に回した判断**: 列挙が読み込み口の TS と Schema の `enum` の 2 か所に書かれている (`geo.layers` の `sourceAnalysis`、`open-data-catalog/types.ts` の `OPEN_DATA_SOURCE_KINDS` など)。型を Schema から導くかを決める。2 桁の県コード (港湾の `prefectureCode`・`open-data.prefecture-statistics` の `resources[].prefectureCode`) を県のマスタ (5 桁の `prefCode`) へ結ぶ手段が無い (`refs` の `parse` は `list` だけ)。検査に桁を直す指定を足すか、台帳の側を 5 桁にするかを決める。県の本文 47 ファイルを 1 ファイルにするか
- **main へ入れるときの注意**: (1) 段 1 は `sync-snapshots.yml` の書き戻しのパスを変えたので、main へ入るまで `sync-snapshots` を起動しない。(2) 段 2 でブログの公開前検査 (`blog-publication-guard.ts`) の契約のパスが変わったので、保管してあるブログ索引の候補は作り直す。(5) 段 5 の読み込み口は middleware (Edge) が JSON を静的 import する。テストは通っているが、`next build` と本番での転送・410 は未確認なので、main へ入れた後にルートのスモークテスト (`.github/scripts/smoke-test-routes.sh`) で確かめる。(6) `apps/web/src/config/unpublished-blog-slugs.ts` (生成物) の見出しが、410 の一覧の正本を旧い TS と書いたままなので、`generate-unpublished-blog-slugs.ts` の文言を直して作り直す。(4) `data/products/catalog-status.json` の証跡の文字列に、移す前の KDP の出品台帳のパスが 33 件残る (`products:report` で作り直すと新しいパスになる)。(7) 段 6 で `packages/gis` と `packages/data-configs` の読み込み口が `data/geo/`・`data/open-data/` の JSON を静的 import する形になった。型検査と vitest は通っているが、`next build` と Remotion のバンドル、`/geo` 系ページの表示は未確認なので、main へ入れる前に `npm run dev:web` で `/geo` と `/geo/layers/<slug>` を開いて確かめる。(8) 段 10 で広告の台帳を足し `publish-affiliate-ads.yml` の起動条件を変えた。develop への push で広告の R2 への反映が走り、成功した (2026-11-12)。main へ入っても workflow は develop の push で起動するので、main では走らない
- **完了条件**: ブランチ `ledger-db-unify` が develop と main に入り、上の注意 (1)〜(8) を確かめた

### [SKILL-AGENT-RULES-TO-CHECKS-01] skill と agent の定義を、短い規則と機械の検査へ作り替える
タグ: [エージェント・SSOT] [種類:改善] [実行:対話] [起票:2026-11-10] [領域:管理]

2026-11-10 のオーナーの方針: 文書が古くなったり書きすぎたりして agent の判断が増えるなら、短い規則とテスト・機械の検査で守る。データの置き場は `LEDGER-DB-UNIFY-01` でこの形にした (規則 3 行 + `check-datasets`)。skill (`.claude/skills/**/SKILL.md`) と agent (`.claude/agents/*.md`) の定義は範囲が別なので、ここで扱う。
- **次**: 置き場・形・手順を文章で説明している定義を数え (`LEDGER-DB-UNIFY-01` の移行で `RETIRED` が指した文書が最初の材料)、検査へ移せる規則と、消せる説明を分ける
- **禁止**: 検査を作らずに文章だけを消さない (規則が消える)
- **完了条件**: 対象にした定義ごとに、規則が検査かテストに移り、説明の節が消えている

### [BLOG-LEDGER-PUBLISH-SYNC-01] ブログを公開した直後に、記事台帳・ページの索引・指標の逆引きを進める
タグ: [インフラ・計測] [種類:不具合] [実行:対話] [検証:npm run content:check] [起票:2026-11-10] [領域:サイト]

記事台帳 `data/blog/ledger/articles.json` とページの索引 `data/content/pages/blog.json` は、`sync-snapshots.yml` が R2 の一覧から書き戻すときだけ進む (`sync-snapshots.yml:255`)。
- **証拠 (2026-11-10)**: `blog-auto-publish.yml:233-281` は sitemap とタグのキーだけを作り直し、`content:sync` を呼ばない。台帳を作った時点で、コミット済みの索引は R2 より題 28 件・指標 21 件ぶん古かった
- **証拠 (2026-11-10)**: `sync-snapshots.yml` は `blog.json` を書き戻すが `metrics:build-index` を呼ばず、`data/metrics/index` も `git add` しない。記事の指標が変わった回の後は `metrics:check` が古い逆引きで落ちる (今回の作り直しで 29 ファイルが変わった)
- **次**: 公開の workflow の最後で台帳と索引と逆引きを作り直して書き戻すか、`sync-snapshots` の書き戻しに逆引きを足すかを決めて実装する。台帳の 410 の 18 件は題が空なので、git の履歴の索引から埋められるかを確かめる
- **完了条件**: ブログを 1 本公開した後、手で何も起動せずに `npm run content:check` と `npm run metrics:check --workspace packages/data-configs` が通る

### [WINDOWS-LOCAL-GATES-01] 会社の Windows PC でだけ落ちる検査を直す (パス区切り・改行)
タグ: [インフラ・計測] [種類:不具合] [実行:対話] [起票:2026-11-10] [領域:管理]

- **証拠 (2026-11-10)**: `apps/web/scripts/lib/__tests__/blog-fullbleed-cli.test.ts` の 2 件が、パス区切り (`\`) を `/` の正規表現で照合して落ちる
- **証拠 (2026-11-10)**: `.claude/scripts/lib/unit-semantics.mjs` は `eol=lf` の属性が無く、作業ツリーで CRLF になって `preflight:pr` の Unit Semantics Mirror が落ちる (`git ls-files --eol` が `i/lf w/crlf`)
- **証拠 (2026-11-10)**: `apps/admin/tests/unit/agent-models.test.ts` が、期待値 `.claude/agents/broken.md` に対して区切りが逆のパスを返されて落ちる。admin の vitest の 3 件 (`reference-content-read-model`・`draft-caption`・`reference-blog-source`) は 5 秒の時間切れで落ち、時間切れを延ばすと通る
- **証拠 (2026-11-11)**: テーマの `evaluate-theme-experiments` の CLI テスト 7 件が、`--import` に Windows の絶対パスを渡して `ERR_UNSUPPORTED_ESM_URL_SCHEME` で落ちる (file URL にする必要がある)。`npm run theme:quality:test` は 551 件中 8 件が失敗し、残り 1 件は preview ゲートウェイの 502 のテスト
- **証拠 (2026-11-11)**: `.claude/scripts/lib/__tests__/data-refresh-scoped-workflow.test.mjs` が、`spawnSync` で `node_modules/.bin/tsx` を起動できず `status: null` で落ちる
- **証拠 (2026-11-12)**: `.claude/scripts/note/__tests__/attachment-dom.test.cjs` の「無料説明文の同名言及を無視し、折り返し段落のDOM先頭を選ぶ」が、生成した式に `keys Home|index($0,h)|startsWith` が無いことの検査で落ちる (読むファイルは作業ツリーで CRLF。差分の無い作業ツリーでも落ちることを段 13 の検証で確認)。Mac (改行は LF) の作業ツリーでも同じ検査で落ちる (2026-11-13 確認)。`.claude/scripts/note/editor-helpers.sh` の `ins_file` に `index($0,h)` が残っているためで、改行コードは原因ではない。Windows の件と分けて、`ins_file` を `attachment-dom.cjs` の式へ寄せるかテストを現状に合わせるかを決める
- **証拠 (2026-11-13)**: `apps/web/src/config/__tests__/gone-blog-publication.test.ts` の 3 件 (「…はslug指定でも旧原稿path指定でも再公開を拒否する」) が、変更の無い本体ツリーでも落ちる (原因は読んでいない)
- **証拠 (2026-11-13)**: `apps/web/src/__tests__/region-page-no-comparison.test.ts` の 3 件が、列挙したパス (`appareaspage.tsx`) を `/` 区切りの期待値と比べて落ちる (CF-CPU-URL-01 の作業中の vitest で観測。触っていないファイル)
- **完了条件**: この PC で `npm run preflight:pr` の該当の 2 ゲートと、`apps/web/scripts`・`apps/admin` の vitest、`npm run theme:quality:test` が通る
- **統合 (2026-11-13)**: `ADMIN-AGENT-MODELS-WIN-PATH-01` をこのカードへ統合した。完了条件に含める: この PC で preflight:pr の該当 2 ゲート・apps/web/scripts と apps/admin の vitest・npm run theme:quality:test が通る。吸収分: (1) region-page-no-comparison.test.ts の 3 件は PR #1258 で修正済みなので Windows で通ることの確認だけ残す (2) apps/admin/tests/unit/agent-models.test.ts は agentModelCatalog が返す file を / 区切りにそろえ、npm run test -w apps/admin が通ること。
- **確認の追加 (2026-11-13・消した `ADMIN-VITEST-TIMEOUT-01` から)**: `apps/admin/vitest.config.mts` の testTimeout と hookTimeout を 120 秒にした (`ce725a765`)。この PC で tsc や dev サーバーと並行して `npm run test --workspace apps/admin` を流し、タイムアウトが 0 件かを確かめる。
- **確認の追加 (2026-11-13・消した `ROOT-TSX-NODE-PIN-01` から)**: この PC の Node は 22.14.0 で、`.mjs` が `.ts` を直接 import すると `ERR_UNKNOWN_FILE_EXTENSION` で落ちる (型の除去が既定で有効なのは 22.18 から)。`.claude/scripts` に約 10 本ある (`ads/build-placement-map.mjs`・`estat/gen-ssds-configs.mjs`・`lib/internal-link-lint.mjs` など)。22.14 を支えるなら tsx 経由にし、支えないなら Node を上げる (オーナーが決める)。ルートの devDependencies への tsx の追加は `7f6f18db0` で済み。

### [SURVEY-PORTFOLIO-VALIDATOR-DEDUPE-01] 調査ポートフォリオの検証スクリプトと Schema・refs の二重の検査をなくす
タグ: [エージェント・SSOT] [種類:改善] [実行:対話] [検証:npm run check-datasets] [起票:2026-11-10] [領域:データ]

- **証拠 (2026-11-10)**: `.claude/scripts/surveys/validate-survey-portfolio.ts` の列挙 (LIFECYCLE など 6 つ) が、`config/schema/surveys.portfolio.schema.json` の enum と二重にある。同じファイルの調査 ID の実在の検査 (`masterIds.has`) も、カタログの `refs` と重なる
- **証拠 (2026-11-10)**: `.claude/rules/survey-content-standards.md` が書く `relatedHubs[]` は、調査ハブの本文の型と Schema に無い
- **完了条件**: 列挙と ID の実在は Schema と `refs` だけが持ち、検証スクリプトは意味の検査だけを持つ。規約の `relatedHubs[]` は、実装するか記述を消すかが決まっている

### [MIDDLEWARE-REGISTRY-BUNDLE-01] middleware が指標の一覧 (3,324 件) を Edge のバンドルに取り込んでいる
タグ: [インフラ・計測] [種類:不具合] [実行:対話] [起票:2026-11-10] [領域:サイト]

- **証拠 (2026-11-10)**: 静的 import をたどると、`apps/web/src/middleware.ts` → `lib/url-policy.ts` → `config/known-japan-slugs.ts` → `@stats47/data-configs` の `geo-scope` → `municipality-ranking-titles.ts` → `registry.ts` の経路がある。`legacy-category-keys.ts` は「Edge で指標の一覧を抱えない」ためにキーを写して持っていたが、別の経路で入っていた。バンドルの実測はしていない
- **次**: 本番ビルドの middleware のサイズで実測し、入っていれば全国テーマの slug の一覧を、指標の一覧を import しない経路から引く
- **完了条件**: middleware から `registry.ts` への import の経路が無いことを、テストか検査で固定している

### [THEMES-DATASET-ID-CALLSITES-01] テーマの台帳を読む約 24 か所を、ファイルごとのカタログの id で引く
タグ: [エージェント・SSOT] [種類:改善] [実行:sweep] [検証:npm run check-datasets] [起票:2026-11-11] [領域:データ]

2026-11-11 に `data/themes/{name}` の 1 行をファイルごとの 7 行 (`themes.portfolio`・`themes.experiments`・`themes.quality` など) に分けた。読み手の約 24 か所は、`datasetDir("themes.portfolio")` でディレクトリを引いてから `quality.json` などのファイル名を組み立てている (`git grep 'datasetDir("themes.portfolio")'`)。動作は変わらないが、ファイル名がコードに残る。
- **完了条件**: 各ファイルを `datasetPath("themes.<id>")` で引き、ファイル名の組み立てが残っていない

### [KAKEI-CATALOG-CI-01] 家計の分析単位の台帳の実物との照合を PR の CI に載せる
タグ: [エージェント・SSOT] [種類:改善] [実行:対話] [検証:npx tsx packages/data-configs/scripts/check-kakei-analysis-catalog.ts] [起票:2026-11-10] [領域:データ]

`pr-quality-check.yml` は `check-metric-contract.ts` だけを動かし、同じ `metrics:check` に入っている `check-kakei-analysis-catalog.ts` (公開ページと指標の実物との照合) を動かしていない (2026-11-10 に workflow を grep して確認)。CI に載っているのは合成の入力で検査する vitest だけで、掲載先のページが非公開になった・指標の絞り込みが変わった、を PR で止められない。2026-11-10 から全国の図の生成 (`generate-kakei-axis-charts.ts`) がこの台帳の絞り込みを読むので、ずれは図の値に直結する。
- **完了条件**: `packages/data-configs` か `data/content/pages` に触る PR で `check-kakei-analysis-catalog.ts` が走り、失敗で止まる

### [AFFILIATE-PUBLISH-PROFILE-TRIGGER-01] 案件の台帳だけを変えた push で、広告の R2 への反映が走らない
タグ: [収益化] [種類:不具合] [実行:対話] [起票:2026-11-11] [領域:アフィリエイト]

`publish-affiliate-ads.yml` は広告の台帳 (`affiliate.ads`) と読み込み口の変更でだけ起動する。案件の台帳 (`affiliate.offer-profiles`) の変更は、配信する `AFFILIATE_ADS` の `isActive` (配信の保留) と `offerProfile` を変えるのに、案件だけを変えた push では R2 の `app/affiliate-ads/all.json` が作り直されない (2026-11-11 に workflow の paths と読み込み口の結合の式を読んで確認。台帳を `data/` へ移す前の TS のころから同じ)。
- **次**: paths に案件の台帳と、配信の保留を決める `apps/web/src/features/ads/constants/affiliate-delivery-policy.ts` を足すか、オーナーと決める (起動のたびに R2 への書き込みと全ゾーンのパージが走るため)
- **完了条件**: 案件の台帳だけを変えた push で、R2 の広告の snapshot が作り直される

### [GEO-ANALYSIS-CONTENT-ID-DANGLING-01] Geo 分析 3 件の contentId が、事業計画のコンテンツの機会に無い
タグ: [エージェント・SSOT] [種類:不具合] [実行:対話] [検証:npm run check-datasets] [起票:2026-11-11] [領域:データ]

台帳 `geo.analyses` の土砂・低標高・公共施設の 3 分析は、contentId に geo-107・geo-129・geo-128 を持つが、台帳 `business-plan.content-opportunities` の機会は geo-001〜geo-100 しか無い (2026-11-11 に段 11 で参照を宣言して判明)。いまは `config/datasets.mjs` の `geo.analyses` の参照を `severity: "warn"` で通している。
- **次**: 事業計画の担当が、機会を足すか contentId を直すかを決める
- **完了条件**: 3 件が実在する機会を指し、`geo.analyses` の `contentId` の参照から `severity: "warn"` を外しても `npm run check-datasets` が error 0

### [PRODUCT-LP-SHOWCASE-01] 商品の LP (サイトの商品ページと note の記事) を、1 つの画像指定から全商品へ作れる仕組みとゲートにする
タグ: [収益化] [種類:改善] [実行:対話] [検証:npx tsx apps/web/scripts/generate-product-storefront.ts --check] [起票:2026-11-10] [領域:商品]

- **2026-11-13 公開指示と実測**: オーナーが全商品のコミット・デプロイとnote更新を承認。14商品の追加分析を再生成・検査し、private R2へ不変ZIPを保全、`analysisDelivery.status=prepared`に固定済み。note所有者APIで全14件の価格と添付を照合。P-14は実公開v5（2025年・832指標）へ台帳とLP画像を同期し、v4のOffice実機確認は引き継がない。
- **サイト側の反映**: PR #1258・main `0e07839fb` をデプロイ済み（run 43370547519 成功）。本番14LPの内容・上下のnote導線・テーマ参照と59画像のSHA256を台帳に照合済み。追加分析の販売公開はnote確認後に共通release CLIで行う。
- **note更新の停止条件と再開**: Windowsから画像アップロードを試行すると通信フィルターがHTTP 503「ブロックされました」を返した。公開記事・添付は未更新。2026-11-13にオーナーが別の環境は現在利用できないと回答。通信を許可された環境が利用可能になってから、既存添付を保持して分析ZIPを追加し、価格不変・既存有料本文保全・添付の非露出を確認して、共通release CLIへverification JSONを渡す。無料会員で添付は1日10回までのため、制限が出たら翌日に残件を進める。制限を回避しない。
- **完了条件の追加**: 全14件のnote確認とpublished台帳・公開LPの作成例が一致し、本番画像が表示されること。Office実機確認は未確認のまま合格扱いしない。保存原稿の古い価格（P-01〜P-12）を現公開価格に同期してprivate R2へ再保存する。
- **残る公開作業**: note無料部分14本の初稿反映、公開中の添付と固定納品版の照合、5商品の分析改訂案の実機・目視確認は残る。サイトの固定販売版LPはPR #1252で反映し、2026-11-12に本番14件の用途・画像59枚への参照・上下の購入導線・価格を照合済み。画像幅・作成例の並び方の契約はデザインシステム、回帰検査は `responsive-layout.spec.ts` を参照。改訂案を販売版へ自動昇格しない。
- **作業用資料の片付け**: 原典とR2の調査用コピー `C:/tmp/stats47-population-research` は台帳と改訂候補へ必要事項を統合済み。Codexの自動承認がフォルダ削除と限定したJSON削除の両方を拒否したため、許可された環境でこの一時フォルダだけ片付ける。改訂候補 `.local/data-packs/P-01/analysis-20261112` は目視用に保持する。
- **検証用一時ファイルの片付け**: `C:/Users/m004195/AppData/Local/Temp/stats47-theme-product-check-20261113` の画面キャプチャ・検査結果・公開CA証明書・接続用preloadは使用終了。解決済みの削除先をTemp配下に限定したが自動承認がポリシーで拒否した。許可された環境でこのディレクトリのみ削除し、存在しないことを確認する。開発・管理・note確認サーバーと改訂候補は保持する。
- **公開作業の一時ファイルの片付け**: `C:/Users/m004195/AppData/Local/Temp/stats47-product-release-20261113` も使用終了後の削除を自動承認がポリシーで拒否した。note本文の取得コピー・P-14 ZIPの作業用コピー・検査ログを含む。正本のZIPはprivate R2、公開結果はPR #1258・#1261に記録済み。削除を許可された環境でこのディレクトリのみ片付ける。別の削除経路で回避しない。
- **人口・世帯の改訂案の確認**: `products.landings` のP-01 `analysisRevision` を `products:analysis:build` / `products:analysis:check` で再生成・検査し、開発中の通常商品URLとnote一覧（4794番）で10分析・共通画像11枚を確認する。全国1,741自治体の人口増減率・高齢単独世帯割合・高齢夫婦世帯割合と高知県の拡大図・世帯構成の推移を含む。次はExcel実機確認→現行134指標版との同梱/差替え方針・価格の決定→改訂ZIPと原稿の非公開保全→オーナー承認後の販売版公開の順。停止条件はデータ/図の不一致か実機未確認。完了条件は新しい納品版のSHA、LP/noteの記載、実機確認が一致すること。既存固定版を改訂候補で自動上書きしない。
- **全商品LPの確認対象**: 14商品で用途・画像先行の作成例・上下のnote案内を共通化。5商品の改訂案には全国・県内の市区町村地図と人口・世帯の推移図を含め、note一覧にも固定版9商品と併せて表示する。改訂案の購入案内は現行販売版との違いを明記。サイト商品名はLP台帳、販売先原題は照合用に分離する。note公開記事の更新・改訂案の販売版昇格・購入添付の照合は別工程として残す。

- **現在の判断 (2026-11-12 オーナー指示)**: 価格実験 PRICE-DATA-PACK-2026-11 による13パックの表示変更保留を解除する。製造品出荷額を含む既存の有料データ商品14件のサイトLPとnote無料部分の初稿を先に並行整備し、ブラウザのタブで1件ずつ目視確認してから外部公開へ進む。実験のstatusや価格は変更せず、公開時には表示変更日を記録して価格効果だけの比較と混同しない。

- **起点 (2026-11-10 オーナー指示)**: 製造品出荷額の商品 (`muni-manufacturing-shipment-data` / サイトの `/products/data-muni-manufacturing`) を LP にした。分析の型 (比べる・構成を見る・変化を見る) ごとに作れる図と、ファイルの中身の見本を見せる形である。オーナーから「ほかの商品にも展開できる仕組みやゲートになっているか」と問われた。答えは「半分だけ」なので、このカードで残りの半分を作る。
- **今ある部品 (他の商品にもそのまま使える)**:
  - note の見本画像は、記事の作業ファイル `figure-specs.json` (画像ごとに `file`・型の台帳の `template`・`input`) から `.claude/scripts/note/render-product-figures.ts` が型の台帳 (`data/content-operations/image-templates.json`) の描画器だけで描く。経路は `config/image-generation-routes.json` の `note-product-samples`。spec は記事と一緒に private R2 へ保存する (`note:article save`)。
  - 型の無い見本画像を持つ商品記事は、`.claude/scripts/note/build-note-figure-ledger.mjs --check` が `product-untyped` として数え、`.claude/config/note-figure-baseline.json` の `maxUntypedProductArticles` (14・縮小専用) を超えると止める。
  - 公開中の note 有料記事の本文・題名・添付の差し替えは `.claude/scripts/note/publish-product-paid-update.sh` (記事 key・`FREE_PROBE`/`PAID_PROBE` を渡す) で他の商品にも使える。
  - サイトの商品の型 `StorefrontProduct` (`apps/web/src/features/products/types.ts`) に、任意項目 `showcase` (節 = 見出し・短い説明・図の `file` と `alt`) を足した。商品ページ (`apps/web/src/app/products/[slug]/page.tsx`) は値があれば節を描く。画像の URL は公開 R2 の `app/products/<slug>/showcase/<file>` で、`ogpImageUrl()` で組む。
- **穴 (展開と品質を妨げているもの)**:
  1. **サイトの見本の設定がこの 1 商品にしか書けない**: 設定は `apps/web/scripts/generate-product-storefront.ts` の `STANDALONE_NOTE_PRODUCTS` に手で書いた。データ集 (note 有料データ集 14 件のうち P-01〜P-14 由来の 13 件) は `NOTE_PRODUCT_MAPPINGS` の経路、Kindle 13 件は KDP 台帳の経路で作られ、どちらも `showcase` を渡さない。
  2. **画像の指定が二重管理**: 同じ 11 枚について、ファイル名と説明文を note の `figure-specs.json` とサイトの生成スクリプトの両方に書いている。片方だけ直すとずれる (`feedback_hand_synced_duplication` と同じ型の負債)。どの画像がどの節 (比べる・構成・変化・ファイルの中身) に属するかは、spec には無く、サイトの設定と note 本文にだけある。
  3. **公開 R2 への配置が手作業で、検査も無い**: 2026-11-10 は `.local/r2/app/products/<slug>/showcase/` へ手でコピーし、`packages/r2-storage/src/scripts/push-exact-r2-assets.ts --prefix … --extension png` で置いた。サイトが指す画像が公開 R2 に無くても、生成の `--check`・型検査・テストのどれも止めない。その場合、本番で画像が切れる。
  4. **CDN が 404 を覚える罠**: R2 に置く前にページや curl で画像の URL を読むと、`storage.stats47.jp` の Cloudflare が 404 を `max-age=14400` (4 時間) で覚える。2026-11-10 は、置く前の localhost 確認で最初に表示される 5 枚がこれを踏んだ。置いた後に読み戻すと、HEAD は 200 なのに GET は Not Found の HTML が返った (`cf-cache-status: HIT`)。この Mac の `.env.local` には `CLOUDFLARE_ZONE_ID` が無く、ローカルの `purge-cache.ts` は動かない。`gh workflow run purge-cdn.yml -f prefix=app/products/<slug>/showcase` で消した (run 42783049768)。
  5. **LP の中身の約束を誰も検査していない**: 4 節 (比べる・構成・変化・ファイルの中身) がそろっているか、各図に alt があるか、どの商品に LP が無いかを数える検査は無い。note 側の検査が見ているのは「型で描いたか」だけである。
  6. **note 本文の LP の節も手書き**: note 記事の「比べる・構成・変化」の見出しと説明文は、記事原稿に手で書いた。サイトの `lead` と同じ事実 (例: 豊田市 20 兆 5,272 億円・倉敷市の約 3.7 倍・輸送用機械 93.4%) を二か所に書いているので、値を直すと片方が古くなる。
- **作るもの (推奨の設計)**:
  1. **画像指定を 1 か所にまとめる**: `figure-specs.json` の各画像に `section` (`compare` / `structure` / `change` / `file`) と `alt` を持たせ、節の見出しと説明 (`lead`) も spec の `sections` に置く。spec の形は JSON Schema で固定する (置き場は `config/datasets.mjs` の規約に従い、台帳に 1 行足してから)。
  2. **サイトの節を spec から導出する**: `generate-product-storefront.ts` が、公開済みの note 商品記事 (`data/note/articles.json`) ごとに spec を読み、`showcase` を作る。単独商品とデータ集の両方の経路で同じ関数を使う。`STANDALONE_NOTE_PRODUCTS` の手書きの `showcase` は消す。spec は private R2 にあるので、生成の入力にするには、公開してよい部分 (節・file・alt・lead・画像の sha256) だけを git の写し (`data/products/` か `data/note/`) に書き出す経路が要る。生成スクリプトが R2 を読む形にはしない (`--check` がネットワークに依存するため)。
  3. **公開 R2 への配置を決定的にする**: spec から描いた画像を `app/products/<slug>/showcase/` へ置く処理を、sha256 付きの manifest (`push-exact-r2-assets.ts --manifest`) で行う。上の git の写しの sha256 と一致する画像だけを置く。R2 への書き込みは CI か、オーナー承認つきのローカル実行に限る。
  4. **ゲートを足す**:
     - 生成の `--check` (pre-commit・PR) で、商品固有の用途・作成例・収録内容があり、各図のalt・共通型・固定納品への参照がそろうこと。図の種類や枚数は商品内容に合わせ、固定年のパックに長期推移を約束しない。ファイル見本も実際の納品物から作る。
     - 週次 (または release 前) に、`showcase` の全 URL へ GET し、200・`image/png`・sha256 一致を確かめる検査。HEAD ではなく GET で見る (上の穴 4 で HEAD は 200 だった)。
     - LP の無い公開中の note 商品の数を数え、縮小専用の上限を置く (`maxUntypedProductArticles` と同じ置き場 `.claude/config/` の baseline)。
  5. **CDN の罠を手順に入れる**: 置く前に画像の公開 URL を読まない。確かめは `.local/` の写しを localhost で差し替えて見る。置いた後に読み戻して不一致なら `purge-cdn.yml` の prefix で消す。この手順を `/build-data-pack` の E2 と `.claude/rules/note-image-assets.md` に書く。
  6. **note 本文の無料部分も同じ台帳から組む**: サイトとnoteで用途・見出し・説明・画像を二重管理しない。初稿作成は今回の指示範囲。有料境界・価格・添付ZIPを保持した差分を目視確認してから、記事ごとに公開する。
- **ローカル初稿・検証 (2026-11-12)**: 全14商品のコピー・根拠JSONを共通generatorへ接続し、サイトLP14件・note無料部分の初稿14件、新規共通型画像48枚＋既存11枚の計59枚を整備した（全14件desktopで画像切れ0・横はみ出し0、代表3商品を375/768/1024pxで横はみ出し0、商品・クリック計測20テストPASS、接続不整合・未定義型の検出3テストPASS、データSchema検査error0、型検査PASS）。
- **残る確認と公開**: [目視用一覧](http://127.0.0.1:4792/)からオーナーが1商品ずつ確認して公開順序を決める工程が残り、R2への画像push・note本文改訂・本番公開は未実施のため、カードと実験statusを保持する。
- **次 (実行順)**: ① 全14商品の用途・作成例を共通台帳で整え、固定納品ZIPのSHA・指標・年・単位・粒度・収録形式を照合 → ② 共通型で画像とファイル見本を生成し、サイトLPとnote無料部分の初稿へ接続 → ③ 全件をローカルのタブで1件ずつ目視し、各画面幅・画像・上下購入導線・計測を検証 → ④ 確認済み商品から画像manifestの配置、GET検査、note更新、本番反映。初稿整備・検証は進行中で、画像の外部配置・note更新・本番公開は未実施。初稿生成だけでこのカードを完了にしない。
- **停止条件・禁止**:
  - 納品実物と説明・作成例が一致しない商品は PRODUCT-PACK-CONTENT-MISMATCH-01 で解消するまで公開しない。価格実験の判定待ちは初稿整備の停止条件にしない。
  - 公開 R2 への書き込み、CDN の消去、note 記事の更新、本番デプロイは、それぞれオーナーの承認を取る。
  - 型の台帳に無い図を LP に載せない (型が足りなければ先に型を足す)。
  - Kindle 13 件は対象外。中身の見本は書籍のページで、データの図とは別の話になる。必要になったら別カードにする。
- **関連**: `PRODUCTS-PAGE-CONTENT-01` (商品ページで中身が分からない。このカードが仕組み、あちらが各商品の中身の是正) / `PRODUCT-LP-SHOWCASE-01` (note の見本画像を型へ) / `PRODUCT-PACK-CONTENT-MISMATCH-01` (データ集の中身と説明の食い違い)。2026-11-10 の実装は commit `149629f56` (サイト) と `571272640` (note の型の経路)。
- **完了条件**:
  - 公開中の note データ商品すべてで、サイトの見本の節と note の見本画像が同じ spec から作られている。
  - 生成スクリプトに手書きの `showcase` が 0 件。
  - 見本の全 URL の GET 検査が通る。
  - LP の無い商品の上限が 0 になっている。
- **統合 (2026-11-13)**: `PRODUCT-SAMPLE-TYPED-01` をこのカードへ統合した。完了条件に含める: LP カードの完了条件 (14 商品の LP と note 確認・画像の SHA 照合) に加え、13 パックの見本画像を共通の型 (進行中の 型 treemap・file-preview 含む) で作り、固定納品の値から生成した画像をサイトと note 無料部分の初稿で共用して目視確認する。確認後の画像配置・note 更新と note:figures の product-sample 判定が通り、本文画像台帳の product-untyped 上限 maxUntypedProductArticles (縮小専用) を下げる。

### [ESTAT-APPID-LOCAL-01] 手元の設定ファイルから e-Stat の appId が読めて、「CI 専任」と食い違う
タグ: [インフラ・計測] [種類:不具合] [実行:ユーザー] [起票:2026-11-10] [領域:サイト]

- **証拠 (2026-11-10・Mac)**: e-Stat の調査担当 agent が `.claude/scripts/lib/estat-catalog/api.mjs` の `getAppId()` (環境変数 `NEXT_PUBLIC_ESTAT_APP_ID`。`.env.local` と `apps/web/.env.development` を dotenv で読む) で getMetaInfo・getStatsData を呼べた。オーナーの方針は「e-Stat は CI」(`vars.NEXT_PUBLIC_ESTAT_APP_ID`)、既存カードの記録も「appId は CI にあり手元に無い」。どちらのファイルから値が入ったかは、設定ファイルの読み取りが権限で止められ未確認。
- **次**: オーナーがどちらのファイルに値があるかを確かめ、手元に置かないなら消す。残すなら「CI 専任」の記録と `getAppId()` の読み先を直す。
- **完了条件**: 手元で e-Stat を呼べるかどうかと規約・カードの記述が一致している。

### [MEDIA-WORKSPACE-ORPHAN-01] 画像のワークスペース検査が「Orphan image」で止まる
タグ: [インフラ・計測] [種類:不具合] [実行:対話] [起票:2026-11-10] [領域:SNS]

- **証拠 (2026-11-10・Mac)**: `node .claude/scripts/media/check-workspace.mjs` が `Orphan image: IMG-94a0f89d6b63cc51fcd8f506` で止まる。型の台帳を変更前の版へ戻しても同じ所で止まるので、型の台帳の変更とは関係が無い。
- **次**: 在庫索引が古いだけか (`npm run media:state:pull` で取り直して再実行)、品質記録に在庫から消えた画像が残っているかを切り分ける。
- **完了条件**: 原因を記録し、検査が通るか、残す理由を記録した。

### [BLOG-ENGEL-VALUE-MISMATCH-01] 公開記事「物価高で切り捨てられた品目」のエンゲル係数が家計調査の表と合わない
タグ: [コンテンツ品質] [種類:不具合] [実行:対話] [起票:2026-11-09] [領域:サイト]

- **事象 (2026-11-09)**: `blog:household-spending-before-after-inflation` の本文と図のエンゲル係数は 2019 年 27.0%・2024 年 27.8% だが、家計調査の用途分類 (`0002070003`、全国・二人以上の世帯) は 2019 年 25.7%・2024 年 28.3%。新しい下書き `engel-coefficient-rise-hardship-2025` を作る書き手が照合で見つけた。原因 (対象世帯・集計の違いか、算出の誤りか) は未調査。
- **次**: ① 記事の data/*.json と source を R2 の記事から読み、どの表・世帯・式で出した値かを確かめる ② 誤りなら `/blog-revise-fix` で本文と図を直し、critic を通す。
- **完了条件**: 記事の値が出典の表と一致するか、違う理由 (対象世帯など) が本文に書かれている。
- **進み (2026-11-09)**: 一次資料 (e-Stat 0002070003、二人以上・全国) で確かめ、記事の値は誤りだった (図の折れ線 25 点がほぼ実値と合わない)。正しい値 2019 年 25.7%・2024 年 28.3% で本文と図を直し、品目別の 2 図も 0004023605 の実値で作り直した改稿を `contents/blog/household-spending-before-after-inflation/` に用意 (gate blocker 0・critic PASS)。公開後に R2 の本文と図が改稿と一致することを確かめたら消してよい。残る指摘は `BLOG-KAKEI-PUBLISHED-FACT-FIX-01` の「残り」。
- **追記 (2026-11-09)**: 書き手の報告では、エンゲル係数の系の記事 (用途分類) とサイト内の食料の構成比 (品目分類) で、同じ年の値が 3 通りある。① の確認で、どの記事がどの分類を使うかを並べ、本文に分類を書く。

### [BLOG-GROUPED-BARS-VALUE-LABELS-01] ブログの縦棒グラフに値のラベルが無く、軸の目盛りで読ませている
タグ: [コンテンツ品質] [種類:改善] [実行:対話] [起票:2026-11-09] [領域:サイト]

- **事象 (2026-11-09)**: 下書き `engel-coefficient-rise-hardship-2025` の縦棒グラフ 6 枚と `kakei-number-one-city-rotation` の縦棒グラフは、棒に値が付かず軸の目盛りで読む形になる。原因は棒グラフの部品 `template-grouped-bars.ts` の仕様で、記事の側では直せない。統計画像の文字の規約 `.claude/rules/chart-image-copy.md` との整合を確かめる必要がある。
- **次**: ① `chart-image-copy.md` が縦棒の値ラベルと軸目盛りをどう定めているかを読む ② 部品に値ラベルを出す設定を足し、既存のブログの図の再生成が要るかを数える。
- **完了条件**: 縦棒グラフの値の読み方が規約と一致し、既存の図を作り直すかどうかの判断が記録されている。

### [BLOG-KAKEI-PUBLISHED-FACT-FIX-01] 公開済みのビール系の記事 2 本に、出典と合わない記述がある
タグ: [コンテンツ品質] [種類:不具合] [実行:対話] [起票:2026-11-09] [領域:サイト]

- **事象 (2026-11-09、下書き `beer-happoshu-liquor-tax-steps-household-response` の書き手が照合で発見)**: ① `blog:beer-vs-happoshu-shift` は「新ジャンルは家計調査で別区分」と書くが、統計局の品目分類では発泡酒の品目 (3X7) に新ジャンルを含む。② `blog:beer-peak-month-july-to-december` の「350ml換算154円」は、国税庁のビールの酒税 (350ml あたり 54.25 円、2026年10月) と合わない。いずれも書き手の照合で、呼び元は公式資料を未取得。
- **次**: ① 統計局の家計調査の品目分類 (用語の解説・収支項目分類) と国税庁の酒税の資料を取得して、2 本の該当箇所と照らす ② 誤りなら `/blog-revise-fix` で直し、critic を通す。
- **完了条件**: 2 本の該当箇所が公式資料と一致するか、記事の値の根拠が本文に書かれている。
- **進み (2026-11-09)**: 2 本とも誤りと確かめ、直した改稿を `contents/blog/<slug>/` に用意した (新ジャンルは品目 3X7 に入る。酒税は 350ml 換算 54.25 円・財務省 d08 と国税庁の手引き。2026 年 10 月の一本化は実施済みの時制へ)。同時に `blog:household-spending-before-after-inflation` (`BLOG-ENGEL-VALUE-MISMATCH-01`) も直した。3 本とも gate blocker 0・factual exit 0・critic PASS。公開 (published のまま develop へ push) で反映する。
- **残り (審査は通ったが残る指摘)**: ① (2026-11-09 済み・オーナー判断で題を本文の結論に合わせた。critic PASS・develop へ push 済み) ② household のコーヒー豆相場「約2倍」に出典が無い ③ household のビール値 (2019=10,720 / 2024=12,934) が beer-peak (0003343671 の月次合計 10,721 / 12,933) と 1 円ずれる (表の違いか丸めか未確認) ④ beer-vs-happoshu の焼酎との比較が一本化後も成り立つか未確認。

### [MUNI-THEME-INDEX-STAGING-01] 市区町村×テーマのページを、人口の多い市から段階的に検索に出す
タグ: [UI・UX] [種類:改善] [実行:対話] [起票:2026-11-09] [領域:サイト]

- **経緯**: `IA-REGION-THEME-01` (地域×テーマのページの 5 段) は 2026-11-09 に本番で完了を確かめて消した (全国テーマ 50 本が HTTP 200、代表 `/japan/information-industry` に推移の図・地域とテーマを選ぶパンくず・題名の地域)。残った段階的な公開をこのカードへ分けた。
- **決めてあること (2026-10-31 オーナー決定)**: 市区町村×テーマのページ (`/areas/県/cities/市/テーマ`、約 45,900) は最初 noindex・サイトマップ外で、人口の多い市から段階的に検索に出す。
- **次**: ① 最初に出す市の範囲 (人口の閾値) と 1 回の件数を決める ② その範囲だけ index・サイトマップへ入れる ③ 4 週の登録数と表示を記録してから次の範囲へ広げる。
- **停止条件**: 本番反映はオーナー承認の後。中身の薄いページ (値が少ない市) を検索に出さない。
- **完了条件**: 最初の範囲が検索に出て、4 週の登録数と表示が記録されている。


### [PAGE-UI-REVIEW-COVERAGE-01] ページ UI の週次確認で読むべき画面の 9 割が読まれず、新しい指摘の行き先が無い
タグ: [UI・UX] [種類:不具合] [実行:対話] [起票:2026-11-08] [領域:サイト]

- **観測 (2026-11-08・W44 週次レビュー)**: `data/page-quality/metrics/ui-review-latest.json` (監査 2026-10-30) は `reviewStatus: reviewed` だが、読んだ切り出しは 196 枚中 22 枚で、読み残し 63 画面・全部読めたページ 0。指摘 10 件と新しい機械検出 166 件 (Issue #1015) の振り分け先が無かった。
- **次**: 読み残しの原因 (エージェントの読む上限か、切り出しの枚数か) を `quality-suite-weekly.yml` の page-quality job のログで確かめ、全ページを読める形にする。指摘 10 件のうち直すものはテンプレートごとの `UI-FIX-*` カードへ分ける。
- **完了条件**: 次の週次確認で `readCoverage.unreadScreens` が 0 で、Issue #1015 の指摘がすべてカードか見送り理由に振り分けられている。

### [PAGE-QUALITY-ERRORS-01] ページ品質の週次監査の error 164 件を種類ごとに減らす
タグ: [UI・UX] [種類:不具合] [実行:対話] [起票:2026-11-08] [領域:サイト]

- **観測 (2026-11-06 の監査・Issue #1014)**: 対象 9,400 URL で error 164・warning 4,303 (HTML/RSC 肥大化・DOM 過剰・リンク重複・広告重複・構造化データ・画像切れ)。前の受け皿カード `PAGE-QUALITY-ERROR-BACKLOG-01` は既に無い。
- **次**: 管理画面 `/quality/page-audit` で error を種類別に数え、件数の多い 1 種類から原因を直す。
- **完了条件**: error が 0 になり、Issue #1014 が自動で閉じる。


### [BLOG-PHOTO-ROLLOUT-01] ブログの写真風の絵の残りとテーマの画像を片付ける
タグ: [コンテンツ品質] [種類:改善] [実行:対話] [検証:npm run test:image-pipeline] [起票:2026-11-07] [領域:サイト]

- **状態 (2026-11-07)**: 公開 848 本のうち 845 本を写真風 (`blog-photo-v2`) で main と R2 へ反映した。
- **残す 3 本**: `abortion-rate-prefecture-gap`・`early-neonatal-deaths-prefecture-gap`・`international-cooperation-volunteer-map` は旧来の絵のまま。題材に合う絵を決めてから差し替える。
- **未確認**: 人が全件を見ていない。Codex の一次判定だけの絵が大半で、主題と遠い絵が約 15 本ある。週次修復 (2026-11-14) の後も写真のまま残るかを確かめる。
- **テーマ 56 件**: 経路の登録と一覧カードの実装が先。規約の既定「カード画像は作らない」の変更が要る。
- **別件**: `.claude/scripts/themes/__tests__/tsunami-evacuation.test.mjs` が `data/metrics/*` を拡張子なしで読めず失敗し、push 前の検査を止める。
- **完了条件**: 3 本とテーマの扱いが決まり、週次修復の後も 845 本が変わらない。

### [RANKING-CARD-WEBP-UNUSED-01] ランキングカードの WebP 4,918 枚の読み手を確かめ、不要なら生成と週次修復を止める
タグ: [インフラ・計測] [種類:改善] [実行:対話] [検証:grep -rn "rankingThumbnailKeys" apps packages] [起票:2026-11-06] [領域:サイト]

- **事実**: `app/ranking/<key>/thumbnail-{light,dark}.webp` のキー関数 `rankingThumbnailKeys` を使うのは `generate-ogp-images.ts` だけで、`apps/web/src` からの参照は見つからなかった。本番 7 ページ (`/`・`/ranking`・`/blog`・ランキング詳細・ブログ詳細・`/themes`・`/category/population`) の HTML にも参照が無かった (2026-11-06)。読者が見るランキングの地図は `FeaturedRankings`・`RankingLinkCard` などがその場で描く SVG である。
- **未確認**: 外部や他の経路 (動的な組み立て) からの利用。検索で見つからなかっただけで、不在は確定していない。撤去の前に、作られた経緯を git log で確かめる。
- **やること**: ① 読み手の有無を確定する ② 無ければ `--type ranking-cards` の生成・週次の ogp-images job・`sync-snapshots.yml` のフック・ギャラリーの ranking-card タブを止め、`OGP-RANKING-CARD-BLOG-REPAIR-01` の ranking 分を閉じる ③ 経路 `ranking-card-motif` は対象の画像が表示されないので、続けるか取り下げるかを決める。
- **停止条件**: 読み手が見つかった場合は止めず、その表示面を確かめてから判断する。R2 の実体の削除はオーナーの判断を待つ。
- **完了条件**: 読み手の有無が確定し、不要なら生成・監査・規約 (`ogp-image-standards.md` のカード欄) から外れている。



### [GSC-COV-SITEMAP-20261107] GSC 是正: sitemap に無い未登録ページ 10 件を sitemap へ載せるか noindex にする

タグ: [インフラ・計測] [種類:改善] [実行:sweep] [検証:node .claude/scripts/gsc/build-coverage-queue.mjs --assert-handled data/gsc/coverage-remediation/backlog-batches/GSC-COV-SITEMAP-20261107.txt] [起票:2026-11-07] [領域:サイト]

- **自動起票**: `sync-coverage-backlog.mjs` が是正キュー (`data/gsc/coverage-remediation/coverage-remediation-queue.json`) の pending から作った。対象 URL の一覧は `data/gsc/coverage-remediation/backlog-batches/GSC-COV-SITEMAP-20261107.txt`。手順の正典は `.claude/skills/analytics/gsc-coverage-remediation/SKILL.md` Phase 4。
- **対象**:
  - https://stats47.jp/api/ranking/academic-achievement-test-average-rate/download?format=geojson&basis=original (HTTP 200 / GSC: crawled-not-indexed / sitemap 未掲載 / 最終クロール 2026-10-22)
  - https://stats47.jp/api/ranking/academic-achievement-test-average-rate/download?format=kml&basis=original (HTTP 200 / GSC: crawled-not-indexed / sitemap 未掲載 / 最終クロール 2026-10-22)
  - https://stats47.jp/api/ranking/accountant-annual-income/download?format=json (HTTP 200 / GSC: crawled-not-indexed / sitemap 未掲載 / 最終クロール 2026-10-24)
  - https://stats47.jp/api/ranking/adult-sandals-consumption-quantity/download?format=geojson&basis=original (HTTP 200 / GSC: crawled-not-indexed / sitemap 未掲載 / 最終クロール 2026-10-22)
  - https://stats47.jp/api/ranking/agricultural-output-per-employed-person/download?format=csv (HTTP 200 / GSC: crawled-not-indexed / sitemap 未掲載 / 最終クロール 2026-10-23)
  - https://stats47.jp/api/ranking/agriculture-forestry-fisheries-expenditure-ratio-pref-finance/download?format=csv&basis=original (HTTP 200 / GSC: crawled-not-indexed / sitemap 未掲載 / 最終クロール 2026-10-24)
  - https://stats47.jp/api/ranking/air-fare-consumption-expenditure/download?format=geojson&basis=original (HTTP 200 / GSC: crawled-not-indexed / sitemap 未掲載 / 最終クロール 2026-10-23)
  - https://stats47.jp/api/ranking/air-fare-consumption-expenditure/download?format=kml&basis=original (HTTP 200 / GSC: crawled-not-indexed / sitemap 未掲載 / 最終クロール 2026-10-23)
  - https://stats47.jp/api/ranking/alcohol-sales-per-adult-shochu/download?format=geojson&basis=original (HTTP 200 / GSC: crawled-not-indexed / sitemap 未掲載 / 最終クロール 2026-10-24)
  - https://stats47.jp/api/ranking/alcohol-sales-per-adult-shochu/download?format=kml&basis=original (HTTP 200 / GSC: crawled-not-indexed / sitemap 未掲載 / 最終クロール 2026-10-24)
- **次**: 200 を返すが sitemap に無く、Google も登録していない。sitemap の生成元 (`apps/web/src/app/sitemap.ts` と参照している config) で除外している理由を読み、`--probe <url>` で本文量を見て、検索に出す価値があれば sitemap へ載せ、薄い・重複なら noindex にする。同じ種類の URL は同じ規則で揃える。
- **記録**: 直した URL は `node .claude/scripts/gsc/build-coverage-queue.mjs --mark-in-progress <url> --note "<何を変えたか>"`、対応不要と判断した URL は `--mark-by-design <url> --note "<理由>"`。まとめて付けるときは `@data/gsc/coverage-remediation/backlog-batches/GSC-COV-SITEMAP-20261107.txt` を渡す。本番反映後は日次の URL Inspection が登録を確かめて done にする。
- **停止条件**: Indexing API を使わない。本番 deploy・R2 push をしない。判断できない URL は pending のまま残し、このカードを消さない。
- **完了条件**: 検証コマンドが exit 0 (全 URL が pending でなく、done 以外は理由 note 付き)。
### [MUNI-SIZE-RANKING-01] 1事業所あたり出荷額の市区町村ランキングを作る
タグ: [コンテンツ品質] [種類:改善] [実行:対話] [起票:2026-11-06] [領域:データ]

- **起点**: M01 の結論の中心の指標なのに、市区町村ランキングが無い。県の `manufacturing-shipment-amount-per-establishment` はある。事業所数の市区町村ランキングは公開済み (2026-11-06 に確認)。管理画面の問いの詳細が「なし」と示している。
- **やること**: ① 出荷額 (2023 年) と事業所数 (2024 年) の年のずれを許すかを決める ② 市区町村の値の作り方を `.claude/rules/metric-config-standards.md` の多段依存に沿って決める ③ R2 へ生成して公開する (本番の反映はオーナーの指示で) ④ 記事の案内を足す。1 人あたり出荷額の市区町村ランキングも同じ手順で判断する。
- **完了条件**: 問いの詳細の市区町村の欄にリンクが出て、本番で開ける。

### [CI-LEAD-TIME-01] デプロイの skip と指標生成の省略の効果を実測する
タグ: [インフラ・計測] [種類:改善] [実行:対話] [検証:gh run list --workflow deploy-workers.yml] [起票:2026-11-06] [領域:管理]

- **起点**: 2026-11-06 に `scope` job・`needsMetricMetadata`・`.husky/pre-push`・PR を開く時機の規則を入れた (`.claude/rules/branch-workflow.md`「待ち時間を増やさない運用」)。push から本番まで約 40 分が基準値で、skip の判定と PR の短縮は本番でまだ動いていない。
- **やること**: ① main へ入ったあと、本番に関係しない push で Deploy job が skip されることを run で確かめる ② 関係する push で必ずデプロイされることを確かめる ③ 指標に無関係な PR の Build Check が 10.9 分から約 6.7 分になるかを測る (算式: 10.9 − 生成 4.2) ④ PR 検査の cancel の割合が 21/34 から下がるかを 2 週間後に見る。
- **完了条件**: 4 点の実測を `.claude/rules/branch-workflow.md` に記録している。

### [CONTENT-TYPE-FIT-01] 型に合っていない記事の処置を決めて反映する
タグ: [コンテンツ品質] [種類:意思決定] [実行:対話] [検証:npm run content-types:check] [起票:2026-11-06] [領域:コンテンツ]

- **起点**: 2026-11-06 に全コンテンツを 4 型へ振り分け、機械の止めとルールを入れた (`.claude/rules/content-type-standards.md`)。処置の案は `data/content/type-fit-review.json` にあり、一覧は `/content/fit`。公開から 28 日に満たない 246 本はクリックで判定していない。
- **決定済み (撤去 3 本・実行待ち)**: `annual-sunshine-duration-vs-auto-liability-insurance-amount`・`shumai-consumption-expenditure-vs-jr-freight-shipment`・`road-length-per-km2-vs-residential-building-starts`。残す決定は 3 本。
- **やること**: ① 撤去 3 本の実行をオーナーに確認し、`GONE_BLOG_SLUGS` の手順で反映する (本文は `archive-blog-articles.mjs` で退避してから) ② 統合 9 本・書き直し 23 本の処置を決め、`decisions` に書く ③ note の用途別商品とサービスの型 (題名から仮置き) を確定する ④ URL の規則で参照型にした 420 本のうち、題名に「なぜ」を含む 187 本を参照型のままにしてよいかを確認する ⑤ 2026-10-28 以降に公開した相関の記事は、計測が 28 日を超えた週の `content-types:fit` で改めて判定する。
- **完了条件**: `/content/fit`が 0 件で、決定が台帳にあり、note の仮置きが確定している。

### [ISSUE-PRODUCT-LINK-01] 既存の商品に、起点の問いを指す項目を足す
タグ: [コンテンツ品質] [種類:改善] [実行:対話] [検証:npm run check-datasets] [起票:2026-11-06] [領域:商品]

- **起点**: 問いの台帳に `products` を足し、M01 から製造品出荷額の商品を直接指した (`/content/questions` の「企画した商品」)。実在は `check-datasets` が見る。Kindle は外部台帳の ID が無いので対象外のまま。
- **境界**: 指すのは社会の問いだけで、事業イシューマップと混ぜない。同じ指標を使うだけの商品は書かない。
- **やること**: 新しい商品は企画の時点で書く。既存の商品は根拠があるものだけ足す。Kindle を指す必要が出たら外部台帳に ID を足す。
- **完了条件**: 問いから企画した商品がすべて `products` で辿れる。

### [ANALYSIS-CYCLE-01] 問いの分析・図・記事・審査・公開後の評価を、視点の層で自動に回す
タグ: [コンテンツ品質] [種類:改善] [実行:対話] [検証:npm run issues:check] [起票:2026-11-06] [領域:サイト]

- **起点**: M01 は機械の検査と記事の審査を PASS したのに、問い「規模か生産性か」を「数か大きさか」に言い換えたまま答えていなかった。再分析と新しい審査で、重なりの等分・全体との比較の欠け・集計範囲の未確認が順に見つかった。原因は書く工程より前に「何を確かめるか」の点検が無いこと。
- **設計**: ① `analyses.json` に工程の状態と視点の台帳を持つ ② 視点の層 (問いの固定 / データの定義 / 分解 / 頑健性 / 基準比較 / 反例と地理 / 言えないこと / 図の読み方) ごとに「結果」か「対象外の理由」を必須にする ③ 分析の前に、結論を見せない別の agent が確かめる項目を先に出す ④ 機械で止められる項目は検査へ移す ⑤ 公開後の計測を問いの台帳へ戻す。
- **進み具合 (2026-11-06)**: 視点の台帳 `analysis-viewpoints.json`、`npm run analysis:check`、品質ゲートへの配線、`analysis-critic` を入れた。古い M01 は 14 件で止まり、結論を見ない点検は既知の見落としの大半を事前に挙げた。
- **進み具合 (2026-11-06 続き)**: H01 にも点検・反証・審査を通した。差し引きの見出し、増減の内訳、97.2% の幅が新しく分かり、本文を直した。
- **次**: ① 点検役の指示を足した版を測り直す ② 工程を順に呼ぶ実行役を作り、次の 1 問を最初から通す ③ 賃貸用など空き家の種類別の率の分母を指標定義に宣言する (賃貸用とその他の合計が空き家率を超える町が 10 ある) ④ 散布図の傾向線が直線だけなので、曲線の関係に区分ごとの中央値の線を足せるようにする (H01 の賃貸用以外の図)。
- **残る穴 (2026-11-07)**: 分析の図の `-lines.json`・`-scatter.json` は `chartType` を持ち、`generate-article-charts.ts` の振り分けに掛かる。`regenerate-blog-svgs.yml` を `dry_run=false` で流すと 4:5 の図が旧形式で上書きされうる (コードの読み取りで確認、実行はしていない)。生成器が `data-image-template` 付きの図を飛ばすようにする。
- **M01 の作り直し (2026-11-07)**: 再計算では数値が合っていたのに、問いへの答え方と図に問題が残っていた。段ごとの差に分けると結論が変わり、反証で 3 要素の配分が事業所数の裾切りに依存すると分かったので、人の厚みと 1 人あたり出荷額の 2 要素へ組み直した。点検役には「全体の割合が強い町にも当てはまるか」「結論が測定の裾切りに依存しないか」を確認項目へ足す。
- **実行役 (2026-11-07)**: `npm run analysis:run` (`/run-analysis`) を作り、M01・H01 を最終審査の手前まで通した。順番はコード、判断は Codex、最終審査だけ Claude。止めとして主張と幅の照合、反証の記録、審査と本文のハッシュ、図の名前の判定、視点 2 層を足した。作り直す前の M01 に反証を掛ける測り直しは、指示文を 5 つの必須試験にして段の試験 broken・測定の試験 weak を返した (fixture `__tests__/fixtures/m01-before.json`)。
- **残り**: ① 新しい問いは台帳の行と spec が要る。問いから spec を作る工程が無い ② 分析スクリプトを Codex が新規に書く経路は未検証 ③ NotebookLM の経路 (`--notebooks`) は未実行 ④ 1 次審査の Codex は 1 回 30〜40 万トークン (キャッシュ込み) で、読むファイルを絞ると減らせる ⑤ 反証の必須試験を複数の問いで測る。
- **図中心の実行役 (2026-11-07〜08)**: ブランチ `feat/analysis-runner-v2` (未 push)。データ棚卸し・数値照合・図の一覧画像・積み上げ/スロープ/箱ひげの型・書き手 (Claude) への小包・2 回目以降は確認だけの 1 次審査・反証の言い換えの反映・オーナーの方針 (`--direction`)・改稿の小包 (`--rewrite`) を足した。M01 の拡張は付加価値を主にする方針 (オーナー決定) で試し、主張 22 件まで作れた。ただし作業用フォルダが消え、M01 の拡張の分析スクリプトと手元の検証の計算は失われた。
- **次 (この順)**: ① 図の割り当てを「主張 1 件に 1 枚」から「読者が 1 枚で読む比較ごとに 1 枚」へ変え、値が 1 つだけの図・同じ行を分けた図を機械で止める。頑健性の確認は 1 枚にまとめる (試行では数字 1 つの棒が 18 枚並んだ) ② M01 の分析スクリプトを付加価値まで広げ直す。再現すべき値は人口 3 万人以上 754 町・付加価値の段差の人の厚み 88.8/68.0/75.1・一番上の段差の 95% の幅 67〜82・全体の分散 70.5/12.1/17.3・付加価値率の中央値 0.21・全規模センサスと 2024 年の比 1.74/1.10・1980→2020 の順位相関 0.70 と上位残留 116/182・2000→2023 の事業所 0.67 倍と出荷額 1.12 倍・3 万人未満 850 町の 70.3/68.4/65.0。散布図や積み上げを描けるよう町ごとの行も出力に持たせる。1980・2000 の出荷額は合併前の行で県の合計の検算が 1.9〜3.1% ずれるので別名で読む ③ `npm run analysis:run -- --analysis analysis:M01-factory-size --plan-figures --rewrite --direction "主な物差しは付加価値..."` で改稿の小包を作り、article-writer へ ④ 公開済みの M01・H01 の台帳の工程を `published` にする (2026-11-07 に本番 200 を確認済み)
- **止まる場面**: 設計の確認 / 公開の判断。
- **完了の判定**: 新しい問いが、人の指示なしで下書きと審査まで進み、`published: false` で止まる。M01 の失敗を再現した入力で、書く前に止まる。

### [H01-VACANT-ARTICLE-PUBLISH-01] H01 と M01 の記事を公開し、図の台帳と X の下書きを進める
タグ: [コンテンツ品質] [種類:制作] [実行:対話] [検証:npm run issues:figures] [起票:2026-11-06] [領域:サイト]

- **起点**: 記事 `vacant-houses-population-decline` と `manufacturing-strength-factory-size` は `contents/blog` に `published: false` で入っている。背景画像は 2026-11-06 に Codex で生成して取り込み済み。M01 は既存記事 `manufacturing-productivity` の更新をやめて新しい記事にした (既存記事は図データの欠落など過去の負債を直さないと再公開できない)。
- **次**: ① オーナーが下書き全文を確認する ② `published: true` にして develop へ push する ③ `npm run content:sync -- --from-r2` のあと、`figures.json` の `slug` を `page` へ置き換える ④ X の下書き 1195・1196 をオーナーの承認へ回す。
- **完了条件**: 2 本が本番で公開され、`issues:figures` の記事の行が消え、X の投稿の状態が台帳と一致している。

### [STRATEGY-ISSUE-MAP-PV-CHART-01] 広告の効率が出たら、事業イシューマップに月 ¥1 万へ要る PV のグラフを足す
タグ: [収益化] [種類:改善] [実行:対話] [検証:npm run test -w apps/admin] [起票:2026-11-05] [領域:戦略]

- **起点**: `/strategy/issue-map` は KPI `site-pageviews`・`ad-yield` から計算できるときだけグラフを載せる。2026-11-05 時点の `data/measurement-cycle/latest.json` は `ad-yield` の `value` が `null`（再開後 4 週のベースライン期間）で計算できないので、画面に載せていない。
- **次**: `ad-yield` に値が出たら、`site-pageviews` と合わせて必要 PV を `apps/admin/lib/issue-map.ts` で計算し、画面に足す。効率の値はマップに写さず KPI から読む。
- **完了条件**: `ad-yield` が値を持つときだけグラフが出て、`null` のときは出ないことをテストで固定している。

### [NOTE-PLAYWRIGHT-DIALOG-CRASH-01] note 公開中の Playwright 起動スクリプトがダイアログ処理の競合でブラウザごと落ちる
タグ: [インフラ・計測] [種類:改善] [実行:sweep] [起票:2026-11-05] [領域:商品]

- **証拠**: 2026-11-05 の note 公開で、`Page.handleJavaScriptDialog: No dialog is showing` の未処理例外によりブラウザが 1 回終了した。ログイン切れではなく、保存済みの下書きから再開して重複公開はなかった。
- **次**: ① 起動スクリプトでこの例外だけを無視し、ほかの例外は落とす ② 公開の手順で commit と push を `&&` でつなぎ、pre-commit で止まったときに push へ進まないようにする。
- **オーナー作業**: 題名なしの下書き `n0ae79d01a60b` と `nbb8ef52bd1ff` の削除。
- **完了条件**: 同じ例外で落ちない起動スクリプトがリポジトリにあり、手順の commit 失敗が公開の報告に現れる。

### [ADMIN-COMPETITOR-VIEW-01] 競合調査の結果を管理画面で見られるようにする
タグ: [収益化] [種類:改善] [実行:対話] [検証:npm run check-datasets && npm run docs:check] [起票:2026-11-05] [領域:商品]

- **起点**: 2026-11-05 のオーナー指示。競合調査の結果は `docs/00_プロジェクト管理/02_収益化戦略.md` §2.2 (表と読み取り) と `data/products/competitor-scan.csv` (観測した出品 271 行: BOOTH 48・ココナラ 217・note 3・ランサーズ 3。台帳 id `products.competitor-scan`) にあるが、CSV を読む画面が無い。
- **作るもの**: 管理画面の「戦略」の下に読み取り専用の競合の画面を足す (`/strategy/products` の「商品の台帳」から辿れるようにする)。
  - 販売面 (platform) ごとの件数と、関心の目安 (欲しいもの・評価数・スキ) の上位の表。価格・出品者・URL を出す。
  - 販売面・検索語での絞り込み。統計データ・地図・受注の区別がつくようにする (分類の列が要るなら CSV と台帳を同じ差分で直す)。
  - 観測日 (`observed_at`) が 2 つ以上になったら、同じ URL の関心の目安の増減を出す。
  - 画面の上に「関心の目安は販売数ではない」「ランサーズは人間確認で取れず Web 検索の範囲」の注記と、§2.2 へのリンクを置く。
- **実装の決まり**: CSV のパスは直書きせず `config/datasets.mjs` の id で引く (`datasetPath("products.competitor-scan")`)。UI は `.claude/rules/admin-ui.md` に従う。
- **関係**: 再調査の取得スクリプトはリポに無い (2026-11-05 の調査は一時領域で行い、残したのは結果の CSV だけ)。再調査を定期にするなら別カードで起票する。その場合も人間確認の突破や高頻度の取得はしない。
- **禁止**: 画面から CSV を書き換えない。本番デプロイはしない (管理画面はローカル)。
- **完了条件**: localhost の管理画面で競合の画面が開き、販売面ごとの表と注記が出る (スクリーンショットで確認)。`npm run check-datasets`・`npm run docs:check`・`npm run type-check` と管理画面のテストが通る。

### [ISSUE-LEDGER-TOP10-01] 問いの台帳から、最初に記事にする10本を選ぶ
タグ: [コンテンツ品質] [種類:意思決定] [実行:対話] [検証:npm run issues:check] [起票:2026-11-05] [領域:商品]

- **起点**: `data/content/issues.json`（大きな問い 169・小さな問い 9。県・市区町村のどこまで降りれば答えが出るか、答えの深さ relation / caveat / myth と収益の軸 `revenue` 付き）と `data/content/issue-links.json`。規約は `docs/01_技術設計/03_情報設計.md`「問いの台帳」
- **次**: ① 需要・答えが出る・意外性・更新性の4基準で上位10本に絞る（候補: H05 H11 A01 A10 D01 D12 D13 D03 B01 B02 B03 A12 C02 F10 F08 I09-1 H13 H14 I14 I08 J04 J09 J10 H01 M10） ② 選んだ問いの `dataNote` の統計が実在し、市区町村まで取れるかを1本ずつ当てる（台帳作成時は未確認） ③ `STRATEGY-DATA-PRODUCT-FIRST-01` と整合させる（問い記事＝入口、作り方・加工データ＝出口）

### [ISSUE-COVERAGE-GROW-01] 棚卸しで「紐づかないが読まれている」ページに問いを足し、「読まれていない」ページの扱いを決める
タグ: [コンテンツ品質] [種類:意思決定] [実行:対話] [検証:npm run issues:coverage] [起票:2026-11-05] [領域:商品]

- **起点**: `npm run issues:coverage`（2026-W40〜W43 の GSC と突き合わせ）。公開 4,372 ページのうち、紐づかないが読まれている 1,550
- **進み具合 (2026-11-05)**: 検索語と読まれているページから 20 本、白書 (NotebookLM の引用つき) から 6 本を足し、重なる 4 本は `C12`・`D13`・`F17`・`B12` へ検索語と根拠を移した。問いは 204 本、読まれているのに紐づかないページは 1,502。検索語の残りは `npm run issues:candidates` で見る。
- **次**: ① 読まれているのに紐づかないページの上位から、GSC の検索語を `queries` に持つ小さな問いを足す（最大のまとまりは家計調査の品目で、大きな問い K01〜K03 の下に入る） ② 上からの大きな問いを NotebookLM で白書から拾う（クラウドの環境は gh の認証が無く呼べないので Mac で） ③ 読まれていない 1,808 ページ（ranking 890・municipality-ranking 643・blog 226 ほか）を、統合・転送・検索除外・そのままのどれにするか本人が決める。自動では消さない

### [CONTENT-PUBLIC-WORKS-FISCAL-01] 「公共事業は無駄か」を、都道府県の土木費・普通建設事業費と財政指標の関係で確かめて記事にする
タグ: [コンテンツ品質] [種類:制作] [実行:対話] [起票:2026-11-07] [領域:サイト]

- **起点**: issue [#1245](https://github.com/uruhayato373/stats47/issues/1245)（切り口・一次資料）。既存のランキング `ordinary-construction-expenses-prefecture`・`local-bonds-prefecture`・`local-allocation-tax-prefecture` は絶対額なので、人口・歳出総額で割ってから比べる
- **確かめる関係（どれも未検証の仮説）**: ① 1人あたり普通建設事業費 × 財政力指数（財政力が弱い県ほど高い） ② 1990年代の普通建設事業費 × 今の実質公債費比率・将来負担比率（時間差のある正の相関） ③ 経常収支比率 × 土木費の構成比（負の相関） ④ 地方交付税への依存 × 普通建設事業費（正の相関）。面積あたりの値も並べ、面積・地形という共通の原因と見分ける
- **次**: ① 財政指標（財政力指数・実質公債費比率・将来負担比率・経常収支比率）と目的別歳出の土木費が都道府県別・年次で取れるかを、e-Stat の社会・人口統計体系と総務省「地方財政状況調査」で当てる ② 1990年代まで遡れる系列を確かめる ③ 取れた分で散布図を作り、記事の軸を1本に絞る（第一候補: 1990年代の1人あたり普通建設事業費 × 今の実質公債費比率）
- **注意**: 災害の年（東日本大震災後の岩手・宮城・福島など）は外れ値になるので複数年の平均で見る。都道府県の決算だけでは市町村の道路・下水道が抜ける。相関を因果として書かない
- **完了条件**: 仮説①〜④の判定（支持・棄却・データ不足）を根拠のデータと一緒に issue #1245 に残し、記事を1本公開する

### [STRATEGY-DATA-PRODUCT-FIRST-01] 記事の量より、独自の加工データの販売へ時間を移す
タグ: [収益化] [種類:意思決定] [実行:対話] [起票:2026-11-04] [領域:商品]

- **起点**: 2026-11-04 の3面方針で、stats47 の役割はデータ商品になった（vault `memos/20261104_decision_kazu-noteは軸を1つにして商品を広げる.md`）。データの解説はAIに置き換えられやすく、公的データの突合・GIS の可視化・継続更新は真似されにくい
- **次**: ① 🔴 高のカードをデータ商品に効くものとそれ以外に分ける ② 記事の量産のカードを止めるか下げるかを本人が決める ③ 製造品出荷額の商品 (EXP-007) の次に出すデータ商品の候補を挙げる
- **完了条件**: 配分の判断を backlog の並びに反映した。
- **禁止**: 判断の前にカードを消さない。

### [STRATEGY-ISSUE-MAP-01] 事業のイシューマップ（コンテンツの4型×3収益源）を管理画面で管理し、レビューのたびに更新する
タグ: [収益化] [種類:改善] [実行:対話] [検証:npm run check-datasets && npm run docs:check] [起票:2026-11-05] [領域:戦略] [進行中]

- **起点**: 2026-11-05 にオーナーと『イシューからはじめよ』の型（イシュー → 分解 → 絵コンテ → ストーリーライン）で事業戦略を分解した。図は Artifact `https://claude.ai/artifact/4v9AuVPHsSe2zYhJDSVqxu`（Version 5。オーナーだけが開ける。Claude は Artifact ツールの `action: "read"` で読める）。オーナー指示は「図はいったんこのままで、管理画面で管理し、プロジェクトを進める中で順次改善する」。
- **図の中身（Artifact が読めないときはこれを正本にする）**:
  - 主イシュー: stats47 のコンテンツは、どの型をどの収益源で回収すれば、運営費と改善の工数を賄えるか。
  - 仮説: 参照型で集め、ノウハウ型で売り、論文型で信頼を作る。売れた実績はノウハウ型だけで、統計の内容（教科書型・データ）で売れるかはこれから確かめる。
  - 行（コンテンツの型）: 参照型（ランキング・雑学）／教科書型（家計調査でわかること、財政指標の定義と各地の状況、調査ハブ）／論文型（Geo 分析など問いへの答え）／ノウハウ型（e-Stat × Claude Code の実務、再現手順・テンプレート）。
  - 列（収益源）: 広告（AdSense・アフィリエイト・物販）／コンテンツ販売（note・KDP）／データ販売（CSV・Excel・GeoJSON）。
  - 12 マスの評価: 参照×広告 ◎・参照×販売 ✕・参照×データ ○／教科書×広告 ○・教科書×販売 ○・教科書×データ ○（`ADMIN-STAT-PILOT-01` はここ）／論文×広告 ○・論文×販売 △・論文×データ ○／作り方×広告 △・作り方×販売 ◎・作り方×データ ○。
  - 前提の帯: 売上を内訳つきで測れているか（判定不能）、「届いた」と言える線（工数の時間単価は未決）、工数がイシューに向いているか。
  - 絵コンテ: 月 ¥1 万に要る PV（効率 ¥12〜22 / 1,000 PV で 45〜83 万 PV、今は約 5.2 万）と、マスごとの判定日の表。
  - 起点の悩み（マップ全体の出発点。新しい行・列ではない）: 統計は探すのに半日・加工にもう半日かかり、資料に使う図を作るのにも手間がかかる（オーナーの県庁職員の経験。`01_プロジェクト定義.md` のキャッチフレーズ）。この悩みを回収するマスは三つに分かれる。手間を減らすやり方を売る＝ノウハウ型×販売（売れた実績はここだけ）、加工済みのデータ・比較表を売る＝教科書型×データ（`ADMIN-STAT-PILOT-01`）、資料にそのまま使える図・CSV＝参照・教科書×データ。オーナーの経験は仮説を作る材料で、需要の証拠ではない（`04_ターゲットペルソナ.md` §5）。体験談そのものを物語の入口にするかは群 D の境界の決定に従う（`STRATEGY-SSOT-ALIGN-4X3-01`）。
  - ストーリーライン（本の 4 段）: ① 問題意識（起点の悩みを入口にする。そのうえで、集客は伸びたが収益は小さく、測れてもいない）→ ② 主張「参照型で集めて広告で回収し、ノウハウ型で売る。統計の内容で売れるかは 12 月末までに確かめる」とサブイシュー 3 本（1. 参照型は広告でしか回収できず量だけでは 1 桁足りない／2. 払う理由は時間が減ることで、今売れているのはノウハウ型だけ／3. 統計の内容で売れるかは 12 月末までの実験で白黒がつく）→ ③ サブイシューごとの仮説・根拠・絵コンテ・判定日（サブイシュー 2 の絵コンテは、資料作りを 1 業務に絞り（例: 類似団体と比べた人件費の 5 年推移）、従来の手順と stats47 + Claude Code を使った手順の作業時間を実測した表とする。時間の削減は実測値として示し、約束しない）→ ④ 意味合い（計器を戻す・参照型は広告の密度・ノウハウ型の 1 商品・統計の内容は判定日で決める）と分岐。
- **初期データに入れる注記（2026-11-05 の確認結果）**: ① 売れた note の件数と中身が文書ごとに食い違う（vault の販売実績台帳は 2 件 ¥600、`02_収益化戦略.md` §3.5 は 3 件 ¥900、`KNOWHOW-QA-BOARD-01` は Ollama オフライン 1 件を含む）。e-Stat × Claude Code の 2 件は確定。② `NOTE-FISCAL-PEER-SALES-01` の財政比較 2 本は「コードを書く層 / 書かない層」の比較で、ノウハウ型に近く、教科書型の販売の検証にはならない。③ KDP の 7〜9 月 ¥17,780（vault `memos/家計/収入_2026.csv`）は doboku-note と共用のアカウントで、stats47 の本の分が分かっていない。分かるまで「参照×販売 ✕」は保留扱いにする。
- **別物との区別**: `data/content/issues.json`（社会の問いの台帳＝記事の素材）とは別のものである。こちらは事業の問いを扱う。ID の体系と名前を分け（例: `biz:` の接頭辞、画面名は「事業イシューマップ」）、論文型の行から問いの台帳へリンクするだけにする。
- **次（実行順）**:
  ① データ: `data/business/issue-map.json` と `config/schema/business.issue-map.schema.json` を作り、`config/datasets.mjs` に 1 行足す（`business.pilot-board` と同じ形）。持つのは、起点の悩み・主イシュー・仮説・前提・行と列の定義・12 マス（評価・状態・根拠の一文・参照する台帳 ID）・ストーリーライン・注記。判定日と進み具合は improvements・pilot-board・experiments・backlog を ID で参照し、日付や状態を写さない。
  ② 画面: 管理画面に `/strategy/issue-map` を読み取り専用で足す（`.claude/rules/admin-ui.md` に従う）。12 マスの表（スマホでは行ごとに縦に積む）、前提の帯、参照先から解決した判定日の表、ストーリーラインの 4 段（問題意識・イシューとサブイシュー・サブイシューごとの仮説と絵コンテ・意味合い）を出す。必要 PV のグラフは KPI `site-pageviews`・`ad-yield` から計算できる場合だけ載せる。
  ③ 更新の仕組み: `/weekly-review` に「判定日を過ぎたマスの評価と状態を実測で更新する」段を、`/monthly-plan` に「主イシューと仮説を見直す」段を足す。評価の変更は `.claude/rules/evidence-based-judgment.md` に従い、変更の履歴は git に任せる。
  ④ 文書との接続: `docs/00_プロジェクト管理/02_収益化戦略.md` §2 に「今の主イシューと仮説の正本は `data/business/issue-map.json`」と 1 行で参照を足す（中身は写さない）。`ISSUE-PAYING-NEED-01` は教科書×データのマスの問いとしてマップから参照し、重複する記述をまとめる。
- **完了条件**: `npm run check-datasets`・`npm run docs:check`・`npm run type-check`・管理画面のテストが通る。localhost の管理画面で 12 マス・前提・判定日の表・ストーリーラインが表示される（スクリーンショットで確認）。週次レビューと月次計画のスキルに更新の段がある。収益化戦略から参照がある。
- **禁止**: 図の構成（4 型 × 3 収益源）をオーナーの判断なしに変えない。マスの評価を実測なしに変えない。マップの中身を戦略文書・月次計画へ写さない。管理画面はローカルなので本番デプロイはしない。

### [STRATEGY-SSOT-ALIGN-4X3-01] 事業イシューマップと食い違う stats47 の SSOT・agent・スキル・台帳を直す（85 件）
タグ: [エージェント・SSOT] [種類:改善] [実行:対話] [検証:npm run docs:check] [起票:2026-11-05] [領域:戦略]

- **起点**: 2026-11-05 に `STRATEGY-ISSUE-MAP-01` の見方と stats47 の記述を読み取りだけで突き合わせ、85 件の食い違いを見つけた（vault 側の 56 件は vault のセッションで扱う）。下の行番号は 2026-11-05 時点のもの。
- **依存**: 次の 2 点はオーナーが vault で決める（決定記録は未作成）。決まるまで群 D には触らない。(a) 境界の案「統計が無くても成り立つ記事は kazu-note。サイト運営・開発のノウハウは売らない」。(b) kazu-note を収益の面にするか、物語の入口に戻すか（公務員ノートの判定日 12-10）。
- **群（原因ごとに直すと個別の行がまとめて片づく）**:
  - A. 「本線は行政実務向け商品（用途別 Excel）」が現役: `02_収益化戦略.md` 26・77-90・112・117-121・214-216・439-454 行、`01_プロジェクト定義.md` 41-42・264-269 行、`03_マーケティング戦略.md` 25・53・184 行、`.claude/memory/MEMORY.md` 21 行、`.claude/memory/project_monetization_contract.md` 57 行、`packages/data-configs/src/business-plan/catalog.ts` 597 行、backlog の `ADMIN-STAT-PILOT-01`。
  - B. ノウハウ型が副次・未選定の扱い: `02_収益化戦略.md` 334・424 行、`data/business/pilot-board.json` 29 行（「商品が未選定で未公開」だが販売中の記事がある）、`data/business/experiments.json`（ノウハウ型の打ち手が無い）、`data/products/product-strategy.json` 76-83 行（¥300 の売上を「指標の読み解き」の群に計上）、`data/products/PRODUCT-LEDGER.md`、backlog の `KNOWHOW-PRODUCT-PILOT-01`。
  - C. stats47 の役割が「データ商品」: backlog の `STRATEGY-DATA-PRODUCT-FIRST-01`（vault 11-04 の決定が起点。その決定自体が vault 11-02 の決定と食い違っている）。
  - D. 公務員 AI と境界: `.claude/skills/note/koumuin-claude-code/MAGAZINE.md` 25 行・`INDEX.md` 24 行、`data/note/magazines.json` 5-8 行、`docs/30_note記事企画/note戦略.md` 241 行、`04_ターゲットペルソナ.md` 27 行、backlog の `KNOWHOW-PRODUCT-PILOT-01` のテーマ候補 (D)・導線案 (c)、`NOTE-PRODUCT-LADDER-01` の段 4。
  - E. 参照型を売る前提（KDP の雑学本）: `02_収益化戦略.md` 314・463 行、backlog の `KDP-EXPANSION-01`、`.claude/agents/kindle-publisher.md` 10-12・28 行、`.claude/rules/coconala-product-standards.md` 124・276 行、`project_monetization_contract.md` 64 行。KDP の本ごとの売上が分かるまで保留する。
  - F. 「note の有料はノウハウだけ」が教科書型・データの有料を締め出す: `02_収益化戦略.md` 203-206 行（同じ文書の §3.4 でデータ集の価格実験が進行中）、`note戦略.md` 13-14 行、backlog の `NOTE-FREE-DEFAULT-01`。
  - G. 「売れない原因は導線、新商品は作らない」の判断: `02_収益化戦略.md` 344-345 行、`experiments.json` 876 行（EXP-013）、`product-strategy.json` 159 行、backlog の `PRODUCT-REFERRAL-MEASURE-01`。
  - H. 分類軸が 4×3 と対応しない: `catalog.ts` 155・474・1068 行（5 収益レイヤー・paid-purchases の合算）、`pilot-board.json` 8・24・39 行（雑学の回収経路 3 つ）、`02_収益化戦略.md` §3.5・§3.6、`04_ターゲットペルソナ.md` 13・23 行、`.claude/skills/management/monetization-strategy/SKILL.md` 38-48 行、`.claude/agents/note-critic.md`・`.claude/skills/note/design-note-structure/SKILL.md`（ノウハウ型の制作・レビューの担当が無い）、`apps/admin/app/strategy/pilots/page.tsx` 13 行、`.claude/shared-policy/application.json`。
  - I. ココナラ撤退の残り: agent・skill・規約・管理画面・出品台帳・`CLAUDE.md`・`revenue.ts`・`catalog.ts` は 2026-11-08 (`c5e9ee3a1`) に削除・改名済み。残りは `02_収益化戦略.md` の受注チャネル (地図・資料の受注を再開するか) の判断と、backlog の `NOTE-PRODUCT-LADDER-01` 段 5。
  - J. 数字・状態・ID の食い違い: `.claude/memory/project_product_ledger.md` 12 行（価格は ¥980・¥2,980 に再変更済み）、`experiments.json` 593 行（EXP-007 が proposed のまま）、`01_プロジェクト定義.md` 252 行と `03_マーケティング戦略.md` 23 行（AdSense は 10-11 に再開済み）、`02_収益化戦略.md` 349 行（旧 ID `NOTE-FISCAL-PEER-PUBLISH-01`）、backlog の `MUNI-DATA-PRODUCT-PILOT-01`（「売上 2 件」）、`.claude/todo/improvements.md` 25 行（財政比較 2 本の比較の設計）。
  - K. 計画にノウハウ型が無い: `.claude/todo/monthly.md` 8-13・79 行。
- **次（実行順）**: ① 群 I と群 J は判断が要らないので先にまとめて直す（agent・スキルの削除や統合は `check-agent-skill-consistency.cjs` を通す）。② 群 A・B・C・F・G は `02_収益化戦略.md` の改訂案（§2.1・§2.3・§3.3〜§3.6・§5 の領域表・§6）をオーナーに出し、承認後に反映する。続けて `MEMORY.md`・`project_monetization_contract.md`・01・03・04 を合わせる。③ 群 H は `catalog.ts` の `revenueLayers` と `pilot-board.json` の `route` を 3 収益源に寄せるかをオーナーと決める（機械の正典なので schema・テスト・管理画面を同じ差分で直す）。④ 群 E は KDP の本ごとの売上を確かめてから。⑤ 群 D は境界の決定後。⑥ 群 K は次の `/monthly-plan` で扱う。
- **完了条件**: 各群の記述がイシューマップの見方と矛盾しない。`npm run docs:check`・`npm run check-datasets`・`npm run type-check`・`npm run business-plan:check` が通る。収益化戦略の方針の段落の変更はオーナーの承認を得ている。
- **禁止**: vault の決定記録（`memos/*decision*`）を書き換えない。オーナーの承認なしに収益化戦略の方針の段落を変えない。境界が決まる前に公務員 AI 関連の商品・マガジンを消さない。

### [METRIC-DEFINITION-GAPS-BOOK-01] 書籍の執筆で見つかった指標の定義の欠けと公開データの抜けを埋める
タグ: [コンテンツ品質] [種類:不具合] [実行:対話] [起票:2026-11-04] [領域:データ]

- **起点 (2026-11-04)**: K-S1-13 の執筆と審査で、次が見つかった。
- **定義が無い**: `dual-income-household-ratio` (分母が分からず書籍で使えなかった)・`nursing-home-capacity-per-1000-65plus` (施設の種別が無い)・`unemployment-rate` ほか。年平均気温と雪日数の観測地点が config に無い。雪日数は 20 都道府県しか値が無い。
- **県庁所在市の値**: `private-rental-housing-rent-per-3-3m2` と可処分所得は県庁所在市の値なのに県名で出ている。東京が区部かは未確認。
- **公開データの抜け**: `population-aged-0-5` は `isActive:true` なのに R2 が 404。公開 R2 は Python 標準の urllib だと 403 (User-Agent が要る)。
- **次**: 指標ごとに e-Stat の定義を読んで metric に書き、ページの表記を直す。
- **完了条件**: 上の指標の定義がページで読め、`population-aged-0-5` が 200 を返すか非公開になっている。

### [MUNI-MANUFACTURING-VALUE-CHECK-01] 製造品出荷額の市区町村データの疑わしい値と年の表記を直す
タグ: [コンテンツ品質] [種類:不具合] [実行:対話] [起票:2026-11-04] [領域:データ]

- **起点 (2026-11-04)**: データ商品 (`MUNI-DATA-PRODUCT-PILOT-01`) の検算で見つかった。値は e-Stat の API と全行で差 0 件で、取り込みの誤りではない。
- **川崎市 1986 年 (原因がほぼ確定)**: 社人統の川崎区 5,840,455 は誤り。川崎市公表の工業統計 (`https://www.city.kawasaki.jp/170/cmsfiles/contents/0000025/25684/1986-3hyou.xls` の第 3 表、取得 2026-11-04) は川崎区 3,066,860・全市 5,842,937 百万円。社人統の値は全市の値とほぼ同じで、県計の超過 2,773,565 が他の 6 区の合計 2,773,564 と 1 だけ違う。[推定] 川崎区の欄に市全体の値が入り、社人統の川崎市 8,614,018 は区の合計なので全市の値が二重になった。e-Stat への問い合わせは未実施。
- **川崎市 1983 年**: 市の値 6,471,684 が低い。公表値 6,528,504、区の合計 6,530,113 で、誤りは市の欄。区の値は公表値と合う。県計も区の合計の側と合う。
- **全年の照合**: 川崎市の統計 (`contents/0000053/53475/kogyo.xls`) と市・7 区を 1980〜2019 年で比べ、差が 0.5% と 300 百万円の両方を超えたのは 13 件。大きいのは上の 2 年と 1980 年の川崎区 +60,137・全市 +62,183 (1.0%)。1980 年は県計と矛盾しないので、公表の時点や範囲の違いの可能性があり、原因は未確定。
- **空欄**: 1998〜99 年の豊田市は e-Stat の記号が「-」(データが得られないもの)。1987 年の札幌市・特別区部・那覇市、1994 年の芦屋市は R2 に行が無く、記号の控えにも無い。e-Stat の API に行があるかは未確認 (照合は R2 の行だけを見た。appId は CI にあり手元に無い)。1987 年の区の合計は特別区 12,058,521 (23 区)、札幌は 6 区で 1 区足りない。
- **年の表記**: 本番の市区町村ランキングは `【2023年度】` と出ていて誤り。metric は `yearFormat: "calendar"` と宣言済みで、県のランキングの題は `2023年`。R2 の `cities.json` の yearName が全行「YYYY年度」で、ページがそれをそのまま使う。県のランキングの FAQ にも「2023年度の1位」が残る。
- **済み (2026-11-04)**: オーナー決定で 1986・1983 年の川崎市を川崎市の公表値へ置き換えた。`MetricConfig.cityValueCorrections` (`data/metrics/defaults/kawasaki-manufacturing-corrections.ts`) が取り込みのたびに当て、元の表の値が変わると止まる。同じ値の `manufacturing-shipment` も同じ補正を持ち、yearFormat を calendar に直した。note に置き換えを明記した。
- **済み (2026-11-04)**: 再取り込みで R2・本番の市区町村ランキング (全国・神奈川県) に補正値と「2023年」が出た。手元の商品データも作り直した。明示の `municipality` は県の値も持つ指標を通すようにし (`data-refresh.yml`)、実測は run 41787144027 で処理約 8 分、県の values.json は変わらなかった。
- **note (2026-11-04)**: 公開中の記事の ZIP を `muni-manufacturing-shipment-data-v2.zip` へ差し替え、無料部分の川崎市の説明を直した。有料ラインも見出し「ダウンロード」の直前へ直した。所有者画面の添付は 1 件で、非ログインに ZIP 名は無い。見出しと添付の間に空行が数行残っている。
- **年の表記の棚卸し (2026-11-04)**: 有効な指標の R2 3,201 ファイルと yearFormat を照合した。暦年なのに「年度」は 369 指標 (412 ファイル。cities.json 47・values.json 365)、公開中の市区町村ランキングは 44 指標。原因は 2026-10-21 の yearFormat の修正 (`a21c4586a`・`5e72aa59a`) のあと再取り込みが無いこと。年度の指標の不一致 21 件は「年度末」など説明つきの年名で誤りではない。
- **次**: ① 2026-11-05 12:00 JST の月次の全取り込みの成否を見て、e-Stat の 312 ファイルが 0 件になったか同じ照合で確かめる。残れば 50 件以下ずつ取り込み直す。external の 100 ファイルは月次の `relabelPublishedYearNames` が直す。main へ入ってから動く ② 1987 年の行を CI の e-Stat 照会で確かめる ③ 必要なら e-Stat へ問い合わせる ④ develop の変更を main へ入れる。
- **補足**: この Mac の gdal は `libjxl.0.11.dylib` が無く ogrinfo が起動しない (brew の再リンクが要る)。
- **停止条件・禁止**: 補正の定義の外で値を手で直さない。購入者がいる ZIP の差し替えは note への外部変更なので事前に確認する。
- **完了条件**: 川崎市と空欄の原因が記録され、年の表記と注記がサイトと商品で一致している。

### [PRICE-DATA-PACK-REVIEW-01] データ集の価格実験を 2026-12-30 に判定し、導線を増やす
タグ: [収益化] [種類:改善] [実行:対話] [起票:2026-11-04] [期日:2026-12-30] [領域:商品]

- **起点 (2026-11-04 オーナー決定)**: note のデータ集 13 本を値下げした (テーマ別 12 本 ¥980・総合集 ¥2,980。同日に ¥1,980・¥4,980 から再変更)。実験の定義と変更の履歴は `data/products/price-history.json` の `PRICE-DATA-PACK-2026-11`、判断の記録は `data/products/product-strategy.json`、集計は `data/products/PRODUCT-LEDGER.md` と管理画面の「商品の台帳」。
- **分かっていること**: 値下げ前の 2026-10 はテーマ別 12 本で計 93 PV、総合集 14 PV、売上 ¥0。データ集の公開は 10 月 24〜25 日で、観測は約 1 週間。10 月 31 日以降の売上は未確認で、次の土曜の記録で読む。買った人がいた場合の対応は未決。
- **次**: ① 導線: 有料データ集の閲覧を増やす (`PRODUCT-REFERRAL-MEASURE-01` と合わせ、ランキングと記事の案内のクリックを週次で読む) ② 判定日に基準どおり続ける・変える・止めるを決め、`price-history.json` の `status`・`result` と `product-strategy.json` の `decisions` に書く ③ 実験の判定後に、有料の下書き 54 本を公開するかを 1 本ずつ決める。
- **同時の変更 (2026-11-04)**: 同じ日に note の 13 本の題へ「都道府県別」「CSV・Excel」などの検索語を入れた (本文・価格は不変)。判定では価格の効果と題の効果を分けられない。
- **判定**: 導線を入れてから 8 週で 5 件以上売れたら続ける。1〜4 件なら価格か見せ方を 1 回だけ変える。0 件ならデータの単体販売を止める。基準の 5 件は仮の値で、月 1,000 PV 弱の閲覧を前提にしている。期日の 2026-12-30 は導線が今日入った場合の日付なので、導線が遅れたら後ろへずらす。旧価格の購入者の有無は未確認。
- **停止条件・禁止**: 判定まで価格を重ねて変えない (前後を比べられなくなる)。価格を変えるときは `update-note-price.mjs` を使い、先に履歴へ書く。不安を煽る訴求で閲覧を増やさない。
- **完了条件**: 判定の結果と次の価格が履歴と決定の記録にあり、商品の台帳に反映されている。

### [AD-LAYOUT-WEEKLY-CAPTURE-01] 広告の配置の撮影を土曜ランナーへ組み込み、本番の配置を週 1 回記録する
タグ: [収益化] [種類:改善] [実行:対話] [起票:2026-11-04] [領域:アフィリエイト]

- **起点 (2026-11-04 オーナー)**: 管理画面の「広告の配置」(`/affiliate/layout`) で配置を確認したいが、撮影は手動で時間もかかる。夜間か週次の仕組みに載せたい。
- **決めた方向 (推奨。オーナーの確定待ち)**: 毎晩ではなく週 1 回、土曜ランナー (`scripts/scheduled/weekly-saturday.sh`) の段に足して本番 (`https://stats47.jp`) を撮る。配置が変わるのはコードを変えたときだけで、土曜の週次レビューで見れば間に合うため。開発サーバーが要らず、デプロイ後の実際の姿を確かめられる。
- **分かっていること (2026-11-04 実測)**:
  - 撮影は 21 種類 × 3 幅 = 63 枚で、開発サーバー相手に約 7 分 (11-04 の各枚の時刻の幅)、1 回 43 MB。`.local/ad-layout/<日付>/` に書く (git にも R2 にも置かない)。
  - 撮影は `--base-url` で本番を指定できる。本番では `ins.adsbygoogle` を検出する作りだが、本番を実際に撮ったことはまだ無い。
  - 管理画面は `.local/` の最新の日付を読むので、土曜ランナーは専用 clone ではなく作業フォルダへ書く必要がある (`fetch-note-metrics.sh`・`scout-asp-weekly.sh` と同じ扱い)。
  - 撮影は同意を断る Cookie を付けて開くが、それだけで広告・計測の通信が止まるかは確かめていない。
- **次 (実行順)**:
  1. `capture-ad-layout.ts` に、本番を撮るときに AdSense・GA4・A8 などの計測の通信を止める処理を足す (`context.route`)。自動の閲覧が AdSense の表示や `ad_impression` の記録に混ざらないようにするため。
  2. 本番で 1 ページ・1 幅だけ撮り、広告の通信が 0 件で、枠とユニットと案件名が開発サーバーの撮影と同じように取れることを確かめる。通信を止めると枠の高さが潰れて見つからない可能性があるので、ここで見る。
  3. 全 63 枚を本番で 1 回撮り、管理画面の警告を読む。開発サーバーとの差が出たら原因を分ける。
  4. `weekly-saturday.sh` に段を足す (冒頭のコメントの段の説明も直す)。古い撮影は直近 8 回だけ残して消す (43 MB × 52 週 ≒ 2.2 GB を防ぐ)。落ちた回は既存の `failed` の仕組みで週次レビューの Phase 0b に出る。
  5. 週次レビュー (`.claude/skills/management/weekly-review/SKILL.md`) の確認の表に「広告の配置」を足し、警告の件数を読むようにする。自動化の一覧 `docs/01_技術設計/06_自動化インベントリ.md` を更新する。
- **停止条件・禁止**: 通信を止める前に本番を撮らない。撮影のために本番へデプロイしない。launchd の plist は変えない (既存の土曜の 1 本の段として足す)。計測の通信を止められない場合は本番の撮影をやめ、Mac で開発サーバーを立てて撮る案へ戻してオーナーに聞く。
- **完了条件**: 土曜ランナーが 1 回本番を撮り切り、管理画面に新しい日付の 63 枚が出て、撮影中の広告・計測の通信が 0 件であることをログで示せ、週次レビューの手順に確認が入っている。

### [BLOG-FIGURE-REDRAW-REGRESSION-01] ブログの図の一括の描き直しで出た型の不具合 (出典欄が空・題の右端が切れる・年度が「年」) をサイト側で直す
タグ: [コンテンツ品質] [種類:不具合] [実行:対話] [起票:2026-11-03] [領域:データ]

- **事象 (2026-11-03・Kindle S1 v6 の差分レビューで発覚)**: R2 の `app/blog/<slug>/data/*.svg` の描き直し版に 3 種の型の不具合。① 新しい地図の型が「出典：」だけの行を出す (S1 の図だけで 12 枚: crab-expenditure-ranking-map・health-map・fiscal-strength-map・taiwan-guest-map・foreign-guests-map・foreign-guest-ratio-map・gas-ratio-map・gasoline-map・theft-map・convenience-map・black-tea-expenditure-map・engel-tilemap) ② 横幅 1080 の型の題 (72px) が長いと右端で切れる (「外国人延べ宿泊者数 都道府県ランキング」「コンビニエンスストア数ランキング」、教養娯楽費割合は「…ランキング（2024年）ランキング」と二重) ③ 年度の指標の副題が「2021年」「2022年」 (per-capita-income-gap の income-map・income-ranking、fiscal-health-50years-trend/fiscal-map) と、1 人当たりの図の題が総額と同じ「製造品出荷額等」(manufacturing-aichi-dominance/shipment-per-employee-ranking)。
- **本で当てた直し**: `figure-corrections.ts` の `fixFigureTemplate` (空の出典行を消す・題の字を縮める) と個別の校訂。サイトの図は直っていない。
- **次**: 描き直しの型 (地図・ランキング) で ① 出典名を指標の定義から入れる ② 題を幅に合わせて縮めるか折り返す ③ 副題の年に `yearFormat` を使う。直したら Kindle の対応する校訂を外す (置換元が消えると生成が止まるので同じ PR で)。
- **完了条件**: 全ブログの SVG で「出典：」だけの行 0・72px の題の推定幅超え 0・年度の指標の副題が「年度」。

### [NOTE-TO-KINDLE-GUIDE-01] note の記事から同じテーマの Kindle 本へ 1 行の案内を置き、UTM と販売台帳で 6 週測る
タグ: [収益化] [種類:改善] [実行:対話] [起票:2026-11-04] [領域:商品]

- **起点 (2026-11-03 オーナー)**: KDP を書くことでブログを磨き、note へ展開し、note の閲覧から KDP へ送る循環を作りたい。S1 12 冊の改訂版は 2026-11-03 に申請済み (KDP の審査中)。
- **現状 (2026-11-04 確認)**: `data/note` に Amazon への導線は 0 件。note の本文リンクは有料 note とサイトへ向いている。サイトの `/products` のカードは旧商品カード扱いで、ここを経由させない。note の閲覧の多い記事は財政 (`s47-fiscal`) と KML 記事。
- **やること**: ① note 記事と S1 の本をテーマで対応付ける表を作る (例: エンゲル係数・家計調査の記事 → K-S1-02 食卓、財政の記事 → K-S1-06 自治体財政)。閲覧の多い順に 5 本以内に絞る ② 本文の末尾に 1 行の案内 (書名と Amazon の URL。誇張なし・価格は書かない) を置く。URL は `config/inbound-utm.mjs` の規約に寄せ、Amazon 側で UTM が取れないことを前提に「note の記事 × ASIN」を note の外部リンクのクリック数 (note のダッシュボード) と KDP の販売台帳の月次で並べる ③ 対象記事と開始日を実験台帳に記録し、対象外の本を対照にする。
- **依存**: note の編集はログインが要るので人手 (`update-published-navigation.mjs --slug <key>`、全記事の一括変更はしない)。`PRODUCT-REFERRAL-MEASURE-01` の手順 3 (EXP-013 の UTM 反映) と同じ回に済ませる。KDP の改訂版が審査を通って販売中になってから始める。
- **停止条件・禁止**: アソシエイトリンクは `AMAZON-ASSOCIATE-PILOT-01` の判定まで使わない。6 週で販売が 0 なら「判定不能」と書き、案内を増やさない。
- **完了条件**: 対象記事 5 本以内に案内が入り、6 週の数字 (note の外部リンクのクリック・対象の本の販売と KENP、または判定不能とその理由) が実験台帳に記録された。

### [KINDLE-K-S1-02-RESEARCH-CYCLE-01] K-S1-02 (食卓) で、NotebookLM のディープリサーチの事実を一次資料で確かめ、ブログ→note→本の改訂を一巡させる
タグ: [コンテンツ品質] [種類:改善] [実行:対話] [起票:2026-11-04] [領域:商品]

- **起点 (2026-11-03 オーナー)**: ブログの書き直しだけでなく、ディープリサーチ・参考文献・データで本を厚くし、その過程でブログと note も磨く。最初の 1 冊は販売実績のある K-S1-02。
- **済み (2026-11-03)**: NotebookLM の notebook「stats47 research K-S1-02 食卓の地域差」(`.local/kindle-research/K-S1-02/nb.json`) にディープリサーチで 20 件を取り込み、品目ごとの地域差と要因を聞いた (`ask1.json`)。
- **注意**: 回答の主な出典「家計調査における品目別消費動向と地域差：食文化・社会構造・地理的要因に関する総合研究」は著者・掲載誌が不明で、AI 生成の記事の可能性がある。出典の残りも転載サイト・報道が中心。**回答をそのまま本・ブログに使わない**。
- **やること**: ① 回答から数値と要因の主張を 1 行ずつ抜き出す ② 数値は家計調査 (e-Stat の品目別・県庁所在市別の表、年と 2 人以上世帯を明記) で確かめ、要因の主張は自治体・業界団体・学術論文 (著者と掲載誌が分かるもの) が出典に付くものだけ残す。出典の取れない主張は捨てる ③ 残った事実で、対応するブログ記事に「なぜその地域で多いか」の段を足す (図の年と数値の年をそろえる) ④ 同じ内容を note の記事 1 本に展開する ⑤ 本は `build-book` で作り直し、差分レビュー・`verify-publishable` を通し、`kdp-publish --update` は再度オーナー承認を得てから。
- **完了条件**: 確かめた主張の一覧 (主張・一次資料・確かめた日・採否) が残り、ブログ・note・本の 3 か所に同じ事実が同じ出典で入った。改訂版の差分レビューが PASS。

### [UNIT-VOCAB-LARGE-UNPARSED-01] 単位の正典が読めない単位で 6 桁以上の 13 指標を、語彙に足すか単位を直す
タグ: [コンテンツ品質] [種類:改善] [実行:対話] [起票:2026-11-03] [領域:データ]

- **起点**: 台帳 `data/metrics/display-units/ledger.json` の `summary.unparsedLarge` (13 件: TJ・万MJ・kg/日・m³/日・円/m²・総トン・人/日)。単位が読めないので図の表示単位を寄せられず、桁の多い数字のまま描かれる。
- **やること**: 語彙に足せる単位 (TJ・総トン) は `unit-semantics.ts` に足して鏡を再生成する。分母つき (kg/日・円/m²) は分子だけ寄せてよいかを決める。
- **完了条件**: `unparsedLarge` が減り、`check:display-units` の baseline も同じ差分で縮む。

### [CONVENIENCE-STORE-SALES-SCALE-CHECK-01] コンビニ販売額の値の桁 (東京都 155,869百万円) が年間か月間かを確かめる
タグ: [コンテンツ品質] [種類:不具合] [実行:対話] [起票:2026-11-03] [領域:データ]

- **済み (2026-11-13・`3d5c87fd9`)**: e-Stat `0004032502` は年計・四半期・月次を 1 つの表に持ち、`timeScope` 未指定のため 2025 年 1 月の月間値 (東京都 155,869 百万円) を年の値として採っていた。単位と換算 0.01 は正しい。`source.timeScope` を `annual`、年を台帳の年計の範囲 2022〜2024 に直した。
- **残り (R2 への書き込みが要る)**: main へ入った後に CI で再取り込みする。配信中の値はそれまで月間値のまま。再取り込み後に、表示単位の台帳 (`data/metrics/display-units/ledger.json`・週次生成) と、値を含む SEO 文字列を作り直す (`seo-meta-facts` のゲートは R2 の配信値と照合するので、それまで値を載せられない)。
- **あわせて確かめる**: 百貨店・スーパー販売額 (`department-supermarket-sales`・`0004032493`) は台帳で 2025 年が 20 県分しか無い。同じ取り出し条件の問題かは未確認。
- **完了条件**: 配信中の値が年計になり、値・単位・説明・SEO 文字列が一致している。

### [GEO-STAT-BOX-STATTILE-01] Geo の検算の大きな数値を手組みの箱から共通の数値タイル (StatTile) にする
タグ: [UI・UX] [種類:不具合] [実行:sweep] [検証:npm run design-system:check -w apps/web] [起票:2026-11-03] [領域:サイト]

2026-11-03 の表の棚卸しで見つかった。`apps/web/src/features/geo-analysis/components/GeoSpatialEvidenceExplorer.tsx` (393 行付近の SurfaceCard の手組み) と
`apps/web/src/app/geo/data/[analysisSlug]/[prefCode]/page.tsx` (176 行付近の `dl` の `border p-3`) が、1 つの値を大きく見せる箱を自前で組んでいる。
規約 (ui-components.md「大きな数値は StatTile か STAT_VALUE_CLASS」) から外れている。
次: 2 か所を StatTile + StatTileGrid に置き換え、値・単位・補足の並びを数値タイルの台帳 (stat-tile) にそろえる。
完了条件: 2 か所に手組みの数値の箱が残らず、Geo の該当ページを localhost で見て値が同じ。geo-analysis の vitest が通る。

### [THEME-R2-FETCH-FANOUT-01] 指標の多いテーマの読み込みで R2 の取得がときどき落ちる
タグ: [インフラ・計測] [種類:不具合] [実行:対話] [起票:2026-11-03] [領域:サイト]

2026-11-03 にローカルの開発サーバーで `/areas/28000/household-food-spending` (133 指標) を開くと、`loadThemeData` が
`readRankingItemFromR2` と `readAllYearsRankingValuesFromR2` を指標ごとに同時に投げ (Promise.all の 129・130 番目など)、
数件が `fetch failed` で落ちて、その指標がページから黙って消えた (緑茶の 2 行。1 回はページ全体が 404)。本番 (Workers の R2 バインディング) で同じことが起きるかは未確認。
次: 本番のテーマページのログで同じ失敗が出ているかを確かめ、取得を数本ずつに絞る (同時数の上限) か、失敗した指標だけ 1 回取り直す。
- **観測 (2026-11-13・商品LP連携確認)**: `/themes/household-food-spending` がローカルで200を返すまで33.1秒。開発ログに多数の `app/japan/<metric>/series.json` 不在の警告が出た。P-14のLP→該当章→同じ作成例への往復は成功したが、初回は遷移待ち60秒を超えた。不在snapshotへの取得と並列数の影響を切り分け、リンクの正しさだけで性能の完了としない。
- **観測 (2026-11-03 午後)**: テーマだけでなく県・市区町村・全国のテーマのページでも、開発サーバーの R2 の取得が `ECONNRESET` で切られ (`fetch failed`、3 回取り直し)、1 ページの描画に 30〜87 秒かかった。描画の途中のエラーで Next の開発サーバーが「Fast Refresh had to perform a full reload due to a runtime error」で読み込み直しを繰り返し、ブラウザでページを開けない状態が続いた。開いたままの別タブ (テーマ・全国のページ) も同時に読み込んでいた。
完了条件: ローカルで同じページを 5 回続けて開き、133 指標が毎回そろう。本番の結果を記録した。

### [R2-WRITE-PENDING-DISPLACE-01] R2 書き込みの待ち枠を後続の実行が奪い、新規ランキングの OGP 生成が始まる前に取り消される
タグ: [インフラ・計測] [種類:不具合] [実行:対話] [起票:2026-11-02] [領域:データ]

- **証拠 (2026-11-02)**: develop への push で起動した `ranking-ogp-new-keys.yml` (run 41401652806) が、ジョブを 1 つも始めずに 15 秒で `cancelled` になった。concurrency group `r2-write` は待ち枠を 1 つしか持たず、後から来た R2 書き込みが待ちの実行を取り消すため。結果、家計調査の貯蓄・負債の 4 指標の OGP が作られないまま main へ出て、デプロイ後スモークが og:image 404 で落ちた (run 41406310986)。同じ罠は 2026-09-06 にブログ公開でも踏んでいる (memory `project_kakei_marketing_book_pipeline`)。今回は `gh run rerun 41401652806` で作り直した。
- **なぜ構造で直すか**: 取り消しは無言で、気づくのはデプロイ後スモークか本番の 404 になってから。手で再実行する運用では毎回同じ順に踏む。
- **次 (案)**: ① `r2-write` の workflow のうち、取りこぼすと困るもの (OGP の新規キー・ブログ公開) を、取り消されても後で拾う形にする。例: sync-snapshots の最後で「新規キーの OGP 欠落」を検査して足りない分を作る、または取り消し済みでジョブ未開始の r2-write run を一定間隔で再実行する見張りを置く ② main へのマージ前に、増えた既知キーの og:image が R2 にあるかを確かめる。
- **完了条件**: 待ち枠を奪われた OGP 生成が人手を介さず作り直され、デプロイ後スモークが新規キーの og:image で落ちない。

### [METRIC-DISPLAY-UNIT-WIRING-01] 指標の定義の表示単位 (display) を全画面で効かせる前に、71 指標の換算を監査する
タグ: [コンテンツ品質] [種類:不具合] [実行:対話] [起票:2026-11-02] [領域:サイト]

- **証拠 (2026-11-02)**: `display.displayUnit` を 71 指標 (うち換算倍率が 1 でないもの 63) が持つが、ランキングページ・注目カード・テーマのどれも読まず、元データの単位で表示している (可処分所得は設定が万円なのにページもカードも 637,958 円)。家計調査のハブでは実収入 (千円) と可処分所得 (円) が隣り合い単位がそろわない。
- **なぜ一斉に有効にしないか**: 設定が一度も画面に出ていないので、換算倍率・小数桁の正しさを誰も確かめていない。有効にすると誤りが全画面へ出る。
- **次**: ① 71 指標の `conversionFactor`・`displayUnit`・`decimalPlaces` を元の単位と照らして監査し、誤りを直す (検査を validate-metric-config に足す) ② 整形を 1 か所 (`@stats47/utils` の数値整形) にまとめ、ランキング・カード・テーマ・CSV が同じ関数を読む ③ ローカルで代表 5 指標を右ペインで確認。
- **関連 (2026-11-02)**: 立方メートルの単位の表記が指標の定義で混在している (全角 `ｍ3` 14 件・半角 `m3` 6 件。家計調査はプロパンガスの購入数量 1 件が `ｍ3`)。表示の整形をまとめるときに、単位の表記も 1 つに正規化する。
- **家計調査の月額の単位 (2026-11-02)**: 消費支出・実収入・世帯主収入 (千円) と可処分所得・配偶者の収入 (円) の不一致を、値の換算 (valueScale) で円にそろえかけたが、実収入はテーマ「実質収入」の旧グラフの移行契約 (series-ref-migration-contract: 旧グラフと値が一致するよう換算を禁じる) の対象で、PR #1211 の CI が止めたので戻した。この不一致は表示の層の換算 (このカード) で直す。
- **完了条件**: 監査済みの表示単位が全画面で同じ値・単位で出て、検査が誤った換算を止める。
- **統合 (2026-11-13)**: `RANKING-PAGE-DISPLAY-UNIT-01` をこのカードへ統合した。完了条件に含める: 監査済みの表示単位がランキングの表・カード・title・地図凡例・テーマ・CSV で同じ値・単位で出て、検査が誤った換算を止める。吸収分: 台帳 data/metrics/display-units/ledger.json で rescaled の指標のランキングページが台帳の単位 (億円・万人など) で表示され、resolveChartDisplayScale と指標定義の display を二重換算にしない関係を決める。71 指標の conversionFactor・displayUnit・decimalPlaces の監査と validate-metric-config への検査追加、立方メートル表記の正規化、家計調査の月額単位 (千円と円) の不一致を表示層で解消する。

### [NOTE-KAKEI-GYOZA-DRAFT-01] 家計調査の「餃子日本一は数え方で変わる」の note 原稿を台帳に登録し、カバーと本文の保存をそろえる
タグ: [SNS・マーケ] [種類:制作] [実行:対話] [起票:2026-11-02] [領域:SNS]

- **状態 (2026-11-02)**: 切り口「定義を読む」「都市の間で比べる」から作った無料記事の原稿が作業場 `docs/31_note記事原稿/b-kakei-gyoza-52cities/` (draft.md・chart-data.json。gitignore) にある。agent が記事台帳 `data/note/articles.json` に下書きとして登録したが、カバーの台帳 (`note:assets:validate` の cover catalog coverage) と本文の R2 保存が無く検査が落ちたため、登録は取り消した。同じ題材の記事は 2026-09-06 に公開済みなので、別稿としての差 (52 市・3 年平均・冷凍とテイクアウトの範囲) を確かめてから進める。
- **次**: ① 既存の公開記事との重複を確かめる ② `npm run note:article` の手順で台帳登録・本文保存・カバー作成をそろえる ③ note-critic の審査。
- **完了条件**: 台帳・カバー・本文の保存がそろい、`npm run note:assets:validate` が通る。公開はオーナーの承認後。

### [KINDLE-K-S1-02-STATUS-DRIFT-01] Kindle の K-S1-02 で、カタログの元定義と状態ファイルの状態・章数が食い違う
タグ: [収益化] [種類:不具合] [実行:sweep] [検証:npm run products:kindle:validate --workspace packages/product-factory] [起票:2026-11-02] [領域:商品]

- **証拠 (2026-11-02、kindle の agent の報告)**: `data/products/kindle-status.json` は K-S1-02 を generated・8 章としているが、`packages/product-factory/src/channels/kindle/book-catalog.ts` の元定義は planned・5 章。`withS1Fresh` が実行時に generated へ上書きするため、元定義の `status: "planned"` が読み手を誤らせる。章立ての切り口 ID はコメントにしか無く、`BookChapter` 型に欄が無い。
- **次**: 元定義の状態と章を実際に合わせるか、上書きの仕組みを元定義に寄せる。`BookChapter` に切り口 ID の欄を足し、切り口台帳と検査でつなぐ。
- **完了条件**: 元定義と状態ファイルが一致し、章ごとの切り口 ID が型付きで検査される。

### [ESTAT-PROVENANCE-GENERATED-STALE-01] 出典の生成物 estat-provenance.generated.json が指標定義より古い
タグ: [エージェント・SSOT] [種類:不具合] [実行:sweep] [検証:npx vitest run packages/data-configs/src/provenance] [起票:2026-11-02] [領域:データ]

- **証拠 (2026-11-02)**: `npx tsx packages/data-configs/scripts/ssds/build-estat-provenance.ts` で作り直すと、コミット済みの生成物と比べて `ssdsTableIds` から市区町村の SSDS の表 7 件 (0000020202・0000020205〜0000020210) が抜け、住宅・土地統計調査の表 13 件が `statsDataIdToSurvey` に加わる。作り直した状態では `broadcast-reception-contracts` など 2 指標の出典が合成 ID `ssds-src:放送受信契約数統計要覧` に落ち、`survey-master-consistency.test.ts` の縮小専用ラチェット (合成 id 55 種) が落ちる。家計調査のハブ統合ではこの作り直しを戻し、名前 3 か所だけを書き換えた。
- **次**: 市区町村の SSDS の表を `ssdsTableIds` に残す条件 (生成スクリプトの抽出条件) を確かめ、放送受信契約の原典を surveys.json と辞書へ登録してから作り直す。生成物の鮮度を検査する仕組みが無いので、`metrics:check` に入れるか決める。
- **完了条件**: 生成スクリプトの出力がコミット済みの生成物と一致し、合成 ID が増えない。
- **統合 (2026-11-13)**: `PROVENANCE-REGEN-STALE-01` をこのカードへ統合した。完了条件に含める: 生成スクリプトの出力がコミット済みの生成物と一致し、合成 ID が増えず survey-master-consistency 等の検査が通る (npm run test -w @stats47/data-configs と provenance の vitest)。吸収分: 再生成で ssdsTableIds が増減する 7 表の扱い (市区町村 SSDS 表を残す条件の確認) と statsDataIdToSurvey の増加分の扱いを決める。放送受信契約の原典を surveys.json と辞書へ登録する。生成物の鮮度検査を metrics:check に入れるか決める。

### [FACTUAL-CHECK-CROSS-METRIC-RANK-01] 事実確認が別系列の順位・値・差を記事の主指標と取り違える誤検知を直す
タグ: [コンテンツ品質] [種類:不具合] [実行:sweep] [検証:node --test .claude/scripts/lib/__tests__/article-factual-check.detection.test.mjs] [起票:2026-11-02] [領域:サイト]

- **症状 (2026-11-02 実測)**: 家計調査の記事の書き直しで、`article-factual-check.mjs` (quality-gate の VALUE_MISMATCH / rank 照合) が次を誤検知した。① 52 市・3 年平均の都市の順位 (`*-city-ranking.json`。浜松は 1 位) を、県庁所在市の単年値の県順位として照合した ② 「宇都宮との差は 1,000 円」のような差や増減を、県の値として照合した。製造業の記事 (2026-10-23) でも「県名の直後の工業地帯の合計値」を県の値と取り違えている (warning 3 件)。
- **次**: 照合の前に、data JSON ごとの系列 (label・都市/県・年・平均かどうか) を索引に持たせ、本文の数値をどの系列の主張かで振り分ける。差・増減・合計の語 (差・増え・減り・合計・平均) が直前にある数値は値の照合から外す。
- **追加の誤検知 (2026-11-02 の書き直しで再発)**: ③ 8 年平均の順位「平均 4.8 位」を県の順位として照合した (じゃがいもの記事では「位」を外して回避した) ④ 5 年平均の値を 2025 年の単年値と照合して VALUE_MISMATCH の警告が 7 件出た (チョコレートの記事)。平均・推移・差を書くほど誤検知が増え、書き手が表現を曲げている。
- **停止条件**: 見逃しを増やさない。既存の検出テスト (誤り 5 件中 5 件検出) を落とさない。
- **完了条件**: 上の 3 種を再現する非検出テストと、本物の取り違えを検出するテストの両方が通る。

### [BLOG-DATA-PRIOR-YEAR-KEEP-01] ブログの data JSON に前年までの値を残し、年の推移を書き直しのたびに失わないようにする
タグ: [コンテンツ品質] [種類:改善] [実行:対話] [起票:2026-11-02] [領域:サイト]

- **症状 (2026-11-02)**: `refresh-article-data-years.mjs --apply` は図の data JSON を最新年の値で上書きし、前年の値を残さない。家計調査の記事を 2025 年へ書き直したとき、「2024 年は何位だったか」を本文に書くには、e-Stat から別の接地器 (`fetch-kakei-city-average.mjs` の byYear や、小麦粉の順位推移の JSON) を個別に作る必要があった。
- **次**: 取り直しのとき旧年の値を同じ basename の `*-history.json` (or data JSON の `previousYears`) に移す案と、R2 の metric 値 (全年を持つ) から推移を作る接地器を共通化する案を比べ、後者で済むなら前者は作らない。
- **完了条件**: 書き直しで年を進めた記事が、追加の手作業なしに前年との比較の図か値を持てる。

### [BUZZ-MAP-CONTENT-ROLLOUT-01] バズ地図の候補160件がブログ・note・SNSにほとんど展開されていない
タグ: [SNS・マーケ] [種類:改善] [実行:対話] [起票:2026-11-02] [領域:SNS]

- **実測 (2026-11-02)**: `data/sns/buzz-map-catalog.json` の curated 160 件のうち、着地先が実在するのは15件（ブログ7・ランキング2・テーマ4ほか）。ブログ7件はどれも 2026-03〜06 公開の既存記事を当てたもので、バズ地図から新しく書いた記事は0件。`create-blog` 69件中62件は記事なし。note 記事台帳 (`data/note/articles.json`) に候補とつながる記事は0件。SNS は posts.json の domain=buzz-map が下書き11件（IG6・X5）で投稿0件。候補台帳の `generatedAt` が 2026-08-28 のままで、`landingReadiness` は当時の値。
- **① 台帳の作り直し (2026-11-02 済)**: `generatedAt` 2026-11-02。curated 160件の着地先は live 15件のままで、変化は気候4件 (blocked→needs-content) だけ。型 A〜F・flow は型台帳の「地図（実際の形）」に統合済み (`buzz-map-standards.md` §1)。
- **② 候補 (2026-11-02 選定・オーナー判断待ち)**: P0・`feasibility=now`・ライセンス allowed・記事なしから2本。
  - ブログ: `children-more-than-elderly-muni`「15歳未満が65歳以上より多い街」。R2 `cities.json` で実測すると該当自治体は 1980年1,776 → 2000年375 → 2010年45 → 2015年14 → 2020年6（長久手市・新宮町・粕屋町・南風原町・御蔵島村・小笠原村）→ 2025年0。二値1枚ではなく年ごとの地図（型B=塗りの時系列）で「消えるまで」を見せる構成にする。**2025年値は別表 `0004065933` の補完なので、定義の連続性を確かめるまで「0になった」と書かない。**
  - note: 食の東西境界（`natto-east-west-boundary`・`udon-soba-territory`・`mayonnaise-vs-sauce`・`meat-preference-map`）の4枚を1記事に。家計調査は県庁所在市の値（都道府県単位の `values.json` のみ、市区町村データなし）。
- **次・実行順**: ③オーナーが2本の採否を決める → ブログは2025年値の定義確認 → 地図生成 → 記事、note は4枚の地図 → 記事 ④下書き11件の投稿可否を決める（予約・投稿は承認後）。
- **停止条件**: ライセンス `review-required` の候補（26件）は確認前に公開しない。投稿・公開・R2 反映はオーナー承認後。
- **完了条件**: 候補台帳が最新の公開物で判定し直され、P0 候補のうち少なくとも1件がブログまたは note の記事として公開され、その地図画像が SNS に投稿されている。

### [IMAGE-PUBLISHER-REMOVAL-01] 統計画像の生成経路から発行元表記（stats47・stats47.jp）を外し、地図をタイル・実形状の2型へ寄せる
タグ: [SNS・マーケ] [種類:改善] [実行:対話] [起票:2026-11-02] [領域:SNS]

- **起点 (2026-11-02 オーナー決定)**: 統計画像に発行元・透かしを入れない（`chart-image-copy.md`）。地図はタイルマップと実形状の地図（塗り・点・線のレイヤー）の2型だけにする。管理画面の型見本7型は対応済みで、`assertMinimalChartCopy` が `stats47` を拒否する。
- **対象の生成経路**: Remotion `features/data-cards/{DataCard.tsx,TileChange.tsx,all47-svg.ts}`・`ig-series/IgSeriesFooter.tsx`・`shared/components/charts/BarChartRaceScene.tsx`・`ranking-youtube/NormalOutro.tsx`、`.claude/scripts/sns/{quick-still.ts,lib/ranking-story-card.ts}`、バズマップの spec 生成 (`build-buzz-map-spec*.ts`・`merge-buzz-map-specs.ts`) とブランド行の描画。投稿済み画像は差し替えない。
- **① ランキングカード (2026-11-02 済)**: `all47-svg.ts` から発行元・宣伝文・冗長な注記を外し、`all47-svg.test.ts` が `assertMinimalChartCopy` を掛ける。X 側に旧画像で予約済みの12件（11/2以降）は差し替え未実施（X の予約操作が要るためオーナー判断待ち）。凡例の最大値ラベルの位置・数字の書体は既存の別課題。
- **② タイルの共通化 (2026-11-02 済)**: 4:5画像はサイトの配置表 `TILE_GRID_LAYOUT` から導出した `IMAGE_TILE_LAYOUT`（`data-cards/tile-layout.ts`）を使い、描画は `all47-svg.ts` の `renderTileMapBody` 1つ、配色は `data-cards/tile-scale.ts` の `resolveTileScale`（サイトの `resolveChoroplethScale` と一致をテストで固定）。増減タイル・IG 表紙・クイズのヒント・地図カルーセルの塗り分けも移行済み（型台帳 tile-map v6）。`svg-builder` の `TILE_GRID` も `TILE_GRID_LAYOUT` から導出。実形状の地図の見本は `buzz-map/geo.ts` の `computeBuzzMapGeo` で描く。
- **②の残り**: Remotion の本描画は未確認（`REMOTION-RSPACK-WIN-01`）。予約中の IG 素材の再レンダーは未実施。既存の IG 地図カルーセル props（`.local/r2/sns/map-carousel/*/props.json`）は作り直すまで青5段。表紙のフッター（stats47.jp）と `IgSeriesFooter.tsx` の発行元表記は残る。地図カルーセルは塗り分けと上位・下位の2枚がタイル地図で重なる（統合はオーナー判断）。
- **次・実行順**: ②の残り → ③バズマップ（投稿0件のため投稿開始前に）。各段で予約中の素材を再生成する（予約の本文・日時・ID は保つ）。
- **③ バズマップ (2026-11-10 済)**: `BuzzMapCard.tsx` の左下の発行元行を外し、spec を作る `build-buzz-map-spec{,-gsi,-ksj}.ts` と `merge-buzz-map-specs.ts` が出典の末尾に `stats47.jp` を足すのをやめ、既存の spec 14 件からも外した。note のデータ商品の見本 (`render-product-figures.ts` の `choropleth`) で描けることを確かめた。予約中のバズマップ素材は投稿 0 件のため再レンダー対象なし。残りは `.claude/scripts/sns/lib/ranking-story-card.ts` などバズマップ以外の経路。
- **停止条件**: 予約中投稿の差し替えで本文・日時・IDが変わる、公開済み投稿の素材を上書きする場合は止める。動画の終端カード（YouTube のアウトロ）は統計画像ではないので外すかを別途確認する。
- **完了条件**: 上記の生成経路の可視テキストに発行元が無く、各経路の出力に `assertMinimalChartCopy` 相当の検査が掛かる。

### [REMOTION-RSPACK-WIN-01] Windows で Remotion の描画が rspack のネイティブ部品欠落で起動しない
タグ: [インフラ・計測] [種類:不具合] [実行:windows] [起票:2026-11-02] [領域:SNS]

- **証拠 (2026-11-02)**: `npx remotion still` が `@rspack/binding` の `requireNative` で `MODULE_NOT_FOUND`。`package-lock.json` は `@rspack/binding` の optionalDependencies に `@rspack/binding-win32-x64-msvc` 1.7.11 を挙げるが、`node_modules/@rspack/binding-win32-x64-msvc` の項目が無い（Windows 用 Rolldown 部品の lock 欠落と同じ型。memory `feedback_windows_npm_install_rolldown_binding`）。
- **次**: 親と同版の lock metadata（resolved・integrity・cpu/os）を足して `npm install` し、`npx remotion still src/index.ts RankingInstagram-Cover` が通ることを確かめる。依存の変更は他の作業と排他（`local-environment.md`「検証コマンドの粒度」）。
- **完了条件**: この PC で Remotion の静止画が描け、Mac の lock 再生成で項目が消えないことを確認した。

### [KAKEI-MULTIAXIS-01] 家計調査の全国時系列・収入階級・世帯・貯蓄負債を図と記事へ展開する
タグ: [コンテンツ品質] [種類:制作] [実行:対話] [起票:2026-11-01] [領域:サイト]

- **読者の課題・HARM**: 家計の負担が収入層や年でどう違うかを理解したい読者には M。品目の地域差を楽しむ読者は HARM 対象外。前者の購入意図は未検証。
- **根拠**: 2025年の表・地域/世帯/期間/単位・図の候補は `.claude/skills/estat/references/household-expenditure-survey.md`。参考PDFの論点台帳 `data/source-inventory/kakei-marketing/2015/analyses.json` に収入階級と食料・教育費の問いがあるが、書籍の値や図は使わない。GSC W43 の「収入階級」「年収別 消費」の明確な検索需要は 0 件で、まず既存の食テーマやブログへの小さな図として試す。
- **確認済みの表 (2026-11-01、API実値照合と全126表のメタデータ棚卸し)**: 品目年次・五分位・年齢別・用途分類の五分位、年間収入 (2000〜2025年)、貯蓄・負債編の地域・年収18階級・五分位・十分位の表と単位の区別は `.claude/skills/estat/references/household-expenditure-survey.md` を正典とする。2025年詳細表の年収帯×品目や妻の就業×世帯類型など、Excel限定の交差軸は別の取込検証が必要。
- **制作状況 (2026-11-09 本番で確認)**: 17件の分析単位を `kakei-analysis-catalog.ts` に台帳化 (各行が切り口台帳の `lensId` を参照)。全国の比較図 17 枚は R2 `app/survey/kakei-chousa/axis-charts.json` に反映済みで (`kakei-axis-charts.yml` 11-05 成功)、本番の `/japan/household-food-spending` に 13 枚・`/japan/household-assets-debt` に 4 枚が表示される (HTML で図の題を確認)。米の支出と数量のブログ `rice-spending-quantity-gap-2025` は公開済み。問いの台帳では D13-1 を `japan-theme:household-assets-debt` に結んだ。効果観測は未実施。残る貯蓄/負債の都市比較1件は地域軸の図契約を要するため引き続きこのカードで扱う。
- **実行順**: ①全国時系列と金額/数量が揃う品目を検証 ②年収階級/五分位と世帯別の対象・実値を検証 ③貯蓄/負債の都市値と全国の年収別値を別面で検証 ④既存テーマの図・ブログで答えられない問いを制作し、相互にリンクする。各切り口の検証は並行してよい。
- **停止条件**: 家計調査の県全体値や都市×収入階級の交差表は存在しない。県別地図に全国の収入階級値を載せない。用途分類の月平均と品目分類の年間合計、2024年以前と2025年改定後の未接続系列を混ぜない。API の軸メタデータと公式値の照合前に図を公開しない。
- **完了条件**: 上記4系統で取得可能な図/記事の候補をすべて採否判定し、採用したものは一次資料・単位・世帯構成・導線の検査を通して公開後の閲覧/回遊の観測日を置ける。

### [XLSX-FURIGANA-INGEST-01] ingest-nier-achievement.ts の xlsx 読み取りが、共有文字列のふりがなを本文に混ぜる
タグ: [コンテンツ品質] [種類:不具合] [実行:対話] [起票:2026-11-01] [領域:データ]

- **済み (2026-11-13・`2c28508cd`)**: `ingest-nier-achievement.ts` の独自の xlsx 読み取りを消し、`lib/read-xlsx-sheet.ts` の `readXlsxSheet` に差し替えた。複製を持たないことをテストで固定した。
- **残り (NIER の xlsx 94 個の取得が要る)**: `npx tsx packages/data-configs/scripts/ingest-nier-achievement.ts --year 25 --dry-run` の出力を、差し替え前のコミットと比べる。コード上、この取り込みが読むのは「全体」の見出しと数値セルだけで市区町村名は読まないが、実データでの差は未実測。
- **完了条件**: 新旧の出力の差が 0 件か、差の理由が記録されている。


### [DATA-QUALITY-LOOP-01] 全指標のデータ品質を機械チェックし、「誤り・古さ・終了・薄さ」の 4 基準で継続的に直すループを作る
タグ: [コンテンツ品質] [種類:改善] [実行:対話] [起票:2026-09-25] [領域:データ]

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

### [AUTH-CREDENTIAL-REGISTER-01] 残りの資格情報 (Mac 全サービス) を登録する
タグ: [インフラ・計測] [種類:改善] [実行:ユーザー] [起票:2026-10-01] [領域:管理]

- **経緯**: 資格情報の正本は `.claude/config/auth-credentials.json`、状態は管理画面 `/ops/auth`。2026-10-01 に Mac・Windows・CI へ登録済み (ID と登録先は `/ops/auth`)。ココナラは 2026-10-19 の撤退で認証付き計測の対象から外し、2026-11-08 に Mac のキーチェーンの `stats47-measurement-coconala` と登録表の `MEASUREMENT_SESSION_COCONALA` を削除した (GitHub Secrets には残っていなかった)。認証付き計測は土曜の Mac 取得へ移した (`MEASUREMENT-MAC-DIRECT-01`)。2026-10-27 に `MEASUREMENT-AUTH-RESTORE-01` (improvements.md) をこのカードへ統合した。経過は `git log -p -- .claude/todo/backlog.md`。
- **残り (オーナーのみ・パスワードは対話入力)**:
  1. **再認証**: `auth_required` で止まっている取得元 (2026-W42 時点で gsc・kdp、10-19 にもしも) を `node .claude/scripts/measurement/refresh-session.mjs <source> --headed` で入れ直す。検証は `npm run measurement:status -- --check` と次の `data/measurement-cycle/latest.json` の kdp・gsc の freshness が pass であること。
  2. **パスワード経路の実証**: A8・もしも・楽天のパスワードでの自動ログインは未実証。セッション切れ時に `refresh-session.mjs <source> --headed` で確かめる。KDP は本棚が有効でも Reports 認証で止まることがあり、`latest.json` の `relogin` が `human_required` / `login_failed` なら人の再認証か Mac 側収集を検討する。
- **完了条件**: Mac と Windows の両方で `/ops/auth` の「この PC」が全行「済」、CI 欄が「済」か「保管」。その後の authenticated-measurement で note・KDP の状態ファイルの `relogin` が `session_valid` か `relogged` になる (CI での再ログインは未実証)。

### [NAV-CLICK-COVERAGE-01] サイト内リンクのクリックを既定で全件計測し、名前の無い導線を週次で減らす

タグ: [インフラ・計測] [種類:改善] [実行:対話] [起票:2026-09-25] [期日:2026-10-23] [領域:管理]

- **背景**: 部品単位のクリック計測がサイト内移動の約 2 割しか無かったため、ルートレイアウトの共通監視 `apps/web/src/lib/analytics/components/NavClickTracker.tsx` で既定を「全部送る」に反転し、導線名 (`data-nav-surface`、`navSurfaceProps()` で `NavSurface` に型を縛る) が無いものは `unlabeled` で送る方式にした。
- **済 (〜2026-10-19)**: P1 (共通監視・`data-click-owner` による専用処理の除外・単体テスト)、P2 (フッター・パンくず・タグ・ブログ本文)、P4 (`fetch-ga4-snapshot.mjs` の `nav-click-surfaces.csv` と計測サイクルの被覆率・導線名なし上位)、導線名なし上位 7 部品への命名 (PR #1158 で本番反映、本番の実クリックで 1 回 1 件・遷移を止めないことを確認)。台帳は `.claude/rules/analytics-event-standards.md`。
- **反映後の読み直し (2026-11-01)**: 10-20〜10-31 の `nav_click` 8,794 件のうち導線名なし 4,530 件 (51.5%、W41 は 53.9%)。導線名なしの行き先 (`customEvent:nav_label`) は ranking 1,247・geo 1,085・municipalities 730・api 389・areas 279・home 232。再現: `node .claude/scripts/metrics/ga4-query.mjs --start 2026-10-20 --end 2026-10-31 --dims customEvent:nav_surface --metrics eventCount --filter 'eventName==nav_click' --japan`。
- **次**: ① 次に名前を付ける部品は geo への導線 (1,085 件)。開発サーバーの HTML で `/geo` へのリンクのうち `data-nav-surface` の無いものを数えて部品を決める (サイドバーは `sidebar` の名前を持つので別)。残る候補は `SiteLink` を使い計測の配線を持たないファイル 40 件ほど (Geo の各分析・市区町村ランキング・テーマのダッシュボードなど)。② **P3**: `page-quality` の全 URL 静的解析に「名前の無いサイト内リンク数」「計測担当の無い広告リンク数」を追加し、テンプレート別に縮小専用の基準線を置いて違反を `UI-FIX-*` 起票に流す。描画後に出るリンクは代表 URL のブラウザ検査で数える。**衝突注意**: `UI-CHART-TEXT-LOOP-01` (ブランチ `wip/ui-chart-text-loop-01`) と `SITE-DISPLAY-SEMANTICS-AUDIT-01` も同じファイル群 (`.claude/scripts/page-quality/lib/ui-report.ts` の `UI_METRIC_KEYS`・`types.ts`・`page-quality-budgets.json`・`measure-static.ts`) に指標を足すので、並行して実装せず後から入る側が先行分を取り込んでから足す。
- **停止条件・禁止**: クリックを止める処理 (`preventDefault` / `stopPropagation`) を入れない。見た目・マークアップ構造・クラスを変えない。タブ切替・スクロール等の画面内操作とアフィリエイトの表示回数計測は対象外。本番デプロイはまとめて 1 回、オーナー承認の上で行う。デプロイ後に `nav_click` が 2 倍近く跳ねたら二重送信を疑い、先に原因を特定する。
- **完了条件**: ① 単体テストが「1 クリック 1 件」「広告・`data-click-owner` 付きは送らない」「送信時に遷移を止めない」を固定し、代表ページで実クリック 1 回につき送信 1 件を確認済み (済)。② 本番デプロイ後の週次 page-quality に新指標が出て、違反を 1 件注入すると検知されることを確認済み。③ 週次の計測サイクル出力に被覆率と `unlabeled` 上位が出ている。

### [CF-CPU-SURGE-01] 2026-09-11 以降の Workers CPU 時間の増加原因を特定し、差分 purge とブログ広告変更の効果を測る

タグ: [インフラ・計測] [種類:不具合] [実行:対話] [起票:2026-09-24] [期日:2026-10-30] [領域:管理]

- **これまで (経過の全文は `git log -p -- .claude/todo/backlog.md`)**: 10/15 の請求書 (IN-83898043) の Workers CPU 超過は 1,068M ms・$21.38 で前期間の 3.70 倍 (記録 `data/cloudflare/weekly-snapshots/2026-W42.json`)。10-16 の Observability Traces (1 時間) で CPU の約 72% (4,249 件・約 282 万 ms) が `url.query` に `_rsc` を含む先読みと特定し、`SiteLink` (表示時 `prefetch={false}`・hover/touch で 1 回) を `next/link` の全 import に適用して 10-17 に本番反映した。日次の `totalCpuTimeUs` は取得できている。完了条件の「主因の特定と 10/15 請求書の記録」は満たし、このカードは対策の効果確認までを持つ。
- **③ の比較 (2026-11-01)**: 日次 snapshot (`data/cloudflare/snapshots/<日>.json`) で 1 件あたり CPU は反映前 2 日 555 ms → 反映後 681 ms / 680 ms と下がっていない。反映前の窓が 2 日しかなく、10-28 の市区町村の県別ページ (470 URL) 公開も重なるので判定できない。④ 効果観測の引き渡しは、根拠のある `[target:]` が置けないため行っていない。
  - **[仮説]** 先読み停止で `_rsc` は減ったが、別の重いサーバー描画 (ランキング・テーマ・市区町村) の割合が増えた。**検証**: Observability (Query Builder・Traces で `cpu_time_ms` の sum を `url.path` 等で集計。`$workers.event.request.path` は Traces に無い) で 10-17〜10-30 の `_rsc` を含むリクエストの件数と CPU を 10-16 と同じ条件で取り直す。**検証期日**: 2026-11-14。**期日後の判定**: 割合が 72% から 30% 未満なら先読み停止は効いており、残りの CPU は別カードで扱う。下がっていなければ `next/link` の差し替え漏れ・hover の先読みを調べる。
- 残る対策は `CF-RENDER-CPU-01` / `CF-EDGE-TTL-01` / `CF-DEPLOY-CACHE-RESET-01`。AI クローラーの制限は実測 4% のため起票しない。doboku-note 側の R2 対応ではこのカードの CPU 行は動かない。
- **統合 (2026-10-26 オーナー判断): `CF-CPU-OCN-CLIENT-01`** OCN 回線 (ASN 4713) から Windows Chrome を名乗って約 3 秒に 1 回連続アクセスする 1 端末 (10-16 の CPU 約 33%) を特定し、必要ならレート制限する
  - **本文の欠け (2026-11-13 確認)**: この統合のコミットで、元カード 9 行のうち 6 行 (字下げした続きの行と番号付きの手順) が落ちた。着手の前に `git show 47aa651d1^:.claude/todo/backlog.md` で `[CF-CPU-OCN-CLIENT-01]` の全文を読み、今の実装と突き合わせて残りを決める。
  - **次**: 先読み停止の反映後に同じ ASN・UA で件数と CPU を取り直す。先読みが止まって消えたなら閉じる。
  - **停止条件**: 人の閲覧 (会社など共有の出口) の可能性を否定できないまま遮断しない。WAF・レート制限の設定変更はオーナーの承認後。
  - **完了条件**: 先読み停止後の実測で消えたことを確かめたか、レート制限を入れて同じ集計で件数が下がったことを確かめた。
- **停止条件**: 本番 deploy はオーナー承認まで行わない。原因を実測で絞らないまま対策を足さない。
- **完了条件**: CPU 増加の主因を route か仕組みで特定して対策を決め、10/15 の請求書の CPU 行を記録している (2026-10-16 に満たした)。対策の本番反映と効果観測の引き渡しまでをこのカードで持つ。

### [AFFILIATE-COMMON-PRODUCTS-01] アフィリエイトを共通的で収益性の高い商品に切り替え、本文の広告の段 (広い画面は横 3 枠) を試す
タグ: [収益化] [種類:改善] [実行:対話] [起票:2026-11-03] [領域:アフィリエイト]

- **起点 (2026-11-03 オーナー判断)**: 分野ごとの文脈一致をやめ、多くの読者に共通し、報酬単価か成約率が高い商品に切り替える (収益化戦略 §3.2 を同日に書き換えた)。あわせて、本文の中段・下段の広告を広い画面では 300×250 の横 3 枠に並べ、モバイルでは 1 枠にする案 (オーナー提案)。
- **根拠 (実測)**: 直近 4 週のアフィリエイトは 16,594 表示・21 クリック (0.13%)、ふるさと納税は 1,135 表示・2 クリック。A8 は 8〜10 月で 690 クリック・成約 0。AdSense の本文中の枠は 1,000 表示あたり ¥43〜45、右レール・表の横・ページ末の関連コンテンツ型は ¥7〜17 (2026-W43)。
- **次**:
  1. 候補の洗い出し: 提携済み・申請中の案件から、共通的な商品 (分野を問わず読者の多くに当てはまるもの) を挙げ、報酬単価・成約条件・ASP の公表成約率 (確認日付き) を一覧にする。1,000 表示あたりの見込み収益を計算し、本文中の AdSense (¥43) を上回りうるものだけを残す。オーナーが採用を決める。
  2. 実装: 共通の案件を本文の中段・下段の広告の段に出す解決を足す (`resolve-affiliate-ad.ts`。vertical の解決は文脈の案件に残す)。広告の段の部品は 300×250 を広い画面で横 3 枠・モバイルで 1 枠にする。サイトの規則「枠同士を隣り合わせにしない」(配置の台帳と検査) に、本文の広告の段を例外として足す。
  3. 試験 (2 週間): 調査ハブとテーマのページだけ。中段を AdSense の横 3 枠、下段を共通の案件の横 3 枠にする。AdSense は 1,000 PV あたり収益を試験の前後で比べ、上がらなければ元に戻す。共通の案件はクリック率を先に見て、成約は 4〜8 週に延ばして確かめる。開始前に必要な表示・クリック数を計算して記録する。
- **進捗 (2026-11-03)**: 「共通 = 対象者が広く、気軽に始められる」を §3.2 に書いた。共通の案件の一覧 (`generic-affiliate.ts`) を楽天カード (楽天アフィリエイト・1,500 円) と TOSSY だけにし、調査ハブとテーマの PR の列を共通の案件の横 3 枠に替えた (commit 803c1aaa0・develop。手元の画面で 2 枠・モバイル 1 枠を確認)。提携の申請: もしもの楽天カード (2,800 円)・A8 の SBI新生銀行・Audible・エポスカード。三井住友カード（NL）は審査中。**広告の台帳の R2 への公開 (`publish-affiliate-ads.yml`) は本番の確認前なので取り消した** — `affiliate-ads-data.ts` を develop へ push すると自動で走るので、リリースのときに走らせる。
- **2026-11-06 オーナー判断**: 楽天市場の商品カードと返礼品カード、日次同期、楽天 API の取得を試験の途中で撤去した (2 か月 40 クリック・注文 0 件)。試験の前後比較では、この変更が混ざる。楽天カードの案件は残す。
- **進捗 (11-03 夕)**: 本文の広告を広告の段 (`AdRow`) に統一 (テーマ・ランキング・ブログ・トップ・カテゴリ・市区町村のハブ)。右レールの AdSense は本文の横のときだけ。台帳 `data/ads/placements.json`。楽天カードは R2 反映済み。デプロイは PR #1214。
- **残り**: ① 申請中の 6 案件が通ったら段の PR の枠を埋める。② 段は 11-03 に残りのページへ広げ、モバイルの AdSense 0 のページは解消した。モバイルの PR が無いページをどうするかは `AFF-MOBILE-PR-GAP-01`、配置の週次の撮影は `AD-LAYOUT-WEEKLY-CAPTURE-01`。③ 土曜の記録で前後を比べ、続けるか戻すかを決める。必要数: PR は表示約 24,000 回 (クリック 30 回。直近 4 週の CTR 0.13%・週約 8,300 回で約 3 週)、AdSense は 1,000 PV あたり収益 (W43 ¥21) を 4 週平均で比べる。
- **2026-11-12 オーナー決定 (試験の打ち切り)**: アフィリエイトは戦略を練り直すまで止め、本文の広告の段は 1 つずつ AdSense のレスポンシブへ替える (`ADSENSE-FORMAT-EXPERIMENT-01`)。この試験は判定を待たずに終える。打ち切りの時点の実測: A8 は 8〜10 月で 690 クリック・成約 0、楽天は 9〜11 月で 43 クリック・注文 0、サイトの PR のクリック率は直近 6 週で 0.04〜0.22%。ランキングの 2 段は commit 5469a28b8 と次の commit で PR を外した (未 push)。残りの枠の PR は AdSense へ替えるまで出たまま。カードは、戦略を練り直す新しいカードを起票するか、残りの枠を替え終えたときに消す。
- **停止条件・禁止**: 保険の見積もり・相談は出さない (`AFF-HEAVY-FINANCE-STOP-01`)。不安を煽る訴求・誤解を招く案件は使わない。複数の枠の案件を同時に入れ替えない。本番への反映 (デプロイ・R2) はオーナーの承認後。
- **完了条件**: 採用した共通の案件が本文の広告の段で配信され、2 週間の試験の結果 (AdSense の 1,000 PV あたり収益・共通の案件のクリック率) が `data/improvement/affiliate-improvement/` に記録され、続けるか戻すかをオーナーが決めた。

### [AFF-HEAVY-FINANCE-STOP-01] 保険の見積もり・相談など「重い行動×当事者性なし」の金融案件を配信から外し、金融は無料の口座開設までにする
タグ: [収益化] [種類:改善] [実行:対話] [起票:2026-10-27] [期日:2026-11-13] [領域:アフィリエイト]

- **起点 (2026-10-27 オーナー判断)**: vault の 3 面アフィリ方針 (コンテンツ戦略SSOT §4 `affiliate-strategy-3faces`) を採用。stats47 で認める金融は「無料の口座開設」(証券口座など) まで。保険の一括見積もり・保険相談は読者に重い行動を求め、運営者に当事者性も無いので出さない。`AFF-A8-EXPANSION-2026-10` で 10-19 に登録した保険相談 4 件 (ガーデン 3・みんなの生命保険アドバイザー) と、配信中の保険の一括見積もりが対象。10-19 の「提携できるものは提携して展開」より、この判断を優先する。
- **次**: ① 台帳 `affiliate.ads` と `affiliate.offer-profiles` から、保険の見積もり・相談に当たる広告を洗い出してオーナーに一覧を見せる ② 該当を `isActive: false` にする (削除せず履歴の照合に残す) ③ develop へ push して `publish-affiliate-ads.yml` で R2 へ公開し、本番の対象ページから消えたことを確かめる。SBI 証券など無料の口座開設は残す。
- **停止条件**: 無料の口座開設・A8 と楽天のほかの案件に触らない。提携の解除は急がない (配信を止めれば足りる)。`ASP-CONSOLIDATE-A8-RAKUTEN-01` と同じデプロイ不要の経路でまとめてよい。
- **完了条件**: 本番の `app/affiliate-ads/all.json` で保険の見積もり・相談の広告が配信中 0 件、金融の配信中は無料の口座開設だけになっている。

### [AFF-AFB-REJECTED-STATUS-01] afb の「提携却下」を台帳に取り込み、もしも・afb の提携済み 115 件を条件確認から在庫まで進める
タグ: [収益化] [種類:不具合] [実行:対話] [起票:2026-10-31] [領域:アフィリエイト]

- **起点 (2026-10-31 オーナー指示「提携できるものは全て提携　利用できるものは全て利用」)**: afb の未提携 32 件は申請ボタンが無く、確かめた 14108・16418 は「提携却下」(画面上部の件数は 却下 41)。`affiliate-status.mjs` は提携中 (`rel=rel`)・申請中 (`rel=1`) しか読まないので台帳 `affiliate-catalog.json` では `none` のまま残り、`affiliate-apply.mjs` の afb 経路も誤った理由を出す。
- **次**: ① afb の却下の一覧 (画面上部の「却下」のリンク先) を `affiliate-status.mjs` で読み、台帳の語彙に `rejected` を足して取り込む。申請スクリプトの理由文を「申請ボタン無し (却下・解除・申請済みのいずれか)」に直す ② もしも 3 件 (6548・5905・6970) はサイト ID の読み戻しで止まった。詳細ページを見て終了か確かめる ③ もしも・afb の提携済み 119 件のうち在庫に載るのは 4 件だけ。`moshimo-inspect-offer.mjs` で成果条件を確かめ、掲載適格性 (10-31 に書いた `terms-unverified` を外す) → `moshimo-harvest.mjs` / `afb-harvest.mjs` → 台帳 `affiliate.ads` へ登録する。
- **停止条件**: `AFF-HEAVY-FINANCE-STOP-01` (保険の見積もり・相談を出さない) を優先する。10-31 に A8 で申請した保険の 4 件 (保険クリニック・保険見直しラボ・保険コンパス・マネカフェ) は承認されても在庫に登録しない。afb のログインは毎回オーナーが要る。
- **完了条件**: 台帳の afb の `none` が実機の未提携だけになり (却下は `rejected`)、もしも・afb の提携済みのうち規約に合う案件が 台帳 `affiliate.ads` に登録されている。

### [ADSENSE-FIXED-UNITS-01] ページ末の 2 枠に専用の表示広告ユニットを作り、借りているユニットを返す
タグ: [収益化] [種類:改善] [実行:ユーザー] [起票:2026-10-31] [領域:サイト]

- **起点 (2026-10-31 オーナー決定「AdSense は全て 300×250」)**: 関連コンテンツ型 (`RANKING_PAGE_FOOTER`・`CONTENT_FOOTER`) は固定の大きさにできないので、表示広告のユニット stats47-hub-rail (9435960671)・stats47-themes-content (8298138821) を借りていた。
- **済み (2026-11-03)**: 専用ユニット stats47-ranking-footer-rect = 3686603642・stats47-content-footer-rect = 6994459114 を作り、`apps/web/src/lib/google-adsense/constants.ts` を差し替え、テストの `BORROWED` を消した。
- **残り**: 本番に出た日を記録し、その日を境にページ末の 2 枠を新しいユニットで数える。固定サイズへの変更 (e7eefcafa) は 2026-11-01 に本番へ出て `ADSENSE-PLACEMENT-01` の観測期間 (W42〜W45) の途中に入ったので、11-14 の判定では stats47-hub-rail・stats47-themes-content とページ末の枠を W43 以前と比べない。
- **停止条件**: ユニットの作成はオーナーだけが行う (AdSense のアカウント操作)。
- **完了条件**: 全ての slotId がそれぞれ 1 つの配置だけで使われ、`BORROWED` の例外が無い。

### [AFF-PLACEMENT-MAP-SIZE-01] 配置マップ (placement-map-latest.json) を 1MB 以下に分け、週次の更新を戻す
タグ: [収益化] [種類:不具合] [実行:対話] [起票:2026-10-31] [領域:アフィリエイト]

- **済み (2026-11-13・`0add28e1b`)**: 肥大の原因はページ別明細 `pages` (6,000 ページ超 × 適格広告の一覧で約 6.7MB) だった。git には要約だけを置き、明細は `.local/affiliate-placement-map/pages-latest.json` に分けた。2026-11-13 生成の `placement-map-latest.json` は 62,756 バイト。
- **分かったこと**: 週次 workflow `affiliate-dashboard-refresh.yml` は `contents: read` で、生成物を artifact に上げるだけで git へ書き戻さない。git の記録は、もともと週次では更新されない。
- **決めること (オーナー)**: git の `placement-map-latest.json` を週次で自動更新するか (workflow に書き戻しを許す)、手元で生成してコミットする運用にするか、読み手を artifact か R2 に向けるか。
- **完了条件**: 決めた方法で `placement-map-latest.json` が 1MB 以下のまま更新され、`generatedAt` が 8 日以内。

### [MUNI-DATA-DEDUP-01] 製造品出荷額の 2 指標 (manufacturing-shipment と -amount) が R2 で同じ値になっている件を正す
タグ: [コンテンツ品質] [種類:不具合] [実行:対話] [起票:2026-11-01] [領域:データ]

- **事象 (2026-11-01 実測)**: `app/stats/manufacturing-shipment/cities.json` と `app/stats/manufacturing-shipment-amount/cities.json` が全年・全地域で値が一致し、違いは meta の表 ID と生成日 (10-05 と 10-28) だけ。設定上は表 ID が別 (0000020203「旧統計」と 0000010103) で、年の範囲 (1980〜2023 / 1975〜2024) と暦年・年度の扱いも設定と配信値が合っていない。
- **次**: ① 2 指標の取得経路で、どちらの表から値を取ったかを確かめる ② 片方を止める (isActive:false と 410 の扱い) か正しい表から取り直すかを決める ③ 年の範囲と年の表記を配信値に合わせる。
- **停止条件**: R2 への反映はオーナーの承認後。
- **完了条件**: 2 指標が別の値を持つか一方が止まり、設定の年の範囲と表記が配信値と一致する。

### [CRITIC-PATTERN-RELATED-LINK] critic の指摘「関連記事の紹介」が 3 本の記事で繰り返した。writer の規約か gate に入れる
タグ: [コンテンツ品質] [種類:改善] [実行:対話] [起票:2026-10-31] [領域:サイト]

- **事象**: 直近の窓で、blog-critic が型「関連記事の紹介」(`related-link`) の BLOCK/MAJOR を 3 本の記事で 3 件出した。critic の目視でしか見つかっていない。例:
  - 2026-10-28 other-fresh-fish-consumption-quantity-prefecture-gap: 「島根県のデータを見ると、魚介に関わる他の指標でも特徴が見られるかもしれません」は、内容の確認なしに誘導する書き方で、読者への情報価値がありません。
  - 2026-10-28 hobby-participation-rate-instrument-prefecture-gap: 東京都・神奈川県のデータへのリンク段落は「見比べると背景が見えてくる」と一般論で促すだけで、この指標固有の読みを与えていない。
  - 2026-10-28 cooking-oil-consumption-quantity-prefecture-gap: マヨネーズやドレッシングとの比較を促す段落は、書き手が他指標を使えないため、この記事では答えが出ません。
- **次**: 機械で判定できるなら quality-gate に検査を足す (公開済み記事で誤検知 0 件を確かめてから blocker にする)。できなければ `.claude/rules/blog-quality-standards.md` と article-writer の指示に書く。
- **完了条件**: 検査か規約が入り、`.claude/config/critic-finding-types.json` の `related-link` に `promotedAt: "<入れた日>"` を書いた。
- 起票元: `critic-findings-digest.mjs` (台帳 `data/blog/critic-findings/`)

### [CRITIC-PATTERN-STRUCTURE] critic の指摘「構成・冗長」が 97 本の記事で繰り返した。writer の規約か gate に入れる
タグ: [コンテンツ品質] [種類:改善] [実行:対話] [起票:2026-10-31] [領域:サイト]

- **事象**: 直近の窓で、blog-critic が型「構成・冗長」(`structure`) の BLOCK/MAJOR を 97 本の記事で 112 件出した。critic の目視でしか見つかっていない。例:
  - 2026-10-08 cc-estat-09-radar-prefecture: 62〜64、268〜277、423〜425 行で、同じ 6 軸の数値と結論が 3 回出てきます（図カード、直後の段落、Step 2 の箇条書きと段落）。
  - 2026-10-28 average-height-primary-school-fifth-grade-male-vs-other: 上位・下位の2節は、図に載っている県名と数値を並べ直した文が節の大半を占めています。
  - 2026-10-28 bacon-consumption-expenditure-prefecture-gap: 「関連品目との対比」の節は、ハムやソーセージのデータがなく、「あれば〜と想像できる」という仮定の話が中心です。
  - 2026-10-28 cocoa-consumption-expenditure-prefecture-gap: 「関連する品目との対比で考える」は、本文自身が数値比較をしないと断っており、読者に新しい情報を渡していません。
  - 2026-10-28 cocoa-consumption-expenditure-prefecture-gap: 「上位県の個別の姿」と「下位県の傾向」は、前半で示した順位と「近畿・九州で差が大きい」という指摘の繰り返しです。
- **次**: 機械で判定できるなら quality-gate に検査を足す (公開済み記事で誤検知 0 件を確かめてから blocker にする)。できなければ `.claude/rules/blog-quality-standards.md` と article-writer の指示に書く。
- **完了条件**: 検査か規約が入り、`.claude/config/critic-finding-types.json` の `structure` に `promotedAt: "<入れた日>"` を書いた。
- 起票元: `critic-findings-digest.mjs` (台帳 `data/blog/critic-findings/`)

### [UI-FIX-PREFECTURE-LIST-20261031] UI 是正: prefecture-list の週次 UI 検査の指摘 4 件を直す

タグ: [UI・UX] [種類:不具合] [実行:sweep] [検証:npx tsx .claude/scripts/page-quality/ui-findings.ts --assert-handled data/page-quality/backlog-batches/UI-FIX-PREFECTURE-LIST-20261031.txt] [起票:2026-10-31] [領域:サイト]

- **自動起票**: 週次のページ品質監査 (`quality-suite-weekly.yml の page-quality job`) の結果から `ui-findings.ts --sync` が作った。対象の一覧は `data/page-quality/backlog-batches/UI-FIX-PREFECTURE-LIST-20261031.txt`、状態は `data/page-quality/ui-findings-queue.json`。正典は `.claude/rules/page-quality-standards.md`「UI 指摘のループ」。
- **スクショ (最新の週次)**: [mobile-390](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-list-mobile-390.png) / [desktop-1440](https://storage.stats47.jp/state/page-quality/screenshots/latest/prefecture-list-desktop-1440.png)。検査の詳細は `data/page-quality/metrics/LATEST.md`。
- **対象**:
  - `agent|prefecture-list` (Claude の確認)
    - [mobile-390/medium] スマホ1枚目、「地方」の7行の縦リストと、その下の「都道府県を選ぶ」: 地方の絞り込みが縦に7行並んで最初の画面の大半を占め、都道府県名の検索欄は画面の一番下に押し出される。このページの目的である都道府県の選択に届くまでスクロールが要る。 → 地方の絞り込みを横スクロールのチップか折りたたみにし、都道府県の検索と一覧を最初の画面に出す。
  - `machine|https://stats47.jp/areas|a11y_violations` — a11y_violations = 2 (閾値 <= 0)
  - `machine|https://stats47.jp/areas|mobile_page_height` — mobile_page_height = 2766 (閾値 <= 2600)
  - `machine|prefecture-list|title_changed` — title_changed: 1 URL (最大 1、閾値 <= 0)。例: https://stats47.jp/areas
- **表示の意味 (定義単位で直す)**: 語・文字列・店名などの具体的な箇所は `LATEST.md` / 週次 `latest.json` の `ui_findings` にある。全URLの検査はページの種類ごとに 1 件へまとめてあり、該当 URL の全件は週次 `latest.json` (`npm run state:pull -- page-quality` で `data/page-quality/live/` に取得) の `violations` にある。同じ指摘が同じテンプレートの多数の URL に出ていれば、ページではなく生成元 (テンプレート・カタログ・共通部品・AI 解説の生成) を直す。内部用語は読者向けの言い換えに、`NaN`/`undefined` は値が無いときの表示 (「—」等) に、`%`/`％` はそのページの多数派に揃える。`title_changed` は選定入力が変わっていないのに title が変わった場合だけ直す (選び方を決定的にする)。文字の小ささ・ページ高さはテンプレート別の予算 (`page-quality-budgets.json`) との差で、予算を上げて閉じない。
- **次**: 原因をコードから特定して直し、関係する unit test と `npm run design-system:check -w apps/web` を通す。Claude の指摘は描画前の撮影による誤検知もありうるので、その場合は撮影側 (`.claude/scripts/page-quality/lib/screenshots.ts`) を直すか by-design にする。
- **記録**: 直した指摘は `npx tsx .claude/scripts/page-quality/ui-findings.ts --mark-fixed <key> --note "<何を変えたか>"`、直さないと判断した指摘は `--mark-by-design <key> --note "<理由>"`。デザイン方針・画像制作・外部契約などオーナー判断が要る指摘は、決めてほしいことを書いた `[実行:対話]` のカードを backlog に起票してから `--mark-owner <key> --card <そのカード ID> --note "<何を決めてほしいか>"` (カードが閉じた後も残っていれば pending に戻る)。まとめて付けるときは `@data/page-quality/backlog-batches/UI-FIX-PREFECTURE-LIST-20261031.txt`。本番確認は release 後の週次監査が行い、再検出されたら pending に戻って再起票される。
- **停止条件**: 本番 deploy・R2 push をしない。判断できない指摘は pending のまま残し、このカードを消さない。
- **完了条件**: 検証コマンドが exit 0 (全対象が pending でなく、done 以外は理由 note 付き)。

### [UI-FIX-OTHER-MUNICIPALITIES-THEME-20261031] UI 是正: other--municipalities-theme の週次 UI 検査の指摘 1 件を直す

タグ: [UI・UX] [種類:不具合] [実行:sweep] [検証:npx tsx .claude/scripts/page-quality/ui-findings.ts --assert-handled data/page-quality/backlog-batches/UI-FIX-OTHER-MUNICIPALITIES-THEME-20261031.txt] [起票:2026-10-31] [領域:サイト]

- **自動起票**: 週次のページ品質監査 (`quality-suite-weekly.yml の page-quality job`) の結果から `ui-findings.ts --sync` が作った。対象の一覧は `data/page-quality/backlog-batches/UI-FIX-OTHER-MUNICIPALITIES-THEME-20261031.txt`、状態は `data/page-quality/ui-findings-queue.json`。正典は `.claude/rules/page-quality-standards.md`「UI 指摘のループ」。
- **スクショ (最新の週次)**: [mobile-390](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--municipalities-theme-mobile-390.png) / [desktop-1440](https://storage.stats47.jp/state/page-quality/screenshots/latest/other--municipalities-theme-desktop-1440.png)。検査の詳細は `data/page-quality/metrics/LATEST.md`。
- **対象**:
  - `agent|other--municipalities-theme` (Claude の確認)
    - [mobile-390/low] スマホ1枚目、各指標カードの灰色ヒストグラム(「65歳以上人口割合」「高齢夫婦のみの世帯数」): ヒストグラムに軸の数値も最大・最小のラベルもなく、何の分布か分からない。「高齢夫婦のみの世帯数」は左端1本だけ高く残りは線に見え、図の意味が読み取れない。 → 横軸の最小値と最大値、または「多くの自治体は〇〇付近」のような一言をヒストグラムの下に添える。
- **次**: 原因をコードから特定して直し、関係する unit test と `npm run design-system:check -w apps/web` を通す。Claude の指摘は描画前の撮影による誤検知もありうるので、その場合は撮影側 (`.claude/scripts/page-quality/lib/screenshots.ts`) を直すか by-design にする。
- **記録**: 直した指摘は `npx tsx .claude/scripts/page-quality/ui-findings.ts --mark-fixed <key> --note "<何を変えたか>"`、直さないと判断した指摘は `--mark-by-design <key> --note "<理由>"`。デザイン方針・画像制作・外部契約などオーナー判断が要る指摘は、決めてほしいことを書いた `[実行:対話]` のカードを backlog に起票してから `--mark-owner <key> --card <そのカード ID> --note "<何を決めてほしいか>"` (カードが閉じた後も残っていれば pending に戻る)。まとめて付けるときは `@data/page-quality/backlog-batches/UI-FIX-OTHER-MUNICIPALITIES-THEME-20261031.txt`。本番確認は release 後の週次監査が行い、再検出されたら pending に戻って再起票される。
- **停止条件**: 本番 deploy・R2 push をしない。判断できない指摘は pending のまま残し、このカードを消さない。
- **完了条件**: 検証コマンドが exit 0 (全対象が pending でなく、done 以外は理由 note 付き)。

### [UI-FIX-OTHER-20261031] UI 是正: other の週次 UI 検査の指摘 10 件を直す

タグ: [UI・UX] [種類:不具合] [実行:sweep] [検証:npx tsx .claude/scripts/page-quality/ui-findings.ts --assert-handled data/page-quality/backlog-batches/UI-FIX-OTHER-20261031.txt] [起票:2026-10-31] [領域:サイト]

- **自動起票**: 週次のページ品質監査 (`quality-suite-weekly.yml の page-quality job`) の結果から `ui-findings.ts --sync` が作った。対象の一覧は `data/page-quality/backlog-batches/UI-FIX-OTHER-20261031.txt`、状態は `data/page-quality/ui-findings-queue.json`。正典は `.claude/rules/page-quality-standards.md`「UI 指摘のループ」。
- **スクショ (最新の週次)**: [mobile-390](https://storage.stats47.jp/state/page-quality/screenshots/latest/other-mobile-390.png) / [desktop-1440](https://storage.stats47.jp/state/page-quality/screenshots/latest/other-desktop-1440.png)。検査の詳細は `data/page-quality/metrics/LATEST.md`。
- **対象**:
  - `machine|https://stats47.jp/japan|a11y_violations` — a11y_violations = 2 (閾値 <= 0)
  - `machine|https://stats47.jp/municipalities/ranking/junior-high-school-count|a11y_violations` — a11y_violations = 2 (閾値 <= 0)
  - `machine|https://stats47.jp/municipalities/ranking/manufacturing-shipment-amount/23000|a11y_violations` — a11y_violations = 3 (閾値 <= 0)
  - `machine|https://stats47.jp/municipalities/ranking/per-taxpayer-income/13000|a11y_violations` — a11y_violations = 3 (閾値 <= 0)
  - `machine|https://stats47.jp/municipalities/themes/aging-society|a11y_violations` — a11y_violations = 3 (閾値 <= 0)
  - `machine|https://stats47.jp/municipalities|a11y_violations` — a11y_violations = 3 (閾値 <= 0)
  - `machine|https://stats47.jp/products/data-p-01|a11y_violations` — a11y_violations = 2 (閾値 <= 0)
  - `machine|https://stats47.jp/products|a11y_violations` — a11y_violations = 3 (閾値 <= 0)
  - `machine|https://stats47.jp/tag/population|a11y_violations` — a11y_violations = 3 (閾値 <= 0)
  - `machine|other|title_changed` — title_changed: 60 URL (最大 1、閾値 <= 0)。例: https://stats47.jp/municipalities/ranking/annual-sales-amount / https://stats47.jp/municipalities/ranking/annual-sales-amount-per-employee / https://stats47.jp/municipalities/ranking/annual-sales-amount-per-establishment
    - 経緯: 再発 (2026-10-31 の週次で再検出)
- **表示の意味 (定義単位で直す)**: 語・文字列・店名などの具体的な箇所は `LATEST.md` / 週次 `latest.json` の `ui_findings` にある。全URLの検査はページの種類ごとに 1 件へまとめてあり、該当 URL の全件は週次 `latest.json` (`npm run state:pull -- page-quality` で `data/page-quality/live/` に取得) の `violations` にある。同じ指摘が同じテンプレートの多数の URL に出ていれば、ページではなく生成元 (テンプレート・カタログ・共通部品・AI 解説の生成) を直す。内部用語は読者向けの言い換えに、`NaN`/`undefined` は値が無いときの表示 (「—」等) に、`%`/`％` はそのページの多数派に揃える。`title_changed` は選定入力が変わっていないのに title が変わった場合だけ直す (選び方を決定的にする)。文字の小ささ・ページ高さはテンプレート別の予算 (`page-quality-budgets.json`) との差で、予算を上げて閉じない。
- **次**: 原因をコードから特定して直し、関係する unit test と `npm run design-system:check -w apps/web` を通す。Claude の指摘は描画前の撮影による誤検知もありうるので、その場合は撮影側 (`.claude/scripts/page-quality/lib/screenshots.ts`) を直すか by-design にする。
- **記録**: 直した指摘は `npx tsx .claude/scripts/page-quality/ui-findings.ts --mark-fixed <key> --note "<何を変えたか>"`、直さないと判断した指摘は `--mark-by-design <key> --note "<理由>"`。デザイン方針・画像制作・外部契約などオーナー判断が要る指摘は、決めてほしいことを書いた `[実行:対話]` のカードを backlog に起票してから `--mark-owner <key> --card <そのカード ID> --note "<何を決めてほしいか>"` (カードが閉じた後も残っていれば pending に戻る)。まとめて付けるときは `@data/page-quality/backlog-batches/UI-FIX-OTHER-20261031.txt`。本番確認は release 後の週次監査が行い、再検出されたら pending に戻って再起票される。
- **停止条件**: 本番 deploy・R2 push をしない。判断できない指摘は pending のまま残し、このカードを消さない。
- **完了条件**: 検証コマンドが exit 0 (全対象が pending でなく、done 以外は理由 note 付き)。

### [INCOME-SOURCES-LEDGER-01] stats47 の AdSense と KDP の月次受取を vault の収入台帳に載せ、給与以外の収入源の比率に入れる
タグ: [収益化] [種類:改善] [実行:対話] [起票:2026-10-30] [領域:管理]

- **起点 (2026-10-30 オーナー)**: 「複数の収入源を持ちたい」。vault の収入台帳 (`memos/家計/収入_2026.csv`) に stats47 の分は note 入金しかなく、AdSense の受取は 1 行も無く、KDP 入金は doboku-note と stats47 の ASIN が分かれていない。これでは stats47 が収入源として育っているかを家計の側から判断できない。
- **読者の課題／HARM**: 本カードは収益の計測 (M: Money は運営者自身の判断材料)。新しい打ち手ではない。KDP を増やすかの判断は既存の `KDP-EXPANSION-01`、doboku-note 分は doboku-note の DN-0920 が持つ。
- **次 (実行順)**:
  ① AdSense の月次の確定収益 (支払いレポート) を取得する経路を決める (管理画面の手動 export か、既存の計測の段に足すか)。
  ② KDP の月次レポートを ASIN で stats47 分と doboku-note 分に分ける (`products:sales` の台帳と突き合わせる)。
  ③ 月 1 回、①②の確定額を vault の収入台帳へ渡す (種別 `AdSense入金` を足すかは vault の家計SSOT の規約に従う。台帳の編集は vault 側の `kakei-curator` / `/log-kakei` の経路で行う)。
- **停止条件・禁止**: 見込み額・未確定額を確定として渡さない。欠測の月を 0 円にしない。
- **完了条件**: 直近 3 か月の AdSense と stats47 分の KDP の確定受取が vault の収入台帳にあり、給与以外の収入に占める stats47 の比率を月次で出せる。

### [INFRA-TIMELINE-01] 交通網の変遷 (高速道路・鉄道の時系列 GIS) を公開できる状態にし、見せ方を画像・動画・SNS へ展開する
タグ: [コンテンツ品質] [種類:制作] [実行:対話] [起票:2026-10-29] [領域:データ]

- **現状 (2026-10-29)**: `/geo/history/<expressway|railway|airport>[/<regionCode|NN>]` をローカルで実装済み。台帳 `packages/gis/src/infra-history/networks.ts`、生成 `build-infra-history.ts`、成果物は `.local/r2/app/geo/history/` のみ (R2 未反映)。N06・N05 の時系列は非商用だが、2026-10-29 にオーナーが事務局から電話で了承を得た (`PHONE_PERMISSION_2026_10_29`: 広告なしページでの地図表示 (加工データの配信を含む)・SNS)。電話も証跡として認める決まりに変えた (gis-data.md)。台帳は `public-approved` で `isInfraNetworkPublishable` が true (noindex 解除・R2 ガード通過)。ページは広告・アフィリエイトなしのまま (広告のあるページ `ad-page` は了承の範囲外)。
- **次 (実行順)**:
  ① (済み) 事務局の了承を台帳に記録した。
  ② R2 反映 (CI の `r2-publisher` 経由。承認のうえ)・サイトマップ追加・`/geo` からの導線を同じまとまりで行い、デプロイはオーナーの指示で 1 回。
  ③ 見せ方の展開: 全国・地方の年別静止画 (参考書籍『統計から読み解く色分け日本地図』の見開き型: 地図 + 凡例 + 総延長 + 順位表) と Remotion の時系列動画を同じ summary / topojson から作る。SNS 投稿は了承の範囲 (`sns`) に入っている。
  ④ 鉄道の開業年の 1950 年以前 (原典で 1950 に丸め) と、高速道路の延長が公表値 (供用延長) と一致しない点を、画面の注記以上に扱うか決める。
- **停止条件・禁止**: 了承の証跡 (日付・相手・範囲) を台帳に書く前に R2 へ置かない、検索に出さない。了承の範囲に `ad-page` が無ければ広告・アフィリエイト枠を足さない。年不明 (999) を推測で埋めない。
- **完了条件**: 本番の `/geo/history/expressway` と `/geo/history/railway` が 200・広告なし・地図表示で確認でき、R2 の manifest と summary の SHA がローカル生成と一致する。

### [CHART-FOOTER-MENU-TEST-01] ChartFooter のメニューのテストが「role=menu が見つからない」で落ちている
タグ: [UI・UX] [種類:不具合] [実行:sweep] [検証:npx vitest run src/components/charts/__tests__/ChartFooter.test.tsx] [起票:2026-10-29]

- **現状 (2026-10-29)**: `npx vitest run src/components/charts/__tests__/ChartFooter.test.tsx` (apps/web) で「固定IDのメニューを開くと操作ボタンと内容が相互に対応する」が `Unable to find role="menu"` で失敗する (4 件中 1 件)。交通網の変遷の作業中に見つけた。ChartFooter とそのテストはこの作業で触っておらず、直近の変更は 2026-10-28 の lyra の書き込み (5392747f7・410b2948e)。
- **次**: メニューを開く操作 (Base UI の DropdownMenu) がテスト環境で開かなくなった原因を、上の 2 コミットの前後でテストを流して切り分ける。
- **完了条件**: 同テストが 4 件とも通り、web の vitest 全件が緑。

### [INFRA-HISTORY-R2-PUBLISH-01] 交通網の変遷の R2 反映の残り (問いのページの計算結果・旧高速道路データの削除・再現手順の書き換え)
タグ: [インフラ・計測] [種類:改善] [実行:対話] [起票:2026-10-29] [領域:データ]

- **済み (2026-11-03)**: 3 網 (高速道路・鉄道・空港) と高速道路の接合部の 172 件を、新しい CI `.github/workflows/infra-history-publish.yml` で公式 ZIP から作り直して R2 `app/geo/history/{expressway,railway,airport}/` へ反映した (dry-run run 41576647868 をオーナーが承認 → 反映 run 41577740326。保存則は最大差 0.005 / 0.007 km・0 か所、公開ガード通過、公開 URL 200)。本番 /geo/history/* と /themes/roads の高速道路の節が地図を描くことを確認した。依頼は `data/infra-history-publish-requests.json` を develop へ push (apply=false は dry-run)。
- **残り 1 — 問いのページの計算結果** (`app/geo/questions/<問い>.json`、`build-geo-questions.ts`): N05・N06 の原典 ZIP から計算するので、問いのページが広告なしか・了承の範囲 (`packages/gis/src/infra-history/networks.ts` の電話の記録) に入るかを決めてから、同じ workflow に足す。`.claude/rules/r2-storage-design.md` の対応表にも `app/geo/questions/` を足す。
- **残り 2 — 旧高速道路データの削除**: テーマの節が独自の地図をやめたので、R2 `app/highway-history/` (stats.json・highway-sections.topojson) は読み手が 0。削除は `r2-maintenance.yml` の `RETENTION_TARGETS` に exact key で足し、dry-run → 承認 → 削除の順で行う。
- **残り 3 — 再現手順**: `GEO-QUESTION-DESIGN-01` と `INFRA-TIMELINE-01` の「別の PC で再現する手順」から「`.local` を作り直す」を外し、R2 から読む形に書き換える。
- **停止条件・禁止**: 原典 ZIP を公開バケットに置かない。`app/geo/` の広い prefix を同期しない。承認の前に反映・削除しない。
- **完了条件**: 問いの計算結果を反映する (または反映しないと決めて理由を残す)、`app/highway-history/` が R2 に残らない、2 枚のカードの手順が R2 前提になる。

### [GIS-SOURCE-PAGE-URL-01] 公式ページの URL が無い登録済み GIS 31 件に URL を足し、利用条件の区分名のずれを個別ページで確かめる
タグ: [インフラ・計測] [種類:不具合] [実行:sweep] [検証:cd packages/gis && npx vitest run src/mlit-ksj/__tests__/dataset-references.test.ts] [起票:2026-10-29] [領域:データ]

- **見つけた経緯 (2026-10-29)**: GIS 台帳の参照整合テスト (`dataset-references.test.ts`) を作ったところ、登録済み 31 件 (A10・A12・A13・A16・A17・A22・A27・A29・A31b・A32・A33・A38・A40・C02・C09・C23・N03・N07・P03・P04・P11・P12・P13・P14・P17・P18・P29・P35・P36・W01・W05) に `sourcePageUrl` が無かった。`geo:check-data-catalog` は同じ欠けをエラーにするが、R2 を読むため手動実行で、CI に載っていなかった。テストの `KNOWN_MISSING_SOURCE_PAGE` (縮小専用) に固定してある。
- **あわせて確かめること**: 公式利用条件の一覧 (`official-policy.ts`) は m250r6・m500r6 を commercial-ok としているが、2026-10-29 の個別ページはどちらも「オープンデータ (CC_BY_4.0)」。台帳は m250r6 が cc-by-4.0、m500r6 が commercial-ok で揃っていない。扱い (出典表示で商用可・公開可) は同じなのでテストは区分名の違いを許している。
- **次**: 各データの `KsjTmplt-<ID>-<年>.html` が 200 を返すことを確かめて `datasets.ts` に足し、テストの一覧から消す。区分名は個別ページに合わせる (一般規約より個別ページが優先 — gis-data.md)。
- **完了条件**: `KNOWN_MISSING_SOURCE_PAGE` が空で、上の検証コマンドが通る。

### [GIS-ATTRIBUTE-LEDGER-01] GIS の属性 (各データが持つ項目と意味) と区分を data/geo/ の JSON 台帳 + Schema に集約し、地図・凡例・吹き出し・集計がそこから引く形にする
タグ: [エージェント・SSOT] [種類:改善] [実行:対話] [検証:npm run check-datasets] [起票:2026-10-29] [領域:データ]

- **なぜ**: 属性の情報が 5 か所 (`GeoSourceField` in `packages/data-configs/src/business-plan/geo-source-pages.ts`・`packages/gis/src/mlit-ksj/classifications.ts`・`packages/gis/src/infra-history/networks.ts` の `attributes`・`registry.ts` の `prefectureSource` と未使用の `propertyMap`) に分かれ、`npm run check-datasets` の検査から外れている。実物を開いて初めて分かった例: 鉄道の現況 N02 の属性名は `serviceProviderType` (N05 は `N05_001`)、空港 N08 は 1 ファイルに区域 `N08_001〜018` と標点 `N08_019〜025` が混在、標点の `N08_021` は意味が未確認。決まりは memory `feedback_authored_ledgers_in_data`・`.claude/rules/data-storage.md` (前例 `data/themes/catalogs/<key>.json`)。
- **決定 (2026-10-29 オーナー)**: 台帳を 3 つに分ける。① 原典台帳 `data/geo/attributes/<dataId>.json` = 地物の種類・属性の役割・コード表 (公式の意味)・利用条件と了承の記録 (今は `networks.ts` の `PHONE_PERMISSION_2026_10_29` と `datasets.ts` の `usageTerms`)。② 主題の台帳 `data/geo/subjects/subjects.json` + Schema (作成済み・8 主題) = 表示名・区分のまとめ方・色・年の合わせ方・描いてよい範囲 (区分のまとめ方と色はこちらが正本)。③ 生成物の manifest (人が書かない)。`networks.ts` も最終的に①②から組み立てる。移行期間は `classifications.test.ts` の「移行期間」で一致を固定している。
- **方針**: 属性の意味は `data/geo/attributes/<dataId>.json` + `config/schema/geo-attributes.schema.json` (人・`gis-curator`)、コード表と区分は `data/geo/ksj/classifications.json` + Schema (共有コード表)、観測した属性の一覧は生成物 `data/geo/attribute-inventory.json` (パイプライン)、読み込み・型・判定関数は `packages/gis`。役割は固定の語彙 `name`・`startYear`・`endYear`・`category`・`relation`・`prefecture`・`identifier`・`measure`・`other` にし、読む側はすべて役割から引く。
- **手順 (この順で。各段で検証コマンドを通してから次へ)**:
  1. **観測を取る**: 取り込み (`run-pipeline.ts` / `acquire-public-ksj.ts`) が属性の一覧を manifest に書き出す。既存の公開 50 件は R2 の配布ファイルから一度だけ埋める (R2 は読むだけ)。`config/datasets.mjs` に `data/geo/attribute-inventory.json` を Schema 付きで足し、未整理の規模 (データ数 × 属性数) をカードに追記する。
  2. (2026-11-11 済み) **区分を移す**: `classifications.ts` の中身を台帳 `geo.ksj-classifications` (`data/geo/ksj/classifications.json` + Schema) へ移した (LEDGER-DB-UNIFY-01 の段 12b)。区分のまとめ方と色は主題の台帳 `data/geo/subjects/subjects.json` にも写しがあり、`classifications.test.ts` の「移行期間」のテストが一致を固定している。写しの統合は LEDGER-DB-UNIFY-01 の段 13 で判断する
  3. (2026-10-29 済み) GIS の ID を `config/datasets.mjs` の `REGISTRIES["ksj-datasets"]` に登録済み。`classifications.json` と `attributes/*.json` の dataId を `refs` で検査する。
  4. **属性の意味の型を決める**: Schema を作り、使っているデータ (N06・N05・N08・N02・単体ページで項目説明を持つデータ) から埋める。意味は製品仕様書から取り、文書名・版・確認日を残す。分からない属性は `meaning: "未確認"`。
  5. **突き合わせの検査を足す**: R2 なしのテストで、観測にあって台帳にない属性を縮小専用の一覧で固定し (`KNOWN_MISSING_SOURCE_PAGE` と同じ形)、台帳にあって観測に無い属性はエラーにする。pre-commit と CI (`test:packages`) に載せる。
  6. **読む側を役割から引く形に寄せる**: 交通網の `attributes`、`prefectureSource`、`GeoSourceField` を台帳の役割と説明から引く。項目の定義は JSON を data-configs と gis の両方が読み、data-configs には読み物の文章だけを残す。
  7. **既存の TS 台帳の扱いを決める (別の判断)**: `datasets.ts`・`registry.ts`・`networks.ts` を JSON + Schema へ移すかをオーナーが決める。移すなら `KsjDataId` の型の弱まりを Schema 検証と読み込み時の型で補う方法を先に示し、移さないなら data-storage.md に例外と理由を書く。
- **停止条件・禁止**: 製品仕様書で確かめていない意味を書かない (未確認と書く)。観測の生成物を手で直さない。区分やコードの意味を交通網・単体ページ側に複製しない。R2 へは書かない (観測は読むだけ)。手順 7 はオーナーの判断の前に着手しない。
- **完了条件**: `npm run check-datasets` が `data/geo/ksj/classifications.json`・`data/geo/attributes/*.json`・`data/geo/attribute-inventory.json` を Schema と `refs` で検査して通る。区分と役割を読む側がすべて台帳から引いている (`packages/gis` に区分のデータが残っていない)。突き合わせの検査が CI に載り、未整理の件数が数字で分かる。

### [UI-COMPONENT-CONSOLIDATE-01] 同じ役割の UI 部品を 1 つにまとめ、名前を「対象 + 役割」に揃える (推移・数値タイル・凡例・高速道路の時系列地図)
タグ: [UI・UX] [種類:改善] [実行:対話] [検証:npm run design-system:check -w apps/web] [起票:2026-10-29] [領域:サイト]

- **なぜ (2026-10-29 の交通網の変遷の作業で見つけたこと)**: 「数値 + 推移」という同じ役割に組み方が 4 つあり (地方財政 `LocalFinanceDashboard`・ランキング `RankingNationalAverageStat`・交通網 `InfraHistoryExplorer`・テーマの `KpiCard`)、ページごとに見た目と操作が違う。名前が作り方・大きさ (`Mini`・`Numeric`・`D3`) を表していて役割が分からず、似た部品が増える。カタログ `.claude/rules/chart-component-standards.md` も実物から古く、§2-D の `TrendSparklineCard` はリテラル検索で定義も呼び出しも見つからず、`stats-card` (KpiCard) も定義データからのリテラル参照が見つからなかった (動的な組み立ては未確認)。
- **使用箇所の実測 (2026-10-29、apps/web/src と packages の tsx。テストを除く)**:

  | 役割 | 今ある部品 | 呼び出し | 違い |
  |---|---|---|---|
  | 推移の線 | `MiniLineChart` (`@/components/charts/MiniCharts`) | `LocalFinanceDashboard` 2 か所 | 軸なし・比較の破線・useD3Tooltip・最後の点を強調 |
  | 推移の線 | `NumericTrendChart` (`@/components/charts/NumericTrendChart`) | `RankingNationalAverageStat`・`InfraHistoryExplorer` | 数値軸・暦年軸・選択年の印・`NumericDomainPolicy` |
  | 数値タイル | `StatTile` (`@/components/surface`) | 地方財政・地域データブック・テーマの指標カード・ランキングの詳細パネル・交通網 | バッジ・補足・子にチャート |
  | 数値タイル | `KpiCard` / `KpiCardClient` (`@/components/stat-charts`) | `DashboardComponentRenderer` 1 か所 | バッジ・増減。`StatTile` と役割が重なる |
  | 区分の凡例 | `ChartLegend` (`@/components/charts/ChartLegend`) | 地方財政・交通網・単体 GIS 地図 | inline / list・切り替え (`aria-pressed`) |
  | 区分の凡例 | `D3ChartLegend` (`packages/visualization/src/d3/components/shared`) | D3 の Bar・Line・Mixed・StackedArea の 4 チャート | 四角 / 線の印。切り替えなし |
  | 連続値の凡例 | `ChoroplethLegend` (visualization) | 都道府県地図・市区町村地図 | 色の濃淡で値の大小。**役割が違うので残す** |
  | 高速道路の時系列地図 | `HighwayTimelineMap` + `ThemeHighwayTimelineSection` (`@/features/highway-history`) | 道路テーマ (`theme-section-registry.tsx`) | R2 `app/highway-history/` を読む旧系統 |
  | 高速道路の時系列地図 | `InfraHistoryExplorer` の地図 (`@/features/infra-history`) | `/geo/history/expressway` ほか | 交通網の変遷。鉄道・空港も同じ部品 |

- **方針**:
  - まとめる基準は「役割と受け取るデータの形が同じ」こと。見た目が似ていても役割が違うもの (`ChartPanel` と `StatTile`、区分の凡例と連続値の凡例) はまとめない (カタログ §2-C「カードフレームの役割分担」の 2026-06-23 の誤判定の記録)。
  - 名前は「対象 + 役割」にする。作り方 (`D3`)・大きさ (`Mini`)・軸の種類 (`Numeric`) は名前に入れず、引数で表す。候補: 推移 = `TrendChart` (`axis`・`selectedYear`・`comparison` を引数に)、区分の凡例 = `CategoryLegend`、連続値の凡例 = `ScaleLegend`、数値タイル = `StatTile` (据え置き)。最終の名前は手順 1 の棚卸しのあとに決める。
  - 「数値 + 推移」の組み方は 1 つにする: `StatTile` の子に推移を置く形を正とし、パネルの中で数字を手で組む書き方をやめる。
- **手順 (この順で。各段で `npm run design-system:check -w apps/web` と、触った workspace の vitest related を通してから次へ)**:
  1. **棚卸し**: カタログ §2 の全部品の役割・受け取るデータの形・呼び出し箇所・まとめ先を表にしてこのカードへ追記し、カタログと実物のずれを洗い出す。`KpiCard` は `stats-card` を組み立てる経路を実行時の出力まで確かめ、使われているかを決める。
  2. **推移の線をまとめる**: `MiniLineChart` と `NumericTrendChart` を 1 つにし、軸・選択年の印・比較の破線・ツールチップを引数で切り替える (`useD3Tooltip` と `NumericDomainPolicy` を保つ)。呼び出し 4 か所を移し、旧名は再 export で残さず消す。
  3. **数値 + 推移の組み方を 1 つにする**: `RankingNationalAverageStat` の手組みを `StatTile` + 推移の部品に置き換える (隣の「上位3件」と高さを揃える要件は保つ)。`KpiCard` は使われていれば `StatTile` へ寄せ、使われていなければ消す。
  4. **区分の凡例をまとめる**: `ChartLegend` と `D3ChartLegend` を 1 つにする。置き場は依存の向きを確かめて `packages/components` か `packages/visualization` にする。
  5. **高速道路の時系列地図を 1 系統にする**: 道路テーマの `ThemeHighwayTimelineSection` を `/geo/history/expressway` への導線か同じ部品に置き換え、`features/highway-history` を消す (N06 の問題は `ROADS-THEME-N06-LICENSE-01` と同じ差分)。R2 の `app/highway-history/` の削除は、読み手が無いことを確かめ承認を得て `r2-maintenance.yml` で行う。
  6. **名前を揃え、戻らないようにする**: 決めた名前に変え、`check-design-system.mjs` に旧名の import を拒否する規則を足し、カタログ (§2-A〜2-D) と `.claude/rules/ui-components.md` を書き直す。
- **停止条件・禁止**: 役割が違う部品をまとめない。名前の変更だけを先に行わない (まとめる前に名前を変えると二度手間になる)。旧名を再 export で残さない。手順 5 の R2 削除は承認の前に行わない。見た目の変化 (余白・文字の大きさ) は右ペインで変更前と比べ、テンプレートの見本 (demos.shadcndashboard.dev) から外れていないか確かめる。
- **完了条件**: 推移・数値タイル・区分の凡例・高速道路の時系列地図が、それぞれ 1 つの部品になっている。カタログに載る部品と実物が一致する (無いものが載っていない)。旧名の import を `design-system:check` が止める。web の vitest 全件が通る。

### [GEO-OVERLAY-URL-01] 交通網と人口などを重ねる画面の URL と、問いの分析の置き場 (geo・ブログ・テーマ) を決めて url-policy に載せる
タグ: [コンテンツ品質] [種類:意思決定] [実行:対話] [起票:2026-10-29] [領域:サイト]

- **なぜ**: 重ね合わせは「主題 × 年 × 範囲」の組み合わせで URL が増えやすく、広告の判定 (`apps/web/src/lib/google-adsense/ad-free-paths.ts` のパス接頭辞) と公開の判定 (網ごとの `publication.status`) に関わるが、URL の正本 `apps/web/src/lib/url-policy.ts` は `/geo` 配下を管理していない。今の `/geo` の URL は `/geo/<分析>`・`/geo/layers/<レイヤー>`・`/geo/datasets/<dataId>`・`/geo/history/<網>/<範囲>`・`/geo/compare`。
- **決定 1 (2026-10-29 オーナー)**: 「見る重ね合わせ」は geo の仕事 (重ねて見せ、検算できる形まで)、因果の解釈はブログ・テーマ。重ねる単位は「主題」(`subject`、台帳 `data/geo/subjects/subjects.json`。描いてよい範囲 `scopes` もここ)。塗り分け (area) は同時に 1 つまでを URL の正規化で守る。
- **決定 2**: URL は `/geo/map?base=<背景>&subjects=<重ねるもの,…>&scope=<範囲>`。背景 (塗り分け) は `base=` の 1 つ、重ねるもの (線・点) は `subjects=`。背景を選んだらスライダーは全主題に値がある期間に絞り、塗り分けの色の基準は全国の全年で固定 (人口の 1980 年比増減率を既定の背景として実装済み)。
- **決定 3**: 公開するのは問いのページ (`/geo/<問い>`)。`/geo/map` は検索対象外の道具に下げる。問いのページの設計は `GEO-QUESTION-DESIGN-01`。
- **これまで (2026-10-29)**: `/geo/map` を `apps/web/src/features/geo-map/` に実装 (正規化・noindex・広告なし)。鉄道の現況 (N02) と地価の地点は「準備中」表示で外している。
- **未確定の方針 (オーナーの合意が要る)**: ① 単一網の時系列は `/geo/history/<網>/<範囲>` を正本として残し、重ね合わせ画面からリンクする。② 問いの分析は人が選んだ組み合わせだけを `/geo/<名前>` に 1 つずつ作る。③ 重ね合わせ画面は常に広告なし (クエリで非商用レイヤー N05・N06・C02 を足せるため、パスの判定では止められない)。④ 公開: 含まれるレイヤーのうち最も厳しい利用条件・公開状態でサーバーが表示可否を決める。⑤ 時間の軸: 人口 (国勢調査 5 年ごと・人口メッシュ 2020/2050 のみ) に該当年が無いときの扱いを決める。
- **問いの分析の置き場 (`docs/01_技術設計/03_情報設計.md` に従う)**: 正本 = `/geo/<分析>` (途中の地図・空間演算・検算・限界)。ブログ = 背景と読み方 (表を複製せず分析の段階へリンク)。テーマ = 結論が県別の値に収まるときだけ着地 (前例 `/themes/earthquake-exposure`)。`/geo` の分析は実分析 3 本以上・一次資料・方法・GA4・薄さの監査が揃うまでナビと検索に出さない。非商用の N05・N06 の時系列の地図・画像は事務局の回答 (`INFRA-TIMELINE-01` ①) までブログ・テーマに載せず、最初の分析は制約のない組み合わせ (N08・N02・e-Stat) で作る。
- **手順**:
  1. 上の未確定の方針をオーナーと確定し、このカードに決定として書き込む。
  2. `url-policy.ts` に `/geo` 配下 (分析・layers・datasets・history・map) の既知の URL・canonical・noindex の判定を足し、`src/__tests__/middleware.test.ts` と `.github/scripts/smoke-test-routes.sh` に代表 URL を足す。
  3. 重ね合わせ画面のクエリの型と正規化関数で、不正な値は 404 ではなく素の画面へ寄せる (canonical を保つ)。広告なし・公開判定をサーバーで行う。
  4. 地価の範囲別データ、問いの定義の台帳化、R2 への反映とデプロイ。最初の問いの分析を `/build-geo-analysis` で正本にし、ブログ 1 本とテーマからの導線を揃える。
- **停止条件・禁止**: 組み合わせごとに index 対象のページを作らない。非商用レイヤーを広告のあるページ (ブログ・テーマ・問いの分析) に載せない (了承の範囲に `ad-page` が記録されるまで)。年の合わない人口を黙って近い年で埋めない。
- **完了条件**: 方針がカードに決定として書かれ、`url-policy.ts` が `/geo` を管理し、middleware のテストと smoke に `/geo/map` と `/geo/history` の代表 URL が入っている。

### [GEO-QUESTION-DESIGN-01] 地域分析の「問いのページ」を、分析の型・問いの台帳・回遊・ナビまで設計し、試作 4 本を作り直す
タグ: [コンテンツ品質] [種類:意思決定] [実行:対話] [検証:npm run content:check] [起票:2026-10-29] [領域:サイト]

- **なぜ (2026-10-29 のオーナーとの議論)**: 「表示できるものを全部選べる画面」を 2 回作り込んでしまったので、公開する組み合わせページは問い → 分析 → 見せ方から設計する。試作 4 本で、① ページどうしのつながり、② サイト全体の中での位置 (左サイドメニューは「地域分析」1 項目だけ)、③ 分析の方法 (4 本とも「組に分けて推移を並べる」1 種類だけ) が未設計と分かった。
- **これまでの決定 (詳細は `GEO-OVERLAY-URL-01` の決定 1〜3)**: geo は重ねて見せ、検算できる形まで (因果の解釈はブログ・テーマ)。公開するのは問いのページ `/geo/<問い>` で、`/geo/map` は検索対象外。ページの順は 問い → 組の推移のグラフ (主役) → 地図 (補助) → 組の決め方 → 読み方の注意 → 言わないこと → あわせて見る → 出典の 1 行。重ねる単位は「主題」(subject)、台帳 `data/geo/subjects/subjects.json` + Schema。
- **試作 4 本 (すべて noindex)**: `/geo/ic-population` (IC の供用開始年で市区町村を 4 組 → 人口指数)、`/geo/ic-manufacturing` (IC までの距離帯 4 組 → 出荷額の割合)、`/geo/shinkansen-population` (駅の開業年 4 組。駅のある市区町村は 102 だけで 1 都市が組を左右する)、`/geo/airport-tourism` (空港の種別で県を 3 組 → 宿泊者数指数。統計が 2009〜2024 年しかなく開港の前後は比べられない)。計算は `packages/gis/src/geo-questions/scripts/build-geo-questions.ts` → `.local/r2/app/geo/questions/<問い>.json`、問いの定義は試作のため `apps/web/src/features/geo-questions/lib/questions.ts`、画面は `apps/web/src/features/geo-questions/`。
- **再現手順**: `node --import tsx packages/gis/src/infra-history/scripts/build-infra-history.ts --network all` → `build-expressway-joints.ts` → `build-geo-questions.ts` → `npm run dev:web`。会社の Windows PC では memory `proxy-preload-for-fetch-scripts` の preload を先に読ませ、R2 の中継 (`apps/web/scripts/r2-dev-gateway.ps1`) は許可を変えたら dev を起動し直す。
- **決めること (この順で。各段の決定をこのカードに書いてから次へ)**:
  1. **分析の型を決め、4 つの問いに割り当てる**。候補: 開通を起点に揃える (イベントスタディ)、似た地域と比べる (差の差)、相関 (距離と増減率)、時系列の連動 (ラグ)、位置関係 (バッファ・到達時間・空間的自己相関)。型の一覧と名前、型ごとの検算 (途中の結果と保存則)、図の種類を決める。市区町村・距離との相関は新しく作る (都道府県は既存の `app/correlation/`)。どの型でも示すのは計算と並べた結果まで。
  2. **問いの台帳の形を決める**: 問い・系統・分析の型・入力・組の決め方・読み方・言わないこと・関係を `data/geo/` の JSON + Schema に置き (memory `feedback_authored_ledgers_in_data`)、`questions.ts` をここへ移す。
  3. **回遊を既存の台帳に載せる**: `data/content/` (`npm run content:sync` / `content:check`) に問いのページを登録し、`uses`・`explains`・`themeContext`・`geo` の関係を張る。表示は既存の右レール・回遊の部品を使う。
  4. **ナビを決める**: 左サイドメニューの「地域分析」を開閉できるグループにし、`/geo` のハブで系統別に問いを並べ、問いのページでは同じ系統の問いを右レール (狭い画面は本文の下) に出す。
  5. 1〜4 に合わせて試作 4 本を作り直し、右ペインで見ながら調整する。
- **関連カード**: `GEO-OVERLAY-URL-01`、`GIS-ATTRIBUTE-LEDGER-01`、`UI-COMPONENT-CONSOLIDATE-01`、`INFRA-TIMELINE-01`。
- **停止条件・禁止**: 表示できるものを並べるだけの組み合わせページを公開しない (問いが先)。因果を断定する文言をページに書かない。問いの定義を feature の中に置いたまま公開しない (台帳へ移してから)。組の計算の途中結果 (どの市区町村をどの組にしたか) を捨てない。
- **完了条件**: 分析の型と問いの台帳が決まって `data/geo/` にあり、4 つの問いのページが台帳から作られ、`data/content/` の関係で関連ブログ・ランキング・テーマとつながり (`npm run content:check` が通る)、サイドメニューと `/geo` のハブから辿れる。

### [ROADS-THEME-N06-LICENSE-01] 道路テーマの高速道路タイムライン地図 (N06 の時系列) を、広告のあるページから外すか条件を確かめる
タグ: [収益化] [種類:不具合] [実行:対話] [起票:2026-10-29] [領域:データ]

- **見つけた経緯 (2026-10-29)**: `/themes/roads` の「高速道路ネットワークの広がり（1962→2020）」(`apps/web/src/features/highway-history/`) は N06 高速道路時系列の開通年 (`N06_002`) で年別の区間数・延長 (`app/highway-history/stats.json`) を出している。N06 の公式ページは「時系列データとして使用する場合：非商用」で、テーマページは広告・アフィリエイトを載せる。生成スクリプトは git に見つからず (`stats.json` は 2026-05-24 生成)、原典は 2020 年版。
- **次**: INFRA-TIMELINE-01 ①の問い合わせに含めて条件を確かめる。回答まで、テーマのセクションを `/geo/history/expressway` への導線に置き換えるか、最新年の現況表示 (CC BY 4.0 の範囲) だけに縮めるかをオーナーが選ぶ。
- **停止条件**: R2 の `app/highway-history/` の削除は、読み手を外したあと承認を得て `r2-maintenance.yml` で行う。
- **完了条件**: 広告のあるページで N06 を時系列として使う箇所が無いか、使ってよい根拠 (了承の範囲に `ad-page`) が台帳にある。

### [GSC-DEMAND-REPORT-01] 「何にアクセスが集まっているか」に記録 1 枚で答えられるよう、GSC 記録をカテゴリ別・長期で集計して残す
タグ: [インフラ・計測] [種類:改善] [実行:対話] [起票:2026-10-29] [領域:管理]

- **きっかけ (2026-10-29)**: 「アクセスの多いキーワード」を `data/gsc/snapshots/2026-W42/queries.csv` を 7 日分と誤読して答え、正しい答えまでに R2 の `item.json` を 842 件取りに行った。記録側の欠け: ① キーワード表の捕捉率が記録されていない (queries.csv のクリック合計 3,048 は全体 13,207 の 23%。pages.csv は全体とほぼ一致) ② 明細 CSV に期間が無く、28 日分しか保存されない (確定 7 日の明細が無く前週比較ができない) ③ ページ→カテゴリの列が無い (ブログは frontmatter の `tags: []` でカテゴリが無い。query×page も無い) ④ `history*.csv` はサイト合計だけ。明細 (`data/gsc/snapshots/`) は 2026-10-29 のオーナー判断で削除しないので、W17 以降から後で集計できる。
- **W42 で出した結果 (参考・28 日)**: ランキングのクリック 6,736 のうち経済 42% (ほぼ全部が家計調査の食品消費量)、社会保障・衛生 11%、教育・スポーツ 10%、鉱工業 6%。
- **次 (実行順)**:
  ① W17 以降の queries/pages から、重ならない 28 日窓 (4 週おき) でカテゴリ別・セクション別 (ranking/blog/areas/municipalities…) の月次集計を作り、`data/gsc/` に長期の集計 CSV として保存する (台帳 `config/datasets.mjs` に先に 1 行足す)。
  ② `fetch-gsc-snapshot.mjs` / `summary.json` / LATEST.md に、キーワード表の捕捉率 (query 合計 ÷ 全体クリック) と明細の集計期間を書く。確定 7 日分の query/page 明細も保存する。
  ③ 週次取得のたびに、ページ→カテゴリ (ranking は `categoryKey`、ブログは `rankingRefs` の指標のカテゴリまたは新設のカテゴリ) を付けたカテゴリ別集計を作り、①の CSV に追記する。
  ④ 要約 `data/gsc/DEMAND-LATEST.md` を週次で生成する: 長期・直近 28 日・前週比のカテゴリ順位、上位テーマ、上位ページ、表示が多いのにクリックが少ない語、捕捉率・期間の注意書き。
  ⑤ `gsc-analyst` agent と `/weekly-review` に「アクセス・需要・人気の質問はまず DEMAND-LATEST.md を読み、生の queries.csv から直接答えない」と 1 行足す。
- **停止条件**: 伏せられた検索語を推定で埋めない。28 日窓が重なる週どうしを前週比と呼ばない。GSC の明細を寿命 policy に戻さない (オーナー判断)。
- **完了条件**: 新しいセッションで「アクセスの多いキーワード／カテゴリは」「長期の傾向は」と聞いたとき、DEMAND-LATEST.md と長期の集計 CSV だけを読んで、期間・捕捉率付きで答えられる。W17 以降のカテゴリ別の推移が記録に残っている。

### [CI-LIVE-R2-TEST-FLAKE-01] 単体テストと PR のビルドが公開 R2 の一時的な不調で落ちる
タグ: [インフラ・計測] [種類:不具合] [実行:対話] [起票:2026-10-29] [領域:サイト]

- **証拠 (2026-10-28 PR #1194)**: Cloudflare の「Network Performance Issues in Ashburn, IAD」の間 (cloudflarestatus.com、2026-10-28 確認)、PR の CI が 6 回落ちた。Unit Tests は `packages/product-factory` のテストが公開 R2 を読む前処理で `PackSnapshotFetchError`、Build Check は前回の snapshot の HTTP 500・タイムアウトと静的ページ生成の 15 分上限で取り消し。前回の snapshot の 5xx は `a74b8e9ff` で読み直すようにした。
- **次**: ① 単体テストが本番の R2 に依存している箇所を数え、固定の fixture へ置き換えるか、ネットワークを要するテストを別ジョブに分ける ② Build Check の R2 読み取りの件数と所要を測り、15 分の上限の妥当性を決める。
- **完了条件**: 公開 R2 が不調でも単体テストが落ちない (fixture 化)、またはネットワーク依存のテストが必須チェックから外れている。

### [BLOG-PUBLIC-REVIEW-MD-CLEANUP-01] 公開 R2 に残る過去記事の review.md (審査結果) を消す
タグ: [コンテンツ品質] [種類:不具合] [実行:対話] [起票:2026-10-29] [領域:サイト]

- **証拠 (2026-10-28)**: 公開の CI は記事フォルダを丸ごと公開 R2 へ写していたので、`app/blog/<slug>/review.md` が公開 URL から読める (`livable-prefecture-composite-ranking`・`municipality-population-change-census-2025` で HTTP 200)。`380042ccd` でこれからの公開はステージから外したが、既に上がった分は残っている。指摘は台帳 `data/blog/critic-findings/` に残っているので消しても情報は失われない。
- **次**: ① 公開 R2 の `app/blog/*/review.md` (と `research.md`・`*.prompt.txt`) を列挙する ② `r2-retention.ts` に exact key の target を足し、`r2-maintenance.yml` の dry-run → 承認 → 削除で消す (削除の唯一の入口)。
- **完了条件**: 公開 R2 に review.md・research.md・prompt が 0 件。

### [BLOG-ALLJSON-MISSING-BODY-01] 記事一覧 all.json に載っているのに R2 に本文が無い 6 記事を調べる
タグ: [コンテンツ品質] [種類:不具合] [実行:sweep] [起票:2026-10-29] [領域:サイト]

- **証拠 (2026-10-28)**: 本文の版の初回退避 (`archive-blog-articles.mjs --all`) で、`app/blog/all.json` の 619 記事のうち 6 記事は `app/blog/<slug>/article.md` が無かった (未公開として数えた)。一覧からリンクされていればページが空か 404 になる。
- **次**: 6 記事の slug を出し、本番のページの応答と all.json の掲載理由 (公開フラグ・別の置き場) を確かめて、本文を戻すか一覧から外す。
- **完了条件**: all.json の全記事に R2 の本文がある。

### [WEB-VITEST-SLOW-FILES-01] web の vitest 全件 (約 10 分) のうち遅いファイルを測り、重い import のモックなどで縮める
タグ: [インフラ・計測] [種類:改善] [実行:対話] [検証:cd apps/web && npx vitest run --reporter=json --outputFile=/tmp/vitest-web.json] [起票:2026-10-28] [領域:サイト]

- **経緯 (2026-10-28)**: web の vitest 全件 (364 ファイル・2,762 件) が Mac (メモリ 8GB・2 並列) で 1 回 10 分ほどかかり、develop へ入れる前に 4 回回して開発が止まった。オーナーから「CI とかテストとかが長すぎて開発の速度が遅くなってないだろうか」と指摘された。進め方 (開発中は `vitest run --related`、全件は develop 直前の 1 回) はメモリ `feedback_test_and_ci_wait_budget` に残した。どのファイルが時間を食っているかはまだ測っていない。
- **次**: ① JSON reporter でファイルごとの所要時間を出し、上位 20 件と、所要の大半が import (transform) かテスト本体かを分ける ② import が重いもの (R2 reader・全指標 registry・全テーマ定義を丸ごと引くもの。例: `sitemap-index-parity.test.ts` は import だけで Windows 25 秒) はモックか対象を絞った import に替える ③ jsdom が要らないテストに `// @vitest-environment node` を付ける (pre-commit の scripts 系で 152 秒縮んだ実績がある。`local-environment.md`)。テストが確かめている内容は変えない。
- **禁止**: テストを消して速くしない。並列数を上げてメモリ上限の再起動を起こさない (2 並列は `config/local-resources.json` の予算)。
- **完了条件**: 同じ Mac で全件の所要が測定前より短くなり、前後の所要と上位ファイルの一覧を本カードか PR に書いてある。

### [DESIGN-CHECK-CLASSNAME-EXPR-01] design-system:check の上書き禁止の規則が、cn() やテンプレート文字列で書いた className を見ない
タグ: [UI・UX] [種類:改善] [実行:対話] [検証:npm run design-system:check -w apps/web] [起票:2026-10-28] [領域:サイト]

- **証拠 (2026-10-28)**: `panel-no-text-size-override`・`link-row-no-size-override`・`disclosure-no-look-override`・`empty-state-no-look-override` は `className="…"` と `className={"…"}` だけを読む。`className={cn(…)}` やテンプレート文字列で同じ上書きを書くと素通りする。`lyra-dead-caller-class` も別ファイルの定数 (`*.palette.ts`) と `contentClassName` など className 以外の属性を追わない。部分的な上書き (`p-0` が lyra の `px-2.5` と並んで残る) も数えない (`GeoLandslideSummary` で実例。同日に `p-0!` へ直した)。
- **次**: `cn(` の引数の文字列リテラルとテンプレートの固定部分も読む共通の取り出し関数を `check-design-system.mjs` に作り、上の規則で共有する。
- **完了条件**: 各規則に `cn(…)` で書いた上書きを 1 件入れると落ちる。既存の違反は 0 件か理由付きで残す。

### [STATIC-PAGE-BODY-TEXT-SIZE-01] プライバシーポリシーと運営者情報の本文が 12px から始まり、パネル本文 14px の仕様と合わない
タグ: [UI・UX] [種類:改善] [実行:対話] [起票:2026-10-28] [領域:サイト]

- **証拠 (2026-10-28)**: `apps/web/src/app/privacy/page.tsx`・`about/page.tsx` の本文は `TEXT_STYLE` (`text-xs md:text-sm`) で、スマホ幅では 12px。`docs/01_技術設計/04_デザインシステム.md`「見本の実測値と部品の仕様」のパネルの中の文字は 14px。
- **次**: `TEXT_STYLE` を消し、パネルの既定 (14px) に任せる。利用規約も同じ書き方をしていないか確かめる。
- **完了条件**: 3 ページの本文が 390px と 1440px で 14px (描いた画面で測る)。

### [LINE-GRID-COLUMN-01] 描いた画面の線の格子の検査を定期実行に載せる
タグ: [UI・UX] [種類:改善] [実行:対話] [検証:npm run ui-theme:line-grid -- http://127.0.0.1:3200] [起票:2026-10-28] [領域:サイト]

- **経緯**: 2026-10-28 に本文の列全体を 1 本の線の格子にした (`ShellColumn`・`PanelGrid`、`@/components/layout`)。28 画面 × 1440・390px で違反 0 件 (`npm run ui-theme:line-grid`)。右レールは格子にしない (同日オーナー決定。`docs/01_技術設計/04_デザインシステム.md` の「線の格子」の行)。検査の画面に検索を足したところ、検索結果がカードを空けて並べるだけで格子になっていなかった (同日に直した)。検査の一覧に無い画面には同じ取りこぼしが残りうる。
- **次**: `npm run ui-theme:line-grid` は手元の本番ビルドに流す検査で、定期実行に載っていない。週次の page-quality (本番 URL を Playwright で巡回する job) に同じ判定を足すか決める。足すなら全ルートの代表 URL (`DEFAULT_PAGES`) を page-quality の一覧と揃える。
- **完了条件**: 週次の結果に違反件数が出る (または載せない理由を本カードに書く)。
### [BLOG-QUESTION-ANSWER-01] 「〜が最も少ない県はどこ」の質問形の検索に、答えを冒頭に置いた記事で応える
タグ: [コンテンツ品質] [種類:制作] [実行:対話] [起票:2026-10-28] [領域:サイト]

- **証拠 (GSC 2026-W42 のクエリ・`data/gsc/snapshots/2026-W42/queries.csv`)**: 「病院数が最も少ない都道府県はどこ」1,869 表示をはじめ、病院が少ない県を問う言い回しが 12 通りで計約 7,800 表示ある。ブログには一般病院数の分布に答える記事が無い (公開 619 本の題・説明に「病院数」0 件。近いのは病床利用率と市町村の記事)。ほかに「2023年現在 全国で最も市町村の数が少ない都道府県」581 表示など。
- **案**: 答え (県名・値・順位) を冒頭 1 文に置き、人口あたりで並べ替えると順位が逆転するか、を本文の主題にする型を作る。AI の概要表示で答えだけ取られても、人口あたりの逆転と図は記事に来ないと分からない構成にする。headless の型ガイド (`ARCHETYPE_GUIDE`) に足し、トピックは GSC の質問形クエリから決定的に拾う。
- **次**: ① 一般病院数と人口 10 万人あたりの一般病院数で 1 本書き、4 週の表示とクリックを記録する ② 質問形クエリを抽出するスクリプトを topic-queue の入力に足すかを、その結果で決める。
- **完了条件**: 1 本が公開され、4 週の GSC 実測が記録され、型を広げるか決まっている。

### [BLOG-WHITEPAPER-METRIC-GAP-01] 白書が地域差を論じているのに記事が無い指標で書き、データの無い論点は取り込み元を決める
タグ: [コンテンツ品質] [種類:制作] [実行:対話] [起票:2026-10-28] [領域:サイト]

- **出どころ (2026-10-28)**: NotebookLM「最新の白書」に地域差の論点を聞いた回答 15 件 (消防白書・交通安全白書・警察白書・こども白書・高齢社会白書・中小企業白書・防災白書 など。令和 6〜7 年度)。
- **指標はあるが記事が無いもの**: 救急車の病院収容までの時間 (`ambulance-hospital-arrival-time`・題に「救急」を含む記事 0 本)、人口あたり交通事故死傷者 (`traffic-accident-casualties-per-population`)、住宅の耐震改修 (`earthquake-renovation-rate`)、保育の待機 (`nursery-waiting-children-count`)。
- **データが無いもの**: 都道府県別の特殊詐欺の認知件数・被害額 (警察白書)、放課後児童クラブの待機児童 (こども白書)。取り込むなら一次資料 (警察庁・こども家庭庁の公表表) と年次・単位を確かめる。
- **次**: ① 指標のある 4 件で topic を作り、`/notebooklm-research` の調査段で白書の背景を research.md に集めてから headless で書く ② データの無い 2 件は取り込み元と更新頻度を調べ、`MUNI-RANKING-EXPANSION-01` と同じ手順で取り込むか見送るかを決める。
- **完了条件**: 4 本が審査 PASS で outbox にあり、2 件の取り込み可否が書かれている。

### [BLOG-RELEASE-CALENDAR-01] 統計の公表日に合わせて記事を更新・新規公開する暦を作る
タグ: [コンテンツ品質] [種類:改善] [実行:対話] [起票:2026-10-28] [領域:サイト]

- **証拠**: 「健康寿命 都道府県 ランキング 2026」479 表示・「平均寿命 … 2026」226・「納豆消費量 ランキング 2026」728 など、年付きの検索がある (GSC 2026-W42)。一方、家計調査の品目別は 2025 年分の公表 (2026 年 2 月) から 8 か月たっても 2024 年のまま (`KAKEI-EXPANSION-02`)。2025 年国勢調査は確定値まで入り、記事も 3 本出ている (公表に追いついた例)。
- **案**: 主要統計の公表日 (家計調査の年報 2 月・人口推計 4 月・国勢調査・学校保健統計の秋〜冬・人口動態など) を e-Stat の公表予定 (https://www.e-stat.go.jp/release-calendar) から台帳にし、公表の翌週に「指標の年次更新 → 既存記事の数値と図の更新 → 新しい年の記事」を回す。新規記事を増やすより、検索実績のある既存 URL を最新年にする方を先にする。
- **次**: ① 台帳の置き場を `data-storage.md` で決め、主要 10 統計の公表月を入れる ② `data/blog/stale-data-years.json` と突き合わせ、公表済みなのに古い年の記事を週次に出す。
- **完了条件**: 台帳があり、公表済みで古い年のままの記事の一覧が週次で出ている。

### [BLOG-LIVABILITY-PURPOSE-SERIES-01] 「住みやすい県ランキング」を目的別 (子育て・老後・一人暮らし・移住) に分けたシリーズを作るか決める
タグ: [コンテンツ品質] [種類:意思決定] [実行:対話] [起票:2026-10-28] [領域:サイト]

- **証拠 (GSC 2026-W42)**: 「住みやすい県ランキング」2,229・「住みやすさランキング 都道府県」451・「住みやすい都道府県ランキング」418 など、計約 3,700 表示。公開済みは総合の 1 本 (`livable-prefecture-composite-ranking`・2026-10-23)。
- **案**: 目的ごとに指標と重みを明示した 4 本 (子育て・老後・単身・移住)。重みと指標は記事内に書き、読者が組み替えられることを示す。市区町村の子育て (`MUNI-KOSODATE-RANKING-01`) と指標を揃える。
- **決めること**: 総合の 1 本の 4 週の実績を見てから作るか、今作るか。合成指標は恣意的に見えるので、重みの根拠を書けない目的は作らない。

### [BLOG-REGION-PUBLISHED-FIX-01] 公開済み 10 本の地方のくくりと題の約束の誤りを直す
タグ: [コンテンツ品質] [種類:改善] [実行:対話] [検証:node .claude/scripts/blog/quality-gate.mjs <slug>] [起票:2026-11-04] [領域:サイト]

- **背景 (2026-11-04)**: `region-claim-lint.mjs` と `title-promise-lint.mjs` を公開済み 767 本に掛けると、blocker の形が 10 本で見つかった。検出は前後の文ごと全件読み、「新潟など東北」「内陸県の山形」のような本物の誤りだった。gate が止めるのは再公開の時だけなので、公開中の記事は直るまで残る。
- **対象**: `assembly-answer-chatgpt-5steps` `croquette-consumption-expenditure-prefecture-gap` `hospital-bed-utilization-map` `nagano-food-culture` `pork-consumption-quantity` `school-nonattendance-pattern` `sugar-consumption-prefecture-gap` `tochigi-food-culture` `tuna-consumption-quantity-vs-annual-new-inpatients-general` `yamagata-food-culture`
- **完了条件**: 各記事の quality-gate で `地方のくくり` と `題の約束` の blocker が 0。`/brushup-blog --target article` で本文を直す。

### [BLOG-HEADLESS-AUTHOR-01] ブログ執筆を headless `claude -p` のバッチに移し、本数を増やしながら 1 本あたりの費用と通過率を記録する
タグ: [コンテンツ品質] [種類:改善] [実行:対話] [検証:npx tsx packages/ai-content/src/scripts/write-blog-headless.ts --dry-run] [起票:2026-10-28] [領域:サイト] [進行中]

- **背景 (2026-10-28 オーナー指示)**: 「Claude のトークン消費を節約してブログをもっと展開したい」。Agent tool (article-writer / blog-critic) は subagent が CLAUDE.md と rules を毎ターン読み、是正で約 10 万トークン/本・旧 CI で $8.2/本だった。ランキング解説の headless 経路は $0.51/件 (`ranking-content-standards.md`)。
- **実装 (branch `claude/determined-newton-2d077c`)**: `packages/ai-content/src/scripts/write-blog-headless.ts` + `src/services/claude-cli-runner.ts`。準備 (`generate-blog-article.ts`) が作った prompt を sonnet・effort low の `claude -p` で書き、`quality-gate.mjs` + `ci-factual-gate.mjs` → 別プロセスの critic (`buildBlogCriticPrompt`・本文だけ) → REVISE なら指摘と原稿を author に返して 1 回書き直す。記録は `data/blog/headless-runs.csv`。公開はしない (`published:false` のまま)。手順は `/write-prepared-article` の「headless 経路」。
- **量産の入口 (2026-11-04)**: `npm run blog:batch` に一本化した (対象選定〜`--ingest`・一覧。`blog-quality-standards.md`「量産バッチ」)。書く前の材料・書く価値の判定・地方と題の検査も入れた。
- **実測 (2026-10-28 の要約、明細は `data/blog/headless-runs.csv`)**: 5 本・15 run で、1 本あたり (書き直し 1 周込み) 1.8〜4.9 万トークン・$0.10〜0.27。審査 prompt に書き手の制約と重大度の基準を書き verdict を blocker の有無からコードで決めるよう直した後は 2/4 PASS・PASS 1 本 $0.32 (Agent tool 経路の約 1/25)。残る blocker は記事の事実誤り (山口と岡山を隣接と書く・北海道を東北に含める・題が「なぜ」を約束して答えない) と、審査が順位の整合を疑う誤判定。費用は CLI の `total_cost_usd` (API 換算・Pro/Max の OAuth では実請求ではない)。
- **次 (実行順)**: ⓪ author prompt (`blog-article-prompt.ts`) に「題で『なぜ』を約束したら本文で答える。答えられないなら題を変える」と、地方区分・隣接の言及は prompt に渡した区分だけを使う指示を足す (残る blocker の多数) ① 型B 以外 (A / D2 / F) で 3〜5 本ずつ回し、型ごとの通過率と費用を CSV に貯める ② 通過率が低い型は critic の指摘を読んで author prompt (`blog-article-prompt.ts`) 側を直す (critic は緩めない) ③ PASS 分を `--ingest` で確定して develop へ push する (公開は週次計画の本数で人が決める)。
- **完了条件**: 型ごとに 5 本以上の実測が CSV にあり、既定の運転設定 (型・本数・rounds) を skill に書いている。

### [MUNI-WARD-MODE-READERS-01] 自前の統合版の地図 (`_city_dc`) を読む残り 2 か所を、データの単位を確かめてから WardMode の地図へ移す
タグ: [コンテンツ品質] [種類:不具合] [実行:対話] [起票:2026-10-28] [領域:データ]

- **背景**: `<県>_city_dc.topojson` は 23 区を特別区部 13100 の 1 つにまとめる。移動フローの中継 `apps/web/src/app/api/mf-topo/[code]/route.ts`、Remotion の人口コロプレス `apps/remotion/src/features/population-choropleth/usePopulationData.ts`、`apps/remotion/scripts/fetch-municipality-net.ts` を `fetchMunicipalityTopologyForWardMode` / `deriveWardModeTopology` (merged、Remotion 向けの入口 `@stats47/gis/ward-mode-topology`) へ 2026-10-28 に移した (tsc・vitest 通過)。
- **未検証**: Remotion の人口コロプレスは値のファイル (`blog/population-choropleth/data/population-ratio-tokyo.json`) が R2 に無いため描画を確かめていない。移動フローの地図は localhost で見ていない (データの結び付きはスクリプトで確認済み)。
- **次**: ① 本番反映後、`/api/mf-topo/13` が 23 区を返し、移動フローの東京の地図で区ごとに色が付くかを確かめる ② 読み手が 0 になったので `_city_dc` の R2 からの削除を承認制で行う (`.claude/rules/r2-storage-design.md`「市区町村の境界」)。
- **完了条件**: `_city_dc` を読むコードが 0 件で、2 か所の地図で地域と形が対応している。
- **確認が要る (11-03 の棚卸し)**: 「`_city_dc` を読むコードは 0 件」とあるが、`git grep -l _city_dc` で `apps/web/src/app/api/mf-topo/[code]/route.ts` と `apps/remotion/src/features/population-choropleth/usePopulationData.ts` が出る。コメントだけか実際に読むかを確かめる

### [METRIC-CLINIC-PER-100K-UNIT-01] 人口10万人当たりの一般診療所数・病院数が、題名と単位では実数に見え、さらに人口換算を重ねられる
タグ: [コンテンツ品質] [種類:不具合] [実行:sweep] [起票:2026-10-28] [領域:データ]

- **済み (2026-11-13・`536a76380`)**: e-Stat 公式の算式表で `#I0910105` が「一般診療所数（人口10万人当たり）」であることを確かめ、`general-clinic-count-per-100k` から人口・面積の換算を外して description に分母を書いた。`ssds-denominator-contract` のテストに追加した。一般病院数は既に直っていた。title と unit は、リポジトリの設計 (unit は素の単位、分母は subtitle と description) に合わせて変えていない。
- **残り**: subtitle が「人口10万人当たり」の 62 指標のうち 48 指標が `normalizationOptions` を持ち、同じ二重の換算を選べる (2026-11-13 の実行役の集計。指標の一覧は未作成)。SSDS の `#` 項目で分母を持つ指標が換算の選択肢を持つと落ちる検査を `validate:config` か `ssds-denominator-contract` に足し、48 指標を直す。分母は公式の算式表で確かめる (memory `feedback_ssds_denominator_evidence`)。
- **未確認**: topic-queue の `isPopulationCountMetric` と `size-pair` の誤判定が、今回の修正で消えたかは実測していない。
- **完了条件**: 分母を持つ指標が換算の選択肢を持つと検査が落ち、現物で通る。

### [METRIC-HOUSEHOLD-ASSET-SUBTITLE-01] 家計の金融資産と農家総所得の指標に「1世帯当たり」の印が無く、総額と判定される
タグ: [コンテンツ品質] [種類:不具合] [実行:対話] [起票:2026-10-28] [領域:データ]

- **済み (2026-11-13・`fb22ef468`)**: 金融負債残高・預貯金・有価証券保有額・農家総所得の subtitle に分母を足し、`isMoneyTotalMetric` が総額と判定しないことをテストで固定した。
- **残り 1 (手元で済む)**: 金融負債残高・預貯金・有価証券保有額 (`data/metrics/financial-debt-balance.ts` ほか) は 1 世帯当たりの値なのに、`normalizationOptions` に人口・面積あたりの換算が残っている。農家総所得と同じく空にする。
- **残り 2 (旧 `METRIC-FARM-INCOME-DEFS-01`・一次資料の確認が要る)**: 農業所得割合・農外所得割合の分母を確かめる (北海道 2003 年度で 46%+15.1%=61.1%)。e-Stat の「年計」に対して `yearFormat: fiscal` と seoTitle の「年度」のどちらが正しいかを、農林水産省の調査の年区切りで決める。農家総所得の「1 戸当たり」も e-Stat の項目定義に明記が無く、値の桁からの読みなので、同じ資料で確かめる。確認できるまで note の「未確認」を残す。
- **完了条件**: 3 指標に二重の換算の選択肢が無く、2 指標の分母と年区切りが一次資料で確かめられ、seoTitle の年表記がそれと一致している。

### [BLOG-STACKED-MOBILE-WEB-01] 積み上げ棒のスマホ用 SVG がサイトで使われない
タグ: [コンテンツ品質] [種類:不具合] [実行:sweep] [起票:2026-10-28] [領域:サイト]

- **済 (2026-10-28)**: svg-builder の積み上げ棒に `layout: "mobile"` を足し、`apps/web/src/features/blog/lib/responsive-chart.ts` が `-stacked`・`-breakdown`・`-composition` も 639px 以下で `-mobile.svg` に切り替える (読み込めなければ横長に戻す。テストで固定)。
- **残り**: ② 公開済みの積み上げ棒 (約 4 枚) を作り直して前後を比べ、R2 へ上げる (承認が要る)。実機・localhost での見た目は未確認。
- **完了条件**: 積み上げ棒の `-mobile.svg` がある記事で、639px 以下の表示がスマホ用に切り替わる。

### [CHART-TYPE-ROLLOUT-01] 統計の図を種類ごとに 1 つの型から作り、サイト・note・SNS で同じ型を使う
タグ: [コンテンツ品質] [種類:改善] [実行:対話] [起票:2026-11-04] [領域:サイト]

- **ゴール (2026-11-05 オーナー決定)**: 統計の図は、種類ごとに 1 つの型から作られ、サイト・note・SNS で同じ型を使う。型から外れた図は機械が止める。11-04 のゴールは型の統一・値の正しさ・記事への反映を 1 つにしていて記事の修正へ広がったので、型の統一だけに絞った。
- **完了の判定**: ① 図の種類ごとに型が 1 つあり、管理画面で見本を確かめられる ② 各媒体の生成処理がその型を使い、旧い描画処理が残っていない ③ 新しく作る図が型から外れると検査で止まる。
- **完了に含めないもの**: 公開中の記事の差し替え (`NOTE-FIGURE-ROLLOUT-01`)、記事の修正 (`NOTE-FIGURE-FIX-01`)。値の検査 (`audit-chart-axes.ts`・`data/note/body-figures.json`) は週次で動くものをそのまま使い、作業を足さない。
- **型を持つ判断 (2026-11-06 オーナー決定)**: レーダー・サンキー・ウォーターフォールも型として持つ。内容から型を選ぶ入口と、型から使える内容を探す入口の両方があるので、公開中の枚数の少なさでは外さない。型の台帳 `image-templates.json` の `fit` (`answers` = 答える問い、`needs` = 必要なデータの形) が両方の入口の情報を持つ。`fit` から候補の内容を機械で探す仕組みはまだ無い。
- **済み (2026-11-06 時点)**: 型は全 15 種の見本がオーナーの確認を通った (未使用 3 を除き決定済み)。`generate-article-charts.ts` の統計の図は全て型で描き、旧い描画と代替の経路は外した。`--validate` は型から作られていない統計の図を止める。全 47 県がそろわない行と五分位は棒の型の `items` で描く (10 行まで全行、11 行以上は上位と下位)。地図の投影と形の読み込みは `packages/gis/src/map/geometry.mjs` へ集約した。紙・文字・線の色の正本は `packages/types/src/chart-theme.ts` の `CHART_THEMES` 1 つになり、Remotion と動画の構成はここから導く。使われていない Remotion の構成 25 個と、`RankingNote-ChoroplethMap/Chart/Boxplot`、note の `scatter.js` は削除済みで、戻すときは git の履歴から復元する。動画は、ランキングのショートとバーチャートレースだけを残す (2026-11-06 オーナー決定、`sns-content-standards.md` §2-4)。`@stats47/migration-flow`・`station-passengers` とその public データはサイトの再生機と生成処理が使うので残す。
- **次・残り**:
  - `generate-kakei-charts` (上位 10・下位 10 の 2 列と正負の棒) を型へ移す。移すと見せ方が変わるので、オーナーの判断が要る。
  - Instagram の `CorrelationScatterSlide`・`RankingTableSlide`、`render-article-pilot.ts`・`quick-still --layout` の試作の経路、Kindle の `ranking-databook.ts` (図の棒を svg-builder で描く) を型へ移す。
  - 箱ひげの見本を管理画面の型の見本へ登録する (見本の PNG は非公開 R2 へ置くので Mac で行う)。
  - 使われなくなった svg-builder の関数と、`blog-svg-chart-standards.md` の説明を削除する。
  - 新しい図が型から外れたら止める検査を、全媒体へ広げる。
  - 残りの動画を静止画と同じ土台へ載せる作業は未着手。
  - 公開中の図の差し替えは `regenerate-blog-svgs.yml` を動かすまで起きない。公開中の図 1,876 枚の元データを型へ通すと、描けないのはタイトルの無い図と 2 枚のヒートマップなど少数で、再生成の時に警告で残る。
  - 旧い棒・タイル地図・散布図の残りを同じ段階で扱うかは、オーナーの判断を待つ。
- **地図の色の重複**: 残る重複は地図の色の解決 (`choropleth.ts`・`choropleth-diverging.ts`・動画ごとの配色) で、配色の台帳を通すと公開画像が変わるので別に扱う。`prepare-buzz-map-batch.ts` の動画の分岐は、計画が常に静止画だけになったので動かない。
- **動画の見た目の確認 (未確認)**: Windows の PC では `@rspack/binding-win32-x64-msvc` が無く Remotion の描画が動かないので、変更後の動画と SNS 画像の見た目は未確認。Mac で `RankingInstagram-Table`・`MigrationFlow-Reel` を描いて確かめ、動画のコマを確認ページの見本に足す。確認ページで残した 4 本は `npm run review-videos --workspace remotion` で再生できる (出力は `.local/video-review/`)。バーチャートレースの値は 5 桁まで出るので、桁数の上限はオーナーの見た目の確認で決める。終わりの画面の `stats47.jp` は送客の案内なので残す。地球の背景動画はこの PC に無いので見本は無しで描いた。
- **今の位置 (2026-11-05 棚卸し)**: 公開中のブログの図 2,127 枚を R2 から全件数えた。型の印があるのは 1,635 枚 (棒 1,017・タイル地図 424・散布図 194)、無いのは 492 枚で、内訳は旧い棒 175・五分位の棒 59・要点カードと工程図 124・折れ線 86・旧いタイル地図 31・積み上げ 6・旧い散布図 5・レーダー 3・ヒートマップ 2・ウォーターフォール 1 (型の印の無い図は図の中身から分類した)。「棒・地図・散布図は型」は正しくなかった。散布図の検査 `audit-chart-axes.ts` は名前に scatter を含む図しか見ていない。
- **棚卸しの表 (媒体別)**:
  | 図の種類 | サイト | note | X・Threads | Instagram |
  |---|---|---|---|---|
  | 棒 | 型 1,017・旧 234 | ランキング記事は型、ほかは記事の生成と同じ | 使わない (全 47 県タイルが既定)。`quick-still --layout` は別の描画 | 使わない |
  | タイル地図 | 型 424・旧 31 | 記事の生成と同じ | 型 (`all47-svg.ts`) | 型 (地図カルーセル・表紙・ヒント) |
  | 地図 (実際の形) | 図なし | ランキング記事は型 | バズ地図: 地図の計算だけ共通で描画は別 | 同左 |
  | 散布図 | 型 194・旧 5 | 記事の生成は型 (note の `scatter.js` は削除済み) | 投稿なし | 別の描画 (`CorrelationScatterSlide`) |
  | 表 | 図なし | 確認できず | 図なし | 別の描画 (`RankingTableSlide`) |
  | 折れ線 | 旧 86 | 旧 (svg-builder) | 図なし | 図なし |
  | 積み上げ | 旧 6 | 旧 (svg-builder)。`generate-kakei-charts` が別の描画 | 図なし | 図なし |
  | 箱ひげ | 図なし | ランキング記事は型 | 図なし | 図なし |
  | 型の台帳に無い図 | 要点カード 124 | 家計 (`render-note-household`) | 比較・地域・レシート・図鑑・順位の乗り換え | 同左 |
- **型の使い分け (2026-11-05 オーナー決定)**: 棒の型は上位と下位のカード 1 つ、タイル地図は都道府県だけ、地図は都道府県版と市区町村版、組み合わせの全体はコード図。周期のある軸 (月別) はグループ棒グラフの型を使う。市区町村の図は `AreaScope` (粒度・WardMode・比べる範囲) を必ず持ち、値は地域コードで結び、順位は集合ごとに計算する (`apps/admin/lib/template-area-scope.ts`・方針は `docs/01_技術設計/03_情報設計.md` の政令指定都市の表示)。管理画面の `/ops/image-templates/review` は `apps/admin/scripts/build-template-review.ts` が公開 R2 から `.local/` へ見本を作る (ローカル専用)。月次データは `data/estat/monthly/` の台帳で採否・使い道・問いを管理する (管理画面 `/data/monthly`・`npm run estat:monthly:check`)。内訳の組は `data/themes/compositions/sets.json` (テーマのカタログから生成・`/data/compositions`)。
- **棚卸しの注意**: note の公開図 1,313 枚のうち 1,129 枚は台帳の画像名からは種類が判らない (`data/note/body-figures.json` の diagram)。note の列は生成処理を読んだ結果で、公開物の枚数ではない。旧い棒のうち負の値を含む図は型が対応していない (`isSignedBar`)。行数が 47 未満の図と json の無い図は、指標の R2 の値を取り直さないと型にできない。
- **止まる場面**: 型の見本の確認 / main へのデプロイ。
- **配色の台帳 (2026-11-05)**: 連続か 5 段階か・一方向か発散かを値から決め、`data/ranking/color-policies/policies.json` に指標 × 粒度で持つ (規則は `metric-config-standards.md`「配色の台帳」)。図の生成はこの結合を読む。サイトの地図へ届くのは main マージ後に `item.json` を作り直してから。main へのマージは未実施。

### [MUNI-RANKING-DENSITY-MISSING-01] 有効な指標 population-density-habitable に公開ランキングが無い
タグ: [コンテンツ品質] [種類:不具合] [実行:対話] [起票:2026-11-06] [領域:サイト]

- **症状**: `isActive: true` で `app/stats/<key>/cities.json` は 200 なのに、`app/municipalities/ranking/<key>/item.json` と `app/ranking/<key>/item.json` はどちらも 404 (2026-11-06 実測)。
- **未確認**: 生成処理の対象から外れた原因。ページの URL の応答も未確認。
- **完了の判定**: 原因が分かり、公開するか無効にするかが決まって、指標の状態と R2 が一致する。

### [NOTE-FIGURE-ROLLOUT-01] 公開中の note 記事の図を共通の型へ差し替える
タグ: [コンテンツ品質] [種類:改善] [実行:対話] [起票:2026-11-05] [領域:商品]

- **起点**: `CHART-TYPE-ROLLOUT-01` から切り離した反映の作業。型が新しくなっても公開中の note の画像は旧いままである。
- **道具**: `update-note-body-figures.mjs` が公開版の本文の画像だけを替える (文章・カード・タグ・カバーは変えない)。有料記事は止める。
- **制約**: 会社の PC では Node からの note API が i-FILTER で止まる (503「ブロックされました」)。ブラウザの経路へ付け替えるかは未決なので Mac で実行する。R2 の書き込みも Mac で行う。有料記事の添付は 1 日 10 回まで。実際の更新はまだ一度も動かしていない。
- **次 (Mac で実行。更新はオーナー承認済み)**: `git pull` のあと、次の順に行う。
  1. `npm run note:session:check` で口座が stats47 と確かめる。
  2. `node .claude/scripts/note/update-note-body-figures.mjs --key a-maximum-temperature` で dry-run し、画像 3 枚だけが変わると確かめる。
  3. 同じコマンドに `--commit` を付けて更新する。`UPDATED` と 4 項目の検査の成功を確かめる。
  4. https://note.com/stats47/n/n91e96edf3950 をスマホ幅で開き、3 枚の表示と文字の読みやすさを確かめる。
  5. 正本を入れ替える: `npm run note:article -- checkout a-maximum-temperature` → `node .claude/scripts/note/render-ranking-images.mjs a-maximum-temperature` → `npm run note:article -- save a-maximum-temperature`。
  6. 問題があれば旧画像へ戻す。旧 URL は本文の 3 枚 `1785758058-E56siOjDtpzWauISgHe3knN0.png`・`1785758073-0DMrteVW2nJZR4AIU3d87aBO.png`・`1785758089-gziOwk519uFJ7KEAvBspbjh0.png` (`https://assets.st-note.com/img/` の下)。
  7. 見え方が良ければ、残りのランキング記事へ広げる前にオーナーへ確認する。
- **完了条件**: 型にできるランキング記事の公開版の図が新しい型になり、更新後のページを確かめた。対象と本数は最高気温の結果を見てオーナーと決める。
- **2026-11-11 実測 (`npm run note:published:audit`・公開 439 本を公開 API から全件取得・取得失敗 0)**: 無料のランキング記事 103 本のうち、公開版の本文画像が型 (1080×1350) の記事は 0 本。実物は 1080×1080 + 1200×630 が 101 本。103 本のうち 72 本は回収した旧記事 (`recovered-*`) で `chart-data.json` が無く、今の `render-ranking-images.mjs` では作れない (R2 の値と記事の年から固定コピーを作る手順が要る)。旧記事は上位 5 県・下位 5 県の同じ図を 2 か所に貼っており、同じ画像の重複は全体で 111 本。進捗は `data/note/published-audit-latest.json` の `ranking_image_not_type` の本数で追う。

### [NOTE-PUBLISHED-AUDIT-01] note 公開記事の採点を、意味の確認と修正までつなぐ
タグ: [コンテンツ品質] [種類:改善] [実行:対話] [起票:2026-11-11] [領域:商品]

- **起点 (2026-11-11 オーナー指示)**: 公開記事を全件採点して直す仕組みを作る。第 1 段の機械採点 (`audit-note-published.mjs`・判定は `lib/published-audit.mjs`・結果は `data/note/published-audit-latest.json`) は済み。初回の実測は違反なし 221 本・80〜99 点 111 本・60〜79 点 87 本・59 点以下 20 本。
- **残り 1 (導線の構造)**: 「この記事の元データを手元で使う」のカードは、記事ごとでなくマガジンに 1 本設定した有料記事を、そのマガジンの全無料記事へ付ける (`update-published-navigation.mjs` の `datasets`)。106 本に付いており、行き先がその記事の元データかを台帳で確かめられない (有料記事・データセット商品が収録する指標の一覧が台帳に無い)。実例: 県民所得の記事 (n80e58a01f660) の行き先が「服や靴の価格」の有料記事。文言を「同じテーマのデータ」に変えるか、商品が収録する指標を台帳に持たせて一致する記事だけに付けるかをオーナーと決める。同じ記事の「このテーマのデータ」カードも、家計・所得のマガジン (`s47-economy`) が人口・世帯のパック (P-01) を指している。
- **残り 1 の決定と到達 (2026-11-11 オーナー決定)**: 文言を変える。新しいカードは「関連するデータを手元で使う」「…で、同じテーマのデータを手元で開ける形で配布しています。」で作り、公開済みの本文に残る旧文言は `rewriteLegacyDatasetCardWording` (`lib/navigation-footer.mjs`) がフッター適用のたびに置き換える (行き先は変えない)。県民所得の記事の dry-run で `wouldRewriteDatasetWording: true` を確かめた。**1 本目を反映済み (2026-11-11・県民所得の記事 n80e58a01f660)**: 反映前後の公開本文を要素単位で比べ、変わったのは文言の 1 段落と、本文のテキストリンクへの UTM 付与の 1 段落だけ (画像 4 枚・カード・タグ 99 個・価格・題名は同じ、下書きは残っていない)。1 回目は、空のカード要素に編集画面が入れる空白 1 文字を本文の正規化が吸収せず「公開本文が変わった」と止まった (`canonicalizeNoteEditorBody` に足してテストで固定)。**残り 105 本は未実行**で、`update-published-navigation.mjs --magazine <key> --commit` をマガジン単位で少量ずつ流す。反映の進み具合は採点の `source_card_unverifiable` の本数 (旧文言のカードだけを数える) で追う。なお dry-run の `wouldDedupeFooterHeading` は本文に何か変更があれば true になる (UTM の付与や文言の置き換えも拾う) ので、見出しの重複の有無としては読めない。商品が収録する指標を台帳に持たせる案は見送り、必要になれば足す。
- **仕組みの到達 (2026-11-11)**: 週次の上限チェック (`audit-note-published.mjs --check`・上限は `.claude/config/note-published-baseline.json`・`npm run weekly:audits` の `note-published`)、次に直す記事の並び (採点結果の `queue`)、手順書 `/remediate-note-published` を足した。週次監査の単体実行は通過。束の実測は、旧文言のカード 105 本・型で作り直せる画像 8 本・固定コピーが無く作り直せない画像 95 本・意味の確認 23 本 (計画時は作り直せる記事を 31 本と見込んだが、`chart-data.json` を持つのは 8 本だけ)。
- **1 回目の束 (2026-11-11・オーナー許可・閲覧の多い順に 10 本の予定が 4 本目で停止)**: 反映できたのは 3 本 (`b-kakei-gyoza-counting`・`recovered-ncbed56eb7c3d`・`recovered-n581a1409b2c9`) で、旧文言の記事は 105 → 102 本。上限も 102 へ下げた。分かったことは 3 つ。① 道具が `FAIL` と出しても公開版は更新済みのことがある: 後ろの 2 本は公開 PUT のあとのカード画像の検証 (`Invalid URL`・`Verified source image bytes changed`。`lib/card-image-refresh.mjs`) で落ちており、文言は替わっていた (画像・カード・タグの数は反映前と同じ・下書きなし)。`FAIL` の記事は必ず公開 API で実物を確かめる。この検証の失敗の原因は未調査。② 説明文には別の言い回し (「表計算ソフトで開ける形で」) があり、1 回目は見出しだけが替わった。置き換えと採点の両方を直して流し直した。③ `recovered-n144d350fc14e` (沖縄の出生率) は、もともと未公開の下書きがあり目次の設定が公開版と違うので道具が止める。公開版は旧文言のまま。下書きを捨てるか公開するかはオーナーが note の画面で決める。**残り 102 本は未実行**で、①の原因を調べてから続ける。
- **①の原因 (2026-11-11 確定・公開後の検証を公開 API の実物に対して読み取りだけで再現)**: 2 つあった。(a) `Invalid URL` は、添付ファイルの要素 (`embedded-service="attachment"`) が行き先の URL を持たず、リンクカードとして検証されていたため。対象外にして直した (`lib/card-image-refresh.mjs` の `targetFor`・テストで固定)。(b) `Verified source image bytes changed` は、リンクカードの台帳 (`data/ogp/link-card-rollout.json` と分割台帳・検証は 2026-10-27・版 `20261026-pop`) が古いため。サイトの OGP 画像 3,197 種のうち 1,606 種 (ranking 868・blog 609・themes 56・areas 47・products 25・トップ 1) は、今の配信物の SHA が台帳と違う。配信物の最終更新は 2026-10-30 で、台帳の検証のあとに作り直されている。トップの画像は多くの note 記事のカードが使うので、stats47.jp のカードを持つ記事の更新はほぼ毎回この検証で「失敗」と表示される (公開自体は済む)。**直し方は台帳を今の配信物で検証し直すこと** (OGP 側の手順。`OGP-RANKING-CARD-BLOG-REPAIR-01` の作り直しが進行中なら、それが済んでから)。台帳が新しくなるとカードの URL の版 (`s47_ogp`) も変わり、記事を更新したときに note 側のカード画像も新しい画像へ入れ替わる。なので順番は「台帳の検証し直し → 残り 102 本」。検証を緩めて先へ進めない。
- **ここまでの全体像 (2026-11-11 の 1 セッションの記録。再開する人はここから読む)**:
  - 発端は、県民所得の記事 (n80e58a01f660) を見て、内容・画像・導線に問題が複数あったこと。本文画像が共通の型でない・同じ図を 2 か所に貼っている・「元データ」のカードが無関係の記事を指す・記事の年が古い・本文に事実の誤りがある (下の「人が直す」)。
  - 作ったもの: 採点 `npm run note:published:audit` (`audit-note-published.mjs`・判定 `lib/published-audit.mjs`・結果 `data/note/published-audit-latest.json`)、週次の上限チェック (`--check`・`.claude/config/note-published-baseline.json`・`weekly:audits` の `note-published`・品質ゲート台帳 `note-published-audit`)、次に直す記事の並び (結果の `queue`)、手順書 `/remediate-note-published`。
  - 直した道具: カードの文言 (`DATASET_CARD_HEADING`・`datasetCardLead`・`rewriteLegacyDatasetCardWording`)、空のカード要素の空白を吸収する本文の比較 (`canonicalizeNoteEditorBody`)、添付の要素を画像の検証から外す (`card-image-refresh.mjs` の `targetFor`)。
  - commit: `72bb33359` (採点と文言)・`105caf053` (添付の要素)・`56bf179db` と、この記録の commit。**どれも push していない** (オーナーの指示待ち)。
- **今の数字 (2026-11-11 の最後の実測)**: 公開 439 本・違反なし 222 本・59 点以下 20 本。型でない本文画像 103 本 (無料のランキング記事の全部)・同じ画像の重複 111 本・旧文言のカード 102 本・記事の年が古い 3 本。束は、旧文言 102 本・型で作り直せる画像 8 本・`chart-data.json` が無く作り直せない画像 95 本・意味の確認 23 本。
- **反映済みの 4 本**: `recovered-n80e58a01f660` (県民所得)・`b-kakei-gyoza-counting`・`recovered-ncbed56eb7c3d` (人口密度)・`recovered-n581a1409b2c9` (大学数)。4 本とも公開版で新しい文言を確かめた。変わったのは文言と、本文のテキストリンクへの UTM 付与 (既存の仕様)。
- **再開の順番**:
  1. `OGP-RANKING-CARD-BLOG-REPAIR-01` の②で、リンクカードの台帳を今の配信物へ合わせる (別セッションの台帳の整理が済んでから)。
  2. `npm run note:published:audit` で測り直し、`/remediate-note-published dataset-card-wording 10` を流す。小さいモデル・低い effort でよい。1 日 10 本まで。
  3. 道具が `FAIL` と出した記事は、公開 API (`https://note.com/api/v3/notes/<noteId>`) の `body` に新しい文言があるか・`has_draft` が false かを必ず確かめる。`FAIL` でも公開済みのことがあった。
  4. 文言が済んだら画像へ進む。先に `NOTE-FIGURE-ROLLOUT-01` の試行 1 本 (`a-maximum-temperature`) を行い、スマホ幅の見え方をオーナーが見る。そのあと `ranking-image-type` の 8 本。95 本は、R2 の値 (`app/stats/<key>/values.json`) と記事の年から `chart-data.json` を作る手順を先に足す (契約は `.claude/rules/note-image-assets.md` の契約 3。年を読めない記事と 47 県がそろわない指標は対象外として一覧に残す)。
  5. 最後に意味の確認 23 本。`note-critic` に該当の段落と 47 県の値だけを渡す。
- **人が直す・決める (道具では進まない)**:
  - `recovered-n144d350fc14e` (沖縄の出生率): 以前から未公開の下書きがあり、目次の設定が公開版と違うので道具が止める。下書きを捨てるか公開するかを note の画面で決める。旧文言のカードが 4 枚ある。
  - 県民所得の記事の本文: 「中部 9 県のうち 7 県が全国平均を上回る」は 6 県が正しい (上回るのは愛知・福井・富山・静岡・山梨・岐阜。長野 2,788・新潟 2,784・石川 2,770 は下回る)。「全国平均 2,833 千円」は 47 都道府県の単純平均。「2023 年の TSMC 進出」は年の根拠を確かめていない。記事は 2020 年度で、サイトは 2021 年度を出している。
  - 家計・所得のマガジン (`s47-economy`) の「このテーマのデータ」カードが、人口・世帯のパック (P-01) を指している。所得・賃金のパック (P-02) へ替えるかを決める (`data/note/magazines.json` の `paidProductId`)。
  - タグは全 439 本で中央値 99 個 (上限 100)。意図した運用かを決める。違うなら採点の項目に足す。
- **道具の癖 (次に同じ所で止まらないために)**:
  - `update-published-navigation.mjs` は編集画面を開くので、途中で止まると未公開の下書きが残る。次の実行は「下書きが公開版と違う」で止まる。下書きと公開版の差が書式だけなら、本文の比較が吸収して進む。
  - dry-run の `wouldDedupeFooterHeading` は、本文に何か変更があれば true になる。見出しの重複の有無としては読めない。文言の置き換えは `wouldRewriteDatasetWording` を見る。
  - 実行のたびに `data/note/navigation/note-navigation-pilot-<日付>.json` を上書きする (dry-run でも書く)。
  - コミットの pre-commit は作業ツリー全体を見るので、並行セッションの編集中のファイルで落ちることがある。自分の原因でなければ待つ (検査を飛ばさない)。
- **残り 2 (意味の確認)**: 機械で判定できない記述の誤り (例: 同記事の「中部 9 県のうち 7 県が平均を上回る」は実際は 6 県) を、点数が低く閲覧の多い記事から週に上限を決めて読む。小さいモデル・低 effort で該当箇所だけを読ませ、上位モデルは有料記事に限る。
- **残り 3 (修正)**: 画像は `NOTE-FIGURE-ROLLOUT-01`、値の誤りは `NOTE-FIGURE-FIX-01` の道具で直す。note への書き込みは 1 日 10 本程度に分け、毎回 dry-run の差分を確かめる。
- **残り 4 (採点の拡張)**: タグは全 439 本で中央値 99 個 (上限 100) だった。意図した運用かをオーナーに確かめ、違うなら採点項目に足す。有料記事 (98 本) は公開 API に本文の全体が出ないので、型の寸法を測っていない。
- **完了条件**: 採点が週次で更新され、59 点以下の記事が 0 本になり、「元データ」カードの扱いが決まって台帳で確かめられる。

### [NOTE-FIGURE-FIX-01] 本文の照合で見つかった note 記事の誤りを直す
タグ: [コンテンツ品質] [種類:不具合] [実行:対話] [起票:2026-11-05] [領域:商品]

- **直すべき note 記事 (2026-11-05)**: ① `a-volunteer-activity-annual-participation-rate-10plus` と `recovered-nf5b4ced7a736` の「滋賀県と岐阜県が10位台前半」(滋賀県は 4 位。2 本は同じ本文で URL が別) ② `recovered-n5158c5766a07` の題名「東京は最下位」と 1 位の 29.8 (R2 の 2019 年は愛知が最下位・1 位 29.9。どちらが正しいかは統計の表で確かめる)。
- **値を照らせない記事**: `recovered-n3f65c01be9a8` の 2022 年と `recovered-nfe69996fb5c9` の 2023 年は R2 に値が無い (`general-dust-emission-facility-count` は 2017 の次が 2023、`utilities-expenditure-ratio-multi-person-households` は 2004 の次が 2024)。指標の年を足すかを決める。
- **次**: ① は 1 文の修正。note への最初の更新は `NOTE-FIGURE-ROLLOUT-01` の結果を見てから行う。② は e-Stat の表で確かめてから、記事か指標のどちらを直すかを決める。
- **完了条件**: `node .claude/scripts/note/build-note-figure-ledger.mjs --check` の直すべき記事が 0 件で、`.claude/config/note-figure-baseline.json` の上限も 0 に下げた。

### [BLOG-CHART-FILES-MISSING-01] 公開中のブログ本文が指す図が R2 に無い
タグ: [コンテンツ品質] [種類:不具合] [実行:対話] [起票:2026-11-05] [領域:サイト]

- **証拠 (2026-11-05)**: R2 の `app/blog/all.json` の全記事を数えた。`climate-lifestyle-connection` の 4 枚 (sunshine-pacific-vs-nihonkai・precipitation-gap・snow-kerosene-scatter・clear-days-map) と `medical-access-regional-gap` の 3 枚 (physicians-ranking・bed-occupancy-ranking・summary-findings) の `data/<名前>.svg` が 404 だった。別に 6 記事 (estimated-hourly-wage-ranking・gender-wage-gap-ranking・nurse-salary-ranking・telework-income-correlation・tokyo-real-income-after-rent・truck-driver-salary-trend) は一覧にあるのに `article.md` が 404 だった。
- **未確認**: 公開ページの表示はまだ見ていない。
- **次**: 2 記事と 6 記事を本番のページで開き、図の欠けと 404 を確かめる。原因を調べ、図の再生成か一覧からの除外を決める。
- **完了条件**: 一覧の全記事に `article.md` があり、本文が指す図がすべて R2 にある。

### [BLOG-PUBLISH-AUDIT-KAKEI-01] 公開後の検査が家計調査の 9 指標で落ち、送り箱の掃除が止まる
タグ: [コンテンツ品質] [種類:不具合] [実行:対話] [起票:2026-11-05] [領域:サイト]

- **証拠 (2026-11-05)**: `blog-auto-publish.yml` の公開後の検査が、`*-budget-share-kakei` の 9 指標で `values.json` が 404 になり失敗する。記事の公開そのものは成功している。この失敗で「Remove published drafts」が skip され、公開済みの記事が `contents/blog` に残る。
- **次**: 9 指標を有効にした `863c80cd6` の後に値が投入されたかを確かめ、投入するか有効化を外す。`contents/blog` の公開済みの原稿が消えることを確かめる。
- **完了条件**: 公開の run が成功し、送り箱の掃除が動く。

### [BLOG-METRIC-DEFINITION-GAPS-01] 記事が使う指標の定義が config に無く、本文で断定できない
タグ: [コンテンツ品質] [種類:改善] [実行:対話] [起票:2026-11-05] [領域:サイト]

- **起点**: 2026-11-05 の記事の書き直しの審査で、次の定義が指標定義シートから取れなかった。
- **対象**: `university-capacity-index` の計算式 (e-Stat の項目定義と統計局のページでは確認できなかった) / `annual-sunshine-duration` の観測地点 / `dual-income-household-ratio` の分母 / `high-school-advancement-rate` の範囲 (短大などを含むか)。
- **同じ起点の誤り**: `data/metrics/university-capacity-index.ts` の seoTitle・seoDescription が 238.4 / 47.4 で、R2 の 2024 年度は 238.3 / 46.7。手書きの値が更新に追従していない。
- **次**: 統計局の指標計算式の資料で確かめて `description` に書く。確かめられたら該当記事の「確認していません」の注記を外す。seo 文の数字は手書きをやめる方法を検討する。
- **完了条件**: 4 指標の定義シートが「対象の記述なし」を返さない。

### [BLOG-SCATTER-LABEL-SIDE-01] 散布図の県名が、点と重なる側しか試さず消える
タグ: [コンテンツ品質] [種類:改善] [実行:対話] [起票:2026-11-05] [領域:サイト]

- **起点**: `university-advancement-capacity/capacity-vs-advancement-scatter` で labelPoints に京都府・奈良県・香川県を指定しても、片側だけ試して重なるので名前が出ず、端の県が代わりに出た。
- **次**: `apps/admin/lib/template-relationship-scatter.ts` で反対側と上下も試す。公開中の図の見た目が変わるので、見本を確かめてから全件へ流す。
- **完了条件**: labelPoints の県が、物理的に置けない場合を除いて図に出る。

### [BLOG-SCATTER-SOURCE-YEAR-01] 散布図の source.json の年が、図の点と見出しの年と食い違う
タグ: [コンテンツ品質] [種類:不具合] [実行:sweep] [起票:2026-10-28] [領域:サイト]

- **証拠 (2026-10-28)**: `safe-driving-5-features/aging-fatality-scatter` は source.json の `year` が 2023 だが、点と見出しは 2024 年の値 (図の年の取り直しの照合で発見)。古い図の一覧 (`build-stale-data-years.mjs`) は source.json の年を読むので、誤った年で判定される。
- **次**: 散布図の点を R2 と照合して年を決める関数 (`lib/refresh-chart-year.mjs`) で公開済みの散布図を一括で調べ、source.json の年と食い違う図を一覧にして直す。
- **完了条件**: 公開済みの散布図で source.json の年と点の年の食い違いが 0 件。
- **調査結果 (2026-10-28・公開 609 記事を読み取り)**: 散布図 196 枚のうち両軸の点が R2 と 95% 以上一致したのは 140 枚。うち source.json の年と一致 66・**食い違い 4**・year 無し 70 (59 は kind `correlation`)。照合できない 56 枚 (点なし 28・どの key/年とも一致しない 16・key なし 9・同じ指標の 2 年 3)。食い違いの 4 枚: `safe-driving-5-features/aging-fatality-scatter` (year 2023 → 点は両軸 2024)、`vacant-house-crisis/vacant-aging-scatter` (2023 → x 2024 / y 2023)、`fertility-fiscal-nexus/fiscal-fertility-scatter` (2022 → x 2022 / y 2023)、`housing-cost-livability-trend/rent-floorarea-scatter` (2024 → x 2024 / y 2023)。両軸の年が違う 3 枚は year 1 つでは表せない。照合関数が略した「京都」を「京」にして外していた不具合は直した (`refresh-chart-year.mjs` の `prefKey`・テストで固定)。
- **次**: ① 両軸の年が違う図の source.json の書き方 (`xYear`/`yYear` を足すか) を `blog-data-schema.md` §1.5 で決める ② 4 枚の source.json を直して R2 へ上げる (承認が要る) ③ kind `correlation` の 59 枚は `scatterAxisKeys` が `base`/`pair` を読まず、`SCATTER_SOURCE_KINDS` にも無いので年の照合と取り直しの外にある。対象に足すかを決める。

### [MUNI-FUTURE-BURDEN-DASH-01] 将来負担比率の「―」(将来負担が無い) の団体を理由つきで示し、23 区の注記も直す
タグ: [コンテンツ品質] [種類:不具合] [実行:対話] [起票:2026-10-28] [領域:データ] [進行中]

- **証拠 (2026-10-28)**: 健全化判断比率の「―」は「将来負担が無い (基金などが将来負担を上回る)」の意味 (東京都 別紙2 の備考 https://www.metro.tokyo.lg.jp/documents/d/tosei/13_02_223)。R2 の `future-burden-ratio-city` は 2021 年度に 1,742 団体中 925 団体しか行が無く、財政が最も良い側の約 800 団体がランキングから消えていた。東京都の 2020 年度 39 市町村で「―」の団体 = R2 に行が無い団体を確かめた (39/39 一致)。
- **済み (`f9d38ed036`、main に入っている)**: metric config に `absentValueReason` を足して `future-burden-ratio-city` に設定し、純粋関数 `municipalityAbsenceNote` (`packages/ranking`) が全国版と県別ページに「全国の816自治体は、将来負担が無く…このランキングに含まれていません。」のように数と理由を出す (理由の無い指標は従来どおり「23 区は元の統計に区ごとの値が無い」)。テスト `municipality-prefecture-ranking.test.ts`。R2 への書き込みは要らない。localhost の画面では見ていない。
- **見送り**: 「―」の団体を 0 として順位に入れる案は、「比率 0%」と誤読されるので採らない。居ない団体の一覧表示は作っていない。
- **次**: 本番で `/municipalities/ranking/future-burden-ratio-city` と `/municipalities/ranking/future-burden-ratio-city/13000` の注記を確かめる。
- **完了条件**: 将来負担比率のランキングで「―」の団体が理由つきで表示され、23 区の注記が実際の理由と一致し、テストで固定されている。→ コードとテストは満たした。本番での表示確認だけが残る。

### [MUNI-TITLE-MAGNITUDE-01] 市区町村ランキングの title・説明文で、1 万〜10 万の値が「1万人」のように丸まって見える
タグ: [コンテンツ品質] [種類:不具合] [実行:対話] [起票:2026-10-28] [領域:サイト]

- **証拠 (2026-10-28 localhost)**: 北海道の出生数の県別ページの title が「1位 札幌市（1万人）」になる (実値 10,352 人)。共通の整形 `formatReadableMagnitude` (`packages/data-configs/src/unit/unit-display.ts`) が小数 1 桁で丸め、末尾の 0 を落とすため。全国版の title (`buildMunicipalityRankingMeta`) と県別ページ (`buildMunicipalityPrefectureRankingMeta`・要約文) が同じ整形を使う。
- **次**: ① 万の位に切り替える下限を決める (案: 10 万未満は「10,352人」のように桁区切りで書く) ② 整形は単位の正典 (`.claude/rules/unit-semantics-standards.md`) の部品なので、変えるとほかのページの表示も変わる。影響するページを数えてから直すか、市区町村の title だけ別の整形にするかを決める ③ テストで「10,352人」を固定する。
- **同じ整形の別の症状 (2026-10-28)**: 単位が「指数」の指標で「1位 武蔵野市（1.48指数）」「飛島村（2.1指数）」と単位名がそのまま付く。直すときに一緒に扱う。
- **完了条件**: 1 万〜10 万の値が title・説明文で丸めずに読め、テストで固定されている。
- **進捗 (2026-10-28)**: 県別ページ (`/municipalities/ranking/<key>/<県>`) の title・要約は develop の `formatMunicipalityValueText` で「10,352人」「1.48」(指数を付けない) になっており、ページ単位のテスト 2 件で固定した (共通の整形に戻すと落ちる)。**残り**: 全国版の `buildMunicipalityRankingMeta` (`municipality-page-meta.ts`) は `formatReadableMagnitude` のままで「1万人」「1.48指数」が出る。`MUNI-PAGE-SEO-01` の 2026-11-21 の判定の後に同じ整形へ替える (1 行)。

### [MUNI-STATIC-MAP-PILOT-01] 検索に出すページの地図を静的な画像にし、操作できる地図は noindex の別ページへ分ける試験
タグ: [UI・UX] [種類:改善] [実行:対話] [起票:2026-10-28] [領域:サイト]

- **決定 (2026-10-28 オーナー合意)**: `docs/01_技術設計/03_情報設計.md`「静的な地図と操作できる地図」。検索に出すページは `packages/svg-builder` の choropleth で静的に描き、D3 の地図は「地図を操作する」で移る別ページ (noindex・sitemap 外) に置く。
- **未確認**: 表示速度が良くなるか。過去に「LCP 要素を特定せずに直して効かなかった」例がある (memory `feedback_lcp_optimization`)。
- **次 (実行順)**: ① 代表 3 URL (`/ranking/total-population`・`/municipalities/ranking/manufacturing-shipment-amount`・`/municipalities/ranking/manufacturing-shipment-amount/23000`) の PSI と LCP 要素を記録する ② 市区町村の全国地図 (1,741 区画) を静的 SVG にしたときの大きさを測る (ページの重さの予算 900KB) ③ 1 ページ種別で切り替え、前後の PSI を比べてから広げるか決める。
- **停止条件**: LCP が地図でなく、静的化で LCP・TBT とも変わらないなら広げない。
- **完了条件**: 試験した 1 ページ種別の前後の PSI と判断 (広げる・止める) がこのカードか improvement log に書かれている。

### [MUNI-DESIGNATED-CITY-WARDS-01] 政令指定都市の統合 / 分割のフラグと地図の修正を本番に出し、東京 23 区と行政区の内訳を本番で確かめる
タグ: [コンテンツ品質] [種類:不具合] [実行:対話] [起票:2026-10-28] [領域:データ] [進行中]

- **決定**: `docs/01_技術設計/03_情報設計.md`「政令指定都市の表示 (統合 / 分割のフラグ 1 つ)」。
- **済み (2026-10-28・develop)**: ① 地域の分類にフラグ (`resolveWardModeAreas`・`listSpecialWardCodes`。`packages/area`) ② 分割版から統合版の地図を作る `deriveWardModeTopology` と `fetchMunicipalityTopologyForWardMode` (`packages/gis`) ③ 県内の市区町村地図・テーマのドリルダウンを `merged` に替え、`_city_dc` を使わない ④ 47 県 × 2 フラグの対応検査 `npm run audit:ward-mode-topology --workspace=@stats47/gis` (週次の ranking-integrity に組み込み。全件一致・例外は北方領土 6 村) ⑤ 政令指定都市 20 市のデータブックに行政区の内訳 (`wardBreakdown`。人口・高齢化率・世帯数・転入超過率) を付け、ページに地図と表を出す。localhost (R2 を読む中継) で東京の地図 62 区市町村が塗られる・神奈川 33 = 表 33・横浜市 18 区の内訳を確認。
- **次 (承認が要る)**: ① develop→main のマージ (データブックはデプロイ時に作り直されるので、内訳はデプロイで本番に出る) ② 本番で東京都の地図 (`/municipalities/ranking/per-taxpayer-income/13000`) と横浜市のページ (`/areas/14000/cities/14100`) を確かめる。
- **完了条件**: 本番で東京都の地図の 23 区に色が付き、政令指定都市のページに行政区の内訳が出ている。

### [MUNI-KOSODATE-RANKING-01] 子育て世帯の住む市選びに向けて、子育て系の市区町村ランキングを5〜10ページ足し、8週で検索の反応を見る
タグ: [コンテンツ品質] [種類:制作] [実行:対話] [起票:2026-10-28] [領域:サイト]

- **経緯**: 2026-10-28 のオーナーとの壁打ちで、市区町村 × GIS を次の展開の軸にした (調査は vault `memos/stats47_悩み起点リサーチ.md` §7・§8)。打ち手の台帳は `data/business/experiments.json` の EXP-008 (本カード)・EXP-009 (老後)・EXP-010 (移住)。
- **読者の課題 / HARM**: 引っ越し・家の購入を考える子育て世帯が、近隣2〜4市のどこが子育てしやすいか決められない (M: 住居費・支援、R: 家族、H: 小児医療)。個人は払わない前提で、AdSense と無料系の導線で回収する (保険・不動産の案件は出さない)。
- **需要の証拠**: Yahoo!知恵袋に約1,737件、サジェストに「子育てしやすい市町村ランキング」。県版の子育てランキングは平均1.27位・CTR 40%。**市区町村版で同じ順位が取れるかは未検証**。
- **子カード (実行順)**: 🔴 `MUNI-PREF-RANKING-ROUTE-01` (県名×市区町村のページ・先に作る) と 🔴 `MUNI-KOSODATE-METRICS-01` (指標) → 🟡 `MUNI-KOSODATE-RANKING-01` (公開と内部リンク)。続きは `MUNI-ROUGO-CARFREE-01` (EXP-009) → `MUNI-IJU-COMPARE-01` (EXP-010)。
- **指標**: 子育て向けの 9 指標を決め、待機児童率と住環境 2 指標は 2026-11-01 に公開済み (PR #1204)。こども医療費助成は 9 割が同じ対象年齢のためランキングにしない。
- **次 (実行順)**: ② cron 生成でランキングを5〜10ページ足す ③ 県版の子育て記事・ランキングから市区町村版へ内部リンクを張る (`MUNI-KOSODATE-RANKING-01`) ④ 8週後に判定する。
- **判定 (8週)**: 該当ページの GSC 28日表示 3,000 以上、かつ1ページあたり PV が市区町村ページ平均 (44.7) 以上なら、近隣市比較ページを自動生成で広げる。下回れば止める (手作業の記事量産には移らない)。
- **ページの形**: 市単位の検索は細い (推定 月56「子育てしやすい市」) ので、「県名×市区町村ランキング」の形にする (推定 月2,320「子育てしやすい街ランキング」。調査 §8)。
- **続き**: 型ができたら、同じ型で老後 (EXP-009、車なしで暮らせる町を3ページ) と移住 (EXP-010) を同じ基準で試す。
- **関係**: 市区町村ランキングの拡充は `MUNI-RANKING-EXPANSION-01`、市区町村ページの本文は `MUNI-CITY-PAGE-SNIPPET-01`。
- **完了条件**: 8週の表示・PV が記録され、拡大・停止のどちらかをオーナーが決めた。
- **統合 (2026-11-13)**: `MUNI-KOSODATE-PAGES-01` をこのカードへ統合した。完了条件に含める: 親の完了条件 (8 週の表示・PV を記録し拡大・停止をオーナーが決定) に加え、子の項目: (1) 指標セットのランキングを cron 生成のまま公開 (手書き記事は書かない) (2) 市区町村テーマに子育てを足すか education・vital-statistics に寄せるか決める (3) 県版の子育てランキング・記事から市区町村版と県別ページへ内部リンクを張り nav_click で計測 (4) 公開日を EXP-008 の started_at にして running にし、8 週後の next_check_date を書く。前提の METRICS-01・PREF-RANKING-ROUTE-01 は別カードのまま。

### [MUNI-DATA-PRODUCT-PILOT-01] 市区町村の製造品出荷額を「組替済み時系列 CSV＋GeoJSON」の1商品にし、6週で売れるかを確かめる
タグ: [収益化] [種類:制作] [実行:対話] [起票:2026-10-28] [領域:商品]

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

### [MUNI-ROUGO-CARFREE-01] 老後に車なしで暮らせる町を、子育てと同じ型で 3 ページだけ試す
タグ: [コンテンツ品質] [種類:制作] [実行:対話] [起票:2026-10-28] [領域:サイト]

- **打ち手台帳**: EXP-009。前提は `MUNI-PREF-RANKING-ROUTE-01` (型ができていること)。追加の能動時間は使わない範囲でやる。
- **読者の課題 / HARM**: 本人・親の老後の住まいで、車がなくても買い物・病院に行けるか (H・M)。推定検索数「老後 住みやすい街」月 384 で需要は小さい (調査 §8)。
- **指標の候補 (既存)**: `elderly-population-ratio`・`retail-store-count-per-1000`・`general-clinic-count-per-100k`・`general-hospital-count-per-100k`・`single-person-household-old-population-ratio`。公共交通は既存指標に無いので、最初は入れない。
- **次**: ① 3 ページ分の指標を決めて公開する ② 台帳 EXP-009 を running にして 8 週後に子育てと同じ基準で判定する。
- **完了条件**: 3 ページが公開され、8 週の判定が台帳にある。

### [MUNI-IJU-COMPARE-01] 移住先選び (雪・車・仕事) の市区町村比較を、子育てと同じ型で試す
タグ: [コンテンツ品質] [種類:制作] [実行:対話] [起票:2026-10-28] [領域:サイト]

- **打ち手台帳**: EXP-010。前提は `MUNI-PREF-RANKING-ROUTE-01`。老後の 3 ページの後に出す。
- **読者の課題 / HARM**: 地方移住を考える人が、雪・車・仕事の条件で候補を絞れない (A・M)。推定検索数「移住 おすすめ」月 4,320、移住相談 73,003 件 (2025 年・過去最多)。JOIN・自治体広報など競合が強い (調査 §8)。
- **次**: ① 雪 (降雪日数・積雪)・車の必要度・求人の市区町村指標が取れるかを確かめる (既存の `movers-in` / `movers-out` は使える) ② 取れる指標で 3 ページ公開し、台帳 EXP-010 を running にして 8 週後に判定する。
- **完了条件**: 指標が足りずに見送るか、3 ページが公開されて 8 週の判定が台帳にある。

### [MUNI-CITY-PAGE-SNIPPET-01] 市区町村ページに、データブックの値から決まった文で組む要約・よくある質問・近い自治体との比較を足す (LLM で書かない)
タグ: [コンテンツ品質] [種類:改善] [実行:対話] [起票:2026-10-28] [領域:サイト]

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

### [MAP-TILE-FOREIGN-LABELS-01] ランキング詳細の地図タイルに外国の地名 (ハバロフスク・ウラジオストク等) が出る
タグ: [UI・UX] [種類:改善] [実行:対話] [起票:2026-10-28] [領域:サイト]

- **経緯**: 2026-10-28 のテンプレート移行の撮り直しで、`/ranking/total-population` の都道府県別の地図 (1440 幅) の左上に、地理院タイルが描く外国の地名と点が出ていることを確認した。変更前 (develop) の画面にも同じものが出ているので、移行で増えたものではない。
- **次**: 地図のタイル (地理院の淡色地図) を、地名ラベルを持たない種類か、日本の外を塗りつぶす表示に替えられるかを調べる。地図の部品は `apps/web/src/app/layout.tsx` の `getInitialMapTileUrls` の preload と同じタイルを使う。
- **禁止**: 出典表示 (地理院タイルの attribution) を外さない。
- **完了条件**: 同じページの 1440・390 の撮影で、日本の外の地名が出ていない。

### [COMPARE-ADD-REMNANT-01] 送信関数を消した compare-add が、GeoAI の M1 実装仕様と計測の予定にまだ残っている
タグ: [インフラ・計測] [種類:不具合] [実行:対話] [起票:2026-10-28] [領域:管理]

- **経緯**: 2026-10-28 のテンプレート移行 3 巡目で、公開サイトから compare-add の送信関数を消し、事業計画の catalog で未計測 (canonicalEvent: null) にした。管理画面のテスト (`apps/admin/tests/unit/business-plan.test.ts`) の件数は同日に合わせた (未計測 3→4、M1 のコード対応 4→3)。`docs/02_実装計画/47_GeoAI事業M1実装仕様.md` と m1 の eventIds は、まだこのイベントを M1 の計測の 1 つに数えている。
- **次**: M1 の計測にこのイベントが要るかを仕様の持ち主 (strategy-advisor) と決め、要らないなら catalog・m1 の eventIds・テスト・仕様の記述をまとめて外す。要るなら送信口を戻す。
- **完了条件**: M1 の計測の予定 (仕様・m1 の eventIds) と catalog が一致し、`npx vitest run --root apps/admin` が通る。

### [CHECKER-WIRING-ROOT-SCRIPTS-01] check-checker-wiring の探索範囲が root の scripts/ を含まず、lyra の検査を例外登録で通している
タグ: [エージェント・SSOT] [種類:改善] [実行:sweep] [検証:node .claude/scripts/lib/check-checker-wiring.cjs --baseline] [起票:2026-10-28] [期日:2026-12-31] [領域:管理]

- **経緯**: lyra の書き込みスクリプト `scripts/ui-theme/inline-lyra.mjs` は root の `scripts/` にあり、`check-checker-wiring.cjs` の candidateRoots (`.claude/scripts` と `apps|packages/*/scripts`) の外にある。そのため `.claude/config/quality-gates.json` の exceptions に `NOT_A_CHECKER` (期限 2026-12-31) を置いて通している。検査本体の `npm run ui-theme:lyra:test` は pre-commit と PR CI で blocking なので、検査そのものは走っている。
- **次**: candidateRoots に root の `scripts/` を足すか、スクリプトを探索範囲へ移し、例外を外す。
- **完了条件**: 例外なしで `node .claude/scripts/lib/check-checker-wiring.cjs --baseline` が通る。

### [PPTX-RANK-ORDER-01] 商品パックの PowerPoint で「上位 10」の棒グラフの 1 位が一番下に並ぶ
タグ: [収益化] [種類:不具合] [実行:対話] [検証:npm run test:run --workspace=@stats47/product-factory] [起票:2026-10-28] [領域:商品]

- **実測 (2026-10-28・Microsoft 365 PowerPoint Windows版 16.0 build 17830)**: note で販売中の 13 パック (P-01〜P-12・P-14) の product.pptx を開くと、ランキングのページ (例 P-01 の 4 枚目「不慮の事故による死亡者数（人口10万人当たり）（上位 10）」) で 1 位の青森県 61 が一番下、10 位が一番上に描かれる。値と順位は正しい。
- **原因**: `packages/product-factory/src/generators/pptx.ts` の `addBarChartSlide` は 1 位から順にデータを渡すが、横棒グラフは先頭の項目を下に描く。並びを逆にする指定 (pptxgenjs の `catAxisOrientation: "maxMin"`) が無い。
- **次**: 指定を足してテストで固定 → 13 パックを再生成 → Office で並びを確かめる → note の有料記事の添付 ZIP を差し替える (添付は 1 日 10 回まで。`project_note_attachment_upload_limits`)。
- **停止条件**: 添付の差し替えは有料商品の納品物を変えるのでオーナー承認の後。
- **完了条件**: 13 パックの PowerPoint で 1 位が一番上に並び、note の添付が新しい版に替わっている。


### [MEDIA-CODE-IMAGE-REFERENCE-01] 画像台帳でコード例の画像記法を配信画像として数えない
タグ: [コンテンツ品質] [種類:不具合] [実行:対話] [起票:2026-10-27] [領域:サイト]

- **済み (2026-11-13・`0ec7f25f2`)**: `imageReferences` がフェンス付きコードとインラインコードを除いて照合するようにし、コード例と実画像を同時に含む回帰テストを足した。
- **残り 1 (手元で済む)**: `inlineSvgReferences` も本文のコード例の中の svg を埋込 SVG として数える。同じ除外を当て、回帰テストを足す。
- **残り 2 (R2 の読み取りと認証が要る)**: 対象記事 `/blog/cc-estat-03-population-bar` の台帳を `sync-web-image-inventory.mjs` で再生成し、本番 HTML の img 集合と照合する。
- **停止条件**: 正常な本文画像の参照を落とす場合は採用しない。
- **完了条件**: 記法例が missing 件数に入らず、実画像の欠落を引き続き検知し、対象記事の台帳が本番 HTML の img 集合と一致する。

### [NOTE-CIRCULATION-RECHECK-01] note→ランキング回遊の着地 session を note.com 経由で取り直す
タグ: [インフラ・計測] [種類:改善] [実行:対話] [起票:2026-10-27] [領域:管理]

- **経緯**: 旧 `NOTE-CIRCULATION-PILOT-01` (improvements.md) を 2026-10-27 に降格。2026-09-06 に高 view 3 記事へ次記事+マガジンの素 URL カードを反映し、公開 222 記事も全量是正した。判定できなかった理由と不足データは `data/improvement/ga4-improvement/improvement-log.md` の同 ID の節。
- **次**: GA4 サービスアカウント鍵のある PC で、その節の再現コマンドを /ranking/real-public-debt-service-ratio・/ranking/annual-sunshine-duration・/ranking/per-capita-prefectural-income-h27 に実行し、着地 session の合計を baseline (86/81/4 = 171、28日) と比べる。遷移先 note の view は dashboard 経路 28 日で置き直す。
- **完了条件**: `[target:]` に根拠付きの想定値を置いて improvements.md に戻すか、置けないなら本カードを削除して観測を打ち切る。起点記事 n04d95ae14bc1 の view 低下 (616 → 107) との対応も記録する。

### [THEME-EXPANSION-D56-01] 55 テーマ拡充の d56 基本観測を記録する
タグ: [UI・UX] [種類:改善] [実行:機械] [検証:npm run theme:portfolio:audit] [起票:2026-10-27] [期日:2026-11-06] [領域:管理]

- **経緯**: 旧 `THEME-EXPANSION-EFFECT-01` (improvements.md) を 2026-10-27 に降格。d28 の公開後窓 (GA4 09-13〜10-10) でも 44 件が launch-provisional / insufficient-data で、効果は確定しない。証拠は `data/improvement/ga4-improvement/improvement-log.md` の同 ID の節と `data/themes/experiments.json` の `result.rechecks.d28`。
- **次**: 2026-11-06 以降の週次 snapshot で `evaluate-theme-experiments` を実行して d56 を記録する。標本不足のままなら count のみ記録し、効果を主張しない。
- **完了条件**: 55 件の d56 が `data/themes/experiments.json` に記録され、継続・改善・保留が launch-review に書かれている。

### [STRATEGY-GATE-ADMIN-PILOT-01] 管理画面に、行政向け商品の検証が4段階のどこにいるかを出す
タグ: [収益化] [種類:改善] [実行:sweep] [検証:npm run test -w apps/admin] [起票:2026-10-27] [領域:戦略]

- **背景 (2026-10-27 の棚卸し)**: 収益化戦略 §5「行政向け商品の検証順序」は4段階 (業務選定→無料試用→有料 pilot→横展開) の進む条件と止める条件を持つ判断ゲートだが、管理画面のコードに `ADMIN-STAT-PILOT` を読む箇所が無い。聞き取りは 0/3 件で、状態は backlog の `ADMIN-STAT-PILOT-01` の本文にしか無い。
- **次**: `/strategy` (または `/product/status`) に、`data/products/admin-stat-interviews.json` から聞き取り件数・現在の段階・次の判断点 (有料 pilot は開始から30日) を読み取り専用で出す。
- **禁止**: 段階を画面用に別の JSON へ手で書き写さない。聞き取り台帳から導出できない値は「未記録」と表示する。
- **完了条件**: 台帳の件数と段階が画面に出て、台帳が空・欠けている場合に「未記録」になるテストがある。
- **順番 (2026-10-27 オーナー決定)**: 判断ゲート4枚の 3 番目。単独の画面にせず `STRATEGY-GATE-TABLE-01` のゲート表の行として出す。

### [STRATEGY-GATE-UNIT-ECONOMICS-01] 商品 pilot の限界利益と工数込み採算を、記録から計算して管理画面に出す
タグ: [収益化] [種類:改善] [実行:対話] [起票:2026-10-27] [領域:戦略]

- **背景 (2026-10-27 の棚卸し)**: 収益化戦略 §3.4「価格と採算」は限界利益と工数込み採算の式を定めているが、計算している場所が無い。運営者の時間単価と pilot の工数上限も未決で、式に入れる値が揃っていない。
- **次**: ① オーナーが時間単価と工数上限を決め、§3.4 に書く (対話) ② `data/products/sales-ledger.json` の実売・返金・手数料と工数の記録から、商品ごとの限界利益と工数込み採算を計算して `/revenue` に出す。工数の記録先が無ければ、先に台帳 (`config/datasets.mjs` に1行) を決める。
- **禁止**: 時間単価が未決の間は工数込み採算を0や推定値で出さない (「単価未決」と表示)。
- **完了条件**: 単価と工数上限が §3.4 にあり、画面の採算が台帳の値から再計算できるテストがある。
- **順番 (2026-10-27 オーナー決定)**: 判断ゲート4枚の最後。実売が計2件・¥413 (販売台帳、〜2026-09-30) で、採算を計算しても判断が変わらないため。単価と工数上限の対話は、商品の実売が増えたときか有料 pilot を始めるときに行う。

### [STRATEGY-GATE-TABLE-01] 収益化戦略 §5 のゲート表6行の通過・未達を管理画面に並べる
タグ: [収益化] [種類:改善] [実行:sweep] [検証:npm run test -w apps/admin] [起票:2026-10-27] [領域:戦略]

- **背景 (2026-10-27 の棚卸し)**: §5 のゲート表 (計測・AdSense・アフィ横展開・トラフィック拡大・商品横展開・B2B基盤) のうち、管理画面に状態が出ているのは計測 (`/affiliate` の measurementGate) とアフィ横展開 (pilot readiness) の2行だけ。商品横展開と B2B基盤は状態を持つデータが無い。
- **次**: ゲート表をパースし、各行に既存の判定 (measurementGate・readiness・AdSense の計測範囲・マーケティング戦略の T1〜T4) をつなぐ。判定元が無い行は「判定元なし」と出す。商品横展開と B2B基盤は `STRATEGY-GATE-ADMIN-PILOT-01` の段階から導けるかを先に確かめる。
- **禁止**: 判定を画面側で新しく作らない。既存の判定関数・state を読むだけにする (`strategy-lanes.ts` と同じ方針)。
- **完了条件**: 6行すべてが「通過・未達・判定元なし」のどれかで表示され、表の行が増減したら検出するテストがある。
- **順番 (2026-10-27 オーナー決定)**: 判断ゲート4枚の 2 番目。`STRATEGY-GATE-ADMIN-PILOT-01` は単独の画面にせず、この表の「商品横展開」「B2B基盤」行の判定元として作る。
- **追記 (2026-10-27 の画面確認)**: ① 置き場は `/dashboard` (現況レビュー) の「今週の判断」。2026-10-27 のメニュー再設計で `/strategy` は方針だけになり、判断の要約は現況レビューに集めた (`data/business/domains.json` の navRules) ② `/strategy/pilots` は判定日を過ぎた KDP (判定日 2026-09-27) を「判定不能」に数え、「判定待ち 0」と出す。判定日を過ぎた判定不能の pilot を見分けられるようにする ③ pilot ボードに合格・撤退の基準の列が無い。基準は各 pilot カードか収益化戦略に書き、画面はそれを読む。

### [STRATEGY-GATE-ADSENSE-UNITS-01] AdSense の枠を外す基準を決め、ユニット別の数字と並べて管理画面に出す
タグ: [収益化] [種類:改善] [実行:対話] [起票:2026-10-27] [領域:戦略]

- **背景 (2026-10-27 の棚卸し)**: 収益化戦略 §3.1 は「ユニット別の収益・視認率を週次で比べ、効かない枠を外す・動かす」と決めているが、外す基準 (何週続けて何を下回ったら外すか) が書かれていない。`/revenue` はユニット別 CSV (`history-units.csv`) を表示するが、判断の基準が無いので数字を見ても決められない。モバイルの手動枠の扱いも「再開後の実測で決め直す」のまま期日が無い。
- **次**: ① オーナーと基準 (例: 視認率・1,000表示あたり収益の下限と連続週数) と見直しの期日を決め、§3.1 か `manual-ad-policy.ts` に書く (対話) ② `/revenue` のユニット別表に基準を下回ったユニットの印を出す。
- **禁止**: 基準を画面側に直書きしない。基準の置き場を1か所にする。
- **完了条件**: 基準が SSOT に書かれ、画面がそれを読んで下回ったユニットに印を付けるテストがある。
- **順番 (2026-10-27 オーナー決定)**: 判断ゲート4枚の 1 番目 (AdSense 基準 → `STRATEGY-GATE-TABLE-01` → `STRATEGY-GATE-ADMIN-PILOT-01` → `STRATEGY-GATE-UNIT-ECONOMICS-01`)。`ADSENSE-PLACEMENT-01` の4週判定 (Due 2026-11-14) より前に基準を決める。
- **前提 (2026-10-27 `/revenue` で観測)**: W42 のユニット別表で 10 ユニット中 5 つが `match_status=unmanaged` (blog-inarticle・ranking-incontent-mobile・ranking-footer-multiplex・hub-incontent・content-footer-multiplex)。収益上位 2 つを含むので、コードの枠 (`code_slot`) との対応を先に埋めないとユニット別の基準を配置の判断に使えない。また W42 の前週比は停止中の W34 と比べた値 (+1712%) なので、再開前の週と比べない表示にする。

### [ADSENSE-OVERLAY-AB-01] 自動広告のオーバーレイ形式 (アンカー → 全画面) だけを、広告インテントをオフのまま 1 つずつ A/B テストし、1,000 PV あたりの収益を上げる
タグ: [収益化] [種類:改善] [実行:対話] [起票:2026-10-28] [期日:2026-11-25] [領域:アフィリエイト]

- **根拠**: 停止前の実測で 1,000 PV あたり自動広告込み ¥22、手動枠だけ ¥6.7 (収益化戦略 §3.1)。差の大半はオーバーレイ形式の視認率と推定する (**未検証**。形式別の内訳は取っていない)。前のテスト (広告インテント、10-13〜10-27) はオリジナルが選ばれ、インテントはオフのまま。
- **やらないこと (2026-11-11 改定)**: body の `google-anno-skip` は外さない (広告インテントは管理画面でオンのままだが、この class が全ページで拒否する。8 月に出典の文字を広告リンクに書き換えた事故の再発防止)。サイドレール広告と Multiplex の自動広告は、テストなしでオンにしない。
- **実行中 (2026-10-28 開始)**: AdSense のテスト「ADSENSE-OVERLAY-AB-01 アンカーのみ」(id 7866855473613169、ユーザーの 50%・〜2027-01-26)。パターンは「自動広告オン・インテント 0/1・オーバーレイ 1/3 (アンカーのみ)・ページ内 0/2」。**自動適用はオンのまま** (オーナーが選択)。開始直後の `third-party-dom-injection` smoke は 3/3 合格 (パターンが当たったかは不明で証拠として弱い)。
- **2026-11-11 実測 (AdSense の画面と本番。設定は変えていない)**:
  - テストは 10-28〜11-04 で終了し、状態は「パターンを適用済み (Google)」。パターンが優位である可能性 99.5%、収益はオリジナル 64 円・パターン 232 円 (+263%)、合計表示回数 8,875、月間の推定 +1,427 円。パターンの設定は記録どおり「インテント 0/1・オーバーレイ 1/3・ページ内 0/2」。Google が作った「Ad intents」(10-13 開始) は「オリジナルを選択済み」。
  - **現在のサイト設定はパターンと違う**: 広告 → サイトごと → stats47.jp は「自動広告 オン・自動最適化 オン・ページ除外 0」で、中身は インテント 1/1 (広告インテント オン)・オーバーレイ 2/3 (アンカー オン・全画面広告 オン・サイドレール オフ)・ページ内 1/2 (バナー広告 オン・Multiplex オフ)。全画面広告の頻度は 10 分。上の「やらないこと」(広告インテント・ページ内の自動広告はオンにしない) と食い違う。誰がいつ変えたかの記録はリポジトリに無い (11-04 以降の commit・改善ログに該当なし)。[仮説] 自動最適化 (オン) か手動の変更。検証: AdSense の画面で変更の経緯をオーナーが確かめる。
  - **本番 (Playwright・headless Chromium・3 ページ × 幅 390 と 1440)**: スマホは 3 ページとも、上部のアンカー広告 (高さ 66〜427px)・自動で差し込まれた本文の広告 3〜4 個 (308×250・340×302・390×390。最初の 1 個は y=263〜591 でファーストビューの中)・全画面広告の要素あり。PC はアンカーと本文の自動広告が 0、全画面広告の要素あり。広告インテントのリンク (`google-anno`) は 6 回の測定で 0 件で、出典の書き換えは観測していない。
  - 台帳の規則 (`data/ads/placements.json` の noFirstView・本文の AdSense 4 枠まで) は手動枠だけを数えており、自動で差し込まれる本文の広告はこの規則の外で出ている。スマホのランキングの CLS 0.224 (11-11・1 回の測定・ずれた要素は H1 と上部の grid) は、上部のアンカー広告の高さ 427px と同じページで出ている。因果は未確認。
  - **オーナー決定 (2026-11-11)**: いまの設定 (アンカー・全画面・ページ内バナー・インテント オン) を続ける。収益化戦略 §3.1・`constants.ts`・monetization-strategy の記述は同日に合わせた。出典の書き換えの smoke は、デプロイ後に加えて毎週土曜 05:30 JST に本番で回る (`post-deploy-smoke.yml` の schedule)。
  - **決定後の次**: ① 11-14 の取得 (`data/adsense/history-formats.csv`) で形式別の収益を読み、全画面とページ内バナーの寄与を分ける ② スマホのランキングの CLS を、上部アンカーが出た回と出ない回で比べる ③ 1 セッションあたりページ数を GA4 の記録で確かめる (下の停止条件 -5%)。
  - **広告インテントは全ページで止めている (2026-11-11 オーナーの問い「有効な場合までブロックしていないか」への確認)**: body の `google-anno-skip` は 2026-10-10 (PR #1119) に入り、出典に限らず全ページの全文で広告インテントを拒否している。Google の「Ad intents」テスト (10-13〜10-27・オリジナルを選択済み) はこの拒否が入った後に走っているので、[仮説] パターン側でもインテントは表示されておらず、このテストは広告インテントの収益性の証拠にならない。検証: テストの詳細画面でパターンの表示回数と収益を読む。範囲を絞る方法は 2 つ考えられる: (a) 目印を body から出典・図の注記・表だけへ移す (要素単位で効くかは公式ヘルプで未確認。11-11 に探した 3 URL は該当ページでなかった) (b) 管理画面の 3 つの形 (既存の文字へのリンク・アンカー・チップ) のうち、文字を書き換えないものだけを残す。どちらも試すなら 1 ページ種別だけで、smoke を先に通す。試すかはオーナー判断。
  - **広告インテントのアンカーとチップを、ブログの個別記事で試す (2026-11-11 オーナー決定・実装は develop。本番は未反映)**: 公式ヘルプ (support.google.com/adsense/answer/13844047・11-11 取得) で、既存の文字を書き換えるのは 3 つの形のうち「リンク」だけ、body の目印は 3 つすべてを止める、形は管理画面で個別に切り替えられる、と確認した。オーナーが管理画面で「リンクを既存のテキストに挿入」をオフにし、読み取りで「リンク オフ・アンカー オン・チップ オン」を確認した (11-11 07:58Z)。コードは、サーバーが返す HTML の body に目印を残したまま、`/blog/<slug>` を開いたときだけ `AdIntentScope` が外す (`apps/web/src/lib/google-adsense/ad-intent-scope.ts`)。出典の一覧・図の注記・表・引用・記事の見出し・右レールには要素単位の目印を付けた。localhost で、記事は目印なし・ランキングと一覧は目印あり・一覧から記事へ移ると外れ、戻ると付く、を確認。
  - **反映後に確かめること**: ① 本番のブログ記事でアンカーとチップが実際に出るか、出る位置 (スクリーンショット) ② ブログ以外のページでアンカーが出ていないか (要素単位の目印がアンカーを止めるかは公式の記述では分からなかった) ③ `third-party-dom-injection` smoke が合格するか ④ 11-14 以降の `data/adsense/history-formats.csv` で広告インテントの収益 ⑤ 読みやすさを損なうならオーナー判断で戻す (`isAdIntentAllowedPath` を常に false にする)。
  - **停止条件 (追加)**: 管理画面でリンクが再びオンになっていたら、即 `isAdIntentAllowedPath` を常に false に戻す (管理画面の設定は 11-04 以降に記録なく広がった前例がある)。週次レビューで管理画面の 3 つの形を読む。
  - **本番へ反映 (2026-11-11・PR #1251・08:49Z マージ・デプロイと post-deploy smoke は成功)。反映後の実測 (Playwright・headless Chromium・5 ページ × 幅 390 と 1440)**: ブログの個別記事 2 本は body の目印なし・要素単位の目印 8〜16 か所で、広告インテントのアンカー (`div.google-anno-sa`・画面下に固定・幅 358〜472 × 高さ 50) が 1 つ出た。文言は「地図を見る」(発泡酒の記事)・「税理士を探す」(宿泊費の記事)。チップ (段落の末尾) は 4 回の測定で 0 件。`/blog`・`/ranking/total-population`・`/themes/population-dynamics` は body の目印あり・広告インテントの要素 0。文中の語のリンク化 (書き換え) は 10 回の測定で 0 件。
  - **反映後に見つかった点**: ① 広告インテントのアンカーが、画面下の Cookie 同意の帯と重なる (同意前の読者。スマホ・PC とも)。② 文言と記事の内容の関連が弱い (宿泊費の記事に「税理士を探す」)。③ スマホでは、既存の自動広告の上部アンカーが画面の約半分を占めていた (同じ測定の画像)。①〜③ を踏まえて続けるかはオーナー判断。
  - **① の重なりを直した (2026-11-11・develop。本番は未反映)**: Cookie 同意の帯が、広告インテントのアンカーの上へ避ける (`use-ad-intent-anchor-inset.ts`・`CookieConsentBanner.tsx`)。広告の側は動かさない。アンカーは `<html>` の直下に後から入り、たたむと高さが変わるので、DOM と大きさの変化で測り直す。localhost で、同じ class の検証用の要素を差し込み、帯が 66px 上がって重なり 0・たたむと 36px・消すと元に戻ることを確認。本番の実物のアンカーでの確認は反映後。
  - **別件 (11-11 localhost で観測)**: ブログ記事で「`<div>` は `<p>` の子にできない」の hydration の警告が出る。本文の段落の中に広告の枠 (`ad-contain…` の div) が入っているため。今回の変更の前からある構造で、本番でも同じ入れ子になっているかは未確認。
- **次 (実行順)**: ① 2026-11-04 までに smoke を再実行し、本番でアンカー広告が出ているページでも出典の書き換えが無いことを確かめる ② **毎週**テスト画面を読み、Google が判定を出す前に下の判定を当てる。収益は勝っていても判定の条件を外れていれば「オリジナルを選択」で終える (自動適用に任せない) ③ 4 週 (2026-11-25) で途中結果と GA4 のページ数・CWV を記録する ④ 終えたら同じ型で全画面 (ビネット) を試す。自動適用は作成時にオフにする (Google 管理画面の操作は `.claude/scripts/google-admin/README.md` の安全契約に従う)。
- **判定**: パターンの 1,000 PV あたり収益 (`ad-yield`・GA4 PV が分母) がオリジナルを上回り、かつ 1 セッションあたりページ数とエンゲージメント率が -5% 以内、CLS・LCP がランキング詳細で悪化していないこと。
- **停止条件**: 出典の書き換えが 1 件でも出たら即終了してオリジナルに戻す。1 セッションあたりページ数が -5% を超えて落ちたら止める (回遊が PV の主レバーなので、単価と引き換えにしない)。
- **読者の課題 / HARM**: 読者の課題は変わらない。読みやすさを損なわない範囲で、AdSense を Cloudflare の維持費の相殺に近づける (M・運営側)。
- **完了条件**: アンカーと全画面の 2 テストの結果 (1,000 PV あたり収益・ページ数・CWV) が記録され、適用するかの判断が収益化戦略 §3.1 に書かれている。

### [TRACKED-SECRET-FILE-CHECK-01] 秘密情報らしい名前の追跡ファイル 2 本に、本物の秘密が入っていないかを確かめる
タグ: [インフラ・計測] [種類:不具合] [実行:ユーザー] [起票:2026-10-26] [領域:管理]

- **事象 (2026-10-26・GITIGNORE-AUDIT-01 の点検)**: `.claude/config/auth-credentials.json` と `apps/web/.env.development` が git で追跡されている。リポジトリは PUBLIC。セッションからは中身を読む操作が安全判定で止められたため、値は確かめていない (`data/sns/instagram-token.json` は台帳に「トークン本体は置かない」とあり対象外)。
- **次 (オーナー)**: 2 本を開き、パスワード・API キー・トークンの値そのものが入っていないかを確かめる。名前・置き場所・期限だけなら問題なし。値が入っていたら、その鍵を失効・再発行し、ファイルから値を抜いて追跡を続けるか ignore するかを決める。
- **完了条件**: 2 本に秘密の値が無いことを確かめた、または入っていた鍵を失効させて値を取り除いた。

### [OGP-RANKING-CARD-BLOG-REPAIR-01] ranking カード画像の残り 1,459 件の作り直しと、ブログ OGP の週次自動修復を止めている 1 記事の背景記録を直す
タグ: [インフラ・計測] [種類:不具合] [実行:対話] [起票:2026-10-26] [領域:サイト]

- **経緯**: 週次 OGP 監査 (run 39906938780・2026-10-23) で次の 2 点が残った。
- **ranking のカード画像**: 実際に古い画像が 2,459 件あり、1,000 件を作り直して残り 1,459 件。`quality-suite-weekly.yml` の ogp-images job を上限 1,000 でもう 1〜2 回動かす。
- **ブログの OGP**: `aging-rate-akita-vs-okinawa` の `app/blog/aging-rate-akita-vs-okinawa/ogp/generation.json` に `stats47-sha256` が無く (パイプライン外の書き込み)、「R2 AI背景画像契約がmanifestと一致しません」でブログ全体の自動修復が毎週止まる。この 1 記事の背景の記録を正す。
- **2026-11-11 実測 (note の記事更新が公開後の検証で落ちる件から発見。`NOTE-PUBLISHED-AUDIT-01`)**: 作り直した画像の公開 SHA がリンクカードの台帳 (`data/ogp/link-card-rollout.json`・分割 `link-card-sites-NNN.json`) に戻っていない。台帳の site-ogp 3,197 種のうち 1,606 種 (ranking 868・blog 609・themes 56・areas 47・products 25・トップ 1) は、今の配信物の SHA が台帳と違う (トップは manifest の `generatedAt` が 2026-10-30T20:58・台帳の記録は 10-26)。公開 SHA を台帳へ記録する入口は `link-card-production.ts record-site --plan --run-url` だが、どの workflow からも呼ばれていないので、週次の自動修復 (`quality-suite-weekly.yml` の OGP image audit) が画像を作り直すたびに台帳が置き去りになる。その job は 10-30 (run 41122877579) と 11-06 (run 42295351706) に「Fail on unresolved image drift」で失敗している (11-06 は Self-heal の step も失敗)。サイトの og:image は固定の版 `?v=20261026-pop` で配られ、画像を作り直しても URL は変わらない。
- **影響**: note の記事を更新する道具 (`update-published-navigation.mjs` など) は、公開のあとに stats47.jp のカードの画像を台帳の SHA と照合する。台帳が古いので `Verified source image bytes changed` で「失敗」と表示される (公開は済んでいる)。トップのカードは多くの記事にある。note 側のカード画像も古いまま残る (カードの URL の版 `s47_ogp` は台帳の SHA から作るため)。
- **直し方の案 (未実装・オーナー判断待ち)**: ① 作り直しを最後まで終える (残り件数と Self-heal の失敗の原因を先に確かめる)。② 台帳を今の配信物へ合わせる。`record-site` は CI の公開計画と run の URL が要るので、配信中の manifest を読んで画像の SHA と寸法を確かめて記録する入口を足すか、週次 job が公開計画を `record-site` へ渡すように配線する。どの run が作ったかを確かめられない記録を、run の URL 付きで書かない。③ そのあと note の残り 102 本を流す。
- **保留 (2026-11-11 オーナー判断)**: 別セッションが台帳の整理をしているので、②の実装はその整理が済んでから始める。コードはまだ 1 行も書いていない。再開のときは、先に `data/ogp/` と `.claude/scripts/ogp/lib/link-card-ledger.mjs` の形が下の前提から変わっていないかを確かめる。
- **②の設計の案 (未実装。再開のときの出発点)**: `.claude/scripts/ogp/link-card-production.ts` にサブコマンドを 1 つ足す (名前の案 `resync-site [--dry-run] [--limit N]`)。R2 や本番には書かず、git の台帳だけを書く。
  1. `kind: "site-ogp"` で `pageUrl` と `sitePublication` を持つ entry を順に見る。トップと `/category/*` は同じ画像 (`app/default/stats47/ogp/ogp.png`) を共有するので、取得は `manifestKey` ごとに 1 回にまとめる。
  2. 配信中の manifest (`${R2_PUBLIC_BASE_URL}/${manifestKey}`) をキャッシュを避けて取る。形は `{ kind: "stats47-image-generation", schemaVersion: 1, generator, entityId, inputHash, rendererHash, fingerprint, generatedAt, assets: [{ key, variant: "ogp", contentType, width, height, sha256 … }] }` (2026-11-11 にトップの manifest で実測)。`kind`・`schemaVersion`・`variant: "ogp"` の asset の `key` が台帳の `imageKey` と同じことを確かめ、違えば止める。
  3. manifest の SHA と asset の SHA が台帳と同じ entry は触らない (11-11 の実測で 3,197 種のうち 1,591 種)。
  4. 違う entry だけ、画像を `?v=<asset の sha256>` で取り、バイト列の SHA が manifest の値と同じこと・寸法が 1200×630 であることを確かめてから `sitePublication` の `manifestSha256`・`fingerprint`・`sha256`・`verifiedAt` を書き換える。1 件でも合わなければ、その entry は書かずに一覧へ出して exit 1。
  5. **出どころの扱いを先に決める。** `sitePublication.runUrl` は「この画像を公開した Actions の run」で、型では必須の文字列になっている。配信物から合わせた記録では run を確かめられないので、古い `runUrl` をそのまま残すと嘘の出どころになる。案は「`runUrl` を任意にして、配信物から合わせた記録には `source: "live-manifest"` と manifest の `generatedAt` を持たせる」。型 (`Entry`)・`link-card-ledger.mjs`・`link-card-ledger.d.mts`・`runUrl` を読む側 (`grep -rn runUrl .claude/scripts apps`) を同じ差分で直す。
  6. テストは `.claude/scripts/ogp/__tests__/` に足す。固定するのは「同じなら触らない」「SHA が合わない画像は書かない」「寸法が違えば書かない」「共有の画像は 1 回だけ取る」「run を確かめられない記録に run の URL を書かない」。
  7. 週次の配線: `quality-suite-weekly.yml` の OGP image audit が画像を作り直したあとに同じサブコマンドを流し、台帳の差分を develop へ書き戻す。配線しないと次の作り直しでまたずれる。
- **②の確かめ方**: `--dry-run` の件数が 11-11 の実測 (違う 1,606 種・同じ 1,591 種) と大きく違わないこと。書いたあとに `node .claude/scripts/note/update-published-navigation.mjs --slug recovered-n581a1409b2c9` (dry-run) を流し、次に反映する記事で公開後の検証が `Verified source image bytes changed` を出さないこと。11-11 に落ちていたカードは、トップ (`https://stats47.jp/`)・`/ranking/final-education-university-graduate-school-ratio`・`/blog/university-advancement-capacity`。
- **①で先に確かめること**: 週次の OGP image audit は 10-30 (run 41122877579) に「Fail on unresolved image drift」、11-06 (run 42295351706) に「Self-heal changed images」と「Fail on unresolved image drift」で失敗した。失敗の中身 (上限 1,000 で残っただけか・生成そのものが落ちたか) はログを読んでいない。`gh run view 42295351706 --log-failed` の OGP の job から読む。作り直しが続いている間は、合わせた台帳が毎週ずれる。
- **台帳を合わせたあとに起きること**: カードの URL の版 `s47_ogp` は台帳の `imageUrl` と SHA から作る (`.claude/scripts/note/lib/card-image-refresh.mjs` の `versionUrl`)。台帳の SHA が変わると版も変わり、記事を更新したときに本文のカードの URL が書き換わって note がカード画像を取り直す。つまり note の記事の更新は、文言だけでなくカード画像の入れ替えも同時に行う。差分を見るときはこの URL の変更を想定に入れる。
- **完了条件**: 週次 OGP 監査で ranking カードの更新必要が 0 件、ブログのサムネイル工程が成功している。

### [BLOG-AUTOMOTIVE-BIRTHDEATH-FOLLOWUP-01] 自動車産業の記事の題名と中身のずれ、出生と死亡の記事に残る critic の MAJOR 6 件を直す
タグ: [コンテンツ品質] [種類:不具合] [実行:対話] [起票:2026-10-26] [領域:サイト]

- **経緯**: `BLOG-TEXT-CHART-CONFLICT-20261006` の本文の食い違いは 2026-10-24 のデプロイで直り、2026-10-26 に本番で確かめた (3 記事とも 200、alcohol に「9.5%」あり、birth-death に「微増」なし、automotive は製造業全体の出荷額の版)。同じ改稿で次の 2 点が残った。
- **automotive-industry-transformation-map**: 輸送用機械の県別の図 4 枚を e-Stat から取り直せず外し、全業種合計の製造品出荷額で書き直したため、本文に自動車の数値が無く、題名「自動車産業の県別勢力図」とずれる。CI の app id で輸送用機械の県別出荷額を取り直すか、題名と背景画像を作り直すかを決める。
- **birth-death-gap-decline**: critic の MAJOR が 6 件残る。うち 2 件は全国値 1.20・50 歳時未婚割合・婚外子 2% 台の出典が R2 に無く未確認。
- **完了条件**: 2 記事で上の点が解消し、`quality-gate.mjs` が blocker 0・critic PASS。

### [RANKING-HEADING-YEAR-DECISION-01] ランキングページの見出しの近くに最新年を出すか決める
タグ: [UI・UX] [種類:改善] [実行:対話] [起票:2026-10-21] [領域:サイト]

- **決定 (2026-10-26 オーナー)**: 出す。h1 の文言は変えず、見出しの横か直下に「最新 2006年度」のような年を添える。古いデータだけ目立たせるかは実装時に決める。

- **事実 (2026-10-21、週次 UI 検査 `agent|ranking--old-2years` の指摘)**: `/ranking/national-pension-full-exemption-rate` はデータが 2005〜2006 年度と古いのに、見出し (h1「国民年金保険料全額免除割合」) の近くに年が無い。年は上部のカードの小見出し (「2006年度」) と年の切り替えにだけある。同じ指摘の表の右端が切れる件は `RankingDataTable` の列幅で直した (未デプロイ)。
- **決めること**: 全ランキング (約 2,400 ページ) の見出しの隣か直下に「最新 2006年度」のような年を出すか。出すなら、古いデータ (最新年が 10 年以上前など) だけ目立たせるかも決める。見出しの文言は SEO のタイトルにも関わるので、h1 自体は変えずに横へ添える案を推す。
- **完了条件**: 方針が決まり、出す場合は実装して `ui-findings.ts --mark-fixed agent|ranking--old-2years` を付ける。

### [KDP-ROYALTY-RATE-CHECK-01] KDP の印税率が 35% になっている原因を確かめ、70% の条件を満たせるかを判断する
タグ: [収益化] [種類:改善] [実行:対話] [起票:2026-10-17] [領域:商品]

- **決定 (2026-10-26 オーナー)**: やる。設定を変えるかは結果を見て 1 冊ずつ決める。
- **原因 (2026-10-28 確認)**: KDP ヘルプ (https://kdp.amazon.com/ja_JP/help/topic/G200634500) では、Amazon.co.jp での販売で70%になるのは KDP セレクト登録の本だけ (70%の価格帯の条件もある)。`data/products/kdp/listings.json` は全冊 `royaltyPlan:70`・`kuEnrolled:false` なので、日本の販売はすべて35%になる (実売 ¥800→¥254・¥500→¥159)。セレクトに登録すると Kindle 版は90日単位で Amazon 以外に出せなくなる。打ち手の台帳は `data/business/experiments.json` の EXP-011。
- **既刊は登録しない (2026-11-04 オーナー決定)**: 販売中の S1 12 冊は stats47.jp の無料記事と一字一句同じ文が 9.5〜33.3% あり (言い換えを含めるとさらに多い)、KDP Select の案内 (https://kdp.amazon.com/en_US/select) は期間中のウェブサイトやブログでの電子配布を認めない。さらに書き下ろし原稿 `packages/product-factory/src/channels/kindle/manuscripts/` の 178 ファイル (1.5 MB) が公開リポジトリと git の履歴に残っていて、書き直しても本文が別の場所で読めるので、書き直しにも着手していない。代わりにセレクト専用の新作 1 冊 K-S1-13 (原稿は `.local/kindle-private/K-S1-13/` で repo に入れない) で70%の効果を確かめる。本の組み立ては `freshFile` に repo の外の相対パスを渡せば読める。
- **未確認**: 抜粋の許容の割合・違反時の扱い・自動更新の既定・改訂審査中の登録は、公開の案内ページに書かれていない (規約本文は 3 つの URL が 404 で取得できなかった)。解除は開始から 3 日以内ならできる。
- **済み**: K-S1-13『住む県の選び方 — 統計で比べる5つの条件』を ¥500・70%・KDP セレクト登録ありで提出し、2026-11-06 に販売中になった (ASIN B0HQBGV4RD)。原稿は `packages/product-factory/.local/kindle-private/K-S1-13/`、R2 に暗号化保全 (revision d60ed0e8069a929a)、控えは Drive の `stats47/Kindle原稿/K-S1-13/`。
- **次**: ① 審査へ出した紹介文に「国・自治体や e-Stat の公認・推奨を示すものではありません」が無い (data-provenance-standards の要求)。台帳とカタログは直し済みなので KDP の紹介文を更新する。カタログの変更で authoredSha が r8 と変わるので、組み立て直し (受領証・保全も) が要る。② 売上と KENP を土曜の記録で読み、35% の既刊と比べる。90 日の自動更新の既定は未確認なので、期限前に KDP の本棚で確かめる。③ KDP の管理画面の規約を確かめる。`kdp-form.mjs` の登録は「人手確認推奨」のままで、自動の登録は実装を確かめていない。
- **完了条件**: 35% の原因が公式の条件と台帳の設定で説明され、変えるかどうかをオーナーが決めた。

### [AREA-TOC-MOBILE-01] 県ページの目次をスマホでも本文上部に出すか、16 項目をどう見せるかを決める

タグ: [UI・UX] [種類:改善] [実行:対話] [起票:2026-09-25] [領域:サイト]

- **決定 (2026-10-26 オーナー)**: やる。スマホでは本文上部に目次を折り返す横並びのリンクで出す。PC の右レールの目次を残すかは実装時に決める。

- **背景 (2026-09-25 localhost `/areas/13000` 実測)**: 「〇〇の目次」(県データブックの 16 節へのリンク、
  `AREA_DATABOOK_TOC_ITEMS`) は PC では右レール最上部 (追従なし) にあるが、375px では 1 件も表示されない
  (リンクの表示幅 0)。スマホには県ページの目次が実質無い。ブログと違い 16 項目あるので、本文上部へ縦に並べると
  画面を大きく占める。
- **決めること**: ① スマホで本文上部に目次を出すか。② 出すなら見せ方 (折り返す横並びのリンク / 主要節だけ /
  その他)。表示領域に収まるリンク一覧は折りたたまない規約 (`.claude/rules/ui-components.md`) を前提にする。
  ③ PC の右レールの目次を残すか、本文上部へ統一するか (`BLOG-TOC-TOP-ONLY-01` の「目次は本文最上部 1 か所」と
  そろえるか)。判断材料に `NAV-CLICK-COVERAGE-01` の導線名で目次のクリックを数週観測してもよい。
- **完了条件**: 採否と見せ方を決め、採るなら実装カードへ置き換える。見送るならカードを削除する。

### [NOTE-INS-IMG-HEADING-PLACEMENT-01] ins_img が見出し直前の段落をアンカーにすると画像が見出し直後へずれる

タグ: [種類:不具合] [実行:対話] [起票:2026-09-16] [領域:商品]

- **owner**: 未定
- **問題**: `.claude/scripts/note/editor-helpers.sh` の `ins_img` は、アンカー段落の「次の `<p id=>`/`<li>`」を挿入位置にするため、アンカー段落の直後が見出しだと画像が見出しの直後 (1 ブロック先) にずれる。2026-09-16 に b-kakei-* 8 本で `audit-note-figure-split.mjs` の misplaced 14 枚として発覚 (正しい画像なので公開は維持)。
- **試して失敗した案**: アンカー段落自身をクリックして段落末尾で Enter する変更は `b-kakei-necktie-decline` で misplaced が 1→2 に悪化して撤回した (原因未特定)。
- **次**: `BU state` の生ダンプ (`/tmp/ns.txt`) を見出し前後の段落で目視してから awk の抽出条件を組み直す。ライブの note エディタで最低3パターン (見出し直前 / 見出し無し / リスト直前) を実地検証してから全 note 記事へ展開する。
- **禁止**: ライブ DOM の実物を見ずに正規表現だけを推測で直さない (今回の失敗の再発)。
- **完了条件**: 見出し直前アンカーを含む記事で `audit-note-figure-split.mjs` の misplaced が 0。

### [SNS-WEEKLY-REPORT-MIRROR-01] SNS 週次レポートの workflow が Codex ミラーのリンクを足さず develop の品質ゲートを落とす
タグ: [エージェント・SSOT] [種類:不具合] [実行:sweep] [検証:node .claude/scripts/lib/check-agent-skill-consistency.cjs --no-orphan] [起票:2026-10-26]

- **症状**: `sns-weekly-report.yml` はレポートだけを `git add` し、`.agents/` のミラーのリンクが入らない。W43 (`2df9acbe6`) で整合性検査 E12 が出て品質ゲート run 40251621046 が失敗した (`467802415` で手で直した)。
- **次**: 書き戻しの前に `node .claude/scripts/lib/sync-codex-mirror.cjs` を実行し、`.agents/skills/sns/sns-weekly-report/reference/reports` も `git add` に入れる。
- **完了条件**: 手動起動でレポートとリンクが同じコミットに入り、次の品質ゲートで E12 が出ない。
- **2026-10-26 実装 (develop・main 未反映)**: 書き戻しの前に `sync-codex-mirror.cjs` を実行し、`.agents/` のレポートの置き場も `git add` に入れた。手元の `sync-codex-mirror --check` と整合性検査 (`--no-orphan`) は通る。workflow の変更は main へ反映されるまで動かないので、完了条件 (手動起動でレポートとリンクが同じコミットに入る) は main 反映後の次の起動で確かめる。

### [CRITIC-PATTERN-YEAR] critic の指摘「年の食い違い」が 5 本の記事で繰り返した。writer の規約か gate に入れる
タグ: [コンテンツ品質] [種類:改善] [実行:対話] [起票:2026-10-24] [領域:サイト]

- **事象**: 直近の窓で、blog-critic が型「年の食い違い」(`year`) の BLOCK/MAJOR を 5 本の記事で 5 件出した。critic の目視でしか見つかっていない。例:
  - 2026-10-07 sixth-industry-direct-sales: seoTitle「農業産出額1位は北海道1兆4,817億・最下位東京226億｜農家総所得は北海道8位、大阪1位 2024年」は、末尾の「2024年」が農家総所得にもかかる読み方になります。
  - 2026-10-23 manufacturing-aichi-dominance: 調査の切り替わりの注意が、問題の年とずれている。
  - 2026-10-23 livable-prefecture-composite-ranking: 所得は 2020 年度を使っていますが、R2 `per-capita-prefectural-income-h27` の最新は 2021 年度です (東京都 5,761 千円、愛知県 3,597 千円)。
  - 2026-10-23 alcohol-prefecture-map: 「何を飲んでいるのか」の節で、年のそろえ方が読者に伝わりにくい。
  - 2026-10-23 automotive-industry-transformation-map: 調査切り替えの注意が、位置と影響範囲の両面で足りない。
- **次**: 機械で判定できるなら quality-gate に検査を足す (公開済み記事で誤検知 0 件を確かめてから blocker にする)。できなければ `.claude/rules/blog-quality-standards.md` と article-writer の指示に書く。
- **完了条件**: 検査か規約が入り、`.claude/config/critic-finding-types.json` の `year` に `promotedAt: "<入れた日>"` を書いた。
- 起票元: `critic-findings-digest.mjs` (台帳 `data/blog/critic-findings/`)

### [CRITIC-PATTERN-SOURCE] critic の指摘「出典・統計表」が 6 本の記事で繰り返した。writer の規約か gate に入れる
タグ: [コンテンツ品質] [種類:改善] [実行:対話] [起票:2026-10-24] [領域:サイト]

- **事象**: 直近の窓で、blog-critic が型「出典・統計表」(`source`) の BLOCK/MAJOR を 6 本の記事で 7 件出した。critic の目視でしか見つかっていない。例:
  - 2026-10-08 bonito-catch-prefecture: data/bonito-two-poles.source.json の来歴が実態と合わない。
  - 2026-10-08 school-teacher-annual-income: 警告 callout の「集計対象や方法が完全には統一されておらず、政令指定都市の教員を含むか否かで数値が変わる場合があります」は、この統計の注意点として根拠が無い。
  - 2026-10-23 manufacturing-aichi-dominance: 産業構成比の節を削除した穴が、「地方の製造業は今──産業構造の変化」節に残っている。
  - 2026-10-23 manufacturing-aichi-dominance: 工業地帯の範囲の出典(確認事項 d)は、京浜に千葉を含むか否かの根拠だけが十分である。
  - 2026-10-23 livable-prefecture-composite-ranking: 数値の根拠が読者に追える形になっていません。
- **次**: 機械で判定できるなら quality-gate に検査を足す (公開済み記事で誤検知 0 件を確かめてから blocker にする)。できなければ `.claude/rules/blog-quality-standards.md` と article-writer の指示に書く。
- **完了条件**: 検査か規約が入り、`.claude/config/critic-finding-types.json` の `source` に `promotedAt: "<入れた日>"` を書いた。
- 起票元: `critic-findings-digest.mjs` (台帳 `data/blog/critic-findings/`)

### [KABEUCHI-AGENT-01] サイトと収益化をエージェント相手に「公開壁打ち」できる型を作り、1回目をやる
タグ: [収益化] [種類:改善] [実行:対話] [起票:2026-10-21] [領域:戦略]

- **やりたいこと**: 運営者が相談者になり、エージェントを壁打ち相手（発想を広げる役）にして、stats47 のサイトと収益化の悩みに1時間で「その手があったか」を出してもらう。参考は GO 三浦崇宏×SHOGUN BURGER の公開壁打ち（The Solutions・2026-10-20 配信 https://pody.jp/player/IYyZ3oo32EztDR6WbOCS/YHBVBosHdRX59xygXsiM）
- **型（案）**: ① 悩みを2つまで聞く → ② 前提を読む（GA4・GSC・販売実績・共通事業方針・既存の戦略文書）→ ③ 第一印象を先に言う → ④ 質問で3〜4往復掘る → ⑤ 勝ち筋を4〜6個、すぐ試せる順に出す（各案に「読者の課題／HARM／支払う理由／需要の証拠か未検証／次の検証」）→ ⑥ 記録し、やると決めた案をカード起票
- **相手役（案）**: 発想を広げる役のほかに、収益の一手を断定する役・「それにお金払う？」と突っ込む読者役を並べるパネル形式も試す
- **完了条件**: 1回目を実施して記録が残り、型をスキル化するか（毎回呼べる形にするか）を決めている
- doboku-note にも同じカードを起票済み（同時に回す）

### [MODEL-USAGE-COVERAGE-01] エージェントの利用記録を Windows と CI の無人実行まで広げ、4 週分たまったら統合候補を決める
タグ: [エージェント・SSOT] [種類:改善] [実行:対話] [起票:2026-10-20] [領域:管理]

- **背景 (2026-10-20 実測)**: エージェントの定義は 61 体ある。Mac の利用記録 (`.claude/state/metrics/model-usage/local-mac.json`、W29〜W42 に Agent ツールで起動した分) で起動されたのは 6 種 (article-writer 11 回・blog-critic 8 回・note-critic 4 回など) で、57 体は記録上 0 回だった。ただし Windows の記録 (`local-windows.json`) は空で、CI の無人実行も数えていないので、「使われていない」とは判断できない。
- **次**: ① Windows で `.claude/scripts/model-usage/collect-local-usage.mjs` の記録が空になる原因を直す ② CI の無人 Claude (improvement-cycle など) の起動も同じ形で記録する ③ 4 週分たまったら、起動 0 回の体を統合候補として一覧にし、オーナーが決める。
- **停止条件**: 記録が 4 週分そろうまで、エージェントの定義を消さない。系統は残し、系統の中の重複だけを減らす (2026-10-11 オーナー判断)。
- **完了条件**: 3 環境の 4 週分の記録があり、統合候補の一覧とオーナーの判断が出ている。
- **追記 (2026-10-27)**: 管理画面 `/ops/agents` は週ごとの推移を TrendChart で出せない。`apps/admin/lib/server/agent-models.ts` の `UsageReport` が週別の値を持たないため。記録が 4 週分そろったら週別の配列を足し、`/ops/agents` にチャートを置く (`.claude/rules/admin-ui.md` の規約: 3 点以上の時系列はチャート)。

### [X-METRICS-WEEKLY-RECORD-01] X の指標を週次で記録する定期実行を作り、管理画面を読みに行く操作を止める hook の対象に X を加える
タグ: [SNS・マーケ] [種類:改善] [実行:対話] [起票:2026-10-20] [領域:SNS]

- **背景 (2026-10-20)**: Instagram の指標は週次の CI (`sns-metrics-weekly.yml`) が記録するが、X の指標は `/update-sns-metrics --platform x` が browser-use でその都度取るしかない。同日に、セッションが管理画面を読みに行く操作を hook で止めたが、X は代わりに読む記録が無いので対象から外した。
- **次**: X の指標を週 1 回 (認証付き計測と同じ土曜の Mac) で `data/sns/metric-snapshots/` に記録し、`.claude/scripts/measurement/sources.mjs` の `readUrls` に X の分析画面を足す。
- **完了条件**: X の指標が週次で記録され、セッションがブラウザで取りに行く必要が無くなっている。

### [SEO-KEYWORD-EDITABLE-PATH-01] キーワード改善サイクルが ranking / themes の定義ファイルを見つけられず、改善案を自動適用できない
タグ: [エージェント・SSOT] [種類:不具合] [実行:sweep] [起票:2026-10-19] [領域:サイト]

- **経緯**: `.claude/scripts/search-growth/keyword-cycle.mjs` の `editableFile()` が古い置き場 (`packages/data-configs/src/{metrics,theme-catalog}/<key>.ts`) を探していたため、`/ranking/*`・`/themes/*` 向けの改善案はすべて `editableFile: null` の提案だけの PR になっていた。実際の定義は ranking が `data/metrics/<key>.ts`、テーマが `data/themes/catalogs/<key>.json`。
- **済み (2026-10-19)**: `editableFile()` を現在の置き場へ直し、テスト (`keyword-cycle.test.mjs` の 3 件) を足した。
- **残り**: main へ入った後の `seo-keyword-cycle-daily` で、ranking 向けの案が `editableFile` 付きで出るかを確かめてからカードを削除する。テーマは JSON なので、置換処理が JSON を扱えるかも確かめる。
- **禁止**: 自動適用の対象を広げる目的で、検査や `validate:config` を緩めない。
- **完了条件**: `/ranking/general-hospital-count` と既存テーマ 1 件で `editableFile()` が実在ファイルを返すテストが通り、次回の `seo-keyword-cycle-daily` で ranking 向けの案が `editableFile` 付きで出る。

### [PV-100K-LEVERS-01] 月10万PV (28日 93,000) へ向けて、新規ページより「見えているのに取れていないクリック」と「1訪問のページ数」を動かす
タグ: [コンテンツ品質] [種類:改善] [実行:対話] [起票:2026-10-19] [期日:2027-01-31] [領域:サイト]

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

### [MONETIZE-BROAD-ROLLOUT-01] 収益の打ち手 12 本を先に広く並走させ、4 週の配置別 CTR・成約・ad-yield で絞る (2026-10-19 オーナー指示「まず広く展開してから絞る」)
タグ: [収益化] [種類:改善] [実行:対話] [起票:2026-10-19] [期日:2026-12-31] [領域:アフィリエイト]

- **前提 (2026-10-19 実測の要約)**: AdSense は停止前に 1,000 PV あたり ¥22 で PV に比例し、制約は「広告が出る PV」と単価。アフィリエイトは 7 日でクリック 8 (0.11%)・成約 0 で、サイドバー・ネイティブ枠 (表示の 6 割) はクリック 0。再開後 (10-11) の AdSense は `data/adsense/snapshots/2026-W42/` 以降で判定する。出典: `data/adsense/history.csv`、`data/affiliate/ga4-affiliate-history.csv`、`data/affiliate/{rakuten,a8}-results.json`。
- **方針**: 母数の無いものを先に落とさない。12 本を同じ表 (案件 × 位置 × 4 週) で並走させ、絞る規則を先に固定する。本番反映を伴うもの (B1・B5・C1・C2) はまとめて 1 回のデプロイにする (CLAUDE.md「デプロイは溜めて 1 回」)。

  | # | 打ち手 | 読者との接続 | 手間 | 判定指標・窓 | 実行カード / owner |
  |---|---|---|---|---|---|
  | A1 | AdSense 手動枠を全面 (11 ユニット) に戻す (今は 2) | 停止前は PV 比例 | S | `ad-yield` (円/1,000 GA4 PV) 4 週 | `ADSENSE-PLACEMENT-01` (improvements) |
  | A2 | 自動広告の再開 (前提: 出典文言の書き換えが `google-anno-skip` で遮断されていることを `third-party-dom-injection` smoke で確認) | 停止前の ¥22 の大半は自動広告 | S | 同上。書き換え再発 0 件 | `ADSENSE-OVERLAY-AB-01` |
  | A3 | 表示率の改善 (遅延読込の位置と first-view の 1 枠) | 広告が出る PV が制約 | M | imp/GA4 PV・視認率 4 週 | 新規 (performance-auditor と affiliate-manager) |
  | B1 | 物販 (食の特産): 消費量ランキング上位 40 品目に楽天 / Amazon の商品カード | 検索クリックの 27% が食の雑学 | S | 28 日でクリック 50 以上・成約 1 以上 | `AMAZON-ASSOCIATE-PILOT-01` |
  | B2 | ふるさと納税: 特産・農産・水産のランキングに県の返礼品リンク | 「1 位の県の味」に近い購買 | S | 品目ページへ移して 4 週の配置別 CTR | affiliate-manager (vertical `furusato`) |
  | B3 | 地域系案件 (引越し・旅行・移住) を住みやすさ・子育てのランキングに限定配信 | 意思決定の文脈 | S | 配置別 CTR 4 週 | `AFF-INTENT-FALLBACK-STOP-01` の配信条件を流用 |
  | B4 | 金融を家計・所得面に限定 (可処分所得クエリ 166 表示) | M の中核 | S | 同上 | `AFF-SMBC-NL-01`、`AFF-A8-EXPANSION-2026-10` |
  | B5 | サイドバー・ネイティブ枠を本文中・市区町村面 (クリックが出た位置) へ移す | 押されない枠が表示の 6 割 | S | 移設後 4 週の位置別 CTR | `AFF-SLOT-REDUCTION-01` |
  | C1 | ランキング末尾「作り方」1 行 → Claude Code 連載 → note 有料 | 「自分でも作りたい」層 | 済 | `nav_surface=ranking_making_of` 4 週クリック → 商品ページ到達率 | `RANKING-MAKING-OF-LINK-01` |
  | C2 | データ DL 商品の導線 (CSV/KML/地図用 → ココナラ・note) | file_download 週 300 超 | S | DL 後の商品ページ遷移率 | `PRODUCT-FUNNEL-DEPLOY-01`、`NOTE-KML-FUNNEL-01` |
  | C3 | Kindle 既刊 12 冊への導線を該当カテゴリのランキングに | 商品は既にある | S | KDP 販売数 4 週 (計測の再認証が前提) | `KDP-LEDGER-AUTO-01`、`AMAZON-ASSOCIATE-PILOT-01` |
  | D1 | スポンサー・データ提供 (B2B): 「県別データの引用・埋め込み」ページと問い合わせ口 | AI Assistant 流入の引用需要 | M | 問い合わせ件数 8 週 | 新規 (strategy-advisor がオーナー確認) |

- **今のデータで言えること**: サイドバー・ネイティブの汎用案件は「出ない」(8〜10 月 0.02〜0.22%・成約 0) ので B5 で位置を変えて再測定。AdSense は PV 比例で、再開後の `ad-yield` で A1/A2 の順番が決まる。物販・Kindle・ココナラ・自社導線は母数不足で判定不能なので、落とさず母数を作る。
- **絞る規則 (先に固定)**: ① 全件を `data/affiliate/ga4-affiliate-history.csv` の位置別・vertical 別の形で 4 週記録する。② 4 週後、表示 2,000 以上で **CTR 0.2% 未満かつ成約 0** の組 (案件 × 位置) は止める。0.2% 以上は `AFF-OFFER-ROTATION-01` の 2 週ローテで案件を入れ替えて続ける。③ AdSense は `ad-yield` ¥15/1,000 PV を境に、A2 (自動広告) を入れるか A1 (手動のみ) で行くかを決める。④ 商品導線 (C) は収益ではなく「導線クリック → 商品ページ到達率」で先に判定し、1% 未満の面は外す。⑤ 表示 2,000 に届かない組は判定せず `insufficient-sample` として次の 4 週へ持ち越す (`evidence-based-judgment.md` の 5 ガード)。
- **共通事業方針 (HARM)**: 読者の課題は「1 位の県の味を試したい・贈りたい」(B1・B2)、「住む県・子育ての県を決めたい」(B3)、「家計を見直したい」(B4)、「同じデータを自分でも作りたい」(C)。支払う理由の証拠は未確認 (成約 0)。年収などテーマ名から購入意図を推定しない (application.json)。
- **月次計画との関係**: 本カードは 10 月 `monthly.md` の「枠・案件を追加しない」を上書きするオーナー判断 (2026-10-19) として起票した。A2 (自動広告) は出典書き換えの再発確認を通らない限り始めない。
- **2026-10-19 オーナー判断 (新規展開は保留)**: アフィリエイトの案件・枠の追加 (B1〜B5・C3) は PV が伸びるまで保留する (今の PV では判定ラインに届く組がほとんど作れず、作業コストに見合わないため)。申請済みの A8 21 件と三井住友カード NL は承認を待つだけにする。A1・A2 は `ADSENSE-PLACEMENT-01` の基準値 (11-13 まで) の後に判断する。先に `PV-100K-LEVERS-01` #1 (`SEO-CTR-CANDIDATES-01`) を進め、再開は 11 月の `/monthly-plan` で W41 比の 28 日 PV の伸びを見て判断する。
- **停止条件**: 出典の文言が広告リンクへ書き換えられる事象が 1 件でも再現したら A2 を即停止。広告・導線を一括で全ページに出さない (面を限定して配置別に測る)。PR 表記・景表法の表示は `affiliate-ads-standards.md` を崩さない。表示 2,000 未満の組を「出ない」と判定しない。
- **完了条件**: 12 本それぞれに「開始日・面・位置・4 週の表示 / クリック / 成約 (または到達率)・続行 / 停止」が記録され、絞った後の構成が `02_収益化戦略.md` §3 と `improvements.md` (効果観測が続くもの) へ引き渡されている。2026-12-31 の `PV-PLAN-REVIEW-2026Q4-01` と同じ回で見直す。

### [AFF-A8-EXPANSION-2026-10] A8 の個人向け高 EPC 案件を提携し、対象ランキングに限って配信する (2026-10-19 オーナー指示)
タグ: [収益化] [種類:改善] [実行:対話] [起票:2026-10-19] [領域:アフィリエイト]

- **経緯**: オーナー指示「提携できるものは提携して、サイトに展開」。A8 の 572 件を既存の台帳と突き合わせて整理し (法人向け・美容医療・融資・投資勧誘・婚活・占い・探偵・FX と doboku-note との共用案件は除外)、2026-10-19 に 21 件を申請 (申請サイト = 統計で見る都道府県、即時承認 0 件。案件 ID は `data/affiliate/a8-catalog.json`。一覧はこのカードの旧版 `git log -p -- .claude/todo/backlog.md`)。提携済みの 13 件は登録して R2 へ公開し、本番で対象ページだけに出ることを確かめた (`5410e2285`・`e3b8d12fe`、run 39218494350・39220151882)。BBIQ (九州のみ) と創建リフォーム (13 都府県のみ) は地域で絞る手段が無いので見送った。
- **次**: 週次の `check-approval` で申請 21 件の承認を拾い、承認されたものから同じ手順 (案件プロファイル: decision レーン・F3/F4・allowedPageTypes=ranking、広告: `targetRankingKeys` を実在 key 2〜8 件に限定 → develop へ push → `publish-affiliate-ads.yml` → 本番で対象ページだけに出ることを確認) で登録する。掲載 URL の事前提出などを求める案件は、三井住友カードと同じく先に提出する。広告は「ページの意図軸 = 広告の軸」かつ対象ランキングのときだけ出るので、軸の合う対象が 0 件にならないよう確かめる。
- **停止条件**: `targetRankingKeys` なしで decision レーンの案件を登録しない。広告主が求める事前手続きを済ませずに配信しない。
- **完了条件**: 承認済みの対象案件が本番の対象ページに出て、ほかのページに出ない。効果の観測は improvements の別 ID (`[kpi: affiliate-yield]`) へ引き渡す。
- **統合 (2026-10-26 オーナー判断): `AFF-SMBC-NL-01`** 三井住友カード（NL）を A8 で提携し、家計・所得のランキングに限って配信する
  - **本文の欠け (2026-11-13 確認)**: この統合のコミットで、元カード 8 行のうち 5 行 (字下げした続きの行と番号付きの手順) が落ちた。着手の前に `git show 47aa651d1^:.claude/todo/backlog.md` で `[AFF-SMBC-NL-01]` の全文を読み、今の実装と突き合わせて残りを決める。
  - **次 (実行順)**: ① (済) ② `check-approval` で承認を確かめる ③ `harvest --id` で広告コードを取り、案件プロファイル (台帳 `affiliate.offer-profiles`、lane=decision・F4・allowedPageTypes=ranking) と広告 (台帳 `affiliate.ads`、`targetRankingKeys` を提出したページだけに限定) を登録 ④ develop へ push して `publish-affiliate-ads.yml` で R2 へ公開し、本番の対象ページだけにバナーが出て、ほかのページに出ないことを確かめる。
  - **停止条件**: 提出していないページに出る設定 (`targetRankingKeys` なし) で登録しない。承認前にバナーを置かない。
  - **完了条件**: 提出したページの本番 HTML に広告が出て、それ以外のページに出ない。効果の観測は improvements の別 ID (`[kpi: affiliate-yield]`) へ引き渡す。

### [NOTE-CIRCULATION-LINK-FIX-01] note 公開記事のリンク切れ 5 件と導線の欠けを直す
タグ: [コンテンツ品質] [種類:不具合] [実行:対話] [起票:2026-10-18] [領域:SNS]

- **事象**: note 回遊の週次監査 (`npm run weekly:audits -- --only note-circulation`) でリンク切れ (`broken_site_link`)・http リンク・リダイレクト・無料部分のマガジン導線の欠け (`missing_magazine_link_in_free_body`)・カード前後の余分な空段落 (47記事・175件、`data/note/card-visibility-latest.json`) が出ている。明細は `data/note/evidence/note-circulation-audit-2026-10-30.json`。
- **置換案 (2026-11-01・オーナー確認待ち。置換先は 11-01 に本番で HTTP 200 を確認)**:
  | 記事 | 切れたリンク → 置換案 | 注意 |
  |---|---|---|
  | `d-engel-coefficient-income` | `/ranking/food-expenditure` → `/ranking/food-expenditure-total` | — |
  | `d-kakei-spending-personality` | `/category/food-beverage` → `/themes/household-food-spending`、`/ranking/{beer,bread,wine}` → `/ranking/{beer,bread,wine}-consumption-expenditure`、`/ranking/frozen-gyoza` → `/ranking/gyoza-frozen-consumption-expenditure`、`/ranking/sushi-eating-out` → `/ranking/sushi-dining-consumption-expenditure` | — |
  | 同上 | `/ranking/ice-cream-sherbet` → `/ranking/icecream-consumption-expenditure` | シャーベットを含むかを品目定義で確かめる |
  | 同上 | `/ranking/chinese-noodles-eating-out` → `/ranking/chinese-noodles-consumption-expenditure`、`/ranking/yakiniku-eating-out` → `/ranking/yakiniku-consumption-expenditure` | 外食かを確かめる (意味が違えばリンクを外す) |
  | `koumuin-shigoto-kouritsuka-ai` | `/ranking/public-employee-count` → `/ranking/prefectural-general-administration-staff` | 一般行政部門の職員。本文の文脈に合うかを確かめる |
  | `b-hotel-rooms-nara` | `/ranking/gross-prefectural-product-accommodation-food-h27` → `/category/tourism` かリンクを外す | オーナー判断 |
  - http・転送されるリンクが `c-engel-food-gap`・`c-kita-kanto-fiscal`・`c-tokyo-vs-osaka-fiscal`・`d-education-income-gap`・`koumuin-shigoto-kouritsuka-ai`・`recovered-n03844512d58a` にある (転送先の URL へ書き換える)。`recovered-nf5b4ced7a736` は台帳 `data/note/articles.json` の行き先を直す。マガジンへのリンクが無料部分に無い 10 件はこの表に含めていない。
- **次**: 置換案をオーナーが確認したら、公開済み記事を PUT パッチで直す (note への外部変更なので承認後)。この Mac から note が HTTP 403 の間は行わない。
- **完了条件**: 週次監査の note-circulation で error 0 件 (Issue #1149 は手で閉じる)。

### [SSDS-YEARFORMAT-SOURCE-01] SSDS の指標生成器が年の区切りを一律「年度」で書くのをやめ、出典の期間から決めて検査で止める
タグ: [コンテンツ品質] [種類:不具合] [実行:対話] [検証:npm run validate:config --workspace=@stats47/data-configs] [起票:2026-10-21] [領域:データ]

- **根本原因 (2026-10-21 確認)**: `.claude/scripts/estat/gen-ssds-configs.mjs` が社会・人口統計体系 (SSDS) の全指標に `yearFormat: "fiscal"` を固定で書いている (79 行目)。このため国勢調査 (10月1日時点)・家計調査 (暦年平均)・犯罪統計 (暦年計) などが「2020年度」と表示されていた。同日に 410 件を出典の期間に合わせて直したが (`METRIC-YEARFORMAT-KAKEI-01`)、生成器を直さない限り新しい指標で再発する。
- **判定の手順 (同日に使った方法・再現用)**: ① e-Stat「統計項目の定義」`https://www.e-stat.go.jp/koumoku/koumoku_teigi/<A〜M>` の HTML を `<hr>` で区切り、各表 (見出し行に「時点又は期間」) の 1 列目の項目符号と 4 列目の期間、節末尾の「調査名又は報告書名」を取る (13 分野で 2,596 項目)。② 「指標計算式」`https://www.e-stat.go.jp/koumoku/sihyo_keisansiki/<A〜M>` の `<tr id>` から指標コード (`#L01201` 等) と計算式 (`L3110` 等の基礎項目、781 指標) を取る。③ 指標の基礎項目がすべて「暦年計・暦年平均・暦年・12月末/31日・10月1日」か、e-Stat の統計表一覧 API (getStatsList) の表題で「平成N年◯◯」と年で呼ばれる調査 (賃金構造基本統計調査・経済センサス・経済構造実態調査・事業所・企業統計調査・国民生活基礎調査・農林業センサス・漁業センサス・社会生活基本調査) なら calendar。年度計・年度間・3月31日などを含めば fiscal。それ以外は判定しない。同日の作業用スクリプトは一時領域にしか無いので、この手順で作り直す。
- **次**: ① 上の判定を `.claude/scripts/estat/` に純関数 + テストとして置き、定義ページの控えを `data/estat/` に保存する (台帳 `config/datasets.mjs` に 1 行足す)。② `gen-ssds-configs.mjs` が判定結果で `yearFormat` を書き、判定できない指標は生成を止めるか人の確認を求める。③ `validate:config` か専用の検査で、SSDS の指標の `yearFormat` が判定と食い違えば error にする (判定できない指標は理由付きの allowlist、縮小専用)。誤りを 1 件注入して発火することを確かめる。
- **完了条件**: 生成器が出典の期間から年の区切りを決め、既存 SSDS 指標の食い違いを検査が止め、注入した誤りで検査が落ちる。
- **統合 (2026-10-26 オーナー判断): `METRIC-YEARFORMAT-KAKEI-01`** 家計調査由来 metric の yearFormat (暦年/年度) と surveyId を揃える
  - **本文の欠け (2026-11-13 確認)**: この統合のコミットで、元カード 11 行のうち 8 行 (字下げした続きの行と番号付きの手順) が落ちた。着手の前に `git show 47aa651d1^:.claude/todo/backlog.md` で `[METRIC-YEARFORMAT-KAKEI-01]` の全文を読み、今の実装と突き合わせて残りを決める。
  - **次**: ①家計調査由来 metric を列挙し (`grep -l 家計調査 data/metrics/*.ts`)、yearFormat を出典で確定して揃える (SSDS の表ラベルは「年度」でも家計調査項目は暦年)。②surveyId を `kakei-chousa` 等へ紐付け `/audit-survey-linkage` を通す。③ranking-prominence / seoTitle の再生成が要るか確認。
  - **停止条件**: yearFormat を一括置換しない (SSDS には年度が正しい項目もある)。出典で確認できない key は `未宣言` のまま残し、指標定義シートに出す。
  - **完了条件**: 家計調査由来 metric の yearFormat が出典と一致し、S1-01 の 9 slug で定義シートの「期間の型」が本文と一致する。

### [YEARFORMAT-REFLECT-01] 年表記を直した 410 指標を R2 と記事・AI 解説・書籍へ反映する
タグ: [コンテンツ品質] [種類:改善] [実行:対話] [起票:2026-10-21] [領域:データ]

- **背景**: 2026-10-21 に 410 指標の `yearFormat` を fiscal → calendar に直した (develop のコミット `06316dc21`・`a21c4586a`・`5e72aa59a`。家計・物価・地価 68、SSDS の他分野 221 と 121)。サイトの年表記 (R2 の `yearName`「2020年度」→「2020年」) が変わるのは、develop→main のマージ後に配信値を作り直したときだけ (`sync-snapshots` は main のコードで動く)。
- **次**: ① main へマージした後、変わった指標の `ranking-values` を作り直す (`gh workflow run sync-snapshots.yml --ref main -f only=ranking-values -f ranking_keys=<最大50件>` を分けて実行するか、月次の data-refresh を待つ)。数件を curl で読み、`yearName` が「年」で終わることを確かめる。② 公開済みのブログ・ランキングの AI 解説 (`app/ranking/<key>/ai-content.json`)・note・Kindle の本文で、これらの指標に「◯年度」と書いた箇所を洗い出し、出典の期間に合わせて直す (ブログは公開記事の差し替えになるのでまとめて 1 回)。
- **完了条件**: 410 指標の R2 の `yearName` が「年」で終わり、本文の「年度」表記の食い違いが 0 件か、直さない理由が記録されている。
- **統合 (2026-10-26 オーナー判断): `BLOG-FISCAL-YEAR-LABEL-REGEN-01`** 年度の指標なのに図の見出しが「YYYY年」になっている公開済み 193 記事を作り直す
  - **本文の欠け (2026-11-13 確認)**: この統合のコミットで、元カード 5 行のうち 3 行 (字下げした続きの行と番号付きの手順) が落ちた。着手の前に `git show 47aa651d1^:.claude/todo/backlog.md` で `[BLOG-FISCAL-YEAR-LABEL-REGEN-01]` の全文を読み、今の実装と突き合わせて残りを決める。
  - **次**: ② 296 件の data JSON と図を作り直し、ブログの公開経路 (contents/blog → CI → R2) で出す。
  - **完了条件**: 年度の指標を使う公開記事で、図の見出しが「YYYY年度」になっている (件数を再集計して 0 件)。

### [CLIENT-GRAPH-AUDIT-01] ブラウザ向けの全部品について、重い依存に届かないことを定期に検査する
タグ: [インフラ・計測] [種類:改善] [実行:対話] [起票:2026-10-21] [領域:サイト]

- **背景**: 2026-10-21 に、入口 (barrel) 経由で全指標 registry・全テーマ定義・GIS の原典処理がブラウザ向けに入っていたのを直した (`DEV-HEAVY-CLIENT-GRAPH-01`)。逆戻りを止める境界テスト (`apps/web/src/__tests__/client-bundle-boundary.test.ts`・`packages/ranking/src/__tests__/client-entry-registry-boundary.test.ts`) は、列挙した入口しか見ない。新しい入口や部品から同じ経路ができても気づけない。同日の調査では、全 `"use client"` ファイル 262 件から値の import をたどる一時スクリプト (TypeScript の `resolveModuleName`、型だけの import と `"use server"` のファイルは辿らない) で 37 件の経路を見つけた。全件で約 1 分かかる。
- **次**: ① この全件検査を `.claude/scripts/` に置き、registry・`all-themes`・GIS 原典処理 (unzipper・shapefile・proj4・topojson-server・topojson-simplify) に届く `"use client"` ファイルを数える。② 週次の `quality-suite-weekly.yml` か preflight (時間次第) に配線し、0 件からの増加で落とす。③ 誤りを 1 件注入して発火を確かめる。
- **完了条件**: 全 `"use client"` ファイルを対象に定期検査が走り、注入した経路で落ちる。

### [TURBOPACK-DEV-WINDOWS-01] 会社の Windows PC で開発サーバーが Turbopack で動くことを確かめる
タグ: [インフラ・計測] [種類:改善] [実行:windows] [起票:2026-10-21] [領域:管理]

- **背景**: 2026-10-21 に `npm run dev:web` の既定を Turbopack にした (`apps/web/scripts/dev-server.ts`)。確かめたのは自宅の Mac だけ。会社 PC は i-FILTER の TLS 傍受があり、R2 を読むために dev-server が Windows の R2 gateway を起動して `R2_PUBLIC_FETCH_URL` を差し替える (`.claude/rules/local-environment.md`)。この経路と Turbopack の組み合わせは未確認。
- **次**: 会社 PC で `npm run dev:web` を起動し、ランキング詳細・テーマ詳細・県ページが 200 で表示され、データ (R2) とチャートが出ることを確かめる。動かなければ `WEB_DEV_BUNDLER=webpack npm run dev:web` で従来どおり起動し、原因をこのカードに書く。
- **完了条件**: Windows でも Turbopack で主要ページが表示されるか、webpack に戻す条件が `local-environment.md` に書かれている。

### [LOCAL-RELEASE-BUILD-R2-TIMEOUT-01] ローカルの本番ビルドが静的生成で R2 の読み込み 10 秒制限に引っかかって落ちることがある
タグ: [インフラ・計測] [種類:不具合] [実行:対話] [起票:2026-10-21] [領域:管理]

- **事象 (2026-10-21・8GB の Mac)**: `NEXT_DIST_DIR=.local/next-release next build` の 1 回目が、1,633 ページの静的生成中に `/tag/再生可能エネルギー` で `blog snapshot read timed out after 10000ms` となり失敗した。同じコードの 2 回目は成功した。ローカルのビルドは `.env.development` の公開 R2 URL を読むので、多数のページが同時に同じ snapshot を読んで制限を超えると考えられる ([仮説]。検証: 静的生成中の同時 fetch 数を数える)。`npm run check:release-local` の結果が不安定になる。CI のビルドは R2 を読まないので起きない。
- **次**: ① 静的生成中に同じ key を何回読んでいるかを数える。② 1 回のビルドの中で同じ snapshot の読み込みをまとめるか、ビルド中だけ制限時間を延ばすかを決める (本番の実行時は 10 秒のまま)。
- **完了条件**: ローカルの本番ビルドを 3 回続けて実行し、R2 のタイムアウトで落ちない。

### [DEV-SERVER-BARREL-01] サーバー側の入口経由の重い依存と、本番のページ別 JS の大きさを減らす
タグ: [インフラ・計測] [種類:改善] [実行:対話] [起票:2026-10-21] [領域:サイト]

- **実測 (2026-10-21)**: ① トップページのサーバー側は、`features/blog/server.ts` (調査分類) と `features/area-profile` の入口を経由して全指標 registry を読む。ほぼ全ページのサーバー側で一度はコンパイルされるので開発時の負担は 1 回だが、入口を細かくすれば減る。② `@stats47/data-configs` は package.json に `sideEffects` を宣言していない。本番ビルドで使わない再 export を落とせない可能性がある。③ 本番ビルドのページ別のブラウザ向け JS (非圧縮・共有分を含む) は、テーマ詳細 1,758KB・Geo 分析 1,405KB・ランキング詳細 1,073KB・トップ 965KB・県ページ 962KB。
- **次**: ③ を `@next/bundle-analyzer` (next.config に配線済み) で開き、大きい依存を上から確かめる。② は `sideEffects: false` を宣言した場合に本番の JS が減るかと、壊れないか (CSS・副作用のあるモジュール) を比べてから決める。① は効果を数えてから着手する。
- **完了条件**: ページ別 JS の大きい順の内訳が記録され、減らせるものを減らしたか、減らさない理由が書かれている。
### [PRODUCT-FUNNEL-DEPLOY-01] ブログ・ダウンロードの商品導線と地図用ダウンロードを本番に出し、4 週のクリックを測る
タグ: [収益化] [種類:改善] [実行:対話] [起票:2026-10-17] [領域:商品]

- **中身**: ① ブログ 10 記事のデータ集の案内 (`apps/web/src/features/products/storefront.ts` の `BLOG_DATA_PRODUCTS`) ② CSV ダウンロード後の「業務の資料」回答者への案内 (`findDataProductForRanking`) ③ ランキングの地図用ダウンロード (`/api/ranking/<key>/download?format=kml|geojson`)。2026-10-17 に本番反映 (PR #1143)、マイマップでの読み込み確認と小島の塗り漏れの修正 (`58ae94b91`・PR #1190) は 10-28 に済み。
- **次**: ① 週次の GA4 取得に足した `file-downloads.csv` (`journey-ga4-reports.mjs`、形式 × 指標 × 回数) を最初の土曜の取得で確かめる (`file-downloads.meta.json` に error が無く `kml` / `geojson` の行が出ること。本物の GA4 では未取得) ② 反映日を境界に、4 週の `nav_click` (`surface=blog_product` / `ranking_product`) と `file_download` の形式別を読み、効果判定は improvements へ別 ID で引き渡す。
- **note 素材集の判定 (先に固定)**: 無料記事 2 本 (`h-howto-excel-filled-map`・`h-howto-csv-mojibake`) の末尾に素材集 (`prefecture-map-chart-assets-pack`・¥4,000) への案内を足した。2026-11-27 に、素材集の売上が 2 件以上なら地図の素材を形式別に増やす検討へ進み、0 件なら案内を外す。閲覧が 4 週で 30 未満なら案内の位置の問題として扱う。売上と閲覧は土曜の note ダッシュボードの記録 (`data/note/dashboard/`) で読み、取得に失敗した週は判定不能とする。
- **停止条件**: Workers の CPU が閾値を超える場合 (KML 生成は未計測。`CF-CPU-SURGE-01` と照合) は地図形式を外す。
- **完了条件**: 本番で 3 つの導線が表示・動作し、4 週の計測の開始日が improvements に記録された。

### [NOTE-KML-FUNNEL-01] note の KML 記事の末尾を、stats47 の地図用ダウンロードへの案内に替える
タグ: [収益化] [種類:改善] [実行:対話] [起票:2026-10-17] [領域:商品]

- **経緯**: KML 記事 (`n03e45e40d3a7`) は通算閲覧 3,226・note 2 位で、読者は検索から来る。末尾から案内していた有料の GIS 分析記事は読者の目的 (地図にデータを載せる) と合っていなかった。
- **済 (2026-10-18)**: 本文に stats47 の KML ダウンロードの節を足し、有料カード 3 枚と GIS 入門のカードを外して H-02 のカードにした (PUT `free_body` の差し替えのみ、添付・画像は再アップロードなし)。R2 の原稿 (draft.md) も同じ差分で保存した。
- **次**: ① 反映日 (2026-10-18) から 4 週の note → stats47 の送客 (`utm_source=note`) を測る ② 本文で配っている `総人口_2023.kml` の出典表記 (境界の国土数値情報) を確かめる ③ H-01 が公開されたら次に読む記事を H-01 にするか決める。
- **再発の注意**: `update-published-navigation.mjs` を `--all-free` やこの記事の `--slug` で回すと、同じ無料マガジン (koumuin-gis) の有料記事カードを `chooseDatasetArticles` が付け直す。この記事を除外する仕組みは無いので、回す前に対象から外す。記事台帳の `nextBestArticle` もあわせて設定する。
- **停止条件・禁止**: note の編集はオーナー承認と人手ログインの後。有料記事への導線は外すだけで、記事自体は消さない。
- **完了条件**: 末尾の案内が替わり、4 週の note → stats47 の送客 (`utm_source=note`) を記録した。

### [NOTE-HOWTO-SERIES-01] 操作手順の連載 (H シリーズ) の 1・2 本目を書いて公開する
タグ: [SNS・マーケ] [種類:制作] [実行:対話] [起票:2026-10-17] [領域:商品]

- **企画**: `docs/30_note記事企画/backlog/H-howto-maps-data.md` (8 本)。
- **済み (〜2026-10-28)**: H-02 (CSV 文字化け) は公開済み (https://note.com/stats47/n/nc884a0a01b71)。H-01 (`h-howto-mymaps-kml`)・#9 (`h-howto-mymaps-share`)・#11 (`h-howto-excel-filled-map`) は実機確認のうえ本文を差し替え済み。#9 は公開後に案内先を H-01 へ替える。
- **#3 QGIS (`h-howto-qgis-choropleth`) 原稿完成・未公開 (台帳 status draft)**: 画面 10 枚と原稿を R2 に保存済み。**残り**: ① カバーを Codex imagegen で作る (`.claude/rules/note-image-assets.md` の制作 ID 経路) ② note-critic ③ 新規公開 (`publish-new-note.sh` は Mac の Chrome Profile 5 前提)。公開後は H シリーズの基準 (28 日で閲覧 190 以上) で有料の続き (港湾・人口増減・財政の地図) を作るか決める。
- **残り**: 公開した記事の 28 日の計測。note-critic の再レビューで PASS してから、公開は 1 本ずつオーナーが判断する。
- **完了条件**: 2 本が公開され、28 日の閲覧・note 内の表示・stats47 への送客を記録した。0 件なら 0 件と書く。

### [CI-SMOKE-BOUNDING-BOX-01] 本番の画面幅テストで初回に寸法検査が失敗する原因を調べる
タグ: [インフラ・計測] [種類:不具合] [実行:sweep] [起票:2026-10-17] [期日:2026-10-24] [領域:サイト]

- **優先度 / owner**: P2、devops-runner・site-ux-manager。GSCの公開障害対応を優先した後に扱う。
- **実測**: post-deploy smoke run38977124768は全体成功だが、`responsive-layout.spec.ts:70`のranking右レール契約が375/768/1024pxで初回`main.boundingBox() === null`となり、各retry #1で成功した（45 passed / 3 flaky）。取得不能の原因と実際の表示障害の有無は未確定。証拠: `data/gsc/ui-audits/2026-10-17-remediation.json#productionRelease`。
- **追加実測 (2026-11-13)**: run43375404084は成功（77 passed / 2 flaky / 4 skipped）だが、`selection-controls.spec.ts:24`の`/themes/freight-logistics`・`/themes/education-culture`で狭幅変更直後のボタン高が32px（期待44px以上）となり、retryで成功した。表示側と検査側の原因は未確定。PR #1261の広告通信隔離後も発生し、商品LPとテーマの往復は全幅で初回成功。リサイズ後のDOM・CSS・メディアクエリの変化も同じ切り分けに含め、寸法条件を緩めずretryなしで検証する。
- **次 / 順序**: 同じランキング・viewportの初回遷移でDOMとmainの可視性・置換タイミングを記録し、表示側と検査側の原因を切り分ける。確定した原因に対する最小修正を既存テストへ反映する。
- **停止条件**: boundingBoxのnullを無視したり、assertion・対象幅を削除したり、固定sleepやretry増量で隠さない。追加デプロイは別途指示で行う。
- **完了条件**: 原因に対応する再現条件を残し、対象3viewportの既存テストがretryなしの反復実行で通る。修正による赤→緑と実行ログを記録する。

### [GSC-DATASET-NESTED-SCHEMA-01] DatasetのGSC再検証結果を確認し、出典メタデータを是正する
タグ: [インフラ・計測] [種類:不具合] [実行:対話] [起票:2026-10-16] [期日:2026-10-23] [進行中] [領域:サイト]

- **GSC案03 / P1（最優先・順序2）**: 入れ子Datasetの説明不足・欠落の修正をGoogle側で検証する。
- **GSC案04 / P2（次に着手）**: 出典SSOTからcreator・license・対象年・地域・単位を正しく引き継ぐ。案03と同じ生成処理で扱う。
- **owner / 順序**: ranking-ui-manager・市区町村ページ担当。P1のGoogle再検証結果確認を優先し、P2の出典メタデータ確認へ進む。監査: `data/gsc/ui-audits/2026-10-16.json`、本番反映・GSC操作の証拠: `data/gsc/ui-audits/2026-10-17-remediation.json`。
- **修正前の実測**: GSC Dataset（最終更新 10-15）は description 長さ不正 775、欠落 83、計 858 アイテム無効。license / creator 欠落は各 1,092。原因は入れ子 (`isBasedOn`) の Dataset の説明が短いか無いこと。
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
- **2026-11-11 実測 (GSC 最終更新 11-06・本番 HTTP・サイトマップ 11 本)**: 「robots.txt によりブロックされましたが、インデックスに登録しました」は 23 件 (検証は「失敗しました」表示)。一方、許可したダウンロード API がクロールされ、全既知の「クロール済み - 未登録」2,413 件は W44 記録 1,000 件中 959 件が `/api/ranking/*/download?format=…`、32 件が `storage.stats47.jp` の JSON。kml は 1 ファイル 2.5MB。**次**: 23 件が 0 になったらダウンロードの許可を Disallow に戻す案を `GSC-CRAWL-WASTE-01` で判断する (Dataset 構造化データの `contentUrl` が同じ URL を指すので、戻す前に Dataset の検証への影響を確かめる)。

### [GSC-SOURCE-FRESHNESS-01] GSCのUI監査と既存計測の観測日・取得範囲を揃える
タグ: [インフラ・計測] [種類:改善] [実行:対話] [起票:2026-10-16] [期日:2026-10-23] [領域:サイト]

- **GSC案38 / P2（次に着手・比較前の前提）**: UI監査10-12と既存coverage入力10-04を区別し、HTTP・sitemapの新しい証拠を検査付きの取得経路へ接続する。
- **owner / 入力**: gsc-analyst。`data/gsc/ui-audits/2026-10-16.json`、coverage-remediation、search-growthのstatus。UI例示の上限と722 URLだけのHTTP検査を保持する。
- **到達 (2026-10-17)**: 週次CIのHTML index signal検査が12分上限で止まる問題 (run `38820105627`) は、status/HTMLの単一GET化とbody.cancel待ちの修正 (redテストで再現) で全量2,751 URL・queue保存まで完了した。source_observed_atとgenerated_atを分離し、pendingは母集団の違う旧件数と単純比較しない。過去snapshotのqueue派生CSVを復元対象から除く保護も追加済み。
- **次 / 順序**: ①sourceごとに観測日・取得日・母集団・標本数・欠測を照合する ②既存CSV/manifest gateで最新coverageを取り込むか、部分UI監査を補助証拠として保持するかを決める ③HTTP/sitemap collectorの既存出力との接続を検証し、既存キューの状態を保持して再構築する。集計期間はsearch-growthのObservationと元summaryを照合し、週フォルダ名から推定しない。④修正版のmain週次CIで、新しいqueueとsourceの取得範囲を照合する。
- **停止条件**: UI例示を全件データと扱わない。欠測を0で埋めない。認証情報を監査JSONへ保存しない。古い入力で新しい状態を巻き戻さない。
- **完了条件**: 各sourceの鮮度・取得範囲・成功/部分成功/欠測が追跡でき、キュー更新の前後差分とgate結果が残る。source未取得を成功扱いしない。
- **2026-11-11 実測 (GSC 最終更新 11-06・本番 HTTP・サイトマップ 11 本)**: 週次の記録 (`data/gsc/coverage-drilldown/`) は「すべての既知のページ」だけで、404 の 12,116 件に埋もれる。「すべての送信済みページ」は登録 6,729・未登録 1,977 (検出-未登録 1,134 / noindex 578 / クロール済-未登録 127 / robots 58 / 404 48 / リダイレクト 17 / リダイレクトエラー 10 / 5xx 5)、「未送信」は登録 764。GSC の URL は `pages=ALL_SUBMITTED_URLS` / `ALL_NON_SUBMITTED_URLS`。**次**: 週次の取得に送信済みビューの件数と理由別ドリルダウンを足し、追う指標を送信済みの登録率 (11-06 時点 6,729 / 8,706) にする。
- **送信済みビューの記録 (2026-11-11 実装・画面操作は未検証)**: `export-coverage-playwright.mjs` が最後に `pages=ALL_SUBMITTED_URLS` の概要を export し (補助扱い。失敗しても必須の export の成否は変えない)、`ingest-gsc-export.py` が週フォルダの `submitted-totals.json` と推移 `data/gsc/coverage-submitted-history.csv` (台帳 `gsc.coverage-submitted`) に書く。取れなかった週は `status=missing`・空欄で、0 で埋めない。単体テストは Python 10 件・node 56 件が通過。GSC の画面を操作する部分 (ビューの切り替え・export の zip の形) は実行していない。**次**: 土曜 11-14 の週次取得で `submitted-totals.json` ができ、11-06 の画面の値 (登録 6,729・未登録 1,977) と桁が合うかを確かめる。合わなければ zip の中身を読んで ingest を直す。`~/Downloads` の最後の zip を採るだけなので、古い週の送信済み zip が残っていると別の週の値を記録しうる (週との照合が未実装)。
- **11-14 の取得の後にやること (2026-11-11 に仕組みを実装)**: 送信済みビューの推移は Mac の取得でコミットされる (`scripts/scheduled/measurement-collect-local.sh`)。運用サイクルの監査に鮮度の検査 `submitted-view-freshness` (閾値 `submittedViewMaxAgeDays: 8`) を足し、KPI ツリーにガードレール `index-coverage-rate` を足した (記録が無い間は未計測)。最初の行が develop に入ったら: ① `config/datasets.mjs` の `gsc.coverage-submitted` から `planned: true` を外す ② `.claude/config/review-wiring.json` の週次・月次の入力に `read` を足す (先に足すと `wiring-broken`) ③ 概要の export の zip に検証の状態 (「確認」列) があるかを実物で確かめ、あれば `ingest-gsc-export.py` に足す (fixture が無く 11-11 は実装を見送った) ④ KPI の値が 6,729 / 8,706 と同じ桁で出るかを `data/measurement-cycle/LATEST.md` で確かめる。効果観測を `improvements.md` へ渡すのは active の枠 (11-11 時点 5 / 5) が空いてから。
- **効果観測を `improvements.md` へ足す (枠待ち・2026-11-11)**: active が 5 / 5 で、空けられる行が無かった (`NOTE-FISCAL-PEER-SALES-01` は期日 11-09 を過ぎているが、判定に要る 11-09 以降の note の取得がまだ無い)。詳細は `data/improvement/gsc-improvement/improvement-log.md` の 2 節に書いた。枠が空いたら `improvement-triage` で次の 2 行を足す: ① テーマの POST の廃止 — `[kpi: operating-cost]`・`[target: -262 requests]`・期日 2026-11-18 (基準は 11-10〜11-11 の 24 時間で県×テーマとテーマの POST 262 件。観測は `data/cloudflare/snapshots/<日付>.json` の `googlebot`) ② サイトマップ内の未登録を減らす — `[kpi: index-coverage-rate]`・target なし (登録数の増え方を計算できる過去事例が無い)・期日 2026-12-09 (基準は 登録済み 6,729・未登録 1,977)。ID は backlog のカードと重ねず、`GSC-THEME-POST-EFFECT-01`・`GSC-SUBMITTED-INDEX-EFFECT-01` にする。枠を空ける最短は、11-14 の取得で note の記録が更新された後に `NOTE-FISCAL-PEER-SALES-01` を判定して閉じること。

### [GSC-INTERNAL-DISCOVERY-01] 未登録候補の孤立ページとHTMLリンクの到達経路を是正する
タグ: [コンテンツ品質] [種類:改善] [実行:対話] [起票:2026-10-16] [期日:2026-10-30] [領域:サイト]

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

### [GSC-SITEMAP-LASTMOD-01] サイトマップ掲載条件と実更新日時の整合を検査する
タグ: [インフラ・計測] [種類:改善] [実行:対話] [起票:2026-10-16] [期日:2026-10-30] [領域:サイト]

- **GSC案17 / P2（次に着手）**: 本文・データの実更新とlastmodの対応をテンプレ別に検証し、根拠のある更新日時を反映する。
- **GSC案18 / P2（次に着手）**: sitemap掲載URLとHTTP・noindex・canonicalの矛盾を既存検査で拾う。
- **owner / 入力**: ranking-publisher・site-ux-manager。`apps/web/src/app/sitemap.ts`、sitemap shard、公開URL方針、既存check-sitemap-index / route smoke / page-quality。Geo固有の公開gateは既存route smoke（全7分析）と定義SHA回帰テストを参照する。
- **次 / 順序**: ①既存検査が覆う項目を確認する ②変更されたURLと各テンプレ代表で不整合・lastmod根拠を検査し、不足箇所だけ既存gateへ足す ③週次全URL検査へ必要な項目を接続する。
- **停止条件**: 全URLのlastmodを毎日更新しない。更新日が不明なとき捏造しない。priority/changefreqの変更をGoogle向け改善策にしない。公開反映は別途指示で行う。
- **完了条件**: 意図しない404/転送/noindex/別canonical掲載を検出でき、lastmodが実更新に一致するか未設定理由を説明できる。既存検査との二重運用を残さない。
- **2026-11-11 実測 (GSC 最終更新 11-06・本番 HTTP・サイトマップ 11 本)**: サイトマップは 11 本・9,399 URL。`lastmod` があるのは shard 3 (ランキング 2,596 件が全件 2026-05)・shard 4 (ブログ)・shard 7 (タグ) だけで、県×テーマ 2,491・市区町村 1,741・市区町村ランキング 1,224 など 8 本には無い。`/geo/history/*` は 200・index・自己 canonical で 100 件超が登録済みだがサイトマップに無い (未送信ビューの先頭 500 件中 108 件)。送信済みビューには 404 48・リダイレクト 17・リダイレクトエラー 10・5xx 5 があり、個別 URL は未確認。**次**: ① ランキングの `lastmod` を実更新日にし、無い 8 本は出せる根拠の有無を決める ② `/geo/history/*` を掲載する ③ 送信済みビューの 4 理由 80 件の URL を読み、掲載から外すか直すかを決める。
- **送信済みビューの 4 理由 80 件の中身 (2026-11-11 実測・GSC 最終更新 11-06)**: 全 URL を読み、Googlebot UA で本番を取得した。① 404 の 48 件 (タグ 26・ブログ 12・ランキング 5・県×観光 3・調査 1・ブログのクイズ 1)、5xx の 5 件 (`/japan/household-health-spending` 11-02、県×テーマ 4 件 9-18)、リダイレクトエラーの 10 件 (全て `/areas/<県>/tourism`・7〜8 月) は、63 件すべて現在 200・`index, follow`・サイトマップ掲載あり。サイト側の修正対象は無く、Google の再クロール待ち。② リダイレクトの 17 件は市区町村テーマの旧 slug 16 件 (`/municipalities/themes/employees` → `local-economy` など) と `/survey/household-survey` → `/survey/kakei-chousa` で、301 は意図どおり。現在のサイトマップには載っていない (クロール日 11-03〜11-08)。処置不要。③ ブログ 12 件の 404 はクロール日が 10-29、その記事がサイトマップの一覧 (`sitemap-blog-entries.ts`) に入ったのも 10-29 (`cbf8a7309` ほか)。クイズ記事は一覧入り・クロールとも 11-02。[仮説] 新しい記事が、サイトマップに載った直後のクロールで 404 を返している (ISR の 404 キャッシュ。memory `feedback_bulk_blog_publish_isr_404`)。当時の応答は残っておらず未確認。検証: 次にブログを公開した直後、新しい記事 URL を Googlebot UA で取得して 200 か 404 かを記録する。404 なら公開手順にキャッシュの解消を足す。①の 63 件は 11-11 に GSC の送信済みビューで 404 (48)・5xx (5)・リダイレクトエラー (10) の「修正を検証」を開始した (3 件とも表示は「検証: 開始・開始日 2026/11/11」)。**次**: 11-25 以降に検証結果の通知と送信済みビューの 3 件数を読む (市区町村ページの 2 件の検証は `GSC-MESSAGE-TRIAGE-01`)。
- **`/geo/history/*` の掲載 (2026-11-11 実装・未デプロイ)**: `infraHistoryIndexablePaths()` (`features/infra-history/lib/infra-history-scope.ts`) が、ページ側の robots と同じ条件 (公開できるネットワークだけ) で 一覧・全国・地方・47 都道府県のパスを返し、サイトマップの static に載せる (166 件 = 一覧 1 + 3 ネットワーク × 55)。検査は `infra-history-indexable-paths.test.ts` と `sitemap-index-parity.test.ts`。**ランキングの `lastmod` は未着手**: 現在は `updatedAt` が無いか古いと一律 `SITEMAP_BASELINE` (2026-05-25) を出していて、2,596 件が同じ日付になる。実更新日の出所 (R2 の値の更新日を `sync-ranking-keys` の生成物へ焼き込む案) は CI の生成工程を変えるので、今回のデプロイには入れていない。**次**: 出所を決めるまでの間、根拠の無い一律の日付を出し続けるか、`lastmod` を出さないかを決める。
- **ランキングの `lastmod` の出所の調査 (2026-11-11・読むだけ)**: ① 全件が 2026-05-25 になる原因は、値が古いのではなく無いこと。サイトマップはビルド時に焼かれ、ビルド時の `readActiveKeysForSitemapFromR2` (`packages/ranking/src/repositories/ranking-item/read-ranking-items-snapshot.ts:398-433`) は `KNOWN_RANKING_KEYS` を `updatedAt: null` で返すので、`sitemap.ts` が `SITEMAP_BASELINE` に落とす。本番 `/sitemap/3.xml` は 2,596 件すべて `2026-05-25T00:00:00.000Z`。② 実更新日の候補: R2 `app/ranking-items/all.json` の `item.updatedAt` は 2,641 件が 11-06 (1,809)・11-07 (832) だけで再生成日 (不適)。`app/ranking/<key>/item.json` の Last-Modified は 3 キーとも同一時刻 (不適)。`app/stats/<key>/values.json` の Last-Modified は 43 キーの標本で 39 件が 11-05、残りは 8-27・9-10 (2 件)・10-21 と散らばる。[仮説] 差分 push で中身が変わったキーだけ日付が動くなら実更新日に近い。`sync-snapshots.yml` のコメント「CI では manifest が毎回空でフル push」と食い違うので未確定。検証: `packages/r2-storage/src/scripts/diff-push-r2.ts` の skip 条件を読み、sync-snapshots の直近 run のログで values.json の送信件数を確かめる。期日 2026-11-25。送信が変更分だけなら採用、全件なら不採用。③ 届ける経路はブログと同じ git の生成物 (`sitemap-ranking-keys.ts` を key → 日付 に変える)。生成は `sync-snapshots.yml` の `sync-ranking-keys` job (develop を checkout)。④ 壊れうるもの: `SITEMAP_RANKING_KEYS` を Set として使う `url-policy.ts`・`ranking-key-consistency.test.ts`・`legacy-ksj-retirement.test.ts`、reader を mock する sitemap のテスト 2 本、`sync-snapshots.yml` の KEY_FILES の差分判定 (日付を載せると毎回差分が出る)。**別件 (未確認)**: 実行時に R2 が取れて 0 件のとき reader が空を返し、ランキングのサイトマップが空になる経路がある可能性 (`sitemap.ts` 478-480 行のコメントと実装の食い違い)。再現を確かめてから別カードにする。
- **本番反映と確認 (2026-11-11)**: PR #1249 のデプロイ後、本番 `/sitemap/0.xml` は 273 URL で、`/geo/history` が 166 件載っている (一覧 1 + 高速道路・鉄道・空港が各 55)。

### [GSC-CANONICAL-REDIRECT-01] 正規URLを示す内部リンク・サイトマップ・転送先を揃える
タグ: [インフラ・計測] [種類:改善] [実行:対話] [起票:2026-10-16] [期日:2026-10-30] [領域:サイト]

- **GSC案19 / P2（次に着手）**: canonical・内部リンク・sitemap・転送先の矛盾を対象URL単位で調べ、正規URLへ揃える。
- **GSC案20 / P3（条件確認後）**: 301連鎖が残る箇所は移転の意味を保って最終URLへ直接転送し、内部リンクも更新する。
- **owner / 入力**: ranking-ui-manager・site-ux-manager。10-16監査のcanonical関連例示とHTTP転送履歴、既存UrlPolicy / middleware。Google選択canonicalが異なる8例は現時点で301→200であり、現行不具合とは断定しない。
- **次 / 順序**: ①現行index対象URLから優先調査 ②実際に矛盾/連鎖のある写像だけ是正 ③通常UA・Googlebot UAとURL Inspectionで着地を確認する。ブログ統合先の判断はBLOG-DUPLICATE-AUDIT-01が所有する。
- **停止条件**: 内容の違うページを一律canonical化しない。全旧URLをトップへ転送しない。過去のGSC分類だけで現行転送を変更しない。公開は別途指示で行う。
- **完了条件**: 対象ごとの正規URL・処置・根拠があり、採用箇所の信号が一致する。案20は連鎖解消または維持理由を記録する。
- **2026-11-01 実測・局所修正（未デプロイ）**: ブログ一覧の2・10・24・25ページの本番HTMLは全て canonical `/blog`。未完了ブログ32 URLはページ分割の一覧（1〜32ページ）から全件HTMLリンクで辿れたため、親一覧のcanonical矛盾を修正。1ページ目は`/blog`、2ページ目以降は各`?page=n`をcanonical/OG URLに使う。公式根拠: https://developers.google.com/search/docs/specialty/ecommerce/pagination-and-incremental-page-loading 。**次**: デプロイ後に2・10・32ページのcanonicalと次ページの`<a href>`を本番で確認し、32 URLの再クロール・登録をURL Inspectionで観測する。Google側の登録改善は未判定。

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
- **2026-11-11 実測 (GSC 最終更新 11-06・本番 HTTP・サイトマップ 11 本)**: 11-09 の通知「サイトマップ内のページが登録されない新しい要因」は robots.txt ブロック (58) とリダイレクト (17)。送信済みビューの noindex 578 件は全件が市区町村ページで、クロール日は 8 月〜10-21 (データブック公開 `436f46b43` より前)。robots ブロックは見えた 10 件が市区町村ページでクロール日は 5 月 (解除 5-23 より前)。サイトマップの市区町村 1,741 件から 70 件を Googlebot UA で取得し全件 200・`index, follow`。両方とも 11-11 に GSC で「修正を検証」を開始した (表示: 検証 開始・開始日 2026/11/11)。**次**: 11-25 以降に検証結果の通知と送信済みビューの 2 件数を読む。合格しなければ残った URL の robots メタと HTTP を読み直す。

### [ADSENSE-FORMAT-BY-PAGE-01] 広告の形式 (記事内・インフィード・表示) をページの作りに合わせて見直し、広告の側から UI を直す
タグ: [収益化] [種類:改善] [実行:対話] [起票:2026-11-13]

- **起点 (2026-11-13 オーナー)**: 「UI を改善したらインフィード広告・記事内広告・Multiplex も活用できる。広告の側から UI を直す観点もある」。市区町村のページで先に試し (章立て + 記事内広告 + 関連記事のインフィード。`ADSENSE-FORMAT-EXPERIMENT-01` の 19 個目の変更)、結果を見てサイト全体へ広げる。
- **材料 (2026-W44・`data/adsense/history-units.csv`)**: 1,000 表示あたり、記事内広告 ¥29〜38 (ハブ・一覧 ¥38、ブログ ¥36、ランキングの解説の後 ¥29)、Multiplex ¥13〜19 (埋まる割合 17〜22%・視認率 29〜38%)、右レールの表示広告 ¥6〜14。11-12 に本文の段を幅いっぱいの表示広告 (レスポンシブ) で作り直したユニットと、都道府県のページのインフィード (`stats47-area-infeed`) はまだ実績が無い。
- **次 (実行順)**: ① 11-12〜13 に作り替えた段のユニットの 2 週の実績 (`history-units.csv`) を、同じ位置の記事内広告と比べる。② 一覧の形のページ (関連記事・検索結果・ブログ一覧・タグ) で、カードの見た目をそろえてインフィード広告を入れる案を、ページごとに閲覧数と一緒に出す (検索結果のカードには画像が無い)。③ 長い表が続くページ (都道府県・市区町村のデータブック・調査) は、章立てと章の頭の 1 文で記事内広告の置き場を作る。④ Multiplex は回遊 (関連記事) と取り合うので、使うなら関連記事の後のページの最後に限り、回遊の内訳 (`internal-transitions.csv`) と一緒に判定する。
- **停止条件・禁止**: スマホの広告の高さは本文の 30% まで (広告の枠の台帳の共通のルール)。広告のためだけに中身の薄い文を足さない (章の 1 文は値から導いた中身のある文にする)。1 ページで同じユニットを重ねない。最初の画面に置かない。
- **完了条件**: ページの種類ごとの形式 (記事内・インフィード・表示・置かない) と、そのための UI の変更をオーナーが決め、実装のカードに分けている。

### [ADSENSE-FORMAT-EXPERIMENT-01] 広告の形式を枠ごとに試す (固定 300×250 と、大きさに上限を付けたレスポンシブ・記事内・関連コンテンツ型)
タグ: [収益化] [種類:改善] [実行:対話] [起票:2026-11-11]

AdSense の最適化案「レスポンシブ広告で収益を拡大」(固定サイズより平均 45% 増、2019-11-04 の週の Google の調査) を、サイトの実績で検討した (2026-11-11)。一律に採る根拠も、全枠を固定のままにする根拠も無く、枠ごとに試すのが妥当という結論。`ADSENSE-PLACEMENT-01` の 4 週のベースライン (W45 分は 11-14 の取得) の判定後に始める。

- **前後の実測 (前 = W44・10-25〜10-31 の `data/adsense/history-units.csv`、後 = 11-04〜11-10 の AdSense のレポート画面・11-11 取得)**: 10-31 に表示広告を固定 300×250、記事内広告の箱を幅 300px、関連コンテンツ型を表示広告へ替えた。手動ユニットの合計は 223 円 → 247 円、AdSense のページビューは 11,716 → 12,237 で、1,000 PV あたり 19.0 円 → 20.2 円。表示回数は 11,648 → 15,712、表示 1,000 回あたりは 19 円 → 16 円。口座全体は 313 円 → 611 円だが、増えた分の大半は手動ユニット以外 (611 − 247 = 364 円。W44 は自動広告のアンカーが 87 円)。
- **枠別**: 記事内 `stats47-blog-inarticle` 61 円 → 38 円 (表示 1,000 回あたり 36 円 → 20 円)。フッターは関連コンテンツ型 2 枠の計 59 円 → 表示広告 2 枠の計 27 円。本文は `stats47-hub-incontent` 20 円 → 68 円・`stats47-ranking-incontent-mobile` 42 円 → 69 円 (表示回数が 7 倍・2.4 倍。10-30 の配置の変更と重なる)。右レールは `stats47-ranking-rail-top` 17 円 → 23 円 (視認率 48% → 86%)。`stats47-hub-rail` は 484 → 593 回表示されており、「幅 262px で 300×250 が入らず出ない」の仮説は当たらない。
- **本番の実測 (11-11・Playwright の headless Chromium で本番 4 ページ × 幅 390 と 1440。広告は全て filled)**:
  - PC (1440): 記事内広告 (fluid) のユニットは、ランキング・ブログ・テーマ・県の 4 種別の 5 枠すべてで 300×600 に描画された (slot 2894688778・6809797335・9995373035)。箱は min-height だけなので 300×600 に伸び、同じ段の PR (300×250) と高さが揃わない。固定の表示広告は全て 300×250。この測定の CLS は 4 ページとも 0。
  - スマホ (390): 記事内広告も固定の表示広告も 300×250。ブログは箱の幅が 276px (幅 375 では 261px) で、広告が箱の右へ 12px (同 39px) はみ出す。画面の外には出ず、横スクロールも 0。ランキング・テーマ・県は箱が 300px ではみ出しなし。
  - スマホのランキングだけ CLS 0.224 (ずれた要素は H1 と上部の grid)。原因は未確認・1 回の測定。
  - スマホの本文の AdSense の数: ランキング 1 (ページの長さ 6,849px)、ブログ 3 (29,742px)、テーマ 2 (8,910px)、県 1 (22,444px)。
  - slot を持たない `ins.adsbygoogle` がスマホで 4〜6 個・PC で 2 個あった。W44 の記録でも自動広告 (アンカー) に 87 円の収益があり、11-04〜11-10 は手動ユニット以外が 364 円。`constants.ts` と収益化戦略 3.1 の「自動広告はオフ」と食い違う。
  - 訂正: 「PC の本文は幅 738px に 300×250 が 1 つ」は不正確だった。本文は広告の段で、608px 以上は 2 枠・916px 以上は 3 枠が並び、AdSense と PR (300×250) が交互に入る (`AdRow.tsx`・台帳の pages)。固定 300×250 は PR の主力の大きさ (有効 137 件) と横に揃えるための設計。
- **公式の仕様 (support.google.com/adsense・2026-11-11 取得)**: `data-ad-format` は `rectangle`・`horizontal`・`vertical` とその組み合わせに絞れる (answer/9183460)。CSS のメディアクエリで ins の幅と高さを決める書き方が公式に認められている (answer/9183363)。固定サイズを勧めるのは固定でないとレイアウトに合わない場合 (answer/9185043)。45% の出典と条件は公式ヘルプに記載なし。
- **位置ごとの方針案 (2026-11-11・オーナーの指摘「固定の位置とレスポンシブの位置を見極め、増やすことも含め、PR のバナーとの釣り合いも」を受けた設計。未決定)**:
  - 広告の段 (PC で PR と横に並ぶ枠): 固定 300×250。PR と高さを揃える。いま fluid で 300×600 になっている枠は、固定の表示広告のユニットへ替える (AdSense で表示広告のユニットを新しく作る必要がある = オーナーの作業か承認)。
  - 右レール (PC・幅 316px): 固定。上段は 300×250 のまま、下段か sticky の 1 枠で 300×600 を試す (縦長が収まる唯一の位置。PR の縦長は在庫 2 件で受け皿なし)。
  - スマホの本文 (段の先頭 1 枠だけ・横に並ぶ PR が無い): 幅を列に合わせ、形を絞った上限つきレスポンシブ。箱より広い 300px 固定のはみ出しも同時に解消する。PR の 320×100 (台帳で undecided) を使うかも併せて決める。
  - ブログの本文: 段とは別に、列の幅の記事内広告を 1 枠 (横に PR を置かない)。固定化で 61 円 → 38 円に落ちた枠の回復を狙う。高さの確保は必須。
  - ページの末尾: 関連コンテンツ型を 1 枠戻す (下にコンテンツが無いので、伸びてもずれない。59 円 → 27 円に落ちた位置)。
  - 増やす位置: スマホで本文が長いのに AdSense が少ないページ (県 22,444px に 1、ブログ 29,742px に 3)。節の区切りへ段を足す。台帳の上限 (本文の AdSense 4 枠・ファーストビュー不可・隣接不可) の見直しはオーナー判断。収益化戦略 §8「未計測のまま枠を拡大しない」に従い、1 ページ種別ずつ。
  - PR との釣り合い: 段の中は AdSense も PR も 300×250 で交互。PR を入れる基準 (同じ枠の AdSense の 1,000 表示あたり。戦略 3.2 は本文中 43 円) を、固定化後の実測 (本文 18〜20 円) で引き直す。
- **訂正 (2026-11-11)**: 「スマホは広告が少ない」は手動枠だけを数えた結果だった。スマホには自動広告が本文に 3〜4 個・上部のアンカー・全画面広告が出ている (`ADSENSE-OVERLAY-AB-01` の 11-11 の実測)。枠を増やす判断と、固定化の前後の比較は、自動広告の設定を決めてからやり直す。
- **次 (実行順)**: ① (済・11-11) 自動広告は、オーナーが今の設定を続けると決めた。スマホのランキングの CLS 0.224 の原因は `ADSENSE-OVERLAY-AB-01` で見る。② ブログのスマホの箱と広告の 12〜39px のずれを直す (大きさは変えない)。③ 11-14 の基準値の判定後、上の方針案をオーナーが決める。④ 決めた位置を 1 つずつ 2 週試す。判定はページ種別の 1,000 PV あたり収益と CLS。⑤ 台帳とコードの食い違いを直す (`adsense-body` の devices が desktop だけなのに段のスマホ枠に使う・右レールの fallback の記述が standards と台帳で逆・`FooterAdSlot.tsx` などの古いコメント・320×100 が standards では canonical で台帳では undecided)。
- **2026-11-12 オーナー決定 (1 つ目の枠)**: ランキングの解説の後の段は、300×250 を横に並べず、AdSense 1 つ (`stats47-ranking-incontent-mobile`・記事内広告) を本文の幅いっぱい (上限 580px) に出し、PR を出さない。commit 5469a28b8 (develop・未 push・未デプロイ)。台帳の枠 `adsense-body-responsive` (予約の高さ 280px は仮の値)。
- **2026-11-12 オーナー決定 (方針・2 つ目の枠)**: アフィリエイトは戦略を練り直すまで止める。枠は消さず、ページ・枠ごとに 1 つずつ AdSense のレスポンシブへ替える。2 つ目はランキングの出典の後の段 (「PR・AdSense・PR」→ `stats47-ranking-footer-rect` 1 つを幅いっぱい・`data-ad-format="rectangle"`・幅の上限のある枠は `data-full-width-responsive="false"`)。管理画面の設定が固定のユニットでも、コードの書き換えでレスポンシブにできる (Google の Ad formats FAQ answer/10734935・11-12 確認)。ランキングの 2 段は同じリリースで出し、ランキングの 1,000 PV あたり収益と CLS をページ種別で前後比較する (ユニット別も見る)。
  - **3 つ目の枠 (11-12)**: ランキングのページの最後の PR の列 → 専用ユニット `stats47-ranking-end` (slot 3452480564。11-12 にオーナーの依頼でエージェントが AdSense の管理画面で作成・ディスプレイ・レスポンシブ) を幅いっぱい。これでランキングの本文の AdSense は 3 枠 (上限 4)。ランキングの本文から PR は無くなった。本文から外しただけでは本文で使っていたバナーが右レールへ流れ込み PR が増えたので (撮影で確認)、`nativeBanners` を右レールの除外に渡して元の状態に保った (4 つ目で右レールの PR ごと外した)。
  - **4 つ目の枠 (11-12)**: ランキングの右レールの PR の枠 (労働系の固定のバナー + 文脈のバナー) → AdSense (使っていなかった `stats47-ranking-rail-bottom` slot 2308454706 を `RANKING_RAIL_MIDDLE` として流用。300×250 の固定のコード)。右レールの AdSense は 3 枠 (11-03 の「右レールは 2 枠まで・PR が無くても AdSense で埋めない」をオーナーが改めた。11-03 時点の右レールの代わりの AdSense は 1,000 表示あたり ¥7 と低いので、ユニット別に前後を見る)。あわせてランキングの読み込みのバナー解決 (`nativeBanners`・`affiliateVertical`)、ランキング専用の案件の例外 (`ranking-affiliate-policy.ts`。国勢調査の世帯増減を住まいへ当てる 1 件の判断。戻すときは commit 955444898 の版から)、固定のバナーの選び方 (`selectPromoBannerIndexForRanking`) を外した。配置ガード `check-ad-placement.cjs` はランキングの右レールに PR を必須にしなくなった (戻すときの画像バナーだけの制約は残す)。
  - **5 つ目の変更 (11-12)**: ランキングの右レールの最後の AdSense (`stats47-ranking-table-side`) を 300×250 から 300×600 にし、ヘッダーの下 (80px) に追従させた (台帳の `adsense-rail-sticky`・PC だけ)。右レールの中身が本文より短く、PC で下が約 840px 空いていたため。変更前 W42〜W44 は 1,000 表示あたり ¥8〜10・視認率 32〜33%。Google の追従広告の条件 (幅 300px 以下・縦だけ・同時に見える追従広告は 1 つ・重ならない・PC だけ。support.google.com/adsense/answer/10734935) に収め、手元で 1440px の追従とフッターに重ならないこと (最下部で 119px 離れる) を確かめた。回遊の導線は `RANKING-RAIL-CIRCULATION-01` で別に決める。
  - **6 つ目の変更 (11-12・ブログの本文の段)**: ブログ記事の本文の段 (h2 の 2・4・6 番目の前) と記事の末尾を、AdSense 1 つ・幅いっぱい (上限 580px) にし PR を外した。ユニットは位置ごとに固定: 1 つ目 `stats47-blog-inarticle` (6809797335)、2 つ目 `stats47-blog-row-2` (9307296688)、3 つ目 `stats47-blog-row-3` (4897424179)、末尾 `stats47-blog-end` (2394403971)。後ろ 3 つは 11-12 にオーナーの依頼でエージェントが AdSense の管理画面で作成 (ディスプレイ・レスポンシブ。`blog-row-3` は入力が二重になり名前を直した)。それまでの `hub-incontent`・`content-footer-rect`・`themes-content` はハブ・一覧と共用で、ブログの分を分けられなかった。スマホの箱は本文の幅 (276px) になり、11-11 に見つけた 300px 固定のはみ出しはレスポンシブで解消する見込み (本番で確かめる)。右レールの PR は変えていない (次は PC の右レールに AdSense の上段と追従する縦長)。残る論点: 記事に手で置いた `<ad-slot>` (PC だけ・`blog-inarticle` を使い、本文の 1 つ目の段と同じユニットが重なる) と、手置きの PR バナー・本文のテキスト広告の扱い。
  - **7 つ目の変更 (11-12・ブログの右レール)**: 右レールの PR のバナー (最大 2 枚) を上段の AdSense `stats47-blog-rail` (1595814272) に替え、右レールの最後に追従する 300×600 `stats47-blog-rail-sticky` (6270069803) を足した (PC だけ。両ユニットとも 11-12 にエージェントが作成)。追従は `RailAdSlot` の `sticky` に寄せ、ランキングの追従も同じ部品にした (ランキングの追従の枠にも「広告」の表記が付いた)。外したもの: ブログのバナー解決 (`resolveAffiliateBannersForContent`) と `BLOG_IN_BODY_BANNER_COUNT`。配置ガード `check-ad-placement.cjs` はブログの右レールに画像バナーを必須にしなくなり、宣伝の部品の名前の見つけ方を直した (先頭に 1 文字を要求していて `FurusatoNozeiCard`・`AffiliateAdSlot` を拾えなかった)。手元の 1440px で上段 300×250・追従 300×600 (上から 80px で止まり、最下部でフッターと 92px 離れる)、スマホは本文の 3 枠だけを確認。
  - **8 つ目の変更 (11-12・ブログの段の位置)**: スマホで見出しの間の文章が長いと広告の間が最大 3,800〜4,800px 空いていたので、段の数のルール (h2 が 2 本で 1 段・4 本で 2 段・6 本以上で 3 段) は変えずに、位置を「2・4・6 番目の h2 の前」から「広告の間の最大がいちばん小さくなる h2 の組み合わせ」に変えた (`adRowTargets`。高さはスマホでの見積もり)。手元の 9 記事で最大の間は 3,188→2,701・3,875→2,856・3,798→2,812・3,512→2,946・4,764→4,322px、3 記事は変わらず。ビール (見出し 5 本・本文 9,300px) と中華麺 (見出し 3 本) は段の数が足りず 4,000px 前後の間が残る。段を増やすか (台帳の本文の AdSense 上限 4 枠の見直しを含む) は、本番で自動広告を含めたスマホの広告密度を測ってから決める (11-12 オーナー合意)。
  - **上限の撤廃 (11-12 オーナー決定)**: 台帳の「本文の AdSense は 1 ページ 4 枠まで」(`rules.maxAdsenseBodyPerPage`) と、その数え方のための `manualOnly` を外した。量はデプロイ後に本番のスマホの広告密度 (自動広告込み・30%) で判断する。
  - **9 つ目の変更 (11-12・ブログの右レールの回遊と中段)**: PC で右レールの下がまだ空いていたので (オーナー選択「回遊2つとAdSense」)、関連記事を 3→5 件にし、上段の AdSense の直後に「よく読まれている記事」(自分と関連記事を除く上位 5 件) を足し、運営者のプロフィールの前に追従しない 300×250 `stats47-blog-rail-middle` (4422635661・11-12 にエージェントが作成) を置いた (追従の枠の直前に置くと広告が隣り合うため)。よく読まれている記事は手で選んだ 3 記事 (08-28) をやめ、GA4 の直近 28 日の日本の閲覧数の上位 10 件を `data/blog/popular-articles.json` に書き (`fetch-popular-blog-articles.mjs`)、週次の計測 (`fetch-metrics-weekly.yml`) で選び直す (main にマージされるまで週次は動かない)。ブログ一覧の「よく読まれている記事」もこの順になる。右レールの広告はこれで 3 つ (上段・中段・追従)。
  - **10 個目の変更 (11-12・県のページ)**: 県のページ (`/areas/<県>`) の広告の段 2 つ (AdSense と PR の横並び) を AdSense 1 つ・幅いっぱいにして PR を外し、データブックの「暮らし」「気候」「消費」の節の前に同じ形の段を 3 つ足した (データブックはスマホで約 15,800px あり、最初の広告がスマホ 17,951px・PC 8,708px まで出なかった)。差し込みは節のキーで決まり、節の無い県では出ない (`AreaDatabookSection` の `insertBefore`)。手元の東京都でスマホの広告の間は 4,428 / 4,867 / 5,001 / 4,661 / 2,759px、鳥取県もほぼ同じ (最大 5,110px)。さらに「この県の特徴を読み解く記事」を 3→6 件にし、一覧が 1 列のとき (カードの幅 43.5rem 未満 = スマホ) だけ 3 件目の後にインフィード広告 (テンプレート「横の画像」) を入れた。2 列以上では一覧がページの上の方 (768px で 753px・1440px で 702px) にあり、広告が最初の画面に入り同じ行の記事も伸びたので出さない。ユニットは 11-12 にオーナーの依頼でエージェントが作成: `stats47-area-databook-1` (3776748345)・`-2` (3704450369)・`-3` (3540944628)・`stats47-area-after-databook` (4929902121)・`stats47-area-end` (4738330430)・インフィード `stats47-area-infeed` (9371196667・layout key `-fb+5w+4e-db+86`・選択したディスプレイ広告の許可はオン)。それまでの `hub-incontent`・`content-footer-rect` はハブ・一覧と共用だった。手置きの広告の高さはスマホのページの約 7% (自動広告は含まない)。本番で測ること: インフィード広告の大きさ (予約 120px は仮)・段の大きさ・自動広告込みの広告密度。
  - **11 個目の変更 (11-12・ブログの手置きの広告)**: 公開 861 記事を R2 から読んで数えると、本文に手で書いた `<ad-slot>` が 97 記事に 176 個、`<affiliate-banner>` が 3 記事に 3 個 (`<affiliate-text>` は 0)。手置きが 1 つでもある記事には本文の段が入らず、手置きの `<ad-slot>` はスマホで描かないので、この記事 (W44 のブログの閲覧の 33.7%・麺類の記事 934 閲覧ほか) はスマホの本文に広告が無かった。手置きの 2 つのタグは何も描かないようにし、どの記事にも本文の段を入れる (本文の R2 は書き換えていない)。不要になった分類バナーの取得 (`resolveAffiliateBannersByCategory`) もブログのページから外した。直接配置の台帳 `affiliate.direct-placements` (2 件) は戦略を練り直すときのために残す。麺類の記事のスマホで本文の段 3 つ + 末尾 (2,269 / 4,613 / 6,987 / 8,947px) を手元で確認。
  - **12 個目の変更 (11-12・市区町村のランキング)**: `/municipalities/ranking/<指標>` (W44 の GA4 で 5,428 閲覧。ランキング・ブログの次) は解説の後の段 1 つ (AdSense・PR・AdSense の横並び。スマホは先頭の 1 枠だけ) だった。地図の後・順位の表とページ送りの後・ページの最後 (関連の後・出典の前) の 3 段にし、どれも AdSense 1 つの幅いっぱいで PR を外した。PR の取得 (`resolveAffiliateBannersByVertical`) もページから外した。ユニットは 11-12 にオーナーの依頼でエージェントが作成: `stats47-municipality-after-map` (7607523006)・`stats47-municipality-after-table` (4981359660)・`stats47-municipality-end` (1042114655)。それまでの `hub-incontent`・`content-footer-rect` はハブ・一覧と共用だった。製造品出荷額のページで、スマホ 1,246 / 4,100 / 5,185px (全体 5,948px)、PC 1,358 / 4,052 / 4,911px。ページが短いので、手置きの広告の高さがスマホで 15.1% (県のページは約 7%)。自動広告込みで 30% を超えるなら、表の後か最後の段を外す。
  - **13 個目の変更 (11-12・市区町村のランキングの右レール)**: 1440px で本文が 1,131px に広がり、3 列の順位の表が間延びしていたので、オーナーの推奨案で都道府県のランキングと同じ右レール付きの枠 (`ArticleShell`) にした (表は 765px)。右レールは「関連の一覧 → AdSense `stats47-municipality-rail` (3309698695) → 都道府県のカード → 追従する 300×600 `stats47-municipality-rail-sticky` (5716370187)」(両ユニットとも同日にエージェントが作成)。都道府県のカードは全指標で出す (県別のページがある指標はそのページ、無い指標はこのページの `?pref=` の絞り込みへ) ので、2 つの広告の間に必ず内容が入る。関連の一覧が右レールへ移った結果、本文の「ページの最後」の段が表の後の段と約 240〜280px で続いたので外した (`stats47-municipality-end` は使わない)。製造品出荷額のページで、PC は本文 1,292 / 4,006px・右レール 456 / 1,168px (追従は上から 80px で止まる)、スマホは本文 1,246 / 4,100px で広告の高さ 10.3%。右レールの上段は PC の最初の画面に入る (都道府県のランキングの上段と同じ扱いで、同日にオーナーが認めた)。
  - **14 個目の変更 (11-12・テーマのページ)**: 全国と県別のテーマのページ (`/themes/<テーマ>`・`/areas/<県>/<テーマ>`) の本文の段 3 つ (2 章目の後・4 章目の後・ページの最後) から PR を外し、どれも AdSense 1 つを本文の幅いっぱい (上限 580px) にした (オーナーの選択「3 段とも替える」)。ユニットは 1 段目が既存の `stats47-themes-content` (8298138821)、2 段目と最後は同日にエージェントが作ったテーマ専用の `stats47-theme-row-2` (9630518288)・`stats47-theme-end` (2430685118)。それまではハブ・一覧と共用 (`HUB_INCONTENT`・`CONTENT_FOOTER`・`RAIL_RECT`) でテーマの分を測れなかった。市区町村のテーマ (`/municipalities/themes/<テーマ>`) の段 1 つも AdSense 1 つにし、`stats47-theme-end` を使う。これでテーマのページから PR は無くなった。localhost でも測っていない (反映後に本番で大きさと CLS を測る)。
  - **15 個目の変更 (11-12・ホーム)**: ホームの本文の段 2 つ (「知りたいことから探す」の後・ページの最後。AdSense と PR の横並びで、スマホでは 2 段目が PR だけだった) から PR を外し、どちらも AdSense 1 つを本文の幅いっぱいにした (オーナーの選択「2 段とも替える」)。ユニットは同日にエージェントが作ったホーム専用の `stats47-home-row-1` (6019089689)・`stats47-home-row-2` (3189892156)。それまでの `HUB_INCONTENT`・`CONTENT_FOOTER` は一覧ページと共用だった。右レールの AdSense (`RAIL_RECT`) は変えない。
  - **16 個目の変更 (11-12・ホームの右レール)**: PC (1440px) でホームの右レールの中身が約 500px (AdSense と運営者のプロフィール) しかなく、本文 (約 2,800px) の下が約 2,200px 空いていたので、オーナーの推奨案で「よく読まれている記事」5 件 (ブログの右レールと同じ台帳 `data/blog/popular-articles.json`。本文の「新着ブログ」に出した記事は除く。計測は `nav_surface=home_blog`・`popular:<slug>`) と、最後に追従する 300×600 `stats47-home-rail-sticky` (3704063320。同日にエージェントが作成) を足した。上の AdSense と追従する枠の間には記事の一覧とプロフィールが入る。**同時に直した不具合**: 追従する 300×600 はブログ・ランキング・市区町村のランキングでも追従していなかった。右レールの列が中身の高さで終わり (共通の格子の `rail:items-start`)、sticky が親の外へ動けないため (localhost 1440px で、ブログはスクロール 3,200px で枠の上端が −67px)。右レールを本文と同じ高さまで伸ばす (`ArticleShell` の右レールを `rail:flex rail:flex-col rail:self-stretch`、`PageShell` の右レールを `rail:self-stretch`) と、4 ページとも枠がヘッダーの下 80px で止まり、本文の終わりで離れることを実測した。狭い幅の 2 列の積み方は変わらない。本番で追従を測るのはデプロイ後。
  - **17 個目の変更 (11-12・残りの全ページ)**: オーナーの「残っているところは全て AdSense に」で、分野 (3 段)・調査 (3 段)・分野の比較・タグ・一覧 5 種 (ランキング・テーマ・地域・調査・ブログのタグ)・市区町村のハブの段から PR を外し、どれも AdSense 1 つを本文の幅いっぱいにした。分野と調査の 2 段目は `THEMES_CONTENT` (テーマの段と共用になる) をやめ、同日にエージェントが作ったハブ用の `stats47-hub-row-2` (6020069625) にした。ほかは各段にあった AdSense のユニット (`HUB_INCONTENT`・`CONTENT_FOOTER`) をそのまま使うので、一覧ページごとの収益は分けて測れない。ブログ一覧 (`/blog`) の右レールのふるさと納税のバナーを AdSense (`RAIL_RECT`) に替え、モバイルの本文に AdSense が無かったのでページの最後の段 (`CONTENT_FOOTER`) を足した。記事に手で置いた `<affiliate-text>` は描かない。これでどのページにも PR は出ない (撮り直しで全ページ PR 0 を確認)。
  - **18 個目の変更 (11-13・検索のページ)**: `/search` は結果を全件 1 ページに並べ (W44 の GA4 で週 1,219 閲覧。「人口」で 314 件・スマホで約 58,000px)、広告はページの最後の 1 つ (`CONTENT_FOOTER`) だけだった。オーナーの選択で、結果の 5 件目・30 件目・60 件目の後に AdSense 1 つ (本文の幅いっぱい) の段を足した。段の後に結果が 3 件以上続くときだけ出す (最後の広告と隣り合わせない)。ユニットは同日にエージェントが作った検索専用の `stats47-search-row-1`〜`3` (4024103858・9112779000・5121563102)。
  - **19 個目の変更 (11-13・市区町村のページ)**: `/areas/<県>/cities/<市区町村>` (W44 で週 881 閲覧) はスマホで約 15,500px あり、広告はページの最後の 1 つだけだった。オーナーの選択 A で、データブックの 26 節を 5 つの章 (人口と世帯・財政・仕事と産業・医療・福祉と教育・住まいと暮らしの環境。`CITY_DATABOOK_LAYOUT.chapters`) にまとめ、章の頭に「特徴」と同じ選定 (`selectCityHighlights`) で 1 文を置いた (選べない章は文なし)。「分野別のデータ」の前・財政の章の前・医療・福祉と教育の章の前に記事内広告 (`stats47-city-inarticle-1`〜`3`、W44 で本文の記事内広告は 1,000 表示あたり ¥29〜38) を幅いっぱいに出し、関連記事を共通の `RelatedArticles` で 6 件にして 3 件目の後にインフィード (`stats47-city-infeed`、スマホだけ) を入れた。ユニットは同日にエージェントが作成。ページの最後の県のバナー (アフィリエイト) は外した。localhost で千代田区は広告が 1,537・5,282・10,510・16,818px、函館市は 1,655・5,400・10,810・17,295px (スマホ)。ページは約 18,400px に伸びた (関連記事 6 件の大きいカード)。サイト全体への展開は `ADSENSE-FORMAT-BY-PAGE-01`。 仕上げ (同日): 章の見出しを h2 (節は h3) にして大きさで区切り、同じ県内順位を分け合う指標 (`prefectureTies`、生成時に焼き込み) を「特徴」と章の 1 文から外した。
  - **20 個目の変更 (11-13・分野のページの右レール)**: `/category/<分野>` (W44 で週 1,880 閲覧) の PC の右レールは出典調査のカードと AdSense の約 600px だけで、本文 (約 3,550px) の下が約 2,900px 空いていた。オーナーの選択でホームと同じ形にし、「よく読まれている記事」5 件 (本文の新着の記事は除く。計測は `nav_surface=category_blog`・`popular:<slug>`)・運営者のプロフィール・最後に追従する 300×600 `stats47-category-rail-sticky` (5537009425。同日にエージェントが作成) を足した。
  - **21 個目の変更 (11-13・調査のページの段の並べ替え)**: `/survey/<調査>` (W44 で週 882 閲覧) はスマホで最初の約 4,400px に広告が無く、最後の 2 段が約 600px で並んでいた (家計調査で 4,399・6,537・7,135px)。オーナーの選択で、数は 3 つのまま「地図付きのランキングのカードの後 (ブログ記事・テーマの前)」「全ランキングの表の前」「ページの最後」に並べ替えた。localhost で家計調査 2,260・4,732・7,103px、国勢調査 2,329・6,423・9,385px (スマホ)。ユニットは変えない。
  - **22 個目の変更 (11-13・一覧ページのインフィード)**: テーマ一覧・ブログ一覧・市区町村のハブ・調査一覧 (W44 で合わせて週 732 閲覧) は、カードが長く並ぶのに広告がページの最後の 1 つだけだった。オーナーの選択で、一覧が 1 列のとき (スマホ) だけ一覧の途中にインフィード広告を入れた。テーマ一覧は 20・40 件目の後、ブログ一覧は 6・14 件目の後、市区町村のハブはテーマの真ん中、調査一覧は 25 件目の後。テンプレートは文字だけのカードに「テキストのみ」、ブログに「上部の画像」で、ユニットは同日にエージェントが作った 6 つ (`stats47-themes-index-infeed-1`・`-2`・`stats47-municipalities-index-infeed`・`stats47-survey-index-infeed`・`stats47-blog-index-infeed-1`・`-2`)。`CardGrid` の `insertAfter` は複数を受け取れるようにした。撮り直しで、スマホのテーマ一覧 3,179・6,115px、ブログ一覧 2,360・5,065px、市区町村のハブ 2,282px、調査一覧 3,343px。ランキング一覧・都道府県一覧は短いので足さない。
  - **23 個目の変更 (11-13・大きな空きの残り)**: 撮影の記録で広告と広告の間がいちばん長いページを洗い出し、オーナーの選択で埋めた。検索は結果の 90 件目の後から 30 件ごとにインフィード (`stats47-search-infeed`、同日にエージェントが作成。同じユニットを繰り返す)、調査一覧は 25 件目の後から 30 件ごとに同じインフィードを繰り返し、分野の比較は比較の行の真ん中の後に記事内広告 (`HUB_ROW_2`)。インフィードは同じフィードで同じコードを繰り返してよい (AdSense のコード生成画面の案内) ので、サイトの「1 ページで同じユニットを重ねない」の例外として台帳に理由を書いた。スマホのいちばん長い空きは、検索 約 48,000→7,600px、調査一覧 約 12,100→3,300px、分野の比較 約 6,900→4,200px。ブログのタグ一覧 (週 1 閲覧) は足さない。
  - **出す時期**: 11-14 のベースラインの判定の後。デプロイ日を境に 2 週、このユニットの表示 1,000 回あたり収益・視認率・埋まった割合 (W42〜W44 は ¥29〜31・37〜42%・90%) と、ランキングの 1,000 PV あたり収益・CLS を前後で比べる。
  - **スマホの広告密度 (11-12 オーナーとの検討)**: デプロイ直後の本番の測定で、スマホ (390px) のランキングの広告密度 (本文の高さに対する広告の高さの合計。自動広告・アンカーを含む) も測る。手置きは 11-12 の変更で 1 → 3 枠 (約 900px・ページ 6,411px の約 14%) に増え、自動広告 3〜4 個とアンカーを足すと 30% 前後の概算 (未計測)。Better Ads Standards の上限 30% (betterads.org/mobile-ad-density-higher-than-30・11-12 確認) を超えるなら手置きを減らす。スマホで広告を足すのは縦に長いページ (ブログ記事・県) から 1 つずつ、と同日にオーナーへ提案した (未決定)。
  - **高さの危険**: 11-11 の実測でこのユニットは幅 300px の箱で 300×600 に描画された。幅 580px では 280px の予約を超えて伸び、下の内容がずれる可能性が高い。デプロイ直後に本番で大きさと CLS を測り、台帳の `height` を実測へ直す。600px を超えて伸びる、または CLS が 0.1 を超えるなら、上限の幅を狭めるか元の段 (300×250 の横並び) へ戻す。
- **停止条件・禁止**: `data-ad-format="auto"` と `data-full-width-responsive="true"` を上限なしで戻さない (10-31 の実測で最大 1200×600・右レールで 928×280)。複数の枠を同時に変えない。1 週対 1 週の比較で確定と書かない。
- **完了条件**: ②〜④ の各 2 週の実測が `data/improvement/adsense-improvement/improvement-log.md` に残り、枠ごとの形式が決まる。

### [CI-CONTRACT-TESTS-DEVELOP-GAP-01] main への PR でしか回らない契約テストが、develop で壊れても気づけない
タグ: [インフラ・計測] [種類:不具合] [実行:対話] [起票:2026-11-11]

2026-11-11 の PR #1251 で、契約テスト (`pr-quality-check.yml` の Contract Tests) の 1 件が落ちてマージが止まった。原因は 11-10 の台帳の整理 (指標の定義の kind を config から master に変更) で、`prune-state-snapshots.test.mjs` が指標 3 件を日付名の記録と誤検出したこと。このテストは develop への push の検査 (`develop-quality-gate.yml`) では回らないので、整理が入ってから約 1 日、誰も気づけなかった。Contract Tests は最初の失敗で止まるので、後ろの約 15 段は 1 回目の PR では実行されていなかった。

- **次 (実行順)**: ① Contract Tests の各段の所要時間を run のログで測る ② 短い段 (node --test だけのもの) を develop の検査へ足すか、Contract Tests を「失敗しても後ろの段を続ける」形にするかを決める ③ 決めた方を入れ、わざと 1 件壊して develop で赤になることを確かめる。
- **停止条件・禁止**: develop の検査の待ち時間を大きく延ばさない (CI の速さは人の待ち時間で測る。memory `feedback_ci_speed_wait_time`)。
- **完了条件**: 契約テストを壊す変更が、main への PR より前に develop で赤になる。

### [RANKING-INTEGRITY-AUDIT-FLAKE-01] ランキングの整合の監査が、同じコードで 1 回だけ「違反あり」になった
タグ: [インフラ・計測] [種類:不具合] [実行:対話] [起票:2026-11-11]

2026-11-11 に `audit-ranking-data-integrity.ts` を本番の R2 に対して 4 回続けて実走したところ、1 回目だけ総合判定が「違反あり」(終了コード 1) で、2〜4 回目は全項目が通った。1 回目も、この日に足したカテゴリ一覧の所属漏れは 0 件だった。1 回目のログを消していたので、どの検査が落ちたかは分かっていない。この監査は週次の `ranking-integrity` (weekly:audits) が回すので、同じ揺れが週次レビューで偽の失敗になりうる。

- **次 (実行順)**: ① 週次の実行で失敗したら、`--json` の出力のどの項目の `ok` が false かを記録する ② 取得の失敗 (タイムアウト・一時的な 5xx) を違反と数えている箇所が無いかを `fetchJson` の呼び出し元で確かめる ③ 取得の失敗と中身の違反を分けて出す。
- **停止条件・禁止**: 原因を特定する前に、再試行で揺れを隠さない。
- **完了条件**: 失敗の理由がログから分かり、取得の失敗だけで違反にならない。

### [GSC-USER-ACTIONS-01] GSC の記録と Googlebot の集計に要る、オーナーだけの 2 つの作業
タグ: [インフラ・計測] [種類:改善] [実行:ユーザー] [起票:2026-11-11] [期日:2026-11-13] [領域:サイト]

2026-11-11 のデプロイ後作業で、Claude には実行できず止まっているものが 2 つある。どちらも 11-14 (土) の週次取得より前に済ませたい。

- **① Google へのログイン**: 送信済みビューの記録 (`data/gsc/coverage-submitted-history.csv`) を取る専用プロファイル `.local/playwright-google-admin-profile` が Google に未ログインで、取得スクリプトが 10 分待って止まる (11-11 に確認)。Mac でこのプロファイルを開いて Search Console の stats47.jp に入れる状態にする。やり方は `docs/01_技術設計/07_Playwright認証プロファイル.md`。
- **② Cloudflare トークンの権限**: CI の API トークン「stats47」に、ゾーン 4caf2866… の Analytics 読み取り (`zone.analytics.read`) を足す。足すまで日次 snapshot の `googlebot` は「取得不能」になる (11-11 の run 42958312727 で確認)。Cloudflare の API トークン画面で権限を足し、翌日の `data/cloudflare/snapshots/<日付>.json` の `googlebot.status` が `unavailable` でなくなることを確かめる。
- **停止条件・禁止**: 認証情報を Claude に渡さない。権限付与は Claude が代行しない。
- **完了条件**: ① は 11-14 の取得で `coverage-submitted-history.csv` に `captured` の行が入る。② は翌日の snapshot で `googlebot` の件数が入る。

### [GSC-CRAWL-WASTE-01] Google のクロールがページ本体以外に使われている分を確かめて止める
タグ: [インフラ・計測] [種類:改善] [実行:対話] [起票:2026-11-11] [領域:サイト]

- **起点 (2026-11-11 実測 (GSC 最終更新 11-06・本番 HTTP・サイトマップ 11 本)・クロール統計は直近 90 日・最終更新 11-09)**: 34 万リクエストのうち HTML は 36%、「その他のファイル形式」30% (10.3 万件・合計 8.23 億バイト = 平均 8KB・平均応答 891ms)、JavaScript 14%、画像 11%。目的別は更新 79%・検出 21%。ホスト別は stats47.jp 280,193・storage.stats47.jp 59,325。平均応答時間 1,500ms。キャッシュに無い状態の取得は手元で約 2 秒、HTML は 0.5〜1.0MB (圧縮後 36〜93KB)。`storage.stats47.jp/robots.txt` は 404。送信済みの「検出 - 未登録」は 1,134 件 (`GSC-INTERNAL-DISCOVERY-01`)。
- **「その他のファイル形式」の正体 (2026-11-11 確定)**: GSC のクロール統計の例 500 件 (全 866 件・9-16〜11-10・全件 200) は 2 種類。① `?_rsc=` 付きの URL 182 件 = Next.js のリンク先読み (RSC)。日付は 9 月 98・10 月 84 で、最後は 10-16。同日の `f94a5035f` (先読みを画面内からホバー時へ変更) 以後の例は無い = 解消済み。② クエリの無いページ URL 316 件 = 県×テーマ 264・テーマ 32・Geo 20。11 月の例 45 件はこの種類だけ。本番 `/areas/24000/business-demography` をブラウザで開くと、表示直後に同じ URL への POST が 1 回出る (応答 2,440 バイト・転送 780 バイト・879ms、中身は指標の時系列 `points` の配列)。呼び出し元は指標カード (`SingleMetricCard` / `MetricSwitcherPanel`) の時系列を取る Server Action `fetchMetricTimeseriesBatchAction`。章に図があるテーマ (例 `/areas/13000/aging-society`) は、図の結果を取る `fetchThemeChartResultsAction` の POST (12,788 バイト) も出る。Geo は `GeoLayerExplorer` / `GeoSpatialEvidenceExplorer` が Server Action を呼ぶ。Cloudflare のログでの照合はしていない (ローカルに API トークンが無い)。(この時点では推定。下の 11-11 の実測で Googlebot の POST を確認した。)
- **テーマの POST の是正 (2026-11-11 実装・未デプロイ)**: 表示する地域の時系列と図の結果をサーバーの初回描画で渡し、指標カードと図は渡された分を取りに行かない (`features/theme-dashboard/lib/initial-theme-data.ts`・`components/InitialThemeDataContext.tsx`)。県を切り替えた先は従来どおり取りに行く。localhost の実測: `/areas/24000/business-demography` は同じ URL への fetch が 1 → 0、HTML は 487,991 → 519,569 バイト (転送 65,385 → 67,839)。`/areas/13000/aging-society` は fetch 1 → 0、HTML 1,052,413 → 1,110,372 バイト (転送 125,840 → 129,179)、図 3 枚は ready。`/themes/railway` で大阪府へ切り替えると fetch が 2 回出て図が大阪府になる。検査: web の vitest 全件 2,826 通過・型検査通過。渡す時系列は表示する全指標の分で、カードが使わない指標も含む (HTML が約 6% 増える)。Geo ページ (`GeoLayerExplorer` など) の Server Action は未対応。
- **次 / 順序**: ① テーマの POST の是正を本番へ出した後、本番の県×テーマ・テーマのページで同じ URL への POST が出ないことを確かめ、GSC のクロール統計「その他のファイル形式」の例に反映日以後の県×テーマ・テーマの URL が出なくなるかを反映から 4 週後に読む (Geo の URL は残る)。Geo ページの Server Action を同じ形にするかは、その結果を見て決める ② `storage.stats47.jp` に robots.txt を置き、画像 (OGP・ブログの図) は許可して `values.json` などの JSON を止める案を作る (R2 への書き込みなので承認後) ③ ダウンロード API を Disallow に戻すかを `GSC-ROBOTS-INDEXED-01` の 23 件が 0 になった後に決める ④ キャッシュに無いときの応答 (約 2 秒) と HTML の大きさ (0.5〜1.0MB) を減らす案を、テンプレート別の実測から 1 つ選ぶ。
- **根拠の扱い**: Google の「大規模サイトのクロール予算管理」(developers.google.com/search/docs/crawling-indexing/large-site-managing-crawl-budget) を、応答が速いほどクロール上限が上がる・noindex のページもクロールを使う、の根拠に使う。11-11 の調査では再取得しておらず記憶からの引用なので、着手時に本文を読み直してアクセス日を書く。
- **停止条件・禁止**: 正体を確定する前に prefetch や robots を変えない。画像のクロールを止めない。Dataset 構造化データの検証を壊さない。R2・本番への反映は別途指示で行う。
- **完了条件**: 「その他のファイル形式」の正体が記録され、止めると決めたものが robots / 実装に入り、効果観測 (反映から 4 週後の送信済み「検出 - 未登録」件数とクロール統計の HTML 比率) が `improvements.md` の別 ID へ引き渡されている。
- **Geo ページの POST は見送り (2026-11-11)**: `GeoLayerExplorer` / `GeoSpatialEvidenceExplorer` の Server Action は地図の形状データを運ぶ。テーマと同じ「初回描画で渡す」形にすると HTML に形状が入ってページが大きくなるので採らない。キャッシュできる GET (robots で止めている `/api/` の下) へ替える案を別に設計する。GSC の例では 316 件中 20 件。
- **Googlebot の POST を実測 (2026-11-11・デプロイ前の基準)**: Cloudflare の GraphQL Analytics (`httpRequestsAdaptiveGroups`・ダッシュボードのログインで取得) で、UA に Googlebot を含むリクエストを 2026-11-10T00:41Z〜11-11T00:41Z の 24 時間で数えた。合計 5,441 件 (stats47.jp GET 4,226・POST 285、storage.stats47.jp GET 925、www 5)。POST 285 件は全て 200・content-type は htc (text/x-component) で、内訳は 県×テーマ 254 件 (163 パス中の大半・平均 10.3KB)、Geo の分析 16 件 (平均 109KB)、Geo の県別データ 7 件 (平均 81KB)、テーマ 8 件 (平均 1.6KB)。UA はスマートフォン用 Googlebot 227・PC 用 56。これで「Google の描画が Server Action の POST を出している」は推定ではなく観測になった。同じ窓の GET は html 2,516 (平均 90KB)・js 776・svg 471・png 139 (平均 1.1MB)・json 159・geojson 49 (平均 727KB)・kml 44 (平均 2.5MB)・csv 17。限界: UA の文字列での絞り込みで、Google の IP かは確かめていない。件数は Cloudflare の標本抽出を含みうる。**判定の基準**: テーマの POST の是正を本番へ出した後、同じクエリの 24 時間で 県×テーマとテーマの POST が 262 件からどこまで減るかを見る (Geo の 23 件は残る)。再現: ダッシュボードにログインしたブラウザで `/api/v4/graphql` に `userAgent_like: "%Googlebot%"`・dimensions `clientRequestHTTPMethodName, clientRequestPath` を投げる。ローカルと同じ集計を CI のトークンで回すなら `.claude/scripts/cloudflare/fetch-usage.mjs` の `gql` と同じ形。
- **本番反映と確認 (2026-11-11)**: PR #1249 が 00:43Z にマージされ、Deploy to Cloudflare Workers と Post-Deploy Smoke Test は success。本番をブラウザで開いて確かめた: `/areas/24000/business-demography` は同じ URL への fetch が 0 件・指標カード 6 枚に推移の線あり、`/areas/13000/aging-society` は fetch 0 件・図 3 枚が ready、コンソールのエラーなし。**次**: 2026-11-12 以降に、デプロイ後の 24 時間で Googlebot の POST を同じクエリで数え、県×テーマとテーマの 262 件 (基準) と比べる。その結果が出たら効果観測を `improvements.md` へ引き渡す。
- **ページの重さで見送ったもの (2026-11-11 実測)**: ① 全ページ共通のサイドバーとヘッダーが HTML で約 116.5KB (大半が class 属性)。② `/areas/13000/population-dynamics` は 1.64MB・RSC 1.25MB で、移動の行列 2,162 組と年次の点が大きい (page-quality の RSC 500KB 警告を超える)。③ カテゴリ 17 本中 7 本と家計の調査ページが HTML 900KB の警告を超える (economy 2.25MB)。行の class を短い CSS クラスにまとめれば調査ページで約 0.4MB 減るが、lyra の値を className に書く方針から外れるので採っていない。④ キャッシュに無いときの TTFB は 2.4〜3.1 秒 (KIX で `?cb=` を付けて実測)。edge の保持は 24 時間だがデータセンター単位なので、Cloudflare の Tiered Cache が Workers の cache で効くかを公式文書で確かめてから案を出す (設定の変更はオーナーの承認後)。**次**: ①③はデザインシステムとしての判断が要るので、やるなら `ui-consistency-reviewer` に案を出させる。
- **Geo の POST を GET に替えた (2026-11-11 実装)**: 分析ページの県の detail と雪の原典を、`/api/geo/analysis/<slug>/<県>?v=&sha=` と `…/snow-source` の GET にした (照合は `features/geo-analysis/lib/resolve-geo-detail.ts`・`resolve-geo-snow-source.ts` に移して route が使う。長期キャッシュのヘッダー)。`robots.ts` で `/api/geo/analysis/` を Allow にした (Google の描画に地図を出すため。オーナー判断)。localhost の実測: `/geo/population-station-access` と `/geo/population-snow-designation` で同じ URL への POST が 0、GET が出て地図が描かれる。呼ばれていなかった `fetchStationAccessDetailAction` は消した。**残り**: レイヤーのページ (`GeoLayerExplorer`) は初回は POST を出さないが、県を切り替えると `fetchGeoLayerAction` の POST が出る。利用者の操作時だけなので今回は変えていない。KML・GeoJSON のダウンロードはリンクからボタンにした (サーバー HTML の `format=kml`・`format=geojson` の href は 0)。



**2026-11-11 2 回目のデプロイ (PR #1250・03:26Z マージ) の後の実測**

- 本番: `/sitemap/3.xml` 2,596 件、shard 11 本すべて 200。`/robots.txt` の `*` と `Google-Extended` に `/api/geo/analysis/` の Allow。`/ranking/abandoned-cultivated-land-area` の HTML は KML・GeoJSON の href が 0、CSV が 1 (ボタンは 2 個が表示)。`/geo/population-station-access` と `/geo/population-snow-designation` は自分の URL への POST が 0 で地図が出て、`/api/geo/analysis/...` を curl で 3 回 GET すると `cf-cache-status: HIT`。HTML は `/category/population` 991,538 → 959,069 バイト、`/survey/kakei-chousa` 1,983,351 → 1,781,915 バイト。
- `storage.stats47.jp` の robots.txt: `publish-storage-robots.yml` の dry-run (run 42958007806) は「candidates=1 changed=1 uploaded=0」。本実行の結果は下の行。
- Cloudflare の日次集計 (run 42958312727): `googlebot` の欄は「取得不能」と記録された。理由は CI のトークンにゾーン 4caf2866… の `zone.analytics.read` が無いこと。次: オーナーが Cloudflare のトークン「stats47」に Zone の Analytics 読み取りを足す (`[実行:ユーザー]`)。足すまで 11-12 の POST の数え直しは手元のトークンで行う。
- economy の 9 件: カテゴリ一覧 (`app/category/<key>/items.json`) を作るのは `sync-snapshots.yml` の `only=master` (`export-master-snapshots.ts` → `exportRankingItemsPerUrl`)。11-11 に `only=ranking-items` と取り違えて本実行し (run 42958901486・ランキング本体 2,731 ファイルを送り直しただけ)、economy は 1,013 件・11-05 生成のまま変わらなかった。`app/ranking-items/all.json` には 9 件が economy・公開で入っている。11-11 04:48Z に `only=master` を本実行し (run 42961614734・sync job 成功)、R2 の economy の一覧は 1,022 件、本番 `/category/economy` のランキングへのリンクは 1,022 本 (`*-budget-share-kakei` 9 本を含む) になった。この項目は完了。
- `storage.stats47.jp` の robots.txt は 11-11 04:22Z に反映済み (run 42958691869・uploaded=1)。キャッシュを避けた取得は原本と一致し、素の URL も 200 になった。
- **統合 (2026-11-13)**: `GSC-POSTDEPLOY-VERIFY-01` をこのカードへ統合した。完了条件に含める: 親の完了条件に加え、2026-11-18 期限の 3 点を確認して記録する: (1) /ranking/abandoned-cultivated-land-area で KML・GeoJSON ボタンを実際に押してファイルが保存される (2) storage.stats47.jp の robots.txt 反映後も OGP 画像・ブログ図が 200 のまま、市区町村ランキング Dataset (contentUrl の values.json) がリッチリザルトテストで読める (Allow が効かなければ robots.txt を直し publish-storage-robots.yml を流し直す) (3) 11-12 以降に Googlebot の POST を 24 時間数え、基準 262 件と比べる。

### [R2-VALUES-REUPLOAD-01] ランキングの values.json が生成のたびに全件送り直されるのを止める
タグ: [インフラ・計測] [種類:改善] [実行:対話] [起票:2026-11-11] [領域:データ]

- **事実 (2026-11-11 の調査)**: `packages/ranking/src/scripts/generate-ranking-values.ts:209-210` が毎回 `generatedAt` に現在時刻を書くので、中身が同じでもバイト列が変わる。`packages/r2-storage/src/scripts/diff-push-r2.ts:124-133` の送らない条件は manifest (`.local/r2-manifest/`) の size と mtime だけで、CI では manifest を復元する手順が無く毎回空になる。sync-snapshots run 41406400636 (11-02) は `アップロード対象: 14321`、data-refresh run 41803105336 (11-04) は `14328` だった。item.json には前回時刻を引き継ぐ仕組み (`carryTimestamp`。`packages/r2-storage/src/lib/operations/stable-snapshot.ts:52`) があるが、values には入っていない。
- **影響**: R2 の書き込み回数と、`storage.stats47.jp` の Last-Modified が毎回進むこと。GSC の登録には直接効かない (サイトマップの lastmod は item.updatedAt から作る)。
- **次 / 順序**: ① `generate-ranking-values.ts` で `readPublishedSnapshot` と `carryTimestamp` を使い、中身が同じならバイト列を同じにする ② `diff-push-r2.ts` に送る前の照合 (SHA か ETag) を足すか、values を exact manifest の経路へ移す。①②の後の初回だけは全件が再送される。
- **停止条件・禁止**: 検証のための sync-snapshots・data-refresh の本番実行は R2 への書き込みなので、オーナーの承認後。観測値の中身を変えない。
- **完了条件**: 中身が変わらない指標の values.json が次の全件実行で送られず (ログの送信件数で確認)、Last-Modified が動かない。
- **統合 (2026-11-13)**: `SYNC-SNAPSHOTS-MANIFEST-CARRY-01` をこのカードへ統合した。完了条件に含める: 連続 2 回の run で 2 回目の「アップロード対象」が全件でなく、中身が変わらない values.json が送られず Last-Modified が動かない (ログの送信件数で確認)。吸収分: manifest を actions/cache で run 間に持ち越すか R2 の ETag/SHA と照合するかを、cache 失効時に全件送りへ安全に degrade できるかで決める。R2-VALUES 側の generate-ranking-values.ts の generatedAt を carryTimestamp で固定し中身同一ならバイト列同一にする。本番実行の検証は R2 書き込みなのでオーナー承認後。


### [NOTE-LABOR-METRICS-ADD-01] 有給休暇と産業別賃金の県別指標を足し、note の雛形 2 本を作り直して公開する
タグ: [コンテンツ品質] [種類:改善] [実行:対話] [起票:2026-10-15] [領域:サイト]

- **経緯**: note の雛形 `A-laborwage-paid-leave-utilization-prefecture`・`A-laborwage-wages-by-industry-prefecture` は元になる県別ランキングが無く作り直せなかった (`NOTE-A-LABORWAGE-TEMPLATES-01`)。オーナー指示で指標を足してから作り直す。
- **済み**: 指標 `annual-paid-leave-11-days-or-more-ratio` (取得率ではない)・`information-communication-industry-annual-income`・`manufacturing-industry-annual-income`・`medical-welfare-industry-annual-income` を足し、PR #1136 (`a3ca33515`) で本番反映した。置き換えの記事 `a-annual-paid-leave-11-days-or-more-ratio` (カバー `NCI-00500`)・`a-manufacturing-industry-annual-income` (`NCI-00501`) は記事台帳で `published`。情報通信業は隣り合う年の順位相関が 0.55〜0.68 と振れが大きいので note にせず、製造業に置き換えた (情報通信業・医療福祉はランキングのみ)。
- **次**: 旧雛形 2 本 (`A-laborwage-paid-leave-utilization-prefecture`・`A-laborwage-wages-by-industry-prefecture`、記事台帳で `draft`) を記事台帳とカバー台帳から外す。
- **完了条件**: 2 本の雛形が記事台帳から消え、置き換えの記事が公開済み (または指標が組めず見送りを記録)。

### [DEPS-RENOVATE-01] Renovate GitHub App をインストールし、最初の月曜の翌日に PR が出ることを確かめる
タグ: [インフラ・計測] [種類:改善] [実行:ユーザー] [検証:gh pr list --state all --search "author:app/renovate"] [起票:2026-10-13]

- **背景**: improvements.md の期限 (2026-10-12) を超過し、改善台帳の上限 10 件を塞いでいたため、オーナー指示で 2026-10-13 に active から外した。効果は未確定 (effect ラベルなし)。
- **実測**: renovate.json はあるが未稼働。2026-09-07 は `gh pr list --search "author:app/renovate"` = 0 件。2026-10-11 の再実測は `gh pr list --state all --limit 200` で作者または head ブランチに renovate を含む PR が 0 件、`gh api repos/uruhayato373/stats47/branches --paginate` の 2 ブランチにも renovate を含むものは無い。
- **次 (オーナー)**: GitHub App のインストール。DEPS-MAJOR-SECURITY-01 は Dependabot security alerts で解消済みなので緊急度は低い。
- **完了条件**: インストール後の最初の月曜 (renovate.json の schedule は月曜 6 時前) の翌日に、上の検証コマンドで 1 件以上。無ければオーナーへ再依頼する。

### [R2-STORAGE-01] doboku-note-archive (8.98GB) の保持方針を決め、R2 容量の無料枠 (10GB) 超過に対処する
タグ: [インフラ・計測] [種類:意思決定] [実行:ユーザー] [起票:2026-10-13]

- **背景**: improvements.md の期限 (2026-10-12) を超過し、上限 10 件を塞いでいたため、オーナー指示で 2026-10-13 に active から外した。効果は未確定 (effect ラベルなし)。保持方針が決まるまで想定効果値を置けない。
- **実測**: `data/cloudflare/history.csv` の r2_storage_gb は 09-07 23.007 → 09-26 33.368 → 10-02 33.338 → 10-09 33.635 GB (直近 2 週は +0.27GB)。再現: `awk -F, '$1>="2026-09-26"{print $1,$13}' data/cloudflare/history.csv`。
- **次 (オーナー)**: doboku-note-archive の保持方針 (許容か削減か) を決める。
- **完了条件**: 削減なら削除量を根拠に `[target: -N GB]` と `[kpi: operating-cost]` 付きの別行で improvements.md に起票する。許容なら理由と見直し期日を cloudflare-cost-improvement の詳細ログに書く。
- **決定 (2026-10-26 オーナー)**: 削減する。次: `r2-maintenance.yml` の `mode: du` (dry-run) で doboku-note-archive の内訳を取り、削減範囲の案と削減量を出してオーナーが範囲を承認する。承認後に `[target: -N GB]` 付きの行を improvements.md へ起票する (このカードはそのとき削除)。

### [REFERENCE-EXPANSION-NOTE-01] 教材の分析企画から作った note の下書き 92 本を、意味のレビュー・R2 保存・公開まで進める
タグ: [コンテンツ品質] [種類:制作] [実行:別環境] [検証:npm run reference:expansion -- status --channel note] [起票:2026-10-13] [領域:商品]

- **状態 (2026-10-15)**: `b-ref-*` 92 本 (mh-a09 を含む) はすべて公開済みで、記事台帳 `data/note/articles.json` の `noteUrl`・`publishedAt` と展開記録 (note・済み 149 / 企画中 0) を更新済み。**完了条件の「企画中と未着手が 0」は満たした**。経過は `git log -p -- .claude/todo/backlog.md` で辿れる。
- **残り**:
  ① マガジン「都道府県ランキング｜情報通信」(`s47-ict`) が note に未作成 (`data/note/magazines.json` の `noteUrl` が null)。`b-ref-prc-a20`・`b-ref-prc-a24` はマガジンなしで公開した。オーナーが作成して URL を `data/note/magazines.json` に記録し、2 本をマガジンへ追加する。POST `/api/v1/my/magazines` は 201 でも一覧に現れなかった (カバー画像が必須の可能性。未検証)。同じく未作成の「国際・外国人」(`s47-international`) も要判断。
  ② 失敗回で残った空・途中の下書き (`n6c6e1708a2a1`・`n7f3aa1bb55b8`・`nb2b302a56c8c`・`n706d8699fcd7` ほか) を下書き一覧で照合して削除する (削除はオーナー)。
  ③ `b-ref-dev-a05`・`a09`・`a15`・`a40` は問いが求める指標 (子育て世帯の貧困率・通学時間と進学率・最新年の貯蓄・自家用車で通う人の割合) が無く、答えの一部を「このデータでは判断できない」としたまま公開した。指標を足すかを決める。
- **停止条件**: 検査と意味のレビューに通らない本文を保存しない。公開はオーナーの確認なしに行わない。
- **完了条件**: `reference:expansion -- status --channel note` の企画中と未着手が 0 (2026-10-15 に達成)。

### [REFERENCE-EXPANSION-BLOG-01] 教材の分析企画のうちブログが展開先の 215 件を、記事にする・結ぶ・見送るに振り分ける
タグ: [コンテンツ品質] [種類:制作] [実行:対話] [検証:npm run reference:expansion -- status --channel blog] [起票:2026-10-13] [領域:データ]

- **事実 (2026-10-13)**: 採択済みでブログを展開先に含む企画が 215 件、記録は 0 件。
- **担当**: blog-seo-strategist。`/plan-article-queue` の Step 0 で未着手を読み、topic-queue の候補に入れるか、公開中の記事 (`blog:<slug>`) と結ぶか、見送るかを決める。
  記事の制作は article-writer、公開前は blog-critic の PASS が要る (`blog-quality-standards.md`)。
  `REFERENCE-CONTENT-DRAFTS-01` の下書き 4 本は、公開した時点で該当企画を done で記録する。
- **入口**: `npm run reference:expansion -- pending --channel <展開先>` で未着手と結ぶ候補を出し、`record` で記録する (済みは公開中のページ ID だけ、見送りは理由が必須)。規約は `reference-source-standards.md`「分析企画の展開」。
- **停止条件**: 一次資料・R2 観測値で年度・単位・母集団を再検証できない企画は公開しない。書籍の本文・数値・図を使わない。
  指標が重なるだけの公開物を、問いを読まずに済みとして結ばない。
- **完了条件**: `reference:expansion -- status --channel blog` の未着手が 0。
- **統合 (2026-10-26 オーナー判断): `REFERENCE-CONTENT-DRAFTS-01`** 参考文献由来のテーマ企画と横断ブログ下書きを制作する
  - **本文の欠け (2026-11-13 確認)**: この統合のコミットで、元カード 11 行のうち 8 行 (字下げした続きの行と番号付きの手順) が落ちた。着手の前に `git show 47aa651d1^:.claude/todo/backlog.md` で `[REFERENCE-CONTENT-DRAFTS-01]` の全文を読み、今の実装と突き合わせて残りを決める。
  - **次**: blocked 3件はactiveな公開metricが出た時点で再判定する。ブログは各指標の年度・母集団を揃え、相関snapshot、チャート、本文、独立criticの順で品質ゲートへ進める。
  - **停止条件**: inactive metric、年度・母集団の不一致、相関snapshot不在、一次資料未確認、権利保留のいずれかがあれば公開へ進めない。
  - **完了条件**: blocked 3件はmetric公開可否が確定する。ブログ4本は一次資料・R2接地、SVG、quality gate、critic PASSを満たしてから`published:true`へ移す。
- **headless 執筆への接続案 (2026-10-28)**: 企画の「問い」を topic-queue の lane として流し、`write-blog-headless.ts` の prompt に渡せば、型B の機械的な指標の組 (`BLOG-TOPIC-PAIR-PER-CAPITA-01`) より題材の質を上げられる。内訳は kakei-marketing 74・capital-city-guide 47 (県ごとの名物を統計で確かめる 47 本)・prefecture-ranking-consumption 42・prefecture-deviation 24 ほか。

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

### [ACADEMIC-TEST-YEARS-01] 全国学力テストの都道府県別平均正答率が 2025 年の 1 年分しか無い
タグ: [コンテンツ品質] [種類:改善] [実行:対話] [起票:2026-10-13] [領域:データ]

- **事実 (2026-10-13)**: `academic-achievement-test-average-rate` の R2 values は 2025 年の 47 行だけ。教材の企画 `kakei-marketing-2015-a01-01`
  (「継続して上位に入る県はどこか」) の note 記事 `b-ref-kakei-a01-01` は、継続性を確かめられないと書いて 2025 年だけで答えている。
- **次**: 国立教育政策研究所の公表 (https://www.nier.go.jp/kaihatsu/zenkokugakuryoku.html) から過去の年の都道府県別正答率を取り込む (`data-provenance-standards.md` の 9 点セット)。
  取り込んだら記事の答えを複数年で書き直す。
- **完了条件**: 3 年以上の 47 都道府県の値が R2 にあり、記事が複数年で答えている。

### [NOTE-LEDGER-FOLLOWUP-01] note 記事台帳への移行の後片付けと、private R2 を含む照合の定期実行
タグ: [エージェント・SSOT] [種類:改善] [実行:対話] [検証:npm run note:article -- verify --deep] [起票:2026-10-13] [領域:商品]

- **背景**: 2026-10-13 に note 記事の正本を台帳 `data/note/articles.json` + R2 に移した (`84d6ac273`。規約 `.claude/scripts/note/catalog/README.md`)。残りは次のとおり。
- **やること**:
  1. **定期照合**: `npm run note:article -- verify` は private R2 も見るので S3 認証が要り、今はローカルでしか動かない。2026-10-26 から週次監査はローカルの `npm run weekly:audits` (note-circulation) で走るので、
     その台本 `.claude/scripts/management/weekly-audits/note-circulation.sh` に verify を足す (S3 認証は Mac の `.env.local` にある)。公開 R2 の配信確認 (`note:images:audit --verify-r2`) は既に週次にある。
  2. **R2 の取り残し**: どのマニフェストにも載らない `note/` 配下のオブジェクトを数える。既知の例は、公開 R2 の `note/a-maximum-temperature/` (vertical の無い旧パス・7 件)、
     有料記事の公開 R2 に残る旧 `public.json` (75 件・読み手なし)。削除するなら `r2-storage-design.md` の手順 (`r2-maintenance.yml` の allowlist) に従う。
     旧 `manifest.json` は `backfill-note-data-provenance.mjs` が読むので、`NOTE-PROVENANCE-BACKFILL-MANIFEST-01` が済むまで消さない。
  3. **控えの削除**: 移行前の作業コピーの控え `.local/note-migration-backup-20261013.tar.gz` (14MB・この Mac のみ) は、verify --deep が 2 回続けて合格したら削除する。
  4. **カバーの観測記録**: `verify-cover-refresh.mjs` の出力先を `data/note/cover-lifecycle-latest.json` に直した (以前は台帳に無いパスへ書いていた)。2026-11-04 に全件 (`--keys` なし) で流して 428 本 pass (済)。
- **完了条件**: 週次で private を含む verify が動き、取り残しの件数と扱いが決まり、控えを消している。

### [NOTE-BODY-RECOVERY-01] 本文が note.com にしか無い 73 本を R2 へ回収する
タグ: [エージェント・SSOT] [種類:改善] [実行:対話] [検証:npm run note:article -- status] [起票:2026-10-13] [領域:商品]

- **事実 (2026-10-13)**: 記事台帳で `body.store: "note-only"` の公開記事が 73 本 (`recovered-*` / `paid-*` の大半)。R2 にも git にも本文が無く、
  note.com が唯一の実体。リライト・カバー再生成・リンク修復の作業コピーを作れない。
- **次**: 所有者 API (`/api/v3/notes/<id>` の body。有料は所有者のセッションが要る) から本文を取り、作業コピー (draft.md + 画像) を組み立てて
  `body.store` を `r2-public` (無料) か `r2-private` (有料) に変え、`npm run note:article -- save <key>` で保存する。既存の
  `catalog/restore-from-notecom.py` の出力形式を確かめて使う。公開 API は大量取得で 403 になるので、1 回 10 本程度に区切る (`feedback_note_editor_autosave_drafts`)。
- **実測 (2026-11-05)**: 73 本はすべて無料の公開記事 (A 65 本・B 8 本) で、公開 API から読める。本文の図の台帳 (`data/note/body-figures.json`) は今は読むだけで、R2 へは保存していない。
- **再発防止 (2026-11-05 オーナー指示)**: 回収で 0 にした後、`note-only` を増やせないようにする。`articles.schema.json` の語彙から `note-only` を外し、公開済みの記事に `body.manifest` が無いと `note:catalog:validate` が止める。新規公開は `note:article save` の後でないと公開済みにならないことを、公開の経路で確かめる。
- **完了条件**: `note:article status` で `note-only` が 0、`note:article verify` が全件合格。語彙から `note-only` が消え、公開済みで本文が R2 に無い記事を検査が止める。

### [NOTE-PRODUCT-ZIP-ARCHIVE-01] note 有料記事の添付 ZIP (商品ファイル) を private R2 に保全する経路を作る
タグ: [収益化] [種類:改善] [実行:対話] [起票:2026-10-13] [領域:商品]

- **事実 (2026-10-13)**: `note:article save` は記事ディレクトリ (docs/31 の作業コピー) だけを保存するので、`.local/note-product-archives/P-NN-*.zip` や `.local/geo-products/` の添付 ZIP はこの Mac にしか無い (廃止した `publish-paid-note-private-r2.ts` は private R2 に `product/<name>.zip` として写していた)。
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

- **事象 (2026-10-12、v3-20261012-mac-r2 の実物と照合)**: パックの目的文 (`packs.ts`)・listing.md・LICENSE-ja.txt・見本画像・SOURCES.csv が中身と食い違っていた。目的文の収録外表現・PDF納品表記・見本の代表指標選択・長題名の折返しは 2026-10-24 に修正済み。ココナラは 2026-10-19 に撤退 (出品文は直さない)、note版13商品は公開済みなので、現在の添付版の品質を照合する。
- **残り**: ① SOURCES.csv の調査名欄に指標名が入る行 (職種別平均年収 `0003445758` の行で URL が社会・人口統計体系の案内ページを指す、P-01「腎不全による死亡者数」・P-05「患者調査 第37表…」など)、P-07「家賃差引の参考額（月額）」の加工式が「R2 から抽出」だけ (§3 の加工式要件)、P-04・P-11 の LICENSE が地方公務員給与実態調査の URL を 1 件しか載せない ② P-06 (教育機関限定)・P-07 (購入者本人のみ) の許諾範囲が想定購入者 (自治体・移住支援) と合わない ③ Office 実機確認。
- **追加の照合対象 (2026-11-12、固定ZIPのSHAと実物を確認)**: P-14は記事台帳 data/note/articles.json の題名が832指標・本文保存日が2026-11-04なのに対し、納品版台帳 data/products/note-pack-deliveries.json の固定ZIPは v4-20261024-mac-r2・685指標。現在の販売添付がどちらかを確定し、記事・台帳・LPの説明を一致させる。P-11の固定ZIPはCSVを含みXLSXは含まないが、商品定義の形式一覧にはCSVが無い。独立したPNG/SVGは地図各1枚であり、28指標すべてに独立画像が付くという説明にしない。
- **製造品出荷額の照合 (2026-11-12)**: 保存済み記事manifest・納品ZIP v3（12ファイル）・LP画像11枚のSHAを照合し、`products.landing-evidence` に参照を登録済み。LP地図は国土数値情報、同梱GeoJSONは国勢調査2020年の境界であることを明記した。公開noteの実添付がこの保存版と同一かは未検証。従来の7ファイル・画像2枚のレビューではv3を保証できないため、公開添付のSHA照合とv3の再レビューを行う。
- **次 / 停止条件**: 現在の販売添付と固定納品台帳を照合し、LPの収録形式・指標数・作成例を実物から導出する。版を確定できない箇所は推測で更新せず、該当商品の外部公開を止める。ローカル初稿の整備と目視は PRODUCT-LP-SHOWCASE-01 で進める。
- **完了条件**: 14 パックの目的文・listing・LICENSE・見本画像が実物と一致し、note 販売記事の「収録外」の断り書きが不要になる。

### [SNS-SOURCE-METADATA-01] SNS素材の仕上げで確認した期間・分母・単位の差異を指標定義と配信snapshotへ反映する
タグ: [コンテンツ品質] [種類:不具合] [実行:対話] [起票:2026-10-12] [領域:管理]

- **実測**: SNS #1145/#1146 のコンビニ販売額47県は e-Stat `0004032502` の 2025年1月の値に一致するが、git定義のsubtitleは年間販売額、配信itemは2025年度。`post-office-count-per-100km2` の原表 `#H06302` は「可住地面積100km²当たり」、`cleaning-shop-count-per-100k` の `#H06119` は「クリーニング業数・施設」。SNS側は是正済み。証拠はDriveの `SNS素材/instagram/1145/production-2026-10-12/` と原表メタ `getMetaInfo`（0000010208）。
- **実行順**: ① 指標configと時間粒度の取得・正規化契約を確認 ② 月間と年間の混在を防ぐfixtureを追加 ③ 原表の期間/単位に沿って派生snapshotを再生成し、サイト・県データブック・今後のSNS生成で表示が一致するか確認。
- **停止条件**: 正しい期間の原表、または可住地面積の分母が確認できなければ推測で値を変更しない。
- **完了条件**: 3指標の対象期間・分母・単位が原表と一致し、該当ランキングと県データブックの回帰検証を通過する。本番反映は既存の承認済み公開工程にまとめる。

### [NOTE-READINESS-20261024] note記事台帳の未公開レコード98件を整理する
タグ: [コンテンツ品質] [種類:制作] [実行:対話] [起票:2026-10-24] [領域:商品]

- **現在地**: 10/25、427公開・62未公開。元100下書きから25件公開・13件統合済み。証拠は `data/note/evidence/note-draft-publication-audit-20261024.json`。
- **方針 (10/24 の指示)**: 全件の公開を優先し、詳細な品質確認は後追い。実機未確認の記事は未確認と明示して公開する。P-01〜P-12 と P-14 の有料パックと Geo 検査キットは、ZIP・採用カバーを private R2 で照合して公開済み。QGIS 実機検証は後追い。
- **残件**: 販売54件（納品物未作成）、本文未作成6件、統計値未入力2件。現行パック証拠は `data/products/note-pack-regeneration-2026-10-24.json`。地図資料サービスは受付休止中。
- **カバー配信照合の残り**: P-03/P-04/P-08/P-09はnote上で公開済みだが画素差ゲートを僅かに超過しており、管理画面では反映待ちとして残す。値と理由は記事別監査の `publishedEvidence.coverPixelVerification`。公開画像と採用画像の目視差を確認し、必要ならカバーのみ再適用して再照合する。
- **公開後の図**: 人口密度の既存記事は本文一致で統合。未掲載の地図・上位図、欠けた箱ひげ図は既存記事に追補する。
- **停止条件**: 投稿先がstats47でない、本文・価格・有料境界・約束した添付物が存在しない、同題の公開記事がある場合は投稿しない。未確認操作は記事に明示する。
- **完了条件**: 残件を公開・配信照合するか、同題の既存公開記事へ統合し、未公開台帳を0件にする。作業コピーはR2照合後に削除する。

### [SIMPLIFY-FAILING-AUTOMATION-01] 1 週間で失敗が続く定期 workflow を、直すか止めるか 1 本ずつ決める
タグ: [インフラ・計測] [種類:不具合] [実行:対話] [起票:2026-10-11] [期日:2026-10-25] [領域:管理]

- **経過 (2026-10-11)**: 失敗率 100% の 4 本と高失敗率の workflow を調べ、SEO keyword・ブログ是正日次・アフィリエイト週次を直し、Gemini 日次は schedule を外した (develop `88b6d5c90`)。Security Scan と Develop Quality Gate は回復済み。Health Check は計測の auth_required と A8 の成果ゲートが直るまで落ち続ける。
- **次**: 直せないもの、`SIMPLIFY-PORTFOLIO-CUT-01` で止める系統のものは schedule を外して workflow を削除し、`docs/01_技術設計/06_自動化インベントリ.md` を同じ差分で更新する。定期実行は main の定義で動くので、修正の main マージ日から 7 日後に `gh run list --created ">=<マージ日>"` で失敗率を数え直す。
- **完了条件**: 直近 7 日の run で失敗率 50% 超の定期 workflow が 0 本。

### [SIMPLIFY-REVIEW-LOOP-EXECUTION-01] 週次レビューを「書く」から「Must を実行する」側へ寄せ、active 施策を上限 5 件まで減らす
タグ: [エージェント・SSOT] [種類:改善] [実行:対話] [検証:npm run docs:check] [起票:2026-10-11] [期日:2026-11-08] [領域:計画]

- **事実 (2026-10-11 実測)**: 配線は健全だが、W37〜W39 の Must が 1/3・0/3・0/3 (W40 は 2/2)、NSM 週次収益は全週「判定不能」だった。active 施策の削減・`[target:]` 欠落の処置・DG080 の是正は 10-11 に済み (`db4abc0a0`・`94e5b456a`)。週次 Must は 10 月の月次計画の「Must 2 件・🔴 の上から」で運用する。
- **次**: (1) improvements.md を月次で上限 5 件 (2026-10-27 に 10 から変更) まで削る (improvement-triage の排他 write)。削除基準は「`[target:]` が無い」「計器が止まっていて判定できない」。(3) `review-wiring.json` の requiredSections 6 を「サマリー / 計画 vs 実績 / 申し送り」の 3 に減らしてよいか、`/weekly-review` の所要時間を 1 回測ってから決める。
- **残り**: W41〜W44 の週次レビューで Must の達成率を読む。判定日 2026-11-08 (W44 のレビューの翌日)。
- **完了条件**: active ≤ 10、`[target:]` なし 0、4 週連続で Must ≥ 2/3。

### [UI-FIX-THEME-20261011] UI 是正: theme の週次 UI 検査の指摘 1 件を直す

タグ: [UI・UX] [種類:不具合] [実行:sweep] [検証:npx tsx .claude/scripts/page-quality/ui-findings.ts --assert-handled data/page-quality/backlog-batches/UI-FIX-THEME-20261011.txt] [起票:2026-10-11] [領域:サイト]

- **自動起票**: 週次のページ品質監査 (`quality-suite-weekly.yml` の page-quality job) の結果から `ui-findings.ts --sync` が作った。対象の一覧は `data/page-quality/backlog-batches/UI-FIX-THEME-20261011.txt`、状態は `data/page-quality/ui-findings-queue.json`。正典は `.claude/rules/page-quality-standards.md`「UI 指摘のループ」。
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

- **自動起票**: 週次のページ品質監査 (`quality-suite-weekly.yml` の page-quality job) の結果から `ui-findings.ts --sync` が作った。対象の一覧は `data/page-quality/backlog-batches/UI-FIX-SURVEY-20261011.txt`、状態は `data/page-quality/ui-findings-queue.json`。正典は `.claude/rules/page-quality-standards.md`「UI 指摘のループ」。
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

- **自動起票**: 週次のページ品質監査 (`quality-suite-weekly.yml` の page-quality job) の結果から `ui-findings.ts --sync` が作った。対象の一覧は `data/page-quality/backlog-batches/UI-FIX-RANKING-20261011.txt`、状態は `data/page-quality/ui-findings-queue.json`。正典は `.claude/rules/page-quality-standards.md`「UI 指摘のループ」。
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

- **自動起票**: 週次のページ品質監査 (`quality-suite-weekly.yml` の page-quality job) の結果から `ui-findings.ts --sync` が作った。対象の一覧は `data/page-quality/backlog-batches/UI-FIX-PREFECTURE-DETAIL-THEME-POPULATION-20261011.txt`、状態は `data/page-quality/ui-findings-queue.json`。正典は `.claude/rules/page-quality-standards.md`「UI 指摘のループ」。
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

- **自動起票**: 週次のページ品質監査 (`quality-suite-weekly.yml` の page-quality job) の結果から `ui-findings.ts --sync` が作った。対象の一覧は `data/page-quality/backlog-batches/UI-FIX-PREFECTURE-DETAIL-20261011.txt`、状態は `data/page-quality/ui-findings-queue.json`。正典は `.claude/rules/page-quality-standards.md`「UI 指摘のループ」。
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

- **自動起票**: 週次のページ品質監査 (`quality-suite-weekly.yml` の page-quality job) の結果から `ui-findings.ts --sync` が作った。対象の一覧は `data/page-quality/backlog-batches/UI-FIX-MUNICIPALITY-20261011.txt`、状態は `data/page-quality/ui-findings-queue.json`。正典は `.claude/rules/page-quality-standards.md`「UI 指摘のループ」。
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

- **自動起票**: 週次のページ品質監査 (`quality-suite-weekly.yml` の page-quality job) の結果から `ui-findings.ts --sync` が作った。対象の一覧は `data/page-quality/backlog-batches/UI-FIX-HOME-20261011.txt`、状態は `data/page-quality/ui-findings-queue.json`。正典は `.claude/rules/page-quality-standards.md`「UI 指摘のループ」。
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

- **自動起票**: 週次のページ品質監査 (`quality-suite-weekly.yml` の page-quality job) の結果から `ui-findings.ts --sync` が作った。対象の一覧は `data/page-quality/backlog-batches/UI-FIX-GEO-ANALYSIS-20261011.txt`、状態は `data/page-quality/ui-findings-queue.json`。正典は `.claude/rules/page-quality-standards.md`「UI 指摘のループ」。
- **スクショ (最新の週次)**: [mobile-390](https://storage.stats47.jp/state/page-quality/screenshots/latest/geo-analysis-mobile-390.png) / [desktop-1440](https://storage.stats47.jp/state/page-quality/screenshots/latest/geo-analysis-desktop-1440.png)。検査の詳細は `data/page-quality/metrics/LATEST.md`。
- **対象**:
  - `agent|geo-analysis` (Claude の確認)
    - [mobile-390/low] スマホ 1 枚目、各分析カード左側のサムネイル: サムネイルの地図が小さすぎ、内部のラベルが重なって読めません。何の分析か画像からは分かりません。 → サムネイルを判読できる大きさにするか、ラベルを省略した簡易図にする。
    - 経緯: 再発 (2026-10-11 の週次で再検出)
- **次**: 原因をコードから特定して直し、関係する unit test と `npm run design-system:check -w apps/web` を通す。Claude の指摘は描画前の撮影による誤検知もありうるので、その場合は撮影側 (`.claude/scripts/page-quality/lib/screenshots.ts`) を直すか by-design にする。
- **記録**: 直した指摘は `npx tsx .claude/scripts/page-quality/ui-findings.ts --mark-fixed <key> --note "<何を変えたか>"`、直さないと判断した指摘は `--mark-by-design <key> --note "<理由>"`。デザイン方針・画像制作・外部契約などオーナー判断が要る指摘は、決めてほしいことを書いた `[実行:対話]` のカードを backlog に起票してから `--mark-owner <key> --card <そのカード ID> --note "<何を決めてほしいか>"` (カードが閉じた後も残っていれば pending に戻る)。まとめて付けるときは `@data/page-quality/backlog-batches/UI-FIX-GEO-ANALYSIS-20261011.txt`。本番確認は release 後の週次監査が行い、再検出されたら pending に戻って再起票される。
- **停止条件**: 本番 deploy・R2 push をしない。判断できない指摘は pending のまま残し、このカードを消さない。
- **完了条件**: 検証コマンドが exit 0 (全対象が pending でなく、done 以外は理由 note 付き)。

### [UI-FIX-BLOG-ARTICLE-20261011] UI 是正: blog-article の週次 UI 検査の指摘 10 件を直す

タグ: [UI・UX] [種類:不具合] [実行:sweep] [検証:npx tsx .claude/scripts/page-quality/ui-findings.ts --assert-handled data/page-quality/backlog-batches/UI-FIX-BLOG-ARTICLE-20261011.txt] [起票:2026-10-11] [領域:サイト]

- **自動起票**: 週次のページ品質監査 (`quality-suite-weekly.yml` の page-quality job) の結果から `ui-findings.ts --sync` が作った。対象の一覧は `data/page-quality/backlog-batches/UI-FIX-BLOG-ARTICLE-20261011.txt`、状態は `data/page-quality/ui-findings-queue.json`。正典は `.claude/rules/page-quality-standards.md`「UI 指摘のループ」。
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

### [BLOG-LINK-410-REMAP-01] ブログ本文の 410 になったランキングへのリンク 5 件を置き換える
タグ: [コンテンツ品質] [種類:不具合] [実行:sweep] [検証:node .claude/scripts/blog/fix-broken-internal-links.mjs] [起票:2026-10-10] [領域:サイト]

- **状態**: 残っていた 3 記事の 410 リンク (`elderly-population-ratio`・`foreign-population-per-100k`・`population-density-habitable`) は、2026-10-28 にオーナー承認で article.md を R2 へ上げて置き換えた (置換表 `.claude/scripts/blog/data/broken-link-remap.json`)。`fix-broken-internal-links.mjs` は毎回 R2 を読むように直した (`.local/blog-linkfix/out` には 7 月の修正版が約 50 本残っているので、丸ごと `--src` に渡さない)。`data/blog/internal-link-audit.json` (2026-10-30) は `broken: 0`。
- **残り**: リンク監査 #752 は 2026-10-26 から Issue を作らないので手で閉じる (2026-11-03 時点で OPEN)。
- **完了条件**: 週次監査の internal-links で 410 が 0 件 (2026-10-26 から Issue は作らないので #752 は手で閉じる)。
- **統合 (2026-10-26 オーナー判断): `BLOG-LINKROT-01`** 内部リンク是正後の coverage とブログ→ranking 回遊を判定する (SITE-LINKROT-01 統合済み)
  - 再開条件: 是正デプロイ後に `internal-link-audit-weekly.yml` 最新 run で壊れ 0 を確認できた時。手順: soft 404 タイトル込みで壊れ 0 を検証 → STRICT smoke 200 → GSC coverage を前後比較 → 壊れは本文・生成設定・live 描画の三層に分類 (`[kpi: search-clicks, site-circulation-rate]`)。

### [NOTE-COVER-DELIVERY-VERIFY-01] 文字込み生成カバーの配信検証をnote側の減色に対応させる
タグ: [コンテンツ品質] [種類:不具合] [実行:対話] [起票:2026-10-14] [領域:商品]

- **証拠**: 文字込みimagegen画像はnoteの公開PNGがpalette化され、画素平均差 (MAE) が旧閾値を超えて停止する。停止例は `data/note/evidence/note-cover-refresh-ledger-{a4bc4308a8b6dcce,ac5bd1a2f0af0d79,52ad7c58985bff1e,01cc1c41fc2c1556}.json` (MAE 2.8〜4.3、`NCI-00307` は大差チャネル1.4866%で1%ゲートに停止)。いずれも原寸/320pxの文字・構図・切り抜き、配信SHA、本文保全を個別に照合して重複POSTせず復旧した。一時的な一律閾値緩和は戻した。
- **担当・順序**: image-prompt-curator / note-manager。① この6件の元画像・公開配信画像で減色の再現条件を確認 ② 文字欠落・別画像・色反転・切り抜きの負例を揃える ③ 自動判定と配信SHA単位の目視確認を共通手順にする。
- **停止条件**: 差の原因を説明できない画像や負例が通る判定は採用しない。応答済みPOSTを再送しない。一律の閾値引き上げだけで解決しない。
- **完了条件**: 正常な減色は判別でき、負例は止まり、目視確認は採用元SHA・配信SHA・公開URLに束縛される。関連テストと既存の本文保全・アカウント照合テストが通る。
- **2026-11-04 追加の実例**: 旧形式126本の差し替えで `18-pr-magazine-rewrite` が MAE 5.11 (大差 0.23%) で停止した。公開画像と採用版を並べて同じ画像と確認し、POST は再送せず journal を手で `verified` に閉じた (`note-cover-refresh-ledger-34fc2c90884b49dc.json` の `inspection`)。99本の総当たり (9,702通り) では、同型カバーの `b-ref-prc-a48`/`a50` の取り違えが判定を通った。負例に同型の別記事を入れる。

### [THEME-CPI-503-01] テーマ品質監査で consumer-prices ページが 503・タイムアウトになる
タグ: [UI・UX] [種類:不具合] [実行:対話] [起票:2026-10-10] [領域:サイト]

- **事象**: テーマ品質監査 #1069 (2026-10-05) で `/themes/consumer-prices` (幅 1440) が HTTP 503・h1 の待機タイムアウト・チャート 2 つ欠落 (theme-cpi-heatmap・theme-cpi-profile)。
- **次**: 本番の該当 URL を Googlebot UA で取得して今も 503 かを確かめる。続いていれば Workers の CPU 制限 ([CF-CPU-SURGE-01]) との関係を見る。一時的なら次回監査で解消を確認する。
- **完了条件**: 次のテーマ品質監査で consumer-prices の表示検査が通る。
- **2026-10-23 確認**: Googlebot UA で 3 回とも 200 (3.6〜6.8 秒)、CPI の R2 は 47 県・13 年分ある。次のテーマ品質監査で #1069 が閉じるかを見る。

### [PERF-RANKING-LCP-03] ランキングページの LCP がベースラインより悪化したまま

タグ: [インフラ・計測] [種類:不具合] [実行:対話] [検証:node .claude/scripts/psi/... の history.csv で ranking/total-population,mobile の LCP < 9,347ms] [起票:2026-09-07] [期日:2026-10-05] [領域:管理]

- **owner**: Claude Code (調査・実装) / オーナー (デプロイ承認)
- **状態**: `data/psi/history.csv` の `ranking/total-population,mobile` は 2026-10-09〜10-30 の全計測で LCP 4,801〜7,545ms と、ベースライン 9,347ms (2026-08-04) を 3 週以上下回っている。2026-09-25 に LCP 要素の背景タイルを CARTO から地理院タイルへ切り替えた (commit 871096e46) ので、それ以前の推移とはつなげない。タイル描画を TopoJSON 取得から分離する修正は `4ee6b5641`。どの変更が効いたかは未記録。経過は `git log -p -- .claude/todo/backlog.md`。
- **次**: 改善の要因 (topology fetch の分離か、タイル配信元の切り替えか) を LCP 要素と変更日で確かめて記録し、カードを閉じる。
- **停止条件**: 単発の PSI 値で改善と判定しない (日次計測はばらつくため 3 週以上の推移で見る)。デプロイはオーナーの明示承認まで行わない。ベースライン 9,347ms は 2026-08-04 の実測値で、これを更新して達成扱いにしない。
- **完了条件**: `ranking/total-population,mobile` の LCP が 3 週連続でベースライン 9,347ms を下回る。悪化要因が topology fetch でなかった場合は、実測で特定した真因と対策を本カードへ記録してから閉じる。

### [SNS-TRACE-YT-LEGACY-01] YouTube の URL の無い投稿 42 行と content_key 不明の 2 本を Studio で確定する
タグ: [SNS・マーケ] [種類:改善] [実行:対話] [検証:npm run sns:trace:check] [起票:2026-10-09] [領域:SNS]

- **事象**: 投稿台帳を「1 id から全部たどれる」形へ補完した (2026-10-09・`backfill-post-trace.mjs`) が、YouTube の posted 行 42 件 (id 83〜429、2026-03 投稿) は URL も本文も無く、外部 ID をたどれない。指標の時系列に残る未知の動画 ID 94 本のうち公開中は 7 本だけで、残り 87 本は削除済みか非公開 (oEmbed が返らない)。追加した公開動画 7 本のうち `bi2UqZu_vOQ`・`z0cfD_rCgEI` は説明欄にランキング URL が無く content_key が空。
- **次**: オーナーが YouTube Studio の動画一覧 (非公開・削除済みを含む) と照合し、42 行に `post_url` を入れるか、存在しない投稿なら `deleted_at` を記録する。2 本の content_key をタイトルから決める。書き込みは store 経由 (`sns-posts-store.cjs`)。
- **完了条件**: `npm run sns:trace:check` の「外部 ID をたどれない posted 行」から YouTube が消える。

### [CRITIC-PATTERN-CHART-TEXT] critic の指摘「図と本文」が 4 本の記事で繰り返した。writer の規約か gate に入れる
タグ: [コンテンツ品質] [種類:改善] [実行:対話] [起票:2026-10-09] [領域:サイト]

- **事象**: 直近の窓で、blog-critic が型「図と本文」(`chart-text`) の BLOCK/MAJOR を 4 本の記事で 4 件出した。critic の目視でしか見つかっていない。例:
  - 2026-10-08 bonito-catch-prefecture: bonito-two-poles.svg は、既にチャート bonito-ranking.svg(上位5)に載っている静岡81,295トンと宮城19,828トンの2本の棒を再掲しただけで、読者に新しい情報を足さない(冗長・図表重複)。
  - 2026-10-08 cc-estat-09-radar-prefecture: 62 行と 423 行の 2 枚の図（tokyo-radar-findings.svg / tokyo-kyoto-overlay-findings.svg）は generateFindingsCardSvg が描いた番号付きテキストの要…
  - 2026-10-08 fish-catch-vs-consumption-prefecture: 54行目・87行目の散布図。
  - 2026-10-08 bonito-catch-zero-prefectures-gap: 新しい主題 (0トンと行なしの年ごとの入れ替わり) を示す図がありません。
- **次**: 機械で判定できるなら quality-gate に検査を足す (公開済み記事で誤検知 0 件を確かめてから blocker にする)。できなければ `.claude/rules/blog-quality-standards.md` と article-writer の指示に書く。
- **完了条件**: 検査か規約が入り、`.claude/config/critic-finding-types.json` の `chart-text` に `promotedAt: "<入れた日>"` を書いた。
- 起票元: `critic-findings-digest.mjs` (台帳 `data/blog/critic-findings/`)

### [YEAR-COV-AREA-AXIS-01] 年カバレッジ監査が、都道府県が分類軸にある表などの取得条件を再現できず、8 指標で値のある年を 0 と数える
タグ: [コンテンツ品質] [種類:不具合] [実行:対話] [検証:npx vitest run packages/ranking/src/scripts/__tests__/audit-estat-year-coverage.test.ts] [起票:2026-10-08] [領域:データ]

- **事実 (2026-10-08)**: `audit-estat-year-coverage.ts` は 8 指標 (dairy-cattle-count・inpatient-rate-per-100k・fishery-household-sex-age・fishery-management-orgs・fishery-workers-coastal-offshore・fishing-port-count-by-type・fishing-vessel-crew・fishing-vessel-tonnage-class) で値のある年を 0 と数えるが、R2 の values.json には値がある。dairy と inpatient は都道府県が分類軸にある表 (`areaAxis`) で、監査の取得はこれを再現していない。漁業の 6 指標の原因は未調査。
- **済 (2026-10-08)**: 値のある年が 0 件のときは新しい判定 `no-sample-values` (判断できない) にした。テストで固定し、修正を外すと落ちることを確かめた。8 指標の記録は `no-sample-values` に変わった。
- **次**: 監査の取得を取り込み (`page-data-batch.ts`) と同じ条件 (`areaAxis`・軸の pin・合算) にそろえる。共通の取得関数があればそれを使い、無ければ取り込み側から切り出す。漁業の 6 指標は取得結果を見て原因を確かめる。
- **完了条件**: 8 指標で、監査が R2 と同じ年に値を数え、`no-sample-values` が 0 件になる。

### [DATA-WAGE-TEACHER-COVERAGE-01] 賃金構造基本統計の教員年収ランキングが教員全体の約 5% しか映していないことをページに示すか、公開をやめるかを決める
タグ: [コンテンツ品質] [種類:不具合] [実行:対話] [起票:2026-10-08] [領域:サイト]

- **事象 (2026-10-08 に e-Stat API で実測)**: `school-teacher-annual-income` (表 0003445758・cdCat02=1192) の推計労働者数は全国で約 3.3 万人で、小・中学校教員数の約 4.9%。県ごとの平均が数十人の推計に基づくため、1 位・最下位と平均年齢が毎年入れ替わる。調査範囲は「5人以上の民営事業所」と「10人以上の公営事業所」(厚生労働省「令和5年賃金構造基本統計調査 調査の概要」https://www.mhlw.go.jp/toukei/itiran/roudou/chingin/kouzou/z2023/dl/gaiyo.pdf、2026-10-08 取得)。なぜ 5% しか映らないかは公式資料で未確認なので、理由を断定しない。
- **決定と実施 (2026-10-26 オーナー)**: 教員年収は公開を続け、注記を出す。`data/metrics/school-teacher-annual-income.ts` の note に推計教員数・顔ぶれの入れ替わり・順位が公立教員の給与水準を表さないことを書いた。
- **残り**: ① 同じ表の職種別 40 指標 (例: `high-school-teacher-annual-income` = cdCat02 1194) で、推計労働者数と実際の就業者数の比を同じ方法で出し、比が小さい指標の扱い (推計人数の併記・note・`isActive:false` + 410/301) をオーナーが決める。公開をやめる場合は `ranking-publisher` の手順 (KNOWN/SITEMAP/R2) に乗せる ② 推計 10 人未満の県年 (2021 岩手は「労働者数」0・平均年齢 86.5 歳で 39 位) を順位から外すか注記するか ③ 注記の本番反映の確認。
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
- 起票元: `critic-findings-digest.mjs` (台帳 `data/blog/critic-findings/`)

### [CRITIC-PATTERN-CORRELATION] critic の指摘「相関の読み方」が 3 本の記事で繰り返した。writer の規約か gate に入れる
タグ: [コンテンツ品質] [種類:改善] [実行:対話] [起票:2026-10-08] [領域:サイト]

- **事象**: 直近の窓で、blog-critic が型「相関の読み方」(`correlation`) の BLOCK/MAJOR を 3 本の記事で 3 件出した。critic の目視でしか見つかっていない。例:
  - 2026-10-07 dairy-cattle-count: L25・L46・L58・L71 の「相関係数約0.3、逆向きではなく弱い正の関係、だから人口の多さだけでは説明できない」は、人口と乳用牛の総数どうしを比べた結果です。
  - 2026-10-07 it-industry-concentration: 「テレワークの節」の IT産業×テレワークの順位相関 0.73 が、人口との関係と区別されていません。
  - 2026-10-07 vacant-housing-vs-aging: 「山形県はその残りの部分が最も大きく表れた県であり」(決定係数の段落) は、順位差と回帰残差を混同しています。
- **次**: 機械で判定できるなら quality-gate に検査を足す (公開済み記事で誤検知 0 件を確かめてから blocker にする)。できなければ `.claude/rules/blog-quality-standards.md` と article-writer の指示に書く。
- **完了条件**: 検査か規約が入り、`.claude/config/critic-finding-types.json` の `correlation` に `promotedAt: "<入れた日>"` を書いた。
- 起票元: `critic-findings-digest.mjs` (台帳 `data/blog/critic-findings/`)

### [CRITIC-PATTERN-READER-VALUE] critic の指摘「読者価値」が 4 本の記事で繰り返した。writer の規約か gate に入れる
タグ: [コンテンツ品質] [種類:改善] [実行:対話] [起票:2026-10-08] [領域:サイト]

- **事象**: 直近の窓で、blog-critic が型「読者価値」(`reader-value`) の BLOCK/MAJOR を 4 本の記事で 4 件出した。critic の目視でしか見つかっていない。例:
  - 2026-10-07 cc-estat-20-publish: 連載の約束 (Part 19 の「毎週ほったらかしで最新化」) が最終回で閉じていません。
  - 2026-10-07 dairy-cattle-hokkaido-monopoly: 型Aの必須視点「なぜ上位か (地理・産業構造)」が、L25・L42・L57 の3か所で「確かめられていません」と保留され、答えが無いまま終わっています。
  - 2026-10-07 sixth-industry-direct-sales: アーキタイプ A の必須視点「なぜ上位・下位か」が、確かめられないという記述で止まっています。
  - 2026-10-08 frozen-gyoza-spending-prefecture-gap: アーキタイプ A の必須視点「なぜ上位/下位か」が、推測の一般論にとどまる。
- **次**: 機械で判定できるなら quality-gate に検査を足す (公開済み記事で誤検知 0 件を確かめてから blocker にする)。できなければ `.claude/rules/blog-quality-standards.md` と article-writer の指示に書く。
- **完了条件**: 検査か規約が入り、`.claude/config/critic-finding-types.json` の `reader-value` に `promotedAt: "<入れた日>"` を書いた。
- 起票元: `critic-findings-digest.mjs` (台帳 `data/blog/critic-findings/`)

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
- 起票元: `critic-findings-digest.mjs` (台帳 `data/blog/critic-findings/`)

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
- 起票元: `critic-findings-digest.mjs` (台帳 `data/blog/critic-findings/`)

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
- 起票元: `critic-findings-digest.mjs` (台帳 `data/blog/critic-findings/`)

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
- 起票元: `critic-findings-digest.mjs` (台帳 `data/blog/critic-findings/`)

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

### [SEO-CTR-CANDIDATES-01] 取りこぼしクリックの大きい 7 ページを search-growth に渡し、食い合いの 2 組を先に確かめる
タグ: [コンテンツ品質] [種類:改善] [実行:対話] [起票:2026-10-07] [期日:2026-10-25] [領域:サイト]

- **GSC案07 / P2（次に着手）**: implementation-neededの8提案と既存7ページを照合し、担当・対象・完了gateを確定する。未実装を公開待ち・承認済みと扱わない。
- **GSC案26 / P2（次に着手・CTR内優先1）**: 道の駅など表示実績のあるページのtitleをpage×queryと実SERPで検討し、1〜2ページから検証する。
- **GSC案27 / P2（次に着手）**: 選んだページの冒頭に答え・対象年・単位を示し、必要な順位表をHTMLで読めるようにする。既存図表との重複は増やさない。
- **GSC案28 / P2（次に着手）**: 公衆電話のrankingを総数・一覧・推移、blogを理由・地域差へ分け、相互リンクする。検索語の重複だけで悪影響を断定しない。
- **GSC案29 / P2（次に着手）**: 国勢調査ハブから40代未婚割合など答えのあるrankingへ案内し、リンク先・表示文言・到達を検証する。
- **GSC案37 / P2（次に着手）**: 実期間・検索語・端末を固定して比較し、類似未変更ページ・順位・季節性・同時変更を併記する。少標本で因果や効果を確定しない。
- **入力**: `GSC-CTR-DECOMPOSE-01` の 2026-10-07 の表と PV 計画 (`PV-PLAN-REVIEW-2026Q4-01`) の CTR 打ち手。
- **済み (〜2026-10-20)**: 食い合いの確認 (公衆電話は食い合いあり・出生率は無し、10-08 の GSC page × query)、公衆電話・出生率の ranking の seoTitle 変更、ブログ 4 本 (公衆電話・道の駅・高校2年男子身長・健康寿命) と第 2 弾 4 本・第 3 弾 4 本の seoTitle 変更は本番反映済み。search-growth で `ctr-opportunity::/ranking/public-phone-count` と `striking-distance::/ranking/total-fertility-rate` を W43 に承認済み (反映日 2026-10-20、計測日 14 日 = 11-03・28 日 = 11-17・56 日 = 12-15、`npm run search-growth:measure -- --candidate <ID>`)。
- **残り**: ① ブログ 4 本 (と第 2・3 弾) の search-growth 承認を W44 以降の枠 (週 2 件・人が承認) で記録する。② `/survey/census` は title を変えず、ハブから `unmarried-ratio-{male,female}-40-44` のランキングへのリンクを目立たせる。③ 出生率の ranking→blog リンクは `RELATED-ARTICLES-TIEBREAK-01` で扱う。④ 効果観測は `SEO-TITLE-CTR-EFFECT-01` (improvement-triage の排他)。⑤ `data/seo/latest-report.json` の pendingPublication 8 件 (全件 `implementation-needed`) を既存 7 ページと照合し、重複提案を各 1 件の担当・対象・完了 gate へ落とす。⑥ 7 ページの手順が固まったら、GSC 2026-W41 で順位 4〜15 位・表示 500 以上の 197 本 (`data/gsc/snapshots/2026-W41/pages.csv` を impressions ≥ 500 かつ 4 ≤ position ≤ 15 で抽出) を表示の多い順に `/search-growth` へ渡す (一括変更はしない)。
- **停止条件**: title の一括置換をしない。食料自給率はデータの年を直す (`DATA-FOOD-SELF-SUFFICIENCY-MAFF-01`) まで title を変えない。
- **完了条件**: 7 ページそれぞれに「変えた / 見送った」と理由が記録され、変えたページの変更日が search-growth の台帳にある。

### [RELATED-ARTICLES-TIEBREAK-01] ランキングの関連記事が同点のとき記事 ID のアルファベット順で選ばれ、その指標を主題にした記事が押し出される
タグ: [UI・UX] [種類:不具合] [実行:対話] [起票:2026-10-20] [領域:サイト]

- **事象 (2026-10-20 実測)**: `/ranking/total-fertility-rate` の関連記事 3 本に、出生率そのものを扱う `fertility-rate-prefecture-gap` (「出生率 ランキング」で順位 1〜1.5) と `total-fertility-rate` が出ない。`packages/data-configs/src/content/navigation.ts` の推薦が同点を `a.id.localeCompare(b.id)` で切るため (`navigation.json` の `links` に明示の関係を足しても同点のまま)。影響は指標を共有する公開記事が 4 本以上ある 194 ランキング (GSC 2026-W41 の表示 36,671)。
- **2026-10-20 実装 (未デプロイ)**: 同点を「一致数 ÷ 記事が使う指標数」の高い順で切り、それでも同じなら ID 順にした (テスト `navigation.test.ts`)。全公開ページ 26,172 件の上位 3 本を変更前後で比べ、変わったのは 1,416 件 (area-theme の変化の大半は同じ記事の並び替え)。**未達**: 出生率のランキングには `total-fertility-rate` の記事が入ったが、`fertility-rate-prefecture-gap` (指標 2 つ) は指標 1 つの `cc-estat-07-birthrate-line` に負けて入らない。
- **次**: 編集者が `data/content/navigation.json` の `links` で明示した関係に加点する案を検討する (モデルの推測で記事の主題を決めない)。本番反映は次のデプロイ (他の変更とまとめて 1 回)。
- **停止条件**: 全ランキングの推薦が変わるので、変更前後の上位 3 本の差分を全件出してから本番に出す。デプロイは他の変更とまとめて 1 回。
- **完了条件**: `/ranking/total-fertility-rate` の関連記事に `fertility-rate-prefecture-gap` が入り、差分一覧で意図しない入れ替わりが無いことを確かめた。

### [LIVABLE-COMPOSITE-CHART-DATA-01] 住みやすい県ランキングの総合スコアの図に、1 人当たり県民所得のデータが紐づいている
タグ: [コンテンツ品質] [種類:不具合] [実行:対話] [起票:2026-10-20] [領域:サイト]

- **事象 (2026-10-20 実測)**: `/blog/livable-prefecture-composite-ranking` の図 `data/composite-ranking` は本文では 8 指標の総合スコアを示すのに、R2 の `composite-ranking.json` と `.source.json` は `per-capita-kenmin-shotoku-h27` (1 人当たり県民所得) を指していた。
- **済 (2026-10-23)**: 図を 8 指標の総合スコア (R2 values から再計算・`kind: calculated`) に作り直し、図・data・source.json・本文の 1〜3 位 (福井 79.9・富山 77.4・島根 72.0) を一致させた。quality-gate pass・critic PASS で R2 へ公開済み (記事固有の背景も作成)。
- **残り**: ① 本番への反映はデプロイ待ち (改稿は prerender なので R2 だけでは出ない)。反映後に本番で 1〜3 位を確かめる ② 旧 `radar-comparison.*` は `top3-radar.*` に改名したので R2 に古い 2 ファイルが残る (削除は承認を得て) ③ **決めること**: 「治安」軸の `violent-crime-per-100k` は名前と違って値が粗暴犯の実数 (人口で割っていない)。軸名を「粗暴犯の少なさ」に直し感度分析 (上位 3 県は不変) を本文に足したが、人口当たりに替えるかは未決 (替えると title・seoTitle の 79.9 点が変わる)。指標の名前と値の食い違い自体も直す必要がある。
- **完了条件**: 図・data json・source.json・本文の 1 位〜3 位が一致し、`quality-gate.mjs` が pass。title 変更 (`SEO-CTR-CANDIDATES-01` の候補) とは別に直す。

### [MANUFACTURING-ZONE-CHART-LINEAGE-01] 製造業の記事の工業地帯の図に元データが無く、京浜工業地帯の 57.7 兆円が公開値から再現できない
タグ: [コンテンツ品質] [種類:不具合] [実行:対話] [起票:2026-10-20] [領域:サイト]

- **済み (2026-10-23)**: `/blog/manufacturing-aichi-dominance` の工業地帯の図を 2023 年の構成都府県の合計 (`kind: calculated`・範囲の出典は帝国書院の解説) で作り直し、京浜 57.7 兆円は埼玉・千葉・東京・神奈川の合計で再現、全 9 区分が公開値の合計と一致した。critic PASS で R2 へ公開済み。
- **残り**: ① 産業構成比の積み上げ図と節は、元の e-Stat 表 0003448099 をローカルで取得できず (app id は CI 専任) 削除した。CI で再現して戻すか決める ② critic の MAJOR 1 件: subtitle「効率王者・大分」と要約図の「効率」を「1人あたり」に直す (title・subtitle を変えない指示で据え置き中) ③ quality-gate の VALUE_MISMATCH が「県名の直後の工業地帯の合計値」を県の値として誤検知する (warning 3 件。`FACTUAL-CHECK-CROSS-METRIC-RANK-01` と同じ根)。
- **完了条件**: 図・data json・source.json・本文の値が公開値の合計と一致し、`quality-gate.mjs` が pass。

### [CONTENT-FOOD-TRIVIA-01] 検索クリックの 31% を占める食の消費量の雑学で、需要がありまだ無い品目のランキング・ブログを足す
タグ: [コンテンツ品質] [種類:制作] [実行:対話] [起票:2026-10-07] [領域:サイト]

- **前提 (W40 実測)**: クエリが分かるクリックの 31% が食べ物の消費量・特産。2026-10-07 の突き合わせで需要上位 40 品目すべてに公開中のランキングがあり、足りないのはページではなく、**同じ品目の複数ページに表示が割れていること**と分かった。
- **方針**: ② 品目ごとに「入口にするページ」を 1 つ決め、他のページからリンクを集め、title の切り口を分ける ③ 綴り違い・旧 URL のブログ (`/blog/bonito-catch-perfecture`・ranking key と同名の `/blog/fresh-udon-soba-consumption-quantity` など) が表示を受けていれば 301 か canonical で入口へまとめる (`apps/web/src/config/blog-redirects.ts`) ④ 需要上位品目のランキングの title・description を定義を崩さない範囲で検索語に寄せる (例: 清酒に「日本酒」を併記) ⑥ 2025 年報の取り込みは `KAKEI-EXPANSION-02`。新しい品目のページは、需要があってページが無い品目が見つかったときだけ作る。
- **② の入口と足りないリンク (2026-10-08・GSC 28 日)**:
  | 品目 | 入口 | 足りないリンク |
  |---|---|---|
  | うどん | `/ranking/soba-udon-dining-consumption-expenditure` | 入口 → 生うどん数量・干しうどん数量のランキング / 生うどん数量のランキング → 入口と blog / 食文化地図 → 入口 |
  | カツオ | `/blog/bonito-catch-prefecture` | 入口 → かつお購入数量のランキング (本文中の「食べる側」の一文とリンクでつなぐ。図に入れて rankingRefs にしない) / 購入数量のランキング → 入口 |
  | かつお節 | `/ranking/katsuobushi-consumption-quantity` | ランキング → blog `katsuobushi-expenditure-ranking` |
  | ぎょうざ | `/blog/frozen-gyoza-spending-prefecture-gap` | 双方向にある。足さない |
  - ranking の「関連記事」は blog snapshot の `rankingRefs` と相関記事から自動で出る (`RelatedArticlesCard.tsx`)ので、どちらも**記事の書き換えと公開** (contents/blog の送り箱 → publish-blog。オーナー承認) で足す。
- **⑤ ぎょうざの品目**: `gyoza-frozen-consumption-expenditure` (`cdCat01: 010920070`) は「371 ぎょうざ」で、総務省「家計調査 収支項目分類及びその内容例示」2020年改定版により冷凍品は 370 冷凍調理食品へ除外される。metric の subtitle・note は直した (`62a5fe9e1`)。**残り**: blog 本文の「冷凍餃子・持ち帰りの支出を数える」7 か所を「持ち帰りの生・焼きぎょうざ (冷凍品は別品目の冷凍調理食品)」に直して公開し (承認)、ランキングの AI 解説の冷凍の記述も直す。key と slug は URL なので変えない (変えるなら 301 を同時に入れる)。
- **停止条件**: 需要の証拠 (検索表示) が無い品目は作らない。47 都道府県分の薄い記事を一括で作らない。家計調査は県庁所在市の世帯の値であり県全体ではないことを表題と本文で崩さない。
- **完了条件**: 品目の突き合わせ表が残り、追加したページそれぞれの 4 週後の検索表示とクリックが記録されている。

### [RANKING-MAKING-OF-LINK-01] 閲覧の多い雑学ランキングに「このランキングの作り方」の 1 行を置き、ノウハウ記事への導線を測る
タグ: [収益化] [種類:改善] [実行:対話] [起票:2026-10-07] [領域:商品]

- **経緯**: `KNOWHOW-PRODUCT-PILOT-01` の「雑学の読者から拾う導線」案 (a)。「年収1000万円」のような事実でない収益の主張の代わりに、作り方への興味という事実に基づく入口を試す。
- **済み (2026-10-19・未デプロイ)**: ①② を実装した。GSC 2026-W41 の 28 日クリック上位の食の雑学 5 件 (納豆支出・米数量・カップ麺支出・アイスクリーム支出・緑茶数量) の出典の欄の下に `/blog/cc-estat-01-setup` への 1 行を置いた (`RankingMakingOfLink.tsx`、対象は `RANKING_MAKING_OF_KEYS`)。クリックは共通の監視が `nav_surface=ranking_making_of` で数える。
- **次**: まとめての本番デプロイのあと、③ 4 週のクリック数と、連載から note の有料ノウハウへの遷移を記録する。
- **停止条件**: 広告のように見せない (PR 表記の要らない、サイト自身の記事への 1 行に留める)。全ランキングに一括で出さない。
- **完了条件**: 4 週の導線クリック数が記録され、続ける・広げる・やめるの判断が `KNOWHOW-PRODUCT-PILOT-01` に書かれている。
### [BLOG-DUPLICATE-AUDIT-01] 同じ主題・同じ数値のブログが 2 本ずつ公開されている組を洗い出し、1 本にまとめる
タグ: [コンテンツ品質] [種類:不具合] [実行:対話] [起票:2026-10-07] [領域:サイト]

- **GSC案16 / P3（条件確認後）**: 新たな統合対象は同じ問い・情報・役割の重複を本文とpage×queryで確認してから採用する。用途の違うrankingとblogは役割分担を先に試す。
- **済 (2026-10-08〜09)**: 生うどん・そば外食・教員年収の 3 組は残す側へ固有の節を移して公開し、`apps/web/src/config/blog-redirects.ts` の 301 で統合済み (本番で 301 と all.json からの除外を 10-23 に確認)。`export-blog-snapshot.ts` は 301 の slug を `app/blog/all.json` から除く。
- **手順 (1 組ずつ・この順を入れ替えない)**: ① 残す記事へ統合元にしか無い節を移し、quality-gate と critic を通して送り箱から公開する (公開はオーナー承認) ② 公開を確かめてから `blog-redirects.ts` に `"<統合元>": "<残す>"` を足す ③ 本番で `curl -sI https://stats47.jp/blog/<統合元>` が 301 と残す URL を返すことを確かめる。
- **残り**:
  - 出生率: `fertility-rate-prefecture-gap` (28 日 1,374/3) を残し `total-fertility-rate` (49/0) をまとめる候補。節の比較は未着手。
  - 食文化マップ: `udon-soba-food-culture-prefecture-map` の「下位5県の構造」の論証が `fresh-udon-soba-consumption-prefecture-gap` とほぼ同じになった (blog-critic 報告)。GSC (map 73・fresh 359) を見て、map を 301 でまとめるか、地図と外食の対比に絞って差別化するかを決める。
  - 機械照合 (2026-10-08・title / seoTitle に同じ数値が 2 つ以上) の 22 組。本文を読んでから組ごとに判断する。まとめる候補: 牛肉 `beef-consumption-quantity` / `beef-consumption-prefecture-gap`、乳用牛 `dairy-cattle-count` / `dairy-cattle-hokkaido-monopoly`、テレワーク `engineer-telework-prefecture` / `telework-gap-tokyo-6x` / `telework-rate-tokyo-gap`、病床利用率 `hospital-bed-utilization-map` / `general-hospital-bed-occupancy-rate`、納豆 `natto-consumption-expenditure` / `natto-consumption-east-west-divide`、ソフトウェア技術者 `software-engineer-salary-prefecture-gap` / `software-engineer-income-gap`、小麦粉 `wheat-flour-consumption-prefecture` / `wheat-flour-consumption-food-culture-gap`、空き家と地価 `vacant-housing-rate-vs-standard-price-change-rate-commercial` / `vacant-housing-vs-land-price`、県民所得 `prefectural-income-gdp-ranking` / `per-capita-income-gap` (指標が違う可能性)。切り口が違うので残す候補: `fertility-fiscal-nexus` / `udon-soba-food-culture-prefecture-map` / `inpatient-rate-aging-burden` / `minimum-wage-1000yen-prefecture` と `minimum-wage-increase-rate-prefecture-gap` / `tuna-consumption-medical-expense-correlation` / `vacant-housing-aging-correlation` / `black-tea-income-gap`。この数値照合は丸めが違う組を取りこぼす。
- **停止条件**: 主題が同じでも切り口が違う記事 (相関・地域別・県別シリーズ) はまとめない。301 は 1 組ずつ本番で確かめる。
- **完了条件**: 重複の組の一覧と、それぞれの処置 (301・残す理由) が記録され、301 が本番で効いている。

### [SNS-REFERRAL-MEASURE-01] X・Instagram・Threads からサイトへの送客を流入元別に毎月測り、SNS 領域の構えを判断する材料にする
タグ: [SNS・マーケ] [種類:改善] [実行:対話] [起票:2026-10-07] [領域:SNS]

- **前提 (実測)**: GA4 の Organic Social は 28 日 (09-06〜10-03) で 98 セッション・248 PV (サイト全体の 0.6%)。
- **済 (2026-10-19)**: ① 週次の GA4 取得 (`fetch-ga4-snapshot.mjs` の `MEASUREMENT_REPORTS`) に `referral-sources` を足し、日本の Organic Social と Referral を流入元・メディア・チャネル別に `data/ga4/snapshots/<週>/referral-sources.csv` (rolling28d) へ保存する。自分の商品 (Kindle・note 本文) からの流入は `PRODUCT-REFERRAL-MEASURE-01` が `product-inbound.csv` で別に取る。
- **次**: ② 月次レビューで、媒体ごとの送客セッションと投稿数を並べる ③ 2 か月分がそろったら、SNS 領域を「維持」のままにするか、送客の多い媒体だけ投稿を増やすかを決める。
- **統合 (2026-10-26 オーナー判断): `SNS-SITE-FUNNEL-01`** 投稿からサイトへの流入の経路 (プロフィールのリンク・投稿の誘導・UTM) を見直し、既存の計測 (GA4 の参照元・`nav_click`) で前後を比べられる形にする。
- **停止条件**: 送客が測れないうちに投稿を増やさない。インプレッションやいいねを送客の代わりにしない。
- **完了条件**: 媒体別の送客が 2 か月分記録され、SNS 領域の構えの判断が領域の台帳 `data/business/domain-stances.json` に反映されている。

### [NOTE-FREE-DEFAULT-01] note の雑学・ランキングの有料記事を無料に戻し、送客の変化を前後で測る
タグ: [収益化] [種類:改善] [実行:ユーザー] [起票:2026-10-07] [領域:商品]

- **決定 (2026-10-07 オーナー)**: note は無料が基本で、有料はノウハウ商品だけにする (収益化戦略 §3.3・§3.5、`docs/30_note記事企画/note戦略.md`)。メンバーシップは作らない。ランキング型 (A シリーズ) の有料記事 47 本は通算 (〜2026-09-11) 売上 ¥0。
- **基準値 (無料化の前)**: 対象 47 本の閲覧は 28 日 (09-07〜10-04) で計 804 (`data/note/dashboard/latest.json`)。`sessionSource = note.com` は 28 日 (09-10〜10-07) で 380 セッション・1,140 PV・エンゲージ 284、着地ページの上位は `/ranking/annual-sunshine-duration` 82 など 85 種。再現: `node .claude/scripts/metrics/ga4-query.mjs --start 2026-09-10 --end 2026-10-07 --dims landingPage --metrics sessions,engagedSessions --filter 'sessionSource==note.com' --limit 100`。
- **第 1 陣 (2026-10-08 に note.com で無料に切り替え済み)**: `n2ed31d721531` 財政健全化法の4指標・`nba8bf272cc2b` 初婚年齢・`n67de9d45c426` 趣味・娯楽時間 (3 本で 47 本の閲覧の 74%)。カタログ `stats47-note.ts` と `data/note/note-published-urls.json` も `is_paid: false`。`r2_access` は `private` のまま (本文が非公開 R2 にしか無く、`public` にすると OGP 生成とギャラリー監査が欠落扱いにする)。本文を公開 R2 へ移すのは R2 への書き込みなので、オーナーの承認を取ってから行い、そのとき一覧も `public` にする。
- **次 (実行順)**: ① 4 週後 (2026-11-05 以降) に同じ指標を取り、無料にした 3 本の閲覧と送客を、まだ有料の残り 44 本・上の着地ページと比べる ② 結果を見て、閲覧の多い順に少数ずつ無料に戻す (note へのログインは人手。カタログ `.claude/scripts/note/catalog/` の有料・無料も同じ差分で直す) ③ D シリーズの有料データセット記事 5 本 (通算売上 ¥0) は、§3.4 の行政資料 pilot の販売面として残すか無料にするかを、同じ観測のあとに決める。ノウハウ記事は対象外。
- **停止条件**: 全記事を一括で変えない。ノウハウの有料記事・マガジン (Claude Code の実務) は有料のまま。note への反映はオーナーのログインを経てから。
- **完了条件**: 47 本の有料・無料が決定どおりになり、カタログと note.com が一致し、無料化の前後 4 週の閲覧と送客が記録されている。

### [KDP-LEDGER-AUTO-01] 認証付き計測で取った KDP の月次レポートを、CI が販売台帳へ自動で記録する
タグ: [インフラ・計測] [種類:改善] [実行:対話] [検証:npm run products:sales --workspace=@stats47/product-factory -- validate] [起票:2026-10-07] [領域:管理]

- **済み**: 台帳の証拠に保管庫キー `vault:kdp/monthly/month-<n>` と復号したレポートの stats47 行の内容ハッシュを認め、`collect.mjs` が書籍別の集計を載せ、record job の `summarize.mjs` が同じ書籍・月の行が無いときだけ足す (値の食い違いは上書きせず action_required、明細の無い本を 0 で埋めない。`fb6c2b288`、main に入っている)。2026-11-03 に計測の範囲 `coverage` を足し、明細の無い本も「計測済み・0 件」と読めるようにした (8・9 月は 22 冊を記録済み、`PRODUCT-REFERRAL-MEASURE-01`)。KENP の列 (`kenpRead`) を足した。
- **残り**:
  ① KDP の再ログイン (10-31 の取得は `auth_required`)。そのあと CI の KDP 月次取得で台帳に行が自動で増えることを確かめる。
  ② 既読ページ (2026-10-27 オーナー決定): 2026-08〜10 の分を KDP の月次レポートから一度だけ埋め、以降は自動記録に乗せる。`data/business/pilot-board.json` の KDP の「既読ページ」指標 (今は `unrecorded`) を台帳から読む形に変える (`KDP-EXPANSION-01` の pilot 判定がこれで判定不能になっている)。
- **停止条件**: 生のレポート (全アカウントの行を含む) と個人情報を公開リポジトリに置かない。stats47 の ASIN 以外の行を台帳に入れない (`kdp-reports.mjs` の `kdpAsinMap` と同じ照合を使う)。
- **完了条件**: マージ後の CI の KDP 月次取得のあとに、明細のある本の行が台帳へ自動で増え (明細の無い本は行を作らない)、`products:sales -- validate` が PASS し、週次の KPI ツリーで `paid-purchases` の KDP 分が判定不能でなくなる。

### [KNOWHOW-PRODUCT-PILOT-01] AI×公的統計の実務ノウハウ商品を1つ選び、note の販売面で4週の実売を確かめる
タグ: [収益化] [種類:制作] [実行:対話] [起票:2026-10-07] [領域:商品]

- **前提 (実測)**: 支払いの実績は note の通算売上 ¥900 だけで、3 件とも Claude Code を使う実務記事 (¥300×3)。有料マガジンは 公務員×Claude Code (¥1,980) / e-Stat×Claude Code (¥1,480) / D3.js 配色 (¥500)。stats47 の Claude Code 連載は 28 日 25 PV で、集客は note の検索・推薦と外部チャネルに置く。回収経路 3 つの位置づけは収益化戦略 §3.5。
- **読者の課題 / HARM**: AI と公的統計を仕事や個人開発に使いたい (A: 技能・仕事の達成)。支払う理由は、調べて試す時間を短くできること。
- **次 (実行順)**: ① note ダッシュボードの全期間で、有料マガジン 3 つと有料の実務記事の閲覧・購入を棚卸しし、売れた 3 件がどこから読まれたかを確かめる ② 1 テーマを選ぶ (第一候補は売れた系統の「e-Stat × Claude Code の初期設定・DB 連携・ローカル実行」) ③ 既存マガジンの改訂か単品かを決め、価格と制作工数の上限を固定する ④ オーナー承認後に公開し、4 週の閲覧・購入数・売上を販売台帳 (`npm run products:sales --workspace=@stats47/product-factory`) に記録する。
- **関係 (2026-10-19 追加)**: ② のテーマ選定の入力として、`KNOWHOW-QA-BOARD-01` が公開の質問掲示板から 4 週集めた質問のテーマ別集計 (同じテーマ 3 件以上) を使う。集計が出るまでは売れた系統 (e-Stat × Claude Code) を第一候補のまま保つ。既存の商品を読者ごとの階段 (自治体の財政比較・地図づくり) に並べ、段ごとの導線を測る作業は `NOTE-PRODUCT-LADDER-01` が持つ。
- **関係**: 行政職員向けなら `ADMIN-STAT-PILOT-01` と読者が重なる。聞き取りの場では支払い意思を仮定の質問で聞かず、聞き取り票の Q8（仕事のための自腹購入・組織の購入経路）と Q9（庁内の生成 AI 利用環境）で事実を確かめる。
- **自治体ペルソナ向けの候補（2026-10-17 オーナーと壁打ち）**: (A) 生成 AI × e-Stat で類似団体比較表を作る手順（庁内で許される範囲の AI 利用。売れた唯一の系統と、元自治体職員という信頼を重ねる。既存マガジン「公務員 × Claude Code」¥1,980 の改訂でも出せる）を第一候補とする。(B) 議会答弁・計画の現状分析に使う統計の探し方と出典の書き方（AI を使わない。「e-Stat 7 つの技」の記事は職場からの読者が多く、Teams 経由の共有もある）は、Q9 で庁内の AI 利用ができない人が多い場合の切り替え先にする。(C) 介護保険事業支援計画（第 10 期）の現状分析のデータ集めは、`ADMIN-STAT-PILOT-01` のデータ商品検証へ回し、ノウハウとしては後回しにする。開発者向けの第一候補（e-Stat × Claude Code の初期設定）と並行して出してよい（2026-10-28 に「複数商品を同時に出さない」を廃止。収益化戦略 §7）。
- **雑学の読者から拾う導線 (2026-10-07 検討)**: 「サイト管理者が独立して年収1000万円」を入口にする案は採らない (事実でない収益の主張は収益化戦略 §8 に当たる)。代わりに計測付きで 1 つずつ試す: (a) 雑学ランキングの末尾に「このランキングの作り方 (Claude Code × e-Stat)」の 1 行 (`nav_click` 4 週) (b) 年収・所得の統計そのものを雑学として出す (c) 運営の収支を実数で公開する連載。
- **停止条件・禁止**: 「稼げる」「収益化できる」を売り文句にしない (stats47 自体の収益実績がまだ無く、証拠のない収益の主張は収益化戦略 §8 が広告でも扱わない情報商材と同じになる)。成果として書くのは取得日と取得方法を示せる計測値だけ。note への公開・価格変更はオーナー承認と人手ログインを経てから。
- **テーマ候補 (D) (2026-10-24 オーナーと壁打ち)**: note の有料記事運用の自動化 (Claude Code × Playwright)。e-Stat × Claude Code と並行して出してよい。有料にするのは「公開後も壊さず回す」検査と事故の事例 (投稿の自動化そのものは無料で出回っている)。出せる実数は doboku-note の運用 (原稿 959 本・マガジン 109、配布 PDF 72/72 の貼り直し、2026-10-23 取得) で、売上の多寡を成果として書かない。規約上、高頻度の操作を避ける手順を必ず含め、他人のアカウントで代行する形は採らず買った人が自分の PC で動かす形に限る。入口は kazu-note の無料記事で反応を測ってから有料にするか決める (kazu-note リポ `memos/kazu-note_公務員ノート展開計画.md`)。
- **テーマ候補 (E) (2026-11-11 オーナーと検討)**: 計画書の根拠づくり (創業計画書・持続化補助金の売上の根拠を、家計調査 × e-Stat × Claude Code で作る)。売れた系統を使い道で切り直す。カードは `KNOWHOW-SUBSIDY-EVIDENCE-01`、入口は `KNOWHOW-FREE-COURSE-ENTRY-01`、採否は `SUBSIDY-EVIDENCE-STRATEGY-01`。
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

- **位置づけ**: 新しい商品を増やすカードではない。既存の在庫を読者ごとの階段に並べ、段と段の間の導線 (記事末尾の案内 1 行) を揃えて、どの段で読者が落ちているかを測る。分担: テーマ選定と単品の実売判定 = `KNOWHOW-PRODUCT-PILOT-01`、質問の収集 = `KNOWHOW-QA-BOARD-01`、雑学有料記事の無料化 = `NOTE-FREE-DEFAULT-01`、行政資料の新商品 = `ADMIN-STAT-PILOT-01`、地図の橋渡し記事 = `NOTE-HOWTO-SERIES-01` / `NOTE-HOWTO-OWNER-CHECK-01`、stats47 → データ集の導線 = `PRODUCT-FUNNEL-DEPLOY-01`。
- **前提 (実測 2026-10-19)**: 在庫は note 有料 151 本 (`data/note/articles.json`)・Kindle 12 冊 (`data/products/kdp/listings.json`)・ココナラ 14 件 (`config/coconala-listings.json`)。購入の記録は note 通算 ¥900 と Kindle 2 冊 ¥413 だけで、note の 10-05 以降と KDP・ココナラの 10-01 以降は「¥0」ではなく「未計測」として扱う (`NOTE-DASHBOARD-COLLECT-01` / `MEASUREMENT-AUTH-RESTORE-01`)。集客は stats47 の `/blog/local-government-debt-burden` (W41 28 日 368 クリック)、note の財政記事 `s47-fiscal` (各 700〜1,600 閲覧)、KML 記事 (3,226 閲覧) が中心。
- **読者 / HARM**: 階段 1 は自治体職員・議員 (自分の団体の財政を似た団体と比べる。A)、階段 2 は統計を地図にして資料に入れたい作り手 (A)。支払う理由は収益化戦略 §3.4 の「選定・整形・照合・編集用成果物」に限り、公開データのまとめ直しだけには値段を付けない。
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
  | 2 編集用素材 | 都道府県パック (比較表＋時系列＋塗り分け地図。`DATA-PACK-BUNDLE-01`)。地図だけの単品 `ppt-japan-map-assets` は出さない (2026-11-05 オーナー決定) | ¥980 / ¥2,980 | 作り替え中 | 段 1 の末尾 |
  | 3 上級 | マガジン `koumuin-gis` (QGIS・メッシュ分析 3 本。通算閲覧 34・売上なし) | ¥2,980 | 公開中 | 変えない |

  「47 都道府県・市区町村の KML / GeoJSON セット (¥500)」は 2026-10-19 の検討で外した。stats47 が同じ形式を無料で配っており、§3.4 の「公開データをまとめ直したことだけを支払う理由にしない」に当たるため。
- **次 (実行順。各段に完了の判定と停止条件を付ける)**:
  1. **基準値を記録する [S・1 回]** — 前提は `NOTE-DASHBOARD-COLLECT-01` で note ダッシュボードの取得が戻っていること (戻らなければ、以降の判定はすべて「判定不能」になる)。階段 1・2 の各記事の直近 28 日の閲覧と売上、マガジン 4 つの購入、GA4 の `sessionSource = note.com` の着地 (再現: `node .claude/scripts/metrics/ga4-query.mjs --dims landingPage --metrics sessions --filter 'sessionSource==note.com'`) を、このカードに 1 表で書く。**完了**: 表がある。
  2. **[済 2026-10-28] 階段 1 の段 0 → 段 1 の導線** — 7 本の「次に読む」の先頭枠を `13-fiscal-peer-no-code` のカードに差し替え、台帳の `nextBestArticle` も揃えた。4 週の判定の基準日は 2026-10-28。**残り**: データ集・元データのカードが残っており「末尾の案内を 1 つにする」は未了 (公開記事の編集は人手のログインとオーナー承認を経てから。カタログ `data/note/articles.json` も同じ差分で直す)。
  3. **段 1 を無料にする [S・人手・2026-11-09 以降]** — `NOTE-FISCAL-PEER-PUBLISH-01` が公開日 + 28 日 (11-09) の売上比較を記録するまで、価格を変えない。記録後、`13-fiscal-peer-no-code` を無料にし、末尾に段 2 (`12-fiscal-peer-comparison`) への案内 1 行を置く。**完了**: note 上で無料になり、カタログの `isPaid` が false。
  4. **階段 2 の段 0 → 段 1 の導線 [S・人手]** — `h-howto-mymaps-kml` が公開されたら (制作・公開は `NOTE-HOWTO-SERIES-01`)、KML 記事の末尾をそこへの案内 1 行にし、H-01 の末尾を段 2 への案内にする。**完了**: 2 本の末尾がつながっている。
  5. **段 2 は `DATA-PACK-BUNDLE-01` に移した (2026-11-05)** — 地図は単品で出さず、都道府県パックに入れる。境界は N03 を使わない (`MUNI-DATA-LICENSE-CHECK-01`)。このカードでは段 1 の末尾からパックへの案内 1 行だけを持つ。
  6. **段 3 の新規テンプレ [M・条件付き]** — 次のどちらかを満たすまで作らない。(a) 段 1 を無料にしてから 4 週で、段 1 の閲覧が 100 以上、かつ段 2 か段 4 の購入が 1 件以上。(b) `ADMIN-STAT-PILOT-01` の聞き取りで「類似団体との財政比較」が担当者 2 人以上に共通する繰り返しの業務だと確かめられた。中身の案は、自分の団体を選ぶと人口規模の近い団体が並ぶ Excel 1 枚と手順 (データは社会・人口統計体系 `0000020204` の市町村財政指標)。**着手前の確認**: ① 財政力指数が 2021 年度までなので、総務省の最新年度との差が 2 年以上なら年度を題名に明記するか作らない (`DATA-QUALITY-LOOP-01` の基準) ② 「類似団体」を総務省の類型で区分するか人口規模で代用するかを原典で決める。生成と検査は product-factory (`catalog-validator`・`LICENSE-ja.txt`・`SOURCES.csv`)。**完了**: 検査を通り、サンプルがあり、オーナーが承認した。**停止**: 着手の条件を満たさない、または年度が古いまま更新できない。
  7. **4 週後に判定する [S・1 回]** — 段ごとに「閲覧 → 次の段の閲覧 → 購入」を 1 表にし、下の数値と比べる。
- **判定の数値 (先に固定)**: 階段ごとに、4 週で段 2 以上の購入が合計 3 件。落ちる段の見分け方は 2 つ。段 1 の閲覧が 4 週で 100 未満なら、入口 (段 0 の末尾の案内) の問題。段 1 の閲覧が 100 以上あって購入が 0 件なら、商品か価格の問題なので、`KNOWHOW-QA-BOARD-01` の質問の集計でテーマを見直す。段 0 の閲覧が、末尾を変える前の 28 日より 2 割以上減ったら (無料化した記事を除く)、末尾の変更を戻す。
- **やらないこと**: 雑学記事に有料の案内を置く。1 記事に案内を 2 つ以上置く。新しい有料ランキングやメンバーシップを作る。下書き 72 本をまとめて公開する。段 3 のテンプレ以外の新規商品を作る。ココナラと note を相互にリンクする (規約を確かめるまで)。「稼げる」を売り文句にする。値下げで売上を作る (価格は判定のあとに 1 回だけ見直す)。
- **月次計画との関係**: 手順 1〜5 は既存在庫の並べ直しで新規制作に当たらない。手順 6 を始めるかは `/monthly-plan` で判断する。note への公開・価格の変更は、どれもオーナー承認と人手のログインを経る。
- **工数の上限**: 手順 2〜4 は各 30 分以内、手順 5 は 3 時間以内、手順 6 は 1 日以内。超えそうなら止めて報告する。
- **完了条件**: 2 本の階段の各段に、変更日・4 週の閲覧・次の段の閲覧・購入 (または判定不能とその理由) が記録されている。そのうえで、続ける・段を差し替える・階段ごとやめる、のどれかをオーナーが決めた。結果を `KNOWHOW-PRODUCT-PILOT-01` と `02_収益化戦略.md` §3.5 へ引き渡した。

### [AMAZON-ASSOCIATE-PILOT-01] Amazon アソシエイトと Kindle 自社本への導線の効果を測り、続けるか広げるかを決める
タグ: [収益化] [種類:改善] [実行:対話] [起票:2026-10-07] [期日:2026-11-15] [領域:アフィリエイト]

- **配線 (2026-10-07 本番反映、PR #1099)**: (1) 商品詳細から Amazon への Kindle リンクにタグ `stats47-22` と `rel=sponsored` (2) ランキング右レールに記事を収録した Kindle 本の行 (`nav_surface=ranking_product`) (3) Kindle 本の無いブログ記事末に `CATEGORY_BOOKS` (`apps/web/src/features/ads/constants/related-books.ts`) の一般書籍 1 冊 (`link_position=related-books`)。開始日・判定日・現在値は `data/business/pilot-board.json` と管理画面 `/strategy/pilots`。
- **交絡**: デプロイ日 (10-07) と AdSense 再開 (10-11) を境界にし、それ以前の窓とは比べない。
- **次**:
  1. 判定日 2026-11-04 に、オーナーが Amazon アソシエイトのレポートの値を販売台帳 (`data/products/sales-ledger.json`) へ証拠付きで 1 回だけ記録する (自動収集は作らない。2026-10-27 オーナー決定)。記録したら `pilot-board.json` の「Amazon の売上」指標を台帳から読む形に変える。口座 `stats47-22` が有効かもこのとき確かめる。
  2. 28 日の GA4 の `nav_click` (`ranking_product` / `blog_product`)・`affiliate_click` / `affiliate_impression` (`related-books`)・`cta_click` (`product_kindle`) を取り、物販クリックは食の雑学ページとそれ以外に分けて出す。KDP の売上と照合する。
  3. `CATEGORY_BOOKS` を他の vertical へ広げるなら、Amazon で実在 ASIN と書名を確かめてから足す (推測の ASIN を書かない)。
  4. 続けると決めたときだけ、置き場所ごとのトラッキング ID を 2 つ作り、ID 別レポートに ASIN が出るかを 1 回確かめてから配線する (規約上は可。2026-11-03 確認)。
- **完了条件**: 28 日分のクリック数と、Amazon / KDP の売上 (取れなければ取れない理由) を記録し、継続・拡大・撤退のどれかをオーナーが決めた。

### [BLOG-BG-PIPELINE-CONSOLIDATE-01] ブログ背景の経路を Codex の記事固有背景 1 本にまとめ、背景の不足を push 前に止める
タグ: [コンテンツ品質] [種類:改善] [実行:対話] [検証:node .claude/scripts/blog/quality-gate.mjs <slug>] [起票:2026-10-07] [領域:サイト]

- **事象 (2026-10-07)**: 背景の出どころが 3 系統 (git の記事固有背景・旧 Codex カタログ・R2 だけにある Gemini 背景) あり、背景を選ぶ処理が `generate-blog-thumbnails.ts` と `generate-blog-thumbnails-cloud.ts` に別々に書かれている。案内が Gemini 経路を示していたため Gemini で作り直す依頼を誤って push した (正典は Codex の記事固有背景)。
- **済 (2026-10-07〜08)**: quality-gate が `check-blog-background.ts` (判定は `lib/blog-background-status.ts`) で、送り箱の記事に今の内容に合う背景が無ければ Codex の手順を示して止める。R2 の HEAD メタデータ (`stats47-sha256`) だけが欠けた背景は `generate-blog-thumbnails.ts` が exit 21 を返し、`blog-auto-publish.yml` はその記事だけを skip する。
- **次 (実行順)**:
  2. 集約: 背景を選ぶ処理 (git の記事固有背景 > 旧 Codex カタログ > 公開済み AI 背景の再利用) と案内文を `lib/blog-background-status.ts` にまとめ、`generate-blog-thumbnails.ts` と `-cloud.ts` から呼ぶ (`backgroundRecord` は移し済み)。
  3. 撤去: 未移行の記事を `blog-images:codex queue` (Mode B) で git の背景へ移し、R2 の Gemini 背景が 0 件になったら Gemini の client・cache・ビジュアルカタログ・`gemini-image-run.yml` の blog 部分と規約の Gemini の記述を同じ差分で消す。旧 Codex カタログも記事固有背景へ寄せる。
  - 検討: 左 55% の文字用の余白不足やチャートの描き込みを、`check:blog-images` / `check-blog-background.ts` は寸法と形式しか見ず検出できない (2026-10-07 にオーナーが目視で 3 枚発見)。余白を機械で測る検査を足すか決める。2026-08-31 に上げたほかの背景にもメタデータの欠落がありうる (未調査)。
- **停止条件**: 3 の画像生成は Codex が要る (クラウド環境では codex MCP が接続できない)。生成はオーナーのローカルで回す。
- **完了条件**: 1 は背景の無い送り箱の記事で quality-gate が止まることをテストで固定。2 は背景の選択と案内文の実装が 1 か所。3 は `queue` の targets が 0 で、リポジトリに Gemini の生成コードが無い。

### [BLOG-TUTORIAL-GATE-GAPS-01] 手順解説記事 (cc-estat 連載) で quality-gate が誤って数える・照合できない 3 か所を直す
タグ: [コンテンツ品質] [種類:不具合] [実行:対話] [検証:node .claude/scripts/blog/quality-gate.mjs <slug>] [起票:2026-10-07] [領域:サイト]

- **済み (2026-10-21)**: ① `quality-gate.mjs` のインライン svg 判定はコードブロックとインラインコードを除くようにした (公開 616 記事で誤検知・見逃しの増減 0)。③ 値の照合を本文が書いた精度で行うようにした (`claimTolerance`。「約」などで丸めを断っているときは従来の ±5%)。② `blog-svg-chart-standards.md` §6-5 に描画スクリプトの置き場 (`.claude/scripts/blog/article-renderers/<slug>/`) と restore の書き方を足した。
- **残り** (`article-factual-check.mjs` / `quality-gate.mjs` の誤検知・検出漏れ。2026-10-07〜08 の書き直しで writer・critic が報告):
  - cc-estat-04-aging-heatmap の 2 枚 (作業用の一時スクリプトで描いた図) を repo のスクリプトから作り直す (公開記事の図の差し替えになる)。svg-builder にサンキー型が無いので、cc-estat-13-agri-sankey は積み上げ棒で代用している。
  - ④ 「秋田県の3位から青森県の46位まで」のような範囲の順位を INVERSE_RANK_MISMATCH と誤検知する (physical-therapist-annual-income-prefecture-gap)。
  - ⑤ 県名の直後の派生値 (2 県の差や目減り額) を、その県の別の指標の値と取り違えて VALUE_MISMATCH を出す (real-disposable-income-reversal の「1,856円」「22,681円」)。
  - ⑥ NG_PATTERN「title 「N位」だけで終わる」の正規表現 (`/^title:\s*"[^"]*\d+位[^"]*"/m`) が「N位」を含むタイトルをすべて止め、名前と判定がずれている (「4位なのに空き家は37位」も止まる)。
  - ⑦ 「N位の県」の順位と「◯%」の割合の誤りを検出しない (school-teacher-annual-income で 42位・3.8% の注入が pass)。計算型の図 (kind `calculated`) の割合は data JSON にあるので照合の対象に足せる。計算に使った入力 (総人口など) が data/ に無いと照合できない (calculated の JSON に入力の元値を持たせるか検討)。
  - 「倍」は単位として照合していない (比率の言い換えが多いため、別途判断)。
- **完了条件**: 1 と 3 の修正がテストで固定され、2 が規約に書かれ cc-estat-04 の図が repo のスクリプトから作り直せる。

### [BLOG-REFRESH-DERIVED-SCATTER-01] 図の年の取り直しスクリプトが、計算で作った散布図を取り直せない
タグ: [コンテンツ品質] [種類:改善] [実行:対話] [検証:node --test .claude/scripts/blog/lib/__tests__/refresh-chart-year.test.mjs] [起票:2026-10-07] [領域:サイト]

- **済み (2026-10-28)**: `refresh-article-data-years.mjs` が scatter / derived-scatter / calculated / ranking-join / composite の散布図を、点と R2 の値の一致で軸の指標と年を決め、点・見出しの年・pearsonR・除外県を作り直すようにした (`lib/refresh-chart-year.mjs`・テスト 25 件)。共通の年にそろえると古い年へ戻る軸があるときは、軸ごとの最新年を使う。
- **残り**: 同じ指標の 2 年比較 (school-teacher-annual-income-prefecture-gap の手作りの `kind: calculated`) と、点が R2 と一致しない calculated (manufacturing) は手作業のまま。formula の文章に残る古い年は手作業の一覧に出る。最新年が指標ごとに違う組 (空き家率 2023 年 × 65 歳以上人口割合 2025 年。R2 の `app/correlation/by-ranking-key` に vacant-housing-rate と ratio-65-plus の組が無い) を相関 snapshot に持たせるか、記事ごとにランキングの値から作り直す運用を規約にするかは未決。
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

- **状態**: `cc-estat-18-cache-r2`・`cc-estat-19-skill-pipeline` は Pages → Workers (OpenNext)、`wrangler r2 object put/get` の `--remote`、`preview_bucket_name` と `remote = true` の注意、トークン例の D1 権限の削除などを直し、critic PASS で 2026-10-24 に公開・デプロイした (blog-auto-publish run 40038952462・PR #1174)。2026-11-03 に本番の 2 記事で「Cloudflare Pages」は 0 件。**未確認**: wrangler 4.148.0 の挙動と purge API は公式で未照合、載せたワークフローは通しで実行していない。
- **残り**: 最終回 `cc-estat-20` のタグが `CloudflarePages` のまま。`CloudflareWorkers` に替えるには `apps/web/src/config/known-tag-keys.ts` の再生成を同じ変更に入れる (未登録のタグは 410 になる)。cc-estat-20 に次回予告などの食い違いが残っていないかも確認する。
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
- **現状**: 是正は2026-09-07にPR #939（main `5d05cd6e1`）で本番反映済み (旧市区町村カテゴリsoft404は301、未知カテゴリ410 + noindex)。現sitemap内soft404 15件は本番200・自己canonical・index可を確認し、2026-10-17までに15/15の登録リクエストが受理された (自動化gsc-4はPAUSED)。Google保存状態は依然soft404で、登録完了・件数改善は未確認。根拠: `data/gsc/ui-audits/2026-10-16-remediation.json`。経過は `git log -p -- .claude/todo/backlog.md`。
- **次**: 修正後の lastCrawlTime・登録状態を既存の日次Inspectionで再確認し、未再クロールならサイトマップ再取得・クロール統計を照合する。現在200・ライブテスト合格・送信受理だけで登録済みとしない。
- **優先対象の絞り込み案 (10-16)**: soft404 15件・クロール済未登録146件・検出未登録971件の計1,132 URLを候補母集団にする（全件の現HTTPは未検査）。需要・最終クロール・内部リンク・本文の独自性で優先付けし、まず既存15件と需要のある小標本を調べる。
- **観測の判断条件**: 登録済み6,700とsitemap6,574は対象集合が異なるので割り算しない。固定した対象URL群で修正後クロール・登録・検索表示・クリックを追い、未登録総数の減少だけを成功にしない。UI監査と既存coverage入力の鮮度を分け、取り込み時は既存CSV/manifest gateを通す。既存lastmodは実際の本文/データ更新を表すかを確認し、確認できない日時を捏造して一律更新しない。
- **停止条件**: 古いW32入力を当週データとして再生成しない。通常ページへGoogle Indexing APIを送らない。デプロイ前のURLを同一観測窓へ混ぜず、Google再クロール前の件数不変だけでeffect/noneにしない。
- **完了条件**: develop→mainのCIがgreenで、上記の本番HTTP・構造化データ・sitemap検証がすべて合格する。失敗時の`coverage-alert`起票と、回復時の自動closeを少なくとも一方はGitHub Actionsで実測し、デプロイ後exportで市区町村カテゴリsoft404が0になる。
- **2026-11-11 実測 (GSC 最終更新 11-06・本番 HTTP・サイトマップ 11 本)**: 送信済みの「クロール済み - 未登録」127 件は県×テーマ 70・ランキング 24・市区町村 21・ブログ 11・調査 1 (クロール日は 6 月〜11 月)。県×テーマはテーマ 35 種に散り、最多は aging-society の 8 件。県×テーマはサイトマップに 2,491 件あり、「検出 - 未登録」にも 239 件ある。**次 (案09・15 の入力)**: 登録済みと未登録の県×テーマを同じテーマで並べ、本文・固有の値・重複の差を比べてから、薄い組み合わせを noindex にするか内容を足すかを決める。
- **県×テーマ 2,491 ページの比較 (2026-11-11・案09 の入力)**: 入力は GSC 送信済みビュー (最終更新 11-06) の「検出 - 未登録」239 件・「クロール済み - 未登録」70 件の全 URL と、W44 の検索実績 (28 日)。① 2,491 ページ中 1,836 ページ (74%) に検索の表示があり、合計は 28 日で 44,401 表示・1,063 クリック (1 ページ 0.43 クリック)。② 未クロール 239 件は新しいテーマに偏る: 2026-07-04 追加の 11 テーマ (517 ページ) は 7 件 (1.4%・全て tourism)、09-09 以降に追加した 42 テーマ (1,974 ページ) は 232 件 (11.8%)。③ クロール済み未登録 70 件は古いテーマの方が率が高い (07-04 追加 6.0%・09-09 以降 2.0%)。最多は aging-society の 8 件 (指標 25・図 5) で、指標の少ないテーマに偏らない。④ 指標の数と登録の関係: 新テーマのうち指標 6 以下の 16 テーマは表示あり 73%・1 ページ 0.35 クリック、指標 20 以上の 9 テーマは 69%・0.40 で、薄いテーマほど登録されないという差は無い。未クロール率だけは指標 6 以下 14.8%・20 以上 5.9% と差がある。⑤ 同じテーマの未登録ページと表示のあるページ 3 組 (public-assistance 31000/13000・retail-commerce 07000/14000・aging-society 05000/14000) は、指標カードの数が同じで HTML の大きさの差は 0.3% 以内 (本文の文字数は測れていない)。⑥ `/areas/<県>/tourism` は表示ありが 47 中 9 ページと最少で、7〜8 月のリダイレクトエラー 10 件・404 3 件の履歴がある (現在は 200)。**判断材料としての結論**: テーマ単位・指標の数・県単位のどれで切っても、noindex にする根拠になる偏りは無い。未クロールは公開から 5 週間のページへの到達待ちの形で、クロール済み未登録は全体の 2.8%。**次**: noindex は行わない。11-11 に始めた検証と内部リンクの追加 (`GSC-INTERNAL-DISCOVERY-01`) の後、次の送信済みビューの記録 (11-14 以降) で 239・70 の増減を見る。tourism の 38 ページが表示を得るかを同じ記録で追う。

### [GEO-QGIS-DEMAND-01] QGIS の使い方ブログ 3 本で需要を測り、note「国土数値情報をQGISで扱う」を作るか決める
タグ: [収益化] [種類:制作] [実行:対話] [起票:2026-10-03] [領域:サイト]

- **経緯**: 2026-10-03 に QGIS 教材を stats47 で扱うとオーナーが決めた。事業計画には note「国土数値情報をQGISで扱う」¥1,980 (`d-geo-ksj-qgis-guide`・gated) と「AIにPyQGISを書かせる検証法」¥2,980 がある (`packages/data-configs/src/business-plan/content-opportunities.ts`)。
- **需要の実測 (2026-10-03 の要約)**: 関心はある (Trends で ArcGIS の約 1.6 倍、サジェストの悩みは初級操作に集中) が、支払意欲は小さく (Udemy 専門講座 1 本 373 人、ココナラの教える系は最大 3 件)、無料の公式ドキュメント・MIERUNE・国交省マニュアルが強い。QGIS は 4.x への移行期。主な利用者は自治体職員・研究者・データ分析系。
- **切り口**: 汎用の基本操作は書かず、stats47 の Geo 分析を QGIS で再現する手順に絞る。スクショは PyQGIS で自動撮影し、QGIS の更新時に一括で撮り直せるようにする。
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

### [NOTE-HASHTAG-ROLLOUT-20261003] note公開記事のハッシュタグを承認済みの99個へ置き換える
タグ: [コンテンツ品質] [種類:改善] [実行:対話] [起票:2026-10-03] [領域:商品]

- **正典**: 記事ごとの承認済みタグは台帳 `note.hashtags` (`data/note/hashtags.json`。全286件)。作成は `propose-note-hashtags.mjs`、反映は `update-published-hashtags.mjs`、検査は `lib/note-hashtags.mjs`。反映済みかどうかは台帳に持たず、毎回 `--audit-only` で note から取り直す。
- **現状 (2026-10-12)**: 承認済みと一致 280/286。残り 6 件はすべて下書きが残って停止 (`draft_blocked`): 有料 `paid-n92b846280d1a`・`paid-nfe2c65e669a8` (以前からの下書き。内容を確認してから扱いを決める) と、無料 4 件 `recovered-n03e45e40d3a7`・`n144d350fc14e`・`n3908e5981967`・`n48dff1df249f`。無料 4 件はエディタがリンクカードの href を旧ブログURLの転送先に書き換えるため本文一致の安全装置で止まる。**リンク先の書き換えを許すかはオーナー判断** (許すなら比較で href の転送先を正規化する)。下書きは note の編集画面で破棄すれば解消する。`a-late-elderly-medical-expense-per-insured` は `--slugs a-late-elderly-medical-expense-per-insured --allow-free-draft` で片付く。
- **実行**: `node .claude/scripts/note/update-published-hashtags.mjs --all --include-paid` (一致する記事は飛ばすので再実行でよい。1 件 約40秒)。Claude デスクトップアプリからは Chrome Profile 5 が macOS のプライバシー保護で読めないので、ログイン済み Playwright プロファイルの Chrome へ `NOTE_BU_CDP` で接続するか、Terminal.app からオーナーが実行する。有料で下書きが残った記事は自動では触らない。
- **停止条件**: 3 件連続の失敗、本文・価格・有料/試し読み境界の変化、更新後のタグ集合が承認済みと一致しない場合はその記事で止まる。note は大文字小文字を既存タグに合わせて書き換え、ギリシャ文字などは黙って落とす (検査で除外済み)。
- **完了条件**: `--audit-only` で 286 件すべてが compliant。

### [KDP-K-S1-08-REUPLOAD-01] 公開中のKindle S1全12冊へ承認済みポップ表紙を反映する
タグ: [収益化] [種類:制作] [実行:ユーザー] [起票:2026-09-28] [領域:商品]

- **経緯**: 2026-09-29 にK-S1-01〜12の新しいポップ表紙を目視承認し、R2 `media/kindle-cover-assets/<id>/<revision>/`へ保存済み (KDPの販売中の版には未反映)。K-S1-08は2026-09-27に住宅・土地統計調査などを暦年に直したので、同じ更新で販売中版の「年度」表記も是正する。
- **次（実行順）**: ①K-S1-01〜K-S1-12を承認済みR2背景でそれぞれ新しいversionとして再生成する ②旧確定版との章テキスト差分0、`verify-epub`、review receipt、`verify-publishable --content-only` blocker 0を冊ごとに確認する ③入稿提案を新versionへ更新し、暗号化R2 archiveをpush・deep audit・recordする ④オーナーがKindle Previewerで各EPUBと表紙を確認する ⑤`kdp-publish --update --id K-S1-NN`をdraft確認し、対象12冊と版SHAを提示してオーナーの明示承認後にだけ`--commit`する ⑥KDP本棚のread-backと商品ページで新表紙を確認する。
- **停止条件**: KDPへの`--commit`を事前承認なしで実行しない。出版停止済みのS2/S3/S4を対象に含めない。既存versionを上書きしない。本文差分、検証blocker、archive不一致、Previewer未確認が1冊でもあれば、その冊の反映を止める。
- **完了条件**: K-S1-01〜K-S1-12の販売中版が承認済み表紙へ更新され、KDP本棚read-backと商品ページで12冊すべて確認できる。各冊の入稿版SHA・R2 archive・review receiptが一致し、K-S1-08の該当図が「年」表記になっている。
- **統合 (2026-10-26 オーナー判断): `KDP-COVER-CODEX-APP-01`** S1 12 冊の表紙帯絵を Codex アプリで作り直して差し替える
  - **本文の欠け (2026-11-13 確認)**: この統合のコミットで、元カード 6 行のうち 4 行 (字下げした続きの行と番号付きの手順) が落ちた。着手の前に `git show 47aa651d1^:.claude/todo/backlog.md` で `[KDP-COVER-CODEX-APP-01]` の全文を読み、今の実装と突き合わせて残りを決める。
  - **次 (差し替え手順・kindle-publisher が実行)**: ①1冊だけ生成して目視承認 ②`ingest-cover-background.mts --book K-S1-NN --input <png> --pop-band`でR2 staging ③完成PNG/JPEGとmanifestを同revisionへ置き、exact keyをR2 push ④`cover-design.ts`へkey/SHA/byte/寸法を登録 ⑤`products:kindle:generate -- --id K-S1-NN --version <次の版>` ⑥章テキスト差分0、`verify-epub`、review receipt、`verify-publishable --content-only` blocker 0を確認 ⑦入稿提案を最新版へ更新。
  - **完了条件**: 12 冊ぶんの帯絵がオーナー選定の絵に置き換わり、各冊の最終版が本文差分 0・`verify-publishable --content-only` blocker 0 で、入稿提案が最新版を指している。差し替えない冊は現行の帯絵のままでよい (その旨をこのカードから消して閉じる)。
- **確認が要る (11-03 の棚卸し)**: 4ed3ea4e9 (S1 12 冊の修正下書きの作成と読み戻しの検証 PASS) で手順が進んでいるが、この記述は古い。持ち主が進み具合を書き直す

### [AI-CONTENT-NATIONAL-AVERAGE-WORDING-01] 公開済みの AI 解説の「全国平均」を「47都道府県の単純平均」に直す
タグ: [コンテンツ品質] [種類:不具合] [実行:対話] [起票:2026-09-28] [領域:データ]

- **経緯**: 2026-09-27 に画面・JSON-LD・生成プロンプトは「47都道府県の単純平均」(公表の全国値が R2 に無いため。201 件標本で 0 件) に直したが、
  公開済みの ai-content (約 2,100 件) の本文は「全国平均は1.29」のまま (例: `/ranking/total-fertility-rate`)。
- **次**: 「全国平均」を機械置換できる文脈 (値の直前) だけを置換し、`audit-ai-content.mjs` を通して outbox から 35 件ずつ公開する
  (2026-09-27 の年表記是正と同じ手順)。言い換えで文が崩れる文脈は再生成キューに回す。
- **完了条件**: 公開中の ai-content の本文に「全国平均」が 0 件 (公表の全国値を使う指標を除く)。

### [DISPLAY-SEMANTICS-FOLLOWUP-01] 表示の意味の検査の残り (推移グラフの最低点数・週次 UI 確認の観点・ブログ本文の内部用語)
タグ: [インフラ・計測] [種類:改善] [実行:対話] [起票:2026-09-27] [領域:データ]

- **経緯**: `SITE-DISPLAY-SEMANTICS-AUDIT-01` (2026-09-27 完了・3 層の検査を配線) で残した 3 点。
  ① 「推移」グラフの最低点数は R2 の観測年数が要るため、定義検査はグラフ種別だけを見ている。② 週次 UI 確認エージェントのプロンプトに「データの意味」の観点 (指摘止まり) を足していない。
  ③ ブログ 3 本の本文に `rankingKey` という内部用語 (内部用語辞書の初回検出)。
- **完了条件**: ①② が配線され、③ の 3 本から内部用語が消えている。

### [CYCLE-HEALTH-01] 「検出 → 起票 → 計画 → 実行 → 完了 → 振り返り」のサイクルを各段の停滞信号つきで確実に回す
タグ: [エージェント・SSOT] [種類:改善] [実行:対話] [起票:2026-09-25] [領域:管理]

- **オーナー指示 (2026-09-25)**: バックログの改善・週次レビューで新しいカードが増え、配線し、改善を繰り返す。このサイクルを確実に回す。
- **設計**: 各段に「止まったら見える信号」を 1 つ置き、新しい仕組みは作らず既存の週次メトリクス Issue と管理画面 `/strategy/lanes` に出す。信号は 検出 → 起票 (7 日たってもカードに結ばれていない指摘)・起票 → 分類 (DG058/059/075)・分類 → 計画 (DG076〜078)・計画 → 実行 (Must の達成率と連続未達。2 週連続未達は分割か降格)・実行 → 完了 (Due 超過 DG054・判定できない効果測定・完了済み ID を参照する計画)・振り返り → 起票 (申し送りがカード ID に結ばれているか)。
- **済 (2026-09-26)**: `.claude/scripts/metrics/lib/cycle-health.mjs` (テスト `cycle-health.test.mjs`) が週次メトリクス Issue の「🩺 サイクルの健全性」表を出す。`/weekly-plan`・`/weekly-review` に連続未達と申し送り ID の決まりを追記。年カバレッジ監査の要拡張候補は `.claude/scripts/data/sync-year-coverage-backlog.mjs` で自動起票 (週次 `estat-year-coverage-audit-weekly.yml`)。
- **次 (残り)**: 「振り返り → 起票」の行を実数にする (週次レビューの申し送りに ID が付いているかを数える)。他の検出器 (ranking-integrity・provenance・`/audit-units`) の自動起票は `DATA-QUALITY-LOOP-01` ①② で同じ形に寄せる。
- **関連カード (ここで重複実装しない)**: `UI-REVIEW-LOOP-VERIFY-01`、`DATA-QUALITY-LOOP-01`、`EFFECT-TARGET-MARKERS-01`、`STRATEGY-FOCUS-2026-10-01`。
- **完了条件**: 週次メトリクス Issue に 6 信号が 4 週続けて出て、検出 → 起票の未結び件数と Due 超過が減り、Must の連続未達が 2 週以内に解消されている。

### [NOTE-COVER-ASSETS-SPLIT-01] note カバー台帳 cover-assets.json を 1MB 未満に分割する
タグ: [コンテンツ品質] [種類:改善] [実行:対話] [検証:node .claude/scripts/lib/check-repo-hygiene.cjs --baseline] [起票:2026-10-13] [領域:商品]

- **現在地 (2026-10-13)**: `data/note/cover-assets.json` は記事 403 本分の採用版と操作履歴を持ち約 1.7MB で、repo hygiene の上限 1MB を超えるため `.claude/config/repo-hygiene-baseline.json` に既知の違反として 1 件登録した。
- **やること**: 完了・superseded の操作履歴を `data/note/evidence/` の月別ファイルへ移すなど、正本 (採用版と未完了の操作) と履歴を分ける。読み手 (`lib/cover-update.mjs`・`generate-cover-refresh.ts`・`verify-cover-refresh.mjs`・管理画面) を同時に直し、JSON Schema も更新する。
- **完了条件**: 正本が 1MB 未満になり、baseline から `data/note/cover-assets.json` の行を消しても `check-repo-hygiene.cjs --baseline` が通る。`node --test .claude/scripts/note/__tests__/cover-update.test.mjs` が通る。

### [SITEWIDE-DUPLICATE-LINK-RATIO-01] サイト横断でリンク重複率が閾値超過 (本番全6,237URL実測)

タグ: [UI・UX] [種類:不具合] [実行:対話] [検証:npm run page-quality:audit-weekly -- --base-url https://stats47.jp] [起票:2026-09-15] [領域:サイト]

- **owner**: ranking-ui-manager (ranking) / theme-ui-manager (theme) / site-ux-manager (共通部品・横断)
- **状況**: 2026-09-15 の本番全件監査で duplicate_link_ratio (閾値 0.3) がほぼ全テンプレートの支配的違反だった (municipality だけ異常なし)。page-quality は 2026-09-18 に PR 必須 gate から外し、検知は週次 `quality-suite-weekly.yml` の page-quality job と `check:release-local`。生データ: `data/page-quality/metrics/{latest.json,LATEST.md}`、管理画面 `/quality/page-audit`。
- **2026-10-23 原因の切り分け** (指標は `measure-static.ts` の「全 a[href] − 一意の href」÷ 全 a[href]): header・footer・aside を除くと、ブログ 0.44 → 0.21・調査 0.22 → 0.06 (共通ナビの重複が主因)、ランキング 0.38 → 0.43・テーマ 0.48 → 0.54 (本文側に重複)。本文側の出どころは、テーマの狭幅用の代替 UI (`ThemePageLayout.tsx` の `LEFT_RAIL_NARROW_ONLY_CLASS`。`ui-components.md` が求めるもの) とチャートごとの出典 (ChartFooter)、ランキングの出典調査リンクの複数箇所 (`RANKING-SOURCE-TRIPLE-01` の判断待ち) と関連ランキングの nav / section の重なりで、多くは設計どおりの重複。
- **次 (オーナーの判断が要る)**: 指標が捉えたい「意図しない大量重複」と、設計どおりの重複 (共通ナビ・狭幅の代替 UI・チャートごとの出典) を分けるかを決める。分けるなら指標を「header・footer・aside と狭幅専用のブロックを数えない」に変え、閾値の意味をそのまま保つ。分けないなら設計 (出典の繰り返し・`RANKING-SOURCE-TRIPLE-01`) の側を変える。指標の範囲を変えると検査を緩めることになるので勝手に変えない。修正後は `page-quality:check` (代表URL) で個別確認し、全件は次回の週次 job で確認する (毎回全件を手動実行しない)。
- **完了条件**: 週次監査の error 件数が縮小傾向 (ラチェット化は別途検討)。

### [BLOG-SVG-LINEAGE-RESTORE-01] ブログSVG系譜キューの継続消化

タグ: [コンテンツ品質] [種類:不具合] [実行:対話] [起票:2026-07-22] [進行中] [領域:データ]

- **経過記録の整理 (2026-10-25)**: 2026-09 以前の経過と完了済みの記録を削除した。削除前の全文は `git log -p -- .claude/todo/backlog.md` で辿れる。

- **owner**: Claude Code
- **現況**: 全`article.md`参照から期待asset集合を作る公開契約監査へ拡張済み。公開434記事・本文参照
  1,091 assetで `pork-consumption-expenditure/data/pork-expenditure-ranking.svg` だけが404。SVGは既存JSON/sourceから
  ローカル再生成済みで、公開gateもdata refresh / blog publish / 週次へ配線済み。R2全量pullのdry-runは
  `app/blog` 8,913 files（local差分8,526）を確認したが、read-only取得の承認前なので実pullしていない。
- **次**: 構造error 98記事を優先し、小バッチで処理する。R2由来、算式、年、metric keyを復元できない図は
  推測で再生成しない。公開参照asset契約と内容品質gateを各バッチ後に再実行する。
- **完了条件**: 全公開記事の参照assetが200、must-fix 0、公開gate greenとなり、source lineage不明の図は削除または明示的に保留される。
- **正典**: `.claude/rules/blog-data-schema.md`

### [AFF-INTENT-FALLBACK-STOP-01] 意図が解決しない面への配信を止め、priority を期待収益順にする

> **2026-10-31 オーナー決定で「止める」部分を置き換えた**: 意図が解決しない面には、別の意図軸を推測せず、汎用で高単価の案件 (`GENERIC_HIGH_VALUE_PROGRAM_REFS`) を出す (`affiliate-ads-standards.md`「意図が決まらないページの受け皿」)。priority を期待収益順にする部分は残る。

タグ: [収益化] [種類:改善] [実行:対話] [検証:node .claude/scripts/metrics/check-revenue-guards.mjs が exit 0] [起票:2026-09-20] [期日:2026-10-04] [領域:アフィリエイト]

- **owner**: affiliate-manager
- **正典**: `docs/00_プロジェクト管理/02_収益化戦略.md` §3.2 / `.claude/rules/affiliate-ads-standards.md` §6.1
- **背景（2026-08-10〜09-06 実測）**: tags が 0 件のページは `resolveContentVerticalChain` (`affiliate-category.ts`) が `CATEGORY_AFFILIATE_MAP` の 17 軸写像へ落ち、economy への集中 (約 7,400 imp / 2 clicks) を作っていた。意図が解決した vertical は housing 0.299%・mobility 0.340% と全体 0.049% の 6〜7 倍だが、標本がクリック 1 件ずつなので **[仮説]** の域を出ない。
- **やること**: ①②の「止める」部分 (カテゴリ写像へのフォールバックの削除・`AffiliateAdSlot.tsx` の暗黙フォールバック) は冒頭の 2026-10-31 決定で汎用高単価案件の受け皿に置き換わった。③priority を期待収益順（`epcYen × confirmRatePct / 100`、出典 `data/affiliate/a8-catalog.json`）で vertical ごとに振り直す。`AFFILIATE_DELIVERY_HOLDS` と blocklist を先に確認し、health 軸の不適合案件を上位へ出さない。
- **[target: CTR +0.10pt 以上（0.049% → 0.15%）]** 根拠: 意図解決済み vertical の観測 CTR 0.30% と
  現状 0.049% の中間。`epcYen` は A8 のプログラム平均で自サイト実績ではないため、priority の初期値
  としてのみ使い、自サイトの確定収益が溜まったら置き換える。
- **境界**: 枠数は変えない（それは `AFF-SLOT-REDUCTION-01`）。同じデプロイに混ぜると
  「どの広告を出すか」と「いくつ出すか」のどちらが効いたか分離できない（収益化戦略 §7）。
- **停止条件**: フォールバックを止めると広告が消えるランキングが出る（`MetricConfig.tags` 未記入の
  ページ）。消えた面の件数を計測し、tags の補完で戻せるかは別カードにする。14 日後に CTR が 0.10% に
  届かなければ仮説を棄却し、広告レーンへの追加投資を止めて商品レーンへ寄せる。
- **観測例 (2026-09-25)**: `/ranking/natto-consumption-expenditure` の本文に「1位 福島県の人気返礼品」(桃) が出る。地域軸の配信が読者の意図 (納豆・食品) と合っているかを本カードの判断に含める。
- **統合 (2026-10-26 オーナー判断): `AFF-VERTICAL-FIT-02`** population / health / education 軸の上位在庫を主題に合わせて入れ替える
  - **本文の欠け (2026-11-13 確認)**: この統合のコミットで、元カード 12 行のうち 10 行 (字下げした続きの行と番号付きの手順) が落ちた。着手の前に `git show 47aa651d1^:.claude/todo/backlog.md` で `[AFF-VERTICAL-FIT-02]` の全文を読み、今の実装と突き合わせて残りを決める。
  - **次**: (a) マッチングアプリ・結婚相談所は `targetRankingKeys` で未婚率・婚姻・初婚年齢の
  - **完了条件**: 3 軸とも GSC imp 上位 3 ページで priority 上位 3 の広告が主題と合っている

### [CONTENT-PAINPOINT-PUBLISH-01] 悩み起点ブログ5本の公開とSNS展開を完了させる

タグ: [SNS・マーケ] [種類:制作] [実行:対話] [検証:curl -sI https://stats47.jp/blog/nursery-shortage-urban-prefecture が200を返す] [起票:2026-09-16] [期日:2026-09-30] [領域:サイト]

- **背景**: 「悩み・不安」起点の記事がSEOに効くという仮説で、白書(NotebookLM)調査+note/X調査の両方で裏付けが取れた5テーマを記事化した。5本とも `quality-gate.mjs` / `article-factual-check.mjs` / blog-critic すべて PASS 済み (`contents/blog/{nursery-shortage-urban-prefecture, vacant-housing-rate-inherited-home-risk, elderly-welfare-expenditure-prefecture-gap, evacuation-plan-coverage-urban-prefecture-gap, intellectual-crime-tokyo-kagawa-gap}/`)。
- **公開の現在地**: 2026-11-03 時点で 5本とも本番は 410 (未公開)、原稿は `contents/blog/<slug>/` に残っている。9月は Codex の利用上限で背景画像を作れず止まった。画像リクエストは `npm run blog-images:codex -- request-article --slug <slug> --article contents/blog/<slug>/article.md` で決定的に再生成できる (Codex CLI の直接実行は `codex-mcp.md` の経路③で許可)。
- **SNS下書き**: X投稿文5本・Instagramキャプション5本は `data/sns/pain-point-series-drafts.md` に保存済み。**投稿・予約は記事が本番公開されてから、ユーザーの明示許可を得て実施する**(まだ実行していない)。各投稿に添付する画像とチャートSVGの形式一致は未確認、投稿前に要突合。
- **次**: 5 本分の request-article → `$imagegen` (1本1回) → `ingest-article` → `generate-blog-thumbnails.ts --slug <5slugs>` → `/publish-bulk-articles` の Phase 4 (R2 push・all.json・purge) → Phase 5 (HTTP 検証)。公開後に X・IG の下書きを予約枠 (X は週 2-3 本) へ入れる。
- **停止条件**: 画像なし(共有背景fallback)でR2にpushしない(OGP/カードが404で公開される事故を防ぐ設計)。
- **完了条件**: 5記事すべてが本番で200 + OGP/thumbnail画像が正しく出る + SNS投稿(X/IG)まで実施されている。

### [STATE-R2-MIGRATION-01] 日次観測 state の残り 4 domain を R2 `state/` へ移す (psi → cloudflare → url-inspection → search-growth)

タグ: [インフラ・計測] [種類:改善] [実行:対話] [検証:git log --since=4.weeks --name-only -- .claude/state/metrics | sort -u | wc -l が 230 未満、かつ curl -sI https://storage.stats47.jp/state/psi/index.json が 200] [起票:2026-09-14] [期日:2026-10-12] [領域:管理]

- **owner**: Claude Code (実装) / オーナー (PR 承認・Cloudflare lifecycle)
- **前提**: PR `feat/ga4-affiliate-state-r2` で 1 domain 目 (`state/ads/ga4-affiliate/`) の型が出来ている。
  `state-pull.mjs` (公開 URL → gitignored `live/`)、`index.json` 維持、週次集約だけ commit-back、
  `prune-state-snapshots.mjs` の policy 削除、という 4 手順を domain ごとに繰り返す。
- **背景 (2026-09-14 実測)**: 日次の psi / cloudflare / url-inspection の `[skip ci]` commit-back が 4 週で 230 commit あった。git を肥大化させず agent の Grep 対象にも入れない置き場は R2 `state/` (400 日 lifecycle・`r2-storage-design.md`)。
- **次 (実行順)**: ① `fetch-metrics-weekly.yml` の psi job: `psi-batch-*.json` を `state/psi/` へ、`history.csv` は git のまま。
  読み手 `psi-threshold-check.mjs` / `fetch-psi-audit.mjs` / `search-growth/lib/sources.mjs` に「local 無ければ
  `live/`」を足す。② `cloudflare-usage-daily.yml` (`cloudflare/snapshots/`)。③ `url-inspection-daily.cjs`
  (`gsc/url-inspection/`)。③の読み手には `build-coverage-queue.mjs --sync-inspection` (直近14日の日次CSVで
  是正キューを done 化) も含める。④ `search-growth-weekly.yml` の `latest.json` / `live/`。domain ごとに 1 PR、
  移行後に `RETENTION_POLICIES` の該当 scope を消す。
- **停止条件**: 日次アラート (`[PSI Alert]` / `[Cloudflare Alert]`) の起票経路を壊さない (読み手が CI 内で
  直前に書いた raw を読む経路は維持する)。R2 へ書けなかった日は raw を捨てず artifact に残す。
- **完了条件**: 4 domain とも日次 commit-back が消え、`fetch-metrics-weekly.yml` の週次 1 commit だけが
  `.claude/state/metrics` を触る。`npm run state:pull -- <domain>` が 4 domain で動く。
- **確認が要る (11-03 の棚卸し)**: 検証コマンドは `.claude/state/metrics` を数えるが、日次の記録は `data/psi` などへ移ったので今は常に通る。検証の対象を見直す

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
- **対象の正典**: `data/products/catalog-status.json` の `offers`。既存商品と未制作候補、同一商品の販売先variantを分け、個別statusを本文に複製しない。人間向け一覧は `products:report` が生成する `.local/product-portfolio/catalog.html`。noteデータパックの公開状態は `data/note/articles.json` と `data/note/evidence/note-product-storefront-live-2026-10-26.json`、添付ZIP保全は `NOTE-PRODUCT-ZIP-ARCHIVE-01`。
- **再開点**: 現行候補は`CURRENT_SALES_REVISIONS`で固定。最初の公開前に、固定bytes送信・旧draft再投入・公開直前再照合を認証済み下書きで実測する（コード/モック検査のみでは実UI動作を合格にしない）。新規公開は実機・権利/申告・保全・オーナー承認がそろってから。S2/S3/S4 の 10 冊は KDP で出版停止済み (listing は `status: "withdrawn"`)。
- **次（実行順）**: ①Kindle改訂版を全章で独立意味レビューする。書き下ろしだけでなくブログ/ランキング由来の本文・図を含め、未根拠因果・対象年/地域/分母の違いを是正し、内部比率を再計測する。②確定版のEPUB検査・Previewer・全章SHAに結び付いたreview.json・入稿bundle照合後、明示版指定のarchiveで旧版を保持して暗号化保全する。③note14パックの準備原稿に固有の使い方・図例を追加し、独立レビュー・価格/添付/利用条件確認へ進める。無料P13を含めた固定入力はfree-sample-delivery.jsonと納品manifestで照合する。未制作Geo11企画は原典・再現テスト・読者成果を満たすものから制作する。④商品別の残ゲートが解消してから、承認された対象だけを専用公開フローへ渡す。入稿提案JSONを公開済み記録と扱わない。
- **Kindle の章の是正対象**: S1-01 は全 15 章の独立レビューと是正が済み (記録 `.local/kindle-books/K-S1-01/v3-20260919-r3/review-r1-findings.md`)。S1-02 は食品の支出・購入数量と調査対象都市を元記事の本文・図まで照合する。S1-03〜12 は次を元ブログ・図まで直す: 03高齢単身の分母・通勤流入と移住、04介護必要数と不足数・化学工業と医薬品・相談窓口の時間、05大学収容力と入学定員・保育利用率と希望充足率、06財政指標の控除/平均期間・目的別と性質別、07宿泊施設範囲/人泊と人数・国籍から嗜好の断定、08供給契約と世帯普及率、09産業出荷/利益/用水効率、10火災地震合算/強度率の労働時間分母、11行動者率/稼働率、12有業者/雇用者。`editorial-corrections.ts`の部分校訂やfresh訂正だけで当該章全体を合格にしない。出典一覧に章題を出すのは決定済みの仕様 (K-S1-10 N36 / K-S1-12 N02)。
- **ブログ側に残る同じ誤り (chart-author / `/blog-revise-fix`)**: S1-01 の誤りは公開ブログ 9 本 (real-disposable-income-reversal / heating-cost-vs-disposable-income / per-capita-income-gap / savings-balance-gap / engel-coefficient-prefecture-ranking / household-spending-prefecture-gap / communication-cost-burden / expenditure-structure-comparison / black-tea-income-gap) に残る。review-r1-findings.md の before/after を must-fix として直す (図の再生成: savings-ranking を 2019 年 financial-assets-balance に、income-summary-findings の heading「約200万円」→「約20万円」)。K-S1-06 財政力指数ランキング図の小数 1 桁表示 (島根 0.25 と徳島 0.31 が同じ「0.3」。`resolveValuePrecision` で再生成)。data-configs の `yearFormat` が家計調査・国勢調査・社会生活基本調査まで一律 fiscal なので `METRIC-YEARFORMAT-KAKEI-01` を家計調査以外にも広げる (config が直ったら書籍の図の校訂は外す)。
- **ランキング再利用の境界**: 商品版のランキング章は未レビューAI解説を外して同順位の全県表・決定的集計へ再構成した。公開サイト本文 (S2-01 旧版レビューで検出した DID可住地分母、死亡率/件数、従属人口指数/就労者、都道府県率の合算、単純平均/全国値、相関からの因果・算術誤り) は未変更のため、原典再計算とサイトownerへの是正引渡しが必要。旧版レビューを新版PASSへ流用しない。
- **残るオーナー工程**: ①R2 暗号化保全 `npm run kindle:archive --workspace=@stats47/r2-storage -- --push --id <id> --version <版>` → `--audit --deep --record` (鍵のある環境。無いと `kdp-publish --update` の archive gate で止まる) ②Kindle Previewer で対象 EPUB (SHA) の表示確認 ③`kdp-publish --update --id K-S1-NN` ×12 (S1-01 は書名変更を含む・入稿提案 `.local/kindle-listing-revisions/`) → 承認後 `--commit` ④kdpreports.amazon.co.jp の冊別 export → `products:sales` ⑤Officeの実機確認。歴史2指標は原典と 47 県一致を確認済みで、`historicalNotReverified` の解除と納品 SOURCES の注記更新は商品担当の判断で未実施。公開済みGeo noteの本文・添付再確認は認証済み画面が必要。売上/需要の不明を0扱いしない。
- **停止条件**: 生成/形式検査だけで販売準備完了にしない。内部30%をAmazonの合法性・受理保証と説明しない。字数水増し・収録指標の黙った削減をしない。税務・銀行・本人認証・規約同意を代行せず、KDP Select独占を他チャネル展開と両立済みと扱わない。旧公開版・原稿を上書きしない。公開stateを機械品質の結果で書き換えない。
- **完了条件**: 全offerが対象版の実検証・独立レビュー・必要な人間確認を満たすか、採用見送り理由と再開条件が明記される。販売を選んだofferは価格・納品物・権利・公開証跡が一致する。未完了が1件でもあれば「全商品販売可能」と報告しない。

### [QUALITY-GATE-COVERAGE-01] CI・テスト・監査の実効網羅性強化

タグ: [種類:改善] [実行:対話] [起票:2026-08-13] [領域:管理]

- **owner**: Claude Code
- **trigger**: `CROSS-PAGE-DATA-SSOT-01`のcore契約を壊さず、このIDを指定してQG0から順に実装する。
  QG0、QG2、QG4、QG7はデータ移行と独立して先行できる。QG1、QG3、QG6の最終受入は同項目のWP6後に行う。
- **目的**: 公開値を壊す欠陥を意図的に混入したとき対応するPR gateが確実に失敗し、修復後にgreenへ戻る状態を作る。
  未実行・fail-open・過度なskipを機械的に検出する。
- **既知の穴 (2026-08-13 欠陥fixtureで再現)**: e-Stat境界checkは`import()`/re-export/`require()`を検出しない。
  chart props validatorは`statsDataId`欠落や`color:"rainbow"`を通す。`classifyUnitComparability`は`kg→g`等の倍率違い・
  片側periodを`same / factor 1`と誤判定し、公開exportされていない。色の逆写像testは空集合をloopして空振りgreen。
  theme live監査は`--limit 0`でも`coverageOk:true`・exit 0になり、scheduled runも非0を返さない。
- **依存と責務境界**: 実装本体 (R2一本化・`StatSeriesRef`・単位変換・semantic color role) は`CROSS-PAGE-DATA-SSOT-01`、
  金額の実データ是正は`MONEY-UNIT-SCALE-01`、shape / configHashは`RANKING-VALUES-PARTITION-INTEGRITY-01`、
  live期待集合とalertは`PUBLIC-DATA-CONTRACT-AUDIT-01`、baselineの個別finding返済は`MAINTENANCE-DEBT-PAYDOWN-01`が所有する。
  本項目はそれらを迂回できないtest / CI / mutationだけを所有し、分類表・allowlist・live scannerを複製しない。
  完全DBレスを維持し、D1用integration testを増やさない (実態がunit testの`test:integration`は改名か削除)。
- **実装規律**:
  - 同じworking treeでwriterを並行起動しない。このIDと無関係な差分を編集・stageしない。
    `git add -A`、commit、PR、deploy、workflow dispatch、R2 writeは禁止。
  - 各QGで最小の欠陥fixtureを入れてgateがredになることを確認し、直してgreenへ戻す。greenの確認だけで完了にしない。
  - deterministicな検査はPR blocking、secret・network・pixel差の影響を受ける検査はscheduled / manualに分ける。
  - baselineは縮小ratchetだけに使い、merge-baseと比較して引上げ・allowlist追加・skip追加を通常差分で通せないようにする。
- **実行順**:
  1. **QG0 — 品質ゲートregistryのSSOT化**: workspace・source数・各scriptとPR / scheduled / pre-commit / manualの実行箇所を
     pure collectorで列挙し、`.claude/config/`のregistry (`id`/`command`/`scope`/`owner`/`trigger`/`blocking`/
     `network/secrets`/`timeout`/`reason`/`expiresAt`) に分類、未分類をerrorにする。`check-checker-wiring.cjs`を
     `declared`/`invoked`/`blocking`/`scheduled`分類へ拡張し、criticalな`declared-only`を0にする。
  2. **QG1 — e-Stat・単位境界の迂回防止**: production `apps/web`からのimport graphでstatic/dynamic/re-export/wrapper/aliasを
     検出し、type-onlyだけ除外 (6 fixture)。chart propsをshared schemaへ寄せ`componentProps`をdiscriminated unionにする。
     money unit監査をblockingへ配線する。unit modelに倍率と分母を持たせ、SI倍率・分母・計数語・片側periodを正しく判定し、
     `./unit`公開entryから少なくとも1つのproduction判定で使う。
  3. **QG2 — R2 reader契約をruntimeで閉じる**: readerを棚卸しし、`JSON.parse(...) as T`をschema付きreaderへ置換。
     producer→reader round-trip test、正常/404/malformed/schema-invalid/旧schema/stale/5xx/timeoutのtest、
     返り値`ok`/`no-data`/`source-unavailable`/`schema-invalid`/`stale`の識別を入れる。
  4. **QG3 — 公開ページの値・単位・欠測の縦断検証**: 同じfixtureをranking・theme・blog adapterが同じ値で表示するcontract testと
     mutation (10倍・年ずれ・unit・area欠落)。Playwright route matrixでknown routeの`200 | 410`や条件付きskipを許さず、
     theme代表9 chart typeのchart数・data state・unit・yearを検査する。
  5. **QG4 — workspace別CI matrix**: `apps/admin`の単体testをPR CIへ必ず含め、remotion / gesはactiveなら最小gate、
     inactiveならowner・理由・期限付き例外にする。critical packageのtest 0やmatrix未登録をcheckerで拒否する。
  6. **QG5 — coverageを重要契約の回帰防止へ**: module別の実測値をfloorにし、merge-baseから低下したら失敗。
     新規のpure validator等は全分岐をfixtureで通し、都合のよいcoverage除外を足さない。
  7. **QG6 — semantic colorとrender結果**: git TSはrole、生成時に`resolveChartColorHex`でhex化へ統一し未使用CSS resolverを削除。
     全role (現行20) の全域性、移行前14色の非空golden、未知値のfail-closed拒否、Playwrightでの実描画色検査、
     render test 9件の専用job配線を行う。
  8. **QG7 — fail-open・warning・skip・baselineの縮小管理**: `provenance-audit-weekly.yml`等のvalidator失敗を最終job statusへ伝播。
     warning / skip / `continue-on-error`をowner・理由・期限付きshrink-only baselineへ移す。`theme-chart-live-audit.mjs`を
     pure core化し、partial実行を`coverageOk:false`、wrong-filter rowsを失敗にする。
  9. **QG8 — 最終mutation・文書・preflight**: 上記の欠陥を1つずつseedし該当gateだけがredになる表を記録する。
     type-check / test:packages / admin test / web coverage / Playwright / 必要buildを実行し、恒久契約だけを
     `apps/web/tests/README.md`・`.github/workflows/README.md`・`docs/01_技術設計/06_自動化インベントリ.md`へ反映して
     `npm run docs:fix` / `docs:check` / `docs:check:all`を通す。commit / PR / deploy / workflow dispatch / branch protection変更は
     ownerの明示承認まで実行しない。
- **停止条件**:
  - merge-base差分を取れずbaselineを縮小専用にできない、またはmutationを入れても想定gateがgreenのまま。
  - CI追加がcache込みp95で5分超の増加、外部API rate limit、secret不足、pixel差の非決定性でPRを安定再現できない
    (この場合はdeterministic fixtureをPRに残し、live / visualだけscheduledへ分けて再計測)。
  - runtime schema導入で既存R2 payloadを後方互換に読めず、R2 write・公開値変更が必要になる。
  - inactive workspaceの削除、branch protection、GitHub secret、remote workflow、deploy、R2への変更が必要になる。
  - ユーザー差分との競合、検査母集団の理由なき減少、allowlist / baseline / skipの拡大が必要になったら、証拠と選択肢を示してowner判断を待つ。
- **完了条件**:
  - 全workspaceと全critical checkerがregistryで分類され、criticalな`declared-only`・ownerなし・期限切れ例外が0。adminの単体testがPRで実行される。
  - production webからe-Stat providerへの推移的到達0。dynamic import / re-export / wrapperの陰性対照が境界gateで落ちる。
  - chart propsのshared schemaをcatalog / validator / app parserが共有し、`StatSeriesRef`が実catalog / readerで使われる。
  - unit classifierが金額・SI倍率・分母量・計数語・periodを理由付きで判定し、公開entryからproduction判定と監査が同じAPIを使う。
  - critical R2 snapshotがruntime schemaとround-trip testを持ち、malformed / old / stale / 5xxを空データと区別する。同じfixtureの値がranking・theme・blogで一致する。
  - known routeを`200 | 410`やskipで逃がさず、代表9 chart typeの非空・unit・year・data stateをE2Eが検証する。
  - 全color roleが単一の解決方式で一致し未知roleを拒否、移行前14色のgoldenとrender test 9件が実行される。
  - validator失敗が最終job statusへ伝播し、warning / skip / baselineはcode別縮小ratchetで新規増加0。
  - theme live監査は0件・partial・wrong-filterを成功と扱わず、期待集合の全件照合時だけcoverage成功。失敗はscheduled runの最終statusへ伝播する。
  - QG8のmutationがすべて意図したgateをredにし、復元後に全gateがgreen。CI時間は停止条件内で、例外は0またはowner・期限付き。
- **正典**: `.github/workflows/pr-quality-check.yml` / `.github/workflows/README.md` /
  `docs/01_技術設計/06_自動化インベントリ.md` / `apps/web/tests/README.md` /
  `.claude/scripts/lib/check-checker-wiring.cjs` / `apps/web/coverage-thresholds.json` /
  `packages/r2-storage/src/lib/operations/` / `packages/stats-r2/` /
  `CROSS-PAGE-DATA-SSOT-01` / `MONEY-UNIT-SCALE-01` / `RANKING-VALUES-PARTITION-INTEGRITY-01` /
  `PUBLIC-DATA-CONTRACT-AUDIT-01` / `MAINTENANCE-DEBT-PAYDOWN-01`

### [RANKING-FIRST-VIEW-RELEASE-01] ランキングページを「最初の画面で答えを出す」形に改修し、既存 3 件とまとめて 1 回のリリースで測る
タグ: [UI・UX] [種類:改善] [実行:対話] [起票:2026-09-25] [領域:サイト]

- **済み (2026-10-10)**: 指標SSOT・表示契約と最初の画面の要約UI (上位3件/最下位・単純平均線・推移) は本番確認済み ([PR #1116](https://github.com/uruhayato373/stats47/pull/1116)・[PR #1118](https://github.com/uruhayato373/stats47/pull/1118)、390/768/1440px の 17 ケースで 200・JSエラー0・横overflow0)。反映時間の対策は `DEPLOY-METRIC-RELEASE-TIMEOUT-01`、依存関係の Security Scan は `DEPS-BRACES-GATE-01`。
- **本カードで残る範囲**: 以下の地図/表統合・出典整理等と公開後の回遊/アクセス計測。SSOT・要約UI反映だけで完了扱いにしない。アクセス改善の効果は未計測。
- **結論 (2026-09-25 オーナー合意)**: UI はランキングページを最優先にする (PV・検索クリックの最大の面)。
- **範囲 (1 回のリリースにまとめる)**: ① 最初の画面に「1 位・最下位・値・年・単位」の要約 (済) ② `RANKING-MAP-TABLE-CARD-01` (地図と表を 1 枚に) ③ `RANKING-PAGE-STRUCTURE-01` (補足文・出典・関連一覧の整理) ④ `RANKING-SOURCE-TRIPLE-01` (出典 3 か所。推奨: 見出し直下の 1 行とページ末尾の詳細の 2 か所にし、サイドバーから外す)。同じページに変更を小分けに重ねると効果を分離できない (収益化戦略 §7) ので 1 回で出す。データのページの最大幅 (`LAYOUT-MAX-WIDTH-DECISION-01`) はデスクトップ幅を見てこの中で判断する。
- **守ること**: スマホの LCP を悪化させない (`PERF-RANKING-LCP-03`)。データの年は `DATA-QUALITY-LOOP-01` の基準 3 (調査終了の明示) と整合させる。
- **測り方**: 基準値はランキングの 1 人あたり PV 2.00・ランキング→他ページの遷移 (`internal-transitions.csv`)。目標値は `NAV-CLICK-COVERAGE-01` で部品別のクリックが取れてから決める。
- **完了条件**: 4 項目が 1 回のリリースで本番に出て、390 / 768 / 1440px の撮影で最初の画面に要約が見え、LCP が悪化していない。
- **全面点検で追加した範囲 (2026-09-25 `UI-FULL-SWEEP-01`)**:
  - 高: 1 年だけの `/ranking/junior-high-club-per100-swimming` の見出しに種目 (水泳部) が無い。
  - 高: `/ranking/natto-consumption-expenditure` (世帯あたり) に人口・面積あたりの計算方法の切替が出る。県庁所在市の値なのに表・上位 3 県で県名で出る。
  - 中: 「全国平均」が 47 都道府県の単純平均で、公式の全国値と誤解させる (`DATA-VALUE-ERRORS-01` でも扱う)。
  - 中: 東京だけが濃く他県がほぼ同じ色になる線形の配色 (`/ranking/total-population`)。推移の無い指標で「推移データなし」だけの大きな枠。
  - 中: 1440px の右レールで指標名が括弧の途中で切れ、同名に見える行を区別できない。
  - 低: 出典の下に単独の「総数」ラベル / 同率で 47 位が無い理由が出ない / 長い指標名がパンくずで 2 行になる。
- **相乗りした修正の本番確認 (2026-09-25 時点の記録)**: `/themes/population-dynamics?pref=13000` で `performance.getEntriesByType('resource')` の POST が 2〜3 件・グラフが 3 秒以内に描かれること (`THEME-CHART-LOAD-LATENCY-01`)。県データブックはデプロイ後に `sync-snapshots` で `app/areas/<code>/databook.json` を作り直す (`AREA-DATABOOK-LABEL-INTEGRITY-01`)。
- **統合 (2026-10-26 オーナー判断): `RANKING-MAP-TABLE-CARD-01`** ランキングの地図と表を 1 枚のカードにし (1280px 以上は横並び・それ未満はタブ)、年と計算方法の切り替えをカードの見出しに集約する
  - **本文の欠け (2026-11-13 確認)**: この統合のコミットで、元カード 35 行のうち 30 行 (字下げした続きの行と番号付きの手順) が落ちた。着手の前に `git show 47aa651d1^:.claude/todo/backlog.md` で `[RANKING-MAP-TABLE-CARD-01]` の全文を読み、今の実装と突き合わせて残りを決める。
  - **次 (実行順)**:
  - **停止条件・禁止**: `forceMount` を外さない (表が HTML から消えると検索に影響する)。h1 を DOM の先頭から動かさない。
  - **完了条件**: localhost の 390/768/1024/1280/1440/1920px で、地図と表が 1 枚のカードに入り、1280px 以上は横並びで表の 4 列が
- **統合 (2026-10-26 オーナー判断): `RANKING-PAGE-STRUCTURE-01`** ランキングページの補足文・出典・関連リストの置き方を整理し、重複と冗長を減らす
  - **本文の欠け (2026-11-13 確認)**: この統合のコミットで、元カード 59 行のうち 53 行 (字下げした続きの行と番号付きの手順) が落ちた。着手の前に `git show 47aa651d1^:.claude/todo/backlog.md` で `[RANKING-PAGE-STRUCTURE-01]` の全文を読み、今の実装と突き合わせて残りを決める。
  - **次の画面検討 (未採択・2026-10-08)**: ランキング・ブログ・テーマ・エリア・Geo のページ ID・タグ等のマスタ・ID 間の関係を `data/` で一元把握できる設計を先に具体化する。既存の関連付け SSOT と照合し、二重 SSOT を作らないことを検討する。その設計を踏まえ、関連記事を PC は右レール先頭・スマホは地図/順位表直後へ置く案を画面で比較し、採否を決める。
  - **次 (実行順)**:
  - **停止条件**: 関連リストや出典調査のカードを消す前に、クリックの計測値 (`rail_click` / `nav_click`、出典調査のカードは
  - **完了条件**: 補足文・注記・出典がカードに入り、補足と注記が 1 か所にまとまっている / 関連リストが 2 つ以下 / `DataUsageCard` が

### [CHART-AXIS-READABILITY-01] グラフの軸・凡例・ラベルがスマホで読めない、欠ける、単位が無い
タグ: [UI・UX] [種類:不具合] [実行:対話] [起票:2026-09-25] [領域:サイト]

- **証拠 (2026-09-25 UI 全面点検 `UI-FULL-SWEEP-01`)**: 390px でブログ記事 (`/blog/local-government-debt-burden`・`/blog/beer-peak-month-july-to-december`) の図表と `/areas/13000/population-dynamics` のサンキー図の文字が約 5px。県ページ・県×テーマ・`/japan/education-culture`・市区町村ランキングのヒストグラムで軸の文字が 5〜6px・縦軸に単位が無い。右端の年ラベルの切れ、不等間隔の横軸目盛、ビール記事の凡例の重なり・散布図の県名なし・タイル地図の淡色に白文字、`/themes/real-income` の物価地域差指数の 0 始まりの縦軸。
- **関連**: 検出と修正を回す仕組みは `UI-CHART-TEXT-LOOP-01`、県データブックのグラフは `AREA-DATABOOK-CHART-FIX-01`、縦軸の桁欠けは `CHART-YAXIS-LABEL-CLIP-01`。
- **済 (2026-09-25)**: 縦軸ラベルの左端の切れ (`leftMarginForTickLabels`、`packages/visualization/src/shared/layout.ts`) と省略表記の短縮 (`compactAxisFormat`)。
- **残り**:
  - **本丸 (設計が要る・`chart-component-builder` の範囲)**: D3 のグラフは幅 800 の viewBox で描いて縮小表示するため 390px で文字が約 5px になる。表示幅を ResizeObserver で測り viewBox 単位の文字サイズを逆算し、横軸の年ラベルの間引きもラベル幅と表示幅から決め直す。積み上げ面・折れ線・複合・ヒストグラムを同じ仕組みで直す。
  - ブログの図は静的 SVG なので、図の再生成と R2 反映 (承認が要る) が要る。ブログの折れ線は `.claude/scripts/blog/generate-article-charts.ts` の `genLineChartSvg` が `yMin` を渡さず 0 始まりに固定されるので、data JSON に `yMin` を持たせて渡す。描き直しの後に、R2 の SVG の `svg-title` が汎用語 (「都道府県別ランキング」等) でなく指標名になっていることを確かめる (Kindle の `figure-corrections.ts` のエントリを消す合図)。
  - サンキー図・物価指数の縦軸 (0 始まり) は部品ごとの修正。
- **完了条件**: 軸の文字が 390px で 10px 以上、全グラフの縦軸に単位があり、上記ページで切れ・重なりが無い。

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
- **統合 (2026-10-26 オーナー判断): `UNIT-NOTATION-SITEWIDE-01`** 画面に単位を出す 38 か所を表示用の整形 (`formatUnitForDisplay`) に通し、%/％ の混在をなくす
  - **本文の欠け (2026-11-13 確認)**: この統合のコミットで、元カード 6 行のうち 4 行 (字下げした続きの行と番号付きの手順) が落ちた。着手の前に `git show 47aa651d1^:.claude/todo/backlog.md` で `[UNIT-NOTATION-SITEWIDE-01]` の全文を読み、今の実装と突き合わせて残りを決める。
  - **完了条件**: 週次 page-quality の %/％ 混在が 0 ページ。値の換算はしない (表示の整形だけ)。

### [HUB-LIST-FINDABILITY-01] 一覧ページで目的のものを探しにくい (分類・検索・並び順・日付)
タグ: [UI・UX] [種類:改善] [実行:対話] [起票:2026-09-25] [領域:サイト]

- **証拠 (UI 全面点検 (2026-09-25・本番 44 URL × 7 幅 = 308 枚を撮影、250 枚を目視。`UI-FULL-SWEEP-01`))**: `/survey` は約 100 の調査が分類・検索・並び順の規則なしで並ぶ / `/themes` は 55 テーマが分類なしの同形カード /
  `/blog` は 390〜992px で新着記事が約 2 画面下まで出ない / `/tag/population` の記事カードに日付が無く並び順が分からない /
  `/municipalities` で自分の市町村を探す入口が最下部 / `/areas` は県名だけで数値が無い / カードの題名・説明が「…」で切れる
  (ホーム・カテゴリの新着ブログ・`/themes`・`/survey`。カードの型の統一は `docs/01_技術設計/04_デザインシステム.md`「見本の実測値と部品の仕様」)。
- **完了条件**: 各一覧に分類か絞り込みがあり、並び順の基準が画面に出ている。

### [SURVEY-PAGES-01] 統計調査のページで、調査と関係のない指標が並び、最新年が誤って見える
タグ: [コンテンツ品質] [種類:不具合] [実行:対話] [起票:2026-09-25] [領域:データ]

- **証拠 (UI 全面点検 (2026-09-25・本番 44 URL × 7 幅 = 308 枚を撮影、250 枚を目視。`UI-FULL-SWEEP-01`))**: 高: `/survey/census` (国勢調査) の代表ランキングと全 307 件の一覧に、道路実延長・粗出生率・消防ポンプ・警察費など
  他の調査の指標が並ぶ。中: 「最新 2024 年」と出るが国勢調査の最新回は 2020 年。中: 道路実延長 (1km² 当たり) の単位が「km」。
  中: 1024px の代表ランキング 4 列で 1 位の数値に地図が重なって見える (解像度が低いため要実機確認)。
- **次**: 調査との紐付けを出典ベースで見直す (`.claude/rules/survey-linkage-standards.md`・`/audit-survey-linkage`)。最新年は調査の実施年から出す。
- **完了条件**: `/survey/census` に国勢調査由来の指標だけが並び、最新年が 2020 年と表示される。
- **統合 (2026-10-26 オーナー判断): `SURVEY-TAXONOMY-WIRING-01`** 調査・出典のタクソノミーの配線を点検し、UI で直す
  - 調査・出典のタクソノミーが画面まで正しくつながっているかを確かめ、ずれていれば UI 側で直す。（出典: 2026-09-25 の手書きメモ・vault dairy/2026-09-25）

### [PRODUCTS-PAGE-CONTENT-01] 商品ページで中身が分からず、購入の判断ができない
タグ: [収益化] [種類:改善] [実行:対話] [起票:2026-09-25] [領域:商品]

- **証拠 (UI 全面点検 (2026-09-25・本番 44 URL × 7 幅 = 308 枚を撮影、250 枚を目視。`UI-FULL-SWEEP-01`))**: 高: `/products` の Kindle 書籍カードの多くが「販売中の旧版です。新版は審査中…」の定型文で、内容が分からない。
  中: `/products/data-p-01` の「含まれるもの」がファイル形式の列挙だけで、収録指標・年次・見本が無い。低: 表紙画像が無い。
  「14 点の編集可能データ」に「個別分析サービス」が混ざる。
- **注意**: note・商品販売レーンは「維持」。新作や新チャネルは足さず、既存商品の説明の是正だけを行う。
- **進み (2026-11-10)**: `/products/data-muni-manufacturing` に、比べる・構成・変化・ファイルの中身の見本 (11 枚) と実際の収録内容を載せた (commit `149629f56`)。全商品へ広げる仕組みとゲートは `PRODUCT-LP-SHOWCASE-01`。
- **次 (2026-11-12 オーナー指示)**: 既存の有料データ商品14件で、仕事や作業に即した用途・共通型の画像付き作成例・実納品に沿う収録内容・上下の購入案内を整える。サイトLPとnote無料部分の初稿をタブで1件ずつ目視し、画像の読みやすさ・見出し階層・余白・画面幅ごとの表示を直す。公開順と価格実験の保留解除は PRODUCT-LP-SHOWCASE-01、実物との不一致は PRODUCT-PACK-CONTENT-MISMATCH-01 を正本とする。今回のデータ商品初稿の確認だけで、Kindleの説明是正も完了したとしない。
- **完了条件**: 各商品に固有の内容紹介と収録内容・見本があり、定型文だけのカードが 0 件。

### [GA4-FULL-MEASUREMENT-01] GA4 を全ページで使い切る (計測の是正 → 文脈・操作・成果 → API 登録 → 週次集計・BigQuery)
タグ: [インフラ・計測] [種類:改善] [実行:対話] [起票:2026-09-26] [領域:管理]

- **済み (2026-09-26)**: Phase 0〜5 は完了 (計測の是正、文脈・操作・成果のイベント、Admin API での登録、週次 GA4 snapshot の追加ファイル、効果判定エンジンの `ga4-improvement` adapter)。計測の不連続は `data/releases/2026-09-26-ga4-measurement-v2.json`。GA4 → BigQuery 連携 (project stats47・米国・daily のみ・課金なし = sandbox で 60 日自動削除) と読み取り SA への BigQuery 権限も付与済み。
- **見送り (2026-09-26 判断)**: Geo の pathname 書き換え (2026-09-05 に意図して入れた共有 URL 形式のため)、survey / affiliate 集計への Japan フィルタ追加 (実験の観測期間中で比較基準がずれるため)、NSM snapshot の旧定義の改名。
- **残り**:
  - **Phase 6**: `fetch-ga4-bigquery.mjs` で週次集計 (journeys / search-terms / unregistered-params / session-depth)。`analytics_463218070.events_*` が出来ていることを確かめてから作る。課金の有無を確認し、クエリに `maximumBytesBilled`。
  - 別件 (オーナー判断): `kakkom@stats47` がプロジェクトのオーナー権限と鍵を持つ (未使用なら鍵を削除するか)。
- **完了条件**: `npm run google-admin:audit-api` で Phase 4 の全件が confirmed-registered、key events 4 件、BigQuery link 1 件、拡張計測の二重 page_view 警告なし。次の日曜 snapshot に Phase 5・6 の新ファイルが出る。

### [AREA-DATABOOK-CHART-FIX-01] 県データブックの「推移」グラフの点数不足と、スマホで読めない文字・単位なしの軸を直す

タグ: [UI・UX] [種類:不具合] [実行:対話] [起票:2026-09-25] [領域:サイト]

- **背景 (2026-09-25 `/areas/13000` 実測)**: 「有効求人倍率の推移」は 2022年度の 1 点、「1人当たり県民所得の推移」は
  2020〜2021年度の 2 点だけで推移として機能していない (e-Stat をその場で読むグラフ。台帳 `areas.databook-template` の
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

### [UI-CHART-TEXT-LOOP-01] チャートの文字のはみ出し・重なりを座標で検出し、起票から修正・本番確認までのループに乗せる

タグ: [UI・UX] [種類:改善] [実行:対話] [起票:2026-09-25] [領域:サイト]

- **背景 (2026-09-25 実測)**: `/areas/13000` の `StackedAreaChart` で縦軸の目盛りが左に 4〜12px 切れ (`computeMarginsByRatio` の固定幅比)、note のビール月別折れ線 SVG (`b-kakei-beer-peak-month/data/beer-months-by-year-timeseries.svg`、`svg-builder` の `line.ts`) で凡例と斜めの月ラベルが重なる。スクショでは 1 文字の欠けを読めないので、**文字の外枠の座標で機械判定する**。
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

### [AREA-SPECIALTY-IMAGES-01] 都道府県ページの特産品画像が未生成で頭文字タイルのまま

タグ: [コンテンツ品質] [種類:制作] [実行:対話] [検証:週次 page-quality の degraded_images が prefecture-detail で 0] [起票:2026-09-23] [領域:サイト]

- **owner**: area-curator (対象の確定) / image-prompt-curator (画像)
- **実測 (2026-09-23)**: 600 URL の試運転で 12 県・21 枚の `app/areas/<code>/specialty/*.webp` が R2 で 404 (例: 07000 nameko / 10000 brix-nine・aka-imo / 12000 tomisato-suika・shiro-takenoko / 22000 midori-mai・kajiki / 24000 ise-hijiki・ao-sanori)。画面は `SpecialtyImage` が頭文字タイルに切り替えるので壊れては見えないが、写真が出ていない。全件の件数は次回の週次監査の `degraded_images` で確定する。
- **次**: 週次結果から欠落の全リストを出し、台帳 `areas.editorial` の特産品と照合して画像を用意するか、画像を持たない表示に統一する。
- **完了条件**: 週次監査の `degraded_images` が 0、または画像を出さない設計に決めて代替表示を正式化している。
- **決定 (2026-10-26 オーナー)**: 頭文字タイルの正式化はせず、欠けている画像を用意する。次は週次監査の `degraded_images` から欠落の全リストを出し、image-prompt-curator で生成する。

### [CI-SPEED-STATIC-GATES-HEAVY-STEPS-01] Static Gates の重い step (Commit-back Contract 115 秒 / SEO Meta Factual 46 秒) を軽くするか scheduled へ寄せる

タグ: [インフラ・計測] [種類:改善] [実行:対話] [検証:node .claude/scripts/lib/check-runtime-budget.cjs] [起票:2026-09-18] [期日:2026-11-30] [領域:管理]

- **経過記録の整理 (2026-10-25)**: 2026-09 以前の経過と完了済みの記録を削除した。削除前の全文は `git log -p -- .claude/todo/backlog.md` で辿れる。

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
- **統合 (2026-10-26 オーナー判断): `DOCS-CHECK-CI-SPEED-01`** docs のチェック CI に時間がかかっているのを短くする
  - `docs:check` のどこに時間がかかっているかを測ってから直す。（出典: 2026-10-07 の手書きメモ・vault dairy/2026-10-07）

### [CI-SPEED-PRECOMMIT-TRIM-01] pre-commit を「秒単位のもの」だけに削り、metric config 時の `npx tsx` 直列 6 本と image pipeline 検査を preflight:pr / CI へ寄せる

タグ: [インフラ・計測] [種類:改善] [実行:対話] [検証:node --test .claude/scripts/lib/__tests__/preflight-commit.test.mjs .claude/scripts/lib/__tests__/pre-commit-guard-paths.test.cjs] [起票:2026-09-18] [期日:2026-11-30] [領域:管理]

- **owner**: devops-runner
- **問題**: `apps/web/scripts/pre-commit-checks.sh` は metric config が staged だと `validate-metric-years` / `validate-metric-config` / `audit-seo-meta-facts --only` (R2 ネットワーク) / `validate-polarity` / `generate-runtime-metric-summaries --check` / `generate-ranking-prominence --check` の `npx tsx` 6 本を直列に走らせ (Windows PC で 12 分の記録: memory `project_two_machine_local_footprint_2026-09`)、`.github/workflows/*.yml` か `package.json` が staged だと image pipeline の vitest + 型検査と `docs:check` が発火する。これらは develop-quality-gate / Static Gates でも走るので最大 3 重実行。2026-10-29 の実測では所要時間を出すのが「commit 共通静的検査」だけで、他の段の重さを記録から特定できない。
- **オーナーの問い (2026-10-29)**: Windows で検査を丸ごと外すと、CI で見つかるまでに別 PC・並行セッションが壊れた develop を取り込む (memory `feedback_develop_had_no_ci_gate`) ので外さない。代わりの案: ① 全段に所要時間を出して重い上位を特定する (ここから始める)、② CI (`develop-quality-gate.yml`) と同じ検査だけを Windows では pre-commit から外して preflight:pr / CI に任せる、③ コミットは軽い検査にして push 前に `npm run preflight` を 1 回、④ リポジトリのフォルダをウイルス対策の検査対象から外す (IT 部門の許可が要る。Claude は変えない)。
- **次**: pre-commit に残すのは commit-msg / 一時ファイル掃除 / secret 走査 / file-url・import.meta guard / `preflight-commit.mjs --commit-static` だけにする。metric config 系 6 本は `preflight:pr` に集約し、`npx tsx` の起動を 1 プロセスにまとめる runner を検討する。`package.json` を image pipeline / docs の trigger から外す。
- **停止条件**: 外した検査が CI 側 (develop-gate または Static Gates) に無いものは外さない (`CI-DEVELOP-GATE-COVERAGE-01` の症状を再発させない)。
- **完了条件**: metric config 1 件 + workflow 1 件を staged した commit の pre-commit が Mac で 10 秒以内。

### [MEDIA-AFFILIATE-RELEASE-01] 媒体別画像と記事別アフィリエイト監査を公開まで完了する

タグ: [コンテンツ品質] [種類:改善] [実行:対話] [検証:npx tsx .claude/scripts/ads/audit-affiliate-relevance.ts --check] [起票:2026-09-17] [領域:アフィリエイト]

- **owner**: chart-author（ブログ・note画像）/ affiliate-manager（関連性判断）/ devops-runner（検証・公開段取り）
- **次（実行順）**: ①develop→main反映後、`regenerate-blog-svgs` workflowをdry-runし、全ブログのmobile画像生成結果とギャラリーを目視する。②承認後、対象を限定してR2へexact publishし、PC/mobileの切替を代表記事で確認する。③`data/affiliate/relevance-latest.json`の270候補を意味レビューし、必要な記事だけ理由付きで`BLOG_AFFILIATE_POLICY`へ追加する。④既存note画像をmobile方針で再生成・差替えし、note本文の視認性を監査する。⑤web全テストを再実行し、survey timeout 1件・product OGP 2件・right-rail contract 1件が再現する場合は今回の変更と分離して起票する。
- **禁止**: 候補270件を機械判定だけで一括変更しない。テスト契約を弱めない。ユーザー承認なしにdeploy・R2 write・note公開を実行しない。
- **完了条件**: ブログのPC/mobile画像が全対象で生成・目視・公開確認済み、note既存画像の差替えと監査が完了、関連性候補が全件レビュー済み、今回変更に属するwebテストがgreenである。

### [THEME-SELECTION-BACKFILL-01] ThemeCatalogの選定根拠(selection)未記入540件を夜間の無人バッチで白書・公式統計から裏付ける

タグ: [エージェント・SSOT] [種類:改善] [実行:windows] [検証:npm run validate:catalog --workspace=@stats47/data-configs] [起票:2026-09-16] [領域:データ]

- **owner**: theme-designer (catalog の書き手) / theme-researcher (調査) / validator は data-configs scripts
- **背景**: `validate:catalog` の `no-adoption-criteria` warn (2026-09-16 に 539 件) を夜間バッチで裏付ける。agent は統計指標コードを誤記することがあり (7 件中 2 件)、呼び元の受け入れ検証で捕捉する。`expanded.ts` の tuple で定義されるテーマの置き場は `selection-evidence.ts`。経過の全文は `git log -p -- .claude/todo/backlog.md`。
- **次 (実行順)**:
  1. `nohup setsid bash .claude/scripts/themes/run-selection-backfill.sh --push-develop > .local/selection-backfill/<日付>.log 2>&1 &` (worktree は自動で origin/develop にリセットされ、残件は catalog から都度再導出される。stop 条件到達の exit 3 も commit + develop へ rebase push まで進む)
  2. 翌朝: report の「gate 不合格」「資料なし」を人が処理する。「role の推奨」の処理は `THEME-ROLE-REVIEW-01`
  3. session limit のリセット時刻 (前回 12:40am JST) をまたいで回すと最も長く継続できる。1 晩で終わらなければ翌晩も繰り返す
  4. Windows PC で回すなら pdftotext (poppler) を入れる。無ければ PDF 出典は到達性のみで通る (`skipped-pdf`)
- **完了条件**: `no-adoption-criteria` = 0、role 推奨リストの人間処理完了 (ratchet 配線は完了)
- **停止条件**: 1 晩の gate 不合格率 > 30% (prompt か gate の問題なので続行しない)、枠エラー 3 連続
- **禁止**: 夜間バッチによる role 変更・rejectedCandidates への追加・`git commit --no-verify`・gate 未通過の selection の書き込み

### [THEME-ROLE-REVIEW-01] 夜間backfillのrole変更提案を人が採否判断しThemeCatalogへ反映・サイトへ展開する

タグ: [エージェント・SSOT] [種類:意思決定] [実行:対話] [検証:npm run validate:catalog --workspace=@stats47/data-configs] [起票:2026-09-17] [領域:データ]

- **owner**: theme-designer (採否判断・`data/themes/catalogs/<theme>.json` 編集) / 最終承認はユーザー
- **背景**: `THEME-SELECTION-BACKFILL-01` の調査は selection の裏付けだけでなく、副産物として
  「今の role (primary/secondary/context) は適切か」の判定も出す。夜間バッチは role を
  書き換えない (禁止事項) ので、人の採否判断とカタログ編集を挟まないとサイトに届かない。
- **role が画面に効く範囲 (2026-11-12 実測で訂正)**: 10/31 の章立て以降、指標カードは metricGroups の並びで出るので
  role を変えてもカードの指標は消えない (`ThemeMetricsDashboard.tsx` の「role に関わらず値を出す」)。
  primary は先頭 2 件がページの題・説明文・FAQ の数字に入り (`theme-seo.ts` の `LEAD_LABEL_COUNT`)、
  先頭が `defaultRankingKey` になる。context は関連テーマの重みが 0 になる。**例外: 追加章 (`candidate-*` の
  metricGroup) の指標を context にするとカードから届かなくなる** (`metric-groups-reachability.test.ts` が落ちる)。
  判断の軸は「primary = 題に入れて検索に効くか・1〜3 件に収まるか」「context = 読み違いの実際の理由があるか」
- **進捗管理 (2026-09-17 新設)**: `.claude/scripts/themes/build-role-review-queue.mjs` が
  全 `reference/audits/*-selection-backfill.md` の「role の推奨」を横断集約し
  `data/themes/role-review/{role-review-queue.json,LATEST.md}` へ書く。夜間 run が自動で再構築する
  (driver に配線済み)。**「反映済み」は手動フラグでなく `THEME_CATALOGS` の実際の role と
  recommended の一致で自動判定する** (手動フラグはドリフトする)。判断は `role-review-decisions.json`。
  2026-11-12 にオーナー承認で 48 件を処理 (applied 23 / rejected 27、pending 0)。カタログ反映と検査は済み、
  develop push と本番デプロイ (下の 6・7) を待つ。以後は夜間 run が足した分を同じ手順で捌く
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

### [SNAPSHOT-EDGE-PURGE-GAP-01] snapshot 同期後にエッジが旧 HTML を配信し続ける

タグ: [種類:不具合] [実行:対話] [起票:2026-08-17] [領域:管理]

- **owner**: Claude Code
- **症状 (2026-08-17 実測)**: `sync-snapshots --only ranking-items` 完走後も `/ranking/marriages-per-total-population` の `<title>` が旧値のままだった。R2 と Worker は正しく (`?cb=<random>` で迂回すると新 title・MISS)、Cloudflare エッジだけが stale (`cf-cache-status: HIT`)。origin は `max-age=0, must-revalidate` を返すのにエッジが HIT を返すので、Cache Rule が Edge TTL を上書きしている。エッジにエントリが無い URL は新値が出るので、「1 ページ直ったから反映済み」と判断すると取りこぼす。
- **構造**: ページ経路のエッジコピーを消す手段がリポジトリ内に無い。`purge-worker-cache.ts --all` (sync-snapshots の後段) は Workers Cache のみ、`purge-cache.ts` (`purge-cdn.yml`) は `storage.stats47.jp` のみで、`purge_everything` でもページの `age` はリセットされなかった。デプロイすれば buildId が変わって消える (2026-08-17 に実測) ので、「snapshot 同期だけして数日デプロイしない」期間が stale の危険窓になる。
- **次**: (1) Cloudflare ダッシュボードで stats47.jp のゾーン ID と Cache Rule の Edge TTL を確認する (オーナー領域。`CLOUDFLARE_ZONE_ID` が storage 用の別ゾーンを指している可能性を含む)。(2) ページ経路に届く purge 手段を決める (正しいゾーン ID での purge / Cache-Tag / `--files` のホスト対応のいずれか)。(3) 決まったら `sync-snapshots` に配線する。
- **完了条件**: snapshot 同期の次のデプロイ後に本番 `<title>` を Googlebot UA で実測して新値になっている (代表 2 URL 以上)。判断できるまでは同期後の実測手順を SKILL に残す。
- **停止条件 / 承認境界**: ゾーン全体 purge は本番のキャッシュを一斉に落とすので、恒久配線はオーナー承認を経てから。Cloudflare の設定変更も outward-facing。
- 関連: `.claude/skills/db/sync-snapshots/SKILL.md` / `packages/r2-storage/src/scripts/{purge-worker-cache,purge-cache}.ts`

### [THEME-EXPANSION-IMPLEMENT-01] 地震曝露の住宅部分に使える全国空間原典を確保する

タグ: [コンテンツ品質] [種類:改善] [実行:対話] [起票:2026-09-09] [領域:データ]

- **対象**: 候補105の住宅部分。現在の採用範囲と未充足は [全体実装記録](../state/metrics/themes/2026-09-10-all-expansion.json) の `scopeCounts` / `validation.next253Tsunami29.scopeAudit`、採否は [候補カタログ](../skills/theme/research-theme-catalog/reference/theme-feasibility-catalog.json) のdecisionを正典とする。
- **owner**: theme-designer（採用判断）／open-data-curator（原典探索）／data-ingester・gis-pipeline-runner（取得・空間集計）。
- **次・実行順**: ①住宅を直接数える全国空間原典を公式提供元で確認し、版・単位・住宅の定義・地域カバレッジ・利用条件を記録する。②利用可能ならJ-SHISとの空間対応、県別途中artifact、保存則を実装・検証する。③採用指標と章へ接続し、生成物・実表示・本番反映を同じ対象で確認する。
- **停止条件**: 全国住宅の原典が確保できない間は未充足を維持する。人口・一般世帯・建物棟数を住宅戸数の代用にしない。PLATEAU等の部分カバレッジを全国値にしない。原典未発見を全国に存在しないという断定にしない。
- **完了条件**: 住宅部分を原典から再現でき、定義・時点・空間集計・配信値の整合を検証し、候補105のdecisionと全体実装記録へ証拠を反映する。公開後の計測と品質観測は `THEME-EXPANSION-EFFECT-01` へ接続する。

### [NOTE-BODY-QUALITY-PILOT-01] スマホで読める本文画像・配置・導入・出典・導線を6記事で試作する

タグ: [コンテンツ品質] [種類:改善] [実行:対話] [起票:2026-10-16] [領域:商品]

- **旧ID**: `NOTE-ARTICLE-QUALITY-PILOT-01` (2026-10-18 改名。調査記録 `data/note/evidence/note-article-quality-audit-20261016.json` は旧IDのまま)
- **owner**: note-manager（本文・導線と公開段取り）/ chart-author（決定的な統計図）
- **調査と方針**: 上記 evidence、`docs/30_note記事企画/note戦略.md`「本文品質の改善方針」。既存note画像是正の実行単位として `MEDIA-AFFILIATE-RELEASE-01` ④へ接続する。カバーの残計画は `NOTE-COVER-IMAGEGEN-ROLLOUT-01`。
- **済み (〜2026-11-02)**: 管理画面 `/ops/image-templates`・`/ops/image-library`・`/product/content-quality` と R2 保存・照合・復元の基盤は実装済み (契約は `apps/admin/README.md`)。家計3都市の note/X/IG を共通4:5（1080×1350）の同一画像候補として private R2 に登録済み (候補 ID1188〜1193、`/sns?scope=candidates&q=a-kakei`、6件とも下書き・承認待ち)。散布図・地域色分け地図の4媒体見本も追加済み (`image-templates.json` v4)。全7型とも基本形は未確定。
- **画像型の再開地点**: `/ops/image-library?q=MOBILE-PILOT-01` の6候補（ランキング・地理形状地図・散布図を各2枚）を採択・修正し、型の方針を確定する。家計は固定した検討見本の表示と候補採用を分け、`candidateMatches=false` で隠さず4媒体に表示できるようにする。note2記事の色の説明・順位・30℃未満の記述の矛盾、散布図2記事の過去入力復元の確証を解決してから公開する。その後に全件を標準適合・再生成・個別判断・入力不足へ分類する。青の統一・旧候補再確認・未登録媒体の試作も継続。
- **分類の再開地点**: `/ops/image-library?queue=classification` と `/ops/image-templates?template=table&medium=compare&purpose=ranking`。SNSの未分類347枚 (旧Drive原本の取得・照合待ち215・保存原本の記録なし129・現行型に確定できない3) を継続する。分類履歴・個別方針は `data/content-operations/quality.json` の画像レコード、noteカバーは既存専用台帳。分類の確定と品質合格・公開採用を混同しない。
- **保全の残作業**: `data/content-operations/live/image-migration.json` (正本は private R2、`npm run media:state:pull`) の未取得をDrive接続端末で `media:migrate -- --all --verify-existing --apply` により再開する。不一致は元ハッシュの画像を回収するまで停止。note-only本文回収は `NOTE-BODY-RECOVERY-01`。元データ未保全の図は値を推定せず入力を回収する。台帳上の保存記録は全記事の固定数値・図版入力が揃う保証ではない (根拠は evidence の `imageReproducibility`)。
- **対象候補（3記事ずつ・試作の上限）**: ①`recovered-n80e58a01f660`・`recovered-nf962c6702b93`・`recovered-n023501038bd5`。②`a-kakei-aichi`・`recovered-n03e45e40d3a7`・`d-geo-ipss-prefecture-map`。
- **次・実行順**: ①stats47の最新完全な期間集計を取得し、対象・維持記事・既存下書き・最近のカバー変更時刻を固定する (取得失敗を古い正常値で隠さない)。②前半3記事の旧図と候補を390px/320pxで比較する。③見出しと図の対応、短い導入、記事末の出典、主CTA1つ＋副最大2つを本文差分として提示する。④後半3記事へ型を適用し、マガジンの実所属と読む順を確認する。⑤承認された記事だけ保存・公開し、同じURLで図とカードの表示・クリック先を読み戻す。
- **再発防止の実装候補**: 既存render-spec/入力SHA/単位・年/版の検査を再利用し、重複画像・CTA件数・指標と商品の対応・公開カードの空欄を検査する。意味の一致・縮小後の読みやすさは目視。未実装gateを実装済みと扱わない。
- **画像基盤の完了条件案**: 元データ/生成条件/完成画像の不足を区別し、当時の固定値でのデザイン更新と最新データ更新を別操作にする。代表図を別端末で復元・再生成し、対象利用先と旧新比較を辿れること。カバーのAI生成は別契約を維持し、統計図に流用しない。
- **関連タスク**: 空欄カードの復旧結果 `data/note/evidence/note-card-repair-result-2026-10-26.json`、導線は `NOTE-CIRCULATION-CTA-01`、マガジン整理は `NOTE-MAGAZINE-REORG-01`。先に全件のカード修復やマガジン作成を再実行しない。
- **停止条件・公開境界**: 管理画面・台帳・R2画像保存の実装と旧画像の検証付き移行は承認済み。数値・原典・集計単位が不一致、既存下書きがある、カードの公開表示が確認不能、本文の別変更を巻き込む場合は当該記事を止める。note公開・R2正本更新は差分レビューと当該反映指示後。統計図をimagegenで描かない。SNS下書きの承認・予約・公開は変更しない。
- **完了条件**: 最大6記事で修正前後・採用図版・本文差分が確認され、承認対象だけ公開実測を通る。対象外本文・価格・公開状態を保持。共通生成・検査・保存手順を次記事でも再利用できる。効果観測を行う場合は最新baseline・対象・交絡・指標・期限を揃えて既存改善台帳へ引き渡す。記事内クリック・読了が未取得なら判定不能と明記する。画像制作だけで公開・効果検証を完了扱いにしない。

### [NOTE-CIRCULATION-CTA-01] note回遊とCTAのcatalog駆動化

タグ: [種類:改善] [実行:対話] [起票:2026-07-18] [領域:商品]

- **owner**: Claude Code
- **計測の前提**: 2026-08-27の別アカウント混入記録は使わない。stats47をassertした2026-09-07〜10-04集計は完全（当時286記事）だが、10-12のlatestは取得失敗。最新の対象範囲で再取得してから効果比較する。記事内クリックは現collectorで取得できず、PVをクリックと扱わない。
- **次**: `NOTE-BODY-QUALITY-PILOT-01` の対象から意味の一致を確認する。2026-10-16の公開確認では、日照記事に農地転用、県民所得記事に衣服物価を「この記事の元データ」と案内していた。カテゴリの一致だけで商品を割り当てず、指標・年・粒度・収録ファイルの対応を検証する。重複CTAと空欄カードも同じ公開面で確認する。
- **trigger**: 正常なstats47の集計と公開導線の対応が揃い、少数対象の差分をレビューできること。
- **完了条件**: 記事、マガジン、stats47 CTAの対応をcatalogから決定的に生成し、全記事一括変更しない。
- **統合 (2026-10-26 オーナー判断): `NOTE-MAGAZINE-REORG-01`** note既存投稿のマガジン再編成 + 新規投稿の増産
  - **本文の欠け (2026-11-13 確認)**: この統合のコミットで、元カード 34 行のうち 30 行 (字下げした続きの行と番号付きの手順) が落ちた。着手の前に `git show 47aa651d1^:.claude/todo/backlog.md` で `[NOTE-MAGAZINE-REORG-01]` の全文を読み、今の実装と突き合わせて残りを決める。
  - **残り**:
  - **残 36本** (resume): catalog で `status:"draft"` の stats47-note 27 + koumuin-claude-code 9。`npx tsx -e 'import {NOTE_ARTICLES} from "./.claude/scripts/note/catalog/index.ts"; console.log(NOTE_ARTICLES.filter(a=>a.status==="draft"&&a.r2Body!==false&&a.vertical!=="product-sales").map(a=>a.vertical+"/"+a.key).join("\n"))'` で残スラッグを列挙。1本 ~5分・実 Chrome 占有・Bash 10分上限で1回2本程度。resume 可 (published は skip)。
  - **完了条件**: 公開済み記事が note.com 上でマガジンに束ねられ、新規投稿が catalog のカテゴリマガジンに自動で割り当たること。記事一括変更しない (1 マガジンずつ実証)。
  - **停止条件 / 承認境界**: note.com への実反映 (マガジン作成・記事割当・新規公開) は outward-facing。人手ログイン + オーナー承認を経てから。SSOT は catalog git TS、note.com は反映先。

### [MIGRATION-FLOW-PHASE23-01] 人口移動 月次/年次 workflowの生成ステップ未実装

タグ: [種類:不具合] [実行:対話] [起票:2026-08-01] [領域:データ]

- **owner**: Claude Code
- **次**: `migration-flow-monthly.yml` のPhase 3 (highlight抽出・render) と `migration-flow-annual.yml` のPhase 2 (e-Stat取得・47県render・caption・staging copy) を実装し、実装できたcronだけscheduleへ戻す。
- **完了条件**: 生成ステップが `.local/r2/sns/migration-flow` を実際に作り、手動dispatchでR2 pushとIG投稿まで通ることをdry-runで確認したうえで `on.schedule` を復活させる。復活時は `docs/01_技術設計/06_自動化インベントリ.md` のschedule表へ戻す。
- **停止条件**: 生成が未実装のままscheduleを戻さない (毎月の確定failureに戻るため)。

### [ISSUE-AXES-01] 問いの台帳の分析の軸を全件に付け、テーマ・県・ブログへ展開する

タグ: [種類:改善] [実行:対話] [起票:2026-11-10] [領域:コンテンツ]

- **owner**: Claude Code (`/manage-issue-ledger`)
- **正典**: 軸の書き方は `docs/01_技術設計/03_情報設計.md`「問いの台帳」、規則は `.claude/scripts/issues/issue-graph-core.mjs` の `resolveAxesFigure`。確認は `npm run issues:check -- --axes`
- **済み (2026-11-10)**: active な問い 291 件すべてに軸を付けた (headless `label-issue-axes.ts` の下書き、API 換算 計 $0.57)。図の型が 1 つに決まったのは 156 件 (散布図 119・タイル地図 109・折れ線 31・棒 26・積み上げ棒 5・滝の図 1。件数は主図の数え方の都合で重複なし)。下書きの見直しで、時間を説明側にした誤り・県の食卓の書き方の揺れ・内訳を説明側に置いた J13 を手で直した。対応表は Fable 5.1 のレビューで「図の型の台帳 (purposes・renderer) から引く」形にし、群の区分は `group: true` で明示する形にした (指標が無いことを区分と読み替えると、量の指標が棒グラフに回るため)
- **済み (2026-11-10 追記)**: 軸のデータを参照の形 (`data`: `{metric, grain?}` / `{series}`) にし、実在を `check-datasets` の refs、粒度を `issues:check` が見るようにした。県の値しか無い指標を市区町村・全国の問いが指していた 50 参照は `grain` を明示し、「図が決まる」は 156 → 139 件、「別粒度」35 件になった
- **残り**: ⓪ 「別粒度」33 件。市区町村の問い 27 件は、同じ意味の市区町村の指標が無い (率と件数の違い・年齢と性別の絞り込みの違いを含む。A12・C04 だけ置き換えた)。全国の問い 6 件 (K03-1・K03-2・K04-1・K05・K05-2・K08-1) は、使う品目の全国の時系列が家計の分析単位 (`kakei-analysis-catalog.ts`) に無い。どちらも指標か分析単位を足すまで「別粒度」のまま残す (e-Stat の値の確認が要る) ① 「未検証」133 件は `npx tsx packages/ai-content/src/scripts/label-issue-axes.ts --fill` を端末で実行して下書きし、見てから `--apply` する (2026-11-10 の空実行で候補のある問い 118 件・候補 0 件 15 件。データの無い側にだけ足す)
- **完了条件**: 未検証が 0 か、残りに指標が無い理由が書かれている。②③④ の検査が PR CI で走る

### [KAKEI-EXPANSION-02] 家計調査2025 refreshと残品目

タグ: [種類:制作] [実行:ユーザー] [起票:2026-07-10] [領域:データ]

- **owner**: Claude Code
- **正典**: 切り口台帳 `data/surveys/lenses/kakei-chousa.json` (品目の採否は `data/estat/kakei-ledger/decisions.json`)。2025年次の都市表ID・コードの詳細は `.claude/skills/estat/references/household-expenditure-survey.md`。
- **到達 (〜2026-11-02)**: 2025年年報の公表を確認し (trigger 充足)、上位5品目と安全に接続できる指標を2025年表 (支出額 `0004023605`・数量 `0004023606`) へ更新して R2 に反映、PR #1205 を main へ統合した。旧表に残っていた 6 指標も新表へ移し、エンゲル係数・情報通信係数も 2025 年へ伸ばした。ネクタイ・ストッキングは 2025 年改定で統合されたので 2024 年が最終と注記。3 年平均は指標にせず、記事の接地器 `.claude/scripts/blog/fetch-kakei-city-average.mjs` (52 市・N 年平均) で扱う。流入上位の記事 (餃子・豆腐・カレールウ・もち・小麦粉) を書き直し、パンの 52 市 3 年平均の新記事を足した。
- **進み (2026-11-09)**: ① の流入上位 6 本 (チョコレート・すし・緑茶・即席麺・清酒・牛肉) は公開済み。続けて直近 4 週の GSC 表示順の上位 15 本 (京都の食卓・こんにゃく・給食費・豚肉・こんぶ・さつまいも・みそ・小麦粉・ミネラルウォーター・生うどんそば・鶏肉・アイス・福島の食卓・もも・チーズ) を書き直し中。残りは約 109 本で、同じ順で 15 本ずつ進める。書き直しで分かったこと: 本文が他の指標の順位 (外食・乾麺・醤油など) を引いている記事は、`refresh-article-data-years.mjs` が図の指標しか取り直さないので、他指標の順位も 2025 年で数え直す必要がある (福岡の家庭と外食の逆転が成り立たなくなり、醤油は g と ml を取り違えていた)。リンク先の `blog:udon-soba-food-culture-prefecture-map` は 2024 年の値のままで、リンク元の生うどんそばの記事と数値が食い違う。
残り (2026-11-13・審査と公開の作業中): 11-10 に headless (sonnet・effort low) で書き直した 109 本のうち 13 本 (cup-noodles と 12 県の食卓) は 11-10 に公開済み (`63e744a78`)。残り 96 本は退避ブランチ `wip/kakei-stale-rewrite-2026-11-09` と develop の `contents/blog/` にあり、オーナー決定 (11-13) で「blog-critic の審査で PASS した記事だけ公開」。headless の critic が PASS にした 30 本を blog-critic で審査し直すと PASS は 9 本だけだった (差し戻しは題や結論が順位データと矛盾・題の約束に本文が答えていない)。headless の PASS を公開の根拠にしない。費用の実測: full 審査 1 本約 16 万トークン、修正と再審査 1 本約 34 万。再開は、review.md が `reviewer: blog-critic`・`verdict: PASS` の記事だけ `published: true` にして develop へ push、`verdict: REVISE` は Workflow `blog-revise-fix`、`reviewer: headless-critic` のままの記事は `blog-critic-followup` から。
書き直しの道具の不足 (2026-11-09 の 15 本で実測): ① `refresh-article-data-years.mjs --apply` は `-dark.svg` を作らず gate が落ちる (`generate-article-charts.ts --slug` を続けて実行して補う) ② ランキング以外の図と派生図 (時系列・数量×価格) は「手作業」に回る ③ `build-kakei-quantity-price.mjs --base-dir` に絶対パスを渡すとリポジトリ直下の `var/` に書く ④ 本文に書く前年の値を data に置く場所が無く、quality-gate の `VALUE_MISMATCH` 警告になる。家計調査の市別の値は単年のぶれが大きい (前年比 50% 超が 846 件中 69 件) ので、単年の順位から構造を断定しない書き方を書き手に渡す。
- **次**: ① 題に旧年の値が残る記事の流入上位の残り (チョコレート・すし・緑茶・即席麺・清酒・牛肉 など。一覧は `node .claude/scripts/blog/find-kakei-stale-title-values.mjs`) を書き直す。こんにゃくは図 1 枚が手作業 (data JSON が取得器の形でない)。② 合算6件を個別照合し、分類変更5件は新定義に合わせて採否を決める。③ 記事URLの公開判定 (PR #1206) とデプロイ後の全体スモークの失敗 10 件 (変更前と同じ) は別途是正。
- **停止条件**: 未投入の2025値を公開ページへ書かない。3年平均を年次値の指標として代用しない。既存記事の年・図の更新はランキングの値が確認できてから行う。
- **完了条件**: 既存metricの年次更新を検証し、需要確認済みの追加候補だけが小バッチの投入判断に到達する。

### [ACTIONS-EXPRESSION-INJECTION-01] workflow の式インジェクション残 11 件

タグ: [種類:不具合] [実行:ユーザー] [起票:2026-07-30] [領域:管理]

- **owner**: uruhayato373 (人間の PR でのみ着手できる)
- **★backlog-loop では閉じられない**: 対象が `.github/` だけで、ループの verify はそこを禁止パスにしている (workflow を書き換えられるとループが自分の制限を緩められるため)。人間の PR で 3-4 本ずつ進める。
- **背景**: `${{ inputs.x }}` を `run:` の中へ直接展開している箇所。private repo で dispatch 権限者は push もできるため実効的な権限昇格ではないが、衛生上の負債。**この負債は CodeQL に検出されていない** (`.github/workflows/security-scan.yml` の `languages` に `actions` が無い)。「CodeQL が出たら workflow の式インジェクション」と早合点しない (2 度誤診した)。
- **済 (2026-10-06 第 1 弾・未発火)**: `fetch-metrics-weekly` / `migration-flow-weekly` / `sns-weekly-report` / `blog-remediation-daily` を step の `env:` 経由に書き換えた (actionlint exit 0)。各 workflow を 1 回発火させる確認は未実施。
- **次**: 残りの `blog-auto-publish` / `publish-ai-content` / `sync-snapshots` を `env:` ブロック経由に書き換える (`data-refresh.yml` が手本)。併せて `languages` に `actions` を足すか判断する (足すと残件が一斉に critical で出るため、書き換えを先に済ませる)
- **完了条件**: 上記走査で 0 件、かつ actionlint exit=0
- **制約**: 1 PR で全 workflow を書き換えない (デプロイ経路の workflow が多く、壊すと配信が止まる)。3-4 本ずつに分け、変更した workflow は実際に 1 回発火させて確認する

### [CHART-LINEAGE-RESIDUAL-01] 元データ喪失図表の手動系譜残件

タグ: [種類:不具合] [実行:対話] [起票:2026-08-12] [領域:データ]

- **owner**: Claude Code
- **対象の正典**: `data/blog/svg-lineage-queue.json` の `residualCard === "CHART-LINEAGE-RESIDUAL-01"` (2026-08-27 時点で非タイルマップの手動判断残件 93 枚)。現行のranking自動復元器が確証できる残件は0。
- **散布図の残り 5 枚と律速**: `international-cooperation-volunteer-map/{travel,foreign-pop}-vs-volunteer-scatter` (「国際協力ボランティア率」の metric が SSOT に無い)、`per-capita-income-gap/income-vs-industry-scatter` と `purchasing-power-adjusted/income-vs-price-scatter` (1人当たり県民所得の現行基準が `isActive:false` / 値未投入。`data/data-refresh-requests.json` で 2021 年度取り込みを要求済)、`foreign-residents-diversity-map/manufacturing-vs-foreign-scatter` (X 軸の算出式と年次を特定できない)。
- **タイルマップの残り 6 枚**: `per-capita-income-gap/income-map`・`purchasing-power-adjusted/income-map` (県民所得)、`international-cooperation-volunteer-map/volunteer-rate-map` (ボランティア率)、`alcohol-prefecture-map/alcohol-consumption-map`・`food-consumption-prefecture-battle/ramen-gyoza-tilemap`・`waiting-children-progress/waiting-children-map` (指標・年次の同定が要る)。上の 3 記事は両方の図が同じ SSOT 欠落で止まっているので、指標を投入して先に片付ける。
- **次**: ① 県民所得の取り込み結果を確認し復元 ② 国際協力ボランティア率の e-Stat 表を `estat-researcher` で特定 ③ 製造業の算出式は記事本文の記述から再構成できるか確認する
- **統合 (2026-10-26 オーナー判断): `TILEMAP-LINEAGE-01`** タイルマップの手動系譜残件
  - **本文の欠け (2026-11-13 確認)**: この統合のコミットで、元カード 10 行のうち 7 行 (字下げした続きの行と番号付きの手順) が落ちた。着手の前に `git show 47aa651d1^:.claude/todo/backlog.md` で `[TILEMAP-LINEAGE-01]` の全文を読み、今の実装と突き合わせて残りを決める。
  - **次**: (a) 元データ消失 7 枚 → SSOT から復元する。(b) 年不確定 2 枚 → 人が年を決めてから固定する。
  - **完了条件**: 123 枚すべてが `lintTileGridQuality` + `lintSvgSize` を error 0 で通る。
- **完了条件**: `chartType === "scatter" && status !== "both"` の非正準が 0 枚 (測定: S3 実体を読む。公開 URL は `max-age=14400` で最大 4 時間古い)
- **禁止**: SVG のピクセル座標から値を逆算して data json にしない (`blog-data-schema.md` §1.7)。一致率が足りないまま「だいたい合っている」で復元しない。復元できないなら記事から図を外す

### [GEO-SOURCE-PUBLISH-PERF-01] Geo原典の生成・公開時間を計測し、検証強度を保って待ち時間を減らす

タグ: [インフラ・計測] [種類:改善] [実行:対話] [検証:cd apps/web && npx vitest run scripts/geo-source-publish.test.ts] [起票:2026-09-13] [期日:2026-09-20] [領域:データ]

- **owner**: gis-pipeline-runner（生成・再開）／r2-publisher（公開契約）／devops-runner（CI）
- **状態・着手時期**: 実装未着手。次回Geo原典更新前に計測・設計から着手する。期日は初回設計の確認期限。
- **実測根拠**: [Geo run 34726806521](https://github.com/uruhayato373/stats47/actions/runs/34726806521) (2026-09-13) は準備42分29秒・dry-run 37分07秒・apply/readback 2時間41分53秒の計4時間01分29秒で、17,717件・2,199,375,814 bytesを公開し全件照合に成功。再取得は `gh run view 34726806521 --repo uruhayato373/stats47 --json jobs`。
- **コード根拠・未計測部分**: `apps/web/scripts/geo-source-publish-core.ts` (`buildExactPlan`) は変更対象1件につき計6回のHEADを行う構造で、共有処理は `packages/r2-storage/src/scripts/push-exact-r2-assets-core.ts`。`mapGeoSourceBatch` は4件固定バッチの全終了待ち。`.github/workflows/geo-source-publish.yml` は準備・dry-runもglobal `r2-write` lock内に置き、楽天公開の待ち要因になる。対象コードのdevelop pushは全件再生成・公開を発火する。実API数・HEADや解凍の時間寄与・短縮率は未計測。
- **次（実行順）**: ①phase別の壁時間、件数、API種類別回数、最大同時数、転送bytes、lock待ちを記録し、上のrunを比較元に固定する。②最大4件のworker poolで空き枠を継続利用し、失敗検出後の新規dispatch停止とin-flight完了待ちをテストする。③候補の重複解凍・HEADの整理を計測結果から選ぶ。④原典SHA＋生成コード＋schemaに結び付いた検証済み生成物の再利用・再開を設計し、失効条件と失効時の再生成を固定する。⑤コードpushは検証、公開は明示scopeのCIへ分離する。準備と書込lockの分離は、巨大artifactの保存・転送・復元時間と費用を含めて採否を決める。
- **保持する契約・停止条件**: 全scope検査を最初のPUTより前に完了し、ETag条件PUT、gzipとdecoded両方のSHA、S3とcache-bust付き公開HTTPの全件照合、catalog-lastを保持する。purge後のcanonical検証 (索引51件＋50ページの代表GIS) は実行時の対象キー・件数を記録し、全GISのcanonical GET完了とは扱わない。変更分への同強度検証と定期全件監査は別契約とし、後者を前者の代用にしない。scope漏れ、再利用の失効判定不能、異常後の新規dispatch、検証強度低下、転送込みの時間・費用悪化があれば採用を止める。短縮率の予測を成果にしない。
- **完了条件**: 対象テストで並行上限4・失敗後停止・ETag変更・gzip/decoded不一致・scope漏れ・生成物失効・catalog順序の異常を拒否し、同一scope/bytesの比較可能なCIで全フェーズと待ち時間・API数・転送量の変更前後を残す。変更なし／一部変更／再開／全件監査の各経路で、必要な公開対象と同強度検証の取り落しがない。未採用案は実測理由を残し、実測短縮が確認できるまで高速化完了としない。
- **既存カードとの境界**: `R2-VALUES-REUPLOAD-01` は一般snapshotのmanifest持ち越し、`BUILD-PERF-PHASE34` はアプリCI cache・型検査の重複が対象。本カードはGeo原典生成からexact公開・再開・書込lockまでを扱う。

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

| priority | candidate_slug | category | suggested_theme | estat_stats_data_id | rationale | status |
| --- | --- | --- | --- | --- | --- | --- |
| high | outpatient-consultation-rate-total | socialsecurity | healthcare | 0004026105 | 患者調査2023 cat01=1,cat03=4。既存テーマに全傷病の外来受療率がない | pending |
| high | inpatient-consultation-rate-total | socialsecurity | healthcare | 0004026105 | 患者調査2023 cat01=1,cat03=1。外来と対で医療アクセスを比較できる | pending |
| high | ambulance-dispatch-count | safetyenvironment | healthcare | 0000010111 | SSDS K1210、47県。救急搬送の基礎指標 | pending |
| high | infant-mortality-rate | socialsecurity | healthcare | 0003411730 | 人口動態統計2024、47県。既存healthcareの結果指標を補う | pending |
| high | average-household-members | population | population-dynamics | 0003414255 | 国勢調査2020 cdTab=1390、47県。人口動態テーマの世帯構造を補う | pending |
| high | working-age-population-ratio | population | population-dynamics | 0000010201 | SSDS #A03502、2024。年齢構造の基礎比率 | pending |
| high | juvenile-offenders-count | safetyenvironment | safety | 0000010111 | SSDS K4204、2023、47県。千人比は別calculated metricで扱う | pending |
| high | average-job-tenure | laborwage | labor-wages | 0003426933 | 賃金構造基本統計 cat04=01,cat03=01、47県 | pending |
| high | equivalized-disposable-income-gini | economy | real-income | 0003440743 | 全国家計構造調査2019表7-6、cat01=1（OECD新基準準拠）、47県・小数値 | pending |
| high | nursing-home-count | socialsecurity | aging-society | 0000010210 | SSDS #J022011、2023、既存4指標と非重複 | pending |
| high | life-time-use-series | laborwage | living-housing | 0000010113 | SSDS生活時間。sleep/housework/mealsのcdCat01確定後に個別keyへ分割する | pending |
| medium | household-head-average-age | economy | consumer-prices | 0003348239 | 家計調査2024、県庁所在市52件。都道府県値と誤認しない表示設計が必要 | pending |
| medium | fishery-species-catch-salmon | agriculture | fishery-marine | 0003425253 | さけ・ます類、2019、cat01=100-150。鮮度を明示する | pending |
| medium | fishery-species-harvest-nori | agriculture | fishery-marine | 0003425258 | のり類養殖収獲量、2019。既存魚種テーマの欠測 | pending |
| medium | fishery-species-harvest-oyster | agriculture | fishery-marine | 0003425257 | かき類養殖収獲量、2019。既存魚種テーマの欠測 | pending |
| medium | housing-seismic-retrofit-count | construction | safety | 0004025509 | 住宅土地統計2023 cat03=15。「耐震化率」ではなく改修実施戸数として扱う | pending |

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

### [GEO-UIUX-SPEED-01] Geo ページの UI/UX と表示速度を見直す
タグ: [UI・UX] [種類:改善] [実行:対話] [起票:2026-09-27] [領域:サイト]

操作のしやすさと表示速度の両方を実測してから直す。（出典: 2026-09-24 の手書きメモ・vault dairy/2026-09-24）
- **統合 (2026-10-26 オーナー判断): `GEO-UI-READABILITY-01`** 地域分析 (Geo) のページで表・数値・用語が読者に読めない箇所を直す
  - **本文の欠け (2026-11-13 確認)**: この統合のコミットで、元カード 16 行のうち 13 行 (字下げした続きの行と番号付きの手順) が落ちた。着手の前に `git show 47aa651d1^:.claude/todo/backlog.md` で `[GEO-UI-READABILITY-01]` の全文を読み、今の実装と突き合わせて残りを決める。
  - **完了条件**: 上の高・中の項目が直り、`/geo` 系の代表 5 ページを 390 / 768 / 1440px で撮影して確認する。
  - **残り**: ① 小数 4 桁の人口 (「1,203,780.9571人」) は、`GeoLandslideAudit` の保存則の検証表と地図ポップアップにある。検証表は

### [ESTAT-CATALOG-SSDS-DERIVE-01] `ssds-candidates.json` を e-Stat カタログから導出し、find-metrics に未登録候補の索引を足す

タグ: [インフラ・計測] [種類:改善] [実行:対話] [検証:node --import tsx .claude/scripts/estat/catalog.mjs search 人口] [起票:2026-10-05] [領域:データ]

- **経緯**: `ESTAT-CATALOG-01` の完了時 (2026-10-05) に残した手順 6。カタログ (R2 `estat-catalog/manifest.json`) の整備と消費側の配線は済んでいる。
- **次**: git 内の `data/estat/ssds-candidates.json` を catalog の `index/tables/` から再生成する形に置き換え、
  find-metrics に「未登録の候補」を引ける索引を足す。読み手を `git grep ssds-candidates` で洗い出してから進める。
- **完了条件**: `ssds-candidates.json` が catalog 派生の生成物になり (手編集の入口が無い)、find-metrics で未登録候補が 1 件以上引ける。

### [RANKING-REINDEX-01] 復帰 56 ranking (5 週連続 GSC imp 0) の coverageState を URL Inspection で確定し、未収録なら sitemap 再送信する

タグ: [インフラ・計測] [種類:改善] [実行:対話] [起票:2026-10-05] [領域:サイト]

- 2026-10 月次計画で improvements から降格。再開条件: 56 キーを明示指定した一回限りの URL Inspection を実行できる時。再送信のデプロイ日が確定したら 56 キーを列挙した `[gsc-page:]` と target を付けて improvements に戻す (`[kpi: search-clicks]`)。
- 2026-09-07 実測: 日次 URL Inspection の 251 キーに復帰 56 キーが 1 件も含まれない (500 件/日ローテーションが当たっていない)。

### [BLOG-SEO-TYPES-01] D2/F/G を含む記事型ポートフォリオの 4 週効果を既存 A 型と比較する

タグ: [コンテンツ品質] [種類:改善] [実行:対話] [起票:2026-10-05] [領域:サイト]

- **再開条件**: 索引に入り公開 4 週以上の記事が各型 5 本以上になった時。topic-queue (`data/blog/topic-queue.json`) の done を型ごとに分け、`gsc-query.mjs` / `data/gsc/snapshots/<週>/pages.csv` の型別コホート比較 (合計・中央値・表示 0 の本数) で判定し、gsc-improvement log へ記録する (`[kpi: search-clicks]`)。効果判定エンジン対象外 (型別コホート比較)。
- **2026-10-08 集計の要点**: done 81 本 (A 29・B 12・D2 23・F 7・G 10) の 28 日で、D2 は 23 本中 22 本が表示 0。URL Inspection では D2 の大半が「検出 - インデックス未登録」か「認識されていません」で、差は記事型の効果ではなく索引に入っていないことによる。
- **[仮説]** D2 は 09-01〜09-02 に 23 本を一度に出したため、Google が発見したまま巡回を後回しにしている。**検証**: `node .claude/scripts/gsc/url-inspection-daily.cjs` の日次が D2 の 23 本を含む回で状態を数え直す。**期日 2026-10-25 (超過)**: D2 の過半が「検出 - インデックス未登録」のままなら、sitemap の lastmod と内部リンク (ランキングページから記事への導線) を調べる。
- **統合 (2026-10-26 オーナー判断): `BLOG-SEO-QUEUE-01`** topic queue 起点の記事が需要候補を正しく選び、公開後に検索表示を得たか確認する。done 各記事の表示が 0 か 1 以上かを同じ比較で数える。
  - **本文の欠け (2026-11-13 確認)**: この統合のコミットで、元カード 7 行のうち 4 行 (字下げした続きの行と番号付きの手順) が落ちた。着手の前に `git show 47aa651d1^:.claude/todo/backlog.md` で `[BLOG-SEO-QUEUE-01]` の全文を読み、今の実装と突き合わせて残りを決める。

### [FUNNEL-CTA-01] 非表示にした ranking 末尾の商品案内を、商品・導線・計測を整えて再評価する

タグ: [UI・UX] [種類:改善] [実行:対話] [起票:2026-10-05] [領域:サイト]

- **判断 (2026-11-12 オーナー指示)**: 「e-Stat × Claude Code 完全ガイド」の案内をランキング共通レイアウトから外す。商品展開と導線を整えてから再評価し、自動では再表示しない。
- **根拠と限界**: 保存済み GA4 `data/ga4/snapshots/2026-W44/` (2026-10-04〜10-31) は `cta_click` 全体 11 件、ランキングページ 3 件。ただし、この商品案内へのクリックとは特定できない。`product-referrals` は 0 行だが商品計測追加 (11-03) より前の期間で、クリック率 0 と判断しない。旧カードのカスタムディメンション未登録は 09-24 時点の記録であり、再開時に最新の保存済み計測で確認する。
- **再開条件**: 想定購入者・解決する業務・無料情報との差・販売内容を説明でき、関連するランキング面からの導線を定義できること。計測が有効な期間と判定基準をそろえ、オーナーが限定的な再表示を判断する。
- **実行順**: ① 商品と対象読者、案内するページ、購入先を整理する ② `data/note/magazines.json` の `koumuin-estat-claude-code` と ID で結び、表示可否・対象面・リンクを既存の商品台帳へ統合する (専用 TS の URL やカテゴリ列挙に戻さない) ③ `PRODUCT-REFERRAL-MEASURE-01` と連携し、商品 ID・配置別の表示→クリックと販売実績を確認する。遷移先の購入まで追跡できない場合は限界を明記する ④ 期間・継続/停止条件を先に決め、関連性の高い面だけで試す。
- **停止条件**: 購入理由・対象面が未確定、表示数の分母や商品別クリックが取れない、または試行の停止条件に該当した場合は非表示を維持する。
- **完了条件**: 台帳からの配線と計測を確認し、限定試行の結果から継続・修正・撤去を判断して記録する。全ランキングへの一律再表示を完了扱いにしない。

### [STP-AI-WATCH-01] AI Overviews による雑学系流入の侵食を四半期で定点観測する

タグ: [インフラ・計測] [種類:改善] [実行:対話] [起票:2026-10-05] [領域:サイト]

- 2026-10 月次計画で improvements から降格。再開条件: 2026-10 の四半期観測枠。手順: S1 代表クエリを GSC finalized 期間で固定 → 重複しない期間の clicks/impressions/CTR/position を比較 → AI Overviews 表示有無が取れなければ「S1 CTR 低下の観測」に限定 → 対照群と比較し持続的低下のみ次候補を最大 3 件 (`[kpi: search-clicks]`)。
- 効果判定エンジン対象外 (S1 代表クエリ群と S2・S3 対照群の query 集合比較)。

### [DATA-FOOD-SELF-SUFFICIENCY-MAFF-01] 都道府県別食料自給率 (カロリーベース) を農水省の公表値から取り込み、2022 年度以降を足す

タグ: [コンテンツ品質] [種類:改善] [実行:対話] [起票:2026-10-05] [領域:データ]

- **経緯**: `DATA-QUALITY-LOOP-01` 第 2 週 (2026-10-05) で切り出した。`food-self-sufficiency-rate-calorie` は SSDS `I3301` 経由で 2008〜2021 年度だけを持つ。農水省「都道府県別食料自給率」(https://www.maff.go.jp/j/zyukyu/zikyu_ritu/zikyu_10.html) は令和 6 年度 (概算) まで公表済みで、長期推移 xlsx (`attach/xls/zikyu_10-7.xlsx`) が 1998〜2024 年度を収録する (北海道 2008 年度の 210 は R2 と一致、2026-10-05 確認)。
- **次**: 取得元を農水省の xlsx に切り替える (`fetcherKey: "manual"` か新しい取得経路)。`.claude/rules/data-provenance-standards.md` の provenance 9 点セットを先に書き、概算値と確定値の区別を年ごとに保持する。SSDS 由来の 2008〜2021 年度と重なる年は値の一致を検査してから置き換える。
- **完了条件**: 2022 年度以降が 47 県そろって R2 に入り、provenance が監査 (`/audit-provenance`) を通り、ランキングページの最新年が更新されている。

### [DATA-MEDICAL-FACILITY-SOURCE-01] 医療施設調査の 6 指標を原典の e-Stat の表から取り、2024 年以降を足す

タグ: [コンテンツ品質] [種類:改善] [実行:対話] [起票:2026-10-21] [領域:データ]

- **経緯**: `DATA-QUALITY-LOOP-01` ③ (2026-10-21) で切り出した。`psychiatric-bed-count` を含む 6 指標 (`psychiatric-bed-count`・`psychiatric-hospital-count`・`general-hospital-count`・`general-hospital-bed-count`・`general-clinic-count`・`dental-clinic-count`) は SSDS の医療施設調査の 6 項目 (`I510110`・`I510120`・`I5102`・`I5103`・`I521110`・`I521130`) から取り、2023 年で止まっている (`data/estat/availability/tables/0000010109.json`)。原典は令和7年 (2025) まで公表済み (`https://www.mhlw.go.jp/toukei/list/79-1a.html`、2026-10-21 取得) で、配信は 2 年遅れている。
- **次**: ① e-Stat の医療施設調査 (政府統計コード 00450021) の 2024 年の表 (候補: 「第4表 病院の病床数，年次・都道府県別」`0004048403`、2026-03-11 公開) の分類コードを e-Stat API の getMetaInfo で調べ、6 指標それぞれの項目と時点が SSDS と同じかを確かめる。この PC には e-Stat API の資格情報が無く (取得は CI 専用)、全国集計の表はローカルの表カタログにも分類が無いので、CI で任意の表のメタ情報を取る経路を作るか、資格情報のある端末で行う ② 一致したら 2024 年以降を `supplementalSources` で足す (漁業の指標と同じ形) ③ SSDS と重なる 2023 年は値の一致を検査する ④ data-refresh の dryRun → オーナー承認 → R2 反映。
- **停止条件**: 項目の定義や時点が SSDS と合わない年は足さない。R2 への反映はオーナー承認後。
- **完了条件**: 6 指標が公式の最新年まで 47 県そろって R2 に入り、ランキングページの最新年が更新されている。

### [DATA-FLOOD-STATS-FILES-01] 水害統計の 9 指標に 2015 年以降を足すかを決める (e-Stat のデータベースは 2014 年まで)

タグ: [コンテンツ品質] [種類:改善] [実行:対話] [起票:2026-10-21] [領域:データ]

- **経緯**: `DATA-QUALITY-LOOP-01` ③ (2026-10-21) で切り出した。`flood-affected-rivers` を含む水害統計の 9 指標は e-Stat「都道府県別水害被害（表－2）」`0003155647` (2006〜2014 年分のみ、DB の更新は 2022-10-04 が最後) から取り、ランキングは 2014 年の値を出している。国土交通省は令和5年水害統計まで公表している (`https://www.mlit.go.jp/river/toukei_chousa/kasen/suigaitoukei/index.html`、2026-10-21 取得)。
- 年カバレッジ監査が要拡張候補とする 4 年 (2007・2009・2010・2013) は 44〜46 県しか値の無い年で、値の無い県を 0 として扱ってよいかは確かめていない。
- **次**: ① 2015〜2023 年の都道府県別の値が、どこに (e-Stat のファイル・国交省のページ) どの形で出ているかを確かめる ② 取り込むなら、取得元の切り替え (`fetcherKey: "manual"` か新しい取得経路) と provenance を先に設計する (`DATA-FOOD-SELF-SUFFICIENCY-MAFF-01` と同じ進め方) ③ 公表の「-」が被害なし (0) を意味するかを調査の注記で確かめ、47 県そろわない年の扱いを決める。
- **停止条件**: 「-」の意味を確かめずに 0 で埋めない。R2 への反映はオーナー承認後。
- **完了条件**: 取り込むか見送るかを決め、取り込む場合は 9 指標が公式の最新年まで R2 に入っている。

### [DATA-ROAD-LENGTH-SOURCE-01] 道路統計年報の 10 指標を最新の年報まで取り、年の表記を時点に合わせる

タグ: [コンテンツ品質] [種類:改善] [実行:対話] [起票:2026-10-21] [領域:データ]

- **経緯**: `DATA-QUALITY-LOOP-01` ③ (2026-10-21) で切り出した。道路実延長 7 指標 (`road-total-length`・`road-total-length-with-expressway`・`road-national-route-length`・`road-prefectural-route-length`・`road-general-prefectural-length`・`road-municipal-length`・`road-expressway-length`) と舗装道路 3 指標 (`paved-road-total-length`・`paved-road-main-length`・`paved-road-municipal-length`) は SSDS の `H71xx` から取り「2023 年度」で止まっている。SSDS の「2023 年度」は 2023 年 3 月 31 日時点 (道路統計年報 2024 年版) で、国交省の最新は 2025 年版 (2024 年 3 月 31 日時点) なので配信は 1 年古い。
- **年の表記**: 配信は「2023 年度」と表示し、`road-total-length-with-expressway` は「3月31日現在」と注記している。この 2 つを合わせて読むと 2024 年 3 月 31 日の値に見えるが、実際は 2023 年 3 月 31 日の値である。
- **次**: ① 道路統計年報 2025 年版 (表 2 道路現況総括表・表 3 道路実延長内訳の総括表など。国交省のページは xlsx だけ) から 2024 年 3 月 31 日時点の都道府県別の値を取り込むか、SSDS の次の更新を待つかを決める。取り込むなら取得元の切り替えと provenance を先に設計し (`DATA-FOOD-SELF-SUFFICIENCY-MAFF-01` と同じ進め方)、SSDS と重なる年は値の一致を検査する ② 年の表記を時点に合わせるか (例: 「2023 年 3 月 31 日現在」)、注記を直すかをオーナーが決める。10 指標と SEO タイトルに効くので一括で行う。
- **停止条件**: 年の表記は、オーナーが決めるまで変えない。R2 への反映はオーナー承認後。
- **完了条件**: 10 指標が最新の年報の時点まで R2 に入るか、待つと決めて理由が書かれている。年の表記が時点と食い違わない。

### [DATA-LAYOUT-MOVE-01] 置き場を data/<取得元>/ へ移した後、定期実行が新しい置き場へ書くことを確かめる

タグ: [エージェント・SSOT] [種類:改善] [実行:対話] [検証:npm run check-datasets] [起票:2026-10-06] [進行中] [領域:管理]

- **済み (2026-10-06〜07)**: 移動は 2 段階とも main まで反映した (PR #1086・#1088、`npm run check-datasets -- --moves` が 0 行)。置き場の区分・`AGENT_STATE`・移す手順は `.claude/rules/data-storage.md`。旧パスの参照と `data/` 直書きは `datasetPath(id)` / `datasetDir(id)` に置き換え、`check-datasets` が新しい直書きを止める (例外は `DATA_LITERAL_EXEMPT`)。PSI 日次・Cloudflare 日次・SEO キーワード・認証付き計測の書き込みは確認済み。
- **次**: 次の定期実行が新しい置き場に書き、旧置き場に書いていないことを、run の commit-back の差分で確かめる。
  日次: GSC URL 検査 (`data/gsc/coverage-remediation`・`data/gsc/url-inspection`)・Instagram 投稿 (`data/sns/ig-posted-log.jsonl`・
  `data/sns/posts.json`)・Threads 確認・AI 解説 (`data/ai-content`)・workflow 健全性 (`data/ci`)・backlog-loop (`data/gsc`・`data/page-quality`)。
  週次: 土曜の page-quality・内部リンク・出典・ランキング整合・e-Stat 年カバレッジ、日曜の `fetch-metrics-weekly` (`data/` 全体) と
  search-growth・affiliate GA4、月曜の improvement-cycle。
  オーナーの Mac / Windows の launchd ジョブ (SNS・A8) は `git pull` 後に新しい置き場へ書く。
- **未決**: SEO の日次系列 (`data/seo/rank-history/`・`selections/`) の保持期間 (`prune-state-snapshots.test.mjs` に「保持期間は未決」で宣言)。
- **完了条件**: 上の日次・週次の定期実行がすべて新しい置き場へ書いた (期日 2026-10-13)。

### [ESTAT-YEAR-AVAILABILITY-01] e-Stat の実在年を data/ の台帳で管理し、設定の years を「除外だけ」にする
タグ: [インフラ・計測] [種類:不具合] [実行:対話] [起票:2026-10-07] [領域:データ]

- **背景**: `years` 1 つに「e-Stat にある年 (事実)」と「見せないと決めた年 (判断)」が混ざり、D1 時代の取り込みと 2026-05-28 の D1 → R2 移行 (`ba298ec5a`) で年の穴が固定されていた。事実は実在年の台帳 `data/estat/availability/tables/<statsDataId>.json` (要約 `LATEST.md`・`diff.json`)、判断は理由の種類 (`kind`) 付きの `yearExclusions` に分け、`sync-estat-years.ts` が `years` を合わせ、PR CI (`Metric Years Gate`) と週次の台帳の取り直しで保つ形にした (第 2 段 `f6c06c75c` は main に入っている)。
- **2026-10-30 まで**: 未判断の除外 421 件を外して年を戻し (`dd824aed5`、オーナー指示「利用できるデータは全て利用する」)、data-refresh run 40953107078 で 420 件を R2 へ取り込んだ。`LATEST.md` (2026-10-30) は取り込み忘れ 0・新しい年 0・範囲より前 0・未判断の除外 0。
- **残り**:
  ① `private-life-insurance-contracts-per-1000` は通信の失敗で未取り込み。取り込み直しの依頼は `b7a0c6181` で `data/data-refresh-requests.json` に積んだので、反映を確かめる。
  ② 取り込み中に `employment-insurance-daily-receipt-rate` (単位 %) の最大値が 1,545.5 → 5,025 に増えた (allowlist は legitimate で通過。中身は未確認)。
  ③ `LATEST.md` の「e-Stat に無い年がある」13 件と「台帳なし・取得失敗・打ち切り・重複行」1 件 (`convenience-store-sales` の `timeScope` 未指定) を解く。年の問題より取り出し条件の問題が多い (職業別年収は設定 2010 年〜だが条件 0003445758 は 2020 年〜など)。
  ④ 単年の旧監査 (`audit-estat-year-coverage.ts` と `YEAR-COV-*` の自動起票・`assert-year-coverage-batch.ts`) は一部の県だけの年の判断にしか使わなくなったので、backlog-loop とのつながりを外して廃止するかを決める。
  ⑤ 市区町村の値 (`cities.json`) も台帳の差分の対象に載せるかを決める (今は報告だけ。ページへの配線の残りは `YEARS-DOWNSTREAM-FOLLOW-01`)。
- **禁止**: 確かめていない年を設定に書かない。外す年を `years` から手で消さない (`yearExclusions` に理由付きで書く)。R2 の再取り込みを承認なしに行わない。
- **完了条件**: PR #1094 がマージされ、本番の R2 で客室稼働率が 2009〜2024 年の 16 年分を配信し、`LATEST.md` の 4 分類が 0 件のまま週次で保たれ、未判断の除外が 0 件になる (`years` は手で書く許可リストではなく台帳から機械で合わせる列にした)。
- **関連**: `THEME-SINGLE-YEAR-CARDS-01` (単年カード 287 枚の多くはこの穴が原因)、`YEAR-COV-*` の自動起票 (台帳の差分に置き換える)。

### [YEARS-DOWNSTREAM-FOLLOW-01] 指標の年が増えたあと、AI 解説・ブログ・計算型 metric・年固定の比較カードが古い年のまま残るのを直す
タグ: [コンテンツ品質] [種類:不具合] [実行:対話] [起票:2026-10-07] [領域:サイト]

- **背景**: years を台帳から合わせる (`ESTAT-YEAR-AVAILABILITY-01`) と最新年が変わる指標が出る。ランキング・テーマの推移図・指標カード・データブック・市区町村ランキングは毎月の `data-refresh.yml` で追従するが、① ランキングの AI 解説 ② ブログの本文・図 ③ 計算型 metric の `item.latestYear` ④ テーマの年固定の比較カード (`comparisonYear`) は追従しなかった。
- **済み (2026-10-07・#1095 / #1096 / #1097、マージ済み `ced09d767` / `d781bf064` / `c541e9447`)**: ① キューが解説の yearCode と最新年を比べ `needs-regen` (reason `stale-year`) に戻す ③ `calculated-stats` を `ranking-items` の前へ移した ② blog snapshot に `rankingRefs` と逆引き `rankingArticleIndex` を焼き、図の年が古い記事を `data/blog/stale-data-years.{json,md}` に日次で出し、`refresh-article-data-years.mjs` で `kind: ranking` の図を最新年で作り直す。是正キューに `data-refresh` レーン、brushup の focus `最新データ更新`。意図して古い年を描いた図は source.json の `yearPinnedReason` で外す ④ `comparisonYear` を起点の年とし、全指標に値がそろう最新年へ実行時に進める。
- **次**:
  ① sync-snapshots の blog task 後に `stale-data-years.md` の件数・キューの `data-refresh` 件数・ランキングの関連記事を確かめる (2026-10-30 の `stale-data-years.md` は 27 件)。
  ② data-refresh レーンを `/brushup-blog --target queue` (focus `最新データ更新`) で消化する。一覧は `data/blog/stale-data-years.md`。2026-10-07 の振り分けで自動で取り直さない例外: `healthy-life-expectancy-male-female-gap` の `healthy-life-expectancy-female-prefecture-rankings` は alt (男女の散布図) と中身 (男性の棒グラフ) が違うので図を作り直す。`physical-therapist-annual-income-prefecture-gap` は 2023 年に順位が大きく入れ替わり結論から書き直す。`dairy-cattle-count`・`it-industry-concentration` はタイトルも年を含む。手順解説 (cc-estat・ai-claude-code) は本文に引用した AI の出力例の数値も直す。
  ③ 年が 1 年だけのカードを推移へ戻すかは `THEME-SINGLE-YEAR-CARDS-01` で扱う。
- **完了条件**: 新しい年が R2 に入った翌週に、AI 解説が新しい年で作り直しの対象になり、古い年のブログ記事が一覧と是正キューの data-refresh レーンに出て、計算型のランキングが 1 回の data-refresh で新しい年を表示し、テーマの比較カードが新しい年を描く。

### [THEME-SINGLE-YEAR-CARDS-01] 1 年分しかない指標のカード 287 枚を、年の拡張か年固定の比較カードへ振り分ける
タグ: [コンテンツ品質] [種類:改善] [実行:対話] [検証:npx vitest run packages/data-configs/src/theme-catalog/__tests__/selection-viewpoints.test.ts] [起票:2026-10-07] [領域:データ]

- **背景**: 管理画面 `/quality/theme-viewpoints` の視点 `single-year-as-trend` で、テーマのカードが 1 年分の指標だけを持ち推移を描けない。年カバレッジ監査の要拡張候補 (`data/estat/year-coverage/LATEST.md`) と重なるが、テーマのカードに出る指標を先に回す仕組みが無い。
- **① 振り分けの結果 (2026-10-08、44 テーマ 281 枚・270 指標)**: e-Stat に複数年ある 63 指標・69 枚は、years を広げる uruhayato373/stats47#1094 (draft、11-06 のテーマ実験の観測の後のマージを推奨) で複数年になる。本当に 1 年だけの 62 指標・65 枚は、多くが調査回ごとに表が分かれる統計 (国勢調査・経済センサス等) の 1 回分で、前の回が別の表にあるかは未確認。未確認の 145 指標・147 枚はすべて `source.kind: external` (manual 142 等)。
- **次**: ② #1094 のマージ後に件数を数え直す。③ 65 枚は前の回の表を確かめ、無ければ年固定の比較カードへの提案 (`theme-proposal-format.md`) にする。147 枚は external の出典を指標ごとに確かめる (テーマのカードに出る指標から順に `YEAR-COV-*` と同じ 10 件ずつ。`sync-year-coverage-backlog.mjs` の並べ方を変えるか個別に扱うかを決める)。
- **禁止**: 確認していない年を `years` に書かない。R2 の観測値の再取得とデプロイは別の承認で行う。
- **完了条件**: `/quality/theme-viewpoints` の `single-year-as-trend` の件数が、振り分け ① の「本当に 1 年だけ」の件数以下になっている。
- **関連**: 年の穴の根本対応は `ESTAT-YEAR-AVAILABILITY-01`。

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

### [GEO-LOW-ELEV-MANIFEST-SHA-01] 標高の低い土地の Geo 分析の manifest が SHA 照合の対象外になっている

タグ: [インフラ・計測] [種類:改善] [実行:対話] [検証:npm run -s geo:audit-low-elevation] [起票:2026-10-08] [領域:データ]

- **事象**: `population-low-elevation` の `manifest.json` は、Python 生成器の整数風キーの並び順が JS の `JSON.stringify` と違うため、Web 側の再直列化 SHA 照合から外されている (2026-10-08 に Geo 担当の subagent が報告。item と pref は照合対象)。
- **次**: 生成器 `packages/gis/src/geo-analysis/low-elevation-population-overlay.py` の manifest 出力を JS と同じキー順にし、Web 側の照合対象に manifest を戻す。
- **完了条件**: manifest も SHA 照合され、キー順を崩した manifest を監査が拒否することを変異で確かめた。

### [PERF-THEME-HTML-SIZE-01] テーマページの HTML を目安 900KB に収める (新テーマ household-food-spending は 2.9MB)

タグ: [インフラ・計測] [種類:改善] [実行:対話] [起票:2026-10-08] [領域:サイト]

- **観測 (2026-10-08、Googlebot UA)**: `/themes/household-food-spending` と `/areas/<県>/household-food-spending` (47 ページ) の HTML が約 2.9MB、`/themes/healthcare` が 1.6MB。基準は `.claude/skills/analytics/performance-improvement/page-quality-budgets.json` の `html_bytes` 900,000 (warning)。初回応答は 10.6 秒。
- **[仮説]** 指標 136 件と、`comparisonYear` を持つ 30 グループの値をサーバー描画で HTML に埋め込んでいる。検証: HTML 内の RSC payload を指標キーごとに数え、グループ数を減らした版をローカルで測る。
- **関連**: Workers CPU の増加調査 `CF-CPU-SURGE-01` の候補「テーマ拡充で 1 ページが重くなった」と同じ現象。
- **完了条件**: 新テーマと healthcare の HTML が 900KB 以下、または目安を超える理由と新しい基準を page-quality-budgets.json に記録する。

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
- **11-01 staging / R2 反映**: 生成器を家計調査レシピと公式値の全ページ取得に対応。55件をすべて2025年まで値レベルで検証し、追加5件を含む60全国系列を7つの日本テーマへ配線した。採用済み55件は `placement-decisions.json` から除き、日本テーマのカタログを正本とした。763ファイルのR2反映と公開URLの全件SHA照合は済み。サイトの公開確認はmainデプロイ後に行う。
- **11-01 サイト確認**: PR #1205 のmainデプロイ成功。`/japan/household-food-spending` と `/japan/household-assets-debt` はGooglebot UAで200を確認し、全国系列の配信元はR2の固定SHA照合を通過。
- **次**: 固定SHAのrelease manifestでR2へ全国系列を反映し、7ページの実表示と導線を確認する。
- **完了条件**: 55 件が /japan に載るか、載せないと判断して placement-decisions.ts に rejected と理由が残る。

### [JAPAN-METRIC-UNIT-AND-RATIO-01] /japan で意味を持たない昼夜間人口比率と、合計特殊出生率の単位「人」を直す

タグ: [コンテンツ品質] [種類:不具合] [実行:対話] [起票:2026-10-09] [領域:データ]

- **済み (2026-10-21)**: 昼夜間人口比率は全国値が常に 100 なので `japan-catalog.ts` から外し、`placement-decisions.json` に rejected で記録した (市区町村のカタログには残す)。
- **残り**: 合計特殊出生率 (`data/metrics/total-fertility-rate.ts`) の unit が「人」だが e-Stat の単位は「‐」(単位なし) で、全国時系列の生成器 (`build-japan-series.ts`) がプレースホルダの単位を安全側で拒否する。表示単位を決める必要がある (「人」のまま生成器に単位なしとの対応を宣言するか、単位を表示しない形にするか)。**オーナーの判断待ち**。決まったら /japan に載せ直す (placement-decisions の blocked 行を消す)。R2 に残る `app/japan/day-time-population-ratio/series.json` の削除は R2 の保持ポリシーの手順で別に行う。
- **完了条件**: 上の 2 件が直り、/japan に意味のない系列が残っていない。

### [CORRELATION-SNAPSHOT-YEAR-ALIGN-01] 相関 snapshot が年の違う値どうしを組み、統制変数も別の年を使っている

タグ: [コンテンツ品質] [種類:不具合] [実行:対話] [起票:2026-10-09] [領域:データ]

- **観測 (2026-10-09・ブログ執筆のワークフロー)**: 農業産出額 (2024 年) と農業就業人口 (2014 年) の組で r=0.762 をランキングページの「相関が高い指標」に出している (同じ年の 2014 年でそろえると 0.758)。
  核家族世帯割合 × 昼夜間人口比率 (2020 年国勢調査) の偏相関は、統制変数に 2025 年の総人口を使っている (`build-correlation-snapshot.ts` の `loadMetric` が統制変数だけ最新年を使う設計に見える)。
- **次**: ペアを作るときに年をそろえるか、年が違うことを画面と snapshot に書く。統制変数の年をペアの年に合わせる。
- **完了条件**: 相関 snapshot の各ペアと統制変数の年が一致するか、食い違いが表示されている。

### [BLOG-DATA-EXEC-CODE-RULE-01] ブログの data/ に再現用の実行コードを置いてよいかを決めて規約に書く

タグ: [コンテンツ品質] [種類:意思決定] [実行:対話] [起票:2026-10-09] [領域:サイト]

- **観測 (2026-10-09)**: `household-structure-daytime-population-gap/data/sensitivity-calc.mjs` が、本文の追加計算 (除外ごとの相関・偏相関・乱数の種) を再現するために置かれた。
  `blog-data-schema.md` は禁止も許可もしておらず、先例はこの 1 件。critic は規約違反ではないと判断した。
- **判断すること**: data/ に置くのは JSON の中間結果だけにするか、実行コードも許すか。許すなら置き方 (名前・R2 へ上げるか) を決める。
- **完了条件**: `blog-data-schema.md` に置き方が書かれている。

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
- **済 (2026-10-08)**: 正誤表 (令和 7 年 8 月 26 日) は全施設の推計値の訂正で、社会・人口統計体系の 4 項目 (従業者数10人以上の施設) とは別系列なので R2 の値をそのまま使う。4 指標の説明の範囲と観光テーマの章の説明は直した。
- **完了条件**: 2026 年の値を取り込んだ 4 指標に、系列の断絶が note と章の説明に書かれている。

### [SSOT-CONSOLIDATION-REST-01] 2026-10-06 の定数集約で見送った重複を、挙動の差を解消してから寄せる

タグ: [インフラ・計測] [種類:改善] [実行:対話] [起票:2026-10-06] [領域:管理]

- **背景**: 2026-10-06 (`77ba6e36a`・`eef2a0a1a`・`0098430a1`) にサイト識別子・都道府県コード・e-Stat URL などの直書き約 470 ファイルを正本参照へ置き換えた。値と意味が完全一致する箇所に限ったので、箇所ごとに挙動が違う重複は残っている。再発止めは `check-maintenance-debt.cjs` の SITE_IDENTITY_LITERAL。2026-10-26 に候補 2・4・5 の一部を寄せた (経過は `git log -p -- .claude/todo/backlog.md`)。
- **候補 (上ほど優先)**:
  1. Windows で別の Playwright profile を読む可能性がある絶対パス直書き: `.claude/skills/sns/publish-x/check-x-scheduled.ts`・`.claude/skills/sns/update-x-profile/update-x-profile.cjs` (publish-x と profile を共有するため見送った)。
  2. 県名の短縮処理: `@stats47/area` の `prefectureShortName` へ寄せた (北海道は落とさない)。残りは単一実装の検査 `packages/area/src/utils/__tests__/prefecture-short-name-single-impl.test.ts` の許可リスト 6 件 (縮小のみ。`packages/svg-builder/src/charts/bar-chart.ts:192` は北海道を「北海」にする) と、TS の正本を import できない `.claude/scripts` の .mjs 18 ファイル。
  3. スクリプトの小さな重複ヘルパー: JST 変換 27、getArg 52、fetchText 20、dotenv 読み込み 27、ブラウザ起動引数 16 (ISO 週は `SCRIPT-ISO-WEEK-UNIFY-01`、Google API の認証は `SCRIPT-GOOGLE-CLIENT-UNIFY-01`)。挙動の差を一覧にしてから共通化するか決める。
  4. データ表の重複: 県庁所在地の座標 3 か所 (精度差)、8・10 区分の地方区分。databook のカテゴリ名と migration-flow の FocusFile 変換は寄せ、港湾は 2026-11-11 に ges の写しを消して台帳 `areas.ports` を読む形にした (配布済みの xlsx は再生成していない)。
  5. remotion の一部・ges・migration-flow は `@stats47/area` などを依存に持たず県リスト等を再定義している (svg-builder と product-factory は宣言済み)。依存を足すか (package-lock の更新を伴う) を決める。
- **2026-10-26 の変更で未確認のもの**: 調査名は解決時にマスタ (`surveys.master`) で上書きしているが、`build-estat-provenance.ts` の出力に旧表記が残る。Kindle の単位検査 (`content-invariants.ts`) を `parseUnit` に変えたあと、既存の版の `verify-epub` は再実行していない。remotion の `shared/utils/choropleth.ts` と `features/geo-x/GeoInsightCard.tsx` は 5 桁の市区町村コードを県コードに寄せるようになったので、次にこの 2 つで画像を作るときに前の版と目視で比べる。
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
- **確認が要る (11-03 の棚卸し)**: 対象の 3 スクリプトは win32 では既に npm-cli を起動する形になっている。Windows で一度通せば閉じられる見込み

### [NOTE-PAID-MANUSCRIPT-SYNC-01] API パッチで変えた有料記事 6 本の private R2 原稿を live 本文に追従させる

タグ: [エージェント・SSOT] [種類:改善] [実行:sweep] [起票:2026-09-20] [領域:商品]

- **owner**: note-manager
- **背景**: 2026-09-20 に `patch-note-paid-landing.mjs` で d-kakei / d-geo 4 本 / 財政 ¥200 の無料部分を live で直接更新した。
  変更内容は `data/note/paid-landing/<key>.json` (git) にあるが、private R2 (`stats47-private/note/…/draft.md`) の原稿は改稿前のまま。
- **trigger**: 有料記事の原稿を private R2 から復元して再公開する作業が発生したとき、または paid-landing spec を持つ記事が 10 本を超えたとき。
- **次**: `npm run note:article -- checkout <key>` で原稿を取り出し、spec 適用後の無料部分を draft.md に反映して `save` する
  (所有者 API の全文から作る `--from-live` が要るなら note-article.mjs に足す)。d-kakei は 2026-10-13 に台帳と private R2 へ入った。
- **完了条件**: spec を持つ全記事について private R2 の原稿 SHA が live 本文から再現できる。

### [MUNI-RANKING-EXPANSION-01] 市区町村ランキング拡充 (全量公開 2026-09-01 実施済み・残は SSDS 未使用分)

タグ: [コンテンツ品質] [種類:改善] [実行:対話] [起票:2026-09-01] [領域:データ]

- **owner**: Claude Code (選定・監査) + オーナー (公開承認)
- **済み (経過の全文は `git log -p -- .claude/todo/backlog.md`)**: 品質監査未了 2 件の判断と SSDS 未使用 733 指標の判定・公開 (2026-10-22、判定の記録 `packages/data-configs/src/geo-scope/municipality-ssds-expansion.ts`)。非 SSDS 第 1 バッチ (住宅・土地統計調査 2023 の 13 指標、2026-10-28、判定の表 `packages/data-configs/src/geo-scope/municipality-housing-survey-expansion.ts`)。
- **残り (次の拡充はここから)**: 非 SSDS 3,349 表 (R2 estat-catalog `npm run estat:catalog:search -- <語> --collect-area 3`) は表ごとに軸 pin 設計が要る長尾。非 SSDS の表は `citySource` が無いと取り込みが市区町村を飛ばす。
  - **次の候補 (第 2 バッチ)**: 国勢調査 2020 の市区町村表 (共働き世帯・従業地など SSDS に無い軸)、経済センサス 2021 の産業別、人口動態の母の年齢別出生。1 バッチ 20 件まで・公開 4 週の計測を次のバッチの条件にする (`SSDS-DEMAND-BATCH-01` と同じ)。
  - 未公開の unknown (火災 2・自動車保険 2・家計の費目 4) は cities.json 不在または監査未了。
- **計測**: 公開後に GSC/GA4 で市区町村面を実測する。pilot の 9/21 判定は confounded (doc 44 記録済み)。
- **関連**: doc 44 WP8 / `MUNI-AI-CONTENT-01` (trigger 1 は成立。trigger 2=解説スロット・3=オーナー承認 は未成立)

### [BLOG-MUNI-SOURCE-LINK-01] ブログの図の直下カードから市区町村ランキングへ張れない
タグ: [コンテンツ品質] [種類:改善] [実行:対話] [起票:2026-10-23] [領域:サイト]

- **済 (2026-10-28)**: 構造検査 (`article-structure-lint.mjs`) が `/municipalities/ranking/<key>` と `/<県コード>` を図のカードとして数え、`RankingLinkCard` は市区町村の href でリンクだけを出す (テストで固定)。
- **残り**: `municipality-population-change-census-2025` の図のカード (今は `/ranking/<key>` と「あわせて見る」のテキストリンクで代用) を市区町村版へ差し替えて公開し、本番で確かめる (公開は承認が要る)。存在しないキーの検出は `BLOG-MUNI-LINK-LINT-01`。
- **完了条件**: 市区町村の図の直下に市区町村ランキングのカードを置いた記事が quality-gate を通り、本番でカードが市区町村ランキングへ移る。

### [MUNI-AI-CONTENT-EXPAND-01] 市区町村ランキングの解説を需要のある指標へ広げ、監査の穴を 2 つ塞ぐ
タグ: [コンテンツ品質] [種類:改善] [実行:対話] [起票:2026-10-22] [領域:データ]

- **前提**: 試験 1 指標 (`census-population-change-rate-5y`) で、本文 → 配信値での監査 → critic → ページ描画の経路ができた (`MUNI-AI-CONTENT-01`)。
- **次**: ① GSC で表示回数の多い市区町村ランキング (W41 で 65 URL) から上位 10 指標を選んで書く。1 指標ごとに `generate-municipality-ranking.ts --key <key>` で `"aiContent": "written"` を確かめ、critic を通す。② 監査に足す: 増減率・割合の指標で FAQ の質問が「最も増えた/減った」のように率を言わない形を止める (2026-10-22 の critic が試験版で指摘した型。率の指標の全件に出うる)。③ 原発事故・地震など配信値に無い外部の事実は監査が検証できない。書いてよい事実を出典付きで限るか、critic の確認項目として固定する。
- **停止条件**: 表示を受けているのに解説を足した指標の CTR・掲載順位が `[MUNI-SSDS-EXPANSION-01]` の基準 (2026-11-22 判定) より悪化したら、広げるのを止めて原因を確かめる。
- **完了条件**: 10 指標の解説が本番に表示され、②の検査がテストで固定されている。

### [BUILD-PERF-PHASE34] CI cacheと型検査重複の実験

タグ: [種類:改善] [実行:対話] [起票:2026-07-12] [領域:管理]

- **owner**: Claude Code
- **状態**: 未完了範囲はCIのbuild成果物再利用・変更種別ごとの検査分岐・短縮効果の実測。型検査の必須性を維持し、同一入力で合格したローカル検査は変更理由がなければ繰り返さない。
- **trigger**: 1本のPRで現行build jobの壁時間とcache sizeを測れるとき。
- **実測根拠（2026-09-13）**: PR964のCIはStatic Gates 533秒・Full E2E 522秒・Build Check 309秒の並行実行で、テストmatrixだけの修正でも全体build・型・unit・E2Eが再実行された。公開R2のデータ版もE2Eの検証入力になる (カタログ変更の公開前後で期待値がずれる)。
- **次（実行順）**: ①jobごとの依存導入・build・検査・cache復元/保存の壁時間を測る。②コード・lockfile・生成設定・データmanifestの組を固定し、同じ入力の検証済みbuildを後続jobで再利用できるか試す。③アプリ変更、テスト変更、運用記録だけの変更に応じたrequired checksを設計し、無関係な全体buildの繰り返しを減らす。④同じscopeの前後時間と費用を比較する。公開R2を候補コードへ組み合わせるE2Eでは、カタログ変更の公開前後で期待値がずれるケースを別途検出する。
- **停止条件**: restore/save込みで短縮しない、cacheが過大、または検査を弱める場合は採用しない。
- **完了条件**: 変更種別ごとに必要な検査が必ず実行され、入力変更時のcache失効と失敗伝播を確認する。復元/保存込みの同条件比較で短縮が実測されるまで高速化完了とはしない。今回のリリースへCI構成変更を追加しない。

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

### [SITE-RENEWAL-01] サイトをリニューアルする（Claude Design で検討した案を形にする）
タグ: [UI・UX] [種類:改善] [実行:対話] [起票:2026-10-19] [領域:サイト]

Claude Design で検討済みの案がある。着手時に案の所在と範囲（トップ・一覧・詳細のどこまで変えるか）を決める。（出典: obsidian の TODO マスタ ^t-0004 から移管・2026-10-19）
- **統合 (2026-10-26 オーナー判断)**: `BRAND-IMAGE-01` (色・トーン・見た目の約束を決める。言葉のほうは別) と `SIDEBAR-ACCENT-01` (サイドバーの強調色。doboku-note と共通の論点) をこのカードへ統合した。出典はどちらも vault の手書きメモ (2026-09-25・09-28)。
- **2026-10-26 追記 (配線監査・旧 BRAND-IMAGE-01 の論点)**: ブランドの主色が媒体で 2 つある。サイトの OGP は `apps/web/src/features/ogp/brand.ts` の `#304BC6`、動画は `apps/remotion/src/shared/themes/brand.ts` の `#1E40AF`。
  色を決めたら、片方を packages に移してもう片方が import する (どちらを正にするかはこのカードで決める)。

### [AUTHOR-PROFILE-UPDATE-01] 著者プロフィールを「土木系公務員退職者」に更新する
タグ: [コンテンツ品質] [種類:改善] [実行:対話] [起票:2026-10-19] [領域:サイト]

サイト・note・SNS の著者紹介の文言を揃える。経歴の書き方は本人に確認してから変える。（出典: obsidian の TODO マスタ ^t-0006 から移管・2026-10-19）

### [RANKING-AI-CONTENT-REWRITE-01] ランキングの AI コンテンツをリライトする
タグ: [コンテンツ品質] [種類:改善] [実行:対話] [起票:2026-10-19] [領域:データ]

ランキングページの ai-content を読み直し、薄い・古い・誤りのあるものから書き直す。対象の選び方は DATA-QUALITY-LOOP-01 の4基準に合わせる。（出典: obsidian の TODO マスタ ^t-0008 から移管・2026-10-19）

### [LOCAL-DATA-CLEANUP-01] 手元データの期限切れ（.local）を片付ける
タグ: [インフラ・計測] [種類:改善] [実行:対話] [検証:npm run check-local-data] [起票:2026-10-19] [領域:管理]

方針は `.claude/shared-policy/LOCAL-DATA.md`。2026-10-19 の `npm run check-local-data` で staging の上限超えが 13 件（`.local/` の作業出力。Kindle 表紙の生成物 460MB・note の参照図など採用済みかもしれないものも混ざる）。採用済みは R2 か Google Drive へ移し、使い捨ては消す。完了条件は上限超えが 0 件。（出典: obsidian の TODO マスタ ^t-0016 を3リポへ展開・2026-10-19）

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

### [E2E-FAILURE-EVIDENCE-01] 代表 E2E が落ちても、サーバーの例外と R2 の取得失敗が残らない
タグ: [インフラ・計測] [種類:改善] [実行:sweep] [起票:2026-10-23] [領域:管理]

- **証拠**: 2026-10-21 の PR #1166 (run 39591998395、head adc2be97e) で、`/ranking/total-population` が HTTP 200 のあと
  エラー境界 (`app/ranking/error.tsx`「データの取得中にエラーが発生しました」) を出して落ちた。同じコードの前後の run は通り、本番も正常で、原因は特定できなかった。
  ジョブのログにサーバーの例外は無い。`apps/web/playwright.config.ts` の webServer は stdout を指定しておらず、Playwright 1.62.1 の既定は stdout を捨てる
  (`node_modules/playwright/types/test.d.ts`「Default to "ignore"」)。R2 オーバーレイのログ (`/tmp/pr-e2e-r2-overlay.log`) は起動に失敗したときしか出力しない。
- **次**: webServer の `stdout: "pipe"` か、サーバーの出力をファイルへ書いて、失敗時にオーバーレイのログと一緒に artifact へ上げる (`pr-quality-check.yml` の Representative E2E)。
- **完了条件**: わざと落とした E2E の run で、サーバーの例外とオーバーレイの upstream error が artifact から読める。

### [AGENT-COMMIT-HOOK-BYPASS-01] pre-commit の文書検査を通らない backlog の commit が develop に入り、リリース PR を止めた
タグ: [エージェント・SSOT] [種類:改善] [実行:対話] [起票:2026-10-23] [領域:管理]

- **証拠**: commit adc2be97e (2026-10-21 11:26 UTC、author Claude) が `KABEUCHI-AGENT-01` をカテゴリ「戦略」(語彙外・DG057 error) で足した。
  pre-commit は `.claude/todo/` の変更で `npm run docs:check` を走らせる (`apps/web/scripts/pre-commit-checks.sh` 89〜92 行) ので、この commit は pre-commit を通っていない
  (`--no-verify` か、hook の無い環境か は未特定)。develop-quality-gate は push 後に止めたが、リリース PR #1166 の Catalog Gates と Contract Tests が落ち、
  別セッションが 9294f4071 で直すまでデプロイが止まった。
- **次**: その commit を作ったセッションの環境を特定する (worktree・クラウド・Codex のどれか、hook が効く設定か)。塞ぎ方は、push 前に `.claude/todo` の差分へ
  docs governance を掛ける pre-push hook か、エージェントの規約での `--no-verify` 禁止の明文化 (現状は一部の skill にしか無い)。
- **完了条件**: DG057 を含む backlog の変更を push しようとすると push 前に止まることを実測する。または bypass した経路を特定して塞いだ記録がある。

### [KINDLE-S1-BLOG-REWRITE-RECONCILE-01] ブログの書き直しで本の校訂が当たらなくなった 4 冊 (K-S1-01・04・06・09) を、作り直せる状態に戻す
タグ: [収益化] [種類:不具合] [実行:対話] [起票:2026-11-03] [領域:商品]

- **事象 (2026-11-03)**: 本の章の元のブログ記事 6 本が 2026-10-02 前後に大きく書き直され、本のための本文の校訂 (`editorial-corrections.ts`) の置換元がほとんど見つからない。生成はその章を「準備中」にして続くので、そのまま作ると章が抜ける。表紙の差し替え (`KDP-K-S1-08-REUPLOAD-01`) の作り直しでも同じく止まる。対象は K-S1-01 (real-disposable-income-reversal)・K-S1-04 (health-life-expectancy-structure)・K-S1-06 (fiscal-self-reliance-gap・fiscal-health-50years-trend・local-government-debt-burden)・K-S1-09 (manufacturing-aichi-dominance)。
- **決定 (オーナー・2026-11-03)**: (b) 書き直した今のブログ本文で作り直す。
- **済み**: 当たらない校訂を外し、今の本文を critic に読ませた指摘を校訂に足した。4 冊の `v5-20261103-tables` は章の抜け 0、書き下ろし比率 30% 超、`verify-epub` (v5 指定) で K-S1-06 は問題 0 件・K-S1-09 は warn 1 件、改ページの取り残し 0。
- **残り**: ① 当たらなかった MINOR 2 件 (manufacturing の注意書きの重複、「効率」の言い方) ② 置換元の無い構造の指摘 (K-S1-06 の散布図の解説・ふるさと納税の節、K-S1-09 の一般論の節) は本文を書き足す判断が要るので未着手 ③ 正式の版 (承認済みの表紙)・保全・`kdp-publish --update` はオーナー承認 (`KDP-K-S1-08-REUPLOAD-01` と同じ便)。
- **停止条件**: 「準備中」の章が入った版を入稿しない。校訂を当たる形に機械的に書き換えない (レビュー済みの判断が消える)。
- **完了条件**: 4 冊とも章の欠けなしで生成でき、`verify-epub` の warn が前の版より増えず、改ページの取り残しが 0。

### [KINDLE-QUALITY-LOOP-01] 既刊 Kindle の中身を、機械の検査 → 図のスクショ評価 → NotebookLM の通読の 3 段で安く直し続ける仕組みを作る
タグ: [コンテンツ品質] [種類:改善] [実行:対話] [起票:2026-11-03] [領域:商品]

- **起点 (2026-11-03 オーナー)**: 本文にもっと図を入れる・全データの表を見せる、を売れている内容を踏まえて拡充し、機械の検査・スクショのエージェント評価・NotebookLM の通読をトークンを節約して回したい。**新しい本は作らない** (収益化戦略 §3.6)。既刊 12 冊の改訂に限る。需要の証拠は K-S1-02 (2026-08) と K-S2-03 (2026-09) の各 1 冊だけで、中身の改善が売上に効くかは未検証。
- **図の配線 (2026-11-03 確認)**: ブログ由来の章の図は本を作るたびに R2 の `app/blog/<slug>/data/<name>.svg` を読む (`fetch-content.ts`) ので、ブログの図を共通の型 (`apps/admin/lib/template-ranking-bars.ts`・`template-ranking-tile-map.ts`) で描き直せば次の作り直しで入る。書籍版の図の校訂 (`figure-corrections.ts`) は元の文字が変わると生成を止める (止まったらエントリを消すか直す)。ランキング章の図 (`ranking-databook.ts` が `generateBarChartSvg` を直接呼ぶ) は共通の型を通っていないが、販売中の S1 12 冊には無く、効くのは公開を止めている S2〜S4 だけ。共通の型を `packages/product-factory` から使うには共有の場所へ移すか相対 import するかを決める (図の共通化の作業の持ち主と相談)。
- **仕組み (トークンを使う段ほど対象を絞る)**: ① 機械の検査 `npm run kindle:quality [-- --write]` (`quality-cli.ts`・集計は `epub-inspect.ts` を管理画面と共有・記録 `data/products/kindle-quality.json`・EPUB は Mac の `.local` のみで CI 不可) ② 図のスクショ評価 (`capture-figures.mjs` 600px → Haiku/Sonnet、PNG の sha256 で `data/products/kindle-figure-reviews.json` に記録。1 枚約 7 千トークンなので印の付いた図か図の型ごとに 1 枚に絞る) ③ NotebookLM の通読 (`notebooklm-review.ts`、1 冊 1 notebook・`clear` で会話を切る。答えは `.local/kindle-quality/<id>/notebooklm.md`) ④ 直す [オーナー承認]: `editorial-corrections.ts` → `build-book` → `verify-publishable` → Previewer → `kdp-publish --update` で 1 冊ずつ ⑤ 効果を見る: 改訂した冊としていない冊で販売台帳の月次と GA4 `product_click` (`PRODUCT-REFERRAL-MEASURE-01`) を並べる。規模的に統計判定はできず「判定不能」も結果として書く。
- **済み (2026-11-03 まで)**: ①を実装して 12 冊を計測した (印: 図の無い長い章 37・全県表の無い図の章 63・説明の無い図のある章 15・サイトへのリンクなし 12 冊)。K-S1-02・07 で ②③ を試行し、両方で「全 47 都道府県の表」が 1 位の改訂案だった。章末の全県表 (`full-tables.ts`・catalog の `fullTables: true`) と図の題・年・単位の校訂 5 枚を入れ、S1 12 冊すべてに手元の版 `v5-20261103-tables` (未入稿) がそろった。**Kindle Previewer・実機での改ページは未確認**で、文字サイズを大きくした場合は保証できない。
- **残り (オーナー)**: ① Kindle アプリの「ドキュメント」に届いている K-S1-02-v5-tables・K-S1-07-v5-tables を 1 回開く (任意) ② 承認済みのポップ表紙で正式の版を作り直す (`KDP-K-S1-08-REUPLOAD-01` と同じ便) ③ critic の差分レビュー・保全・`kdp-publish --update` の承認 ④ K-S1-07 の通読の指摘 (同じ注意書きの 6〜7 か所の繰り返し・第 5 章が 2001 年の海外旅行でテーマと年がずれる) は本文の編集判断が要るので未着手 ⑤ Haiku の「本文と図の食い違い」候補 5 件 (K-S1-07「濃く塗られた 6 県」「3 つの断層」、K-S1-02 ラーメンの「鏡のように逆転」・かにの県と市の基準・「鳥取・福井に続いて新潟」) は候補で未確認。直す前に人が図と本文で確かめる。
- **次 (実行順)**: ① 週次レビューで `kindle:quality -- --write` を回すかを決める ② ランキング章の図を共通の型へ寄せる方法を、図の共通化の作業と決める ③ 2 冊の試行のトークンと指摘の質を踏まえ、残り 10 冊へ ②③ を広げるかを決める。
- **停止条件・禁止**: 新しい本・シリーズを作らない。販売中の版の差し替えはオーナー承認と `KDP-K-S1-08-REUPLOAD-01` の手順を通す。評価済みの図・章をもう一度評価しない (sha256 で記録)。NotebookLM に入れるのは自分の本だけ (他人の本や参考文献の全文を入れない)。
- **完了条件**: 機械の検査が全冊を毎週記録し、2 冊で 3 段の試行の結果 (指摘・トークン・直した箇所) が残り、残りの冊へ広げるかをオーナーが決めた。

## 🟢 低 — 再開条件を満たしたら着手する

### [RELATED-ARTICLES-BASELINE-01] 共通化した大画像の関連記事を計測し、画像サイズの次の比較を判断する

タグ: [UI・UX] [種類:改善] [実行:対話] [起票:2026-11-12] [領域:サイト]

- **実装記録 (2026-11-12)**: 県・ランキング・テーマの本文を `features/content-navigation/RelatedArticles` に統一。見出し「関連記事」、大画像の `ArticleTeaserCard` と共通 `CardGrid`、表示形式 `related-articles-large-v1`。選定条件は従来どおり。ローカル確認段階で、本番の計測開始日は未確定。
- **計測契約**: `nav_impression` はカードの 50% 以上が前面タブで連続 1 秒見えたら、ページ表示中のカードごとに 1 回。`nav_click` は共通クリック監視で送り、`nav_label=blog:<slug>`、`nav_surface=area_blog/ranking_blog/theme_blog`、`card_variant` を突合する。ランキング・テーマの旧ラベルは題名だったため、そのまま前後比較しない。短時間のクリックや同じカードの複数クリックは分子に入るので、クリック数/有効表示数はユニーク利用者のクリック確率ではない。
- **記録先**: 既存の週次 GA4 取得が `data/ga4/snapshots/<週>/related-articles.csv` と `.meta.json` に Japan-only・28 日の記録を保存する。日付・ページ・端末・記事・表示形式ごとの eventCount。重複する週の 28 日値を足さない。新しい認証・管理画面操作は不要。
- **再開条件・実行順**: ① 通常の本番反映時に反映日をここへ記録 ② 最初の週次取得で metadata 成功と表示/クリックの識別を確認 ③ 反映後だけの 28 日間について、記事別・ページ種別・端末別に表示数とクリック数/有効表示数を記録 ④ 小画像を試す必要があるか判断し、試す場合は共通部品だけを変更して表示形式の版を更新する。
- **停止条件**: metadata の失敗・分母欠損・標本不足は効果不明とし、0% や大画像の勝利と扱わない。県とランキングは掲載記事・読者が異なるため、単純な差を画像サイズの効果にしない。
- **完了条件**: 大画像の基準値と限界を記録し、維持または条件をそろえた次の比較を判断する。遷移後の閲読は既存 `read-progress` / `internal-transitions` を補助情報とし、関連記事経由だけの因果効果とは断定しない。

### [WAGE-RULE-PAGE-01] 補助金の賃上げの要件に使う「都道府県別の最低賃金と物価」のページを作るかを決める
タグ: [コンテンツ品質] [種類:意思決定] [実行:対話] [起票:2026-11-11] [領域:サイト]

- **起点**: 統合補助金・省力化・デジタル化 AI・持続化の賃上げの要件は、都道府県の地域別最低賃金 (+30〜50 円) と物価上昇率を基準にする。給与の伸びが物価上昇率を下回ると「審査上大幅に不利」と要領に書かれている。粒度が stats47 とそのまま合う (`docs/02_実装計画/49_補助金の根拠データとAIノウハウ展開仕様.md` §7)。
- **保留の理由**: 値は公的に無料で出ている。どの物価指標を使うかは要領に定義が無い (未確認)。
- **再開条件**: `KAKEI-MARKET-SIZE-PILOT-01` が続くと決まったとき。
- **完了条件**: 作る・作らないを決めた。

### [DATA-REFRESH-SCHEDULE-RESUME-01] 月次の全範囲更新を止めたので、main への反映と再開の条件を管理する
タグ: [インフラ・計測] [種類:意思決定] [実行:対話] [起票:2026-11-05] [領域:データ]

- **判断**: 2026-11-05 にオーナーが「指標の台帳とカタログが整理できていない間は全範囲の更新は不要」と判断し、`data-refresh.yml` の毎月 5 日の定期起動を外した。手動起動と develop の依頼ファイルからの起動は残した。
- **期限**: GitHub の定期実行は main の設定で動くので、**2026-12-05 12:00 JST より前に**この変更を main へ入れる。次のまとまったデプロイに同乗させる。
- **証拠**: run 42010655216 を最終同期 3,416 / 17,474 件で取り消した。24 指標の年の食い違いは run 42022242257 で修復し、公開データ監査は 0 件。ほかの約 14,000 件は 11-04 までの内容で、同じ年の値の改訂が未反映の可能性がある。
- **次**: ① 台帳とカタログの整理が終わる時期をオーナーが決める ② その後に全範囲を手動で 1 回実行し、中断しない ③ 定期起動を戻すかを決める。
- **完了条件**: main から定期起動が消えていることを確認し、再開か廃止かの判断が記録されている。

### [MUNI-PEER-DATASET-01] 1 自治体と類似団体の現況データ一式 (計画策定の現況分析向け) を作るかを、EXP-007 の結果を見て決める
タグ: [収益化] [種類:意思決定] [実行:対話] [起票:2026-10-28] [領域:商品]

- **再開条件**: EXP-007 (`MUNI-DATA-PRODUCT-PILOT-01`) の判定で販売 1 件以上。
- **打ち手台帳**: EXP-012 (proposed)。着手は EXP-007 (`MUNI-DATA-PRODUCT-PILOT-01`) の判定の後。
- **読者の課題 / HARM**: 計画策定を受けたコンサル・自治体の担当者が、対象自治体と類似団体の現況指標を集めてそろえる手間 (A＋M)。計画策定の委託は 1 件 ¥300 万〜3,000 万で、データ整理と地図化は再委託先に出ている (調査 §8)。データ一式の購入は未検証。
- **次**: ① EXP-007 で売れたら、類似団体の定義 (総務省の類似団体区分) と指標のセットを決める ② 1 自治体分の見本を作り、`ADMIN-STAT-PILOT-01` の聞き取り相手に見せて使えるかを聞く ③ 値付けと判定の基準を決めて台帳に書き、running にする。
- **完了条件**: 作る・作らないが決まり、作るなら指標・判定日・停止条件が台帳 EXP-012 にある。

### [VITE-CONFIG-ESM-WARN-01] vitest.config.ts が CommonJS として読まれ、Vite の次の major で読めなくなる警告が出ている
タグ: [インフラ・計測] [種類:改善] [実行:sweep] [起票:2026-10-23] [領域:管理]

- **証拠**: 2026-10-21 の develop-quality-gate run 39594085606 の package テストで、各 package の `vitest.config.ts` について
  「Your Vite config uses features that are unsupported by `configLoader: 'native'`, which is planned to become the default in a future major version of Vite:
  ESM syntax in a file loaded as CommonJS (vitest.config.ts:1:1)」が出た (vite 8.2.4)。
- **再開条件**: Vite の次の major (native config loader が既定になる版) が出たとき。それまでは警告だけで動作は変わらない。
- **次**: 設定ファイルを `.mts` にするか、package に `"type": "module"` を足すかを決め、全 package の vitest を同じ形にそろえる。
- **完了条件**: package テストのログからこの警告が消える。
- **2026-10-26 実施 (前倒し)**: 21 個の vitest 設定を `.mts` に改名し (4 個は `__dirname` を `import.meta.url` から作り、JSON の import に `with {type:"json"}` を足した)、参照する検査・skill・README を更新した。`npm run test:packages:ci` 3,028 件・web 2,617 件・admin 323 件が通り、このカードの警告は消えた。**残り 2 点**: ① `packages/visualization/src/shared/__tests__/helpers/render-test-contract.ts` が CommonJS として読まれ、別の configLoader 警告が 1 件出る (改名には `check-quality-exceptions.cjs` と例外台帳の更新が要る) ② `apps/admin/vitest.config.mts` が admin の tsconfig (`**/*.ts`) の型検査から外れた。
- **完了条件 (更新)**: 上の 2 点を直し、package テストのログに configLoader の警告が 1 件も出ず、admin の vitest 設定も型検査される。

### [FISHERY-2024-DB-01] 漁獲量の 12 指標に 2024 年を足す (e-Stat に 2024 年のデータベースの表が出たら)
タグ: [コンテンツ品質] [種類:改善] [実行:対話] [起票:2026-10-21] [領域:データ]

- **経緯**: `DATA-QUALITY-LOOP-01` ③ (2026-10-21) で、`fishery-species-catch-mackerel` などの配信の最新は 2023 年だった。農水省の令和6年 (2024) 確報は e-Stat に Excel だけで公表され (表 2-2 `stat_infid=000040415922`)、データベースの 2024 年の表は 0 件 (2026-10-21)。12 魚種の指標 (`fishery-species-catch-*`) は 2023 年を 2-2 表 `0004043248` から `supplementalSources` で補っている。
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

### [WINDOWS-LOCAL-TEST-FAILURES-01] Windows の手元でだけ落ちるテスト 3 種を、CI と同じく通るようにする
タグ: [インフラ・計測] [種類:不具合] [実行:windows] [起票:2026-10-27] [領域:管理]

- **事象 (2026-10-27、会社の Windows PC で実測。CI の Linux では通る)**:
  1. `packages/product-factory` の kindle CLI テスト (`kindle-verify-cli`・`kindle-listing-revision`) が、外部プロセスの 60 秒制限で打ち切られる。`verify-epub` は単体なら 42 秒・exit 1 の正しい応答。全件実行中は負荷で 60 秒を超える。
  2. `apps/web` の `eslint-dependency-compatibility.test.ts` の深い入れ子のケースが、Windows の一時ディレクトリのパスが長いため、パターンが braces の上限 10000 字を超えて落ちる (memory `feedback_next_eslint_unpatched_braces` の braces と同じ部品)。
  3. この PC の `packages/product-factory/src/data/pack-snapshots/*.json` が 158 バイトほどの空ファイルで、`delivery-integrity` と `license-exclusion` が null 参照で落ちる。globalSetup が既存ファイルを作り直さない。
- **次**: 1 は所要時間の実測に合わせて制限を延ばす。2 は一時ディレクトリを短いパスに作るか、パス長に依存しない入力にする。3 は空・壊れた snapshot を globalSetup が作り直すか、明確な理由で落とす。
- **追記 (2026-10-27)**: 4 種目。`apps/admin` の `agent-models.test.ts`「frontmatter の無いファイルは画面を落とさず errors に載せる」が、errors の `file` を `.claude\agents\broken.md` (Windows の区切り) で返し、期待の `/` 区切りと食い違って落ちる。変更を退避した develop でも再現。台帳のパスは `/` に揃える (memory `feedback_windows_script_portability`)。
- **完了条件**: Windows で 4 種とも通り、CI の結果は変わらない。

## 🟣 判断待ち — やるかどうかの意思決定が未了

### [BUSINESS-PLAN-TARGETS-CONFLICT-01] KPI の台帳に残る M3・M6・M12 の目標値を消すか、仮説として残すかを決める
タグ: [収益化] [種類:意思決定] [実行:ユーザー] [起票:2026-11-13] [領域:戦略]

- **観測 (2026-11-13)**: `data/business-plan/plan/metrics.json` は `targetM3`・`targetM6`・`targetM12` (週次収益は 30,000・187,000・1,030,000) を持つ。`docs/00_プロジェクト管理/02_収益化戦略.md` の 166 行目は「既存のM3/M6/M12の売上・アクセス値を今回の戦略の予測として流用しない」と書いている。
- **次**: 目標値を消すか、仮説の印を付けて残すかをオーナーが決める。`STRATEGY-LEDGER-JSON-01` の段 5 で KPI の階層を足す前に決める。
- **完了条件**: 台帳と戦略の記述が一致している。

### [TRADE-AREA-REPORT-DECISION-01] 補助金・創業融資の根拠に使える「商圏の参考資料」を受注するかを決める
タグ: [収益化] [種類:意思決定] [実行:対話] [起票:2026-11-11] [領域:商品]

- **起点**: ココナラの「商圏分析」は 118 件で、30,000 円の出品に評価 57 件、5,000 円に 25 件。補助金向けと明示した出品は上位 30 件に無い (2026-11-11 観測)。中身は無料の jSTAT MAP の作業の代行で、使いこなせない申請者が払っている (`docs/02_実装計画/49_補助金の根拠データとAIノウハウ展開仕様.md` §5 の段 3)。
- **決めること**:
  1. 販売面。ココナラからは 2026-10-19 に撤退している (収益化戦略 §3.6)。戻すのか、note の案内から直接受けるのか、やらないのか。`PRODUCT-LINEUP-2026-11` (統計の地図・グラフを資料用に作る受注) と一緒に決める。
  2. 「法人向けの小地域データ・GIS は作らない」の例外にするか。受注ごとに jSTAT MAP で集計するだけで、データは持たない。
  3. 地図を納品物に入れるか。入れるなら jSTAT MAP の地図出力の利用条件を確かめる (未確認)。入れないなら表だけにする。
  4. 範囲と価格 (案: 市区町村の比較＋家計調査の単価＋到達圏の集計＋出典の表。文章は書かない。10,000 円の固定範囲。1 件 3 時間以内)。作業時間は実測が無いので、自分の地域で 1 回試して測る。
- **守ること**: 納めるのは参考資料 (値・出典・計算表) まで。計画書の文章は書かない。商品の説明に「申請書の作成は申請者本人か行政書士」と書く (改正行政書士法)。
- **前提**: `KAKEI-MARKET-SIZE-PILOT-01` の判定の後。
- **完了条件**: 受ける・受けないと、受ける場合の販売面・範囲・価格・工数の上限をオーナーが決めた。

### [KDP-COVER-47PREF-DECISION-01] Kindle の表紙の「47都道府県」の扱いを決め、見本 1 冊 → 全冊の順で作り直すか決める
タグ: [収益化] [種類:意思決定] [実行:ユーザー] [起票:2026-11-09] [領域:商品]

- **経緯**: `KDP-LISTING-WIRING-01` の ④ を分けた (①〜③ の CI・公開の検査と表紙の縮小確認は 2026-11-09 に実装済み)。表紙の検査は寸法と文字の照合と、縮小しても題名が読めるかの目視記録 (`kdp-cover-thumbnail.mjs`) まで。「47都道府県」の文字を表紙でどう見せるかは決まっていない。
- **決めること**: 「47都道府県」を表紙に残すか・どの大きさで置くか。作り直すなら Codex で見本 1 冊を作り、縮小確認を通してから全冊へ広げる。
- **停止条件**: 表紙の差し替えは KDP への外部変更で、オーナー承認の後。差し替えたら縮小確認を取り直す。
- **完了条件**: 扱いが決まり、作り直す場合は見本 1 冊の縮小確認の記録がある。作り直さない場合はこのカードを消す。


### [IMAGE-BOUNDARY-CONSOLIDATE-01] 画像まわりの依存の向きと重複を直す
タグ: [エージェント・SSOT] [種類:改善] [実行:対話] [起票:2026-11-06]

2026-11-06 の監査で出た指摘 4・9・10 に対応する。手順は vault の `memos/stats47画像まわり_次セッションの指示.md`、指摘の全文は `memos/stats47画像まわり監査_2026-11.md`。

- **範囲**: `GONE_BLOG_SLUGS` と `BRAND` を共有パッケージへ移す。`OgpVisualType` を `as const` の配列から導出する。`generate-blog-thumbnails.ts` と `generate-blog-thumbnails-cloud.ts` の重複を lib へ移す
- **判断待ち**: `BRAND` を移すと `rendererHash` が変わり、全画像の fingerprint が変わる。週次の自動修復は種別ごとに500件までなので、既定のままでは ranking で5週ほど [OGP Alert] が続く。手動で上限を上げるか、`BRAND` だけ後回しにするかをオーナーが決める
- **完了条件**: 別ブランチの PR が作られ、型検査と関連テストが通っていること。本番デプロイと R2 への書き込みはしない

### [PRODUCT-LINEUP-2026-11] 残りの判断: 統計の地図・グラフを資料用に作る受注をココナラで始めるか
タグ: [収益化] [種類:意思決定] [実行:対話] [起票:2026-11-05] [領域:商品]

- **経緯**: 2026-11-05 に 5 つの販売面の競合調査 (`docs/00_プロジェクト管理/02_収益化戦略.md` §2.2) から商品展開の設計案を作り、オーナーが採った。採った内容は同 §3.4「商品展開」と `data/products/product-strategy.json` の決定にある。このカードには未決の 1 点だけを残す。
- **問い**: ココナラで「統計の地図・グラフを資料用に作る」受注を始めるか。10-19 の撤退はデータ販売の撤退で、受注は別物。
- **材料 (2026-11-05 観測)**: ココナラの地図作成 ¥3,000 は評価 3,663・1,259・1,139 件、Excel 作業の代行は 594 件。統計の値で塗り分けた地図の出品は「塗り分け 地図」7 件の中に無い。評価数は関心の目安で、販売数ではない。
- **始めるなら先に決めること**: 時間単価と 1 件の工数上限 (§3.4「価格と採算」)、受ける範囲 (都道府県・市区町村のどこまで、手元のデータを使うか stats47 の指標だけか)、境界の出どころ (N03・Geoshape は使わない。`MUNI-DATA-LICENSE-CHECK-01`)。
- **判定 (始めた場合)**: 出品から 4 週で受注 2 件以上、かつ 1 件の実工数が上限以内なら続ける。
- **禁止**: 決まる前に出品しない。出品は人手のログインとオーナー承認を経る (`config/coconala-account.json` のアカウントだけ)。
- **完了条件**: 始める・始めないの決定が `02_収益化戦略.md` §3.4 と `product-strategy.json` にあり、始める場合は出品のカードがある。

### [ISSUE-PAYING-NEED-01] イシュー: 雑学の読者で広告を伸ばすのか、統計を仕事に使う人から売上を得るのか
タグ: [収益化] [種類:意思決定] [実行:対話] [起票:2026-11-05] [領域:商品]

- **問い**: stats47 が解く問題は、好奇心ではなく、むしろ仕事の問題なのか。統計を仕事に使う人は、お金を払うほど困っているのか。
- **仮説**: 今解いているのは「地元や話題の数字が気になる」という好奇心。仕事で払う人はまだ確かめられていない。
- **実測 (2026-11-05 観測)**: 検索 14,733 クリック/28日、食べ物の消費量が約 31%。note 売上は累計 600 円で、売れたのは「e-Stat×Claude Code×自治体」の 300 円記事 2 件。ランキング有料記事 47 本は閲覧 4,842 で売上 0。聞き取りは 0 件 (`data/products/admin-stat-interviews.json`)。
- **位置づけ**: どの顧客を選ぶかの上位の問い。行政の検証そのものは `ADMIN-STAT-PILOT-01` が持ち、9-25 に一時停止、期日 10-02 を超過している。
- **問いの台帳との配線**: `data/content/issues.json` の `revenue` が `実務`・`データ` の問いを、聞き取りで「仕事で使うか」を尋ねる材料にする。
- **次**: `ADMIN-STAT-PILOT-01` の段階 1 を再開するか、別の仕事の読者を先に確かめるかをオーナーと決める。
- **別の仕事の読者の候補 (2026-11-11)**: 補助金・創業計画を書く事業者とその支援者。根拠と試す順番は `SUBSIDY-EVIDENCE-STRATEGY-01`。
- **禁止**: 答えが出る前に、行政向け商品の制作を増やさない。
- **完了条件**: 聞き取りの結果が `admin-stat-interviews.json` にあり、どちらへ進むかをオーナーが決めて `02_収益化戦略.md` へ反映している。

### [KDP-MANUSCRIPT-PUBLIC-REPO-01] 販売中の本の原稿が公開リポジトリで無料で読める状態を決める
タグ: [収益化] [種類:意思決定] [実行:ユーザー] [起票:2026-11-04] [領域:商品]

- **実測 (2026-11-04)**: リポジトリは public (`gh api repos/uruhayato373/stats47`)。Kindle の書き下ろし原稿 178 ファイルが追跡されていて、販売中の本の本文の一部を誰でも GitHub で読める。git の履歴にも残る。
- **影響**: 有料の本の中身が無料で読める。KDP Select の独占の条件にも関わる (`KDP-ROYALTY-RATE-CHECK-01`)。
- **決めること**: ① 原稿を repo の外 (R2 の非公開領域) へ移すか ② リポジトリを非公開にするか。履歴まで消すには非公開化か履歴の書き換えが要る。非公開化は GitHub Actions の無料枠が変わる可能性があり、今の実行量で足りるかは未確認。履歴の書き換えは全ブランチと別 PC・別セッションに影響する。
- **同じ確認**: `packages/product-factory/src/data/pack-snapshots/` など、有料商品の中身が repo にないかを棚卸しする。
- **禁止**: オーナーの判断なしに履歴を書き換えない・リポジトリの公開設定を変えない。
- **完了条件**: 方針が決まり、販売中の商品の本文が方針どおりの場所にある。

### [AFF-MOBILE-PR-GAP-01] モバイルで PR が 1 つも出ない 12 種類のページと、案件の出方を決める
タグ: [収益化] [種類:意思決定] [実行:ユーザー] [起票:2026-11-04] [領域:アフィリエイト]

- **起点 (2026-11-04 オーナー)**: 「アフィリエイトは全て完璧に配置できたの」への確認で、配置が方針どおりか断言できない点が残った。
- **分かっていること (2026-11-04 の撮影。開発サーバー・63 枚・撮れなかったページ 0)**:
  - 390px 幅で PR が 0 のページは 12 種類 (カテゴリの比較・タグ・ランキング一覧・テーマ一覧・都道府県一覧・調査一覧・ブログのタグ一覧・検索・日本全体のテーマ・市区町村ランキング・市区町村のテーマ・市区町村のハブ)。原因は、段の先頭の枠が AdSense で、モバイルには先頭の 1 枠しか出ないこと。
  - 検索ページは 390・768・1440px のどの幅でも PR が 0。
  - 390px で AdSense が 0 のページは無い (全ページ 1 枠以上)。
  - 共通の案件は延べ 楽天カード 34 枚・TOSSY 24 枚で出ている。TOSSY は台帳の題が「NISA・証券 バナー 1」(`af_economy_banner_001`) なので、管理画面でも画像の代替文字でもこの名前で出る。
  - 共通の案件ではない AI Agent Camp (`af_agent_camp_economy_001`) が、日本全体のテーマと市区町村ランキングの計 4 枚に出ている。文脈の解決から来たものか、意図どおりかは未確認。
- **まだ分かっていないこと**: 本番で AdSense が実際に埋まっているか (本番の HTML に段があることは `/`・`/themes/labor-wages`・`/ranking/total-population` で確認した。埋まり方は未確認)。PR を増やして AdSense を減らしたときの収益差 (本文の AdSense の 1,000 表示あたり ¥29〜45 に対し、PR は直近 4 週で 33,188 表示・42 クリック。成約の実績が足りず PR の表示単価を比べられない)。
- **決めること**: ① モバイルの先頭の枠を今のまま AdSense にするか、一部のページで PR にするか ② 検索ページに PR を出すか ③ AI Agent Camp を今の場所に残すか ④ TOSSY のバナーの題を案件名へ直すか (③・④ は判断だけで済む)。
- **次**: `AFFILIATE-COMMON-PRODUCTS-01` の前後比較 (PR は表示約 24,000 回、AdSense は 4 週平均) の結果を見てから ① を決める。先に動かすと比較が混ざるので、① は比較が終わるまで変えない。
- **完了条件**: ①〜④ の結論が収益化戦略 §3.1 か台帳 `data/ads/placements.json` に書かれ、変える分は別カードか実装で閉じている。

### [SEO-TITLE-CTR-CLOSE-01] title を変えた 10 ページの効果観測を「判定不能で終了」として GSC 運用サイクルに登録するか決める
タグ: [インフラ・計測] [種類:意思決定] [実行:ユーザー] [起票:2026-11-01] [領域:サイト]

- **経緯**: 2026-11-01 に improvement-triage が `SEO-TITLE-CTR-EFFECT-01` を improvements.md から外した (根拠のある `[target:]` を置けないため判定不能。過去の title 差し替え 2 件は effect/none。理由と観測の手順は `data/improvement/gsc-improvement/improvement-log.md` の同 ID の節)。ただし GSC 運用サイクルの `effect-target-ratchet` は確定済みの `data/effect-verdict/verdicts-2026-W43.json` を読むので、行を消しても FAIL のまま。
- **選択肢**: (a) `data/improvement/gsc-improvement/closed-waves.json` に `decidedBy: owner` で終了を記録する (BLOG-WAVE 7 件と同じ扱い。エンジンの対象から外れる) (b) `.claude/config/gsc-operations-cycle.json` の `legacyMissingTargetSubjectIds` に足して FAIL を警告に下げる (c) 根拠を探して `[target:]` を付け、行を戻す。
- **付随**: 10 ページを変えていない近傍ページと比べる観測 (11-21 以降・差の差) を続けるかも同時に決める。続けるなら別 ID で起票する。
- **停止条件**: 「オーナー判断」の欄をエージェントが埋めない。
- **完了条件**: 選択肢が決まり、`node .claude/scripts/gsc/audit-operations-cycle.mjs --stage review-input --week 2026-W44` の `effect-target-ratchet` が FAIL でない。

### [GIS-SURVEY-LAW-SITE-MAPS-01] サイトの地図の境界を、国土地理院の測量成果に由来しない e-Stat 国勢調査境界へ移すかを決める
タグ: [インフラ・計測] [種類:意思決定] [実行:対話] [起票:2026-10-28] [領域:サイト]

- **経緯 (2026-10-28)**: サイトの地図は Geoshape リポジトリの市区町村境界 (`packages/gis/src/geoshape`、R2 にキャッシュ) を使う。Geoshape のページ https://geoshape.ex.nii.ac.jp/city/ によると、このポリゴンは国土数値情報「行政区域データ」(N03) を変換したもので、N03 の利用規約に従うよう案内している。N03 は国土地理院「数値地図（国土基本情報）」を測量法の複製承認を得て作ったもの (N03 個別ページの作成方法欄「国土地理院長承認（複製）R 6JHf 503」)。国土地理院「地図の利用手続ナビ」 (https://service.gsi.go.jp/onestop/navi/nav1/ → nav4 → nav5-1〜5-3) は、承認を得た成果をさらに使うときは基本測量成果として審査し、「地図が表示されるサイト、地図コンテンツを主とするサイト」で位置座標を含むなら申請が要るとする。「ウェブサイト等への地図の挿入」は申請不要。**R2 に保存し直しても出どころは N03 のままなので、この問いは消えない。**
- **オーナー方針 (2026-10-28)**: 複製承認は申請しない。国土地理院の地図に由来しない境界を使えばよい。
- **代わりの境界**: e-Stat「令和2年国勢調査 町丁・字等境界データ」 (説明 https://www.e-stat.go.jp/help/data-definition-information/download 、作成方法は「地方公共団体が設定した調査区の境界を基に作成」、利用条件は e-Stat 利用規約で商用可)。Geoshape も同じデータを加工した「国勢調査町丁・字等別境界データセット」 https://geoshape.ex.nii.ac.jp/ka/ (CC BY 4.0) を出している。どちらにも国土地理院の承認番号の記載は見つからなかった。商品 (`MUNI-DATA-PRODUCT-BUILD-01`) はこちらで作ると決めた。
- **論点**: ランキングの地図は「サイトへの地図の挿入」に当たりうるので急ぐ根拠は弱い。一方、市区町村の地図ページや Geo 分析ページは「地図コンテンツを主とするサイト」に当たりうる。移すと、①境域が 2020-10-01 時点に固定される (以後の変更は自分で直す) ②町丁を結合する前処理と、政令市の区・23 区の統合/分割 (`fetchMunicipalityTopologyForWardMode`) の作り直しが要る ③都道府県の境界は県境の接合処理がされていない (同じ説明ページ) ので、都道府県地図は別に考える。
- **次**: ① 商品で作る結合済み GeoJSON (`MUNI-DATA-PRODUCT-PILOT-01` のデータ完成の記録 ④) の生成スクリプトを、サイトの TopoJSON 生成にも使える形にする ② その出来 (形の数・飛び地・県境のずれ・ファイルの大きさ) を見て、サイトの市区町村地図を移すかをオーナーが決める ③ 移すなら `.claude/rules/gis-data.md` と `r2-storage-design.md`「市区町村の境界」に元データと出典表示を書き換える。
- **禁止**: 結論が出るまで今の地図を消さない (止める根拠はまだ無い)。R2 の境界の差し替えは承認制。
- **完了条件**: サイトの地図の境界を移すか据え置くかが決まり、据え置くなら理由 (地図の挿入に当たる等) が、移すなら移行のカードがある。

### [BLOG-GEMINI-AUTHOR-01] Gemini 無料枠でブログ下書き3本を小試験し、型別の通過率を比べる
タグ: [コンテンツ品質] [種類:制作] [実行:ユーザー] [起票:2026-10-28] [領域:サイト]

- **2026-11-01 オーナー判断**: Gemini を量産手段として再採用する。新しい無料枠キーを登録する。ブログは当面 author=Gemini、critic=Claude headless で3本を小試験し、型別の PASS 率・事実誤り・費用を既存の Claude author と比べる。品質ゲートは緩めない。
- **用意済み (branch `claude/determined-newton-2d077c`)**: `write-blog-headless.ts --author gemini-api` で既存の `gemini-text-client.ts` を使って下書きを書き、決定的ゲートと Claude の critic に通す。run の最初に極小の実生成で鍵を確かめ、HTTP 402 / クレジット枯渇は billing として止まる (以前は 402 を bad-request に分類していたので直し、単体テストを足した)。手元の `.env.local` に `GEMINI_API_KEY` は無い (GitHub Secrets 専任) ので、実際の生成は試していない。
- **根拠**: 公式料金表 (https://ai.google.dev/gemini-api/docs/pricing・2026-10-28 確認) では 2.5 Pro / 2.5 Flash / 2.5 Flash-Lite / 3.x Flash / 3.5 Flash-Lite に無料枠があり、3.1 Pro Preview と画像系には無い。無料枠の入出力は Google の製品改善に使われうるので、公開データ (R2 の観測値と記事) だけを渡す。今の鍵は課金 project の前払いクレジット枯渇で 402 (ランキング解説の日次 run で 48 run 中 44)。2026-10-26 にオーナー判断で Gemini の経路は中止した。
- **次**: キーを `.env.local` に置くか、コマンド実行時の環境変数として渡す。`--author gemini-api --critic claude-sonnet` で3本試し、`headless-runs.csv` で Claude author と通過率を比べる。GitHub Secret だけでは手元の blog CLI は鍵を読めない。

### [BLOG-MONTHLY-CAP-01] ブログの月の本数上限 (月 15〜20 本) を、headless 化で 1 本の費用が下がった後も据え置くか決める
タグ: [コンテンツ品質] [種類:意思決定] [実行:ユーザー] [起票:2026-10-28] [領域:サイト]

- **今の上限**: `data/blog/seo-strategy.json` の `typeMix` (B 5 / D2 4 / A 3-4 / F 3 / G 1-2 / H 2 / C_E 1-2 = 月 17〜19 本)。
- **費用の根拠**: headless の実測は BLOG-HEADLESS-AUTHOR-01 を参照 (PASS 1 本 $0.32・書き直し込み 1 本 $0.10〜0.27・API 換算)。Agent tool 経路の約 10 万トークン/本・$8.2/本から大きく下がった。topic-queue の pending は 140 本 (must-write 60)。
- **据え置く理由の候補**: 費用ではなく、公開後の検索の評価 (薄い記事の量産と見なされないか) と、同じ主題の重複 (`BLOG-DUPLICATE-AUDIT-01`) が制約になっている。上げるなら GSC で新規記事の表示が付くかを 4 週見てから。
- **案**: 11 月は据え置き (月 17〜19 本) で headless に移し、通過率と GSC の表示を見て 12 月の月次計画で 25〜30 本に上げるかを決める。
- **決めてほしいこと**: 上限を据え置くか・上げるか、上げるなら何本か。

### [BLOG-OUTBOX-PASS-PUBLISH-01] `contents/blog/` で審査 PASS のまま止まっている下書きを公開するか決める
タグ: [コンテンツ品質] [種類:意思決定] [実行:ユーザー] [起票:2026-10-28] [領域:サイト]

- **状態 (2026-10-28)**: review.md が PASS の下書きは 7 本で、事実照合は 7 本とも通る。品質ゲートを今も通るのは `population-decline-land-price-divergence` だけ。5 本 (`elderly-welfare-expenditure-prefecture-gap`・`evacuation-plan-coverage-urban-prefecture-gap`・`intellectual-crime-tokyo-kagawa-gap`・`sme-business-sentiment-regional-gap`・`vacant-housing-rate-inherited-home-risk`) は未登録のタグ (UNREGISTERED_TAG)、`nursery-shortage-urban-prefecture` はスマホ用 SVG の欠落で落ちる。
- **次**: ① 5 本のタグを登録済みのものに替えるか台帳に足す ② nursery は `generate-article-charts.ts --slug nursery-shortage-urban-prefecture` でスマホ用 SVG を作る ③ 通ったものを `generate-blog-article.ts --ingest <slug>` で確定し、オーナー承認後に develop へ push する (公開は `blog-auto-publish.yml`)。
- **追加 (2026-10-28)**: headless の実測で審査 PASS した 3 本 (`dried-udon-soba-consumption-quantity-prefecture-gap`・`general-hospital-count-vs-elderly-single-person-households`・`avg-salary-police-prefecture-vs-national-assessment`) を `published: false` のまま branch `claude/determined-newton-2d077c` に置いた。後の 2 本は題材の弱さ (BLOG-TOPIC-PAIR-PER-CAPITA-01) があるので、公開するかは題材ごと判断する。
- **注意**: 2026-10-28 に headless の審査 (基準を blog-critic に揃えた版) を `vacant-housing-rate-inherited-home-risk` に掛けたところ、blog-critic (Agent) の PASS 後も「山梨を西日本に含める」「人口移動を因果として断定」の blocker が残っていた。公開前に各本を審査し直す。
- **決めてほしいこと**: 7 本を公開するか (月の上限 BLOG-MONTHLY-CAP-01 の枠に入れるか)。

### [BLOG-NOTEBOOKLM-RESEARCH-01] NotebookLM の調査材料を記事に入れる段を試し、公式 API (企業版) を使うか決める
タグ: [コンテンツ品質] [種類:意思決定] [実行:対話] [起票:2026-10-28] [領域:サイト]

- **用意済み**: `/notebooklm-research` に「新規記事の調査段」を書いた。非公式 CLI (`~/bin/notebooklm`) の回答をそのまま `contents/blog/<slug>/research.md` に保存し、`write-blog-headless.ts` が author prompt に足す (白書の数値は書かせない)。Claude は回答を読まないのでこの段の Claude トークンは 0。ログイン (`notebooklm login`) は人がブラウザで行い、期限切れになると止まる。CI では使えない。
- **次**: 型B 以外の記事 3 本で research.md あり・なしを書き分け、critic の指摘 (背景の根拠不足) が減るかを headless-runs.csv と review.md で比べる。
- **決めてほしいこと**: 効果があれば、企業版 (Gemini Notebook Enterprise・Google Cloud のライセンスが要る) の公式 API に移すか。移さない場合は対話セッションで人がログインして回す運用のまま。

### [ADMIN-UI-DOBOKU-ALIGN-01] doboku-note の管理画面 (tools/admin-app) を stats47 と同じ Base UI (base-nova) の構成へ揃えるか決める
タグ: [UI・UX] [種類:意思決定] [実行:対話] [起票:2026-10-27] [領域:管理]

- **経緯**: stats47 の管理画面は 2026-10-27 に new-york-v4 (Radix) から base-nova (Base UI) へ移し、見本 shadcndashboard.dev の見た目と 5 つのページの型にそろえた (規約 `.claude/rules/admin-ui.md`)。doboku-note の `tools/admin-app` は Radix のままで、todo-standards で共通にしている管理画面の構成がこの時点から食い違う。
- **次**: doboku-note 側で Base UI へ移すか、Radix のまま見た目 (neutral・Geist・直角のカード) だけ合わせるかをオーナーが決める。移す場合は stats47 の `.claude/scripts/admin-ui/sync-shadcn-reference.mjs` (base-nova の取得と IconPlaceholder の変換) を流用し、作業は doboku-note のリポジトリで行う。
- **完了条件**: 方針が決まり、移す場合は doboku-note の backlog へ実装カードを移した時点でこのカードを削除する。

### [AFF-RANKING-SLOT-DECISION-01] ランキング面の広告枠 (ranking-incontent ほか) を続けるか決める
タグ: [収益化] [種類:意思決定] [実行:ユーザー] [起票:2026-10-27] [領域:管理]

- **経緯**: 旧 `AFF-IMPRESSION-ROUTING-01` (improvements.md) を 2026-10-27 に降格。ranking 面 4 枠 (`ranking-incontent` / `ranking-native` / `ranking-sidebar` / `rakuten-native`) の 4 週 (2026-10-03〜10-24 の 7日窓) は click 累計 5 件で、行の基準 (10 件未満は insufficient-sample) により効果は判定不能。週次 imp は 1,686 / 1,788 / 778 / 967 で、`ranking-incontent` は 10-17 週から 19 → 1 imp に落ちた。証拠と再現コマンドは `data/improvement/affiliate-improvement/improvement-log.md` の同 ID の節。
- **決めること**: ① `ranking-incontent` が 10-17 週から出ていない原因 (未確認。`git log -S"ranking-incontent" -- apps packages` と本番描画で確認する) を直すか、枠ごと外すか ② 残りの枠を、click が極小のまま続けるか。
- **完了条件**: 方針を決め、枠を直す・外す実装は別カードにする。

### [NOTE-PUBLISHED-DUPLICATES-DECISION-01] note 上で同じ記事が別 URL に複数回公開されている 8 組をどうするか決める
タグ: [SNS・マーケ] [種類:意思決定] [実行:ユーザー] [起票:2026-10-21] [領域:商品]

- **事実 (2026-10-21、`data/note/articles.json` の照合)**: 題名が同じで別の noteUrl を持つ公開済み記事が 8 組ある。「【2024年版】都道府県「最高気温」ランキング」は 4 本 (`a-maximum-temperature`・`recovered-n6f8a367906d1`・`recovered-n863f429319ca`・`recovered-nb2d65c42c28b`)、「大学数」ランキング・「47 都道府県データを 1 コマンドで取得する」・「e-Stat 統計の前年比較…」(有料) が各 2 本、koumuin の「災害時の SNS 発信文…」(有料)・「苦情メール返信案…」(有料)・「住民問い合わせ FAQ…」が各 2 本。台帳は実在の投稿どおりで誤りではない。
- **決めること**: 重複をそのまま残すか、片方を非公開にして残す方へ導線をまとめるか。有料の 3 組は購入者がいる可能性があるので、非公開にする前に購入の有無を記録 (`data/authenticated/revenue-history.json`) で確かめる。
- **停止条件**: note 上の記事の削除・非公開化はオーナーの判断と操作だけで行う (Claude はしない)。
- **完了条件**: 8 組の扱いが決まり、決めた操作の後に台帳の status が実際の公開状態と一致している。
- **統合 (2026-10-26)**: `NOTE-RECOVERED-DUPLICATE-CONSOLIDATION-01` をこのカードへ統合した。そちらにあった追加の論点: 火災死傷者数 2022 の有料 2 本は題名の比較が食い違う (`paid-n7290144784d4`「鳥取と神奈川で2.5倍」、`paid-nb17d039bc1aa`「鳥取と滋賀で約1.9倍」)。どちらかが誤りなら本文の是正も要る。後継記事がある組は、後継を仕上げて公開し旧 stub を非公開にする案が有力。

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
- **2026-11-11 実測 (GSC 最終更新 11-06・本番 HTTP・サイトマップ 11 本)**: 未送信で登録済みの 764 件 (先頭 500 件) に `/municipalities/ranking/<key>?page=`・`?pref=` 137 件、`/ranking/<key>?s47_ogp=<hash>` 23 件、`/blog?page=` 17 件、`/themes/<slug>?pref=` 3 件 (こちらは 301)。`?page=`・`?pref=`・`?s47_ogp=` の 3 例は 200 で canonical が本体を指す。`?s47_ogp=` 付きのページ URL がどこから張られているかは未確認。**次**: `s47_ogp` をページ URL に付けている生成元を探し、付けない形にできるかを決める。

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

### [KDP-EXPANSION-01] 参考文献の売れ筋型に合わせてKindleラインを組み直し、実測付きで拡張する

タグ: [収益化] [種類:意思決定] [実行:対話] [検証:npm run products:kindle:report] [起票:2026-09-19] [期日:2026-10-17] [領域:商品]

- **owner**: kindle-publisher (設計・生成) / article-writer + blog-critic (書き下ろし・意味レビュー) / kdp-operator (出品) / オーナー (KDPレポート・承認)
- **前提**: 参考文献vaultのKindle競合5冊は4型に分かれる。①単一論点の読み物 (S1-01と直接競合) ②1県1章のガイド ③見出し駆動の県民性ストーリー (1テーマ1見開き) ④単一表の超薄型。出版社系は指標横断の合成スコアと1県1ページ型。競合の販売数は未計測。コンテンツ販売の主チャネルは KDP で、集客は Amazon の検索と読み放題の推薦に置き stats47 からの送客を前提にしない (収益化戦略 §3.5・§6)。
- **順序**: ①S1 12冊の4週売上を台帳で確かめる。②S1 12冊を `PRODUCT-SALES-READINESS-01` の是正でv3化して差し替える。③S2/S3/S4 の未公開10冊は現行設計のまま出さない。S3は型②「1県1章」へ、S4は型③「意外な1位の県民性ストーリー」へ設計変更してから再生成。④新規パイロット3冊: (a) 47県庁所在市の食卓・家計ガイド (型②) (b) 意外な1位ストーリー集 (型③。S4を置換。自社既刊の4週の売上とKENPが取れてから着手) (c) 47都道府県 総合スコアブック (`prefecture-deviation/analyses.json` を型の参照に使い文言・構成は複製しない)。各冊は書き下ろし30%・critic PASS・Previewer確認後に公開し、4週実測で横展開を判断する。
- **設計契約**: `KindleBook.design` が必須 (`generate` は design 無しを拒否)。S1-01 以外の 31 冊は本カードの順序で設計する (S1 → S3 型② → S4 型③ → 新規 3 冊)。正典: `coconala-product-standards.md` §8「編集設計」。
- **2026-11-03 の状態とオーナー判断待ち (`PRODUCT-REFERRAL-MEASURE-01`)**: S1 12 冊の 4 週窓 (08-30〜09-26) は 8・9 月の月次レポートで計測済み。販売は K-S1-02 の 8 月の 1 冊だけで、窓の中か外か分からず、週次判定 (`data/products/kdp-weekly-publication.json`) は「判定不能」で止まる。**オーナー判断が要る**: この 1 冊を需要の証拠として扱うか (扱えば第 1 パイロットの準備へ進むが、収益化戦略 §3.6 の「新商品は作らない」とぶつかる)、扱わず S1 の見せ方・導線の改善 (EXP-013) を先に見るか。台帳への自動記録は `KDP-LEDGER-AUTO-01`。
- **停止条件**: 売上未計測のまま10冊以上を同時公開しない。型④ (単一表の薄冊) は模倣しない (自社サイトの無料ページと同内容になる)。競合本の本文・図案・章立てを複製しない (論点と型のみ)。週次Mustの記事公開・SEOを圧迫する場合は本カードを後回しにする。
- **完了条件**: 自社22冊の4週売上が台帳にあり、S1 12冊がv3で差し替え済み、パイロット3冊が公開され各冊の初回4週KENP/販売数が記録されている。未計測のものを「需要あり」と書かない。

### [ADMIN-STAT-PILOT-01] 行政資料1業務の統計整理商品を検証し、有料pilotの採否を決める

タグ: [収益化] [種類:意思決定] [実行:対話] [起票:2026-09-18] [期日:2026-10-02] [領域:商品]

- **owner**: オーナー（実務例・協力者・購入条件） / strategy-advisor（比較と採否） / coconala-product-manager（採択後のサンプル仕様）
- **正典**: `docs/00_プロジェクト管理/02_収益化戦略.md` §2・§3.4・§5。議会答弁・計画策定のために各所の統計をExcelへ集める重複作業を減らす。対象業務の詳細・削減時間・支払者・価格・購入需要は未検証。
- **記録先**: `data/products/admin-stat-interviews.json`。聞き取り結果 (対象業務・完成条件・使った統計・現行手順・所要時間・手直し・再実施頻度・既存手段で残る作業・支払者・根拠) を書き、回顧による時間と実測を別フィールドで持つ。感想や意欲は購入意思の代用にしない。聞き取り票は同ファイルの `questionnaire` (Q0〜Q10)。相手はオーナーの元同僚・知人から同じ種類の業務の担当者 3 人。Q8 で組織の購入経路が見えなければデータ商品は見送り、Q9 の結果は `KNOWHOW-PRODUCT-PILOT-01` へ渡す。
- **需要の手掛かり (09-20〜10-26 の実測の要約)**: 行政実務の文脈のページが GSC 上位 (`/blog/assembly-answer-chatgpt-5steps` CTR 13.1%、`/blog/local-government-debt-burden`)。GA4 の PC・平日日中比率は上下水道・農業・高齢単身・e-Stat 実務の記事で高く、Teams 経由の流入もある (継続観測 `data/ga4/snapshots/<YYYY-Www>/landing-context.csv`)。CSV の用途 1 問は 28 日 89 件中「業務の資料」27 件で指標は分散 (`data/ga4/snapshots/2026-W42/download-purpose.csv`)。どれも標本が小さく購入意思の代用にしない。
- **①の途中経過 (2026-09-25 一時停止)**: 題材は「都道府県の介護保険事業支援計画 (第9期) の高齢者の現状分析章」。第一候補資料は岡山県の第9期計画 (案、https://www.pref.okayama.jp/uploaded/attachment/363015.pdf )。案の版なので確定版の URL を探して差し替える。**未決**: 軸にする業務 (介護保険事業支援計画を続けるか、オーナーの元部署の業務に替えるか) はオーナーの経験部署を確認してから決める。
- **優先・次（実行順）**: ①公開情報で再現できる実際の資料1件について、確定版 PDF の現状分析章の図表 (指標名・地域粒度・年次・出典) を列挙し、各指標の R2 `app/stats/<key>/values.json` の有無と最新年を表にする。②担当者3人を目安に、RESAS・自治体ダッシュボード・書籍・既存Excelでも残る作業と支払者の購入条件を確認する。③同じ仕様で助けられる場合だけ既存資産から無料サンプルを1つ作り、出典照合と利用者のExcel環境での編集を確認し、手直し込みの総時間を比較する。④収益化戦略§5の試用条件を満たした場合に価格・工数上限・時間単価・販売面を定め、有料pilotのGo/Pivot/Stopを判断する。期日は初回の採否・不足証拠確認日であり、未検証でも発売する期限ではない。
- **統合済み**: `DATA-PROCESSING-SIDE-INCOME-01` (データ加工の副業収入) と `TOOL-MATERIAL-BUILDER-01` (指標 N 個×地域 M 個を揃えた Excel にする無料ツールの最小版。2026-10-26 オーナー判断)。ツールの着手は①で対象資料 1 件が具体化してからで、その資料を初期プリセットにする。揃わない指標が完成条件に必須ならツールは停止条件に当たる。境界の正典は `docs/01_技術設計/03_情報設計.md`「ページとツールの境界」、保存先は `docs/01_技術設計/02_データアーキテクチャ.md`「ツールと利用者データ」。
- **既存タスクとの境界**: `PRODUCT-SALES-READINESS-01`等の品質是正・既存購入者への対応は維持するが、全商品完成を本検証の前提にしない。既存パックを利用できるかを先に調べ、用途未確認の新作・販売面を増やさない。採否後の優先順位は事業計画TS・商品カタログの開始条件にも反映する。商品在庫を需要の証拠と扱わない。
- **停止条件**: 既存手段で十分、担当者ごとに要件が異なり共通化できない、必要な粒度が取得できない、照合・手直しを含む時間が減らない場合は対象変更または見送り。協力者・試用が得られなければ未検証と記録し、次回確認日と再開条件を決める。検索数・DL数・AI作成の架空ペルソナで実務試用を代替しない。実務者への連絡、販売・価格の外部反映はこのカードだけでは実行しない。
- **完了条件**: 対象業務・必要粒度・代替手段・時間の測定方法と結果・支払者・購入経路・採算の入力が確認済み/未確認に分かれ、根拠付きのGo/Pivot/Stopが収益化戦略へ反映される。Goの場合だけ1商品・1販売面・価格・上限工数・観測期限が具体化される。実売を観測していなければ「事業成立」と報告しない。

### [GIT-HISTORY-SECRET-PURGE-01] Git履歴のAPIキーを扱う方針決定

タグ: [種類:意思決定] [実行:対話] [起票:2026-07-11] [領域:管理]

- **owner**: uruhayato373
- **次**: 対象キーが失効・rotation済みかを確認し、秘密検査で現行treeに残存がないことを確定する。
- **trigger**: 履歴書換えを実施する場合は、全clone・fork・open branchへの影響を合意し、専用maintenance windowを取る。
- **禁止**: owner承認なしにfilter-repo、force push、branch削除を行わない。

### [TAG-FEATURE-NEED-01] タグ機能は本当に必要か決める
タグ: [UI・UX] [種類:意思決定] [実行:対話] [起票:2026-09-27] [領域:サイト]

利用実績と保守コストを見て、残すか畳むかを決める。（出典: 2026-09-24 の手書きメモ・vault dairy/2026-09-24）
