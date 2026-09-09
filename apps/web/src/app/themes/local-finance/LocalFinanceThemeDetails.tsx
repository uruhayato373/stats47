'use client';

import type { ComponentProps } from 'react';

import { LocalFinanceDashboard } from '@/features/local-finance-dashboard';
import { useThemePrefecture } from '@/features/theme-dashboard';


export function LocalFinanceThemeDetails({
  cards,
}: Pick<ComponentProps<typeof LocalFinanceDashboard>, 'cards'>) {
  const { selectedPrefectureCode, setSelected } = useThemePrefecture();
  if (!selectedPrefectureCode) {
    return (
      <p className="text-sm text-muted-foreground">
        都道府県を選ぶと、決算カードと市区町村の内訳を表示します。
      </p>
    );
  }

  return (
    <LocalFinanceDashboard
      cards={cards}
      embedded
      selectedPrefectureCode={selectedPrefectureCode.slice(0, 2)}
      onPrefectureChange={(code) => setSelected(`${code}000`)}
    />
  );
}
