import { type NextRequest, NextResponse } from 'next/server';

import { resolvePageCacheHeaders } from '@/lib/cache-policy';
import { UrlPolicy } from '@/lib/url-policy';

import { BLOG_SLUG_REDIRECTS } from '@/config/blog-redirects';
import { LEGACY_CATEGORY_KEYS_SET } from '@/config/legacy-category-keys';
import { RANKING_SLUG_REDIRECTS } from '@/config/ranking-redirects';
import { REDIRECT_TAG_KEYS } from '@/config/redirect-tag-keys';

/**
 * 410 Gone 応答（CDN cacheable + noindex 強化）。
 *
 * Phase 9 (2026-04-26) で `no-store, must-revalidate` から変更。
 * - 旧設定では Google が毎回 origin に再確認し、クロール予算を 410 URL 群に吸収させていた
 * - CDN キャッシュ可能化により Google の再確認頻度が下がり、新コンテンツへ予算が回る
 * - X-Robots-Tag: noindex も併用して削除シグナル強化
 *
 * 公式根拠: https://developers.google.com/search/docs/crawling-indexing/http-caching
 */
function gone(): Response {
  return new Response(null, {
    status: 410,
    headers: {
      'Cache-Control': 'public, max-age=86400, s-maxage=604800',
      'X-Robots-Tag': 'noindex',
    },
  });
}

/**
 * 旧URL構造のカテゴリキー一覧 (/{cat}/{sub}/dashboard|ranking/{x} などのレガシーパス判定)。
 * SSOT は `@/config/legacy-category-keys` に集約し、data-configs CATEGORIES との一致は
 * legacy-category-keys.test.ts で担保する (ハードコードの silent drift 防止)。
 */
const OLD_CATEGORY_KEYS = LEGACY_CATEGORY_KEYS_SET;

/**
 * Type A テーマ（都道府県単位で集計できる）のスラグ集合。
 * `/areas/{prefCode}/{themeSlug}` を Next.js に委譲してよいか判定する。
 * リクエストごとに new Set を作らないよう module スコープに hoist (2026-06)。
 */
const TYPE_A_THEME_SLUGS = new Set([
  'population-dynamics',
  'aging-society',
  'living-housing',
  'local-economy',
  'labor-wages',
  'manufacturing',
  'healthcare',
  'safety',
  'education-culture',
  'tourism',
  'consumer-prices',
  'foreign-residents',
  'occupation-salary',
  'real-income',
  'labor-mobility',
  'local-finance',
  'fishery-marine',
  'climate',
]);

/**
 * `isValidPrefCode` は UrlPolicy から再 export（既存テスト互換のため）。
 */
export const isValidPrefCode = UrlPolicy.area.isValidPrefCode;

// ============================================================================
// Section 1: 旧 URL 構造の 301 リダイレクト / 410 Gone
// ============================================================================
// Phase 9 (2026-04-26): リダイレクト先が unknown / gone なら 301 ではなく直接 410
// （301→410 チェーン解消で Google の「壊れたリダイレクト」判定を回避）。

