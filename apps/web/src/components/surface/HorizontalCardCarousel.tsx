'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type ReactNode,
  type RefObject,
} from 'react';

import { Button, cn } from '@stats47/components';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { SectionCard } from './SurfaceCard';

const SCROLL_EDGE_TOLERANCE = 2;

interface CarouselControlState {
  ariaLabel: string;
  canScrollLeft: boolean;
  canScrollRight: boolean;
  scroll: (direction: 'left' | 'right') => void;
}

interface CarouselRegistry {
  state: CarouselControlState | null;
  setState: (state: CarouselControlState | null) => void;
  /** カードの見出しの下に並べる (区切り線のセル)。HorizontalCardCarouselFrame だけが true にする */
  framed?: boolean;
}

const CarouselContext = createContext<CarouselRegistry | null>(null);

/**
 * カード列と、見出し行の右端に置く矢印をつなぐ <section>。
 * 矢印はカード列の上に別の行を作らず、SectionHeader の action に置く
 * (`<SectionHeader action={<HorizontalCardCarouselControls />} />`)。
 */
export function HorizontalCardCarouselSection({
  children,
  ...props
}: ComponentPropsWithoutRef<'section'>) {
  const [state, setState] = useState<CarouselControlState | null>(null);
  const value = useMemo(() => ({ state, setState }), [state]);
  return (
    <CarouselContext.Provider value={value}>
      <section {...props}>{children}</section>
    </CarouselContext.Provider>
  );
}

interface HorizontalCardCarouselFrameProps
  extends Omit<ComponentPropsWithoutRef<'section'>, 'title'> {
  title: ReactNode;
  /** 見出しの左のアイコン (lucide) */
  icon?: ReactNode;
  /** 見出し行の右端。矢印の右に置く一覧への導線 (SectionIndexLink) */
  action?: ReactNode;
  children: ReactNode;
}

/**
 * 題名をアイコン付きでカードの見出し (CardHeader) に置き、その下にカード列を並べる節。
 * テンプレートの KPI 行と同じく、列の各項目はカードを入れ子にせず区切り線のセルにする
 * (PORTAL_CARD_CELL_CLASS)。矢印は見出し行の右端に置く。
 * 名前を *Card にしないのは、これが外枠で、中の項目 (FeaturedRankingCard 等) が枠を持たないセルになるため
 * (カードを入れ子にしない)。
 */
export function HorizontalCardCarouselFrame({
  title,
  icon,
  action,
  children,
  className,
  ...props
}: HorizontalCardCarouselFrameProps) {
  const [state, setState] = useState<CarouselControlState | null>(null);
  const value = useMemo(() => ({ state, setState, framed: true }), [state]);
  return (
    <CarouselContext.Provider value={value}>
      <SectionCard
        title={title}
        icon={icon}
        headingAs="h2"
        headerAction={
          <>
            <HorizontalCardCarouselControls />
            {action}
          </>
        }
        className={className}
        // セルは自分の p-4 を持つので、本文の余白を外す (縁から中身まで 16px・見出しのアイコンと同じ左端)
        bodyClassName="px-0 py-0"
        {...props}
      >
        {children}
      </SectionCard>
    </CarouselContext.Provider>
  );
}

/**
 * 見出し行の右端に置く左右矢印。横に動かせないとき (全カードが見えている広い画面) は描かない。
 * 矢印はカードに重ねない (1 位の値を隠し、タップがカードのリンクへ抜ける。2026-09-23 週次 UI 検査)。
 */
export function HorizontalCardCarouselControls() {
  const state = useContext(CarouselContext)?.state;
  if (!state || (!state.canScrollLeft && !state.canScrollRight)) return null;
  const { ariaLabel, canScrollLeft, canScrollRight, scroll } = state;
  return (
    <div className="flex items-center gap-1">
      <Button
        type="button"
        variant="outline"
        size="icon"
        disabled={!canScrollLeft}
        aria-label={`${ariaLabel}を左へ`}
        onClick={() => scroll('left')}
      >
        <ChevronLeft aria-hidden="true" />
      </Button>
      <Button
        type="button"
        variant="outline"
        size="icon"
        disabled={!canScrollRight}
        aria-label={`${ariaLabel}を右へ`}
        onClick={() => scroll('right')}
      >
        <ChevronRight aria-hidden="true" />
      </Button>
    </div>
  );
}

function scrollByVisibleCards(
  scrollRef: RefObject<HTMLDivElement | null>,
  direction: 'left' | 'right'
) {
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
}

interface HorizontalCardCarouselProps {
  ariaLabel: string;
  children: ReactNode;
  className?: string;
}

/**
 * ポータルカード共通の1行カルーセル。
 *
 * mobileは1枚+peek、smは2枚、lgは3枚、xlは4枚を表示する。
 * keyboard・scroll snap をここへ集約し、矢印は HorizontalCardCarouselSection の中の
 * HorizontalCardCarouselControls (見出し行の右端) が描く。
 */
export function HorizontalCardCarousel({
  ariaLabel,
  children,
  className,
}: HorizontalCardCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const context = useContext(CarouselContext);
  const setControlState = context?.setState;
  const framed = context?.framed ?? false;
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

  const scroll = useCallback(
    (direction: 'left' | 'right') => scrollByVisibleCards(scrollRef, direction),
    []
  );

  useEffect(() => {
    if (!setControlState) return;
    setControlState({ ariaLabel, canScrollLeft, canScrollRight, scroll });
  }, [setControlState, ariaLabel, canScrollLeft, canScrollRight, scroll]);

  useEffect(() => {
    if (!setControlState) return;
    return () => setControlState(null);
  }, [setControlState]);

  return (
    <div
      ref={scrollRef}
      role="region"
      aria-label={`${ariaLabel}（左右の矢印で移動できます）`}
      tabIndex={0}
      data-carousel={framed ? 'cells' : 'cards'}
      onScroll={updateScrollState}
      onKeyDown={(event) => {
        if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
        event.preventDefault();
        scroll(event.key === 'ArrowLeft' ? 'left' : 'right');
      }}
      className={cn(
        'grid snap-x snap-mandatory grid-flow-col overflow-x-auto overscroll-x-contain motion-safe:scroll-smooth scrollbar-none *:snap-start [&::-webkit-scrollbar]:hidden focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary',
        framed
          ? // カードの見出しの下: 隙間なしで区切り線 (テンプレートの KPI 行)。区切り線は divide-x が
            // 最後のセル以外の右に引く。本文の横余白を外してあるので、線はカードの上下の線まで届く。
            // -mr-px で列を 1px だけカードの線の下へ伸ばし、右端に見えているセルの区切り線を外枠の線に重ねる
            // (外枠の内側に線が 2 本並ばない。カードの overflow-hidden がはみ出した 1px を切る)
            '-mr-px auto-cols-[85%] divide-x divide-border sm:auto-cols-[50%] lg:auto-cols-[calc(100%/3)] xl:auto-cols-[25%]'
          : 'auto-cols-[85%] gap-3 sm:auto-cols-[calc((100%_-_0.75rem)/2)] lg:auto-cols-[calc((100%_-_1.5rem)/3)] xl:auto-cols-[calc((100%_-_2.25rem)/4)]',
        className
      )}
    >
      {children}
    </div>
  );
}
