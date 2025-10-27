/**
 * 統計表詳細モーダルコンポーネント
 * 統計表の全情報表示、関連統計へのリンク、データ取得ボタンなど
 */

"use client";

import { useState } from "react";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/atoms/ui/dialog";

import {
    formatOpenDate,
    formatSurveyDate,
    getCollectAreaDescription,
    getSmallAreaDescription,
    getStatsFieldIcon,
    getStatsFieldName,
    getUpdateFrequency,
    truncateTitle,
} from "@/features/estat-api/stats-list/services/utils";
import { DetailedStatsListTableInfo } from "../../../types";

interface StatsTableDetailModalProps {
  table: DetailedStatsListTableInfo | null;
  isOpen: boolean;
  onClose: () => void;
  onGetData?: (tableId: string) => void;
  onGetMetaInfo?: (tableId: string) => void;
  onToggleFavorite?: (table: DetailedStatsListTableInfo) => void;
  isFavorite?: boolean;
}

export function StatsTableDetailModal({
  table,
  isOpen,
  onClose,
  onGetData,
  onGetMetaInfo,
  onToggleFavorite,
  isFavorite = false,
}: StatsTableDetailModalProps) {
  const [activeTab, setActiveTab] = useState<"basic" | "detailed" | "related">(
    "basic"
  );

  if (!table) {
    return null;
  }

  const handleGetData = () => {
    if (onGetData) {
      onGetData(table.id);
    }
  };

  const handleGetMetaInfo = () => {
    if (onGetMetaInfo) {
      onGetMetaInfo(table.id);
    }
  };

  const handleToggleFavorite = () => {
    if (onToggleFavorite) {
      onToggleFavorite(table);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">
                {table.mainCategory
                  ? getStatsFieldIcon(table.mainCategory.code as any)
                  : "📊"}
              </span>
              <div>
                <DialogTitle className="text-lg font-medium text-gray-900">
                  {truncateTitle(table.title, 60)}
                </DialogTitle>
                <p className="text-sm text-gray-500">統計表ID: {table.id}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {onToggleFavorite && (
                <button
                  onClick={handleToggleFavorite}
                  className={`p-2 rounded-full ${
                    isFavorite
                      ? "text-red-500 hover:text-red-600"
                      : "text-gray-400 hover:text-red-500"
                  }`}
                  title={isFavorite ? "お気に入りから削除" : "お気に入りに追加"}
                >
                  <svg
                    className="w-5 h-5"
                    fill={isFavorite ? "currentColor" : "none"}
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </DialogHeader>

        {/* タブナビゲーション */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: "basic", name: "基本情報" },
              { id: "detailed", name: "詳細情報" },
              { id: "related", name: "関連情報" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* コンテンツ */}
        <div className="max-h-96 overflow-y-auto">
          {activeTab === "basic" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    政府統計名
                  </label>
                  <p className="mt-1 text-sm text-gray-900">{table.statName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    作成機関
                  </label>
                  <p className="mt-1 text-sm text-gray-900">{table.govOrg}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  提供統計名
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {table.statisticsName}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    調査年月
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {table.surveyDate
                      ? formatSurveyDate(table.surveyDate)
                      : "不明"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    公開日
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {table.openDate ? formatOpenDate(table.openDate) : "不明"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    周期
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {table.cycle ? getUpdateFrequency(table.cycle) : "不明"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    更新日
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {table.updatedDate
                      ? formatOpenDate(table.updatedDate)
                      : "不明"}
                  </p>
                </div>
              </div>

              {table.mainCategory && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    統計分野
                  </label>
                  <div className="mt-1 flex items-center space-x-2">
                    <span className="text-lg">
                      {getStatsFieldIcon(table.mainCategory.code as any)}
                    </span>
                    <span className="text-sm text-gray-900">
                      {getStatsFieldName(table.mainCategory.code as any)}
                    </span>
                  </div>
                </div>
              )}

              {table.subCategory && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    副分類
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {table.subCategory.name}
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === "detailed" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    集計地域区分
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {table.collectArea
                      ? getCollectAreaDescription(table.collectArea)
                      : "不明"}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    小地域
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {table.smallArea
                      ? getSmallAreaDescription(table.smallArea)
                      : "不明"}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  総データ件数
                </label>
                <p className="mt-1 text-sm text-gray-900">
                  {table.totalNumber
                    ? table.totalNumber.toLocaleString()
                    : "不明"}
                </p>
              </div>

              {table.description && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    解説
                  </label>
                  <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                    {table.description}
                  </p>
                </div>
              )}

              {table.statisticsNameSpec && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    統計名称詳細
                  </label>
                  <div className="mt-1 space-y-1">
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">集計カテゴリ:</span>{" "}
                      {table.statisticsNameSpec.tabulationCategory}
                    </p>
                    {table.statisticsNameSpec.tabulationSubCategory1 && (
                      <p className="text-sm text-gray-900">
                        <span className="font-medium">副カテゴリ1:</span>{" "}
                        {table.statisticsNameSpec.tabulationSubCategory1}
                      </p>
                    )}
                    {table.statisticsNameSpec.tabulationSubCategory2 && (
                      <p className="text-sm text-gray-900">
                        <span className="font-medium">副カテゴリ2:</span>{" "}
                        {table.statisticsNameSpec.tabulationSubCategory2}
                      </p>
                    )}
                    {table.statisticsNameSpec.tabulationSubCategory3 && (
                      <p className="text-sm text-gray-900">
                        <span className="font-medium">副カテゴリ3:</span>{" "}
                        {table.statisticsNameSpec.tabulationSubCategory3}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "related" && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">
                  関連統計の検索
                </h4>
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      // 同じ政府統計名で検索
                      window.open(
                        `/estat-api/stats-list?searchWord=${encodeURIComponent(
                          table.statName
                        )}`,
                        "_blank"
                      );
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100"
                  >
                    同じ政府統計名の統計表を検索
                  </button>
                  <button
                    onClick={() => {
                      // 同じ作成機関で検索
                      window.open(
                        `/estat-api/stats-list?searchWord=${encodeURIComponent(
                          table.govOrg
                        )}`,
                        "_blank"
                      );
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100"
                  >
                    同じ作成機関の統計表を検索
                  </button>
                  {table.mainCategory && (
                    <button
                      onClick={() => {
                        // 同じ分野で検索
                        window.open(
                          `/estat-api/stats-list?statsField=${
                            table.mainCategory!.code
                          }`,
                          "_blank"
                        );
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100"
                    >
                      同じ統計分野の統計表を検索
                    </button>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">
                  外部リンク
                </h4>
                <div className="space-y-2">
                  <a
                    href={`https://www.e-stat.go.jp/dbview?sid=${table.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full text-left px-4 py-2 text-sm text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 flex items-center"
                  >
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                    e-Stat公式サイトで表示
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* フッター */}
        <div className="bg-gray-50 px-6 py-4 flex justify-between items-center">
          <div className="text-sm text-gray-500">
            最終更新:{" "}
            {table.updatedDate ? formatOpenDate(table.updatedDate) : "不明"}
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleGetMetaInfo}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              メタ情報取得
            </button>
            <button
              onClick={handleGetData}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              データ取得
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
