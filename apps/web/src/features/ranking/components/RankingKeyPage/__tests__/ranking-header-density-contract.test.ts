import { readFileSync } from 'node:fs';
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
});
