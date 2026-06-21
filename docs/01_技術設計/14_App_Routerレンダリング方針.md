# App Router レンダリング方針

最終更新: 2026-06-21

## 目的

`apps/web/src/app` の `dynamic` / `revalidate` / `generateStaticParams` の判断を固定し、R2 snapshot 依存ページで「空データがビルド時に焼き込まれる」事故を防ぐ。

本番は OpenNext on Cloudflare Workers。R2 snapshot は runtime では読めるが、build phase では環境変数や binding の都合で読めないケースがある。build 時に R2 取得失敗を fallback 表示へ握りつぶすと、その HTML が配信され続けるため SEO と回遊に影響する。

## 原則

1. **app 配下は薄くする**
   - `app/**/page.tsx` は routing、metadata、route params の受け渡しに寄せる。
   - データ取得の組み立て、R2 schema、パンくず、広告配置、ページ固有 UI は `features/*` へ寄せる。

2. **R2 必須データを build 時に読ませない**
   - build phase で R2 が読めない可能性があるページは `force-dynamic`、または `generateStaticParams` なしの ISR にする。
   - 失敗時に薄い 200 HTML を返さない。存在しない resource は `notFound()`、一時的な取得失敗は `throw` して error boundary に流す。

3. **SSG は git/static data で完結するページだけ**
   - `@stats47/area`、`ALL_THEMES`、committed constants など、build 時に必ず読めるものだけで成立するページは SSG 可。
   - R2 reader が絡む場合は、build 失敗時の fallback が SEO 的に安全か確認する。
   - 大量ページの `generateStaticParams` は、R2 list/read ではなく git に commit 済みの key list を fallback にする。

4. **ISR は「初回 runtime 生成でよい」ページに使う**
   - 全組み合わせを build 時生成すると重いが、runtime で R2 が読めば成立するページに使う。
   - `revalidate = 86400` を基本値にする。

5. **API proxy は allowlist と explicit cache**
   - path segment は正規表現または許可リストで絞る。
   - R2 public URL proxy は `cache-control` を明示する。

## 現行ルート方針

| Route | 方針 | 理由 |
|---|---|---|
| `/` | `dynamic = "force-dynamic"` | `FeaturedRankings` と最新記事が R2 snapshot 依存。build 時に空焼き込みすると主要導線が消える。 |
| `/ranking` | SSG | R2 非依存の索引ハブ。 |
| `/ranking/[rankingKey]` | `revalidate = 86400` + `generateStaticParams` | ranking item / values は R2 依存だが、key list は `KNOWN_RANKING_KEYS` fallback で build 時にも確定させる。補助データ (tag/group/survey/values/AI/topology) は build 時に空/null fallback し、runtime/ISR で復元する。 |
| `/category/[categoryKey]` | `revalidate = 86400` | カテゴリ一覧と ranking list は更新頻度が低い。 |
| `/survey/[surveyKey]` | `revalidate = 86400` + `generateStaticParams` | survey snapshot は更新頻度が低い。 |
| `/blog` | `revalidate = 86400` | blog snapshot は更新頻度が低く、一覧は ISR で十分。 |
| `/blog/[slug]` | ISR + `generateStaticParams` | article snapshot を読む。公開記事単位で cache 可能。 |
| `/themes/[themeSlug]` | `dynamic = "force-dynamic"` | dashboard 本体が R2 ranking values 依存。SSG/ISR fallback の空焼き込みを避ける。 |
| `/themes/local-finance` | `dynamic = "force-dynamic"` | 初期 finance flow を runtime で確実に読む。 |
| `/themes/local-finance/cities` | `dynamic = "force-dynamic"` | theme data が R2 依存。 |
| `/areas/[areaCode]` | `revalidate = 86400` + `generateStaticParams` | 47 都道府県 profile。runtime ISR で cache 可能。 |
| `/areas/[areaCode]/[themeSlug]` | `revalidate = 86400`、`generateStaticParams` なし | 47 x theme を build 生成しない。初回 runtime 生成して incremental cache に乗せる。 |
| `/areas/[areaCode]/cities/[cityCode]` | `generateStaticParams` = `PHASE_1_SSG_CITIES` | profile 実体と sitemap 対象を同じ定数で管理する。 |
| `/areas/[areaCode]/cities/[cityCode]/[categoryKey]` | dynamic fallback | sitemap/index 対象カテゴリは `UrlPolicy.cityCategory` と一致させる。 |
| `/search` | dynamic by searchParams | query ごとに render。noindex の探索 UI。 |
| `/sitemap.xml`, `/sitemap/[id].xml` | `revalidate = 86400` | segment 分割して R2/RSS 系取得の影響を限定する。 |
| OGP image routes | 長期 `revalidate` | metadata/static config から生成。頻繁に変わらない。 |

## エラー処理ルール

| 状況 | 振る舞い |
|---|---|
| URL の resource が存在しない | `notFound()` |
| R2 snapshot が一時的に読めない | `throw` して error boundary |
| 任意 API proxy の不正 path | `400` |
| API proxy の upstream 不在 | `404` |
| SEO 対象ページのデータ取得失敗 | 薄い 200 を返さない |

## Build-Time R2 Fallback

`NEXT_PHASE === "phase-production-build"` では、build 時に R2 へ大量 read しない。OpenNext / Next build では binding や公開 URL の状態により R2 fetch が不安定になりやすく、数千ページの SSG で補助データまで取得すると build が遅くなり、ログも noisy になる。

許可する fallback:

| データ | build 時の扱い | 理由 |
|---|---|---|
| ranking key list | `KNOWN_RANKING_KEYS` fallback | SSG 対象 URL は維持する。key list は git に commit されており build-safe。 |
| ranking item 本体 | per-key fetch 失敗時は `null` | 一時的な公開 R2 fetch 失敗で build を noisy にしない。runtime/ISR で再生成可能。 |
| ranking values / topology / AI content | `[]` / `null` | 詳細データは runtime/ISR で復元。build で全ページ分読むと重い。 |
| group members / tag related rankings / survey related items | `[]` または non-OK result | 補助導線。build HTML へ焼き込まなくても主要コンテンツを壊さない。 |
| surveys | `[]` / `null` | サイドバー補助導線。runtime/ISR で復元。 |

禁止:

- URL 存在判定の真実源を、build 時に不安定な remote R2 fetch だけへ依存させる。
- build fallback の空データを、主要コンテンツの完成形として扱う。
- runtime の R2 失敗まで静かに握りつぶす。静かな fallback は build phase に限定する。

## 変更時チェックリスト

1. 新しい `app/**/page.tsx` が R2 を読むか確認する。
2. R2 を読むなら build phase で空 fallback が焼き込まれないか確認する。
3. `force-dynamic` / `revalidate` / `generateStaticParams` の理由をこの文書の表に追記する。
4. sitemap と robots/noindex 方針が同じ allowlist を参照しているか確認する。
5. API route は path allowlist と `Cache-Control` を確認する。
6. app ファイルが大きくなったら `features/*/server` に model loader / container を切る。
