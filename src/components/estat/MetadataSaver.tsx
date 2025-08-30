"use client";

import { useState } from "react";
import { estatAPI } from "@/services/estat-api";

export default function MetadataSaver() {
  const [statsDataId, setStatsDataId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string>("");

  const handleSave = async () => {
    if (!statsDataId.trim()) {
      setError("統計表IDを入力してください");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      // ここでAPIを呼び出してメタ情報を保存
      // 実際の実装では、Cloudflare D1に保存する処理を追加
      setMessage(`${statsDataId}のメタ情報を保存しました`);
      setStatsDataId("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 単一保存 */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 dark:bg-neutral-800 dark:border-neutral-700">
        <h4 className="text-lg font-medium text-gray-900 dark:text-neutral-100 mb-4">
          統計表IDの保存
        </h4>
        <div className="space-y-4">
          <div>
            <label
              htmlFor="statsDataId"
              className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2"
            >
              統計表ID
            </label>
            <input
              type="text"
              id="statsDataId"
              value={statsDataId}
              onChange={(e) => setStatsDataId(e.target.value)}
              placeholder="例: 0003448237"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg shadow-xs placeholder-gray-500 bg-white text-gray-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-neutral-700 dark:border-neutral-600 dark:text-neutral-100 dark:placeholder-neutral-400"
            />
          </div>
          <button
            onClick={handleSave}
            disabled={loading || !statsDataId.trim()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-indigo-600 dark:hover:bg-indigo-700 dark:focus:ring-indigo-400 dark:focus:ring-offset-neutral-800"
          >
            {loading ? "保存中..." : "保存"}
          </button>
        </div>
      </div>

      {/* メッセージ表示 */}
      {message && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 dark:bg-emerald-900/30 dark:border-emerald-700">
          <p className="text-emerald-800 dark:text-emerald-200">{message}</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 dark:bg-red-900/30 dark:border-red-700">
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}
    </div>
  );
}
