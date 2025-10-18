import React, { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { CategoryInfo } from "@/lib/estat-api/types/meta-info";

interface CategoriesTabProps {
  categories: CategoryInfo[];
}

/**
 * CategoriesTab - 分類情報表示タブ
 *
 * 機能:
 * - 各分類（cat01-cat15）を展開可能なセクションで表示
 * - 分類アイテムをテーブル形式で表示
 * - 分類名、コード、単位、階層レベルなどの情報を整理
 */
export default function CategoriesTab({ categories }: CategoriesTabProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set()
  );

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

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
      <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        {categories.length}個の分類項目が見つかりました
      </div>

      {categories.map((category) => {
        const isExpanded = expandedCategories.has(category.id);
        const itemCount = category.items.length;

        return (
          <div
            key={category.id}
            className="border border-gray-200 rounded-lg dark:border-neutral-700"
          >
            {/* 分類ヘッダー */}
            <button
              onClick={() => toggleCategory(category.id)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                  )}
                  <div>
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      {category.name}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      ID: {category.id} • {itemCount}項目
                    </div>
                  </div>
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {itemCount}項目
                </div>
              </div>
            </button>

            {/* 分類アイテム */}
            {isExpanded && (
              <div className="border-t border-gray-200 dark:border-neutral-700">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-neutral-800">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          コード
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          名称
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          単位
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          階層レベル
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          親コード
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-neutral-900 divide-y divide-gray-200 dark:divide-neutral-700">
                      {category.items.map((item, index) => (
                        <tr
                          key={index}
                          className="hover:bg-gray-50 dark:hover:bg-neutral-800"
                        >
                          <td className="px-4 py-2 text-sm font-mono text-gray-900 dark:text-gray-100">
                            {item.code}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">
                            {item.name}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                            {item.unit || "-"}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                            {item.level || "-"}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                            {item.parentCode || "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
