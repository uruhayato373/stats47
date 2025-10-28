"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { Button } from "@/components/atoms/ui/button";
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

const dataSourceMetadataSchema = z.object({
  areaType: z.enum(["prefecture", "city", "national"]),
  calculationType: z.enum(["direct", "ratio", "aggregate"]),
  statsDataId: z.string().optional(),
  cdCat01: z.string().optional(),
  numerator: z.string().optional(),
  denominator: z.string().optional(),
  multiplier: z.number().optional(),
});

type DataSourceMetadataFormValues = z.infer<typeof dataSourceMetadataSchema>;

interface DataSourceMetadataFormProps {
  item?: any;
}

export function DataSourceMetadataForm({ item }: DataSourceMetadataFormProps) {
  const form = useForm<DataSourceMetadataFormValues>({
    resolver: zodResolver(dataSourceMetadataSchema),
    defaultValues: {
      areaType: item?.areaType || "prefecture",
      calculationType: item?.calculationType || "direct",
      statsDataId: item?.statsDataId || "",
      cdCat01: item?.cdCat01 || "",
      numerator: item?.numerator || "",
      denominator: item?.denominator || "",
      multiplier: item?.multiplier || 1,
    },
  });

  const calculationType = form.watch("calculationType");

  const onSubmit = (values: DataSourceMetadataFormValues) => {
    console.log("データソース設定フォーム送信:", values);
    // TODO: API呼び出し
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="areaType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>エリアタイプ *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="エリアタイプを選択" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="prefecture">都道府県</SelectItem>
                    <SelectItem value="city">市区町村</SelectItem>
                    <SelectItem value="national">全国</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>データの集計単位</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="calculationType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>計算タイプ *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="計算タイプを選択" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="direct">直接値</SelectItem>
                    <SelectItem value="ratio">比率</SelectItem>
                    <SelectItem value="aggregate">集計</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>データの計算方法</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {calculationType === "direct" && (
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="statsDataId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>統計データID</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="0000010102" />
                  </FormControl>
                  <FormDescription>e-Stat の統計データID</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cdCat01"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>分類コード</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="B1101" />
                  </FormControl>
                  <FormDescription>e-Stat の分類コード</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        {calculationType === "ratio" && (
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="numerator"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>分子</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="人口" />
                  </FormControl>
                  <FormDescription>比率計算の分子</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="denominator"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>分母</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="面積" />
                  </FormControl>
                  <FormDescription>比率計算の分母</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="multiplier"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>乗数</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      value={field.value || 1}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 1)}
                    />
                  </FormControl>
                  <FormDescription>比率計算の乗数（例: 1000）</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        {calculationType === "aggregate" && (
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              集計タイプの設定は後ほど実装予定です。
            </p>
          </div>
        )}

        <div className="flex justify-end">
          <Button type="submit">保存</Button>
        </div>
      </form>
    </Form>
  );
}
