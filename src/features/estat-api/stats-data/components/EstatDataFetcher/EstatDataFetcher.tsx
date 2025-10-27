"use client";

/**
 * @fileoverview e-Stat統計データ取得フォームコンポーネント（React Hook Form版）
 *
 * 責務:
 * - React Hook Formによるフォーム管理
 * - バリデーションとエラーハンドリング
 * - 動的フィールドの追加/削除
 * - フォーム送信時のURL遷移
 */

import { useRouter, useSearchParams } from "next/navigation";

import { RotateCcw, Search, X } from "lucide-react";

import { Button } from "@/components/atoms/ui/button";
import {
  Card,
  CardContent,
} from "@/components/atoms/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/atoms/ui/form";
import { Input } from "@/components/atoms/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/atoms/ui/select";

import { AVAILABLE_CATEGORIES } from "../../constants";
import { useStatsDataForm } from "../../hooks";
import { buildStatsDataUrl } from "../../utils";

/**
 * EstatDataFetcher - e-Stat統計データ取得フォーム
 *
 * React Hook Formにより統一された状態管理とバリデーションを提供します。
 */
export default function EstatDataFetcher() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { form, activeFields, unusedCategories, handleAddField, handleRemoveField, handleReset } =
    useStatsDataForm(searchParams);

  /**
   * フォーム送信ハンドラー
   */
  const onSubmit = (values: Parameters<typeof buildStatsDataUrl>[0]) => {
    const url = buildStatsDataUrl(values);
    router.push(url);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* 基本フィールド */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <FormField
                  control={form.control}
                  name="statsDataId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>統計表ID</FormLabel>
                      <FormControl>
                        <Input placeholder="例: 0003412312" {...field} />
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
                        <Input placeholder="カンマ区切り" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* 動的に追加されたフィールド */}
              {activeFields.length > 0 && (
                <div className="mt-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h5 className="text-sm font-medium text-gray-700 dark:text-neutral-300 flex items-center gap-2">
                      <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                      追加された分類パラメータ
                    </h5>
                    <span className="text-xs text-gray-500 dark:text-neutral-400">
                      {activeFields.length} 個追加済み
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {activeFields.map((fieldId) => {
                      const category = AVAILABLE_CATEGORIES.find((cat) => cat.id === fieldId) ||
                        { id: fieldId, label: fieldId } as { id: string; label: string };

                      return (
                        <div key={fieldId} className="relative group">
                          <FormField
                            control={form.control}
                            name={fieldId as "statsDataId" | "cdCat01" | "cdTime" | "cdArea" | "cdCat02" | "cdCat03" | "cdCat04" | "cdCat05" | "cdCat06" | "cdCat07" | "cdCat08" | "cdCat09" | "cdCat10" | "cdCat11" | "cdCat12" | "cdCat13" | "cdCat14" | "cdCat15"}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>{category.label}</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder={fieldId === "cdTime" ? "例: 2020,2021" : "例: A1101,A1102"}
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveField(fieldId)}
                            className="absolute top-0 right-0 p-1.5 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white dark:bg-neutral-800 rounded-full shadow-sm border border-gray-200 dark:border-neutral-700"
                            title={`${category.label}を削除`}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* フィールド追加セクション */}
              {unusedCategories.length > 0 && (
                <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-neutral-800 rounded-lg border border-gray-200 dark:border-neutral-700">
                  <span className="text-sm font-medium text-gray-700 dark:text-neutral-300 whitespace-nowrap">
                    パラメータ追加:
                  </span>
                  <Select
                    onValueChange={(value) => {
                      if (value) {
                        handleAddField(value);
                      }
                    }}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="選択..." />
                    </SelectTrigger>
                    <SelectContent>
                      {unusedCategories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* 追加可能な分類がなくなった場合のメッセージ */}
              {unusedCategories.length === 0 && activeFields.length > 0 && (
                <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-green-700 dark:text-green-300">
                      全ての分類パラメータが追加されました
                    </span>
                  </div>
                </div>
              )}

              {/* ボタン */}
              <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t">
                <Button type="submit" className="flex-1">
                  <Search className="w-4 h-4 mr-2" />
                  データを取得
                </Button>

                <Button type="button" variant="outline" onClick={handleReset}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  リセット
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
