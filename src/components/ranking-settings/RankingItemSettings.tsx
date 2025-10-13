"use client";

import { useState, useEffect } from "react";
import {
  Settings,
  ChevronDown,
  ChevronRight,
  Save,
  RotateCcw,
} from "lucide-react";

interface RankingItemSettingsProps {
  statsDataId?: string;
  cdCat01?: string;
  initialSettings?: RankingItemSettingsData;
  onSave?: (settings: RankingItemSettingsData) => Promise<void>;
}

export interface RankingItemSettingsData {
  // 基本設定
  label?: string;
  name?: string;
  unit?: string;

  // 可視化設定
  map_color_scheme: string;
  map_diverging_midpoint: string;
  ranking_direction: string;
  conversion_factor: number;
  decimal_places: number;

  // 表示設定
  display_order?: number;
  is_active?: boolean;
}

export default function RankingItemSettings({
  statsDataId,
  cdCat01,
  initialSettings,
  onSave,
}: RankingItemSettingsProps) {
  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    visualization: true,
    display: false,
  });

  const [settings, setSettings] = useState<RankingItemSettingsData>({
    label: initialSettings?.label || "",
    name: initialSettings?.name || "",
    unit: initialSettings?.unit || "",
    map_color_scheme: initialSettings?.map_color_scheme || "interpolateBlues",
    map_diverging_midpoint: initialSettings?.map_diverging_midpoint || "zero",
    ranking_direction: initialSettings?.ranking_direction || "desc",
    conversion_factor: initialSettings?.conversion_factor || 1,
    decimal_places: initialSettings?.decimal_places || 0,
    display_order: initialSettings?.display_order || 0,
    is_active: initialSettings?.is_active ?? true,
  });

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (initialSettings) {
      setSettings({
        ...settings,
        ...initialSettings,
      });
    }
  }, [initialSettings]);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleSave = async () => {
    if (!onSave) return;

    setSaving(true);
    setSaveSuccess(false);

    try {
      await onSave(settings);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error("設定の保存に失敗しました:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (initialSettings) {
      setSettings({
        ...settings,
        ...initialSettings,
      });
    }
  };

  const colorSchemeOptions = [
    { value: "interpolateBlues", label: "青" },
    { value: "interpolateGreens", label: "緑" },
    { value: "interpolateReds", label: "赤" },
    { value: "interpolateOranges", label: "オレンジ" },
    { value: "interpolatePurples", label: "紫" },
    { value: "interpolateRdYlBu", label: "赤-黄-青" },
    { value: "interpolateRdYlGn", label: "赤-黄-緑" },
  ];

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700">
      {/* ヘッダー */}
      <div className="p-4 border-b border-gray-200 dark:border-neutral-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-indigo-600" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-neutral-100">
              ランキング項目設定
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="px-3 py-1.5 text-sm text-gray-700 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-md transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4" />
              リセット
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-3 py-1.5 text-sm bg-indigo-600 text-white hover:bg-indigo-700 rounded-md transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              {saving ? "保存中..." : "保存"}
            </button>
          </div>
        </div>
        {saveSuccess && (
          <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 text-sm rounded">
            設定を保存しました
          </div>
        )}
      </div>

      {/* 基本設定セクション */}
      <div className="border-b border-gray-200 dark:border-neutral-700">
        <button
          onClick={() => toggleSection("basic")}
          className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-neutral-700/50 transition-colors"
        >
          <span className="font-medium text-gray-900 dark:text-neutral-100">
            基本設定
          </span>
          {expandedSections.basic ? (
            <ChevronDown className="w-5 h-5" />
          ) : (
            <ChevronRight className="w-5 h-5" />
          )}
        </button>
        {expandedSections.basic && (
          <div className="p-4 space-y-4 bg-gray-50 dark:bg-neutral-900/50">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
                ラベル
              </label>
              <input
                type="text"
                value={settings.label}
                onChange={(e) =>
                  setSettings({ ...settings, label: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-800 text-gray-900 dark:text-neutral-100"
                placeholder="UI表示用のラベル"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
                名称
              </label>
              <input
                type="text"
                value={settings.name}
                onChange={(e) =>
                  setSettings({ ...settings, name: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-800 text-gray-900 dark:text-neutral-100"
                placeholder="統計項目の正式名称"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
                単位
              </label>
              <input
                type="text"
                value={settings.unit}
                onChange={(e) =>
                  setSettings({ ...settings, unit: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-800 text-gray-900 dark:text-neutral-100"
                placeholder="例: ha, %, 人"
              />
            </div>
          </div>
        )}
      </div>

      {/* 可視化設定セクション */}
      <div className="border-b border-gray-200 dark:border-neutral-700">
        <button
          onClick={() => toggleSection("visualization")}
          className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-neutral-700/50 transition-colors"
        >
          <span className="font-medium text-gray-900 dark:text-neutral-100">
            可視化設定
          </span>
          {expandedSections.visualization ? (
            <ChevronDown className="w-5 h-5" />
          ) : (
            <ChevronRight className="w-5 h-5" />
          )}
        </button>
        {expandedSections.visualization && (
          <div className="p-4 space-y-4 bg-gray-50 dark:bg-neutral-900/50">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
                カラースキーム
              </label>
              <select
                value={settings.map_color_scheme}
                onChange={(e) =>
                  setSettings({ ...settings, map_color_scheme: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-800 text-gray-900 dark:text-neutral-100"
              >
                {colorSchemeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
                分岐点
              </label>
              <select
                value={settings.map_diverging_midpoint}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    map_diverging_midpoint: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-800 text-gray-900 dark:text-neutral-100"
              >
                <option value="zero">ゼロ</option>
                <option value="mean">平均値</option>
                <option value="median">中央値</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
                ランキング方向
              </label>
              <select
                value={settings.ranking_direction}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    ranking_direction: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-800 text-gray-900 dark:text-neutral-100"
              >
                <option value="desc">降順（高い順）</option>
                <option value="asc">昇順（低い順）</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
                  変換係数
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={settings.conversion_factor}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      conversion_factor: parseFloat(e.target.value) || 1,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-800 text-gray-900 dark:text-neutral-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
                  小数点以下桁数
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={settings.decimal_places}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      decimal_places: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-800 text-gray-900 dark:text-neutral-100"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 表示設定セクション */}
      <div>
        <button
          onClick={() => toggleSection("display")}
          className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-neutral-700/50 transition-colors"
        >
          <span className="font-medium text-gray-900 dark:text-neutral-100">
            表示設定
          </span>
          {expandedSections.display ? (
            <ChevronDown className="w-5 h-5" />
          ) : (
            <ChevronRight className="w-5 h-5" />
          )}
        </button>
        {expandedSections.display && (
          <div className="p-4 space-y-4 bg-gray-50 dark:bg-neutral-900/50">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-1">
                表示順序
              </label>
              <input
                type="number"
                value={settings.display_order}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    display_order: parseInt(e.target.value) || 0,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-800 text-gray-900 dark:text-neutral-100"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={settings.is_active}
                onChange={(e) =>
                  setSettings({ ...settings, is_active: e.target.checked })
                }
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <label
                htmlFor="is_active"
                className="text-sm text-gray-700 dark:text-neutral-300"
              >
                アクティブ
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
