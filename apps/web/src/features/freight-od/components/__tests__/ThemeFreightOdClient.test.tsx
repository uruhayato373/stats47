import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { freightOdFixture } from '../../lib/__tests__/freight-od-fixture';
import { freightOdSnapshotSchema } from '../../lib/freight-od-snapshot';
import { ThemeFreightOdClient } from '../ThemeFreightOdClient';
const selection = vi.hoisted(() => ({
  code: null as string | null,
  name: '全国',
}));
vi.mock('@/features/theme-dashboard', () => ({
  useThemePrefecture: () => ({
    selectedPrefectureCode: selection.code,
    selectedAreaName: selection.name,
  }),
}));
vi.mock('@/components/charts/ChartFooter', () => ({
  ChartFooter: ({
    source,
    sourceLink,
  }: {
    source: string;
    sourceLink: string;
  }) => <a href={sourceLink}>{source}</a>,
}));
afterEach(() => {
  cleanup();
  selection.code = null;
  selection.name = '全国';
});
const snapshot = () => freightOdSnapshotSchema.parse(freightOdFixture());
describe('貨物ODの県・機関・方向表示', () => {
  it('全国の47県別合計から相手県表示へ誘導する', () => {
    render(<ThemeFreightOdClient snapshot={snapshot()} />);
    expect(screen.getByRole('table').querySelectorAll('tbody tr')).toHaveLength(
      47
    );
    expect(screen.getByText(/ページ上部で都道府県を選ぶ/)).toBeTruthy();
  });
  it('選択県の発送先と到着元を切り替える', () => {
    selection.code = '01000';
    selection.name = '北海道';
    render(<ThemeFreightOdClient snapshot={snapshot()} />);
    const table = screen.getByRole('table');
    expect(table.textContent).toContain('26,922,653');
    fireEvent.click(screen.getByRole('button', { name: '到着元を見る' }));
    expect(table.querySelector('tfoot')?.textContent).toContain('0');
    expect(table.querySelectorAll('tbody tr')).toHaveLength(47);
  });
  it('海運に切り替えると暦年・フレートトンを表示する', () => {
    render(<ThemeFreightOdClient snapshot={snapshot()} />);
    fireEvent.click(screen.getByRole('button', { name: '海運' }));
    expect(screen.getByRole('table').getAttribute('aria-label')).toContain(
      '2024年（暦年）'
    );
    expect(
      screen.getByRole('columnheader', { name: '輸送量（フレートトン）' })
    ).toBeTruthy();
    expect(screen.getByRole('table').parentElement?.className).toContain(
      'overflow-auto'
    );
  });
  it('不正な県コードを全国で代用しない', () => {
    selection.code = '99999';
    render(<ThemeFreightOdClient snapshot={snapshot()} />);
    expect(screen.queryByRole('table')).toBeNull();
    expect(screen.getByRole('status')).toBeTruthy();
  });
});
