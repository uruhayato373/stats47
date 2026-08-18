---
name: expand-rankings
description: |
  SSDS 由来のランキングを「計測ゲート付き需要ファースト」で継続拡充するループ。
  build-expansion-queue で候補をスコア → 次バッチ生成 (gen-ssds-configs) → 投入・公開を委譲 → GSC 計測 →
  流入が付いたカテゴリの pending を優先、で回す。旧 expand-indicators (Phase 7 で deprecated) の再構築。
  Use when user says "ランキング拡充", "指標追加", "/expand-rankings".
argument-hint: "[--next <N>] [--measure] [--week YYYY-Www]  (無引数=キュー最新化+状態表示)"
primary_agent: ranking-expander
---

# expand-rankings — ランキング拡充ループ (計測ゲート付き)

継続的にランキングを増やし、**GSC 実測で「流入が付いた系統だけ」深掘り**してアクセスアップに繋げる 1 コマンド。
ブログ是正ループ (`/brushup-blog` + remediation-queue) と同型の「状態SSOT + スキル + エージェント + 週次計測」。

## 設計思想 (最重要)

実測で判明: **e-Stat 全展開 = 17万 metric は不可能・大半が低需要** (既存 2,141 本の 41% がゼロ表示、
クリックは上位 50 本に 49% 集中)。認知度の高い指標はほぼ既存済。だから **闇雲に増やさない**。
**公開 → GSC 実測 → 流入が付いたカテゴリのみ次バッチで深掘り**、を強制する (thin-content-at-scale 回避)。

## 真実源

- 状態SSOT: `.Codex/state/estat/expansion-queue.json` (candidate/generated/published/measured + categoryTraffic)
- 候補プール: `.Codex/state/estat/ssds-candidates.json` (enumerate-ssds-indicators.mjs → CI で再生成)

## 使い方

```bash
# キュー最新化 + 状態表示 (候補をスコア・生成/公開状態を検出・upsert)
node .Codex/scripts/estat/build-expansion-queue.mjs

# 次に生成すべき pending 上位 N (score 降順・細分除外。計測後は流入カテゴリが上位)
node .Codex/scripts/estat/build-expansion-queue.mjs --next 30

# 公開バッチの GSC 流入を計測しキューに反映 (公開 4 週後)
node .Codex/scripts/estat/measure-expansion-impact.mjs [--week YYYY-Www]
```

## ループ手順 (ranking-expander エージェントが実行)

1. **キュー最新化** — `build-expansion-queue.mjs`。
2. **状態確認** — 未公開の generated (今は ~46 本) があるなら **まず公開を優先** (下記 3-4)。
   **公開・計測が済むまで新規生成しない** (初回は特に)。
3. **投入** — `data-ingester` に委譲 (page-data-batch → R2)。
4. **公開** — `ranking-publisher` に委譲 (KNOWN/SITEMAP 再生成 → deploy → 本番 200 実測)。デプロイは溜めて 1 回。
5. **計測** — 公開 4 週後、`gsc-analyst` → `measure-expansion-impact.mjs` → build 再実行。
6. **次バッチ** — `--next N` で選定 → spec 作成 → `gen-ssds-configs.mjs` → validate → `--mark-generated`。
   **流入が付いたカテゴリの pending が上位に来る** (計測ゲート)。ゼロ表示カテゴリは止める。

## 段階的検証

- 生成後: `npm run build:registry` + `npm run validate:config` + `npm run validate:years` (@stats47/data-configs)。error 0 必須。
- key: 英語 kebab (SEO)。GONE 衝突・dup-title (lint は括弧内全除去で正規化) は gen-ssds-configs が skip。

## 関連

- エージェント: `.Codex/agents/ranking-expander.md` (キュレーション判断のオーナー)
- スクリプト: `.Codex/scripts/estat/{build-expansion-queue,gen-ssds-configs,measure-expansion-impact,enumerate-ssds-indicators,discover-prefecture-candidates,fetch-estat-meta}.mjs`
- 知見/状態: memory `project_estat_expansion_pipeline_2026_07` / `.Codex/state/estat/expansion-queue.json`
- 正典: `.Codex/rules/metric-config-standards.md` / `.Codex/rules/estat-api.md` / 現在計画は `.Codex/todo/weekly.md`
- 対比: `.Codex/rules/blog-remediation-loop.md` (同型の型)
