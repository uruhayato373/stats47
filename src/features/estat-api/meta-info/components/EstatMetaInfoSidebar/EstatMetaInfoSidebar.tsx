"use client";

import { useCallback, useMemo, useState } from "react";

import { Archive } from "lucide-react";

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/atoms/ui/pagination";

import { SavedMetaInfoListItem } from "../SavedMetaInfoListItem";

import type { EstatMetaInfo } from "@/infrastructure/database/estat/types";

/**
 * EstatMetaInfoSidebar のプロパティ定義
 */
interface EstatMetaInfoSidebarProps {
  /** カスタムクラス名 */
  className?: string;
  /** 初期データ（保存済み統計表一覧） */
  initialData?: EstatMetaInfo[];
  /** アイテムがクリックされた時のコールバック関数 */
  onView?: (item: EstatMetaInfo) => void;
}

/**
 * EstatMetaInfoSidebar - e-Statメタ情報サイドバーコンポーネント
 *
 * 保存済み統計表一覧を表示し、ページネーション機能とアイテム選択機能を提供します。
 *
 * 機能:
 * - 保存済み統計表一覧の表示
 * - ページネーション機能（1ページあたり5件）
 * - 統計表IDの昇順ソート
 * - アイテムクリック時のコールバック実行
 * - 空データ状態の表示
 *
 * @param className - カスタムクラス名
 * @param initialData - 初期データ（保存済み統計表一覧）
 * @param onView - アイテムがクリックされた時のコールバック関数
 */
export default function EstatMetaInfoSidebar({
  className = "",
  initialData = [],
  onView,
}: EstatMetaInfoSidebarProps) {
  // ===== 状態管理 =====

  /** 現在のページ番号 */
  const [currentPage, setCurrentPage] = useState(1);
  /** 1ページあたりのアイテム数 */
  const itemsPerPage = 5;

  // ===== イベントハンドラー =====

  /**
   * 統計表アイテムがクリックされた時の処理
   * @param item - クリックされた統計表のメタデータ
   */
  const handleView = useCallback(
    (item: EstatMetaInfo) => {
      if (onView) {
        onView(item);
      }
    },
    [onView]
  );

  /**
   * ページ変更時の処理
   * @param page - 新しいページ番号
   */
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  // ===== データ処理 =====

  /** 表示用データ（初期データを直接使用） */
  const displayData = initialData;

  // ===== データソート =====

  /** 統計表IDの昇順でソート（undefinedを考慮） */
  const sortedData = useMemo(() => {
    return [...displayData].sort((a, b) => {
      const aId = a.stats_data_id || "";
      const bId = b.stats_data_id || "";
      return aId.localeCompare(bId);
    });
  }, [displayData]);

  // ===== ページネーション計算 =====

  /** ページネーション関連の計算結果 */
  const paginationData = useMemo(() => {
    const totalPages = Math.ceil(sortedData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedData = sortedData.slice(startIndex, endIndex);

    return {
      totalPages,
      startIndex,
      endIndex,
      paginatedData,
    };
  }, [sortedData, currentPage, itemsPerPage]);

  /** 総ページ数 */
  const { totalPages, paginatedData } = paginationData;

  // ===== レンダリング =====

  // データが空の場合は何も表示しない
  if (displayData.length === 0) {
    return null;
  }

  // ===== ページリセット処理 =====

  /** データが変更されたらページを1にリセット（useEffectで処理） */
  if (currentPage > totalPages && totalPages > 0) {
    setCurrentPage(1);
  }

  // ===== メイン表示 =====

  return (
    <div
      className={`w-full xl:w-80 bg-white dark:bg-neutral-800 flex flex-col ${className}`}
      style={{ minHeight: "400px" }}
    >
      {/* ヘッダー */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-neutral-700">
        <div className="flex items-center gap-2">
          <Archive className="w-5 h-5 text-indigo-600" />
          <h3 className="font-medium text-gray-900 dark:text-neutral-100">
            保存済みデータ
          </h3>
        </div>
      </div>

      {/* データリスト */}
      <div className="flex-1 overflow-y-auto">
        <div className="divide-y divide-gray-200 dark:divide-neutral-600">
          {paginatedData.map((item) => (
            <SavedMetaInfoListItem
              key={item.stats_data_id}
              item={item}
              onView={handleView}
            />
          ))}
        </div>
      </div>

      {/* ページネーション */}
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              onClick={() =>
                currentPage > 1 && handlePageChange(currentPage - 1)
              }
              aria-disabled={currentPage === 1}
              className={
                currentPage === 1 ? "pointer-events-none opacity-50" : ""
              }
            />
          </PaginationItem>

          {/* ページ情報 */}
          <PaginationItem>
            <span className="text-sm text-muted-foreground">
              {currentPage} / {totalPages}
            </span>
          </PaginationItem>

          <PaginationItem>
            <PaginationNext
              onClick={() =>
                currentPage < totalPages && handlePageChange(currentPage + 1)
              }
              aria-disabled={currentPage === totalPages}
              className={
                currentPage === totalPages
                  ? "pointer-events-none opacity-50"
                  : ""
              }
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
