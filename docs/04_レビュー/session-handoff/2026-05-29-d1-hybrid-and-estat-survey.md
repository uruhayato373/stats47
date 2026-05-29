---
type: session-handoff
date: 2026-05-29
status: adopted
branch: claude/eager-lovelace-3nxO8
tags: [architecture, d1-hybrid, r2, cloud-first, estat-survey, handoff]
---

# セッションハンドオフ 2026-05-29｜リモート D1 ハイブリッド採用 + e-Stat 候補洗い出し

別 PC / 別セッションで `git pull` した agent がこの続きを把握するための引き継ぎ。

**結論: 設計は「リモート D1 ハイブリッド」で決定。クラウド完結分の準備ツールは実装・検証済。
残るは Mac/Cloudflare 認証が必要な D1 立ち上げのみ（runbook 化済）。e-Stat 量産は方針決定待ち。**

## 1. リモート D1 ハイブリッド（採用・準備完了）

本文=git/R2・運用メタ=リモート D1・観測値=R2・集計=R2 からエフェメラル計算。

- 設計本体: `docs/01_技術設計/17_リモートD1ハイブリッド設計.md`（代替案の却下理由も記載）
- runbook: `packages/database/seed/README.md`（D1 再作成〜seed 投入の全手順）
- **重要な発見**: `articles` は `article.md` frontmatter から全列再構成可能＝**Reference/Derived**（D1 SSOT 不要、R2 が真実源）。
  真に Authored（D1 行き）なのは sns_posts / affiliate_ads / theme_metrics / page_components / categories / themes。
- 実装ツール（`packages/database/scripts/`）:
  - `extract-articles-seed-from-r2.ts` — R2 → `seed/articles.json`（**クラウド可**、196 件生成・検証済）
  - `dump-tables-to-seed.ts` — Authored 系を Mac SQLite → `seed/<table>.json`（**Mac 必須**、Phase 0 凍結兼用）
  - `seed-to-d1-sql.ts` — seed → `seed/d1-seed.sql`（再生成可能なので gitignore）
- **検証済（クラウド）**: 抽出 196 件 → SQL 生成 → in-memory SQLite ロード（196 行・published=117・tags 有効 JSON）
- **残（要 Mac/Cloudflare 認証）**: Authored 系ダンプ → `wrangler d1 create` → migration 適用 → seed 投入（runbook 参照）

### 次にやること（Mac で）
```bash
npx tsx packages/database/scripts/dump-tables-to-seed.ts   # Authored系dump→commit(凍結)
wrangler d1 create stats47                                  # D1再作成→wrangler.toml の database_id 更新
wrangler d1 migrations apply stats47 --remote               # schema
npx tsx packages/database/scripts/seed-to-d1-sql.ts         # 全seed→SQL
wrangler d1 execute stats47 --remote --file=packages/database/seed/d1-seed.sql
```

## 2. e-Stat 網羅調査（完了・量産は方針決定待ち）

SSDS 全 59 テーブル 7,065 指標と既存 metrics 2,209 件を突き合わせ、**未 metric 化候補 4,232 件**を洗い出し。

- 成果物: `docs/02_実装計画/estat-ranking-candidates/`（README / candidates-all.csv / launch-batch-120.csv）
- 最優先 Tier 1 = **ADD city（141 件）**: 既存都道府県ランキングの市区町村版（需要実証済・データ存在 spot-check 済）
- **次フェーズ（metrics/*.ts 生成）は未着手**。「リストを見て方針決定してから」の指示に従い保留。
  決定が要る点: ① 着手 Tier（Tier1 / launch batch 120）② 産業細分の取捨（総数のみ / 細分も全部）

## 重要な前提（別 PC で誤解しないために）

- **ローカル DB `packages/database/.data/stats47.sqlite` は git 管理外**。git merge では同期されない。
- 2026-05-29 時点で **R2 の `database/` prefix は空**（持ち回り未 seed）。Authored 系の真実源は Mac の SQLite のみ。
- このセッションの調査（e-Stat 網羅）・articles seed 生成は **DB 無しで完遂**（e-Stat API 直叩き＋R2 のみ）。

## ブランチと commit

- ブランチ: `claude/eager-lovelace-3nxO8`（origin に push 済）
- 主要 commit は `git log --oneline` で確認（e-Stat 調査 / D1 ハイブリッド準備 / 本整理）
