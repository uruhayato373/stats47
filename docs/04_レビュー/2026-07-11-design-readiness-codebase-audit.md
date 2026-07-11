---
type: code-audit
date: 2026-07-11
status: complete-final
scope: apps/web + shared packages
tags: [code-audit, design-system, ui, maintainability, accessibility]
---

# デザイン改修前 コードベース全体監査

## 結論

現在のコードベースに、デザイン改修を停止すべき致命的な障害はない。TypeScript、ESLint、Web テスト 367 件、既存デザインシステム検査はすべて通過した。

ただし、改修前に **P1 の3項目**を先に是正すると、新UIが既存の例外や不安定な依存関係を引き継ぐことを防げる。P2 以下はデザイン改修と同時に対象コンポーネント単位で直せばよい。

Knip 候補は全件の参照経路を再確認済み。**コンポーネント本体まで不要と確定したのは `ScatterChartStack` 1件**。その他のコンポーネント候補は実利用されており、不要なのは barrel 上の再 export だけである。詳細は「Knip候補の最終判定」に固定した。

## 監査範囲と方法

- `apps/web/src`、Web が利用する `packages/*`、package manifest、主要設定を横断検索
- 正典: `docs/01_技術設計/13_統一レイアウト設計.md`、`15_デザインシステムSSOT.md`、`.claude/rules/{coding-standards,ui-components}.md`
- 自動検査: type-check、lint、Vitest、design-system checker、Knip
- 2026-06-13 の旧監査で実装済みの項目は再掲せず、2026-07-11 時点の残存問題のみを記録

## 指摘一覧

| ID | 優先度 | 課題 | 対応時期 |
|---|---|---|---|
| DR-AUDIT-01 | P1 | Web の D3 直接依存が manifest に宣言されていない | デザイン改修前 |
| DR-AUDIT-02 | P1 | ブログ右レールの sticky が必須 max-height/overflow を欠く | デザイン改修前 |
| DR-AUDIT-03 | P1 | 目視検査の死角: 自動デザイン検査が実際の残存違反を通す | デザイン改修前 |
| DR-AUDIT-04 | P2 | チャート共有APIに重複エントリと未使用 export が残る | チャート改修の最初 |
| DR-AUDIT-05 | P2 | 型レベル drift guard がビルド対象から孤立している | テーマUI改修前 |
| DR-AUDIT-06 | P2 | 本番コードに `any` が残り、外部データ境界が曖昧 | 関連画面の改修時 |
| DR-AUDIT-07 | P3 | 大規模な公開 barrel に未使用 export が多い | 対象 feature 改修時 |
| DR-AUDIT-08 | P3 | テスト1件が長期 skip、設定 TODO が未完了値を持つ | 別PR |

## P1: 改修前に直す

### DR-AUDIT-01: Web の D3 直接依存が manifest にない

**根拠**

- `apps/web/src/components/charts/MiniCharts.tsx:11-13` が `d3-scale`、`d3-selection`、`d3-shape` を直接 import
- `apps/web/package.json` の dependencies にこの3 package はない
- 現在動くのは root/package の hoisting に偶然依存しているため。Knip も unlisted dependencies 3 件として検出

**影響**

単一 workspace インストール、package manager の変更、lockfile の再生成で build が壊れる。デザイン改修で MiniCharts の利用が増えるほど影響が広がる。

**Claude Code への実装指示**

1. `apps/web/package.json` の dependencies に3 packageを明示追加する。現在 lockfile が解決している version に合わせる。
2. root の `d3` 全体 import へ戻さない。現在の module-level import は bundle の意図に合っている。
3. `package-lock.json` も npm install で同期する。

**完了条件**: Knip の unlisted dependencies が 0、type-check/build が通る。

### DR-AUDIT-02: ブログ右レールの sticky 規約違反

**根拠**

- `apps/web/src/app/blog/[slug]/page.tsx:165-188`
- `<aside className="flex flex-col gap-3 lg:sticky lg:top-20">` に `lg:max-h-[calc(100vh-5.5rem)]` と overflow 指定がない
- `PageShell` の `lg:grid` + `items-start` 内で使っており、`.claude/rules/ui-components.md` の必須ルールに直接違反

**影響**

関連記事や広告が増えると aside の自然高が grid 行高を押し広げ、フッターに到達できない既知不具合が再発する。

**Claude Code への実装指示**

`aside` に `lg:max-h-[calc(100vh-5.5rem)] lg:overflow-y-auto lg:pr-1` を付与する。ただし、右レールをデザイン改修で non-sticky にする方針なら `lg:sticky lg:top-20` 自体を削除する。両パターンを混在させない。

