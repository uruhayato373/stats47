'use client';

import type { ComponentProps } from 'react';

import { LocalFinanceDashboard } from '@/features/local-finance-dashboard';
import { useThemePrefecture } from '@/features/theme-dashboard';

export function LocalFinanceThemeClient(
  props: Omit<ComponentProps<typeof LocalFinanceDashboard>, 'prefCode'>
) {
  const { selectedPrefectureCode } = useThemePrefecture();
  return (
    <LocalFinanceDashboard
      {...props}
      prefCode={selectedPrefectureCode?.slice(0, 2) ?? null}
    />
  );
}
