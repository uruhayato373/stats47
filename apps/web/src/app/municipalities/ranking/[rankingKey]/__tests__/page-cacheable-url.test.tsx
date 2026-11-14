import { KNOWN_MUNICIPALITY_RANKING_KEYS, isMunicipalityPrefectureRankingKey } from '@stats47/data-configs/geo-scope';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { readMunicipalityRanking } from '@/features/municipalities/server';

import MunicipalityRankingPage, * as pageModule from '../page';

/**
 * 守る意図: 全国版の市区町村ランキングは 1 指標 1 URL でキャッシュする (2026-11-13)。
 * サーバーが出す HTML に ?pref= / ?page= / ?q= のリンクやフォームがあると、クローラーがそれを総なめにして
 * 1 回 1.5〜2 秒の描画を何千回も起こす。HTML にはクエリ付きの href を 1 つも出さず、上位 50 件だけを静的な表で出す。
 */

vi.mock('next/navigation', () => ({
  notFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock('@/features/municipalities/server', () => ({
  readMunicipalityRanking: vi.fn(),
  readMunicipalityRankingCommentary: vi.fn(async () => null),
  getComparableMunicipalityCodes: () => new Set<string>(),
  getSpecialWardCodes: () => new Set<string>(),
  MunicipalityRankingMapSection: () => <div data-testid="prefecture-map" />,
}));
vi.mock('@/features/municipalities', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/features/municipalities')>()),
  MunicipalityNationalMap: () => <div data-testid="national-map" />,
}));
vi.mock('@/features/content-navigation/RelatedContentNavigation', () => ({
  RelatedContentNavigation: () => null,
}));
vi.mock('@/features/ads', () => ({
  AdRow: () => null,
  RailAdSlot: () => null,
  composeAdRows: () => [[], []],
}));
vi.mock('@/features/products', () => ({
  findDataProductForMunicipalityRanking: () => null,
  TrackedProductLink: () => null,
}));
vi.mock('@stats47/data-configs/geo-scope', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@stats47/data-configs/geo-scope')>()),
  isMunicipalityPrefectureRankingKey: vi.fn(),
}));

const rankingKey = [...KNOWN_MUNICIPALITY_RANKING_KEYS][0]!;

const values = Array.from({ length: 120 }, (_, index) => ({
  areaCode: String(10000 + index),
  areaName: `${index < 60 ? '北海道' : '青森県'} 自治体${index}`,
  prefectureCode: index < 60 ? '01000' : '02000',
  value: 1200 - index,
  rank: index + 1,
}));

const item = {
  schemaVersion: 1 as const,
  generatedAt: '2026-11-01T00:00:00Z',
  rankingKey,
  title: '試験の指標',
  visualization: {} as never,
  description: '国の統計から市・町・村の値を比較します。',
  unit: '人',
  latestYear: { yearCode: '2020', yearName: '2020年' },
  entityPolicyKey: 'municipality',
  entityCount: 120,
  valueCount: 120,
  excludedEntityCount: 0,
  source: { name: '社会・人口統計体系', url: 'https://www.e-stat.go.jp/regional-statistics/ssdsview' },
};

const snapshot = {
  schemaVersion: 1 as const,
  generatedAt: '2026-11-01T00:00:00Z',
  rankingKey,
  yearCode: '2020',
  yearName: '2020年',
  unit: '人',
  count: values.length,
  values,
};

async function renderPage() {
  const element = await MunicipalityRankingPage({ params: Promise.resolve({ rankingKey }) });
  return renderToStaticMarkup(element);
}

beforeEach(() => {
  vi.mocked(readMunicipalityRanking).mockResolvedValue({ item, values: snapshot });
});

describe('市区町村ランキング全国版のページ', () => {
  it('URL のクエリで描き分けず、1 日キャッシュする (毎回描画にしない)', () => {
    const mod = pageModule as Record<string, unknown>;
    expect(mod.revalidate).toBe(86400);
    expect(mod.dynamic).toBeUndefined();
    expect(mod.generateStaticParams).toBeUndefined();
  });

  it.each([true, false])(
    '県別ページの有無 (%s) にかかわらず、HTML にクエリ付きの href と GET のフォームを出さない',
    async (hasPrefectureRankings) => {
      vi.mocked(isMunicipalityPrefectureRankingKey).mockReturnValue(hasPrefectureRankings);
      const html = await renderPage();
      const hrefs = [...html.matchAll(/href="([^"]*)"/g)].map((match) => match[1]);
      expect(hrefs.length).toBeGreaterThan(0);
      expect(hrefs.filter((href) => href.includes('?'))).toEqual([]);
      expect(html).not.toMatch(/<form\b/);
      expect(html).not.toContain('ランキングのページ');
    }
  );

  it('上位 50 件だけを静的な表で出し、全国地図を出す (県内の地図は出さない)', async () => {
    vi.mocked(isMunicipalityPrefectureRankingKey).mockReturnValue(false);
    const html = await renderPage();
    const tableRows = html.match(/<th[^>]*scope="row"/g) ?? [];
    expect(tableRows).toHaveLength(50);
    expect(html).toContain('50位');
    expect(html).not.toContain('51位');
    expect(html).toContain('data-testid="national-map"');
    expect(html).not.toContain('data-testid="prefecture-map"');
    expect(html).toContain('120件中 上位50件');
  });

  it('県別ページがある指標だけ、右レールの県チップを県別のパスへ結ぶ', async () => {
    vi.mocked(isMunicipalityPrefectureRankingKey).mockReturnValue(true);
    const withChips = await renderPage();
    expect(withChips).toContain(`href="/municipalities/ranking/${rankingKey}/01000"`);
    expect(withChips).toContain(`href="/municipalities/ranking/${rankingKey}/47000"`);

    vi.mocked(isMunicipalityPrefectureRankingKey).mockReturnValue(false);
    const withoutChips = await renderPage();
    expect(withoutChips).not.toContain(`/municipalities/ranking/${rankingKey}/01000`);
    expect(withoutChips).not.toContain('都道府県で絞り込む</');
  });
});
