---
name: project-kakei-expansion-pipeline-gotchas
description: 家計調査拡充(2026-07-10)で踏んだ公開パイプラインの罠3つ — kakei areaコード写像・master export のdev環境list縮小・saveToR2はローカルstagingのみ
metadata: 
  node_type: memory
  type: project
  originSessionId: 4f53cd07-d155-499e-8541-c0d10a679ffe
---

家計調査コンテンツ拡充 第1弾 (2026-07-10、PR #555) で確定した非自明な罠。第2弾 [KAKEI-EXPANSION-02] でも踏み得る。

1. **家計調査表の @area は県コードでない**: e-Stat `0003348235`/`0003348239` の @area は県庁所在市コード（原則 `NN003`、**福岡市のみ `40004`。`40003` は北九州市**）。`page-data-batch.ts` の `remapKakeiAreas` が NN000 へ写像する（川崎/相模原/浜松/堺/北九州/全国は捨てる）。
2. **master export (export-master-snapshots.ts) は dev 環境だと `.local/r2` の listing に縮む**: `listFromR2` が `detectEnvironment().isDevelopment` でローカルFS優先のため、staging に20件しか無いと **`app/survey/all.json` が「1調査」に縮んで生成される**（push すると /survey が壊れる）。全件モードは `NODE_ENV=production` で実行する（S3 list に切替わる）。push 前に staging の all.json count を必ず検証。
3. **`saveToR2` はローカル staging (`.local/r2`) 書き込みのみ**: generate-ranking-items 等が「push」とログを出しても remote には行っていない。remote 反映は常に `diff-push-r2.ts` (S3)。KNOWN キー再生成 (`generate-known-ranking-keys.ts`) は R2 公開URLの item.json HEAD 200 を要求するので、**diff-push 後に**実行する。

関連: [[feedback-check-why-removed-before-reviving]]、論点カタログ `.claude/skills/blog/draft-from-trend/reference/kakei-topic-catalog.md`、new ranking values は `app/ranking/<key>/values.json` (partitions形式) を app/stats から変換して置かないと初回描画が空になる（load-ranking-page-model は fallback なし）。
