# seed/ — リモート D1 ハイブリッド seed と runbook（歴史記録）

> **⚠️ superseded**: リモート D1 ハイブリッド案は却下され**完全DBレス**が正典
> （`docs/01_技術設計/19_完全DBレス設計.md`、リモート D1 は廃止済み）。本 runbook は歴史記録として残置。

リモート D1 ハイブリッド構成（本文=git/R2・運用メタ=D1・観測値=R2）の **seed データと投入手順**。
設計の背景: `docs/01_技術設計/archive/17_リモートD1ハイブリッド設計.md`

## このディレクトリの中身

| ファイル | 生成元 | 説明 |
|---|---|---|
| `articles.json` | `extract-articles-seed-from-r2.ts`（**クラウド可**） | R2 の `article.md` frontmatter から再構成した 196 記事。**articles は Derived**（R2 が真実源）なので Mac 不要 |
| `<table>.json` | `dump-tables-to-seed.ts`（**Mac 必須**） | Authored 系（sns_posts / page_components / affiliate_ads / theme_metrics / categories / themes）を Mac の SQLite からダンプ |
| `d1-seed.sql` | `seed-to-d1-sql.ts` | 上記 seed を D1 投入用 SQL（`INSERT OR REPLACE`、100 行バッチ）に変換 |
| `ksj-catalog.json` | （既存・別用途） | 国土数値情報カタログ |

## seed の出どころ（重要）

| テーブル | 種別 | seed 生成元 | 環境 |
|---|---|---|---|
| articles | Derived | `extract-articles-seed-from-r2.ts` | **クラウド OK**（R2 のみ） |
| sns_posts / page_components / affiliate_ads / theme_metrics / categories / themes | **Authored** | `dump-tables-to-seed.ts` | **Mac 必須**（DB 内だけに真実源） |
| metrics / masters / estat_catalog / area_profiles | Reference / Derived | （D1 に置かない or 別途再生成） | — |

## Runbook: リモート D1 ハイブリッドを立ち上げる

### 前提
- Cloudflare 認証（`wrangler login` 済 or `CLOUDFLARE_API_TOKEN`）
- R2 env（`.env.local`: `R2_S3_ENDPOINT` / `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY`）

### Step 1 — seed を用意する

```bash
# (a) articles: クラウド/任意環境で R2 から再構成
npm run seed:extract-articles --workspace=packages/database

# (b) Authored 系: Mac (実データを持つ環境) でダンプ
#     ※ Phase 0 凍結バックアップも兼ねる。-- --all で全テーブル凍結も可
npm run seed:dump-tables --workspace=packages/database

# (c) seed → D1 投入 SQL に変換
npm run seed:to-d1-sql --workspace=packages/database
```

### Step 2 — D1 インスタンスを作成（解約済みのため再プロビジョニング）

```bash
wrangler d1 create stats47           # 新しい database_id が払い出される
wrangler d1 list                     # 実在確認
# → apps/web/wrangler.toml の [[d1_databases]] database_id を新 ID に更新
```

### Step 3 — スキーマ（migration）を適用

```bash
# drizzle migration (packages/database/drizzle/*.sql) を D1 に適用
wrangler d1 migrations apply stats47 --remote
```

### Step 4 — seed を投入

```bash
wrangler d1 execute stats47 --remote --file=packages/database/seed/d1-seed.sql
# 確認
wrangler d1 execute stats47 --remote --command "SELECT COUNT(*) FROM articles;"
```

### Step 5 — 運用ルール（再肥大の防止）

- **観測値は二度と D1 に入れない**（R2 のまま）。D1 = 運用/メタ専用。
- 本番ランタイムは当面 **R2 snapshot 配信を維持**（D1 = オーサリング/ビルド DB）。
  動的化したい場合のみ、後段で Workers binding 直読みを検討。
- 編集後は従来どおり `/sync-snapshots` で R2 snapshot を再生成。

## 検証済（2026-05-29、クラウドセッション）

- `extract-articles-seed-from-r2.ts` 実行 → **196 件**（CLAUDE.md 記載の articles 数と一致）
- `seed-to-d1-sql.ts` 実行 → 196 行・2 バッチ INSERT
- in-memory SQLite に `d1-seed.sql` をロード → **196 行・published=117・tags 有効 JSON** を確認

Mac / Cloudflare 認証が必要なのは Step 1(b)・Step 2〜4 のみ。それ以外はクラウド完結。
