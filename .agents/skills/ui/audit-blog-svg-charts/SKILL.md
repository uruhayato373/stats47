---
name: audit-blog-svg-charts
description: ブログ記事 SVG チャートの規約違反 (blog-svg-chart-standards) を検出し是正優先リストを出力する。Use when user says "SVGチャート監査", "ブログ図表チェック", "チャート規約違反".
primary_agent: chart-author
---

# /audit-blog-svg-charts

ブログ記事 SVG チャートの規約違反を検出し、是正優先リストを出力するスキル。
`.Codex/rules/blog-svg-chart-standards.md` を基準とする。

## 実行

```
/audit-blog-svg-charts [--slug <slug>] [--fix]
```

- 引数なし: 全記事を対象に違反検出 + レポート出力のみ（read-only）
- `--slug <slug>`: 対象を 1 記事に絞る（`.local/r2/app/blog/<slug>/data/` を対象）
- `--fix`: 自動是正が可能な違反（インライン色 → PALETTES 等）を実行

---

## 検出項目

### A. CLI インライン生成ロジック（重大度: high）

Layer 1 を使わず CLI / 一時スクリプト内で SVG を直接組んでいる箇所。

```bash
# generate-article-charts.ts 内に SVG テンプレートリテラルを直接書いているか
grep -n "function gen.*Svg\|<svg\|viewBox" .Codex/scripts/blog/generate-article-charts.ts
```

**除外（誤検知）**: 呼び出しコードの `generateBarChartSvg(...)` 等は対象外。

判定: `function gen*Svg` の関数定義、または `svg += \`<` のような直接組み立てが残存していれば是正対象。

### B. ハードコード色（PALETTES 外の hex）（重大度: high）

```bash
# PALETTES / SCATTER_COLORS 以外のアドホック hex を使っている箇所
grep -rn \
  --include="*.mjs" --include="*.ts" --include="*.cjs" \
  -E 'fill=["\'"'"']#[0-9a-fA-F]{3,6}["\'"'"']|stroke=["\'"'"']#[0-9a-fA-F]{3,6}["\'"'"']' \
  packages/svg-builder/src/ .Codex/scripts/blog/
```

**除外**: `svgThemeStyle()` 内のハードコード（規格色 `#ffffff`, `#0f172a` 等）は対象外。
`PALETTES.red[0]` = `#c62828` 等の既定値は対象外。

判定: 上記 grep から規格色（`#ffffff`, `#0f172a`, `#f9fafb`, `#1e293b`, `#d1d5db`, `#334155`,
`#1f2937`, `#e2e8f0`, `#374151`, `#cbd5e1`, `#6b7280`, `#94a3b8`, `#e5e7eb`,
`#c62828`, `#d32f2f`, `#e53935`, `#ef5350`, `#e57373`, `#ef9a9a`,
`#1565c0`, `#1976d2`, `#1e88e5`, `#2196f3`, `#42a5f5`, `#64b5f6`, `#90caf9`, `#bbdefb`, `#e3f2fd`, `#f0f8ff`,
`#e65100`, `#ef6c00`, `#f57c00`, `#fb8c00`, `#ffa726`, `#ffb74d`, `#ffcc80`, `#ffe0b2`, `#fff3e0`, `#fff8f0`,
`#7b1fa2`, `#8e24aa`, `#9c27b0`, `#ab47bc`, `#ba68c8`, `#ce93d8`, `#e1bee7`, `#f3e5f5`, `#f8eafc`, `#fdf7ff`,
`#2e7d32`, `#388e3c`, `#43a047`, `#66bb6a`, `#81c784`, `#a5d6a7`, `#c8e6c9`, `#e8f5e9`, `#f1f8f2`, `#f7fcf8`,
`#64748b`, `#475569`,
`#dc2626`, `#ef4444`, `#fef2f2`, `#eff6ff`）を除いた残りが是正対象。

> **CARD_THEMES（カード型ランキングの専用色）**: `bar-chart.ts` の `CARD_THEMES`
> は header/bar/cardAlt の専用色セット（red=`#dc2626`/`#ef4444`/`#fef2f2`、blue=`#1565c0`/`#42a5f5`/`#eff6ff`、
> purple/orange/green は PALETTES と同系）。これらは上記許可リストに含むため対象外。SSoT は `bar-chart.ts`。
>
> **カード型ランキングは2レイアウト（2026-06-20）**: `layout:"columns"`（横長 960×404・ブログ本文 `<name>.svg`）と
> `layout:"portrait"`（縦長 1080×1350・Instagram 用 `<name>-ig.svg`）の2種を `generate-article-charts.ts` が両出力する。
> `-ig.svg` は記事 markdown に埋め込まない SNS 専用アセットなので、article.md 参照を辿る監査では「未参照」として扱わない
> （orphan 判定しない）。カタログ正典は `.Codex/rules/blog-svg-chart-standards.md`。

### C. CSS 変数使用（重大度: high）

静的 SVG は `<img>` サンドボックス内で CSS 変数が解決されない。

```bash
grep -rn --include="*.ts" --include="*.mjs" \
  -E 'hsl\(var\(--' \
  packages/svg-builder/src/ .Codex/scripts/blog/
```

### D. svgThemeStyle() 未挿入（重大度: medium）

