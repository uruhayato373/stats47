---
name: project_kindle_publishing_factory
description: Kindle出版ファクトリー(product-factory kindleチャネル)。EPUB3生成・32冊カタログ・KDP自動出品・公開台帳を管理する
metadata: 
  node_type: memory
  type: project
  originSessionId: 2f2d73ae-c416-421c-9ecc-09ee683fbf9c
  modified: 2026-07-23T12:06:26.990Z
---

product-factory に **kindle チャネル**を新設し、Amazon KDP 向け電子書籍 (EPUB3) を既存ブログ資産から量産する基盤を作った (2026-07-23)。オーナー要望「参考PDFから論点抽出すれば著作権問題なく出版アイデアが作れる」への回答。

## 構成 (packages/product-factory/src/channels/kindle/)
- **SSOT = `book-catalog.ts`** (`KINDLE_BOOKS`・32冊)。4シリーズ: S1論点読み物12 / S2テーマ別データブック11 / S3地域別8 / S4ランキング大全1。本文素材SSOTは **R2 `app/blog/<slug>/article.md` + `data/*.svg`**。
- types.ts / validator.ts (決定的・id `^K-S[1-4]-\d{2}$`・manuscript以降はfresh章1つ+chapters必須) / fetch-content.ts (R2記事取得+frontmatter除去+SVG→PNG) / md-to-xhtml.ts (callout/画像/CTA除去) / cover.ts (satori→sharp 1600×2560) / build-book.ts (orchestrator) / cli.ts。
- **EPUB生成器 = `src/generators/epub.ts`** (jszip・EPUB3リフロー型・mimetype先頭STORE)。図表は章内ブロック画像PNG同梱。**PDFは使わない** (KDP電子はPDF実質不可・databook-pdf.tsは目次/画像非対応)。
- CLI: `products:kindle:{plan,validate,generate,report}`。生成台帳 `.claude/state/products/kindle-status.json`。生成物 `.local/kindle-books/<id>/v1/` (git管理外)。KDP送信版はAES-256-GCM暗号化してR2 `archive/kindle-encrypted/<id>/v1/<revision>/`へ保全し、`.claude/state/products/kindle-archives.json`から別PC復元・rollbackする。
- deps追加: jszip/sharp/satori (package-lock反映済・既存hoisted版)。

## ★全32冊 生成完了 (2026-07-23・status全generated)
S1論点読み物12 + S2テーマ別データブック11 + S3地域別8 + S4ランキング大全1 = 32冊すべてEPUB生成済み・書き下ろし比率30%以上・全EPUB構造妥当(mimetype先頭STORE/XHTML整形式malformed0/画像manifest整合)。tsc+vitest31 green。全て.local/kindle-books/<id>/v1/book.epub (git管理外)。
- **S1 (12冊)**: 各冊=既存ブログ5章 + 書き下ろし(はじめに/データの読み方/終章、各~10-13k実字数)。article-writer並列執筆→blog-critic(K-S1-01のみPASS実施、他は決定的常体チェック0件+検証済み数値)。★1冊5ブログ章で30%安定達成と判明。
- **S2 (11冊)**: コナラP-01〜14の書籍版データブック。intro書き下ろし + ranking章(R2観測値→上位5下位5チャートPNG24枚+算術考察)。ranking-databook.ts生成器。
- **S3 (8地方ブロック)**: 全国ランキング + 地域内最上位県のhighlight考察 (highlightCodes)。地域intro拡張で30%達成。
- **S4 (1冊)**: P-12全指標横断の大全。
- **build-book自動章**: 「図表の見方」「出典と再現」をfresh扱いで自動付与(K-S1-01除く)。30%ゲートは実測(未達赤字警告)。
- ★教訓: article-writer 11並列はインフラ全滅(API切れ/600秒stall)→**3冊ずつの小バッチ**で安定。書いた文字数の自己申告はbyte換算で~2.6x過大、buildのcountChars(JS.length)が正。

