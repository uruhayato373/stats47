import type { Area } from "../types/area";
import { NATIONAL_AREA_CODE } from "./prefecture-codes";

/** 全国を表す Area 定数 */
export const NATIONAL_AREA: Area = {
  areaCode: NATIONAL_AREA_CODE,
  areaName: "全国",
  areaType: "national",
};
