import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

const HEADER = readFileSync(
  path.resolve(
    process.cwd(),
    'src/features/ranking/components/RankingHeader/RankingHeaderPanel.tsx'
  ),
  'utf8'
);
const PAGE_CLIENT = readFileSync(
  path.resolve(
    process.cwd(),
    'src/features/ranking/components/RankingKeyPage/RankingKeyPageClient.tsx'
  ),
  'utf8'
);
const PAGE_MODEL = readFileSync(
  path.resolve(
    process.cwd(),
    'src/features/ranking/services/load-ranking-page-model.ts'
  ),
  'utf8'
);
const NATIONAL_AVERAGE_STAT = readFileSync(
  path.resolve(
    process.cwd(),
    'src/features/ranking/components/RankingHeader/RankingNationalAverageStat.tsx'
  ),
  'utf8'
);

function findRankingComponentFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory() && entry.name === '__tests__') return [];
    if (entry.isDirectory()) return findRankingComponentFiles(absolutePath);
    return entry.isFile() && entry.name.endsWith('.tsx') ? [absolutePath] : [];
  });
}

const RANKING_COMPONENT_ROOT = path.resolve(
  process.cwd(),
  'src/features/ranking/components'
);

describe('ranking header density contract', () => {
  it('ページ上部はH1だけを表示し、説明とメタ情報を重複させない', () => {
    expect(HEADER).not.toContain('description=');
    expect(HEADER).not.toContain('meta=');
  });

  it('説明と更新日は地図・テーブルの共通直下に置く', () => {
    const visualizationIndex = PAGE_CLIENT.indexOf(
      '<RankingVisualizationSection'
    );
    const detailsIndex = PAGE_CLIENT.indexOf('<RankingVisualizationDetails');

    expect(visualizationIndex).toBeGreaterThan(-1);
    expect(detailsIndex).toBeGreaterThan(visualizationIndex);
  });

  it('全国平均の値と推移は共通ヘッダーカードだけで一度表示する', () => {
    expect(PAGE_CLIENT.match(/<RankingHeaderStats\b/g)).toHaveLength(1);
    expect(PAGE_CLIENT).not.toContain('NationalTrendCard');
    expect(PAGE_MODEL).not.toContain('readNationalTrendFromR2');

    const trendRenderers = findRankingComponentFiles(RANKING_COMPONENT_ROOT)
      .filter((file) => readFileSync(file, 'utf8').includes('seriesName="全国平均"'))
      .map((file) => path.relative(RANKING_COMPONENT_ROOT, file));

    expect(trendRenderers).toEqual([
      path.join('RankingHeader', 'RankingNationalAverageStat.tsx'),
    ]);
  });

  it('480〜767pxで全国平均を横型に圧縮し、768px以上で縦型に戻す', () => {
    expect(NATIONAL_AVERAGE_STAT).toContain(
      '@sm:grid-cols-[minmax(0,1fr)_260px]'
    );
    expect(NATIONAL_AVERAGE_STAT).toContain('@md:block');
    expect(NATIONAL_AVERAGE_STAT).toContain('<SurfaceCard');
    expect(NATIONAL_AVERAGE_STAT).not.toContain('<ChartCard');
  });
});
