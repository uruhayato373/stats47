"use client";

import { useEffect, useRef, useState } from "react";

import { List } from "lucide-react";

import { RailCard } from "@/components/surface";

export interface RailTocHeading {
  id: string;
  text: string;
}

/** 追従する広告と同じヘッダーの下の位置 (右レールの広告の枠の sticky top-14 = ヘッダーの高さ) */
const STICKY_TOP_PX = 56;
/** 右レールのまとまりの間 (余白なし・線で区切る。2026-11-25) */
const RAIL_GAP_PX = 0;
/** 今読んでいる節と見なす、画面の上からの距離 (ヘッダーの下に少し余裕を足す) */
const ACTIVE_LINE_PX = 120;
/** これより見出しが多い記事は、今読んでいる節の前後だけを出す (高さを抑えて広告と一緒に画面に収める) */
const MAX_ITEMS = 7;

/**
 * 右レールで追従する目次 (2026-11-23 オーナー指示)。
 *
 * 右レールの中身は本文より短く、下の 3 分の 1 ほどは最後の追従する広告 (300×600) だけが見えていた。
 * 本文の上の目次は読み進めると見えなくなるので、広告のすぐ下に目次を追従させ、今読んでいる節を強調する。
 *
 * - 置き場所は右レールの最後 (追従する広告の直後)。止める位置は直前の追従する広告の実際の高さから決める
 *   (広告の枠と、その置き方の契約 (広告の枠の台帳 data/ads/placements.json) は変えない)
 * - 画面の高さが足りず、広告と目次が一緒に収まらないときは出さない (追従した目次が画面の外にはみ出さないように)
 * - 9-25 に目次をレールの上に追従させたときは、読書中ずっとほかのレールの情報を隠していた。
 *   今回はレールの中身を全部通り過ぎた後でだけ見える位置に置く
 * - 項目は h2 だけ。導線名 `blog_toc_rail` で本文の上の目次 (`blog_toc`) と分けて数える
 */
export function RailArticleToc({ headings }: { headings: RailTocHeading[] }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [top, setTop] = useState(STICKY_TOP_PX);
  const [fits, setFits] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const previous = box.previousElementSibling as HTMLElement | null;
    const place = () => {
      const stickyAbove =
        previous && previous.offsetParent !== null && getComputedStyle(previous).position === "sticky"
          ? previous.offsetHeight + RAIL_GAP_PX
          : 0;
      const nextTop = STICKY_TOP_PX + stickyAbove;
      setTop(nextTop);
      setFits(nextTop + box.offsetHeight <= window.innerHeight);
    };
    place();
    const observer = new ResizeObserver(place);
    observer.observe(box);
    if (previous) observer.observe(previous);
    window.addEventListener("resize", place);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", place);
    };
  }, []);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      let current = 0;
      headings.forEach((heading, index) => {
        const element = document.getElementById(heading.id);
        if (element && element.getBoundingClientRect().top <= ACTIVE_LINE_PX) current = index;
      });
      setActiveIndex(current);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [headings]);

  if (headings.length < 2) return null;
  const start = Math.min(Math.max(0, activeIndex - Math.floor(MAX_ITEMS / 2)), Math.max(0, headings.length - MAX_ITEMS));
  const shown = headings.slice(start, start + MAX_ITEMS);

  return (
    <div
      ref={boxRef}
      className="sticky hidden rail:block"
      style={{ top, visibility: fits ? "visible" : "hidden" }}
      aria-hidden={fits ? undefined : true}
    >
      <RailCard title="目次" icon={<List className="h-4 w-4" aria-hidden="true" />}>
        <nav aria-label="記事の目次 (追従)" data-nav-surface="blog_toc_rail">
          <ol className="space-y-1.5 text-sm">
            {shown.map((heading, offset) => {
              const isActive = start + offset === activeIndex;
              return (
                <li key={heading.id}>
                  <a
                    href={`#${heading.id}`}
                    data-nav-label={heading.text}
                    aria-current={isActive ? "location" : undefined}
                    tabIndex={fits ? undefined : -1}
                    className={
                      "line-clamp-2 leading-snug underline-offset-4 transition-colors hover:text-foreground hover:underline " +
                      (isActive ? "font-medium text-foreground" : "text-muted-foreground")
                    }
                  >
                    {heading.text}
                  </a>
                </li>
              );
            })}
          </ol>
        </nav>
      </RailCard>
    </div>
  );
}
