---
type: indicator-backlog
created: 2026-05-19
updated: 2026-05-22
status: active
total_candidates: 72
high_priority: 21
medium_priority: 41
low_priority: 10
source_competitor: [todo-ran, uub]
source_estat_candidate_count: 8838
tags: [indicator-expansion, backlog, append-only]
related_skill: .claude/skills/management/expand-indicators/SKILL.md
---

# stats47 指標拡充 backlog (2026-05-19)

## サマリ

- 現状 stats47 active: **1,950 指標** (G2 結果、17 カテゴリ / 17 テーマ)
- 競合 todo-ran ~1,501 / uub ~1,843 (公式表記)
- e-Stat candidate pool: **8,838 件** (status='candidate'、`agriculture` 2,443 / `construction` 1,464 / `socialsecurity` 1,044 が最大)
- 拡充候補 (本 backlog): **残 28 件** (pending 16 / failed 12)。対応済み 44 件は削除 (2026-06-07、git 履歴参照)
- 主要 Gap カテゴリ 5 個 (店舗分布 / 工業細目 / 水産魚種 / 健康・受療率 / 政治参加)

## Gap カテゴリ分析

### 1. 店舗分布・商業 (commercial)
- 競合: todo-ran ~30 (コンビニ / 飲食店 / 小売)、uub の商業・経済 (郵便局 / 大規模小売)
- stats47 該当: **52** (commercial active)
- Gap 推定: ~50-80
- 拡充戦略: 経済センサス活動調査 (`stats_data_id` 0004003256〜0004003262) / 商業動態統計コンビニ販売額 (0004009962 等) から取得可、優先度 **high**

### 2. 健康・医療詳細 (socialsecurity)
- 競合: uub の医療 (受療率 / 病床 / 美肌)、todo-ran の疾患別死亡
- stats47 該当: **215** (socialsecurity active)
- Gap 推定: ~100-150 (受療率・疾病別が未着手)
- 拡充戦略: 患者調査 (0003313536, 0004026104 等) で都道府県 × 傷病分類別 受療率を一括取得、優先度 **high**

### 3. 水産業 魚種別・漁港 (agriculture / fishery)
- 競合: uub の魚種別漁獲量 (まぐろ / かつお / サケ / かに / 貝 / 海藻)、漁港数
- stats47 該当: agriculture **44** + 既存テーマ `fishery-marine`
- Gap 推定: ~50-80 (魚種別ロングテールが未着手)
- 拡充戦略: 海面漁業に関する都道府県・大海区別統計 (0003262278〜0003262295) から取得、優先度 **medium**

### 4. 工業細目 / 製造業業種別 (miningindustry / commercial)
- 競合: uub 工業 20 業種 (食料品 / 繊維 / 化学 / 鉄鋼 / 電気機械 等)
- stats47 該当: miningindustry **10** + commercial **52**
- Gap 推定: ~80-150
- 拡充戦略: 工業統計調査の中分類別出荷額は candidate に少ない (検索 0 件) → e-Stat 再 catalog 必要。木材産業 (0003234639〜0003234654) は取得可、優先度 **medium**

### 5. 政治参加・行政 (administrativefinancial)
- 競合: uub のふるさと納税 / マイナカード / 女性議員、todo-ran の投票率
- stats47 該当: administrativefinancial **107**
- Gap 推定: ~30-50
- 拡充戦略: candidate に該当ヒット少 → e-Stat 以外 (総務省 公開データ) の取り込み検討、優先度 **low** (e-Stat 経由は薄い)

## backlog 候補リスト (残 28 件: pending 16 / failed 12、priority 順。done 44 件は対応済みで削除)

