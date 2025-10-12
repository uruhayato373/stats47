"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Pencil, Check, Trash2, Edit } from "lucide-react";
import { RankingOption, RankingItem } from "@/types/models/ranking";
import { useRankingItemsEditor } from "@/hooks/useRankingItemsEditor";
import { Modal } from "@/components/common/Modal/Modal";
import { RankingItemForm } from "./RankingItemForm";

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
        if (editingItem?.id) {
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
        if (item.id) {
          await deleteRankingItem(item.id);
          onUpdate?.();
        }
      } catch (error) {
        console.error("Delete error:", error);
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
                  className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                  title={isEditMode ? "編集を完了" : "編集モード"}
                  aria-label={isEditMode ? "編集を完了" : "編集モード"}
                >
                  {isEditMode ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Pencil className="w-4 h-4" />
                  )}
                </button>
              )}
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                {error}
              </div>
            )}

            <nav className="space-y-2" aria-label="統計項目">
              {tabOptions.map((option) => {
                const href = `/${categoryId}/${subcategoryId}/ranking/${option.key}`;
                const isActive = activeRankingId === option.key;
                const item = currentRankingItems.find(
                  (i) => i.rankingKey === option.key
                );

                return (
                  <div key={option.key} className="relative group">
                    <Link
                      href={href}
                      className={`block w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400"
                          : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
                      } ${isEditMode ? "pr-16" : ""}`}
                      aria-current={isActive ? "page" : undefined}
                    >
                      {option.label}
                    </Link>
                    {isEditMode && item && (
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-1 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded transition-colors"
                          title="編集"
                          disabled={isLoading}
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(item)}
                          className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                          title="削除"
                          disabled={isLoading}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
              {isEditMode && (
                <button
                  onClick={handleAdd}
                  className="w-full p-2 border-2 border-dashed border-gray-300 rounded-md text-gray-600 hover:border-gray-400 hover:text-gray-700 dark:border-gray-600 dark:text-gray-400 dark:hover:border-gray-500 text-sm"
                  disabled={isLoading}
                >
                  + 新規追加
                </button>
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
