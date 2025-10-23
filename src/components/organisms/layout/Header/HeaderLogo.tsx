"use client";

import React from "react";

/**
 * ヘッダーのロゴ部分コンポーネント
 * 
 * shadcn/uiのテーマシステムを使用して自動的にテーマが切り替わります。
 */
export function HeaderLogo() {
  return (
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
  );
}
