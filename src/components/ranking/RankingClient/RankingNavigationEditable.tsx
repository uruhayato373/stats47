"use client";

import React, { useState } from "react";
import Link from "next/link";
import { RankingOption } from "./types";
import { RankingItem } from "@/lib/ranking/get-ranking-items";
import { useRankingItemsEditor } from "@/hooks/useRankingItemsEditor";
import { Modal } from "@/components/common/Modal/Modal";
import { RankingItemForm } from "./RankingItemForm";
import { DraggableRankingList } from "./DraggableRankingList";

export interface RankingNavigationEditableProps<T extends string> {
  categoryId: string;
  subcategoryId: string;
  activeRankingId: T;
  tabOptions: RankingOption<T>[];
  rankingItems: RankingItem[]; // 完全な項目情報
  title?: string;
  editable?: boolean; // 編集可能かどうか
  onUpdate?: () => void; // 更新後のコールバック
}

export const RankingNavigationEditable = React.memo(
  function RankingNavigationEditable<T extends string>({
    categoryId,
    subcategoryId,
    activeRankingId,
    tabOptions,
    rankingItems,
    title = "統計項目",
    editable = false,
    onUpdate,
  }: RankingNavigationEditableProps<T>) {
    const {
      isEditMode,
      setIsEditMode,
      isLoading,
      error,
      updateRankingItem,
      createRankingItem,
      deleteRankingItem,
      reorderRankingItems,
    } = useRankingItemsEditor(subcategoryId);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<RankingItem | undefined>();
    const [currentRankingItems, setCurrentRankingItems] =
      useState<RankingItem[]>(rankingItems);

    // Update currentRankingItems when rankingItems prop changes
    React.useEffect(() => {
      setCurrentRankingItems(rankingItems);
    }, [rankingItems]);

    const handleEdit = (item: RankingItem) => {
      setEditingItem(item);
      setIsModalOpen(true);
    };

    const handleAdd = () => {
      setEditingItem(undefined);
      setIsModalOpen(true);
    };

    const handleFormSubmit = async (data: Partial<RankingItem>) => {
      try {
        if (editingItem) {
          await updateRankingItem(editingItem.id, data);
        } else {
          await createRankingItem(data as Omit<RankingItem, "id">);
        }
        setIsModalOpen(false);
        setEditingItem(undefined);
        onUpdate?.(); // 親コンポーネントに更新を通知
      } catch (error) {
        console.error("Submit error:", error);
      }
    };

    const handleDelete = async (item: RankingItem) => {
      if (!confirm(`「${item.label}」を削除しますか？`)) return;

      try {
        await deleteRankingItem(item.id);
        onUpdate?.();
      } catch (error) {
        console.error("Delete error:", error);
      }
    };

    const handleReorder = async (reorderedItems: RankingItem[]) => {
      setCurrentRankingItems(reorderedItems); // Optimistic update
      try {
        await reorderRankingItems(
          reorderedItems.map((item) => ({
            id: item.id,
            displayOrder: item.displayOrder,
          }))
        );
        onUpdate?.();
      } catch (error) {
        console.error("Reorder error:", error);
        // Revert if API call fails
        setCurrentRankingItems(rankingItems);
      }
    };

    return (
      <div className="lg:w-60 flex-shrink-0">
        <div className="lg:border-l border-gray-200 dark:border-gray-700">
          <div className="bg-white dark:bg-gray-800 p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {title}
                {isEditMode && (
                  <span className="text-sm ml-2">(編集モード)</span>
                )}
              </h3>
              {editable && (
                <button
                  onClick={() => setIsEditMode(!isEditMode)}
                  className="text-sm text-indigo-600 hover:text-indigo-700"
                >
                  {isEditMode ? "完了" : "編集"}
                </button>
              )}
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                {error}
              </div>
            )}

            <nav className="space-y-2" aria-label="統計項目">
              {isEditMode ? (
                // 編集モード
                <>
                  <DraggableRankingList
                    items={currentRankingItems.filter((item) => item.isActive)}
                    onReorder={handleReorder}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    isLoading={isLoading}
                  />
                  <button
                    onClick={handleAdd}
                    className="w-full p-2 border-2 border-dashed border-gray-300 rounded-md text-gray-600 hover:border-gray-400 hover:text-gray-700"
                    disabled={isLoading}
                  >
                    + 新規追加
                  </button>
                </>
              ) : (
                // 通常モード
                <>
                  {tabOptions.map((option) => {
                    const href = `/${categoryId}/${subcategoryId}/ranking/${option.key}`;
                    const isActive = activeRankingId === option.key;

                    return (
                      <Link
                        key={option.key}
                        href={href}
                        className={`block w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                          isActive
                            ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400"
                            : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
                        }`}
                        aria-current={isActive ? "page" : undefined}
                      >
                        {option.label}
                      </Link>
                    );
                  })}
                </>
              )}
            </nav>
          </div>
        </div>

        {/* 編集/追加モーダル */}
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
          <RankingItemForm
            item={editingItem}
            onSubmit={handleFormSubmit}
            onCancel={() => setIsModalOpen(false)}
            isLoading={isLoading}
          />
        </Modal>
      </div>
    );
  }
);
