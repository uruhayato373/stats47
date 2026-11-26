// @vitest-environment node
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

// テストファイルの位置から src を決める。process.cwd() だとルートからの実行で落ちる (CI-TOOLING-FOLLOWUP-03)
const WEB_SRC = path.resolve(import.meta.dirname, '../../../../..');

const HEADER = readFileSync(
  path.resolve(
    WEB_SRC,
    'features/ranking/components/RankingHeader/RankingHeaderPanel.tsx'
  ),
  'utf8'
);
const PAGE_CLIENT = readFileSync(
  path.resolve(
    WEB_SRC,
    'features/ranking/components/RankingKeyPage/RankingKeyPageClient.tsx'
  ),
  'utf8'
);
const PAGE_SHELL = readFileSync(
  path.resolve(
    WEB_SRC,
    'features/ranking/components/RankingKeyPage/RankingPageClientShell.tsx'
  ),
  'utf8'
);
const PAGE_MODEL = readFileSync(
  path.resolve(
    WEB_SRC,
    'features/ranking/services/load-ranking-page-model.ts'
  ),
  'utf8'
);
const NATIONAL_AVERAGE_STAT = readFileSync(
  path.resolve(
    WEB_SRC,
    'features/ranking/components/RankingHeader/RankingNationalAverageStat.tsx'
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
  WEB_SRC,
  'features/ranking/components'
);

describe('ranking header density contract', () => {
  it('見出しは共通生成し、表示中の指標名・更新日を配線する (題に地域の単位を重ねない)', () => {
    expect(HEADER).toContain('buildRankingPageTitle(metricTitle)');
    expect(HEADER).not.toContain('description=');
    const header = PAGE_CLIENT.match(/<RankingHeaderPanel\b[\s\S]*?\/>/)?.[0];
    expect(header).toContain('metricTitle={displayInfo.title}');
    // 題は都道府県と市区町村で同じ。地域の単位は枠の見出しと切り替えが示す (2026-11-26 オーナー決定)
    expect(header).not.toContain('areaType=');
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

  // 2026-11-26 オーナー決定: 地図と表を一番上に置き、上位・下位の 3 件はその下。集計条件と読み違いを防ぐ注意は
  // 地図の下・本文の先頭に常に出さず、「統計の定義」(開閉式) の中に畳む
  it('地図と表を上位・下位の 3 件より先に置き、集計条件と注意は統計の定義の中に畳む', () => {
    const visualizationIndex = PAGE_CLIENT.indexOf('<RankingVisualizationSection');
    const statsIndex = PAGE_CLIENT.indexOf('<RankingHeaderStats');
    expect(visualizationIndex).toBeGreaterThan(-1);
    expect(statsIndex).toBeGreaterThan(visualizationIndex);
    expect(PAGE_CLIENT).not.toContain('RankingVisualizationDetails');
    expect(PAGE_CLIENT).toContain('definitionDetail={definitionDetail}');

    const sections = readFileSync(path.join(RANKING_COMPONENT_ROOT, 'RankingKeyPage/RankingPageContentSections.tsx'), 'utf8');
    expect(sections).toMatch(/<RankingDefinitionCard[\s\S]*condition=\{definitionDetail\}[\s\S]*note=/);
    // 注意を本文の先頭に段落として出さない
    expect(sections).not.toMatch(/\{dataNote && \(\s*<p/);
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
