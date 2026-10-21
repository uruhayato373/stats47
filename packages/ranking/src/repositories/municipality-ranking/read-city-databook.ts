import 'server-only';

import { fetchFromR2AsJson } from '@stats47/r2-storage/server';

import { cityDatabookKeyPath } from '../../types/city-databook';
import { parseCityDatabookSnapshot } from '../schemas/municipality-ranking.schemas';

import type { CityDatabookSnapshot } from '../../types/city-databook';

export async function readCityDatabook(
  prefectureCode: string,
  cityCode: string
): Promise<CityDatabookSnapshot | null> {
  const value = await fetchFromR2AsJson<unknown>(cityDatabookKeyPath(prefectureCode, cityCode));
  return value ? parseCityDatabookSnapshot(value) : null;
}
