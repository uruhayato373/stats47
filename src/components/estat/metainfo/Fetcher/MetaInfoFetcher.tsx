"use client";

import { useState } from "react";
import { useStyles } from "@/hooks/useStyles";
import { Search } from "lucide-react";
import InputField from "@/components/common/InputField";

interface EstatMetaInfoFetcherProps {
  onSubmit: (statsDataId: string) => void;
  loading?: boolean;
  clearOnSuccess?: boolean;
}

export default function EstatMetaInfoFetcher({
  onSubmit,
  loading,
  clearOnSuccess = false,
}: EstatMetaInfoFetcherProps) {
  const [statsDataId, setStatsDataId] = useState<string>("");
  const styles = useStyles();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (statsDataId.trim()) {
      onSubmit(statsDataId.trim());
      // フォーム送信後に入力フィールドをクリア（オプション）
      if (clearOnSuccess) {
        setStatsDataId("");
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* ヘッダー */}
      <div className="flex items-center gap-2">
        <Search className="w-5 h-5 text-indigo-600" />
        <h3 className="font-medium text-gray-900 dark:text-neutral-100">
          メタ情報取得
        </h3>
      </div>

      <form onSubmit={handleSubmit} className={styles.layout.row}>
        <div className="flex flex-col sm:flex-row gap-4 items-start">
          <InputField
            name="statsDataId"
            label="例：0000010101"
            placeholder="統計表ID 例：0000010101"
            value={statsDataId}
            onChange={(e) => setStatsDataId(e.target.value)}
            disabled={loading}
            required
            inlineLabel
            width="max-w-xs"
          />
          <button
            type="submit"
            disabled={loading || !statsDataId.trim()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 h-10 whitespace-nowrap"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                取得中...
              </div>
            ) : (
              "取得"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
