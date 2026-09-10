import {
  parsePopulationCoreProfile,
  type PopulationCoreProfile,
} from '@stats47/data-configs/theme-catalog';
import { fetchFromR2AsJson } from '@stats47/r2-storage/server';

import { ChartPanel } from '@/components/charts/ChartPanel';

import { PROFILE_KEYS } from '../lib/population-profile-view';

import { ThemeMigrationDemographicsClient } from './ThemeMigrationDemographicsClient';
import { ThemePopulationPartitionClient } from './ThemePopulationPartitionClient';

async function loadProfile(key: string): Promise<PopulationCoreProfile | null> {
  try {
    return parsePopulationCoreProfile(await fetchFromR2AsJson<unknown>(key));
  } catch {
    return null;
  }
}
function Unavailable({ title }: { title: string }) {
  return (
    <ChartPanel title={title}>
      <p role="status" className="text-sm text-muted-foreground">
        現在、確認済みの人口データを取得できません。
      </p>
    </ChartPanel>
  );
}
export async function ThemeMigrationDemographicsSection() {
  const snapshot = await loadProfile(PROFILE_KEYS.migration);
  return snapshot?.kind === 'interprefecture-migration-demographics' ? (
    <ThemeMigrationDemographicsClient snapshot={snapshot} />
  ) : (
    <Unavailable title="年齢・男女別の県間移動" />
  );
}
export async function ThemeSingleHouseholdsSection() {
  const snapshot = await loadProfile(PROFILE_KEYS.households);
  return snapshot?.kind === 'single-households-demographics' ? (
    <ThemePopulationPartitionClient snapshot={snapshot} />
  ) : (
    <Unavailable title="ひとり暮らし世帯の男女・年齢構成" />
  );
}
export async function ThemeFiveYearResidenceSection() {
  const snapshot = await loadProfile(PROFILE_KEYS.residence);
  return snapshot?.kind === 'five-year-residence' ? (
    <ThemePopulationPartitionClient snapshot={snapshot} />
  ) : (
    <Unavailable title="5年前にはどこに住んでいたか" />
  );
}

export function ThemeYoungMigrationLink() {
  return (
    <p className="text-sm">
      <a
        href="#theme-section-candidate-43"
        className="inline-flex min-h-11 items-center text-primary underline underline-offset-4"
      >
        若年層の県間移動を年齢・男女別の表で確認する
      </a>
    </p>
  );
}
