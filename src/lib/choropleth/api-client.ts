/**
 * コロプレス地図機能用のAPIクライアント
 */

import { CategoryData, ChoroplethDisplayData } from '@/types/choropleth';
import { FormattedValue } from '@/lib/estat/types';

/**
 * API レスポンスの基本型
 */
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  details?: string;
  timestamp: string;
}

/**
 * データ取得レスポンス型
 */
interface ChoroplethDataResponse {
  data: ChoroplethDisplayData;
  formattedValues: FormattedValue[];
  isSample: boolean;
  fallbackReason?: string;
}

/**
 * 年度一覧レスポンス型
 */
interface YearsResponse {
  subcategoryId: string;
  subcategoryName: string;
  availableYears: string[];
  defaultYear: string;
  lastUpdated: string;
}

/**
 * カテゴリ一覧を取得
 */
export async function fetchCategories(): Promise<CategoryData[]> {
  try {
    const response = await fetch('/api/choropleth/categories', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: ApiResponse<CategoryData[]> = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'カテゴリの取得に失敗しました');
    }

    return result.data || [];
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
}

/**
 * コロプレス地図用データを取得
 */
export async function fetchChoroplethData(
  subcategoryId: string,
  year: string,
  useSample: boolean = false
): Promise<ChoroplethDataResponse> {
  try {
    const params = new URLSearchParams({
      subcategoryId,
      year,
      ...(useSample && { sample: 'true' }),
    });

    const response = await fetch(`/api/choropleth/data?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: ApiResponse<ChoroplethDataResponse> = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'データの取得に失敗しました');
    }

    if (!result.data) {
      throw new Error('データが見つかりません');
    }

    return result.data;
  } catch (error) {
    console.error('Error fetching choropleth data:', error);
    throw error;
  }
}

/**
 * 利用可能年度一覧を取得
 */
export async function fetchAvailableYears(subcategoryId: string): Promise<YearsResponse> {
  try {
    const params = new URLSearchParams({ subcategoryId });

    const response = await fetch(`/api/choropleth/years?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: ApiResponse<YearsResponse> = await response.json();

    if (!result.success) {
      throw new Error(result.error || '年度一覧の取得に失敗しました');
    }

    if (!result.data) {
      throw new Error('年度データが見つかりません');
    }

    return result.data;
  } catch (error) {
    console.error('Error fetching available years:', error);
    throw error;
  }
}

/**
 * データをCSV形式でダウンロード
 */
export function downloadDataAsCSV(
  data: ChoroplethDisplayData,
  formattedValues: FormattedValue[]
): void {
  try {
    // CSVヘッダー
    const headers = [
      '順位',
      '都道府県名',
      '値',
      '表示値',
      '単位',
      'データ種別',
      '年度'
    ];

    // データ行を作成
    const rows = data.data.map(item => [
      item.rank.toString(),
      item.prefectureName,
      item.value.toString(),
      item.displayValue,
      data.subcategory.unit,
      data.subcategory.dataType,
      data.year
    ]);

    // CSV文字列を生成
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // BOMを追加してExcelで正しく表示されるようにする
    const bom = '\uFEFF';
    const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });

    // ダウンロードを実行
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${data.subcategory.name}_${data.year}年.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading CSV:', error);
    throw new Error('CSVダウンロードに失敗しました');
  }
}

/**
 * データをJSON形式でダウンロード
 */
export function downloadDataAsJSON(
  data: ChoroplethDisplayData,
  formattedValues: FormattedValue[]
): void {
  try {
    const exportData = {
      metadata: {
        subcategory: data.subcategory,
        year: data.year,
        lastUpdated: data.lastUpdated,
        source: data.source,
        statistics: {
          total: data.total,
          average: data.average,
          median: data.median,
        },
      },
      data: data.data,
      rawData: formattedValues,
      exportedAt: new Date().toISOString(),
    };

    const jsonContent = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });

    // ダウンロードを実行
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${data.subcategory.name}_${data.year}年.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading JSON:', error);
    throw new Error('JSONダウンロードに失敗しました');
  }
}