import { GRADUATION_PATHS_SOURCE } from '@stats47/data-configs/theme-catalog';
import { fetchFromR2AsJson } from '@stats47/r2-storage/server';

import { ChartPanel } from '@/components/charts/ChartPanel';

import { parseGraduationPathsSnapshot } from '../lib/graduation-paths-snapshot';

import { ThemeGraduationPathsClient } from './ThemeGraduationPathsClient';

export async function ThemeGraduationPathsSection() {
  const raw = await fetchFromR2AsJson<unknown>(
    GRADUATION_PATHS_SOURCE.r2Key
  ).catch(() => null);
  const snapshot = parseGraduationPathsSnapshot(raw);
  if (!snapshot)
    return (
      <ChartPanel title="高校卒業後の進路">
        <p role="status" className="text-sm text-muted-foreground">
          現在、確認済みの高校卒業後の進路データを取得できません。
        </p>
      </ChartPanel>
    );
  return <ThemeGraduationPathsClient snapshot={snapshot} />;
}
