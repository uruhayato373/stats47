"use client";

import React from "react";
import { User, ChevronDown } from "lucide-react";
import { useSession } from "next-auth/react";
import { UserMenuButton } from "./UserMenuButton";
import { UserMenuDropdown } from "./UserMenuDropdown";
import { useUserMenu } from "../hooks";

/**
 * ユーザーメニューのコンテナコンポーネント
 */
export function UserMenu() {
  const { data: session } = useSession();
  const { isOpen, toggle, close, dropdownRef } = useUserMenu();

  if (!session?.user) {
    return null;
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <UserMenuButton
        user={session.user}
        isOpen={isOpen}
        onClick={toggle}
      />
      {isOpen && (
        <UserMenuDropdown
          user={session.user}
          onClose={close}
        />
      )}
    </div>
  );
}
