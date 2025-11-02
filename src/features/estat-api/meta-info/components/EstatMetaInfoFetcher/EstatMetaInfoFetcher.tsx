"use client";

import { memo, useEffect, useRef } from "react";

import { useRouter, useSearchParams } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
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
 * フォームスキーマ
 *
 * 統計表IDのバリデーションルール:
 * - 必須項目
 * - 10桁の数字のみ許可
 */
const formSchema = z.object({
  statsDataId: z
    .string()
    .min(1, { message: "統計表IDを入力してください" })
    .regex(/^\d{10}$/, { message: "10桁の数字を入力してください" }),
});

type FormValues = z.infer<typeof formSchema>;

/**
 * EstatMetaInfoFetcherのプロパティ
 */
interface EstatMetaInfoFetcherProps {
  /** 送信成功後に入力フィールドをクリアするか（デフォルト: false） */
  clearOnSuccess?: boolean;
  /** 統計表ID（初期値として使用） */
  statsId?: string | null;
  /** データ取得元（'r2': R2ストレージ, 'api': e-Stat API） */
  dataSource?: MetaInfoSource | null;
}

/**
 * e-Statメタ情報取得フォームコンポーネント
 *
 * 機能:
 * - 統計表IDの入力フォーム
 * - フォーム送信時のバリデーション
 * - URL更新によるデータ取得
 * - データ取得元のtoast通知表示
 * - 送信成功後の入力クリア（オプション）
 *
 * @example
 * ```tsx
 * <EstatMetaInfoFetcher
 *   clearOnSuccess={true}
 *   statsId="0000010101"
 *   dataSource="r2"
 * />
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

  // 前回のdataSourceを保持（初回表示時のみtoastを表示しないため）
  const prevDataSourceRef = useRef<MetaInfoSource | null | undefined>(
    undefined
  );

  /**
   * statsIdが変更されたらフォームの値を更新
   *
   * 保存後のリフレッシュなどでstatsIdが変更された場合にフォームを同期します。
   */
  useEffect(() => {
    if (statsId) {
      form.setValue("statsDataId", statsId);
    }
  }, [statsId, form]);

  /**
   * データ取得元が変更されたらtoast通知を表示
   *
   * dataSourceが存在し、前回と異なる場合にtoastを表示します。
   * 初回マウント時（prevDataSourceRef.current === undefined）は表示しません。
   */
  useEffect(() => {
    if (dataSource && prevDataSourceRef.current !== undefined) {
      if (dataSource === "r2") {
        toast.success("データ取得完了", {
          description: "R2ストレージから取得しました",
          duration: 3000,
        });
      } else if (dataSource === "api") {
        toast.info("データ取得完了", {
          description: "e-Stat APIから取得しました",
          duration: 3000,
        });
      }
    }
    prevDataSourceRef.current = dataSource;
  }, [dataSource]);

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
