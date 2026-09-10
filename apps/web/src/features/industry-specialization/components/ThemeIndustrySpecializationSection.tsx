import { INDUSTRY_SPECIALIZATION_SOURCE } from '@stats47/data-configs/theme-catalog';
import { fetchFromR2AsJson } from '@stats47/r2-storage/server';

import { ChartPanel } from '@/components/charts/ChartPanel';

import { parseIndustrySpecializationSnapshot } from '../lib/industry-specialization-snapshot';

import { ThemeIndustrySpecializationClient } from './ThemeIndustrySpecializationClient';

export async function ThemeIndustrySpecializationSection() {
  const raw = await fetchFromR2AsJson<unknown>(
    INDUSTRY_SPECIALIZATION_SOURCE.r2Key
  ).catch(() => null);
  const snapshot = parseIndustrySpecializationSnapshot(raw);
  if (!snapshot)
    return (
      <ChartPanel title="18業種の雇用構成を全国と比べる">
        <p className="text-sm text-muted-foreground" role="status">
          現在、確認済みの産業別雇用データを取得できません。
        </p>
      </ChartPanel>
    );
  return <ThemeIndustrySpecializationClient snapshot={snapshot} />;
}
