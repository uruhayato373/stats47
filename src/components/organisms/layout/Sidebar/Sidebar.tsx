"use client";

import { useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getCategoriesForSidebar } from "@/lib/category";
import { CategoryIcon } from "@/components/atoms/CategoryIcon";

export default function Sidebar() {
  const pathname = usePathname();

  // カテゴリデータをメモ化
  const categories = useMemo(() => getCategoriesForSidebar(), []);

  // ナビゲーションアイテムをメモ化
  const navigationItems = useMemo(
    () => ({
      home: [
        {
          href: "/",
          label: "Dashboard",
          icon: (
            <svg
              className="size-3.5"
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
              <rect width="7" height="9" x="3" y="3" rx="1" />
              <rect width="7" height="5" x="14" y="3" rx="1" />
              <rect width="7" height="9" x="14" y="12" rx="1" />
              <rect width="7" height="5" x="3" y="16" rx="1" />
            </svg>
          ),
          isActive: true,
        },
      ],
      estat: [
        {
          href: "/admin/dev-tools/estat-api/meta-info",
          label: "メタ情報",
          icon: (
            <svg
              className="size-3.5"
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
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14,2 14,8 20,8" />
              <path d="m15 15-3-3 3-3" />
              <path d="M4 12h10" />
            </svg>
          ),
          isActive: false,
        },
        {
          href: "/admin/dev-tools/estat-api/stats-data",
          label: "統計データ",
          icon: (
            <svg
              className="size-3.5"
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
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          ),
          isActive: false,
        },
        {
          href: "/admin/dev-tools/estat-api/stats-list",
          label: "統計表リスト",
          icon: (
            <svg
              className="size-3.5"
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
              <path d="M8 3v3a2 2 0 0 1-2 2H3" />
              <path d="M21 8h-3a2 2 0 0 1-2-2V3" />
              <path d="M3 16h3a2 2 0 0 1 2 2v3" />
              <path d="M16 21v-3a2 2 0 0 1 2-2h3" />
            </svg>
          ),
          isActive: false,
        },
      ],
    }),
    []
  );

  // セクションのスタイルをメモ化
  const sectionStyles = useMemo(
    () => ({
      container:
        "pt-3 mt-3 flex flex-col border-t border-gray-200 dark:border-neutral-700 light:border-gray-200",
      title: `block ps-2.5 mb-2 font-medium text-xs uppercase text-gray-600 dark:text-neutral-400 light:text-gray-600`,
      list: `flex flex-col gap-y-1`,
      link: {
        active: `w-full flex items-center gap-x-2 py-2 px-2.5 text-sm text-gray-900 bg-gray-200 rounded-lg hover:bg-gray-200 focus:outline-hidden focus:bg-gray-200 dark:text-white dark:bg-neutral-700 dark:hover:bg-neutral-700 dark:focus:bg-neutral-700 light:text-gray-900 light:bg-gray-200 light:hover:bg-gray-200 light:focus:bg-gray-200`,
        inactive: `w-full flex items-center gap-x-2 py-2 px-2.5 text-sm text-gray-700 rounded-lg hover:bg-gray-200 hover:text-gray-900 focus:outline-hidden focus:bg-gray-200 focus:text-gray-900 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:hover:text-white dark:focus:bg-neutral-700 dark:focus:text-white light:text-gray-700 light:hover:bg-gray-200 light:hover:text-gray-900 light:focus:bg-gray-200 light:focus:text-gray-900`,
      },
    }),
    []
  );

  return (
    <div
      id="sidebar"
      className="w-60 fixed inset-y-0 z-50 start-0 bg-gray-100 border-e border-gray-200 lg:block lg:translate-x-0 -translate-x-full transition-all duration-300 dark:bg-neutral-900 dark:border-neutral-700 light:bg-gray-50 light:border-gray-200"
      style={{ top: "52px" }} // ヘッダーの高さ分下げる
    >
      <nav className="p-3 size-full flex flex-col overflow-y-auto">
        <button
          type="button"
          className="p-1.5 ps-2.5 w-full inline-flex items-center gap-x-2 text-sm font-medium rounded-lg bg-white border border-gray-200 text-gray-800 shadow-xs hover:bg-gray-50 focus:outline-hidden focus:bg-gray-50 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:focus:bg-neutral-700"
        >
          <svg
            className="size-3.5"
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
            <circle cx="12" cy="12" r="1" />
            <circle cx="19" cy="12" r="1" />
            <circle cx="5" cy="12" r="1" />
          </svg>
          <span className="text-gray-500 dark:text-neutral-400">
            Quick actions
          </span>
          <svg
            className="ms-auto size-2.5"
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
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>

        <div className={sectionStyles.container}>
          <span className={sectionStyles.title}>Home</span>
          <ul className={sectionStyles.list}>
            {navigationItems.home.map((item) => (
              <li key={item.href}>
                <Link
                  className={
                    item.isActive
                      ? sectionStyles.link.active
                      : sectionStyles.link.inactive
                  }
                  href={item.href}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className={sectionStyles.container}>
          <span className={sectionStyles.title}>e-STAT API</span>
          <ul className={sectionStyles.list}>
            {navigationItems.estat.map((item) => (
              <li key={item.href}>
                <Link
                  className={
                    item.isActive
                      ? sectionStyles.link.active
                      : sectionStyles.link.inactive
                  }
                  href={item.href}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className={sectionStyles.container}>
          <span className={sectionStyles.title}>統計カテゴリー</span>
          <ul className={sectionStyles.list}>
            {categories.map((category) => {
              const isActive =
                pathname === category.href ||
                pathname?.startsWith(`${category.href}/`);

              return (
                <li key={category.id}>
                  <Link
                    className={
                      isActive
                        ? sectionStyles.link.active
                        : sectionStyles.link.inactive
                    }
                    href={category.href}
                  >
                    <CategoryIcon
                      iconName={category.icon}
                      className="size-3.5"
                    />
                    <span>{category.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>
    </div>
  );
}
