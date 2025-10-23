"use client";

import { ChevronDown, LogIn, LogOut, Moon, Sun, User } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/atoms/ui/dropdown-menu";
import { SidebarTrigger } from "@/components/atoms/ui/sidebar";
import { Toggle } from "@/components/atoms/ui/toggle";
import { AuthModal } from "@/components/organisms/auth/AuthModal";
import { useAuthModal } from "@/hooks/useAuthModal";
import { useTheme } from "@/hooks/useTheme";

/**
 * アプリケーションヘッダーコンポーネント
 * ロゴ、テーマ切り替え、認証UI（ログインボタン/ユーザーメニュー）を提供
 */
export default function Header() {
  const { data: session, status } = useSession();
  const { isOpen, open, close } = useAuthModal();
  const { theme, setTheme } = useTheme();

  const user = session?.user;
  const isAuthenticated = status === "authenticated";
  const isAdmin = user?.role === "admin";

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <>
      <header className="sticky top-0 z-[60] w-full flex flex-wrap md:justify-start md:flex-nowrap bg-background text-sm py-2.5 border-b border-border">
        <nav className="px-4 sm:px-5.5 flex basis-full items-center w-full mx-auto">
          {/* Left: Sidebar Trigger + Logo */}
          <div className="w-full flex items-center gap-x-1.5">
            <SidebarTrigger />
            
            {/* Logo */}
            <ul className="flex items-center gap-1.5">
              <li className="inline-flex items-center relative pe-1.5 last:pe-0 last:after:hidden after:absolute after:top-1/2 after:end-0 after:inline-block after:w-px after:h-3.5 after:bg-border after:rounded-full after:-translate-y-1/2 after:rotate-12">
                <a
                  href="#"
                  className="flex items-center gap-x-1.5 text-muted-foreground hover:text-foreground focus:outline-hidden focus:text-foreground transition-colors"
                >
                  <div className="size-8 rounded-md flex items-center justify-center bg-primary hover:bg-primary/90 transition-colors">
                    <svg
                      className="size-4 text-primary-foreground"
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                      <polyline points="9,22 9,12 15,12 15,22" />
                    </svg>
                  </div>
                  <span className="text-foreground font-medium">
                    統計で見る都道府県
                  </span>
                </a>
              </li>
            </ul>
          </div>

          {/* Right: Theme Toggle + Auth Actions */}
          <div className="ms-auto flex items-center gap-x-2">
            {/* Theme Toggle */}
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

            {/* User Menu or Login Button */}
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-x-2 px-3 py-2 text-sm rounded-lg hover:bg-accent transition-colors">
                    <User className="size-4 text-muted-foreground" />
                    <span className="hidden sm:inline text-muted-foreground">
                      {user?.username || user?.name}
                    </span>
                    <ChevronDown className="size-3 text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>
                    <p className="text-sm font-medium">{user?.username || user?.name}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
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
        </nav>
      </header>

      {/* Auth Modal */}
      {isOpen && <AuthModal isOpen={isOpen} onClose={close} />}
    </>
  );
}
