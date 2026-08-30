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

## 正典
`.claude/rules/coconala-product-standards.md §8` (product-factory同居) / 企画SSOT `packages/product-factory/src/channels/kindle/book-catalog.ts`。初期市場・書籍調査はGit履歴。関連: [[project_coconala_product_factory]] [[project_blog_remediation_loop]]
