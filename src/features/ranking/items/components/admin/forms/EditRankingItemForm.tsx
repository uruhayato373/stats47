"use client";

import React from "react";
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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/atoms/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/atoms/ui/radio-group";
import { Label } from "@/components/atoms/ui/label";

const editRankingItemSchema = z.object({
  label: z.string().min(1, "表示ラベルは必須です").max(50),
  name: z.string().min(1, "項目名は必須です").max(100),
  annotation: z.string().max(500).optional().or(z.literal("")),
  unit: z.string().min(1, "単位は必須です").max(20),
  mapColorScheme: z.string().min(1, "色スキームは必須です"),
  mapDivergingMidpoint: z.string().min(1, "分岐点設定は必須です"),
  rankingDirection: z.enum(["asc", "desc"], {
    errorMap: () => ({ message: "ランキング方向を選択してください" }),
  }),
  conversionFactor: z
    .number({
      required_error: "変換係数は必須です",
      invalid_type_error: "変換係数は数値である必要があります",
    })
    .positive("変換係数は正の数である必要があります")
    .max(1000000, "変換係数は1000000以下である必要があります"),
  decimalPlaces: z
    .number({
      required_error: "小数点以下桁数は必須です",
      invalid_type_error: "小数点以下桁数は数値である必要があります",
    })
    .int("小数点以下桁数は整数である必要があります")
    .min(0, "小数点以下桁数は0以上である必要があります")
    .max(5, "小数点以下桁数は5以下である必要があります"),
  isActive: z.boolean(),
});

export type EditRankingItemFormValues = z.infer<typeof editRankingItemSchema>;

