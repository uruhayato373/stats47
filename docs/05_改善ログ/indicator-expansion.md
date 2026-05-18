---
type: improvement-log
target_metric: indicator-count
status: active
created: 2026-05-19
updated: 2026-05-19
baseline: 1950
goal: 2500
goal_due: 2026-Q3
tier: 2
tags: [indicator-expansion, automation, append-only]
related_skill: ../../.claude/skills/management/expand-indicators/SKILL.md
related_backlog: ../50_Issues/indicator-backlog.md
---

# 指標拡充ログ (append-only)

## 概要

stats47 の active 指標数を **1,950 (2026-05-19) → 2,500 (2026 Q3)** に拡充する継続作業のログ。
`/expand-indicators` 実行ごとに本ファイルへ append する。施策ベース (バッチ単位) で記録し、判定が変わったら section 末尾に追記する。

## KPI

| 指標 | baseline (2026-05-19) | 現在 | 目標 (2026 Q3) |
|---|---|---|---|
| active indicators 総数 | 1,950 | 1,978 | 2,500 |
| 17 カテゴリ最小数 | 10 (miningindustry) | 10 | 30 |
| backlog pending 件数 | 38 | 33 | 0 |

> KPI 注: backlog pending は G8 (2026-05-19) で 33 件の新規候補 (environment/transport/healthcare-detail/biomass/livestock/forestry 他) を append したため、BATCH-03 で 0 化したのち再び 33 へ増加。次回 batch 候補。

## 入力

- backlog: [`docs/50_Issues/indicator-backlog.md`](../50_Issues/indicator-backlog.md) (38 candidate)
- 取得元: e-Stat API (`estat_metainfo WHERE status='candidate'`)
- 関連スキル: [`/expand-indicators`](../../.claude/skills/management/expand-indicators/SKILL.md)

## 実行履歴

## [BATCH-2026-05-19-01] 10 件処理 → 9 件追加 (priority high)

- **status**: partial (9/10 success)
- **deployed_at**: 2026-05-19
- **executed_by**: `/expand-indicators --target 10 --priority high` (実体は `/tmp/expand-indicators/run2.mjs`、SKILL.md は旧 indicators/ranking_data 前提のため schema-drift 対応で独自 orchestrator を使用)
- **tier**: 2
- **target_metric**: indicator-count

### 追加リスト

| slug | category | theme | estat_id | rows | latest_year | status |
|---|---|---|---|---|---|---|
| convenience-store-sales-monthly | commercial | local-economy | 0004032502 | 47 | 2024 | done |
| convenience-store-sales-yoy | commercial | local-economy | 0003395254 | 47 | 2019 | done (allow_old) |
| retail-establishments-by-prefecture | commercial | local-economy | 0004003256 | 47 | 2021 | done |
| retail-sales-amount-by-prefecture | commercial | local-economy | 0004003259 | 47 | 2021 | done |
| retail-sales-area-by-class | commercial | local-economy | 0004003261 | 47 | 2021 | done |
| patient-receiving-rate-by-disease | socialsecurity | healthcare | 0004026105 | 47 | 2023 | done |
| patient-receiving-rate-by-age | socialsecurity | healthcare | 0004026104 | 47 | 2023 | done |
| inpatient-rate-by-bedtype | socialsecurity | healthcare | 0004002555 | 47 | 2020 | done (allow_old) |
| sex-age-receiving-rate-2020 | socialsecurity | healthcare | 0003315937 | 0 | 2017 | **failed** |
| hospital-staff-by-occupation | socialsecurity | healthcare | 0004027744 | 47 | 2020 | done (allow_old) |

### 結果

- 追加成功: 9 件 / 失敗: 1 件 / skip (既存): 0 件
- backlog 残: pending=28 / failed=1 / done=9 (前: pending=38)
- 累計 active indicators: 1,950 → 1,959 (+9)

### 想定効果 (`.claude/rules/evidence-based-judgment.md` 準拠)

- **想定**: 9 ranking_key × ~1.5 page/key (`/ranking/<key>` + `/category/commercial` `/category/socialsecurity` への indicator 追加カウント) = 約 13 新規 URL 増。GSC impressions 観点では新規 ranking_key 平均 +5-15 impressions/月/key を想定 [根拠: `docs/04_レビュー/competitor-research/2026-05-19-stats47-inventory.md` の commercial 52 → 57 / socialsecurity 215 → 219 拡充寄与、競合 todo-ran 同カテゴリの月間 impressions 平均]
- **検証コマンド**:
  - URL 公開後: `/fetch-gsc-data last28d page snapshot 2026-W23` で path に `convenience-store-sales`/`retail-`/`patient-receiving-rate`/`inpatient-rate-`/`hospital-staff-by-occupation` を grep
  - D1 検証 (済): 9 keys × 47 rows をローカル D1 で確認済 (`SELECT key,(SELECT COUNT(*) FROM stats_prefecture WHERE metric_key=metrics.key) FROM metrics WHERE key IN (...)`)
