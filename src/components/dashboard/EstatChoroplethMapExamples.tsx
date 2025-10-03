/**
 * EstatChoroplethMap コンポーネントの使用例
 *
 * このファイルはダッシュボードで使用例を表示するためのものです。
 */

import React from "react";
import { EstatChoroplethMap } from "@/components/estat/ChoroplethMap";

/**
 * 基本的な使用例
 * 総人口のデータを2020年で取得して表示
 */
export function BasicExample() {
  return (
    <EstatChoroplethMap
      params={{
        statsDataId: "0000010101",
        cdCat01: "A1101", // 総人口
        cdTime: "2020000000", // 2020年
        limit: 100000,
      }}
    />
  );
}

/**
 * カラースキーム指定の例
 * 緑色のグラデーションで表示
 */
export function CustomColorExample() {
  return (
    <EstatChoroplethMap
      params={{
        statsDataId: "0003410379",
        cdCat01: "A1101",
        cdTime: "2020000000",
      }}
      options={{
        colorScheme: "interpolateGreens",
        divergingMidpoint: "mean",
      }}
    />
  );
}

/**
 * サイズ指定の例
 * カスタムの幅と高さで表示
 */
export function CustomSizeExample() {
  return (
    <EstatChoroplethMap
      params={{
        statsDataId: "0003410379",
        cdCat01: "A1101",
        cdTime: "2020000000",
      }}
      width={1000}
      height={800}
      className="rounded-lg shadow-lg"
    />
  );
}

/**
 * コールバック使用例
 * データ読み込み完了時とエラー時の処理
 */
export function CallbackExample() {
  const handleDataLoaded = (values: any[]) => {
    console.log("データ読み込み完了:", values.length, "件");

    // 統計情報を計算
    const numericValues = values
      .map((v) => v.numericValue)
      .filter((v): v is number => v !== null);

    const sum = numericValues.reduce((a, b) => a + b, 0);
    const avg = sum / numericValues.length;
    const max = Math.max(...numericValues);
    const min = Math.min(...numericValues);

    console.log("統計情報:", { sum, avg, max, min });
  };

  const handleError = (error: Error) => {
    console.error("エラー発生:", error.message);
    // エラー通知を表示するなど
  };

  return (
    <EstatChoroplethMap
      params={{
        statsDataId: "0003410379",
        cdCat01: "A1101",
        cdTime: "2020000000",
      }}
      onDataLoaded={handleDataLoaded}
      onError={handleError}
    />
  );
}

/**
 * 年度切り替えの例
 * ドロップダウンで年度を選択して地図を更新
 */
export function YearSelectorExample() {
  const [selectedYear, setSelectedYear] = React.useState("2020000000");

  const years = [
    { value: "2020000000", label: "2020年" },
    { value: "2015000000", label: "2015年" },
    { value: "2010000000", label: "2010年" },
    { value: "2005000000", label: "2005年" },
  ];

  return (
    <div>
      <div className="mb-4">
        <label htmlFor="year-select" className="mr-2 font-medium">
          年度を選択:
        </label>
        <select
          id="year-select"
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded"
        >
          {years.map((year) => (
            <option key={year.value} value={year.value}>
              {year.label}
            </option>
          ))}
        </select>
      </div>

      <EstatChoroplethMap
        params={{
          statsDataId: "0003410379",
          cdCat01: "A1101",
          cdTime: selectedYear,
        }}
      />
    </div>
  );
}

/**
 * 複数のカテゴリ表示例
 * タブで異なるカテゴリのデータを切り替え
 */
export function MultiCategoryExample() {
  const [selectedCategory, setSelectedCategory] = React.useState("A1101");

  const categories = [
    { code: "A1101", name: "総人口" },
    { code: "A1301", name: "年少人口" },
    { code: "A1302", name: "生産年齢人口" },
    { code: "A1303", name: "老年人口" },
  ];

  return (
    <div>
      <div className="mb-4 flex gap-2">
        {categories.map((category) => (
          <button
            key={category.code}
            onClick={() => setSelectedCategory(category.code)}
            className={`px-4 py-2 rounded ${
              selectedCategory === category.code
                ? "bg-indigo-600 text-white"
                : "bg-gray-200 text-gray-800"
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>

      <EstatChoroplethMap
        params={{
          statsDataId: "0003410379",
          cdCat01: selectedCategory,
          cdTime: "2020000000",
        }}
      />
    </div>
  );
}

/**
 * ダイバージングカラースキーム例
 * ゼロを基準とした色分け（増減を表示）
 */
export function DivergingColorExample() {
  return (
    <EstatChoroplethMap
      params={{
        statsDataId: "0003410379",
        cdCat01: "A1101",
        cdTime: "2020000000",
      }}
      options={{
        colorScheme: "interpolateRdBu", // 赤青のダイバージングカラー
        divergingMidpoint: "zero", // ゼロを中心に
      }}
    />
  );
}

/**
 * エラーハンドリングの例
 * 存在しない統計表IDを指定してエラー表示を確認
 */
export function ErrorHandlingExample() {
  return (
    <div>
      <h2 className="text-xl font-bold mb-4">エラーハンドリングのテスト</h2>
      <p className="mb-4 text-gray-600">
        存在しない統計表IDを指定しているため、エラーが表示されます。
      </p>
      <EstatChoroplethMap
        params={{
          statsDataId: "invalid-id",
          cdCat01: "A1101",
          cdTime: "2020000000",
        }}
        onError={(error) => {
          console.error("エラーをキャッチ:", error);
        }}
      />
    </div>
  );
}
