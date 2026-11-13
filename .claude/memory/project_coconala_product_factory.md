---
name: project_coconala_product_factory
description: 商品設計・公開記録・固定納品版・販売準備を分離するproduct-factoryの正典
type: project
---

**問題**: 商品カタログのgeneratedやmanifest存在を販売準備完了と混同し、旧版や古い商品件数を現行仕様として案内していた。

**原因**: 設計status・外部公開state・納品物の品質を同じ欄で表現し、メモが過去の生成件数とコマンドを複製していた。Kindle監査もv1を再生成していた。

**対策**: 商品定義は `data/products/` のJSON台帳を正本とし、`packages/product-factory/src/catalog/` は読み込み口として読む。外部公開記録は note が `data/note/articles.json`、Kindle が `data/products/kdp/listings.json`、note の納品版は `data/products/note-pack-deliveries.json` の `_delivery` のmanifest SHAを参照する。横断一覧は `products:report` が同じTSと証跡から生成する `data/products/catalog-status.json`。件数・状態を本メモへ複製しない。人間向けは `.local/product-portfolio/catalog.{html,csv}`。

**安全条件**: Kindleは `--version <NEW_VERSION>` で生成し既存版を上書きしない。全予定キーの欠落をmetadataに記録する。内部の書き下ろし比率・本文量、EPUB構造、意味レビュー、Previewer、暗号化版保全、公開承認を別ゲートにする。30%はAmazonの許諾基準ではない。監査の `verify-publishable.mts --apply` は拒否する。

**証拠**: `packages/product-factory/README.md`、`.claude/rules/data-pack-standards.md`・`.claude/rules/kindle-publishing-standards.md`、`tests/{sales-catalog,kindle-revision,kindle-ranking-label,kindle-verify-cli}.test.ts`（2026-09-06）。未完了作業は `.claude/todo/backlog.md`。

**PDF表示の問題**: 小さな日本語データブックで、pdftotextは全文を返すのにPoppler描画では文字の大半が消えた。
**原因**: 同一内容でNoto JPのsubset埋め込みだけを無効化すると全4ページの文字が復帰した。pdf-lib issue #1232の既知症状とも一致する。
**対策**: `databook-pdf.ts`はフォント全体を埋め込み、`tests/free-sample.test.ts`で埋め込み原本バイト一致を検証する。抽出テキストだけを根拠にPDF表示PASSにせず、最終ページ画像を確認する。旧納品物は上書きしない。
**証拠**: https://github.com/Hopding/pdf-lib/issues/1232 、`tests/free-sample.test.ts`（2026-09-06）。

**再利用本文の問題**: 数値範囲監査を通った解説にも、率と人数・調査の分母・因果説明・同順位の誤りが残った。最終図には長い単位の文字重複と負値のゼロ長表示もあった。
**対策**: 商品のランキング章は未レビューAI本文を外し、決定的集計・全県表・単位を見出しへ分離した数値カードを採用する。書き下ろしと再利用ブログは別途全章レビューし、実EPUB由来の全章SHAと編集参加者IDに結び付ける。例外や定型文追加で比率を通さない。
**公開境界**: KDPの古いアップロード完了表示は現行版の証拠ではない。共有flowで検証した固定bytes・対象SHA・当該セッションの処理完了を必要とし、公開直前も再照合する。現行の準備版は`CURRENT_SALES_REVISIONS`を参照し、実験版や旧note版へ自動で切り替えない。

**分析配線の問題 (2026-11-12)**: 都道府県・最新年・カテゴリだけの商品選定では、市区町村や時系列を分析例へ結べなかった。原典が存在すること・サイト公開・固定販売版への収録も混同しやすかった。
**原因**: 商品と指標・統計対象・原典定義・期間・分母の参照が分離しており、LPの図生成が単一指標に限定されていた。
**対策**: `products.landings.analysisPlan/analysisRevision` を指標IDと `metrics.analysis-source-variants` へ接続する。通常の表番号や単位を商品台帳へ複製しない。`products:analysis:catalog` とCIの実台帳テスト、原票全座標・欠測・単位・年・分母の検査、解決後planのSHAで変更漏れを止める。共有する計算結果からCSV・Excel・共通画像・LP・noteを作り、既存販売版とは区別する。
**証拠**: `packages/product-factory/src/analysis/`、`.claude/scripts/products/build-analysis-pack.ts`、`data/products/landings/`。

**取得の問題 (2026-11-12)**: 複数ページの原典取得が100001行目で停止した。
**原因**: APIパラメータを `startRecord` と定義していたが、原典仕様は `startPosition`。未知の引数が無視され、先頭ページが繰り返された。
**対策**: API型・キャッシュキー・取得側を `startPosition` に統一し、実HTTP転送をテストする。FROM/TO/NEXT_KEY/TOTALと件数・全座標の照合は維持する。認証設定は共通環境ローダーをAPIパッケージimport前に読む。
**証拠**: https://www.e-stat.go.jp/api/api-info/e-stat-manual3-0 、`packages/product-factory/tests/analysis-fetch.test.ts`、`packages/estat-api/src/stats-data/repositories/api/`。

**LP反映漏れ (2026-11-12)**: 改訂プレビューは更新されても、利用者が開いている通常の商品URLには旧販売版が表示された。
**原因**: 通常LPは固定販売版だけ、previewルートは改訂候補だけを読み、通常URLを実測する検査がなかった。
**対策**: `resolveProductDetail` が開発環境だけ商品IDで改訂候補へ接続し、両ルートは `ProductDetail` を共有する。改訂候補はnoindex・未公開表示・Product Offerなし。上下の購入案内は「現在販売中の版」の台帳を使い、改訂候補のデータ・図が販売版に含まれないことを明示する。本番は固定販売版を保持する。環境別の解決テストと、全14商品の通常URL・上下購入案内・画像幅を4画面幅で検査し、配線漏れを検知する。
**証拠**: `apps/web/src/features/products/{product-detail.ts,__tests__/product-detail.test.ts}`、`apps/web/tests/smoke/responsive-layout.spec.ts`。表示確認はユーザーが開くURLで行い、専用previewの確認だけで完了にしない。

**地図の数値表示 (2026-11-12)**: 計算した割合の順位表は小数2桁でも、凡例に長い小数が出た。共通の `chartValueLabels` が推定した表示精度を `display` に渡していなかったため。推定精度を凡例にも共有し、観測値を変えずに表記を揃える。`apps/admin/tests/unit/template-area-scope.test.ts` で値と凡例の両方を検証する。

**全国地図の配線 (2026-11-12)**: 全国の市区町村データがあっても、分析レシピと描画器が県指定を必須にしていたためLPへ全国図を出せなかった。`within` で全国／県内を宣言し、共通画像型・地域台帳・政令市統合境界へ接続する。描画前に対象外の集計コードを除き、離島を別位置へ配置して、欠測を含む全対象コードが一度ずつ描かれることを検査する。境界の一部欠落を「データなし」に見せない。証拠は `analysis-choropleth.test.ts` と `template-area-map.test.ts`。
