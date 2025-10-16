"use client";

import React, { useMemo, useState } from "react";
import { ChevronUp, ChevronDown, TrendingUp } from "lucide-react";
import { FormattedValue } from "@/lib/estat-api";
import { ExportButton } from "@/components/export/ExportButton";

/**
 * ソート可能なフィールドの型定義
 * - rank: 順位によるソート
 * - name: 都道府県名によるソート
 * - value: 値によるソート
 */
type SortField = "rank" | "name" | "value";

/**
 * ソート順序の型定義
 * - asc: 昇順
 * - desc: 降順
 */
type SortOrder = "asc" | "desc";

/**
 * 都道府県データテーブルコンポーネントのProps
 */
interface PrefectureDataTableClientProps {
  /**
   * 表示する都道府県データの配列
   * FormattedValue[]形式で、各項目にはareaCode、areaName、value、unit等が含まれる
   */
  data: FormattedValue[] | null;

  /**
   * 追加のCSSクラス名（オプショナル）
   * 親コンポーネントからのスタイルカスタマイズ用
   */
  className?: string;
}

/**
 * 都道府県データテーブルコンポーネント
 *
 * 責務:
 * 1. 都道府県別の統計データをテーブル形式で表示
 * 2. 順位、都道府県名、値によるソート機能を提供
 * 3. データの視覚的な強調表示（上位ランキングの色分け等）
 * 4. データのフォーマット表示（単位、小数点等）
 *
 * 設計方針:
 * - 単一責務: データの表示とソート機能に特化
 * - 再利用性: 異なる統計データでも使用可能
 * - ユーザビリティ: 直感的なソート操作と視覚的フィードバック
 */
export const PrefectureDataTableClient: React.FC<
  PrefectureDataTableClientProps
