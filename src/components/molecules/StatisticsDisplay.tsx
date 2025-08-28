"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface StatisticsDisplayProps {
  data: any;
  regionName?: string;
  categoryName?: string;
  subcategoryName?: string;
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

export function StatisticsDisplay({
  data,
  regionName,
  categoryName,
  subcategoryName,
}: StatisticsDisplayProps) {
  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* 基本情報 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          {regionName || "地域"}の統計情報
          {categoryName && (
            <span className="text-lg font-normal text-gray-600 ml-2">
              - {categoryName}
            </span>
          )}
          {subcategoryName && (
            <span className="text-lg font-normal text-gray-600 ml-2">
              - {subcategoryName}
            </span>
          )}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {data.population?.[
                data.population.length - 1
              ]?.value?.toLocaleString() || "N/A"}
            </div>
            <div className="text-sm text-gray-600">最新人口</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {data.gdp?.[data.gdp.length - 1]?.value || "N/A"}
            </div>
            <div className="text-sm text-gray-600">最新GDP指数</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {data.unemployment?.[data.unemployment.length - 1]?.value ||
                "N/A"}
              %
            </div>
            <div className="text-sm text-gray-600">最新失業率</div>
          </div>
        </div>
      </div>

      {/* 人口推移グラフ */}
      {data.population && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            人口推移（2015-2022年）
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.population}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip
                formatter={(value: number) => [value.toLocaleString(), "人口"]}
                labelFormatter={(label) => `${label}年`}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#0088FE"
                strokeWidth={2}
                dot={{ fill: "#0088FE", strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* GDP推移グラフ */}
      {data.gdp && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            GDP指数推移（2015-2022年）
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.gdp}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip
                formatter={(value: number) => [value, "GDP指数"]}
                labelFormatter={(label) => `${label}年`}
              />
              <Legend />
              <Bar dataKey="value" fill="#00C49F" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* 失業率推移グラフ */}
      {data.unemployment && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            失業率推移（2015-2022年）
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.unemployment}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip
                formatter={(value: number) => [`${value}%`, "失業率"]}
                labelFormatter={(label) => `${label}年`}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#FF8042"
                strokeWidth={2}
                dot={{ fill: "#FF8042", strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* 年齢構成円グラフ */}
      {data.demographics && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">年齢構成</h3>
          <div className="flex justify-center">
            <ResponsiveContainer width={300} height={300}>
              <PieChart>
                <Pie
                  data={data.demographics}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ age, percent }) =>
                    `${age} ${(percent * 100).toFixed(1)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {data.demographics.map((entry: any, index: number) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [`${value}%`, "割合"]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* データソース情報 */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="text-sm text-gray-600">
          <p>
            <strong>データソース:</strong> {data.source || "e-Stat API"}
          </p>
          {data.lastUpdated && (
            <p>
              <strong>最終更新:</strong>{" "}
              {new Date(data.lastUpdated).toLocaleString("ja-JP")}
            </p>
          )}
          {data.regionCode && (
            <p>
              <strong>地域コード:</strong> {data.regionCode}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
