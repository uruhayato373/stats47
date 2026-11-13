import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { RankingHeaderPanel } from '../RankingHeaderPanel';

describe('RankingHeaderPanel', () => {
  it('表示対象を変更すると見出しと更新日を一緒に更新する', () => {
    const { container, rerender } = render(<RankingHeaderPanel metricTitle="年間日照時間"
      areaType="prefecture" updatedAt="2026-11-06T02:30:00Z" nowYear={2026} />);
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading.textContent).toBe('都道府県別 年間日照時間ランキング');
    expect(heading.closest('header')?.querySelector('time')?.dateTime).toBe('2026-11-06');
    expect(container.querySelectorAll('time')).toHaveLength(1);

    rerender(<RankingHeaderPanel metricTitle="総人口" areaType="city" updatedAt="2026-10-15" nowYear={2026} />);
    expect(heading.textContent).toBe('市区町村別 総人口ランキング');
    expect(container.querySelector('time')?.textContent).toBe('2026-10-15');
    expect(container.textContent).not.toContain('2026-11-06');
  });

  it.each([undefined, null, '', 'invalid'])('更新日 %s は推測で補わず省略する', (updatedAt) => {
    const { container } = render(<RankingHeaderPanel metricTitle="総人口" areaType="prefecture" updatedAt={updatedAt} nowYear={2026} />);
    expect(container.querySelector('time')).toBeNull();
    expect(container.textContent).not.toContain('最終更新');
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('都道府県別 総人口ランキング');
  });

  // 年が上部のカードの小見出しと年の切り替えにしか無く、古いデータが最初の画面で最新に見えていた
  // (週次 UI 検査 agent|ranking--old-2years)。h1 は検索結果のタイトルにも関わるので文言を変えず、直下に年を添える
  it('見出しの文言は変えず、見出しの直下に最新年を添える', () => {
    render(<RankingHeaderPanel metricTitle="総人口" areaType="prefecture" updatedAt="2026-11-06"
      latestYear={{ yearCode: '2023', yearName: '2023年度' }} nowYear={2026} />);
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading.textContent).toBe('都道府県別 総人口ランキング');

    const note = screen.getByText(/最新/);
    expect(note.textContent).toBe('最新 2023年度');
    expect(heading.contains(note)).toBe(false);
    expect(heading.closest('header')?.contains(note)).toBe(true);
    // 見出しより後 (直下) に置く
    expect(heading.compareDocumentPosition(note) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(note.getAttribute('data-stale')).toBeNull();
    expect(note.className).not.toContain('text-warning');
  });

  it('最新年が 10 年以上前のときだけ、色と語の両方で古いデータだと示す', () => {
    const { rerender } = render(<RankingHeaderPanel metricTitle="国民年金保険料全額免除割合" areaType="prefecture"
      latestYear={{ yearCode: '2006', yearName: '2006年度' }} nowYear={2026} />);
    const stale = screen.getByText(/最新/);
    expect(stale.textContent).toBe('最新 2006年度（10年以上前のデータ）');
    expect(stale.getAttribute('data-stale')).toBe('true');
    expect(stale.className).toContain('text-warning');

    // 境界: ちょうど 10 年前は古い扱い、9 年前は通常の表示
    rerender(<RankingHeaderPanel metricTitle="総人口" areaType="prefecture"
      latestYear={{ yearCode: '2016', yearName: '2016年' }} nowYear={2026} />);
    expect(screen.getByText(/最新/).textContent).toBe('最新 2016年（10年以上前のデータ）');

    rerender(<RankingHeaderPanel metricTitle="総人口" areaType="prefecture"
      latestYear={{ yearCode: '2017', yearName: '2017年' }} nowYear={2026} />);
    const fresh = screen.getByText(/最新/);
    expect(fresh.textContent).toBe('最新 2017年');
    expect(fresh.getAttribute('data-stale')).toBeNull();
  });

  it('年コードが 4 桁より長くても先頭 4 桁を年として古さを判定する', () => {
    render(<RankingHeaderPanel metricTitle="総人口" areaType="prefecture"
      latestYear={{ yearCode: '2006100000', yearName: '2006年度' }} nowYear={2026} />);
    expect(screen.getByText(/最新/).getAttribute('data-stale')).toBe('true');
  });

  it.each([undefined, null])('最新年 %s の指標は年を推測で補わず省略する', (latestYear) => {
    const { container } = render(<RankingHeaderPanel metricTitle="総人口" areaType="prefecture"
      updatedAt="2026-11-06" latestYear={latestYear} nowYear={2026} />);
    expect(container.textContent).not.toContain('最新 ');
    expect(container.querySelector('[data-latest-year]')).toBeNull();
  });

  it('年として読めない年コードは古いと決めつけず、年の名前だけを出す', () => {
    render(<RankingHeaderPanel metricTitle="総人口" areaType="prefecture"
      latestYear={{ yearCode: 'latest', yearName: '直近' }} nowYear={2026} />);
    const note = screen.getByText(/最新/);
    expect(note.textContent).toBe('最新 直近');
    expect(note.getAttribute('data-stale')).toBeNull();
  });
});
