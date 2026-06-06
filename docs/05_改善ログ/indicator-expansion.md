---
type: improvement-log
target_metric: indicator-count
status: active
created: 2026-05-19
updated: 2026-05-22
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
| active indicators 総数 | 1,950 | 1,993 | 2,500 |
| 17 カテゴリ最小数 | 10 (miningindustry) | 10 | 30 |
| backlog pending 件数 | 38 | 16 | 0 |

> KPI 注: backlog pending は G8 (2026-05-19) で 33 件の新規候補 (environment/transport/healthcare-detail/biomass/livestock/forestry 他) を append したため、BATCH-03 で 0 化したのち再び 33 へ増加。次回 batch 候補。

## 入力

- backlog: [`docs/50_Issues/indicator-backlog.md`](../50_Issues/indicator-backlog.md) (38 candidate)
- 取得元: e-Stat API (`estat_metainfo WHERE status='candidate'`)
- 関連スキル: [`/expand-indicators`](../../.claude/skills/management/expand-indicators/SKILL.md)

## 実行履歴

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
