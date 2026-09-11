import { AIRPORT_TRAFFIC_SOURCE } from '@stats47/data-configs/theme-catalog';
import { fetchFromR2AsJson } from '@stats47/r2-storage/server';

import { ChartPanel } from '@/components/charts/ChartPanel';

import { parseAirportTrafficSnapshot } from '../lib/airport-traffic-snapshot';

import { ThemeAirportTrafficClient } from './ThemeAirportTrafficClient';

export async function ThemeAirportTrafficSection() {
  const raw = await fetchFromR2AsJson<unknown>(
    AIRPORT_TRAFFIC_SOURCE.r2Key
  ).catch(() => null);
  const snapshot = parseAirportTrafficSnapshot(raw);
  if (!snapshot)
    return (
      <div
        data-theme-component-key="airport-traffic"
        data-data-state="unavailable"
      >
        <ChartPanel title="空港別の旅客と貨物">
          <p role="status" className="text-sm text-muted-foreground">
            現在、確認済みのデータを取得できません。
          </p>
        </ChartPanel>
      </div>
    );
  return <ThemeAirportTrafficClient snapshot={snapshot} />;
}
