import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { RankingHeaderPanel } from '../RankingHeaderPanel';

describe('RankingHeaderPanel', () => {
  it('表示対象を変更すると見出しと更新日を一緒に更新する', () => {
    const { container, rerender } = render(<RankingHeaderPanel metricTitle="年間日照時間"
      areaType="prefecture" updatedAt="2026-11-06T02:30:00Z" />);
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading.textContent).toBe('都道府県別 年間日照時間ランキング');
    expect(heading.closest('header')?.querySelector('time')?.dateTime).toBe('2026-11-06');
    expect(container.querySelectorAll('time')).toHaveLength(1);

    rerender(<RankingHeaderPanel metricTitle="総人口" areaType="city" updatedAt="2026-10-15" />);
    expect(heading.textContent).toBe('市区町村別 総人口ランキング');
    expect(container.querySelector('time')?.textContent).toBe('2026-10-15');
    expect(container.textContent).not.toContain('2026-11-06');
  });

  it.each([undefined, null, '', 'invalid'])('更新日 %s は推測で補わず省略する', (updatedAt) => {
    const { container } = render(<RankingHeaderPanel metricTitle="総人口" areaType="prefecture" updatedAt={updatedAt} />);
    expect(container.querySelector('time')).toBeNull();
    expect(container.textContent).not.toContain('最終更新');
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('都道府県別 総人口ランキング');
  });
});
