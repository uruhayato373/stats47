"use client";

import { forwardRef, useEffect, useImperativeHandle, useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/atoms/ui/form";
import { Input } from "@/components/atoms/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/atoms/ui/select";
import { Skeleton } from "@/components/atoms/ui/skeleton";

import { listCategoriesAction } from "@/features/category/actions";
import type { Category } from "@/features/category/types/category.types";

const categorySettingsSchema = z.object({
  categoryId: z.string().min(1, "カテゴリを選択してください"),
  subcategoryId: z.string().min(1, "サブカテゴリを選択してください"),
  groupId: z.number().nullable(),
  displayOrderInGroup: z.number().min(0).max(999),
});

type CategorySettingsFormValues = z.infer<typeof categorySettingsSchema>;

interface RankingGroup {
  id: number;
  groupKey: string;
  subcategoryId: string;
  name: string;
  description?: string;
  displayOrder: number;
}

interface CategorySettingsFormProps {
  item?: any;
}

export interface CategorySettingsFormRef {
  getValues: () => CategorySettingsFormValues;
}

export const CategorySettingsForm = forwardRef<
  CategorySettingsFormRef,
  CategorySettingsFormProps
>(({ item }, ref) => {
  const [availableGroups, setAvailableGroups] = useState<RankingGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  const form = useForm<CategorySettingsFormValues>({
    resolver: zodResolver(categorySettingsSchema),
    defaultValues: {
      categoryId: item?.categoryId || "",
      subcategoryId: item?.subcategoryId || "",
      groupId: item?.groupId ?? null,
      displayOrderInGroup: item?.displayOrderInGroup ?? 0,
    },
  });

  const selectedCategoryId = form.watch("categoryId");
  const selectedSubcategoryId = form.watch("subcategoryId");

  // カテゴリ一覧を取得
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setCategoriesLoading(true);
        const categoriesData = await listCategoriesAction();
        setCategories(categoriesData);
      } catch (error) {
        console.error("カテゴリ取得エラー:", error);
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // 選択されたカテゴリのサブカテゴリを取得
  const selectedCategory = categories.find(
    (c) => c.categoryKey === selectedCategoryId
  );
  const subcategories = selectedCategory?.subcategories || [];

  // サブカテゴリ変更時にグループを取得
  useEffect(() => {
    if (!selectedSubcategoryId) {
      setAvailableGroups([]);
      return;
    }

    const fetchGroups = async () => {
      try {
        setLoading(true);
        // TODO: 実際のAPIエンドポイントから取得
        // const response = await fetch(`/api/admin/ranking-groups?subcategoryId=${selectedSubcategoryId}`);
        // const groups = await response.json();

        // モックデータ
        const mockGroups: RankingGroup[] = [
          {
            id: 1,
            groupKey: "basic-stats",
            subcategoryId: selectedSubcategoryId,
            name: "基本統計",
            description: "基本的な統計指標",
            displayOrder: 0,
          },
          {
            id: 2,
            groupKey: "detailed-stats",
            subcategoryId: selectedSubcategoryId,
            name: "詳細統計",
            description: "詳細な統計指標",
            displayOrder: 1,
          },
        ];

        setAvailableGroups(mockGroups);
      } catch (error) {
        console.error("グループ取得エラー:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchGroups();
  }, [selectedSubcategoryId]);

  // カテゴリ変更時にサブカテゴリをリセット
  useEffect(() => {
    if (
      selectedCategoryId &&
      !subcategories.find((s) => s.subcategoryKey === selectedSubcategoryId)
    ) {
      form.setValue("subcategoryId", "");
      form.setValue("groupId", null);
    }
  }, [selectedCategoryId, selectedSubcategoryId, subcategories, form]);

  useImperativeHandle(ref, () => ({
    getValues: () => form.getValues(),
  }));

  const onSubmit = async (values: CategorySettingsFormValues) => {
    console.log("カテゴリ設定保存:", values);
    // TODO: API呼び出し
  };

  return (
    <Form {...form}>
      <div className="space-y-4">
        {/* カテゴリ・サブカテゴリ・グループ選択（3列） */}
        <div className="grid grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>カテゴリ *</FormLabel>
                {categoriesLoading ? (
                  <Skeleton className="h-8 w-full" />
                ) : (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="カテゴリを選択" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem
                          key={category.categoryKey}
                          value={category.categoryKey}
                        >
                          {category.categoryName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="subcategoryId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>サブカテゴリ *</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={!selectedCategoryId || subcategories.length === 0}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="サブカテゴリを選択" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {subcategories.map((subcategory) => (
                      <SelectItem
                        key={subcategory.subcategoryKey}
                        value={subcategory.subcategoryKey}
                      >
                        {subcategory.subcategoryName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="groupId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>ランキンググループ *</FormLabel>
                {loading ? (
                  <Skeleton className="h-8 w-full" />
                ) : (
                  <Select
                    onValueChange={(value) =>
                      field.onChange(value ? parseInt(value, 10) : null)
                    }
                    value={field.value?.toString() || ""}
                    disabled={
                      !selectedSubcategoryId || availableGroups.length === 0
                    }
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="グループを選択" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableGroups.map((group) => (
                        <SelectItem key={group.id} value={group.id.toString()}>
                          {group.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* グループ内設定 */}
        {form.watch("groupId") && (
          <div className="space-y-3 border rounded-lg p-4 bg-muted/30">
            <h4 className="text-sm font-medium">グループ内設定</h4>

            <FormField
              control={form.control}
              name="displayOrderInGroup"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>表示順</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      max="999"
                      {...field}
                      onChange={(e) =>
                        field.onChange(parseInt(e.target.value, 10) || 0)
                      }
                    />
                  </FormControl>
                  <FormDescription>
                    グループ内での表示順序（0-999）
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}
      </div>
    </Form>
  );
});

CategorySettingsForm.displayName = "CategorySettingsForm";
