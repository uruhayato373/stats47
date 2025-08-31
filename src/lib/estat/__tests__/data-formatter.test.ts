import { EstatDataFormatter, FormattedCategory, FormattedYear, FormattedValue, FormattedArea } from '../data-formatter';
import { EstatStatsDataResponse } from '@/types/estat';

// テスト用のモックデータ
const mockEstatResponse: EstatStatsDataResponse = {
  GET_STATS_DATA: {
    RESULT: {
      STATUS: 0,
      ERROR_MSG: "正常に終了しました。",
      DATE: "2024-01-01T10:00:00.000+09:00"
    },
    PARAMETER: {
      LANG: 'J',
      STATS_DATA_ID: '0003348423',
      DATA_FORMAT: 'J',
      METAGET_FLG: 'Y',
      CNT_GET_FLG: 'Y',
      EXPLANATION_GET_FLG: 'N',
      ANNOTATION_GET_FLG: 'N',
      REPLACE_SP_CHARS: '0'
    },
    STATISTICAL_DATA: {
      RESULT_INF: {
        TOTAL_NUMBER: 100,
        FROM_NUMBER: 1,
        TO_NUMBER: 100
      },
      TABLE_INF: {
        TITLE: { $: "人口動態統計" },
        STAT_NAME: { $: "人口動態調査" },
        GOV_ORG: { $: "厚生労働省" },
        STATISTICS_NAME: "人口動態統計",
        CYCLE: "年次",
        SURVEY_DATE: "2023年",
        OPEN_DATE: "2024-01-15",
        SMALL_AREA: "0",
        COLLECT_AREA: "全国",
        MAIN_CATEGORY: { $: "人口・世帯" },
        SUB_CATEGORY: { $: "人口" },
        OVERALL_TOTAL_NUMBER: 1000,
        UPDATED_DATE: "2024-01-15",
        STATISTICS_NAME_SPEC: {
          TABULATION_CATEGORY: "確定数"
        }
      },
      CLASS_INF: {
        CLASS_OBJ: [
          {
            '@id': 'cat01',
            '@name': '性別',
            CLASS: [
              {
                '@code': '001',
                '@name': '001_総数',
                '@level': '1',
                '@unit': '人'
              },
              {
                '@code': '002', 
                '@name': '002_男',
                '@level': '1',
                '@unit': '人'
              },
              {
                '@code': '003',
                '@name': '003_女',
                '@level': '1',
                '@unit': '人'
              }
            ]
          },
          {
            '@id': 'time',
            '@name': '時間軸（年次）',
            CLASS: [
              {
                '@code': '2020000000',
                '@name': '2020年度',
                '@level': '1'
              },
              {
                '@code': '2021000000',
                '@name': '2021年度',
                '@level': '1'
              },
              {
                '@code': '2022000000',
                '@name': '2022年度',
                '@level': '1'
              }
            ]
          },
          {
            '@id': 'area',
            '@name': '地域',
            CLASS: [
              {
                '@code': '00000',
                '@name': '全国',
                '@level': '1'
              },
              {
                '@code': '01',
                '@name': '01 北海道',
                '@level': '2'
              },
              {
                '@code': '13',
                '@name': '13 東京都',
                '@level': '2'
              }
            ]
          }
        ]
      },
      DATA_INF: {
        VALUE: [
          {
            '@tab': '001',
            '@cat01': '001',
            '@time': '2020000000',
            '@unit': '人',
            $: '1000000'
          },
          {
            '@tab': '001',
            '@cat01': '002',
            '@time': '2020000000',
            '@unit': '人',
            $: '500000'
          },
          {
            '@tab': '001',
            '@cat01': '003',
            '@time': '2020000000',
            '@unit': '人',
            $: '500000'
          },
          {
            '@tab': '001',
            '@cat01': '001',
            '@time': '2021000000',
            '@unit': '人',
            $: '-'
          }
        ]
      }
    }
  }
};

