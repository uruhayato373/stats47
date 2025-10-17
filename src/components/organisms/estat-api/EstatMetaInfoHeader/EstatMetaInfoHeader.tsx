"use client";

import React from "react";
import { EstatMetaInfoResponse } from "@/lib/estat-api";
import { safeRender } from "@/lib/estat-api/meta-info";
import { SaveButton } from "@/components/atoms/SaveButton";

interface EstatMetaInfoHeaderProps {
  metaInfo: EstatMetaInfoResponse;
  onSave: () => void;
  saving: boolean;
  saveResult: {
    success: boolean;
    message: string;
  } | null;
}

export default function EstatMetaInfoHeader({
  metaInfo,
  onSave,
  saving,
  saveResult,
}: EstatMetaInfoHeaderProps) {
  const { GET_META_INFO } = metaInfo;
  const { TABLE_INF } = GET_META_INFO.METADATA_INF;

  // 統計表基本情報のテーブルデータを準備
  const tableData = [
    {
      label: "統計表題名",
      value: safeRender(TABLE_INF.TITLE),
    },
    {
      label: "政府統計名",
      value: safeRender(TABLE_INF.STAT_NAME),
    },
    {
      label: "作成機関",
      value: safeRender(TABLE_INF.GOV_ORG),
    },
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between border-b border-gray-200 pb-4">
      {/* 統計情報を横一列に小さく表示 */}
      <div className="flex-1">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          {tableData.map((item, index) => (
            <div
              key={index}
              className="bg-gray-50 dark:bg-neutral-800 rounded-lg p-3"
            >
              <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                {item.label}
              </div>
              <div className="text-sm text-gray-900 dark:text-gray-100 truncate">
                {item.value || "-"}
              </div>
            </div>
          ))}
        </div>
      </div>

      <SaveButton onSave={onSave} saving={saving} saveResult={saveResult} />
    </div>
  );
}
