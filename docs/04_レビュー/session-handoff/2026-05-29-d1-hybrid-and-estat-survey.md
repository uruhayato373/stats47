---
type: session-handoff
date: 2026-05-29
status: adopted
branch: claude/eager-lovelace-3nxO8
tags: [architecture, d1-hybrid, r2, cloud-first, estat-survey, handoff]
---

# セッションハンドオフ 2026-05-29｜リモート D1 ハイブリッド採用 + e-Stat 候補洗い出し

別 PC / 別セッションで `git pull` した agent がこの続きを把握するための引き継ぎ。

**結論: (1) リモート D1 ハイブリッド設計を採用・準備完了。(2) page-data-batch を本番投入可能形に完成
（観測値の量産がクラウド完結）。(3) Tier1 ADD-city 18件に city 対応追加・検証済。(4)「2009100000 問題」
（e-Stat year フルコード）をプロジェクト全体で根治（SSOT正規化＋lint＋CI＋pre-commit）。
全コミット develop マージ済。残るは Mac/Cloudflare 認証が必要な D1 立ち上げと prod R2 push のみ。**

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
- 「ADD city 141件」は差分法の過大計上で、実際は **123件が既に city 対応済・真に pref-only なのは 18件**だった。
- **Tier1 18件は city 対応を追加済**（§3 参照）。残りの量産（NEW pref 等）は方針決定待ち。
  決定が要る点: ① 着手 Tier ② 産業細分の取捨（総数のみ / 細分も全部）

## 3. page-data-batch 完成 + Tier1 ADD-city 18件（実装・検証済）

- **page-data-batch を本番投入可能形に完成**（従来は bare 出力で push すると本番が壊れた）:
  city 取り込み（`shapeForCity` + pref表→city表[廃置分合]解決）/ areaName(マスタjoin) / rank(年ごと値降順) /
  unit / yearName / 年フィルタ / readAppId は process.env 優先（cloud 互換）。
  → 観測値量産が `metrics/*.ts → page-data-batch → diff-push-r2` でクラウド完結。
- **検証**: abandoned-cultivated-land-area で PREF が本番 values.json と完全一致（47/47）、CITY join 漏れゼロ。
- **Tier1 18件**（事業所数 業種別 13 + 小売/飲食系 5）の entities に "city" 追加。全 18 件 city 生成・PREF 無回帰を検証。
- ⚠️ **rollout 注意**: entities に city を追加済のため、**main マージ前**に各 metric の cities.json を
  生成+push すること（`page-data-batch --metric <key>` → `diff-push-r2 --prefix app/stats`）。未 push で deploy すると city view 404。
- ⚠️ ランキング**ページ**完全公開には item/ai-content/page-cards snapshot（`/sync-snapshots`＝DB）が別途必要 → D1 立ち上げ後。

## 4. 「2009100000 問題」（e-Stat year フルコード）の根治

e-Stat `@time` は 10桁フルコード（`2009100000`）。これを 4桁年に正規化せず config.years/R2 yearCode に
保存していたため、年フィルタ 0件・年セレクタ崩れが**複数回再発**。発生源〜防御まで一気通貫で封鎖:

- **発生源**: `export-from-d1.ts`（config 生成元）が生 year_code を years 化 → `to4DigitYear` で正規化
- **SSOT**: フルコードだった config **60件を 4桁に一括移行**
- **lint**: `validate-metric-years.ts` 新設 + `npm run validate:years --workspace=@stats47/data-configs`
- **自動化**: pre-commit（`pre-commit-checks.sh §6.5`）+ PR CI（`pr-quality-check.yml`「📅 Metric Years Gate」）
- **防御**: `page-data-batch` の `inYearRange` も 4桁正規化
- **規約/agent/skill**: `.claude/rules/estat-api.md`「年の正規化」/ `data-ingester` / `inspect-estat-meta` / `expand-indicators`
- 新 metric は 4桁年が機械的に強制される（lint/CI が落とす）。time→年は `extractYearCode` を使う。

## 重要な前提（別 PC で誤解しないために）

- **ローカル DB `packages/database/.data/stats47.sqlite` は git 管理外**。git merge では同期されない。
- 2026-05-29 時点で **R2 の `database/` prefix は空**（持ち回り未 seed）。Authored 系の真実源は Mac の SQLite のみ。
- このセッションの調査（e-Stat 網羅）・articles seed 生成は **DB 無しで完遂**（e-Stat API 直叩き＋R2 のみ）。

## ブランチと commit

- ブランチ: `claude/eager-lovelace-3nxO8`（origin push 済 + **develop にマージ済**）。マージ後は削除可。
- 全成果は **origin/develop に反映済み**。`git log --oneline origin/develop` で確認可。
- 主要トピック: e-Stat 調査 / D1 ハイブリッド設計・seed準備 / page-data-batch 完成 / Tier1 18件 / year 根治。

## 残タスク（次セッション、要 Mac/Cloudflare 認証 or 承認）

1. **Mac**: `dump-tables-to-seed.ts`（Authored系 dump=Phase0凍結）→ `wrangler d1 create` → migration → seed 投入（runbook: `packages/database/seed/README.md`）
2. **prod R2 push**（要承認）: Tier1 18件の cities.json を `diff-push-r2` で公開（main マージ前）
3. **deploy**: develop → main の PR（CI green 確認 → Cloudflare Pages）
4. **量産継続**: e-Stat 候補から metric 追加（着手 Tier / 産業細分の方針決定後）

---

## 🔁 2026-05-29 後続決定（別セッション `claude/intelligent-turing-CeSpb`）— 設計を「ハイブリッド」に確定

> **このセッションの「リモート D1 ハイブリッド」は破棄されていない。** owner 判断で
> **「データの“形”で SSOT を使い分けるハイブリッド」**に発展・統合された。正典は
> **`docs/01_技術設計/18_データ層ハイブリッド設計.md`**（17 はそこへ superseded、§5 の D1 セットアップ手順は有効）。

確定した判定（pull した agent はこれに従う）:

- **設定（低volume・人手・型/review: テーマのチャート定義等）= git TS が SSOT** → seed/export で D1・R2 反映。
- **関係・運用（横断クエリ・参照整合性・CRUD: page_components / theme_metrics / sns_posts / affiliate_ads / categories/themes）= リモート D1 が SSOT** → exporter で R2。
- **配信 = R2 JSON（app は R2 のみ読む、不変）**。**集計（area_profiles/相関）= D1 で JOIN → R2**（or エフェメラル）。
- **リモート D1 の作り直し・CRUD・seed・export・集計は【ローカル(Mac)】で実施**（account_id/wrangler 認証が要る）。
  **クラウド agent は git TS と R2(S3直接) のみで作業**し、D1 作業はローカルに委譲（詰まったら R2 直接 fallback）。

この決定で更新済:
- 新正典 `18_データ層ハイブリッド設計.md`、`17` を superseded、`CLAUDE.md` /
  `.claude/rules/{data-sqlite-ssot,data-storage,branch-workflow,local-environment}.md` / SessionStart hook を整合。
- page_components 標準フロー: `theme-page-component-additions.ts`(git TS) →
  `seed-theme-page-components.ts`(D1, ローカル) → `export-page-components-snapshot.ts`(R2)。
  クラウド fallback = `sync-theme-additions-to-r2.ts`（R2 直接・冪等。次回ローカル seed/export で D1 と一致）。

→ 上記「残タスク 1（D1 立ち上げ）」は**引き続き有効**（ローカルで実施）。設計は 18 を唯一の正典とすること。
