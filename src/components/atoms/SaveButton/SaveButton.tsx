"use client";

import React from "react";
import { Save, RefreshCw } from "lucide-react";
import Alert from "@/components/atoms/Alert/Alert";

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
          className="p-2 bg-primary text-white rounded-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          title={saving ? "保存中..." : "データベースに保存"}
        >
          <Save className={`w-5 h-5 ${saving ? "animate-pulse" : ""}`} />
        </button>
      </div>

      {/* Alertコンポーネントを使用 */}
      {saveResult && (
        <div className="relative">
          <Alert
            type={saveResult.success ? "success" : "error"}
            message={saveResult.message}
          />

          {/* 更新ボタンを追加（成功時のみ） */}
          {saveResult.success && (
            <button
              onClick={() => window.location.reload()}
              className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 px-2 py-1 text-xs bg-green-100 hover:bg-green-200 dark:bg-green-800/50 dark:hover:bg-green-700/50 text-green-800 dark:text-green-200 rounded transition-colors"
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
