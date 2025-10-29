"use client";

import { forwardRef, useImperativeHandle } from "react";

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
      metadata: unknown;
    }>;
  };
}

export interface DataSourceMetadataFormRef {
  getValues: () => DataSourceMetadataFormValues;
}

// 計算タイプ別のサンプルメタデータ
const getDefaultMetadataForType = (calculationType: "direct" | "ratio" | "aggregate") => {
  switch (calculationType) {
    case "direct":
      return JSON.stringify(
        {
          stats_data_id: "0000010102",
          cd_cat01: "B1101",
        },
        null,
        2
      );
    case "ratio":
      return JSON.stringify(
        {
          numerator: {
            source_key: "population",
            stats_data_id: "0000010102",
            cd_cat01: "A1101",
          },
          denominator: {
            source_key: "area",
            stats_data_id: "0000020101",
            cd_cat01: "B1101",
          },
          multiplier: 1000,
          decimal_places: 2,
        },
        null,
        2
      );
    case "aggregate":
      return JSON.stringify(
        {
          sources: [],
          aggregation_method: "sum",
        },
        null,
        2
      );
    default:
      return JSON.stringify({}, null, 2);
  }
};

// 計算タイプ別のプレースホルダー
const getPlaceholderForType = (calculationType: "direct" | "ratio" | "aggregate") => {
  switch (calculationType) {
    case "direct":
      return '例: {\n  "stats_data_id": "0000010102",\n  "cd_cat01": "B1101"\n}';
    case "ratio":
      return '例: {\n  "numerator": {\n    "stats_data_id": "0000010102",\n    "cd_cat01": "A1101"\n  },\n  "denominator": {\n    "stats_data_id": "0000020101",\n    "cd_cat01": "B1101"\n  },\n  "multiplier": 1000\n}';
    case "aggregate":
      return '例: {\n  "sources": [],\n  "aggregation_method": "sum"\n}';
    default:
      return "メタデータを入力してください";
  }
};

// デフォルトのサンプルメタデータ
const defaultMetadataItem = {
  dataSourceId: "estat" as const,
  areaType: "prefecture" as const,
  calculationType: "direct" as const,
  metadata: getDefaultMetadataForType("direct"),
};

export const DataSourceMetadataForm = forwardRef<DataSourceMetadataFormRef, DataSourceMetadataFormProps>(
  function DataSourceMetadataForm({ item }, ref) {
    const form = useForm<DataSourceMetadataFormValues>({
      resolver: zodResolver(dataSourceMetadataSchema),
      defaultValues: {
        metadataItems:
          item?.metadataItems?.map((item) => ({
            dataSourceId: item.dataSourceId as "estat" | "custom",
            areaType: item.areaType as "prefecture" | "city" | "national",
            calculationType: item.calculationType as "direct" | "ratio" | "aggregate",
            metadata: JSON.stringify(item.metadata, null, 2),
          })) || [defaultMetadataItem],
      },
    });

    useImperativeHandle(ref, () => ({
      getValues: () => form.getValues(),
    }));

    const { fields, append, remove } = useFieldArray({
      control: form.control,
      name: "metadataItems",
    });

    const addMetadata = () => {
      append(defaultMetadataItem);
    };

    // calculationType変更時の処理
    const handleCalculationTypeChange = (index: number, newType: "direct" | "ratio" | "aggregate") => {
      // calculationTypeのみ更新し、メタデータはユーザーが既に入力している場合は保持
      form.setValue(`metadataItems.${index}.calculationType`, newType);
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
                          onValueChange={(value) => {
                            if (value) {
                              handleCalculationTypeChange(index, value as "direct" | "ratio" | "aggregate");
                            }
                          }}
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
                  render={({ field }) => {
                    const calculationType = form.watch(`metadataItems.${index}.calculationType`);
                    return (
                      <FormItem>
                        <FormLabel>メタデータ（JSON） *</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            className="font-mono text-xs resize-y"
                            rows={6}
                            placeholder={getPlaceholderForType(calculationType as "direct" | "ratio" | "aggregate")}
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          JSON形式でメタデータを入力してください
                          <br />
                          <span className="font-mono text-muted-foreground">
                            {getPlaceholderForType(calculationType as "direct" | "ratio" | "aggregate")}
                          </span>
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Form>
  );
  }
);