## パイロット K-S1-01『実質手取りの地図』(critic PASS)
家計・所得系ブログ9本 + 書き下ろし(はじめに/第0章/終章/出典) → 15章37図版。blog-critic PASS(原典curl裏取りで順位主張検証・常体修正)。review.md記録。

## 著作権・KDP規律 (data-provenance/pdf-book-survey と同一)
参照書籍(private Google Driveのsource bundle 8冊+survey 7冊)からは論点・型のみ。利用時はOS一時領域へ復元し、文言/図案/編集構成は複製しない。数値はe-Stat/R2自社データ。自ブログ再利用は自己著作物。**KDPの「Web無料入手可能コンテンツ」規定に備え再構成+30%書き下ろし必須** (validator が newContentNote非空+fresh章を強制)。KU登録は当面見送り(販売のみ¥500-1000)。

## ★KDP出品自動化 (2026-07-23・coconala-operatorから移植)
旧「KDPは自動化しない」を撤回し、コナラと同じPlaywright自動化を移植。agent `kdp-operator` / skill `/kdp-publish` /
`.claude/scripts/kdp/`(`{login,capture-account,kdp-publish}.mjs`+`lib/kdp-{session,form}.mjs`)。出品内容SoT=
`.claude/config/kdp-listings.json`(`products:kindle:kdp-listings --apply`でKINDLE_BOOKSから生成・32冊)、
アカウント=`.claude/config/kdp-account.json`(accountEmail要記入)、プロファイル=`.local/playwright-kdp-profile`。
- **安全境界(人間工程・維持)**: ログイン/2FA・税務(Tax interview)・銀行口座は代行しない。account assert(別アカウント防止)。
  draft-first + `--commit`(実公開)はオーナー承認。偽成功を報告しない。KU既定未登録。
- **★KDPはReact SPAでDOM可変** → 初回`kdp-publish --id <id> --probe`で`.local/kdp-debug/probe-*.json`に構造dumpし
  `kdp-form.mjs`のlabelセレクタを実機調整(coconalaのdiscover相当)。kdp-formはtry/catchで未充填をwarningsに積み公開を止める。
- **★生成AI申告は画面表示だけでは保存済みと判定できない** (2026-08-30 実測): 原稿・表紙の処理中に content → pricing 遷移が失敗し、その後 pricing を直接開くと、content画面ではAI選択値が見えてもサーバーの `data[generative_ai_questionnaire]` が未保存のままになる。出版POSTは汎用の「この項目は必須です」だけを表示する。対策は、ファイル処理中表示の消失を待つ → 処理後に確認checkboxをread-backして再投入 → contentの「保存して続行」でpricingへ遷移、の順を必須化する。既存下書きの補修では合格済みEPUB/表紙を再送しない。証拠: `.claude/scripts/kdp/lib/{kdp-flow,kdp-form}.mjs`、KDP `save-and-publish` 応答 (2026-08-30)。
- **ASIN後追い回収は初回公開申請日を保持する**: `writeBackListing` は既存 `publishedAt` を上書きせず、未設定時だけ日付を入れる。
- **KDP運用状態は`listed`と分離**: `kdpStatus=draft|in_review|live|unknown`、生表示、確認日時、最終申請日、販売中を初めて確認した日をlistingsに保存する。管理画面は審査中を公開済みにしない。
- **既刊修正はarchive-first**: ローカル6ファイルのSHAがR2の最新検証済みrevisionと一致しなければ`--update`/`--commit`を停止する。修正前revisionを残しrollback可能にする。
- 書籍生成・カタログ=kindle-publisher、KDP出品操作=kdp-operatorに分離(coconala-product-manager/operatorと同型)。
- 各書籍READINESS.mdにKindle Previewer確認〜アップロード手順を同梱。
- 書き下ろし章の最終仕上げは article-writer→blog-critic の既存品質ゲート。
- 需要ファースト: manuscript昇格→生成→オーナー明示承認後にKDP公開→4週実測(KENP/販売)→良ければ横展開。公開バッチはKDPの未公開タイトル上限を超えない。

