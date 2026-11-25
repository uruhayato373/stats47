import { fetchPrefectures } from '@stats47/area';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, it, expect, vi } from 'vitest';

const { trackMock } = vi.hoisted(() => ({ trackMock: vi.fn() }));
vi.mock('@/lib/analytics/events', () => ({
  trackNavClick: (...args: unknown[]) => trackMock(...args),
}));

import { buildAreaDirectoryData } from '../../utils/build-area-directory-data';
import { AreaSelectionPanels } from '../AreaSelectionPanels';

const data = buildAreaDirectoryData(fetchPrefectures());

beforeEach(() => {
  trackMock.mockReset();
});

describe('AreaSelectionPanels', () => {
  it('full は地図と一覧をタブなしで最初から両方描く (地図をタブの裏に隠さない)', () => {
    render(<AreaSelectionPanels {...data} surface="areas" />);
    expect(screen.queryAllByRole('tab')).toHaveLength(0);
    expect(
      screen.getByRole('group', { name: '地図から都道府県を選ぶ' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('navigation', { name: '都道府県一覧' })
    ).toBeInTheDocument();
  });

  it('一覧リンククリックで areas_list を計測する', () => {
    render(<AreaSelectionPanels {...data} surface="areas" />);
    // 一覧 (nav) 内の東京都リンクをクリック (地図タイルと区別する)
    const nav = screen.getAllByRole('navigation', { name: '都道府県一覧' })[0];
    fireEvent.click(
      within(nav).getByRole('link', { name: '東京都の統計を見る' })
    );
    expect(trackMock).toHaveBeenCalledWith(
      expect.objectContaining({ surface: 'areas_list', href: '/areas/13000' })
    );
  });

  it('地図タイルクリックで areas_map を計測する', () => {
    render(<AreaSelectionPanels {...data} surface="areas" />);
    const mapGroup = screen.getByRole('group', {
      name: '地図から都道府県を選ぶ',
    });
    fireEvent.click(
      within(mapGroup).getByRole('link', { name: '東京都の統計を見る' })
    );
    expect(trackMock).toHaveBeenCalledWith(
      expect.objectContaining({ surface: 'areas_map', href: '/areas/13000' })
    );
  });

  it('地図と一覧に 47 県のリンクを 1 組ずつ描く', () => {
    render(<AreaSelectionPanels {...data} surface="areas" />);
    expect(screen.getAllByRole('link')).toHaveLength(94);
  });

  it('embedded の地図・一覧クリックを配置別に計測する', () => {
    render(<AreaSelectionPanels {...data} variant="embedded" surface="home" />);

    const mapGroup = screen.getByRole('group', {
      name: '地図から都道府県を選ぶ',
    });
    fireEvent.click(
      within(mapGroup).getByRole('link', { name: '東京都の統計を見る' })
    );
    expect(trackMock).toHaveBeenCalledWith(
      expect.objectContaining({ surface: 'home_area_map' })
    );

    const directory = screen.getByRole('navigation', { name: '都道府県一覧' });
    fireEvent.click(
      within(directory).getByRole('link', { name: '東京都の統計を見る' })
    );
    expect(trackMock).toHaveBeenCalledWith(
      expect.objectContaining({ surface: 'home_area_list' })
    );
  });

  it('狭い幅の一覧への導線はボタンの見た目のリンクで、文字の矢印を書かない', () => {
    render(<AreaSelectionPanels {...data} variant="embedded" surface="home" />);
    const link = screen.getByRole('link', { name: '都道府県一覧から選ぶ' });
    expect(link).toHaveAttribute('href', '/areas');
    expect(link).toHaveAttribute('data-slot', 'button');
    expect(link.textContent).not.toContain('→');
  });
});
