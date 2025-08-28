"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import categories from "@/config/categories.json";
import { EstatDataFetcher } from "@/components/organisms/EstatDataFetcher";
import { StatisticsDisplay } from "@/components/molecules/StatisticsDisplay";
import { RegionSelector } from "@/components/atoms/RegionSelector";

export default function CategoryPage() {
  const params = useParams();
  const router = useRouter();
  const categoryId = params.categoryId as string;

  const [selectedRegion, setSelectedRegion] = useState("13"); // 東京都
  const [statisticsData, setStatisticsData] = useState(null);
  const [loading, setLoading] = useState(false);

  const regions = [
    { code: "13", name: "東京都" },
    { code: "27", name: "大阪府" },
    { code: "23", name: "愛知県" },
    { code: "14", name: "神奈川県" },
    { code: "11", name: "埼玉県" },
    { code: "12", name: "千葉県" },
    { code: "28", name: "兵庫県" },
    { code: "15", name: "新潟県" },
    { code: "16", name: "富山県" },
    { code: "17", name: "石川県" },
  ];

  // カテゴリ情報を取得
  const category = categories.find((cat) => cat.id === categoryId);

  // カテゴリが見つからない場合は404
  useEffect(() => {
    if (!category) {
      router.push("/dashboard");
    }
  }, [category, router]);

  const handleRegionChange = useCallback((regionCode: string) => {
    setSelectedRegion(regionCode);
  }, []);

  const handleDataUpdate = useCallback((data: any) => {
    setStatisticsData(data);
  }, []);

  const handleLoadingChange = useCallback((loadingState: boolean) => {
    setLoading(loadingState);
  }, []);

  if (!category) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            カテゴリが見つかりません
          </h1>
          <Link
            href="/dashboard"
            className="text-blue-600 hover:text-blue-800 underline"
          >
            ダッシュボードに戻る
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* ヘッダー */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link
              href="/dashboard"
              className="text-blue-600 hover:text-blue-800 underline"
            >
              ← ダッシュボードに戻る
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-16 h-16 rounded-lg bg-gray-100">
              <span className="text-4xl text-gray-600">
                {getCategoryIcon(category.icon)}
              </span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {category.name}
              </h1>
              <p className="text-gray-600">
                地域別の統計データを可視化します
              </p>
            </div>
          </div>
        </div>

        {/* サブカテゴリ一覧 */}
        {category.subcategories && category.subcategories.length > 0 && (
          <div className="mb-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              サブカテゴリ
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {category.subcategories.map((subcategory) => (
                <Link
                  key={subcategory.id}
                  href={`/dashboard/${categoryId}/${subcategory.id}`}
                  className="block p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                >
                  <h3 className="font-medium text-gray-900 mb-2">
                    {subcategory.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    詳細データを表示
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* 地域選択 */}
        <div className="mb-6">
          <RegionSelector
            regions={regions}
            selectedRegion={selectedRegion}
            onRegionChange={handleRegionChange}
          />
        </div>

        {/* データ取得 */}
        <div className="mb-6">
          <EstatDataFetcher
            regionCode={selectedRegion}
            onDataUpdate={handleDataUpdate}
            onLoadingChange={handleLoadingChange}
          />
        </div>

        {/* 統計データ表示 */}
        {loading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">データを取得中...</p>
          </div>
        )}

        {statisticsData && !loading && (
          <StatisticsDisplay
            data={statisticsData}
            regionName={regions.find((r) => r.code === selectedRegion)?.name}
            categoryName={category.name}
          />
        )}

        {/* データが取得できない場合のメッセージ */}
        {!statisticsData && !loading && (
          <div className="text-center py-8">
            <p className="text-gray-600">
              地域を選択してデータを取得してください
            </p>
          </div>
        )}
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
