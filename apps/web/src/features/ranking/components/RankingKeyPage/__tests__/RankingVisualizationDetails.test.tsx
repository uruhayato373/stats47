import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { RankingVisualizationDetails } from '../RankingVisualizationDetails';

describe('RankingVisualizationDetails', () => {
  it('集計条件と最終更新日を可視化の補足として表示する', () => {
    render(
      <RankingVisualizationDetails
        description="都道府県庁所在地・二人以上世帯・年間"
        updatedAt="2026-08-17"
      />
    );

    expect(
      screen.getByRole('region', { name: 'このデータについて' })
    ).toBeInTheDocument();
    expect(
      screen.getByText('都道府県庁所在地・二人以上世帯・年間')
    ).toBeInTheDocument();
    expect(screen.getByText('最終更新 2026-08-17')).toBeInTheDocument();
  });

  it('補足情報がなければ何も表示しない', () => {
    const { container } = render(<RankingVisualizationDetails />);
    expect(container).toBeEmptyDOMElement();
  });
});
