"use client";

import { useState } from "react";

export default function MetadataSaver() {
  const [statsDataId, setStatsDataId] = useState("");
  const [batchMode, setBatchMode] = useState(false);
  const [startId, setStartId] = useState("");
  const [endId, setEndId] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSave = async () => {
    if (!statsDataId && !(batchMode && startId && endId)) {
      setMessage("統計表IDまたは範囲を指定してください");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/estat/metadata/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          statsDataId: batchMode ? null : statsDataId,
          batchMode,
          startId: batchMode ? startId : null,
          endId: batchMode ? endId : null,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setMessage(result.message);
        if (!batchMode) setStatsDataId("");
        if (batchMode) {
          setStartId("");
          setEndId("");
        }
      } else {
        setMessage(`エラー: ${result.error}`);
      }
    } catch (error) {
      setMessage("保存に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-xs border border-gray-200 p-4 dark:bg-neutral-800 dark:border-neutral-700">
      <h3 className="text-lg font-medium text-gray-800 mb-3 dark:text-neutral-200">
        メタ情報保存
      </h3>

      <div className="space-y-4">
        {/* 単一IDモード */}
        <div className={`${batchMode ? "opacity-50" : ""}`}>
          <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
            統計表ID
          </label>
          <input
            type="text"
            value={statsDataId}
            onChange={(e) => setStatsDataId(e.target.value)}
            placeholder="0000010101"
            disabled={batchMode}
            className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-neutral-700 dark:border-neutral-600 dark:text-neutral-200"
          />
        </div>

        {/* バッチモード切り替え */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="batchMode"
            checked={batchMode}
            onChange={(e) => setBatchMode(e.target.checked)}
            className="mr-2"
          />
          <label
            htmlFor="batchMode"
            className="text-sm font-medium text-gray-700 dark:text-neutral-300"
          >
            範囲指定モード
          </label>
        </div>

        {/* バッチモード */}
        {batchMode && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
                開始ID
              </label>
              <input
                type="text"
                value={startId}
                onChange={(e) => setStartId(e.target.value)}
                placeholder="0000010101"
                className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-neutral-700 dark:border-neutral-600 dark:text-neutral-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
                終了ID
              </label>
              <input
                type="text"
                value={endId}
                onChange={(e) => setEndId(e.target.value)}
                placeholder="0000010200"
                className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-neutral-700 dark:border-neutral-600 dark:text-neutral-200"
              />
            </div>
          </div>
        )}
      </div>

      <button
        onClick={handleSave}
        disabled={loading || (!statsDataId && !(batchMode && startId && endId))}
        className="mt-4 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "保存中..." : "メタ情報を保存"}
      </button>

      {message && (
        <p
          className={`mt-2 text-sm ${
            message.includes("エラー") ? "text-red-600" : "text-green-600"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}
