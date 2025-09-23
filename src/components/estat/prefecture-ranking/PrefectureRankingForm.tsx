"use client";

import { useState } from "react";
import { Search, RotateCcw } from "lucide-react";
import InputField from "@/components/common/InputField";
import { useStyles } from "@/hooks/useStyles";

interface PrefectureRankingParams {
  statsDataId: string;
  categoryCode?: string;
}

interface PrefectureRankingFormProps {
  onSubmit: (params: PrefectureRankingParams) => void;
  loading: boolean;
}

type FormData = {
  statsDataId: string;
  categoryCode: string;
};

export default function PrefectureRankingForm({
  onSubmit,
  loading,
}: PrefectureRankingFormProps) {
  const styles = useStyles();
  const [formData, setFormData] = useState<FormData>({
    statsDataId: "",
    categoryCode: "",
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

    const params: PrefectureRankingParams = {
      statsDataId: formData.statsDataId,
      ...(formData.categoryCode && { categoryCode: formData.categoryCode }),
    };

    onSubmit(params);
  };

  const handleReset = () => {
    setFormData({
      statsDataId: "",
      categoryCode: "",
    });
  };

  return (
    <div className="space-y-4">
      <div className="py-3 px-4 border-b border-gray-200 dark:border-neutral-700">
        <h4
          className={`font-medium text-lg ${styles.text.primary} flex items-center gap-2`}
        >
          <Search className="w-5 h-5 text-indigo-600" />
          <span className={styles.text.primary}>都道府県ランキング設定</span>
        </h4>
      </div>

      <form onSubmit={handleSubmit} className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            name="statsDataId"
            label="統計表ID *"
            placeholder="例: 0003448368"
            description="必須項目"
            value={formData.statsDataId}
            onChange={handleInputChange}
            required
          />
          <InputField
            name="categoryCode"
            label="カテゴリコード"
            placeholder="例: 01"
            description="例: 01,02"
            value={formData.categoryCode}
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
            <span className={styles.text.secondary}>
              {loading ? "取得中..." : "データ取得・地図表示"}
            </span>
          </button>

          <button
            type="button"
            onClick={handleReset}
            disabled={loading}
            className="py-2 px-4 inline-flex items-center gap-x-2 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-800 shadow-xs hover:bg-gray-50 focus:outline-none focus:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:focus:bg-neutral-700"
          >
            <RotateCcw className="w-4 h-4" />
            <span className={styles.text.secondary}>リセット</span>
          </button>
        </div>
      </form>
    </div>
  );
}