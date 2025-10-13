"use client";

import { useState, useEffect } from "react";
import { SavedMetadataItem } from "@/types/models";

export function useSavedMetadata(initialData?: SavedMetadataItem[]) {
  const [data, setData] = useState<SavedMetadataItem[]>(initialData || []);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/estat/metainfo/stats-list?limit=100");
      if (response.ok) {
        const result = await response.json();
        setData(result.items || []);
      } else {
        console.error("Failed to fetch stats list:", response.status);
        setData([]);
      }
    } catch (error) {
      console.error("Failed to fetch stats list:", error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialData && initialData.length > 0) {
      return; // 初期データがある場合はfetchしない
    }
    fetchData();
  }, [initialData]);

  return {
    data,
    loading,
    refetch: fetchData,
  };
}