- **検証期日**: 2026-06-16 (28d 後)
- **判定**: `effect/pending` (本番反映後 28d で GSC impressions / clicks を再評価)

### 失敗 candidate

- `sex-age-receiving-rate-2020` (0003315937): 平成 29 年患者調査 = 2017 年データ。MAX_YEAR_AGE (5) を超過 → 自動 skip。代替候補は同患者調査の 2020 年版 (`inpatient-rate-by-bedtype` で既収) または 2023 年版 (`patient-receiving-rate-by-age` で既収) があるため新規追加不要
- → backlog の status を `failed` に更新済

### 次回 batch 推奨

- 残 pending 高優先: `smartphone-usage-time-by-age`, `smartphone-usage-rate-by-sex`, `smartphone-usage-students`, `hobby-activity-by-couple` (ict / educationsports カテゴリ)
- 推奨実行: `/expand-indicators --target 4 --priority high` (残 high 4 件)
- その後: medium 14 件 / low 10 件を 2-3 バッチに分けて実行

### 既知の注意点 (本バッチで顕在化)

- **SKILL.md は schema-drift 状態**: `indicators` / `ranking_data` 前提のまま放置されていたため、本実行は `metrics` / `stats_prefecture` を直接書く独自 orchestrator (`/tmp/expand-indicators/run2.mjs`) で代替。次回までに SKILL.md を `metrics` ベースに書き直す必要あり (memory: `feedback_skill_schema_drift.md`)
- **多次元キューブの recipe 必須**: 患者調査系は area 次元を持たず prefecture を cat02/cat03 の 1-48 内部コードで表現。コードの 2..48 を 01000..47000 へマップする変換が必要
- **`lvArea=2` は使えない場合あり**: 経済センサス系 (0004003256/259/261) では `lvArea=2` を付けると 0 件返却。フィルタなしで取得し正規表現で都道府県を抽出する方が安全
- **`allowOldYear` フラグ**: backlog の rationale で「過去比較用」と明示されている候補は 5 年超過でも登録可とした (今回は 2019/2020 の 3 件)。ただし `sex-age-receiving-rate-2020` (2017) は代替が既登録なため失敗扱い継続

### 後続アクション (人間 / 別スキルで実施)

- `/generate-known-ranking-keys` 実行 → `apps/web/src/config/known-ranking-keys.ts` に 9 keys を追加 (未実行だと middleware Fix 6 で 410 Gone)
- `/sync-snapshots` で R2 へ反映 → 本番配信
- 必要なら `/purge-cdn` で旧 ISR キャッシュをパージ

---

## [BATCH-2026-05-19-02] 14 件処理 → 13 件追加 (priority medium)

- **status**: partial (13/14 success)
- **deployed_at**: 2026-05-19
- **executed_by**: `/expand-indicators --target 14 --priority medium` (`.claude/scripts/management/ingest-indicator.mjs` 経由)
- **tier**: 2
- **target_metric**: indicator-count

### 追加リスト

