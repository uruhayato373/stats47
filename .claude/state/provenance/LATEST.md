# データ出典・再現性 (provenance) 棚卸し (LATEST)

棚卸し日時: 2026-07-19T14:09:21.558Z
正典: `.claude/rules/data-provenance-standards.md`

## metric 再現性クラス分布
- A (statsDataId 再取得可): **2231**
- A' (機械ID付き external): **30**
- B (fetcher依存・出典薄): **14**
- C (手動抽出・provenance): **1**
- D (出典不明・要是正): **0**

## 是正対象 (C欠落 + D): **0 件**


## blog SVG lineage: total 612 / 状態 {"both":381,"jsonOnly":22,"neither":209}

是正は `/audit-provenance` skill 参照。fetcher コードから出典復元 → config backfill → `validate:config` 再実行。