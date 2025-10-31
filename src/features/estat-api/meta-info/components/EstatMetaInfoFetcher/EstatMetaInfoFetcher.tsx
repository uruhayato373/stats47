"use client";

import { memo } from "react";

import { useRouter } from "next/navigation";

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
 * EstatMetaInfoFetcherProps - e-Statメタ情報取得フォームのプロパティ
 */
interface EstatMetaInfoFetcherProps {
  /** 送信成功後に入力フィールドをクリアするかどうか（デフォルト: false） */
  clearOnSuccess?: boolean;
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
}: EstatMetaInfoFetcherProps) {
  const router = useRouter();
  // ===== react-hook-formの設定 =====

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      statsDataId: "",
    },
  });

  // ===== イベントハンドラー =====

  /**
   * フォーム送信時の処理
   * @param values - フォームの値
   */
  const handleSubmit = (values: FormValues) => {
    // URLを更新してデータ取得をトリガー
    router.push(
      `/admin/dev-tools/estat-api/meta-info?statsId=${values.statsDataId}`
    );

    // オプション: 送信成功後に入力フィールドをクリア
    if (clearOnSuccess) {
      form.reset();
    }
  };

  // ===== レンダリング =====

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="w-full">
        <FormField
          control={form.control}
          name="statsDataId"
          render={({ field }) => (
            <FormItem className="space-y-1">
              <FormLabel>統計表ID</FormLabel>
              <div className="flex flex-row gap-2">
                {/* 統計表ID入力フィールド */}
                <FormControl>
                  <Input
                    placeholder="0000010101"
                    {...field}
                    className="h-8 w-40"
                  />
                </FormControl>
                {/* 送信ボタン */}
                <Button
                  type="submit"
                  disabled={!form.formState.isValid}
                  size="sm"
                  className="px-4"
                >
                  取得
                </Button>
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
