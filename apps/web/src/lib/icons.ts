import * as Icons from "lucide-react";

import type { LucideIcon } from "lucide-react";

/**
 * アイコン名からLucideアイコンコンポーネントを取得
 *
 * @param name - アイコン名（例: "Users", "Briefcase"）
 * @returns アイコンコンポーネント。見つからない場合はMapPin
 */
export function getIcon(name: string): LucideIcon {
  return (Icons[name as keyof typeof Icons] as LucideIcon) ?? Icons.MapPin;
}
