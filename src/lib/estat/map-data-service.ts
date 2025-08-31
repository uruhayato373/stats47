import { estatAPI } from '@/services/estat-api';
import { EstatDataFormatter, FormattedEstatData, FormattedValue, FormattedArea } from './data-formatter';
import { EstatStatsDataResponse } from '@/types/estat';

/**
 * 都道府県コードマッピング（e-STAT → 標準地域コード）
 */
const PREFECTURE_CODE_MAPPING: Record<string, string> = {
  '01': '01', // 北海道
  '02': '02', // 青森県
  '03': '03', // 岩手県
  '04': '04', // 宮城県
  '05': '05', // 秋田県
  '06': '06', // 山形県
  '07': '07', // 福島県
  '08': '08', // 茨城県
  '09': '09', // 栃木県
  '10': '10', // 群馬県
  '11': '11', // 埼玉県
  '12': '12', // 千葉県
  '13': '13', // 東京都
  '14': '14', // 神奈川県
  '15': '15', // 新潟県
  '16': '16', // 富山県
  '17': '17', // 石川県
  '18': '18', // 福井県
  '19': '19', // 山梨県
  '20': '20', // 長野県
  '21': '21', // 岐阜県
  '22': '22', // 静岡県
  '23': '23', // 愛知県
  '24': '24', // 三重県
  '25': '25', // 滋賀県
  '26': '26', // 京都府
  '27': '27', // 大阪府
  '28': '28', // 兵庫県
  '29': '29', // 奈良県
  '30': '30', // 和歌山県
  '31': '31', // 鳥取県
  '32': '32', // 島根県
  '33': '33', // 岡山県
  '34': '34', // 広島県
  '35': '35', // 山口県
  '36': '36', // 徳島県
  '37': '37', // 香川県
  '38': '38', // 愛媛県
  '39': '39', // 高知県
  '40': '40', // 福岡県
  '41': '41', // 佐賀県
  '42': '42', // 長崎県
  '43': '43', // 熊本県
  '44': '44', // 大分県
  '45': '45', // 宮崎県
  '46': '46', // 鹿児島県
  '47': '47', // 沖縄県
};

/**
 * 地図表示用のデータ型
 */
export interface MapDataPoint {
  prefectureCode: string;    // 都道府県コード（標準地域コード）
  prefectureName: string;    // 都道府県名
  value: number | null;      // 値
  displayValue: string;      // 表示用値
  unit: string | null;       // 単位
  categoryInfo?: {           // カテゴリ情報
    code: string;
    name: string;
  };
  yearInfo?: {              // 年度情報
    year: number;
    displayName: string;
  };
}

/**
 * 地図表示用のデータセット
 */
export interface MapDataset {
  title: string;
  statName: string;
  dataPoints: MapDataPoint[];
  summary: {
    min: number | null;
    max: number | null;
    mean: number | null;
    validCount: number;
    totalCount: number;
  };
  categories: Array<{
    code: string;
    name: string;
    count: number;
  }>;
  years: Array<{
    code: string;
    year: number;
    displayName: string;
    count: number;
  }>;
}

/**
 * e-STAT APIから地図表示用データを取得・変換するサービス
 */
