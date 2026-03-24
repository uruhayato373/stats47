import { type LucideIcon } from "lucide-react";

/**
 * 管理画面ページ情報の型定義
 */
export interface AdminPageInfo {
  href: string;
  icon: LucideIcon;
  title: string;
  description: string;
  iconBgColor: string;
  iconTextColor: string;
  group?: string;
}
