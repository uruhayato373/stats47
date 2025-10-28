"use client";

import { useEffect, useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import * as z from "zod";

import { Button } from "@/components/atoms/ui/button";
import { Checkbox } from "@/components/atoms/ui/checkbox";
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
import { Skeleton } from "@/components/atoms/ui/skeleton";

const groupItemSchema = z.object({
  groupId: z.number(),
  groupName: z.string(),
  subcategoryId: z.string(),
  isSelected: z.boolean(),
  displayOrder: z.number().min(0).max(999),
  isFeatured: z.boolean(),
});

const categorySettingsSchema = z.object({
  groups: z.array(groupItemSchema),
});

type CategorySettingsFormValues = z.infer<typeof categorySettingsSchema>;
type GroupItem = z.infer<typeof groupItemSchema>;

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
  rankingItemId?: number;
}

export function CategorySettingsForm({ item, rankingItemId }: CategorySettingsFormProps) {
  const [availableGroups, setAvailableGroups] = useState<RankingGroup[]>([]);
  const [loading, setLoading] = useState(true);

  const form = useForm<CategorySettingsFormValues>({
    resolver: zodResolver(categorySettingsSchema),
    defaultValues: {
      groups: [],
    },
  });

  const { fields, replace } = useFieldArray({
    control: form.control,
    name: "groups",
  });

  // ranking_groups を取得
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        setLoading(true);
        // TODO: 実際のAPIエンドポイントから取得
        // const response = await fetch("/api/admin/ranking-groups");
        // const groups = await response.json();
        
        // モックデータ
        const mockGroups: RankingGroup[] = [
          { id: 1, groupKey: "population-basic", subcategoryId: "population", name: "人口統計", displayOrder: 0 },
          { id: 2, groupKey: "economy-basic", subcategoryId: "economy", name: "経済統計", displayOrder: 0 },
          { id: 3, groupKey: "society-basic", subcategoryId: "society", name: "社会統計", displayOrder: 0 },
          { id: 4, groupKey: "environment-basic", subcategoryId: "environment", name: "環境統計", displayOrder: 0 },
        ];

        setAvailableGroups(mockGroups);

        // 既存の設定を反映
        const existingGroupIds = item?.groupIds || [];
        const existingDisplayOrders = item?.displayOrders || {};
        const existingFeatured = item?.featuredGroups || [];

        const initialGroups: GroupItem[] = mockGroups.map((group) => ({
          groupId: group.id,
          groupName: group.name,
          subcategoryId: group.subcategoryId,
          isSelected: existingGroupIds.includes(group.id),
          displayOrder: existingDisplayOrders[group.id] || 0,
          isFeatured: existingFeatured.includes(group.id),
        }));

        replace(initialGroups);
      } catch (error) {
        console.error("グループ取得エラー:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchGroups();
  }, [item, replace]);

  const onSubmit = async (values: CategorySettingsFormValues) => {
    try {
      const selectedGroups = values.groups.filter((g) => g.isSelected);

      // ranking_group_items テーブルへ保存するデータ
      const groupItems = selectedGroups.map((group) => ({
        groupId: group.groupId,
        rankingItemId: rankingItemId,
        displayOrder: group.displayOrder,
        isFeatured: group.isFeatured,
      }));

      console.log("カテゴリ設定保存:", groupItems);
      
      // TODO: API呼び出し
      // await fetch(`/api/admin/ranking-items/${rankingItemId}/groups`, {
      //   method: "PUT",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ groups: groupItems }),
      // });

      alert("保存しました（モック）");
    } catch (error) {
      console.error("保存エラー:", error);
      alert("保存に失敗しました");
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <div>
            <FormLabel>ランキンググループ</FormLabel>
            <FormDescription>
              このランキング項目を含めるグループを選択してください
            </FormDescription>
          </div>

          <div className="space-y-3 border rounded-lg p-4">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="flex items-start gap-3 p-3 border rounded-md bg-muted/50"
              >
                <FormField
                  control={form.control}
                  name={`groups.${index}.isSelected`}
                  render={({ field }) => (
                    <FormItem className="flex items-center space-y-0 mt-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="flex-1 space-y-2">
                  <div>
                    <p className="font-medium">{fields[index].groupName}</p>
                    <p className="text-xs text-muted-foreground">
                      サブカテゴリ: {fields[index].subcategoryId}
                    </p>
                  </div>

                  {form.watch(`groups.${index}.isSelected`) && (
                    <div className="grid grid-cols-2 gap-3">
                      <FormField
                        control={form.control}
                        name={`groups.${index}.displayOrder`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">表示順</FormLabel>
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
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`groups.${index}.isFeatured`}
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2 space-y-0 pt-6">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel className="text-xs font-normal">
                              おすすめ
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {fields.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              利用可能なグループがありません
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => form.reset()}>
            リセット
          </Button>
          <Button type="submit">保存</Button>
        </div>
      </form>
    </Form>
  );
}
