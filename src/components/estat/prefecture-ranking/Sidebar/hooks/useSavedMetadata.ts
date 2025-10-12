"use client";

import { useState, useEffect } from "react";

export interface SavedMetadataItem {
  id: number;
  stats_data_id: string;
  stat_name: string;
  title: string;
  cat01?: string;
  item_name?: string;
  unit?: string;
  updated_at: string;
  created_at: string;
}

export function useSavedMetadata() {
  const [data, setData] = useState<SavedMetadataItem[]>([]);
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
    fetchData();
  }, []);

  return {
    data,
    loading,
    refetch: fetchData,
  };
}
