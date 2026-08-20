---
name: recompute-correlations
description: >-
  R2 観測値 (app/stats/<metric>/values.json) を入力に、使い捨て memory SQLite で指標間の
  相関 (Pearson r / 偏相関 / effectiveR) を再計算し、R2 snapshot
  (app/correlation/*) に書き出す。完全DBレスの Derived 計算。Use when user says
  "相関再計算", "recompute-correlations".
disable-model-invocation: true
primary_agent: snapshot-exporter
---

R2 の `app/stats/<metric>/values.json` を入力に、指標ペアの相関を batch 計算 → R2 snapshot に書き出す。
完全DBレス設計 (`docs/01_技術設計/02_データアーキテクチャ.md`) の Derived: 永続 DB を持たず、**使い捨て
`:memory:` SQLite** で集計してプロセス終了とともに破棄する。

> ✅ **実装済み (2026-06-14)** — 実体は `packages/correlation/src/scripts/build-correlation-snapshot.ts`。
> `/sync-snapshots` の `correlation` task として配線済み (`.Codex/skills/db/sync-snapshots/run.sh`)。
> 単体実行も可能。旧 SKILL が予定していた `recompute.ts` / D1 temp 方式は採らず、R2 観測値を直接読み
> `:memory:` better-sqlite3 で集計する方式で実装した。

## 背景

Phase 6 (2026-05-27) で `correlations` テーブル (1.79M 行) を DROP。D1 容量肥大化を避けるため、相関は
**計算時のみ使い捨て temp テーブル**で扱う方針に転換。Phase 7 (D1 stats schema 削除) で旧 D1 ベースの
producer が失われ snapshot が凍結していたが、2026-06-14 に R2 入力のエフェメラル producer として復元した。

## 実行方法

```bash
# A) sync-snapshots の一部として (CI で R2 push まで自動)
gh workflow run sync-snapshots.yml -f only=correlation         # correlation だけ再計算
#   ローカルは .local/r2 に生成のみ (R2 push は CI 専用 / _assert-ci-write)

# B) 単体実行 (ローカル検証・dry-run)
R2_PUBLIC_FETCH_URL=https://storage.stats47.jp \
  npx tsx packages/correlation/src/scripts/build-correlation-snapshot.ts --dry-run
```

## 計算仕様 (旧 D1 producer から忠実移植)

- **入力**: isActive + prefecture entity + 最新年を持つ全 metric の `app/stats/<metric>/values.json`
- **共通点数**: `MIN_DATA_POINTS = 30` 未満のペアは除外
- **除外**: `isExcludedCorrelationKey` / `isExcludedCorrelationPair` / same-title / `COMPLEMENTARY_GROUPS` (自明ペア)
- **偏相関**: 4 control variables — `total-population` / `total-area-excluding-northern-territories-and-takeshima`
  / `ratio-65-plus` / `population-density-per-km2-total-area`
- **effectiveR** = sign(pearsonR) × min(|partial*| または |pearsonR|) — 旧 exporter SQL 準拠
- **bound**: per-key top-20 + global top-200 を JS 側で保持し、候補行のみ `:memory:` SQLite に INSERT
  (約 2000 指標² ≈ 2M ペアを全 materialize しない)

## 出力 R2 key

- `app/correlation/top-pairs.json` (`CorrelationTopPairsSnapshot`、top-200)
- `app/correlation/stats.json` (`CorrelationStatsSnapshot`、total / strong=|r|≥0.7)
- `app/correlation/by-ranking-key/<key>.json` (`CorrelationByKeySnapshot`、per-key top-20)

## 関連

- 実装: `packages/correlation/src/scripts/build-correlation-snapshot.ts` (+ `__tests__/`)
- 再利用 util: `packages/correlation/src/utils/calculate-pearson.ts` (`calculatePearsonR` / `calculatePartialR` / `buildScatterData`) / `trivial-pairs.ts`
- reader: `packages/correlation/src/repositories/read-correlation-{snapshot,by-key}.ts` (ranking 詳細の CorrelationSection が読む)
- 旧 skill (Phase 6 で廃止): `/run-correlation-batch`
