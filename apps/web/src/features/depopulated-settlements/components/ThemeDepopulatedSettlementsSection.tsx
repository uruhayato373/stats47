import { DEPOPULATED_SETTLEMENTS_SOURCE } from '@stats47/data-configs/theme-catalog';
import { fetchFromR2AsJson } from '@stats47/r2-storage/server';

import { ChartPanel } from '@/components/charts/ChartPanel';

import { parseDepopulatedSettlementsSnapshot } from '../lib/depopulated-settlements-snapshot';

import { ThemeDepopulatedSettlementsClient } from './ThemeDepopulatedSettlementsClient';

export async function ThemeDepopulatedSettlementsSection() {
  const raw = await fetchFromR2AsJson<unknown>(
    DEPOPULATED_SETTLEMENTS_SOURCE.r2Key
  ).catch(() => null);
  const snapshot = parseDepopulatedSettlementsSnapshot(raw);
  if (!snapshot)
    return (
      <ChartPanel title="過疎地域等の集落と高齢化">
        <p role="status" className="text-sm text-muted-foreground">
          現在、確認済みの集落プロフィールを取得できません。
        </p>
      </ChartPanel>
    );
  return <ThemeDepopulatedSettlementsClient snapshot={snapshot} />;
}
