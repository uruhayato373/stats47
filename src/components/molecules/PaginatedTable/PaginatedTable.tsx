"use client";

import React, { useState } from "react";
import {
  ChevronRight,
  ChevronLeft,
  ChevronFirst,
  ChevronLast,
} from "lucide-react";
import { safeRender } from "@/lib/estat-api/meta-info";

interface PaginatedTableProps {
  data: Array<{
    "@code": string;
    "@name": string;
    "@unit"?: string;
    "@explanation"?: string;
  }>;
  itemsPerPage?: number;
  metaInfoId?: string;
  showUnit?: boolean;
}

export default function PaginatedTable({
  data,
  itemsPerPage = 15,
  metaInfoId,
  showUnit = true,
}: PaginatedTableProps) {
  const [currentPage, setCurrentPage] = useState(1);

  // metaInfoIdが変更されたときにページを1にリセット
  React.useEffect(() => {
    setCurrentPage(1);
  }, [metaInfoId]);

  const totalPages = Math.ceil(data.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = data.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  if (data.length === 0) return null;

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-200 rounded-lg">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 border-r border-gray-200">
                コード
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">
                項目名
              </th>
              {showUnit && (
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">
                  単位
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {currentData.map((item, index) => (
              <tr key={startIndex + index} className="hover:bg-gray-50">
                <td className="px-3 py-2 text-xs font-mono text-gray-700 border-r border-gray-200">
                  {safeRender(item["@code"])}
                </td>
                <td className="px-3 py-2 text-xs text-gray-800">
                  {safeRender(item["@name"])}
                </td>
                {showUnit && (
                  <td className="px-3 py-2 text-xs text-gray-600">
                    {item["@unit"] ? safeRender(item["@unit"]) : "-"}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-3 px-2">
          <div className="text-xs text-gray-600">
            {startIndex + 1}-{Math.min(endIndex, data.length)} / {data.length}件
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => goToPage(1)}
              disabled={currentPage === 1}
              className="p-1 text-gray-600 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronFirst className="w-4 h-4" />
            </button>
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-1 text-gray-600 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs text-gray-600 px-2">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-1 text-gray-600 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => goToPage(totalPages)}
              disabled={currentPage === totalPages}
              className="p-1 text-gray-600 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLast className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
