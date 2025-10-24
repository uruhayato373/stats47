import { getSidebarNavigationItems } from "@/lib/navigation/sidebar-config";
import { listCategories } from "@/lib/taxonomy/category";
import { getCategoryIcon } from "@/lib/utils/get-category-icon";
import { ActiveSidebarMenuButton } from "./ActiveSidebarMenuButton";

/**
 * 通常ページ用サイドバー（サーバーコンポーネント）
 * ホーム、統計カテゴリーを表示
 */
export function AppSidebar() {
  const categories = listCategories();
  const navigationItems = getSidebarNavigationItems();

  return (
    <div className="w-64 h-full bg-sidebar border-r border-border flex flex-col">
      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Home Section */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">
            Home
          </h3>
          <div className="space-y-1">
            {navigationItems.home.map((item) => (
              <ActiveSidebarMenuButton key={item.href} href={item.href}>
                <item.icon className="size-4" />
                <span>{item.label}</span>
              </ActiveSidebarMenuButton>
            ))}
          </div>
        </div>

        <div className="border-t border-border my-4" />

        {/* Categories Section */}
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">
            統計カテゴリー
          </h3>
          <div className="space-y-1">
            {categories.map((category) => (
              <ActiveSidebarMenuButton
                key={category.id}
                href={`/${category.id}`}
              >
                {(() => {
                  const Icon = getCategoryIcon(category.icon ?? "");
                  return <Icon className="size-4" />;
                })()}
                <span>{category.name}</span>
              </ActiveSidebarMenuButton>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
