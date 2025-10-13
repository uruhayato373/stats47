import React from "react";
import { RefreshCw } from "lucide-react";

interface LoadingViewProps {
  message?: string;
  height?: string;
}

export const LoadingView: React.FC<LoadingViewProps> = ({
  message = "データを読み込んでいます...",
  height = "600px",
}) => {
  return (
    <div
      className="flex items-center justify-center bg-gray-50 dark:bg-neutral-900 rounded-lg border border-gray-200 dark:border-neutral-700"
      style={{ height }}
    >
      <div className="text-center">
        <RefreshCw className="w-12 h-12 text-blue-500 mx-auto mb-4 animate-spin" />
        <p className="text-gray-600 dark:text-neutral-400">{message}</p>
      </div>
    </div>
  );
};
