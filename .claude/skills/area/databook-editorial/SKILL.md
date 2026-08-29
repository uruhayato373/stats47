---
name: databook-editorial
description: area ページ「県データブック」の県別編集コンテンツ (特産品・県シンボル) を、書籍分冊 1 冊を単位に PDF 事実抽出 → web リサーチ → editorial TS 化 → validator まで定型ループで整備する。area-curator が実行。特産品・県シンボルの新規整備や是正に使う。
primary_agent: area-curator
allowed-tools: Read, Grep, Glob, Bash, Edit, Write, WebSearch, WebFetch
---

# databook-editorial

`/areas/[code]` の県別編集コンテンツ (特産品・県シンボル) を**分冊 1 冊単位で整備する**スキル。
テンプレ設計 (area-databook-designer) やチャート実装は行わない。

> 正典規約: `.claude/rules/area-databook-standards.md` §5 (editorial 品質) / 実行 agent: `.claude/agents/area-curator.md`
> 実証: `.claude/rules/evidence-based-judgment.md` (出典 URL + アクセス日必須・裏取りなしで書かない)

## 引数

分冊エリア名 (例: `四国` / `関東` / `九州・沖縄`)。private Google Drive source bundleを一時復元した
`$TMPDIR/stats47-source-vault/work/prefecture-databook/2021/2021都道府県DataBook/2021都道府県DataBook 分冊版 <エリア>エリア.pdf`
を対象にする。
省略時は未登録県 (validator の `editorial-coverage` warn) が残る分冊を確認して 1 冊選ぶ。

## 前提の確認 (実行前に必ず)

`.claude/rules/reference-source-standards.md`の共通手順で、Drive論理パス
`参考文献/2021都道府県DataBook/2021年版`からmanifestと2partをOS一時領域へ取得する。repo内へPDFを置かない。

```bash
SOURCE_MANIFEST=".claude/state/source-inventory/prefecture-databook/2021/source-bundle-manifest.json"
SOURCE_DOWNLOAD_DIR="${TMPDIR%/}/stats47-source-vault/download/prefecture-databook/2021/r1"
SOURCE_WORK_DIR="${TMPDIR%/}/stats47-source-vault/work/prefecture-databook/2021/2021都道府県DataBook"
npm run source-vault -- verify --manifest "$SOURCE_MANIFEST" --parts-dir "$SOURCE_DOWNLOAD_DIR"
npm run source-vault -- restore --manifest "$SOURCE_MANIFEST" --parts-dir "$SOURCE_DOWNLOAD_DIR"
# 対象分冊のページ数 (実コンテンツは 1 県 6 ページ × 県数 + 前付/巻末)
pdfinfo "$SOURCE_WORK_DIR/2021都道府県DataBook 分冊版 <エリア>エリア.pdf" | rg '^Pages:'
# 既存 editorial 登録状況
npx tsx packages/data-configs/scripts/validate-area-databook.ts | rg coverage
```

## Stage 1: PDF 事実抽出 (県ごと)

一時復元した分冊 PDF を Read (pages 指定・県マップの見開き 2 ページを含む範囲) し、**県ごとに事実のみ**を取り出す:
- 県シンボル 5 種: 木 / 花 / 鳥 / 魚 / 歌 (県マップ右上の「県の」ボックス)
- 特産品: 品名 + 産地市町村 (特産品マップの写真ラベル。**解説文・図案は抽出しない**)

抽出結果は scratchpad に県別ドラフト (品名・産地のみ) として一旦置く。

> ⚠️ 書籍の解説文・写真・レイアウトは著作物。**品名と産地 (事実) だけ**を使う。解説は Stage 2 で独自に書く。

## Stage 2: web リサーチ (品目ごと)

各品目・各シンボルを WebSearch/WebFetch で一次情報 (県公式 / 市町村 / JA / 農水省) にあたり、
**60-160 字の独自解説** + `sourceUrl` + `accessedAt` (実行日 ISO) を執筆する。

- 裏取りできない品目は**載せない** (5-9 件に収まればよい。無理に埋めない)。
- 産地・特徴・由来のうち一次情報で確認できた事実のみ書く。書籍の言い回しをなぞらない。
- シンボルは県公式ページ (`pref.<県>.lg.jp` 等) で裏取りし sourceUrl を付ける。

## Stage 3: editorial TS 化

`packages/data-configs/src/area-databook/editorial/<code>.ts` を Write し、`editorial/index.ts` の
`AREA_EDITORIALS` に import + 登録する。slug は kebab-case・県内一意 (R2 イラスト asset キーになる)。

```ts
import type { AreaEditorial } from "../types";
export const <PREF>_EDITORIAL: AreaEditorial = { areaCode: "<code>", symbols: {...}, specialties: [ ... ] };
```

## Stage 4: validator (必須ゲート)

```bash
npx tsx packages/data-configs/scripts/validate-area-databook.ts
npx tsc --noEmit -p packages/data-configs/tsconfig.json
```

error 0 になるまで是正 (件数 5-9 / description 60-160 字 / sourceUrl http(s) / accessedAt ISO / slug kebab・一意 / municipality 非空)。

## Stage 5: イラスト依頼 (品目確定後・Phase 3 で配線)

品目 slug が確定したら Gemini 生成リクエスト (task `area-specialty`) に積む。欠損時は UI が
テキストカードに degrade するため、editorial の commit をイラスト完成まで待つ必要はない。

## 分冊 → 県コードの対応 (参考)

- 北海道・東北: 01-07 / 関東: 08-14 / 北陸・甲信越: 15,16,18-20 / 中部: 17,21-23 /
  近畿: 24-30 / 中国: 31-35 / 四国: 36-39 / 九州・沖縄: 40-47
  (正確な収録県は各分冊の CONTENTS で確認する)

## 完了報告 (area-curator の OUTPUT FORMAT に従う)

editorial 進捗テーブル (areaCode / 特産品件数 / シンボル裏取り / validator) + 変更ファイル + 残課題。
報告前に一時取得した`download/`と`work/`を削除し、`npm run source-vault:check`を通す。
