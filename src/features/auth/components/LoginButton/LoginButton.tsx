"use client";

import { LogIn } from "lucide-react";

interface LoginButtonProps {
  onClick: () => void;
}

/**
 * ログインボタンコンポーネント
 * ヘッダーやその他の場所でログインモーダルを開くためのボタン
 */
export function LoginButton({ onClick }: LoginButtonProps) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-center p-2 text-sm bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors"
      title="ログイン"
    >
      <LogIn className="size-4" />
    </button>
  );
}