| priority | candidate_slug | category | suggested_theme | estat_stats_data_id | rationale | status |
|---|---|---|---|---|---|---|
| high | sex-age-receiving-rate-2020 | socialsecurity | healthcare | 0003315937 | 過去比較用 2020 | failed <!-- failed: latest_year 2017 > 5y old @ 2026-05-19 --> |
| medium | vegetable-farm-scale | agriculture | (新規) | 0003279127 | 野菜農家数 面積規模別 | failed <!-- failed: only 45 prefectures @ 2026-05-19 --> |
| low | wood-manufacturing-plants | miningindustry | manufacturing | 0003234639 | 合単板工場数 | failed <!-- failed: only 9-region aggregate, no 47-pref data @ 2026-05-19 --> |
| low | wood-manufacturing-workers | miningindustry | manufacturing | 0003234640 | 合単板従業者数 | failed <!-- failed: only 9-region aggregate, no 47-pref data @ 2026-05-19 --> |
| low | plywood-production-type | miningindustry | manufacturing | 0003234646 | 普通合板 種類厚さ別 | failed <!-- failed: only 9-region aggregate, no 47-pref data @ 2026-05-19 --> |
| low | plywood-production-purpose | miningindustry | manufacturing | 0003234647 | 普通合板 用途別 | failed <!-- failed: only 9-region aggregate, no 47-pref data @ 2026-05-19 --> |
| low | plywood-shipping | miningindustry | manufacturing | 0003234649 | 普通合板 出荷量 | failed <!-- failed: only 9-region aggregate, no 47-pref data @ 2026-05-19 --> |
| low | softwood-plywood-production | miningindustry | manufacturing | 0003234652 | 針葉樹合板生産量 | failed <!-- failed: only 9-region aggregate, no 47-pref data @ 2026-05-19 --> |
| low | mushroom-cultivation-orgs | agriculture | (新規) | 0003279379 | きのこ品目別事業体 | failed <!-- failed: 北海道(00042)/沖縄(00057) non-standard codes need custom mapping @ 2026-05-19 --> |
| low | product-shipping-by-item | commercial | manufacturing | 0004003978 | 品目別出荷事業所数 | failed <!-- failed: no area dimension (品目別 only) @ 2026-05-19 --> |
| low | product-shipping-small-est | commercial | manufacturing | 0004003990 | 品目別出荷 従業者 3 人以下 | failed <!-- failed: no area dimension (品目別 only) @ 2026-05-19 --> |
| high | bus-passenger-transport | safetyenvironment | (新規:transport) | 0003443768 | 営業用バス 輸送人員 年度 | failed <!-- failed: area codes are transport-district-based (00001-00054), not standard 47-pref codes @ 2026-05-21 --> |
| medium | infectious-disease-deaths | socialsecurity | healthcare | 0003411705 | 感染症死亡数 都道府県 | pending |
| medium | factory-employment-planned | construction | (新規:industry-loc) | 0003411450 | 工場立地 雇用予定従業者数 | pending |
| medium | factory-by-industry | construction | (新規:industry-loc) | 0003411456 | 工場立地件数 業種別 | pending |
| medium | factory-inland-coastal | construction | (新規:industry-loc) | 0003411457 | 工場立地 内陸臨海別 | pending |
| medium | mountainous-area-subsidy | agriculture | (新規:rural-policy) | 0003418876 | 中山間地域直払 交付面積 | pending |
| medium | dairy-cattle-by-prefecture-feb | agriculture | (新規) | 0003238200 | 乳用牛 都道府県飼養戸数頭数 | pending |
| medium | livestock-slaughter-by-disease | agriculture | (新規:livestock-health) | 0003360888 | 食肉検査疾病別頭数 | pending |
| medium | broiler-shipment-by-prefecture | agriculture | (新規:livestock) | 0003368794 | 食鳥処理 都道府県別出荷量 | pending |
| medium | egg-distribution | agriculture | (新規:livestock) | 0003368802 | 鶏卵流通累年統計 | pending |
| medium | wood-supply-input | agriculture | (新規:forestry) | 0003234706 | 木材需給 需要部門別素材生産量 | pending |
| medium | wood-input-by-species | agriculture | (新規:forestry) | 0003234708 | 主要樹種別素材生産量 | pending |
| medium | biomass-energy-volume | safetyenvironment | (新規:energy) | 0003223348 | 木質バイオマス利用量 | pending |
| medium | biomass-generator-count | safetyenvironment | (新規:energy) | 0003223350 | バイオマス発電機 種類別 | pending |
| medium | biomass-boiler-count | safetyenvironment | (新規:energy) | 0003223353 | バイオマスボイラー 種類別 | pending |
| medium | water-pollution-target-establishments | safetyenvironment | environment | 0003219957 | 水質調査対象工場事業場数 | pending |
| medium | noise-regulation-establishments | safetyenvironment | environment | 0003353820 | 騒音規制 特定施設届出状況 | pending |

## 追加手順

```bash
# top 10 を順次追加
/expand-indicators --target 10
```

追加後は本 backlog 該当行の `status` を `done` に更新し、`docs/02_実装計画/improvement-backlog.md` に append する。`/expand-indicators` 未実装なら G4 で新設する。

## 制約・注意

- 本 backlog の `estat_stats_data_id` は `estat_metainfo WHERE status='candidate'` から抽出済。`save()` 経由で登録すると status='registered' に昇格 (memory `project_estat_metainfo_unified.md`)
- 工業統計の業種別中分類は candidate に直接ヒットなし → e-Stat 再 catalog (`/search-estat`) または別調査 (経済センサス活動調査) で補完
- 政治参加 (ふるさと納税 / マイナカード / 議員) は e-Stat candidate にヒットなし → 総務省直接 download スキルが別途必要
- city.j-towns は 2026-05-19 時点 ECONNREFUSED で未調査。再取得後にギャップ再計算が望ましい
- 候補 slug は仮称。`/expand-indicators` 実行時に `metrics.key` の命名規約 (kebab-case + 単位接尾辞) で正規化する

## 関連

- 競合調査: `../04_レビュー/competitor-research/2026-05-19-competitor-survey.md`
- stats47 inventory: `../04_レビュー/competitor-research/2026-05-19-stats47-inventory.md`
- 改善ログ: `../05_改善ログ/indicator-expansion.md` (G5 実行後生成)
- 自動化スキル: `.claude/skills/management/expand-indicators/SKILL.md` (G4 で新設)
- メタ統一: `~/.claude/projects/-Users-minamidaisuke-stats47/memory/project_estat_metainfo_unified.md`
