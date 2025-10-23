"use client";

import React from "react";
import { LogIn, Moon, Sun } from "lucide-react";
import { useSession } from "next-auth/react";
import { Toggle } from "@/components/atoms/ui/toggle";
import { UserMenu } from "./UserMenu";
import { useAuthModal } from "@/hooks/useAuthModal";
import { useTheme } from "@/hooks/useTheme";

/**
 * ヘッダーの右側アクション部分コンポーネント
 */
export function HeaderActions() {
  const { status } = useSession();
  const { open } = useAuthModal();
  const { theme, setTheme } = useTheme();

  const isAuthenticated = status === "authenticated";

  return (
    <div className="ms-auto flex items-center gap-x-2">
      <Toggle
        pressed={theme === "dark"}
        onPressedChange={(pressed) => setTheme(pressed ? "dark" : "light")}
        variant="outline"
        size="sm"
        aria-label="Toggle theme"
      >
        {theme === "light" ? (
          <Moon className="size-4" />
        ) : (
          <Sun className="size-4" />
        )}
      </Toggle>

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
