import { describe, expect, test, vi } from 'vitest';

vi.mock('@/lib/env', () => ({ getRequiredBaseUrl: () => 'https://stats47.jp' }));

import { generateThemeBreadcrumbStructuredData, generateThemePageStructuredData } from '../generate-structured-data';

import type { ThemeConfig } from '../../types';

/**
 * テーマのページの構造化データ (2026-10-30)。県のページ (/areas/県/テーマ) は、テーマのページと同じ名前・URL を出していて、
 * どの県のページかが入っていなかった。名前・URL・説明・パンくずをその県のものにし、about に県を足す。
 */
const theme = {
  themeKey: 'living-housing',
  title: '暮らし・住まい',
  description: '住宅の余り方を比較する。',
  keywords: ['空き家'],
} as unknown as ThemeConfig;
const area = { areaCode: '16000', areaName: '富山県', description: '富山県の空き家比率は14.7%。' };

describe('generateThemePageStructuredData', () => {
  test('県のページは名前・URL・説明をその県のものにし、about に県を入れる', () => {
    const data = generateThemePageStructuredData(theme, area) as Record<string, unknown>;
    expect(data.name).toBe('富山県の暮らし・住まい');
    expect(data.url).toBe('https://stats47.jp/areas/16000/living-housing');
    expect(data.description).toBe('富山県の空き家比率は14.7%。');
    expect(JSON.stringify(data.about)).toContain('"@type":"AdministrativeArea","name":"富山県"');
  });

  test('テーマのページ (県なし) は今までどおりテーマの名前と URL', () => {
    const data = generateThemePageStructuredData(theme) as Record<string, unknown>;
    expect(data.name).toBe('暮らし・住まい');
    expect(data.url).toBe('https://stats47.jp/themes/living-housing');
  });
});

describe('generateThemeBreadcrumbStructuredData', () => {
  test('県のページは画面と同じく ホーム > 都道府県一覧 > 県 > テーマ', () => {
    const data = generateThemeBreadcrumbStructuredData(theme, area) as { itemListElement: Array<{ name: string; item?: string }> };
    expect(data.itemListElement.map((entry) => entry.name)).toEqual(['ホーム', '都道府県一覧', '富山県', '暮らし・住まい']);
    expect(data.itemListElement[2].item).toBe('https://stats47.jp/areas/16000');
  });
});
