"use client";

import { memo } from "react";

import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/atoms/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/atoms/ui/form";
import { Input } from "@/components/atoms/ui/input";

import { AVAILABLE_CATEGORIES } from "../../constants";
import { useStatsDataForm } from "../../hooks";
import { StatsDataFormValues } from "../../schemas/stats-data-form.schema";
import { buildStatsDataUrl } from "../../utils/url-builder";

/**
 * EstatStatsDataFetcher - e-Stat統計データ取得フォームコンポーネント
 *
 * 機能:
 * - 統計表IDと分類パラメータの入力フォーム
 * - フォーム送信時のバリデーション
 * - URL更新によるデータ取得
 * - 動的フィールドの追加/削除
 *
 * レイアウト:
 * - レスポンシブデザイン
 * - 必須フィールド（統計表ID、分類01）+ 動的フィールド
 */
function EstatStatsDataFetcher() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // ===== カスタムフック =====
  const { form, activeFields, unusedCategories, handleAddField, handleRemoveField } =
    useStatsDataForm(searchParams);

  // ===== イベントハンドラー =====

  /**
   * フォーム送信時の処理
   * @param values - フォームの値
   */
  const handleSubmit = (values: StatsDataFormValues) => {
    // URLを構築してデータ取得をトリガー
    const url = buildStatsDataUrl(values);
    router.push(url);
  };

  // ===== レンダリング =====

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        {/* 必須フィールド */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="statsDataId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>統計表ID</FormLabel>
                <FormControl>
                  <Input
                    placeholder="0000010101"
                    {...field}
                    className="h-8"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="cdCat01"
            render={({ field }) => (
              <FormItem>
                <FormLabel>分類01</FormLabel>
                <FormControl>
                  <Input placeholder="A1101" {...field} className="h-8" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* 動的フィールド */}
        {activeFields.map((fieldId) => {
          const category = AVAILABLE_CATEGORIES.find((cat) => cat.id === fieldId);
          return (
            <FormField
              key={fieldId}
              control={form.control}
              name={fieldId as keyof StatsDataFormValues}
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <FormLabel>{category?.label || fieldId}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={category?.label || fieldId}
                          {...field}
                          className="h-8"
                        />
                      </FormControl>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveField(fieldId)}
                    >
                      削除
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          );
        })}

        {/* フィールド追加ボタン */}
        {unusedCategories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {unusedCategories.map((category) => (
              <Button
                key={category.id}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleAddField(category.id)}
              >
                + {category.label}
              </Button>
            ))}
          </div>
        )}

        {/* 送信ボタン */}
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={!form.formState.isValid}
            size="sm"
          >
            取得
          </Button>
        </div>
      </form>
    </Form>
  );
}

EstatStatsDataFetcher.displayName = "EstatStatsDataFetcher";

export default memo(EstatStatsDataFetcher);