interface EditRankingItemFormProps {
  rankingItem: {
    rankingKey: string;
    areaType: "prefecture" | "city" | "national";
    label: string;
    name: string;
    annotation?: string;
    unit: string;
    mapColorScheme: string;
    mapDivergingMidpoint: string;
    rankingDirection: "asc" | "desc";
    conversionFactor: number;
    decimalPlaces: number;
    isActive: boolean;
  };
  onSubmit: (values: EditRankingItemFormValues) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function EditRankingItemForm({
  rankingItem,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: EditRankingItemFormProps) {
  const form = useForm<EditRankingItemFormValues>({
    resolver: zodResolver(editRankingItemSchema),
    defaultValues: {
      label: rankingItem.label,
      name: rankingItem.name,
      annotation: rankingItem.annotation ?? "",
      unit: rankingItem.unit,
      mapColorScheme: rankingItem.mapColorScheme,
      mapDivergingMidpoint: typeof rankingItem.mapDivergingMidpoint === "string"
        ? rankingItem.mapDivergingMidpoint
        : String(rankingItem.mapDivergingMidpoint),
      rankingDirection: rankingItem.rankingDirection,
      conversionFactor: rankingItem.conversionFactor,
      decimalPlaces: rankingItem.decimalPlaces,
      isActive: rankingItem.isActive,
    },
  });

  // デバッグ用: フォームの初期値をログ出力
  React.useEffect(() => {
    console.log("📝 フォームの初期値:", form.getValues());
    console.log("📝 rankingItem:", rankingItem);
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log("🔵 フォーム送信開始");
    const currentValues = form.getValues();
    console.log("🔵 フォームの現在の値:", currentValues);
    // 型の不一致を確認（バリデーション前）
    Object.entries(currentValues).forEach(([key, value]) => {
      console.log(`  🔵 ${key}: ${typeof value} = ${JSON.stringify(value)}`);
    });
    console.log("🔵 フォームのエラー状態（バリデーション前）:", form.formState.errors);
    
    // バリデーションを手動で実行（全フィールド）
    const isValid = await form.trigger();
    console.log("🔵 バリデーション結果:", isValid);
    console.log("🔵 フォームのエラー状態（バリデーション後）:", form.formState.errors);
    
    if (!isValid) {
      console.error("❌ バリデーション失敗");
      console.error("❌ エラーオブジェクト全体:", JSON.stringify(form.formState.errors, null, 2));
      
      // 各フィールドのエラーを詳細にログ出力
      const errors = form.formState.errors;
      if (Object.keys(errors).length === 0) {
        console.error("❌ エラーオブジェクトが空です。form.trigger()の結果を確認してください。");
        // 各フィールドを個別にバリデーション
        const fields = [
          'label', 'name', 'annotation', 'unit', 
          'mapColorScheme', 'mapDivergingMidpoint', 'rankingDirection',
          'conversionFactor', 'decimalPlaces', 'isActive'
        ];
        for (const field of fields) {
          const fieldError = await form.trigger(field as any);
          if (!fieldError) {
            const fieldErrors = form.formState.errors[field as keyof typeof form.formState.errors];
            if (fieldErrors) {
              console.error(`❌ フィールド "${field}" のエラー:`, fieldErrors);
            }
          }
        }
      } else {
        Object.entries(errors).forEach(([fieldName, error]) => {
          console.error(`❌ フィールド "${fieldName}" のエラー:`, {
            message: error?.message,
            type: error?.type,
            error: error,
            raw: JSON.stringify(error),
          });
        });
      }
      
      // フォームの現在の値を確認
      const values = form.getValues();
      console.error("❌ フォームの現在の値（詳細）:", values);
      // 型の不一致を確認
      Object.entries(values).forEach(([key, value]) => {
        console.error(`  ❌ ${key}: ${typeof value} = ${JSON.stringify(value)} (${value === null ? 'null' : value === undefined ? 'undefined' : 'has value'})`);
      });
      return;
    }
    
    const values = form.getValues();
    console.log("✅ フォーム送信値（バリデーション通過）:", values);
    
    try {
      await onSubmit(values);
    } catch (error) {
      console.error("❌ onSubmitエラー:", error);
      throw error;
    }
  };

  // 色スキームオプション（グループ化）
  const colorSchemeGroups = [
    {
      label: "単色グラデーション",
      options: [
        { value: "interpolateBlues", label: "青" },
        { value: "interpolateGreens", label: "緑" },
        { value: "interpolateGreys", label: "グレー" },
        { value: "interpolateOranges", label: "オレンジ" },
        { value: "interpolatePurples", label: "紫" },
        { value: "interpolateReds", label: "赤" },
      ],
    },
    {
      label: "多色グラデーション",
      options: [
        { value: "interpolateViridis", label: "Viridis" },
        { value: "interpolatePlasma", label: "Plasma" },
        { value: "interpolateInferno", label: "Inferno" },
        { value: "interpolateMagma", label: "Magma" },
        { value: "interpolateTurbo", label: "Turbo" },
        { value: "interpolateCool", label: "Cool" },
        { value: "interpolateWarm", label: "Warm" },
      ],
    },
    {
      label: "発散カラースケール",
      options: [
        { value: "interpolateBrBG", label: "茶→青緑" },
        { value: "interpolatePRGn", label: "紫→緑" },
        { value: "interpolatePiYG", label: "ピンク→黄緑" },
        { value: "interpolatePuOr", label: "紫→オレンジ" },
        { value: "interpolateRdBu", label: "赤→青" },
        { value: "interpolateRdGy", label: "赤→グレー" },
        { value: "interpolateRdYlBu", label: "赤→黄→青" },
        { value: "interpolateRdYlGn", label: "赤→黄→緑" },
        { value: "interpolateSpectral", label: "スペクトラル" },
      ],
    },
  ];

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        {/* 基本情報 */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
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
          </div>

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

        {/* 可視化設定 */}
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="mapColorScheme"
            render={({ field }) => (
              <FormItem>
                <FormLabel>色スキーム *</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="色スキームを選択" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {colorSchemeGroups.map((group, groupIndex) => (
                      <React.Fragment key={group.label}>
                        {groupIndex > 0 && <SelectSeparator />}
                        <SelectGroup>
                          <SelectLabel>{group.label}</SelectLabel>
                          {group.options.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </React.Fragment>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>コロプレスマップの色スキーム</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="mapDivergingMidpoint"
            render={({ field }) => (
              <FormItem>
                <FormLabel>分岐点設定 *</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    value={field.value}
                    className="flex flex-row flex-wrap gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="zero" id="midpoint-zero" />
                      <Label htmlFor="midpoint-zero" className="text-sm">
                        ゼロ
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="mean" id="midpoint-mean" />
                      <Label htmlFor="midpoint-mean" className="text-sm">
                        平均値
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="median" id="midpoint-median" />
                      <Label htmlFor="midpoint-median" className="text-sm">
                        中央値
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="custom" id="midpoint-custom" />
                      <Label htmlFor="midpoint-custom" className="text-sm">
                        カスタム値
                      </Label>
                    </div>
                  </RadioGroup>
                </FormControl>
                <FormDescription>色の分岐点を設定</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="rankingDirection"
            render={({ field }) => (
              <FormItem>
                <FormLabel>ランキング方向 *</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    value={field.value}
                    className="flex flex-row flex-wrap gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="desc" id="direction-desc" />
                      <Label htmlFor="direction-desc" className="text-sm">
                        降順（大きい順）
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="asc" id="direction-asc" />
                      <Label htmlFor="direction-asc" className="text-sm">
                        昇順（小さい順）
                      </Label>
                    </div>
                  </RadioGroup>
                </FormControl>
                <FormDescription>ランキングの並び順</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="conversionFactor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>変換係数</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.0001"
                      min="0.0001"
                      max="1000000"
                      value={field.value ?? ""}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === "") {
                          // 空文字列の場合は既存の値を保持
                          return;
                        }
                        const numValue = parseFloat(value);
                        if (!isNaN(numValue) && numValue > 0) {
                          field.onChange(numValue);
                        }
                      }}
                      onBlur={field.onBlur}
                    />
                  </FormControl>
                  <FormDescription>表示用に値を変換する係数</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="decimalPlaces"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>小数点以下桁数</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      max="5"
                      value={field.value ?? ""}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === "") {
                          // 空文字列の場合は既存の値を保持
                          return;
                        }
                        const intValue = parseInt(value, 10);
                        if (!isNaN(intValue) && intValue >= 0 && intValue <= 5) {
                          field.onChange(intValue);
                        }
                      }}
                      onBlur={field.onBlur}
                    />
                  </FormControl>
                  <FormDescription>表示時の小数点以下の桁数</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* ステータス */}
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

        {/* ボタン */}
        <div className="flex justify-end gap-2 pt-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            キャンセル
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90 disabled:opacity-50"
          >
            {isSubmitting ? "保存中..." : "保存"}
          </button>
        </div>
      </form>
    </Form>
  );
}

