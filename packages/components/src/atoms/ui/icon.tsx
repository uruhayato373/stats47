"use client";

import { icons, type LucideProps } from "lucide-react";
import { cn } from "../../lib/cn";

interface IconProps extends Omit<LucideProps, "name"> {
    /** アイコン名（Lucideのアイコン名または絵文字） */
    name: string | null | undefined;
}

/**
 * Lucide v0.400+ で変更されたアイコン名のマッピング
 */
const ICON_ALIASES: Record<string, string> = {
    Home: "House",
    PieChart: "ChartPie",
    LineChart: "ChartLine",
    BarChart: "ChartBar",
    AreaChart: "ChartArea",
};

/**
 * Lucideアイコン名または絵文字を動的にレンダリングするコンポーネント
 */
export function Icon({ name, className, ...props }: IconProps) {
    if (!name) return null;

    // 直接またはエイリアスでアイコンを取得
    const iconName = ICON_ALIASES[name] || name;
    const LucideIcon = (icons as any)[iconName];

    if (LucideIcon) {
        return <LucideIcon className={cn("h-4 w-4", className)} {...props} />;
    }

    // 絵文字としてレンダリング
    return (
        <span
            className={cn("text-xl leading-none inline-block", className)}
            role="img"
            aria-hidden="true"
        >
            {name}
        </span>
    );
}
