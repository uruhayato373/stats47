"use client";

import { useSession } from "next-auth/react";

import { useAuthModal } from "../../hooks";

import { AuthModal } from "../AuthModal";
import { LoginButton } from "../LoginButton";
import { UserMenu } from "../UserMenu";

/**
 * ヘッダー認証セクション
 * 認証状態に応じてログインボタンまたはユーザーメニューを表示
 */
export function HeaderAuthSection() {
  const { data: session, status } = useSession();
  const { isOpen, open, close } = useAuthModal();

  const isAuthenticated = status === "authenticated";

  return (
    <>
      {isAuthenticated ? (
        <UserMenu
          user={{
            ...session.user,
            name: session.user.name ?? undefined,
            email: session.user.email ?? undefined,
            role: session.user.role ?? undefined,
          }}
        />
      ) : (
        <LoginButton onClick={open} />
      )}
      {isOpen && <AuthModal isOpen={isOpen} onClose={close} />}
    </>
  );
}
