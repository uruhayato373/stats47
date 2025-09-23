import { VisualizationSettingsPanelProps } from "./types";

export default function VisualizationSettingsPanel({
  editableSettings,
  visualizationSettings,
  params,
  onSettingsChange,
}: VisualizationSettingsPanelProps) {
  return (
    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mb-4 space-y-4">
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
        可視化設定の詳細
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* ランキング方向 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            ランキング方向
          </label>
          <select
            value={editableSettings.ranking_direction || "desc"}
            onChange={(e) =>
              onSettingsChange({
                ...editableSettings,
                ranking_direction: e.target.value as "asc" | "desc",
              })
            }
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value="desc">降順（大きい値から小さい値）</option>
            <option value="asc">昇順（小さい値から大きい値）</option>
          </select>
        </div>

        {/* 変換係数 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            変換係数
          </label>
          <input
            type="number"
            step="0.000001"
            value={editableSettings.conversion_factor || 1}
            onChange={(e) =>
              onSettingsChange({
                ...editableSettings,
                conversion_factor: parseFloat(e.target.value) || 1,
              })
            }
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            placeholder="1"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            データ値に掛ける係数（例：0.0001で万単位に変換）
          </p>
        </div>

        {/* 小数点以下桁数 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            小数点以下桁数
          </label>
          <input
            type="number"
            min="0"
            max="10"
            value={editableSettings.decimal_places || 0}
            onChange={(e) =>
              onSettingsChange({
                ...editableSettings,
                decimal_places: parseInt(e.target.value) || 0,
              })
            }
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            placeholder="0"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            表示する小数点以下の桁数
          </p>
        </div>

        {/* 統計表ID（表示のみ） */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            統計表ID
          </label>
          <input
            type="text"
            value={params?.statsDataId || ""}
            disabled
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400"
          />
        </div>

        {/* カテゴリコード（表示のみ） */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            カテゴリコード
          </label>
          <input
            type="text"
            value={params?.categoryCode || ""}
            disabled
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400"
          />
        </div>
      </div>

      {/* 設定の詳細情報 */}
      {visualizationSettings && (
        <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-md">
          <h4 className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">
            現在の設定情報
          </h4>
          <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
            {visualizationSettings.id && (
              <p>設定ID: {visualizationSettings.id}</p>
            )}
            {visualizationSettings.created_at && (
              <p>
                作成日時:{" "}
                {new Date(visualizationSettings.created_at).toLocaleString(
                  "ja-JP"
                )}
              </p>
            )}
            {visualizationSettings.updated_at && (
              <p>
                更新日時:{" "}
                {new Date(visualizationSettings.updated_at).toLocaleString(
                  "ja-JP"
                )}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
