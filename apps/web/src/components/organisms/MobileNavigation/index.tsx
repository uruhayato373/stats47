"use client";

import {
    Home,
    Search,
    TrendingUp,
    type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@stats47/components";

type NavItem = {
    label: string;
    href: string;
    icon: LucideIcon;
    activePattern: RegExp;
};

const NAV_ITEMS: NavItem[] = [
    {
        label: "ホーム",
        href: "/",
        icon: Home,
        activePattern: /^\/$/,
    },
    {
        label: "ランキング",
        href: "/ranking",
        icon: TrendingUp,
        activePattern: /^\/ranking/,
    },
    {
        label: "検索",
        href: "/search",
        icon: Search,
        activePattern: /^\/search/,
    },
];

export function MobileNavigation() {
    const pathname = usePathname();

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-t border-border pb-safe lg:hidden">
            <div className="flex items-center justify-around h-16 px-2">
                {NAV_ITEMS.map((item) => {
                    const isActive = item.activePattern.test(pathname || "");
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center justify-center flex-1 h-full gap-1 active:scale-95 transition-transform duration-100 touch-manipulation",
                                isActive
                                    ? "text-primary"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <item.icon
                                className={cn("h-6 w-6", isActive && "fill-current/20")}
                                strokeWidth={isActive ? 2.5 : 2}
                            />
                            <span className="text-[10px] font-medium leading-none">
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