## 公開状態 (2026-08-30)

32冊のKDP本棚照合結果は、**販売中12冊・レビュー中10冊・未作成10冊**（2026-08-30確認）。レビュー中10冊は同日にパイロット公開申請し、本棚read-back 10/10で確認した。未作成10冊は需要比較用に`draft`のまま保持し、4週間の販売数・KENPを見て次の公開を判断する。ASIN未割当は審査中の正常状態で、管理コンソールは公開済みに数えない。

## 品質監査 (2026-09-19)

販売中22冊 = archive `v1` (08-30) で、ランキング章はサイトAI解説の転載。`v3-20260906-r4` (全県表へ再構成・S1-01改題) は削除済み worktree `stats47-geo-release` で生成されたため**ローカル実体が無く、git のカタログ/コードから `products:kindle:generate --version` で再生成する**。監査は EPUB を jszip で展開し (冊間の指標/段落重複・ブログ残語・年/年度混在・率系の単位) を決定的に数えた → 結果と対策は backlog `PRODUCT-SALES-READINESS-01` / `KDP-EXPANSION-01`。S2/S3/S4 の指標選定は `book-ranking-keys.ts` (S2=本文が厚い順・S3=地域の極端順位) が原因で主題外・冊間重複が構造的に出る。競合Kindle本の型は vault の md/ の見出しだけで判定した (本文は読まない)。

## 設計契約と是正の実績 (2026-09-19 後半)

- **`KindleBook.design` (編集設計) を必須化**: 共通事業方針の判断の問い 5 つ (読者の悩み / HARM / 支払う理由 / 需要の証拠 / 次の検証) + STRUCTURE.md のタイトル 5 型 (異なる 2 型で 2 案・`title` はどちらかと一致) + 本文 9 型。`generate` は design 無しを拒否。S1-01 のみ設計済み (問い型「年収が高い県は、暮らしも豊かなのか」)。表紙は読点でも主題を折る。
- **指標定義シート** `npx tsx .claude/scripts/blog/build-metric-definition-sheet.ts --slug <slug>|--keys a,b` を執筆 (article-writer Phase 1-8) と審査 (blog-critic「定義整合」BLOCK) の共通入力にした。K-S1-01 の BLOCK 8 / MAJOR 19 は大半が「定義」の種類 (年次不一致・名目/実質・世帯範囲・相関→因果) で、旧 rubric に項目が無かったのが根本原因。シートは家計調査由来 metric の yearFormat が fiscal/calendar で割れていることも即座に露出した (backlog `METRIC-YEARFORMAT-KAKEI-01`)。
- **S1-01 の是正手順 (再利用可)**: critic の findings は「章テキストの逐語 before」で受け取る → plain→raw 写像 (太字 `**`・リンク `[..](..)` の境界を span に含める) → `editorial-corrections.ts` に exact-once で入れる。**校訂ファイルを再生成するとき、既存の校訂を落とすと critic の delta が「校訂の逆行」として検出する** (r3 で実際に 3 段落が旧文へ戻った)。Web 回遊行の除去 (`stripWebNavigation`) は「本記事→本章」の書き換え**より前**に行う。矛盾は導入・まとめ・見出しにも残るので、本文 1 文だけ直して終わらせない。
- 販売中 v1 と同じ誤りは公開ブログ 9 本にも残る → blog remediation へ引き渡し (backlog `PRODUCT-SALES-READINESS-01`)。R2 暗号化保全はこの Mac に鍵が無く未実施 (オーナー環境で `kindle:archive --push`)。

## S1 12 冊の全冊 critic PASS と、S2/S3/S4 20 冊の取り下げ判断 (2026-09-19 完了)

