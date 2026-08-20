---
name: lighthouse-audit
description: PageSpeed Insights API で stats47.jp の CWV を計測し .Codex/state/metrics/psi に蓄積する。Use when user says "Lighthouse実行", "パフォーマンス測定", "CWV計測", "PSI計測". mobile/desktop 一括計測+閾値チェック.
disable-model-invocation: true
argument-hint: "[--strategy mobile|desktop] [--file urls.txt]"
allowed-tools: Read, Bash, Grep
primary_agent: performance-auditor
co_agents: [gsc-analyst]
---

# /lighthouse-audit — CWV 計測（PSI に統合済）

stats47.jp の各ページの Core Web Vitals を計測し、`.Codex/state/metrics/psi/` に蓄積する。
閾値は `.Codex/skills/analytics/performance-improvement/budgets.json` を参照。

> **2026-06-21 PSI 統合**。旧版は Lighthouse CLI（`packages/database/scripts/lighthouse-check.ts`）で計測し
> `performance-improvement/snapshots/*/metrics.csv` に蓄積していたが、当該スクリプトは完全DBレス移行で削除され、
> その CSV を書く writer が無くなっていた。CWV 監視は **PSI 日次ワークフロー**（`.Codex/scripts/psi/*` +
> `.Codex/state/metrics/psi/` + `psi-audit-daily.yml`）に一本化済（Lighthouse Lab data は廃止）。本スキルは
> その PSI ツールを手動実行する薄いラッパー。計測対象 URL は `.Codex/config/psi-urls.txt`（19 URL × mobile/desktop）。

## 計測対象

`.Codex/config/psi-urls.txt` に列挙された URL（homepage / theme / ranking / area / blog の代表ページ）。
対象を変えたいときは同ファイルを編集するか `--file <urls.txt>` で別リストを渡す。

## 実行（PSI 日次と同じ 3 ステップ）

```bash
# 1) 計測 → .Codex/state/metrics/psi/psi-batch-<ISO>.json
npm run fetch-psi-audit                 # = node .Codex/scripts/psi/fetch-psi-audit.mjs
#    オプション: --strategy mobile / --strategy desktop / --file custom-urls.txt
#    PSI_API_KEY があれば quota が上がる（.env.local / CI secret）。無くても動く（レート制限注意）

# 2) digest 更新 → history.csv (日次トレンド append) + LATEST.md (前日比矢印 + 閾値違反強調)
npm run psi-audit:digest                # = node .Codex/scripts/psi/psi-update-digest.mjs

# 3) 閾値チェック → budgets.json と比較し violations（error 違反で exit 1）
npm run psi-audit:check                 # = node .Codex/scripts/psi/psi-threshold-check.mjs
#    レポート出力: npm run psi-audit:check -- --output /tmp/psi-report.md
```

CI（`.github/workflows/psi-audit-daily.yml`、JST 02:00）は上記を fetch → digest → check の順で自動実行し、
閾値違反時に `[PSI Alert]`（`psi-alert,auto-generated`）Issue を起票する。手動計測は本スキルで同じ流れを回す。

## バジェット閾値（`budgets.json`）

| 指標 | Good | Needs Improvement | Poor |
|---|---|---|---|
| LCP | < 2500ms | 2500-4000ms | > 4000ms |
| CLS | < 0.1 | 0.1-0.25 | > 0.25 |
| INP | < 200ms | 200-500ms | > 500ms |
| FCP | < 1800ms | 1800-3000ms | > 3000ms |
| TBT | < 200ms | 200-600ms | > 600ms |
| Performance Score | >= 90 | 50-89 | < 50 |

実際に適用される閾値は `budgets.json` が SSOT（本表は目安）。

## 出力の見方

- **最新サマリ（人間向け）**: `.Codex/state/metrics/psi/LATEST.md`（前日比矢印 + 閾値違反強調）
- **日次履歴（トレンド分析用）**: `.Codex/state/metrics/psi/history.csv`（`date,url,strategy,page_type,score_performance,lcp_ms,cls,tbt_ms,fcp_ms,ttfb_ms,violations_error,violations_warning`）
- **生バッチ**: `.Codex/state/metrics/psi/psi-batch-<ISO>.json`
- トレンド・期間比較・改善提案のレポート化は `/performance-report`。

## 注意事項

- **Field data（実ユーザー）**: PSI は CrUX（実ユーザー p75）も返す。低トラフィックページでは null。
- **計測のばらつき**: スコアは計測ごとに揺れる。単発値でなくトレンド（history.csv）で判断する。
- **Cloudflare Pages**: Edge キャッシュにより TTFB は概ね良好。MISS 時との差に注意。
- **ネットワーク**: PSI API は企業プロキシ等でブロックされることがある。その場合は https://pagespeed.web.dev/ を手動利用。

## 推奨実行頻度

- **日次**: CI（`psi-audit-daily.yml`）が自動実行。手動は不要。
- **デプロイ後**: `npm run fetch-psi-audit -- --strategy mobile` でリグレッション確認。
- **月次**: `/performance-report` でトレンド分析。

## 参照

- `.Codex/scripts/psi/{fetch-psi-audit,psi-update-digest,psi-threshold-check}.mjs` — PSI ツール本体
- `.Codex/config/psi-urls.txt` — 計測対象 URL リスト
- `.Codex/skills/analytics/performance-improvement/budgets.json` — バジェット閾値（SSOT）
- `.Codex/state/metrics/psi/{LATEST.md,history.csv}` — 蓄積データ
- `.Codex/skills/analytics/performance-report/SKILL.md` — トレンド総合レポート
- `.github/workflows/psi-audit-daily.yml` — 日次自動計測
- PageSpeed Insights API: https://developers.google.com/speed/docs/insights/v5/get-started
