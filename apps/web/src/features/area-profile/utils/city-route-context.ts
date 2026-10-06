import { lookupArea } from "@stats47/area";

import { UrlPolicy } from "@/lib/url-policy";

import { stripPrefectureName } from "./strip-prefecture-name";

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
    /** 県名を外した市区町村名 (県が文脈で分かる見出し・一覧用) */
    cityShortName: stripPrefectureName(city.areaName, pref.areaName),
    cityBasePath: `/areas/${areaCode}/cities/${cityCode}`,
  };
}
