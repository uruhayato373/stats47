"use client";

import { forwardRef, useImperativeHandle } from "react";

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
import { Switch } from "@/components/atoms/ui/switch";
import { Textarea } from "@/components/atoms/ui/textarea";

const basicInfoSchema = z.object({
  rankingKey: z.string().min(1).regex(/^[a-zA-Z0-9_-]+$/, "英数字、ハイフン、アンダースコアのみ使用可能"),
  label: z.string().min(1).max(50),
  name: z.string().min(1).max(100),
  unit: z.string().min(1).max(20),
  annotation: z.string().max(500).optional(),
  isActive: z.boolean(),
});

type BasicInfoFormValues = z.infer<typeof basicInfoSchema>;

interface BasicInfoFormProps {
  item?: Partial<BasicInfoFormValues>;
  mode: "create" | "edit";
}

export interface BasicInfoFormRef {
  getValues: () => BasicInfoFormValues;
}

export const BasicInfoForm = forwardRef<BasicInfoFormRef, BasicInfoFormProps>(
  ({ item, mode }, ref) => {
    const form = useForm<BasicInfoFormValues>({
      resolver: zodResolver(basicInfoSchema),
      defaultValues: {
        rankingKey: item?.rankingKey || "",
        label: item?.label || "",
        name: item?.name || "",
        unit: item?.unit || "",
        annotation: item?.annotation || "",
        isActive: item?.isActive ?? true,
      },
    });

    useImperativeHandle(ref, () => ({
      getValues: () => form.getValues(),
    }));

    const onSubmit = (values: BasicInfoFormValues) => {
      console.log("基本情報フォーム送信:", values);
      // TODO: API呼び出し
    };

  return (
    <Form {...form}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
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
            name="isActive"
            render={({ field }) => (
              <FormItem>
                <FormLabel>ステータス</FormLabel>
                <div className="flex items-center space-x-2">
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <span className="text-sm font-medium">
                    {field.value ? "有効" : "無効"}
                  </span>
                </div>
                <FormDescription>
                  このランキング項目の有効/無効を切り替え
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
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

          <FormField
            control={form.control}
            name="unit"
            render={({ field }) => (
              <FormItem className="w-32">
                <FormLabel>単位 *</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="人/km²" />
                </FormControl>
                <FormDescription>データの単位</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="annotation"
          render={({ field }) => (
            <FormItem>
              <FormLabel>注釈</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="統計項目の詳細説明や注釈（オプション）"
                  rows={3}
                />
              </FormControl>
              <FormDescription>統計項目の詳細説明や注釈（任意）</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

      </div>
    </Form>
  );
  }
);

BasicInfoForm.displayName = 'BasicInfoForm';
