import { fetchCities, prefectureNameOf } from '@stats47/area';

import { UrlPolicy } from '@/lib/url-policy';

/**
 * 地域の Sheet に出す、1 つの県の市区町村 (県名を外した名前)。サーバーで作って渡す
 * (全国 1,913 件をブラウザに送らない。2026-10-31 IA-REGION-THEME-01)。
 * 市区町村のページがある (`UrlPolicy.city.isKnownUnderPrefecture`) ものだけを並べる。
 */
export function prefectureCityOptions(prefCode: string): { code: string; name: string }[] {
  const prefName = prefectureNameOf(prefCode);
  return fetchCities()
    .filter((c) => c.prefCode === prefCode && UrlPolicy.city.isKnownUnderPrefecture(prefCode, c.cityCode))
    .map((c) => ({ code: c.cityCode, name: prefName ? c.cityName.replace(`${prefName} `, '') : c.cityName }));
}
