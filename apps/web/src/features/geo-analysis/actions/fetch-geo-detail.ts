'use server';

import { GEO_PREF_CODES } from '@stats47/data-configs/business-plan';

import { GEO_CROSS_ANALYSIS_SLUGS } from '../lib/geo-cross-analysis';
import { isTimestamp } from '../lib/geo-runtime-contract';
import { loadGeoAnalysisPrefBundle } from '../lib/load-geo-analysis-evidence';

export async function fetchGeoDetailAction(
  slug: string,
  prefCode: string,
  expected: { generatedAt: string; sha256: string }
) {
  // 入力文字列を取得先へ引き継がず、git定義の有限集合からキーを選び直す。
  const canonicalSlug = GEO_CROSS_ANALYSIS_SLUGS.find((value) => value === slug);
  const canonicalPrefCode = GEO_PREF_CODES.find((value) => value === prefCode);
  if (
    !canonicalSlug ||
    !canonicalPrefCode ||
    !expected ||
    !isTimestamp(expected.generatedAt) ||
    !/^[a-f0-9]{64}$/.test(expected.sha256)
  )
    return null;
  const bundle = await loadGeoAnalysisPrefBundle(canonicalSlug, canonicalPrefCode);
  const artifact = bundle?.manifest.stages
    .find((stage) => stage.id === 'population-mesh')
    ?.outputs.find((output) => output.areaCode === `${canonicalPrefCode}000`);
  if (
    !bundle ||
    bundle.manifest.generatedAt !== expected.generatedAt ||
    artifact?.sha256 !== expected.sha256
  )
    return null;
  return bundle.detail;
}