function tryLegacyRedirect(pathname: string, baseUrl: string): Response | null {
  const segments = pathname.split('/').filter(Boolean);

  // /{cat}/{sub}/dashboard/{prefCode} → /areas/{prefCode}
  // /{cat}/{sub}/ranking/{rankingKey} → /ranking/{rankingKey}
  if (segments.length >= 4 && OLD_CATEGORY_KEYS.has(segments[0])) {
    const pageType = segments[2];
    const key = segments[3];
    if (pageType === 'dashboard' && /^\d{5}$/.test(key)) {
      if (!UrlPolicy.area.isValidPrefCode(key)) return gone();
      return NextResponse.redirect(new URL(`/areas/${key}`, baseUrl), {
        status: 301,
      });
    }
    if (pageType === 'ranking' && key) {
      if (UrlPolicy.ranking.isGone(key) || !UrlPolicy.ranking.isKnown(key))
        return gone();
      return NextResponse.redirect(new URL(`/ranking/${key}`, baseUrl), {
        status: 301,
      });
    }
  }

  // /area-profile/{prefCode} → /areas/{prefCode}
  if (
    segments.length >= 2 &&
    segments[0] === 'area-profile' &&
    /^\d{5}$/.test(segments[1])
  ) {
    if (!UrlPolicy.area.isValidPrefCode(segments[1])) return gone();
    return NextResponse.redirect(new URL(`/areas/${segments[1]}`, baseUrl), {
      status: 301,
    });
  }

  // /areas/{prefCode}/administrativefinancial → /themes/local-finance?pref={prefCode}
  // areas/categoryKey の 47 × N ページを作らない方針 (2026-05-26) との両立。
  // 旧 URL アクセスを themes 側の 1 県深掘りに集約する 301。
  if (
    segments.length === 3 &&
    segments[0] === 'areas' &&
    /^\d{5}$/.test(segments[1]) &&
    segments[2] === 'administrativefinancial'
  ) {
    if (!UrlPolicy.area.isValidPrefCode(segments[1])) return gone();
    return NextResponse.redirect(
      new URL(`/themes/local-finance?pref=${segments[1]}`, baseUrl),
      { status: 301 }
    );
  }

  // /dashboard/{prefCode}/... → /areas/{prefCode}（旧 URL のセグメント順序違いバリアント）
  if (
    segments.length >= 2 &&
    segments[0] === 'dashboard' &&
    /^\d{5}$/.test(segments[1])
  ) {
    if (!UrlPolicy.area.isValidPrefCode(segments[1])) return gone();
    return NextResponse.redirect(new URL(`/areas/${segments[1]}`, baseUrl), {
      status: 301,
    });
  }

  // 完全廃止のパスは 410 Gone
  if (
    pathname.startsWith('/blog/prefecture-rank/') ||
    pathname.startsWith('/stats/')
  ) {
    return gone();
  }

  // /{cat}/{sub}[/dashboard|/ranking] → /category/{cat} に集約 301
  if (
    segments.length >= 2 &&
    segments.length <= 3 &&
    OLD_CATEGORY_KEYS.has(segments[0])
  ) {
    return NextResponse.redirect(new URL(`/category/${segments[0]}`, baseUrl), {
      status: 301,
    });
  }

  // OLD_CATEGORY_KEYS にマッチしない旧URL構造（subcategory 先頭等）+ dashboard/ranking + prefCode
  if (
    segments.length >= 3 &&
    (segments.includes('dashboard') || segments.includes('ranking'))
  ) {
    if (segments.some((s) => /^\d{5}$/.test(s))) {
      return gone();
    }
  }

  return null;
}

// ============================================================================
// Section 2: コンテンツタイプ別 Allowlist 判定
// ============================================================================
// 各コンテンツタイプの未登録 / 削除済 key を 410 化して Google に削除シグナル送信。
// Phase 9 で Fix 6 / Fix 7 / Fix 9 / 旧 ranking ロジック等の重複を 1 関数に集約。

