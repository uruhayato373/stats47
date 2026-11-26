"use client";

import { useEffect, useRef, useState } from "react";

import { Building2 } from "lucide-react";

import Link from "@/components/atoms/SiteLink";
import { LinkRowFrame, linkRowItemClass } from "@/components/navigation/StatisticsScopeNav";
import { RailCard, RailLinkList, railNavRowClassName } from "@/components/surface";

export interface SurveyMinistryNavItem {
  /** 節の id (ページ内リンクの先) */
  id: string;
  label: string;
  count: number;
}

/** ヘッダー (56px) とモバイルのチップ (44px) の下に節の頭が来たら、その節を「今いる府省庁」とする */
const ACTIVE_LINE_PX = 120;

/**
 * 節の上端 (画面の上からの距離) の並びから、今いる節を選ぶ。
 * 上端が基準の線より上にある節のうち最後のもの。まだどの節にも入っていなければ先頭。
 */
export function selectActiveSection(sectionTops: readonly number[], activeLine = ACTIVE_LINE_PX): number {
  let active = 0;
  sectionTops.forEach((top, index) => {
    if (top <= activeLine) active = index;
  });
  return active;
}

function useActiveSection(ids: readonly string[]): string | undefined {
  const [activeId, setActiveId] = useState(ids[0]);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const tops = ids.map((id) => document.getElementById(id)?.getBoundingClientRect().top ?? Number.POSITIVE_INFINITY);
      setActiveId(ids[selectActiveSection(tops)]);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [ids]);
  return activeId;
}

/**
 * 調査一覧 (/survey) の「府省庁から探す」(2026-11-26 オーナー決定)。今いる府省庁を強調するので、
 * 本文の府省庁の見出しは画面に出さない (読み上げ用の見出しとジャンプ先は残す)。
 * - rail: 右レールに追従する一覧 (右レールが本文の横にある幅)
 * - chips: ヘッダーの下に追従する横に送れる列 (右レールが本文の下に回る幅)。今いる府省庁を見える位置へ送る
 */
export function SurveyMinistryNav({
  items,
  variant,
}: {
  items: readonly SurveyMinistryNavItem[];
  variant: "rail" | "chips";
}) {
  const ids = items.map((item) => item.id);
  const [stableIds] = useState(ids);
  const activeId = useActiveSection(stableIds);
  const chipRefs = useRef(new Map<string, HTMLAnchorElement>());

  useEffect(() => {
    if (variant !== "chips" || !activeId) return;
    const chip = chipRefs.current.get(activeId);
    // チップ → 並び (LINK_ROW_LIST_CLASS) → 横に送れる容器 (LINK_ROW_SCROLL_CLASS)
    const scroller = chip?.parentElement?.parentElement;
    if (!chip || !scroller) return;
    const left = chip.offsetLeft - 16;
    if (left < scroller.scrollLeft || chip.offsetLeft + chip.offsetWidth > scroller.scrollLeft + scroller.clientWidth)
      scroller.scrollTo({ left, behavior: "smooth" });
  }, [activeId, variant]);

  if (variant === "rail") {
    return (
      <RailCard title="府省庁から探す" icon={<Building2 />}>
        <RailLinkList aria-label="府省庁から探す">
          {items.map((item) => {
            const active = item.id === activeId;
            return (
              <Link
                key={item.id}
                href={`#${item.id}`}
                aria-current={active ? "true" : undefined}
                className={railNavRowClassName({ active })}
              >
                <span className="min-w-0 flex-1 truncate">{item.label}</span>
                <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{item.count}</span>
              </Link>
            );
          })}
        </RailLinkList>
      </RailCard>
    );
  }

  return (
    <LinkRowFrame label="府省庁から探す">
      {items.map((item) => {
        const active = item.id === activeId;
        return (
          <Link
            key={item.id}
            ref={(node: HTMLAnchorElement | null) => {
              if (node) chipRefs.current.set(item.id, node);
              else chipRefs.current.delete(item.id);
            }}
            href={`#${item.id}`}
            aria-current={active ? "true" : undefined}
            data-slot="button"
            className={linkRowItemClass(active)}
          >
            {item.label} {item.count}
          </Link>
        );
      })}
    </LinkRowFrame>
  );
}
