'use server';

import { loadGeoStationAccessPrefDetail } from '../lib/load-geo-station-access-evidence';

export async function fetchStationAccessDetailAction(prefCode2: string) {
  return loadGeoStationAccessPrefDetail(prefCode2);
}
