'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { Button } from '@stats47/components';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface HorizontalCardCarouselProps {
  ariaLabel: string;
  children: ReactNode;
  className?: string;
}

const SCROLL_EDGE_TOLERANCE = 2;
const NAVIGATION_BUTTON_CLASS =
  "absolute top-1/2 z-20 h-9 w-9 -translate-y-1/2 rounded-none bg-background shadow-sm transition-opacity after:absolute after:-inset-1.5 after:content-[''] sm:h-8 sm:w-8";

/**
 * ポータルカード共通の1行カルーセル。
 *
 * mobileは1枚+peek、smは2枚、lgは3枚、xlは4枚を表示する。
 * 左右矢印・keyboard・scroll snapを同じ実装へ集約し、セクションごとの差異を防ぐ。
 */
export function HorizontalCardCarousel({
  ariaLabel,
  children,
  className = '',
}: HorizontalCardCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const element = scrollRef.current;
    if (!element) return;
    setCanScrollLeft(element.scrollLeft > SCROLL_EDGE_TOLERANCE);
    setCanScrollRight(
      element.scrollLeft <
        element.scrollWidth - element.clientWidth - SCROLL_EDGE_TOLERANCE
    );
  }, []);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;
    updateScrollState();
    const resizeObserver = new ResizeObserver(updateScrollState);
    resizeObserver.observe(element);
    return () => resizeObserver.disconnect();
  }, [updateScrollState]);

  const scroll = useCallback((direction: 'left' | 'right') => {
    const element = scrollRef.current;
    const firstCard = element?.firstElementChild;
    if (!element || !(firstCard instanceof HTMLElement)) return;

    const gap = Number.parseFloat(getComputedStyle(element).columnGap) || 0;
    const cardStep = firstCard.getBoundingClientRect().width + gap;
    const visibleCards = Math.max(
      1,
      Math.round((element.clientWidth + gap) / cardStep)
    );
    const amount = cardStep * Math.max(1, visibleCards - 1);
    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    element.scrollBy({
      left: direction === 'left' ? -amount : amount,
      behavior: reduceMotion ? 'auto' : 'smooth',
    });
  }, []);

  return (
    <div className="relative">
      <div
        ref={scrollRef}
        role="region"
        aria-label={`${ariaLabel}（左右の矢印で移動できます）`}
        tabIndex={0}
        onScroll={updateScrollState}
        onKeyDown={(event) => {
          if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
          event.preventDefault();
          scroll(event.key === 'ArrowLeft' ? 'left' : 'right');
        }}
        className={`grid snap-x snap-mandatory grid-flow-col auto-cols-[85%] gap-3 overflow-x-auto overscroll-x-contain motion-safe:scroll-smooth [scrollbar-width:none] [&>*]:snap-start [&::-webkit-scrollbar]:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 sm:auto-cols-[calc((100%_-_0.75rem)/2)] lg:auto-cols-[calc((100%_-_1.5rem)/3)] xl:auto-cols-[calc((100%_-_2.25rem)/4)] ${className}`}
      >
        {children}
      </div>

      <Button
        type="button"
        variant="outline"
        size="icon"
        disabled={!canScrollLeft}
        aria-label={`${ariaLabel}を左へ`}
        aria-hidden={!canScrollLeft}
        tabIndex={canScrollLeft ? 0 : -1}
        onClick={() => scroll('left')}
        className={`${NAVIGATION_BUTTON_CLASS} -left-2 ${
          canScrollLeft ? 'opacity-100' : 'invisible opacity-0'
        }`}
      >
        <ChevronLeft className="size-4" aria-hidden="true" />
      </Button>

      <Button
        type="button"
        variant="outline"
        size="icon"
        disabled={!canScrollRight}
        aria-label={`${ariaLabel}を右へ`}
        aria-hidden={!canScrollRight}
        tabIndex={canScrollRight ? 0 : -1}
        onClick={() => scroll('right')}
        className={`${NAVIGATION_BUTTON_CLASS} -right-2 ${
          canScrollRight ? 'opacity-100' : 'invisible opacity-0'
        }`}
      >
        <ChevronRight className="size-4" aria-hidden="true" />
      </Button>
    </div>
  );
}
