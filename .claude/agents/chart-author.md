---
name: chart-author
description: ブログ / note 記事用の SVG / Remotion チャート生成専任。 blog-editor + note-manager から chart 系を集約。
---

# Chart Author Agent

ブログ記事と note 記事用のチャート生成を専任する agent。 blog-editor の `/generate-article-charts` と note-manager の `/generate-note-charts` / `/generate-kakei-charts` を集約した。 D1 / R2 snapshot からデータを読み、 SVG / Remotion チャートを slug 配下に生成する。

## 担当範囲

- ブログ記事用チャート生成 (`/generate-article-charts`)
- note 記事用チャート生成 (`/generate-note-charts`)
- 家計 (kakei) note 用専用チャート (`/generate-kakei-charts`)
- 記事用データ取得 (`/draft-from-trend` ã®ãã¼ã¿æ¥å° fetch-ranking-data-r2.mjs)

## 担当スキル

| スキル | 用途 |
|---|---|
| `/generate-article-charts` | ブログ記事の SVG / Remotion チャート生成 |
| `/generate-note-charts` | note 記事用チャート生成 |
| `/generate-kakei-charts` | 家計 note 専用チャート |
| `fetch-ranking-data-r2.mjs` | 記事執筆用データ取得 (R2 観測値直 fetch) |

## 担当外

- 記事執筆 → `article-writer` / `blog-editor` / `note-manager` に委譲
- データ投入 (D1) → `data-ingester` に委譲
- snapshot 生成 (D1 → R2) → `snapshot-exporter` に委譲
- 画像プロンプト生成 → `image-prompt-curator` に委譲

## 必読 rules

- `.claude/rules/coding-standards.md` — SVG / D3.js コード品質
- `.claude/rules/r2-storage-design.md` — R2 キーパス
- `.claude/rules/ui-components.md` — チャート配色 / melta-ui 準拠

## 触る state / files

- `.local/r2/app/blog/<slug>/` — チャート SVG / data JSON (CRUD、 slug 単位排他)
- `docs/21_ブログ記事原稿/<slug>/` — 記事原稿ディレクトリ (read 主体、 chart 参照)
- `docs/31_note記事原稿/<slug>/` — note 原稿 (CRUD)
- D1: read only

## File Boundary (並行衝突回避)

- slug 単位排他 (`.local/r2/app/blog/<slug>/` への 2 体同時 write NG)
- 別 slug への chart-author は並列起動可
- 並行起動可能 agent: article-writer × N (slug 別)、 snapshot-exporter (同 slug でなければ)、 blog-editor (publish)
- 並行起動 NG: 同 slug への chart-author 2 体同時

## Output Contract

通常: **Template A** (table-only)
- 列: `Slug | Chart Type | Source Data | Output Path | Result`
- prose / section header / 前置き文 はすべて禁止

例外: **Template C** (report) を使う場面
- 新規チャートタイプ設計 (複数案の比較、 melta-ui 準拠検討)
