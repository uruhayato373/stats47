
import { SHELTER_APPLICABILITY_SOURCE as source } from '@stats47/data-configs/theme-catalog';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { shelterApplicabilityFixture } from '../../lib/__tests__/shelter-applicability-fixture';
import { ThemeShelterApplicabilityClient } from '../ThemeShelterApplicabilityClient';
const selection = vi.hoisted(() => ({ code: null as string | null }));
vi.mock('@/features/theme-dashboard', () => ({
  useThemePrefecture: () => ({ selectedPrefectureCode: selection.code }),
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
});
describe('施設種別と災害対応を混ぜない県別表示', () => {
  it('全国8行と避難所3行を別表で表示し、表の内側でスクロールする', () => {
    const { container } = render(
      <ThemeShelterApplicabilityClient
        snapshot={shelterApplicabilityFixture()}
      />
    );
    const tables = screen.getAllByRole('table');
    expect(tables).toHaveLength(2);
    expect(tables[0]!.querySelectorAll('tbody tr')).toHaveLength(8);
    expect(tables[1]!.querySelectorAll('tbody tr')).toHaveLength(3);
    for (const t of tables)
      expect(t.parentElement?.className).toContain('overflow-auto');
    expect(
      container.querySelector('[data-hazard-key="flood"] [data-applicable]')
        ?.textContent
    ).toBe('71,994');
    expect(container.textContent).toContain('115,878');
    expect(container.textContent).toContain('83,294');
    expect(container.textContent).not.toContain('199,172');
  });
  it('共通県選択で該当する県の件数と名称へ切り替わる', () => {
    const s = shelterApplicabilityFixture();
    const { container, rerender } = render(
      <ThemeShelterApplicabilityClient snapshot={s} />
    );
    selection.code = '13000';
    rerender(<ThemeShelterApplicabilityClient snapshot={s} />);
    expect(
      screen.getByRole('table', { name: '東京都の指定緊急避難場所と災害種別' })
    ).toBeTruthy();
    expect(
      container.querySelector('[data-hazard-key="flood"] [data-applicable]')
        ?.textContent
    ).toBe(
      s.rows[12]!.emergency.hazards[0]!.applicable.toLocaleString('ja-JP')
    );
    expect(container.querySelector('[data-area-code="13000"]')).toBeTruthy();
  });
  it('空欄の意味と対象外、未登録、取得日、最新確認先を示す', () => {
    const { container } = render(
      <ThemeShelterApplicabilityClient
        snapshot={shelterApplicabilityFixture()}
      />
    );
    for (const text of [
      '空欄を非該当',
      '災害種別の集計は対象外',
      '未掲載施設を0件とは扱わず',
      '2026年9月11日取得',
      '指定日・開設日ではありません',
      '最新の指定状況・開設情報',
    ])
      expect(container.textContent).toContain(text);
    expect(
      screen
        .getByRole('link', { name: '国土地理院の指定避難場所・避難所の案内' })
        .getAttribute('href')
    ).toBe(source.confirmationUrl);
  });
  it('不正な県選択は0件表を表示しない', () => {
    selection.code = '99999';
    const { container } = render(
      <ThemeShelterApplicabilityClient
        snapshot={shelterApplicabilityFixture()}
      />
    );
    expect(screen.queryByRole('table')).toBeNull();
    expect(screen.getByRole('status').textContent).toContain(
      '地域を確認できません'
    );
    expect(
      container.querySelector('[data-data-state="unavailable"]')
    ).toBeTruthy();
  });
});
