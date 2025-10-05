/**
 * e-stat APIレスポンスからコロプレス地図表示用データへの変換処理
 */

import { EstatStatsDataResponse, FormattedValue } from '@/lib/estat/types';
import { SubcategoryData, ChoroplethDataPoint, ChoroplethDisplayData } from '@/types/choropleth';

/**
 * 都道府県コードマッピング
 */
const PREFECTURE_CODE_MAP: { [key: string]: string } = {
  '01000': '01', '02000': '02', '03000': '03', '04000': '04', '05000': '05',
  '06000': '06', '07000': '07', '08000': '08', '09000': '09', '10000': '10',
  '11000': '11', '12000': '12', '13000': '13', '14000': '14', '15000': '15',
  '16000': '16', '17000': '17', '18000': '18', '19000': '19', '20000': '20',
  '21000': '21', '22000': '22', '23000': '23', '24000': '24', '25000': '25',
  '26000': '26', '27000': '27', '28000': '28', '29000': '29', '30000': '30',
  '31000': '31', '32000': '32', '33000': '33', '34000': '34', '35000': '35',
  '36000': '36', '37000': '37', '38000': '38', '39000': '39', '40000': '40',
  '41000': '41', '42000': '42', '43000': '43', '44000': '44', '45000': '45',
  '46000': '46', '47000': '47',
};

/**
 * 都道府県名マッピング
 */
const PREFECTURE_NAMES: { [key: string]: string } = {
  '01': '北海道', '02': '青森県', '03': '岩手県', '04': '宮城県', '05': '秋田県',
  '06': '山形県', '07': '福島県', '08': '茨城県', '09': '栃木県', '10': '群馬県',
  '11': '埼玉県', '12': '千葉県', '13': '東京都', '14': '神奈川県', '15': '新潟県',
  '16': '富山県', '17': '石川県', '18': '福井県', '19': '山梨県', '20': '長野県',
  '21': '岐阜県', '22': '静岡県', '23': '愛知県', '24': '三重県', '25': '滋賀県',
  '26': '京都府', '27': '大阪府', '28': '兵庫県', '29': '奈良県', '30': '和歌山県',
  '31': '鳥取県', '32': '島根県', '33': '岡山県', '34': '広島県', '35': '山口県',
  '36': '徳島県', '37': '香川県', '38': '愛媛県', '39': '高知県', '40': '福岡県',
  '41': '佐賀県', '42': '長崎県', '43': '熊本県', '44': '大分県', '45': '宮崎県',
  '46': '鹿児島県', '47': '沖縄県',
};

/**
 * e-stat APIレスポンスからFormattedValue配列に変換
 */
export function transformEstatToFormattedValues(
  estatResponse: EstatStatsDataResponse,
  subcategory: SubcategoryData,
  year: string
): FormattedValue[] {
  const result: FormattedValue[] = [];

  if (!estatResponse.GET_STATS_DATA?.STATISTICAL_DATA?.DATA_INF?.DATA_OBJ) {
    return result;
  }

  const dataObj = estatResponse.GET_STATS_DATA.STATISTICAL_DATA.DATA_INF.DATA_OBJ;
  const classTables = estatResponse.GET_STATS_DATA.STATISTICAL_DATA.CLASS_INF?.CLASS_OBJ || {};

  // 地域分類テーブルを作成
  const areaTable = new Map<string, string>();
  if (classTables.CLASS_OBJ_01?.CLASS) {
    classTables.CLASS_OBJ_01.CLASS.forEach((cls: any) => {
      if (cls['@code'] && cls['@name']) {
        areaTable.set(cls['@code'], cls['@name']);
      }
    });
  }

  // 時間分類テーブルを作成
  const timeTable = new Map<string, string>();
  if (classTables.CLASS_OBJ_TIME?.CLASS) {
    classTables.CLASS_OBJ_TIME.CLASS.forEach((cls: any) => {
      if (cls['@code'] && cls['@name']) {
        timeTable.set(cls['@code'], cls['@name']);
      }
    });
  }

  // データを変換
  if (Array.isArray(dataObj)) {
    dataObj.forEach((data: any) => {
      const areaCode = data['@tab'] || data['@area'];
      const timeCode = data['@time'];
      const value = data['$'] || data['@value'];

      // 指定された年度のデータのみを処理
      const dataYear = timeTable.get(timeCode);
      if (dataYear && !dataYear.includes(year)) {
        return;
      }

      // 都道府県データのみを処理（全国データは除外）
      if (areaCode && areaCode !== '00000' && value) {
        const normalizedAreaCode = PREFECTURE_CODE_MAP[areaCode] || areaCode.slice(-2);
        const areaName = areaTable.get(areaCode) || PREFECTURE_NAMES[normalizedAreaCode] || '不明';

        const numericValue = parseFloat(value);
        if (!isNaN(numericValue)) {
          const formattedValue: FormattedValue = {
            value: value,
            numericValue: numericValue,
            displayValue: formatValue(numericValue, subcategory),
            unit: subcategory.unit || '',
            areaCode: areaCode,
            areaName: areaName,
            categoryCode: subcategory.categoryCode || '',
            categoryName: subcategory.name,
            timeCode: timeCode || '',
            timeName: timeTable.get(timeCode) || year,
          };

          result.push(formattedValue);
        }
      }
    });
  }

  return result;
}

