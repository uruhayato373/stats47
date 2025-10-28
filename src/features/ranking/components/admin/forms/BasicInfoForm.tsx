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
import { Textarea } from "@/components/atoms/ui/textarea";

const basicInfoSchema = z.object({
  rankingKey: z.string().min(1).regex(/^[a-zA-Z0-9_-]+$/, "英数字、ハイフン、アンダースコアのみ使用可能"),
  label: z.string().min(1).max(50),
  name: z.string().min(1).max(100),
  unit: z.string().min(1).max(20),
  dataSourceId: z.enum(["estat", "custom"]),
  description: z.string().max(500).optional(),
  isActive: z.boolean(),
});

type BasicInfoFormValues = z.infer<typeof basicInfoSchema>;

interface BasicInfoFormProps {
  item?: Partial<BasicInfoFormValues>;
  mode: "create" | "edit";
}

export function BasicInfoForm({ item, mode }: BasicInfoFormProps) {
  const form = useForm<BasicInfoFormValues>({
    resolver: zodResolver(basicInfoSchema),
    defaultValues: {
      rankingKey: item?.rankingKey || "",
      label: item?.label || "",
      name: item?.name || "",
      unit: item?.unit || "",
      dataSourceId: item?.dataSourceId || "estat",
      description: item?.description || "",
      isActive: item?.isActive ?? true,
    },
  });

  const onSubmit = (values: BasicInfoFormValues) => {
    console.log("基本情報フォーム送信:", values);
    // TODO: API呼び出し
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="rankingKey"
          render={({ field }) => (
            <FormItem>
              <FormLabel>ランキングキー *</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  disabled={mode === "edit"}
                  placeholder="population-density"
                />
              </FormControl>
              <FormDescription>
                英数字、ハイフン、アンダースコアのみ使用可能
                {mode === "edit" && "（編集不可）"}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="label"
          render={({ field }) => (
            <FormItem>
              <FormLabel>表示ラベル *</FormLabel>
              <FormControl>
                <Input {...field} placeholder="人口密度" />
              </FormControl>
              <FormDescription>UI表示用の短い名前</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>項目名 *</FormLabel>
              <FormControl>
                <Input {...field} placeholder="人口密度（人/km²）" />
              </FormControl>
              <FormDescription>統計項目の正式名称</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="unit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>単位 *</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="人/km²" />
                </FormControl>
                <FormDescription>データの単位</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="dataSourceId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>データソース *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="データソースを選択" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="estat">e-Stat</SelectItem>
                    <SelectItem value="custom">カスタム</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>データ取得元</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>説明</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="統計項目の詳細説明（オプション）"
                  rows={3}
                />
              </FormControl>
              <FormDescription>統計項目の詳細説明（任意）</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>有効にする</FormLabel>
                <FormDescription>
                  このランキング項目を有効にする
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        <div className="flex justify-end">
          <Button type="submit" disabled={mode === "edit"}>
            {mode === "create" ? "作成" : "保存"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
