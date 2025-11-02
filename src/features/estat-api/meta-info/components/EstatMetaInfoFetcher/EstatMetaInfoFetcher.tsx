"use client";

import { memo, useEffect } from "react";

import { useRouter, useSearchParams } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/atoms/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/atoms/ui/form";
import { Input } from "@/components/atoms/ui/input";

import type { MetaInfoSource } from "@/features/estat-api/meta-info";

/**
 * フォームスキーマの定義
 */
const formSchema = z.object({
  statsDataId: z
    .string()
    .min(1, { message: "統計表IDを入力してください" })
    .regex(/^\d{10}$/, { message: "10桁の数字を入力してください" }),
});

type FormValues = z.infer<typeof formSchema>;

/**
 * e-Statメタ情報取得フォームのプロパティ
 */
interface EstatMetaInfoFetcherProps {
  /** 送信成功後に入力フィールドをクリアするかどうか（デフォルト: false） */
  clearOnSuccess?: boolean;
  /** 統計表ID（初期値として使用、オプション） */
  statsId?: string | null;
  /** データ取得元（'r2': R2ストレージ, 'api': e-Stat API） */
  dataSource?: MetaInfoSource | null;
}

/**
 * EstatMetaInfoFetcher - e-Statメタ情報取得フォームコンポーネント
 *
 * 機能:
 * - 統計表IDの入力フォーム
 * - フォーム送信時のバリデーション
 * - URL更新によるデータ取得
 * - 送信成功後の入力クリア（オプション）
 *
 * レイアウト:
 * - レスポンシブデザイン（モバイル: 縦並び、デスクトップ: 横並び）
 * - 入力フィールド + 送信ボタン
 *
 * 使用例:
 * ```tsx
 * <EstatMetaInfoFetcher clearOnSuccess={true} />
 * ```
 */
const EstatMetaInfoFetcher = memo(function EstatMetaInfoFetcher({
  clearOnSuccess = false,
  statsId: statsIdProp,
  dataSource,
}: EstatMetaInfoFetcherProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // propsまたはURLパラメータから統計表IDを取得（props優先）
  const statsId = statsIdProp ?? searchParams.get("statsId");

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      statsDataId: statsId || "",
    },
  });

  /**
   * statsIdが変更されたらフォームの値を更新
   *
   * 保存後のリフレッシュなどでstatsIdが変更された場合にフォームを同期します。
   * statsIdまたはformが変更されたときに実行されます。
   */
  useEffect(() => {
    if (statsId) {
      form.setValue("statsDataId", statsId);
    }
  }, [statsId, form]);

  /**
   * フォーム送信時の処理
   *
   * URLを更新してデータ取得をトリガーし、オプションで入力フィールドをクリアします。
   *
   * @param values - フォームの値
   */
  const handleSubmit = (values: FormValues) => {
    router.push(
      `/admin/dev-tools/estat-api/meta-info?statsId=${values.statsDataId}`
    );

    if (clearOnSuccess) {
      form.reset();
    }
  };

  /**
   * データ取得元のラベルを取得
   *
   * @returns データ取得元のラベル（'r2': "R2ストレージから取得", 'api': "e-Stat APIから取得"）、取得元が未指定の場合はnull
   */
  const getDataSourceLabel = (): string | null => {
    if (!dataSource) return null;
    return dataSource === "r2" ? "R2ストレージから取得" : "e-Stat APIから取得";
  };

  const dataSourceLabel = getDataSourceLabel();

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="w-full">
        <FormField
          control={form.control}
          name="statsDataId"
          render={({ field }) => (
            <FormItem className="space-y-1">
              <FormLabel>統計表ID</FormLabel>
              <div className="flex flex-row items-center gap-2">
                <FormControl>
                  <Input
                    placeholder="0000010101"
                    {...field}
                    className="h-8 w-40"
                  />
                </FormControl>
                <Button
                  type="submit"
                  disabled={!form.formState.isValid}
                  size="sm"
                  className="px-4"
                >
                  取得
                </Button>
                {dataSourceLabel && (
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {dataSourceLabel}
                  </span>
                )}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
});

EstatMetaInfoFetcher.displayName = "EstatMetaInfoFetcher";

export default EstatMetaInfoFetcher;
