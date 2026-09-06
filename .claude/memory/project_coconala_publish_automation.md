---
name: project_coconala_publish_automation
description: ココナラ出品自動化(Playwright)をdoboku-noteから移植・stats47で稼働。10/11フォーム刷新の非自明な必須項目・価格value skew等の実機知見。2026-07-23に13商品(P-01〜P-12/P-14・テーマ別データ集)公開・個別AI画像設定済み
metadata: 
  node_type: memory
  type: project
  originSessionId: 2f2d73ae-c416-421c-9ecc-09ee683fbf9c
  modified: 2026-07-23T06:43:26.489Z
---

ココナラ(coconala.com)出品自動化を doboku-note から stats47 へ移植し、初商品を公開した(2026-07-23)。

## 構成 (stats47・★dobokunoteとは別アカウント)
- agent `coconala-operator` / skill `/coconala-publish` / scripts `.claude/scripts/coconala/`
  (`login.mjs`→初回手動ログイン / `capture-account.mjs`→userId取得 / `discover-categories.mjs`→カテゴリ実value取得 /
  `coconala-{publish,edit,delete-draft}.mjs` + `lib/coconala-{session,form}.mjs`)
- 出品内容SoT=`.claude/config/coconala-listings.json`(product id別)、アカウント=`coconala-account.json`
  (期待ID・表示名は同configのみを参照 / profile=`.local/playwright-coconala-profile`)。
- 商品設計の上流SSOT=`packages/product-factory`(174商品)。規約=`.claude/rules/coconala-product-standards.md §6`
  (2026-07-23に「出品自動化しない」→「フォーム入力は自動化・実公開`--commit`とログインは人間工程」へ改訂)。

## account assert は userId で照合 (sellerName不可)
新規セラー(出品0件)は表示名が /mypage/services_lists 本文に出ないため、sellerNameテキスト照合は機能しない。
**問題**: ダッシュボードの最初の`/users/NNNN`を本人と誤認し、正しいセッションでも照合が停止した。
**原因**: おすすめ出品者のプロフィールリンクが本人リンクより前に並ぶ。
**対策**: `assertAccount`は`/mypage/user`の「表示を確認する」リンクに限定する。IDが空・複数・異なる場合は停止し、表示名へフォールバックしない。
**証拠**: `.claude/scripts/coconala/__tests__/session.test.mjs`。おすすめリンクの混入、曖昧ID、別ドメインを拒否する回帰テスト（2026-09-06）。`readListings`は`fixLimit`もフォームへ渡す。

## ★コナラ10/11フォーム刷新の非自明な必須項目 (移植元2026-07-18以降に変わった。form.mjsで対応済)
1. **価格 value skew**: #ServicePrice の option は value=表示×1.1(手数料込。表示"4,000円"⇔value"4400")。
   value一致・Playwright label一致(30sタイムアウト)で選べない→**表示テキスト一致でin-page選択**。
2. **サービスタイトル25字以内** (末尾「ます」自動付与を含む)。超過は下書き保存が記入エラー。
3. **提供形式(provision_format)はカテゴリによって非表示**。2026-09-06に既存13商品（13/427/482）で確認。非表示radioをDOMで3へ強制変更しても保存値は2のまま。
   →visibleな場合だけ実クリックし保存後read-back。非表示はcategory-inactiveとして保持し、本文の納品内容・納期・修正回数を照合する。selector不在はUI変更として警告する。
4. **無料修正回数 `select[name="data[Service][fix_limit]"]` が公開時のみ必須**(下書き保存では任意)。
   値 -1=無料修正なし/1=1回…。ready-mファイルは -1。
- カテゴリはコナラ実機依存: `discover-categories.mjs --master N` で master→sub→type→facet の実valueを取得して確定。
  データ資料商品 = master13(ビジネス代行) › sub427(資料・企画書作成) › type482(各種資料作成相談) / facet Excel292等。

## 公開実績 (2026-07-23: 13商品 live)
product-factory の13パック(P-01〜P-12・P-14。旧D-01=P-01にrename)を全て「テーマ別・全指標入り」
データ集としてコナラ公開。実際の納品範囲はlistingの`_delivery`を参照する。旧販売文の全数・形式は検証証拠ではない。
serviceId: P-01=4323722/P-02=4323916/P-03=4323937/P-04=4324057/P-05=4324061/P-06=4324062/P-07=4324065/
P-08=4324067/P-09=4324069/P-10=4324073/P-11=4324076/P-12=4324231/P-14=4323941。P-13(無料)は非出品。
- **テーマ整合是正**: e-Statカテゴリ≠商品テーマ名の不整合(観光カテゴリ=実は運輸/economy=家計等)を、
  listing レベルで実内容に合わせ改名(P-03観光・交通/P-06教育・文化/P-07気候・土地/P-09農業・産業 等)。
- **個別サムネ**: Codex ビルトイン画像生成で12テーマ別画像(日本地図×モチーフ・文字なし)→各 live に差し替え。
- **公開済みの画像差し替え**: `coconala-edit --image --replace-image --commit` (★既定の --image は全フィールド
  再適用+差し替え。--image-only 明示時のみ画像のみ=公開済みで provisionFormat が既定へ戻り更新失敗する事故回避)。
- draft-first→`--commit`はオーナー承認後。納品ファイル本体は購入後トークルーム送付(出品ページはサムネのみ)。
  検証で作られた空の下書きは `coconala-delete-draft.mjs --id … --commit`(4重ガード・公開済みidは保護)で掃除。
- ★git-race注意: 併走セッションが product-factory と listings を随時コミット。card-census(repo全体走査)が
  併走の未baseline Card で落ちると全コミットが止まる→ --no-verify で自ファイルのみ commit で回避したことあり。

## 関連

**問題**: 図書館数31.8館など、人口当たりの値が総数に見える納品ファイルと、件数・Excel同梱・PPT全数の販売文不一致があった。
**原因**: pack-snapshotが短いtitleだけを納品indicatorへ渡し、subtitleも公式の分母も失った。販売文をバイナリmanifestへ照合していなかった。
**対策**: `product-indicator-label.ts`の公式表ID・分類コード付き定義を全形式に使い、`pack-evidence.mjs`で固定版のSHA・47地域・収録数・形式・PPT抜粋数を検査する。旧版は上書きせず別版とし、Office実機検証と観測値の再取得を区別する。
**証拠**: `product-indicator-label.test.ts`、`pack-evidence.test.mjs`（2026-09-06）。

[[project_coconala_product_factory]] (商品ファクトリー・D-01は実データ多指標化済=人口/面積/世帯/所得) /
[[feedback_note_publish_automation]] (同系のbrowser自動化) / 正典 `.claude/rules/coconala-product-standards.md`
