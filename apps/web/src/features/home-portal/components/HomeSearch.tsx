"use client";

import { useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { cn } from "@stats47/components";
import { Button } from "@stats47/components/atoms/ui/button";
import { Input } from "@stats47/components/atoms/ui/input";
import { Search } from "lucide-react";

import { trackSearch } from "@/lib/analytics/events";

const CHIP =
  "inline-flex min-h-8 items-center rounded-none border border-border bg-card px-2.5 text-sm text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

interface HomeSearchProps {
  terms: readonly string[];
  className?: string;
}

/**
 * home 冒頭のサイト横断検索入口 (home 内フィルタではない・仕様 §7)。
 * submit で `/search?q=<encoded>` へ遷移。空 submit は無視、Enter 対応、既存 trackSearch を送る
 * (analytics 失敗で遷移を止めない)。人気キーワードは SSR link で `/search?q=` へ。
 */
export function HomeSearch({ terms, className }: HomeSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = query.trim();
    if (q === "") return;
    try {
      trackSearch({ searchTerm: q });
    } catch {
      // analytics 失敗で遷移を止めない
    }
    router.push(`/search?q=${encodeURIComponent(q)}`);
  }

  return (
    <div className={cn("w-full", className)}>
      <form role="search" onSubmit={onSubmit} className="flex gap-2">
        <label htmlFor="home-search" className="sr-only">
          統計・ランキングを検索
        </label>
        <Input
          id="home-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="人口、年収、出生率、東京都などを検索"
          autoComplete="off"
          className="h-12 flex-1 text-base"
        />
        <Button type="submit" aria-label="検索する" className="h-12 min-w-12 px-4">
          <Search className="h-5 w-5" />
        </Button>
      </form>

      {terms.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">人気の検索</span>
          {terms.map((t) => (
            <Link key={t} href={`/search?q=${encodeURIComponent(t)}`} className={CHIP}>
              {t}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
