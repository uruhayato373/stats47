"use client";

import { Copy, Download } from "lucide-react";
import { EstatStatsDataResponse } from "@/lib/estat-api";

interface EstatRawDataProps {
  data: EstatStatsDataResponse;
}

export default function EstatRawData({ data }: EstatRawDataProps) {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const downloadAsJson = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `estat-data-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2">
        <button
          onClick={() => copyToClipboard(JSON.stringify(data, null, 2))}
          className="px-3 py-1.5 inline-flex items-center gap-x-1.5 text-xs font-medium rounded-lg border border-gray-200 bg-white text-gray-800 shadow-xs hover:bg-gray-50 focus:outline-none focus:bg-gray-50 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:focus:bg-neutral-700"
        >
          <Copy className="w-3 h-3" />
          コピー
        </button>

        <button
          onClick={downloadAsJson}
          className="px-3 py-1.5 inline-flex items-center gap-x-1.5 text-xs font-medium rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 focus:outline-none focus:bg-indigo-600"
        >
          <Download className="w-3 h-3" />
          ダウンロード
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
