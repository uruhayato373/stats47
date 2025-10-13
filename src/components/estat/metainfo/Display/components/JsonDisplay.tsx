"use client";

import { useState } from "react";
import { Download, CheckCircle } from "lucide-react";
import { EstatMetaInfoResponse } from "@/types/models/estat";

interface JsonDisplayProps {
  data: EstatMetaInfoResponse;
  onDownload: () => void;
}

export default function JsonDisplay({ data, onDownload }: JsonDisplayProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-700 dark:text-neutral-300">
          JSON レスポンス
        </h4>
        <div className="flex items-center gap-2">
          <button
            onClick={copyToClipboard}
            className="p-2 text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors dark:text-neutral-400 dark:hover:text-neutral-300 dark:hover:bg-neutral-700"
            title={copied ? "コピー済み" : "コピー"}
          >
            {copied ? (
              <CheckCircle className="w-4 h-4 text-green-600" />
            ) : (
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            )}
          </button>
          <button
            onClick={onDownload}
            className="p-2 text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors dark:text-neutral-400 dark:hover:text-neutral-300 dark:hover:bg-neutral-700"
            title="JSONダウンロード"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="json-display rounded-lg p-4 overflow-auto max-h-96 border border-gray-200 dark:border-neutral-700 shadow-sm">
        <pre className="text-xs whitespace-pre-wrap font-mono leading-relaxed">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    </div>
  );
}