- **S1 12 冊はすべて blog-critic (opus) の全章 full 審査 → delta 再審査で PASS** (3〜8 版)。最終版 = 01 r9 / 02 r10 / 03 r11 / 04 r8 / 05 r11 / 06 r10 / 07 r9 / 08 r12 / 09 r10 / 10 r8 / 11 r8 / 12 r7 (表紙を Codex imagegen の帯絵に差し替えた版。本文は前版と byte 同一・全冊 `verify-publishable --content-only` blocker 0、`review.json` 受領証と `kindle-<版>-verification.json` あり)。verify-epub 3 層 error 0 (year-nendo-mix の warn は暦年指標と年度指標が同章に並ぶ正当なもの)。入稿提案は `.local/kindle-listing-revisions/<版>.<id>.json` (12 本)。校訂は `editorial-corrections.ts` に ~1,460 entries / 60 slugs。
- **生成器側の直し** (校訂で吸収できない再発型): 出典一覧は未公開 slug (R2 `all.json` published=false → 410) に URL を出さない (`fetchPublishedSlugSet`) / `<related-articles>` `<site-link>` を XHTML に露出させない / 出典節が無い章は `<data-source>` カードから「## データ出典」を起こす (`appendDataSourceSection`) / 本編の章題に「第1章〜」を振る (書き下ろしは「第0章」「終章」のまま) / 扉の紹介文 (concept) はですます調 / 図の読み方の「偏相関」段落と出典章の「推計を扱う章では…」は本文で使う冊だけ。
- **図の中の文字は `figure-corrections.ts`** (2026-09-19): critic が「据え置き (図側工程)」にした 図題・年の型・軸ラベルを、PNG 化の直前に SVG 文字列の exact 置換で直す (数値・点は不変。before が消えたら生成が止まる = ブログ側で図が直った合図でエントリを外す)。★config の `yearFormat` は家計調査・国勢調査・社会生活基本調査まで一律 fiscal なので **自動で 年→年度 にしてはいけない**。critic が本文で確定した型に、書籍に載る図だけ合わせる (K-S1-06 / 08 / 10)。調査は `.local/kindle-audit/fig-years.ts`。
- **表紙 (2026-09-19)**: 帯絵は `codex exec --sandbox workspace-write` に `$imagegen` を使わせて横長 1536×1024 で作り (MCP が繋がらない時も CLI で通る。`codex login status` が ChatGPT なら可)、`ingest-cover-background.mts --band` で下 42% に置く。プロンプトはシリーズ共通の型 (紺地 + 琥珀の paper-cut 風・大きなモチーフ 2〜3 個・文字/数字/地図/顔なし) を `.local/kindle-cover-imagegen/build-prompts.mjs` に持つ。縦長を cover-fit すると主題が文字面に隠れるので横長で描かせる。
- **投稿可否の機械証跡**: `verify-publishable.mts` は review.md ではなく `review.json` (受領証・`revision-evidence.ts` の契約) と `kindle-<版>-verification.json` (`verify-epub --report`、同じ版名の冊は `report[]` にマージ) を見る。受領証は `scripts/write-review-receipt.mts` が PASS の review.md から作る。残る blocker = R2 暗号化保全 (鍵) / Previewer 確認 / 権利・AI 申告・価格・最終承認 = オーナー工程。
- **critic の修正案も検算する**: K-S1-12 r1 の修正案「順位相関 0.70 / 0.19」は Pearson 値で、R2 から Spearman を再計算すると 0.65 / 0.13 だった (delta critic が捕捉)。書き下ろしで分布を書くときは R2 `values.json` から中央値・例外県 (埼玉は女性のメディア時間が男性より長い唯一の県) まで確かめてから書く。
- **S2/S3/S4 の 20 冊は取り下げ**: 販売中 10 冊に `withdrawal`、未作成 10 冊は `blocked-design` (`.claude/config/kdp-listings.json`)。理由 = ランキング章がサイト AI 解説の転載で編集設計が無い。再設計は backlog `KDP-EXPANSION-01`。
- **S2/S3/S4 の販売中 10 冊は 2026-09-19 にオーナー指示で出版停止済み** (`.claude/scripts/kdp/kdp-unpublish.mjs`: `--probe` で確認モーダルまで採取してから `--commit`。本棚 read-back「下書き」10/10、listing は `status: "withdrawn"`)。本棚の DOM の癖は kdp-operator.md / kdp-publish SKILL 8b に記載。
- **オーナー工程 (未実施)**: R2 暗号化保全 (鍵) → `kdp-publish --update` (12 冊) → `--commit` 承認 / kdpreports の冊別 export / ブログ側の同一誤り是正。

