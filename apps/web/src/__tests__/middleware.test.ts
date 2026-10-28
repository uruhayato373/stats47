import { NextRequest, NextResponse } from 'next/server';

import { afterAll, beforeAll, describe, expect, test } from 'vitest';

import { KNOWN_THEME_SLUGS } from '../config/known-theme-slugs';
import { AREA_CATEGORY_TO_THEME, LEGACY_THEME_PATH_REDIRECTS } from '../config/legacy-theme-redirects';
import middleware, { isValidPrefCode } from '../middleware';

describe('isValidPrefCode', () => {
  test('01000 から 47000 までの有効な都道府県コードを true と判定する', () => {
    expect(isValidPrefCode('01000')).toBe(true);
    expect(isValidPrefCode('13000')).toBe(true);
    expect(isValidPrefCode('27000')).toBe(true);
    expect(isValidPrefCode('47000')).toBe(true);
  });

  test('prefNum が範囲外のコードを false と判定する', () => {
    expect(isValidPrefCode('00000')).toBe(false);
    expect(isValidPrefCode('48000')).toBe(false);
    expect(isValidPrefCode('99000')).toBe(false);
  });

  test('末尾が 000 でないコードを false と判定する（市区町村コードなど）', () => {
    expect(isValidPrefCode('14100')).toBe(false);
    expect(isValidPrefCode('13101')).toBe(false);
    expect(isValidPrefCode('01001')).toBe(false);
  });

  test('5 桁数字でないコードを false と判定する', () => {
    expect(isValidPrefCode('')).toBe(false);
    expect(isValidPrefCode('1000')).toBe(false);
    expect(isValidPrefCode('100000')).toBe(false);
    expect(isValidPrefCode('abcde')).toBe(false);
    expect(isValidPrefCode('01a00')).toBe(false);
  });
});

describe('廃止された県OGP URL', () => {
  test.each(['19000', '13000', '99000'])(
    '%s は県テーマの200エラー画面へ流さず410/noindexを返す', (code) => {
      const req = new NextRequest(`https://stats47.jp/areas/${code}/opengraph-image?old=1`);
      Object.defineProperty(req, 'nextUrl', { value: new URL(req.url) });
      const response = middleware(req);
      expect(response.status).toBe(410);
      expect(response.headers.get('X-Robots-Tag')).toBe('noindex');
    }
  );
});

describe('middleware Workers Cache headers', () => {
  const originalNext = NextResponse.next;

  beforeAll(() => {
    NextResponse.next = () => new NextResponse();
  });

  afterAll(() => {
    NextResponse.next = originalNext;
  });

  function request(headers?: HeadersInit): NextRequest {
    const nextRequest = new NextRequest('https://stats47.jp/', { headers });
    Object.defineProperty(nextRequest, 'nextUrl', {
      value: new URL(nextRequest.url),
    });
    return nextRequest;
  }

  test('通常HTMLには共有cache tagを付ける', () => {
    const response = middleware(request());

    expect(response.headers.get('Cache-Control')).toBe(
      'public, max-age=0, must-revalidate'
    );
    expect(response.headers.get('Cloudflare-CDN-Cache-Control')).toContain(
      'max-age=86400'
    );
    expect(response.headers.get('Cache-Tag')).toBe(
      'stats47-html,stats47-path:%2F'
    );
  });

  test('RSC requestはno-storeかつcache tag無しにする', () => {
    const response = middleware(
      request({ RSC: '1', 'Next-Router-State-Tree': '[]' })
    );

    expect(response.headers.get('Cache-Control')).toBe('private, no-store');
    expect(response.headers.get('Cloudflare-CDN-Cache-Control')).toBeNull();
    expect(response.headers.get('Cache-Tag')).toBeNull();
    expect(response.headers.get('Vary')).toContain('Next-Router-State-Tree');
  });
});

