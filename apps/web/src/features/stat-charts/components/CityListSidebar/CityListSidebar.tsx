import { fetchCities, lookupArea } from "@stats47/area";
import { CityListSidebarClient } from "./CityListSidebarClient";

interface CityListSidebarProps {
  prefCode: string;
  currentAreaCode: string;
  categoryKey: string;
}

export function CityListSidebar({
  prefCode,
  currentAreaCode,
  categoryKey,
}: CityListSidebarProps) {
  const prefArea = lookupArea(prefCode);
  if (!prefArea) return null;

  const cities = fetchCities()
    .filter((c) => c.prefCode === prefCode)
    .map((c) => ({ cityCode: c.cityCode, cityName: c.cityName }));

  const basePath = `/dashboard/${categoryKey}`;

  return (
    <CityListSidebarClient
      prefName={prefArea.areaName}
      cities={cities}
      currentAreaCode={currentAreaCode}
      basePath={basePath}
    />
  );
}