export class EstatMapDataService {
  /**
   * 統計データIDから地図表示用データを取得
   */
  static async fetchMapData(
    statsDataId: string,
    options?: {
      categoryFilter?: string;    // 特定カテゴリのみ取得
      yearFilter?: string;        // 特定年度のみ取得
      limit?: number;            // データ取得件数制限
    }
  ): Promise<MapDataset> {
    try {
      // e-STAT APIからデータ取得
      const response = await estatAPI.getStatsData({
        statsDataId,
        metaGetFlg: 'Y',
        cntGetFlg: 'N',
        explanationGetFlg: 'N',
        annotationGetFlg: 'N',
        replaceSpChars: '0',
        startPosition: 1,
        limit: options?.limit || 1000,
        // フィルター条件を追加
        ...(options?.categoryFilter && { cdCat01: options.categoryFilter }),
        ...(options?.yearFilter && { cdTime: options.yearFilter }),
      });

      // データ整形
      const formattedData = EstatDataFormatter.formatAll(response);
      
      // 地図表示用データに変換
      return this.convertToMapDataset(formattedData);
      
    } catch (error) {
      console.error('Failed to fetch map data:', error);
      throw new Error(`地図データの取得に失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * 整形されたe-STATデータを地図表示用データセットに変換
   */
  private static convertToMapDataset(data: FormattedEstatData): MapDataset {
    const dataPoints: MapDataPoint[] = [];
    const validValues: number[] = [];

    // 値データから地図データポイントを生成
    data.values.forEach((value) => {
      const areaCode = value.areaCode;
      if (!areaCode) return;

      // 都道府県コードにマッピング
      const prefectureCode = PREFECTURE_CODE_MAPPING[areaCode];
      if (!prefectureCode) return;

      // 都道府県名を取得
      const prefectureName = value.areaInfo?.displayName || 
                            data.areas.find(a => a.code === areaCode)?.displayName ||
                            `都道府県${areaCode}`;

      // 数値がある場合は統計に追加
      if (value.numericValue !== null) {
        validValues.push(value.numericValue);
      }

      // カテゴリ情報を取得（最初のカテゴリを使用）
      const categoryInfo = Object.values(value.categories)[0];

      const dataPoint: MapDataPoint = {
        prefectureCode,
        prefectureName,
        value: value.numericValue,
        displayValue: value.displayValue,
        unit: value.unit,
        categoryInfo: categoryInfo ? {
          code: categoryInfo.code,
          name: categoryInfo.name
        } : undefined,
        yearInfo: value.yearInfo ? {
          year: value.yearInfo.year || 0,
          displayName: value.yearInfo.displayName
        } : undefined
      };

      dataPoints.push(dataPoint);
    });

    // 統計情報を計算
    const summary = this.calculateSummary(validValues, dataPoints.length);

    // カテゴリ集計
    const categoryStats = this.aggregateCategories(data.categories, data.values);
    
    // 年度集計
    const yearStats = this.aggregateYears(data.years, data.values);

    return {
      title: data.tableInfo.title,
      statName: data.tableInfo.statName,
      dataPoints,
      summary,
      categories: categoryStats,
      years: yearStats
    };
  }

  /**
   * 統計サマリーを計算
   */
  private static calculateSummary(validValues: number[], totalCount: number) {
    if (validValues.length === 0) {
      return {
        min: null,
        max: null,
        mean: null,
        validCount: 0,
        totalCount
      };
    }

    const min = Math.min(...validValues);
    const max = Math.max(...validValues);
    const mean = validValues.reduce((sum, val) => sum + val, 0) / validValues.length;

    return {
      min,
      max,
      mean,
      validCount: validValues.length,
      totalCount
    };
  }

  /**
   * カテゴリを集計
   */
  private static aggregateCategories(categories: FormattedArea[], values: FormattedValue[]) {
    const categoryCount = new Map<string, number>();
    
    values.forEach((value) => {
      Object.values(value.categories).forEach((cat) => {
        categoryCount.set(cat.code, (categoryCount.get(cat.code) || 0) + 1);
      });
    });

    return categories
      .filter(cat => categoryCount.has(cat.code))
      .map(cat => ({
        code: cat.code,
        name: cat.name,
        count: categoryCount.get(cat.code) || 0
      }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * 年度を集計
   */
  private static aggregateYears(years: any[], values: FormattedValue[]) {
    const yearCount = new Map<string, number>();
    
    values.forEach((value) => {
      if (value.yearInfo) {
        yearCount.set(value.yearInfo.code, (yearCount.get(value.yearInfo.code) || 0) + 1);
      }
    });

    return years
      .filter(year => yearCount.has(year.code))
      .map(year => ({
        code: year.code,
        year: year.year || 0,
        displayName: year.displayName,
        count: yearCount.get(year.code) || 0
      }))
      .sort((a, b) => b.year - a.year);
  }

  /**
   * 利用可能な統計データのリストを取得
   */
  static async getAvailableStats(searchWord?: string, limit = 20) {
    try {
      const response = await estatAPI.getStatsList({
        searchWord,
        searchKind: '1', // データセット検索
        startPosition: 1,
        limit
      });

      return response.GET_STATS_LIST.DATALIST_INF.TABLE_INF.map(table => ({
        id: table['@id'],
        statName: table.STAT_NAME.$,
        title: table.TITLE.$,
        govOrg: table.GOV_ORG.$,
        surveyDate: table.SURVEY_DATE,
        updatedDate: table.UPDATED_DATE
      }));
    } catch (error) {
      console.error('Failed to fetch available stats:', error);
      throw new Error('統計データリストの取得に失敗しました');
    }
  }
}