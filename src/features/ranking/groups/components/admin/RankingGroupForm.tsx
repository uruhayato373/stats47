"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { toast } from "sonner";

import { Button } from "@/components/atoms/ui/button";
import { Input } from "@/components/atoms/ui/input";
import { Label } from "@/components/atoms/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/atoms/ui/select";

import { listCategories } from "@/features/category";
import { createRankingGroup } from "@/features/ranking/groups/actions/createRankingGroup";
import { updateRankingGroup } from "@/features/ranking/groups/actions/updateRankingGroup";

import type { RankingGroup } from "@/features/ranking/groups/types";

interface RankingGroupFormProps {
  group?: RankingGroup;
}

export function RankingGroupForm({ group }: RankingGroupFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string>(
    group?.subcategoryId || ""
  );
  const categoriesList = listCategories();

  // グループがある場合、サブカテゴリIDから親カテゴリを特定
  useEffect(() => {
    if (group?.subcategoryId) {
      for (const category of categoriesList) {
        // categories.jsonはidプロパティを使用
        const subcategory = category.subcategories?.find(
          (sub) => (sub as any).id === group.subcategoryId || (sub as any).subcategoryName === group.subcategoryId
        );
        if (subcategory) {
          // categories.jsonはidプロパティを使用
          setSelectedCategoryId((category as any).id || (category as any).categoryName || "");
          setSelectedSubcategoryId(group.subcategoryId);
          break;
        }
      }
    }
  }, [group, categoriesList]);

  // 選択されたカテゴリのサブカテゴリを取得
  const selectedCategory = categoriesList.find(
    (c) => (c as any).id === selectedCategoryId || (c as any).categoryName === selectedCategoryId
  );
  const subcategories = selectedCategory?.subcategories || [];

  // カテゴリ変更時にサブカテゴリをリセット
  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    setSelectedSubcategoryId(""); // サブカテゴリをリセット
  };

  // サブカテゴリ変更時
  const handleSubcategoryChange = (subcategoryId: string) => {
    setSelectedSubcategoryId(subcategoryId);
  };

  // フォーム送信処理
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const formData = new FormData(e.currentTarget);
      const groupKey = formData.get("groupKey") as string;
      const subcategoryId = formData.get("subcategoryId") as string;
      const name = formData.get("name") as string;
      const icon = formData.get("icon") as string;
      const displayOrder = parseInt(formData.get("displayOrder") as string, 10);

      if (!groupKey || !subcategoryId || !name || isNaN(displayOrder)) {
        toast.error("必須項目を入力してください");
        setIsSubmitting(false);
        return;
      }

      if (group) {
        // 更新
        const success = await updateRankingGroup(group.groupKey, {
          subcategoryId,
          group_name: name,
          label: name, // labelもnameと同じ値に設定（後で変更可能）
          icon: icon || undefined,
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
          subcategoryId,
          group_name: name,
          label: name, // labelもnameと同じ値に設定
          icon: icon || undefined,
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
        `保存に失敗しました: ${error instanceof Error ? error.message : "Unknown error"}`
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
        <Label htmlFor="categoryId">カテゴリ</Label>
        <Select
          value={selectedCategoryId}
          onValueChange={handleCategoryChange}
          required
        >
          <SelectTrigger id="categoryId" name="categoryId">
            <SelectValue placeholder="カテゴリを選択" />
          </SelectTrigger>
          <SelectContent>
            {categoriesList.map((category, index) => {
              // categories.jsonはidプロパティを使用
              const categoryId = (category as any).id || (category as any).categoryName || `category-${index}`;
              return (
                <SelectItem
                  key={categoryId}
                  value={categoryId}
                >
                  {category.name}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
        <input
          type="hidden"
          name="categoryId"
          value={selectedCategoryId}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="subcategoryId">サブカテゴリ</Label>
        <Select
          value={selectedSubcategoryId}
          onValueChange={handleSubcategoryChange}
          disabled={!selectedCategoryId || subcategories.length === 0}
          required
        >
          <SelectTrigger id="subcategoryId">
            <SelectValue placeholder="サブカテゴリを選択" />
          </SelectTrigger>
          <SelectContent>
            {subcategories.map((subcategory, index) => {
              // categories.jsonはidプロパティを使用
              const subcategoryId = (subcategory as any).id || (subcategory as any).subcategoryName || `subcategory-${index}`;
              return (
                <SelectItem
                  key={subcategoryId}
                  value={subcategoryId}
                >
                  {subcategory.name}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
        <input
          type="hidden"
          name="subcategoryId"
          value={selectedSubcategoryId}
        />
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
        <Label htmlFor="icon">アイコン（絵文字またはテキスト）</Label>
        <Input
          id="icon"
          name="icon"
          defaultValue={group?.icon}
          placeholder="🔧"
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
