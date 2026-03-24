"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import { cn } from "@stats47/components";

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  /** アニメーション遅延（ms） */
  delay?: number;
}

/**
 * IntersectionObserver でビューポートに入ったときにフェードインするラッパー
 */
export function ScrollReveal({ children, className, delay = 0 }: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn(
        "opacity-0 translate-y-2",
        isVisible && "animate-fade-in",
        className
      )}
      style={delay > 0 ? { animationDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
