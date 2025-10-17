import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

interface ErrorViewProps {
  error: Error;
  details?: {
    statsDataId?: string;
    cdCat01?: string;
    yearCode?: string;
  };
  onRetry?: () => void;
}

export const ErrorView: React.FC<ErrorViewProps> = ({
  error,
  details,
  onRetry,
}) => {
  return (
    <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />

        <div className="flex-1">
          <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
            データ取得エラー
          </h3>

          <p className="mt-2 text-sm text-red-700 dark:text-red-300">
            {error.message}
          </p>

          {details && (
            <div className="mt-3 text-xs text-red-600 dark:text-red-400">
              <p>詳細情報:</p>
              <ul className="mt-1 space-y-1">
                {details.statsDataId && (
                  <li>統計表ID: {details.statsDataId}</li>
                )}
                {details.cdCat01 && <li>カテゴリ: {details.cdCat01}</li>}
                {details.yearCode && <li>年度: {details.yearCode}</li>}
              </ul>
            </div>
          )}

          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-100 border border-red-300 rounded-md hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:text-red-300 dark:bg-red-900/30 dark:border-red-700 dark:hover:bg-red-900/50"
            >
              <RefreshCw className="w-3 h-3" />
              再試行
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