function checkContentTypePolicy(
  pathname: string,
  baseUrl: string
): Response | null {
  // /ranking/prefecture/{slug} → /ranking/{slug} へ 301（known なら）/ 直接 410（unknown なら）
  if (pathname.startsWith('/ranking/prefecture/')) {
    const slug = pathname.slice('/ranking/prefecture/'.length).split('/')[0];
    if (!slug) return gone();
    if (UrlPolicy.ranking.isGone(slug) || !UrlPolicy.ranking.isKnown(slug))
      return gone();
    return NextResponse.redirect(new URL(`/ranking/${slug}`, baseUrl), {
      status: 301,
    });
  }

  // /ranking/{key}: GONE / 未登録は middleware で 410。
  // page の notFound() へ委譲すると OpenNext で HTTP 200 の soft-404 が固着しうる。
  if (pathname.startsWith('/ranking/')) {
    const rankingKey = pathname.slice('/ranking/'.length).split('/')[0];
    if (rankingKey) {
      if (
        UrlPolicy.ranking.isGone(rankingKey) ||
        !UrlPolicy.ranking.isKnown(rankingKey)
      ) {
        return gone();
      }
    }
  }

  // /tag/{tagKey}: 英語スラグ → 日本語キーへ 301、GONE / 未登録 → 410
  {
    const directTagMatch = pathname.match(/^\/tag\/([^/]+)\/?$/);
    if (directTagMatch) {
      const tagKey = decodeURIComponent(directTagMatch[1]);
      // 旧英語スラグを日本語キーへリダイレクト。
      // ★リダイレクト先が生きている場合のみ 301。死んでいるなら 301→410 のチェーンを作らず
      //   直接 410 を返す (本ファイル冒頭 UrlPolicy の規約「リダイレクト先が unknown なら直接 410」)。
      //   2026-07-24 実測: 8 件が 301 → 410 の 2 ホップになっていた
      //   (agricultural-processing→農産加工 等。記事が 0 本になったタグ)。
      const jaKey = REDIRECT_TAG_KEYS.get(tagKey);
      if (
        jaKey &&
        UrlPolicy.tag.isKnown(jaKey) &&
        !UrlPolicy.tag.isGone(jaKey)
      ) {
        return NextResponse.redirect(
          new URL(`/tag/${encodeURIComponent(jaKey)}`, baseUrl),
          { status: 301 }
        );
      }
      if (jaKey) return gone();
      if (UrlPolicy.tag.isGone(tagKey) || !UrlPolicy.tag.isKnown(tagKey))
        return gone();
    }
  }

  // /blog/tags?/{key}: 旧パス完全廃止 → 410
  if (/^\/blog\/tags?\/.+/.test(pathname)) {
    return gone();
  }

  // /blog/{slug}: redirect → 301、GONE → 410、旧カテゴリ名 → 410
  if (pathname.startsWith('/blog/')) {
    const slug = pathname.slice('/blog/'.length).split('/')[0];
    if (slug) {
      // 実在する /blog/tags ハブは動的 [slug] の allowlist 対象外。
      if (slug === 'tags' && pathname === '/blog/tags') return null;
      const newSlug = BLOG_SLUG_REDIRECTS[slug];
      if (newSlug) {
        return NextResponse.redirect(new URL(`/blog/${newSlug}`, baseUrl), {
          status: 301,
        });
      }
      if (UrlPolicy.blog.isGone(slug)) return gone();
      // 未公開記事: ページは notFound() を呼ぶが OpenNext がそれを prerender として
      // 焼き付けるため HTTP 200 +「記事が見つかりません」で固着する (2026-07-24 実測、11 件)。
      // middleware で前段短絡して確実に潰す。再公開時は生成物から自動で外れる。
      if (UrlPolicy.blog.isUnpublished(slug)) return gone();
      // 旧カテゴリ名が blog slug として解釈されるパターン
      if (OLD_CATEGORY_KEYS.has(slug)) return gone();
      // 公開記事カタログに無い slug を page の notFound() へ渡すと、OpenNext で
      // HTTP 200 +「記事が見つかりません」が固着しうるため前段で 410 にする。
      if (!UrlPolicy.blog.isKnownPublished(slug)) return gone();
    }
  }

  // /correlation: 探索 UI は廃止し、各ランキングページの「相関が高い指標」セクションに
  // 内部リンクで誘導する設計に移行（CorrelationSection 経由）。
  // /correlation 本体・配下パス・query 版すべて 410。
  if (pathname === '/correlation' || pathname.startsWith('/correlation/')) {
    return gone();
  }

  // /dashboard/* (legacy redirect でカバーされない亜種を捕捉)
  if (pathname.startsWith('/dashboard') || pathname.includes('/dashboard/')) {
    return gone();
  }

  // 市区町村テーマは `/themes/*` から分離した。地方財政は母集団監査中のため
  // 公開済み市区町村ハブへ恒久転送し、存在しない財政ランキングを見せない。
  if (pathname === '/themes/local-finance-city') {
    return NextResponse.redirect(new URL('/municipalities', baseUrl), 301);
  }

  // /themes/{unknown-slug} → 410
  if (pathname.startsWith('/themes/')) {
    const slug = pathname.slice('/themes/'.length).split('/')[0];
    if (slug && !UrlPolicy.theme.isKnown(slug)) {
      return gone();
    }
  }

  // /japan/{unknown-slug} → 410 (GEO-SCOPE-SEPARATION-01 WP5)。
  // /themes と同型の判定だが、UrlPolicy.japan は独立の known 集合を持つ
  // (education-culture pilot の1テーマのみ known。/themes の known とは意図的に別集合)。
  if (pathname.startsWith('/japan/')) {
    const slug = pathname.slice('/japan/'.length).split('/')[0];
    if (slug && !UrlPolicy.japan.isKnown(slug)) {
      return gone();
    }
  }

  if (pathname.startsWith('/municipalities/themes/')) {
    const slug = pathname.slice('/municipalities/themes/'.length).split('/')[0];
    if (slug && !UrlPolicy.municipality.isKnownTheme(slug)) return gone();
  }

  if (pathname.startsWith('/municipalities/ranking/')) {
    const key = pathname.slice('/municipalities/ranking/'.length).split('/')[0];
    if (key && !UrlPolicy.municipality.isKnownRanking(key)) return gone();
  }

  return null;
}

