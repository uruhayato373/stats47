/**
 * テスト用フィクスチャ
 * meta-infoモジュールのテストで使用するモックデータ
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import type { EstatMetaInfoResponse } from '../../../types';

// モックメタ情報レスポンス
const mockMetaInfoPath = join(process.cwd(), 'data/mock/metainfo/prefecture/0000010101.json');
const mockMetaInfoContent = readFileSync(mockMetaInfoPath, 'utf-8');
const mockMetaInfoData = JSON.parse(mockMetaInfoContent);

export const mockMetaInfoResponse: EstatMetaInfoResponse = mockMetaInfoData.metaInfo;

// テスト用の最小限のメタ情報レスポンス
export const minimalMetaInfoResponse: EstatMetaInfoResponse = {
  GET_META_INFO: {
    RESULT: {
      STATUS: 0,
      ERROR_MSG: "正常に終了しました。",
      DATE: "2025-10-15T08:00:00.000+09:00"
    },
    PARAMETER: {
      LANG: "J",
      STATS_DATA_ID: "0000010101",
      DATA_FORMAT: "J"
    },
    METADATA_INF: {
      TABLE_INF: {
        "@id": "0000010101",
        "STAT_NAME": {
          "@code": "00200502",
          "$": "社会・人口統計体系"
        },
        "GOV_ORG": {
          "@code": "00200",
          "$": "総務省"
        },
        "STATISTICS_NAME": "都道府県データ 基礎データ",
        "TITLE": {
          "@no": "0000010101",
          "$": "Ａ　人口・世帯"
        },
        "CYCLE": "年度次",
        "SURVEY_DATE": 0,
        "OPEN_DATE": "2025-06-30",
        "SMALL_AREA": 0,
        "COLLECT_AREA": "全国",
        "MAIN_CATEGORY": {
          "@code": "99",
          "$": "その他"
        },
        "SUB_CATEGORY": {
          "@code": "99",
          "$": "その他"
        },
        "OVERALL_TOTAL_NUMBER": 546720,
        "UPDATED_DATE": "2025-06-30"
      },
      CLASS_OBJ: [
        {
          "@id": "area",
          "CLASS": [
            {
              "@code": "00000",
              "@name": "全国",
              "@level": "1"
            },
            {
              "@code": "01000",
              "@name": "北海道",
              "@level": "2"
            }
          ]
        },
        {
          "@id": "time",
          "CLASS": [
            {
              "@code": "1975100000",
              "@name": "1975年度",
              "@level": "1"
            },
            {
              "@code": "1976100000",
              "@name": "1976年度",
              "@level": "1"
            }
          ]
        },
        {
          "@id": "cat01",
          "CLASS": [
            {
              "@code": "A1101",
              "@name": "A1101_総人口",
              "@level": "1",
              "@unit": "人"
            }
          ]
        }
      ]
    }
  }
};
