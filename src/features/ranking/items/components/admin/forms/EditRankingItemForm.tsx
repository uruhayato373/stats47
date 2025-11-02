"use client";

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
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/atoms/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/atoms/ui/radio-group";
import { Label } from "@/components/atoms/ui/label";

const editRankingItemSchema = z.object({
  label: z.string().min(1, "表示ラベルは必須です").max(50),
  name: z.string().min(1, "項目名は必須です").max(100),
  annotation: z.string().max(500).optional(),
  unit: z.string().min(1, "単位は必須です").max(20),
  mapColorScheme: z.string().min(1),
  mapDivergingMidpoint: z.string(),
  rankingDirection: z.enum(["asc", "desc"]),
  conversionFactor: z.number().min(0.0001).max(1000000),
  decimalPlaces: z.number().min(0).max(5),
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
      mapDivergingMidpoint: rankingItem.mapDivergingMidpoint,
      rankingDirection: rankingItem.rankingDirection,
      conversionFactor: rankingItem.conversionFactor,
      decimalPlaces: rankingItem.decimalPlaces,
      isActive: rankingItem.isActive,
    },
  });

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit(values);
  });

  const mapColorSchemeOptions = [
    { value: "interpolateBlues", label: "青" },
    { value: "interpolateReds", label: "赤" },
    { value: "interpolateGreens", label: "緑" },
    { value: "interpolateViridis", label: "Viridis" },
    { value: "interpolateInferno", label: "Inferno" },
    { value: "interpolateYlOrRd", label: "黄→赤" },
  ];

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-6">
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
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="色スキームを選択" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {mapColorSchemeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
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
                    defaultValue={field.value}
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
                    defaultValue={field.value}
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
                      {...field}
                      value={field.value}
                      onChange={(e) =>
                        field.onChange(parseFloat(e.target.value) || 1)
                      }
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
                      {...field}
                      value={field.value}
                      onChange={(e) =>
                        field.onChange(parseInt(e.target.value, 10) || 0)
                      }
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

