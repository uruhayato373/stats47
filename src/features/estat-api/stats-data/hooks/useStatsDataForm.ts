"use client";

/**
 * @fileoverview 統計データフォームの状態管理カスタムフック
 */

import { ReadonlyURLSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { AVAILABLE_CATEGORIES, DYNAMIC_FIELD_IDS } from "../constants";
import { DynamicField, FormData } from "../types";

/**
 * useStatsDataFormの戻り値
 */
export interface UseStatsDataFormReturn {
  // 状態
  formData: FormData;
  dynamicFields: DynamicField[];
  unusedCategories: (typeof AVAILABLE_CATEGORIES)[number][];

  // ハンドラー
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleAddField: (categoryId: string) => void;
  handleRemoveField: (fieldId: string) => void;
  handleDynamicFieldChange: (fieldId: string, value: string) => void;
  handleReset: () => void;
}

/**
 * 統計データフォームの状態管理フック
 *
 * 機能:
 * - フォームデータの状態管理
 * - 動的フィールドの追加/削除/変更
 * - URLパラメータからの初期値復元
 *
 * @param searchParams - URLSearchParams
 * @returns フォーム状態とハンドラー
 */
export function useStatsDataForm(
  searchParams: ReadonlyURLSearchParams
): UseStatsDataFormReturn {
  const [formData, setFormData] = useState<FormData>({
    statsDataId: "",
    cdCat01: "",
  });

  const [dynamicFields, setDynamicFields] = useState<DynamicField[]>([]);

  /**
   * URLパラメータから初期値を取得
   */
  useEffect(() => {
    const statsDataId = searchParams.get("statsDataId") || "";
    const cdCat01 = searchParams.get("cdCat01") || "";

    setFormData({
      statsDataId: statsDataId || "0000010101",
      cdCat01: cdCat01 || "A1101",
    });

    // 動的フィールドも復元
    const dynamicFieldsFromUrl: DynamicField[] = [];

    DYNAMIC_FIELD_IDS.forEach((fieldId) => {
      const value = searchParams.get(fieldId);
      if (value) {
        const category = AVAILABLE_CATEGORIES.find((cat) => cat.id === fieldId);
        if (category) {
          dynamicFieldsFromUrl.push({
            id: category.id,
            label: category.label,
            value,
          });
        }
      }
    });

    if (dynamicFieldsFromUrl.length > 0) {
      setDynamicFields(dynamicFieldsFromUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  /**
   * まだ追加されていない分類のリスト
   */
  const unusedCategories = AVAILABLE_CATEGORIES.filter(
    (cat) => !dynamicFields.some((field) => field.id === cat.id)
  );

  /**
   * 基本フィールドの入力値変更ハンドラー
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /**
   * 動的フィールドを追加
   */
  const handleAddField = (categoryId: string) => {
    const category = AVAILABLE_CATEGORIES.find((cat) => cat.id === categoryId);
    if (!category) return;

    setDynamicFields([
      ...dynamicFields,
      { id: category.id, label: category.label, value: "" },
    ]);
  };

  /**
   * 動的フィールドを削除
   */
  const handleRemoveField = (fieldId: string) => {
    setDynamicFields(dynamicFields.filter((field) => field.id !== fieldId));
  };

  /**
   * 動的フィールドの値を変更
   */
  const handleDynamicFieldChange = (fieldId: string, value: string) => {
    setDynamicFields(
      dynamicFields.map((field) =>
        field.id === fieldId ? { ...field, value } : field
      )
    );
  };

  /**
   * フォームをリセット
   */
  const handleReset = () => {
    setFormData({
      statsDataId: "0000010101",
      cdCat01: "",
    });
    setDynamicFields([]);
  };

  return {
    formData,
    dynamicFields,
    unusedCategories,
    handleInputChange,
    handleAddField,
    handleRemoveField,
    handleDynamicFieldChange,
    handleReset,
  };
}
