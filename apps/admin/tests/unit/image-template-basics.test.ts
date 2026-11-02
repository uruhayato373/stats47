import { describe, expect, it } from 'vitest';
import {
  STATISTICAL_SAMPLES,
  basicTemplateQuery,
  imageTypeOfBuzzMap,
  templateCatalog,
  templateGroup,
} from '@/lib/image-template-basics';
import { readTemplates } from '../../../../.claude/scripts/media/lib/workspace.mjs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { TemplateStatisticalPreview } from '@/components/content/template-statistical-preview';

describe('representative statistics for image template basics', () => {
  it('lists each visual form once from the ledger, with purposes as an attribute', () => {
    const templates = readTemplates().templates;
    const catalog = templateCatalog(templates);
    expect(new Set(catalog.map((t) => t.id)).size).toBe(catalog.length);
    expect(catalog.map((t) => t.id)).not.toContain('unclassified');
    expect(catalog.map((t) => t.id)).not.toContain('note-cover');
    // Seven main statistical forms; maps are exactly the tile map and the real-shape map.
    expect(catalog.filter((t) => templateGroup(t) === 'chart').map((t) => t.id).sort()).toEqual(
      ['bar', 'choropleth', 'line', 'scatter', 'stacked-bar', 'table', 'tile-map']
    );
    // A purpose filter narrows the list without duplicating forms.
    expect(templateCatalog(templates, 'ranking').map((t) => t.id)).toEqual(expect.arrayContaining(['bar', 'table', 'tile-map']));
    expect(templateCatalog(templates, 'ranking').map((t) => t.id)).not.toContain('scatter');
    expect(templateCatalog([])).toEqual([]);
  });
  it('maps every buzz-map type to one drawing variant of the real-shape map', () => {
    const map = readTemplates().templates.find((t) => t.id === 'choropleth')!;
    const types = map.variants!.flatMap((v) => v.buzzMapTypes ?? []);
    expect(types.sort()).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'flow']);
    expect(new Set(types).size).toBe(types.length);
    const templates = readTemplates().templates;
    expect(imageTypeOfBuzzMap('C', templates)).toEqual({ templateId: 'choropleth', label: '地図（実際の形）・点', status: 'ready' });
    expect(imageTypeOfBuzzMap('F', templates)?.status).toBe('planned');
    expect(imageTypeOfBuzzMap('Z', templates)).toBeNull();
    expect(imageTypeOfBuzzMap(undefined, templates)).toBeNull();
  });
  it('removes article/media/sample choices from old bookmarks while retaining purpose and type', () => {
    expect(
      basicTemplateQuery({
        template: 'bar',
        purpose: 'ranking',
        topic: 'asset-example',
        medium: 'compare',
        'sample-x': 'old-image',
        'ratio-x': '2.38:1',
        selection: 'top-bottom',
        coverage: 'missing',
      })
    ).toEqual({ template: 'bar', purpose: 'ranking' });
    expect(
      basicTemplateQuery({ template: 'svg-bar', selection: 'top-bottom' })
    ).toEqual({ template: 'bar', purpose: 'ranking' });
  });
  it('preserves all three previously discussed household samples without adding a topic selector', () => {
    const household = STATISTICAL_SAMPLES.filter(
      (s) => s.templateId === 'bar' && s.purpose === 'comparison'
    );
    expect(household.map((s) => s.label)).toEqual([
      '名古屋市',
      '青森市',
      '札幌市',
    ]);
    const image = {
      src: '/candidate.png',
      imageId: 'test',
      width: 1080,
      height: 1350,
      kind: 'trial' as const,
    };
    const media = { note: image, web: image, x: image, instagram: image };
    const html = renderToStaticMarkup(
      createElement(TemplateStatisticalPreview, {
        samples: household.map((s) => ({ ...s, media })),
      })
    );
    expect(html.match(/<img /g)).toHaveLength(4);
    for (const channel of ['note', 'サイト', 'X', 'Instagram'])
      expect(html).toContain(channel);
    expect(html).toContain('家計支出の10分類');
    expect(html).toContain('ほかの検討見本を見る');
    expect(html).not.toContain('<select');
    expect(html).not.toContain('地域A');
  });
  it('keeps missing images explicit without filling them with fictional data', () => {
    const definition = STATISTICAL_SAMPLES.find(
      (s) => s.templateId === 'radar'
    )!;
    const html = renderToStaticMarkup(
      createElement(TemplateStatisticalPreview, {
        samples: [{ ...definition, media: {} }],
      })
    );
    expect(html).toContain('家計支出の10分類');
    expect(html.match(/サンプル画像を準備中/g)).toHaveLength(4);
    expect(html).not.toContain('<svg');
    expect(html).not.toContain('<img');
  });
  it('shows published layout references alongside the representative sample without an article picker', () => {
    const definition = STATISTICAL_SAMPLES.find((s) => s.id === 'maximum-temperature-tile-map')!;
    const html = renderToStaticMarkup(createElement(TemplateStatisticalPreview, {
      samples: [{ ...definition, media: {}, basisImages: [{ src: '/reference.png', label: 'noteの公開済み画像', pageUrl: 'https://note.com/example' }] }],
    }));
    expect(html).toContain('公開済みの基準画像');
    expect(html).toContain('/reference.png');
    expect(html).toContain('loading="eager"');
    expect(html).toContain('https://note.com/example');
    expect(html).not.toContain('<select');
  });
});
