"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { ThemeToggleButton } from "@/components/common/ThemeToggleButton";
import { useAuth } from "@/contexts/AuthContext";
import { User, LogOut, LogIn, ChevronDown } from "lucide-react";

export default function Header() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ドロップダウンの外側クリックで閉じる
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  return (
    <header className="fixed top-0 inset-x-0 flex flex-wrap md:justify-start md:flex-nowrap z-60 w-full bg-zinc-100 text-sm py-2.5 dark:bg-neutral-900">
      <nav className="px-4 sm:px-5.5 flex basis-full items-center w-full mx-auto">
        <div className="w-full flex items-center gap-x-1.5">
          <ul className="flex items-center gap-1.5">
            <li className="inline-flex items-center relative text-gray-200 pe-1.5 last:pe-0 last:after:hidden after:absolute after:top-1/2 after:end-0 after:inline-block after:w-px after:h-3.5 after:bg-gray-300 after:rounded-full after:-translate-y-1/2 after:rotate-12 dark:text-neutral-200 dark:after:bg-neutral-700">
              <a
                href="#"
                className="flex items-center gap-x-1.5 text-gray-600 hover:text-gray-800 focus:outline-hidden focus:text-gray-800 dark:text-neutral-400 dark:hover:text-neutral-200 dark:focus:text-neutral-200"
              >
                <div className="bg-indigo-700 size-8 rounded-md flex items-center justify-center">
                  <svg
                    className="size-4 text-white"
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
                <span className="text-gray-900 dark:text-white">
                  統計で見る都道府県
                </span>
              </a>
            </li>
          </ul>
        </div>

        <div className="ms-auto flex items-center gap-x-2">
          <ThemeToggleButton />

          {isAuthenticated ? (
            <div className="relative" ref={dropdownRef}>
              <button
                className="flex items-center gap-x-2 px-3 py-2 text-sm rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                <User className="size-4 text-gray-600 dark:text-gray-400" />
                <span className="hidden sm:inline text-gray-600 dark:text-gray-400">
                  {user?.username}
                </span>
                <ChevronDown className="size-3 text-gray-500 dark:text-gray-500" />
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                  <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {user?.username}
                    </p>
                    {isAdmin && (
                      <p className="text-xs text-indigo-600 dark:text-indigo-400">
                        管理者
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      logout();
                      setIsDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-x-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <LogOut className="size-4" />
                    <span>ログアウト</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="flex items-center justify-center p-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
              title="ログイン"
            >
              <LogIn className="size-4" />
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
