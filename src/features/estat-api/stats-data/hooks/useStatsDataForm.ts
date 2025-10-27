"use client";

/**
 * @fileoverview 統計データフォームのReact Hook Form実装
 */

import { zodResolver } from "@hookform/resolvers/zod";
import { ReadonlyURLSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";

import { AVAILABLE_CATEGORIES, DYNAMIC_FIELD_IDS } from "../constants";
import {
  statsDataFormSchema,
  StatsDataFormValues,
} from "../schemas/stats-data-form.schema";

/**
 * useStatsDataFormの戻り値
 */
export interface UseStatsDataFormReturn {
  // React Hook Formオブジェクト
  form: ReturnType<typeof useForm<StatsDataFormValues>>;
  // アクティブな動的フィールドのリスト
  activeFields: string[];
  // まだ追加されていない分類のリスト
  unusedCategories: typeof AVAILABLE_CATEGORIES;
  // ハンドラー
  handleAddField: (categoryId: string) => void;
  handleRemoveField: (fieldId: string) => void;
  handleReset: () => void;
}

/**
 * 統計データフォームのReact Hook Form実装
 *
 * 機能:
 * - React Hook Formによる統合状態管理
 * - zodスキーマによるバリデーション
 * - URLパラメータからの初期値復元
 * - 動的フィールドの追加/削除管理
 *
 * @param searchParams - URLSearchParams
 * @returns フォーム状態とハンドラー
 */
export function useStatsDataForm(
  searchParams: ReadonlyURLSearchParams
): UseStatsDataFormReturn {
  // URLパラメータから初期値を構築
  const defaultValues: Partial<StatsDataFormValues> = {
    statsDataId: searchParams.get("statsDataId") || "0000010101",
    cdCat01: searchParams.get("cdCat01") || "A1101",
  };

  // 動的フィールドの初期値をURLから復元
  DYNAMIC_FIELD_IDS.forEach((fieldId) => {
    const value = searchParams.get(fieldId);
    if (value) {
      defaultValues[fieldId as keyof StatsDataFormValues] = value;
    }
  });

  // React Hook Form初期化
  const form = useForm<StatsDataFormValues>({
    resolver: zodResolver(statsDataFormSchema),
    defaultValues: defaultValues as StatsDataFormValues,
  });

  // アクティブなフィールドを追跡（undefinedでないフィールド）
  const formValues = form.watch();
  const activeFields = DYNAMIC_FIELD_IDS.filter((fieldId) => {
    const value = formValues[fieldId as keyof StatsDataFormValues];
    return value !== undefined;
  });

  // まだ追加されていない分類のリスト
  const unusedCategories = AVAILABLE_CATEGORIES.filter(
    (cat) => !activeFields.includes(cat.id)
  );

  /**
   * 動的フィールドを追加
   */
  const handleAddField = (categoryId: string) => {
    const fieldId = categoryId as keyof StatsDataFormValues;
    form.setValue(fieldId, "");
  };

  /**
   * 動的フィールドを削除
   */
  const handleRemoveField = (fieldId: string) => {
    const id = fieldId as keyof StatsDataFormValues;
    form.setValue(id, "");
  };

  /**
   * フォームをリセット
   */
  const handleReset = () => {
    form.reset({
      statsDataId: "0000010101",
      cdCat01: "",
    });
  };

  return {
    form,
    activeFields,
    unusedCategories,
    handleAddField,
    handleRemoveField,
    handleReset,
  };
}
