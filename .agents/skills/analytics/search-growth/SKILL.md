---
name: search-growth
description: 検索成長の統合入口。GSC / URL Inspection / Sitemaps / GA4 / CrUX / PSI / Lighthouse / Cloudflare / HTTP / static audit を正規化 Observation に統合し、決定的 candidate engine で改善候補を作る。Use when user says "検索改善候補", "SEO の次にやること", "search growth", "GSC 以外も見て", "検索露出とインデックスと性能をまとめて". CLI 1 入口 + read-only MCP。
primary_agent: gsc-analyst
---

# search-growth — 検索成長統合基盤

GSC だけを見る運用をやめ、**検索露出・クリック・インデックス・流入後行動・実ユーザー性能・サーバー状態を
一つの証拠チェーン**で診断する。基盤・安全境界は`reference/platform-contract.md`、期間・承認・
14/28/56日判定は`reference/weekly-cycle-contract.md`を正典とする。進捗は`.Codex/todo/`だけで管理する。

```
既存 snapshot (GSC/GA4/PSI/coverage/inspection/cloudflare) + live collector (sitemap/crux/http/lighthouse)
   → 正規化 Observation (freshness / provenance / redaction)
   → 決定的 candidate engine (13 type・sample gate・dedupe・past effect 抑制)
   → 人間承認 → 14/28/56 日で効果判定 (evidence-based-judgment)
```

## CLI (正典・MCP が無くても成立)

```bash
npm run search-growth:collect       # source 別に raw を取得/再利用 (success/partial/failed/skipped を隔離報告)
npm run search-growth:normalize     # 既存 snapshot → 正規化 Observation (latest.json / health.json)
npm run search-growth:analyze       # Observation → 決定的 candidate (candidates.json)
npm run search-growth:report -- --limit 15   # 週次 digest (blocker→verified→opp→mobile→CWV→coverage→freshness→判定対象)
npm run search-growth:status        # source freshness + candidate 件数
npm run search-growth:next -- --limit 20      # 次にやる候補 (score 降順・決定的)
npm run search-growth:triage        # 週次レビュー用の最大3件 (technical/content/measurement 各1)
npm run search-growth:approve -- --candidate <id>   # 人間承認 (pending→approved。週2件・WIP≤5 を機械強制)
npm run search-growth:dismiss -- --candidate <id> --reason "..."   # 却下 (理由を記録)
npm run search-growth:measure -- --candidate <id>   # 候補の evidence + 14/28/56 日判定スケジュール
npm run search-growth:all           # collect→normalize→analyze→report を順に
npm run search-growth:test          # 全テスト (compliance / foundation / candidate / pipeline / mcp / triage)
```

週次サイクル（`reference/weekly-cycle-contract.md`）: fetch-metrics-weekly → search-growth-weekly
(candidate 再構築・承認 lifecycle は
carry over) → weekly-review が `triage` の最大3件を審査 → 人間が `approve` → weekly-plan が
`status=approved` を最大1〜2件だけ採用 → `measure` の 14/28/56 日で効果判定。
未承認候補を改善バックログへ自動追加しない。承認は repo state (candidates.json) のみ書く。

`--json` で機械可読出力。`collect` は committed snapshot を再利用 (secret 不要)。`collect --live` は:
- **http (production HTTP probe・Googlebot UA) と sitemap (sitemap.xml 内容)** は credential 不要の
  read-only GET なので実行され **live 実測**する (blocker 候補 + control を probe。sitemap.xml から inSitemap 判定)。
- **crux (CrUX/History)・GSC Sitemaps API メタ・lighthouse** は creds/ツールが要り、無ければ `skipped` =
  **live 未検証** と明示する (既存 fetcher を subprocess 実行するのは creds がある source のみ)。
- partial/missing を成功・0 件にしない。live snapshot は `.Codex/state/search-growth/live/` (gitignore・ephemeral)。

## MCP (read-only・任意)

