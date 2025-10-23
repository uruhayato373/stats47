import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/atoms/ui/sidebar";
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
    <Sidebar collapsible="none">
      <SidebarContent>
        {/* Home Section */}
        <SidebarGroup>
          <SidebarGroupLabel>Home</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.home.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <ActiveSidebarMenuButton href={item.href}>
                    <item.icon className="size-4" />
                    <span>{item.label}</span>
                  </ActiveSidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Categories Section */}
        <SidebarGroup>
          <SidebarGroupLabel>統計カテゴリー</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {categories.map((category) => (
                <SidebarMenuItem key={category.id}>
                  <ActiveSidebarMenuButton href={`/${category.id}`}>
                    {(() => {
                      const Icon = getCategoryIcon(category.icon);
                      return <Icon className="size-4" />;
                    })()}
                    <span>{category.name}</span>
                  </ActiveSidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
