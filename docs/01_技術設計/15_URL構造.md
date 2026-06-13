---
type: technical-design
date: 2026-05-28
status: active
---

# URL 構造設計

stats47 (Next.js App Router on Cloudflare Pages) の URL 体系・301 マッピング・canonical 戦略を定義する。サイト全体の URL 整理は `~/.claude/plans/ok-validated-stroustrup.md` (2026-05-28) で確定。

## サイト URL 体系

```
/                                       トップ (注目ランキング)
/about, /privacy, /terms, /search       静的ページ
/not-found                              404

/ranking/[rankingKey]                   ランキング詳細 (主力ページ、1,800+ 件)
                                         ※ /ranking 一覧は 2026-05-28 廃止 → / に 301

/category/[categoryKey]                 カテゴリ別ランキング一覧 (17 軸)
/category/[categoryKey]/compare         地域間比較 (2 県 vs)
                                         ※ /compare/* は 2026-05-28 廃止 → /category/{key}/compare に 301

/themes                                 テーマ一覧ハブ (24 件)
/themes/[themeSlug]                     テーマダッシュボード (動的ルート、Phase 3 で集約)
/themes/local-finance/cities            市区町村財政 (例外: 都道府県/市区町村切替 UI 持ち)

/areas                                  47 都道府県一覧
/areas/[areaCode]                       県プロフィール
/areas/[areaCode]/[themeSlug]           県 × テーマ (Type A テーマのみ、47×18=836 件)
                                         ※ 旧 /areas/[code]/[categoryKey] は 301 → /areas/[code]/[themeSlug]
/areas/[areaCode]/cities/[cityCode]     市区町村プロフィール
/areas/[areaCode]/cities/[cityCode]/[categoryKey]

/survey                                 調査一覧
/survey/[surveyKey]                     調査別ランキング

/blog                                   ブログ一覧
/blog/[slug]                            ブログ記事
/blog/tags                              タグ一覧
/tag/[tagKey]                           ブログタグ別記事 (blog 専用)

/ports, /fishing-ports                  港湾・漁港
/station-passengers, /station-passengers/[prefCode]   駅乗降客

                                         ※ /gis-cross/* は 2026-05-29 廃止 → /themes に統合 (301)
                                         　 (migration-flow→population-dynamics / depopulation-medical→healthcare /
                                         　  sunshine-map→climate(新設) / hub→/themes。地図は各テーマ内 section に集約)
/maps/highway-timeline, /maps/highway-timeline/[year]

/api/*, /tiles/*, /sitemap.xml          インフラ (noindex)
```

## 301 リダイレクトマッピング表

middleware.ts (`apps/web/src/middleware.ts`) の `tryLegacyRedirect` 関数と entry point で集中管理。

| 旧 URL | 新 URL | 状態 | 導入日 |
|---|---|---|---|
| `/ranking` (一覧) | `/` | 301 | 2026-05-28 (Phase 1) |
| `/compare` | `/category/population/compare` | 301 | 2026-05-28 (Phase 2) |
| `/compare/[categoryKey]` | `/category/[categoryKey]/compare` (クエリ保持) | 301 | 2026-05-28 (Phase 2) |
| `/{categoryKey}` (1 階層) | `/category/{categoryKey}` | 301 | 既存 |
| `/{cat}/{sub}/ranking/{rankingKey}` | `/ranking/{rankingKey}` | 301/410 | 既存 |
| `/{cat}/{sub}/dashboard/{prefCode}` | `/areas/{prefCode}` | 301 | 既存 |
| `/area-profile/{prefCode}` | `/areas/{prefCode}` | 301 | 既存 |
| `/dashboard/{prefCode}` | `/areas/{prefCode}` | 301 | 既存 |
| `/areas/{prefCode}/administrativefinancial` | `/themes/local-finance?pref={prefCode}` | 301 | 既存 |
| `/gis-cross/migration-flow` | `/themes/population-dynamics` (クエリ保持) | 301 | 2026-05-29 |
| `/gis-cross/depopulation-medical` | `/themes/healthcare` (クエリ保持) | 301 | 2026-05-29 |
| `/gis-cross/sunshine-map` | `/themes/climate` (クエリ保持) | 301 | 2026-05-29 |
| `/gis-cross` (hub) ほか `/gis-cross/*` | `/themes` (クエリ保持) | 301 | 2026-05-29 |
| `/areas/{areaCode}?category={key}` | `/areas/{areaCode}/{key}` | 301 | 既存 |
| `/areas/{code}/{categoryKey}` | `/areas/{code}/{themeSlug}` (マッピング表あり) | 301 | 2026-06-02 |
| `/ranking/prefecture/{slug}` | `/ranking/{slug}` (known なら) / 410 (unknown) | 301/410 | 既存 |
| `/tag/{en-slug}` | `/tag/{ja-key}` | 301 | 既存 |
| `/blog/{old-slug}` | `/blog/{new-slug}` | 301 | 既存 |
| `www.stats47.jp/*` | `stats47.jp/*` | 301 | 既存 |
| `*/` (trailing slash) | `*` | 301 | 既存 |

