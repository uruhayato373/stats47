"use client";

import React from "react";
import Link from "next/link";
import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

interface UserMenuDropdownProps {
  user: {
    name?: string | null;
    username?: string | null;
    email?: string | null;
    role?: string | null;
  };
  onClose: () => void;
}

/**
 * ユーザーメニューのドロップダウン内容コンポーネント
 */
export function UserMenuDropdown({ user, onClose }: UserMenuDropdownProps) {
  const isAdmin = user?.role === "admin";

  const handleLogout = async () => {
    await signOut();
    onClose();
  };

  return (
    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <p className="text-sm font-medium text-gray-900 dark:text-white">
          {user?.username || user?.name}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {user?.email}
        </p>
        {isAdmin && (
          <p className="text-xs text-primary dark:text-primary">
            管理者
          </p>
        )}
      </div>
      <div className="py-1">
        <Link
          href="/profile"
          className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          onClick={onClose}
        >
          プロフィール
        </Link>
        {isAdmin && (
          <Link
            href="/admin"
            className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            onClick={onClose}
          >
            管理画面
          </Link>
        )}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-x-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <LogOut className="size-4" />
          <span>ログアウト</span>
        </button>
      </div>
    </div>
  );
}
