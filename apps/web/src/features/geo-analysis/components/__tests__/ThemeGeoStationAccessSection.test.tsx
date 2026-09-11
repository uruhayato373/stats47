import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../../lib/load-geo-analysis-snapshot', () => ({
  loadGeoAnalysisBundle: vi.fn(),
}));

import { loadGeoAnalysisBundle } from '../../lib/load-geo-analysis-snapshot';
import { ThemeGeoStationAccessSection } from '../ThemeGeoStationAccessSection';

describe('テーマGeo bundleの検証境界', () => {
  it('検証済みbundleが取れない場合に数値や地図を表示しない', async () => {
    vi.mocked(loadGeoAnalysisBundle).mockResolvedValue(null);
    render(await ThemeGeoStationAccessSection());
    expect(loadGeoAnalysisBundle).toHaveBeenCalledWith(
      'population-station-access'
    );
    expect(
      screen.getByText('現在、検証済みの駅アクセス分析データを取得できません。')
    ).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: '駅アクセスの分析詳細を見る' })
    ).toHaveAttribute('href', '/geo/population-station-access');
  });
});