| slug | category | theme | estat_id | rows | latest_year | status |
|---|---|---|---|---|---|---|
| hobby-activity-singleperson | educationsports | (新規) | 0003455926 | 47 | 2021 | done (allow_old) |
| fishery-workers-coastal-offshore | agriculture | fishery-marine | 0003262278 | 47 | 2018 | done (沿岸 39 + 内陸 8 県=0 補完) |
| fishery-household-sex-age | agriculture | fishery-marine | 0003262280 | 47 | 2018 | done (沿岸 39 + 内陸 8 県=0 補完) |
| fishing-vessel-tonnage-class | agriculture | fishery-marine | 0003262281 | 47 | 2018 | done (沿岸 39 + 内陸 8 県=0 補完) |
| fishing-vessel-crew | agriculture | fishery-marine | 0003262282 | 47 | 2018 | done (沿岸 39 + 内陸 8 県=0 補完) |
| fishery-management-orgs | agriculture | fishery-marine | 0003262285 | 47 | 2018 | done (沿岸 39 + 内陸 8 県=0 補完) |
| recreational-fishing-count | agriculture | fishery-marine | 0003262287 | 47 | 2018 | done (沿岸 39 + 内陸 8 県=0 補完) |
| fishing-port-count-by-type | agriculture | fishery-marine | 0003262291 | 47 | 2018 | done (沿岸 39 + 内陸 8 県=0 補完) |
| port-entry-vessel-count | agriculture | fishery-marine | 0003262295 | 47 | 2018 | done (沿岸 39 + 内陸 8 県=0 補完) |
| vegetable-cultivation-area | agriculture | (新規) | 0003423836 | 47 | 2019 | done (allow_old) |
| vegetable-farm-scale | agriculture | (新規) | 0003279127 | 45 | 2005 | **failed** |
| household-types-by-area | population | (新規) | 0003355518 | 47 | 2018 | done (allow_old) |
| household-income-by-type | population | (新規) | 0003355488 | 47 | 2018 | done (allow_old) |
| elderly-household-detail | population | aging-society | 0003355281 | 47 | 2018 | done (allow_old) |

### 結果

- 追加成功: 13 件 / 失敗: 1 件 / skip (既存): 0 件
- backlog 残: pending=14 / failed=2 / done=22 (前: pending=28 / failed=1 / done=9)
- 累計 active indicators: 1,959 → 1,972 (+13)

### 想定効果 (`.claude/rules/evidence-based-judgment.md` 準拠)

- **想定**: 13 ranking_key × ~1.5 page/key = 約 20 新規 URL 増。GSC impressions 観点では新規 ranking_key 平均 +5-15 impressions/月/key を想定 [根拠: BATCH-01 と同じく `docs/04_レビュー/competitor-research/2026-05-19-stats47-inventory.md` の agriculture 44 → 53、population カテゴリ拡充寄与]
- **検証コマンド**:
  - URL 公開後: `/fetch-gsc-data last28d page snapshot 2026-W23` で path に `fishery-`/`fishing-`/`vegetable-`/`hobby-`/`household-`/`elderly-` を grep
  - D1 検証 (済): 13 keys のローカル D1 行数を確認済 (`SELECT key,(SELECT COUNT(*) FROM stats_prefecture WHERE metric_key=metrics.key) FROM metrics WHERE key IN (...)`)
- **検証期日**: 2026-06-16 (28d 後)
- **判定**: `effect/pending` (本番反映後 28d で GSC impressions / clicks を再評価)

### 失敗 candidate

- `vegetable-farm-scale` (0003279127): 2005 年農林業センサス、area 次元に「全国農業地域」(00042=北海道, 50002=都府県等) が混在し都道府県 47 件が揃わず 45 件のみ抽出。代替候補なし、年次データが 2005 のみなので新規追加見送り
- → backlog の status を `failed` に更新済

### 既知の注意点 (本バッチで顕在化)

- **海面漁業統計の area 次元には「大海区」が含まれる**: 0003262xxx 系は `area` に 48000-74000 の大海区コード (太平洋北区・瀬戸内海区等) や複合コード (青森県(太平洋北区) 等) を持ち、orchestrator の `pickPrefByArea` (正規表現 `^\d{2}000$`) を素通りして 47 都道府県以外の値を取り込んでしまう。本バッチでは ingest 後に手動 SQL で `CAST(SUBSTR(area_code,1,2) AS INTEGER) > 47` を削除 + ランク再計算で修復した
- **海面漁業は内陸 8 県 (栃木・群馬・埼玉・山梨・長野・岐阜・滋賀・奈良) のデータが構造的に存在しない**: 8 件すべて事後で `/tmp/expand-indicators/fill-landlocked-zeros.mjs` で内陸 8 県=0 補完 + rank 再計算 + `metrics.subtitle` に「※ 内陸 8 県は調査対象外 (value=0 で表示)」明記。47/47 件で done
- **国勢調査 2018 系 (0003355xxx) は `cdTab` に `12-2018` / `13-2018` 形式**: 年次接尾辞付き

### 次回 batch 推奨

- 残 pending: medium 1 件 (`traffic-accident-death-by-age`) + low 10 件 = 計 11 件
- 推奨実行: `/expand-indicators --target 11 --priority medium,low` (一括) または `/expand-indicators --target 11 --priority low`
- 後続: `/generate-known-ranking-keys` で middleware 反映 + `/sync-snapshots` で R2 配信

### 後続アクション (人間 / 別スキルで実施)

