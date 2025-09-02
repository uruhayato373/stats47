"use client";

import { useState } from "react";
import {
  Eye,
  Download,
  AlertTriangle,
  CheckCircle,
  Info,
  Copy,
  ChevronDown,
  ChevronRight,
  BarChart3,
  Database,
  Clock,
} from "lucide-react";
import { EstatStatsDataResponse, EstatValue } from "@/types/estat";
import DataTable, { TableColumn } from "@/components/common/DataTable";

interface EstatDataDisplayProps {
  data: EstatStatsDataResponse | null;
  loading: boolean;
  error: string | null;
}

export default function EstatDataDisplay({
  data,
  loading,
  error,
}: EstatDataDisplayProps) {
  const [activeTab, setActiveTab] = useState<
    "overview" | "categories" | "areas" | "years" | "values" | "raw"
  >("overview");
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["basic"])
  );

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };


  const downloadAsJson = () => {
    if (!data) return;

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `estat-data-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const renderOverview = () => {
    if (!data?.GET_STATS_DATA) return null;

    const result = data.GET_STATS_DATA.RESULT;
    const parameter = data.GET_STATS_DATA.PARAMETER;
    const statisticalData = data.GET_STATS_DATA.STATISTICAL_DATA;

    return (
      <div className="space-y-4">
        {/* 基本情報 */}
        <div className="bg-white border border-gray-200 rounded-lg dark:bg-neutral-800 dark:border-neutral-700">
          <button
            onClick={() => toggleSection("basic")}
            className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-neutral-700"
          >
            <h3 className="font-medium text-gray-800 dark:text-neutral-200 flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-500" />
              基本情報
            </h3>
            {expandedSections.has("basic") ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>

          {expandedSections.has("basic") && (
            <div className="px-4 pb-3 border-t border-gray-200 dark:border-neutral-700">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                <div>
                  <dt className="text-sm font-medium text-gray-700 dark:text-neutral-400">
                    ステータス
                  </dt>
                  <dd className="mt-1 flex items-center gap-2">
                    {result?.STATUS === 0 ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-green-600 dark:text-green-400">
                          成功
                        </span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                        <span className="text-sm text-red-600 dark:text-red-400">
                          エラー (コード: {result?.STATUS})
                        </span>
                      </>
                    )}
                  </dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-700 dark:text-neutral-400">
                    統計表ID
                  </dt>
                  <dd className="mt-1 text-sm text-gray-100 dark:text-neutral-100 font-mono">
                    {parameter?.STATS_DATA_ID}
                  </dd>
                </div>

                {statisticalData?.TABLE_INF && (
                  <>
                    <div>
                      <dt className="text-sm font-medium text-gray-700 dark:text-neutral-400">
                        統計表名
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-neutral-100">
                        {statisticalData.TABLE_INF.STAT_NAME?.["$"]}
                      </dd>
                    </div>

                    <div>
                      <dt className="text-sm font-medium text-gray-700 dark:text-neutral-400">
                        表題
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900 dark:text-neutral-100">
                        {statisticalData.TABLE_INF.TITLE?.["$"]}
                      </dd>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* データ詳細 */}
        {statisticalData && (
          <div className="bg-white border border-gray-200 rounded-lg dark:bg-neutral-800 dark:border-neutral-700">
            <button
              onClick={() => toggleSection("data")}
              className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 dark:hover:bg-neutral-700"
            >
              <h3 className="font-medium text-gray-800 dark:text-neutral-200 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-500" />
                データ詳細
              </h3>
              {expandedSections.has("data") ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>

            {expandedSections.has("data") && (
              <div className="px-4 pb-3 border-t border-gray-200 dark:border-neutral-700">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                  <div>
                    <dt className="text-sm font-medium text-gray-700 dark:text-neutral-400">
                      データ件数
                    </dt>
                    <dd className="mt-1 text-lg font-semibold text-gray-900 dark:text-neutral-100">
                      {Array.isArray(statisticalData.DATA_INF?.VALUE)
                        ? statisticalData.DATA_INF.VALUE.length
                        : statisticalData.DATA_INF?.VALUE
                        ? 1
                        : 0}{" "}
                      件
                    </dd>
                  </div>

                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-neutral-400">
                      分類項目数
                    </dt>
                    <dd className="mt-1 text-lg font-semibold text-gray-900 dark:text-neutral-100">
                      {statisticalData.CLASS_INF?.CLASS_OBJ?.length || 0} 項目
                    </dd>
                  </div>

                  <div>
                    <dt className="text-sm font-medium text-gray-700 dark:text-neutral-400">
                      更新日時
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-neutral-100 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {result?.DATE || "不明"}
                    </dd>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderCategoriesTable = () => {
    if (!data) return null;

    const statisticalData = data.GET_STATS_DATA.STATISTICAL_DATA;
    const values = statisticalData.DATA_INF.VALUE;
    const valuesArray = Array.isArray(values) ? values : values ? [values] : [];

    const columns: TableColumn<EstatValue>[] = [
      { key: "@cat01", label: "カテゴリ01" },
      { key: "@cat02", label: "カテゴリ02" },
      { key: "@cat03", label: "カテゴリ03" },
      { key: "@cat04", label: "カテゴリ04" },
      { key: "@cat05", label: "カテゴリ05" },
    ];

    return <DataTable data={valuesArray} columns={columns} emptyMessage="カテゴリ情報がありません" />;
  };

  const renderAreasTable = () => {
    if (!data) return null;

    const statisticalData = data.GET_STATS_DATA.STATISTICAL_DATA;
    const values = statisticalData.DATA_INF.VALUE;
    const valuesArray = Array.isArray(values) ? values : values ? [values] : [];

    const columns: TableColumn<EstatValue>[] = [
      { key: "@area", label: "地域コード" },
      { 
        key: "area_name", 
        label: "地域名", 
        render: (item) => item["@area"] || "-"
      },
    ];

    return <DataTable data={valuesArray} columns={columns} emptyMessage="地域情報がありません" />;
  };

  const renderYearsTable = () => {
    if (!data) return null;

    const statisticalData = data.GET_STATS_DATA.STATISTICAL_DATA;
    const values = statisticalData.DATA_INF.VALUE;
    const valuesArray = Array.isArray(values) ? values : values ? [values] : [];

    const columns: TableColumn<EstatValue>[] = [
      { key: "@time", label: "年度" },
      { 
        key: "time_desc", 
        label: "説明", 
        render: (item) => item["@time"] || "-"
      },
    ];

    return <DataTable data={valuesArray} columns={columns} emptyMessage="年度情報がありません" />;
  };

  const renderValuesTable = () => {
    if (!data) return null;

    const statisticalData = data.GET_STATS_DATA.STATISTICAL_DATA;
    const values = statisticalData.DATA_INF.VALUE;
    const valuesArray = Array.isArray(values) ? values : values ? [values] : [];

    const columns: TableColumn<EstatValue>[] = [
      { 
        key: "category", 
        label: "カテゴリ",
        render: (item) => item["@cat01"] || item["@cat02"] || item["@cat03"] || item["@cat04"] || item["@cat05"] || "-"
      },
      { key: "@area", label: "地域" },
      { key: "@time", label: "年度" },
      { 
        key: "value", 
        label: "値",
        render: (item) => <span className="font-medium">{item.$ || String(item)}</span>
      },
      { 
        key: "@unit", 
        label: "単位",
        render: (item) => <span className="text-gray-500 dark:text-neutral-400">{item["@unit"] || "-"}</span>
      },
    ];

    return <DataTable data={valuesArray} columns={columns} emptyMessage="表形式で表示できるデータがありません" />;
  };

  const renderRawData = () => {
    return (
      <div className="space-y-4">
        <div className="flex justify-end">
          <button
            onClick={() => copyToClipboard(JSON.stringify(data, null, 2))}
            className="py-1.5 px-3 inline-flex items-center gap-x-1.5 text-xs font-medium rounded-lg border border-gray-200 bg-white text-gray-800 shadow-xs hover:bg-gray-50 focus:outline-none focus:bg-gray-50 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-700"
          >
            <Copy className="w-3 h-3" />
            コピー
          </button>
        </div>

        <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
          <pre className="text-sm text-gray-100">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-xs dark:bg-neutral-800 dark:border-neutral-700">
        <div className="p-8 text-center">
          <div className="animate-spin inline-block w-8 h-8 border-4 border-current border-t-transparent text-indigo-600 rounded-full"></div>
          <p className="mt-4 text-gray-600 dark:text-neutral-400">
            データを取得中...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border border-red-200 rounded-lg shadow-xs dark:bg-neutral-800 dark:border-red-700">
        <div className="p-6">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-red-500" />
            <div>
              <h3 className="font-medium text-red-800 dark:text-red-200">
                データ取得エラー
              </h3>
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {error}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-xs dark:bg-neutral-800 dark:border-neutral-700">
        <div className="p-8 text-center">
          <Database className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-neutral-100 mb-2">
            データ取得前
          </h3>
          <p className="text-gray-500 dark:text-neutral-400">
            上のフォームからパラメータを入力してデータを取得してください
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-xs dark:bg-neutral-800 dark:border-neutral-700">
      {/* ヘッダー */}
      <div className="py-3 px-4 border-b border-gray-200 dark:border-neutral-700 flex justify-between items-center">
        <h2 className="font-medium text-lg text-gray-800 dark:text-neutral-200 flex items-center gap-2">
          <Eye className="w-5 h-5 text-green-500" />
          APIレスポンス
        </h2>

        <button
          onClick={downloadAsJson}
          className="py-1.5 px-3 inline-flex items-center gap-x-1.5 text-xs font-medium rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 focus:outline-none focus:bg-indigo-600"
        >
          <Download className="w-3 h-3" />
          JSONダウンロード
        </button>
      </div>

      {/* タブナビゲーション */}
      <div className="border-b border-gray-200 dark:border-neutral-700">
        <nav className="flex space-x-6 px-4">
          {[
            { id: "overview" as const, label: "概要", icon: Info },
            { id: "categories" as const, label: "カテゴリ", icon: BarChart3 },
            { id: "areas" as const, label: "地域", icon: BarChart3 },
            { id: "years" as const, label: "年度", icon: BarChart3 },
            { id: "values" as const, label: "値", icon: BarChart3 },
            { id: "raw" as const, label: "Raw JSON", icon: Database },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-all duration-200 flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-neutral-400 dark:hover:text-neutral-300"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* タブコンテンツ */}
      <div className={activeTab === "overview" || activeTab === "raw" ? "p-4" : ""}>
        {activeTab === "overview" && renderOverview()}
        {activeTab === "categories" && (
          <div className="p-4">
            {renderCategoriesTable()}
          </div>
        )}
        {activeTab === "areas" && (
          <div className="p-4">
            {renderAreasTable()}
          </div>
        )}
        {activeTab === "years" && (
          <div className="p-4">
            {renderYearsTable()}
          </div>
        )}
        {activeTab === "values" && (
          <div className="p-4">
            {renderValuesTable()}
          </div>
        )}
        {activeTab === "raw" && renderRawData()}
      </div>
    </div>
  );
}
