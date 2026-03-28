"use client";

import { useEffect, useState } from "react";

import type { BlogChartDataFile, BlogChartMeta } from "@stats47/types";

interface UseChartDataResult<T> {
  data: T | null;
  meta: BlogChartMeta | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * dataPath から BlogChartDataFile を fetch する hook
 *
 * @param dataPath - MDX で指定されるパス（例: "my-article/data/chart.json"）
 *                   → /api/blog-data/my-article/data/chart.json に正規化して fetch
 */
export function useChartData<T = unknown>(
  dataPath?: string
): UseChartDataResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [meta, setMeta] = useState<BlogChartMeta | null>(null);
  const [isLoading, setIsLoading] = useState(!!dataPath);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!dataPath) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchData() {
      setIsLoading(true);
      setError(null);

      try {
        const url = `/api/blog-data/${dataPath}`;
        const res = await fetch(url);

        if (!res.ok) {
          throw new Error(`Failed to fetch chart data: ${res.status}`);
        }

        const file: BlogChartDataFile<T> = await res.json();

        if (!cancelled) {
          setData(file.data);
          setMeta(file.meta);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Unknown error");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [dataPath]);

  return { data, meta, isLoading, error };
}
