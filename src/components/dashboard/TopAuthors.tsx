'use client';

import { useStyles } from "@/hooks/useStyles";

export default function TopAuthors() {
  const styles = useStyles();

  const authors = [
    {
      id: 1,
      name: "John Doe",
      avatar: "JD",
      posts: 23,
      views: "45.2k",
      engagement: 92
    },
    {
      id: 2,
      name: "Jane Smith",
      avatar: "JS",
      posts: 18,
      views: "38.7k",
      engagement: 88
    },
    {
      id: 3,
      name: "Mike Johnson",
      avatar: "MJ",
      posts: 15,
      views: "29.1k",
      engagement: 85
    }
  ];

  return (
    <div className="relative z-1 bg-white dark:bg-neutral-800">
      <div className="p-4 pb-0">
        <div className="pb-2 flex flex-wrap justify-between items-center gap-2 border-b border-dashed border-gray-200 dark:border-neutral-700">
          <h2 className="font-medium text-sm text-gray-800 dark:text-neutral-200">Top authors</h2>
          <button className={`text-xs ${styles.text.tertiary} hover:text-gray-800 dark:hover:text-neutral-200`}>
            View all
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {authors.map((author) => (
          <div key={author.id} className="flex items-center gap-3">
            <div className="size-8 bg-indigo-600 text-white text-xs font-medium rounded-full flex items-center justify-center">
              {author.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center">
                <span className="font-medium text-sm text-gray-800 dark:text-neutral-200">
                  {author.name}
                </span>
                <span className={`text-xs ${styles.text.tertiary}`}>
                  {author.posts} posts
                </span>
              </div>
              <div className="mt-1 flex justify-between items-center">
                <span className={`text-xs ${styles.text.tertiary}`}>
                  {author.views} views
                </span>
                <span className="text-xs text-green-600 dark:text-green-500">
                  {author.engagement}%
                </span>
              </div>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-1 dark:bg-neutral-700">
                <div
                  className="bg-indigo-600 h-1 rounded-full"
                  style={{ width: `${author.engagement}%` }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 pt-0">
        <div className="pt-2 border-t border-dashed border-gray-200 dark:border-neutral-700">
          <div className="flex items-center justify-between">
            <span className={`text-xs ${styles.text.tertiary}`}>
              Content quality score
            </span>
            <span className="text-sm font-medium text-gray-800 dark:text-neutral-200">
              8.9/10
            </span>
          </div>
          <div className="mt-2 relative size-16 mx-auto">
            <div className="absolute inset-0 bg-gray-200 rounded-full dark:bg-neutral-700"></div>
            <div className="absolute inset-0 bg-green-500 rounded-full" style={{ 
              background: `conic-gradient(#10b981 ${89 * 3.6}deg, #e5e7eb ${89 * 3.6}deg)`,
              borderRadius: '50%'
            }}></div>
            <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center dark:bg-neutral-800">
              <span className="text-xs font-medium text-gray-800 dark:text-neutral-200">89%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}