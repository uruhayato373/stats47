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
          className="px-4 py-2 bg-neutral-600 text-white rounded-lg hover:bg-neutral-700 focus:ring-2 focus:ring-neutral-500 focus:ring-offset-2 dark:bg-neutral-600 dark:hover:bg-neutral-700 dark:focus:ring-neutral-400 dark:focus:ring-offset-neutral-800 text-xs"
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
