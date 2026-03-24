---
name: generate-kakei-charts
description: a-kakei 記事（都道府県別家計調査）用の SVG チャートを chart-data.json から一括生成し、PNG 変換・note.md 挿入まで行う
argument-hint: <slug> or --all
---

a-kakei 記事用のチャート 2 枚を chart-data.json から生成する。

## 生成チャート

| ファイル | 内容 | データソース |
|---|---|---|
| `category-ratio.svg` | 大分類別 対全国平均比率（diverging bar） | `categoryBreakdown` |
| `extreme-items.svg` | 特徴的な品目 上位10・下位10（横棒） | `topRatioItems` / `bottomRatioItems` |

## 引数

- **slug**: 記事ディレクトリ名（例: `a-kakei-hokkaido`）
- `--all`: 全 `a-kakei-*` を一括処理

## 手順

### Phase 1: SVG 生成

```bash
cd /Users/minamidaisuke/stats47
node "${CLAUDE_SKILL_DIR}/scripts/generate-charts.js" <slug>
# または
node "${CLAUDE_SKILL_DIR}/scripts/generate-charts.js" --all
```

### Phase 2: SVG → PNG 変換

```bash
# 1記事分
node .claude/skills/note/generate-note-charts/scripts/svg-to-png.js docs/31_note記事原稿/<slug>/images

# 一括（全 a-kakei-*）
for d in docs/31_note記事原稿/a-kakei-*/images; do
  node .claude/skills/note/generate-note-charts/scripts/svg-to-png.js "$d"
done
```

### Phase 3: note.md に画像参照を挿入

「消費支出の全体像」セクションの末尾（次の `##` 見出しの直前）に以下を挿入する。

```markdown

<!-- 画像: category-ratio.png -->
![大分類別支出比率](images/category-ratio.png)

<!-- 画像: extreme-items.png -->
![特徴的な支出品目](images/extreme-items.png)

```

**挿入ルール:**
- 既に `category-ratio.png` への参照がある場合はスキップ（冪等）
- 挿入位置: `## {prefName}の消費支出の全体像` セクション内の最後の段落の後、次の `## ` の直前

### Phase 4: 確認

- SVG が 2 枚生成されていること
- PNG が 2 枚生成されていること（density 288）
- note.md に画像参照が挿入されていること

## 出力ディレクトリ

```
docs/31_note記事原稿/<slug>/
├── chart-data.json          ← 既存（入力）
├── note.md                  ← 画像参照を追記
└── images/
    ├── category-ratio.svg
    ├── category-ratio.png
    ├── extreme-items.svg
    └── extreme-items.png
```

## 注意

- `chart-data.json` が存在しない記事はスキップされる
- ランキング型 A 記事（`a-pharmacy-count-per-100k` 等）は対象外（chart-data.json の構造が異なる）
- デザインシステムは `.claude/skills/note/generate-note-charts/reference/design-system.md` に準拠