/**
 * FormattedValue配列からChoroplethDataPointに変換
 */
export function transformToChoroplethData(
  formattedValues: FormattedValue[],
  subcategory: SubcategoryData,
  year: string
): ChoroplethDisplayData {
  // データをソートしてランキングを計算
  const sortedData = [...formattedValues]
    .filter(item => item.numericValue !== null)
    .sort((a, b) => (b.numericValue || 0) - (a.numericValue || 0));

  // ランキング付きデータポイントを作成
  const dataPoints: ChoroplethDataPoint[] = sortedData.map((item, index) => ({
    prefectureCode: normalizePrefectureCode(item.areaCode),
    prefectureName: item.areaName,
    value: item.numericValue || 0,
    displayValue: item.displayValue,
    rank: index + 1,
  }));

  // 統計値を計算
  const values = dataPoints.map(d => d.value);
  const total = values.reduce((sum, val) => sum + val, 0);
  const average = values.length > 0 ? total / values.length : 0;
  const sortedValues = [...values].sort((a, b) => a - b);
  const median = sortedValues.length > 0
    ? sortedValues[Math.floor(sortedValues.length / 2)]
    : 0;

  return {
    subcategory,
    year,
    data: dataPoints,
    lastUpdated: new Date().toISOString(),
    source: `e-stat API${subcategory.statsDataId ? ` (統計表ID: ${subcategory.statsDataId})` : ''}`,
    total: subcategory.dataType === 'numerical' ? total : undefined,
    average,
    median,
  };
}

/**
 * 値をフォーマット
 */
function formatValue(value: number, subcategory: SubcategoryData): string {
  switch (subcategory.dataType) {
    case 'percentage':
      return `${Math.round(value * 10) / 10}%`;
    case 'rate':
      return Math.round(value * 10) / 10 + '';
    case 'numerical':
    default:
      return value.toLocaleString('ja-JP');
  }
}

/**
 * 都道府県コードを正規化（2桁形式に統一）
 */
function normalizePrefectureCode(areaCode: string): string {
  // 5桁コード（01000形式）から2桁コード（01形式）に変換
  if (areaCode.length === 5 && areaCode.endsWith('000')) {
    return areaCode.slice(0, 2);
  }

  // 既に2桁の場合はそのまま
  if (areaCode.length === 2) {
    return areaCode;
  }

  // その他の場合は後ろ2桁を取得
  return areaCode.slice(-2).padStart(2, '0');
}

/**
 * 年度リストを取得（e-stat APIレスポンスから）
 */
export function extractAvailableYears(estatResponse: EstatStatsDataResponse): string[] {
  const years = new Set<string>();

  if (!estatResponse.GET_STATS_DATA?.STATISTICAL_DATA?.CLASS_INF?.CLASS_OBJ) {
    return [];
  }

  const classTables = estatResponse.GET_STATS_DATA.STATISTICAL_DATA.CLASS_INF.CLASS_OBJ;

  // 時間分類から年度を抽出
  if (classTables.CLASS_OBJ_TIME?.CLASS) {
    classTables.CLASS_OBJ_TIME.CLASS.forEach((cls: any) => {
      if (cls['@name']) {
        // 年度パターンをマッチング（例: "2023年", "令和5年", "2023"など）
        const yearMatch = cls['@name'].match(/(\d{4})/);
        if (yearMatch) {
          years.add(yearMatch[1]);
        }
      }
    });
  }

  // 年度を降順でソート
  return Array.from(years).sort((a, b) => parseInt(b) - parseInt(a));
}

/**
 * サンプルデータ生成（開発・テスト用）
 */
export function generateSampleData(
  subcategory: SubcategoryData,
  year: string,
  prefectureCount: number = 47
): FormattedValue[] {
  const sampleData: FormattedValue[] = [];

  for (let i = 1; i <= Math.min(prefectureCount, 47); i++) {
    const prefCode = i.toString().padStart(2, '0');
    const prefName = PREFECTURE_NAMES[prefCode];

    if (prefName) {
      let baseValue: number;

      switch (subcategory.dataType) {
        case 'percentage':
          baseValue = Math.random() * 40 + 10; // 10-50%
          break;
        case 'rate':
          baseValue = Math.random() * 100 + 50; // 50-150
          break;
        case 'numerical':
        default:
          baseValue = Math.random() * 10000 + 1000; // 1,000-11,000
          break;
      }

      const roundedValue = Math.round(baseValue);
      sampleData.push({
        value: roundedValue.toString(),
        numericValue: roundedValue,
        displayValue: formatValue(roundedValue, subcategory),
        unit: subcategory.unit || '',
        areaCode: `${prefCode}000`,
        areaName: prefName,
        categoryCode: subcategory.categoryCode || '',
        categoryName: subcategory.name,
        timeCode: year,
        timeName: `${year}年`,
      });
    }
  }

  return sampleData;
}