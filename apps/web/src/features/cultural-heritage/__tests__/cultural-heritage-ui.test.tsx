import { fetchFromR2AsJson } from '@stats47/r2-storage/server';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import {
  ThemePrefectureProvider,
  useThemePrefecture,
} from '@/features/theme-dashboard/components/ThemePrefectureContext';

import { ThemeCulturalHeritageClient } from '../components/ThemeCulturalHeritageClient';
import { ThemeCulturalHeritageSection } from '../components/ThemeCulturalHeritageSection';

import { culturalHeritageFixture } from './cultural-heritage-fixture';

vi.mock(
  '@/features/theme-dashboard',
  async () =>
    import('@/features/theme-dashboard/components/ThemePrefectureContext')
);
vi.mock('@stats47/r2-storage/server', () => ({ fetchFromR2AsJson: vi.fn() }));
function SelectControls() {
  const { setSelected } = useThemePrefecture();
  return (
    <>
      <button onClick={() => setSelected('20000')}>長野県に切替</button>
      <button onClick={() => setSelected('14000')}>神奈川県に切替</button>
      <button onClick={() => setSelected(null)}>全国に切替</button>
    </>
  );
}
const show = () =>
  render(
    <ThemePrefectureProvider initialAreaCode={null}>
      <SelectControls />
      <ThemeCulturalHeritageClient snapshot={culturalHeritageFixture()} />
    </ThemePrefectureProvider>
  );
beforeEach(() => {
  window.history.replaceState(null, '', '/themes/education-culture?pref=all');
  vi.clearAllMocks();
});
afterEach(cleanup);
it('national view separates 14 unassigned records and pages located records without duplicating the national total', () => {
  const { container } = show();
  expect(container.querySelector('[data-unique-total]')).toHaveAttribute(
    'data-unique-total',
    '167'
  );
  expect(
    within(
      screen.getByRole('table', { name: '地域を定めない文化財' })
    ).getAllByRole('row')
  ).toHaveLength(15);
  expect(
    within(
      screen.getByRole('table', { name: '全国の所在地が定められた文化財' })
    ).getAllByRole('row')
  ).toHaveLength(21);
  fireEvent.click(screen.getByRole('button', { name: '次へ' }));
  expect(screen.getByText('2 / 8ページ（153件）')).toBeInTheDocument();
});
it('county changes reset paging, include officially supplemented locations and preserve tourism links', () => {
  show();
  fireEvent.click(screen.getByRole('button', { name: '次へ' }));
  fireEvent.click(screen.getByRole('button', { name: '長野県に切替' }));
  expect(
    screen.getByRole('link', { name: '検査用文化財3073' })
  ).toHaveAttribute(
    'href',
    'https://kunishitei.bunka.go.jp/heritage/detail/401/3073'
  );
  expect(
    screen.getByRole('link', { name: '長野県の観光・旅行データを見る' })
  ).toHaveAttribute('href', '/themes/tourism?pref=20000');
  expect(
    screen.queryByRole('table', { name: '地域を定めない文化財' })
  ).not.toBeInTheDocument();
  expect(
    screen.getByText(/全国14件は、この県の一覧には配分していません/)
  ).toBeInTheDocument();
});
it('empty county applies only to the selected three-type scope', () => {
  show();
  fireEvent.click(screen.getByRole('button', { name: '神奈川県に切替' }));
  expect(screen.getByRole('status')).toHaveTextContent(
    '県内の文化財全体が0件という意味ではありません'
  );
});
it('kind filtering preserves missing geography and resets the page', () => {
  show();
  fireEvent.click(screen.getByRole('button', { name: '次へ' }));
  fireEvent.click(screen.getByRole('button', { name: '特別史跡' }));
  expect(screen.getByText('1 / 4ページ（66件）')).toBeInTheDocument();
  expect(
    screen.queryByRole('table', { name: '地域を定めない文化財' })
  ).not.toBeInTheDocument();
  expect(screen.getByText('選択した種類にはありません。')).toBeInTheDocument();
});
it('unavailable snapshot fails visibly without rendering invented empty counts', async () => {
  vi.mocked(fetchFromR2AsJson).mockRejectedValueOnce(new Error('unavailable'));
  render(await ThemeCulturalHeritageSection());
  expect(screen.getByRole('status')).toHaveTextContent(
    '確認済みの文化財所在地データを取得できません'
  );
  expect(screen.queryByRole('table')).not.toBeInTheDocument();
});