describe('Geo X旧ハブURLのlanding移行', () => {
  const originalNext = NextResponse.next;

  beforeAll(() => {
    NextResponse.next = () => new NextResponse();
  });

  afterAll(() => {
    NextResponse.next = originalNext;
  });

  function request(query: string): NextRequest {
    const nextRequest = new NextRequest(`https://stats47.jp/geo?${query}`);
    Object.defineProperty(nextRequest, 'nextUrl', {
      value: new URL(nextRequest.url),
    });
    return nextRequest;
  }

  test('意思決定投稿を1県4問比較へUTM付きで移す', () => {
    const response = middleware(
      request(
        'utm_source=x&utm_medium=social&utm_campaign=geo-001&utm_content=angle-experience'
      )
    );

    expect(response.status).toBe(301);
    expect(response.headers.get('location')).toBe(
      'https://stats47.jp/geo/compare?utm_source=x&utm_medium=social&utm_campaign=geo-001&utm_content=angle-experience'
    );
  });

  test('方法投稿を方法・限界ページへ移す', () => {
    const response = middleware(
      request(
        'utm_source=x&utm_medium=social&utm_campaign=geo-016&utm_content=angle-howto'
      )
    );

    expect(response.status).toBe(301);
    expect(response.headers.get('location')).toContain('/geo/method?');
  });

  test('通常のGeoハブ閲覧はリダイレクトしない', () => {
    expect(middleware(request('utm_source=internal')).status).not.toBe(301);
  });

  test('単一指標だった旧Geo URLをランキングへUTM付きで統合する', () => {
    const nextRequest = new NextRequest(
      'https://stats47.jp/geo/2050-population?utm_source=x&utm_medium=social&utm_campaign=geo-001&utm_content=angle-howto'
    );
    Object.defineProperty(nextRequest, 'nextUrl', {
      value: new URL(nextRequest.url),
    });

    const response = middleware(nextRequest);

    expect(response.status).toBe(301);
    expect(response.headers.get('location')).toBe(
      'https://stats47.jp/ranking/future-population-change-rate-2050?utm_source=x&utm_medium=social&utm_campaign=geo-001&utm_content=angle-howto'
    );
  });
});

describe('旧 ranking slug の現行ページ移行', () => {
  const originalNext = NextResponse.next;

  beforeAll(() => {
    NextResponse.next = () => new NextResponse();
  });

  afterAll(() => {
    NextResponse.next = originalNext;
  });

  function request(pathname: string): NextRequest {
    const nextRequest = new NextRequest('https://stats47.jp' + pathname);
    Object.defineProperty(nextRequest, 'nextUrl', {
      value: new URL(nextRequest.url),
    });
    return nextRequest;
  }

  test.each([
    ['ssdse-c-lb021101', 'tuna-consumption-expenditure'],
    ['ssdse-c-lb061001', 'apple-consumption-expenditure'],
    ['ssdse-c-lb092007', 'gyoza-frozen-consumption-expenditure'],
    ['ssdse-c-lb101001', 'green-tea-consumption-expenditure'],
    ['ssdse-c-lb121101', 'soba-udon-dining-consumption-expenditure'],
    ['ssdse-d-md22', 'hobby-participation-rate-diy'],
    ['per-capita-kenmin-shotoku-h27', 'per-capita-prefectural-income-h27'],
  ])('%s を %s へ一段で301する', (source, destination) => {
    const response = middleware(
      request('/ranking/' + source + '?utm_source=x&utm_medium=social')
    );

    expect(response.status).toBe(301);
    expect(response.headers.get('location')).toBe(
      'https://stats47.jp/ranking/' +
        destination +
        '?utm_source=x&utm_medium=social'
    );
  });
});

describe('県別テーマURLの正規化', () => {
  const originalNext = NextResponse.next;

  beforeAll(() => {
    NextResponse.next = () => new NextResponse();
  });

  afterAll(() => {
    NextResponse.next = originalNext;
  });

  function request(pathname: string): NextRequest {
    const nextRequest = new NextRequest(`https://stats47.jp${pathname}`);
    Object.defineProperty(nextRequest, 'nextUrl', {
      value: new URL(nextRequest.url),
    });
    return nextRequest;
  }

  test('categoryKey と themeSlug が同じ tourism は自己リダイレクトしない', () => {
    expect(middleware(request('/areas/01000/tourism')).status).not.toBe(301);
  });
});

