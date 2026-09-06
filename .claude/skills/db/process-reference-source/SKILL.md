---
name: process-reference-source
description: 参考文献 PDF を S0 保全 → S1 ページ画像 → S2 文字起こし (生 OCR + Markdown) → S3 図クロップ → S4 台帳 の段階で処理し、各段階を不変 revision として private Drive bundle へ積む。ユーザーが「PDF をページ画像にして」「文字起こしを Markdown にして」「図をクロップして」「参考文献をどこまで処理したか確認して」等と言ったときに使う。
primary_agent: open-data-curator
---

# process-reference-source — 参考文献の段階処理

正典: `.claude/rules/reference-source-standards.md` §3「処理段階 (stage) と bundle 構成の契約」。
決定的な処理 (render / OCR / crop / parity / frontmatter 検査 / bundle 化) は CLI が行い、
意味の作業 (Markdown 文字起こし・図の意味付け・crop spec・mapping) だけを agent が行う。

## いつ使うか
- 新しい参考文献 PDF を受け取り、ページ画像・文字起こし・図を bundle に残したい
- 既存 bundle がどの段階まで到達しているか知りたい (`stage-status`)
- 既に S1 まである資料に Markdown 文字起こし (S2) や図クロップ (S3) を足したい

## 前提
- profile が `.claude/config/source-vault.json` にあり、`processing.pageImage` (dpi / format / quality / `contentCrop`) を
  宣言している。Kindle 画面スキャンのように UI 枠があるものは `contentCrop` (`WxH+X+Y`、render 後 pixel) を必ず置く。
- 作業は `$TMPDIR/stats47-source-vault/` だけで行い、repo 内に PDF・画像・OCR を置かない。
- Drive の folder/file ID を Git へ書かない。

## 手順

### 0. 現在地を確認する
```bash
npm run source-vault:process -- stage-status --profile <profile>
```
`stages.s0Preserved … s4Inventory` が manifest の `componentCounts` から出る。ここで止まっている段階から始める。

### S0 保全 (初回だけ)
`.claude/config/source-vault.json` に profile を追加し、source root に PDF を置いて
`npm run source-vault -- create --profile <profile>` → manifest を `.claude/state/source-inventory/<sourceKey>/<edition>/` へ →
Drive `stats47/参考文献/<資料名>/<版>/` へ manifest と part を配置 → `check-local` で readback。

### S1 ページ画像 + 生 OCR (CLI)
```bash
npm run source-vault -- restore --profile <profile> --manifest <git-manifest> --parts-dir <download-or-mount-dir>
npm run source-vault:process -- prepare --profile <profile>
npm run source-vault:process -- extract --workspace <derived-dir> --document <pdf-id> --pages all --allow-all-pages --mode ocr
```
- `extract` は profile の `pageImage` を適用し、`pages/<doc-id>/pNNNN.<png|jpg>` (contentCrop 済み) と
  `transcripts/<doc-id>/pNNNN.txt`、`page-dims.json` (render dpi・フルページ pixel・contentCrop・出力 pixel) を書く。
- 縦書きは profile の `ocrLanguages: ["jpn_vert"]` + `ocrPageSegmentationMode: 5`。図表ページの txt は崩れて正常。

### S2 Markdown 文字起こし (agent)
`<derived-dir>/md/pNNNN.md` を 1 ページ 1 ファイルで書く。入力は `pages/` の画像 (Read で見る) と `transcripts/` の txt。

```markdown
---
page: 12
kind: text        # text | figure | table | mixed | blank
figures: []       # S3 の crop id。figure / table では必須
---
(縦書き・段組を読み順に直した本文。見出しは ## / ###、脚注は末尾)
```
- `figure` / `table` ページは本文の代わりに「図表が何を示すか」の要点を書き、数値列や元図をそのまま転記しない。
- 章跨ぎ・ページ跨ぎの文は切れたまま残し、前後ページで繋がない (ページ単位の対応を保つ)。
- 書き終えたら検査する。
```bash
npm run source-vault:process -- md-check --workspace <derived-dir> --check
```
全ページの有無・frontmatter・`figures[]` の実在を検査し、欠けがあれば exit 1 で一覧を出す。

### S3 図クロップ (agent が spec、CLI が切り出し)
`<derived-dir>/crop-spec.template.json` を複製し、S1 の `pages/` 画像上の pixel 座標 (contentCrop 後) で crop を宣言する。
`internalUseOnly:true` / `purpose` / `sourceRef` / `intendedStats47Use` / `primarySourceRequired:true` は必須。
```bash
npm run source-vault:process -- crop --workspace <derived-dir> --spec <derived-dir>/crop-spec.json
```
`crops/<id>.png` と `crop-manifest.json` ができる。S2 の md の `figures[]` に crop id を書き、`md-check --check` を再実行する。

### bundle へ積む (revision を上げる)
1. `.claude/config/source-vault.json` の `profiles.<profile>.revision` を N+1 にする。
2. derived の成果物を規約名で source root へ配置し、bundle 化する。
```bash
npm run source-vault:process -- stage --workspace <derived-dir> --revision <N+1>
npm run source-vault -- create --profile <profile>
```
`stage` は `pages/` `transcripts/` `md/` `figures/` `page-dims.json` `crop-manifest.json` を配置するだけで、既存 revision には触らない。
3. 新 manifest を `.claude/state/source-inventory/<sourceKey>/<edition>/source-bundle-manifest.json` に置き換え、
   Drive の版フォルダへ manifest と part を追加 (旧 revision は残す)。`check-local` で readback。
4. `stage-status` で到達段階が進んだことを確認する。

### S4 台帳
```bash
npm run source-vault:inventory -- build --profile <profile>
npm run source-vault:inventory -- coverage --profile <profile> --check
```

### 後片付け
```bash
npm run source-vault:process -- cleanup --profile <profile>
npm run source-vault:check
```

## 禁止
- `md/` の本文・`figures/` の画像・`transcripts/` を Git、公開 R2、記事、SNS、inventory.json へ流す
- 既存 revision の part を差し替える / revision を上げずに bundle を作り直す
- OCR 文字列だけで書籍値を確定する (数値は一次資料で再取得する)
- `contentCrop` を記録せずにページ画像を切る (crop 座標の基準が追えなくなる)

## 分担
| 工程 | 担当 |
|---|---|
| profile / bundle / Drive 配置 / stage-status / 台帳 | `open-data-curator` |
| Markdown 文字起こし・図の意味付け・crop spec | `open-data-curator` (資料ごとの利用実装仕様書で別 owner を指定できる) |
| render / OCR / crop / parity / bundle 化 | CLI (`source-processing.mjs` / `source-vault.mjs`) |
| 台帳から metric / theme / content への展開 | 利用実装仕様書の owner (`data-ingester` / `theme-designer` / `article-writer` 等) |

## 関連
- 規約: `.claude/rules/reference-source-standards.md`
- CLI: `.claude/scripts/source-vault/{source-vault,source-processing,source-inventory}.mjs`
- テスト: `npm run source-vault:test`
- 実装契約: `docs/02_実装計画/46_その他参考文献OCR・クロップ・stats47展開実装仕様.md` §3
