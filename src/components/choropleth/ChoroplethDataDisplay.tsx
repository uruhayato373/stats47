"use client";

import React from 'react';
import { useAtom } from 'jotai';
import { MapPin, AlertCircle, RefreshCw, Download, FileText } from 'lucide-react';
import {
  selectedSubcategoryDataAtom,
  selectedYearAtom,
  mapVisualizationSettingsAtom
} from '@/atoms/choropleth';
import { ChoroplethMap } from '@/components/d3/ChoroplethMap';
import { PrefectureDataTable } from '@/components/choropleth/PrefectureDataTable';
import { useChoroplethData, useChoroplethDownload } from '@/hooks/useChoroplethData';
import { useStyles } from '@/hooks/useStyles';

interface ChoroplethDataDisplayProps {
  className?: string;
}

export const ChoroplethDataDisplay: React.FC<ChoroplethDataDisplayProps> = ({
  className = ""
}) => {
  const styles = useStyles();
  const [selectedSubcategory] = useAtom(selectedSubcategoryDataAtom);
  const [selectedYear] = useAtom(selectedYearAtom);
  const [mapSettings] = useAtom(mapVisualizationSettingsAtom);

  // データフック
  const { data, loading, error, refetch, formattedValues, isSample } = useChoroplethData();
  const { downloadCSV, downloadJSON } = useChoroplethDownload();

  // データが選択されていない場合
  if (!selectedSubcategory || !selectedYear) {
    return (
      <div className={`${styles.card.base} ${className}`}>
        <div className="p-8 text-center">
          <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-neutral-100 mb-2">
            データ表示
          </h3>
          <p className="text-gray-600 dark:text-neutral-400">
            左側のメニューからカテゴリとサブカテゴリを選択し、年度を指定してください。
            <br />
            選択された統計データがコロプレス地図として表示されます。
          </p>
        </div>
      </div>
    );
  }

  // ローディング状態
  if (loading) {
    return (
      <div className={`${styles.card.base} ${className}`}>
        <div className="p-8 text-center">
          <RefreshCw className="w-8 h-8 text-indigo-600 mx-auto mb-4 animate-spin" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-neutral-100 mb-2">
            データを読み込み中...
          </h3>
          <p className="text-gray-600 dark:text-neutral-400">
            e-stat APIからデータを取得しています
          </p>
        </div>
      </div>
    );
  }

  // エラー状態
  if (error) {
    return (
      <div className={`${styles.card.base} ${className}`}>
        <div className="p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-neutral-100 mb-2">
            データの取得に失敗しました
          </h3>
          <p className="text-red-600 dark:text-red-400 mb-4">
            {error}
          </p>
          <button
            className={styles.button.primary}
            onClick={refetch}
          >
            再試行
          </button>
        </div>
      </div>
    );
  }

  // ダウンロードハンドラー
  const handleDownload = () => {
    if (data && formattedValues.length > 0) {
      downloadCSV(data, formattedValues);
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* ヘッダー情報 */}
      <div className={styles.card.base}>
        <div className="p-4 border-b border-gray-200 dark:border-neutral-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className={`${styles.heading.lg} flex items-center gap-2`}>
                <MapPin className="w-6 h-6 text-indigo-600" />
                {selectedSubcategory.name}
                {isSample && (
                  <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                    サンプル
                  </span>
                )}
              </h2>
              <p className="text-sm text-gray-600 dark:text-neutral-400 mt-1">
                {selectedYear}年 • {selectedSubcategory.description}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownload}
                className={styles.button.secondary}
                title="データをダウンロード"
                disabled={!data || formattedValues.length === 0}
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* データ統計情報 */}
        {data && (
          <div className="p-4 bg-gray-50 dark:bg-neutral-800">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-neutral-100">
                  {data.data.length}
                </div>
                <div className="text-xs text-gray-600 dark:text-neutral-400">都道府県数</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-neutral-100">
                  {Math.round(data.average).toLocaleString()}
                </div>
                <div className="text-xs text-gray-600 dark:text-neutral-400">平均値</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-600">
                  {data.data[0]?.value.toLocaleString() || '-'}
                </div>
                <div className="text-xs text-gray-600 dark:text-neutral-400">最大値</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {data.data[data.data.length - 1]?.value.toLocaleString() || '-'}
                </div>
                <div className="text-xs text-gray-600 dark:text-neutral-400">最小値</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* コロプレス地図 */}
      <div className={styles.card.base}>
        <div className="p-4 border-b border-gray-200 dark:border-neutral-700">
          <h3 className={styles.heading.md}>地図表示</h3>
        </div>
        <div className="p-4">
          {formattedValues.length > 0 ? (
            <ChoroplethMap
              data={formattedValues}
              options={{
                colorScheme: selectedSubcategory.colorScheme || mapSettings.colorScheme,
                divergingMidpoint: mapSettings.divergingMidpoint,
              }}
              className="w-full"
            />
          ) : (
            <div className="h-96 flex items-center justify-center bg-gray-50 dark:bg-neutral-800 rounded-lg">
              <p className="text-gray-600 dark:text-neutral-400">
                データがありません
              </p>
            </div>
          )}
        </div>
      </div>

      {/* データテーブル */}
      {data && (
        <PrefectureDataTable
          data={data.data}
          unit={selectedSubcategory.unit}
          dataType={selectedSubcategory.dataType}
          onDownload={handleDownload}
        />
      )}
    </div>
  );
};