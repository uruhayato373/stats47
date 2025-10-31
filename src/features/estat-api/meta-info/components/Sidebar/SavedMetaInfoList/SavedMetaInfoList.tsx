"use client";

import { useCallback, useMemo, useState } from "react";

import { useRouter } from "next/navigation";

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/atoms/ui/pagination";

import { SavedMetaInfoListItem } from "../SavedMetaInfoListItem";

import type { EstatMetaInfo } from "../../../types";

/**
 * SavedMetaInfoList のプロパティ定義
 */
interface SavedMetaInfoListProps {
  /** 初期データ（保存済み統計表一覧） */
  initialData?: EstatMetaInfo[];
  /** 1ページあたりのアイテム数 */
  itemsPerPage?: number;
}

/**
 * SavedMetaInfoList - 保存済みメタ情報リストコンポーネント
 *
 * 保存済み統計表一覧を表示し、ページネーション機能とアイテム選択機能を提供します。
 *
 * 機能:
 * - 保存済み統計表一覧の表示
 * - ページネーション機能
 * - 統計表IDの昇順ソート
 * - アイテムクリック時のコールバック実行
 * - 空データ状態の表示
 *
 * @param initialData - 初期データ（保存済み統計表一覧）
 * @param itemsPerPage - 1ページあたりのアイテム数（デフォルト: 5）
 */
export function SavedMetaInfoList({
  initialData = [],
  itemsPerPage = 5,
}: SavedMetaInfoListProps) {
  const router = useRouter();

  // ===== 状態管理 =====

  /** 現在のページ番号 */
  const [currentPage, setCurrentPage] = useState(1);

  // ===== イベントハンドラー =====

  /**
   * 統計表アイテムがクリックされた時の処理
   * @param item - クリックされた統計表のメタデータ
   */
  const handleView = useCallback(
    (item: EstatMetaInfo) => {
      if (item.stats_data_id) {
        router.push(
          `/admin/dev-tools/estat-api/meta-info?statsId=${item.stats_data_id}`
        );
      }
    },
    [router]
  );

  /**
   * ページ変更時の処理
   * @param page - 新しいページ番号
   */
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  // ===== データ処理 =====

  /** 統計表IDの昇順でソート（undefinedを考慮） */
  const sortedData = useMemo(() => {
    return [...initialData].sort((a, b) => {
      const aId = a.stats_data_id || "";
      const bId = b.stats_data_id || "";
      return aId.localeCompare(bId);
    });
  }, [initialData]);

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

  // ===== ページリセット処理 =====

  // データが変更されたらページを1にリセット
  if (currentPage > totalPages && totalPages > 0) {
    setCurrentPage(1);
  }

  // ===== レンダリング =====

  // 空データ状態の表示
  if (sortedData.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            保存済みのメタ情報がありません
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            上のフォームから統計表IDを入力して取得してください
          </p>
        </div>
      </div>
    );
  }

  // ===== メイン表示 =====

  return (
    <>
      {/* データリスト */}
      <div className="flex-1 overflow-y-auto">
        <div className="divide-y divide-gray-200 dark:divide-neutral-700">
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
      {totalPages > 0 && (
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
      )}
    </>
  );
}