```bash
# packages/svg-builder の chart 実装ファイルで svgThemeStyle を呼んでいないもの
for f in packages/svg-builder/src/charts/*.ts packages/svg-builder/src/tables/*.ts; do
  [ "$f" = "packages/svg-builder/src/charts/index.ts" ] && continue
  grep -q "svgThemeStyle" "$f" || echo "svgThemeStyle 未使用: $f"
done
```

### E. プロベナンスコメント欠如（重大度: low）

生成済み SVG ファイル（`.local/r2/app/blog/*/data/*.svg`）にプロベナンスコメントがない。

```bash
for svg in .local/r2/app/blog/*/data/*.svg; do
  grep -q "data-source:" "$svg" || echo "provenance なし: $svg"
done
```

### F. データ命名パターン不一致（重大度: low）

`data/*.json` のサフィックスが §4 の命名規則と一致しない。

```bash
# 命名規則外のデータ JSON を探す
find .local/r2/app/blog -name "*.json" -path "*/data/*" | \
  grep -Ev '\-(prefecture-rankings|tile-grid|timeseries|scatter|stacked)\.json$' | \
  grep -v 'meta\.json\|series\.json\|cache\.json'
```

---

## 出力フォーマット

```
## ブログ SVG チャート監査レポート

### サマリ
- A. CLI インライン生成: N 件
- B. ハードコード色: N 件
- C. CSS 変数使用: N 件
- D. svgThemeStyle 未挿入: N 件
- E. プロベナンスなし: N 件 (N 記事)
- F. 命名パターン不一致: N 件

### 優先是正リスト（影響大順）

| 優先度 | ファイル | 違反種別 | 是正方法 |
|---|---|---|---|
| 1 | scripts/blog/... | A: インライン生成 | packages/svg-builder の関数に移行 |
| 2 | ... | ... | ... |

### 推奨アクション
1. ...
```

---

## --fix オプション（自動是正）

以下のみ自動是正する（その他は手動または `chart-author` agent に依頼）:

- CSS 変数 `hsl(var(--primary))` → `#1565c0`（blue パレット）
- CSS 変数 `hsl(var(--muted-foreground))` → `#6b7280`
- プロベナンスコメント付与（`<!-- data-source: {filename} | generated: {ISO} -->`）

---

## 既存ツール連携

| ツール | 用途 |
|---|---|
| `.Codex/scripts/lib/svg-lint.mjs` | viewBox/width/height/ダークモードの低レベル lint + **`lintSvgSize`（カタログ別正規サイズ／アスペクト比統一・2026-06-21）** |
| `.Codex/scripts/blog/audit-chart-quality.mjs` | 全記事バッチ監査（内容 lint + **サイズ lint**）。本スキルよりも広範・パブリック R2 対応 |

> **★アスペクト比統一 gate（2026-06-21）**: `lintSvgSize(filename, content)` が filename→chartType→正規 viewBox 幅
> （bar 960/680・scatter 720・tile-grid 720・line/stacked 680・summary 960）を blocker で検査。`audit-chart-quality.mjs`
> と `quality-gate.mjs`（pre-commit + publish-blog.yml）に配線済。正典 `blog-svg-chart-standards.md` §6。是正は
> `rerender-ranking-columns.mts`（960×404）/ `rerender-scatter-canonical.mts`（720×720・単色）。
> **R2 反映は S3 API（diff-push-r2）で。`push-r2-wrangler` は flaky（Upload 完了表示でも未永続化）→ S3 GET で検証。**
| `.Codex/scripts/blog/build-svg-gallery.mjs` | 全 SVG の目視レビュー用 HTML ギャラリー生成（下記） |

`/audit-blog-svg-charts` は **ソースコード（packages/svg-builder・scripts）の規約準拠** を見る。
`audit-chart-quality.mjs` は **生成済み SVG ファイルの品質** を見る。両者は補完関係。

---

## 目視レビュー成果物（ギャラリー HTML）

機械検出（A〜F）に加え、**全 SVG を視覚的にレビューできる自己完結 HTML** を生成する。
配色・レイアウト・可読性など grep で拾えない品質は人間の目視が必要なため、監査の締めに必ず生成する。

```bash
# R2 公開 URL から全記事の SVG を取得してギャラリー生成（どこでも実行可）
node .Codex/scripts/blog/build-svg-gallery.mjs --source r2 --out /tmp/blog-svg-gallery.html

# ローカルに pull 済みなら local 走査（高速・オフライン）
node .Codex/scripts/blog/build-svg-gallery.mjs --source local

# 動作確認用に件数を絞る
node .Codex/scripts/blog/build-svg-gallery.mjs --source r2 --limit 20
```

生成後は `SendUserFile` で HTML をユーザーに送付する。ギャラリーの機能:

- 記事ごとにグループ化（タイトル + slug + 枚数）
- 検索フィルタ（slug・ファイル名）
- **「⚠ 要確認のみ」トグル**: viewBox 欠如（D-check 相当）・ダークモード未対応（svgThemeStyle なし）を抽出
- ライト/ダーク切替・viewBox 寸法・生成日（provenance）表示

> A〜F の機械検出は **ソースコードの規約準拠**、ギャラリーは **生成物の見た目** を確認する。
> 監査レポートの末尾に「ギャラリー生成済み（N 記事 / M 枚 / ⚠ K）」を必ず記載する。

---

## 関連

- 基準: `.Codex/rules/blog-svg-chart-standards.md`
- 実行エージェント: `chart-author`
- ライブラリ: `packages/svg-builder/src/`
- ギャラリー生成: `.Codex/scripts/blog/build-svg-gallery.mjs`
