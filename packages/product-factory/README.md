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
- P-01は `listed`、P-02〜P-11は `approved`、P-12〜P-14は `cataloged`。出品可否の正典は
  `packs.ts` の status と validator であり、このREADMEへ個別条件を重複定義しない。
- PowerPoint / Excel の構造検証と自動テストは実装済み。Windows/Mac Office実機での表示、
  再着色、再計算は人間が `READINESS.md` に沿って確認する。
- noteチャネルは旧174商品前提のため一時的に型検査・テスト対象外。14パックへの移行が完了するまで
  `products:note:*` を実運用しない。
- Kindleチャネルは `src/channels/kindle/` に同居する。EPUB生成とKDPフォーム操作を分離し、
  ログイン、税務・銀行情報、実公開は人間工程とする。

## CLI

```bash
# ココナラ商品
npm run products:catalog  --workspace=@stats47/product-factory -- --check
npm run products:validate --workspace=@stats47/product-factory -- --id P-01
npm run products:generate --workspace=@stats47/product-factory -- --id P-01
npm run products:report   --workspace=@stats47/product-factory

# Kindle
npm run products:kindle:plan     --workspace=@stats47/product-factory
npm run products:kindle:validate --workspace=@stats47/product-factory
npm run products:kindle:generate --workspace=@stats47/product-factory -- --id <BOOK_ID>

# 共通検証
npm run type-check --workspace=@stats47/product-factory
npm run test:run   --workspace=@stats47/product-factory
```

全商品生成には明示的な `--all` が必要。ココナラ/KDPへの実公開は生成CLIの責務ではなく、
専用Playwrightスクリプトの `--commit` とオーナー承認を必須とする。

## 技術上の制約

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
