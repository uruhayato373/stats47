"use client";

import React from "react";

/**
 * ヘッダーのロゴ部分コンポーネント
 */
export function HeaderLogo() {
  return (
    <ul className="flex items-center gap-1.5">
      <li className="inline-flex items-center relative text-gray-200 pe-1.5 last:pe-0 last:after:hidden after:absolute after:top-1/2 after:end-0 after:inline-block after:w-px after:h-3.5 after:bg-gray-300 after:rounded-full after:-translate-y-1/2 after:rotate-12 dark:text-neutral-200 dark:after:bg-neutral-700">
        <a
          href="#"
          className="flex items-center gap-x-1.5 text-gray-600 hover:text-gray-800 focus:outline-hidden focus:text-gray-800 dark:text-neutral-400 dark:hover:text-neutral-200 dark:focus:text-neutral-200"
        >
          <div className="bg-primary size-8 rounded-md flex items-center justify-center">
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
  );
}
