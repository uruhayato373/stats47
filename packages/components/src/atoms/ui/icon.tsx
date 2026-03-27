"use client";

import { useEffect, useState, type ComponentType } from "react";
import type { LucideProps } from "lucide-react";
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
 *
 * icons マップ (679KB) を動的インポートで遅延読み込みする。
 */
export function Icon({ name, className, ...props }: IconProps) {
    const [LucideIcon, setLucideIcon] = useState<ComponentType<LucideProps> | null>(null);

    const iconName = name ? (ICON_ALIASES[name] || name) : null;

    useEffect(() => {
        if (!iconName) return;

        let cancelled = false;
        import("lucide-react").then((mod) => {
            if (cancelled) return;
            const icon = (mod.icons as Record<string, ComponentType<LucideProps>>)[iconName];
            if (icon) setLucideIcon(() => icon);
        });
        return () => { cancelled = true; };
    }, [iconName]);

    if (!name) return null;

    if (LucideIcon) {
        return <LucideIcon className={cn("h-4 w-4", className)} {...props} />;
    }

    // フォールバック: 絵文字 or ローディング中のプレースホルダー
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