- `/generate-known-ranking-keys` 実行 → BATCH-01 9 keys + BATCH-02 13 keys = 計 22 keys を一括追加
- `/sync-snapshots` で R2 へ反映 → 本番配信
- 必要なら `/purge-cdn` で旧 ISR キャッシュをパージ
- ~~ingest-indicator.mjs の `pickPrefByArea` 改修検討~~ → **2026-05-19 修正済**: regex を `^(0[1-9]|[1-3]\d|4[0-7])000$` に強化、大海区混入を未然防止

---

## [BATCH-2026-05-19-03] 15 件処理 → 6 件追加 (priority high+medium+low)

- **status**: partial (6/15 success, 9 failed: 不適合データ構造)
- **deployed_at**: 2026-05-19
- **executed_by**: `/expand-indicators --target 15 --priority all` (`.claude/scripts/management/ingest-indicator.mjs` 経由、recipes-2026-05-19-03.json)
- **tier**: 2
- **target_metric**: indicator-count

### 追加リスト

| slug | category | theme | estat_id | rows | latest_year | status |
|---|---|---|---|---|---|---|
| smartphone-usage-time-by-age | ict | (新規) | 0003457306 | 47 | 2021 | done (allow_old) |
| smartphone-usage-rate-by-sex | ict | (新規) | 0003457311 | 47 | 2021 | done (allow_old) |
| smartphone-usage-students | educationsports | education-culture | 0003457319 | 47 | 2021 | done (allow_old) |
| hobby-activity-by-couple | educationsports | (新規) | 0003455918 | 47 | 2021 | done (allow_old) |
| traffic-accident-death-by-age | safetyenvironment | safety | 0003411708 | 47 | 2024 | done |
| accident-death-30day | safetyenvironment | safety | 0003281586 | 47 | 2018 | done (allow_old, discontinued series) |
| wood-manufacturing-plants | miningindustry | manufacturing | 0003234639 | - | - | **failed** (9-region only) |
| wood-manufacturing-workers | miningindustry | manufacturing | 0003234640 | - | - | **failed** (9-region only) |
| plywood-production-type | miningindustry | manufacturing | 0003234646 | - | - | **failed** (9-region only) |
| plywood-production-purpose | miningindustry | manufacturing | 0003234647 | - | - | **failed** (9-region only) |
| plywood-shipping | miningindustry | manufacturing | 0003234649 | - | - | **failed** (9-region only) |
| softwood-plywood-production | miningindustry | manufacturing | 0003234652 | - | - | **failed** (9-region only) |
| mushroom-cultivation-orgs | agriculture | (新規) | 0003279379 | - | - | **failed** (非標準コード) |
| product-shipping-by-item | commercial | manufacturing | 0004003978 | - | - | **failed** (no area dim) |
| product-shipping-small-est | commercial | manufacturing | 0004003990 | - | - | **failed** (no area dim) |

### 結果

- 追加成功: 6 件 / 失敗: 9 件 / skip (既存): 0 件
- backlog 残: pending=11 / failed=11 / done=28 (前: pending=15 / failed=2 / done=22 + 本 batch で +6 done +9 failed)
- 累計 active indicators: 1,972 → 1,978 (+6)

### 想定効果 (`.claude/rules/evidence-based-judgment.md` 準拠)

- **想定**: 6 ranking_key × ~1.5 page/key = 約 9 新規 URL 増。GSC impressions は新規 ranking_key 平均 +5-15 impressions/月/key を想定 [根拠: BATCH-01/02 と同基準、ict / educationsports / safety カテゴリ拡充]
- **検証コマンド**:
  - URL 公開後: `/fetch-gsc-data last28d page snapshot 2026-W23` で path に `smartphone-`/`hobby-`/`traffic-accident-`/`accident-death-` を grep
  - D1 検証 (済): 6 keys のローカル D1 行数を確認 (`active_metrics_after = 1978`)
- **検証期日**: 2026-06-16 (28d 後)
- **判定**: `effect/pending` (本番反映後 28d で GSC impressions / clicks を再評価)

### 失敗 candidate (9 件、構造的に 47 都道府県化不可)

