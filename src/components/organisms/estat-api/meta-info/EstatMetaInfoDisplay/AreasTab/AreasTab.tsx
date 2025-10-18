import React, { useState, useMemo } from "react";
import { ChevronDown, ChevronRight, MapPin } from "lucide-react";
import { PrefectureInfo } from "@/lib/estat-api/types/meta-info";

interface AreasTabProps {
  areas: PrefectureInfo[];
}

/**
 * AreasTab - 地域情報表示タブ
 * 
 * 機能:
 * - 地域情報を階層レベル（全国、都道府県、市区町村）に応じてグループ化
 * - 各レベルごとに展開可能なセクションで表示
 * - 地域コード、名称、階層レベル、親コードなどの情報を整理
 */
export default function AreasTab({ areas }: AreasTabProps) {
  const [expandedLevels, setExpandedLevels] = useState<Set<number>>(new Set([1, 2])); // デフォルトで全国と都道府県を展開

  const toggleLevel = (level: number) => {
    const newExpanded = new Set(expandedLevels);
    if (newExpanded.has(level)) {
      newExpanded.delete(level);
    } else {
      newExpanded.add(level);
    }
    setExpandedLevels(newExpanded);
  };

  // 階層レベルごとにグループ化
  const groupedAreas = useMemo(() => {
    const groups: Record<number, PrefectureInfo[]> = {};
    areas.forEach(area => {
      if (!groups[area.level]) {
        groups[area.level] = [];
      }
      groups[area.level].push(area);
    });
    return groups;
  }, [areas]);

  // 階層レベルのラベル
  const getLevelLabel = (level: number) => {
    switch (level) {
      case 1:
        return "全国";
      case 2:
        return "都道府県";
      case 3:
        return "市区町村";
      default:
        return `レベル${level}`;
    }
  };

  // 地域コードの形式を判定
  const getCodeType = (code: string) => {
    if (code === "00000") return "全国";
    if (code.endsWith("000")) return "都道府県";
    return "市区町村";
  };

  if (areas.length === 0) {
    return (
      <div className="text-center py-8">
        <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <div className="text-gray-500 dark:text-gray-400">
          地域情報がありません
        </div>
      </div>
    );
  }

  const sortedLevels = Object.keys(groupedAreas)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        {areas.length}個の地域が見つかりました
      </div>

      {sortedLevels.map((level) => {
        const levelAreas = groupedAreas[level];
        const isExpanded = expandedLevels.has(level);
        const areaCount = levelAreas.length;

        return (
          <div
            key={level}
            className="border border-gray-200 rounded-lg dark:border-neutral-700"
          >
            {/* レベルヘッダー */}
            <button
              onClick={() => toggleLevel(level)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                  )}
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <div>
                      <div className="font-medium text-gray-900 dark:text-gray-100">
                        {getLevelLabel(level)}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        レベル {level} • {areaCount}地域
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {areaCount}地域
                </div>
              </div>
            </button>

            {/* 地域リスト */}
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
                          種別
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          親コード
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          単位
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-neutral-900 divide-y divide-gray-200 dark:divide-neutral-700">
                      {levelAreas.map((area, index) => (
                        <tr key={index} className="hover:bg-gray-50 dark:hover:bg-neutral-800">
                          <td className="px-4 py-2 text-sm font-mono text-gray-900 dark:text-gray-100">
                            {area.code}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">
                            {area.name}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                            {getCodeType(area.code)}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                            {area.parentCode || "-"}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                            {area.unit || "-"}
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
