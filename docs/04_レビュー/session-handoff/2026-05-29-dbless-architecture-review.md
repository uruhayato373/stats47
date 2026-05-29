---
type: session-handoff
date: 2026-05-29
status: investigation-only
branch: claude/dbless-architecture-review-jMp8d
tags: [dbless, architecture-review, page-components, file-ssot, middleware-410, stale-script, ranking-mass-production]
---

# セッションハンドオフ 2026-05-29｜DB レス化アーキテクチャ調査

別 PC / 次エージェントがこの続きを把握するための引き継ぎ。
**本セッションは調査のみ (コード変更なし)。結論と、見つかった要対応 3 件 + 推奨着手順を残す。**

## このセッションでやったこと

「プロジェクトを DB レスにすべきか」を起点に、データ追加 / チャート拡充 / ランキング量産の観点でサイト全体を実測調査した。**結論は『本番は既に DB レス。残るビルド時 SQLite は SSOT をゼロにした純キャッシュへ格下げすべき』**。詳細は下記。

## 調査で確定した事実 (実測ベース)

### 1. 本番ランタイムは既に 100% DB レス
- `apps/web/src` 内の実行時 `getDrizzle`/`getDb` 呼び出し = **0 件**
- R2 reader 使用 = 54 ファイル / DB import = 型定義 (`/schema` の `ArticleRow` 等) 5 ファイルのみ
- Phase 1-6 で D1 15GB → 336MB に縮小、観測値は `app/stats/<metric>/*.json` へ移行済

### 2. 「ビルド時 SQLite」の正体 = 再生成可能な cache + 集計エンジン (SSOT ではない)
| 役割 | 中身 | SSOT は DB 外にあるか |
|---|---|---|
| メタ cache | `metrics`, `sources` | ✅ TS-config (`packages/data-configs`) |
| マスタ/分類 cache | `prefectures`/`cities`, `themes`/`theme_metrics` | ✅ TS file (`indicator-sets/*.ts`) |
| 集計エンジン | `area_profiles`, `estat_catalog` 検索 | ✅ R2 + e-Stat から再生成可能 |
| 運用エンティティ | `articles`, `page_components`, `affiliate_ads`, `sns_posts` | △ articles=R2 だが他は **DB のみ** |

### 3. ランキング / ブログ / タグの SSOT は既に file/R2 (←拡充に強い)
- **ランキング一覧**: `ranking_items` テーブルは**存在しない**。`1 metric = 1 ランキング項目`で、`listRankingItems` は `metrics` テーブルを `parseMetricAsRankingItem` でマップしているだけ。SSOT = **TS-config** (`data-configs/metrics/<key>.ts`)
- **ブログ一覧**: `articles` は cache。SSOT = **R2 `app/blog/<slug>/article.md`** (frontmatter + 本文)、`/sync-articles` で DB へ
- **タグ**: 独立 `tags` テーブルは **PR #214 (2026-05-05) で廃止済**。ランキングタグ = `metrics.tags` (←TS-config `additionalCategories`) / ブログタグ = `articles.tags` (←article.md frontmatter)。タグマスタは持たず、両者の和集合から導出

### 4. ランキング追加時の静的生成フロー (2 層)
```
data-configs/metrics/<key>.ts 追加
  → /sync-metrics-cache --apply      (DB metrics cache)
  → /page-data-batch --metric <key>  (e-Stat → R2 app/stats/<key>/values.json)
  → /sync-snapshots                  (R2 app/ranking/<key>/{item,values,ai-content,page-cards}.json)
  → /push-r2
```
- ページ HTML は `generateStaticParams` が `readActiveRankingKeysFromR2("prefecture")` で R2 から keys を読んで SSG (DB 不要)、24h ISR

## 要対応 3 件 (このセッションで発見、未着手)

