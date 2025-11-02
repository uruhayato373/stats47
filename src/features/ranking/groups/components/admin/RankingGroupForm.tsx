"use client";

import { useEffect, useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { toast } from "sonner";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/atoms/ui/accordion";
import { Button } from "@/components/atoms/ui/button";
import { Checkbox } from "@/components/atoms/ui/checkbox";
import { Input } from "@/components/atoms/ui/input";
import { Label } from "@/components/atoms/ui/label";

import { listCategoriesAction } from "@/features/category/actions";
import type { Category } from "@/features/category/types/category.types";
import { createRankingGroup } from "@/features/ranking/groups/actions/createRankingGroup";
import { updateRankingGroup } from "@/features/ranking/groups/actions/updateRankingGroup";
import type { RankingGroup } from "@/features/ranking/groups/types";

interface RankingGroupFormProps {
  group?: RankingGroup;
}

export function RankingGroupForm({ group }: RankingGroupFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedSubcategoryIds, setSelectedSubcategoryIds] = useState<
    string[]
  >(
    group?.subcategoryIds
      ? group.subcategoryIds.filter((id) => id !== "uncategorized")
      : []
  );
  const [categoriesList, setCategoriesList] = useState<Category[]>([]);

  // カテゴリ一覧を取得
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categoriesData = await listCategoriesAction();
        setCategoriesList(categoriesData);
      } catch (error) {
        console.error("カテゴリ取得エラー:", error);
      }
    };

    fetchCategories();
  }, []);

  // グループがある場合、サブカテゴリIDを初期化（uncategorizedは除外）
  useEffect(() => {
    if (group?.subcategoryIds && group.subcategoryIds.length > 0) {
      // uncategorizedを除外して初期化
      setSelectedSubcategoryIds(
        group.subcategoryIds.filter((id) => id !== "uncategorized")
      );
    }
  }, [group]);

  // サブカテゴリのチェックボックス変更時
  const handleSubcategoryToggle = (subcategoryId: string, checked: boolean) => {
    const UNCategorized_ID = "uncategorized";

    if (checked) {
      // サブカテゴリを選択した場合、uncategorizedを除外
      setSelectedSubcategoryIds((prev) => {
        const filtered = prev.filter((id) => id !== UNCategorized_ID);
        // 既に選択されている場合は追加しない
        if (filtered.includes(subcategoryId)) {
          return filtered;
        }
        return [...filtered, subcategoryId];
      });
    } else {
      // サブカテゴリを解除した場合
      setSelectedSubcategoryIds((prev) =>
        prev.filter((id) => id !== subcategoryId)
      );
    }
  };

  // フォーム送信処理
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const formData = new FormData(e.currentTarget);
      const groupKey = formData.get("groupKey") as string;
      const name = formData.get("name") as string;
      const displayOrder = parseInt(formData.get("displayOrder") as string, 10);

      if (!groupKey || !name || isNaN(displayOrder)) {
        toast.error("必須項目を入力してください");
        setIsSubmitting(false);
        return;
      }

      if (selectedSubcategoryIds.length === 0) {
        toast.error("少なくとも1つのサブカテゴリを選択してください");
        setIsSubmitting(false);
        return;
      }

      if (group) {
        // 更新
        const success = await updateRankingGroup(group.groupKey, {
          subcategoryIds: selectedSubcategoryIds,
          group_name: name,
          label: name, // labelもnameと同じ値に設定（後で変更可能）
          displayOrder,
        });

        if (success) {
          toast.success("グループを更新しました");
          router.refresh(); // ページをリフレッシュ
        } else {
          toast.error("グループの更新に失敗しました");
        }
      } else {
        // 作成
        const result = await createRankingGroup({
          groupKey,
          subcategoryIds: selectedSubcategoryIds,
          group_name: name,
          label: name, // labelもnameと同じ値に設定
          displayOrder,
        });

        if (result) {
          toast.success("グループを作成しました");
          router.push(`/admin/dev-tools/ranking-groups/${result}`);
        } else {
          toast.error("グループの作成に失敗しました");
        }
      }
    } catch (error) {
      console.error("Error saving ranking group:", error);
      toast.error(
        `保存に失敗しました: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="groupKey">グループキー</Label>
        <Input
          id="groupKey"
          name="groupKey"
          defaultValue={group?.groupKey}
          placeholder="population-total-group"
          required
        />
      </div>

      <div className="space-y-2">
        <Label>サブカテゴリ（複数選択可）</Label>
        <div className="rounded-md border border-input p-4 max-h-96 overflow-y-auto">
          <Accordion type="multiple" className="w-full">
            {categoriesList.map((category) => {
              const categoryId = category.categoryKey;
              const categorySubcategories = category.subcategories || [];

              if (categorySubcategories.length === 0) {
                return null;
              }

              // このカテゴリに選択済みのサブカテゴリがあるかチェック（uncategorizedは除外）
              const selectedCount = categorySubcategories.filter((sub) => {
                const subId = sub.subcategoryKey;
                return (
                  subId !== "uncategorized" &&
                  selectedSubcategoryIds.includes(subId)
                );
              }).length;

              return (
                <AccordionItem key={categoryId} value={categoryId}>
                  <AccordionTrigger className="text-sm font-medium">
                    <div className="flex items-center justify-between w-full pr-4">
                      <span>{category.categoryName}</span>
                      {selectedCount > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {selectedCount}個選択中
                        </span>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 pl-2">
                      {categorySubcategories
                        .filter((subcategory) => {
                          // uncategorizedは表示しない
                          return subcategory.subcategoryKey !== "uncategorized";
                        })
                        .map((subcategory) => {
                          const subcategoryId = subcategory.subcategoryKey;
                          const isChecked =
                            selectedSubcategoryIds.includes(subcategoryId);

                          return (
                            <div
                              key={subcategoryId}
                              className="flex items-center space-x-2"
                            >
                              <Checkbox
                                id={`subcategory-${categoryId}-${subcategoryId}`}
                                checked={isChecked}
                                onCheckedChange={(checked) =>
                                  handleSubcategoryToggle(
                                    subcategoryId,
                                    checked === true
                                  )
                                }
                              />
                              <label
                                htmlFor={`subcategory-${categoryId}-${subcategoryId}`}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                              >
                                {subcategory.subcategoryName}
                              </label>
                            </div>
                          );
                        })}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </div>
        {selectedSubcategoryIds.length > 0 && (
          <p className="text-xs text-muted-foreground">
            選択済み: {selectedSubcategoryIds.length}個
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">グループ名</Label>
        <Input
          id="name"
          name="name"
          defaultValue={group?.name}
          placeholder="総人口グループ"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="displayOrder">表示順</Label>
        <Input
          id="displayOrder"
          name="displayOrder"
          type="number"
          defaultValue={group?.displayOrder}
          placeholder="0"
          required
        />
      </div>

      <div className="flex justify-end gap-2">
        <Link href="/admin/dev-tools/ranking-groups">
          <Button type="button" variant="outline">
            キャンセル
          </Button>
        </Link>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "保存中..." : group ? "更新" : "作成"}
        </Button>
      </div>
    </form>
  );
}
