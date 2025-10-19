"use client";

import { useState } from "react";
import { Search, RotateCcw } from "lucide-react";
import { GetStatsDataParams } from "@/lib/estat-api";
import InputField from "@/components/atoms/InputField";

interface EstatDataFetcherProps {
  onSubmit: (params: GetStatsDataParams) => void;
  loading: boolean;
}

type FormData = {
  statsDataId: string;
  cdCat01: string;
  cdArea: string;
  cdTime: string;
};

export default function EstatDataFetcher({
  onSubmit,
  loading,
}: EstatDataFetcherProps) {
  const [formData, setFormData] = useState<FormData>({
    statsDataId: "0000010101",
    cdCat01: "A1101",
    cdArea: "",
    cdTime: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const params: GetStatsDataParams = {
      appId: process.env.NEXT_PUBLIC_ESTAT_APP_ID || "",
      statsDataId: formData.statsDataId,
      ...(formData.cdCat01 && { cdCat01: formData.cdCat01 }),
      ...(formData.cdArea && { cdArea: formData.cdArea }),
      ...(formData.cdTime && { cdTime: formData.cdTime }),
    };

    onSubmit(params);
  };

  const handleReset = () => {
    setFormData({
      statsDataId: "0000010101",
      cdCat01: "",
      cdArea: "",
      cdTime: "",
    });
  };

  return (
    <div className="space-y-4">
      {/* <div className="bg-white border border-gray-200 rounded-lg shadow-xs dark:bg-neutral-800 dark:border-neutral-700"> */}
      <div className="py-3 px-4 border-b border-gray-200 dark:border-neutral-700">
        <h4 className="font-medium text-lg text-gray-900 dark:text-neutral-100 flex items-center gap-2">
          <Search className="w-5 h-5 text-indigo-600" />
          <span className="text-gray-900 dark:text-neutral-100">
            データ取得パラメータ
          </span>
        </h4>
      </div>

      <form onSubmit={handleSubmit} className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <InputField
            name="statsDataId"
            label="統計表ID *"
            placeholder="例: 0003412312"
            description="必須項目"
            value={formData.statsDataId}
            onChange={handleInputChange}
            required
          />
          <InputField
            name="cdCat01"
            label="分類01"
            placeholder="カンマ区切り"
            description="例: A1101,A1102"
            value={formData.cdCat01}
            onChange={handleInputChange}
          />
          <InputField
            name="cdArea"
            label="地域"
            placeholder="カンマ区切り"
            description="例: 13100,13101"
            value={formData.cdArea}
            onChange={handleInputChange}
          />
          <InputField
            name="cdTime"
            label="時間軸"
            placeholder="カンマ区切り"
            description="例: 2020,2021"
            value={formData.cdTime}
            onChange={handleInputChange}
          />
        </div>

        {/* ボタン */}
        <div className="flex gap-2 pt-6">
          <button
            type="submit"
            disabled={loading || !formData.statsDataId}
            className="py-2 px-4 inline-flex items-center gap-x-2 text-sm font-semibold rounded-lg border border-transparent bg-indigo-500 text-white hover:bg-indigo-600 focus:outline-none focus:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Search className="w-4 h-4" />
            <span className="text-gray-600 dark:text-neutral-300">
              {loading ? "取得中..." : "データを取得"}
            </span>
          </button>

          <button
            type="button"
            onClick={handleReset}
            disabled={loading}
            className="py-2 px-4 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-800 shadow-xs hover:bg-gray-50 focus:outline-none focus:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:focus:bg-neutral-700"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="text-gray-600 dark:text-neutral-300">
              リセット
            </span>
          </button>
        </div>
      </form>
      {/* </div> */}
    </div>
  );
}
