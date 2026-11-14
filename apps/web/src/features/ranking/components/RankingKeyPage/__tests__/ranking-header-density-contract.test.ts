// @vitest-environment node
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
const PAGE_SHELL = readFileSync(
  path.resolve(
    process.cwd(),
    'src/features/ranking/components/RankingKeyPage/RankingPageClientShell.tsx'
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
  it('見出しは共通生成し、表示中の指標名・地域粒度・更新日を配線する', () => {
    expect(HEADER).toContain('buildRankingPageTitle(metricTitle, areaType)');
    expect(HEADER).not.toContain('description=');
    const header = PAGE_CLIENT.match(/<RankingHeaderPanel\b[\s\S]*?\/>/)?.[0];
    expect(header).toContain('metricTitle={displayInfo.title}');
    expect(header).toContain('areaType={currentAreaType}');
    expect(header).toContain('updatedAt={activeRankingItem.updatedAt}');
  });

  it('見出しの最新年は表示中の地域粒度の指標から取り、古さの基準の年はサーバーが渡す', () => {
    const header = PAGE_CLIENT.match(/<RankingHeaderPanel\b[\s\S]*?\/>/)?.[0];
    // 市区町村の指標は別の定義で、最新年が都道府県と同じとは限らないので、切り替え後の指標 (activeRankingItem) から取る
    expect(header).toContain('latestYear={activeRankingItem.latestYear}');
    expect(header).toContain('nowYear={nowYear}');
    // クライアントで new Date() を読むと、年をまたいだ ISR キャッシュとハイドレーションで表示が食い違う
    expect(PAGE_CLIENT).not.toContain('new Date(');
    expect(PAGE_SHELL).toContain('nowYear={new Date().getFullYear()}');
  });

  it('集計条件だけを可視化直下に置き、更新日の重複を防ぐ', () => {
    const visualizationIndex = PAGE_CLIENT.indexOf(
      '<RankingVisualizationSection'
    );
    const detailsIndex = PAGE_CLIENT.indexOf('<RankingVisualizationDetails');

    expect(visualizationIndex).toBeGreaterThan(-1);
    expect(detailsIndex).toBeGreaterThan(visualizationIndex);
    const details = readFileSync(path.join(RANKING_COMPONENT_ROOT, 'RankingKeyPage/RankingVisualizationDetails.tsx'), 'utf8');
    expect(details).not.toContain('updatedAt');
    expect(details).not.toContain('最終更新');
  });

  it('全国の基準値 (全国値 / 単純平均) と推移は共通ヘッダーカードだけで一度表示する', () => {
    expect(PAGE_CLIENT.match(/<RankingHeaderStats\b/g)).toHaveLength(1);
    expect(PAGE_CLIENT).not.toContain('NationalTrendCard');
    expect(PAGE_MODEL).not.toContain('readNationalTrendFromR2');

    const trendRenderers = findRankingComponentFiles(RANKING_COMPONENT_ROOT)
      .filter((file) => {
        const src = readFileSync(file, 'utf8');
        return src.includes('<NumericTrendChart') && src.includes('NationalFigure');
      })
      .map((file) => path.relative(RANKING_COMPONENT_ROOT, file));

    expect(trendRenderers).toEqual([
      path.join('RankingHeader', 'RankingNationalAverageStat.tsx'),
    ]);
  });

  it('基準値と単位は折り返さず、軸と変化率を省いて年ごとの値を読める', () => {
    expect(NATIONAL_AVERAGE_STAT).toContain('whitespace-nowrap');
    expect(NATIONAL_AVERAGE_STAT).not.toContain('selectedYear=');
    expect(NATIONAL_AVERAGE_STAT).not.toContain('ChartLegend');
    expect(NATIONAL_AVERAGE_STAT).toContain('<ChartPanel');
    expect(NATIONAL_AVERAGE_STAT).not.toContain('<ChartCard');
    expect(NATIONAL_AVERAGE_STAT).toContain('showAxes={false}');
    expect(NATIONAL_AVERAGE_STAT).toContain('tooltipItems=');
    expect(NATIONAL_AVERAGE_STAT).not.toContain('periodChange');
  });
});
