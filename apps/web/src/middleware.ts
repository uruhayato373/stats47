import { type NextRequest, NextResponse } from 'next/server';

import { resolveGeoStageRoute } from '@stats47/data-configs/business-plan';
import { hrefFor } from '@stats47/data-configs/content/href';
import {
  MUNICIPALITY_THEME_FOR_PREFECTURE_THEME,
  isMunicipalityThemePageSlug,
  municipalityThemePageSlugFor,
} from '@stats47/data-configs/geo-scope/scope-theme-map';
import { SITE } from '@stats47/types';

import { AREA_THEME_SLUGS } from '@/features/theme-dashboard/config/area-theme-slugs';

import { resolvePageCacheHeaders } from '@/lib/cache-policy';
import { UrlPolicy } from '@/lib/url-policy';

import { BLOG_SLUG_REDIRECTS } from '@/config/blog-redirects';
import { GEO_BASELINE_REDIRECTS } from '@/config/geo-redirects';
import { LEGACY_CATEGORY_KEYS_SET } from '@/config/legacy-category-keys';
import { AREA_CATEGORY_TO_THEME, resolveLegacyThemePathRedirect } from '@/config/legacy-theme-redirects';
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
const TYPE_A_THEME_SLUGS = AREA_THEME_SLUGS;

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
      return NextResponse.redirect(new URL(hrefFor('area', { areaCode: key }), baseUrl), {
        status: 301,
      });
    }
    if (pageType === 'ranking' && key) {
      const destination = RANKING_SLUG_REDIRECTS[key];
      if (destination) {
        const url = new URL(baseUrl);
        url.pathname = hrefFor('ranking', { rankingKey: destination });
        return NextResponse.redirect(url, 301);
      }
      if (UrlPolicy.ranking.isGone(key) || !UrlPolicy.ranking.isKnown(key))
        return gone();
      return NextResponse.redirect(new URL(hrefFor('ranking', { rankingKey: key }), baseUrl), {
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
    return NextResponse.redirect(new URL(hrefFor('area', { areaCode: segments[1] }), baseUrl), {
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
    return NextResponse.redirect(new URL(hrefFor('area', { areaCode: segments[1] }), baseUrl), {
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
    return NextResponse.redirect(new URL(hrefFor('category', { categoryKey: segments[0] }), baseUrl), {
      status: 301,
    });
  }

  // OLD_CATEGORY_KEYS にマッチしない旧URL構造（subcategory 先頭等）+ dashboard/ranking + prefCode
  // 県名×市区町村ランキング (/municipalities/ranking/<key>/<県コード>) は旧構造ではない。判定は checkContentTypePolicy が行う
  if (
    segments.length >= 3 &&
    segments[0] !== 'municipalities' &&
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
    return NextResponse.redirect(new URL(hrefFor('ranking', { rankingKey: slug }), baseUrl), {
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
          new URL(hrefFor('tag', { tagKey: encodeURIComponent(jaKey) }), baseUrl),
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
        return NextResponse.redirect(new URL(hrefFor('blog', { slug: newSlug }), baseUrl), {
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
    // ページの slug は都道府県のテーマ名にそろえた (2026-10-31 IA-REGION-THEME-01)。旧 市区町村テーマの slug は 301
    if (slug && !isMunicipalityThemePageSlug(slug)) {
      const pageSlug = municipalityThemePageSlugFor(slug);
      if (!pageSlug) return gone();
      return NextResponse.redirect(new URL(hrefFor('municipality-theme', { themeSlug: pageSlug }), baseUrl), 301);
    }
  }

  if (pathname.startsWith('/municipalities/ranking/')) {
    const [key, prefCode, ...rest] = pathname.slice('/municipalities/ranking/'.length).split('/');
    if (key && !UrlPolicy.municipality.isKnownRanking(key)) return gone();
    // 県別ページは対象の指標 × 正しい県コードだけ。それ以外を page の notFound() に渡すと 200 の soft-404 になりうる
    if (
      prefCode &&
      (rest.length > 0 ||
        !UrlPolicy.municipality.hasPrefectureRanking(key) ||
        !UrlPolicy.area.isValidPrefCode(prefCode))
    ) {
      return gone();
    }
  }

  return null;
}

// ============================================================================
// Section 3: /areas/* の判定（無効 prefCode / cities / 非 indexable category）
// ============================================================================

function checkAreasPolicy(pathname: string, req: NextRequest): Response | null {
  const seg = pathname.split('/').filter(Boolean);
  if (seg[0] !== 'areas') return null;

  // 県 OGP は静的画像へ移行済みで、この route は存在しない。
  // themeSlug と誤認すると streamed notFound が HTTP 200 になるためここで廃止を返す。
  if (seg.length === 3 && seg[2] === 'opengraph-image') return gone();

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
    if (seg.length === 5) {
      // 市区町村×テーマ (2026-10-31 IA-REGION-THEME-01): 市区町村の対応があるテーマは通す
      if (
        TYPE_A_THEME_SLUGS.has(seg[4]) &&
        Object.prototype.hasOwnProperty.call(MUNICIPALITY_THEME_FOR_PREFECTURE_THEME, seg[4])
      ) {
        return null;
      }
      if (!UrlPolicy.cityCategory.isKnown(seg[4])) return gone();
      // 旧 市区町村×分野: 対応するテーマに市区町村のページがあればそこへ、無ければ市区町村のページへ 301
      const themeSlug = AREA_CATEGORY_TO_THEME[seg[4]];
      const dest =
        themeSlug && Object.prototype.hasOwnProperty.call(MUNICIPALITY_THEME_FOR_PREFECTURE_THEME, themeSlug)
          ? hrefFor('city-theme', { areaCode, cityCode, themeSlug })
          : hrefFor('city', { areaCode, cityCode });
      return NextResponse.redirect(new URL(dest, req.url), 301);
    }
    if (seg.length > 5) return gone();
  }

  // /areas/{prefCode}/{categoryKey} → /areas/{prefCode}/{themeSlug} (301)
  // 旧カテゴリ別ページを対応するテーマページへリダイレクト
  // 対応表は config/legacy-theme-redirects.ts (転送先の実在をテストで照合する)
  const CATEGORY_TO_THEME = AREA_CATEGORY_TO_THEME;
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
      ? hrefFor('area-theme', { areaCode: seg[1], themeSlug })
      : hrefFor('area', { areaCode: seg[1] });
    return NextResponse.redirect(new URL(dest, req.url), { status: 301 });
  }

  // /areas/{prefCode}/{themeSlug}/cities — 県内の市区町村を比べるページ (2026-10-31 IA-REGION-THEME-01)。
  // 市区町村のデータの対応 (MUNICIPALITY_THEME_FOR_PREFECTURE_THEME) があるテーマだけを通し、他は下の 410 に落とす
  if (
    seg.length === 4 &&
    seg[3] === 'cities' &&
    UrlPolicy.area.isValidPrefCode(seg[1]) &&
    TYPE_A_THEME_SLUGS.has(seg[2]) &&
    Object.prototype.hasOwnProperty.call(MUNICIPALITY_THEME_FOR_PREFECTURE_THEME, seg[2])
  ) {
    return null; // Next.js に委譲
  }
  // 市区町村の対応が無いテーマの `/cities` は 410 (page の notFound() は OpenNext で 200 soft-404 になりうる)。
  // tourism のようにカテゴリ名と同じテーマ名は、下のカテゴリの判定を通り抜けるのでここで止める
  if (seg.length === 4 && seg[3] === 'cities' && /^\d{5}$/.test(seg[1])) return gone();

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
    const url = new URL(pathname, SITE.origin);
    url.search = req.nextUrl.search;
    return NextResponse.redirect(url, { status: 301 });
  }

  // --- Trailing slash 正規化（301）---
  // 廃止ページ (/ports/ など) は正規化後の path で転送先を引き、301 を 1 回で着地させる。
  if (pathname !== '/' && pathname.endsWith('/')) {
    const normalized = pathname.slice(0, -1);
    const url = new URL(resolveLegacyThemePathRedirect(normalized) ?? normalized, req.url);
    url.search = req.nextUrl.search;
    return NextResponse.redirect(url, { status: 301 });
  }

  // 公開済みX投稿などに残る旧 ranking slug を、同義の現行ページへ恒久転送する。
  // GONE / unknown 判定より前に処理し、UTM query は保持する。
  const legacyRankingMatch = pathname.match(/^\/ranking\/(?:prefecture\/)?([^/]+)$/);
  if (legacyRankingMatch) {
    const destination = RANKING_SLUG_REDIRECTS[legacyRankingMatch[1]];
    if (destination) {
      const url = new URL('/ranking/' + destination, req.url);
      url.search = req.nextUrl.search;
      return NextResponse.redirect(url, 301);
    }
  }

  // 単一指標のコロプレスはGeo空間分析ではないため、指標ハブへ恒久統合する。
  // 公開済み・予約済みX投稿のUTM queryは保持する。
  const geoBaselineDestination = GEO_BASELINE_REDIRECTS[pathname];
  if (geoBaselineDestination) {
    const url = new URL(geoBaselineDestination, req.url);
    url.search = req.nextUrl.search;
    return NextResponse.redirect(url, 301);
  }

  const geoStage = resolveGeoStageRoute(pathname);
  if (geoStage?.kind === 'redirect') {
    const url = new URL(geoStage.canonical, req.url);
    url.search = req.nextUrl.search;
    url.searchParams.set('pref', geoStage.prefCode);
    url.searchParams.set('stage', geoStage.stage);
    return NextResponse.redirect(url, 301);
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

  // 県名×市区町村ランキングを持つ指標の「県だけの絞り込み」(`?pref=23000`) は県別ページへ恒久転送する
  // (MUNI-PREF-RANKING-ROUTE-01)。自治体名の検索 (q) やページ送り (page) を伴う絞り込みは全国版のまま残す。
  const municipalityRankingMatch = pathname.match(/^\/municipalities\/ranking\/([^/]+)$/);
  if (municipalityRankingMatch) {
    const rankingKey = municipalityRankingMatch[1];
    const params = req.nextUrl.searchParams;
    const prefCode = params.get('pref') ?? '';
    if (
      UrlPolicy.municipality.hasPrefectureRanking(rankingKey) &&
      UrlPolicy.area.isValidPrefCode(prefCode) &&
      !params.get('q') &&
      (params.get('page') ?? '1') === '1'
    ) {
      const url = new URL(
        hrefFor('municipality-pref-ranking', { rankingKey, prefCode }),
        req.url
      );
      url.search = req.nextUrl.search;
      for (const key of ['pref', 'q', 'page']) url.searchParams.delete(key);
      return NextResponse.redirect(url, 301);
    }
  }

  // 県ごとのページを持つテーマの「県だけの絞り込み」(`/themes/<テーマ>?pref=16000`) は、同じ内容の
  // `/areas/<県>/<テーマ>` へ恒久転送する (県×テーマの交点を 1 つの URL にする。2026-10-30 オーナー決定)。
  // 地方財政 (local-finance) は専用ページが ?pref で市区町村まで切り替えるので対象外。
  const themeMatch = pathname.match(/^\/themes\/([^/]+)$/);
  if (themeMatch && TYPE_A_THEME_SLUGS.has(themeMatch[1]) && themeMatch[1] !== 'local-finance') {
    const prefCode = req.nextUrl.searchParams.get('pref') ?? '';
    if (UrlPolicy.area.isValidPrefCode(prefCode)) {
      const url = new URL(hrefFor('area-theme', { areaCode: prefCode, themeSlug: themeMatch[1] }), req.url);
      url.search = req.nextUrl.search;
      url.searchParams.delete('pref');
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
    return NextResponse.redirect(
      new URL(hrefFor('ranking', { rankingKey }), req.url),
      301
    );
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
        new URL(hrefFor('category', { categoryKey: segments[0] }), req.url),
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
        new URL(`${hrefFor('category-compare', { categoryKey })}${search}`, req.url),
        { status: 301 }
      );
    }
  }

  // 廃止ページ (/ports・/fishing-ports・/station-passengers・/maps/highway-timeline・/gis-cross) → テーマへ 301。
  // 表と照合順は config/legacy-theme-redirects.ts。クエリは保持。
  const legacyThemeDestination = resolveLegacyThemePathRedirect(pathname);
  if (legacyThemeDestination) {
    return NextResponse.redirect(
      new URL(`${legacyThemeDestination}${req.nextUrl.search}`, req.url),
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
