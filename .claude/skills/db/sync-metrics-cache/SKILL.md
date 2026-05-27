---
name: sync-metrics-cache
description: TS registry (data-configs) → D1 metrics テーブル (cache) に同期する。Phase 6 後は metrics への書込みは本 skill のみ。Use when user says "metric cache 同期", "sync-metrics-cache", "registry → D1".
argument-hint: [--apply]
disable-model-invocation: true
primary_agent: data-ingester
co_agents: [theme-designer]
---

`packages/data-configs/src/registry.ts` から MetricConfig を読み、`metrics` D1 テーブルに UPSERT する。Phase 6 以降は `metrics` テーブルへの書込権限を本 skill に集約する。

## 背景

Phase 6 では TS-config が SSOT、D1 `metrics` テーブルは「クエリ高速化のための cache」に位置付けが変わる。手作業の INSERT は禁止し、必ず本 skill 経由で同期する。

## 手順

### 1. dry-run で差分を確認

```bash
npx tsx packages/data-configs/scripts/sync-metrics-cache.ts
```

出力:
- `insert: N` (registry にあるが D1 にない)
- `update: N` (両方にある、列値を上書き)
- `orphan: N` (D1 にあるが registry に無い、警告のみで削除しない)

### 2. apply

```bash
npx tsx packages/data-configs/scripts/sync-metrics-cache.ts --apply
```

orphan 行は DELETE されない (手動確認が必要)。意図的に廃止する metric は registry から削除して別途 D1 で DELETE する。

## 安全装置

- registry が空 (= TS files 0 個) の場合は abort (誤って全 metric を削除しないため)
- INSERT / UPDATE は一括 transaction
- updated_at は CURRENT_TIMESTAMP

## 関連

- 実装: `packages/data-configs/scripts/sync-metrics-cache.ts`
- registry: `packages/data-configs/src/registry.ts`
- 関連: `/page-data-batch`, `/verify-d1-integrity`
