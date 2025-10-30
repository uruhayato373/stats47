"use server";

import { revalidateTag } from "next/cache";
import { fetchCities, fetchPrefectures } from "../repositories/area-repository";
import type { City, Prefecture } from "../types";

export async function listPrefecturesAction(): Promise<Prefecture[]> {
  "use cache";
  return await fetchPrefectures();
}

export async function listCitiesAction(): Promise<City[]> {
  "use cache";
  return await fetchCities();
}

export async function revalidatePrefecturesAction(): Promise<void> {
  revalidateTag("area-prefectures");
}

export async function revalidateCitiesAction(): Promise<void> {
  revalidateTag("area-cities");
}