### 410 Gone (削除済 URL)

| パターン | 状態 |
|---|---|
| `/blog/prefecture-rank/*` | 410 |
| `/stats/*` | 410 |
| `/correlation` / `/correlation/*` | 410 |
| `/dashboard*` (legacy variants) | 410 |
| `/themes/{unknown-slug}` | 410 (UrlPolicy.theme.isKnown でチェック) |
| `/ranking/{unknown-slug}` | 410 (UrlPolicy.ranking.isKnown でチェック) |
| `/tag/{unknown-slug}` | 410 (UrlPolicy.tag.isKnown でチェック) |
| `/blog/tags?/{key}` (旧パス) | 410 |

## canonical 戦略

各 URL の `alternates.canonical` をどこに向けるかのルール:

| URL パターン | canonical 先 | 理由 |
|---|---|---|
| `/` | `/` | トップ |
| `/ranking/[rankingKey]` | `/ranking/[rankingKey]` | 主力 SEO 対象 |
| `/category/[key]` | `/category/[key]` | カテゴリハブ |
| `/category/[key]/compare?areas=A,B` | `/category/[key]/compare` (クエリ抜き) | noindex のため canonical は base path |
| `/themes/[key]` | `/themes/[key]` | テーマハブ |
| `/areas/[code]` | `/areas/[code]` | 県プロフィール |
| `/areas/[code]/[key]` | `/areas/[code]/[key]` | indexable な category のみ |
| `/blog/[slug]` | `/blog/[slug]` | 記事 |
| `/tag/[key]` (記事 ≥2) | `/tag/[key]` | 記事数ある場合のみ indexable |
| `/tag/[key]` (記事 <2) | (noindex, follow) | thin content 回避 |

## sitemap.xml に含める / 含めないの判断基準

`apps/web/src/app/sitemap.ts` で出力する URL の判断:

**含める**:
- index, follow な URL
- ユーザー価値があり Google に index させたいページ
- 例: `/`, `/areas`, `/themes`, `/themes/[key]`, `/category/[key]`, `/areas/[code]`, `/ranking/[key]`, `/blog/[slug]`

**含めない**:
- noindex / robots: "noindex" 指定があるページ
- canonical が別 URL を指すページ
- 例: `/category/[key]/compare` (noindex)
- 例: `/api/*` `/tiles/*` (インフラ)
- 例: 旧 URL (301 でリダイレクトされる側)

## 新規ページ追加時のチェックリスト

`.claude/rules/coding-standards.md` の「新規ページ作成時のインデックス制御チェックリスト」に従う。本ファイルは URL 設計の真実源として参照する。

1. インデックス対象か → NO なら `robots: "noindex, follow"`
2. sitemap に含めるか → 上記基準で判断
3. 旧 URL からの 301 が必要か → middleware に追加
4. canonical を明示する (`alternates: { canonical: ... }`)
5. OGP 画像経路を確認 (`/robots.ts` の Disallow と整合)

## 関連

- 親方針: `~/.claude/plans/ok-validated-stroustrup.md` (2026-05-28 URL 構造整理 Plan)
- 3 タクソノミー役割分担: `docs/01_技術設計/11_情報設計.md`
- middleware 実装: `apps/web/src/middleware.ts`
- SSG 保全ルール: `.claude/rules/nextjs-ssg-preservation.md`
- インデックス制御: `.claude/rules/coding-standards.md` 「新規ページ作成時のインデックス制御チェックリスト」
