"use client";

import { useState, useEffect } from "react";
import {
  VisualizationSettings,
  VisualizationSettingsService,
} from "@/lib/ranking/visualization-settings";

interface UseVisualizationSettingsOptions {
  statsDataId?: string;
  categoryCode?: string;
}

export function useVisualizationSettings({
  statsDataId,
  categoryCode,
}: UseVisualizationSettingsOptions) {
  const [settings, setSettings] = useState<VisualizationSettings | null>(null);
  const [editableSettings, setEditableSettings] = useState<
    Partial<VisualizationSettings>
  >({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // 設定の読み込み
  useEffect(() => {
    const loadSettings = async () => {
      if (!statsDataId || !categoryCode) return;

      setLoading(true);
      try {
        const response = await VisualizationSettingsService.fetchSettings(
          statsDataId,
          categoryCode
        );

        if (response.success) {
          setSettings(response.settings);
          setEditableSettings(response.settings);
        } else {
          // デフォルト値を設定
          const defaultSettings =
            VisualizationSettingsService.getDefaultSettings(
              statsDataId,
              categoryCode
            );
          setEditableSettings(defaultSettings);
        }
      } catch (error) {
        console.error("Failed to load visualization settings:", error);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [statsDataId, categoryCode]);

  // 設定の保存
  const saveSettings = async (
    settingsToSave: Partial<VisualizationSettings>
  ) => {
    if (!statsDataId || !categoryCode) {
      throw new Error("統計表IDとカテゴリコードが必要です");
    }

    setSaving(true);
    setSaveSuccess(false);

    try {
      const result = await VisualizationSettingsService.saveSettings(
        settingsToSave
      );

      if (result.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);

        // 設定を再読み込み
        const response = await VisualizationSettingsService.fetchSettings(
          statsDataId,
          categoryCode
        );
        if (response.success) {
          setSettings(response.settings);
          setEditableSettings(response.settings);
        }

        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error("Failed to save settings:", error);
      return { success: false, error: "設定の保存に失敗しました" };
    } finally {
      setSaving(false);
    }
  };

  return {
    settings,
    editableSettings,
    setEditableSettings,
    loading,
    saving,
    saveSuccess,
    saveSettings,
  };
}
