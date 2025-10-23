"use client";

import React from "react";
import { User, ChevronDown } from "lucide-react";

interface UserMenuButtonProps {
  user: {
    name?: string | null;
    username?: string | null;
  };
  isOpen: boolean;
  onClick: () => void;
}

/**
 * ユーザーメニューを開くボタンコンポーネント
 */
export function UserMenuButton({ user, isOpen, onClick }: UserMenuButtonProps) {
  return (
    <button
      className="flex items-center gap-x-2 px-3 py-2 text-sm rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
      onClick={onClick}
    >
      <User className="size-4 text-gray-600 dark:text-gray-400" />
      <span className="hidden sm:inline text-gray-600 dark:text-gray-400">
        {user?.username || user?.name}
      </span>
      <ChevronDown className="size-3 text-gray-500 dark:text-gray-500" />
    </button>
  );
}
