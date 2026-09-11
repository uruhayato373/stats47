import {
  TSUNAMI_EXPOSURE_SOURCE as source,
  parseTsunamiBundle,
} from '@stats47/data-configs/theme-catalog';
import { fetchFromR2AsString } from '@stats47/r2-storage/server';

import { ChartPanel } from '@/components/charts/ChartPanel';

import { ThemeTsunamiExposureClient } from './ThemeTsunamiExposureClient';
export async function ThemeTsunamiExposureSection() {
  const texts = await Promise.all(
    ['item', 'manifest', 'verification'].map((k) =>
      fetchFromR2AsString(`${source.r2Root}/${k}.json`)
    )
  ).catch(() => null);
  const bundle =
    texts && texts.every((t) => typeof t === 'string')
      ? await parseTsunamiBundle({
          itemText: texts[0]!,
          manifestText: texts[1]!,
          verificationText: texts[2]!,
        })
      : null;
  if (!bundle)
    return (
      <div
        id={source.sectionKey}
        data-theme-component-key={source.sectionKey}
        data-data-state="unavailable"
      >
        <ChartPanel title="津波の浸水深別にみる人口・公共施設">
          <p className="text-sm text-muted-foreground" role="status">
            現在、確認済みの集計を取得できません。
          </p>
        </ChartPanel>
      </div>
    );
  return <ThemeTsunamiExposureClient snapshot={bundle.snapshot} />;
}