## KDP アカウントは doboku-note と共用 (2026-09-19 実測)

`kdp.amazon.co.jp/ja_JP/reports` のダッシュボード (アカウント合計) は 2026-09 月の「注文 4・既読 KENP 3,957・推計 ¥3,399」で、**売上上位 3 冊はすべて doboku-note の書籍** (2級土木施工管理技士 / 技術士 建設部門 / コンクリート診断士)。stats47 の 22 冊はここに入らず (stats47 は KU 未登録なので KENP は全部 doboku)、9 月の stats47 注文は多くて 1 件。**アカウント合計を stats47 の売上として台帳に入れない** (A8 と同じサイト帰属の罠 [[project_asp_site_attribution]])。冊別の注文・KENP は `kdpreports.amazon.co.jp` (別ドメイン・SSO 再ログインが要る = 人間工程) の「注文」レポートでしか取れない。旧 `/ja_JP/reports-dashboard` と `/reports/{orders,mtd,kenpc}` は 404。読み取り probe は `.claude/scripts/kdp/kdp-reports-probe.mjs`。

## 是正ツールの置き場 (2026-09-19)

セッション scratchpad はセッション終了で消える (`extract-one.mjs` / `book-fix.mjs` / 展開済み章テキストを一度失った)。書籍監査のツールと展開物は **`.local/kindle-audit/`** (git 管理外・永続) に置く: `extract-one.mjs` (EPUB→章テキスト) / `book-fix.mjs` (`map` = review.md の findings を raw markdown の逐語 before に写像・図指定は行削除・callout/箇条書き/見出しの接頭辞を保持・「本章→本記事」の再試行、`emit` = editorial-corrections.ts へ既存保持でマージ+manuscript 直接編集、`prune` = raw に当たらない校訂の掃除、`sources` = 章→素材) / `articles/` (R2 記事のキャッシュ) / `epub-v3/<id>-<version>/` / `defsheet-<id>.md`。critic の after に混じる指示文 (「（削除する）」「〜を明記」) は本文に印字されるので、emit 前後に必ず走査して落とす。

## 出品状態追加時は管理画面の読み取り契約も更新する (2026-09-21)

- **問題**: 全セッション統合のCIで `KDP_STATUS_INVALID` が20冊に発生し、取り下げ済み・設計待ちの本が「公開準備済み」に分類された。
- **原因**: listings は `withdrawn` / `blocked-design` を保持していたが、`apps/admin/lib/content-operations/core.ts` は `draft` / `listed` だけを認識し、完成物やarchiveの存在でreadyへ進めていた。
- **対策**: `blocked-thin` / `blocked-design` / `withdrawn` をblockedに正規化し、復元・公開案内より停止理由を優先する。未知の状態は監査エラーとblockedを維持する。状態追加時は同read model・unit test・`npm run audit:content-operations`を一緒に検証する。
- **証拠**: PR #999 / CI run `35550551365`、`apps/admin/tests/unit/content-operations.test.ts`。

## 正典

`.claude/rules/coconala-product-standards.md §8` (product-factory同居) / 企画SSOT `packages/product-factory/src/channels/kindle/book-catalog.ts`。初期市場・書籍調査はGit履歴。関連: [[project_coconala_product_factory]] [[project_blog_remediation_loop]]
