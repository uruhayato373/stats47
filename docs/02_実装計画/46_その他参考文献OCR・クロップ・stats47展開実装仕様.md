---
title: その他参考文献OCR・クロップ・stats47展開実装仕様
type: implementation-spec
date: 2026-08-29
updated: 2026-08-29
status: active
related_backlog: REFERENCE-SOURCE-EXPANSION-01
owner: open-data-curator
tags: [evidence, provenance, ocr, crop, source-vault, content-pipeline]
---

# その他参考文献OCR・クロップ・stats47展開実装仕様

## 0. 位置づけ

本書は、日本国勢図会以外でprivate Google Driveへ保全済みの3資料を、検証付きで一時復元し、文字抽出、
OCR、ページ画像化、内部照合用クロップを行った後、既存のstats47 SSOTへ安全に展開するための資料別契約である。
保存、復元、権利、一次資料への昇格条件は`.claude/rules/reference-source-standards.md`を正典とし、進捗は
`.claude/todo/backlog.md`の`REFERENCE-SOURCE-EXPANSION-01`だけで管理する。

この契約は原本画像やOCRを公開してよいという許可ではない。クロップは内部照合専用で、公開物は一次資料から
再取得した事実・数値とstats47独自の文章・図表だけで構成する。Drive bundleの差し替え、remote R2 write、
git push、PR、deploy、SNS・note公開は別途オーナー承認を要する。

## 1. 資料別の入力・owner・用途

| profile / sourceKey | 書誌・版・入力 | Drive論理パス / Git manifest | owner / stats47での用途 |
| --- | --- | --- | --- |
| `prefecture-deviation` / `prefecture-deviation` | 久保哲朗『47都道府県の偏差値』小学館、2018年2月、ISBN 978-4-09-825317-3。スキャンPDF 6件 | `参考文献/47都道府県の偏差値/2018年版` / `.claude/state/source-inventory/prefecture-deviation/2018/source-bundle-manifest.json` | `open-data-curator`。ランキング・survey・theme・記事の候補発見。書誌は国立国会図書館で確認済み。図表の権利と一次資料の照合までは`rights-hold` |
| `prefecture-databook-2021` / `prefecture-databook` | 『2021都道府県DataBook』2021年版。地域別PDF 8件、補助PNG 7件 | `参考文献/2021都道府県DataBook/2021年版` / `.claude/state/source-inventory/prefecture-databook/2021/source-bundle-manifest.json` | `area-curator`。県シンボル・特産品候補、area・ranking・theme・記事。数値は公的統計から再取得 |
| `claude-skills-guide-2026` / `claude-skills-guide` | 『Claudeスキル構築ガイド』2026年版、`guide.pdf` 1件 | `参考文献/Claudeスキル構築ガイド/2026年版` / `.claude/state/source-inventory/claude-skills-guide/2026/source-bundle-manifest.json` | `knowledge-curator`。stats47のagent・skill・内部文書改善だけに使い、統計ページや公開記事の根拠にはしない |

2026-08-29の全ページ処理・台帳生成結果は次のとおり。全資料で内部照合用cropを1件ずつ実見し、原本、OCR本文、
ページ画像、crop画像をGit・R2・公開assetへ保存していない。

| profile | PDF / ページ | resolution | coverage / 次の境界 |
| --- | ---: | --- | --- |
| `prefecture-deviation` | 6 / 103 | `rights-hold` 103 | 100%。書誌は確定済み。図表権利と一次資料が確定するまで公開禁止 |
| `prefecture-databook-2021` | 8 / 580 | `combined-analysis` 61 / `context-only` 19 / `not-applicable` 500 | 100%。80件は県公式等を根拠に既存area/editorial責務へ接続 |
| `claude-skills-guide-2026` | 1 / 33 | `context-only` 7 / `not-applicable` 26 | 100%。7件をagent・skill・内部文書の改善方針へ接続 |

ローカル復元先は全資料とも
`$TMPDIR/stats47-source-vault/work/<sourceKey>/<edition>/<sourceRootName>/`、派生物は
`$TMPDIR/stats47-source-vault/derived/<sourceKey>/<edition>/r<N>/`である。repo内へ原本・派生物を置かない。

## 2. inventory contract

`prepare`が生成する`processing-manifest.json`をそのrunの入力母数とする。PDFごとに安定ID、相対path、bytes、
SHA-256、ページ数、ページサイズ、暗号化状態、先頭ページのtext layer文字数を保持する。抽出ページごとに
`extractions/<pdf-id>.json`、クロップごとに`crop-manifest.json`へ入力PDF SHA、ページ、DPI、抽出engine、
box、出力SHAを記録する。これらは一時派生物でGit SSOTにしない。

公開候補へ進める項目は、既存のauthored SSOTへ次のresolutionを伴って登録する。

- `reuse-existing-metric`: 同一定義の既存metricへ接続する。
- `new-metric`: 一次資料から都道府県値を再取得でき、独立指標として採択する。
- `combined-analysis`: theme・area・記事の構成要素として既存指標と統合する。
- `context-only`: 一次資料で確認した背景だけを独自表現で使う。
- `primary-source-unavailable`: 一次資料を特定できず公開しない。
- `rights-hold`: 書誌・権利・利用条件が未解決で公開しない。
- `not-applicable`: stats47の統計・運用目的に適合しない。

資料単位の完了率は`resolution確定項目数 / 抽出候補数`とする。PDF全ページが処理母数に含まれ、除外項目にも
理由があることを100%完了条件とする。OCR本文、書籍内の数値列、クロップ画像そのものはauthored inventoryに保存しない。

