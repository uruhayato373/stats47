"use client";

import { useCallback, useEffect, useState } from "react";

import { apiGet, ApiError } from "@/lib/client/api-client";

/** /api/dashboard/summary を読む (現況レビューのメトリクスと、サイトの是正キューが共用)。 */
export function useDashboardSummary<T>() {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    apiGet<T>("/api/dashboard/summary")
      .then((res) => setData(res))
      .catch((e: unknown) => {
        const message =
          e instanceof ApiError
            ? `取得失敗: ${e.message}。npm run admin を起動してください`
            : e instanceof Error
              ? e.message
              : String(e);
        setError(message);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { data, error, loading, load };
}
