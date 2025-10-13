"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-neutral-600">
      {/* 前へボタン */}
      <button
        onClick={handlePrevious}
        disabled={currentPage === 1}
        className="flex items-center gap-1 px-2 py-1 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed dark:text-neutral-400 dark:hover:text-neutral-200 dark:hover:bg-neutral-700"
      >
        <ChevronLeft className="w-4 h-4" />
        前へ
      </button>

      {/* ページ情報 */}
      <span className="text-sm text-gray-600 dark:text-neutral-400">
        {currentPage} / {totalPages}
      </span>

      {/* 次へボタン */}
      <button
        onClick={handleNext}
        disabled={currentPage === totalPages}
        className="flex items-center gap-1 px-2 py-1 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed dark:text-neutral-400 dark:hover:text-neutral-200 dark:hover:bg-neutral-700"
      >
        次へ
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
