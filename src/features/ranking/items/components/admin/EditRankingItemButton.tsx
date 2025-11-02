"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";

import { Button } from "@/components/atoms/ui/button";
import { EditRankingItemModal } from "./EditRankingItemModal";
import { updateRankingItem } from "@/features/ranking/items/actions/updateRankingItem";
import type { RankingItem } from "@/features/ranking/items/types";

interface EditRankingItemButtonProps {
  isAdmin: boolean;
  rankingItem: RankingItem;
}

export function EditRankingItemButton({
  isAdmin,
  rankingItem,
}: EditRankingItemButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  if (!isAdmin) {
    return null;
  }

  const handleUpdate = async (
    rankingKey: string,
    areaType: "prefecture" | "city" | "national",
    values: {
      label: string;
      name: string;
      annotation?: string;
      unit: string;
      mapColorScheme: string;
      mapDivergingMidpoint: string;
      rankingDirection: "asc" | "desc";
      conversionFactor: number;
      decimalPlaces: number;
      isActive: boolean;
    }
  ): Promise<boolean> => {
    try {
      console.log("更新リクエスト:", {
        rankingKey,
        areaType,
        updates: {
          label: values.label,
          name: values.name,
          annotation: values.annotation,
          unit: values.unit,
          mapColorScheme: values.mapColorScheme,
          mapDivergingMidpoint: values.mapDivergingMidpoint,
          rankingDirection: values.rankingDirection,
          conversionFactor: values.conversionFactor,
          decimalPlaces: values.decimalPlaces,
          isActive: values.isActive,
        },
      });

      const success = await updateRankingItem({
        rankingKey,
        areaType,
        updates: {
          label: values.label,
          name: values.name,
          annotation: values.annotation,
          unit: values.unit,
          mapColorScheme: values.mapColorScheme,
          mapDivergingMidpoint: values.mapDivergingMidpoint,
          rankingDirection: values.rankingDirection,
          conversionFactor: values.conversionFactor,
          decimalPlaces: values.decimalPlaces,
          isActive: values.isActive,
        },
      });

      if (success) {
        router.refresh();
        return true;
      }
      console.error("更新失敗: success=false");
      return false;
    } catch (error) {
      console.error("更新エラー:", error);
      if (error instanceof Error) {
        console.error("エラーメッセージ:", error.message);
        console.error("エラースタック:", error.stack);
      }
      throw error; // エラーを再スローしてModalでキャッチできるようにする
    }
  };

  const handleSuccess = () => {
    router.refresh();
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsModalOpen(true)}
        className="gap-2"
      >
        <Pencil className="h-4 w-4" />
        編集
      </Button>
      <EditRankingItemModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        rankingItem={{
          ...rankingItem,
          annotation: rankingItem.annotation ?? null,
          mapDivergingMidpoint:
            typeof rankingItem.mapDivergingMidpoint === "string"
              ? rankingItem.mapDivergingMidpoint
              : typeof rankingItem.mapDivergingMidpoint === "number"
                ? String(rankingItem.mapDivergingMidpoint)
                : "zero",
        }}
        onUpdate={handleUpdate}
        onSuccess={handleSuccess}
      />
    </>
  );
}

