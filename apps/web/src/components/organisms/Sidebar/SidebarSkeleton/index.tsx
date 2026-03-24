/**
 * サイドバースケルトンコンポーネント
 *
 * Suspenseのfallback用のローディング表示コンポーネントです。
 * 既存のサイドバーデザインに合わせたスケルトンUIを提供します。
 */

export function SidebarSkeleton() {
  return (
    <div className="w-60 h-full bg-sidebar border-r border-border flex flex-col">
      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Home Section */}
        <div className="mb-6">
          <div className="h-4 w-20 bg-muted animate-pulse rounded mb-2" />
          <div className="h-8 w-full bg-muted animate-pulse rounded" />
        </div>

        <div className="border-t border-border my-4" />

        {/* Categories Section */}
        <div>
          <div className="h-4 w-24 bg-muted animate-pulse rounded mb-2" />
          <div className="space-y-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-8 w-full bg-muted animate-pulse rounded"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

