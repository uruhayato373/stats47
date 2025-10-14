import { useState } from "react";
import { Download, AlertCircle, CheckCircle, Settings } from "lucide-react";

export default function StatsListFetchTab() {
  const [params, setParams] = useState({
    lang: "J",
    statsField: "",
    statsCode: "",
    surveyYears: "",
    openYears: "",
    searchWord: "",
    searchKind: "1",
    collectArea: "1",
    limit: "100",
    startPosition: "1",
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    recordsProcessed: number;
    totalAvailable: number;
    error?: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (key: string, value: string) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  const handleFetch = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value && value.trim() !== "") {
          queryParams.append(key, value);
        }
      });

      const response = await fetch(
        `/api/estat/statslist/fetch?${queryParams.toString()}`
      );

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorData = (await response.json()) as { error?: string };
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = `HTTP ${response.status}: ${await response.text()}`;
        }
        throw new Error(errorMessage);
      }

      const data = (await response.json()) as {
        success: boolean;
        recordsProcessed: number;
        totalAvailable: number;
        error?: string;
      };
      setResult(data);
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err instanceof Error ? err.message : "データ取得に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* パラメータ設定フォーム */}
      <div className="bg-gray-50 dark:bg-neutral-800 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
          <Settings className="w-5 h-5 text-indigo-600" />
          統計表リスト取得パラメータ
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
              言語
            </label>
            <select
              value={params.lang}
              onChange={(e) => handleInputChange("lang", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-neutral-700 dark:border-neutral-600 dark:text-white"
            >
              <option value="J">日本語</option>
              <option value="E">英語</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
              統計分野
            </label>
            <input
              type="text"
              value={params.statsField}
              onChange={(e) => handleInputChange("statsField", e.target.value)}
              placeholder="例: 02 (人口・世帯)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-neutral-700 dark:border-neutral-600 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
              統計コード
            </label>
            <input
              type="text"
              value={params.statsCode}
              onChange={(e) => handleInputChange("statsCode", e.target.value)}
              placeholder="例: 00200521"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-neutral-700 dark:border-neutral-600 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
              調査年月
            </label>
            <input
              type="text"
              value={params.surveyYears}
              onChange={(e) => handleInputChange("surveyYears", e.target.value)}
              placeholder="例: 202301-202312"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-neutral-700 dark:border-neutral-600 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
              公開年月
            </label>
            <input
              type="text"
              value={params.openYears}
              onChange={(e) => handleInputChange("openYears", e.target.value)}
              placeholder="例: 202301-202312"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-neutral-700 dark:border-neutral-600 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
              検索キーワード
            </label>
            <input
              type="text"
              value={params.searchWord}
              onChange={(e) => handleInputChange("searchWord", e.target.value)}
              placeholder="例: 人口"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-neutral-700 dark:border-neutral-600 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
              検索方法
            </label>
            <select
              value={params.searchKind}
              onChange={(e) => handleInputChange("searchKind", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-neutral-700 dark:border-neutral-600 dark:text-white"
            >
              <option value="1">AND検索</option>
              <option value="2">OR検索</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
              収集地域
            </label>
            <select
              value={params.collectArea}
              onChange={(e) => handleInputChange("collectArea", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-neutral-700 dark:border-neutral-600 dark:text-white"
            >
              <option value="1">全国</option>
              <option value="2">都道府県</option>
              <option value="3">市区町村</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
              取得件数
            </label>
            <select
              value={params.limit}
              onChange={(e) => handleInputChange("limit", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-neutral-700 dark:border-neutral-600 dark:text-white"
            >
              <option value="10">10件</option>
              <option value="50">50件</option>
              <option value="100">100件</option>
              <option value="1000">1000件</option>
            </select>
          </div>
        </div>

        <div className="mt-6 flex justify-center">
          <button
            onClick={handleFetch}
            disabled={loading}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <Download className={`w-4 h-4 ${loading ? "animate-pulse" : ""}`} />
            {loading ? "取得中..." : "統計表リストを取得"}
          </button>
        </div>
      </div>

      {/* エラー表示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-800">
            <AlertCircle className="w-5 h-5" />
            <strong>エラー:</strong> {error}
          </div>
        </div>
      )}

      {/* 結果表示 */}
      {result && (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-green-800">
              <CheckCircle className="w-5 h-5" />
              <strong>取得完了:</strong> {result.recordsProcessed}
              件のデータを処理しました (全{result.totalAvailable}件中)
            </div>
          </div>

          {/* 詳細情報 */}
          <div className="bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 dark:text-neutral-100 mb-2">
              処理結果詳細
            </h4>
            <div className="text-sm space-y-1">
              <div>処理件数: {result.recordsProcessed.toLocaleString()}件</div>
              <div>総件数: {result.totalAvailable.toLocaleString()}件</div>
              <div>成功: {result.success ? "はい" : "いいえ"}</div>
              {result.error && (
                <div className="text-red-600">エラー: {result.error}</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
