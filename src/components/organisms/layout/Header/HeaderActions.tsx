"use client";

import React from "react";
import { LogIn } from "lucide-react";
import { useSession } from "next-auth/react";
import { ThemeToggleButton } from "@/components/atoms/ThemeToggleButton";
import { UserMenu } from "./UserMenu";
import { useAuthModal } from "./hooks";

/**
 * ヘッダーの右側アクション部分コンポーネント
 */
export function HeaderActions() {
  const { status } = useSession();
  const { open } = useAuthModal();

  const isAuthenticated = status === "authenticated";

  return (
    <div className="ms-auto flex items-center gap-x-2">
      <ThemeToggleButton />

      {isAuthenticated ? (
        <UserMenu />
      ) : (
        <button
          onClick={open}
          className="flex items-center justify-center p-2 text-sm bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors"
          title="ログイン"
        >
          <LogIn className="size-4" />
        </button>
      )}
    </div>
  );
}
