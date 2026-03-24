import type { EstatMetaInfoResponse } from "../../types";

/**
 * 正常なメタ情報レスポンスのモック
 */
export const mockMetaInfoResponse: EstatMetaInfoResponse = {
  GET_META_INFO: {
    RESULT: { STATUS: 0, ERROR_MSG: "" },
    PARAMETER: { LANG: "J", DATA_FORMAT: "J", STATS_DATA_ID: "0000010101" },
    METADATA_INF: {
      TABLE_INF: {
        "@id": "0000010101",
        STAT_NAME: { $: "社会・人口統計体系", "@code": "00200502" },
        GOV_ORG: { $: "総務省", "@code": "00200" },
        STATISTICS_NAME: "社会・人口統計体系",
        TITLE: { $: "Ａ　人口・世帯" },
        CYCLE: "年次",
        SURVEY_DATE: "0",
        OPEN_DATE: "2024-03-29",
        SMALL_AREA: "0",
        COLLECT_AREA: "該当なし",
        MAIN_CATEGORY: { "@no": "02", $: "人口・世帯" },
        SUB_CATEGORY: { "@no": "01", $: "人口" },
        OVERALL_TOTAL_NUMBER: "999999",
        UPDATED_DATE: "2024-03-29",
        STATISTICS_NAME_SPEC: {
          TABULATION_CATEGORY: "都道府県データ",
        },
      },
      CLASS_INF: {
        CLASS_OBJ: [
          {
            "@id": "cat01",
            "@name": "項目",
            CLASS: [
              { "@code": "A1101", "@name": "総人口", "@level": "1" },
              { "@code": "A1102", "@name": "日本人人口", "@level": "1" },
            ],
          },
          {
            "@id": "area",
            "@name": "地域",
            CLASS: [
              { "@code": "00000", "@name": "全国", "@level": "1" },
              { "@code": "01000", "@name": "北海道", "@level": "2" },
            ],
          },
          {
            "@id": "time",
            "@name": "時間軸",
            CLASS: [
              { "@code": "2023000000", "@name": "2023年" },
              { "@code": "2022000000", "@name": "2022年" },
            ],
          },
        ],
      },
    },
  },
};

/**
 * エラーレスポンスのモック
 */
export const mockErrorResponse = {
  GET_META_INFO: {
    RESULT: { STATUS: 100, ERROR_MSG: "統計表IDが不正です" },
    PARAMETER: { LANG: "J", STATS_DATA_ID: "invalid" },
  },
};

/**
 * 警告レスポンスのモック（STATUS=1）
 */
export const mockWarningResponse: EstatMetaInfoResponse = {
  GET_META_INFO: {
    RESULT: { STATUS: 1, ERROR_MSG: "一部のデータが取得できません" },
    PARAMETER: { LANG: "J", DATA_FORMAT: "J", STATS_DATA_ID: "0000010101" },
    METADATA_INF: mockMetaInfoResponse.GET_META_INFO.METADATA_INF,
  },
};
