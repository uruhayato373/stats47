---
name: project_coconala_product_factory
description: 商品設計・公開記録・固定納品版・販売準備を分離するproduct-factoryの正典
type: project
---

**問題**: 商品カタログのgeneratedやmanifest存在を販売準備完了と混同し、旧版や古い商品件数を現行仕様として案内していた。

**原因**: 設計status・外部公開state・納品物の品質を同じ欄で表現し、メモが過去の生成件数とコマンドを複製していた。Kindle監査もv1を再生成していた。

**対策**: 商品定義は `packages/product-factory/src/catalog/` とKindle/GeoのTSを読む。外部公開記録は `.claude/config/{coconala,kdp}-listings.json`、納品版は `_delivery` のmanifest SHAを参照する。横断一覧は `products:report` が同じTSと証跡から生成する `.claude/state/products/catalog-status.json`。件数・状態を本メモへ複製しない。人間向けは `.local/product-portfolio/catalog.{html,csv}`。

**安全条件**: Kindleは `--version <NEW_VERSION>` で生成し既存版を上書きしない。全予定キーの欠落をmetadataに記録する。内部の書き下ろし比率・本文量、EPUB構造、意味レビュー、Previewer、暗号化版保全、公開承認を別ゲートにする。30%はAmazonの許諾基準ではない。監査の `verify-publishable.mts --apply` は拒否する。

**証拠**: `packages/product-factory/README.md`、`.claude/rules/coconala-product-standards.md`、`tests/{sales-catalog,kindle-revision,kindle-ranking-label,kindle-verify-cli}.test.ts`（2026-09-06）。未完了作業は `.claude/todo/backlog.md`。

**PDF表示の問題**: 小さな日本語データブックで、pdftotextは全文を返すのにPoppler描画では文字の大半が消えた。
**原因**: 同一内容でNoto JPのsubset埋め込みだけを無効化すると全4ページの文字が復帰した。pdf-lib issue #1232の既知症状とも一致する。
**対策**: `databook-pdf.ts`はフォント全体を埋め込み、`tests/free-sample.test.ts`で埋め込み原本バイト一致を検証する。抽出テキストだけを根拠にPDF表示PASSにせず、最終ページ画像を確認する。旧納品物は上書きしない。
**証拠**: https://github.com/Hopding/pdf-lib/issues/1232 、`tests/free-sample.test.ts`（2026-09-06）。

**再利用本文の問題**: 数値範囲監査を通った解説にも、率と人数・調査の分母・因果説明・同順位の誤りが残った。最終図には長い単位の文字重複と負値のゼロ長表示もあった。
**対策**: 商品のランキング章は未レビューAI本文を外し、決定的集計・全県表・単位を見出しへ分離した数値カードを採用する。書き下ろしと再利用ブログは別途全章レビューし、実EPUB由来の全章SHAと編集参加者IDに結び付ける。例外や定型文追加で比率を通さない。
**公開境界**: KDPの古いアップロード完了表示は現行版の証拠ではない。共有flowで検証した固定bytes・対象SHA・当該セッションの処理完了を必要とし、公開直前も再照合する。現行の準備版は`CURRENT_SALES_REVISIONS`を参照し、実験版や旧note版へ自動で切り替えない。
