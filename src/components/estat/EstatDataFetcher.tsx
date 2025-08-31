"use client";

import { useState } from "react";
import { Search, RotateCcw, Info } from "lucide-react";
import { GetStatsDataParams } from "@/types/estat";

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
    statsDataId: "0003412312",
    cdCat01: "",
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
      statsDataId: "0003412312",
      cdCat01: "",
      cdArea: "",
      cdTime: "",
    });
  };

  const renderInputField = (
    name: keyof FormData,
    label: string,
    placeholder?: string,
    description?: string
  ) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
        {label}
        {description && (
          <span className="ml-1 text-xs text-gray-500">({description})</span>
        )}
      </label>
      <input
        type="text"
        name={name}
        value={formData[name]}
        onChange={handleInputChange}
        className="py-2 px-3 block w-full border border-gray-200 rounded-lg text-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400 dark:placeholder-neutral-500 dark:focus:ring-neutral-600"
        placeholder={placeholder}
      />
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="bg-white border border-gray-200 rounded-lg shadow-xs dark:bg-neutral-800 dark:border-neutral-700">
        <div className="py-3 px-4 border-b border-gray-200 dark:border-neutral-700">
          <h2 className="font-medium text-lg text-gray-800 dark:text-neutral-200 flex items-center gap-2">
            <Search className="w-5 h-5 text-indigo-600" />
            データ取得パラメータ
          </h2>
          <p className="text-sm text-gray-500 dark:text-neutral-400 mt-1">
            e-Stat APIから統計データを取得するためのパラメータを設定してください
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderInputField(
              "statsDataId",
              "統計表ID *",
              "例: 0003412312",
              "必須項目"
            )}
            {renderInputField(
              "cdCat01",
              "分類01",
              "カンマ区切り",
              "例: A1101,A1102"
            )}
            {renderInputField(
              "cdArea",
              "地域",
              "カンマ区切り",
              "例: 13100,13101"
            )}
            {renderInputField(
              "cdTime",
              "時間軸",
              "カンマ区切り",
              "例: 2020,2021"
            )}
          </div>

          {/* ボタン */}
          <div className="flex gap-2 pt-6">
            <button
              type="submit"
              disabled={loading || !formData.statsDataId}
              className="py-2 px-4 inline-flex items-center gap-x-2 text-sm font-semibold rounded-lg border border-transparent bg-indigo-500 text-white hover:bg-indigo-600 focus:outline-none focus:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Search className="w-4 h-4" />
              {loading ? "取得中..." : "データを取得"}
            </button>

            <button
              type="button"
              onClick={handleReset}
              disabled={loading}
              className="py-2 px-4 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-800 shadow-xs hover:bg-gray-50 focus:outline-none focus:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:focus:bg-neutral-700"
            >
              <RotateCcw className="w-4 h-4" />
              リセット
            </button>
          </div>
        </form>
      </div>

      {/* ヘルプ情報 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 dark:bg-blue-900/10 dark:border-blue-800">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-500 mt-0.5" />
          <div>
            <h3 className="font-medium text-blue-800 dark:text-blue-200 text-sm">
              パラメータについて
            </h3>
            <div className="text-sm text-blue-700 dark:text-blue-300 mt-1 space-y-1">
              <p>
                • <strong>統計表ID</strong>: 取得したい統計表の識別子（必須）
              </p>
              <p>
                • <strong>分類01</strong>:
                特定の分類項目のみを取得したい場合に指定（カンマ区切り）
              </p>
              <p>
                • <strong>地域</strong>:
                特定の地域のみを取得したい場合に指定（カンマ区切り）
              </p>
              <p>
                • <strong>時間軸</strong>:
                特定の期間のデータのみを取得したい場合に指定（カンマ区切り）
              </p>
              <p>
                詳細は{" "}
                <a
                  href="https://www.e-stat.go.jp/api/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  e-STAT API マニュアル
                </a>{" "}
                を参照してください。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
