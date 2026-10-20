import 'server-only';
import { readVerified } from '../../../../.claude/scripts/media/lib/storage.mjs';
import { RANKING_SAMPLE_ASSETS } from '@/lib/template-ranking-assets';
import { TREND_SAMPLE_ASSETS } from '@/lib/template-trend-assets';
import { COMPOSITION_SAMPLE_ASSETS } from '@/lib/template-composition-assets';

const SAMPLE_ASSETS = {
  'maximum-temperature-bars': RANKING_SAMPLE_ASSETS.bars,
  'maximum-temperature-table': RANKING_SAMPLE_ASSETS.table,
  'maximum-temperature-tile-map': RANKING_SAMPLE_ASSETS['tile-map'],
  ...TREND_SAMPLE_ASSETS,
  ...COMPOSITION_SAMPLE_ASSETS,
};

// Read the saved sample version. Missing/changed objects fail, never silently regenerate.
export async function templateSamplePng(id: string) {
  if (!Object.hasOwn(SAMPLE_ASSETS, id)) return null;
  return readVerified(SAMPLE_ASSETS[id as keyof typeof SAMPLE_ASSETS].png);
}
