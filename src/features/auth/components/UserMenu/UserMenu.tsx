"use client";

import Link from "next/link";

import { ChevronDown, LogOut, User } from "lucide-react";
import { signOut } from "next-auth/react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/atoms/ui/dropdown-menu";


interface UserMenuProps {
  user: {
    username?: string;
    name?: string;
    email?: string;
    role?: string;
  };
}

/**
 * ユーザーメニューコンポーネント
 * 認証済みユーザーのドロップダウンメニュー
 */
export function UserMenu({ user }: UserMenuProps) {
  const isAdmin = user.role === "admin";

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-x-2 px-3 py-2 text-sm rounded-lg hover:bg-accent transition-colors">
          <User className="size-4 text-muted-foreground" />
          <span className="hidden sm:inline text-muted-foreground">
            {user.username || user.name}
          </span>
          <ChevronDown className="size-3 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>
          <p className="text-sm font-medium">{user.username || user.name}</p>
          <p className="text-xs text-muted-foreground">{user.email}</p>
          {isAdmin && <p className="text-xs text-primary">管理者</p>}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile">プロフィール</Link>
        </DropdownMenuItem>
        {isAdmin && (
          <DropdownMenuItem asChild>
            <Link href="/admin">管理画面</Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="size-4 mr-2" />
          <span>ログアウト</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
