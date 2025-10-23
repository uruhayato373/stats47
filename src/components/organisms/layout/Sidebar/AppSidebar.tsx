import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
} from "@/components/atoms/ui/sidebar";
import { useSidebarNavigation } from "@/hooks/useSidebarNavigation";
import { CategoryIcon } from "@/components/atoms/CategoryIcon";
import Link from "next/link";

/**
 * 通常ページ用サイドバー
 * ホーム、統計カテゴリーを表示
 */
export function AppSidebar() {
  const { navigationItems, categories, isActiveLink } = useSidebarNavigation();

  return (
    <Sidebar>
      <SidebarHeader className="border-b px-6 py-3">
        <h2 className="text-lg font-semibold">統計で見る都道府県</h2>
      </SidebarHeader>
      
      <SidebarContent>
        {/* Home Section */}
        <SidebarGroup>
          <SidebarGroupLabel>Home</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.home.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={isActiveLink(item.href)}>
                    <Link href={item.href}>
                      <item.icon className="size-4" />
                      <span>{item.label}</span>
                    </Link>
                  </SidebarMenuButton>
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
                  <SidebarMenuButton asChild isActive={isActiveLink(category.href)}>
                    <Link href={category.href}>
                      <CategoryIcon iconName={category.icon} className="size-4" />
                      <span>{category.name}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