**完了条件**: 1024px 以上で長い記事の末尾からフッターまで到達でき、レール内容がビューポートをはみ出さない。

### DR-AUDIT-03: デザイン検査が残存違反を見逃す

**根拠**

`design-system:check` は通るが、次の正典違反が残る。

- `apps/web/src/lib/analytics/components/CookieConsentBanner.tsx:70`: `container mx-auto` 直書き
- `apps/web/src/app/blog/[slug]/page.tsx:222`: 禁止されたカラーバー `border-t-4`
- `apps/web/src/features/blog/components/md-content.tsx:158`: `border-l-4`（引用表現として意図的なら正典側に例外を明記すべき）
- Header/Footer は共通サイト chrome として `max-w-[1700px]` を持つ。これは PageShell を使えない妥当な例外だが、checker と正典に例外範囲を固定すべき

**影響**

検査通過を「デザイン準拠」と解釈できず、改修中に例外が再生産される。

**Claude Code への実装指示**

1. Cookie banner は `PageShell` のトークンと同じ width/gutter を共有する専用 layout primitive へ寄せる。固定バナーに `PageShell` の `py-8` を持ち込まない。
2. ブログヘッダーの上バーは全周 border または余白/背景差へ置換。
3. blockquote は「例外として正式化」か「バー以外の表現へ変更」のどちらかを選ぶ。
4. `check-design-system.mjs` に対応パターンを追加し、allowlist はファイルと理由を限定する。

**完了条件**: checker が上記パターンを検出でき、意図的例外以外は 0 件。

## P2: 対象UI改修の最初に直す

### DR-AUDIT-04: チャート共有APIの重複

**根拠**

- `apps/web/src/components/charts/ChartCard.tsx` は `StatsChartCard.tsx` の再 export だけで参照 0
- `StatsChartCard.tsx` 内で `StatsChartCard` と、それをそのまま呼ぶ `ChartCard` が並存
- Knip は未使用ファイル 1 件と未使用 export を検出

**推奨**

正式名を `ChartCard` に統一するか、責務が統計チャート限定なら `StatsChartCard` に統一する。現在の利用側は `ChartCard` が主なため、前者が最小 diff。互換ラッパーを残さない。

**完了条件**: 実装本体と import path が1種類、Knip の該当 unused file/export が 0。

### DR-AUDIT-05: drift guard が孤立

`apps/web/src/features/theme-dashboard/catalog-drift-guard.ts` は型整合性を守る意図だが、import されず Knip で unused file。`tsconfig` の include により現状は type-check されても、将来 include 範囲が変わると静かに消える。

**推奨**: 型の SSOT 側のモジュールか、必ず import される `theme-dashboard/server.ts` 近傍へガードを移す。または専用 type-test として test 命名・実行経路を明示する。

**完了条件**: 意図的に union を不整合にしたとき type-check が落ち、Knip で孤立ファイルにならない。

### DR-AUDIT-06: 外部データ境界の `any`

テストを除いても次が残る。

- `packages/estat-api/src/stats-list/services/fetcher.ts:490`: ページ結合配列 `any[]`
- `packages/estat-api/src/meta-info/types/index.ts:153`: cache summary が `any`
- `apps/web/src/features/blog/services/mdx-renderer.ts:13`: MDX component props が `any`
- `apps/web/src/types/jsdom.d.ts:8`: option が `any`
- visualization/GIS に D3、TopoJSON 境界の `any` が複数

**推奨順**: API/R2 境界 → UI props → D3 callback の順。「全 any の一括除去」はせず、改修する画面の入力境界だけ `unknown` + schema/type guard へ置換する。

**完了条件**: 対象データの不正 shape をテストし、型キャストで隠さず失敗を扱える。

## P3: 独立した掃除タスク

### DR-AUDIT-07: 未使用の公開API

Knip 結果: unused exports 35、unused exported types 21。特に `features/ranking/index.ts`、`features/ranking/server.ts`、`RankingKeyPage/server.ts` の多段 barrel に集中する。

**推奨**: 機械的に全削除せず、外部 workspace からの import を `rg` で再確認した後、feature ごとに削除。まず ranking の公開経路を `index.ts` と `server.ts` の2つに整理する。

## Knip候補の最終判定

判定方法は、Knip の workspace-wide 解析に加え、`apps/*`、`packages/*`の symbol/import 参照、直接 import、barrel 経由を `rg` で照合した。「削除」はファイルまたは実装本体を削除可能、「exportのみ削除」は実装本体は利用中のため残す、「維持/移動」は保護機能のため削除不可を意味する。

### ファイル・実装本体

