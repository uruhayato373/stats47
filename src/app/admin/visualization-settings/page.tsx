"use client";

import { useState, useEffect } from "react";
import { Settings, Save, Plus, Edit, Trash2 } from "lucide-react";
import {
  VisualizationSettings,
  VisualizationSettingsService,
} from "@/lib/ranking/visualization-settings";

// カラースキーマオプション
const COLOR_SCHEMES = [
  { value: "interpolateBlues", label: "Blues (青系)" },
  { value: "interpolateGreens", label: "Greens (緑系)" },
  { value: "interpolateReds", label: "Reds (赤系)" },
  { value: "interpolateOranges", label: "Oranges (オレンジ系)" },
  { value: "interpolatePurples", label: "Purples (紫系)" },
  { value: "interpolateRdYlBu", label: "RdYlBu (赤-黄-青)" },
  { value: "interpolateRdYlGn", label: "RdYlGn (赤-黄-緑)" },
  { value: "interpolateSpectral", label: "Spectral (スペクトラム)" },
];

const DIVERGING_MIDPOINTS = [
  { value: "zero", label: "ゼロ" },
  { value: "mean", label: "平均値" },
  { value: "median", label: "中央値" },
];

export default function VisualizationSettingsAdminPage() {
  const [settings, setSettings] = useState<VisualizationSettings[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<Partial<VisualizationSettings>>({
    stats_data_id: "",
    cat01: "",
    map_color_scheme: "interpolateBlues",
    map_diverging_midpoint: "zero",
    ranking_direction: "desc",
    conversion_factor: 1,
    decimal_places: 0,
  });

  // 設定一覧を取得する関数（実際の実装ではAPIエンドポイントから取得）
  const loadSettings = async () => {
    setLoading(true);
    try {
      // 実際にはAPIエンドポイントで一覧を取得
      // 今回はサンプルデータ
      setSettings([]);
    } catch (error) {
      console.error("Failed to load settings:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.stats_data_id || !formData.cat01) {
      alert("統計表IDとカテゴリコードは必須です");
      return;
    }

    try {
      const result = await VisualizationSettingsService.saveSettings(formData);
      if (result.success) {
        alert("設定を保存しました");
        setFormData({
          stats_data_id: "",
          cat01: "",
          map_color_scheme: "interpolateBlues",
          map_diverging_midpoint: "zero",
          ranking_direction: "desc",
          conversion_factor: 1,
          decimal_places: 0,
        });
        setEditingId(null);
        await loadSettings();
      } else {
        alert(`保存に失敗しました: ${result.error}`);
      }
    } catch (error) {
      console.error("Failed to save settings:", error);
      alert("保存に失敗しました");
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "conversion_factor" || name === "decimal_places"
        ? Number(value)
        : value,
    }));
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-neutral-100 flex items-center gap-2">
          <Settings className="w-8 h-8 text-indigo-600" />
          可視化設定管理
        </h1>
        <p className="mt-2 text-gray-600 dark:text-neutral-400">
          都道府県ランキングの可視化設定を管理します
        </p>
      </div>

      {/* 設定フォーム */}
      <div className="bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg shadow-sm p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-neutral-100 flex items-center gap-2">
          <Plus className="w-5 h-5" />
          新しい設定を追加
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
                統計表ID
              </label>
              <input
                type="text"
                name="stats_data_id"
                value={formData.stats_data_id || ""}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-neutral-700 dark:text-neutral-100"
                placeholder="例: 0003448368"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
                カテゴリコード
              </label>
              <input
                type="text"
                name="cat01"
                value={formData.cat01 || ""}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-neutral-700 dark:text-neutral-100"
                placeholder="例: A110101"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
                地図カラースキーマ
              </label>
              <select
                name="map_color_scheme"
                value={formData.map_color_scheme || ""}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-neutral-700 dark:text-neutral-100"
              >
                {COLOR_SCHEMES.map((scheme) => (
                  <option key={scheme.value} value={scheme.value}>
                    {scheme.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
                ダイバージング中央値
              </label>
              <select
                name="map_diverging_midpoint"
                value={formData.map_diverging_midpoint || ""}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-neutral-700 dark:text-neutral-100"
              >
                {DIVERGING_MIDPOINTS.map((midpoint) => (
                  <option key={midpoint.value} value={midpoint.value}>
                    {midpoint.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
                ランキング方向
              </label>
              <select
                name="ranking_direction"
                value={formData.ranking_direction || ""}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-neutral-700 dark:text-neutral-100"
              >
                <option value="desc">降順 (高い値が上位)</option>
                <option value="asc">昇順 (低い値が上位)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
                変換係数
              </label>
              <input
                type="number"
                step="0.01"
                name="conversion_factor"
                value={formData.conversion_factor || ""}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-neutral-700 dark:text-neutral-100"
                placeholder="1"
              />
              <p className="text-xs text-gray-500 dark:text-neutral-400 mt-1">
                元データ × 係数 = 表示値 (例: 百万円→億円なら0.01)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
                小数点以下桁数
              </label>
              <input
                type="number"
                min="0"
                max="10"
                name="decimal_places"
                value={formData.decimal_places || ""}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-neutral-700 dark:text-neutral-100"
                placeholder="0"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              <Save className="w-4 h-4" />
              保存
            </button>
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setFormData({
                    stats_data_id: "",
                    cat01: "",
                    map_color_scheme: "interpolateBlues",
                    map_diverging_midpoint: "zero",
                    ranking_direction: "desc",
                    conversion_factor: 1,
                    decimal_places: 0,
                  });
                }}
                className="px-4 py-2 border border-gray-300 dark:border-neutral-600 text-gray-700 dark:text-neutral-300 rounded-md hover:bg-gray-50 dark:hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                キャンセル
              </button>
            )}
          </div>
        </form>
      </div>

      {/* 設定一覧 */}
      <div className="bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-200 dark:border-neutral-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-neutral-100">
            登録済み設定
          </h2>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin inline-block w-6 h-6 border-4 border-current border-t-transparent text-indigo-600 rounded-full"></div>
            <p className="mt-2 text-gray-600 dark:text-neutral-400">読み込み中...</p>
          </div>
        ) : settings.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-neutral-400">
            設定が登録されていません
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-neutral-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wider">
                    統計表ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wider">
                    カテゴリ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wider">
                    カラースキーマ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wider">
                    ランキング
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wider">
                    変換係数
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-neutral-400 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-neutral-800 divide-y divide-gray-200 dark:divide-neutral-700">
                {settings.map((setting) => (
                  <tr key={setting.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-neutral-100">
                      {setting.stats_data_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-neutral-100">
                      {setting.cat01}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-neutral-100">
                      {setting.map_color_scheme}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-neutral-100">
                      {setting.ranking_direction === "desc" ? "降順" : "昇順"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-neutral-100">
                      {setting.conversion_factor} (小数点{setting.decimal_places}桁)
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => {
                          setFormData(setting);
                          setEditingId(setting.id!);
                        }}
                        className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}