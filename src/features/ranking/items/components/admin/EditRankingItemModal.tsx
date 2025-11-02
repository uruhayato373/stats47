"use client";

import { useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/atoms/ui/dialog";

import { EditRankingItemForm, type EditRankingItemFormValues } from "./forms/EditRankingItemForm";

interface EditRankingItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  rankingItem: {
    rankingKey: string;
    areaType: "prefecture" | "city" | "national";
    label: string;
    name: string;
    annotation?: string | null;
    unit: string;
    mapColorScheme: string;
    mapDivergingMidpoint: string;
    rankingDirection: "asc" | "desc";
    conversionFactor: number;
    decimalPlaces: number;
    isActive: boolean;
  };
  onUpdate: (
    rankingKey: string,
    areaType: "prefecture" | "city" | "national",
    values: EditRankingItemFormValues
  ) => Promise<boolean>;
  onSuccess?: () => void;
}

export function EditRankingItemModal({
  isOpen,
  onClose,
  rankingItem,
  onUpdate,
  onSuccess,
}: EditRankingItemModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (values: EditRankingItemFormValues) => {
    setIsSubmitting(true);
    setError(null);
    try {
      console.log("フォーム送信値:", values);
      const success = await onUpdate(rankingItem.rankingKey, rankingItem.areaType, values);
      if (success) {
        onSuccess?.();
        onClose();
      } else {
        setError("更新に失敗しました。データベースの更新ができませんでした。");
      }
    } catch (err) {
      console.error("更新エラー:", err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : "予期しないエラーが発生しました";
      setError(`更新に失敗しました: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>ランキング項目を編集</DialogTitle>
          <DialogDescription>
            {rankingItem.label}の設定を編集します
          </DialogDescription>
        </DialogHeader>
        {error && (
          <div className="mb-4 p-3 text-sm text-destructive bg-destructive/10 rounded-md">
            {error}
          </div>
        )}
        <EditRankingItemForm
          rankingItem={{
            ...rankingItem,
            annotation: rankingItem.annotation ?? undefined,
            mapDivergingMidpoint: rankingItem.mapDivergingMidpoint,
          }}
          onSubmit={handleSubmit}
          onCancel={onClose}
          isSubmitting={isSubmitting}
        />
      </DialogContent>
    </Dialog>
  );
}

