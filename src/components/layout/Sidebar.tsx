"use client";

export default function Sidebar() {
  return (
    <div
      id="sidebar"
      className="w-60 fixed inset-y-0 z-50 start-0 bg-gray-100 border-e border-gray-200 lg:block lg:translate-x-0 -translate-x-full transition-all duration-300 dark:bg-neutral-900 dark:border-neutral-700 light:bg-gray-50 light:border-gray-200"
      style={{ top: "52px" }} // ヘッダーの高さ分下げる
    >
      <nav className="p-3 size-full flex flex-col overflow-y-auto">
        <button
          type="button"
          className="p-1.5 ps-2.5 w-full inline-flex items-center gap-x-2 text-sm font-medium rounded-lg bg-white border border-gray-200 text-gray-800 shadow-xs hover:bg-gray-50 focus:outline-hidden focus:bg-gray-50 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:focus:bg-neutral-700 light:bg-white light:border-gray-200 light:text-gray-800 light:hover:bg-gray-50 light:focus:bg-gray-50"
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
          Quick actions
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

        <div className="pt-3 mt-3 flex flex-col border-t border-gray-200 dark:border-neutral-700 light:border-gray-200">
          <span className="block ps-2.5 mb-2 font-medium text-xs uppercase text-gray-800 dark:text-neutral-200 light:text-gray-800">
            Home
          </span>
          <ul className="flex flex-col gap-y-1">
            <li>
              <a
                className="w-full flex items-center gap-x-2 py-2 px-2.5 text-sm text-gray-800 bg-gray-200 rounded-lg hover:bg-gray-200 focus:outline-hidden focus:bg-gray-200 dark:bg-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:focus:bg-neutral-700 light:bg-gray-200 light:text-gray-800 light:hover:bg-gray-200 light:focus:bg-gray-200"
                href="/"
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
                  <rect width="7" height="9" x="3" y="3" rx="1" />
                  <rect width="7" height="5" x="14" y="3" rx="1" />
                  <rect width="7" height="9" x="14" y="12" rx="1" />
                  <rect width="7" height="5" x="3" y="16" rx="1" />
                </svg>
                Dashboard
              </a>
            </li>
          </ul>
        </div>

        <div className="pt-3 mt-3 flex flex-col border-t border-gray-200 dark:border-neutral-700 light:border-gray-200">
          <span className="block ps-2.5 mb-2 font-medium text-xs uppercase text-gray-800 dark:text-neutral-200 light:text-gray-800">
            Pages
          </span>
          <ul className="flex flex-col gap-y-1">
            <li>
              <a
                className="w-full flex items-center gap-x-2 py-2 px-2.5 text-sm text-gray-500 rounded-lg hover:bg-gray-200 hover:text-gray-800 focus:outline-hidden focus:bg-gray-200 focus:text-gray-800 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-neutral-300 dark:focus:bg-neutral-700 dark:focus:text-neutral-300 light:text-gray-500 light:hover:bg-gray-200 light:hover:text-gray-800 light:focus:bg-gray-200 light:focus:text-gray-800"
                href="#"
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
                  <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
                  <circle cx="12" cy="13" r="3" />
                </svg>
                Posts
              </a>
            </li>
            <li>
              <a
                className="w-full flex items-center gap-x-2 py-2 px-2.5 text-sm text-gray-500 rounded-lg hover:bg-gray-200 hover:text-gray-800 focus:outline-hidden focus:bg-gray-200 focus:text-gray-800 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-neutral-300 dark:focus:bg-neutral-700 dark:focus:text-neutral-300 light:text-gray-500 light:hover:bg-gray-200 light:hover:text-gray-800 light:focus:bg-gray-200 light:focus:text-gray-800"
                href="#"
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
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                Members
              </a>
            </li>
          </ul>
        </div>

        <div className="pt-3 mt-3 flex flex-col border-t border-gray-200 dark:border-neutral-700 light:border-gray-200">
          <span className="block ps-2.5 mb-2 font-medium text-xs uppercase text-gray-800 dark:text-neutral-200 light:text-gray-800">
            Posts
          </span>
          <ul className="flex flex-col gap-y-1">
            <li>
              <a
                className="w-full flex items-center gap-x-2 py-2 px-2.5 text-sm text-gray-500 rounded-lg hover:bg-gray-200 hover:text-gray-800 focus:outline-hidden focus:bg-gray-200 focus:text-gray-800 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-neutral-300 dark:focus:bg-neutral-700 dark:focus:text-neutral-300 light:text-gray-500 light:hover:bg-gray-200 light:hover:text-gray-800 light:focus:bg-gray-200 light:focus:text-gray-800"
                href="#"
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
                  <path d="M5 12h14" />
                  <path d="M12 5v14" />
                </svg>
                Create Post
              </a>
            </li>
            <li>
              <a
                className="w-full flex items-center gap-x-2 py-2 px-2.5 text-sm text-gray-500 rounded-lg hover:bg-gray-200 hover:text-gray-800 focus:outline-hidden focus:bg-gray-200 focus:text-gray-800 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-neutral-300 dark:focus:bg-neutral-700 dark:focus:text-neutral-300 light:text-gray-500 light:hover:bg-gray-200 light:hover:text-gray-800 light:focus:bg-gray-200 light:focus:text-gray-800"
                href="#"
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
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14,2 14,8 20,8" />
                </svg>
                Draft
                <span className="ms-auto inline-block py-0.5 px-1.5 rounded-full text-xs font-medium bg-gray-800 text-white dark:bg-neutral-200 dark:text-neutral-800 light:bg-gray-800 light:text-white">
                  23
                </span>
              </a>
            </li>
            <li>
              <a
                className="w-full flex items-center gap-x-2 py-2 px-2.5 text-sm text-gray-500 rounded-lg hover:bg-gray-200 hover:text-gray-800 focus:outline-hidden focus:bg-gray-200 focus:text-gray-800 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-neutral-300 dark:focus:bg-neutral-700 dark:focus:text-neutral-300 light:text-gray-500 light:hover:bg-gray-200 light:hover:text-gray-800 light:focus:bg-gray-200 light:focus:text-gray-800"
                href="#"
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
                  <polyline points="16 18 22 12 16 6" />
                  <polyline points="8 6 2 12 8 18" />
                </svg>
                Published
                <span className="ms-auto inline-block py-0.5 px-1.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-500 light:bg-green-100 light:text-green-800">
                  102
                </span>
              </a>
            </li>
          </ul>
        </div>

        <div className="pt-3 mt-3 flex flex-col border-t border-gray-200 dark:border-neutral-700 light:border-gray-200">
          <span className="block ps-2.5 mb-2 font-medium text-xs uppercase text-gray-800 dark:text-neutral-200 light:text-gray-800">
            e-STAT API
          </span>
          <ul className="flex flex-col gap-y-1">
            <li>
              <a
                className="w-full flex items-center gap-x-2 py-2 px-2.5 text-sm text-gray-500 rounded-lg hover:bg-gray-200 hover:text-gray-800 focus:outline-hidden focus:bg-gray-200 focus:text-gray-800 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-neutral-300 dark:focus:bg-neutral-700 dark:focus:text-neutral-300 light:text-gray-500 light:hover:bg-gray-200 light:hover:text-gray-800 light:focus:bg-gray-200 light:focus:text-gray-800"
                href="/estat/metadata"
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
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14,2 14,8 20,8" />
                  <path d="m15 15-3-3 3-3" />
                  <path d="M4 12h10" />
                </svg>
                メタ情報
              </a>
            </li>
            <li>
              <a
                className="w-full flex items-center gap-x-2 py-2 px-2.5 text-sm text-gray-500 rounded-lg hover:bg-gray-200 hover:text-gray-800 focus:outline-hidden focus:bg-gray-200 focus:text-gray-800 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-neutral-300 dark:focus:bg-neutral-700 dark:focus:text-neutral-300 light:text-gray-500 light:hover:bg-gray-200 light:hover:text-gray-800 light:focus:bg-gray-200 light:focus:text-gray-800"
                href="/estat/response"
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
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                レスポンス情報
              </a>
            </li>
          </ul>
        </div>

        <div className="pt-3 mt-3 flex flex-col border-t border-gray-200 dark:border-neutral-700 light:border-gray-200">
          <span className="block ps-2.5 mb-2 font-medium text-xs uppercase text-gray-800 dark:text-neutral-200 light:text-gray-800">
            Others
          </span>
          <ul className="flex flex-col gap-y-1">
            <li>
              <a
                className="w-full flex items-center gap-x-2 py-2 px-2.5 text-sm text-gray-500 rounded-lg hover:bg-gray-200 hover:text-gray-800 focus:outline-hidden focus:bg-gray-200 focus:text-gray-800 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-neutral-300 dark:focus:bg-neutral-700 dark:focus:text-neutral-300 light:text-gray-500 light:hover:bg-gray-200 light:hover:text-gray-800 light:focus:bg-gray-200 light:focus:text-gray-800"
                href="#"
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
                  <path d="M12 2v20m8-10H4" />
                </svg>
                What&apos;s new?
                <span className="ms-auto inline-block size-2 bg-indigo-500 rounded-full"></span>
              </a>
            </li>
            <li>
              <a
                className="w-full flex items-center gap-x-2 py-2 px-2.5 text-sm text-gray-500 rounded-lg hover:bg-gray-200 hover:text-gray-800 focus:outline-hidden focus:bg-gray-200 focus:text-gray-800 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-neutral-300 dark:focus:bg-neutral-700 dark:focus:text-neutral-300 light:text-gray-500 light:hover:bg-gray-200 light:hover:text-gray-800 light:focus:bg-gray-200 light:focus:text-gray-800"
                href="#"
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
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                  <path d="M12 17h.01" />
                </svg>
                Help & support
              </a>
            </li>
            <li>
              <a
                className="w-full flex items-center gap-x-2 py-2 px-2.5 text-sm text-gray-500 rounded-lg hover:bg-gray-200 hover:text-gray-800 focus:outline-hidden focus:bg-gray-200 focus:text-gray-800 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:hover:text-neutral-300 dark:focus:bg-neutral-700 dark:focus:text-neutral-300 light:text-gray-500 light:hover:bg-gray-200 light:hover:text-gray-800 light:focus:bg-gray-200 light:focus:text-gray-800"
                href="#"
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
                  <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
                </svg>
                Knowledge Base
              </a>
            </li>
          </ul>
        </div>
      </nav>
    </div>
  );
}
