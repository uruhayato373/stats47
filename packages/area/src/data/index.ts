import prefecturesData from "../../../../data/areas/master/prefectures.json";
import citiesData from "../../../../data/areas/master/cities.json";
import type { Prefecture, City } from "../types";

export const PREFECTURES: Prefecture[] = prefecturesData as Prefecture[];
export const CITIES: City[] = citiesData as City[];
