"use client";

/**
 * ランキング設定ページ - データ取得フォーム
 *
 * データ取得の流れ:
 * 1. ユーザーが統計表IDとカテゴリを入力
 * 2. フォーム送信でパラメータオブジェクトを作成
 * 3. 親コンポーネント(RankingSettingsPage)のonSubmitコールバックを呼び出し
 * 4. 親コンポーネントでuseEstatDataフックがデータ取得を開始
 */

import { useState } from "react";
import { Search, RotateCcw } from "lucide-react";
import InputField from "@/components/common/InputField";

interface PrefectureRankingParams {
  statsDataId: string;
  categoryCode?: string;
}

interface EstatPrefectureRankingFetcherProps {
  onSubmit: (params: PrefectureRankingParams) => void;
  loading: boolean;
}

export default function EstatPrefectureRankingFetcher({
  onSubmit,
  loading,
}: EstatPrefectureRankingFetcherProps) {
  // フォーム状態管理 - 統計表IDとカテゴリの初期値を設定
  const [formData, setFormData] = useState<PrefectureRankingParams>({
    statsDataId: "0000010101", // デフォルト統計表ID（国勢調査）
    categoryCode: "A1101", // デフォルトカテゴリ（総人口）
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /**
   * フォーム送信処理 - データ取得の開始点
   * 1. フォームのデフォルト送信を防止
   * 2. 親コンポーネントのonSubmitコールバックを呼び出し
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); // フォームのデフォルト送信を防止

    // 親コンポーネント(RankingSettingsPage)のhandleFetchDataを呼び出し
    onSubmit(formData);
  };

  /**
   * フォームリセット処理 - 初期値に戻す
   */
  const handleReset = () => {
    setFormData({
      statsDataId: "0000010101",
      categoryCode: "A1101",
    });
  };

  return (
    <div className="space-y-4">
      {/* データ取得フォーム - 統計表IDとカテゴリの入力 */}
      <form onSubmit={handleSubmit} className="p-4">
        <div className="space-y-4">
          {/* 入力フィールドとボタンを横一列に配置 */}
          <div className="flex items-end gap-4">
            {/* 統計表ID入力フィールド - 必須項目 */}
            <div className="w-32">
              <InputField
                name="statsDataId"
                label="統計表ID"
                placeholder="0000010101"
                value={formData.statsDataId}
                onChange={handleInputChange}
                required
              />
            </div>

            {/* カテゴリ入力フィールド - オプション項目 */}
            <div className="w-32">
              <InputField
                name="categoryCode"
                label="カテゴリ"
                placeholder="A1101"
                value={formData.categoryCode}
                onChange={handleInputChange}
              />
            </div>

            {/* アクションボタン群 */}
            <div className="flex gap-2">
              {/* データ取得ボタン - フォーム送信をトリガー */}
              <button
                type="submit"
                disabled={loading || !formData.statsDataId}
                className="relative group p-2 rounded-lg border border-transparent bg-indigo-500 text-white hover:bg-indigo-600 focus:outline-none focus:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title={loading ? "取得中..." : "データ取得・地図表示"}
              >
                <Search className="w-5 h-5" />
                {/* ツールチップ */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                  {loading ? "取得中..." : "データ取得・地図表示"}
                </div>
              </button>

              {/* リセットボタン - フォームを初期値に戻す */}
              <button
                type="button"
                onClick={handleReset}
                disabled={loading}
                className="relative group p-2 rounded-lg border border-gray-200 bg-white text-gray-800 shadow-xs hover:bg-gray-50 focus:outline-none focus:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:focus:bg-neutral-700 transition-colors"
                title="リセット"
              >
                <RotateCcw className="w-5 h-5" />
                {/* ツールチップ */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                  リセット
                </div>
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
