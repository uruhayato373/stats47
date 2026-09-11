import { PROPERTY_PRICE_DISTRIBUTION_SOURCE } from '@stats47/data-configs/theme-catalog';
import { fetchFromR2AsJson } from '@stats47/r2-storage/server';

import { ChartPanel } from '@/components/charts/ChartPanel';

import { parsePropertyPriceDistributionSnapshot } from '../lib/property-price-distribution-snapshot';

import { ThemePropertyPriceDistributionClient } from './ThemePropertyPriceDistributionClient';

export async function ThemePropertyPriceDistributionSection() {
  const snapshot = await fetchFromR2AsJson<unknown>(
    PROPERTY_PRICE_DISTRIBUTION_SOURCE.r2Key
  )
    .then(parsePropertyPriceDistributionSnapshot)
    .catch(() => null);
  if (!snapshot)
    return (
      <ChartPanel title="住宅地の価格分布">
        <p role="status" className="text-sm text-muted-foreground">
          現在、確認済みの住宅地価格データを取得できません。
        </p>
      </ChartPanel>
    );
  return <ThemePropertyPriceDistributionClient snapshot={snapshot} />;
}