> = ({ data, className = "" }) => {
  // ===== 状態管理 =====
  // ソートフィールドとソート順序の状態管理
  const [sortField, setSortField] = useState<SortField>("rank");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  // ===== データ処理 =====
  // ソート処理: データの配列を指定されたフィールドと順序でソート
  const sortedData = useMemo(() => {
    if (!data || !Array.isArray(data)) {
      return [];
    }
    return [...data].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case "rank":
          // 順位によるソート（数値比較）
          comparison = (a.rank || 0) - (b.rank || 0);
          break;
        case "name":
          // 都道府県名によるソート（文字列比較、日本語対応）
          comparison = a.areaName.localeCompare(b.areaName);
          break;
        case "value":
          // 値によるソート（数値比較）
          comparison = (a.value || 0) - (b.value || 0);
          break;
      }

      // ソート順序に応じて比較結果を反転
      return sortOrder === "asc" ? comparison : -comparison;
    });
  }, [data, sortField, sortOrder]);

  // ===== イベントハンドラー =====
  // ソート処理: ヘッダークリック時のソート状態変更
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // 同じフィールドの場合は昇順⇔降順を切り替え
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      // 異なるフィールドの場合は新しいフィールドで昇順ソート
      setSortField(field);
      setSortOrder("asc");
    }
  };

  // ===== UI ヘルパー関数 =====
  // ソートアイコンの表示制御: 現在のソート状態に応じてアイコンを変更
  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      // ソート対象外のフィールドは非アクティブなアイコン
      return <ChevronUp className="w-3 h-3 text-gray-400" />;
    }
    // 現在のソートフィールドはアクティブなアイコンで方向を表示
    return sortOrder === "asc" ? (
      <ChevronUp className="w-3 h-3 text-indigo-600" />
    ) : (
      <ChevronDown className="w-3 h-3 text-indigo-600" />
    );
  };

  // ===== スタイリング関数 =====
  // 順位に基づく色分け: 上位ランキングを視覚的に強調
  const getRankStyle = (rank: number) => {
    if (rank <= 3) return "text-yellow-600 dark:text-yellow-400 font-bold"; // トップ3: 金色
    if (rank <= 10) return "text-blue-600 dark:text-blue-400 font-medium"; // トップ10: 青色
    return "text-gray-900 dark:text-neutral-100"; // その他: 通常色
  };

  // 値の強調表示: 上位ランキングの数値を太字で強調
  const getValueStyle = (rank: number) => {
    if (rank <= 3) return "font-bold"; // トップ3: 太字
    if (rank <= 5) return "font-medium"; // トップ5: 中太字
    return ""; // その他: 通常
  };

  // ===== 早期リターン =====
  // データが存在しない場合の空状態表示
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div
        className={`bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700 ${className}`}
      >
        <div className="p-8 text-center">
          <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-neutral-400">
            表示するデータがありません
          </p>
        </div>
      </div>
    );
  }

  // ===== メイン表示 =====
  return (
    <div
      className={`bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 ${className}`}
    >
      {/* ヘッダー部分: タイトルとデータ件数表示 */}
      <div className="p-4 border-b border-gray-200 dark:border-neutral-700">
        <div className="flex items-center justify-between">
          <h3 className="text-md font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
            都道府県別データ
          </h3>
          <div className="flex items-center gap-2">
            <div className="text-xs text-gray-500 dark:text-neutral-400">
              {sortedData.length}件
            </div>
            <ExportButton
              data={sortedData}
              dataType="prefecture-ranking"
              metadata={{ year: "2023" }}
            />
          </div>
        </div>
      </div>

      {/* テーブル部分: スクロール可能なデータテーブル */}
      <div className="overflow-hidden">
        <div className="max-h-96 overflow-y-auto">
          <table className="w-full">
            {/* テーブルヘッダー: ソート可能な列ヘッダー */}
            <thead className="bg-gray-50 dark:bg-neutral-700 sticky top-0">
              <tr>
                {/* 順位列: クリックでソート切り替え */}
                <th
                  className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-neutral-600"
                  onClick={() => handleSort("rank")}
                >
                  <div className="flex items-center gap-1">
                    順位
                    {getSortIcon("rank")}
                  </div>
                </th>
                {/* 都道府県名列: クリックでソート切り替え */}
                <th
                  className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-neutral-600"
                  onClick={() => handleSort("name")}
                >
                  <div className="flex items-center gap-1">
                    都道府県
                    {getSortIcon("name")}
                  </div>
                </th>
                {/* 値列: クリックでソート切り替え、右寄せ表示 */}
                <th
                  className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-neutral-600"
                  onClick={() => handleSort("value")}
                >
                  <div className="flex items-center justify-end gap-1">
                    値{getSortIcon("value")}
                  </div>
                </th>
              </tr>
            </thead>
            {/* テーブルボディ: データ行の表示 */}
            <tbody className="divide-y divide-gray-200 dark:divide-neutral-700">
              {sortedData.map((item, index) => (
                <tr
                  key={item.areaCode}
                  className="hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors"
                >
                  {/* 順位列: ランキングに応じた色分け表示 */}
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span
                      className={`text-sm ${getRankStyle(
                        item.rank || index + 1
                      )}`}
                    >
                      {item.rank || index + 1}
                    </span>
                  </td>
                  {/* 都道府県名列: 地域名の表示 */}
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span className="text-sm text-gray-900 dark:text-neutral-100">
                      {item.areaName}
                    </span>
                  </td>
                  {/* 値列: フォーマットされた数値の表示（右寄せ） */}
                  <td className="px-3 py-2 whitespace-nowrap text-right">
                    <span
                      className={`text-sm text-gray-900 dark:text-neutral-100 ${getValueStyle(
                        item.rank || index + 1
                      )}`}
                    >
                      {formatValue(item.value, item.unit)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

/**
 * 値のフォーマット関数
 *
 * 責務:
 * - 数値を適切な形式で文字列に変換
 * - 単位に応じた表示形式の適用
 * - 値の大きさに応じた桁数調整
 *
 * @param value - フォーマットする数値
 * @param unit - 単位文字列
 * @returns フォーマットされた文字列（値 + 単位）
 */
function formatValue(value: number | null, unit?: string | null): string {
  // null または undefined の場合のデフォルト表示
  if (value === null || value === undefined) {
    return "-";
  }

  // 単位がない場合は数値のみ表示
  if (!unit) {
    return value.toLocaleString("ja-JP");
  }

  // 通貨データの場合: カンマ区切り（日本語形式）
  if (unit.includes("円")) {
    return `${value.toLocaleString("ja-JP")} ${unit}`;
  }

  // 人口・世帯・件数データの場合: カンマ区切り（日本語形式）
  if (unit.includes("人") || unit.includes("世帯") || unit.includes("件")) {
    return `${value.toLocaleString("ja-JP")} ${unit}`;
  }

  // 割合データの場合: 小数点1桁 + %記号
  if (unit.includes("%")) {
    return `${value.toFixed(1)}${unit}`;
  }

  // その他の数値データ: 値の大きさに応じて桁数を自動調整
  let formattedValue: string;
  if (value >= 1000) {
    formattedValue = value.toLocaleString("ja-JP"); // 1000以上: カンマ区切り
  } else if (value >= 10) {
    formattedValue = value.toFixed(1); // 10以上: 小数点1桁
  } else {
    formattedValue = value.toFixed(2); // 10未満: 小数点2桁
  }

  return `${formattedValue} ${unit}`;
}
