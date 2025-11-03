/**
 * ページネーションコンポーネント
 */

"use client";

import { useRouter, useSearchParams } from "next/navigation";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/atoms/ui/button";

/**
 * ページネーションのプロパティ
 */
export interface PaginationProps {
  /** 現在のページ */
  currentPage: number;
  /** 総ページ数 */
  totalPages: number;
  /** ベースURL（クエリパラメータなし） */
  baseUrl: string;
  /** CSSクラス名 */
  className?: string;
}

/**
 * ページネーションコンポーネント
 *
 * ページネーションUIを表示
 */
export function Pagination({
  currentPage,
  totalPages,
  baseUrl,
  className,
}: PaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // ページ変更
  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages) return;

    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    router.push(`${baseUrl}?${params.toString()}`);
  };

  if (totalPages <= 1) {
    return null;
  }

  // 表示するページ番号を計算
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      // 全ページを表示
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // 最初のページ
      pages.push(1);

      if (currentPage > 3) {
        pages.push("...");
      }

      // 現在のページ周辺
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push("...");
      }

      // 最後のページ
      pages.push(totalPages);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <nav
      className={`flex items-center justify-center gap-2 ${className || ""}`}
      aria-label="ページネーション"
    >
      {/* 前へボタン */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => goToPage(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="前のページ"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {/* ページ番号 */}
      <div className="flex items-center gap-1">
        {pageNumbers.map((page, index) => {
          if (page === "...") {
            return (
              <span
                key={`ellipsis-${index}`}
                className="px-2 text-muted-foreground"
              >
                ...
              </span>
            );
          }

          const pageNum = page as number;
          const isActive = pageNum === currentPage;

          return (
            <Button
              key={pageNum}
              variant={isActive ? "default" : "outline"}
              size="sm"
              onClick={() => goToPage(pageNum)}
              aria-label={`ページ ${pageNum}`}
              aria-current={isActive ? "page" : undefined}
            >
              {pageNum}
            </Button>
          );
        })}
      </div>

      {/* 次へボタン */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => goToPage(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="次のページ"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </nav>
  );
}
