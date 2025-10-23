import { SidebarLink } from "./SidebarLink";
import type { NavigationItem } from "@/lib/navigation/sidebar-config";

interface SidebarSectionProps {
  title: string;
  items: NavigationItem[];
  isActiveLink: (href: string) => boolean;
  iconName?: string; // CategoryIcon用のアイコン名（カテゴリセクション用）
}

/**
 * サイドバーのセクションコンポーネント
 * 
 * セクションタイトルとナビゲーションアイテムのリストを表示します。
 * 各セクション（Home、e-STAT API、統計カテゴリー）で共通して使用されます。
 */
export function SidebarSection({ 
  title, 
  items, 
  isActiveLink,
  iconName 
}: SidebarSectionProps) {
  return (
    <div className="pt-3 mt-3 flex flex-col border-t border-border">
      <span className="block ps-2.5 mb-2 font-medium text-xs uppercase text-muted-foreground">
        {title}
      </span>
      <ul className="flex flex-col gap-y-1">
        {items.map((item) => (
          <SidebarLink
            key={item.href}
            {...item}
            isActive={isActiveLink(item.href)}
            iconName={iconName}
          />
        ))}
      </ul>
    </div>
  );
}
