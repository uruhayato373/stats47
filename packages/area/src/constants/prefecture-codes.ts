import prefecturesData from "../data/prefectures.json";

/** e-Stat の全国行 areaCode。 */
export const NATIONAL_AREA_CODE = "00000";

/** 都道府県の 5 桁コード (01000〜47000)。 */
export const PREFECTURE_AREA_CODE_RE = /^(0[1-9]|[1-3][0-9]|4[0-7])000$/;

/** 全国 (00000) または都道府県の 5 桁コード。 */
export const NATIONAL_OR_PREFECTURE_AREA_CODE_RE = /^(00|0[1-9]|[1-3][0-9]|4[0-7])000$/;

/** 都道府県の 2 桁コード (01〜47)。 */
export const PREFECTURE_CODE_2DIGIT_RE = /^(0[1-9]|[1-3][0-9]|4[0-7])$/;

/** 47 都道府県の 5 桁コード (コード順)。prefectures.json から派生する。 */
export const PREFECTURE_AREA_CODES: readonly string[] = prefecturesData.map((p) => p.prefCode);
