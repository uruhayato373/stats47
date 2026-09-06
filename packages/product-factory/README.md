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

# 販売実績 (証拠ファイルのsha256付き。未記録と0件を分離)
npm run products:sales --workspace=@stats47/product-factory -- validate
npm run products:sales --workspace=@stats47/product-factory -- summary
npm run products:sales --workspace=@stats47/product-factory -- record \
  --channel kdp --product-id K-S1-01 \
  --period-start 2026-09-01 --period-end 2026-09-30 \
  --orders 0 --units 0 --net-yen 0 --refunds 0 --kenp 0 \
  --evidence .local/product-sales-evidence/kdp-2026-09.csv

販売明細の原本は個人・取引情報を含み得るため、git対象外の
`.local/product-sales-evidence/` にだけ置く。台帳には相対パスとsha256を記録し、
未計測と実測0件を区別する。

# 共通検証
npm run type-check --workspace=@stats47/product-factory
npm run test:run   --workspace=@stats47/product-factory
```

全商品生成には明示的な `--all` が必要。ココナラ/KDPへの実公開は生成CLIの責務ではなく、
専用Playwrightスクリプトの `--commit` とオーナー承認を必須とする。

## 技術上の制約

- PPTX: `pptxgenjs` の `custGeom` で県別に再着色できる地図とネイティブチャートを生成する。
- XLSX: `exceljs` で値変更後に再計算する数式を生成する。ネイティブチャート生成は保証しない。
- CSV: 日本語Excel向けにUTF-8 BOMを付ける。
- PDF: `pdf-lib` と日本語フォントを使う。
- 地図の結合キーは都道府県コードとし、名称文字列をキーにしない。
- 欠損・秘匿・非該当を0として扱わない。
- 全成果物に出典、基準年、単位、利用条件、免責を含める。
