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
import { Label } from "@/components/atoms/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/atoms/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/atoms/ui/select";

const visualizationSchema = z.object({
  mapColorScheme: z.string().min(1),
  mapDivergingMidpoint: z.string(),
  rankingDirection: z.enum(["asc", "desc"]),
  conversionFactor: z.number().min(0.0001).max(1000000),
  decimalPlaces: z.number().min(0).max(5),
});

type VisualizationFormValues = z.infer<typeof visualizationSchema>;

interface VisualizationFormProps {
  item?: any;
}

export function VisualizationForm({ item }: VisualizationFormProps) {
  const form = useForm<VisualizationFormValues>({
    resolver: zodResolver(visualizationSchema),
    defaultValues: {
      mapColorScheme: item?.mapColorScheme || "interpolateBlues",
      mapDivergingMidpoint: item?.mapDivergingMidpoint || "zero",
      rankingDirection: item?.rankingDirection || "desc",
      conversionFactor: item?.conversionFactor ?? 1,
      decimalPlaces: item?.decimalPlaces ?? 0,
    },
  });

  const onSubmit = (values: VisualizationFormValues) => {
    console.log("可視化設定フォーム送信:", values);
    // TODO: API呼び出し
  };

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
      <div className="space-y-4">
        <FormField
          control={form.control}
          name="mapColorScheme"
          render={({ field }) => (
            <FormItem>
              <FormLabel>色スキーム *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="zero" id="midpoint-zero" />
                    <Label htmlFor="midpoint-zero">ゼロ</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="mean" id="midpoint-mean" />
                    <Label htmlFor="midpoint-mean">平均値</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="median" id="midpoint-median" />
                    <Label htmlFor="midpoint-median">中央値</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="custom" id="midpoint-custom" />
                    <Label htmlFor="midpoint-custom">カスタム値</Label>
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
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="desc" id="direction-desc" />
                    <Label htmlFor="direction-desc">降順（大きい順）</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="asc" id="direction-asc" />
                    <Label htmlFor="direction-asc">昇順（小さい順）</Label>
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
    </Form>
  );
}
