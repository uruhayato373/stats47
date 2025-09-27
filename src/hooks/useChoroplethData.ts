/**
 * コロプレス地図データ取得用のカスタムフック
 */

import { useEffect, useCallback } from 'react';
import { useAtom, atom } from 'jotai';
import {
  selectedSubcategoryDataAtom,
  selectedYearAtom,
  choroplethDataAtom,
  loadingAtom,
  errorAtom,
} from '@/atoms/choropleth';
import { fetchChoroplethData, downloadDataAsCSV, downloadDataAsJSON } from '@/lib/choropleth/api-client';
import { ChoroplethDisplayData } from '@/types/choropleth';
import { FormattedValue } from '@/lib/estat/types';

interface UseChoroplethDataResult {
  data: ChoroplethDisplayData | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  formattedValues: FormattedValue[];
  isSample: boolean;
}

export function useChoroplethData(): UseChoroplethDataResult {
  const [selectedSubcategory] = useAtom(selectedSubcategoryDataAtom);
  const [selectedYear] = useAtom(selectedYearAtom);
  const [choroplethData, setChoroplethData] = useAtom(choroplethDataAtom);
  const [loading, setLoading] = useAtom(loadingAtom);
  const [error, setError] = useAtom(errorAtom);

  // フォーマット済みデータとサンプルフラグを保持
  const [formattedValues, setFormattedValues] = useAtom(
    atom<FormattedValue[]>([])
  );
  const [isSample, setIsSample] = useAtom(
    atom<boolean>(false)
  );

  const fetchData = useCallback(async () => {
    if (!selectedSubcategory || !selectedYear) {
      setChoroplethData(null);
      setFormattedValues([]);
      setIsSample(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetchChoroplethData(
        selectedSubcategory.id,
        selectedYear,
        false // 実際のデータを試行
      );

      setChoroplethData(response.data);
      setFormattedValues(response.formattedValues);
      setIsSample(response.isSample);

      if (response.fallbackReason) {
        console.warn('Fallback to sample data:', response.fallbackReason);
      }
    } catch (err) {
      console.error('Failed to fetch choropleth data:', err);
      setError(err instanceof Error ? err.message : 'データの取得に失敗しました');

      // エラー時はサンプルデータを取得
      try {
        const sampleResponse = await fetchChoroplethData(
          selectedSubcategory.id,
          selectedYear,
          true // サンプルデータを使用
        );

        setChoroplethData(sampleResponse.data);
        setFormattedValues(sampleResponse.formattedValues);
        setIsSample(true);
        setError(null); // エラーをクリア
      } catch (sampleErr) {
        console.error('Failed to fetch sample data:', sampleErr);
        setError('データの取得に失敗しました（サンプルデータも取得できませんでした）');
      }
    } finally {
      setLoading(false);
    }
  }, [
    selectedSubcategory,
    selectedYear,
    setChoroplethData,
    setFormattedValues,
    setIsSample,
    setLoading,
    setError,
  ]);

  // データ自動取得
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data: choroplethData,
    loading,
    error,
    refetch: fetchData,
    formattedValues,
    isSample,
  };
}

/**
 * ダウンロード機能付きコロプレスデータフック
 */
export function useChoroplethDownload() {
  const downloadCSV = useCallback(
    (data: ChoroplethDisplayData, formattedValues: FormattedValue[]) => {
      try {
        downloadDataAsCSV(data, formattedValues);
      } catch (error) {
        console.error('CSV download failed:', error);
        throw error;
      }
    },
    []
  );

  const downloadJSON = useCallback(
    (data: ChoroplethDisplayData, formattedValues: FormattedValue[]) => {
      try {
        downloadDataAsJSON(data, formattedValues);
      } catch (error) {
        console.error('JSON download failed:', error);
        throw error;
      }
    },
    []
  );

  return {
    downloadCSV,
    downloadJSON,
  };
}