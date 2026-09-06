# データ出典・再現性 (provenance) 棚卸し (LATEST)

棚卸し日時: 2026-09-05T20:51:03.014Z
正典: `.claude/rules/data-provenance-standards.md`

## metric 再現性クラス分布
- A (statsDataId 再取得可): **2283**
- A' (機械ID付き external): **31**
- B (fetcher依存・出典薄): **14**
- C (手動抽出・provenance): **14**
- D (出典不明・要是正): **0**

## 是正対象 (C欠落 + D): **0 件**


## blog SVG lineage: total 1316 / 状態 {"both":1217,"jsonOnly":0,"neither":99}

是正は `/audit-provenance` skill 参照。fetcher コードから出典復元 → config backfill → `validate:config` 再実行。