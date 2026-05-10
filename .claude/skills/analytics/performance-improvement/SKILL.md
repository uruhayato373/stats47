---
name: performance-improvement
description: PSI（PageSpeed Insights）と Core Web Vitals の計測・改善施策を GitHub Issues で追跡し、EXP-NNN 番号付きで実測値と効果判定を記録する。Use when user says "PSI改善", "LCP改善", "CLS改善", "パフォーマンス改善", "Core Web Vitals", or when reviewing psi-improvement issues.
---

PSI スコア（Performance / LCP / CLS / FID）を **GitHub Issues で時系列追跡**し、打った施策と効果を実測値ベースで記録するスキル。

実証ベース判定ルール（`.claude/rules/evidence-based-judgment.md`）に従い、推測ベースの判定を禁止。すべての effect/* ラベルは実測コマンドの結果を根拠とする。

## データの保管場所

| データ | 保管先 |
|---|---|
| 生メトリクス CSV | `reference/snapshots/YYYY-MM-DD/metrics.csv` |
| 目標しきい値設定 | `budgets.json` |
| 改善施策ログ（append-only） | `reference/improvement-log.md` |
| 施策 Issue | GitHub Issues ラベル `psi-improvement` |
| PSI Alert（自動起票） | GitHub Issues ラベル `psi-snapshot,auto-generated` |
| 週次集約 | `.claude/state/metrics/psi/{history.csv,LATEST.md}` |

## ラベル体系

- **分類**: `psi-improvement`
- **Tier**: `tier-1`（即効）/ `tier-2`（戦略）/ `tier-3`（要調査）
- **対象メトリクス**: `metric/psi-performance` / `metric/psi-lcp` / `metric/psi-cls`
- **効果判定**: `effect/pending` → `effect/full` / `effect/partial` / `effect/none` / `effect/adverse`

## 検証コマンド（実測必須）

```bash
# PSI API（Lab data）
curl "https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=https://stats47.jp/<path>&strategy=mobile&key=$PSI_API_KEY"

# 週次 LATEST 確認
cat .claude/state/metrics/psi/LATEST.md
```

## 実証チェックリスト（effect/* ラベルを付ける前に必須）

参照: `.claude/rules/evidence-based-judgment.md`

- [ ] 上記 PSI API コマンドを実行したか
- [ ] before/after の実測値（LCP ms / CLS）を記録したか
- [ ] 想定効果に根拠（過去事例 / web.dev URL）を併記したか
- [ ] NG ワード（「のはず」「兆候」「浸透待ち」）を使っていないか
- [ ] 効果が想定の 80% 未満なら仮説と次の検証コマンドを書いたか
