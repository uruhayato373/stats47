"use client";

import { memo } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/atoms/ui/button";
import { Input } from "@/components/atoms/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/organisms/ui/form";



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
  /** 統計表IDが送信された時のコールバック関数 */
  onSubmit: (statsDataId: string) => void;
  /** API通信中のローディング状態 */
  loading?: boolean;
  /** 送信成功後に入力フィールドをクリアするかどうか（デフォルト: false） */
  clearOnSuccess?: boolean;
}

/**
 * EstatMetaInfoFetcher - e-Statメタ情報取得フォームコンポーネント
 *
 * 機能:
 * - 統計表IDの入力フォーム
 * - フォーム送信時のバリデーション
 * - ローディング状態の表示
 * - 送信成功後の入力クリア（オプション）
 *
 * レイアウト:
 * - レスポンシブデザイン（モバイル: 縦並び、デスクトップ: 横並び）
 * - 左側: アイコン + タイトル
 * - 右側: 入力フィールド + 送信ボタン
 *
 * 使用例:
 * ```tsx
 * <EstatMetaInfoFetcher
 *   onSubmit={(statsDataId) => handleFetchMetaInfo(statsDataId)}
 *   loading={isLoading}
 *   clearOnSuccess={true}
 * />
 * ```
 */
const EstatMetaInfoFetcher = memo(function EstatMetaInfoFetcher({
  onSubmit,
  loading,
  clearOnSuccess = false,
}: EstatMetaInfoFetcherProps) {
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
    // 親コンポーネントに統計表IDを渡す
    onSubmit(values.statsDataId);

    // オプション: 送信成功後に入力フィールドをクリア
    if (clearOnSuccess) {
      form.reset();
    }
  };

  // ===== レンダリング =====

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="w-full">
        {/* シンプルなレイアウト */}
        <div className="flex flex-row gap-3 items-end">
          {/* 統計表ID入力フィールド */}
            <FormField
              control={form.control}
              name="statsDataId"
              render={({ field }) => (
                <FormItem className="space-y-1 max-w-xs flex-1">
                  <FormLabel>統計表ID</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="0000010101"
                      disabled={loading}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 送信ボタン */}
            <Button
              type="submit"
              disabled={!form.formState.isValid || loading}
            >
              {loading && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
              {loading ? "取得中" : "取得"}
            </Button>
        </div>
      </form>
    </Form>
  );
});

EstatMetaInfoFetcher.displayName = "EstatMetaInfoFetcher";

export default EstatMetaInfoFetcher;
