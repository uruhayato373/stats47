---
type: performance-report
date: 2026-06-13
status: active
tags: [code-audit, performance, multi-agent]
---

# 全コード監査 — 不適切箇所・ページ速度悪化要因と改善方針 (2026-06-13)

Opus 2 体 (レンダリング/データ取得、アーキテクチャ/死蔵コード) + Sonnet 3 体 (バンドル、規約違反、SEO/配信) の並列監査結果を統合。PSI 実測 (2026-06-12: error 53 / warning 33) と突合済み。主要指摘は main agent が実コードで裏取り済み。

## 結論 (TL;DR)

PSI 悪化の根本原因は **個別ページの実装ではなくインフラ設定**: OpenNext on Cloudflare Workers で **incremental cache が未設定**のため、SSG/ISR の HTML が一切永続されず**全リクエストがエッジでフル再レンダリング + R2/e-Stat fetch** になっている。これが全ページ共通の LCP/TTFB 劣化 (モバイル LCP 4〜13s) を説明する。その上に (a) JS breakpoint によるハイドレーション後レイアウト切替 (CLS)、(b) チャート毎の個別 e-Stat fetch (TBT)、(c) ブログ一覧の 200 枚画像 (LCP 7s) が乗っている。

## 実施状況 (2026-06-13 同日セッション・working tree、未デプロイ)

4 並列エージェント (Opus×1 + Sonnet×3、ファイル領域を非重複に分割) で実装。apps/web 型チェック clean / 341 テスト green / packages/visualization 型チェック clean (golden PNG 8 件は機械依存の既存 flaky、変更前後で pixel diff 同一＝今回の d3 変更と因果なしを stash 比較で確認)。TODO 真実源は `docs/todo/01_改善バックログ.md` の PERF-* エントリ。

| 監査項目 | 状態 | backlog ID |
|---|---|---|
| T1-1/T1-2 OpenNext incremental cache + revalidate + force-dynamic 撤去 | ✅ 実装済 | PERF-OPENNEXT-CACHE-01 |
| T1-3 CLS (useBreakpoint→CSS / AdSense minHeight / sticky max-h) | ✅ 実装済 | PERF-RANKING-CLS-02 |
| T1-5 ブログ LCP (ページネーション + image priority) | ✅ 実装済 | PERF-BLOG-LCP-01 |
| T2-1 d3 named import + BoxplotChart dynamic + use client 撤去 | ✅ 実装済 | PERF-D3-BUNDLE-01 |
| T3/T4 規約是正 (middleware/sitemap/preconnect/OGP font/module cache) + orphan 削除 + devDeps | ✅ 実装済 | PERF-CLEANUP-01 |
| T1-4 テーマ/エリア観測値の R2 事前 bake | ⏸️ deferred (要設計・完全DBレス §3) | PERF-AUDIT-DEFER |
| T2-2 search-index/provenance JSON の Worker 同梱解除 | ⏸️ deferred (/search SSR 挙動の検証要) | PERF-AUDIT-DEFER |

