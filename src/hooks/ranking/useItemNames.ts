"use client";

import { useState } from "react";

export function useItemNames() {
  const [itemNames, setItemNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchItemNames = async (statsDataId: string) => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/estat/metainfo/items?statsDataId=${statsDataId}`
      );
      if (response.ok) {
        const data = await response.json();
        setItemNames(data.itemNames || []);
      } else {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Unknown error" }));
        console.error(
          "Failed to fetch item names:",
          response.status,
          errorData
        );
        setItemNames([]);
      }
    } catch (error) {
      console.error("Failed to fetch item names:", error);
      setItemNames([]);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setItemNames([]);
  };

  return {
    itemNames,
    loading,
    fetchItemNames,
    reset,
  };
}