### A. 【最優先・量産ブロッカー】 known-keys 生成スクリプトが壊れている
新規ランキングを追加しても、middleware が allowlist 外の key を **410 Gone** で弾く:
```typescript
// apps/web/src/middleware.ts  checkContentTypePolicy()
if (UrlPolicy.ranking.isGone(key) || !UrlPolicy.ranking.isKnown(key)) return gone();
// isKnown = KNOWN_RANKING_KEYS.has(key)  ← apps/web/src/config/known-ranking-keys.ts (git commit 済, 最終 2026-05-22 / 1,969 件)
```
その allowlist の再生成スクリプトが **dropped table を参照していて失敗する**:
- `apps/web/scripts/generate-known-ranking-keys.ts`
  → `EXISTS (SELECT 1 FROM stats_prefecture ...)` ← `stats_prefecture` は Phase 6 で DROP 済 (no such table)
- `apps/web/scripts/generate-known-tag-keys.ts`
  → `SELECT tag_key FROM tags` ← `tags` テーブルは PR #214 で廃止済
- 両者とも廃止スキル `/register-ranking` `/pull-remote-d1` を案内 (doc も stale)

**修正方針**: `stats_prefecture` EXISTS / `tags` テーブルのかわりに、`generateStaticParams` と同じ **R2 由来 (`readActiveRankingKeysFromR2`)** か **TS-config の `entities` 由来** で key を集める。タグは `metrics.tags` + `articles.tags` の和集合から導出。
**これが直らないと「ランキング追加 → 404/410」で量産が詰まる。**

### B. 【チャート拡充の前提】 page_components を file-SSOT 化
- `page_components` (411 行) は `populate-component-data` で **git-ignored な SQLite に直接 SQL INSERT** して著作。R2 export はされるが派生物
- 問題: git diff に出ない / PR レビュー不可 / CI・clone・クラウドで再現不可 / git blame で出どころ追えない
- チャートを増やすほど負債が行数比例で増える (git log: e-Stat 網羅調査で未metric化候補 4,232 件 ＝ 大量追加が既定路線)
- **修正方針**: `metrics` / `themes` が既に持つ file-SSOT パターン (`seed-themes.ts` が雛形) に揃える。`data-configs` 配下の TS/JSON を SSOT にし、sync スクリプトで DB→R2。`affiliate_ads` (24 行) も同様
- これで「チャート追加 = TS file 1 個 + PR レビュー → sync → R2」となり、ランキング追加と同じ快適フローに

### C. stale ドキュメント
- `.claude/skills/db/populate-component-data/SKILL.md`: 旧 miniflare ハッシュパス (`baffe56c…sqlite`) + 「リモート D1 / Tier B テーブル」参照。現行 `data-sqlite-ssot.md` (リモート D1 解約済・固定パス) と矛盾

## 推奨着手順
1. **A** (known-keys スクリプト修復) ← 量産ブロッカー、小さい・効果大。最優先
2. **B** (page_components file-SSOT 化) ← チャート拡充の前提整備
3. **C** (stale doc 修正) ← B と同時に
4. (任意) Phase 7-A: dead な `stats_*`/`correlations` schema 6 ファイル削除 (`docs/01_技術設計/14_Phase6_deprecation_log.md` 参照)

## 総括 (意見)
「DB レス化」は方向として正しく、プロジェクトは既に 8 割そこへ来ている。やるべきは "SQLite を物理削除" ではなく **"DB が SSOT を 1 つも持たない状態"** を作ること。ランキング・ブログ・タグは既に file/R2-SSOT で量産に強い。残るは page_components (チャート) と affiliate_ads の file 化、そして known-keys スクリプトの修復のみ。集計エンジン (area_profiles 等) としての SQLite は、データが 4,000+ metric に育つなら再生成可能な開発用キャッシュとして残してよい。

## 関連
- データ管理アーキテクチャ: `.claude/rules/data-sqlite-ssot.md`
- Phase 6 deprecation log + Phase 7 残課題: `docs/01_技術設計/14_Phase6_deprecation_log.md`
- 3 タクソノミー役割分担: `docs/01_技術設計/16_タクソノミー役割分担.md`
- R2 namespace 設計: `.claude/rules/r2-storage-design.md`
