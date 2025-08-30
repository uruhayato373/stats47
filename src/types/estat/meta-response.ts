import { EstatResult, EstatTableInfo, EstatClassInfo } from './raw-response';

/**
 * getMetaInfo APIのレスポンス型
 * メタ情報（項目名、コード等）を取得
 */
export interface EstatMetaInfoResponse {
  GET_META_INFO: {
    RESULT: EstatResult;
    PARAMETER: {
      LANG: 'J' | 'E';
      DATA_FORMAT: 'X' | 'J';
      STATS_DATA_ID: string;
    };
    METADATA_INF: {
      TABLE_INF: EstatTableInfo;
      CLASS_INF: EstatClassInfo;
    };
  };
}