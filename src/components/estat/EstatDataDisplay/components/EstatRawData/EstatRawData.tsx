"use client";

import { Copy } from "lucide-react";
import { EstatStatsDataResponse } from "@/types/estat";

interface EstatRawDataProps {
  data: EstatStatsDataResponse;
}

export default function EstatRawData({ data }: EstatRawDataProps) {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => copyToClipboard(JSON.stringify(data, null, 2))}
          className="py-1.5 px-3 inline-flex items-center gap-x-1.5 text-xs font-medium rounded-lg border border-gray-200 bg-white text-gray-800 shadow-xs hover:bg-gray-50 focus:outline-none focus:bg-gray-50 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-700"
        >
          <Copy className="w-3 h-3" />
          コピー
        </button>
      </div>

      <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
        <pre className="text-sm text-gray-100">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    </div>
  );
}
