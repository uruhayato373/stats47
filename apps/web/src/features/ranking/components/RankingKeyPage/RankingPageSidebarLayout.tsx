"use client";

import type { ReactNode } from "react";

import {
    AdSenseAd,
    RANKING_PAGE_TABLE_SIDE,
} from "@/lib/google-adsense";

interface RankingPageSidebarLayoutProps {
    sidebar?: ReactNode;
}

export function RankingPageDesktopSidebar({
    sidebar,
}: RankingPageSidebarLayoutProps) {
    if (!sidebar) {
        return null;
    }

    return (
        <aside className="hidden lg:flex lg:flex-col lg:gap-4 lg:w-[300px] lg:shrink-0 lg:sticky lg:top-20 lg:max-h-[calc(100vh-5.5rem)] lg:overflow-y-auto">
            <div className="flex flex-col gap-4">
                {sidebar}
                <AdSenseAd
                    format={RANKING_PAGE_TABLE_SIDE.format}
                    slotId={RANKING_PAGE_TABLE_SIDE.slotId}
                />
            </div>
        </aside>
    );
}

export function RankingPageMobileSidebar({
    sidebar,
}: RankingPageSidebarLayoutProps) {
    if (!sidebar) {
        return null;
    }

    return (
        <div className="mt-4 flex flex-col gap-4 lg:hidden">
            {sidebar}
        </div>
    );
}
