# ブログSVGデータ系譜 復元キュー (LATEST)

棚卸し対象: 522 記事 / SVG 1316 枚

## 系譜の整備状況
- ✅ both (json+source・系譜完全): **1217** (92%)
- 🟡 jsonOnly (再生成可・出典無): **0** (0%)
- 🔴 neither (元データ消失・再生成不可): **99** (8%)
- 🤖 現行ranking自動復元器で確証可能: **0**

## 復元手法別 (restoreMethod)
- `done`: 1217
- `manual`: 41
- `ssot-restore-new`: 34
- `ssot-restore`: 24

## 復元順 (軽い順)
1. `source-backfill` (0): 既存 json を SSOT に対応付け source.json 後付け
2. `ssot-restore` (24): regenerate-tile-maps.ts / regenerate-ranking-cards.mjs で SSOT復元
3. `ssot-restore-new` (34): scatter/line/findings の復元手法を新規実装
4. `manual` (41): 無意味名・型不明 → 個別手当て

真実源: `.claude/state/blog/svg-lineage-queue.json` / 正典: `.claude/rules/blog-data-schema.md §1.7`
