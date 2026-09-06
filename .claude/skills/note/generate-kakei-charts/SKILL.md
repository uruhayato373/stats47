---
name: generate-kakei-charts
description: a-kakei 記事（都道府県別家計調査）用 SVG チャートを chart-data.json から一括生成し PNG 変換・draft.md 挿入まで行う。Use when user says "家計チャート", "kakei チャート". 大分類比率 + 特徴品目の横棒グラフ.
disable-model-invocation: true
argument-hint: <slug> or --all
primary_agent: chart-author
co_agents: [note-manager]
---

a-kakei 記事用のチャート 2 枚を chart-data.json から生成する。

## 生成チャート

| ファイル | 内容 | データソース |
|---|---|---|
| `category-ratio.svg` | 大分類別 対全国平均比率（diverging bar） | `categoryBreakdown` |
| `extreme-items.svg` | 特徴的な品目 上位10・下位10（横棒） | `topRatioItems` / `bottomRatioItems` |

## Phase 0: chart-data.json を作る (★2026-09-06 追加)

本スキルは chart-data.json を**読む側**だけを持っており、作る側が無かったため
a-kakei-* の記事は 1 本も存在しなかった。producer は次のスクリプト:

```bash
node .claude/scripts/note/build-kakei-note-chart-data.mjs --all
# 1 県だけ: --pref 01000 / 出力先を変える: --out <dir>
```

R2 の `app/stats/<key>/values.json` から十大費目 10 件と家計調査の品目 500 件超を読み、
47 県庁所在市の単純平均を 1.00 とした比率にして書き出す。依存する辞書は 2 つ:

- `.claude/scripts/note/data/kakei-item-titles.json` — 品目キー → 日本語名 (registry から生成)
- `.claude/scripts/note/data/kakei-capital-cities.json` — 県コード → 県庁所在市名・slug

十大費目の metric (`*-expenditure-total` 10 件) が R2 に無いと停止する。
**検算**: 十大費目の合計は消費支出合計と一致する (2026-09-06 実測で 47/47 県が誤差 1 円以内)。

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

> **ephemeral outbox**: docs/31 が存在しない場合は先に `bash .claude/scripts/note/restore-from-r2.sh <slug>` で復元する。

```bash
# 1記事分
node .claude/skills/note/generate-note-charts/scripts/svg-to-png.js docs/31_note記事原稿/<slug>/images

# 一括（全 a-kakei-*）
for d in docs/31_note記事原稿/a-kakei-*/images; do
  node .claude/skills/note/generate-note-charts/scripts/svg-to-png.js "$d"
done
```

### Phase 3: draft.md に画像参照を挿入

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
- draft.md に画像参照が挿入されていること

## 出力ディレクトリ

```
docs/31_note記事原稿/<slug>/
├── chart-data.json          ← 既存（入力）
├── draft.md                  ← 画像参照を追記
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

## 基準の表記 (★2026-09-06 是正)

チャートの見出しは **「47県庁所在市平均」** と書く。「全国平均」ではない。

比率の基準は 47 県庁所在市の**単純平均** = 1.00 で、家計調査が公表する全国平均
(世帯数で重み付け) とは一致しない。以前の生成器は 5 箇所すべてで「全国平均」と
表示しており、記事本文の注記 (「全国値ではない」) と矛盾していた。
**図は本文より先に読まれる**ので、ここが誤っていると注記が意味を失う。

品目名は倍率ラベルの手前で打ち切る (`…`)。長い品目名が倍率と重なって
どちらも読めなくなる事故があった (例: 「教養娯楽用耐久財修理代 0.16倍」)。
