# @stats47/product-factory

stats47 の地図・チャート・公的統計から、ココナラ向け Office・データ商品と Kindle 向け EPUB を
決定的に生成・検証するワークスペース。

- 恒久仕様: `.claude/rules/coconala-product-standards.md`
- 商品カタログ SSOT: `src/catalog/products/packs.ts`（P-01〜P-14 の14テーマパック）
- 旧商品案の由来: Git履歴上の旧 A-01〜L-07。現行の由来情報は `packs.ts` の `sourceIds`
- 残タスク: `.claude/todo/backlog.md`

商品定義・テンプレート・生成コードは git TS、観測値は既存 R2 が SSOT。生成した Office、
PDF、画像、EPUB は `.local/` 配下の派生物であり、git や公開 R2 へ保存しない。

## 現在の実装

- 旧 A-01〜L-07 の174商品は、2026-07-23に14テーマパックへ縮約済み。旧IDは各パックの
  `sourceIds` に由来情報として残す。
- `src/build/` と `src/generators/` に PPTX / XLSX / CSV / SVG / PNG / PDF / 販売文 /
  manifest / readiness の生成器を実装済み。
- 設計statusは `packs.ts`、外部公開実績は `.claude/config/{coconala,kdp}-listings.json`。
  生成・公開・販売品質を同じstatusで代用しない。横断一覧は `products:report` で再生成する。
- PowerPoint / Excel の構造検証と自動テストは実装済み。Windows/Mac Office実機での表示、
  再着色、再計算は人間が `READINESS.md` に沿って確認する。
- noteチャネルは現行14パックから計画を導出し、型検査・テスト対象。販売準備は `revision` を使い、
  公開済みパックの `_delivery` 固定SHAから別版を作る。旧v1直参照のgenerate/promoteは使わない。
- Kindleチャネルは `src/channels/kindle/` に同居する。EPUB生成とKDPフォーム操作を分離し、
  ログイン、税務・銀行情報、実公開は人間工程とする。

## CLI

```bash
# ココナラ商品
npm run products:catalog  --workspace=@stats47/product-factory -- --check
npm run products:validate --workspace=@stats47/product-factory -- --id P-01
npm run products:generate --workspace=@stats47/product-factory -- --id P-01 --version <NEW_VERSION>
npm run products:report   --workspace=@stats47/product-factory -- --kindle-version <VERSION> --note-revision <REVISION>

# Kindle
npm run products:kindle:plan     --workspace=@stats47/product-factory
npm run products:kindle:validate --workspace=@stats47/product-factory
npm run products:kindle:generate --workspace=@stats47/product-factory -- --id <BOOK_ID> --version <NEW_VERSION>
npm run products:kindle:verify-epub --workspace=@stats47/product-factory -- --version <VERSION>
npm run products:kindle:kdp-listings --workspace=@stats47/product-factory -- --version <VERSION>

# note販売準備（新規revisionのみ。既存原稿・公開台帳は上書きしない）
npx tsx packages/product-factory/src/channels/note/cli.ts revision --revision <NEW_REVISION> --all
npx tsx packages/product-factory/src/channels/note/cli.ts revision --revision <REVISION> --all --validate

# 共通検証
npm run type-check --workspace=@stats47/product-factory
npm run test:run   --workspace=@stats47/product-factory
```

全商品生成には明示的な `--all` が必要。ココナラ/KDPへの実公開は生成CLIの責務ではなく、
専用Playwrightスクリプトの `--commit` とオーナー承認を必須とする。

## 技術上の制約

### 横断販売カタログ

`src/build/sales-catalog.ts` は既存の商品・書籍・Geo企画TSと出品証跡を結合する読み取り専用の派生器。
`products:report` は `.claude/state/products/catalog-status.json` と
`.local/product-portfolio/catalog.{html,csv}` を生成する。HTMLは商品ID・販売先・残工程で検索できる。
商品IDを販売先ごとに増殖させず、無料サンプル・未制作企画も区別する。
既定の改訂候補は`CURRENT_SALES_REVISIONS`（git TS）で固定する。ディレクトリ名順で実験版を採用したり、通常の再集計でnote原稿が旧版へ戻ったりしない。明示フラグによる別版の監査は可能だが、公開記録は変更しない。