// ============================================================================
// Section 3: /areas/* の判定（無効 prefCode / cities / 非 indexable category）
// ============================================================================

function checkAreasPolicy(pathname: string, req: NextRequest): Response | null {
  const seg = pathname.split('/').filter(Boolean);
  if (seg[0] !== 'areas') return null;

  // Next.js 内部ルート（opengraph-image 等）は 410 対象外
  if (seg[2] === 'opengraph-image') return null;

  // /areas/{無効5桁コード}: cities セグメント以外は 410
  if (seg.length >= 2 && seg[1] !== 'cities') {
    if (/^\d{5}$/.test(seg[1]) && !UrlPolicy.area.isValidPrefCode(seg[1])) {
      return gone();
    }
  }

  // /areas/{prefCode}/{5桁数字} → 410（cityCode が areaCode 直下にきた異常パターン）
  if (
    seg.length >= 3 &&
    seg[1] !== 'cities' &&
    /^\d{5}$/.test(seg[2]) &&
    seg[2] !== seg[1]
  ) {
    return gone();
  }

  // /areas/{prefCode}/cities は一覧 route を持たない。
  if (seg.length === 3 && seg[2] === 'cities') return gone();

  // city / city-category は実在自治体と親県を静的マスタで検証する。
  // 未存在を page の notFound() に渡すと OpenNext で 200 soft-404 になりうる。
  if (seg.length >= 4 && seg[2] === 'cities') {
    const areaCode = seg[1];
    const cityCode = seg[3];
    if (
      !UrlPolicy.area.isValidPrefCode(areaCode) ||
      !UrlPolicy.city.isKnownUnderPrefecture(areaCode, cityCode)
    ) {
      return gone();
    }
    if (seg.length === 5 && !UrlPolicy.cityCategory.isKnown(seg[4])) {
      return gone();
    }
    if (seg.length > 5) return gone();
  }

  // /areas/{prefCode}/{categoryKey} → /areas/{prefCode}/{themeSlug} (301)
  // 旧カテゴリ別ページを対応するテーマページへリダイレクト
  const CATEGORY_TO_THEME: Record<string, string> = {
    population: 'population-dynamics',
    laborwage: 'labor-wages',
    economy: 'local-economy',
    agriculture: 'local-economy',
    miningindustry: 'manufacturing',
    construction: 'living-housing',
    commercial: 'local-economy',
    tourism: 'tourism',
    socialsecurity: 'healthcare',
    educationsports: 'education-culture',
    safetyenvironment: 'safety',
    landweather: 'climate',
    international: 'foreign-residents',
    administrativefinancial: 'local-finance',
    // テーマ未対応カテゴリ → エリアプロフィールへ
    energy: '',
    ict: '',
    infrastructure: '',
  };
  if (
    seg.length === 3 &&
    /^\d{5}$/.test(seg[1]) &&
    UrlPolicy.area.isValidPrefCode(seg[1]) &&
    seg[2] !== 'cities' &&
    !/^\d{5}$/.test(seg[2]) &&
    Object.prototype.hasOwnProperty.call(CATEGORY_TO_THEME, seg[2])
  ) {
    const themeSlug = CATEGORY_TO_THEME[seg[2]];
    // テーマスラグ空文字 = 対応テーマなし → エリアプロフィールへ
    const dest = themeSlug
      ? `/areas/${seg[1]}/${themeSlug}`
      : `/areas/${seg[1]}`;
    return NextResponse.redirect(new URL(dest, req.url), { status: 301 });
  }

  // /areas/{prefCode}/{themeSlug} — Type A テーマページは通過させる (410 対象外)
  // TYPE_A_THEME_SLUGS は module スコープに hoist 済 (per-request の new Set を回避)。
  if (
    seg.length === 3 &&
    /^\d{5}$/.test(seg[1]) &&
    UrlPolicy.area.isValidPrefCode(seg[1]) &&
    TYPE_A_THEME_SLUGS.has(seg[2])
  ) {
    return null; // Next.js に委譲
  }

  // /areas/{prefCode}/{non-indexable-category} → 410（カテゴリマップにもない場合）
  if (
    seg.length >= 3 &&
    /^\d{5}$/.test(seg[1]) &&
    UrlPolicy.area.isValidPrefCode(seg[1]) &&
    seg[2] !== 'cities' &&
    !/^\d{5}$/.test(seg[2]) &&
    !UrlPolicy.area.isIndexableCategory(seg[2])
  ) {
    return gone();
  }

  return null;
}

