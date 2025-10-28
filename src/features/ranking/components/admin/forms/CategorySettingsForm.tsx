"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { Button } from "@/components/atoms/ui/button";
import { Checkbox } from "@/components/atoms/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel
} from "@/components/atoms/ui/form";
import { Input } from "@/components/atoms/ui/input";
import { Label } from "@/components/atoms/ui/label";

const categorySettingsSchema = z.object({
  groupIds: z.array(z.number()),
  displayOrders: z.record(z.number()),
  isFeatured: z.boolean(),
});

type CategorySettingsFormValues = z.infer<typeof categorySettingsSchema>;

interface CategorySettingsFormProps {
  item?: any;
}

export function CategorySettingsForm({ item }: CategorySettingsFormProps) {
  const form = useForm<CategorySettingsFormValues>({
    resolver: zodResolver(categorySettingsSchema),
    defaultValues: {
      groupIds: item?.groupIds || [],
      displayOrders: item?.displayOrders || {},
      isFeatured: item?.isFeatured ?? false,
    },
  });

  const onSubmit = (values: CategorySettingsFormValues) => {
    console.log("カテゴリ設定フォーム送信:", values);
    // TODO: API呼び出し
  };

  // TODO: ranking_groups から取得
  const availableGroups = [
    { id: 1, name: "人口統計", subcategoryId: "population" },
    { id: 2, name: "経済統計", subcategoryId: "economy" },
    { id: 3, name: "社会統計", subcategoryId: "society" },
  ];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <FormLabel>ランキンググループ</FormLabel>
          <FormDescription>
            このランキング項目を含めるグループを選択してください
          </FormDescription>
          <div className="space-y-2">
            {availableGroups.map((group) => (
              <div key={group.id} className="flex items-center space-x-2">
                <Checkbox id={`group-${group.id}`} />
                <Label htmlFor={`group-${group.id}`}>{group.name}</Label>
                <Input
                  type="number"
                  placeholder="表示順"
                  className="w-24 ml-auto"
                />
              </div>
            ))}
          </div>
        </div>

        <FormField
          control={form.control}
          name="isFeatured"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>おすすめに表示</FormLabel>
                <FormDescription>
                  このランキング項目をおすすめに表示する
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        <div className="flex justify-end">
          <Button type="submit">保存</Button>
        </div>
      </form>
    </Form>
  );
}
