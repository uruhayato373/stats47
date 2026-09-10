import { NUTRITION_SOURCE } from '@stats47/data-configs/theme-catalog';
import { fetchFromR2AsJson } from '@stats47/r2-storage/server';

import { ChartPanel } from '@/components/charts/ChartPanel';

import { parseNutritionSnapshot } from '../lib/nutrition-snapshot';

import { ThemeNutritionClient } from './ThemeNutritionClient';

export async function ThemeNutritionSection() {
  const raw = await fetchFromR2AsJson<unknown>(NUTRITION_SOURCE.r2Key).catch(() => null);
  const snapshot = parseNutritionSnapshot(raw);
  if (!snapshot) {
    return <ChartPanel title="栄養摂取量と推計の幅">
      <p className="text-sm text-muted-foreground" role="status">現在、確認済みの栄養摂取量データを取得できません。</p>
    </ChartPanel>;
  }
  return <ThemeNutritionClient snapshot={snapshot} />;
}
