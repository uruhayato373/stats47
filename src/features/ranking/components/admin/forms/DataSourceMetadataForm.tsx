"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { useFieldArray, useForm } from "react-hook-form";
import * as z from "zod";

import { Button } from "@/components/atoms/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/atoms/ui/card";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/atoms/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/atoms/ui/select";
import { Textarea } from "@/components/atoms/ui/textarea";
import {
    ToggleGroup,
    ToggleGroupItem,
} from "@/components/atoms/ui/toggle-group";

// メタデータアイテムのスキーマ（metadataはJSON文字列として扱う）
const metadataItemSchema = z.object({
  dataSourceId: z.enum(["estat", "custom"]),
  areaType: z.enum(["prefecture", "city", "national"]),
  calculationType: z.enum(["direct", "ratio", "aggregate"]),
  metadata: z
    .string()
    .min(1, "メタデータは必須です")
    .refine(
      (val) => {
        try {
          JSON.parse(val);
          return true;
        } catch {
          return false;
        }
      },
      { message: "有効なJSONである必要があります" }
    ),
});

const dataSourceMetadataSchema = z.object({
  metadataItems: z.array(metadataItemSchema),
});

type DataSourceMetadataFormValues = z.infer<typeof dataSourceMetadataSchema>;

interface DataSourceMetadataFormProps {
  item?: {
    metadataItems?: Array<{
      dataSourceId: string;
      areaType: string;
      calculationType: string;
      metadata: object;
    }>;
  };
}

// デフォルトのサンプルメタデータ
const defaultMetadataItem = {
  dataSourceId: "estat" as const,
  areaType: "prefecture" as const,
  calculationType: "direct" as const,
  metadata: JSON.stringify(
    {
      stats_data_id: "0000010102",
      cd_cat01: "B1101",
    },
    null,
    2
  ),
};

export function DataSourceMetadataForm({ item }: DataSourceMetadataFormProps) {
  const form = useForm<DataSourceMetadataFormValues>({
    resolver: zodResolver(dataSourceMetadataSchema),
    defaultValues: {
      metadataItems:
        item?.metadataItems?.map((item) => ({
          dataSourceId: item.dataSourceId,
          areaType: item.areaType,
          calculationType: item.calculationType,
          metadata: JSON.stringify(item.metadata, null, 2),
        })) || [defaultMetadataItem],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "metadataItems",
  });

  const onSubmit = (values: DataSourceMetadataFormValues) => {
    console.log("データソース設定フォーム送信:", values);
    // TODO: API呼び出し
  };

  const addMetadata = () => {
    append(defaultMetadataItem);
  };

  return (
    <Form {...form}>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-sm font-medium">データソースメタデータ</h3>
            <p className="text-[10px] text-muted-foreground pl-2">
              複数のデータソースを設定できます
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addMetadata}
          >
            <Plus className="h-4 w-4 mr-1" />
            追加
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {fields.map((field, index) => (
            <Card key={field.id}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-sm">
                      データソース {index + 1}
                    </CardTitle>
                    <CardDescription className="text-[10px]">
                      メタデータ設定
                    </CardDescription>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => remove(index)}
                    disabled={fields.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <FormField
                  control={form.control}
                  name={`metadataItems.${index}.dataSourceId`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>データソース *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="選択" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="estat">e-Stat</SelectItem>
                          <SelectItem value="custom">カスタム</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`metadataItems.${index}.areaType`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>エリアタイプ *</FormLabel>
                      <FormControl>
                        <ToggleGroup
                          type="single"
                          value={field.value}
                          onValueChange={field.onChange}
                          variant="outline"
                          className="flex-wrap"
                        >
                          <ToggleGroupItem value="prefecture">
                            都道府県
                          </ToggleGroupItem>
                          <ToggleGroupItem value="city">
                            市区町村
                          </ToggleGroupItem>
                          <ToggleGroupItem value="national">
                            全国
                          </ToggleGroupItem>
                        </ToggleGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`metadataItems.${index}.calculationType`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>計算タイプ *</FormLabel>
                      <FormControl>
                        <ToggleGroup
                          type="single"
                          value={field.value}
                          onValueChange={field.onChange}
                          variant="outline"
                          className="flex-wrap"
                        >
                          <ToggleGroupItem value="direct">
                            直接値
                          </ToggleGroupItem>
                          <ToggleGroupItem value="ratio">比率</ToggleGroupItem>
                          <ToggleGroupItem value="aggregate">
                            集計
                          </ToggleGroupItem>
                        </ToggleGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`metadataItems.${index}.metadata`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>メタデータ（JSON） *</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          className="font-mono text-xs resize-y"
                          rows={6}
                          placeholder='例: {\n  "stats_data_id": "0000010102",\n  "cd_cat01": "B1101"\n}'
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        JSON形式でメタデータを入力してください
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Form>
  );
}
