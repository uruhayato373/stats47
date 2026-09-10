import { EARTHQUAKE_EXPOSURE_SOURCE } from '@stats47/data-configs/theme-catalog';
import { fetchFromR2AsString } from '@stats47/r2-storage/server';

import { ChartPanel } from '@/components/charts/ChartPanel';

import { parseEarthquakeExposureBundle } from '../lib/earthquake-exposure-bundle';

import { ThemeEarthquakeExposureClient } from './ThemeEarthquakeExposureClient';

export async function ThemeEarthquakeExposureSection() {
  const root = EARTHQUAKE_EXPOSURE_SOURCE.r2Root;
  const texts = await Promise.all([
    fetchFromR2AsString(`${root}/item.json`),
    fetchFromR2AsString(`${root}/manifest.json`),
    fetchFromR2AsString(`${root}/verification.json`),
  ]).catch(() => null);
  const bundle =
    texts &&
    typeof texts[0] === 'string' &&
    typeof texts[1] === 'string' &&
    typeof texts[2] === 'string'
      ? await parseEarthquakeExposureBundle({
          itemText: texts[0],
          manifestText: texts[1],
          verificationText: texts[2],
        })
      : null;
  if (!bundle)
    return (
      <div
        id="earthquake-population"
        data-theme-component-key="earthquake-population"
        data-data-state="unavailable"
      >
        <ChartPanel title="地震動の震度帯別にみる地域人口">
          <p className="text-sm text-muted-foreground" role="status">
            現在、確認済みの地震動と人口の集計を取得できません。
          </p>
        </ChartPanel>
      </div>
    );
  return <ThemeEarthquakeExposureClient snapshot={bundle.snapshot} />;
}