> **次アクション**: working tree を feature ブランチで commit → develop → PR develop→main → デプロイ後 `populateCache` 実行 → `psi-audit-daily.yml` 実測で各 PERF-* を effect/* 判定 (2026-07-11 目安)。**OpenNext incremental cache はデプロイ時に R2 へ cache を populate しないと効かない** — `npm run workers:populate-cache:production` が deploy script に組込済。

## Tier 1 — 最優先 (効果大・全ページに波及)

### T1-1. OpenNext incremental cache 設定 (LCP/TTFB 全ページ) ★裏取り済
- `apps/web/open-next.config.ts` がデフォルトのまま (`defineCloudflareConfig({})`) で `incrementalCache` 未指定。`wrangler.toml` にも `NEXT_INC_CACHE_R2_BUCKET` binding なし。
- → SSG/ISR HTML がどこにも保存されず毎リクエスト再レンダリング。
- **改善**: `r2IncrementalCache` を設定し R2 binding (`NEXT_INC_CACHE_R2_BUCKET`) を追加。公式: https://opennext.js.org/cloudflare/caching (アクセス 2026-06-13)
- 想定効果: TTFB/LCP の大幅改善 (全 SSG/ISR ページ)。**[仮説]** モバイル LCP -30〜50%。検証: デプロイ後 PSI 日次計測 (psi-audit-daily.yml) で 2026-06-20 までに LCP error 件数が減らなければ次の仮説 (ボトルネックはレンダリングでなく asset) へ。

### T1-2. revalidate 欠如 / force-dynamic 矛盾 ★裏取り済
- `app/ranking/[rankingKey]/page.tsx` — コメントは「24h ISR」だが `export const revalidate` が無い。
- `app/areas/[areaCode]/[themeSlug]/page.tsx:28-29` — `force-dynamic` と `revalidate=86400` が同居 (force-dynamic が勝ち、47×18 ページが毎回 SSR)。
- `app/page.tsx` / `app/blog/page.tsx` も revalidate 無し。
- **改善**: force-dynamic 撤去 + 各ルートに `export const revalidate` を明示。T1-1 とセットで初めて効く。

### T1-3. CLS: JS breakpoint でハイドレーション後にレイアウト切替 (ranking desktop CLS 0.264/0.094)
- `hooks/useMediaQuery.ts:21` が SSR で false → useEffect で true に反転。`RankingKeyPageClient.tsx:126,457,489` の `useBreakpoint` がマップ/テーブル配置を丸ごと切り替え、ハイドレーション後に全体が再レイアウト。
- **改善**: JS state でなく CSS media query で両レイアウトを出し分け (hidden lg:block パターン)。
- 併発要因: `AdSenseAd.tsx:122-123` で `article` フォーマット (RANKING_INCONTENT_MOBILE / BLOG_ARTICLE_INLINE) の `reservedMinHeight=0` — fluid 広告が予約なしで展開。min-height 120px 以上を予約する。

### T1-4. TBT: ダッシュボードのチャート毎 e-Stat fetch (themes/areas TBT 0.9〜2.4s)
- `theme-dashboard/load-theme-data.ts:57` が指標ごとに `fetchFormattedStats` (フル e-Stat 取得) を critical path で実行。`stat-charts/cards/KpiCard.tsx:31` は各チャートが async SC で自前 fetch、Suspense 境界なし。
- `page-components-snapshot.ts:66` がビルド時 (`NEXT_PHASE=phase-production-build`) に `[]` を返すため、area/theme チャートは **SSG に焼かれず常にランタイム描画**。
- **改善**: テーマ/エリアの観測値を R2 snapshot に事前 bake し 1 JSON 読みに変更 (完全DBレス設計と整合)。非マップテーマでの topology fetch スキップ (`load-theme-data.ts:95-160`)。

### T1-5. ブログ一覧 LCP 7.0s (mobile)
- `app/blog/page.tsx:29` + `blog-article-grid.tsx:32` — 全 ~200 記事のサムネを 1 ページに描画、`priority` 無し。`ThemeAwareImage.tsx:31` は `unoptimized`。`FeaturedRankings/RankingThumbnail.tsx:47-65` は light/dark 両方の `<Image>` を描画 (2 倍 DL)。
- **改善**: ページネーション (~24 件) + 先頭行に priority + 以降 lazy。light/dark は 1 枚に。

## Tier 2 — 高 (Worker サイズ・バンドル)

### T2-1. d3 全量 import (TBT)
- `packages/visualization/src/d3/components/*` の 14 ファイルが `import * as d3 from "d3"` (~500KB)。`RankingBoxplotChart/index.tsx:4` は dynamic 化されておらず ranking ページの同期バンドルに混入。`AgeCompositionChart.tsx:102` は `import("d3")` を useEffect 内で実行。
- **改善**: d3-scale / d3-shape 等のモジュール別 import に置換 + BoxplotChart を next/dynamic 化。

### T2-2. Worker サーバーバンドルへの巨大静的 JSON 焼き込み
- `public/search-index.json` **1.35MB** が /search SSR 経由で require され Worker に同梱 (client も別途 fetch = 二重)。
- `CompositionChart.tsx` (server) が `ssds-provenance.json` **648KB** を import。
- **改善**: R2 / 遅延 fetch 化、または格納フィールド削減。Workers のサイズ上限・cold start に直結。

### T2-3. 不要な client 境界 / barrel export
- hooks/handler の無い `"use client"` が 10+ 件 (DashboardPageHeader / DashboardCard / DefinitionsCard / AreaProfileSidebar / BannerAd 等)。`MarkdownSectionRenderer.tsx` は react-markdown を client へ送出 — サーバー側 remark 化で削減可。
- `packages/components/src/index.ts:9-33` の `export *` barrel が tree-shaking を阻害。

## Tier 3 — 中 (規約違反・正しさ)

| # | 指摘 | 件数/箇所 |
|---|---|---|
| T3-1 | **module-level キャッシュ禁止違反**: `get-s3-client.ts:3` / `load-finance-cards.ts:46` / `search-server.ts:28` / `page-components-snapshot.ts:71` | 4 件 |
| T3-2 | **直列 await** (Promise.all 化): `areas/[areaCode]/page.tsx:90` / `blog/[slug]/page.tsx:113,125` | 3 箇所 |
| T3-3 | **`container mx-auto` 直書き** (PageShell 未使用、統一レイアウト規約違反): ranking/areas/cities/blog/survey/themes/category の主要ページ | 45 件 |
| T3-4 | **sticky aside の max-h 欠如** (フッター非表示の再発リスク): `RankingKeyPageClient.tsx:594` / `BlogShareRail.tsx:35` | 2 件 |
| T3-5 | **middleware の 301 先が `https://stats47.jp` ハードコード** (`middleware.ts:131,153,173`) — preview 環境で本番へ飛ぶ | 3 箇所 |
| T3-6 | **OGP フォントを毎回 Google Fonts から 3 fetch** (`features/ogp/font-loader.ts`) — ISR 再生成毎にネットワーク往復、失敗時 CJK 欠落 | 1 件 |
| T3-7 | `/search` が noindex なのに `sitemap.ts:81` に混入 | 1 件 |
| T3-8 | `: any` / `as any` 残存 | 65 件 (テスト除く) |
| T3-9 | `middleware.ts:271-283` で毎リクエスト Set 再構築 | 1 件 |

## Tier 4 — 低 (掃除)

- orphan feature 削除: `features/fishing-ports` / `features/port-statistics` (2026-05-28 ルート廃止済・参照ゼロ) + 対応 exporter (`export-{fishing-ports,port-statistics}-snapshot.ts`) を sync-snapshots から除去。
- `apps/web/package.json`: `@playwright/test` / `better-sqlite3` / `dotenv` を devDependencies へ、`@types/nodemailer` 削除。
- `wrangler.toml` の vestigial D1 binding `STATS47_STATIC_DB` 削除 (完全DBレス)。
- `pagead2.googlesyndication.com` への preconnect 追加 (`layout.tsx`)。
- 404 フォールバック metadata の canonical 欠如 (`ranking/[rankingKey]/page.tsx:128` / `areas/[areaCode]/page.tsx:55`)。
- `sitemap.ts:150` の `listLatestArticles(10000)` 二重 fetch。

## 健全だった点 (対応不要)

- 完全DBレス: 本番 runtime に getDrizzle/db.select 呼び出しゼロ。`@stats47/database` は test のみ。
- shadow-lg / rounded-xl / text-black / tracking-tight 違反 0 件。
- redesign と旧 features のレイアウトは重複でなく役割分担 (PageShell=reading / WidePageShell=wide)。
- METRICS_REGISTRY (8.6MB) はビルドスクリプト専用で Worker に焼き込まれていない。

## 推奨実行順 (PR 切り方)

1. **PR-1 (infra)**: T1-1 + T1-2 — open-next.config.ts + wrangler.toml + revalidate 明示。最小 diff・効果最大。デプロイ後 PSI で実測検証。
2. **PR-2 (CLS)**: T1-3 — useBreakpoint→CSS 化 + AdSense minHeight。ranking ページの CLS error 解消。
3. **PR-3 (blog LCP)**: T1-5 — ページネーション + priority。
4. **PR-4 (bundle)**: T2-1 + T2-3 — d3 モジュール import 化 + 不要 use client 撤去。
5. **PR-5 (worker size)**: T2-2 — search-index / provenance JSON の同梱解除。
6. **PR-6 (theme TBT)**: T1-4 — テーマ観測値の R2 事前 bake (設計検討要、完全DBレス設計 §3 に従う)。
7. **PR-7 以降**: Tier 3/4 をまとめ掃除 (T3-5 middleware ハードコードと T3-4 max-h は先行可)。

検証はすべて `evidence-based-judgment.md` 準拠: 各 PR デプロイ後に `psi-audit-daily.yml` の実測 + `curl -A Googlebot` で確認し、effect/* は 2026-06-27 までに判定する。
