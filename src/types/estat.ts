export interface EstatAPIResponse<T = any> {
  GET_STATS_DATA?: {
    RESULT: {
      STATUS: number;
      ERROR_MSG?: string;
      DATE: string;
    };
    PARAMETER: {
      LANG: string;
      DATA_FORMAT: string;
      STATS_DATA_ID: string;
      START_POSITION?: string;
      LIMIT?: string;
    };
    STATISTICAL_DATA: {
      RESULT_INF: {
        TOTAL_NUMBER: string;
        FROM_NUMBER: string;
        TO_NUMBER: string;
      };
      TABLE_INF: {
        '@id': string;
        TITLE: {
          '@no': string;
          '#text': string;
        };
        CYCLE: string;
        SURVEY_DATE: string;
        OPEN_DATE: string;
        SMALL_AREA: string;
        COLLECT_AREA: string;
        MAIN_CATEGORY: string;
        SUB_CATEGORY: string;
        OVERALL_TOTAL_NUMBER: string;
        UPDATED_DATE: string;
        STATISTICS_NAME: string;
        TITLE_SPEC: string;
        DESCRIPTION: string;
        SURVEY_METHOD: string;
        COLLECT_METHOD: string;
      };
      CLASS_INF: {
        CLASS_OBJ: Array<{
          '@id': string;
          '@name': string;
          CLASS: Array<{
            '@code': string;
            '@name': string;
            '@level': string;
            '@unit'?: string;
          }>;
        }>;
      };
      DATA_INF: {
        NOTE?: Array<{
          '@char': string;
          '#text': string;
        }>;
        VALUE: Array<{
          '@tab': string;
          '@cat01'?: string;
          '@cat02'?: string;
          '@cat03'?: string;
          '@area': string;
          '@time': string;
          '@unit'?: string;
          '#text': string;
        }>;
      };
    };
  };
}

export interface EstatAPIParams {
  appId: string;
  statsDataId: string;
  lang?: 'J' | 'E';
  dataFormat?: 'json' | 'xml' | 'csv';
  startPosition?: number;
  limit?: number;
  metaGetFlg?: 'Y' | 'N';
  cntGetFlg?: 'Y' | 'N';
  sectionHeaderFlg?: 1 | 2;
  cdTab?: string;
  cdCat01?: string;
  cdCat02?: string;
  cdCat03?: string;
  cdArea?: string;
  cdTime?: string;
}

export interface TransformedData {
  prefectureCode: string;
  prefectureName: string;
  year: string;
  value: number;
  unit?: string;
}

export interface PrefectureRanking extends TransformedData {
  rank: number;
  deviation: number;
  changeRate?: number;
  previousValue?: number;
}

export interface RegionalData {
  region: string;
  prefectures: PrefectureRanking[];
  total: number;
  average: number;
}