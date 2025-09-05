'use client';

import { useStyles } from "@/hooks/useStyles";

export default function TopPosts() {
  const styles = useStyles();

  const posts = [
    {
      id: 1,
      title: "10 Essential React Patterns Every Developer Should Know",
      image: "/api/placeholder/300/200",
      author: "John Doe",
      date: "2024-01-15",
      views: "12.5k",
      comments: 45
    },
    {
      id: 2,
      title: "Building Scalable Web Applications with Next.js",
      image: "/api/placeholder/300/200",
      author: "Jane Smith",
      date: "2024-01-14",
      views: "8.9k",
      comments: 32
    },
    {
      id: 3,
      title: "The Future of Web Development: Trends for 2024",
      image: "/api/placeholder/300/200",
      author: "Mike Johnson",
      date: "2024-01-13",
      views: "6.2k",
      comments: 28
    }
  ];

  return (
    <div className="p-4 flex flex-col bg-white dark:bg-neutral-800">
      <div className="pb-2 flex flex-wrap justify-between items-center gap-2 border-b border-dashed border-gray-200 dark:border-neutral-700">
        <h2 className="font-medium text-gray-800 dark:text-neutral-200">Top posts</h2>
        <button className="py-1.5 px-2.5 flex items-center justify-center gap-x-1.5 border border-gray-200 text-gray-800 text-[13px] rounded-lg hover:bg-gray-50 focus:outline-hidden focus:bg-gray-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:focus:bg-neutral-700">
          <svg className="size-3" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
            <path d="M21 3v5h-5"/>
            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
            <path d="M8 16H3v5"/>
          </svg>
          Refresh
        </button>
      </div>

      <div className="mt-4 space-y-4">
        {posts.map((post) => (
          <div key={post.id} className="flex gap-4">
            <div className="w-16 h-16 bg-gray-200 rounded-lg flex-shrink-0 dark:bg-neutral-700"></div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm text-gray-800 line-clamp-2 dark:text-neutral-200">
                {post.title}
              </h3>
              <div className={`mt-1 flex items-center gap-2 text-xs ${styles.text.tertiary}`}>
                <span>{post.author}</span>
                <span>•</span>
                <span>{post.date}</span>
              </div>
              <div className={`mt-2 flex items-center gap-4 text-xs ${styles.text.tertiary}`}>
                <span className="flex items-center gap-1">
                  <svg className="size-3" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                  {post.views}
                </span>
                <span className="flex items-center gap-1">
                  <svg className="size-3" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>
                  </svg>
                  {post.comments}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}