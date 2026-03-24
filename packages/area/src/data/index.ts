import prefecturesData from "./prefectures.json";
import citiesData from "./cities.json";
import type { Prefecture, City } from "../types";

export const PREFECTURES: Prefecture[] = prefecturesData as Prefecture[];
export const CITIES: City[] = citiesData as City[];