describe('/japan の未登録スラッグは 410 (GEO-SCOPE-SEPARATION-01 WP5)', () => {
  const originalNext = NextResponse.next;

  beforeAll(() => {
    NextResponse.next = () => new NextResponse();
  });

  afterAll(() => {
    NextResponse.next = originalNext;
  });

  function request(pathname: string): NextRequest {
    const nextRequest = new NextRequest(`https://stats47.jp${pathname}`);
    Object.defineProperty(nextRequest, 'nextUrl', {
      value: new URL(nextRequest.url),
    });
    return nextRequest;
  }

  test('known な /japan/education-culture は 410 を返さない', () => {
    const response = middleware(request('/japan/education-culture'));
    expect(response.status).not.toBe(410);
  });

  test.each([...KNOWN_THEME_SLUGS].filter((key) => !['ports', 'railway', 'roads'].includes(key)))('新規テーマの県別導線 /areas/28000/%s を受理する', (theme) => {
    expect(middleware(request(`/areas/28000/${theme}`)).status).toBe(200);
  });

  test('未登録スラッグ /japan/not-a-real-theme は 410 を返す (/themes と同型)', () => {
    const response = middleware(request('/japan/not-a-real-theme'));
    expect(response.status).toBe(410);
  });

  test('/japan (トップ、スラッグ無し) は 410 を返さない', () => {
    const response = middleware(request('/japan'));
    expect(response.status).not.toBe(410);
  });
});

describe('市区町村URLのknown集合と旧query移行', () => {
  const originalNext = NextResponse.next;

  beforeAll(() => {
    NextResponse.next = () => new NextResponse();
  });

  afterAll(() => {
    NextResponse.next = originalNext;
  });

  function request(pathname: string): NextRequest {
    const nextRequest = new NextRequest(`https://stats47.jp${pathname}`);
    Object.defineProperty(nextRequest, 'nextUrl', {
      value: new URL(nextRequest.url),
    });
    return nextRequest;
  }

  test('known theme/rankingは通し、unknownは410にする', () => {
    expect(
      middleware(request('/municipalities/themes/aging-society')).status
    ).not.toBe(410);
    expect(
      middleware(request('/municipalities/ranking/elderly-population-ratio'))
        .status
    ).not.toBe(410);
    expect(middleware(request('/municipalities/themes/not-real')).status).toBe(
      410
    );
    expect(middleware(request('/municipalities/ranking/not-real')).status).toBe(
      410
    );
  });

  test('公開済みcity queryは専用canonicalへ一段で301する', () => {
    const response = middleware(
      request('/ranking/elderly-population-ratio?areaType=city')
    );
    expect(response.status).toBe(301);
    expect(response.headers.get('location')).toBe(
      'https://stats47.jp/municipalities/ranking/elderly-population-ratio'
    );
  });

  test('県名×市区町村ランキングを持つ指標の県だけの絞り込みは県別ページへ301し、UTMは残す', () => {
    const response = middleware(
      request('/municipalities/ranking/manufacturing-shipment-amount?pref=23000&utm_source=x')
    );
    expect(response.status).toBe(301);
    expect(response.headers.get('location')).toBe(
      'https://stats47.jp/municipalities/ranking/manufacturing-shipment-amount/23000?utm_source=x'
    );
  });

  test('県名×市区町村ランキングのページ自体は通す (410 にしない)', () => {
    const response = middleware(
      request('/municipalities/ranking/manufacturing-shipment-amount/23000')
    );
    expect(response.status).not.toBe(410);
    expect(response.status).not.toBe(301);
  });

  test.each([
    '/municipalities/ranking/future-burden-ratio-city/23000', // 県別ページを作らない指標
    '/municipalities/ranking/manufacturing-shipment-amount/99000', // 不正な県コード
    '/municipalities/ranking/manufacturing-shipment-amount/23000/extra',
  ])('%s は 410 (soft-404 にしない)', (pathname) => {
    expect(middleware(request(pathname)).status).toBe(410);
  });

  test.each([
    // 自治体名の検索・ページ送りを伴う絞り込みは全国版に残す
    '/municipalities/ranking/manufacturing-shipment-amount?pref=23000&q=豊田',
    '/municipalities/ranking/manufacturing-shipment-amount?pref=23000&page=2',
    // 県別ページを作らない指標・不正な県コードは転送しない
    '/municipalities/ranking/future-burden-ratio-city?pref=23000',
    '/municipalities/ranking/manufacturing-shipment-amount?pref=99000',
  ])('%s は県別ページへ転送しない', (pathname) => {
    expect(middleware(request(pathname)).status).not.toBe(301);
  });

  test('旧市区町村テーマは市区町村ハブへ恒久転送する', () => {
    const response = middleware(request('/themes/local-finance-city'));
    expect(response.status).toBe(301);
    expect(response.headers.get('location')).toBe(
      'https://stats47.jp/municipalities'
    );
  });
});

