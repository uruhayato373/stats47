/**
 * フィルターパネルコンポーネント
 * 
 * カテゴリ、タグ、年度でフィルタリングするUIコンポーネント
 */

"use client";

import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/atoms/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/atoms/ui/select";
import { Label } from "@/components/atoms/ui/label";

import type { Category } from "@/features/category/types/category.types";

/**
 * フィルターパネルのプロパティ
 */
export interface FilterPanelProps {
  /** カテゴリ一覧 */
  categories?: Category[];
  /** 利用可能なタグ一覧 */
  availableTags?: string[];
  /** 利用可能な年度一覧 */
  availableYears?: string[];
  /** CSSクラス名 */
  className?: string;
}

/**
 * フィルターパネルコンポーネント
 * 
 * カテゴリ、タグ、年度でフィルタリングするUIを提供
 */
export function FilterPanel({
  categories = [],
  availableTags = [],
  availableYears = [],
  className,
}: FilterPanelProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 現在のフィルター値を取得
  const currentCategory = searchParams.get("category") || "";
  const currentTag = searchParams.get("tag") || "";
  const currentYear = searchParams.get("year") || "";

  // フィルター変更ハンドラー
  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }

    // ページを1にリセット
    params.delete("page");

    router.push(`/blog?${params.toString()}`);
  };

  // フィルターリセット
  const resetFilters = () => {
    router.push("/blog");
  };

  // フィルターが適用されているかチェック
  const hasActiveFilters =
    currentCategory || currentTag || currentYear;

  return (
    <div className={`space-y-4 rounded-lg border p-4 ${className || ""}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">フィルター</h3>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={resetFilters}
          >
            リセット
          </Button>
        )}
      </div>

      {/* カテゴリフィルター */}
      {categories.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="category-filter">カテゴリ</Label>
          <Select
            value={currentCategory}
            onValueChange={(value) => updateFilter("category", value)}
          >
            <SelectTrigger id="category-filter">
              <SelectValue placeholder="すべてのカテゴリ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">すべてのカテゴリ</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.categoryKey} value={category.categoryKey}>
                  {category.categoryName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* タグフィルター */}
      {availableTags.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="tag-filter">タグ</Label>
          <Select
            value={currentTag}
            onValueChange={(value) => updateFilter("tag", value)}
          >
            <SelectTrigger id="tag-filter">
              <SelectValue placeholder="すべてのタグ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">すべてのタグ</SelectItem>
              {availableTags.map((tag) => (
                <SelectItem key={tag} value={tag}>
                  {tag}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* 年度フィルター */}
      {availableYears.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="year-filter">年度</Label>
          <Select
            value={currentYear}
            onValueChange={(value) => updateFilter("year", value)}
          >
            <SelectTrigger id="year-filter">
              <SelectValue placeholder="すべての年度" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">すべての年度</SelectItem>
              {availableYears.map((year) => (
                <SelectItem key={year} value={year}>
                  {year}年
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}

