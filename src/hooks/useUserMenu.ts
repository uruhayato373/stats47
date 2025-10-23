"use client";

import { useState, useRef, useEffect } from "react";

/**
 * ユーザーメニューのドロップダウン状態を管理するカスタムフック
 */
export function useUserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 外部クリックで閉じる
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return {
    isOpen,
    toggle: () => setIsOpen(!isOpen),
    close: () => setIsOpen(false),
    dropdownRef,
  };
}
