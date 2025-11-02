"use client";

import { ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/molecules/data-table";

import {
  convertToStatsSchema,
  formatStatsData,
} from "@/features/estat-api/stats-data";
import type { EstatStatsDataResponse } from "@/features/estat-api/stats-data/types";

import type { StatsSchema } from "@/types/stats";

/**
 * e-Stat統計データの値テーブルコンポーネントのプロパティ
 */
interface EstatValuesTableProps {
  /** e-Stat APIから取得した統計データのレスポンス */
  data: EstatStatsDataResponse;
}

/**
 * e-Stat統計データの値を表形式で表示するコンポーネント
 *
 * @remarks
 * - 統計データを表形式で表示し、地域名・時間名・カテゴリ名でフィルタリング可能
 * - セレクトフィルターの選択肢は実際のデータから自動的に抽出される
 * - 地域名の選択肢は地域コードの昇順で並べられる
 *
 * @param props - コンポーネントのプロパティ
 * @returns 統計データの値テーブル、またはデータがない場合はnull
 */
export default function EstatValuesTable({ data }: EstatValuesTableProps) {
  if (!data) return null;

  const formattedData = formatStatsData(data);
  const values = formattedData.values;

  // FormattedValueをStatsSchemaに変換（変換できない値は除外）
  const statsSchemaData: StatsSchema[] = values
    .map((value) => convertToStatsSchema(value))
    .filter((schema): schema is StatsSchema => schema !== undefined);

  // 変換可能なデータがない場合の警告
  if (statsSchemaData.length === 0 && values.length > 0) {
    console.warn("[EstatValuesTable] 変換可能なデータがありません:", {
      totalValues: values.length,
      sampleValue: values[0],
      sampleConversion: convertToStatsSchema(values[0]),
    });
  }

  // 地域名の選択肢を抽出（地域コードの昇順でソート）
  const areaNameOptions = Array.from(
    new Map(
      statsSchemaData
        .filter((d) => d.areaName)
        .map((d) => [d.areaName, d.areaCode])
    ).entries()
  )
    .sort(([, codeA], [, codeB]) => codeA.localeCompare(codeB))
    .map(([value]) => ({ value, label: value }));

  // 時間名の選択肢を抽出（アルファベット順でソート）
  const timeNameOptions = Array.from(
    new Set(statsSchemaData.map((d) => d.timeName).filter(Boolean))
  )
    .sort()
    .map((value) => ({ value, label: value }));

  // カテゴリ名の選択肢を抽出（アルファベット順でソート）
  const categoryNameOptions = Array.from(
    new Set(statsSchemaData.map((d) => d.categoryName).filter(Boolean))
  )
    .sort()
    .map((value) => ({ value, label: value }));

  const columns: ColumnDef<StatsSchema>[] = [
    {
      accessorKey: "areaCode",
      header: "地域コード",
      meta: { filterable: false },
    },
    {
      accessorKey: "areaName",
      header: "地域名",
      meta: {
        filterable: true,
        filterType: "select",
        filterOptions: areaNameOptions,
      },
    },
    {
      accessorKey: "timeCode",
      header: "時間コード",
      meta: { filterable: false },
    },
    {
      accessorKey: "timeName",
      header: "時間名",
      meta: {
        filterable: true,
        filterType: "select",
        filterOptions: timeNameOptions,
      },
    },
    {
      accessorKey: "categoryCode",
      header: "カテゴリコード",
      meta: { filterable: false },
    },
    {
      accessorKey: "categoryName",
      header: "カテゴリ名",
      meta: {
        filterable: true,
        filterType: "select",
        filterOptions: categoryNameOptions,
      },
    },
    {
      accessorKey: "value",
      header: "値",
      meta: { filterable: false },
    },
    {
      accessorKey: "unit",
      header: "単位",
      meta: { filterable: false },
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={statsSchemaData}
      emptyMessage="表形式で表示できるデータがありません"
      showIndex={false}
      showBorder={false}
    />
  );
}