// ============================================================================
// Middleware Entry Point
// ============================================================================

export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // --- ホスト正規化: www → 非 www（301）---
  const host = req.headers.get('host') || '';
  if (host.startsWith('www.')) {
    const url = new URL(pathname, 'https://stats47.jp');
    url.search = req.nextUrl.search;
    return NextResponse.redirect(url, { status: 301 });
  }

  // --- Trailing slash 正規化（301）---
  if (pathname !== '/' && pathname.endsWith('/')) {
    const url = new URL(pathname.slice(0, -1), req.url);
    url.search = req.nextUrl.search;
    return NextResponse.redirect(url, { status: 301 });
  }

  // 公開済みX投稿などに残る旧 ranking slug を、同義の現行ページへ恒久転送する。
  // GONE / unknown 判定より前に処理し、UTM query は保持する。
  const legacyRankingMatch = pathname.match(/^\/ranking\/([^/]+)$/);
  if (legacyRankingMatch) {
    const destination = RANKING_SLUG_REDIRECTS[legacyRankingMatch[1]];
    if (destination) {
      const url = new URL('/ranking/' + destination, req.url);
      url.search = req.nextUrl.search;
      return NextResponse.redirect(url, 301);
    }
  }

  // 初期Geo X下書きが使っていた一覧ハブURLを、投稿の約束に合う専用landingへ移す。
  // UTMはそのまま保持し、投稿別の流入計測を壊さない。
  if (pathname === '/geo') {
    const campaign = req.nextUrl.searchParams.get('utm_campaign');
    const content = req.nextUrl.searchParams.get('utm_content');
    const landing =
      campaign === 'geo-001' && content === 'angle-experience'
        ? '/geo/compare'
        : (campaign === 'geo-016' && content === 'angle-howto') ||
            (campaign === 'geo-031' && content === 'shock')
          ? '/geo/method'
          : null;
    if (landing) {
      const url = new URL(landing, req.url);
      url.search = req.nextUrl.search;
      return NextResponse.redirect(url, 301);
    }
  }

  // --- Section 2: コンテンツタイプ別 Allowlist 判定 ---
  const cityRankingMatch = pathname.match(/^\/ranking\/([^/]+)$/);
  if (cityRankingMatch && req.nextUrl.searchParams.get('areaType') === 'city') {
    const rankingKey = cityRankingMatch[1];
    if (UrlPolicy.municipality.isKnownRanking(rankingKey)) {
      return NextResponse.redirect(
        new URL(`/municipalities/ranking/${rankingKey}`, req.url),
        301
      );
    }
    if (!UrlPolicy.ranking.isKnown(rankingKey)) return gone();
    return NextResponse.redirect(new URL(`/ranking/${rankingKey}`, req.url), 301);
  }

  // baseUrl は req.url 由来の origin を使う (preview/staging が prod へ 301 しないように)。
  const contentResponse = checkContentTypePolicy(pathname, req.url);
  if (contentResponse) return contentResponse;

  // --- Section 1: 旧 URL 構造の 301/410 ---
  const legacyResponse = tryLegacyRedirect(pathname, req.url);
  if (legacyResponse) return legacyResponse;

  // --- Section 3: /areas/* の判定 ---
  const areasResponse = checkAreasPolicy(pathname, req);
  if (areasResponse) return areasResponse;

  // --- 既存ルートへの query → path 正規化 301 ---
  // /{categoryKey} → /category/{categoryKey}
  {
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length === 1 && OLD_CATEGORY_KEYS.has(segments[0])) {
      return NextResponse.redirect(
        new URL(`/category/${segments[0]}`, req.url),
        { status: 301 }
      );
    }
  }

  // /areas/{areaCode}?category={key} → /areas/{areaCode}/{key}
  if (
    pathname.startsWith('/areas/') &&
    req.nextUrl.searchParams.has('category')
  ) {
    const pathSegments = pathname.split('/').filter(Boolean);
    if (pathSegments.length >= 2) {
      const categoryKey = req.nextUrl.searchParams.get('category');
      if (categoryKey) {
        const newUrl = new URL(`${pathname}/${categoryKey}`, req.url);
        const ranking = req.nextUrl.searchParams.get('ranking');
        if (ranking) newUrl.searchParams.set('ranking', ranking);
        return NextResponse.redirect(newUrl, { status: 301 });
      }
    }
  }

  // /ranking (索引ハブ) は 2026-06-15 に再設置（旧 `/` への 301 統合を撤回）。
  // app/ranking/page.tsx が SSG で描画するため middleware では素通りさせる。
  // 詳細ページ /ranking/{key} は checkContentTypePolicy で別途処理される。

  // /compare (廃止 2026-05-28) → /category/{key}/compare に統合
  // 旧 /compare/[categoryKey] と新 /category/[categoryKey]/compare は同じ categoryKey 名前空間。
  // canonical 競合解消とサイト構造の対称化が目的。クエリ ?areas=A,B は保持。
  // /compare 単体 (categoryKey なし) は旧実装と同じく population をデフォルトに使用。
  {
    const compareMatch = pathname.match(/^\/compare(?:\/([^/]+))?\/?$/);
    if (compareMatch) {
      const categoryKey = compareMatch[1] ?? 'population';
      const search = req.nextUrl.search;
      return NextResponse.redirect(
        new URL(`/category/${categoryKey}/compare${search}`, req.url),
        { status: 301 }
      );
    }
  }

  // /ports・/fishing-ports (廃止 2026-05-28) → /themes に統合
  //  - /ports → /themes/ports (港湾テーマ新設)
  //  - /fishing-ports → /themes/fishery-marine (既存「漁業（水産業）」テーマ、漁港数を含む)
  // 独立ページを廃止し theme に一本化。クエリは保持。
  if (pathname === '/ports' || pathname === '/ports/') {
    return NextResponse.redirect(
      new URL(`/themes/ports${req.nextUrl.search}`, req.url),
      { status: 301 }
    );
  }
  if (pathname === '/fishing-ports' || pathname === '/fishing-ports/') {
    return NextResponse.redirect(
      new URL(`/themes/fishery-marine${req.nextUrl.search}`, req.url),
      { status: 301 }
    );
  }
  // /station-passengers・/station-passengers/[prefCode] (廃止 2026-05-28) → /themes/railway に統合
  // 駅別乗降客数の県別バブルマップは鉄道テーマに集約。API (/api/station-passengers/*) も廃止。
  if (/^\/station-passengers(?:\/.*)?$/.test(pathname)) {
    return NextResponse.redirect(
      new URL(`/themes/railway${req.nextUrl.search}`, req.url),
      { status: 301 }
    );
  }
  // /maps/highway-timeline・/maps/highway-timeline/[year] (廃止 2026-05-28) → /themes/roads に統合
  // 高速道路時系列マップは道路テーマに集約。
  if (/^\/maps\/highway-timeline(?:\/.*)?$/.test(pathname)) {
    return NextResponse.redirect(
      new URL(`/themes/roads${req.nextUrl.search}`, req.url),
      { status: 301 }
    );
  }
  // /gis-cross・/gis-cross/* (廃止 2026-05-29) → /themes に統合
  //  - migration-flow → /themes/population-dynamics (人口移動フローを人口動態テーマに埋め込み)
  //  - depopulation-medical → /themes/healthcare (過疎×医療マップを医療テーマに埋め込み)
  //  - sunshine-map → /themes/climate (気候テーマ新設、日照地図を埋め込み)
  //  - hub → /themes
  // 具体 path を先に判定し、最後にハブをフォールバック。クエリは保持。
  if (/^\/gis-cross\/migration-flow(?:\/.*)?$/.test(pathname)) {
    return NextResponse.redirect(
      new URL(`/themes/population-dynamics${req.nextUrl.search}`, req.url),
      { status: 301 }
    );
  }
  if (/^\/gis-cross\/depopulation-medical(?:\/.*)?$/.test(pathname)) {
    return NextResponse.redirect(
      new URL(`/themes/healthcare${req.nextUrl.search}`, req.url),
      { status: 301 }
    );
  }
  if (/^\/gis-cross\/sunshine-map(?:\/.*)?$/.test(pathname)) {
    return NextResponse.redirect(
      new URL(`/themes/climate${req.nextUrl.search}`, req.url),
      { status: 301 }
    );
  }
  if (/^\/gis-cross(?:\/.*)?$/.test(pathname)) {
    return NextResponse.redirect(
      new URL(`/themes${req.nextUrl.search}`, req.url),
      { status: 301 }
    );
  }

  // /blog?q=... → /search?type=blog&...
  if (pathname === '/blog') {
    const sp = req.nextUrl.searchParams;
    const blogParamKeys = ['q', 'tags', 'year', 'month'];
    if (blogParamKeys.some((key) => sp.has(key))) {
      const url = new URL('/search', req.url);
      url.searchParams.set('type', 'blog');
      for (const key of blogParamKeys) {
        const value = sp.get(key);
        if (value) url.searchParams.set(key, value);
      }
      return NextResponse.redirect(url, { status: 301 });
    }
  }

  // パス名ヘッダーの追加（page.tsx 側で利用）
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-pathname', pathname);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  // Workers Cache は path/query を主キーとし、RSC ヘッダーは既定キーに含まれない。
  // HTML だけを共有キャッシュし、RSC / 認証・preview / 非安全メソッドは no-store にする。
  const cacheHeaders = resolvePageCacheHeaders(req, pathname);
  response.headers.set('Cache-Control', cacheHeaders.cacheControl);
  response.headers.set('Vary', cacheHeaders.vary);
  if (cacheHeaders.cloudflareCdnCacheControl) {
    response.headers.set(
      'Cloudflare-CDN-Cache-Control',
      cacheHeaders.cloudflareCdnCacheControl
    );
  }
  if (cacheHeaders.cacheTag) {
    response.headers.set('Cache-Tag', cacheHeaders.cacheTag);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * すべてのパスにマッチ。除外:
     * - _next/static / _next/image / favicon / 静的アセット
     * - api/ ルート（middleware を通す必要なし、Phase 9 で明示）
     */
    '/((?!_next/static|_next/image|api/|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)).*)',
  ],
};
