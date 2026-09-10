import { FREIGHT_OD_SOURCE } from '@stats47/data-configs/theme-catalog';
import { fetchFromR2AsJson } from '@stats47/r2-storage/server';

import { ChartPanel } from '@/components/charts/ChartPanel';

import { parseFreightOdSnapshot } from '../lib/freight-od-snapshot';

import { ThemeFreightOdClient } from './ThemeFreightOdClient';

export async function ThemeFreightOdSection() {
  const raw = await fetchFromR2AsJson<unknown>(FREIGHT_OD_SOURCE.r2Key).catch(
    () => null
  );
  const snapshot = parseFreightOdSnapshot(raw);
  if (!snapshot)
    return (
      <div data-theme-component-key="freight-od" data-data-state="unavailable">
        <ChartPanel title="貨物の発地と着地">
          <p role="status" className="text-sm text-muted-foreground">
            現在、確認済みのデータを取得できません。
          </p>
        </ChartPanel>
      </div>
    );
  return <ThemeFreightOdClient snapshot={snapshot} />;
}
