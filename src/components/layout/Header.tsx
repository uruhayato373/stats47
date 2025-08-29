"use client";

import { useTheme } from "../../contexts/ThemeContext";

export default function Header() {
  const { theme, toggleTheme, mounted } = useTheme();

  const handleThemeToggle = () => {
    if (process.env.NODE_ENV === "development") {
      console.log("Theme toggle button clicked, current theme:", theme);
    }
    toggleTheme();
  };

  // mounted状態でない場合は、テーマ切り替えボタンを無効化
  if (!mounted) {
    return (
      <header className="fixed top-0 inset-x-0 flex flex-wrap md:justify-start md:flex-nowrap z-60 w-full bg-zinc-100 text-sm py-2.5 dark:bg-neutral-900">
        <nav className="px-4 sm:px-5.5 flex basis-full items-center w-full mx-auto">
          <div className="w-full flex items-center gap-x-1.5">
            <ul className="flex items-center gap-1.5">
              <li className="inline-flex items-center relative text-gray-200 pe-1.5 last:pe-0 last:after:hidden after:absolute after:top-1/2 after:end-0 after:inline-block after:w-px after:h-3.5 after:bg-gray-300 after:rounded-full after:-translate-y-1/2 after:rotate-12 dark:text-neutral-200 dark:after:bg-neutral-700">
                <a
                  href="#"
                  className="flex items-center gap-x-1.5 text-gray-500 hover:text-gray-800 focus:outline-hidden focus:text-gray-800 dark:text-neutral-400 dark:hover:text-neutral-200 dark:focus:text-neutral-200"
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
                  CMS
                </a>
              </li>
              <li className="inline-flex items-center relative text-gray-200 pe-1.5 last:pe-0 last:after:hidden after:absolute after:top-1/2 after:end-0 after:inline-block after:w-px after:h-3.5 after:bg-gray-300 after:rounded-full after:-translate-y-1/2 after:rotate-12 dark:text-neutral-200 dark:after:bg-neutral-700">
                <span className="text-gray-400 dark:text-neutral-500">
                  Dashboard
                </span>
              </li>
            </ul>
          </div>
          <div className="ms-auto flex items-center gap-x-2">
            <button
              type="button"
              disabled
              className="size-8 flex items-center justify-center text-gray-400 rounded-lg border border-gray-200 bg-gray-100 cursor-not-allowed dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-600"
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
            <div className="relative">
              <button
                type="button"
                className="size-8 flex items-center justify-center bg-gray-200 text-gray-700 text-sm rounded-full hover:bg-gray-300 focus:outline-hidden focus:bg-gray-300 dark:bg-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-600 dark:focus:bg-neutral-600"
              >
                A
              </button>
            </div>
          </div>
        </nav>
      </header>
    );
  }

  return (
    <header className="fixed top-0 inset-x-0 flex flex-wrap md:justify-start md:flex-nowrap z-60 w-full bg-zinc-100 text-sm py-2.5 dark:bg-neutral-900">
      <nav className="px-4 sm:px-5.5 flex basis-full items-center w-full mx-auto">
        <div className="w-full flex items-center gap-x-1.5">
          <ul className="flex items-center gap-1.5">
            <li className="inline-flex items-center relative text-gray-200 pe-1.5 last:pe-0 last:after:hidden after:absolute after:top-1/2 after:end-0 after:inline-block after:w-px after:h-3.5 after:bg-gray-300 after:rounded-full after:-translate-y-1/2 after:rotate-12 dark:text-neutral-200 dark:after:bg-neutral-700">
              <a
                href="#"
                className="flex items-center gap-x-1.5 text-gray-500 hover:text-gray-800 focus:outline-hidden focus:text-gray-800 dark:text-neutral-400 dark:hover:text-neutral-200 dark:focus:text-neutral-200"
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
                CMS
              </a>
            </li>
            <li className="inline-flex items-center relative text-gray-200 pe-1.5 last:pe-0 last:after:hidden after:absolute after:top-1/2 after:end-0 after:inline-block after:w-px after:h-3.5 after:bg-gray-300 after:rounded-full after:-translate-y-1/2 after:rotate-12 dark:text-neutral-200 dark:after:bg-neutral-700">
              <span className="text-gray-400 dark:text-neutral-500">
                Dashboard
              </span>
            </li>
          </ul>
        </div>

        <div className="ms-auto flex items-center gap-x-2">
          {/* テーマ切り替えボタン */}
          <button
            type="button"
            onClick={handleThemeToggle}
            className="size-8 flex items-center justify-center text-gray-500 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 focus:outline-hidden focus:bg-gray-100 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:focus:bg-neutral-700 transition-colors"
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

          <div className="relative">
            <button
              type="button"
              className="size-8 flex items-center justify-center bg-gray-200 text-gray-700 text-sm rounded-full hover:bg-gray-300 focus:outline-hidden focus:bg-gray-300 dark:bg-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-600 dark:focus:bg-neutral-600"
            >
              A
            </button>
          </div>
        </div>
      </nav>
    </header>
  );
}
