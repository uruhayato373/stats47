"use client";

import React, { useState } from "react";
import PaginatedTable from "./PaginatedTable";

interface UnifiedClassificationTabsProps {
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

type TabType = "area" | "time" | "category";

export default function UnifiedClassificationTabs({
  classObjs,
  metaInfoId,
}: UnifiedClassificationTabsProps) {
  const [activeTab, setActiveTab] = useState<TabType>("area");

  // metaInfoIdが変更されたときに状態をリセット
  React.useEffect(() => {
    setActiveTab("area");
  }, [metaInfoId]);

  if (!classObjs || classObjs.length === 0) return null;

  const areaData = classObjs.find((obj) => obj["@id"] === "area");
  const timeData = classObjs.find((obj) => obj["@id"] === "time");
  const categoryData = classObjs.find((obj) => obj["@id"] === "cat01");

  const getTableData = (classObj: typeof areaData) => {
    if (!classObj || !classObj.CLASS) return [];
    return Array.isArray(classObj.CLASS) ? classObj.CLASS : [classObj.CLASS];
  };

  const getTabCount = (classObj: typeof areaData) => {
    if (!classObj || !classObj.CLASS) return 0;
    return Array.isArray(classObj.CLASS) ? classObj.CLASS.length : 1;
  };

  const tabs = [
    {
      id: "area" as TabType,
      label: "地域",
      count: getTabCount(areaData),
      data: areaData,
      hasSelector: false,
    },
    {
      id: "time" as TabType,
      label: "年次",
      count: getTabCount(timeData),
      data: timeData,
      hasSelector: false,
    },
    {
      id: "category" as TabType,
      label: "カテゴリ",
      count: getTabCount(categoryData),
      data: categoryData,
      hasSelector: false,
    },
  ].filter((tab) => tab.count > 0);

  if (tabs.length === 0) return null;

  const activeTabData = tabs.find((tab) => tab.id === activeTab);

  return (
    <div className="space-y-4">
      {/* タブナビゲーション */}
      <div className="border-b border-gray-200 dark:border-neutral-700">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </nav>
      </div>

      {/* タブコンテンツ */}
      <div className="mt-6">
        {activeTabData && (
          <div className="border border-gray-200 rounded-md dark:border-neutral-600">
            <PaginatedTable
              data={getTableData(activeTabData.data)}
              itemsPerPage={activeTab === "category" ? 15 : 8}
              metaInfoId={metaInfoId}
              showUnit={activeTab === "category"}
            />
          </div>
        )}
      </div>
    </div>
  );
}
