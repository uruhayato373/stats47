"use client";

export default function MetricsCard() {
  return (
    <div className="p-4 flex flex-col bg-white border-b border-gray-200 dark:bg-neutral-800 dark:border-neutral-700">
      <div className="pb-2 flex flex-wrap justify-between items-center gap-2 border-b border-dashed border-gray-200 dark:border-neutral-700">
        <h2 className="font-medium text-gray-800 dark:text-neutral-200">
          Analytics
        </h2>
        <select className="py-1.5 px-2.5 block text-sm border-gray-200 rounded-lg focus:border-indigo-500 focus:ring-indigo-500 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-400">
          <option>Last 30 days</option>
          <option>Last 7 days</option>
          <option>Last 24 hours</option>
        </select>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-2">
        <div className="flex flex-col">
          <span className="block font-medium text-xl text-gray-800 dark:text-neutral-200">
            22,900
          </span>
          <span className="flex justify-center items-center gap-x-1 text-sm text-green-600 dark:text-green-500">
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
              <polyline points="22,7 13.5,15.5 8.5,10.5 2,17" />
              <polyline points="16,7 22,7 22,13" />
            </svg>
            +12.5%
          </span>
        </div>

        <div className="flex flex-col">
          <span className="block font-medium text-xl text-gray-800 dark:text-neutral-200">
            8,430
          </span>
          <span className="flex justify-center items-center gap-x-1 text-sm text-red-600 dark:text-red-500">
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
              <polyline points="22,17 13.5,8.5 8.5,13.5 2,7" />
              <polyline points="16,17 22,17 22,11" />
            </svg>
            -2.1%
          </span>
        </div>
      </div>

      <div className="mt-4 h-64 bg-gray-100 rounded-lg flex items-center justify-center dark:bg-neutral-700">
        <span className="text-gray-500 dark:text-neutral-400">
          Chart Placeholder
        </span>
      </div>
    </div>
  );
}
