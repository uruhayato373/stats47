"use client";

import { useState } from "react";
import { Search, RotateCcw, X } from "lucide-react";
import { GetStatsDataParams } from "@/lib/estat-api";
import { Input } from "@/components/atoms/ui/input";
import { Label } from "@/components/atoms/ui/label";

interface EstatDataFetcherProps {
  onSubmit: (params: GetStatsDataParams) => void;
  loading: boolean;
}

type DynamicField = {
  id: string; // 一意のID（cdTime, cdCat02, cdCat03など）
  label: string; // 表示ラベル（時間軸, 分類02, 分類03など）
  value: string; // 入力値
};

type FormData = {
  statsDataId: string;
  cdCat01: string;
  cdArea: string;
};

export default function EstatDataFetcher({
  onSubmit,
  loading,
}: EstatDataFetcherProps) {
  const [formData, setFormData] = useState<FormData>({
    statsDataId: "0000010101",
    cdCat01: "A1101",
    cdArea: "",
  });

  // 動的に追加されたフィールド
  const [dynamicFields, setDynamicFields] = useState<DynamicField[]>([]);

  // 利用可能な分類オプション（cdTime + cdCat02～cdCat15）
  const availableCategories = [
    { id: "cdTime", label: "時間軸" },
    { id: "cdCat02", label: "分類02" },
    { id: "cdCat03", label: "分類03" },
    { id: "cdCat04", label: "分類04" },
    { id: "cdCat05", label: "分類05" },
    { id: "cdCat06", label: "分類06" },
    { id: "cdCat07", label: "分類07" },
    { id: "cdCat08", label: "分類08" },
    { id: "cdCat09", label: "分類09" },
    { id: "cdCat10", label: "分類10" },
    { id: "cdCat11", label: "分類11" },
    { id: "cdCat12", label: "分類12" },
    { id: "cdCat13", label: "分類13" },
    { id: "cdCat14", label: "分類14" },
    { id: "cdCat15", label: "分類15" },
  ];

  // まだ追加されていない分類のリスト
  const unusedCategories = availableCategories.filter(
    (cat) => !dynamicFields.some((field) => field.id === cat.id)
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // フィールド追加
  const handleAddField = (categoryId: string) => {
    const category = availableCategories.find((cat) => cat.id === categoryId);
    if (!category) return;

    setDynamicFields([
      ...dynamicFields,
      { id: category.id, label: category.label, value: "" },
    ]);
  };

  // フィールド削除
  const handleRemoveField = (fieldId: string) => {
    setDynamicFields(dynamicFields.filter((field) => field.id !== fieldId));
  };

  // フィールド値変更
  const handleDynamicFieldChange = (fieldId: string, value: string) => {
    setDynamicFields(
      dynamicFields.map((field) =>
        field.id === fieldId ? { ...field, value } : field
      )
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const params: GetStatsDataParams = {
      appId: process.env.NEXT_PUBLIC_ESTAT_APP_ID || "",
      statsDataId: formData.statsDataId,
      ...(formData.cdCat01 && { cdCat01: formData.cdCat01 }),
      ...(formData.cdArea && { cdArea: formData.cdArea }),
    };

    // 動的フィールドの値を追加
    dynamicFields.forEach((field) => {
      if (field.value) {
        // 動的フィールドの値を安全に追加
        (params as unknown as Record<string, string>)[field.id] = field.value;
      }
    });

    onSubmit(params);
  };

  const handleReset = () => {
    setFormData({
      statsDataId: "0000010101",
      cdCat01: "",
      cdArea: "",
    });
    setDynamicFields([]); // 動的フィールドもクリア
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-neutral-800 dark:border-neutral-700">
        <div className="py-4 px-6 border-b border-gray-200 dark:border-neutral-700">
          <h4 className="font-semibold text-lg text-gray-900 dark:text-neutral-100 flex items-center gap-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
              <Search className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <div className="text-gray-900 dark:text-neutral-100">
                データ取得パラメータ
              </div>
              <div className="text-sm text-gray-500 dark:text-neutral-400 font-normal">
                統計表IDと分類条件を指定してデータを取得します
              </div>
            </div>
          </h4>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* 基本設定（固定フィールド） */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="statsDataId">統計表ID *</Label>
              <Input
                id="statsDataId"
                name="statsDataId"
                placeholder="例: 0003412312"
                value={formData.statsDataId}
                onChange={handleInputChange}
                required
              />
              <p className="text-sm text-muted-foreground">必須項目</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cdCat01">分類01</Label>
              <Input
                id="cdCat01"
                name="cdCat01"
                placeholder="カンマ区切り"
                value={formData.cdCat01}
                onChange={handleInputChange}
              />
              <p className="text-sm text-muted-foreground">例: A1101,A1102</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cdArea">地域</Label>
              <Input
                id="cdArea"
                name="cdArea"
                placeholder="カンマ区切り"
                value={formData.cdArea}
                onChange={handleInputChange}
              />
              <p className="text-sm text-muted-foreground">例: 13100,13101</p>
            </div>
          </div>

          {/* 動的に追加されたフィールド */}
          {dynamicFields.length > 0 && (
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <h5 className="text-sm font-medium text-gray-700 dark:text-neutral-300 flex items-center gap-2">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                  追加された分類パラメータ
                </h5>
                <span className="text-xs text-gray-500 dark:text-neutral-400">
                  {dynamicFields.length} 個追加済み
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {dynamicFields.map((field) => (
                  <div key={field.id} className="relative group">
                    <div className="space-y-2">
                      <Label htmlFor={field.id}>{field.label}</Label>
                      <Input
                        id={field.id}
                        name={field.id}
                        placeholder="カンマ区切り"
                        value={field.value}
                        onChange={(e) =>
                          handleDynamicFieldChange(field.id, e.target.value)
                        }
                      />
                      <p className="text-sm text-muted-foreground">
                        {field.id === "cdTime"
                          ? "例: 2020,2021"
                          : "例: A1101,A1102"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveField(field.id)}
                      className="absolute top-0 right-0 p-1.5 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white dark:bg-neutral-800 rounded-full shadow-sm border border-gray-200 dark:border-neutral-700"
                      title={`${field.label}を削除`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* フィールド追加セクション */}
          {unusedCategories.length > 0 && (
            <div className="mt-6 p-4 bg-gray-50 dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700">
              <div className="flex items-center justify-between mb-3">
                <h5 className="text-sm font-medium text-gray-700 dark:text-neutral-300">
                  分類パラメータを追加
                </h5>
                <span className="text-xs text-gray-500 dark:text-neutral-400 bg-gray-200 dark:bg-neutral-700 px-2 py-1 rounded-full">
                  残り {unusedCategories.length} 個
                </span>
              </div>
              <div className="flex items-center gap-3">
                <select
                  className="flex-1 py-2 px-3 border border-gray-200 rounded-lg text-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-neutral-700 dark:border-neutral-600 dark:text-neutral-300"
                  onChange={(e) => {
                    if (e.target.value) {
                      handleAddField(e.target.value);
                      e.target.value = ""; // リセット
                    }
                  }}
                  defaultValue=""
                >
                  <option value="" disabled>
                    分類を選択して追加...
                  </option>
                  {unusedCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label}
                    </option>
                  ))}
                </select>
                <div className="text-xs text-gray-500 dark:text-neutral-400">
                  よく使う: 時間軸, 分類02, 分類03
                </div>
              </div>
            </div>
          )}

          {/* 追加可能な分類がなくなった場合のメッセージ */}
          {unusedCategories.length === 0 && dynamicFields.length > 0 && (
            <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-green-700 dark:text-green-300">
                  全ての分類パラメータが追加されました
                </span>
              </div>
            </div>
          )}

          {/* ボタン */}
          <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200 dark:border-neutral-700">
            <button
              type="submit"
              disabled={loading || !formData.statsDataId}
              className="flex-1 py-3 px-6 inline-flex items-center justify-center gap-x-2 text-sm font-semibold rounded-lg border border-transparent bg-indigo-500 text-white hover:bg-indigo-600 focus:outline-none focus:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              <Search className="w-4 h-4" />
              <span>{loading ? "データ取得中..." : "データを取得"}</span>
            </button>

            <button
              type="button"
              onClick={handleReset}
              disabled={loading}
              className="py-3 px-6 inline-flex items-center justify-center gap-x-2 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-800 shadow-sm hover:bg-gray-50 focus:outline-none focus:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:focus:bg-neutral-700 transition-colors duration-200"
            >
              <RotateCcw className="w-4 h-4" />
              <span>リセット</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