納品版はmanifestと全ファイルのSHA/容量を検査。Kindleは指定版のmetadataで欠落・内部比率・本文量を判定し、
意味レビュー・Previewer・暗号化保全・公開承認を別ゲートにする。公開statusには元の確認日を保持し、
レポート生成日を公開確認日にしない。生成・ハッシュ一致・カタログvalidator PASSだけでは販売準備完了にならない。
Kindle改訂版は全予定指標を処理し、旧24件打切りを使わない。書き下ろし30%は内部編集品質基準であり、
Amazonの許諾・審査合格を保証する閾値ではない。旧公開版と新しい改訂候補を削除・上書きしない。

Kindleの`metadata.authoredSha256`は書誌・章定義・fresh原稿・入稿専用校訂を固定し、変更後に旧EPUBを現行版と表示しない。
`editorial-corrections.ts`は原文完全一致の校訂だけを入稿版へ適用し、原文が変われば生成を停止する。
公開ブログ自体は変更しない。部分校訂済みでも、図・他段落を含む章全体の独立レビューは省略しない。
ランキング章は未レビューのサイトAI解説を転載せず、観測値からの決定的集計・同順位処理・全県の数値表を採用する。
数値の範囲検査だけでは分母の誤解や無根拠の因果説明を保証できないためであり、書き下ろし章の意味レビューとは別に扱う。
元のサイト解説・旧版EPUBは保持する。除外で本文量が基準を下回った巻は未達のまま記録し、閾値を下げたり定型文で水増ししたりしない。
書き下ろし比率や制作方針を記録する`newContentNote`は内部メタデータであり、EPUBの扉へ表示しない。
単発・バッチの入稿は`kdp-release-gate.mjs`が保全版一致とカタログ共通の本文検査を実行する。
`verify-publishable --content-only`は本文の検査専用で、保全やオーナー承認の代わりにはならない。
独立レビューは同じ版の`review.json`（schemaVersion=1、bookId/version/epubSha256/authoredSha256、
verdict、scope=all-chapters、reviewer、authorIds、reviewedAt、chapters、unresolvedFindings）を読む。
実EPUBの全本文から仕様検証時に抽出したfileName/sha256を正とし、metadata.reviewChaptersとreview.jsonの両方が一致することを求める。
reviewer/authorIdsは正規化済みIDのみ。git TSの`revisionEditorIds`にある当該版の編集参加者をreceipt側で省略できず、別reviewerによるPASSかつ未解決0でのみ通す。
これは公開承認の代用ではない。KDP書誌出力は`.local/kindle-listing-revisions/<version>.json`の準備提案のみで、
旧`--apply`による公開台帳一括上書きを拒否する。出品台帳の切替は実機確認・保全・承認後の別工程。

暗号化保全は`kindle:archive --push --id <ID> --version <VERSION>`、検証済み記録は
`--audit --id <ID> --version <VERSION> --deep --record`。push成功だけでは検証済みにしない。
過去revisionの版を保持し、`--restore --id <ID> --version <VERSION>`で別版も復元できる。
KDPの単発・バッチは共有flowで送信版と保全済み必須5ファイルのSHA/容量を照合する。
画面の既存「アップロード済み」だけを現行版の証拠にしない。同じセッションで検証済みEPUB/表紙の固定bytesを送信し、処理完了と最終read-backを確認する。公開直前に版とSHAを再照合し、送信証拠がなければ再投入する。これはPreviewer・本人による申告/公開承認を代替しない。

