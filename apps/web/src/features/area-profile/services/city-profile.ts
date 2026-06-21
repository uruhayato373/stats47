import "server-only";

import { cache } from "react";

import { fetchFromR2AsJson } from "@stats47/r2-storage/server";

export interface CityProfileData {
  areaCode: string;
  areaName: string;
  strengths: Array<{
    indicator: string;
    rankingKey: string;
    year: string;
    rank: number;
    value: number;
    unit: string;
  }>;
  weaknesses: Array<{
    indicator: string;
    rankingKey: string;
    year: string;
    rank: number;
    value: number;
    unit: string;
  }>;
}

// generateMetadata とページ本体の重複 fetch を避けるため request scope で dedupe する。
export const readCityProfile = cache(
  async (areaCode: string, cityCode: string): Promise<CityProfileData | null> => {
    try {
      return await fetchFromR2AsJson<CityProfileData>(
        `app/areas/${areaCode}/cities/${cityCode}/profile.json`,
      );
    } catch {
      return null;
    }
  },
);

