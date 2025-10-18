"use client";

export default function TopAuthors() {
  const authors = [
    {
      id: 1,
      name: "John Doe",
      avatar: "JD",
      posts: 23,
      views: "45.2k",
      engagement: 92,
    },
    {
      id: 2,
      name: "Jane Smith",
      avatar: "JS",
      posts: 18,
      views: "38.7k",
      engagement: 88,
    },
    {
      id: 3,
      name: "Mike Johnson",
      avatar: "MJ",
      posts: 15,
      views: "29.1k",
      engagement: 85,
    },
  ];

  return (
    <div className="relative z-1 bg-white dark:bg-neutral-800">
      <div className="p-4 pb-0">
        <div className="pb-2 flex flex-wrap justify-between items-center gap-2 border-b border-dashed border-gray-200 dark:border-neutral-700">
          <h2 className="font-medium text-sm text-gray-800 dark:text-neutral-200">
            Top authors
          </h2>
          <button className="text-xs text-gray-500 dark:text-neutral-400 hover:text-gray-800 dark:hover:text-neutral-200">
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
              <p className="font-medium text-sm text-gray-800 dark:text-neutral-200 truncate">
                {author.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-neutral-400">
                {author.posts} posts • {author.views} views
              </p>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-16 bg-gray-200 rounded-full h-1.5 dark:bg-neutral-700">
                <div
                  className="bg-indigo-600 h-1.5 rounded-full"
                  style={{ width: `${author.engagement}%` }}
                ></div>
              </div>
              <span className="text-xs text-gray-500 dark:text-neutral-400">
                {author.engagement}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
