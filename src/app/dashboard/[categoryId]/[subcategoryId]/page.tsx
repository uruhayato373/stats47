"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import categories from "@/config/categories.json";
import { EstatDataFetcher } from "@/components/organisms/EstatDataFetcher";
import { StatisticsDisplay } from "@/components/molecules/StatisticsDisplay";
import { RegionSelector } from "@/components/atoms/RegionSelector";

export default function SubcategoryPage() {
  const params = useParams();
  const router = useRouter();
  const categoryId = params.categoryId as string;
  const subcategoryId = params.subcategoryId as string;

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

  // カテゴリとサブカテゴリ情報を取得
  const category = categories.find((cat) => cat.id === categoryId);
  const subcategory = category?.subcategories?.find(
    (sub) => sub.id === subcategoryId
  );

  // カテゴリまたはサブカテゴリが見つからない場合は404
  useEffect(() => {
    if (!category || !subcategory) {
      router.push("/dashboard");
    }
  }, [category, subcategory, router]);

  const handleRegionChange = useCallback((regionCode: string) => {
    setSelectedRegion(regionCode);
  }, []);

  const handleDataUpdate = useCallback((data: any) => {
    setStatisticsData(data);
  }, []);

  const handleLoadingChange = useCallback((loadingState: boolean) => {
    setLoading(loadingState);
  }, []);

  if (!category || !subcategory) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            サブカテゴリが見つかりません
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
        {/* パンくずリスト */}
        <div className="mb-6">
          <nav className="flex" aria-label="Breadcrumb">
            <ol className="inline-flex items-center space-x-1 md:space-x-3">
              <li className="inline-flex items-center">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600"
                >
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                  </svg>
                  ダッシュボード
                </Link>
              </li>
              <li>
                <div className="flex items-center">
                  <svg
                    className="w-6 h-6 text-gray-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <Link
                    href={`/dashboard/${categoryId}`}
                    className="ml-1 text-sm font-medium text-gray-700 hover:text-blue-600 md:ml-2"
                  >
                    {category.name}
                  </Link>
                </div>
              </li>
              <li aria-current="page">
                <div className="flex items-center">
                  <svg
                    className="w-6 h-6 text-gray-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="ml-1 text-sm font-medium text-gray-500 md:ml-2">
                    {subcategory.name}
                  </span>
                </div>
              </li>
            </ol>
          </nav>
        </div>

        {/* ヘッダー */}
        <div className="mb-8">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-16 h-16 rounded-lg bg-gray-100">
              <span className="text-4xl text-gray-600">
                {getCategoryIcon(category.icon)}
              </span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {subcategory.name}
              </h1>
              <p className="text-gray-600">
                {category.name}の詳細な統計データを可視化します
              </p>
            </div>
          </div>
        </div>

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
            subcategoryName={subcategory.name}
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

        {/* 関連リンク */}
        <div className="mt-12 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            関連リンク
          </h2>
          <div className="flex flex-wrap gap-4">
            <Link
              href={`/dashboard/${categoryId}`}
              className="text-blue-600 hover:text-blue-800 underline"
            >
              ← {category.name}に戻る
            </Link>
            <Link
              href="/dashboard"
              className="text-blue-600 hover:text-blue-800 underline"
            >
              ← ダッシュボードに戻る
            </Link>
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
