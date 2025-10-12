import { useState } from "react";
import { RankingItem } from "@/lib/ranking/get-ranking-items";

export function useRankingItemsEditor(subcategoryId: string) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateRankingItem = async (id: number, data: Partial<RankingItem>) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/ranking-items/item/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = (await response.json()) as { error?: string };
        throw new Error(errorData.error || "更新に失敗しました");
      }

      return (await response.json()) as RankingItem;
    } catch (err) {
      setError(err instanceof Error ? err.message : "更新に失敗しました");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const createRankingItem = async (data: Omit<RankingItem, "id">) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ranking-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, subcategoryId }),
      });

      if (!response.ok) {
        const errorData = (await response.json()) as { error?: string };
        throw new Error(errorData.error || "作成に失敗しました");
      }

      return (await response.json()) as RankingItem;
    } catch (err) {
      setError(err instanceof Error ? err.message : "作成に失敗しました");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteRankingItem = async (id: number) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/ranking-items/item/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = (await response.json()) as { error?: string };
        throw new Error(errorData.error || "削除に失敗しました");
      }

      return (await response.json()) as { success: boolean };
    } catch (err) {
      setError(err instanceof Error ? err.message : "削除に失敗しました");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const reorderRankingItems = async (
    reorderedItems: Array<{ id: number; displayOrder: number }>
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ranking-items/reorder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subcategoryId, reorderedItems }),
      });

      if (!response.ok) {
        const errorData = (await response.json()) as { error?: string };
        throw new Error(errorData.error || "並び替えに失敗しました");
      }

      return (await response.json()) as { success: boolean };
    } catch (err) {
      setError(err instanceof Error ? err.message : "並び替えに失敗しました");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isEditMode,
    setIsEditMode,
    isLoading,
    error,
    updateRankingItem,
    createRankingItem,
    deleteRankingItem,
    reorderRankingItems,
  };
}
