"use client";

import { useState } from "react";
import Link from "next/link";
import categories from "@/config/categories.json";

export default function DashboardPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredCategories = categories.filter((category) =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* ヘッダー */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            地域統計ダッシュボード
          </h1>
          <p className="text-gray-600">
            カテゴリ別の統計データを閲覧できます
          </p>
        </div>

        {/* 検索バー */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="カテゴリを検索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg
                className="h-5 w-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* カテゴリグリッド */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredCategories.map((category) => (
            <Link
              key={category.id}
              href={`/dashboard/${category.id}`}
              className="group"
            >
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
                {/* アイコン */}
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-gray-100 mb-4 group-hover:bg-blue-50 transition-colors">
                  <span className="text-2xl text-gray-600 group-hover:text-blue-600">
                    {getCategoryIcon(category.icon)}
                  </span>
                </div>

                {/* カテゴリ名 */}
                <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                  {category.name}
                </h3>

                {/* サブカテゴリ数 */}
                {category.subcategories && (
                  <p className="text-sm text-gray-500">
                    {category.subcategories.length}個のサブカテゴリ
                  </p>
                )}

                {/* カラーインジケーター */}
                <div className="mt-4">
                  <div
                    className={`w-full h-2 rounded-full bg-${category.color}-200`}
                  >
                    <div
                      className={`h-2 rounded-full bg-${category.color}-500 transition-all duration-300 group-hover:bg-${category.color}-600`}
                      style={{ width: "100%" }}
                    />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* 統計情報 */}
        <div className="mt-12 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            統計情報
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {categories.length}
              </div>
              <div className="text-sm text-gray-500">総カテゴリ数</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {categories.reduce(
                  (total, category) =>
                    total + (category.subcategories?.length || 0),
                  0
                )}
              </div>
              <div className="text-sm text-gray-500">総サブカテゴリ数</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">
                {categories.filter((category) => category.subcategories).length}
              </div>
              <div className="text-sm text-gray-500">サブカテゴリあり</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// アイコン取得関数（FontAwesomeアイコンの代替）
function getCategoryIcon(iconName: string): string {
  const iconMap: { [key: string]: string } = {
    FaMapMarkedAlt: "🗺️",
    FaUsers: "👥",
    FaChartLine: "📈",
    FaLeaf: "🍃",
    FaIndustry: "🏭",
    FaStore: "🏪",
    FaHome: "🏠",
    FaWater: "💧",
    FaPlane: "✈️",
    FaGraduationCap: "🎓",
    FaGavel: "⚖️",
    FaShieldAlt: "🛡️",
    FaHospital: "🏥",
    FaGlobe: "🌍",
    FaRoad: "🛣️",
  };

  return iconMap[iconName] || "📊";
}
