import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { RailPrefectureCard } from '../RailPrefectureCard';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

describe('RailPrefectureCard', () => {
  it('都道府県選択と一覧導線を独立したカードとして描画する', () => {
    render(
      <RailPrefectureCard
        prefectures={[
          { prefCode: '01000', prefName: '北海道' },
          { prefCode: '13000', prefName: '東京都' },
        ]}
      />
    );

    expect(
      screen.getByRole('region', { name: '都道府県から探す' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('combobox', { name: '都道府県から探す' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: '都道府県一覧を見る →' })
    ).toHaveAttribute('href', '/areas');
  });
});
