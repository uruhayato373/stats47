import React from "react";

import Link from "next/link";

import { Button } from "@/components/atoms/ui/button";

/**
 * NotFoundMessage - 汎用エラーメッセージ表示コンポーネント
 *
 * 404エラーや「見つかりません」系のメッセージを統一的に表示するための
 * 再利用可能なコンポーネントです。
 *
 * 機能:
 * - カスタマイズ可能なタイトルとメッセージ
 * - オプションのアイコン表示
 * - カスタマイズ可能なボタンテキストとリンク先
 * - レスポンシブデザイン対応
 *
 * 使用例:
 * ```tsx
 * <NotFoundMessage
 *   title="カテゴリが見つかりません"
 *   message={`指定されたカテゴリ「${category}」は存在しません。`}
 *   buttonText="トップページに戻る"
 *   buttonHref="/"
 * />
 * ```
 */
export interface NotFoundMessageProps {
  /** エラータイトル（例: "カテゴリが見つかりません"） */
  title: string;
  /** エラーメッセージ（文字列またはReact要素） */
  message: string | React.ReactNode;
  /** ボタンテキスト（デフォルト: "トップページに戻る"） */
  buttonText?: string;
  /** ボタンリンク先（デフォルト: "/"） */
  buttonHref?: string;
  /** カスタムアイコン（オプション） */
  icon?: React.ReactNode;
  /** 追加のクラス名 */
  className?: string;
}

export const NotFoundMessage: React.FC<NotFoundMessageProps> = ({
  title,
  message,
  buttonText = "トップページに戻る",
  buttonHref = "/",
  icon,
  className = "",
}) => {
  return (
    <div className={`container mx-auto px-4 py-8 ${className}`}>
      <div className="text-center">
        {/* アイコン表示（オプション） */}
        {icon && <div className="flex justify-center mb-4">{icon}</div>}

        {/* タイトル */}
        <h1 className="text-2xl font-bold text-foreground mb-4">{title}</h1>

        {/* メッセージ */}
        <p className="text-muted-foreground mb-6">{message}</p>

        {/* ボタン */}
        <Button asChild>
          <Link href={buttonHref}>{buttonText}</Link>
        </Button>
      </div>
    </div>
  );
};
