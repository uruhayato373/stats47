import { lookupArea } from "@stats47/area";

import { UrlPolicy } from "@/lib/url-policy";

export function getCityRouteContext(areaCode: string, cityCode: string) {
  const city = lookupArea(cityCode);
  if (
    !city ||
    city.areaType !== "city" ||
    !UrlPolicy.city.isKnownUnderPrefecture(areaCode, cityCode)
  ) {
    return null;
  }

  const pref = lookupArea(areaCode);
  if (!pref || pref.areaType !== "prefecture") {
    return null;
  }

  return {
    city,
    pref,
    cityBasePath: `/areas/${areaCode}/cities/${cityCode}`,
  };
}
