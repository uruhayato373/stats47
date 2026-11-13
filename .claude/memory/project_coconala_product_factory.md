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

**LP反映漏れ (2026-11-12〜13)**: 通常URLに改訂案が出ない問題の修正後、財政LPが市区町村だけの内容に見え、既存の都道府県データが隠れた。
**原因**: 通常URLの固定版を改訂案に丸ごと置換した。改訂案は追加分析の範囲しか持たず、既存の収録内容を保存する検査がなかった。
**対策**: `resolveProductDetail` は販売版と改訂案を分けて返す。`productEditions` をLP・note初稿・テーマで共有し、販売版を残して改訂案を別節に表示する。画像は各版のslugから解決し、作成例IDの重複を拒否する。開発中の両ルートはnoindex・未公開表示・Product Offerなし、購入案内は販売版だけ。本番は固定販売版を保持する。全商品で両版の収録内容・作成例・画像・テーマの参照を検査する。
**証拠**: `apps/web/src/features/products/{editions.ts,product-detail.ts,__tests__/product-detail.test.ts,__tests__/theme-products.test.ts}`、`apps/web/tests/smoke/responsive-layout.spec.ts`、`.claude/scripts/note/__tests__/build-product-landing-preview.test.ts`。表示確認はユーザーが開くURLで行い、専用previewの確認だけで完了にしない。

**商品分析の偏り (2026-11-13)**: 財政の改訂案が単年比較に偏り、家計では目的に記した品目構成の入力・図がなかった。
**原因**: 原典参照と画像型は検査していたが、推移・構成・地域比較の採否が自由文の目的から計算へ結ばれていなかった。
**対策**: `analysisPlan.axes` を全商品で必須とし、採用したレシピと実結果を照合する。未取得の年や分母は保留理由を残す。構成図は共通計算で総額・内訳・残差を検査して既存画像型へ渡し、欠測の0化や再正規化を防ぐ。証拠は `analysis-coverage.test.ts` / `analysis-compute.test.ts`、生成/再検査CLI。

**地図の数値表示 (2026-11-12)**: 計算した割合の順位表は小数2桁でも、凡例に長い小数が出た。共通の `chartValueLabels` が推定した表示精度を `display` に渡していなかったため。推定精度を凡例にも共有し、観測値を変えずに表記を揃える。`apps/admin/tests/unit/template-area-scope.test.ts` で値と凡例の両方を検証する。

**全国地図の配線 (2026-11-12)**: 全国の市区町村データがあっても、分析レシピと描画器が県指定を必須にしていたためLPへ全国図を出せなかった。`within` で全国／県内を宣言し、共通画像型・地域台帳・政令市統合境界へ接続する。描画前に対象外の集計コードを除き、離島を別位置へ配置して、欠測を含む全対象コードが一度ずつ描かれることを検査する。境界の一部欠落を「データなし」に見せない。証拠は `analysis-choropleth.test.ts` と `template-area-map.test.ts`。

**テーマとの参照と出典表示 (2026-11-13)**: 商品の分析例とテーマの章が別々に更新され、関連する分析へ移動できなかった。また、原典の別定義を使う県の図にも元指標の「市区町村」という出典名が残った。
**原因**: 作成例から章への参照契約がなく、出典名は取得表ではなく元指標の表示名を使っていた。
**対策**: `products.landings` の作成例に `themeRefs` を持たせ、章名・URL・テーマ側の逆引きを共通解決する。テーマ側もLPと同じ版選択を使い、関連章だけに案内する。出典は解決後の表・項目コードから既存の出典台帳を引く。改訂時はLP・note初稿・図を同時に生成し、存在しない章・古い生成見出し・販売版と改訂案の混在をCIで止める。
**証拠**: `analysis-source-contract.test.ts`、`analysis-catalog.test.ts`、`theme-products.test.ts`、`.claude/scripts/products/check-analysis-catalog.ts`。表示の往復と幅別検査は既存の `responsive-layout.spec.ts` に統合する。

**表示境界の検査 (2026-11-13)**: テーマから商品へのリンクを足すと、県比較を禁じる検査が商品カタログ内のLP用説明文まで表示文とみなしてCIを止めた。
**原因**: import先の全文を検索し、JSON相当の生成台帳と描画コードを区別していなかった。Windowsでは相対パスの区切りも既存の許可一覧と一致しなかった。
**対策**: `region-page-no-comparison.test.ts` はASTで型importとリテラル定数だけの生成台帳を判別し、値import・関数・呼出し・JSXを含む場合は除外しない。商品別の許可は増やさず、全商品の販売版・改訂案からテーマへ渡る実際の案内文を検査し、説明文・図が混入しないことを確認する。相対パスはOSに依存しない形へ揃える。
**証拠**: PR #1258の初回CIは2973件中この1件だけ失敗。修正後の対象6テストPASS（Windows）。

**公開後の導線検査 (2026-11-13)**: 本番 smoke run 43372690063 で、商品へ戻るクリックが `#google_vignette` に変わり時間切れになった。
**原因**: 画面操作テストが実際の広告を読み込み、全画面広告の割り込みを受けていた。別の幅別確認では非表示要素を含む途中DOMも検出した。
**対策**: smoke の共通fixtureで広告・GA4通信を遮断する。広告による本文書き換えを監視する専用specだけ広告を有効に保ち、静的契約テストでこの境界を固定する。リンクは表示中の要素が1つであることと実際の往復を検査し、先頭の要素で重複を隠さない。
