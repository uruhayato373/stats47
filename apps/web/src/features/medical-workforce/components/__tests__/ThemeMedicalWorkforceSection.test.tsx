import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { medicalWorkforceFixture } from '../../lib/__tests__/medical-workforce-fixture';
import { ThemeMedicalWorkforceClient } from '../ThemeMedicalWorkforceClient';
import { ThemeMedicalWorkforceSection } from '../ThemeMedicalWorkforceSection';

const mocks = vi.hoisted(() => ({ fetch: vi.fn() }));
vi.mock('@stats47/r2-storage/server', () => ({
  fetchFromR2AsJson: mocks.fetch,
}));
vi.mock('@/features/theme-dashboard', () => ({
  useThemePrefecture: () => ({ selectedPrefectureCode: null }),
}));
vi.mock('@/components/charts/ChartFooter', () => ({ ChartFooter: () => null }));
afterEach(() => {
  cleanup();
  mocks.fetch.mockReset();
});

describe('医療人材の取得境界', () => {
  it('canonical R2キーだけを読み、検証済みpayloadをclientへ渡す', async () => {
    mocks.fetch.mockResolvedValue(medicalWorkforceFixture());
    const section = await ThemeMedicalWorkforceSection();
    expect(mocks.fetch).toHaveBeenCalledWith(
      'app/themes/healthcare/medical-workforce.json'
    );
    expect(section.type).toBe(ThemeMedicalWorkforceClient);
  });
  it('取得失敗時は確認できる状態だけを表示する', async () => {
    mocks.fetch.mockRejectedValue(new Error('unavailable'));
    render(await ThemeMedicalWorkforceSection());
    expect(screen.getByRole('status').textContent).toContain('取得できません');
    expect(screen.queryByRole('table')).toBeNull();
  });
  it('集計不一致のpayloadを表示しない', async () => {
    const data = medicalWorkforceFixture();
    data.areas[0].ages[0].physicians += 1;
    mocks.fetch.mockResolvedValue(data);
    render(await ThemeMedicalWorkforceSection());
    expect(screen.getByRole('status')).toBeTruthy();
    expect(screen.queryByRole('table')).toBeNull();
  });
});
