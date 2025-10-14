"use client";

import React from "react";
import { Save, AlertCircle, CheckCircle, RefreshCw } from "lucide-react";

interface SaveButtonProps {
  onSave: () => void;
  saving: boolean;
  saveResult: {
    success: boolean;
    message: string;
  } | null;
}

export default function SaveButton({
  onSave,
  saving,
  saveResult,
}: SaveButtonProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col sm:flex-row gap-2">
        <button
          onClick={onSave}
          disabled={saving}
          className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          title={saving ? "保存中..." : "データベースに保存"}
        >
          <Save className={`w-5 h-5 ${saving ? "animate-pulse" : ""}`} />
        </button>
      </div>

      {saveResult && (
        <div
          className={`flex items-center justify-between text-sm px-3 py-2 rounded ${
            saveResult.success
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {saveResult.success ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
            {saveResult.message}
          </div>
          {saveResult.success && (
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-green-100 hover:bg-green-200 text-green-800 rounded transition-colors"
              title="手動で画面を更新"
            >
              <RefreshCw className="w-3 h-3" />
              更新
            </button>
          )}
        </div>
      )}
    </div>
  );
}
