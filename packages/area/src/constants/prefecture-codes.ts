import prefecturesData from "../../../../data/areas/master/prefectures.json";

// コードの形の定数は台帳を読まない葉のモジュールにある
export {
  NATIONAL_AREA_CODE,
  NATIONAL_OR_PREFECTURE_AREA_CODE_RE,
  PREFECTURE_AREA_CODE_RE,
  PREFECTURE_CODE_2DIGIT_RE,
  PREFECTURE_COUNT,
} from "../utils/area-code";

/** 47 都道府県の 5 桁コード (コード順)。prefectures.json から派生する。 */
export const PREFECTURE_AREA_CODES: readonly string[] = prefecturesData.map((p) => p.prefCode);
