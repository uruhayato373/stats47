import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { RailDataDiscoveryCards } from '../RailDataDiscoveryCards';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

describe('RailDataDiscoveryCards', () => {
  it('3種類の探索導線を独立したカードとして描画する', () => {
    render(
      <RailDataDiscoveryCards
        categories={[{ categoryKey: 'population', categoryName: '人口・世帯' }]}
        themes={[{ themeKey: 'population-dynamics', title: '人口動態' }]}
        prefectures={[{ prefCode: '13000', prefName: '東京都' }]}
      />
    );

    expect(
      screen.getByRole('region', { name: 'カテゴリから探す' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('region', { name: 'テーマから探す' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('region', { name: '都道府県から探す' })
    ).toBeInTheDocument();
  });
});
