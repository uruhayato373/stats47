---
type: session-handoff
date: 2026-05-29
status: proposal-pending-decision
branch: claude/eager-lovelace-3nxO8
tags: [architecture, db-less, sqlite, r2, cloud-first, estat-survey, handoff]
---

# セッションハンドオフ 2026-05-29｜DB レス・アーキテクチャ提案 + e-Stat 候補洗い出し

別 PC / 別セッションで `git pull` した agent がこの続きを把握するための引き継ぎ。

**結論: 2 件とも「設計・調査ドキュメント」を commit + push 済。コード変更・データ投入は未実施（意図的）。
次アクションは (A) DB レス設計の方針決定、(B) e-Stat 候補の量産着手 のどちらか、ユーザー判断待ち。**

## このセッションでやったこと

### 1. e-Stat 網羅調査（完了・成果物 commit 済）
社会・人口統計体系 (SSDS) 全 59 テーブルの指標 7,065 スロットと既存 metrics 2,209 件を突き合わせ、
**未 metric 化のランキング候補 4,232 件（非 vintage）**を洗い出した。

- 成果物: `docs/02_実装計画/estat-ranking-candidates/`
  - `README.md` — 調査方法・サマリ・優先順位・Top50
  - `candidates-all.csv` — 全 4,332 件（列フラグ付き）
  - `launch-batch-120.csv` — 推奨 launch batch 120 件
- 最優先 Tier 1 = **ADD city（141 件）**: 既存の都道府県ランキングに市区町村版を足すだけ（需要実証済・データ存在 spot-check 済）
- **次フェーズ（metrics/*.ts 生成 → 投入）は未着手**。リスト承認待ち。

### 2. DB レス・アーキテクチャ提案（完了・ドキュメント commit 済、実装は未着手）
クラウド完結を阻む「git 管理外・R2 持ち回りの SQLite」を使い捨て化する設計。

- 成果物: `docs/01_技術設計/17_DBレス・アーキテクチャ移行設計.md`
- 実測で判明した核心:
  - **本番 `apps/web` は DB を一切クエリしない**（R2 のみ）
  - DB の唯一の仕事 = ビルド時 13 exporter＋相関計算の入力
  - **真のネックは集計でなく Authored 系**（page_components / sns_posts / affiliate_ads /
    theme_metrics）の真実源が DB 内だけにあること
- 方針: 全テーブルを **Authored(→git) / Reference(→再生成) / Derived(→R2計算)** に仕分け、
  集計時だけ :memory: SQLite を一時生成 → 破棄。Phase 0〜4 の移行計画あり。

### 3. リモート D1 ハイブリッド — 準備一式を実装（クラウド完結分は完了）
設計の採用案として「本文=git/R2・運用メタ=D1・観測値=R2」のハイブリッドを選定。
クラウド/Mac/認証なしで作れる準備を実装し、パイプラインを in-session 検証した。

- **重要な発見**: `articles` は `article.md` frontmatter から全列再構成可能＝**Derived**（D1 の SSOT 不要、R2 が真実源）。
  真に Authored なのは sns_posts / page_components / affiliate_ads / theme_metrics / categories / themes。
- 実装したツール（`packages/database/scripts/`）:
  - `extract-articles-seed-from-r2.ts` — R2 → `seed/articles.json`（**クラウド可**、196 件生成・検証済）
  - `dump-tables-to-seed.ts` — Authored 系を Mac SQLite → `seed/<table>.json`（**Mac 必須**、Phase 0 凍結兼用）
  - `seed-to-d1-sql.ts` — seed → `seed/d1-seed.sql`（D1 投入 SQL、再生成可能なので gitignore）
- runbook: `packages/database/seed/README.md`（D1 再作成〜seed 投入の全手順）
- **検証済（クラウド）**: 抽出 196 件 → SQL 生成 → in-memory SQLite ロード（196 行・published=117・tags 有効 JSON）
- **残（要 Mac/Cloudflare 認証）**: Authored 系ダンプ・`wrangler d1 create`・migration 適用・seed 投入（runbook 参照）

## ブランチと commit

- ブランチ: `claude/eager-lovelace-3nxO8`（origin に push 済、develop と同期）
- 関連 commit（このハンドオフ commit を含む。`git log --oneline` で確認）

## 次にやること（ユーザー判断待ち）

### 未決（要判断）
1. **DB の扱い**: SQLite 完全廃止 / 使い捨てツールとして残す（提案の推奨は後者）
2. **次アクションの選択**:
   - (A) DB レス設計に着手 → まず **Phase 0（凍結ダンプ）**。ただし DB 本体が Mac 側にしか無いため、
     ダンプ script は cloud で用意 → **Mac で実行**してもらう形になる
   - (B) e-Stat 量産に着手 → Tier 1（ADD city 141件）から `metrics/*.ts` 生成
   - 注: (B) の投入には DB が要るので、暫定運用（§下記）で進めるなら Mac で `db:push` が前提

### 暫定運用（移行完了まで有効）
現行の R2 持ち回りで量産は回る。**判断ルール: DB 内の手調整データを書くのはローカル 1 箇所に固定、
クラウドは読むだけ**。手順は Mac で `npm run db:push --workspace=packages/r2-storage` → cloud で `npm run db:pull`。
詳細: `docs/01_技術設計/17_DBレス・アーキテクチャ移行設計.md` §8。

## 重要な前提（別 PC で誤解しないために）

- **ローカル DB `packages/database/.data/stats47.sqlite` は git 管理外**。git merge では絶対に同期されない。
  R2 経由（`db:push`/`db:pull`）が唯一の持ち回り経路。
- 2026-05-29 時点で **R2 の `database/` prefix は空**（初回 seed が未実施）。クラウドからは DB を取得できない状態。
- このセッションの調査（e-Stat 網羅）は **DB 無しで完遂**した（e-Stat API 直叩き＋TS registry 読み）。
  → カタログ検索用途すら DB 非依存で代替可能、という設計上の根拠データでもある。