describe('動的コンテンツの soft-404 防止', () => {
  const originalNext = NextResponse.next;

  beforeAll(() => {
    NextResponse.next = () => new NextResponse();
  });

  afterAll(() => {
    NextResponse.next = originalNext;
  });

  function request(pathname: string): NextRequest {
    const nextRequest = new NextRequest(`https://stats47.jp${pathname}`);
    Object.defineProperty(nextRequest, 'nextUrl', {
      value: new URL(nextRequest.url),
    });
    return nextRequest;
  }

  test('未登録 ranking key は page の notFound に委譲せず 410', () => {
    expect(
      middleware(request('/ranking/food-consumption-expenditure')).status
    ).toBe(410);
  });

  test('既知 ranking key は通過', () => {
    expect(
      middleware(request('/ranking/frozen-food-consumption-expenditure')).status
    ).not.toBe(410);
  });

  test('実在する政令指定都市の区は親県 URL で通過', () => {
    expect(middleware(request('/areas/04000/cities/04103')).status).not.toBe(
      410
    );
  });

  test('市区町村と親県が不一致なら 410', () => {
    expect(middleware(request('/areas/05000/cities/04103')).status).toBe(410);
  });

  test('存在しない市区町村とカテゴリは 410', () => {
    expect(middleware(request('/areas/04000/cities/04999')).status).toBe(410);
    expect(
      middleware(request('/areas/04000/cities/04100/not-a-category')).status
    ).toBe(410);
  });

  test('旧市区町村カテゴリは空ページを返さず市区町村プロフィールへ301', () => {
    const response = middleware(
      request('/areas/05000/cities/05212/population')
    );

    expect(response.status).toBe(301);
    expect(response.headers.get('location')).toBe(
      'https://stats47.jp/areas/05000/cities/05212'
    );
  });

  test('公開記事カタログに無い blog slug は 410、既知記事と tag ハブは通過', () => {
    expect(middleware(request('/blog/BarChartRace')).status).toBe(410);
    expect(
      middleware(request('/blog/yogurt-spending-prefecture-gap')).status
    ).not.toBe(410);
    expect(middleware(request('/blog/tags')).status).not.toBe(410);
  });

  test.each([
    'airport-count-vs-wind-power-plant-count-facility',
    'dam-count-prefecture-gap',
    'dam-count-vs-road-expressway-length',
  ])('公開終了ブログ %s は旧R2本文の有無にかかわらず410', (slug) => {
    expect(middleware(request(`/blog/${slug}`)).status).toBe(410);
    expect(middleware(request(`/blog/${slug}?utm_source=old-link`)).status).toBe(410);
  });

  test('既にR2公開済みの記事は古いallowlist由来の410にしない', () => {
    expect(middleware(request('/blog/beer-peak-month-july-to-december')).status).not.toBe(410);
  });
});

