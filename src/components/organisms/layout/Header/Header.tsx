"use client";

import React from "react";
import { HeaderLogo } from "./HeaderLogo";
import { HeaderActions } from "./HeaderActions";
import { AuthModal } from "@/components/organisms/auth/AuthModal";
import { useAuthModal } from "@/hooks/useAuthModal";
import { SidebarTrigger } from "@/components/atoms/ui/sidebar";

/**
 * ヘッダーメインコンテナコンポーネント
 */
export default function Header() {
  const { isOpen, close } = useAuthModal();

  return (
    <>
      <header className="sticky top-0 z-[60] w-full flex flex-wrap md:justify-start md:flex-nowrap bg-zinc-100 text-sm py-2.5 dark:bg-neutral-900 border-b border-gray-200 dark:border-neutral-700">
        <nav className="px-4 sm:px-5.5 flex basis-full items-center w-full mx-auto">
          <div className="w-full flex items-center gap-x-1.5">
            <SidebarTrigger />
            <HeaderLogo />
          </div>
          <HeaderActions />
        </nav>
      </header>

      {/* 認証モーダル */}
      <AuthModal
        isOpen={isOpen}
        onClose={close}
      />
    </>
  );
}
