import { lookupArea } from "@stats47/area";

export function getCityRouteContext(areaCode: string, cityCode: string) {
  const city = lookupArea(cityCode);
  if (!city || city.areaType !== "city" || city.parentAreaCode !== areaCode) {
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