describe('廃止ページ・旧カテゴリURLからテーマへの301 (表は config/legacy-theme-redirects.ts)', () => {
  // vitest.shims.ts の redirect は第 2 引数に数値しか受けない。本物の Next は { status } も受けるので合わせる。
  const originalRedirect = NextResponse.redirect;
  const originalNext = NextResponse.next;
  beforeAll(() => {
    NextResponse.redirect = ((url: string | URL, init?: number | ResponseInit) =>
      originalRedirect(url, typeof init === 'number' ? init : init?.status)) as typeof NextResponse.redirect;
    // 転送先がそのまま通過する (転送が続かない) ことを見るため、通過応答を作れるようにする
    NextResponse.next = () => new NextResponse();
  });
  afterAll(() => {
    NextResponse.redirect = originalRedirect;
    NextResponse.next = originalNext;
  });

  function legacyRequest(pathWithQuery: string): NextRequest {
    const req = new NextRequest(`https://stats47.jp${pathWithQuery}`);
    Object.defineProperty(req, 'nextUrl', { value: new URL(req.url) });
    return req;
  }

  test.each([
    ['/ports', '/themes/ports'],
    // 末尾スラッシュ付きも正規化と転送を 1 回の 301 で済ませる (/ports/ → /ports → … の 2 段にしない)
    ['/ports/', '/themes/ports'],
    ['/ports/?utm_source=x', '/themes/ports?utm_source=x'],
    ['/station-passengers/13000/', '/themes/railway'],
    ['/fishing-ports?x=1', '/themes/fishery-marine?x=1'],
    ['/station-passengers/13000', '/themes/railway'],
    ['/maps/highway-timeline/2020', '/themes/roads'],
    ['/gis-cross/migration-flow', '/themes/population-dynamics'],
    ['/gis-cross/depopulation-medical/x', '/themes/healthcare'],
    ['/gis-cross/sunshine-map?y=2', '/themes/climate?y=2'],
    ['/gis-cross/unknown', '/themes'],
    ['/gis-cross', '/themes'],
    ['/areas/13000/laborwage', '/areas/13000/labor-wages'],
    // 地方財政は県別テーマを持たず、先の規則で /themes/local-finance?pref= へ転送される
    ['/areas/13000/administrativefinancial', '/themes/local-finance?pref=13000'],
    ['/areas/13000/energy', '/areas/13000'],
  ])('%s を %s へ301する', (source, destination) => {
    const response = middleware(legacyRequest(source));
    expect(response.status).toBe(301);
    expect(response.headers.get('location')).toBe(`https://stats47.jp${destination}`);
  });

  /** 301 の転送先をもう一度 middleware に通し、転送が続かない (1 回で着地する) ことを確かめる */
  function expectSingleHop(source: string) {
    const first = middleware(legacyRequest(source));
    expect(first.status, source).toBe(301);
    const location = new URL(first.headers.get('location')!);
    const second = middleware(legacyRequest(`${location.pathname}${location.search}`));
    expect(second.status, `${source} → ${location.pathname}`).not.toBe(301);
  }

  test('廃止ページ表の全行が末尾スラッシュの有無にかかわらず 1 回の 301 で着地する', () => {
    const sources = ['/ports', '/fishing-ports', '/station-passengers', '/maps/highway-timeline', '/gis-cross/migration-flow', '/gis-cross/depopulation-medical', '/gis-cross/sunshine-map', '/gis-cross'];
    // 表に行を足したら sources にも足す (行と source の数が食い違うと落ちる)
    expect(sources.length).toBe(LEGACY_THEME_PATH_REDIRECTS.length);
    for (const source of sources) {
      expectSingleHop(source);
      expectSingleHop(`${source}/`);
    }
  });

  test('AREA_CATEGORY_TO_THEME の全行が先の規則に奪われず、表の転送先へ 1 回で着地する (死に行がない)', () => {
    for (const [categoryKey, themeSlug] of Object.entries(AREA_CATEGORY_TO_THEME)) {
      const response = middleware(legacyRequest(`/areas/13000/${categoryKey}`));
      const expected = themeSlug ? `/areas/13000/${themeSlug}` : '/areas/13000';
      expect(response.headers.get('location'), categoryKey).toBe(`https://stats47.jp${expected}`);
      expectSingleHop(`/areas/13000/${categoryKey}`);
    }
  });
});
