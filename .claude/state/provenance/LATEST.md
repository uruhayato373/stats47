# データ出典・再現性 (provenance) 棚卸し (LATEST)

棚卸し日時: 2026-07-19T13:05:21.976Z
正典: `.claude/rules/data-provenance-standards.md`

## metric 再現性クラス分布
- A (statsDataId 再取得可): **2205**
- A' (機械ID付き external): **17**
- B (fetcher依存・出典薄): **14**
- C (手動抽出・provenance): **1**
- D (出典不明・要是正): **39**

## 是正対象 (C欠落 + D): **39 件**
- `disposable-income-after-rent` [D/calculated] 欠落: 再取得キー/出典URL
- `port-cargo-coastal-in` [D/mlit_dpf] 欠落: 再取得キー/出典URL
- `port-cargo-coastal-out` [D/mlit_dpf] 欠落: 再取得キー/出典URL
- `port-container-tonnage` [D/mlit_dpf] 欠落: 再取得キー/出典URL
- `port-passengers-boarding` [D/mlit_dpf] 欠落: 再取得キー/出典URL
- `port-passengers-landing` [D/mlit_dpf] 欠落: 再取得キー/出典URL
- `port-ships-total` [D/mlit_dpf] 欠落: 再取得キー/出典URL
- `port-vehicle-ferry-car` [D/mlit_dpf] 欠落: 再取得キー/出典URL
- `port-vehicle-ferry-total` [D/mlit_dpf] 欠落: 再取得キー/出典URL
- `port-vehicle-ferry-truck` [D/mlit_dpf] 欠落: 再取得キー/出典URL
- `prefectural-income-per-capita` [D/unknown] 欠落: 再取得キー/出典URL
- `real-disposable-income` [D/calculated] 欠落: 再取得キー/出典URL
- `station-passengers-annual-total` [D/?] 欠落: 出典不明
- `treatment-rate-arthrosis-inpatient` [D/estat] 欠落: 再取得キー/出典URL
- `treatment-rate-arthrosis-outpatient` [D/estat] 欠落: 再取得キー/出典URL
- `treatment-rate-asthma-inpatient` [D/estat] 欠落: 再取得キー/出典URL
- `treatment-rate-asthma-outpatient` [D/estat] 欠落: 再取得キー/出典URL
- `treatment-rate-cancer-inpatient` [D/estat] 欠落: 再取得キー/出典URL
- `treatment-rate-cancer-outpatient` [D/estat] 欠落: 再取得キー/出典URL
- `treatment-rate-cerebrovascular-inpatient` [D/estat] 欠落: 再取得キー/出典URL
- `treatment-rate-cerebrovascular-outpatient` [D/estat] 欠落: 再取得キー/出典URL
- `treatment-rate-circulatory-inpatient` [D/estat] 欠落: 再取得キー/出典URL
- `treatment-rate-circulatory-outpatient` [D/estat] 欠落: 再取得キー/出典URL
- `treatment-rate-diabetes-inpatient` [D/estat] 欠落: 再取得キー/出典URL
- `treatment-rate-diabetes-outpatient` [D/estat] 欠落: 再取得キー/出典URL
- `treatment-rate-hypertension-inpatient` [D/estat] 欠落: 再取得キー/出典URL
- `treatment-rate-hypertension-outpatient` [D/estat] 欠落: 再取得キー/出典URL
- `treatment-rate-mental-disorder-inpatient` [D/estat] 欠落: 再取得キー/出典URL
- `treatment-rate-mental-disorder-outpatient` [D/estat] 欠落: 再取得キー/出典URL
- `treatment-rate-mood-disorder-inpatient` [D/estat] 欠落: 再取得キー/出典URL
- `treatment-rate-mood-disorder-outpatient` [D/estat] 欠落: 再取得キー/出典URL
- `treatment-rate-musculoskeletal-inpatient` [D/estat] 欠落: 再取得キー/出典URL
- `treatment-rate-musculoskeletal-outpatient` [D/estat] 欠落: 再取得キー/出典URL
- `treatment-rate-neurosis-inpatient` [D/estat] 欠落: 再取得キー/出典URL
- `treatment-rate-neurosis-outpatient` [D/estat] 欠落: 再取得キー/出典URL
- `treatment-rate-osteoporosis-inpatient` [D/estat] 欠落: 再取得キー/出典URL
- `treatment-rate-osteoporosis-outpatient` [D/estat] 欠落: 再取得キー/出典URL
- `treatment-rate-schizophrenia-inpatient` [D/estat] 欠落: 再取得キー/出典URL
- `treatment-rate-schizophrenia-outpatient` [D/estat] 欠落: 再取得キー/出典URL


## blog SVG lineage: total 612 / 状態 {"both":381,"jsonOnly":22,"neither":209}

是正は `/audit-provenance` skill 参照。fetcher コードから出典復元 → config backfill → `validate:config` 再実行。