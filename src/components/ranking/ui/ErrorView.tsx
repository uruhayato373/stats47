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
            <div className="mt-3 p-3 bg-white dark:bg-gray-800 rounded border border-red-200 dark:border-red-700">
              <p className="font-medium text-sm mb-2">リクエストパラメータ:</p>
              <ul className="space-y-1 text-xs font-mono text-gray-700 dark:text-gray-300">
                {details.statsDataId && (
                  <li>statsDataId: {details.statsDataId}</li>
                )}
                {details.cdCat01 && <li>cdCat01: {details.cdCat01}</li>}
                {details.yearCode && <li>yearCode: {details.yearCode}</li>}
              </ul>
            </div>
          )}

          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-3 flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              再試行
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
