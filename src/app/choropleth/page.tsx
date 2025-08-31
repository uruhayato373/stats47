import React from "react";
import { ChoroplethMap } from "@/components/estat/ChoroplethMap";
import { EstatMapDataService } from "@/lib/estat/map-data-service";
import { YearSelector } from "@/components/estat/YearSelector";

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
    const initialDataset = await EstatMapDataService.fetchMapData(statsDataId, {
      categoryFilter: params.category || defaultCategory,
      limit: 100,
    });

    availableYears = initialDataset.years;
    
    // 最新年度をデフォルトに設定（パラメータで指定されていない場合）
    if (!params.year && availableYears.length > 0) {
      selectedYear = availableYears.sort((a, b) => b.year - a.year)[0].code;
    } else {
      selectedYear = params.year;
    }

    // 選択された年度のデータを取得
    dataset = await EstatMapDataService.fetchMapData(statsDataId, {
      categoryFilter: params.category || defaultCategory,
      yearFilter: selectedYear,
      limit: 50, // 都道府県レベルなので50件で十分
    });
  } catch (err) {
    error = err instanceof Error ? err.message : "不明なエラーが発生しました";
    console.error("Failed to fetch map data:", err);
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          e-STAT コロプレス地図
        </h1>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-red-800 mb-2">
            データの読み込みに失敗しました
          </h2>
          <p className="text-red-700">{error}</p>
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
    );
  }

  if (!dataset) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">データを読み込み中...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          e-STAT コロプレス地図
        </h1>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800">
            <strong>{dataset.statName}</strong>{" "}
            のデータを都道府県別に可視化しています。
            {selectedYear && availableYears && (
              <span className="ml-2">
                （表示年度: {availableYears.find(y => y.code === selectedYear)?.displayName || selectedYear}）
              </span>
            )}
          </p>
          <p className="text-blue-700 text-sm mt-1">
            地図上の都道府県にマウスを重ねると詳細な値が表示されます。年度を変更すると、データが自動的に更新されます。
          </p>
        </div>
      </header>

      <main>
        {/* 年度選択コンポーネント */}
        {availableYears && availableYears.length > 0 && (
          <div className="mb-6">
            <YearSelector 
              years={availableYears} 
              currentYear={selectedYear}
            />
          </div>
        )}

        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <ChoroplethMap
            dataset={dataset}
            width={1000}
            height={700}
            className="w-full"
          />
        </div>

        {/* フィルター情報 */}
        <div className="grid md:grid-cols-2 gap-6">
          {dataset.categories.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-3">
                利用可能なカテゴリ
              </h3>
              <div className="space-y-2">
                {dataset.categories.slice(0, 5).map((category, index) => (
                  <div
                    key={`${category.code}-${index}`}
                    className="flex justify-between text-sm"
                  >
                    <span className="text-gray-700">{category.name}</span>
                    <span className="text-gray-500">{category.count}件</span>
                  </div>
                ))}
                {dataset.categories.length > 5 && (
                  <div className="text-sm text-gray-500">
                    他 {dataset.categories.length - 5} カテゴリ
                  </div>
                )}
              </div>
            </div>
          )}

          {dataset.years.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-3">利用可能な年度</h3>
              <div className="space-y-2">
                {dataset.years.slice(0, 5).map((year, index) => (
                  <div
                    key={`${year.code}-${index}`}
                    className="flex justify-between text-sm"
                  >
                    <span className="text-gray-700">{year.displayName}</span>
                    <span className="text-gray-500">{year.count}件</span>
                  </div>
                ))}
                {dataset.years.length > 5 && (
                  <div className="text-sm text-gray-500">
                    他 {dataset.years.length - 5} 年度
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 使用方法 */}
        <div className="mt-8 bg-gray-50 rounded-lg p-6">
          <h3 className="font-medium text-gray-900 mb-4">使用方法</h3>
          <div className="space-y-3 text-sm text-gray-700">
            <div>
              <strong>URLパラメータでフィルタリング:</strong>
              <ul className="mt-1 ml-4 space-y-1">
                <li>
                  •{" "}
                  <code className="bg-gray-200 px-1 rounded">
                    ?statsDataId=統計表ID
                  </code>{" "}
                  - 表示する統計表を指定
                </li>
                <li>
                  •{" "}
                  <code className="bg-gray-200 px-1 rounded">
                    ?category=カテゴリコード
                  </code>{" "}
                  - 特定カテゴリのみ表示
                </li>
                <li>
                  •{" "}
                  <code className="bg-gray-200 px-1 rounded">
                    ?year=年度コード
                  </code>{" "}
                  - 特定年度のみ表示
                </li>
              </ul>
            </div>
            <div>
              <strong>例:</strong>
              <code className="block mt-1 p-2 bg-gray-200 rounded text-xs">
                /choropleth?statsDataId=0000010101&category=A1101&year=2023000000
              </code>
            </div>
            <div className="mt-3 text-sm text-gray-600">
              <strong>デフォルト値:</strong>
              <ul className="mt-1 ml-4 space-y-1">
                <li>• statsDataId: 0000010101（人口推計）</li>
                <li>• category: A1101（総人口）</li>
                <li>• year: 最新年度を自動選択</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// メタデータを設定
export const metadata = {
  title: "e-STAT コロプレス地図 | Stats47",
  description:
    "e-STAT APIから取得した統計データを都道府県別にコロプレス地図で可視化します",
};
