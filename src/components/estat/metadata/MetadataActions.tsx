"use client";

import { RefreshCw } from "lucide-react";

interface MetadataActionsProps {
  onRefresh: () => void;
  onRetry?: () => void;
  hasError?: boolean;
}

export default function MetadataActions({
  onRefresh,
  onRetry,
  hasError = false,
}: MetadataActionsProps) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onRefresh}
        className="p-2 text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors dark:text-neutral-400 dark:hover:text-neutral-200 dark:hover:bg-neutral-700"
        title="更新"
      >
        <RefreshCw className="w-4 h-4" />
      </button>

      {hasError && onRetry && (
        <button
          onClick={onRetry}
          className="px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 transition-colors"
        >
          再試行
        </button>
      )}
    </div>
  );
}
