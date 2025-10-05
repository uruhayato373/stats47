/**
 * サブカテゴリページ用のデータ取得フック
 */

import { useState, useEffect, useCallback } from 'react';
import { SubcategoryData, ChoroplethDisplayData } from '@/types/choropleth';
import { FormattedValue } from '@/lib/estat/types/formatted';
import { fetchChoroplethData } from '@/lib/choropleth/api-client';

interface UseSubcategoryDataParams {
  subcategory: SubcategoryData;
  year: string;
}

interface UseSubcategoryDataResult {
  choroplethData: ChoroplethDisplayData | null;
  formattedValues: FormattedValue[] | null;
  loading: boolean;
  error: string | null;
  isSample: boolean;
  refetch: () => Promise<void>;
}

export function useSubcategoryData({
  subcategory,
  year,
}: UseSubcategoryDataParams): UseSubcategoryDataResult {
  const [choroplethData, setChoroplethData] = useState<ChoroplethDisplayData | null>(null);
  const [formattedValues, setFormattedValues] = useState<FormattedValue[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isSample, setIsSample] = useState<boolean>(false);

  const fetchData = useCallback(async () => {
    if (!subcategory || !year) {
      setChoroplethData(null);
      setFormattedValues(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log(`[${subcategory.id}] Fetching data from API:`, {
        subcategoryId: subcategory.id,
        year,
      });

      const response = await fetchChoroplethData(
        subcategory.id,
        year,
        false // 実際のデータを試行
      );

      setChoroplethData(response.data);
      setFormattedValues(response.formattedValues);
      setIsSample(response.isSample);

      if (response.fallbackReason) {
        console.warn('Fallback to sample data:', response.fallbackReason);
        setError(response.fallbackReason);
      }

      console.log(`[${subcategory.id}] Data fetched successfully:`, {
        dataPoints: response.data.data?.length ?? 0,
        isSample: response.isSample,
      });
    } catch (err) {
      console.error(`[${subcategory.id}] Failed to fetch data:`, err);
      setError(err instanceof Error ? err.message : 'データの取得に失敗しました');

      // エラー時はサンプルデータを取得
      try {
        const sampleResponse = await fetchChoroplethData(
          subcategory.id,
          year,
          true // サンプルデータを使用
        );

        setChoroplethData(sampleResponse.data);
        setFormattedValues(sampleResponse.formattedValues);
        setIsSample(true);
        setError('APIエラーのためサンプルデータを使用');
      } catch (sampleErr) {
        console.error('Failed to fetch sample data:', sampleErr);
        setError('データの取得に失敗しました（サンプルデータも取得できませんでした）');
      }
    } finally {
      setLoading(false);
    }
  }, [subcategory, year]);

  // データ自動取得
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    choroplethData,
    formattedValues,
    loading,
    error,
    isSample,
    refetch: fetchData,
  };
}
