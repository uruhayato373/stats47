import type { ComponentType } from "react";

import { HOME_PORTAL_CATEGORIES } from "@stats47/data-configs";
import {
  GraduationCap,
  HeartPulse,
  Home,
  PieChart,
  Plane,
  ShieldCheck,
  TrendingUp,
  Users,
} from "lucide-react";

import { PortalNavCard } from "./PortalNavCard";

/** curated 8 カテゴリ用の lucide アイコン (categoryKey → icon)。 */
const CATEGORY_ICONS: Record<string, ComponentType<{ className?: string }>> = {
  population: Users,
  laborwage: TrendingUp,
  economy: PieChart,
  construction: Home,
  socialsecurity: HeartPulse,
  educationsports: GraduationCap,
  tourism: Plane,
  safetyenvironment: ShieldCheck,
};

/**
 * 「カテゴリから探す」= 代表 8 カテゴリの比較しやすい grid (mobile 2列 / md+ 4列)。
 * 全体比較する項目なので横 scroll にせず grid にする (仕様 §8.3)。
 */
export function PortalCategoryGrid() {
  const items = [...HOME_PORTAL_CATEGORIES].sort((a, b) => a.order - b.order);
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {items.map((c) => {
        const Icon = CATEGORY_ICONS[c.categoryKey];
        return (
          <PortalNavCard
            key={c.categoryKey}
            href={`/category/${c.categoryKey}`}
            label={c.label}
            icon={Icon ? <Icon className="h-5 w-5" /> : undefined}
            surface="home_category"
          />
        );
      })}
    </div>
  );
}
