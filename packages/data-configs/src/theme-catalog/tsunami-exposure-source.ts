import { SITE } from '@stats47/types';
import data from '../../../../data/themes/sources/tsunami-exposure.json';

/**
 * File-specific approved inputs; A40 remains partially licensed globally.
 * 記録の正本は台帳 `themes.sources` (data/themes/sources/tsunami-exposure.json + Schema)。公開 R2 の基点 (publicBaseUrl) は台帳に書かず、ここで足す (項目の並びは移す前と同じ)。
 */
const { bands, coverage, inputs, evidence, scenarios, notes, expectedCountyFactsSha256, expectedIntermediates, ...head } = data;

export const TSUNAMI_EXPOSURE_SOURCE = {
  ...head,
  publicBaseUrl: SITE.r2PublicBaseUrl,
  bands,
  coverage,
  inputs,
  evidence,
  scenarios,
  notes,
  expectedCountyFactsSha256,
  expectedIntermediates,
};
