"use client";

import React from "react";
import { HeaderLogo } from "./HeaderLogo";
import { HeaderActions } from "./HeaderActions";
import { AuthModal } from "@/components/organisms/auth/AuthModal";
import { useAuthModal } from "@/hooks/useAuthModal";

/**
 * ヘッダーメインコンテナコンポーネント
 */
export default function Header() {
  const { isOpen, close } = useAuthModal();

  return (
    <>
      <header className="fixed top-0 inset-x-0 flex flex-wrap md:justify-start md:flex-nowrap z-60 w-full bg-zinc-100 text-sm py-2.5 dark:bg-neutral-900">
        <nav className="px-4 sm:px-5.5 flex basis-full items-center w-full mx-auto">
          <div className="w-full flex items-center gap-x-1.5">
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
