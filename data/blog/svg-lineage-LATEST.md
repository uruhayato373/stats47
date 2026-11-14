# ブログSVGデータ系譜 復元キュー (LATEST)

棚卸し対象: 860 記事 / SVG 2281 枚

## 系譜の整備状況
- ✅ both (json+source・系譜完全): **2217** (97%)
- 🟡 jsonOnly (再生成可・出典無): **0** (0%)
- 🔴 neither (元データ消失・再生成不可): **64** (3%)
- 🤖 現行ranking自動復元器で確証可能: **0**

## 復元手法別 (restoreMethod)
- `done`: 2217
- `manual`: 28
- `ssot-restore-new`: 19
- `ssot-restore`: 17

## 復元順 (軽い順)
1. `source-backfill` (0): 既存 json を SSOT に対応付け source.json 後付け
2. `ssot-restore` (17): regenerate-tile-maps.ts / regenerate-ranking-cards.mjs で SSOT復元
3. `ssot-restore-new` (19): scatter/line/findings の復元手法を新規実装
4. `manual` (28): 無意味名・型不明 → 個別手当て

真実源: `data/blog/svg-lineage-queue.json` / 正典: `.claude/rules/blog-data-schema.md §1.7`