## 3. 文字抽出・OCR・画像クロップ契約

共通CLIは`.claude/scripts/source-vault/source-processing.mjs`である。

```bash
# Driveからmanifest/partを一時取得後、hash検証して復元
npm run source-vault -- verify --profile <profile> --manifest <manifest> --parts-dir <download-dir>
npm run source-vault -- restore --profile <profile> --manifest <manifest> --parts-dir <download-dir>

# 全PDFを検査し、処理workspaceを生成
npm run source-vault:process -- prepare --profile <profile>

# 明示したページだけを画像化し、text layerが乏しければ日本語OCRへfallback
npm run source-vault:process -- extract --workspace <derived-dir> --document <pdf-id-or-path> --pages 1,3-5 --mode auto

# crop-spec.jsonに指定したpixel boxだけを内部照合用に切り出す
npm run source-vault:process -- crop --workspace <derived-dir> --spec <derived-dir>/crop-spec.json

# 全ページを候補母数にして解決台帳を生成・検証
npm run source-vault:inventory -- build --profile <profile>
npm run source-vault:inventory -- coverage --profile <profile> --check

# download / work / derivedをprofile単位で削除
npm run source-vault:process -- cleanup --profile <profile>
```

- `--pages all`は`--allow-all-pages`を同時指定しない限り拒否し、意図しない全冊処理を防ぐ。
- `auto`はPDF text layerを優先し、実文字40字未満のページだけ`jpn+eng`のTesseractへfallbackする。
- `ocr`は目視検証が必要なスキャンに明示使用し、OCR文字列だけで数値を確定しない。
- crop specは`internalUseOnly:true`、`publicOriginalReuse:"forbidden"`、ページ参照、利用目的、
  stats47での意図、`primarySourceRequired:true`が無ければ失敗する。
- 座標がページ画像外へ出るcrop、PDF SHA不一致、既存出力への暗黙上書き、repo内の入出力は拒否する。

## 4. 一次資料・権利・mapping

### 4.1 47都道府県の偏差値

OCRとクロップは、掲載テーマ、統計名、調査主体、調査年を探す内部作業に限定する。書誌は
[国立国会図書館サーチ](https://ndlsearch.ndl.go.jp/books/R100000002-I028765909)で確定済みだが、表・図・本文の
権利判断が終わるまでは全項目を`rights-hold`とする。数値はe-Stat、各省庁、
自治体等の一次資料で定義、年度、単位、47県粒度を再確認し、書籍値をR2へ入れない。

### 4.2 2021都道府県DataBook

県シンボル、特産品名、産地は候補発見に使えるが、県公式、市町村、JA、農林水産省等で裏取りする。
解説文、写真、地図、図案、表組みは複製しない。areaへの配置は`.claude/rules/area-databook-standards.md`と
`databook-editorial` skillを通し、統計値はe-Stat等から再取得する。

### 4.3 Claudeスキル構築ガイド

対象はagent prompt、skill構造、検証手順に関する内部レビューだけである。公開コンテンツの引用元、統計出典、
ランキング候補にはしない。採択する判断は既存の`.claude/rules/`またはskillへ要約して統合し、PDF本文、
スクリーンショット、ページ構成を複製しない。

全資料で、一次資料URL、取得日、利用条件URL、対象年度、単位、地域粒度、変換式、検証コマンドを
`.claude/rules/data-provenance-standards.md`の既存contractへ接続する。新しい公開taxonomyや保存層は作らない。

## 5. 実行順と停止・承認境界

1. `npm run source-vault:ready`で4profileのmanifest、active仕様、Poppler、Tesseract日本語、ImageMagickを確認する。
2. Drive folderをreadbackし、owner-only、manifest、全partの名前とsizeを確認する。
3. 一時downloadへ取得し、`verify`、`restore`、`prepare`の順でhashと全入力を確定する。
4. PDF・ページを明示して`extract`し、必要な範囲だけcropする。OCR・cropは必ず原ページと目視照合する。
5. inventoryへページ参照と候補だけを登録し、一次資料・rights・既存metric重複を解決する。
6. 一次資料から再取得した値・独自記述だけを既存SSOTへ反映し、各ownerのvalidatorを通す。
7. `cleanup`後に`npm run source-vault:check`を通す。

Driveの共有、part/manifest/SHA不一致、PDF破損、OCRと原本の不一致、一次資料不明、単位・年度・地域粒度不一致、
権利不明では停止する。remote R2、git push、PR、deploy、外部公開は対象と検証結果を示して別途承認を得る。

## 6. 検証と完了条件

```bash
npm run source-vault:ready
npm run source-vault:test
npm run source-vault:inventory:check
npm run source-vault:check
npm run docs:check
```

処理基盤の準備完了は、4profileすべてでmanifestとactive仕様が一致し、PDF入力が1件以上あり、日本語OCR、
ページ画像、rights-gated crop、profile単位cleanupを同じCLIで実行でき、repo内残存をCIが拒否する状態とする。
コンテンツ展開の完了は、資料別inventory coverage 100%、公開候補の一次資料・rights・provenance 100%、
書籍値の直接投入0、原文・元図・cropの公開0を満たすこととする。

生成stateの正典は`.claude/state/source-inventory/<sourceKey>/<edition>/{inventory,summary}.json`、資料別の
authored方針とガイド採択結果は`packages/data-configs/src/evidence-inventory/`である。生成stateはOCR本文、
書籍内の数値、画像pathを保持せず、全ページへ解決結果と再開条件だけを残す。
