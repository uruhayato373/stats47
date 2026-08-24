"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface ScrollableRowProps {
  children: ReactNode;
  /** スクロール領域に足すクラス (snap 等) */
  className?: string;
  /** overlay は矢印を左右余白として確保せず、必要な時だけ内容上へ重ねる */
  controlsMode?: "inline" | "overlay";
}

/**
 * 横スクロール + 左右シェブロンのシェル。
 *
 * はみ出したときだけ矢印をフェードインし、スクロール位置に応じて出し分ける。
 * 中身を問わないので「タブ列」「KPI タイル列」のどちらにも使える
 * (元は ScrollableTabsList の内部実装だったものを 2026-08-05 に切り出した)。
 */
export function ScrollableRow({
  children,
  className,
  controlsMode = "inline",
}: ScrollableRowProps) {
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
    <div className={controlsMode === "overlay" ? "relative" : "flex items-center gap-1"}>
      <button
        type="button"
        onClick={() => scroll("left")}
        disabled={!canScrollLeft}
        className={`${
          controlsMode === "overlay"
            ? "absolute left-1 top-1/2 z-10 -translate-y-1/2 shadow-sm"
            : "shrink-0"
        } flex h-7 w-7 items-center justify-center rounded-md border border-border bg-background transition-opacity ${canScrollLeft ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        aria-label="左にスクロール"
      >
        <ChevronLeft className="h-3.5 w-3.5 text-muted-foreground" />
      </button>

      <div
        ref={scrollRef}
        className={`overflow-x-auto scrollbar-none min-w-0 ${controlsMode === "overlay" ? "w-full" : ""} ${className ?? ""}`}
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {children}
      </div>

      <button
        type="button"
        onClick={() => scroll("right")}
        disabled={!canScrollRight}
        className={`${
          controlsMode === "overlay"
            ? "absolute right-1 top-1/2 z-10 -translate-y-1/2 shadow-sm"
            : "shrink-0"
        } flex h-7 w-7 items-center justify-center rounded-md border border-border bg-background transition-opacity ${canScrollRight ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        aria-label="右にスクロール"
      >
        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
      </button>
    </div>
  );
}
