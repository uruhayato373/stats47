import { FACTORY_INVESTMENT_SOURCE } from '@stats47/data-configs/theme-catalog';
import { fetchFromR2AsJson } from '@stats47/r2-storage/server';

import { ChartPanel } from '@/components/charts/ChartPanel';

import { parseFactoryInvestmentSnapshot } from '../lib/factory-investment-snapshot';

import { ThemeFactoryInvestmentClient } from './ThemeFactoryInvestmentClient';

export async function ThemeFactoryInvestmentSection() {
  const raw = await fetchFromR2AsJson<unknown>(
    FACTORY_INVESTMENT_SOURCE.r2Key
  ).catch(() => null);
  const snapshot = parseFactoryInvestmentSnapshot(raw);
  return snapshot ? (
    <ThemeFactoryInvestmentClient snapshot={snapshot} />
  ) : (
    <ChartPanel title="工場立地に伴う設備投資">
      <p className="text-sm text-muted-foreground" role="status">
        現在、確認済みの設備投資データを取得できません。
      </p>
    </ChartPanel>
  );
}
