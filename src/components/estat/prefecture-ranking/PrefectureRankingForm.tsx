"use client";

import { useState } from "react";
import { Search, MapPin, Calendar, BarChart3 } from "lucide-react";

interface PrefectureRankingParams {
  statsDataId: string;
  categoryCode?: string;
  areaCode?: string;
  timeCode?: string;
}

interface PrefectureRankingFormProps {
  onSubmit: (params: PrefectureRankingParams) => void;
  loading: boolean;
}

export default function PrefectureRankingForm({
  onSubmit,
  loading,
}: PrefectureRankingFormProps) {
  const [formData, setFormData] = useState<PrefectureRankingParams>({
    statsDataId: "",
    categoryCode: "",
    areaCode: "",
    timeCode: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.statsDataId.trim()) {
      onSubmit(formData);
    }
  };

  const handleInputChange = (field: keyof PrefectureRankingParams) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value,
    }));
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 dark:bg-neutral-800 dark:border-neutral-700">
      <div className="flex items-center gap-2 mb-4">
        <MapPin className="w-5 h-5 text-indigo-600" />
        <h2 className="text-lg font-medium text-gray-900 dark:text-neutral-100">
          都道府県ランキング設定
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 統計表ID */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
              統計表ID *
            </label>
            <div className="relative">
              <BarChart3 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={formData.statsDataId}
                onChange={handleInputChange("statsDataId")}
                placeholder="例: 0003448368"
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-100"
                required
              />
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-neutral-400">
              e-STATの統計表IDを入力してください
            </p>
          </div>

          {/* カテゴリコード */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
              カテゴリコード
            </label>
            <input
              type="text"
              value={formData.categoryCode}
              onChange={handleInputChange("categoryCode")}
              placeholder="例: 01"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-100"
            />
          </div>

          {/* 地域コード */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
              地域コード
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={formData.areaCode}
                onChange={handleInputChange("areaCode")}
                placeholder="例: 00000"
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-100"
              />
            </div>
          </div>

          {/* 時間軸コード */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
              時間軸コード
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={formData.timeCode}
                onChange={handleInputChange("timeCode")}
                placeholder="例: 2020000000"
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-100"
              />
            </div>
          </div>
        </div>

        {/* 送信ボタン */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading || !formData.statsDataId.trim()}
            className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Search className={`w-4 h-4 ${loading ? "animate-pulse" : ""}`} />
            {loading ? "取得中..." : "データ取得・地図表示"}
          </button>
        </div>
      </form>
    </div>
  );
}