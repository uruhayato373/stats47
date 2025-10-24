"use client";

import { Button } from "@/components/atoms/ui/button";
import { Loader2 } from "lucide-react";
import { useTransition } from "react";
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
          ? "text-red-600 hover:text-red-900"
          : "text-green-600 hover:text-green-900"
      }
    >
      {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {isActive ? "無効化" : "有効化"}
    </Button>
  );
}
