---
name: page-data-batch
description: TS-config (data-configs registry) を walk して e-Stat から data を fetch し R2 直行で書き込む。D1 を経由しない Phase 6 メインバッチ。Use when user says "page-data-batch", "metric データ更新", "R2 更新バッチ".
argument-hint: [--metric <key>] [--kind <entity>] [--since YYYY-MM] [--dry-run] [--concurrency N]
disable-model-invocation: true
---

`packages/data-configs/src/metrics/*.ts` registry を入力に、e-Stat から data を fetch して R2 (`.local/r2/app/stats/<metric>/values.json`) へ直接書き込む。

Phase 6 で D1 → R2 移行が完了した後、本 skill が新規 metric / 年度更新の主たる手段となる (旧 `/populate-all-rankings` の置換)。

## 背景

Phase 1-4 までは e-Stat → D1 → R2 snapshot の二段階フローだったが、D1 が 15GB に肥大化したため D1 を経由しない方針に転換 (Phase 6)。本 skill は **TS-config = SSOT、R2 = storage、D1 = メタ cache** という新アーキテクチャの中心。

詳細: `.claude/rules/data-d1-ssot.md`、`~/.claude/plans/synthetic-zooming-yeti.md`

## 手順

### 1. dry-run で対象を確認

```bash
npx tsx packages/data-configs/scripts/page-data-batch.ts --dry-run
npx tsx packages/data-configs/scripts/page-data-batch.ts --kind city --dry-run
```

### 2. 単一 metric の更新 (smoke)

```bash
npx tsx packages/data-configs/scripts/page-data-batch.ts --metric japanese-population
```

### 3. 部分更新 (since フィルタ)

```bash
# 2024-01 以降に更新されていない metric だけ再取得
npx tsx packages/data-configs/scripts/page-data-batch.ts --since 2024-01-01
```

### 4. 全件更新 (週次運用想定)

```bash
npx tsx packages/data-configs/scripts/page-data-batch.ts --concurrency 4
```

時間目安: 2,200 metric × ~1 秒/req = **40-60 分**。e-Stat API レート制限あり、concurrency は 4-8 推奨。

### 5. R2 へ push

```bash
npx tsx packages/r2-storage/src/scripts/diff-push-r2.ts --prefix app/stats
```

## サポート状況 (Phase 6.4 時点)

| source.kind | 対応 |
|---|---|
| `estat` | ✅ 実装済 |
| `kakei-chousa` | ⏳ 未対応 (フェッチャ別途) |
| `mlit` / `external` | ⏳ 未対応 (フェッチャ別途) |
| `calculated` | ⏳ 別 skill 必要 (分子/分母の依存解決) |

非対応 source は skip (失敗扱いではない)。

## 新規 metric 追加フロー

1. `packages/data-configs/src/metrics/<new-key>.ts` を新規作成 (既存ファイルをコピーして編集)
2. `npx tsx packages/data-configs/scripts/build-registry.ts` で registry 再生成
3. `/page-data-batch --metric <new-key>` で data fetch + R2 書込
4. `/sync-metrics-cache --apply` で D1 metrics cache に同期
5. `/push-r2 --prefix app/stats` で本番 R2 反映

## 参照

- 実装: `packages/data-configs/scripts/page-data-batch.ts`
- registry: `packages/data-configs/src/registry.ts`
- 型: `packages/data-configs/src/types.ts`
- 関連: `/sync-metrics-cache`, `/push-r2`, `/verify-d1-integrity`