- **wood/plywood 6 件** (`0003234639`-`0003234652`): 木材統計調査の area 次元が「全国 + 8 地域 (北海道/東北/関東/北陸/東海/近畿/中国四国/九州)」の 9 件のみで都道府県粒度なし。最新年 2007/2004。今後も 47 都道府県化は不可能なため backlog 永久 failed
- **mushroom-cultivation-orgs** (`0003279379`): 2005 年農林業センサス、area 次元に 北海道=`00042` / 沖縄=`00057` の非標準コードが混在 (他 45 県は `02000`-`46000` の標準形式)。orchestrator の `pickPrefByArea` regex は標準 5 桁 (`^(0[1-9]|[1-3]\d|4[0-7])000$`) のみマッチするため 北海道/沖縄が落ちる。代替パスとして「非標準コード → 標準コードへの custom mapping」を ingest-indicator.mjs に追加する案はあるが、ROI 低 (2005 年単発) のため見送り
- **product-shipping-by-item / -small-est** (`0004003978`, `0004003990`): 経済センサス活動調査 製造業集計だが `cat02` が「製造品目」(1803/1332 items) のみで area 次元が存在しない。表構造上 47 都道府県化不可

### 既知の注意点 (本バッチで顕在化)

- **「都道府県別」とタイトルにあっても area 次元が存在しないケースあり**: `0004003978`/`0004003990` は経済センサス活動調査のため都道府県別データの主集計表は別 ID (`0004003256-261` 等、既に BATCH-01 で登録済)。タイトルだけでなく `getMetaInfo` の `CLASS_OBJ` で `area` 次元の有無を必ず probe すること
- **木材統計調査 (0003234xxx) は地域ブロック集計のみ**: 「都道府県別」と表題にあるが内訳は 9 地域ブロック。e-Stat 上でこの調査の 47 都道府県細目はない (公式 e-Stat 検索で 0 件)。今後 backlog に追加する前に area 件数を必ず確認
- **2005 年農林業センサス系の area コードは非標準**: 北海道=`00042` / 沖縄=`00057` で都府県と異なる。`0003279xxx` 系を将来扱う場合、ingest-indicator.mjs に custom mapping 引数 (`areaCodeMap`) を追加することを検討。本バッチでは未対応
- **smartphone / hobby 系 (社会生活基本調査 2021)** は `allowOldYear: true` 必須 (2021 → 5y 経過)。次回調査は 2026 年実施→2027 年公開予定なので、それまでは 2021 を継続使用

### 次回 batch 推奨

- 残 pending: high 7 件 (bus-passenger / factory-* / health-checkup / vaccination / maternal-child / dental-checkup) + medium ~3 件 + low ~1 件 = 計 11+ 件
- 推奨実行: `/expand-indicators --target 7 --priority high` (next batch で healthcare 系 + 構築立地系を消化)
- 後続: `/generate-known-ranking-keys` で middleware 反映 + `/sync-snapshots` で R2 配信

### 後続アクション (人間 / 別スキルで実施)

- `/generate-known-ranking-keys` 実行 → BATCH-01/02/03 累計 28 keys を middleware に反映
- `/sync-snapshots` で R2 へ反映 → 本番配信
- 必要なら `/purge-cdn` で旧 ISR キャッシュをパージ

---

### テンプレート (新規 entry はこの形式で追加)

```markdown
## [BATCH-YYYY-MM-DD-NN] <件数> 件追加 (priority <high|medium|low>)

- **status**: completed | partial | failed
- **deployed_at**: YYYY-MM-DD
- **executed_by**: `/expand-indicators --target <N> --priority <p>`
- **tier**: 2
- **target_metric**: indicator-count

### 追加リスト

| slug | category | theme | estat_id | rows (47?) | latest_year |
|---|---|---|---|---|---|
| convenience-store-sales-monthly | commercial | local-economy | 0004032502 | 47 | 2024 |

### 結果

- 追加成功: N 件 / 失敗: M 件 / skip (既存): K 件
- backlog 残: pending=XX / failed=YY / done=ZZ
- 累計 active indicators: BEFORE → AFTER (+DIFF)

### 想定効果 (`.claude/rules/evidence-based-judgment.md` 準拠)

- **想定**: +X PV / 月 [根拠: 競合 todo-ran の同カテゴリ平均 N PV/月 × ...]
- **検証コマンド**: `/fetch-gsc-data last28d page snapshot YYYY-Www` (該当 ranking_key path を grep)
- **検証期日**: deployed_at + 28d
- **判定**: `effect/pending` (28d 後に GSC impressions / clicks で判定)

### 失敗 candidate (あれば)

- `<slug>`: 失敗理由 (e-Stat API error / 47 件未満 / cdCat01 不明 等)
- → backlog の status を `failed` に更新済

### 次回 batch 推奨

- 残 pending 上位: <slug1>, <slug2>, ...
- 推奨実行: `/expand-indicators --target 10 --priority high`
```
