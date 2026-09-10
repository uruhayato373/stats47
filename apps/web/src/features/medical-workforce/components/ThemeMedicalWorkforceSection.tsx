import { MEDICAL_WORKFORCE_SOURCE } from '@stats47/data-configs/theme-catalog';
import { fetchFromR2AsJson } from '@stats47/r2-storage/server';

import { ChartPanel } from '@/components/charts/ChartPanel';

import { parseMedicalWorkforceSnapshot } from '../lib/medical-workforce-snapshot';

import { ThemeMedicalWorkforceClient } from './ThemeMedicalWorkforceClient';

export async function ThemeMedicalWorkforceSection() {
  const raw = await fetchFromR2AsJson<unknown>(
    MEDICAL_WORKFORCE_SOURCE.r2Key
  ).catch(() => null);
  const snapshot = parseMedicalWorkforceSnapshot(raw);
  if (!snapshot)
    return (
      <ChartPanel title="診療科と年齢から見る医療人材">
        <p className="text-sm text-muted-foreground" role="status">
          現在、確認済みの医療人材データを取得できません。
        </p>
      </ChartPanel>
    );
  return <ThemeMedicalWorkforceClient snapshot={snapshot} />;
}
