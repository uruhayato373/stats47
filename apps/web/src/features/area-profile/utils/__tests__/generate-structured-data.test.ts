import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/env', () => ({
  getRequiredBaseUrl: vi.fn(() => 'https://stats47.jp'),
}));

import {
  generateAreaProfileBreadcrumbStructuredData,
  generateAreaProfileStructuredData,
} from '../generate-structured-data';

import type { AreaHighlight, AreaHighlights } from '@stats47/area-profile';

const mockProfile = { areaCode: '13000', areaName: '東京都' };

function highlight(label: string, rank: number, direction: 'top' | 'bottom'): AreaHighlight {
  return {
    rankingKey: `key-${label}`,
    label,
    value: rank,
    unit: '件',
    rank,
    year: '2023年',
    yearNumber: 2023,
    category: `cat-${label}`,
    source: '社会・人口統計体系',
    isKakei: false,
    direction,
    tone: 'neutral',
  };
}

const highlights: AreaHighlights = {
  top: [highlight('人口', 1, 'top'), highlight('県内総生産', 1, 'top')],
  bottom: [highlight('森林面積割合', 45, 'bottom')],
};

describe('generateAreaProfileBreadcrumbStructuredData', () => {
  it('BreadcrumbList 形式の構造化データを生成する', () => {
    const result = generateAreaProfileBreadcrumbStructuredData({
      profile: mockProfile,
    });

    expect(result).toMatchObject({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
    });
    const items = (result as { itemListElement: unknown[] }).itemListElement;
    expect(items).toHaveLength(3);
    expect(items[0]).toMatchObject({
      position: 1,
      name: 'ホーム',
      item: 'https://stats47.jp',
    });
    expect(items[1]).toMatchObject({ position: 2, name: '都道府県一覧' });
    expect(items[2]).toMatchObject({ position: 3, name: '東京都の特徴' });
  });
});

describe('generateAreaProfileStructuredData', () => {
  it('AdministrativeArea 形式の構造化データを生成する', () => {
    const result = generateAreaProfileStructuredData({ profile: mockProfile, highlights }) as Record<string, unknown>;

    expect(result['@type']).toBe('AdministrativeArea');
    expect(result.name).toBe('東京都');
    expect(result.url).toBe('https://stats47.jp/areas/13000');
  });

  it('additionalProperty は選定結果 (上位 → 下位) をそのまま使い、切り出さない', () => {
    const result = generateAreaProfileStructuredData({ profile: mockProfile, highlights }) as Record<string, unknown>;
    const props = result.additionalProperty as Array<Record<string, unknown>>;

    expect(props.map((p) => p.name)).toEqual(['人口', '県内総生産', '森林面積割合']);
    expect(props[0]).toMatchObject({ '@type': 'PropertyValue', value: 1, unitText: '件' });
  });

  it('選定結果が空の場合に additionalProperty を含まない', () => {
    const result = generateAreaProfileStructuredData({
      profile: mockProfile,
      highlights: { top: [], bottom: [] },
    }) as Record<string, unknown>;

    expect(result).not.toHaveProperty('additionalProperty');
  });
});
