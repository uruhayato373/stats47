"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { TabsList, TabsTrigger } from "@stats47/components/atoms/ui/tabs";

import type { TabIndicatorConfig } from "../types";

interface ScrollableTabsListProps {
  tabs: TabIndicatorConfig[];
}

/**
 * 左右スクロールボタン付きタブリスト
 *
 * タブが多くてはみ出す場合にのみ矢印ボタンを表示。
 * スクロール位置に応じて左右のボタンをフェードイン/アウト。
 */
export function ScrollableTabsList({ tabs }: ScrollableTabsListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 2);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 2);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener("scroll", updateScrollState, { passive: true });
    const ro = new ResizeObserver(updateScrollState);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", updateScrollState);
      ro.disconnect();
    };
  }, [updateScrollState]);

  const scroll = useCallback((direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.6;
    el.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  }, []);

  return (
    <div className="flex items-center gap-1">
      {/* 左スクロールボタン */}
      <button
        type="button"
        onClick={() => scroll("left")}
        className={`shrink-0 flex items-center justify-center h-7 w-7 rounded-md border border-border bg-background transition-opacity ${canScrollLeft ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        aria-label="左にスクロール"
      >
        <ChevronLeft className="h-3.5 w-3.5 text-muted-foreground" />
      </button>

      {/* スクロール可能なタブ領域 */}
      <div
        ref={scrollRef}
        className="overflow-x-auto scrollbar-none min-w-0"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        <TabsList className="inline-flex w-max h-8">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.rankingKey}
              value={tab.rankingKey}
              className="text-[11px] sm:text-xs whitespace-nowrap px-2 py-1 data-[state=active]:border data-[state=active]:border-primary/40 data-[state=active]:font-bold"
            >
              {tab.tabLabel}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      {/* 右スクロールボタン */}
      <button
        type="button"
        onClick={() => scroll("right")}
        className={`shrink-0 flex items-center justify-center h-7 w-7 rounded-md border border-border bg-background transition-opacity ${canScrollRight ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        aria-label="右にスクロール"
      >
        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
      </button>
    </div>
  );
}
