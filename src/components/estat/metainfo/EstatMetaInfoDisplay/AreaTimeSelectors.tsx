"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import PaginatedTable from "./PaginatedTable";

interface AreaTimeSelectorProps {
  classObjs: Array<{
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
  }>;
  metaInfoId?: string;
}

export default function AreaTimeSelectors({
  classObjs,
  metaInfoId,
}: AreaTimeSelectorProps) {
  const [areaExpanded, setAreaExpanded] = useState(false);
  const [timeExpanded, setTimeExpanded] = useState(false);
  const [selectedArea, setSelectedArea] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");

  // metaInfoIdが変更されたときに状態をリセット
  React.useEffect(() => {
    setAreaExpanded(false);
    setTimeExpanded(false);
    setSelectedArea("");
    setSelectedTime("");
  }, [metaInfoId]);

  const areaData = classObjs.find(obj => obj["@id"] === "area");
  const timeData = classObjs.find(obj => obj["@id"] === "time");

  const getCategoryTableData = (classObj: typeof areaData) => {
    if (!classObj || !classObj.CLASS) return [];
    return Array.isArray(classObj.CLASS) ? classObj.CLASS : [classObj.CLASS];
  };

  const getSelectOptions = (classObj: typeof areaData) => {
    if (!classObj || !classObj.CLASS) return [];
    const data = Array.isArray(classObj.CLASS) ? classObj.CLASS : [classObj.CLASS];
    return data.map(item => ({
      value: item["@code"],
      label: item["@name"]
    }));
  };

  return (
    <div className="space-y-4">
      {/* 地域セレクター */}
      {areaData && (
        <div>
          <div className="space-y-2">
            <select
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
              className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-neutral-800 dark:border-neutral-600 dark:text-gray-100"
            >
              <option value="">地域を選択</option>
              {getSelectOptions(areaData).map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <button
              onClick={() => setAreaExpanded(!areaExpanded)}
              className="w-full flex items-center justify-between px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-neutral-700 dark:border-neutral-600 dark:hover:bg-neutral-600"
            >
              <span className="text-gray-700 dark:text-gray-300">
                全地域表示 ({getSelectOptions(areaData).length})
              </span>
              {areaExpanded ? (
                <ChevronUp className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              )}
            </button>

            {areaExpanded && (
              <div className="border border-gray-200 rounded-md dark:border-neutral-600">
                <PaginatedTable
                  data={getCategoryTableData(areaData)}
                  itemsPerPage={8}
                  metaInfoId={metaInfoId}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* 年次セレクター */}
      {timeData && (
        <div>
          <div className="space-y-2">
            <select
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-neutral-800 dark:border-neutral-600 dark:text-gray-100"
            >
              <option value="">年次を選択</option>
              {getSelectOptions(timeData).map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <button
              onClick={() => setTimeExpanded(!timeExpanded)}
              className="w-full flex items-center justify-between px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-neutral-700 dark:border-neutral-600 dark:hover:bg-neutral-600"
            >
              <span className="text-gray-700 dark:text-gray-300">
                全年次表示 ({getSelectOptions(timeData).length})
              </span>
              {timeExpanded ? (
                <ChevronUp className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              )}
            </button>

            {timeExpanded && (
              <div className="border border-gray-200 rounded-md dark:border-neutral-600">
                <PaginatedTable
                  data={getCategoryTableData(timeData)}
                  itemsPerPage={8}
                  metaInfoId={metaInfoId}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}