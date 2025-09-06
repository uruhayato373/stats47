"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Database,
  ChevronLeft,
  ChevronFirst,
  ChevronLast,
} from "lucide-react";
import { EstatMetaInfoResponse } from "@/types/estat";
import { useStyles } from "@/hooks/useStyles";

interface MetaInfoCardProps {
  metaInfo: EstatMetaInfoResponse | null;
  loading?: boolean;
  error?: string | null;
}

// 安全にレンダリングするためのヘルパー関数
function safeRender(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number") {
    return value.toString();
  }
  if (typeof value === "object" && value !== null) {
    const obj = value as Record<string, unknown>;
    // オブジェクトの場合は、$プロパティがあればそれを表示
    if ("$" in obj && typeof obj.$ === "string") {
      return obj.$;
    }
    // @noプロパティがあればそれを表示
    if ("@no" in obj && typeof obj["@no"] === "string") {
      return obj["@no"];
    }
    // その他の場合は、JSON.stringifyで表示
    return JSON.stringify(value);
  }
  return String(value);
}

// ページネーション付きテーブルコンポーネント
function PaginatedTable({
  data,
  itemsPerPage = 15,
}: {
  data: Array<{
    "@code": string;
    "@name": string;
    "@unit"?: string;
    "@explanation"?: string;
  }>;
  itemsPerPage?: number;
}) {
  const [currentPage, setCurrentPage] = useState(1);
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
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 border-r border-gray-200">
                項目名
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">
                単位
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {currentData.map((item, index) => (
              <tr key={startIndex + index} className="hover:bg-gray-50">
                <td className="px-3 py-2 text-xs font-mono text-gray-700 border-r border-gray-200">
                  {safeRender(item["@code"])}
                </td>
                <td className="px-3 py-2 text-xs text-gray-800 border-r border-gray-200">
                  {safeRender(item["@name"])}
                </td>
                <td className="px-3 py-2 text-xs text-gray-600">
                  {item["@unit"] ? safeRender(item["@unit"]) : "-"}
                </td>
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

// 分類情報のアコーディオンコンポーネント
function ClassificationAccordion({
  classObj,
  index,
}: {
  classObj: {
    "@id": string;
    "@name": string;
    CLASS?:
      | Array<{
          "@code": string;
          "@name": string;
          "@unit"?: string;
          "@explanation"?: string;
        }>
      | {
          "@code": string;
          "@name": string;
          "@unit"?: string;
          "@explanation"?: string;
        };
  };
  index: number;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const itemCount = Array.isArray(classObj.CLASS)
    ? classObj.CLASS.length
    : classObj.CLASS
    ? 1
    : 0;

  const tableData = Array.isArray(classObj.CLASS)
    ? classObj.CLASS
    : classObj.CLASS
    ? [classObj.CLASS]
    : [];

  return (
    <div className="border border-gray-200 rounded-lg">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-gray-600" />
          <span className="font-medium text-gray-700">
            {safeRender(classObj["@name"])}
          </span>
          <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
            {itemCount}件
          </span>
        </div>
        {isOpen ? (
          <ChevronDown className="w-4 h-4 text-gray-600" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-600" />
        )}
      </button>

      {isOpen && (
        <div className="px-3 pb-3 border-t border-gray-200">
          <PaginatedTable data={tableData} itemsPerPage={15} />
        </div>
      )}
    </div>
  );
}

export default function MetaInfoCard({
  metaInfo,
  loading,
  error,
}: MetaInfoCardProps) {
  const styles = useStyles();

  if (loading) {
    return (
      <div className={styles.card.compact}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-300 rounded w-1/4 mb-3"></div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-300 rounded w-full"></div>
            <div className="h-3 bg-gray-300 rounded w-5/6"></div>
            <div className="h-3 bg-gray-300 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.message.error}>
        <div className="flex items-center">
          <svg
            className="w-4 h-4 text-red-600 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="text-red-800 font-medium">エラー</h3>
        </div>
        <p className="text-red-700 mt-1">{error}</p>
      </div>
    );
  }

  if (!metaInfo) {
    return (
      <div className={styles.card.compact}>
        <p className={styles.text.muted}>メタ情報がありません</p>
      </div>
    );
  }

  const { GET_META_INFO } = metaInfo;
  const { TABLE_INF, CLASS_INF } = GET_META_INFO.METADATA_INF;

  return (
    <div className={styles.card.compact}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 統計表基本情報 */}
        <div>
          <h2 className={styles.heading.md}>統計表基本情報</h2>

          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200 rounded-lg">
              <tbody className="divide-y divide-gray-200">
                <tr className="hover:bg-gray-50">
                  <td className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 border-r border-gray-200 w-1/3">
                    統計表題名
                  </td>
                  <td className="px-3 py-2 text-sm text-gray-800">
                    {safeRender(TABLE_INF.TITLE)}
                  </td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 border-r border-gray-200">
                    政府統計名
                  </td>
                  <td className="px-3 py-2 text-sm text-gray-800">
                    {safeRender(TABLE_INF.STAT_NAME)}
                  </td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 border-r border-gray-200">
                    作成機関
                  </td>
                  <td className="px-3 py-2 text-sm text-gray-800">
                    {safeRender(TABLE_INF.GOV_ORG)}
                  </td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 border-r border-gray-200">
                    調査年月
                  </td>
                  <td className="px-3 py-2 text-sm text-gray-800">
                    {safeRender(TABLE_INF.SURVEY_DATE)}
                  </td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 border-r border-gray-200">
                    公開日
                  </td>
                  <td className="px-3 py-2 text-sm text-gray-800">
                    {safeRender(TABLE_INF.OPEN_DATE)}
                  </td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 border-r border-gray-200">
                    更新日
                  </td>
                  <td className="px-3 py-2 text-sm text-gray-800">
                    {safeRender(TABLE_INF.UPDATED_DATE)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 分類情報 */}
        {CLASS_INF && CLASS_INF.CLASS_OBJ && CLASS_INF.CLASS_OBJ.length > 0 && (
          <div>
            <h2 className={styles.heading.md}>分類情報</h2>

            <div className="space-y-2">
              {CLASS_INF.CLASS_OBJ.map((classObj, index) => (
                <ClassificationAccordion
                  key={index}
                  classObj={classObj}
                  index={index}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
