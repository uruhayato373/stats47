"use client";

import { useState } from "react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/atoms/ui/accordion";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/atoms/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/atoms/ui/table";

import { CategoryInfo } from "../../../../types";

interface CategoriesTabProps {
  categories: CategoryInfo[];
}

/**
 * 個別の分類アイテムコンポーネント（ページネーション付き）
 */
function CategoryAccordionItem({ category }: { category: CategoryInfo }) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const itemCount = category.items.length;
  const totalPages = Math.ceil(itemCount / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedItems = category.items.slice(startIndex, endIndex);

  // ページリセット
  if (currentPage > totalPages && totalPages > 0) {
    setCurrentPage(1);
  }

  return (
    <AccordionItem
      value={category.id}
      className="border border-gray-200 rounded-lg dark:border-neutral-700"
    >
      <AccordionTrigger className="px-4 py-3 hover:no-underline">
        <div className="flex items-center justify-between w-full mr-4">
          <div>
            <div className="font-medium text-gray-900 dark:text-gray-100">
              {category.name}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              ID: {category.id} • {itemCount}項目
            </div>
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {itemCount}項目
          </div>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="space-y-4">
          {/* テーブル */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>コード</TableHead>
                  <TableHead>名称</TableHead>
                  <TableHead>単位</TableHead>
                  <TableHead>階層レベル</TableHead>
                  <TableHead>親コード</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedItems.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-mono">{item.code}</TableCell>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{item.unit || "-"}</TableCell>
                    <TableCell>{item.level || "-"}</TableCell>
                    <TableCell>{item.parentCode || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* ページネーション */}
          {totalPages > 1 && (
            <div className="flex justify-center">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() =>
                        currentPage > 1 && setCurrentPage(currentPage - 1)
                      }
                      aria-disabled={currentPage === 1}
                      className={
                        currentPage === 1 ? "pointer-events-none opacity-50" : ""
                      }
                    />
                  </PaginationItem>

                  <PaginationItem>
                    <span className="text-sm text-muted-foreground px-4">
                      {currentPage} / {totalPages} ページ
                    </span>
                  </PaginationItem>

                  <PaginationItem>
                    <PaginationNext
                      onClick={() =>
                        currentPage < totalPages && setCurrentPage(currentPage + 1)
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
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

/**
 * CategoriesTab - 分類情報表示タブ
 *
 * 機能:
 * - 各分類（cat01-cat15）を展開可能なセクションで表示
 * - 分類アイテムをテーブル形式で表示（ページネーション付き）
 * - 分類名、コード、単位、階層レベルなどの情報を整理
 */
export default function CategoriesTab({ categories }: CategoriesTabProps) {
  if (categories.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500 dark:text-gray-400">
          分類情報がありません
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Accordion type="multiple" className="space-y-2">
        {categories.map((category) => (
          <CategoryAccordionItem key={category.id} category={category} />
        ))}
      </Accordion>
    </div>
  );
}
