"use client";

export default function TopPosts() {
  const posts = [
    {
      id: 1,
      title: "10 Essential React Patterns Every Developer Should Know",
      image: "/api/placeholder/300/200",
      author: "John Doe",
      date: "2024-01-15",
      views: "12.5k",
      comments: 45,
    },
    {
      id: 2,
      title: "Building Scalable Web Applications with Next.js",
      image: "/api/placeholder/300/200",
      author: "Jane Smith",
      date: "2024-01-14",
      views: "8.9k",
      comments: 32,
    },
    {
      id: 3,
      title: "The Future of Web Development: Trends for 2024",
      image: "/api/placeholder/300/200",
      author: "Mike Johnson",
      date: "2024-01-13",
      views: "6.2k",
      comments: 28,
    },
  ];

  return (
    <div className="p-4 flex flex-col bg-white dark:bg-neutral-800">
      <div className="pb-2 flex flex-wrap justify-between items-center gap-2 border-b border-dashed border-border">
        <h2 className="font-medium text-gray-800 dark:text-neutral-200">
          Top posts
        </h2>
        <button className="py-1.5 px-2.5 flex items-center justify-center gap-x-1.5 border border-border text-foreground text-[13px] rounded-lg hover:bg-muted focus:outline-hidden focus:bg-muted">
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
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
            <path d="M21 3v5h-5" />
            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
            <path d="M8 16H3v5" />
          </svg>
          Refresh
        </button>
      </div>

      <div className="mt-4 space-y-4">
        {posts.map((post) => (
          <div key={post.id} className="flex gap-3">
            <div className="flex-shrink-0">
              <img
                src={post.image}
                alt={post.title}
                className="w-16 h-12 object-cover rounded-lg"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm text-gray-800 dark:text-neutral-200 line-clamp-2">
                {post.title}
              </h3>
              <div className="mt-1 flex items-center gap-2 text-xs text-gray-500 dark:text-neutral-400">
                <span>{post.author}</span>
                <span>•</span>
                <span>{post.date}</span>
              </div>
              <div className="mt-2 flex items-center gap-4 text-xs text-gray-500 dark:text-neutral-400">
                <span>{post.views} views</span>
                <span>{post.comments} comments</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