`.mcp.json` の `seo-observability` (stdio・zero-dep)。CLI と同じ pure service (`lib/service.mjs`) を呼ぶ薄い
adapter。tools (全て read-only): `search_growth_status` / `search_growth_candidates` / `search_growth_measure` /
`gsc_performance` / `gsc_inspect_urls` / `gsc_sitemaps` / `ga4_organic_quality` / `crux_web_vitals` /
`psi_diagnostics` / `cloudflare_search_health` / `seo_route_contract`。filter/limit/cursor 付き・stats47.jp
allowlist・secret を返さない。**deploy / push / PR / sitemap submit-delete / GA4・Cloudflare 変更 / production
write は tool として存在しない**。詳細は`reference/platform-contract.md`の「CLI・MCPの境界」。

## candidate type

`ctr-opportunity` / `striking-distance` / `query-gap` / `intent-mismatch` / `mobile-gap` /
`indexability-conflict` / `crawled-not-indexed` / `soft-404-risk` / `canonical-drift` / `cwv-opportunity` /
`lab-regression` / `server-risk` / `measurement-gap`。

- impressions が最低標本未満なら CTR 判定をしない / 単一 API だけで高 confidence にしない。
- **missing を 0 に変換しない** (需要ありでデータ欠損 → `measurement-gap` で明示)。
- 同一 URL・原因を dedupe / past effect none・adverse で confidence 抑制 (`past-effects.json`) / 決定的順序。
- 各 candidate は evidence refs・baseline period・freshness・limitations・expected metric・suggested
  verification・external action flag を持つ。詳細は`reference/platform-contract.md`の「Candidate契約」。

## 効果判定 (evidence-based-judgment 必読)

candidate を実装 → 14/28/56 日で `measure` の suggestedVerification に従い再計測。**自動 issue は PSI/Cloudflare
閾値 alert のみ**。一般候補は人間承認後に `.Codex/todo/improvements.md` へ追加する。CTR 候補は過去の
title rewrite の effect/none を踏まえ confidence を抑制済 — CTR だけを根拠に大量 rewrite しない。

## 専門 runbook (統合入口から参照)

本 skill が入口。各 source の深掘り運用は既存 skill を runbook として残す:

- `gsc-improvement` — GSC 週次計測・effect 判定の詳細
- `gsc-coverage-remediation` — coverage 是正 (observe-after-fix)
- `ga4-improvement` — GA4 計測
- `performance-improvement` — PSI / Lighthouse / CWV
- `cloudflare-cost-improvement` — Cloudflare (usage は cost、SEO 診断は本基盤)
- `seo-audit` — 横断 SEO 監査

## Indexing API は使わない

Google Indexing API は公式に JobPosting / BroadcastEvent VideoObject 専用。通常ページには使わない
(2026-07-23 に `indexing-api-submit` / `gsc-auto-resubmit-daily.yml` を退役)。再クロールは
observe-after-fix (sitemap/内部リンク/canonical/content 修正 + URL Inspection 観測) で行う。
詳細は`reference/platform-contract.md`の「Indexing API準拠」。

## 実装

- pipeline: `.Codex/scripts/search-growth/{collect,normalize,analyze,report,cli}.mjs`
- lib: `.Codex/scripts/search-growth/lib/{contracts,freshness,redaction,join-url,scoring,sources,service,state}.mjs`
- MCP: `.Codex/scripts/search-growth/mcp/server.mjs`
- state: `.Codex/state/search-growth/{latest,candidates,health,past-effects}.json` + `manifests/`
- CI: `.github/workflows/search-growth-weekly.yml` (weekly candidate rebuild・committed snapshot 再利用)
- test: `.Codex/scripts/search-growth/__tests__/*.test.mjs`

## 参照

- `reference/platform-contract.md` — source、Observation、candidate、MCP、安全・準拠境界
- `reference/weekly-cycle-contract.md` — finalized7d / rolling28d、triage、WIP、14/28/56日判定
- `.Codex/todo/backlog.md` — 実装・live検証の残作業
- `.Codex/todo/improvements.md` — 採択施策と効果判定
