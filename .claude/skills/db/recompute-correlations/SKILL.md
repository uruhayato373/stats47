---
name: recompute-correlations
description: R2 stats から temp D1 を構築して相関分析を再計算し、結果を R2 snapshot に書き出して temp を破棄する。Phase 6 で correlations テーブルを廃止した後の代替 skill。Use when user says "相関再計算", "recompute-correlations".
disable-model-invocation: true
primary_agent: snapshot-exporter
---

> ⚠️ **NOT IMPLEMENTED (Phase 7)** — 2026-05-28 時点では SKILL.md と方針のみ確定。実装スクリプト `packages/correlation/src/scripts/recompute.ts` は未作成。
> 既存の相関 snapshot (`app/correlation/top-pairs.json` 等) は Phase 6 移行前の D1 から派生したものをそのまま使用中。再計算が必要な時点で Phase 7 として着手する。
> Issue: `docs/02_実装計画/feature-backlog.md` の "Phase 7: recompute-correlations 実装" 項を参照。

R2 の `app/stats/<metric>/values.json` を入力に、Pearson 相関を batch 計算 → R2 snapshot に書き出し → 一時テーブル破棄。

## 背景

Phase 6 (2026-05-27) で `correlations` テーブル (1.79M 行) を DROP。D1 容量肥大化を避けるため、相関は **計算時のみ temp テーブル**で扱う方針に転換。普段の D1 には相関データを置かない。

## 手順 (実装予定 / placeholder)

```bash
# 未実装: 以下フローで Phase 6 後に追加予定
# 1. R2 stats から japanese-population 等の全 metric を D1 temp に SELECT INTO
# 2. metric ペアごとに JOIN で Pearson 計算
# 3. 結果を app/correlation/top-pairs.json と by-key/<key>.json に書き出し
# 4. temp テーブル DROP + VACUUM
```

実装は `packages/correlation/src/scripts/recompute.ts` (新規) を予定。

## 関連

- 旧 skill (Phase 6 で廃止): `/run-correlation-batch`
- 入力 R2 key: `app/stats/<metric>/values.json`
- 出力 R2 key: `app/correlation/top-pairs.json`, `app/correlation/by-ranking-key/<key>.json`
