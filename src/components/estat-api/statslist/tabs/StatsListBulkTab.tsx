import { useState } from "react";
import { Layers, Play, Square, AlertCircle, CheckCircle, Info } from "lucide-react";

export default function StatsListBulkTab() {
  const [operation, setOperation] = useState<'fetchAll' | 'fetchBulk'>('fetchAll');
  const [bulkParams, setBulkParams] = useState([
    { statsField: "02", searchWord: "人口" },
    { statsField: "03", searchWord: "労働" },
  ]);
  const [globalParams, setGlobalParams] = useState({
    lang: "J",
    collectArea: "1",
    limit: "1000",
    delayMs: "1000",
    batchSize: "5",
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<any>(null);

  const handleAddBulkParam = () => {
    setBulkParams(prev => [...prev, { statsField: "", searchWord: "" }]);
  };

  const handleRemoveBulkParam = (index: number) => {
    setBulkParams(prev => prev.filter((_, i) => i !== index));
  };

  const handleBulkParamChange = (index: number, key: string, value: string) => {
    setBulkParams(prev => prev.map((param, i) =>
      i === index ? { ...param, [key]: value } : param
    ));
  };

  const handleGlobalParamChange = (key: string, value: string) => {
    setGlobalParams(prev => ({ ...prev, [key]: value }));
  };

  const handleStart = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    setProgress(null);

    try {
      const endpoint = operation === 'fetchAll'
        ? '/api/estat/statslist/fetch-all'
        : '/api/estat/statslist/fetch-bulk';

      const body = operation === 'fetchAll'
        ? { params: globalParams }
        : { paramsList: bulkParams, options: globalParams };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      console.error("Bulk operation error:", err);
      setError(err instanceof Error ? err.message : "一括処理に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const handleStop = () => {
    // 今後実装: キャンセル機能
    console.log("Stop operation");
  };

  return (
    <div className="space-y-6">
      {/* 操作選択 */}
      <div className="bg-gray-50 dark:bg-neutral-800 rounded-lg p-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
          <Layers className="w-5 h-5 text-indigo-600" />
          一括処理オプション
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-neutral-700">
            <input
              type="radio"
              name="operation"
              value="fetchAll"
              checked={operation === 'fetchAll'}
              onChange={(e) => setOperation(e.target.value as any)}
              className="sr-only"
            />
            <div className={`w-4 h-4 rounded-full border-2 mr-3 ${
              operation === 'fetchAll'
                ? 'border-indigo-600 bg-indigo-600'
                : 'border-gray-300 dark:border-neutral-600'
            }`}>
              {operation === 'fetchAll' && (
                <div className="w-2 h-2 bg-white rounded-full m-0.5" />
              )}
            </div>
            <div>
              <div className="font-medium text-gray-900 dark:text-neutral-100">
                全件取得
              </div>
              <div className="text-sm text-gray-600 dark:text-neutral-400">
                ページネーションで全データを順次取得
              </div>
            </div>
          </label>

          <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-neutral-700">
            <input
              type="radio"
              name="operation"
              value="fetchBulk"
              checked={operation === 'fetchBulk'}
              onChange={(e) => setOperation(e.target.value as any)}
              className="sr-only"
            />
            <div className={`w-4 h-4 rounded-full border-2 mr-3 ${
              operation === 'fetchBulk'
                ? 'border-indigo-600 bg-indigo-600'
                : 'border-gray-300 dark:border-neutral-600'
            }`}>
              {operation === 'fetchBulk' && (
                <div className="w-2 h-2 bg-white rounded-full m-0.5" />
              )}
            </div>
            <div>
              <div className="font-medium text-gray-900 dark:text-neutral-100">
                複数条件一括取得
              </div>
              <div className="text-sm text-gray-600 dark:text-neutral-400">
                複数の検索条件で並列処理
              </div>
            </div>
          </label>
        </div>
      </div>

      {/* 複数条件設定 (fetchBulk時のみ表示) */}
      {operation === 'fetchBulk' && (
        <div className="bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-medium text-gray-900 dark:text-neutral-100">
              検索条件リスト
            </h4>
            <button
              onClick={handleAddBulkParam}
              className="px-3 py-1 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              条件を追加
            </button>
          </div>

          <div className="space-y-3">
            {bulkParams.map((param, index) => (
              <div key={index} className="flex gap-3 items-center">
                <div className="flex-1">
                  <input
                    type="text"
                    value={param.statsField}
                    onChange={(e) => handleBulkParamChange(index, 'statsField', e.target.value)}
                    placeholder="統計分野"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-neutral-700 dark:border-neutral-600 dark:text-white"
                  />
                </div>
                <div className="flex-1">
                  <input
                    type="text"
                    value={param.searchWord}
                    onChange={(e) => handleBulkParamChange(index, 'searchWord', e.target.value)}
                    placeholder="検索キーワード"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-neutral-700 dark:border-neutral-600 dark:text-white"
                  />
                </div>
                <button
                  onClick={() => handleRemoveBulkParam(index)}
                  disabled={bulkParams.length <= 1}
                  className="px-3 py-2 text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  削除
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 共通パラメータ */}
      <div className="bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 dark:text-neutral-100 mb-4">
          {operation === 'fetchAll' ? '全件取得' : '一括処理'}設定
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
              言語
            </label>
            <select
              value={globalParams.lang}
              onChange={(e) => handleGlobalParamChange('lang', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-neutral-700 dark:border-neutral-600 dark:text-white"
            >
              <option value="J">日本語</option>
              <option value="E">英語</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
              収集地域
            </label>
            <select
              value={globalParams.collectArea}
              onChange={(e) => handleGlobalParamChange('collectArea', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-neutral-700 dark:border-neutral-600 dark:text-white"
            >
              <option value="1">全国</option>
              <option value="2">都道府県</option>
              <option value="3">市区町村</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
              1回の取得件数
            </label>
            <select
              value={globalParams.limit}
              onChange={(e) => handleGlobalParamChange('limit', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-neutral-700 dark:border-neutral-600 dark:text-white"
            >
              <option value="100">100件</option>
              <option value="1000">1000件</option>
              <option value="10000">10000件</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
              リクエスト間隔 (ms)
            </label>
            <input
              type="number"
              value={globalParams.delayMs}
              onChange={(e) => handleGlobalParamChange('delayMs', e.target.value)}
              min="0"
              step="100"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-neutral-700 dark:border-neutral-600 dark:text-white"
            />
          </div>

          {operation === 'fetchBulk' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
                バッチサイズ
              </label>
              <input
                type="number"
                value={globalParams.batchSize}
                onChange={(e) => handleGlobalParamChange('batchSize', e.target.value)}
                min="1"
                max="10"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-neutral-700 dark:border-neutral-600 dark:text-white"
              />
            </div>
          )}
        </div>
      </div>

      {/* 注意事項 */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <Info className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div className="text-sm text-yellow-800">
            <div className="font-medium mb-1">注意事項</div>
            <ul className="list-disc list-inside space-y-1">
              <li>大量のデータ取得には時間がかかります</li>
              <li>e-STAT APIの利用制限に注意してください</li>
              <li>処理中はブラウザを閉じないでください</li>
              <li>エラーが発生した場合は設定を見直してください</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 制御ボタン */}
      <div className="flex justify-center gap-4">
        <button
          onClick={handleStart}
          disabled={loading}
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          <Play className={`w-4 h-4 ${loading ? 'animate-pulse' : ''}`} />
          {loading ? '処理中...' : '開始'}
        </button>

        {loading && (
          <button
            onClick={handleStop}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors flex items-center gap-2"
          >
            <Square className="w-4 h-4" />
            停止
          </button>
        )}
      </div>

      {/* 進捗表示 */}
      {progress && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-blue-800">
            進捗: {progress.current}/{progress.total} ({progress.percentage.toFixed(1)}%)
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2 mt-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
        </div>
      )}

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
              <strong>処理完了</strong>
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 dark:text-neutral-100 mb-3">処理結果</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-gray-600 dark:text-neutral-400">総取得回数</div>
                <div className="font-semibold">{result.totalFetched}</div>
              </div>
              <div>
                <div className="text-gray-600 dark:text-neutral-400">成功</div>
                <div className="font-semibold text-green-600">{result.successCount}</div>
              </div>
              <div>
                <div className="text-gray-600 dark:text-neutral-400">失敗</div>
                <div className="font-semibold text-red-600">{result.failureCount}</div>
              </div>
              <div>
                <div className="text-gray-600 dark:text-neutral-400">総レコード数</div>
                <div className="font-semibold">{result.totalRecords.toLocaleString()}</div>
              </div>
            </div>

            {/* 詳細結果 */}
            {result.results && result.results.length > 0 && (
              <div className="mt-4">
                <h5 className="font-medium text-gray-900 dark:text-neutral-100 mb-2">詳細結果</h5>
                <div className="max-h-60 overflow-y-auto">
                  <div className="space-y-2">
                    {result.results.map((item: any, index: number) => (
                      <div
                        key={index}
                        className={`p-2 rounded text-sm ${
                          item.success
                            ? 'bg-green-50 border border-green-200'
                            : 'bg-red-50 border border-red-200'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span>{item.success ? '✅' : '❌'} {item.recordCount}件</span>
                          {item.error && (
                            <span className="text-red-600 text-xs">{item.error}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}