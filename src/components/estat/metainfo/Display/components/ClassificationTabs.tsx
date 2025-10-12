"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import PaginatedTable from "./PaginatedTable";
import { safeRender } from "../utils/helpers";

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
  const categoryData = classObjs.find((obj) => obj["@id"] === "cat01");

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