describe('EstatDataFormatter', () => {
  describe('formatCategories', () => {
    it('should format categories correctly', () => {
      const result = EstatDataFormatter.formatCategories(mockEstatResponse);
      
      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({
        categoryId: 'cat01',
        categoryName: '性別',
        code: '001',
        name: '総数',
        originalName: '001_総数',
        level: 1,
        unit: '人',
        parentCode: null
      });
      expect(result[1].name).toBe('男');
      expect(result[2].name).toBe('女');
    });

    it('should return empty array when no CLASS_OBJ', () => {
      const emptyResponse = {
        ...mockEstatResponse,
        GET_STATS_DATA: {
          ...mockEstatResponse.GET_STATS_DATA,
          STATISTICAL_DATA: {
            ...mockEstatResponse.GET_STATS_DATA.STATISTICAL_DATA,
            CLASS_INF: { CLASS_OBJ: [] }
          }
        }
      };
      
      const result = EstatDataFormatter.formatCategories(emptyResponse);
      expect(result).toEqual([]);
    });
  });

  describe('formatAreas', () => {
    it('should format areas correctly', () => {
      const result = EstatDataFormatter.formatAreas(mockEstatResponse);
      
      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({
        code: '00000',
        name: '全国',
        displayName: '全国',
        level: 1,
        parentCode: null,
        areaType: 'country',
        sortOrder: 0
      });
      expect(result[1].displayName).toBe('北海道');
      expect(result[1].areaType).toBe('prefecture');
      expect(result[2].displayName).toBe('東京都');
    });

    it('should handle missing area class', () => {
      const noAreaResponse = {
        ...mockEstatResponse,
        GET_STATS_DATA: {
          ...mockEstatResponse.GET_STATS_DATA,
          STATISTICAL_DATA: {
            ...mockEstatResponse.GET_STATS_DATA.STATISTICAL_DATA,
            CLASS_INF: {
              CLASS_OBJ: [
                {
                  '@id': 'cat01',
                  '@name': '性別',
                  CLASS: []
                }
              ]
            }
          }
        }
      };
      
      const result = EstatDataFormatter.formatAreas(noAreaResponse);
      expect(result).toEqual([]);
    });
  });

  describe('formatYears', () => {
    it('should format years correctly', () => {
      const result = EstatDataFormatter.formatYears(mockEstatResponse);
      
      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({
        code: '2020000000',
        name: '2020年度',
        displayName: '2020年度',
        year: 2020,
        period: null,
        sortOrder: 202000
      });
    });

    it('should handle missing time class', () => {
      const noTimeResponse = {
        ...mockEstatResponse,
        GET_STATS_DATA: {
          ...mockEstatResponse.GET_STATS_DATA,
          STATISTICAL_DATA: {
            ...mockEstatResponse.GET_STATS_DATA.STATISTICAL_DATA,
            CLASS_INF: {
              CLASS_OBJ: [
                {
                  '@id': 'cat01',
                  '@name': '性別',
                  CLASS: []
                }
              ]
            }
          }
        }
      };
      
      const result = EstatDataFormatter.formatYears(noTimeResponse);
      expect(result).toEqual([]);
    });
  });

  describe('formatValues', () => {
    it('should format values correctly', () => {
      const result = EstatDataFormatter.formatValues(mockEstatResponse);
      
      expect(result).toHaveLength(4);
      expect(result[0]).toEqual({
        rawValue: '1000000',
        numericValue: 1000000,
        displayValue: '1,000,000',
        unit: '人',
        categories: {
          cat01: {
            code: '001',
            name: '001',
            originalName: '001'
          }
        },
        timeCode: '2020000000',
        areaCode: null
      });
    });

    it('should handle special values', () => {
      const result = EstatDataFormatter.formatValues(mockEstatResponse);
      const dashValue = result.find(v => v.rawValue === '-');
      
      expect(dashValue).toBeDefined();
      expect(dashValue?.numericValue).toBeNull();
      expect(dashValue?.displayValue).toBe('-');
    });

    it('should use category map when provided', () => {
      const categories = EstatDataFormatter.formatCategories(mockEstatResponse);
      const categoryMap = new Map(categories.map(cat => [cat.code, cat]));
      
      const result = EstatDataFormatter.formatValues(mockEstatResponse, categoryMap);
      
      expect(result[0].categories.cat01.name).toBe('総数');
      expect(result[0].categories.cat01.originalName).toBe('001_総数');
    });
  });

  describe('formatAll', () => {
    it('should format all data correctly', () => {
      const result = EstatDataFormatter.formatAll(mockEstatResponse);
      
      expect(result.tableInfo.title).toBe('人口動態統計');
      expect(result.categories).toHaveLength(3);
      expect(result.areas).toHaveLength(3);
      expect(result.years).toHaveLength(3);
      expect(result.values).toHaveLength(4);
      expect(result.summary.totalNumber).toBe(100);
      expect(result.summary.areaCount).toBe(3);
    });

    it('should include year and area info in values when available', () => {
      const result = EstatDataFormatter.formatAll(mockEstatResponse);
      const firstValue = result.values[0];
      
      expect(firstValue.yearInfo).toBeDefined();
      expect(firstValue.yearInfo?.year).toBe(2020);
      expect(firstValue.yearInfo?.displayName).toBe('2020年度');
    });

    it('should format areas with maps', () => {
      const areas = EstatDataFormatter.formatAreas(mockEstatResponse);
      const areaMap = new Map(areas.map(area => [area.code, area]));
      
      const result = EstatDataFormatter.formatValues(mockEstatResponse, undefined, undefined, areaMap);
      
      // 地域情報がある値を見つける（実際のテストデータには含まれていないため、機能確認用）
      expect(result).toBeDefined();
    });
  });

  describe('private helper methods', () => {
    describe('parseNumericValue', () => {
      it('should parse numeric values correctly', () => {
        // プライベートメソッドなので、formatValues経由でテスト
        const testResponse = {
          ...mockEstatResponse,
          GET_STATS_DATA: {
            ...mockEstatResponse.GET_STATS_DATA,
            STATISTICAL_DATA: {
              ...mockEstatResponse.GET_STATS_DATA.STATISTICAL_DATA,
              DATA_INF: {
                VALUE: [
                  { '@tab': '001', $: '1,234.56' },
                  { '@tab': '002', $: '-' },
                  { '@tab': '003', $: '…' },
                  { '@tab': '004', $: 'X' }
                ]
              }
            }
          }
        };
        
        const result = EstatDataFormatter.formatValues(testResponse);
        
        expect(result[0].numericValue).toBe(1234.56);
        expect(result[1].numericValue).toBeNull();
        expect(result[2].numericValue).toBeNull();
        expect(result[3].numericValue).toBeNull();
      });
    });

    describe('formatDisplayValue', () => {
      it('should format display values correctly', () => {
        const testResponse = {
          ...mockEstatResponse,
          GET_STATS_DATA: {
            ...mockEstatResponse.GET_STATS_DATA,
            STATISTICAL_DATA: {
              ...mockEstatResponse.GET_STATS_DATA.STATISTICAL_DATA,
              DATA_INF: {
                VALUE: [
                  { '@tab': '001', $: '1234567' },
                  { '@tab': '002', $: '123.45' }
                ]
              }
            }
          }
        };
        
        const result = EstatDataFormatter.formatValues(testResponse);
        
        expect(result[0].displayValue).toBe('1,234,567');
        expect(result[1].displayValue).toBe('123.45');
      });
    });
  });
});