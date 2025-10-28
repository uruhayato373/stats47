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
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/atoms/ui/form";
import { Input } from "@/components/atoms/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/atoms/ui/select";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/atoms/ui/toggle-group";

// メタデータのスキーマ（計算タイプに応じて変わる）
const directMetadataSchema = z.object({
  stats_data_id: z.string().min(1, "統計データIDは必須です"),
  cd_cat01: z.string().min(1, "分類コードは必須です"),
});

const ratioMetadataSchema = z.object({
  numerator: z.string().min(1, "分子は必須です"),
  denominator: z.string().min(1, "分母は必須です"),
  multiplier: z.number().min(0, "乗数は0以上である必要があります"),
});

const aggregateMetadataSchema = z.object({
  // 将来の拡張用
});

const metadataItemSchema = z.object({
  dataSourceId: z.enum(["estat", "custom"]),
  areaType: z.enum(["prefecture", "city", "national"]),
  calculationType: z.enum(["direct", "ratio", "aggregate"]),
  metadata: z.union([directMetadataSchema, ratioMetadataSchema, aggregateMetadataSchema]),
});

const dataSourceMetadataSchema = z.object({
  metadataItems: z.array(metadataItemSchema),
});

type DataSourceMetadataFormValues = z.infer<typeof dataSourceMetadataSchema>;

interface DataSourceMetadataFormProps {
  item?: any;
}

export function DataSourceMetadataForm({ item }: DataSourceMetadataFormProps) {
  const form = useForm<DataSourceMetadataFormValues>({
    resolver: zodResolver(dataSourceMetadataSchema),
    defaultValues: {
      metadataItems: item?.metadataItems || [
        {
          dataSourceId: "estat",
          areaType: "prefecture",
          calculationType: "direct",
          metadata: {
            stats_data_id: "",
            cd_cat01: "",
          },
        },
      ],
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
    append({
      dataSourceId: "estat",
      areaType: "prefecture",
      calculationType: "direct",
      metadata: {
        stats_data_id: "",
        cd_cat01: "",
      },
    });
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
          {fields.map((field, index) => {
            const calculationType = form.watch(
              `metadataItems.${index}.calculationType`
            );
            return (
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
                          defaultValue={field.value}
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
                            <ToggleGroupItem value="ratio">
                              比率
                            </ToggleGroupItem>
                            <ToggleGroupItem value="aggregate">
                              集計
                            </ToggleGroupItem>
                          </ToggleGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {calculationType === "direct" && (
                    <>
                      <FormField
                        control={form.control}
                        name={`metadataItems.${index}.metadata.stats_data_id`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>統計データID *</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="0000010102" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`metadataItems.${index}.metadata.cd_cat01`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>分類コード *</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="B1101" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}

                  {calculationType === "ratio" && (
                    <>
                      <FormField
                        control={form.control}
                        name={`metadataItems.${index}.metadata.numerator`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>分子 *</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="人口" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`metadataItems.${index}.metadata.denominator`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>分母 *</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="面積" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`metadataItems.${index}.metadata.multiplier`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>乗数 *</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                value={field.value || 1}
                                onChange={(e) =>
                                  field.onChange(
                                    parseFloat(e.target.value) || 1
                                  )
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}

                  {calculationType === "aggregate" && (
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-[10px] text-muted-foreground">
                        集計タイプの設定は後ほど実装予定です。
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </Form>
  );
}
