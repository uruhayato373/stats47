"use client";

import React, { useState } from "react";
import PaginatedTable from "./PaginatedTable";

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

interface ClassificationTabsProps {
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

export default function ClassificationTabs({
  classObjs,
  metaInfoId,
}: ClassificationTabsProps) {
  const [activeTab, setActiveTab] = useState(0);

  // metaInfoIdが変更されたときにタブをリセット
  React.useEffect(() => {
    setActiveTab(0);
  }, [metaInfoId]);

  if (!classObjs || classObjs.length === 0) return null;

  // タブのラベルを決定（@idに基づいて分類）
  const getTabLabel = (classObj: {
    "@id": string;
    "@name": string;
    CLASS?: unknown;
  }) => {
    const id = classObj["@id"];
    if (id === "cat01") return "カテゴリ";
    if (id === "area") return "地域";
    if (id === "time") return "調査年";
    return safeRender(classObj["@name"]);
  };

  // 各タブのデータを準備
  const tabs = classObjs.map((classObj) => {
    const tableData = Array.isArray(classObj.CLASS)
      ? classObj.CLASS
      : classObj.CLASS
      ? [classObj.CLASS]
      : [];

    return {
      label: getTabLabel(classObj),
      data: tableData,
      count: tableData.length,
    };
  });

  return (
    <div className="space-y-4">
      {/* タブナビゲーション */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab, index) => (
            <button
              key={index}
              onClick={() => setActiveTab(index)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === index
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* アクティブなタブのコンテンツ */}
      <div className="min-h-[200px]">
        {tabs[activeTab] && (
          <PaginatedTable
            data={tabs[activeTab].data}
            itemsPerPage={15}
            metaInfoId={metaInfoId}
          />
        )}
      </div>
    </div>
  );
}
