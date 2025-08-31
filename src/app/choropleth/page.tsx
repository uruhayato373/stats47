import React from "react";
import { ChoroplethMap } from "@/components/estat/ChoroplethMap";
import { EstatDataProcessor } from "@/lib/estat/EstatDataProcessor";
import { YearSelector } from "@/components/estat/YearSelector";
import { EstatDataTable } from "@/components/estat/EstatDataTable";
import EstatMetadataDisplay from "@/components/estat/EstatMetadataDisplay";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";

interface ChoroplethPageProps {
  searchParams: {
    statsDataId?: string;
    category?: string;
    year?: string;
  };
}

export default async function ChoroplethPage({
  searchParams,
}: ChoroplethPageProps) {
  // searchParamsをawaitする
  const params = await searchParams;

  // デフォルトの統計データID（人口統計など）
  const defaultStatsDataId = "0000010101"; // 人口推計
  const defaultCategory = "A1101"; // 総人口
  const statsDataId = params.statsDataId || defaultStatsDataId;

  let dataset;
  let availableYears;
  let selectedYear;
  let error: string | null = null;

  try {
    // まず利用可能な年度情報を取得
    const initialDataset = await EstatDataProcessor.getStatsData(statsDataId, {
      categoryFilter: params.category || defaultCategory,
    });

    // 年度情報をYearSelectorが期待する形式に変換
    availableYears = initialDataset.years.map((year) => ({
      code: year.code,
      year: year.year || 0,
      displayName: year.displayName,
      count: 47, // 都道府県数は固定
    }));

    // 最新年度をデフォルトに設定（パラメータで指定されていない場合）
    if (!params.year && availableYears.length > 0) {
      selectedYear = availableYears.sort((a, b) => b.year - a.year)[0].code;
    } else {
      selectedYear = params.year;
    }

    // 選択された年度のデータを取得
    const rawDataset = await EstatDataProcessor.getStatsData(statsDataId, {
      categoryFilter: params.category || defaultCategory,
      yearFilter: selectedYear,
    });

    // ChoroplethMapが期待する形式に変換
    dataset = {
      statName: rawDataset.tableInfo.statName,
      dataPoints: rawDataset.values.map((value) => ({
        prefectureCode: value.areaCode || "",
        prefectureName: value.areaInfo?.displayName || value.areaCode || "",
        value: value.numericValue || 0,
        displayValue: value.displayValue,
        unit: value.unit,
      })),
      categories: rawDataset.categories.map((category) => ({
        code: category.code,
        name: category.name,
        count: rawDataset.values.filter((v) => v.areaCode).length,
      })),
      years: rawDataset.years.map((year) => ({
        code: year.code,
        year: year.year || 0,
        displayName: year.displayName,
        count: rawDataset.values.filter((v) => v.yearInfo?.code === year.code)
          .length,
      })),
    };
  } catch (err) {
    error = err instanceof Error ? err.message : "不明なエラーが発生しました";
    console.error("Failed to fetch map data:", err);
  }

  if (error) {
    return (
      <>
        <Header />
        <Sidebar />
        <main className="lg:ps-60 transition-all duration-300 pt-13 px-3 pb-3 min-h-screen">
          <div className="bg-white border border-gray-200 shadow-xs rounded-lg dark:bg-neutral-800 dark:border-neutral-700">
            <div className="p-6">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-neutral-100 mb-6">
                e-STAT コロプレス地図
              </h1>
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 dark:bg-red-900/20 dark:border-red-700">
                <h2 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
                  データの読み込みに失敗しました
                </h2>
                <p className="text-red-700 dark:text-red-300">{error}</p>
                <div className="mt-4">
                  <a
                    href="/choropleth"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                  >
                    再読み込み
                  </a>
                </div>
              </div>
            </div>
          </div>
        </main>
      </>
    );
  }

  if (!dataset) {
    return (
      <>
        <Header />
        <Sidebar />
        <main className="lg:ps-60 transition-all duration-300 pt-13 px-3 pb-3 min-h-screen">
          <div className="bg-white border border-gray-200 shadow-xs rounded-lg dark:bg-neutral-800 dark:border-neutral-700">
            <div className="p-6">
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600 dark:text-neutral-400">
                    データを読み込み中...
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <Sidebar />

      <main className="lg:ps-60 transition-all duration-300 pt-13 px-3 pb-3 min-h-screen">
        <div className="bg-white border border-gray-200 shadow-xs rounded-lg dark:bg-neutral-800 dark:border-neutral-700 max-w-full overflow-hidden">
          {/* ヘッダーセクション */}
          <div className="py-3 px-4 flex flex-wrap justify-between items-center gap-2 bg-white border-b border-gray-200 dark:bg-neutral-800 dark:border-neutral-700">
            <div>
              <h1 className="font-medium text-lg text-gray-800 dark:text-neutral-200 flex items-center gap-2">
                <svg
                  className="w-6 h-6 text-indigo-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m0 0L9 7"
                  />
                </svg>
                e-STAT コロプレス地図
              </h1>
              <p className="text-sm text-gray-500 dark:text-neutral-400 mt-1">
                e-Stat
                APIから取得した統計データを都道府県別にコロプレス地図で可視化します
              </p>
            </div>
          </div>

          {/* コンテンツエリア */}
          <div className="p-4 bg-white dark:bg-neutral-900">
            <div className="flex flex-col lg:flex-row gap-6 max-w-full">
              {/* メインコンテンツ */}
              <div className="flex-1 space-y-6 min-w-0">
                {/* 年度選択コンポーネント */}
                {availableYears && availableYears.length > 0 && (
                  <div className="mb-6">
                    <YearSelector
                      years={availableYears}
                      currentYear={selectedYear}
                    />
                  </div>
                )}

                {/* コロプレス地図 */}
                <div className="bg-white rounded-lg shadow-lg p-6 mb-8 dark:bg-neutral-800 overflow-hidden">
                  <div className="w-full overflow-x-auto">
                    <ChoroplethMap
                      dataset={dataset}
                      width={800}
                      height={600}
                      className="w-full max-w-full"
                    />
                  </div>
                </div>

                {/* データテーブル */}
                <div className="overflow-hidden">
                  <EstatDataTable
                    dataPoints={dataset.dataPoints}
                    title={`${dataset.statName} - 都道府県別データ`}
                    className="mb-8"
                  />
                </div>

                {/* フィルター情報 */}
                <div className="grid md:grid-cols-2 gap-6">
                  {dataset.categories.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-4 dark:bg-neutral-700">
                      <h3 className="font-medium text-gray-900 dark:text-neutral-100 mb-3">
                        利用可能なカテゴリ
                      </h3>
                      <div className="space-y-2">
                        {dataset.categories
                          .slice(0, 5)
                          .map((category, index) => (
                            <div
                              key={`${category.code}-${index}`}
                              className="flex justify-between text-sm"
                            >
                              <span className="text-gray-700 dark:text-neutral-300">
                                {category.name}
                              </span>
                              <span className="text-gray-500 dark:text-neutral-400">
                                {category.count}件
                              </span>
                            </div>
                          ))}
                        {dataset.categories.length > 5 && (
                          <div className="text-sm text-gray-500 dark:text-neutral-400">
                            他 {dataset.categories.length - 5} カテゴリ
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {dataset.years.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-4 dark:bg-neutral-700">
                      <h3 className="font-medium text-gray-900 dark:text-neutral-100 mb-3">
                        利用可能な年度
                      </h3>
                      <div className="space-y-2">
                        {dataset.years.slice(0, 5).map((year, index) => (
                          <div
                            key={`${year.code}-${index}`}
                            className="flex justify-between text-sm"
                          >
                            <span className="text-gray-700 dark:text-neutral-300">
                              {year.displayName}
                            </span>
                            <span className="text-gray-500 dark:text-neutral-400">
                              {year.count}件
                            </span>
                          </div>
                        ))}
                        {dataset.years.length > 5 && (
                          <div className="text-sm text-gray-500 dark:text-neutral-400">
                            他 {dataset.years.length - 5} 年度
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* 使用方法 */}
                <div className="mt-8 bg-gray-50 rounded-lg p-6 dark:bg-neutral-700">
                  <h3 className="font-medium text-gray-900 dark:text-neutral-100 mb-4">
                    使用方法
                  </h3>
                  <div className="space-y-3 text-sm text-gray-700 dark:text-neutral-300">
                    <div>
                      <strong>URLパラメータでフィルタリング:</strong>
                      <ul className="mt-1 ml-4 space-y-1">
                        <li>
                          •{" "}
                          <code className="bg-gray-200 px-1 rounded dark:bg-neutral-600">
                            ?statsDataId=統計表ID
                          </code>{" "}
                          - 表示する統計表を指定
                        </li>
                        <li>
                          •{" "}
                          <code className="bg-gray-200 px-1 rounded dark:bg-neutral-600">
                            ?category=カテゴリコード
                          </code>{" "}
                          - 特定カテゴリのみ表示
                        </li>
                        <li>
                          •{" "}
                          <code className="bg-gray-200 px-1 rounded dark:bg-neutral-600">
                            ?year=年度コード
                          </code>{" "}
                          - 特定年度のみ表示
                        </li>
                      </ul>
                    </div>
                    <div>
                      <strong>例:</strong>
                      <code className="block mt-1 p-2 bg-gray-200 rounded text-xs dark:bg-neutral-600">
                        /choropleth?statsDataId=0000010101&category=A1101&year=2023000000
                      </code>
                    </div>
                    <div className="mt-3 text-sm text-gray-600 dark:text-neutral-400">
                      <strong>デフォルト値:</strong>
                      <ul className="mt-1 ml-4 space-y-1">
                        <li>• statsDataId: 0000010101（人口推計）</li>
                        <li>• category: A1101（総人口）</li>
                        <li>• year: 最新年度を自動選択</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* 右側サイドバー - e-STATメタデータ */}
              <div className="lg:w-80 flex-shrink-0 min-w-0">
                <EstatMetadataDisplay />
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

// メタデータを設定
export const metadata = {
  title: "e-STAT コロプレス地図 | Stats47",
  description:
    "e-STAT APIから取得した統計データを都道府県別にコロプレス地図で可視化します",
};
