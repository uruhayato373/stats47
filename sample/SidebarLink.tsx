import Link from "next/link";

import { CategoryIcon } from "@/components/atoms/CategoryIcon";

import type { NavigationItem } from "@/lib/navigation/sidebar-config";
import { cn } from "@/lib/utils";

interface SidebarLinkProps extends NavigationItem {
  isActive: boolean;
  iconName?: string; // CategoryIcon用のアイコン名
}

/**
 * サイドバーのリンクアイテムコンポーネント
 * 
 * アクティブ/非アクティブ状態に応じてスタイルが切り替わります。
 * shadcn/uiのテーマトークンを使用して一貫性のあるデザインを提供します。
 */
export function SidebarLink({ 
  href, 
  label, 
  icon: Icon, 
  isActive, 
  iconName 
}: SidebarLinkProps) {
  return (
    <li>
      <Link
        href={href}
        className={cn(
          "w-full flex items-center gap-x-2 py-2 px-2.5 text-sm rounded-lg transition-colors",
          isActive
            ? "text-foreground bg-accent"
            : "text-muted-foreground hover:bg-accent hover:text-foreground focus:outline-hidden focus:bg-accent focus:text-foreground"
        )}
      >
        {iconName ? (
          <CategoryIcon iconName={iconName} className="size-3.5" />
        ) : Icon ? (
          <Icon className="size-3.5" />
        ) : null}
        <span>{label}</span>
      </Link>
    </li>
  );
}
