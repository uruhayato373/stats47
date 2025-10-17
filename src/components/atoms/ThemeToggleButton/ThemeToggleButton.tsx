"use client";

import React from "react";
import { useTheme } from "@/hooks/useTheme";

export const ThemeToggleButton: React.FC = () => {
  const { theme, mounted, toggleTheme } = useTheme();

  const handleThemeToggle = () => {
    toggleTheme();
  };

  // mounted状態でない場合は、ローディング状態を表示
  if (!mounted) {
    return (
      <button
        type="button"
        disabled
        className="size-8 flex items-center justify-center text-gray-500 rounded-lg border border-gray-200 bg-gray-100 cursor-not-allowed dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-600"
        aria-label="Theme loading"
      >
        <svg
          className="size-4 animate-spin"
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
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleThemeToggle}
      className="size-8 flex items-center justify-center text-gray-600 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 focus:outline-hidden focus:bg-gray-100 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:focus:bg-neutral-700 transition-colors"
      aria-label="Toggle theme"
      title={`Current theme: ${theme}. Click to switch to ${
        theme === "light" ? "dark" : "light"
      }`}
    >
      {theme === "light" ? (
        <svg
          className="size-4"
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
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      ) : (
        <svg
          className="size-4"
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
          <circle cx="12" cy="12" r="4" />
          <path d="m12 1 0 2" />
          <path d="m12 21 0 2" />
          <path d="m4.22 4.22 1.42 1.42" />
          <path d="m18.36 18.36 1.42 1.42" />
          <path d="m1 12 2 0" />
          <path d="m21 12 2 0" />
          <path d="m4.22 19.78 1.42-1.42" />
          <path d="m18.36 5.64 1.42-1.42" />
        </svg>
      )}
    </button>
  );
};
