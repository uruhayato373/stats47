import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { medicalWorkforceFixture } from '../../lib/__tests__/medical-workforce-fixture';
import { parseMedicalWorkforceSnapshot } from '../../lib/medical-workforce-snapshot';
import { ThemeMedicalWorkforceClient } from '../ThemeMedicalWorkforceClient';

const selection = vi.hoisted(() => ({ code: null as string | null }));
vi.mock('@/features/theme-dashboard', () => ({
  useThemePrefecture: () => ({ selectedPrefectureCode: selection.code }),
}));
// The feature tests real ChartPanel and Table; unrelated footer menus are reduced to their actual source links.
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
});
const getSnapshot = () =>
  parseMedicalWorkforceSnapshot(medicalWorkforceFixture())!;

describe('医療人材profileの表示', () => {
  it('公式全国の14年齢階級と45診療科を別々の表で全件表示する', () => {
    render(<ThemeMedicalWorkforceClient snapshot={getSnapshot()} />);
    const tables = screen.getAllByRole('table');
    expect(tables).toHaveLength(2);
    expect(tables[0].getAttribute('aria-label')).toContain('全国（公式集計）');
    expect(tables[0].querySelectorAll('tbody tr')).toHaveLength(14);
    expect(tables[1].querySelectorAll('tbody tr')).toHaveLength(45);
    expect(
      within(tables[0]).getByRole('rowheader', { name: '85歳以上' })
    ).toBeTruthy();
    expect(
      within(tables[1]).getByRole('rowheader', { name: '不詳' })
    ).toBeTruthy();
    for (const table of tables) {
      expect(
        table.querySelector('tfoot [data-total-physicians]')?.textContent
      ).toBe('331,092');
      expect(table.parentElement?.className).toContain('overflow-auto');
      expect(table.className).toContain('min-w-96');
    }
  });
  it('共通選択県の変更で人数と分母を同時に切り替える', () => {
    const snapshot = getSnapshot();
    const { rerender, container } = render(
      <ThemeMedicalWorkforceClient snapshot={snapshot} />
    );
    selection.code = '01000';
    rerender(<ThemeMedicalWorkforceClient snapshot={snapshot} />);
    const area = snapshot.areas[0];
    expect(
      container
        .querySelector('[data-area-code]')
        ?.getAttribute('data-area-code')
    ).toBe('01000');
    const table = screen.getAllByRole('table')[0];
    expect(table.getAttribute('aria-label')).toContain('北海道');
    const share = Number(
      table.querySelector('tbody [data-share]')?.getAttribute('data-share')
    );
    expect(share).toBeCloseTo(
      (area.ages[0].physicians / area.totalPhysicians) * 100,
      12
    );
    expect(share).not.toBeCloseTo(
      (area.ages[0].physicians / snapshot.national.totalPhysicians) * 100
    );
    selection.code = '47000';
    rerender(<ThemeMedicalWorkforceClient snapshot={snapshot} />);
    expect(
      screen.getAllByRole('table')[1].getAttribute('aria-label')
    ).toContain('沖縄県');
  });
  it('各表から対応する公式原表へ到達できる', () => {
    render(<ThemeMedicalWorkforceClient snapshot={getSnapshot()} />);
    const links = screen.getAllByRole('link');
    expect(links[0].getAttribute('href')).toContain('statInfId=000040383757');
    expect(links[1].getAttribute('href')).toContain('statInfId=000040383773');
  });
  it('不正な選択コードで全国を代用しない', () => {
    selection.code = '99999';
    render(<ThemeMedicalWorkforceClient snapshot={getSnapshot()} />);
    expect(screen.queryByRole('table')).toBeNull();
    expect(screen.getByRole('status').textContent).toContain('選択した地域');
  });
});