| 対象 | 最終判定 | 根拠 / 実装指示 |
|---|---|---|
| `components/charts/ChartCard.tsx` | **ファイル削除** | 実装のない再 export barrel。参照 0。利用側はすべて `StatsChartCard.tsx` を直接 import |
| `theme-dashboard/catalog-drift-guard.ts` | **削除不可・移動** | `ThemeDbChartComponentProps ⊆ CatalogComponentType` を type-check する保護コード。必ず評価される type-test/SSOT 近傍へ移す |
| `ScatterChartStack` | **実装削除** | 定義以外の参照 0。同ファイルの `ScatterChartGrid` は `PopulationScatterSection` から利用中のため残す |
| `getRankingStaticParams` | **実装削除** | route は意図的に `generateStaticParams` を持たないオンデマンド ISR。定義と再 export 以外の参照 0。使用する `readActiveRankingKeysFromR2` import も同時削除 |
| `LOCAL_FINANCE_THEME` / `LOCAL_FINANCE_CITY_THEME` | **実装削除** | 定義以外の参照 0。現行テーマ経路は `ALL_THEMES`/catalog SSOT。この2定義のためだけの types/toThemeConfig import も削除 |
| `StatsChartCard` | **統合後に実装名削除** | 利用側は `ChartCard` のみ。現在は `ChartCard` が `StatsChartCard` を無加工で呼ぶ。実装本体を `ChartCard` へ改名し wrapper を消す |
| Ranking/Ads の下記 component 群 | **本体は維持** | 直接 import で実利用中。不要なのは上位 barrel の再 export のみ |

「本体は維持」の確認済み component:

- `AiContentAccordion`、`AiInsightCard`、`AiMarkdownContent`、`RankingFaqSection`
- `CorrelationSectionSkeleton`、`RankingPageCardsSkeleton`
- `CorrelationSectionContainer`、`RankingItemsSidebar`、`RelatedRankingsGrid`
- `RankingPageCardsContainer`、`RelatedArticlesCard`、`PortStatisticsMapCard`
- `RankingPageFaqSection`、`RankingPageInsightsSection`、`RankingPageCorrelationSection`
- `RankingPageSupplementCardsSection`、`RankingPageNativeAffiliateSection`
- `RankingPageRelatedRankingsSection`、`RankingPageSidebarSection`
- `AdSlotLabel`（`FooterAdSlot` / `InContentAdSlot` が直接利用）

### unused exports 35件

| ファイル / symbol | 最終判定 |
|---|---|
| `features/ads/index.ts`: `AdSlotLabel` | **再 export のみ削除**。本体は利用中 |
| `features/ads/components/slots/index.ts`: `AdSlotLabel` | **再 export のみ削除**。slot 内は直接 import |
| `features/ranking/index.ts`: `getRankingTitle` | **再 export のみ削除**。利用側は `@stats47/ranking` から import |
| 同: `RankingKeyPageClient` | **再 export のみ削除**。ルートは現在 `RankingPageClientShell` 経由 |
| 同: AI/FAQ 4件 | **再 export のみ削除**。`RankingPageAiSections.tsx` が直接 import |
| 同: skeleton 2件 | **再 export のみ削除**。`RankingPageAsyncSections.tsx` が直接 import |
| `features/ranking/server.ts`: `cachedFindRankingItem` | **再 export のみ削除**。service が lib から直接 import |
| 同: server component 6件 | **再 export のみ削除**。RankingKeyPage 内から直接 import |
| 同: `PortStatisticsMapCard` | **再 export のみ削除**。`RankingPageSidebarSection` が直接 import |
| 同: `getRankingStaticParams` | **再 exportと実装を削除**。オンデマンド ISR 方針に反する残存コード |
| `RankingKeyPage/server.ts`: section 7件 | **barrel ファイルごと削除可**。利用側は個別ファイルを直接 import |
| `CorrelationSection/index.tsx` | **barrel ファイル削除可**。実装本体は直接 import で維持 |
| `RankingPageCards/index.ts` | **barrel ファイル削除可**。実装本体は直接 import で維持 |
| `ranking-page-route.ts`: `getRankingStaticParams` | **実装削除**。page 正典が `generateStaticParams` を禁止しており、再接続しない |
| `funnel-cta-config.ts`: `FUNNEL_CTA_TARGET_CATEGORIES` | **export 修飾子のみ削除**。同ファイル内で利用中 |
| `theme-dashboard/server.ts`: finance theme 2件 | **実装削除**。定義以外の参照 0。現行 SSOT は `ALL_THEMES`/catalog |
| `stat-charts/constants.ts`: `getChartColors` | **再 export のみ削除**。利用側は `ChartPalette` を直接 import |
| `ChartPalette.ts`: `CHART_MUTED_COLOR` | **export 修飾子のみ削除**。同ファイル内で利用中 |
| `StatsChartCard.tsx`: `StatsChartCard` | **DR-AUDIT-04 で `ChartCard` へ統合** |
| `ScatterChartGrid.tsx`: `ScatterChartStack` | **実装削除**。参照 0 |

