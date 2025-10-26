"use client";

import { useTransition } from "react";

import { Loader2 } from "lucide-react";

import { Button } from "@/components/atoms/ui/button";

import { toggleUserStatusAction } from "../actions";

interface UserToggleButtonProps {
  userId: string;
  isActive: boolean;
}

export function UserToggleButton({ userId, isActive }: UserToggleButtonProps) {
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    startTransition(async () => {
      const result = await toggleUserStatusAction(userId, isActive);

      if (!result.success) {
        console.error("ユーザー状態更新エラー:", result.error);
        // エラーハンドリング（必要に応じてtoastなどで表示）
      }
    });
  };

  return (
    <Button
      onClick={handleToggle}
      disabled={isPending}
      variant="ghost"
      size="sm"
      className={
        isActive
          ? "text-destructive hover:text-destructive/80"
          : "text-primary hover:text-primary/80"
      }
    >
      {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {isActive ? "無効化" : "有効化"}
    </Button>
  );
}
