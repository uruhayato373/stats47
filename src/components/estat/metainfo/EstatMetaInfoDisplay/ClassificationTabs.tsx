"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
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
  if (!classObjs || classObjs.length === 0) return null;

  // カテゴリデータのみを取得
  const categoryData = classObjs.find(obj => obj["@id"] === "cat01");

  const getCategoryTableData = (classObj: typeof categoryData) => {
    if (!classObj || !classObj.CLASS) return [];
    return Array.isArray(classObj.CLASS) ? classObj.CLASS : [classObj.CLASS];
  };

  // カテゴリデータがない場合は何も表示しない
  if (!categoryData) return null;

  return (
    <PaginatedTable
      data={getCategoryTableData(categoryData)}
      itemsPerPage={15}
      metaInfoId={metaInfoId}
    />
  );
}
