import { buildFloodPrefDetail } from '@stats47/gis';
import { render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { loadGeoAnalysisPrefBundle, spatialAuditRows } from '@/features/geo-analysis';
import { manifestFixture } from '@/features/geo-analysis/lib/__tests__/geo-manifest-fixture';

import GeoArticleDataPage from '../page';

/**
 * 守る意図: 県別の検算ページの「この県の検算済み集計」は、1 つの値を大きく見せる箱をページで手組みせず、
 * 共通の数値タイル (StatTile) を数値タイルの格子 (StatTileGrid) に並べる (ui-components.md)。
 * 部品を替えても、出る名前・値・単位は県別データから作ったものと同じでなければならない。
 */

vi.mock('next/navigation', () => ({
  notFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock('@/features/geo-analysis', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/features/geo-analysis')>()),
  GeoSpatialEvidenceExplorer: () => null,
  loadGeoAnalysisPrefBundle: vi.fn(),
  spatialAuditRows: vi.fn(),
}));

const manifest = manifestFixture('population-flood-risk');

async function renderSummary(analysisSlug: string, detail: unknown) {
  vi.mocked(loadGeoAnalysisPrefBundle).mockResolvedValue({ manifest, detail } as never);
  render(await GeoArticleDataPage({ params: Promise.resolve({ analysisSlug, prefCode: '13' }) }));
  const heading = screen.getByRole('heading', { name: 'この県の検算済み集計' });
  const section = heading.closest('section') ?? heading.parentElement!.parentElement!;
  const grid = section.querySelector('[data-slot-kind="stat-tile-grid"]');
  const tiles = grid ? [...grid.querySelectorAll<HTMLElement>('[data-slot-kind="stat-tile"]')] : [];
  return { section, grid, tiles };
}

const tileText = (tile: HTMLElement) => ({
  label: within(tile).getByRole('term').textContent,
  value: within(tile).getAllByRole('definition')[0]!.textContent,
  meta: within(tile).getAllByRole('definition')[1]?.textContent,
});

describe('県別の検算ページの集計は数値タイルで出す', () => {
  beforeEach(() => {
    vi.mocked(loadGeoAnalysisPrefBundle).mockReset();
    vi.mocked(spatialAuditRows).mockReset();
  });

  it('集計値をそのまま出す分析は、集計の項目 1 つを数値タイル 1 枚にし、単位は値の直後に置く', async () => {
    const detail = buildFloodPrefDetail({
      generatedAt: manifest.generatedAt,
      areaCode: '13000',
      areaName: '東京都',
      meshes: [
        {
          meshId: '53394525',
          areaCode: '13000',
          longitude: 139.70625,
          latitude: 35.6041665,
          bounds: [139.7, 35.6, 139.7125, 35.608333],
          // メッシュの按分で人口には小数が残る (東京都の 2020年人口は 14,047,593.999)
          population2020: 1233.999,
          population2050: 800,
          floodDepthClass: 2,
        },
      ],
    });
    const { section, grid, tiles } = await renderSummary('population-flood-risk', detail);

    expect(grid).not.toBeNull();
    expect(tiles).toHaveLength(Object.keys(detail.summary).length);
    const byLabel = new Map(tiles.map((tile) => [tileText(tile).label, tileText(tile).value]));
    // 人数は整数に丸めて出す。丸め前の小数 (1,233.999人) のまま出さない (UI-FOLLOWUP-01)
    expect(detail.summary.population2020).toBe(1233.999);
    expect(byLabel.get('2020年人口')).toBe('1,234人');
    expect(byLabel.get('2050年人口')).toBe('800人');
    expect(byLabel.get('2020年区域内人口比率')).toBe(`${detail.summary.floodExposureShare2020}%`);
    expect(byLabel.get('浸水想定区域内メッシュ数')).toBe('1');
    // 手組みの箱 (border p-3) を残さない
    expect(section.querySelectorAll('div.border.p-3')).toHaveLength(0);
  });

  it('式で検算を見せる分析は、検算の行 1 つを数値タイル 1 枚にし、結果を値に、内訳の式を補足に出す', async () => {
    const rows = [
      { label: '1kmメッシュ人口の合計 / 国勢調査2020の都道府県人口', value: '一致', meta: '200人 / 200人' },
      { label: '平均標高5m以下の人口 / 県の人口', value: '25.0%', meta: '50人 / 200人' },
      { label: '5m以下の人口割合（平均標高基準 / 最低標高基準）', value: '25.0% / 30.0%', meta: undefined },
    ];
    vi.mocked(spatialAuditRows).mockReturnValue(rows);
    const { section, grid, tiles } = await renderSummary('population-low-elevation', {
      slug: 'population-low-elevation',
      areaCode: '13000',
      areaName: '東京都',
      meshes: [],
      summary: {},
    });

    expect(grid).not.toBeNull();
    expect(tiles.map(tileText)).toEqual(rows);
    expect(section.querySelectorAll('div.border.p-3')).toHaveLength(0);
    // 枠より長い数を途中で折り返す指定は数値タイルの側が持つ。ページの側で付け足さない
    for (const tile of tiles) {
      expect(tile).not.toHaveClass('wrap-anywhere');
      expect(tile.querySelector('dl')).toHaveClass('wrap-anywhere');
    }
  });
});
