"use client";

import React from "react";
import { EstatMetaInfoResponse } from "@/lib/estat/types";
import { safeRender } from "../utils/helpers";
import SaveButton from "./SaveButton";

interface MetaInfoHeaderProps {
  metaInfo: EstatMetaInfoResponse;
  onSave: () => void;
  saving: boolean;
  saveResult: {
    success: boolean;
    message: string;
  } | null;
}

export default function MetaInfoHeader({
  metaInfo,
  onSave,
  saving,
  saveResult,
}: MetaInfoHeaderProps) {
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
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between border-b border-gray-200 pb-4">
      <div className="flex-1">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-neutral-100">
          メタ情報詳細
        </h2>
        <p className="text-sm text-gray-600 dark:text-neutral-400">
          データを確認後、データベースに保存できます
        </p>

        {/* 基本情報テーブル */}
        <div className="mt-4 bg-white border border-gray-200 rounded-lg overflow-hidden dark:bg-neutral-800 dark:border-neutral-700">
          <div className="space-y-0">
            {tableData.map((item, index) => (
              <div
                key={index}
                className={`px-4 py-3 ${
                  index !== tableData.length - 1
                    ? "border-b border-gray-200 dark:border-neutral-600"
                    : ""
                }`}
              >
                <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {item.label}
                </div>
                <div className="text-base text-gray-900 dark:text-gray-100">
                  {item.value || "-"}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <SaveButton onSave={onSave} saving={saving} saveResult={saveResult} />
    </div>
  );
}
