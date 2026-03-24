"use client";

import { useCallback, useState } from "react";

import { useRouter } from "next/navigation";

import { Button } from "@stats47/components/atoms/ui/button";
import { Input } from "@stats47/components/atoms/ui/input";
import { Search } from "lucide-react";

export function HeroSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    // ランキング検索ページへ遷移（あるいは各機能へ振り分け）
    // 一旦ランキング検索パラメータとして渡す、あるいはランキング一覧のフィルタに渡す
    // ここではシンプルにランキング一覧ページの検索として扱う
    const searchParams = new URLSearchParams();
    searchParams.set("q", query);
    router.push(`/search?${searchParams.toString()}`);
  }, [query, router]);

  return (
    <div className="w-full max-w-2xl mx-auto relative z-10">
      <form onSubmit={handleSearch} role="search" className="relative flex items-center w-full">
        <div className="relative w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground h-5 w-5" />
            <Input 
                type="text" 
                placeholder="気になるキーワードで検索（例：年収、人口、焼肉）"
                className="w-full h-14 pl-12 pr-32 rounded-full text-lg shadow-md border-2 border-primary/20 focus:border-primary transition-all bg-background/90 backdrop-blur"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
            />
            <Button 
                type="submit" 
                className="absolute right-2 top-2 bottom-2 rounded-full px-6"
            >
                検索
            </Button>
        </div>
      </form>
      <div className="mt-4 flex flex-wrap justify-center gap-2 text-sm text-muted-foreground/80">
        <span>人気:</span>
        <Button variant="link" onClick={() => setQuery("人口")} aria-label="「人口」で検索" className="h-auto p-0 text-sm text-muted-foreground/80 underline decoration-dotted hover:text-primary">人口</Button>
        <Button variant="link" onClick={() => setQuery("平均年収")} aria-label="「平均年収」で検索" className="h-auto p-0 text-sm text-muted-foreground/80 underline decoration-dotted hover:text-primary">平均年収</Button>
        <Button variant="link" onClick={() => setQuery("コンビニ")} aria-label="「コンビニ」で検索" className="h-auto p-0 text-sm text-muted-foreground/80 underline decoration-dotted hover:text-primary">コンビニ</Button>
        <Button variant="link" onClick={() => setQuery("気温")} aria-label="「気温」で検索" className="h-auto p-0 text-sm text-muted-foreground/80 underline decoration-dotted hover:text-primary">気温</Button>
      </div>
    </div>
  );
}
