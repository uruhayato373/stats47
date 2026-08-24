"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

import { useRouter } from "next/navigation";

import { cn } from "@stats47/components";
import { Input } from "@stats47/components/atoms/ui/input";

import { trackNavClick } from "@/lib/analytics/events";

import { matchPrefectures } from "../utils";

import type { Prefecture } from "@stats47/area";

const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

interface AreaSearchProps {
  prefectures: readonly Prefecture[];
  className?: string;
}

/**
 * 都道府県名の検索コンボボックス（アクセシブルな最小 combobox パターン）。
 *
 * `@stats47/components` に Command/Popover/Combobox が無いため、input + listbox で
 * WAI-ARIA combobox（aria-expanded / aria-controls / aria-activedescendant / role=option）
 * を実装する。「東京」「東京都」いずれも東京都に一致（suffix 省略）。キーボード（↑↓/Enter/Esc）
 * で候補選択、0 件時は明示メッセージ。選択で県ページへ router 遷移し、計測は既存 nav_click
 * （surface=areas_search）を使う。analytics 失敗で遷移を止めない。
 */
export function AreaSearch({ prefectures, className }: AreaSearchProps) {
  const router = useRouter();
  const inputId = useId();
  const labelId = useId();
  const listboxId = useId();
  const listRef = useRef<HTMLUListElement>(null);

  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const results = useMemo(
    () => matchPrefectures(query, prefectures),
    [query, prefectures],
  );

  const hasQuery = query.trim() !== "";
  const showPopup = isOpen && hasQuery;
  const showListbox = showPopup && results.length > 0;
  const showEmpty = showPopup && results.length === 0;

  const optionId = (i: number) => `${listboxId}-opt-${i}`;
  const activeDescendant =
    showListbox && activeIndex >= 0 ? optionId(activeIndex) : undefined;

  // アクティブ候補をスクロール表示（キーボード操作時）
  useEffect(() => {
    if (activeIndex < 0 || !listRef.current) return;
    const el = listRef.current.querySelector(
      `[data-option-index="${activeIndex}"]`,
    );
    el?.scrollIntoView?.({ block: "nearest" });
  }, [activeIndex]);

  function navigateTo(pref: Prefecture) {
    try {
      trackNavClick({
        label: pref.prefName,
        href: `/areas/${pref.prefCode}`,
        surface: "areas_search",
      });
    } catch {
      // analytics 失敗で遷移を止めない
    }
    setIsOpen(false);
    router.push(`/areas/${pref.prefCode}`);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!showPopup) {
        setIsOpen(true);
        return;
      }
      if (!showListbox) return;
      setActiveIndex((i) => Math.min((i < 0 ? -1 : i) + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      if (!showListbox) return;
      e.preventDefault();
      setActiveIndex((i) => Math.max((i < 0 ? 0 : i) - 1, 0));
    } else if (e.key === "Enter") {
      if (!showListbox) return;
      e.preventDefault();
      const pref = activeIndex >= 0 ? results[activeIndex] : results[0];
      if (pref) navigateTo(pref);
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setActiveIndex(-1);
    }
  }

  return (
    <div className={cn("relative", className)}>
      <label
        id={labelId}
        htmlFor={inputId}
        className="mb-1.5 block text-sm font-medium text-foreground"
      >
        都道府県名を検索
      </label>
      <Input
        id={inputId}
        type="text"
        role="combobox"
        aria-expanded={showListbox}
        aria-controls={showListbox ? listboxId : undefined}
        aria-autocomplete="list"
        aria-activedescendant={activeDescendant}
        autoComplete="off"
        value={query}
        placeholder="例：東京都"
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(e.target.value.trim() !== "");
          setActiveIndex(-1);
        }}
        onFocus={() => {
          if (query.trim() !== "") setIsOpen(true);
        }}
        onBlur={() => setIsOpen(false)}
        onKeyDown={handleKeyDown}
      />

      {showListbox && (
        <ul
          ref={listRef}
          id={listboxId}
          role="listbox"
          aria-label="都道府県の検索候補"
          className="absolute z-20 mt-1 max-h-72 w-full overflow-y-auto rounded-none border border-border bg-card shadow-md"
        >
          {results.map((pref, i) => (
            <li
              key={pref.prefCode}
              id={optionId(i)}
              role="option"
              aria-selected={i === activeIndex}
              // activedescendant パターンのため tab 順には入れない (-1)。
              // キーボード操作は input の onKeyDown が担うが、option 自身にも
              // Enter/Space のフォールバックを持たせる (a11y 静的ガード準拠 + 防御的)。
              tabIndex={-1}
              data-option-index={i}
              onMouseDown={(e) => e.preventDefault()}
              onMouseEnter={() => setActiveIndex(i)}
              onClick={() => navigateTo(pref)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  navigateTo(pref);
                }
              }}
              className={cn(
                "flex min-h-11 cursor-pointer items-center px-3 text-sm text-foreground",
                i === activeIndex && "bg-muted",
                FOCUS_RING,
              )}
            >
              {pref.prefName}
            </li>
          ))}
        </ul>
      )}

      {showEmpty && (
        <div
          role="status"
          className="absolute z-20 mt-1 w-full rounded-none border border-border bg-card px-3 py-2 text-sm text-muted-foreground shadow-md"
        >
          該当する都道府県がありません
        </div>
      )}
    </div>
  );
}
