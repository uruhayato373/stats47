import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import routesJson from '../../../../../data/content/routes.json';
import { HREF_ROUTES, hrefFor, type HrefRouteName } from '../href';
import { contentIdFromHref } from '../index';

describe('hrefFor (routes.json から href を組み立てる)', () => {
  it('名前ごとの route id が routes.json に実在し、id の末尾のパラメータ名が pattern と一致する', () => {
    const byId = new Map(routesJson.routes.map((route) => [route.id, route] as const));
    for (const [name, id] of Object.entries(HREF_ROUTES)) {
      const route = byId.get(id);
      expect(route, `${name} → ${id}`).toBeDefined();
      expect(id.split(':').slice(2), name).toEqual(route!.parameters);
      expect(route!.pattern.match(/\[([^\]]+)\]/g)?.map((p) => p.slice(1, -1)), name).toEqual(route!.parameters);
    }
  });

  it('組み立てた href は contentIdFromHref で同じ route へ戻る (往復)', () => {
    const samples: { [N in HrefRouteName]?: { params: Record<string, string>; id: string } } = {
      ranking: { params: { rankingKey: 'total-population' }, id: 'ranking:total-population' },
      theme: { params: { themeSlug: 'population' }, id: 'theme:population' },
      'area-theme': { params: { areaCode: '13000', themeSlug: 'population' }, id: 'area-theme:13000:population' },
      'municipality-ranking': { params: { rankingKey: 'x' }, id: 'municipality-ranking:x' },
    };
    for (const [name, sample] of Object.entries(samples)) {
      const href = hrefFor(name as HrefRouteName, sample!.params as never);
      expect(contentIdFromHref(href), href).toBe(sample!.id);
    }
    expect(hrefFor('ranking', { rankingKey: 'total-population' })).toBe('/ranking/total-population');
    expect(hrefFor('area-theme', { areaCode: '13000', themeSlug: 'population' })).toBe('/areas/13000/population');
    expect(hrefFor('geo-stage', { analysisSlug: 'flood', prefCode: '13', stage: 'overlap' })).toBe('/geo/flood/13/overlap');
    expect(hrefFor('geo-data', { analysisSlug: 'flood', prefCode: '13' })).toBe('/geo/data/flood/13');
    expect(hrefFor('product-from-note', { slug: 'p-04', noteKey: 'n1a' })).toBe('/products/p-04/from/note/n1a');
  });

  it('ブラウザ部品から読むので routes.json 以外を import しない (tags.json 128KB をヘッダーへ入れない)', () => {
    const source = readFileSync(fileURLToPath(new URL('../href.ts', import.meta.url)), 'utf8');
    const imports = [...source.matchAll(/^import .* from '([^']+)';$/gm)].map((m) => m[1]);
    expect(imports).toEqual(['../../../../data/content/routes.json']);
  });
});
