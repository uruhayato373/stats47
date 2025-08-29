import Header from "../components/layout/Header";
import Sidebar from "../components/layout/Sidebar";
import MetricsCard from "../components/dashboard/MetricsCard";
import TopPosts from "../components/dashboard/TopPosts";
import TopAuthors from "../components/dashboard/TopAuthors";

export default function Dashboard() {
  return (
    <>
      <Header />
      <Sidebar />

      {/* メインコンテンツエリア */}
      <main className="lg:ps-60 transition-all duration-300 pt-13 px-3 pb-3 min-h-screen">
        <div className="h-[calc(100dvh-62px)] lg:h-full overflow-hidden flex flex-col bg-white border border-gray-200 shadow-xs rounded-lg dark:bg-neutral-800 dark:border-neutral-700">
          <div className="py-3 px-4 flex flex-wrap justify-between items-center gap-2 bg-white border-b border-gray-200 dark:bg-neutral-800 dark:border-neutral-700">
            <h1 className="font-medium text-lg text-gray-800 dark:text-neutral-200">
              Dashboard
            </h1>
            <div className="flex items-center gap-x-2">
              <button
                type="button"
                className="py-1.5 px-2.5 inline-flex items-center gap-x-1.5 text-xs font-medium rounded-lg border border-gray-200 bg-white text-gray-800 shadow-xs hover:bg-gray-50 focus:outline-hidden focus:bg-gray-50 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:focus:bg-neutral-700"
              >
                <svg
                  className="size-3"
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
                  <path d="M3 12a9 9 0 0 1 9-9 9.75 9 0 0 1 6.74 2.74L21 8" />
                  <path d="M21 3v5h-5" />
                  <path d="M21 12a9 9 0 0 1-9 9 9.75 9 0 0 1-6.74-2.74L3 16" />
                  <path d="M8 16H3v5" />
                </svg>
                Refresh
              </button>
              <button
                type="button"
                className="py-1.5 px-2.5 inline-flex items-center gap-x-1.5 text-xs font-medium rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 focus:outline-hidden focus:bg-indigo-600"
              >
                <svg
                  className="size-3"
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
                Add
              </button>
            </div>
          </div>

          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
            <div className="flex-1 flex flex-col overflow-hidden">
              <MetricsCard />
              <TopPosts />
            </div>

            <div className="flex-shrink-0">
              <div className="lg:w-80 h-full border-s border-gray-200 dark:border-neutral-700">
                <TopAuthors />
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
