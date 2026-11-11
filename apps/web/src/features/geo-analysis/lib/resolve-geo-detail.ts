import { to5DigitPrefCode } from '@stats47/area';
import { GEO_PREF_CODES } from '@stats47/data-configs/business-plan';

import { GEO_CROSS_ANALYSIS_SLUGS } from './geo-cross-analysis';
import { isTimestamp } from './geo-runtime-contract';
import { loadGeoAnalysisPrefBundle } from './load-geo-analysis-evidence';

/**
 * 表示中の manifest (generatedAt + 県の population-mesh SHA) に固定した県 detail を返す。
 * Server Action (fetchGeoLayerAction) と GET route (/api/geo/analysis/...) が共用する。
 * 取得先の入力は git 定義の有限集合から選び直し、版が合わなければ null。
 */
export async function resolveGeoDetail(
  slug: string,
  prefCode: string,
  expected: { generatedAt: string; sha256: string }
) {
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
    ?.outputs.find((output) => output.areaCode === to5DigitPrefCode(canonicalPrefCode));
  if (
    !bundle ||
    bundle.manifest.generatedAt !== expected.generatedAt ||
    artifact?.sha256 !== expected.sha256
  )
    return null;
  return bundle.detail;
}
