---
name: performance-report
description: パフォーマンス総合レポートを生成する（トレンド・バジェット監査・ページ種別比較・改善提案）。Use when user says "パフォーマンスレポート", "速度レポート", "CWVまとめ". .claude/state/metrics/psi の history.csv / LATEST.md から分析.
argument-hint: "[--period 7d|28d|3m] [--compare]"
allowed-tools: Read, Bash, Grep
primary_agent: performance-auditor
co_agents: [gsc-analyst]
---

# /performance-report — CWV 総合レポート（PSI state ベース）

`.claude/state/metrics/psi/` に蓄積された PSI 計測履歴からパフォーマンス総合レポートを生成する。
トレンド分析・バジェット監査・ページ種別比較・改善提案を含む。

> **2026-06-21 PSI 統合**。旧版は `packages/database/scripts/performance-report.ts`（削除済）を実行し
> `performance-improvement/snapshots/*/metrics.csv`（writer 消滅で枯渇）を読んでいた。CWV 監視は PSI 日次
> ワークフローに一本化済（→ `/lighthouse-audit`）。本スキルは **`.claude/state/metrics/psi/history.csv`
> （日次トレンド）+ `LATEST.md`（最新前日比）** を入力に、エージェントがレポートを生成する（専用 D1 スクリプトは不要）。

## 前提条件

- `.claude/state/metrics/psi/history.csv` にデータがあること（日次 CI `psi-audit-daily.yml` が蓄積。手動は `/lighthouse-audit`）
- トレンド比較には複数日のデータが必要

## 引数

```
/performance-report [--period 7d|28d|3m] [--compare]
```

- `--period`: 分析対象期間（デフォルト `28d`）。`7d` / `28d` / `3m`
- `--compare`: 前期間との比較を含める

## 実行手順（エージェント駆動・DBレス）

1. **最新サマリを読む**: `.claude/state/metrics/psi/LATEST.md`（前日比矢印 + 閾値違反強調。digest 済の人間向けレポート）

2. **トレンド用に history.csv を期間で絞る**:

   ```bash
   # ヘッダ + 直近 period 日分。history.csv は date,url,strategy,page_type,score_performance,
   #   lcp_ms,cls,tbt_ms,fcp_ms,ttfb_ms,violations_error,violations_warning
   head -1 .claude/state/metrics/psi/history.csv
   awk -F, -v since="$(date -v-28d +%F 2>/dev/null || date -d '28 days ago' +%F)" 'NR==1||$1>=since' \
     .claude/state/metrics/psi/history.csv
   ```

3. **最新の閾値違反を取り直す**（必要なら）:

   ```bash
   npm run psi-audit:check -- --output /tmp/psi-report.md   # budgets.json と比較した violations
   ```

4. **CSV カラム定義**（`history.csv`）:
   - `date`, `url`, `strategy`, `page_type`
   - `score_performance`
   - Lab data: `lcp_ms`, `cls`, `tbt_ms`, `fcp_ms`, `ttfb_ms`
   - `violations_error`, `violations_warning`

   > 注: PSI history.csv は旧 metrics.csv より列が絞られている（accessibility / best_practices / seo /
   > inp_ms / si_ms / tti_ms / リソース byte weight / CrUX p75 は含まない）。リソース内訳や CrUX field の
   > 詳細が要る場合は生バッチ `psi-batch-<ISO>.json`（CrUX を含む）を参照する。

5. **レポート生成 → 保存**（後述セクション構成）

## レポートセクション

### 1. エグゼクティブサマリー
- 期間内の計測日数・対象 URL 数
- 平均 Performance Score（mobile / desktop、前期比 `--compare` 時）
- CWV 合格率（Good の割合）
- 最も改善が必要なページ TOP 3

### 2. Core Web Vitals ステータス

| 評価 | LCP | CLS | INP* |
|---|---|---|---|
| Good | < 2.5s | < 0.1 | < 200ms |
| Needs Improvement | 2.5-4.0s | 0.1-0.25 | 200-500ms |
| Poor | > 4.0s | > 0.25 | > 500ms |

*INP は history.csv に列が無い（lcp_ms/cls/tbt_ms/fcp_ms/ttfb_ms のみ）。INP/CrUX field は生バッチ参照。
- Lab データ（PSI）の CWV 分布 / ページ別ステータス

### 3. ページ種別比較
`page_type` ごとの平均 score_performance / lcp_ms / cls / tbt_ms / fcp_ms を比較。

### 4. トレンド分析
- 日次の Performance Score 推移（history.csv の date 順）
- 急悪化アラート（前回比 -10 以上）
- デプロイとの相関（git log と照合）

### 5. バジェット違反
`psi-audit:check` の violations と history.csv の `violations_error` / `violations_warning` から、URL × strategy × 指標 × 初検出日 × 継続期間。

### 6. 改善アクション
優先度（P0/P1/P2）付きで、対象ページ・期待効果・実行方法。根拠は閾値超過とページ種別間比較。

## 出力

週次数値は `.claude/state/metrics/psi/`、詳細な施策履歴は
`.claude/skills/analytics/performance-improvement/reference/improvement-log.md` を使う。
未完了の改善だけを `.claude/todo/04_改善バックログ.md` へID・対象ページ・実行手順・budget・完了条件付きで統合し、
レポート全文は保存しない。

書き出し後にパスを報告。CWV 改善ログ・同週 weekly-review は「関連リンク」に相対パスで参照。

## 注意事項

- **データ不足**: history.csv が 1 日分のみならトレンドはスキップ。
- **CrUX field**: history.csv には無い。必要時は生バッチ `psi-batch-<ISO>.json` を読む。
- **季節性 / Cloudflare Edge**: TTFB は Edge キャッシュで概ね良好。MISS 時との差に注意。

## 推奨実行頻度

- **月次**: フルレポート（`--period 28d --compare`）
- **四半期**: 長期トレンド（`--period 3m --compare`）
- **SEO 監査時**: `/seo-audit` の CWV セクションのデータソース

## 参照

- `.claude/skills/analytics/lighthouse-audit/SKILL.md` — PSI 計測（本レポートの入力を作る）
- `.claude/state/metrics/psi/{history.csv,LATEST.md}` — 計測履歴（入力 SSOT）
- `.claude/scripts/psi/psi-threshold-check.mjs` — 閾値違反の取得（`npm run psi-audit:check`）
- `.claude/skills/analytics/performance-improvement/budgets.json` — 閾値設定
- `.claude/skills/analytics/performance-improvement/reference/improvement-log.md` — 改善施策ログ
