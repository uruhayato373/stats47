"use client";

import { useEffect, useState } from "react";

interface EstatDataFetcherProps {
  regionCode: string;
  onDataUpdate: (data: any) => void;
  onLoadingChange: (loading: boolean) => void;
}

// e-Stat APIの設定
const ESTAT_API_BASE_URL = "https://api.e-stat.go.jp/rest/3.0/app/json";
const ESTAT_APP_ID = process.env.NEXT_PUBLIC_ESTAT_APP_ID || "your-app-id-here";

// サンプルデータ（APIキーがない場合のフォールバック）
const SAMPLE_DATA = {
  population: [
    { year: "2015", value: 13515271 },
    { year: "2016", value: 13547910 },
    { year: "2017", value: 13570224 },
    { year: "2018", value: 13587000 },
    { year: "2019", value: 13592926 },
    { year: "2020", value: 13515271 },
    { year: "2021", value: 13420510 },
    { year: "2022", value: 13345194 },
  ],
  gdp: [
    { year: "2015", value: 93.2 },
    { year: "2016", value: 94.8 },
    { year: "2017", value: 97.1 },
    { year: "2018", value: 98.1 },
    { year: "2019", value: 98.8 },
    { year: "2020", value: 95.1 },
    { year: "2021", value: 97.8 },
    { year: "2022", value: 100.0 },
  ],
  unemployment: [
    { year: "2015", value: 3.4 },
    { year: "2016", value: 3.1 },
    { year: "2017", value: 2.8 },
    { year: "2018", value: 2.4 },
    { year: "2019", value: 2.3 },
    { year: "2020", value: 2.8 },
    { year: "2021", value: 2.8 },
    { year: "2022", value: 2.6 },
  ],
  demographics: [
    { age: "0-14歳", value: 12.1 },
    { age: "15-64歳", value: 59.4 },
    { age: "65歳以上", value: 28.5 },
  ],
};

export function EstatDataFetcher({
  regionCode,
  onDataUpdate,
  onLoadingChange,
}: EstatDataFetcherProps) {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      onLoadingChange(true);
      setError(null);

      try {
        // 実際のe-Stat APIを使用する場合
        if (ESTAT_APP_ID !== "your-app-id-here") {
          const response = await fetch(
            `${ESTAT_API_BASE_URL}/getStatsData?appId=${ESTAT_APP_ID}&statsDataId=0003109941&metaGetFlg=Y&cntGetFlg=N`
          );

          if (!response.ok) {
            throw new Error("APIリクエストに失敗しました");
          }

          const data = await response.json();
          onDataUpdate(data);
        } else {
          // サンプルデータを使用（APIキーがない場合）
          console.log(
            "e-Stat APIキーが設定されていないため、サンプルデータを使用します"
          );

          // 地域コードに応じてデータを調整
          const adjustedData = {
            ...SAMPLE_DATA,
            regionCode,
            regionName: getRegionName(regionCode),
            lastUpdated: new Date().toISOString(),
            source: "サンプルデータ（e-Stat APIキーが必要）",
          };

          onDataUpdate(adjustedData);
        }
      } catch (err) {
        console.error("データ取得エラー:", err);
        setError("データの取得に失敗しました");

        // エラー時もサンプルデータを表示
        const fallbackData = {
          ...SAMPLE_DATA,
          regionCode,
          regionName: getRegionName(regionCode),
          lastUpdated: new Date().toISOString(),
          source: "サンプルデータ（エラー時のフォールバック）",
        };

        onDataUpdate(fallbackData);
      } finally {
        onLoadingChange(false);
      }
    };

    fetchData();
  }, [regionCode]); // onDataUpdateとonLoadingChangeを依存配列から削除

  const getRegionName = (code: string): string => {
    const regionNames: { [key: string]: string } = {
      "13": "東京都",
      "27": "大阪府",
      "23": "愛知県",
      "14": "神奈川県",
      "11": "埼玉県",
      "12": "千葉県",
      "28": "兵庫県",
      "15": "新潟県",
      "16": "富山県",
      "17": "石川県",
    };
    return regionNames[code] || "不明";
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        データ取得状況
      </h2>

      {ESTAT_APP_ID === "your-app-id-here" && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-yellow-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                e-Stat APIキーが設定されていません
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  実際の統計データを取得するには、環境変数{" "}
                  <code className="bg-yellow-100 px-1 py-0.5 rounded">
                    NEXT_PUBLIC_ESTAT_APP_ID
                  </code>{" "}
                  に e-Stat APIのアプリケーションIDを設定してください。
                </p>
                <p className="mt-1">現在はサンプルデータを表示しています。</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                エラーが発生しました
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="text-sm text-gray-600">
        <p>地域コード: {regionCode}</p>
        <p>地域名: {getRegionName(regionCode)}</p>
        <p>
          データソース:{" "}
          {ESTAT_APP_ID === "your-app-id-here"
            ? "サンプルデータ"
            : "e-Stat API"}
        </p>
      </div>
    </div>
  );
}
