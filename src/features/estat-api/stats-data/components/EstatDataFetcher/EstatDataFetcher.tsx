"use client";

/**
 * @fileoverview e-Stat統計データ取得フォームコンポーネント
 *
 * 責務:
 * - フォームUIの描画
 * - フォーム送信時のURL遷移
 */

import { useRouter, useSearchParams } from "next/navigation";

import { RotateCcw, Search, X } from "lucide-react";

import { Button } from "@/components/atoms/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/atoms/ui/card";
import { Input } from "@/components/atoms/ui/input";
import { Label } from "@/components/atoms/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/atoms/ui/select";

import { useStatsDataForm } from "../../hooks";
import { buildStatsDataUrl } from "../../utils";

/**
 * EstatDataFetcher - e-Stat統計データ取得フォーム
 *
 * URLパラメータでデータ取得パラメータを指定し、
 * フォーム送信時にURL遷移します。
 */
export default function EstatDataFetcher() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const {
    formData,
    dynamicFields,
    unusedCategories,
    handleInputChange,
    handleAddField,
    handleRemoveField,
    handleDynamicFieldChange,
    handleReset,
  } = useStatsDataForm(searchParams);

  /**
   * フォーム送信ハンドラー
   * URLを構築してページ遷移
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const url = buildStatsDataUrl(formData, dynamicFields);
    router.push(url);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
              <Search className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            データ取得パラメータ
          </CardTitle>
          <CardDescription>
            統計表IDと分類条件を指定してデータを取得します
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 基本設定（固定フィールド） */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="statsDataId">統計表ID *</Label>
                <Input
                  id="statsDataId"
                  name="statsDataId"
                  placeholder="例: 0003412312"
                  value={formData.statsDataId}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cdCat01">分類01</Label>
                <Input
                  id="cdCat01"
                  name="cdCat01"
                  placeholder="カンマ区切り"
                  value={formData.cdCat01}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            {/* 動的に追加されたフィールド */}
            {dynamicFields.length > 0 && (
              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h5 className="text-sm font-medium text-gray-700 dark:text-neutral-300 flex items-center gap-2">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                    追加された分類パラメータ
                  </h5>
                  <span className="text-xs text-gray-500 dark:text-neutral-400">
                    {dynamicFields.length} 個追加済み
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {dynamicFields.map((field) => (
                    <div key={field.id} className="relative group">
                      <div className="space-y-2">
                        <Label htmlFor={field.id}>{field.label}</Label>
                        <Input
                          id={field.id}
                          name={field.id}
                          placeholder="カンマ区切り"
                          value={field.value}
                          onChange={(e) =>
                            handleDynamicFieldChange(field.id, e.target.value)
                          }
                        />
                        <p className="text-sm text-muted-foreground">
                          {field.id === "cdTime"
                            ? "例: 2020,2021"
                            : "例: A1101,A1102"}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveField(field.id)}
                        className="absolute top-0 right-0 p-1.5 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white dark:bg-neutral-800 rounded-full shadow-sm border border-gray-200 dark:border-neutral-700"
                        title={`${field.label}を削除`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
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
            {unusedCategories.length === 0 && dynamicFields.length > 0 && (
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
              <Button
                type="submit"
                disabled={!formData.statsDataId}
                className="flex-1"
              >
                <Search className="w-4 h-4 mr-2" />
                データを取得
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                リセット
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