無料P-13は総人口2024のPDF・PNG・CSV見本（Office非同梱）。生成時の固定先は
`.claude/state/products/free-sample-delivery.json`に記録し、Coconalaの公開記録へ混ぜない。
note無料原稿はこのpinだけを参照し、有料パックの添付を露出しない。
Noto JPのPDFはフォント全体を埋め込む。subsetでは文字抽出が成功しても描画文字が欠けるため、
`tests/free-sample.test.ts`で埋め込みバイトを検査し、生成後にはページ画像も確認する。

### 公開済み定型パックの納品物照合

販売文の件数・形式は `.claude/config/coconala-listings.json` の `_delivery` で、実際の
manifest SHA・CSVの47地域・出典行数・PowerPoint抜粋数と照合する。
`node .claude/scripts/coconala/render-pack-previews.mjs` が読み取り検査、`--render` がCSV見本画像生成。
見本はExcelのスクリーンショットを装わず、実数値と出典・対象範囲を表示する。
`node .claude/scripts/coconala/audit-revised-deliveries.mjs` で旧版との数値・欠損位置保存、
Excel一覧の全セル、PPT抜粋・PDF全指標の定義、PDFの全テキスト矩形がページ内にあることを検査する（Poppler必須）。

2026-09-06の表示修正版は `.local/coconala-products/P-*/v2-20260906-r1/`。
旧版v1のハッシュ検証後、`rebuild-pack-deliveries.mjs --id P-XX --build` で別版を生成する。
数値・欠損・年・単位は固定し、公式メタデータ由来の指標名を `verified-product-labels.ts` に固定する。
`product-indicator-label.ts` はソースの表ID・分類コードが変わったら再照合を要求する。
短いサイト用titleをそのまま納品物の定義として使わない。基準年固定版を「最新」と宣伝しない。
現行メタにない歴史系列2件は出典の注意事項と `revision-audit.json` に未再確認と記録する。
改訂は原観測値の全量再取得・Office実機互換性検証を意味しない。納品先の選択は `_delivery` を正とし、旧版を送らない。

### Geo専用の納品見本（既存P-*パックとは別）

`src/channels/geo/service-offer.ts` が `GEO-SERVICE-01` の商品範囲・承認済み販売条件を管理する。
`npm run products:geo:delivery --workspace=@stats47/product-factory -- --pref 14` で、
地価地点と人口メッシュの対応を保持した1県の納品見本を生成する。01〜47に対応するが、
毎回全国47県のartifact SHA・空間結合・保存則と公開manifest同一性を先に検証する。

出力は `.local/coconala-products/GEO-SERVICE-01/pref-<NN>-draft-*/`。既存出力・note商品を
上書きしない。HTMLレポート、SVG模式図、地点CSV、メッシュWKT CSV、原artifact、
出典・辞書・利用条件・SHA付きZIPと、出品文案・READINESSを作る。
背景タイルは含まない。JGD2011の経緯度を維持し、距離・面積測定、住所検索、任意商圏、
将来価格の推定、Office編集機能を標榜しない。データ部分のCC BYの権利を
独自説明文・レイアウトの再販売禁止と混同しない。

生成成功・販売条件承認は外部出品・需要確認を意味しない。承認の証拠は商品定義の
`approvalRecord`を参照する。既存noteの利用反応と公開条件を確認してから1商品だけ出品する。
`products:geo:validate` は既存4本のnoteパック専用で、本サービスの検証とは別。
原典の全量再取得・QGIS/Office実機確認を行ったという保証は付けない。

- PPTX: `pptxgenjs` の `custGeom` で県別に再着色できる地図とネイティブチャートを生成する。
- XLSX: `exceljs` で値変更後に再計算する数式を生成する。ネイティブチャート生成は保証しない。
- CSV: 日本語Excel向けにUTF-8 BOMを付ける。
- PDF: `pdf-lib` と日本語フォントを使う。
- 地図の結合キーは都道府県コードとし、名称文字列をキーにしない。
- 欠損・秘匿・非該当を0として扱わない。
- 全成果物に出典、基準年、単位、利用条件、免責を含める。
