import { SITE } from '@stats47/types';
import data from '../../../../data/themes/sources/earthquake-exposure.json';

/**
 * Verified original source pins. J-SHIS bodies stay private; only county-band population is distributable.
 * 記録の正本は台帳 `themes.sources` (data/themes/sources/earthquake-exposure.json + Schema)。公開 R2 の基点 (publicBaseUrl) は台帳に書かず、ここで足す (項目の並びは移す前と同じ)。
 */
const { algorithm, hazard, population, expectedCounts, bands, populationSources, notes, ...head } = data;

export const EARTHQUAKE_EXPOSURE_SOURCE = {
  ...head,
  publicBaseUrl: SITE.r2PublicBaseUrl,
  algorithm,
  hazard,
  population,
  expectedCounts,
  bands,
  populationSources,
  notes,
};
