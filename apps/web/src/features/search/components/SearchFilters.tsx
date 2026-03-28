"use client";

import { Badge } from "@stats47/components/atoms/ui/badge";
import { Button } from "@stats47/components/atoms/ui/button";
import { Checkbox } from "@stats47/components/atoms/ui/checkbox";
import { Label } from "@stats47/components/atoms/ui/label";
import { RadioGroup, RadioGroupItem } from "@stats47/components/atoms/ui/radio-group";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@stats47/components/atoms/ui/select";
import { Separator } from "@stats47/components/atoms/ui/separator";
import { X } from "lucide-react";

import type {
    ContentType,
    SearchCategoryMeta,
    SearchTagMeta,
} from "../types";

interface SearchFiltersProps {
    selectedType: ContentType | "all";
    selectedCategory?: string;
    selectedTags: string[];
    selectedYear?: string;
    selectedMonth?: string;
    onTypeChange: (type: ContentType | "all") => void;
    onCategoryChange: (category: string | undefined) => void;
    onTagToggle: (tag: string) => void;
    onYearChange: (year: string | undefined) => void;
    onMonthChange: (month: string | undefined) => void;
    categories: SearchCategoryMeta[];
    blogTags: SearchTagMeta[];
    blogYears: string[];
}

/**
 * コンテンツタイプの表示名
 */
const contentTypeLabels: Record<ContentType | "all", string> = {
    all: "すべて",
    blog: "ブログ記事",
    ranking: "ランキング",
};

const months = Array.from({ length: 12 }, (_, i) => String(i + 1));

/**
 * 検索フィルターコンポーネント
 */
export function SearchFilters({
    selectedType,
    selectedCategory,
    selectedTags,
    selectedYear,
    selectedMonth,
    onTypeChange,
    onCategoryChange,
    onTagToggle,
    onYearChange,
    onMonthChange,
    categories,
    blogTags,
    blogYears,
}: SearchFiltersProps) {
    const hasBlogFilters = selectedTags.length > 0 || !!selectedYear;
    const handleClearBlogFilters = () => {
        for (const tag of selectedTags) {
            onTagToggle(tag);
        }
        onYearChange(undefined);
        onMonthChange(undefined);
    };

    return (
        <div className="space-y-6">
            {/* コンテンツタイプフィルター */}
            <div>
                <h3 className="text-sm font-semibold mb-3">コンテンツタイプ</h3>
                <RadioGroup
                    value={selectedType}
                    onValueChange={(value) => onTypeChange(value as ContentType | "all")}
                    className="space-y-2"
                >
                    {(Object.entries(contentTypeLabels) as [ContentType | "all", string][]).map(
                        ([value, label]) => (
                            <div key={value} className="flex items-center space-x-2">
                                <RadioGroupItem value={value} id={`type-${value}`} />
                                <Label htmlFor={`type-${value}`} className="cursor-pointer">
                                    {label}
                                </Label>
                            </div>
                        )
                    )}
                </RadioGroup>
            </div>

            <Separator />

            {selectedType === "blog" ? (
                <>
                    {/* ブログ用: フィルタークリア */}
                    {hasBlogFilters && (
                        <>
                            <Button variant="outline" size="sm" onClick={handleClearBlogFilters} className="w-full">
                                <X className="mr-1 h-3 w-3" />
                                フィルターをクリア
                            </Button>
                            <Separator />
                        </>
                    )}

                    {/* ブログ用: タグフィルター */}
                    {blogTags.length > 0 && (
                        <div>
                            <h3 className="text-sm font-semibold mb-3">タグ</h3>
                            <div className="max-h-64 space-y-2 overflow-y-auto">
                                {blogTags.map(({ tag, count }) => (
                                    <div key={tag} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`tag-${tag}`}
                                            checked={selectedTags.includes(tag)}
                                            onCheckedChange={() => onTagToggle(tag)}
                                        />
                                        <Label htmlFor={`tag-${tag}`} className="cursor-pointer text-sm">
                                            {tag}
                                        </Label>
                                        <Badge variant="secondary" size="sm" className="ml-auto">
                                            {count}
                                        </Badge>
                                    </div>
                                ))}
                            </div>

                            {/* 選択中のタグ */}
                            {selectedTags.length > 0 && (
                                <div className="mt-3">
                                    <p className="mb-2 text-xs text-muted-foreground">選択中のタグ</p>
                                    <div className="flex flex-wrap gap-1">
                                        {selectedTags.map((tag) => (
                                            <Badge
                                                key={tag}
                                                variant="default"
                                                className="cursor-pointer"
                                                onClick={() => onTagToggle(tag)}
                                            >
                                                {tag} <X className="ml-1 h-3 w-3" />
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <Separator />

                    {/* ブログ用: 期間フィルター */}
                    <div>
                        <h3 className="text-sm font-semibold mb-3">期間</h3>
                        <div className="space-y-2">
                            <Select
                                value={selectedYear ?? "all"}
                                onValueChange={(v) => onYearChange(v === "all" ? undefined : v)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="年を選択" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">すべての年</SelectItem>
                                    {blogYears.map((y) => (
                                        <SelectItem key={y} value={y}>
                                            {y}年
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {selectedYear && (
                                <Select
                                    value={selectedMonth ?? "all"}
                                    onValueChange={(v) => onMonthChange(v === "all" ? undefined : v)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="月を選択" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">すべての月</SelectItem>
                                        {months.map((m) => (
                                            <SelectItem key={m} value={m}>
                                                {m}月
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>
                    </div>
                </>
            ) : (
                <>
                    {/* ランキング/全体用: カテゴリフィルター */}
                    <div>
                        <h3 className="text-sm font-semibold mb-3">カテゴリ</h3>
                        <Select
                            value={selectedCategory ?? "all"}
                            onValueChange={(value) => onCategoryChange(value === "all" ? undefined : value)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="カテゴリを選択" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">すべてのカテゴリ</SelectItem>
                                {categories.map((category) => (
                                    <SelectItem
                                        key={category.categoryKey}
                                        value={category.categoryKey}
                                    >
                                        {category.categoryName}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </>
            )}
        </div>
    );
}
