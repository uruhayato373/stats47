---
name: process-reference-source
description: 参考文献 PDF を S0 保全 → S1 ページ画像 → S2 文字起こし (生 OCR + Markdown) → S3 図クロップ → S4 台帳 の段階で処理し、各段階の成果物を private Drive の版 folder (展開配置) へ足す。ユーザーが「PDF をページ画像にして」「文字起こしを Markdown にして」「図をクロップして」「参考文献をどこまで処理したか確認して」等と言ったときに使う。
primary_agent: open-data-curator
---

# process-reference-source — 参考文献の段階処理

正典: `.claude/rules/reference-source-standards.md` §3「処理段階 (stage) と版 folder 構成の契約」。
決定的な処理 (render / OCR / crop / parity / frontmatter 検査 / manifest 生成 / Drive 複製) は CLI が行い、
意味の作業 (Markdown 文字起こし・図の意味付け・crop spec・mapping) だけを agent が行う。

## いつ使うか
- 新しい参考文献 PDF を受け取り、ページ画像・文字起こし・図を Drive の版 folder に残したい
- 既存資料がどの段階まで到達しているか知りたい (`stage-status`)
- 既に S1 まである資料に Markdown 文字起こし (S2) や図クロップ (S3) を足したい

## 前提
- profile が `.claude/config/source-vault.json` にあり、`processing.pageImage` (dpi / format / quality / `contentCrop`) を
  宣言している。Kindle 画面スキャンのように UI 枠があるものは `contentCrop` (`WxH+X+Y`、render 後 pixel) を必ず置く。
- 作業は `$TMPDIR/stats47-source-vault/` だけで行い、repo 内に PDF・画像・OCR を置かない。
- Drive はローカルマウント経由 (`npm run source-vault -- vault-root` で解決先を確認。無ければ `STATS47_SOURCE_VAULT_ROOT`)。folder/file ID を Git へ書かない。

## 手順

### 0. 現在地を確認する
```bash
npm run source-vault:process -- stage-status --profile <profile>
```
`stages.s0Preserved … s4Inventory` が manifest の `componentCounts` から出る。ここで止まっている段階から始める。

### S0 保全 (初回だけ)
`.claude/config/source-vault.json` に profile を追加し、source root (`$TMPDIR/stats47-source-vault/work/<sourceKey>/<edition>/<sourceRootName>/`) に PDF を置いて
```bash
npm run source-vault -- create --profile <profile> --manifest .claude/state/source-inventory/<sourceKey>/<edition>/source-bundle-manifest.json
npm run source-vault -- upload --profile <profile> --manifest <git-manifest>
```
`upload` が Drive `stats47/参考文献/<資料名>/<版>/` へ複製し、readback で sha256 を照合する。

### S1 ページ画像 + 生 OCR (CLI)
```bash
npm run source-vault -- restore --profile <profile> --manifest <git-manifest>
npm run source-vault:process -- prepare --profile <profile>
npm run source-vault:process -- extract --workspace <derived-dir> --document <pdf-id> --pages all --allow-all-pages --mode ocr
```
- `extract` は profile の `pageImage` を適用し、`pages/<doc-id>/pNNNN.<png|jpg>` (contentCrop 済み) と
  `transcripts/<doc-id>/pNNNN.txt`、`page-dims.json` (render dpi・フルページ pixel・contentCrop・出力 pixel) を書く。
  `--mode image` はページ画像だけを書き (transcripts/ を作らない)、S1 だけ先に進めるときに使う。
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

### Drive の版 folder へ足す (revision を上げる)
1. `.claude/config/source-vault.json` の `profiles.<profile>.revision` を N+1 にする。
2. derived の成果物を規約名で source root へ配置し、manifest を作り直して Drive へ差分複製する。
```bash
npm run source-vault:process -- stage --workspace <derived-dir> --revision <N+1>
npm run source-vault -- create --profile <profile> --manifest <git-manifest> --force
npm run source-vault -- upload --profile <profile> --manifest <git-manifest>
```
`stage` は `pages/` `transcripts/` `md/` `figures/` `page-dims.json` `crop-manifest.json` を配置するだけ。`upload` は sha256 が
一致する file を触らず、差分だけ複製して readback する。
3. `stage-status` で到達段階が進んだことを確認し、manifest を commit する。

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
- revision を上げずに manifest を作り直して upload する (Git の manifest 差分が履歴なので世代を飛ばさない)
- OCR 文字列だけで書籍値を確定する (数値は一次資料で再取得する)
- `contentCrop` を記録せずにページ画像を切る (crop 座標の基準が追えなくなる)

## 分担
| 工程 | 担当 |
|---|---|
| profile / manifest / Drive 配置 / stage-status / 台帳 | `open-data-curator` |
| Markdown 文字起こし・図の意味付け・crop spec | `open-data-curator` (資料ごとの利用実装仕様書で別 owner を指定できる) |
| render / OCR / crop / parity / manifest / Drive 複製 | CLI (`source-processing.mjs` / `source-vault.mjs`) |
| 台帳から metric / theme / content への展開 | 利用実装仕様書の owner (`data-ingester` / `theme-designer` / `article-writer` 等) |

## 関連
- 規約: `.claude/rules/reference-source-standards.md`
- CLI: `.claude/scripts/source-vault/{source-vault,source-processing,source-inventory}.mjs`
- テスト: `npm run source-vault:test`
- 実装契約: `docs/02_実装計画/46_その他参考文献OCR・クロップ・stats47展開実装仕様.md` §3
