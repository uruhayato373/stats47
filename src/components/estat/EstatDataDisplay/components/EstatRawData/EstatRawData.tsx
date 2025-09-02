"use client";

import { Copy } from "lucide-react";
import { EstatStatsDataResponse } from "@/types/estat";
import { useTheme } from "@/contexts/ThemeContext";

interface EstatRawDataProps {
  data: EstatStatsDataResponse;
}

export default function EstatRawData({ data }: EstatRawDataProps) {
  const { theme } = useTheme();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => copyToClipboard(JSON.stringify(data, null, 2))}
          className={`px-4 py-2 text-white rounded-lg focus:ring-2 focus:ring-offset-2 text-xs ${
            theme === "dark"
              ? "bg-neutral-600 hover:bg-neutral-700 focus:ring-neutral-400 focus:ring-offset-neutral-800"
              : "bg-neutral-600 hover:bg-neutral-700 focus:ring-neutral-500 focus:ring-offset-white"
          }`}
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
