---
name: recompute-correlations
domain: data
description: >-
  R2 観測値 (app/stats/<metric>/values.json) を入力に、使い捨て memory SQLite で指標間の
  相関 (Pearson r / 偏相関 / effectiveR) を再計算し、R2 snapshot
  (app/correlation/*) に書き出す。完全DBレスの Derived 計算。Use when user says
  "相関再計算", "recompute-correlations".
disable-model-invocation: true
primary_agent: snapshot-exporter
---

R2 の `app/stats/<metric>/values.json` を入力に、指標ペアの相関を batch 計算 → R2 snapshot に書き出す。
完全DBレス設計 (`.claude/rules/data-storage.md`) の Derived: 永続 DB を持たず、**使い捨て
`:memory:` SQLite** で集計してプロセス終了とともに破棄する。

> ✅ **実装済み (2026-06-14)** — 実体は `packages/correlation/src/scripts/build-correlation-snapshot.ts`。
> `/sync-snapshots` の `correlation` task として配線済み (`.claude/skills/db/sync-snapshots/run.sh`)。
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
#   ローカル生成は staging まで。検査後の限定反映は /push-r2 の認証済み経路を使う。

# B) 単体実行 (ローカル検証・dry-run)
R2_PUBLIC_FETCH_URL=https://storage.stats47.jp \
  npx tsx -r ./packages/ranking/src/scripts/setup-cli.js packages/correlation/src/scripts/build-correlation-snapshot.ts --dry-run
```

## 計算仕様 (旧 D1 producer から忠実移植)

- **入力**: isActive + prefecture entity + 最新年を持つ全 metric の `app/stats/<metric>/values.json`
- **共通点数**: 選定台帳の `minimumPairedAreas` (現在30) 未満のペアは除外
- **除外**: `isExcludedCorrelationKey` / `isExcludedCorrelationPair` / same-title / `COMPLEMENTARY_GROUPS` (自明ペア)
- **偏相関**: 4 control variables — `total-population` / `total-area-excluding-northern-territories-and-takeshima`
  / `ratio-65-plus` / `population-density-per-km2-total-area`
- **effectiveR** = sign(pearsonR) × min(|partial*| または |pearsonR|) — 旧 exporter SQL 準拠
- **bound**: 選定台帳の正負別件数 (現在各10件) + global top-200 を JS 側で保持し、候補行のみ `:memory:` SQLite に INSERT
  (約 2000 指標² ≈ 2M ペアを全 materialize しない)

## 出力 R2 key

- `app/correlation/top-pairs.json` (`CorrelationTopPairsSnapshot`、top-200)
- `app/correlation/stats.json` (`CorrelationStatsSnapshot`、total / strong=|r|≥0.7)
- `app/correlation/by-ranking-key-v2/<key>.json` (`CorrelationByKeySnapshot`、正負別各最大10件)

## 関連

- 実装: `packages/correlation/src/scripts/build-correlation-snapshot.ts` (+ `__tests__/`)
- 再利用 util: `packages/correlation/src/utils/calculate-pearson.ts` (`calculatePearsonR` / `calculatePartialR` / `buildScatterData`) / `trivial-pairs.ts`
- reader: `packages/correlation/src/repositories/read-correlation-{snapshot,by-key}.ts` (ranking 詳細の CorrelationSection が読む)
- 旧 skill (Phase 6 で廃止): `/run-correlation-batch`

## 正負別の選定契約

選定方針は `data/correlation/selection-policy.json` (台帳 `correlation.selection-policy`)。候補保持から正負を分け、表示側で再切断しない。0・自己参照・重複・不正値を出さず、同率は指標ID順。既存の自明ペア除外も継続する。生成後は `R2_STAGING_DIR=<生成先> npx tsx -r ./packages/ranking/src/scripts/setup-cli.js packages/correlation/src/scripts/verify-correlation-by-key.ts` で全指標の件数・参照・符号・順序を検査する。旧 by-ranking-key は互換性のため上書きしない。
