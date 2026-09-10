import { TOURISM_SEASONALITY_SOURCE } from '@stats47/data-configs/theme-catalog';
import { fetchFromR2AsJson } from '@stats47/r2-storage/server';

import { ChartFooter } from '@/components/charts/ChartFooter';
import { ChartPanel } from '@/components/charts/ChartPanel';

import {
  parseTourismSeasonalitySnapshot,
  TOURISM_SEASONALITY_SNAPSHOT_KEY,
} from '../lib/tourism-seasonality-snapshot';

import { ThemeTourismSeasonalityClient } from './ThemeTourismSeasonalityClient';

export async function ThemeTourismSeasonalitySection() {
  const raw = await fetchFromR2AsJson<unknown>(
    TOURISM_SEASONALITY_SNAPSHOT_KEY
  ).catch(() => null);
  const snapshot = parseTourismSeasonalitySnapshot(raw);
  const definition = TOURISM_SEASONALITY_SOURCE;

  if (!snapshot) {
    return (
      <ChartPanel
        title="月別の延べ宿泊者数"
        footer={
          <ChartFooter
            source={definition.source.title}
            sourceLink={definition.source.url}
          />
        }
      >
        <p className="text-sm text-muted-foreground" role="status">
          現在、確認済みの月別宿泊データを取得できません。
        </p>
      </ChartPanel>
    );
  }

  return (
    <ThemeTourismSeasonalityClient
      snapshot={snapshot}
      notes={[...definition.notes]}
    />
  );
}
