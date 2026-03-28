"use client";

import { Suspense, useCallback, useEffect, useState } from "react";

import { useRouter, useSearchParams } from "next/navigation";

import { Skeleton } from "@stats47/components/atoms/ui/skeleton";

import { trackSearch } from "@/lib/analytics/events";
import { logger } from "@/lib/logger";

import { SearchProvider, useSearch } from "../context/SearchContext";

import { SearchFilters } from "./SearchFilters";
import { SearchInput } from "./SearchInput";
import { SearchResults } from "./SearchResults";

import type {
  ContentType,
  SearchIndexMeta,
  SearchResult,
} from "../types";

interface SearchPageClientProps {
  initialResults: SearchResult[];
  initialQuery: string;
  initialType?: ContentType | "all";
  initialCategory?: string;
  initialTags?: string[];
  initialYear?: string;
  initialMonth?: string;
  filterMeta: SearchIndexMeta;
}

function SearchPageClientInner({
  initialResults,
  initialQuery,
  initialType,
  initialCategory,
  initialTags,
  initialYear,
  initialMonth,
  filterMeta,
}: SearchPageClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { search, isLoading: isInitializing } = useSearch();

  const [query, setQuery] = useState(initialQuery);
  const [selectedType, setSelectedType] = useState<ContentType | "all">(
    initialType ?? "all"
  );
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(
    initialCategory
  );
  const [selectedTags, setSelectedTags] = useState<string[]>(
    initialTags ?? []
  );
  const [selectedYear, setSelectedYear] = useState<string | undefined>(
    initialYear
  );
  const [selectedMonth, setSelectedMonth] = useState<string | undefined>(
    initialMonth
  );
  const [results, setResults] = useState<SearchResult[]>(initialResults);
  const [isSearching, setIsSearching] = useState(false);
  const [hasClientSearched, setHasClientSearched] = useState(false);

  // URL sync helper
  const buildUrl = useCallback(
    (
      q: string,
      type: ContentType | "all",
      category?: string,
      tags?: string[],
      year?: string,
      month?: string
    ) => {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (type !== "all") params.set("type", type);
      if (type === "blog") {
        if (tags && tags.length > 0) params.set("tags", tags.join(","));
        if (year) params.set("year", year);
        if (year && month) params.set("month", month);
      } else {
        if (category) params.set("category", category);
      }
      return `/search?${params.toString()}`;
    },
    []
  );

  const handleSearch = useCallback(
    async (newQuery: string) => {
      setQuery(newQuery);
      setIsSearching(true);
      setHasClientSearched(true);

      router.replace(
        buildUrl(
          newQuery,
          selectedType,
          selectedCategory,
          selectedTags,
          selectedYear,
          selectedMonth
        ),
        { scroll: false }
      );

      try {
        const response = await search(newQuery, {
          type: selectedType === "all" ? undefined : selectedType,
          category: selectedType !== "blog" ? selectedCategory : undefined,
          tags: selectedType === "blog" ? selectedTags : undefined,
          year: selectedType === "blog" ? selectedYear : undefined,
          month: selectedType === "blog" ? selectedMonth : undefined,
        });
        setResults(response.results);
        if (newQuery.trim()) {
          trackSearch({ searchTerm: newQuery.trim(), resultsCount: response.results.length });
        }
      } catch (error) {
        logger.error("Search failed:", error instanceof Error ? error.message : String(error));
      } finally {
        setIsSearching(false);
      }
    },
    [
      search,
      selectedType,
      selectedCategory,
      selectedTags,
      selectedYear,
      selectedMonth,
      router,
      buildUrl,
    ]
  );

  // タイプ変更時に関連しないフィルタをクリア
  const handleTypeChange = useCallback(
    (type: ContentType | "all") => {
      setSelectedType(type);
      if (type === "blog") {
        // ランキング系フィルタをクリア
        setSelectedCategory(undefined);
      } else {
        // ブログ系フィルタをクリア
        setSelectedTags([]);
        setSelectedYear(undefined);
        setSelectedMonth(undefined);
      }
    },
    []
  );

  const handleTagToggle = useCallback((tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }, []);

  const handleYearChange = useCallback((year: string | undefined) => {
    setSelectedYear(year);
    if (!year) setSelectedMonth(undefined);
  }, []);

  const handleMonthChange = useCallback((month: string | undefined) => {
    setSelectedMonth(month);
  }, []);

  // フィルタ変更時に再検索（ユーザー操作後のみ）
  useEffect(() => {
    if (hasClientSearched && query && !isInitializing) {
      handleSearch(query);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    selectedType,
    selectedCategory,
    selectedTags,
    selectedYear,
    selectedMonth,
  ]);

  // URL パラメータ変更時の再検索（ブラウザ戻る/進む対応）
  useEffect(() => {
    const queryParam = searchParams.get("q");
    if (queryParam && queryParam !== query && !isInitializing) {
      handleSearch(queryParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, isInitializing]);

  if (isInitializing && !initialResults.length) {
    return <SearchPageSkeleton />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-lg font-bold mb-8">検索</h1>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_240px] gap-8">
        {/* メインコンテンツ: 検索と結果 */}
        <div>
          <SearchInput
            onSearch={handleSearch}
            placeholder="ブログ記事、ダッシュボード、ランキングを検索..."
            defaultValue={query}
          />

          <div className="mt-8">
            {isSearching ? (
              <div className="space-y-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : (
              <SearchResults results={results} query={query} />
            )}
          </div>
        </div>

        {/* 右サイドバー: フィルター */}
        <div className="md:order-last order-first">
          <SearchFilters
            selectedType={selectedType}
            selectedCategory={selectedCategory}
            selectedTags={selectedTags}
            selectedYear={selectedYear}
            selectedMonth={selectedMonth}
            onTypeChange={handleTypeChange}
            onCategoryChange={setSelectedCategory}
            onTagToggle={handleTagToggle}
            onYearChange={handleYearChange}
            onMonthChange={handleMonthChange}
            categories={filterMeta.categories}
            blogTags={filterMeta.blogTags}
            blogYears={filterMeta.blogYears}
          />
        </div>
      </div>
    </div>
  );
}

function SearchPageSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Skeleton className="h-10 w-full mb-4" />
      <Skeleton className="h-20 w-full mb-4" />
      <Skeleton className="h-40 w-full" />
    </div>
  );
}

export function SearchPageClient(props: SearchPageClientProps) {
  return (
    <SearchProvider>
      <Suspense fallback={<SearchPageSkeleton />}>
        <SearchPageClientInner {...props} />
      </Suspense>
    </SearchProvider>
  );
}
