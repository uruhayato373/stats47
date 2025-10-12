"use client";

import React from "react";
import { Save, AlertCircle, CheckCircle } from "lucide-react";

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
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          <Save className={`w-4 h-4 ${saving ? "animate-pulse" : ""}`} />
          {saving ? "保存中..." : "データベースに保存"}
        </button>
      </div>

      {saveResult && (
        <div
          className={`flex items-center gap-2 text-sm px-3 py-2 rounded ${
            saveResult.success
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {saveResult.success ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          {saveResult.message}
        </div>
      )}
    </div>
  );
}
