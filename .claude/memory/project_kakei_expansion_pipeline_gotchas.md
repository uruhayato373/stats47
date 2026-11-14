---
name: project-kakei-expansion-pipeline-gotchas
description: 家計調査拡充(2026-07-10)で踏んだ公開パイプラインの罠3つ — kakei areaコード写像・master export のdev環境list縮小・writeR2Staging(旧saveToR2)はローカルstagingのみ
metadata: 
  node_type: memory
  type: project
  originSessionId: 4f53cd07-d155-499e-8541-c0d10a679ffe
---

家計調査コンテンツ拡充 第1弾 (2026-07-10、PR #555) で確定した非自明な罠。第2弾 [KAKEI-EXPANSION-02] でも踏み得る。

1. **家計調査表の @area は県コードでない**: e-Stat `0003348235`/`0003348239` の @area は県庁所在市コード（原則 `NN003`、**福岡市のみ `40004`。`40003` は北九州市**）。`page-data-batch.ts` の `remapKakeiAreas` が NN000 へ写像する（川崎/相模原/浜松/堺/北九州/全国は捨てる）。
2. **master export (export-master-snapshots.ts) は dev 環境だと `.local/r2` の listing に縮む**: `listFromR2` が `detectEnvironment().isDevelopment` でローカルFS優先のため、staging に20件しか無いと **`app/survey/all.json` が「1調査」に縮んで生成される**（push すると /survey が壊れる）。全件モードは `NODE_ENV=production` で実行する（S3 list に切替わる）。push 前に staging の all.json count を必ず検証。
3. **`writeR2Staging` (2026-10-10 に `saveToR2` から改名) はローカル staging (`.local/r2`) 書き込みのみ**: generate-ranking-items 等が「push」とログを出しても remote には行っていない。remote 反映は常に `diff-push-r2.ts` (S3)。KNOWN キー再生成 (`generate-known-ranking-keys.ts`) は R2 公開URLの item.json HEAD 200 を要求するので、**diff-push 後に**実行する。

関連: [[feedback-check-why-removed-before-reviving]]、切り口台帳 `data/surveys/lenses/kakei-chousa.json` (2026-11-02 に旧論点カタログ kakei-topic-catalog.md を廃止して統合)、new ranking values は `app/ranking/<key>/values.json` (partitions形式) を app/stats から変換して置かないと初回描画が空になる（load-ranking-page-model は fallback なし）。

## 県庁所在市の長い系列を比べるとき (2026-11-14、K-S1-14 で確定)

- **値の年**: R2 `app/stats/<指標>/values.json` の家計調査の食料の指標は、396 件中 385 件が 2007〜2025 年 (19 年)。指標の設定の `years.from` は 2000 と書いてあっても値は 2007 からなので、年数は設定でなく値から数える (「25 年」と書いて誤った)。
- **標本**: 県庁所在市と大都市の 52 市で二人以上の世帯 5,472 世帯 (1 市約 105)。2002 年から食料の数量は各世帯の最初の 1 か月だけ記入 (統計局「家計調査の概要」https://www.stat.go.jp/data/kakei/1.html 、2026-11-14 確認)。単年の順位は食料費の合計でも 20 位以上動くので、3 年平均どうしで比べる。
- **品目分類の改定**: 2010・2015・2020・2025 年の 1 月 (https://www.stat.go.jp/data/kakei/9.html)。食料で中身が変わったのは 2015 年の洋食 (焼肉を分割)・他のきのこ・他の飲料のその他・他の酒・他の塩干魚介、2020 年の他の柑きつ類。2025 年は名称変更だけ。2010 年は改定内容が画像で読めない。2020 年の外食と 2025 年の米の跳ねは改定ではなく実際の変化。
- **比べ方**: 金額のままだと市の食料費の水準が品目の順位をまとめて動かす (那覇市は 111 品目が下位、金沢市は食料費の順位ごと下がる)。品目の支出を食料費に占める割合に直して比べる。
- **雑音の検査**: 両端の 3 年平均だけで「動いた」とすると、隣り合う期間どうしでも 6.5% の組が通る。19 年の順位と年の相関 (|ρ|≥0.6) を足すと 5.1% が通り、年の順を入れ替えた系列では 0.41% しか通らない。計算の実装は `packages/product-factory/.local/kindle-private/K-S1-14/build_facts.mjs` (控えは Drive `stats47/Kindle原稿/K-S1-14-v1-20261114-r1/`)。