> 注: Knip の 35 件には、同一 symbol の多段再 export が別件として含まれる。上表は削除単位で集約している。

### unused exported types 21件

すべて runtime component の削除理由にはならない。最終判定は次のとおり。

| 分類 | 対象 | 最終判定 |
|---|---|---|
| component props / row types | `ChartFooter*`、`ChartLegendItem`、`ChartPanelProps`、`KeyMetricsTable*`、`StatsChartCardProps`、`RankingBarListItem`、`ScatterChartGridItem` | 実装で使用中。**export 修飾子または barrel 再 export のみ削除** |
| 重複再 export types | `BreadcrumbTrailItem`、`CityProfileData`、`RelatedArticleSummary` 各2経路 | service/component 側の定義は維持、**server/index の再 export のみ削除** |
| file-local data types | `FlowNode`、`CityFlow` | 実装で使用中。**export 修飾子のみ削除** |
| analytics parameter types | `BaseEventParams`、`ConversionEventParams`、`EngagementEventParams` | 内部の event union/utility で使用中。**export 修飾子のみ削除** |
| SSOT guard input | `ThemeDbChartComponentProps` | **export 維持**。drift guard の移設先から型 import する |

### 最終的な削除スコープ

Claude Code は次の順で実装する。

1. `ChartCard.tsx`、`RankingKeyPage/server.ts`、`CorrelationSection/index.tsx`、`RankingPageCards/index.ts` の不要 barrel を削除。
2. `ScatterChartStack`、`getRankingStaticParams`、finance theme 2定義の不要実装を削除。
3. 上表の「再 export/export 修飾子のみ削除」を適用。コンポーネント本体は削除しない。
4. `catalog-drift-guard.ts` を削除せず移設し、型不整合時に type-check が失敗することを確認。
5. Knip を再実行。barrel 削除で新たに unreachable となったファイルが出た場合のみ、そのファイルの参照を再確認して追加削除する。

### DR-AUDIT-08: skip/TODO

- `apps/web/src/features/blog/services/article-service.test.ts`: R2 fallback 関連の test 1 件 skip
- `packages/data-configs/src/metrics/station-passengers-annual-total.ts`: `TODO-STATION-PASSENGERS`
- `packages/data-configs/src/metrics/population-migration-net-municipality.ts`: `TODO-MUNICIPALITY-MIGRATION`
- `apps/web/src/components/stat-charts/utils/generate-dashboard-metadata.ts`: 未完了 TODO

**推奨**: placeholder 指標が本番 snapshot の生成対象かを validate script で明示的に防ぐ。skip test は R2 client を注入可能にして単体テストで復帰させる。

## 健全だった点

- Web type-check: 成功
- Web ESLint: warning/error 0
- Web Vitest: 67 files、367 passed、1 skipped
- design-system checker: 成功（ただし DR-AUDIT-03 の検出範囲改善は必要）
- 旧監査で多かったページ内 `container mx-auto` / `max-w-[1700px]` 直書きは、現在は共通 chrome、PageShell、Cookie banner のみ
- 一般的な `shadow-lg`、`rounded-xl`、`text-black`、`tracking-tight` の残存はほぼ primitive の意図的スタイルに限定

## Claude Code 向け推奨PR分割

1. **PR-A: 改修前ガード** — DR-AUDIT-01、02、03。manifest + sticky + checker のみで、見た目の全面改修と混ぜない。
2. **PR-B: chart API 整理** — DR-AUDIT-04、05。この後にチャートUIを改修する。
3. **PR-C 以降: ページ/機能ごとのデザイン改修** — 触る境界の DR-AUDIT-06、07 を同時に外科的に解消。
4. **独立 cleanup PR** — DR-AUDIT-08。UI diff に混ぜない。

## 各PRの検証テンプレート

```bash
npm run design-system:check --workspace apps/web
npm run type-check --workspace apps/web
npm run lint --workspace apps/web
npm run test:run --workspace apps/web
npm run knip -- --workspace apps/web
```

視覚変更があるPRでは、以上に加えて localhost で 375px / 768px / 1024px / 1280px / 1700px を確認する。特にブログ記事は「フッターへ到達できるか」を完了条件に含める。フル build は route/SSG/R2 参照に触れるPRまたはリリース前に行う。

## 未実施

- フル `apps/web` build（今回は読み取り監査で route/SSG 変更なし）
- localhost のブラウザ目視・スクリーンリーダー検証
- 本番 PSI / R2 / Cloudflare 実測（デプロイなし）
