/**
 * GeoShapeキャッシュ管理画面
 *
 * プリウォーム実行、キャッシュ統計表示、手動キャッシュクリア等の機能を提供
 */

"use client";

import { useState } from "react";
import { usePrewarmCache } from "@/hooks/area/geoshape/useGeoShapeData";
import type {
  GeoShapeDataLevel,
  PrewarmResult,
} from "@/lib/area/geoshape/types";

export default function GeoShapeCacheAdminPage() {
  const [selectedLevel, setSelectedLevel] =
    useState<GeoShapeDataLevel>("municipality");
  const [isExecuting, setIsExecuting] = useState(false);
  const [lastResult, setLastResult] = useState<PrewarmResult | null>(null);

  const { prewarmData, prewarmError, isPrewarming, executePrewarm } =
    usePrewarmCache(selectedLevel);

  const handlePrewarm = async () => {
    setIsExecuting(true);
    try {
      await executePrewarm();
    } finally {
      setIsExecuting(false);
    }
  };

  const handleClearCache = async () => {
    // キャッシュクリア機能（実装予定）
    alert("キャッシュクリア機能は実装予定です");
  };

  const formatDuration = (duration: string) => {
    return duration;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">GeoShapeキャッシュ管理</h1>

        {/* プリウォーム実行セクション */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">プリウォーム実行</h2>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              データレベル
            </label>
            <select
              value={selectedLevel}
              onChange={(e) =>
                setSelectedLevel(e.target.value as GeoShapeDataLevel)
              }
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="municipality">市区町村データ</option>
              <option value="municipality_merged">
                市区町村データ（統合版）
              </option>
            </select>
          </div>

          <div className="flex gap-4 mb-4">
            <button
              onClick={handlePrewarm}
              disabled={isPrewarming || isExecuting}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPrewarming || isExecuting ? "実行中..." : "プリウォーム実行"}
            </button>

            <button
              onClick={handleClearCache}
              className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700"
            >
              キャッシュクリア
            </button>
          </div>

          {prewarmError && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
              <p className="text-red-800">エラー: {prewarmError.message}</p>
            </div>
          )}
        </div>

        {/* 実行結果表示 */}
        {prewarmData && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">実行結果</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <div className="text-2xl font-bold text-green-600">
                  {prewarmData.results.success}
                </div>
                <div className="text-sm text-green-800">成功</div>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="text-2xl font-bold text-red-600">
                  {prewarmData.results.failed}
                </div>
                <div className="text-sm text-red-800">失敗</div>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                <div className="text-2xl font-bold text-gray-600">
                  {prewarmData.results.skipped}
                </div>
                <div className="text-sm text-gray-800">スキップ</div>
              </div>
            </div>

            <div className="text-sm text-gray-600 mb-4">
              <p>実行時間: {formatDuration(prewarmData.duration)}</p>
              <p>
                完了時刻: {new Date(prewarmData.timestamp).toLocaleString()}
              </p>
            </div>

            {prewarmData.results.errors.length > 0 && (
              <div className="mt-4">
                <h3 className="font-semibold text-red-800 mb-2">エラー詳細</h3>
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  {prewarmData.results.errors.map((error, index) => (
                    <div key={index} className="text-sm text-red-800 mb-1">
                      <strong>{error.prefectureCode}:</strong> {error.error}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* キャッシュ統計セクション */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">キャッシュ統計</h2>

          <div className="text-gray-600">
            <p>統計情報の表示機能は実装予定です。</p>
            <p>以下の情報を表示予定:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>キャッシュヒット率</li>
              <li>総リクエスト数</li>
              <li>R2使用容量</li>
              <li>ファイル数</li>
              <li>最終更新日時</li>
            </ul>
          </div>
        </div>

        {/* 使用方法セクション */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-blue-800">使用方法</h2>

          <div className="text-blue-800 space-y-2">
            <p>
              <strong>プリウォーム実行:</strong>{" "}
              全都道府県のGeoShapeデータをR2キャッシュに事前保存します。
            </p>
            <p>
              <strong>データレベル:</strong>
            </p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>
                <strong>市区町村データ:</strong> 各都道府県の市区町村境界データ
              </li>
              <li>
                <strong>市区町村データ（統合版）:</strong>{" "}
                市区町村を統合したデータ
              </li>
            </ul>
            <p>
              <strong>注意:</strong>{" "}
              プリウォーム実行には時間がかかります（約5-10分）。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
